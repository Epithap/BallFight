(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function spawnRasenganVisual(x, y, maxR = 46) {
    return {
      x,
      y,
      r: 12,
      spin: 0,
      life: 0.36,
      maxLife: 0.36,
      dead: false,
      update(dt) {
        this.life -= dt;
        this.spin += dt * 24;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        this.r = 14 + (maxR - 14) * (1 - Math.pow(1 - p, 2));
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.spin);
        c.globalAlpha = k;
        c.beginPath();
        c.arc(0, 0, this.r * 1.18, 0, Math.PI * 2);
        c.fillStyle = "rgba(56, 189, 248, 0.28)";
        c.fill();
        c.beginPath();
        c.arc(0, 0, this.r, 0, Math.PI * 2);
        c.fillStyle = COLORS.blue;
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = COLORS.ink;
        c.stroke();
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4;
          c.beginPath();
          c.arc(0, 0, this.r * 0.66, a, a + Math.PI * 0.45);
          c.stroke();
        }
        c.fillStyle = COLORS.white;
        c.beginPath();
        c.arc(0, 0, this.r * 0.28, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  // Lore-accurate 4-bladed Fūton: Rasenshuriken renderer (used in cast & projectile)
  function drawRasenshurikenDisc(c, radius, spin, bladeScale = 1) {
    const R = radius;
    const bp = Math.max(0, Math.min(1, bladeScale));

    // Outer high-velocity wind vortex slipstream halo
    if (bp > 0.1) {
      c.save();
      c.rotate(-spin * 0.65);
      c.fillStyle = "rgba(186, 230, 253, 0.24)";
      c.beginPath();
      c.arc(0, 0, R * (0.95 + 0.72 * bp), 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = "rgba(224, 242, 254, 0.85)";
      c.lineWidth = 2.4;
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI * 0.5) * i;
        c.beginPath();
        c.arc(0, 0, R * (0.85 + 0.68 * bp), a, a + Math.PI * 0.32);
        c.stroke();
      }
      c.restore();
    }

    // 4 sweeping aerodynamic curved wind-shuriken blades
    if (bp > 0.02) {
      for (let i = 0; i < 4; i++) {
        c.save();
        c.rotate((Math.PI * 0.5) * i);
        const bLen = R * 1.68 * bp;
        const bWid = R * 0.52 * bp;

        // Outer wind blade (pure white)
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(R * 0.28, -bWid * 0.32);
        c.quadraticCurveTo(bLen * 0.58, -bWid * 1.05, bLen, -bWid * 0.14);
        c.quadraticCurveTo(bLen * 0.66, bWid * 0.54, R * 0.28, bWid * 0.36);
        c.closePath();
        c.fill();
        c.stroke();

        // Cyan wind-chakra bevel inside each blade
        c.fillStyle = "#bae6fd";
        c.beginPath();
        c.moveTo(R * 0.36, -bWid * 0.12);
        c.quadraticCurveTo(bLen * 0.55, -bWid * 0.56, bLen * 0.82, -bWid * 0.08);
        c.quadraticCurveTo(bLen * 0.56, bWid * 0.22, R * 0.36, bWid * 0.14);
        c.closePath();
        c.fill();
        c.restore();
      }
    }

    // Central spiraling Rasengan core
    const cr = R * 0.62;
    c.fillStyle = "#0284c7";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, 0, cr, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = "#38bdf8";
    c.beginPath();
    c.arc(0, 0, cr * 0.76, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = COLORS.white;
    c.lineWidth = 2.6;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 0.5) * i + spin * 0.5;
      c.beginPath();
      c.arc(0, 0, cr * 0.62, a, a + Math.PI * 0.38);
      c.stroke();
    }

    c.fillStyle = COLORS.white;
    c.beginPath();
    c.arc(0, 0, cr * 0.32, 0, Math.PI * 2);
    c.fill();
  }

  // Lingering wind-cellular vortex spawned by Rasenshuriken that pulls enemies inward
  function spawnRasenshurikenVortex({ x, y, owner, duration = 2.2, radius = 155 }) {
    const cx = Math.max(44, Math.min(WORLD_SIZE - 44, x));
    const cy = Math.max(44, Math.min(WORLD_SIZE - 44, y));
    return {
      x: cx,
      y: cy,
      owner,
      radius,
      life: duration,
      maxLife: duration,
      spin: 0,
      tickTimer: 0.12,
      dead: false,
      update(dt, game) {
        this.life -= dt;
        this.spin += dt * 16;
        this.tickTimer -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        for (const b of game.balls) {
          if (b === this.owner || !b.alive) continue;
          const dx = this.x - b.x;
          const dy = this.y - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist <= this.radius + b.radius) {
            const pullStrength = 720 * (0.45 + 0.55 * (1 - Math.min(1, dist / (this.radius + b.radius))));
            b.vx += (dx / dist) * pullStrength * dt;
            b.vy += (dy / dist) * pullStrength * dt;
            // Dampen tangential escape so enemy gets sucked into the vortex center
            b.vx *= Math.pow(0.28, dt);
            b.vy *= Math.pow(0.28, dt);

            if (this.tickTimer <= 0) {
              const dmg = game.applyDamage(b, 2);
              b.flashTimer = 0.06;
              game.spawnSparks(b.x, b.y, COLORS.white, "#38bdf8");
              game.spawnDamageText(b.x, b.y - b.radius - 10, dmg, "#38bdf8", false, "WIND VORTEX!");
            }
          }
        }
        if (this.tickTimer <= 0) {
          this.tickTimer = 0.34;
        }
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        const fade = Math.min(1, k * 2.4);
        const pulse = 1 + Math.sin(this.spin * 1.4) * 0.05;
        const R = this.radius * pulse;

        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = fade;

        // Outer cellular wind dome
        c.fillStyle = "rgba(56, 189, 248, 0.16)";
        c.beginPath();
        c.arc(0, 0, R, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "rgba(186, 230, 253, 0.22)";
        c.beginPath();
        c.arc(0, 0, R * 0.68, 0, Math.PI * 2);
        c.fill();

        // Inward-spiraling wind suction streams
        c.lineCap = "round";
        for (let i = 0; i < 8; i++) {
          const a0 = this.spin * 1.15 + (i * Math.PI * 2) / 8;
          const a1 = a0 + 0.85;
          const rOuter = R * 0.94;
          const rInner = R * 0.24;
          c.strokeStyle = i % 2 === 0 ? "#ffffff" : "#38bdf8";
          c.lineWidth = i % 2 === 0 ? 3.2 : 2.2;
          c.beginPath();
          c.moveTo(Math.cos(a0) * rOuter, Math.sin(a0) * rOuter);
          c.quadraticCurveTo(
            Math.cos((a0 + a1) * 0.5) * (R * 0.58),
            Math.sin((a0 + a1) * 0.5) * (R * 0.58),
            Math.cos(a1) * rInner,
            Math.sin(a1) * rInner
          );
          c.stroke();
        }

        // Spinning wind-blade rings
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = -this.spin * 1.4 + (i * Math.PI) / 2;
          c.beginPath();
          c.arc(0, 0, R * 0.82, a, a + Math.PI * 0.34);
          c.stroke();
        }

        // Central compressed wind eye
        c.save();
        c.rotate(this.spin * 1.8);
        drawRasenshurikenDisc(c, 22, this.spin, 0.85);
        c.restore();

        c.restore();
      },
    };
  }

  // 1-hit Kyuubi Crimson-Black Claw Slash effect
  function spawnKyuubiClawSlashEffect(x, y, angle = 0, maxR = 68) {
    return {
      x,
      y,
      angle,
      maxR,
      life: 0.32,
      maxLife: 0.32,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p * 0.9);
        const reach = this.maxR * (0.55 + 0.55 * easeOut(p));
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.globalAlpha = alpha;
        c.lineCap = "round";
        c.lineJoin = "round";

        // Three ferocious curved Kyuubi chakra claw gashes
        for (const offset of [-18, 0, 18]) {
          const sc = offset === 0 ? 1.12 : 0.92;
          c.save();
          c.translate(0, offset);
          c.scale(sc, sc);

          // Crimson-black outer slash crescent
          c.fillStyle = "#dc2626";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-reach * 0.75, -10);
          c.quadraticCurveTo(reach * 0.15, -22, reach * 0.95, 2);
          c.quadraticCurveTo(reach * 0.1, -6, -reach * 0.75, -10);
          c.closePath();
          c.fill();
          c.stroke();

          // Pitch-black Kyuubi core streak
          c.strokeStyle = "#140407";
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(-reach * 0.55, -9);
          c.quadraticCurveTo(reach * 0.15, -15, reach * 0.8, 0);
          c.stroke();

          // White-pink razor highlight
          c.strokeStyle = "#fecaca";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(-reach * 0.35, -11);
          c.quadraticCurveTo(reach * 0.2, -16, reach * 0.85, 1);
          c.stroke();
          c.restore();
        }
        c.restore();
      },
    };
  }

  // Hollow-Purple-scale Bijuudama (Tailed Beast Bomb) cataclysmic explosion
  function spawnBijuudamaBurst(x, y, maxR = 205) {
    return {
      x,
      y,
      life: 0.72,
      maxLife: 0.72,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p);
        const rad = 36 + easeOut(p) * maxR;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;
        c.lineCap = "round";

        // Outer crimson-violet Tailed Beast chakra shock dome
        c.fillStyle = "rgba(185, 28, 28, 0.34)";
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

        // 12 radial Bijuudama energy pillar rays bursting outward
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + p * 0.35;
          const r0 = rad * 0.25;
          const r1 = rad * (i % 2 === 0 ? 1.14 : 0.92);
          c.strokeStyle = i % 2 === 0 ? "#ef4444" : "#c084fc";
          c.lineWidth = (1 - p) * (i % 2 === 0 ? 7 : 4.5) + 1.5;
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }

        // Inner dark-matter purple/crimson compression ring
        c.fillStyle = "rgba(88, 28, 135, 0.44)";
        c.beginPath();
        c.arc(0, 0, rad * 0.76, 0, Math.PI * 2);
        c.fill();

        // Central pitch-black Bijuudama singularity sphere with white-crimson rim
        c.fillStyle = "#0f0206";
        c.strokeStyle = "#fecaca";
        c.lineWidth = 4.5 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.46 * (1 - p * 0.35), 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Concentric blast shockwave rings
        c.strokeStyle = "#f87171";
        c.lineWidth = 7 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.86, 0, Math.PI * 2);
        c.stroke();

        c.strokeStyle = "#991b1b";
        c.lineWidth = 10 * (1 - p) + 2;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();

        c.restore();
      },
    };
  }

  function triggerBijuudamaExplosion(gx, gy, owner, g, directHitTarget = null) {
    const cx = Math.max(36, Math.min(WORLD_SIZE - 36, gx));
    const cy = Math.max(36, Math.min(WORLD_SIZE - 36, gy));
    const aoeR = 205;
    g.entities.push(spawnBijuudamaBurst(cx, cy, aoeR));
    g.entities.push(rt.spawnShockRing(cx, cy, "#ef4444", aoeR, 0.5));
    g.entities.push(rt.spawnShockRing(cx, cy, "#c084fc", aoeR * 0.78, 0.4));
    g.entities.push(rt.spawnShockRing(cx, cy, COLORS.white, aoeR * 0.52, 0.3));
    g.spawnSparks(cx, cy, "#ef4444", "#c084fc");
    g.spawnSparks(cx, cy, COLORS.white, "#991b1b");

    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        if (tt !== directHitTarget) {
          const splashDmg = g.applyDamage(tt, Math.round(18 + g.rng() * 4));
          g.spawnDamageText(tt.x, tt.y - tt.radius - 14, splashDmg, "#ef4444", true, "BIJUUDAMA BLAST!");
        }
        const kAng = Math.atan2(tt.y - cy, tt.x - cx);
        tt.vx = Math.cos(kAng) * 620;
        tt.vy = Math.sin(kAng) * 620;
        tt.flashTimer = 0.18;
        tt.squash = 1.0;
        g.addEffect(tt, "stun", 0.85);
      }
    }
    rt.setHitStop(0.12);
    rt.addShake(0.52, 13);
    g.sound.playCritHit();
  }

  const SKILL_RASENGAN = {
    name: "Rasengan",
    cooldown: 3.0,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      // Permanent Four-Tails Kyuubi Cloak Mode: Lunge + 1 Heavy Chakra Claw Slash
      if (ball.kyuubiMode) {
        rt.beginCast(ball, {
          kind: "powerup",
          duration: 0.22,
          color: "#dc2626",
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
            const dashSpeed = b.baseSpeed * 2.45;
            b.vx = ((t.x - b.x) / len) * dashSpeed;
            b.vy = ((t.y - b.y) / len) * dashSpeed;
            b.kyuubiSlashTimer = 0.52;
            b.kyuubiSlashHit = false;
            g.entities.push(rt.spawnShockRing(b.x, b.y, "#dc2626", 85, 0.28));
            g.spawnDamageText(b.x, b.y - b.radius, 0, "#ef4444", true, "KYUUBI LUNGE!");
            g.spawnSparks(b.x, b.y, "#ef4444", "#140407");
          },
        });
        return true;
      }

      const sage = Boolean(ball.evolved);
      rt.beginCast(ball, {
        kind: "orb", duration: sage ? 0.38 : 0.45, color: COLORS.blue, maxR: sage ? 21 : 17,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          const dashSpeed = b.baseSpeed * (sage ? 2.1 : 1.95);
          b.vx = ((t.x - b.x) / len) * dashSpeed;
          b.vy = ((t.y - b.y) / len) * dashSpeed;
          b.rasenganTimer = 0.5;
          b.rasenganHit = false;
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.blue, sage, sage ? "SAGE RASENGAN!" : "RASENGAN!");
          g.spawnSparks(b.x, b.y, COLORS.white, COLORS.blue);
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.naruto = {
    id: "naruto",
    name: "CHILD OF PROPHECY",
    shortName: "PROPHECY",
    title: "Hero of the Leaf • Nine-Tails Vessel",
    role: "SHINOBI • RASENSHURIKEN & SAGE/KYUUBI",
    color: COLORS.narutoOrange,
    radius: 27,
    speed: 380,
    maxHp: 525,
    damage: [8, 14],
    mass: 0.95,
    costume: "naruto",
    weapon: "kunai",
    ult: "rasenshuriken",
    ultName: "RASENSHURIKEN / BIJUUDAMA",
    ultDesc: "Throws a 4-bladed Rasenshuriken that leaves a pulling Wind Vortex! Evolve (10k Gold) into Sage Mode to unlock Four-Tails Nine-Tails & Bijuudama at HP <= 200!",
    skillName: "RASENGAN / KYUUBI SLASH",
    skillDesc: "Dashes with Rasengan (in Evolved Sage Mode: Senpō Giant Rasengan; in Nine-Tails mode: Kyuubi Claw Slash!).",
    skills: [SKILL_RASENGAN],
  };

  BF.TRANSFORM_DETAILS.naruto = {
    label: "🦊 SAGE MODE / FOUR-TAILS KYUUBI",
    speedMult: 1.26,
    radiusMult: 1.08,
    powerText: "20 SLASH / 34+ BIJUUDAMA",
    hpNote: "EVOLVED & HP <= 200 = KYUUBI",
    ultSkillName: "KYUUBI CLAW SLASH & BIJUUDAMA",
    ultSkillCd: "CD: 3.0S",
    ultSkillDesc: "Requires Sage Evolution (10k Gold)! At HP <= 200, permanently enters Four-Tails Kyuubi Cloak with Kyuubi Claw Slash (20 DMG) & Bijuudama Ult!",
  };

  BF.WEAPON_DRAWERS.kunai = (ball, c) => {
    if (ball.kyuubiMode) return;
    c.fillStyle = COLORS.silver;
    c.beginPath();
    c.moveTo(0, -20);
    c.lineTo(7, -4);
    c.lineTo(0, 2);
    c.lineTo(-7, -4);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = COLORS.red;
    c.fillRect(-2.5, 2, 5, 10);
    c.strokeRect(-2.5, 2, 5, 10);
    c.beginPath();
    c.arc(0, 15, 4, 0, Math.PI * 2);
    c.stroke();
  };

  BF.COSTUME_DRAWERS.naruto = (ball, r, c) => {
    if (ball.kyuubiMode) {
      const hurt = ball.flashTimer > 0;
      const t = performance.now() * 0.006;
      const boneSkin = ball.skin === "naruto_six_tails_bone";

      // 1. SWAYING KYUUBI TAILS (6 FOR SKELETAL SKIN, 4 FOR DEFAULT) + BUBBLING CHAKRA SHROUD BEHIND BODY
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      // Outer crimson chakra aura glow
      const pulse = Math.sin(t * 2.4) * 2.5;
      c.fillStyle = boneSkin ? "rgba(220, 38, 38, 0.36)" : "rgba(220, 38, 38, 0.28)";
      c.beginPath();
      c.arc(0, -r * 0.1, r * (boneSkin ? 1.56 : 1.48) + pulse, 0, Math.PI * 2);
      c.fill();

      // 6 Iconic Six-Tails or 4 Iconic Four-Tails Kyuubi Cloak Tails fanning behind Naruto
      const tailAngles = boneSkin
        ? [-1.14, -0.68, -0.23, 0.23, 0.68, 1.14]
        : [-0.74, -0.25, 0.25, 0.74];
      for (let i = 0; i < tailAngles.length; i++) {
        const baseA = tailAngles[i];
        const sway = Math.sin(t * 1.8 + i * 1.15) * 0.13;
        c.save();
        c.rotate(baseA + sway);

        const isCenter = Math.abs(baseA) < 0.5;
        const tLen = r * (boneSkin ? (isCenter ? 2.58 : 2.34) : (isCenter ? 2.45 : 2.2));
        const tWid = r * (boneSkin ? 0.42 : 0.44);

        // Glowing crimson outer chakra coat of the tail
        c.fillStyle = "#dc2626";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-tWid * 0.55, -r * 0.35);
        c.quadraticCurveTo(-tWid * 0.95, -tLen * 0.56, 0, -tLen);
        c.quadraticCurveTo(tWid * 0.95, -tLen * 0.56, tWid * 0.55, -r * 0.35);
        c.closePath();
        c.fill();
        c.stroke();

        // Pitch-black / dark-blood inner core of the tail
        c.fillStyle = boneSkin ? "#3b070c" : "#140407";
        c.strokeStyle = "#ef4444";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(-tWid * 0.34, -r * 0.42);
        c.quadraticCurveTo(-tWid * 0.62, -tLen * 0.54, 0, -tLen * 0.88);
        c.quadraticCurveTo(tWid * 0.62, -tLen * 0.54, tWid * 0.34, -r * 0.42);
        c.closePath();
        c.fill();
        c.stroke();

        c.restore();
      }

      // Bubbling crimson chakra flame ring around body perimeter
      const flames = 12;
      c.fillStyle = "#ef4444";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      for (let i = 0; i < flames * 2; i++) {
        const a = (i * Math.PI) / flames - Math.PI * 0.5;
        const wob = Math.sin(t * 3.2 + i * 1.1) * 2.5;
        const rad = i % 2 === 0 ? r * 1.24 + wob : r * 1.03;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.stroke();

      // SIX-TAILS SKELETAL SKIN: Curved Segmented Bone Spine (Vertebrae) + Dorsal Bone Rib behind head
      if (boneSkin) {
        // Dorsal scapula bone protrusion on left-upper back (matching anime reference)
        c.fillStyle = "#e2e8f0";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(-r * 0.88, -r * 0.68);
        c.lineTo(-r * 0.48, -r * 0.94);
        c.lineTo(-r * 0.38, -r * 1.38);
        c.quadraticCurveTo(-r * 0.56, -r * 1.46, -r * 0.62, -r * 1.18);
        c.lineTo(-r * 0.94, -r * 0.82);
        c.closePath();
        c.fill();
        c.stroke();

        // Arching segmented vertebral column rising over the top of the skull
        const spineSegs = [
          { x: -r * 0.26, y: -r * 1.22, rx: r * 0.16, ry: r * 0.13, rot: -0.55 },
          { x: -r * 0.16, y: -r * 1.44, rx: r * 0.18, ry: r * 0.14, rot: -0.25 },
          { x: -r * 0.02, y: -r * 1.54, rx: r * 0.19, ry: r * 0.14, rot: 0.12 },
          { x: r * 0.04, y: -r * 1.32, rx: r * 0.18, ry: r * 0.13, rot: 0.45 },
          { x: 0, y: -r * 1.06, rx: r * 0.17, ry: r * 0.13, rot: 0.15 },
        ];
        for (const seg of spineSegs) {
          c.save();
          c.translate(seg.x, seg.y);
          c.rotate(seg.rot);
          c.fillStyle = "#f8f6f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.6;
          c.beginPath();
          c.ellipse(0, 0, seg.rx, seg.ry, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          // Vertebra ridge line
          c.strokeStyle = "#94a3b8";
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(-seg.rx * 0.55, 0);
          c.lineTo(seg.rx * 0.55, 0);
          c.stroke();
          c.restore();
        }
      }
      c.restore();

      // 2. RE-FILL BODY DISC WITH PITCH-BLACK & BLOOD-CRIMSON KYUUBI SKIN
      c.save();
      c.fillStyle = hurt ? COLORS.white : "#120306";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Jagged crimson-red chakra mane/coat around top, cheeks, and chest
      if (!hurt) {
        c.fillStyle = "#991b1b";
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.fill();

        // Deep shadow-black central face mask so glowing white eyes & teeth pop
        c.fillStyle = "#090103";
        c.beginPath();
        c.ellipse(0, r * 0.04, r * 0.74, r * 0.64, 0, 0, Math.PI * 2);
        c.fill();

        // Jagged crimson fur/chakra spikes framing the black face
        c.strokeStyle = "#ef4444";
        c.lineWidth = 2.2;
        c.beginPath();
        c.ellipse(0, r * 0.04, r * 0.76, r * 0.66, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();

      // 3. SIX-TAILS SKELETAL KYUUBI ARMOR OR FOUR-TAILS FOX EARS
      if (boneSkin) {
        c.save();
        c.lineJoin = "round";
        c.lineCap = "round";

        // Skeletal Bone Shoulder Pauldrons + Articulated Forearm Bone Blades on both sides
        for (const side of [-1, 1]) {
          // Shoulder bone plate (scapula armor)
          c.fillStyle = hurt ? COLORS.white : "#f8f6f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.8;
          c.beginPath();
          c.moveTo(side * r * 0.56, -r * 0.52);
          c.quadraticCurveTo(side * r * 1.06, -r * 0.58, side * r * 1.18, -r * 0.14);
          c.quadraticCurveTo(side * r * 0.88, -r * 0.04, side * r * 0.58, -r * 0.22);
          c.closePath();
          c.fill();
          c.stroke();

          // Shoulder bone seam detail
          c.strokeStyle = "#94a3b8";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(side * r * 0.68, -r * 0.38);
          c.lineTo(side * r * 1.02, -r * 0.24);
          c.stroke();

          // Humerus bone shaft connecting shoulder to forearm blade
          c.fillStyle = hurt ? COLORS.white : "#e2e8f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(side * r * 0.98, -r * 0.16);
          c.lineTo(side * r * 1.38, r * 0.06);
          c.lineTo(side * r * 1.3, r * 0.2);
          c.lineTo(side * r * 0.9, -r * 0.02);
          c.closePath();
          c.fill();
          c.stroke();

          // Long curved Forearm Bone Blade extending down (matching reference image)
          c.fillStyle = hurt ? COLORS.white : "#f8f6f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.8;
          c.beginPath();
          c.moveTo(side * r * 1.36, -r * 0.12);
          c.quadraticCurveTo(side * r * 1.62, r * 0.28, side * r * 1.48, r * 0.84);
          c.lineTo(side * r * 1.24, r * 0.78);
          c.quadraticCurveTo(side * r * 1.32, r * 0.32, side * r * 1.22, r * 0.04);
          c.closePath();
          c.fill();
          c.stroke();

          // Inner bone groove on forearm blade
          c.strokeStyle = "#64748b";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(side * r * 1.38, r * 0.1);
          c.lineTo(side * r * 1.37, r * 0.68);
          c.stroke();
        }

        // White Bone Fox Skull Helmet over the upper/mid head with deep eye sockets & snout
        c.fillStyle = hurt ? COLORS.white : "#f8f6f0";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.2;
        c.beginPath();
        // Top cranium crown
        c.moveTo(0, -r * 0.96);
        c.quadraticCurveTo(r * 0.56, -r * 0.92, r * 0.64, -r * 0.34);
        // Right cheekbone & zygomatic arch
        c.lineTo(r * 0.72, -r * 0.04);
        c.lineTo(r * 0.52, r * 0.24);
        // Upper jaw fang right
        c.lineTo(r * 0.44, r * 0.54);
        c.lineTo(r * 0.31, r * 0.22);
        // Snout tip over upper teeth
        c.lineTo(r * 0.16, r * 0.28);
        c.lineTo(0, r * 0.2);
        c.lineTo(-r * 0.16, r * 0.28);
        // Upper jaw fang left
        c.lineTo(-r * 0.31, r * 0.22);
        c.lineTo(-r * 0.44, r * 0.54);
        c.lineTo(-r * 0.52, r * 0.24);
        // Left cheekbone & cranium
        c.lineTo(-r * 0.72, -r * 0.04);
        c.lineTo(-r * 0.64, -r * 0.34);
        c.quadraticCurveTo(-r * 0.56, -r * 0.92, 0, -r * 0.96);
        c.closePath();
        c.fill();
        c.stroke();

        // Dark crimson-black recessed eye sockets in the bone skull (so F.naruto's glowing eyes shine inside them)
        for (const side of [-1, 1]) {
          c.fillStyle = "#140407";
          c.strokeStyle = "#991b1b";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(side * r * 0.12, -r * 0.18);
          c.lineTo(side * r * 0.48, -r * 0.34);
          c.lineTo(side * r * 0.56, -r * 0.02);
          c.lineTo(side * r * 0.24, r * 0.08);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // Cranial suture line & nasal bone slits on the fox skull
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -r * 0.94);
        c.lineTo(0, -r * 0.12);
        c.stroke();

        c.fillStyle = COLORS.ink;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.ellipse(side * r * 0.08, r * 0.06, r * 0.035, r * 0.075, side * 0.2, 0, Math.PI * 2);
          c.fill();
        }

        // Lower jawbone mandibles framing the bottom of the roaring mouth
        for (const side of [-1, 1]) {
          c.fillStyle = hurt ? COLORS.white : "#e2e8f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.4;
          c.beginPath();
          c.moveTo(side * r * 0.46, r * 0.32);
          c.lineTo(side * r * 0.34, r * 0.72);
          c.lineTo(side * r * 0.16, r * 0.58);
          c.closePath();
          c.fill();
          c.stroke();
        }

        c.restore();
        return;
      }

      // 3. DEFAULT FOUR-TAILS: TWO TALL POINTED FOX / BEAST EARS ON TOP OF HEAD
      for (const side of [-1, 1]) {
        c.save();
        c.fillStyle = "#b91c1c";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(side * r * 0.22, -r * 0.76);
        c.lineTo(side * r * 0.68, -r * 1.56);
        c.lineTo(side * r * 0.76, -r * 0.56);
        c.closePath();
        c.fill();
        c.stroke();

        // Pitch-black inner ear with crimson rim
        c.fillStyle = "#140407";
        c.strokeStyle = "#ef4444";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(side * r * 0.32, -r * 0.76);
        c.lineTo(side * r * 0.61, -r * 1.36);
        c.lineTo(side * r * 0.66, -r * 0.64);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
      return;
    }

    const sage = Boolean(ball.evolved);
    if (sage) {
      const hurt = ball.flashTimer > 0;
      const t = performance.now() * 0.005;

      // Golden-Orange Senjutsu Nature Energy Aura + Giant Red & Black Toad Summoning Scroll behind back
      c.save();
      c.fillStyle = "rgba(251, 146, 60, 0.24)";
      c.beginPath();
      c.arc(0, 0, r * 1.28 + Math.sin(t * 2.2) * 2, 0, Math.PI * 2);
      c.fill();

      // Giant Toad Summoning Scroll strapped horizontally across lower-mid back
      const sw = r * 1.42;
      const sh = r * 0.42;
      const sy = r * 0.24;
      c.fillStyle = "#dc2626";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.fillRect(-sw, sy - sh * 0.5, sw * 2, sh);
      c.strokeRect(-sw, sy - sh * 0.5, sw * 2, sh);

      // Black scroll end bands & parchment roll tips
      for (const side of [-1, 1]) {
        c.fillStyle = "#18181b";
        c.fillRect(side * sw * 0.72 - r * 0.1, sy - sh * 0.5, r * 0.2, sh);
        c.strokeRect(side * sw * 0.72 - r * 0.1, sy - sh * 0.5, r * 0.2, sh);

        c.fillStyle = "#fef3c7";
        c.beginPath();
        c.ellipse(side * sw, sy, r * 0.1, sh * 0.5, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Scroll rod core
        c.fillStyle = "#18181b";
        c.beginPath();
        c.arc(side * sw * 1.05, sy, r * 0.06, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.restore();

      // Re-fill base body disc over the background scroll
      c.save();
      c.fillStyle = hurt ? COLORS.white : ball.color;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    if (sage) {
      // Dark inner mesh/jacket
      c.fillStyle = "#18181b";
      c.fillRect(-r, r * 0.48, r * 2, r * 0.56);
      c.strokeRect(-r, r * 0.48, r * 2, r * 0.56);

      // Iconic Crimson-Red Toad Sage Cloak (Haori) on left & right shoulders
      c.fillStyle = "#dc2626";
      c.beginPath();
      c.moveTo(-r, r * 0.44);
      c.lineTo(-r * 0.24, r * 0.52);
      c.lineTo(-r * 0.32, r);
      c.lineTo(-r, r);
      c.closePath();
      c.fill();
      c.stroke();

      c.beginPath();
      c.moveTo(r, r * 0.44);
      c.lineTo(r * 0.24, r * 0.52);
      c.lineTo(r * 0.32, r);
      c.lineTo(r, r);
      c.closePath();
      c.fill();
      c.stroke();

      // Black flame motifs along bottom of Sage Cloak
      c.fillStyle = "#18181b";
      for (const fx of [-0.72, -0.5, 0.5, 0.72]) {
        c.beginPath();
        c.moveTo((fx - 0.09) * r, r);
        c.lineTo(fx * r, r * 0.74);
        c.lineTo((fx + 0.09) * r, r);
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = COLORS.ichigoDark;
      c.fillRect(-r, r * 0.54, r * 2, r * 0.52);
      c.strokeRect(-r, r * 0.54, r * 2, r * 0.52);
      c.fillStyle = COLORS.narutoOrange;
      c.fillRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
      c.strokeRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
      c.strokeStyle = COLORS.white;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, r * 0.6);
      c.lineTo(0, r);
      c.stroke();
    }
    c.restore();

    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.moveTo(-r * 0.96, -r * 0.28);
    c.lineTo(-r * 1.24, -r * 0.65);
    c.lineTo(-r * 0.85, -r * 0.72);
    c.lineTo(-r * 0.98, -r * 1.14);
    c.lineTo(-r * 0.48, -r * 0.92);
    c.lineTo(-r * 0.22, -r * 1.32);
    c.lineTo(r * 0.06, -r * 0.96);
    c.lineTo(r * 0.38, -r * 1.3);
    c.lineTo(r * 0.56, -r * 0.9);
    c.lineTo(r * 1.04, -r * 1.08);
    c.lineTo(r * 0.88, -r * 0.68);
    c.lineTo(r * 1.24, -r * 0.62);
    c.lineTo(r * 0.95, -r * 0.28);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = COLORS.ichigoDark;
    c.fillRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);
    c.strokeRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);

    c.fillStyle = COLORS.silver;
    c.fillRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);
    c.strokeRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);

    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -r * 0.51, r * 0.08, 0, Math.PI * 1.7);
    c.stroke();

    for (const side of [-1, 1]) {
      for (const dy of [0.14, 0.24, 0.34]) {
        c.beginPath();
        c.moveTo(side * r * 0.58, r * dy);
        c.lineTo(side * r * 0.84, r * (dy + 0.03));
        c.stroke();
      }
    }
  };

  BF.spawnRasenganVisual = spawnRasenganVisual;
  BF.drawRasenshurikenDisc = drawRasenshurikenDisc;
  BF.spawnRasenshurikenVortex = spawnRasenshurikenVortex;
  BF.spawnKyuubiClawSlashEffect = spawnKyuubiClawSlashEffect;
  BF.triggerBijuudamaExplosion = triggerBijuudamaExplosion;
})();
