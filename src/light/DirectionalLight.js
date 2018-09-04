import Light from './Light';
import {UNIFORM_AMBIENTLIGHT} from '../constants';

export default class DirectionalLight extends Light {
  constructor({color, position, direction}) {
    super();
    this.color = color;
    this.position = position;
    this.direction = direction;
  }

  declare(i) {
    return `uniform vec3 ${UNIFORM_AMBIENTLIGHT}${i};`;
  }

  calculate(i) {
    return `${UNIFORM_AMBIENTLIGHT}${i} * v_Color.rgb`;
  }

  setUniforms(shader) {
    shader.setUniforms({
      [UNIFORM_AMBIENTLIGHT]: this.color
    });
  }
}