// ARUNIKA: Golden Hour — traffic.js
// Civilian traffic and pedestrians. Cars loop the avenue/street grid;
// pedestrians stroll the sidewalks. Seeded so a staged shot is identical
// every time it is taken.
import { THREE } from './three.js';
import { AVENUES, STREETS, WORLD } from './config.js';
import { makeCar } from './vehicles.js';

const CIV_COLORS = [0x2a9d8f, 0xe63946, 0xffd60a, 0x43aa5b, 0x7b5ea7, 0xdfe8ee, 0x2f6f8f, 0xc96f2a];
const SHIRT_COLORS = [0xe63946, 0xffffff, 0x2a9d8f, 0xffd60a, 0x7b5ea7, 0x43aa5b, 0xff8c42];

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class TrafficManager {
  constructor(scene) {
    this.scene = scene;
    this.cars = [];
    this.peds = [];
    this.rnd = mulberry(20261124);
    this.build();
  }

  build() {
    // 10 civilian cars on road loops: pick an avenue or street, drive it,
    // turn at the ends, keep going. Speeds 6–11 m/s.
    for (let i = 0; i < 10; i++) {
      const ns = this.rnd() < 0.5;
      const lane = ns ? AVENUES[Math.floor(this.rnd() * AVENUES.length)] : STREETS[Math.floor(this.rnd() * STREETS.length)];
      const car = makeCar(CIV_COLORS[i % CIV_COLORS.length]);
      car.userData.traffic = {
        ns, lane, t: this.rnd() * 680 - 340, dir: this.rnd() < 0.5 ? 1 : -1,
        speed: 6 + this.rnd() * 5,
      };
      this.scene.add(car);
      this.cars.push(car);
    }
    // 16 pedestrians on sidewalks near roads.
    for (let i = 0; i < 16; i++) {
      const g = new THREE.Group();
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4),
        new THREE.MeshLambertMaterial({ color: SHIRT_COLORS[i % SHIRT_COLORS.length] }));
      shirt.position.y = 1.25; g.add(shirt);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xc98d64 }));
      head.position.y = 2.0; g.add(head);
      const legs = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.8, 0.35),
        new THREE.MeshLambertMaterial({ color: 0x222222 }));
      legs.position.y = 0.4; g.add(legs);
      const nearRoad = this.rnd() < 0.5;
      const px = nearRoad ? AVENUES[Math.floor(this.rnd() * AVENUES.length)] + 9 : this.rnd() * 560 - 280;
      const pz = nearRoad ? this.rnd() * 600 - 300 : STREETS[Math.floor(this.rnd() * STREETS.length)] + 9;
      g.position.set(px, 0, pz);
      g.userData.ped = { heading: this.rnd() * Math.PI * 2, speed: 1 + this.rnd() * 0.8, seed: i };
      this.scene.add(g);
      this.peds.push(g);
    }
  }

  // Place traffic for a staged shot: exact cars/peds at exact spots.
  stageDrive() {
    // Civilian cars on the boulevard ahead of the player, close enough to
    // read in the cover: 65–195 m up the road.
    const spots = [
      { x: 283, z: 55, h: Math.PI, c: 0x2a9d8f }, { x: 297, z: 28, h: Math.PI, c: 0xe63946 },
      { x: 284, z: 8, h: Math.PI, c: 0xffd60a }, { x: 296, z: -18, h: Math.PI, c: 0x43aa5b },
      { x: 283, z: -45, h: Math.PI, c: 0x7b5ea7 }, { x: 297, z: -75, h: Math.PI, c: 0xdfe8ee },
    ];
    spots.forEach((s, i) => {
      const car = this.cars[i % this.cars.length];
      car.position.set(s.x, 0, s.z); car.rotation.y = s.h;
      car.userData.bodyMat.color.setHex(s.c);
      car.userData.traffic.frozen = true;
    });
    // Pedestrians on both sidewalks, 30–115 m ahead.
    const pedSpots = [[278, 90], [302, 80], [277, 55], [303, 40], [278, 25], [303, 5]];
    pedSpots.forEach((s, i) => {
      const p = this.peds[i % this.peds.length];
      p.position.set(s[0], 0, s[1]); p.userData.ped.frozen = true;
    });
  }

  stageRace() {
    const spots = [
      { x: 92, z: 160, h: Math.PI, c: 0xe63946 }, { x: 108, z: 140, h: Math.PI, c: 0x2a9d8f },
      { x: 94, z: 110, h: Math.PI, c: 0xffd60a }, { x: 108, z: 80, h: Math.PI, c: 0x43aa5b },
    ];
    spots.forEach((s, i) => {
      const car = this.cars[i % this.cars.length];
      car.position.set(s.x, 0, s.z); car.rotation.y = s.h;
      car.userData.bodyMat.color.setHex(s.c);
      car.userData.traffic.frozen = true;
    });
    [[88, 170], [112, 150], [90, 120], [112, 100]].forEach((s, i) => {
      const p = this.peds[i % this.peds.length];
      p.position.set(s[0], 0, s[1]); p.userData.ped.frozen = true;
    });
  }

  stageFoot() {
    // Pedestrians close around the player on foot (all ahead of him),
    // plus a few cars on the avenue so the street reads as alive.
    const spots = [[-128, 2], [-152, -8], [-124, -18], [-156, -2], [-134, -24], [-146, -32], [-118, -6], [-162, -14]];
    spots.forEach((s, i) => {
      const p = this.peds[i % this.peds.length];
      p.position.set(s[0], 0, s[1]); p.userData.ped.frozen = true;
    });
    const carSpots = [
      { x: -143, z: -30, h: Math.PI, c: 0x2a9d8f },
      { x: -137, z: -70, h: Math.PI, c: 0xe63946 },
      { x: -143, z: -110, h: Math.PI, c: 0xffd60a },
    ];
    carSpots.forEach((s, i) => {
      const car = this.cars[i % this.cars.length];
      car.position.set(s.x, 0, s.z); car.rotation.y = s.h;
      car.userData.bodyMat.color.setHex(s.c);
      car.userData.traffic.frozen = true;
    });
  }

  update(dt, playerPos) {
    for (const car of this.cars) {
      const t = car.userData.traffic;
      if (t.frozen) continue;
      t.t += t.dir * t.speed * dt;
      if (t.t > 330) { t.t = 330; t.dir = -1; }
      if (t.t < -330) { t.t = -330; t.dir = 1; }
      if (t.ns) { car.position.set(t.lane + (t.dir > 0 ? -3.5 : 3.5), 0, t.t); car.rotation.y = t.dir > 0 ? 0 : Math.PI; }
      else { car.position.set(t.t, 0, t.lane + (t.dir > 0 ? 3.5 : -3.5)); car.rotation.y = t.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    }
    for (const p of this.peds) {
      const d = p.userData.ped;
      if (d.frozen) continue;
      d.heading += (Math.sin(performance.now() / 4000 + d.seed * 7) * 0.4) * dt;
      p.position.x += Math.sin(d.heading) * d.speed * dt;
      p.position.z += Math.cos(d.heading) * d.speed * dt;
      p.position.x = Math.max(-WORLD.half, Math.min(WORLD.half, p.position.x));
      p.position.z = Math.max(-WORLD.half, Math.min(WORLD.half, p.position.z));
      p.rotation.y = d.heading;
    }
  }
}
