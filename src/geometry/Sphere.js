// import U_SPHERE from '../constants';
import { setUniforms } from '../utils/gl';

export default class Sphere {
  constructor({center, radius, surfaceColor = $V([1.0, 0.0, 0.0])}) {
    this.center = center;
    this.radius = radius;
    this.surfaceColor = surfaceColor;
  }

  init(gl, i) {
    setUniforms(gl, {
      [`u_Spheres[${i}].center`]: this.center,
      [`u_Spheres[${i}].radius`]: this.radius,
      [`u_Spheres[${i}].surfaceColor`]: this.surfaceColor
    });
  }
}