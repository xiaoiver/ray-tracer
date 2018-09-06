import { UNIFORM_AMBIENT_LIGHT_COLOR } from '../constants/index';
import { LightOptions, Light } from './Light';
import Shader from '../shaders/Shader';

interface AmbientLightOptions extends LightOptions {};

export default class AmbientLight extends Light {
  uColor: string;
  vColor: string;

  constructor(options: AmbientLightOptions) {
    super(options);
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

  setUniforms(shader: Shader) {
    shader.setUniforms({
      [this.uColor]: this.color
    });
  }
}