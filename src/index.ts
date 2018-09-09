import 'lodash.assign';
import './utils/math';
import * as Stats from 'stats.js';

import { container } from "./inversify.config";
import SERVICE_IDENTIFIER from './constants/services';
import { IRendererService } from './services/Renderer';
import { ISceneService } from './services/Scene';
import { ICameraService } from './services/Camera';
import { ICanvasService } from './services/Canvas';

import Mesh from './Mesh';
import Sphere from './geometry/Sphere';
import Cube from './geometry/Cube';
import Plane from './geometry/Plane';
import Triangle from './geometry/Triangle';
import AmbientLight from './light/AmbientLight';
import PointLight from './light/PointLight';
import SpotLight from './light/SpotLight';
import DisplayShader from './shaders/DisplayShader';
import ShadowShader from './shaders/ShadowShader';
// import RayTracer from './shaders/RayTracer';

// setup stats
const stats = new Stats();
stats.showPanel(0);
const $stats = stats.dom;
$stats.style.position = 'absolute';
$stats.style.left = '0px';
$stats.style.top = '0px';
document.getElementById('stats').appendChild($stats);

const scene = container.get<ISceneService>(SERVICE_IDENTIFIER.ISceneService);
const renderer = container.get<IRendererService>(SERVICE_IDENTIFIER.IRendererService);
const canvas = container.get<ICanvasService>(SERVICE_IDENTIFIER.ICanvasService);
const camera = container.get<ICameraService>(SERVICE_IDENTIFIER.ICameraService);

// Setup camera
const { width, height } = canvas.getSize();
camera.init($V([0, 7.0, 9]), 45, width / height, 1, 100);

// Setup meshes & lights in current scene
scene.addMesh(new Mesh({
  geometry: new Plane({
    // width: 10,
    // height: 10
    p1: $V([3.0, -1.7, 2.5]),
    p2: $V([3.0, -1.7, -2.5]),
    p3: $V([-3.0, -1.7, -2.5]),
    p4: $V([-3.0, -1.7, 2.5])
  })
  // .rotate(-45, $V([0, 1, 1]))
}));
scene.addMesh(new Mesh({
  geometry: new Triangle({
    color: $V([1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0]),
    p1: $V([-0.8, 3.5, 0.0]),
    p2: $V([0.0, 3.5, 1.8]),
    p3: $V([0.8, 3.5, 0.0]),
  })
}));

scene.addLight(new AmbientLight({
  color: $V([0.2, 0.2, 0.2])
}));
scene.addLight(new PointLight({
  color: $V([1, 1, 1]),
  position: $V([0, 40, 2]),
  // attenuation: {
  //   linear: 0.1,
  //   quadratic: 0.01
  // }
}));

renderer.setDisplayShader(new DisplayShader());
renderer.setShadowShader(new ShadowShader());

const tick = function() {
  stats.update();
  renderer.render();
  requestAnimationFrame(tick);
};
tick();

// scene.addLight(new PointLight({
//   color: $V([1, 0, 1]),
//   position: $V([6, 0, 0]),
//   attenuation: {
//     linear: 0.1,
//     quadratic: 0.01
//   }
// }));
// scene.addLight(new SpotLight({
//   color: $V([1, 1, 1]),
//   // position: $V([-4, 4, 0]),
//   // direction: $V([1, -1, 0]),
//   position: $V([0, 4, 0]),
//   direction: $V([0, -1, 0]),
//   angle: 14,
//   exponent: 40,
//   attenuation: {
//     linear: 0.1,
//     quadratic: 0.01
//   }
// }));

// scene.addMesh(new Mesh({
//   geometry: new Cube({
//     center: $V([0, -0.1, 0]),
//     width: 5,
//     height: 0.2,
//     depth: 5
//   })
// }));
// scene.addMesh(new Mesh({
//   geometry: new Sphere({
//     center: $V([0, 0, 1.5]),
//     radius: 0.5
//   })
// }));
// scene.addMesh(new Mesh({
//   geometry: new Sphere({
//     center: $V([0, -0.5, 0]),
//     radius: 0.5
//   })
// }));


// controls.on('shader:refresh', () => {
//   shader.inited = false;
// });
// controls.on('scene:refresh', () => {
//   scene.inited = false;
// });

// renderer.setShader(new RayTracer());

// scene.addMesh(new Mesh({
//   geometry: new Cube()
// }));
// scene.addMesh(new Mesh({
//   geometry: new Cube({
//     center: $V([0, 1.5, 0]),
//     width: 1,
//     height: 1,
//     depth: 1
//   })
// }));
// scene.addMesh(new Mesh({
//   geometry: new Cube({
//     center: $V([0, 0.2, 0]),
//     width: 0.4,
//     height: 0.4,
//     depth: 0.4
//   })
// }));