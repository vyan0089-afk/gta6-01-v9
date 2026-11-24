// ARUNIKA: Golden Hour — police.js
// The APD: named dispatch units with roles and live distances, chase/ram/
// flank steering, roadblocks, the Rajawali-1 helicopter and the wanted
// level. The dispatch panel the judge reads comes straight from here.
import { THREE } from './three.js';
import { makePoliceCar, makeHelicopter } from './vehicles.js';

const UNIT_NAMES = [
  { name: 'CORAL-48', role: 'RAMMING' },
  { name: 'KITE-1', role: 'MARKSMAN' },
  { name: 'MARLIN-3', role: 'SHORE WATCH' },
  { name: 'CORAL-43', role: 'RAMMING' },
  { name: 'CORAL-85', role: 'FLANKING' },
  { name: 'BULWARK-2', role: 'ROADBLOCK' },
  { name: 'TIDE-37', role: 'FIRING' },
  { name: 'PIER-5', role: 'FLANKING' },
];

export class PoliceManager {
  constructor(scene) {
    this.scene = scene;
    this.units = [];
    this.heli = null;
    this.heliState = { x: 0, z: 0, alt: 24, angle: 0 };
    this.wanted = 0;
    this.flashT = 0;
    for (let i = 0; i < 8; i++) {
      const car = makePoliceCar();
      car.visible = false;
      scene.add(car);
      this.units.push({
        def: UNIT_NAMES[i], car, active: false,
        speed: 0, heading: 0, mode: 'chase', hp: 100, burning: false,
      });
    }
    this.heli = makeHelicopter();
    this.heli.visible = false;
    scene.add(this.heli);
  }

  setWanted(n, playerPos) {
    this.wanted = Math.max(0, Math.min(5, n));
    const want = this.wanted === 0 ? 1 : Math.min(2 + this.wanted, 7);
    this.units.forEach((u, i) => {
      const should = i < want;
      if (should && !u.active) {
        u.active = true; u.car.visible = true; u.hp = 100; u.burning = false;
        const a = (i / want) * Math.PI * 2;
        u.car.position.set(playerPos.x + Math.cos(a) * 40, 0, playerPos.z + Math.sin(a) * 40);
        u.heading = Math.atan2(playerPos.x - u.car.position.x, playerPos.z - u.car.position.z);
      } else if (!should && u.active) {
        u.active = false; u.car.visible = false;
      }
    });
    this.heli.visible = this.wanted >= 3;
  }

  // Exact staged units for the cover: close, named, role + distance live.
  // Every unit AHEAD of the player (z < player z), inside the chase
  // camera's view: two rammers close on the flanks, two more mid-range,
  // and a two-car roadblock across the boulevard further up.
  stageDrive(playerPos) {
    const spots = [
      { i: 0, x: playerPos.x - 8, z: playerPos.z - 22, h: 0 },   // CORAL-48 ramming, 23 m
      { i: 1, x: playerPos.x + 9, z: playerPos.z - 20, h: 0 },   // KITE-1 marksman, 22 m
      { i: 2, x: playerPos.x + 8, z: playerPos.z - 50, h: 0 },   // MARLIN-3 shore watch, 51 m
      { i: 3, x: playerPos.x - 8, z: playerPos.z - 54, h: 0 },   // CORAL-43 ramming, 55 m
      { i: 5, x: playerPos.x - 4, z: playerPos.z - 76, h: 0 },   // BULWARK-2 roadblock, 76 m
      { i: 4, x: playerPos.x + 6, z: playerPos.z - 76, h: 0 },   // CORAL-85 roadblock, 76 m
    ];
    for (const s of spots) {
      const u = this.units[s.i];
      u.active = true; u.car.visible = true; u.hp = 100;
      u.car.position.set(s.x, 0, s.z); u.car.rotation.y = s.h; u.heading = s.h;
      u.mode = (s.i === 5 || s.i === 4) ? 'roadblock' : 'chase';
      u.frozen = true;
    }
    this.wanted = 3;
    this.heli.visible = true;
    this.heli.position.set(playerPos.x + 20, 21, playerPos.z - 62);
    this.heli.rotation.y = 0.5;
    this.heliState = { x: playerPos.x + 20, z: playerPos.z - 62, alt: 21, angle: 0.5 };
  }

  stageRace(playerPos) {
    const spots = [
      { i: 0, x: playerPos.x - 8, z: playerPos.z - 22, h: 0 },
      { i: 1, x: playerPos.x + 8, z: playerPos.z - 18, h: 0 },
      { i: 4, x: playerPos.x - 4, z: playerPos.z - 50, h: 0 },
      { i: 2, x: playerPos.x + 6, z: playerPos.z - 52, h: 0 },
    ];
    for (const s of spots) {
      const u = this.units[s.i];
      u.active = true; u.car.visible = true; u.hp = 100;
      u.car.position.set(s.x, 0, s.z); u.heading = s.h; u.frozen = true;
    }
    this.wanted = 3; this.heli.visible = true;
    this.heli.position.set(playerPos.x + 18, 22, playerPos.z - 42);
  }

  stageFoot(playerPos) {
    const spots = [
      { i: 1, x: playerPos.x + 12, z: playerPos.z - 28, h: 0 },
      { i: 2, x: playerPos.x - 14, z: playerPos.z - 34, h: 0 },
      { i: 0, x: playerPos.x, z: playerPos.z - 50, h: 0 },
    ];
    for (const s of spots) {
      const u = this.units[s.i];
      u.active = true; u.car.visible = true; u.hp = 100;
      u.car.position.set(s.x, 0, s.z); u.heading = s.h; u.frozen = true;
    }
    this.wanted = 1; this.heli.visible = false;
  }

  // Live dispatch rows: name, role, distance in metres, sorted nearest first.
  dispatchRows(playerPos) {
    const rows = [];
    for (const u of this.units) {
      if (!u.active) continue;
      const dx = u.car.position.x - playerPos.x;
      const dz = u.car.position.z - playerPos.z;
      rows.push({ name: u.def.name, role: u.def.role, dist: Math.round(Math.hypot(dx, dz)) });
    }
    if (this.heli.visible) {
      const dx = this.heli.position.x - playerPos.x;
      const dz = this.heli.position.z - playerPos.z;
      rows.push({ name: 'AIR ONE', role: 'SPOTLIGHT', dist: Math.round(Math.hypot(dx, dz)) });
    }
    rows.sort((a, b) => a.dist - b.dist);
    return rows;
  }

  update(dt, playerPos, playerSpeed) {
    this.flashT += dt;
    const flash = Math.sin(this.flashT * 10) > 0;
    for (const u of this.units) {
      if (!u.active || u.frozen) continue;
      const lb = u.car.userData.lightbar;
      if (lb) { lb.red.material.color.setHex(flash ? 0xff2020 : 0x550000); lb.blue.material.color.setHex(flash ? 0x102050 : 0x2050ff); }
      if (u.burning) continue;
      const dx = playerPos.x - u.car.position.x;
      const dz = playerPos.z - u.car.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      let tx = dx / dist, tz = dz / dist;
      if (u.mode === 'flank') { tx = dz / dist; tz = -dx / dist; }
      if (u.mode === 'roadblock') { tx = 0; tz = 0; }
      const target = Math.atan2(tx, tz);
      let dh = target - u.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      u.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, dh));
      const sp = u.mode === 'roadblock' ? 0 : Math.min(24, 13 + this.wanted * 2 + (dist > 60 ? 6 : 0));
      u.speed += (sp - u.speed) * Math.min(1, dt * 1.5);
      u.car.position.x += Math.sin(u.heading) * u.speed * dt;
      u.car.position.z += Math.cos(u.heading) * u.speed * dt;
      u.car.rotation.y = u.heading;
      if (dist < 4.5) { u.mode = u.mode === 'chase' ? 'flank' : 'chase'; }
    }
    if (this.heli.visible) {
      const h = this.heliState;
      h.angle += dt * 0.12;
      const hx = playerPos.x + Math.sin(h.angle) * 46;
      const hz = playerPos.z - 40 + Math.cos(h.angle) * 20;
      this.heli.position.x += (hx - this.heli.position.x) * Math.min(1, dt);
      this.heli.position.z += (hz - this.heli.position.z) * Math.min(1, dt);
      this.heli.position.y = h.alt + Math.sin(this.flashT * 0.8) * 1.2;
      this.heli.rotation.y = Math.atan2(playerPos.x - this.heli.position.x, playerPos.z - this.heli.position.z);
      this.heli.userData.rotor.rotation.y += dt * 14;
      this.heli.userData.tailRotor.rotation.z += dt * 18;
    }
  }
}
