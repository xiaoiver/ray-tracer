// Type definitions for gl-shader 4.2
// Project: https://github.com/stackgl/gl-shader
// Definitions by: Mathias Paumgarten <https://github.com/MathiasPaumgarten>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

declare module 'gl-shader' {
  interface Parameter {
    type: string;
    name: string;
  }

  interface Attribute {
    location: number[] | number;
    pointer(type?: number, normalized?: boolean, stride?: number, offset?: number): number;
  }

  export class Shader {
    readonly gl: WebGLRenderingContext;
    readonly program: WebGLProgram;
    readonly vertShader: WebGLShader;
    readonly fragShader: WebGLShader;
    readonly attributes: {[key: string]: Attribute & any[]};

    uniforms: {[key: string]: any};

    constructor(gl: WebGLRenderingContext);

    bind(): void;
    dispose(): void;

    update(vertex: string, fragment: string, uniforms?: Parameter[], attributes?: Parameter[]): void;
    update(obj: {vertex: string, fragment: string, uniforms: Parameter[], attributes: Parameter[]}): void;
  }

  export default function createShader(
    gl: WebGLRenderingContext,
    vertex: string,
    fragment: string,
    uniforms?: Parameter[],
    attributes?: Parameter[]): Shader;

  export default function createShader(
    gl: WebGLRenderingContext,
    options: {
        vertex: string,
        fragment: string,
        uniforms?: Parameter[],
        attributes?: Parameter[],
    }): Shader;
}
