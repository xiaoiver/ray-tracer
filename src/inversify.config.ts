import 'reflect-metadata';
import { decorate, injectable, interfaces, Container } from 'inversify';
import SERVICE_IDENTIFIER from './constants/services';
import { EventEmitter } from 'eventemitter3';

import Scene, { ISceneService } from './services/Scene';
import Camera, { ICameraService } from './services/Camera';
import Mouse, { IMouseService } from './services/Mouse';
import Renderer, { IRendererService } from './services/Renderer';
import Controls, { IControlsService } from './services/Controls';
import TextureLoader, { ITextureLoaderService } from './services/TextureLoader';

const container = new Container();

container.bind<ISceneService>(SERVICE_IDENTIFIER.ISceneService).to(Scene).inSingletonScope();
container.bind<ICameraService>(SERVICE_IDENTIFIER.ICameraService).to(Camera).inSingletonScope();
container.bind<IMouseService>(SERVICE_IDENTIFIER.IMouseService).to(Mouse).inSingletonScope();
container.bind<IRendererService>(SERVICE_IDENTIFIER.IRendererService).to(Renderer).inSingletonScope();
container.bind<IControlsService>(SERVICE_IDENTIFIER.IControlsService).to(Controls).inSingletonScope();
container.bind<ITextureLoaderService>(SERVICE_IDENTIFIER.ITextureLoaderService).to(TextureLoader).inSingletonScope();

decorate(injectable(), EventEmitter);

export { container };