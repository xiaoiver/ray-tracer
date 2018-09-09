import * as dat from 'dat.gui';
import { EventEmitter } from 'eventemitter3';
import { injectable, inject } from 'inversify';

import SERVICE_IDENTIFIER from '../constants/services';
import { ISceneService } from '../services/Scene';
import { ICameraService } from '../services/Camera';
import Mouse, { IMouseService, MouseData } from '../services/Mouse';
import Canvas, { ICanvasService } from '../services/Canvas';

import SpotLight from '../light/SpotLight';

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

export interface IControlsService {}

@injectable()
export default class Controls extends EventEmitter implements IControlsService {
  @inject(SERVICE_IDENTIFIER.ISceneService) private scene: ISceneService;
  @inject(SERVICE_IDENTIFIER.ICameraService) private camera: ICameraService;
  @inject(SERVICE_IDENTIFIER.IMouseService) private mouse: IMouseService;
  @inject(SERVICE_IDENTIFIER.ICanvasService) private canvas: ICanvasService;

  cameraController: ICameraControl;
  lightController: ILightControl;

  constructor() {
    super();

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

    const gui = new dat.GUI();
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(this.cameraController, 'isTruck');
    cameraFolder.add(this.cameraController, 'moveSpeed', 0.1, 2);

    // this.initLightControl

    const lightFolder = gui.addFolder('light');
    lightFolder.add(this.lightController.spotLight, 'angle', 10, 30).onChange(this.changeLight.bind(this));
    lightFolder.add(this.lightController.spotLight, 'blur', 2, 10).onChange(this.changeLight.bind(this));
    gui.open();

    this.onResize = this.onResize.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);

    this.canvas.on(Canvas.RESIZE_EVENT, this.onResize);
    this.mouse.on(Mouse.MOVE_EVENT, this.onMousemove);
    this.mouse.on(Mouse.WHEEL_EVENT, this.onMousewheel);
  }

  onMousemove(data: MouseData) {
    this.moveCamera(data);
  }

  onMousewheel(data: MouseData) {
    this.moveCamera(data);
  }

  onResize() {
    const {width, height} = this.canvas.getSize();
    this.camera.aspect = width / height;
    this.camera.updateProjection();
    this.camera.updateTransform();
  }

  moveCamera(data: MouseData) {
    const {deltaX, deltaY, deltaZ} = data;
    const {isTruck, moveSpeed} = this.cameraController;
  
    if (isTruck) {
      this.camera.truck(-deltaX * 0.01 * moveSpeed);
      this.camera.pedestal(deltaY * 0.01 * moveSpeed);
      this.camera.dolly(deltaZ * 0.05 * moveSpeed);
    } else {
      this.camera.pan(deltaX * 0.001 * moveSpeed);
      this.camera.tilt(deltaY * 0.001 * moveSpeed);
      this.camera.cant(deltaZ * 0.05 * moveSpeed);
    }
  }

  changeLight() {
    let spotLight = <SpotLight> this.scene.lights[this.scene.lights.length - 1];
    spotLight.angle = this.lightController.spotLight.angle;
    spotLight.blur = this.lightController.spotLight.blur;

    this.emit('shader:refresh');
  }
}
