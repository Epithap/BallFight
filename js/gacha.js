// Fighter gacha: hourly Rate-Up Banner, Pity 100 guaranteed character (by chance), Coins & Gems
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const KEY = "bf_gacha_v2";
  const COSTS = { one: 160, ten: 1500, gem: 50 };
  const PITY = 100;
  const DUPE_GEMS = 50;
  const HOUR_MS = 3600 * 1000;

  // All characters are equal tier (no character rarity); Rate-Up boosts featured character's share
  const FIGHTERS = ["gojo", "sukuna", "guts", "dio", "jotaro"];
  const CHAR_TOTAL_CHANCE = 20; // 20% character, 42% coins, 38% gems
  const RATE_UP_SHARE = 0.55;   // 55% of character drops = featured hero; 45% split among others

  const PRIZES = [
    { type: "coins", amount: 150, tier: "common", label: "COINS", w: 28 },
    { type: "coins", amount: 400, tier: "rare", label: "BIG COINS", w: 14 },
    { type: "gems", amount: 25, tier: "common", label: "GEMS", w: 26 },
    { type: "gems", amount: 60, tier: "epic", label: "BIG GEMS", w: 12 },
  ];

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

  // Roll a character following Rate-Up chances (used for both normal drops & Pity 100)
  function rollFighterByChance(featuredId) {
    const others = FIGHTERS.filter((id) => id !== featuredId);
    const otherWeight = others.length ? (1 - RATE_UP_SHARE) / others.length : 0;
    const pool = FIGHTERS.map((id) => ({
      id,
      w: id === featuredId ? RATE_UP_SHARE : otherWeight,
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
        { type: "fighter", w: CHAR_TOTAL_CHANCE },
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

  async function playOne(stage, r, quick) {
    const fxRarity = r.tier === "fighter" ? "legend" : r.tier;
    stage.className = `g-stage rarity-${fxRarity}`;
    stage.innerHTML = `<svg class="g-rays" viewBox="0 0 200 200"><polygon points="${RAYS}"/></svg>` +
      `<div class="g-capsule"><i class="cap-top"></i><i class="cap-bot"></i></div><div class="g-flash"></div>`;
    deps.sound.gachaShake();
    await wait(quick ? 650 : 1000);
    if (ctl.skipped) return;
    stage.classList.add("open");
    deps.sound.gachaPop();
    await wait(240);
    stage.appendChild(cardEl(r));
    deps.sound.gachaReveal(fxRarity);
    if (quick) await wait(r.tier === "fighter" ? 1200 : 700);
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
      set("banner-rateup-series", `${BF.SERIES[featuredId] || "ANIME"} • ROTATES EVERY 1H`);
    }
    const fill = $("gacha-pity-fill"); if (fill) fill.style.width = `${Math.min(100, (state.pity / PITY) * 100)}%`;
    for (const [id, cost, cur] of [["btn-pull-1", COSTS.one, "coins"], ["btn-pull-10", COSTS.ten, "coins"], ["btn-pull-gem", COSTS.gem, "gems"]]) {
      const b = $(id); if (b) b.classList.toggle("poor", w[cur] < cost);
    }

    const rateUpCv = $("banner-rateup-canvas");
    if (rateUpCv && featCfg) {
      deps.drawAvatar(rateUpCv, featCfg);
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
        tag.textContent = isRateUp ? "RATE UP" : (has ? "OWNED" : "FIGHTER");
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
      const pCtx = rateUpCv.getContext("2d");
      pCtx.clearRect(0, 0, rateUpCv.width, rateUpCv.height);
      const bob = Math.sin(t * 3.6) * 3.5;
      const demoBall = {
        x: rateUpCv.width * 0.5,
        y: rateUpCv.height * 0.56 + bob,
        radius: 34,
        color: featCfg.color,
        costume: featCfg.costume,
        evolved: Boolean(BF.isEvolutionEquipped && BF.isEvolutionEquipped(featCfg.id)),
        weapon: null,
        weaponAngle: 0,
        vx: 1,
        vy: 0,
        flashTimer: 0,
        squash: Math.max(0, Math.sin(t * 6.8) * 0.08),
        skills: [],
        effects: [],
      };
      if (BF.drawBall) BF.drawBall(demoBall, pCtx, false);
      else deps.drawAvatar(rateUpCv, featCfg);
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
