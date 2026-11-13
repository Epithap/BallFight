// Fighter gacha: Modern Rate-Up Splash Banner (1H rotation), 5% Rate-Up / 1.5% Off-Banner, Pity 100 & MUGEN Character Reveal FX
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const KEY = "bf_gacha_v2";
  const COSTS = { one: 160, ten: 1500, gem: 50 };
  const PITY = 100;
  const DUPE_GEMS = 50;
  const HOUR_MS = 3600 * 1000;

  // All characters are equal tier (no character rarity)
  const FIGHTERS = ["gojo", "sukuna", "guts", "dio", "jotaro"];
  const RATE_UP_CHANCE = 5.0;    // 5.0% featured Rate-Up character
  const OTHER_CHAR_CHANCE = 1.5; // 1.5% other characters (split equally)

  const PRIZES = [
    { type: "coins", amount: 20, tier: "common", label: "COMMON", w: 30.0 },
    { type: "coins", amount: 100, tier: "rare", label: "RARE", w: 13.5 },
    { type: "coins", amount: 250, tier: "epic", label: "EPIC", w: 5.0 },
    { type: "gems", amount: 1, tier: "common", label: "COMMON", w: 28.0 },
    { type: "gems", amount: 5, tier: "rare", label: "RARE", w: 12.0 },
    { type: "gems", amount: 10, tier: "epic", label: "EPIC", w: 5.0 },
  ];

  // Per-character splash banner & MUGEN pull reveal themes
  const CHAR_THEMES = {
    gojo: {
      bg1: "#060919", bg2: "#17113c", bg3: "#2e1065",
      c1: "#38bdf8", c2: "#c084fc", c3: "#ff1e42",
      watermark: "UNLIMITED VOID",
      epithet: "SPECIAL GRADE • SIX EYES",
      ultTag: "HOLLOW PURPLE",
      battleCry: "HOLLOW PURPLE!!",
      quote: "THROUGHOUT HEAVEN AND EARTH, I ALONE AM THE HONORED ONE.",
      motif: "infinity",
    },
    sukuna: {
      bg1: "#110307", bg2: "#2d0710", bg3: "#450a0a",
      c1: "#ef4444", c2: "#f97316", c3: "#fef08a",
      watermark: "MALEVOLENT SHRINE",
      epithet: "KING OF CURSES • DISMANTLE",
      ultTag: "FUKUMA MIZUSHI",
      battleCry: "RYOIKI TENKAI: MALEVOLENT SHRINE!!",
      quote: "STAND PROUD. YOU ARE STRONG.",
      motif: "shrine",
    },
    dio: {
      bg1: "#120d03", bg2: "#2e2105", bg3: "#3b0764",
      c1: "#facc15", c2: "#a855f7", c3: "#fef08a",
      watermark: "THE WORLD • XI",
      epithet: "IMMORTAL VAMPIRE • TIME STOP",
      ultTag: "ZA WARUDO",
      battleCry: "ZA WARUDO! TOKI WO TOMARE!!",
      quote: "WRYYYYY! USELESS, USELESS, USELESS!",
      motif: "time",
    },
    jotaro: {
      bg1: "#09061a", bg2: "#1f1147", bg3: "#1e3a8a",
      c1: "#a855f7", c2: "#38bdf8", c3: "#facc15",
      watermark: "STAR PLATINUM",
      epithet: "STARDUST CRUSADER • XVII",
      ultTag: "ORA BARRAGE",
      battleCry: "ORA ORA ORA ORA ORA!!",
      quote: "YARE YARE DAZE... STAR PLATINUM!",
      motif: "star",
    },
    guts: {
      bg1: "#090406", bg2: "#26070c", bg3: "#3f0d12",
      c1: "#dc2626", c2: "#94a3b8", c3: "#f97316",
      watermark: "DRAGONSLAYER",
      epithet: "THE BLACK SWORDSMAN • BERSERKER",
      ultTag: "BERSERKER ARMOR",
      battleCry: "GRIFFIIIITH!!",
      quote: "STRUGGLE ON, BLACK SWORDSMAN.",
      motif: "eclipse",
    },
  };

  const RANK = { common: 0, rare: 1, epic: 2, fighter: 3 };
  const state = { pity: 0, total: 0 };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (_) {}
  const saveState = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };

  let deps = null, busy = false, ctl = null, lastHourSlot = -1;
  const $ = (id) => document.getElementById(id);
  const owned = (id) => deps.isUnlocked(id);

  function getHourSlot(now = Date.now()) {
    return Math.floor(now / HOUR_MS);
  }

  function getFeaturedId(now = Date.now()) {
    const slot = getHourSlot(now);
    return FIGHTERS[((slot % FIGHTERS.length) + FIGHTERS.length) % FIGHTERS.length];
  }

  function getRemainingTimeText(now = Date.now()) {
    const remMs = HOUR_MS - (now % HOUR_MS);
    const totalSec = Math.max(0, Math.floor(remMs / 1000));
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    return `NEXT: ${mm}:${ss}`;
  }

  function weighted(list) {
    let r = Math.random() * list.reduce((a, x) => a + x.w, 0);
    for (const x of list) if ((r -= x.w) < 0) return x;
    return list[list.length - 1];
  }

  // Roll a character following 5.0% Rate-Up vs 1.5% Off-Banner odds (used for both normal drops & Pity 100)
  function rollFighterByChance(featuredId) {
    const others = FIGHTERS.filter((id) => id !== featuredId);
    const otherEach = others.length ? OTHER_CHAR_CHANCE / others.length : 0;
    const pool = FIGHTERS.map((id) => ({
      id,
      w: id === featuredId ? RATE_UP_CHANCE : otherEach,
    }));
    return weighted(pool).id;
  }

  function rollOne() {
    state.total++;
    state.pity++;
    const featuredId = getFeaturedId();
    const isPityGuaranteed = state.pity >= PITY;

    let isChar = isPityGuaranteed;
    let prizePick = null;
    if (!isChar) {
      const roll = weighted([
        { type: "fighter", w: RATE_UP_CHANCE + OTHER_CHAR_CHANCE },
        ...PRIZES,
      ]);
      if (roll.type === "fighter") isChar = true;
      else prizePick = roll;
    }

    if (isChar) {
      state.pity = 0;
      const charId = rollFighterByChance(featuredId);
      const isRateUp = charId === featuredId;
      if (owned(charId)) {
        deps.wallet.gems += DUPE_GEMS;
        return { kind: "dupe", id: charId, tier: "fighter", isRateUp, gems: DUPE_GEMS };
      }
      deps.wallet.unlockedFighters.add(charId);
      return { kind: "fighter", id: charId, tier: "fighter", isRateUp };
    }

    deps.wallet[prizePick.type] += prizePick.amount;
    return { kind: prizePick.type, amount: prizePick.amount, tier: prizePick.tier, label: prizePick.label };
  }

  const wait = (ms) => new Promise((res) => {
    const done = () => { clearTimeout(id); res(); };
    const id = setTimeout(done, ms);
    ctl.cancel = done;
  });
  const tap = () => new Promise((res) => { ctl.tapRes = res; });

  function cardEl(r) {
    const el = document.createElement("div");
    el.className = `g-card rarity-${r.tier === "fighter" ? "legend" : r.tier}`;
    if (r.kind === "fighter" || r.kind === "dupe") {
      const cfg = BF.CHARACTER_ROSTER[r.id];
      const badgeText = r.isRateUp ? "RATE-UP!" : "FIGHTER";
      el.innerHTML = `<span class="g-rarity">${badgeText}</span><canvas class="g-canvas" width="168" height="168"></canvas>` +
        `<h3 class="g-name">${cfg.name}</h3><p class="g-sub">${BF.SERIES[r.id] || ""}</p>` +
        `<span class="g-tag ${r.kind === "dupe" ? "dupe" : "new"}">${r.kind === "dupe" ? `DUPLICATE +${r.gems} GEMS` : "NEW FIGHTER!"}</span>`;
      deps.drawAvatar(el.querySelector("canvas"), cfg);
    } else {
      const gem = r.kind === "gems";
      el.innerHTML = `<span class="g-rarity">${r.label || (gem ? "GEMS" : "COINS")}</span><svg class="g-prize"><use href="#${gem ? "i-gem" : "i-coin"}"/></svg>` +
        `<h3 class="g-name">+${r.amount}</h3><p class="g-sub">${gem ? "GEMS" : "COINS"}</p>`;
    }
    return el;
  }

  const RAYS = (() => {
    const p = [];
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28, rr = i % 2 ? 46 : 98;
      p.push(`${(100 + rr * Math.cos(a)).toFixed(1)},${(100 + rr * Math.sin(a)).toFixed(1)}`);
    }
    return p.join(" ");
  })();

  // Helper to draw a comic impact star
  function drawImpactStar(c, x, y, rOuter, rInner, points, rot, fill, stroke) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const a = (i * Math.PI) / points;
      if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); }
    c.restore();
  }

  // Helper to draw a throwing knife
  function drawKnife(c, x, y, angle, scale = 1) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(scale, scale);
    // Blade
    c.fillStyle = "#f8fafc";
    c.strokeStyle = "#1e1b4b";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(22, 0);
    c.lineTo(-4, -6);
    c.lineTo(-8, 0);
    c.lineTo(-4, 6);
    c.closePath();
    c.fill();
    c.stroke();
    // Blood groove / shine
    c.fillStyle = "#94a3b8";
    c.beginPath();
    c.moveTo(16, 0);
    c.lineTo(-2, -3);
    c.lineTo(-2, 0);
    c.closePath();
    c.fill();
    // Handle
    c.fillStyle = "#a855f7";
    c.fillRect(-20, -4, 13, 8);
    c.strokeRect(-20, -4, 13, 8);
    c.fillStyle = "#facc15";
    c.fillRect(-8, -8, 3, 16);
    c.strokeRect(-8, -8, 3, 16);
    c.restore();
  }

  // Helper to draw Sukuna's Malevolent Shrine Torii Gate silhouette
  function drawShrineTorii(c, cx, cy, scale = 1, alpha = 1) {
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.globalAlpha = alpha;
    c.fillStyle = "#180409";
    c.strokeStyle = "#ef4444";
    c.lineWidth = 3;
    // Pillars
    c.fillRect(-68, -45, 16, 120);
    c.strokeRect(-68, -45, 16, 120);
    c.fillRect(52, -45, 16, 120);
    c.strokeRect(52, -45, 16, 120);
    // Lower tie beam (Nuki)
    c.fillRect(-82, -22, 164, 12);
    c.strokeRect(-82, -22, 164, 12);
    // Curved top lintel (Kasagi)
    c.beginPath();
    c.moveTo(-105, -56);
    c.quadraticCurveTo(0, -40, 105, -56);
    c.lineTo(96, -38);
    c.quadraticCurveTo(0, -28, -96, -38);
    c.closePath();
    c.fill();
    c.stroke();
    // Centerhorn / skull emblem
    c.fillStyle = "#fecaca";
    c.beginPath();
    c.arc(0, -32, 11, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // Horns on roof
    c.strokeStyle = "#fecaca";
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(-88, -52); c.lineTo(-108, -74);
    c.moveTo(88, -52); c.lineTo(108, -74);
    c.stroke();
    c.restore();
  }

  // Full MUGEN-Style Multi-Phase Character Cut-In & Ultimate Reveal Animation
  function playCharacterRevealFX(stage, charId, durationMs = 2200) {
    const theme = CHAR_THEMES[charId] || CHAR_THEMES.gojo;
    const cfg = BF.CHARACTER_ROSTER[charId] || BF.CHARACTER_ROSTER.gojo;
    const fxCv = document.createElement("canvas");
    fxCv.className = "g-char-fx-canvas";
    fxCv.width = 540;
    fxCv.height = 720;
    stage.appendChild(fxCv);
    const c = fxCv.getContext("2d");
    const start = performance.now();
    let rafId = 0;

    // Trigger character ultimate SFX if available
    if (deps && deps.sound && typeof deps.sound.playUlt === "function") {
      try { deps.sound.playUlt(charId); } catch (_) {}
    }

    const frame = (now) => {
      if (!fxCv.isConnected || ctl?.skipped) return;
      const elapsed = now - start;
      const p = Math.min(1, elapsed / durationMs);
      const t = now * 0.001;
      const w = fxCv.width, h = fxCv.height;
      const cx = w * 0.5, cy = h * 0.46;

      c.clearRect(0, 0, w, h);

      // Fade out smoothly at the very end when card pops in
      const outAlpha = p < 0.86 ? 1 : Math.max(0, 1 - (p - 0.86) / 0.14);
      c.save();
      c.globalAlpha = outAlpha;

      // 1. MUGEN Dark Theatrical Backdrop + Radial Speedlines
      const bgGrad = c.createRadialGradient(cx, cy, 20, cx, cy, w * 0.85);
      bgGrad.addColorStop(0, theme.bg2);
      bgGrad.addColorStop(0.6, theme.bg1);
      bgGrad.addColorStop(1, "#040208");
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, w, h);

      // Anime radial action lines around center
      c.save();
      c.translate(cx, cy);
      c.rotate(t * 0.35);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const rIn = 110 + (i % 3) * 28;
        c.strokeStyle = i % 2 === 0 ? theme.c1 : theme.c2;
        c.globalAlpha = outAlpha * (0.18 + (i % 3) * 0.08);
        c.lineWidth = i % 2 === 0 ? 3 : 1.8;
        c.beginPath();
        c.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        c.lineTo(Math.cos(a) * 440, Math.sin(a) * 440);
        c.stroke();
      }
      c.restore();

      // 2. CHARACTER-SPECIFIC SIGNATURE ULTIMATE ANIMATION (MUGEN SHOWCASE)
      if (charId === "gojo") {
        // GOJO: Blue & Red Cursed Orbs Spiral & Collide -> Hollow Purple Detonation + Six Eyes Void
        const collideP = Math.min(1, p / 0.42);
        const postP = Math.max(0, (p - 0.42) / 0.58);

        // Infinity hex/grid rings in background
        c.save();
        c.strokeStyle = "rgba(56, 189, 248, 0.3)";
        c.lineWidth = 2;
        for (let r = 60; r <= 260; r += 50) {
          c.beginPath();
          c.arc(cx, cy, r + Math.sin(t * 4 + r) * 6, 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();

        if (collideP < 1) {
          // Orbiting Red & Blue spheres rushing toward collision
          const dist = (1 - collideP * collideP) * 195;
          const ang = collideP * Math.PI * 2.5;
          const bx = cx - Math.cos(ang) * dist;
          const by = cy - Math.sin(ang) * dist * 0.45;
          const rx = cx + Math.cos(ang) * dist;
          const ry = cy + Math.sin(ang) * dist * 0.45;

          // Blue Orb (Lapse: Blue)
          c.fillStyle = "rgba(56, 189, 248, 0.35)";
          c.beginPath(); c.arc(bx, by, 54, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#38bdf8"; c.strokeStyle = "#ffffff"; c.lineWidth = 3;
          c.beginPath(); c.arc(bx, by, 30, 0, Math.PI * 2); c.fill(); c.stroke();

          // Red Orb (Reversal: Red)
          c.fillStyle = "rgba(255, 30, 66, 0.35)";
          c.beginPath(); c.arc(rx, ry, 54, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#ff1e42"; c.strokeStyle = "#ffffff"; c.lineWidth = 3;
          c.beginPath(); c.arc(rx, ry, 30, 0, Math.PI * 2); c.fill(); c.stroke();
        } else {
          // HOLLOW PURPLE SINGULARITY DETONATION!
          const purpleR = 45 + postP * 240;
          const pGrad = c.createRadialGradient(cx, cy, 8, cx, cy, purpleR);
          pGrad.addColorStop(0, "#ffffff");
          pGrad.addColorStop(0.35, "#e879f9");
          pGrad.addColorStop(0.7, "#9333ea");
          pGrad.addColorStop(1, "rgba(147, 51, 234, 0)");
          c.fillStyle = pGrad;
          c.beginPath(); c.arc(cx, cy, purpleR, 0, Math.PI * 2); c.fill();

          // Dual elliptical singularity rings
          c.save();
          c.translate(cx, cy);
          c.strokeStyle = "#f5d0fe";
          c.lineWidth = 4;
          c.beginPath(); c.ellipse(0, 0, 95 + postP * 110, 36 + postP * 40, t * 2.5, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = "#38bdf8";
          c.beginPath(); c.ellipse(0, 0, 95 + postP * 110, 36 + postP * 40, -t * 2.5, 0, Math.PI * 2); c.stroke();
          c.restore();

          // Purple lightning arcs
          c.strokeStyle = "#f0abfc";
          c.lineWidth = 3;
          for (let i = 0; i < 8; i++) {
            const la = (i / 8) * Math.PI * 2 + t * 5;
            c.beginPath();
            c.moveTo(cx + Math.cos(la) * 40, cy + Math.sin(la) * 40);
            c.lineTo(cx + Math.cos(la + 0.18) * 120, cy + Math.sin(la + 0.18) * 120);
            c.lineTo(cx + Math.cos(la - 0.1) * 210, cy + Math.sin(la - 0.1) * 210);
            c.stroke();
          }
        }
      } else if (charId === "sukuna") {
        // SUKUNA: Blood Moon + Malevolent Shrine Torii + Relentless Dismantle/Cleave Storm + Fuga Pillar
        c.fillStyle = "rgba(220, 38, 38, 0.25)";
        c.beginPath(); c.arc(cx, cy - 70, 110, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#991b1b";
        c.beginPath(); c.arc(cx, cy - 70, 82, 0, Math.PI * 2); c.fill();

        const shrineRise = Math.min(1, p * 2.2);
        drawShrineTorii(c, cx, cy - 20 + (1 - shrineRise) * 80, 1.35, 0.95);

        // Relentless Dismantle & Cleave screen slashes
        const slashCount = Math.floor(Math.min(18, p * 26));
        for (let i = 0; i < slashCount; i++) {
          const seed = (i * 73) % 100;
          const sx = (seed / 100) * w;
          const sy = ((i * 47) % 100) / 100 * (h * 0.78) + h * 0.08;
          const sang = ((i % 5) - 2) * 0.42 + (i % 2 ? 0.25 : -0.25);
          c.save();
          c.translate(sx, sy);
          c.rotate(sang);
          c.fillStyle = i % 2 === 0 ? "#ffffff" : "#ef4444";
          c.strokeStyle = "#dc2626";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-180, 0);
          c.quadraticCurveTo(0, -10, 180, 0);
          c.quadraticCurveTo(0, 10, -180, 0);
          c.fill();
          c.stroke();
          c.restore();
        }

        // Fuga flame burst at climax
        if (p > 0.5) {
          const fp = (p - 0.5) / 0.5;
          const fg = c.createRadialGradient(cx, cy, 10, cx, cy, fp * 230);
          fg.addColorStop(0, "rgba(254, 240, 138, 0.9)");
          fg.addColorStop(0.5, "rgba(249, 115, 22, 0.55)");
          fg.addColorStop(1, "rgba(220, 38, 38, 0)");
          c.fillStyle = fg;
          c.beginPath(); c.arc(cx, cy, fp * 230, 0, Math.PI * 2); c.fill();
        }
      } else if (charId === "dio") {
        // DIO: ZA WARUDO Negative Time-Stop Wave + Golden Roman Clock + Ring of 14 Knives Lunging In
        const waveR = Math.min(1, p * 2.0) * 340;
        c.save();
        c.strokeStyle = "#facc15";
        c.lineWidth = 6;
        c.beginPath(); c.arc(cx, cy, waveR, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = "#a855f7";
        c.lineWidth = 3;
        c.beginPath(); c.arc(cx, cy, waveR * 0.82, 0, Math.PI * 2); c.stroke();

        // Giant Golden Clock Face with Roman Numerals
        c.translate(cx, cy);
        const clockAng = p < 0.45 ? t * 3.5 : 1.57; // Freezes when Time Stop locks!
        c.strokeStyle = "rgba(250, 204, 21, 0.65)";
        c.lineWidth = 4;
        c.beginPath(); c.arc(0, 0, 155, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(0, 0, 132, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI * 0.5;
          c.beginPath();
          c.moveTo(Math.cos(a) * 134, Math.sin(a) * 134);
          c.lineTo(Math.cos(a) * 152, Math.sin(a) * 152);
          c.stroke();
        }
        // Clock hands
        c.lineWidth = 6;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(clockAng) * 110, Math.sin(clockAng) * 110); c.stroke();
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(clockAng * 4) * 130, Math.sin(clockAng * 4) * 130); c.stroke();
        c.restore();

        // Ring of 14 Throwing Knives materializing and lunging inward
        const knifeLunge = p < 0.55 ? 0 : Math.min(1, (p - 0.55) / 0.35);
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + 0.2;
          const dist = 210 - knifeLunge * 135;
          const kx = cx + Math.cos(a) * dist;
          const ky = cy + Math.sin(a) * dist;
          drawKnife(c, kx, ky, a + Math.PI, 1.15);
        }
      } else if (charId === "jotaro") {
        // JOTARO: Star Platinum Tarot Star + Time-Stop Ripple + 24x Heavy ORA! Stand Fist Barrage
        drawImpactStar(c, cx, cy, 175, 78, 8, t * 0.4, "rgba(168, 85, 247, 0.25)", "#38bdf8");
        drawImpactStar(c, cx, cy, 130, 58, 5, -t * 0.3, "rgba(56, 189, 248, 0.22)", "#facc15");

        // Rapid ORA! Stand Fists punching across the screen
        const fistCount = 14;
        for (let i = 0; i < fistCount; i++) {
          const cycle = (t * 7 + i * 0.63) % 1;
          const ang = ((i * 137.5) % 360) * (Math.PI / 180);
          const dist = 40 + cycle * 185;
          const fx = cx + Math.cos(ang) * dist;
          const fy = cy + Math.sin(ang) * dist * 0.85;
          const scale = 0.65 + cycle * 0.7;

          c.save();
          c.translate(fx, fy);
          c.rotate(ang);
          c.scale(scale, scale);
          // Violet Stand energy trail
          c.fillStyle = "rgba(168, 85, 247, 0.55)";
          c.beginPath(); c.ellipse(-18, 0, 28, 15, 0, 0, Math.PI * 2); c.fill();
          // Golden/Purple Star Platinum glove
          c.fillStyle = i % 2 === 0 ? "#a855f7" : "#facc15";
          c.strokeStyle = "#1e1b4b";
          c.lineWidth = 3;
          c.beginPath(); c.arc(0, 0, 18, 0, Math.PI * 2); c.fill(); c.stroke();
          // Knuckle studs
          c.fillStyle = "#facc15";
          for (let k = -1; k <= 1; k++) {
            c.beginPath(); c.arc(14, k * 6, 3.5, 0, Math.PI * 2); c.fill();
          }
          c.restore();

          if (cycle > 0.7) {
            drawImpactStar(c, fx, fy, 22, 9, 6, i, "#facc15", "#1e1b4b");
          }
        }
      } else if (charId === "guts") {
        // GUTS: Blood-Moon Eclipse + Beast of Darkness Red Eye Slash + Colossal Dragonslayer Cross-Screen Cleave
        const ecY = cy - 95;
        const corona = c.createRadialGradient(cx, ecY, 52, cx, ecY, 155);
        corona.addColorStop(0, "#ef4444");
        corona.addColorStop(0.45, "#dc2626");
        corona.addColorStop(1, "rgba(220, 38, 38, 0)");
        c.fillStyle = corona;
        c.beginPath(); c.arc(cx, ecY, 155, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#060204";
        c.strokeStyle = "#f87171";
        c.lineWidth = 3;
        c.beginPath(); c.arc(cx, ecY, 56, 0, Math.PI * 2); c.fill(); c.stroke();

        // Swirling Dragonslayer Giant Cleave Wave
        const slashArc = -Math.PI * 0.85 + Math.min(1, p * 1.45) * Math.PI * 1.85;
        c.save();
        c.translate(cx, cy + 10);
        c.strokeStyle = "#dc2626";
        c.lineWidth = 26;
        c.beginPath(); c.arc(0, 0, 165, slashArc - 1.3, slashArc); c.stroke();
        c.strokeStyle = "#f8fafc";
        c.lineWidth = 10;
        c.beginPath(); c.arc(0, 0, 165, slashArc - 1.1, slashArc); c.stroke();

        // Colossal Dragonslayer blade swinging
        c.rotate(slashArc);
        c.fillStyle = "#1e293b";
        c.strokeStyle = "#0f172a";
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(45, -16);
        c.lineTo(210, -12);
        c.lineTo(232, 0);
        c.lineTo(210, 12);
        c.lineTo(45, 16);
        c.closePath();
        c.fill();
        c.stroke();
        // Metallic edge
        c.strokeStyle = "#cbd5e1";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(48, -14); c.lineTo(208, -10); c.lineTo(228, 0); c.lineTo(208, 10); c.lineTo(48, 14);
        c.stroke();
        c.restore();
      }

      // 3. ACTUAL CHARACTER BALL IN ULTIMATE POSE AT THE CENTER
      if (BF.drawBall && cfg) {
        const heroScale = p < 0.25 ? (0.4 + (p / 0.25) * 0.75) : 1.15;
        const heroBall = {
          x: cx,
          y: cy + Math.sin(t * 8) * 4,
          radius: Math.round(52 * heroScale),
          color: cfg.color,
          costume: cfg.costume,
          evolved: Boolean(BF.isEvolutionEquipped && BF.isEvolutionEquipped(charId)),
          weapon: cfg.weapon,
          weaponAngle: cfg.weapon === "dragonslayer" ? (-Math.PI * 0.78 + Math.sin(t * 10) * 0.25) : t * 4,
          vx: 1,
          vy: 0,
          flashTimer: 0,
          ultTimer: 5,
          squash: Math.max(0, Math.sin(t * 10) * 0.08),
          skills: [],
          effects: [],
        };
        BF.drawBall(heroBall, c, true);
      }

      // 4. MUGEN DIAGONAL CUT-IN BARS (Top & Bottom Cinematic Letterbox + Battle Cry Banner)
      c.save();
      c.fillStyle = "#090414";
      c.strokeStyle = theme.c1;
      c.lineWidth = 4;

      // Top angled bar with epithet
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(w, 0);
      c.lineTo(w, 68);
      c.lineTo(0, 92);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = theme.c1;
      c.font = "900 13px 'Lilita One', Impact, sans-serif";
      c.letterSpacing = "2px";
      c.fillText(theme.epithet, 20, 34);
      c.fillStyle = "#ffffff";
      c.font = "900 26px 'Lilita One', Impact, sans-serif";
      c.fillText(cfg.name.toUpperCase(), 20, 64);

      // Bottom angled bar with Battle Cry
      c.fillStyle = "#090414";
      c.strokeStyle = theme.c2;
      c.beginPath();
      c.moveTo(0, h - 96);
      c.lineTo(w, h - 120);
      c.lineTo(w, h);
      c.lineTo(0, h);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#facc15";
      c.font = "900 20px 'Lilita One', Impact, sans-serif";
      c.textAlign = "center";
      c.fillText(`"${theme.battleCry}"`, cx, h - 54);
      c.fillStyle = "#cbd5e1";
      c.font = "700 12px 'Lilita One', Impact, sans-serif";
      c.fillText("★ MUGEN FIGHTER AWAKENING ★", cx, h - 26);
      c.restore();

      c.restore();
      if (p < 1) rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      if (fxCv.isConnected) fxCv.remove();
    };
  }

  async function playOne(stage, r, quick) {
    const isChar = r.kind === "fighter" || r.kind === "dupe";
    const fxRarity = isChar ? "legend" : r.tier;
    stage.className = `g-stage rarity-${fxRarity}`;
    stage.innerHTML = `<svg class="g-rays" viewBox="0 0 200 200"><polygon points="${RAYS}"/></svg>` +
      `<div class="g-capsule"><i class="cap-top"></i><i class="cap-bot"></i></div><div class="g-flash"></div>`;
    deps.sound.gachaShake();
    await wait(quick ? 520 : 840);
    if (ctl.skipped) return;
    stage.classList.add("open");
    deps.sound.gachaPop();

    let stopFx = null;
    if (isChar) {
      const fxDur = quick ? 1450 : 2200;
      stopFx = playCharacterRevealFX(stage, r.id, fxDur);
      await wait(fxDur - 120);
      if (ctl.skipped) { stopFx && stopFx(); return; }
      stopFx && stopFx();
    } else {
      await wait(220);
    }

    stage.appendChild(cardEl(r));
    deps.sound.gachaReveal(fxRarity);

    if (isChar) {
      const theme = CHAR_THEMES[r.id];
      if (theme) {
        const q = document.createElement("p");
        q.className = "g-reveal-quote";
        q.textContent = `"${theme.quote}"`;
        stage.appendChild(q);
      }
    }

    if (quick) await wait(isChar ? 1100 : 600);
    else { const hint = document.createElement("p"); hint.className = "g-hint"; hint.textContent = "TAP TO CONTINUE"; stage.appendChild(hint); await tap(); }
  }

  async function sequence(results) {
    const ov = $("gacha-overlay");
    ov.classList.remove("hidden");
    ov.innerHTML = `<button class="g-skip btn btn-sm" type="button">SKIP</button><div class="g-stage"></div>`;
    ctl = { skipped: false, cancel: null, tapRes: null };
    ov.querySelector(".g-skip").onclick = () => { ctl.skipped = true; ctl.cancel && ctl.cancel(); ctl.tapRes && ctl.tapRes(); };
    ov.onclick = (e) => { if (!e.target.closest(".g-skip") && ctl.tapRes) { const f = ctl.tapRes; ctl.tapRes = null; f(); } };
    const stage = ov.querySelector(".g-stage");
    const order = results.length > 1 ? [...results].sort((a, b) => RANK[a.tier] - RANK[b.tier]) : results;
    for (const r of order) { if (ctl.skipped) break; await playOne(stage, r, results.length > 1); }

    ov.innerHTML = `<div class="g-summary"><div class="stamp stamp-yellow">RESULTS</div><div class="g-grid"></div><button class="btn btn-green g-ok" type="button">OK</button></div>`;
    ov.onclick = null;
    const grid = ov.querySelector(".g-grid");
    for (const r of order) {
      const t = cardEl(r); t.classList.add("mini"); grid.appendChild(t);
    }
    await new Promise((res) => { ov.querySelector(".g-ok").onclick = res; });
    ov.classList.add("hidden"); ov.innerHTML = "";
  }

  async function pull(n, mode) {
    if (busy) return;
    const cost = mode === "gem" ? COSTS.gem : n === 10 ? COSTS.ten : COSTS.one;
    const cur = mode === "gem" ? "gems" : "coins";
    if (deps.wallet[cur] < cost) {
      deps.say(`"Not enough ${cur}, brat! Win some matches first!"`);
      deps.sound.playBallHit();
      return;
    }
    busy = true;
    deps.wallet[cur] -= cost;
    const results = [];
    for (let i = 0; i < n; i++) results.push(rollOne());
    deps.save(); saveState();
    await sequence(results);
    const gotChar = results.find((r) => r.kind === "fighter");
    const gotDupe = results.find((r) => r.kind === "dupe");
    deps.say(
      gotChar
        ? (gotChar.isRateUp
            ? `"JACKPOT! Rate-Up ${BF.CHARACTER_ROSTER[gotChar.id].name} answered your pull!"`
            : `"Whoa! ${BF.CHARACTER_ROSTER[gotChar.id].name} popped out! Lucky brat!"`)
        : gotDupe
          ? `"Duplicate fighter! Here's +${DUPE_GEMS} Gems instead, gaki!"`
          : `"Heh! Keep pulling — Pity 100 guarantees a fighter!"`
    );
    busy = false;
    deps.onChange();
  }

  function silhouette(cv) {
    const x = cv.getContext("2d");
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "#2b1b3d";
    x.fillRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = "source-over";
  }

  // Professional Modern Gacha & MUGEN Widescreen Banner Renderer (Hi-DPI 880x420 internal canvas)
  function drawModernSplashBanner(cv, featCfg, t) {
    if (!cv || !featCfg) return;
    const c = cv.getContext("2d");
    const W = cv.width, H = cv.height;
    const scale = W / 440;
    const w = 440, h = 210;
    const theme = CHAR_THEMES[featCfg.id] || CHAR_THEMES.gojo;

    c.save();
    c.clearRect(0, 0, W, H);
    c.scale(scale, scale);

    // 1. Multi-stop Deep Atmospheric Backdrop
    const bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bg1);
    bg.addColorStop(0.55, theme.bg2);
    bg.addColorStop(1, theme.bg3 || theme.bg1);
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // Subtle cyber-grid perspective lines on left/bottom
    c.save();
    c.strokeStyle = theme.c1;
    c.globalAlpha = 0.12;
    c.lineWidth = 1;
    for (let x = 0; x < w; x += 24) {
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 35, h); c.stroke();
    }
    for (let y = 0; y < h; y += 22) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    c.restore();

    // 2. Giant Outlined Watermark Typography in Background
    c.save();
    c.font = "900 44px 'Lilita One', Impact, sans-serif";
    c.strokeStyle = theme.c1;
    c.globalAlpha = 0.13;
    c.lineWidth = 2;
    c.strokeText(theme.watermark, 12, 92);
    c.globalAlpha = 0.07;
    c.fillStyle = "#ffffff";
    c.fillText(theme.watermark, 12, 136);
    c.restore();

    // 3. Angled Split-Panel Showcase Backdrop on Right Side
    c.save();
    const panelGrad = c.createLinearGradient(w * 0.45, 0, w, h);
    panelGrad.addColorStop(0, "rgba(255,255,255,0.02)");
    panelGrad.addColorStop(0.5, `${theme.c1}33`);
    panelGrad.addColorStop(1, `${theme.c2}55`);
    c.fillStyle = panelGrad;
    c.beginPath();
    c.moveTo(w * 0.50, 0);
    c.lineTo(w, 0);
    c.lineTo(w, h);
    c.lineTo(w * 0.34, h);
    c.closePath();
    c.fill();

    // Sharp diagonal comic separator slash
    c.strokeStyle = theme.c1;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(w * 0.50, 0);
    c.lineTo(w * 0.34, h);
    c.stroke();

    c.strokeStyle = theme.c2;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(w * 0.53, 0);
    c.lineTo(w * 0.37, h);
    c.stroke();
    c.restore();

    const hx = w * 0.73;
    const hy = h * 0.52 + Math.sin(t * 2.8) * 3.5;

    // 4. CHARACTER-SPECIFIC SIGNATURE DOMAIN / STAND / WEAPON ART BEHIND HERO
    c.save();
    if (theme.motif === "infinity") {
      // Gojo: Glowing Hollow Purple core + Red & Blue orbiting spheres
      const pGlow = c.createRadialGradient(hx, hy, 8, hx, hy, 88);
      pGlow.addColorStop(0, "rgba(192, 132, 252, 0.65)");
      pGlow.addColorStop(0.55, "rgba(56, 189, 248, 0.25)");
      pGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
      c.fillStyle = pGlow;
      c.beginPath(); c.arc(hx, hy, 88, 0, Math.PI * 2); c.fill();

      // Solid sleek Infinity orbital rings
      c.strokeStyle = "rgba(56, 189, 248, 0.7)";
      c.lineWidth = 2;
      c.beginPath(); c.ellipse(hx, hy, 78, 28, t * 0.8, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "rgba(192, 132, 252, 0.75)";
      c.beginPath(); c.ellipse(hx, hy, 78, 28, -t * 0.8, 0, Math.PI * 2); c.stroke();

      // Red & Blue orbs
      const oa = t * 1.6;
      const rx = hx + Math.cos(oa) * 68, ry = hy + Math.sin(oa) * 26;
      const bx = hx - Math.cos(oa) * 68, by = hy - Math.sin(oa) * 26;
      c.fillStyle = "#ff1e42"; c.strokeStyle = "#ffffff"; c.lineWidth = 2;
      c.beginPath(); c.arc(rx, ry, 11, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = "#38bdf8";
      c.beginPath(); c.arc(bx, by, 11, 0, Math.PI * 2); c.fill(); c.stroke();
    } else if (theme.motif === "shrine") {
      // Sukuna: Blood Moon + Malevolent Shrine Torii Gate + Crimson Dismantle slashes
      const sGlow = c.createRadialGradient(hx, hy, 10, hx, hy, 90);
      sGlow.addColorStop(0, "rgba(239, 68, 68, 0.55)");
      sGlow.addColorStop(1, "rgba(239, 68, 68, 0)");
      c.fillStyle = sGlow;
      c.beginPath(); c.arc(hx, hy, 90, 0, Math.PI * 2); c.fill();

      drawShrineTorii(c, hx, hy - 8, 0.78, 0.85);

      // Razor Dismantle slashes across showcase
      c.strokeStyle = "#fecaca";
      c.lineWidth = 2.2;
      for (let i = 0; i < 4; i++) {
        const sy = 28 + i * 42;
        c.beginPath();
        c.moveTo(hx - 76, sy - 14);
        c.lineTo(hx + 76, sy + 14);
        c.stroke();
      }
    } else if (theme.motif === "time") {
      // DIO: Ornate Golden Clock Face + Roman Numerals + Floating Silver Knives
      const dGlow = c.createRadialGradient(hx, hy, 10, hx, hy, 86);
      dGlow.addColorStop(0, "rgba(250, 204, 21, 0.45)");
      dGlow.addColorStop(0.6, "rgba(168, 85, 247, 0.25)");
      dGlow.addColorStop(1, "rgba(168, 85, 247, 0)");
      c.fillStyle = dGlow;
      c.beginPath(); c.arc(hx, hy, 86, 0, Math.PI * 2); c.fill();

      c.save();
      c.translate(hx, hy);
      c.strokeStyle = "rgba(250, 204, 21, 0.85)";
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, 0, 68, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(0, 0, 56, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.beginPath();
        c.moveTo(Math.cos(a) * 56, Math.sin(a) * 56);
        c.lineTo(Math.cos(a) * 67, Math.sin(a) * 67);
        c.stroke();
      }
      // Clock hands
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(t * 0.9) * 44, Math.sin(t * 0.9) * 44); c.stroke();
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(-t * 0.3) * 34, Math.sin(-t * 0.3) * 34); c.stroke();
      c.restore();

      // 4 Suspended Throwing Knives pointing inward
      for (let i = 0; i < 4; i++) {
        const ka = -0.65 + i * 0.44 + Math.sin(t * 2 + i) * 0.05;
        const kx = hx - Math.cos(ka) * 82;
        const ky = hy + Math.sin(ka) * 68;
        drawKnife(c, kx, ky, -ka * 0.5, 0.72);
      }
    } else if (theme.motif === "star") {
      // Jotaro: Giant Star Tarot Emblem + Stand Aura + ORA Fist Burst
      const jGlow = c.createRadialGradient(hx, hy, 10, hx, hy, 88);
      jGlow.addColorStop(0, "rgba(168, 85, 247, 0.6)");
      jGlow.addColorStop(0.6, "rgba(56, 189, 248, 0.25)");
      jGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
      c.fillStyle = jGlow;
      c.beginPath(); c.arc(hx, hy, 88, 0, Math.PI * 2); c.fill();

      drawImpactStar(c, hx, hy, 74, 32, 5, t * 0.35, "rgba(168, 85, 247, 0.32)", "#38bdf8");
      drawImpactStar(c, hx, hy, 56, 26, 8, -t * 0.25, "rgba(250, 204, 21, 0.2)", "#facc15");
    } else if (theme.motif === "eclipse") {
      // Guts: Crimson Blood-Moon Eclipse + Jagged Berserker Lightning
      const gGlow = c.createRadialGradient(hx, hy - 10, 18, hx, hy - 10, 86);
      gGlow.addColorStop(0, "#ef4444");
      gGlow.addColorStop(0.5, "rgba(220, 38, 38, 0.45)");
      gGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
      c.fillStyle = gGlow;
      c.beginPath(); c.arc(hx, hy - 10, 86, 0, Math.PI * 2); c.fill();

      // Dark Eclipse Sun behind Guts
      c.fillStyle = "#070204";
      c.strokeStyle = "#f87171";
      c.lineWidth = 2.5;
      c.beginPath(); c.arc(hx + 22, hy - 26, 32, 0, Math.PI * 2); c.fill(); c.stroke();

      // Diagonal crimson cleave slashes
      c.strokeStyle = "#ef4444";
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(hx - 74, hy + 52); c.lineTo(hx + 68, hy - 58); c.stroke();
    }
    c.restore();

    // 5. Floating Ambient Energy Particles Across Banner
    c.save();
    for (let i = 0; i < 12; i++) {
      const px = ((i * 41 + t * 22) % (w - 20)) + 10;
      const py = h - (((i * 29 + t * 28) % (h - 16)) + 8);
      const pr = 1.8 + (i % 3) * 1.1;
      c.fillStyle = i % 2 === 0 ? theme.c1 : theme.c2;
      c.globalAlpha = 0.45 + Math.sin(t * 3 + i) * 0.25;
      c.beginPath();
      c.arc(px, py, pr, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 6. Pedestal Floor Shadow + Energy Ring under Featured Fighter
    c.save();
    c.fillStyle = "rgba(5, 2, 12, 0.65)";
    c.beginPath();
    c.ellipse(hx, hy + 46, 46, 11, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = theme.c1;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(hx, hy + 46, 52 + Math.sin(t * 4) * 3, 13, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // 7. Featured Hero Ball in Animated Ultimate Pose
    const demoBall = {
      x: hx,
      y: hy,
      radius: 42,
      color: featCfg.color,
      costume: featCfg.costume,
      evolved: Boolean(BF.isEvolutionEquipped && BF.isEvolutionEquipped(featCfg.id)),
      weapon: featCfg.weapon,
      weaponAngle: featCfg.weapon === "dragonslayer" ? -Math.PI * 0.78 : t * 1.6,
      vx: -1,
      vy: 0,
      flashTimer: 0,
      ultTimer: 5,
      squash: Math.max(0, Math.sin(t * 5.2) * 0.05),
      skills: [],
      effects: [],
    };
    if (BF.drawBall) BF.drawBall(demoBall, c, true);

    // 8. Signature Ultimate Tag Pill in Top-Right Corner
    c.save();
    const pillText = `★ ULT: ${theme.ultTag}`;
    c.font = "900 10px 'Lilita One', Impact, sans-serif";
    const tw = c.measureText(pillText).width + 18;
    const px = w - tw - 10, py = 10;
    c.fillStyle = "rgba(9, 5, 20, 0.88)";
    c.strokeStyle = theme.c1;
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(px, py, tw, 20, 999);
    c.fill();
    c.stroke();
    c.fillStyle = "#ffffff";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(pillText, px + tw * 0.5, py + 10.5);
    c.restore();

    c.restore();
  }

  function refresh() {
    if (!deps) return;
    const now = Date.now();
    const w = deps.wallet;
    const featuredId = getFeaturedId(now);
    const featCfg = BF.CHARACTER_ROSTER[featuredId];
    const theme = CHAR_THEMES[featuredId] || CHAR_THEMES.gojo;
    lastHourSlot = getHourSlot(now);

    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set("gacha-pity-text", `${Math.min(state.pity, PITY)} / ${PITY}`);
    set("banner-timer", getRemainingTimeText(now));
    if (featCfg) {
      set("banner-rateup-name", featCfg.name);
      set("banner-rateup-series", `${BF.SERIES[featuredId] || "ANIME"} • ${theme.epithet}`);
    }
    const fill = $("gacha-pity-fill"); if (fill) fill.style.width = `${Math.min(100, (state.pity / PITY) * 100)}%`;
    for (const [id, cost, cur] of [["btn-pull-1", COSTS.one, "coins"], ["btn-pull-10", COSTS.ten, "coins"], ["btn-pull-gem", COSTS.gem, "gems"]]) {
      const b = $(id); if (b) b.classList.toggle("poor", w[cur] < cost);
    }

    const rateUpCv = $("banner-rateup-canvas");
    if (rateUpCv && featCfg) {
      drawModernSplashBanner(rateUpCv, featCfg, performance.now() * 0.001);
    }

    const feat = $("banner-feat");
    if (feat) {
      feat.innerHTML = "";
      for (const id of FIGHTERS) {
        const cfg = BF.CHARACTER_ROSTER[id]; if (!cfg) continue;
        const has = owned(id);
        const isRateUp = id === featuredId;
        const t = document.createElement("div");
        t.className = `feat-tile rarity-fighter${isRateUp ? " is-rateup" : ""}${has ? " has" : ""}`;
        const cv = document.createElement("canvas"); cv.width = 96; cv.height = 96;
        t.appendChild(cv);
        const tag = document.createElement("span");
        tag.textContent = isRateUp ? "5.0%" : (has ? "OWNED" : "FIGHTER");
        t.appendChild(tag);
        feat.appendChild(t);
        deps.drawAvatar(cv, cfg);
      }
    }

    const grid = $("shop-items-grid");
    if (grid) {
      grid.innerHTML = "";
      const all = Object.values(BF.CHARACTER_ROSTER);
      const have = all.filter((c) => owned(c.id)).length;
      set("collection-count", `${have} / ${all.length}`);
      for (const cfg of all) {
        const has = owned(cfg.id);
        const t = document.createElement("div");
        t.className = `col-tile${has ? "" : " locked"}`;
        const cv = document.createElement("canvas"); cv.width = 84; cv.height = 84;
        const nm = document.createElement("span"); nm.className = "col-name"; nm.textContent = has ? (cfg.shortName || cfg.name) : "???";
        t.appendChild(cv); t.appendChild(nm);
        grid.appendChild(t);
        deps.drawAvatar(cv, cfg);
        if (!has) silhouette(cv);
        t.addEventListener("click", () => deps.say(has ? `"${cfg.name}? Solid pick. Go crush somebody."` : `"That one's still in the machine, brat. Keep pulling!"`));
      }
    }
  }

  function tick(t) {
    if (!deps) return;
    const now = Date.now();
    if (getHourSlot(now) !== lastHourSlot) {
      refresh();
      return;
    }
    const timerEl = $("banner-timer");
    if (timerEl) timerEl.textContent = getRemainingTimeText(now);

    const rateUpCv = $("banner-rateup-canvas");
    const featuredId = getFeaturedId(now);
    const featCfg = BF.CHARACTER_ROSTER[featuredId];
    if (rateUpCv && featCfg) {
      drawModernSplashBanner(rateUpCv, featCfg, t);
    }
  }

  function reset() {
    state.pity = 0;
    state.total = 0;
    try {
      localStorage.removeItem("bf_gacha_v1");
      localStorage.removeItem(KEY);
    } catch (_) {}
    saveState();
    refresh();
  }

  BF.Gacha = {
    init(d) {
      deps = d;
      const bind = (id, fn) => { const b = $(id); if (b) b.addEventListener("click", () => { deps.sound.unlock(); fn(); }); };
      bind("btn-pull-1", () => pull(1, "coins"));
      bind("btn-pull-10", () => pull(10, "coins"));
      bind("btn-pull-gem", () => pull(1, "gem"));
      refresh();
    },
    refresh,
    tick,
    reset,
  };
})();
