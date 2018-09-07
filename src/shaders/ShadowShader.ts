import { Matrix } from 'sylvester';
import Camera from '../Camera';
import Scene from '../Scene';
import Shader, { FBO } from './Shader';

const OFFSCREEN_WIDTH = 2048;
const OFFSCREEN_HEIGHT = 2048;

export default class ShadowShader extends Shader {
  fbo: FBO;

  constructor() {
    super();
  }

  fragmentCode(): string {
    return `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
      }
    `;
  }

  hpFragmentCode(): string {
    return `
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

  generateShaders(scene: Scene) {
    const vertexShader = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main() {
        gl_Position = u_MvpMatrix * a_Position;
      }
    `;

    const fragmentShader = this.hpFragmentCode();
    // const fragmentShader = this.fragmentCode();

    const gl = this.gl;
    // Initialize framebuffer object (FBO)  
    this.fbo = <FBO> this.initFramebufferObject(OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    if (!this.fbo.framebuffer) {
      console.log('Failed to initialize frame buffer object');
      return;
    }
    gl.activeTexture(gl.TEXTURE0); // Set a texture object to the texture unit
    gl.bindTexture(gl.TEXTURE_2D, this.fbo.texture);

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw(scene: Scene, camera: Camera) {
    const gl = this.gl;
    gl.useProgram(this.program);
    // Change the drawing destination to FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.framebuffer);
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.cullFace(gl.FRONT);
    
    let viewMatrix: Matrix;
    const projectionMatrix = camera.perspective(camera.fovy, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, camera.znear, camera.zfar);
    scene.lights.forEach(light => {
      // Calculate shadow map for every light
      if (light.shadowEnabled) {
        viewMatrix = camera.lookAt(light.position, camera.center, camera.up);

        scene.meshes.forEach(mesh => {
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
      }
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}