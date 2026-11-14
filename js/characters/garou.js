// ============================================================
//  GAROU (HERO HUNTER / AWAKENED MONSTER)
//  One-Punch Man — Red-Orange Hair Base & Awakened Monster Ult
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

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
      t: 0,
      radius: 14,
      life: 1.15,
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
          if (!isMonster && !this.castState.ultCharged) {
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
            isMonster,
            this.isWater ? "WATER STREAM!" : "WHIRLWIND IRON!"
          );
          g.sound.playBallHit();
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

        // 1. Deflect incoming enemy projectiles back at the opponent!
        const enemy = g.balls.find((b) => b !== this.owner && b.alive);
        for (const ent of g.entities) {
          if (
            ent &&
            !ent.dead &&
            ent.owner &&
            ent.owner !== this.owner &&
            typeof ent.vx === "number" &&
            typeof ent.vy === "number"
          ) {
            const d = Math.hypot(ent.x - this.owner.x, ent.y - this.owner.y);
            if (d <= this.owner.radius + (ent.radius || 12) + 24) {
              ent.owner = this.owner;
              if (enemy) ent.target = enemy;
              const spd = Math.hypot(ent.vx, ent.vy) * 1.35;
              const retAng = enemy
                ? Math.atan2(enemy.y - ent.y, enemy.x - ent.x)
                : Math.atan2(-ent.vy, -ent.vx);
              ent.vx = Math.cos(retAng) * spd;
              ent.vy = Math.sin(retAng) * spd;
              ent.angle = retAng;
              g.entities.push(rt.spawnShockRing(ent.x, ent.y, "#38bdf8", 58, 0.22));
              g.spawnDamageText(this.owner.x, this.owner.y - this.owner.radius - 14, "DEFLECTED!", "#38bdf8", true, "WATER STREAM!");
              g.sound.playCritHit();
            }
          }
        }

        // 2. Counter-Throw if enemy body enters close guard range
        if (!this.countered && enemy) {
          const dist = Math.hypot(enemy.x - this.owner.x, enemy.y - this.owner.y);
          if (dist <= this.owner.radius + enemy.radius + 16) {
            this.countered = true;
            this.dead = true;
            const nx = (enemy.x - this.owner.x) / (dist || 1);
            const ny = (enemy.y - this.owner.y) / (dist || 1);
            const dealt = g.applyDamage(enemy, Math.round(10 + rt.rng() * 2));
            enemy.flashTimer = 0.14;
            enemy.squash = 0.85;
            enemy.vx = nx * 360;
            enemy.vy = ny * 360;
            g.addEffect(enemy, "stun", 0.35);
            g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#38bdf8", 88, 0.3));
            g.spawnSparks(enemy.x, enemy.y, "#38bdf8", "#f43f5e");
            g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 14, dealt, "#38bdf8", true, "WATER STREAM COUNTER!");
            g.sound.playCritHit();
            rt.setHitStop(0.05);
            rt.addShake(0.16, 4.5);
          }
        }
      },
      render(c) {
        if (!this.owner || !this.owner.alive) return;
        const a = Math.min(1, this.life / 0.25);
        c.save();
        c.globalAlpha = 0.88 * a;
        c.translate(this.owner.x, this.owner.y);
        c.rotate(this.spin);
        const rr = this.owner.radius + 16;
        c.lineCap = "round";
        for (let i = 0; i < 3; i++) {
          const sa = (i * Math.PI * 2) / 3;
          c.strokeStyle = "#38bdf8";
          c.shadowColor = "#0284c7";
          c.shadowBlur = 10;
          c.lineWidth = 4;
          c.beginPath();
          c.arc(0, 0, rr, sa, sa + 1.25);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // ---- Monster Form Opener: Monster Calamity Shockwave ----
  BF.triggerGarouMonsterOpener = (b, g) => {
    b._godSlayerCd = 0.8;
    const enemy = g.balls.find((x) => x !== b && x.alive);
    if (enemy && Math.hypot(enemy.x - b.x, enemy.y - b.y) <= b.radius + enemy.radius + 135) {
      const dealt = g.applyDamage(enemy, 10);
      const ang = Math.atan2(enemy.y - b.y, enemy.x - b.x);
      enemy.vx += Math.cos(ang) * 300;
      enemy.vy += Math.sin(ang) * 300;
      enemy.flashTimer = 0.14;
      g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 16, dealt, "#ef4444", true, "MONSTER CALAMITY!");
    }
    rt.addShake(0.24, 6.5);
  };

  // ---- Skill 1: Water Stream & Whirlwind Spiral (Primary +1 Ult Charge) ----
  const SKILL_WHIRLWIND_FIST = {
    name: "Twin-Stream Spiral",
    cooldown: 2.6,
    onTick(ball, g, dt) {
      const enemy = g.balls.find((b) => b !== ball && b.alive);
      if (enemy && dt && enemy._garouRuptureTimer > 0) {
        enemy._garouRuptureTimer -= dt;
        if (enemy._garouRuptureTimer <= 0) {
          const dealt = g.applyDamage(enemy, 2);
          g.entities.push(rt.spawnShockRing(enemy.x, enemy.y, "#f43f5e", 46, 0.2));
          g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 10, dealt, "#f43f5e", false, "INTERNAL RUPTURE!");
        }
      }

      // Monster Form Active: God Slayer Instant Fist barrage every 1.5s
      if (ball.ultTimer > 0 && dt && enemy) {
        ball._godSlayerCd = (ball._godSlayerCd || 0) - dt;
        if (ball._godSlayerCd <= 0) {
          ball._godSlayerCd = 1.5;
          const aim = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
          const m = rt.castMuzzle(ball, aim, 14);
          const dummyState = { ultCharged: true };
          g.entities.push(
            spawnSpiralMartialWave({
              owner: ball,
              target: enemy,
              x: m.x,
              y: m.y,
              angle: aim,
              speed: 660,
              damage: Math.round(6 + rt.rng()),
              phase: 0,
              isWater: false,
              castState: dummyState,
              isMonster: true,
            })
          );
          g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, "#ef4444", false, "GOD SLAYER FIST!");
        }
      }

      if (this._cd > 0 || !enemy) return false;
      const dist = Math.hypot(enemy.x - ball.x, enemy.y - ball.y);
      if (dist > 320) return false;

      const isMonster = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: isMonster ? "#ef4444" : "#38bdf8",
        renderCast(b, c, p, ang) {
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
      if (ball.ultTimer > 0 && target && target.alive) {
        const extra = g.applyDamage(target, 4);
        g.entities.push(rt.spawnShockRing(target.x, target.y, "#ef4444", 72, 0.24));
        g.spawnDamageText(target.x, target.y - target.radius - 16, extra, "#fb923c", true, "FA JIN!");
      }
    },
  };

  // ---- Skill 2: Water Stream Rock Smashing Counter (True Parry & Deflect Stance, No Ult Charge) ----
  const SKILL_WATER_STREAM_COUNTER = {
    name: "Water Stream Counter",
    cooldown: 4.5,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
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

  // ---- Weapon Drawer: Twin-Stream Martial Arts Aura ----
  BF.WEAPON_DRAWERS.martial_aura = (ball, c) => {
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

  // ---- Costume Drawer: Base (Red-Orange Hair Awakening Garou) & Ult (Awakened Monster Form) ----
  BF.COSTUME_DRAWERS.garou = (ball, r, c) => {
    const isMonster = ball.ultTimer > 0;
    const t = performance.now() * 0.003;

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

    // Garou's Twin Horned Hair: Red-Orange Awakening in Base, Cracked Black-Crimson Horns in Monster Form
    const hair = [
      [-0.95, -0.06], [-1.2, -0.34], [-0.95, -0.48], [-1.36, -0.82], [-0.98, -0.88],
      [-1.24, -1.52], [-0.6, -1.16], [-0.42, -1.28],
      [-0.18, -1.08], [0, -1.01], [0.18, -1.08],
      [0.42, -1.28], [0.6, -1.16], [1.24, -1.52], [0.98, -0.88], [1.36, -0.82],
      [0.95, -0.48], [1.2, -0.34], [0.95, -0.06],
      [0.74, -0.26], [0.46, -0.46], [0.18, -0.38], [0, -0.22],
      [-0.18, -0.38], [-0.46, -0.46], [-0.74, -0.26],
    ];

    c.save();
    c.lineJoin = "round";
    const hGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.52);
    if (isMonster) {
      hGrad.addColorStop(0, "#09090b");
      hGrad.addColorStop(0.55, "#450a0a");
      hGrad.addColorStop(1, "#ef4444");
    } else {
      // Base: Vibrant Red-Orange Spiral Garou hair
      hGrad.addColorStop(0, "#fb923c");
      hGrad.addColorStop(0.55, "#ea580c");
      hGrad.addColorStop(1, "#dc2626");
    }
    c.fillStyle = hGrad;
    c.strokeStyle = isMonster ? "#ef4444" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    c.strokeStyle = isMonster ? "rgba(251, 146, 60, 0.78)" : "rgba(254, 215, 170, 0.65)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.12, -0.42, -0.68, -1.04], [-0.38, -0.56, -1.04, -1.28], [-0.62, -0.44, -1.1, -0.74],
      [0.12, -0.42, 0.68, -1.04], [0.38, -0.56, 1.04, -1.28], [0.62, -0.44, 1.1, -0.74],
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
    title: "Fist of Flowing Water • Awakened Monster",
    role: "MARTIAL ARTIST • MONSTER COUNTER",
    color: "#ea580c",
    radius: 28,
    speed: 372,
    maxHp: 575,
    damage: [6, 9],
    mass: 1.02,
    costume: "garou",
    weapon: "martial_aura",
    ult: "cosmic_fear",
    ultName: "MONSTERIZATION (AWAKENED FORM)",
    ultDesc: "Awakens Monster Form for 8s! Deals Monster Calamity shockwave, empowers collisions with Extreme Fa Jin (+4 DMG), and fires God Slayer Fists!",
    skillName: "TWIN-STREAM SPIRAL & WATER STREAM COUNTER",
    skillDesc: "Fires weaving Water Stream & Whirlwind Iron spiral waves, and enters Water Stream Stance to deflect enemy projectiles & counter-throw attackers!",
    skills: [SKILL_WHIRLWIND_FIST, SKILL_WATER_STREAM_COUNTER],
  };
})();
