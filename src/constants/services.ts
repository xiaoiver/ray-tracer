const SERVICE_IDENTIFIER = {
  ISceneService: Symbol('ISceneService'),
  ICameraService: Symbol('ICameraService'),
  IMouseService: Symbol('IMouseService'),
  ICanvasService: Symbol('ICanvasService'),
  IRendererService: Symbol('IRendererService'),
  IControlsService: Symbol('IControlsService'),
  
  ISceneServiceFactory: Symbol('Factory<ISceneService>'),
  ICameraServiceFactory: Symbol('Factory<ICameraService>'),
  IMouseServiceFactory: Symbol('Factory<IMouseService>'),
  ICanvasServiceFactory: Symbol('Factory<ICanvasService>'),
  IRendererServiceFactory: Symbol('Factory<IRendererService>'),
  IControlsServiceFactory: Symbol('Factory<IControlsService>')
};

export default SERVICE_IDENTIFIER;