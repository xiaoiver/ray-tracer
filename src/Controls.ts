import * as dat from 'dat.gui';
import { EventEmitter } from 'eventemitter3';
import { canvasMousePos, resizeCanvas } from './utils/dom';
import Scene from './Scene';
import Camera from './Camera';
import SpotLight from './light/SpotLight';

interface ILightControl {
  spotLight: {
    angle: number;
    blur: number;
  }
}

interface ICameraControl {
  isTruck: boolean;
  moveSpeed: number;
}

interface ControlOptions {
  canvas: HTMLCanvasElement;
  camera: Camera;
  scene: Scene;
}

export default class Controls extends EventEmitter {
  canvas: HTMLCanvasElement;
  camera: Camera;
  scene: Scene;
  cameraController: ICameraControl;
  lightController: ILightControl;

  isMoving: boolean;
  lastX: number;
  lastY: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;

  constructor(options: ControlOptions) {
    super();
    Object.assign(this, options);

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
      spotLight: {
        angle: 14,
        blur: 2
      }
    };

    this.onMousedown = this.onMousedown.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMouseup = this.onMouseup.bind(this);
    this.onMouseout = this.onMouseout.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);
    this.onResize = this.onResize.bind(this);

    this.canvas.addEventListener('mousedown', this.onMousedown, false);
    this.canvas.addEventListener('mousemove', this.onMousemove, false);
    this.canvas.addEventListener('mouseup', this.onMouseup, false);
    this.canvas.addEventListener('mouseout', this.onMouseout, false);
    this.canvas.addEventListener('wheel', this.onMousewheel, false);
    window.addEventListener('resize', this.onResize, false);

    const gui = new dat.GUI();
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(this.cameraController, 'isTruck');
    cameraFolder.add(this.cameraController, 'moveSpeed', 0.1, 2);

    // this.initLightControl

    const lightFolder = gui.addFolder('light');
    lightFolder.add(this.lightController.spotLight, 'angle', 10, 30).onChange(this.changeLight.bind(this));
    lightFolder.add(this.lightController.spotLight, 'blur', 2, 10).onChange(this.changeLight.bind(this));
    gui.open();
  }

  onMousedown(e: MouseEvent) {
    let {x, y} = canvasMousePos(e, this.canvas);

    this.lastX = x;
    this.lastY = y;
    this.isMoving = true;
    this.deltaZ = 0;
  }

  onMousemove(e: MouseEvent) {
    if (this.isMoving) {
      let {x, y} = canvasMousePos(e, this.canvas);
      this.deltaX = x - this.lastX;
      this.deltaY = y - this.lastY;

      this.lastX = x;
      this.lastY = y;

      this.emit('mouse:moving');

      this.moveCamera();
    }
  }

  onMouseup(e: MouseEvent) {
    this.isMoving = false;
  }

  onMouseout(e: MouseEvent) {
    this.isMoving = false;
  }

  onMousewheel(e: WheelEvent) {
    this.deltaZ = e.deltaY;
    this.emit('mouse:wheel');

    this.moveCamera();
  }

  onResize() {
    const {displayWidth, displayHeight} = resizeCanvas(this.canvas);
    this.emit('canvas:resize', [{width: displayWidth, height: displayHeight}]);

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

  changeLight() {
    let spotLight = <SpotLight> this.scene.lights[this.scene.lights.length - 1];
    spotLight.angle = this.lightController.spotLight.angle;
    spotLight.blur = this.lightController.spotLight.blur;

    this.emit('shader:refresh');
  }
}
