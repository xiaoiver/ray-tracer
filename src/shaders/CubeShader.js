import { Matrix, Vector } from 'sylvester';
import Shader from './Shader';

export default class CubeShader extends Shader {
  constructor() {
    super();
  }

  generateShaders(scene) {
    let vertexShader = `
      attribute vec4 a_Position;
      attribute vec4 a_Color;
      attribute vec4 a_Normal;
      uniform mat4 u_ProjectionMatrix;
      uniform mat4 u_ModelViewMatrix;
      uniform mat4 u_NormalMatrix;
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      void main() {
        v_Position = vec3(u_ModelViewMatrix * a_Position);
        v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_Color = a_Color;
        gl_Position = u_ProjectionMatrix * u_ModelViewMatrix * a_Position;
      }
    `;

    let lightsDeclarations = [];
    let lightsCalculations = [];
    // ambient + diffuse + specular
    let lightsResults = [];
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

  draw(scene, camera) {
    const gl = this.gl;

    scene.lights.forEach(light => {
      light.setUniforms(this);
    });

    scene.objects.forEach(object => {
      let {vertices, colors, normals, modelMatrix} = object;
      let mvMatrix = camera.view.x(modelMatrix);
      let normalMatrix = mvMatrix.inverse().transpose();

      this.setUniforms({
        'u_ProjectionMatrix': camera.projection,
        'u_fViewMatrix': camera.view,
        'u_ModelViewMatrix': mvMatrix,
        'u_NormalMatrix': normalMatrix
      });

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Color', colors, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Normal', normals, 3, gl.FLOAT)) return -1;

      object.draw(gl);
    });
  }
}