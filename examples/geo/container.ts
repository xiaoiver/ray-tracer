import 'reflect-metadata';
import { decorate, injectable, interfaces, Container } from 'inversify';
import SERVICE_IDENTIFIER from '../../src/constants/services';
import { EventEmitter } from 'eventemitter3';

import Scene, { ISceneService } from '../../src/services/Scene';
import Camera, { ICameraService } from '../../src/services/Camera';
import Mouse, { IMouseService } from '../../src/services/Mouse';
import Renderer, { IRendererService } from '../../src/services/Renderer';
import Controls, { IControlsService } from './Controls';

const container = new Container();

container.bind<ISceneService>(SERVICE_IDENTIFIER.ISceneService).to(Scene).inSingletonScope();
container.bind<ICameraService>(SERVICE_IDENTIFIER.ICameraService).to(Camera).inSingletonScope();
container.bind<IMouseService>(SERVICE_IDENTIFIER.IMouseService).to(Mouse).inSingletonScope();
container.bind<IRendererService>(SERVICE_IDENTIFIER.IRendererService).to(Renderer).inSingletonScope();
container.bind<IControlsService>(SERVICE_IDENTIFIER.IControlsService).to(Controls).inSingletonScope();

decorate(injectable(), EventEmitter);

export { container };