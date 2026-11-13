(() => {
  const BF = (window.BallFight = window.BallFight || {});

  BF.WORLD_SIZE = 500;
  BF.HIT_COOLDOWN = 0.08; // seconds
  BF.HIT_STOP_DURATION = 0.035; // seconds
  BF.DAMAGE_VARIATION = 0.15; // +/- 15% random variance
  BF.MIN_COMPONENT_RATIO = 0.22;
  BF.BOUNCE_KICK = 1.08;
  BF.ROUNDS_TO_WIN = 2;
  BF.KO_SLOWMO_DURATION = 0.8; // real seconds
  BF.KO_SLOWMO_SCALE = 0.25;
  BF.KO_ZOOM_SCALE = 1.38;
  BF.CRIT_CHANCE = 0.07; // 7% crit chance
  BF.CRIT_DAMAGE = 25;
  BF.ULT_CHARGES_REQUIRED = 5;

  BF.COLORS = {
    ink: "#2b1b3d",
    floorA: "#a8e6cf",
    floorB: "#97dcc2",
    red: "#ff5a5f",
    blue: "#3da5ff",
    white: "#ffffff",
    gold: "#ffc93c",
    green: "#3ddc84",
    orange: "#ff7b29",
    narutoOrange: "#ff9f1c",
    ichigoDark: "#363b47",
    silver: "#d8dee9",
    skin: "#ffd1a9",
    dioYellow: "#fbc531",
    dioGreen: "#2ecc71",
  };
  BF.FONT = '"Lilita One", "Baloo 2", "Trebuchet MS", system-ui, sans-serif';

  BF.mulberry32 = function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  BF.resolveInitialSeed = function resolveInitialSeed() {
    const raw = new URLSearchParams(window.location.search).get("seed");
    if (raw !== null && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return Math.floor(Math.abs(parsed)) >>> 0;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
      }
      return hash >>> 0;
    }
    return Math.floor(Math.random() * 1000000);
  };

  BF.easeOut = function easeOut(p) {
    return 1 - Math.pow(1 - p, 3);
  };

  BF.CHARACTER_ROSTER = {};
  BF.TRANSFORM_DETAILS = {};
  BF.COSTUME_DRAWERS = {};
  BF.WEAPON_DRAWERS = {};
  BF.SKILLS = {};
  BF.rt = {};
})();

