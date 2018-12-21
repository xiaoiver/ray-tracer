import * as dat from 'dat.gui';
import { EventEmitter } from 'eventemitter3';
import { injectable, inject } from 'inversify';

import SERVICE_IDENTIFIER from '../../src/constants/services';
import { ISceneService } from '../../src/services/Scene';
import { ICameraService } from '../../src/services/Camera';
import Renderer, { IRendererService } from '../../src/services/Renderer';
import Mouse, { IMouseService, MouseData } from '../../src/services/Mouse';

interface ICameraControl {
  isTruck: boolean;
  moveSpeed: number;
}

export interface IControlsService {
  cameraController: ICameraControl;
}

@injectable()
export default class Controls extends EventEmitter implements IControlsService {
  private scene: ISceneService;
  private camera: ICameraService;
  private mouse: IMouseService;
  private renderer: IRendererService;

  cameraController: ICameraControl;

  constructor(
    @inject(SERVICE_IDENTIFIER.ICameraService) _camera: ICameraService,
    @inject(SERVICE_IDENTIFIER.IMouseService) _mouse: IMouseService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.IRendererService) _renderer: IRendererService
  ) {
    super();

    this.scene = _scene;
    this.camera = _camera;
    this.mouse = _mouse;
    this.renderer = _renderer;

    this.cameraController = {
      isTruck: true,
      moveSpeed: 0.6
    };

    const gui = new dat.GUI();
    const cameraFolder = gui.addFolder('camera');
    cameraFolder.add(this.cameraController, 'isTruck');
    cameraFolder.add(this.cameraController, 'moveSpeed', 0.1, 2);

    this.onResize = this.onResize.bind(this);
    this.onMousemove = this.onMousemove.bind(this);
    this.onMousewheel = this.onMousewheel.bind(this);

    this.renderer.on(Renderer.RESIZE_EVENT, this.onResize);
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
    const {width, height} = this.renderer.getSize();
    if (this.camera.eye) {
      this.camera.aspect = width / height;
      this.camera.updateProjection();
      this.camera.updateTransform();
    }
  }

  moveCamera(data: MouseData) {
    const {deltaX, deltaY, deltaZ} = data;
    const {isTruck, moveSpeed} = this.cameraController;
  
    if (isTruck) {
      this.camera.pan(deltaX * 0.001 * moveSpeed);
      this.camera.tilt(deltaY * 0.001 * moveSpeed);
      this.camera.dolly(deltaZ * 0.05 * moveSpeed);
    } else {
      this.camera.truck(-deltaX * 0.01 * moveSpeed);
      this.camera.pedestal(deltaY * 0.01 * moveSpeed);
      this.camera.cant(deltaZ * 0.05 * moveSpeed);
    }
  }
}
