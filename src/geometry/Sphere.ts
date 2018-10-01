import { Matrix } from 'sylvester';
import { GeometryOptions, Geometry } from './Geometry';

interface SphereOptions extends GeometryOptions {
  center?: Vector;
  radius?: number;
}

const DEFAULT_SPHERE_OPTIONS : SphereOptions = {
  center: $V([0.0, 0.0, 0.0]),
  radius: 1
};

export default class Sphere extends Geometry {
  center: Vector;
  radius: number;

  constructor(options: SphereOptions = DEFAULT_SPHERE_OPTIONS) {
    super(options);
    Object.assign(this, options);
  }

  setVertices() {
    const SPHERE_DIV = 23;

    let i, ai, si, ci;
    let j, aj, sj, cj;
    let p1, p2;

    let positions = [];
    let indices = [];

    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++) {
      aj = j * Math.PI / SPHERE_DIV;
      sj = Math.sin(aj);
      cj = Math.cos(aj);
      for (i = 0; i <= SPHERE_DIV; i++) {
        ai = i * 2 * Math.PI / SPHERE_DIV;
        si = Math.sin(ai);
        ci = Math.cos(ai);

        positions.push(si * sj);  // X
        positions.push(cj);       // Y
        positions.push(ci * sj);  // Z
      }
    }

    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++) {
      for (i = 0; i < SPHERE_DIV; i++) {
        p1 = j * (SPHERE_DIV+1) + i;
        p2 = p1 + (SPHERE_DIV+1);

        indices.push(p1);
        indices.push(p2);
        indices.push(p1 + 1);

        indices.push(p1 + 1);
        indices.push(p2);
        indices.push(p2 + 1);
      }
    }

    this.vertices = new Float32Array(positions);
    this.normals = new Float32Array(positions);
    this.indices = new Uint16Array(indices);

    this.textureCoords = this.vertices.filter((v, i) => i % 3 !== 1).map(v => v / 2 + 0.5);
  }

  setModelMatrix() {
    this.scale($V(new Array<number>(3).fill(this.radius)));
    this.translate(this.center);
  }

  // init(gl, i) {
  //   setUniforms(gl, {
  //     [`u_Spheres[${i}].center`]: this.center,
  //     [`u_Spheres[${i}].radius`]: this.radius,
  //     [`u_Spheres[${i}].surfaceColor`]: this.surfaceColor
  //   });
  // }
}