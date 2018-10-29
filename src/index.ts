import 'lodash.assign';
import './utils/math';

import { container } from "./inversify.config";
import SERVICE_IDENTIFIER from './constants/services';
import Renderer, { IRendererService } from './services/Renderer';
import { ISceneService } from './services/Scene';
import { ICameraService } from './services/Camera';
import { IControlsService } from './services/Controls';
import { ITextureLoaderService } from './services/TextureLoader';

import Mesh from './Mesh';
import Sphere from './geometry/Sphere';
import Cube from './geometry/Cube';
import Plane from './geometry/Plane';
import Triangle from './geometry/Triangle';
import DirectionalLight from './light/DirectionalLight';
import PointLight from './light/PointLight';
import SpotLight from './light/SpotLight';
import DisplayShader from './shaders/DisplayShader';
import ShadowShader from './shaders/ShadowShader';
import SkyboxShader from './shaders/SkyboxShader';
import LightModel from './light/models/LightModel';
import Material from './material/Material';
// import RayTracer from './shaders/RayTracer';

const scene = container.get<ISceneService>(SERVICE_IDENTIFIER.ISceneService);
const renderer = container.get<IRendererService>(SERVICE_IDENTIFIER.IRendererService);
const camera = container.get<ICameraService>(SERVICE_IDENTIFIER.ICameraService);
const controls = container.get<IControlsService>(SERVICE_IDENTIFIER.IControlsService);
const textureLoader = container.get<ITextureLoaderService>(SERVICE_IDENTIFIER.ITextureLoaderService);

renderer.on(Renderer.READY_EVENT, () => {

  // Setup camera
  const { width, height } = renderer.getSize();
  camera.init($V([0, 5, 10]), $V([0, 0, 0]), 60, width / height, .1, 100);
  camera.dolly(-10);

  // Load Textures
  const floorTexture = textureLoader.load(`${PUBLIC_PATH}static/images/floor-wood.jpg`);
  const skyboxTexture = textureLoader.loadCubeMap([
    `${PUBLIC_PATH}static/images/miramar_right.png`,
    `${PUBLIC_PATH}static/images/miramar_left.png`,
    `${PUBLIC_PATH}static/images/miramar_top.png`,
    `${PUBLIC_PATH}static/images/miramar_bottom.png`,
    `${PUBLIC_PATH}static/images/miramar_back.png`,
    `${PUBLIC_PATH}static/images/miramar_front.png`,
  ]);
  // const skyboxTexture = textureLoader.loadCubeMap([
  //   `${PUBLIC_PATH}static/images/right.jpg`,
  //   `${PUBLIC_PATH}static/images/left.jpg`,
  //   `${PUBLIC_PATH}static/images/top.jpg`,
  //   `${PUBLIC_PATH}static/images/bottom.jpg`,
  //   `${PUBLIC_PATH}static/images/back.jpg`,
  //   `${PUBLIC_PATH}static/images/front.jpg`,
  // ]);

  // Setup meshes & lights in current scene
  scene.addMesh(new Mesh({
    geometry: new Plane({
      center: $V([0, 0, 0]),
      width: 10,
      height: 10
    }),
    material: new Material({
      // color: $V([1.0, 0, 0]),
      texture: floorTexture
    })
  }));
  scene.addMesh(new Mesh({
    geometry: new Sphere({
      center: $V([0, 1, 0]),
      radius: 0.5
    }),
    material: new Material({
      color: $V([1.0, 0.5, 0.0])
    })
  }));

  // scene.addLight(new PointLight({
  //   position: $V([-5, 5, -5]),
  //   model: new LightModel({
  //     ambient: $V([0.05, 0.05, 0.05]),
  //     diffuse: $V([0.4, 0.4, 0.4]),
  //     specular: $V([0.5, 0.5, 0.5]),
  //     // attenuation: {
  //     //   linear: 0.1,
  //     //   quadratic: 0.01
  //     // }
  //   })
  // }));
  // scene.addLight(new DirectionalLight({
  //   direction: $V([0, -1, 0]),
  //   model: new LightModel({
  //     ambient: $V([0.2, 0.2, 0.2]),
  //     diffuse: $V([0.4, 0.4, 0.4]),
  //     specular: $V([0.5, 0.5, 0.5])
  //   })
  // }));
  // scene.addLight(new SpotLight({
  //   position: $V([-2, 15, 0]),
  //   direction: $V([0, -1, 0]),
  //   angle: 14,
  //   exponent: 40,
  //   model: new LightModel({
  //     ambient: $V([0.2, 0.2, 0.2]),
  //     diffuse: $V([1, 1, 1]),
  //     specular: $V([1, 1, 1]),
  //     attenuation: {
  //       linear: 0.1,
  //       quadratic: 0.01
  //     }
  //   })
  // }));
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

  // renderer.addShader(new SkyboxShader(renderer, scene, camera, skyboxTexture));
  renderer.addShader(new ShadowShader(renderer, scene, camera));
  renderer.addShader(new DisplayShader(renderer, scene, camera));
});
