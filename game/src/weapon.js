import * as THREE from 'three';
import { PALETTE } from './palette.js';

export const SPECS = Object.freeze({
  rifle: Object.freeze({ id: 'rifle', name: 'R-09 / RELAY', price: 2400, mag: 30, magSize: 30, reserve: 90, damage: 34, headDamage: 100, gap: 0.105, reload: 1.9, spread: 0.0022, movingSpread: 0.028 }),
  smg: Object.freeze({ id: 'smg', name: 'S-24 / SWITCH', price: 1400, mag: 24, magSize: 24, reserve: 120, damage: 24, headDamage: 65, gap: 0.072, reload: 1.55, spread: 0.004, movingSpread: 0.021 }),
  pistol: Object.freeze({ id: 'pistol', name: 'P-12 / SIGNAL', price: 0, mag: 12, magSize: 12, reserve: 48, damage: 30, headDamage: 90, gap: 0.24, reload: 1.25, spread: 0.0028, movingSpread: 0.019 }),
});

export function createWeapon(camera) {
  const material = (color, metalness = 0.25, roughness = 0.55) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const steel = material(PALETTE.hairline, 0.7, 0.34);
  const dark = material(PALETTE.surface, 0.3);
  const black = material(PALETTE.canvas, 0.12, 0.8);
  const silver = material(PALETTE.muted, 0.7, 0.3);
  const brass = material(PALETTE.accent, 0.7, 0.3);
  const sleeve = material('#65685e', 0, 0.95);
  const glove = material('#252b2a', 0.05, 0.9);
  const seam = material('#8a8b78', 0, 1);
  const model = new THREE.Group();
  model.position.set(0.24, -0.24, -0.42);
  camera.add(model);
  const models = {};
  const magazines = {};
  const muzzles = {};

  function box(parent, size, position, mat, rotation = null) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  }
  function tube(parent, radius, length, position, mat, sides = 10) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, sides), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(...position);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  }
  function arm(parent, position, rotation) {
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.set(...rotation);
    parent.add(group);
    box(group, [0.105, 0.105, 0.29], [0, 0, 0.13], sleeve);
    box(group, [0.113, 0.112, 0.045], [0, 0, 0.015], black);
    box(group, [0.085, 0.088, 0.13], [0, 0, -0.065], glove);
    box(group, [0.09, 0.019, 0.075], [0, 0.047, -0.075], steel);
    for (let i = 0; i < 3; i++) box(group, [0.015, 0.014, 0.04], [-0.026 + i * 0.026, 0.059, -0.075], seam);
    box(group, [0.025, 0.055, 0.075], [-0.048, -0.012, -0.09], glove, [0, 0, -0.3]);
  }

  for (const id of Object.keys(SPECS)) {
    const group = new THREE.Group();
    model.add(group);
    models[id] = group;
    const pistol = id === 'pistol';
    const smg = id === 'smg';
    const nose = pistol ? -0.26 : smg ? -0.48 : -0.67;
    muzzles[id] = nose;
    // Faceted receiver, contrasting upper rail, charging handle and ejection port.
    box(group, [pistol ? 0.083 : 0.11, 0.1, pistol ? 0.29 : 0.4], [0, 0.015, pistol ? -0.06 : -0.1], steel);
    box(group, [0.085, 0.022, pistol ? 0.28 : 0.38], [0, 0.077, pistol ? -0.06 : -0.11], silver);
    box(group, [0.01, 0.037, 0.105], [0.057, 0.027, -0.09], black);
    box(group, [0.012, 0.022, 0.06], [0.065, 0.033, -0.07], brass);
    box(group, [0.038, 0.017, 0.023], [-0.067, 0.043, 0.025], silver);
    // Grip and open trigger guard.
    box(group, [0.07, 0.16, 0.085], [0, -0.105, 0.055], black, [-0.19, 0, 0]);
    for (let i = 0; i < 4; i++) box(group, [0.073, 0.008, 0.08], [0, -0.063 - i * 0.026, 0.05 + i * 0.005], steel);
    box(group, [0.012, 0.065, 0.015], [0.035, -0.07, -0.048], steel);
    box(group, [0.072, 0.012, 0.1], [0, -0.1, -0.006], steel);
    box(group, [0.012, 0.042, 0.012], [0, -0.059, -0.009], brass, [-0.3, 0, 0]);
    const magazine = new THREE.Group();
    magazine.position.set(0, pistol ? -0.11 : -0.14, pistol ? 0.055 : -0.15);
    group.add(magazine);
    magazines[id] = magazine;
    box(magazine, [0.062, pistol ? 0.13 : 0.21, smg ? 0.075 : 0.095], [0, 0, 0], dark, [-0.12, 0, 0]);
    box(magazine, [0.071, 0.022, 0.108], [0, pistol ? -0.065 : -0.105, 0.01], brass);
    if (!pistol) {
      for (let i = 0; i < 3; i++) box(magazine, [0.066, 0.012, 0.09], [0, -0.065 + i * 0.055, 0], steel);
      box(group, [0.08, 0.075, smg ? 0.17 : 0.25], [0, -0.003, smg ? -0.33 : -0.39], dark);
      for (let i = 0; i < (smg ? 4 : 6); i++) {
        const z = -0.265 - i * 0.035;
        box(group, [0.09, 0.013, 0.013], [0, 0.047, z], silver);
        box(group, [0.083, 0.02, 0.017], [0, -0.023, z], black);
      }
      box(group, [0.065, 0.07, 0.19], [0, -0.013, 0.19], black);
      box(group, [0.088, 0.13, 0.04], [0, -0.033, 0.3], steel);
      box(group, [0.05, 0.017, 0.095], [0, 0.027, 0.18], brass);
      arm(group, [-0.06, -0.105, smg ? -0.3 : -0.36], [0.12, -0.46, -0.17]);
    } else {
      box(group, [0.088, 0.045, 0.28], [0, 0.053, -0.07], dark);
      for (let i = 0; i < 5; i++) box(group, [0.092, 0.035, 0.006], [0, 0.045, 0.032 - i * 0.013], silver);
      arm(group, [-0.065, -0.13, 0.08], [-0.1, -0.37, -0.3]);
    }
    arm(group, [0.035, -0.14, 0.12], [-0.28, 0.2, 0.1]);
    tube(group, pistol ? 0.024 : 0.019, pistol ? 0.09 : 0.19, [0, 0.015, nose + 0.09], silver);
    tube(group, pistol ? 0.028 : 0.03, 0.065, [0, 0.015, nose + 0.02], dark);
    tube(group, 0.018, 0.003, [0, 0.015, nose - 0.014], black);
    box(group, [0.013, 0.055, 0.022], [0, 0.09, pistol ? -0.18 : smg ? -0.39 : -0.48], dark);
    box(group, [0.008, 0.012, 0.014], [0, 0.122, pistol ? -0.18 : smg ? -0.39 : -0.48], brass);
    for (const x of [-0.031, 0.031]) box(group, [0.016, 0.035, 0.024], [x, 0.1, 0.048], black);
    for (const z of [-0.19, 0.04]) {
      const pin = tube(group, 0.009, 0.115, [0, 0.017, z], silver, 8);
      pin.rotation.set(0, 0, Math.PI / 2);
    }
    box(group, [0.007, 0.022, 0.055], [0.058, -0.008, 0.014], brass);
  }

  const flash = new THREE.Group();
  const flashMaterial = new THREE.MeshBasicMaterial({ color: '#ffd58b', transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
  const flashShape = new THREE.Shape();
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8;
    const radius = i % 2 ? 0.025 : i % 4 ? 0.085 : 0.125;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (i === 0) flashShape.moveTo(x, y); else flashShape.lineTo(x, y);
  }
  flashShape.closePath();
  flash.add(new THREE.Mesh(new THREE.ShapeGeometry(flashShape), flashMaterial));
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.17, 7), flashMaterial);
  core.rotation.x = -Math.PI / 2;
  flash.add(core);
  model.add(flash);
  const flashLight = new THREE.PointLight(PALETTE.accent, 0, 3);
  model.add(flashLight);
  let current = SPECS.rifle;
  let elapsed = 0;
  const state = { id: 'rifle', damage: 34, headDamage: 100, mag: 30, reserve: 90, cooldown: 0, reloadLeft: 0, flash: 0, kick: 0 };

  function equip(id) {
    if (!Object.prototype.hasOwnProperty.call(SPECS, id)) return false;
    current = SPECS[id];
    Object.assign(state, { id, damage: current.damage, headDamage: current.headDamage, mag: current.mag, reserve: current.reserve, cooldown: 0, reloadLeft: 0, flash: 0, kick: 0 });
    for (const key of Object.keys(models)) {
      models[key].visible = key === id;
      magazines[key].position.y = key === 'pistol' ? -0.11 : -0.14;
      magazines[key].rotation.x = 0;
    }
    flash.position.set(0, 0.015, muzzles[id] - 0.055);
    flashLight.position.copy(flash.position);
    flash.visible = false;
    flashLight.intensity = 0;
    model.position.set(0.24, -0.24, -0.42);
    model.rotation.set(0, 0, 0);
    return true;
  }

  function step(dt, speed = 0) {
    dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    elapsed += dt;
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.kick *= Math.exp(-dt * 17);
    if (state.reloadLeft > 0) {
      state.reloadLeft = Math.max(0, state.reloadLeft - dt);
      if (state.reloadLeft === 0) {
        const take = Math.min(current.mag - state.mag, state.reserve);
        state.mag += take;
        state.reserve -= take;
      }
    }
    const progress = state.reloadLeft > 0 ? 1 - state.reloadLeft / current.reload : 0;
    const tilt = Math.sin(progress * Math.PI);
    const magazineDrop = Math.pow(Math.sin(progress * Math.PI), 2);
    magazines[state.id].position.y = (state.id === 'pistol' ? -0.11 : -0.14) - magazineDrop * 0.24;
    magazines[state.id].rotation.x = magazineDrop * -0.22;
    // Walk bob grows with speed; standing still the weapon barely moves.
    const bob = 0.002 + Math.min(1, Math.max(0, speed) / 5.2) * 0.004;
    model.position.set(0.24 + tilt * 0.06, -0.24 - tilt * 0.12 + Math.sin(elapsed * 1.8) * bob, -0.42 + state.kick);
    model.rotation.set(state.kick * 1.7 - tilt * 0.34, tilt * -0.3, tilt * -0.48);
    flash.visible = state.flash > 0;
    flash.rotation.z = elapsed * 51;
    flash.scale.setScalar(0.7 + state.flash * 8);
    flashLight.intensity = state.flash > 0 ? 5 : 0;
  }

  equip('rifle');
  return {
    state, step, specs: SPECS,
    get current() { return current; },
    ready() { return state.mag > 0 && state.cooldown === 0 && state.reloadLeft === 0; },
    pullTrigger() {
      state.cooldown = current.gap;
      state.flash = 0.045;
      state.kick = state.id === 'pistol' ? 0.075 : state.id === 'smg' ? 0.035 : 0.055;
      flash.visible = true;
      flashLight.intensity = 5;
    },
    takeRound() {
      if (state.mag <= 0 || state.reloadLeft > 0) return false;
      state.mag -= 1;
      return true;
    },
    reload() {
      if (state.reloadLeft > 0 || state.mag >= current.mag || state.reserve <= 0) return false;
      state.reloadLeft = current.reload;
      return true;
    },
    spread(speed) { return current.spread + Math.min(1, Math.max(0, speed) / 5.2) * current.movingSpread; },
    refill() { return equip(state.id); },
    equip,
  };
}
