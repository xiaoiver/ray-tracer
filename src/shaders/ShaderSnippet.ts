export interface IShaderSegment {
  declaration: string;
  calculation: string;
  result: string;
}

export interface IShaderSnippet {
  vertex: IShaderSegment;
  fragment: IShaderSegment;
}

const DEFAULT_SHADER_SEGMENT = {
  declaration: '',
  calculation: '',
  result: ''
};

export const DEFAULT_SHADER_SNIPPET = {
  vertex: DEFAULT_SHADER_SEGMENT,
  fragment: DEFAULT_SHADER_SEGMENT
};

export default class ShaderSnippet implements IShaderSnippet {
  vertex: IShaderSegment = DEFAULT_SHADER_SEGMENT;
  fragment: IShaderSegment = DEFAULT_SHADER_SEGMENT;
  constructor() {

  }
}