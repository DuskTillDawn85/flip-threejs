import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";

enum Result {
  success = "block", // success, continue
  edge = "edge", // on the edge of block
  blank = "blank", // falling on the ground
}

export default class Control {
  constructor(
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera,
    renderer: THREE.Renderer,
    avatar: Avatar,
    block: Block
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.avatar = avatar;
    this.block = block;
    this.initEventListeners();
  }

  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.Renderer;
  avatar: Avatar;
  block: Block;

  // Jump Attr
  isJumping: boolean = false;
  keydownTime = 0;
  speedX = 0.2; // Horizon Speed
  speedY = 0; // Vertical Speed
  speedOffset = 0;
  jumpDirection = "";

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    if (this.keydownTime == 0) {
      this.keydownTime = performance.now();
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    // Set speed
    this.speedY = (performance.now() - this.keydownTime) / 2000;
    const aPos = this.avatar.avatar.position;
    const bPos = this.block.block.position;
    this.jumpDirection =
      bPos.x === this.block.blocks[this.block.blocks.length - 2].position.x ? "left" : "right";
    this.speedOffset =
      this.jumpDirection === "right"
        ? ((bPos.z - aPos.z) / (bPos.x - aPos.x)) * this.speedX
        : ((bPos.x - aPos.x) / (bPos.z - aPos.z)) * this.speedX;

    // Throttle
    if (this.speedY < 0.1) return;

    this.isJumping = true;
    this.keydownTime = 0;
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  };

  private setJumpFrame = () => {
    const aPos = this.avatar.avatar.position;

    if (aPos.y >= 1) {
      // In the Air, keep moving
      if (this.jumpDirection === "left") {
        aPos.z -= this.speedX;
        aPos.x -= this.speedOffset;
      } else {
        // right
        aPos.x += this.speedX;
        aPos.z += this.speedOffset;
      }
      aPos.y += this.speedY;

      this.speedY -= 0.01; // Gravity
    } else {
      // On block, stop moving
      aPos.y = 1;
      this.isJumping = false;
      this.speedOffset = 0;

      this.block.generateBlocks();
    }
  };

  update = () => {
    this.isJumping && this.setJumpFrame();
  };

  destroy = () => {
    document.body.removeEventListener("keydown", this.keydownHandler);
    document.body.removeEventListener("keyup", this.keyupHandler);
  };
}
