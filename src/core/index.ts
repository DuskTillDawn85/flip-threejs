import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";

export default class Core {
  constructor() {
    this.camera = new THREE.OrthographicCamera(
      window.innerWidth / -80,
      window.innerWidth / 80,
      window.innerHeight / 80,
      window.innerHeight / -80,
      0,
      5000
    );
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.stats = Stats();
    this.initScene();
    this.initRenderer();
    this.initCamera();
    this.initHelper();
  }

  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  stats: Stats;

  initCamera = () => {
    this.camera.position.set(-200, 200, 200);
    this.camera.lookAt(0,0,0)

    // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
    this.camera.updateProjectionMatrix();

    window.addEventListener("resize", () => {
      this.camera.updateProjectionMatrix();
    });
  };

  initScene = () => {
    const dLight = new THREE.DirectionalLight(0xffffff);
    dLight.intensity = 0.5;
    dLight.castShadow = true;
    dLight.position.set(20, 40, 20);
    this.scene.add(dLight);

    // Helper
    // const dLightHelper = new THREE.DirectionalLightHelper(dLight);
    // this.scene.add(dLightHelper);

    // Environment Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Ground (for shadow receiver)
    const planeG = new THREE.PlaneGeometry(100, 100);
    const planeM = new THREE.MeshLambertMaterial({ color: 0x222222 });
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
    this.renderer.setClearColor(0x282828);
    document.body.appendChild(this.renderer.domElement);

    // show Realtime FPS
    document.body.append(this.stats.domElement);

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  initHelper = () => {
    // 辅助对象
    const cameraHelper = new THREE.CameraHelper(this.camera)
    this.scene.add(cameraHelper)
    
    // 坐标轴
    const axes = new THREE.AxesHelper(100);
    this.scene.add(axes);
  };
}
