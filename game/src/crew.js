// ARUNIKA: Golden Hour — crew.js
// Sari, Bayu and Lia: three abilities on Z / X / C with 30 s cooldowns.
// Each ability changes the game state; the HUD shows READY or the seconds left.
import { CREW } from './config.js';

export class CrewManager {
  constructor() {
    this.cooldowns = { Z: 0, X: 0, C: 0 };
    this.eyesOutUntil = 0;
  }

  // now is seconds since start. Returns a message for the HUD, or null.
  use(key, game, now) {
    const def = CREW.find((c) => c.key === key);
    if (!def) return null;
    if (this.cooldowns[key] > 0) return null;
    this.cooldowns[key] = def.cooldown;
    if (key === 'Z') {
      game.police.setWanted(game.police.wanted - 1, game.playerPos());
      return 'SARI swapped the plates — one star down.';
    }
    if (key === 'X') {
      game.playerCar.userData.hp = 100;
      game.carCondition = 100;
      return 'BAYU patched the GT — good as new.';
    }
    this.eyesOutUntil = now + 25;
    return 'LIA has eyes out — every unit on the minimap.';
  }

  update(dt) {
    for (const k of ['Z', 'X', 'C']) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }
  }

  eyesOut(now) { return now < this.eyesOutUntil; }

  rows() {
    return CREW.map((c) => ({
      ...c,
      ready: this.cooldowns[c.key] <= 0,
      secs: Math.ceil(this.cooldowns[c.key]),
    }));
  }
}
