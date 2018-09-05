import Light from './Light';
import {UNIFORM_AMBIENT_LIGHT_COLOR} from '../constants';

export default class AmbientLight extends Light {
  constructor(options) {
    super(options);
    this.color = options.color;
    this.uColor = `${UNIFORM_AMBIENT_LIGHT_COLOR}${this.index}`;
    this.vColor = `v_${UNIFORM_AMBIENT_LIGHT_COLOR}${this.index}`;
  }

  declare() {
    return `uniform vec3 ${this.uColor};`;
  }

  calculate() {
    return `vec3 ${this.vColor} = ${this.uColor} * v_Color.rgb;`;
  }

  result() {
    return `${this.vColor}`;
  }

  setUniforms(shader) {
    shader.setUniforms({
      [this.uColor]: this.color
    });
  }
}