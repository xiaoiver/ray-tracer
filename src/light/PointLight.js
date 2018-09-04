import Light from './Light';
import {UNIFORM_POINT_LIGHT_COLOR, UNIFORM_POINT_LIGHT_POSITION} from '../constants';

export default class PointLight extends Light {
  constructor({color, position}) {
    super();
    this.color = color;
    this.position = position;
    this.uColor = `${UNIFORM_POINT_LIGHT_COLOR}${this.index}`;
    this.uPosition = `${UNIFORM_POINT_LIGHT_POSITION}${this.index}`;
  }

  declare() {
    return `
      uniform vec3 ${this.uColor};
      uniform vec3 ${this.uPosition};
    `;
  }

  calculate() {
    return `
      vec3 lightDirection${this.index} = normalize(${this.uPosition} - v_Position);
      float nDotL = max(dot(lightDirection, normal), 0.0);
      vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;
    ${this.uColor} * v_Color.rgb`;
    
    
    
  }

  setUniforms(shader) {
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position
    });
  }
}