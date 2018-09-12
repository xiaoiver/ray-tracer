import { injectable, inject } from 'inversify';
import { Matrix } from 'sylvester';

import SERVICE_IDENTIFIER from '../constants/services';
import { getWebGLContext } from '../utils/gl';

import { ISceneService } from './Scene';
import { ICanvasService } from './Canvas';
import Shader from '../shaders/Shader';

export interface IRendererService {
  render(): void;
  addShader(shader: Shader): void;
  updateShaders(): void;
  updateScene(): void;
}

let gl: WebGLRenderingContext;

@injectable()
export default class Renderer implements IRendererService {
  private canvas: ICanvasService;
  private scene: ISceneService;

  private shaders: Array<Shader> = [];
  private clearColor: Vector = $V([0,0,0]);

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) _canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService
  ) {
    this.canvas = _canvas;
    this.scene = _scene;

    gl = <WebGLRenderingContext> getWebGLContext(this.canvas.el);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
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
    this.shaders.forEach(shader => {
      if (!shader.inited) {
        shader.init(gl);
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