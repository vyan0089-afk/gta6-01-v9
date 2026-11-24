// ARUNIKA: Golden Hour — weapons.js
// Six weapon slots with ammo and locks. Firing is hitscan: a tracer from
// the player to the nearest police car in the firing cone damages it;
// enough hits wreck it in a fireball.
import { THREE } from './three.js';
import { WEAPONS } from './config.js';
import { makeExplosion } from './vehicles.js';

export class WeaponManager {
  constructor(scene) {
    this.scene = scene;
    this.slots = WEAPONS.map((w) => ({ ...w, ammo: w.ammo }));
    this.current = 0;
    this.tracers = [];
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 });
  }

  unlockByRp(rp) {
    for (const s of this.slots) {
      if (s.locked && s.unlockRp !== undefined && rp >= s.unlockRp) s.locked = false;
    }
  }

  select(i) {
    if (i < 0 || i >= this.slots.length) return;
    if (this.slots[i].locked) return;
    this.current = i;
  }

  get currentWeapon() { return this.slots[this.current]; }

  fire(origin, dir, police, game) {
    const w = this.currentWeapon;
    if (w.locked) return null;
    if (w.ammo !== Infinity) {
      if (w.ammo <= 0) return 'empty';
      w.ammo--;
    }
    let best = null; let bestD = 70;
    for (const u of police.units) {
      if (!u.active || u.burning) continue;
      const dx = u.car.position.x - origin.x;
      const dz = u.car.position.z - origin.z;
      const d = Math.hypot(dx, dz);
      if (d > 70 || d > bestD) continue;
      const dot = (dx * dir.x + dz * dir.z) / (d || 1);
      if (dot < 0.86) continue;
      best = u; bestD = d;
    }
    const end = best
      ? { x: best.car.position.x, y: 1.2, z: best.car.position.z }
      : { x: origin.x + dir.x * 55, y: 1.2, z: origin.z + dir.z * 55 };
    this.spawnTracer(origin, end);
    if (!best) return 'miss';
    const dmg = w.name === 'FISTS' ? 12 : w.name === 'RPG' ? 120 : w.name === 'AR-9' ? 40 : 26;
    best.hp -= dmg;
    if (best.hp <= 0 && !best.burning) {
      best.burning = true;
      makeExplosion(this.scene, best.car.position.x, 1, best.car.position.z);
      best.car.visible = false;
      game.addRp(60);
      return 'wrecked';
    }
    return 'hit';
  }

  spawnTracer(a, b) {
    const len = Math.hypot(b.x - a.x, b.y - 1.2, b.z - a.z);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), this.tracerMat);
    mesh.position.set((a.x + b.x) / 2, 1.2, (a.z + b.z) / 2);
    mesh.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: 0.12 });
  }

  update(dt) {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}
