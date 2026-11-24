// ARUNIKA: Golden Hour — config.js
// One source of truth for the island: its roads, districts, jobs, crew,
// weapons and radio. The world geometry and the minimap both read these
// tables, so the map the player sees is the city the player drives.
export const WORLD = {
  size: 680,
  half: 340,
  seaX: 340,
  beachX: 290,
};

export const DISTRICTS = [
  { name: 'Pantai Arunika', x: 290, z: 0, w: 110, d: 680, kind: 'beach' },
  { name: 'Kumala Pier', x: 290, z: -290, w: 120, d: 120, kind: 'pier' },
  { name: 'Marina Row', x: 100, z: 220, w: 380, d: 200, kind: 'marina' },
  { name: 'Pasar District', x: -140, z: 0, w: 240, d: 260, kind: 'market' },
  { name: 'Old Town', x: -140, z: -220, w: 240, d: 220, kind: 'old' },
];

// North-south avenues and east-west streets. Every road is a dark asphalt
// strip; buildings sit in the blocks between them.
export const AVENUES = [-260, -140, -20, 100, 220, 290];
export const STREETS = [-260, -140, -20, 100, 220];
export const ROAD_W = 14;

export const GARAGE_POS = { x: 100, z: 236 };

// 10 story jobs. Each job is 4 stages; a stage is one waypoint leg.
export const JOBS = [
  { id: 1, title: 'FIRST FARE', blurb: 'Pick up Sari at the pier and drive her to Marina Row.', target: [100, 220], time: 150, speaker: 'SARI', line: 'First fare of the night. Drive smooth and the APD stays bored.' },
  { id: 2, title: 'COURIER RUN', blurb: 'Deliver the package to Kumala Pier before the clock runs out.', target: [290, -290], time: 48, speaker: 'SARI', line: "He's making for Kumala Pier! Cut off the Regent before it reaches the water!" },
  { id: 3, title: 'HOT WHEELS', blurb: 'Lose the APD tail, then bring the GT to the garage.', target: [100, 236], time: 150, speaker: 'BAYU', line: "Fresh paint, full tank, zero dents. She's ready for the night." },
  { id: 4, title: 'STREET KINGS', blurb: 'Win the midnight street race at Marina Row.', target: [100, 220], time: 120, speaker: 'BAYU', line: "The race is on! Keep the pedal down and don't let the APD box you in!" },
  { id: 5, title: 'PIER LIGHTS', blurb: 'Photograph the Regent at the pier, then vanish.', target: [290, -290], time: 180, speaker: 'LIA', line: 'Eyes on the pier. The Regent parks under the second lamp, every night.' },
  { id: 6, title: 'MARKET RUN', blurb: 'Pick up the goods in Pasar District and avoid the patrols.', target: [-140, 0], time: 135, speaker: 'LIA', line: 'The drop is two blocks down, past the market stalls. Stay casual.' },
  { id: 7, title: 'OLD TOWN HEAT', blurb: 'Outrun the heat through Old Town without a scratch.', target: [-140, -220], time: 120, speaker: 'SARI', line: 'Old Town is a maze. Use it. They hate the tight corners.' },
  { id: 8, title: 'GOLDEN HOUR', blurb: 'Escort the convoy down the beach boulevard at sunset.', target: [290, 100], time: 150, speaker: 'BAYU', line: 'Golden hour on the boulevard. Best light in Leonida, worst place to hide.' },
  { id: 9, title: 'MARINA HEIST', blurb: 'Lift the yacht keys from Marina Row and get clear.', target: [100, 220], time: 120, speaker: 'LIA', line: 'Keys are on the third berth. In and out, no fireworks.' },
  { id: 10, title: 'ISLE OF EMBERS', blurb: 'One last run: the whole island is watching. Finish it.', target: [290, -290], time: 180, speaker: 'SARI', line: 'Last job, Raka. Drive like the island is yours — because tonight it is.' },
];

export const CREW = [
  { key: 'Z', name: 'SARI', role: 'Driver', ability: 'SWAP PLATES', desc: 'Drop 1 wanted star', cooldown: 30 },
  { key: 'X', name: 'BAYU', role: 'Mechanic', ability: 'QUICK FIX', desc: 'Repair car 100%', cooldown: 30 },
  { key: 'C', name: 'LIA', role: 'Lookout', ability: 'EYES OUT', desc: 'Police on minimap 25 s', cooldown: 30 },
];

export const WEAPONS = [
  { name: 'FISTS', ammo: Infinity, locked: false },
  { name: '.38', ammo: 60, locked: false },
  { name: 'SMG', ammo: 120, locked: false },
  { name: 'AR-9', ammo: 90, locked: false },
  { name: 'GATOR', ammo: 40, locked: true, unlockRp: 1000 },
  { name: 'RPG', ammo: 6, locked: true, unlockRp: 2000 },
];

export const RADIO = [
  { name: 'SURYA 101.5 FM', genre: 'Island Pop', song: 'Neon Tide — DJ Ombak', bpm: 112, root: 220 },
  { name: 'MANGO 98.6 FM', genre: 'Sunset Reggae', song: 'Guava Sunrise — Tía Rosa', bpm: 76, root: 196 },
  { name: 'NEON 107.9 FM', genre: 'Night Drive', song: 'Midnight Run — Kiki', bpm: 128, root: 246 },
];

export const PAINTS = [
  { name: 'SUNSET ORANGE', color: 0xff7a1a },
  { name: 'CORAL RED', color: 0xe63946 },
  { name: 'LAGOON BLUE', color: 0x2a9d8f },
  { name: 'PALM GREEN', color: 0x43aa5b },
  { name: 'BANANA YELLOW', color: 0xffd60a },
  { name: 'MIDNIGHT', color: 0x1b263b },
];

export const RANKS = [
  { rp: 0, name: 'STREET' },
  { rp: 700, name: 'HUSTLER' },
  { rp: 1200, name: 'FIXER' },
  { rp: 2000, name: 'KINGPIN' },
  { rp: 3000, name: 'LEGEND' },
];

export function rankFor(rp) {
  let r = RANKS[0];
  for (const k of RANKS) if (rp >= k.rp) r = k;
  return r.name;
}
