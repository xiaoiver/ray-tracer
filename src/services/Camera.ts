import { injectable, inject } from 'inversify';
import { Matrix, Vector } from 'sylvester';

export interface ICameraService {
  eye: Vector;
  center: Vector;
  up: Vector;
  fovy: number;
  aspect: number;
  znear: number;
  zfar: number;

  projection: Matrix;
  view: Matrix;
  transform: Matrix;

  init(eye: Vector, fovy: number, aspect: number, znear: number, zfar: number): void;
  perspective(fovy: number, aspect: number, znear: number, zfar: number): Matrix;
  lookAt(eye: Vector, center: Vector, up: Vector): Matrix;

  /**
   * http://learnwebgl.brown37.net/07_cameras/camera_linear_motion.html
   */
  truck(distance: number): void;
  pedestal(distance: number): void;
  dolly(distance: number): void;
  tilt(angle: number): void;
  pan(angle: number): void;
  cant(angle: number): void;

  updateProjection(): void;
  updateTransform(): void;
}

@injectable()
export default class Camera implements ICameraService {
  eye: Vector;
  center: Vector;
  up: Vector;
  fovy: number;
  aspect: number;
  znear: number;
  zfar: number;
  projection: Matrix;
  view: Matrix;
  transform: Matrix= Matrix.I(4);

  constructor() {}

  init(eye: Vector, fovy: number, aspect: number, znear: number, zfar: number) {
    this.eye = eye;
    this.center = $V([0, 0, 0]);
    this.up = $V([0, 1, 0]);
    this.fovy = fovy;
    this.aspect = aspect;
    this.znear = znear;
    this.zfar = zfar;
    this.updateProjection();
    this.updateTransform();
  }

  /**
   * 
   * https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/opengl-perspective-projection-matrix
   * @param {*} fovy 
   * @param {*} aspect 
   * @param {*} znear 
   * @param {*} zfar 
   * @return {Matrix} projection matrix
   */
  perspective(fovy: number, aspect: number, znear: number, zfar: number) {
    const top = znear * Math.tan(fovy * Math.PI / 360.0);
    const bottom = -top;
    const left = bottom * aspect;
    const right = top * aspect;

    const X = 2 * znear / (right-left);
    const Y = 2 * znear / (top-bottom);
    const A = (right + left) / (right - left);
    const B = (top + bottom) / (top - bottom);
    const C = -(zfar + znear) / (zfar - znear);
    const D = -2 * zfar * znear / (zfar - znear);

    return $M([
      [X, 0, A, 0],
      [0, Y, B, 0],
      [0, 0, C, D],
      [0, 0, -1, 0]]);
  }

  lookAt(eye: Vector, center: Vector, up: Vector) {
    const z = eye.subtract(center).toUnitVector();
    const x = up.cross(z).toUnitVector();
    const y = z.cross(x).toUnitVector();

    const m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    const t = Matrix.Translation($V([-eye.e(1), -eye.e(2), -eye.e(3)]));

    return m.x(t);
  }

  /**
   * translate along u axis
   * 
   * @param {number} distance
   */
  truck(distance: number) {
    // Calculate the n camera axis
    const n = this.eye.subtract(this.center).toUnitVector();

    // Calculate the u camera axis
    let u = this.up.cross(n).toUnitVector();
    // Scale the u axis to the desired distance to move
    u = u.x(distance);

    // Add the direction vector to both the eye and center positions
    this.eye = this.eye.add(u);
    this.center = this.center.add(u);

    this.updateTransform();
  }

  /**
   * translate along v axis
   * 
   * @param {number} distance
   */
  pedestal(distance: number) {
    // Calculate the n camera axis
    const n = this.eye.subtract(this.center).toUnitVector();

    // Calculate the v camera axis
    const u = this.up.cross(n).toUnitVector();
    let v = n.cross(u).toUnitVector();
    // Scale the v axis to the desired distance to move
    v = v.x(distance);

    // Add the direction vector to both the eye and center positions
    this.eye = this.eye.add(v);
    this.center = this.center.add(v);

    this.updateTransform();
  }

  /**
   * translate along n axis
   * 
   * @param {number} distance
   */
  dolly(distance: number) {
    let n = this.eye.subtract(this.center).toUnitVector();

    n = n.x(distance);

    this.eye = this.eye.add(n);
    this.center = this.center.add(n);

    this.updateTransform();
  }

  /**
   * rotate along u axis
   * 
   * @param {number} angle
   */
  tilt(angle: number) {
    // Calculate the n camera axis
    const n = this.eye.subtract(this.center).toUnitVector();

    // Calculate the u camera axis
    const u = this.up.cross(n).toUnitVector();

    // Move the camera coordinate system to the origin. We only calculate
    // the center point because we are not going to change the eye point
    let newCenter = this.center.subtract(this.eye);

    // Create a rotation transform about u
    const tiltMatrix = Matrix.Rotation(angle, u);

    // Rotate the center point. Since this is a vector that has no location,
    // we only need to multiply by the rotation part of the transform.
    newCenter = tiltMatrix.x(newCenter);

    // Translate the center point back to the location of the camera.
    this.center = newCenter.add(this.eye);

    // If the angle between the line-of-sight and the "up vector" is less
    // than 10 degrees or greater than 170 degrees, then rotate the
    // "up_vector" about the u axis.
    // cos(10 degrees) = 0.985; cos(170 degrees) = -0.985
    if (Math.abs(n.dot(this.up)) >= 0.985) {
      this.up = tiltMatrix.x(this.up);
    }
    // Calculate a new camera transform
    this.updateTransform();
  }

  /**
   * rotate along v axis
   * 
   * @param {number} angle
   */
  pan(angle: number) {
    // Calculate the v camera axis
    const n = this.eye.subtract(this.center).toUnitVector();
    const u = this.up.cross(n).toUnitVector();
    let v = n.cross(u).toUnitVector();

    const panMatrix = Matrix.Rotation(angle, v);
    let newCenter = this.center.subtract(this.eye);
    newCenter = panMatrix.x(newCenter);
    this.center = newCenter.add(this.eye);

    if (Math.abs(n.dot(this.up)) >= 0.985) {
      this.up = panMatrix.x(this.up);
    }
    this.updateTransform();
  }

  /**
   * rotate along n axis
   * 
   * @param {number} angle
   */
  cant(angle: number) {
    const n = this.eye.subtract(this.center).toUnitVector();
    let newCenter = this.center.subtract(this.eye);
    const cantMatrix = Matrix.Rotation(angle, n);

    newCenter = cantMatrix.x(newCenter);
    this.center = newCenter.add(this.eye);
    this.up = cantMatrix.x(this.up);
    this.updateTransform();
  }

  updateTransform() {
    this.view = this.lookAt(this.eye, this.center, this.up);
    this.transform = this.projection.x(this.view);
  }

  updateProjection() {
    this.projection = this.perspective(this.fovy, this.aspect, this.znear, this.zfar);
  }
}