import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default class Control {
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.Renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = new OrbitControls(camera, renderer.domElement);
  }

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  controls: OrbitControls;
}
