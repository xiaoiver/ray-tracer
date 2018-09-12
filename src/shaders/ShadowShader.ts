import { injectable, inject } from 'inversify';
import { Matrix } from 'sylvester';
import Shader, { FBO } from './Shader';
import { Light } from '../light/Light';
import ShadowLight, { ShadowMode } from '../light/ShadowLight';
import SERVICE_IDENTIFIER from '../constants/services';
import { ICameraService } from '../services/Camera';
import { ICanvasService } from '../services/Canvas';
import { ISceneService } from '../services/Scene';
import { IControlsService } from '../services/Controls';

const OFFSCREEN_WIDTH = 2048;
const OFFSCREEN_HEIGHT = 2048;

@injectable()
export default class ShadowShader extends Shader {

  static functions = `
    vec2 texelSize = vec2(1.0) / vec2(${OFFSCREEN_WIDTH.toFixed(5), OFFSCREEN_HEIGHT.toFixed(5)});

    // high-precision
    float unpackDepth(const in vec4 rgbaDepth) {
      const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
      float depth = dot(rgbaDepth, bitShift);
      return depth;
    }
    float texture2DCompare(sampler2D depths, vec2 uv, float compare){
      float depth = unpackDepth(texture2D(depths, uv));
      return (compare > depth + 0.0015) ? 0.7 : 1.0;
    }

    // lerp
    float texture2DShadowLerp(sampler2D depths, vec2 uv, float compare){
      vec2 f = fract(uv);
      float lb = texture2DCompare(depths, uv + texelSize * vec2(0.0, 0.0), compare);
      float lt = texture2DCompare(depths, uv + texelSize * vec2(0.0, 1.0), compare);
      float rb = texture2DCompare(depths, uv + texelSize * vec2(1.0, 0.0), compare);
      float rt = texture2DCompare(depths, uv + texelSize * vec2(1.0, 1.0), compare);
      float a = mix(lb, lt, f.y);
      float b = mix(rb, rt, f.y);
      float c = mix(a, b, f.x);
      return c;
    }

    // pcf
    float PCF(sampler2D depths, vec2 uv, float compare){
      float result = 0.0;
      for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
          vec2 off = texelSize * vec2(x,y);
          result += texture2DCompare(depths, uv + off, compare);
        }
      }
      return result / 25.0;
    }

    // pcf & lerp
    float PCFLerp(sampler2D depths, vec2 uv, float compare){
      float result = 0.0;
      for(int x = -1; x <= 1; x++){
        for(int y = -1; y <= 1; y++){
          vec2 off = texelSize * vec2(x,y);
          result += texture2DShadowLerp(depths, uv + off, compare);
        }
      }
      return result / 9.0;
    }
  `;

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService
  ) {
    super(canvas, scene, camera);
  }

  generateShaders() {
    const vertexShader = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main() {
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;

    const gl = this.gl;
    let fbo: FBO;
    let fboTextureIdx: number = 0;
    let shadowMode;

    const lightsInfo = this.scene.getLightsInfo();
    Object.keys(lightsInfo).forEach(type => {
      const {lights, varName} = lightsInfo[type];
      lights.forEach((light, i) => {
        if (light instanceof ShadowLight) {
          // Initialize framebuffer object (FBO)  
          fbo = <FBO> this.initFramebufferObject(OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
          if (!fbo.framebuffer) {
            console.log('Failed to initialize frame buffer object');
            return;
          }
          light.fbo = fbo;
          light.fboTextureIdx = fboTextureIdx++;
  
          if (fboTextureIdx > 32) {
            console.log('Exceed the maximum number of textures');
            return;
          }
  
          shadowMode = light.mode;
        }
      });
    });

    let fragmentShader;
    if (shadowMode === ShadowMode.Simple) {
      fragmentShader = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
        }
      `;
    } else if (shadowMode === ShadowMode.HighPrecision
      || shadowMode === ShadowMode.Lerp
      || shadowMode === ShadowMode.PCF
      || shadowMode === ShadowMode.PCFLerp) {
      fragmentShader = `
        precision mediump float;
        void main() {
          vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
          const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
          vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
          rgbaDepth -= rgbaDepth.gbaa * bitMask;
          gl_FragColor = rgbaDepth;
        }
      `;
    }

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw() {
    const gl = this.gl;
    gl.useProgram(this.program);
    
    let viewMatrix: Matrix;
    let textureName: string;
    const projectionMatrix = this.camera.perspective(this.camera.fovy, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, this.camera.znear, this.camera.zfar);
    const lightsInfo = this.scene.getLightsInfo();
    Object.keys(lightsInfo).forEach(type => {
      const {lights, varName} = lightsInfo[type];
      // Calculate shadow map for every light
      lights.forEach((light, i) => {
        if (light instanceof ShadowLight) {
          // Change the drawing destination to FBO
          textureName = `TEXTURE${light.fboTextureIdx}`;
          gl.bindFramebuffer(gl.FRAMEBUFFER, light.fbo.framebuffer);
          gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

          // Set a texture object to the texture unit
          gl.activeTexture((<any>gl)[textureName]);
          gl.bindTexture(gl.TEXTURE_2D, light.fbo.texture);
          
          viewMatrix = this.camera.lookAt(light.position, this.camera.center, this.camera.up);

          this.scene.meshes.forEach(mesh => {
            const {vertices, modelMatrix} = mesh.geometry;
            const mvpMatrixFromLight = projectionMatrix.x(viewMatrix.x(modelMatrix));

            // Save this mvpmatrix in current mesh for later use in display shader
            mesh.mvpMatrixFromLight[`${light.index}`] = mvpMatrixFromLight;
      
            this.setUniforms({
              'u_MvpMatrix': mvpMatrixFromLight
            });
      
            if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
      
            mesh.geometry.draw(gl);
          });

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
      });
    });
  }
}