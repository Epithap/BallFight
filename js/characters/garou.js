// ============================================================
//  GAROU (HERO HUNTER / AWAKENED MONSTER / COSMIC FEAR)
//  One-Punch Man — Red-Orange Hair Base, Monster Ult & Cosmic Moon Form
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function pickEnemy(ball, g) {
    return g.balls.find((b) => b !== ball && b.alive) || null;
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

  // ---- Cosmic Moon Awakening Cutscene (HP < 50 once per match, freezes time) ----
  function spawnCosmicMoonAwakeningCutscene(ball, g) {
    const origX = ball.x;
    const origY = ball.y;
    const moonX = WORLD_SIZE * 0.5;
    const moonY = 92;
    const totalDur = 2.4;

    return {
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
          this.dead = true;
          return;
        }

        if (this.elapsed < 0.8) {
          const t = this.elapsed / 0.8;
          const ease = t * t * (3 - 2 * t);
          this.owner.x = this.origX + (this.moonX - this.origX) * ease;
          this.owner.y = this.origY + (this.moonY + 46 - this.origY) * ease;
          this.owner.vx = 0;
          this.owner.vy = 0;
        } else if (this.elapsed < 1.65) {
          this.owner.x = this.moonX;
          this.owner.y = this.moonY + 46;
          this.owner.vx = 0;
          this.owner.vy = 0;
          if (!this.blessed) {
            this.blessed = true;
            this.owner._isCosmicGarou = true;
            this.owner.ultTimer = Math.max(this.owner.ultTimer || 0, 14);
            game.entities.push(rt.spawnShockRing(this.owner.x, this.owner.y, "#c084fc", 135, 0.35));
            game.spawnSparks(this.owner.x, this.owner.y, "#c084fc", "#38bdf8");
            game.spawnDamageText(this.owner.x, this.owner.y - 38, 0, "#c084fc", true, "COSMIC FEAR AWAKENED!");
            game.shake = Math.max(game.shake || 0, 10);
          }
        } else {
          const t = Math.min(1, (this.elapsed - 1.65) / 0.75);
          const ease = 1 - Math.pow(1 - t, 3);
          this.owner.x = this.moonX + (this.origX - this.moonX) * ease;
          this.owner.y = (this.moonY + 46) + (this.origY - (this.moonY + 46)) * ease;
          this.owner.vx = 0;
          this.owner.vy = 0;

          if (t >= 0.94 && !this.healed) {
            this.healed = true;
            const oldHp = this.owner.hp;
            this.owner.hp = Math.min(this.owner.maxHp, this.owner.hp + 50);
            const gained = Math.round(this.owner.hp - oldHp);
            game.addEffect(this.owner, "haste", 10, { mult: 1.2 });
            game.entities.push(rt.spawnShockRing(this.owner.x, this.owner.y, "#38bdf8", 96, 0.3));
            game.spawnSparks(this.owner.x, this.owner.y, "#4ade80", "#38bdf8");
            game.spawnDamageText(this.owner.x, this.owner.y - this.owner.radius - 18, gained, "#4ade80", true, `+${gained} HP`);
            game._cosmicCutsceneTimer = 0;
          }
        }
      },
      render(c) {
        const fadeIn = Math.min(1, this.elapsed / 0.35);
        const fadeOut = Math.min(1, Math.max(0, (this.totalDur - this.elapsed) / 0.35));
        const alpha = Math.min(fadeIn, fadeOut);

        c.save();
        c.fillStyle = `rgba(4, 7, 22, ${0.72 * alpha})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        const moonR = 54;
        const grad = c.createRadialGradient(this.moonX, this.moonY, 10, this.moonX, this.moonY, moonR * 1.45);
        grad.addColorStop(0, `rgba(241, 245, 249, ${0.95 * alpha})`);
        grad.addColorStop(0.65, `rgba(148, 163, 184, ${0.65 * alpha})`);
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(this.moonX, this.moonY, moonR * 1.45, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = `rgba(226, 232, 240, ${0.92 * alpha})`;
        c.beginPath();
        c.arc(this.moonX, this.moonY, moonR * 0.72, 0, Math.PI * 2);
        c.fill();

        const pulse = Math.sin(this.elapsed * 10) * 6;
        c.strokeStyle = `rgba(192, 132, 252, ${0.85 * alpha})`;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.moonX, this.moonY, moonR * 0.42 + pulse * 0.3, 0, Math.PI * 2);
        c.stroke();

        if (this.elapsed >= 0.45 && this.elapsed <= 1.85) {
          const beamGrad = c.createLinearGradient(this.moonX, this.moonY, this.moonX, this.moonY + 75);
          beamGrad.addColorStop(0, `rgba(192, 132, 252, ${0.8 * alpha})`);
          beamGrad.addColorStop(1, `rgba(56, 189, 248, ${0.2 * alpha})`);
          c.fillStyle = beamGrad;
          c.beginPath();
          c.moveTo(this.moonX - 24, this.moonY + 12);
          c.lineTo(this.moonX + 24, this.moonY + 12);
          c.lineTo(this.moonX + 42, this.moonY + 92);
          c.lineTo(this.moonX - 42, this.moonY + 92);
          c.closePath();
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- Moon Arena Overlay + Timer Controller ----
  BF.drawMoonArenaOverlay = function (c, game) {
    const t = Math.min(1, (game._moonArenaTimer || 0) / 0.5);
    c.save();
    c.fillStyle = `rgba(8, 12, 30, ${0.78 * t})`;
    c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    c.strokeStyle = `rgba(148, 163, 184, ${0.24 * t})`;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(WORLD_SIZE * 0.25, WORLD_SIZE * 0.72, 48, 22, 0, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(WORLD_SIZE * 0.72, WORLD_SIZE * 0.32, 62, 28, -0.2, 0, Math.PI * 2);
    c.stroke();

    const earthX = WORLD_SIZE - 64;
    const earthY = 54;
    const g = c.createRadialGradient(earthX, earthY, 6, earthX, earthY, 34);
    g.addColorStop(0, `rgba(56, 189, 248, ${0.8 * t})`);
    g.addColorStop(0.6, `rgba(37, 99, 235, ${0.45 * t})`);
    g.addColorStop(1, "rgba(37, 99, 235, 0)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(earthX, earthY, 34, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  function spawnMoonArenaController(g) {
    const existing = g.entities.find((e) => e.type === "garou_moon_arena_controller" && !e.dead);
    if (existing) return existing;
    return {
      type: "garou_moon_arena_controller",
      dead: false,
      update(dt, game) {
        game._moonArenaTimer = Math.max(0, (game._moonArenaTimer || 0) - dt);
        if (game._moonArenaTimer <= 0) {
          game._moonArenaTimer = 0;
          this.dead = true;
        }
      },
      render() {},
    };
  }

  // ---- Cosmic Rampage: 5-Punch Barrage in Moon Arena ----
  function spawnCosmicRampage(owner, target) {
    return {
      owner,
      target,
      elapsed: 0,
      hitsDone: 0,
      hitTimes: [0.12, 0.24, 0.36, 0.48, 0.62],
      totalDur: 0.72,
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        if (this.elapsed >= this.totalDur || !this.owner.alive || !this.target.alive) {
          this.dead = true;
          return;
        }

        const ang = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x);
        const dist = this.owner.radius + this.target.radius + 8;
        this.owner.x = this.target.x - Math.cos(ang) * dist;
        this.owner.y = this.target.y - Math.sin(ang) * dist;
        this.owner.vx = 0;
        this.owner.vy = 0;

        while (this.hitsDone < this.hitTimes.length && this.elapsed >= this.hitTimes[this.hitsDone]) {
          this.hitsDone += 1;
          const isFinal = this.hitsDone === this.hitTimes.length;
          const dealt = g.applyDamage(this.target, 3);
          this.target.flashTimer = 0.1;
          this.target.squash = 0.84;
          g.spawnSparks(this.target.x, this.target.y, isFinal ? "#c084fc" : "#38bdf8", "#ffffff");
          g.spawnDamageText(
            this.target.x + (Math.random() - 0.5) * 16,
            this.target.y - this.target.radius - 14,
            dealt,
            isFinal ? "#c084fc" : "#38bdf8",
            isFinal,
            isFinal ? "COSMIC RAMPAGE!" : ""
          );
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          if (isFinal) {
            g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#c084fc", 96, 0.28));
            this.target.vx += Math.cos(ang) * 240;
            this.target.vy += Math.sin(ang) * 240;
            g.shake = Math.max(g.shake || 0, 9);
          }
        }
      },
      render(c) {
        if (!this.target.alive) return;
        c.save();
        c.strokeStyle = "rgba(192, 132, 252, 0.58)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.target.x, this.target.y, this.target.radius + 18 + Math.sin(this.elapsed * 40) * 5, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Cosmic Skill 1: Black Hole Circle -> Teleport to Moon Arena + Rampage ----
  function spawnCosmicBlackHole(owner, targetX, targetY) {
    return {
      owner,
      x: targetX,
      y: targetY,
      radius: 66,
      life: 1.6,
      maxLife: 1.6,
      triggered: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }

        const enemy = pickEnemy(this.owner, g);
        if (!enemy) return;

        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist <= 170) {
          const pull = 280 * dt;
          enemy.vx += (dx / dist) * pull;
          enemy.vy += (dy / dist) * pull;
        }

        if (!this.triggered && dist <= 54 + enemy.radius * 0.4) {
          this.triggered = true;
          this.dead = true;

          const cx = WORLD_SIZE * 0.5;
          const cy = WORLD_SIZE * 0.5;
          enemy.x = Math.min(WORLD_SIZE - enemy.radius - 20, Math.max(enemy.radius + 20, cx + 80));
          enemy.y = cy;
          enemy.vx = 0;
          enemy.vy = 0;
          this.owner.x = Math.max(this.owner.radius + 20, enemy.x - (this.owner.radius + enemy.radius + 14));
          this.owner.y = cy;
          this.owner.vx = 0;
          this.owner.vy = 0;

          g._moonArenaTimer = 4.8;
          g.entities.push(spawnMoonArenaController(g));
          g.entities.push(rt.spawnShockRing(cx, cy, "#c084fc", 150, 0.35));
          g.spawnSparks(enemy.x, enemy.y, "#c084fc", "#38bdf8");
          g.spawnDamageText(cx, cy - 42, 0, "#c084fc", true, "MOON ARENA: COSMIC RAMPAGE!");
          g.entities.push(spawnCosmicRampage(this.owner, enemy));
        }
      },
      render(c) {
        const alpha = Math.max(0, Math.min(1, this.life / 0.35));
        const t = performance.now() / 160;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;

        const grad = c.createRadialGradient(0, 0, 8, 0, 0, this.radius);
        grad.addColorStop(0, "#020617");
        grad.addColorStop(0.55, "rgba(88, 28, 135, 0.85)");
        grad.addColorStop(0.85, "rgba(56, 189, 248, 0.45)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#c084fc";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, this.radius * 0.72, t, t + Math.PI * 1.4);
        c.stroke();

        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, this.radius * 0.46, -t * 1.3, -t * 1.3 + Math.PI * 1.3);
        c.stroke();

        c.fillStyle = "#000000";
        c.beginPath();
        c.arc(0, 0, 16, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // ---- Moon Arena Skill 2: Gamma Ray Burst ----
  function spawnGammaRayBurstBeam(owner, angle) {
    return {
      owner,
      x: owner.x,
      y: owner.y,
      angle,
      life: 0.42,
      maxLife: 0.42,
      length: WORLD_SIZE * 1.3,
      hitSet: new Set(),
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        this.x = this.owner.x;
        this.y = this.owner.y;

        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        for (const enemy of g.balls) {
          if (enemy === this.owner || !enemy.alive || this.hitSet.has(enemy)) continue;
          const rx = enemy.x - this.x;
          const ry = enemy.y - this.y;
          const proj = rx * cos + ry * sin;
          if (proj < -10 || proj > this.length) continue;
          const perp = Math.abs(rx * -sin + ry * cos);
          if (perp <= enemy.radius + 32) {
            this.hitSet.add(enemy);
            const dealt = g.applyDamage(enemy, 18);
            enemy.flashTimer = 0.16;
            enemy.squash = 0.78;
            g.addEffect(enemy, "stun", 0.45);
            enemy.vx += cos * 280;
            enemy.vy += sin * 280;
            g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#f0abfc", 112, 0.32));
            g.spawnSparks(enemy.x, enemy.y, "#f0abfc", "#38bdf8");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#f0abfc", true, "GAMMA RAY BURST!");
            g.shake = Math.max(g.shake || 0, 12);
          }
        }
      },
      render(c) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const width = 44 * alpha + 12;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.globalAlpha = alpha;

        const grad = c.createLinearGradient(0, -width, 0, width);
        grad.addColorStop(0, "rgba(192, 132, 252, 0)");
        grad.addColorStop(0.25, "rgba(192, 132, 252, 0.85)");
        grad.addColorStop(0.5, "#ffffff");
        grad.addColorStop(0.75, "rgba(56, 189, 248, 0.85)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");

        c.fillStyle = grad;
        c.fillRect(0, -width, this.length, width * 2);

        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(0, 0, width * 0.65, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // ---- Monster Ult Opener ----
  BF.triggerGarouMonsterOpener = (ball, g) => {
    if (!ball || !g || ball._garouMonsterIntroDone) return;
    ball._garouMonsterIntroDone = true;
    g.addEffect(ball, "haste", 12, { mult: 1.16 });
    g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#ef4444", 92, 0.3));
    g.spawnSparks(ball.x, ball.y, "#ef4444", "#fb923c");
    g.spawnDamageText(ball.x, ball.y - ball.radius - 16, 0, "#ef4444", true, "MONSTER FORM!");
  };

  // ---- Skill 1: Whirlwind Iron / God Slayer Barrage / Cosmic Black Hole ----
  const SKILL_WHIRLWIND_FIST = {
    name: "Whirlwind Iron Cutting Fist",
    cooldown: 2.6,
    onTick(ball, g, dt) {
      if (ball._godSlayerCd > 0) {
        ball._godSlayerCd = Math.max(0, ball._godSlayerCd - dt);
      }

      // Cosmic Fear Awakening when HP < 50 (once per match)
      if (ball.alive && ball.hp > 0 && ball.hp < 50 && !ball._cosmicAwakened) {
        ball._cosmicAwakened = true;
        g._cosmicCutsceneTimer = 2.4;
        g.entities.push(spawnCosmicMoonAwakeningCutscene(ball, g));
        return false;
      }

      const enemy = pickEnemy(ball, g);
      if (!enemy) return false;

      // Cosmic Form Skill 1: Black Hole Circle -> Moon Arena Rampage
      if (ball._isCosmicGarou) {
        const angle = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
        const dist = Math.min(185, Math.max(60, Math.hypot(enemy.x - ball.x, enemy.y - ball.y)));
        const tx = Math.min(WORLD_SIZE - 70, Math.max(70, ball.x + Math.cos(angle) * dist));
        const ty = Math.min(WORLD_SIZE - 70, Math.max(70, ball.y + Math.sin(angle) * dist));
        g.entities.push(spawnCosmicBlackHole(ball, tx, ty));
        g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#c084fc", false, "BLACK HOLE!");
        return true;
      }

      const isMonster = ball.ultTimer > 0;
      if (isMonster && (ball._godSlayerCd || 0) <= 0) {
        ball._godSlayerCd = 3.2;
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

  // ---- Skill 2: Water Stream Counter / Gamma Ray Burst in Moon Arena ----
  const SKILL_WATER_STREAM_COUNTER = {
    name: "Water Stream Counter",
    cooldown: 4.5,
    onTick(ball, g) {
      const target = pickEnemy(ball, g);
      if (!target) return false;

      if (ball._isCosmicGarou && (g._moonArenaTimer || 0) > 0) {
        const angle = Math.atan2(target.y - ball.y, target.x - ball.x);
        g.entities.push(spawnGammaRayBurstBeam(ball, angle));
        g.spawnDamageText(ball.x, ball.y - ball.radius - 16, 0, "#f0abfc", true, "GAMMA RAY BURST!");
        return true;
      }

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
      [-0.95, -0.06], [-1.2, -0.34], [-0.95, -0.48], [-1.36, -0.82], [-0.98, -0.88],
      [-1.24, -1.52], [-0.6, -1.16], [-0.42, -1.28],
      [-0.18, -1.08], [0, -1.01], [0.18, -1.08],
      [0.42, -1.28], [0.6, -1.16], [1.24, -1.52], [0.98, -0.88], [1.36, -0.82],
      [0.95, -0.48], [1.2, -0.34], [0.95, -0.06],
      [0.74, -0.26], [0.46, -0.46], [0.18, -0.38], [0, -0.22],
      [-0.18, -0.38], [-0.46, -0.46], [-0.74, -0.26],
    ];

    if (isCosmic) {
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
    c.strokeStyle = isMonster ? "#ef4444" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    c.strokeStyle = isMonster ? "rgba(251, 146, 60, 0.78)" : "rgba(254, 215, 170, 0.65)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.12, -0.42, -0.68, -1.04], [-0.38, -0.56, -1.04, -1.28], [-0.62, -0.44, -1.1, -0.74],
      [0.12, -0.42, 0.68, -1.04], [0.38, -0.56, 1.04, -1.28], [0.62, -0.44, 1.1, -0.74],
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
    ultName: "MONSTERIZATION & COSMIC MOON",
    ultDesc: "Ult: Monster Form with God Slayer Dash Barrage! Below 50 HP: Time freezes for God's Cosmic Moon Awakening (+50 HP), Black Hole Moon Arena Rampage, & Gamma Ray Burst!",
    skillName: "WHIRLWIND FIST / BLACK HOLE & COUNTER / GAMMA RAY",
    skillDesc: "Base: spiral waves & Water Stream Counter. Monster: God Slayer Dash Barrage. Cosmic: Black Hole Moon Arena Rampage & Gamma Ray Burst!",
    skills: [SKILL_WHIRLWIND_FIST, SKILL_WATER_STREAM_COUNTER],
  };
})();
