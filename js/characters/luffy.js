(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnGomuPistol({ owner, angle, maxLen = 215, damage = 15, knockback = 360 }) {
    const duration = 0.26;
    let hitDone = false;
    return {
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const ext = p < 0.5 ? (p / 0.5) : (1 - (p - 0.5) / 0.5);
        const curLen = owner.radius + ext * maxLen;
        const fx = owner.x + Math.cos(angle) * curLen;
        const fy = owner.y + Math.sin(angle) * curLen;
        if (!hitDone) {
          for (const target of g.balls) {
            if (target === owner || !target.alive) continue;
            if (Math.hypot(target.x - fx, target.y - fy) <= target.radius + 16) {
              hitDone = true;
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.14;
              target.squash = 0.9;
              target.vx = Math.cos(angle) * knockback;
              target.vy = Math.sin(angle) * knockback;
              g.spawnSparks(fx, fy, COLORS.white, COLORS.red);
              g.spawnDamageText(target.x, target.y - target.radius - 10, dealt, COLORS.red, true, "GOMU PISTOL!");
              g.chargeUlt(owner);
              g.sound.playCritHit();
              rt.addShake(0.18, 5);
              break;
            }
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const ext = p < 0.5 ? (p / 0.5) : (1 - (p - 0.5) / 0.5);
        const curLen = owner.radius + ext * maxLen;
        const fx = owner.x + Math.cos(angle) * curLen;
        const fy = owner.y + Math.sin(angle) * curLen;
        c.save();
        c.lineCap = "round";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 14;
        c.beginPath(); c.moveTo(owner.x, owner.y); c.lineTo(fx, fy); c.stroke();
        c.strokeStyle = COLORS.skin;
        c.lineWidth = 8;
        c.stroke();
        c.fillStyle = COLORS.skin;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(fx, fy, 13, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnKongSmash({ owner, x, y, reach = 155, damage = 30, knockback = 500 }) {
    const duration = 0.42;
    let impacted = false;
    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        if (!impacted && p >= 0.25) {
          impacted = true;
          g.entities.push(rt.spawnShockRing(this.x, this.y, COLORS.red, reach, 0.42));
          g.entities.push(rt.spawnShockRing(this.x, this.y, COLORS.white, reach * 0.72, 0.34));
          rt.addShake(0.35, 10);
          g.sound.playCritHit();
          for (const target of g.balls) {
            if (target === owner || !target.alive) continue;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            if (Math.hypot(dx, dy) <= reach + target.radius) {
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.16;
              target.squash = 1.0;
              const kAng = Math.atan2(dy, dx);
              target.vx = Math.cos(kAng) * knockback;
              target.vy = Math.sin(kAng) * knockback;
              g.spawnSparks(target.x, target.y, COLORS.red, COLORS.ink);
              g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, COLORS.red, true, "KING KONG GUN!");
            }
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3);
        const fistR = 26 + Math.sin(Math.min(1, p * 2) * Math.PI * 0.5) * 14;
        c.save();
        c.globalAlpha = alpha;
        c.fillStyle = "rgba(235, 35, 50, 0.24)";
        c.beginPath();
        c.arc(this.x, this.y, reach * Math.min(1, p * 2.2), 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#1c1824";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(this.x, this.y - (1 - Math.min(1, p * 3)) * 28, fistR, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.strokeStyle = "#ff2e44";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(this.x, this.y - (1 - Math.min(1, p * 3)) * 28, fistR * 0.7, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnSnakemanPython({ owner, angle, speed = 780, bouncesLeft = 3, damage = 23, knockback = 420 }) {
    const startX = owner.x + Math.cos(angle) * (owner.radius + 10);
    const startY = owner.y + Math.sin(angle) * (owner.radius + 10);
    const points = [{ x: startX, y: startY }];
    return {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      bouncesLeft,
      life: 1.05,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const enemyTarget = g.balls.find((b) => b !== owner && b.alive);
        const infFactor = rt.getInfinitySlowFactor(enemyTarget, this.x, this.y);
        if (infFactor <= 0) {
          this.infinityHold = (this.infinityHold || 0) + dt;
          if (this.infinityHold >= 0.9) this.dead = true;
          return;
        }
        this.x += this.vx * infFactor * dt;
        this.y += this.vy * infFactor * dt;

        let bounced = false;
        const pad = 14;
        if (this.x < pad) {
          this.x = pad;
          this.vx = Math.abs(this.vx);
          bounced = true;
        } else if (this.x > WORLD_SIZE - pad) {
          this.x = WORLD_SIZE - pad;
          this.vx = -Math.abs(this.vx);
          bounced = true;
        }
        if (this.y < pad) {
          this.y = pad;
          this.vy = Math.abs(this.vy);
          bounced = true;
        } else if (this.y > WORLD_SIZE - pad) {
          this.y = WORLD_SIZE - pad;
          this.vy = -Math.abs(this.vy);
          bounced = true;
        }
        if (bounced) {
          points.push({ x: this.x, y: this.y });
          this.bouncesLeft -= 1;
          g.spawnSparks(this.x, this.y, "#c026d3", COLORS.red);
          g.sound.playWallBounce();
          if (this.bouncesLeft < 0) {
            this.dead = true;
            return;
          }
        }

        for (const target of g.balls) {
          if (target === owner || !target.alive) continue;
          if (Math.hypot(target.x - this.x, target.y - this.y) <= target.radius + 16) {
            this.dead = true;
            const dealt = g.applyDamage(target, damage);
            target.flashTimer = 0.14;
            target.squash = 0.95;
            const kAng = Math.atan2(this.vy, this.vx);
            target.vx = Math.cos(kAng) * knockback;
            target.vy = Math.sin(kAng) * knockback;
            g.spawnSparks(this.x, this.y, "#c026d3", COLORS.white);
            g.spawnDamageText(target.x, target.y - target.radius - 12, dealt, "#e879f9", true, "JET CULVERIN!");
            g.entities.push(rt.spawnShockRing(this.x, this.y, "#c026d3", 90, 0.32));
            g.sound.playCritHit();
            rt.addShake(0.22, 6);
            return;
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(owner.x, owner.y);
        for (const pt of points) c.lineTo(pt.x, pt.y);
        c.lineTo(this.x, this.y);
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 14;
        c.stroke();
        c.strokeStyle = "#22172b";
        c.lineWidth = 8;
        c.stroke();
        c.strokeStyle = "#e11d48";
        c.lineWidth = 2.5;
        c.stroke();

        c.fillStyle = "#1c1526";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.x, this.y, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  const SKILL_GUM_ROCKET = {
    name: "Gomu Rocket -> Pistol",
    initialCd: 2.5,
    cooldown: 4.5,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      if (ball.ultTimer > 0) {
        const isSnake = ball.gear4Mode === "snakeman";
        rt.beginCast(ball, {
          kind: "dash",
          duration: isSnake ? 0.16 : 0.24,
          color: isSnake ? "#c026d3" : COLORS.red,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            if (isSnake) {
              if (b.skills[0]) b.skills[0]._cd = 2.1;
              g.entities.push(spawnSnakemanPython({
                owner: b,
                angle: ang,
                speed: 780,
                bouncesLeft: 3,
                damage: Math.round(20 + g.rng() * 6),
                knockback: 420,
              }));
              g.spawnDamageText(b.x, b.y - b.radius, 0, "#e879f9", false, "BLACK MAMBA!");
            } else {
              if (b.skills[0]) b.skills[0]._cd = 2.4;
              const dist = Math.hypot(t.x - b.x, t.y - b.y) || 1;
              const smashDist = Math.min(dist, 95);
              const sx = b.x + Math.cos(ang) * smashDist;
              const sy = b.y + Math.sin(ang) * smashDist;
              b.vx = Math.cos(ang) * b.baseSpeed * 1.35;
              b.vy = Math.sin(ang) * b.baseSpeed * 1.35;
              g.entities.push(spawnKongSmash({
                owner: b,
                x: sx,
                y: sy,
                reach: 155,
                damage: Math.round(26 + g.rng() * 8),
                knockback: 500,
              }));
              g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "KONG SMASH!");
            }
            g.sound.playBallHit();
          },
        });
        return true;
      }

      rt.beginCast(ball, {
        kind: "dash", duration: 0.25, color: COLORS.red,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          const dashSpeed = b.baseSpeed * 2.1;
          b.vx = ((t.x - b.x) / len) * dashSpeed;
          b.vy = ((t.y - b.y) / len) * dashSpeed;
          b.rocketTimer = 0.24;
          b.rocketHit = false;
          if (b.skills[0]) b.skills[0]._cd = 4.5;
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "GOMU ROCKET!");
          g.spawnSparks(b.x, b.y, COLORS.white, COLORS.red);
          g.entities.push(rt.spawnDelayedAction(0.2, (gg) => {
            if (!b.alive) return;
            const t2 = gg.balls.find((x) => x !== b && x.alive);
            if (!t2) return;
            const ang2 = Math.atan2(t2.y - b.y, t2.x - b.x);
            gg.entities.push(spawnGomuPistol({
              owner: b,
              angle: ang2,
              maxLen: 215,
              damage: Math.round(7 + gg.rng() * 3),
              knockback: 560,
            }));
            gg.sound.playBallHit();
          }));
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.luffy = {
    id: "luffy",
    name: "WARRIOR OF LIBERATION",
    shortName: "LIBERATION",
    title: "Rubber Emperor • Drums of Joy",
    role: "PIRATE • GUM-GUM ROCKET",
    color: COLORS.red,
    radius: 28,
    speed: 355,
    maxHp: 370,
    damage: [9, 16],
    mass: 1.1,
    costume: "luffy",
    weapon: "gomu_fist",
    ult: "gear_4",
    ultName: "GEAR 4: BOUNCEMAN / SNAKEMAN",
    ultDesc: "Odd HP activates BOUNCEMAN (giant AoE King Kong smash + 35% shield). Even HP activates SNAKEMAN (+32% speed + wall-bouncing Jet Culverin arm)!",
    skillName: "GOMU ROCKET → PISTOL",
    skillDesc: "2.5s start CD! Launches Gomu Rocket, then 0.2s later fires Gomu Pistol (4.5s total CD). Replaced by Giant AoE Smash or Wall-Bouncing Arm in Gear 4!",
    skills: [SKILL_GUM_ROCKET],
  };

  BF.TRANSFORM_DETAILS.luffy = {
    label: "🔥 GEAR 4",
    speedMult: 1.32,
    radiusMult: 1.22,
    powerText: "26-34 AOE",
    hpNote: "ODD=BOUNCE / EVEN=SNAKE",
    ultSkillName: "KING KONG / BLACK MAMBA",
    ultSkillCd: "CD: 2.1-2.4S",
    ultSkillDesc: "Odd HP -> Bounceman (giant AoE King Kong Smash + 35% DMG reduction). Even HP -> Snakeman (+32% speed + wall-bouncing Jet Culverin arm)!",
  };

  BF.WEAPON_DRAWERS.gomu_fist = (ball, c) => {
    const g4 = ball.ultTimer > 0;
    c.fillStyle = g4 ? COLORS.ichigoDark : COLORS.skin;
    c.beginPath();
    c.arc(0, 0, g4 ? 14 : 11, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = COLORS.red;
    c.fillRect(-6, 7, 12, 7);
    c.strokeRect(-6, 7, 12, 7);
  };

  BF.COSTUME_DRAWERS.luffy = (ball, r, c) => {
    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = ball.ultTimer > 0 ? COLORS.ichigoDark : COLORS.red;
    c.fillRect(-r, r * 0.54, r * 2, r * 0.52);
    c.strokeRect(-r, r * 0.54, r * 2, r * 0.52);
    c.fillStyle = ball.flashTimer > 0 ? COLORS.white : COLORS.skin;
    c.beginPath();
    c.moveTo(-r * 0.34, r * 0.52);
    c.lineTo(0, r * 0.98);
    c.lineTo(r * 0.34, r * 0.52);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.arc(-r * 0.42, r * 0.74, 3, 0, Math.PI * 2);
    c.arc(r * 0.42, r * 0.74, 3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-r * 0.44, r * 0.18);
    c.lineTo(-r * 0.22, r * 0.22);
    c.moveTo(-r * 0.37, r * 0.14);
    c.lineTo(-r * 0.37, r * 0.25);
    c.moveTo(-r * 0.29, r * 0.15);
    c.lineTo(-r * 0.29, r * 0.26);
    c.stroke();
    c.lineWidth = 3;

    if (ball.ultTimer > 0) {
      if (ball.gear4Mode === "snakeman") {
        c.strokeStyle = "#c026d3";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, r * 1.12, -Math.PI * 0.85, -Math.PI * 0.15);
        c.stroke();
      } else {
        c.fillStyle = COLORS.white;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.arc(side * r * 1.02, -r * 0.1, 7, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      }
    }

    c.fillStyle = COLORS.ink;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * r * 0.62, -r * 0.7);
      c.lineTo(side * r * 1.02, -r * 0.42);
      c.lineTo(side * r * 0.84, -r * 0.3);
      c.lineTo(side * r * 0.96, -r * 0.08);
      c.lineTo(side * r * 0.7, -r * 0.2);
      c.closePath();
      c.fill();
    }

    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.ellipse(0, -r * 0.78, r * 1.22, r * 0.26, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(0, -r * 0.82, r * 0.62, Math.PI, 0);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = COLORS.red;
    c.fillRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
    c.strokeRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
  };
})();

