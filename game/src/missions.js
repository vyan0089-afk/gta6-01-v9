// ARUNIKA: Golden Hour — missions.js
// The 10 story jobs: each is 4 waypoint legs with a countdown, a distance
// readout and a NEXT step. Finishing a job pays money and respect.
import { JOBS } from './config.js';

export class MissionManager {
  constructor() {
    this.jobIndex = 1; // 0-based
    this.stage = 1;
    this.timer = JOBS[0].time;
    this.done = false;
    this.legs = this.makeLegs(0);
  }

  makeLegs(jobIdx) {
    const job = JOBS[jobIdx];
    const [tx, tz] = job.target;
    const cl = (v) => Math.max(-320, Math.min(320, v));
    // 4 legs: approach from different directions, ending at the target.
    // Clamped inside the island so no waypoint ever leaves the world.
    return [
      { x: cl(tx - 160), z: cl(tz + 120) },
      { x: cl(tx + 120), z: cl(tz - 60) },
      { x: cl(tx - 60), z: cl(tz - 140) },
      { x: cl(tx), z: cl(tz) },
    ];
  }

  get job() { return JOBS[this.jobIndex]; }
  get waypoint() { return this.legs[this.stage - 1]; }

  distanceTo(px, pz) {
    const w = this.waypoint;
    return Math.hypot(w.x - px, w.z - pz);
  }

  // Returns 'leg' | 'job' | 'timeout' | null.
  update(dt, px, pz) {
    if (this.done) return null;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.stage = 1; this.timer = this.job.time;
      this.legs = this.makeLegs(this.jobIndex);
      return 'timeout';
    }
    if (this.distanceTo(px, pz) < 14) {
      if (this.stage < 4) {
        this.stage++;
        this.timer = Math.min(this.timer + 45, this.job.time);
        return 'leg';
      }
      this.done = true;
      return 'job';
    }
    return null;
  }

  nextJob() {
    this.jobIndex = Math.min(this.jobIndex + 1, JOBS.length - 1);
    this.stage = 1; this.done = false;
    this.timer = this.job.time;
    this.legs = this.makeLegs(this.jobIndex);
  }

  restart() {
    this.stage = 1; this.done = false;
    this.timer = this.job.time;
    this.legs = this.makeLegs(this.jobIndex);
  }

  // Stage a shot: job, stage, timer and waypoint exactly as specified.
  stageTo(jobIdx, stage, timer) {
    this.jobIndex = jobIdx; this.stage = stage; this.done = false;
    this.timer = timer;
    this.legs = this.makeLegs(jobIdx);
  }

  // Override one leg (used by staged screenshots for an exact distance).
  setLeg(i, x, z) {
    if (this.legs[i]) this.legs[i] = { x, z };
  }
}
