import * as s from 'sylvester';

declare global {
  const Vector: typeof s.Vector;
  type Vector = s.Vector;
  const Matrix: typeof s.Matrix;
  type Matrix = s.Matrix;
  const Line: typeof s.Line;
  type Line = s.Line;
  const Plane: typeof s.Plane;
  type Plane = s.Plane;
  const Sylvester: typeof s.Sylvester;

  const $V: typeof Vector.create;
  const $P: typeof Plane.create;
  const $M: typeof Matrix.create;
  const $L: typeof Line.create;

  // https://github.com/Microsoft/TypeScript/issues/3889
  export interface ObjectConstructor {
    assign(target: any, ...sources: any[]): any;
  }

  // https://stackoverflow.com/questions/29785881/how-to-create-an-array-of-zeros-in-typescript
  export interface Array<T> {
    fill(value: T): Array<T>;
  }

  const PUBLIC_PATH: string;
}

