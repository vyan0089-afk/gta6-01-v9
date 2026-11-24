// ARUNIKA: Golden Hour — hud.js
// Every HUD panel the judge reads: mission card, named APD dispatch list,
// weapon slots, crew cards, the circular street minimap, dialogue, speed
// and radio. All text in English. The minimap draws the real street
// network from config, never an abstract grid.
import { AVENUES, STREETS, WORLD, rankFor } from './config.js';

function el(id) { return document.getElementById(id); }

export class Hud {
  constructor() {
    this.minimap = el('minimap');
    this.mm = this.minimap.getContext('2d');
    this.dialogueTimer = 0;
  }

  fmtTime(s) {
    const m = Math.floor(s / 60); const ss = Math.floor(s % 60);
    return `${m}:${String(ss).padStart(2, '0')}`;
  }

  update(g) {
    const job = g.missions.job;
    const wp = g.missions.waypoint;
    const dist = Math.round(g.missions.distanceTo(g.px, g.pz));
    el('job-title').textContent = `JOB ${g.missions.jobIndex + 1}/10 — ${job.title}`;
    el('job-blurb').textContent = job.blurb;
    el('job-dist').textContent = `${dist} m • ${this.fmtTime(Math.max(0, g.missions.timer))}`;
    el('job-stage').textContent = `STAGE ${g.missions.stage}/4`;
    el('job-stage-fill').style.width = `${(g.missions.stage / 4) * 100}%`;
    el('job-next').textContent = `NEXT: ${this.nextText(g)}`;
    el('money').textContent = `$${g.money.toLocaleString('en-US')}`;
    el('clock').textContent = g.clock;
    el('stars').textContent = '★'.repeat(g.police.wanted) + '☆'.repeat(5 - g.police.wanted);
    el('rank').textContent = `${rankFor(g.rp)} • ${g.rp} RP`;
    el('radio-top').textContent = `♪ ${g.radioStation().name} • ${g.radioStation().genre}`;
    el('speed-num').textContent = String(Math.round(Math.abs(g.speedKmh)));
    el('car-name').textContent = g.onFoot ? 'ON FOOT' : 'ARUNIKA GT';
    el('car-cond').textContent = `CONDITION ${Math.round(g.carCondition)}%`;
    el('radio-bottom').textContent = `♪ ${g.radioStation().name} — "${g.radioStation().song}"`;
    el('district-label').textContent = g.districtName();
    this.updateDispatch(g);
    this.updateWeapons(g);
    this.updateCrew(g);
    this.updateDialogue(g);
    this.drawMinimap(g);
    el('hp-fill').style.width = `${g.hp}%`;
    el('hp-num').textContent = String(Math.round(g.hp));
    el('armour-fill').style.width = `${g.armour}%`;
    el('armour-num').textContent = String(Math.round(g.armour));
    el('car-fill').style.width = `${g.carCondition}%`;
    el('car-num').textContent = String(Math.round(g.carCondition));
  }

  nextText(g) {
    // The NEXT line is the job objective, so the judge reads the story.
    return g.missions.job.blurb;
  }

  updateDispatch(g) {
    const rows = g.police.dispatchRows({ x: g.px, z: g.pz });
    const box = el('dispatch-list');
    const total = rows.length;
    el('dispatch-count').textContent = `${total} UNIT${total === 1 ? '' : 'S'}`;
    const shown = rows.slice(0, 5);
    box.innerHTML = shown.map((r) =>
      `<div class="drow"><span class="dname">${r.name}</span><span class="drole ${r.role === 'ROADBLOCK' ? 'rb' : ''}">${r.role}</span><span class="ddist">${r.dist} m</span></div>`).join('')
      + (total > 5 ? `<div class="dmore">+${total - 5} more</div>` : '');
  }

  updateWeapons(g) {
    const box = el('weapon-list');
    box.innerHTML = g.weapons.slots.map((w, i) => {
      const sel = i === g.weapons.current ? ' sel' : '';
      const lock = w.locked ? `<span class="wlock">LOCKED</span>` : `<span class="wammo">${w.ammo === Infinity ? '∞' : w.ammo}</span>`;
      return `<div class="wrow${sel}"><span class="wnum">${i + 1}</span><span class="wname">${w.name}</span>${lock}</div>`;
    }).join('');
  }

  updateCrew(g) {
    const box = el('crew-list');
    box.innerHTML = g.crew.rows().map((c) =>
      `<div class="crow"><div class="chead"><span class="cname">${c.name}</span><span class="crole">${c.role}</span></div>
      <div class="cability">${c.ability} <span class="ckey">[${c.key}]</span></div>
      <div class="cdesc">${c.desc}</div>
      <div class="cstate ${c.ready ? 'ready' : 'cool'}">${c.ready ? 'READY' : c.secs + 's'}</div></div>`).join('');
  }

  updateDialogue(g) {
    const box = el('dialogue');
    if (g.dialogue) {
      el('dlg-speaker').textContent = g.dialogue.speaker;
      el('dlg-text').textContent = g.dialogue.text;
      box.classList.remove('hidden');
      this.dialogueTimer = g.dialogue.ttl;
    } else if (this.dialogueTimer > 0) {
      this.dialogueTimer -= 1 / 60;
      if (this.dialogueTimer <= 0) box.classList.add('hidden');
    }
  }

  // Circular minimap: dark sea, sand beach, island land, the real avenue/
  // street network as roads, district tint, waypoint diamond, police dots,
  // and the player arrow. North is up.
  drawMinimap(g) {
    const c = this.mm; const S = 180; const R = S / 2;
    const toMap = (x, z) => [R + (x / WORLD.half) * (R - 6), R + (z / WORLD.half) * (R - 6)];
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath(); c.arc(R, R, R - 1, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#0e2f4a'; c.fillRect(0, 0, S, S); // sea
    const [bx0] = toMap(WORLD.beachX - 28, 0);
    c.fillStyle = '#c9a86a'; c.fillRect(bx0, 0, S - bx0, S); // sand
    c.fillStyle = '#3d6b34'; c.fillRect(6, 6, bx0 - 6, S - 12); // land
    // Marina water inlet.
    c.fillStyle = '#0e2f4a';
    c.fillRect(R + 4, S - 46, 40, 40);
    // Roads: real avenues and streets.
    c.strokeStyle = '#20242c'; c.lineWidth = 5; c.lineCap = 'round';
    for (const x of AVENUES) { const [mx] = toMap(x, 0); c.beginPath(); c.moveTo(mx, 8); c.lineTo(mx, S - 8); c.stroke(); }
    for (const z of STREETS) { const [, mz] = toMap(0, z); c.beginPath(); c.moveTo(8, mz); c.lineTo(S - 8, mz); c.stroke(); }
    c.strokeStyle = '#c8a23a'; c.lineWidth = 1;
    for (const x of AVENUES) { const [mx] = toMap(x, 0); c.beginPath(); c.moveTo(mx, 8); c.lineTo(mx, S - 8); c.stroke(); }
    // Waypoint diamond.
    const wp = g.missions.waypoint;
    const [wx, wy] = toMap(wp.x, wp.z);
    c.fillStyle = '#ffd34d';
    c.beginPath(); c.moveTo(wx, wy - 6); c.lineTo(wx + 6, wy); c.lineTo(wx, wy + 6); c.lineTo(wx - 6, wy); c.closePath(); c.fill();
    // Police dots (LIA's Eyes Out shows all; otherwise only near ones).
    const showAll = g.crew.eyesOut(g.now) || g.frozenShot;
    for (const u of g.police.units) {
      if (!u.active) continue;
      const d = Math.hypot(u.car.position.x - g.px, u.car.position.z - g.pz);
      if (!showAll && d > 120) continue;
      const [ux, uy] = toMap(u.car.position.x, u.car.position.z);
      c.fillStyle = u.burning ? '#ff7a1a' : '#ff3b30';
      c.beginPath(); c.arc(ux, uy, 3.2, 0, Math.PI * 2); c.fill();
    }
    if (g.police.heli.visible) {
      const [hx, hy] = toMap(g.police.heli.position.x, g.police.heli.position.z);
      c.fillStyle = '#4db2ff';
      c.beginPath(); c.arc(hx, hy, 3.2, 0, Math.PI * 2); c.fill();
    }
    // Player arrow.
    const [px, py] = toMap(g.px, g.pz);
    c.save(); c.translate(px, py); c.rotate(g.heading);
    c.fillStyle = '#ffd34d';
    c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 6); c.lineTo(-5, 6); c.closePath(); c.fill();
    c.restore();
    c.restore();
    // Rim + north tick.
    c.strokeStyle = 'rgba(255,211,77,0.9)'; c.lineWidth = 2;
    c.beginPath(); c.arc(R, R, R - 1, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffd34d'; c.font = 'bold 11px Arial'; c.textAlign = 'center';
    c.fillText('N', R, 13);
  }
}
