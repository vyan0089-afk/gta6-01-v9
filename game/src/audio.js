// ARUNIKA: Golden Hour — audio.js
// Everything is synthesised with WebAudio: engine hum, three radio
// stations (different scales and tempos), and a two-tone police siren.
// No audio files. Every call is guarded so a headless run never throws.
import { RADIO } from './config.js';

export class AudioEngine {
  constructor() {
    this.ctx = null; this.station = 0; this.engineOsc = null;
    this.engineGain = null; this.radioTimer = null; this.sirenOsc = null;
    this.muted = false; this.step = 0;
  }

  ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 55;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineGain); this.engineGain.connect(this.master);
      this.engineOsc.start();
      return true;
    } catch (e) { return false; }
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') { this.ctx.resume().catch(() => {}); } }

  setEngine(speedKmh, onFoot) {
    if (!this.ctx || !this.engineOsc) return;
    const target = onFoot ? 0 : 0.05 + Math.min(0.22, Math.abs(speedKmh) / 700);
    this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    this.engineOsc.frequency.setTargetAtTime(48 + Math.abs(speedKmh) * 1.1, this.ctx.currentTime, 0.1);
  }

  // A tiny step sequencer: one note every beat from a pentatonic scale.
  radioTick() {
    if (!this.ctx || this.muted) return;
    const st = RADIO[this.station];
    const scale = [0, 3, 5, 7, 10, 12, 15];
    const seq = [0, 2, 4, 3, 5, 4, 2, 6, 0, 3, 5, 2];
    const note = seq[this.step % seq.length];
    const f = st.root * Math.pow(2, scale[note % scale.length] / 12);
    try {
      const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      o.connect(g); g.connect(this.master);
      o.start(); o.stop(this.ctx.currentTime + 0.55);
    } catch (e) { /* headless: ignore */ }
    this.step++;
  }

  startRadio() {
    if (this.radioTimer) return;
    const beat = () => {
      this.radioTick();
      const st = RADIO[this.station];
      this.radioTimer = setTimeout(beat, 60000 / st.bpm / 2);
    };
    beat();
  }

  nextStation() {
    this.station = (this.station + 1) % RADIO.length;
    this.step = 0;
    return RADIO[this.station];
  }

  setSiren(on) {
    if (!this.ctx) return;
    try {
      if (on && !this.sirenOsc) {
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sine'; this.sirenOsc.frequency.value = 700;
        const g = this.ctx.createGain(); g.gain.value = 0.05;
        this.sirenOsc.connect(g); g.connect(this.master);
        this.sirenOsc.start();
        const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.6;
        const lg = this.ctx.createGain(); lg.gain.value = 220;
        lfo.connect(lg); lg.connect(this.sirenOsc.frequency); lfo.start();
        this.sirenLfo = lfo;
      } else if (!on && this.sirenOsc) {
        this.sirenOsc.stop(); this.sirenLfo.stop();
        this.sirenOsc = null; this.sirenLfo = null;
      }
    } catch (e) { /* ignore */ }
  }
}
