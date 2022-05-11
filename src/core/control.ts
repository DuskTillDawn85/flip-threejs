import * as THREE from "three";
import Avatar from "./avatar";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default class Control {
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
    avatar: Avatar,
    block: THREE.Mesh
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.avatar = avatar;
    this.block = block;
    this.initEventListeners();
    this.initRayCaster();
  }

  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  controls: OrbitControls;
  avatar: Avatar;
  block: THREE.Mesh;

  // Jump
  isJumping = false;
  keydownTime = 0;
  deltaTime = 0;
  velocity = 0;
  gravity = 9.8;
  theta = 0;
  raycaster = new THREE.Raycaster();

  keydownHandler = (e: KeyboardEvent) => {
    if (e.key !== " " || this.isJumping) return;

    if (this.keydownTime === 0) {
      this.keydownTime = performance.now();
    }
  };

  keyupHandler = (e: KeyboardEvent) => {
    if (e.key !== " ") return;

    this.deltaTime = (performance.now() - this.keydownTime) / 1000;
    this.keydownTime = 0;

    // Throttle
    if (this.deltaTime < 0.3) return;

    this.isJumping = true;
    this.velocity = this.deltaTime * 15; // initial speed V0
    this.theta = this.deltaTime * 0.8;
  };

  initEventListeners = () => {
    document.body.addEventListener("keydown", this.keydownHandler);
    document.body.addEventListener("keyup", this.keyupHandler);
  };

  initRayCaster = () => {
    this.raycaster.ray.direction = new THREE.Vector3(0, -1, 0);
    this.raycaster.far = 0.1;

    // this.raycaster.ray.origin = new THREE.Vector3(0.3, 1.1, 0);
    // const collide = this.raycaster.intersectObject(this.block).length;
    // console.log("collide :>> ", collide);
  };

  t = 0;
  angle = 60;
  private setJumpFrame = () => {
    const pos = this.avatar.avatar.position;

    if (pos.y < 0) return;

    this.t += 0.1;
    const distance = 2 * Math.cos(this.angle) * this.t - this.t ** 2;
    console.log(distance * Math.cos(this.angle));
    this.avatar.avatar.position.set(
      pos.x + distance * Math.cos(this.angle),
      pos.y + distance * Math.sin(this.angle),
      0
    );
    

    // Update Ray origin coords according to Avatar
    this.raycaster.ray.origin = pos;
    const collide = this.raycaster.intersectObject(this.block).length;

    // Before jump or collide with block
    if (collide) {
      this.velocity = 0;
      this.isJumping = false;
    }
  };

  update = () => {
    this.controls.update();

    this.isJumping && this.setJumpFrame();
  };
}
