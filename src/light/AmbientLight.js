import Light from './Light';
import {UNIFORM_AMBIENT_LIGHT_COLOR} from '../constants';

export default class AmbientLight extends Light {
  constructor({color}) {
    super();
    this.color = color;
    this.uColor = `${UNIFORM_AMBIENT_LIGHT_COLOR}${this.index}`;
  }

  declare() {
    return `uniform vec3 ${this.uColor};`;
  }

  calculate() {
    return `${this.uColor} * v_Color.rgb`;
  }

  setUniforms(shader) {
    shader.setUniforms({
      [this.uColor]: this.color
    });
  }
}