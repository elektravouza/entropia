// ============================================================
// ENTROPIA — procedural beach audio
// No audio files: the ocean is synthesized live with the
// Web Audio API (filtered noise + slow swell LFOs), and UI
// sounds are tiny oscillator blips. Zero downloads, all vibe.
// ============================================================

export class Beach {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = false;
  }

  // must be called from a user gesture (browser autoplay rules)
  start() {
    if (this.ctx) {
      this.ctx.resume();
      this.fadeTo(0.5);
      this.enabled = true;
      return;
    }

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);

    // ---- looping noise buffer (the raw "sea") ----
    const seconds = 4;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * seconds, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // brown-ish noise: deeper and softer than white noise
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    // two wave layers with different swell speeds = natural surf
    this.makeWaveLayer(buffer, 0.07, 420, 0.5);
    this.makeWaveLayer(buffer, 0.046, 700, 0.35);

    this.fadeTo(0.5);
    this.enabled = true;
  }

  makeWaveLayer(buffer, swellHz, filterHz, level) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterHz;
    filter.Q.value = 0.4;

    const swell = this.ctx.createGain();
    swell.gain.value = level * 0.6;

    // LFO breathes the gain up and down like waves arriving
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = swellHz;
    const lfoAmp = this.ctx.createGain();
    lfoAmp.gain.value = level * 0.4;
    lfo.connect(lfoAmp);
    lfoAmp.connect(swell.gain);

    src.connect(filter);
    filter.connect(swell);
    swell.connect(this.master);

    src.start();
    lfo.start();
  }

  fadeTo(v) {
    if (!this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(v, t, 0.8);
  }

  mute() {
    this.fadeTo(0);
    this.enabled = false;
  }

  toggle() {
    this.enabled ? this.mute() : this.start();
    return this.enabled;
  }

  // little champagne-bubble blip for clicks/flips
  blip(freq = 720) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.09);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // celebratory little arpeggio for the RSVP submit
  fanfare() {
    if (!this.ctx || !this.enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.blip(f), i * 90);
    });
  }
}
