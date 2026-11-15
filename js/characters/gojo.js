(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE, easeOut } = BF;
  const rt = BF.rt;

  function spawnLimitlessBlueVortex({ owner, target, x, y, isMax = false }) {
    const dx0 = target.x - x;
    const dy0 = target.y - y;
    const dist0 = Math.hypot(dx0, dy0) || 1;
    const travelSpeed = isMax ? 640 : 540;
    return {
      x,
      y,
      vx: (dx0 / dist0) * travelSpeed,
      vy: (dy0 / dist0) * travelSpeed,
      phase: "travel",
      life: 1.0,
      vortexTimer: isMax ? 0.78 : 0.62,
      tickTimer: 0,
      spin: 0,
      isMax,
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
          const impR = this.isMax ? 145 : 105;
          if (target.alive && Math.hypot(target.x - this.x, target.y - this.y) <= impR) {
            const fin = g.applyDamage(target, this.isMax ? 7 : 2);
            target.flashTimer = 0.14;
            target.squash = 0.85;
            g.spawnSparks(target.x, target.y, "#00b4ff", COLORS.white);
            g.spawnDamageText(target.x, target.y - target.radius - 14, fin, "#00b4ff", true, this.isMax ? "MAX BLUE!" : "LAPSE BLUE!");
            if (!this.ultCharged) {
              this.ultCharged = true;
              g.chargeUlt(owner);
            }
          }
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#8be9ff", impR, 0.35));
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

  function drawUnlimitedVoidBackdrop(c, cx, cy, scale = 1, p = 0, fade = 1) {
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);

    // Infinite cosmos speed streaks / starlight threads radiating from the void
    c.globalAlpha = 0.65 * fade;
    c.lineCap = "round";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + p * 0.8;
      const r0 = 76 + (i % 3) * 14;
      const r1 = 135 + (i % 4) * 28;
      c.strokeStyle = i % 2 === 0 ? "#bae6fd" : "#38bdf8";
      c.lineWidth = i % 3 === 0 ? 3 : 1.8;
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }

    // Cosmic accretion rings
    c.globalAlpha = 0.82 * fade;
    const spin = p * Math.PI * 5;
    for (let i = 0; i < 6; i++) {
      const rr = 64 + i * 16;
      c.strokeStyle = i % 2 === 0 ? "rgba(186, 230, 253, 0.62)" : "rgba(56, 189, 248, 0.42)";
      c.lineWidth = 4.2 - i * 0.4;
      c.beginPath();
      c.arc(0, 0, rr, spin + i * 0.9, spin + i * 0.9 + Math.PI * 1.45);
      c.stroke();
    }

    // Solid layered corona rings around the Singularity (1.2 style)
    c.globalAlpha = 0.22 * fade;
    c.fillStyle = "#38bdf8";
    c.beginPath();
    c.arc(0, 0, 102, 0, Math.PI * 2);
    c.fill();

    c.globalAlpha = 0.36 * fade;
    c.fillStyle = "#7dd3fc";
    c.beginPath();
    c.arc(0, 0, 78, 0, Math.PI * 2);
    c.fill();

    c.globalAlpha = 0.72 * fade;
    c.fillStyle = "#e0f2fe";
    c.beginPath();
    c.arc(0, 0, 58, 0, Math.PI * 2);
    c.fill();

    // Tilted relativistic photon ring
    c.globalAlpha = 0.9 * fade;
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3.2;
    c.beginPath();
    c.ellipse(0, 0, 96, 26, -0.24 + Math.sin(p * 6) * 0.05, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(0, 0, 108, 32, -0.24 + Math.sin(p * 6) * 0.05, 0, Math.PI * 2);
    c.stroke();

    // Central Pitch-Black Singularity Sphere
    c.globalAlpha = 0.98 * fade;
    c.fillStyle = "#000000";
    c.strokeStyle = "#ffffff";
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(0, 0, 48, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Black ink splatters tearing off the event horizon
    c.fillStyle = "#000000";
    const inkSplatters = [
      [-56, -12, 13], [-70, 6, 10], [-44, 18, 9],
      [54, 14, 15], [70, -4, 11], [42, -22, 8],
    ];
    for (const [ox, oy, sr] of inkSplatters) {
      c.beginPath();
      c.arc(ox, oy, sr, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  }

  BF.drawUnlimitedVoidBackdrop = drawUnlimitedVoidBackdrop;

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

        c.globalAlpha = 0.76 * fade;
        c.fillStyle = "#02060f";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        drawUnlimitedVoidBackdrop(c, cx, cy, 1.08, p, fade);

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

  BF.spawnUnlimitedVoidDomain = spawnUnlimitedVoidDomain;

  function spawnBlackFlashBurst(x, y) {
    return {
      x,
      y,
      life: 0.36,
      maxLife: 0.36,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        const rad = 22 + (1 - k) * 68;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = k;
        c.fillStyle = "rgba(9, 9, 11, 0.72)";
        c.beginPath(); c.arc(0, 0, rad * 0.55, 0, Math.PI * 2); c.fill();
        c.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const a = i * (Math.PI / 3) + (1 - k) * 0.4;
          const r1 = rad * 0.45;
          const r2 = rad * 1.12;
          c.strokeStyle = "#09090b";
          c.lineWidth = 6 * k + 1.5;
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(Math.cos(a + 0.18) * r1, Math.sin(a + 0.18) * r1);
          c.lineTo(Math.cos(a - 0.12) * r2, Math.sin(a - 0.12) * r2);
          c.stroke();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 2.4 * k + 0.8;
          c.stroke();
        }
        c.restore();
      },
    };
  }

  function triggerUnlimitedHollowPurple(owner, g) {
    const cx = WORLD_SIZE * 0.5;
    const cy = WORLD_SIZE * 0.5;
    g.entities.push(spawnHollowPurpleBurst(cx, cy, 340));
    g.entities.push(rt.spawnShockRing(cx, cy, "#e9d5ff", 340, 0.72));
    g.entities.push(rt.spawnShockRing(cx, cy, "#9333ea", 270, 0.56));
    g.entities.push(rt.spawnBanner("UNLIMITED HOLLOW PURPLE!", "#c084fc"));
    g.sound.playCritHit();
    rt.addShake(0.65, 15);
    for (const tt of g.balls) {
      if (!tt.alive) continue;
      if (tt === owner) {
        // Gojo takes minimal self-scratch like Shinjuku manga!
        if (tt.hp > 18) g.applyDamage(tt, 6);
        continue;
      }
      const dmg = Math.round(36 + g.rng() * 8);
      const dealt = g.applyDamage(tt, dmg, { pierce: true });
      tt.flashTimer = 0.25;
      tt.squash = 1.1;
      const kAng = Math.atan2(tt.y - cy, tt.x - cx);
      tt.vx = Math.cos(kAng) * 760;
      tt.vy = Math.sin(kAng) * 760;
      g.spawnSparks(tt.x, tt.y, "#c084fc", COLORS.white);
      g.spawnDamageText(tt.x, tt.y - tt.radius - 16, dealt, "#e9d5ff", true, "UNLIMITED PURPLE!");
    }
  }

  function spawnShinjukuPurpleCinematic(owner, g) {
    const duration = 1.65;
    g.hitStop = duration;
    g.sound.playTimeStop();
    rt.addShake(0.55, 11);
    return {
      isFreezeCinematic: true,
      timer: 0,
      duration,
      dead: false,
      update(dt, gg) {
        this.timer += dt;
        if (this.timer >= this.duration) {
          this.dead = true;
          triggerUnlimitedHollowPurple(owner, gg);
        }
      },
      render() {},
      renderOverlay(c) {
        const p = Math.min(1, this.timer / this.duration);
        const cx = WORLD_SIZE * 0.5;
        const cy = WORLD_SIZE * 0.5;
        c.save();

        // Dark cosmic backdrop
        c.fillStyle = `rgba(10, 6, 24, ${(0.84 * (p > 0.88 ? (1 - p) / 0.12 : 1)).toFixed(3)})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Phase 1 (0..0.68): Blue & Red spiraling inward to collide!
        if (p < 0.68) {
          const sp = p / 0.68;
          const orbitR = (1 - sp * 0.92) * 145;
          const ang = sp * Math.PI * 3.2;
          const bx = cx + Math.cos(ang) * orbitR;
          const by = cy + Math.sin(ang) * orbitR;
          const rx = cx - Math.cos(ang) * orbitR;
          const ry = cy - Math.sin(ang) * orbitR;

          // Blue orb
          c.fillStyle = "rgba(0, 180, 255, 0.35)";
          c.beginPath(); c.arc(bx, by, 38, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#38bdf8";
          c.beginPath(); c.arc(bx, by, 20, 0, Math.PI * 2); c.fill();

          // Red orb
          c.fillStyle = "rgba(255, 30, 66, 0.35)";
          c.beginPath(); c.arc(rx, ry, 38, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#ff1e42";
          c.beginPath(); c.arc(rx, ry, 20, 0, Math.PI * 2); c.fill();
        } else {
          // Phase 2 (0.68..1.0): Hollow Purple Singularity flash
          const fp = (p - 0.68) / 0.32;
          const rSing = 32 + fp * 175;
          c.fillStyle = `rgba(147, 51, 234, ${(0.55 * (1 - fp * 0.35)).toFixed(3)})`;
          c.beginPath(); c.arc(cx, cy, rSing, 0, Math.PI * 2); c.fill();
          c.fillStyle = `rgba(243, 232, 255, ${(0.92 * (1 - fp * 0.4)).toFixed(3)})`;
          c.beginPath(); c.arc(cx, cy, rSing * 0.45, 0, Math.PI * 2); c.fill();
        }

        // Chant text
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineJoin = "round";
        c.font = "bold 24px 'Fredoka', 'Nunito', sans-serif";
        c.lineWidth = 7;
        c.strokeStyle = "#09090b";
        const chant = p < 0.34 ? "NINE ROPES... POLARIZED LIGHT..." : p < 0.68 ? "CROW AND DECLARATION..." : "UNLIMITED HOLLOW PURPLE!";
        c.strokeText(chant, cx, WORLD_SIZE - 56);
        c.fillStyle = p < 0.68 ? "#e0f2fe" : "#e9d5ff";
        c.fillText(chant, cx, WORLD_SIZE - 56);
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
        if (ball.domainClashTimer > 0) return true;
      }

      const mode = ball.limitlessNext === "blue" ? "blue" : "red";
      ball.limitlessNext = mode === "red" ? "blue" : "red";
      const isEvo = Boolean(ball.evolved);
      rt.beginCast(ball, {
        kind: "orb",
        duration: isEvo ? 0.34 : 0.42,
        color: mode === "red" ? "#ff1e42" : "#00b4ff",
        maxR: mode === "red" ? (isEvo ? 24 : 21) : (isEvo ? 28 : 23),
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
              speed: isEvo ? 680 : 570,
              radius: isEvo ? 20 : 17,
              damage: Math.round((isEvo ? 14 : 13) + gg.rng() * 3),
              color: "#ff1e42",
              label: isEvo ? "REVERSAL RED!" : "REVERSAL RED!",
              shape: "limitless_red",
              onImpact(tt, gg2, proj) {
                const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                tt.vx = Math.cos(kAng) * 640;
                tt.vy = Math.sin(kAng) * 640;
                tt.squash = 0.95;
                gg2.entities.push(rt.spawnShockRing(proj.x, proj.y, "#ff1e42", 125, 0.4));
                gg2.spawnSparks(proj.x, proj.y, "#ff1e42", COLORS.white);
                if (isEvo && b.alive && tt.alive) {
                  // Shinjuku Instant Warp + Black Flash Punch!
                  const pad = (BF.CONSTANTS && BF.CONSTANTS.ARENA_PAD) || 26;
                  const wx = Math.max(pad + b.radius, Math.min(WORLD_SIZE - pad - b.radius, tt.x - Math.cos(kAng) * (tt.radius + b.radius + 8)));
                  const wy = Math.max(pad + b.radius, Math.min(WORLD_SIZE - pad - b.radius, tt.y - Math.sin(kAng) * (tt.radius + b.radius + 8)));
                  b.x = wx;
                  b.y = wy;
                  const bfDmg = gg2.applyDamage(tt, Math.round(11 + gg2.rng() * 3));
                  tt.vx = Math.cos(kAng) * 760;
                  tt.vy = Math.sin(kAng) * 760;
                  gg2.entities.push(spawnBlackFlashBurst(tt.x, tt.y));
                  gg2.spawnDamageText(tt.x, tt.y - tt.radius - 18, bfDmg, "#ef4444", true, "BLACK FLASH!");
                  rt.setHitStop(0.14);
                  rt.addShake(0.35, 11);
                }
                gg2.chargeUlt(b);
                rt.addShake(0.25, 7);
                gg2.sound.playCritHit();
              },
            }));
          } else {
            gg.entities.push(spawnLimitlessBlueVortex({ owner: b, target: t, x: m.x, y: m.y, isMax: isEvo }));
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
    maxHp: 565,
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
    const isShinjuku = Boolean(ball.evolved || ball.previewShinjuku);
    const awakened = ball.ultTimer > 0 || isShinjuku;
    if (awakened) {
      c.save();
      const spin = performance.now() * 0.003;
      c.fillStyle = isShinjuku ? "rgba(56, 189, 248, 0.22)" : "rgba(96, 225, 255, 0.18)";
      c.beginPath();
      c.arc(0, 0, r * 1.52, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = isShinjuku ? "rgba(125, 211, 252, 0.62)" : "rgba(125, 211, 252, 0.45)";
      c.lineWidth = 2.5;
      c.stroke();

      c.strokeStyle = isShinjuku && ball.ultTimer > 0 ? "rgba(192, 132, 252, 0.72)" : "rgba(184, 77, 255, 0.5)";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, 0, r * 1.44, r * 0.6, spin, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = isShinjuku ? "rgba(255, 30, 66, 0.46)" : "rgba(56, 232, 255, 0.5)";
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
    if (isShinjuku) {
      // Shinjuku Showdown: Toji-style black compression shirt + white sash/pants
      c.fillStyle = "#11131d";
      c.fillRect(-r, r * 0.34, r * 2, r * 0.36);
      c.fillStyle = "#e2e8f0";
      c.fillRect(-r, r * 0.68, r * 2, r * 0.38);
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-r, r * 0.34);
      c.lineTo(r, r * 0.34);
      c.moveTo(-r, r * 0.68);
      c.lineTo(r, r * 0.68);
      c.stroke();
    } else {
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
    }

    if (!awakened) {
      c.fillStyle = "#0e0f17";
      c.fillRect(-r, -r * 0.34, r * 2, r * 0.42);
      c.strokeStyle = "#2b2f45";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-r * 0.8, -r * 0.24);
      c.lineTo(r * 0.8, -r * 0.16);
      c.stroke();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.14, r * 0.23);
      c.quadraticCurveTo(r * 0.04, r * 0.30, r * 0.20, r * 0.17);
      c.stroke();
    }
    c.restore();

    c.fillStyle = "#f4f7ff";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-r * 0.90, -r * 0.26);
    c.lineTo(-r * 1.08, -r * 0.58);
    c.lineTo(-r * 0.72, -r * 0.78);
    c.lineTo(-r * 0.78, -r * 1.16);
    c.lineTo(-r * 0.31, -r * 0.99);
    c.lineTo(0, -r * 1.24);
    c.lineTo(r * 0.31, -r * 0.99);
    c.lineTo(r * 0.78, -r * 1.16);
    c.lineTo(r * 0.72, -r * 0.78);
    c.lineTo(r * 1.08, -r * 0.58);
    c.lineTo(r * 0.90, -r * 0.26);
    c.lineTo(r * 0.50, -r * 0.38);
    c.lineTo(r * 0.16, -r * 0.24);
    c.lineTo(-r * 0.11, -r * 0.40);
    c.lineTo(-r * 0.50, -r * 0.28);
    c.closePath();
    c.fill();
    c.stroke();
  };

  BF.triggerHollowPurpleExplosion = triggerHollowPurpleExplosion;
  BF.spawnUnlimitedVoidDomain = spawnUnlimitedVoidDomain;
  BF.spawnShinjukuPurpleCinematic = spawnShinjukuPurpleCinematic;
  BF.triggerUnlimitedHollowPurple = triggerUnlimitedHollowPurple;
})();

