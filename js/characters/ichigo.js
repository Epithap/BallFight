(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Getsuga / Black Getsuga impact burst
  function spawnGetsugaImpactBurst(x, y, maxR = 68, isBlack = false) {
    return {
      x,
      y,
      maxR,
      isBlack,
      life: 0.36,
      maxLife: 0.36,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p);
        const rad = 16 + easeOut(p) * this.maxR;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;

        c.fillStyle = this.isBlack ? "rgba(18, 6, 12, 0.52)" : "rgba(220, 38, 38, 0.28)";
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

        c.strokeStyle = "#ef4444";
        c.lineWidth = 6 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();

        if (this.isBlack) {
          c.fillStyle = "#090205";
          c.strokeStyle = "#fecaca";
          c.lineWidth = 3 * (1 - p) + 1;
          c.beginPath();
          c.arc(0, 0, rad * 0.56, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // Shunpo / Sonído flash-step afterimage ghost left behind when Ichigo dashes
  function spawnShunpoAfterimage(x, y, r, isHollow = false) {
    return {
      x,
      y,
      r,
      isHollow,
      life: 0.3,
      maxLife: 0.3,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = k * 0.65;

        // Dark silhouette disc
        c.fillStyle = this.isHollow ? "#090205" : "#18151f";
        c.strokeStyle = "#ef4444";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, this.r * (0.92 + (1 - k) * 0.14), 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Horizontal Shunpo / Sonído static speed-lines across the ghost
        c.strokeStyle = this.isHollow ? "#ef4444" : COLORS.white;
        c.lineWidth = 2.2;
        for (const dy of [-0.55, -0.2, 0.15, 0.5]) {
          const w = this.r * (1.35 - Math.abs(dy) * 0.6);
          c.beginPath();
          c.moveTo(-w, this.r * dy);
          c.lineTo(w, this.r * dy);
          c.stroke();
        }
        c.restore();
      },
    };
  }

  // Tensa Zangetsu / Vasto Lorde Sonído X-Cross & Crescent Slash visual
  function spawnZangetsuSlashEffect(x, y, angle = 0, maxR = 72, isVasto = false) {
    return {
      x,
      y,
      angle,
      maxR,
      isVasto,
      life: 0.34,
      maxLife: 0.34,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p * 0.88);
        const reach = this.maxR * (0.55 + 0.55 * easeOut(p));
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.globalAlpha = alpha;
        c.lineCap = "round";
        c.lineJoin = "round";

        const tilts = this.isVasto ? [-0.46, 0, 0.46] : [-0.38, 0.38];
        for (const tilt of tilts) {
          c.save();
          c.rotate(tilt);

          // Outer crimson Reiatsu slash wave
          c.fillStyle = "#dc2626";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(-reach * 0.85, -8);
          c.quadraticCurveTo(0, -24, reach * 0.95, 0);
          c.quadraticCurveTo(0, -8, -reach * 0.85, -8);
          c.closePath();
          c.fill();
          c.stroke();

          // Pitch-black Bankai Zangetsu core
          c.strokeStyle = "#090205";
          c.lineWidth = 3.6;
          c.beginPath();
          c.moveTo(-reach * 0.65, -8);
          c.quadraticCurveTo(0, -16, reach * 0.82, 0);
          c.stroke();

          // White-hot spiritual blade edge
          c.strokeStyle = "#fecaca";
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(-reach * 0.45, -10);
          c.quadraticCurveTo(0, -18, reach * 0.86, 0);
          c.stroke();

          c.restore();
        }
        c.restore();
      },
    };
  }

  // Hollow-Purple-scale Gran Rey Cero cataclysmic explosion
  function spawnGranReyCeroBurst(x, y, maxR = 205) {
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

        // Outer crimson Cero spiritual pressure dome
        c.fillStyle = "rgba(220, 38, 38, 0.34)";
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

        // 14 radial Gran Rey Cero spatial-distortion rays bursting outward
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 - p * 0.4;
          const r0 = rad * 0.22;
          const r1 = rad * (i % 2 === 0 ? 1.15 : 0.9);
          c.strokeStyle = i % 2 === 0 ? "#ef4444" : "#090205";
          c.lineWidth = (1 - p) * (i % 2 === 0 ? 7.5 : 5) + 1.5;
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }

        // Inner dark-crimson Cero ring
        c.fillStyle = "rgba(127, 29, 29, 0.46)";
        c.beginPath();
        c.arc(0, 0, rad * 0.74, 0, Math.PI * 2);
        c.fill();

        // Central pitch-black Hollow Cero core with white-crimson rim
        c.fillStyle = "#090205";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 4.5 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.44 * (1 - p * 0.32), 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Concentric blast shockwave rings
        c.strokeStyle = "#fecaca";
        c.lineWidth = 6 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.85, 0, Math.PI * 2);
        c.stroke();

        c.strokeStyle = "#dc2626";
        c.lineWidth = 10 * (1 - p) + 2;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();

        c.restore();
      },
    };
  }

  function triggerGranReyCeroExplosion(gx, gy, owner, g, directHitTarget = null) {
    const cx = Math.max(36, Math.min(WORLD_SIZE - 36, gx));
    const cy = Math.max(36, Math.min(WORLD_SIZE - 36, gy));
    const aoeR = 205;
    g.entities.push(spawnGranReyCeroBurst(cx, cy, aoeR));
    g.entities.push(rt.spawnShockRing(cx, cy, "#ef4444", aoeR, 0.5));
    g.entities.push(rt.spawnShockRing(cx, cy, "#090205", aoeR * 0.78, 0.4));
    g.entities.push(rt.spawnShockRing(cx, cy, COLORS.white, aoeR * 0.52, 0.3));
    g.spawnSparks(cx, cy, "#ef4444", "#090205");
    g.spawnSparks(cx, cy, COLORS.white, "#dc2626");

    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        if (tt !== directHitTarget) {
          const splashDmg = g.applyDamage(tt, Math.round(18 + g.rng() * 4));
          g.spawnDamageText(tt.x, tt.y - tt.radius - 14, splashDmg, "#ef4444", true, "CERO BLAST!");
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

  function hasSkin(ball, skinId) {
    if (!ball) return false;
    if (ball.skin === skinId) return true;
    if (Array.isArray(ball.skins) && ball.skins.includes(skinId)) return true;
    return false;
  }

  const SKILL_GETSUGA = {
    name: "Getsuga / Shunpo",
    cooldown: 3.0,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      // 2nd Evo (Dangai Ichigo / Mugetsu Mode)
      if (ball.evoTier === 2) {
        if (ball.mugetsuMode) {
          // Mugetsu Roaming Form: Rapid Jet-Black Crescent Slashes
          const ang = Math.atan2(target.y - ball.y, target.x - ball.x);
          rt.beginCast(ball, {
            kind: "slash",
            duration: 0.16,
            color: "#a855f7",
            maxR: 28,
            fire(b, g) {
              const t = g.balls.find((x) => x !== b && x.alive);
              if (!t) return;
              const a = Math.atan2(t.y - b.y, t.x - b.x);
              const m = rt.castMuzzle(b, a, 16);
              g.entities.push(rt.spawnShockRing(m.x, m.y, "#09090b", 95, 0.28));
              g.entities.push(rt.spawnShockRing(m.x, m.y, "#a855f7", 70, 0.22));
              g.entities.push(rt.spawnProjectile({
                owner: b, target: t, x: m.x, y: m.y,
                speed: 680, radius: 30, damage: 20,
                color: "#09090b", label: "MUGETSU SLASH!",
                shape: "black_getsuga",
                onImpact(tt, gg, proj) {
                  gg.entities.push(spawnGetsugaImpactBurst(proj.x, proj.y, 88, true));
                  gg.entities.push(rt.spawnShockRing(proj.x, proj.y, "#a855f7", 105, 0.3));
                  const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                  tt.vx += Math.cos(kAng) * 310;
                  tt.vy += Math.sin(kAng) * 310;
                },
              }));
            },
          });
          return true;
        }

        const move2 = ball.ichigoNextMove || "getsuga";
        ball.ichigoNextMove = move2 === "getsuga" ? "shunpo" : "getsuga";
        if (move2 === "shunpo") {
          rt.beginCast(ball, {
            kind: "powerup",
            duration: 0.16,
            color: "#e2e8f0",
            fire(b, g) {
              const t = g.balls.find((x) => x !== b && x.alive);
              if (!t) return;
              const startX = b.x;
              const startY = b.y;
              const ang = Math.atan2(t.y - b.y, t.x - b.x);
              const pad = b.radius + 14;
              const bx = Math.max(pad, Math.min(WORLD_SIZE - pad, t.x + Math.cos(ang) * (t.radius + b.radius + 16)));
              const by = Math.max(pad, Math.min(WORLD_SIZE - pad, t.y + Math.sin(ang) * (t.radius + b.radius + 16)));

              // Flashy multi-afterimage Shunpo trail along the teleport path
              for (const frac of [0, 0.35, 0.7]) {
                const ax = startX + (bx - startX) * frac;
                const ay = startY + (by - startY) * frac;
                g.entities.push(spawnShunpoAfterimage(ax, ay, b.radius * (1 - frac * 0.15), true));
              }
              g.entities.push(rt.spawnShockRing(startX, startY, "#f8fafc", 110, 0.28));
              g.entities.push(rt.spawnShockRing(startX, startY, "#09090b", 80, 0.22));

              b.x = bx;
              b.y = by;
              const spd = Math.max(Math.hypot(b.vx, b.vy), b.baseSpeed);
              b.vx = -Math.cos(ang) * spd;
              b.vy = -Math.sin(ang) * spd;
              const dealt = g.applyDamage(t, 14);
              t.flashTimer = 0.16;
              g.addEffect(t, "stun", 0.25);
              // Twin X-cross Zangetsu slashes + layered shockrings + double sparks + +1 Ulti
              g.entities.push(spawnZangetsuSlashEffect(t.x, t.y, ang + 0.42, 98, true));
              g.entities.push(spawnZangetsuSlashEffect(t.x, t.y, ang - 0.42, 98, true));
              g.entities.push(rt.spawnShockRing(t.x, t.y, "#09090b", 128, 0.32));
              g.entities.push(rt.spawnShockRing(t.x, t.y, "#f8fafc", 96, 0.26));
              g.spawnSparks(t.x, t.y, "#f8fafc", "#09090b");
              g.spawnSparks(t.x, t.y, "#94a3b8", "#f8fafc");
              g.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#e2e8f0", true, "CHAIN SHUNPO!");
              g.chargeUlt(b);
              g.sound.playCritHit();
            },
          });
          return true;
        }

        // Mountain-Cleaving Air Pressure Slash (pure black-and-white shockwave, no colored laser)
        rt.beginCast(ball, {
          kind: "slash",
          duration: 0.24,
          color: "#e2e8f0",
          maxR: 28,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const m = rt.castMuzzle(b, ang, 16);
            g.entities.push(rt.spawnShockRing(m.x, m.y, "#e2e8f0", 110, 0.3));
            g.entities.push(rt.spawnShockRing(m.x, m.y, "#09090b", 80, 0.24));
            g.entities.push(rt.spawnProjectile({
              owner: b, target: t, x: m.x, y: m.y,
              speed: 650, radius: 32, damage: 19,
              color: "#e2e8f0", label: "MOUNTAIN CLEAVE!",
              shape: "crescent",
              onImpact(tt, gg, proj) {
                gg.entities.push(spawnGetsugaImpactBurst(proj.x, proj.y, 86, true));
                gg.entities.push(rt.spawnShockRing(proj.x, proj.y, "#e2e8f0", 125, 0.34));
                const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                tt.vx = Math.cos(kAng) * 440;
                tt.vy = Math.sin(kAng) * 440;
                gg.chargeUlt(b);
              },
            }));
          },
        });
        return true;
      }

      // Vasto Lorde Permanent Form (Evolved HP <= 200): Sonído High-Speed Claw & Blade Dash
      if (ball.vastoLordeMode) {
        rt.beginCast(ball, {
          kind: "powerup",
          duration: 0.2,
          color: "#dc2626",
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            g.entities.push(spawnShunpoAfterimage(b.x, b.y, b.radius, true));
            g.entities.push(rt.spawnShockRing(b.x, b.y, "#090205", 90, 0.28));
            const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
            const dashSpeed = b.baseSpeed * 2.6;
            b.vx = ((t.x - b.x) / len) * dashSpeed;
            b.vy = ((t.y - b.y) / len) * dashSpeed;
            b.shunpoDashTimer = 0.52;
            b.shunpoDashHit = false;
            g.spawnDamageText(b.x, b.y - b.radius, 0, "#ef4444", true, "SONÍDO!");
            g.spawnSparks(b.x, b.y, "#ef4444", "#090205");
          },
        });
        return true;
      }

      const evolved = Boolean(ball.evolved);
      const innerDemon = Boolean(ball.innerDemonMode);
      const isBlackGetsuga = innerDemon || (evolved && ball.ultTimer > 0);
      const isShikaiBase = !evolved && !(ball.ultTimer > 0) && !innerDemon;
      const move = ball.ichigoNextMove || "getsuga";
      ball.ichigoNextMove = move === "getsuga" ? "shunpo" : "getsuga";

      if (move === "shunpo") {
        rt.beginCast(ball, {
          kind: "powerup",
          duration: isBlackGetsuga ? 0.2 : 0.26,
          color: isShikaiBase ? "#38bdf8" : (isBlackGetsuga ? "#dc2626" : COLORS.ichigoDark),
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            g.entities.push(spawnShunpoAfterimage(b.x, b.y, b.radius, isBlackGetsuga));
            g.entities.push(rt.spawnShockRing(b.x, b.y, isShikaiBase ? "#38bdf8" : "#ef4444", 75, 0.26));
            const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
            const dashSpeed = b.baseSpeed * (isBlackGetsuga ? 2.55 : 2.25);
            b.vx = ((t.x - b.x) / len) * dashSpeed;
            b.vy = ((t.y - b.y) / len) * dashSpeed;
            b.shunpoDashTimer = 0.48;
            b.shunpoDashHit = false;
            const lbl = innerDemon ? "DEMON SHUNPO!" : (isBlackGetsuga ? "HOLLOW SHUNPO!" : "SHUNPO!");
            g.spawnDamageText(b.x, b.y - b.radius, 0, isShikaiBase ? "#38bdf8" : "#ef4444", isBlackGetsuga, lbl);
            g.spawnSparks(b.x, b.y, isShikaiBase ? "#38bdf8" : "#ef4444", COLORS.ink);
          },
        });
        return true;
      }

      const waveColor = isShikaiBase ? "#38bdf8" : COLORS.red;
      const waveDmg = isBlackGetsuga ? 24 : (isShikaiBase ? 14 : 18);
      rt.beginCast(ball, {
        kind: "slash", duration: isBlackGetsuga ? 0.28 : 0.36, color: waveColor, maxR: isBlackGetsuga ? 26 : 19,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = rt.castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 14);
          g.entities.push(rt.spawnShockRing(m.x, m.y, waveColor, isBlackGetsuga ? 90 : 62, 0.3));
          g.entities.push(rt.spawnProjectile({
            owner: b, target: t, x: m.x, y: m.y,
            speed: isBlackGetsuga ? 610 : 540, radius: isBlackGetsuga ? 27 : 19, damage: waveDmg,
            color: waveColor, label: isBlackGetsuga ? "BLACK GETSUGA!" : "GETSUGA TENSHO!",
            shape: isBlackGetsuga ? "black_getsuga" : "crescent",
            onImpact(tt, gg, proj) {
              gg.entities.push(spawnGetsugaImpactBurst(proj.x, proj.y, isBlackGetsuga ? 76 : 54, isBlackGetsuga));
              gg.addEffect(tt, "slow", isBlackGetsuga ? 1.0 : 0.75, { factor: 0.65 });
              if (isBlackGetsuga) {
                const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                tt.vx += Math.cos(kAng) * 280;
                tt.vy += Math.sin(kAng) * 280;
              } else {
                gg.chargeUlt(b);
              }
            },
          }));
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.ichigo = {
    id: "ichigo",
    name: "SUBSTITUTE REAPER",
    shortName: "REAPER",
    title: "Moon Blade Master • Hollow Hybrid",
    role: "REAPER • SHIKAI / BANKAI & HOLLOW",
    color: COLORS.ichigoDark,
    radius: 28,
    speed: 370,
    maxHp: 520,
    damage: [10, 16],
    mass: 1.0,
    costume: "ichigo",
    weapon: "tensa_zangetsu",
    ult: "hollow_mask",
    ultName: "BANKAI / HOLLOW MASK / GRAN REY CERO",
    ultDesc: "Starter: Shikai Base, Bankai Ult & Inner Demon at HP<=100! Evolved (10k Gold): Bankai Base, Hollow Mask Ult & permanent Vasto Lorde at HP<=200!",
    skillName: "GETSUGA TENSHO / SHUNPO SLASH",
    skillDesc: "Alternates Getsuga Tensho wave and Shunpo Flash-Step Slash (upgrades to Black Getsuga & Sonído Slash!).",
    skills: [SKILL_GETSUGA],
  };

  BF.TRANSFORM_DETAILS.ichigo = {
    label: "💀 BANKAI / HOLLOW MASK / VASTO LORDE",
    speedMult: 1.28,
    radiusMult: 1.08,
    powerText: "24 WAVE / 35+ CERO",
    hpNote: "STARTER<=100 DEMON • EVO<=200 VASTO",
    ultSkillName: "BLACK GETSUGA & GRAN REY CERO",
    ultSkillCd: "CD: 2.6S",
    ultSkillDesc: "Starter awakens Inner Demon at HP<=100! Evolve (10k Gold) to start in Bankai, use Hollow Mask Ult & awaken Vasto Lorde at HP<=200!",
  };

  BF.WEAPON_DRAWERS.tensa_zangetsu = (ball, c) => {
    if (ball.mugetsuMode) {
      // MUGETSU: Pure Jet-Black Ink-Flame Reiatsu Blade
      c.save();
      const fPulse = Math.sin(performance.now() * 0.014) * 1.8;
      c.fillStyle = "rgba(9, 9, 11, 0.45)";
      c.beginPath();
      c.moveTo(-7, 10);
      c.quadraticCurveTo(-8 - fPulse, -22, -3, -48 - fPulse);
      c.lineTo(8 + fPulse, -34);
      c.quadraticCurveTo(7, -12, 6, 10);
      c.closePath();
      c.fill();

      c.fillStyle = "#050507";
      c.strokeStyle = "#27272a";
      c.lineWidth = 2.0;
      c.beginPath();
      c.moveTo(-3.5, 8);
      c.lineTo(-3.2, -42);
      c.lineTo(4.2, -32);
      c.lineTo(3.5, 8);
      c.closePath();
      c.fill();
      c.stroke();

      // Subtle crimson-ink edge gleam
      c.strokeStyle = "rgba(220, 38, 38, 0.45)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(2.4, 4);
      c.lineTo(2.8, -31);
      c.stroke();
      c.restore();
      return;
    }

    if (ball.evoTier === 2) {
      // DANGAI ICHIGO: Fused Tensa Zangetsu with longer black blade & iron chain links
      c.save();
      c.fillStyle = "#09090b";
      c.strokeStyle = "#e2e8f0";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-3, 7);
      c.lineTo(-3, -36);
      c.lineTo(3.5, -28);
      c.lineTo(3.5, 7);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#09090b";
      c.fillRect(-9, 6, 18, 4.5);
      c.fillStyle = "#334155";
      c.fillRect(-3, 10, 6, 12);
      // Black chain links trailing from hilt
      c.strokeStyle = "#09090b";
      c.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(0, 25 + i * 5, 3, 2, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
      return;
    }

    const isShikai = !ball.evolved && !(ball.ultTimer > 0) && !ball.innerDemonMode && !ball.vastoLordeMode;
    if (isShikai) {
      // SHIKAI ZANGETSU: Oversized giant cleaver blade with silver cutting edge, black spine & white cloth bandages
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      // Giant cleaver blade body (black spine on left, gleaming silver edge on right)
      c.fillStyle = "#e2e8f0";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(-6, 7);
      c.lineTo(-6, -33);
      c.quadraticCurveTo(6, -31, 8, -16);
      c.lineTo(6, 7);
      c.closePath();
      c.fill();
      c.stroke();

      // Pitch-black heavy spine of Shikai Zangetsu
      c.fillStyle = "#18181b";
      c.beginPath();
      c.moveTo(-5.5, 6);
      c.lineTo(-5.5, -31);
      c.lineTo(0.5, -28);
      c.lineTo(0.5, 6);
      c.closePath();
      c.fill();

      // White bandage-wrapped hilt (no handguard on Shikai Zangetsu)
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.fillRect(-3, 7, 6, 13);
      c.strokeRect(-3, 7, 6, 13);

      // Trailing white cloth ribbon streaming from the pommel
      const wave = Math.sin(performance.now() * 0.01) * 3.5;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(0, 20);
      c.quadraticCurveTo(wave, 26, -wave * 0.8, 32);
      c.stroke();
      c.strokeStyle = "#f8fafc";
      c.lineWidth = 2.5;
      c.stroke();
      c.restore();
      return;
    }

    // BANKAI: TENSA ZANGETSU (Sleek pitch-black katana with manji guard & crimson-black Reiatsu)
    const hollow = ball.ultTimer > 0 || ball.vastoLordeMode || ball.innerDemonMode;
    if (hollow) {
      c.fillStyle = "rgba(220, 38, 38, 0.35)";
      c.beginPath();
      c.moveTo(-6, 8);
      c.lineTo(-5, -34);
      c.lineTo(6, -26);
      c.lineTo(6, 8);
      c.closePath();
      c.fill();
    }
    c.fillStyle = COLORS.ichigoDark;
    c.strokeStyle = hollow ? "#ef4444" : COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-2.5, 6);
    c.lineTo(-2.5, -30);
    c.lineTo(3, -24);
    c.lineTo(3, 6);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = COLORS.ink;
    c.fillRect(-8, 5, 16, 4);
    c.fillStyle = COLORS.red;
    c.fillRect(-2.5, 9, 5, 11);
    c.strokeRect(-2.5, 9, 5, 11);
    c.beginPath();
    c.arc(0, 23, 3, 0, Math.PI * 2);
    c.stroke();
  };

  BF.COSTUME_DRAWERS.ichigo = (ball, r, c) => {
    const hurt = ball.flashTimer > 0;
    const t = performance.now() * 0.006;

    // 2ND EVO: DANGAI ICHIGO & MUGETSU FORM
    if (ball.evoTier === 2) {
      const isMugetsu = Boolean(ball.mugetsuMode && ball.ultTimer > 0);
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      if (isMugetsu) {
        // Dramatic Swirling Black Ink / Reiatsu Tendrils Aura (inspired by Final Getsuga Tensho)
        const pulse = Math.sin(t * 2.2) * 2.5;
        const sway = Math.sin(t * 1.6) * 3.0;
        c.fillStyle = "rgba(9, 9, 11, 0.28)";
        c.beginPath();
        c.arc(0, 0, r * 1.52 + pulse, 0, Math.PI * 2);
        c.fill();

        // Sweeping Black Ink Tendrils curving around body
        c.strokeStyle = "#050507";
        c.lineCap = "round";
        c.lineWidth = 5.5;
        c.beginPath();
        c.moveTo(-r * 1.15, r * 0.85);
        c.quadraticCurveTo(-r * 1.72, -r * 0.15 + sway, -r * 0.92, -r * 1.28);
        c.stroke();

        c.lineWidth = 4.2;
        c.beginPath();
        c.moveTo(r * 0.55, r * 0.98);
        c.quadraticCurveTo(r * 1.75, r * 0.45 - sway, r * 1.38, -r * 0.88);
        c.stroke();

        c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(-r * 0.65, -r * 0.95);
        c.quadraticCurveTo(r * 0.15, -r * 1.62 + sway * 0.5, r * 1.25, -r * 1.08);
        c.stroke();

        // Sweeping Long Jet-Black Mugetsu Hair (billowing right & framing shoulders)
        c.fillStyle = "#070709";
        c.strokeStyle = "#18181b";
        c.lineWidth = 2.0;
        c.beginPath();
        c.moveTo(-r * 0.95, -r * 0.28);
        c.quadraticCurveTo(-r * 1.32, r * 0.22, -r * 1.12, r * 0.86);
        c.lineTo(-r * 0.84, r * 0.64);
        c.lineTo(-r * 0.68, r * 0.92);
        c.lineTo(r * 0.48, r * 0.84);
        // Dramatic long wind-swept hair plume to the right
        c.quadraticCurveTo(r * 1.28, r * 1.04 + sway * 0.4, r * 1.74, r * 0.78 + sway * 0.5);
        c.quadraticCurveTo(r * 1.48, r * 0.42, r * 1.66, r * 0.18 - sway * 0.3);
        c.quadraticCurveTo(r * 1.32, -r * 0.05, r * 0.95, -r * 0.32);
        c.closePath();
        c.fill();
        c.stroke();
      } else {
        // Dangai Longer Back/Neck Hair Strands
        c.fillStyle = "#ea580c";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(-r * 0.88, -r * 0.15);
        c.lineTo(-r * 1.12, r * 0.32);
        c.lineTo(-r * 0.78, r * 0.38);
        c.lineTo(r * 0.78, r * 0.38);
        c.lineTo(r * 1.12, r * 0.32);
        c.lineTo(r * 0.88, -r * 0.15);
        c.closePath();
        c.fill();
        c.stroke();
      }

      // Signature BallFight Base Skin Face (eyes, calm brows & smirk are drawn by BF.FACE_DRAWERS.ichigo)
      rt.drawSkinFace(ball, r, c);

      // Outfit: Torn Shihakusho (Dangai) or Dark-Grey Mugetsu Bandages
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      if (isMugetsu) {
        // Cool Steel-Grey Mugetsu Bandage Wrap cleanly below the round eyes
        c.fillStyle = "#8596ab";
        c.fillRect(-r, r * 0.16, r * 2, r);
        c.fillStyle = "#64748b";
        c.fillRect(-r, r * 0.54, r * 2, r * 0.5);

        // Exposed right-shoulder skin peek with black Mugetsu ink markings
        c.fillStyle = "#fed7aa";
        c.beginPath();
        c.moveTo(r * 0.34, r * 0.58);
        c.quadraticCurveTo(r * 0.72, r * 0.52, r, r * 0.74);
        c.lineTo(r, r);
        c.lineTo(r * 0.34, r);
        c.closePath();
        c.fill();
        c.strokeStyle = "#09090b";
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(r * 0.44, r * 0.66);
        c.lineTo(r * 0.88, r * 0.78);
        c.moveTo(r * 0.50, r * 0.82);
        c.lineTo(r * 0.92, r * 0.94);
        c.stroke();

        // Layered diagonal bandage folds
        c.strokeStyle = "#334155";
        c.lineWidth = 1.9;
        for (let bi = 0; bi < 4; bi++) {
          c.beginPath();
          c.moveTo(-r, r * (0.22 + bi * 0.17));
          c.lineTo(r * 0.72, r * (0.31 + bi * 0.17));
          c.stroke();
        }
        // Top bandage edge across nose bridge
        c.strokeStyle = "#1e293b";
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(-r, r * 0.16);
        c.quadraticCurveTo(0, r * 0.10, r, r * 0.16);
        c.stroke();

        // Rising black Mugetsu ink-flame along the left side
        c.fillStyle = "#050507";
        c.beginPath();
        c.moveTo(-r, r * 0.20);
        c.quadraticCurveTo(-r * 0.52, r * 0.48, -r * 0.44, r);
        c.lineTo(-r, r);
        c.closePath();
        c.fill();
      } else {
        // Dangai Torn Dark Shihakusho + White V-Collar + Right-Arm Chain
        c.fillStyle = "#09090b";
        c.fillRect(-r, r * 0.42, r * 2, r * 0.72);
        c.strokeStyle = "#f8fafc";
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-r * 0.4, r * 0.42);
        c.lineTo(0, r * 0.78);
        c.lineTo(r * 0.4, r * 0.42);
        c.stroke();
        c.fillStyle = "#fdba74";
        c.beginPath();
        c.moveTo(-r * 0.34, r * 0.42);
        c.lineTo(0, r * 0.72);
        c.lineTo(r * 0.34, r * 0.42);
        c.closePath();
        c.fill();
        c.strokeStyle = "#52525b";
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(r * 0.32, r * 0.44);
        c.lineTo(r * 0.62, r * 0.62);
        c.lineTo(r * 0.85, r * 0.86);
        c.stroke();
      }
      c.restore();

      // Hair: Sleek Layered Jet-Black Mugetsu Hair vs Longer Spiky Orange Hair (Dangai)
      c.fillStyle = isMugetsu ? "#07070b" : "#ea580c";
      c.strokeStyle = isMugetsu ? "#18181b" : COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      if (isMugetsu) {
        c.moveTo(-r * 1.02, r * 0.24);
        c.lineTo(-r * 1.18, -r * 0.34);
        c.lineTo(-r * 0.88, -r * 0.52);
        c.lineTo(-r * 0.96, -r * 0.92);
        c.lineTo(-r * 0.46, -r * 0.80);
        c.lineTo(-r * 0.10, -r * 1.16);
        c.lineTo(r * 0.22, -r * 0.84);
        c.lineTo(r * 0.60, -r * 1.06);
        c.lineTo(r * 0.86, -r * 0.70);
        c.lineTo(r * 1.18, -r * 0.38);
        c.lineTo(r * 1.02, r * 0.24);
        // Sleek asymmetric bangs framing the eyes
        c.lineTo(r * 0.72, -r * 0.18);
        c.lineTo(r * 0.36, -r * 0.14);
        c.lineTo(r * 0.08, -r * 0.34);
        c.lineTo(-r * 0.04, -r * 0.06);
        c.lineTo(-r * 0.32, -r * 0.26);
        c.lineTo(-r * 0.72, -r * 0.16);
        c.closePath();
        c.fill();
        c.stroke();

        // Subtle dark-slate hair highlight sheen
        c.strokeStyle = "rgba(148, 163, 184, 0.28)";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(-r * 0.45, -r * 0.62);
        c.quadraticCurveTo(0, -r * 0.78, r * 0.45, -r * 0.58);
        c.stroke();
      } else {
        c.moveTo(-r * 0.96, r * 0.02);
        c.lineTo(-r * 1.14, -r * 0.42);
        c.lineTo(-r * 0.84, -r * 0.56);
        c.lineTo(-r * 0.94, -r * 0.96);
        c.lineTo(-r * 0.44, -r * 0.82);
        c.lineTo(-r * 0.14, -r * 1.18);
        c.lineTo(r * 0.18, -r * 0.86);
        c.lineTo(r * 0.54, -r * 1.12);
        c.lineTo(r * 0.80, -r * 0.74);
        c.lineTo(r * 1.14, -r * 0.46);
        c.lineTo(r * 0.96, r * 0.02);
        c.lineTo(r * 0.68, -r * 0.24);
        c.lineTo(r * 0.32, -r * 0.16);
        c.lineTo(r * 0.04, -r * 0.34);
        c.lineTo(-r * 0.20, -r * 0.14);
        c.lineTo(-r * 0.46, -r * 0.28);
        c.lineTo(-r * 0.72, -r * 0.18);
        c.closePath();
        c.fill();
        c.stroke();
      }

      c.restore();
      return;
    }

    const evolved = Boolean(ball.evolved);
    const hollow = ball.ultTimer > 0;
    const vasto = Boolean(ball.vastoLordeMode);
    const innerDemon = Boolean(ball.innerDemonMode);
    const arrancarSkin = hasSkin(ball, "ichigo_arrancar_arc");
    const halfVastoSkin = hasSkin(ball, "ichigo_vasto_half_mask");

    // 1. BLAZING BLACK-CRIMSON REIATSU AURA BEHIND BODY (Bankai Ult, Hollow Mask, Inner Demon & Vasto Lorde)
    if (hollow || vasto || innerDemon) {
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      const pulse = Math.sin(t * 2.5) * 2.5;
      c.fillStyle = vasto ? "rgba(220, 38, 38, 0.32)" : "rgba(185, 28, 28, 0.24)";
      c.beginPath();
      c.arc(0, -r * 0.08, r * (vasto ? 1.48 : 1.38) + pulse, 0, Math.PI * 2);
      c.fill();

      // 14 Jagged Black & Crimson Spiritual Pressure Flames
      const spikes = 14;
      c.fillStyle = "#090205";
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.6;
      c.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i * Math.PI) / spikes - Math.PI * 0.5;
        const upBias = Math.max(0, -Math.sin(a)) * r * (vasto ? 0.32 : 0.22);
        const wob = Math.sin(t * 3.2 + i * 1.1) * 2.4;
        const rad = i % 2 === 0 ? r * 1.28 + upBias + wob : r * 1.04;
        const px = Math.cos(a) * rad;
        const py = Math.sin(a) * rad - upBias * 0.25;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.stroke();

      // Vasto Lorde Wild Flowing Orange Mane behind the skull/head
      if (vasto) {
        c.fillStyle = "#ea580c";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.8;
        c.beginPath();
        if (halfVastoSkin) {
          // Extra-long cascading orange mane for Awakened Long-Hair Half-Vasto skin (Image 3)
          c.moveTo(-r * 0.92, -r * 0.45);
          c.lineTo(-r * 1.56, -r * 0.82);
          c.lineTo(-r * 1.22, -r * 0.28);
          c.lineTo(-r * 1.68, r * 0.18);
          c.lineTo(-r * 1.34, r * 0.34);
          c.lineTo(-r * 1.58, r * 0.86);
          c.lineTo(-r * 0.85, r * 0.65);
          c.lineTo(r * 0.85, r * 0.65);
          c.lineTo(r * 1.58, r * 0.86);
          c.lineTo(r * 1.34, r * 0.34);
          c.lineTo(r * 1.68, r * 0.18);
          c.lineTo(r * 1.22, -r * 0.28);
          c.lineTo(r * 1.56, -r * 0.82);
          c.lineTo(r * 0.92, -r * 0.45);
        } else {
          c.moveTo(-r * 0.85, -r * 0.45);
          c.lineTo(-r * 1.48, -r * 0.85);
          c.lineTo(-r * 1.12, -r * 0.35);
          c.lineTo(-r * 1.56, -r * 0.18);
          c.lineTo(-r * 1.08, r * 0.12);
          c.lineTo(r * 1.08, r * 0.12);
          c.lineTo(r * 1.56, -r * 0.18);
          c.lineTo(r * 1.12, -r * 0.35);
          c.lineTo(r * 1.48, -r * 0.85);
          c.lineTo(r * 0.85, -r * 0.45);
        }
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.restore();

      // Re-fill base body disc cleanly over background aura
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

    // 2A. MYTHIC SKIN: AWAKENED VASTO LORDE (LONG HAIR + SHATTERED HALF-MASK, Image 3)
    if (vasto && halfVastoSkin) {
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Ghostly pale bone-white awakened face
      c.fillStyle = "#f8fafc";
      c.fillRect(-r, -r, r * 2, r * 2);

      // Subtle cheekbone/jaw shadow from manga panel
      c.fillStyle = "#e2e8f0";
      c.beginPath();
      c.moveTo(-r * 0.85, r * 0.34);
      c.quadraticCurveTo(0, r * 0.56, r * 0.85, r * 0.32);
      c.lineTo(r, r);
      c.lineTo(-r, r);
      c.closePath();
      c.fill();

      // Crimson-red furry Vasto Lorde mane collar at bottom edge (Image 3)
      c.fillStyle = "#991b1b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-r, r * 0.62);
      c.lineTo(-r * 0.64, r * 0.48);
      c.lineTo(-r * 0.34, r * 0.66);
      c.lineTo(-r * 0.04, r * 0.5);
      c.lineTo(r * 0.28, r * 0.66);
      c.lineTo(r * 0.6, r * 0.48);
      c.lineTo(r, r * 0.62);
      c.lineTo(r, r);
      c.lineTo(-r, r);
      c.closePath();
      c.fill();
      c.stroke();

      // Exposed Right Eye (side = 1): Fierce narrowed black sclera + glowing pale-gold iris + sharp brow
      c.fillStyle = "#090205";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(r * 0.12, -r * 0.06);
      c.quadraticCurveTo(r * 0.36, -r * 0.19, r * 0.62, -r * 0.09);
      c.quadraticCurveTo(r * 0.38, r * 0.03, r * 0.12, -r * 0.06);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#fde047";
      c.beginPath();
      c.arc(r * 0.36, -r * 0.08, r * 0.065, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(r * 0.36, -r * 0.08, r * 0.024, 0, Math.PI * 2);
      c.fill();

      // Sharp brow line above right eye
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(r * 0.1, -r * 0.16);
      c.lineTo(r * 0.62, -r * 0.24);
      c.stroke();

      // Cold, stoic awakened expression (slight nose shadow + clean parted mouth line, Image 3)
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.9;
      c.beginPath();
      c.moveTo(-r * 0.04, -r * 0.02);
      c.lineTo(-r * 0.09, r * 0.08);
      c.lineTo(0, r * 0.1);
      c.stroke();

      c.fillStyle = "#1e293b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.24, r * 0.27);
      c.quadraticCurveTo(0, r * 0.21, r * 0.24, r * 0.29);
      c.quadraticCurveTo(0, r * 0.31, -r * 0.24, r * 0.27);
      c.closePath();
      c.fill();
      c.stroke();

      // Shattered Left-Temple Vasto Skull Fragment (side = -1) with black stripe & fierce left eye
      c.fillStyle = "#f1f5f9";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.02, -r * 0.86);
      c.lineTo(-r * 0.86, -r * 0.78);
      c.lineTo(-r * 0.88, r * 0.02);
      c.lineTo(-r * 0.56, r * 0.22);
      c.lineTo(-r * 0.38, r * 0.06);
      c.lineTo(-r * 0.12, -r * 0.06);
      c.closePath();
      c.fill();
      c.stroke();

      // Black-crimson vertical Vasto stripe across the left skull fragment
      c.fillStyle = "#090205";
      c.beginPath();
      c.moveTo(-r * 0.26, -r * 0.82);
      c.lineTo(-r * 0.52, -r * 0.78);
      c.lineTo(-r * 0.58, r * 0.12);
      c.lineTo(-r * 0.34, r * 0.04);
      c.closePath();
      c.fill();

      // Left Eye inside the broken Vasto mask socket (aligned with right eye)
      c.fillStyle = "#090205";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.14, -r * 0.06);
      c.quadraticCurveTo(-r * 0.38, -r * 0.19, -r * 0.62, -r * 0.09);
      c.quadraticCurveTo(-r * 0.38, r * 0.03, -r * 0.14, -r * 0.06);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#fde047";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.08, r * 0.065, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.08, r * 0.024, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Sweeping Long Orange Crown Hair & Side Locks framing the top and right temple (Image 3)
      c.save();
      c.fillStyle = "#f97316";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(-r * 0.48, -r * 0.76);
      c.lineTo(-r * 0.82, -r * 1.12);
      c.lineTo(-r * 0.24, -r * 0.92);
      c.lineTo(-r * 0.08, -r * 1.32);
      c.lineTo(r * 0.22, -r * 0.92);
      c.lineTo(r * 0.64, -r * 1.28);
      c.lineTo(r * 0.64, -r * 0.84);
      c.lineTo(r * 1.18, -r * 0.92);
      c.lineTo(r * 0.86, -r * 0.46);
      c.lineTo(r * 1.12, r * 0.16);
      c.lineTo(r * 0.74, -r * 0.22);
      c.lineTo(r * 0.48, -r * 0.56);
      c.lineTo(r * 0.18, -r * 0.32);
      c.lineTo(r * 0.04, -r * 0.64);
      c.lineTo(-r * 0.18, -r * 0.48);
      c.closePath();
      c.fill();
      c.stroke();

      // SINGLE BROKEN LEFT VASTO LORDE HORN jutting out from the left skull fragment (Image 3)
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(-r * 0.44, -r * 0.54);
      c.quadraticCurveTo(-r * 1.12, -r * 0.64, -r * 1.48, -r * 1.08);
      c.lineTo(-r * 1.12, -r * 1.14);
      c.quadraticCurveTo(-r * 0.78, -r * 0.82, -r * 0.28, -r * 0.72);
      c.closePath();
      c.fill();
      c.stroke();

      // Black-crimson band on the single horn
      c.strokeStyle = "#090205";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.68, -r * 0.62);
      c.lineTo(-r * 0.58, -r * 0.82);
      c.moveTo(-r * 0.98, -r * 0.78);
      c.lineTo(-r * 0.88, -r * 0.96);
      c.stroke();

      // Floating crumbling white skull shards around cheek & jaw (Image 3)
      const floatBob = Math.sin(t * 3.2) * 1.8;
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.8;
      const shards = [
        [-r * 0.68, r * 0.24 + floatBob, r * 0.1, r * 0.15],
        [-r * 1.08, r * 0.16 - floatBob, r * 0.09, r * 0.12],
        [r * 0.54, r * 0.22 + floatBob * 0.7, r * 0.08, r * 0.14],
        [r * 1.12, r * 0.32 - floatBob * 0.8, r * 0.12, r * 0.09],
      ];
      for (const [sx, sy, sw, sh] of shards) {
        c.fillRect(sx - sw * 0.5, sy - sh * 0.5, sw, sh);
        c.strokeRect(sx - sw * 0.5, sy - sh * 0.5, sw, sh);
      }
      c.restore();
      return;
    }

    // 2B. DEFAULT VASTO LORDE FULL HOLLOW FORM
    if (vasto) {
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Pale bone-white Hierro torso & dark fur collar
      c.fillStyle = "#f8f6f0";
      c.fillRect(-r, -r, r * 2, r * 2);

      // Shaggy black-crimson fur collar around neck/chest
      c.fillStyle = "#141118";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-r, r * 0.42);
      c.lineTo(-r * 0.52, r * 0.28);
      c.lineTo(-r * 0.24, r * 0.46);
      c.lineTo(0, r * 0.3);
      c.lineTo(r * 0.24, r * 0.46);
      c.lineTo(r * 0.52, r * 0.28);
      c.lineTo(r, r * 0.42);
      c.lineTo(r, r);
      c.lineTo(-r, r);
      c.closePath();
      c.fill();
      c.stroke();

      // Iconic Vasto Lorde Hollow Hole in center chest
      c.fillStyle = "#090205";
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(0, r * 0.72, r * 0.2, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();

      // Vasto Lorde Bone-White Skull Mask
      c.save();
      c.beginPath();
      c.moveTo(0, -r * 0.96);
      c.bezierCurveTo(r * 0.82, -r * 0.94, r * 0.96, -r * 0.32, r * 0.84, r * 0.16);
      c.lineTo(r * 0.54, r * 0.56);
      c.lineTo(0, r * 0.74);
      c.lineTo(-r * 0.54, r * 0.56);
      c.lineTo(-r * 0.84, r * 0.16);
      c.bezierCurveTo(-r * 0.96, -r * 0.32, -r * 0.82, -r * 0.94, 0, -r * 0.96);
      c.closePath();
      c.fillStyle = "#f8f6f0";
      c.fill();

      c.save();
      c.clip();
      // Symmetrical jagged crimson Vasto Lorde mask stripes descending from the horns over the eyes to jaw
      c.fillStyle = "#991b1b";
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r * 0.54, -r * 0.92);
        c.lineTo(side * r * 0.78, -r * 0.78);
        c.lineTo(side * r * 0.48, -r * 0.12);
        c.lineTo(side * r * 0.38, r * 0.62);
        c.lineTo(side * r * 0.22, r * 0.58);
        c.lineTo(side * r * 0.3, -r * 0.14);
        c.closePath();
        c.fill();

        c.beginPath();
        c.moveTo(side * r * 0.22, -r * 0.96);
        c.lineTo(side * r * 0.38, -r * 0.92);
        c.lineTo(side * r * 0.24, -r * 0.26);
        c.lineTo(side * r * 0.12, -r * 0.26);
        c.closePath();
        c.fill();
      }
      c.restore();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      c.stroke();

      // Sunken pitch-black eye sockets + glowing golden Vasto Lorde eyes
      for (const side of [-1, 1]) {
        c.fillStyle = "#090205";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(side * r * 0.12, -r * 0.08);
        c.lineTo(side * r * 0.64, -r * 0.26);
        c.lineTo(side * r * 0.56, r * 0.02);
        c.lineTo(side * r * 0.16, r * 0.06);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "#facc15";
        c.beginPath();
        c.arc(side * r * 0.38, -r * 0.08, r * 0.075, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = COLORS.white;
        c.beginPath();
        c.arc(side * r * 0.38, -r * 0.08, r * 0.03, 0, Math.PI * 2);
        c.fill();
      }

      // Articulated Vasto Lorde skull jaw & teeth
      c.fillStyle = "#141118";
      c.beginPath();
      c.moveTo(-r * 0.48, r * 0.24);
      c.lineTo(r * 0.48, r * 0.24);
      c.lineTo(r * 0.36, r * 0.52);
      c.lineTo(-r * 0.36, r * 0.52);
      c.closePath();
      c.fill();

      c.fillStyle = "#f8f6f0";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.4;
      const vTeeth = 6;
      for (let i = 0; i < vTeeth; i++) {
        const x0 = -r * 0.44 + (i / vTeeth) * (r * 0.88);
        const x1 = -r * 0.44 + ((i + 1) / vTeeth) * (r * 0.88);
        c.strokeRect(x0, r * 0.25, x1 - x0, r * 0.13);
        c.fillRect(x0, r * 0.25, x1 - x0, r * 0.13);
        c.strokeRect(x0, r * 0.38, x1 - x0, r * 0.12);
        c.fillRect(x0, r * 0.38, x1 - x0, r * 0.12);
      }

      // TWO LONG FORWARD-CURVING VASTO LORDE HORNS WITH CRIMSON STRIPES
      for (const side of [-1, 1]) {
        c.fillStyle = "#f8f6f0";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(side * r * 0.42, -r * 0.78);
        c.quadraticCurveTo(side * r * 1.18, -r * 1.24, side * r * 0.62, -r * 1.82);
        c.quadraticCurveTo(side * r * 0.82, -r * 1.16, side * r * 0.72, -r * 0.58);
        c.closePath();
        c.fill();
        c.stroke();

        // Crimson horn bands
        c.strokeStyle = "#991b1b";
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(side * r * 0.52, -r * 0.92);
        c.lineTo(side * r * 0.76, -r * 0.82);
        c.moveTo(side * r * 0.64, -r * 1.22);
        c.lineTo(side * r * 0.82, -r * 1.12);
        c.stroke();
      }

      // Glowing crimson Cero spark pulsing between the two horn tips
      const ceroPulse = 4 + Math.sin(t * 4) * 1.5;
      c.fillStyle = "rgba(239, 68, 68, 0.42)";
      c.beginPath();
      c.arc(0, -r * 1.72, ceroPulse * 2.1, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ef4444";
      c.strokeStyle = COLORS.white;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, -r * 1.72, ceroPulse, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.restore();
      return;
    }

    // 3. SHIKAI / BANKAI / TATTERED ARRANCAR OUTFIT + SPIKY ORANGE HAIR
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = COLORS.skin;
    c.fillRect(-r, -r, r * 2, r * 1.48);

    const isShikaiOutfit = !evolved && !hollow && !innerDemon;
    if (isShikaiOutfit) {
      // Classic Soul Society Shikai Shihakusho: White inner kimono V-collar + red chest strap
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-r * 0.78, r * 0.42);
      c.lineTo(0, r * 0.86);
      c.lineTo(r * 0.78, r * 0.42);
      c.lineTo(r * 0.95, r * 0.68);
      c.lineTo(0, r * 1.04);
      c.lineTo(-r * 0.95, r * 0.68);
      c.closePath();
      c.fill();
      c.stroke();

      // Red-brown Shikai Zangetsu chest strap diagonal
      c.fillStyle = "#b91c1c";
      c.beginPath();
      c.moveTo(-r * 0.68, r * 0.46);
      c.lineTo(-r * 0.42, r * 0.46);
      c.lineTo(r * 0.36, r * 0.98);
      c.lineTo(r * 0.08, r * 0.98);
      c.closePath();
      c.fill();
      c.stroke();
    } else if (evolved && arrancarSkin) {
      // ARRANCAR ARC SKIN: Battle-tattered Ulquiorra-fight outfit (exposed scarred chest + shredded black/red coat scraps)
      c.fillStyle = COLORS.skin;
      c.fillRect(-r, r * 0.38, r * 2, r * 0.65);

      // Battle scuff marks on exposed chest
      c.strokeStyle = "#9a3412";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.22, r * 0.56);
      c.lineTo(-r * 0.04, r * 0.62);
      c.moveTo(r * 0.12, r * 0.68);
      c.lineTo(r * 0.28, r * 0.64);
      c.stroke();

      // Shredded jagged black Bankai coat flaps on left & right shoulders
      c.fillStyle = "#18151f";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r, r * 0.36);
        c.lineTo(side * r * 0.58, r * 0.44);
        c.lineTo(side * r * 0.68, r * 0.66);
        c.lineTo(side * r * 0.38, r * 0.74);
        c.lineTo(side * r * 0.48, r * 0.98);
        c.lineTo(side * r, r);
        c.closePath();
        c.fill();
        c.stroke();

        // Torn crimson lining edge
        c.strokeStyle = "#dc2626";
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(side * r * 0.58, r * 0.44);
        c.lineTo(side * r * 0.68, r * 0.66);
        c.lineTo(side * r * 0.38, r * 0.74);
        c.stroke();
        c.strokeStyle = COLORS.ink;
      }
    } else {
      // Standard Bankai red-lined black coat collar
      c.fillStyle = COLORS.red;
      c.beginPath();
      c.moveTo(-r * 0.75, r * 0.42);
      c.lineTo(0, r * 0.84);
      c.lineTo(r * 0.75, r * 0.42);
      c.lineTo(r * 0.92, r * 0.65);
      c.lineTo(0, r * 1.02);
      c.lineTo(-r * 0.92, r * 0.65);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();

    // Spiky Orange Hair (compact rounded chibi silhouette)
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.fillStyle = COLORS.orange;
    c.beginPath();
    c.moveTo(-r * 0.88, -r * 0.28);
    c.lineTo(-r * 1.12, -r * 0.62);
    c.lineTo(-r * 0.72, -r * 0.78);
    c.lineTo(-r * 0.76, -r * 1.16);
    c.lineTo(-r * 0.32, -r * 0.99);
    c.lineTo(-r * 0.04, -r * 1.24);
    c.lineTo(r * 0.25, -r * 1.00);
    c.lineTo(r * 0.72, -r * 1.16);
    c.lineTo(r * 0.68, -r * 0.80);
    c.lineTo(r * 1.10, -r * 0.58);
    c.lineTo(r * 0.85, -r * 0.28);
    c.lineTo(r * 0.44, -r * 0.44);
    c.lineTo(r * 0.13, -r * 0.32);
    c.lineTo(-r * 0.07, -r * 0.46);
    c.lineTo(-r * 0.40, -r * 0.34);
    c.closePath();
    c.fill();
    c.stroke();

    // 4. STARTER LOW-HP FORM: INNER DEMON TAKEOVER (Image 1 — Creeping Half-Mask, Black-Gold Eyes & Maniacal Grin!)
    if (innerDemon) {
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      // Exposed Left Eye (side = -1): Pitch-black sclera + glowing golden-yellow iris + fierce brow
      c.fillStyle = "#090205";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(-r * 0.58, -r * 0.14);
      c.quadraticCurveTo(-r * 0.36, -r * 0.24, -r * 0.14, -r * 0.05);
      c.quadraticCurveTo(-r * 0.36, r * 0.04, -r * 0.58, -r * 0.14);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.1, r * 0.068, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.1, r * 0.025, 0, Math.PI * 2);
      c.fill();

      // Wide unhinged maniacal Inner Hollow grin stretching across the face (Image 1)
      c.fillStyle = "#18151f";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-r * 0.54, r * 0.16);
      c.quadraticCurveTo(-r * 0.08, r * 0.32, r * 0.46, r * 0.22);
      c.quadraticCurveTo(r * 0.08, r * 0.62, -r * 0.54, r * 0.16);
      c.closePath();
      c.fill();
      c.stroke();

      // Pinkish-red tongue & white teeth strip inside the maniacal grin
      c.fillStyle = "#f43f5e";
      c.beginPath();
      c.ellipse(-r * 0.08, r * 0.38, r * 0.22, r * 0.07, 0.1, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-r * 0.46, r * 0.19);
      c.quadraticCurveTo(-r * 0.12, r * 0.3, r * 0.22, r * 0.26);
      c.lineTo(r * 0.18, r * 0.34);
      c.quadraticCurveTo(-r * 0.12, r * 0.36, -r * 0.42, r * 0.25);
      c.closePath();
      c.fill();
      c.stroke();

      // Creeping Jagged Bone-White Half-Hollow Mask on the Right Side (side = 1) + organic tendrils (Image 1)
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.06, -r * 0.94);
      c.lineTo(r * 0.18, -r * 0.62);
      c.lineTo(r * 0.62, -r * 0.88);
      c.bezierCurveTo(r * 0.92, -r * 0.54, r * 0.92, r * 0.02, r * 0.64, r * 0.34);
      // Row of 5 sharp jagged upper mask teeth hanging over the right side of the grin
      c.lineTo(r * 0.52, r * 0.46);
      c.lineTo(r * 0.44, r * 0.32);
      c.lineTo(r * 0.36, r * 0.48);
      c.lineTo(r * 0.28, r * 0.33);
      c.lineTo(r * 0.2, r * 0.48);
      c.lineTo(r * 0.12, r * 0.33);
      c.lineTo(r * 0.04, r * 0.46);
      // Creeping jagged nose bridge & left-forehead tendrils
      c.lineTo(-r * 0.02, r * 0.16);
      c.lineTo(-r * 0.12, r * 0.02);
      c.lineTo(-r * 0.44, -r * 0.38);
      c.lineTo(-r * 0.14, -r * 0.28);
      c.lineTo(-r * 0.34, -r * 0.68);
      c.lineTo(-r * 0.1, -r * 0.54);
      c.closePath();
      c.fill();

      // 5 Dark-Crimson Fan Stripes across the Right Half-Mask (Image 1)
      c.save();
      c.clip();
      c.fillStyle = "#7f1d1d";
      const rightStripes = [
        [[r * 0.14, -r * 0.24], [r * 0.58, -r * 0.86], [r * 0.72, -r * 0.74], [r * 0.22, -r * 0.18]],
        [[r * 0.22, -r * 0.18], [r * 0.78, -r * 0.64], [r * 0.86, -r * 0.48], [r * 0.3, -r * 0.14]],
        [[r * 0.3, -r * 0.14], [r * 0.88, -r * 0.38], [r * 0.92, -r * 0.22], [r * 0.38, -r * 0.1]],
        [[r * 0.28, r * 0.06], [r * 0.88, -r * 0.04], [r * 0.86, r * 0.08], [r * 0.3, r * 0.12]],
        [[r * 0.32, r * 0.16], [r * 0.84, r * 0.12], [r * 0.78, r * 0.24], [r * 0.34, r * 0.22]],
      ];
      for (const poly of rightStripes) {
        c.beginPath();
        c.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) c.lineTo(poly[i][0], poly[i][1]);
        c.closePath();
        c.fill();
      }
      c.restore();
      c.stroke();

      // Right Eye Socket inside the Half-Mask: Pitch-black socket + glowing golden-yellow eye
      c.fillStyle = "#090205";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(r * 0.14, -r * 0.06);
      c.lineTo(r * 0.62, -r * 0.2);
      c.lineTo(r * 0.54, r * 0.02);
      c.lineTo(r * 0.18, r * 0.04);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(r * 0.38, -r * 0.07, r * 0.068, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(r * 0.38, -r * 0.07, r * 0.024, 0, Math.PI * 2);
      c.fill();

      c.restore();
      return;
    }

    // 5A. EVOLVED HOLLOW MASK ULT WITH ARRANCAR ARC SKIN (Image 2 — Half-Shattered Dark-Crimson Ulquiorra-Fight Mask)
    if (evolved && hollow && arrancarSkin) {
      c.save();
      c.lineJoin = "round";
      c.lineCap = "round";

      // Exposed Upper-Left Eye (side = -1): Black sclera + golden-yellow iris + black smudge underneath (Image 2)
      c.fillStyle = "#090205";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(-r * 0.58, -r * 0.12);
      c.quadraticCurveTo(-r * 0.36, -r * 0.24, -r * 0.14, -r * 0.06);
      c.quadraticCurveTo(-r * 0.36, r * 0.04, -r * 0.58, -r * 0.12);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.09, r * 0.065, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(-r * 0.36, -r * 0.09, r * 0.024, 0, Math.PI * 2);
      c.fill();

      // Black Hollow energy smudge under exposed left eye
      c.fillStyle = "#180408";
      c.beginPath();
      c.moveTo(-r * 0.48, r * 0.02);
      c.lineTo(-r * 0.12, -r * 0.02);
      c.lineTo(-r * 0.18, r * 0.12);
      c.lineTo(-r * 0.52, r * 0.08);
      c.closePath();
      c.fill();

      // Broken Mask Shape: Covers lower-left cheek/jaw AND the entire right half of the face (Image 2)
      c.beginPath();
      c.moveTo(r * 0.08, -r * 0.94);
      c.bezierCurveTo(r * 0.78, -r * 0.9, r * 0.94, -r * 0.32, r * 0.84, r * 0.16);
      c.lineTo(r * 0.56, r * 0.64);
      c.lineTo(0, r * 0.92);
      c.lineTo(-r * 0.52, r * 0.64);
      c.lineTo(-r * 0.66, r * 0.06);
      // Jagged broken edge across the left cheek & center nose bridge
      c.lineTo(-r * 0.36, r * 0.14);
      c.lineTo(-r * 0.18, r * 0.08);
      c.lineTo(-r * 0.06, r * 0.22);
      c.lineTo(0, -r * 0.34);
      c.closePath();
      c.fillStyle = "#f7f4eb";
      c.fill();

      c.save();
      c.clip();

      // Heavy Dark-Burgundy / Black-Crimson Evolved Mask Coating covering the entire right side (Image 2)
      c.fillStyle = "#2b050a";
      c.beginPath();
      c.rect(-r * 0.02, -r, r * 1.1, r * 2);
      c.fill();

      // Thin White Separation Lines across the dark-crimson right forehead & cheek (Image 2)
      c.strokeStyle = "#f7f4eb";
      c.lineWidth = 2.4;
      const whiteLines = [
        [[r * 0.04, r * 0.18], [r * 0.16, -r * 0.2], [r * 0.52, -r * 0.84]],
        [[r * 0.24, -r * 0.24], [r * 0.72, -r * 0.62]],
        [[r * 0.34, -r * 0.2], [r * 0.86, -r * 0.34]],
        [[r * 0.14, -r * 0.14], [r * 0.86, -r * 0.14]],
        [[r * 0.24, r * 0.08], [r * 0.84, r * 0.04]],
        [[r * 0.32, r * 0.18], [r * 0.8, r * 0.18]],
      ];
      for (const pts of whiteLines) {
        c.beginPath();
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.stroke();
      }

      // 3 Vertical Black-Crimson Stripes on the lower-left broken mask cheek (Image 2)
      c.fillStyle = "#2b050a";
      for (const lx of [-0.52, -0.38, -0.24]) {
        c.fillRect(r * lx, r * 0.08, r * 0.07, r * 0.48);
      }
      c.restore();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      c.stroke();

      // Right Eye Socket inside the Dark-Crimson Mask: White contour rim + black socket + golden eye
      c.fillStyle = "#090205";
      c.strokeStyle = "#f7f4eb";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(r * 0.14, -r * 0.08);
      c.lineTo(r * 0.64, -r * 0.18);
      c.lineTo(r * 0.56, r * 0.02);
      c.lineTo(r * 0.18, r * 0.04);
      c.closePath();
      c.fill();
      c.stroke();

      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(r * 0.38, -r * 0.07, r * 0.065, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(r * 0.38, -r * 0.07, r * 0.024, 0, Math.PI * 2);
      c.fill();

      // Full Interlocking Upper & Lower Bone-White Hollow Teeth across the Jaw (Image 2)
      c.fillStyle = "#f7f4eb";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.6;
      const teethCount = 6;
      for (let i = 0; i < teethCount; i++) {
        const t0 = -r * 0.48 + (i / teethCount) * (r * 0.96);
        const t1 = -r * 0.48 + ((i + 1) / teethCount) * (r * 0.96);
        const tm = (t0 + t1) * 0.5;
        c.beginPath();
        c.moveTo(t0, r * 0.24);
        c.lineTo(tm, r * 0.46);
        c.lineTo(t1, r * 0.24);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(t0, r * 0.62);
        c.lineTo(tm, r * 0.42);
        c.lineTo(t1, r * 0.62);
        c.closePath();
        c.fill();
        c.stroke();
      }

      c.restore();
      return;
    }

    // 5B. DEFAULT EVOLVED HOLLOW MASK ULT (Full Visored Hollow Mask)
    if (evolved && hollow) {
      c.save();
      c.beginPath();
      c.moveTo(0, -r * 0.94);
      c.bezierCurveTo(r * 0.78, -r * 0.92, r * 0.94, -r * 0.35, r * 0.84, r * 0.14);
      c.lineTo(r * 0.56, r * 0.64);
      c.lineTo(0, r * 0.92);
      c.lineTo(-r * 0.56, r * 0.64);
      c.lineTo(-r * 0.84, r * 0.14);
      c.bezierCurveTo(-r * 0.94, -r * 0.35, -r * 0.78, -r * 0.92, 0, -r * 0.94);
      c.closePath();

      c.fillStyle = "#f7f4eb";
      c.fill();

      c.save();
      c.clip();

      c.fillStyle = "#660c15";
      const foreheadStripes = [
        [[r * 0.05, -r * 0.98], [r * 0.22, -r * 0.96], [r * 0.18, -r * 0.06], [r * 0.04, -r * 0.02]],
        [[r * 0.28, -r * 0.94], [r * 0.46, -r * 0.88], [r * 0.32, -r * 0.12], [r * 0.18, -r * 0.1]],
        [[r * 0.52, -r * 0.84], [r * 0.7, -r * 0.72], [r * 0.46, -r * 0.16], [r * 0.32, -r * 0.14]],
        [[r * 0.72, -r * 0.62], [r * 0.88, -r * 0.44], [r * 0.58, -r * 0.18], [r * 0.46, -r * 0.16]],
      ];
      for (const poly of foreheadStripes) {
        c.beginPath();
        c.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) c.lineTo(poly[i][0], poly[i][1]);
        c.closePath();
        c.fill();
      }

      c.beginPath();
      c.moveTo(r * 0.38, r * 0.16);
      c.lineTo(r * 0.88, -r * 0.06);
      c.lineTo(r * 0.86, r * 0.12);
      c.lineTo(r * 0.44, r * 0.24);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(r * 0.52, r * 0.3);
      c.lineTo(r * 0.84, r * 0.2);
      c.lineTo(r * 0.78, r * 0.36);
      c.lineTo(r * 0.5, r * 0.4);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(r * 0.06, r * 0.74);
      c.lineTo(r * 0.48, r * 0.6);
      c.lineTo(r * 0.32, r * 0.86);
      c.lineTo(r * 0.04, r * 0.94);
      c.closePath();
      c.fill();

      c.restore();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.stroke();

      c.strokeStyle = "rgba(25, 22, 30, 0.55)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, -r * 0.18);
      c.lineTo(0, r * 0.26);
      c.stroke();

      for (const side of [-1, 1]) {
        c.fillStyle = "#100e16";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(side * r * 0.14, -r * 0.06);
        c.lineTo(side * r * 0.62, -r * 0.22);
        c.lineTo(side * r * 0.54, -r * 0.02);
        c.lineTo(side * r * 0.18, r * 0.04);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "#ffd426";
        c.beginPath();
        c.arc(side * r * 0.38, -r * 0.07, r * 0.065, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(side * r * 0.39, -r * 0.085, r * 0.022, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = "#18151f";
      c.beginPath();
      c.moveTo(-r * 0.56, r * 0.28);
      c.quadraticCurveTo(0, r * 0.38, r * 0.56, r * 0.28);
      c.lineTo(r * 0.44, r * 0.6);
      c.quadraticCurveTo(0, r * 0.72, -r * 0.44, r * 0.6);
      c.closePath();
      c.fill();

      c.fillStyle = "#f7f4eb";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.4;
      const teethCount = 6;
      for (let i = 0; i < teethCount; i++) {
        const t0 = -r * 0.48 + (i / teethCount) * (r * 0.96);
        const t1 = -r * 0.48 + ((i + 1) / teethCount) * (r * 0.96);
        const tm = (t0 + t1) * 0.5;
        c.beginPath();
        c.moveTo(t0, r * 0.3);
        c.lineTo(tm, r * 0.49);
        c.lineTo(t1, r * 0.3);
        c.closePath();
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(t0, r * 0.62);
        c.lineTo(tm, r * 0.44);
        c.lineTo(t1, r * 0.62);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.restore();
    }
  };

  function ensureMugetsuAppLayer() {
    if (typeof document === "undefined") return;
    const appEl = document.querySelector(".app");
    if (appEl && appEl.style.position !== "relative") {
      appEl.style.position = "relative";
      appEl.style.zIndex = "1";
    }
  }

  function hideMugetsuOuterBg() {
    if (typeof document === "undefined") return;
    const bgCanvas = document.getElementById("ichigo-mugetsu-outer-canvas");
    if (bgCanvas) bgCanvas.style.display = "none";
  }

  function syncMugetsuOuterBg(alpha) {
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    const id = "ichigo-mugetsu-outer-canvas";
    let bgCanvas = document.getElementById(id);
    const screenBattle = document.getElementById("screen-battle");
    const battleVisible = !screenBattle || !screenBattle.classList.contains("hidden");
    const shouldShow = alpha > 0.01 && battleVisible;

    if (!shouldShow) {
      if (bgCanvas) bgCanvas.style.display = "none";
      return;
    }

    ensureMugetsuAppLayer();
    if (!bgCanvas) {
      bgCanvas = document.createElement("canvas");
      bgCanvas.id = id;
      bgCanvas.style.cssText =
        "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0;";
      document.body.insertBefore(bgCanvas, document.body.firstChild);
    }

    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 720;
    if (bgCanvas.width !== w) bgCanvas.width = w;
    if (bgCanvas.height !== h) bgCanvas.height = h;
    bgCanvas.style.display = "block";
    bgCanvas._lastDrawTs = performance.now();

    if (!bgCanvas._watchdogActive && typeof requestAnimationFrame === "function") {
      bgCanvas._watchdogActive = true;
      const tickWatchdog = () => {
        const sb = document.getElementById("screen-battle");
        const active = !sb || !sb.classList.contains("hidden");
        const stale = performance.now() - (bgCanvas._lastDrawTs || 0) > 260;
        if (!active || stale) {
          bgCanvas.style.display = "none";
          bgCanvas._watchdogActive = false;
          return;
        }
        requestAnimationFrame(tickWatchdog);
      };
      requestAnimationFrame(tickWatchdog);
    }

    const sc = bgCanvas.getContext("2d");
    if (!sc) return;
    const now = performance.now() * 0.001;

    sc.save();
    sc.clearRect(0, 0, w, h);
    sc.globalAlpha = Math.min(1, alpha);

    // Pitch-Black Mugetsu Void Sky
    const voidSky = sc.createLinearGradient(0, 0, 0, h);
    voidSky.addColorStop(0, "#020104");
    voidSky.addColorStop(0.5, "#090212");
    voidSky.addColorStop(1, "#030106");
    sc.fillStyle = voidSky;
    sc.fillRect(0, 0, w, h);

    // Rising Black-Violet Reiatsu Wisps
    for (let i = 0; i < 16; i++) {
      const wx = ((i * 151 + Math.sin(now * 2 + i) * 35) % (w + 60)) - 30;
      const wy = h - ((i * 93 + now * (48 + (i % 4) * 16)) % (h + 40));
      sc.fillStyle = i % 3 === 0 ? "rgba(168, 85, 247, 0.42)" : "rgba(15, 10, 24, 0.85)";
      sc.beginPath();
      sc.arc(wx, wy, 12 + (i % 3) * 8, 0, Math.PI * 2);
      sc.fill();
    }
    sc.restore();
  }

  function drawMugetsuDarkWorldOverlay(c, game, owner) {
    const ultLeft = owner ? Math.max(0, owner.ultTimer || 0) : 0;
    const alpha = Math.min(1, ultLeft / 0.35);
    syncMugetsuOuterBg(alpha);
    if (alpha <= 0.01) return;

    const now = typeof performance !== "undefined" ? performance.now() * 0.001 : 0;
    c.save();
    c.globalAlpha = alpha;

    // Total Pitch-Black Void across the arena
    c.fillStyle = "rgba(3, 1, 7, 0.94)";
    c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Subtle dark violet horizon glow
    const glow = c.createRadialGradient(
      WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, 20,
      WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, WORLD_SIZE * 0.72
    );
    glow.addColorStop(0, "rgba(88, 28, 135, 0.26)");
    glow.addColorStop(1, "rgba(3, 1, 7, 0)");
    c.fillStyle = glow;
    c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Rising dark-violet reiatsu smoke streaks
    for (let i = 0; i < 14; i++) {
      const rx = ((i * 67 + Math.sin(now * 2.2 + i) * 18) % (WORLD_SIZE - 24)) + 12;
      const ry = WORLD_SIZE - ((i * 49 + now * (42 + (i % 3) * 18)) % (WORLD_SIZE - 12));
      c.fillStyle = i % 2 === 0 ? "rgba(168, 85, 247, 0.3)" : "rgba(24, 24, 27, 0.7)";
      c.beginPath();
      c.arc(rx, ry, 5 + (i % 3) * 3, 0, Math.PI * 2);
      c.fill();
    }

    c.strokeStyle = "#a855f7";
    c.lineWidth = 4;
    c.strokeRect(4, 4, WORLD_SIZE - 8, WORLD_SIZE - 8);
    c.restore();
  }

  function spawnMugetsuFinisherSlash(owner, g) {
    const duration = 1.85;
    rt.setHitStop(duration);

    const target = g.balls.find((b) => b !== owner && b.alive) || null;
    const tx = target ? target.x : WORLD_SIZE * 0.5;
    const ty = target ? target.y : WORLD_SIZE * 0.5;
    const ang = Math.atan2(ty - owner.y, tx - owner.x);
    let struck = false;

    return {
      isFreezeCinematic: true,
      timer: 0,
      duration,
      dead: false,
      update(dt, gg) {
        this.timer += dt;
        const p = Math.min(1, this.timer / this.duration);

        if (p >= 0.48 && !struck) {
          struck = true;
          gg.entities.push(rt.spawnBanner("MUGETSU!!", "#a855f7"));
          gg.entities.push(rt.spawnShockRing(tx, ty, "#09090b", 280, 0.52));
          gg.entities.push(rt.spawnShockRing(tx, ty, "#a855f7", 220, 0.42));
          for (const foe of gg.balls) {
            if (foe === owner || !foe.alive) continue;
            const dealt = gg.applyDamage(foe, 150, { pierce: true });
            foe.flashTimer = 0.35;
            foe.squash = 1.0;
            gg.spawnSparks(foe.x, foe.y, "#09090b", "#a855f7");
            gg.spawnDamageText(foe.x, foe.y - foe.radius - 18, dealt, "#a855f7", true, "MUGETSU!! -150");
          }
          rt.addShake(0.65, 14);
          gg.sound.playCritHit();
        }

        if (this.timer >= this.duration) {
          owner.mugetsuMode = false;
          owner.ultTimer = 0;
          this.dead = true;
        }
      },
      render() {},
      renderOverlay(c) {
        const p = Math.min(1, this.timer / this.duration);
        const fadeOut = p < 0.78 ? 1 : Math.max(0, (1 - p) / 0.22);

        c.save();

        // 1. Freeze Cutscene Pitch-Black Void Dimmer
        const dimAlpha = p < 0.12 ? (p / 0.12) * 0.72 : 0.72 * fadeOut;
        c.fillStyle = `rgba(3, 1, 8, ${dimAlpha.toFixed(3)})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // 2. Auto-Lock Targeting Line & Reticle on Enemy
        if (target && p < 0.78) {
          const lockP = Math.min(1, p / 0.25);
          const lockScale = 1.65 - 0.65 * lockP;
          const lockRot = (1 - lockP) * 0.9 + this.timer * 1.4;
          const rLock = (target.radius + 16) * lockScale;

          c.save();
          c.globalAlpha = (p < 0.48 ? 0.92 : Math.max(0, 1 - (p - 0.48) / 0.3)) * fadeOut;

          // Subtle auto-lock trajectory guide
          c.strokeStyle = "rgba(168, 85, 247, 0.45)";
          c.lineWidth = 2;
          c.setLineDash([8, 8]);
          c.beginPath();
          c.moveTo(owner.x, owner.y);
          c.lineTo(tx, ty);
          c.stroke();
          c.setLineDash([]);

          // Lock-on brackets around target
          c.translate(tx, ty);
          c.rotate(lockRot);
          c.strokeStyle = p >= 0.3 ? "#ef4444" : "#c084fc";
          c.lineWidth = 3;
          for (let q = 0; q < 4; q++) {
            c.rotate(Math.PI * 0.5);
            c.beginPath();
            c.moveTo(rLock - 10, -rLock);
            c.lineTo(rLock, -rLock);
            c.lineTo(rLock, -rLock + 10);
            c.stroke();
          }
          c.restore();
        }

        // 3. Scene: Ichigo Raising Hand High -> Swinging Down the Black Mugetsu Blade
        if (p < 0.72) {
          const raiseP = Math.min(1, p / 0.28);
          const swingP = p < 0.40 ? 0 : Math.min(1, (p - 0.40) / 0.10);
          const upAng = -Math.PI * 0.5;
          // Shortest angular swing from straight up (-PI/2) to target angle
          let diff = ang - upAng;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const armAng = upAng + diff * swingP;

          // Converging black-violet reiatsu pillar behind Ichigo during raise
          if (p < 0.50) {
            const pillarW = (owner.radius * 2.2) * (0.6 + 0.4 * Math.sin(this.timer * 14));
            c.fillStyle = "rgba(168, 85, 247, 0.22)";
            c.fillRect(owner.x - pillarW * 0.65, 0, pillarW * 1.3, owner.y + owner.radius);
            c.fillStyle = "rgba(5, 5, 8, 0.65)";
            c.fillRect(owner.x - pillarW * 0.4, 0, pillarW * 0.8, owner.y + owner.radius);
          }

          c.save();
          c.translate(owner.x, owner.y);
          c.rotate(armAng);

          const armLen = owner.radius * 1.15 * (0.4 + 0.6 * raiseP);
          // Raised bandaged arm
          c.fillStyle = "#475569";
          c.strokeStyle = "#09090b";
          c.lineWidth = 3;
          c.beginPath();
          c.roundRect(owner.radius * 0.35, -6, armLen, 12, 5);
          c.fill();
          c.stroke();

          // Bandage wrap stripes on arm
          c.strokeStyle = "#94a3b8";
          c.lineWidth = 1.6;
          for (let b = 0.25; b <= 0.8; b += 0.25) {
            const bx = owner.radius * 0.35 + armLen * b;
            c.beginPath();
            c.moveTo(bx, -5);
            c.lineTo(bx + 3, 5);
            c.stroke();
          }

          // Towering jet-black Mugetsu blade extending from raised hand
          const bladeLen = (110 + 40 * raiseP) * (p < 0.48 ? 1 : Math.max(0, 1 - (p - 0.48) / 0.24));
          if (bladeLen > 4) {
            const handX = owner.radius * 0.35 + armLen;
            // Violet outer flame aura
            c.fillStyle = "rgba(168, 85, 247, 0.55)";
            c.beginPath();
            c.moveTo(handX - 6, -13);
            c.lineTo(handX + bladeLen + 18, 0);
            c.lineTo(handX - 6, 13);
            c.closePath();
            c.fill();

            // Pure black Mugetsu blade core
            c.fillStyle = "#050507";
            c.strokeStyle = "#e9d5ff";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(handX - 4, -8);
            c.lineTo(handX + bladeLen, 0);
            c.lineTo(handX - 4, 8);
            c.closePath();
            c.fill();
            c.stroke();
          }
          c.restore();
        }

        // 4. Cutscene Text Banner ("FINAL GETSUGA TENSHO" -> "MUGETSU.")
        if (p < 0.55) {
          c.save();
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineJoin = "round";
          const label = p < 0.36 ? "FINAL GETSUGA TENSHO..." : "MUGETSU!!";
          c.font = `900 ${p < 0.36 ? 22 : 34}px 'Fredoka', 'Nunito', sans-serif`;
          c.lineWidth = 7;
          c.strokeStyle = "#030106";
          c.strokeText(label, WORLD_SIZE * 0.5, 58);
          c.fillStyle = p < 0.36 ? "#e9d5ff" : "#a855f7";
          c.fillText(label, WORLD_SIZE * 0.5, 58);
          c.restore();
        }

        // 5. Colossal Auto-Locked Long Slash (Tebasan Panjang) Cutting Across the Entire Arena
        if (p >= 0.45) {
          const slashP = (p - 0.45) / 0.55;
          const slashAlpha = slashP < 0.65 ? 1 : Math.max(0, (1 - slashP) / 0.35);
          const flash = slashP < 0.14 ? (1 - slashP / 0.14) : 0;
          const beamW = slashP < 0.15
            ? 24 + (slashP / 0.15) * 86
            : 110 * slashAlpha + 10;
          const beamLen = WORLD_SIZE * 2.2;

          if (flash > 0) {
            c.fillStyle = `rgba(245, 208, 254, ${(flash * 0.35).toFixed(3)})`;
            c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
          }

          c.save();
          c.translate(owner.x, owner.y);
          c.rotate(ang);
          c.globalAlpha = slashAlpha;

          // Outer violet-crimson sky-splitting aura
          c.fillStyle = "rgba(168, 85, 247, 0.52)";
          c.fillRect(-beamLen * 0.25, -beamW * 0.75, beamLen, beamW * 1.5);

          // Pitch-black void slash body
          c.fillStyle = "#030106";
          c.fillRect(-beamLen * 0.25, -beamW * 0.5, beamLen, beamW);

          // Razor-sharp white-violet core line
          c.strokeStyle = "#fdf4ff";
          c.lineWidth = Math.max(2.5, beamW * 0.11);
          c.beginPath();
          c.moveTo(-beamLen * 0.25, 0);
          c.lineTo(beamLen * 0.75, 0);
          c.stroke();
          c.restore();

          // Direct impact burst ring at locked target coordinates
          if (slashP < 0.55) {
            const ringP = slashP / 0.55;
            const ringR = (target ? target.radius : 28) + ringP * 145;
            c.save();
            c.globalAlpha = (1 - ringP) * 0.9;
            c.strokeStyle = "#c084fc";
            c.lineWidth = 6 * (1 - ringP) + 1.5;
            c.beginPath();
            c.arc(tx, ty, ringR, 0, Math.PI * 2);
            c.stroke();
            c.restore();
          }
        }

        c.restore();
      },
    };
  }

  function triggerMugetsuTransform(ball) {
    if (!ball || !ball.alive) return;
    const duration = 5.5;
    ball.cast = null;
    ball.vastoLordeMode = false;
    ball.mugetsuMode = true;
    ball.ultTimer = duration;
    if (Math.hypot(ball.vx, ball.vy) < 40) {
      const a = Math.random() * Math.PI * 2;
      const spd = ball.baseSpeed || 280;
      ball.vx = Math.cos(a) * spd;
      ball.vy = Math.sin(a) * spd;
    }
    const applyEff = rt.addEffect || (BF._rt && BF._rt.addEffect);
    if (applyEff) {
      applyEff(ball, "haste", duration, { factor: 1.38 });
      applyEff(ball, "shield", duration, { reduction: 0.25 });
    }
    if (ball.skills[0]) ball.skills[0]._cd = 0.15;
    rt.entities.push(rt.spawnShockRing(ball.x, ball.y, "#09090b", 180, 0.48));
    rt.entities.push(rt.spawnShockRing(ball.x, ball.y, "#a855f7", 140, 0.38));
    rt.spawnSparks(ball.x, ball.y, "#09090b", "#a855f7");
    rt.addShake(0.38, 9);

    let trailCd = 0;
    let finisherFired = false;
    rt.entities.push({
      life: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (!ball.alive) {
          ball.mugetsuMode = false;
          this.dead = true;
          return;
        }
        trailCd -= dt;
        if (trailCd <= 0) {
          trailCd = 0.08;
          g.entities.push(spawnShunpoAfterimage(ball.x, ball.y, ball.radius, true));
        }
        if (this.life <= 0.95 && !finisherFired) {
          finisherFired = true;
          this.dead = true;
          g.entities.push(spawnMugetsuFinisherSlash(ball, g));
        }
        if (this.life <= 0) {
          this.dead = true;
        }
      },
      render() {},
    });
  }

  BF.triggerMugetsuTransform = triggerMugetsuTransform;
  BF.drawMugetsuDarkWorldOverlay = drawMugetsuDarkWorldOverlay;
  BF.hideMugetsuOuterBg = hideMugetsuOuterBg;
  BF.spawnZangetsuSlashEffect = spawnZangetsuSlashEffect;
  BF.triggerGranReyCeroExplosion = triggerGranReyCeroExplosion;
})();
