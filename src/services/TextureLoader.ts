import { injectable, inject } from 'inversify';
import SERVICE_IDENTIFIER from '../constants/services';
import { IRendererService } from '../services/Renderer';
import Texture from '../texture/Texture';
import { isPowerOf2 } from '../utils/math';
import { DEFAULT_TEXTURE_ID } from '../constants';

export interface ITextureLoaderService {
  load(url: string): Texture;
  loadCubeMap(urls: Array<string>): Texture;
}

@injectable()
export default class TextureLoader implements ITextureLoaderService {
  private currentId: number;
  private maxTextures: number;
  renderer: IRendererService;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) _renderer: IRendererService
  ) {
    this.renderer = _renderer;

    const gl = this.renderer.gl;
    // http://webglreport.com/?v=2
    this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

    this.currentId = DEFAULT_TEXTURE_ID;
  }

  getId(): number {
    if (this.currentId < this.maxTextures) {
      return this.currentId++;
    }
  }

  load(url: string): Texture {
    let img = new Image();
    const gl = this.renderer.gl;

    let texture = new Texture();
    texture.id = this.getId();
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

  //imgAry must be 6 elements long and images placed in the right order
	//RIGHT,LEFT,TOP,BOTTOM,BACK,FRONT
	loadCubeMap(urls: Array<string>): Texture {
    const gl = this.renderer.gl;
  
		if (urls.length != 6) return null;

		let texture = new Texture();
    texture.id = DEFAULT_TEXTURE_ID;
    texture.texture = gl.createTexture();

    Promise.all(urls.map(url => new Promise((resolve, reject) => {
      texture.id = this.getId();
      let img = new Image();
      img.onload = () =>  {
        resolve(img);
      };
      img.onerror = () => {
        console.log('Failed to load img: ' + url);
        reject();
      };
      img.crossOrigin = 'anonymous';
      img.src = url;
    }))).then((images: Array<HTMLImageElement>) => {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture.texture);

      for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
      }

      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // only WebGL2 support TEXTURE_WRAP_R
      // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

      gl.bindTexture(gl.TEXTURE_CUBE_MAP,null);
    });
    
		return texture;
	};
}