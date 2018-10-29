import { injectable, inject } from 'inversify';
import createShader, { Shader } from 'gl-shader';
import SERVICE_IDENTIFIER from '../../constants/services';
import { IRendererService } from '../../services/Renderer';
import { ICameraService } from '../../services/Camera';
import { ISceneService } from '../../services/Scene';
import BaseShader, { FBO } from '../BaseShader';
import { DEFAULT_TEXTURE_ID } from '../../constants';

@injectable()
export default abstract class BasePostProcess extends BaseShader {
  fbo: FBO;
  prevTexture: number = DEFAULT_TEXTURE_ID;
  nextTexture: number = DEFAULT_TEXTURE_ID;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) _renderer: IRendererService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) _camera: ICameraService
  ) {
    super(_renderer, _scene, _camera);
    this.renderer = _renderer;
    this.scene = _scene;
    this.camera = _camera;
  }
}