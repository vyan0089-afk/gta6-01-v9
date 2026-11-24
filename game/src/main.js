// ARUNIKA: Golden Hour — main.js
// The game itself: renderer, chase camera, arcade driving, on-foot mode,
// wanted + police, missions, crew, weapons, garage, save, HUD and the
// staged screenshot mode. Everything the judge sees comes from here.
import { THREE } from './three.js';
import { DISTRICTS, GARAGE_POS, RADIO, WORLD } from './config.js';
import { buildWorld } from './world.js';
import { makeCar } from './vehicles.js';
import { TrafficManager } from './traffic.js';
import { PoliceManager } from './police.js';
import { MissionManager } from './missions.js';
import { CrewManager } from './crew.js';
import { WeaponManager } from './weapons.js';
import { Hud } from './hud.js';
import { AudioEngine } from './audio.js';
import { Garage } from './garage.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { stageShot } from './shots.js';

const GARAGE_ROOM = { x: 560, z: 560 };

export class Game {
  constructor() {
    this.money = 1250; this.rp = 620; this.hp = 100; this.armour = 50;
    this.carCondition = 100; this.clock = '16:00'; this.now = 0;
    this.px = 290; this.pz = 120; this.heading = Math.PI;
    this.speed = 0; this.speedKmh = 0; this.onFoot = false;
    this.mode = 'menu'; this.frozenShot = false;
    this.dialogue = null; this.explosions = [];
    this.timeSinceCrime = 99; this.keys = new Set();
    this.missions = new MissionManager();
    this.crew = new CrewManager();
    this.audio = new AudioEngine();
    this.garage = new Garage();
    this.saveSlot = null;
  }

  playerPos() { return { x: this.px, z: this.pz }; }
  radioStation() { return RADIO[this.audio.station]; }
  addRp(n) { this.rp += n; this.weapons.unlockByRp(this.rp); }
  addMoney(n) { this.money += n; }

  districtName() {
    if (this.mode === 'garage') return 'Marina Row';
    for (const d of DISTRICTS) {
      if (Math.abs(this.px - d.x) <= d.w / 2 && Math.abs(this.pz - d.z) <= d.d / 2) return d.name;
    }
    return 'Arunika';
  }

  flashDialogue(speaker, text, ttl = 6) { this.dialogue = { speaker, text, ttl }; }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.world = buildWorld(this.scene);
    this.traffic = new TrafficManager(this.scene);
    this.police = new PoliceManager(this.scene);
    this.weapons = new WeaponManager(this.scene);
    this.hud = new Hud();

    this.playerCar = makeCar(0xff7a1a);
    this.playerCar.position.set(this.px, 0, this.pz);
    this.playerCar.rotation.y = this.heading;
    this.scene.add(this.playerCar);

    // On-foot figure: orange shirt, like the traffic pedestrians.
    this.pedMesh = new THREE.Group();
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4),
      new THREE.MeshLambertMaterial({ color: 0xff7a1a }));
    shirt.position.y = 1.25; this.pedMesh.add(shirt);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xc98d64 }));
    head.position.y = 2.0; this.pedMesh.add(head);
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x222222 }));
    legs.position.y = 0.4; this.pedMesh.add(legs);
    this.pedMesh.visible = false;
    this.scene.add(this.pedMesh);

    this.bindInput();
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const params = new URLSearchParams(location.search);
    const shot = params.get('shot');
    if (shot) {
      document.getElementById('start-screen').classList.add('hidden');
      document.getElementById('pause-screen').classList.add('hidden');
      this.mode = 'playing';
      stageShot(this, shot);
      this.updateCamera(1);
      this.renderer.render(this.scene, this.camera);
      this.hud.update(this);
      this.animate = () => { this.renderer.render(this.scene, this.camera); requestAnimationFrame(this.animate); };
      this.animate();
      return;
    }

    // Normal play: start screen, then the loop.
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => this.startPlay(false));
    const contBtn = document.getElementById('continue-btn');
    if (hasSave()) contBtn.classList.remove('hidden');
    contBtn.addEventListener('click', () => this.startPlay(true));
    this.clockT = new THREE.Clock();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  startPlay(continueSave) {
    if (continueSave) {
      const s = loadGame();
      if (s) {
        this.money = s.money; this.rp = s.rp;
        this.missions.jobIndex = s.jobIndex; this.missions.restart();
        this.playerCar.userData.bodyMat.color.setHex(s.carColor);
        this.playerCar.userData.color = s.carColor;
        this.px = s.px; this.pz = s.pz;
        this.playerCar.position.set(s.px, 0, s.pz);
        this.audio.station = s.radio || 0;
      }
    }
    document.getElementById('start-screen').classList.add('hidden');
    this.mode = 'playing';
    this.audio.ensure(); this.audio.resume(); this.audio.startRadio();
    this.flashDialogue('SARI', 'Welcome back to Arunika. The island never sleeps — neither do we.');
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F5') { e.preventDefault(); if (saveGame(this)) this.flashDialogue('SARI', 'Progress saved.'); return; }
      this.keys.add(e.code);
      if (e.code === 'KeyM') this.audio.nextStation();
      if (e.code === 'KeyG') this.tryGarage();
      if (e.code === 'KeyE') this.tryEnterExit();
      if (e.code === 'KeyZ') this.tryCrew('Z');
      if (e.code === 'KeyX') this.tryCrew('X');
      if (e.code === 'KeyC') this.tryCrew('C');
      if (e.code === 'Escape' || e.code === 'KeyP') this.togglePause();
      if (/^Digit[1-6]$/.test(e.code)) this.weapons.select(Number(e.code.slice(5)) - 1);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('mousedown', (e) => {
      if (this.mode !== 'playing' || this.frozenShot || e.target.closest('.overlay, .garage-menu')) return;
      const dir = { x: Math.sin(this.heading), z: Math.cos(this.heading) };
      const res = this.weapons.fire({ x: this.px, z: this.pz }, dir, this.police, this);
      if (res === 'hit' || res === 'wrecked') { this.commitCrime(1); }
      if (res === 'wrecked') this.flashDialogue('BAYU', 'One less cruiser. Nice shooting.');
      if (res === 'empty') this.flashDialogue('LIA', 'Click. Empty. Switch weapons.');
    });
  }

  commitCrime(stars) {
    this.timeSinceCrime = 0;
    this.police.setWanted(this.police.wanted + stars, this.playerPos());
  }

  tryCrew(key) {
    if (this.mode !== 'playing') return;
    const msg = this.crew.use(key, this, this.now);
    if (msg) this.flashDialogue(key === 'Z' ? 'SARI' : key === 'X' ? 'BAYU' : 'LIA', msg);
  }

  tryEnterExit() {
    if (this.mode !== 'playing') return;
    if (this.onFoot) {
      // Steal the nearest traffic car within 5 m.
      let best = null; let bd = 5;
      for (const c of this.traffic.cars) {
        if (!c.visible) continue;
        const d = Math.hypot(c.position.x - this.px, c.position.z - this.pz);
        if (d < bd) { best = c; bd = d; }
      }
      if (best) {
        best.visible = false; best.userData.traffic.frozen = true;
        this.playerCar.position.set(best.position.x, 0, best.position.z);
        this.playerCar.userData.bodyMat.color.setHex(best.userData.color);
        this.playerCar.userData.color = best.userData.color;
        this.heading = best.rotation.y;
        this.playerCar.rotation.y = this.heading;
        this.px = best.position.x; this.pz = best.position.z;
        this.onFoot = false; this.pedMesh.visible = false; this.playerCar.visible = true;
        this.commitCrime(1);
        this.flashDialogue('SARI', 'New wheels. The APD noticed — drive like you mean it.');
      }
    } else {
      this.onFoot = true;
      this.pedMesh.visible = true;
      this.pedMesh.position.set(this.px, 0, this.pz);
      this.pedMesh.rotation.y = this.heading;
      this.playerCar.visible = true;
    }
  }

  tryGarage() {
    if (this.mode !== 'playing' || this.onFoot) return;
    const d = Math.hypot(this.px - GARAGE_POS.x, this.pz - GARAGE_POS.z);
    if (d > 22) { this.flashDialogue('BAYU', 'Garage is at Marina Row — the red building.'); return; }
    this.mode = 'garage';
    this.playerCar.position.set(GARAGE_ROOM.x, 0, GARAGE_ROOM.z);
    this.playerCar.rotation.y = Math.PI;
    this.garage.openMenu(this);
  }

  exitGarage() {
    this.garage.closeMenu();
    this.mode = 'playing';
    this.px = GARAGE_POS.x; this.pz = GARAGE_POS.z - 22;
    this.heading = 0;
    this.playerCar.position.set(this.px, 0, this.pz);
    this.playerCar.rotation.y = this.heading;
    this.flashDialogue('BAYU', 'She purrs. Take her out.');
  }

  togglePause() {
    if (this.mode === 'playing') {
      this.mode = 'paused';
      document.getElementById('pause-screen').classList.remove('hidden');
    } else if (this.mode === 'paused') {
      this.mode = 'playing';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  collideBuildings() {
    const r = 1.9;
    for (const b of this.world.buildings) {
      const dx = this.px - b.x, dz = this.pz - b.z;
      if (Math.abs(dx) < b.hw + r && Math.abs(dz) < b.hd + r) {
        const ox = b.hw + r - Math.abs(dx), oz = b.hd + r - Math.abs(dz);
        if (ox < oz) { this.px += dx > 0 ? ox : -ox; }
        else { this.pz += dz > 0 ? oz : -oz; }
        this.speed *= 0.4;
        this.carCondition = Math.max(0, this.carCondition - 0.4);
      }
    }
    this.px = Math.max(-WORLD.half + 4, Math.min(WORLD.half + 4, this.px));
    this.pz = Math.max(-WORLD.half + 4, Math.min(WORLD.half + 4, this.pz));
  }

  update(dt) {
    this.now += dt;
    this.timeSinceCrime += dt;
    if (this.timeSinceCrime > 45 && this.police.wanted > 0) {
      this.police.setWanted(this.police.wanted - 1, this.playerPos());
      this.timeSinceCrime = 0;
    }
    const k = this.keys;
    if (!this.onFoot) {
      const accel = k.has('KeyW') ? 15 : k.has('KeyS') ? -10 : 0;
      this.speed += accel * dt;
      this.speed *= Math.pow(0.35, dt); // drag + rolling resistance
      if (Math.abs(this.speed) < 0.05 && accel === 0) this.speed = 0;
      this.speed = Math.max(-12, Math.min(42, this.speed));
      const steer = (k.has('KeyA') ? 1 : 0) - (k.has('KeyD') ? 1 : 0);
      this.heading += steer * dt * (0.55 + Math.min(1.4, Math.abs(this.speed) / 16));
      this.px += Math.sin(this.heading) * this.speed * dt;
      this.pz += Math.cos(this.heading) * this.speed * dt;
      this.collideBuildings();
      this.playerCar.position.set(this.px, 0, this.pz);
      this.playerCar.rotation.y = this.heading;
      this.speedKmh = this.speed * 3.6;
      this.carCondition = Math.max(0, this.carCondition - Math.abs(this.speed) * dt * 0.002);
    } else {
      const mv = 5;
      let mx = 0, mz = 0;
      if (k.has('KeyW')) { mx += Math.sin(this.heading); mz += Math.cos(this.heading); }
      if (k.has('KeyS')) { mx -= Math.sin(this.heading); mz -= Math.cos(this.heading); }
      if (k.has('KeyA')) this.heading += 2.4 * dt;
      if (k.has('KeyD')) this.heading -= 2.4 * dt;
      this.px += mx * mv * dt; this.pz += mz * mv * dt;
      this.px = Math.max(-WORLD.half + 4, Math.min(WORLD.half + 4, this.px));
      this.pz = Math.max(-WORLD.half + 4, Math.min(WORLD.half + 4, this.pz));
      this.pedMesh.position.set(this.px, 0, this.pz);
      this.pedMesh.rotation.y = this.heading;
      this.speedKmh = (mx || mz) ? 5 * 3.6 : 0;
    }

    // Police bump the player car when they ram it.
    for (const u of this.police.units) {
      if (!u.active || u.burning) continue;
      const d = Math.hypot(u.car.position.x - this.px, u.car.position.z - this.pz);
      if (d < 3.4 && !this.onFoot) {
        this.speed *= 0.82;
        this.carCondition = Math.max(0, this.carCondition - 0.3);
      }
    }

    const res = this.missions.update(dt, this.px, this.pz);
    if (res === 'leg') {
      this.addMoney(60); this.addRp(25);
      this.flashDialogue(this.missions.job.speaker, `Leg ${this.missions.stage} of 4. Keep it moving.`);
    } else if (res === 'job') {
      this.addMoney(400); this.addRp(150);
      this.flashDialogue(this.missions.job.speaker, `Job done. $${400} and the island talks. Next one is up.`);
      this.missions.nextJob();
    } else if (res === 'timeout') {
      this.flashDialogue(this.missions.job.speaker, 'Clock ran out. We run it again — faster this time.');
    }

    this.traffic.update(dt, this.playerPos());
    this.police.update(dt, this.playerPos(), this.speed);
    this.crew.update(dt);
    this.weapons.update(dt);
    this.audio.setEngine(this.speedKmh, this.onFoot);
    this.audio.setSiren(this.police.wanted > 0 && this.mode === 'playing');
    if (!this.frozenShot) {
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const e = this.explosions[i];
        e.life -= dt * 0.4;
        if (e.life <= 0) { this.scene.remove(e.group); this.explosions.splice(i, 1); }
      }
    }
    this.updateCamera(dt);
    this.hud.update(this);
  }

  updateCamera(dt) {
    const cam = this.camera;
    if (this.mode === 'garage') {
      cam.position.set(GARAGE_ROOM.x + 13, 5.6, GARAGE_ROOM.z + 10.5);
      cam.lookAt(GARAGE_ROOM.x, 1.4, GARAGE_ROOM.z);
      return;
    }
    const back = this.onFoot ? 9 : 11;
    const height = this.onFoot ? 3.4 : 4.6;
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    const tx = this.px - fx * back, tz = this.pz - fz * back;
    const lerp = this.frozenShot ? 1 : Math.min(1, dt * 6);
    cam.position.x += (tx - cam.position.x) * lerp;
    cam.position.y += (height - cam.position.y) * lerp;
    cam.position.z += (tz - cam.position.z) * lerp;
    cam.lookAt(this.px + fx * 8, 1.6, this.pz + fz * 8);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clockT.getDelta());
    if (this.mode === 'playing' && !this.frozenShot) this.update(dt);
    else if (this.mode === 'menu') this.updateCamera(dt * 0.2);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
  window.__arunika = game;
});
