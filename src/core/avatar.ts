import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import avatarUrl from "../assets/model/avatar2.glb?url";

import * as dat from "dat.gui";

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
    this.loader.load(avatarUrl, glb => {
      this.avatar = glb.scene.children[0];
      this.avatar.position.set(0, 1, 0);
      this.avatar.rotation.set(0, Math.PI / 2, 0);
      this.avatar.scale.set(2, 2, 2);

      if (import.meta.env.MODE === "development") {
        const gui = new dat.GUI();
        gui.add(this.avatar.rotation, "x", -Math.PI, Math.PI, Math.PI / 2);
        gui.add(this.avatar.rotation, "y", -Math.PI, Math.PI, Math.PI / 2);
        gui.add(this.avatar.rotation, "z", -Math.PI, Math.PI, Math.PI / 2);
      }

      // 导入模型激活阴影
      glb.scene.traverse(node => {
        node.castShadow = true;
      });

      this.scene.add(this.avatar);
    });
  };

  /**
   *     0 1 0
   * x+  1 0 -1
   * x- -1 0 1
   * z+  1 1 0
   * z- -1 1 0
   */
  fallFromEdge = (direction: string) => {
    const rotation = this.avatar.rotation;

    switch (direction) {
      case "x+":
        if (rotation.y <= 0) return;

        rotation.x += 0.05;
        rotation.y -= 0.05;
        rotation.z -= 0.05;
        this.avatar.rotation.set(rotation.x, rotation.y, rotation.z);
        break;
      case "x-":
        if (rotation.y <= 0) return;

        rotation.x -= 0.05;
        rotation.y -= 0.05;
        rotation.z += 0.05;
        this.avatar.rotation.set(rotation.x, rotation.y, rotation.z);
        break;
      case "z+":
        if (rotation.x >= Math.PI / 2) return;

        rotation.x += 0.05;
        this.avatar.rotation.set(rotation.x, rotation.y, rotation.z);
        break;
      case "z-":
        if (rotation.x <= -Math.PI / 2) return;

        rotation.x -= 0.05;
        this.avatar.rotation.set(rotation.x, rotation.y, rotation.z);
        break;
    }

    // Update
    this.avatar.position.y -= 0.05;
    requestAnimationFrame(() => this.fallFromEdge(direction));
  };

  fall = () => {
    if (this.avatar.position.y <= 0) return alert("失败！");

    this.avatar.position.y -= 0.01;
    requestAnimationFrame(() => this.fall());
  };

  getPosition = () => this.avatar.position;
}
