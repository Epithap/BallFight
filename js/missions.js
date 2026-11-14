(() => {
  const BF = (window.BallFight = window.BallFight || {});

  const STORAGE_KEY = "bf_daily_missions_v1";

  const MISSION_DEFS = [
    {
      id: "checkin",
      title: "Daily Check-In",
      desc: "Open Ball Fight today to claim your daily supply.",
      target: 1,
      rewardCoins: 150,
      rewardGems: 15,
    },
    {
      id: "matches",
      title: "Arena Brawler",
      desc: "Complete 3 matches in the arena.",
      target: 3,
      rewardCoins: 300,
      rewardGems: 25,
    },
    {
      id: "wins",
      title: "Victory Streak",
      desc: "Win 2 matches as Player 1.",
      target: 2,
      rewardCoins: 450,
      rewardGems: 35,
    },
    {
      id: "hits",
      title: "Combo Striker",
      desc: "Land 15 total hits in completed matches.",
      target: 15,
      rewardCoins: 300,
      rewardGems: 25,
    },
    {
      id: "all_clear",
      title: "Daily Champion",
      desc: "Complete all 4 daily missions above.",
      target: 4,
      rewardCoins: 600,
      rewardGems: 50,
    },
  ];

  const CORE_IDS = ["checkin", "matches", "wins", "hits"];

  let deps = {
    sound: null,
    wallet: null,
    save: null,
    onChange: null,
  };

  let state = null;

  function getTodayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function createFreshState(dateKey) {
    const progress = {};
    const claimed = {};
    for (const def of MISSION_DEFS) {
      progress[def.id] = def.id === "checkin" ? 1 : 0;
      claimed[def.id] = false;
    }
    const fresh = { dateKey, progress, claimed };
    recomputeAllClear(fresh);
    return fresh;
  }

  function recomputeAllClear(targetState) {
    let doneCount = 0;
    for (const id of CORE_IDS) {
      const def = MISSION_DEFS.find((m) => m.id === id);
      if (def && (targetState.progress[id] || 0) >= def.target) {
        doneCount += 1;
      }
    }
    targetState.progress.all_clear = doneCount;
  }

  function saveState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (_) {}
  }

  function loadState(date = new Date()) {
    const today = getTodayKey(date);
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.dateKey === today && parsed.progress && parsed.claimed) {
            state = {
              dateKey: today,
              progress: { ...createFreshState(today).progress, ...parsed.progress },
              claimed: { ...createFreshState(today).claimed, ...parsed.claimed },
            };
            state.progress.checkin = 1;
            recomputeAllClear(state);
            return state;
          }
        }
      }
    } catch (_) {}
    state = createFreshState(today);
    saveState();
    return state;
  }

  function ensureToday(date = new Date()) {
    const today = getTodayKey(date);
    if (!state || state.dateKey !== today) {
      loadState(date);
    }
    return state;
  }

  function isCompleted(def) {
    return (state.progress[def.id] || 0) >= def.target;
  }

  function hasClaimable(date = new Date()) {
    ensureToday(date);
    return MISSION_DEFS.some((def) => isCompleted(def) && !state.claimed[def.id]);
  }

  function recordMatch({ won = false, hits = 0 } = {}, date = new Date()) {
    ensureToday(date);
    const matchesDef = MISSION_DEFS.find((m) => m.id === "matches");
    const winsDef = MISSION_DEFS.find((m) => m.id === "wins");
    const hitsDef = MISSION_DEFS.find((m) => m.id === "hits");

    state.progress.matches = Math.min(matchesDef.target, (state.progress.matches || 0) + 1);
    if (won) {
      state.progress.wins = Math.min(winsDef.target, (state.progress.wins || 0) + 1);
    }
    if (hits > 0) {
      state.progress.hits = Math.min(hitsDef.target, (state.progress.hits || 0) + Math.floor(hits));
    }
    recomputeAllClear(state);
    saveState();
    render();
    return state;
  }

  function grantReward(coins, gems) {
    if (!deps.wallet) return;
    deps.wallet.coins = (deps.wallet.coins || 0) + coins;
    deps.wallet.gems = (deps.wallet.gems || 0) + gems;
  }

  function claim(id, date = new Date()) {
    ensureToday(date);
    const def = MISSION_DEFS.find((m) => m.id === id);
    if (!def || !isCompleted(def) || state.claimed[id]) {
      return null;
    }
    state.claimed[id] = true;
    grantReward(def.rewardCoins, def.rewardGems);
    saveState();
    if (typeof deps.save === "function") deps.save();
    if (typeof deps.onChange === "function") deps.onChange();
    if (deps.sound && typeof deps.sound.playWallBounce === "function") {
      deps.sound.playWallBounce();
    }
    render();
    return { coins: def.rewardCoins, gems: def.rewardGems };
  }

  function claimAll(date = new Date()) {
    ensureToday(date);
    let totalCoins = 0;
    let totalGems = 0;
    let count = 0;
    for (const def of MISSION_DEFS) {
      if (isCompleted(def) && !state.claimed[def.id]) {
        state.claimed[def.id] = true;
        totalCoins += def.rewardCoins;
        totalGems += def.rewardGems;
        count += 1;
      }
    }
    if (count === 0) return { coins: 0, gems: 0, count: 0 };
    grantReward(totalCoins, totalGems);
    saveState();
    if (typeof deps.save === "function") deps.save();
    if (typeof deps.onChange === "function") deps.onChange();
    if (deps.sound && typeof deps.sound.playWallBounce === "function") {
      deps.sound.playWallBounce();
    }
    render();
    return { coins: totalCoins, gems: totalGems, count };
  }

  function open() {
    ensureToday();
    render();
    if (typeof document === "undefined") return;
    const modal = document.getElementById("missions-modal");
    if (modal) modal.classList.remove("hidden");
  }

  function close() {
    if (typeof document === "undefined") return;
    const modal = document.getElementById("missions-modal");
    if (modal) modal.classList.add("hidden");
  }

  function render() {
    if (typeof document === "undefined") return;
    ensureToday();

    const dot = document.getElementById("mission-dot");
    if (dot) {
      dot.classList.toggle("hidden", !hasClaimable());
    }

    const dateLabel = document.getElementById("missions-date-label");
    if (dateLabel) {
      dateLabel.textContent = `DAILY RESET • ${state.dateKey}`;
    }

    const claimAllBtn = document.getElementById("btn-missions-claim-all");
    if (claimAllBtn) {
      const canClaimAny = hasClaimable();
      claimAllBtn.disabled = !canClaimAny;
      claimAllBtn.textContent = canClaimAny ? "CLAIM ALL REWARDS" : "ALL CLAIMED / IN PROGRESS";
    }

    const listEl = document.getElementById("missions-list");
    if (!listEl) return;

    listEl.innerHTML = MISSION_DEFS.map((def) => {
      const cur = Math.min(def.target, state.progress[def.id] || 0);
      const pct = Math.round((cur / def.target) * 100);
      const done = cur >= def.target;
      const claimed = !!state.claimed[def.id];
      const rowCls = claimed ? "mission-row is-claimed" : done ? "mission-row is-ready" : "mission-row";
      const btnText = claimed ? "CLAIMED" : done ? "CLAIM" : `${cur}/${def.target}`;
      const btnCls = claimed
        ? "btn mission-claim-btn"
        : done
          ? "btn btn-green mission-claim-btn"
          : "btn mission-claim-btn";
      return `
        <div class="${rowCls}" data-mission-id="${def.id}">
          <div class="mission-main">
            <div class="mission-title-row">
              <span class="mission-title">${def.title}</span>
              <span class="mission-prog-text">${cur} / ${def.target}</span>
            </div>
            <p class="mission-desc">${def.desc}</p>
            <div class="mission-prog-track"><div class="mission-prog-fill" style="width:${pct}%"></div></div>
            <div class="mission-reward-chips">
              <span class="mission-reward-chip"><svg><use href="#i-coin"/></svg>+${def.rewardCoins}</span>
              <span class="mission-reward-chip is-gem"><svg><use href="#i-gem"/></svg>+${def.rewardGems}</span>
            </div>
          </div>
          <button class="${btnCls}" type="button" data-claim-mission="${def.id}" ${!done || claimed ? "disabled" : ""}>${btnText}</button>
        </div>
      `;
    }).join("");
  }

  function wireUI() {
    if (typeof document === "undefined") return;
    const btnOpen = document.getElementById("btn-daily-missions");
    const modal = document.getElementById("missions-modal");
    const btnClose = document.getElementById("btn-missions-close");
    const btnClaimAll = document.getElementById("btn-missions-claim-all");
    const listEl = document.getElementById("missions-list");

    if (btnOpen && !btnOpen.dataset.missionsBound) {
      btnOpen.dataset.missionsBound = "1";
      btnOpen.addEventListener("click", () => {
        if (deps.sound && typeof deps.sound.unlock === "function") deps.sound.unlock();
        open();
      });
    }
    if (btnClose && !btnClose.dataset.missionsBound) {
      btnClose.dataset.missionsBound = "1";
      btnClose.addEventListener("click", close);
    }
    if (modal && !modal.dataset.missionsBound) {
      modal.dataset.missionsBound = "1";
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });
    }
    if (btnClaimAll && !btnClaimAll.dataset.missionsBound) {
      btnClaimAll.dataset.missionsBound = "1";
      btnClaimAll.addEventListener("click", () => {
        if (deps.sound && typeof deps.sound.unlock === "function") deps.sound.unlock();
        claimAll();
      });
    }
    if (listEl && !listEl.dataset.missionsBound) {
      listEl.dataset.missionsBound = "1";
      listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-claim-mission]");
        if (!btn || btn.disabled) return;
        const id = btn.getAttribute("data-claim-mission");
        if (id) claim(id);
      });
    }
  }

  function reset(date = new Date()) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
    state = createFreshState(getTodayKey(date));
    saveState();
    render();
    return state;
  }

  function init(newDeps = {}) {
    deps = { ...deps, ...newDeps };
    loadState();
    wireUI();
    render();
  }

  BF.Missions = {
    MISSION_DEFS,
    init,
    loadState,
    recordMatch,
    claim,
    claimAll,
    hasClaimable,
    open,
    close,
    render,
    reset,
    getState: () => state,
  };
})();
