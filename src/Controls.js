import * as dat from 'dat.gui';
import EventEmitter from 'wolfy87-eventemitter';
import { canvasMousePos, resizeCanvas } from './utils/dom';

export default class Controls extends EventEmitter {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.isMoving = false;
    this.lastX = -1;
    this.lastY = -1;
    this.deltaX = 0;
    this.deltaY = 0;
    this.deltaZ = 0;

    this.camera = {
      isTruck: true,
      moveSpeed: 0.6
    };

    this.onMousedown = this.onMousedown.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMouseup = this.onMouseup.bind(this);
    this.onMouseout = this.onMouseout.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);
    this.onResize = this.onResize.bind(this);

    canvas.addEventListener('mousedown', this.onMousedown, false);
    canvas.addEventListener('mousemove', this.onMousemove, false);
    canvas.addEventListener('mouseup', this.onMouseup, false);
    canvas.addEventListener('mouseout', this.onMouseout, false);
    canvas.addEventListener('wheel', this.onMousewheel, false);
    window.addEventListener('resize', this.onResize, false);

    const gui = new dat.GUI();
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(this.camera, 'isTruck');
    cameraFolder.add(this.camera, 'moveSpeed', 0.1, 2);
  }

  onMousedown(e) {
    let {x, y} = canvasMousePos(e, this.canvas);

    this.lastX = x;
    this.lastY = y;
    this.isMoving = true;
    this.deltaZ = 0;
  }

  onMousemove(e) {
    if (this.isMoving) {
      let {x, y} = canvasMousePos(e, this.canvas);
      this.deltaX = x - this.lastX;
      this.deltaY = y - this.lastY;

      this.lastX = x;
      this.lastY = y;

      this.trigger('mouse');
    }
  }

  onMouseup(e) {
    this.isMoving = false;
  }

  onMouseout(e) {
    this.isMoving = false;
  }

  onMousewheel(e) {
    this.deltaZ = e.deltaY;
    this.trigger('mouse');
  }

  onResize() {
    const {displayWidth, displayHeight} = resizeCanvas(this.canvas);
    this.trigger('resize', [{width: displayWidth, height: displayHeight}]);
  }
}
