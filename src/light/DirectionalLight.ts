import ShadowLight from './ShadowLight';
import { Light, LightOptions } from './Light';
import { UNIFORM_DIRECTIONAL_LIGHT_COLOR, UNIFORM_DIRECTIONAL_LIGHT_DIRECTION } from '../constants';
import Shader from '../shaders/Shader';

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
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_Shininess);

      //vec3 halfwayDir = normalize(nLightDirection + nCameraDirection);
      // Blinn-Phong
      //specularEffect = pow(max(dot(normal, halfwayDir), 0.0), 120.0);

      vec3 ambient = light.ambient * u_Diffuse;
      vec3 diffuse = light.diffuse * diff * u_Diffuse;
      vec3 specular = light.specular * spec * u_Specular;
      return ambient + diffuse + specular;
    }
  `;

  constructor(options: Partial<DirectionalLightOptions>) {
    super(options);
    Object.assign(this, options);
  }

  setUniforms(shader: Shader, namespace: string) {
    super.setUniforms(shader, namespace);
    shader.setUniforms({
      [`${namespace}.direction`]: this.direction,
      [`${namespace}.ambient`]: this.model.ambient,
      [`${namespace}.diffuse`]: this.model.diffuse,
      [`${namespace}.specular`]: this.model.specular
    });
  }
}