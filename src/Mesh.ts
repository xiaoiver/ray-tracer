import { Geometry } from "./geometry/Geometry";
import Material from "./material/Material";

export interface LightMatrixMap {
  [index: string]: Matrix;
}

interface IMesh {
  geometry: Geometry;
  material: Material;
  mvpMatrixFromLight: LightMatrixMap;
  colorAttributeArray: Float32Array;

  init(): void;
}

interface MeshOptions {
  geometry: Geometry;
  material: Material;
}

export default class Mesh implements IMesh {
  geometry: Geometry;
  material: Material = new Material({});
  mvpMatrixFromLight: LightMatrixMap = {};
  colorAttributeArray: Float32Array;

  constructor(options: Partial<MeshOptions>) {
    Object.assign(this, options);
  }

  init() {
    this.geometry.init();
    this.colorAttributeArray = this.geometry.vertices.map((v, i) => this.material.color.e(i % 3 + 1));
  }
}