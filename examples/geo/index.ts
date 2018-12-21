import 'lodash.assign';
import '../../src/utils/math';

// @ts-ignore
import { getViewMatrix, lngLatToWorld, getProjectionParameters, getDistanceScales } from 'viewport-mercator-project';

import { container } from './container';
import SERVICE_IDENTIFIER from '../../src/constants/services';
import Renderer, { IRendererService } from '../../src/services/Renderer';
import { ISceneService } from '../../src/services/Scene';
import { ICameraService } from '../../src/services/Camera';
import { IControlsService } from './Controls';

import Mesh from '../../src/Mesh';
import Polygon from '../../src/geometry/Polygon';
import SpotLight from '../../src/light/SpotLight';
import PolygonShader from '../../src/shaders/PolygonShader';
import LightModel from '../../src/light/models/LightModel';
import Material from '../../src/material/Material';

const scene = container.get<ISceneService>(SERVICE_IDENTIFIER.ISceneService);
const renderer = container.get<IRendererService>(SERVICE_IDENTIFIER.IRendererService);
const camera = container.get<ICameraService>(SERVICE_IDENTIFIER.ICameraService);
// const controls = container.get<IControlsService>(SERVICE_IDENTIFIER.IControlsService);

// @ts-ignore
import geo from './geo.json';
import { getGeojsonFeatures, separateGeojsonFeatures } from './geojson';
import { calculateIndices, calculatePositions, calculateColors } from './tesselator';
import { MultiPoint } from 'geojson';

const { polygonFeatures } = separateGeojsonFeatures(getGeojsonFeatures(geo));
const polygons = polygonFeatures.map(f => (<MultiPoint>f.geometry).coordinates);
const indices = calculateIndices(polygons);
const { positions, vertexValid } = calculatePositions(polygons);
const colors = calculateColors(polygons, [200, 160, 0, 180]);

const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -100,
  altitude: 1.5,
  zoom: 3,
  bearing: 0,
  pitch: 60
};

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const out = [];
  var f = 1.0 / Math.tan(fovy / 2),
      nf = 1 / (near - far);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = (2 * far * near) * nf;
  out[15] = 0;
  return out;
};

function convertToMatrix4x4(viewMatrix: Array<number>) {
  return [
    [viewMatrix[0], viewMatrix[4], viewMatrix[8], viewMatrix[12]],
    [viewMatrix[1], viewMatrix[5], viewMatrix[9], viewMatrix[13]],
    [viewMatrix[2], viewMatrix[6], viewMatrix[10], viewMatrix[14]],
    [viewMatrix[3], viewMatrix[7], viewMatrix[11], viewMatrix[15]],
  ]
}

// function extractCameraVectors({viewMatrix, viewMatrixInverse}) {
//   // Read the translation from the inverse view matrix
//   return {
//     eye: [viewMatrixInverse[12], viewMatrixInverse[13], viewMatrixInverse[14]],
//     direction: [viewMatrix[2], viewMatrix[6], viewMatrix[10]],
//     up: [viewMatrix[1], viewMatrix[5], viewMatrix[9]]
//   };
// }

renderer.on(Renderer.READY_EVENT, () => {

  // Setup camera
  const { pitch, bearing, altitude, latitude, longitude, zoom } = INITIAL_VIEW_STATE;
  const scale = Math.pow(2, zoom);
  const { width, height } = renderer.getSize();
  const {fov, aspect, near, far} = getProjectionParameters({
    width,
    height,
    pitch,
    altitude,
    nearZMultiplier: 0.1,
    farZMultiplier: 10
  });

  const center = lngLatToWorld([longitude, latitude], scale);
  const viewMatrix = getViewMatrix({
    height,
    pitch,
    bearing,
    altitude,
    center: [...center, 0],
    flipY: true
  });

  const { pixelsPerMeter } = getDistanceScales({latitude, longitude, scale});
  
  // camera.init($V([...center, 0]), $V([0, 0, 0]), 75, 1, near, far);
  camera.view = $M(convertToMatrix4x4(viewMatrix));
  // const viewInverse = camera.view.inverse();
  // const {eye, direction, up} = extractCameraVectors({viewMatrix, viewMatrixInverse: viewInverse.flatten()});

  // camera.init($V(eye), $V(direction), 75, aspect, near, far, $V(up));

  camera.projection = $M(convertToMatrix4x4(perspective(fov, aspect, near, far)));
  camera.transform = camera.projection.x(camera.view);
  // camera.dolly(-10);

  scene.addMesh(new Mesh({
    geometry: new Polygon({
      indices,
      vertices: positions,
      vertexValid,
      colors,
      scale,
      pixelsPerMeter
    }),
    material: new Material({
      color: $V([1.0, 0.5, 0.0])
    })
  }));
  
  scene.addLight(new SpotLight({
    position: $V([0, 10, 0]),
    direction: $V([0, -1, 0]),
    angle: 24,
    exponent: 40,
    model: new LightModel({
      ambient: $V([0.2, 0.2, 0.2]),
      diffuse: $V([1, 1, 1]),
      specular: $V([1, 1, 1]),
      attenuation: {
        linear: 0.1,
        quadratic: 0.01
      }
    })
  }));

  renderer.addShader(new PolygonShader(renderer, scene, camera));
});