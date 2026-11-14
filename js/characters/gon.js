// ============================================================
//  GON FREECSS (HUNTER x HUNTER)
//  Base: Jajanken (Rock / Scissors / Paper)
//  Ult: Adult Gon (Black Shadow Form) — Dash -> Lift -> Ground Slam
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function pickEnemy(ball, g) {
    return g.balls.find((b) => b !== ball && b.alive) || null;
  }

  // ---- Jajanken: Rock (Close-range Nen Fist Dash) ----
  function spawnJajankenRockDash(owner, target) {
    return {
      owner,
      target,
      elapsed: 0,
      maxLife: 0.42,
      hit: false,
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
        const ang = Math.atan2(dy, dx);
        this.owner.vx = Math.cos(ang) * 760;
        this.owner.vy = Math.sin(ang) * 760;
        this.owner.x += this.owner.vx * dt;
        this.owner.y += this.owner.vy * dt;

        this.trail.push({ x: this.owner.x, y: this.owner.y, life: 0.18 });
        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].life -= dt;
          if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        if (!this.hit && dist <= this.owner.radius + this.target.radius + 14) {
          this.hit = true;
          this.dead = true;
          const dealt = g.applyDamage(this.target, 11);
          this.target.flashTimer = 0.16;
          this.target.squash = 0.78;
          this.target.vx = Math.cos(ang) * 320;
          this.target.vy = Math.sin(ang) * 320;
          g.chargeUlt(this.owner);
          g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#f97316", 112, 0.32));
          g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#fde047", 78, 0.24));
          g.spawnSparks(this.target.x, this.target.y, "#fde047", "#f97316");
          g.spawnDamageText(this.target.x, this.target.y - this.target.radius - 16, dealt, "#f97316", true, "JAJANKEN: ROCK!");
          g.shake = Math.max(g.shake || 0, 9);
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
        }
      },
      render(c) {
        if (!this.owner.alive) return;
        c.save();
        for (const pt of this.trail) {
          const a = Math.max(0, pt.life / 0.18);
          c.fillStyle = `rgba(249, 115, 22, ${0.42 * a})`;
          c.beginPath();
          c.arc(pt.x, pt.y, this.owner.radius * 0.92, 0, Math.PI * 2);
          c.fill();
        }
        const ang = Math.atan2(this.owner.vy, this.owner.vx);
        c.translate(this.owner.x + Math.cos(ang) * (this.owner.radius + 6), this.owner.y + Math.sin(ang) * (this.owner.radius + 6));
        c.rotate(ang);
        const g = c.createRadialGradient(0, 0, 3, 0, 0, 28);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.4, "#fde047");
        g.addColorStop(0.75, "rgba(249, 115, 22, 0.85)");
        g.addColorStop(1, "rgba(249, 115, 22, 0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, 28, 0, Math.PI * 2);
        c.fill();

        // Blazing Nen flame streaks
        c.strokeStyle = "#fef08a";
        c.lineWidth = 2.4;
        for (let i = -1; i <= 1; i++) {
          c.beginPath();
          c.moveTo(4, i * 8);
          c.lineTo(-28, i * 13);
          c.stroke();
        }
        c.restore();

        // Swirling black-crimson Nen aura ribbons around the Rock fist
        drawBlackCrimsonRibbons(
          c,
          this.owner.x + Math.cos(ang) * (this.owner.radius + 6),
          this.owner.y + Math.sin(ang) * (this.owner.radius + 6),
          27,
          performance.now() * 0.006,
          3,
          3.2
        );
      },
    };
  }

  function drawBlackCrimsonRibbons(c, x, y, radius, time, count, lineW) {
    c.save();
    c.translate(x, y);
    c.lineCap = "round";
    for (let i = 0; i < count; i++) {
      const baseAng = time * (i % 2 === 0 ? 1 : -1) + (i * Math.PI * 2) / count;
      c.save();
      c.rotate(baseAng);
      c.strokeStyle = "#450a0a";
      c.lineWidth = lineW + 2.2;
      c.beginPath();
      c.arc(0, 0, radius, -0.9, 1.35);
      c.stroke();

      c.strokeStyle = "#09090b";
      c.lineWidth = lineW;
      c.beginPath();
      c.arc(0, 0, radius * 0.94, -0.75, 1.25);
      c.stroke();
      c.restore();
    }
    c.restore();
  }

  // ---- Jajanken: Scissors (Dash-Through Golden Nen Sword Slash) ----
  function spawnJajankenScissorsDash(owner, target) {
    const startAng = Math.atan2(target.y - owner.y, target.x - owner.x) || 0;
    return {
      owner,
      target,
      angle: startAng,
      duration: 0.34,
      elapsed: 0,
      speed: 740,
      hitSet: new Set(),
      slashBursts: [],
      trail: [],
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        if (!this.owner.alive) {
          this.dead = true;
          return;
        }

        // Dash straight through along the locked sword angle
        this.owner.vx = Math.cos(this.angle) * this.speed;
        this.owner.vy = Math.sin(this.angle) * this.speed;
        this.owner.x += this.owner.vx * dt;
        this.owner.y += this.owner.vy * dt;

        // Keep inside arena bounds
        const pad = this.owner.radius + 4;
        if (this.owner.x < pad) { this.owner.x = pad; this.angle = Math.PI - this.angle; }
        if (this.owner.x > WORLD_SIZE - pad) { this.owner.x = WORLD_SIZE - pad; this.angle = Math.PI - this.angle; }
        if (this.owner.y < pad) { this.owner.y = pad; this.angle = -this.angle; }
        if (this.owner.y > WORLD_SIZE - pad) { this.owner.y = WORLD_SIZE - pad; this.angle = -this.angle; }

        this.trail.push({ x: this.owner.x, y: this.owner.y, ang: this.angle, life: 0.22 });
        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].life -= dt;
          if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }

        for (let i = this.slashBursts.length - 1; i >= 0; i--) {
          this.slashBursts[i].life -= dt;
          if (this.slashBursts[i].life <= 0) this.slashBursts.splice(i, 1);
        }

        // Slice any enemy intersected along the dash path without stopping
        for (const enemy of g.balls) {
          if (enemy === this.owner || !enemy.alive || this.hitSet.has(enemy)) continue;
          const tipX = this.owner.x + Math.cos(this.angle) * (this.owner.radius + 32);
          const tipY = this.owner.y + Math.sin(this.angle) * (this.owner.radius + 32);
          const distBody = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
          const distTip = Math.hypot(enemy.x - tipX, enemy.y - tipY);
          if (distBody <= this.owner.radius + enemy.radius + 20 || distTip <= enemy.radius + 26) {
            this.hitSet.add(enemy);
            const dealt = g.applyDamage(enemy, 9);
            enemy.flashTimer = 0.16;
            enemy.squash = 0.78;
            g.addEffect(enemy, "slow", 0.6, { factor: 0.78 });
            g.chargeUlt(this.owner);
            this.slashBursts.push({ x: enemy.x, y: enemy.y, ang: this.angle, life: 0.28, maxLife: 0.28 });
            g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#facc15", 98, 0.26));
            g.spawnSparks(enemy.x, enemy.y, "#fde047", "#ffffff");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#facc15", true, "JAJANKEN: SCISSORS!");
            g.shake = Math.max(g.shake || 0, 8);
            if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          }
        }

        if (this.elapsed >= this.duration && this.slashBursts.length === 0) {
          const spd = this.owner.baseSpeed || 356;
          this.owner.vx = Math.cos(this.angle) * spd;
          this.owner.vy = Math.sin(this.angle) * spd;
          this.dead = true;
        }
      },
      render(c) {
        c.save();
        for (const pt of this.trail) {
          const a = Math.max(0, pt.life / 0.22);
          c.fillStyle = `rgba(250, 204, 21, ${0.38 * a})`;
          c.beginPath();
          c.arc(pt.x, pt.y, this.owner.radius * 0.9, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
      renderOverlay(c) {
        if (!this.owner.alive) return;
        const p = Math.min(1, this.elapsed / this.duration);

        // Draw Gon's thick, blazing golden Nen energy sword while dashing
        if (this.elapsed < this.duration) {
          c.save();
          c.translate(this.owner.x, this.owner.y);
          c.rotate(this.angle);

          // Thick wide sword aura sweep
          const bladeLen = this.owner.radius + 76;
          c.shadowColor = "#facc15";
          c.shadowBlur = 20;

          c.fillStyle = "rgba(249, 115, 22, 0.55)";
          c.beginPath();
          c.moveTo(this.owner.radius * 0.4, -13);
          c.lineTo(bladeLen * 0.72, -11);
          c.lineTo(bladeLen + 14, 0);
          c.lineTo(bladeLen * 0.72, 11);
          c.lineTo(this.owner.radius * 0.4, 13);
          c.closePath();
          c.fill();

          const sGrad = c.createLinearGradient(this.owner.radius * 0.4, 0, bladeLen + 10, 0);
          sGrad.addColorStop(0, "#fbbf24");
          sGrad.addColorStop(0.55, "#fde047");
          sGrad.addColorStop(1, "#ffffff");
          c.fillStyle = sGrad;
          c.beginPath();
          c.moveTo(this.owner.radius * 0.45, -8);
          c.lineTo(bladeLen * 0.75, -7);
          c.lineTo(bladeLen + 8, 0);
          c.lineTo(bladeLen * 0.75, 7);
          c.lineTo(this.owner.radius * 0.45, 8);
          c.closePath();
          c.fill();

          // White-hot sword core + hilt flash
          c.strokeStyle = "#ffffff";
          c.lineWidth = 3.6;
          c.beginPath();
          c.moveTo(this.owner.radius * 0.5, 0);
          c.lineTo(bladeLen + 4, 0);
          c.stroke();

          // Thick crescent slash wake around Gon
          c.strokeStyle = `rgba(254, 240, 138, ${0.85 * (1 - p * 0.4)})`;
          c.lineWidth = 7;
          c.beginPath();
          c.arc(6, 0, this.owner.radius + 28, -0.95, 0.95);
          c.stroke();
          c.restore();
        }

        // Thick X-cross sword slash burst on enemies sliced through
        for (const b of this.slashBursts) {
          const k = Math.max(0, b.life / b.maxLife);
          c.save();
          c.translate(b.x, b.y);
          c.rotate(b.ang);
          c.globalAlpha = Math.min(1, k * 1.4);
          c.shadowColor = "#facc15";
          c.shadowBlur = 18;
          for (const slAng of [-0.55, 0.55]) {
            c.save();
            c.rotate(slAng);
            c.fillStyle = "#f97316";
            c.beginPath();
            c.ellipse(0, 0, 56 * (1.2 - k * 0.2), 7 * k, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#ffffff";
            c.beginPath();
            c.ellipse(0, 0, 48 * (1.2 - k * 0.2), 3.4 * k, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
          }
          c.restore();
        }
      },
    };
  }

  // ---- Jajanken: Paper (Emitter Nen Energy Orb) ----
  function spawnJajankenPaperOrb(owner, x, y, angle) {
    const speed = 560;
    return {
      owner,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 19,
      life: 1.15,
      t: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.t += dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30) {
          this.dead = true;
          return;
        }
        const t = pickEnemy(this.owner, g);
        if (t && Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(t, 8);
          t.flashTimer = 0.14;
          t.squash = 0.85;
          t.vx += Math.cos(angle) * 185;
          t.vy += Math.sin(angle) * 185;
          g.chargeUlt(this.owner);
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#fb923c", 90, 0.28));
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#fde047", 60, 0.2));
          g.spawnSparks(this.x, this.y, "#fbbf24", "#ffffff");
          g.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#fbbf24", true, "JAJANKEN: PAPER!");
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        const grad = c.createRadialGradient(0, 0, 2, 0, 0, this.radius * 1.6);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.4, "#fde047");
        grad.addColorStop(0.75, "rgba(249, 115, 22, 0.85)");
        grad.addColorStop(1, "rgba(249, 115, 22, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius * 1.6, 0, Math.PI * 2);
        c.fill();

        // Swirling emitter rings
        c.rotate(this.t * 12);
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2.2;
        c.beginPath();
        c.ellipse(0, 0, this.radius * 1.25, this.radius * 0.55, 0.4, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = "#fde047";
        c.beginPath();
        c.ellipse(0, 0, this.radius * 1.25, this.radius * 0.55, -0.4, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Ground Crater Visual after Adult Gon Slam ----
  function spawnGroundCrater(x, y) {
    return {
      x,
      y,
      life: 1.8,
      maxLife: 1.8,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, Math.min(1, this.life / 0.5));
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = a * 0.72;
        c.strokeStyle = "#09090b";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(0, 0, 48, 26, 0, 0, Math.PI * 2);
        c.stroke();

        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          c.beginPath();
          c.moveTo(Math.cos(ang) * 18, Math.sin(ang) * 10);
          c.lineTo(Math.cos(ang) * 58, Math.sin(ang) * 34);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Adult Gon Ultimate Skill (ONLY 1 VARIANT): Dash -> Grab & Lift -> Ground Slam -> Adult Rock Cutscene ----
  function spawnAdultGonDashSlam(owner, target) {
    return {
      isCosmicCutsceneEntity: true,
      owner,
      target,
      phase: "dash", // "dash" -> "lift" -> "slam" -> "rock_charge" -> "rock_impact"
      elapsed: 0,
      phaseElapsed: 0,
      grabX: 0,
      grabY: 0,
      liftHeight: 118,
      slammed: false,
      rockHit: false,
      rockAng: 0,
      trail: [],
      dead: false,
      update(dt, g) {
        this.elapsed += dt;
        this.phaseElapsed += dt;

        if (!this.owner.alive || !this.target.alive) {
          g._cosmicCutsceneTimer = 0;
          if (this.owner.alive && Math.hypot(this.owner.vx, this.owner.vy) < 40) {
            const spd = this.owner.baseSpeed || 356;
            this.owner.vx = Math.cos(0.7) * spd;
            this.owner.vy = Math.sin(0.7) * spd;
          }
          this.dead = true;
          return;
        }

        if (this.phase === "dash") {
          const dx = this.target.x - this.owner.x;
          const dy = this.target.y - this.owner.y;
          const dist = Math.hypot(dx, dy) || 1;
          const speed = 880;
          this.owner.vx = (dx / dist) * speed;
          this.owner.vy = (dy / dist) * speed;
          this.owner.x += this.owner.vx * dt;
          this.owner.y += this.owner.vy * dt;

          this.trail.push({ x: this.owner.x, y: this.owner.y, life: 0.22 });
          for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= dt;
            if (this.trail[i].life <= 0) this.trail.splice(i, 1);
          }

          if (dist <= this.owner.radius + this.target.radius + 16) {
            this.phase = "lift";
            this.phaseElapsed = 0;
            this.grabX = Math.min(WORLD_SIZE - 55, Math.max(55, this.target.x));
            this.grabY = Math.min(WORLD_SIZE - 55, Math.max(95, this.target.y));
            this.owner.vx = 0;
            this.owner.vy = 0;
            this.target.vx = 0;
            this.target.vy = 0;
            g.addEffect(this.target, "stun", 0.72);
            g.spawnSparks(this.grabX, this.grabY, "#ffffff", "#09090b");
            g.spawnDamageText(this.grabX, this.grabY - 36, 0, "#ffffff", true, "GOTCHA!");
          } else if (this.phaseElapsed >= 2.2) {
            const spd = this.owner.baseSpeed || 356;
            const ang = Math.atan2(dy, dx) || 0;
            this.owner.vx = Math.cos(ang) * spd;
            this.owner.vy = Math.sin(ang) * spd;
            this.dead = true;
          }
        } else if (this.phase === "lift") {
          const liftDur = 0.42;
          const t = Math.min(1, this.phaseElapsed / liftDur);
          const ease = 1 - Math.pow(1 - t, 2);
          const curLift = this.liftHeight * ease;

          this.target.x = this.grabX;
          this.target.y = Math.max(36, this.grabY - curLift);
          this.target.vx = 0;
          this.target.vy = 0;

          // Gon rises right alongside/under the lifted enemy
          this.owner.x = this.grabX - 18;
          this.owner.y = Math.max(46, this.grabY - curLift * 0.85 + 16);
          this.owner.vx = 0;
          this.owner.vy = 0;

          if (this.phaseElapsed >= liftDur) {
            this.phase = "slam";
            this.phaseElapsed = 0;
          }
        } else if (this.phase === "slam") {
          const slamDur = 0.16;
          const t = Math.min(1, this.phaseElapsed / slamDur);
          const ease = t * t * t;
          const curLift = this.liftHeight * (1 - ease);

          this.target.x = this.grabX;
          this.target.y = Math.max(36, this.grabY - curLift);
          this.target.vx = 0;
          this.target.vy = 0;

          this.owner.x = this.grabX - 18 * (1 - ease);
          this.owner.y = Math.max(46, this.grabY - curLift * 0.85 + 16 * (1 - ease));
          this.owner.vx = 0;
          this.owner.vy = 0;

          if (t >= 1 && !this.slammed) {
            this.slammed = true;
            this.phase = "rock_charge";
            this.phaseElapsed = 0;
            g._cosmicCutsceneTimer = 1.15;

            const pad = this.owner.radius + 10;
            this.owner.x = Math.min(WORLD_SIZE - pad, Math.max(pad, this.grabX - 36));
            this.owner.y = Math.min(WORLD_SIZE - pad, Math.max(pad, this.grabY));
            this.owner.vx = 0;
            this.owner.vy = 0;
            this.target.x = Math.min(WORLD_SIZE - this.target.radius - 10, Math.max(this.target.radius + 10, this.grabX + 26));
            this.target.y = Math.min(WORLD_SIZE - this.target.radius - 10, Math.max(this.target.radius + 10, this.grabY));
            this.target.vx = 0;
            this.target.vy = 0;
            this.rockAng = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x) || 0;

            // Keep enemy at >= 1 HP during slam so Adult Rock finisher ALWAYS triggers
            const shield = this.target.getEffect && this.target.getEffect("shield");
            const red = shield ? (shield.data?.reduction ?? 0.35) : 0;
            const rawSlam = Math.max(1, Math.round(12 * (1 - red)));
            const dealt = this.target.hp > 1 ? Math.min(rawSlam, this.target.hp - 1) : 0;
            if (dealt > 0) this.target.hp -= dealt;
            this.target.flashTimer = 0.2;
            this.target.squash = 0.65;
            g.addEffect(this.target, "stun", 1.2);

            g.entities.push(spawnGroundCrater(this.grabX, this.grabY + 8));
            g.entities.push(rt.spawnShockRing(this.grabX, this.grabY, "#09090b", 135, 0.32));
            g.entities.push(rt.spawnShockRing(this.grabX, this.grabY, "#ffffff", 100, 0.24));
            g.spawnSparks(this.grabX, this.grabY, "#ffffff", "#dc2626");
            g.spawnDamageText(this.grabX, this.grabY - 34, dealt, "#ef4444", true, "ADULT SLAM!");
            g.shake = Math.max(g.shake || 0, 11);
            if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          }
        } else if (this.phase === "rock_charge") {
          const chargeDur = 0.72;
          g._cosmicCutsceneTimer = Math.max(0.4, 1.15 - this.phaseElapsed);
          this.owner.vx = 0;
          this.owner.vy = 0;
          this.target.vx = 0;
          this.target.vy = 0;

          if (this.phaseElapsed >= chargeDur) {
            this.phase = "rock_impact";
            this.phaseElapsed = 0;
          }
        } else if (this.phase === "rock_impact") {
          const impactDur = 0.38;
          g._cosmicCutsceneTimer = Math.max(0, impactDur - this.phaseElapsed);

          if (!this.rockHit) {
            this.rockHit = true;
            const ang = this.rockAng;
            const shield = this.target.getEffect && this.target.getEffect("shield");
            const red = shield ? (shield.data?.reduction ?? 0.35) : 0;
            const dealt = Math.max(1, Math.round(16 * (1 - red)));
            this.target.hp = Math.max(0, this.target.hp - dealt);
            this.target.flashTimer = 0.26;
            this.target.squash = 0.55;
            // Launch enemy flying far across the arena!
            this.target.vx = Math.cos(ang) * 820;
            this.target.vy = Math.sin(ang) * 820;
            g.addEffect(this.target, "stun", 0.55);

            g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#09090b", 185, 0.42));
            g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#ffffff", 145, 0.32));
            g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#f97316", 110, 0.26));
            g.spawnSparks(this.target.x, this.target.y, "#fde047", "#dc2626");
            g.spawnDamageText(this.target.x, this.target.y - this.target.radius - 24, dealt, "#f97316", true, "JAJANKEN: ROCK!!");
            g.shake = Math.max(g.shake || 0, 20);
            if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          }

          if (this.phaseElapsed >= impactDur) {
            g._cosmicCutsceneTimer = 0;
            const spd = this.owner.baseSpeed || 356;
            this.owner.vx = -Math.cos(this.rockAng) * spd;
            this.owner.vy = -Math.sin(this.rockAng) * spd;
            this.dead = true;
          }
        }
      },
      render(c) {
        c.save();
        for (const pt of this.trail) {
          const a = Math.max(0, pt.life / 0.22);
          c.fillStyle = `rgba(9, 9, 11, ${0.55 * a})`;
          c.strokeStyle = `rgba(255, 255, 255, ${0.45 * a})`;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(pt.x, pt.y, this.owner.radius * 0.9, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }

        if (this.phase === "lift" || this.phase === "slam") {
          // Ground target shadow ring beneath lifted enemy
          c.strokeStyle = "rgba(9, 9, 11, 0.65)";
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(this.grabX, this.grabY + 12, 34, 14, 0, 0, Math.PI * 2);
          c.stroke();

          // Dramatic black-and-white vertical motion lines during lift/slam
          c.strokeStyle = this.phase === "slam" ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
          c.lineWidth = this.phase === "slam" ? 4 : 2.2;
          for (let i = -2; i <= 2; i++) {
            c.beginPath();
            c.moveTo(this.grabX + i * 14, this.target.y);
            c.lineTo(this.grabX + i * 14, this.grabY + 12);
            c.stroke();
          }
        }
        c.restore();
      },
      renderOverlay(c) {
        c.save();
        if (this.phase === "rock_charge") {
          const p = Math.min(1, this.phaseElapsed / 0.72);
          const fx = this.owner.x - Math.cos(this.rockAng) * 16;
          const fy = this.owner.y - Math.sin(this.rockAng) * 16;

          // Dark dramatic anime backdrop + thick converging manga speedlines
          c.fillStyle = `rgba(3, 3, 8, ${0.72 * Math.min(1, p * 2)})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          c.strokeStyle = `rgba(255, 255, 255, ${0.28 + p * 0.42})`;
          c.lineWidth = 3.2;
          for (let i = 0; i < 20; i++) {
            const a = (i * Math.PI) / 10 + this.phaseElapsed * 1.6;
            c.beginPath();
            c.moveTo(fx + Math.cos(a) * (105 - p * 52), fy + Math.sin(a) * (105 - p * 52));
            c.lineTo(fx + Math.cos(a) * 360, fy + Math.sin(a) * 360);
            c.stroke();
          }

          // Colossal blazing Nen sun on Adult Gon's pulled-back fist
          const coreR = 32 + p * 56;
          const fistGrad = c.createRadialGradient(fx, fy, 5, fx, fy, coreR);
          fistGrad.addColorStop(0, "#ffffff");
          fistGrad.addColorStop(0.32, "#fde047");
          fistGrad.addColorStop(0.65, "rgba(249, 115, 22, 0.96)");
          fistGrad.addColorStop(0.88, "rgba(220, 38, 38, 0.75)");
          fistGrad.addColorStop(1, "rgba(9, 9, 11, 0)");
          c.fillStyle = fistGrad;
          c.beginPath();
          c.arc(fx, fy, coreR, 0, Math.PI * 2);
          c.fill();

          // Thick swirling black-crimson Nen ribbons around the Adult Rock fist
          drawBlackCrimsonRibbons(c, fx, fy, coreR * 0.78, this.phaseElapsed * 7, 4, 4.5);

          // White-ink shock arc
          c.strokeStyle = "#ffffff";
          c.lineWidth = 3.2;
          c.beginPath();
          c.arc(fx, fy, coreR * 0.65, this.phaseElapsed * 12, this.phaseElapsed * 12 + Math.PI * 1.3);
          c.stroke();

          // Anime battle cry callout banner
          const jx = (Math.random() - 0.5) * 5 * p;
          const jy = (Math.random() - 0.5) * 5 * p;
          c.font = "900 26px Impact, system-ui, sans-serif";
          c.textAlign = "center";
          c.strokeStyle = "#09090b";
          c.lineWidth = 6;
          const txt = p < 0.55 ? "FIRST COMES ROCK..." : "JAJANKEN...";
          c.strokeText(txt, WORLD_SIZE * 0.5 + jx, 78 + jy);
          c.fillStyle = p < 0.55 ? "#fde047" : "#ffffff";
          c.fillText(txt, WORLD_SIZE * 0.5 + jx, 78 + jy);
        }

        if (this.phase === "rock_impact") {
          const p = Math.min(1, this.phaseElapsed / 0.38);
          const a = Math.max(0, 1 - p);

          // Inverted black-and-white manga impact flash in the first 0.09s
          if (this.phaseElapsed < 0.09) {
            c.fillStyle = "rgba(255, 255, 255, 0.85)";
            c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
          }

          // Massive blazing Rock impact cone blasting across the arena
          c.save();
          c.translate(this.owner.x, this.owner.y);
          c.rotate(this.rockAng);
          c.globalAlpha = a;
          const coneGrad = c.createLinearGradient(0, 0, 380, 0);
          coneGrad.addColorStop(0, "#ffffff");
          coneGrad.addColorStop(0.32, "rgba(253, 224, 71, 0.95)");
          coneGrad.addColorStop(0.72, "rgba(249, 115, 22, 0.7)");
          coneGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
          c.fillStyle = coneGrad;
          c.beginPath();
          c.moveTo(0, -24);
          c.lineTo(380, -115);
          c.lineTo(380, 115);
          c.lineTo(0, 24);
          c.closePath();
          c.fill();
          c.restore();

          c.save();
          c.globalAlpha = a;
          c.font = "900 36px Impact, system-ui, sans-serif";
          c.textAlign = "center";
          c.strokeStyle = "#09090b";
          c.lineWidth = 7;
          c.strokeText("R O C K ! !", WORLD_SIZE * 0.5, 84);
          c.fillStyle = "#f97316";
          c.fillText("R O C K ! !", WORLD_SIZE * 0.5, 84);
          c.restore();
        }
        c.restore();
      },
    };
  }

  // ---- Adult Gon Ult Opener ----
  BF.triggerAdultGonOpener = (ball, g) => {
    if (!ball || !g) return;
    g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#09090b", 130, 0.36));
    g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#ffffff", 94, 0.28));
    g.spawnSparks(ball.x, ball.y, "#09090b", "#dc2626");
    g.spawnDamageText(ball.x, ball.y - ball.radius - 18, 0, "#ffffff", true, "I'LL USE EVERYTHING!");
  };

  // ---- Skill 1: Jajanken (Base) / Adult Gon Dash-Lift-Slam (Ult, 1 Variant Only) ----
  const SKILL_JAJANKEN = {
    name: "Jajanken",
    cooldown: 2.8,
    onTick(ball, g) {
      const enemy = pickEnemy(ball, g);
      if (!enemy) return false;

      // Adult Gon Ultimate: ONLY 1 skill variant (Dash -> Lift -> Ground Slam -> Adult Rock) with longer CD (4.8s)
      if (ball.ultTimer > 0) {
        this.cooldown = 4.8;
        g.entities.push(spawnAdultGonDashSlam(ball, enemy));
        g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#ffffff", true, "ADULT RUSH!");
        return true;
      }
      this.cooldown = 2.8;

      const forms = ["rock", "scissors", "paper"];
      const idx = (ball._jajankenIdx || 0) % forms.length;
      const form = forms[idx];
      ball._jajankenIdx = (idx + 1) % forms.length;

      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (form === "rock" && dist > 290) {
        // If too far for Rock, switch to Paper
        ball._jajankenIdx = 0;
      }

      const activeForm = form === "rock" && dist > 290 ? "paper" : form;

      rt.beginCast(ball, {
        kind: "powerup",
        duration: 0.24,
        color: activeForm === "rock" ? "#f97316" : activeForm === "scissors" ? "#facc15" : "#fbbf24",
        renderCast(b, c, p) {
          c.save();
          c.translate(b.x, b.y);
          const col = activeForm === "rock" ? "#f97316" : activeForm === "scissors" ? "#fde047" : "#fbbf24";
          const auraR = b.radius + 12 + p * 12;
          const grad = c.createRadialGradient(0, 0, b.radius * 0.6, 0, 0, auraR * 1.3);
          grad.addColorStop(0, "rgba(254, 240, 138, 0.15)");
          grad.addColorStop(0.6, "rgba(251, 191, 36, 0.55)");
          grad.addColorStop(1, "rgba(249, 115, 22, 0)");
          c.fillStyle = grad;
          c.beginPath();
          c.arc(0, 0, auraR * 1.3, 0, Math.PI * 2);
          c.fill();

          // Rotating golden Nen rings
          c.rotate(p * 8);
          c.strokeStyle = col;
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, auraR, 0, Math.PI * 1.2);
          c.stroke();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(0, 0, auraR * 0.85, Math.PI, Math.PI * 2.1);
          c.stroke();
          c.restore();
        },
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          if (activeForm === "rock") {
            gg.entities.push(spawnJajankenRockDash(b, t));
          } else if (activeForm === "scissors") {
            gg.entities.push(spawnJajankenScissorsDash(b, t));
          } else {
            const m = rt.castMuzzle(b, aim, 14);
            gg.entities.push(spawnJajankenPaperOrb(b, m.x, m.y, aim));
          }
        },
      });
      return true;
    },
  };

  function poly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Costume Drawer: Base (Gon) & Ult (Adult Gon Black Silhouette Form) ----
  BF.COSTUME_DRAWERS.gon = (ball, r, c) => {
    const isAdult = ball.ultTimer > 0;
    const t = performance.now() * 0.004;

    if (isAdult) {
      // Dark crimson & black-white Nen aura wisps rising around Adult Gon
      c.save();
      for (let i = 0; i < 8; i++) {
        const a = t * 1.1 + (i * Math.PI) / 4;
        c.strokeStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.72)" : "rgba(185, 28, 28, 0.65)";
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(0, 0, r * 1.24, a, a + 0.52);
        c.stroke();
      }
      c.restore();

      // Pitch-black shadow body
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = "#030305";
      c.fillRect(-r, -r, r * 2, r * 2);

      // Jagged white-ink muscle/shadow highlights (matching uploaded Adult Gon reference)
      c.strokeStyle = "rgba(255, 255, 255, 0.85)";
      c.lineWidth = 2;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.72, r * 0.42);
      c.lineTo(-r * 0.42, r * 0.25);
      c.lineTo(-r * 0.28, r * 0.52);
      c.moveTo(r * 0.72, r * 0.42);
      c.lineTo(r * 0.42, r * 0.25);
      c.lineTo(r * 0.28, r * 0.52);
      c.moveTo(-r * 0.5, r * 0.72);
      c.lineTo(0, r * 0.58);
      c.lineTo(r * 0.5, r * 0.72);
      c.stroke();

      // Stark pure-white hollow eyes
      c.fillStyle = "#ffffff";
      c.shadowColor = "#ffffff";
      c.shadowBlur = 10;
      c.beginPath();
      c.ellipse(-r * 0.3, -r * 0.04, r * 0.16, r * 0.15, 0, 0, Math.PI * 2);
      c.ellipse(r * 0.3, -r * 0.04, r * 0.16, r * 0.15, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;

      // Subtle white-ink grim mouth line
      c.strokeStyle = "rgba(255, 255, 255, 0.7)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-r * 0.18, r * 0.24);
      c.lineTo(0, r * 0.21);
      c.lineTo(r * 0.18, r * 0.24);
      c.stroke();
      c.restore();

      // Towering Adult Gon spiked black-and-white ink hair
      const adultHair = [
        [-0.9, -0.08], [-1.18, -0.58], [-0.88, -0.78], [-1.05, -1.55],
        [-0.45, -1.25], [-0.35, -2.05], [0, -1.65], [0.35, -2.05],
        [0.45, -1.25], [1.05, -1.55], [0.88, -0.78], [1.18, -0.58],
        [0.9, -0.08], [0.65, -0.4], [0, -0.48], [-0.65, -0.4],
      ];
      c.save();
      c.lineJoin = "round";
      c.fillStyle = "#030305";
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2.4;
      poly(c, r, adultHair);
      c.fill();
      c.stroke();
      c.restore();
      return;
    }

    // Base Form: Gon Freecss (Hunter Exam Green Jacket + Spiky Dark-Green Hair)
    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    // Green Hunter jacket
    c.fillStyle = "#16a34a";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-r, r * 0.45);
    c.lineTo(-r * 0.28, r * 0.44);
    c.lineTo(0, r * 0.62);
    c.lineTo(r * 0.28, r * 0.44);
    c.lineTo(r, r * 0.45);
    c.lineTo(r, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.stroke();

    // Red jacket trim
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.34, r * 0.45);
    c.lineTo(0, r * 0.66);
    c.lineTo(r * 0.34, r * 0.45);
    c.stroke();
    c.restore();

    // Spiky dark-green/black hair
    const baseHair = [
      [-0.92, -0.08], [-1.18, -0.48], [-0.88, -0.62], [-1.12, -1.28],
      [-0.48, -1.04], [-0.26, -1.46], [0, -1.2], [0.26, -1.46],
      [0.48, -1.04], [1.12, -1.28], [0.88, -0.62], [1.18, -0.48],
      [0.92, -0.08], [0.68, -0.34], [0.28, -0.44], [0, -0.32],
      [-0.28, -0.44], [-0.68, -0.34],
    ];
    c.save();
    c.lineJoin = "round";
    const hGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.46);
    hGrad.addColorStop(0, "#052e16");
    hGrad.addColorStop(0.65, "#064e3b");
    hGrad.addColorStop(1, "#15803d");
    c.fillStyle = hGrad;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    poly(c, r, baseHair);
    c.fill();
    c.stroke();
    c.restore();
  };

  BF.CHARACTER_ROSTER.gon = {
    id: "gon",
    name: "GON FREECSS",
    shortName: "GON",
    title: "Enhancer • Jajanken & Adult Gon",
    role: "ENHANCER • BRAWLER",
    color: "#16a34a",
    radius: 27,
    speed: 356,
    maxHp: 560,
    damage: [6, 9],
    mass: 1.0,
    costume: "gon",
    weapon: null,
    ult: "adult_gon",
    ultName: "RESTRICTION & PLEDGE (ADULT GON)",
    ultDesc: "Transforms into pitch-black Adult Gon for 9s! Replaces Jajanken with 1 brutal skill: dashes to the enemy, lifts them into the air, and slams them into the ground!",
    skillName: "JAJANKEN (ROCK • SCISSORS • PAPER)",
    skillDesc: "Cycles between Jajanken Rock (heavy Nen fist dash), Scissors (golden Nen blade slash), and Paper (Nen energy orb)!",
    skills: [SKILL_JAJANKEN],
  };
})();

