(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnStandFistProjectile({ owner, target, x, y, angle, speed, radius, damage, heavy, isLast, onImpact }) {
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
      radius,
      damage,
      heavy,
      isLast,
      isDioEntity: true,
      dead: false,
      update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (Math.random() < 0.6) {
          rt.particles.push({
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            size: this.heavy ? 5 : 3,
            life: 0.18,
            maxLife: 0.18,
            color: this.heavy ? COLORS.red : COLORS.gold,
          });
        }

        if (this.x < -20 || this.x > WORLD_SIZE + 20 || this.y < -20 || this.y > WORLD_SIZE + 20) {
          this.dead = true;
          return;
        }

        if (!this.target.alive) return;
        const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (dist <= this.target.radius + this.radius) {
          this.dead = true;
          const dealt = game.applyDamage(this.target, this.damage);
          this.target.flashTimer = this.heavy ? 0.14 : 0.08;
          this.target.squash = this.heavy ? 0.8 : 0.5;
          game.spawnSparks(this.x, this.y, COLORS.gold, this.heavy ? COLORS.red : COLORS.green);
          game.spawnDamageText(
            this.target.x + (Math.random() - 0.5) * 16,
            this.target.y - this.target.radius * 0.6,
            dealt,
            this.heavy ? COLORS.red : COLORS.gold,
            this.heavy,
            this.heavy ? "HEAVY MUDA!" : "MUDA!"
          );
          game.sound.playBallHit();
          if (this.heavy) {
            rt.addShake(0.2, 6);
          }
          if (onImpact) onImpact(this.target, game, this);
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        c.fillStyle = COLORS.gold;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        rt.drawHeart(c, 0, -this.radius * 0.1, this.radius * 0.4, "#2ecc71");

        c.strokeStyle = "rgba(255, 215, 0, 0.7)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-this.radius * 1.5, -this.radius * 0.4);
        c.lineTo(-this.radius * 0.5, -this.radius * 0.4);
        c.moveTo(-this.radius * 1.5, this.radius * 0.4);
        c.lineTo(-this.radius * 0.5, this.radius * 0.4);
        c.stroke();

        c.restore();
      },
    };
  }

  function spawnStandPunchBarrage(owner, target, heavy = false) {
    return {
      owner,
      target,
      heavy,
      isDioEntity: true,
      timer: 0,
      punchesFired: 0,
      totalPunches: heavy ? 6 : 4,
      interval: heavy ? 0.07 : 0.08,
      dead: false,
      update(dt, game) {
        if (!this.owner.alive || !this.target.alive) {
          this.dead = true;
          return;
        }
        this.timer -= dt;
        if (this.timer <= 0 && this.punchesFired < this.totalPunches) {
          this.timer = this.interval;
          this.punchesFired++;
          this.owner.standAttackTimer = 0.25;

          const dx = this.target.x - this.owner.x;
          const dy = this.target.y - this.owner.y;
          const baseAng = Math.atan2(dy, dx);
          const spread = (Math.random() - 0.5) * 0.26;
          const ang = baseAng + spread;
          const sx = this.owner.x + Math.cos(ang) * (this.owner.radius + 12);
          const sy = this.owner.y + Math.sin(ang) * (this.owner.radius + 12);

          game.entities.push(spawnStandFistProjectile({
            owner: this.owner,
            target: this.target,
            x: sx,
            y: sy,
            angle: ang,
            speed: this.heavy ? 660 : 540,
            radius: this.heavy ? 16 : 12,
            damage: this.heavy ? 18 : 3,
            heavy: this.heavy,
            isLast: this.punchesFired === this.totalPunches,
            onImpact: (tt, gg, fist) => {
              if (!this.heavy && fist.isLast) {
                gg.chargeUlt(this.owner);
              }
            },
          }));

          if (this.punchesFired >= this.totalPunches) {
            this.dead = true;
          }
        }
      },
    };
  }

  function spawnTimeStopKnife({ owner, target, x, y, angle, freezeDist, speed, damage }) {
    return {
      owner,
      target,
      x,
      y,
      angle,
      freezeDist,
      flyDist: 0,
      speed,
      damage,
      state: "throwing",
      isKnife: true,
      radius: 8,
      shimmer: Math.random() * Math.PI * 2,
      dead: false,
      update(dt, game) {
        if (this.state === "throwing") {
          const stepDist = 520 * dt;
          this.x += Math.cos(this.angle) * stepDist;
          this.y += Math.sin(this.angle) * stepDist;
          this.flyDist += stepDist;
          if (this.flyDist >= this.freezeDist) {
            this.state = "frozen";
            if (this.target.alive) {
              this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            }
          }
        } else if (this.state === "frozen") {
          this.shimmer += dt * 8;
          if (rt.timeStopTimer <= 0) {
            this.state = "unfrozen";
            if (this.target.alive) {
              this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            }
          }
        } else if (this.state === "unfrozen") {
          const infFactor = rt.getInfinitySlowFactor(this.target, this.x, this.y);
          if (infFactor <= 0) {
            this.shimmer += dt * 4;
            this.infinityHold = (this.infinityHold || 0) + dt;
            if (this.infinityHold >= 1.1) this.dead = true;
            return;
          }
          const stepDist = this.speed * infFactor * dt;
          this.x += Math.cos(this.angle) * stepDist;
          this.y += Math.sin(this.angle) * stepDist;

          if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30) {
            this.dead = true;
            return;
          }

          if (!this.target.alive) {
            this.dead = true;
            return;
          }

          const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
          if (dist <= this.target.radius + this.radius) {
            this.dead = true;
            const dealt = game.applyDamage(this.target, this.damage);
            this.target.flashTimer = 0.12;
            this.target.squash = 0.75;
            game.spawnSparks(this.x, this.y, COLORS.silver, COLORS.red);
            game.spawnDamageText(
              this.target.x + (Math.random() - 0.5) * 24,
              this.target.y - this.target.radius * 0.7 + (Math.random() - 0.5) * 16,
              dealt,
              COLORS.gold,
              false,
              "SHING!"
            );
            game.sound.playKnifeHit();
            rt.addShake(0.12, 3.5);
          }
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        c.lineJoin = "round";
        c.lineCap = "round";

        c.fillStyle = COLORS.silver;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(14, 0);
        c.lineTo(1, -4.5);
        c.lineTo(-3, -2.5);
        c.lineTo(-11, -2);
        c.lineTo(-11, 2);
        c.lineTo(-3, 2.5);
        c.lineTo(1, 4.5);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = COLORS.white;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(12, 0);
        c.lineTo(1, 0);
        c.stroke();

        c.fillStyle = COLORS.ink;
        c.fillRect(-10, -2, 6, 4);

        c.strokeStyle = COLORS.gold;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(-12, 0, 2.5, 0, Math.PI * 2);
        c.stroke();

        c.restore();
      },
    };
  }

  function spawnKnifeWave(dio, target, count = 3) {
    const dx = target.x - dio.x;
    const dy = target.y - dio.y;
    const baseAng = Math.atan2(dy, dx);
    const distToTarget = Math.hypot(dx, dy) || 1;

    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) * 0.5) * 0.22;
      const ang = baseAng + spread;
      const sx = dio.x + Math.cos(ang) * (dio.radius + 14);
      const sy = dio.y + Math.sin(ang) * (dio.radius + 14);
      const freezeDist = Math.min(distToTarget * 0.65, 55 + Math.random() * 20);

      rt.entities.push(spawnTimeStopKnife({
        owner: dio,
        target,
        x: sx,
        y: sy,
        angle: ang,
        freezeDist,
        speed: 740,
        damage: 6,
      }));
    }
  }

  const SKILL_STAND_BARRAGE = {
    name: "Stand Barrage",
    cooldown: 2.3,
    onTick(ball, game) {
      if (ball.standState) return false;
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "stand_rush", duration: inUlt ? 0.18 : 0.28, color: COLORS.gold,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          let backAng = Math.atan2(b.vy, b.vx);
          if (Math.abs(b.vx) < 0.01 && Math.abs(b.vy) < 0.01) backAng = b.weaponAngle || 0;
          const sx = b.x - Math.cos(backAng) * (b.radius * 0.85);
          const sy = b.y - Math.sin(backAng) * (b.radius * 0.85) - 8;
          const angToTarget = Math.atan2(t.y - sy, t.x - sx);

          b.standState = {
            phase: "dashing",
            x: sx,
            y: sy,
            angle: angToTarget,
            target: t,
            dashDist: 0,
            maxDashDist: inUlt ? 380 : 209,
            barrageTimer: 0,
            punchInterval: 0.08,
            punchesLeft: inUlt ? 6 : 5,
            hitCount: 0,
            heavy: inUlt,
          };
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.gold, false, "THE WORLD!");
        },
      });
      return true;
    },
  };

  function tryDioVampiricHeal(ball) {
    if (!ball.alive || ball.hp <= 0 || ball.hp >= ball.maxHp) return;
    if (rt.rng() < 0.025) {
      const healAmt = Math.round(2 + rt.rng() * 2);
      const actualHeal = Math.min(healAmt, ball.maxHp - ball.hp);
      if (actualHeal > 0) {
        ball.hp += actualHeal;
        rt.spawnSparks(ball.x, ball.y, COLORS.green, COLORS.dioYellow);
        rt.spawnDamageText(ball.x, ball.y - ball.radius - 10, 0, COLORS.green, false, `+${actualHeal} HP`);
      }
    }
  }

  const SKILL_DIO_TELEPORT = {
    name: "Time Skip Teleport",
    cooldown: 0,
    onHit(ball) {
      tryDioVampiricHeal(ball);
      return false;
    },
    onDamaged(ball, amount, g) {
      if (!ball.alive || ball.hp <= 0 || amount <= 0) return false;
      const roll = rt.rng();
      const enemyList = (g && g.balls) ? g.balls : rt.balls;
      const enemy = enemyList.find((b) => b !== ball && b.alive);

      if (roll < 0.05 && enemy) {
        let eAng = Math.atan2(enemy.vy, enemy.vx);
        if (Math.abs(enemy.vx) < 0.01 && Math.abs(enemy.vy) < 0.01) {
          eAng = enemy.weaponAngle || 0;
        }
        const behindDist = enemy.radius + ball.radius + 14;
        const pad = ball.radius + 8;
        const tx = Math.max(pad, Math.min(WORLD_SIZE - pad, enemy.x - Math.cos(eAng) * behindDist));
        const ty = Math.max(pad, Math.min(WORLD_SIZE - pad, enemy.y - Math.sin(eAng) * behindDist));

        rt.spawnSparks(ball.x, ball.y, COLORS.gold, COLORS.dioGreen);
        ball.x = tx;
        ball.y = ty;
        const spd = Math.hypot(ball.vx, ball.vy) || ball.baseSpeed;
        const toEnemy = Math.atan2(enemy.y - ty, enemy.x - tx);
        ball.vx = Math.cos(toEnemy) * spd;
        ball.vy = Math.sin(toEnemy) * spd;
        rt.spawnSparks(tx, ty, COLORS.gold, COLORS.dioGreen);
        rt.spawnDamageText(tx, ty - ball.radius - 12, 0, COLORS.gold, false, "BEHIND YOU!");
        return true;
      }

      if (roll < 0.17) {
        const pad = ball.radius + 20;
        const tx = pad + rt.rng() * (WORLD_SIZE - pad * 2);
        const ty = pad + rt.rng() * (WORLD_SIZE - pad * 2);
        rt.spawnSparks(ball.x, ball.y, COLORS.gold, COLORS.dioGreen);
        ball.x = tx;
        ball.y = ty;
        rt.spawnSparks(tx, ty, COLORS.gold, COLORS.dioGreen);
        rt.spawnDamageText(tx, ty - ball.radius - 12, 0, COLORS.dioGreen, false, "TELEPORT!");
        return true;
      }

      return false;
    },
  };

  function drawTheWorldStand(ball, r, c = rt.ctx, showExtras = true) {
    let ang = Math.atan2(ball.vy, ball.vx);
    if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
      ang = ball.weaponAngle || 0;
    }

    const st = showExtras ? ball.standState : null;
    const hoverBob = st ? 0 : Math.sin(rt.elapsed * 4 + (ball.x || 0) * 0.02) * 3.5;
    const behindDist = r * 0.9;
    const standX = st ? st.x : ball.x - Math.cos(ang) * behindDist;
    const standY = st ? st.y : ball.y - Math.sin(ang) * behindDist - 9 + hoverBob;
    const sr = r * 0.94;
    const faceAngle = st ? st.angle : ang;

    c.save();
    c.translate(standX, standY);
    c.lineJoin = "round";
    c.lineCap = "round";

    const auraPulse = Math.sin(rt.elapsed * 5.5) * 3;
    const auraRadius = sr + 16 + auraPulse;
    const auraGrad = c.createRadialGradient(0, 0, sr * 0.35, 0, 0, auraRadius);
    auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.42)");
    auraGrad.addColorStop(0.65, "rgba(255, 215, 0, 0.16)");
    auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(0, 0, auraRadius, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#d5dbdb";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(-sr * 0.78, -sr * 1.15, sr * 0.28, sr * 0.82, 4);
    c.roundRect(sr * 0.5, -sr * 1.15, sr * 0.28, sr * 0.82, 4);
    c.fill();
    c.stroke();

    c.fillStyle = "#7f8c8d";
    c.fillRect(-sr * 0.74, -sr * 1.22, sr * 0.2, sr * 0.1);
    c.fillRect(sr * 0.54, -sr * 1.22, sr * 0.2, sr * 0.1);

    c.strokeStyle = "#2ecc71";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-sr * 0.64, -sr * 0.92);
    c.quadraticCurveTo(-sr * 1.0, -sr * 0.35, -sr * 0.44, -sr * 0.02);
    c.stroke();
    c.beginPath();
    c.moveTo(sr * 0.64, -sr * 0.92);
    c.quadraticCurveTo(sr * 1.0, -sr * 0.35, sr * 0.44, -sr * 0.02);
    c.stroke();

    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-sr * 1.02, -sr * 0.22);
    c.lineTo(sr * 1.02, -sr * 0.22);
    c.lineTo(sr * 0.72, sr * 0.52);
    c.lineTo(0, sr * 0.92);
    c.lineTo(-sr * 0.72, sr * 0.52);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#f1c40f";
    c.beginPath();
    c.ellipse(-sr * 0.88, -sr * 0.12, sr * 0.34, sr * 0.24, -0.35, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(sr * 0.88, -sr * 0.12, sr * 0.34, sr * 0.24, 0.35, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = "#e67e22";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-sr * 0.62, -sr * 0.14);
    c.lineTo(-sr * 0.25, sr * 0.28);
    c.lineTo(0, sr * 0.2);
    c.lineTo(sr * 0.25, sr * 0.28);
    c.lineTo(sr * 0.62, -sr * 0.14);
    c.lineTo(sr * 0.44, sr * 0.48);
    c.lineTo(0, sr * 0.78);
    c.lineTo(-sr * 0.44, sr * 0.48);
    c.closePath();
    c.fill();
    c.stroke();

    rt.drawHeart(c, 0, sr * 0.38, sr * 0.18, "#2ecc71");

    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-sr * 0.56, -sr * 0.25);
    c.lineTo(-sr * 0.72, -sr * 0.55);
    c.lineTo(-sr * 0.5, -sr * 0.62);
    c.lineTo(-sr * 0.44, -sr * 1.02);
    c.lineTo(sr * 0.44, -sr * 1.02);
    c.lineTo(sr * 0.5, -sr * 0.62);
    c.lineTo(sr * 0.72, -sr * 0.55);
    c.lineTo(sr * 0.56, -sr * 0.25);
    c.lineTo(0, sr * 0.08);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#f39c12";
    c.beginPath();
    c.moveTo(-sr * 0.42, -sr * 0.68);
    c.lineTo(0, -sr * 0.44);
    c.lineTo(sr * 0.42, -sr * 0.68);
    c.lineTo(0, -sr * 0.58);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#e67e22";
    c.beginPath();
    c.moveTo(-sr * 0.34, -sr * 0.22);
    c.lineTo(0, sr * 0.14);
    c.lineTo(sr * 0.34, -sr * 0.22);
    c.closePath();
    c.fill();
    c.stroke();

    rt.drawHeart(c, 0, -sr * 0.06, sr * 0.11, "#2ecc71");

    c.fillStyle = COLORS.ink;
    c.fillRect(-sr * 0.36, -sr * 0.48, sr * 0.72, sr * 0.17);
    c.fillStyle = "#ff2a2a";
    c.fillRect(-sr * 0.26, -sr * 0.44, sr * 0.15, sr * 0.09);
    c.fillRect(sr * 0.11, -sr * 0.44, sr * 0.15, sr * 0.09);

    if (st && (st.phase === "barraging" || st.phase === "clashing")) {
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      for (let i = 0; i < 6; i++) {
        const wave = ((rt.elapsed * 26 + i * 1.15) % 1);
        const reach = sr * (0.65 + wave * 1.55);
        const spread = Math.sin(i * 2.4 + rt.elapsed * 18) * sr * 0.58;
        const fx = dirX * reach + perpX * spread;
        const fy = dirY * reach + perpY * spread;
        c.save();
        c.globalAlpha = Math.max(0.35, 1 - wave * 0.45);
        rt.drawStandFist(c, fx, fy, sr * 0.31, true, faceAngle + Math.PI * 0.5);
        c.restore();
      }
    } else if (st && st.phase === "dashing") {
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      c.strokeStyle = "rgba(255, 215, 0, 0.75)";
      c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        c.beginPath();
        c.moveTo(perpX * sr * 0.45 * i - dirX * sr * 0.6, perpY * sr * 0.45 * i - dirY * sr * 0.6);
        c.lineTo(perpX * sr * 0.45 * i - dirX * sr * 1.8, perpY * sr * 0.45 * i - dirY * sr * 1.8);
        c.stroke();
      }
      rt.drawStandFist(c, dirX * sr * 0.85 + perpX * sr * 0.45, dirY * sr * 0.85 + perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5);
      rt.drawStandFist(c, dirX * sr * 0.85 - perpX * sr * 0.45, dirY * sr * 0.85 - perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5);
    } else {
      const isAttacking = (ball.standAttackTimer && ball.standAttackTimer > 0) || (ball.ultTimer > 0);
      const punchExt = isAttacking ? Math.sin(rt.elapsed * 32) * 16 : 0;
      rt.drawStandFist(c, -sr * 0.96 - punchExt * 0.35, sr * 0.42 + punchExt, sr * 0.32, isAttacking, 0);
      rt.drawStandFist(c, sr * 0.96 + punchExt * 0.35, sr * 0.42 - punchExt, sr * 0.32, isAttacking, 0);
    }

    c.restore();
  }

  BF.CHARACTER_ROSTER.dio = {
    id: "dio",
    name: "ARROGANT VAMPIRE",
    shortName: "VAMPIRE",
    title: "Time Overlord • Bearer of The World",
    role: "STAND USER • TIME STOP",
    color: COLORS.dioYellow,
    radius: 28,
    speed: 370,
    maxHp: 330,
    damage: [3, 6],
    mass: 1.0,
    costume: "dio",
    weapon: "throwing_knife",
    ult: "time_stop",
    ultName: "ZA WARUDO!",
    ultDesc: "Freezes time across the arena! Suspends a deadly ring of knives in mid-air and unleashes brutal Stand attacks before time moves again.",
    skillName: "STAND BARRAGE",
    skillDesc: "The World dashes forward from behind the Vampire and unleashes a rapid Punch Barrage upon reaching the enemy!",
    skills: [SKILL_STAND_BARRAGE, SKILL_DIO_TELEPORT],
  };

  BF.WEAPON_DRAWERS.throwing_knife = (ball, c) => {
    c.fillStyle = COLORS.silver;
    c.beginPath();
    c.moveTo(0, -22);
    c.lineTo(6, -6);
    c.lineTo(3, 4);
    c.lineTo(-3, 4);
    c.lineTo(-6, -6);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = COLORS.white;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -20);
    c.lineTo(0, 3);
    c.stroke();

    c.fillStyle = COLORS.ink;
    c.fillRect(-2.5, 4, 5, 12);
    c.strokeRect(-2.5, 4, 5, 12);

    c.strokeStyle = COLORS.gold;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 19, 3.5, 0, Math.PI * 2);
    c.stroke();
  };

  BF.COSTUME_DRAWERS.dio = (ball, r, c) => {
    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = COLORS.ink;
    c.fillRect(-r * 0.65, r * 0.44, r * 1.3, r * 0.58);

    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;

    c.beginPath();
    c.moveTo(-r, r * 0.42);
    c.lineTo(-r * 0.35, r * 0.44);
    c.lineTo(-r * 0.08, r * 1.05);
    c.lineTo(-r, r * 1.05);
    c.closePath();
    c.fill();
    c.stroke();

    c.beginPath();
    c.moveTo(r, r * 0.42);
    c.lineTo(r * 0.35, r * 0.44);
    c.lineTo(r * 0.08, r * 1.05);
    c.lineTo(r, r * 1.05);
    c.closePath();
    c.fill();
    c.stroke();

    rt.drawHeart(c, 0, r * 0.48, r * 0.16, "#2ecc71");
    rt.drawHeart(c, 0, r * 0.88, r * 0.18, "#2ecc71");

    c.restore();

    c.fillStyle = "#ffd32a";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-r * 0.95, -r * 0.25);
    c.lineTo(-r * 1.32, -r * 0.55);
    c.lineTo(-r * 0.88, -r * 0.68);
    c.lineTo(-r * 1.2, -r * 1.08);
    c.lineTo(-r * 0.62, -r * 0.92);
    c.lineTo(-r * 0.38, -r * 1.38);
    c.lineTo(-r * 0.05, -r * 0.98);
    c.lineTo(r * 0.28, -r * 1.42);
    c.lineTo(r * 0.55, -r * 0.94);
    c.lineTo(r * 1.08, -r * 1.15);
    c.lineTo(r * 0.86, -r * 0.68);
    c.lineTo(r * 1.32, -r * 0.54);
    c.lineTo(r * 0.95, -r * 0.22);
    c.lineTo(r * 0.55, -r * 0.45);
    c.lineTo(r * 0.18, -r * 0.38);
    c.lineTo(0, -r * 0.52);
    c.lineTo(-r * 0.22, -r * 0.38);
    c.lineTo(-r * 0.58, -r * 0.45);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.rect(-r * 0.88, -r * 0.66, r * 1.76, r * 0.22);
    c.fill();
    c.stroke();

    rt.drawHeart(c, 0, -r * 0.55, r * 0.2, "#2ecc71");

    if (ball.flashTimer <= 0) {
      const eyeColor = ball.ultTimer > 0 ? COLORS.red : "#d35400";
      c.fillStyle = eyeColor;
      c.beginPath();
      c.arc(-r * 0.3, -r * 0.08, r * 0.08, 0, Math.PI * 2);
      c.arc(r * 0.3, -r * 0.08, r * 0.08, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = COLORS.white;
      c.beginPath();
      c.moveTo(-r * 0.16, r * 0.28);
      c.lineTo(-r * 0.12, r * 0.4);
      c.lineTo(-r * 0.08, r * 0.28);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(r * 0.08, r * 0.28);
      c.lineTo(r * 0.12, r * 0.4);
      c.lineTo(r * 0.16, r * 0.28);
      c.closePath();
      c.fill();
    }
  };

  BF.spawnStandPunchBarrage = spawnStandPunchBarrage;
  BF.spawnKnifeWave = spawnKnifeWave;
  BF.drawTheWorldStand = drawTheWorldStand;
  BF.tryDioVampiricHeal = tryDioVampiricHeal;
})();

