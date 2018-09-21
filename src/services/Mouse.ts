import { injectable, inject } from 'inversify';
import { EventEmitter } from 'eventemitter3';
import Canvas, { ICanvasService } from './Canvas';
import SERVICE_IDENTIFIER from '../constants/services';
import * as Hammer from 'hammerjs';

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
  private canvas: ICanvasService;

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

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) _canvas: ICanvasService
  ) {
    super();
    this.canvas = _canvas;
    this.onPanstart = this.onPanstart.bind(this);
    this.onPanmove = this.onPanmove.bind(this);
    this.onPanend = this.onPanend.bind(this);
    this.onPinch = this.onPinch.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);

    const hammertime = new Hammer(this.canvas.el);
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.get('pinch').set({ enable: true });

    hammertime.on('panstart', this.onPanstart);
    hammertime.on('panmove', this.onPanmove);
    hammertime.on('panend', this.onPanend);
    hammertime.on('pinch', this.onPinch);
    
    this.canvas.el.addEventListener('wheel', this.onMousewheel)
  }

  onPanend(e: HammerInput) {
    this.isMoving = false;
    this.emit(Mouse.UP_EVENT);
  }

  onPanstart(e: HammerInput) {
    this.lastX = e.center.x;
    this.lastY = e.center.y;
    this.isMoving = true;
    this.deltaZ = 0;

    this.emit(Mouse.DOWN_EVENT);
  }

  onPanmove(e: HammerInput) {
    if (this.isMoving) {
      this.deltaX = e.center.x - this.lastX;
      this.deltaY = e.center.y - this.lastY;

      this.lastX = e.center.x;
      this.lastY = e.center.y;

      this.emit(Mouse.MOVE_EVENT, {
        deltaX: this.deltaX,
        deltaY: this.deltaY,
        deltaZ: this.deltaZ
      });
    }
  }

  onMousewheel(e: WheelEvent) {
    this.deltaZ = e.deltaY;
    this.emit(Mouse.WHEEL_EVENT, {
      deltaX: this.deltaX,
      deltaY: this.deltaY,
      deltaZ: this.deltaZ
    });
  }

  onPinch(e: HammerInput) {
    this.deltaZ = (1 - e.scale) * 10;
    this.emit(Mouse.WHEEL_EVENT, {
      deltaX: this.deltaX,
      deltaY: this.deltaY,
      deltaZ: this.deltaZ
    });
  }
}
