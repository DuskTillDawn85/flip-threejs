import * as THREE from "three";

const BLOCK_SIZE: Array<number> = [8, 2, 8];

export default class Block {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateBlocks();
  }

  scene: THREE.Scene;

  generateBlocks = () => {
    const geometry = new THREE.BoxGeometry(...BLOCK_SIZE);
    const material = new THREE.MeshPhongMaterial({ color: 0x6a9b8c });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  };
}
