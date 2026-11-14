(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
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
              target._gutsBleedTimer = 2.4;
              target._gutsBleedTick = 0.55;
              const kAng = Math.atan2(dy, dx);
              target.vx = Math.cos(kAng) * knockback;
              target.vy = Math.sin(kAng) * knockback;
              g.spawnSparks(target.x, target.y, berserk ? COLORS.red : COLORS.silver, COLORS.ink);
              g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, berserk ? COLORS.red : COLORS.silver, true, berserk ? "BERSERK CLEAVE!" : "CLEAVE! +BLEED");
              if (!berserk) g.chargeUlt(owner);
              rt.setHitStop(berserk ? 0.06 : 0.04);
              rt.addShake(berserk ? 0.18 : 0.14, berserk ? 4.5 : 3.5);
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

  function spawnRepeaterBolt({ owner, target, x, y, angle, speed = 780, damage = 6 }) {
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    return {
      owner,
      target,
      x,
      y,
      vx,
      vy,
      angle,
      radius: 7,
      isArrow: true,
      dead: false,
      update(dt, g) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < -20 || this.x > WORLD_SIZE + 20 || this.y < -20 || this.y > WORLD_SIZE + 20) {
          this.dead = true;
          return;
        }

        if (!this.target || !this.target.alive) return;
        const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (dist <= this.target.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(this.target, damage);
          this.target.flashTimer = 0.08;
          this.target.squash = 0.45;
          g.chargeUlt(this.owner);
          g.spawnSparks(this.x, this.y, COLORS.silver, COLORS.red);
          g.spawnDamageText(
            this.target.x + (g.rng() - 0.5) * 18,
            this.target.y - this.target.radius - 10,
            dealt,
            COLORS.silver,
            false,
            "BOLT!"
          );
          g.sound.playBallHit();
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        // Dark iron shaft
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(-14, 0);
        c.lineTo(10, 0);
        c.stroke();

        c.strokeStyle = COLORS.silver;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-12, 0);
        c.lineTo(10, 0);
        c.stroke();

        // Steel broadhead tip
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(15, 0);
        c.lineTo(6, -4.5);
        c.lineTo(8, 0);
        c.lineTo(6, 4.5);
        c.closePath();
        c.fill();
        c.stroke();

        // Crimson fletching feathers
        c.fillStyle = COLORS.red;
        c.beginPath();
        c.moveTo(-10, 0);
        c.lineTo(-16, -4);
        c.lineTo(-13, 0);
        c.lineTo(-16, 4);
        c.closePath();
        c.fill();

        c.restore();
      },
    };
  }

  function spawnHandCannonBlast({ owner, angle, reach = 180, duration = 0.25, damage = 22 }) {
    const hitSet = new Set();
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

        for (const t of g.balls) {
          if (t === owner || !t.alive || hitSet.has(t)) continue;
          const dx = t.x - owner.x;
          const dy = t.y - owner.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= reach + t.radius) {
            let diff = Math.atan2(dy, dx) - angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) <= Math.PI * 0.42 || dist <= owner.radius + t.radius + 32) {
              hitSet.add(t);
              const dealt = g.applyDamage(t, damage);
              t.flashTimer = 0.2;
              t.squash = 0.95;
              const kAng = Math.atan2(dy, dx);
              t.vx = Math.cos(kAng) * 460;
              t.vy = Math.sin(kAng) * 460;
              g.addEffect(t, "slow", 0.55, { factor: 0.4 });
              // Instant combo setup: Hand Cannon recoil spins Guts right into Dragonslayer Cleave!
              if (owner.skills[0] && owner.skills[0]._cd > 0.2) {
                owner.skills[0]._cd = Math.max(0.15, owner.skills[0]._cd - 1.15);
              }
              g.chargeUlt(owner);
              g.spawnSparks(t.x, t.y, "#f97316", COLORS.red);
              g.spawnDamageText(t.x, t.y - t.radius - 16, dealt, "#f97316", true, "HAND CANNON!!");
              g.sound.playCritHit();
              rt.setHitStop(0.06);
              rt.addShake(0.18, 4.5);
            }
          }
        }

        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const curR = reach * (0.35 + 0.65 * Math.pow(p, 0.5));
        const alpha = Math.max(0, 1 - p * 0.85);

        c.save();
        c.translate(this.x, this.y);
        c.rotate(angle);
        c.globalAlpha = alpha;

        // Fiery explosive cone from prosthetic iron arm
        const grad = c.createRadialGradient(owner.radius * 0.6, 0, 6, owner.radius * 0.6, 0, curR);
        grad.addColorStop(0, "rgba(255, 255, 220, 0.98)");
        grad.addColorStop(0.35, "rgba(249, 115, 22, 0.88)");
        grad.addColorStop(0.7, "rgba(220, 38, 38, 0.65)");
        grad.addColorStop(1, "rgba(20, 20, 28, 0)");

        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(owner.radius * 0.4, 0);
        c.arc(0, 0, curR, -Math.PI * 0.36, Math.PI * 0.36);
        c.closePath();
        c.fill();

        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.stroke();

        c.restore();
      },
    };
  }

  const SKILL_DRAGONSLAYER_CLEAVE = {
    name: "Dragonslayer Cleave",
    cooldown: 1.95,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      // Only swing when within lunge-cleave range so Guts never wastes swings on empty air!
      const triggerRange = inUlt ? 290 : 235;
      if (dist > triggerRange + target.radius) return false;

      rt.beginCast(ball, {
        kind: "swing", duration: inUlt ? 0.12 : 0.24, color: inUlt ? COLORS.red : COLORS.silver,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const berserk = b.ultTimer > 0;
          // Heavy Iron Lunge Step toward enemy as Guts swings the Dragonslayer!
          const spd = Math.max(Math.hypot(b.vx, b.vy), b.baseSpeed);
          b.vx = Math.cos(ang) * spd * (berserk ? 1.38 : 1.32);
          b.vy = Math.sin(ang) * spd * (berserk ? 1.38 : 1.32);

          if (berserk) {
            if (b.skills[0]) b.skills[0]._cd = 1.15;
            gg.entities.push(spawnGreatswordSwing({
              owner: b,
              angle: ang,
              arcSpan: Math.PI * 2,
              reach: 158,
              duration: 0.2,
              damage: Math.round(25 + gg.rng() * 6),
              knockback: 260,
              berserk: true,
              direction: 1,
              onComplete(gg2) {
                if (!b.alive) return;
                const t2 = gg2.balls.find((x) => x !== b && x.alive);
                const ang2 = t2 ? Math.atan2(t2.y - b.y, t2.x - b.x) : ang;
                const spd2 = Math.max(Math.hypot(b.vx, b.vy), b.baseSpeed);
                b.vx = Math.cos(ang2) * spd2 * 1.32;
                b.vy = Math.sin(ang2) * spd2 * 1.32;
                gg2.entities.push(spawnGreatswordSwing({
                  owner: b,
                  angle: ang2,
                  arcSpan: Math.PI * 2,
                  reach: 164,
                  duration: 0.22,
                  damage: Math.round(29 + gg2.rng() * 8),
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
              arcSpan: Math.PI * 1.05,
              reach: 138,
              duration: 0.24,
              damage: Math.round(26 + gg.rng() * 6),
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
    onHit(ball) {
      // Since Guts deals 0 body collision damage by design, colliding shaves cooldown off Dragonslayer Cleave!
      if (ball.skills[0] && ball.skills[0]._cd > 0.15) {
        ball.skills[0]._cd = Math.max(0.05, ball.skills[0]._cd - 0.85);
      }
      return false;
    },
  };

  const SKILL_PROSTHETIC_ARSENAL = {
    name: "Prosthetic Arm: Cannon & Repeater",
    cooldown: 3.2,
    onTick(ball, g) {
      if (ball.swingState) return false;
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      const isClose = dist <= 185 + target.radius;

      rt.beginCast(ball, {
        kind: isClose ? "fire" : "arrow",
        duration: isClose ? 0.15 : 0.18,
        color: isClose ? "#f97316" : COLORS.silver,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const curDist = Math.hypot(t.x - b.x, t.y - b.y);

          if (curDist <= 200 + t.radius) {
            // Close range: Hidden Hand Cannon Explosive Blast!
            gg.entities.push(spawnHandCannonBlast({
              owner: b,
              angle: ang,
              reach: 185,
              duration: 0.25,
              damage: Math.round(21 + gg.rng() * 6),
            }));
            for (let i = 0; i < 12; i++) {
              const a = ang + (gg.rng() - 0.5) * 0.9;
              const sp = 140 + gg.rng() * 220;
              rt.particles.push({
                x: b.x + Math.cos(ang) * b.radius,
                y: b.y + Math.sin(ang) * b.radius,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp,
                size: 5 + gg.rng() * 4,
                life: 0.26,
                maxLife: 0.26,
                color: i % 2 === 0 ? "#f97316" : "#1c1d24",
              });
            }
            gg.sound.playCritHit();
            gg.spawnDamageText(b.x, b.y - b.radius, 0, "#f97316", false, "IRON CANNON!");
          } else {
            // Mid/Long range: 4-Bolt Repeater Crossbow Volley!
            for (let i = 0; i < 4; i++) {
              gg.entities.push(rt.spawnDelayedAction(i * 0.08, (gg2) => {
                if (!b.alive) return;
                const tgt = gg2.balls.find((x) => x !== b && x.alive);
                if (!tgt) return;
                const aim = Math.atan2(tgt.y - b.y, tgt.x - b.x) + (gg2.rng() - 0.5) * 0.07;
                const m = rt.castMuzzle(b, aim, 14);
                gg2.entities.push(spawnRepeaterBolt({
                  owner: b,
                  target: tgt,
                  x: m.x,
                  y: m.y,
                  angle: aim,
                  speed: 790,
                  damage: Math.round(5 + gg2.rng() * 3),
                }));
                gg2.sound.playKnifeThrow();
              }));
            }
            gg.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.silver, false, "REPEATER VOLLEY x4!");
          }
        },
      });
      return true;
    },
  };

  const SKILL_STRUGGLERS_GRIT = {
    name: "Struggler's Grit & Counter-Slash",
    cooldown: 0,
    onTick(ball, g, dt) {
      if (ball._counterCd > 0) ball._counterCd = Math.max(0, ball._counterCd - dt);

      // 1. Struggler's Grit: Missing HP accelerates Guts's skill cooldowns up to +45% faster!
      const missingRatio = Math.max(0, Math.min(1, 1 - ball.hp / ball.maxHp));
      const bonusRate = missingRatio * 0.45 + (ball.ultTimer > 0 ? 0.25 : 0);
      if (bonusRate > 0) {
        for (const s of ball.skills) {
          if (s._cd > 0) s._cd = Math.max(0, s._cd - dt * bonusRate);
        }
      }

      // 2. Tick Dragonslayer Bleed on enemies cleaved by Guts
      for (const t of g.balls) {
        if (t === ball || !t.alive || !(t._gutsBleedTimer > 0)) continue;
        t._gutsBleedTimer = Math.max(0, t._gutsBleedTimer - dt);
        t._gutsBleedTick = (t._gutsBleedTick || 0.55) - dt;
        if (t._gutsBleedTick <= 0) {
          t._gutsBleedTick = 0.55;
          const bleedDmg = g.applyDamage(t, 3);
          g.spawnSparks(t.x, t.y, COLORS.red, "#1c1d24");
          g.spawnDamageText(t.x + (g.rng() - 0.5) * 16, t.y - t.radius - 8, bleedDmg, COLORS.red, false, "BLEED");
        }
      }
      return false;
    },
    onDamaged(ball, amount, g) {
      if (amount < 4 || !ball.alive) return false;
      // Passive Grit armor: brief tenacity shield when taking hits at low HP
      const missingRatio = Math.max(0, Math.min(1, 1 - ball.hp / ball.maxHp));
      if (missingRatio >= 0.25) {
        g.addEffect(ball, "shield", 0.9, { reduction: Math.min(0.32, 0.12 + missingRatio * 0.25) });
      }

      // Counter-Slash when struck in close range!
      if (ball._counterCd > 0 || ball.swingState) return false;
      const attacker = g.balls.find((b) => b !== ball && b.alive);
      if (!attacker) return false;
      const dist = Math.hypot(attacker.x - ball.x, attacker.y - ball.y);
      if (dist <= ball.radius + attacker.radius + 115) {
        ball._counterCd = 3.8;
        const ang = Math.atan2(attacker.y - ball.y, attacker.x - ball.x);
        const berserk = ball.ultTimer > 0;
        g.entities.push(spawnGreatswordSwing({
          owner: ball,
          angle: ang,
          arcSpan: Math.PI * 1.1,
          reach: 142,
          duration: 0.2,
          damage: Math.round(19 + g.rng() * 5),
          knockback: 380,
          berserk,
        }));
        g.sound.playCritHit();
        g.spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, COLORS.red, true, "STRUGGLER'S COUNTER!");
        return true;
      }
      return false;
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
    speed: 360,
    maxHp: 625,
    damage: [0, 0],
    mass: 1.15,
    costume: "guts",
    weapon: "dragonslayer",
    ult: "berserker_armor",
    ultName: "BERSERKER ARMOR",
    ultDesc: "Dons the cursed Berserker Armor! Gains +35% speed, 30% damage reduction, leaps at the foe, and unleashes 2x 360° Savage Rampage.",
    skillName: "DRAGONSLAYER & PROSTHETIC ARSENAL",
    skillDesc: "0 collision damage by design! Lunges with bleed-inflicting Dragonslayer Cleaves, fires Hand Cannon & Repeater Crossbow, and counters close hits!",
    skills: [SKILL_DRAGONSLAYER_CLEAVE, SKILL_PROSTHETIC_ARSENAL, SKILL_STRUGGLERS_GRIT],
  };

  BF.TRANSFORM_DETAILS.guts = {
    label: "🔥 BERSERKER",
    speedMult: 1.35,
    radiusMult: 1.0,
    powerText: "54-68 x2",
    ultSkillName: "SAVAGE RAMPAGE x2",
    ultSkillCd: "CD: 1.15S",
    ultSkillDesc: "Speed +35% & 30% Armor! Leaps into 2x consecutive 360° Dragonslayer swings (25-31 + 29-37 DMG) with Bleed & Prosthetic Cannon combos.",
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

