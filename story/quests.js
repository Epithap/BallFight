// Story Saga Quest & Progression System (Prologue + Arc 1 Open World)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const SAVE_KEY = "bf_story_bleach_v1";

  function defaultState() {
    return {
      saga: "bleach",
      zone: "ichigo_bedroom",
      x: 215,
      y: 285,
      phase: "investigate_room",
      hasPowers: false,
      seenIntro: false,
      clinicTalked: false,
      inspected: {},
      flags: {},
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed, {
        inspected: Object.assign({}, parsed.inspected),
        flags: Object.assign({}, parsed.flags),
      });
    } catch {
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {}
  }

  function markInspected(id) {
    if (!id || id === "door") return false;
    const isNew = !state.inspected[id];
    state.inspected[id] = true;
    save();
    return isNew;
  }

  function getInspectedCount() {
    return Object.keys(state.inspected || {}).length;
  }

  function setPhase(phase) {
    state.phase = phase;
    save();
  }

  function setHasPowers(v) {
    state.hasPowers = Boolean(v);
    save();
  }

  function setZone(zone) {
    state.zone = zone;
    save();
  }

  function setFlag(key, val = true) {
    state.flags = state.flags || {};
    state.flags[key] = val;
    save();
  }

  function getFlag(key) {
    return Boolean(state.flags && state.flags[key]);
  }

  function isOpenWorldUnlocked() {
    return state.phase && state.phase.startsWith("arc1_");
  }

  function markClinicTalked() {
    state.clinicTalked = true;
    if (state.phase === "door_unlocked" || state.phase === "clinic_check") {
      state.phase = "street_hollow";
    }
    save();
  }

  function getActiveQuestSummary() {
    const p = state.phase;
    if (p === "talk_rukia") {
      return {
        title: "PROLOGUE: AN UNEXPECTED VISITOR",
        desc: "A girl in black robes appeared in your room! Talk to her (F).",
      };
    }
    if (p === "door_unlocked") {
      return {
        title: "PROLOGUE: SCREAM FROM DOWNSTAIRS",
        desc: "A Hollow is attacking Kurosaki Clinic! Head through the bedroom door (F).",
      };
    }
    if (p === "clinic_check") {
      return {
        title: "PROLOGUE: WRECKED CLINIC",
        desc: "Check on Karin, Yuzu, and Isshin in Kurosaki Clinic (F).",
      };
    }
    if (p === "street_hollow") {
      return {
        title: "PROLOGUE: STREET SHOWDOWN",
        desc: "Head out to Karakura Street (south exit) to confront the Hollow!",
      };
    }
    if (p === "ready_for_battle") {
      return {
        title: "PROLOGUE: BECOME A SHINIGAMI",
        desc: "Approach Fishbone D on Karakura Street (F) to awaken your powers!",
      };
    }
    if (p === "ep1_cleared" || p === "arc1_start") {
      return {
        title: "ARC 1: SUBSTITUTE SHINIGAMI",
        desc: "Open World unlocked! Head to Karakura High (west of Karakura Street).",
      };
    }
    if (p === "arc1_q1_school") {
      return {
        title: "Q1: FIRST DAY AT KARAKURA HIGH",
        desc: "Talk to Rukia (in her school uniform) at Karakura High (F).",
      };
    }
    if (p === "arc1_q1_kon") {
      return {
        title: "Q1B: RUNAWAY MOD-SOUL",
        desc: "A strange lion plushie is causing chaos! Catch & talk to Kon (F).",
      };
    }
    if (p === "arc1_q2_chad") {
      return {
        title: "Q2: THE CURSED PARAKEET",
        desc: "Talk to Chad & Orihime at Karakura High, then head to Riverbank Park!",
      };
    }
    if (p === "arc1_q2_shrieker") {
      return {
        title: "Q2B: HUNT SHRIEKER",
        desc: "Go to Riverbank Park (south of Karakura Street) and defeat Shrieker (F)!",
      };
    }
    if (p === "arc1_q2_done") {
      return {
        title: "ARC 1 OPEN WORLD (Q2 CLEAR!)",
        desc: "Explore Karakura Town, Clinic, High School & Urahara Shop! (Grand Fisher next!)",
      };
    }
    const count = getInspectedCount();
    return {
      title: "PROLOGUE: RESTLESS NIGHT",
      desc: `Inspect your room (${Math.min(count, 2)}/2 clues) before going to sleep.`,
    };
  }

  function reset() {
    state = defaultState();
    save();
  }

  S.Quests = {
    getState: () => state,
    save,
    markInspected,
    getInspectedCount,
    setPhase,
    setHasPowers,
    setZone,
    setFlag,
    getFlag,
    isOpenWorldUnlocked,
    markClinicTalked,
    getActiveQuestSummary,
    reset,
  };
})();
