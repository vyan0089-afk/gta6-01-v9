// ARUNIKA: Golden Hour — shots.js
// Deterministic staged scenes for the 4 screenshots. Each shot sets the
// player, police, traffic and pedestrians at exact spots, fixes the HUD
// values (job, timer, speed, wanted), and freezes the simulation so the
// render is identical every time it is taken.
import { makeExplosion } from './vehicles.js';

function placePlayerCar(g, x, z, heading) {
  g.playerCar.position.set(x, 0, z);
  g.playerCar.rotation.y = heading;
  g.heading = heading;
  g.px = x; g.pz = z;
  g.onFoot = false;
  g.pedMesh.visible = false;
  g.playerCar.visible = true;
}

function common(g, jobIdx, stage, timer, money, rp, wanted, clock) {
  g.missions.stageTo(jobIdx, stage, timer);
  g.money = money; g.rp = rp; g.clock = clock;
  g.police.setWanted(0, { x: g.px, z: g.pz });
  g.police.wanted = wanted;
  g.weapons.unlockByRp(rp);
  g.frozenShot = true;
}

export function stageShot(g, name) {
  if (name === 'drive') {
    placePlayerCar(g, 290, 120, Math.PI);
    g.speedKmh = 97; g.speed = 97 / 3.6;
    common(g, 1, 3, 48, 1250, 620, 3, '16:00');
    g.missions.setLeg(2, 290, -88); // waypoint 208 m ahead, inside the world
    g.police.stageDrive({ x: 290, z: 120 });
    g.traffic.stageDrive();
    makeExplosion(g.scene, 290, 1, 58); // fire glow mid-road, 62 m ahead, in frame
    g.flashDialogue('SARI', "He's making for Kumala Pier! Cut off the Regent before it reaches the water!", 999);
  } else if (name === 'race') {
    placePlayerCar(g, 100, 200, Math.PI);
    g.speedKmh = 112; g.speed = 112 / 3.6;
    common(g, 3, 2, 120, 1250, 620, 3, '16:00');
    g.police.stageRace({ x: 100, z: 200 });
    g.traffic.stageRace();
    g.flashDialogue('BAYU', "The race is on! Keep the pedal down and don't let the APD box you in!", 999);
  } else if (name === 'foot') {
    g.onFoot = true;
    g.playerCar.visible = false;
    g.pedMesh.visible = true;
    g.pedMesh.position.set(-140, 0, 20);
    g.pedMesh.rotation.y = Math.PI;
    g.px = -140; g.pz = 20; g.heading = Math.PI;
    g.speedKmh = 0; g.speed = 0;
    common(g, 5, 2, 135, 1250, 620, 1, '16:00');
    g.police.stageFoot({ x: -140, z: 20 });
    g.traffic.stageFoot();
    g.flashDialogue('LIA', 'The drop is two blocks down, past the market stalls. Stay casual.', 999);
  } else if (name === 'garage') {
    placePlayerCar(g, 560, 560, Math.PI);
    g.speedKmh = 0; g.speed = 0;
    common(g, 2, 2, 150, 1250, 620, 0, '16:00');
    g.missions.setLeg(1, 560, 520); // garage is 40 m away from the room door
    // Safe inside the garage: no APD units on the board.
    g.police.units.forEach((u) => { u.active = false; u.car.visible = false; });
    g.police.heli.visible = false;
    g.mode = 'garage';
    g.garage.openMenu(g);
    g.flashDialogue('BAYU', "Fresh paint, full tank, zero dents. She's ready for the night.", 999);
  }
  g.hud.update(g);
}
