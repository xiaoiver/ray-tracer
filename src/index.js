import Stats from 'stats.js';
import  './utils/math';
import {resizeCanvas} from './utils/dom';
import Renderer from './Renderer';
import Controls from './Controls';
import Scene from './Scene';
import Camera from './Camera';
import Sphere from './geometry/Sphere';
import Cube from './geometry/Cube';
import AmbientLight from './light/AmbientLight';
import PointLight from './light/PointLight';
import SpotLight from './light/SpotLight';
import CubeShader from './shaders/CubeShader';
// import RayTracer from './shaders/RayTracer';

const $canvas = document.getElementById('webgl');
const {displayWidth, displayHeight} = resizeCanvas($canvas);
const aspect = displayWidth / displayHeight;

// setup stats
const stats = new Stats();
const $stats = stats.domElement;
stats.setMode(0);
$stats.style.position = 'absolute';
$stats.style.left = '0px';
$stats.style.top = '0px';
document.getElementById('stats').appendChild($stats);

const scene = new Scene();
scene.add(new Cube());
scene.add(new Cube({
  center: $V([0, 1.5, 0]),
  width: 1,
  height: 1,
  depth: 1
}));
scene.add(new Cube({
  center: $V([0, -1.1, 0]),
  width: 5,
  height: 0.2,
  depth: 5
}));
scene.add(new Sphere({
  center: $V([0, 0, 1.5]),
  radius: 0.5
}));

scene.addLight(new AmbientLight({
  color: $V([0.2, 0.2, 0.2])
}));
scene.addLight(new PointLight({
  color: $V([0.8, 0.8, 0.8]),
  position: $V([0, 0, 4]),
  attenuation: {
    linear: 0.1,
    quadratic: 0.01
  }
}));
// scene.addLight(new PointLight({
//   color: $V([1, 1, 1]),
//   position: $V([6, 0, 0]),
//   attenuation: {
//     linear: 0.1,
//     quadratic: 0.01
//   }
// }));
scene.addLight(new SpotLight({
  color: $V([1, 1, 1]),
  position: $V([0, 2, 0]),
  direction: $V([0, -1, 0]),
  angle: 24,
  exponent: 40,
  attenuation: {
    linear: 0.1,
    quadratic: 0.01
  }
}));

const camera = new Camera($V([5.0, 5.0, 5.0]), 55, aspect, 0.1, 100);

const controls = new Controls({
  canvas: $canvas,
  scene,
  camera
});

const renderer = new Renderer($canvas);
renderer.setShader(new CubeShader());
// renderer.setShader(new RayTracer());

const tick = function() {
  stats.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};
tick();