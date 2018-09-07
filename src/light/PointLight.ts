import { Light, LightOptions } from './Light';
import { UNIFORM_POINT_LIGHT_COLOR, UNIFORM_POINT_LIGHT_POSITION } from '../constants/index';
import Shader from '../shaders/Shader';
import ShadowLight from './ShadowLight';

interface PointLightOptions extends LightOptions {};

export default class PointLight extends ShadowLight {
  uColor: string;
  uPosition: string;
  vColor: string;
  shadowEnabled: boolean = true;

  constructor(options: PointLightOptions) {
    super(options);

    this.uColor = `${UNIFORM_POINT_LIGHT_COLOR}${this.index}`;
    this.uPosition = `${UNIFORM_POINT_LIGHT_POSITION}${this.index}`;
    this.vColor = `v_${UNIFORM_POINT_LIGHT_POSITION}${this.index}`;
  }

  generateSnippets() {
    const i = this.index;
    super.generateSnippets();
    this.lightSnippet.fragment = {
      declaration: `
        uniform vec3 ${this.uColor};
        uniform vec3 ${this.uPosition};
      `,
      calculation: `
        vec3 lightDirection${i} = ${this.uPosition} - v_Position;
        vec3 nLightDirection${i} = normalize(lightDirection${i});
        float nDotL${i} = max(dot(nLightDirection${i}, normal), 0.0);
        vec3 ${this.vColor} = ${this.uColor} * v_Color.rgb * nDotL${i}
          * attenuation(lightDirection${i},
            ${this.attenuation.constant.toFixed(5)},
            ${this.attenuation.linear.toFixed(5)},
            ${this.attenuation.quadratic.toFixed(5)});
      `,
      result: `${this.vColor}`
    };
  }

  setUniforms(shader: Shader) {
    super.setUniforms(shader);
    shader.setUniforms({
      [this.uColor]: this.color,
      [this.uPosition]: this.position
    });
  }
}