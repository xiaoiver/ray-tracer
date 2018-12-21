import { injectable, inject } from 'inversify';
import SERVICE_IDENTIFIER from '../constants/services';
import { ICameraService } from '../services/Camera';
import { IRendererService } from '../services/Renderer';
import { ISceneService } from '../services/Scene';
import BaseShader from './BaseShader';
import { setVertexAttribute, setUniforms } from '../utils/gl';

@injectable()
export default class PolygonShader extends BaseShader {

  constructor(
    @inject(SERVICE_IDENTIFIER.IRendererService) renderer: IRendererService,
    @inject(SERVICE_IDENTIFIER.ISceneService) scene: ISceneService,
    @inject(SERVICE_IDENTIFIER.ICameraService) camera: ICameraService,
  ) {
    super(renderer, scene, camera);
  }

  generateShaders() {
    const vertexShader = `
      attribute vec4 a_Position;
      // attribute float a_VertexValid;
      attribute vec4 a_Color;

      uniform float u_ProjectScale;
      uniform vec3 u_ProjectCenter;
      uniform vec3 u_PixelsPerMeter;
      uniform mat4 u_ModelMatrix;
      uniform mat4 u_ViewProjectionMatrix;

      varying vec4 v_Color;

      const float TILE_SIZE = 512.0;
      const float PI = 3.1415926536;
      const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);

      float project_scale(float meters) {
        return meters * u_PixelsPerMeter.z;
      }

      //
      // Projecting positions - non-linear projection: lnglats => unit tile [0-1, 0-1]
      //
      vec2 project_mercator_(vec2 lnglat) {
        float x = lnglat.x;
        return vec2(
          radians(x) + PI,
          PI - log(tan(PI * 0.25 + radians(lnglat.y) * 0.5))
        );
      }

      //
      // Projects lnglats (or meter offsets, depending on mode) to pixels
      //
      vec4 project_position(vec4 position) {
        return u_ModelMatrix * vec4(
          project_mercator_(position.xy) * WORLD_SCALE * u_ProjectScale,
          project_scale(position.z),
          position.w
        );
      }

      //
      // Projects from "world" coordinates to clip space.
      //
      vec4 project_to_clipspace(vec4 position) { 
        return u_ViewProjectionMatrix * position + vec4(u_ProjectCenter, 1.0);
      }      

      vec4 project_position_to_clipspace(vec3 position, vec3 offset) {
        vec3 projectedPosition = project_position(vec4(position, 1.0)).xyz;
        vec4 worldPosition = vec4(projectedPosition + offset, 1.0);
        return project_to_clipspace(worldPosition);
      }
    
      void main() {
        v_Color = a_Color;
        gl_Position = project_position_to_clipspace(vec3(a_Position), vec3(0.));
      }
    `;

    const fragmentShader = `
      precision mediump float;

      varying vec4 v_Color;

      void main() {
        gl_FragColor = v_Color;
      }
    `;

    return {
      vertexShader,
      fragmentShader
    };
  }

  draw() {
    const {gl, shader: {program}, renderer} = this;
    const {width, height} = renderer.getSize();

    gl.getExtension('OES_element_index_uint');

    gl.viewport(0, 0, width, height);

    this.activate();

    // Draw every mesh in current scene
    this.scene.meshes.forEach(mesh => {
      const {geometry, colorAttributeArray} = mesh;
      // @ts-ignore
      const {vertices, modelMatrix, scale, pixelsPerMeter} = geometry;

      const vpMatrix = this.camera.transform;

      // Setup uniforms relative to current model
      setUniforms(gl, program, {
        'u_ViewProjectionMatrix': vpMatrix,
        'u_ModelMatrix': modelMatrix,
        'u_ProjectScale': scale,
        'u_ProjectCenter': $V([0, 0, 0]),
        'u_PixelsPerMeter': $V(pixelsPerMeter),
      });

      // Write the vertex property to buffers (coordinates, colors and normals)
      if (!setVertexAttribute(gl, program, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
      if (!setVertexAttribute(gl, program, 'a_Color', colorAttributeArray, 3, gl.FLOAT)) return -1;

      mesh.geometry.draw(gl);
    });

  }
}