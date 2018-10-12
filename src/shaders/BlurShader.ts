import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import SERVICE_IDENTIFIER from '../constants/services';
import { IShaderSnippet } from './ShaderSnippet';
import { ICameraService } from '../services/Camera';
import { IRendererService } from '../services/Renderer';
import { ISceneService } from '../services/Scene';
import BaseShader from './BaseShader';
import Texture from '../texture/Texture';
import Plane from '../geometry/Plane';
import Cube from '../geometry/Cube';
import { setVertexAttribute, setUniforms } from '../utils/gl';
import { DEFAULT_TEXTURE_ID } from '../constants';

let defaultTextureCreated = false;

@injectable()
export default class BlurShader extends BaseShader {
  private texture: Texture;
  private plane: Plane;
  private cube: Cube;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) renderer: IRendererService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService,
    texture: Texture
  ) {
    super(renderer, scene, camera);

    this.texture = texture;
    // this.plane = new Plane({
    //   p1: $V([1.0, 1.0, 0.0]),
    //   p2: $V([1.0, -1.0, 0.0]),
    //   p3: $V([-1.0, -1.0, 0]),
    //   p4: $V([-1.0, 1.0, 0]),
    // });
    // this.plane.init();
    // this.plane.textureCoords = this.plane.vertices.filter((v, i) => i % 3 !== 2).map(v => v / 2 + 0.5);

    this.cube = new Cube();
    
    this.cube.init();
  }

  generateShaders() {
    const vertexShader = `
      attribute vec4 a_Position;
      // attribute vec2 a_TextureCoord;

      // varying vec2 v_TextureCoord;
    
      void main() {
        // v_TextureCoord = a_TextureCoord;
        gl_Position = a_Position;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform sampler2D u_Texture;
      // varying vec2 v_TextureCoord;

      vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3846153846) * direction;
        vec2 off2 = vec2(3.2307692308) * direction;
        color += texture2D(image, uv) * 0.2270270270;
        color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
        color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
        return color;
      }
      
      void main() {
        vec2 uv = vec2(gl_FragCoord.xy / vec2(2048.0, 2048.0));
        // gl_FragColor = blur9(u_Texture, uv, vec2(2048.0, 2048.0), vec2(1.0, 0.0));
        // gl_FragColor = texture2D(u_Texture, v_TextureCoord);
        gl_FragColor = vec4(1., 0., 0., 1.);
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  setupTexture() {
    const {gl, shader: {program}} = this;
    // https://stackoverflow.com/questions/35151452/check-if-webgl-texture-is-loaded-in-fragment-shader
    if (!defaultTextureCreated) {
      const defaultTexture = gl.createTexture();
      gl.activeTexture((<any> gl)[`TEXTURE${DEFAULT_TEXTURE_ID}`]);
      gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      defaultTextureCreated = true;
    }

    const location = this.gl.getUniformLocation(program, 'u_Texture');
    this.gl.uniform1i(location, this.texture && this.texture.id || DEFAULT_TEXTURE_ID);
    if (!setVertexAttribute(gl, program, 'a_TextureCoord', this.plane.textureCoords, 2, gl.FLOAT)) return -1;
  }

  draw() {
    const {gl, shader: {program}, renderer} = this;
    const {width, height} = renderer.getSize();
    gl.viewport(0, 0, width, height);
    this.activate();

    // this.setupTexture();

    if (!setVertexAttribute(gl, program, 'a_Position', this.cube.vertices, 3, gl.FLOAT)) return -1;

    this.cube.draw(gl);

    gl.enable(gl.CULL_FACE);
  }
}