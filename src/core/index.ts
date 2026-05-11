import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { BLOCK_HEIGHT, BLOCK_MAX_DISTANCE, BLOCK_MAX_SIZE } from "./block";

export default class Core {
  constructor() {
    const { width, height } = this.getViewportSize();
    this.camera = new THREE.OrthographicCamera(width / -80, width / 80, height / 80, height / -80, 0, 5000);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.stats = Stats();
    this.initScene();
    this.initRenderer();
    this.initCamera();
    import.meta.env.MODE === "development" && this.initHelper();
  }

  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  stats: Stats;
  private resizeRafId: number | undefined;
  private fitOffsets: THREE.Vector3[] | undefined;

  private getViewportSize = () => {
    const vv = window.visualViewport;
    if (vv) {
      return { width: Math.floor(vv.width), height: Math.floor(vv.height) };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  };

  private getFitOffsets = () => {
    if (this.fitOffsets) return this.fitOffsets;

    const halfGap = BLOCK_MAX_DISTANCE / 2;
    const halfBlock = BLOCK_MAX_SIZE / 2;
    const halfBlockH = BLOCK_HEIGHT / 2;
    const jumpApexY = 9;

    const offsets: THREE.Vector3[] = [];
    const addBlockCorners = (cx: number, cz: number) => {
      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            offsets.push(new THREE.Vector3(cx + sx * halfBlock, sy * halfBlockH, cz + sz * halfBlock));
          }
        }
      }
    };

    addBlockCorners(-halfGap, 0);
    addBlockCorners(halfGap, 0);
    addBlockCorners(0, -halfGap);
    addBlockCorners(0, halfGap);
    offsets.push(new THREE.Vector3(0, jumpApexY, 0));

    this.fitOffsets = offsets;
    return offsets;
  };

  private resize = () => {
    const { width, height } = this.getViewportSize();
    const aspect = width / height;

    this.camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0).normalize();
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1).normalize();

    let halfWidth = 1;
    let halfHeight = 1;
    for (const offset of this.getFitOffsets()) {
      halfWidth = Math.max(halfWidth, Math.abs(offset.dot(right)));
      halfHeight = Math.max(halfHeight, Math.abs(offset.dot(up)));
    }

    const padding = 1.18;
    halfWidth *= padding;
    halfHeight *= padding;

    if (halfWidth / halfHeight < aspect) {
      halfWidth = halfHeight * aspect;
    } else {
      halfHeight = halfWidth / aspect;
    }

    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
  };

  private requestResize = () => {
    if (this.resizeRafId !== undefined) return;
    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = undefined;
      this.resize();
    });
  };

  initCamera = () => {
    this.camera.position.set(-200, 200, 200);
    this.camera.lookAt(0, 0, 0);

    this.requestResize();
    window.addEventListener("resize", this.requestResize);
    window.addEventListener("orientationchange", this.requestResize);
    window.visualViewport?.addEventListener("resize", this.requestResize);
  };

  initScene = () => {
    const dLight = new THREE.DirectionalLight(0xffffff);
    dLight.intensity = 0.5;
    dLight.castShadow = true;
    dLight.position.set(20, 40, 20);
    dLight.shadow.mapSize.set(2048, 2048);
    dLight.shadow.bias = -0.0001;
    const shadowCamera = dLight.shadow.camera as THREE.OrthographicCamera;
    shadowCamera.left = -200;
    shadowCamera.right = 200;
    shadowCamera.top = 200;
    shadowCamera.bottom = -200;
    shadowCamera.near = 1;
    shadowCamera.far = 800;
    shadowCamera.updateProjectionMatrix();
    this.scene.add(dLight);

    // Helper
    // const dLightHelper = new THREE.DirectionalLightHelper(dLight);
    // this.scene.add(dLightHelper);

    // Environment Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Ground (for shadow receiver)
    const planeG = new THREE.PlaneGeometry(2000, 2000);
    const planeM = new THREE.ShadowMaterial({ opacity: 0.25 });
    const plane = new THREE.Mesh(planeG, planeM);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    plane.receiveShadow = true;
    this.scene.add(plane);
  };

  initRenderer = () => {
    this.renderer.shadowMap.enabled = true; // 启用阴影
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    document.body.appendChild(this.renderer.domElement);

    // show Realtime FPS (in dev mode)
    import.meta.env.MODE === "development" && document.body.append(this.stats.domElement);
    const { width, height } = this.getViewportSize();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
  };

  initHelper = () => {
    // 辅助对象
    const cameraHelper = new THREE.CameraHelper(this.camera);
    this.scene.add(cameraHelper);

    // 坐标轴
    const axes = new THREE.AxesHelper(100);
    this.scene.add(axes);
  };
}
