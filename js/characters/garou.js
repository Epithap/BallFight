// ============================================================
//  GAROU (HERO HUNTER / AWAKENED MONSTER / COSMIC FEAR)
//  One-Punch Man — Red-Orange Hair Base, Monster Ult & Cosmic Moon Form
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const FONT = BF.FONT || "Impact, system-ui, sans-serif";
  const rt = BF.rt;

  function pickEnemy(ball, g) {
    return g.balls.find((b) => b !== ball && b.alive) || null;
  }

  function restoreBallMotion(ball, prefAngle) {
    if (!ball || !ball.alive) return;
    const curSpd = Math.hypot(ball.vx || 0, ball.vy || 0);
    const targetSpd = Math.max(ball.baseSpeed || 355, 320);
    if (curSpd < targetSpd * 0.65) {
      let ang =
        typeof prefAngle === "number" && !Number.isNaN(prefAngle)
          ? prefAngle
          : curSpd > 1
            ? Math.atan2(ball.vy, ball.vx)
            : Math.random() * Math.PI * 2;
      // Avoid near-cardinal lock so the ball bounces lively across the arena
      if (Math.abs(Math.sin(ang)) < 0.25 || Math.abs(Math.cos(ang)) < 0.25) {
        ang += 0.42;
      }
      ball.vx = Math.cos(ang) * targetSpd;
      ball.vy = Math.sin(ang) * targetSpd;
    }
  }

  // ---- Spiral Helix Martial Arts Wave (Water Stream / Whirlwind Iron) ----
  function spawnSpiralMartialWave({ owner, target, x, y, angle, speed, damage, phase, isWater, castState, isMonster }) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    return {
      owner,
      target,
      x,
      y,
      baseX: x,
      baseY: y,
      ux,
      uy,
      px,
      py,
      angle,
      speed,
      damage,
      phase,
      isWater,
      castState,
      isMonster,
      radius: isMonster ? 15 : 13,
      life: 0.72,
      t: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.t += dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        const infFactor = rt.getInfinitySlowFactor ? rt.getInfinitySlowFactor(this.target, this.x, this.y) : 1;
        this.baseX += this.ux * this.speed * infFactor * dt;
        this.baseY += this.uy * this.speed * infFactor * dt;
        const offset = Math.sin(this.t * 16 + this.phase) * 20;
        this.x = this.baseX + this.px * offset;
        this.y = this.baseY + this.py * offset;

        if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30) {
          this.dead = true;
          return;
        }

        const t = g.balls.find((b) => b !== this.owner && b.alive);
        if (t && Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(t, this.damage);
          t.flashTimer = 0.12;
          t.squash = 0.84;
          if (this.isWater) {
            g.addEffect(t, "slow", 0.6, { factor: 0.78 });
          } else {
            t._garouRuptureTimer = 0.45;
            t._garouRuptureOwner = this.owner;
          }
          if (!this.isMonster && !this.castState.ultCharged) {
            this.castState.ultCharged = true;
            g.chargeUlt(this.owner);
          }
          const col = this.isWater ? "#38bdf8" : "#f43f5e";
          g.entities.push(rt.spawnShockRing(this.x, this.y, col, 64, 0.24));
          g.spawnSparks(this.x, this.y, col, "#ffffff");
          g.spawnDamageText(
            t.x,
            t.y - t.radius - 12,
            dealt,
            col,
            this.isMonster,
            this.isWater ? "WATER STREAM!" : "WHIRLWIND IRON!"
          );
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        const col = this.isWater ? "#38bdf8" : "#f43f5e";
        c.strokeStyle = col;
        c.shadowColor = col;
        c.shadowBlur = 12;
        c.lineWidth = 4.2;
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, 0, this.radius, -1.1, 1.1);
        c.stroke();
        c.strokeStyle = "#f8fafc";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(2, 0, this.radius * 0.72, -0.75, 0.75);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Monster Form Skill: God Slayer Dash + 4-Hit Barrage ----
  function spawnGodSlayerBarrage(owner, target) {
    const dx = target.x - owner.x;
    const dy = target.y - owner.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);
    const startX = owner.x;
    const startY = owner.y;
    const dashDist = Math.max(0, dist - (owner.radius + target.radius + 10));
    const endX = owner.x + (dx / dist) * dashDist;
    const endY = owner.y + (dy / dist) * dashDist;

    return {
      owner,
      target,
      angle,
      startX,
      startY,
      endX,
      endY,
      elapsed: 0,
      dashDur: 0.16,
      hitsDone: 0,
      hitTimes: [0.17, 0.25, 0.33, 0.41],
      totalDur: 0.48,
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        if (this.elapsed >= this.totalDur || !this.owner.alive || !this.target.alive) {
          restoreBallMotion(this.owner, this.angle + Math.PI * 0.72 + (Math.random() - 0.5) * 0.45);
          this.dead = true;
          return;
        }

        if (this.elapsed <= this.dashDur) {
          const t = Math.min(1, this.elapsed / this.dashDur);
          const ease = 1 - Math.pow(1 - t, 2);
          this.owner.x = this.startX + (this.endX - this.startX) * ease;
          this.owner.y = this.startY + (this.endY - this.startY) * ease;
          this.owner.vx = Math.cos(this.angle) * 320;
          this.owner.vy = Math.sin(this.angle) * 320;
          if (Math.random() < 0.65) {
            g.spawnSparks(this.owner.x, this.owner.y, "#ef4444", "#fb923c");
          }
        } else {
          const stickAngle = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x);
          const stickDist = this.owner.radius + this.target.radius + 8;
          this.owner.x = this.target.x - Math.cos(stickAngle) * stickDist;
          this.owner.y = this.target.y - Math.sin(stickAngle) * stickDist;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.angle = stickAngle;

          while (this.hitsDone < this.hitTimes.length && this.elapsed >= this.hitTimes[this.hitsDone]) {
            this.hitsDone += 1;
            const isFinal = this.hitsDone === this.hitTimes.length;
            const dealt = g.applyDamage(this.target, 3);
            this.target.flashTimer = 0.1;
            this.target.squash = 0.85;
            g.spawnSparks(this.target.x, this.target.y, "#ef4444", "#fca5a5");
            g.spawnDamageText(
              this.target.x + (Math.random() - 0.5) * 16,
              this.target.y - this.target.radius - 14,
              dealt,
              isFinal ? "#fca5a5" : "#ef4444",
              isFinal,
              isFinal ? "GOD SLAYER!" : ""
            );
            if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
            if (isFinal) {
              g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#ef4444", 82, 0.26));
              this.target.vx += Math.cos(this.angle) * 220;
              this.target.vy += Math.sin(this.angle) * 220;
              restoreBallMotion(this.owner, this.angle + Math.PI * 0.78);
              g.shake = Math.max(g.shake || 0, 7);
            }
          }
        }
      },
      render(c) {
        c.save();
        if (this.elapsed < this.dashDur) {
          c.strokeStyle = "rgba(239, 68, 68, 0.65)";
          c.lineWidth = 8;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(this.startX, this.startY);
          c.lineTo(this.endX, this.endY);
          c.stroke();
        } else {
          const pulse = (Math.sin(this.elapsed * 55) + 1) * 0.5;
          c.translate(this.owner.x, this.owner.y);
          c.rotate(this.angle);
          c.strokeStyle = `rgba(239, 68, 68, ${0.45 + pulse * 0.45})`;
          c.lineWidth = 4;
          for (let i = -1; i <= 1; i++) {
            c.beginPath();
            c.moveTo(10, i * 10);
            c.lineTo(44 + pulse * 14, i * 14);
            c.stroke();
          }
        }
        c.restore();
      },
    };
  }

  // ---- Water Stream Rock Smashing Counter Stance (True Deflect & Counter-Throw) ----
  function spawnWaterStreamStance(owner) {
    return {
      owner,
      life: 1.15,
      maxLife: 1.15,
      countered: false,
      spin: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.spin += dt * 9;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }
        for (const e of g.entities) {
          if (e === this || e.dead || e.owner === this.owner) continue;
          if (typeof e.x === "number" && typeof e.y === "number" && typeof e.vx === "number" && typeof e.vy === "number") {
            const dist = Math.hypot(e.x - this.owner.x, e.y - this.owner.y);
            if (dist <= this.owner.radius + (e.radius || 12) + 18) {
              e.owner = this.owner;
              e.vx = -e.vx * 1.15;
              e.vy = -e.vy * 1.15;
              this.countered = true;
              g.entities.push(rt.spawnShockRing(e.x, e.y, "#38bdf8", 56, 0.2));
              g.spawnDamageText(this.owner.x, this.owner.y - this.owner.radius - 16, 0, "#38bdf8", false, "DEFLECT!");
            }
          }
        }

        const enemy = pickEnemy(this.owner, g);
        if (enemy && !this.countered) {
          const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
          if (dist <= this.owner.radius + enemy.radius + 14) {
            this.countered = true;
            this.dead = true;
            const ang = Math.atan2(enemy.y - this.owner.y, enemy.x - this.owner.x);
            const dealt = g.applyDamage(enemy, this.owner.ultTimer > 0 ? 11 : 8);
            enemy.vx = Math.cos(ang) * 320;
            enemy.vy = Math.sin(ang) * 320;
            g.addEffect(enemy, "stun", 0.35);
            g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#38bdf8", 78, 0.25));
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#ffffff");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 14, dealt, "#38bdf8", true, "WATER COUNTER!");
          }
        }
      },
      render(c) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const col = this.owner._isCosmicGarou ? "#c084fc" : this.owner.ultTimer > 0 ? "#ef4444" : "#38bdf8";
        c.save();
        c.translate(this.owner.x, this.owner.y);
        c.globalAlpha = 0.82 * alpha;
        c.strokeStyle = col;
        c.lineWidth = 3.5;
        c.beginPath();
        c.arc(0, 0, this.owner.radius + 11, this.spin, this.spin + Math.PI * 1.15);
        c.stroke();
        c.strokeStyle = "#93c5fd";
        c.lineWidth = 2.8;
        c.beginPath();
        c.arc(0, 0, this.owner.radius + 16, this.spin + Math.PI, this.spin + Math.PI * 2.15);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Cosmic Moon Awakening Cutscene (HP < 100 once per match, lifted by GOD) ----
  function spawnCosmicMoonAwakeningCutscene(ball, g) {
    const origX = ball.x;
    const origY = ball.y;
    const moonX = WORLD_SIZE * 0.5;
    const moonY = 92;
    const totalDur = 2.4;

    const floatingRubble = [
      [-58, 125, 6, 0.9], [64, 140, 5, 1.15], [-34, 175, 4.5, 1.3], [46, 162, 6.5, 0.8],
      [-74, 96, 5.5, 1.05], [78, 110, 4, 1.25], [-18, 148, 3.8, 1.4], [24, 132, 5, 0.95],
    ];

    return {
      isCosmicCutsceneEntity: true,
      owner: ball,
      origX,
      origY,
      moonX,
      moonY,
      elapsed: 0,
      totalDur,
      blessed: false,
      healed: false,
      dead: false,
      update(dt, game) {
        this.elapsed += dt;
        const remaining = Math.max(0, this.totalDur - this.elapsed);
        game._cosmicCutsceneTimer = remaining;

        if (!this.owner.alive || this.elapsed >= this.totalDur) {
          game._cosmicCutsceneTimer = 0;
          restoreBallMotion(this.owner, -Math.PI * 0.28 + (Math.random() - 0.5) * 0.5);
          this.dead = true;
          return;
        }

        if (this.elapsed < 0.78) {
          const t = this.elapsed / 0.78;
          const ease = t * t * (3 - 2 * t);
          this.owner.x = this.origX + (this.moonX - this.origX) * ease;
          this.owner.y = this.origY + (this.moonY + 62 - this.origY) * ease;
          this.owner.vx = 0;
          this.owner.vy = 0;
        } else if (this.elapsed < 1.68) {
          this.owner.x = this.moonX;
          this.owner.y = this.moonY + 62;
          this.owner.vx = 0;
          this.owner.vy = 0;
          if (!this.blessed) {
            this.blessed = true;
            this.owner._isCosmicGarou = true;
            this.owner._cosmicMoonWarped = false;
            this.owner.ultTimer = 0;
            this.owner.ultCharge = 0;
            game.entities.push(rt.spawnShockRing(this.owner.x, this.owner.y, "#c084fc", 150, 0.38));
            game.entities.push(rt.spawnShockRing(this.owner.x, this.owner.y, "#38bdf8", 110, 0.32));
            game.spawnSparks(this.owner.x, this.owner.y, "#c084fc", "#38bdf8");
            game.spawnDamageText(this.owner.x, this.owner.y - 42, 0, "#c084fc", true, "COSMIC FEAR AWAKENED!");
            game.shake = Math.max(game.shake || 0, 12);
          }
        } else {
          const t = Math.min(1, (this.elapsed - 1.68) / 0.72);
          const ease = 1 - Math.pow(1 - t, 3);
          this.owner.x = this.moonX + (this.origX - this.moonX) * ease;
          this.owner.y = this.moonY + 62 + (this.origY - (this.moonY + 62)) * ease;
          this.owner.vx = 0;
          this.owner.vy = 0;

          if (t >= 0.94 && !this.healed) {
            this.healed = true;
            const oldHp = this.owner.hp;
            this.owner.hp = Math.min(this.owner.maxHp, this.owner.hp + 50);
            const gained = Math.round(this.owner.hp - oldHp);
            game.addEffect(this.owner, "haste", 14, { mult: 1.22 });
            if (this.owner.skills && this.owner.skills[0]) this.owner.skills[0]._cd = 0;
            game.entities.push(rt.spawnShockRing(this.owner.x, this.owner.y, "#38bdf8", 96, 0.3));
            game.spawnSparks(this.owner.x, this.owner.y, "#4ade80", "#38bdf8");
            game.spawnDamageText(this.owner.x, this.owner.y - this.owner.radius - 18, gained, "#4ade80", true, `+${gained} HP`);
            game._cosmicCutsceneTimer = 0;
            restoreBallMotion(this.owner, -Math.PI * 0.28 + (Math.random() - 0.5) * 0.5);
          }
        }
      },
      render(c) {
        const fadeIn = Math.min(1, this.elapsed / 0.32);
        const fadeOut = Math.min(1, Math.max(0, (this.totalDur - this.elapsed) / 0.32));
        const alpha = Math.min(fadeIn, fadeOut);
        const tNow = this.elapsed;

        c.save();
        // Deep cosmos dim backdrop with purple zenith radial glow
        const veil = c.createRadialGradient(this.moonX, this.moonY, 20, this.moonX, WORLD_SIZE * 0.45, WORLD_SIZE * 0.85);
        veil.addColorStop(0, `rgba(49, 16, 86, ${0.86 * alpha})`);
        veil.addColorStop(0.55, `rgba(10, 12, 34, ${0.82 * alpha})`);
        veil.addColorStop(1, `rgba(2, 4, 14, ${0.82 * alpha})`);
        c.fillStyle = veil;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Colossal Moon looming above
        const moonR = 66;
        const grad = c.createRadialGradient(this.moonX - 10, this.moonY - 10, 8, this.moonX, this.moonY, moonR * 1.48);
        grad.addColorStop(0, `rgba(248, 250, 252, ${0.96 * alpha})`);
        grad.addColorStop(0.58, `rgba(148, 163, 184, ${0.72 * alpha})`);
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(this.moonX, this.moonY, moonR * 1.48, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = `rgba(226, 232, 240, ${0.94 * alpha})`;
        c.beginPath();
        c.arc(this.moonX, this.moonY, moonR * 0.78, 0, Math.PI * 2);
        c.fill();

        // Moon craters on the awakening Moon
        c.fillStyle = `rgba(100, 116, 139, ${0.42 * alpha})`;
        for (const [cx, cy, cr] of [[-22, -16, 9], [18, -22, 7], [-14, 14, 11], [24, 10, 8], [2, -2, 6]]) {
          c.beginPath();
          c.arc(this.moonX + cx, this.moonY + cy, cr, 0, Math.PI * 2);
          c.fill();
        }

        // GOD's Colossal Mysterious Cosmic Silhouette standing atop the Moon & extending His Hand
        if (tNow >= 0.18 && tNow <= 1.92) {
          const godIn = Math.min(1, (tNow - 0.18) / 0.35);
          const godOut = tNow > 1.55 ? Math.max(0, 1 - (tNow - 1.55) / 0.37) : 1;
          const ga = alpha * godIn * godOut;
          const reachP = Math.min(1, Math.max(0, (tNow - 0.3) / 0.5));

          c.save();
          c.globalAlpha = ga;

          // Swirling cosmic aura behind GOD's upper silhouette
          const godGlow = c.createRadialGradient(this.moonX, this.moonY - 30, 8, this.moonX, this.moonY - 22, 82);
          godGlow.addColorStop(0, "rgba(192, 132, 252, 0.72)");
          godGlow.addColorStop(0.55, "rgba(56, 189, 248, 0.35)");
          godGlow.addColorStop(1, "rgba(2, 6, 23, 0)");
          c.fillStyle = godGlow;
          c.beginPath();
          c.arc(this.moonX, this.moonY - 22, 82, 0, Math.PI * 2);
          c.fill();

          // GOD's colossal headless-like / featureless textured cosmic torso & head looming over the Moon
          const torsoG = c.createLinearGradient(this.moonX - 38, this.moonY - 78, this.moonX + 38, this.moonY + 25);
          torsoG.addColorStop(0, "#1e1b4b");
          torsoG.addColorStop(0.45, "#090418");
          torsoG.addColorStop(1, "#020617");
          c.fillStyle = torsoG;
          c.strokeStyle = "#c084fc";
          c.lineWidth = 2.2;

          // Shoulders + hunched giant silhouette
          c.beginPath();
          c.moveTo(this.moonX - 44, this.moonY + 6);
          c.quadraticCurveTo(this.moonX - 46, this.moonY - 46, this.moonX - 18, this.moonY - 56);
          c.lineTo(this.moonX - 14, this.moonY - 76);
          c.quadraticCurveTo(this.moonX, this.moonY - 88, this.moonX + 14, this.moonY - 76);
          c.lineTo(this.moonX + 18, this.moonY - 56);
          c.quadraticCurveTo(this.moonX + 48, this.moonY - 46, this.moonX + 44, this.moonY + 6);
          c.closePath();
          c.fill();
          c.stroke();

          // Fleshy/nebula anatomical contour striations inside GOD's silhouette
          c.strokeStyle = "rgba(168, 85, 247, 0.55)";
          c.lineWidth = 1.3;
          for (let i = -2; i <= 2; i++) {
            c.beginPath();
            c.moveTo(this.moonX + i * 10, this.moonY - 56 + Math.abs(i) * 4);
            c.quadraticCurveTo(this.moonX + i * 15, this.moonY - 25, this.moonX + i * 9, this.moonY + 2);
            c.stroke();
          }

          // GOD's Giant Outstretched Cosmic Hand reaching down to touch Garou's head
          const handTipX = this.owner.x + Math.sin(tNow * 8) * 1.5;
          const handTipY = this.moonY + 10 + reachP * 38;
          c.fillStyle = "#090418";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2.2;
          c.beginPath();
          c.moveTo(this.moonX + 26, this.moonY - 30);
          c.quadraticCurveTo(this.moonX + 36, this.moonY + 4, handTipX + 14, handTipY - 12);
          c.lineTo(handTipX + 4, handTipY); // Reaching index finger tip
          c.lineTo(handTipX - 4, handTipY - 10);
          c.lineTo(handTipX - 10, handTipY - 3);
          c.lineTo(handTipX - 15, handTipY - 16);
          c.quadraticCurveTo(this.moonX + 8, this.moonY - 4, this.moonX + 12, this.moonY - 32);
          c.closePath();
          c.fill();
          c.stroke();

          // Finger-tip cosmic spark singularity where GOD bestows power
          if (tNow >= 0.7) {
            const orbR = 11 + Math.sin(tNow * 24) * 3;
            const fg = c.createRadialGradient(handTipX, handTipY, 1, handTipX, handTipY, orbR * 2.2);
            fg.addColorStop(0, "#ffffff");
            fg.addColorStop(0.4, "#c084fc");
            fg.addColorStop(1, "rgba(56, 189, 248, 0)");
            c.fillStyle = fg;
            c.beginPath();
            c.arc(handTipX, handTipY, orbR * 2.2, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        }

        // Anti-gravity floating Moon rocks rising upward around Garou
        c.save();
        c.fillStyle = `rgba(203, 213, 225, ${0.88 * alpha})`;
        c.strokeStyle = `rgba(192, 132, 252, ${0.7 * alpha})`;
        c.lineWidth = 1.4;
        for (const [rx, ry0, size, spdMul] of floatingRubble) {
          const driftY = ry0 - tNow * 68 * spdMul;
          const drawX = this.owner.x + rx + Math.sin(tNow * 3 + rx) * 5;
          const drawY = this.moonY + driftY;
          if (drawY > 18 && drawY < WORLD_SIZE - 18) {
            c.beginPath();
            c.moveTo(drawX - size, drawY);
            c.lineTo(drawX, drawY - size * 0.85);
            c.lineTo(drawX + size, drawY + size * 0.25);
            c.lineTo(drawX - size * 0.3, drawY + size * 0.9);
            c.closePath();
            c.fill();
            c.stroke();
          }
        }
        c.restore();

        // Swirling galaxy vortex & divine lightning transfer around Garou
        const gx = this.owner.x;
        const gy = this.owner.y;
        const gxAlpha = alpha * Math.min(1, Math.max(0.25, tNow / 0.55));
        c.save();
        c.translate(gx, gy);
        c.rotate(tNow * 5.2);
        c.strokeStyle = `rgba(192, 132, 252, ${0.82 * gxAlpha})`;
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(0, 0, 52, 19, 0.35, 0, Math.PI * 1.7);
        c.stroke();
        c.strokeStyle = `rgba(56, 189, 248, ${0.82 * gxAlpha})`;
        c.beginPath();
        c.ellipse(0, 0, 44, 15, -0.45, 0, Math.PI * 1.65);
        c.stroke();
        c.restore();

        if (tNow >= 0.45 && tNow <= 1.85) {
          const beamGrad = c.createLinearGradient(this.moonX, this.moonY, this.moonX, gy + 36);
          beamGrad.addColorStop(0, `rgba(192, 132, 252, ${0.82 * alpha})`);
          beamGrad.addColorStop(0.55, `rgba(56, 189, 248, ${0.42 * alpha})`);
          beamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
          c.fillStyle = beamGrad;
          c.beginPath();
          c.moveTo(this.moonX - 24, this.moonY + 10);
          c.lineTo(this.moonX + 24, this.moonY + 10);
          c.lineTo(gx + 52, gy + 36);
          c.lineTo(gx - 52, gy + 36);
          c.closePath();
          c.fill();

          // Divine Bestowal jagged cosmic lightning arcs from GOD's hand into Garou
          if (tNow >= 0.68 && tNow <= 1.68) {
            c.strokeStyle = `rgba(240, 171, 252, ${0.95 * alpha})`;
            c.lineWidth = 2.6;
            for (let b = -1; b <= 1; b++) {
              c.beginPath();
              c.moveTo(this.moonX + b * 8, this.moonY + 46);
              c.lineTo(
                gx + b * 22 + Math.sin(tNow * 40 + b) * 14,
                (this.moonY + 46 + gy) * 0.5
              );
              c.lineTo(gx + b * 6, gy);
              c.stroke();
            }

            // Dramatic callout banner
            c.font = `900 22px ${FONT}`;
            c.textAlign = "center";
            c.lineWidth = 5;
            c.strokeStyle = "#090418";
            c.strokeText("DIVINE BESTOWAL: COSMIC FEAR!", WORLD_SIZE * 0.5, WORLD_SIZE - 44);
            c.fillStyle = "#e879f9";
            c.fillText("DIVINE BESTOWAL: COSMIC FEAR!", WORLD_SIZE * 0.5, WORLD_SIZE - 44);
          }
        }
        c.restore();
      },
    };
  }

  // ---- Outer Space Viewport Canvas (Green Area Outside Arena) & Full Moon Surface Arena (Red Box) ----
  const GAROU_SPACE_STARS = Array.from({ length: 95 }, (_, i) => {
    const s1 = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
    const s2 = Math.sin(i * 78.233 + 1.618) * 24634.6345;
    const s3 = Math.sin(i * 45.164 + 7.23) * 18432.19;
    return [
      s1 - Math.floor(s1),
      s2 - Math.floor(s2),
      0.8 + (s3 - Math.floor(s3)) * 1.9,
      i % 5 === 0 ? "#bae6fd" : i % 7 === 0 ? "#f5d0fe" : i % 11 === 0 ? "#fde68a" : "#f8fafc",
    ];
  });

  function ensureOuterSpaceAppLayer() {
    if (typeof document === "undefined") return;
    const appEl = document.querySelector(".app");
    if (appEl && appEl.style.position !== "relative") {
      appEl.style.position = "relative";
      appEl.style.zIndex = "1";
    }
  }

  function syncGarouOuterSpaceBg(game, alpha) {
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    const id = "garou-outer-space-canvas";
    let bgCanvas = document.getElementById(id);

    const screenBattle = document.getElementById("screen-battle");
    const battleVisible = !screenBattle || !screenBattle.classList.contains("hidden");
    const shouldShow = alpha > 0.01 && game && game._moonArenaTimer > 0 && battleVisible;

    if (!shouldShow) {
      if (bgCanvas) bgCanvas.style.display = "none";
      return;
    }

    ensureOuterSpaceAppLayer();
    if (!bgCanvas) {
      bgCanvas = document.createElement("canvas");
      bgCanvas.id = id;
      bgCanvas.style.cssText =
        "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0;";
      document.body.insertBefore(bgCanvas, document.body.firstChild);
    }

    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    if (bgCanvas.width !== w) bgCanvas.width = w;
    if (bgCanvas.height !== h) bgCanvas.height = h;
    bgCanvas.style.display = "block";
    bgCanvas._lastDrawTs = performance.now();

    // Auto-hide watchdog so leaving screen-battle or resetting the match never leaves space canvas stuck
    if (!bgCanvas._watchdogActive && typeof requestAnimationFrame === "function") {
      bgCanvas._watchdogActive = true;
      const tickWatchdog = () => {
        const sb = document.getElementById("screen-battle");
        const active = !sb || !sb.classList.contains("hidden");
        const stale = performance.now() - (bgCanvas._lastDrawTs || 0) > 260;
        if (!active || stale) {
          bgCanvas.style.display = "none";
          bgCanvas._watchdogActive = false;
          return;
        }
        requestAnimationFrame(tickWatchdog);
      };
      requestAnimationFrame(tickWatchdog);
    }

    const sc = bgCanvas.getContext("2d");
    if (!sc) return;
    const now = performance.now() * 0.001;

    sc.save();
    sc.clearRect(0, 0, w, h);
    sc.globalAlpha = Math.min(1, alpha);

    // 1. Vast Outer Space Deep Cosmos Backdrop
    const deep = sc.createLinearGradient(0, 0, w, h);
    deep.addColorStop(0, "#020109");
    deep.addColorStop(0.45, "#090521");
    deep.addColorStop(1, "#030b1d");
    sc.fillStyle = deep;
    sc.fillRect(0, 0, w, h);

    // 2. Sweeping Outer-Space Nebulae Clouds across Left / Right / Top Margins
    for (const [nx, ny, nr, col1, col2] of [
      [w * 0.14, h * 0.28, Math.max(w, h) * 0.34, "rgba(168, 85, 247, 0.24)", "rgba(56, 189, 248, 0.06)"],
      [w * 0.86, h * 0.32, Math.max(w, h) * 0.36, "rgba(56, 189, 248, 0.22)", "rgba(139, 92, 246, 0.06)"],
      [w * 0.22, h * 0.84, Math.max(w, h) * 0.32, "rgba(244, 63, 94, 0.16)", "rgba(168, 85, 247, 0.04)"],
      [w * 0.82, h * 0.8, Math.max(w, h) * 0.3, "rgba(99, 102, 241, 0.2)", "rgba(56, 189, 248, 0.04)"],
    ]) {
      const ng = sc.createRadialGradient(nx, ny, nr * 0.06, nx, ny, nr);
      ng.addColorStop(0, col1);
      ng.addColorStop(0.55, col2);
      ng.addColorStop(1, "rgba(2, 6, 23, 0)");
      sc.fillStyle = ng;
      sc.beginPath();
      sc.arc(nx, ny, nr, 0, Math.PI * 2);
      sc.fill();
    }

    // 3. Twinkling Cosmic Starfield
    for (let i = 0; i < GAROU_SPACE_STARS.length; i++) {
      const [sx, sy, sr, col] = GAROU_SPACE_STARS[i];
      const tw = 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(now * (1.8 + (i % 5) * 0.4) + i * 2.1));
      sc.fillStyle = col;
      sc.globalAlpha = Math.min(1, alpha) * tw;
      sc.beginPath();
      sc.arc(sx * w, sy * h, sr, 0, Math.PI * 2);
      sc.fill();
    }
    sc.globalAlpha = Math.min(1, alpha);

    // 4. Distant Ringed Saturn-like Gas Giant (Left Margin)
    const satX = Math.max(66, w * 0.13);
    const satY = h * 0.34;
    const satR = Math.min(48, Math.max(26, w * 0.04));
    sc.save();
    sc.translate(satX, satY);
    sc.rotate(-0.34);
    sc.strokeStyle = "rgba(216, 180, 254, 0.5)";
    sc.lineWidth = 6;
    sc.beginPath();
    sc.ellipse(0, 0, satR * 2.25, satR * 0.56, 0, Math.PI, Math.PI * 2);
    sc.stroke();

    const satGrad = sc.createRadialGradient(-satR * 0.3, -satR * 0.3, 3, 0, 0, satR);
    satGrad.addColorStop(0, "#fae8ff");
    satGrad.addColorStop(0.5, "#9333ea");
    satGrad.addColorStop(1, "#1e1b4b");
    sc.fillStyle = satGrad;
    sc.beginPath();
    sc.arc(0, 0, satR, 0, Math.PI * 2);
    sc.fill();

    // Front ring arc & inner cyan ring
    sc.strokeStyle = "rgba(186, 230, 253, 0.72)";
    sc.lineWidth = 5;
    sc.beginPath();
    sc.ellipse(0, 0, satR * 2.25, satR * 0.56, 0, 0, Math.PI);
    sc.stroke();
    sc.strokeStyle = "rgba(253, 224, 71, 0.45)";
    sc.lineWidth = 2;
    sc.beginPath();
    sc.ellipse(0, 0, satR * 1.75, satR * 0.42, 0, 0, Math.PI * 2);
    sc.stroke();
    sc.restore();

    // 5. Crimson-Gold Volcanic Exoplanet + Orbiting Moonlet (Bottom-Left Margin)
    const exoX = Math.max(54, w * 0.11);
    const exoY = h * 0.76;
    const exoR = Math.min(34, Math.max(18, w * 0.028));
    const exoGlow = sc.createRadialGradient(exoX, exoY, exoR * 0.5, exoX, exoY, exoR * 1.65);
    exoGlow.addColorStop(0, "rgba(249, 115, 22, 0.42)");
    exoGlow.addColorStop(1, "rgba(249, 115, 22, 0)");
    sc.fillStyle = exoGlow;
    sc.beginPath();
    sc.arc(exoX, exoY, exoR * 1.65, 0, Math.PI * 2);
    sc.fill();
    const exoGrad = sc.createRadialGradient(exoX - exoR * 0.35, exoY - exoR * 0.35, 2, exoX, exoY, exoR);
    exoGrad.addColorStop(0, "#fed7aa");
    exoGrad.addColorStop(0.55, "#ea580c");
    exoGrad.addColorStop(1, "#3b0764");
    sc.fillStyle = exoGrad;
    sc.beginPath();
    sc.arc(exoX, exoY, exoR, 0, Math.PI * 2);
    sc.fill();
    // Orbiting moonlet
    sc.fillStyle = "#cbd5e1";
    sc.beginPath();
    sc.arc(exoX + Math.cos(now * 0.7) * (exoR + 18), exoY + Math.sin(now * 0.7) * (exoR * 0.45), 5.5, 0, Math.PI * 2);
    sc.fill();

    // 6. Majestic Blue-Marble Earth Rising in Outer Space (Right Margin)
    const earthX = Math.min(w - 64, w * 0.87);
    const earthY = h * 0.3;
    const earthR = Math.min(54, Math.max(30, w * 0.044));
    const atmo = sc.createRadialGradient(earthX, earthY, earthR * 0.72, earthX, earthY, earthR * 1.6);
    atmo.addColorStop(0, "rgba(56, 189, 248, 0.65)");
    atmo.addColorStop(0.6, "rgba(37, 99, 235, 0.24)");
    atmo.addColorStop(1, "rgba(37, 99, 235, 0)");
    sc.fillStyle = atmo;
    sc.beginPath();
    sc.arc(earthX, earthY, earthR * 1.6, 0, Math.PI * 2);
    sc.fill();

    sc.save();
    sc.beginPath();
    sc.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    sc.clip();
    const ocean = sc.createRadialGradient(earthX - earthR * 0.32, earthY - earthR * 0.32, 4, earthX, earthY, earthR);
    ocean.addColorStop(0, "#7dd3fc");
    ocean.addColorStop(0.55, "#0284c7");
    ocean.addColorStop(1, "#0f172a");
    sc.fillStyle = ocean;
    sc.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);

    sc.fillStyle = "rgba(52, 211, 153, 0.62)";
    sc.beginPath();
    sc.ellipse(earthX - earthR * 0.24, earthY - earthR * 0.16, earthR * 0.38, earthR * 0.24, 0.42, 0, Math.PI * 2);
    sc.ellipse(earthX + earthR * 0.3, earthY + earthR * 0.22, earthR * 0.32, earthR * 0.2, -0.32, 0, Math.PI * 2);
    sc.fill();
    sc.strokeStyle = "rgba(255, 255, 255, 0.65)";
    sc.lineWidth = 2.6;
    sc.beginPath();
    sc.arc(earthX - 5, earthY - 2, earthR * 0.68, -0.45, 1.15);
    sc.stroke();
    sc.restore();

    // 7. Distant Spiral Galaxy & Drifting Asteroid Belt (Bottom-Right Margin)
    const galX = Math.min(w - 56, w * 0.86);
    const galY = h * 0.74;
    sc.save();
    sc.translate(galX, galY);
    sc.rotate(0.42 + now * 0.08);
    const galGlow = sc.createRadialGradient(0, 0, 2, 0, 0, 44);
    galGlow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    galGlow.addColorStop(0.3, "rgba(240, 171, 252, 0.58)");
    galGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
    sc.fillStyle = galGlow;
    sc.beginPath();
    sc.ellipse(0, 0, 46, 17, 0, 0, Math.PI * 2);
    sc.fill();
    sc.strokeStyle = "rgba(186, 230, 253, 0.55)";
    sc.lineWidth = 2;
    sc.beginPath();
    sc.ellipse(0, 0, 38, 12, 0.1, 0.2, Math.PI * 1.45);
    sc.ellipse(0, 0, 26, 8, 0.1, Math.PI + 0.2, Math.PI * 2.45);
    sc.stroke();
    sc.restore();

    // Shooting star comet streak periodically crossing the deep sky
    const cometPhase = (now * 0.35) % 1;
    const cx0 = w * (0.1 + cometPhase * 0.85);
    const cy0 = h * (0.06 + cometPhase * 0.22);
    const cometGrad = sc.createLinearGradient(cx0, cy0, cx0 - 70, cy0 - 24);
    cometGrad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    cometGrad.addColorStop(0.4, "rgba(125, 211, 252, 0.45)");
    cometGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
    sc.strokeStyle = cometGrad;
    sc.lineWidth = 2.4;
    sc.beginPath();
    sc.moveTo(cx0, cy0);
    sc.lineTo(cx0 - 70, cy0 - 24);
    sc.stroke();

    sc.restore();
  }

  function drawSubspacePortalDisc(c, x, y, rx, ry, rot, alpha) {
    if (alpha <= 0 || rx <= 1 || ry <= 1) return;
    c.save();
    c.translate(x, y);
    c.globalAlpha = alpha;

    // Outer cosmic aura
    c.save();
    c.scale(1, ry / rx);
    const outer = c.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx * 1.25);
    outer.addColorStop(0, "#000000");
    outer.addColorStop(0.55, "#090418");
    outer.addColorStop(0.78, "rgba(168, 85, 247, 0.85)");
    outer.addColorStop(0.92, "rgba(56, 189, 248, 0.55)");
    outer.addColorStop(1, "rgba(56, 189, 248, 0)");
    c.fillStyle = outer;
    c.beginPath();
    c.arc(0, 0, rx * 1.25, 0, Math.PI * 2);
    c.fill();

    // Swirling vortex arms
    c.rotate(rot);
    c.strokeStyle = "#c084fc";
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(0, 0, rx * 0.82, 0, Math.PI * 1.35);
    c.stroke();

    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(0, 0, rx * 0.56, Math.PI * 0.7, Math.PI * 1.95);
    c.stroke();

    // Pitch-black singularity center
    c.fillStyle = "#020108";
    c.beginPath();
    c.arc(0, 0, rx * 0.42, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.restore();
  }

  // ---- Arena (Red Box): 100% Sculpted Moon Surface + Outer Space Viewport Background ----
  BF.drawMoonArenaOverlay = function (c, game) {
    const t = Math.min(1, (game._moonArenaTimer || 0) / 0.5);
    const now = performance.now() * 0.001;
    syncGarouOuterSpaceBg(game, t);

    c.save();

    // 1. Full-Arena Lunar Regolith Surface covering 100% of the Red Box (0..WORLD_SIZE)
    const surfGrad = c.createRadialGradient(
      WORLD_SIZE * 0.46,
      WORLD_SIZE * 0.44,
      24,
      WORLD_SIZE * 0.5,
      WORLD_SIZE * 0.5,
      WORLD_SIZE * 0.76
    );
    surfGrad.addColorStop(0, `rgba(116, 126, 152, ${0.98 * t})`);
    surfGrad.addColorStop(0.55, `rgba(74, 83, 108, ${0.98 * t})`);
    surfGrad.addColorStop(1, `rgba(38, 44, 62, ${0.99 * t})`);
    c.fillStyle = surfGrad;
    c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Soft silver-violet lunar highland dust bands
    for (const [bx, by, br, col] of [
      [0.24, 0.25, 160, `rgba(148, 163, 184, ${0.22 * t})`],
      [0.75, 0.3, 150, `rgba(165, 180, 203, ${0.18 * t})`],
      [0.32, 0.76, 175, `rgba(30, 41, 59, ${0.28 * t})`],
      [0.74, 0.75, 165, `rgba(192, 132, 252, ${0.09 * t})`],
    ]) {
      const dg = c.createRadialGradient(WORLD_SIZE * bx, WORLD_SIZE * by, 10, WORLD_SIZE * bx, WORLD_SIZE * by, br);
      dg.addColorStop(0, col);
      dg.addColorStop(1, "rgba(71, 85, 105, 0)");
      c.fillStyle = dg;
      c.beginPath();
      c.arc(WORLD_SIZE * bx, WORLD_SIZE * by, br, 0, Math.PI * 2);
      c.fill();
    }

    // 2. Lunar Crust Tectonic Ridges & Fracture Lines
    c.strokeStyle = `rgba(30, 41, 59, ${0.42 * t})`;
    c.lineWidth = 2;
    c.lineCap = "round";
    for (const pts of [
      [[0.06, 0.2], [0.22, 0.28], [0.36, 0.24], [0.51, 0.32]],
      [[0.94, 0.18], [0.76, 0.27], [0.64, 0.23]],
      [[0.1, 0.68], [0.28, 0.62], [0.42, 0.71], [0.58, 0.66]],
      [[0.62, 0.86], [0.77, 0.79], [0.92, 0.84]],
    ]) {
      c.beginPath();
      pts.forEach(([px, py], idx) =>
        idx === 0 ? c.moveTo(px * WORLD_SIZE, py * WORLD_SIZE) : c.lineTo(px * WORLD_SIZE, py * WORLD_SIZE)
      );
      c.stroke();
    }

    // 3. Subtle Cosmic Astrolabe / Star-Chart Rings etched faintly into the Moon Dust
    c.save();
    c.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5);
    c.strokeStyle = `rgba(226, 232, 240, ${0.18 * t})`;
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 0, WORLD_SIZE * 0.36, 0, Math.PI * 2);
    c.stroke();

    c.rotate(now * 0.14);
    c.strokeStyle = `rgba(192, 132, 252, ${0.22 * t})`;
    c.setLineDash([12, 10]);
    c.beginPath();
    c.arc(0, 0, WORLD_SIZE * 0.24, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // 4. Sculpted Lunar Impact Craters distributed across the whole floor (Top, Mid, Bottom)
    const craters = [
      [0.18, 0.16, 44, 34, -0.15, true],
      [0.52, 0.14, 32, 24, 0.12, false],
      [0.82, 0.2, 48, 36, 0.22, true],
      [0.14, 0.48, 36, 28, 0.08, false],
      [0.84, 0.52, 40, 31, -0.2, false],
      [0.5, 0.5, 58, 44, 0.05, true],
      [0.24, 0.82, 50, 38, 0.14, true],
      [0.58, 0.84, 30, 22, -0.12, false],
      [0.82, 0.8, 42, 32, -0.18, false],
    ];
    for (const [cx, cy, rx, ry, rot, hasPeak] of craters) {
      c.save();
      c.translate(cx * WORLD_SIZE, cy * WORLD_SIZE);
      c.rotate(rot);

      // Outer crater rim shadow & ejecta ring
      c.strokeStyle = `rgba(203, 213, 225, ${0.34 * t})`;
      c.lineWidth = 3.2;
      c.beginPath();
      c.ellipse(0, 0, rx + 2, ry + 2, 0, Math.PI * 0.9, Math.PI * 1.95);
      c.stroke();

      // Dark sunken crater basin gradient
      const cg = c.createRadialGradient(-rx * 0.2, -ry * 0.2, 2, 0, 0, rx);
      cg.addColorStop(0, `rgba(28, 34, 50, ${0.78 * t})`);
      cg.addColorStop(0.65, `rgba(43, 50, 72, ${0.65 * t})`);
      cg.addColorStop(1, `rgba(148, 163, 184, ${0.28 * t})`);
      c.fillStyle = cg;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      c.fill();

      // Inner bright silver rim highlight (moon sunlight side)
      c.strokeStyle = `rgba(241, 245, 249, ${0.36 * t})`;
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, rx - 1, ry - 1, 0, Math.PI * 0.05, Math.PI * 0.9);
      c.stroke();

      if (hasPeak) {
        c.fillStyle = `rgba(148, 163, 184, ${0.35 * t})`;
        c.beginPath();
        c.ellipse(0, 0, rx * 0.18, ry * 0.16, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // 5. Scattered Moon Boulders & Regolith Pebbles
    c.fillStyle = `rgba(203, 213, 225, ${0.55 * t})`;
    c.strokeStyle = `rgba(30, 41, 59, ${0.6 * t})`;
    c.lineWidth = 1.4;
    for (const [px, py, pr] of [
      [0.09, 0.34, 5.5], [0.34, 0.22, 4], [0.68, 0.28, 5], [0.91, 0.4, 6],
      [0.37, 0.64, 4.5], [0.66, 0.64, 5.5], [0.11, 0.72, 6], [0.43, 0.91, 5],
      [0.72, 0.91, 4.2], [0.9, 0.66, 4.8],
    ]) {
      c.beginPath();
      c.ellipse(px * WORLD_SIZE, py * WORLD_SIZE, pr, pr * 0.75, pr, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    c.restore();
  };

  function spawnMoonArenaController(g) {
    const existing = g.entities.find((e) => e.type === "garou_moon_arena_controller" && !e.dead);
    if (existing) {
      g._moonArenaTimer = Math.max(g._moonArenaTimer || 0, 999);
      return existing;
    }
    g._moonArenaTimer = 999;
    return {
      type: "garou_moon_arena_controller",
      dead: false,
      update(dt, game) {
        const anyAliveGarou =
          game &&
          Array.isArray(game.balls) &&
          game.balls.some((b) => b.alive && b.costume === "garou" && b._isCosmicGarou);
        if (!anyAliveGarou) {
          game._moonArenaTimer = Math.max(0, (game._moonArenaTimer || 0) - dt * 180);
          if (game._moonArenaTimer <= 0) {
            syncGarouOuterSpaceBg(game, 0);
            this.dead = true;
          }
          return;
        }
        game._moonArenaTimer = Math.max(10, (game._moonArenaTimer || 999) - dt);
      },
      render() {},
    };
  }

  // ---- Cosmic Opener Skill (1st Skill After Awakening): Auto-Lock Dash -> Portal Transit to Moon ----
  function spawnCosmicPortalMoonTransitCutscene(owner, target, g) {
    const startX = (owner.x + target.x) * 0.5;
    const startY = (owner.y + target.y) * 0.5;
    const cx = WORLD_SIZE * 0.5;
    const cy = WORLD_SIZE * 0.5;
    const totalDur = 1.2;
    g._cosmicCutsceneTimer = totalDur;

    return {
      isCosmicCutsceneEntity: true,
      owner,
      target,
      startX,
      startY,
      cx,
      cy,
      elapsed: 0,
      totalDur,
      warpedToMoon: false,
      slammed: false,
      dead: false,
      update(dt, game) {
        this.elapsed += dt;
        game._cosmicCutsceneTimer = Math.max(0, this.totalDur - this.elapsed);

        if (!this.owner.alive || !this.target.alive || this.elapsed >= this.totalDur) {
          this.owner._portalScale = 1;
          this.target._portalScale = 1;
          game._cosmicCutsceneTimer = 0;
          restoreBallMotion(this.owner, -Math.PI * 0.25 + (Math.random() - 0.5) * 0.5);
          restoreBallMotion(this.target, Math.PI * 0.25 + (Math.random() - 0.5) * 0.5);
          this.dead = true;
          return;
        }

        // Phase 1 (0 -> 0.48s): Both fighters are sucked into the Subspace Portal
        if (this.elapsed < 0.48) {
          const p = this.elapsed / 0.48;
          const spin = p * Math.PI * 3;
          const rDist = (1 - p) * 26;
          this.owner.x = this.startX + Math.cos(spin) * rDist;
          this.owner.y = this.startY + Math.sin(spin) * rDist;
          this.target.x = this.startX - Math.cos(spin) * rDist;
          this.target.y = this.startY - Math.sin(spin) * rDist;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.target.vx = 0;
          this.target.vy = 0;
        }
        // Phase 2 (0.48 -> 0.82s): Hyperspace warp to the Moon Sanctuary
        else if (this.elapsed < 0.82) {
          if (!this.warpedToMoon) {
            this.warpedToMoon = true;
            this.owner._cosmicMoonWarped = true;
            game.entities.push(spawnMoonArenaController(game));
            game.spawnDamageText(this.cx, this.cy - 68, 0, "#c084fc", true, "HYPERSPACE GATE: MOON ARENA!");
            game.shake = Math.max(game.shake || 0, 11);
          }
          this.owner.x = this.cx - 48;
          this.owner.y = this.cy;
          this.target.x = this.cx + 48;
          this.target.y = this.cy;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.target.vx = 0;
          this.target.vy = 0;
        }
        // Phase 3 (0.82 -> 1.2s): Emerge on the Moon & slam enemy
        else {
          if (!this.slammed) {
            this.slammed = true;
            const dealt = game.applyDamage ? 12 : 12;
            this.target.hp = Math.max(1, this.target.hp - dealt);
            this.target.flashTimer = 0.16;
            this.target.squash = 0.78;
            this.owner.vx = -Math.cos(0.45) * Math.max(this.owner.baseSpeed || 355, 340);
            this.owner.vy = -Math.sin(0.45) * Math.max(this.owner.baseSpeed || 355, 340);
            this.target.vx = Math.cos(0.45) * 280;
            this.target.vy = Math.sin(0.45) * 280;
            game.entities.push(rt.spawnShockRing(this.cx, this.cy, "#38bdf8", 165, 0.38));
            game.entities.push(rt.spawnShockRing(this.cx, this.cy, "#c084fc", 120, 0.3));
            game.spawnSparks(this.target.x, this.target.y, "#c084fc", "#38bdf8");
            game.spawnDamageText(this.target.x, this.target.y - 34, dealt, "#38bdf8", true, "MOON FALL!");
            if (this.owner.skills && this.owner.skills[0]) {
              this.owner.skills[0]._cd = 0.45;
            }
          }
        }
      },
      render(c) {
        const rot = this.elapsed * 9;
        if (this.elapsed < 0.55) {
          const p = Math.min(1, this.elapsed / 0.25);
          drawSubspacePortalDisc(c, this.startX, this.startY, 78 * p, 78 * p, rot, 0.95);
        }
        if (this.elapsed >= 0.38 && this.elapsed <= 0.88) {
          const flash = Math.sin(((this.elapsed - 0.38) / 0.5) * Math.PI);
          c.save();
          c.fillStyle = `rgba(192, 132, 252, ${0.48 * flash})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
          c.strokeStyle = `rgba(224, 242, 254, ${0.8 * flash})`;
          c.lineWidth = 2.5;
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6;
            c.beginPath();
            c.moveTo(this.cx + Math.cos(a) * 25, this.cy + Math.sin(a) * 25);
            c.lineTo(this.cx + Math.cos(a) * 240, this.cy + Math.sin(a) * 240);
            c.stroke();
          }
          c.restore();
        }
        if (this.elapsed >= 0.52) {
          const fade = Math.max(0, 1 - (this.elapsed - 0.52) / 0.68);
          drawSubspacePortalDisc(c, this.cx, this.cy, 92, 52, -rot, fade);
        }
      },
    };
  }

  function spawnCosmicPortalGrabDash(owner, target) {
    return {
      owner,
      target,
      elapsed: 0,
      maxLife: 1.8,
      trail: [],
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        if (this.elapsed >= this.maxLife || !this.owner.alive || !this.target.alive) {
          this.dead = true;
          return;
        }

        const dx = this.target.x - this.owner.x;
        const dy = this.target.y - this.owner.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speed = 940;
        this.owner.vx = (dx / dist) * speed;
        this.owner.vy = (dy / dist) * speed;
        this.owner.x += this.owner.vx * dt;
        this.owner.y += this.owner.vy * dt;

        this.trail.push({ x: this.owner.x, y: this.owner.y, life: 0.2 });
        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].life -= dt;
          if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        if (dist <= this.owner.radius + this.target.radius + 14) {
          this.dead = true;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.target.vx = 0;
          this.target.vy = 0;
          g.entities.push(spawnCosmicPortalMoonTransitCutscene(this.owner, this.target, g));
        }
      },
      render(c) {
        c.save();
        for (const pt of this.trail) {
          const a = Math.max(0, pt.life / 0.2);
          c.fillStyle = `rgba(192, 132, 252, ${0.45 * a})`;
          c.beginPath();
          c.arc(pt.x, pt.y, this.owner.radius * 0.9, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- Cosmic Skill 1 on Moon: Subspace Portal Below Garou -> Teleport + 6-Hit Rampage ----
  function spawnCosmicSubspacePortalRampage(owner, target) {
    const entryX = owner.x;
    const entryY = owner.y + owner.radius * 0.45;
    return {
      owner,
      target,
      entryX,
      entryY,
      exitX: target.x,
      exitY: target.y,
      elapsed: 0,
      portalDur: 0.24,
      teleported: false,
      hitsDone: 0,
      hitTimes: [0.26, 0.36, 0.46, 0.56, 0.66, 0.78],
      totalDur: 0.88,
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        if (this.elapsed >= this.totalDur || !this.owner.alive || !this.target.alive) {
          const exitAng = Math.atan2(this.owner.y - this.target.y, this.owner.x - this.target.x);
          restoreBallMotion(this.owner, exitAng + 0.35);
          this.dead = true;
          return;
        }

        // Phase 1: Open portal beneath Garou and sink in
        if (this.elapsed < this.portalDur) {
          this.owner.x = this.entryX;
          this.owner.y = this.entryY - this.owner.radius * 0.45 + (this.elapsed / this.portalDur) * 14;
          this.owner.vx = 0;
          this.owner.vy = 0;
          const side = this.entryX <= this.target.x ? -1 : 1;
          this.exitX = Math.min(WORLD_SIZE - 45, Math.max(45, this.target.x + side * (this.owner.radius + this.target.radius + 8)));
          this.exitY = this.target.y;
          return;
        }

        // Phase 2: Burst out of Exit Portal beside enemy
        if (!this.teleported) {
          this.teleported = true;
          this.owner.x = this.exitX;
          this.owner.y = this.exitY;
          g.entities.push(rt.spawnShockRing(this.exitX, this.exitY, "#c084fc", 78, 0.24));
          g.spawnSparks(this.exitX, this.exitY, "#38bdf8", "#c084fc");
        }

        // Phase 3: Stick to enemy and unleash 6-Hit Cosmic Rampage
        const ang = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x);
        const dist = this.owner.radius + this.target.radius + 6;
        this.owner.x = this.target.x - Math.cos(ang) * dist;
        this.owner.y = this.target.y - Math.sin(ang) * dist;
        this.owner.vx = 0;
        this.owner.vy = 0;

        while (this.hitsDone < this.hitTimes.length && this.elapsed >= this.hitTimes[this.hitsDone]) {
          this.hitsDone += 1;
          const isFinal = this.hitsDone === this.hitTimes.length;
          const dealt = g.applyDamage(this.target, 4);
          this.target.flashTimer = 0.1;
          this.target.squash = 0.82;
          if (this.hitsDone === 3 || isFinal) {
            g.chargeUlt(this.owner);
          }
          g.spawnSparks(this.target.x, this.target.y, isFinal ? "#c084fc" : "#38bdf8", "#ffffff");
          g.spawnDamageText(
            this.target.x + (Math.random() - 0.5) * 18,
            this.target.y - this.target.radius - 14,
            dealt,
            isFinal ? "#c084fc" : "#38bdf8",
            isFinal,
            isFinal ? "COSMIC RAMPAGE!" : ""
          );
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          if (isFinal) {
            g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#c084fc", 104, 0.28));
            this.target.vx += Math.cos(ang) * 255;
            this.target.vy += Math.sin(ang) * 255;
            restoreBallMotion(this.owner, ang + Math.PI * 0.85);
            g.shake = Math.max(g.shake || 0, 9);
          }
        }
      },
      render(c) {
        const rot = this.elapsed * 11;
        const entryAlpha = Math.max(0, 1 - this.elapsed / 0.45);
        drawSubspacePortalDisc(c, this.entryX, this.entryY, 44, 18, rot, entryAlpha);

        const exitAlpha = this.elapsed < 0.55 ? Math.min(1, this.elapsed / 0.16) : Math.max(0, 1 - (this.elapsed - 0.55) / 0.33);
        drawSubspacePortalDisc(c, this.exitX, this.exitY + this.owner.radius * 0.45, 46, 19, -rot, exitAlpha);

        if (this.teleported && this.target.alive) {
          const pulse = (Math.sin(this.elapsed * 60) + 1) * 0.5;
          const ang = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x);
          c.save();
          c.translate(this.owner.x, this.owner.y);
          c.rotate(ang);
          c.strokeStyle = `rgba(192, 132, 252, ${0.5 + pulse * 0.45})`;
          c.lineWidth = 4;
          for (let i = -1; i <= 1; i++) {
            c.beginPath();
            c.moveTo(10, i * 10);
            c.lineTo(48 + pulse * 16, i * 15);
            c.stroke();
          }
          c.restore();
        }
      },
    };
  }

  // ---- Cosmic Ultimate: Fly Outside/Above Arena -> Quasar Sphere -> Full-Arena Gamma Ray Burst ----
  function spawnCosmicGammaRayBurstUlt(owner, g) {
    const startX = owner.x;
    const startY = owner.y;
    const skyX = WORLD_SIZE * 0.5;
    const skyY = 12;
    const totalDur = 1.75;
    g._cosmicCutsceneTimer = totalDur;

    let extCanvas = null;
    let extCtx = null;
    if (typeof document !== "undefined" && document.body && document.createElement) {
      extCanvas = document.createElement("canvas");
      extCanvas.style.cssText =
        "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:95;";
      extCanvas.width = window.innerWidth || 1280;
      extCanvas.height = window.innerHeight || 720;
      document.body.appendChild(extCanvas);
      extCtx = extCanvas.getContext("2d");
    }

    const cleanupExt = () => {
      owner._hiddenOffScreen = false;
      owner._cosmicSphereMode = false;
      if (extCanvas && extCanvas.parentNode) {
        extCanvas.parentNode.removeChild(extCanvas);
      }
      extCanvas = null;
      extCtx = null;
    };

    const drawExternalGammaQuasar = (tNow) => {
      if (!extCtx || !extCanvas) return;
      const vw = window.innerWidth || extCanvas.width;
      const vh = window.innerHeight || extCanvas.height;
      if (extCanvas.width !== vw) extCanvas.width = vw;
      if (extCanvas.height !== vh) extCanvas.height = vh;
      const w = extCanvas.width;
      const h = extCanvas.height;
      extCtx.clearRect(0, 0, w, h);

      const arenaEl =
        document.querySelector(".arena-wrap canvas") || document.getElementById("gameCanvas");
      const rect = arenaEl
        ? arenaEl.getBoundingClientRect()
        : { left: w * 0.5 - 220, top: h * 0.32, width: 440, height: 440 };

      const targetSX = rect.left + rect.width * 0.5;
      const targetSY = Math.max(76, rect.top - 42);
      const originSX = rect.left + (startX / WORLD_SIZE) * rect.width;
      const originSY = rect.top + (startY / WORLD_SIZE) * rect.height;

      let curX = targetSX;
      let curY = targetSY;
      let alpha = 1;
      if (tNow < 0.55) {
        const p = tNow / 0.55;
        const ease = 1 - Math.pow(1 - p, 3);
        curX = originSX + (targetSX - originSX) * ease;
        curY = originSY + (targetSY - originSY) * ease;
        alpha = Math.min(1, p * 2.2);
      } else if (tNow >= 1.45) {
        const p = Math.min(1, (tNow - 1.45) / 0.3);
        const ease = p * p;
        curX = targetSX + (originSX - targetSX) * ease;
        curY = targetSY + (originSY - targetSY) * ease;
        alpha = Math.max(0, 1 - p);
      }

      if (alpha <= 0.01) return;

      const chargeP = Math.min(1, tNow / 0.55);
      const coreR = (owner.radius + 15) * (0.7 + 0.35 * chargeP);

      extCtx.save();
      extCtx.globalAlpha = alpha;

      // Phase 2: Relativistic Polar Jets & Colossal Downward Gamma Ray Burst into Arena
      if (tNow >= 0.55 && tNow <= 1.48) {
        const burstAlpha = Math.sin(((tNow - 0.55) / 0.93) * Math.PI);
        extCtx.save();
        extCtx.globalAlpha = alpha * Math.max(0.15, burstAlpha);

        // Upper polar jet escaping into deep sky
        const upJet = extCtx.createLinearGradient(curX, curY, curX, Math.max(0, curY - 190));
        upJet.addColorStop(0, "rgba(255, 255, 255, 0.92)");
        upJet.addColorStop(0.45, "rgba(192, 132, 252, 0.65)");
        upJet.addColorStop(1, "rgba(56, 189, 248, 0)");
        extCtx.fillStyle = upJet;
        extCtx.beginPath();
        extCtx.moveTo(curX - 18, curY);
        extCtx.lineTo(curX + 18, curY);
        extCtx.lineTo(curX + 68, Math.max(0, curY - 190));
        extCtx.lineTo(curX - 68, Math.max(0, curY - 190));
        extCtx.closePath();
        extCtx.fill();

        // Downward Gamma Ray Burst erupting from outside/above arena straight into the arena floor
        const downBeam = extCtx.createLinearGradient(curX, curY, curX, rect.top + rect.height);
        downBeam.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        downBeam.addColorStop(0.28, "rgba(240, 171, 252, 0.85)");
        downBeam.addColorStop(0.7, "rgba(56, 189, 248, 0.52)");
        downBeam.addColorStop(1, "rgba(56, 189, 248, 0.15)");
        extCtx.fillStyle = downBeam;
        extCtx.beginPath();
        extCtx.moveTo(curX - 28, curY);
        extCtx.lineTo(curX + 28, curY);
        extCtx.lineTo(rect.left + rect.width + 24, rect.top + rect.height * 0.55);
        extCtx.lineTo(rect.left - 24, rect.top + rect.height * 0.55);
        extCtx.closePath();
        extCtx.fill();

        // Sharp white plasma core rays from Quasar down into the Moon Arena
        extCtx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        extCtx.lineWidth = 3.2;
        for (let i = -2; i <= 2; i++) {
          extCtx.beginPath();
          extCtx.moveTo(curX, curY);
          extCtx.lineTo(
            targetSX + i * (rect.width * 0.22) + Math.sin(tNow * 35 + i) * 14,
            rect.top + rect.height * 0.45
          );
          extCtx.stroke();
        }
        extCtx.restore();
      }

      // Quasar Singularity Sphere hovering at Blue Circle position above arena
      extCtx.save();
      extCtx.translate(curX, curY);

      const halo = extCtx.createRadialGradient(0, 0, coreR * 0.2, 0, 0, coreR * 2.6);
      halo.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      halo.addColorStop(0.35, "rgba(240, 171, 252, 0.88)");
      halo.addColorStop(0.7, "rgba(56, 189, 248, 0.48)");
      halo.addColorStop(1, "rgba(56, 189, 248, 0)");
      extCtx.fillStyle = halo;
      extCtx.beginPath();
      extCtx.arc(0, 0, coreR * 2.6, 0, Math.PI * 2);
      extCtx.fill();

      // Tilted Gold & Cyan Accretion Disk Rings
      extCtx.save();
      extCtx.rotate(tNow * 7.5);
      extCtx.strokeStyle = "#fde047";
      extCtx.lineWidth = 3.6;
      extCtx.beginPath();
      extCtx.ellipse(0, 0, coreR * 2.0, coreR * 0.54, 0.35, 0, Math.PI * 2);
      extCtx.stroke();

      extCtx.strokeStyle = "#38bdf8";
      extCtx.lineWidth = 3.0;
      extCtx.beginPath();
      extCtx.ellipse(0, 0, coreR * 1.75, coreR * 0.48, -0.35, 0, Math.PI * 2);
      extCtx.stroke();
      extCtx.restore();

      // Black-Gold Singularity Sphere Core
      const sphereGrad = extCtx.createRadialGradient(-7, -7, 2, 0, 0, coreR);
      sphereGrad.addColorStop(0, "#ffffff");
      sphereGrad.addColorStop(0.32, "#e879f9");
      sphereGrad.addColorStop(0.72, "#1e1b4b");
      sphereGrad.addColorStop(1, "#020617");
      extCtx.fillStyle = sphereGrad;
      extCtx.strokeStyle = "#38bdf8";
      extCtx.lineWidth = 2.6;
      extCtx.beginPath();
      extCtx.arc(0, 0, coreR, 0, Math.PI * 2);
      extCtx.fill();
      extCtx.stroke();

      // Callout Banner above Quasar Sphere
      if (tNow >= 0.2 && tNow <= 1.52) {
        extCtx.font = `900 24px ${FONT}`;
        extCtx.textAlign = "center";
        extCtx.strokeStyle = "#090418";
        extCtx.lineWidth = 6;
        extCtx.strokeText("GAMMA RAY BURST !!", 0, -coreR * 1.65);
        extCtx.fillStyle = "#f0abfc";
        extCtx.fillText("GAMMA RAY BURST !!", 0, -coreR * 1.65);
      }

      extCtx.restore();
      extCtx.restore();
    };

    return {
      isCosmicCutsceneEntity: true,
      owner,
      startX,
      startY,
      skyX,
      skyY,
      elapsed: 0,
      totalDur,
      pulsesDone: 0,
      pulseTimes: [0.62, 0.92, 1.22],
      dead: false,
      update(dt, game) {
        this.elapsed += dt;
        game._cosmicCutsceneTimer = Math.max(0, this.totalDur - this.elapsed);

        if (!this.owner.alive || this.elapsed >= this.totalDur) {
          cleanupExt();
          this.owner.x = Math.min(WORLD_SIZE - 40, Math.max(40, this.startX));
          this.owner.y = Math.min(WORLD_SIZE - 40, Math.max(40, this.startY));
          game._cosmicCutsceneTimer = 0;
          restoreBallMotion(this.owner, Math.PI * 0.35 + (Math.random() - 0.5) * 0.45);
          this.dead = true;
          return;
        }

        // Phase 1 (0 -> 0.55s): Leave arena upward -> outside/above top border & morph into Quasar Sphere
        if (this.elapsed < 0.55) {
          this.owner._hiddenOffScreen = true;
          this.owner._trail = [];
          this.owner._cosmicSphereMode = true;
          this.owner.x = this.skyX;
          this.owner.y = this.skyY;
          this.owner.vx = 0;
          this.owner.vy = 0;
        }
        // Phase 2 (0.55 -> 1.45s): Quasar hovers outside/above arena & fires Full-Arena Gamma Ray Burst
        else if (this.elapsed < 1.45) {
          this.owner._hiddenOffScreen = true;
          this.owner._trail = [];
          this.owner._cosmicSphereMode = true;
          this.owner.x = this.skyX;
          this.owner.y = this.skyY;
          this.owner.vx = 0;
          this.owner.vy = 0;

          while (this.pulsesDone < this.pulseTimes.length && this.elapsed >= this.pulseTimes[this.pulsesDone]) {
            this.pulsesDone += 1;
            const isFinal = this.pulsesDone === this.pulseTimes.length;
            game.shake = Math.max(game.shake || 0, isFinal ? 18 : 13);
            game.entities.push(rt.spawnShockRing(this.skyX, 24, "#f0abfc", 280, 0.38));

            for (const enemy of game.balls) {
              if (enemy === this.owner || !enemy.alive) continue;
              // Direct HP reduction during cutscene (since applyDamage is guarded by _cosmicCutsceneTimer)
              const shield = enemy.getEffect && enemy.getEffect("shield");
              const red = shield ? (shield.data?.reduction ?? 0.35) : 0;
              const dealt = Math.max(1, Math.round(17 * (1 - red)));
              enemy.hp = Math.max(0, enemy.hp - dealt);
              enemy.flashTimer = 0.2;
              enemy.squash = 0.72;
              game.addEffect(enemy, "stun", 0.95);
              if (isFinal) {
                const kbAng = Math.atan2(enemy.y - this.skyY, enemy.x - this.skyX);
                enemy.vx += Math.cos(kbAng) * 240;
                enemy.vy += Math.sin(kbAng) * 240;
              }
              game.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#38bdf8", 145, 0.34));
              game.spawnSparks(enemy.x, enemy.y, "#f0abfc", "#38bdf8");
              game.spawnDamageText(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y - enemy.radius - 18,
                dealt,
                "#f0abfc",
                true,
                isFinal ? "GAMMA RAY BURST!" : "COSMIC RADIATION!"
              );
              if (game.sound && game.sound.playBallHit) game.sound.playBallHit();
            }
          }
        }
        // Phase 3 (1.45 -> 1.75s): Re-enter arena & restore full movement velocity
        else {
          if (this.owner._hiddenOffScreen) {
            this.owner._hiddenOffScreen = false;
            this.owner._cosmicSphereMode = false;
            game.entities.push(rt.spawnShockRing(this.startX, this.startY, "#38bdf8", 98, 0.3));
          }
          const p = Math.min(1, (this.elapsed - 1.45) / 0.3);
          const ease = 1 - Math.pow(1 - p, 2);
          this.owner.x = this.skyX + (this.startX - this.skyX) * ease;
          this.owner.y = 32 + (this.startY - 32) * ease;
          if (p >= 0.85) {
            restoreBallMotion(this.owner, Math.PI * 0.35 + (Math.random() - 0.5) * 0.45);
          } else {
            this.owner.vx = 0;
            this.owner.vy = 0;
          }
        }
      },
      render(c) {
        if (this.elapsed < 0.55) {
          // Ascending Portal Trail inside arena as Garou launches above the top border
          const p = this.elapsed / 0.55;
          c.save();
          const ascGrad = c.createLinearGradient(this.startX, this.startY, this.skyX, 0);
          ascGrad.addColorStop(0, "rgba(192, 132, 252, 0)");
          ascGrad.addColorStop(1, `rgba(240, 171, 252, ${0.75 * p})`);
          c.strokeStyle = ascGrad;
          c.lineWidth = 10;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(this.startX, this.startY);
          c.lineTo(this.skyX, 0);
          c.stroke();
          c.restore();
        }
      },
      renderOverlay(c) {
        drawExternalGammaQuasar(this.elapsed);

        // Phase 2: Colossal Full-Arena Gamma Ray Burst entering from outside/above the arena
        if (this.elapsed >= 0.55 && this.elapsed <= 1.48) {
          const burstAlpha = Math.sin(((this.elapsed - 0.55) / 0.93) * Math.PI);
          c.save();

          // Arena-wide blinding cosmic radiation wash
          const wash = c.createRadialGradient(
            this.skyX,
            0,
            24,
            WORLD_SIZE * 0.5,
            WORLD_SIZE * 0.55,
            WORLD_SIZE * 0.9
          );
          wash.addColorStop(0, `rgba(255, 255, 255, ${0.9 * burstAlpha})`);
          wash.addColorStop(0.35, `rgba(240, 171, 252, ${0.65 * burstAlpha})`);
          wash.addColorStop(0.75, `rgba(56, 189, 248, ${0.48 * burstAlpha})`);
          wash.addColorStop(1, `rgba(88, 28, 135, ${0.35 * burstAlpha})`);
          c.fillStyle = wash;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          // Giant flaring Quasar Beam pouring from top border (-20) across 100% of arena
          const beamGrad = c.createLinearGradient(0, -20, 0, WORLD_SIZE);
          beamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.96 * burstAlpha})`);
          beamGrad.addColorStop(0.5, `rgba(192, 132, 252, ${0.78 * burstAlpha})`);
          beamGrad.addColorStop(1, `rgba(56, 189, 248, ${0.64 * burstAlpha})`);
          c.fillStyle = beamGrad;
          c.beginPath();
          c.moveTo(this.skyX - 88, -20);
          c.lineTo(this.skyX + 88, -20);
          c.lineTo(WORLD_SIZE + 80, WORLD_SIZE);
          c.lineTo(-80, WORLD_SIZE);
          c.closePath();
          c.fill();

          // High-energy core rays sweeping the Moon floor
          c.strokeStyle = `rgba(255, 255, 255, ${0.88 * burstAlpha})`;
          c.lineWidth = 4;
          for (let i = -3; i <= 3; i++) {
            c.beginPath();
            c.moveTo(this.skyX, -12);
            c.lineTo(
              WORLD_SIZE * 0.5 + i * 95 + Math.sin(this.elapsed * 35 + i) * 18,
              WORLD_SIZE
            );
            c.stroke();
          }
          c.restore();
        }
      },
    };
  }

  BF.triggerCosmicGammaRayBurstUlt = (ball, g) => {
    if (!ball || !g || !ball.alive) return;
    ball.ultTimer = 0;
    ball.ultCharge = 0;
    g.entities.push(spawnCosmicGammaRayBurstUlt(ball, g));
  };

  // ---- Cosmic Awakening Trigger (called from applyDamage or onTick) ----
  BF.triggerGarouCosmicAwakening = (ball, g) => {
    if (!ball || !g || ball._cosmicAwakened || !ball.alive || ball.hp <= 0) return;
    ball._cosmicAwakened = true;
    g._cosmicCutsceneTimer = 2.4;
    if (ball.skills && ball.skills[0]) ball.skills[0]._cd = 0;
    g.entities.push(spawnCosmicMoonAwakeningCutscene(ball, g));
  };

  // ---- Monster Ult Opener ----
  BF.triggerGarouMonsterOpener = (ball, g) => {
    if (!ball || !g || ball._garouMonsterIntroDone) return;
    ball._garouMonsterIntroDone = true;
    if (ball.skills && ball.skills[0]) ball.skills[0]._cd = 0;
    g.addEffect(ball, "haste", 12, { mult: 1.16 });
    g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#ef4444", 92, 0.3));
    g.spawnSparks(ball.x, ball.y, "#ef4444", "#fb923c");
    g.spawnDamageText(ball.x, ball.y - ball.radius - 16, 0, "#ef4444", true, "MONSTER FORM!");
  };

  // ---- Skill 1: Whirlwind Iron / God Slayer Barrage / Cosmic Black Hole ----
  const SKILL_WHIRLWIND_FIST = {
    name: "Whirlwind Iron Cutting Fist",
    cooldown: 2.6,
    onTick(ball, g) {
      // Cosmic Fear Awakening when HP < 100 (once per match)
      if (ball.alive && ball.hp > 0 && ball.hp < 100 && !ball._cosmicAwakened) {
        BF.triggerGarouCosmicAwakening(ball, g);
        return false;
      }

      const enemy = pickEnemy(ball, g);
      if (!enemy) return false;

      // Cosmic Form Skill 1:
      // - 1st cast after Awakening (!ball._cosmicMoonWarped): Auto-Lock Dash -> Portal Transit to Moon Arena
      // - Subsequent casts on Moon: Subspace Portal Below Garou -> Teleport + 6-Hit Cosmic Rampage
      if (ball._isCosmicGarou) {
        if (!ball._cosmicMoonWarped) {
          g.entities.push(spawnCosmicPortalGrabDash(ball, enemy));
          g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#38bdf8", true, "HYPERSPACE LOCK!");
          return true;
        }
        g.entities.push(spawnCosmicSubspacePortalRampage(ball, enemy));
        g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#c084fc", true, "SUBSPACE PORTAL!");
        return true;
      }

      const isMonster = ball.ultTimer > 0;
      if (isMonster) {
        g.entities.push(spawnGodSlayerBarrage(ball, enemy));
        g.spawnDamageText(ball.x, ball.y - ball.radius - 16, 0, "#ef4444", true, "GOD SLAYER BARRAGE!");
        return true;
      }

      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 320) return false;

      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: isMonster ? "#ef4444" : "#38bdf8",
        renderCast(b, c, p) {
          c.save();
          c.translate(b.x, b.y);
          c.rotate(p * 10);
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 3;
          c.beginPath();
          c.arc(0, 0, b.radius + 14, 0, Math.PI * 0.85);
          c.stroke();
          c.strokeStyle = "#f43f5e";
          c.beginPath();
          c.arc(0, 0, b.radius + 14, Math.PI, Math.PI * 1.85);
          c.stroke();
          c.restore();
        },
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const m = rt.castMuzzle(b, aim, 14);
          const castState = { ultCharged: false };
          b.vx += Math.cos(aim) * 145;
          b.vy += Math.sin(aim) * 145;

          gg.entities.push(
            spawnSpiralMartialWave({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              angle: aim,
              speed: 620,
              damage: isMonster ? 6 : 5,
              phase: 0,
              isWater: true,
              castState,
              isMonster,
            })
          );
          gg.entities.push(
            spawnSpiralMartialWave({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              angle: aim,
              speed: 620,
              damage: isMonster ? 7 : 5,
              phase: Math.PI,
              isWater: false,
              castState,
              isMonster,
            })
          );
        },
      });
      return true;
    },
    onHit(ball, target, g) {
      if (ball._isCosmicGarou && target && target.alive) {
        const extra = g.applyDamage(target, 4);
        g.entities.push(rt.spawnShockRing(target.x, target.y, "#c084fc", 74, 0.24));
        g.spawnDamageText(target.x, target.y - target.radius - 16, extra, "#c084fc", true, "NUCLEAR FISSION!");
        return;
      }
      if (ball.ultTimer > 0 && target && target.alive) {
        const extra = g.applyDamage(target, 4);
        g.entities.push(rt.spawnShockRing(target.x, target.y, "#ef4444", 72, 0.24));
        g.spawnDamageText(target.x, target.y - target.radius - 16, extra, "#fb923c", true, "FA JIN!");
      }
    },
  };

  // ---- Skill 2: Water Stream Counter ----
  const SKILL_WATER_STREAM_COUNTER = {
    name: "Water Stream Counter",
    cooldown: 4.5,
    onTick(ball, g) {
      const target = pickEnemy(ball, g);
      if (!target) return false;

      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 280) return false;

      g.addEffect(ball, "shield", 1.15, { reduction: 0.3 });
      g.entities.push(spawnWaterStreamStance(ball));
      g.spawnDamageText(ball.x, ball.y - ball.radius - 12, 0, "#38bdf8", false, "WATER STREAM STANCE!");
      return true;
    },
  };

  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: Twin-Stream / Cosmic Orbital Aura ----
  BF.WEAPON_DRAWERS.martial_aura = (ball, c) => {
    if (ball._isCosmicGarou) {
      const t = performance.now() * 0.004;
      c.save();
      c.rotate(t);
      c.strokeStyle = "rgba(192, 132, 252, 0.85)";
      c.lineWidth = 2.6;
      c.beginPath();
      c.ellipse(0, 0, ball.radius + 14, ball.radius + 5, 0.4, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(56, 189, 248, 0.85)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, 0, ball.radius + 14, ball.radius + 5, -0.4, 0, Math.PI * 2);
      c.stroke();
      c.restore();
      return;
    }

    const isMonster = ball.ultTimer > 0;
    c.save();
    c.lineCap = "round";

    c.strokeStyle = isMonster ? "#ef4444" : "#38bdf8";
    c.lineWidth = 4.2;
    c.shadowColor = isMonster ? "#dc2626" : "#0284c7";
    c.shadowBlur = 12;
    c.beginPath();
    c.moveTo(-11, 12);
    c.bezierCurveTo(-16, -2, 6, -12, -3, -28);
    c.stroke();

    c.strokeStyle = isMonster ? "#fb923c" : "#f43f5e";
    c.lineWidth = 3.6;
    c.shadowColor = isMonster ? "#ea580c" : "#e11d48";
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(11, 12);
    c.bezierCurveTo(16, -2, -6, -12, 3, -28);
    c.stroke();
    c.shadowBlur = 0;

    c.fillStyle = isMonster ? "#18181b" : "#fde68a";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.roundRect(-6.5, -11, 13, 11, 3.5);
    c.fill();
    c.stroke();

    c.strokeStyle = isMonster ? "#ef4444" : "#f8fafc";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-6, -6); c.lineTo(6, -4);
    c.moveTo(-6, -2); c.lineTo(6, -8);
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Base (Red-Orange Hair), Monster Form, & Cosmic Fear ----
  BF.COSTUME_DRAWERS.garou = (ball, r, c) => {
    const isCosmic = Boolean(ball._isCosmicGarou);
    const isMonster = ball.ultTimer > 0 && !isCosmic;
    const t = performance.now() * 0.003;

    const hair = [
      [-0.86, -0.05], [-1.08, -0.29], [-0.86, -0.41], [-1.22, -0.71], [-0.88, -0.76],
      [-1.12, -1.31], [-0.54, -1.00], [-0.38, -1.10],
      [-0.16, -0.93], [0, -0.87], [0.16, -0.93],
      [0.38, -1.10], [0.54, -1.00], [1.12, -1.31], [0.88, -0.76], [1.22, -0.71],
      [0.86, -0.41], [1.08, -0.29], [0.86, -0.05],
      [0.67, -0.22], [0.41, -0.40], [0.16, -0.33], [0, -0.19],
      [-0.16, -0.33], [-0.41, -0.40], [-0.67, -0.22],
    ];

    if (isCosmic) {
      // During Gamma Ray Burst Ultimate: Garou transforms into a pure Quasar Singularity Sphere (no hair spikes)
      if (ball._cosmicSphereMode) {
        c.save();
        const sg = c.createRadialGradient(-r * 0.25, -r * 0.25, 2, 0, 0, r);
        sg.addColorStop(0, "#ffffff");
        sg.addColorStop(0.35, "#f0abfc");
        sg.addColorStop(0.7, "#38bdf8");
        sg.addColorStop(1, "#020617");
        c.fillStyle = sg;
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#fde047";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, r * 1.15, t * 2, t * 2 + Math.PI * 1.5);
        c.stroke();
        c.restore();
        return;
      }

      c.save();
      for (let i = 0; i < 8; i++) {
        const a = t * 0.9 + (i * Math.PI) / 4;
        c.strokeStyle = i % 2 === 0 ? "rgba(192, 132, 252, 0.72)" : "rgba(56, 189, 248, 0.65)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, r * 1.24, a, a + 0.58);
        c.stroke();
      }
      c.restore();

      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      const grad = c.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.55, "#0f172a");
      grad.addColorStop(1, "#020617");
      c.fillStyle = grad;
      c.fillRect(-r, -r, r * 2, r * 2);

      const neb = c.createRadialGradient(0, 0, 2, 0, 0, r * 0.85);
      neb.addColorStop(0, "rgba(192, 132, 252, 0.65)");
      neb.addColorStop(0.5, "rgba(56, 189, 248, 0.32)");
      neb.addColorStop(1, "rgba(15, 23, 42, 0)");
      c.fillStyle = neb;
      c.beginPath();
      c.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = "rgba(224, 242, 254, 0.88)";
      c.lineWidth = 2;
      c.beginPath();
      for (let a = 0; a < Math.PI * 3; a += 0.25) {
        const rr = a * 2.1;
        const px = Math.cos(a + t) * rr;
        const py = Math.sin(a + t) * rr;
        if (a === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();

      c.fillStyle = "#f8fafc";
      for (const [sx, sy] of [[-0.5, -0.45], [0.48, -0.38], [-0.36, 0.42], [0.42, 0.36], [0.08, -0.58], [-0.15, 0.55]]) {
        c.beginPath();
        c.arc(sx * r, sy * r, 1.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      c.save();
      c.lineJoin = "round";
      const cGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.52);
      cGrad.addColorStop(0, "#020617");
      cGrad.addColorStop(0.55, "#1e1b4b");
      cGrad.addColorStop(1, "#7c3aed");
      c.fillStyle = cGrad;
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 2.6;
      hairPoly(c, r, hair);
      c.fill();
      c.stroke();
      c.restore();
      return;
    }

    if (isMonster) {
      // Awakened Monster Form: Black-Crimson Calamity Aura + Cracked Obsidian Carapace
      c.save();
      for (let i = 0; i < 8; i++) {
        const a = t * 0.8 + (i * Math.PI) / 4;
        c.strokeStyle = i % 2 === 0 ? "rgba(239, 68, 68, 0.55)" : "rgba(9, 9, 11, 0.65)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, r * 1.24, a, a + 0.55);
        c.stroke();
      }
      c.restore();

      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      const shellGrad = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      shellGrad.addColorStop(0, "#27272a");
      shellGrad.addColorStop(0.55, "#09090b");
      shellGrad.addColorStop(1, "#030305");
      c.fillStyle = shellGrad;
      c.fillRect(-r, -r, r * 2, r * 2);

      // Glowing crimson-orange magma cracks across Monster Garou's face & chest
      c.strokeStyle = "#ef4444";
      c.shadowColor = "#fb923c";
      c.shadowBlur = 8;
      c.lineWidth = 2.4;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.72, -r * 0.12); c.lineTo(-r * 0.3, r * 0.12); c.lineTo(-r * 0.45, r * 0.48);
      c.moveTo(r * 0.72, -r * 0.12); c.lineTo(r * 0.3, r * 0.12); c.lineTo(r * 0.45, r * 0.48);
      c.moveTo(-r * 0.18, r * 0.28); c.lineTo(0, r * 0.55); c.lineTo(r * 0.18, r * 0.28);
      c.moveTo(0, r * 0.55); c.lineTo(0, r * 0.92);
      c.stroke();

      // Glowing yellow-red monster eyes
      c.fillStyle = "#facc15";
      c.beginPath();
      c.moveTo(-r * 0.45, -r * 0.08); c.lineTo(-r * 0.14, r * 0.02); c.lineTo(-r * 0.4, r * 0.08); c.closePath();
      c.moveTo(r * 0.45, -r * 0.08); c.lineTo(r * 0.14, r * 0.02); c.lineTo(r * 0.4, r * 0.08); c.closePath();
      c.fill();
      c.restore();
    } else {
      rt.drawSkinFace(ball, r, c);

      // Base Awakening Outfit: Tight black martial-arts shirt + white bandages + crimson sash
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      c.fillStyle = "#111318";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-r, r * 0.44);
      c.lineTo(-r * 0.24, r * 0.42);
      c.lineTo(0, r * 0.58);
      c.lineTo(r * 0.24, r * 0.42);
      c.lineTo(r, r * 0.44);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();

      c.strokeStyle = "#27272a";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(0, r * 0.58); c.lineTo(0, r * 0.96);
      c.moveTo(-r * 0.48, r * 0.56); c.quadraticCurveTo(-r * 0.22, r * 0.7, -r * 0.04, r * 0.66);
      c.moveTo(r * 0.48, r * 0.56); c.quadraticCurveTo(r * 0.22, r * 0.7, r * 0.04, r * 0.66);
      c.stroke();

      c.fillStyle = "#f1f5f9";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.44, r * 0.45);
      c.lineTo(r * 0.44, r * 0.45);
      c.lineTo(r * 0.34, r * 0.56);
      c.lineTo(-r * 0.34, r * 0.56);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#be123c";
      c.beginPath();
      c.moveTo(-r * 0.85, r * 0.82);
      c.quadraticCurveTo(0, r * 0.94, r * 0.85, r * 0.82);
      c.lineTo(r * 0.85, r * 1.02);
      c.quadraticCurveTo(0, r * 1.08, -r * 0.85, r * 1.02);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    c.save();
    c.lineJoin = "round";
    const hGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.52);
    if (isMonster) {
      hGrad.addColorStop(0, "#09090b");
      hGrad.addColorStop(0.55, "#450a0a");
      hGrad.addColorStop(1, "#ef4444");
    } else {
      hGrad.addColorStop(0, "#fb923c");
      hGrad.addColorStop(0.55, "#ea580c");
      hGrad.addColorStop(1, "#dc2626");
    }
    c.fillStyle = hGrad;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.strokeStyle = isMonster ? "#ef4444" : COLORS.ink;
    c.lineWidth = 3;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    c.strokeStyle = isMonster ? "rgba(251, 146, 60, 0.78)" : "rgba(254, 215, 170, 0.65)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.11, -0.36, -0.61, -0.89], [-0.34, -0.48, -0.94, -1.10], [-0.56, -0.38, -0.99, -0.64],
      [0.11, -0.36, 0.61, -0.89], [0.34, -0.48, 0.94, -1.10], [0.56, -0.38, 0.99, -0.64],
    ]) {
      c.moveTo(x0 * r, y0 * r);
      c.lineTo(x1 * r, y1 * r);
    }
    c.stroke();
    c.restore();
  };

  BF.CHARACTER_ROSTER.garou = {
    id: "garou",
    name: "HERO HUNTER",
    shortName: "HUNTER",
    title: "Fist of Flowing Water • Awakened Monster • Cosmic Fear",
    role: "MARTIAL ARTIST • MONSTER & COSMIC",
    color: "#ea580c",
    radius: 28,
    speed: 372,
    maxHp: 575,
    damage: [6, 9],
    mass: 1.02,
    costume: "garou",
    weapon: null,
    ult: "cosmic_fear",
    ultName: "MONSTERIZATION / GAMMA RAY BURST",
    ultDesc: "Ult: Monster Form (God Slayer Dash Barrage). Below 100 HP: Cosmic Moon Awakening (+50 HP)! 1st Skill locks & warps enemy to the Moon; Cosmic Ult flies up as a Quasar Sphere to unleash a Full-Arena Gamma Ray Burst!",
    skillName: "WHIRLWIND FIST / SUBSPACE PORTAL RAMPAGE & COUNTER",
    skillDesc: "Base: spiral waves & Water Stream Counter. Monster: God Slayer Barrage. Cosmic: 1st skill auto-locks & portals to the Moon; then opens Subspace Portals below Garou to teleport & Rampage!",
    skills: [SKILL_WHIRLWIND_FIST, SKILL_WATER_STREAM_COUNTER],
  };
})();
