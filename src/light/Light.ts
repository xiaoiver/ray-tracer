import LightModel from './models/LightModel';

export interface LightOptions {
  color: Vector;
  position: Vector;
  model: Partial<LightModel>;
}

export interface ILight extends LightOptions {
  readonly index: number;
  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, namespace: string): void;
}

let index = 0;

export abstract class Light implements ILight {
  index: number;
  type: string;
  declaration: string = '';
  color: Vector = $V([1, 1, 1]);
  position: Vector = $V([0, 0, 0]);
  model: Partial<LightModel> = new LightModel({});

  constructor(options: Partial<LightOptions>) {
    this.index = index++;
    Object.assign(this, options);
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, namespace: string) {}
}