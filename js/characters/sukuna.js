(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE, easeOut } = BF;
  const rt = BF.rt;

  function spawnCleaveSlashEffect(x, y, radius = 48) {
    return {
      x,
      y,
      life: 0.34,
      maxLife: 0.34,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - p);
        const len = radius * (0.75 + 0.65 * easeOut(p));
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;
        c.lineCap = "round";
        for (const [ang, scale] of [[Math.PI * 0.25, 1], [-Math.PI * 0.25, 1], [0.08, 0.72]]) {
          c.save();
          c.rotate(ang);
          const l = len * scale;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 11 * (1 - p * 0.5);
          c.beginPath();
          c.moveTo(-l, 0);
          c.lineTo(l, 0);
          c.stroke();

          c.strokeStyle = "#dc2626";
          c.lineWidth = 5.5 * (1 - p * 0.5);
          c.beginPath();
          c.moveTo(-l * 0.92, 0);
          c.lineTo(l * 0.92, 0);
          c.stroke();

          c.strokeStyle = "#fef2f2";
          c.lineWidth = 2.2;
          c.beginPath();
          c.moveTo(-l * 0.68, 0);
          c.lineTo(l * 0.68, 0);
          c.stroke();
          c.restore();
        }
        c.restore();
      },
    };
  }

  function spawnFugaExplosionBurst(x, y, maxR = 225) {
    return {
      x,
      y,
      life: 0.85,
      maxLife: 0.85,
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

        // Scorched blast: solid layered rings from dark red outer to white-hot core
        c.fillStyle = "rgba(127, 29, 29, 0.38)";
        c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(220, 38, 38, 0.5)";
        c.beginPath(); c.arc(0, 0, rad * 0.8, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(249, 115, 22, 0.72)";
        c.beginPath(); c.arc(0, 0, rad * 0.56, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(254, 249, 195, 0.95)";
        c.beginPath(); c.arc(0, 0, rad * 0.3, 0, Math.PI * 2); c.fill();

        // Swirling flame tongues
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + p * 2.2;
          c.save();
          c.rotate(a);
          c.fillStyle = i % 2 === 0 ? "#fb923c" : "#fef08a";
          c.beginPath();
          c.moveTo(rad * 0.3, -10 * (1 - p));
          c.lineTo(rad * 1.08, 0);
          c.lineTo(rad * 0.3, 10 * (1 - p));
          c.closePath();
          c.fill();
          c.restore();
        }

        c.strokeStyle = "#f97316";
        c.lineWidth = 10 * (1 - p) + 2;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.stroke();

        c.strokeStyle = "#fef08a";
        c.lineWidth = 5 * (1 - p) + 1.5;
        c.beginPath();
        c.arc(0, 0, rad * 0.68, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  function triggerFugaExplosion(gx, gy, owner, g, directHitTarget = null) {
    const cx = Math.max(36, Math.min(WORLD_SIZE - 36, gx));
    const cy = Math.max(36, Math.min(WORLD_SIZE - 36, gy));
    const aoeR = 225;
    g.entities.push(spawnFugaExplosionBurst(cx, cy, aoeR));
    g.entities.push(rt.spawnShockRing(cx, cy, "#f97316", aoeR * 0.95, 0.5));
    g.entities.push(rt.spawnShockRing(cx, cy, "#fef08a", aoeR * 0.62, 0.36));
    g.entities.push(rt.spawnShockRing(cx, cy, "#dc2626", aoeR * 1.1, 0.56));
    g.spawnSparks(cx, cy, "#f97316", "#fef08a");
    g.spawnSparks(cx, cy, "#dc2626", "#ffffff");
    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        if (tt !== directHitTarget) {
          const splashDmg = g.applyDamage(tt, Math.round(16 + g.rng() * 5));
          g.spawnDamageText(tt.x, tt.y - tt.radius - 14, splashDmg, "#fb923c", true, "DIVINE FLAME!");
        }
        const kAng = Math.atan2(tt.y - cy, tt.x - cx);
        tt.vx = Math.cos(kAng) * 630;
        tt.vy = Math.sin(kAng) * 630;
        tt.flashTimer = 0.18;
        tt.squash = 1.0;
        g.addEffect(tt, "stun", 0.55);
      }
    }
    rt.setHitStop(0.12);
    rt.addShake(0.52, 13);
    g.sound.playCritHit();
  }

  function drawMalevolentShrineBackdrop(c, cx, cy, scale = 1, p = 0, fade = 1) {
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);

    // Concentric blood-red shock rings radiating from the shrine
    c.globalAlpha = 0.55 * fade;
    c.strokeStyle = "#7f1d1d";
    c.lineWidth = 8;
    for (let i = 1; i <= 4; i++) {
      c.beginPath();
      c.arc(0, 0, 58 * i + Math.sin(p * 18 + i) * 5, 0, Math.PI * 2);
      c.stroke();
    }

    // Giant ominous blood moon / cursed halo behind the shrine
    c.globalAlpha = 0.78 * fade;
    c.fillStyle = "#450a0a";
    c.beginPath();
    c.arc(0, -18, 92, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#7f1d1d";
    c.beginPath();
    c.arc(0, -18, 72, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#ef4444";
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, -18, 92, 0, Math.PI * 2);
    c.stroke();

    // Rising dark crimson cursed energy pillars in background
    c.globalAlpha = 0.45 * fade;
    c.fillStyle = "#991b1b";
    for (const px of [-105, -68, 68, 105]) {
      const h = 110 + Math.sin(p * 24 + px) * 18;
      c.fillRect(px - 6, 65 - h, 12, h);
    }

    c.globalAlpha = 0.94 * fade;
    c.lineJoin = "round";
    c.lineCap = "round";

    // Tiered stone altar base steps
    c.fillStyle = "#180407";
    c.strokeStyle = "#dc2626";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-112, 74);
    c.lineTo(112, 74);
    c.lineTo(96, 52);
    c.lineTo(-96, 52);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#26070c";
    c.beginPath();
    c.moveTo(-88, 52);
    c.lineTo(88, 52);
    c.lineTo(76, 36);
    c.lineTo(-76, 36);
    c.closePath();
    c.fill();
    c.stroke();

    // Horned cursed skulls mound along the shrine base
    for (const [sx, sy, sr] of [[-78, 62, 11], [-38, 64, 12], [0, 65, 13], [38, 64, 12], [78, 62, 11]]) {
      // Curved bull/demon horns on skull
      c.strokeStyle = "#d6d3d1";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(sx - sr * 0.6, sy - sr * 0.4);
      c.quadraticCurveTo(sx - sr * 1.5, sy - sr * 1.3, sx - sr * 1.1, sy - sr * 1.8);
      c.moveTo(sx + sr * 0.6, sy - sr * 0.4);
      c.quadraticCurveTo(sx + sr * 1.5, sy - sr * 1.3, sx + sr * 1.1, sy - sr * 1.8);
      c.stroke();

      c.fillStyle = "#e7e5e4";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Glowing red eye sockets
      c.fillStyle = "#dc2626";
      c.beginPath();
      c.arc(sx - sr * 0.36, sy - 1, 2.6, 0, Math.PI * 2);
      c.arc(sx + sr * 0.36, sy - 1, 2.6, 0, Math.PI * 2);
      c.fill();
    }

    // Dark interior shrine chamber (gaping demonic mouth)
    c.fillStyle = "#080103";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.fillRect(-58, -22, 116, 58);
    c.strokeRect(-58, -22, 116, 58);

    // Demonic fangs inside the shrine chamber lintel & floor
    c.fillStyle = "#fef2f2";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    for (let x = -44; x <= 44; x += 14) {
      // Upper fangs
      c.beginPath();
      c.moveTo(x - 5, -20);
      c.lineTo(x, -7);
      c.lineTo(x + 5, -20);
      c.closePath();
      c.fill();
      c.stroke();
      // Lower fangs
      c.beginPath();
      c.moveTo(x - 5, 36);
      c.lineTo(x, 24);
      c.lineTo(x + 5, 36);
      c.closePath();
      c.fill();
      c.stroke();
    }

    // Glowing inner shrine eyes
    c.fillStyle = "#ef4444";
    c.beginPath();
    c.ellipse(-18, 4, 8, 3.5, 0.18, 0, Math.PI * 2);
    c.ellipse(18, 4, 8, 3.5, -0.18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fef08a";
    c.beginPath();
    c.arc(-18, 4, 2.2, 0, Math.PI * 2);
    c.arc(18, 4, 2.2, 0, Math.PI * 2);
    c.fill();

    // 4 Crimson-black wooden shrine pillars
    for (const px of [-64, -38, 26, 52]) {
      c.fillStyle = "#450a0a";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.fillRect(px, -24, 12, 60);
      c.strokeRect(px, -24, 12, 60);
      c.fillStyle = "#dc2626";
      c.fillRect(px + 2, -20, 8, 6);
      c.fillRect(px + 2, 26, 8, 6);
    }

    // Lower curved pagoda eave
    c.fillStyle = "#160307";
    c.strokeStyle = "#dc2626";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-118, -22);
    c.quadraticCurveTo(-60, -18, 0, -34);
    c.quadraticCurveTo(60, -18, 118, -22);
    c.lineTo(94, -10);
    c.quadraticCurveTo(0, -24, -94, -10);
    c.closePath();
    c.fill();
    c.stroke();

    // Upper shrine tier wall
    c.fillStyle = "#280509";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.fillRect(-46, -54, 92, 26);
    c.strokeRect(-46, -54, 92, 26);

    // Main sweeping upturned roof with demon horn tips
    c.fillStyle = "#110205";
    c.strokeStyle = "#ef4444";
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-132, -52);
    c.quadraticCurveTo(-68, -42, 0, -86);
    c.quadraticCurveTo(68, -42, 132, -52);
    c.lineTo(104, -34);
    c.quadraticCurveTo(0, -62, -104, -34);
    c.closePath();
    c.fill();
    c.stroke();

    // Giant curved demon horns crowning the roof peak
    c.fillStyle = "#fca5a5";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    for (const dir of [-1, 1]) {
      c.beginPath();
      c.moveTo(dir * 6, -78);
      c.quadraticCurveTo(dir * 34, -84, dir * 48, -112);
      c.quadraticCurveTo(dir * 24, -74, dir * 14, -68);
      c.closePath();
      c.fill();
      c.stroke();
    }

    c.restore();
  }

  BF.drawMalevolentShrineBackdrop = drawMalevolentShrineBackdrop;

  function spawnMalevolentShrineDomain({ owner, duration = 6.0 }) {
    const slashes = [];
    return {
      isDomain: true,
      domainOwner: owner,
      domainType: "malevolent_shrine",
      domainName: "MALEVOLENT SHRINE",
      domainColor: "#dc2626",
      life: duration,
      maxLife: duration,
      tickTimer: 0.25,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !owner.alive) {
          this.dead = true;
          return;
        }
        if (g.rng() < 0.85) {
          slashes.push({
            x: 35 + g.rng() * (WORLD_SIZE - 70),
            y: 35 + g.rng() * (WORLD_SIZE - 70),
            ang: (g.rng() - 0.5) * Math.PI,
            len: 32 + g.rng() * 54,
            life: 0.22,
          });
        }
        for (let i = slashes.length - 1; i >= 0; i--) {
          slashes[i].life -= dt;
          if (slashes[i].life <= 0) slashes.splice(i, 1);
        }

        this.tickTimer -= dt;
        if (this.tickTimer <= 0) {
          this.tickTimer = 0.52;
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            const dealt = g.applyDamage(tt, 4);
            tt.flashTimer = 0.07;
            tt.squash = 0.45;
            g.entities.push(spawnCleaveSlashEffect(tt.x + (g.rng() - 0.5) * 16, tt.y + (g.rng() - 0.5) * 16, 36));
            g.spawnSparks(tt.x, tt.y, "#dc2626", COLORS.white);
            g.spawnDamageText(tt.x, tt.y - tt.radius - 10, dealt, "#ef4444", false, "SHRINE!");
            g.sound.playBallHit();
          }
        }
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const fade = p < 0.06 ? p / 0.06 : p > 0.9 ? (1 - p) / 0.1 : 1;
        const cx = WORLD_SIZE * 0.5;
        const cy = WORLD_SIZE * 0.5;
        c.save();

        c.globalAlpha = 0.72 * fade;
        c.fillStyle = "#160205";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        drawMalevolentShrineBackdrop(c, cx, cy + 8, 1.15, p, fade);

        // Ambient arena slash cuts
        c.lineCap = "round";
        for (const s of slashes) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(s.ang);
          c.globalAlpha = (s.life / 0.22) * 0.9 * fade;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.5;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(-s.len * 0.75, 0);
          c.lineTo(s.len * 0.75, 0);
          c.stroke();
          c.restore();
        }
        c.restore();
      },
    };
  }

  BF.spawnMalevolentShrineDomain = spawnMalevolentShrineDomain;

  function spawnDismantleMuzzleFlash(x, y, ang, tilt = 0) {
    return {
      x,
      y,
      ang: ang + tilt,
      life: 0.14,
      maxLife: 0.14,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const R = 24 + p * 12;
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.ang);
        c.globalAlpha = Math.max(0, 1 - p);
        c.lineCap = "round";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 7 * (1 - p * 0.4);
        c.beginPath();
        c.arc(-R * 0.25, 0, R, -Math.PI * 0.42, Math.PI * 0.42);
        c.stroke();
        c.strokeStyle = "#ef4444";
        c.lineWidth = 4 * (1 - p * 0.4);
        c.beginPath();
        c.arc(-R * 0.25, 0, R, -Math.PI * 0.42, Math.PI * 0.42);
        c.stroke();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(-R * 0.22, 0, R * 0.94, -Math.PI * 0.3, Math.PI * 0.3);
        c.stroke();
        c.restore();
      },
    };
  }

  const SKILL_SHRINE_ALTERNATE = {
    name: "Cleave / Dismantle",
    cooldown: 2.4,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      if (ball.ultTimer > 0 && !ball.domainUsedInUlt) {
        ball.domainUsedInUlt = true;
        rt.triggerDomainExpansion(ball, {
          type: "malevolent_shrine",
          name: "MALEVOLENT SHRINE",
          color: "#dc2626",
          duration: 6.0,
          createDomain: () => spawnMalevolentShrineDomain({ owner: ball, duration: 6.0 }),
          onStart(gg) {
            gg.entities.push(rt.spawnBanner("DOMAIN: MALEVOLENT SHRINE!", "#ef4444"));
            gg.spawnDamageText(ball.x, ball.y - ball.radius - 18, 0, "#ef4444", true, "MALEVOLENT SHRINE!");
            gg.sound.playTimeStop();
            rt.addShake(0.38, 9);
          },
        }, g);
        if (ball.domainClashTimer > 0) return true;
      }

      const mode = ball.shrineNext === "cleave" ? "cleave" : "dismantle";
      ball.shrineNext = mode === "dismantle" ? "cleave" : "dismantle";

      rt.beginCast(ball, {
        kind: "shrine_slash",
        duration: mode === "dismantle" ? 0.14 : 0.34,
        color: mode === "dismantle" ? "#ef4444" : "#dc2626",
        maxR: mode === "dismantle" ? 20 : 24,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const baseAng = Math.atan2(t.y - b.y, t.x - b.x);
          if (mode === "dismantle") {
            // Fires 3 sequential straight-flying curved crescent slashes one by one (4 dmg each)
            const tilts = [-0.08, 0.08, 0];
            let ultCharged = false;
            const launchSlash = (idx, gNow) => {
              if (!b.alive || b.domainClashTimer > 0) return;
              const liveTarget = gNow.balls.find((x) => x !== b && x.alive);
              if (!liveTarget) return;
              const aimAng = Math.atan2(liveTarget.y - b.y, liveTarget.x - b.x);
              const m = rt.castMuzzle(b, aimAng, 16);
              gNow.entities.push(spawnDismantleMuzzleFlash(m.x, m.y, aimAng, tilts[idx]));
              if (idx > 0 && gNow.sound && gNow.sound.playSkill) {
                gNow.sound.playSkill("dismantle");
              }
              gNow.entities.push(rt.spawnProjectile({
                owner: b,
                target: liveTarget,
                x: m.x,
                y: m.y,
                speed: 720,
                radius: 23,
                damage: 4,
                color: "#ef4444",
                label: "DISMANTLE!",
                shape: "dismantle_slash",
                slashTilt: tilts[idx],
                onImpact(tt, g2) {
                  g2.entities.push(spawnCleaveSlashEffect(tt.x + (g2.rng() - 0.5) * 14, tt.y + (g2.rng() - 0.5) * 14, 36));
                  g2.addEffect(tt, "slow", 0.4, { factor: 0.72 });
                  if (!ultCharged) {
                    ultCharged = true;
                    g2.chargeUlt(b);
                  }
                },
              }));
            };
            launchSlash(0, gg);
            gg.entities.push(rt.spawnDelayedAction(0.13, (gNow) => launchSlash(1, gNow)));
            gg.entities.push(rt.spawnDelayedAction(0.26, (gNow) => launchSlash(2, gNow)));
            gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#ef4444", false, "DISMANTLE x3!");
          } else {
            // Cleave: high-speed slash dash toward enemy; deals 15 dmg + slash VFX on hit!
            const dashSpeed = b.baseSpeed * 2.85;
            b.vx = Math.cos(baseAng) * dashSpeed;
            b.vy = Math.sin(baseAng) * dashSpeed;
            b.cleaveDashTimer = 0.42;
            b.cleaveDashHit = false;
            gg.entities.push(rt.spawnShockRing(b.x, b.y, "#dc2626", 85, 0.28));
            gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#dc2626", false, "CLEAVE DASH!");
          }
        },
      });
      return true;
    },
  };

  BF.CHARACTER_ROSTER.sukuna = {
    id: "sukuna",
    name: "KING OF CURSES",
    shortName: "SUKUNA",
    title: "Ryomen Sukuna • Shrine & Divine Flame",
    role: "SORCERER • CLEAVE, DISMANTLE & FUGA",
    color: "#dc2626",
    radius: 28,
    speed: 370,
    maxHp: 580,
    damage: [10, 15],
    mass: 1.05,
    costume: "sukuna",
    weapon: "none",
    ult: "fuga",
    ultName: "DIVINE FLAME: OPEN (FUGA)",
    ultDesc: "Fires blazing Divine Flame Fire Arrow & enters King of Curses Aura! First skill in Aura opens Malevolent Shrine (triggers Domain Clash vs Gojo!).",
    skillName: "CLEAVE / DISMANTLE",
    skillDesc: "Alternates 3x Dismantle flying slash waves (4 DMG each) and Cleave high-speed slash dash (15 DMG on hit).",
    skills: [SKILL_SHRINE_ALTERNATE],
  };

  BF.TRANSFORM_DETAILS.sukuna = {
    label: "🔥 KING OF CURSES",
    speedMult: 1.15,
    radiusMult: 1.0,
    powerText: "26-32 FUGA + SHRINE",
    hpNote: "1ST SKILL = MALEVOLENT SHRINE",
    ultSkillName: "MALEVOLENT SHRINE + CLEAVE / DISMANTLE",
    ultSkillCd: "CD: 2.4S",
    ultSkillDesc: "Speed +15%! First skill opens Malevolent Shrine (6s arena slashes, triggers Domain Clash vs Gojo's Aura/Domain!).",
  };

  BF.COSTUME_DRAWERS.sukuna = (ball, r, c) => {
    rt.drawSkinFace(ball, r, c);

    // Shredded white/charcoal Jujutsu haori + crimson obi sash
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "#f1f5f9";
    c.beginPath();
    c.moveTo(-r, r * 0.46);
    c.lineTo(0, r * 0.82);
    c.lineTo(r, r * 0.46);
    c.lineTo(r, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#18181b";
    c.beginPath();
    c.moveTo(-r * 0.96, r * 0.48);
    c.lineTo(-r * 0.22, r * 0.84);
    c.lineTo(-r * 0.05, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(r * 0.96, r * 0.48);
    c.lineTo(r * 0.22, r * 0.84);
    c.lineTo(r * 0.05, r * 1.1);
    c.lineTo(r, r * 1.1);
    c.closePath();
    c.fill();

    // Crimson inner sash
    c.fillStyle = "#dc2626";
    c.fillRect(-r * 0.35, r * 0.78, r * 0.7, r * 0.35);
    c.restore();

    // Bold black Sukuna cursed markings (forehead, nose, outer cheeks)
    c.strokeStyle = "#09090b";
    c.lineWidth = 2.5;
    c.lineCap = "round";
    c.beginPath();
    // Forehead double-bar above brows
    c.moveTo(-r * 0.28, -r * 0.5); c.lineTo(r * 0.28, -r * 0.5);
    c.moveTo(-r * 0.18, -r * 0.4); c.lineTo(r * 0.18, -r * 0.4);
    // Nose bridge bar
    c.moveTo(-r * 0.1, -r * 0.03); c.lineTo(r * 0.1, -r * 0.03);
    // Outer cheek twin stripes (framing the face cleanly without touching the 4 eyes or mouth)
    c.moveTo(-r * 0.84, r * 0.14); c.lineTo(-r * 0.58, r * 0.2);
    c.moveTo(r * 0.84, r * 0.14); c.lineTo(r * 0.58, r * 0.2);
    c.moveTo(-r * 0.78, r * 0.26); c.lineTo(-r * 0.54, r * 0.31);
    c.moveTo(r * 0.78, r * 0.26); c.lineTo(r * 0.54, r * 0.31);
    c.stroke();

    // Eyes and mouth are drawn by BF.FACE_DRAWERS.sukuna (js/faces.js)
    // King of Curses aura: crimson cursed energy flames & extra collar tattoos while Ult is active
    if (ball.ultTimer > 0) {
      c.strokeStyle = "#dc2626";
      c.lineWidth = 3;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.arc(0, 0, r * 1.12, side > 0 ? -0.45 : Math.PI - 0.55, side > 0 ? 0.55 : Math.PI + 0.45);
        c.stroke();
      }
    }

    // Fierce spiky salmon-pink hair with dark undercut (raised hairline so forehead tattoos show clearly)
    c.fillStyle = "#18181b";
    c.beginPath();
    c.arc(0, -r * 0.42, r * 0.88, Math.PI * 1.08, Math.PI * 1.92);
    c.fill();

    c.fillStyle = "#fb7185";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.94, -r * 0.3);
    c.lineTo(-r * 1.24, -r * 0.62);
    c.lineTo(-r * 0.84, -r * 0.66);
    c.lineTo(-r * 1.04, -r * 1.12);
    c.lineTo(-r * 0.5, -r * 0.88);
    c.lineTo(-r * 0.24, -r * 1.32);
    c.lineTo(0, -r * 0.92);
    c.lineTo(r * 0.26, -r * 1.32);
    c.lineTo(r * 0.52, -r * 0.88);
    c.lineTo(r * 1.04, -r * 1.1);
    c.lineTo(r * 0.84, -r * 0.64);
    c.lineTo(r * 1.24, -r * 0.6);
    c.lineTo(r * 0.94, -r * 0.3);
    c.quadraticCurveTo(0, -r * 0.72, -r * 0.94, -r * 0.3);
    c.closePath();
    c.fill();
    c.stroke();
  };

  BF.triggerFugaExplosion = triggerFugaExplosion;
  BF.spawnMalevolentShrineDomain = spawnMalevolentShrineDomain;
  BF.spawnCleaveSlashEffect = spawnCleaveSlashEffect;
})();
