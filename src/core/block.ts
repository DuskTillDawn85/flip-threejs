import * as THREE from "three";

const BLOCK_SIZE: Array<number> = [6, 2, 6];

export default class Block {
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.generateBlocks();
    this.generateBlocks(); // Init 2 blocks first time
  }

  block = new THREE.Mesh();
  blocks: Array<THREE.Mesh> = [];
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;

  generateBlocks = () => {
    const cubeG = new THREE.BoxGeometry(...BLOCK_SIZE);
    const cubeM = new THREE.MeshPhongMaterial({ color: 0xbebebe });
    this.block = new THREE.Mesh(cubeG, cubeM);
    this.block.receiveShadow = this.block.castShadow = true;

    if (this.blocks.length) {
      const lastPos = this.blocks[this.blocks.length - 1].position;
      this.block.position.set(lastPos.x, lastPos.y, lastPos.z);
      // update position for new block
      Math.random() > 0.5 ? (this.block.position.z -= 10) : (this.block.position.x += 10);

    }
    
    this.blocks.push(this.block);
    this.scene.add(this.block);

    // Remove redundant block
    // if(this.blocks.length > 6) this.scene.remove(this.block)
  };
}
