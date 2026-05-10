import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";
import ChargeInput from "./chargeInput";
import PerfectEffects from "./perfectEffects";
import SquashBounce from "./squashBounce";
import chargeUrl from "../assets/media/charge.mp3?url";
import dieUrl from "../assets/media/die.mp3?url";

export default class Control {
  constructor(
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera,
    renderer: THREE.WebGLRenderer,
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
    this.squashBounce = new SquashBounce(this.avatar.avatar, {
      minChargeScaleY: this.minChargeScaleY,
      maxChargeScaleXZ: this.maxChargeScaleXZ,
      bounceDamping: this.bounceDamping,
      bounceAngular: this.bounceAngular,
    });
    this.perfectEffects = new PerfectEffects(this.scene, this.block.blockSize);
    this.chargeInput = new ChargeInput({
      domElement: this.renderer.domElement,
      ignoreSelectors: [".overlay-card", "#restart"],
      canStart: () => !this.isJumping,
      onBegin: () => this.beginCharge(),
      onEnd: durationMs => this.endCharge(durationMs),
      onCancel: () => this.cancelCharge(),
    });
  }

  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  avatar: Avatar;
  block: Block;

  // Jump Attr
  isJumping: boolean = false;
  keydownTime = 0;
  speedX = 0.2; // Horizon Speed
  speedY = 0; // Vertical Speed
  speedOffset = 0;
  jumpDirection = "";
  private chargeToSpeedDivisor = 2600;
  private maxChargeMs = 900; // 最大蓄力时长
  private minChargeMs = 300; // 最低蓄力时长
  private minChargeScaleY = 0.6;
  private maxChargeScaleXZ = 1.18;
  private bounceDamping = 12;
  private bounceAngular = 22;
  private jumpFrameIndex = 0;
  private jumpTotalFrames = 0;
  private jumpStartQuat = new THREE.Quaternion();
  private jumpAxis = new THREE.Vector3(1, 0, 0);
  private chargeInput: ChargeInput;
  private squashBounce: SquashBounce;
  private perfectEffects: PerfectEffects;

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

  private estimateJumpFrames = (initialVy: number, startY: number) => {
    let y = startY;
    let vy = initialVy;
    let frames = 0;
    for (let i = 0; i < 300; i++) {
      y += vy;
      vy -= 0.01;
      frames += 1;
      if (y <= startY && vy < 0) break;
    }
    return Math.max(1, frames);
  };

  private getBaseStandY = () => {
    const currentBlock = this.block.blocks[this.block.blocks.length - 1];
    const blockHeight = (currentBlock?.userData?.height as number | undefined) ?? 2;
    const avatarBaseHeight = (this.avatar.avatar?.userData?.height as number | undefined) ?? 2;
    const blockY = currentBlock?.position?.y ?? 0;
    return blockY + blockHeight / 2 + avatarBaseHeight / 2;
  };

  private getStandY = () => {
    const currentBlock = this.block.blocks[this.block.blocks.length - 1];
    const blockHeight = (currentBlock?.userData?.height as number | undefined) ?? 2;
    const avatarBaseHeight = (this.avatar.avatar?.userData?.height as number | undefined) ?? 2;
    const scaleY = this.isJumping ? 1 : this.avatar.avatar.scale.y;
    const avatarHeight = avatarBaseHeight * scaleY;
    const blockY = currentBlock?.position?.y ?? 0;
    return blockY + blockHeight / 2 + avatarHeight / 2;
  };

  // callback fn passed from outside
  successCallback: ((points: number) => void) | undefined;
  failedCallback: Function | undefined;
  setSuccessCallback(fn: (points: number) => void) {
    this.successCallback = fn;
  }
  setFailedCallback(fn: Function) {
    this.failedCallback = fn;
  }

  private beginCharge = () => {
    if (this.isJumping) return;
    if (this.keydownTime !== 0) return;

    this.keydownTime = performance.now();
    this.playAudio(this.chargeAudio);
  };

  private cancelCharge = () => {
    if (this.keydownTime === 0) return;
    this.stopAudio(this.chargeAudio);
    this.keydownTime = 0;
    this.squashBounce.startBounceToNormal();
  };

  private endCharge = (pressDurationMs: number) => {
    if (this.isJumping) return;
    if (this.keydownTime === 0) return;

    this.stopAudio(this.chargeAudio);
    this.keydownTime = 0;
    this.speedY = pressDurationMs / this.chargeToSpeedDivisor;
    this.squashBounce.startBounceToNormal();

    if (pressDurationMs < this.minChargeMs) return;

    const aPos = this.avatar.getPosition();
    const bPos = this.block.getPosition();
    this.jumpDirection =
      bPos.x === this.block.blocks[this.block.blocks.length - 2].position.x ? "left" : "right";
    this.speedOffset =
      this.jumpDirection === "right"
        ? ((bPos.z - aPos.z) / (bPos.x - aPos.x)) * this.speedX
        : ((bPos.x - aPos.x) / (bPos.z - aPos.z)) * this.speedX;

    aPos.y = this.getBaseStandY();
    this.jumpFrameIndex = 0;
    this.jumpTotalFrames = this.estimateJumpFrames(this.speedY, aPos.y);
    this.jumpStartQuat.copy(this.avatar.avatar.quaternion);
    const dir = new THREE.Vector3(bPos.x - aPos.x, 0, bPos.z - aPos.z);
    if (dir.lengthSq() > 0.000001) {
      dir.normalize();
      this.jumpAxis.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
      if (this.jumpAxis.lengthSq() < 0.000001) {
        this.jumpAxis.set(1, 0, 0);
      }
    } else {
      this.jumpAxis.set(1, 0, 0);
    }

    this.isJumping = true;
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

      if (this.jumpTotalFrames > 0) {
        const t = Math.min(1, this.jumpFrameIndex / this.jumpTotalFrames);
        this.avatar.avatar.quaternion
          .copy(this.jumpStartQuat)
          .multiply(new THREE.Quaternion().setFromAxisAngle(this.jumpAxis, t * Math.PI * 2));
        this.jumpFrameIndex += 1;
      }
    } else {
      // On block, stop moving
      aPos.y = standY;
      this.isJumping = false;
      this.speedOffset = 0;
      this.jumpTotalFrames = 0;
      this.jumpFrameIndex = 0;
      this.avatar.avatar.quaternion.copy(this.jumpStartQuat);

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

    // 根据落点离中心距离计算得分（中心3分，附近2分，边缘1分）
    const getLandingPoints = (ratio01: number) => {
      if (ratio01 <= 0.2) return 3;
      if (ratio01 <= 0.6) return 2;
      return 1;
    };

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
        const ratio01 = Math.min(1, distance / radius);
        const points = getLandingPoints(ratio01);
        points === 3 && currentBlock && this.perfectEffects.spawn(currentBlock);
        this.successCallback!(points);
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
      const dx = Math.abs(aPos.x - bPos.x);
      const dz = Math.abs(aPos.z - bPos.z);
      const ratio01 = Math.min(1, Math.max(dx, dz) / halfLen);
      const points = getLandingPoints(ratio01);
      points === 3 && currentBlock && this.perfectEffects.spawn(currentBlock);
      this.successCallback!(points);
      this.block.generateBlocks();
    }
  };

  restart = () => {
    this.chargeInput.reset();
    this.stopAudio(this.chargeAudio);
    this.stopAudio(this.dieAudio);
    this.perfectEffects.clear();
    this.isJumping = false;
    this.keydownTime = 0;
    this.speedY = 0;
    this.speedOffset = 0;
    this.jumpDirection = "";
    this.jumpFrameIndex = 0;
    this.jumpTotalFrames = 0;
    this.block.reset();
    this.avatar.reset();
    this.squashBounce.reset(this.getStandY());

    this.camera.lookAt(0, 0, 0);
  };

  update = () => {
    if (!this.isJumping && this.keydownTime !== 0) {
      const duration = performance.now() - this.keydownTime;
      const progress01 = duration / this.maxChargeMs;
      this.squashBounce.setChargeProgress(progress01, this.getStandY());
    }
    this.squashBounce.update(this.isJumping, this.getStandY());
    this.perfectEffects.update();
    this.isJumping && this.setJumpFrame();
  };
}
