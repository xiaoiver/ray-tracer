import { IShader } from '../shaders/Shader';

interface Attenuation {
  constant?: number;
  linear?: number;
  quadratic?: number;
}

export interface LightOptions {
  color: Vector;
  position?: Vector;
  attenuation?: Attenuation
  shadowEnabled?: boolean;
}

export interface ILight extends LightOptions {
  readonly index: number;
  setUniforms(shader: IShader): void;
}

interface ILightShader {
  declare(): string;
  calculate(): string;
  result(): string;
}

let index = 0;
// https://gamedev.stackexchange.com/questions/56897/glsl-light-attenuation-color-and-intensity-formula
const DEFAULT_ATTENUATION = {
  constant: 1,
  linear: 0,
  quadratic: 0
};

export abstract class Light implements ILight, ILightShader {
  index: number;
  color: Vector;
  position: Vector;
  attenuation: Attenuation;
  shadowEnabled: boolean = false;
  public abstract declare(): string;
  public abstract calculate(): string;
  public abstract result(): string;

  constructor(options: LightOptions) {
    this.index = index++;
    Object.assign(this, options);
    this.attenuation = Object.assign({}, DEFAULT_ATTENUATION, options.attenuation);
  }

  setUniforms(shader: IShader) {}
}