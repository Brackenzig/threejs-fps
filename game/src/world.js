import * as THREE from 'three';
import { PALETTE as P } from './palette.js';

// RELAY / NINE. All coordinates are metres; ground is y=0.
// The uninterrupted lane spines are x=-13,0,13. Crossings: z=6,-5,-11.
export function createWorld(scene) {
  const group = new THREE.Group();
  group.name = 'RELAY / NINE';
  scene.add(group);
  scene.background = new THREE.Color(P.sky);
  scene.fog = new THREE.Fog(P.fog, 38, 115);
  const colliders = [];
  const shootables = [];
  const materials = {};
  for (const [name, color] of Object.entries(P)) {
    materials[name] = new THREE.MeshStandardMaterial({
      color, roughness: /teal|steel|glass/.test(name) ? 0.57 : 0.91,
      metalness: /teal|steel/.test(name) ? 0.32 : 0.02,
    });
  }
  materials.glass.metalness = 0.65;
  materials.glass.roughness = 0.23;
  materials.lamp.emissive = new THREE.Color(P.lamp);
  materials.lamp.emissiveIntensity = 1.7;
  const geometries = new Map();
  function geometry(w, h, d) {
    const key = `${w}/${h}/${d}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d));
    return geometries.get(key);
  }
  function register(mesh, solid) {
    group.add(mesh);
    mesh.receiveShadow = true;
    if (solid) {
      mesh.castShadow = true;
      mesh.updateMatrixWorld(true);
      colliders.push(new THREE.Box3().setFromObject(mesh));
      shootables.push(mesh);
    }
    return mesh;
  }
  function box(w, h, d, x, y, z, material = 'concrete', solid = true) {
    const mesh = new THREE.Mesh(geometry(w, h, d), materials[material]);
    mesh.position.set(x, y, z);
    return register(mesh, solid);
  }
  function pipe(radius, length, x, y, z, axis = 'y', material = 'teal', solid = true) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), materials[material]);
    mesh.position.set(x, y, z);
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    return register(mesh, solid);
  }
  // Signage is generated locally: large enamel panels, painted floor stencils.
  function sign(text, sub, w, h, x, y, z, options = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = Math.max(128, Math.round(1024 * h / w));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = options.background || P.tealDark;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = options.color || P.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(17, 17, 990, canvas.height - 34);
    ctx.fillStyle = options.color || P.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${sub ? canvas.height * 0.44 : canvas.height * 0.64}px sans-serif`;
    ctx.fillText(text, 512, canvas.height * (sub ? 0.40 : 0.51), 920);
    if (sub) {
      ctx.font = `600 ${canvas.height * 0.12}px monospace`;
      ctx.fillText(sub, 512, canvas.height * 0.78, 900);
    }
    // Slight printed registration details make the signs feel fabricated.
    ctx.fillRect(28, 28, 9, 9);
    ctx.fillRect(987, canvas.height - 37, 9, 9);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z);
    mesh.rotation.y = options.rotation || 0;
    if (options.floor) mesh.rotation.x = -Math.PI / 2;
    return register(mesh, false);
  }

  // The slab and retaining walls define an exact playable square of +/-20.
  box(40.8, 0.4, 40.8, 0, -0.2, 0, 'canvas');
  for (const x of [-20.3, 20.3]) {
    box(0.6, 4.4, 40.6, x, 2.2, 0);
    box(0.72, 0.22, 40.6, x, 4.45, 0, 'concreteDark');
    for (let z = -18; z <= 18; z += 6) {
      box(0.95, 4.8, 0.55, x, 2.4, z, 'concreteDark');
      box(0.04, 0.10, 4.8, x > 0 ? 19.97 : -19.97, 1.0, z, 'teal', false);
    }
  }
  for (const z of [-20.3, 20.3]) {
    box(40.6, 4.4, 0.6, 0, 2.2, z);
    box(40.6, 0.22, 0.72, 0, 4.45, z, 'concreteDark');
  }
  // Expansion joints, drainage channels, inset service markings.
  for (let x = -16; x <= 16; x += 4) box(0.025, 0.006, 40, x, 0.004, 0, 'concreteDark', false);
  for (let z = -16; z <= 16; z += 4) box(40, 0.006, 0.025, 0, 0.005, z, 'concreteDark', false);
  for (const x of [-15.4, 15.4]) {
    box(0.28, 0.012, 37, x, 0.008, 0, 'steel', false);
    for (let z = -18; z <= 18; z += 0.5) box(0.29, 0.017, 0.055, x, 0.012, z, 'concreteDark', false);
  }
  for (const x of [-13, 0, 13]) {
    for (let z = 12; z > -15; z -= 3) box(0.09, 0.009, 0.85, x - 1.5, 0.012, z, 'ink', false);
  }

  // Two solid service wings form the central relay house. The open 5m breezeway,
  // side paths and all three cross passages stay clear of floor-level geometry.
  for (const side of [-1, 1]) {
    const x = side * 5.5;
    box(6, 3.6, 7.6, x, 1.8, -0.4);
    box(6.18, 0.28, 7.85, x, 3.72, -0.4, 'tealDark');
    box(6.35, 0.14, 8, x, 3.94, -0.4, 'teal');
    box(6.05, 0.46, 7.65, x, 0.23, -0.4, 'concreteDark');
    // Front shutter with corrugations, lintel, side rails and small control box.
    box(3.55, 2.7, 0.08, x, 1.62, 3.44, 'teal');
    for (let y = 0.4; y < 2.95; y += 0.21) box(3.48, 0.045, 0.07, x, y, 3.51, 'tealLight', false);
    box(3.9, 0.25, 0.25, x, 3.12, 3.5, 'tealDark');
    for (const dx of [-1.9, 1.9]) box(0.14, 3, 0.2, x + dx, 1.5, 3.49, 'steel');
    box(0.28, 0.44, 0.13, x + side * 2.25, 1.35, 3.51, 'steel');
    box(0.09, 0.09, 0.025, x + side * 2.25, 1.45, 3.59, 'lamp', false);
    sign(side < 0 ? '01' : '02', 'RELAY SERVICE', 1.5, 0.62, x, 3.47, 3.55);
    // Rear windows and exposed metal mullions.
    for (const dx of [-1.8, 0, 1.8]) {
      box(1.45, 1.2, 0.09, x + dx, 2.35, -4.24, 'tealDark');
      box(1.29, 1.04, 0.02, x + dx, 2.35, -4.30, 'glass', false);
      box(0.055, 1.06, 0.03, x + dx, 2.35, -4.32, 'tealLight', false);
    }
    // Rooftop ventilation, flues, and ribbed plant housings.
    box(2.8, 0.9, 2.7, x, 4.45, -1.2, 'teal');
    for (let dx = -1.1; dx <= 1.1; dx += 0.3) box(0.07, 0.65, 2.75, x + dx, 4.45, -1.2, 'tealDark', false);
    pipe(0.27, 2.1, x + side * 1.7, 4.9, -2.4, 'y', 'steel');
    pipe(0.4, 0.16, x + side * 1.7, 5.95, -2.4, 'y', 'tealDark');
    // Wall service pipe sits inside the building's collision envelope.
    pipe(0.12, 6.7, side * 8.43, 1, -0.4, 'z', 'rust');
  }
  // Bridging roof: generous overhead clearance through the middle route.
  box(5.2, 0.3, 6.7, 0, 4.05, -0.4, 'tealDark');
  for (const x of [-2.1, -1.05, 0, 1.05, 2.1]) box(0.1, 0.13, 6.8, x, 4.28, -0.4, 'tealLight');
  sign('RELAY / NINE', 'POWER TRANSFER STATION  •  EST. 1978', 8.5, 1.35, 0, 5.05, 3.17);
  box(8.8, 1.52, 0.19, 0, 5.05, 3.03, 'tealDark');
  sign('CONTROL', '09   /   KEEP ACCESS CLEAR', 3.2, 0.8, 0, 3.25, -3.81, { rotation: Math.PI });

  // Edge gantries frame the sky without intruding on any navigation lane.
  for (const z of [8.5, -7]) {
    for (const x of [-18, 18]) {
      box(0.42, 6.9, 0.42, x, 3.45, z, 'tealDark');
      box(0.8, 0.22, 0.8, x, 0.11, z, 'steel');
      box(0.6, 0.15, 0.6, x, 6.6, z, 'accent');
    }
    box(36.6, 0.38, 0.35, 0, 6.7, z, 'tealDark');
    box(36.5, 0.09, 0.65, 0, 6.93, z, 'teal');
    for (const x of [-12, -6, 0, 6, 12]) {
      box(0.08, 0.6, 0.08, x, 6.2, z, 'steel');
      box(0.7, 0.13, 0.4, x, 5.87, z, 'tealDark');
      box(0.5, 0.03, 0.28, x, 5.79, z, 'lamp', false);
    }
    pipe(0.12, 36, 0, 7.25, z, 'x', 'rust');
  }

  function crate(x, z, w = 2.1, h = 1.3, d = 1.6) {
    box(w, h, d, x, h / 2, z, 'teal');
    box(w + 0.12, 0.12, d + 0.12, x, h, z, 'tealDark');
    for (const side of [-1, 1]) {
      box(0.1, h, d + 0.035, x + side * (w / 2 - 0.19), h / 2, z, 'tealLight', false);
      box(w, 0.1, 0.045, x, h * 0.22, z + side * d / 2, 'tealDark', false);
    }
    sign('R / 09', 'TRANSFORMER PARTS', w * 0.53, h * 0.5, x, h * 0.63, z + d / 2 + 0.025);
  }
  // Offset cover creates corner choices while all prescribed lane spines remain free.
  crate(-7, 9, 3.2, 1.3, 1.7);
  crate(7.5, 10.3, 2.5, 1.5, 2);
  crate(-17.2, 2.7, 2, 1.65, 3.2);
  crate(17.2, -1, 2, 1.3, 3);
  crate(-7.3, -8.1, 2.4, 1.15, 1.5);
  crate(7.3, -8.1, 2.4, 1.15, 1.5);
  crate(-3.4, -15.8, 2.3, 1.45, 1.8);
  crate(4.2, -16.4, 3.1, 1.15, 1.5);

  const sites = [{ name: 'A', x: -10, z: -11 }, { name: 'B', x: 10, z: -11 }];
  for (const site of sites) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.39, 64), materials.accent);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.x, 0.016, site.z);
    register(ring, false);
    sign(site.name, 'RELAY NODE', 1.7, 1.3, site.x, 0.02, site.z, { floor: true, background: P.concrete, color: P.tealDark });
    // Tall identifier boards sit on the rear perimeter, visible over cover.
    sign(site.name, site.name === 'A' ? 'WEST TRANSFER' : 'EAST TRANSFER', 2.7, 3.2, site.x, 2.8, -19.96, { background: P.teal, color: P.ink });
  }
  // Rear switchgear and landmark towers leave the defender spawn band open.
  for (const side of [-1, 1]) {
    const x = side * 17;
    box(3.3, 0.45, 4.1, x, 0.225, -16.7, 'concreteDark');
    box(2.5, 5.5, 2.8, x, 3.1, -17, 'teal');
    box(2.75, 0.22, 3.1, x, 5.92, -17, 'tealDark');
    for (let y = 1; y < 5.3; y += 0.48) box(2.2, 0.09, 0.08, x, y, -15.56, 'tealDark', false);
    sign(side < 0 ? '09' : 'N', 'HIGH VOLTAGE', 1.7, 1.1, x, 4.65, -15.53);
    for (const dx of [-0.8, 0, 0.8]) {
      pipe(0.16, 2.2, x + dx, 7.1, -17, 'y', 'steel');
      for (let y = 6.3; y < 7.9; y += 0.24) pipe(0.27, 0.1, x + dx, y, -17, 'y', 'ink');
    }
    pipe(0.2, 4.5, x, 6.55, -18.5, 'x', 'rust');
    box(0.06, 3, 0.06, x, 9, -17, 'steel');
    pipe(0.13, 0.25, x, 10.5, -17, 'y', 'lamp');
    // Inner perimeter pipe run and retaining brackets.
    pipe(0.25, 26, side * 19.3, 3.2, -1.5, 'z', 'teal');
    pipe(0.13, 26, side * 19.3, 2.5, -1.5, 'z', 'rust');
    for (let z = -14; z < 12; z += 4) box(0.55, 0.13, 0.16, side * 19.55, 3.05, z, 'steel');
  }
  // Spawn apron, shipping manifest, utility doors and peripheral vegetation.
  sign('RELAY / NINE', 'AUTHORIZED PERSONNEL ONLY', 6.6, 1.6, 0, 2.9, 19.96, { rotation: Math.PI });
  sign('09', 'TRANSFER YARD', 3, 2, 0, 0.018, 13.2, { floor: true, background: P.concrete, color: P.tealDark });
  for (const x of [-17, 17]) {
    box(2.5, 2.8, 0.1, x, 1.4, 19.95, 'tealDark');
    for (let y = 0.2; y < 2.8; y += 0.25) box(2.3, 0.06, 0.05, x, y, 19.87, 'teal', false);
    box(2.8, 0.12, 0.8, x, 3.15, 19.55, 'teal');
  }
  // Low skyline outside the playable walls: distant relay buildings and stacks.
  for (let i = 0; i < 11; i++) {
    const x = -45 + i * 9;
    box(5 + i % 3, 5 + i % 4, 5, x, 1.5, -31 - i % 3 * 4, i % 2 ? 'concreteDark' : 'tealDark', false);
    if (i % 3 === 0) pipe(0.65, 14, x, 5, -34, 'y', 'concreteDark', false);
  }

  const hemisphere = new THREE.HemisphereLight(P.ink, P.tealDark, 2.0);
  group.add(hemisphere);
  // Warm pools over the two relay sites: the objective reads at a glance
  // from anywhere in the yard, in the same amber the signage already uses.
  for (const site of sites) {
    const glow = new THREE.PointLight(0xedb96e, 14, 13, 2);
    glow.position.set(site.x, 3.2, site.z);
    group.add(glow);
  }
  const sun = new THREE.DirectionalLight(P.lamp, 3.2);
  sun.position.set(-22, 29, 18);
  sun.target.position.set(0, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -29, right: 29, top: 29, bottom: -29, near: 1, far: 95 });
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.025;
  sun.shadow.camera.updateProjectionMatrix();
  group.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(P.muted, 0.55);
  fill.position.set(14, 14, -15);
  group.add(fill);

  return { colliders, shootables, group, sites, name: 'RELAY / NINE',
    attackerSpawn: new THREE.Vector3(0, 0, 16),
    defenderSpawns: [new THREE.Vector3(-10, 0, -14), new THREE.Vector3(0, 0, -14), new THREE.Vector3(10, 0, -14)] };
}
