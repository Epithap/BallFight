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

  function triggerFugaExplosion(gx, gy, owner, g, directHitTarget = null, aoeR = 225) {
    const cx = Math.max(36, Math.min(WORLD_SIZE - 36, gx));
    const cy = Math.max(36, Math.min(WORLD_SIZE - 36, gy));
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

  function spawnWaterDamageZone(owner, cx, cy) {
    const x = Math.max(46, Math.min(WORLD_SIZE - 46, cx));
    const y = Math.max(46, Math.min(WORLD_SIZE - 46, cy));
    const rad = 92;
    return {
      x,
      y,
      life: 3.2,
      maxLife: 3.2,
      tickCd: 0.25,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.tickCd -= dt;
        if (this.tickCd <= 0) {
          this.tickCd = 0.55;
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - this.x, tt.y - this.y) <= rad + tt.radius) {
              const dmg = g.applyDamage(tt, 4);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 10, dmg, "#38bdf8", false, "FLOOD!");
              g.addEffect(tt, "slow", 0.5, { factor: 0.72 });
            }
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.min(1, this.life * 1.4) * 0.85;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;
        // Deep Ten Shadows flood pool
        const wg = c.createRadialGradient(0, 0, rad * 0.15, 0, 0, rad);
        wg.addColorStop(0, "rgba(14, 165, 233, 0.42)");
        wg.addColorStop(0.7, "rgba(2, 132, 199, 0.28)");
        wg.addColorStop(1, "rgba(15, 23, 42, 0.12)");
        c.fillStyle = wg;
        c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill();
        // Expanding water ripple rings
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 3.2;
        c.beginPath(); c.arc(0, 0, rad * (0.9 + Math.sin(p * 18) * 0.05), 0, Math.PI * 2); c.stroke();
        c.strokeStyle = "#bae6fd";
        c.lineWidth = 2.2;
        c.beginPath(); c.arc(0, 0, rad * 0.64, p * 9, p * 9 + Math.PI * 1.35); c.stroke();
        c.beginPath(); c.arc(0, 0, rad * 0.36, -p * 11, -p * 11 + Math.PI * 1.15); c.stroke();
        // Splash droplets
        c.fillStyle = "#e0f2fe";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + p * 4;
          const dr = rad * (0.45 + 0.35 * ((i % 2) + 0.4));
          c.beginPath(); c.arc(Math.cos(a) * dr, Math.sin(a) * dr, 3, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      },
    };
  }

  function spawnMaxElephantDrop(owner, tx, ty) {
    const cx = Math.max(46, Math.min(WORLD_SIZE - 46, tx));
    const cy = Math.max(46, Math.min(WORLD_SIZE - 46, ty));
    return {
      x: cx,
      y: cy,
      life: 0.42,
      maxLife: 0.42,
      slammed: false,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 && !this.slammed) {
          this.slammed = true;
          this.dead = true;
          g.entities.push(rt.spawnShockRing(cx, cy, "#38bdf8", 118, 0.38));
          g.entities.push(rt.spawnShockRing(cx, cy, "#1e293b", 82, 0.28));
          g.spawnSparks(cx, cy, "#38bdf8", "#0f172a");
          rt.addShake(0.32, 9);
          g.sound.playCritHit();
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - cx, tt.y - cy) <= 95 + tt.radius) {
              const dealt = g.applyDamage(tt, 14);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 14, dealt, "#38bdf8", true, "MAX ELEPHANT!");
              const kAng = Math.atan2(tt.y - cy, tt.x - cx);
              tt.vx = Math.cos(kAng) * 420;
              tt.vy = Math.sin(kAng) * 420;
              tt.flashTimer = 0.16;
              g.addEffect(tt, "stun", 0.4);
            }
          }
          g.entities.push(spawnWaterDamageZone(owner, cx, cy));
        }
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const dropY = -135 * (1 - p * p);
        c.save();
        c.translate(cx, cy);
        // Expanding dark Ten Shadows target ring on ground
        c.fillStyle = "rgba(15, 23, 42, 0.42)";
        c.beginPath(); c.ellipse(0, 0, 50 * (0.45 + 0.55 * p), 24 * (0.45 + 0.55 * p), 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "#38bdf8";
        c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(0, 0, 50 * (0.45 + 0.55 * p), 24 * (0.45 + 0.55 * p), 0, 0, Math.PI * 2); c.stroke();

        // Dropping Official JJK Pink/Red/Gold Max Elephant
        c.translate(0, dropY);
        // Shadow aura behind elephant
        c.fillStyle = "rgba(15, 23, 42, 0.36)";
        c.beginPath(); c.arc(0, -4, 48, 0, Math.PI * 2); c.fill();
        // Huge pink ears with crimson-red outer rims
        for (const side of [-1, 1]) {
          c.fillStyle = "#b91c1c";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(side * 40, -6, 19, 26, side * 0.25, 0, Math.PI * 2);
          c.fill(); c.stroke();
          c.fillStyle = "#fbcfe8";
          c.beginPath();
          c.ellipse(side * 35, -6, 14, 21, side * 0.25, 0, Math.PI * 2);
          c.fill();
        }
        // Main heavy pink body/head
        c.fillStyle = "#f9a8d4";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.2;
        c.beginPath(); c.roundRect(-34, -34, 68, 56, 20); c.fill(); c.stroke();
        // Gold ceremonial crown & forehead Ten Shadows crest
        c.fillStyle = "#ca8a04";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 1.8;
        c.beginPath(); c.ellipse(0, -25, 16, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.strokeStyle = "#ca8a04";
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(-10, -14); c.lineTo(10, -14);
        c.moveTo(0, -18); c.lineTo(0, -6);
        c.moveTo(-8, -6); c.lineTo(8, -6);
        c.stroke();
        // Fierce dark eyes
        c.fillStyle = "#09090b";
        c.beginPath(); c.arc(-14, -8, 3.6, 0, Math.PI * 2); c.arc(14, -8, 3.6, 0, Math.PI * 2); c.fill();
        // Curved sharp ivory tusks
        c.fillStyle = "#fefce8";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.4;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(side * 14, 8);
          c.quadraticCurveTo(side * 30, 16, side * 26, 30);
          c.quadraticCurveTo(side * 16, 22, side * 10, 16);
          c.closePath();
          c.fill(); c.stroke();
        }
        // Pink trunk with gold band spraying water mist
        c.fillStyle = "#f472b6";
        c.beginPath(); c.roundRect(-9, 2, 18, 30, 8); c.fill(); c.stroke();
        c.fillStyle = "#ca8a04";
        c.fillRect(-8, 18, 16, 4);
        c.fillStyle = "rgba(125, 211, 252, 0.88)";
        c.beginPath(); c.arc(0, 35, 7, 0, Math.PI * 2); c.fill();
        c.restore();
      },
    };
  }

  function spawnDivineDogShikigami(owner, target, x, y) {
    const ang = Math.atan2(target.y - y, target.x - x);
    const speed = 780;
    return {
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ang,
      radius: 22,
      life: 1.2,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30 || this.life <= 0) {
          this.dead = true;
          return;
        }
        if (target && target.alive && Math.hypot(target.x - this.x, target.y - this.y) <= target.radius + this.radius) {
          this.dead = true;
          const adaptBonus = (owner.mahoragaAdaptStacks || 0) >= 5 ? 8 : 0;
          const dealt = g.applyDamage(target, 10 + adaptBonus);
          target.flashTimer = 0.16;
          g.spawnSparks(this.x, this.y, "#0f172a", "#ef4444");
          g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#ef4444", true, "DOG BITE! STUN!");
          // Divine Dog bites & stuns the enemy in place before Max Elephant slams down!
          g.addEffect(target, "stun", 0.75);
          g.chargeUlt(owner);
          g.sound.playCritHit();
          g.entities.push(spawnMaxElephantDrop(owner, target.x, target.y));
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.ang);
        // Huge bushy black Totality tail
        c.fillStyle = "#18181b";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.4;
        c.beginPath();
        c.moveTo(-12, -8); c.lineTo(-42, -16); c.lineTo(-32, -3); c.lineTo(-44, 4); c.lineTo(-30, 8); c.lineTo(-40, 16); c.lineTo(-12, 8);
        c.closePath();
        c.fill(); c.stroke();
        // White clawed Totality forearms
        for (const side of [-1, 1]) {
          c.fillStyle = "#f1f5f9";
          c.beginPath(); c.roundRect(-2, side * 12, 16, side * 8, 4); c.fill(); c.stroke();
        }
        // Shaggy black wolf mane & pointed ears
        c.fillStyle = "#18181b";
        c.beginPath();
        c.moveTo(28, 0);
        c.lineTo(10, -12);
        c.lineTo(-4, -22);
        c.lineTo(-6, -13);
        c.lineTo(-22, -16);
        c.lineTo(-14, 0);
        c.lineTo(-22, 16);
        c.lineTo(-6, 13);
        c.lineTo(-4, 22);
        c.lineTo(10, 12);
        c.closePath();
        c.fill(); c.stroke();
        // White wolf jaw/ruff + yellow eyes + red Ten Shadows forehead seal
        c.fillStyle = "#f8fafc";
        c.beginPath();
        c.moveTo(27, 0); c.lineTo(8, -7); c.lineTo(2, 0); c.lineTo(8, 7);
        c.closePath();
        c.fill();
        c.fillStyle = "#eab308";
        c.beginPath(); c.arc(12, -4.5, 2.6, 0, Math.PI * 2); c.arc(12, 4.5, 2.6, 0, Math.PI * 2); c.fill();
        // Red forehead dot-seal
        c.fillStyle = "#dc2626";
        c.beginPath(); c.arc(3, 0, 2.2, 0, Math.PI * 2); c.arc(0, -3, 1.4, 0, Math.PI * 2); c.arc(0, 3, 1.4, 0, Math.PI * 2); c.fill();
        c.restore();
      },
    };
  }

  function spawnMaxNueFlyover(owner, startX, startY, ang) {
    const speed = 520;
    const distMax = 440;
    const halfCorridor = 72;
    return {
      x: startX,
      y: startY,
      startX,
      startY,
      ang,
      traveled: 0,
      boltCd: 0.04,
      bolts: [],
      dead: false,
      update(dt, g) {
        const step = speed * dt;
        this.x += Math.cos(this.ang) * step;
        this.y += Math.sin(this.ang) * step;
        this.traveled += step;
        this.boltCd -= dt;

        // Drop lightning along wide corridor under Max Nue
        if (this.boltCd <= 0) {
          this.boltCd = 0.14;
          const perp = this.ang + Math.PI * 0.5;
          const off = (g.rng() - 0.5) * halfCorridor * 1.4;
          const bx = Math.max(30, Math.min(WORLD_SIZE - 30, this.x + Math.cos(perp) * off));
          const by = Math.max(30, Math.min(WORLD_SIZE - 30, this.y + Math.sin(perp) * off));
          g.entities.push(rt.spawnShockRing(bx, by, "#a855f7", 54, 0.24));
          g.entities.push(rt.spawnShockRing(bx, by, "#facc15", 32, 0.18));
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - this.x, tt.y - this.y) <= halfCorridor + tt.radius) {
              const dealt = g.applyDamage(tt, 5);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 10, dealt, "#facc15", false, "NUE BOLT!");
              g.addEffect(tt, "stun", 0.22);
            }
          }
        }

        // End of flight (or hit arena boundary): Max Nue dives down & explodes!
        const outOfBounds = this.x < 46 || this.x > WORLD_SIZE - 46 || this.y < 46 || this.y > WORLD_SIZE - 46;
        if (this.traveled >= distMax || outOfBounds) {
          this.dead = true;
          const ex = Math.max(46, Math.min(WORLD_SIZE - 46, this.x));
          const ey = Math.max(46, Math.min(WORLD_SIZE - 46, this.y));
          g.entities.push(rt.spawnShockRing(ex, ey, "#a855f7", 135, 0.44));
          g.entities.push(rt.spawnShockRing(ex, ey, "#facc15", 95, 0.34));
          g.spawnSparks(ex, ey, "#a855f7", "#facc15");
          rt.addShake(0.36, 10);
          g.sound.playCritHit();
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - ex, tt.y - ey) <= 122 + tt.radius) {
              const dealt = g.applyDamage(tt, 14);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 16, dealt, "#c084fc", true, "MAX NUE CRASH!");
              const kAng = Math.atan2(tt.y - ey, tt.x - ex);
              tt.vx = Math.cos(kAng) * 480;
              tt.vy = Math.sin(kAng) * 480;
              tt.flashTimer = 0.18;
              g.addEffect(tt, "stun", 0.5);
            }
          }
        }
      },
      render(c) {
        const now = performance.now();
        const wingFlap = Math.sin(now * 0.028) * 14;
        c.save();
        // Wide purple storm corridor indicator
        c.save();
        c.translate(this.startX, this.startY);
        c.rotate(this.ang);
        c.fillStyle = "rgba(168, 85, 247, 0.14)";
        c.fillRect(0, -halfCorridor, distMax, halfCorridor * 2);
        c.strokeStyle = "rgba(192, 132, 252, 0.45)";
        c.lineWidth = 2;
        c.strokeRect(0, -halfCorridor, distMax, halfCorridor * 2);
        c.restore();

        // Giant Shinjuku Max Nue: Massive Feathered Wings + Coiled Snake Tail + Skull Face
        c.translate(this.x, this.y);
        c.rotate(this.ang);
        // Coiled ringed snake tail trailing behind
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 10;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(-14, 0);
        c.bezierCurveTo(-34, -18, -46, 20, -64, 4);
        c.stroke();
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 6;
        c.stroke();

        // Massive grey-slate feathered wingspan
        c.fillStyle = "#94a3b8";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.2;
        c.beginPath();
        c.moveTo(28, 0);
        c.lineTo(8, -50 - wingFlap * 0.5);
        c.lineTo(-10, -90 - wingFlap);
        c.lineTo(-26, -68 - wingFlap * 0.6);
        c.lineTo(-18, -44);
        c.lineTo(-32, -26);
        c.lineTo(-20, 0);
        c.lineTo(-32, 26);
        c.lineTo(-18, 44);
        c.lineTo(-26, 68 + wingFlap * 0.6);
        c.lineTo(-10, 90 + wingFlap);
        c.lineTo(8, 50 + wingFlap * 0.5);
        c.closePath();
        c.fill(); c.stroke();

        // Darker outer wingtip feathers + electric violet/gold veins
        c.strokeStyle = "#334155";
        c.lineWidth = 2.4;
        for (const wy of [-68, -44, -24, 24, 44, 68]) {
          c.beginPath(); c.moveTo(2, wy * 0.45); c.lineTo(-18, wy + (wy < 0 ? -wingFlap * 0.5 : wingFlap * 0.5)); c.stroke();
        }
        c.strokeStyle = "#facc15";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(6, -14); c.lineTo(-8, -48); c.lineTo(-12, -78);
        c.moveTo(6, 14); c.lineTo(-8, 48); c.lineTo(-12, 78);
        c.stroke();

        // Tucked clawed bird legs
        c.fillStyle = "#cbd5e1";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        for (const side of [-1, 1]) {
          c.beginPath(); c.roundRect(-2, side * 12, 12, side * 6, 3); c.fill(); c.stroke();
        }

        // Human-like Owl Skull Mask + Wild Hair Tuft + Wide Eyes + Clenched Teeth
        c.fillStyle = "#e2e8f0";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.8;
        c.beginPath(); c.ellipse(15, 0, 15, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        // Nose cavity
        c.fillStyle = "#09090b";
        c.beginPath(); c.moveTo(19, 0); c.lineTo(14, -3); c.lineTo(14, 3); c.closePath(); c.fill();
        // Wide round eyes
        c.fillStyle = "#f8fafc";
        c.beginPath(); c.arc(17, -6.5, 4.5, 0, Math.PI * 2); c.arc(17, 6.5, 4.5, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = "#09090b";
        c.beginPath(); c.arc(18, -6.5, 2, 0, Math.PI * 2); c.arc(18, 6.5, 2, 0, Math.PI * 2); c.fill();
        // Clenched toothy grin
        c.fillStyle = "#ffffff";
        c.fillRect(6, -5, 5, 10);
        c.strokeRect(6, -5, 5, 10);
        c.restore();
      },
    };
  }

  function spawnKamutokeStrike(x, y, owner, g) {
    g.entities.push(rt.spawnShockRing(x, y, "#facc15", 115, 0.36));
    g.entities.push(rt.spawnShockRing(x, y, "#fef08a", 72, 0.24));
    g.spawnSparks(x, y, "#facc15", "#ffffff");
    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      if (Math.hypot(tt.x - x, tt.y - y) <= 105 + tt.radius) {
        const dealt = g.applyDamage(tt, 12);
        g.spawnDamageText(tt.x, tt.y - tt.radius - 14, dealt, "#facc15", true, "KAMUTOKE!");
        tt.flashTimer = 0.16;
        g.addEffect(tt, "stun", 0.6);
      }
    }
    g.sound.playCritHit();
  }

  const SKILL_SHRINE_ALTERNATE = {
    name: "Cleave / Dismantle",
    cooldown: 2.4,
    onDamaged(ball, amount, g) {
      if (!ball.evolved || ball.heianEraMode || !ball.alive || amount <= 0) return;
      const cur = ball.mahoragaAdaptStacks || 0;
      if (cur < 5) {
        ball.mahoragaAdaptStacks = cur + 1;
        ball.mahoragaWheelSpin = (ball.mahoragaWheelSpin || 0) + Math.PI / 4;
        g.entities.push(rt.spawnShockRing(ball.x, ball.y - ball.radius * 0.9, "#facc15", 52, 0.28));
        g.spawnDamageText(
          ball.x,
          ball.y - ball.radius - 16,
          0,
          "#facc15",
          false,
          ball.mahoragaAdaptStacks >= 5 ? "ADAPTED (5/5)!" : `ADAPT (${ball.mahoragaAdaptStacks}/5)`
        );
      } else {
        ball.mahoragaWheelSpin = (ball.mahoragaWheelSpin || 0) + Math.PI / 4;
      }
      g.addEffect(ball, "haste", 2.0, { factor: 1 + ball.mahoragaAdaptStacks * 0.04 });
    },
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      this.cooldown = ball.heianEraMode ? 1.7 : ball.evolved ? 2.1 : 2.4;

      if (ball.ultTimer > 0 && !ball.domainUsedInUlt && !(ball.evolved && !ball.heianEraMode)) {
        ball.domainUsedInUlt = true;
        const domDur = ball.heianEraMode ? 7.0 : ball.evolved ? 6.5 : 6.0;
        rt.triggerDomainExpansion(ball, {
          type: "malevolent_shrine",
          name: "MALEVOLENT SHRINE",
          color: "#dc2626",
          duration: domDur,
          createDomain: () => spawnMalevolentShrineDomain({ owner: ball, duration: domDur }),
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
        color: ball.heianEraMode ? "#dc2626" : ball.evolved ? "#a855f7" : mode === "dismantle" ? "#ef4444" : "#dc2626",
        maxR: mode === "dismantle" ? 22 : 26,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const baseAng = Math.atan2(t.y - b.y, t.x - b.x);
          if (mode === "dismantle") {
            // Heian Era: World-Cutting Dismantle (pierces Infinity & Shields!) + flanking slashes
            if (b.heianEraMode) {
              const m = rt.castMuzzle(b, baseAng, 18);
              gg.entities.push(spawnDismantleMuzzleFlash(m.x, m.y, baseAng, 0));
              gg.entities.push(rt.spawnProjectile({
                owner: b,
                target: t,
                x: m.x,
                y: m.y,
                speed: 880,
                radius: 34,
                damage: 24,
                color: "#fef2f2",
                label: "WORLD-CUTTING SLASH!",
                shape: "dismantle_slash",
                pierceInfinity: true,
                ignoresShield: true,
                onImpact(tt, g2) {
                  g2.entities.push(spawnCleaveSlashEffect(tt.x, tt.y, 54));
                  g2.addEffect(tt, "slow", 0.5, { factor: 0.65 });
                  g2.chargeUlt(b);
                },
              }));
              for (const tilt of [-0.22, 0.22]) {
                gg.entities.push(rt.spawnProjectile({
                  owner: b,
                  target: t,
                  x: m.x,
                  y: m.y,
                  speed: 740,
                  radius: 22,
                  damage: 6,
                  color: "#ef4444",
                  label: "DISMANTLE!",
                  shape: "dismantle_slash",
                  slashTilt: tilt,
                  onImpact(tt, g2) {
                    g2.entities.push(spawnCleaveSlashEffect(tt.x, tt.y, 34));
                  },
                }));
              }
              gg.spawnDamageText(b.x, b.y - b.radius - 14, 0, "#fef2f2", true, "WORLD-CUTTING SLASH!");
              return;
            }

            if (b.evolved) {
              // Meguna: Summon Divine Dog -> on hit drops Max Elephant + Water Damage Area!
              const m = rt.castMuzzle(b, baseAng, 18);
              gg.entities.push(spawnDivineDogShikigami(b, t, m.x, m.y));
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#e2e8f0", false, "DIVINE DOG!");
              return;
            }

            // Starter Dismantle x3
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
            // Meguna: Giant Max Nue flyover dropping lightning in wide corridor + landing explosion!
            if (b.evolved && !b.heianEraMode) {
              gg.entities.push(spawnMaxNueFlyover(b, b.x, b.y, baseAng));
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#a855f7", true, "MAX NUE!");
              return;
            }

            // Heian Era: 4-Arm Cleave + Kamutoke Lightning | Starter: Cleave Dash
            const dashMult = b.heianEraMode ? 3.15 : 2.85;
            const dashSpeed = b.baseSpeed * dashMult;
            b.vx = Math.cos(baseAng) * dashSpeed;
            b.vy = Math.sin(baseAng) * dashSpeed;
            b.cleaveDashTimer = b.heianEraMode ? 0.45 : 0.42;
            b.cleaveDashHit = false;
            gg.entities.push(rt.spawnShockRing(b.x, b.y, b.heianEraMode ? "#facc15" : "#dc2626", 95, 0.28));
            if (b.heianEraMode) {
              spawnKamutokeStrike(t.x, t.y, b, gg);
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#facc15", true, "CLEAVE & KAMUTOKE!");
            } else {
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#dc2626", false, "CLEAVE DASH!");
            }
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
    const nowS = performance.now() * 0.004;
    if (ball.previewMahoraga) {
      drawMahoragaEntity(c, {
        x: 0,
        y: 4,
        facing: 1,
        wheelAngle: nowS * 0.35,
        slashAnim: Math.max(0, Math.sin(nowS * 0.9)) * 0.35,
        alpha: 1,
        scale: 1.15,
      });
      return;
    }
    const isHeian = Boolean(ball.heianEraMode || ball.previewHeianEra);
    const isMeguna = Boolean((ball.evolved || ball.previewMeguna) && !isHeian);

    // 1. Meguna: Ten Shadows Aura + Sculpted Golden Mahoraga Dharma Wheel behind head
    if (isMeguna) {
      // Subtle Ten Shadows dark-purple shadow aura
      c.save();
      c.strokeStyle = "rgba(126, 34, 206, 0.55)";
      c.lineWidth = 3.5;
      c.beginPath();
      c.arc(0, 0, r * 1.14 + Math.sin(nowS * 1.4) * 1.5, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // Golden Eight-Handled Mahoraga Dharma Wheel
      c.save();
      c.translate(0, -r * 0.92);
      c.rotate(ball.mahoragaWheelSpin || (performance.now() * 0.0008));
      const wr = r * 0.54;
      // Soft golden halo glow
      const wg = c.createRadialGradient(0, 0, wr * 0.2, 0, 0, wr * 1.25);
      wg.addColorStop(0, "rgba(250, 204, 21, 0.28)");
      wg.addColorStop(1, "rgba(250, 204, 21, 0)");
      c.fillStyle = wg;
      c.beginPath(); c.arc(0, 0, wr * 1.25, 0, Math.PI * 2); c.fill();

      // 8 Spokes + Handle Knobs
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const hx = Math.cos(a) * (wr + 5.5);
        const hy = Math.sin(a) * (wr + 5.5);
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4.6;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
        c.strokeStyle = "#eab308";
        c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();

        c.fillStyle = "#fef08a";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 1.8;
        c.beginPath(); c.arc(hx, hy, 3.2, 0, Math.PI * 2); c.fill(); c.stroke();
      }
      // Double wheel rim + center hub
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 5.4;
      c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "#facc15";
      c.lineWidth = 2.8;
      c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#fef08a";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, 4.2, 0, Math.PI * 2); c.fill(); c.stroke();
      c.restore();
    }

    // 2. Heian Era: Crimson Aura + 4 Tattooed Arms + Kamutoke Vajra
    if (isHeian) {
      c.save();
      c.strokeStyle = "rgba(220, 38, 38, 0.55)";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, r * 1.18 + Math.sin(nowS * 1.8) * 1.8, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      for (const side of [-1, 1]) {
        // Upper muscular combat arm with black Sukuna cuff bands
        c.save();
        c.translate(side * r * 0.9, -r * 0.04);
        c.rotate(side * (-0.52 + Math.sin(nowS) * 0.1));
        c.fillStyle = "#fed7aa";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(-4.5, -2, 9, r * 0.62, 4.5); c.fill(); c.stroke();
        // Black cursed wrist/bicep bands
        c.fillStyle = "#09090b";
        c.fillRect(-4.5, r * 0.14, 9, 3.5);
        c.fillRect(-4.5, r * 0.42, 9, 3.5);
        // Fist
        c.fillStyle = "#fed7aa";
        c.beginPath(); c.arc(0, r * 0.62, 4.8, 0, Math.PI * 2); c.fill(); c.stroke();

        // Kamutoke golden vajra thunderbolt in upper-right hand
        if (side === 1) {
          c.save();
          c.translate(0, r * 0.62);
          c.rotate(0.35);
          // Pronged vajra ends
          c.fillStyle = "#facc15";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-4, -14); c.lineTo(0, -21); c.lineTo(4, -14);
          c.lineTo(3, 14); c.lineTo(0, 21); c.lineTo(-3, 14);
          c.closePath();
          c.fill(); c.stroke();
          // Handle grip
          c.fillStyle = "#dc2626";
          c.fillRect(-3.2, -5, 6.4, 10);
          c.strokeRect(-3.2, -5, 6.4, 10);
          c.restore();
        }
        c.restore();

        // Lower chanting / hand-sign arm
        c.save();
        c.translate(side * r * 0.78, r * 0.5);
        c.rotate(side * (0.62 + Math.cos(nowS) * 0.08));
        c.fillStyle = "#fdba74";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.2;
        c.beginPath(); c.roundRect(-4, -2, 8, r * 0.5, 4); c.fill(); c.stroke();
        c.fillStyle = "#09090b";
        c.fillRect(-4, r * 0.28, 8, 3);
        c.fillStyle = "#fdba74";
        c.beginPath(); c.arc(0, r * 0.5, 4.2, 0, Math.PI * 2); c.fill(); c.stroke();
        c.restore();
      }
    }

    rt.drawSkinFace(ball, r, c);

    // 3. Outfit (Meguna Dark Jujutsu High Uniform vs Yuji/Heian Shredded Haori)
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    if (isMeguna) {
      // Dark Jujutsu High uniform + sharp lapels + gold collar button
      c.fillStyle = "#0f172a";
      c.beginPath();
      c.moveTo(-r, r * 0.44);
      c.lineTo(0, r * 0.76);
      c.lineTo(r, r * 0.44);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.4;
      c.stroke();
      // Inner purple-crimson Ten Shadows collar trim
      c.fillStyle = "#581c87";
      c.beginPath();
      c.moveTo(-r * 0.46, r * 0.58);
      c.lineTo(0, r * 0.82);
      c.lineTo(r * 0.46, r * 0.58);
      c.lineTo(r * 0.36, r * 1.1);
      c.lineTo(-r * 0.36, r * 1.1);
      c.closePath();
      c.fill();
      // Gold Jujutsu button
      c.fillStyle = "#facc15";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(0, r * 0.82, 3.2, 0, Math.PI * 2); c.fill(); c.stroke();
    } else {
      c.fillStyle = "#f8fafc";
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

      // Crimson inner sash (with gold trim in Heian Era)
      c.fillStyle = "#dc2626";
      c.fillRect(-r * 0.35, r * 0.78, r * 0.7, r * 0.35);
      if (isHeian) {
        c.fillStyle = "#facc15";
        c.fillRect(-r * 0.35, r * 0.78, r * 0.7, 3);
      }
    }

    // Heian Era: Sculpted Angular Bone-Mask Plate on Right Side of Face (keeps 4 eyes visible!)
    if (isHeian) {
      c.fillStyle = "#e2e8f0";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(r * 0.24, -r * 0.44);
      c.lineTo(r * 0.74, -r * 0.32);
      c.lineTo(r * 0.84, r * 0.08);
      c.lineTo(r * 0.56, r * 0.36);
      c.lineTo(r * 0.22, r * 0.22);
      c.quadraticCurveTo(r * 0.32, -r * 0.08, r * 0.24, -r * 0.44);
      c.closePath();
      c.fill();
      c.stroke();
      // Subtle chitin ridge line on mask
      c.strokeStyle = "#94a3b8";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(r * 0.44, -r * 0.32);
      c.lineTo(r * 0.62, r * 0.22);
      c.stroke();
    }
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

    // 4. Hair: Jet-black messy spiky Megumi hair for Meguna, salmon-pink spiky hair for Yuji/Heian
    if (isMeguna) {
      c.fillStyle = "#0f172a";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.98, -r * 0.24);
      c.lineTo(-r * 1.32, -r * 0.56);
      c.lineTo(-r * 0.88, -r * 0.62);
      c.lineTo(-r * 1.18, -r * 1.06);
      c.lineTo(-r * 0.54, -r * 0.86);
      c.lineTo(-r * 0.28, -r * 1.38);
      c.lineTo(0, -r * 0.94);
      c.lineTo(r * 0.3, -r * 1.36);
      c.lineTo(r * 0.56, -r * 0.86);
      c.lineTo(r * 1.18, -r * 1.04);
      c.lineTo(r * 0.88, -r * 0.6);
      c.lineTo(r * 1.32, -r * 0.54);
      c.lineTo(r * 0.98, -r * 0.24);
      c.quadraticCurveTo(0, -r * 0.7, -r * 0.98, -r * 0.24);
      c.closePath();
      c.fill();
      c.stroke();
    } else {
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
    }
  };

  function drawMahoragaEntity(c, { x = 0, y = 0, facing = 1, wheelAngle = 0, slashAnim = 0, alpha = 1, scale = 1 }) {
    const now = performance.now() * 0.004;
    const bob = Math.sin(now * 1.6) * 2.5;
    const R = 30;
    c.save();
    c.translate(x, y + bob);
    c.scale(scale, scale);
    c.globalAlpha = alpha;

    // Ground shadow under big ball
    c.fillStyle = "rgba(43, 27, 61, 0.24)";
    c.beginPath(); c.ellipse(0, R + 8 - bob, R * 0.95, 9, 0, 0, Math.PI * 2); c.fill();

    c.scale(facing, 1);

    // 1. Curved Segmented Head-Tail (Buntut) arching behind the ball
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 13;
    c.beginPath();
    c.moveTo(-4, -R * 0.72);
    c.bezierCurveTo(18, -R * 1.55, -8, -R * 1.85, -36, -R * 1.25);
    c.quadraticCurveTo(-48, -R * 0.95, -52, -R * 0.52);
    c.stroke();
    c.strokeStyle = "#e2e8f0";
    c.lineWidth = 8;
    c.stroke();
    c.strokeStyle = "#64748b";
    c.lineWidth = 1.6;
    for (const [sx, sy, ang] of [[-12, -R * 1.52, -0.4], [-26, -R * 1.42, -0.9], [-39, -R * 1.15, -1.2], [-47, -R * 0.82, -1.4]]) {
      c.save();
      c.translate(sx, sy);
      c.rotate(ang);
      c.beginPath(); c.moveTo(-3.5, 0); c.lineTo(3.5, 0); c.stroke();
      c.restore();
    }
    c.restore();

    // 2. Spinning Golden 8-Handled Dharma Wheel behind top of ball
    c.save();
    c.translate(0, -R * 0.95);
    c.rotate(wheelAngle);
    const wr = 18;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const hx = Math.cos(a) * (wr + 4.5);
      const hy = Math.sin(a) * (wr + 4.5);
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 4.2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = "#eab308";
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
      c.fillStyle = "#facc15";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(hx, hy, 2.8, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 4.8;
    c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = "#facc15";
    c.lineWidth = 2.4;
    c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
    c.fillStyle = "#fef08a";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.6;
    c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();

    // 3. Big Ball Body + Baju (Hakama Skirt clipped/wrapped cleanly on bottom)
    c.save();
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.fillStyle = "#f1f5f9";
    c.fill();

    // Baju: Dark Charcoal Hakama wrapping lower portion of the ball (lowered waist)
    c.save();
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "#27272a";
    c.fillRect(-R, R * 0.50, R * 2, R);
    // Waist sash
    c.fillStyle = "#3f3f46";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.fillRect(-R, R * 0.45, R * 2, 5.5);
    c.strokeRect(-R, R * 0.45, R * 2, 5.5);
    // Hanging center sash flap
    c.beginPath();
    c.moveTo(-4.5, R * 0.62);
    c.lineTo(4.5, R * 0.62);
    c.lineTo(6, R * 0.94);
    c.lineTo(0, R * 1.02);
    c.lineTo(-6, R * 0.94);
    c.closePath();
    c.fill(); c.stroke();
    c.restore();

    // Glossy ball highlight + Thick Ball Fight Ink Outline
    c.fillStyle = "rgba(255, 255, 255, 0.55)";
    c.beginPath();
    c.ellipse(-R * 0.34, -R * 0.38, R * 0.24, R * 0.13, -0.55, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.lineWidth = 3.8;
    c.strokeStyle = COLORS.ink;
    c.stroke();
    c.restore();

    // 4. Clean Ball-Style Face: 4 White Eye-Wings + Clenched Toothy Grin (No Mangap, No Eyes)
    c.fillStyle = "#ffffff";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath(); c.roundRect(-8, 1.5, 16, 6, 3); c.fill(); c.stroke();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-8, 4.5); c.lineTo(8, 4.5);
    for (const tx of [-4, 0, 4]) {
      c.moveTo(tx, 1.5); c.lineTo(tx, 7.5);
    }
    c.stroke();

    // 4 Sweeping White Eye-Wings (wider sweep)
    const drawWing = (sx, sy, tipX, tipY, cx, cy) => {
      c.fillStyle = "#f8fafc";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(sx, sy - 2);
      c.quadraticCurveTo(cx, cy - 5, tipX, tipY);
      c.quadraticCurveTo(cx, cy + 3.5, sx, sy + 2.5);
      c.closePath();
      c.fill(); c.stroke();
    };
    for (const side of [-1, 1]) {
      drawWing(side * 6, -12, side * 42, -28, side * 24, -23);
      drawWing(side * 7, -6.5, side * 38, -13, side * 23, -10.5);
    }

    // 5. Tangan Tajam: Right Arm + Sword of Extermination (Taima no Tsurugi)
    c.save();
    c.translate(R * 0.92, 2);
    c.rotate(-0.28 + slashAnim * 1.35);
    // Forearm cuff
    c.fillStyle = "#f1f5f9";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath(); c.roundRect(-4, -5, 13, 10, 4); c.fill(); c.stroke();
    c.fillStyle = "#18181b";
    c.fillRect(3, -5, 4, 10);
    // Sharp Sword of Extermination blade
    c.fillStyle = "#f8fafc";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(8, -5.5);
    c.lineTo(42, 0);
    c.lineTo(8, 5.5);
    c.closePath();
    c.fill(); c.stroke();
    // Positive-energy cyan edge highlight
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(11, -1.5); c.lineTo(36, 0); c.stroke();
    c.restore();

    c.restore();
  }

  function spawnMahoragaSummon(owner, g) {
    const startX = Math.max(54, Math.min(WORLD_SIZE - 54, owner.x + 36));
    const startY = Math.max(54, Math.min(WORLD_SIZE - 54, owner.y - 24));
    g.entities.push(rt.spawnShockRing(startX, startY, "#facc15", 150, 0.48));
    g.entities.push(rt.spawnShockRing(startX, startY, "#0f172a", 110, 0.36));
    g.spawnSparks(startX, startY, "#facc15", "#e2e8f0");
    g.spawnDamageText(owner.x, owner.y - owner.radius - 18, 0, "#facc15", true, "MAHORAGA SUMMONED!");
    g.sound.playCritHit();
    rt.addShake(0.35, 9);

    return {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      facing: 1,
      life: 10.0,
      maxLife: 10.0,
      atkCd: 0.25,
      slashAnim: 0,
      wheelAngle: 0,
      dead: false,
      update(dt, gg) {
        this.life -= dt;
        this.wheelAngle += dt * 2.2;
        if (this.slashAnim > 0) this.slashAnim = Math.max(0, this.slashAnim - dt * 3.8);
        if (this.life <= 0 || !owner.alive) {
          this.dead = true;
          return;
        }
        const target = gg.balls.find((b) => b !== owner && b.alive);
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.facing = dx >= 0 ? 1 : -1;

        const moveSpeed = 315;
        if (dist > 46) {
          this.vx = (dx / dist) * moveSpeed;
          this.vy = (dy / dist) * moveSpeed;
          this.x = Math.max(42, Math.min(WORLD_SIZE - 42, this.x + this.vx * dt));
          this.y = Math.max(42, Math.min(WORLD_SIZE - 42, this.y + this.vy * dt));
        }

        this.atkCd -= dt;
        if (this.atkCd <= 0 && dist <= 78 + target.radius) {
          this.atkCd = 0.92;
          this.slashAnim = 1.0;
          this.wheelAngle += Math.PI / 4;
          const dealt = gg.applyDamage(target, 13);
          target.flashTimer = 0.14;
          const kAng = Math.atan2(target.y - this.y, target.x - this.x);
          target.vx = Math.cos(kAng) * 340;
          target.vy = Math.sin(kAng) * 340;
          gg.entities.push(spawnCleaveSlashEffect(target.x, target.y, 48));
          gg.entities.push(rt.spawnShockRing(target.x, target.y, "#facc15", 72, 0.24));
          gg.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#facc15", true, "EXTERMINATE!");
          gg.sound.playBallHit();
        }
      },
      render(c) {
        drawMahoragaEntity(c, {
          x: this.x,
          y: this.y,
          facing: this.facing,
          wheelAngle: this.wheelAngle,
          slashAnim: this.slashAnim,
          alpha: Math.min(1, this.life * 2),
          scale: 1,
        });
      },
    };
  }

  BF.triggerFugaExplosion = triggerFugaExplosion;
  BF.spawnMalevolentShrineDomain = spawnMalevolentShrineDomain;
  BF.spawnCleaveSlashEffect = spawnCleaveSlashEffect;
  BF.spawnMahoragaSummon = spawnMahoragaSummon;
})();
