import { Matrix } from 'sylvester';
import { getWebGLContext } from './utils/gl';

let gl;

export default class Renderer {
  constructor(canvas, clearColor = $V([0, 0, 0])) {
    this.canvas = canvas;
    gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    this.clearColor = clearColor;
  }

  setShader(shader) {
    this.shader = shader;
    gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    gl.enable(gl.DEPTH_TEST);
  }

  render(scene, camera) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    if (!this.shader.inited) {
      this.shader.init(gl, scene);
    }

    this.shader.draw(scene, camera);
  }
}