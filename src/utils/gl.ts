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
