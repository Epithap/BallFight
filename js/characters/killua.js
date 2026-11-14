// ============================================================
//  KILLUA ZOLDYCK (LIGHTNING ASSASSIN)
//  Hunter x Hunter — 50kg Alloy Yo-Yo, Rhythm Echo & Godspeed (Kanmuru)
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function clampArena(val, pad) {
    return Math.max(pad, Math.min(WORLD_SIZE - pad, val));
  }

  function spawnLightningBoltVisual(x1, y1, x2, y2, color = "#38bdf8", life = 0.26, width = 9) {
    const pts = [{ x: x1, y: y1 }];
    const steps = 7;
    for (let i = 1; i < steps; i++) {
      const f = i / steps;
      const jitter = (Math.random() - 0.5) * 30;
      pts.push({
        x: x1 + (x2 - x1) * f + jitter,
        y: y1 + (y2 - y1) * f + (Math.random() - 0.5) * 14,
      });
    }
    pts.push({ x: x2, y: y2 });

    return {
      life,
      maxLife: life,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = a;
        c.lineCap = "round";
        c.lineJoin = "round";

        c.strokeStyle = color;
        c.lineWidth = width * a;
        c.shadowColor = color;
        c.shadowBlur = 14;
        c.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
        c.stroke();

        c.strokeStyle = "#ffffff";
        c.lineWidth = Math.max(2, width * 0.35) * a;
        c.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnElectricAfterimage(x, y, radius, life = 0.35) {
    return {
      x,
      y,
      radius,
      life,
      maxLife: life,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, (this.life / this.maxLife) * 0.65);
        c.save();
        c.globalAlpha = a;
        c.translate(this.x, this.y);
        c.fillStyle = "#38bdf8";
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Static Field left on ground by Narukami Sky Pillar ----
  function spawnStaticField(owner, x, y, radius = 56, duration = 2.5) {
    return {
      owner,
      x,
      y,
      radius,
      life: duration,
      maxLife: duration,
      tickTimer: 0.45,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.tickTimer -= dt;
        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (!enemy) return;

        const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (dist <= this.radius + enemy.radius) {
          g.addEffect(enemy, "slow", 0.2, { factor: 0.8 });
          if (this.tickTimer <= 0) {
            this.tickTimer = 0.5;
            const dealt = g.applyDamage(enemy, 2);
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#e0f2fe");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 10, dealt, "#7dd3fc", false, "STATIC!");
          }
        }
      },
      render(c) {
        const a = Math.min(1, this.life / 0.45) * 0.55;
        const pulse = Math.sin((rt.elapsed || 0) * 14) * 3;
        c.save();
        c.globalAlpha = a;
        const grad = c.createRadialGradient(this.x, this.y, 4, this.x, this.y, this.radius);
        grad.addColorStop(0, "rgba(224, 242, 254, 0.5)");
        grad.addColorStop(0.65, "rgba(56, 189, 248, 0.28)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.5;
        c.setLineDash([8, 6]);
        c.beginPath();
        c.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Tethered 50kg Alloy Yo-Yo Boomerang Entity ----
  function spawnTetheredYoYo(owner, angle, throwState, inUlt) {
    const speed = inUlt ? 620 : 560;
    return {
      owner,
      throwState,
      x: owner.x + Math.cos(angle) * (owner.radius + 10),
      y: owner.y + Math.sin(angle) * (owner.radius + 10),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 13,
      phase: "out",
      outTime: 0,
      maxOutTime: 0.44,
      totalLife: 0,
      spin: 0,
      outHit: false,
      retHit: false,
      dead: false,
      update(dt, g) {
        if (!this.owner || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.totalLife += dt;
        this.spin += dt * 24;
        if (this.totalLife > 1.7) {
          this.dead = true;
          return;
        }

        if (this.phase === "out") {
          this.outTime += dt;
          this.x += this.vx * dt;
          this.y += this.vy * dt;

          // Wall ricochet!
          let bounced = false;
          if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx); bounced = true; }
          if (this.x > WORLD_SIZE - this.radius) { this.x = WORLD_SIZE - this.radius; this.vx = -Math.abs(this.vx); bounced = true; }
          if (this.y < this.radius) { this.y = this.radius; this.vy = Math.abs(this.vy); bounced = true; }
          if (this.y > WORLD_SIZE - this.radius) { this.y = WORLD_SIZE - this.radius; this.vy = -Math.abs(this.vy); bounced = true; }
          if (bounced) {
            g.spawnSparks(this.x, this.y, "#38bdf8", "#ffffff");
          }

          const distFromOwner = Math.hypot(this.x - this.owner.x, this.y - this.owner.y);
          if (this.outTime >= this.maxOutTime || distFromOwner >= 245) {
            this.phase = "return";
          }
        } else {
          // Retract swiftly back to Killua's current position
          const dx = this.owner.x - this.x;
          const dy = this.owner.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist <= this.owner.radius + 14) {
            this.dead = true;
            return;
          }
          const retSpeed = inUlt ? 720 : 650;
          this.vx = (dx / dist) * retSpeed;
          this.vy = (dy / dist) * retSpeed;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
        }

        const target = g.balls.find((b) => b !== this.owner && b.alive);
        if (!target) return;
        const dTarget = Math.hypot(target.x - this.x, target.y - this.y);
        if (dTarget <= target.radius + this.radius) {
          if (this.phase === "out" && !this.outHit) {
            this.outHit = true;
            const raw = inUlt ? Math.round(9 + rt.rng() * 2) : Math.round(7 + rt.rng() * 2);
            const dealt = g.applyDamage(target, raw);
            target.flashTimer = 0.1;
            target.squash = 0.72;
            const kAng = Math.atan2(this.vy, this.vx);
            target.vx += Math.cos(kAng) * 140;
            target.vy += Math.sin(kAng) * 140;
            g.spawnSparks(this.x, this.y, "#38bdf8", "#e0f2fe");
            g.spawnDamageText(target.x, target.y - target.radius - 12, dealt, "#38bdf8", false, "YO-YO HIT!");
            g.sound.playBallHit();
            if (!inUlt && !this.throwState.ultCharged) {
              this.throwState.ultCharged = true;
              g.chargeUlt(this.owner);
            }
          } else if (this.phase === "return" && !this.retHit) {
            this.retHit = true;
            const raw = inUlt ? Math.round(8 + rt.rng() * 2) : Math.round(6 + rt.rng() * 2);
            const dealt = g.applyDamage(target, raw);
            target.flashTimer = 0.1;
            target.squash = 0.75;
            // Snap-pull enemy slightly toward Killua
            const pullAng = Math.atan2(this.owner.y - target.y, this.owner.x - target.x);
            target.vx += Math.cos(pullAng) * 185;
            target.vy += Math.sin(pullAng) * 185;
            g.spawnSparks(this.x, this.y, "#7dd3fc", "#ffffff");
            g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#7dd3fc", false, "YO-YO SNAP!");
            g.sound.playBallHit();
            if (!inUlt && !this.throwState.ultCharged) {
              this.throwState.ultCharged = true;
              g.chargeUlt(this.owner);
            }
          }
        }
      },
      render(c) {
        if (!this.owner || !this.owner.alive) return;
        c.save();
        // High-tension metallic wire tethered to Killua
        c.strokeStyle = inUlt ? "#7dd3fc" : "#e2e8f0";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(this.owner.x, this.owner.y);
        c.lineTo(this.x, this.y);
        c.stroke();

        // Spinning 50kg Alloy Yo-Yo disc
        c.translate(this.x, this.y);
        c.rotate(this.spin);
        c.fillStyle = "#475569";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.8;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#cbd5e1";
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(0, 0, this.radius * 0.68, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#38bdf8";
        c.beginPath();
        c.arc(0, 0, 3.2, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // ---- Rhythm Echo Decoy Afterimage ----
  function spawnRhythmEchoDecoy(owner, target, angleOffset) {
    const baseAng = Math.atan2(target.y - owner.y, target.x - owner.x) + angleOffset;
    const spd = Math.max(owner.baseSpeed * 1.12, 375);
    return {
      owner,
      x: owner.x + Math.cos(baseAng) * 14,
      y: owner.y + Math.sin(baseAng) * 14,
      vx: Math.cos(baseAng) * spd,
      vy: Math.sin(baseAng) * spd,
      radius: owner.radius * 0.9,
      life: 1.4,
      maxLife: 1.4,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx); }
        if (this.x > WORLD_SIZE - this.radius) { this.x = WORLD_SIZE - this.radius; this.vx = -Math.abs(this.vx); }
        if (this.y < this.radius) { this.y = this.radius; this.vy = Math.abs(this.vy); }
        if (this.y > WORLD_SIZE - this.radius) { this.y = WORLD_SIZE - this.radius; this.vy = -Math.abs(this.vy); }

        const t = g.balls.find((b) => b !== this.owner && b.alive);
        if (!t) return;
        if (Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(t, 3);
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#bae6fd", 58, 0.22));
          g.spawnDamageText(t.x, t.y - t.radius - 10, dealt, "#bae6fd", false, "DECOY!");
          g.sound.playBallHit();
        }
      },
      render(c) {
        const a = Math.min(0.5, (this.life / this.maxLife) * 0.6);
        c.save();
        c.globalAlpha = a;
        c.translate(this.x, this.y);
        c.fillStyle = "#0ea5e9";
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Delayed Rhythm Echo Convergence + Izutsushi (Lightning Palm Bolt, No Teleport) ----
  function spawnIzutsushiAmbush(owner, target) {
    return {
      owner,
      target,
      timer: 0.28,
      dead: false,
      update(dt, g) {
        this.timer -= dt;
        if (this.timer > 0) return;
        this.dead = true;
        if (!this.owner.alive || !this.target || !this.target.alive) return;

        // Strike target from Killua's position with a branching Izutsushi Lightning Palm bolt (no random TP)
        const strikeAng = Math.atan2(this.target.y - this.owner.y, this.target.x - this.owner.x);
        this.owner.vx = Math.cos(strikeAng) * this.owner.baseSpeed * 1.15;
        this.owner.vy = Math.sin(strikeAng) * this.owner.baseSpeed * 1.15;

        const raw = Math.round(10 + rt.rng() * 2);
        const dealt = g.applyDamage(this.target, raw);
        this.target.flashTimer = 0.14;
        this.target.squash = 0.85;
        g.addEffect(this.target, "stun", 0.35);
        this.target._staticMarkTimer = 2.2;
        this.target._staticMarkOwner = this.owner;

        g.entities.push(spawnLightningBoltVisual(this.owner.x, this.owner.y, this.target.x, this.target.y, "#38bdf8", 0.28, 9));
        g.entities.push(rt.spawnShockRing(this.target.x, this.target.y, "#38bdf8", 86, 0.3));
        g.spawnSparks(this.target.x, this.target.y, "#38bdf8", "#ffffff");
        g.spawnDamageText(this.target.x, this.target.y - this.target.radius - 14, dealt, "#38bdf8", true, "IZUTSUSHI!");
        g.sound.playCritHit();
        rt.setHitStop(0.045);
        rt.addShake(0.14, 3.8);
      },
    };
  }

  // ---- Godspeed Opener: Narukami Sky Pillar + Static Field ----
  BF.triggerGodspeedOpener = function triggerGodspeedOpener(b, g) {
    const enemy = g.balls.find((x) => x !== b && x.alive);
    if (!enemy) return;

    const raw = Math.round(14 + rt.rng() * 2);
    const dealt = g.applyDamage(enemy, raw);
    enemy.flashTimer = 0.16;
    enemy.squash = 0.9;
    g.addEffect(enemy, "stun", 0.4);

    g.entities.push(spawnLightningBoltVisual(enemy.x, 12, enemy.x, enemy.y, "#38bdf8", 0.36, 13));
    g.entities.push(spawnStaticField(b, enemy.x, enemy.y, 58, 2.5));
    g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#e0f2fe", 110, 0.38));
    g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#ffffff");
    g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#38bdf8", true, "NARUKAMI SKY PILLAR!");
    rt.setHitStop(0.06);
    rt.addShake(0.22, 5.5);
  };

  function triggerWhirlwindCounter(ball, target, g) {
    if (!target || !target.alive) return;
    const raw = Math.round(8 + rt.rng() * 2);
    const dealt = g.applyDamage(target, raw);
    target.flashTimer = 0.12;
    g.entities.push(spawnLightningBoltVisual(ball.x, ball.y, target.x, target.y, "#38bdf8", 0.22, 8));
    g.spawnSparks(target.x, target.y, "#38bdf8", "#ffffff");
    g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#38bdf8", false, "WHIRLWIND COUNTER!");
    g.sound.playBallHit();
  }

  // ---- Skill 1: 50kg Alloy Yo-Yo: Trick Orbit (Primary +1 Ult Charge) ----
  const SKILL_ALLOY_YOYO = {
    name: "Alloy Yo-Yo",
    cooldown: 2.6,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 330) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.22,
        color: "#38bdf8",
        renderCast(b, c, p, ang, tg) {
          // Twin V-trajectory metallic wire sightlines toward enemy
          if (tg && p > 0.2) {
            c.save();
            c.setLineDash([7, 6]);
            c.lineWidth = 2.2;
            c.strokeStyle = "rgba(125, 211, 252, 0.72)";
            for (const sgn of [-1, 1]) {
              const wAng = ang + sgn * 0.28;
              c.beginPath();
              c.moveTo(b.x, b.y);
              c.lineTo(b.x + Math.cos(wAng) * 145, b.y + Math.sin(wAng) * 145);
              c.stroke();
            }
            c.restore();
          }

          // Orbiting twin 50kg Alloy Yo-Yo discs on taut silver wires + crackling Nen lightning
          const orbitDist = b.radius + 16 + Math.sin(p * Math.PI) * 12;
          for (const sgn of [-1, 1]) {
            const yAng = ang + sgn * (0.68 - p * 0.36);
            const yx = b.x + Math.cos(yAng) * orbitDist;
            const yy = b.y + Math.sin(yAng) * orbitDist;

            // Taut alloy wire
            c.strokeStyle = "#e2e8f0";
            c.lineWidth = 2.4;
            c.beginPath();
            c.moveTo(b.x, b.y);
            c.lineTo(yx, yy);
            c.stroke();

            // Crackling jagged Nen lightning arc jumping along the wire
            c.strokeStyle = "#38bdf8";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(b.x, b.y);
            for (let s = 1; s <= 3; s++) {
              const frac = s / 4;
              const jx = b.x + (yx - b.x) * frac + Math.sin(p * 30 + s * 7 + sgn) * 6;
              const jy = b.y + (yy - b.y) * frac + Math.cos(p * 26 + s * 5 + sgn) * 6;
              c.lineTo(jx, jy);
            }
            c.lineTo(yx, yy);
            c.stroke();

            // Spinning 50kg Alloy Yo-Yo disc with Zoldyck Star emblem
            c.save();
            c.translate(yx, yy);
            c.rotate(p * 18 * sgn);
            c.shadowColor = "#38bdf8";
            c.shadowBlur = 10;
            c.fillStyle = "#334155";
            c.strokeStyle = COLORS.ink;
            c.lineWidth = 2.6;
            c.beginPath();
            c.arc(0, 0, 10, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            c.fillStyle = "#cbd5e1";
            c.beginPath();
            c.arc(0, 0, 6.4, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = "#0284c7";
            c.lineWidth = 1.4;
            for (const base of [0, Math.PI / 3]) {
              c.beginPath();
              for (let i = 0; i < 3; i++) {
                const sa = base + (i * Math.PI * 2) / 3;
                const sx = Math.cos(sa) * 4.8;
                const sy = Math.sin(sa) * 4.8;
                if (i === 0) c.moveTo(sx, sy);
                else c.lineTo(sx, sy);
              }
              c.closePath();
              c.stroke();
            }
            c.restore();
          }
        },
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const baseAng = Math.atan2(t.y - b.y, t.x - b.x);
          const throwState = { ultCharged: false };
          for (const offset of [-0.28, 0.28]) {
            gg.entities.push(spawnTetheredYoYo(b, baseAng + offset, throwState, inUlt));
          }
          gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#7dd3fc", false, "ALLOY YO-YO!");
          gg.sound.playBallHit();
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Rhythm Echo & Izutsushi + Godspeed Passive Hooks ----
  const SKILL_RHYTHM_ECHO = {
    name: "Rhythm Echo",
    cooldown: 4.5,
    onTick(ball, g, dt) {
      // Tick Static Mark on enemy if present
      const enemy = g.balls.find((b) => b !== ball && b.alive);
      if (enemy && enemy._staticMarkTimer > 0 && dt) {
        enemy._staticMarkTimer = Math.max(0, enemy._staticMarkTimer - dt);
      }

      // Godspeed active mechanics (Denko Sekka Zig-Zag + Shippujinrai Projectile Auto-Dodge)
      if (ball.ultTimer > 0 && dt) {
        ball._whirlwindCd = Math.max(0, (ball._whirlwindCd || 0) - dt);
        ball._denkoTimer = (ball._denkoTimer || 0) - dt;

        // 1. Shippujinrai: Auto-Dodge incoming enemy projectiles within 52px
        if (ball._whirlwindCd <= 0) {
          for (const ent of g.entities) {
            if (!ent || ent.dead || ent.owner === ball || ent._dodgedByKillua) continue;
            if (typeof ent.vx !== "number" || typeof ent.vy !== "number" || typeof ent.x !== "number") continue;
            const d = Math.hypot(ent.x - ball.x, ent.y - ball.y);
            if (d <= ball.radius + (ent.radius || 12) + 36) {
              ent._dodgedByKillua = true;
              ball._whirlwindCd = 1.6;
              g.entities.push(spawnElectricAfterimage(ball.x, ball.y, ball.radius, 0.35));

              const pAng = Math.atan2(ent.vy, ent.vx);
              const side = rt.rng() < 0.5 ? 1 : -1;
              const dodgeAng = pAng + side * Math.PI * 0.5;
              const pad = ball.radius + 16;
              const nx = clampArena(ball.x + Math.cos(dodgeAng) * 54, pad);
              const ny = clampArena(ball.y + Math.sin(dodgeAng) * 54, pad);
              g.entities.push(spawnLightningBoltVisual(ball.x, ball.y, nx, ny, "#e0f2fe", 0.22, 6));
              ball.x = nx;
              ball.y = ny;
              g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#e0f2fe", false, "SHIPPUJINRAI DODGE!");

              if (enemy && Math.hypot(enemy.x - ball.x, enemy.y - ball.y) <= 185) {
                triggerWhirlwindCounter(ball, enemy, g);
              }
              break;
            }
          }
        }

        // 2. Denko Sekka: Periodic Zig-Zag lightning dash toward enemy
        if (ball._denkoTimer <= 0 && enemy) {
          ball._denkoTimer = 0.85;
          const toEnemy = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
          ball._denkoFlip = -(ball._denkoFlip || 1);
          const zigAng = toEnemy + ball._denkoFlip * 0.65;
          const pad = ball.radius + 16;
          const zx = clampArena(ball.x + Math.cos(zigAng) * 40, pad);
          const zy = clampArena(ball.y + Math.sin(zigAng) * 40, pad);
          g.entities.push(spawnLightningBoltVisual(ball.x, ball.y, zx, zy, "#38bdf8", 0.2, 6));
          ball.x = zx;
          ball.y = zy;
          const spd = Math.hypot(ball.vx, ball.vy) || ball.baseSpeed;
          ball.vx = Math.cos(toEnemy) * spd;
          ball.vy = Math.sin(toEnemy) * spd;
        }
      }

      // Active Skill 2 cast check
      if (this._cd > 0 || !enemy) return false;
      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 340) return false;

      // Spawn 3 Rhythm Echo decoy clones + schedule Izutsushi blindspot backstab
      for (const angOff of [-0.65, 0, 0.65]) {
        g.entities.push(spawnRhythmEchoDecoy(ball, enemy, angOff));
      }
      g.entities.push(spawnIzutsushiAmbush(ball, enemy));
      g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#bae6fd", 72, 0.26));
      g.spawnDamageText(ball.x, ball.y - ball.radius - 12, 0, "#bae6fd", false, "RHYTHM ECHO!");
      return true;
    },
    onHit(ball, target, g) {
      if (!target || !target.alive) return false;
      if (target._staticMarkTimer > 0 && target._staticMarkOwner === ball) {
        target._staticMarkTimer = 0;
        const dealt = g.applyDamage(target, 3);
        g.spawnSparks(target.x, target.y, "#38bdf8", "#ffffff");
        g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#7dd3fc", false, "STATIC SNAP!");
      }
      return false;
    },
    onDamaged(ball, amount, g) {
      if (!ball.alive || !(ball.ultTimer > 0) || amount <= 0) return false;
      if ((ball._whirlwindCd || 0) > 0) return false;
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      ball._whirlwindCd = 1.6;
      triggerWhirlwindCounter(ball, target, g);
      return false;
    },
  };

  // ---- Shared polygon helper (points in radius units) ----
  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: 50kg Alloy Yo-Yo (steel disc + taut wire + Star of David Zoldyck emblem) ----
  BF.WEAPON_DRAWERS.alloy_yoyo = (ball, c) => {
    const hot = ball.ultTimer > 0;
    c.save();
    // High-tension metallic wire back to Killua's hand
    c.strokeStyle = hot ? "#7dd3fc" : "#cbd5e1";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-4, 18);
    c.lineTo(0, -14);
    c.stroke();

    // Heavy 50kg Alloy Yo-Yo disc extended out past hair spikes
    c.fillStyle = "#475569";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.arc(0, -16, 13.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const g = c.createLinearGradient(-10, -26, 10, -6);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.5, "#94a3b8");
    g.addColorStop(1, "#e2e8f0");
    c.fillStyle = g;
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, -16, 9.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Iconic 6-pointed star emblem on Killua's Yo-Yo
    c.strokeStyle = hot ? "#0284c7" : "#334155";
    c.lineWidth = 1.5;
    for (let s = 0; s < 2; s++) {
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = s * Math.PI + (i * Math.PI * 2) / 3 - Math.PI * 0.5;
        const px = Math.cos(a) * 6.5;
        const py = -16 + Math.sin(a) * 6.5;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();
    }

    c.fillStyle = hot ? "#38bdf8" : "#1e293b";
    c.beginPath();
    c.arc(0, -16, 2.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  // ---- Costume Drawer: Killua Zoldyck (fluffy silver hair, navy-purple shirt, Godspeed lightning) ----
  BF.COSTUME_DRAWERS.killua = (ball, r, c) => {
    const isGodspeed = ball.ultTimer > 0;
    const t = performance.now() * 0.001;

    // Godspeed: crackling blue-white electric aura around the whole body
    if (isGodspeed) {
      c.save();
      c.fillStyle = "rgba(125, 211, 252, 0.22)";
      c.beginPath();
      c.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      c.fill();
      c.lineCap = "round";
      c.lineJoin = "round";
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + Math.floor(t * 12) * 0.9;
        c.strokeStyle = i % 2 ? "#e0f2fe" : "#38bdf8";
        c.lineWidth = i % 2 ? 1.8 : 2.6;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02);
        c.lineTo(Math.cos(a + 0.12) * r * 1.2, Math.sin(a + 0.12) * r * 1.2);
        c.lineTo(Math.cos(a - 0.06) * r * 1.3, Math.sin(a - 0.06) * r * 1.3);
        c.lineTo(Math.cos(a + 0.1) * r * 1.46, Math.sin(a + 0.1) * r * 1.46);
        c.stroke();
      }
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    // Outfit: navy-purple turtleneck under white V-trimmed short-sleeve top
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "#312e81";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-r, r * 0.52);
    c.quadraticCurveTo(0, r * 0.4, r, r * 0.52);
    c.lineTo(r, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.stroke();

    // White outer tunic shoulders
    c.fillStyle = "#f8fafc";
    c.beginPath();
    c.moveTo(-r, r * 0.52);
    c.lineTo(-r * 0.34, r * 0.48);
    c.lineTo(-r * 0.22, r * 1.08);
    c.lineTo(-r, r * 1.08);
    c.closePath();
    c.moveTo(r, r * 0.52);
    c.lineTo(r * 0.34, r * 0.48);
    c.lineTo(r * 0.22, r * 1.08);
    c.lineTo(r, r * 1.08);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();

    // Fluffy, untamed silver-white hair (wide volume + spiky bangs)
    const hair = [
      [-0.95, 0.06], [-1.2, -0.22], [-1.0, -0.36], [-1.3, -0.6], [-0.98, -0.7], [-1.14, -1.02],
      [-0.72, -0.94], [-0.68, -1.32], [-0.38, -1.04], [-0.12, -1.44], [0.1, -1.08], [0.4, -1.38],
      [0.52, -1.0], [0.88, -1.2], [0.82, -0.84], [1.24, -0.82], [0.98, -0.56], [1.28, -0.3],
      [0.98, -0.2], [1.0, 0.06],
      // inner side lock + bangs (right -> left)
      [0.8, -0.1], [0.7, -0.4], [0.56, -0.28], [0.44, -0.48], [0.22, -0.32], [0.1, -0.5],
      [-0.04, -0.18], [-0.14, -0.48], [-0.26, -0.32], [-0.42, -0.5], [-0.56, -0.3], [-0.68, -0.44],
      [-0.8, -0.1],
    ];
    c.save();
    c.lineJoin = "round";
    const hg = c.createLinearGradient(0, -r * 1.4, 0, -r * 0.1);
    hg.addColorStop(0, "#ffffff");
    hg.addColorStop(1, isGodspeed ? "#bae6fd" : "#d5dbe6");
    c.fillStyle = hg;
    c.strokeStyle = isGodspeed ? "#0284c7" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();
    // Soft grey strand shading
    c.strokeStyle = isGodspeed ? "rgba(14, 165, 233, 0.55)" : "rgba(100, 116, 139, 0.55)";
    c.lineWidth = 1.6;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.62, -1.0, -0.42, -0.6], [-0.12, -1.2, -0.06, -0.62], [0.38, -1.12, 0.26, -0.66],
      [0.76, -0.84, 0.58, -0.56], [-0.92, -0.6, -0.74, -0.38], [0.94, -0.4, 0.8, -0.24],
    ]) {
      c.moveTo(x0 * r, y0 * r);
      c.lineTo(x1 * r, y1 * r);
    }
    c.stroke();
    c.restore();
  };

  BF.CHARACTER_ROSTER.killua = {
    id: "killua",
    name: "LIGHTNING ASSASSIN",
    shortName: "ASSASSIN",
    title: "Zoldyck Prodigy • Master of Godspeed",
    role: "ASSASSIN • GODSPEED LIGHTNING",
    color: "#38bdf8",
    radius: 28,
    speed: 382,
    maxHp: 545,
    damage: [5, 8],
    mass: 0.96,
    costume: "killua",
    weapon: "alloy_yoyo",
    ult: "godspeed",
    ultName: "GODSPEED (KANMURU)",
    ultDesc: "Drops Narukami Sky Pillar (+Static Field), enters Denko Sekka zig-zag lightning movement (+35% Speed), and uses Shippujinrai to auto-dodge projectiles & counter!",
    skillName: "ALLOY YO-YO & IZUTSUSHI",
    skillDesc: "Throws 2 wall-bouncing Alloy Yo-Yos that snap back for double hits, and uses Rhythm Echo decoys to blink behind enemies with Izutsushi Lightning Palm!",
    skills: [SKILL_ALLOY_YOYO, SKILL_RHYTHM_ECHO],
  };
})();
