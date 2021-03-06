import { Light, LightOptions } from './Light';
import { UNIFORM_POINT_LIGHT_COLOR, UNIFORM_POINT_LIGHT_POSITION } from '../constants/index';
import ShadowLight from './ShadowLight';
import { setUniforms } from '../utils/gl';

interface PointLightOptions extends LightOptions {};

export default class PointLight extends ShadowLight {
  type = 'PointLight';

  declaration = `
    struct PointLight {
      vec3 position;
      
      float constant;
      float linear;
      float quadratic;  

      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
    };

    vec3 calcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
    {
      vec3 lightDir = normalize(light.position - fragPos);
      // diffuse shading
      float diff = max(dot(normal, lightDir), 0.0);
      // specular shading
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);

      float att = attenuation(light.position - fragPos, light.constant, light.linear, light.quadratic);

      vec3 ambient = light.ambient * u_Diffuse;
      vec3 diffuse = light.diffuse * diff * u_Diffuse;
      vec3 specular = light.specular * spec * u_Specular;
      return att * (ambient + diffuse + specular);
    }
  `;

  constructor(options: Partial<PointLightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, namespace: string) {
    super.setUniforms(gl, program, namespace);
    setUniforms(gl, program, {
      [`${namespace}.position`]: this.position,
      [`${namespace}.ambient`]: this.model.ambient,
      [`${namespace}.diffuse`]: this.model.diffuse,
      [`${namespace}.specular`]: this.model.specular,
      [`${namespace}.constant`]: this.model.attenuation.constant,
      [`${namespace}.linear`]: this.model.attenuation.linear,
      [`${namespace}.quadratic`]: this.model.attenuation.quadratic
    });
  }
}