(() => {
  const WORLD_SIZE = 500;
  const HIT_COOLDOWN = 0.08; // seconds
  const HIT_STOP_DURATION = 0.035; // seconds
  const DAMAGE_VARIATION = 0.15; // +/- 15% random variance
  const MIN_COMPONENT_RATIO = 0.22;
  const BOUNCE_KICK = 1.08;
  const ROUNDS_TO_WIN = 2;
  const KO_SLOWMO_DURATION = 0.8; // real seconds
  const KO_SLOWMO_SCALE = 0.25;
  const KO_ZOOM_SCALE = 1.38;
  const CRIT_CHANCE = 0.001; // 0.1%
  const CRIT_DAMAGE = 25;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resolveInitialSeed() {
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
  }

  const COLORS = {
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
  };
  const FONT = '"Lilita One", "Baloo 2", "Trebuchet MS", system-ui, sans-serif';

  // Helper to spawn a solid-outlined projectile entity aimed at the opponent
  function spawnProjectile({ owner, target, x, y, speed, radius, damage, color, label, shape, onImpact }) {
    const dx = target.x - x;
    const dy = target.y - y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;
    const angle = Math.atan2(vy, vx);

    return {
      x,
      y,
      vx,
      vy,
      radius,
      angle,
      dead: false,
      update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Out of arena bounds
        if (
          this.x < -this.radius ||
          this.x > WORLD_SIZE + this.radius ||
          this.y < -this.radius ||
          this.y > WORLD_SIZE + this.radius
        ) {
          this.dead = true;
          return;
        }

        if (!target.alive) return;
        const dist = Math.hypot(target.x - this.x, target.y - this.y);
        if (dist <= target.radius + this.radius) {
          this.dead = true;
          const dealt = game.applyDamage(target, damage);
          target.flashTimer = 0.1;
          target.squash = 0.8;
          game.spawnSparks(this.x, this.y, color, target.color);
          game.spawnDamageText(target.x, target.y - target.radius * 0.5, dealt, color, false, label);
          game.sound.playBallHit();
          if (onImpact) onImpact(target, game);
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.fillStyle = color;

        if (shape === "crescent") {
          // Getsuga Tensho crescent slash
          c.beginPath();
          c.arc(0, 0, this.radius * 1.4, -Math.PI * 0.45, Math.PI * 0.45);
          c.quadraticCurveTo(this.radius * 0.35, 0, Math.cos(-Math.PI * 0.45) * this.radius * 1.4, Math.sin(-Math.PI * 0.45) * this.radius * 1.4);
          c.closePath();
          c.fill();
          c.stroke();
        } else {
          // Kamehameha energy blast
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.35, this.radius * 0.9, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = COLORS.white;
          c.beginPath();
          c.arc(this.radius * 0.2, 0, this.radius * 0.4, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
    };
  }

  const SKILL_KAMEHAMEHA = {
    name: "Kamehameha",
    cooldown: 4.2,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      game.entities.push(
        spawnProjectile({
          owner: ball,
          target,
          x: ball.x,
          y: ball.y,
          speed: 540,
          radius: 13,
          damage: 13,
          color: COLORS.blue,
          label: "KAMEHAMEHA!",
          shape: "blast",
          onImpact(t, g) {
            g.addEffect(t, "slow", 0.7, { factor: 0.65 });
          },
        })
      );
      return true;
    },
  };

  const SKILL_RASENGAN = {
    name: "Rasengan",
    cooldown: 3.4,
    onHit(ball, other, game, info) {
      if (!other.alive) return false;
      const bonus = game.applyDamage(other, 7);
      game.addEffect(other, "stun", 0.55);
      game.spawnDamageText(other.x, other.y - other.radius - 12, bonus, COLORS.blue, false, "RASENGAN!");
      game.entities.push({
        x: info.midX,
        y: info.midY,
        r: 10,
        life: 0.25,
        maxLife: 0.25,
        dead: false,
        update(dt) {
          this.life -= dt;
          this.r += 160 * dt;
          if (this.life <= 0) this.dead = true;
        },
        render(c) {
          const k = Math.max(0, this.life / this.maxLife);
          c.save();
          c.globalAlpha = k;
          c.beginPath();
          c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          c.fillStyle = COLORS.blue;
          c.fill();
          c.lineWidth = 4;
          c.strokeStyle = COLORS.ink;
          c.stroke();
          c.restore();
        },
      });
      return true;
    },
  };

  const SKILL_GEAR_SECOND = {
    name: "Gear Second",
    cooldown: 3.0,
    onWallBounce(ball, game) {
      game.addEffect(ball, "haste", 1.6, { factor: 1.38 });
      game.addEffect(ball, "shield", 1.6, { reduction: 0.3 });
      game.spawnDamageText(ball.x, ball.y - ball.radius, 0, COLORS.red, false, "GEAR 2!");
      game.spawnSparks(ball.x, ball.y, COLORS.white, COLORS.red);
      return true;
    },
  };

  const SKILL_GETSUGA = {
    name: "Getsuga Tensho",
    cooldown: 3.8,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      game.entities.push(
        spawnProjectile({
          owner: ball,
          target,
          x: ball.x,
          y: ball.y,
          speed: 520,
          radius: 15,
          damage: 12,
          color: COLORS.blue,
          label: "GETSUGA!",
          shape: "crescent",
          onImpact(t, g) {
            g.addEffect(t, "slow", 0.8, { factor: 0.7 });
          },
        })
      );
      return true;
    },
  };

  const CHARACTER_ROSTER = {
    goku: {
      id: "goku",
      name: "GOKU",
      color: COLORS.orange,
      radius: 28,
      speed: 365,
      maxHp: 105,
      damage: [9, 15],
      mass: 1.05,
      costume: "goku",
      weapon: "nyoibo",
      skills: [SKILL_KAMEHAMEHA],
    },
    naruto: {
      id: "naruto",
      name: "NARUTO",
      color: COLORS.narutoOrange,
      radius: 27,
      speed: 380,
      maxHp: 100,
      damage: [8, 14],
      mass: 0.95,
      costume: "naruto",
      weapon: "kunai",
      skills: [SKILL_RASENGAN],
    },
    luffy: {
      id: "luffy",
      name: "LUFFY",
      color: COLORS.red,
      radius: 28,
      speed: 355,
      maxHp: 115,
      damage: [9, 16],
      mass: 1.1,
      costume: "luffy",
      weapon: "gomu_fist",
      skills: [SKILL_GEAR_SECOND],
    },
    ichigo: {
      id: "ichigo",
      name: "ICHIGO",
      color: COLORS.ichigoDark,
      radius: 28,
      speed: 370,
      maxHp: 100,
      damage: [10, 16],
      mass: 1.0,
      costume: "ichigo",
      weapon: "zangetsu",
      skills: [SKILL_GETSUGA],
    },
  };

  const selectedRosterIds = ["goku", "naruto"];
  const BALL_CONFIGS = [
    CHARACTER_ROSTER[selectedRosterIds[0]],
    CHARACTER_ROSTER[selectedRosterIds[1]],
  ];

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
  }

  class Ball {
    constructor(config, { x, y, angle }) {
      this.name = config.name;
      this.color = config.color;
      this.radius = config.radius;
      this.baseSpeed = config.speed;
      this.hp = config.maxHp;
      this.maxHp = config.maxHp;
      this.damageRange = config.damage;
      this.mass = config.mass;
      this.costume = config.costume || null;
      this.weapon = config.weapon || null;
      this.weaponAngle = angle;
      this.skills = (config.skills || []).map((s) => ({ ...s, _cd: 0 }));
      this.effects = [];

      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * this.baseSpeed;
      this.vy = Math.sin(angle) * this.baseSpeed;
      this.flashTimer = 0;
      this.squash = 0;
      this.alive = true;
    }

    normalizeSpeed() {
      const targetSpeed = this.baseSpeed;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed === 0) {
        const a = rng() * Math.PI * 2;
        this.vx = Math.cos(a) * targetSpeed;
        this.vy = Math.sin(a) * targetSpeed;
        return;
      }
      // Smoothly return toward targetSpeed while preserving direction
      const target = speed + (targetSpeed - speed) * 0.12;
      this.vx = (this.vx / speed) * target;
      this.vy = (this.vy / speed) * target;
    }

    preventAxisLock() {
      const targetSpeed = this.baseSpeed;
      const minComponent = targetSpeed * MIN_COMPONENT_RATIO;
      if (Math.abs(this.vx) < minComponent) {
        this.vx = (this.vx >= 0 ? 1 : -1) * minComponent;
      }
      if (Math.abs(this.vy) < minComponent) {
        this.vy = (this.vy >= 0 ? 1 : -1) * minComponent;
      }
      const speed = Math.hypot(this.vx, this.vy);
      this.vx = (this.vx / speed) * targetSpeed;
      this.vy = (this.vy / speed) * targetSpeed;
    }

    getEffect(type) {
      return this.effects.find((e) => e.type === type) || null;
    }

    getSpeedMultiplier() {
      if (this.getEffect("stun")) return 0;
      let mult = 1;
      for (const eff of this.effects) {
        if (eff.type === "slow") {
          mult *= eff.data?.factor ?? 0.5;
        } else if (eff.type === "haste") {
          mult *= eff.data?.factor ?? 1.35;
        }
      }
      return mult;
    }

    updateEffects(dt) {
      for (let i = this.effects.length - 1; i >= 0; i--) {
        this.effects[i].duration -= dt;
        if (this.effects[i].duration <= 0) {
          this.effects.splice(i, 1);
        }
      }
    }
  }

  // DOM elements
  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");

  const btnPlay = document.getElementById("btn-play");
  const btnReset = document.getElementById("btn-reset");
  const btnSpeed = document.getElementById("btn-speed");
  const btnSound = document.getElementById("btn-sound");
  const btnRematch = document.getElementById("btn-rematch");
  const btnRec = document.getElementById("btn-rec");
  const btnRecExit = document.getElementById("btn-rec-exit");
  const btnRoster = document.getElementById("btn-roster");
  const btnChangeChar = document.getElementById("btn-change-char");
  const btnFight = document.getElementById("btn-fight");

  const selectScreen = document.getElementById("select-screen");
  const previewP1 = document.getElementById("preview-p1");
  const previewP2 = document.getElementById("preview-p2");
  const previewName1 = document.getElementById("preview-name-1");
  const previewName2 = document.getElementById("preview-name-2");
  const skillDesc1 = document.getElementById("skill-desc-1");
  const skillDesc2 = document.getElementById("skill-desc-2");
  const pickerP1 = document.getElementById("picker-p1");
  const pickerP2 = document.getElementById("picker-p2");

  const name1 = document.getElementById("name-1");
  const name2 = document.getElementById("name-2");
  const hpText1 = document.getElementById("hp-text-1");
  const hpText2 = document.getElementById("hp-text-2");
  const hpBar1 = document.getElementById("hp-bar-1");
  const hpBar2 = document.getElementById("hp-bar-2");
  const dots1 = document.getElementById("dots-1");
  const dots2 = document.getElementById("dots-2");
  const skillHud1 = document.getElementById("skill-hud-1");
  const skillHud2 = document.getElementById("skill-hud-2");

  const overlay = document.getElementById("overlay");
  const overlayStamp = document.getElementById("overlay-stamp");
  const winnerText = document.getElementById("winner-text");
  const statsText = document.getElementById("stats-text");
  const statusHits = document.getElementById("status-hits");
  const statusTime = document.getElementById("status-time");
  const seedDisplay = document.getElementById("seed-display");

  const sound = new SoundEngine();

  let matchSeed = resolveInitialSeed();
  let rng = mulberry32(matchSeed);

  let balls = [];
  let particles = [];
  let floatingTexts = [];
  let entities = [];
  let scores = [0, 0];
  let currentRound = 1;
  let selecting = true;
  let running = false;
  let roundOver = false;
  let matchOver = false;
  let recMode = false;
  let speedMultiplier = 1;
  let hitCooldown = 0;
  let hitStop = 0;
  let shakeTime = 0;
  let shakeIntensity = 0;
  let totalHits = 0;
  let elapsed = 0;
  let koSequence = null;
  let cameraZoom = 1;
  let cameraX = WORLD_SIZE * 0.5;
  let cameraY = WORLD_SIZE * 0.5;
  let lastTime = performance.now();

  function randomStartAngle(facingRight) {
    const spread = (rng() - 0.5) * 1.1; // +/- ~31 deg
    const verticalOffset = (rng() > 0.5 ? 1 : -1) * (0.35 + rng() * 0.45);
    return (facingRight ? 0 : Math.PI) + spread + verticalOffset;
  }

  const game = {
    get balls() { return balls; },
    get entities() { return entities; },
    rng: () => rng(),
    spawnSparks,
    spawnDamageText,
    applyDamage,
    addEffect,
    sound,
  };

  function addEffect(ball, type, duration, data = {}) {
    const existing = ball.getEffect(type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.data = { ...existing.data, ...data };
      return;
    }
    ball.effects.push({ type, duration, data });
  }

  function runSkillHook(ball, hookName, ...args) {
    for (const skill of ball.skills) {
      if (typeof skill[hookName] !== "function" || skill._cd > 0) continue;
      const result = skill[hookName](ball, ...args);
      if (skill.cooldown > 0 && result !== false) {
        skill._cd = skill.cooldown;
      }
    }
  }

  function computeCollisionDamage(attacker, impactSpeed, maxImpact) {
    if (rng() < CRIT_CHANCE) {
      return { amount: CRIT_DAMAGE, isCrit: true };
    }
    const [minDmg, maxDmg] = attacker.damageRange;
    const ratio = maxImpact > 0 ? Math.min(1, Math.max(0, impactSpeed / maxImpact)) : 0.5;
    const base = minDmg + ratio * (maxDmg - minDmg);
    const variance = 1 + (rng() * 2 - 1) * DAMAGE_VARIATION;
    return { amount: Math.max(1, Math.round(base * variance)), isCrit: false };
  }

  function applyDamage(ball, rawAmount) {
    let dmg = rawAmount;
    const shield = ball.getEffect("shield");
    if (shield && dmg > 0) {
      const reduction = shield.data?.reduction ?? 0.35;
      dmg = Math.max(1, dmg * (1 - reduction));
    }
    const amount = Math.max(0, Math.round(dmg));
    if (amount <= 0) return 0;
    ball.hp = Math.max(0, ball.hp - amount);
    runSkillHook(ball, "onDamaged", amount, game);
    return amount;
  }

  function updateRoundDots() {
    const renderDots = (container, score, color) => {
      if (!container) return;
      const items = container.querySelectorAll(".round-dot");
      items.forEach((dot, i) => {
        dot.style.background = i < score ? color : COLORS.white;
      });
    };
    renderDots(dots1, scores[0], BALL_CONFIGS[0].color);
    renderDots(dots2, scores[1], BALL_CONFIGS[1].color);
  }

  function syncFighterUI() {
    if (name1) {
      name1.textContent = BALL_CONFIGS[0].name;
      name1.style.background = BALL_CONFIGS[0].color;
    }
    if (name2) {
      name2.textContent = BALL_CONFIGS[1].name;
      name2.style.background = BALL_CONFIGS[1].color;
    }
    hpBar1.style.background = BALL_CONFIGS[0].color;
    hpBar2.style.background = BALL_CONFIGS[1].color;
  }

  function initRound() {
    balls = BALL_CONFIGS.map((cfg, index) => {
      const facingRight = index % 2 === 0;
      const xRatio = BALL_CONFIGS.length === 2
        ? (index === 0 ? 0.25 : 0.75)
        : (index + 1) / (BALL_CONFIGS.length + 1);
      return new Ball(cfg, {
        x: WORLD_SIZE * xRatio,
        y: WORLD_SIZE * (0.35 + rng() * 0.3),
        angle: randomStartAngle(facingRight),
      });
    });

    entities = [];
    particles = [];
    floatingTexts = [];
    hitCooldown = 0;
    hitStop = 0;
    shakeTime = 0;
    shakeIntensity = 0;
    totalHits = 0;
    elapsed = 0;
    koSequence = null;
    cameraZoom = 1;
    cameraX = WORLD_SIZE * 0.5;
    cameraY = WORLD_SIZE * 0.5;
    roundOver = false;
    running = true;

    overlay.classList.add("hidden");
    btnPlay.textContent = "PAUSE";
    updateHUD();
  }

  function initMatch() {
    rng = mulberry32(matchSeed);
    if (seedDisplay) seedDisplay.textContent = String(matchSeed);
    scores = [0, 0];
    currentRound = 1;
    matchOver = false;
    syncFighterUI();
    updateRoundDots();
    initRound();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  function spawnSparks(x, y, colorA, colorB) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 110 + Math.random() * 190;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.floor(Math.random() * 4),
        life: 0.22 + Math.random() * 0.14,
        maxLife: 0.36,
        color: i % 2 === 0 ? colorA : colorB,
      });
    }
  }

  function spawnCritBurst(x, y) {
    const confettiColors = [COLORS.red, COLORS.blue, COLORS.gold, COLORS.green, COLORS.white];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.25;
      const speed = 150 + Math.random() * 260;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.floor(Math.random() * 5),
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color: confettiColors[i % confettiColors.length],
        shape: i % 2 === 0 ? "square" : "circle",
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
      });
    }

    // Expanding solid-outlined shockwave ring entity
    entities.push({
      x,
      y,
      radius: 12,
      maxRadius: 115,
      life: 0.34,
      maxLife: 0.34,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        const progress = 1 - this.life / this.maxLife;
        this.radius = 12 + (this.maxRadius - 12) * (1 - Math.pow(1 - progress, 2));
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = k;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.lineWidth = 8 * k + 2;
        c.strokeStyle = COLORS.ink;
        c.stroke();
        c.lineWidth = 4 * k + 1;
        c.strokeStyle = COLORS.gold;
        c.stroke();
        c.restore();
      },
    });
  }

  function spawnDamageText(x, y, dmg, color, isCrit = false, customLabel = null) {
    let text = `-${dmg}`;
    if (isCrit) {
      text = `CRIT! -${dmg}`;
    } else if (customLabel) {
      text = dmg > 0 ? `${customLabel} -${dmg}` : customLabel;
    }
    floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - (isCrit ? 26 : 16),
      vy: isCrit ? -70 : -55,
      text,
      color: isCrit ? COLORS.red : (customLabel ? color : COLORS.gold),
      isCrit,
      life: isCrit ? 0.95 : 0.65,
      maxLife: isCrit ? 0.95 : 0.65,
    });
  }

  function pulse(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function updateSkillPill(el, ball) {
    if (!el || !ball) return;
    const skill = ball.skills[0];
    const fill = el.querySelector(".skill-fill");
    const label = el.querySelector(".skill-label");
    if (!skill) {
      el.classList.remove("ready");
      if (fill) fill.style.width = "0%";
      if (label) label.textContent = "NO SKILL";
      return;
    }
    const maxCd = skill.cooldown || 1;
    const cd = Math.max(0, skill._cd || 0);
    const ready = cd <= 0.01;
    const pct = ready ? 100 : Math.max(0, Math.min(100, ((maxCd - cd) / maxCd) * 100));
    el.classList.toggle("ready", ready);
    if (fill) fill.style.width = `${pct}%`;
    if (label) {
      const shortName = skill.name.toUpperCase();
      label.textContent = ready ? `${shortName} • READY` : `${shortName} • ${cd.toFixed(1)}S`;
    }
  }

  function updateHUD() {
    const [b1, b2] = balls;
    if (!b1 || !b2) return;
    const hp1 = Math.max(0, Math.ceil(b1.hp));
    const hp2 = Math.max(0, Math.ceil(b2.hp));

    hpText1.textContent = `${hp1} / ${b1.maxHp}`;
    hpText2.textContent = `${hp2} / ${b2.maxHp}`;
    hpBar1.style.width = `${(hp1 / b1.maxHp) * 100}%`;
    hpBar2.style.width = `${(hp2 / b2.maxHp) * 100}%`;

    updateSkillPill(skillHud1, b1);
    updateSkillPill(skillHud2, b2);

    statusHits.textContent = `HITS: ${totalHits}`;
    statusTime.textContent = `TIME: ${elapsed.toFixed(1)}S`;
  }

  function startKOSequence(targetX, targetY, winnerIndex) {
    sound.playKO();
    if (navigator.vibrate) navigator.vibrate([60, 40, 140]);
    koSequence = {
      timer: 0,
      duration: KO_SLOWMO_DURATION,
      targetX,
      targetY,
      winnerIndex,
    };
  }

  function finishRound(winnerIndex) {
    roundOver = true;
    running = false;
    btnPlay.textContent = "START";

    if (winnerIndex >= 0 && winnerIndex < scores.length) {
      scores[winnerIndex] += 1;
      updateRoundDots();
    }

    const winner = winnerIndex >= 0 ? balls[winnerIndex] : null;
    const isMatchEnd = scores[0] >= ROUNDS_TO_WIN || scores[1] >= ROUNDS_TO_WIN;
    matchOver = isMatchEnd;

    if (isMatchEnd) {
      if (overlayStamp) overlayStamp.textContent = "MATCH WINNER";
      btnRematch.textContent = "REMATCH";
    } else {
      if (overlayStamp) overlayStamp.textContent = `ROUND ${currentRound}`;
      btnRematch.textContent = "NEXT ROUND";
    }

    if (winner) {
      winnerText.textContent = `${winner.name} WINS!`;
      winnerText.style.color = winner.color;
    } else {
      winnerText.textContent = "DOUBLE KO!";
      winnerText.style.color = COLORS.white;
    }

    statsText.textContent = `${totalHits} HITS • ${elapsed.toFixed(1)}S`;
    overlay.classList.remove("hidden");
  }

  function handleWallCollisions(ball) {
    let bounced = false;

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      bounced = true;
    } else if (ball.x + ball.radius > WORLD_SIZE) {
      ball.x = WORLD_SIZE - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      bounced = true;
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      bounced = true;
    } else if (ball.y + ball.radius > WORLD_SIZE) {
      ball.y = WORLD_SIZE - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      bounced = true;
    }

    if (bounced) {
      ball.squash = Math.max(ball.squash, 0.6);
      ball.preventAxisLock();
      sound.playWallBounce();
      runSkillHook(ball, "onWallBounce", game);
    }
  }

  function handleBallCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;

    if (dist >= minDist || dist === 0) return;

    // Collision normal
    const nx = dx / dist;
    const ny = dy / dist;

    // Mass-weighted positional correction (prevent overlap)
    const invM1 = 1 / b1.mass;
    const invM2 = 1 / b2.mass;
    const invMassSum = invM1 + invM2;
    const corr = (minDist - dist) + 1;
    b1.x -= nx * corr * (invM1 / invMassSum);
    b1.y -= ny * corr * (invM1 / invMassSum);
    b2.x += nx * corr * (invM2 / invMassSum);
    b2.y += ny * corr * (invM2 / invMassSum);

    // Relative velocity along normal
    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    const impactSpeed = Math.max(0, -velAlongNormal);

    // Elastic impulse using per-ball mass (restitution = 1)
    if (velAlongNormal < 0) {
      const j = (-2 * velAlongNormal) / invMassSum;
      b1.vx -= j * invM1 * nx;
      b1.vy -= j * invM1 * ny;
      b2.vx += j * invM2 * nx;
      b2.vy += j * invM2 * ny;

      // Slight kick for snappy bounce
      b1.vx *= BOUNCE_KICK;
      b1.vy *= BOUNCE_KICK;
      b2.vx *= BOUNCE_KICK;
      b2.vy *= BOUNCE_KICK;
    }

    if (hitCooldown <= 0) {
      hitCooldown = HIT_COOLDOWN;
      totalHits += 1;

      const maxImpact = b1.baseSpeed + b2.baseSpeed;
      const hitB2 = computeCollisionDamage(b1, impactSpeed, maxImpact);
      const hitB1 = computeCollisionDamage(b2, impactSpeed, maxImpact);

      const dmgToB1 = applyDamage(b1, hitB1.amount);
      const dmgToB2 = applyDamage(b2, hitB2.amount);
      const anyCrit = hitB1.isCrit || hitB2.isCrit;

      b1.flashTimer = anyCrit ? 0.14 : 0.085;
      b2.flashTimer = anyCrit ? 0.14 : 0.085;
      b1.squash = 1;
      b2.squash = 1;
      pulse(hpBar1.closest(".hp"), "hit");
      pulse(hpBar2.closest(".hp"), "hit");
      pulse(statusHits, "bump");
      if (navigator.vibrate) navigator.vibrate(anyCrit ? [30, 20, 40] : 18);

      const midX = (b1.x + b2.x) * 0.5;
      const midY = (b1.y + b2.y) * 0.5;

      if (anyCrit) {
        spawnCritBurst(midX, midY);
        hitStop = 0.09;
        shakeTime = 0.22;
        shakeIntensity = 9;
        sound.playCritHit();
      } else {
        spawnSparks(midX, midY, b1.color, b2.color);
        hitStop = HIT_STOP_DURATION;
        shakeTime = 0.11;
        shakeIntensity = 4;
        sound.playBallHit();
      }

      spawnDamageText(b1.x, b1.y - b1.radius * 0.5, dmgToB1, COLORS.white, hitB1.isCrit);
      spawnDamageText(b2.x, b2.y - b2.radius * 0.5, dmgToB2, COLORS.white, hitB2.isCrit);

      runSkillHook(b1, "onHit", b2, game, { damageDealt: dmgToB2, isCrit: hitB2.isCrit, impactSpeed, nx, ny, midX, midY });
      runSkillHook(b2, "onHit", b1, game, { damageDealt: dmgToB1, isCrit: hitB1.isCrit, impactSpeed, nx: -nx, ny: -ny, midX, midY });

      checkKO(midX, midY);
    }
  }

  function checkKO(focusX, focusY) {
    if (koSequence || roundOver || matchOver) return;
    const [b1, b2] = balls;
    if (b1.hp <= 0 && b2.hp <= 0) {
      b1.alive = false;
      b2.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b1.x, focusY ?? b1.y, -1);
    } else if (b1.hp <= 0) {
      b1.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b1.x, focusY ?? b1.y, 1);
    } else if (b2.hp <= 0) {
      b2.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b2.x, focusY ?? b2.y, 0);
    } else {
      updateHUD();
    }
  }

  function step(dt) {
    if (!running || roundOver || matchOver) return;

    let timeScale = speedMultiplier;
    if (koSequence) {
      koSequence.timer += dt;
      const t = Math.min(1, koSequence.timer / koSequence.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      cameraZoom = 1 + (KO_ZOOM_SCALE - 1) * ease;
      cameraX = WORLD_SIZE * 0.5 + (koSequence.targetX - WORLD_SIZE * 0.5) * ease;
      cameraY = WORLD_SIZE * 0.5 + (koSequence.targetY - WORLD_SIZE * 0.5) * ease;
      timeScale = speedMultiplier * KO_SLOWMO_SCALE;

      if (koSequence.timer >= koSequence.duration) {
        const winnerIndex = koSequence.winnerIndex;
        koSequence = null;
        cameraZoom = 1;
        cameraX = WORLD_SIZE * 0.5;
        cameraY = WORLD_SIZE * 0.5;
        finishRound(winnerIndex);
        return;
      }
    }

    const scaledDt = dt * timeScale;

    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
    }

    if (hitStop > 0) {
      hitStop = Math.max(0, hitStop - dt);
      return;
    }

    elapsed += scaledDt;
    if (hitCooldown > 0) {
      hitCooldown = Math.max(0, hitCooldown - scaledDt);
    }

    for (const ball of balls) {
      if (!ball.alive) continue;
      if (ball.flashTimer > 0) {
        ball.flashTimer = Math.max(0, ball.flashTimer - dt);
      }
      if (ball.squash > 0) {
        ball.squash = Math.max(0, ball.squash - dt * 5);
      }
      ball.weaponAngle += dt * 4.2;
      ball.updateEffects(scaledDt);
      for (const skill of ball.skills) {
        if (skill._cd > 0) skill._cd = Math.max(0, skill._cd - scaledDt);
      }
      runSkillHook(ball, "onTick", game, scaledDt);

      const speedFactor = ball.getSpeedMultiplier();
      if (speedFactor > 0) {
        ball.x += ball.vx * speedFactor * scaledDt;
        ball.y += ball.vy * speedFactor * scaledDt;
        ball.normalizeSpeed();
        handleWallCollisions(ball);
      }
    }

    if (balls[0].alive && balls[1].alive) {
      handleBallCollision(balls[0], balls[1]);
    }

    // Update extra entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
      if (!ent.dead && typeof ent.update === "function") {
        ent.update(scaledDt, game);
      }
      if (ent.dead) {
        entities.splice(i, 1);
      }
    }

    checkKO();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * scaledDt;
      p.y += p.vy * scaledDt;
      if (p.vRot) p.rot = (p.rot || 0) + p.vRot * scaledDt;
      p.life -= scaledDt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y += t.vy * scaledDt;
      t.life -= scaledDt;
      if (t.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    updateHUD();
  }

  function drawWeapon(ball, c = ctx) {
    if (!ball.weapon) return;
    const r = ball.radius;
    const orbitR = r + 10;
    const ang = ball.weaponAngle;

    c.save();
    c.translate(ball.x, ball.y);
    c.rotate(ang);
    c.translate(orbitR, 0);
    c.rotate(Math.PI * 0.25);
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";

    if (ball.weapon === "nyoibo") {
      // Goku's Power Pole
      c.fillStyle = COLORS.red;
      c.fillRect(-4, -22, 8, 44);
      c.strokeRect(-4, -22, 8, 44);
      c.fillStyle = COLORS.gold;
      c.fillRect(-5, -22, 10, 6);
      c.strokeRect(-5, -22, 10, 6);
      c.fillRect(-5, 16, 10, 6);
      c.strokeRect(-5, 16, 10, 6);
    } else if (ball.weapon === "kunai") {
      // Naruto's Kunai
      c.fillStyle = COLORS.silver;
      c.beginPath();
      c.moveTo(0, -20);
      c.lineTo(7, -4);
      c.lineTo(0, 2);
      c.lineTo(-7, -4);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.red;
      c.fillRect(-2.5, 2, 5, 10);
      c.strokeRect(-2.5, 2, 5, 10);
      c.beginPath();
      c.arc(0, 15, 4, 0, Math.PI * 2);
      c.stroke();
    } else if (ball.weapon === "gomu_fist") {
      // Luffy's Gomu-Gomu Fist
      c.fillStyle = COLORS.skin;
      c.beginPath();
      c.arc(0, 0, 11, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.red;
      c.fillRect(-6, 7, 12, 7);
      c.strokeRect(-6, 7, 12, 7);
    } else if (ball.weapon === "zangetsu") {
      // Ichigo's Zangetsu Cleaver
      c.fillStyle = COLORS.silver;
      c.beginPath();
      c.moveTo(-4, 8);
      c.lineTo(-4, -28);
      c.lineTo(8, -18);
      c.lineTo(5, 8);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.ink;
      c.fillRect(-4, -24, 4, 32);
      c.fillStyle = COLORS.red;
      c.fillRect(-3, 8, 6, 10);
      c.strokeRect(-3, 8, 6, 10);
    }
    c.restore();
  }

  function drawCostume(ball, r, c = ctx) {
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";

    if (ball.costume === "goku") {
      // Blue undershirt V-collar & belt at bottom (clipped to ball)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = COLORS.blue;
      c.beginPath();
      c.moveTo(-r * 0.95, r * 0.52);
      c.lineTo(0, r * 0.72);
      c.lineTo(r * 0.95, r * 0.52);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();

      // Iconic asymmetric spiky Saiyan hair silhouette
      c.fillStyle = COLORS.ink;
      c.beginPath();
      c.moveTo(-r * 0.92, -r * 0.18);
      c.lineTo(-r * 1.38, -r * 0.42);
      c.lineTo(-r * 0.98, -r * 0.58);
      c.lineTo(-r * 1.32, -r * 0.96);
      c.lineTo(-r * 0.7, -r * 0.86);
      c.lineTo(-r * 0.48, -r * 1.36);
      c.lineTo(-r * 0.05, -r * 0.96);
      c.lineTo(r * 0.32, -r * 1.44);
      c.lineTo(r * 0.55, -r * 0.92);
      c.lineTo(r * 1.18, -r * 1.18);
      c.lineTo(r * 0.92, -r * 0.68);
      c.lineTo(r * 1.4, -r * 0.58);
      c.lineTo(r * 0.95, -r * 0.28);
      c.lineTo(r * 0.62, -r * 0.44);
      // Forehead bangs
      c.lineTo(r * 0.25, -r * 0.34);
      c.lineTo(r * 0.08, -r * 0.54);
      c.lineTo(-r * 0.15, -r * 0.32);
      c.lineTo(-r * 0.55, -r * 0.48);
      c.closePath();
      c.fill();
    } else if (ball.costume === "naruto") {
      // Shippuden black/navy collar at bottom
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = COLORS.ichigoDark;
      c.fillRect(-r, r * 0.55, r * 2, r * 0.5);
      c.strokeRect(-r, r * 0.55, r * 2, r * 0.5);
      c.restore();

      // Spiky blonde hair bursting above & around headband
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.moveTo(-r * 0.96, -r * 0.28);
      c.lineTo(-r * 1.24, -r * 0.65);
      c.lineTo(-r * 0.85, -r * 0.72);
      c.lineTo(-r * 0.98, -r * 1.14);
      c.lineTo(-r * 0.48, -r * 0.92);
      c.lineTo(-r * 0.22, -r * 1.32);
      c.lineTo(r * 0.06, -r * 0.96);
      c.lineTo(r * 0.38, -r * 1.3);
      c.lineTo(r * 0.56, -r * 0.9);
      c.lineTo(r * 1.04, -r * 1.08);
      c.lineTo(r * 0.88, -r * 0.68);
      c.lineTo(r * 1.24, -r * 0.62);
      c.lineTo(r * 0.95, -r * 0.28);
      c.closePath();
      c.fill();
      c.stroke();

      // Navy Konoha headband cloth + silver plate
      c.fillStyle = COLORS.ichigoDark;
      c.fillRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);
      c.strokeRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);

      c.fillStyle = COLORS.silver;
      c.fillRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);
      c.strokeRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);

      // Konoha swirl mark on plate
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -r * 0.51, r * 0.08, 0, Math.PI * 1.7);
      c.stroke();

      // 3 crisp cheek whiskers on outer cheeks
      for (const side of [-1, 1]) {
        for (const dy of [0.14, 0.24, 0.34]) {
          c.beginPath();
          c.moveTo(side * r * 0.58, r * dy);
          c.lineTo(side * r * 0.84, r * (dy + 0.03));
          c.stroke();
        }
      }
    } else if (ball.costume === "luffy") {
      // Straw Hat on top
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.ellipse(0, -r * 0.78, r * 1.22, r * 0.26, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(0, -r * 0.82, r * 0.62, Math.PI, 0);
      c.closePath();
      c.fill();
      c.stroke();
      // Red ribbon
      c.fillStyle = COLORS.red;
      c.fillRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
      c.strokeRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
    } else if (ball.costume === "ichigo") {
      // Peach face + Shinigami black robe with white V-collar (clipped to ball)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = COLORS.skin;
      c.fillRect(-r, -r, r * 2, r * 1.52);

      // White Shinigami V-collar
      c.fillStyle = COLORS.white;
      c.beginPath();
      c.moveTo(-r * 0.7, r * 0.45);
      c.lineTo(0, r * 0.82);
      c.lineTo(r * 0.7, r * 0.45);
      c.lineTo(r * 0.9, r * 0.65);
      c.lineTo(0, r * 1.0);
      c.lineTo(-r * 0.9, r * 0.65);
      c.closePath();
      c.fill();
      c.stroke();

      // Half Hollow-mask fragment on left side with red stripes
      c.fillStyle = COLORS.white;
      c.beginPath();
      c.moveTo(-r * 1.05, -r * 0.55);
      c.lineTo(-r * 0.42, -r * 0.42);
      c.lineTo(-r * 0.56, r * 0.05);
      c.lineTo(-r * 0.42, r * 0.42);
      c.lineTo(-r * 1.05, r * 0.55);
      c.closePath();
      c.fill();
      c.stroke();

      c.strokeStyle = COLORS.red;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.88, -r * 0.34);
      c.lineTo(-r * 0.58, -r * 0.24);
      c.moveTo(-r * 0.9, r * 0.14);
      c.lineTo(-r * 0.56, r * 0.22);
      c.stroke();
      c.restore();

      // Wild spiky bright orange Ichigo hair
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.fillStyle = COLORS.orange;
      c.beginPath();
      c.moveTo(-r * 0.95, -r * 0.32);
      c.lineTo(-r * 1.25, -r * 0.72);
      c.lineTo(-r * 0.8, -r * 0.76);
      c.lineTo(-r * 0.82, -r * 1.22);
      c.lineTo(-r * 0.35, -r * 0.88);
      c.lineTo(-r * 0.04, -r * 1.32);
      c.lineTo(r * 0.28, -r * 0.88);
      c.lineTo(r * 0.78, -r * 1.24);
      c.lineTo(r * 0.76, -r * 0.76);
      c.lineTo(r * 1.22, -r * 0.68);
      c.lineTo(r * 0.92, -r * 0.32);
      c.lineTo(r * 0.48, -r * 0.5);
      c.lineTo(r * 0.14, -r * 0.36);
      c.lineTo(-r * 0.08, -r * 0.52);
      c.lineTo(-r * 0.45, -r * 0.38);
      c.closePath();
      c.fill();
      c.stroke();
    }
  }

  function drawSkillCooldownRing(ball, c = ctx) {
    const skill = ball.skills && ball.skills[0];
    if (!skill) return;
    const maxCd = skill.cooldown || 1;
    const cd = Math.max(0, skill._cd || 0);
    const progress = cd <= 0.01 ? 1 : Math.max(0, Math.min(1, (maxCd - cd) / maxCd));
    const ringR = ball.radius + 5;

    c.save();
    c.beginPath();
    c.arc(ball.x, ball.y, ringR, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * progress);
    c.lineWidth = 3.5;
    c.lineCap = "round";
    c.strokeStyle = progress >= 1 ? COLORS.green : COLORS.gold;
    c.stroke();
    c.restore();
  }

  function drawBall(ball, c = ctx, showExtras = true) {
    if (showExtras) drawSkillCooldownRing(ball, c);
    drawWeapon(ball, c);
    const r = ball.radius;
    const hurt = ball.flashTimer > 0;
    const ang = Math.atan2(ball.vy, ball.vx);
    const sq = ball.squash * 0.22;

    c.fillStyle = "rgba(43, 27, 61, 0.2)";
    c.beginPath();
    c.ellipse(ball.x, ball.y + r * 0.95, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.translate(ball.x, ball.y);
    c.rotate(ang);
    c.scale(1 + sq, 1 - sq);
    c.rotate(-ang);

    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fillStyle = hurt ? COLORS.white : ball.color;
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = COLORS.ink;
    c.stroke();

    drawCostume(ball, r, c);

    c.fillStyle = "rgba(255, 255, 255, 0.55)";
    c.beginPath();
    c.ellipse(-r * 0.4, -r * 0.5, r * 0.26, r * 0.14, -0.6, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = COLORS.ink;
    c.fillStyle = COLORS.ink;
    c.lineCap = "round";
    c.lineJoin = "round";
    if (hurt) {
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.5, -r * 0.3);
      c.lineTo(-r * 0.2, -r * 0.1);
      c.lineTo(-r * 0.5, r * 0.08);
      c.moveTo(r * 0.5, -r * 0.3);
      c.lineTo(r * 0.2, -r * 0.1);
      c.lineTo(r * 0.5, r * 0.08);
      c.stroke();
      c.beginPath();
      c.ellipse(0, r * 0.42, r * 0.14, r * 0.18, 0, 0, Math.PI * 2);
      c.fill();
    } else {
      const ex = Math.cos(ang) * r * 0.1;
      const ey = Math.sin(ang) * r * 0.1;
      for (const side of [-1, 1]) {
        c.fillStyle = COLORS.white;
        c.beginPath();
        c.arc(side * r * 0.32, -r * 0.08, r * 0.27, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 2.5;
        c.stroke();
        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.arc(side * r * 0.32 + ex, -r * 0.08 + ey, r * 0.13, 0, Math.PI * 2);
        c.fill();
      }
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, r * 0.22, r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    }
    c.restore();
    if (showExtras) drawBallEffects(ball);
  }

  function drawBallEffects(ball) {
    if (!ball.effects.length) return;
    const spacing = 16;
    const startX = ball.x - ((ball.effects.length - 1) * spacing) * 0.5;
    const y = ball.y - ball.radius - 12;

    ball.effects.forEach((eff, idx) => {
      const x = startX + idx * spacing;
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";

      if (eff.type === "slow") {
        // Solid blue downward triangle
        ctx.fillStyle = COLORS.blue;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(6, -4);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (eff.type === "shield") {
        // Solid green/gold shield pentagon
        ctx.fillStyle = COLORS.green;
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(5, 1);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (eff.type === "stun") {
        // Solid gold diamond/star
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function render() {
    const baseScale = Math.min(canvas.width / WORLD_SIZE, canvas.height / WORLD_SIZE);
    const offsetX = (canvas.width - WORLD_SIZE * baseScale) * 0.5;
    const offsetY = (canvas.height - WORLD_SIZE * baseScale) * 0.5;

    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(baseScale, baseScale);

    // Clip to the 500x500 physics arena so zoom/letterbox never bleeds
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.clip();

    // Camera zoom around target point
    ctx.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-cameraX, -cameraY);

    ctx.fillStyle = COLORS.floorA;
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    if (shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * 2 * shakeIntensity,
        (Math.random() - 0.5) * 2 * shakeIntensity
      );
    }

    // Checkerboard floor
    const tile = 50;
    ctx.fillStyle = COLORS.floorB;
    for (let i = 0; i < WORLD_SIZE / tile; i++) {
      for (let j = 0; j < WORLD_SIZE / tile; j++) {
        if ((i + j) % 2 === 1) ctx.fillRect(i * tile, j * tile, tile, tile);
      }
    }

    // Particles
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    for (const p of particles) {
      const k = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.fillStyle = p.color;
      if (p.shape === "square") {
        const s = p.size * (0.7 + k * 0.6);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
        ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const ent of entities) {
      if (!ent.dead && typeof ent.render === "function") {
        ent.render(ctx);
      }
    }

    for (const ball of balls) {
      if (ball.alive) drawBall(ball);
    }

    // Damage numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const t of floatingTexts) {
      const k = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = Math.min(1, k * 2.5);
      if (t.isCrit) {
        ctx.font = `${28 + k * 14}px ${FONT}`;
        ctx.lineWidth = 8;
        ctx.strokeStyle = COLORS.ink;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = COLORS.red;
        ctx.fillText(t.text, t.x, t.y);
      } else {
        ctx.font = `${20 + k * 10}px ${FONT}`;
        ctx.lineWidth = 6;
        ctx.strokeStyle = COLORS.ink;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color || COLORS.gold;
        ctx.fillText(t.text, t.x, t.y);
      }
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (selecting) {
      renderIdlePreviews(now / 1000);
    } else {
      step(dt);
    }
    render();
    requestAnimationFrame(loop);
  }

  // Event listeners
  function handleAdvanceRoundOrMatch() {
    sound.unlock();
    if (matchOver) {
      initMatch();
    } else if (roundOver) {
      currentRound += 1;
      initRound();
    }
  }

  function setRecMode(active) {
    recMode = active;
    document.body.classList.toggle("rec-mode", recMode);
    if (btnRecExit) btnRecExit.classList.toggle("hidden", !recMode);
    requestAnimationFrame(resizeCanvas);
  }

  function togglePlay() {
    sound.unlock();
    if (matchOver || roundOver) {
      handleAdvanceRoundOrMatch();
      return;
    }
    running = !running;
    btnPlay.textContent = running ? "PAUSE" : "START";
  }

  btnPlay.addEventListener("click", togglePlay);
  btnReset.addEventListener("click", () => {
    sound.unlock();
    initMatch();
  });
  btnRematch.addEventListener("click", handleAdvanceRoundOrMatch);

  btnSpeed.addEventListener("click", () => {
    sound.unlock();
    speedMultiplier = speedMultiplier === 1 ? 2 : 1;
    btnSpeed.textContent = `${speedMultiplier}X`;
  });

  btnSound.addEventListener("click", () => {
    sound.unlock();
    sound.enabled = !sound.enabled;
    btnSound.textContent = sound.enabled ? "SFX: ON" : "SFX: OFF";
  });

  if (btnRec) {
    btnRec.addEventListener("click", () => {
      sound.unlock();
      setRecMode(!recMode);
    });
  }

  if (btnRecExit) {
    btnRecExit.addEventListener("click", () => {
      setRecMode(false);
    });
  }

  if (btnFight) {
    btnFight.addEventListener("click", () => {
      sound.unlock();
      selecting = false;
      if (selectScreen) selectScreen.classList.add("hidden");
      initMatch();
    });
  }

  if (btnChangeChar) {
    btnChangeChar.addEventListener("click", () => {
      sound.unlock();
      openSelectScreen();
    });
  }

  if (btnRoster) {
    btnRoster.addEventListener("click", () => {
      sound.unlock();
      openSelectScreen();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (selecting) {
        if (btnFight) btnFight.click();
      } else {
        togglePlay();
      }
    } else if ((e.key === "r" || e.key === "R") && !selecting) {
      sound.unlock();
      initMatch();
    } else if (e.key === "Escape" && recMode) {
      setRecMode(false);
    }
  });

  window.addEventListener("pointerdown", () => sound.unlock(), { once: true });
  window.addEventListener("resize", resizeCanvas);

  function renderIdlePreviews(t) {
    const drawSide = (canvasEl, cfg, facingRight, phaseOffset) => {
      if (!canvasEl) return;
      const pCtx = canvasEl.getContext("2d");
      pCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const bob = Math.sin(t * 3.8 + phaseOffset) * 3.5;
      const previewBall = {
        x: canvasEl.width * 0.5,
        y: canvasEl.height * 0.56 + bob,
        radius: cfg.radius,
        color: cfg.color,
        costume: cfg.costume,
        weapon: cfg.weapon,
        weaponAngle: t * 2.2 + phaseOffset,
        vx: facingRight ? 1 : -1,
        vy: 0,
        flashTimer: 0,
        squash: Math.max(0, Math.sin(t * 7.6 + phaseOffset) * 0.14),
        skills: cfg.skills,
        effects: [],
      };
      drawBall(previewBall, pCtx, false);
    };

    drawSide(previewP1, BALL_CONFIGS[0], true, 0);
    drawSide(previewP2, BALL_CONFIGS[1], false, 1.4);
  }

  function updatePreviewInfo() {
    const [c1, c2] = BALL_CONFIGS;
    if (previewName1) previewName1.textContent = c1.name;
    if (previewName2) previewName2.textContent = c2.name;
    if (skillDesc1) {
      const s1 = c1.skills[0];
      skillDesc1.textContent = s1 ? `${s1.name.toUpperCase()} • CD ${s1.cooldown}S` : "NO SKILL";
    }
    if (skillDesc2) {
      const s2 = c2.skills[0];
      skillDesc2.textContent = s2 ? `${s2.name.toUpperCase()} • CD ${s2.cooldown}S` : "NO SKILL";
    }
  }

  function openSelectScreen() {
    selecting = true;
    running = false;
    btnPlay.textContent = "START";
    overlay.classList.add("hidden");
    if (selectScreen) selectScreen.classList.remove("hidden");
    updatePreviewInfo();
  }

  function setupRosterSelectors() {
    const entries = Object.values(CHARACTER_ROSTER);
    const buildPicker = (container, slotIndex) => {
      if (!container) return;
      container.innerHTML = "";
      for (const char of entries) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "picker-btn";
        btn.textContent = char.name;
        if (BALL_CONFIGS[slotIndex].id === char.id) {
          btn.classList.add("active");
        }
        btn.addEventListener("click", () => {
          sound.unlock();
          selectedRosterIds[slotIndex] = char.id;
          BALL_CONFIGS[slotIndex] = CHARACTER_ROSTER[char.id];
          container.querySelectorAll(".picker-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          updatePreviewInfo();
          syncFighterUI();
        });
        container.appendChild(btn);
      }
    };
    buildPicker(pickerP1, 0);
    buildPicker(pickerP2, 1);
    updatePreviewInfo();
  }

  // Boot
  if (document.fonts && document.fonts.load) document.fonts.load(`24px ${FONT}`).catch(() => {});
  setupRosterSelectors();
  resizeCanvas();
  initMatch();
  openSelectScreen();
  requestAnimationFrame(loop);
})();

