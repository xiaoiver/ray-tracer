import { setUniforms } from '../../utils/gl';
import Shadow from './Shadow';

export default class PCFLerp extends Shadow {
  constructor() {
    super();

    this.snippet.fragment.calculation = `
      return PCFLerp(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;

    this.snippet.fragment.declaration = `
      float PCFLerp(sampler2D depths, vec2 uv, float compare, float bias){
        float result = 0.0;
        for(int x = -1; x <= 1; x++){
          for(int y = -1; y <= 1; y++){
            vec2 off = texelSize * vec2(x,y);
            result += texture2DShadowLerp(depths, uv + off, compare, bias);
          }
        }
        return result / 9.0;
      }
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    super.setUniforms(gl, program);
  }
}
