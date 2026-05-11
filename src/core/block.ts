import * as THREE from "three";
import { dtFactorFromNowMs } from "./time";

export const BLOCK_HEIGHT = 2;
export const BLOCK_MAX_SIZE = 6;
export const BLOCK_MIN_SIZE = 4;
export const BLOCK_GAP = 2;
export const BLOCK_MAX_DISTANCE = 20;

export default class Block {
  constructor(scene: THREE.Scene, camera: THREE.OrthographicCamera) {
    this.scene = scene;
    this.camera = camera;
    this.generateBlocks();
    this.generateBlocks(); // Init 2 blocks first time
  }

  block = new THREE.Mesh();
  blocks: THREE.Mesh[] = [];
  blockSize = 5;
  private blockHeight = BLOCK_HEIGHT;
  private score = 0;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  cameraPos = {
    current: new THREE.Vector3(),
    next: new THREE.Vector3(),
  };
  private cameraAnimToken = 0;
  private cameraRafId: number | undefined;

  setScore = (score: number) => {
    this.score = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  };

  private getNextBlockSize = () => {
    if (this.score <= 15) {
      return BLOCK_MAX_SIZE;
    }
    if (this.score <= 30) {
      return 5.5;
    }
    if (this.score <= 45) {
      return 5;
    }
    if (this.score <= 100) {
      return 4.5;
    }
    return BLOCK_MIN_SIZE;
  };

  private getNextBlockDistance = (minDistance: number) => {
    let baseMin = 6;
    let baseMax = 16;
    if (this.score <= 20) {
      baseMin = 6;
      baseMax = 11;
    } else if (this.score <= 40) {
      baseMin = 7;
      baseMax = 13;
    } else if (this.score <= 60) {
      baseMin = 8;
      baseMax = 15;
    } else if (this.score <= 100) {
      baseMin = 9;
      baseMax = 17;
    } else {
      baseMin = 10;
      baseMax = BLOCK_MAX_DISTANCE;
    }

    const min = Math.max(baseMin, minDistance);
    const max = Math.max(baseMax, min + 0.1);
    return min + Math.random() * (max - min);
  };

  private getRandomBrightColor = () => {
    const hue = Math.random();
    const saturation = 0.45 + Math.random() * 0.35;
    const lightness = 0.65 + Math.random() * 0.2;
    return new THREE.Color().setHSL(hue, saturation, lightness);
  };

  private createBlockMesh = () => {
    const isCylinder = Math.random() > 0.5;
    const size = this.getNextBlockSize();
    const geometry = isCylinder
      ? new THREE.CylinderGeometry(size / 2, size / 2, this.blockHeight, 32)
      : new THREE.BoxGeometry(size, this.blockHeight, size);

    const material = new THREE.MeshPhongMaterial({ color: this.getRandomBrightColor() });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = mesh.castShadow = true;
    mesh.userData.shape = isCylinder ? "cylinder" : "box";
    mesh.userData.size = size;
    mesh.userData.height = this.blockHeight;
    if (isCylinder) {
      mesh.userData.radius = size / 2;
    }
    return mesh;
  };

  private disposeMesh = (mesh: THREE.Mesh) => {
    mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose());
    } else {
      material.dispose();
    }
    this.scene.remove(mesh);
  };

  generateBlocks = () => {
    this.block = this.createBlockMesh();

    if (this.blocks.length) {
      const lastBlock = this.blocks[this.blocks.length - 1];
      const lastPos = lastBlock.position;
      this.block.position.set(lastPos.x, lastPos.y, lastPos.z);

      // update position for new block
      const newSize = (this.block.userData.size as number | undefined) ?? this.blockSize;
      const lastSize = (lastBlock.userData.size as number | undefined) ?? this.blockSize;
      const gap = BLOCK_GAP;
      const minDistance = lastSize / 2 + newSize / 2 + gap;
      const distance = this.getNextBlockDistance(minDistance);
      Math.random() > 0.5
        ? (this.block.position.z -= distance)
        : (this.block.position.x += distance);
    }

    this.blocks.push(this.block);
    this.scene.add(this.block);
    this.blocks.length > 1 && this.updateCameraPos();

    // Remove redundant block
    if (this.blocks.length > 6) {
      const mesh = this.blocks.shift();
      mesh && this.disposeMesh(mesh);
    }
  };

  private updateCameraPos = () => {
    const lastIndex = this.blocks.length - 1;
    const pointA = {
      x: this.blocks[lastIndex].position.x,
      z: this.blocks[lastIndex].position.z,
    };
    const pointB = {
      x: this.blocks[lastIndex - 1]?.position.x || 0,
      z: this.blocks[lastIndex - 1]?.position.z || 0,
    };

    this.cameraPos.next = new THREE.Vector3(
      (pointA.x + pointB.x) / 2,
      0,
      (pointA.z + pointB.z) / 2
    );
    this.updateCamera();
  };

  // z >> ----
  // x >> ++++
  currentX = 0;
  currentZ = 0;
  private updateCamera = () => {
    this.cameraAnimToken += 1;
    const token = this.cameraAnimToken;
    if (this.cameraRafId !== undefined) {
      cancelAnimationFrame(this.cameraRafId);
      this.cameraRafId = undefined;
    }
    let lastMs = 0;

    // 小人当前站的格子
    this.currentX = this.cameraPos.current.x;
    this.currentZ = this.cameraPos.current.z;

    // 当前格子和下一个格子的中点
    const nextX = this.cameraPos.next.x;
    const nextZ = this.cameraPos.next.z;

    const step = (nowMs: number) => {
      if (token !== this.cameraAnimToken) return;

      this.currentX = this.cameraPos.current.x;
      this.currentZ = this.cameraPos.current.z;

      if (this.currentX < nextX || this.currentZ > nextZ) {
        if (lastMs === 0) lastMs = nowMs;
        const dtFactor = dtFactorFromNowMs(nowMs, lastMs);
        lastMs = nowMs;
        const stepSize = 0.1 * dtFactor;

        if (this.currentX < nextX) {
          this.currentX = Math.min(nextX, this.currentX + Math.min(stepSize, nextX - this.currentX));
        }
        if (this.currentZ > nextZ) {
          this.currentZ = Math.max(nextZ, this.currentZ - Math.min(stepSize, this.currentZ - nextZ));
        }

        this.camera.lookAt(new THREE.Vector3(this.currentX, 0, this.currentZ));
        this.cameraPos.current.x = this.currentX;
        this.cameraPos.current.z = this.currentZ;

        this.camera.updateProjectionMatrix();
        this.cameraRafId = requestAnimationFrame(step);
      } else {
        this.cameraRafId = undefined;
      }
    };

    this.cameraRafId = requestAnimationFrame(step);
  };

  reset = () => {
    this.cameraAnimToken += 1;
    if (this.cameraRafId !== undefined) {
      cancelAnimationFrame(this.cameraRafId);
      this.cameraRafId = undefined;
    }

    const len = this.blocks.length;
    for (let i = 0; i < len; i++) {
      const block = this.blocks.pop();
      block && this.disposeMesh(block);
    }
    this.score = 0;
    this.cameraPos.current = new THREE.Vector3();
    this.generateBlocks();
    this.generateBlocks(); // it takes two :)
  };

  getPosition = () => this.block.position;
}
