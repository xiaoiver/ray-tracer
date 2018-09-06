import { Matrix, Vector } from 'sylvester';
import Camera from '../Camera';
import Scene from '../Scene';
import Shader, {FBO} from './Shader';
import AmbientLight from '../light/AmbientLight';

const OFFSCREEN_WIDTH = 2048;
const OFFSCREEN_HEIGHT = 2048;

export default class ShadowShader extends Shader {
  fbo: FBO;

  constructor() {
    super();
  }

  generateShaders(scene: Scene) {
    const vertexShader = `
      attribute vec4 a_Position;
      uniform mat4 u_MVPMatrix;
      void main() {
        gl_Position = u_MVPMatrix * a_Position;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
      }
    `;

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
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.framebuffer); // Change the drawing destination to FBO
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT); // Set view port for FBO
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear FBO   
    
    let viewMatrix: Matrix;
    const projectionMatrix = camera.perspective(camera.fovy, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, camera.znear, camera.zfar);
    scene.lights.forEach(light => {
      if (light.shadowEnabled) {
        viewMatrix = camera.lookAt(light.position, camera.center, camera.up);
        // light.setUniforms(this);

        scene.objects.forEach(mesh => {
          let {vertices, modelMatrix} = mesh.geometry;
    
          this.setUniforms({
            'u_MVPMatrix': projectionMatrix.x(viewMatrix.x(modelMatrix))
          });
    
          // Write the vertex property to buffers (coordinates, colors and normals)
          if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
    
          mesh.geometry.draw(gl);
        });
      }
    });

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}