import * as dat from 'dat.gui';
import EventEmitter from 'wolfy87-eventemitter';
import { canvasMousePos, resizeCanvas } from './utils/dom';

export default class Controls extends EventEmitter {
  constructor({canvas, camera, scene}) {
    super();
    this.canvas = canvas;
    this.camera = camera;
    this.scene = scene;

    this.isMoving = false;
    this.lastX = -1;
    this.lastY = -1;
    this.deltaX = 0;
    this.deltaY = 0;
    this.deltaZ = 0;

    this.cameraController = {
      isTruck: true,
      moveSpeed: 0.6
    };

    this.lightController = {

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
    cameraFolder.add(this.cameraController, 'isTruck');
    cameraFolder.add(this.cameraController, 'moveSpeed', 0.1, 2);

    const lightFolder = gui.addFolder('light');
    gui.open();
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

      this.moveCamera();
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
    this.trigger('mouse:wheel');

    this.moveCamera();
  }

  onResize() {
    const {displayWidth, displayHeight} = resizeCanvas(this.canvas);
    this.trigger('canvas:resize', [{width: displayWidth, height: displayHeight}]);

    this.camera.aspect = displayWidth / displayHeight;
    this.camera.updateProjection();
    this.camera.updateTransform();
  }

  moveCamera() {
    let {deltaX, deltaY, deltaZ, camera, cameraController} = this;
    let {isTruck, moveSpeed} = cameraController;
  
    if (isTruck) {
      camera.truck(-deltaX * 0.01 * moveSpeed);
      camera.pedestal(deltaY * 0.01 * moveSpeed);
      camera.dolly(deltaZ * 0.05 * moveSpeed);
    } else {
      camera.pan(deltaX * 0.001 * moveSpeed);
      camera.tilt(deltaY * 0.001 * moveSpeed);
      camera.cant(deltaZ * 0.05 * moveSpeed);
    }
  }
}
