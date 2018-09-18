import { Matrix, Vector } from 'sylvester';

export function getWebGLContext(canvas: HTMLCanvasElement) {
  const names = ['webgl', 'experimental-webgl'];
  let context = null;
  for (var i = 0; i < names.length; ++i) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  return context;
}

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  // Create shader object
  const shader = gl.createShader(type);
  if (shader == null) {
    console.log('Failed to create shader.');
    return null;
  }

  // Set the shader program
  gl.shaderSource(shader, source);

  // Compile the shader
  gl.compileShader(shader);

  // Check the result of compilation
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    const error = gl.getShaderInfoLog(shader);
    console.log('Failed to compile shader: ' + error);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vshader: string, fshader: string) {
  // Create shader object
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  // Create a program object
  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  // Attach the shader objects
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // Link the program object
  gl.linkProgram(program);

  // Check the result of linking
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    const error = gl.getProgramInfoLog(program);
    console.log('Failed to link program: ' + error);
    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    return null;
  }
  return program;
}

export function initShaders(gl: WebGLRenderingContext, vshader: string, fshader: string) {
  const program = createProgram(gl, vshader, fshader);
  if (!program) {
    console.log('Failed to create program.');
    return false;
  }

  gl.useProgram(program);

  return program;
}

export function setVertexAttribute(gl: WebGLRenderingContext, program: WebGLProgram, attribute: string, data: any, num: number, type: number) {
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
  var a_attribute = gl.getAttribLocation(program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

export function setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, uniforms: any, type?: string) {
  for (let name in uniforms) {
    const value = uniforms[name];
    // console.log('[set uniform]', name, value);
    const location = gl.getUniformLocation(program, name);
    if (location == null) continue;
    if (value instanceof Vector) {
      gl.uniform3fv(location, new Float32Array([value.elements[0], value.elements[1], value.elements[2]]));
    } else if (value instanceof Matrix) {
      gl.uniformMatrix4fv(location, false, new Float32Array(value.flatten()));
    } else if (value % 1 === 0 && type === 'int') {
      // https://stackoverflow.com/questions/3885817/how-do-i-check-that-a-number-is-float-or-integer
      gl.uniform1i(location, value);
    } else {
      gl.uniform1f(location, value);
    }
  }
}
