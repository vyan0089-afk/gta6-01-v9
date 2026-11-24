// ARUNIKA: Golden Hour — garage.js
// Arunika Customs: repaint the GT in 6 colours, repair it for $50, and
// leave. The garage menu is DOM; the room itself is built in world.js.
import { PAINTS } from './config.js';

export class Garage {
  constructor() {
    this.open = false;
  }

  openMenu(game) {
    this.open = true;
    const menu = document.getElementById('garage-menu');
    menu.classList.remove('hidden');
    // The menu takes the right column: hide weapons + crew while it is up.
    document.getElementById('weapon-panel').classList.add('hidden');
    document.getElementById('crew-panel').classList.add('hidden');
    const list = document.getElementById('paint-list');
    list.innerHTML = PAINTS.map((p, i) =>
      `<button class="paint-btn" data-i="${i}" style="background:#${p.color.toString(16).padStart(6, '0')}">${p.name}</button>`).join('');
    list.querySelectorAll('.paint-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const p = PAINTS[Number(b.dataset.i)];
        game.playerCar.userData.bodyMat.color.setHex(p.color);
        game.playerCar.userData.color = p.color;
        game.flashDialogue('BAYU', `That ${p.name.toLowerCase()} suits her. Fresh paint, full tank.`);
      });
    });
    document.getElementById('repair-btn').onclick = () => {
      if (game.money < 50) { game.flashDialogue('BAYU', 'Fifty bucks for the full service, boss.'); return; }
      game.money -= 50;
      game.playerCar.userData.hp = 100;
      game.carCondition = 100;
      game.flashDialogue('BAYU', 'Repaired. Zero dents, full tank.');
    };
    document.getElementById('garage-exit').onclick = () => game.exitGarage();
  }

  closeMenu() {
    this.open = false;
    document.getElementById('garage-menu').classList.add('hidden');
    document.getElementById('weapon-panel').classList.remove('hidden');
    document.getElementById('crew-panel').classList.remove('hidden');
  }
}
