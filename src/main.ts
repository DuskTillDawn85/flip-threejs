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

const control = new Control(scene, camera, renderer, avatar, block);

(function animate() {
  requestAnimationFrame(animate);

  stats.update();
  control.update();
  renderer.render(scene, camera);
})();
