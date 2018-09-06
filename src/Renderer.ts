import { Matrix } from 'sylvester';
import { getWebGLContext } from './utils/gl';
import Shader from './shaders/Shader';
import Scene from './Scene';
import Camera from './Camera';
import ShadowShader from './shaders/ShadowShader';

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
  shadowShader: Shader;

  constructor(options: RendererOptions) {
    Object.assign(this, DEFAULT_RENDERER_OPTIONS, options);
    gl = <WebGLRenderingContext> getWebGLContext(this.canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    gl.enable(gl.DEPTH_TEST);

    this.shadowShader = new ShadowShader();
  }

  render(scene: Scene, camera: Camera) {
    if (!this.shader.inited) {
      this.shadowShader.init(gl, scene);
      this.shader.init(gl, scene);
    }

    if (!scene.inited) {
      scene.init();
    }

    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.shadowShader.draw(scene, camera);
    this.shader.draw(scene, camera, this.canvas);
  }
}