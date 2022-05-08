import * as THREE from "three";
import { PlaneHelper } from "three";
import Stats from "three/examples/jsm/libs/stats.module";

export default class Core {
  constructor() {
    this.camera = new THREE.PerspectiveCamera();
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.stats = Stats();
    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initHelper();
  }

  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  stats: Stats;

  initCamera = () => {
    /**
     * fov — 摄像机视锥体垂直视野角度
     * aspect — 摄像机视锥体长宽比
     * near — 摄像机视锥体近端面
     * far — 摄像机视锥体远端面
     */
    this.camera.fov = 50;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.position.set(-10, 10, 10);
    this.camera.lookAt(this.scene.position);
    this.camera.filmOffset = 8;

    // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
    this.camera.updateProjectionMatrix();

    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  };

  initScene = () => {
    // 正面主要光源
    const dLight = new THREE.DirectionalLight(0xffffff);
    dLight.intensity = 0.3;
    dLight.position.set(5, 10, 5);
    this.scene.add(dLight);

    const pLight = new THREE.PointLight(0xffffff);
    pLight.castShadow = true;
    pLight.position.set(10, 20, 10);
    this.scene.add(pLight);

    // Helper
    const pLightHelper = new THREE.PointLightHelper(pLight);
    this.scene.add(pLightHelper);
    const dLightHelper = new THREE.DirectionalLightHelper(dLight);
    this.scene.add(dLightHelper);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Ground (for shadow receiver)
    const planeG = new THREE.PlaneGeometry(100, 100);
    const planeM = new THREE.MeshLambertMaterial({ color: 0xd1c2d3 });
    const plane = new THREE.Mesh(planeG, planeM);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    this.scene.add(plane);
  };

  initRenderer = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true; // 启用阴影
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0xd1c2d3);
    document.body.appendChild(this.renderer.domElement);

    // show Realtime FPS
    document.body.append(this.stats.domElement);

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  initHelper = () => {
    // 辅助对象

    // 网格
    // const gridHelper = new THREE.GridHelper(100, 100);
    // this.scene.add(gridHelper);

    // 坐标轴
    const axes = new THREE.AxesHelper(100);
    this.scene.add(axes);
  };
}
