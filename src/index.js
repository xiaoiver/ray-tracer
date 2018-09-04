import Stats from 'stats.js';
import { Matrix, Line } from 'sylvester';
import  './utils/math';
import {resizeCanvas} from './utils/dom';
import Renderer from './Renderer';
import Controls from './Controls';
import Scene from './Scene';
import Camera from './Camera';
// import Sphere from './geometry/Sphere';
import Cube from './geometry/Cube';
import AmbientLight from './light/AmbientLight';
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
scene.add(new Cube().translate($V([3, 0, 0])));
// sceen.add(new Sphere({
//   center: $V([0.0, 0.0, -1.0]),
//   radius: 0.5
// }));
scene.addLight(new AmbientLight($V([0.2, 0.2, 0.2])));

const camera = new Camera($V([5.0, 5.0, 5.0]), 55, aspect, 0.1, 100);

const controls = new Controls($canvas);
controls.on('mouse', () => {
  let {deltaX, deltaY, deltaZ, camera: cameraControls} = controls;
  let {isTruck, moveSpeed} = cameraControls;

  if (isTruck) {
    camera.truck(-deltaX * 0.01 * moveSpeed);
    camera.pedestal(deltaY * 0.01 * moveSpeed);
    camera.dolly(deltaZ * 0.05 * moveSpeed);
  } else {
    camera.pan(deltaX * 0.001 * moveSpeed);
    camera.tilt(deltaY * 0.001 * moveSpeed);
    camera.cant(deltaZ * 0.05 * moveSpeed);
  }
});
controls.on('resize', ({width, height}) => {
  camera.aspect = width / height;
  camera.updateProjection();
  camera.updateTransform();
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