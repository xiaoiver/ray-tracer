import { setUniforms } from '../../utils/gl';
import Shadow from "./Shadow";

export default class PCF extends Shadow {
  constructor() {
    super();

    this.snippet.fragment.declaration = `
      float PCF(sampler2D depths, vec2 uv, float compare, float bias){
        float result = 0.0;
        for (int x = -2; x <= 2; x++) {
          for (int y = -2; y <= 2; y++) {
            vec2 off = texelSize * vec2(x,y);
            result += texture2DCompare(depths, uv + off, compare, bias);
          }
        }
        return result / 25.0;
      }
    `;
    this.snippet.fragment.calculation = `
      return PCF(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    super.setUniforms(gl, program);
  }
}