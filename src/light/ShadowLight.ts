import { Light, LightOptions } from './Light';
import Shader from '../shaders/Shader';

export default class ShadowLight extends Light {
  constructor(options: LightOptions) {
    super(options);

    this.uniforms = {
      ...this.uniforms,
      uShadowMap: `u_ShadowMap${this.index}`
    };
  }

  fragmentCalculation() {
    const i = this.index;
    return `
      vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w)/2.0 + 0.5;
      vec4 rgbaDepth${i} = texture2D(${this.uniforms.uShadowMap}, shadowCoord${i}.xy);
      float depth${i} = rgbaDepth${i}.r;
      float visibility${i} = (shadowCoord${i}.z > depth${i} + 0.005) ? 0.7 : 1.0;
    `;
  }

  hpFragmentCalculation() {
    const i = this.index;
    return `
      vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
      vec4 rgbaDepth${i} = texture2D(${this.uniforms.uShadowMap}, shadowCoord${i}.xy);
      float depth${i} = unpackDepth(rgbaDepth${i});
      float visibility${i} = (shadowCoord${i}.z > depth${i} + 0.0015) ? 0.7 : 1.0;
    `;
  }

  generateSnippets() {
    const i = this.index;
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
          uniform sampler2D ${this.uniforms.uShadowMap};
          varying vec4 v_PositionFromLight${i};
        `,
        // calculation: this.fragmentCalculation(),
        calculation: this.hpFragmentCalculation(),
        result: `visibility${i}`
      }
    };
  }

  setUniforms(shader: Shader) {
    shader.setUniforms({
      [this.uniforms.uShadowMap]: 0
    });
  }
}