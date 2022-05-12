import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

enum Result {
  success= 'block',  // success, continue
  edge = 'edge',   // on the edge of block
  blank = 'blank'   // falling on the ground
}

export default class Control {
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
    avatar: Avatar,
    block: Block
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.avatar = avatar;
    this.block = block;
    this.initEventListeners();
  }

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  controls: OrbitControls;
  avatar: Avatar;
  block: Block;

  // Jump Attr
  isJumping: boolean = false;
  keydownTime = 0;
  speedX = 0.2; // Horizon Speed
  speedY = 0; // Vertical Speed

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    if (this.keydownTime == 0) {
      this.keydownTime = performance.now();
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " ") return;

    // Set initial vertical speed
    this.speedY = (performance.now() - this.keydownTime) / 4000;
    this.keydownTime = 0;

    // Throttle
    if (this.speedY < 0.1) return;

    this.isJumping = true;
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  };

  private setJumpFrame = () => {
    const pos = this.avatar.avatar.position;
    
    // In the Air, keep moving
    if (pos.y >= 1) {
      pos.x += this.speedX;
      pos.y += this.speedY;

      this.speedY -= 0.005; // Gravity
    } else {
      // On block, stop moving
      pos.y = 1;
      this.isJumping = false;
    }
  };

  update = () => {
    this.controls.update();

    this.isJumping && this.setJumpFrame();
  };
}
