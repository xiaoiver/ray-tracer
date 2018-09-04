export default class Scene {
  constructor() {
    this.objects = [];
    this.lights = [];
  }

  add(object) {
    this.objects.push(object);
  }

  addLight(light) {
    this.lights.push(light);
  }
}