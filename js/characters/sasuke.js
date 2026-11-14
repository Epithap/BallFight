// Sasuke Uchiha: Chidori (with Rasengan Clash!), Fireball Jutsu, and Kirin Thunderstorm Ultimate.
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE, FONT } = BF;
  const rt = BF.rt;

  function pickEnemy(owner, g) {
    return g.balls.find((b) => b !== owner && b.alive) || null;
  }

  // ---- Chidori Hand Lightning Visual (attached while ball.chidoriTimer > 0) ----
  function spawnChidoriHandFX(owner) {
    return {
      owner,
      dead: false,
      update(dt, g) {
        if (!this.owner.alive || this.owner.chidoriTimer <= 0 || this.owner._jutsuClashTimer > 0) {
          this.dead = true;
          return;
        }
        if (Math.random() < 0.45 && g.spawnSparks) {
          const ang = Math.atan2(this.owner.vy, this.owner.vx) || 0;
          const hx = this.owner.x + Math.cos(ang) * (this.owner.radius + 8);
          const hy = this.owner.y + Math.sin(ang) * (this.owner.radius + 8);
          g.spawnSparks(hx, hy, "#38bdf8", "#ffffff");
        }
      },
      render(c) {
        if (!this.owner.alive || this.owner.chidoriTimer <= 0) return;
        const ang = Math.atan2(this.owner.vy, this.owner.vx) || 0;
        const hx = this.owner.x + Math.cos(ang) * (this.owner.radius + 10);
        const hy = this.owner.y + Math.sin(ang) * (this.owner.radius + 10);
        const t = performance.now() * 0.02;

        c.save();
        c.translate(hx, hy);
        const cm = Boolean(this.owner.curseMarkMode || this.owner.susanooArmorMode);
        const grad = c.createRadialGradient(0, 0, 2, 0, 0, cm ? 28 : 24);
        grad.addColorStop(0, cm ? "#09090b" : "#ffffff");
        grad.addColorStop(0.4, cm ? "#a855f7" : "#38bdf8");
        grad.addColorStop(0.8, cm ? "rgba(126, 34, 206, 0.55)" : "rgba(37, 99, 235, 0.45)");
        grad.addColorStop(1, "rgba(37, 99, 235, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, cm ? 28 : 24, 0, Math.PI * 2);
        c.fill();

        // Jagged Chidori lightning arcs
        c.strokeStyle = cm ? "#e9d5ff" : "#e0f2fe";
        c.lineWidth = 2.2;
        c.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + t;
          const midR = 14 + ((i + Math.floor(t)) % 3) * 4;
          const endR = 26 + (i % 2) * 6;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(a + 0.25) * midR, Math.sin(a + 0.25) * midR);
          c.lineTo(Math.cos(a - 0.15) * endR, Math.sin(a - 0.15) * endR);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Final Valley Clash: Naruto's Rasengan vs Sasuke's Chidori ----
  function spawnRasenganChidoriClash(b1, b2) {
    const naruto = b1.rasenganTimer > 0 ? b1 : b2;
    const sasuke = naruto === b1 ? b2 : b1;
    const duration = 2.0;

    return {
      isTimeStopEntity: true,
      naruto,
      sasuke,
      life: duration,
      maxLife: duration,
      meter: 0.5,
      meterVel: (Math.random() - 0.5) * 0.6,
      resolved: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (!this.naruto.alive || !this.sasuke.alive) {
          this.naruto._jutsuClashTimer = 0;
          this.sasuke._jutsuClashTimer = 0;
          this.dead = true;
          return;
        }

        // Keep both locked face-to-face around the clash midpoint
        const midX = (this.naruto.x + this.sasuke.x) * 0.5;
        const midY = (this.naruto.y + this.sasuke.y) * 0.5;
        const dx = this.sasuke.x - this.naruto.x;
        const dy = this.sasuke.y - this.naruto.y;
        const ang = Math.atan2(dy, dx) || 0;
        const sep = (this.naruto.radius + this.sasuke.radius) * 0.5 + 18;

        this.naruto.x = midX - Math.cos(ang) * sep;
        this.naruto.y = midY - Math.sin(ang) * sep;
        this.sasuke.x = midX + Math.cos(ang) * sep;
        this.sasuke.y = midY + Math.sin(ang) * sep;
        this.naruto.vx = 0;
        this.naruto.vy = 0;
        this.sasuke.vx = 0;
        this.sasuke.vy = 0;

        this.meterVel += (Math.random() - 0.5) * 4.5 * dt;
        if (this.sasuke.curseMarkMode || this.sasuke.susanooArmorMode) this.meterVel -= 1.4 * dt;
        this.meterVel *= 0.94;
        this.meter = Math.max(0.22, Math.min(0.78, this.meter + this.meterVel * dt));

        if (Math.random() < 0.5 && g.spawnSparks) {
          g.spawnSparks(midX, midY, "#38bdf8", "#ffffff");
        }
        g.shake = Math.max(g.shake || 0, 5);

        if (this.life <= 0 && !this.resolved) {
          this.resolved = true;
          this.naruto._jutsuClashTimer = 0;
          this.sasuke._jutsuClashTimer = 0;

          const narutoWins = this.meter >= 0.5;
          const winner = narutoWins ? this.naruto : this.sasuke;
          const loser = narutoWins ? this.sasuke : this.naruto;

          const dmgLoser = g.applyDamage(loser, 14);
          loser.flashTimer = 0.28;
          winner.flashTimer = 0.14;
          if (g.chargeUlt) g.chargeUlt(winner);

          const pushAng = Math.atan2(loser.y - winner.y, loser.x - winner.x) || 0;
          loser.vx = Math.cos(pushAng) * 920;
          loser.vy = Math.sin(pushAng) * 920;
          winner.vx = -Math.cos(pushAng) * 220;
          winner.vy = -Math.sin(pushAng) * 220;
          g.addEffect(loser, "stun", 0.7);

          g.entities.push(rt.spawnShockRing(midX, midY, "#09090b", 220, 0.48));
          g.entities.push(rt.spawnShockRing(midX, midY, "#ffffff", 170, 0.38));
          g.entities.push(rt.spawnShockRing(midX, midY, "#38bdf8", 130, 0.3));
          g.spawnSparks(midX, midY, "#ffffff", "#38bdf8");
          g.spawnDamageText(loser.x, loser.y - loser.radius - 18, dmgLoser, "#38bdf8", true, "CLASH LOST!");
          g.spawnDamageText(winner.x, winner.y - winner.radius - 20, "+1 ULT!", "#fde047", true);
          g.shake = Math.max(g.shake || 0, 20);
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          this.dead = true;
        }
      },
      render() {},
      renderOverlay(c) {
        if (!this.naruto.alive || !this.sasuke.alive) return;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const midX = (this.naruto.x + this.sasuke.x) * 0.5;
        const midY = (this.naruto.y + this.sasuke.y) * 0.5;
        const t = performance.now() * 0.015;

        c.save();
        // Dramatic dark Final Valley backdrop
        c.fillStyle = `rgba(4, 6, 18, ${0.44 + p * 0.22})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Swirling blue Rasengan wind rings on Naruto's side
        c.save();
        c.translate(this.naruto.x, this.naruto.y);
        for (let r = 0; r < 3; r++) {
          const rad = this.naruto.radius + 10 + r * 9 + Math.sin(t * 2 + r) * 3;
          c.strokeStyle = r === 0 ? "#ffffff" : "#0ea5e9";
          c.lineWidth = 3 - r * 0.6;
          c.beginPath();
          c.arc(0, 0, rad, t * 0.9 + r * 2.1, t * 0.9 + r * 2.1 + Math.PI * 1.35);
          c.stroke();
        }
        c.restore();

        // Jagged Chidori lightning arcs on Sasuke's side
        c.save();
        c.strokeStyle = "#a5f3fc";
        c.lineWidth = 2.4;
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI) / 3 + t * 0.55;
          const sr = this.sasuke.radius + 6;
          const er = this.sasuke.radius + 24 + (i % 2) * 10;
          c.beginPath();
          c.moveTo(this.sasuke.x + Math.cos(ang) * sr, this.sasuke.y + Math.sin(ang) * sr);
          c.lineTo(this.sasuke.x + Math.cos(ang + 0.2) * ((sr + er) * 0.5), this.sasuke.y + Math.sin(ang + 0.2) * ((sr + er) * 0.5));
          c.lineTo(this.sasuke.x + Math.cos(ang - 0.12) * er, this.sasuke.y + Math.sin(ang - 0.12) * er);
          c.stroke();
        }
        c.restore();

        // Contrasting black & white energy sphere at the clash point
        const orbR = 26 + p * 34 + Math.sin(t * 2.5) * 4;
        const gOrb = c.createRadialGradient(midX, midY, 4, midX, midY, orbR * 1.45);
        gOrb.addColorStop(0, "#ffffff");
        gOrb.addColorStop(0.45, "#09090b");
        gOrb.addColorStop(0.75, "rgba(56, 189, 248, 0.85)");
        gOrb.addColorStop(1, "rgba(37, 99, 235, 0)");
        c.fillStyle = gOrb;
        c.beginPath();
        c.arc(midX, midY, orbR * 1.45, 0, Math.PI * 2);
        c.fill();

        // Inner high-contrast black core with white rim
        c.fillStyle = "#09090b";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 3.5;
        c.beginPath();
        c.arc(midX, midY, orbR * 0.62, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Wild lightning bolts & Rasengan chakra rings radiating from the clash
        c.strokeStyle = "#7dd3fc";
        c.lineWidth = 2.4;
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 + t * 0.35;
          const r1 = orbR * 0.7;
          const r2 = orbR * (1.35 + (i % 3) * 0.35);
          c.beginPath();
          c.moveTo(midX + Math.cos(a) * r1, midY + Math.sin(a) * r1);
          c.lineTo(midX + Math.cos(a + 0.16) * ((r1 + r2) * 0.5), midY + Math.sin(a + 0.16) * ((r1 + r2) * 0.5));
          c.lineTo(midX + Math.cos(a - 0.1) * r2, midY + Math.sin(a - 0.1) * r2);
          c.stroke();
        }

        // Tug-of-war Clash Meter Bar (Top-Center)
        const narutoIsLeft = this.naruto.x <= this.sasuke.x;
        const leftB = narutoIsLeft ? this.naruto : this.sasuke;
        const rightB = narutoIsLeft ? this.sasuke : this.naruto;
        const leftCol = narutoIsLeft ? "#0ea5e9" : "#8b5cf6";
        const rightCol = narutoIsLeft ? "#8b5cf6" : "#0ea5e9";
        const leftRatio = narutoIsLeft ? this.meter : 1 - this.meter;
        const p1Pct = Math.round(leftRatio * 100);
        const p2Pct = 100 - p1Pct;

        const barW = 320;
        const barH = 24;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 72;
        const splitX = barX + barW * leftRatio;

        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 5;
        c.strokeText("RASENGAN  VS  CHIDORI !!", WORLD_SIZE * 0.5, barY - 16);
        c.fillStyle = "#38bdf8";
        c.fillText("RASENGAN  VS  CHIDORI !!", WORLD_SIZE * 0.5, barY - 16);

        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.roundRect(barX, barY + 4, barW, barH, 9);
        c.fill();

        c.save();
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 9);
        c.clip();
        c.fillStyle = leftCol;
        c.fillRect(barX, barY, barW * leftRatio, barH);
        c.fillStyle = rightCol;
        c.fillRect(splitX, barY, barW * (1 - leftRatio), barH);
        c.fillStyle = "rgba(255, 255, 255, 0.24)";
        c.fillRect(barX, barY, barW, barH * 0.42);
        c.restore();

        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.5;
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 9);
        c.stroke();

        // Glowing clash divider needle
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(splitX - 4, barY - 5, 8, barH + 10, 3);
        c.fill();
        c.stroke();

        c.font = `bold 12px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        const lName = (leftB.shortName || leftB.costume || "P1").toUpperCase();
        const rName = (rightB.shortName || rightB.costume || "P2").toUpperCase();

        c.textAlign = "left";
        const lTxt = `${lName} ${p1Pct}%`;
        c.strokeText(lTxt, barX + 10, barY + barH * 0.5);
        c.fillStyle = p1Pct >= p2Pct ? COLORS.gold : COLORS.white;
        c.fillText(lTxt, barX + 10, barY + barH * 0.5);

        c.textAlign = "right";
        const rTxt = `${p2Pct}% ${rName}`;
        c.strokeText(rTxt, barX + barW - 10, barY + barH * 0.5);
        c.fillStyle = p2Pct > p1Pct ? COLORS.gold : COLORS.white;
        c.fillText(rTxt, barX + barW - 10, barY + barH * 0.5);

        c.restore();

        if (BF.drawClashCutin) {
          BF.drawClashCutin(c, leftB, rightB, leftCol, rightCol, p, "FINAL VALLEY CLASH!");
        }
      },
    };
  }

  BF.checkChidoriRasenganClash = (g) => {
    if (!g || !g.balls || g.balls.length < 2) return;
    for (let i = 0; i < g.balls.length; i++) {
      const b1 = g.balls[i];
      if (!b1.alive || b1._jutsuClashTimer > 0) continue;
      for (let j = i + 1; j < g.balls.length; j++) {
        const b2 = g.balls[j];
        if (!b2.alive || b2._jutsuClashTimer > 0) continue;
        const pair1 = b1.chidoriTimer > 0 && b2.rasenganTimer > 0;
        const pair2 = b2.chidoriTimer > 0 && b1.rasenganTimer > 0;
        if (!pair1 && !pair2) continue;
        const dist = Math.hypot(b2.x - b1.x, b2.y - b1.y);
        if (dist <= b1.radius + b2.radius + 16) {
          b1.chidoriTimer = 0;
          b2.chidoriTimer = 0;
          b1.rasenganTimer = 0;
          b2.rasenganTimer = 0;
          b1.chidoriHit = true;
          b2.chidoriHit = true;
          b1.rasenganHit = true;
          b2.rasenganHit = true;
          b1._jutsuClashTimer = 2.0;
          b2._jutsuClashTimer = 2.0;
          g.entities.push(spawnRasenganChidoriClash(b1, b2));
          g.spawnDamageText((b1.x + b2.x) * 0.5, (b1.y + b2.y) * 0.5 - 32, 0, "#ffffff", true, "JUTSU CLASH!");
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
          return;
        }
      }
    }
  };

  // ---- Skill 2: Fireball Jutsu / Amaterasu Black Flame (Evolved) ----
  function spawnFireballJutsu(owner, x, y, angle) {
    const cm = Boolean(owner.curseMarkMode);
    const ev = Boolean(owner.evolved || owner.susanooArmorMode);
    const speed = owner.susanooArmorMode ? 550 : cm ? 530 : ev ? 500 : 470;
    const dmg = owner.susanooArmorMode ? 14 : cm ? 13 : ev ? 11 : 8;
    return {
      owner,
      cm,
      ev,
      dmg,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: (cm || owner.susanooArmorMode) ? 23 : 20,
      life: 1.25,
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
        const target = pickEnemy(this.owner, g);
        if (target && Math.hypot(target.x - this.x, target.y - this.y) <= target.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(target, this.dmg || (this.cm ? 13 : 8));
          target.flashTimer = 0.16;
          target.squash = 0.82;
          g.chargeUlt(this.owner);
          const isBlackFlame = this.ev && !this.cm;
          const rCol = isBlackFlame ? "#09090b" : this.cm ? "#a855f7" : "#f97316";
          const lbl = isBlackFlame ? "AMATERASU!" : this.cm ? "CURSED DRAGON FLAME!" : "KATON: FIREBALL!";
          g.entities.push(rt.spawnShockRing(this.x, this.y, isBlackFlame ? "#a855f7" : rCol, (this.cm || this.ev) ? 112 : 92, 0.28));
          g.entities.push(rt.spawnShockRing(this.x, this.y, isBlackFlame ? "#09090b" : "#ef4444", 68, 0.22));
          g.spawnSparks(this.x, this.y, isBlackFlame ? "#09090b" : (this.cm ? "#c084fc" : "#fde047"), isBlackFlame ? "#a855f7" : "#dc2626");
          g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, isBlackFlame ? "#c084fc" : rCol, true, lbl);
          g.shake = Math.max(g.shake || 0, (this.cm || this.ev) ? 10 : 7);
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
        }
      },
      render(c) {
        const ang = Math.atan2(this.vy, this.vx);
        c.save();
        c.translate(this.x, this.y);
        c.rotate(ang);

        // Blazing flame tail
        const tailGrad = c.createLinearGradient(-46, 0, 12, 0);
        tailGrad.addColorStop(0, "rgba(220, 38, 38, 0)");
        tailGrad.addColorStop(0.6, "rgba(249, 115, 22, 0.78)");
        tailGrad.addColorStop(1, "#fde047");
        c.fillStyle = tailGrad;
        c.beginPath();
        c.moveTo(8, -this.radius * 0.9);
        c.lineTo(-46 - Math.sin(this.t * 24) * 6, 0);
        c.lineTo(8, this.radius * 0.9);
        c.closePath();
        c.fill();

        // Fireball core (or Black-Violet Amaterasu Flame when Evolved)
        const fg = c.createRadialGradient(4, 0, 2, 0, 0, this.radius);
        if (this.ev && !this.cm) {
          fg.addColorStop(0, "#09090b");
          fg.addColorStop(0.55, "#18181b");
          fg.addColorStop(0.85, "#a855f7");
          fg.addColorStop(1, "#581c87");
        } else {
          fg.addColorStop(0, "#ffffff");
          fg.addColorStop(0.35, "#fde047");
          fg.addColorStop(0.75, "#f97316");
          fg.addColorStop(1, "#b91c1c");
        }
        c.fillStyle = fg;
        c.strokeStyle = (this.ev && !this.cm) ? "#c084fc" : COLORS.ink;
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Ultimate: Kirin (Thunderstorm Clouds -> Giant Lightning Dragon Strike) ----
  BF.spawnKirinUltimate = (owner, g) => {
    const target = pickEnemy(owner, g) || { x: WORLD_SIZE * 0.5, y: WORLD_SIZE * 0.5, radius: 28, alive: true };
    const rainDrops = Array.from({ length: 34 }, () => ({
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      len: 12 + Math.random() * 14,
      spd: 480 + Math.random() * 220,
    }));

    const ent = {
      owner,
      target,
      phase: "storm", // "storm" (0.95s) -> "strike" (0.75s)
      elapsed: 0,
      phaseElapsed: 0,
      hitX: target.x,
      hitY: target.y,
      struck: false,
      dead: false,
      update(dt, gg) {
        this.elapsed += dt;
        this.phaseElapsed += dt;

        for (const r of rainDrops) {
          r.y += r.spd * dt;
          r.x -= r.spd * 0.18 * dt;
          if (r.y > WORLD_SIZE) { r.y = -20; r.x = Math.random() * WORLD_SIZE; }
          if (r.x < 0) r.x += WORLD_SIZE;
        }

        if (this.phase === "storm") {
          if (this.target && this.target.alive) {
            this.hitX = this.target.x;
            this.hitY = this.target.y;
          }
          if (this.phaseElapsed >= 0.95) {
            this.phase = "strike";
            this.phaseElapsed = 0;
          }
        } else if (this.phase === "strike") {
          if (!this.struck) {
            this.struck = true;
            for (const enemy of gg.balls) {
              if (enemy === this.owner || !enemy.alive) continue;
              const d = Math.hypot(enemy.x - this.hitX, enemy.y - this.hitY);
              if (d <= 155 + enemy.radius) {
                const dealt = gg.applyDamage(enemy, 38);
                enemy.flashTimer = 0.28;
                enemy.squash = 0.58;
                gg.addEffect(enemy, "stun", 0.65);
                const pushA = Math.atan2(enemy.y - this.hitY, enemy.x - this.hitX) || 0;
                enemy.vx = Math.cos(pushA) * 540;
                enemy.vy = Math.sin(pushA) * 540;
                gg.spawnDamageText(enemy.x, enemy.y - enemy.radius - 20, dealt, "#38bdf8", true, "K I R I N !!");
              }
            }
            gg.entities.push(rt.spawnShockRing(this.hitX, this.hitY, "#ffffff", 185, 0.42));
            gg.entities.push(rt.spawnShockRing(this.hitX, this.hitY, "#38bdf8", 145, 0.36));
            gg.entities.push(rt.spawnShockRing(this.hitX, this.hitY, "#1d4ed8", 105, 0.28));
            gg.spawnSparks(this.hitX, this.hitY, "#ffffff", "#38bdf8");
            gg.shake = Math.max(gg.shake || 0, 22);
            if (gg.sound && gg.sound.playBallHit) gg.sound.playBallHit();
          }

          if (this.phaseElapsed >= 0.75) {
            this.dead = true;
          }
        }
      },
      render() {},
      renderOverlay(c) {
        c.save();
        // 1. Overcast Thunderstorm Sky + Rain Streaks
        const skyAlpha = this.phase === "storm"
          ? Math.min(0.68, this.phaseElapsed * 1.4)
          : Math.max(0, 0.68 * (1 - this.phaseElapsed / 0.75));
        c.fillStyle = `rgba(8, 12, 32, ${skyAlpha})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Distant thundercloud flicker during storm
        if (this.phase === "storm" && Math.sin(this.elapsed * 28) > 0.84) {
          c.fillStyle = "rgba(186, 230, 253, 0.16)";
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        }

        // Falling storm rain streaks
        c.strokeStyle = `rgba(186, 230, 253, ${skyAlpha * 0.85})`;
        c.lineWidth = 1.4;
        c.beginPath();
        for (const r of rainDrops) {
          c.moveTo(r.x, r.y);
          c.lineTo(r.x - r.len * 0.18, r.y + r.len);
        }
        c.stroke();

        // Dark rolling storm clouds across top of arena
        c.save();
        c.globalAlpha = Math.min(1, skyAlpha * 1.45);
        c.fillStyle = "#1e293b";
        c.strokeStyle = "#09090b";
        c.lineWidth = 2.5;
        for (let i = 0; i < 7; i++) {
          const cx = i * 82 + Math.sin(this.elapsed * 2 + i) * 8;
          const cy = 22 + (i % 2) * 12;
          c.beginPath();
          c.arc(cx, cy, 46, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
        c.restore();

        if (this.phase === "storm") {
          // Target ground lightning lock-on ring
          const p = Math.min(1, this.phaseElapsed / 0.95);
          c.strokeStyle = `rgba(56, 189, 248, ${0.4 + p * 0.6})`;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(this.hitX, this.hitY, 92 - p * 46, 0, Math.PI * 2);
          c.stroke();

          c.font = "900 20px Impact, system-ui, sans-serif";
          c.textAlign = "center";
          c.strokeStyle = "#09090b";
          c.lineWidth = 5;
          c.strokeText("BEGONE WITH THE THUNDERCLAP...", WORLD_SIZE * 0.5, 92);
          c.fillStyle = "#bae6fd";
          c.fillText("BEGONE WITH THE THUNDERCLAP...", WORLD_SIZE * 0.5, 92);
        }

        if (this.phase === "strike") {
          const p = Math.min(1, this.phaseElapsed / 0.75);
          const a = Math.max(0, 1 - p * 0.85);

          // Screen flash on impact
          if (this.phaseElapsed < 0.09) {
            c.fillStyle = "rgba(224, 242, 254, 0.85)";
            c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
          }

          // Plunging Kirin Lightning Column + Serpent Dragon Head
          const dropY = Math.min(this.hitY, -40 + (this.hitY + 40) * Math.min(1, this.phaseElapsed / 0.14));
          c.save();
          c.globalAlpha = a;
          c.shadowColor = "#38bdf8";
          c.shadowBlur = 24;

          // Electric blue lightning pillar body descending from storm clouds
          c.strokeStyle = "#0284c7";
          c.lineWidth = 44 * (1 - p * 0.35);
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(this.hitX - 18, 0);
          c.lineTo(this.hitX + 12, dropY * 0.45);
          c.lineTo(this.hitX - 10, dropY * 0.75);
          c.lineTo(this.hitX, dropY);
          c.stroke();

          c.strokeStyle = "#ffffff";
          c.lineWidth = 18 * (1 - p * 0.35);
          c.stroke();

          // Giant Kirin Thunder Dragon Head at impact tip
          c.translate(this.hitX, dropY);
          c.fillStyle = "#38bdf8";
          c.strokeStyle = "#ffffff";
          c.lineWidth = 3;
          // Dragon horns sweeping up
          c.beginPath();
          c.moveTo(-26, -34);
          c.lineTo(-46, -86);
          c.lineTo(-14, -48);
          c.lineTo(0, -64);
          c.lineTo(14, -48);
          c.lineTo(46, -86);
          c.lineTo(26, -34);
          // Fierce dragon snout & jaw
          c.lineTo(34, -4);
          c.lineTo(0, 26);
          c.lineTo(-34, -4);
          c.closePath();
          c.fill();
          c.stroke();

          // White lightning core inside dragon head + glowing eyes
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.moveTo(-16, -24);
          c.lineTo(16, -24);
          c.lineTo(0, 14);
          c.closePath();
          c.fill();

          c.fillStyle = "#facc15";
          c.beginPath();
          c.arc(-13, -12, 4.5, 0, Math.PI * 2);
          c.arc(13, -12, 4.5, 0, Math.PI * 2);
          c.fill();
          c.restore();

          c.save();
          c.globalAlpha = a;
          c.font = "900 34px Impact, system-ui, sans-serif";
          c.textAlign = "center";
          c.strokeStyle = "#09090b";
          c.lineWidth = 6;
          c.strokeText("K I R I N ! !", WORLD_SIZE * 0.5, 92);
          c.fillStyle = "#38bdf8";
          c.fillText("K I R I N ! !", WORLD_SIZE * 0.5, 92);
          c.restore();
        }
        c.restore();
      },
    };
    g.entities.push(ent);
  };

  // ---- Evolved Base Ultimate: Armored Susanoo + Kagutsuchi Flame Arrows ----
  function spawnSusanooFlameArrow(owner, x, y, angle) {
    const speed = 640;
    return {
      owner,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 16,
      life: 1.15,
      t: 0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.t += dt;
        if (this.life <= 0) { this.dead = true; return; }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30) {
          this.dead = true; return;
        }
        const target = pickEnemy(this.owner, g);
        if (target && Math.hypot(target.x - this.x, target.y - this.y) <= target.radius + this.radius + 4) {
          this.dead = true;
          const dealt = g.applyDamage(target, 12);
          target.flashTimer = 0.2;
          target.squash = 0.78;
          g.addEffect(target, "stun", 0.28);
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#a855f7", 105, 0.3));
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#09090b", 70, 0.22));
          g.spawnSparks(this.x, this.y, "#e9d5ff", "#a855f7");
          g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#c084fc", true, "SUSANOO ARROW!");
          g.shake = Math.max(g.shake || 0, 10);
          if (g.sound && g.sound.playBallHit) g.sound.playBallHit();
        }
      },
      render(c) {
        const ang = Math.atan2(this.vy, this.vx);
        c.save();
        c.translate(this.x, this.y);
        c.rotate(ang);
        c.fillStyle = "#c084fc";
        c.strokeStyle = "#581c87";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(28, 0);
        c.lineTo(8, -10);
        c.lineTo(12, -4);
        c.lineTo(-34, -3);
        c.lineTo(-42, -9);
        c.lineTo(-36, 0);
        c.lineTo(-42, 9);
        c.lineTo(-34, 3);
        c.lineTo(12, 4);
        c.lineTo(8, 10);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.moveTo(22, 0);
        c.lineTo(-26, -1.5);
        c.lineTo(-26, 1.5);
        c.closePath();
        c.fill();
        c.restore();
      },
    };
  }

  function drawArmoredSusanoo(c, sx, sy, scale, t, alpha = 0.86) {
    c.save();
    c.translate(sx, sy);
    const pulse = 1 + Math.sin(t * 6) * 0.035;
    c.scale(scale * pulse, scale * pulse);
    c.globalAlpha = alpha;

    // Lore-accurate Armored Susanoo: wide flared ribbed purple armor cloak & flaming top
    c.fillStyle = "rgba(147, 51, 234, 0.58)";
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 2.6;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-54, 34);
    c.lineTo(-66, -24);
    c.lineTo(-32, -38);
    c.lineTo(-16, -66);
    c.lineTo(0, -76);
    c.lineTo(16, -66);
    c.lineTo(32, -38);
    c.lineTo(66, -24);
    c.lineTo(54, 34);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = "rgba(88, 28, 135, 0.85)";
    c.lineWidth = 1.8;
    for (const rx of [-36, -22, 22, 36]) {
      c.beginPath();
      c.moveTo(rx, -30);
      c.lineTo(rx * 0.88, 30);
      c.stroke();
    }

    // Skeletal grinning Susanoo skull face + glowing yellow eyes
    c.fillStyle = "#581c87";
    c.strokeStyle = "#d8b4fe";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-16, -52);
    c.lineTo(0, -60);
    c.lineTo(16, -52);
    c.lineTo(12, -26);
    c.lineTo(0, -20);
    c.lineTo(-12, -26);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#fef08a";
    c.beginPath();
    c.ellipse(-6.5, -43, 4.2, 2.5, 0.22, 0, Math.PI * 2);
    c.ellipse(6.5, -43, 4.2, 2.5, -0.22, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 1.3;
    for (let tx = -7; tx <= 7; tx += 3.5) {
      c.beginPath();
      c.moveTo(tx, -30);
      c.lineTo(tx, -24);
      c.stroke();
    }

    // Purple Susanoo Bow & arrow
    c.strokeStyle = "#c084fc";
    c.lineWidth = 4;
    c.beginPath();
    c.arc(42, 6, 26, -Math.PI * 0.45, Math.PI * 0.45);
    c.stroke();
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(46, -19);
    c.lineTo(46, 31);
    c.stroke();
    c.restore();
  }

  function drawIndraSusanoo(c, sx, sy, scale, tNow, pull = 0.7, tipDist = null) {
    c.save();
    c.translate(sx, sy);
    c.scale(scale, scale);

    // Rich purple-cyan chakra aura halo
    const aura = c.createRadialGradient(0, 0, 18, 0, 0, 185);
    aura.addColorStop(0, "rgba(56, 189, 248, 0.5)");
    aura.addColorStop(0.5, "rgba(126, 34, 206, 0.38)");
    aura.addColorStop(1, "rgba(15, 23, 42, 0)");
    c.fillStyle = aura;
    c.beginPath();
    c.arc(0, 0, 185, 0, Math.PI * 2);
    c.fill();

    // 6 Multi-Branched Jagged Cyan Indra Lightning Wings (lore accurate!)
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const side of [-1, 1]) {
      for (let wg = 0; wg < 3; wg++) {
        const flutter = Math.sin(tNow * 8 + wg) * 0.04;
        const ang = -0.22 - wg * 0.36 + flutter;
        const len = 136 + wg * 24;
        const p1x = side * Math.cos(ang) * len * 0.36;
        const p1y = -14 + Math.sin(ang) * len * 0.36;
        const p2x = side * Math.cos(ang + 0.1) * len * 0.7;
        const p2y = -14 + Math.sin(ang + 0.1) * len * 0.7;
        const p3x = side * Math.cos(ang - 0.15) * len;
        const p3y = -14 + Math.sin(ang - 0.15) * len;

        c.strokeStyle = "#38bdf8";
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(side * 22, -14);
        c.lineTo(p1x, p1y);
        c.lineTo(p2x, p2y);
        c.lineTo(p3x, p3y);
        c.stroke();

        // Forked secondary lightning branch off wing
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(p1x, p1y);
        c.lineTo(p1x + side * 28, p1y - 26);
        c.moveTo(p2x, p2y);
        c.lineTo(p2x + side * 24, p2y + 18);
        c.stroke();

        c.strokeStyle = "#ffffff";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(side * 22, -14);
        c.lineTo(p1x, p1y);
        c.lineTo(p2x, p2y);
        c.lineTo(p3x, p3y);
        c.stroke();
      }
    }

    // Pleated Samurai Kusazuri Waist Skirt with individual armor plates
    c.fillStyle = "rgba(107, 33, 168, 0.92)";
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-40, 22);
    c.lineTo(40, 22);
    c.lineTo(62, 74);
    c.lineTo(-62, 74);
    c.closePath();
    c.fill();
    c.stroke();
    c.strokeStyle = "#c084fc";
    c.lineWidth = 1.6;
    for (const px of [-24, -8, 8, 24]) {
      c.beginPath();
      c.moveTo(px, 24);
      c.lineTo(px * 1.4, 72);
      c.stroke();
    }

    // Waist Sash Belt & Side Armor Plates
    c.fillStyle = "#581c87";
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 2;
    c.fillRect(-42, 16, 84, 11);
    c.strokeRect(-42, 16, 84, 11);

    // Layered Samurai Torso & Horned Shoulder Pauldrons
    c.fillStyle = "rgba(126, 34, 206, 0.94)";
    c.beginPath();
    c.moveTo(-40, 18);
    c.lineTo(-74, -20);
    c.lineTo(-48, -42);
    c.lineTo(-28, -36);
    c.lineTo(28, -36);
    c.lineTo(48, -42);
    c.lineTo(74, -20);
    c.lineTo(40, 18);
    c.closePath();
    c.fill();
    c.stroke();

    // Glowing cyan/violet chest armor plates & energy lines
    c.strokeStyle = "#67e8f9";
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-30, -28);
    c.lineTo(0, -4);
    c.lineTo(30, -28);
    c.moveTo(-22, -8);
    c.lineTo(0, 10);
    c.lineTo(22, -8);
    c.stroke();

    // Horned Tengu Samurai Helm & Long Tengu Nose/Mask
    c.fillStyle = "#581c87";
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-24, -34);
    c.lineTo(-36, -68);
    c.lineTo(-12, -58);
    c.lineTo(0, -80);
    c.lineTo(12, -58);
    c.lineTo(36, -68);
    c.lineTo(24, -34);
    c.lineTo(0, -24);
    c.closePath();
    c.fill();
    c.stroke();

    // Glowing Cyan Tengu Eyes & Cheek Armor Slits
    c.fillStyle = "#67e8f9";
    c.beginPath();
    c.ellipse(-10, -46, 5.5, 3, 0.22, 0, Math.PI * 2);
    c.ellipse(10, -46, 5.5, 3, -0.22, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e9d5ff";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -45);
    c.lineTo(0, -30);
    c.stroke();

    // Ornate Giant Cyan Indra Lightning Bow
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 6.5;
    c.beginPath();
    c.arc(0, -6, 94, 0.14, Math.PI - 0.14);
    c.stroke();
    c.strokeStyle = "#ffffff";
    c.lineWidth = 2.2;
    c.stroke();

    // Bowstring & Barbed Indra's Arrow
    const stringPullY = -36 - pull * 22;
    c.strokeStyle = "rgba(165, 243, 252, 0.85)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-92, 8);
    c.lineTo(0, stringPullY);
    c.lineTo(92, 8);
    c.stroke();

    const endY = tipDist !== null ? tipDist : 98;
    c.strokeStyle = "#67e8f9";
    c.lineWidth = tipDist !== null && tipDist > 120 ? 14 : 7;
    c.beginPath();
    c.moveTo(0, stringPullY);
    c.lineTo(0, endY);
    c.stroke();
    c.strokeStyle = "#ffffff";
    c.lineWidth = tipDist !== null && tipDist > 120 ? 6 : 2.4;
    c.stroke();

    // Barbed arrow head
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(0, endY + 14);
    c.lineTo(-11, endY - 6);
    c.lineTo(0, endY);
    c.lineTo(11, endY - 6);
    c.closePath();
    c.fill();
    c.stroke();

    c.restore();
  }

  BF.spawnArmoredSusanooUltimate = (owner, g) => {
    g.addEffect(owner, "shield", 7.0, { reduction: 0.25 });
    const shotTimes = [0.45, 2.35, 4.35];
    let shotsFired = 0;

    const ent = {
      owner,
      t: 0,
      life: 7.0,
      dead: false,
      update(dt, gg) {
        this.t += dt;
        this.life -= dt;
        if (!this.owner.alive || this.life <= 0) {
          this.dead = true;
          return;
        }
        while (shotsFired < shotTimes.length && this.t >= shotTimes[shotsFired]) {
          shotsFired += 1;
          const target = pickEnemy(this.owner, gg);
          if (target) {
            const aim = Math.atan2(target.y - this.owner.y, target.x - this.owner.x);
            gg.entities.push(spawnSusanooFlameArrow(this.owner, this.owner.x, this.owner.y - 14, aim));
            gg.spawnSparks(this.owner.x, this.owner.y - 14, "#e9d5ff", "#a855f7");
            if (gg.sound && gg.sound.playCritHit) gg.sound.playCritHit();
          }
        }
      },
      render(c) {
        if (!this.owner.alive) return;
        const fade = this.life < 0.5 ? Math.max(0, this.life / 0.5) : Math.min(1, this.t / 0.3);
        drawArmoredSusanoo(c, this.owner.x, this.owner.y - 8, 1, this.t, 0.86 * fade);
      },
    };
    g.entities.push(ent);
  };

  // ---- Susanoo Armor Ultimate: Giant Indra Susanoo Outside Arena -> Indra's Arrow (1-Map Hit + Arena Lightning) ----
  BF.spawnIndraArrowUltimate = (owner, g) => {
    const startX = owner.x;
    const startY = owner.y;
    const totalDur = 3.55;
    let arrowFired = false;
    let shockTick = 0;

    let extCanvas = null;
    let extCtx = null;
    if (typeof document !== "undefined" && document.body && document.createElement) {
      extCanvas = document.createElement("canvas");
      extCanvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:95;";
      extCanvas.width = window.innerWidth || 1280;
      extCanvas.height = window.innerHeight || 720;
      document.body.appendChild(extCanvas);
      extCtx = extCanvas.getContext("2d");
    }

    const cleanupExt = () => {
      owner._hiddenOffScreen = false;
      if (extCanvas && extCanvas.parentNode) {
        extCanvas.parentNode.removeChild(extCanvas);
      }
      extCanvas = null;
      extCtx = null;
    };

    const drawExternalIndraSusanoo = (tNow) => {
      if (!extCtx || !extCanvas) return;
      const w = extCanvas.width;
      const h = extCanvas.height;
      extCtx.clearRect(0, 0, w, h);

      const arenaEl = document.querySelector(".arena-wrap canvas") || document.getElementById("gameCanvas");
      const rect = arenaEl ? arenaEl.getBoundingClientRect() : { left: w * 0.5 - 220, top: h * 0.34, width: 440, height: 440 };
      const arenaCX = rect.left + rect.width * 0.5;
      const arenaCY = rect.top + rect.height * 0.5;

      if (tNow >= 0.22 && tNow < 2.15) {
        const rise = Math.min(1, (tNow - 0.22) / 0.42);
        const fadeOut = tNow > 1.8 ? Math.max(0, 1 - (tNow - 1.8) / 0.35) : 1;
        const sx = arenaCX;
        const sy = Math.max(120, rect.top - 52) + (1 - rise) * 45;

        extCtx.save();
        extCtx.globalAlpha = rise * fadeOut;
        const pull = tNow < 1.25 ? Math.min(1, Math.max(0, (tNow - 0.55) / 0.65)) : 1;
        const tipDist = tNow >= 1.25 ? Math.min(arenaCY + rect.height * 0.45 - sy, 95 + (tNow - 1.25) * 1900) : null;
        drawIndraSusanoo(extCtx, sx, sy, 1.05, tNow, pull, tipDist);

        extCtx.font = "900 28px Impact, system-ui, sans-serif";
        extCtx.textAlign = "center";
        extCtx.strokeStyle = "#09090b";
        extCtx.lineWidth = 6;
        extCtx.strokeText("INDRA'S ARROW !!", sx, sy - 96);
        extCtx.fillStyle = "#67e8f9";
        extCtx.fillText("INDRA'S ARROW !!", sx, sy - 96);
        extCtx.restore();
      }
    };

    const ent = {
      owner,
      isTimeStopEntity: true,
      t: 0,
      life: totalDur,
      dead: false,
      update(dt, gg) {
        this.t += dt;
        this.life -= dt;
        if (!this.owner.alive || this.life <= 0) {
          cleanupExt();
          this.dead = true;
          return;
        }

        if (this.t < 0.55) {
          this.owner._hiddenOffScreen = true;
          this.owner.vx = 0;
          this.owner.vy = 0;
        } else if (this.t < 1.95) {
          this.owner._hiddenOffScreen = true;
          this.owner.vx = 0;
          this.owner.vy = 0;

          if (!arrowFired && this.t >= 1.25) {
            arrowFired = true;
            for (const enemy of gg.balls) {
              if (enemy !== this.owner && enemy.alive) {
                const dealt = gg.applyDamage(enemy, 42);
                enemy.flashTimer = 0.38;
                enemy.squash = 0.72;
                gg.addEffect(enemy, "stun", 1.0);
                gg.spawnDamageText(enemy.x, enemy.y - enemy.radius - 18, dealt, "#38bdf8", true, "INDRA'S ARROW!!");
              }
            }
            gg.entities.push(rt.spawnShockRing(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, "#38bdf8", 340, 0.55));
            gg.entities.push(rt.spawnShockRing(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, "#a855f7", 260, 0.45));
            gg.spawnSparks(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, "#ffffff", "#38bdf8");
            gg.shake = Math.max(gg.shake || 0, 28);
            if (gg.sound && gg.sound.playCritHit) gg.sound.playCritHit();
          }
        } else {
          if (this.owner._hiddenOffScreen) {
            this.owner._hiddenOffScreen = false;
            this.owner.x = startX;
            this.owner.y = startY;
            this.owner.vx = 0;
            this.owner.vy = 0;
            gg.entities.push(rt.spawnShockRing(startX, startY, "#38bdf8", 95, 0.32));
          }
          shockTick += dt;
          if (shockTick >= 0.45) {
            shockTick = 0;
            for (const enemy of gg.balls) {
              if (enemy !== this.owner && enemy.alive) {
                const tickDmg = gg.applyDamage(enemy, 2);
                enemy.flashTimer = 0.08;
                gg.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#a855f7");
                gg.spawnDamageText(enemy.x, enemy.y - enemy.radius - 8, tickDmg, "#7dd3fc", false);
              }
            }
          }
        }
      },
      render() {},
      renderOverlay(c) {
        drawExternalIndraSusanoo(this.t);

        c.save();
        const bgAlpha = this.t < 1.95 ? 0.36 : Math.max(0, 0.32 * (1 - (this.t - 1.95) / 1.6));
        c.fillStyle = `rgba(9, 6, 28, ${bgAlpha})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        if (this.t >= 1.25 && this.t <= 1.92) {
          const bp = 1 - (this.t - 1.25) / 0.67;
          c.save();
          c.globalAlpha = bp;
          const bx = WORLD_SIZE * 0.5;
          const beamW = 92 + (1 - bp) * 70;
          const bg = c.createLinearGradient(bx - beamW, 0, bx + beamW, 0);
          bg.addColorStop(0, "rgba(56, 189, 248, 0)");
          bg.addColorStop(0.3, "rgba(168, 85, 247, 0.8)");
          bg.addColorStop(0.5, "#ffffff");
          bg.addColorStop(0.7, "rgba(168, 85, 247, 0.8)");
          bg.addColorStop(1, "rgba(56, 189, 248, 0)");
          c.fillStyle = bg;
          c.fillRect(bx - beamW, 0, beamW * 2, WORLD_SIZE);

          c.fillStyle = `rgba(103, 232, 249, ${bp * 0.38})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
          c.restore();
        }

        if (this.t >= 1.3) {
          const fade = this.t > 2.9 ? Math.max(0, 1 - (this.t - 2.9) / 0.65) : 1;
          c.save();
          c.globalAlpha = 0.88 * fade;
          c.lineCap = "round";
          const seed = Math.floor(this.t * 18);
          for (let i = 0; i < 9; i++) {
            const x1 = ((seed * 97 + i * 131) % (WORLD_SIZE - 80)) + 40;
            const y1 = ((seed * 53 + i * 179) % (WORLD_SIZE - 80)) + 40;
            const x2 = x1 + (((seed + i) % 2 === 0 ? 1 : -1) * (54 + (i % 3) * 24));
            const y2 = y1 + (((seed + i * 3) % 2 === 0 ? 1 : -1) * (48 + (i % 2) * 28));
            c.strokeStyle = i % 2 === 0 ? "#38bdf8" : "#c084fc";
            c.lineWidth = 3.2;
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo((x1 + x2) * 0.5 + 14, (y1 + y2) * 0.5 - 12);
            c.lineTo(x2, y2);
            c.stroke();
            c.strokeStyle = "#ffffff";
            c.lineWidth = 1.4;
            c.stroke();
          }
          c.restore();
        }
        c.restore();
      },
    };
    g.entities.push(ent);
  };

  // ---- Skill 1: Chidori (Dash + Final Valley Clash vs Naruto's Rasengan!) ----
  const SKILL_CHIDORI = {
    name: "Chidori",
    cooldown: 3.4,
    onTick(ball, g) {
      const target = pickEnemy(ball, g);
      if (!target) return false;
      rt.beginCast(ball, {
        kind: "powerup",
        duration: 0.36,
        color: "#38bdf8",
        fire(b, gg) {
          const t = pickEnemy(b, gg);
          if (!t) return;
          const sa = Boolean(b.susanooArmorMode);
          const cm = Boolean(b.curseMarkMode);
          if (sa) {
            // Rinnegan Amenotejikara: swap/teleport near enemy before Onyx Chidori!
            const angOff = Math.atan2(b.y - t.y, b.x - t.x);
            gg.entities.push(rt.spawnShockRing(b.x, b.y, "#a855f7", 70, 0.25));
            b.x = Math.max(b.radius + 8, Math.min(WORLD_SIZE - b.radius - 8, t.x + Math.cos(angOff) * (t.radius + b.radius + 44)));
            b.y = Math.max(b.radius + 8, Math.min(WORLD_SIZE - b.radius - 8, t.y + Math.sin(angOff) * (t.radius + b.radius + 44)));
            gg.entities.push(rt.spawnShockRing(b.x, b.y, "#c084fc", 78, 0.28));
          }
          const dx = t.x - b.x;
          const dy = t.y - b.y;
          const len = Math.hypot(dx, dy) || 1;
          const dashSpd = sa ? 750 : cm ? 720 : 610;
          b.vx = (dx / len) * dashSpd;
          b.vy = (dy / len) * dashSpd;
          b.chidoriTimer = 0.52;
          b.chidoriHit = false;
          gg.entities.push(spawnChidoriHandFX(b));
          const col = sa ? "#c084fc" : cm ? "#a855f7" : "#38bdf8";
          const lbl = sa ? "AMENOTEJIKARA: CHIDORI!" : cm ? "DARK CHIDORI!" : "CHIDORI!";
          gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, col, true, lbl);
          gg.spawnSparks(b.x, b.y, (sa || cm) ? "#09090b" : "#ffffff", col);
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Fireball Jutsu ----
  const SKILL_FIREBALL = {
    name: "Fireball Jutsu",
    cooldown: 5.8,
    onTick(ball, g) {
      const target = pickEnemy(ball, g);
      if (!target) return false;
      rt.beginCast(ball, {
        kind: "fireball",
        duration: 0.32,
        color: "#f97316",
        fire(b, gg) {
          const t = pickEnemy(b, gg);
          if (!t) return;
          if (b.susanooArmorMode) {
            // Rinnegan Bansho Ten'in (Universal Pull): yanks enemy inward before firing Amaterasu!
            const pAng = Math.atan2(b.y - t.y, b.x - t.x);
            t.vx += Math.cos(pAng) * 340;
            t.vy += Math.sin(pAng) * 340;
            const pullDmg = gg.applyDamage(t, 4);
            gg.entities.push(rt.spawnShockRing(t.x, t.y, "#a855f7", 86, 0.28));
            gg.spawnDamageText(t.x, t.y - t.radius - 12, pullDmg, "#c084fc", true, "BANSHO TEN'IN!");
          }
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const m = rt.castMuzzle(b, aim, 14);
          gg.entities.push(spawnFireballJutsu(b, m.x, m.y, aim));
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

  // ---- Chibi Uchiha Sasuke Costume ----
  BF.COSTUME_DRAWERS.sasuke = (ball, r, c) => {
    const isUlt = ball.ultTimer > 0;
    const isCM = Boolean(ball.curseMarkMode);
    const isSA = Boolean(ball.susanooArmorMode);
    const isEv = Boolean(ball.evolved);
    const t = performance.now() * 0.004;

    if (ball.previewIndraSusanoo) {
      drawIndraSusanoo(c, 0, -4, 0.44, t, 0.75, null);
      return;
    } else if (ball.previewArmoredSusanoo) {
      drawArmoredSusanoo(c, 0, 14, 0.96, t, 0.92);
      return;
    }

    if (isSA) {
      // Susanoo Samurai Armor: Translucent purple Susanoo shoulder armor & ribcage aura
      c.save();
      c.fillStyle = "rgba(168, 85, 247, 0.42)";
      c.strokeStyle = "#c084fc";
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 1.32, r * 0.45);
      c.lineTo(-r * 1.44, -r * 0.35);
      c.lineTo(-r * 0.96, -r * 0.58);
      c.lineTo(r * 0.96, -r * 0.58);
      c.lineTo(r * 1.44, -r * 0.35);
      c.lineTo(r * 1.32, r * 0.45);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    } else if (isCM) {
      // Curse Mark Stage 2: Massive clawed hand-wings behind Sasuke + dark purple chakra aura
      const flap = Math.sin(t * 2.2) * 0.08;
      for (const side of [-1, 1]) {
        c.save();
        c.scale(side, 1);
        c.rotate(flap);
        c.fillStyle = "#78716c";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.6;
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(r * 0.25, r * 0.1);
        c.lineTo(r * 1.15, -r * 0.35);
        c.lineTo(r * 1.62, -r * 1.05); // top wing claw
        c.lineTo(r * 1.38, -r * 0.55);
        c.lineTo(r * 1.72, -r * 0.65); // mid-top claw
        c.lineTo(r * 1.38, -r * 0.18);
        c.lineTo(r * 1.56, r * 0.16);  // lower claw
        c.lineTo(r * 1.12, r * 0.36);
        c.lineTo(r * 0.32, r * 0.42);
        c.closePath();
        c.fill();
        c.stroke();

        // Dark CM2 wing spots & vein lines
        c.fillStyle = "#292524";
        c.beginPath();
        c.arc(r * 1.12, -r * 0.32, r * 0.09, 0, Math.PI * 2);
        c.arc(r * 1.28, -r * 0.04, r * 0.07, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      // Dark cursed aura wisps
      c.save();
      for (let i = 0; i < 6; i++) {
        const a = t * 1.4 + (i * Math.PI) / 3;
        c.strokeStyle = i % 2 === 0 ? "rgba(168, 85, 247, 0.78)" : "rgba(24, 24, 27, 0.75)";
        c.lineWidth = 2.8;
        c.beginPath();
        c.arc(0, 0, r * 1.22, a, a + 0.55);
        c.stroke();
      }
      c.restore();
    } else if (isUlt || isEv) {
      // Subtle electric-purple Susanoo Ribcage & Kirin static aura
      c.save();
      for (let i = 0; i < 6; i++) {
        const a = t + (i * Math.PI) / 3;
        c.strokeStyle = i % 2 === 0 ? "rgba(168, 85, 247, 0.72)" : "rgba(56, 189, 248, 0.72)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, r * 1.2, a, a + 0.55);
        c.stroke();
      }
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    // High-collared dark-navy Uchiha tunic + purple Orochimaru rope sash
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    // High dark-navy Uchiha collar & shirt (or CM2 shirtless waistcloth + purple rope)
    if (isCM) {
      c.fillStyle = "#1e1b4b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.fillRect(-r, r * 0.58, r * 2, r * 0.55);
      c.strokeRect(-r, r * 0.58, r * 2, r * 0.55);
    } else {
      c.fillStyle = "#1e293b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-r, r * 0.42);
      c.lineTo(-r * 0.34, r * 0.46);
      c.lineTo(0, r * 0.66);
      c.lineTo(r * 0.34, r * 0.46);
      c.lineTo(r, r * 0.42);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();
    }

    // Purple rope belt / sash accent at base
    c.fillStyle = "#7e22ce";
    c.fillRect(-r, r * 0.78, r * 2, r * 0.18);
    c.strokeRect(-r, r * 0.78, r * 2, r * 0.18);

    // Tiny Uchiha clan fan crest on chest
    c.fillStyle = "#ef4444";
    c.beginPath();
    c.arc(0, r * 0.69, r * 0.08, Math.PI, 0);
    c.fill();
    c.fillStyle = "#f8fafc";
    c.beginPath();
    c.arc(0, r * 0.69, r * 0.08, 0, Math.PI);
    c.fill();
    c.restore();

    // Compact rounded Chibi Uchiha hair (cheek-framing side locks + spiky back)
    const hair = [
      [-0.86, 0.22], [-0.98, -0.14], [-0.88, -0.32], [-1.14, -0.62], [-0.82, -0.68],
      [-0.96, -1.04], [-0.52, -0.88], [-0.28, -1.16], [0, -0.94],
      [0.28, -1.16], [0.52, -0.88], [0.96, -1.04], [0.82, -0.68],
      [1.14, -0.62], [0.88, -0.32], [0.98, -0.14], [0.86, 0.22],
      // Cheek-framing Uchiha bangs (right -> left)
      [0.74, 0.12], [0.68, -0.26], [0.46, -0.38], [0.18, -0.22],
      [0, -0.38], [-0.18, -0.22], [-0.46, -0.38], [-0.68, -0.26], [-0.74, 0.12],
    ];
    c.save();
    c.lineJoin = "round";
    c.lineCap = "round";
    c.fillStyle = isCM ? "#1e1b4b" : "#111827";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    if (isCM) c.scale(1.08, 1.12);
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();
    c.restore();

    if (isSA) {
      // Susanoo Samurai Helmet Crest + Slatted Lower Face Mask (matching reference!)
      c.save();
      c.fillStyle = "rgba(168, 85, 247, 0.82)";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.lineJoin = "round";

      // Horned forehead crest
      c.beginPath();
      c.moveTo(-r * 0.78, -r * 0.44);
      c.lineTo(-r * 0.42, -r * 0.62);
      c.lineTo(0, -r * 0.88);
      c.lineTo(r * 0.42, -r * 0.62);
      c.lineTo(r * 0.78, -r * 0.44);
      c.lineTo(r * 0.44, -r * 0.34);
      c.lineTo(0, -r * 0.48);
      c.lineTo(-r * 0.44, -r * 0.34);
      c.closePath();
      c.fill();
      c.stroke();

      // Lower Susanoo face mask with 3 vertical vents
      c.beginPath();
      c.moveTo(-r * 0.52, r * 0.16);
      c.lineTo(0, r * 0.06);
      c.lineTo(r * 0.52, r * 0.16);
      c.lineTo(r * 0.44, r * 0.56);
      c.lineTo(0, r * 0.66);
      c.lineTo(-r * 0.44, r * 0.56);
      c.closePath();
      c.fill();
      c.stroke();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      for (const vx of [-0.14, 0, 0.14]) {
        c.beginPath();
        c.moveTo(r * vx, r * 0.24);
        c.lineTo(r * vx, r * 0.48);
        c.stroke();
      }
      c.restore();
    }
  };

  BF.CHARACTER_ROSTER.sasuke = {
    id: "sasuke",
    name: "UCHIHA AVENGER",
    shortName: "AVENGER",
    title: "Sharingan Prodigy • Chidori & Kirin",
    role: "SHINOBI • LIGHTNING & FIRE",
    color: "#3b82f6",
    radius: 27,
    speed: 370,
    maxHp: 555,
    damage: [6, 9],
    mass: 1.0,
    costume: "sasuke",
    weapon: null,
    ult: "kirin",
    ultName: "KIRIN (THUNDER DRAGON)",
    ultDesc: "Summons dark storm clouds over the arena and calls down the giant Kirin Lightning Dragon for massive AoE shock damage & stun!",
    skillName: "CHIDORI & FIREBALL JUTSU",
    skillDesc: "Dashes with Chidori (triggers an epic Final Valley Clash when colliding with Naruto's Rasengan!) and launches blazing Katon Fireballs!",
    skills: [SKILL_CHIDORI, SKILL_FIREBALL],
  };

  BF.TRANSFORM_DETAILS.sasuke = {
    label: "⚡ MANGEKYOU SHARINGAN • KIRIN",
    speedMult: 1.18,
    radiusMult: 1.0,
    powerText: "38 KIRIN + CHIDORI CLASH",
    hpNote: "KIRIN SUMMONS STORM ON ULT",
    ultSkillName: "KIRIN THUNDER DRAGON",
    ultSkillCd: "CD: 3.0S / 4.4S",
  };
})();

