// ============================================================
//  SUNG JIN-WOO (SHADOW MONARCH)
//  Solo Leveling — Kamish's Wrath, Ruler's Authority & Monarch's Domain
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

  // ---- Shadow Dagger Projectile (Kasaka's Venom Fang & Kamish's Wrath) ----
  function spawnShadowDagger(owner, target, angle, isVenom, castState, inUlt) {
    const speed = inUlt ? 640 : 570;
    const m = rt.castMuzzle(owner, angle, 14);
    return {
      owner,
      target,
      x: m.x,
      y: m.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius: 10,
      life: 1.15,
      maxLife: 1.15,
      isVenom,
      castState,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        // Subtle homing curve toward target
        if (this.target && this.target.alive) {
          const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
          let diff = desired - this.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.angle += Math.max(-dt * 2.8, Math.min(dt * 2.8, diff));
          const spd = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(this.angle) * spd;
          this.vy = Math.sin(this.angle) * spd;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Reflect/expire on wall
        if (this.x < this.radius || this.x > WORLD_SIZE - this.radius || this.y < this.radius || this.y > WORLD_SIZE - this.radius) {
          g.spawnSparks(this.x, this.y, isVenom ? "#38bdf8" : "#a855f7", "#090514");
          this.dead = true;
          return;
        }

        const t = g.balls.find((b) => b !== this.owner && b.alive);
        if (!t) return;
        if (Math.hypot(t.x - this.x, t.y - this.y) <= t.radius + this.radius) {
          const dmg = inUlt ? Math.round(6 + rt.rng() * 2) : Math.round(5 + rt.rng());
          const dealt = g.applyDamage(t, dmg);
          t.flashTimer = 0.1;
          t.squash = 0.78;
          t._shadowMarkedTimer = 3.0;
          t._shadowVenomTimer = 2.0;
          t._shadowVenomTick = 0.5;
          g.spawnSparks(this.x, this.y, isVenom ? "#38bdf8" : "#c084fc", "#090514");
          g.spawnDamageText(
            t.x,
            t.y - t.radius - 12,
            dealt,
            isVenom ? "#38bdf8" : "#c084fc",
            false,
            isVenom ? "KASAKA VENOM!" : "SHADOW DAGGER!"
          );
          g.sound.playBallHit();
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
        c.rotate(this.angle);
        const glow = this.isVenom ? "#38bdf8" : "#a855f7";
        c.shadowColor = glow;
        c.shadowBlur = 10;

        // Trailing shadow streak
        c.strokeStyle = this.isVenom ? "rgba(56, 189, 248, 0.5)" : "rgba(168, 85, 247, 0.5)";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-24, 0);
        c.lineTo(-4, 0);
        c.stroke();

        // Curved dagger blade
        c.fillStyle = "#090514";
        c.strokeStyle = glow;
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(-8, -3.5);
        c.quadraticCurveTo(6, -5, 16, 0);
        c.quadraticCurveTo(5, 4.5, -8, 3.5);
        c.closePath();
        c.fill();
        c.stroke();

        // Bright core vein
        c.strokeStyle = "#f3e8ff";
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(-4, 0);
        c.lineTo(12, 0);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Monarch's Domain (Animated Shadow Floor + Rune Ring + Slow/Haste) ----
  function spawnMonarchsDomain(owner) {
    return {
      owner,
      x: owner.x,
      y: owner.y,
      maxRadius: 215,
      life: 6.5,
      maxLife: 6.5,
      spin: 0,
      kaiselSpawned: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.spin += dt * 0.9;
        // Domain gently follows Jin-Woo
        if (this.owner && this.owner.alive) {
          this.x += (this.owner.x - this.x) * Math.min(1, dt * 2.5);
          this.y += (this.owner.y - this.y) * Math.min(1, dt * 2.5);
        }

        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (enemy && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.maxRadius) {
          g.addEffect(enemy, "slow", 0.25, { factor: 0.85 });
        }

        if (this.life <= 0) {
          if (!this.kaiselSpawned && this.owner && this.owner.alive) {
            this.kaiselSpawned = true;
            g.entities.push(spawnKaiselDragonFlyby(this.owner, this.x, this.y));
          }
          this.dead = true;
        }
      },
      render(c) {
        const progress = 1 - this.life / this.maxLife;
        const expand = Math.min(1, progress / 0.12);
        const fadeOut = this.life < 0.7 ? Math.max(0, this.life / 0.7) : 1;
        const rad = this.maxRadius * (0.35 + 0.65 * expand);
        const t = performance.now() * 0.001;

        c.save();
        c.globalAlpha = 0.88 * fadeOut;
        c.translate(this.x, this.y);

        // Deep shadow pool
        const grad = c.createRadialGradient(0, 0, rad * 0.1, 0, 0, rad);
        grad.addColorStop(0, "rgba(15, 5, 32, 0.52)");
        grad.addColorStop(0.65, "rgba(88, 28, 135, 0.34)");
        grad.addColorStop(0.92, "rgba(56, 189, 248, 0.18)");
        grad.addColorStop(1, "rgba(15, 5, 32, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

        // Outer rotating Monarch magic circle
        c.save();
        c.rotate(this.spin);
        c.strokeStyle = "rgba(168, 85, 247, 0.55)";
        c.lineWidth = 2.4;
        c.setLineDash([14, 9]);
        c.beginPath();
        c.arc(0, 0, rad * 0.88, 0, Math.PI * 2);
        c.stroke();

        // 6-point Monarch rune vertices
        c.setLineDash([]);
        c.strokeStyle = "rgba(56, 189, 248, 0.35)";
        c.lineWidth = 1.6;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const x1 = Math.cos(a) * rad * 0.85;
          const y1 = Math.sin(a) * rad * 0.85;
          const x2 = Math.cos(a + Math.PI * 0.666) * rad * 0.85;
          const y2 = Math.sin(a + Math.PI * 0.666) * rad * 0.85;
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
        }
        c.stroke();
        c.restore();

        // Inner pulsing ring
        c.save();
        c.rotate(-this.spin * 1.4);
        c.strokeStyle = "rgba(192, 132, 252, 0.48)";
        c.lineWidth = 2;
        c.setLineDash([8, 12]);
        c.beginPath();
        c.arc(0, 0, rad * 0.52, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // Floating shadow embers inside domain
        for (let i = 0; i < 8; i++) {
          const ang = t * 0.9 + i * (Math.PI / 4);
          const dist = rad * (0.28 + 0.55 * ((i * 37) % 10) / 10);
          const px = Math.cos(ang) * dist;
          const py = Math.sin(ang) * dist + Math.sin(t * 4 + i) * 6;
          c.fillStyle = i % 2 === 0 ? "rgba(168, 85, 247, 0.7)" : "rgba(56, 189, 248, 0.65)";
          c.beginPath();
          c.arc(px, py, 2.5 + Math.sin(t * 5 + i) * 1, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- 3 Distinct Shadow Marshals: Igris (Striker), Tank (Vanguard), Beru (Assassin) ----
  function spawnShadowSoldier(owner, variant) {
    const startAng =
      variant === "igris" ? -Math.PI * 0.35 : variant === "tank" ? Math.PI : Math.PI * 0.35;
    const sx = owner.x + Math.cos(startAng) * (owner.radius + 26);
    const sy = owner.y + Math.sin(startAng) * (owner.radius + 26);

    return {
      owner,
      variant,
      x: sx,
      y: sy,
      vx: Math.cos(startAng) * 110,
      vy: Math.sin(startAng) * 110,
      radius: variant === "tank" ? 18 : variant === "igris" ? 14 : 13,
      life: 6.5,
      maxLife: 6.5,
      actionCd: variant === "igris" ? 0.35 : variant === "tank" ? 0.6 : 0.45,
      facing: startAng,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner || !this.owner.alive) {
          g.spawnSparks(this.x, this.y, "#a855f7", "#090514");
          this.dead = true;
          return;
        }
        this.actionCd = Math.max(0, this.actionCd - dt);
        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (!enemy) return;

        if (this.variant === "tank") {
          // VANGUARD: intercepts enemy projectiles & body-slams enemy
          for (const e of g.entities) {
            if (
              e !== this &&
              !e.dead &&
              e.owner &&
              e.owner !== this.owner &&
              typeof e.vx === "number" &&
              typeof e.radius === "number"
            ) {
              const dProj = Math.hypot(e.x - this.x, e.y - this.y);
              if (dProj <= this.radius + e.radius + 14) {
                e.dead = true;
                g.spawnSparks(e.x, e.y, "#38bdf8", "#a855f7");
                g.spawnDamageText(this.x, this.y - this.radius - 10, "BLOCKED!", "#38bdf8", false, "TANK GUARD!");
                g.sound.playBallHit();
              }
            }
          }
          // Position between owner and enemy or charge enemy
          const midX = this.owner.x * 0.35 + enemy.x * 0.65;
          const midY = this.owner.y * 0.35 + enemy.y * 0.65;
          const dx = midX - this.x;
          const dy = midY - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          this.vx += ((dx / dist) * 240 - this.vx) * Math.min(1, dt * 5.5);
          this.vy += ((dy / dist) * 240 - this.vy) * Math.min(1, dt * 5.5);

          const dEnemy = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dEnemy <= enemy.radius + this.radius + 10 && this.actionCd <= 0) {
            this.actionCd = 1.5;
            const nx = (enemy.x - this.x) / (dEnemy || 1);
            const ny = (enemy.y - this.y) / (dEnemy || 1);
            const dealt = g.applyDamage(enemy, Math.round(5 + rt.rng() * 2));
            enemy.flashTimer = 0.1;
            enemy.vx += nx * 240;
            enemy.vy += ny * 240;
            g.spawnSparks(enemy.x, enemy.y, "#60a5fa", "#090514");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#60a5fa", false, "TANK SLAM!");
            g.sound.playBallHit();
          }
        } else if (this.variant === "igris") {
          // STRIKER: fast straight dash slashes with cyan/crimson greatsword
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          this.vx += (nx * 320 - this.vx) * Math.min(1, dt * 7);
          this.vy += (ny * 320 - this.vy) * Math.min(1, dt * 7);

          if (dist <= enemy.radius + this.radius + 26 && this.actionCd <= 0) {
            this.actionCd = 1.35;
            const dealt = g.applyDamage(enemy, Math.round(6 + rt.rng() * 2));
            enemy.flashTimer = 0.11;
            enemy.vx += nx * 150;
            enemy.vy += ny * 150;
            g.entities.push(spawnMutilateXSlashVisual(enemy.x, enemy.y, Math.atan2(ny, nx)));
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#ef4444");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#c084fc", false, "IGRIS SLASH!");
            g.sound.playBallHit();
            this.vx = -nx * 165 - ny * 85;
            this.vy = -ny * 165 + nx * 85;
          }
        } else {
          // BERU (ASSASSIN): flanks laterally around enemy with rapid claw strikes + slow
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          // Tangential flank bias
          const flank = dist > 70 ? 0.45 : 0.15;
          this.vx += ((nx - ny * flank) * 355 - this.vx) * Math.min(1, dt * 8);
          this.vy += ((ny + nx * flank) * 355 - this.vy) * Math.min(1, dt * 8);

          if (dist <= enemy.radius + this.radius + 20 && this.actionCd <= 0) {
            this.actionCd = 1.05;
            const dealt = g.applyDamage(enemy, Math.round(4 + rt.rng()));
            enemy.flashTimer = 0.08;
            g.addEffect(enemy, "slow", 0.55, { factor: 0.78 });
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#dc2626");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#38bdf8", false, "BERU CLAW!");
            g.sound.playBallHit();
            this.vx = -nx * 140 + ny * 130;
            this.vy = -ny * 140 - nx * 130;
          }
        }

        this.facing = Math.atan2(this.vy, this.vx);
        this.x = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.x + this.vx * dt));
        this.y = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.y + this.vy * dt));
      },
      render(c) {
        const t = performance.now() * 0.001;
        const fade = this.life < 0.6 ? Math.max(0, this.life / 0.6) : 1;
        c.save();
        c.globalAlpha = 0.94 * fade;
        c.translate(this.x, this.y);

        if (this.variant === "igris") {
          // IGRIS: Knight helm, flowing crimson plume, cyan glowing armor core, greatsword
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 10;

          // Flowing crimson-red helmet plume
          c.fillStyle = "#dc2626";
          c.strokeStyle = "#450a0a";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-2, -12);
          c.quadraticCurveTo(-18, -22 + Math.sin(t * 10) * 3, -24, -4 + Math.cos(t * 9) * 3);
          c.quadraticCurveTo(-14, -10, -2, -6);
          c.closePath();
          c.fill();
          c.stroke();

          // Dark-indigo shadow cloak/body
          c.fillStyle = "#090b1a";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, -13);
          c.lineTo(11, -3);
          c.lineTo(9, 13);
          c.lineTo(-9, 13);
          c.lineTo(-11, -3);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing cyan rib-lines on chest
          c.strokeStyle = "#7dd3fc";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(-5, 0); c.lineTo(0, 3); c.lineTo(5, 0);
          c.moveTo(-4, 5); c.lineTo(0, 8); c.lineTo(4, 5);
          c.stroke();

          // Knight visor slit
          c.fillStyle = "#38bdf8";
          c.beginPath();
          c.moveTo(-4, -7);
          c.lineTo(0, -5);
          c.lineTo(4, -7);
          c.lineTo(0, -9);
          c.closePath();
          c.fill();

          // Demon King's / Shadow Greatsword angled beside Igris
          c.save();
          c.rotate(this.facing + 0.5);
          c.fillStyle = "#1e1b4b";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(6, -3);
          c.lineTo(26, 0);
          c.lineTo(6, 3);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        } else if (this.variant === "tank") {
          // TANK: Massive shadow bear with flaming white-purple mane & glowing X-scar
          c.shadowColor = "#7c3aed";
          c.shadowBlur = 12;

          // White-purple flaming mane
          c.fillStyle = "#e9d5ff";
          for (let i = 0; i < 5; i++) {
            const fx = (i - 2) * 5;
            const fy = -16 - Math.sin(t * 10 + i) * 3;
            c.beginPath();
            c.moveTo(fx - 4, -10);
            c.lineTo(fx, fy);
            c.lineTo(fx + 4, -10);
            c.closePath();
            c.fill();
          }

          // Bear ears
          c.fillStyle = "#0b0716";
          c.strokeStyle = "#818cf8";
          c.lineWidth = 1.8;
          for (const s of [-1, 1]) {
            c.beginPath();
            c.arc(s * 11, -11, 5, 0, Math.PI * 2);
            c.fill();
            c.stroke();
          }

          // Broad bear torso/head
          c.fillStyle = "#090612";
          c.strokeStyle = "#6366f1";
          c.lineWidth = 2.4;
          c.beginPath();
          c.arc(0, 0, this.radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();

          // Glowing X-scar across chest
          c.strokeStyle = "#60a5fa";
          c.lineWidth = 2.6;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(-8, 3); c.lineTo(8, 13);
          c.moveTo(8, 3); c.lineTo(-8, 13);
          c.stroke();

          // Glowing purple bear eyes + fangs
          c.fillStyle = "#c084fc";
          c.beginPath();
          c.arc(-6, -4, 2.3, 0, Math.PI * 2);
          c.arc(6, -4, 2.3, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#e2e8f0";
          c.beginPath();
          c.moveTo(-5, 2); c.lineTo(-3.5, -2); c.lineTo(-2, 2);
          c.moveTo(2, 2); c.lineTo(3.5, -2); c.lineTo(5, 2);
          c.fill();
        } else {
          // BERU: Ant-King shadow assassin with glowing cyan wings, mandibles & crimson claws
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 11;

          // Fluttering translucent cyan insect wings
          const flap = Math.sin(t * 28) * 0.22;
          c.fillStyle = "rgba(56, 189, 248, 0.35)";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.4;
          for (const s of [-1, 1]) {
            c.save();
            c.rotate(s * (0.55 + flap));
            c.beginPath();
            c.ellipse(s * 12, -4, 11, 4.5, s * 0.25, 0, Math.PI * 2);
            c.fill();
            c.stroke();
            c.restore();
          }

          // Jagged ant exoskeleton
          c.fillStyle = "#060812";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, -14);
          c.lineTo(10, -4);
          c.lineTo(7, 11);
          c.lineTo(0, 14);
          c.lineTo(-7, 11);
          c.lineTo(-10, -4);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing cyan eyes & sharp mandibles
          c.fillStyle = "#7dd3fc";
          c.beginPath();
          c.moveTo(-6, -6); c.lineTo(-2, -3); c.lineTo(-5, -2); c.closePath();
          c.moveTo(6, -6); c.lineTo(2, -3); c.lineTo(5, -2); c.closePath();
          c.fill();

          // Crimson-tipped claws
          c.strokeStyle = "#f43f5e";
          c.lineWidth = 2.4;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(-9, 4); c.lineTo(-14, 9);
          c.moveTo(9, 4); c.lineTo(14, 9);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Burning Shadow-Fire AoE Zone left by Kaisel's Breath ----
  function spawnKaiselBurnZone(owner, x, y) {
    return {
      owner,
      x,
      y,
      radius: 95,
      life: 3.5,
      maxLife: 3.5,
      tickCd: 0.2,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        this.tickCd -= dt;
        if (this.tickCd <= 0) {
          this.tickCd = 0.5;
          const enemy = g.balls.find((b) => b !== this.owner && b.alive);
          if (enemy && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius * 0.6) {
            const dealt = g.applyDamage(enemy, 3);
            enemy._kaiselBurnTimer = 2.0;
            enemy._kaiselBurnTick = 0.5;
            enemy._kaiselBurnOwner = this.owner;
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#7c3aed");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 10, dealt, "#38bdf8", false, "KAISEL FLAME!");
          }
        }
      },
      render(c) {
        const t = performance.now() * 0.001;
        const fade = this.life < 0.7 ? Math.max(0, this.life / 0.7) : 1;
        c.save();
        c.globalAlpha = 0.85 * fade;
        c.translate(this.x, this.y);

        const grad = c.createRadialGradient(0, 0, 8, 0, 0, this.radius);
        grad.addColorStop(0, "rgba(56, 189, 248, 0.42)");
        grad.addColorStop(0.55, "rgba(124, 58, 237, 0.34)");
        grad.addColorStop(1, "rgba(15, 23, 42, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();

        // Lick of blue-violet shadow flames around the scorched area
        for (let i = 0; i < 9; i++) {
          const a = (i * Math.PI * 2) / 9 + t * 0.8;
          const r = this.radius * (0.45 + 0.38 * ((i * 3) % 4) / 3);
          const fx = Math.cos(a) * r;
          const fy = Math.sin(a) * r;
          const fh = 12 + Math.sin(t * 11 + i) * 5;
          c.fillStyle = i % 2 === 0 ? "rgba(56, 189, 248, 0.68)" : "rgba(168, 85, 247, 0.65)";
          c.beginPath();
          c.moveTo(fx - 6, fy);
          c.quadraticCurveTo(fx, fy - fh, fx + 6, fy);
          c.closePath();
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- Kaisel (Shadow Wyvern / Dragon) Swoop & Center Flame Breath Finale ----
  function spawnKaiselDragonFlyby(owner, centerX, centerY) {
    const targetX = Math.max(120, Math.min(WORLD_SIZE - 120, (centerX + WORLD_SIZE * 0.5) * 0.5));
    const targetY = Math.max(120, Math.min(WORLD_SIZE - 120, (centerY + WORLD_SIZE * 0.5) * 0.5));
    return {
      owner,
      targetX,
      targetY,
      x: -90,
      y: targetY - 120,
      life: 1.45,
      maxLife: 1.45,
      breathed: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        // Sweeping diagonal flight across the arena
        this.x = -90 + (WORLD_SIZE + 180) * p;
        this.y = this.targetY - 130 + Math.sin(p * Math.PI) * 95;

        if (p >= 0.42 && !this.breathed) {
          this.breathed = true;
          g.entities.push(rt.spawnShockRing(this.targetX, this.targetY, "#38bdf8", 130, 0.42));
          g.entities.push(rt.spawnShockRing(this.targetX, this.targetY, "#a855f7", 95, 0.32));
          g.entities.push(spawnKaiselBurnZone(this.owner, this.targetX, this.targetY));
          g.spawnSparks(this.targetX, this.targetY, "#38bdf8", "#a855f7");
          rt.addShake(0.24, 6);
          g.sound.playUlt();

          const enemy = g.balls.find((b) => b !== this.owner && b.alive);
          if (enemy && Math.hypot(enemy.x - this.targetX, enemy.y - this.targetY) <= 115 + enemy.radius) {
            const dealt = g.applyDamage(enemy, 10);
            enemy.flashTimer = 0.14;
            enemy._kaiselBurnTimer = 2.2;
            enemy._kaiselBurnTick = 0.5;
            enemy._kaiselBurnOwner = this.owner;
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#38bdf8", true, "KAISEL BREATH!");
          }
        }

        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const t = performance.now() * 0.001;
        const flap = Math.sin(t * 18) * 18;
        c.save();
        c.translate(this.x, this.y);
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 16;

        // Dragon flame breath beam down toward targetX/targetY during mid-flight
        const p = 1 - Math.max(0, this.life / this.maxLife);
        if (p >= 0.36 && p <= 0.72) {
          c.save();
          const dx = this.targetX - this.x;
          const dy = this.targetY - this.y;
          const grad = c.createLinearGradient(18, 4, dx, dy);
          grad.addColorStop(0, "rgba(224, 242, 254, 0.95)");
          grad.addColorStop(0.45, "rgba(56, 189, 248, 0.8)");
          grad.addColorStop(1, "rgba(124, 58, 237, 0.45)");
          c.strokeStyle = grad;
          c.lineWidth = 22;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(24, 4);
          c.lineTo(dx, dy);
          c.stroke();
          c.restore();
        }

        // Giant shadow dragon wings (black outer + electric cyan inner flame)
        for (const s of [-1, 1]) {
          c.fillStyle = "#060812";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(-4, 0);
          c.quadraticCurveTo(-22, s * (42 + flap), -58, s * (58 + flap));
          c.quadraticCurveTo(-36, s * (24 + flap * 0.4), -26, s * 6);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "rgba(56, 189, 248, 0.55)";
          c.beginPath();
          c.moveTo(-8, s * 4);
          c.quadraticCurveTo(-24, s * (32 + flap * 0.8), -46, s * (44 + flap * 0.8));
          c.quadraticCurveTo(-28, s * (16 + flap * 0.3), -16, s * 4);
          c.closePath();
          c.fill();
        }

        // Dragon tail & slender neck/head
        c.fillStyle = "#05070e";
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(-48, 6);
        c.quadraticCurveTo(-18, -6, 12, -2);
        c.lineTo(30, -8);
        c.lineTo(22, 4);
        c.quadraticCurveTo(-8, 10, -48, 6);
        c.closePath();
        c.fill();
        c.stroke();

        // Cyan glowing chest core & dragon eye
        c.fillStyle = "#7dd3fc";
        c.beginPath();
        c.arc(20, -4, 2.6, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  BF.triggerAriseDomain = (b, g) => {
    g.entities.push(spawnMonarchsDomain(b));
    g.entities.push(spawnShadowSoldier(b, "igris"));
    g.entities.push(spawnShadowSoldier(b, "tank"));
    g.entities.push(spawnShadowSoldier(b, "beru"));
  };

  // ---- Skill 1: Shadow Daggers (Kasaka's Venom & Kamish's Wrath — +1 Ult max/cast) ----
  const SKILL_SHADOW_DAGGERS = {
    name: "Shadow Daggers",
    cooldown: 2.8,
    onTick(ball, g, dt) {
      const enemy = g.balls.find((b) => b !== ball && b.alive);
      if (enemy) {
        // Process passive Shadow Venom & Kaisel Burn ticks on enemy
        if (enemy._shadowMarkedTimer > 0) enemy._shadowMarkedTimer = Math.max(0, enemy._shadowMarkedTimer - dt);
        if (enemy._shadowVenomTimer > 0) {
          enemy._shadowVenomTimer -= dt;
          enemy._shadowVenomTick -= dt;
          if (enemy._shadowVenomTick <= 0) {
            enemy._shadowVenomTick = 0.5;
            const dealt = g.applyDamage(enemy, 1);
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 8, dealt, "#38bdf8", false, "VENOM");
          }
        }
        if (enemy._kaiselBurnTimer > 0) {
          enemy._kaiselBurnTimer -= dt;
          enemy._kaiselBurnTick -= dt;
          if (enemy._kaiselBurnTick <= 0) {
            enemy._kaiselBurnTick = 0.5;
            const dealt = g.applyDamage(enemy, 2);
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#a855f7");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 10, dealt, "#38bdf8", false, "DRAGON BURN!");
          }
        }
      }

      if (this._cd > 0 || !enemy) return false;
      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 340) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.16,
        color: "#a855f7",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const castState = { ultCharged: false };
          gg.entities.push(spawnShadowDagger(b, t, aim - 0.18, false, castState, inUlt));
          gg.entities.push(spawnShadowDagger(b, t, aim + 0.18, true, castState, inUlt));
          gg.entities.push(rt.spawnShockRing(b.x, b.y, "#a855f7", 54, 0.2));
        },
      });
      return true;
    },
    onHit(ball, target, g) {
      if (target._shadowMarkedTimer > 0) {
        target._shadowMarkedTimer = 0;
        const bonus = g.applyDamage(target, 3);
        g.entities.push(spawnMutilateXSlashVisual(target.x, target.y, Math.atan2(target.y - ball.y, target.x - ball.x)));
        g.spawnDamageText(target.x, target.y - target.radius - 18, bonus, "#c084fc", false, "SHADOW AMBUSH!");
      }
    },
  };

  // ---- Skill 2: Ruler's Authority + Shadow Exchange (No Ult Charge) ----
  const SKILL_RULERS_AUTHORITY = {
    name: "Ruler's Authority",
    cooldown: 4.6,
    onTick(ball, g, dt) {
      const enemy = g.balls.find((b) => b !== ball && b.alive);
      if (enemy && enemy._wallCrushWindow > 0) {
        enemy._wallCrushWindow = Math.max(0, enemy._wallCrushWindow - dt);
        const nearWall =
          enemy.x <= enemy.radius + 6 ||
          enemy.x >= WORLD_SIZE - enemy.radius - 6 ||
          enemy.y <= enemy.radius + 6 ||
          enemy.y >= WORLD_SIZE - enemy.radius - 6;
        if (nearWall) {
          enemy._wallCrushWindow = 0;
          const crush = g.applyDamage(enemy, 4);
          g.addEffect(enemy, "stun", 0.3);
          g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#a855f7", 75, 0.25));
          g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, crush, "#c084fc", false, "WALL CRUSH!");
          rt.addShake(0.14, 4.5);
        }
      }

      if (this._cd > 0 || !enemy) return false;
      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 340) return false;

      rt.beginCast(ball, {
        kind: "gravity",
        duration: 0.2,
        color: "#38bdf8",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;

          // If target has Shadow Mark, perform Shadow Exchange blink behind enemy + Mutilate!
          if (t._shadowMarkedTimer > 0) {
            t._shadowMarkedTimer = 0;
            gg.entities.push(rt.spawnShockRing(b.x, b.y, "#7c3aed", 62, 0.26));
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const destX = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, t.x + Math.cos(ang) * (t.radius + b.radius + 18)));
            const destY = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, t.y + Math.sin(ang) * (t.radius + b.radius + 18)));
            b.x = destX;
            b.y = destY;
            const dealt = gg.applyDamage(t, Math.round(9 + rt.rng() * 3));
            t.flashTimer = 0.14;
            t._wallCrushWindow = 0.6;
            t.vx = Math.cos(ang + Math.PI) * 320;
            t.vy = Math.sin(ang + Math.PI) * 320;
            gg.entities.push(spawnMutilateXSlashVisual(t.x, t.y, ang));
            gg.spawnDamageText(t.x, t.y - t.radius - 16, dealt, "#c084fc", true, "SHADOW EXCHANGE!");
            gg.sound.playCritHit();
            rt.setHitStop(0.045);
            return;
          }

          // Otherwise: Telekinetic slam toward nearest wall
          const dLeft = t.x;
          const dRight = WORLD_SIZE - t.x;
          const dTop = t.y;
          const dBot = WORLD_SIZE - t.y;
          const minD = Math.min(dLeft, dRight, dTop, dBot);
          let sx = 0;
          let sy = 0;
          if (minD === dLeft) sx = -1;
          else if (minD === dRight) sx = 1;
          else if (minD === dTop) sy = -1;
          else sy = 1;

          const dealt = gg.applyDamage(t, Math.round(8 + rt.rng() * 2));
          t.flashTimer = 0.12;
          t.squash = 0.85;
          t._wallCrushWindow = 0.65;
          t.vx = sx * 420;
          t.vy = sy * 420;

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
    c.fillStyle = "#1f2937";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.roundRect(-2.8, 6, 5.6, 13, 2);
    c.fill();
    c.stroke();

    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(0, 21.5, 3, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = "#d97706";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-9.5, 7); c.quadraticCurveTo(-4, 2, 0, 3.5); c.quadraticCurveTo(4, 2, 9.5, 7);
    c.lineTo(7.5, 2.5); c.quadraticCurveTo(0, -1.5, -7.5, 2.5);
    c.closePath();
    c.fill();
    c.stroke();

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

    c.strokeStyle = isArise ? "#38bdf8" : "#c084fc";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, 1);
    c.quadraticCurveTo(-1, -18, 1, -31);
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Base (White tee, tattered purple-lined coat, cyan left pauldron) & Ult (Shadow Monarch Armor) ----
  BF.COSTUME_DRAWERS.jinwoo = (ball, r, c) => {
    const isArise = ball.ultTimer > 0;
    const t = performance.now() * 0.001;

    // Ult Form: Dark-violet shadow flames & spiked Monarch shoulder plates behind body
    if (isArise) {
      c.save();
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.5 + (i - 4) * 0.36;
        const flick = Math.sin(t * 9 + i * 1.7) * 0.12;
        const baseR = r * 0.92;
        const tipR = r * (1.46 + flick + (i % 2) * 0.14);
        c.fillStyle = i % 2 ? "rgba(88, 28, 135, 0.58)" : "rgba(168, 85, 247, 0.44)";
        c.beginPath();
        c.moveTo(Math.cos(a - 0.2) * baseR, Math.sin(a - 0.2) * baseR);
        c.quadraticCurveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2, Math.cos(a + flick) * tipR, Math.sin(a + flick) * tipR);
        c.quadraticCurveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, Math.cos(a + 0.2) * baseR, Math.sin(a + 0.2) * baseR);
        c.closePath();
        c.fill();
      }
      // Spiked Monarch armor pauldrons rising on both shoulders
      c.fillStyle = "#090414";
      c.strokeStyle = "#a855f7";
      c.lineWidth = 2;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * r * 0.72, r * 0.5);
        c.lineTo(s * r * 1.24, r * 0.02);
        c.lineTo(s * r * 0.98, r * 0.65);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    // Outfit clipped to ball body
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    if (isArise) {
      // ULT FORM: Pitch-black Shadow Monarch armor with glowing violet rune veins
      c.fillStyle = "#080412";
      c.fillRect(-r, r * 0.42, r * 2, r * 0.7);
      c.strokeStyle = "#a855f7";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.45, r * 0.5); c.lineTo(-r * 0.15, r * 0.75); c.lineTo(-r * 0.35, r * 0.98);
      c.moveTo(r * 0.45, r * 0.5); c.lineTo(r * 0.15, r * 0.75); c.lineTo(r * 0.35, r * 0.98);
      c.moveTo(-r * 0.2, r * 0.62); c.lineTo(r * 0.2, r * 0.62);
      c.stroke();
    } else {
      // BASE FORM: White inner shirt, dark long coat with purple tattered lining, cyan left dragon-pauldron
      c.fillStyle = "#f1f5f9";
      c.fillRect(-r * 0.42, r * 0.48, r * 0.84, r * 0.6);

      // Tattered purple inner coat lining at bottom
      c.fillStyle = "#6b21a8";
      c.fillRect(-r, r * 0.82, r * 2, r * 0.25);

      // Dark coat panels
      c.fillStyle = "#0b0d16";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * r * 0.16, r * 1.08);
        c.lineTo(s * r * 0.26, r * 0.56);
        c.lineTo(s * r * 0.34, r * 0.42);
        c.lineTo(s * r * 1.05, r * 0.38);
        c.lineTo(s * r * 1.05, r * 1.08);
        c.closePath();
        c.fill();
        c.stroke();
      }
      // Cyan/steel dragon-scale shoulder pauldron on left side (viewer's right)
      c.fillStyle = "#164e63";
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(r * 0.44, r * 0.46);
      c.lineTo(r * 0.96, r * 0.36);
      c.lineTo(r * 0.92, r * 0.68);
      c.lineTo(r * 0.48, r * 0.64);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();

    // Sharp, spiky layered Korean Hunter undercut hair
    const hair = [
      [-0.96, 0.08], [-1.06, -0.28], [-0.94, -0.44], [-1.14, -0.78], [-0.88, -0.86],
      [-0.96, -1.18], [-0.62, -1.06], [-0.48, -1.38], [-0.22, -1.12],
      [0.02, -1.44], [0.22, -1.14], [0.54, -1.36], [0.64, -1.04],
      [0.98, -1.14], [0.88, -0.84], [1.14, -0.74], [0.94, -0.42], [1.06, -0.24], [0.96, 0.08],
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
    c.strokeStyle = isArise ? "#a855f7" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    c.strokeStyle = isArise ? "rgba(192, 132, 252, 0.7)" : "rgba(100, 116, 160, 0.6)";
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
    ultName: "ARISE (MONARCH'S DOMAIN)",
    ultDesc: "Unleashes Monarch's Domain & summons Igris, Tank, and Beru for 6.5s. When the Domain ends, Kaisel swoops across and scorches the arena with Shadow Dragon Flame!",
    skillName: "SHADOW DAGGERS & RULER'S AUTHORITY",
    skillDesc: "Throws twin Shadow Daggers that mark & venom enemies, then crushes them into walls or triggers Shadow Exchange behind marked foes!",
    skills: [SKILL_SHADOW_DAGGERS, SKILL_RULERS_AUTHORITY],
  };
})();
