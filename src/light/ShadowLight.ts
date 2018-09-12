import { Light, LightOptions } from './Light';
import Shader, {FBO} from '../shaders/Shader';
import { UNIFORM_SHADOW_LIGHT_MAP } from '../constants';
import { IShaderSnippet } from '../shaders/ShaderSnippet';

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
  shadowSnippet: IShaderSnippet;

  uShadowMap: string = `UNIFORM_SHADOW_LIGHT_MAP${this.index}`;

  constructor(options: Partial<LightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  calculateShadow() {
    const i = this.index;
    let fragmentCode;

    if (this.mode === ShadowMode.Simple) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w)/2.0 + 0.5;
        vec4 rgbaDepth${i} = texture2D(${this.uShadowMap}, shadowCoord${i}.xy);
        float depth${i} = rgbaDepth${i}.r;
        float visibility${i} = (shadowCoord${i}.z > depth${i} + 0.005) ? 0.7 : 1.0;
      `;
    } else if (this.mode === ShadowMode.HighPrecision) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        bvec4 inFrustumVec = bvec4 ( shadowCoord${i}.x >= 0.0, shadowCoord${i}.x <= 1.0, shadowCoord${i}.y >= 0.0, shadowCoord${i}.y <= 1.0 );
        bool inFrustum = all( inFrustumVec );
    
        bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord${i}.z <= 1.0 );
    
        bool frustumTest = all( frustumTestVec );

        float visibility${i} = 1.0;
        if ( frustumTest ) {
          visibility${i} = texture2DCompare(${this.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
        }
      `;
    } else if (this.mode === ShadowMode.Lerp) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = texture2DShadowLerp(${this.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    } else if (this.mode === ShadowMode.PCF) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = PCF(${this.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
      `;
    } else if (this.mode === ShadowMode.PCFLerp) {
      fragmentCode = `
        vec3 shadowCoord${i} = (v_PositionFromLight${i}.xyz/v_PositionFromLight${i}.w) * 0.5 + 0.5;
        float visibility${i} = PCFLerp(${this.uShadowMap}, shadowCoord${i}.xy, shadowCoord${i}.z);
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
          uniform sampler2D ${this.uShadowMap};
          varying vec4 v_PositionFromLight${i};
        `,
        calculation: fragmentCode,
        result: `visibility${i}`
      }
    };
  }

  setUniforms(shader: Shader, namespace: string) {
    const location = shader.gl.getUniformLocation(shader.program, this.uShadowMap);
    shader.gl.uniform1i(location, this.fboTextureIdx);
    // shader.setUniforms({
    //   [this.uniforms.uShadowMap]: this.fboTextureIdx
    // });
  }
}