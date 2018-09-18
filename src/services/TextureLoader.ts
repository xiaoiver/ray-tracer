import { injectable, inject } from 'inversify';
import SERVICE_IDENTIFIER from '../constants/services';
import { IRendererService } from '../services/Renderer';
import Texture from '../texture/Texture';
import { isPowerOf2 } from '../utils/math';

export interface ITextureLoaderService {
  load(url: string): Texture;
}

export const DEFAULT_TEXTURE_ID = 10;

@injectable()
export default class TextureLoader implements ITextureLoaderService {
  renderer: IRendererService;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) _renderer: IRendererService
  ) {
    this.renderer = _renderer;
  }

  load(url: string): Texture {
    let img = new Image();
    const gl = this.renderer.gl;

    let texture = new Texture();
    texture.id = DEFAULT_TEXTURE_ID;
    texture.texture = gl.createTexture();
    img.onload = () => {
      texture.id++;
      texture.img = img;
      // Flip the image's y axis
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      // Enable texture unit0
      gl.activeTexture((<any> gl)[`TEXTURE${texture.id}`]);
      // Bind the texture object to the target
      gl.bindTexture(gl.TEXTURE_2D, texture.texture);

      // Set the texture image
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.img);

      // Set the texture parameters
      if (isPowerOf2(texture.img.width) && isPowerOf2(texture.img.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    img.onerror = () => {
      console.log('Failed to load img: ' + url);
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
    return texture;
  }
}