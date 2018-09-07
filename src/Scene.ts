import { Light } from './light/Light';
import Mesh from './Mesh';

export default class Scene {
  meshes: Array<Mesh> = [];
  lights: Array<Light> = [];
  inited: boolean;

  constructor() {
    this.inited = false;
  }

  addMesh(mesh: Mesh) {
    this.meshes.push(mesh);
  }

  addLight(light: Light) {
    this.lights.push(light);
  }

  init() {
    this.meshes.forEach(mesh => {
      mesh.geometry.init();
    });
    this.inited = true;
  }
}