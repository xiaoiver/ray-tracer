import { Light, LightOptions } from './Light';
import Shader, {FBO} from '../shaders/Shader';

export enum ShadowMode {
  Simple = 'simple',
  HighPrecision = 'high-precision',
  Lerp = 'lerp',
  PCF = 'pcf',
  PCFLerp = 'pcf-lerp'
}

export default class ShadowLight extends Light {
  fbo: FBO;
  fboTextureIdx: number;
  mode: ShadowMode = ShadowMode.HighPrecision;

  constructor(options: LightOptions) {
    super(options);

    this.uniforms = {
      ...this.uniforms,
      uShadowMap: `u_ShadowMap${this.index}`
    };
  }

  generateSnippets() {
    const i = this.index;
    let fragmentCode;

    if (this.mode === ShadowMode.Simple) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w)/2.0 + 0.5;
        vec4 rgbaDepth${i} = texture2D(${this.uniforms.uShadowMap}, shadowCoord${i}.xy);
        float depth${i} = rgbaDepth${i}.r;
        float visibility${i} = (shadowCoord${i}.z > depth${i} + 0.005) ? 0.7 : 1.0;
      `;
    } else if (this.mode === ShadowMode.HighPrecision) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = texture2DCompare(${this.uniforms.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    } else if (this.mode === ShadowMode.Lerp) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = texture2DShadowLerp(${this.uniforms.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    } else if (this.mode === ShadowMode.PCF) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = PCF(${this.uniforms.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    } else if (this.mode === ShadowMode.PCFLerp) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = PCFLerp(${this.uniforms.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    }

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
        calculation: fragmentCode,
        result: `visibility${i}`
      }
    };
  }

  setUniforms(shader: Shader) {
    shader.setUniforms({
      [this.uniforms.uShadowMap]: this.fboTextureIdx
    });
  }
}