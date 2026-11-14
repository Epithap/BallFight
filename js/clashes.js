(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { WORLD_SIZE, COLORS, FONT, easeOut } = BF;
  const rt = () => BF._rt;

  function spawnStandClashEffect(x, y, duration = 2.4, b1 = null, b2 = null, getMeter = null) {
    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      isTimeStopEntity: true,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const t = 1 - Math.max(0, this.life / this.maxLife);
        const pulse = 1 + Math.sin(t * 64) * 0.28;
        const meter = getMeter ? Math.max(0.1, Math.min(0.9, getMeter())) : 0.5;
        const p1Pct = Math.round(meter * 100);
        const p2Pct = 100 - p1Pct;
        const c1 = b1 ? (b1.costume === "dio" ? COLORS.gold : b1.color) : COLORS.gold;
        const c2 = b2 ? (b2.costume === "jotaro" ? "#a855f7" : b2.color) : "#a855f7";

        const s1 = b1 && b1.standState ? b1.standState : null;
        const clashAng = s1 ? s1.angle : 0;
        const dirX = Math.cos(clashAng);
        const dirY = Math.sin(clashAng);
        const perpX = -dirY;
        const perpY = dirX;
        // Shift clash front dynamically toward the losing side
        const pushOffset = (meter - 0.5) * 44;
        const frontX = this.x + dirX * pushOffset;
        const frontY = this.y + dirY * pushOffset;

        c.save();

        // 1. JoJo Theatrical Arena Dim + Split Stand Aura Field
        c.fillStyle = "rgba(12, 8, 24, 0.38)";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Radial speedlines from the clash front
        c.save();
        c.translate(frontX, frontY);
        for (let i = 0; i < 24; i++) {
          const a = (Math.PI * 2 * i) / 24 + (i % 2 ? t * 2.5 : -t * 2.5);
          const r0 = 56 + (i % 3) * 18;
          const r1 = 290;
          c.strokeStyle = i % 2 === 0 ? c1 : c2;
          c.globalAlpha = 0.22;
          c.lineWidth = i % 2 === 0 ? 3 : 1.8;
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }
        c.restore();

        // 2. Colliding Stand Fist Storm & Shockwave Core at (frontX, frontY)
        c.save();
        c.translate(frontX, frontY);

        const grad = c.createRadialGradient(0, 0, 4, 0, 0, 78 * pulse);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        grad.addColorStop(0.35, "rgba(250, 204, 21, 0.85)");
        grad.addColorStop(0.7, "rgba(168, 85, 247, 0.45)");
        grad.addColorStop(1, "rgba(250, 204, 21, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, 78 * pulse, 0, Math.PI * 2);
        c.fill();

        // Dual expanding shockwave rings
        for (let rIdx = 0; rIdx < 2; rIdx++) {
          const ringProg = (t * 6.5 + rIdx * 0.5) % 1;
          const ringR = 16 + ringProg * 72;
          c.strokeStyle = rIdx === 0 ? c1 : c2;
          c.globalAlpha = 0.9 * (1 - ringProg);
          c.lineWidth = 4 * (1 - ringProg) + 1.5;
          c.beginPath();
          c.arc(0, 0, ringR, 0, Math.PI * 2);
          c.stroke();
        }
        c.globalAlpha = 1;

        // 8 Colliding Fists from both sides slamming into the center line
        for (let i = 0; i < 4; i++) {
          const cyc = (t * 14 + i * 0.25) % 1;
          const dist = (1 - cyc) * 42 + 6;
          const spread = (i - 1.5) * 16 + Math.sin(t * 36 + i) * 5;

          // Left / Fighter 1 Fist
          const f1x = -dirX * dist + perpX * spread;
          const f1y = -dirY * dist + perpY * spread;
          rt().drawStandFist(
            c,
            f1x,
            f1y,
            10.5,
            true,
            clashAng + Math.PI * 0.5,
            b1 && b1.costume === "jotaro" ? "#9b59b6" : COLORS.gold,
            b1 && b1.costume === "jotaro" ? COLORS.gold : "#2ecc71",
            COLORS.gold
          );

          // Right / Fighter 2 Fist
          const f2x = dirX * dist - perpX * spread;
          const f2y = dirY * dist - perpY * spread;
          rt().drawStandFist(
            c,
            f2x,
            f2y,
            10.5,
            true,
            clashAng - Math.PI * 0.5,
            b2 && b2.costume === "jotaro" ? "#9b59b6" : COLORS.gold,
            b2 && b2.costume === "jotaro" ? COLORS.gold : "#2ecc71",
            COLORS.gold
          );
        }

        // Sharp comic impact star at exact collision point
        c.rotate(t * 22);
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          const rr = (i % 2 === 0 ? 28 : 11) * pulse;
          if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();

        // Floating Battle Cry Clash Text ("ORA ORA!!" vs "MUDA MUDA!!")
        c.save();
        const cry1 = b1 && b1.costume === "jotaro" ? "ORA ORA ORA!!" : "MUDA MUDA MUDA!!";
        const cry2 = b2 && b2.costume === "dio" ? "MUDA MUDA MUDA!!" : "ORA ORA ORA!!";
        const jitterX = Math.sin(t * 45) * 1;
        const jitterY = Math.cos(t * 42) * 1;
        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 4.5;
        c.strokeStyle = COLORS.ink;
        c.strokeText(cry1, frontX - dirX * 52 + jitterX, frontY - 52 + jitterY);
        c.fillStyle = c1;
        c.fillText(cry1, frontX - dirX * 52 + jitterX, frontY - 52 + jitterY);

        c.strokeText(cry2, frontX + dirX * 52 - jitterX, frontY + 52 - jitterY);
        c.fillStyle = c2;
        c.fillText(cry2, frontX + dirX * 52 - jitterX, frontY + 52 - jitterY);
        c.restore();

        // 3. Upgraded JoJo Tug-of-War Clash Meter at Top-Center
        const barW = 350;
        const barH = 30;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 72;
        const splitX = barX + barW * meter;

        // Header pill
        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 4.5;
        c.strokeStyle = COLORS.ink;
        c.strokeText("⚡ STAND BARRAGE CLASH! ⚡", WORLD_SIZE * 0.5, barY - 18);
        c.fillStyle = COLORS.gold;
        c.fillText("⚡ STAND BARRAGE CLASH! ⚡", WORLD_SIZE * 0.5, barY - 18);

        // Drop shadow
        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.roundRect(barX, barY + 4, barW, barH, 10);
        c.fill();

        // Clipped dual-color tug-of-war bar
        c.save();
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.clip();

        c.fillStyle = c1;
        c.fillRect(barX, barY, barW * meter, barH);
        c.fillStyle = c2;
        c.fillRect(splitX, barY, barW * (1 - meter), barH);

        // Gloss highlight
        c.fillStyle = "rgba(255, 255, 255, 0.25)";
        c.fillRect(barX, barY, barW, barH * 0.44);
        c.restore();

        // Thick ink border
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.stroke();

        // Glowing clash divider needle
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(splitX - 5, barY - 5, 10, barH + 10, 4);
        c.fill();
        c.stroke();

        // Percentage & fighter labels inside meter
        c.font = `bold 13px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        const n1 = b1 ? b1.name : "P1";
        const n2 = b2 ? b2.name : "P2";

        c.textAlign = "left";
        const leftText = `${n1} ${p1Pct}%`;
        c.strokeText(leftText, barX + 10, barY + barH * 0.5);
        c.fillStyle = p1Pct >= p2Pct ? COLORS.gold : COLORS.white;
        c.fillText(leftText, barX + 10, barY + barH * 0.5);

        c.textAlign = "right";
        const rightText = `${p2Pct}% ${n2}`;
        c.strokeText(rightText, barX + barW - 10, barY + barH * 0.5);
        c.fillStyle = p2Pct > p1Pct ? COLORS.gold : COLORS.white;
        c.fillText(rightText, barX + barW - 10, barY + barH * 0.5);

        c.restore();

        if (b1 && b2) {
          const leftCol = b1.costume === "dio" ? "#facc15" : "#a855f7";
          const rightCol = b2.costume === "dio" ? "#facc15" : "#a855f7";
          BF.drawClashCutin(c, b1, b2, leftCol, rightCol, 1 - this.life / this.maxLife, "STAND RUSH!");
        }
      },
    };
  }

  function checkStandClash() {
    if (rt().balls.length < 2) return;
    for (let i = 0; i < rt().balls.length; i++) {
      const b1 = rt().balls[i];
      if (!b1.alive || !b1.standState) continue;
      const s1 = b1.standState;
      if (s1.phase !== "dashing" && s1.phase !== "barraging") continue;

      for (let j = i + 1; j < rt().balls.length; j++) {
        const b2 = rt().balls[j];
        if (!b2.alive || !b2.standState) continue;
        const s2 = b2.standState;
        if (s2.phase !== "dashing" && s2.phase !== "barraging") continue;

        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 64) {
          // Center the clash safely away from walls so both Stands and Users have room for the standoff & knockback
          const rawMidX = (s1.x + s2.x) * 0.5;
          const rawMidY = (s1.y + s2.y) * 0.5;
          const midX = Math.max(120, Math.min(WORLD_SIZE - 120, rawMidX));
          const midY = Math.max(130, Math.min(WORLD_SIZE - 110, rawMidY));
          const clashAng = Math.atan2(b2.y - b1.y, b2.x - b1.x) || 0;
          const sep = 34;
          const userDist = 80;
          const clashDuration = 2.4;
          const winnerIdx = rt().rng() < 0.5 ? 0 : 1;

          // Position Users behind their Stands so User 1 -> Stand 1 ⚡ Stand 2 <- User 2 is clearly visible!
          b1.x = Math.max(b1.radius + 8, Math.min(WORLD_SIZE - b1.radius - 8, midX - Math.cos(clashAng) * userDist));
          b1.y = Math.max(b1.radius + 8, Math.min(WORLD_SIZE - b1.radius - 8, midY - Math.sin(clashAng) * userDist));
          b2.x = Math.max(b2.radius + 8, Math.min(WORLD_SIZE - b2.radius - 8, midX + Math.cos(clashAng) * userDist));
          b2.y = Math.max(b2.radius + 8, Math.min(WORLD_SIZE - b2.radius - 8, midY + Math.sin(clashAng) * userDist));

          s1.phase = "clashing";
          s1.x = midX - Math.cos(clashAng) * sep;
          s1.y = midY - Math.sin(clashAng) * sep;
          s1.angle = clashAng;
          s1.clashBaseX = s1.x;
          s1.clashBaseY = s1.y;
          s1.clashMidX = midX;
          s1.clashMidY = midY;
          s1.clashDuration = clashDuration;
          s1.clashTimer = clashDuration;
          s1.clashPulseTimer = 0;
          s1.clashMeter = 0.5;
          s1.clashWinnerIdx = winnerIdx;
          s1.clashPartner = b2;
          s1.clashPrimary = true;

          s2.phase = "clashing";
          s2.x = midX + Math.cos(clashAng) * sep;
          s2.y = midY + Math.sin(clashAng) * sep;
          s2.angle = clashAng + Math.PI;
          s2.clashBaseX = s2.x;
          s2.clashBaseY = s2.y;
          s2.clashMidX = midX;
          s2.clashMidY = midY;
          s2.clashDuration = clashDuration;
          s2.clashTimer = clashDuration;
          s2.clashPulseTimer = 0;
          s2.clashPartner = b1;
          s2.clashPrimary = false;

          b1.standAttackTimer = clashDuration + 0.5;
          b2.standAttackTimer = clashDuration + 0.5;

          rt().entities.push(spawnStandClashEffect(midX, midY, clashDuration, b1, b2, () => s1.clashMeter));
          rt().hitStop = 0.06;
          rt().shakeTime = 0.14;
          rt().shakeIntensity = 3;
          rt().sound.playMudaRush();
          return;
        }
      }
    }
  }


  function spawnDomainClashEffect(x, y, duration, b1, b2, spec1, spec2, g) {
    const b1IsLeft = b1.x <= b2.x;
    const leftB = b1IsLeft ? b1 : b2;
    const rightB = b1IsLeft ? b2 : b1;
    const leftSpec = b1IsLeft ? spec1 : spec2;
    const rightSpec = b1IsLeft ? spec2 : spec1;

    let meter = 0.5;
    let meterVel = 0;
    let resolved = false;
    const shrineSlashes = [];
    const barrierShards = [];
    for (let i = 0; i < 14; i++) {
      barrierShards.push({
        yOff: (i / 14) * WORLD_SIZE + 15,
        xOff: (rt().rng() - 0.5) * 44,
        size: 7 + rt().rng() * 10,
        rot: rt().rng() * Math.PI * 2,
        vRot: (rt().rng() - 0.5) * 8,
        side: i % 2 === 0 ? -1 : 1,
      });
    }

    function renderSideDomain(c, spec, fighter, centerX, isLeft, t) {
      if (spec.type === "malevolent_shrine") {
        c.fillStyle = "#160205";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Radial manga speed-lines behind Shrine
        c.save();
        c.translate(centerX, WORLD_SIZE * 0.44);
        c.strokeStyle = "rgba(220, 38, 38, 0.22)";
        c.lineWidth = 2.5;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 + t * 0.6;
          c.beginPath();
          c.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
          c.lineTo(Math.cos(a) * 320, Math.sin(a) * 320);
          c.stroke();
        }
        c.restore();

        if (BF.drawMalevolentShrineBackdrop) {
          BF.drawMalevolentShrineBackdrop(c, centerX, WORLD_SIZE * 0.45, 0.92, t, 1);
        }

        // Cursed Shrine aura seal beneath Sukuna
        if (fighter && fighter.alive) {
          c.save();
          c.translate(fighter.x, fighter.y);
          c.strokeStyle = "#dc2626";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 16 + Math.sin(t * 28) * 3, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#fca5a5";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 9, t * 10, t * 10 + Math.PI * 1.3);
          c.stroke();
          c.restore();
        }

        // Relentless Shrine slashes tearing across Sukuna's domain side
        c.lineCap = "round";
        for (const s of shrineSlashes) {
          const sx = isLeft ? s.rx * centerX * 1.9 : centerX + (s.rx - 0.5) * (WORLD_SIZE - centerX) * 1.8;
          c.save();
          c.translate(sx, s.y);
          c.rotate(s.ang);
          c.globalAlpha = Math.max(0, s.life / 0.2);
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(-s.len * 0.72, 0);
          c.lineTo(s.len * 0.72, 0);
          c.stroke();
          c.restore();
        }
      } else {
        c.fillStyle = "#020612";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Cosmic nebula streaks & infinity grid lines
        c.save();
        c.translate(centerX, WORLD_SIZE * 0.43);
        c.strokeStyle = "rgba(56, 189, 248, 0.2)";
        c.lineWidth = 2;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 - t * 0.7;
          c.beginPath();
          c.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
          c.lineTo(Math.cos(a) * 320, Math.sin(a) * 320);
          c.stroke();
        }
        c.restore();

        if (BF.drawUnlimitedVoidBackdrop) {
          BF.drawUnlimitedVoidBackdrop(c, centerX, WORLD_SIZE * 0.43, 0.92, t, 1);
        }

        // Iconic white manga ink splatters & spatial streaks on Gojo's side
        const edgeX = isLeft ? 28 : WORLD_SIZE - 28;
        const dir = isLeft ? 1 : -1;
        c.fillStyle = "#ffffff";
        for (const [ox, oy, r] of [[0, 38, 16], [dir * 26, 24, 10], [dir * 8, 72, 12], [0, 420, 18], [dir * 28, 442, 13]]) {
          c.beginPath();
          c.arc(edgeX + ox, oy, r, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = "#ffffff";
        c.lineWidth = 5;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(edgeX, 24);
        c.lineTo(edgeX + dir * 88, 96);
        c.moveTo(edgeX, 438);
        c.lineTo(edgeX + dir * 94, 388);
        c.stroke();

        // Six Eyes Infinity halo beneath Gojo
        if (fighter && fighter.alive) {
          c.save();
          c.translate(fighter.x, fighter.y);
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 16 + Math.sin(t * 28) * 3, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#e0f2fe";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 9, -t * 10, -t * 10 + Math.PI * 1.3);
          c.stroke();
          c.restore();
        }
      }
    }

    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      isDomainClash: true,
      dead: false,
      update(dt) {
        this.life -= dt;
        const t = 1 - Math.max(0, this.life / this.maxLife);

        // Dynamic tug-of-war oscillation with high-tension swings
        meterVel += (rt().rng() - 0.5) * 2.4 * dt;
        meterVel += (0.5 - meter) * 1.8 * dt;
        meterVel *= 0.92;
        meter = Math.max(0.24, Math.min(0.76, meter + meterVel + (rt().rng() - 0.5) * 0.035));

        const splitX = WORLD_SIZE * meter;
        // Stage left & right fighters in front of their towering Domains like the manga panel!
        if (leftB && leftB.alive) {
          const targetLX = Math.max(leftB.radius + 36, Math.min(splitX - leftB.radius - 32, splitX * 0.5));
          const targetLY = WORLD_SIZE * 0.66;
          leftB.x += (targetLX - leftB.x) * Math.min(1, dt * 10) + (rt().rng() - 0.5) * 3.2;
          leftB.y += (targetLY - leftB.y) * Math.min(1, dt * 10) + (rt().rng() - 0.5) * 3.2;
          leftB.vx = 0;
          leftB.vy = 0;
          leftB.domainClashTimer = Math.max(0.05, this.life);
        }
        if (rightB && rightB.alive) {
          const targetRX = Math.min(WORLD_SIZE - rightB.radius - 36, Math.max(splitX + rightB.radius + 32, splitX + (WORLD_SIZE - splitX) * 0.5));
          const targetRY = WORLD_SIZE * 0.66;
          rightB.x += (targetRX - rightB.x) * Math.min(1, dt * 10) + (rt().rng() - 0.5) * 3.2;
          rightB.y += (targetRY - rightB.y) * Math.min(1, dt * 10) + (rt().rng() - 0.5) * 3.2;
          rightB.vx = 0;
          rightB.vy = 0;
          rightB.domainClashTimer = Math.max(0.05, this.life);
        }

        if (rt().rng() < 0.9) {
          shrineSlashes.push({
            rx: 0.12 + rt().rng() * 0.76,
            y: 45 + rt().rng() * (WORLD_SIZE - 90),
            ang: (rt().rng() - 0.5) * Math.PI * 0.85,
            len: 26 + rt().rng() * 44,
            life: 0.2,
          });
        }
        for (let i = shrineSlashes.length - 1; i >= 0; i--) {
          shrineSlashes[i].life -= dt;
          if (shrineSlashes[i].life <= 0) shrineSlashes.splice(i, 1);
        }
        for (const sh of barrierShards) {
          sh.rot += sh.vRot * dt;
        }

        // Periodic clash shockwaves & sparks along the boundary
        if (rt().rng() < 0.35) {
          const sy = 80 + rt().rng() * (WORLD_SIZE - 160);
          rt().particles.push({
            x: splitX + (rt().rng() - 0.5) * 18,
            y: sy,
            vx: (rt().rng() - 0.5) * 220,
            vy: (rt().rng() - 0.5) * 220,
            size: 4 + rt().rng() * 4,
            life: 0.22,
            maxLife: 0.22,
            color: rt().rng() < 0.5 ? leftSpec.color : rightSpec.color,
          });
        }
        rt().shakeTime = Math.max(rt().shakeTime, 0.06);
        rt().shakeIntensity = Math.max(rt().shakeIntensity, 1.5);

        if (this.life <= 0 && !resolved) {
          resolved = true;
          this.dead = true;
          b1.domainClashTimer = 0;
          b2.domainClashTimer = 0;
          const leftWins = rt().rng() < 0.5;
          const winner = leftWins ? leftB : rightB;
          const loser = leftWins ? rightB : leftB;
          const winSpec = leftWins ? leftSpec : rightSpec;

          const dealt = g.applyDamage(loser, 18);
          const kAng = Math.atan2(loser.y - winner.y, loser.x - winner.x);
          loser.vx = Math.cos(kAng) * 650;
          loser.vy = Math.sin(kAng) * 650;
          loser.flashTimer = 0.22;
          loser.squash = 1.0;

          g.entities.push(rt().spawnShockRing(splitX, WORLD_SIZE * 0.5, winSpec.color, 220, 0.55));
          g.entities.push(rt().spawnShockRing(splitX, WORLD_SIZE * 0.5, COLORS.white, 150, 0.38));
          g.entities.push(rt().spawnBanner(`DOMAIN OVERPOWER: ${winSpec.name}!`, winSpec.color));
          g.spawnDamageText(loser.x, loser.y - loser.radius - 16, dealt, winSpec.color, true, "DOMAIN SHATTERED!");
          g.sound.playCritHit();
          rt().shakeTime = Math.max(rt().shakeTime, 0.48);
          rt().shakeIntensity = Math.max(rt().shakeIntensity, 11);

          if (winSpec.createDomain) {
            g.entities.push(winSpec.createDomain());
          }
          if (winSpec.onStart) {
            winSpec.onStart(g);
          }
        }
      },
      render(c) {
        const t = 1 - Math.max(0, this.life / this.maxLife);
        const splitX = WORLD_SIZE * meter;
        const leftCenterX = splitX * 0.5;
        const rightCenterX = splitX + (WORLD_SIZE - splitX) * 0.5;

        // Build jagged spatial fault line from top to bottom
        const segs = 14;
        const faultPts = [];
        for (let i = 0; i <= segs; i++) {
          const py = (i / segs) * WORLD_SIZE;
          const edgeDamp = i === 0 || i === segs ? 0 : 1;
          const wave = Math.sin(t * 38 + i * 1.9) * 11 + Math.cos(t * 62 - i * 2.7) * 6;
          faultPts.push([splitX + wave * edgeDamp, py]);
        }

        c.save();

        // 1. LEFT SORCERER DOMAIN TERRITORY (Clipped to left of spatial fault line)
        c.save();
        c.beginPath();
        c.moveTo(0, 0);
        for (const [fx, fy] of faultPts) c.lineTo(fx, fy);
        c.lineTo(0, WORLD_SIZE);
        c.closePath();
        c.clip();
        renderSideDomain(c, leftSpec, leftB, leftCenterX, true, t);
        c.restore();

        // 2. RIGHT SORCERER DOMAIN TERRITORY (Clipped to right of spatial fault line)
        c.save();
        c.beginPath();
        c.moveTo(WORLD_SIZE, 0);
        for (const [fx, fy] of faultPts) c.lineTo(fx, fy);
        c.lineTo(WORLD_SIZE, WORLD_SIZE);
        c.closePath();
        c.clip();
        renderSideDomain(c, rightSpec, rightB, rightCenterX, false, t);
        c.restore();

        // 3. FLOATING SHATTERED BARRIER GLASS SHARDS ALONG THE RIFT
        for (const sh of barrierShards) {
          c.save();
          c.translate(splitX + sh.xOff, sh.yOff);
          c.rotate(sh.rot);
          c.fillStyle = sh.side < 0 ? leftSpec.color : rightSpec.color;
          c.strokeStyle = COLORS.white;
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, -sh.size);
          c.lineTo(sh.size * 0.75, sh.size * 0.2);
          c.lineTo(-sh.size * 0.6, sh.size * 0.8);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        }

        // 4. SPATIAL FAULT LINE & CURSED LIGHTNING CRACKS
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";

        // Outer cursed energy clash glow
        c.strokeStyle = "#a855f7";
        c.lineWidth = 16 + Math.sin(t * 50) * 4;
        c.globalAlpha = 0.55;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();
        c.globalAlpha = 1;

        // Thick black manga crack border
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 10;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();

        // Blinding white spatial fracture core
        c.strokeStyle = COLORS.white;
        c.lineWidth = 4.5;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();

        // Branching lateral lightning arcs off the fault line
        for (let i = 2; i < faultPts.length - 2; i += 2) {
          const [bx, by] = faultPts[i];
          const dir = i % 4 === 0 ? -1 : 1;
          const col = dir < 0 ? leftSpec.color : rightSpec.color;
          const reach = 26 + Math.sin(t * 45 + i) * 14;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(bx, by);
          c.lineTo(bx + dir * reach * 0.55, by - 10);
          c.lineTo(bx + dir * reach, by + 8);
          c.stroke();
          c.strokeStyle = col;
          c.lineWidth = 2.5;
          c.stroke();
        }

        // Central Clash Singularity Core where both domains collide
        const coreY = WORLD_SIZE * 0.52;
        const coreX = faultPts[Math.floor(segs * 0.52)][0];
        const pulse = 1 + Math.sin(t * 55) * 0.22;
        c.save();
        c.translate(coreX, coreY);
        c.fillStyle = "rgba(168, 85, 247, 0.38)";
        c.beginPath();
        c.arc(0, 0, 46 * pulse, 0, Math.PI * 2);
        c.fill();

        // Sharp manga impact rays at collision point
        for (let i = 0; i < 12; i++) {
          const ang = (Math.PI * 2 * i) / 12 + t * 14;
          const len = (24 + (i % 2) * 20) * pulse;
          c.strokeStyle = i % 2 === 0 ? leftSpec.color : rightSpec.color;
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
          c.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
          c.stroke();
          c.strokeStyle = COLORS.white;
          c.lineWidth = 1.8;
          c.stroke();
        }
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.5;
        c.beginPath();
        c.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
        c.restore();

        // 5. MANGA DOMAIN CALLOUT PLAQUES (Bottom Left & Bottom Right)
        c.save();
        c.font = `bold 12px ${FONT}`;
        c.textBaseline = "middle";
        const drawPlaque = (px, py, align, title, sub, col) => {
          c.save();
          c.translate(px, py);
          c.rotate(align === "left" ? -0.04 : 0.04);
          const pw = 168;
          const ph = 34;
          const rx = align === "left" ? 0 : -pw;
          c.fillStyle = COLORS.ink;
          c.beginPath();
          c.roundRect(rx, 3, pw, ph, 7);
          c.fill();
          c.fillStyle = "rgba(15, 10, 25, 0.92)";
          c.strokeStyle = col;
          c.lineWidth = 3;
          c.beginPath();
          c.roundRect(rx, 0, pw, ph, 7);
          c.fill();
          c.stroke();

          c.textAlign = align;
          const tx = align === "left" ? 10 : -10;
          c.font = `bold 11px ${FONT}`;
          c.fillStyle = col;
          c.fillText(sub, tx, 11);
          c.font = `bold 13px ${FONT}`;
          c.fillStyle = COLORS.white;
          c.fillText(title, tx, 24);
          c.restore();
        };
        const lTag = (leftB ? (leftB.shortName || leftB.costume || leftB.name) : "P1").toUpperCase();
        const rTag = (rightB ? (rightB.shortName || rightB.costume || rightB.name) : "P2").toUpperCase();
        drawPlaque(14, WORLD_SIZE - 52, "left", leftSpec.name, `${lTag} • DOMAIN`, leftSpec.color);
        drawPlaque(WORLD_SIZE - 14, WORLD_SIZE - 52, "right", rightSpec.name, `${rTag} • DOMAIN`, rightSpec.color);
        c.restore();

        // 6. CHUNKY ANIME TUG-OF-WAR DOMAIN CLASH METER (Top-Center)
        const barW = 336;
        const barH = 26;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 72;
        const barSplitX = barX + barW * meter;
        const p1Pct = Math.round(meter * 100);
        const p2Pct = 100 - p1Pct;

        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 5;
        c.strokeStyle = COLORS.ink;
        c.strokeText("⚡ DOMAIN EXPANSION CLASH! ⚡", WORLD_SIZE * 0.5, barY - 16);
        c.fillStyle = COLORS.gold;
        c.fillText("⚡ DOMAIN EXPANSION CLASH! ⚡", WORLD_SIZE * 0.5, barY - 16);

        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.roundRect(barX, barY + 4, barW, barH, 10);
        c.fill();

        c.save();
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.clip();
        c.fillStyle = leftSpec.color;
        c.fillRect(barX, barY, barW * meter, barH);
        c.fillStyle = rightSpec.color;
        c.fillRect(barSplitX, barY, barW * (1 - meter), barH);
        c.fillStyle = "rgba(255, 255, 255, 0.24)";
        c.fillRect(barX, barY, barW, barH * 0.42);
        c.restore();

        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.stroke();

        // Glowing clash divider needle
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(barSplitX - 4, barY - 5, 8, barH + 10, 3);
        c.fill();
        c.stroke();

        c.font = `bold 13px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;

        c.textAlign = "left";
        const leftText = `${lTag} ${p1Pct}%`;
        c.strokeText(leftText, barX + 10, barY + barH * 0.5);
        c.fillStyle = p1Pct >= p2Pct ? COLORS.gold : COLORS.white;
        c.fillText(leftText, barX + 10, barY + barH * 0.5);

        c.textAlign = "right";
        const rightText = `${p2Pct}% ${rTag}`;
        c.strokeText(rightText, barX + barW - 10, barY + barH * 0.5);
        c.fillStyle = p2Pct > p1Pct ? COLORS.gold : COLORS.white;
        c.fillText(rightText, barX + barW - 10, barY + barH * 0.5);

        c.restore();

        if (leftB && rightB) {
          BF.drawClashCutin(c, leftB, rightB, leftSpec.color, rightSpec.color, 1 - this.life / this.maxLife, "DOMAIN CLASH!");
        }
      },
    };
  }

  function triggerDomainExpansion(owner, spec, g) {
    const enemyDomain = g.entities.find((ent) => ent.isDomain && !ent.dead && ent.domainOwner !== owner);
    const activeClash = g.entities.find((ent) => ent.isDomainClash && !ent.dead);
    if (activeClash) return;

    // Trigger Domain Clash whenever ANY Sorcerer with a Domain (Gojo / Sukuna) is the opponent — they immediately counter-activate their Domain!
    const domainSorcererEnemy = !enemyDomain
      ? g.balls.find((b) => b !== owner && b.alive && (b.costume === "gojo" || b.costume === "sukuna"))
      : null;

    if (enemyDomain || domainSorcererEnemy) {
      const enemy = enemyDomain ? enemyDomain.domainOwner : domainSorcererEnemy;
      if (enemyDomain) {
        enemyDomain.dead = true;
      } else if (enemy) {
        // Opponent Sorcerer immediately awakens and counter-expands their Domain!
        enemy.ultTimer = Math.max(enemy.ultTimer, 8.0);
        enemy.domainUsedInUlt = true;
        rt().addEffect(enemy, "haste", 8.0, { factor: 1.15 });
      }
      // Clear stuns, active casts, & stray projectiles/vortexes so both sorcerers face off cleanly in the Domain Clash
      for (const ent of g.entities) {
        if (!ent.isDomain && !ent.isDomainClash) ent.dead = true;
      }
      rt().floatingTexts.length = 0;
      owner.effects = owner.effects.filter((ef) => ef.type !== "stun");
      owner.cast = null;
      owner.channelTimer = 0;
      const clashDuration = 2.6;
      owner.domainClashTimer = clashDuration;
      if (enemy && enemy.alive) {
        enemy.effects = enemy.effects.filter((ef) => ef.type !== "stun");
        enemy.cast = null;
        enemy.channelTimer = 0;
        enemy.domainClashTimer = clashDuration;
      }
      const midX = enemy ? (owner.x + enemy.x) * 0.5 : WORLD_SIZE * 0.5;
      const midY = enemy ? (owner.y + enemy.y) * 0.5 : WORLD_SIZE * 0.5;

      const enemyDomainType = enemyDomain
        ? enemyDomain.domainType
        : (enemy && enemy.costume === "gojo" ? "unlimited_void" : "malevolent_shrine");

      const enemySpec = enemyDomainType === "unlimited_void"
        ? {
            type: "unlimited_void",
            name: "UNLIMITED VOID",
            color: "#38bdf8",
            createDomain: BF.spawnUnlimitedVoidDomain
              ? () => BF.spawnUnlimitedVoidDomain({ owner: enemy, duration: 6.0 })
              : null,
            onStart(gg) {
              gg.addEffect(owner, "stun", 6.0);
              owner.vx = 0;
              owner.vy = 0;
              gg.spawnDamageText(owner.x, owner.y - owner.radius - 18, 0, "#7dd3fc", true, "INFINITE VOID (6S)!");
            },
          }
        : {
            type: "malevolent_shrine",
            name: "MALEVOLENT SHRINE",
            color: "#dc2626",
            createDomain: BF.spawnMalevolentShrineDomain
              ? () => BF.spawnMalevolentShrineDomain({ owner: enemy, duration: 6.0 })
              : null,
            onStart(gg) {
              gg.spawnDamageText(enemy.x, enemy.y - enemy.radius - 18, 0, "#ef4444", true, "MALEVOLENT SHRINE!");
            },
          };

      if (enemy) {
        g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 18, 0, enemySpec.color, true, `${enemySpec.name}!`);
      }
      g.spawnDamageText(owner.x, owner.y - owner.radius - 18, 0, spec.color, true, `${spec.name}!`);
      g.entities.push(rt().spawnBanner("DOMAIN CLASH!", COLORS.gold));
      g.entities.push(spawnDomainClashEffect(midX, midY, clashDuration, owner, enemy || owner, spec, enemySpec, g));
      if (g.sound && g.sound.playTimeStop) g.sound.playTimeStop();
      g.sound.playCritHit();
      rt().shakeTime = Math.max(rt().shakeTime, 0.45);
      rt().shakeIntensity = Math.max(rt().shakeIntensity, 9);
      return;
    }

    if (spec.createDomain) {
      g.entities.push(spec.createDomain());
    }
    if (spec.onStart) {
      spec.onStart(g);
    }
  }


  BF.Clashes = {
    spawnStandClashEffect,
    checkStandClash,
    spawnDomainClashEffect,
    triggerDomainExpansion,
  };
})();
