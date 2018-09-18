import { setUniforms } from '../../utils/gl';
import Shadow from './Shadow';

export default class Lerp extends Shadow {
  constructor() {
    super();

    this.snippet.fragment.calculation = `
      return texture2DShadowLerp(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    super.setUniforms(gl, program);
  }
}