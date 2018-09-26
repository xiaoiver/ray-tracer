import * as dat from 'dat.gui';
import { EventEmitter } from 'eventemitter3';
import { injectable, inject } from 'inversify';

import SERVICE_IDENTIFIER from '../constants/services';
import { ISceneService } from '../services/Scene';
import { ICameraService } from '../services/Camera';
import { IRendererService } from '../services/Renderer';
import Mouse, { IMouseService, MouseData } from '../services/Mouse';
import Canvas, { ICanvasService } from '../services/Canvas';

import SpotLight from '../light/SpotLight';
import ShadowLight from '../light/ShadowLight';
import ShadowShader, { ShadowMode } from '../shaders/ShadowShader';

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

interface IShadowControl {
  mode: {
    [ShadowMode.LowPrecision]: boolean,
    [ShadowMode.HighPrecision]: boolean,
    [ShadowMode.Lerp]: boolean,
    [ShadowMode.PCF]: boolean,
    [ShadowMode.PCFLerp]: boolean,
    [ShadowMode.PoissonDisk]: boolean,
    [ShadowMode.StratifiedPoissonDisk]: boolean
  }
}

export interface IControlsService {
  cameraController: ICameraControl;
  lightController: ILightControl;
  shadowController: IShadowControl;
}

@injectable()
export default class Controls extends EventEmitter implements IControlsService {
  private scene: ISceneService;
  private camera: ICameraService;
  private mouse: IMouseService;
  private canvas: ICanvasService;
  private renderer: IRendererService;

  cameraController: ICameraControl;
  lightController: ILightControl;
  shadowController: IShadowControl;

  constructor(
    @inject(SERVICE_IDENTIFIER.ICameraService) _camera: ICameraService,
    @inject(SERVICE_IDENTIFIER.IMouseService) _mouse: IMouseService,
    @inject(SERVICE_IDENTIFIER.ICanvasService) _canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.IRendererService) _renderer: IRendererService
  ) {
    super();

    this.scene = _scene;
    this.camera = _camera;
    this.canvas = _canvas;
    this.mouse = _mouse;
    this.renderer = _renderer;

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

    this.shadowController = {
      mode: {
        [ShadowMode.LowPrecision]: false,
        [ShadowMode.HighPrecision]: true,
        [ShadowMode.Lerp]: false,
        [ShadowMode.PCF]: false,
        [ShadowMode.PCFLerp]: false,
        [ShadowMode.PoissonDisk]: false,
        [ShadowMode.StratifiedPoissonDisk]: false
      }
    }

    const gui = new dat.GUI();
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(this.cameraController, 'isTruck');
    cameraFolder.add(this.cameraController, 'moveSpeed', 0.1, 2);

    const lightFolder = gui.addFolder('light');
    lightFolder.add(this.lightController.spotLight, 'angle', 10, 30).onChange(this.changeLight.bind(this));
    lightFolder.add(this.lightController.spotLight, 'blur', 2, 10).onChange(this.changeLight.bind(this));

    const shadowFolder = gui.addFolder('shadow');
    Object.keys(this.shadowController.mode).forEach(m => {
      shadowFolder.add(this.shadowController.mode, m).listen().onChange(this.changeShadowMode.bind(this, m));
    });

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
    const lightsInfo = this.scene.getLightsInfo();
    Object.keys(lightsInfo).forEach(type => {
      const {lights, varName} = lightsInfo[type];
      lights.forEach((light, i) => {
        if (light instanceof SpotLight) {
          light.angle = this.lightController.spotLight.angle;
          light.blur = this.lightController.spotLight.blur;
        }
      });
    });

    this.renderer.updateShaders();
  }

  changeShadowMode(mode: ShadowMode, value: boolean) {
    if (value) {
      // toggle dat.gui
      Object.keys(this.shadowController.mode).forEach(m => {
        (<any> this.shadowController.mode)[m] = false;
      });
      this.shadowController.mode[mode] = true;

      // switch shadow mode in shader
      ShadowShader.mode = mode;

      this.renderer.updateShaders();
    }
  }
}
