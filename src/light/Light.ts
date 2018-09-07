import { IShader } from '../shaders/Shader';
import { IShaderSnippet, IShaderSegment, DEFAULT_SHADER_SNIPPET } from '../shaders/ShaderSnippet';

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
  uniforms: {[name: string]: string};
  varyings: {[name: string]: string};
  generateSnippets(): void;
  setUniforms(shader: IShader): void;
}

let index = 0;
// https://gamedev.stackexchange.com/questions/56897/glsl-light-attenuation-color-and-intensity-formula
const DEFAULT_ATTENUATION = {
  constant: 1,
  linear: 0,
  quadratic: 0
};

export abstract class Light implements ILight {
  index: number;
  color: Vector;
  position: Vector;
  attenuation: Attenuation;
  shadowEnabled: boolean = false;
  uniforms: {[name: string]: string} = {};
  varyings: {[name: string]: string} = {};

  lightSnippet: IShaderSnippet = Object.assign({}, DEFAULT_SHADER_SNIPPET);
  shadowSnippet: IShaderSnippet = Object.assign({}, DEFAULT_SHADER_SNIPPET);

  public abstract generateSnippets(): void;

  constructor(options: LightOptions) {
    this.index = index++;
    Object.assign(this, options);
    this.attenuation = Object.assign({}, DEFAULT_ATTENUATION, options.attenuation);
  }

  setUniforms(shader: IShader) {}
}