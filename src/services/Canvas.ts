import { injectable, inject } from 'inversify';
import { EventEmitter } from 'eventemitter3';

export interface ICanvasService {
  el: HTMLCanvasElement;
  getSize(): { width: number, height: number };
  on(name: string, cb: Function): void;
}

@injectable()
export default class Canvas extends EventEmitter implements ICanvasService {
  el: HTMLCanvasElement;

  static RESIZE_EVENT = 'resize';

  constructor() {
    super();
    this.el = <HTMLCanvasElement> document.getElementById('webgl');

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize, false);
  }
  
  getSize(): { width: number, height: number } {
    return {
      width: this.el.width,
      height: this.el.height
    };
  }

  resize() {
    // https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    const realToCSSPixels = window.devicePixelRatio;
    const displayWidth  = Math.floor(this.el.clientWidth  * realToCSSPixels);
    const displayHeight = Math.floor(this.el.clientHeight * realToCSSPixels);
  
    if (this.el.width !== displayWidth ||
      this.el.height !== displayHeight) {
      this.el.width = displayWidth;
      this.el.height = displayHeight;
    }
  }

  onResize() {
    this.resize();
    this.emit(Canvas.RESIZE_EVENT);
  }
}