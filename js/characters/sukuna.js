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

  function spawnNueLightningBolt(x, y) {
    const segs = [];
    let cx = x + (Math.random() - 0.5) * 34;
    let cy = y - 165;
    segs.push([cx, cy]);
    for (let i = 1; i <= 6; i++) {
      const t = i / 6;
      cx = x + (1 - t) * (cx - x) + (i < 6 ? (Math.random() - 0.5) * 32 : 0);
      cy = (y - 165) + t * 165;
      segs.push([cx, cy]);
    }
    return {
      x,
      y,
      segs,
      life: 0.24,
      maxLife: 0.24,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render() {},
      renderOverlay(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = k;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.fillStyle = "rgba(192, 132, 252, 0.35)";
        c.beginPath(); c.ellipse(this.x, this.y, 38 * k, 16 * k, 0, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "#a855f7";
        c.lineWidth = 10 * k;
        c.beginPath();
        this.segs.forEach(([sx, sy], i) => (i === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy)));
        c.stroke();
        c.strokeStyle = "#facc15";
        c.lineWidth = 5 * k;
        c.stroke();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 2.2 * k;
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnNueCrashExplosion(x, y) {
    const arcs = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const pts = [[0, 0]];
      for (let s = 1; s <= 4; s++) {
        const r = s * 34;
        const jit = (Math.random() - 0.5) * 26;
        pts.push([Math.cos(a) * r - Math.sin(a) * jit, Math.sin(a) * r + Math.cos(a) * jit]);
      }
      arcs.push(pts);
    }
    return {
      x,
      y,
      arcs,
      life: 0.52,
      maxLife: 0.52,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render() {},
      renderOverlay(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const k = 1 - p;
        const rad = 36 + 122 * easeOut(p);
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = Math.min(1, k * 1.4);

        const grad = c.createRadialGradient(0, 0, rad * 0.1, 0, 0, rad);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.92)");
        grad.addColorStop(0.35, "rgba(250, 204, 21, 0.65)");
        grad.addColorStop(0.7, "rgba(168, 85, 247, 0.48)");
        grad.addColorStop(1, "rgba(126, 34, 206, 0)");
        c.fillStyle = grad;
        c.beginPath(); c.arc(0, 0, rad, 0, Math.PI * 2); c.fill();

        c.lineCap = "round";
        c.lineJoin = "round";
        for (const pts of this.arcs) {
          c.strokeStyle = "#c084fc";
          c.lineWidth = 6 * k;
          c.beginPath();
          pts.forEach(([px, py], i) => (i === 0 ? c.moveTo(px * (0.4 + p * 0.7), py * (0.4 + p * 0.7)) : c.lineTo(px * (0.4 + p * 0.7), py * (0.4 + p * 0.7))));
          c.stroke();
          c.strokeStyle = "#fef08a";
          c.lineWidth = 2.4 * k;
          c.stroke();
        }

        c.strokeStyle = "#facc15";
        c.lineWidth = 4.5 * k;
        c.beginPath(); c.arc(0, 0, rad * 0.95, 0, Math.PI * 2); c.stroke();
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
          this.boltCd = 0.13;
          const perp = this.ang + Math.PI * 0.5;
          const off = (g.rng() - 0.5) * halfCorridor * 1.45;
          const bx = Math.max(30, Math.min(WORLD_SIZE - 30, this.x + Math.cos(perp) * off));
          const by = Math.max(30, Math.min(WORLD_SIZE - 30, this.y + Math.sin(perp) * off));
          g.entities.push(spawnNueLightningBolt(bx, by));
          g.entities.push(rt.spawnShockRing(bx, by, "#a855f7", 62, 0.25));
          g.entities.push(rt.spawnShockRing(bx, by, "#facc15", 38, 0.18));
          g.spawnSparks(bx, by, "#facc15", "#c084fc");
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - this.x, tt.y - this.y) <= halfCorridor + tt.radius) {
              const dealt = g.applyDamage(tt, 3);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 10, dealt, "#facc15", false, "NUE BOLT!");
              g.addEffect(tt, "stun", 0.15);
            }
          }
        }

        // End of flight (or hit arena boundary): Max Nue dives down & explodes!
        const outOfBounds = this.x < 46 || this.x > WORLD_SIZE - 46 || this.y < 46 || this.y > WORLD_SIZE - 46;
        if (this.traveled >= distMax || outOfBounds) {
          this.dead = true;
          const ex = Math.max(46, Math.min(WORLD_SIZE - 46, this.x));
          const ey = Math.max(46, Math.min(WORLD_SIZE - 46, this.y));
          g.entities.push(spawnNueCrashExplosion(ex, ey));
          g.entities.push(rt.spawnShockRing(ex, ey, "#a855f7", 155, 0.46));
          g.entities.push(rt.spawnShockRing(ex, ey, "#facc15", 112, 0.36));
          g.spawnSparks(ex, ey, "#a855f7", "#facc15");
          if (g.spawnCritBurst) g.spawnCritBurst(ex, ey);
          rt.addShake(0.42, 12);
          g.sound.playCritHit();
          for (const tt of g.balls) {
            if (tt === owner || !tt.alive) continue;
            if (Math.hypot(tt.x - ex, tt.y - ey) <= 122 + tt.radius) {
              const dealt = g.applyDamage(tt, 9);
              g.spawnDamageText(tt.x, tt.y - tt.radius - 16, dealt, "#c084fc", true, "MAX NUE CRASH!");
              const kAng = Math.atan2(tt.y - ey, tt.x - ex);
              tt.vx = Math.cos(kAng) * 480;
              tt.vy = Math.sin(kAng) * 480;
              tt.flashTimer = 0.18;
              g.addEffect(tt, "stun", 0.32);
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

  function spawnKamutokeAreaStrike(x, y, owner, g) {
    const cx = Math.max(40, Math.min(WORLD_SIZE - 40, x));
    const cy = Math.max(40, Math.min(WORLD_SIZE - 40, y));
    // Wide sky-to-ground golden Kamutoke lightning bolt + 3 jagged side branches
    const segs = [];
    const branches = [];
    let lx = cx + (g.rng() - 0.5) * 38;
    let ly = cy - 245;
    segs.push([lx, ly]);
    for (let i = 1; i <= 7; i++) {
      const t = i / 7;
      lx = cx + (1 - t) * (lx - cx) + (i < 7 ? (g.rng() - 0.5) * 38 : 0);
      ly = (cy - 245) + t * 245;
      segs.push([lx, ly]);
      if (i === 2 || i === 4 || i === 5) {
        const dir = i % 2 === 0 ? 1 : -1;
        branches.push([
          [lx, ly],
          [lx + dir * (22 + g.rng() * 18), ly + 22],
          [lx + dir * (38 + g.rng() * 24), ly + 48],
        ]);
      }
    }
    g.entities.push({
      x: cx,
      y: cy,
      segs,
      branches,
      life: 0.34,
      maxLife: 0.34,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render() {},
      renderOverlay(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = k;
        c.lineCap = "round";
        c.lineJoin = "round";
        // Wide golden electric ground corona
        const grad = c.createRadialGradient(this.x, this.y, 4, this.x, this.y, 72 * k);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        grad.addColorStop(0.4, "rgba(250, 204, 21, 0.58)");
        grad.addColorStop(1, "rgba(234, 179, 8, 0)");
        c.fillStyle = grad;
        c.beginPath(); c.ellipse(this.x, this.y, 72 * k, 32 * k, 0, 0, Math.PI * 2); c.fill();
        // Side branches
        c.strokeStyle = "#facc15";
        c.lineWidth = 4.2 * k;
        for (const br of this.branches) {
          c.beginPath();
          br.forEach(([bx, by], idx) => (idx === 0 ? c.moveTo(bx, by) : c.lineTo(bx, by)));
          c.stroke();
        }
        // Main wide thunderbolt
        c.strokeStyle = "#eab308";
        c.lineWidth = 17 * k;
        c.beginPath();
        this.segs.forEach(([sx, sy], i) => (i === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy)));
        c.stroke();
        c.strokeStyle = "#fef08a";
        c.lineWidth = 8.5 * k;
        c.stroke();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 3.6 * k;
        c.stroke();
        c.restore();
      },
    });
    g.entities.push(rt.spawnShockRing(cx, cy, "#facc15", 118, 0.34));
    g.entities.push(rt.spawnShockRing(cx, cy, "#fef08a", 76, 0.25));
    g.spawnSparks(cx, cy, "#facc15", "#ffffff");
    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      if (Math.hypot(tt.x - cx, tt.y - cy) <= 95 + tt.radius) {
        const dealt = g.applyDamage(tt, 6);
        g.spawnDamageText(tt.x, tt.y - tt.radius - 14, dealt, "#facc15", true, "KAMUTOKE!");
        tt.flashTimer = 0.14;
        g.addEffect(tt, "stun", 0.35);
      }
    }
    g.sound.playCritHit();
  }

  function spawnHitenFireStream(owner, target) {
    let ang = target ? Math.atan2(target.y - owner.y, target.x - owner.x) : 0;
    return {
      life: 0.62,
      maxLife: 0.62,
      tickCd: 0.04,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !owner.alive) {
          this.dead = true;
          return;
        }
        const liveTarget = g.balls.find((b) => b !== owner && b.alive);
        if (liveTarget) {
          const targetAng = Math.atan2(liveTarget.y - owner.y, liveTarget.x - owner.x);
          let diff = targetAng - ang;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ang += diff * Math.min(1, dt * 7.5);
        }
        this.tickCd -= dt;
        if (this.tickCd <= 0) {
          this.tickCd = 0.13;
          const muzzleX = owner.x + Math.cos(ang) * (owner.radius + 22);
          const muzzleY = owner.y + Math.sin(ang) * (owner.radius + 22);
          g.spawnSparks(muzzleX + Math.cos(ang) * 75, muzzleY + Math.sin(ang) * 75, "#f97316", "#fef08a");
          if (liveTarget) {
            const dx = liveTarget.x - owner.x;
            const dy = liveTarget.y - owner.y;
            const dist = Math.hypot(dx, dy) || 1;
            const dot = (dx / dist) * Math.cos(ang) + (dy / dist) * Math.sin(ang);
            if (dist <= 275 + liveTarget.radius && dot >= 0.48) {
              const dealt = g.applyDamage(liveTarget, 3);
              liveTarget.flashTimer = 0.1;
              liveTarget.vx += Math.cos(ang) * 155;
              liveTarget.vy += Math.sin(ang) * 155;
              g.addEffect(liveTarget, "burn", 1.8);
              g.spawnDamageText(liveTarget.x, liveTarget.y - liveTarget.radius - 12, dealt, "#f97316", false, "HITEN FLAME!");
              g.sound.playBallHit();
            }
          }
        }
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        const now = performance.now() * 0.022;
        const muzzleX = owner.x + Math.cos(ang) * (owner.radius + 18);
        const muzzleY = owner.y + Math.sin(ang) * (owner.radius + 18);
        const len = 265 * Math.min(1, (1 - k) * 4.5 + 0.35);

        c.save();
        c.translate(muzzleX, muzzleY);
        c.rotate(ang);
        c.globalAlpha = Math.min(1, k * 1.6);

        // Glowing fire ring at Hiten trident muzzle
        c.fillStyle = "rgba(254, 240, 138, 0.75)";
        c.beginPath(); c.arc(0, 0, 14 + Math.sin(now * 1.5) * 3, 0, Math.PI * 2); c.fill();

        // Wide outer crimson-orange fire plume
        const grad = c.createLinearGradient(0, 0, len, 0);
        grad.addColorStop(0, "rgba(254, 240, 138, 0.96)");
        grad.addColorStop(0.28, "rgba(249, 115, 22, 0.90)");
        grad.addColorStop(0.72, "rgba(220, 38, 38, 0.72)");
        grad.addColorStop(1, "rgba(185, 28, 28, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.moveTo(0, -10);
        c.quadraticCurveTo(len * 0.48, -56 + Math.sin(now) * 11, len, -88 + Math.cos(now * 1.3) * 14);
        c.lineTo(len, 88 + Math.sin(now * 1.3) * 14);
        c.quadraticCurveTo(len * 0.48, 56 + Math.cos(now) * 11, 0, 10);
        c.closePath();
        c.fill();

        // Mid golden-amber flame wave
        c.fillStyle = "rgba(250, 204, 21, 0.78)";
        c.beginPath();
        c.moveTo(0, -6);
        c.quadraticCurveTo(len * 0.42, -32 + Math.cos(now * 1.4) * 7, len * 0.82, -46 + Math.sin(now * 1.7) * 9);
        c.lineTo(len * 0.88, 0);
        c.lineTo(len * 0.82, 46 + Math.cos(now * 1.7) * 9);
        c.quadraticCurveTo(len * 0.42, 32 + Math.sin(now * 1.4) * 7, 0, 6);
        c.closePath();
        c.fill();

        // White-hot inner fire tongue
        c.fillStyle = "rgba(254, 249, 195, 0.92)";
        c.beginPath();
        c.moveTo(0, -3.5);
        c.lineTo(len * 0.56, -18 + Math.sin(now * 1.8) * 5);
        c.lineTo(len * 0.68, 0);
        c.lineTo(len * 0.56, 18 + Math.cos(now * 1.8) * 5);
        c.lineTo(0, 3.5);
        c.closePath();
        c.fill();

        // Swirling fireballs along the wide flame stream
        c.fillStyle = "rgba(254, 240, 138, 0.88)";
        for (let i = 0; i < 5; i++) {
          const ft = ((now * 0.08 + i * 0.2) % 1);
          const fx = ft * len * 0.9;
          const fy = Math.sin(now * 1.4 + i * 2.3) * (ft * 56);
          c.beginPath(); c.arc(fx, fy, (1 - ft * 0.5) * 8, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      },
    };
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
            // Heian Era Skill A: Kamutoke Lightning Rain across multiple areas!
            if (b.heianEraMode) {
              const spots = [
                [t.x, t.y],
                [t.x - 115, t.y - 75],
                [t.x + 115, t.y + 70],
                [b.x + Math.cos(baseAng) * 165 + (gg.rng() - 0.5) * 90, b.y + Math.sin(baseAng) * 165 + (gg.rng() - 0.5) * 90],
                [95 + gg.rng() * (WORLD_SIZE - 190), 95 + gg.rng() * (WORLD_SIZE - 190)],
              ];
              spots.forEach(([sx, sy], idx) => {
                if (idx === 0) {
                  spawnKamutokeAreaStrike(sx, sy, b, gg);
                } else {
                  gg.entities.push(rt.spawnDelayedAction(idx * 0.09, (gNow) => {
                    if (b.alive) spawnKamutokeAreaStrike(sx, sy, b, gNow);
                  }));
                }
              });
              gg.spawnDamageText(b.x, b.y - b.radius - 14, 0, "#facc15", true, "KAMUTOKE STORM!");
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

            // Heian Era Skill B: Hiten Fire Breath / Flame Stream from weapon!
            if (b.heianEraMode) {
              gg.entities.push(spawnHitenFireStream(b, t));
              gg.entities.push(rt.spawnShockRing(b.x, b.y, "#f97316", 92, 0.28));
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, "#f97316", true, "HITEN FLAME!");
              gg.sound.playCritHit();
              return;
            }

            // Starter: Cleave Dash
            const dashMult = 2.85;
            const dashSpeed = b.baseSpeed * dashMult;
            b.vx = Math.cos(baseAng) * dashSpeed;
            b.vy = Math.sin(baseAng) * dashSpeed;
            b.cleaveDashTimer = 0.42;
            b.cleaveDashHit = false;
            gg.entities.push(rt.spawnShockRing(b.x, b.y, "#dc2626", 95, 0.28));
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

        // Hiten Trident Spear in upper-left hand (side === -1)
        if (side === -1) {
          c.save();
          c.translate(0, r * 0.62);
          c.rotate(-0.42);
          // Long dark shaft
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 5.4;
          c.lineCap = "round";
          c.beginPath(); c.moveTo(0, 14); c.lineTo(0, -r * 1.45); c.stroke();
          c.strokeStyle = "#451a03";
          c.lineWidth = 2.8;
          c.stroke();
          // White cloth ribbon tied below trident head
          c.fillStyle = "#f8fafc";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 1.6;
          c.beginPath(); c.roundRect(-3.8, -r * 1.05, 7.6, 5, 2); c.fill(); c.stroke();
          // Curved bronze crescent cross-guard
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 4.6;
          c.beginPath(); c.arc(0, -r * 1.18, 9, Math.PI * 0.12, Math.PI * 0.88); c.stroke();
          c.strokeStyle = "#f59e0b";
          c.lineWidth = 2.2;
          c.stroke();
          // Sharp silver-crimson spear tip
          c.fillStyle = "#e2e8f0";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-4, -r * 1.18);
          c.lineTo(0, -r * 1.65);
          c.lineTo(4, -r * 1.18);
          c.closePath();
          c.fill(); c.stroke();
          c.restore();
        }

        // Kamutoke Dual-Ring Vajra Thunderbolt in upper-right hand (side === 1)
        if (side === 1) {
          c.save();
          c.translate(0, r * 0.62);
          c.rotate(0.35);
          // Pronged vajra ends
          c.fillStyle = "#facc15";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-4, -14); c.lineTo(0, -22); c.lineTo(4, -14);
          c.lineTo(3, 14); c.lineTo(0, 22); c.lineTo(-3, 14);
          c.closePath();
          c.fill(); c.stroke();
          // Twin white-gold guard rings (JJK Kamutoke signature!)
          for (const ry of [-7.5, 7.5]) {
            c.strokeStyle = COLORS.ink;
            c.lineWidth = 3.4;
            c.beginPath(); c.ellipse(0, ry, 6.2, 2.8, 0, 0, Math.PI * 2); c.stroke();
            c.strokeStyle = "#fef08a";
            c.lineWidth = 1.6;
            c.stroke();
          }
          // Dark crimson grip
          c.fillStyle = "#dc2626";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 1.8;
          c.fillRect(-3.2, -4.5, 6.4, 9);
          c.strokeRect(-3.2, -4.5, 6.4, 9);
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
    c.lineWidth = 2.1;
    c.beginPath(); c.roundRect(-7.5, -2.5, 15, 5.5, 2.5); c.fill(); c.stroke();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(-7.5, 0.2); c.lineTo(7.5, 0.2);
    for (const tx of [-3.8, 0, 3.8]) {
      c.moveTo(tx, -2.5); c.lineTo(tx, 3);
    }
    c.stroke();

    // Chest Ritual Chain / Sigil (4 hollow rings + 5 hanging dark tassels along curved chain)
    c.save();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-11, 6.2);
    c.quadraticCurveTo(0, 10.5, 11, 6.2);
    c.stroke();
    // 4 rings with white centers & hanging tassels
    const ringPts = [[-10.5, 6.4], [-5.2, 8.2], [5.2, 8.2], [10.5, 6.4]];
    for (const [rx, ry] of ringPts) {
      c.fillStyle = COLORS.ink;
      c.beginPath();
      c.moveTo(rx - 0.8, ry + 1.2);
      c.lineTo(rx + 0.8, ry + 1.2);
      c.lineTo(rx + 1.5, ry + 4.2);
      c.lineTo(rx - 1.5, ry + 4.2);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffffff";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.7;
      c.beginPath(); c.arc(rx, ry, 1.9, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // Center hanging tassel
    c.fillStyle = COLORS.ink;
    c.beginPath();
    c.moveTo(-1.1, 8.5);
    c.lineTo(1.1, 8.5);
    c.lineTo(1.8, 12.6);
    c.lineTo(-1.8, 12.6);
    c.closePath();
    c.fill();
    c.restore();

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

  function spawnMahoragaRitualCinematic(owner, g) {
    const duration = 1.45;
    g.hitStop = duration;
    g.sound.playCritHit();
    rt.addShake(0.32, 7);

    return {
      isFreezeCinematic: true,
      timer: 0,
      duration,
      dead: false,
      update(dt, gg) {
        this.timer += dt;
        if (this.timer >= this.duration) {
          this.dead = true;
          gg.entities.push(spawnMahoragaSummon(owner, gg));
        }
      },
      render() {},
      renderOverlay(c) {
        const p = Math.min(1, this.timer / this.duration);
        const fadeOut = p > 0.86 ? (1 - p) / 0.14 : 1;
        const cx = WORLD_SIZE * 0.5;
        const cy = WORLD_SIZE * 0.52;

        c.save();
        // 1. Dark Ten Shadows Veil over frozen arena
        c.fillStyle = `rgba(5, 7, 15, ${(0.84 * fadeOut).toFixed(3)})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // 2. Center Trapezoidal Ritual Light-Slit (JJK Summoning Frame)
        const slitWTop = 120 + p * 85;
        const slitWBot = 210 + p * 120;
        const slitGrad = c.createLinearGradient(cx, 0, cx, WORLD_SIZE);
        slitGrad.addColorStop(0, "rgba(15, 23, 42, 0.2)");
        slitGrad.addColorStop(0.45, `rgba(186, 230, 253, ${(0.24 * fadeOut).toFixed(3)})`);
        slitGrad.addColorStop(1, "rgba(15, 23, 42, 0.1)");
        c.fillStyle = slitGrad;
        c.beginPath();
        c.moveTo(cx - slitWTop * 0.5, 0);
        c.lineTo(cx + slitWTop * 0.5, 0);
        c.lineTo(cx + slitWBot * 0.5, WORLD_SIZE);
        c.lineTo(cx - slitWBot * 0.5, WORLD_SIZE);
        c.closePath();
        c.fill();

        // 3. Flanking Howling Ten Shadows Wolf Silhouettes + Pale Shadow Flames
        for (const side of [-1, 1]) {
          const wx = cx + side * 195;
          const wy = cy + 65;
          c.save();
          c.globalAlpha = Math.min(1, p * 2.2) * 0.78 * fadeOut;
          // Shadow wolf silhouette
          c.fillStyle = "#090d16";
          c.beginPath();
          c.moveTo(wx - side * 42, wy + 85);
          c.lineTo(wx - side * 15, wy - 35);
          c.lineTo(wx - side * 24, wy - 70);
          c.lineTo(wx - side * 4, wy - 52);
          c.lineTo(wx + side * 10, wy - 80);
          c.lineTo(wx + side * 22, wy - 30);
          c.lineTo(wx + side * 45, wy + 85);
          c.closePath();
          c.fill();
          // Glowing white/cyan shadow flame wisps
          c.fillStyle = "#e0f2fe";
          for (let i = 0; i < 3; i++) {
            const fx = wx + Math.sin(p * 12 + i * 2.1) * 14;
            const fy = wy + 38 - i * 16 - (p * 18);
            c.beginPath();
            c.ellipse(fx, fy, 14 - i * 2, 9, side * 0.3, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        }

        // 4. Center Towering Mahoraga Silhouette rising in light rays
        const riseY = cy + 38 - Math.min(1, p * 1.4) * 44;
        c.save();
        c.globalAlpha = Math.min(1, p * 2) * fadeOut;
        // Radiating light rays
        c.strokeStyle = "rgba(224, 242, 254, 0.38)";
        c.lineWidth = 2.5;
        for (let i = 0; i < 10; i++) {
          const ang = -Math.PI * 0.85 + (i / 9) * Math.PI * 0.7;
          c.beginPath();
          c.moveTo(cx, riseY - 20);
          c.lineTo(cx + Math.cos(ang) * 260, riseY - 20 + Math.sin(ang) * 260);
          c.stroke();
        }
        // Stone/shadow Mahoraga silhouette
        c.fillStyle = "#cbd5e1";
        c.strokeStyle = "#0f172a";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(cx, riseY - 68, 30, 38, 0, 0, Math.PI * 2);
        c.fill(); c.stroke();
        c.beginPath();
        c.roundRect(cx - 48, riseY - 38, 96, 120, 22);
        c.fill(); c.stroke();

        // 5. Spinning & Locking Golden 8-Handled Dharma Wheel
        c.save();
        c.translate(cx, riseY - 122);
        const wScale = 0.65 + Math.min(1, p * 1.35) * 0.65;
        c.scale(wScale, wScale);
        c.rotate(p * Math.PI * 1.75);
        const wr = 34;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const hx = Math.cos(a) * (wr + 9);
          const hy = Math.sin(a) * (wr + 9);
          c.strokeStyle = "#0f172a";
          c.lineWidth = 6.5;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
          c.strokeStyle = "#facc15";
          c.lineWidth = 3.5;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke();
          c.fillStyle = "#fef08a";
          c.strokeStyle = "#0f172a";
          c.lineWidth = 2;
          c.beginPath(); c.arc(hx, hy, 5.2, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        c.strokeStyle = "#0f172a";
        c.lineWidth = 7.5;
        c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = "#facc15";
        c.lineWidth = 4;
        c.beginPath(); c.arc(0, 0, wr, 0, Math.PI * 2); c.stroke();
        c.restore();

        // Golden lock-in flash at end of ritual
        if (p > 0.72) {
          const flashAlpha = Math.sin(((p - 0.72) / 0.28) * Math.PI) * 0.55;
          c.fillStyle = `rgba(250, 204, 21, ${flashAlpha.toFixed(3)})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        }

        // 6. Ritual Incantation Text
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineJoin = "round";
        const chant = p < 0.52 ? "WITH THIS TREASURE I SUMMON..." : "EIGHT-HANDLED SWORD: MAHORAGA!";
        c.font = `bold ${p < 0.52 ? 22 : 27}px 'Fredoka', 'Nunito', sans-serif`;
        c.lineWidth = 7;
        c.strokeStyle = "#09090b";
        c.strokeText(chant, cx, WORLD_SIZE - 58);
        c.fillStyle = p < 0.52 ? "#e0f2fe" : "#facc15";
        c.fillText(chant, cx, WORLD_SIZE - 58);
        c.restore();

        c.restore();
      },
    };
  }

  function spawnMahoragaWorldSlash(x, y, ang, owner, target, g) {
    const len = 780;
    const x1 = x - Math.cos(ang) * 110;
    const y1 = y - Math.sin(ang) * 110;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;

    // Precompute spatial fracture shards along the dimension cut
    const shards = [];
    const perpX = -Math.sin(ang);
    const perpY = Math.cos(ang);
    for (let i = 0; i < 10; i++) {
      const t = 0.1 + (i / 9) * 0.8;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      const side = i % 2 === 0 ? 1 : -1;
      const slen = 28 + (i % 3) * 18;
      shards.push({
        sx,
        sy,
        ex: sx + perpX * side * slen + Math.cos(ang) * 14,
        ey: sy + perpY * side * slen + Math.sin(ang) * 14,
      });
    }

    // Deal 20 piercing DMG (bypasses Infinity & Shields)
    if (target && target.alive) {
      const dealt = g.applyDamage(target, 20, { pierce: true });
      target.flashTimer = 0.25;
      target.vx = Math.cos(ang) * 480;
      target.vy = Math.sin(ang) * 480;
      g.spawnDamageText(target.x, target.y - target.radius - 18, dealt, "#ef4444", true, "WORLD-CUTTING SLASH!");
      if (g.spawnCritBurst) g.spawnCritBurst(target.x, target.y);
      g.spawnSparks(target.x, target.y, "#ef4444", "#fef08a");
    }
    g.entities.push(rt.spawnShockRing(x, y, "#dc2626", 210, 0.48));
    g.entities.push(rt.spawnShockRing(x, y, "#facc15", 145, 0.36));
    g.sound.playCritHit();
    rt.addShake(0.48, 14);

    return {
      isFreezeCinematic: true,
      life: 0.52,
      maxLife: 0.52,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render() {},
      renderOverlay(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const k = Math.max(0, 1 - p);
        c.save();
        c.globalAlpha = Math.min(1, k * 1.45);
        c.lineCap = "round";

        // Outer crimson spatial tear
        c.strokeStyle = "#dc2626";
        c.lineWidth = (34 + p * 10) * k;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

        // Spatial fracture shards branching off the cut
        c.strokeStyle = "#ef4444";
        c.lineWidth = 5 * k;
        for (const s of shards) {
          c.beginPath(); c.moveTo(s.sx, s.sy); c.lineTo(s.ex, s.ey); c.stroke();
        }
        c.strokeStyle = "#09090b";
        c.lineWidth = 2.4 * k;
        for (const s of shards) {
          c.beginPath(); c.moveTo(s.sx, s.sy); c.lineTo(s.ex, s.ey); c.stroke();
        }

        // Pitch-black void core
        c.strokeStyle = "#09090b";
        c.lineWidth = 16 * k;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();

        // Razor white-gold dimension edge
        c.strokeStyle = "#fef08a";
        c.lineWidth = 4.5 * k;
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        c.restore();
      },
    };
  }

  function spawnMahoragaWorldSlashCinematic(mahoraga, owner, target, g) {
    const duration = 0.95;
    const chargeDur = 0.56;
    g.hitStop = duration;
    g.sound.playCritHit();
    rt.addShake(0.25, 6);

    return {
      isFreezeCinematic: true,
      timer: 0,
      duration,
      slashed: false,
      dead: false,
      update(dt, gg) {
        this.timer += dt;
        const liveTarget = gg.balls.find((b) => b !== owner && b.alive) || target;
        if (liveTarget) mahoraga.facing = liveTarget.x >= mahoraga.x ? 1 : -1;

        if (this.timer < chargeDur) {
          mahoraga.wheelAngle += dt * 14;
          mahoraga.slashAnim = -0.85 * Math.min(1, this.timer / 0.42);
        } else {
          if (!this.slashed) {
            this.slashed = true;
            mahoraga.finaleSlashFired = true;
            mahoraga.slashAnim = 1.45;
            mahoraga.wheelAngle += Math.PI / 2;
            const ang = liveTarget && liveTarget.alive
              ? Math.atan2(liveTarget.y - mahoraga.y, liveTarget.x - mahoraga.x)
              : (mahoraga.facing >= 0 ? 0 : Math.PI);
            gg.entities.push(spawnMahoragaWorldSlash(mahoraga.x, mahoraga.y, ang, owner, liveTarget, gg));
          }
          mahoraga.finaleTimer = Math.max(0, this.duration - this.timer);
          mahoraga.slashAnim = Math.max(0, mahoraga.slashAnim - dt * 3.2);
        }

        if (this.timer >= this.duration || !owner.alive) {
          gg.spawnSparks(mahoraga.x, mahoraga.y, "#09090b", "#facc15");
          gg.entities.push(rt.spawnShockRing(mahoraga.x, mahoraga.y, "#0f172a", 95, 0.32));
          mahoraga.dead = true;
          this.dead = true;
        }
      },
      render() {},
      renderOverlay(c) {
        const liveTarget = target && target.alive ? target : null;
        const ang = liveTarget
          ? Math.atan2(liveTarget.y - mahoraga.y, liveTarget.x - mahoraga.x)
          : (mahoraga.facing >= 0 ? 0 : Math.PI);

        c.save();
        if (this.timer < chargeDur) {
          const cp = Math.min(1, this.timer / chargeDur);
          // Dark void freeze veil
          c.fillStyle = `rgba(6, 4, 14, ${(0.56 * Math.min(1, cp * 2)).toFixed(3)})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          // Converging crimson & gold charge rings around Mahoraga
          const r1 = 92 * (1 - cp * 0.72);
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.5;
          c.beginPath(); c.arc(mahoraga.x, mahoraga.y, r1, 0, Math.PI * 2); c.stroke();
          c.strokeStyle = "#facc15";
          c.lineWidth = 2.2;
          c.beginPath(); c.arc(mahoraga.x, mahoraga.y, r1 * 0.65, 0, Math.PI * 2); c.stroke();

          // Razor-thin crimson targeting cut line through enemy
          c.strokeStyle = `rgba(239, 68, 68, ${(0.35 + cp * 0.55).toFixed(3)})`;
          c.lineWidth = 1.5 + cp * 2.5;
          c.setLineDash([12, 8]);
          c.beginPath();
          c.moveTo(mahoraga.x, mahoraga.y);
          c.lineTo(mahoraga.x + Math.cos(ang) * 760, mahoraga.y + Math.sin(ang) * 760);
          c.stroke();
          c.setLineDash([]);

          // Charge callout text
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineJoin = "round";
          c.font = "bold 24px 'Fredoka', 'Nunito', sans-serif";
          c.lineWidth = 6;
          c.strokeStyle = "#09090b";
          c.strokeText("WORLD-CUTTING SLASH!", WORLD_SIZE * 0.5, WORLD_SIZE - 54);
          c.fillStyle = "#ef4444";
          c.fillText("WORLD-CUTTING SLASH!", WORLD_SIZE * 0.5, WORLD_SIZE - 54);
        } else if (this.timer < chargeDur + 0.09) {
          // Brief white-crimson slash impact flash
          const fk = 1 - (this.timer - chargeDur) / 0.09;
          c.fillStyle = `rgba(254, 226, 226, ${(0.42 * fk).toFixed(3)})`;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        }
        c.restore();
      },
    };
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
      isSummon: true,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      facing: 1,
      life: 10.0,
      maxLife: 10.0,
      atkCd: 0.45,
      dashTimer: 0,
      dashDirX: 1,
      dashDirY: 0,
      dashHitDone: false,
      trail: [],
      finaleStarted: false,
      finaleTimer: 0,
      finaleSlashFired: false,
      slashAnim: 0,
      wheelAngle: 0,
      dead: false,
      update(dt, gg) {
        if (gg.entities.some((e) => e.isDomainClash && !e.dead)) return;
        this.life -= dt;
        this.wheelAngle += dt * (this.finaleStarted ? 9.5 : 2.2);
        if (this.slashAnim > 0) this.slashAnim = Math.max(0, this.slashAnim - dt * 3.8);

        if (!owner.alive) {
          this.dead = true;
          return;
        }

        const target = gg.balls.find((b) => b !== owner && b.alive);

        // Finale: freeze screen to charge & unleash World-Cutting Slash (30 DMG), then vanish!
        if (this.life <= 0.85 && !this.finaleStarted) {
          this.finaleStarted = true;
          this.finaleTimer = 0.39;
          this.dashTimer = 0;
          gg.spawnDamageText(this.x, this.y - 44, 0, "#ef4444", true, "ADAPTATION COMPLETE!");
          gg.entities.push(spawnMahoragaWorldSlashCinematic(this, owner, target, gg));
        }

        if (this.finaleStarted) {
          return;
        }

        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.facing = dx >= 0 ? 1 : -1;

        // 3s CD Auto-Lock Dash Lunge (10 DMG per hit)
        this.atkCd -= dt;
        if (this.atkCd <= 0 && this.dashTimer <= 0) {
          this.atkCd = 3.0;
          this.dashTimer = 0.28;
          this.dashDirX = dx / dist;
          this.dashDirY = dy / dist;
          this.dashHitDone = false;
          this.slashAnim = 1.0;
          this.wheelAngle += Math.PI / 4;
          gg.entities.push(rt.spawnShockRing(this.x, this.y, "#facc15", 66, 0.22));
        }

        if (this.dashTimer > 0) {
          this.dashTimer -= dt;
          this.trail.push({ x: this.x, y: this.y, facing: this.facing, life: 0.18 });
          const dashSpeed = 880;
          this.x = Math.max(42, Math.min(WORLD_SIZE - 42, this.x + this.dashDirX * dashSpeed * dt));
          this.y = Math.max(42, Math.min(WORLD_SIZE - 42, this.y + this.dashDirY * dashSpeed * dt));

          const hitDist = Math.hypot(target.x - this.x, target.y - this.y);
          if (!this.dashHitDone && hitDist <= 48 + target.radius) {
            this.dashHitDone = true;
            const dealt = gg.applyDamage(target, 6);
            target.flashTimer = 0.16;
            target.vx = this.dashDirX * 360;
            target.vy = this.dashDirY * 360;
            gg.entities.push(spawnCleaveSlashEffect(target.x, target.y, 54));
            gg.entities.push(rt.spawnShockRing(target.x, target.y, "#facc15", 82, 0.26));
            gg.spawnSparks(target.x, target.y, "#facc15", "#7dd3fc");
            gg.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#facc15", true, "MAHORAGA SLASH!");
            gg.sound.playBallHit();
          }
        } else {
          // Independent autonomous stalk/orbit around enemy (never follows Meguna)
          const desiredDist = 135;
          const dirX = dist > desiredDist ? dx / dist : (dist < desiredDist - 25 ? -dx / dist : -dy / dist);
          const dirY = dist > desiredDist ? dy / dist : (dist < desiredDist - 25 ? -dy / dist : dx / dist);
          const stalkSpeed = 240;
          this.x = Math.max(42, Math.min(WORLD_SIZE - 42, this.x + dirX * stalkSpeed * dt));
          this.y = Math.max(42, Math.min(WORLD_SIZE - 42, this.y + dirY * stalkSpeed * dt));
        }

        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].life -= dt;
          if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }
      },
      render(c) {
        // Afterimage trail during auto-lock lunge
        for (const tr of this.trail) {
          drawMahoragaEntity(c, {
            x: tr.x,
            y: tr.y,
            facing: tr.facing,
            wheelAngle: this.wheelAngle,
            slashAnim: this.slashAnim,
            alpha: (tr.life / 0.18) * 0.35,
            scale: 1,
          });
        }
        // Crimson-gold charge ring during finale
        if (this.finaleStarted && !this.finaleSlashFired) {
          c.save();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(this.x, this.y, 44 + Math.sin(performance.now() * 0.03) * 5, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        const alpha = this.finaleSlashFired ? Math.max(0, this.finaleTimer / 0.42) : Math.min(1, this.life * 2);
        drawMahoragaEntity(c, {
          x: this.x,
          y: this.y,
          facing: this.facing,
          wheelAngle: this.wheelAngle,
          slashAnim: this.slashAnim,
          alpha,
          scale: 1,
        });
      },
    };
  }

  let _shrineCache = null;
  function getIncompleteShrineCache() {
    if (_shrineCache) return _shrineCache;
    if (typeof document === "undefined") return null;
    const cw = 360;
    const ch = 420;
    const off = document.createElement("canvas");
    off.width = cw;
    off.height = ch;
    const c = off.getContext("2d");
    if (!c) return null;
    c.translate(cw * 0.5, ch * 0.62);

    // 1. Towering Abyssal Black-Crimson Cursed Pillars
    for (const [rx, rw, rh] of [[-128, 18, 175], [-88, 26, 225], [-44, 32, 255], [44, 32, 255], [88, 26, 225], [128, 18, 175]]) {
      const pGrad = c.createLinearGradient(rx, 130, rx, -rh);
      pGrad.addColorStop(0, "#09090b");
      pGrad.addColorStop(0.65, "#1f0509");
      pGrad.addColorStop(1, "rgba(127, 29, 29, 0)");
      c.fillStyle = pGrad;
      c.beginPath();
      c.moveTo(rx - rw * 0.65, 130);
      c.lineTo(rx - rw * 0.18, -rh);
      c.lineTo(rx + rw * 0.22, -rh + 32);
      c.lineTo(rx + rw * 0.65, 130);
      c.closePath();
      c.fill();
    }

    // 2. Skeletal Ribcage Bone Spikes jutting from both flanks
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const by = -48 + i * 32;
        const bx = side * (62 + i * 7);
        c.fillStyle = "#cbd5e1";
        c.strokeStyle = "#09090b";
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(bx * 0.72, by + 8);
        c.quadraticCurveTo(bx * 1.25, by - 14, bx * 1.52, by - 26);
        c.quadraticCurveTo(bx * 1.18, by + 4, bx * 0.72, by + 18);
        c.closePath();
        c.fill(); c.stroke();
      }
    }

    // 3. Sculpted Twisted Dark-Flesh Monolith Body
    const bodyGrad = c.createLinearGradient(0, -95, 0, 115);
    bodyGrad.addColorStop(0, "#450a0a");
    bodyGrad.addColorStop(0.45, "#2b090c");
    bodyGrad.addColorStop(1, "#0f0406");
    c.fillStyle = bodyGrad;
    c.strokeStyle = "#09090b";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-104, 108);
    c.bezierCurveTo(-116, 35, -96, -45, -54, -84);
    c.quadraticCurveTo(0, -108, 54, -84);
    c.bezierCurveTo(96, -45, 116, 35, 104, 108);
    c.closePath();
    c.fill(); c.stroke();

    // Organic cursed-flesh muscle/vein ridges
    c.strokeStyle = "rgba(185, 28, 28, 0.55)";
    c.lineWidth = 2.2;
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(side * 22, -74);
      c.quadraticCurveTo(side * 68, -22, side * 82, 85);
      c.moveTo(side * 42, -52);
      c.quadraticCurveTo(side * 86, 8, side * 94, 96);
      c.stroke();
    }

    // 4. Massive Sweeping Bone Horns & Crown Skull Crest
    for (const side of [-1, 1]) {
      c.fillStyle = "#e2e8f0";
      c.strokeStyle = "#09090b";
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(side * 20, -82);
      c.bezierCurveTo(side * 68, -148, side * 124, -124, side * 116, -62);
      c.bezierCurveTo(side * 96, -102, side * 58, -108, side * 34, -64);
      c.closePath();
      c.fill(); c.stroke();
      c.strokeStyle = "#64748b";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(side * 46, -102); c.lineTo(side * 52, -88);
      c.moveTo(side * 72, -110); c.lineTo(side * 74, -95);
      c.moveTo(side * 96, -104); c.lineTo(side * 92, -88);
      c.stroke();
    }

    // 5. Gaping Abyssal Maw, Sharp Fangs & Bleeding Crimson Drape
    c.fillStyle = "#09090b";
    c.strokeStyle = "#7f1d1d";
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, -12, 48, 38, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();
    c.fillStyle = "#f1f5f9";
    c.strokeStyle = "#09090b";
    c.lineWidth = 1.5;
    for (let tx = -34; tx <= 34; tx += 11.3) {
      c.beginPath(); c.moveTo(tx - 4.5, -24); c.lineTo(tx, -10); c.lineTo(tx + 4.5, -24); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(tx - 4.5, 16); c.lineTo(tx, 3); c.lineTo(tx + 4.5, 16); c.closePath(); c.fill(); c.stroke();
    }
    c.fillStyle = "#991b1b";
    c.strokeStyle = "#09090b";
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-46, -24);
    c.quadraticCurveTo(0, -56, 46, -24);
    c.lineTo(36, -14);
    c.quadraticCurveTo(0, -24, -36, -14);
    c.closePath();
    c.fill(); c.stroke();

    // 6. 8 Glowing Golden-Amber Eyes embedded asymmetrically in the Shrine
    const eyes = [
      [-40, -48, 11], [40, -48, 11],
      [-58, -10, 14], [58, -10, 14],
      [-52, 32, 13], [52, 32, 13],
      [-28, 64, 10], [28, 64, 10],
    ];
    for (const [ex, ey, er] of eyes) {
      c.fillStyle = "#fef9c3";
      c.strokeStyle = "#09090b";
      c.lineWidth = 2.6;
      c.beginPath(); c.ellipse(ex, ey, er, er * 0.58, ex < 0 ? 0.28 : -0.28, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = "#f59e0b";
      c.beginPath(); c.arc(ex, ey, er * 0.34, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#09090b";
      c.beginPath(); c.ellipse(ex, ey, er * 0.12, er * 0.32, 0, 0, Math.PI * 2); c.fill();
    }

    _shrineCache = off;
    return _shrineCache;
  }

  function drawIncompleteShrineStructure(c, cx, cy, scale, alpha, pulse = 0) {
    c.save();
    c.translate(cx, cy);
    c.scale(scale, scale);
    c.globalAlpha = alpha;

    // Lightweight pulsing crimson halo (no per-frame gradient allocation)
    c.fillStyle = "rgba(127, 29, 29, 0.28)";
    c.beginPath(); c.arc(0, -10, 175 + pulse * 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(220, 38, 38, 0.34)";
    c.beginPath(); c.arc(0, -10, 115 + pulse * 8, 0, Math.PI * 2); c.fill();

    const cached = getIncompleteShrineCache();
    if (cached) {
      c.drawImage(cached, -cached.width * 0.5, -cached.height * 0.62);
      c.restore();
      return;
    }

    // Fallback for headless/non-DOM environments
    c.fillStyle = "#2b090c";
    c.strokeStyle = "#09090b";
    c.lineWidth = 4;
    c.beginPath(); c.arc(0, 0, 95, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  }

  function spawnIncompleteShrineDomain(owner, g, customDuration = 10.0) {
    const duration = customDuration;
    g.entities.push(rt.spawnShockRing(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, "#dc2626", 290, 0.58));
    g.entities.push(rt.spawnShockRing(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5, "#09090b", 220, 0.45));
    g.sound.playCritHit();
    rt.addShake(0.45, 12);

    // Ambient ash embers & flying slash streaks inside the Domain
    const embers = [];
    for (let i = 0; i < 24; i++) {
      embers.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        vy: -28 - Math.random() * 44,
        vx: (Math.random() - 0.5) * 26,
        sz: 2 + Math.random() * 3,
      });
    }

    return {
      isDomain: true,
      isIncompleteShrine: true,
      domainType: "incomplete_shrine",
      domainName: "INCOMPLETE SHRINE",
      domainOwner: owner,
      life: duration,
      maxLife: duration,
      slashCd: 0.12,
      ambSlashCd: 0.08,
      slashes: [],
      embers,
      dead: false,
      update(dt, gg) {
        this.life -= dt;
        if (this.life <= 0 || !owner.alive) {
          this.dead = true;
          return;
        }
        for (const e of this.embers) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          if (e.y < -10) { e.y = WORLD_SIZE + 10; e.x = gg.rng() * WORLD_SIZE; }
        }
        for (let i = this.slashes.length - 1; i >= 0; i--) {
          this.slashes[i].life -= dt;
          if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
        }
        this.ambSlashCd -= dt;
        if (this.ambSlashCd <= 0) {
          this.ambSlashCd = 0.09;
          const sx = 45 + gg.rng() * (WORLD_SIZE - 90);
          const sy = 45 + gg.rng() * (WORLD_SIZE - 90);
          const ang = gg.rng() * Math.PI * 2;
          this.slashes.push({ x: sx, y: sy, ang, len: 55 + gg.rng() * 75, life: 0.2, maxLife: 0.2 });
        }
        this.slashCd -= dt;
        if (this.slashCd <= 0) {
          this.slashCd = 0.28;
          for (const tt of gg.balls) {
            if (tt === owner || !tt.alive) continue;
            const dealt = gg.applyDamage(tt, 2, { pierce: true });
            tt.flashTimer = 0.08;
            gg.entities.push(spawnCleaveSlashEffect(tt.x + (gg.rng() - 0.5) * 28, tt.y + (gg.rng() - 0.5) * 28, 48));
            gg.spawnDamageText(tt.x, tt.y - tt.radius - 12, dealt, "#ef4444", false, "SHRINE!");
            gg.sound.playBallHit();
          }
        }
      },
      render(c) {
        const k = Math.min(1, this.life * 2);
        const now = performance.now() * 0.004;
        const pulse = Math.sin(now * 2.2) * 0.5 + 0.5;
        c.save();

        // Deep crimson-black domain atmosphere + terrifying edge vignette (no per-frame gradient)
        c.fillStyle = `rgba(38, 4, 10, ${(0.36 * k).toFixed(3)})`;
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        c.strokeStyle = `rgba(9, 2, 5, ${(0.48 * k).toFixed(3)})`;
        c.lineWidth = WORLD_SIZE * 0.14;
        c.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Rotating dark-crimson Domain ring on arena floor
        c.save();
        c.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.55);
        c.rotate(now * 0.25);
        c.globalAlpha = 0.36 * k;
        c.strokeStyle = "#dc2626";
        c.lineWidth = 3;
        c.setLineDash([18, 12]);
        c.beginPath(); c.arc(0, 0, 175, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        c.restore();

        // Grand Incomplete Malevolent Shrine looming in the background
        drawIncompleteShrineStructure(c, WORLD_SIZE * 0.5, WORLD_SIZE * 0.44, 1.05, 0.72 * k, pulse);

        // Rising crimson/black ash embers
        for (const e of this.embers) {
          c.fillStyle = e.sz > 3.5 ? `rgba(239, 68, 68, ${(0.7 * k).toFixed(2)})` : `rgba(15, 23, 42, ${(0.75 * k).toFixed(2)})`;
          c.beginPath(); c.arc(e.x, e.y, e.sz, 0, Math.PI * 2); c.fill();
        }

        // Relentless arena-wide slash streaks
        c.lineCap = "round";
        for (const s of this.slashes) {
          const sk = Math.max(0, s.life / s.maxLife);
          const dx = Math.cos(s.ang) * s.len * 0.5;
          const dy = Math.sin(s.ang) * s.len * 0.5;
          c.globalAlpha = sk * 0.85 * k;
          c.strokeStyle = "#09090b";
          c.lineWidth = 6 * sk;
          c.beginPath(); c.moveTo(s.x - dx, s.y - dy); c.lineTo(s.x + dx, s.y + dy); c.stroke();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 2.5 * sk;
          c.stroke();
        }
        c.restore();
      },
    };
  }

  function spawnIncompleteShrineCinematic(owner, g) {
    const duration = 2.15;
    g.hitStop = duration;
    g.sound.playCritHit();
    rt.addShake(0.65, 14);

    // Precompute dramatic radial speedlines & slash fractures
    const rays = [];
    for (let i = 0; i < 18; i++) {
      rays.push((i / 18) * Math.PI * 2 + (i % 2) * 0.08);
    }

    return {
      isFreezeCinematic: true,
      timer: 0,
      duration,
      dead: false,
      update(dt, gg) {
        this.timer += dt;
        if (this.timer >= this.duration) {
          this.dead = true;
          gg.entities.push(spawnIncompleteShrineDomain(owner, gg));
        }
      },
      render() {},
      renderOverlay(c) {
        const p = Math.min(1, this.timer / this.duration);
        const cx = WORLD_SIZE * 0.5;
        const cy = WORLD_SIZE * 0.5;
        c.save();

        if (p < 0.40) {
          // Phase 1: Terrifying Gelap -> Terang -> Gelap -> Terang strobe flicker + domain fracture!
          const beat = Math.floor((p / 0.40) * 5);
          const isBright = beat % 2 === 1;
          c.fillStyle = isBright ? "rgba(254, 226, 226, 0.88)" : "rgba(6, 2, 8, 0.94)";
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          // Violent black-crimson slash fractures tearing across screen
          c.lineCap = "round";
          for (let i = 0; i < 4; i++) {
            c.strokeStyle = isBright ? "#09090b" : "#dc2626";
            c.lineWidth = 8 - i;
            c.beginPath();
            c.moveTo(20, 60 + ((beat * 70 + i * 110) % 420));
            c.lineTo(WORLD_SIZE - 20, WORLD_SIZE - 60 - ((beat * 55 + i * 95) % 380));
            c.stroke();
          }

          // Bold trembling warning text
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineJoin = "round";
          c.font = "bold 28px 'Fredoka', 'Nunito', sans-serif";
          c.lineWidth = 8;
          c.strokeStyle = isBright ? "#dc2626" : "#09090b";
          c.strokeText("DOMAIN EXPANSION...", cx, cy);
          c.fillStyle = isBright ? "#09090b" : "#fef2f2";
          c.fillText("DOMAIN EXPANSION...", cx, cy);
        } else {
          // Phase 2: Grand Incomplete Malevolent Shrine erupts in blood-red sky & speed-lines!
          const ep = (p - 0.40) / 0.60;
          const fadeOut = ep > 0.88 ? (1 - ep) / 0.12 : 1;

          // Blood-crimson abyssal sky backdrop
          const bg = c.createRadialGradient(cx, cy * 0.9, 30, cx, cy, WORLD_SIZE * 0.78);
          bg.addColorStop(0, `rgba(127, 29, 29, ${(0.92 * fadeOut).toFixed(3)})`);
          bg.addColorStop(0.55, `rgba(28, 4, 10, ${(0.94 * fadeOut).toFixed(3)})`);
          bg.addColorStop(1, `rgba(5, 2, 6, ${(0.96 * fadeOut).toFixed(3)})`);
          c.fillStyle = bg;
          c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

          // Radiating black & crimson impact speed-lines
          c.save();
          c.globalAlpha = 0.48 * fadeOut;
          for (let i = 0; i < rays.length; i++) {
            const a = rays[i] + ep * 0.12;
            c.strokeStyle = i % 2 === 0 ? "#09090b" : "#ef4444";
            c.lineWidth = i % 2 === 0 ? 5 : 2.5;
            c.beginPath();
            c.moveTo(cx + Math.cos(a) * 65, cy + Math.sin(a) * 65);
            c.lineTo(cx + Math.cos(a) * 440, cy + Math.sin(a) * 440);
            c.stroke();
          }
          c.restore();

          // Towering Shrine rising & zooming forward menacingly
          const riseY = cy * 1.12 - Math.min(1, ep * 1.6) * 52;
          const sc = 0.95 + Math.min(1, ep * 1.4) * 0.48;
          const pulse = Math.sin(ep * 18) * 0.5 + 0.5;
          drawIncompleteShrineStructure(c, cx, riseY, sc, fadeOut, pulse);

          // Expanding crimson Domain shockwave ring at lock-in
          if (ep > 0.55) {
            const rp = (ep - 0.55) / 0.45;
            c.strokeStyle = `rgba(239, 68, 68, ${((1 - rp) * 0.85 * fadeOut).toFixed(3)})`;
            c.lineWidth = 8 * (1 - rp) + 2;
            c.beginPath(); c.arc(cx, cy, 70 + rp * 340, 0, Math.PI * 2); c.stroke();
          }

          // Grand Title Banner at bottom
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.lineJoin = "round";
          c.globalAlpha = fadeOut;
          c.font = "bold 26px 'Fredoka', 'Nunito', sans-serif";
          c.lineWidth = 8;
          c.strokeStyle = "#09090b";
          c.strokeText("INCOMPLETE MALEVOLENT SHRINE!", cx, WORLD_SIZE - 52);
          c.fillStyle = "#ef4444";
          c.fillText("INCOMPLETE MALEVOLENT SHRINE!", cx, WORLD_SIZE - 52);
        }

        c.restore();
      },
    };
  }

  BF.triggerFugaExplosion = triggerFugaExplosion;
  BF.spawnMalevolentShrineDomain = spawnMalevolentShrineDomain;
  BF.spawnCleaveSlashEffect = spawnCleaveSlashEffect;
  BF.spawnMahoragaSummon = spawnMahoragaSummon;
  BF.spawnMahoragaRitualCinematic = spawnMahoragaRitualCinematic;
  BF.spawnIncompleteShrineCinematic = spawnIncompleteShrineCinematic;
  BF.spawnIncompleteShrineDomain = (optsOrOwner, g, customDuration) => {
    if (optsOrOwner && optsOrOwner.owner) {
      return spawnIncompleteShrineDomain(optsOrOwner.owner, g || rt.makeGameProxy(), optsOrOwner.duration || 8.0);
    }
    return spawnIncompleteShrineDomain(optsOrOwner, g || rt.makeGameProxy(), customDuration || 10.0);
  };
})();
