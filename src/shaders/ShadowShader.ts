import { injectable, inject } from 'inversify';
import { Matrix } from 'sylvester';
import BaseShader, { FBO, IShader } from './BaseShader';
import { Light } from '../light/Light';
import ShadowLight from '../light/ShadowLight';
import SERVICE_IDENTIFIER from '../constants/services';
import { ICameraService } from '../services/Camera';
import { IRendererService } from '../services/Renderer';
import { ISceneService } from '../services/Scene';
import DirectionalLight from '../light/DirectionalLight';
import { setVertexAttribute, setUniforms } from '../utils/gl';
import SpotLight from '../light/SpotLight';
import Blur from './post-process/Blur';
import Texture from '../texture/Texture';

export const OFFSCREEN_WIDTH = 2048;
export const OFFSCREEN_HEIGHT = 2048;

export enum ShadowMode {
  LowPrecision = 'low-precision',
  HighPrecision = 'high-precision',
  Lerp = 'lerp',
  PCF = 'pcf',
  PCFLerp = 'pcf-lerp',
  PoissonDisk = 'poisson-disk',
  StratifiedPoissonDisk = 'stratified-poisson-disk',
  RotatedPoissonDisk = 'rotated-poisson-disk',
  VSM = 'variance-shadow-mapping'
}

@injectable()
export default class ShadowShader extends BaseShader {

  static mode: ShadowMode = ShadowMode.HighPrecision;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) renderer: IRendererService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService
  ) {
    super(renderer, scene, camera);

    const blurH = new Blur(renderer, scene, camera);
    const blurV = new Blur(renderer, scene, camera);
    blurH.prevTexture = 0;
    blurH.nextTexture = 1;
    blurV.prevTexture = 1;
    blurV.nextTexture = 0;
    this.addPostProcess(blurH);
    this.addPostProcess(blurV);
  }

  generateShaders() {
    const gl = this.gl;
    let fbo: FBO;
    let fboTextureIdx: number = 0;

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
        }
      });
    });

    let fragmentShader;
    let vertexShader = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main() {
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;
    if (ShadowShader.mode === ShadowMode.LowPrecision) {
      fragmentShader = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
        }
      `;
    } else if (ShadowShader.mode === ShadowMode.HighPrecision
      || ShadowShader.mode === ShadowMode.Lerp
      || ShadowShader.mode === ShadowMode.PCF
      || ShadowShader.mode === ShadowMode.PCFLerp
      || ShadowShader.mode === ShadowMode.PoissonDisk
      || ShadowShader.mode === ShadowMode.StratifiedPoissonDisk
      || ShadowShader.mode === ShadowMode.RotatedPoissonDisk) {
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
    } else if (ShadowShader.mode === ShadowMode.VSM) {
      gl.getExtension('OES_standard_derivatives');
      vertexShader = `
        attribute vec4 a_Position;
        uniform mat4 u_MvpMatrix;
        // uniform mat4 u_ModelMatrix;
        varying vec4 v_Position;
        void main() {
          gl_Position = u_MvpMatrix * a_Position;
          v_Position = gl_Position;
        }
      `;
      fragmentShader = `
        #extension GL_OES_standard_derivatives : enable
        precision mediump float;
        varying vec4 v_Position;

        vec2 packHalf(float depth) { 
          vec2 bitOffset = vec2(1.0 / 255., 0.);
          vec2 color = vec2(depth, fract(depth * 255.));
        
          return color - (color.yy * bitOffset);
        }

        void main(){
          float depth = gl_FragCoord.z;
          // float depth = v_Position.z / v_Position.w;
          // depth = depth * 0.5 + 0.5;
          float moment1 = depth;
          float moment2 = moment1 * moment1;
          float dx = dFdx(depth);
          float dy = dFdy(depth);
          moment2 += 0.25 * (dx * dx + dy * dy);
          gl_FragColor = vec4(packHalf(moment1), packHalf(moment2));
        }
      `;
    }

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw() {
    const {gl, shader: {program}} = this;
    this.activate();
    // gl.cullFace(gl.BACK);
    
    let projectionMatrix: Matrix;
    let viewMatrix: Matrix;
    let textureName: string;
    let lightPosition: Vector;
    
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

          if (light instanceof DirectionalLight) {
            lightPosition = light.direction.x(-10);
            projectionMatrix = this.camera.ortho(-10, 10, -10, 10, 1, 100);
            viewMatrix = this.camera.lookAt(lightPosition, light.direction, this.camera.up);
          } else if (light instanceof SpotLight) {
            projectionMatrix = this.camera.perspective(this.camera.fovy, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1, 100);
            // viewMatrix = this.camera.lookAt(light.position, light.direction, $V([0, 1, 0]));
            viewMatrix = this.camera.lookAt(light.position, $V([0.01, 0, 0]), $V([0, 1, 0]));
          }

          this.scene.meshes.forEach(mesh => {
            const {vertices, modelMatrix} = mesh.geometry;
            const mvpMatrixFromLight = projectionMatrix.x(viewMatrix.x(modelMatrix));

            // Save this mvpmatrix in current mesh for later use in display shader
            mesh.mvpMatrixFromLight[`${light.index}`] = mvpMatrixFromLight;
      
            setUniforms(gl, program, {
              'u_MvpMatrix': mvpMatrixFromLight,
              // 'u_ModelMatrix': modelMatrix
            });
      
            if (!setVertexAttribute(gl, program, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
      
            mesh.geometry.draw(gl);
          });
        }
      });
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (ShadowShader.mode === ShadowMode.VSM) {
      this.postProcesses.forEach(p => {
        p.draw();
      });
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}