import Light from './Light';
import {
  UNIFORM_SPOT_LIGHT_COLOR,
  UNIFORM_SPOT_LIGHT_POSITION,
  UNIFORM_SPOT_LIGHT_DIRECTION
} from '../constants';

// https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-spot.html
export default class SpotLight extends Light {
  constructor(options) {
    super(options);
    const {direction = this.position, angle = 14, exponent = 40, blur = 5} = options;
    this.direction = direction;
    this.angle = angle;
    this.exponent = exponent;
    this.blur = blur;

    this.uColor = `${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`;
    this.uPosition = `${UNIFORM_SPOT_LIGHT_POSITION}${this.index}`;
    this.uDirection = `${UNIFORM_SPOT_LIGHT_DIRECTION}${this.index}`;
    this.vColor = `v_${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`;
  }

  declare() {
    return `
      uniform vec3 ${this.uColor};
      uniform vec3 ${this.uPosition};
      uniform vec3 ${this.uDirection};
    `;
  }

  calculate() {
    let i = this.index;
    const vLightDirection = `lightDirection${i}`;
    const vSpotEffect = `spotEffect${i}`;
    const vNDotL = `nDotL${i}`;
    const vSpotCosCutoff = `spotCosCutoff${i}`;
    const vSpotCosInnerCutoff = `spotCosInnerCutoff${i}`;
    return `
      vec3 ${vLightDirection} = ${this.uPosition} - v_Position;
      vec3 n${vLightDirection} = normalize(${vLightDirection});
      vec3 ncameraDirection${i} = normalize(u_CameraPosition - v_Position);
      float ${vNDotL} = max(dot(normal, n${vLightDirection}), 0.0);
      float ${vSpotEffect} = dot(normalize(${this.uDirection}), -n${vLightDirection});
      float ${vSpotCosCutoff} = cos(${this.angle.toFixed(5)} / 180.0 * PI);
      float ${vSpotCosInnerCutoff} = cos(${(this.angle - this.blur).toFixed(5)} / 180.0 * PI);
      if (${vSpotEffect} > ${vSpotCosCutoff}) {
        ${vSpotEffect} = pow(smoothstep(${vSpotCosCutoff},${vSpotCosInnerCutoff},${vSpotEffect}), ${this.exponent.toFixed(5)});
      } else {
        ${vSpotEffect} = 0.0;
      }
      float specular${i} = 0.0;
      if (${vNDotL} > 0.0) {
        vec3 reflectVec${i} = reflect(-n${vLightDirection}, normal);
        specular${i} = pow(max(dot(reflectVec${i}, ncameraDirection${i}), 0.0), 120.0);
      }
      vec3 ${this.vColor} = ${this.uColor} * v_Color.rgb * ${vNDotL}
        * attenuation(${vLightDirection},
          ${this.attenuation.constant.toFixed(5)},
          ${this.attenuation.linear.toFixed(5)},
          ${this.attenuation.quadratic.toFixed(5)})
        * ${vSpotEffect} + specular${i};
    `;
  }

  result() {
    return `${this.vColor}`;
  }

  setUniforms(shader) {
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position,
      [this.uDirection]: this.direction
    });
  }
}
