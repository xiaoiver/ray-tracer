import { setUniforms } from '../../utils/gl';
import Shadow from "./Shadow";

// http://www.sunandblackcat.com/tipFullView.php?l=eng&topicid=35
export default class RotatedPoissonDisk extends Shadow {
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
      uniform float uPoissonDisk[8];
      float random(vec3 seed, int i) {
        vec4 seed4 = vec4(seed,i);
        float dot_product = dot(seed4, vec4(12.9898,78.233,45.164,94.673));
        return fract(sin(dot_product) * 43758.5453);
      }
      float RotatedPoissonDisk(sampler2D depths, vec2 uv, float compare, float bias){
        float result = 0.0;
        for (int i = 0; i < 4; i++) {
          float angle = 2.0 * PI * random(floor(v_Position.xyz * 1000.0), i);
          float s = sin(angle);
          float c = cos(angle);

          vec2 rotatedOffset = vec2(uPoissonDisk[i * 2] * c + uPoissonDisk[i * 2 + 1] * s, 
            uPoissonDisk[i * 2] * -s + uPoissonDisk[i * 2 + 1] * c);

          result += texture2DCompare(depths, uv + rotatedOffset/2048.0, compare, bias);
        }
        return result / 4.0;
      }
    `;
    this.snippet.fragment.calculation = `
      return RotatedPoissonDisk(depths, shadowCoord.xy, shadowCoord.z, bias);
    `;
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    const poissonDisk = [
      -0.94201624, -0.39906216,
      0.94558609, -0.76890725,
      -0.094184101, -0.92938870,
      0.34495938, 0.29387760
    ];
    for (let i = 0; i < 32; i++) {
      setUniforms(gl, program, {
        [`uPoissonDisk[${i}]`]: poissonDisk[i]
      });
    }
  }
}