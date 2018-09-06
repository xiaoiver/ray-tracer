import { Geometry } from "./geometry/Geometry";

interface IMesh {
  geometry: Geometry;
}

interface MeshOptions {
  geometry: Geometry;
}

export default class Mesh implements IMesh {
  geometry: Geometry;

  constructor(options: MeshOptions) {
    Object.assign(this, options);
  }
}