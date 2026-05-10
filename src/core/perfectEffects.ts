import * as THREE from "three";

type RippleEffect = {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  startMs: number;
  durationMs: number;
  startScale: number;
  endScale: number;
};

type ParticleEffect = {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  velocities: Float32Array;
  startMs: number;
  lastMs: number;
  durationMs: number;
};

export default class PerfectEffects {
  constructor(scene: THREE.Scene, fallbackBlockSize: number) {
    this.scene = scene;
    this.fallbackBlockSize = fallbackBlockSize;
  }

  private scene: THREE.Scene;
  private fallbackBlockSize: number;

  private rippleEffects: RippleEffect[] = [];
  private particleEffects: ParticleEffect[] = [];

  spawn = (blockMesh: THREE.Mesh) => {
    const height = (blockMesh.userData.height as number | undefined) ?? 2;
    const shape = blockMesh.userData.shape as string | undefined;
    const baseRadius =
      shape === "cylinder"
        ? ((blockMesh.userData.radius as number | undefined) ?? this.fallbackBlockSize / 2)
        : (((blockMesh.userData.size as number | undefined) ?? this.fallbackBlockSize) / 2);

    const center = blockMesh.position.clone();
    center.y += height / 2 + 0.18;

    const makeRing = (delayMs: number, startScale: number, endScale: number) => {
      const ringGeometry = new THREE.RingGeometry(0.54, 0.6, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.copy(center);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.renderOrder = 10;
      ringMesh.scale.set(startScale, startScale, startScale);
      this.scene.add(ringMesh);
      this.rippleEffects.push({
        mesh: ringMesh,
        startMs: performance.now() + delayMs,
        durationMs: 650,
        startScale,
        endScale,
      });
    };

    makeRing(0, baseRadius * 0.15, baseRadius * 1.45);
    makeRing(110, baseRadius * 0.1, baseRadius * 1.65);
    // makeRing(220, baseRadius * 0.07, baseRadius * 1.85);

    const count = 5 + Math.floor(Math.random() * 6);
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = center.x;
      positions[idx + 1] = center.y;
      positions[idx + 2] = center.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.4 + Math.random() * 1.8;
      velocities[idx] = Math.cos(angle) * speed;
      velocities[idx + 2] = Math.sin(angle) * speed;
      velocities[idx + 1] = 5.5 + Math.random() * 2.0;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xff7a00,
      size: 5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(particleGeometry, particleMaterial);
    points.renderOrder = 11;
    points.frustumCulled = false;
    this.scene.add(points);
    const now = performance.now();
    this.particleEffects.push({
      points,
      velocities,
      startMs: now,
      lastMs: now,
      durationMs: 600,
    });
  };

  update = () => {
    const now = performance.now();

    for (let i = this.rippleEffects.length - 1; i >= 0; i--) {
      const effect = this.rippleEffects[i];
      const t = (now - effect.startMs) / effect.durationMs;
      if (t < 0) {
        effect.mesh.material.opacity = 0;
        continue;
      }
      if (t >= 1) {
        this.scene.remove(effect.mesh);
        effect.mesh.geometry.dispose();
        effect.mesh.material.dispose();
        this.rippleEffects.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - t, 2);
      const scale = effect.startScale + (effect.endScale - effect.startScale) * eased;
      effect.mesh.scale.set(scale, scale, scale);
      effect.mesh.material.opacity = Math.max(0, 0.9 * (1 - t) * (1 - t));
    }

    for (let i = this.particleEffects.length - 1; i >= 0; i--) {
      const effect = this.particleEffects[i];
      const t = (now - effect.startMs) / effect.durationMs;
      if (t >= 1) {
        this.scene.remove(effect.points);
        effect.points.geometry.dispose();
        effect.points.material.dispose();
        this.particleEffects.splice(i, 1);
        continue;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - effect.lastMs) / 1000));
      effect.lastMs = now;

      const geometry = effect.points.geometry;
      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const vel = effect.velocities;

      for (let p = 0; p < arr.length; p += 3) {
        vel[p + 1] -= 2.8 * dt;
        arr[p] += vel[p] * dt;
        arr[p + 1] += vel[p + 1] * dt;
        arr[p + 2] += vel[p + 2] * dt;

        vel[p] *= 0.996;
        vel[p + 1] *= 0.996;
        vel[p + 2] *= 0.996;
      }

      posAttr.needsUpdate = true;
      effect.points.material.opacity = Math.max(0, 1 - t);
    }
  };

  clear = () => {
    for (const effect of this.rippleEffects) {
      this.scene.remove(effect.mesh);
      effect.mesh.geometry.dispose();
      effect.mesh.material.dispose();
    }
    this.rippleEffects = [];

    for (const effect of this.particleEffects) {
      this.scene.remove(effect.points);
      effect.points.geometry.dispose();
      effect.points.material.dispose();
    }
    this.particleEffects = [];
  };
}
