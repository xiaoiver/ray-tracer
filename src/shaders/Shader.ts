import { Matrix, Vector } from 'sylvester';
import { initShaders } from '../utils/gl';
import Camera from '../Camera';
import Scene from '../Scene';

export interface IShader {
  gl: WebGLRenderingContext;
  program?: WebGLProgram;
  inited: boolean;
  init(gl: WebGLRenderingContext, scene: Scene): void;
  setVertexAttribute(attribute: string, data: any, num: number, type: number): boolean;
  setUniforms(uniforms: any): void;
}

export default abstract class Shader implements IShader {
  inited: boolean;
  gl: WebGLRenderingContext;
  program: WebGLProgram;

  protected abstract generateShaders(scene: Scene): {
    vertexShader: string;
    fragmentShader: string;
  };

  public abstract draw(scene: Scene, camera: Camera): void;

  constructor() {
    this.inited = false;
  }

  init(gl: WebGLRenderingContext, scene: Scene) {
    this.gl = gl;
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    this.initShaders(scene);
    this.inited = true;
  }

  initShaders(scene: Scene) {
    const { vertexShader, fragmentShader } = this.generateShaders(scene);
    this.program = initShaders(this.gl, vertexShader, fragmentShader);
    if (!this.program) {
      console.log('Failed to intialize shaders.');
    }
  }

  setVertexAttribute(attribute: string, data: any, num: number, type: number) {
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
    var a_attribute = gl.getAttribLocation(this.program, attribute);
    if (a_attribute < 0) {
      console.log('Failed to get the storage location of ' + attribute);
      return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
  
    return true;
  }
  
  setUniforms(uniforms: any) {
    const gl = this.gl;
    for (let name in uniforms) {
      const value = uniforms[name];
      const location = gl.getUniformLocation(this.program, name);
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