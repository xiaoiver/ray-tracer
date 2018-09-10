import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import Shader from './Shader';
import SERVICE_IDENTIFIER from '../constants/services';
import { IShaderSnippet } from './ShaderSnippet';
import { ICameraService } from '../services/Camera';
import { ICanvasService } from '../services/Canvas';
import { ISceneService } from '../services/Scene';
import ShadowShader from './ShadowShader';

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
    this.lightSnippets = [];
    this.shadowSnippets = [];
    this.scene.lights.forEach(light => {
      light.generateSnippets();
      this.lightSnippets.push(light.lightSnippet);
      this.shadowSnippets.push(light.shadowSnippet);
    });

    let vertexShader = `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;
      uniform mat4 u_MvpMatrix;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_NormalMatrix;
      
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      
      ${this.shadowSnippets.map(s => s.vertex.declaration).join('')}
      void main() {
        ${this.shadowSnippets.map(s => s.vertex.calculation).join('')}
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = vec3(u_NormalMatrix * a_Normal);
        v_Color = a_Color;
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;

    const shadowEffect = this.shadowSnippets.filter(s => !!s.fragment.result).map(s => s.fragment.result).join('*') || '1.0';

    let fragmentShader = `
      precision mediump float;
      #define PI 3.141592653589793
      uniform vec3 u_CameraPosition;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec4 v_Color;
      ${this.shadowSnippets.map(s => s.fragment.declaration).join('')}
      ${this.lightSnippets.map(s => s.fragment.declaration).join('')}

      float attenuation(vec3 dir, float constant, float linear, float quadratic){
        float distance = length(dir);
        float radiance = 1.0 / (constant + distance * linear + pow(distance, 2.0) * quadratic);
        return clamp(radiance, 0.0, 1.0);
      }

      ${ShadowShader.functions}

      void main() {
        vec3 normal = normalize(v_Normal);
        ${this.shadowSnippets.map(s => s.fragment.calculation).join('')}
        ${this.lightSnippets.map(s => s.fragment.calculation).join('')}
        gl_FragColor = vec4(
          (${shadowEffect}) *
          (${this.lightSnippets.filter(s => !!s.fragment.result).map(s => s.fragment.result).join('+')}), v_Color.a);
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

    // Setup camera uniforms
    this.setUniforms({
      'u_CameraPosition': this.camera.eye
    });

    let vpMatrix = this.camera.transform;

    // Draw every mesh in current scene
    this.scene.meshes.forEach(mesh => {
      let {vertices, colors, normals, modelMatrix} = mesh.geometry;
      let mvpMatrix = vpMatrix.x(modelMatrix);
      let normalMatrix = modelMatrix.inverse().transpose();

      // Setup uniforms relative to current model
      this.setUniforms({
        'u_MvpMatrix': mvpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_NormalMatrix': normalMatrix
      });

      // Setup lights
      this.scene.lights.forEach(light => {
        light.setUniforms(this);
        this.setUniforms({
          [`u_MvpMatrixFromLight${light.index}`]: mesh.mvpMatrixFromLight[light.index]
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