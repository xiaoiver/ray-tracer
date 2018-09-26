import { setUniforms } from '../../utils/gl';
import Shadow from "./Shadow";

// http://www.opengl-tutorial.org/cn/intermediate-tutorials/tutorial-16-shadow-mapping/#stratified-poisson-sampling
export default class StratifiedPoissonDisk extends Shadow {
  constructor() {
    super();

    /**
     * 1. can't use '%', use 'mod' instead.
     * // https://stackoverflow.com/questions/35155598/unable-to-use-in-glsl
     * 
     * 2. access array by index.
     * // https://stackoverflow.com/questions/6247572/variable-array-index-not-possible-in-webgl-shaders?noredirect=1&lq=1
     * // https://www.john-smith.me/hassles-with-array-access-in-webgl-and-a-couple-of-workarounds.html
     * 
     * 3. if we choose random samples based on the pixel's screen location, the shadow will move with the camera.
     * So, we can choose based on the pixel's position in world space.
     */
    this.snippet.fragment.declaration = `
      uniform float uPoissonDisk[32];
      float random(vec3 seed, int i) {
        vec4 seed4 = vec4(seed,i);
        float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
        return fract(sin(dot_product) * 43758.5453);
      }
      float StratifiedPoissonDisk(sampler2D depths, vec2 uv, float compare, float bias){
        float result = 0.0;
        for (int i = 0; i < 4; i++) {
          // int index = int(mod((16.0 * random(gl_FragCoord.xyy, i)), 16.0));
          int index = int(mod((16.0 * random(floor(v_Position.xyz), i)), 16.0));
          for (int j = 0; j < 16; j++) {
            if (j == index) {
              result += texture2DCompare(depths, uv + vec2(uPoissonDisk[j * 2], uPoissonDisk[j * 2 + 1])/700.0, compare, bias);
              break;
            }
          }
        }
        return result / 4.0;
      }
    `;
    this.snippet.fragment.calculation = `
      return StratifiedPoissonDisk(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const poissonDisk = [
      -0.94201624, -0.39906216,
      0.94558609, -0.76890725,
      -0.094184101, -0.92938870,
      0.34495938, 0.29387760,
      -0.91588581, 0.45771432,
      -0.81544232, -0.87912464,
      -0.38277543, 0.27676845,
      0.97484398, 0.75648379,
      0.44323325, -0.97511554,
      0.53742981, -0.47373420,
      -0.26496911, -0.41893023,
      0.79197514, 0.19090188,
      -0.24188840, 0.99706507,
      -0.81409955, 0.91437590,
      0.19984126, 0.78641367,
      0.14383161, -0.14100790
    ];
    for (let i = 0; i < 32; i++) {
      setUniforms(gl, program, {
        [`uPoissonDisk[${i}]`]: poissonDisk[i]
      });
    }
  }
}