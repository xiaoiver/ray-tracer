import { Light, LightOptions } from './Light';
import { FBO } from '../shaders/BaseShader';
import { IShaderSnippet } from '../shaders/ShaderSnippet';
import { setUniforms } from '../utils/gl';

export default class ShadowLight extends Light {
  fbo: FBO;
  fboTextureIdx: number;
  shadowSnippet: IShaderSnippet;

  uShadowMap: string = `u_ShadowMap${this.index}`;

  constructor(options: Partial<LightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  calculateShadow() {
    const i = this.index;
    let fragmentCode;

    this.shadowSnippet = {
      vertex: {
        declaration: `
          uniform mat4 u_MvpMatrixFromLight${i};
          varying vec4 v_PositionFromLight${i};
        `,
        calculation: `
          v_PositionFromLight${i} = u_MvpMatrixFromLight${i} * a_Position;
        `,
        result: ''
      },
      fragment: {
        declaration: `
          uniform sampler2D ${this.uShadowMap};
          varying vec4 v_PositionFromLight${i};
        `,
        calculation: '',
        result: ''
      }
    };
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, namespace: string) {
    super.setUniforms(gl, program, namespace);

    setUniforms(gl, program, {
      [this.uShadowMap]: this.fboTextureIdx
    }, 'int');
  }
}