import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default class Avatar {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.initAvatar();
  }

  scene: THREE.Scene;
  loader: GLTFLoader;

  initAvatar = () => {
    this.loader.load("src/static/avatar.glb", glb => {
      let avatar = glb.scene.children[0];
      avatar.position.set(0, 1, 0);
      avatar.rotation.set(0, Math.PI / 2, 0);
      avatar.scale.set(2, 2, 2);

      const axes = new THREE.AxesHelper(100);
      avatar.add(axes);

      this.scene.add(avatar);
    });
  };
}
