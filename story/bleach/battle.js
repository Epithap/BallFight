// Bleach Episode 1: 1v1 Action-RPG Boss Battle (Shinigami Ichigo vs Fishbone D)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const INK = "#2b1b3d";
  const TAU = Math.PI * 2;

  let active = false;
  let resultShown = false;
  let t = 0;
  let shake = 0;
  let hitStop = 0;
  let ultFlash = 0;
  let enrageBanner = 0;
  let deathState = null; // null | "boss" | "player"
  let deathTimer = 0;

  // ===== LAYERED ANIME COMBAT SFX (Web Audio, zero GC noise buffer) =====
  const SFX = (() => {
    let ctx = null;
    let noiseBuf = null;

    function ready() {
      if (window.BallFight && window.BallFight.sound && window.BallFight.sound.enabled === false) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        const len = ctx.sampleRate;
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx.state === "running" ? ctx : null;
    }

    function noiseSweep(c, dur, fStart, fEnd, type, vol, delay = 0) {
      const now = c.currentTime + delay;
      const src = c.createBufferSource();
      src.buffer = noiseBuf;
      const flt = c.createBiquadFilter();
      flt.type = type;
      flt.frequency.setValueAtTime(fStart, now);
      flt.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), now + dur);
      flt.Q.value = type === "bandpass" ? 2.2 : 0.8;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + Math.min(0.015, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(flt); flt.connect(g); g.connect(c.destination);
      src.start(now); src.stop(now + dur + 0.02);
    }

    function tone(c, dur, fStart, fEnd, type, vol, delay = 0) {
      const now = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(fStart, now);
      if (fEnd !== fStart) o.frequency.exponentialRampToValueAtTime(Math.max(25, fEnd), now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(c.destination);
      o.start(now); o.stop(now + dur + 0.02);
    }

    return {
      unlock: () => ready(),
      whoosh(heavy = false) {
        const c = ready(); if (!c) return;
        noiseSweep(c, heavy ? 0.19 : 0.12, heavy ? 1900 : 2500, heavy ? 280 : 460, "bandpass", heavy ? 0.24 : 0.16);
        tone(c, 0.09, heavy ? 520 : 840, heavy ? 210 : 380, "triangle", 0.07);
      },
      slashHit(heavy = false) {
        const c = ready(); if (!c) return;
        noiseSweep(c, heavy ? 0.14 : 0.09, 3400, 700, "highpass", heavy ? 0.22 : 0.15);
        tone(c, heavy ? 0.16 : 0.10, heavy ? 150 : 190, 42, "sine", heavy ? 0.28 : 0.18);
      },
      skillWindup() {
        const c = ready(); if (!c) return;
        tone(c, 0.13, 320, 920, "sine", 0.11);
        noiseSweep(c, 0.13, 800, 2400, "bandpass", 0.09);
      },
      reiatsuCleave() {
        const c = ready(); if (!c) return;
        noiseSweep(c, 0.28, 2200, 240, "bandpass", 0.28);
        tone(c, 0.24, 175, 36, "sine", 0.32);
        tone(c, 0.22, 660, 330, "triangle", 0.12);
      },
      shunpo() {
        const c = ready(); if (!c) return;
        noiseSweep(c, 0.10, 4200, 900, "highpass", 0.20);
        tone(c, 0.09, 1350, 280, "sine", 0.13);
      },
      blockRaise() {
        const c = ready(); if (!c) return;
        tone(c, 0.08, 720, 960, "triangle", 0.10);
      },
      guardHit() {
        const c = ready(); if (!c) return;
        tone(c, 0.11, 240, 85, "triangle", 0.20);
        noiseSweep(c, 0.08, 1200, 400, "bandpass", 0.14);
      },
      parryClang() {
        const c = ready(); if (!c) return;
        tone(c, 0.34, 1240, 1180, "sine", 0.20);
        tone(c, 0.28, 1860, 1780, "triangle", 0.14);
        tone(c, 0.22, 140, 38, "sine", 0.28);
        noiseSweep(c, 0.16, 3600, 800, "highpass", 0.22);
      },
      deflect() {
        const c = ready(); if (!c) return;
        tone(c, 0.18, 980, 1480, "sine", 0.16);
        noiseSweep(c, 0.10, 2800, 900, "highpass", 0.15);
      },
      ultiCutIn() {
        const c = ready(); if (!c) return;
        tone(c, 0.34, 95, 420, "sawtooth", 0.14);
        noiseSweep(c, 0.34, 400, 2200, "bandpass", 0.16);
      },
      ultiImpact() {
        const c = ready(); if (!c) return;
        tone(c, 0.45, 130, 26, "sine", 0.36);
        noiseSweep(c, 0.42, 2600, 180, "bandpass", 0.32);
        tone(c, 0.30, 880, 440, "triangle", 0.14, 0.04);
      },
      bossTelegraph(pat) {
        const c = ready(); if (!c) return;
        if (pat === "barrage") {
          tone(c, 0.28, 180, 520, "sawtooth", 0.09);
        } else {
          tone(c, 0.24, 110, 62, "sawtooth", 0.10);
          noiseSweep(c, 0.20, 600, 250, "bandpass", 0.09);
        }
      },
      bossAttack(pat) {
        const c = ready(); if (!c) return;
        if (pat === "circle" || pat === "cross") {
          tone(c, 0.32, 125, 28, "sine", 0.32);
          noiseSweep(c, 0.28, 1400, 180, "lowpass", 0.26);
        } else if (pat === "line") {
          noiseSweep(c, 0.26, 1600, 320, "bandpass", 0.24);
          tone(c, 0.18, 140, 55, "sawtooth", 0.15);
        } else if (pat === "barrage") {
          tone(c, 0.16, 540, 130, "sawtooth", 0.14);
          noiseSweep(c, 0.12, 2200, 600, "bandpass", 0.12);
        } else {
          noiseSweep(c, 0.16, 1500, 340, "bandpass", 0.22);
          tone(c, 0.14, 130, 52, "sawtooth", 0.14);
        }
      },
      bossEnrage() {
        const c = ready(); if (!c) return;
        tone(c, 0.48, 165, 68, "sawtooth", 0.18);
        tone(c, 0.45, 220, 88, "square", 0.09);
        noiseSweep(c, 0.45, 900, 220, "bandpass", 0.22);
      },
      playerHurt() {
        const c = ready(); if (!c) return;
        tone(c, 0.18, 160, 44, "sawtooth", 0.22);
        noiseSweep(c, 0.12, 1800, 300, "lowpass", 0.20);
      },
      victory() {
        const c = ready(); if (!c) return;
        tone(c, 0.22, 523.25, 523.25, "triangle", 0.14, 0);
        tone(c, 0.22, 659.25, 659.25, "triangle", 0.14, 0.09);
        tone(c, 0.36, 783.99, 783.99, "triangle", 0.16, 0.18);
      },
    };
  })();

  const pState = {
    hp: 100,
    maxHp: 100,
    ulti: 0,
    aimX: 0,
    aimY: 1,
    combo: 0,
    comboReset: 0,
    atkCd: 0,
    skillCd: 0,
    dodgeCd: 0,
    blockCd: 0,
    iframe: 0,
    dashTime: 0,
    dashVx: 0,
    dashVy: 0,
    blockTime: 0,
    parryWindow: 0,
    hurtFlash: 0,
    swingTimer: 0,
    swingDuration: 0.22,
    swingBaseAng: 0,
    swingDir: 1,
    swingType: "atk1",
    skillWindup: 0,
    skillAng: 0,
    ultTimer: 0,
    ultAng: 0,
    ultTicksLeft: 0,
    ultTickCd: 0,
    afterimages: [],
  };

  const boss = {
    x: 240,
    y: 380,
    r: 30,
    hp: 800,
    maxHp: 800,
    speed: 92,
    state: "chase", // "chase" | "telegraph" | "attack" | "recover" | "stagger"
    timer: 0.9,
    pattern: "cone", // "cone" | "line" | "circle" | "barrage" | "cross"
    teleDuration: 0.65,
    aimAng: Math.PI * 0.5,
    lungeVx: 0,
    lungeVy: 0,
    hitApplied: false,
    chainLeft: 0,
    hurtFlash: 0,
    enraged: false,
  };

  const slashes = [];
  const projectiles = [];
  const bossProjectiles = [];
  const spikes = [];
  const particles = [];
  const floats = [];

  function spawnFloat(x, y, text, color = "#ffffff", scale = 1) {
    floats.push({ x, y, vy: -44, life: 0.88, maxLife: 0.88, text, color, scale });
  }

  function spawnSparks(x, y, color, count = 10, speed = 150) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = speed * (0.4 + Math.random() * 0.8);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: 2.2 + Math.random() * 3.2,
        color,
        life: 0.32 + Math.random() * 0.26,
        maxLife: 0.55,
      });
    }
  }

  function resetBattle(player) {
    active = true;
    resultShown = false;
    t = 0;
    shake = 0;
    hitStop = 0;
    ultFlash = 0;
    enrageBanner = 0;
    deathState = null;
    deathTimer = 0;

    player.x = 220;
    player.y = 200;
    player.mood = "battle";

    Object.assign(pState, {
      hp: 100,
      maxHp: 100,
      ulti: 0,
      aimX: 0,
      aimY: 1,
      combo: 0,
      comboReset: 0,
      atkCd: 0,
      skillCd: 0,
      dodgeCd: 0,
      blockCd: 0,
      iframe: 0,
      dashTime: 0,
      blockTime: 0,
      parryWindow: 0,
      hurtFlash: 0,
      swingTimer: 0,
      swingDuration: 0.22,
      swingBaseAng: 0,
      swingDir: 1,
      swingType: "atk1",
      skillWindup: 0,
      skillAng: 0,
      ultTimer: 0,
      ultAng: 0,
      ultTicksLeft: 0,
      ultTickCd: 0,
      afterimages: [],
    });

    Object.assign(boss, {
      x: 240,
      y: 390,
      r: 30,
      hp: 800,
      maxHp: 800,
      speed: 92,
      state: "chase",
      timer: 0.9,
      pattern: "cone",
      teleDuration: 0.65,
      aimAng: -Math.PI * 0.5,
      lungeVx: 0,
      lungeVy: 0,
      hitApplied: false,
      chainLeft: 0,
      hurtFlash: 0,
      enraged: false,
    });

    slashes.length = 0;
    projectiles.length = 0;
    bossProjectiles.length = 0;
    spikes.length = 0;
    particles.length = 0;
    floats.length = 0;

    const resEl = document.getElementById("story-battle-result");
    if (resEl) resEl.classList.add("hidden");
    syncBattleHud();
  }

  function start(player) {
    SFX.unlock();
    resetBattle(player);
    S.UI.setBattleMode(true);
    S.UI.showToast("1v1 BOSS BATTLE! DEFEAT FISHBONE D!");
  }

  function stop() {
    active = false;
    S.UI.setBattleMode(false);
  }

  function damageBoss(dmg, player, labelColor = "#ffe047", knock = 16, hitStopDur = 0.03) {
    if (boss.hp <= 0) return;
    boss.hp = Math.max(0, boss.hp - dmg);
    boss.hurtFlash = 0.16;
    const ang = Math.atan2(boss.y - player.y, boss.x - player.x);
    boss.x = Math.max(46, Math.min(394, boss.x + Math.cos(ang) * knock));
    boss.y = Math.max(150, Math.min(466, boss.y + Math.sin(ang) * knock));

    spawnFloat(
      boss.x + (Math.random() - 0.5) * 24,
      boss.y - 36,
      String(dmg),
      labelColor,
      dmg >= 15 ? 1.3 : dmg >= 5 ? 1.12 : 0.96
    );
    spawnSparks(boss.x, boss.y, "#38bdf8", dmg >= 15 ? 18 : 9, 185);
    hitStop = Math.max(hitStop, hitStopDur);
    shake = Math.max(shake, dmg >= 15 ? 8 : 4.2);

    if (boss.hp <= boss.maxHp * 0.5 && !boss.enraged) {
      boss.enraged = true;
      boss.speed = 124;
      enrageBanner = 1.45;
      shake = 12;
      SFX.bossEnrage();
      slashes.push({ x: boss.x, y: boss.y, ang: 0, r: 150, color: "#ef4444", life: 0.45, maxLife: 0.45, ring: true });
      spawnFloat(boss.x, boss.y - 56, "ENRAGED!!", "#ef4444", 1.35);
      spawnSparks(boss.x, boss.y, "#ef4444", 28, 230);
    }

    if (boss.hp <= 0 && !deathState && !resultShown) {
      deathState = "boss";
      deathTimer = 1.55;
      boss.state = "stagger";
      bossProjectiles.length = 0;
      pState.dashTime = 0;
      pState.swingTimer = 0;
      pState.blockTime = 0;
      pState.ultTimer = 0;
      SFX.victory();
      slashes.push({ x: boss.x, y: boss.y, ang: 0, r: 120, color: "#38bdf8", life: 0.55, maxLife: 0.55, ring: true });
      spawnFloat(boss.x, boss.y - 44, "PURIFIED!!", "#38bdf8", 1.35);
      spawnSparks(boss.x, boss.y, "#fef08a", 34, 240);
      spawnSparks(boss.x, boss.y, "#38bdf8", 28, 210);
      shake = 14;
    }
  }

  function damagePlayer(dmg, player, knockAng) {
    if (pState.hp <= 0 || resultShown) return;
    if (pState.iframe > 0) {
      pState.ulti = Math.min(100, pState.ulti + 3);
      SFX.shunpo();
      spawnFloat(player.x, player.y - 30, "PERFECT DODGE! +3%", "#4ade80", 1.12);
      spawnSparks(player.x, player.y, "#4ade80", 12, 160);
      return;
    }
    if (pState.blockTime > 0) {
      if (pState.parryWindow > 0) {
        // PERFECT PARRY! Counter-shockwave + Boss Stagger + Ulti Gain
        pState.ulti = Math.min(100, pState.ulti + 5);
        boss.state = "stagger";
        boss.timer = 1.2;
        boss.chainLeft = 0;
        hitStop = 0.095;
        shake = 11;
        SFX.parryClang();
        spawnFloat(player.x, player.y - 34, "PERFECT PARRY!!", "#ffe047", 1.4);
        spawnSparks(player.x, player.y, "#ffe047", 26, 230);
        slashes.push({ x: player.x, y: player.y, ang: 0, r: 62, color: "#ffe047", life: 0.30, maxLife: 0.30, ring: true });
        if (Math.hypot(boss.x - player.x, boss.y - player.y) <= 135) {
          damageBoss(12, player, "#ffe047", 24, 0.08);
        }
        return;
      }
      const reduced = Math.max(3, Math.round(dmg * 0.25));
      pState.hp = Math.max(0, pState.hp - reduced);
      shake = Math.max(shake, 4);
      SFX.guardHit();
      spawnFloat(player.x, player.y - 26, `GUARD -${reduced}`, "#fbbf24", 0.95);
      spawnSparks(player.x, player.y, "#fbbf24", 9, 130);
      return;
    }

    pState.hp = Math.max(0, pState.hp - dmg);
    pState.hurtFlash = 0.26;
    shake = Math.max(shake, 9);
    SFX.playerHurt();
    player.x = Math.max(38, Math.min(402, player.x + Math.cos(knockAng) * 26));
    player.y = Math.max(140, Math.min(474, player.y + Math.sin(knockAng) * 26));
    spawnFloat(player.x, player.y - 28, `-${dmg}`, "#ef4444", 1.2);
    spawnSparks(player.x, player.y, "#ef4444", 14, 175);

    if (pState.hp <= 0 && !deathState && !resultShown) {
      deathState = "player";
      deathTimer = 1.45;
      boss.state = "recover";
      bossProjectiles.length = 0;
      pState.dashTime = 0;
      pState.swingTimer = 0;
      pState.blockTime = 0;
      pState.ultTimer = 0;
      slashes.push({ x: player.x, y: player.y, ang: 0, r: 68, color: "#ef4444", life: 0.45, maxLife: 0.45, ring: true });
      spawnFloat(player.x, player.y - 38, "DEFEATED...", "#ef4444", 1.3);
      spawnSparks(player.x, player.y, "#ef4444", 24, 180);
    }
  }

  // ===== PLAYER 5-BUTTON COMBAT ACTIONS =====
  function basicAttack(player) {
    if (!active || resultShown || deathState || pState.atkCd > 0 || pState.ultTimer > 0) return;
    pState.atkCd = 0.25;
    pState.combo = (pState.combo % 3) + 1;
    pState.comboReset = 0.9;
    SFX.whoosh(pState.combo === 3);

    const ang = Math.atan2(boss.y - player.y, boss.x - player.x);
    pState.aimX = Math.cos(ang);
    pState.aimY = Math.sin(ang);
    player.facing = pState.aimX >= 0 ? 1 : -1;

    // Sword swing animation state
    pState.swingDuration = pState.combo === 3 ? 0.26 : 0.19;
    pState.swingTimer = pState.swingDuration;
    pState.swingBaseAng = ang;
    pState.swingDir = pState.combo === 2 ? -1 : 1;
    pState.swingType = `atk${pState.combo}`;

    // Forward lunge step
    const step = pState.combo === 3 ? 16 : 10;
    player.x = Math.max(38, Math.min(402, player.x + pState.aimX * step));
    player.y = Math.max(140, Math.min(474, player.y + pState.aimY * step));

    const arcR = pState.combo === 3 ? 70 : 56;
    slashes.push({
      x: player.x + pState.aimX * 16,
      y: player.y + pState.aimY * 16,
      ang,
      r: arcR,
      color: pState.combo === 3 ? "#38bdf8" : "#e0f2fe",
      life: pState.combo === 3 ? 0.24 : 0.18,
      maxLife: pState.combo === 3 ? 0.24 : 0.18,
      flip: pState.combo === 2,
      heavy: pState.combo === 3,
    });
    if (pState.combo === 3) {
      slashes.push({ x: player.x, y: player.y, ang: 0, r: 58, color: "#38bdf8", life: 0.22, maxLife: 0.22, ring: true });
      spawnSparks(player.x + pState.aimX * 26, player.y + pState.aimY * 26, "#38bdf8", 12, 160);
    }

    const dist = Math.hypot(boss.x - player.x, boss.y - player.y);
    if (dist <= arcR + boss.r + 14) {
      const dmg = pState.combo === 3 ? 5 : pState.combo === 2 ? 3 : 2;
      pState.ulti = Math.min(100, pState.ulti + 1);
      SFX.slashHit(pState.combo === 3);
      damageBoss(
        dmg,
        player,
        pState.combo === 3 ? "#38bdf8" : "#ffffff",
        0,
        0
      );
    }
  }

  function useSkill(player) {
    if (!active || resultShown || deathState || pState.skillCd > 0 || pState.ultTimer > 0) return;
    pState.skillCd = 4.2;
    const ang = Math.atan2(boss.y - player.y, boss.x - player.x);
    pState.aimX = Math.cos(ang);
    pState.aimY = Math.sin(ang);
    player.facing = pState.aimX >= 0 ? 1 : -1;

    // 0.13s windup glow before unleashing Getsuga Crescent
    pState.skillWindup = 0.13;
    pState.skillAng = ang;
    pState.swingDuration = 0.26;
    pState.swingTimer = 0.26;
    pState.swingBaseAng = ang;
    pState.swingDir = 1;
    pState.swingType = "skill";
    SFX.skillWindup();
    spawnSparks(player.x, player.y, "#38bdf8", 14, 150);
  }

  function executeReiatsuCleave(player, ang) {
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    SFX.reiatsuCleave();
    // Ep 1 Lore-Accurate: Dash-Lunge + Raw Sky-Blue Reiatsu Shockwave Cleave (no Getsuga projectile)
    player.x = Math.max(38, Math.min(402, player.x + dx * 34));
    player.y = Math.max(140, Math.min(474, player.y + dy * 34));
    slashes.push({ x: player.x + dx * 20, y: player.y + dy * 20, ang, r: 96, color: "#38bdf8", life: 0.28, maxLife: 0.28, heavy: true });
    slashes.push({ x: player.x + dx * 28, y: player.y + dy * 28, ang: 0, r: 86, color: "#bae6fd", life: 0.26, maxLife: 0.26, ring: true });
    spawnSparks(player.x + dx * 26, player.y + dy * 26, "#38bdf8", 22, 210);
    shake = Math.max(shake, 7);

    const dist = Math.hypot(boss.x - player.x, boss.y - player.y);
    if (dist <= 112 + boss.r) {
      pState.ulti = Math.min(100, pState.ulti + 3);
      if (boss.state !== "telegraph") {
        boss.state = "stagger";
        boss.timer = 0.42;
      }
      damageBoss(15, player, "#38bdf8", 22, 0.06);
    }
  }

  function useDodge(player, moveX, moveY) {
    if (!active || resultShown || deathState || pState.dodgeCd > 0 || pState.ultTimer > 0) return;
    pState.dodgeCd = 2.2;
    pState.iframe = 0.38;
    pState.dashTime = 0.18;

    let dx = moveX;
    let dy = moveY;
    const len = Math.hypot(dx, dy);
    if (len < 0.1) {
      dx = player.facing || 1;
      dy = 0;
    } else {
      dx /= len;
      dy /= len;
    }
    pState.dashVx = dx * 560;
    pState.dashVy = dy * 560;
    SFX.shunpo();
    slashes.push({ x: player.x, y: player.y, ang: 0, r: 34, color: "#818cf8", life: 0.2, maxLife: 0.2, ring: true });
    spawnSparks(player.x, player.y, "#818cf8", 14, 150);
  }

  function useBlock() {
    if (!active || resultShown || deathState || pState.blockCd > 0 || pState.ultTimer > 0) return;
    pState.blockCd = 1.35;
    pState.blockTime = 0.85;
    pState.parryWindow = 0.26;
    SFX.blockRaise();
    slashes.push({ x: 0, y: 0, ang: 0, r: 36, color: "#ffe047", life: 0.18, maxLife: 0.18, ring: true, followPlayer: true });
  }

  function useUlti(player) {
    if (!active || resultShown || deathState || pState.ulti < 100 || pState.ultTimer > 0) return;
    pState.ulti = 0;
    pState.ultTimer = 0.90;
    pState.ultTicksLeft = 4;
    pState.ultTickCd = 0;
    pState.ultAng = Math.atan2(boss.y - player.y, boss.x - player.x);
    pState.iframe = 0.95;
    ultFlash = 0.90;
    shake = 10;
    SFX.ultiCutIn();

    player.facing = Math.cos(pState.ultAng) >= 0 ? 1 : -1;
    pState.swingDuration = 0.54;
    pState.swingTimer = 0.54;
    pState.swingBaseAng = pState.ultAng;
    pState.swingDir = 1;
    pState.swingType = "ulti";

    spawnSparks(player.x, player.y, "#38bdf8", 28, 220);
  }

  // ===== BOSS AI & TELEGRAPH UPDATE =====
  function chooseBossPattern(dist) {
    const roll = Math.random();
    if (boss.enraged && roll < 0.22) {
      boss.pattern = "cross";
      boss.teleDuration = 0.82;
    } else if (dist > 110 && roll < 0.56) {
      boss.pattern = "line";
      boss.teleDuration = boss.enraged ? 0.54 : 0.72;
    } else if (dist > 135 && roll < 0.84) {
      boss.pattern = "barrage";
      boss.teleDuration = boss.enraged ? 0.60 : 0.78;
    } else if (dist < 108 && roll < 0.48) {
      boss.pattern = "cone";
      boss.teleDuration = boss.enraged ? 0.48 : 0.62;
      boss.chainLeft = boss.enraged ? 1 : 0;
    } else if (dist < 120 && roll < 0.76) {
      boss.pattern = "circle";
      boss.teleDuration = boss.enraged ? 0.72 : 0.92;
    } else {
      boss.pattern = "line";
      boss.teleDuration = boss.enraged ? 0.54 : 0.72;
    }
  }

  function updateBoss(dt, player) {
    if (boss.hp <= 0) return;
    if (boss.hurtFlash > 0) boss.hurtFlash = Math.max(0, boss.hurtFlash - dt);

    // Freeze boss during Ultimate Stage 1 Cut-in
    if (pState.ultTimer > 0.54) return;

    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angToPlayer = Math.atan2(dy, dx);

    if (boss.state === "stagger") {
      boss.timer -= dt;
      if (boss.timer <= 0) {
        boss.state = "chase";
        boss.timer = boss.enraged ? 0.35 : 0.5;
      }
      return;
    }

    if (boss.state === "chase") {
      boss.timer -= dt;
      if (dist > 54) {
        boss.x += (dx / dist) * boss.speed * dt;
        boss.y += (dy / dist) * boss.speed * dt;
      }
      if (boss.timer <= 0) {
        chooseBossPattern(dist);
        boss.aimAng = angToPlayer;
        boss.timer = boss.teleDuration;
        boss.hitApplied = false;
        boss.state = "telegraph";
        SFX.bossTelegraph(boss.pattern);
      }
    } else if (boss.state === "telegraph") {
      if ((boss.pattern === "line" || boss.pattern === "barrage") && boss.timer > boss.teleDuration * 0.42) {
        boss.aimAng = angToPlayer;
      }
      boss.timer -= dt;
      if (boss.timer <= 0) {
        boss.state = "attack";
        boss.timer = boss.pattern === "line" ? 0.42 : 0.24;
        boss.lungeVx = Math.cos(boss.aimAng) * (boss.enraged ? 600 : 520);
        boss.lungeVy = Math.sin(boss.aimAng) * (boss.enraged ? 600 : 520);
        SFX.bossAttack(boss.pattern);
        if (boss.pattern === "line") {
          slashes.push({ x: boss.x, y: boss.y, ang: 0, r: 52, color: "#ef4444", life: 0.22, maxLife: 0.22, ring: true });
          spawnSparks(boss.x, boss.y, "#ef4444", 12, 160);
        }
      }
    } else if (boss.state === "attack") {
      boss.timer -= dt;
      if (boss.pattern === "cone" && !boss.hitApplied) {
        boss.hitApplied = true;
        slashes.push({
          x: boss.x + Math.cos(boss.aimAng) * 28,
          y: boss.y + Math.sin(boss.aimAng) * 28,
          ang: boss.aimAng,
          r: 78,
          color: "#ef4444",
          life: 0.24,
          maxLife: 0.24,
          heavy: true,
        });
        if (dist <= 110) {
          const diff = Math.abs(Math.atan2(Math.sin(angToPlayer - boss.aimAng), Math.cos(angToPlayer - boss.aimAng)));
          if (diff <= 0.96) damagePlayer(boss.enraged ? 13 : 10, player, boss.aimAng);
        }
      } else if (boss.pattern === "line") {
        boss.x = Math.max(46, Math.min(394, boss.x + boss.lungeVx * dt));
        boss.y = Math.max(150, Math.min(466, boss.y + boss.lungeVy * dt));
        spawnSparks(boss.x, boss.y, "#ef4444", 3, 120);
        if (!boss.hitApplied && dist <= boss.r + player.r + 14) {
          boss.hitApplied = true;
          damagePlayer(boss.enraged ? 18 : 14, player, boss.aimAng);
        }
      } else if (boss.pattern === "circle" && !boss.hitApplied) {
        boss.hitApplied = true;
        shake = Math.max(shake, 11);
        slashes.push({ x: boss.x, y: boss.y, ang: 0, r: 118, color: "#ef4444", life: 0.36, maxLife: 0.36, ring: true });
        for (let i = 0; i < 10; i++) {
          const a = (i * TAU) / 10;
          spikes.push({ x: boss.x + Math.cos(a) * 68, y: boss.y + Math.sin(a) * 68, life: 0.48, maxLife: 0.48 });
        }
        if (dist <= 118) damagePlayer(boss.enraged ? 20 : 16, player, angToPlayer);
      } else if (boss.pattern === "barrage" && !boss.hitApplied) {
        boss.hitApplied = true;
        const count = boss.enraged ? 5 : 3;
        const spread = 0.34;
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) * 0.5) * spread;
          const a = boss.aimAng + offset;
          bossProjectiles.push({
            x: boss.x + Math.cos(a) * 24,
            y: boss.y + Math.sin(a) * 24,
            vx: Math.cos(a) * (boss.enraged ? 265 : 225),
            vy: Math.sin(a) * (boss.enraged ? 265 : 225),
            r: 12,
            dmg: 8,
            life: 2.2,
            deflected: false,
          });
        }
        spawnSparks(boss.x, boss.y, "#c026d3", 16, 170);
      } else if (boss.pattern === "cross" && !boss.hitApplied) {
        boss.hitApplied = true;
        shake = Math.max(shake, 12);
        for (let k = 0; k < 4; k++) {
          const a = Math.PI * 0.25 + (k * Math.PI) / 2;
          slashes.push({ x: boss.x + Math.cos(a) * 40, y: boss.y + Math.sin(a) * 40, ang: a, r: 120, color: "#dc2626", life: 0.32, maxLife: 0.32, heavy: true });
          for (let d = 52; d <= 132; d += 40) {
            spikes.push({ x: boss.x + Math.cos(a) * d, y: boss.y + Math.sin(a) * d, life: 0.5, maxLife: 0.5 });
          }
          // Hit check along each diagonal corridor
          const proj = dx * Math.cos(a) + dy * Math.sin(a);
          const perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a));
          if (proj > 0 && proj <= 160 && perp <= 26) {
            damagePlayer(15, player, a);
          }
        }
      }

      if (boss.timer <= 0) {
        if (boss.pattern === "cone" && boss.chainLeft > 0) {
          boss.chainLeft--;
          boss.aimAng = angToPlayer;
          boss.teleDuration = 0.38;
          boss.timer = 0.38;
          boss.hitApplied = false;
          boss.state = "telegraph";
        } else {
          boss.state = "recover";
          boss.timer = boss.enraged ? 0.38 : 0.62;
        }
      }
    } else if (boss.state === "recover") {
      boss.timer -= dt;
      if (boss.timer <= 0) {
        boss.state = "chase";
        boss.timer = boss.enraged ? 0.45 : 0.78;
      }
    }
  }

  function update(dt, player, moveX, moveY) {
    if (!active) return;
    t += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 28);
    if (ultFlash > 0) ultFlash = Math.max(0, ultFlash - dt);
    if (enrageBanner > 0) enrageBanner = Math.max(0, enrageBanner - dt);
    if (hitStop > 0) {
      hitStop -= dt;
      return;
    }

    // Freeze both Ichigo & Boss while Death Animation plays on screen
    if (deathState) {
      deathTimer = Math.max(0, deathTimer - dt);
      if (deathState === "boss" && Math.random() < 0.55) {
        particles.push({
          x: boss.x + (Math.random() - 0.5) * 44,
          y: boss.y + (Math.random() - 0.5) * 32,
          vx: (Math.random() - 0.5) * 24,
          vy: -55 - Math.random() * 65,
          r: 2.5 + Math.random() * 2.8,
          color: Math.random() < 0.65 ? "#38bdf8" : "#fef08a",
          life: 0.55,
          maxLife: 0.55,
        });
      }
      for (let i = slashes.length - 1; i >= 0; i--) {
        slashes[i].life -= dt;
        if (slashes[i].life <= 0) slashes.splice(i, 1);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) particles.splice(i, 1);
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const fl = floats[i];
        fl.y += fl.vy * dt; fl.life -= dt;
        if (fl.life <= 0) floats.splice(i, 1);
      }
      if (deathTimer <= 0 && !resultShown) {
        resultShown = true;
        if (deathState === "boss") {
          S.Quests.setPhase("ep1_cleared");
          S.UI.showBattleResult(true);
        } else {
          S.UI.showBattleResult(false);
        }
      }
      syncBattleHud();
      return;
    }

    pState.atkCd = Math.max(0, pState.atkCd - dt);
    pState.skillCd = Math.max(0, pState.skillCd - dt);
    pState.dodgeCd = Math.max(0, pState.dodgeCd - dt);
    pState.blockCd = Math.max(0, pState.blockCd - dt);
    pState.iframe = Math.max(0, pState.iframe - dt);
    pState.blockTime = Math.max(0, pState.blockTime - dt);
    pState.parryWindow = Math.max(0, pState.parryWindow - dt);
    pState.hurtFlash = Math.max(0, pState.hurtFlash - dt);
    if (pState.swingTimer > 0) pState.swingTimer = Math.max(0, pState.swingTimer - dt);

    if (pState.skillWindup > 0) {
      pState.skillWindup -= dt;
      if (pState.skillWindup <= 0) {
        executeReiatsuCleave(player, pState.skillAng);
      }
    }

    // 2-Stage Ultimate Execution (SOUL CLEAVER!!)
    if (pState.ultTimer > 0) {
      const prev = pState.ultTimer;
      pState.ultTimer = Math.max(0, pState.ultTimer - dt);
      if (prev > 0.54 && pState.ultTimer <= 0.54) {
        // Stage 2 Launch: Lunge in & erupt Raw Sky-Blue Reiatsu Pillar + Giant Zanpakuto Cleave!
        const dx = boss.x - player.x;
        const dy = boss.y - player.y;
        const d = Math.hypot(dx, dy) || 1;
        const step = Math.min(110, Math.max(0, d - 42));
        player.x = Math.max(38, Math.min(402, player.x + (dx / d) * step));
        player.y = Math.max(140, Math.min(474, player.y + (dy / d) * step));
        shake = 16;
        SFX.ultiImpact();
        slashes.push({ x: player.x, y: player.y, ang: 0, r: 175, color: "#38bdf8", life: 0.46, maxLife: 0.46, ring: true });
        slashes.push({
          x: player.x + Math.cos(pState.ultAng) * 34,
          y: player.y + Math.sin(pState.ultAng) * 34,
          ang: pState.ultAng,
          r: 150,
          color: "#38bdf8",
          life: 0.44,
          maxLife: 0.44,
          heavy: true,
        });
        spawnSparks(boss.x, boss.y, "#38bdf8", 32, 240);
        spawnFloat(player.x, player.y - 42, "SOUL CLEAVER!!", "#38bdf8", 1.4);
      }
      if (pState.ultTimer <= 0.54 && pState.ultTicksLeft > 0) {
        pState.ultTickCd -= dt;
        if (pState.ultTickCd <= 0) {
          pState.ultTicksLeft--;
          pState.ultTickCd = 0.09;
          damageBoss(10, player, "#38bdf8", 10, 0.02);
        }
      }
    }

    if (pState.comboReset > 0) {
      pState.comboReset -= dt;
      if (pState.comboReset <= 0) pState.combo = 0;
    }

    // Shunpo Dash movement
    if (pState.dashTime > 0) {
      pState.dashTime -= dt;
      player.x = Math.max(38, Math.min(402, player.x + pState.dashVx * dt));
      player.y = Math.max(140, Math.min(474, player.y + pState.dashVy * dt));
      if (pState.afterimages.length < 4 && (pState.afterimages.length === 0 || pState.afterimages[pState.afterimages.length - 1].life < 0.19)) {
        pState.afterimages.push({ x: player.x, y: player.y, facing: player.facing, life: 0.24, maxLife: 0.24 });
      }
    } else if (pState.ultTimer <= 0.54) {
      const spd = pState.blockTime > 0 ? 64 : 172;
      const len = Math.hypot(moveX, moveY);
      const mx = len > 1 ? moveX / len : moveX;
      const my = len > 1 ? moveY / len : moveY;
      if (Math.abs(mx) > 0.08) player.facing = mx >= 0 ? 1 : -1;
      player.x = Math.max(38, Math.min(402, player.x + mx * spd * dt));
      player.y = Math.max(140, Math.min(474, player.y + my * spd * dt));
    }

    updateBoss(dt, player);

    // Player Projectiles (Getsuga)
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const pr = projectiles[i];
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (Math.random() < 0.85) spawnSparks(pr.x, pr.y, "#38bdf8", 2, 70);
      if (!pr.hit && boss.hp > 0 && Math.hypot(boss.x - pr.x, boss.y - pr.y) <= pr.r + boss.r) {
        pr.hit = true;
        pState.ulti = Math.min(100, pState.ulti + 22);
        slashes.push({ x: pr.x, y: pr.y, ang: 0, r: 74, color: "#38bdf8", life: 0.26, maxLife: 0.26, ring: true });
        if (boss.state !== "telegraph") {
          boss.state = "stagger";
          boss.timer = 0.42;
        }
        damageBoss(pr.dmg, player, "#38bdf8", 24, 0.06);
      }
      if (pr.life <= 0) projectiles.splice(i, 1);
    }

    // Boss Hollow Cero Orbs (dodgeable or deflectable via Perfect Parry!)
    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
      const bp = bossProjectiles[i];
      bp.x += bp.vx * dt;
      bp.y += bp.vy * dt;
      bp.life -= dt;
      if (!bp.deflected && Math.hypot(player.x - bp.x, player.y - bp.y) <= bp.r + player.r) {
        if (pState.blockTime > 0 && pState.parryWindow > 0) {
          // Deflect Orb back at Fishbone D!
          bp.deflected = true;
          const ang = Math.atan2(boss.y - bp.y, boss.x - bp.x);
          bp.vx = Math.cos(ang) * 420;
          bp.vy = Math.sin(ang) * 420;
          bp.life = 1.4;
          pState.ulti = Math.min(100, pState.ulti + 3);
          SFX.deflect();
          spawnFloat(player.x, player.y - 30, "DEFLECT! +3%", "#ffe047", 1.25);
          spawnSparks(bp.x, bp.y, "#ffe047", 14, 180);
          continue;
        }
        damagePlayer(bp.dmg, player, Math.atan2(bp.vy, bp.vx));
        if (pState.iframe <= 0) bossProjectiles.splice(i, 1);
        continue;
      }
      if (bp.deflected && boss.hp > 0 && Math.hypot(boss.x - bp.x, boss.y - bp.y) <= bp.r + boss.r) {
        damageBoss(15, player, "#ffe047", 14, 0.05);
        bossProjectiles.splice(i, 1);
        continue;
      }
      if (bp.life <= 0) bossProjectiles.splice(i, 1);
    }

    // Update VFX arrays
    for (let i = pState.afterimages.length - 1; i >= 0; i--) {
      pState.afterimages[i].life -= dt;
      if (pState.afterimages[i].life <= 0) pState.afterimages.splice(i, 1);
    }
    for (let i = slashes.length - 1; i >= 0; i--) {
      slashes[i].life -= dt;
      if (slashes[i].life <= 0) slashes.splice(i, 1);
    }
    for (let i = spikes.length - 1; i >= 0; i--) {
      spikes[i].life -= dt;
      if (spikes[i].life <= 0) spikes.splice(i, 1);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.92;
      pt.vy *= 0.92;
      pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const fl = floats[i];
      fl.y += fl.vy * dt;
      fl.vy *= 0.95;
      fl.life -= dt;
      if (fl.life <= 0) floats.splice(i, 1);
    }

    syncBattleHud();
  }

  function renderTelegraphs(c) {
    if (boss.state !== "telegraph") return;
    const prog = 1 - Math.max(0, boss.timer / boss.teleDuration);
    c.save();

    if (boss.pattern === "cone") {
      c.translate(boss.x, boss.y);
      c.rotate(boss.aimAng);
      c.fillStyle = "rgba(239, 68, 68, 0.20)";
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 108, -0.92, 0.92); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "rgba(239, 68, 68, 0.44)";
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 108 * prog, -0.92, 0.92); c.closePath(); c.fill();
    } else if (boss.pattern === "line") {
      c.translate(boss.x, boss.y);
      c.rotate(boss.aimAng);
      c.fillStyle = "rgba(239, 68, 68, 0.18)";
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.2;
      c.fillRect(0, -24, 225, 48);
      c.strokeRect(0, -24, 225, 48);
      c.fillStyle = "rgba(239, 68, 68, 0.44)";
      c.fillRect(0, -24, 225 * prog, 48);
    } else if (boss.pattern === "circle") {
      c.fillStyle = "rgba(239, 68, 68, 0.18)";
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.6;
      c.beginPath(); c.arc(boss.x, boss.y, 118, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = "rgba(239, 68, 68, 0.40)";
      c.beginPath(); c.arc(boss.x, boss.y, 118 * prog, 0, TAU); c.fill();
    } else if (boss.pattern === "barrage") {
      const count = boss.enraged ? 5 : 3;
      const spread = 0.34;
      for (let i = 0; i < count; i++) {
        const a = boss.aimAng + (i - (count - 1) * 0.5) * spread;
        c.save();
        c.translate(boss.x, boss.y);
        c.rotate(a);
        c.strokeStyle = `rgba(192, 38, 211, ${(0.35 + prog * 0.55).toFixed(2)})`;
        c.lineWidth = 3;
        c.setLineDash([8, 6]);
        c.beginPath(); c.moveTo(20, 0); c.lineTo(240, 0); c.stroke();
        c.restore();
      }
    } else if (boss.pattern === "cross") {
      for (let k = 0; k < 4; k++) {
        const a = Math.PI * 0.25 + (k * Math.PI) / 2;
        c.save();
        c.translate(boss.x, boss.y);
        c.rotate(a);
        c.fillStyle = "rgba(220, 38, 38, 0.20)";
        c.strokeStyle = "#ef4444";
        c.lineWidth = 2;
        c.fillRect(0, -20, 165, 40);
        c.strokeRect(0, -20, 165, 40);
        c.fillStyle = "rgba(239, 68, 68, 0.45)";
        c.fillRect(0, -20, 165 * prog, 40);
        c.restore();
      }
    }

    c.restore();
  }

  function computeIchigoAnimOpts() {
    const opts = { mood: pState.hurtFlash > 0 ? "shocked" : "battle" };
    if (pState.dashTime > 0) {
      opts.scaleX = 1.38;
      opts.scaleY = 0.74;
      opts.lean = pState.dashVx >= 0 ? 0.22 : -0.22;
      opts.chargeGlow = 0.6;
    } else if (pState.blockTime > 0) {
      opts.guardPose = true;
      opts.scaleX = 0.94;
      opts.scaleY = 1.04;
      opts.chargeGlow = pState.parryWindow > 0 ? 1.0 : 0.35;
    } else if (pState.ultTimer > 0.54) {
      opts.swordAngle = pState.ultAng - 1.9;
      opts.chargeGlow = 1.5;
      opts.scaleX = 1.08;
      opts.scaleY = 1.08;
    } else if (pState.swingTimer > 0) {
      const p = 1 - pState.swingTimer / pState.swingDuration; // 0 -> 1
      const sweep = pState.swingType === "atk3" || pState.swingType === "ulti" ? 3.8 : 2.6;
      const startOff = -sweep * 0.5 * pState.swingDir;
      const endOff = sweep * 0.5 * pState.swingDir;
      opts.swordAngle = pState.swingBaseAng + startOff + (endOff - startOff) * p;
      opts.chargeGlow = pState.swingType === "skill" || pState.swingType === "ulti" ? 1.2 : 0.45;
      opts.scaleX = 1.12 - p * 0.12;
      opts.scaleY = 0.90 + p * 0.10;
      opts.lean = pState.aimX * 0.16 * (1 - p);
    }
    return opts;
  }

  function renderEntitiesAndVfx(c, player) {
    // 1. Red Telegraph Danger Indicators on Asphalt
    renderTelegraphs(c);

    // 2. Rukia watching from sidewalk
    if (S.BleachChars) {
      S.BleachChars.drawRukia(c, 84, 158, 17, t, { mood: "serious" });
    }

    // 3. Shunpo Dodge Afterimages (lightweight cyan ghosts for 60fps mobile)
    for (const af of pState.afterimages) {
      const a = (af.life / af.maxLife) * 0.48;
      c.save();
      c.globalAlpha = a;
      c.translate(af.x, af.y);
      c.scale(1.32, 0.78);
      c.fillStyle = "#38bdf8";
      c.beginPath();
      c.arc(0, 0, player.r, 0, TAU);
      c.fill();
      c.fillStyle = "#e0f2fe";
      c.beginPath();
      c.arc(0, -player.r * 0.2, player.r * 0.65, 0, TAU);
      c.fill();
      c.restore();
    }

    // 4. Bone Spikes from Slam / Cross
    for (const sp of spikes) {
      const a = Math.min(1, sp.life / sp.maxLife);
      c.save();
      c.globalAlpha = a;
      c.fillStyle = "#f8fafc";
      c.strokeStyle = "#dc2626";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(sp.x - 8, sp.y + 8);
      c.lineTo(sp.x, sp.y - 24);
      c.lineTo(sp.x + 8, sp.y + 8);
      c.closePath();
      c.fill(); c.stroke();
      c.restore();
    }

    // 5. Fishbone D Boss (stays visible & dissolves during deathState === "boss")
    if ((boss.hp > 0 || deathState === "boss") && S.BleachChars) {
      const animProg = boss.state === "telegraph" ? 1 - Math.max(0, boss.timer / boss.teleDuration) : 0;
      c.save();
      if (deathState === "boss") {
        const dp = 1 - Math.max(0, deathTimer / 1.55);
        const vib = dp < 0.45 ? Math.sin(t * 70) * 4.5 : 0;
        const alpha = Math.max(0, 1 - Math.max(0, dp - 0.30) / 0.70);
        c.globalAlpha = alpha;
        c.translate(boss.x + vib, boss.y - dp * 14);
        c.rotate(dp * 0.22);
        c.scale(1 + dp * 0.14, Math.max(0.4, 1 - dp * 0.48));
        S.BleachChars.drawFishboneHollow(c, 0, 0, boss.r, t, {
          talking: true,
          bossState: "stagger",
          animProg: 0,
          pattern: boss.pattern,
          enraged: false,
        });
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, boss.r * (0.8 + dp * 1.9), 0, TAU);
        c.stroke();
      } else {
        S.BleachChars.drawFishboneHollow(c, boss.x, boss.y, boss.r, t, {
          talking: boss.state === "telegraph" || boss.state === "attack",
          bossState: boss.state,
          animProg,
          pattern: boss.pattern,
          enraged: boss.enraged,
        });
      }
      c.restore();
      if (boss.hurtFlash > 0 && !deathState) {
        c.save();
        c.globalAlpha = Math.min(0.65, boss.hurtFlash * 4);
        c.fillStyle = "#ffffff";
        c.beginPath(); c.arc(boss.x, boss.y - 6, boss.r * 1.15, 0, TAU); c.fill();
        c.restore();
      }
    }

    // 6. Shinigami Ichigo + Death Collapse / Rotating Hex Guard Shield
    if (S.BleachChars) {
      const ichiOpts = computeIchigoAnimOpts();
      c.save();
      if (deathState === "player") {
        const dp = 1 - Math.max(0, deathTimer / 1.45);
        const fall = Math.min(1, dp * 2.2);
        c.globalAlpha = Math.max(0.55, 1 - dp * 0.35);
        c.translate(player.x, player.y + fall * 8);
        c.rotate((player.facing || 1) * fall * 1.42);
        c.scale(1, 1 - fall * 0.16);
        S.BleachChars.drawShinigamiIchigo(c, 0, 0, player.r, t, player.facing, { mood: "shocked", noShadow: false });
      } else {
        if (pState.iframe > 0) c.globalAlpha = 0.68;
        S.BleachChars.drawShinigamiIchigo(c, player.x, player.y, player.r, t, player.facing, ichiOpts);
        if (pState.hurtFlash > 0) {
          c.globalAlpha = Math.min(0.6, pState.hurtFlash * 2.6);
          c.fillStyle = "#ef4444";
          c.beginPath(); c.arc(player.x, player.y, player.r * 1.05, 0, TAU); c.fill();
        }
      }
      c.restore();

      if (pState.blockTime > 0) {
        c.save();
        c.translate(player.x, player.y);
        c.rotate(t * 2.8);
        const isParry = pState.parryWindow > 0;
        c.strokeStyle = isParry ? "#ffe047" : "#38bdf8";
        c.fillStyle = isParry ? "rgba(255, 224, 71, 0.24)" : "rgba(56, 189, 248, 0.16)";
        c.lineWidth = isParry ? 3.5 : 2.6;
        c.beginPath();
        const rad = player.r + 14;
        for (let k = 0; k < 6; k++) {
          const a = (k * TAU) / 6;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fill(); c.stroke();
        c.restore();
      }
    }

    // 7. Crescent Spiritual Wave Projectiles (Getsuga)
    for (const pr of projectiles) {
      c.save();
      c.translate(pr.x, pr.y);
      c.rotate(pr.ang);
      c.shadowColor = "#38bdf8";
      c.shadowBlur = 18;
      c.fillStyle = "#e0f2fe";
      c.strokeStyle = "#0284c7";
      c.lineWidth = 3.2;
      c.beginPath();
      c.arc(0, 0, pr.r, -1.15, 1.15);
      c.quadraticCurveTo(pr.r * 0.25, 0, Math.cos(-1.15) * pr.r, Math.sin(-1.15) * pr.r);
      c.closePath();
      c.fill(); c.stroke();
      c.restore();
    }

    // 7b. Boss Hollow Cero Orbs (fast glow without shadowBlur)
    for (const bp of bossProjectiles) {
      c.save();
      c.globalAlpha = 0.35;
      c.fillStyle = bp.deflected ? "#ffe047" : "#c026d3";
      c.beginPath(); c.arc(bp.x, bp.y, bp.r * 1.45, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = bp.deflected ? "#fef08a" : "#18181b";
      c.strokeStyle = bp.deflected ? "#f59e0b" : "#e879f9";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(bp.x, bp.y, bp.r, 0, TAU);
      c.fill(); c.stroke();
      c.restore();
    }

    // 7c. Soul Cleaver Stage 2 Raw Sky-Blue Reiatsu Pillar Eruption
    if (pState.ultTimer > 0 && pState.ultTimer <= 0.54) {
      const p = pState.ultTimer / 0.54;
      const cx = (player.x + boss.x) * 0.5;
      const cy = (player.y + boss.y) * 0.5;
      c.save();
      c.globalAlpha = Math.min(1, p * 1.35);
      const pw = 66 * p;
      c.fillStyle = "rgba(56, 189, 248, 0.25)";
      c.fillRect(cx - pw * 0.8, cy - 260, pw * 1.6, 290);
      c.fillStyle = "rgba(14, 165, 233, 0.55)";
      c.fillRect(cx - pw * 0.5, cy - 260, pw, 290);
      c.fillStyle = "#e0f2fe";
      c.fillRect(cx - pw * 0.2, cy - 260, pw * 0.4, 290);
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 4 * p;
      c.beginPath();
      c.ellipse(cx, cy + 16, 82 * (1.2 - p * 0.3), 26 * (1.2 - p * 0.3), 0, 0, TAU);
      c.stroke();
      c.restore();
    }

    // 8. Flashy Slash Arcs & Shockwave Rings (layered glow, zero shadowBlur lag)
    for (const sl of slashes) {
      const p = sl.life / sl.maxLife;
      const sx = sl.followPlayer ? player.x : sl.x;
      const sy = sl.followPlayer ? player.y : sl.y;
      c.save();
      c.globalAlpha = p;
      if (sl.ring) {
        c.strokeStyle = sl.color;
        c.lineWidth = 5.5 * p;
        c.beginPath();
        c.arc(sx, sy, sl.r * (1.25 - p * 0.55), 0, TAU);
        c.stroke();
      } else {
        c.translate(sx, sy);
        c.rotate(sl.ang);
        if (sl.flip) c.scale(1, -1);
        c.lineCap = "round";
        // Outer soft glow stroke
        c.globalAlpha = p * 0.35;
        c.strokeStyle = sl.color;
        c.lineWidth = (sl.heavy ? 18 : 13) * p;
        c.beginPath();
        c.arc(0, 0, sl.r, -1.12, 1.12);
        c.stroke();
        // Main colored arc
        c.globalAlpha = p;
        c.strokeStyle = sl.color;
        c.lineWidth = (sl.heavy ? 9 : 6.5) * p;
        c.beginPath();
        c.arc(0, 0, sl.r, -1.12, 1.12);
        c.stroke();
        // Crisp white core
        c.strokeStyle = "#ffffff";
        c.lineWidth = (sl.heavy ? 3.5 : 2.4) * p;
        c.beginPath();
        c.arc(0, 0, sl.r, -0.92, 0.92);
        c.stroke();
      }
      c.restore();
    }

    // 9. Sparks & Floating Damage Numbers
    for (const pt of particles) {
      c.save();
      c.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      c.fillStyle = pt.color;
      c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, TAU); c.fill();
      c.restore();
    }
    for (const fl of floats) {
      const a = Math.min(1, (fl.life / fl.maxLife) * 1.4);
      c.save();
      c.globalAlpha = a;
      c.font = `900 ${Math.round(14 * fl.scale)}px 'Lilita One', Impact, sans-serif`;
      c.textAlign = "center";
      c.lineWidth = 3.5;
      c.strokeStyle = INK;
      c.strokeText(fl.text, fl.x, fl.y);
      c.fillStyle = fl.color;
      c.fillText(fl.text, fl.x, fl.y);
      c.restore();
    }
  }

  function renderScreenOverlay(c, w, h) {
    // Stage 1 Ultimate Anime Cut-in Banner
    if (pState.ultTimer > 0.54) {
      c.save();
      c.fillStyle = "rgba(15, 23, 42, 0.58)";
      c.fillRect(0, 0, w, h);
      c.translate(w * 0.5, h * 0.42);
      c.rotate(-0.08);
      c.fillStyle = "#0284c7";
      c.strokeStyle = "#e0f2fe";
      c.lineWidth = 4;
      c.fillRect(-w * 0.6, -28, w * 1.2, 56);
      c.strokeRect(-w * 0.6, -28, w * 1.2, 56);
      c.font = "900 24px 'Lilita One', Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.strokeStyle = INK;
      c.lineWidth = 5;
      c.strokeText("SOUL CLEAVER!!", 0, 2);
      c.fillStyle = "#ffe047";
      c.fillText("SOUL CLEAVER!!", 0, 2);
      c.restore();
    }

    // Phase 2 Boss Enrage Warning Banner
    if (enrageBanner > 0) {
      c.save();
      c.globalAlpha = Math.min(1, enrageBanner * 1.5);
      c.fillStyle = "rgba(127, 29, 29, 0.72)";
      c.fillRect(0, h * 0.36, w, 46);
      c.font = "900 20px 'Lilita One', Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.strokeStyle = INK;
      c.lineWidth = 4;
      c.strokeText("FISHBONE D ENRAGED!", w * 0.5, h * 0.36 + 23);
      c.fillStyle = "#fef08a";
      c.fillText("FISHBONE D ENRAGED!", w * 0.5, h * 0.36 + 23);
      c.restore();
    }
  }

  function syncBattleHud() {
    const hpFill = document.getElementById("story-hp-fill");
    const hpText = document.getElementById("story-hp-text");
    if (hpFill) hpFill.style.width = `${Math.max(0, (pState.hp / pState.maxHp) * 100)}%`;
    if (hpText) hpText.textContent = `HP ${pState.hp}/${pState.maxHp}`;

    const bFill = document.getElementById("story-boss-fill");
    const bText = document.getElementById("story-boss-hp-text");
    if (bFill) bFill.style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
    if (bText) bText.textContent = `${boss.hp} / ${boss.maxHp}`;

    const setCd = (btnId, subId, cd, fallback) => {
      const b = document.getElementById(btnId);
      const sub = document.getElementById(subId);
      if (b) b.classList.toggle("on-cd", cd > 0);
      if (sub) sub.textContent = cd > 0 ? cd.toFixed(1) + "s" : fallback;
    };
    setCd("story-cbtn-skill", "story-cd-skill", pState.skillCd, "K");
    setCd("story-cbtn-dodge", "story-cd-dodge", pState.dodgeCd, "L");
    setCd("story-cbtn-block", "story-cd-block", pState.blockCd, "Q");

    const ultBtn = document.getElementById("story-cbtn-ulti");
    const ultSub = document.getElementById("story-cd-ulti");
    if (ultBtn) ultBtn.classList.toggle("ready", pState.ulti >= 100);
    if (ultSub) ultSub.textContent = pState.ulti >= 100 ? "READY!" : `${Math.floor(pState.ulti)}%`;
  }

  S.Battle = {
    isActive: () => active,
    start,
    stop,
    reset: resetBattle,
    update,
    renderEntitiesAndVfx,
    renderScreenOverlay,
    getShakeOffset: () =>
      shake > 0.2 ? { x: (Math.random() - 0.5) * shake * 2, y: (Math.random() - 0.5) * shake * 2 } : { x: 0, y: 0 },
    getUltFlash: () => (pState.ultTimer > 0.54 ? 0.35 : ultFlash * 0.4),
    basicAttack,
    useSkill,
    useDodge,
    useBlock,
    useUlti,
  };
})();
