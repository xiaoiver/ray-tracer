interface Attenuation {
  constant: number;
  linear: number;
  quadratic: number;
}

interface LightModelOptions {
  ambient: Vector;
  diffuse: Vector;
  specular: Vector;
  attenuation: Partial<Attenuation>;
}

// https://gamedev.stackexchange.com/questions/56897/glsl-light-attenuation-color-and-intensity-formula
const DEFAULT_ATTENUATION = {
  constant: 1.0,
  linear: 0.0,
  quadratic: 0.0
};

export default class LightModel implements LightModelOptions {
  ambient: Vector = $V([0.2, 0.2, 0.2]);
  diffuse: Vector = $V([1, 1, 1]);
  specular: Vector = $V([1, 1, 1]);
  attenuation: Partial<Attenuation>;

  constructor(options: Partial<LightModelOptions>) {
    Object.assign(this, options);
    this.attenuation = Object.assign({}, DEFAULT_ATTENUATION, options.attenuation);
  }
}