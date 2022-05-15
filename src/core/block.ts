import * as THREE from "three";

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
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  cameraPos = {
    current: new THREE.Vector3(),
    next: new THREE.Vector3(),
  };

  generateBlocks = () => {
    const cubeG = new THREE.BoxGeometry(this.blockSize, 2, this.blockSize);
    const cubeM = new THREE.MeshPhongMaterial({ color: 0xbebebe });
    this.block = new THREE.Mesh(cubeG, cubeM);
    this.block.receiveShadow = this.block.castShadow = true;

    if (this.blocks.length) {
      const lastPos = this.blocks[this.blocks.length - 1].position;
      this.block.position.set(lastPos.x, lastPos.y, lastPos.z);

      // update position for new block
      const distance = 6 + Math.random() * 10;
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
      mesh!.geometry.dispose();
      this.scene.remove(mesh!);
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
    // 小人当前站的格子
    this.currentX = this.cameraPos.current.x;
    this.currentZ = this.cameraPos.current.z;

    // 当前格子和下一个格子的中点
    const nextX = this.cameraPos.next.x;
    const nextZ = this.cameraPos.next.z;

    if (this.currentX < nextX || this.currentZ > nextZ) {
      this.currentX < nextX && (this.currentX += 0.1);
      this.currentZ > nextZ && (this.currentZ -= 0.1);
      if (Math.abs(this.currentX - nextX) < 0.1) {
        this.currentX = nextX;
      }
      if (Math.abs(this.currentZ - nextZ) < 0.1) {
        this.currentZ = nextZ;
      }
      this.camera.lookAt(new THREE.Vector3(this.currentX, 0, this.currentZ));
      this.cameraPos.current.x = this.currentX;
      this.cameraPos.current.z = this.currentZ;

      // don't know is useful or not...
      this.camera.updateProjectionMatrix();

      requestAnimationFrame(() => {
        this.updateCamera();
      });
    }
  };

  getPosition = () => this.block.position;
}
