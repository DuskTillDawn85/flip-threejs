import "./assets/index.scss";

// Main Element
import Core from "./core";
import Block from "./core/block";
import Avatar from "./core/avatar";
import Control from "./core/control";

const core = new Core();
const camera = core.camera;
const scene = core.scene;
const renderer = core.renderer;
const stats = core.stats;

const block = new Block(scene, camera);
const avatar = new Avatar(scene);
const control = new Control(scene, camera, renderer, avatar, block);

// UI
let score = 0;
document.querySelector("#restart")?.addEventListener("click", () => {
  control.restart();
  score = 0;
  overlay?.classList.remove("active");
  scoreDoms.forEach(dom => (dom.textContent = "0"));
});
const overlay = document.querySelector(".overlay");
const scoreDoms = document.querySelectorAll(".score");
const updateScore = () => {
  score += 1;
  scoreDoms.forEach(dom => (dom.textContent = score.toString()));
};
const failedCallback = () => {
  overlay?.classList.add("active");
};

control.setSuccessCallback(updateScore);
control.setFailedCallback(failedCallback);

(function animate() {
  requestAnimationFrame(animate);

  stats.update();
  control.update();
  renderer.render(scene, camera);
})();
