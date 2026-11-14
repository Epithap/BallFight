// Per-skill / per-ultimate sound design, UI and gacha sounds (pure WebAudio synth, no assets)
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const P = BF.SoundEngine.prototype;

  P._ok = function () { return this.enabled && this.ctx && this.ctx.state === "running"; };

  P._tone = function ({ type = "sine", f0, f1, dur, vol = 0.1, t0 = 0, attack = 0.005 }) {
    const c = this.ctx, now = c.currentTime + t0;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(c.destination);
    o.start(now); o.stop(now + dur + 0.03);
  };

  P._noise = function ({ dur, vol = 0.1, t0 = 0, ftype = "lowpass", f0 = 2000, f1, q = 1, attack = 0.005 }) {
    const c = this.ctx, now = c.currentTime + t0;
    if (!this._nbuf) {
      this._nbuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this._nbuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this._nbuf; src.loop = true;
    f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, now);
    if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(now); src.stop(now + dur + 0.03);
  };

  const R = {
    kame() {
      this._noise({ dur: 0.55, vol: 0.09, ftype: "highpass", f0: 400, f1: 4200 });
      this._tone({ type: "sawtooth", f0: 72, f1: 44, dur: 0.7, vol: 0.13 });
      this._tone({ f0: 500, f1: 1250, dur: 0.35, vol: 0.05 });
    },
    shuriken() {
      for (let i = 0; i < 6; i++) this._tone({ type: "sawtooth", f0: 700 + i * 170, f1: 900 + i * 170, dur: 0.09, vol: 0.05, t0: i * 0.05 });
      this._noise({ dur: 0.55, vol: 0.08, ftype: "bandpass", f0: 1500, f1: 4200, q: 4 });
    },
    rasengan() {
      this._tone({ type: "triangle", f0: 300, f1: 950, dur: 0.35, vol: 0.09 });
      this._noise({ dur: 0.35, vol: 0.08, ftype: "bandpass", f0: 900, f1: 2600, q: 6 });
    },
    pistol() {
      this._noise({ dur: 0.16, vol: 0.15, f0: 3200, f1: 200 });
      this._tone({ f0: 170, f1: 50, dur: 0.22, vol: 0.2 });
    },
    rubber() {
      this._tone({ type: "square", f0: 180, f1: 720, dur: 0.22, vol: 0.05 });
      this._tone({ type: "square", f0: 720, f1: 90, dur: 0.12, vol: 0.08, t0: 0.22 });
    },
    purple() {
      this._tone({ f0: 55, f1: 35, dur: 1.0, vol: 0.22 });
      this._tone({ type: "sawtooth", f0: 220, f1: 880, dur: 0.8, vol: 0.06 });
      this._noise({ dur: 0.9, vol: 0.12, f0: 1200, f1: 100 });
    },
    getsuga() {
      this._noise({ dur: 0.26, vol: 0.12, ftype: "highpass", f0: 4000, f1: 900 });
      this._tone({ type: "sawtooth", f0: 900, f1: 160, dur: 0.3, vol: 0.08 });
      this._tone({ f0: 70, f1: 40, dur: 0.35, vol: 0.12, t0: 0.05 });
    },
    red() {
      this._tone({ type: "square", f0: 90, f1: 60, dur: 0.3, vol: 0.12 });
      this._noise({ dur: 0.25, vol: 0.1, ftype: "bandpass", f0: 2000, q: 8 });
    },
    blue() {
      this._tone({ f0: 700, f1: 140, dur: 0.45, vol: 0.1 });
      this._tone({ f0: 706, f1: 143, dur: 0.45, vol: 0.07 });
    },
    voidd() {
      for (const f of [220, 233, 311]) this._tone({ f0: f, f1: f * 0.9, dur: 0.9, vol: 0.05 });
      this._noise({ dur: 0.9, vol: 0.06, ftype: "highpass", f0: 3000 });
    },
    barrage() {
      for (let i = 0; i < 6; i++) {
        this._noise({ dur: 0.05, vol: 0.12, ftype: "bandpass", f0: 900, q: 2, t0: i * 0.08 });
        this._tone({ f0: 130, f1: 60, dur: 0.07, vol: 0.12, t0: i * 0.08 });
      }
    },
    dragon() {
      this._noise({ dur: 0.26, vol: 0.1, ftype: "bandpass", f0: 600, f1: 2400, q: 2 });
      this._tone({ type: "triangle", f0: 140, f1: 70, dur: 0.2, vol: 0.12 });
    },
    slayer() {
      for (const f of [220, 331, 523]) this._tone({ f0: f, dur: 0.55, vol: 0.07 });
      this._noise({ dur: 0.07, vol: 0.14, ftype: "bandpass", f0: 2500, q: 2 });
      this._tone({ f0: 80, f1: 40, dur: 0.3, vol: 0.25 });
    },
    dismantle() {
      for (let i = 0; i < 3; i++) {
        this._noise({ dur: 0.1, vol: 0.12, ftype: "highpass", f0: 5200, f1: 1800, t0: i * 0.07 });
        this._tone({ type: "sawtooth", f0: 1500 - i * 150, f1: 380, dur: 0.12, vol: 0.06, t0: i * 0.07 });
      }
    },
    cleave() {
      this._noise({ dur: 0.18, vol: 0.14, ftype: "highpass", f0: 4200, f1: 900 });
      this._tone({ type: "sawtooth", f0: 1100, f1: 150, dur: 0.22, vol: 0.09 });
      this._tone({ f0: 95, f1: 45, dur: 0.25, vol: 0.2, t0: 0.08 });
    },
    fuga() {
      this._noise({ dur: 0.7, vol: 0.11, ftype: "bandpass", f0: 500, f1: 3200, q: 1.2 });
      this._tone({ type: "sawtooth", f0: 110, f1: 330, dur: 0.6, vol: 0.1 });
      this._tone({ f0: 55, f1: 30, dur: 0.8, vol: 0.2, t0: 0.15 });
    },
    shrine() {
      for (const f of [147, 196, 233]) this._tone({ type: "triangle", f0: f, f1: f * 0.85, dur: 0.8, vol: 0.06 });
      this._noise({ dur: 0.35, vol: 0.12, ftype: "highpass", f0: 3500, f1: 1200 });
      this._tone({ f0: 70, f1: 38, dur: 0.5, vol: 0.18, t0: 0.05 });
    },
    def() { this._tone({ type: "square", f0: 500, f1: 250, dur: 0.09, vol: 0.05 }); },
  };

  const MATCH = [
    [/DISMANTLE/, "dismantle"], [/CLEAVE/, "cleave"], [/FUGA|DIVINE FLAME/, "fuga"], [/SHRINE/, "shrine"],
    [/KAMEHAMEHA/, "kame"], [/RASENSHURIKEN/, "shuriken"], [/RASENGAN/, "rasengan"], [/PISTOL/, "pistol"],
    [/GOMU|ROCKET|BOUNCE|SNAKE/, "rubber"], [/PURPLE/, "purple"], [/GETSUGA|HOLLOW/, "getsuga"],
    [/\bRED\b/, "red"], [/\bBLUE\b/, "blue"], [/VOID|SIX EYES/, "voidd"], [/ORA|MUDA|BARRAGE/, "barrage"],
    [/DRAGON|KICK|RUSH/, "dragon"], [/SLAYER|SAVAGE|RAMPAGE|BERSERK/, "slayer"],
    [/NARUKAMI|ECHO|WHIRLWIND|GODSPEED/, "shuriken"], [/MUTILATE|IGRIS|BERU|RULER/, "cleave"],
    [/RIP|CHAIN|VROOM/, "slayer"], [/FANG|NUCLEAR|WATER STREAM|GAMMA/, "dragon"],
  ];

  P.playSkill = function (label) {
    if (!this._ok()) return;
    const L = String(label).toUpperCase();
    if (/WARUDO|THE WORLD|TIME|KNIFE|KNIVES/.test(L)) return; // dedicated sounds exist
    let key = "def";
    for (const [re, k] of MATCH) if (re.test(L)) { key = k; break; }
    const now = performance.now() / 1000;
    this._lastSkill = this._lastSkill || {};
    if (now - (this._lastSkill[key] || 0) < 0.35) return;
    this._lastSkill[key] = now;
    R[key].call(this);
  };

  const ULT = {
    kaioken() {
      this._tone({ type: "sawtooth", f0: 60, f1: 180, dur: 0.9, vol: 0.14 });
      this._noise({ dur: 0.9, vol: 0.1, f0: 300, f1: 2500 });
      this._tone({ f0: 800, f1: 1600, dur: 0.4, vol: 0.05, t0: 0.3 });
    },
    gear_4() {
      for (let i = 0; i < 3; i++) this._tone({ f0: 260, f1: 110, dur: 0.12, vol: 0.16, t0: i * 0.15 });
      this._tone({ f0: 90, f1: 40, dur: 0.4, vol: 0.22, t0: 0.5 });
    },
    rasenshuriken() {
      for (let i = 0; i < 7; i++) this._tone({ f0: 500 + i * 130, dur: 0.25, vol: 0.05, t0: i * 0.1 });
      this._noise({ dur: 0.9, vol: 0.06, ftype: "bandpass", f0: 1200, f1: 3500, q: 3 });
    },
    hollow_mask() {
      this._tone({ type: "sawtooth", f0: 1000, f1: 180, dur: 0.8, vol: 0.1 });
      this._tone({ f0: 50, dur: 1.0, vol: 0.2, t0: 0.1 });
      this._noise({ dur: 0.7, vol: 0.07, ftype: "highpass", f0: 2500 });
    },
    berserker_armor() {
      for (let i = 0; i < 3; i++) this._tone({ f0: 55, f1: 40, dur: 0.25, vol: 0.25, t0: i * 0.3 });
      this._tone({ type: "sawtooth", f0: 110, dur: 1.1, vol: 0.07 });
      this._tone({ type: "sawtooth", f0: 117, dur: 1.1, vol: 0.07 });
    },
    fuga() {
      for (const f of [196, 294, 392]) this._tone({ type: "sawtooth", f0: f, f1: f * 2, dur: 1.0, vol: 0.05 });
      this._noise({ dur: 0.9, vol: 0.09, ftype: "bandpass", f0: 400, f1: 3600, q: 1.5 });
      this._tone({ f0: 50, dur: 1.1, vol: 0.2, t0: 0.1 });
    },
    hollow_purple() {
      for (const f of [880, 1320, 1760, 2640]) this._tone({ f0: f, dur: 1.2, vol: 0.045 });
      this._noise({ dur: 0.8, vol: 0.06, ftype: "highpass", f0: 2000, f1: 6000 });
    },
    godspeed() {
      for (let i = 0; i < 6; i++) this._tone({ type: "sawtooth", f0: 900 + i * 220, f1: 1800, dur: 0.14, vol: 0.06, t0: i * 0.07 });
      this._noise({ dur: 0.75, vol: 0.09, ftype: "highpass", f0: 2800, f1: 6500 });
    },
    arise() {
      for (const f of [110, 146.8, 220]) this._tone({ type: "sawtooth", f0: f, f1: f * 0.75, dur: 1.0, vol: 0.08 });
      this._noise({ dur: 0.85, vol: 0.08, ftype: "bandpass", f0: 600, f1: 1800, q: 2 });
    },
    hero_of_hell() {
      for (let i = 0; i < 4; i++) this._tone({ type: "sawtooth", f0: 85 + i * 25, f1: 240, dur: 0.22, vol: 0.12, t0: i * 0.14 });
      this._noise({ dur: 0.9, vol: 0.11, ftype: "bandpass", f0: 800, f1: 3200, q: 1.8 });
    },
    cosmic_fear() {
      for (const f of [220, 330, 440, 660]) this._tone({ type: "triangle", f0: f, f1: f * 1.5, dur: 0.95, vol: 0.06 });
      this._noise({ dur: 0.85, vol: 0.09, ftype: "highpass", f0: 1600, f1: 5200 });
    },
  };

  P.playUlt = function (id) {
    if (!this._ok()) return;
    if (ULT[id]) ULT[id].call(this);
    else {
      this._tone({ type: "sawtooth", f0: 80, f1: 400, dur: 0.7, vol: 0.1 });
      this._noise({ dur: 0.7, vol: 0.07, f0: 400, f1: 3000 });
    }
  };

  // UI + gacha
  P.playUi = function () { if (this._ok()) this._tone({ type: "square", f0: 700, f1: 920, dur: 0.045, vol: 0.035 }); };
  P.playCoin = function () {
    if (!this._ok()) return;
    this._tone({ f0: 1200, dur: 0.08, vol: 0.06 });
    this._tone({ f0: 1700, dur: 0.14, vol: 0.06, t0: 0.07 });
  };
  P.gachaShake = function () {
    if (!this._ok()) return;
    for (let i = 0; i < 7; i++) {
      this._tone({ type: "triangle", f0: 190 - (i % 2) * 30, dur: 0.05, vol: 0.1, t0: i * 0.12 });
      this._noise({ dur: 0.04, vol: 0.05, ftype: "bandpass", f0: 1800, q: 3, t0: i * 0.12 });
    }
  };
  P.gachaPop = function () {
    if (!this._ok()) return;
    this._noise({ dur: 0.2, vol: 0.14, ftype: "highpass", f0: 1500, f1: 5000 });
    this._tone({ f0: 400, f1: 950, dur: 0.18, vol: 0.1 });
  };
  P.gachaReveal = function (rarity) {
    if (!this._ok()) return;
    const notes = { common: [523, 659], rare: [523, 659, 784], epic: [523, 659, 784, 1047], legend: [523, 659, 784, 1047, 1319, 1568] }[rarity] || [523, 659];
    notes.forEach((f, i) => this._tone({ type: "triangle", f0: f, dur: 0.28, vol: 0.09, t0: i * 0.08 }));
    if (rarity === "epic" || rarity === "legend") {
      this._tone({ f0: 70, f1: 40, dur: 0.6, vol: 0.2 });
      this._noise({ dur: 0.7, vol: 0.06, ftype: "highpass", f0: 3000 });
    }
  };
})();
