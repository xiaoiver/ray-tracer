import { GeometryOptions, Geometry } from './Geometry';

interface PlaneOptions extends GeometryOptions {
  center?: Vector;
  width?: number;
  height?: number;
  p1?: Vector;
  p2?: Vector;
  p3?: Vector;
  p4?: Vector;
}

const DEFAULT_PLANE_OPTIONS : PlaneOptions = {
  width: 2,
  height: 2,
  center: $V([0.0, 0.0, 0.0])
};

export default class Plane extends Geometry {
  center?: Vector;
  width?: number;
  height?: number;
  p1?: Vector;
  p2?: Vector;
  p3?: Vector;
  p4?: Vector;

  constructor(options: PlaneOptions) {
    super(options);
    Object.assign(this, DEFAULT_PLANE_OPTIONS, options);
  }

  setVertices() {
    if (this.p1) {
      this.vertices = new Float32Array([
        this.p1.e(1), this.p1.e(2), this.p1.e(3),
        this.p2.e(1), this.p2.e(2), this.p2.e(3),
        this.p3.e(1), this.p3.e(2), this.p3.e(3),
        this.p4.e(1), this.p4.e(2), this.p4.e(3)
      ]);

      const v21 = this.p2.subtract(this.p1);
      const v31 = this.p3.subtract(this.p1);
      const normal = v21.cross(v31).toUnitVector();
  
      this.normals = new Float32Array([
        normal.e(1), normal.e(2), normal.e(3),
        normal.e(1), normal.e(2), normal.e(3),
        normal.e(1), normal.e(2), normal.e(3),
        normal.e(1), normal.e(2), normal.e(3)
      ]);
    } else {
      this.vertices = new Float32Array([
        1.0, 0.0, 1.0,  1.0, 0.0, -1.0,  -1.0, 0, -1.0,   -1.0, 0, 1.0
      ]);

      this.normals = new Float32Array([
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0
      ]);
    }

    this.indices = new Uint8Array([
      0, 1, 2, 0, 2, 3
    ]);
  }

  setModelMatrix() {
    if (this.p1) {

    } else {
      this.scale($V([this.width / 2, 1, this.height / 2]));
      this.translate(this.center);
    }
  }
}