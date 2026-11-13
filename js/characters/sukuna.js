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

        // Scorched outer blast + blazing inferno core
        const grad = c.createRadialGradient(0, 0, rad * 0.1, 0, 0, rad);
        grad.addColorStop(0, "rgba(254, 249, 195, 0.92)");
        grad.addColorStop(0.38, "rgba(249, 115, 22, 0.72)");
        grad.addColorStop(0.75, "rgba(220, 38, 38, 0.42)");
        grad.addColorStop(1, "rgba(127, 29, 29, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, rad, 0, Math.PI * 2);
        c.fill();

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
        if (g.rng() < 0.8) {
          slashes.push({
            x: 35 + g.rng() * (WORLD_SIZE - 70),
            y: 35 + g.rng() * (WORLD_SIZE - 70),
            ang: (g.rng() - 0.5) * Math.PI,
            len: 28 + g.rng() * 48,
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

        c.globalAlpha = 0.64 * fade;
        const bgGrad = c.createRadialGradient(cx, cy, 40, cx, cy, WORLD_SIZE * 0.75);
        bgGrad.addColorStop(0, "#450a0a");
        bgGrad.addColorStop(0.65, "#1f0408");
        bgGrad.addColorStop(1, "#090103");
        c.fillStyle = bgGrad;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Malevolent Shrine silhouette in background center
        c.globalAlpha = 0.52 * fade;
        c.fillStyle = "#110205";
        c.strokeStyle = "#dc2626";
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(cx - 86, cy + 56);
        c.lineTo(cx + 86, cy + 56);
        c.lineTo(cx + 68, cy + 36);
        c.lineTo(cx - 68, cy + 36);
        c.closePath();
        c.fill();
        c.stroke();

        // Shrine pillars & curved roof
        c.fillRect(cx - 42, cy - 16, 12, 54);
        c.fillRect(cx + 30, cy - 16, 12, 54);
        c.beginPath();
        c.moveTo(cx - 95, cy - 20);
        c.quadraticCurveTo(cx, cy - 66, cx + 95, cy - 20);
        c.lineTo(cx + 72, cy - 8);
        c.quadraticCurveTo(cx, cy - 36, cx - 72, cy - 8);
        c.closePath();
        c.fill();
        c.stroke();

        // Ambient arena slash cuts
        c.lineCap = "round";
        for (const s of slashes) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(s.ang);
          c.globalAlpha = (s.life / 0.22) * 0.85 * fade;
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.5;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(-s.len * 0.7, 0);
          c.lineTo(s.len * 0.7, 0);
          c.stroke();
          c.restore();
        }
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
      }

      const mode = ball.shrineNext === "cleave" ? "cleave" : "dismantle";
      ball.shrineNext = mode === "dismantle" ? "cleave" : "dismantle";

      rt.beginCast(ball, {
        kind: "shrine_slash",
        duration: mode === "dismantle" ? 0.16 : 0.34,
        color: mode === "dismantle" ? "#ef4444" : "#dc2626",
        maxR: mode === "dismantle" ? 20 : 24,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const baseAng = Math.atan2(t.y - b.y, t.x - b.x);
          if (mode === "dismantle") {
            // Fires 3 wide-spread razor-sharp flying slash waves forward (4 dmg each)
            const angles = [baseAng - 0.36, baseAng, baseAng + 0.36];
            for (let i = 0; i < angles.length; i++) {
              const ang = angles[i];
              const m = rt.castMuzzle(b, ang, 16);
              gg.entities.push(rt.spawnProjectile({
                owner: b,
                target: t,
                x: m.x,
                y: m.y,
                speed: 680,
                radius: 22,
                damage: 4,
                color: "#ef4444",
                label: "DISMANTLE!",
                shape: "dismantle_slash",
                onImpact(tt, g2) {
                  g2.entities.push(spawnCleaveSlashEffect(tt.x + (g2.rng() - 0.5) * 14, tt.y + (g2.rng() - 0.5) * 14, 34));
                  g2.addEffect(tt, "slow", 0.4, { factor: 0.72 });
                  if (i === 0) g2.chargeUlt(b);
                },
              }));
            }
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
    maxHp: 350,
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

    // Bold black Sukuna cursed markings (forehead, nose, cheeks, chin)
    c.strokeStyle = "#09090b";
    c.lineWidth = 2.6;
    c.lineCap = "round";
    c.beginPath();
    // Forehead double-bar + center curve
    c.moveTo(-r * 0.3, -r * 0.46); c.lineTo(r * 0.3, -r * 0.46);
    c.moveTo(-r * 0.2, -r * 0.34); c.lineTo(r * 0.2, -r * 0.34);
    // Nose bridge bar
    c.moveTo(-r * 0.14, -r * 0.06); c.lineTo(r * 0.14, -r * 0.06);
    // Cheek & temple curved tattoos
    c.moveTo(-r * 0.78, -r * 0.02); c.quadraticCurveTo(-r * 0.62, r * 0.14, -r * 0.44, r * 0.18);
    c.moveTo(r * 0.78, -r * 0.02); c.quadraticCurveTo(r * 0.62, r * 0.14, r * 0.44, r * 0.18);
    c.moveTo(-r * 0.68, r * 0.26); c.lineTo(-r * 0.46, r * 0.32);
    c.moveTo(r * 0.68, r * 0.26); c.lineTo(r * 0.46, r * 0.32);
    c.stroke();

    // 4 fierce crimson eyes + sharp angry eyebrows
    for (const side of [-1, 1]) {
      // Main upper eye (dark sclera + glowing red iris + gold pupil)
      c.fillStyle = "#18181b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(side * r * 0.34, -r * 0.13, r * 0.17, r * 0.1, side * -0.24, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.fillStyle = "#ef4444";
      c.beginPath();
      c.arc(side * r * 0.34, -r * 0.13, r * 0.075, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = "#fef08a";
      c.beginPath();
      c.arc(side * r * 0.34, -r * 0.13, r * 0.026, 0, Math.PI * 2);
      c.fill();

      // Lower cursed eye
      c.fillStyle = "#dc2626";
      c.strokeStyle = "#09090b";
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(side * r * 0.4, r * 0.06, r * 0.11, r * 0.055, side * 0.14, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Sharp furrowed brow
      c.strokeStyle = "#09090b";
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(side * r * 0.54, -r * 0.28);
      c.lineTo(side * r * 0.16, -r * 0.18);
      c.stroke();
    }

    // Menacing fanged grin
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#09090b";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-r * 0.28, r * 0.24);
    c.quadraticCurveTo(0, r * 0.42, r * 0.3, r * 0.21);
    c.quadraticCurveTo(0, r * 0.31, -r * 0.28, r * 0.24);
    c.closePath();
    c.fill();
    c.stroke();

    // Fierce spiky salmon-pink hair with dark undercut
    c.fillStyle = "#18181b";
    c.beginPath();
    c.arc(0, -r * 0.35, r * 0.92, Math.PI * 1.05, Math.PI * 1.95);
    c.fill();

    c.fillStyle = "#fb7185";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.96, -r * 0.2);
    c.lineTo(-r * 1.28, -r * 0.56);
    c.lineTo(-r * 0.86, -r * 0.6);
    c.lineTo(-r * 1.06, -r * 1.1);
    c.lineTo(-r * 0.52, -r * 0.86);
    c.lineTo(-r * 0.26, -r * 1.32);
    c.lineTo(0, -r * 0.9);
    c.lineTo(r * 0.28, -r * 1.32);
    c.lineTo(r * 0.54, -r * 0.86);
    c.lineTo(r * 1.06, -r * 1.08);
    c.lineTo(r * 0.86, -r * 0.58);
    c.lineTo(r * 1.28, -r * 0.54);
    c.lineTo(r * 0.96, -r * 0.2);
    c.quadraticCurveTo(0, -r * 0.64, -r * 0.96, -r * 0.2);
    c.closePath();
    c.fill();
    c.stroke();
  };

  BF.triggerFugaExplosion = triggerFugaExplosion;
  BF.spawnMalevolentShrineDomain = spawnMalevolentShrineDomain;
  BF.spawnCleaveSlashEffect = spawnCleaveSlashEffect;
})();
