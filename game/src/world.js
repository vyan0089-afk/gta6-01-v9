// ARUNIKA: Golden Hour — world.js
// Builds Pulau Arunika: sunset sky, sea, beach boulevard, street grid,
// buildings with lit windows, palms, the pier, and the garage interior.
// Exports the scene contents the game and the minimap both need.
import { THREE } from './three.js';
import { WORLD, AVENUES, STREETS, ROAD_W, DISTRICTS, GARAGE_POS } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowTexture(base, lit) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 12; y < h - 12; y += 28) {
      for (let x = 12; x < w - 12; x += 24) {
        const on = Math.random() < 0.62;
        g.fillStyle = on ? lit : '#1c2436';
        g.fillRect(x, y, 14, 18);
      }
    }
  });
}

function signTexture(text, bg, fg, sub) {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = 'bold 48px Arial'; g.textAlign = 'center';
    g.fillText(text, w / 2, sub ? 60 : 82);
    if (sub) { g.font = '22px Arial'; g.fillText(sub, w / 2, 104); }
  });
}

export function buildWorld(scene) {
  const out = { buildings: [], palms: [], signs: [], garageRoom: null, sea: null, heliPad: null };

  // Sunset sky dome: purple zenith melting into orange at the horizon.
  const skyGeo = new THREE.SphereGeometry(900, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float t=clamp(normalize(vP).y*1.4+0.25,0.0,1.0); vec3 top=vec3(0.23,0.13,0.42); vec3 mid=vec3(0.85,0.35,0.45); vec3 low=vec3(1.0,0.62,0.25); vec3 c=mix(low,mid,smoothstep(0.0,0.45,t)); c=mix(c,top,smoothstep(0.4,1.0,t)); gl_FragColor=vec4(c,1.0); }',
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Low sun disc + warm directional light + soft hemisphere.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(34, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: false }));
  sun.position.set(-260, 95, -620); sun.lookAt(0, 40, 0); scene.add(sun);
  const dl = new THREE.DirectionalLight(0xffb36b, 1.5);
  dl.position.set(-200, 160, -300); scene.add(dl);
  // Warm fill from the south-east so the camera-facing (south) walls of
  // the buildings are not pitch black at dusk.
  const fill = new THREE.DirectionalLight(0xff8c42, 0.7);
  fill.position.set(200, 120, 300); scene.add(fill);
  scene.add(new THREE.HemisphereLight(0x8a6bbf, 0x3a2a1a, 0.95));
  scene.fog = new THREE.Fog(0xd97a4e, 260, 820);

  // Ground: grass-green island, sand beach strip, sea beyond the shore.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700),
    new THREE.MeshLambertMaterial({ color: 0x4d7a3a }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, 0); scene.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(56, 700),
    new THREE.MeshLambertMaterial({ color: 0xe8cf9a }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(312, 0.05, 0); scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(420, 760),
    new THREE.MeshPhongMaterial({ color: 0x1f6f8b, shininess: 120, specular: 0xff9a50 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(560, -0.4, 0); scene.add(sea);
  out.sea = sea;

  // Roads: dark asphalt strips on the avenue/street grid + beach boulevard.
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x2b2b30 });
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd34d });
  function roadStrip(x, z, w, d) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), roadMat);
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.08, z); scene.add(m);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w, d) === w ? 0.7 : w, Math.min(w, d) === w ? d : 0.7), lineMat);
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.1, z); scene.add(l);
  }
  for (const x of AVENUES) roadStrip(x, 0, ROAD_W, 680);
  for (const z of STREETS) roadStrip(0, z, 680, ROAD_W);
  // Beach boulevard is wider, with a sand shoulder.
  roadStrip(290, 0, 20, 680);

  // Buildings: boxes in the blocks, warm lit windows, varied heights.
  const facades = [windowTexture('#3a2f4d', '#ffd27a'), windowTexture('#4d3a2f', '#ffce6b'), windowTexture('#2f3a4d', '#ffe08a')];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const blockXs = [-200, -80, 40, 160, 255];
  const blockZs = [-200, -80, 40, 160];
  for (const bx of blockXs) {
    for (const bz of blockZs) {
      if (bx === 255 && bz === 160) continue; // marina open ground
      const w = 34 + rnd() * 22, d = 30 + rnd() * 20, h = 22 + rnd() * 42;
      const mat = new THREE.MeshLambertMaterial({ map: facades[Math.floor(rnd() * 3)] });
      const b = new THREE.Mesh(boxGeo, mat);
      b.scale.set(w, h, d); b.position.set(bx, h / 2, bz); scene.add(b);
      out.buildings.push({ x: bx, z: bz, hw: w / 2 + 1, hd: d / 2 + 1 });
      // Roof trim so blocks read as a skyline at dusk.
      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1.2, d + 1),
        new THREE.MeshLambertMaterial({ color: 0x1c1426 }));
      trim.position.set(bx, h + 0.6, bz); scene.add(trim);
    }
  }

  // Palm trees along the boulevard and the marina.
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2f });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2f8f4e });
  function palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 6), trunkMat);
    trunk.position.y = 4.5; g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5, 4), leafMat);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 2.2, 9.4, Math.sin(a) * 2.2);
      leaf.rotation.z = Math.cos(a) * 1.1; leaf.rotation.x = -Math.sin(a) * 1.1;
      g.add(leaf);
    }
    g.position.set(x, 0, z); scene.add(g); out.palms.push(g);
  }
  for (let z = -320; z <= 320; z += 40) { palm(276, z); palm(304, z + 20); }
  for (let x = -240; x <= 240; x += 80) palm(x, 232);

  // Kumala Pier: wooden deck out over the sea, lamps, moored boats.
  const deckMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 90), deckMat);
  deck.position.set(352, 1.2, -290); scene.add(deck);
  for (let z = -330; z <= -250; z += 16) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 7, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a3826 }));
    post.position.set(352, 3.5, z); scene.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    lamp.position.set(352, 7.4, z); scene.add(lamp);
  }
  const boatMat = new THREE.MeshLambertMaterial({ color: 0xdfe8ee });
  for (const [bx, bz] of [[372, -270], [372, -310], [330, -320]]) {
    const boat = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 18), boatMat);
    boat.position.set(bx, 0.6, bz); scene.add(boat);
  }

  // Shop signs on the boulevard and market fronts.
  const signDefs = [
    ['MANGO & RYE', 268, 8, -60, '#e63946', '#fff3d6'],
    ['NEON TIDE', 268, 8, 60, '#2a9d8f', '#ffffff'],
    ['PASAR ARUNIKA', -160, 9, -24, '#e9a319', '#1c1426'],
    ['KUMALA PIER', 300, 10, -262, '#1d3557', '#ffd34d'],
  ];
  for (const [txt, x, y, z, bg, fg] of signDefs) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5),
      new THREE.MeshBasicMaterial({ map: signTexture(txt, bg, fg, null) }));
    s.position.set(x, y, z); s.rotation.y = -Math.PI / 2; scene.add(s);
    out.signs.push(s);
  }

  // Street lamps along the avenues.
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (const x of [-260, -20, 220]) {
    for (let z = -300; z <= 300; z += 120) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 6), lampMat);
      pole.position.set(x + 8, 4, z); scene.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), bulbMat);
      bulb.position.set(x + 8, 8.2, z); scene.add(bulb);
    }
  }

  // Garage interior: a bright room far outside the city, reached by teleport.
  const room = new THREE.Group();
  room.position.set(560, 0, 560);
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf2e8d5 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0xcfc4ae });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; room.add(floor);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(12, 8),
    new THREE.MeshLambertMaterial({ color: 0xb3202c }));
  mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.05, 0); room.add(mat);
  function wall(w, h, x, y, z, ry) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; room.add(m);
  }
  wall(30, 9, 0, 4.5, -11, 0); wall(30, 9, 0, 4.5, 11, Math.PI);
  wall(22, 9, -15, 4.5, 0, Math.PI / 2); wall(22, 9, 15, 4.5, 0, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(30, 22),
    new THREE.MeshLambertMaterial({ color: 0xefe6d2 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 9; room.add(ceil);
  for (const lx of [-8, 0, 8]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(5, 2),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8 }));
    panel.rotation.x = Math.PI / 2; panel.position.set(lx, 8.9, 0); room.add(panel);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3),
    new THREE.MeshBasicMaterial({ map: signTexture('ARUNIKA CUSTOMS', '#b3202c', '#ffffff', 'REPAINT • REPAIR') }));
  sign.position.set(0, 6.2, -10.8); room.add(sign);
  // Lift posts + workbench props. Posts sit wide so the garage camera
  // (south-east) sees the car clear of them.
  const postMat = new THREE.MeshLambertMaterial({ color: 0x2a9d8f });
  for (const px of [-3.2, 3.2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.5, 0.7), postMat);
    post.position.set(px, 2.25, 0); room.add(post);
  }
  const bench = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 2),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2f }));
  bench.position.set(-11, 1.4, -8); room.add(bench);
  const roomLight = new THREE.PointLight(0xffe9c0, 1.4, 40);
  roomLight.position.set(0, 8, 0); room.add(roomLight);
  scene.add(room);
  out.garageRoom = room;

  // Garage door marker in the city (red building at Marina Row).
  const gb = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 14),
    new THREE.MeshLambertMaterial({ color: 0xb3202c }));
  gb.position.set(GARAGE_POS.x, 5, GARAGE_POS.z); scene.add(gb);
  out.buildings.push({ x: GARAGE_POS.x, z: GARAGE_POS.z, hw: 13, hd: 8 });
  const gsign = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.5),
    new THREE.MeshBasicMaterial({ map: signTexture('ARUNIKA CUSTOMS', '#7a1010', '#ffd34d', null) }));
  gsign.position.set(GARAGE_POS.x, 8, GARAGE_POS.z - 7.2); scene.add(gsign);

  return out;
}
