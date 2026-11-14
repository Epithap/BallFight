// ============================================================
//  SUNG JIN-WOO (SHADOW MONARCH)
//  Solo Leveling — Necromancer / Kamish's Wrath & Shadow Army
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnMutilateXSlashVisual(x, y, angle) {
    return {
      x,
      y,
      angle,
      life: 0.24,
      maxLife: 0.24,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = a;
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.lineCap = "round";

        for (const sgn of [-1, 1]) {
          c.save();
          c.rotate(sgn * 0.55);
          c.strokeStyle = "#581c87";
          c.lineWidth = 11 * a;
          c.shadowColor = "#a855f7";
          c.shadowBlur = 14;
          c.beginPath();
          c.moveTo(-48, 0);
          c.lineTo(48, 0);
          c.stroke();

          c.strokeStyle = "#f3e8ff";
          c.lineWidth = 3.5 * a;
          c.beginPath();
          c.moveTo(-42, 0);
          c.lineTo(42, 0);
          c.stroke();
          c.restore();
        }
        c.restore();
      },
    };
  }

  function spawnShadowSoldier(owner, variant) {
    const isIgris = variant === "igris";
    const startAng = isIgris ? -Math.PI * 0.35 : Math.PI * 0.35;
    const sx = owner.x + Math.cos(startAng) * (owner.radius + 22);
    const sy = owner.y + Math.sin(startAng) * (owner.radius + 22);

    return {
      owner,
      variant,
      x: sx,
      y: sy,
      vx: Math.cos(startAng) * 110,
      vy: Math.sin(startAng) * 110,
      radius: 13,
      life: 6.5,
      maxLife: 6.5,
      slashCd: isIgris ? 0.45 : 0.9,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.slashCd = Math.max(0, this.slashCd - dt);

        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (enemy) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          const desiredSpeed = 295;
          this.vx += (nx * desiredSpeed - this.vx) * Math.min(1, dt * 6.5);
          this.vy += (ny * desiredSpeed - this.vy) * Math.min(1, dt * 6.5);

          if (dist <= enemy.radius + this.radius + 24 && this.slashCd <= 0) {
            this.slashCd = 1.35;
            const dmg = Math.round(7 + rt.rng() * 3);
            const dealt = g.applyDamage(enemy, dmg);
            enemy.flashTimer = 0.1;
            enemy.vx += nx * 130;
            enemy.vy += ny * 130;
            g.spawnSparks(enemy.x, enemy.y, isIgris ? "#c084fc" : "#38bdf8", "#090514");
            g.spawnDamageText(
              enemy.x,
              enemy.y - enemy.radius - 12,
              dealt,
              isIgris ? "#c084fc" : "#38bdf8",
              false,
              isIgris ? "IGRIS SLASH!" : "BERU CLAW!"
            );
            g.sound.playBallHit();

            this.vx = -nx * 145 + -ny * (isIgris ? 90 : -90);
            this.vy = -ny * 145 + nx * (isIgris ? 90 : -90);
          }
        }

        this.x = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.x + this.vx * dt));
        this.y = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.y + this.vy * dt));
      },
      render(c) {
        const a = Math.min(1, this.life / 0.4);
        const glowCol = isIgris ? "#c084fc" : "#38bdf8";
        c.save();
        c.globalAlpha = a;
        c.translate(this.x, this.y);

        c.shadowColor = glowCol;
        c.shadowBlur = 12;
        c.fillStyle = "#090514";
        c.strokeStyle = glowCol;
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Helmet crest (Igris knight plume vs Beru ant king horns)
        if (isIgris) {
          c.fillStyle = "#c084fc";
          c.beginPath();
          c.moveTo(0, -this.radius);
          c.quadraticCurveTo(-10, -this.radius - 11, -15, -this.radius - 3);
          c.quadraticCurveTo(-5, -this.radius - 3, 0, -this.radius + 2);
          c.fill();
        } else {
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-5, -this.radius);
          c.lineTo(-9, -this.radius - 7);
          c.moveTo(5, -this.radius);
          c.lineTo(9, -this.radius - 7);
          c.stroke();
        }

        // Glowing shadow eyes
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.moveTo(-6, -2); c.lineTo(-2, -1); c.lineTo(-5, 2); c.closePath();
        c.moveTo(6, -2); c.lineTo(2, -1); c.lineTo(5, 2); c.closePath();
        c.fill();
        c.restore();
      },
    };
  }

  BF.spawnShadowSoldier = spawnShadowSoldier;

  // ---- Skill 1: Mutilate — Kamish's Wrath (Primary +1 Ult Charge) ----
  const SKILL_MUTILATE_SLASH = {
    name: "Mutilate",
    cooldown: 2.4,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 280) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: "#a855f7",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const nx = Math.cos(aim);
          const ny = Math.sin(aim);

          b.jinwooDashTimer = 0.26;
          b.vx = nx * Math.max(b.baseSpeed * 1.48, 510);
          b.vy = ny * Math.max(b.baseSpeed * 1.48, 510);

          const strikeX = b.x + nx * (b.radius + 42);
          const strikeY = b.y + ny * (b.radius + 42);
          gg.entities.push(spawnMutilateXSlashVisual(strikeX, strikeY, aim));
          gg.entities.push(rt.spawnShockRing(b.x, b.y, "#7c3aed", 78, 0.26));

          const curDist = Math.hypot(t.x - b.x, t.y - b.y);
          if (curDist <= b.radius + t.radius + 115) {
            const rawDmg = inUlt ? Math.round(17 + rt.rng() * 4) : Math.round(14 + rt.rng() * 4);
            const dealt = gg.applyDamage(t, rawDmg);
            t.flashTimer = 0.14;
            t.squash = 0.88;
            t.vx += nx * 215;
            t.vy += ny * 215;
            if (!inUlt) {
              gg.chargeUlt(b);
            }
            gg.spawnSparks(t.x, t.y, "#c084fc", "#090514");
            gg.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#c084fc", inUlt, inUlt ? "MONARCH MUTILATE!" : "MUTILATE!");
            gg.sound.playCritHit();
            rt.setHitStop(0.05);
            rt.addShake(0.15, 4.2);
          }
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Ruler's Authority (Telekinetic Gravity Crush & Pull — No Ult Charge) ----
  const SKILL_RULERS_AUTHORITY = {
    name: "Ruler's Authority",
    cooldown: 4.6,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 340) return false;

      rt.beginCast(ball, {
        kind: "gravity",
        duration: 0.22,
        color: "#38bdf8",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const dx = b.x - t.x;
          const dy = b.y - t.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const rawDmg = Math.round(10 + rt.rng() * 3);
          const dealt = gg.applyDamage(t, rawDmg);
          t.flashTimer = 0.12;
          t.squash = 0.86;
          t.vx = nx * 310;
          t.vy = ny * 310;

          gg.entities.push(rt.spawnShockRing(t.x, t.y, "#38bdf8", 86, 0.3));
          gg.entities.push(rt.spawnShockRing(t.x, t.y, "#a855f7", 62, 0.24));
          gg.spawnSparks(t.x, t.y, "#38bdf8", "#a855f7");
          gg.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#38bdf8", false, "RULER'S AUTHORITY!");
          gg.sound.playBallHit();
          rt.addShake(0.14, 3.8);
        },
      });
      return true;
    },
  };

      // ---- Shared polygon helper (points in radius units) ----
  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: Kamish's Wrath (curved dragon-fang black-violet dagger) ----
  BF.WEAPON_DRAWERS.kamish_dagger = (ball, c) => {
    const isArise = ball.ultTimer > 0;
    c.save();
    c.lineJoin = "round";
    // Wrapped grip
    c.fillStyle = "#1f2937";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.roundRect(-2.8, 6, 5.6, 13, 2);
    c.fill();
    c.stroke();
    // Golden pommel ring
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(0, 21.5, 3, 0, Math.PI * 2);
    c.stroke();
    // Swept crossguard
    c.fillStyle = "#d97706";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-9.5, 7); c.quadraticCurveTo(-4, 2, 0, 3.5); c.quadraticCurveTo(4, 2, 9.5, 7);
    c.lineTo(7.5, 2.5); c.quadraticCurveTo(0, -1.5, -7.5, 2.5);
    c.closePath();
    c.fill();
    c.stroke();
    // Curved dragon-fang blade
    c.shadowColor = isArise ? "#a855f7" : "#7c3aed";
    c.shadowBlur = isArise ? 14 : 8;
    const g = c.createLinearGradient(-4, 0, 4, -36);
    g.addColorStop(0, "#0b0d12");
    g.addColorStop(0.5, "#581c87");
    g.addColorStop(1, "#e9d5ff");
    c.fillStyle = g;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.3;
    c.beginPath();
    c.moveTo(-4.5, 3);
    c.quadraticCurveTo(-6.5, -18, 1.5, -36);
    c.quadraticCurveTo(5.2, -20, 4.5, 3);
    c.closePath();
    c.fill();
    c.stroke();
    c.shadowBlur = 0;
    // Glowing cyan/violet vein along blade
    c.strokeStyle = isArise ? "#38bdf8" : "#c084fc";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, 1);
    c.quadraticCurveTo(-1, -18, 1, -31);
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Sung Jin-Woo (sharp layered undercut black hair, high-collar Monarch coat, shadow flames) ----
  BF.COSTUME_DRAWERS.jinwoo = (ball, r, c) => {
    const isArise = ball.ultTimer > 0;
    const t = performance.now() * 0.001;

    // Arise: dark-violet shadow flames licking up around the Monarch
    if (isArise) {
      c.save();
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.5 + (i - 4) * 0.36;
        const flick = Math.sin(t * 9 + i * 1.7) * 0.12;
        const baseR = r * 0.92;
        const tipR = r * (1.42 + flick + (i % 2) * 0.14);
        c.fillStyle = i % 2 ? "rgba(88, 28, 135, 0.55)" : "rgba(168, 85, 247, 0.42)";
        c.beginPath();
        c.moveTo(Math.cos(a - 0.2) * baseR, Math.sin(a - 0.2) * baseR);
        c.quadraticCurveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2, Math.cos(a + flick) * tipR, Math.sin(a + flick) * tipR);
        c.quadraticCurveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, Math.cos(a + 0.2) * baseR, Math.sin(a + 0.2) * baseR);
        c.closePath();
        c.fill();
      }
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    // Black long hunter coat with a tall stand collar
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    // Dark inner shirt
    c.fillStyle = "#1e1b4b";
    c.fillRect(-r, r * 0.5, r * 2, r * 0.6);
    // Coat body (two panels leaving a V opening)
    c.fillStyle = "#090a10";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * r * 0.1, r * 1.1);
      c.lineTo(s * r * 0.2, r * 0.58);
      c.lineTo(s * r * 0.3, r * 0.44);
      c.lineTo(s * r * 1.05, r * 0.4);
      c.lineTo(s * r * 1.05, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // Tall flared Monarch collar
    c.fillStyle = "#141622";
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * r * 0.24, r * 0.6);
      c.lineTo(s * r * 0.32, r * 0.28);
      c.lineTo(s * r * 0.8, r * 0.18);
      c.lineTo(s * r * 0.88, r * 0.44);
      c.closePath();
      c.fill();
      c.stroke();
    }
    // Glowing Monarch lapel trim
    c.strokeStyle = isArise ? "#c084fc" : "#6366f1";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-r * 0.58, r * 0.56); c.lineTo(-r * 0.52, r * 1.0);
    c.moveTo(r * 0.58, r * 0.56); c.lineTo(r * 0.52, r * 1.0);
    c.stroke();
    c.restore();

    // Sharp, spiky layered Korean Hunter undercut hair with long jagged bangs dipping between the eyes
    const hair = [
      [-0.96, 0.08], [-1.06, -0.28], [-0.94, -0.44], [-1.14, -0.78], [-0.88, -0.86],
      [-0.96, -1.18], [-0.62, -1.06], [-0.48, -1.38], [-0.22, -1.12],
      [0.02, -1.44], [0.22, -1.14], [0.54, -1.36], [0.64, -1.04],
      [0.98, -1.14], [0.88, -0.84], [1.14, -0.74], [0.94, -0.42], [1.06, -0.24], [0.96, 0.08],
      // Sharp layered bangs framing the brow & long central lock between the eyes
      [0.82, -0.14], [0.68, -0.42], [0.5, -0.22], [0.34, -0.48],
      [0.16, -0.2], [0.02, -0.46], [-0.04, -0.08], [-0.16, -0.48],
      [-0.34, -0.22], [-0.5, -0.46], [-0.68, -0.24], [-0.82, -0.14],
    ];
    c.save();
    c.lineJoin = "round";
    const hg = c.createLinearGradient(0, -r * 1.44, 0, 0);
    hg.addColorStop(0, "#1e2436");
    hg.addColorStop(1, "#07090e");
    c.fillStyle = hg;
    c.strokeStyle = isArise ? "#9333ea" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    // Subtle violet/slate hair highlights
    c.strokeStyle = isArise ? "rgba(192, 132, 252, 0.65)" : "rgba(100, 116, 160, 0.6)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.46, -1.18, -0.32, -0.62], [0.02, -1.24, 0.0, -0.6], [0.46, -1.16, 0.3, -0.62],
      [0.82, -0.92, 0.62, -0.54], [-0.82, -0.92, -0.62, -0.54],
    ]) {
      c.moveTo(x0 * r, y0 * r);
      c.lineTo(x1 * r, y1 * r);
    }
    c.stroke();
    c.restore();
  };

BF.CHARACTER_ROSTER.jinwoo = {
    id: "jinwoo",
    name: "SHADOW MONARCH",
    shortName: "MONARCH",
    title: "S-Rank Necromancer • Sovereign of Shadows",
    role: "NECROMANCER • SHADOW ARMY",
    color: "#7c3aed",
    radius: 28,
    speed: 368,
    maxHp: 565,
    damage: [5, 9],
    mass: 1.0,
    costume: "jinwoo",
    weapon: "kamish_dagger",
    ult: "arise",
    ultName: "ARISE (SHADOW ARMY)",
    ultDesc: "Commands the Shadow Army (Igris & Beru) to rise and hunt the enemy for 6.5s while empowering Mutilate and boosting movement speed!",
    skillName: "MUTILATE & RULER'S AUTHORITY",
    skillDesc: "Dashes in with Kamish's Wrath twin daggers for a cross X-slash, and crushes distant enemies with telekinetic Ruler's Authority!",
    skills: [SKILL_MUTILATE_SLASH, SKILL_RULERS_AUTHORITY],
  };
})();
