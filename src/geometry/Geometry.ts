import { Matrix } from 'sylvester';

export interface GeometryOptions {}

export abstract class Geometry {
  vertices: Float32Array;
  normals: Float32Array;
  textureCoords: Float32Array;
  indices: Uint8Array | Uint16Array;
  modelMatrix: Matrix;
  protected abstract setVertices(): void;
  protected abstract setModelMatrix(): void;

  constructor(options: Partial<GeometryOptions>) {
    Object.assign(this, options);
    this.modelMatrix = Matrix.I(4);
  }

  init() {
    this.setVertices();
    this.setModelMatrix();
  }

  /**
   * pay attention to the order to multiply matrices
   * 
   * https://gamedev.stackexchange.com/questions/16719/what-is-the-correct-order-to-multiply-scale-rotation-and-translation-matrices-f
   * @param {Vector} v translation vector
   * @return {Geometry} self
   */
  translate(v: Vector) {
    this.modelMatrix = Matrix.Translation(v).x(this.modelMatrix);
    return this;
  }

  /**
   * pay attention to the order to multiply matrices
   * 
   * @param {Vector} v scale vector
   * @return {Geometry} self
   */
  scale(v: Vector) {
    this.modelMatrix = Matrix.Diagonal(v.elements.concat(1)).x(this.modelMatrix);
    return this;
  }

  /**
   * pay attention to the order to multiply matrices
   * 
   * @param {number} angle rotation angle
   * @param {Vector} axis rotation axis
   * @return {Geometry} self
   */
  rotate(angle: number, axis: Vector) {
    this.modelMatrix = Matrix.Rotation(angle, axis).ensure4x4().x(this.modelMatrix);
    return this;
  }

  draw(gl: WebGLRenderingContext) {
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    /**
     * pay attention to the `type` param
     * (Uint32Array -> gl.UNSIGNED_INT)
     * Sphere(Uint16Array -> gl.UNSIGNED_SHORT)
     * Cube(Uint8Array -> gl.UNSIGNED_BYTE)
     */
    let type;
    if (this.indices.BYTES_PER_ELEMENT === 4) {
      type =  gl.UNSIGNED_INT;
    } else if (this.indices.BYTES_PER_ELEMENT === 2) {
      type = gl.UNSIGNED_SHORT;
    } else if (this.indices.BYTES_PER_ELEMENT === 1) {
      type = gl.UNSIGNED_BYTE;
    }
    gl.drawElements(gl.TRIANGLES, this.indices.length, type, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}