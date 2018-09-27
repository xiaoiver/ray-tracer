import { setUniforms } from '../../utils/gl';
import { OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT } from '../../shaders/ShadowShader';
import { DEFAULT_SHADER_SNIPPET, IShaderSnippet } from '../../shaders/ShaderSnippet';

export interface IShadow {
  getDeclarationInFragment(): string;

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void;
}

export default class Shadow implements IShadow {
  snippet: IShaderSnippet = DEFAULT_SHADER_SNIPPET;

  getDeclarationInFragment(): string {
    return `
      vec2 texelSize = vec2(1.0) / vec2(${OFFSCREEN_WIDTH.toFixed(5), OFFSCREEN_HEIGHT.toFixed(5)});

      float unpackDepth(const in vec4 rgbaDepth) {
        const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
        float depth = dot(rgbaDepth, bitShift);
        return depth;
      }

      float texture2DCompare(sampler2D depths, vec2 uv, float compare, float bias){
        float depth = unpackDepth(texture2D(depths, uv));
        return step(compare - bias, depth);
      }

      float texture2DShadowLerp(sampler2D depths, vec2 uv, float compare, float bias){
        vec2 f = fract(uv);
        float lb = texture2DCompare(depths, uv + texelSize * vec2(0.0, 0.0), compare, bias);
        float lt = texture2DCompare(depths, uv + texelSize * vec2(0.0, 1.0), compare, bias);
        float rb = texture2DCompare(depths, uv + texelSize * vec2(1.0, 0.0), compare, bias);
        float rt = texture2DCompare(depths, uv + texelSize * vec2(1.0, 1.0), compare, bias);
        float a = mix(lb, lt, f.y);
        float b = mix(rb, rt, f.y);
        float c = mix(a, b, f.x);
        return c;
      }

      ${this.snippet.fragment.declaration}

      float calcShadow(sampler2D depths, vec4 positionFromLight, vec3 lightDir, vec3 normal) {
        vec3 shadowCoord = (positionFromLight.xyz / positionFromLight.w) * 0.5 + 0.5;
        // float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
        float bias = 0.0015;
        ${this.snippet.fragment.calculation}
      }
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {}
}
