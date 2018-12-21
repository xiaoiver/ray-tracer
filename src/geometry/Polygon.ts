import { Matrix } from 'sylvester';
import { Geometry } from './Geometry';

export default class Polygon extends Geometry {
  // @ts-ignore
  constructor(options) {
    super(options);
    Object.assign(this, options);
  }

  setVertices() {}

  setModelMatrix() {}
}