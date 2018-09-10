import { injectable, inject } from 'inversify';
import { Light } from '../light/Light';
import Mesh from '../Mesh';

let i = 0;

export interface ISceneService {
  idx: number;

  meshes: Array<Mesh>;
  lights: Array<Light>;
  inited: boolean;

  addMesh(mesh: Mesh): void;
  addLight(light: Light): void;
  init(): void;
}

@injectable()
export default class Scene implements ISceneService {
  idx: number;

  meshes: Array<Mesh> = [];
  lights: Array<Light> = [];
  inited: boolean = false;

  constructor() {
    this.idx = i++;
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