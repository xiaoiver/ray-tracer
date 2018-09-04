import { Matrix } from 'sylvester';
import { getWebGLContext } from './utils/gl';

let gl;

export default class Renderer {
  constructor(canvas) {
    gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
  }

  setShader(shader) {
    this.shader = shader;
  }

  render(scene, camera) {
    if (!this.shader.inited) {
      this.shader.init(gl, scene);
    }

    this.shader.draw(scene, camera);
  }
}