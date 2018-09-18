import { GeometryOptions, Geometry } from './Geometry';

interface TriangleOptions extends GeometryOptions {
  p1: Vector;
  p2: Vector;
  p3: Vector;
}

export default class Triangle extends Geometry {
  p1: Vector;
  p2: Vector;
  p3: Vector;

  constructor(options: TriangleOptions) {
    super(options);
    Object.assign(this, options);
  }

  setVertices() {
    this.vertices = new Float32Array([
      this.p1.e(1), this.p1.e(2), this.p1.e(3),
      this.p2.e(1), this.p2.e(2), this.p2.e(3),
      this.p3.e(1), this.p3.e(2), this.p3.e(3)
    ]);

    const v21 = this.p2.subtract(this.p1);
    const v31 = this.p3.subtract(this.p1);
    const normal = v21.cross(v31).toUnitVector();

    this.normals = new Float32Array([
      normal.e(1), normal.e(2), normal.e(3),
      normal.e(1), normal.e(2), normal.e(3),
      normal.e(1), normal.e(2), normal.e(3)
    ]);

    this.indices = new Uint8Array([
      0, 1, 2
    ]);

    this.textureCoords = this.vertices.filter((v, i) => i % 3 !== 1).map(v => v / 2 + 0.5);
  }

  setModelMatrix() {}
}