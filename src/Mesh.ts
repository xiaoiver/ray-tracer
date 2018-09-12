import { Geometry } from "./geometry/Geometry";
import Material from "./material/Material";

interface LightMatrixMap {
  [index: string]: Matrix;
}

interface IMesh {
  geometry: Geometry;
  material: Material;
  mvpMatrixFromLight: LightMatrixMap;
}

interface MeshOptions {
  geometry: Geometry;
  material?: Material;
}

export default class Mesh implements IMesh {
  geometry: Geometry;
  material: Material = new Material();
  mvpMatrixFromLight: LightMatrixMap = {};

  constructor(options: MeshOptions) {
    Object.assign(this, options);
  }
}