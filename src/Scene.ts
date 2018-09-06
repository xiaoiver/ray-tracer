import { Light } from './light/Light';
import Mesh from './Mesh';

export default class Scene {
  objects: Array<Mesh> = [];
  lights: Array<Light> = [];
  inited: boolean;

  constructor() {
    this.inited = false;
  }

  add(object: Mesh) {
    this.objects.push(object);
  }

  addLight(light: Light) {
    this.lights.push(light);
  }

  init() {
    this.objects.forEach(object => {
      object.geometry.init();
    });
    this.inited = true;
  }
}