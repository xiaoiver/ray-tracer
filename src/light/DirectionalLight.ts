import ShadowLight from './ShadowLight';
import { Light, LightOptions } from './Light';
import { UNIFORM_DIRECTIONAL_LIGHT_COLOR, UNIFORM_DIRECTIONAL_LIGHT_DIRECTION } from '../constants';
import { setUniforms } from '../utils/gl';

interface DirectionalLightOptions extends LightOptions {
  direction: Vector
};

export default class DirectionalLight extends ShadowLight {
  type = 'DirectionalLight';

  direction: Vector;

  declaration = `
    struct DirectionalLight {
      vec3 direction;
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
    };

    vec3 calcDirectionalLight(DirectionalLight light, vec3 normal, vec3 fragPos, vec3 viewDir)
    {
      vec3 lightDir = normalize(-light.direction);

      // diffuse shading
      float diff = max(dot(normal, lightDir), 0.0);

      // specular shading
      // vec3 reflectDir = reflect(-lightDir, normal);
      // float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);

      // Blinn-Phong specular shading
      vec3 halfwayDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfwayDir), 0.0), u_Shininess);

      vec3 ambient = light.ambient * u_Diffuse;
      vec3 diffuse = light.diffuse * diff * u_Diffuse;
      vec3 specular = light.specular * spec * u_Specular;

      float shadow = calcShadow(u_ShadowMap${this.index}, v_PositionFromLight${this.index}, lightDir, normal);
      return ambient + shadow * (diffuse + specular);
    }
  `;

  constructor(options: Partial<DirectionalLightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  setUniforms(gl: WebGLRenderingContext, program: WebGLProgram, namespace: string) {
    super.setUniforms(gl, program, namespace);
    setUniforms(gl, program, {
      [`${namespace}.direction`]: this.direction,
      [`${namespace}.ambient`]: this.model.ambient,
      [`${namespace}.diffuse`]: this.model.diffuse,
      [`${namespace}.specular`]: this.model.specular
    });
  }
}
