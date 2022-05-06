import Core from "./core";
import Block from "./core/block";
import Avatar from "./core/avatar";
import Control from "./core/control";

const core = new Core();
const camera = core.camera;
const scene = core.scene;
const renderer = core.renderer;
const stats = core.stats;

const block = new Block(scene);
const avatar = new Avatar(scene);

const control = new Control(scene, camera, renderer).controls;

(function animate() {
  requestAnimationFrame(animate);

  // camera.position.x += 0.1;
  renderer.render(scene, camera);
  stats.update();
  control.update();
})();
