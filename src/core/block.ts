import * as THREE from "three";

const BLOCK_SIZE: Array<number> = [8, 2, 8];

export default class Block {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateBlocks();
  }

  block = new THREE.Mesh
  scene: THREE.Scene;

  generateBlocks = () => {
    const cubeG = new THREE.BoxGeometry(...BLOCK_SIZE);
    const cubeM = new THREE.MeshPhongMaterial({ color: 0x74759b });
    this.block = new THREE.Mesh(cubeG, cubeM);
    this.block.receiveShadow = this.block.castShadow = true;
    this.scene.add(this.block);


    const block2 = new THREE.Mesh(cubeG, cubeM);
    block2.receiveShadow = block2.castShadow = true;
    block2.position.set(20, 0, 0)
    this.scene.add(block2);
  };
}
