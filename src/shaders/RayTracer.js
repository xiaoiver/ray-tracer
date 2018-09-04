// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform vec3 u_Ray00, u_Ray01, u_Ray10, u_Ray11;
  varying vec3 v_PrimaryRay;

  void main() {
    gl_Position = a_Position;
    vec2 percent = a_Position.xy * 0.5 + 0.5;
    v_PrimaryRay = mix(mix(u_Ray00, u_Ray01, percent.y), mix(u_Ray10, u_Ray11, percent.y), percent.x);
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  #define SPHERE_NUM 1

  uniform vec3 u_EyePosition;
  uniform vec3 u_LightPosition;
  uniform vec3 u_LightColor;

  struct Sphere {
    vec3 center;
    float radius;
    vec3 surfaceColor;
  };
  uniform Sphere u_Spheres[SPHERE_NUM];
  varying vec3 v_PrimaryRay;

  bool intersect(in vec3 rayorig, in vec3 raydir,
    in vec3 center, in float radius,
    out float t0, out float t1) {
    vec3 l = center - rayorig;
    float tca = dot(l, raydir);
    if (tca < 0.0) return false;
    float d2 = dot(l, l) - tca * tca;
    if (d2 > radius * radius) return false;
    float thc = sqrt(radius * radius - d2);
    t0 = tca - thc;
    t1 = tca + thc;

    return true;
  }

  vec3 trace(in vec3 rayorig, in vec3 raydir) {
    vec3 color = vec3(0.0);
    Sphere intersectedSphere;
    bool intersected = false;
    float tnear = 10000.0;
    for (int i = 0; i < SPHERE_NUM; i++) {
        float t0 = 10000.0;
        float t1 = 10000.0;
        if (intersect(rayorig, raydir, u_Spheres[i].center, u_Spheres[i].radius, t0, t1)) {
            if (t0 < 0.0) t0 = t1;
            if (t0 < tnear) {
                tnear = t0;
                intersectedSphere = u_Spheres[i];
                intersected = true;
            }
        }
    }

    if (!intersected) return color;

    vec3 hitPoint = rayorig + raydir * tnear;
    vec3 hitNormal = normalize(hitPoint - intersectedSphere.center);
    vec3 lightDirection = normalize(u_LightPosition - hitPoint);
    float diffuse = clamp(dot(hitNormal, lightDirection), 0.0, 1.0);
    float ambient = 0.15;

    for (int j = 0; j < SPHERE_NUM; j++) {
        float t0, t1;
        if (intersect(hitPoint, lightDirection, u_Spheres[j].center, u_Spheres[j].radius, t0, t1)) {
            diffuse *= 0.2;
            break;
        }
    }

    color += (diffuse + ambient) * intersectedSphere.surfaceColor;
    
    return color;
  }

  void main() {
    gl_FragColor = vec4(trace(u_EyePosition, normalize(v_PrimaryRay)), 1.0);
  }
`;

import { Matrix, Vector } from 'sylvester';
import Shader from './Shader';

export default class CubeShader extends Shader {
  constructor() {
    super();
    this.vertexRawcontent = VSHADER_SOURCE;
    this.fragmentRawcontent = FSHADER_SOURCE;
  }

  initVertexBuffers() {

  }

  draw(scene, camera) {
    const gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    let vpMatrix = camera.transform;
    let modelMatrix = Matrix.I(4);
    let mvpMatrix = vpMatrix.x(modelMatrix);
    let normalMatrix = modelMatrix.inverse().transpose();

    this.setUniforms({
      'u_MvpMatrix': mvpMatrix,
      'u_NormalMatrix': normalMatrix,
      'u_LightDirection': $V([0.5, 3.0, 4.0])
    });

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
  }

  getPrimaryRay(matrix, x, y, eye) {
    return matrix.multiply($V([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
  }
}

    // setUniforms(gl, {
    //   'u_Ray00': this.getPrimaryRay(u_MVPMatrix, -1, -1, camera.position),
    //   'u_Ray01': this.getPrimaryRay(u_MVPMatrix, -1, 1, camera.position),
    //   'u_Ray10': this.getPrimaryRay(u_MVPMatrix, 1, -1, camera.position),
    //   'u_Ray11': this.getPrimaryRay(u_MVPMatrix, 1, 1, camera.position),
    //   'u_EyePosition': camera.position,
    //   'u_LightPosition': $V([0.0, 2.0, 0.0]),
    //   'u_LightColor': $V([1.0, 1.0, 1.0])
    // });