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
    console.log("this.avatar :>> ", this.avatar);
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

  temp: number = 0.1;

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    if (this.keydownTime === 0) {
      this.keydownTime = performance.now();
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " ") return;

    const timeDelta = (performance.now() - this.keydownTime) / 1000;
    this.keydownTime = 0;
    this.isJumping = true;
    console.log("this.avatar :>> ", this.avatar);
    setTimeout(() => {
      this.isJumping = false;
    }, 600);
    console.log("按下时间：s", timeDelta);
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  };

  update = () => {
    this.controls.update();

    if(this.isJumping) {
      this.temp += 0.1;
      this.avatar.avatar.position.set(this.temp, this.temp, this.temp)
    }
  };
}
