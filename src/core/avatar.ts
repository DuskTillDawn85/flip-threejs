import * as THREE from "three";

export default class Avatar {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initAvatar();
  }

  scene: THREE.Scene;
  avatar: THREE.Mesh = new THREE.Mesh();
  private animToken = 0;
  private rafId: number | undefined;

  private stopAnimation = () => {
    this.animToken += 1;
    if (this.rafId !== undefined) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  };

  initAvatar = () => {
    const radius = 0.7;
    const height = 2;
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 24);
    const material = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
    this.avatar = new THREE.Mesh(geometry, material);
    this.avatar.castShadow = true;
    this.avatar.userData.radius = radius;
    this.avatar.userData.height = height;
    this.reset();
    this.scene.add(this.avatar);
  };

  /**
   *     0 1 0
   * x+  1 0 -1
   * x- -1 0 1
   * z+  1 1 0
   * z- -1 1 0
   */
  fallFromEdge = (direction: string) => {
    this.stopAnimation();
    const token = this.animToken;
    const rotation = this.avatar.rotation;

    const step = () => {
      if (token !== this.animToken) return;

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

      this.avatar.position.y -= 0.05;
      this.rafId = requestAnimationFrame(step);
    };

    step();
  };

  fall = () => {
    this.stopAnimation();
    const token = this.animToken;

    const step = () => {
      if (token !== this.animToken) return;
      if (this.avatar.position.y <= 0) return;

      this.avatar.position.y -= 0.05;
      this.rafId = requestAnimationFrame(step);
    };

    step();
  };

  reset = () => {
    this.stopAnimation();
    const height = (this.avatar.userData.height as number | undefined) ?? 2;
    this.avatar.scale.set(1, 1, 1);
    this.avatar.position.set(0, 1 + height / 2, 0);
    this.avatar.rotation.set(0, Math.PI / 2, 0);
  };

  getPosition = () => this.avatar.position;
  setPosition = (x: number, y: number, z: number) => this.avatar.position.set(x, y, z);
}
