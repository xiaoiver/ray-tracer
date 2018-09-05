// import U_SPHERE from '../constants';
import { Matrix } from 'sylvester';
import Geometry from './Geometry';

export default class Sphere extends Geometry {
  constructor(options = {}) {
    super(options);
    let {center = $V([0.0, 0.0, 0.0]), radius = 1} = options;
    this.center = center;
    this.radius = radius;
  }

  setVertices() {
    const SPHERE_DIV = 13;

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
  }

  setModelMatrix() {
    this.scale($V(new Array(3).fill(this.radius)));
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