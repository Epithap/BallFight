// Fighter gacha: pull logic, pity, reveal animation and the shop banner / collection UI
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const KEY = "bf_gacha_v1";
  const COSTS = { one: 160, ten: 1500, gem: 50 };
  const PITY = 10, DUPE_GEMS = 30;
  const RANK = { common: 0, rare: 1, epic: 2, legend: 3 };
  const LABEL = { common: "COMMON", rare: "RARE", epic: "EPIC", legend: "LEGEND" };
  const FIGHTERS = [
    { id: "gojo", rarity: "legend", w: 4 }, { id: "sukuna", rarity: "legend", w: 3 }, { id: "guts", rarity: "epic", w: 10 },
    { id: "dio", rarity: "epic", w: 8 }, { id: "jotaro", rarity: "rare", w: 14 },
  ];
  const PRIZES = [
    { type: "coins", amount: 150, rarity: "common", w: 25 },
    { type: "coins", amount: 400, rarity: "rare", w: 10 },
    { type: "gems", amount: 25, rarity: "common", w: 26 },
  ];

  const state = { pity: 0, total: 0 };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (_) {}
  const saveState = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };

  let deps = null, busy = false, ctl = null;
  const $ = (id) => document.getElementById(id);
  const owned = (id) => deps.isUnlocked(id);

  function weighted(list) {
    let r = Math.random() * list.reduce((a, x) => a + x.w, 0);
    for (const x of list) if ((r -= x.w) < 0) return x;
    return list[list.length - 1];
  }

  function rollOne() {
    state.total++; state.pity++;
    const locked = FIGHTERS.filter((f) => !owned(f.id));
    const pick = state.pity >= PITY && locked.length
      ? { ...weighted(locked), type: "fighter" }
      : weighted([...FIGHTERS.map((f) => ({ ...f, type: "fighter" })), ...PRIZES]);
    if (pick.type === "fighter") {
      state.pity = 0;
      if (owned(pick.id)) {
        deps.wallet.gems += DUPE_GEMS;
        return { kind: "dupe", id: pick.id, rarity: pick.rarity, gems: DUPE_GEMS };
      }
      deps.wallet.unlockedFighters.add(pick.id);
      return { kind: "fighter", id: pick.id, rarity: pick.rarity };
    }
    deps.wallet[pick.type] += pick.amount;
    return { kind: pick.type, amount: pick.amount, rarity: pick.rarity };
  }

  const wait = (ms) => new Promise((res) => {
    const done = () => { clearTimeout(id); res(); };
    const id = setTimeout(done, ms);
    ctl.cancel = done;
  });
  const tap = () => new Promise((res) => { ctl.tapRes = res; });

  function cardEl(r) {
    const el = document.createElement("div");
    el.className = `g-card rarity-${r.rarity}`;
    if (r.kind === "fighter" || r.kind === "dupe") {
      const cfg = BF.CHARACTER_ROSTER[r.id];
      el.innerHTML = `<span class="g-rarity">${LABEL[r.rarity]}</span><canvas class="g-canvas" width="168" height="168"></canvas>` +
        `<h3 class="g-name">${cfg.name}</h3><p class="g-sub">${BF.SERIES[r.id] || ""}</p>` +
        `<span class="g-tag ${r.kind === "dupe" ? "dupe" : "new"}">${r.kind === "dupe" ? `DUPLICATE +${r.gems} GEMS` : "NEW FIGHTER!"}</span>`;
      deps.drawAvatar(el.querySelector("canvas"), cfg);
    } else {
      const gem = r.kind === "gems";
      el.innerHTML = `<span class="g-rarity">${LABEL[r.rarity]}</span><svg class="g-prize"><use href="#${gem ? "i-gem" : "i-coin"}"/></svg>` +
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
    stage.className = `g-stage rarity-${r.rarity}`;
    stage.innerHTML = `<svg class="g-rays" viewBox="0 0 200 200"><polygon points="${RAYS}"/></svg>` +
      `<div class="g-capsule"><i class="cap-top"></i><i class="cap-bot"></i></div><div class="g-flash"></div>`;
    deps.sound.gachaShake();
    await wait(quick ? 750 : 1100);
    if (ctl.skipped) return;
    stage.classList.add("open");
    deps.sound.gachaPop();
    await wait(260);
    stage.appendChild(cardEl(r));
    deps.sound.gachaReveal(r.rarity);
    if (quick) await wait(RANK[r.rarity] >= 2 ? 1300 : 800);
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
    const order = results.length > 1 ? [...results].sort((a, b) => RANK[a.rarity] - RANK[b.rarity]) : results;
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
    const best = results.reduce((a, r) => (RANK[r.rarity] > RANK[a.rarity] ? r : a), results[0]);
    deps.say(best.rarity === "legend" ? `"WHAT?! A LEGEND?! Baa-san's lucky cat is cursed, I swear!"`
      : best.kind === "fighter" ? `"Hmph! ${BF.CHARACTER_ROSTER[best.id].name} is yours now. Don't waste 'em, gaki!"`
      : `"Heh! Pull again, brat. The next one's the good one."`);
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
    const w = deps.wallet;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set("gacha-pity-text", `${Math.min(state.pity, PITY)} / ${PITY}`);
    const fill = $("gacha-pity-fill"); if (fill) fill.style.width = `${Math.min(100, (state.pity / PITY) * 100)}%`;
    for (const [id, cost, cur] of [["btn-pull-1", COSTS.one, "coins"], ["btn-pull-10", COSTS.ten, "coins"], ["btn-pull-gem", COSTS.gem, "gems"]]) {
      const b = $(id); if (b) b.classList.toggle("poor", w[cur] < cost);
    }

    const feat = $("banner-feat");
    if (feat) {
      feat.innerHTML = "";
      for (const f of FIGHTERS) {
        const cfg = BF.CHARACTER_ROSTER[f.id]; if (!cfg) continue;
        const has = owned(f.id);
        const t = document.createElement("div");
        t.className = `feat-tile rarity-${f.rarity}${has ? " has" : ""}`;
        const cv = document.createElement("canvas"); cv.width = 96; cv.height = 96;
        t.appendChild(cv);
        const tag = document.createElement("span"); tag.textContent = has ? LABEL[f.rarity] : "???";
        t.appendChild(tag);
        feat.appendChild(t);
        deps.drawAvatar(cv, cfg);
        if (!has) silhouette(cv);
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
  };
})();
