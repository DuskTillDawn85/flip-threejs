import Core from "./core";
import Block from "./core/block";

const core = new Core();
const camera = core.camera;
const scene = core.scene;
const renderer = core.renderer;
const stats = core.stats;

const block = new Block(scene)


;(function animate() {
  requestAnimationFrame(animate);

  // camera.position.x += 0.1;  
  renderer.render(scene,camera)
  stats.update()
})()