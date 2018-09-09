import { injectable, inject } from 'inversify';
import { EventEmitter } from 'eventemitter3';
import Canvas, { ICanvasService } from './Canvas';
import SERVICE_IDENTIFIER from '../constants/services';
import { canvasMousePos } from '../utils/dom';

export interface IMouseService {
  on(name: string, cb: Function): void;
}

export interface MouseData {
  deltaX: number;
  deltaY: number;
  deltaZ: number;
}

@injectable()
export default class Mouse extends EventEmitter implements IMouseService {
  @inject(SERVICE_IDENTIFIER.ICanvasService) private canvas: ICanvasService;

  private isMoving: boolean = false;
  private lastX: number = -1;
  private lastY: number = -1;
  private deltaX: number = 0;
  private deltaY: number = 0;
  private deltaZ: number = 0;

  static UP_EVENT = 'mouseup';
  static MOVE_EVENT = 'mousemove';
  static DOWN_EVENT = 'mousedown';
  static OUT_EVENT = 'mouseout';
  static WHEEL_EVENT = 'mousewheel';

  constructor() {
    super();
    this.onMousedown = this.onMousedown.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMouseup = this.onMouseup.bind(this);
    this.onMouseout = this.onMouseout.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);

    this.canvas.el.addEventListener('mousedown', this.onMousedown, false);
    this.canvas.el.addEventListener('mousemove', this.onMousemove, false);
    this.canvas.el.addEventListener('mouseup', this.onMouseup, false);
    this.canvas.el.addEventListener('mouseout', this.onMouseout, false);
    this.canvas.el.addEventListener('wheel', this.onMousewheel, false);
  }

  onMouseup(e: MouseEvent) {
    this.isMoving = false;
    this.emit(Mouse.UP_EVENT);
  }

  onMouseout(e: MouseEvent) {
    this.isMoving = false;
    this.emit(Mouse.OUT_EVENT);
  }

  onMousedown(e: MouseEvent) {
    let {x, y} = canvasMousePos(e, this.canvas.el);

    this.lastX = x;
    this.lastY = y;
    this.isMoving = true;
    this.deltaZ = 0;

    this.emit(Mouse.DOWN_EVENT);
  }

  onMousemove(e: MouseEvent) {
    if (this.isMoving) {
      let {x, y} = canvasMousePos(e, this.canvas.el);
      this.deltaX = x - this.lastX;
      this.deltaY = y - this.lastY;

      this.lastX = x;
      this.lastY = y;

      this.emit(Mouse.MOVE_EVENT, [{
        deltaX: this.deltaX,
        deltaY: this.deltaY,
        deltaZ: this.deltaZ
      }]);
    }
  }

  onMousewheel(e: WheelEvent) {
    this.deltaZ = e.deltaY;
    this.emit(Mouse.WHEEL_EVENT, [{
      deltaX: this.deltaX,
      deltaY: this.deltaY,
      deltaZ: this.deltaZ
    }]);
  }
}