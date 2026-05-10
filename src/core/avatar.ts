import * as THREE from "three";

export default class Avatar {
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initAvatar();
  }

  scene: THREE.Scene;
  avatar: THREE.Mesh = new THREE.Mesh();

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
    if (this.avatar.position.y <= 0) return;

    this.avatar.position.y -= 0.05;
    requestAnimationFrame(() => this.fall());
  };

  reset = () => {
    const height = (this.avatar.userData.height as number | undefined) ?? 2;
    this.avatar.position.set(0, 1 + height / 2, 0);
    this.avatar.rotation.set(0, Math.PI / 2, 0);
  };

  getPosition = () => this.avatar.position;
  setPosition = (x: number, y: number, z: number) => this.avatar.position.set(x, y, z);
}
