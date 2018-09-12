import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import SERVICE_IDENTIFIER from '../constants/services';
import { IShaderSnippet } from './ShaderSnippet';
import { ICameraService } from '../services/Camera';
import { ICanvasService } from '../services/Canvas';
import { ISceneService } from '../services/Scene';
import Shader from './Shader';
import ShadowShader from './ShadowShader';
import PointLight from '../light/PointLight';
import ShadowLight from '../light/ShadowLight';

@injectable()
export default class DisplayShader extends Shader {
  lightSnippets: Array<IShaderSnippet> = [];
  shadowSnippets: Array<IShaderSnippet> = [];

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService
  ) {
    super(canvas, scene, camera);
  }

  generateShaders() {
    let vertexShadowDeclarations = '';
    let vertexShadowCalculations = '';
    let fragmentDisplayDeclarations = '';
    let fragmentDisplayCalculations = '';
    let fragmentShadowDeclarations = '';
    let fragmentShadowCalculations = '';
    let fragmentShadowResults = '1.0';

    const lightsInfo = this.scene.getLightsInfo();
    Object.keys(lightsInfo).forEach(type => {
      const {lights, varName, declaration} = lightsInfo[type];
      // Calculate shadow map for every light
      lights.forEach((light, i) => {
        if (light instanceof ShadowLight) {
          light.calculateShadow();
          vertexShadowDeclarations += light.shadowSnippet.vertex.declaration;
          vertexShadowCalculations += light.shadowSnippet.vertex.calculation;
          fragmentShadowDeclarations += light.shadowSnippet.fragment.declaration;
          fragmentShadowCalculations += light.shadowSnippet.fragment.calculation;
          fragmentShadowResults += '*' + light.shadowSnippet.fragment.result;
        }
      });

      fragmentDisplayDeclarations += `
        ${declaration}
        uniform ${type} ${varName}s[${lights.length}];
      `;
      // Calculate lights
      fragmentDisplayCalculations += `
        for(int i = 0; i < ${lights.length}; i++) {
          result += calc${type}(${varName}s[i], normal, v_Position, viewDir);
        }
      `;
    });

    const vertexShader = `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;
      uniform mat4 u_MvpMatrix;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_NormalMatrix;
      
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      
      ${vertexShadowDeclarations}
      void main() {
        ${vertexShadowCalculations}
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = vec3(u_NormalMatrix * a_Normal);
        v_Color = a_Color;
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      #define PI 3.141592653589793
      uniform vec3 u_CameraPosition;
      uniform float u_Diffuse;
      uniform float u_Specular;
      uniform float u_Shininess;

      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec4 v_Color;

      float attenuation(vec3 dir, float constant, float linear, float quadratic){
        float distance = length(dir);
        float radiance = 1.0 / (constant + distance * linear + pow(distance, 2.0) * quadratic);
        return clamp(radiance, 0.0, 1.0);
      }
      ${fragmentDisplayDeclarations}
      ${fragmentShadowDeclarations}

      ${ShadowShader.functions}

      void main() {
        vec3 normal = normalize(v_Normal);
        vec3 viewDir = normalize(u_CameraPosition - v_Position);

        // final lights result
        vec3 result = vec3(0.0);

        // calculate shadow effect
        ${fragmentShadowCalculations}

        // calculate lights
        ${fragmentDisplayCalculations}
        gl_FragColor = vec4((${fragmentShadowResults}) * result, v_Color.a);
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw() {
    const gl = this.gl;
    const {width, height} = this.canvas.getSize();
    
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    // gl.cullFace(gl.BACK);

    // Setup camera uniforms
    this.setUniforms({
      'u_CameraPosition': this.camera.eye
    });

    // Draw every mesh in current scene
    this.scene.meshes.forEach(mesh => {
      const {vertices, colors, normals, modelMatrix} = mesh.geometry;
      const {diffuse, specular, shininess} = mesh.material;

      const mvpMatrix = this.camera.transform.x(modelMatrix);
      const normalMatrix = modelMatrix.inverse().transpose();

      // Setup uniforms relative to current model
      this.setUniforms({
        'u_MvpMatrix': mvpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_NormalMatrix': normalMatrix,
        'u_Diffuse': diffuse,
        'u_Specular': specular,
        'u_Shininess': shininess
      });

      // Setup lights
      const lightsInfo = this.scene.getLightsInfo();
      Object.keys(lightsInfo).forEach(type => {
        const {lights, varName} = lightsInfo[type];
        lights.forEach((light, i) => {
          light.setUniforms(this, `${varName}s[${i}]`);

          this.setUniforms({
            [`u_MvpMatrixFromLight${light.index}`]: mesh.mvpMatrixFromLight[light.index]
          });
        });
      });

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Color', colors, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Normal', normals, 3, gl.FLOAT)) return -1;

      mesh.geometry.draw(gl);
    });
  }
}