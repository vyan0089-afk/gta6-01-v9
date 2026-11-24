// ARUNIKA: Golden Hour — save.js
// Save / load through localStorage. One slot, F5 to save, Continue on the
// start screen when a save exists. Guarded: headless runs never throw.
const KEY = 'arunika-golden-hour-save-v1';

export function saveGame(g) {
  try {
    const data = {
      money: g.money, rp: g.rp, jobIndex: g.missions.jobIndex,
      carColor: g.playerCar.userData.color, px: g.px, pz: g.pz,
      heading: g.heading, radio: g.audio.station,
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

export function hasSave() {
  try { return localStorage.getItem(KEY) !== null; } catch (e) { return false; }
}
