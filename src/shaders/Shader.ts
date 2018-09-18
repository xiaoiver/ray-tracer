import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import { initShaders, setUniforms } from '../utils/gl';
import SERVICE_IDENTIFIER from '../constants/services';
import { ICameraService } from '../services/Camera';
import { ICanvasService } from '../services/Canvas';
import { ISceneService } from '../services/Scene';

export interface FBO {framebuffer: WebGLFramebuffer, texture: WebGLTexture};

export interface IShader {
  gl: WebGLRenderingContext;
  program?: WebGLProgram;
  inited: boolean;
  init(gl: WebGLRenderingContext): void;
}

@injectable()
export default abstract class Shader implements IShader {
  canvas: ICanvasService;
  scene: ISceneService;
  camera: ICameraService;

  inited: boolean = false;
  gl: WebGLRenderingContext;
  program: WebGLProgram;

  constructor(
    @inject(SERVICE_IDENTIFIER.ICanvasService) _canvas: ICanvasService,
    @inject(SERVICE_IDENTIFIER.ISceneService) _scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) _camera: ICameraService
  ) {
    this.canvas = _canvas;
    this.scene = _scene;
    this.camera = _camera;
  }

  protected abstract generateShaders(): {
    vertexShader: string;
    fragmentShader: string;
  };

  public abstract draw(): void;

  init(gl: WebGLRenderingContext) {
    this.gl = gl;
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    this.initShaders();
    this.inited = true;
  }

  initShaders() {
    const { vertexShader, fragmentShader } = this.generateShaders();
    this.program = initShaders(this.gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.log('Failed to intialize shaders.');
    }
  }

  initFramebufferObject(width: number, height: number): FBO | void {
    const gl = this.gl;
    let framebuffer : WebGLFramebuffer;
    let texture: WebGLTexture;
    let depthBuffer: WebGLRenderbuffer;
  
    // Define the error handling function
    const error = function(): void {
      if (framebuffer) gl.deleteFramebuffer(framebuffer);
      if (texture) gl.deleteTexture(texture);
      if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
      return null;
    }
  
    // Create a framebuffer object (FBO)
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      console.log('Failed to create frame buffer object');
      return error();
    }
  
    // Create a texture object and set its size and parameters
    texture = gl.createTexture(); // Create a texture object
    if (!texture) {
      console.log('Failed to create texture object');
      return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
    // Create a renderbuffer object and Set its size and parameters
    depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
    if (!depthBuffer) {
      console.log('Failed to create renderbuffer object');
      return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  
    // Attach the texture and the renderbuffer object to the FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  
    // Check if FBO is configured correctly
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
      console.log('Frame buffer object is incomplete: ' + e.toString());
      return error();
    }
  
    // Unbind the buffer object
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  
    return {framebuffer, texture};
  }
}