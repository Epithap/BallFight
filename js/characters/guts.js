(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const rt = BF.rt;

  function spawnGreatswordSwing({ owner, angle, arcSpan = Math.PI * 0.9, reach = 128, duration = 0.24, damage = 24, knockback = 360, berserk = false, direction = 1, onComplete = null }) {
    const hitSet = new Set();
    const startAng = angle - direction * arcSpan * 0.5;
    owner.swingState = true;
    owner.weaponAngle = startAng;
    return {
      x: owner.x,
      y: owner.y,
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.x = owner.x;
        this.y = owner.y;
        const progress = 1 - Math.max(0, this.life / this.maxLife);
        const curAng = startAng + direction * arcSpan * progress;
        owner.weaponAngle = curAng;

        if (Math.random() < 0.85) {
          const tipR = reach * (0.65 + Math.random() * 0.35);
          const perp = curAng - direction * Math.PI * 0.5;
          rt.particles.push({
            x: owner.x + Math.cos(curAng) * tipR,
            y: owner.y + Math.sin(curAng) * tipR,
            vx: Math.cos(perp) * (70 + Math.random() * 90),
            vy: Math.sin(perp) * (70 + Math.random() * 90),
            size: berserk ? 5 : 4,
            life: 0.18,
            maxLife: 0.18,
            color: berserk ? "#ff2a2a" : COLORS.silver,
            shape: "square",
            rot: curAng,
          });
        }

        for (const target of g.balls) {
          if (target === owner || !target.alive || hitSet.has(target)) continue;
          const dx = target.x - owner.x;
          const dy = target.y - owner.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= reach + target.radius) {
            let inArc = berserk;
            if (!inArc) {
              let diff = Math.atan2(dy, dx) - angle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              inArc = Math.abs(diff) <= arcSpan * 0.55;
            }
            if (inArc) {
              hitSet.add(target);
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.14;
              target.squash = 0.95;
              const kAng = Math.atan2(dy, dx);
              target.vx = Math.cos(kAng) * knockback;
              target.vy = Math.sin(kAng) * knockback;
              g.spawnSparks(target.x, target.y, berserk ? COLORS.red : COLORS.silver, COLORS.ink);
              g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, berserk ? COLORS.red : COLORS.silver, true, berserk ? "BERSERK CLEAVE!" : "CLEAVE!");
              if (!berserk) g.chargeUlt(owner);
              rt.setHitStop(berserk ? 0.08 : 0.05);
              rt.addShake(berserk ? 0.3 : 0.22, berserk ? 10 : 7);
              g.sound.playCritHit();
            }
          }
        }
        if (this.life <= 0) {
          owner.swingState = false;
          this.dead = true;
          if (onComplete) onComplete(g);
        }
      },
      render(c) {
        const progress = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - progress * 0.65);
        const curAng = startAng + direction * arcSpan * progress;
        const trailSpan = Math.min(arcSpan * progress, arcSpan * 0.65);
        const trailStart = curAng - direction * trailSpan;

        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;

        const steps = 14;
        const outerR = reach * 1.02;
        c.beginPath();
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const a = trailStart + (curAng - trailStart) * f;
          const rOut = outerR * (0.86 + 0.14 * f);
          const px = Math.cos(a) * rOut;
          const py = Math.sin(a) * rOut;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        for (let i = steps; i >= 0; i--) {
          const f = i / steps;
          const a = trailStart + (curAng - trailStart) * f;
          const thickness = Math.sin(f * Math.PI * 0.85) * (berserk ? 48 : 38) + f * 12;
          const rIn = Math.max(owner.radius * 0.7, outerR * (0.86 + 0.14 * f) - thickness);
          c.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        }
        c.closePath();
        c.fillStyle = berserk ? "rgba(215, 20, 35, 0.82)" : "rgba(203, 213, 225, 0.82)";
        c.fill();
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        c.stroke();

        c.strokeStyle = berserk ? "#ff6b6b" : COLORS.white;
        c.lineWidth = berserk ? 5 : 4;
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, 0, outerR * 0.9, trailStart + (curAng - trailStart) * 0.25, curAng, direction < 0);
        c.stroke();

        c.strokeStyle = berserk ? "#14090c" : "rgba(25, 28, 36, 0.65)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, outerR * 1.08, trailStart + (curAng - trailStart) * 0.15, curAng, direction < 0);
        c.stroke();

        c.restore();
      },
    };
  }

  const SKILL_DRAGONSLAYER_CLEAVE = {
    name: "Dragonslayer Cleave",
    cooldown: 2.1,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "swing", duration: inUlt ? 0.14 : 0.3, color: inUlt ? COLORS.red : COLORS.silver,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const berserk = b.ultTimer > 0;
          if (berserk) {
            const spd = Math.hypot(b.vx, b.vy) || b.baseSpeed;
            b.vx = Math.cos(ang) * spd * 1.18;
            b.vy = Math.sin(ang) * spd * 1.18;
            if (b.skills[0]) b.skills[0]._cd = 1.25;
            gg.entities.push(spawnGreatswordSwing({
              owner: b,
              angle: ang,
              arcSpan: Math.PI * 2,
              reach: 152,
              duration: 0.2,
              damage: Math.round(24 + gg.rng() * 6),
              knockback: 260,
              berserk: true,
              direction: 1,
              onComplete(gg2) {
                if (!b.alive) return;
                const t2 = gg2.balls.find((x) => x !== b && x.alive);
                const ang2 = t2 ? Math.atan2(t2.y - b.y, t2.x - b.x) : ang;
                const spd2 = Math.hypot(b.vx, b.vy) || b.baseSpeed;
                b.vx = Math.cos(ang2) * Math.max(spd2, b.baseSpeed * 1.25);
                b.vy = Math.sin(ang2) * Math.max(spd2, b.baseSpeed * 1.25);
                gg2.entities.push(spawnGreatswordSwing({
                  owner: b,
                  angle: ang2,
                  arcSpan: Math.PI * 2,
                  reach: 158,
                  duration: 0.22,
                  damage: Math.round(28 + gg2.rng() * 8),
                  knockback: 490,
                  berserk: true,
                  direction: -1,
                }));
                gg2.sound.playBallHit();
              },
            }));
          } else {
            gg.entities.push(spawnGreatswordSwing({
              owner: b,
              angle: ang,
              arcSpan: Math.PI * 0.92,
              reach: 128,
              duration: 0.24,
              damage: Math.round(25 + gg.rng() * 6),
              knockback: 360,
              berserk: false,
            }));
          }
          gg.sound.playBallHit();
          gg.spawnDamageText(b.x, b.y - b.radius, 0, berserk ? COLORS.red : COLORS.silver, false, berserk ? "SAVAGE RAMPAGE x2!" : "DRAGONSLAYER!");
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.guts = {
    id: "guts",
    name: "HUNDRED-MAN SLAYER",
    shortName: "SLAYER",
    title: "Black Swordsman • Wielder of the Dragonslayer",
    role: "BERSERKER • DRAGONSLAYER",
    color: "#1c1d24",
    radius: 29,
    speed: 355,
    maxHp: 620,
    damage: [0, 0],
    mass: 1.15,
    costume: "guts",
    weapon: "dragonslayer",
    ult: "berserker_armor",
    ultName: "BERSERKER ARMOR",
    ultDesc: "Dons the cursed black full-face Berserker Armor! Surges with rage speed and replaces Cleave with a 2x 360° Savage Rampage.",
    skillName: "DRAGONSLAYER CLEAVE",
    skillDesc: "Deals 0 collision damage, but swings his colossal iron greatsword in a wide, devastating AoE arc!",
    skills: [SKILL_DRAGONSLAYER_CLEAVE],
  };

  BF.TRANSFORM_DETAILS.guts = {
    label: "🔥 BERSERKER",
    speedMult: 1.32,
    radiusMult: 1.0,
    powerText: "52-66 x2",
    ultSkillName: "SAVAGE RAMPAGE x2",
    ultSkillCd: "CD: 1.25S",
    ultSkillDesc: "Speed +32%! Unleashes 2x consecutive 360° Dragonslayer swings (24-30 + 28-36 DMG) and boosts passive sword hits to 10-14 DMG.",
  };

  BF.WEAPON_DRAWERS.dragonslayer = (ball, c) => {
    const berserk = ball.ultTimer > 0;
    c.save();
    c.rotate(Math.PI * 0.25);
    c.translate(0, -14);

    c.fillStyle = "#1b1d24";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(0, -64);
    c.lineTo(12, -42);
    c.lineTo(12, 24);
    c.lineTo(-12, 24);
    c.lineTo(-12, -42);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#101116";
    c.fillRect(-3, -38, 6, 58);

    c.strokeStyle = berserk ? "#ff2a2a" : "#8e96a8";
    c.lineWidth = berserk ? 2.8 : 2.2;
    c.beginPath();
    c.moveTo(-9.5, 22);
    c.lineTo(-9.5, -40);
    c.lineTo(0, -59);
    c.lineTo(9.5, -40);
    c.lineTo(9.5, 22);
    c.stroke();

    c.fillStyle = "#111218";
    c.fillRect(-15, 24, 30, 7);
    c.strokeRect(-15, 24, 30, 7);

    c.fillStyle = "#3a2620";
    c.fillRect(-4, 31, 8, 16);
    c.strokeRect(-4, 31, 8, 16);
    c.fillStyle = "#2b2f3a";
    c.beginPath();
    c.arc(0, 50, 5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  };

  BF.COSTUME_DRAWERS.guts = (ball, r, c) => {
    if (ball.ultTimer > 0) {
      const pulse = 0.85 + 0.15 * Math.sin(performance.now() * 0.012);

      c.save();
      c.translate(0, -r * 0.22);
      c.strokeStyle = `rgba(255, 28, 38, ${0.75 * pulse})`;
      c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const rayA = (i / 12) * Math.PI * 2 + 0.15;
        const rStart = r * 1.05;
        const rMid = r * (1.28 + (i % 2) * 0.12);
        const rEnd = r * (1.52 + (i % 3) * 0.12);
        c.beginPath();
        c.moveTo(Math.cos(rayA) * rStart, Math.sin(rayA) * rStart);
        c.lineTo(Math.cos(rayA + 0.08) * rMid, Math.sin(rayA + 0.08) * rMid);
        c.lineTo(Math.cos(rayA - 0.04) * rEnd, Math.sin(rayA - 0.04) * rEnd);
        c.stroke();
      }
      c.fillStyle = "#050507";
      c.beginPath();
      c.arc(0, 0, r * 1.08, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#ff1e27";
      c.lineWidth = 3.2;
      c.beginPath();
      c.arc(0, 0, r * 1.08, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(255, 110, 110, 0.8)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, 0, r * 1.04, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      c.fillStyle = "#08090d";
      c.strokeStyle = "#ff1e27";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.72, -r * 0.2);
      c.lineTo(-r * 1.32, r * 0.18);
      c.lineTo(-r * 1.08, r * 0.48);
      c.lineTo(-r * 1.26, r * 0.92);
      c.lineTo(-r * 0.64, r * 0.86);
      c.lineTo(-r * 0.25, r * 1.06);
      c.lineTo(0, r * 0.92);
      c.lineTo(r * 0.25, r * 1.06);
      c.lineTo(r * 0.64, r * 0.86);
      c.lineTo(r * 1.26, r * 0.92);
      c.lineTo(r * 1.08, r * 0.48);
      c.lineTo(r * 1.32, r * 0.18);
      c.lineTo(r * 0.72, -r * 0.2);
      c.closePath();
      c.fill();
      c.stroke();

      c.save();
      c.beginPath();
      c.arc(0, 0, r - 0.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = "#090a0e";
      c.fillRect(-r, -r, r * 2, r * 2);

      for (let row = 0; row < 4; row++) {
        const py = r * (0.22 + row * 0.2);
        c.fillStyle = row % 2 === 0 ? "#181b25" : "#11131b";
        c.strokeStyle = "#3f465c";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-r, py + r * 0.18);
        c.lineTo(-r * 0.35, py + r * 0.04);
        c.lineTo(0, py - r * 0.04);
        c.lineTo(r * 0.35, py + r * 0.04);
        c.lineTo(r, py + r * 0.18);
        c.lineTo(r, py + r * 0.34);
        c.lineTo(0, py + r * 0.14);
        c.lineTo(-r, py + r * 0.34);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.restore();

      c.fillStyle = "#11131c";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.82, -r * 0.04);
      c.lineTo(-r * 1.18, -r * 0.24);
      c.lineTo(-r * 0.9, -r * 0.44);
      c.lineTo(-r * 1.16, -r * 0.66);
      c.lineTo(-r * 0.84, -r * 0.66);
      c.lineTo(-r * 1.06, -r * 1.32);
      c.lineTo(-r * 0.44, -r * 0.84);
      c.lineTo(0, -r * 1.12);
      c.lineTo(r * 0.44, -r * 0.84);
      c.lineTo(r * 1.06, -r * 1.32);
      c.lineTo(r * 0.84, -r * 0.66);
      c.lineTo(r * 1.16, -r * 0.66);
      c.lineTo(r * 0.9, -r * 0.44);
      c.lineTo(r * 1.18, -r * 0.24);
      c.lineTo(r * 0.82, -r * 0.04);
      c.lineTo(r * 0.56, r * 0.32);
      c.lineTo(0, r * 0.46);
      c.lineTo(-r * 0.56, r * 0.32);
      c.closePath();
      c.fill();
      c.stroke();

      c.strokeStyle = "#41485e";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.72, -r * 0.62);
      c.lineTo(-r * 0.24, -r * 0.44);
      c.lineTo(0, -r * 0.24);
      c.lineTo(r * 0.24, -r * 0.44);
      c.lineTo(r * 0.72, -r * 0.62);
      c.moveTo(0, -r * 1.04);
      c.lineTo(0, r * 0.02);
      c.moveTo(-r * 0.88, -r * 0.22);
      c.lineTo(-r * 0.52, -r * 0.06);
      c.moveTo(r * 0.88, -r * 0.22);
      c.lineTo(r * 0.52, -r * 0.06);
      c.stroke();

      c.fillStyle = "#040507";
      c.beginPath();
      c.moveTo(-r * 0.56, r * 0.04);
      c.lineTo(0, r * 0.09);
      c.lineTo(r * 0.56, r * 0.04);
      c.lineTo(r * 0.42, r * 0.34);
      c.lineTo(0, r * 0.4);
      c.lineTo(-r * 0.42, r * 0.34);
      c.closePath();
      c.fill();

      c.fillStyle = "#2b303f";
      c.strokeStyle = "#525b75";
      c.lineWidth = 1.1;
      for (let t = -2; t <= 2; t++) {
        const tx = t * r * 0.19;
        c.beginPath();
        c.moveTo(tx - r * 0.08, r * 0.05);
        c.lineTo(tx, r * 0.23);
        c.lineTo(tx + r * 0.08, r * 0.05);
        c.closePath();
        c.fill();
        c.stroke();
      }
      for (let t = -1.5; t <= 1.5; t += 1) {
        const tx = t * r * 0.2;
        c.beginPath();
        c.moveTo(tx - r * 0.07, r * 0.34);
        c.lineTo(tx, r * 0.17);
        c.lineTo(tx + r * 0.07, r * 0.34);
        c.closePath();
        c.fill();
        c.stroke();
      }

      c.fillStyle = "#040507";
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r * 0.68, -r * 0.42);
        c.lineTo(side * r * 0.12, -r * 0.2);
        c.lineTo(side * r * 0.58, -r * 0.09);
        c.closePath();
        c.fill();

        c.strokeStyle = "#ff1822";
        c.lineWidth = 3.2;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(side * r * 0.62, -r * 0.37);
        c.lineTo(side * r * 0.22, -r * 0.27);
        c.lineTo(side * r * 0.46, -r * 0.21);
        c.lineTo(side * r * 0.16, -r * 0.16);
        c.stroke();

        c.strokeStyle = "#ff8585";
        c.lineWidth = 1.2;
        c.stroke();
      }
      return;
    }

    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = "rgba(14, 13, 20, 0.34)";
    c.fillRect(-r, -r * 0.55, r * 2, r * 0.45);

    c.fillStyle = "#14161d";
    c.fillRect(-r, r * 0.36, r * 2, r * 0.7);
    c.fillStyle = "#361115";
    c.beginPath();
    c.moveTo(-r, r * 0.34);
    c.lineTo(-r * 0.25, r * 0.54);
    c.lineTo(-r * 0.52, r * 1.04);
    c.lineTo(-r, r * 1.04);
    c.closePath();
    c.fill();

    c.strokeStyle = "#2d313d";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-r * 0.65, r * 0.56);
    c.lineTo(r * 0.65, r * 0.56);
    c.stroke();

    c.strokeStyle = "#2b1c17";
    c.lineWidth = 5.5;
    c.beginPath();
    c.moveTo(-r * 0.72, r * 0.38);
    c.lineTo(r * 0.48, r * 1.04);
    c.stroke();
    c.fillStyle = "#6c7382";
    c.fillRect(-r * 0.22, r * 0.62, r * 0.18, r * 0.14);

    c.strokeStyle = "#a91d22";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(r * 0.44, r * 0.34);
    c.lineTo(r * 0.5, r * 0.46);
    c.lineTo(r * 0.38, r * 0.46);
    c.closePath();
    c.stroke();
    c.restore();

    c.fillStyle = "#0e0f14";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-r * 0.94, -r * 0.26);
    c.lineTo(-r * 1.05, -r * 0.74);
    c.lineTo(-r * 0.6, -r * 0.9);
    c.lineTo(-r * 0.36, -r * 1.18);
    c.lineTo(0, -r * 1.0);
    c.lineTo(r * 0.36, -r * 1.18);
    c.lineTo(r * 0.6, -r * 0.9);
    c.lineTo(r * 1.05, -r * 0.74);
    c.lineTo(r * 0.94, -r * 0.26);
    c.lineTo(r * 0.46, -r * 0.48);
    c.lineTo(0, -r * 0.34);
    c.lineTo(-r * 0.46, -r * 0.48);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#e6e8ef";
    c.beginPath();
    c.moveTo(-r * 0.14, -r * 0.48);
    c.lineTo(-r * 0.02, -r * 0.76);
    c.lineTo(r * 0.08, -r * 0.44);
    c.closePath();
    c.fill();
    c.stroke();

    if (ball.flashTimer <= 0) {
      c.strokeStyle = "#8a3338";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.16, -r * 0.04);
      c.lineTo(r * 0.14, r * 0.14);
      c.stroke();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.46, -r * 0.14);
      c.lineTo(-r * 0.18, -r * 0.04);
      c.stroke();

      c.fillStyle = COLORS.ink;
      c.beginPath();
      c.arc(r * 0.3, -r * 0.08, r * 0.085, 0, Math.PI * 2);
      c.fill();
    }
  };
})();

