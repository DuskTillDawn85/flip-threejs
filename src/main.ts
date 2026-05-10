import "./assets/index.scss";

// Main Element
import Core from "./core";
import Block from "./core/block";
import Avatar from "./core/avatar";
import Control from "./core/control";
import perfectUrl from "./assets/media/perfect.mp3?url";

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
const perfectAudio = new Audio(perfectUrl);
perfectAudio.volume = 0.7;

const playAudio = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  const result = audio.play();
  if (result) {
    result.catch(() => undefined);
  }
};

document.querySelector("#restart")?.addEventListener("click", () => {
  control.restart();
  score = 0;
  block.setScore(score);
  overlay?.classList.remove("active");
  scoreDoms.forEach(dom => (dom.textContent = "0"));
  (document.activeElement as HTMLElement | null)?.blur();
});
const overlay = document.querySelector(".overlay");
const scoreDoms = document.querySelectorAll(".score");

const showScoreFloat = (points: number) => {
  const currentBlock = block.blocks[block.blocks.length - 1];
  if (!currentBlock) return;

  const height = (currentBlock.userData.height as number | undefined) ?? 2;
  const worldPos = currentBlock.position.clone();
  worldPos.y += height / 2;

  const ndc = worldPos.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  const x = rect.left + (ndc.x * 0.5 + 0.5) * rect.width + 28;
  const y = rect.top + (-ndc.y * 0.5 + 0.5) * rect.height - 18;

  const el = document.createElement("div");
  el.className = "score-float";
  el.textContent = `+${points}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;

  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove(), { once: true });
};

const updateScore = (points: number) => {
  score += points;
  block.setScore(score);
  scoreDoms.forEach(dom => (dom.textContent = score.toString()));
  showScoreFloat(points);
  points === 3 && playAudio(perfectAudio);
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
