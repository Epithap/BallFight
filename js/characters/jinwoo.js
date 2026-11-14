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

  // ---- Weapon Drawer: Kamish's Wrath Dragon-Fang Dagger ----
  BF.WEAPON_DRAWERS.kamish_dagger = (ball, c) => {
    const isArise = ball.ultTimer > 0;
    c.save();
    c.shadowColor = isArise ? "#c084fc" : "#9333ea";
    c.shadowBlur = isArise ? 14 : 8;

    // Golden pommel ring & guard
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(0, 16, 3.5, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = "#1e1b4b";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.fillRect(-3, 5, 6, 9);
    c.strokeRect(-3, 5, 6, 9);

    c.fillStyle = "#d97706";
    c.beginPath();
    c.moveTo(-9, 5);
    c.lineTo(0, 1);
    c.lineTo(9, 5);
    c.lineTo(0, 8);
    c.closePath();
    c.fill();
    c.stroke();

    // Curved purple-black dragon fang dagger blade
    const grad = c.createLinearGradient(0, 4, 0, -28);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.55, "#7e22ce");
    grad.addColorStop(1, "#f3e8ff");
    c.fillStyle = grad;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-5.5, 3);
    c.quadraticCurveTo(-7.5, -14, 0, -28);
    c.quadraticCurveTo(4.5, -12, 4.5, 3);
    c.closePath();
    c.fill();
    c.stroke();

    // Glowing cyan/violet core vein
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-1, 0);
    c.lineTo(0, -22);
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Sung Jin-Woo ----
  BF.COSTUME_DRAWERS.jinwoo = (ball, r, c) => {
    const isArise = ball.ultTimer > 0;
    rt.drawSkinFace(ball, r, c);

    // High-collared dark Shadow Monarch coat
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = isArise ? "#090514" : "#0f172a";
    c.fillRect(-r, r * 0.34, r * 2, r * 0.7);

    c.strokeStyle = isArise ? "#c084fc" : "#7c3aed";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-r * 0.55, r * 0.36);
    c.lineTo(-r * 0.16, r);
    c.moveTo(r * 0.55, r * 0.36);
    c.lineTo(r * 0.16, r);
    c.stroke();
    c.restore();

    // Sharp black Monarch undercut hair with bangs
    c.save();
    c.fillStyle = "#090d16";
    c.strokeStyle = isArise ? "#a855f7" : COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-r * 0.92, -r * 0.2);
    c.lineTo(-r * 1.05, -r * 0.66);
    c.lineTo(-r * 0.68, -r * 0.62);
    c.lineTo(-r * 0.54, -r * 1.12);
    c.lineTo(-r * 0.22, -r * 0.84);
    c.lineTo(0, -r * 1.22);
    c.lineTo(r * 0.24, -r * 0.84);
    c.lineTo(r * 0.56, -r * 1.12);
    c.lineTo(r * 0.68, -r * 0.62);
    c.lineTo(r * 1.05, -r * 0.66);
    c.lineTo(r * 0.92, -r * 0.2);
    // Sharp bangs between eyes
    c.lineTo(r * 0.52, -r * 0.46);
    c.lineTo(r * 0.28, -r * 0.14);
    c.lineTo(r * 0.08, -r * 0.48);
    c.lineTo(-r * 0.04, -r * 0.12);
    c.lineTo(-r * 0.26, -r * 0.46);
    c.lineTo(-r * 0.48, -r * 0.16);
    c.closePath();
    c.fill();
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
