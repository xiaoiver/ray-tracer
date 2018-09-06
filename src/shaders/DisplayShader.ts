import { Matrix, Vector } from 'sylvester';
import Camera from '../Camera';
import Scene from '../Scene';
import Shader from './Shader';

export default class CubeShader extends Shader {
  constructor() {
    super();
  }

  generateShaders(scene: Scene) {
    let vertexShader = `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;
      uniform mat4 u_MVPMatrix;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_NormalMatrix;
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      void main() {
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = vec3(u_NormalMatrix * a_Normal);
        v_Color = a_Color;
        gl_Position = u_MVPMatrix * a_Position;
      }
    `;

    let lightsDeclarations : Array<string> = [];
    let lightsCalculations : Array<string> = [];
    // ambient + diffuse + specular
    let lightsResults : Array<string> = [];
    scene.lights.forEach(light => {
      lightsDeclarations.push(light.declare());
      lightsCalculations.push(light.calculate());
      lightsResults.push(light.result());
    });

    let fragmentShader = `
      #ifdef GL_ES
      precision mediump float;
      #endif
      #define PI 3.141592653589793
      uniform mat4 u_fViewMatrix;
      uniform vec3 u_CameraPosition;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec4 v_Color;
      ${lightsDeclarations.join('')}

      float attenuation(vec3 dir, float constant, float linear, float quadratic){
        float distance = length(dir);
        float radiance = 1.0 / (constant + distance * linear + pow(distance, 2.0) * quadratic);
        return clamp(radiance, 0.0, 1.0);
      }

      void main() {
        vec3 normal = normalize(v_Normal);
        ${lightsCalculations.join('')}
        gl_FragColor = vec4(${lightsResults.join('+')}, v_Color.a);
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw(scene: Scene, camera: Camera, canvas: HTMLCanvasElement) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    scene.lights.forEach(light => {
      light.setUniforms(this);
    });

    let vpMatrix = camera.transform;
    scene.objects.forEach(mesh => {
      let {vertices, colors, normals, modelMatrix} = mesh.geometry;
      let mvpMatrix = vpMatrix.x(modelMatrix);
      let normalMatrix = modelMatrix.inverse().transpose();

      this.setUniforms({
        'u_MVPMatrix': mvpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_NormalMatrix': normalMatrix,
        'u_CameraPosition': camera.eye
      });

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Color', colors, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Normal', normals, 3, gl.FLOAT)) return -1;

      mesh.geometry.draw(gl);
    });
  }
}