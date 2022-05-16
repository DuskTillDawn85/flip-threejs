import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";

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

  // callback fn passed from outside
  successCallback: Function | undefined;
  failedCallback: Function | undefined;
  setSuccessCallback(fn: Function) {
    this.successCallback = fn;
  }
  setFailedCallback(fn: Function) {
    this.failedCallback = fn;
  }

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
    const aPos = this.avatar.getPosition();
    const bPos = this.block.getPosition();
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
    const aPos = this.avatar.getPosition();

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

      this.checkGameState();
    }
  };

  private checkGameState = () => {
    const halfLen = this.block.blockSize / 2;
    const aPos = this.avatar.getPosition();
    const bPos = this.block.getPosition();
    const avatarSize = 3; // hard code avatar size for now!!!
    const zDelta = Math.abs(aPos.z - bPos.z);
    const xDelta = Math.abs(aPos.x - bPos.x);

    if (zDelta > halfLen) {
      zDelta < avatarSize
        ? aPos.z > bPos.z
          ? this.avatar.fallFromEdge("z+")
          : this.avatar.fallFromEdge("z-")
        : this.avatar.fall();
      this.failedCallback!();
    } else if (xDelta > halfLen) {
      xDelta < avatarSize
        ? aPos.x > bPos.x
          ? this.avatar.fallFromEdge("x+")
          : this.avatar.fallFromEdge("x-")
        : this.avatar.fall();
      this.failedCallback!();
    } else {
      this.block.generateBlocks();
      this.successCallback!();
    }
  };

  restart = () => {
    this.block.reset();
    this.avatar.reset();

    this.camera.lookAt(0, 0, 0);
  };

  update = () => {
    this.isJumping && this.setJumpFrame();
  };

  // private destroy = () => {
  //   document.body.removeEventListener("keydown", this.keydownHandler);
  //   document.body.removeEventListener("keyup", this.keyupHandler);
  // };
}
