// ============================================================
//  SUNG JIN-WOO (SHADOW MONARCH)
//  Solo Leveling — Kamish's Wrath, Ruler's Authority & Monarch's Domain
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  // ---- Shared High-Detail Monarch Dagger Renderer (Kamish's Wrath & Kasaka's Venom Fang) ----
  function drawDetailedMonarchDagger(c, isVenom, scale = 1, isArise = false) {
    c.save();
    c.scale(scale, scale);
    c.lineJoin = "round";
    c.lineCap = "round";

    const accent = isVenom ? "#38bdf8" : "#a855f7";
    const highlight = isVenom ? "#e0f2fe" : "#f3e8ff";
    const midTone = isVenom ? "#0369a1" : "#581c87";

    // Criss-cross wrapped obsidian hilt
    c.fillStyle = "#111827";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.1;
    c.beginPath();
    c.roundRect(-2.9, 6, 5.8, 13.5, 2);
    c.fill();
    c.stroke();

    c.strokeStyle = isVenom ? "#7dd3fc" : "#d97706";
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-2.4, 8); c.lineTo(2.4, 11.5);
    c.moveTo(2.4, 8); c.lineTo(-2.4, 11.5);
    c.moveTo(-2.4, 12.5); c.lineTo(2.4, 16);
    c.moveTo(2.4, 12.5); c.lineTo(-2.4, 16);
    c.stroke();

    // Ornate dragon-ring pommel
    c.strokeStyle = isVenom ? "#38bdf8" : "#f59e0b";
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(0, 22, 3.3, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = accent;
    c.beginPath();
    c.arc(0, 22, 1.4, 0, Math.PI * 2);
    c.fill();

    // Swept dragon-wing crossguard
    c.fillStyle = isVenom ? "#0f172a" : "#b45309";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-11.5, 8);
    c.quadraticCurveTo(-5, 2.5, 0, 4);
    c.quadraticCurveTo(5, 2.5, 11.5, 8);
    c.lineTo(8.5, 2);
    c.quadraticCurveTo(0, -2, -8.5, 2);
    c.closePath();
    c.fill();
    c.stroke();

    // Crossguard glowing core jewel
    c.fillStyle = accent;
    c.beginPath();
    c.arc(0, 3.5, 2, 0, Math.PI * 2);
    c.fill();

    // Curved S-shaped dragon-fang blade with 3 jagged spine serrations
    c.shadowColor = accent;
    c.shadowBlur = isArise ? 16 : 11;
    const g = c.createLinearGradient(-5, 2, 5, -39);
    g.addColorStop(0, "#05050a");
    g.addColorStop(0.45, midTone);
    g.addColorStop(0.85, accent);
    g.addColorStop(1, highlight);
    c.fillStyle = g;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.3;
    c.beginPath();
    c.moveTo(-4.8, 3);
    c.quadraticCurveTo(-8.2, -10, -4.6, -18);
    c.lineTo(-7.2, -21);
    c.lineTo(-3.2, -24.5);
    c.lineTo(-5.8, -28);
    c.lineTo(-1.2, -31.5);
    c.quadraticCurveTo(1.5, -36.5, 3.2, -40);
    c.quadraticCurveTo(7.5, -24, 4.6, -11);
    c.quadraticCurveTo(6.2, -3, 4.8, 3);
    c.closePath();
    c.fill();
    c.stroke();
    c.shadowBlur = 0;

    // Glowing inner blood-groove energy vein
    c.strokeStyle = highlight;
    c.lineWidth = 1.7;
    c.beginPath();
    c.moveTo(0.4, 0.5);
    c.quadraticCurveTo(-2.2, -12, -0.4, -22);
    c.quadraticCurveTo(2.4, -30, 2.5, -36);
    c.stroke();

    c.restore();
  }

  // ---- Mutilate Cross-Slash Visual ----
  function spawnMutilateXSlashVisual(x, y, angle, scale = 1) {
    return {
      x,
      y,
      angle,
      scale,
      life: 0.28,
      maxLife: 0.28,
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
        c.scale(this.scale, this.scale);
        c.lineCap = "round";

        for (const sgn of [-1, 1]) {
          c.save();
          c.rotate(sgn * 0.54);
          c.strokeStyle = "#4c1d95";
          c.lineWidth = 13 * a;
          c.shadowColor = "#a855f7";
          c.shadowBlur = 16;
          c.beginPath();
          c.moveTo(-54, 0);
          c.lineTo(54, 0);
          c.stroke();

          c.strokeStyle = "#38bdf8";
          c.lineWidth = 6 * a;
          c.beginPath();
          c.moveTo(-48, 0);
          c.lineTo(48, 0);
          c.stroke();

          c.strokeStyle = "#f8fafc";
          c.lineWidth = 2.8 * a;
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

  // ---- Beru Triple Crimson-Cyan Claw Rip Visual ----
  function spawnBeruClawVisual(x, y, angle) {
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
        for (const offset of [-11, 0, 11]) {
          c.strokeStyle = "#e11d48";
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 10;
          c.lineWidth = 5 * a;
          c.beginPath();
          c.moveTo(-30, offset - 5);
          c.quadraticCurveTo(0, offset + 4, 30, offset - 5);
          c.stroke();

          c.strokeStyle = "#e0f2fe";
          c.lineWidth = 1.8 * a;
          c.beginPath();
          c.moveTo(-24, offset - 4);
          c.quadraticCurveTo(0, offset + 3, 24, offset - 4);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Igris Sweeping Greatsword Arc Visual ----
  function spawnIgrisSwordWaveVisual(x, y, angle) {
    return {
      x,
      y,
      angle,
      life: 0.26,
      maxLife: 0.26,
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
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 14;
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 7 * a;
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, 0, 38 + (1 - a) * 14, -Math.PI * 0.48, Math.PI * 0.48);
        c.stroke();
        c.strokeStyle = "#fca5a5";
        c.lineWidth = 3 * a;
        c.beginPath();
        c.arc(0, 0, 34 + (1 - a) * 14, -Math.PI * 0.36, Math.PI * 0.36);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Ruler's Authority Imploding Gravity Crush Visual ----
  function spawnRulersAuthorityCrushVisual(x, y, dirX, dirY) {
    const pushAng = Math.atan2(dirY, dirX);
    return {
      x,
      y,
      pushAng,
      life: 0.36,
      maxLife: 0.36,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = alpha;
        c.translate(this.x, this.y);

        // Contracting concentric telekinetic gravity rings
        for (const [col, mult] of [["#38bdf8", 1.0], ["#a855f7", 0.72]]) {
          const rRing = (74 * (1 - p * 0.68) + 12) * mult;
          c.strokeStyle = col;
          c.shadowColor = col;
          c.shadowBlur = 12;
          c.lineWidth = 3.2;
          c.beginPath();
          c.arc(0, 0, rRing, 0, Math.PI * 2);
          c.stroke();
        }

        // 6 inward-crushing telekinetic force spears
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + p * 0.5;
          const rOuter = 68 * (1 - p * 0.55);
          const rInner = Math.max(8, rOuter - 22);
          c.strokeStyle = i % 2 === 0 ? "#38bdf8" : "#c084fc";
          c.lineWidth = 2.6;
          c.beginPath();
          c.moveTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
          c.lineTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
          c.stroke();
        }

        // Directional kinetic slam vectors
        c.rotate(this.pushAng);
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 2.4;
        for (const off of [-14, 0, 14]) {
          c.beginPath();
          c.moveTo(12, off);
          c.lineTo(54 * (0.4 + p * 0.8), off);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Shadow Exchange Origin Decoy & Arrival Pillar ----
  function spawnShadowExchangeCloneVisual(x, y, isArrival = false) {
    return {
      x,
      y,
      isArrival,
      life: 0.42,
      maxLife: 0.42,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = a * 0.9;
        c.translate(this.x, this.y);

        // Abyssal shadow pool
        c.fillStyle = "#090414";
        c.strokeStyle = "#a855f7";
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, 8, 28 * (1.2 - a * 0.3), 12 * (1.2 - a * 0.3), 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Rising violet shadow silhouette pillar
        const h = this.isArrival ? 62 : 46;
        const grad = c.createLinearGradient(0, 10, 0, -h);
        grad.addColorStop(0, "rgba(124, 58, 237, 0.7)");
        grad.addColorStop(0.6, "rgba(168, 85, 247, 0.35)");
        grad.addColorStop(1, "rgba(56, 189, 248, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(-16, 8);
        c.quadraticCurveTo(-8, -h * 0.5, 0, -h);
        c.quadraticCurveTo(8, -h * 0.5, 16, 8);
        c.closePath();
        c.fill();
        c.restore();
      },
    };
  }

  // ---- High-Detail Thrown Shadow Dagger Projectile ----
  function spawnShadowDagger(owner, target, angle, isVenom, castState, inUlt) {
    const speed = inUlt ? 660 : 590;
    const m = rt.castMuzzle(owner, angle, 16);
    return {
      owner,
      target,
      x: m.x,
      y: m.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius: 13,
      life: 1.2,
      maxLife: 1.2,
      isVenom,
      castState,
      trail: [{ x: m.x, y: m.y }],
      spin: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.spin += dt * 16;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        if (this.target && this.target.alive) {
          const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x);
          let diff = desired - this.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.angle += Math.max(-dt * 3.1, Math.min(dt * 3.1, diff));
          const spd = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(this.angle) * spd;
          this.vy = Math.sin(this.angle) * spd;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 9) this.trail.shift();

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
          g.entities.push(spawnMutilateXSlashVisual(this.x, this.y, this.angle, 0.72));
          g.spawnSparks(this.x, this.y, isVenom ? "#38bdf8" : "#c084fc", "#090514");
          g.spawnDamageText(
            t.x,
            t.y - t.radius - 12,
            dealt,
            isVenom ? "#38bdf8" : "#c084fc",
            false,
            isVenom ? "KASAKA VENOM!" : "KAMISH WRATH!"
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
        const glow = this.isVenom ? "#38bdf8" : "#a855f7";
        const core = this.isVenom ? "#e0f2fe" : "#f3e8ff";

        // Sweeping dual-layer ribbon trail
        if (this.trail.length > 1) {
          c.save();
          c.lineCap = "round";
          c.lineJoin = "round";
          for (let i = 1; i < this.trail.length; i++) {
            const k = i / this.trail.length;
            c.globalAlpha = 0.55 * k;
            c.strokeStyle = glow;
            c.lineWidth = 10 * k;
            c.beginPath();
            c.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
            c.lineTo(this.trail[i].x, this.trail[i].y);
            c.stroke();

            c.globalAlpha = 0.85 * k;
            c.strokeStyle = core;
            c.lineWidth = 3.2 * k;
            c.beginPath();
            c.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
            c.lineTo(this.trail[i].x, this.trail[i].y);
            c.stroke();
          }
          c.restore();
        }

        // Full ornate Monarch relic dagger rotating cleanly toward flight vector
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle + Math.PI * 0.5);

        // Crescent cutting shockwave around dagger tip
        c.strokeStyle = glow;
        c.lineWidth = 2.2;
        c.globalAlpha = 0.72;
        c.beginPath();
        c.arc(0, -18, 17, -Math.PI * 0.85, -Math.PI * 0.15);
        c.stroke();
        c.globalAlpha = 1;

        drawDetailedMonarchDagger(c, this.isVenom, 0.88, true);
        c.restore();
      },
    };
  }

  // ---- Monarch's Domain (Abyssal Magic Circle, Shadow Tendrils & Soul Embers) ----
  function spawnMonarchsDomain(owner) {
    return {
      owner,
      x: owner.x,
      y: owner.y,
      lastEnemyX: WORLD_SIZE * 0.5,
      lastEnemyY: WORLD_SIZE * 0.5,
      maxRadius: 225,
      life: 6.5,
      maxLife: 6.5,
      spin: 0,
      kaiselSpawned: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.spin += dt * 0.95;
        if (this.owner && this.owner.alive) {
          this.x += (this.owner.x - this.x) * Math.min(1, dt * 2.5);
          this.y += (this.owner.y - this.y) * Math.min(1, dt * 2.5);
        }

        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (enemy) {
          this.lastEnemyX = enemy.x;
          this.lastEnemyY = enemy.y;
          if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.maxRadius) {
            g.addEffect(enemy, "slow", 0.25, { factor: 0.85 });
          }
        }

        if (this.life <= 0) {
          if (!this.kaiselSpawned && this.owner && this.owner.alive) {
            this.kaiselSpawned = true;
            g.entities.push(spawnKaiselDragonFlyby(this.owner, this.lastEnemyX, this.lastEnemyY));
          }
          this.dead = true;
        }
      },
      render(c) {
        const progress = 1 - this.life / this.maxLife;
        const expand = Math.min(1, progress / 0.12);
        const fadeOut = this.life < 0.7 ? Math.max(0, this.life / 0.7) : 1;
        const rad = this.maxRadius * (0.3 + 0.7 * expand);
        const t = performance.now() * 0.001;

        c.save();
        c.globalAlpha = 0.92 * fadeOut;
        c.translate(this.x, this.y);

        // Multi-layered abyssal territory gradient
        const grad = c.createRadialGradient(0, 0, rad * 0.08, 0, 0, rad);
        grad.addColorStop(0, "rgba(5, 2, 12, 0.64)");
        grad.addColorStop(0.45, "rgba(59, 7, 100, 0.45)");
        grad.addColorStop(0.78, "rgba(109, 40, 217, 0.28)");
        grad.addColorStop(0.94, "rgba(56, 189, 248, 0.2)");
        grad.addColorStop(1, "rgba(5, 2, 12, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

        // 16 writhing dark shadow tendrils/flames around the domain perimeter
        for (let i = 0; i < 16; i++) {
          const a = (i * Math.PI * 2) / 16 + t * 0.25;
          const wave = Math.sin(t * 6 + i * 1.3) * 0.12;
          const baseR = rad * 0.84;
          const tipR = rad * (1.06 + Math.sin(t * 7 + i * 2.1) * 0.07);
          c.fillStyle = i % 2 === 0 ? "rgba(9, 4, 20, 0.65)" : "rgba(124, 58, 237, 0.36)";
          c.beginPath();
          c.moveTo(Math.cos(a - 0.12) * baseR, Math.sin(a - 0.12) * baseR);
          c.quadraticCurveTo(
            Math.cos(a + wave) * (rad * 0.96),
            Math.sin(a + wave) * (rad * 0.96),
            Math.cos(a - wave * 1.4) * tipR,
            Math.sin(a - wave * 1.4) * tipR
          );
          c.quadraticCurveTo(
            Math.cos(a + 0.08) * (rad * 0.92),
            Math.sin(a + 0.08) * (rad * 0.92),
            Math.cos(a + 0.12) * baseR,
            Math.sin(a + 0.12) * baseR
          );
          c.closePath();
          c.fill();
        }

        // Outer rotating magic circle + arcane rune ticks + 8-pointed Sovereign star
        c.save();
        c.rotate(this.spin);
        c.strokeStyle = "rgba(168, 85, 247, 0.65)";
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(0, 0, rad * 0.88, 0, Math.PI * 2);
        c.stroke();

        // Arcane rune tick marks
        c.strokeStyle = "rgba(56, 189, 248, 0.55)";
        c.lineWidth = 1.6;
        for (let i = 0; i < 24; i++) {
          const a = (i * Math.PI) / 12;
          const r0 = rad * 0.84;
          const r1 = rad * (i % 3 === 0 ? 0.93 : 0.88);
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }

        // 8-pointed Sovereign star geometry (two rotated squares)
        c.strokeStyle = "rgba(192, 132, 252, 0.42)";
        c.lineWidth = 1.8;
        for (const offset of [0, Math.PI * 0.25]) {
          c.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = offset + (i * Math.PI) / 2;
            const px = Math.cos(a) * rad * 0.78;
            const py = Math.sin(a) * rad * 0.78;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.closePath();
          c.stroke();
        }
        c.restore();

        // Counter-rotating inner sigil ring
        c.save();
        c.rotate(-this.spin * 1.45);
        c.strokeStyle = "rgba(56, 189, 248, 0.55)";
        c.lineWidth = 2.2;
        c.setLineDash([12, 8]);
        c.beginPath();
        c.arc(0, 0, rad * 0.5, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);

        c.strokeStyle = "rgba(168, 85, 247, 0.55)";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(0, 0, rad * 0.24, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // 14 rising shadow-smoke & soul-ember particles inside domain
        for (let i = 0; i < 14; i++) {
          const ang = t * 0.75 + (i * Math.PI * 2) / 14;
          const dist = rad * (0.2 + 0.64 * (((i * 29) % 11) / 11));
          const drift = ((t * 28 + i * 19) % 24) - 12;
          const px = Math.cos(ang) * dist;
          const py = Math.sin(ang) * dist - drift;
          c.fillStyle = i % 3 === 0 ? "rgba(56, 189, 248, 0.78)" : i % 3 === 1 ? "rgba(192, 132, 252, 0.75)" : "rgba(9, 4, 20, 0.75)";
          c.beginPath();
          c.arc(px, py, 2.2 + Math.sin(t * 5 + i) * 1.1, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- Helper: Shadow Base Puddle beneath each Marshal ----
  function drawShadowBasePuddle(c, rx, ry, glowColor, t) {
    c.save();
    c.fillStyle = "rgba(5, 3, 12, 0.78)";
    c.strokeStyle = glowColor;
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(0, 14, rx + Math.sin(t * 8) * 1.5, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }

  // ---- 3 Detailed Shadow Marshals: Igris, Tank, Beru ----
  function spawnShadowSoldier(owner, variant) {
    const startAng =
      variant === "igris" ? -Math.PI * 0.35 : variant === "tank" ? Math.PI : Math.PI * 0.35;
    const sx = owner.x + Math.cos(startAng) * (owner.radius + 28);
    const sy = owner.y + Math.sin(startAng) * (owner.radius + 28);

    return {
      owner,
      variant,
      x: sx,
      y: sy,
      vx: Math.cos(startAng) * 110,
      vy: Math.sin(startAng) * 110,
      radius: variant === "tank" ? 19 : variant === "igris" ? 15 : 14,
      life: 6.5,
      maxLife: 6.5,
      actionCd: variant === "igris" ? 0.35 : variant === "tank" ? 0.6 : 0.45,
      guardFlashTimer: 0,
      facing: startAng,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.guardFlashTimer = Math.max(0, this.guardFlashTimer - dt);
        if (this.life <= 0 || !this.owner || !this.owner.alive) {
          g.spawnSparks(this.x, this.y, "#a855f7", "#090514");
          this.dead = true;
          return;
        }
        this.actionCd = Math.max(0, this.actionCd - dt);
        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        if (!enemy) return;

        if (this.variant === "tank") {
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
              if (dProj <= this.radius + e.radius + 16) {
                e.dead = true;
                this.guardFlashTimer = 0.28;
                g.entities.push(rt.spawnShockRing(e.x, e.y, "#60a5fa", 48, 0.22));
                g.spawnSparks(e.x, e.y, "#38bdf8", "#a855f7");
                g.spawnDamageText(this.x, this.y - this.radius - 12, "BLOCKED!", "#38bdf8", false, "TANK GUARD!");
                g.sound.playBallHit();
              }
            }
          }
          const midX = this.owner.x * 0.35 + enemy.x * 0.65;
          const midY = this.owner.y * 0.35 + enemy.y * 0.65;
          const dx = midX - this.x;
          const dy = midY - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          this.vx += ((dx / dist) * 245 - this.vx) * Math.min(1, dt * 5.5);
          this.vy += ((dy / dist) * 245 - this.vy) * Math.min(1, dt * 5.5);

          const dEnemy = Math.hypot(enemy.x - this.x, enemy.y - this.y);
          if (dEnemy <= enemy.radius + this.radius + 10 && this.actionCd <= 0) {
            this.actionCd = 1.5;
            this.guardFlashTimer = 0.25;
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
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          this.vx += (nx * 325 - this.vx) * Math.min(1, dt * 7);
          this.vy += (ny * 325 - this.vy) * Math.min(1, dt * 7);

          if (dist <= enemy.radius + this.radius + 26 && this.actionCd <= 0) {
            this.actionCd = 1.35;
            const dealt = g.applyDamage(enemy, Math.round(6 + rt.rng() * 2));
            enemy.flashTimer = 0.11;
            enemy.vx += nx * 150;
            enemy.vy += ny * 150;
            const atkAng = Math.atan2(ny, nx);
            g.entities.push(spawnIgrisSwordWaveVisual(enemy.x, enemy.y, atkAng));
            g.entities.push(spawnMutilateXSlashVisual(enemy.x, enemy.y, atkAng, 0.78));
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#ef4444");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 12, dealt, "#c084fc", false, "IGRIS SLASH!");
            g.sound.playBallHit();
            this.vx = -nx * 165 - ny * 85;
            this.vy = -ny * 165 + nx * 85;
          }
        } else {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;
          const flank = dist > 70 ? 0.45 : 0.15;
          this.vx += ((nx - ny * flank) * 355 - this.vx) * Math.min(1, dt * 8);
          this.vy += ((ny + nx * flank) * 355 - this.vy) * Math.min(1, dt * 8);

          if (dist <= enemy.radius + this.radius + 20 && this.actionCd <= 0) {
            this.actionCd = 1.05;
            const dealt = g.applyDamage(enemy, Math.round(4 + rt.rng()));
            enemy.flashTimer = 0.08;
            g.addEffect(enemy, "slow", 0.55, { factor: 0.78 });
            g.entities.push(spawnBeruClawVisual(enemy.x, enemy.y, Math.atan2(ny, nx)));
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#e11d48");
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
        c.globalAlpha = 0.96 * fade;
        c.translate(this.x, this.y);

        if (this.variant === "igris") {
          drawShadowBasePuddle(c, 18, 6, "rgba(56, 189, 248, 0.55)", t);
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 12;

          // Billowing tattered dark-navy shadow cape
          c.fillStyle = "#060919";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(-10, -4);
          c.quadraticCurveTo(-22, 6 + Math.sin(t * 7) * 3, -18, 17);
          c.lineTo(-9, 13);
          c.lineTo(0, 18);
          c.lineTo(9, 13);
          c.lineTo(18, 17);
          c.quadraticCurveTo(22, 6 - Math.sin(t * 7) * 3, 10, -4);
          c.closePath();
          c.fill();
          c.stroke();

          // Colossal Demon King's Longsword behind/beside knight
          c.save();
          c.rotate(this.facing + 0.45);
          c.fillStyle = "#090d1f";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.9;
          c.beginPath();
          c.moveTo(6, -3.5);
          c.lineTo(36, 0);
          c.lineTo(6, 3.5);
          c.closePath();
          c.fill();
          c.stroke();
          c.strokeStyle = "#e0f2fe";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(9, 0);
          c.lineTo(31, 0);
          c.stroke();
          c.restore();

          // Armored torso & spiked shoulder pauldrons
          c.fillStyle = "#070914";
          c.strokeStyle = "#1d4ed8";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, -10);
          c.lineTo(16, -6);
          c.lineTo(11, 0);
          c.lineTo(9, 14);
          c.lineTo(-9, 14);
          c.lineTo(-11, 0);
          c.lineTo(-16, -6);
          c.closePath();
          c.fill();
          c.stroke();

          // 3 pairs of glowing electric-cyan ribcage lines + sternum core
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.7;
          c.beginPath();
          for (const ry of [1, 5, 9]) {
            c.moveTo(-6, ry); c.lineTo(0, ry + 2); c.lineTo(6, ry);
          }
          c.stroke();
          c.fillStyle = "#e0f2fe";
          c.beginPath();
          c.arc(0, 1, 2.2, 0, Math.PI * 2);
          c.fill();

          // Long flowing crimson-red helmet plume (3 layered ribbons)
          for (const [col, w, dy] of [["#991b1b", 6, 0], ["#ef4444", 3.8, -1.5], ["#fca5a5", 1.6, -2.5]]) {
            c.strokeStyle = col;
            c.lineWidth = w;
            c.lineCap = "round";
            c.beginPath();
            c.moveTo(-1, -17);
            c.quadraticCurveTo(-14, -27 + dy + Math.sin(t * 10) * 3, -25, -10 + dy + Math.cos(t * 9) * 3.5);
            c.stroke();
          }

          // Horned angular knight helmet + cyan V-visor
          c.fillStyle = "#080b18";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, -21);
          c.lineTo(7, -14);
          c.lineTo(5, -5);
          c.lineTo(0, -3);
          c.lineTo(-5, -5);
          c.lineTo(-7, -14);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#e0f2fe";
          c.beginPath();
          c.moveTo(-4.5, -12);
          c.lineTo(0, -9.5);
          c.lineTo(4.5, -12);
          c.lineTo(0, -13.5);
          c.closePath();
          c.fill();
        } else if (this.variant === "tank") {
          drawShadowBasePuddle(c, 22, 7, "rgba(124, 58, 237, 0.65)", t);
          c.shadowColor = "#7c3aed";
          c.shadowBlur = 14;

          // Multi-layered blazing white-violet flame mane behind bear head
          for (let i = 0; i < 9; i++) {
            const fx = (i - 4) * 3.6;
            const fy = -18 - Math.sin(t * 11 + i * 1.4) * 4.5 - (i % 2) * 3;
            c.fillStyle = i % 2 === 0 ? "rgba(192, 132, 252, 0.78)" : "rgba(224, 242, 254, 0.85)";
            c.beginPath();
            c.moveTo(fx - 4.2, -10);
            c.lineTo(fx, fy);
            c.lineTo(fx + 4.2, -10);
            c.closePath();
            c.fill();
          }

          // Rounded bear ears with purple inner glow
          c.fillStyle = "#080512";
          c.strokeStyle = "#818cf8";
          c.lineWidth = 2;
          for (const s of [-1, 1]) {
            c.beginPath();
            c.arc(s * 12, -12, 5.2, 0, Math.PI * 2);
            c.fill();
            c.stroke();
          }

          // Hulking muscular shadow-bear shoulders & torso
          c.fillStyle = "#080512";
          c.strokeStyle = "#6366f1";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(0, -17);
          c.quadraticCurveTo(19, -15, 20, 2);
          c.quadraticCurveTo(17, 15, 0, 17);
          c.quadraticCurveTo(-17, 15, -20, 2);
          c.quadraticCurveTo(-19, -15, 0, -17);
          c.closePath();
          c.fill();
          c.stroke();

          // Iconic glowing electric-blue/white X-scar across chest
          c.lineCap = "round";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 4.2;
          c.beginPath();
          c.moveTo(-10, 3); c.lineTo(10, 14);
          c.moveTo(10, 3); c.lineTo(-10, 14);
          c.stroke();
          c.strokeStyle = "#e0f2fe";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(-9, 3.5); c.lineTo(9, 13.5);
          c.moveTo(9, 3.5); c.lineTo(-9, 13.5);
          c.stroke();

          // Glowing purple eyes, scarred left eye & fanged bear snout
          c.fillStyle = "#c084fc";
          c.beginPath();
          c.arc(-6, -5, 2.5, 0, Math.PI * 2);
          c.arc(6, -5, 2.5, 0, Math.PI * 2);
          c.fill();

          // Vertical claw scar across right eye
          c.strokeStyle = "#7dd3fc";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(4.5, -10); c.lineTo(8.5, 0);
          c.stroke();

          // Snout + curved white lower tusks
          c.fillStyle = "#1e1b4b";
          c.beginPath();
          c.ellipse(0, 0, 5.5, 3.8, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#f8fafc";
          c.beginPath();
          c.moveTo(-5.5, 2.5); c.lineTo(-3.8, -2.5); c.lineTo(-2, 2.5);
          c.moveTo(2, 2.5); c.lineTo(3.8, -2.5); c.lineTo(5.5, 2.5);
          c.fill();

          // Hexagonal Vanguard guard barrier when intercepting or slamming
          if (this.guardFlashTimer > 0) {
            c.strokeStyle = "#38bdf8";
            c.fillStyle = "rgba(56, 189, 248, 0.2)";
            c.lineWidth = 2.4;
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i * Math.PI) / 3;
              const px = Math.cos(a) * 24;
              const py = Math.sin(a) * 24;
              if (i === 0) c.moveTo(px, py);
              else c.lineTo(px, py);
            }
            c.closePath();
            c.fill();
            c.stroke();
          }
        } else {
          drawShadowBasePuddle(c, 16, 5.5, "rgba(56, 189, 248, 0.6)", t);
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 12;

          // 6 writhing pitch-black ink/shadow tendrils curling around Beru
          c.strokeStyle = "#03040a";
          c.lineWidth = 2.6;
          c.lineCap = "round";
          for (let i = 0; i < 6; i++) {
            const s = i % 2 === 0 ? 1 : -1;
            const sway = Math.sin(t * 9 + i * 1.4) * 5;
            c.beginPath();
            c.moveTo(s * 6, (i - 2.5) * 4);
            c.quadraticCurveTo(s * (16 + sway), -8 + i * 2, s * (12 - sway * 0.5), -20 + i * 3);
            c.stroke();
          }

          // 4 fluttering translucent electric-cyan insect wings
          const flap = Math.sin(t * 30) * 0.25;
          for (const [wy, scale, ang] of [[-5, 1.0, 0.48], [2, 0.78, 0.88]]) {
            for (const s of [-1, 1]) {
              c.save();
              c.translate(s * 5, wy);
              c.rotate(s * (ang + flap));
              c.fillStyle = "rgba(56, 189, 248, 0.38)";
              c.strokeStyle = "#38bdf8";
              c.lineWidth = 1.5;
              c.beginPath();
              c.ellipse(s * 12 * scale, 0, 12 * scale, 4.2 * scale, 0, 0, Math.PI * 2);
              c.fill();
              c.stroke();
              c.restore();
            }
          }

          // Jagged chitinous exoskeleton + horned ant-king head
          c.fillStyle = "#050711";
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(0, -17);
          c.lineTo(5, -13);
          c.lineTo(13, -7);
          c.lineTo(9, 2);
          c.lineTo(6, 13);
          c.lineTo(0, 15);
          c.lineTo(-6, 13);
          c.lineTo(-9, 2);
          c.lineTo(-13, -7);
          c.lineTo(-5, -13);
          c.closePath();
          c.fill();
          c.stroke();

          // Glowing cyan carapace seam lines
          c.strokeStyle = "#7dd3fc";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(-6, -1); c.lineTo(0, 2); c.lineTo(6, -1);
          c.moveTo(-5, 5); c.lineTo(0, 8); c.lineTo(5, 5);
          c.stroke();

          // Glowing V-shaped eyes & mandibles
          c.fillStyle = "#e0f2fe";
          c.beginPath();
          c.moveTo(-6.5, -9); c.lineTo(-2, -6); c.lineTo(-5.5, -5); c.closePath();
          c.moveTo(6.5, -9); c.lineTo(2, -6); c.lineTo(5.5, -5); c.closePath();
          c.fill();

          // Crimson-tipped lethal claws on elongated forearms
          c.strokeStyle = "#fb7185";
          c.lineWidth = 2.2;
          for (const s of [-1, 1]) {
            c.beginPath();
            c.moveTo(s * 9, 2); c.lineTo(s * 16, 7);
            c.moveTo(s * 14, 7); c.lineTo(s * 18, 12);
            c.moveTo(s * 12, 8); c.lineTo(s * 14, 14);
            c.stroke();
          }
        }
        c.restore();
      },
    };
  }

  // ---- Scorched Shadow-Flame Crater Zone left by Kaisel's Breath ----
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
        c.globalAlpha = 0.9 * fade;
        c.translate(this.x, this.y);

        // Dark abyssal crater glow
        const grad = c.createRadialGradient(0, 0, 8, 0, 0, this.radius);
        grad.addColorStop(0, "rgba(5, 8, 22, 0.72)");
        grad.addColorStop(0.42, "rgba(14, 165, 233, 0.45)");
        grad.addColorStop(0.75, "rgba(109, 40, 217, 0.34)");
        grad.addColorStop(1, "rgba(5, 8, 22, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();

        // Branching glowing electric-cyan & violet ground fissures
        c.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + 0.25;
          c.strokeStyle = i % 2 === 0 ? "rgba(56, 189, 248, 0.8)" : "rgba(168, 85, 247, 0.75)";
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
          c.lineTo(Math.cos(a + 0.14) * (this.radius * 0.52), Math.sin(a + 0.14) * (this.radius * 0.52));
          c.lineTo(Math.cos(a - 0.08) * (this.radius * 0.86), Math.sin(a - 0.08) * (this.radius * 0.86));
          c.stroke();
        }

        // Rotating ring of 12 dual-tone shadow-fire pillars
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI * 2) / 12 + t * 0.9;
          const r = this.radius * (0.35 + 0.48 * ((i * 5) % 4) / 3);
          const fx = Math.cos(a) * r;
          const fy = Math.sin(a) * r;
          const fh = 15 + Math.sin(t * 12 + i) * 6;
          c.fillStyle = i % 2 === 0 ? "rgba(56, 189, 248, 0.78)" : "rgba(168, 85, 247, 0.72)";
          c.beginPath();
          c.moveTo(fx - 7, fy);
          c.quadraticCurveTo(fx - 2, fy - fh * 0.6, fx, fy - fh);
          c.quadraticCurveTo(fx + 2, fy - fh * 0.6, fx + 7, fy);
          c.closePath();
          c.fill();
        }
        c.restore();
      },
    };
  }

  // ---- Kaisel (Shadow Wyvern / Dragon) Colossal Swoop & Last-Step Flame Breath Finale ----
  function spawnKaiselDragonFlyby(owner, lastX, lastY) {
    const clampSpot = (v) => Math.max(95, Math.min(WORLD_SIZE - 95, v));
    const targetX = clampSpot(lastX);
    const targetY = clampSpot(lastY);
    return {
      owner,
      targetX,
      targetY,
      x: -140,
      y: targetY - 140,
      life: 1.75,
      maxLife: 1.75,
      breathed: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);

        // Track enemy's live stepped position during wind-up approach, then lock on before breath
        if (p < 0.34) {
          const enemy = g.balls.find((b) => b !== this.owner && b.alive);
          if (enemy) {
            this.targetX = clampSpot(enemy.x);
            this.targetY = clampSpot(enemy.y);
          }
        }

        this.x = -140 + (WORLD_SIZE + 280) * p;
        this.y = this.targetY - 150 + Math.sin(p * Math.PI) * 95;

        if (p >= 0.42 && !this.breathed) {
          this.breathed = true;
          g.entities.push(rt.spawnShockRing(this.targetX, this.targetY, "#38bdf8", 145, 0.46));
          g.entities.push(rt.spawnShockRing(this.targetX, this.targetY, "#a855f7", 105, 0.34));
          g.entities.push(spawnKaiselBurnZone(this.owner, this.targetX, this.targetY));
          g.spawnSparks(this.targetX, this.targetY, "#38bdf8", "#a855f7");
          rt.addShake(0.28, 7);
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
        const flap = Math.sin(t * 16) * 22;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const bank = 0.14 * Math.cos(p * Math.PI);

        // 0. Glowing Dragon Target Reticle locked on enemy's last stepped position before breath lands
        if (p < 0.45) {
          const lockPulse = 1 - Math.min(1, p / 0.45);
          c.save();
          c.translate(this.targetX, this.targetY);
          c.globalAlpha = 0.85;
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 2.6;
          c.setLineDash([10, 6]);
          c.rotate(t * 2.5);
          c.beginPath();
          c.arc(0, 0, 42 + lockPulse * 48, 0, Math.PI * 2);
          c.stroke();
          c.setLineDash([]);
          c.strokeStyle = "#a855f7";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-26, 0); c.lineTo(26, 0);
          c.moveTo(0, -26); c.lineTo(0, 26);
          c.stroke();
          c.restore();
        }

        // 1. Multi-layered Torrential Shadow Dragon Breath Beam toward targetX/targetY
        if (p >= 0.32 && p <= 0.76) {
          c.save();
          const mx = this.x + Math.cos(bank) * 44 - Math.sin(bank) * -18;
          const my = this.y + Math.sin(bank) * 44 + Math.cos(bank) * -18;
          const gradOut = c.createLinearGradient(mx, my, this.targetX, this.targetY);
          gradOut.addColorStop(0, "rgba(224, 242, 254, 0.92)");
          gradOut.addColorStop(0.5, "rgba(56, 189, 248, 0.65)");
          gradOut.addColorStop(1, "rgba(124, 58, 237, 0.4)");

          c.lineCap = "round";
          c.strokeStyle = "rgba(109, 40, 217, 0.45)";
          c.lineWidth = 38;
          c.beginPath();
          c.moveTo(mx, my);
          c.lineTo(this.targetX, this.targetY);
          c.stroke();

          c.strokeStyle = gradOut;
          c.lineWidth = 22;
          c.beginPath();
          c.moveTo(mx, my);
          c.lineTo(this.targetX, this.targetY);
          c.stroke();

          c.strokeStyle = "#f0f9ff";
          c.lineWidth = 9;
          c.beginPath();
          c.moveTo(mx, my);
          c.lineTo(this.targetX, this.targetY);
          c.stroke();

          // Impact plasma bloom at breath target
          const impGrad = c.createRadialGradient(this.targetX, this.targetY, 4, this.targetX, this.targetY, 54);
          impGrad.addColorStop(0, "rgba(240, 249, 255, 0.95)");
          impGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.65)");
          impGrad.addColorStop(1, "rgba(124, 58, 237, 0)");
          c.fillStyle = impGrad;
          c.beginPath();
          c.arc(this.targetX, this.targetY, 54, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        // 2. Colossal Kaisel Wyvern Body & ~240px Shadow-Flame Wings
        c.save();
        c.translate(this.x, this.y);
        c.rotate(bank);
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 18;

        for (const s of [-1, 1]) {
          // Glowing cyan/deep-blue shadow-flame wing membrane
          const wGrad = c.createRadialGradient(-10, s * 16, 6, -48, s * (58 + flap), 115);
          wGrad.addColorStop(0, "rgba(224, 242, 254, 0.92)");
          wGrad.addColorStop(0.35, "rgba(0, 216, 255, 0.85)");
          wGrad.addColorStop(0.72, "rgba(29, 78, 216, 0.72)");
          wGrad.addColorStop(1, "rgba(5, 7, 14, 0.92)");

          c.fillStyle = wGrad;
          c.strokeStyle = "#03050c";
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(2, 0);
          c.quadraticCurveTo(-18, s * (42 + flap * 0.7), -58, s * (112 + flap));
          c.quadraticCurveTo(-76, s * (82 + flap * 0.7), -86, s * (64 + flap * 0.6));
          c.quadraticCurveTo(-64, s * (52 + flap * 0.45), -74, s * (32 + flap * 0.3));
          c.quadraticCurveTo(-48, s * (24 + flap * 0.2), -34, s * 8);
          c.closePath();
          c.fill();
          c.stroke();

          // Pitch-black articulated wing-arm & 4 finger bones
          c.strokeStyle = "#05070e";
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(2, 0);
          c.quadraticCurveTo(-16, s * (40 + flap * 0.65), -56, s * (108 + flap));
          c.moveTo(-26, s * (52 + flap * 0.55));
          c.lineTo(-82, s * (62 + flap * 0.6));
          c.moveTo(-20, s * (36 + flap * 0.4));
          c.lineTo(-70, s * (32 + flap * 0.3));
          c.moveTo(-14, s * (22 + flap * 0.25));
          c.lineTo(-50, s * (16 + flap * 0.15));
          c.stroke();
        }

        // Long whipping shadow tail & slender muscular neck
        c.fillStyle = "#04060d";
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(-88, 10 + Math.sin(t * 14) * 6);
        c.quadraticCurveTo(-48, -4, -14, -3);
        c.quadraticCurveTo(10, -14, 30, -24);
        c.lineTo(48, -28);
        c.lineTo(38, -16);
        c.lineTo(44, -11);
        c.lineTo(28, -12);
        c.quadraticCurveTo(6, 6, -16, 8);
        c.quadraticCurveTo(-50, 12, -88, 10 + Math.sin(t * 14) * 6);
        c.closePath();
        c.fill();
        c.stroke();

        // Blazing electric-cyan throat & chest flame-plates
        c.fillStyle = "#38bdf8";
        c.beginPath();
        c.moveTo(-8, 1);
        c.quadraticCurveTo(8, -2, 27, -14);
        c.quadraticCurveTo(14, 2, -8, 6);
        c.closePath();
        c.fill();
        c.fillStyle = "#e0f2fe";
        c.beginPath();
        c.ellipse(10, -5, 11, 3, -0.45, 0, Math.PI * 2);
        c.fill();

        // Swept-back glowing cyan dragon horns & roaring glowing maw
        c.strokeStyle = "#7dd3fc";
        c.lineWidth = 2.6;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(30, -23);
        c.quadraticCurveTo(14, -32, 4, -26);
        c.stroke();

        c.fillStyle = "#e0f2fe";
        c.beginPath();
        c.arc(34, -22, 2.5, 0, Math.PI * 2);
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
        duration: 0.22,
        color: "#a855f7",
        renderCast(b, c, p, ang, tg) {
          // Twin swirling Monarch Shadow Portals summoning Kamish's Wrath & Kasaka's Venom Fang
          for (const [sgn, isVenom, col] of [[-1, false, "#a855f7"], [1, true, "#38bdf8"]]) {
            const portAng = ang + sgn * 0.92;
            const px = b.x + Math.cos(portAng) * (b.radius + 20);
            const py = b.y + Math.sin(portAng) * (b.radius + 20);

            if (tg && p > 0.22) {
              c.save();
              c.setLineDash([7, 7]);
              c.strokeStyle = col;
              c.lineWidth = 2.2;
              c.globalAlpha = 0.65;
              c.beginPath();
              c.moveTo(px, py);
              c.lineTo(tg.x, tg.y);
              c.stroke();
              c.restore();
            }

            // Swirling dark-violet / cyan portal ellipse
            c.save();
            c.translate(px, py);
            c.rotate(ang);
            c.fillStyle = "rgba(7, 4, 18, 0.85)";
            c.strokeStyle = col;
            c.shadowColor = col;
            c.shadowBlur = 12;
            c.lineWidth = 2.4;
            const pr = 11 * Math.min(1, p * 2.2);
            c.beginPath();
            c.ellipse(0, 0, pr * 0.65, pr * 1.25, 0, 0, Math.PI * 2);
            c.fill();
            c.stroke();

            // Ornate Monarch dagger sliding forward out of portal, pointing at enemy
            c.save();
            c.translate(p * 14, 0);
            c.rotate(Math.PI * 0.5);
            drawDetailedMonarchDagger(c, isVenom, 0.78, true);
            c.restore();
            c.restore();
          }
        },
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
        duration: 0.24,
        color: "#38bdf8",
        renderCast(b, c, p, ang, tg) {
          // Sovereign Telekinetic Palm Sigil in front of Jin-Woo
          const fx = b.x + Math.cos(ang) * (b.radius + 18);
          const fy = b.y + Math.sin(ang) * (b.radius + 18);
          c.save();
          c.translate(fx, fy);
          c.rotate(ang);
          c.strokeStyle = "#a855f7";
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 10;
          c.lineWidth = 2.5;
          c.beginPath();
          c.ellipse(0, 0, 6, 16 * (0.4 + p * 0.6), 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();

          // Contracting Telekinetic Lock-On Ring & 4 clamping brackets around enemy
          if (tg) {
            c.save();
            c.translate(tg.x, tg.y);
            const rLock = tg.radius + 28 * (1 - 0.55 * p);
            c.strokeStyle = "#38bdf8";
            c.lineWidth = 2.6;
            c.setLineDash([8, 6]);
            c.rotate(p * 4);
            c.beginPath();
            c.arc(0, 0, rLock, 0, Math.PI * 2);
            c.stroke();
            c.setLineDash([]);

            c.strokeStyle = "#a855f7";
            c.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
              const ca = (i * Math.PI) / 2;
              const cx = Math.cos(ca) * (rLock + 4);
              const cy = Math.sin(ca) * (rLock + 4);
              c.beginPath();
              c.moveTo(cx, cy);
              c.lineTo(Math.cos(ca) * (rLock - 7), Math.sin(ca) * (rLock - 7));
              c.stroke();
            }
            c.restore();
          }
        },
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;

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

          // If target has Shadow Mark, empower Ruler's Authority into Gravity Crush (no TP)
          if (t._shadowMarkedTimer > 0) {
            t._shadowMarkedTimer = 0;
            const dealt = gg.applyDamage(t, Math.round(10 + rt.rng() * 2));
            t.flashTimer = 0.14;
            t.squash = 0.82;
            t._wallCrushWindow = 0.65;
            t.vx = sx * 460;
            t.vy = sy * 460;
            gg.addEffect(t, "stun", 0.35);
            gg.entities.push(spawnRulersAuthorityCrushVisual(t.x, t.y, sx, sy));
            gg.entities.push(spawnMutilateXSlashVisual(t.x, t.y, Math.atan2(sy, sx), 1.05));
            gg.entities.push(rt.spawnShockRing(t.x, t.y, "#a855f7", 95, 0.32));
            gg.spawnDamageText(t.x, t.y - t.radius - 16, dealt, "#c084fc", true, "GRAVITY CRUSH!");
            gg.sound.playCritHit();
            rt.setHitStop(0.045);
            rt.addShake(0.16, 4.5);
            return;
          }

          const dealt = gg.applyDamage(t, Math.round(8 + rt.rng() * 2));
          t.flashTimer = 0.12;
          t.squash = 0.85;
          t._wallCrushWindow = 0.65;
          t.vx = sx * 420;
          t.vy = sy * 420;

          gg.entities.push(spawnRulersAuthorityCrushVisual(t.x, t.y, sx, sy));
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

  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: Kamish's Wrath (High-Detail Dragon-Fang Blade) ----
  BF.WEAPON_DRAWERS.kamish_dagger = (ball, c) => {
    drawDetailedMonarchDagger(c, false, 1, ball.ultTimer > 0);
  };

  // ---- Costume Drawer: Base & Shadow Monarch Armor ----
  BF.COSTUME_DRAWERS.jinwoo = (ball, r, c) => {
    const isArise = ball.ultTimer > 0;
    const t = performance.now() * 0.001;

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

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    if (isArise) {
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
      c.fillStyle = "#f1f5f9";
      c.fillRect(-r * 0.42, r * 0.48, r * 0.84, r * 0.6);

      c.fillStyle = "#6b21a8";
      c.fillRect(-r, r * 0.82, r * 2, r * 0.25);

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

    const hair = [
      [-0.86, 0.06], [-0.95, -0.24], [-0.85, -0.38], [-1.03, -0.67], [-0.79, -0.74],
      [-0.86, -1.01], [-0.56, -0.91], [-0.43, -1.19], [-0.20, -0.96],
      [0.02, -1.24], [0.20, -0.98], [0.49, -1.17], [0.58, -0.89],
      [0.88, -0.98], [0.79, -0.72], [1.03, -0.64], [0.85, -0.36], [0.95, -0.21], [0.86, 0.06],
      [0.74, -0.12], [0.61, -0.36], [0.45, -0.19], [0.31, -0.41],
      [0.14, -0.17], [0.02, -0.40], [-0.04, -0.08], [-0.14, -0.41],
      [-0.31, -0.19], [-0.45, -0.40], [-0.61, -0.21], [-0.74, -0.12],
    ];
    c.save();
    c.lineJoin = "round";
    c.lineCap = "round";
    const hg = c.createLinearGradient(0, -r * 1.24, 0, 0);
    hg.addColorStop(0, "#1e2436");
    hg.addColorStop(1, "#07090e");
    c.fillStyle = hg;
    c.strokeStyle = isArise ? "#a855f7" : COLORS.ink;
    c.lineWidth = 3;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    c.strokeStyle = isArise ? "rgba(192, 132, 252, 0.7)" : "rgba(100, 116, 160, 0.6)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.41, -1.01, -0.29, -0.53], [0.02, -1.07, 0.0, -0.52], [0.41, -1.00, 0.27, -0.53],
      [0.74, -0.79, 0.56, -0.46], [-0.74, -0.79, -0.56, -0.46],
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
