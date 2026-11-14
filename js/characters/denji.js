// ============================================================
//  DENJI (CHAINSAW DEVIL)
//  Chainsaw Man — Twin Fixed Chainsaw Arms, Chain Tether & Hero of Hell
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  // ---- Shared Chainsaw Blade Drawer (Fixed orientation, rapidly spinning saw teeth!) ----
  function drawChainsawArmBlade(c, length = 34, isHeroOfHell = false, scale = 1) {
    const tick = (performance.now() * 0.03) % 6;
    c.save();
    c.scale(scale, scale);
    c.lineJoin = "round";

    // Forearm engine housing
    c.fillStyle = isHeroOfHell ? "#18181b" : "#c2410c";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.3;
    c.beginPath();
    c.roundRect(-7.5, -2, 15, 13, 4);
    c.fill();
    c.stroke();

    // Cooling vents on engine
    c.fillStyle = isHeroOfHell ? "#ef4444" : "#7c2d12";
    c.fillRect(-4.5, 2, 9, 2.2);
    c.fillRect(-4.5, 6.5, 9, 2.2);

    // Steel guide bar (stationary blade body)
    c.fillStyle = "#cbd5e1";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-5.2, -1);
    c.lineTo(-5.2, -length);
    c.arc(0, -length, 5.2, Math.PI, 0);
    c.lineTo(5.2, -1);
    c.closePath();
    c.fill();
    c.stroke();

    // Glowing blood groove down center
    c.strokeStyle = isHeroOfHell ? "#ef4444" : "#dc2626";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -3);
    c.lineTo(0, -length + 1);
    c.stroke();

    // Rapidly running saw teeth ("gerigi berputar-putar") along both edges + tip
    c.fillStyle = "#f8fafc";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.15;
    for (let y = -length + tick; y < -2; y += 6) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 5.2, y);
        c.lineTo(s * 9.8, y + (s === -1 ? 1.2 : 3.2));
        c.lineTo(s * 5.2, y + 4.2);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
    // Tip teeth spinning around rounded nose (sharp triangular teeth, not dots)
    const tipSpin = (performance.now() * 0.025) % (Math.PI / 3);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI + tipSpin + (i * Math.PI) / 4;
      if (a > Math.PI * 2) continue;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      const tx = -ny;
      const ty = nx;
      const bx = nx * 5.2;
      const by = -length + ny * 5.2;
      c.beginPath();
      c.moveTo(bx - tx * 2, by - ty * 2);
      c.lineTo(nx * 9.5, -length + ny * 9.5);
      c.lineTo(bx + tx * 2, by + ty * 2);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();
  }

  // ---- Blood Siphon Orb returning to Denji ----
  function spawnBloodOrb(owner, x, y, healAmt) {
    return {
      owner,
      x,
      y,
      life: 1.2,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner || !this.owner.alive) {
          this.dead = true;
          return;
        }
        const dx = this.owner.x - this.x;
        const dy = this.owner.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.x += (dx / dist) * 480 * dt;
        this.y += (dy / dist) * 480 * dt;
        if (dist <= this.owner.radius + 10) {
          if (this.owner.hp < this.owner.maxHp) {
            const actual = Math.min(healAmt, this.owner.maxHp - this.owner.hp);
            this.owner.hp += actual;
            g.spawnDamageText(this.owner.x, this.owner.y - this.owner.radius - 12, 0, COLORS.green, false, `+${actual} BLOOD`);
          }
          g.spawnSparks(this.owner.x, this.owner.y, "#ef4444", "#fbbf24");
          this.dead = true;
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.fillStyle = "#ef4444";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.shadowColor = "#ef4444";
        c.shadowBlur = 10;
        c.beginPath();
        c.arc(0, 0, 7, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#fecaca";
        c.beginPath();
        c.arc(-2, -2, 2.4, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // ---- Skill 1 Projectile: Twin Chainsaw Arm Blades (Fixed forward angle, spinning teeth!) ----
  function spawnTwinSawbladeProjectile(owner, angle, lateralOffset, castState, inUlt) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy * lateralOffset;
    const py = ux * lateralOffset;
    const speed = inUlt ? 600 : 540;
    return {
      owner,
      x: owner.x + ux * (owner.radius + 12) + px,
      y: owner.y + uy * (owner.radius + 12) + py,
      vx: ux * speed,
      vy: uy * speed,
      angle,
      radius: 13,
      bounces: 1,
      castState,
      life: 1.45,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounce once off arena wall
        let bounced = false;
        if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx); bounced = true; }
        if (this.x > WORLD_SIZE - this.radius) { this.x = WORLD_SIZE - this.radius; this.vx = -Math.abs(this.vx); bounced = true; }
        if (this.y < this.radius) { this.y = this.radius; this.vy = Math.abs(this.vy); bounced = true; }
        if (this.y > WORLD_SIZE - this.radius) { this.y = WORLD_SIZE - this.radius; this.vy = -Math.abs(this.vy); bounced = true; }
        if (bounced) {
          if (this.bounces <= 0) {
            this.dead = true;
            return;
          }
          this.bounces--;
          this.angle = Math.atan2(this.vy, this.vx);
          g.spawnSparks(this.x, this.y, "#f97316", "#f8fafc");
        }

        const t = g.balls.find((b) => b !== this.owner && b.alive);
        if (t && Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          const base = inUlt ? Math.round(6 + rt.rng() * 2) : Math.round(5 + rt.rng());
          const dmg = t._denjiShredTimer > 0 ? Math.round(base * 1.15) : base;
          const dealt = g.applyDamage(t, dmg);
          t.flashTimer = 0.11;
          t.squash = 0.8;
          t._denjiBleedTimer = 2.0;
          t._denjiBleedTick = 0.5;
          g.spawnSparks(this.x, this.y, "#ef4444", "#fbbf24");
          g.spawnDamageText(t.x, t.y - t.radius - 12, dealt, "#f97316", false, "SAW RIP!");
          g.sound.playBallHit();
          if (!this.castState.bloodSpawned) {
            this.castState.bloodSpawned = true;
            g.entities.push(spawnBloodOrb(this.owner, this.x, this.y, inUlt ? 7 : 5));
          }
          if (!inUlt && !this.castState.ultCharged) {
            this.castState.ultCharged = true;
            g.chargeUlt(this.owner);
          }
          this.dead = true;
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle + Math.PI * 0.5);
        drawChainsawArmBlade(c, 26, inUlt, 0.72);
        c.restore();
      },
    };
  }

  // ---- Skill 2 Projectile & Physical Tether Grind (No Teleport!) ----
  function spawnChainsawTetherEntity(owner, target) {
    return {
      owner,
      target,
      life: 0.95,
      tickCd: 0.05,
      ticksLeft: 3,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive || !this.target.alive) {
          this.dead = true;
          return;
        }
        const dx = this.target.x - this.owner.x;
        const dy = this.target.y - this.owner.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        // Physical reel-in pull (no teleport)
        if (dist > this.owner.radius + this.target.radius + 14) {
          this.owner.vx += nx * 560 * dt;
          this.owner.vy += ny * 560 * dt;
          this.target.vx -= nx * 460 * dt;
          this.target.vy -= ny * 460 * dt;
        }

        this.tickCd -= dt;
        if (this.tickCd <= 0 && this.ticksLeft > 0) {
          this.tickCd = 0.28;
          this.ticksLeft--;
          const dealt = g.applyDamage(this.target, 3);
          this.target.flashTimer = 0.08;
          this.target._denjiShredTimer = 2.5;
          g.spawnSparks(this.target.x, this.target.y, "#ef4444", "#fbbf24");
          g.spawnDamageText(this.target.x, this.target.y - this.target.radius - 12, dealt, "#fbbf24", false, "CHAIN GRIND!");
          g.sound.playBallHit();
        }
      },
      render(c) {
        c.save();
        c.strokeStyle = "#cbd5e1";
        c.lineWidth = 4.5;
        c.setLineDash([9, 5]);
        c.shadowColor = "#f97316";
        c.shadowBlur = 10;
        c.beginPath();
        c.moveTo(this.owner.x, this.owner.y);
        c.lineTo(this.target.x, this.target.y);
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnChainHookProjectile(owner, angle) {
    const speed = 640;
    const m = rt.castMuzzle(owner, angle, 12);
    return {
      owner,
      x: m.x,
      y: m.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius: 11,
      life: 0.72,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < this.radius || this.x > WORLD_SIZE - this.radius || this.y < this.radius || this.y > WORLD_SIZE - this.radius) {
          this.dead = true;
          return;
        }
        const t = g.balls.find((b) => b !== this.owner && b.alive);
        if (t && Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          t._denjiShredTimer = 2.5;
          g.entities.push(spawnChainsawTetherEntity(this.owner, t));
          g.entities.push(spawnBloodOrb(this.owner, this.x, this.y, 4));
          g.spawnSparks(this.x, this.y, "#f97316", "#f8fafc");
          g.sound.playCritHit();
          this.dead = true;
        }
      },
      render(c) {
        if (!this.owner || !this.owner.alive) return;
        c.save();
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 3.5;
        c.setLineDash([7, 5]);
        c.beginPath();
        c.moveTo(this.owner.x, this.owner.y);
        c.lineTo(this.x, this.y);
        c.stroke();
        c.setLineDash([]);

        c.translate(this.x, this.y);
        c.rotate(this.angle + Math.PI * 0.5);
        drawChainsawArmBlade(c, 20, false, 0.65);
        c.restore();
      },
    };
  }

  // ---- Hero of Hell Opener ("VROOM-VAAAM!") ----
  BF.triggerHeroOfHellOpener = (b, g) => {
    b._hellGrindCd = 0;
    b._hellBarrageCd = 0.7;
    const enemy = g.balls.find((x) => x !== b && x.alive);
    if (enemy && Math.hypot(enemy.x - b.x, enemy.y - b.y) <= b.radius + enemy.radius + 115) {
      const dealt = g.applyDamage(enemy, 10);
      const ang = Math.atan2(enemy.y - b.y, enemy.x - b.x);
      enemy.vx += Math.cos(ang) * 280;
      enemy.vy += Math.sin(ang) * 280;
      enemy.flashTimer = 0.14;
      g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#ef4444", true, "VROOM-VAAAM!");
    }
    rt.addShake(0.22, 6);
  };

  // ---- Skill 1: Twin Chainsaw Launch (Primary +1 Ult Charge + Blood Siphon) ----
  const SKILL_CHAINSAW_REV = {
    name: "Twin Chainsaw Launch",
    cooldown: 2.8,
    onTick(ball, g, dt) {
      const enemy = g.balls.find((b) => b !== ball && b.alive);
      if (enemy && dt) {
        if (enemy._denjiShredTimer > 0) enemy._denjiShredTimer = Math.max(0, enemy._denjiShredTimer - dt);
        if (enemy._denjiBleedTimer > 0) {
          enemy._denjiBleedTimer -= dt;
          enemy._denjiBleedTick -= dt;
          if (enemy._denjiBleedTick <= 0) {
            enemy._denjiBleedTick = 0.5;
            const dealt = g.applyDamage(enemy, 1);
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 8, dealt, "#ef4444", false, "BLEED");
          }
        }
      }

      // Hero of Hell Active Mechanics: 4-Arm Close Grind Aura + Chain Barrage
      if (ball.ultTimer > 0 && dt && enemy) {
        ball._hellGrindCd = Math.max(0, (ball._hellGrindCd || 0) - dt);
        ball._hellBarrageCd = (ball._hellBarrageCd || 0) - dt;
        const d = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
        if (d <= ball.radius + enemy.radius + 20 && ball._hellGrindCd <= 0) {
          ball._hellGrindCd = 0.45;
          const dealt = g.applyDamage(enemy, 3);
          g.spawnSparks(enemy.x, enemy.y, "#ef4444", "#fbbf24");
          g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#ef4444", false, "4-ARM GRIND!");
          if (ball.hp < ball.maxHp) {
            ball.hp = Math.min(ball.maxHp, ball.hp + 2);
          }
        }
        if (ball._hellBarrageCd <= 0) {
          ball._hellBarrageCd = 1.6;
          const aim = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
          const state = { bloodSpawned: true, ultCharged: true };
          g.entities.push(spawnTwinSawbladeProjectile(ball, aim, 0, state, true));
          g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#ef4444", false, "HELL BARRAGE!");
        }
      }

      if (this._cd > 0 || !enemy) return false;
      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 330) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: inUlt ? "#ef4444" : "#f97316",
        renderCast(b, c, p, ang) {
          // Ripcord starter pull & revving exhaust sparks
          c.save();
          c.translate(b.x, b.y);
          c.strokeStyle = "#facc15";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(0, b.radius * 0.4);
          c.lineTo(0, b.radius * 0.4 + 14 * p);
          c.stroke();
          for (let i = 0; i < 4; i++) {
            const a = ang + (i - 1.5) * 0.45;
            const d = b.radius + 10 + p * 18;
            c.fillStyle = i % 2 === 0 ? "#fb923c" : "#fef08a";
            c.beginPath();
            c.arc(Math.cos(a) * d, Math.sin(a) * d, 3.2 * (1 - p * 0.4), 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        },
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const castState = { bloodSpawned: false, ultCharged: false };
          gg.entities.push(spawnTwinSawbladeProjectile(b, aim, -13, castState, inUlt));
          gg.entities.push(spawnTwinSawbladeProjectile(b, aim, 13, castState, inUlt));
          gg.entities.push(rt.spawnShockRing(b.x, b.y, inUlt ? "#ef4444" : "#f97316", 62, 0.22));
          gg.sound.playBallHit();
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Long-Charge 5s Wall-Bouncing Chainsaw Dash + Around-Self Saw Shred (No Auto-Lock, No Ult Charge) ----
  function spawnAroundSawStorm(owner, dashAng) {
    return {
      owner,
      dashAng,
      life: 5.0,
      maxLife: 5.0,
      tickCd: 0.04,
      healsLeft: 3,
      spin: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.spin += dt * 24;
        if (this.life <= 0 || !this.owner || !this.owner.alive || this.owner.denjiDashTimer <= 0) {
          this.dead = true;
          return;
        }
        // Maintain high-speed ricochet momentum across wall bounces for the full 5s
        const spd = Math.hypot(this.owner.vx, this.owner.vy) || 1;
        this.owner.vx = (this.owner.vx / spd) * 640;
        this.owner.vy = (this.owner.vy / spd) * 640;

        this.tickCd -= dt;
        if (this.tickCd <= 0) {
          this.tickCd = 0.36;
          const auraR = this.owner.radius + 32;
          for (const enemy of g.balls) {
            if (enemy === this.owner || !enemy.alive) continue;
            const d = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
            if (d <= auraR + enemy.radius) {
              const dealt = g.applyDamage(enemy, 2);
              enemy.flashTimer = 0.08;
              enemy._denjiShredTimer = 2.5;
              g.spawnSparks(enemy.x, enemy.y, "#ef4444", "#fbbf24");
              g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#fb923c", false, "SAW SHRED!");
              g.sound.playBallHit();
              if (this.healsLeft > 0 && this.owner.hp < this.owner.maxHp) {
                this.healsLeft--;
                const actual = Math.min(2, this.owner.maxHp - this.owner.hp);
                this.owner.hp += actual;
              }
            }
          }
        }
      },
      render(c) {
        if (!this.owner || !this.owner.alive) return;
        const fade = Math.min(1, this.life / 0.16);
        const r = this.owner.radius + 30;
        c.save();
        c.globalAlpha = 0.9 * fade;
        c.translate(this.owner.x, this.owner.y);

        // Glowing circular chainsaw-shred storm around Denji
        c.strokeStyle = "#f97316";
        c.shadowColor = "#ef4444";
        c.shadowBlur = 14;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.stroke();

        // Spinning jagged saw teeth around the outer shred ring
        c.rotate(this.spin);
        c.fillStyle = "#f8fafc";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 1.4;
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI * 2) / 12;
          c.save();
          c.rotate(a);
          c.beginPath();
          c.moveTo(r - 2, -4);
          c.lineTo(r + 8, 1);
          c.lineTo(r - 2, 5);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        }
        c.restore();
      },
    };
  }

  const SKILL_CHAIN_GRAPPLE = {
    name: "Revving Saw Dash",
    cooldown: 15.0,
    onTick(ball, g) {
      if (ball.denjiDashTimer > 0) return false;
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      // Lock straight forward along Denji's current heading (NO auto-lock onto enemy!)
      const lockedAng =
        Math.hypot(ball.vx, ball.vy) > 15 ? Math.atan2(ball.vy, ball.vx) : ball.facingAngle || 0;

      rt.beginCast(ball, {
        kind: "dash",
        duration: 0.78,
        color: "#fb923c",
        renderCast(b, c, p) {
          const ux = Math.cos(lockedAng);
          const uy = Math.sin(lockedAng);
          // Straight forward dash corridor & chevron arrows (no enemy tracking)
          c.save();
          c.translate(b.x, b.y);
          c.rotate(lockedAng);
          c.strokeStyle = "rgba(251, 146, 60, 0.85)";
          c.lineWidth = 3;
          c.setLineDash([10, 8]);
          c.beginPath();
          c.moveTo(b.radius + 8, 0);
          c.lineTo(b.radius + 140 * (0.35 + 0.65 * p), 0);
          c.stroke();
          c.setLineDash([]);

          // Revving sparks around Denji while charging
          for (let i = 0; i < 6; i++) {
            const a = p * 12 + (i * Math.PI) / 3;
            const d = b.radius + 10 + Math.sin(p * 18 + i) * 5;
            c.fillStyle = i % 2 === 0 ? "#fef08a" : "#ef4444";
            c.beginPath();
            c.arc(Math.cos(a) * d, Math.sin(a) * d, 3.2, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();

          // Forward arrow head
          const tip = b.radius + 140 * (0.35 + 0.65 * p);
          c.save();
          c.translate(b.x + ux * tip, b.y + uy * tip);
          c.rotate(lockedAng);
          c.fillStyle = "#f97316";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(12, 0);
          c.lineTo(-6, -8);
          c.lineTo(-6, 8);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        },
        fire(b, gg) {
          const ux = Math.cos(lockedAng);
          const uy = Math.sin(lockedAng);
          b.denjiDashTimer = 5.0;
          b.vx = ux * 640;
          b.vy = uy * 640;
          gg.entities.push(rt.spawnShockRing(b.x, b.y, "#f97316", 92, 0.32));
          gg.entities.push(spawnAroundSawStorm(b, lockedAng));
          gg.spawnDamageText(b.x, b.y - b.radius - 14, 0, "#fb923c", false, "5S SAW RUSH!");
          gg.sound.playCritHit();
        },
      });
      return true;
    },
  };

  // ---- Weapon Drawer fallback (unused when weapon: null) ----
  BF.WEAPON_DRAWERS.chainsaw_blade = (ball, c) => {
    drawChainsawArmBlade(c, 32, ball.ultTimer > 0, 1);
  };

  // ---- Costume Drawer: Denji / Chainsaw Man ----
  // Authentic Chainsaw Devil Hybrid helmet: angular burnt-orange/crimson mechanical cowling, black top handlebar,
  // side exhaust vents, glowing yellow/crimson mechanical slit visors, interlock shark fangs, and Public Safety tie.
  BF.COSTUME_DRAWERS.denji = (ball, r, c) => {
    const hell = ball.ultTimer > 0;
    const tick = Math.floor(performance.now() * 0.05) % 2;
    const t = performance.now() * 0.001;

    // 2 Fixed Forearm Chainsaw Arms at lower sides forming / ( ) \ (4 Arms in Hero of Hell!)
    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * r * 0.88, r * 0.42);
      c.rotate(s * Math.PI * 0.72);
      // Forearm connector sleeve
      c.fillStyle = hell ? "#18181b" : "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.roundRect(-5, 6, 10, 9, 3);
      c.fill();
      c.stroke();
      drawChainsawArmBlade(c, 28, hell, 0.78);
      c.restore();

      if (hell) {
        c.save();
        c.translate(s * r * 0.98, r * 0.04);
        c.rotate(s * Math.PI * 0.52);
        drawChainsawArmBlade(c, 26, true, 0.72);
        c.restore();
      }
    }

    // Hero of Hell: flowing dark-crimson intestinal scarf behind body + 4-arm black devil armor spikes
    if (hell) {
      c.save();
      c.lineCap = "round";
      for (const s of [-1, 1]) {
        const w = Math.sin(t * 6 + s) * r * 0.12;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = r * 0.24;
        c.beginPath();
        c.moveTo(s * r * 0.5, r * 0.58);
        c.quadraticCurveTo(s * r * 1.28, r * 0.45 + w, s * r * 1.44, -r * 0.05 - w);
        c.stroke();
        c.strokeStyle = "#be123c";
        c.lineWidth = r * 0.16;
        c.stroke();
      }
      c.restore();
    }

    // Iconic Black Chainsaw Handlebar arching over top of helmet (behind center blade)
    c.save();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 6.5;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-r * 0.44, -r * 0.78);
    c.lineTo(-r * 0.36, -r * 1.08);
    c.lineTo(r * 0.36, -r * 1.08);
    c.lineTo(r * 0.44, -r * 0.78);
    c.stroke();
    c.strokeStyle = "#27272a";
    c.lineWidth = 3.2;
    c.stroke();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    // 1. Lower Body: Public Safety White Shirt & Black Tie (Base) or Jet-Black Armored Torso (Hero of Hell)
    c.fillStyle = hell ? "#09090b" : "#f8fafc";
    c.fillRect(-r, r * 0.54, r * 2, r * 0.56);

    if (!hell) {
      // White shirt collar & black tie
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.fillStyle = "#e2e8f0";
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * r * 0.05, r * 0.62);
        c.lineTo(s * r * 0.38, r * 0.58);
        c.lineTo(s * r * 0.22, r * 0.82);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.fillStyle = "#0f172a";
      c.beginPath();
      c.moveTo(-r * 0.08, r * 0.62);
      c.lineTo(r * 0.08, r * 0.62);
      c.lineTo(r * 0.12, r * 1.05);
      c.lineTo(-r * 0.12, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();
    } else {
      // Hero of Hell intestinal scarf wrapped across chest
      c.strokeStyle = COLORS.ink;
      c.lineWidth = r * 0.22;
      c.beginPath();
      c.moveTo(-r * 0.85, r * 0.68);
      c.quadraticCurveTo(0, r * 0.84, r * 0.85, r * 0.68);
      c.stroke();
      c.strokeStyle = "#be123c";
      c.lineWidth = r * 0.14;
      c.stroke();
    }

    // Yellow triangular rip-cord pull tab on chest
    c.fillStyle = "#facc15";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-r * 0.11, r * 0.92);
    c.lineTo(r * 0.11, r * 0.92);
    c.lineTo(0, r * 0.74);
    c.closePath();
    c.fill();
    c.stroke();

    // 2. Angular Mechanical Devil Helmet Cowling (Covers upper & middle head down to the jaw)
    const hg = c.createLinearGradient(0, -r, 0, r * 0.6);
    if (hell) {
      hg.addColorStop(0, "#3f3f46");
      hg.addColorStop(0.5, "#18181b");
      hg.addColorStop(1, "#09090b");
    } else {
      hg.addColorStop(0, "#f97316");
      hg.addColorStop(0.55, "#c2410c");
      hg.addColorStop(1, "#7c2d12");
    }
    c.fillStyle = hg;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r, -r);
    c.lineTo(r, -r);
    c.lineTo(r, r * 0.28);
    c.lineTo(r * 0.58, r * 0.62);
    c.lineTo(-r * 0.58, r * 0.62);
    c.lineTo(-r, r * 0.28);
    c.closePath();
    c.fill();
    c.stroke();

    // Side mechanical air-intake vents & rivets on helmet cheeks
    c.strokeStyle = hell ? "#52525b" : "#431407";
    c.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const vy = -r * 0.36 + k * r * 0.11;
        c.beginPath();
        c.moveTo(s * r * 0.72, vy);
        c.lineTo(s * r * 0.92, vy + r * 0.05);
        c.stroke();
      }
    }

    // 3. Recessed Black Visor Channels + Sharp Glowing Mechanical Slit Eyes (NO round eyeballs!)
    for (const s of [-1, 1]) {
      // Dark armored eye socket recess
      c.fillStyle = "#09090b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(s * r * 0.14, -r * 0.18);
      c.lineTo(s * r * 0.66, -r * 0.36);
      c.lineTo(s * r * 0.6, -r * 0.12);
      c.lineTo(s * r * 0.18, -r * 0.04);
      c.closePath();
      c.fill();
      c.stroke();

      // Glowing narrow mechanical visor slit inside socket
      c.fillStyle = hell ? "#ef4444" : "#fef08a";
      c.shadowColor = hell ? "#dc2626" : "#facc15";
      c.shadowBlur = 8;
      c.beginPath();
      c.moveTo(s * r * 0.18, -r * 0.15);
      c.lineTo(s * r * 0.58, -r * 0.29);
      c.lineTo(s * r * 0.54, -r * 0.16);
      c.lineTo(s * r * 0.2, -r * 0.08);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
    }

    // 4. Savage Metallic Maw with Long Interlocking Razor Fangs
    c.fillStyle = "#18181b";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.68, r * 0.04);
    c.quadraticCurveTo(0, r * 0.14, r * 0.68, r * 0.04);
    c.lineTo(r * 0.52, r * 0.54);
    c.quadraticCurveTo(0, r * 0.62, -r * 0.52, r * 0.54);
    c.closePath();
    c.fill();
    c.stroke();

    c.save();
    c.clip();
    c.fillStyle = "#f8fafc";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.5;
    const nTeeth = 8;
    for (let i = 0; i < nTeeth; i++) {
      const x0 = -0.64 + (i * 1.28) / nTeeth;
      const x1 = x0 + 1.28 / nTeeth;
      const xm = (x0 + x1) * 0.5;
      // Upper long fang
      c.beginPath();
      c.moveTo(x0 * r, r * 0.02);
      c.lineTo(xm * r, r * 0.36);
      c.lineTo(x1 * r, r * 0.02);
      c.closePath();
      c.fill();
      c.stroke();
      // Lower interlocking fang
      c.beginPath();
      c.moveTo(x0 * r + r * 0.03, r * 0.6);
      c.lineTo(xm * r + r * 0.03, r * 0.28);
      c.lineTo(x1 * r + r * 0.03, r * 0.6);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();

    // Re-stroke mouth rim cleanly
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.68, r * 0.04);
    c.quadraticCurveTo(0, r * 0.14, r * 0.68, r * 0.04);
    c.lineTo(r * 0.52, r * 0.54);
    c.quadraticCurveTo(0, r * 0.62, -r * 0.52, r * 0.54);
    c.closePath();
    c.stroke();
    c.restore();

    // 5. Center Forehead Chainsaw Blade & Engine Cowling
    c.save();
    c.lineJoin = "round";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    const bw = r * 0.135;
    c.fillStyle = "#cbd5e1";
    c.beginPath();
    c.moveTo(-bw, -r * 0.68);
    c.lineTo(-bw, -r * 1.56);
    c.arc(0, -r * 1.56, bw, Math.PI, 0);
    c.lineTo(bw, -r * 0.68);
    c.closePath();
    c.fill();
    c.stroke();

    // Crimson blood groove on forehead blade
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -r * 0.78);
    c.lineTo(0, -r * 1.52);
    c.stroke();

    // Reciprocating saw teeth
    c.fillStyle = "#ffffff";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.2;
    const step = r * 0.12;
    for (let y = -r * 1.58 + tick * step * 0.5; y < -r * 0.82; y += step) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * bw, y);
        c.lineTo(s * (bw + r * 0.095), y + step * 0.26);
        c.lineTo(s * bw, y + step * 0.66);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }

    // Forehead housing ridge where blade erupts from the skull
    c.fillStyle = hell ? "#27272a" : "#9a3412";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-r * 0.24, -r * 0.52);
    c.lineTo(-r * 0.2, -r * 0.88);
    c.lineTo(r * 0.2, -r * 0.88);
    c.lineTo(r * 0.24, -r * 0.52);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  };

BF.CHARACTER_ROSTER.denji = {
    id: "denji",
    name: "CHAINSAW DEVIL",
    shortName: "CHAINSAW",
    title: "Public Safety Devil Hunter • Hero of Hell",
    role: "BERSERKER • BLOOD LIFESTEAL",
    color: "#ea580c",
    radius: 28,
    speed: 362,
    maxHp: 590,
    damage: [6, 9],
    mass: 1.05,
    costume: "denji",
    weapon: null,
    ult: "hero_of_hell",
    ultName: "HERO OF HELL (BLACK CHAINSAW)",
    ultDesc: "Awakens 4-arm Black Chainsaw Devil form for 8s! Deals automatic close-range 4-Arm Grind damage with Blood Lifesteal and fires Hellish Chain Barrage!",
    skillName: "TWIN CHAINSAW LAUNCH & REVVING SAW DASH",
    skillDesc: "Launches twin forward-slicing Chainsaw Blades that bleed enemies & siphon Blood Orbs, or charges a straight non-homing dash that shreds everything around Denji!",
    skills: [SKILL_CHAINSAW_REV, SKILL_CHAIN_GRAPPLE],
  };
})();
