import Light from './Light';
import UNIFORM_AMBIENTLIGHT from '../constants';

export default class AmbientLight extends Light{
  constructor(color) {
    super();
    this.color = color;
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