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
      uniform mat4 u_MvpMatrix;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_NormalMatrix;
      varying vec4 v_Color;
      varying vec3 v_Normal;
      varying vec3 v_Position;
      void main() {
        gl_Position = u_MvpMatrix * a_Position;
        v_Position = vec3(u_ModelMatrix * a_Position);
        v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_Color = a_Color;
      }
    `;

    let lightsDeclarations = [];
    let lightsCalculations = [];
    scene.lights.forEach((light, i) => {
      lightsDeclarations.push(light.declare(i));
      lightsCalculations.push(light.calculate(i));
    });

    let fragmentShader = `
      #ifdef GL_ES
      precision mediump float;
      #endif
      uniform vec3 u_LightColor;
      uniform vec3 u_LightPosition;
      ${lightsDeclarations.join('')}
      varying vec3 v_Normal;
      varying vec3 v_Position;
      varying vec4 v_Color;
      void main() {
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_Position);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;
        gl_FragColor = vec4(diffuse + ${lightsCalculations.join('+')}, v_Color.a);
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

    let vpMatrix = camera.transform;
    scene.objects.forEach(object => {
      let {vertices, colors, normals, modelMatrix} = object;
      let mvpMatrix = vpMatrix.x(modelMatrix);
      let normalMatrix = modelMatrix.inverse().transpose();

      this.setUniforms({
        'u_MvpMatrix': mvpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_NormalMatrix': normalMatrix,
        'u_LightColor': $V([1.0, 1.0, 1.0]),
        'u_LightPosition': $V([2.3, 4.0, 3.5])
      });

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!this.setVertexAttribute('a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Color', colors, 3, gl.FLOAT)) return -1;
      if (!this.setVertexAttribute('a_Normal', normals, 3, gl.FLOAT)) return -1;

      object.draw(gl);
    });
  }
}