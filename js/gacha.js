// Fighter gacha: Modern Rate-Up Splash Banner (1H rotation), 5% Rate-Up / 1.5% Off-Banner, Pity 100 & Character Reveal FX
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

  // Per-character splash banner & pull reveal themes
  const CHAR_THEMES = {
    gojo: {
      bg1: "#070b1e", bg2: "#16113a",
      c1: "#38bdf8", c2: "#c084fc",
      quote: "THROUGHOUT HEAVEN AND EARTH, I ALONE AM THE HONORED ONE.",
      motif: "infinity",
    },
    sukuna: {
      bg1: "#120409", bg2: "#330812",
      c1: "#ef4444", c2: "#f97316",
      quote: "STAND PROUD. YOU ARE STRONG.",
      motif: "shrine",
    },
    dio: {
      bg1: "#141004", bg2: "#332506",
      c1: "#facc15", c2: "#a855f7",
      quote: "ZA WARUDO! TOKI WO TOMARE!",
      motif: "time",
    },
    jotaro: {
      bg1: "#0c0720", bg2: "#24134a",
      c1: "#a855f7", c2: "#38bdf8",
      quote: "YARE YARE DAZE... STAR PLATINUM!",
      motif: "star",
    },
    guts: {
      bg1: "#0d0608", bg2: "#2a090d",
      c1: "#dc2626", c2: "#94a3b8",
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

  // Draw character-specific cinematic reveal animation on full-stage canvas
  function playCharacterRevealFX(stage, charId) {
    const theme = CHAR_THEMES[charId] || CHAR_THEMES.gojo;
    const fxCv = document.createElement("canvas");
    fxCv.className = "g-char-fx-canvas";
    fxCv.width = 480;
    fxCv.height = 640;
    stage.appendChild(fxCv);
    const c = fxCv.getContext("2d");
    const start = performance.now();
    let rafId = 0;

    const frame = (now) => {
      if (!fxCv.isConnected || ctl?.skipped) return;
      const elapsed = (now - start) / 1000;
      const p = Math.min(1, elapsed / 1.15);
      const w = fxCv.width, h = fxCv.height;
      const cx = w * 0.5, cy = h * 0.48;
      c.clearRect(0, 0, w, h);

      // Character energy flash & diagonal shards
      const fade = p < 0.7 ? 1 : Math.max(0, 1 - (p - 0.7) / 0.3);
      c.save();
      c.globalAlpha = fade;

      // Diagonal speed slashes
      for (let i = 0; i < 6; i++) {
        const ang = -0.45 + (i % 2) * 0.9;
        const offset = (i - 2.5) * 44;
        c.save();
        c.translate(cx, cy + offset);
        c.rotate(ang);
        c.fillStyle = i % 2 === 0 ? theme.c1 : theme.c2;
        const len = w * (0.4 + p * 0.9);
        c.fillRect(-len * 0.5, -4, len, 8);
        c.restore();
      }

      if (theme.motif === "infinity") {
        // Gojo: Red & Blue orbs spiraling into Hollow Purple void burst
        const sep = (1 - Math.min(1, p * 1.4)) * 130;
        c.fillStyle = "#ef4444";
        c.beginPath(); c.arc(cx - sep, cy, 24, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#38bdf8";
        c.beginPath(); c.arc(cx + sep, cy, 24, 0, Math.PI * 2); c.fill();
        if (p > 0.55) {
          c.strokeStyle = "#c084fc";
          c.lineWidth = 8;
          c.beginPath(); c.arc(cx, cy, (p - 0.55) * 520, 0, Math.PI * 2); c.stroke();
        }
      } else if (theme.motif === "shrine") {
        // Sukuna: Crimson Dismantle slash grid + shockwave
        c.strokeStyle = "#ef4444";
        c.lineWidth = 5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI + p * 0.5;
          c.beginPath();
          c.moveTo(cx - Math.cos(a) * 240, cy - Math.sin(a) * 240);
          c.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
          c.stroke();
        }
      } else if (theme.motif === "time") {
        // DIO: Golden Za Warudo clock rings & frozen knives
        c.strokeStyle = "#facc15";
        c.lineWidth = 6;
        c.beginPath(); c.arc(cx, cy, 40 + p * 220, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + p * 2;
          const kx = cx + Math.cos(a) * 140;
          const ky = cy + Math.sin(a) * 140;
          c.save(); c.translate(kx, ky); c.rotate(a + Math.PI);
          c.fillStyle = "#e2e8f0"; c.strokeStyle = "#2b1b3d"; c.lineWidth = 2;
          c.fillRect(-14, -4, 28, 8); c.strokeRect(-14, -4, 28, 8);
          c.restore();
        }
      } else if (theme.motif === "star") {
        // Jotaro: Star Platinum rapid ORA star bursts
        c.strokeStyle = "#a855f7";
        c.lineWidth = 7;
        c.beginPath(); c.arc(cx, cy, 30 + p * 240, 0, Math.PI * 2); c.stroke();
        c.fillStyle = "#38bdf8";
        c.beginPath(); c.arc(cx, cy, 18 + Math.sin(p * 24) * 8, 0, Math.PI * 2); c.fill();
      } else if (theme.motif === "eclipse") {
        // Guts: Blood-moon eclipse + massive diagonal Dragonslayer cleave
        c.fillStyle = "#dc2626";
        c.beginPath(); c.arc(cx, cy, 90, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#0d0608";
        c.beginPath(); c.arc(cx + 12, cy - 8, 76, 0, Math.PI * 2); c.fill();
      }

      c.restore();
      if (p < 1) rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }

  async function playOne(stage, r, quick) {
    const isChar = r.kind === "fighter" || r.kind === "dupe";
    const fxRarity = isChar ? "legend" : r.tier;
    stage.className = `g-stage rarity-${fxRarity}`;
    stage.innerHTML = `<svg class="g-rays" viewBox="0 0 200 200"><polygon points="${RAYS}"/></svg>` +
      `<div class="g-capsule"><i class="cap-top"></i><i class="cap-bot"></i></div><div class="g-flash"></div>`;
    deps.sound.gachaShake();
    await wait(quick ? 580 : 920);
    if (ctl.skipped) return;
    stage.classList.add("open");
    deps.sound.gachaPop();

    let stopFx = null;
    if (isChar) {
      stopFx = playCharacterRevealFX(stage, r.id);
      await wait(quick ? 750 : 1050);
      if (ctl.skipped) { stopFx && stopFx(); return; }
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

    if (quick) await wait(isChar ? 1400 : 650);
    else { const hint = document.createElement("p"); hint.className = "g-hint"; hint.textContent = "TAP TO CONTINUE"; stage.appendChild(hint); await tap(); }
    stopFx && stopFx();
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

  // Modern Wuthering-Waves-inspired widescreen animated banner renderer
  function drawModernSplashBanner(cv, featCfg, t) {
    if (!cv || !featCfg) return;
    const c = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const theme = CHAR_THEMES[featCfg.id] || CHAR_THEMES.gojo;

    c.clearRect(0, 0, w, h);

    // 1. Sleek dark gradient backdrop
    const bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, theme.bg1);
    bg.addColorStop(1, theme.bg2);
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // 2. Angular cyber-anime diagonal shards (WuWa style)
    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = theme.c1;
    c.beginPath();
    c.moveTo(w * 0.35, 0);
    c.lineTo(w * 0.72, 0);
    c.lineTo(w * 0.48, h);
    c.lineTo(w * 0.14, h);
    c.closePath();
    c.fill();

    c.globalAlpha = 0.28;
    c.fillStyle = theme.c2;
    c.beginPath();
    c.moveTo(w * 0.62, 0);
    c.lineTo(w * 0.85, 0);
    c.lineTo(w * 0.65, h);
    c.lineTo(w * 0.45, h);
    c.closePath();
    c.fill();

    // Dynamic diagonal neon slash lines
    c.globalAlpha = 0.75;
    c.strokeStyle = theme.c1;
    c.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const shift = ((t * 45 + i * 70) % 240) - 120;
      c.beginPath();
      c.moveTo(w * 0.38 + shift, h);
      c.lineTo(w * 0.68 + shift, 0);
      c.stroke();
    }
    c.restore();

    // 3. Rotating geometric halo behind hero character on right
    const hx = w * 0.74;
    const hy = h * 0.52 + Math.sin(t * 2.8) * 4;
    c.save();
    c.translate(hx, hy);
    c.rotate(t * 0.6);
    c.strokeStyle = theme.c1;
    c.lineWidth = 2.5;
    c.setLineDash([12, 8]);
    c.beginPath();
    c.arc(0, 0, 68, 0, Math.PI * 2);
    c.stroke();
    c.rotate(-t * 1.1);
    c.strokeStyle = theme.c2;
    c.setLineDash([6, 10]);
    c.beginPath();
    c.arc(0, 0, 52, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // 4. Featured Hero Ball in animated pose
    const demoBall = {
      x: hx,
      y: hy,
      radius: 40,
      color: featCfg.color,
      costume: featCfg.costume,
      evolved: Boolean(BF.isEvolutionEquipped && BF.isEvolutionEquipped(featCfg.id)),
      weapon: featCfg.weapon,
      weaponAngle: featCfg.weapon === "dragonslayer" ? -Math.PI * 0.78 : t * 1.6,
      vx: -1,
      vy: 0,
      flashTimer: 0,
      ultTimer: 5,
      squash: Math.max(0, Math.sin(t * 5.2) * 0.06),
      skills: [],
      effects: [],
    };
    if (BF.drawBall) BF.drawBall(demoBall, c, true);
  }

  function refresh() {
    if (!deps) return;
    const now = Date.now();
    const w = deps.wallet;
    const featuredId = getFeaturedId(now);
    const featCfg = BF.CHARACTER_ROSTER[featuredId];
    lastHourSlot = getHourSlot(now);

    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set("gacha-pity-text", `${Math.min(state.pity, PITY)} / ${PITY}`);
    set("banner-timer", getRemainingTimeText(now));
    if (featCfg) {
      set("banner-rateup-name", featCfg.name);
      set("banner-rateup-series", `${BF.SERIES[featuredId] || "ANIME"} • FEATURED RESONATOR`);
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
  };
})();
