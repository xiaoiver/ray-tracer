import { GeometryOptions, Geometry } from './Geometry';

interface PlaneOptions extends GeometryOptions {
  center?: Vector;
  width?: number;
  height?: number;
}

const DEFAULT_PLANE_OPTIONS : PlaneOptions = {
  width: 2,
  height: 2,
  center: $V([0.0, 0.0, 0.0])
};

export default class Plane extends Geometry {
  center: Vector;
  width: number;
  height: number;

  constructor(options: PlaneOptions = DEFAULT_PLANE_OPTIONS) {
    super(options);
    Object.assign(this, DEFAULT_PLANE_OPTIONS, options);
  }

  setVertices() {
    this.vertices = new Float32Array([
      1.0, 0.0, 1.0,  1.0, 0.0, -1.0,  -1.0, 0, -1.0,   -1.0, 0, 1.0
    ]);

    this.normals = new Float32Array([
      0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0
    ]);

    this.indices = new Uint8Array([
      0, 1, 2, 0, 2, 3
    ]);
  }

  setModelMatrix() {
    this.scale($V([this.width / 2, 1, this.height / 2]));
    this.translate(this.center);
  }
}