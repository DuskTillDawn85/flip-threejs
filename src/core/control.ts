import * as THREE from "three";
import Avatar from "./avatar";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default class Control {
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
    avatar: Avatar
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.avatar = avatar;
    this.initEventListeners();
  }

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  controls: OrbitControls;
  avatar: Avatar;

  // Space Jump
  isJumping: boolean = false;
  keydownTime: number = 0;
  deltaTime: number = 0;
  velocity: number = 0;
  gravity: number = 1;

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    if (this.keydownTime === 0) {
      this.keydownTime = performance.now();
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " ") return;

    this.deltaTime = (performance.now() - this.keydownTime) / 1000;
    this.keydownTime = 0;

    // 防抖
    if (this.deltaTime < 0.5) return;

    this.isJumping = true;
    this.velocity = this.deltaTime * 15; // 初速度 V0
    setTimeout(() => {
      this.isJumping = false;
    }, this.deltaTime * 750);
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  };

  temp = 0.1;
  update = () => {
    this.controls.update();

    if (this.isJumping) {
      this.temp += 0.02;
      const distance = this.velocity * this.temp - 0.5 * this.velocity * this.temp ** 2;
      this.avatar.avatar.position.set(this.velocity * this.temp, distance, 0);
      this.avatar.avatar.rotation.z = this.temp;
    } else this.temp = 0;
  };
}
