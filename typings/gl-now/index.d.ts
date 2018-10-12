declare module 'gl-now' {
  export class GameShell {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    on(event: string, callback: Function): void;
  }
  export default function createGLShell(options?: {}): GameShell;
}