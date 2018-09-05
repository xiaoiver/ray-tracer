let index = 0;

// https://gamedev.stackexchange.com/questions/56897/glsl-light-attenuation-color-and-intensity-formula
const DEFAULT_ATTENUATION = {
  constant: 1,
  linear: 0,
  quadratic: 0
};

export default class Light {
  constructor({color, position, attenuation} = {}) {
    this.index = index++;
    this.color = color;
    this.position = position;
    this.attenuation = Object.assign({}, DEFAULT_ATTENUATION, attenuation);
  }

  setUniforms(shader) {}
}