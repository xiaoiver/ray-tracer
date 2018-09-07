import { Geometry } from "./geometry/Geometry";

interface LightMatrixMap {
  [index: string]: Matrix;
}

interface IMesh {
  geometry: Geometry;
  mvpMatrixFromLight: LightMatrixMap;
}

interface MeshOptions {
  geometry: Geometry;
}

export default class Mesh implements IMesh {
  geometry: Geometry;
  mvpMatrixFromLight: LightMatrixMap = {};

  constructor(options: MeshOptions) {
    Object.assign(this, options);
  }
}