(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE, easeOut } = BF;
  const rt = BF.rt;

  function spawnLimitlessBlueVortex({ owner, target, x, y }) {
    const dx0 = target.x - x;
    const dy0 = target.y - y;
    const dist0 = Math.hypot(dx0, dy0) || 1;
    const travelSpeed = 540;
    return {
      x,
      y,
      vx: (dx0 / dist0) * travelSpeed,
      vy: (dy0 / dist0) * travelSpeed,
      phase: "travel",
      life: 1.0,
      vortexTimer: 0.62,
      tickTimer: 0,
      spin: 0,
      ultCharged: false,
      dead: false,
      update(dt, g) {
        this.spin += dt * 11;
        if (this.phase === "travel") {
          this.life -= dt;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          const d = Math.hypot(target.x - this.x, target.y - this.y);
          if (d <= target.radius + 36 || this.life <= 0.45 || this.x < 30 || this.x > WORLD_SIZE - 30 || this.y < 30 || this.y > WORLD_SIZE - 30) {
            this.phase = "vortex";
            g.sound.playCritHit();
            g.entities.push(rt.spawnShockRing(this.x, this.y, "#00b4ff", 95, 0.36));
          }
          return;
        }
        this.vortexTimer -= dt;
        this.tickTimer -= dt;
        if (target.alive) {
          const pdx = this.x - target.x;
          const pdy = this.y - target.y;
          const pdist = Math.hypot(pdx, pdy) || 1;
          if (pdist <= 205) {
            const pull = 540 * dt;
            target.vx += (pdx / pdist) * pull;
            target.vy += (pdy / pdist) * pull;
            const posPull = Math.min(pdist, 165 * dt);
            target.x += (pdx / pdist) * posPull;
            target.y += (pdy / pdist) * posPull;
          }
          if (this.tickTimer <= 0 && pdist <= 105) {
            this.tickTimer = 0.2;
            const dealt = g.applyDamage(target, 2);
            target.flashTimer = 0.06;
            if (!this.ultCharged) {
              this.ultCharged = true;
              g.chargeUlt(owner);
            }
            g.spawnSparks(target.x, target.y, "#00b4ff", COLORS.white);
            g.spawnDamageText(target.x, target.y - target.radius - 6, dealt, "#00b4ff", false, "PULL!");
          }
        }
        if (Math.random() < 0.7) {
          const a = Math.random() * Math.PI * 2;
          const r0 = 32 + Math.random() * 28;
          rt.particles.push({
            x: this.x + Math.cos(a) * r0,
            y: this.y + Math.sin(a) * r0,
            vx: -Math.cos(a) * 140,
            vy: -Math.sin(a) * 140,
            size: 4,
            life: 0.22,
            maxLife: 0.22,
            color: "#5ce1ff",
            shape: "circle",
          });
        }
        if (this.vortexTimer <= 0) {
          this.dead = true;
          if (target.alive && Math.hypot(target.x - this.x, target.y - this.y) <= 105) {
            const fin = g.applyDamage(target, 2);
            target.flashTimer = 0.14;
            target.squash = 0.85;
            g.spawnSparks(target.x, target.y, "#00b4ff", COLORS.white);
            g.spawnDamageText(target.x, target.y - target.radius - 14, fin, "#00b4ff", true, "LAPSE BLUE!");
            if (!this.ultCharged) {
              this.ultCharged = true;
              g.chargeUlt(owner);
            }
          }
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#8be9ff", 105, 0.35));
          g.sound.playBallHit();
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        const rCore = this.phase === "vortex" ? 19 + Math.sin(this.spin * 1.5) * 3 : 15;
        c.fillStyle = "rgba(0, 180, 255, 0.24)";
        c.beginPath();
        c.arc(0, 0, rCore * 2.1, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "rgba(155, 236, 255, 0.9)";
        c.lineWidth = 2.2;
        for (let k = 0; k < 2; k++) {
          c.beginPath();
          c.ellipse(0, 0, rCore * 1.7, rCore * 0.65, this.spin + k * Math.PI * 0.5, 0, Math.PI * 2);
          c.stroke();
        }

        c.fillStyle = "#00a6ff";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, rCore, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#e6fbff";
        c.beginPath();
        c.arc(0, 0, rCore * 0.44, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  function spawnHollowPurpleBurst(x, y, maxR = 195) {
    return {
      x,
      y,
      life: 0.65,
      maxLife: 0.65,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p);
        const rad = 34 + easeOut(p) * maxR;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;
        c.fillStyle = "rgba(140, 40, 245, 0.28)";
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#e5b8ff";
        c.lineWidth = 6 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.85, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = "#7c1fff";
        c.lineWidth = 10 * (1 - p) + 2;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  function triggerHollowPurpleExplosion(gx, gy, owner, g, directHitTarget = null) {
    const cx = Math.max(36, Math.min(WORLD_SIZE - 36, gx));
    const cy = Math.max(36, Math.min(WORLD_SIZE - 36, gy));
    const aoeR = 195;
    g.entities.push(spawnHollowPurpleBurst(cx, cy, aoeR));
    g.entities.push(rt.spawnShockRing(cx, cy, "#e5b8ff", aoeR * 0.9, 0.45));
    g.spawnSparks(cx, cy, "#b84dff", COLORS.white);
    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        if (tt !== directHitTarget) {
          const splashDmg = g.applyDamage(tt, Math.round(16 + g.rng() * 4));
          g.spawnDamageText(tt.x, tt.y - tt.radius - 14, splashDmg, "#d8b4fe", true, "VOID BLAST!");
        }
        const kAng = Math.atan2(tt.y - cy, tt.x - cx);
        tt.vx = Math.cos(kAng) * 580;
        tt.vy = Math.sin(kAng) * 580;
        tt.flashTimer = 0.16;
        tt.squash = 1.0;
        g.addEffect(tt, "stun", 0.75);
      }
    }
    rt.setHitStop(0.11);
    rt.addShake(0.48, 12);
    g.sound.playCritHit();
  }

  function spawnUnlimitedVoidDomain({ owner, duration = 6.0 }) {
    return {
      isDomain: true,
      domainOwner: owner,
      domainType: "unlimited_void",
      domainName: "UNLIMITED VOID",
      domainColor: "#38bdf8",
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0 || !owner.alive) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const fade = p < 0.06 ? p / 0.06 : p > 0.9 ? (1 - p) / 0.1 : 1;
        const cx = WORLD_SIZE * 0.5;
        const cy = WORLD_SIZE * 0.5;
        c.save();

        c.globalAlpha = 0.72 * fade;
        c.fillStyle = "#02060f";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        c.globalAlpha = 0.75 * fade;
        const spin = p * Math.PI * 5;
        for (let i = 0; i < 6; i++) {
          const rr = 68 + i * 18;
          c.strokeStyle = i % 2 === 0 ? "rgba(186, 226, 255, 0.52)" : "rgba(120, 185, 235, 0.35)";
          c.lineWidth = 4 - i * 0.4;
          c.beginPath();
          c.arc(cx, cy, rr, spin + i * 0.9, spin + i * 0.9 + Math.PI * 1.45);
          c.stroke();
        }

        const corona = c.createRadialGradient(cx, cy, 42, cx, cy, 98);
        corona.addColorStop(0, "rgba(180, 225, 255, 0.75)");
        corona.addColorStop(0.5, "rgba(110, 175, 225, 0.25)");
        corona.addColorStop(1, "rgba(2, 6, 15, 0)");
        c.fillStyle = corona;
        c.beginPath();
        c.arc(cx, cy, 98, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#000000";
        c.strokeStyle = "rgba(195, 230, 255, 0.75)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(cx, cy, 48, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#000000";
        const inkSplatters = [
          [-56, -12, 13], [-70, 6, 10], [-44, 18, 9],
          [54, 14, 15], [70, -4, 11], [42, -22, 8],
        ];
        for (const [ox, oy, sr] of inkSplatters) {
          c.beginPath();
          c.arc(cx + ox, cy + oy, sr, 0, Math.PI * 2);
          c.fill();
        }

        c.globalAlpha = 0.88 * fade;
        c.fillStyle = "#ffffff";
        const whiteBlobs = [
          [24, 34, 20], [52, 22, 12], [18, 72, 14], [48, 412, 16], [28, 444, 22],
          [448, 36, 22], [412, 62, 15], [382, 86, 11], [430, 398, 20], [392, 424, 14], [356, 444, 10],
        ];
        for (const [bx, by, br] of whiteBlobs) {
          c.beginPath();
          c.arc(bx, by, br, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = "#ffffff";
        c.lineWidth = 6;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(474, 24); c.lineTo(356, 108);
        c.moveTo(468, 438); c.lineTo(340, 466);
        c.moveTo(8, 360); c.lineTo(68, 405);
        c.stroke();

        c.restore();
      },
    };
  }

  const SKILL_LIMITLESS_ALTERNATE = {
    name: "Limitless: Red / Blue",
    cooldown: 2.5,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      if (ball.ultTimer > 0 && !ball.domainUsedInUlt) {
        ball.domainUsedInUlt = true;
        rt.triggerDomainExpansion(ball, {
          type: "unlimited_void",
          name: "UNLIMITED VOID",
          color: "#38bdf8",
          duration: 6.0,
          createDomain: () => spawnUnlimitedVoidDomain({ owner: ball, duration: 6.0 }),
          onStart(gg) {
            const t = gg.balls.find((b) => b !== ball && b.alive);
            if (t) {
              g.addEffect(t, "stun", 6.0);
              t.vx = 0;
              t.vy = 0;
              gg.spawnDamageText(t.x, t.y - t.radius - 18, 0, "#7dd3fc", true, "INFINITE VOID (6S)!");
            }
            gg.entities.push(rt.spawnBanner("DOMAIN: UNLIMITED VOID!", "#38bdf8"));
            gg.sound.playTimeStop();
            rt.addShake(0.35, 8);
          },
        }, g);
      }

      const mode = ball.limitlessNext === "blue" ? "blue" : "red";
      ball.limitlessNext = mode === "red" ? "blue" : "red";
      rt.beginCast(ball, {
        kind: "orb",
        duration: 0.42,
        color: mode === "red" ? "#ff1e42" : "#00b4ff",
        maxR: mode === "red" ? 21 : 23,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = rt.castMuzzle(b, ang, 16);
          if (mode === "red") {
            gg.entities.push(rt.spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 570,
              radius: 17,
              damage: Math.round(13 + gg.rng() * 3),
              color: "#ff1e42",
              label: "REVERSAL RED!",
              shape: "limitless_red",
              onImpact(tt, gg2, proj) {
                const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                tt.vx = Math.cos(kAng) * 640;
                tt.vy = Math.sin(kAng) * 640;
                tt.squash = 0.95;
                gg2.entities.push(rt.spawnShockRing(proj.x, proj.y, "#ff1e42", 125, 0.4));
                gg2.spawnSparks(proj.x, proj.y, "#ff1e42", COLORS.white);
                gg2.chargeUlt(b);
                rt.addShake(0.25, 7);
                gg2.sound.playCritHit();
              },
            }));
          } else {
            gg.entities.push(spawnLimitlessBlueVortex({ owner: b, target: t, x: m.x, y: m.y }));
          }
          gg.sound.playBallHit();
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.gojo = {
    id: "gojo",
    name: "HONORED SORCERER",
    shortName: "GOJO",
    title: "Strongest Jujutsu Sorcerer • Limitless & Six Eyes",
    role: "SORCERER • LIMITLESS (RED / BLUE)",
    series: "sorcerer",
    color: "#1b1d2b",
    radius: 28,
    speed: 375,
    maxHp: 345,
    damage: [7, 13],
    mass: 1.0,
    costume: "gojo",
    weapon: null,
    ult: "hollow_purple",
    ultName: "HOLLOW PURPLE",
    ultDesc: "Awakens the Six Eyes and fuses Reversal Red & Lapse Blue into an Imaginary Mass singularity that erases targets with an elegant violet void blast!",
    skillName: "LIMITLESS: RED / BLUE",
    skillDesc: "Alternates every cast! 1st: Cursed Technique Reversal RED (repels & blasts away). 2nd: Lapse BLUE (gravitational vortex pull & implosion).",
    skills: [SKILL_LIMITLESS_ALTERNATE],
  };

  BF.TRANSFORM_DETAILS.gojo = {
    label: "🔥 SIX EYES",
    speedMult: 1.15,
    radiusMult: 1.0,
    powerText: "40+ VOID",
    ultSkillName: "HOLLOW PURPLE",
    ultSkillCd: "5-HIT ULT",
    ultSkillDesc: "Removes blindfold to unleash Six Eyes (+15% Speed) and fuses Red + Blue into a massive Imaginary Mass void singularity (40+ DMG)!",
  };

  BF.COSTUME_DRAWERS.gojo = (ball, r, c) => {
    const awakened = ball.ultTimer > 0;
    if (awakened) {
      c.save();
      const spin = performance.now() * 0.003;
      c.fillStyle = "rgba(96, 225, 255, 0.18)";
      c.beginPath();
      c.arc(0, 0, r * 1.52, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(125, 211, 252, 0.45)";
      c.lineWidth = 2.5;
      c.stroke();

      c.strokeStyle = "rgba(184, 77, 255, 0.5)";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, r * 1.44, r * 0.6, spin, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(56, 232, 255, 0.5)";
      c.beginPath();
      c.ellipse(0, 0, r * 1.44, r * 0.6, -spin, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = "#f9e8dc";
    c.fillRect(-r, -r, r * 2, r * 1.48);
    c.fillStyle = "#141624";
    c.fillRect(-r, r * 0.36, r * 2, r * 0.72);
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-r, r * 0.36);
    c.lineTo(r, r * 0.36);
    c.stroke();

    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.arc(r * 0.2, r * 0.58, r * 0.09, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 1.6;
    c.stroke();

    if (!awakened) {
      c.fillStyle = "#0e0f17";
      c.fillRect(-r, -r * 0.34, r * 2, r * 0.42);
      c.strokeStyle = "#2b2f45";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-r * 0.8, -r * 0.24);
      c.lineTo(r * 0.8, -r * 0.16);
      c.stroke();
    } else {
      for (const side of [-1, 1]) {
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(side * r * 0.32, -r * 0.08, r * 0.22, r * 0.16, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "#38e8ff";
        c.beginPath();
        c.arc(side * r * 0.32, -r * 0.08, r * 0.12, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = "#0b2e4f";
        c.beginPath();
        c.arc(side * r * 0.32, -r * 0.08, r * 0.05, 0, Math.PI * 2);
        c.fill();

        c.fillStyle = COLORS.white;
        c.beginPath();
        c.arc(side * r * 0.36, -r * 0.12, r * 0.035, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-r * 0.16, r * 0.22);
    c.quadraticCurveTo(r * 0.06, r * 0.3, r * 0.26, r * 0.16);
    c.stroke();
    c.restore();

    c.fillStyle = "#f4f7ff";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-r * 0.96, -r * 0.28);
    c.lineTo(-r * 1.18, -r * 0.68);
    c.lineTo(-r * 0.78, -r * 0.76);
    c.lineTo(-r * 0.84, -r * 1.24);
    c.lineTo(-r * 0.34, -r * 0.92);
    c.lineTo(0, -r * 1.32);
    c.lineTo(r * 0.34, -r * 0.92);
    c.lineTo(r * 0.84, -r * 1.24);
    c.lineTo(r * 0.78, -r * 0.76);
    c.lineTo(r * 1.18, -r * 0.68);
    c.lineTo(r * 0.96, -r * 0.28);
    c.lineTo(r * 0.56, -r * 0.44);
    c.lineTo(r * 0.18, -r * 0.28);
    c.lineTo(-r * 0.12, -r * 0.46);
    c.lineTo(-r * 0.56, -r * 0.32);
    c.closePath();
    c.fill();
    c.stroke();
  };

  BF.triggerHollowPurpleExplosion = triggerHollowPurpleExplosion;
  BF.spawnUnlimitedVoidDomain = spawnUnlimitedVoidDomain;
})();

