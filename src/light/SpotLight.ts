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
  direction: Vector;
  angle: number;
  exponent: number;
  blur: number;
};

// https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-spot.html
export default class SpotLight extends ShadowLight {
  type = 'SpotLight';

  declaration = `
    struct SpotLight {
      vec3 position;
      vec3 direction;
      
      float constant;
      float linear;
      float quadratic;  

      vec3 ambient;
      vec3 diffuse;
      vec3 specular;

      float angle;
      float blur;
      float exponent;
    };

    vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
    {
      vec3 lightDir = normalize(light.position - fragPos);
      // diffuse shading
      float diff = max(dot(normal, lightDir), 0.0);
      // specular shading
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);
      // attenuation
      float distance = length(light.position - fragPos);
      float attenuation = 1.0 / (light.constant + light.linear * distance + 
              light.quadratic * (distance * distance));    

      vec3 ambient = light.ambient * u_Diffuse;
      vec3 diffuse = light.diffuse * diff * u_Diffuse;
      vec3 specular = light.specular * spec * u_Specular;

      float spotEffect = dot(normalize(light.direction), -lightDir);
      float spotCosCutoff = cos(light.angle / 180.0 * PI);
      float spotCosOuterCutoff = cos((light.angle + light.blur) / 180.0 * PI);
      float spotCosInnerCutoff = cos((light.angle - light.blur) / 180.0 * PI);
      if (spotEffect > spotCosCutoff) {
        spotEffect = pow(smoothstep(spotCosOuterCutoff, spotCosInnerCutoff, spotEffect), light.exponent);
      } else {
        spotEffect = 0.0;
      }

      float shadow = calcShadow(u_ShadowMap${this.index}, v_PositionFromLight${this.index}, lightDir, normal);
      return ambient + attenuation * shadow * (spotEffect * diffuse + specular);
    }
  `;

  direction: Vector = this.position;
  angle: number = 14;
  exponent: number = 40;
  blur: number = 5;

  constructor(options: Partial<SpotLightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  setUniforms(shader: Shader, namespace: string) {
    super.setUniforms(shader, namespace);

    shader.setUniforms({
      [`${namespace}.position`]: this.position,
      [`${namespace}.direction`]: this.direction,
      [`${namespace}.ambient`]: this.model.ambient,
      [`${namespace}.diffuse`]: this.model.diffuse,
      [`${namespace}.specular`]: this.model.specular,
      [`${namespace}.constant`]: this.model.attenuation.constant,
      [`${namespace}.linear`]: this.model.attenuation.linear,
      [`${namespace}.quadratic`]: this.model.attenuation.quadratic,
      [`${namespace}.angle`]: this.angle,
      [`${namespace}.blur`]: this.blur,
      [`${namespace}.exponent`]: this.exponent
    });
  }
}
