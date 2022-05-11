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
  avatar: THREE.Object3D = new THREE.Object3D();

  initAvatar = () => {
    this.loader.load("src/static/avatar2.glb", glb => {
      this.avatar = glb.scene.children[0];
      this.avatar.position.set(0, 1, 0);
      this.avatar.rotation.set(0, Math.PI / 2, 0);
      this.avatar.scale.set(2, 2, 2);

      // 导入模型激活阴影
      glb.scene.traverse(node => {
        node.castShadow = true;
      });

      this.scene.add(this.avatar);
    });
  };

  getPosition = () => this.avatar.position
}
