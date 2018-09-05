import Light from './Light';
import {UNIFORM_POINT_LIGHT_COLOR, UNIFORM_POINT_LIGHT_POSITION} from '../constants';

export default class PointLight extends Light {
  constructor(options) {
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
      vec3 ${vLightDirection} = vec3(u_fViewMatrix * vec4(${this.uPosition}, 1.0)) - v_Position;
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

  setUniforms(shader) {
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position
    });
  }
}