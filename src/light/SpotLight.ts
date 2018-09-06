import { Light, LightOptions } from './Light';
import {
  UNIFORM_SPOT_LIGHT_COLOR,
  UNIFORM_SPOT_LIGHT_POSITION,
  UNIFORM_SPOT_LIGHT_DIRECTION
} from '../constants/index';
import Shader from '../shaders/Shader';

interface SpotLightOptions extends LightOptions {
  direction?: Vector;
  angle?: number;
  exponent?: number;
  blur?: number;
};

// https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-spot.html
export default class SpotLight extends Light {
  direction: Vector;
  angle: number;
  exponent: number;
  blur: number;

  uColor: string;
  uPosition: string;
  uDirection: string;
  vColor: string;

  constructor(options: SpotLightOptions) {
    super(options);
    const {direction = this.position, angle = 14, exponent = 40, blur = 5} = options;
    this.direction = direction;
    this.angle = angle;
    this.exponent = exponent;
    this.blur = blur;

    this.uColor = `${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`;
    this.uPosition = `${UNIFORM_SPOT_LIGHT_POSITION}${this.index}`;
    this.uDirection = `${UNIFORM_SPOT_LIGHT_DIRECTION}${this.index}`;
    this.vColor = `v_${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`;
  }

  declare() {
    return `
      uniform vec3 ${this.uColor};
      uniform vec3 ${this.uPosition};
      uniform vec3 ${this.uDirection};
    `;
  }

  calculate() {
    const i = this.index;
    return `
      vec3 lightDirection${i} = ${this.uPosition} - v_Position;
      vec3 nLightDirection${i} = normalize(lightDirection${i});
      vec3 nCameraDirection${i} = normalize(u_CameraPosition - v_Position);
      float nDotL${i} = max(dot(normal, nLightDirection${i}), 0.0);
      float spotEffect${i} = dot(normalize(${this.uDirection}), -nLightDirection${i});
      float spotCosCutoff${i} = cos(${this.angle.toFixed(5)} / 180.0 * PI);
      float spotCosInnerCutoff${i} = cos(${(this.angle - this.blur).toFixed(5)} / 180.0 * PI);
      if (spotEffect${i} > spotCosCutoff${i}) {
        spotEffect${i} = pow(smoothstep(spotCosCutoff${i},spotCosInnerCutoff${i},spotEffect${i}), ${this.exponent.toFixed(5)});
      } else {
        spotEffect${i} = 0.0;
      }
      float specular${i} = 0.0;
      if (nDotL${i} > 0.0) {
        specular${i} = pow(max(dot(reflect(-nLightDirection${i}, normal), nCameraDirection${i}), 0.0), 120.0);
      }
      vec3 ${this.vColor} = ${this.uColor} * v_Color.rgb * nDotL${i}
        * attenuation(lightDirection${i},
          ${this.attenuation.constant.toFixed(5)},
          ${this.attenuation.linear.toFixed(5)},
          ${this.attenuation.quadratic.toFixed(5)})
        * spotEffect${i} + specular${i};
    `;
  }

  result() {
    return `${this.vColor}`;
  }

  setUniforms(shader: Shader) {
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position,
      [this.uDirection]: this.direction
    });
  }
}
