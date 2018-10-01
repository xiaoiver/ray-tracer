import { injectable, inject } from 'inversify';
import { Matrix } from 'sylvester';

import SERVICE_IDENTIFIER from '../constants/services';
import { getWebGLContext } from '../utils/gl';

import { ISceneService } from './Scene';
import { ICanvasService } from './Canvas';
import Shader from '../shaders/Shader';

export interface IRendererService {
  gl: WebGLRenderingContext;

  render(): void;
  addShader(shader: Shader): void;
  updateShaders(): void;
  updateScene(): void;
}

@injectable()
export default class Renderer implements IRendererService {
  private canvas: ICanvasService;
  private scene: ISceneService;

  private shaders: Array<Shader> = [];
  private clearColor: Vector = $V([0,0,0]);

  gl: WebGLRenderingContext;

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) _canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService
  ) {
    this.canvas = _canvas;
    this.scene = _scene;

    const gl = <WebGLRenderingContext> getWebGLContext(this.canvas.el);
    this.gl = gl;
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    this.gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    this.gl.enable(gl.DEPTH_TEST);
    this.gl.enable(gl.CULL_FACE);
  }

  addShader(shader: Shader) {
    this.shaders.push(shader);
  }

  updateShaders() {
    this.shaders.forEach(shader => {
      shader.inited = false;
    });
  }

  updateScene() {
    this.scene.inited = false;
  }

  render() {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.shaders.forEach(shader => {
      if (!shader.inited) {
        shader.init(this.gl);
      }
    });

    if (!this.scene.inited) {
      this.scene.init();
    }

    this.shaders.forEach(shader => {
      shader.draw();
    });
  }
}