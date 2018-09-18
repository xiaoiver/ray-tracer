import Texture from '../texture/Texture';

interface MaterialOptions {
  shininess: number;
  diffuse: number;
  specular: number;
  texture: Texture;
  color: Vector;
}

export default class Material {
  shininess: number = 120.0;
  diffuse: number = 1.0;
  specular: number = 1.0;
  texture: Texture;
  color: Vector = $V([0, 0, 0]);

  constructor(options: Partial<MaterialOptions>) {
    Object.assign(this, options);
  }
}