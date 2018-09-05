import { Matrix } from 'sylvester';

export default class Geometry {
  constructor({color = $V([1, 1, 1])} = {}) {
    this.color = color;
    this.modelMatrix = Matrix.I(4);
  }

  init() {
    this.setVertices();
    this.setModelMatrix();
    this.setColors();
  }

  /**
   * @override
   */
  setVertices() {}

  /**
   * @override
   */
  setColors() {
    this.colors = this.vertices.map((v, i) => this.color.e(i % 3 + 1));
  }

  /**
   * @override
   */
  setModelMatrix() {}

  /**
   * pay attention to the order to multiply matrices
   * 
   * https://gamedev.stackexchange.com/questions/16719/what-is-the-correct-order-to-multiply-scale-rotation-and-translation-matrices-f
   * @param {Vector} v translation vector
   * @return {Geometry} self
   */
  translate(v) {
    this.modelMatrix = Matrix.Translation(v).x(this.modelMatrix);
    return this;
  }

  /**
   * pay attention to the order to multiply matrices
   * 
   * @param {Vector} v scale vector
   * @return {Geometry} self
   */
  scale(v) {
    this.modelMatrix = Matrix.Diagonal(v.elements.concat(1)).x(this.modelMatrix);
    return this;
  }

  /**
   * pay attention to the order to multiply matrices
   * 
   * @param {number} angle rotation angle
   * @param {Line} axis rotation axis
   * @return {Geometry} self
   */
  rotate(angle, axis) {
    this.modelMatrix = Matrix.Rotation(angle, axis).x(this.modelMatrix);
    return this;
  }

  draw(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    /**
     * pay attention to the `type` param
     * Sphere(Uint16Array -> gl.UNSIGNED_SHORT)
     * Cube(Uint8Array -> gl.UNSIGNED_BYTE)
     */
    const type = this.indices.length > 256 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_BYTE;
    gl.drawElements(gl.TRIANGLES, this.indices.length, type, 0);
  }
}