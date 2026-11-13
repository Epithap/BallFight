(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnKamehamehaBeam(owner, target, chargeDuration = 0) {
    const dx = target.x - owner.x;
    const dy = target.y - owner.y;
    const angle = Math.atan2(dy, dx);
    const length = WORLD_SIZE * 1.6;
    const beamDuration = 0.82;

    return {
      x: owner.x,
      y: owner.y,
      angle,
      timer: 0,
      tickTimer: 0,
      dead: false,
      update(dt, game) {
        if (!owner.alive) {
          this.dead = true;
          return;
        }
        this.timer += dt;
        if (this.timer >= chargeDuration + beamDuration) {
          this.dead = true;
          return;
        }
        if (this.timer >= chargeDuration && !this.fired) {
          this.fired = true;
          game.entities.push(rt.spawnShockRing(owner.x + Math.cos(this.angle) * 40, owner.y + Math.sin(this.angle) * 40, COLORS.blue, 100, 0.4));
          rt.addShake(0.3, 6);
        }
        if (this.timer < chargeDuration || !target.alive) return;

        this.tickTimer -= dt;
        if (this.tickTimer <= 0) {
          const ux = Math.cos(this.angle);
          const uy = Math.sin(this.angle);
          const relX = target.x - this.x;
          const relY = target.y - this.y;
          const proj = relX * ux + relY * uy;
          if (proj > 0) {
            const perp = Math.abs(relX * -uy + relY * ux);
            if (perp <= target.radius + 20) {
              this.tickTimer = 0.2;
              const dealt = game.applyDamage(target, 9);
              target.flashTimer = 0.08;
              game.spawnSparks(target.x, target.y, COLORS.blue, COLORS.white);
              game.spawnDamageText(target.x, target.y - target.radius, dealt, COLORS.blue, false, "KAMEHAMEHA!");
              game.sound.playBallHit();
            }
          }
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        if (this.timer < chargeDuration) {
          c.strokeStyle = COLORS.blue;
          c.lineWidth = 4;
          c.setLineDash([10, 8]);
          c.beginPath();
          c.moveTo(owner.radius, 0);
          c.lineTo(length, 0);
          c.stroke();
          c.setLineDash([]);
          c.fillStyle = COLORS.blue;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(owner.radius + 10, 0, 8 + (this.timer / chargeDuration) * 24, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        } else {
          const fade = Math.min(1, (chargeDuration + beamDuration - this.timer) * 5);
          const halfW = 20 * fade;
          c.fillStyle = COLORS.blue;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 4;
          c.beginPath();
          c.rect(owner.radius, -halfW, length, halfW * 2);
          c.fill();
          c.stroke();
          c.fillStyle = COLORS.white;
          c.fillRect(owner.radius, -halfW * 0.45, length, halfW * 0.9);
        }
        c.restore();
      },
    };
  }

  function spawnDragonKickCombo(attacker, defender, ult = false) {
    let stepIdx = 0;
    let timer = 0;
    const damages = ult ? [9, 9, 12] : [6, 6, 8];
    const interval = ult ? 0.09 : 0.11;
    let finished = false;
    return {
      update(dt, g) {
        if (finished) return false;
        if (!defender.alive || !attacker.alive) {
          finished = true;
          return false;
        }
        timer -= dt;
        if (timer <= 0 && stepIdx < 3) {
          timer = interval;
          const hitNum = stepIdx + 1;
          const dmg = g.applyDamage(defender, damages[stepIdx]);
          const ang = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          const hitX = (attacker.x + defender.x) * 0.5;
          const hitY = (attacker.y + defender.y) * 0.5;
          const color = ult ? COLORS.red : COLORS.gold;
          g.spawnSparks(hitX, hitY, color, COLORS.white);
          g.entities.push(rt.spawnShockRing(defender.x, defender.y, color, hitNum === 3 ? 115 : 68, hitNum === 3 ? 0.36 : 0.22));
          g.sound.playBallHit();
          rt.addShake(hitNum === 3 ? 0.28 : 0.12, hitNum === 3 ? 7 : 3);
          if (hitNum < 3) {
            g.addEffect(defender, "stun", 0.22);
            defender.vx *= 0.2;
            defender.vy *= 0.2;
            g.spawnDamageText(defender.x, defender.y - defender.radius - 12, dmg, color, false, `DRAGON KICK ${hitNum}/3!`);
          } else {
            const kb = ult ? 820 : 660;
            defender.vx = Math.cos(ang) * kb;
            defender.vy = Math.sin(ang) * kb;
            defender.squash = 0.95;
            g.spawnDamageText(defender.x, defender.y - defender.radius - 16, dmg, color, true, ult ? "KAIOKEN DRAGON LAUNCH!" : "DRAGON KICK 3/3!");
            finished = true;
            return false;
          }
          stepIdx++;
        }
        return !finished;
      },
      draw() {},
    };
  }

  function spawnApeWallSlamBurst(x, y, maxR = 175) {
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
        const ease = BF.easeOut ? BF.easeOut(p) : 1 - (1 - p) * (1 - p);
        const rad = 28 + ease * maxR;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;

        // Solid layered seismic/crimson shockwave rings (1.2 convention)
        c.fillStyle = "rgba(120, 53, 15, 0.36)";
        c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(220, 38, 38, 0.45)";
        c.beginPath(); c.arc(0, 0, rad * 0.78, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(245, 158, 11, 0.65)";
        c.beginPath(); c.arc(0, 0, rad * 0.52, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(254, 249, 195, 0.92)";
        c.beginPath(); c.arc(0, 0, rad * 0.26, 0, Math.PI * 2); c.fill();

        // Radial crater fracture spikes & flying rock shards
        c.lineCap = "round";
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + p * 0.5;
          const r0 = rad * 0.22;
          const r1 = rad * (i % 2 === 0 ? 1.06 : 0.84);
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 6 * (1 - p);
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
          c.strokeStyle = i % 2 === 0 ? "#f59e0b" : "#ef4444";
          c.lineWidth = 3 * (1 - p);
          c.stroke();
        }

        c.strokeStyle = "#dc2626";
        c.lineWidth = 9 * (1 - p) + 2;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();

        c.strokeStyle = "#fef08a";
        c.lineWidth = 4.5 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.66, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  function triggerApeWallSlam(gx, gy, owner, g) {
    const cx = Math.max(28, Math.min(WORLD_SIZE - 28, gx));
    const cy = Math.max(28, Math.min(WORLD_SIZE - 28, gy));
    const aoeR = 175;
    g.entities.push(spawnApeWallSlamBurst(cx, cy, aoeR));
    g.entities.push(rt.spawnShockRing(cx, cy, "#f59e0b", aoeR * 0.95, 0.45));
    g.entities.push(rt.spawnShockRing(cx, cy, "#dc2626", aoeR * 1.08, 0.52));
    g.entities.push(rt.spawnShockRing(cx, cy, "#fef08a", aoeR * 0.6, 0.34));
    g.spawnSparks(cx, cy, "#f59e0b", "#fef08a");
    g.spawnSparks(cx, cy, "#dc2626", COLORS.white);

    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        const slamDmg = g.applyDamage(tt, 30);
        g.spawnDamageText(tt.x, tt.y - tt.radius - 16, slamDmg, "#f97316", true, "APE WALL SLAM!");
        const kAng = Math.atan2(tt.y - cy, tt.x - cx);
        tt.vx = Math.cos(kAng) * 620;
        tt.vy = Math.sin(kAng) * 620;
        tt.flashTimer = 0.18;
        tt.squash = 1.0;
        g.addEffect(tt, "stun", 0.42);
      }
    }
    rt.setHitStop(0.09);
    rt.addShake(0.42, 11);
    g.sound.playCritHit();
  }

  const SKILL_KAMEHAMEHA = {
    name: "Kamehameha / Dragon Rush",
    cooldown: 3.4,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      // In Great Ape (Oozaru) mode, skill transforms into APE RUSH (4s wall-bouncing dash!)
      if (ball.apeMode) {
        if (ball.apeRushTimer > 0) return false;
        rt.beginCast(ball, {
          kind: "powerup",
          duration: 0.28,
          color: "#dc2626",
          maxR: 26,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            const ang = t ? Math.atan2(t.y - b.y, t.x - b.x) : Math.atan2(b.vy, b.vx);
            const dashSpeed = b.baseSpeed * 2.45;
            b.vx = Math.cos(ang) * dashSpeed;
            b.vy = Math.sin(ang) * dashSpeed;
            b.apeRushTimer = 4.0;
            b.apeRushHitCooldown = 0;
            g.entities.push(rt.spawnShockRing(b.x, b.y, "#f59e0b", 110, 0.35));
            g.entities.push(rt.spawnShockRing(b.x, b.y, "#dc2626", 85, 0.28));
            g.spawnDamageText(b.x, b.y - b.radius - 14, 0, "#ef4444", true, "APE RUSH (4S)!");
            rt.addShake(0.28, 7);
          },
        });
        return true;
      }

      const mode = ball.gokuNext === "dragon_rush" ? "dragon_rush" : "kamehameha";
      ball.gokuNext = mode === "kamehameha" ? "dragon_rush" : "kamehameha";
      const ult = ball.ultTimer > 0;

      if (mode === "dragon_rush") {
        rt.beginCast(ball, {
          kind: "orb",
          duration: ult ? 0.42 : 0.5,
          color: ult ? COLORS.red : COLORS.gold,
          maxR: ult ? 24 : 18,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const dashSpeed = b.baseSpeed * (ult ? 3.1 : 2.55);
            b.vx = Math.cos(ang) * dashSpeed;
            b.vy = Math.sin(ang) * dashSpeed;
            b.dragonRushTimer = ult ? 0.44 : 0.4;
            b.dragonRushHit = false;
            g.entities.push(rt.spawnShockRing(b.x, b.y, ult ? COLORS.red : COLORS.gold, 80, 0.28));
            g.spawnDamageText(b.x, b.y - b.radius, 0, ult ? COLORS.red : COLORS.gold, false, ult ? "KAIOKEN DRAGON RUSH!" : "DRAGON RUSH!");
          },
        });
        return true;
      }

      if (ult) {
        rt.beginCast(ball, {
          kind: "orb", duration: 0.65, color: COLORS.red, maxR: 26,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            b.channelTimer = 0.82;
            g.entities.push(spawnKamehamehaBeam(b, t, 0));
            g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "KAIOKEN BEAM!");
          },
        });
        return true;
      }
      rt.beginCast(ball, {
        kind: "orb", duration: 0.5, color: COLORS.blue, maxR: 20,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = rt.castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 16);
          g.entities.push(rt.spawnShockRing(m.x, m.y, COLORS.blue, 55, 0.3));
          g.entities.push(rt.spawnProjectile({
            owner: b, target: t, x: m.x, y: m.y, speed: 520, radius: 13, damage: 14,
            color: COLORS.blue, label: "KAMEHAMEHA!", shape: "blast",
            onImpact(tt, gg) {
              gg.addEffect(tt, "slow", 0.7, { factor: 0.65 });
              gg.chargeUlt(b);
            },
          }));
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.goku = {
    id: "goku",
    name: "STRONGEST ALIEN",
    shortName: "ALIEN",
    title: "Earth's Protector • Legendary Ki Master",
    role: "ALIEN • KAMEHAMEHA & DRAGON RUSH",
    color: COLORS.orange,
    radius: 28,
    speed: 365,
    maxHp: 560,
    damage: [9, 15],
    mass: 1.05,
    costume: "goku",
    weapon: "nyoibo",
    ult: "kaioken",
    ultName: "KAIOKEN BURST / GREAT APE",
    ultDesc: "Enters Kaioken boosting Kamehameha & Dragon Rush! If HP <= 200 while in Ult, transforms into Great Ape (Oozaru) with 4s Wall-Bouncing Ape Rush!",
    skillName: "KAMEHAMEHA / DRAGON RUSH",
    skillDesc: "Alternates Kamehameha blast and Dragon Rush (in Great Ape mode, transforms into 4s Ape Rush dealing 15 DMG per hit + 30 DMG AoE wall slams!).",
    skills: [SKILL_KAMEHAMEHA],
  };

  BF.TRANSFORM_DETAILS.goku = {
    label: "🔥 KAIOKEN / OOZARU",
    speedMult: 1.25,
    radiusMult: 1.0,
    powerText: "32-42 BEAM / 30 WALL SLAM",
    hpNote: "HP <= 200 = GREAT APE",
    ultSkillName: "KAIOKEN BEAM & RUSH / APE RUSH",
    ultSkillCd: "CD: 3.4S",
    ultSkillDesc: "Speed +25%! Empowers Kamehameha & Dragon Rush. At <=200 HP transforms into Great Ape: skill becomes 4s Ape Rush (15 DMG/hit + 30 DMG AoE on wall bounce)!",
  };

  BF.WEAPON_DRAWERS.nyoibo = (ball, c) => {
    c.fillStyle = COLORS.red;
    c.fillRect(-4, -22, 8, 44);
    c.strokeRect(-4, -22, 8, 44);
    c.fillStyle = COLORS.gold;
    c.fillRect(-5, -22, 10, 6);
    c.strokeRect(-5, -22, 10, 6);
    c.fillRect(-5, 16, 10, 6);
    c.strokeRect(-5, 16, 10, 6);
  };

  BF.COSTUME_DRAWERS.goku = (ball, r, c) => {
    if (ball.apeMode) {
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = ball.flashTimer > 0 ? COLORS.white : "#3b2316";
      c.fillRect(-r, -r, r * 2, r * 2);
      c.fillStyle = "#513222";
      c.beginPath();
      c.arc(0, r * 0.62, r * 0.72, Math.PI, 0);
      c.fill();
      c.restore();

      c.fillStyle = "#3b2316";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI * 0.5;
        const tx = Math.cos(a) * r * 1.06;
        const ty = Math.sin(a) * r * 1.06;
        c.beginPath();
        c.arc(tx, ty, r * 0.22, 0, Math.PI * 2);
        c.fill();
      }

      for (const side of [-1, 1]) {
        c.fillStyle = "#3b2316";
        c.beginPath();
        c.moveTo(side * r * 0.85, -r * 0.15);
        c.lineTo(side * r * 1.32, -r * 0.45);
        c.lineTo(side * r * 0.92, r * 0.2);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#c8a27a";
        c.beginPath();
        c.moveTo(side * r * 0.92, -r * 0.1);
        c.lineTo(side * r * 1.18, -r * 0.34);
        c.lineTo(side * r * 0.95, r * 0.08);
        c.closePath();
        c.fill();
      }

      c.fillStyle = "#c8a27a";
      c.beginPath();
      c.ellipse(0, r * 0.18, r * 0.54, r * 0.44, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.fillStyle = "#7f1d1d";
      c.beginPath();
      c.ellipse(0, r * 0.32, r * 0.34, r * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.white;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r * 0.24, r * 0.16);
        c.lineTo(side * r * 0.15, r * 0.34);
        c.lineTo(side * r * 0.07, r * 0.16);
        c.closePath();
        c.fill();
      }

      c.fillStyle = "#ef4444";
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(side * r * 0.32, -r * 0.18, r * 0.16, r * 0.1, side * -0.25, 0, Math.PI * 2);
        c.fill();
      }
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.52, -r * 0.34); c.lineTo(-r * 0.14, -r * 0.22);
      c.moveTo(r * 0.52, -r * 0.34); c.lineTo(r * 0.14, -r * 0.22);
      c.stroke();
      return;
    }

    const kaioken = ball.ultTimer > 0;
    if (kaioken) {
      // Multi-layered blazing crimson Kaioken flame crown & ki rings around Goku
      c.save();
      const t = performance.now() * 0.008;
      const pulse = Math.sin(t * 2.5) * 2.5;

      // Outer deep crimson aura shroud
      c.fillStyle = "rgba(225, 29, 72, 0.28)";
      c.beginPath();
      c.arc(0, -r * 0.12, r * 1.62 + pulse * 0.5, 0, Math.PI * 2);
      c.fill();

      // Jagged DBZ rising crimson flame spikes
      const spikes = 14;
      c.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const a = (Math.PI * i) / spikes - Math.PI * 0.5;
        const isTip = i % 2 === 0;
        const topBoost = Math.sin(a) < 0 ? Math.abs(Math.sin(a)) * r * 0.35 : 0;
        const rad = isTip
          ? r * 1.46 + topBoost + Math.sin(t * 3 + i) * 3
          : r * 1.08 + topBoost * 0.25;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fillStyle = "rgba(239, 68, 68, 0.68)";
      c.fill();
      c.lineWidth = 3;
      c.strokeStyle = "#be123c";
      c.stroke();

      // Inner white-pink Kaioken core rim
      c.strokeStyle = "#fecdd3";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, r * 1.12, 0, Math.PI * 2);
      c.stroke();

      // Orbiting scarlet ki rings & sparks
      c.strokeStyle = "rgba(255, 228, 230, 0.85)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, 0, r * 1.48, r * 0.52, t * 0.5, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(244, 63, 94, 0.85)";
      c.beginPath();
      c.ellipse(0, 0, r * 1.48, r * 0.52, -t * 0.5, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // Re-establish clean body disc & ink border on top of the background Kaioken aura
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fillStyle = ball.flashTimer > 0 ? COLORS.white : COLORS.skin;
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = COLORS.ink;
      c.stroke();
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    if (kaioken) {
      // Warm crimson Kaioken ki flush over skin
      c.fillStyle = "rgba(244, 63, 94, 0.22)";
      c.fillRect(-r, -r, r * 2, r * 2);
    }

    c.fillStyle = kaioken ? "#1e3a8a" : COLORS.blue;
    c.beginPath();
    c.moveTo(-r * 0.48, r * 0.52);
    c.lineTo(0, r * 0.84);
    c.lineTo(r * 0.48, r * 0.52);
    c.lineTo(r * 0.95, r * 0.56);
    c.lineTo(r, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = kaioken ? "#e11d48" : COLORS.orange;
    c.beginPath();
    c.moveTo(-r, r * 0.54);
    c.lineTo(-r * 0.38, r * 0.56);
    c.lineTo(-r * 0.05, r * 1.05);
    c.lineTo(-r, r * 1.05);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(r, r * 0.54);
    c.lineTo(r * 0.38, r * 0.56);
    c.lineTo(r * 0.05, r * 1.05);
    c.lineTo(r, r * 1.05);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = kaioken ? "#ffe4e6" : COLORS.white;
    c.beginPath();
    c.arc(-r * 0.44, r * 0.78, r * 0.14, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 2;
    c.stroke();
    c.restore();

    // Spiky Saiyan Hair (blown slightly higher & crimson-sheened during Kaioken!)
    const hLift = kaioken ? 1.08 : 1.0;
    c.fillStyle = kaioken ? "#260712" : COLORS.ink;
    c.strokeStyle = kaioken ? "#e11d48" : COLORS.ink;
    c.lineWidth = kaioken ? 2.6 : 2;
    c.beginPath();
    c.moveTo(-r * 0.92, -r * 0.18);
    c.lineTo(-r * 1.38 * hLift, -r * 0.42 * hLift);
    c.lineTo(-r * 0.98, -r * 0.58);
    c.lineTo(-r * 1.32 * hLift, -r * 0.96 * hLift);
    c.lineTo(-r * 0.7, -r * 0.86);
    c.lineTo(-r * 0.48, -r * 1.38 * hLift);
    c.lineTo(-r * 0.05, -r * 0.96);
    c.lineTo(r * 0.32, -r * 1.46 * hLift);
    c.lineTo(r * 0.55, -r * 0.92);
    c.lineTo(r * 1.18 * hLift, -r * 1.18 * hLift);
    c.lineTo(r * 0.92, -r * 0.68);
    c.lineTo(r * 1.4 * hLift, -r * 0.58 * hLift);
    c.lineTo(r * 0.95, -r * 0.28);
    c.lineTo(r * 0.62, -r * 0.44);
    c.lineTo(r * 0.25, -r * 0.34);
    c.lineTo(r * 0.08, -r * 0.54);
    c.lineTo(-r * 0.15, -r * 0.32);
    c.lineTo(-r * 0.55, -r * 0.48);
    c.closePath();
    c.fill();
    if (kaioken) c.stroke();

    c.strokeStyle = kaioken ? "#fb7185" : COLORS.ichigoDark;
    c.lineWidth = kaioken ? 3 : 2.5;
    c.beginPath();
    c.moveTo(-r * 0.5, -r * 1.15 * hLift); c.lineTo(-r * 0.38, -r * 0.82);
    c.moveTo(r * 0.3, -r * 1.25 * hLift); c.lineTo(r * 0.4, -r * 0.88);
    c.moveTo(r * 0.98, -r * 1.02 * hLift); c.lineTo(r * 0.82, -r * 0.7);
    if (kaioken) {
      c.moveTo(-r * 1.12, -r * 0.84); c.lineTo(-r * 0.82, -r * 0.64);
      c.moveTo(r * 1.18, -r * 0.56); c.lineTo(r * 0.88, -r * 0.44);
    }
    c.stroke();
    c.strokeStyle = COLORS.ink;
  };

  BF.spawnKamehamehaBeam = spawnKamehamehaBeam;
  BF.spawnDragonKickCombo = spawnDragonKickCombo;
  BF.triggerApeWallSlam = triggerApeWallSlam;
})();

