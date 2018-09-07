import { Light, LightOptions } from './Light';
import ShadowLight from './ShadowLight';
import {
  UNIFORM_SPOT_LIGHT_COLOR,
  UNIFORM_SPOT_LIGHT_POSITION,
  UNIFORM_SPOT_LIGHT_DIRECTION
} from '../constants/index';
import Shader from '../shaders/Shader';
import { IShaderSnippet } from '../shaders/ShaderSnippet';

interface SpotLightOptions extends LightOptions {
  direction?: Vector;
  angle?: number;
  exponent?: number;
  blur?: number;
};

// https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-spot.html
export default class SpotLight extends ShadowLight {
  direction: Vector;
  angle: number;
  exponent: number;
  blur: number;
  shadowEnabled: boolean = true;

  uniforms: {
    uColor?: string;
    uPosition?: string;
    uDirection?: string;
    uShadowMap?: string;
  } = {};

  varyings: {
    vColor?: string;
  } = {};

  constructor(options: SpotLightOptions) {
    super(options);
    const {direction = this.position, angle = 14, exponent = 40, blur = 5} = options;
    this.direction = direction;
    this.angle = angle;
    this.exponent = exponent;
    this.blur = blur;

    this.uniforms = {
      ...this.uniforms,
      uColor: `${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`,
      uPosition: `${UNIFORM_SPOT_LIGHT_POSITION}${this.index}`,
      uDirection: `${UNIFORM_SPOT_LIGHT_DIRECTION}${this.index}`,
      uShadowMap: `u_ShadowMap${this.index}`
    };
    this.varyings = {
      ...this.varyings,
      vColor: `v_${UNIFORM_SPOT_LIGHT_COLOR}${this.index}`
    };
  }

  generateSnippets() {
    const i = this.index;
    const {uPosition, uColor, uDirection} = this.uniforms;
    const {vColor} = this.varyings;

    super.generateSnippets();

    // ambient + diffuse + specular
    this.lightSnippet.fragment = {
      declaration: `
        uniform vec3 ${uColor};
        uniform vec3 ${uPosition};
        uniform vec3 ${uDirection};
      `,
      calculation: `
        vec3 lightDirection${i} = ${uPosition} - v_Position;
        vec3 nLightDirection${i} = normalize(lightDirection${i});
        vec3 nCameraDirection${i} = normalize(u_CameraPosition - v_Position);
        float nDotL${i} = max(dot(normal, nLightDirection${i}), 0.0);
        float spotEffect${i} = dot(normalize(${uDirection}), -nLightDirection${i});
        float spotCosCutoff${i} = cos(${this.angle.toFixed(5)} / 180.0 * PI);
        float spotCosInnerCutoff${i} = cos(${(this.angle - this.blur).toFixed(5)} / 180.0 * PI);
        if (spotEffect${i} > spotCosCutoff${i}) {
          spotEffect${i} = pow(smoothstep(spotCosCutoff${i},spotCosInnerCutoff${i},spotEffect${i}), ${this.exponent.toFixed(5)});
        } else {
          spotEffect${i} = 0.0;
        }
        float specular${i} = 0.0;
        if (nDotL${i} > 0.0) {
          vec3 halfwayDir = normalize(nLightDirection${i} + nCameraDirection${i});
          // Blinn-Phong
          specular${i} = pow(max(dot(normal, halfwayDir), 0.0), 120.0);
          // Phong
          // specular${i} = pow(max(dot(reflect(-nLightDirection${i}, normal), nCameraDirection${i}), 0.0), 120.0);
        }
        vec3 ${vColor} = ${uColor} * v_Color.rgb * nDotL${i}
          * attenuation(lightDirection${i},
            ${this.attenuation.constant.toFixed(5)},
            ${this.attenuation.linear.toFixed(5)},
            ${this.attenuation.quadratic.toFixed(5)})
          * spotEffect${i} + specular${i};
      `,
      result: `${vColor}`
    };
  }

  setUniforms(shader: Shader) {
    super.setUniforms(shader);

    shader.setUniforms({
      [this.uniforms.uColor]: this.color,
      [this.uniforms.uPosition]: this.position,
      [this.uniforms.uDirection]: this.direction
    });
  }
}
