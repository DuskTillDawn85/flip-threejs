import * as THREE from "three";
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
    const sunLight = new THREE.PointLight(0xffffff, 0.5);
    sunLight.position.set(50, 50, 50);
    this.scene.add(sunLight);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    this.scene.add(light);
  };

  initRenderer = () => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // show Realtime FPS
    document.body.append(this.stats.domElement);

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  initHelper = () => {
    // 辅助对象
    const gridHelper = new THREE.GridHelper(100, 100);
    this.scene.add(gridHelper);

    const axes = new THREE.AxesHelper(100);
    this.scene.add(axes);
  };
}
