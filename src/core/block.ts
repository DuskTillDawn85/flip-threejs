import * as THREE from "three";

const BLOCK_SIZE: Array<number> = [8, 2, 8];

export default class Block {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateBlocks();
  }

  scene: THREE.Scene;

  generateBlocks = () => {
    const cubeG = new THREE.BoxGeometry(...BLOCK_SIZE);
    const cubeM = new THREE.MeshPhongMaterial({ color: 0x2c9678 });
    const cube = new THREE.Mesh(cubeG, cubeM);
    cube.receiveShadow = cube.castShadow = true;
    this.scene.add(cube);
  };
}
