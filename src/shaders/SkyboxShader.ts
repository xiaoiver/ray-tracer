import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';
import SERVICE_IDENTIFIER from '../constants/services';
import { IShaderSnippet } from './ShaderSnippet';
import { ICameraService } from '../services/Camera';
import { IRendererService } from '../services/Renderer';
import { ISceneService } from '../services/Scene';
import BaseShader from './BaseShader';
import Texture from '../texture/Texture';
import Cube from '../geometry/Cube';
import { setVertexAttribute, setUniforms } from '../utils/gl';

let defaultTextureCreated = false;

@injectable()
export default class SkyboxShader extends BaseShader {
  private texture: Texture;
  private cube: Cube;

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) renderer: IRendererService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService,
    texture: Texture
  ) {
    super(renderer, scene, camera);

    this.texture = texture;

    this.cube = new Cube();

    this.cube.init();
  }

  generateShaders() {
    const vertexShader = `
      attribute vec4 a_Position;
      uniform mat4 u_VpMatrix;
      varying vec3 v_TextureCoord;
    
      void main() {
        v_TextureCoord = vec3(a_Position);
        gl_Position = u_VpMatrix * a_Position;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      uniform samplerCube u_Skybox;
      varying vec3 v_TextureCoord;

      void main() {
        gl_FragColor = textureCube(u_Skybox, v_TextureCoord);
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  setupTexture() {
    const {gl, shader: {program}, texture, cube} = this;

    // https://stackoverflow.com/questions/35151452/check-if-webgl-texture-is-loaded-in-fragment-shader
    if (!defaultTextureCreated) {
      const defaultTexture = gl.createTexture();
      gl.activeTexture((<any> gl)[`TEXTURE${texture.id}`]);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, defaultTexture);
      
      for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 255]));
      }

      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      defaultTextureCreated = true;
    }

    const location = this.gl.getUniformLocation(program, 'u_Skybox');
    this.gl.uniform1i(location, texture.id);
  }

  draw() {
    const {gl, shader: {program}, renderer} = this;
    const {width, height} = renderer.getSize();

    // this.activate();

    gl.useProgram(program)

    gl.viewport(0, 0, width, height);
    gl.disable(gl.CULL_FACE);
    // put skybox to the bottom
    gl.depthMask(false);

    // remove translation in original view matrix
    let viewMatrix = this.camera.view.make3x3().ensure4x4();
    const vpMatrix = this.camera.projection.multiply(viewMatrix);

    setUniforms(gl, program, {
      'u_VpMatrix': vpMatrix
    });

    this.setupTexture();

    if (!setVertexAttribute(gl, program, 'a_Position', this.cube.vertices, 3, gl.FLOAT)) return -1;

    this.cube.draw(gl);

    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
  }
}