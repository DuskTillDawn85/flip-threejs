import * as THREE from "three";
import Avatar from "./avatar";
import Block from "./block";
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
    this.initEventListeners();
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
  private bounceStartMs = 0;
  private bounceFromScaleY = 1;
  private bounceFromScaleXZ = 1;
  private bounceDamping = 12;
  private bounceAngular = 22;
  private jumpFrameIndex = 0;
  private jumpTotalFrames = 0;
  private jumpStartQuat = new THREE.Quaternion();
  private jumpAxis = new THREE.Vector3(1, 0, 0);
  private activePointerId: number | null = null;
  private rippleEffects: Array<{
    mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    startMs: number;
    durationMs: number;
    startScale: number;
    endScale: number;
  }> = [];
  private particleEffects: Array<{
    points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    velocities: Float32Array;
    startMs: number;
    lastMs: number;
    durationMs: number;
  }> = [];

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

  private spawnPerfectEffects = (blockMesh: THREE.Mesh) => {
    const height = (blockMesh.userData.height as number | undefined) ?? 2;
    const shape = blockMesh.userData.shape as string | undefined;
    const baseRadius =
      shape === "cylinder"
        ? ((blockMesh.userData.radius as number | undefined) ?? this.block.blockSize / 2)
        : (((blockMesh.userData.size as number | undefined) ?? this.block.blockSize) / 2);

    const center = blockMesh.position.clone();
    center.y += height / 2 + 0.18;

    const makeRing = (delayMs: number, startScale: number, endScale: number) => {
      const ringGeometry = new THREE.RingGeometry(0.92, 1, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.copy(center);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.renderOrder = 10;
      ringMesh.scale.set(startScale, startScale, startScale);
      this.scene.add(ringMesh);
      this.rippleEffects.push({
        mesh: ringMesh,
        startMs: performance.now() + delayMs,
        durationMs: 650,
        startScale,
        endScale,
      });
    };

    makeRing(0, baseRadius * 0.15, baseRadius * 1.45);
    makeRing(110, baseRadius * 0.1, baseRadius * 1.65);
    // makeRing(220, baseRadius * 0.07, baseRadius * 1.85);

    const count = 5 + Math.floor(Math.random() * 6);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = center.x;
      positions[idx + 1] = center.y;
      positions[idx + 2] = center.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * 1.8;
      velocities[idx] = Math.cos(angle) * speed;
      velocities[idx + 2] = Math.sin(angle) * speed;
      velocities[idx + 1] = 5.5 + Math.random() * 2.0;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff7a00,
      size: 5.0,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(particleGeometry, particleMaterial);
    points.renderOrder = 11;
    points.frustumCulled = false;
    this.scene.add(points);
    const now = performance.now();
    this.particleEffects.push({
      points,
      velocities,
      startMs: now,
      lastMs: now,
      durationMs: 900,
    });
  };

  private updatePerfectEffects = () => {
    const now = performance.now();

    for (let i = this.rippleEffects.length - 1; i >= 0; i--) {
      const effect = this.rippleEffects[i];
      const t = (now - effect.startMs) / effect.durationMs;
      if (t < 0) {
        effect.mesh.material.opacity = 0;
        continue;
      }
      if (t >= 1) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
        this.rippleEffects.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - t, 2);
      const scale = effect.startScale + (effect.endScale - effect.startScale) * eased;
      effect.mesh.scale.set(scale, scale, scale);
      effect.mesh.material.opacity = Math.max(0, 0.9 * (1 - t) * (1 - t));
    }

    for (let i = this.particleEffects.length - 1; i >= 0; i--) {
      const effect = this.particleEffects[i];
      const t = (now - effect.startMs) / effect.durationMs;
      if (t >= 1) {
        this.scene.remove(effect.points);
        effect.points.geometry.dispose();
        effect.points.material.dispose();
        this.particleEffects.splice(i, 1);
        continue;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - effect.lastMs) / 1000));
      effect.lastMs = now;

      const geometry = effect.points.geometry;
      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const vel = effect.velocities;

      for (let p = 0; p < arr.length; p += 3) {
        vel[p + 1] -= 2.8 * dt;
        arr[p] += vel[p] * dt;
        arr[p + 1] += vel[p + 1] * dt;
        arr[p + 2] += vel[p + 2] * dt;

        vel[p] *= 0.996;
        vel[p + 1] *= 0.996;
        vel[p + 2] *= 0.996;
      }

      posAttr.needsUpdate = true;
      effect.points.material.opacity = Math.max(0, 1 - t);
    }
  };

  private clearPerfectEffects = () => {
    for (const effect of this.rippleEffects) {
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
    }
    this.rippleEffects = [];

    for (const effect of this.particleEffects) {
      this.scene.remove(effect.points);
      effect.points.geometry.dispose();
      effect.points.material.dispose();
    }
    this.particleEffects = [];
  };

  private setAvatarScaleForChargeProgress = (progress01: number) => {
    const t = Math.max(0, Math.min(1, progress01));
    const scaleY = 1 - (1 - this.minChargeScaleY) * t;
    const scaleXZ = 1 + (this.maxChargeScaleXZ - 1) * t;
    const mesh = this.avatar.avatar;
    mesh.scale.set(scaleXZ, scaleY, scaleXZ);
    mesh.position.y = this.getStandY();
  };

  private setAvatarScaleImmediate = (scaleXZ: number, scaleY: number) => {
    const mesh = this.avatar.avatar;
    mesh.scale.set(scaleXZ, scaleY, scaleXZ);
    if (!this.isJumping) {
      mesh.position.y = this.getStandY();
    }
  };

  private startBounceToNormalScale = () => {
    const mesh = this.avatar.avatar;
    this.bounceStartMs = performance.now();
    this.bounceFromScaleY = mesh.scale.y;
    this.bounceFromScaleXZ = mesh.scale.x;
  };

  private updateBounceScale = () => {
    if (this.bounceStartMs === 0) return;

    const elapsedMs = performance.now() - this.bounceStartMs;
    const t = elapsedMs / 1000;
    const amplitude = Math.exp(-this.bounceDamping * t);

    if (elapsedMs > 420 || amplitude < 0.02) {
      this.bounceStartMs = 0;
      this.setAvatarScaleImmediate(1, 1);
      return;
    }

    const w = this.bounceAngular;
    const cos = Math.cos(w * t);
    const scaleY = Math.max(0.2, 1 + (this.bounceFromScaleY - 1) * amplitude * cos);
    const scaleXZ = Math.max(0.2, 1 + (this.bounceFromScaleXZ - 1) * amplitude * cos);
    this.setAvatarScaleImmediate(scaleXZ, scaleY);
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
    this.startBounceToNormalScale();
  };

  private endCharge = () => {
    if (this.isJumping) return;
    if (this.keydownTime === 0) return;

    this.stopAudio(this.chargeAudio);
    const pressDuration = performance.now() - this.keydownTime;
    this.keydownTime = 0;
    this.speedY = pressDuration / this.chargeToSpeedDivisor;
    this.startBounceToNormalScale();

    if (pressDuration < this.minChargeMs) return;

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

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
    }
    if (e.key !== " " || this.isJumping) return;

    this.beginCharge();
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault();
    }
    if (e.key !== " " || this.isJumping) return;

    this.endCharge();
  };

  private pointerdownHandler = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(".overlay-card") || target?.closest("#restart")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (this.activePointerId !== null) return;
    if (this.isJumping) return;

    e.preventDefault();
    this.activePointerId = e.pointerId;
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.beginCharge();
  };

  private pointerupHandler = (e: PointerEvent) => {
    if (this.activePointerId !== e.pointerId) return;
    e.preventDefault();
    this.activePointerId = null;
    this.endCharge();
  };

  private pointercancelHandler = (e: PointerEvent) => {
    if (this.activePointerId !== e.pointerId) return;
    e.preventDefault();
    this.activePointerId = null;
    this.cancelCharge();
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
    this.renderer.domElement.addEventListener("pointerdown", this.pointerdownHandler);
    this.renderer.domElement.addEventListener("pointerup", this.pointerupHandler);
    this.renderer.domElement.addEventListener("pointercancel", this.pointercancelHandler);
    this.renderer.domElement.addEventListener("lostpointercapture", this.pointercancelHandler);
    window.addEventListener("blur", () => {
      this.activePointerId = null;
      this.cancelCharge();
    });
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
        points === 3 && currentBlock && this.spawnPerfectEffects(currentBlock);
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
      points === 3 && currentBlock && this.spawnPerfectEffects(currentBlock);
      this.successCallback!(points);
      this.block.generateBlocks();
    }
  };

  restart = () => {
    this.activePointerId = null;
    this.stopAudio(this.chargeAudio);
    this.stopAudio(this.dieAudio);
    this.clearPerfectEffects();
    this.isJumping = false;
    this.keydownTime = 0;
    this.speedY = 0;
    this.speedOffset = 0;
    this.jumpDirection = "";
    this.jumpFrameIndex = 0;
    this.jumpTotalFrames = 0;
    this.bounceStartMs = 0;
    this.setAvatarScaleImmediate(1, 1);
    this.block.reset();
    this.avatar.reset();

    this.camera.lookAt(0, 0, 0);
  };

  update = () => {
    if (!this.isJumping && this.keydownTime !== 0) {
      const duration = performance.now() - this.keydownTime;
      const progress01 = duration / this.maxChargeMs;
      this.setAvatarScaleForChargeProgress(progress01);
    }
    this.updateBounceScale();
    this.updatePerfectEffects();
    this.isJumping && this.setJumpFrame();
  };

  // private destroy = () => {
  //   document.body.removeEventListener("keydown", this.keydownHandler);
  //   document.body.removeEventListener("keyup", this.keyupHandler);
  // };
}
