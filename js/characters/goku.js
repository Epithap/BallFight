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
          rt.setShake(0.3, 6);
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

  const SKILL_KAMEHAMEHA = {
    name: "Kamehameha / Dragon Rush",
    cooldown: 3.4,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
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
    maxHp: 340,
    damage: [9, 15],
    mass: 1.05,
    costume: "goku",
    weapon: "nyoibo",
    ult: "kaioken",
    ultName: "KAIOKEN BURST / GREAT APE",
    ultDesc: "Enters Kaioken boosting Kamehameha & Dragon Rush! If HP <= 100 while in Ult, transforms into berserk Great Ape (Oozaru)!",
    skillName: "KAMEHAMEHA / DRAGON RUSH",
    skillDesc: "Alternates Kamehameha blast and straight-line Dragon Rush (chains 3x Dragon Kicks + heavy knockback on hit).",
    skills: [SKILL_KAMEHAMEHA],
  };

  BF.TRANSFORM_DETAILS.goku = {
    label: "🔥 KAIOKEN / OOZARU",
    speedMult: 1.25,
    radiusMult: 1.0,
    powerText: "32-42 BEAM / 30 KICK",
    hpNote: "HP <= 100 = GREAT APE",
    ultSkillName: "SUPER KAMEHAMEHA / DRAGON RUSH",
    ultSkillCd: "CD: 3.4S",
    ultSkillDesc: "Speed +25%! Empowers Kamehameha beam & Dragon Rush (3x Dragon Kick + launch). Dropping to <=100 HP in Ult triggers berserk Great Ape (35% DMG reduction)!",
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
      c.shadowColor = "#ef4444";
      c.shadowBlur = 10;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(side * r * 0.32, -r * 0.18, r * 0.16, r * 0.1, side * -0.25, 0, Math.PI * 2);
        c.fill();
      }
      c.shadowBlur = 0;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.52, -r * 0.34); c.lineTo(-r * 0.14, -r * 0.22);
      c.moveTo(r * 0.52, -r * 0.34); c.lineTo(r * 0.14, -r * 0.22);
      c.stroke();
      return;
    }

    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = COLORS.blue;
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

    c.fillStyle = COLORS.orange;
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

    c.fillStyle = COLORS.white;
    c.beginPath();
    c.arc(-r * 0.44, r * 0.78, r * 0.14, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 2;
    c.stroke();
    c.restore();

    c.fillStyle = COLORS.ink;
    c.beginPath();
    c.moveTo(-r * 0.92, -r * 0.18);
    c.lineTo(-r * 1.38, -r * 0.42);
    c.lineTo(-r * 0.98, -r * 0.58);
    c.lineTo(-r * 1.32, -r * 0.96);
    c.lineTo(-r * 0.7, -r * 0.86);
    c.lineTo(-r * 0.48, -r * 1.36);
    c.lineTo(-r * 0.05, -r * 0.96);
    c.lineTo(r * 0.32, -r * 1.44);
    c.lineTo(r * 0.55, -r * 0.92);
    c.lineTo(r * 1.18, -r * 1.18);
    c.lineTo(r * 0.92, -r * 0.68);
    c.lineTo(r * 1.4, -r * 0.58);
    c.lineTo(r * 0.95, -r * 0.28);
    c.lineTo(r * 0.62, -r * 0.44);
    c.lineTo(r * 0.25, -r * 0.34);
    c.lineTo(r * 0.08, -r * 0.54);
    c.lineTo(-r * 0.15, -r * 0.32);
    c.lineTo(-r * 0.55, -r * 0.48);
    c.closePath();
    c.fill();
    c.strokeStyle = COLORS.ichigoDark;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-r * 0.5, -r * 1.1); c.lineTo(-r * 0.38, -r * 0.82);
    c.moveTo(r * 0.3, -r * 1.2); c.lineTo(r * 0.4, -r * 0.88);
    c.moveTo(r * 0.98, -r * 0.98); c.lineTo(r * 0.82, -r * 0.7);
    c.stroke();
    c.strokeStyle = COLORS.ink;
  };

  BF.spawnKamehamehaBeam = spawnKamehamehaBeam;
  BF.spawnDragonKickCombo = spawnDragonKickCombo;
})();

