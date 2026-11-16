// Shot tracers and impact sparks. Transient feedback only: nothing here
// changes the map or the HUD, so screenshots of the game stay the same.
// Both pools are preallocated; step() updates buffers in place and never
// allocates while the game runs.
import * as THREE from 'three';

const TRACERS = 8;
const BURSTS = 4;
const SPARKS = 24;

export function createEffects(scene) {
  const tracerMat = new THREE.LineBasicMaterial({
    color: 0xffd58b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const tracers = [];
  for (let i = 0; i < TRACERS; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(geo, tracerMat.clone());
    line.visible = false;
    line.frustumCulled = false;
    scene.add(line);
    tracers.push({ line, life: 0 });
  }
  let tracerNext = 0;

  const bursts = [];
  for (let i = 0; i < BURSTS; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffc477, size: 0.09, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.visible = false;
    points.frustumCulled = false;
    scene.add(points);
    bursts.push({ points, vel: new Float32Array(SPARKS * 3), life: 0, color: 0xffc477 });
  }
  let burstNext = 0;

  function tracer(from, to) {
    const t = tracers[tracerNext];
    tracerNext = (tracerNext + 1) % TRACERS;
    const p = t.line.geometry.attributes.position.array;
    p[0] = from.x; p[1] = from.y; p[2] = from.z;
    p[3] = to.x; p[4] = to.y; p[5] = to.z;
    t.line.geometry.attributes.position.needsUpdate = true;
    t.line.material.opacity = 0.85;
    t.line.visible = true;
    t.life = 0.07;
  }

  function sparks(point, color = 0xffc477) {
    const b = bursts[burstNext];
    burstNext = (burstNext + 1) % BURSTS;
    const p = b.points.geometry.attributes.position.array;
    for (let i = 0; i < SPARKS; i++) {
      p[i * 3] = point.x; p[i * 3 + 1] = point.y; p[i * 3 + 2] = point.z;
      const a = Math.random() * Math.PI * 2, e = (Math.random() - 0.2) * Math.PI;
      const sp = 1.5 + Math.random() * 3.5;
      b.vel[i * 3] = Math.cos(a) * Math.cos(e) * sp;
      b.vel[i * 3 + 1] = Math.sin(e) * sp + 1.2;
      b.vel[i * 3 + 2] = Math.sin(a) * Math.cos(e) * sp;
    }
    b.points.geometry.attributes.position.needsUpdate = true;
    b.points.material.color.setHex(color);
    b.points.material.opacity = 0.95;
    b.points.visible = true;
    b.life = 0.35;
  }

  function step(dt) {
    for (const t of tracers) {
      if (t.life <= 0) continue;
      t.life -= dt;
      if (t.life <= 0) { t.line.visible = false; continue; }
      t.line.material.opacity = Math.max(0, t.life / 0.07) * 0.85;
    }
    for (const b of bursts) {
      if (b.life <= 0) continue;
      b.life -= dt;
      if (b.life <= 0) { b.points.visible = false; continue; }
      const p = b.points.geometry.attributes.position.array;
      for (let i = 0; i < SPARKS; i++) {
        b.vel[i * 3 + 1] -= 9 * dt;
        p[i * 3] += b.vel[i * 3] * dt;
        p[i * 3 + 1] = Math.max(0.03, p[i * 3 + 1] + b.vel[i * 3 + 1] * dt);
        p[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      b.points.material.opacity = Math.max(0, b.life / 0.35) * 0.95;
    }
  }

  return { tracer, sparks, step };
}
