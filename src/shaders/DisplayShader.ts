import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import SERVICE_IDENTIFIER from '../constants/services';
import { IShaderSnippet } from './ShaderSnippet';
import { ICameraService } from '../services/Camera';
import { ICanvasService } from '../services/Canvas';
import { ISceneService } from '../services/Scene';
import Shader from './Shader';
import { IShadow } from '../light/shadows/Shadow';
import HighPrecision from '../light/shadows/HighPrecision';
import ShadowShader, { ShadowMode } from './ShadowShader';
import PointLight from '../light/PointLight';
import ShadowLight from '../light/ShadowLight';
import Texture from '../texture/Texture';
import { LightMatrixMap } from '../Mesh';
import { DEFAULT_TEXTURE_ID } from '../constants';
import { setVertexAttribute, setUniforms } from '../utils/gl';
import LowPrecision from '../light/shadows/LowPrecision';
import Lerp from '../light/shadows/Lerp';
import PCF from '../light/shadows/PCF';
import PCFLerp from '../light/shadows/PCFLerp';
import PoissonDisk from '../light/shadows/PoissonDisk';
import StratifiedPoissonDisk from '../light/shadows/StratifiedPoissonDisk';
import RotatedPoissonDisk from '../light/shadows/RotatedPoissonDisk';

let defaultTextureCreated = false;

@injectable()
export default class DisplayShader extends Shader {
  shadow: IShadow = new HighPrecision();

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService
  ) {
    super(canvas, scene, camera);
  }

  initShadow() {
    if (ShadowShader.mode === ShadowMode.LowPrecision) {
      this.shadow = new LowPrecision();
    } else if (ShadowShader.mode === ShadowMode.HighPrecision) {
      this.shadow = new HighPrecision();
    } else if (ShadowShader.mode === ShadowMode.Lerp) {
      this.shadow = new Lerp();
    } else if (ShadowShader.mode === ShadowMode.PCF) {
      this.shadow = new PCF();
    } else if (ShadowShader.mode === ShadowMode.PCFLerp) {
      this.shadow = new PCFLerp();
    } else if (ShadowShader.mode === ShadowMode.PoissonDisk) {
      this.shadow = new PoissonDisk();
    } else if (ShadowShader.mode === ShadowMode.StratifiedPoissonDisk) {
      this.shadow = new StratifiedPoissonDisk();
    } else if (ShadowShader.mode === ShadowMode.RotatedPoissonDisk) {
      this.shadow = new RotatedPoissonDisk();
    }
  }

  generateShaders() {
    this.initShadow();

    let vertexShadowDeclarations = '';
    let vertexShadowCalculations = '';
    let fragmentShadowDeclarations = '';
    let fragmentShadowCalculations = '';

    let fragmentDisplayDeclarations = '';
    let fragmentDisplayCalculations = '';

    fragmentShadowDeclarations += this.shadow.getDeclarationInFragment();
    
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
          fragmentDisplayCalculations += `result += calc${type}(${varName}s[${i}], normal, v_Position, viewDir, u_ShadowMap${light.index}, v_PositionFromLight${light.index});`;
        } else {
          fragmentDisplayCalculations += `
          for(int i = 0; i < ${lights.length}; i++) {
            result += calc${type}(${varName}s[i], normal, v_Position, viewDir);
          }
        `;
        }
      });

      fragmentDisplayDeclarations += `
        ${declaration}
        uniform ${type} ${varName}s[${lights.length}];
      `;
    });

    const vertexShader = `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;
      attribute vec2 a_TextureCoord;

      uniform mat4 u_MvpMatrix;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_NormalMatrix;
      
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec2 v_TextureCoord;
      
      ${vertexShadowDeclarations}
      void main() {
        ${vertexShadowCalculations}
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = vec3(u_NormalMatrix * a_Normal);
        v_Color = a_Color;
        v_TextureCoord = a_TextureCoord;
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
      uniform sampler2D u_MaterialTexture;

      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec4 v_Color;
      varying vec2 v_TextureCoord;

      float attenuation(vec3 dir, float constant, float linear, float quadratic){
        float distance = length(dir);
        float radiance = 1.0 / (constant + distance * linear + pow(distance, 2.0) * quadratic);
        return clamp(radiance, 0.0, 1.0);
      }

      ${fragmentShadowDeclarations}
      ${fragmentDisplayDeclarations}

      void main() {
        vec3 normal = normalize(v_Normal);
        vec3 viewDir = normalize(u_CameraPosition - v_Position);
        vec3 result = vec3(0.0);

        // calculate lights
        ${fragmentDisplayCalculations}

        vec4 color = texture2D(u_MaterialTexture, v_TextureCoord) + v_Color;
        gl_FragColor = vec4(result * color.rgb, color.a);
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  setupTexture(texture: Texture, textureCoords: Float32Array) {
    const {gl, program} = this;
    // https://stackoverflow.com/questions/35151452/check-if-webgl-texture-is-loaded-in-fragment-shader
    if (!defaultTextureCreated) {
      const defaultTexture = gl.createTexture();
      gl.activeTexture((<any> gl)[`TEXTURE${DEFAULT_TEXTURE_ID}`]);
      gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      defaultTextureCreated = true;
    }

    const location = this.gl.getUniformLocation(program, 'u_MaterialTexture');
    this.gl.uniform1i(location, texture && texture.id || DEFAULT_TEXTURE_ID);
    if (!setVertexAttribute(gl, program, 'a_TextureCoord', textureCoords, 2, gl.FLOAT)) return -1;
  }

  setupLights(mvpMatrixFromLight: LightMatrixMap) {
    const {gl, program} = this;
    const lightsInfo = this.scene.getLightsInfo();
    Object.keys(lightsInfo).forEach(type => {
      const {lights, varName} = lightsInfo[type];
      lights.forEach((light, i) => {
        light.setUniforms(gl, program, `${varName}s[${i}]`);

        setUniforms(gl, program, {
          [`u_MvpMatrixFromLight${light.index}`]: mvpMatrixFromLight[light.index]
        });
      });
    });

    this.shadow.setUniforms(gl, program);
  }

  draw() {
    const {gl, program, canvas} = this;
    const {width, height} = canvas.getSize();
    
    gl.viewport(0, 0, width, height);

    this.activate();
    // gl.cullFace(gl.BACK);

    // Setup camera uniforms
    setUniforms(gl, program, {
      'u_CameraPosition': this.camera.eye
    });

    // Draw every mesh in current scene
    this.scene.meshes.forEach(mesh => {
      const {geometry, material, colorAttributeArray, mvpMatrixFromLight} = mesh;
      const {vertices, normals, modelMatrix, textureCoords} = geometry;
      const {diffuse, specular, shininess, texture, color} = material;

      const mvpMatrix = this.camera.transform.x(modelMatrix);
      const normalMatrix = modelMatrix.inverse().transpose();

      // Setup uniforms relative to current model
      setUniforms(gl, program, {
        'u_MvpMatrix': mvpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_NormalMatrix': normalMatrix,
        'u_Diffuse': diffuse,
        'u_Specular': specular,
        'u_Shininess': shininess
      });

      // Setup textures
      this.setupTexture(texture, textureCoords);

      // Setup lights
      this.setupLights(mvpMatrixFromLight);

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!setVertexAttribute(gl, program, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!setVertexAttribute(gl, program, 'a_Color', colorAttributeArray, 3, gl.FLOAT)) return -1;
      if (!setVertexAttribute(gl, program, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

      mesh.geometry.draw(gl);
    });
  }
}