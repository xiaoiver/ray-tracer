import { Light, LightOptions } from './Light';
import { UNIFORM_POINT_LIGHT_COLOR, UNIFORM_POINT_LIGHT_POSITION } from '../constants/index';
import Shader from '../shaders/Shader';

interface PointLightOptions extends LightOptions {};

export default class PointLight extends Light {
  uColor: string;
  uPosition: string;
  vColor: string;
  shadowEnabled: boolean = true;

  constructor(options: PointLightOptions) {
    super(options);

    this.uColor = `${UNIFORM_POINT_LIGHT_COLOR}${this.index}`;
    this.uPosition = `${UNIFORM_POINT_LIGHT_POSITION}${this.index}`;
    this.vColor = `v_${UNIFORM_POINT_LIGHT_POSITION}${this.index}`;
  }

  declare() {
    return `
      uniform vec3 ${this.uColor};
      uniform vec3 ${this.uPosition};
    `;
  }

  calculate() {
    const vLightDirection = `lightDirection${this.index}`;
    const vNDotL = `nDotL${this.index}`;
    return `
      vec3 ${vLightDirection} = ${this.uPosition} - v_Position;
      vec3 n${vLightDirection} = normalize(${vLightDirection});
      float ${vNDotL} = max(dot(n${vLightDirection}, normal), 0.0);
      vec3 ${this.vColor} = ${this.uColor} * v_Color.rgb * ${vNDotL}
        * attenuation(${vLightDirection},
          ${this.attenuation.constant.toFixed(5)},
          ${this.attenuation.linear.toFixed(5)},
          ${this.attenuation.quadratic.toFixed(5)});
    `;
  }

  result() {
    return `${this.vColor}`;
  }

  setUniforms(shader: Shader) {
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position
    });
  }
}