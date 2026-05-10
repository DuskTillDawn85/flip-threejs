import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";
import chargeUrl from "../assets/media/charge.mp3?url";
import dieUrl from "../assets/media/die.mp3?url";

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
    this.chargeAudio.loop = true;
    this.chargeAudio.volume = 0.35;
    this.dieAudio.volume = 0.6;
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

  private chargeAudio = new Audio(chargeUrl);
  private dieAudio = new Audio(dieUrl);

  private playAudio = (audio: HTMLAudioElement) => {
    audio.currentTime = 0;
    const result = audio.play();
    if (result) {
      result.catch(() => undefined);
    }
  };

  private stopAudio = (audio: HTMLAudioElement) => {
    audio.pause();
    audio.currentTime = 0;
  };

  private getStandY = () => {
    const currentBlock = this.block.blocks[this.block.blocks.length - 1];
    const blockHeight = (currentBlock?.userData?.height as number | undefined) ?? 2;
    const avatarHeight = (this.avatar.avatar?.userData?.height as number | undefined) ?? 2;
    const blockY = currentBlock?.position?.y ?? 0;
    return blockY + blockHeight / 2 + avatarHeight / 2;
  };

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
      this.playAudio(this.chargeAudio);
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    this.stopAudio(this.chargeAudio);

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
    const standY = this.getStandY();

    if (aPos.y >= standY) {
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
      aPos.y = standY;
      this.isJumping = false;
      this.speedOffset = 0;

      this.checkGameState();
    }
  };

  private checkGameState = () => {
    const aPos = this.avatar.getPosition();
    const bPos = this.block.getPosition();
    const avatarSize = 3; // hard code avatar size for now!!!
    const currentBlock = this.block.blocks[this.block.blocks.length - 1];
    const shape = currentBlock?.userData?.shape as string | undefined;
    const zDelta = Math.abs(aPos.z - bPos.z);
    const xDelta = Math.abs(aPos.x - bPos.x);

    if (shape === "cylinder") {
      const radius =
        (currentBlock?.userData?.radius as number | undefined) ?? this.block.blockSize / 2;
      const dx = aPos.x - bPos.x;
      const dz = aPos.z - bPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance > radius) {
        if (distance < radius + avatarSize) {
          if (Math.abs(dx) > Math.abs(dz)) {
            this.avatar.fallFromEdge(dx > 0 ? "x+" : "x-");
          } else {
            this.avatar.fallFromEdge(dz > 0 ? "z+" : "z-");
          }
        } else {
          this.avatar.fall();
        }
        this.stopAudio(this.chargeAudio);
        this.playAudio(this.dieAudio);
        this.failedCallback!();
      } else {
        this.successCallback!();
        this.block.generateBlocks();
      }
      return;
    }

    const size = (currentBlock?.userData?.size as number | undefined) ?? this.block.blockSize;
    const halfLen = size / 2;
    if (zDelta > halfLen) {
      zDelta < avatarSize
        ? aPos.z > bPos.z
          ? this.avatar.fallFromEdge("z+")
          : this.avatar.fallFromEdge("z-")
        : this.avatar.fall();
      this.playAudio(this.dieAudio);
      this.failedCallback!();
    } else if (xDelta > halfLen) {
      xDelta < avatarSize
        ? aPos.x > bPos.x
          ? this.avatar.fallFromEdge("x+")
          : this.avatar.fallFromEdge("x-")
        : this.avatar.fall();
      this.playAudio(this.dieAudio);
      this.failedCallback!();
    } else {
      this.successCallback!();
      this.block.generateBlocks();
    }
  };

  restart = () => {
    this.stopAudio(this.chargeAudio);
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
