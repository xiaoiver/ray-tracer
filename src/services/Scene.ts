import { injectable, inject } from 'inversify';
import { Light } from '../light/Light';
import Mesh from '../Mesh';

interface LightsInfo {
  [type: string]: {
    varName: string;
    declaration: string;
    lights: Array<Light>;
  }
}

let i = 0;

export interface ISceneService {
  idx: number;

  meshes: Array<Mesh>;
  lights: Array<Light>;
  inited: boolean;

  addMesh(mesh: Mesh): void;
  addLight(light: Light): void;
  init(): void;

  getLightsInfo(): LightsInfo;
}

@injectable()
export default class Scene implements ISceneService {
  idx: number;

  meshes: Array<Mesh> = [];
  lights: Array<Light> = [];
  private lightsInfo: LightsInfo = {};
  inited: boolean = false;

  constructor() {
    this.idx = i++;
  }

  addMesh(mesh: Mesh) {
    this.meshes.push(mesh);
  }

  addLight(light: Light) {
    if (!this.lightsInfo[light.type]) {
      this.lightsInfo[light.type] = {
        varName: light.type.charAt(0).toLowerCase() + light.type.substring(1),
        declaration: light.declaration,
        lights: []
      };
    }
    this.lightsInfo[light.type].lights.push(light);
  }

  getLightsInfo(): LightsInfo {
    return this.lightsInfo;
  }

  init() {
    this.meshes.forEach(mesh => mesh.init());
    this.inited = true;
  }
}