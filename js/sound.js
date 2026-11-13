(() => {
  const BF = (window.BallFight = window.BallFight || {});

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    playCharge(duration = 0.5) {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + duration * 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    playWallBounce() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.045);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    playBallHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    }

    playCritHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const notes = [330, 523.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.035;
        osc.type = i === 0 ? "square" : "triangle";
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, start + 0.14);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.17);
      });
    }

    playKO() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    playTimeStop() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      // 1. Resonant Za Warudo frequency dive & deep bass warp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.36);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);

      // 2. High resonant ringing sweep
      const sweep = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweep.type = "sine";
      sweep.frequency.setValueAtTime(800, now + 0.05);
      sweep.frequency.exponentialRampToValueAtTime(1400, now + 0.26);
      sweep.frequency.exponentialRampToValueAtTime(280, now + 0.52);

      sweepGain.gain.setValueAtTime(0.001, now + 0.05);
      sweepGain.gain.exponentialRampToValueAtTime(0.12, now + 0.25);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      sweep.connect(sweepGain);
      sweepGain.connect(this.ctx.destination);
      sweep.start(now + 0.05);
      sweep.stop(now + 0.6);

      // 3. Ticking clock clicks that decelerate and freeze
      for (let i = 0; i < 4; i++) {
        const tickTime = now + 0.12 + i * (0.07 + i * 0.035);
        const tickOsc = this.ctx.createOscillator();
        const tickGain = this.ctx.createGain();
        tickOsc.type = "triangle";
        tickOsc.frequency.setValueAtTime(900 - i * 85, tickTime);
        tickGain.gain.setValueAtTime(0.08, tickTime);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.035);
        tickOsc.connect(tickGain);
        tickGain.connect(this.ctx.destination);
        tickOsc.start(tickTime);
        tickOsc.stop(tickTime + 0.04);
      }
    }

    playTimeResume() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      // High glass snap & unfreeze harmonic chord
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.02 + 0.18);
        gain.gain.setValueAtTime(0.11, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.23);
      });
    }

    playKnifeThrow() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(860, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.075);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    }

    playKnifeHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    playMudaRush() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.04);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.045);
      }
    }
  }

  BF.SoundEngine = SoundEngine;
})();

