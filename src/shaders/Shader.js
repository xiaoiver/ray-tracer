import { Matrix, Vector } from 'sylvester';
import { setUniforms, initShaders } from '../utils/gl';

export default class Shader {
  constructor() {
    this.inited = false;
  }

  init(gl, scene) {
    this.gl = gl;
    const {vertexShader, fragmentShader} = this.generateShaders(scene);
    if (!initShaders(gl, vertexShader, fragmentShader)) {
      console.log('Failed to intialize shaders.');
      return;
    }
    this.inited = true;
  }

  generateShaders(scene) {}

  draw(scene, camera) {}

  setVertexAttribute(attribute, data, num, type) {
    const gl = this.gl;
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
      console.log('Failed to create the buffer object');
      return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
  
    return true;
  }
  
  setUniforms(uniforms) {
    const gl = this.gl;
    let program = gl.program;
    for (let name in uniforms) {
      const value = uniforms[name];
      const location = gl.getUniformLocation(program, name);
      if (location == null) continue;
      if (value instanceof Vector) {
        gl.uniform3fv(location, new Float32Array([value.elements[0], value.elements[1], value.elements[2]]));
      } else if(value instanceof Matrix) {
        gl.uniformMatrix4fv(location, false, new Float32Array(value.flatten()));
      } else {
        gl.uniform1f(location, value);
      }
    }
  }
}