import { Matrix } from 'sylvester';
import { getWebGLContext } from './utils/gl';
import Shader from './shaders/Shader';
import Scene from './Scene';
import Camera from './Camera';

interface RendererOptions {
  canvas: HTMLCanvasElement;
  clearColor?: Vector;
  shader: Shader;
}

const DEFAULT_RENDERER_OPTIONS = {
  clearColor: $V([0, 0, 0])
};

let gl: WebGLRenderingContext;

export default class Renderer {
  canvas: HTMLCanvasElement;
  clearColor: Vector;
  shader: Shader;

  constructor(options: RendererOptions) {
    Object.assign(this, DEFAULT_RENDERER_OPTIONS, options);
    gl = <WebGLRenderingContext> getWebGLContext(this.canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    gl.enable(gl.DEPTH_TEST);
  }

  render(scene: Scene, camera: Camera) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    if (!this.shader.inited) {
      this.shader.init(gl, scene);
    }

    if (!scene.inited) {
      scene.init();
    }

    this.shader.draw(scene, camera);
  }
}