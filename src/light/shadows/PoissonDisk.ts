import { setUniforms } from '../../utils/gl';
import Shadow from "./Shadow";

// http://www.opengl-tutorial.org/cn/intermediate-tutorials/tutorial-16-shadow-mapping/#poisson-sampling
export default class PoissonDisk extends Shadow {
  constructor() {
    super();

    this.snippet.fragment.declaration = `
      uniform float uPoissonDisk[8];
      float PoissonDisk(sampler2D depths, vec2 uv, float compare, float bias){
        float result = 0.0;
        for (int i = 0; i < 4; i++) {
          result += texture2DCompare(depths, uv + vec2(uPoissonDisk[i * 2], uPoissonDisk[i * 2 + 1])/700.0, compare, bias);
        }
        return result / 4.0;
      }
    `;
    this.snippet.fragment.calculation = `
      return PoissonDisk(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const poissonDisk = [
      -0.94201624, -0.39906216,
      0.94558609, -0.76890725,
      -0.094184101, -0.92938870,
      0.34495938, 0.29387760
    ];
    for (let i = 0; i < 8; i++) {
      setUniforms(gl, program, {
        [`uPoissonDisk[${i}]`]: poissonDisk[i]
      });
    }
  }
}