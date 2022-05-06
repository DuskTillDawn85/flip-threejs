import * as THREE from "three";

export default class Block {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.generateBlocks();
  }

  scene: THREE.Scene;

  generateBlocks = () => {
    const geometry = new THREE.BoxGeometry(20,10,30);
    const material = new THREE.MeshPhongMaterial({ color: 0x6a9b8c });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(10,10,10)
    this.scene.add(cube);
  };
}
