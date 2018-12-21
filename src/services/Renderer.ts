import { injectable, inject } from 'inversify';
import { EventEmitter } from 'eventemitter3';
import * as Stats from 'stats.js';
import createGLShell, { GameShell } from 'gl-now';
import { Matrix } from 'sylvester';

import SERVICE_IDENTIFIER from '../constants/services';
import { getWebGLContext } from '../utils/gl';

import { ISceneService } from './Scene';
import BaseShader from '../shaders/BaseShader';

export interface IRendererService {
  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;

  getSize(): { width: number, height: number };
  addShader(shader: BaseShader): void;
  updateShaders(): void;
  updateScene(): void;
  on(name: string, cb: Function): void;
}

@injectable()
export default class Renderer extends EventEmitter implements IRendererService {
  static RESIZE_EVENT = 'resize';
  static READY_EVENT = 'ready';

  private scene: ISceneService;

  private shell: GameShell;
  private stats: Stats;
  private shaders: Array<BaseShader> = [];
  private height: number;
  private width: number;

  gl: WebGLRenderingContext;
  canvas: HTMLCanvasElement;

  constructor(
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService
  ) {
    super();
    this.scene = _scene;

    this.shell = createGLShell({
      clearColor: [1.0, 1., 1.0, 1]
    });
    this.shell.on('gl-init', () => {
      const {canvas, gl} = this.shell;
      this.gl = gl;
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      this.canvas = canvas;
      this.initStats();
      this.emit(Renderer.READY_EVENT);
    });
    
    this.shell.on('gl-render', () => {
      this.stats.update();
      const {canvas, gl} = this.shell;

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
    });

    this.shell.on('gl-resize', (width: number, height: number) => {
      this.width = width;
      this.height = height;
      this.emit(Renderer.RESIZE_EVENT);
    });

    this.shell.on('gl-error', (reason: string) => {
      console.error(reason);
    });
  }

  addShader(shader: BaseShader) {
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

  initStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    const $stats = this.stats.dom;
    $stats.style.position = 'absolute';
    $stats.style.left = '0px';
    $stats.style.top = '0px';
    document.getElementById('stats').appendChild($stats);
  }

  getSize(): { width: number, height: number } {
    return {
      width: this.width,
      height: this.height
    };
  }
}