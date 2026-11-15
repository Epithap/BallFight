// Story Saga Quest & Progression System (Bleach Episode 1 — Phase 3)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const SAVE_KEY = "bf_story_bleach_v1";

  function defaultState() {
    return {
      saga: "bleach",
      zone: "ichigo_bedroom",
      x: 215,
      y: 285,
      phase: "investigate_room", // "investigate_room" | "talk_rukia" | "door_unlocked" | "clinic_check" | "street_hollow" | "phase3_complete"
      hasPowers: false,
      seenIntro: false,
      clinicTalked: false,
      inspected: {},
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
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

  function markClinicTalked() {
    state.clinicTalked = true;
    if (state.phase === "door_unlocked" || state.phase === "clinic_check") {
      state.phase = "street_hollow";
    }
    save();
  }

  function getActiveQuestSummary() {
    if (state.phase === "talk_rukia") {
      return {
        title: "EP. 1: AN UNEXPECTED VISITOR",
        desc: "A girl in black robes appeared in your room! Walk up and talk to her (F).",
      };
    }
    if (state.phase === "door_unlocked") {
      return {
        title: "EP. 1: SCREAM FROM DOWNSTAIRS",
        desc: "A Hollow is attacking Kurosaki Clinic! Head through the bedroom door (F).",
      };
    }
    if (state.phase === "clinic_check") {
      return {
        title: "EP. 1: WRECKED CLINIC",
        desc: "Check on Karin, Yuzu, and Isshin in Kurosaki Clinic (F).",
      };
    }
    if (state.phase === "street_hollow") {
      return {
        title: "EP. 1: FISHBONE D",
        desc: "Step outside to Karakura Street and confront the Hollow (F)!",
      };
    }
    if (state.phase === "phase3_complete" || state.phase === "ready_for_battle") {
      return {
        title: "EP. 1: SUBSTITUTE SHINIGAMI",
        desc: "You awakened your Shinigami powers! (Hollow Boss Battle coming next)",
      };
    }
    const count = Math.min(2, getInspectedCount());
    return {
      title: "EP. 1: DEATH & STRAWBERRY",
      desc: `Something eerie is outside Karakura Town. Inspect your room (${count}/2).`,
    };
  }

  S.Quests = {
    getState: () => state,
    save,
    reset: () => {
      state = defaultState();
      save();
    },
    markInspected,
    getInspectedCount,
    setPhase,
    setHasPowers,
    setZone,
    markClinicTalked,
    getActiveQuestSummary,
  };
})();
