import { injectable, inject } from 'inversify';
import { Matrix } from 'sylvester';

import SERVICE_IDENTIFIER from '../constants/services';
import { getWebGLContext } from '../utils/gl';

import { ISceneService } from './Scene';
import { ICanvasService } from './Canvas';
import Shader from '../shaders/Shader';

export interface IRendererService {
  render(): void;
  setDisplayShader(displayShader: Shader): void;
  setShadowShader(shadowShader: Shader): void;
}

let gl: WebGLRenderingContext;

@injectable()
export default class Renderer implements IRendererService {
  @inject(SERVICE_IDENTIFIER.ICanvasService) private canvas: ICanvasService;
  @inject(SERVICE_IDENTIFIER.ISceneService) private scene: ISceneService;

  private clearColor: Vector = $V([0,0,0]);
  private displayShader: Shader;
  private shadowShader: Shader;

  constructor() {
    gl = <WebGLRenderingContext> getWebGLContext(this.canvas.el);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL.');
      return;
    }
    gl.clearColor(this.clearColor.e(1), this.clearColor.e(2), this.clearColor.e(3), 1.0);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
  }

  setDisplayShader(displayShader: Shader) {
    this.displayShader = displayShader;
  }

  setShadowShader(shadowShader: Shader) {
    this.shadowShader = shadowShader;
  }

  render() {
    if (!this.displayShader.inited) {
      this.shadowShader.init(gl);
      this.displayShader.init(gl);
    }

    if (!this.scene.inited) {
      this.scene.init();
    }

    this.shadowShader.draw();
    this.displayShader.draw();
  }
}