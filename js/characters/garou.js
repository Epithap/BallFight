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
            this.owner._cosmicMoonWarped = false;
            this.owner.ultTimer = 0;
            this.owner.ultCharge = 0;
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
            game.addEffect(this.owner, "haste", 14, { mult: 1.22 });
            if (this.owner.skills && this.owner.skills[0]) this.owner.skills[0]._cd = 0;
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

  // ---- Elegant Moon Sanctuary Arena Overlay ----
  const MOON_STARS = [
    [0.08, 0.11, 1.6], [0.16, 0.06, 1.1], [0.24, 0.18, 1.8], [0.35, 0.08, 1.3],
    [0.44, 0.15, 1.5], [0.53, 0.07, 1.2], [0.62, 0.14, 1.7], [0.71, 0.09, 1.1],
    [0.88, 0.22, 1.5], [0.12, 0.29, 1.3], [0.29, 0.27, 1.1], [0.58, 0.25, 1.4],
    [0.92, 0.34, 1.6], [0.07, 0.42, 1.2], [0.48, 0.31, 1.5], [0.76, 0.28, 1.3],
  ];

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

  BF.drawMoonArenaOverlay = function (c, game) {
    const t = Math.min(1, (game._moonArenaTimer || 0) / 0.5);
    const now = performance.now() * 0.001;
    c.save();

    // 1. Deep Velvet Space Sky & Lunar Horizon Backdrop
    const bgGrad = c.createLinearGradient(0, 0, 0, WORLD_SIZE);
    bgGrad.addColorStop(0, `rgba(2, 4, 14, ${0.95 * t})`);
    bgGrad.addColorStop(0.42, `rgba(8, 12, 32, ${0.92 * t})`);
    bgGrad.addColorStop(0.75, `rgba(22, 27, 51, ${0.9 * t})`);
    bgGrad.addColorStop(1, `rgba(38, 45, 72, ${0.9 * t})`);
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // 2. Soft Cosmic Nebula Clouds (Violet & Cyan)
    const neb1 = c.createRadialGradient(WORLD_SIZE * 0.28, WORLD_SIZE * 0.2, 8, WORLD_SIZE * 0.28, WORLD_SIZE * 0.2, 155);
    neb1.addColorStop(0, `rgba(168, 85, 247, ${0.24 * t})`);
    neb1.addColorStop(0.55, `rgba(56, 189, 248, ${0.1 * t})`);
    neb1.addColorStop(1, "rgba(15, 23, 42, 0)");
    c.fillStyle = neb1;
    c.beginPath();
    c.arc(WORLD_SIZE * 0.28, WORLD_SIZE * 0.2, 155, 0, Math.PI * 2);
    c.fill();

    // 3. Twinkling Starfield
    for (let i = 0; i < MOON_STARS.length; i++) {
      const [sx, sy, sr] = MOON_STARS[i];
      const twinkle = 0.45 + 0.55 * Math.sin(now * 2.6 + i * 1.7);
      c.fillStyle = i % 3 === 0 ? `rgba(186, 230, 253, ${twinkle * t})` : `rgba(248, 250, 252, ${twinkle * t})`;
      c.beginPath();
      c.arc(sx * WORLD_SIZE, sy * WORLD_SIZE, sr, 0, Math.PI * 2);
      c.fill();
    }

    // 4. Distant Ringed Planet (Upper Left)
    const satX = 86;
    const satY = 74;
    c.save();
    c.translate(satX, satY);
    c.rotate(-0.32);
    c.strokeStyle = `rgba(216, 180, 254, ${0.42 * t})`;
    c.lineWidth = 3.5;
    c.beginPath();
    c.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2);
    c.stroke();
    const satGrad = c.createRadialGradient(-5, -5, 2, 0, 0, 15);
    satGrad.addColorStop(0, `rgba(243, 232, 255, ${0.9 * t})`);
    satGrad.addColorStop(0.6, `rgba(147, 51, 234, ${0.75 * t})`);
    satGrad.addColorStop(1, `rgba(30, 27, 75, ${0.85 * t})`);
    c.fillStyle = satGrad;
    c.beginPath();
    c.arc(0, 0, 15, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 5. Majestic Blue-Marble Earth in the Upper Right Sky
    const earthX = WORLD_SIZE - 88;
    const earthY = 82;
    const earthR = 38;
    const atmo = c.createRadialGradient(earthX, earthY, earthR * 0.7, earthX, earthY, earthR * 1.55);
    atmo.addColorStop(0, `rgba(56, 189, 248, ${0.55 * t})`);
    atmo.addColorStop(0.6, `rgba(37, 99, 235, ${0.22 * t})`);
    atmo.addColorStop(1, "rgba(37, 99, 235, 0)");
    c.fillStyle = atmo;
    c.beginPath();
    c.arc(earthX, earthY, earthR * 1.55, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.beginPath();
    c.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    c.clip();
    const ocean = c.createRadialGradient(earthX - 12, earthY - 12, 4, earthX, earthY, earthR);
    ocean.addColorStop(0, `rgba(125, 211, 252, ${0.95 * t})`);
    ocean.addColorStop(0.55, `rgba(2, 132, 199, ${0.92 * t})`);
    ocean.addColorStop(1, `rgba(15, 23, 42, ${0.95 * t})`);
    c.fillStyle = ocean;
    c.fillRect(earthX - earthR, earthY - earthR, earthR * 2, earthR * 2);

    // Subtle emerald continents & white cloud swirls
    c.fillStyle = `rgba(52, 211, 153, ${0.5 * t})`;
    c.beginPath();
    c.ellipse(earthX - 10, earthY - 6, 14, 9, 0.4, 0, Math.PI * 2);
    c.ellipse(earthX + 12, earthY + 10, 11, 7, -0.3, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = `rgba(255, 255, 255, ${0.55 * t})`;
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(earthX - 4, earthY - 2, earthR * 0.65, -0.4, 1.1);
    c.stroke();
    c.restore();

    // 6. Sculpted Silver-Ivory Lunar Surface & Horizon Arc
    const floorGrad = c.createRadialGradient(
      WORLD_SIZE * 0.5,
      WORLD_SIZE * 0.58,
      20,
      WORLD_SIZE * 0.5,
      WORLD_SIZE * 0.6,
      WORLD_SIZE * 0.65
    );
    floorGrad.addColorStop(0, `rgba(226, 232, 240, ${0.22 * t})`);
    floorGrad.addColorStop(0.55, `rgba(148, 163, 184, ${0.16 * t})`);
    floorGrad.addColorStop(1, `rgba(30, 41, 59, ${0.28 * t})`);
    c.fillStyle = floorGrad;
    c.beginPath();
    c.arc(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, WORLD_SIZE * 0.46, 0, Math.PI * 2);
    c.fill();

    // Elegant Sacred-Cosmos Lunar Astrolabe Rings
    c.save();
    c.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5);
    c.strokeStyle = `rgba(226, 232, 240, ${0.26 * t})`;
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, 0, WORLD_SIZE * 0.36, 0, Math.PI * 2);
    c.stroke();

    c.rotate(now * 0.18);
    c.strokeStyle = `rgba(192, 132, 252, ${0.22 * t})`;
    c.setLineDash([12, 10]);
    c.beginPath();
    c.arc(0, 0, WORLD_SIZE * 0.26, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    // Lunar Craters with Soft Silver Rim-Lighting
    const craters = [
      [0.22, 0.74, 46, 20, 0.12],
      [0.78, 0.72, 54, 23, -0.18],
      [0.2, 0.34, 38, 16, -0.1],
      [0.74, 0.36, 42, 18, 0.2],
    ];
    for (const [cx, cy, rx, ry, rot] of craters) {
      c.save();
      c.translate(cx * WORLD_SIZE, cy * WORLD_SIZE);
      c.rotate(rot);
      c.fillStyle = `rgba(15, 23, 42, ${0.38 * t})`;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = `rgba(226, 232, 240, ${0.28 * t})`;
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, Math.PI * 1.1, Math.PI * 1.95);
      c.stroke();
      c.restore();
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

  // ---- Cosmic Ultimate: Fly Up -> Transform into Quasar Sphere -> Full-Arena Gamma Ray Burst ----
  function spawnCosmicGammaRayBurstUlt(owner, g) {
    const startX = owner.x;
    const startY = owner.y;
    const skyX = WORLD_SIZE * 0.5;
    const skyY = 88;
    const totalDur = 1.75;
    g._cosmicCutsceneTimer = totalDur;

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
          this.owner._cosmicSphereMode = false;
          game._cosmicCutsceneTimer = 0;
          this.dead = true;
          return;
        }

        // Phase 1 (0 -> 0.55s): Fly to top-center & morph into Cosmic Quasar Sphere
        if (this.elapsed < 0.55) {
          const p = this.elapsed / 0.55;
          const ease = 1 - Math.pow(1 - p, 3);
          this.owner.x = this.startX + (this.skyX - this.startX) * ease;
          this.owner.y = this.startY + (this.skyY - this.startY) * ease;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.owner._cosmicSphereMode = true;
        }
        // Phase 2 (0.55 -> 1.45s): Full-Arena Gamma Ray Burst (100% arena hit)
        else if (this.elapsed < 1.45) {
          this.owner.x = this.skyX;
          this.owner.y = this.skyY;
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.owner._cosmicSphereMode = true;

          while (this.pulsesDone < this.pulseTimes.length && this.elapsed >= this.pulseTimes[this.pulsesDone]) {
            this.pulsesDone += 1;
            const isFinal = this.pulsesDone === this.pulseTimes.length;
            game.shake = Math.max(game.shake || 0, isFinal ? 16 : 12);
            game.entities.push(rt.spawnShockRing(this.skyX, this.skyY, "#f0abfc", 260, 0.38));

            for (const enemy of game.balls) {
              if (enemy === this.owner || !enemy.alive) continue;
              // Direct HP reduction during cutscene (since applyDamage is guarded by _cosmicCutsceneTimer)
              const shield = enemy.getEffect && enemy.getEffect("shield");
              const red = shield ? (shield.data?.reduction ?? 0.35) : 0;
              const dealt = Math.max(1, Math.round(14 * (1 - red)));
              enemy.hp = Math.max(0, enemy.hp - dealt);
              enemy.flashTimer = 0.18;
              enemy.squash = 0.74;
              game.addEffect(enemy, "stun", 0.75);
              game.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#38bdf8", 130, 0.32));
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
        // Phase 3 (1.45 -> 1.75s): Exit sphere mode & descend
        else {
          this.owner._cosmicSphereMode = false;
          const p = Math.min(1, (this.elapsed - 1.45) / 0.3);
          this.owner.x = this.skyX + (this.startX - this.skyX) * p;
          this.owner.y = this.skyY + (this.startY - this.skyY) * p;
          this.owner.vx = 0;
          this.owner.vy = 0;
        }
      },
      render(c) {
        const sx = this.owner.x;
        const sy = this.owner.y;

        // Quasar Singularity Sphere Aura around Garou
        if (this.elapsed < 1.48) {
          const chargeP = Math.min(1, this.elapsed / 0.55);
          const coreR = (this.owner.radius + 14) * (0.7 + 0.3 * chargeP);
          c.save();
          c.translate(sx, sy);

          const halo = c.createRadialGradient(0, 0, coreR * 0.2, 0, 0, coreR * 2.4);
          halo.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          halo.addColorStop(0.35, "rgba(240, 171, 252, 0.85)");
          halo.addColorStop(0.7, "rgba(56, 189, 248, 0.45)");
          halo.addColorStop(1, "rgba(56, 189, 248, 0)");
          c.fillStyle = halo;
          c.beginPath();
          c.arc(0, 0, coreR * 2.4, 0, Math.PI * 2);
          c.fill();

          // Accretion disk rings
          c.rotate(this.elapsed * 7);
          c.strokeStyle = "#fde047";
          c.lineWidth = 3.2;
          c.beginPath();
          c.ellipse(0, 0, coreR * 1.85, coreR * 0.52, 0.35, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2.8;
          c.beginPath();
          c.ellipse(0, 0, coreR * 1.65, coreR * 0.48, -0.35, 0, Math.PI * 2);
          c.stroke();

          // Black-gold singularity sphere body
          const sphereGrad = c.createRadialGradient(-6, -6, 2, 0, 0, coreR);
          sphereGrad.addColorStop(0, "#ffffff");
          sphereGrad.addColorStop(0.35, "#c084fc");
          sphereGrad.addColorStop(0.75, "#1e1b4b");
          sphereGrad.addColorStop(1, "#020617");
          c.fillStyle = sphereGrad;
          c.beginPath();
          c.arc(0, 0, coreR, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // Phase 2: Colossal Full-Arena Gamma Ray Burst Torrents
        if (this.elapsed >= 0.55 && this.elapsed <= 1.48) {
          const burstAlpha = Math.sin(((this.elapsed - 0.55) / 0.93) * Math.PI);
          c.save();

          // Arena-wide blinding cosmic radiation wash
          const wash = c.createRadialGradient(sx, sy, 20, WORLD_SIZE * 0.5, WORLD_SIZE * 0.55, WORLD_SIZE * 0.85);
          wash.addColorStop(0, `rgba(255, 255, 255, ${0.88 * burstAlpha})`);
          wash.addColorStop(0.35, `rgba(240, 171, 252, ${0.65 * burstAlpha})`);
          wash.addColorStop(0.75, `rgba(56, 189, 248, ${0.48 * burstAlpha})`);
          wash.addColorStop(1, `rgba(88, 28, 135, ${0.35 * burstAlpha})`);
          c.fillStyle = wash;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          // Giant vertical/fanning Quasar Beam engulfing the entire arena width
          const beamGrad = c.createLinearGradient(0, sy, 0, WORLD_SIZE);
          beamGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * burstAlpha})`);
          beamGrad.addColorStop(0.5, `rgba(192, 132, 252, ${0.75 * burstAlpha})`);
          beamGrad.addColorStop(1, `rgba(56, 189, 248, ${0.65 * burstAlpha})`);
          c.fillStyle = beamGrad;
          c.beginPath();
          c.moveTo(sx - 55, sy);
          c.lineTo(sx + 55, sy);
          c.lineTo(WORLD_SIZE + 60, WORLD_SIZE);
          c.lineTo(-60, WORLD_SIZE);
          c.closePath();
          c.fill();

          // High-energy core rays across arena
          c.strokeStyle = `rgba(255, 255, 255, ${0.85 * burstAlpha})`;
          c.lineWidth = 4;
          for (let i = -3; i <= 3; i++) {
            c.beginPath();
            c.moveTo(sx, sy);
            c.lineTo(WORLD_SIZE * 0.5 + i * 95 + Math.sin(this.elapsed * 35 + i) * 18, WORLD_SIZE);
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
