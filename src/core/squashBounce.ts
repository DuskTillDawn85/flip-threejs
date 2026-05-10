import * as THREE from "three";

type SquashBounceOptions = {
  minChargeScaleY: number;
  maxChargeScaleXZ: number;
  bounceDamping: number;
  bounceAngular: number;
};

export default class SquashBounce {
  constructor(mesh: THREE.Mesh, options: SquashBounceOptions) {
    this.mesh = mesh;
    this.options = options;
  }

  private mesh: THREE.Mesh;
  private options: SquashBounceOptions;

  private bounceStartMs = 0;
  private bounceFromScaleY = 1;
  private bounceFromScaleXZ = 1;

  setChargeProgress = (progress01: number, standY: number) => {
    const t = Math.max(0, Math.min(1, progress01));
    const scaleY = 1 - (1 - this.options.minChargeScaleY) * t;
    const scaleXZ = 1 + (this.options.maxChargeScaleXZ - 1) * t;
    this.setImmediate(scaleXZ, scaleY, false, standY);
  };

  startBounceToNormal = () => {
    this.bounceStartMs = performance.now();
    this.bounceFromScaleY = this.mesh.scale.y;
    this.bounceFromScaleXZ = this.mesh.scale.x;
  };

  update = (isJumping: boolean, standY: number) => {
    if (this.bounceStartMs === 0) return;

    const elapsedMs = performance.now() - this.bounceStartMs;
    const t = elapsedMs / 1000;
    const amplitude = Math.exp(-this.options.bounceDamping * t);

    if (elapsedMs > 420 || amplitude < 0.02) {
      this.bounceStartMs = 0;
      this.setImmediate(1, 1, isJumping, standY);
      return;
    }

    const cos = Math.cos(this.options.bounceAngular * t);
    const scaleY = Math.max(0.2, 1 + (this.bounceFromScaleY - 1) * amplitude * cos);
    const scaleXZ = Math.max(0.2, 1 + (this.bounceFromScaleXZ - 1) * amplitude * cos);
    this.setImmediate(scaleXZ, scaleY, isJumping, standY);
  };

  reset = (standY: number) => {
    this.bounceStartMs = 0;
    this.setImmediate(1, 1, false, standY);
  };

  private setImmediate = (scaleXZ: number, scaleY: number, isJumping: boolean, standY: number) => {
    this.mesh.scale.set(scaleXZ, scaleY, scaleXZ);
    if (!isJumping) {
      this.mesh.position.y = standY;
    }
  };
}

