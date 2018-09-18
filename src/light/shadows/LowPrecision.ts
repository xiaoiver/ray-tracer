import { setUniforms } from '../../utils/gl';
import Shadow from "./Shadow";

export default class LowPrecision extends Shadow {
  constructor() {
    super();

    this.snippet.fragment.calculation = `
      vec4 rgbaDepth = texture2D(depths, shadowCoord.xy);
      return step(shadowCoord.z - bias, rgbaDepth.r);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    super.setUniforms(gl, program);
  }
}