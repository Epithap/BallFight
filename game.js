(() => {
  const BF = window.BallFight;
  const {
    WORLD_SIZE,
    HIT_COOLDOWN,
    HIT_STOP_DURATION,
    DAMAGE_VARIATION,
    MIN_COMPONENT_RATIO,
    BOUNCE_KICK,
    ROUNDS_TO_WIN,
    KO_SLOWMO_DURATION,
    KO_SLOWMO_SCALE,
    KO_ZOOM_SCALE,
    CRIT_CHANCE,
    CRIT_DAMAGE,
    ULT_CHARGES_REQUIRED,
    COLORS,
    FONT,
    mulberry32,
    resolveInitialSeed,
    easeOut,
    SoundEngine,
    CHARACTER_ROSTER,
    TRANSFORM_DETAILS,
    DEFAULT_UNLOCKED_FIGHTERS,
    playerWallet,
    loadWallet,
    saveWallet,
    isFighterUnlocked,
    EVOLUTION_SPECS,
    isFighterEvolved,
    isEvolutionEquipped,
    setEvolutionEquipped,
    evolveFighter,
    SKIN_CATALOG,
    isSkinUnlocked,
    isSkinEquipped,
    setSkinEquipped,
    getEquippedSkinsForChar,
    getEquippedSkin,
    setEquippedSkin,
    buySkin,
    SHOP_CATALOG,
    TURBO_GRANNY_QUOTES,
    drawTurboGranny,
  } = BF;

  function getInfinitySlowFactor(targetBall, px, py) {
    if (!targetBall || !targetBall.alive || targetBall.costume !== "gojo" || !(targetBall.ultTimer > 0)) {
      return 1;
    }
    const d = Math.hypot(px - targetBall.x, py - targetBall.y);
    const outerR = targetBall.radius + 78;
    const innerR = targetBall.radius + 22;
    if (d >= outerR) return 1;
    if (d <= innerR) return 0;
    return Math.pow((d - innerR) / (outerR - innerR), 1.6);
  }

  // Helper to spawn a solid-outlined projectile entity aimed at the opponent
  function spawnProjectile({ owner, target, x, y, speed, radius, damage, color, label, shape, slashTilt = 0, onImpact, onOutOfBounds }) {
    const dx = target.x - x;
    const dy = target.y - y;
    const len = Math.hypot(dx, dy) || 1;
    const vx = (dx / len) * speed;
    const vy = (dy / len) * speed;
    const angle = Math.atan2(vy, vx);

    return {
      x,
      y,
      vx,
      vy,
      radius,
      angle,
      shape,
      slashTilt,
      spin: 0,
      infinityHoldTimer: 0,
      infinityTagged: false,
      dead: false,
      update(dt, game) {
        const infFactor = getInfinitySlowFactor(target, this.x, this.y);
        if (infFactor <= 0) {
          if (!this.infinityTagged) {
            this.infinityTagged = true;
            game.spawnDamageText(this.x, this.y - 16, 0, "#7dd3fc", false, "INFINITY!");
          }
          this.infinityHoldTimer += dt;
          if (this.infinityHoldTimer >= 1.1) {
            this.dead = true;
          }
          return;
        }
        this.x += this.vx * infFactor * dt;
        this.y += this.vy * infFactor * dt;
        this.trail = (this.trail || 0) - dt;
        if (this.trail <= 0 && shape !== "dismantle_slash") {
          this.trail = 0.035;
          particles.push({ x: this.x, y: this.y, vx: 0, vy: 0, size: this.radius * 0.55, life: 0.2, maxLife: 0.2, color });
        }
        if (shape === "rasenshuriken" || shape === "bijuudama" || shape === "gran_rey_cero" || shape === "limitless_red" || shape === "hollow_purple" || shape === "fuga_arrow") {
          this.spin += dt * (shape === "rasenshuriken" ? 28 : 18) * Math.max(0.2, infFactor);
        }

        // Rasenshuriken wind suction while flying toward target
        if (shape === "rasenshuriken" && target && target.alive) {
          const pdx = this.x - target.x;
          const pdy = this.y - target.y;
          const pDist = Math.hypot(pdx, pdy) || 1;
          if (pDist < 140) {
            const pull = 360 * (1 - pDist / 140);
            target.vx += (pdx / pDist) * pull * dt;
            target.vy += (pdy / pDist) * pull * dt;
          }
        }

        // Out of arena bounds
        if (
          this.x < -this.radius ||
          this.x > WORLD_SIZE + this.radius ||
          this.y < -this.radius ||
          this.y > WORLD_SIZE + this.radius
        ) {
          this.dead = true;
          if (onOutOfBounds) onOutOfBounds(game, this);
          return;
        }

        if (!target.alive) return;
        const dist = Math.hypot(target.x - this.x, target.y - this.y);
        if (dist <= target.radius + this.radius) {
          this.dead = true;
          const dealt = game.applyDamage(target, damage);
          target.flashTimer = 0.12;
          target.squash = 0.9;
          game.spawnSparks(this.x, this.y, color, target.color);
          game.spawnDamageText(target.x, target.y - target.radius * 0.5, dealt, color, false, label);
          game.sound.playBallHit();
          if (onImpact) onImpact(target, game, this);
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(shape === "rasenshuriken" ? this.spin : this.angle);
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.fillStyle = color;

        if (shape === "crescent") {
          // Getsuga Tensho crimson-black crescent slash
          c.beginPath();
          c.arc(0, 0, this.radius * 1.45, -Math.PI * 0.48, Math.PI * 0.48);
          c.quadraticCurveTo(
            this.radius * 0.3,
            0,
            Math.cos(-Math.PI * 0.48) * this.radius * 1.45,
            Math.sin(-Math.PI * 0.48) * this.radius * 1.45
          );
          c.closePath();
          c.fill();
          c.lineWidth = 4;
          c.stroke();
          // Inner bright edge
          c.strokeStyle = COLORS.white;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, this.radius * 1.18, -Math.PI * 0.35, Math.PI * 0.35);
          c.stroke();
        } else if (shape === "rasenshuriken") {
          if (BF.drawRasenshurikenDisc) {
            BF.drawRasenshurikenDisc(c, this.radius, this.spin, 1);
          }
        } else if (this.shape === "black_getsuga") {
          // Black Getsuga Tensho: pitch-black Bankai crescent with crimson-red spiritual pressure edge
          c.fillStyle = "rgba(220, 38, 38, 0.34)";
          c.beginPath();
          c.arc(0, 0, this.radius * 1.62, -Math.PI * 0.52, Math.PI * 0.52);
          c.quadraticCurveTo(
            this.radius * 0.18,
            0,
            Math.cos(-Math.PI * 0.52) * this.radius * 1.62,
            Math.sin(-Math.PI * 0.52) * this.radius * 1.62
          );
          c.closePath();
          c.fill();

          c.fillStyle = "#090205";
          c.strokeStyle = "#ef4444";
          c.lineWidth = 4;
          c.beginPath();
          c.arc(0, 0, this.radius * 1.48, -Math.PI * 0.5, Math.PI * 0.5);
          c.quadraticCurveTo(
            this.radius * 0.28,
            0,
            Math.cos(-Math.PI * 0.5) * this.radius * 1.48,
            Math.sin(-Math.PI * 0.5) * this.radius * 1.48
          );
          c.closePath();
          c.fill();
          c.stroke();

          c.strokeStyle = "#fecaca";
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(0, 0, this.radius * 1.22, -Math.PI * 0.36, Math.PI * 0.36);
          c.stroke();
        } else if (this.shape === "gran_rey_cero") {
          // Gran Rey Cero: crimson-black spatial distortion sphere
          const pulse = 1 + 0.09 * Math.sin(this.spin * 2.4);
          c.fillStyle = "rgba(220, 38, 38, 0.32)";
          c.beginPath();
          c.arc(0, 0, this.radius * 1.68 * pulse, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 2.6;
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.5, this.radius * 0.54, this.spin * 0.75, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#090205";
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.5, this.radius * 0.54, -this.spin * 0.75, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = "#dc2626";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, this.radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#090205";
          c.beginPath();
          c.arc(0, 0, this.radius * 0.68, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = COLORS.white;
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
          c.stroke();
        } else if (this.shape === "bijuudama") {
          // Dense compressed Bijuudama (Tailed Beast Bomb) sphere
          const pulse = 1 + 0.09 * Math.sin(this.spin * 2.2);
          c.fillStyle = "rgba(220, 38, 38, 0.28)";
          c.beginPath();
          c.arc(0, 0, this.radius * 1.65 * pulse, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 2.6;
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.48, this.radius * 0.56, this.spin * 0.7, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#c084fc";
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.48, this.radius * 0.56, -this.spin * 0.7, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = "#581c87";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, this.radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#0f0206";
          c.beginPath();
          c.arc(0, 0, this.radius * 0.74, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#fecaca";
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(0, 0, this.radius * 0.76, 0, Math.PI * 2);
          c.stroke();
        } else if (this.shape === "limitless_red") {
          // Elegant Reversal Red cursed energy orb
          c.fillStyle = "rgba(255, 30, 66, 0.28)";
          c.beginPath();
          c.arc(0, 0, this.radius * 1.55, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "rgba(255, 190, 205, 0.85)";
          c.lineWidth = 2;
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.35, this.radius * 0.55, this.spin * 0.7, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = "#ff1e42";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(0, 0, this.radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#fff0f4";
          c.beginPath();
          c.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
          c.fill();
        } else if (this.shape === "hollow_purple") {
          // Elegant Hollow Purple Imaginary Mass singularity
          const pulse = 1 + 0.08 * Math.sin(this.spin * 1.8);
          c.fillStyle = "rgba(168, 56, 255, 0.24)";
          c.beginPath();
          c.arc(0, 0, this.radius * 1.75 * pulse, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "rgba(232, 180, 255, 0.9)";
          c.lineWidth = 2.2;
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.55, this.radius * 0.58, this.spin * 0.6, 0, Math.PI * 2);
          c.stroke();
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.55, this.radius * 0.58, -this.spin * 0.6, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = "#9b2cff";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, this.radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#22053d";
          c.beginPath();
          c.arc(0, 0, this.radius * 0.64, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#f4d6ff";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, this.radius * 0.68, 0, Math.PI * 2);
          c.stroke();
        } else if (this.shape === "dismantle_slash") {
          // Sleek, razor-sharp curved crescent slash wave slicing straight forward
          const R = this.radius * 2.35;
          const cx0 = -R * 0.86;
          const aSpan = 0.56;
          const tx = cx0 + Math.cos(-aSpan) * R;
          const ty = Math.sin(-aSpan) * R;
          c.save();
          if (this.slashTilt) c.rotate(this.slashTilt);
          c.lineCap = "round";
          c.lineJoin = "round";

          // Straight wind-cut trails behind the curved slash
          c.strokeStyle = "rgba(239, 68, 68, 0.55)";
          c.lineWidth = 2.2;
          for (const wy of [-ty * 0.65, 0, ty * 0.65]) {
            c.beginPath();
            c.moveTo(-22, wy);
            c.lineTo(4, wy);
            c.stroke();
          }

          // Trailing ghost slash arc behind main blade
          c.strokeStyle = "rgba(185, 28, 28, 0.52)";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(cx0 - 9, 0, R, -aSpan * 0.88, aSpan * 0.88);
          c.stroke();

          // Sleek tapered curved crescent slash body
          c.fillStyle = "#dc2626";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3.2;
          c.beginPath();
          c.arc(cx0, 0, R, -aSpan, aSpan);
          c.quadraticCurveTo(cx0 + R * 0.89, 0, tx, ty);
          c.closePath();
          c.fill();
          c.stroke();

          // Razor white-hot leading edge along the curve
          c.strokeStyle = "#fff1f2";
          c.lineWidth = 2.2;
          c.beginPath();
          c.arc(cx0 - 1.5, 0, R, -aSpan * 0.78, aSpan * 0.78);
          c.stroke();
          c.restore();
        } else if (this.shape === "fuga_arrow") {
          // Blazing Divine Flame: Open (Fuga) Fire Arrow with multi-layer inferno aura
          const pulse = 1 + 0.12 * Math.sin(this.spin * 2.2);
          c.fillStyle = "rgba(220, 38, 38, 0.28)";
          c.beginPath();
          c.ellipse(-this.radius * 0.35, 0, this.radius * 2.5 * pulse, this.radius * 1.15 * pulse, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "rgba(249, 115, 22, 0.42)";
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.9 * pulse, this.radius * 0.78 * pulse, 0, 0, Math.PI * 2);
          c.fill();

          // Jagged flame tail streaks
          c.fillStyle = "#f97316";
          c.beginPath();
          c.moveTo(-this.radius * 0.4, -this.radius * 0.45);
          c.lineTo(-this.radius * 2.55, -this.radius * 0.18);
          c.lineTo(-this.radius * 1.65, 0);
          c.lineTo(-this.radius * 2.55, this.radius * 0.18);
          c.lineTo(-this.radius * 0.4, this.radius * 0.45);
          c.closePath();
          c.fill();

          c.fillStyle = "#ea580c";
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(this.radius * 1.6, 0);
          c.lineTo(this.radius * 0.25, -this.radius * 0.68);
          c.lineTo(this.radius * 0.4, -this.radius * 0.24);
          c.lineTo(-this.radius * 1.4, -this.radius * 0.24);
          c.lineTo(-this.radius * 1.0, 0);
          c.lineTo(-this.radius * 1.4, this.radius * 0.24);
          c.lineTo(this.radius * 0.4, this.radius * 0.24);
          c.lineTo(this.radius * 0.25, this.radius * 0.68);
          c.closePath();
          c.fill();
          c.stroke();

          c.fillStyle = "#fef9c3";
          c.beginPath();
          c.moveTo(this.radius * 1.25, 0);
          c.lineTo(-this.radius * 0.8, -this.radius * 0.14);
          c.lineTo(-this.radius * 0.8, this.radius * 0.14);
          c.closePath();
          c.fill();
        } else {
          // Kamehameha energy blast
          c.beginPath();
          c.ellipse(0, 0, this.radius * 1.35, this.radius * 0.9, 0, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = COLORS.white;
          c.beginPath();
          c.arc(this.radius * 0.2, 0, this.radius * 0.4, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      },
    };
  }



  function spawnShockRing(x, y, color, maxR = 90, life = 0.45) {
    return {
      x, y, life, maxLife: life, isTimeStopEntity: true, dead: false,
      update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        c.beginPath();
        c.arc(this.x, this.y, maxR * easeOut(p), 0, Math.PI * 2);
        c.lineWidth = 11 * (1 - p) + 2;
        c.strokeStyle = COLORS.ink;
        c.stroke();
        c.lineWidth = 5 * (1 - p) + 1;
        c.strokeStyle = color;
        c.stroke();
      },
    };
  }

  // Comic banner that slides across the arena when an ultimate starts
  function spawnBanner(text, color) {
    const dur = 1.0;
    return {
      life: dur, isTimeStopEntity: true, dead: false,
      update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; },
      render(c) {
        const t = 1 - this.life / dur;
        const slide = t < 0.15 ? easeOut(t / 0.15) : t > 0.8 ? 1 - easeOut((t - 0.8) / 0.2) : 1;
        const h = 56, y = WORLD_SIZE * 0.5 - h / 2, w = WORLD_SIZE * slide;
        c.save();
        c.beginPath();
        c.moveTo(-10, y); c.lineTo(w + 18, y); c.lineTo(w - 6, y + h); c.lineTo(-10, y + h);
        c.closePath();
        c.fillStyle = color; c.fill();
        c.lineWidth = 5; c.strokeStyle = COLORS.ink; c.lineJoin = "round"; c.stroke();
        c.globalAlpha = slide;
        c.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5);
        c.rotate(-0.04);
        c.font = `36px ${FONT}`;
        c.textAlign = "center"; c.textBaseline = "middle";
        c.lineWidth = 8; c.strokeText(text, 0, 2);
        c.fillStyle = COLORS.white; c.fillText(text, 0, 2);
        c.restore();
      },
    };
  }

  // Charge-up: ball freezes, a visual builds, then fire() runs.
  function beginCast(ball, { kind, duration, color, maxR = 22, blades = false, fire, renderCast }) {
    ball.cast = { kind, duration, color, maxR, blades, fire, renderCast, t: 0 };
    ball.channelTimer = duration;
    sound.playCharge(duration);
  }

  function drawCast(ball, c) {
    const k = ball.cast;
    if (!k) return;
    const p = Math.min(1, k.t / k.duration);
    const tg = balls.find((b) => b !== ball && b.alive);
    const ang = tg ? Math.atan2(tg.y - ball.y, tg.x - ball.x) : 0;
    const ux = Math.cos(ang), uy = Math.sin(ang);
    c.save();
    c.lineJoin = "round"; c.lineCap = "round";

    // progress ring around the caster
    c.beginPath();
    c.arc(ball.x, ball.y, ball.radius + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
    c.lineWidth = 7; c.strokeStyle = COLORS.ink; c.stroke();
    c.lineWidth = 3.5; c.strokeStyle = k.color; c.stroke();

    if (typeof k.renderCast === "function") {
      k.renderCast(ball, c, p, ang, tg);
    } else if (k.kind === "orb") {
      const R = k.maxR * (0.25 + 0.75 * easeOut(p));
      const ox = ball.x + ux * (ball.radius + R * 0.5 + 8);
      const oy = ball.y + uy * (ball.radius + R * 0.5 + 8);

      if (tg && p > 0.35) {
        c.save();
        c.setLineDash([10, 8]); c.lineWidth = 4; c.strokeStyle = k.color; c.globalAlpha = 0.7;
        c.beginPath(); c.moveTo(ox, oy); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      // energy streaks flowing into the orb
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + p * 2.5;
        const f = (p * 2.2 + i / 8) % 1;
        const d1 = R + 12 + (1 - f) * R * 1.6, d0 = d1 + 10;
        c.beginPath();
        c.moveTo(ox + Math.cos(a) * d0, oy + Math.sin(a) * d0);
        c.lineTo(ox + Math.cos(a) * d1, oy + Math.sin(a) * d1);
        c.lineWidth = 5; c.strokeStyle = COLORS.ink; c.stroke();
        c.lineWidth = 2; c.strokeStyle = COLORS.white; c.stroke();
      }
      c.save();
      c.translate(ox, oy);
      c.rotate(p * p * 40);
      if (k.blades && BF.drawRasenshurikenDisc) {
        const bp = Math.max(0, Math.min(1, (p - 0.25) / 0.75));
        BF.drawRasenshurikenDisc(c, R, p * p * 40, bp);
      } else {
        const cr = R;
        c.beginPath(); c.arc(0, 0, cr, 0, Math.PI * 2);
        c.fillStyle = k.color; c.fill();
        c.lineWidth = 4; c.strokeStyle = COLORS.ink; c.stroke();
        c.strokeStyle = COLORS.white; c.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 * i) / 3;
          c.beginPath(); c.arc(0, 0, cr * 0.62, a, a + Math.PI * 0.48); c.stroke();
        }
        c.fillStyle = COLORS.white;
        c.beginPath(); c.arc(0, 0, cr * 0.25, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    } else if (k.kind === "bijuudama") {
      const cx = ball.x + ux * (ball.radius + 26);
      const cy = ball.y + uy * (ball.radius + 26);
      if (tg && p > 0.45) {
        c.save();
        c.setLineDash([12, 8]); c.lineWidth = 5; c.strokeStyle = "#ef4444"; c.globalAlpha = 0.76;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      // Positive (black-violet) & Negative (crimson-red) chakra particles compressing into Bijuudama
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10 + p * 4.2;
        const f = (p * 2.6 + i / 10) % 1;
        const dist = (1 - f) * 44 + 10;
        const px = cx + Math.cos(a) * dist;
        const py = cy + Math.sin(a) * dist;
        c.fillStyle = i % 2 === 0 ? "#ef4444" : "#3b0764";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(px, py, 4.5 * (1 - f * 0.4), 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      const br = 12 + easeOut(p) * 20;
      c.fillStyle = "rgba(220, 38, 38, 0.34)";
      c.beginPath();
      c.arc(cx, cy, br * 1.55, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#581c87";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3.2;
      c.beginPath();
      c.arc(cx, cy, br, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#0f0206";
      c.beginPath();
      c.arc(cx, cy, br * 0.72, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#fecaca";
      c.lineWidth = 2.2;
      c.stroke();
    } else if (k.kind === "gran_rey_cero") {
      const cx = ball.x + ux * (ball.radius + 26);
      const cy = ball.y + uy * (ball.radius + 26);
      if (tg && p > 0.45) {
        c.save();
        c.setLineDash([12, 8]); c.lineWidth = 5; c.strokeStyle = "#ef4444"; c.globalAlpha = 0.78;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      // Crimson-black Cero spiritual lightning converging between Vasto Lorde horns
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 - p * 4.5;
        const f = (p * 2.5 + i / 8) % 1;
        const d1 = 12 + (1 - f) * 38;
        const d0 = d1 + 14;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0);
        c.lineTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1);
        c.lineWidth = 4.5; c.strokeStyle = "#090205"; c.stroke();
        c.lineWidth = 2.2; c.strokeStyle = "#ef4444"; c.stroke();
      }
      const cr = 12 + easeOut(p) * 21;
      c.fillStyle = "rgba(220, 38, 38, 0.35)";
      c.beginPath();
      c.arc(cx, cy, cr * 1.55, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#dc2626";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3.2;
      c.beginPath();
      c.arc(cx, cy, cr, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#090205";
      c.beginPath();
      c.arc(cx, cy, cr * 0.68, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = COLORS.white;
      c.lineWidth = 2.2;
      c.stroke();
    } else if (k.kind === "hollow_purple") {
      const cx = ball.x + ux * (ball.radius + 26);
      const cy = ball.y + uy * (ball.radius + 26);
      if (tg && p > 0.55) {
        c.save();
        c.setLineDash([12, 8]); c.lineWidth = 5; c.strokeStyle = "#c066ff"; c.globalAlpha = 0.72;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      if (p < 0.72) {
        const f = p / 0.72;
        const sep = (1 - f) * 34;
        const spin = f * Math.PI * 5;
        const rx = cx + Math.cos(spin) * sep;
        const ry = cy + Math.sin(spin) * sep;
        const bx = cx - Math.cos(spin) * sep;
        const by = cy - Math.sin(spin) * sep;
        for (const [ox, oy, col, core] of [[rx, ry, "#ff1e42", "#ffd6de"], [bx, by, "#00b4ff", "#d9f6ff"]]) {
          c.fillStyle = col;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.6;
          c.beginPath();
          c.arc(ox, oy, 11 + f * 4, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = core;
          c.beginPath();
          c.arc(ox, oy, 5, 0, Math.PI * 2);
          c.fill();
        }
      } else {
        const f = (p - 0.72) / 0.28;
        const pr = 18 + f * 14;
        c.fillStyle = "rgba(184, 77, 255, 0.35)";
        c.beginPath();
        c.arc(cx, cy, pr * 1.6, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#9b2cff";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(cx, cy, pr, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#22053d";
        c.beginPath();
        c.arc(cx, cy, pr * 0.56, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#f4d6ff";
        c.lineWidth = 2;
        c.stroke();
      }
    } else if (k.kind === "shrine_slash") {
      // Cursed slash arcs & targeting crosshair (no floating orb!)
      if (tg && p > 0.35) {
        c.save();
        c.setLineDash([8, 6]); c.lineWidth = 3; c.strokeStyle = k.color; c.globalAlpha = 0.65;
        c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      for (let i = -1; i <= 1; i++) {
        const arcR = ball.radius + 14 + p * 10;
        const a0 = i * 0.45 - 0.35;
        const a1 = i * 0.45 + 0.35;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 6;
        c.beginPath(); c.arc(0, 0, arcR, a0, a1); c.stroke();
        c.strokeStyle = k.color;
        c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, arcR, a0, a1); c.stroke();
      }
      c.restore();
    } else if (k.kind === "fuga_arrow") {
      const cx = ball.x + ux * (ball.radius + 28);
      const cy = ball.y + uy * (ball.radius + 28);
      if (tg && p > 0.4) {
        c.save();
        c.setLineDash([12, 8]); c.lineWidth = 5; c.strokeStyle = "#f97316"; c.globalAlpha = 0.82;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(tg.x, tg.y); c.stroke();
        c.restore();
      }
      // Swirling flame rings around Sukuna while drawing the Divine Flame bow
      c.save();
      c.translate(ball.x, ball.y);
      c.strokeStyle = "rgba(249, 115, 22, 0.75)";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, ball.radius + 18 + Math.sin(p * 18) * 3, p * 8, p * 8 + Math.PI * 1.4);
      c.stroke();
      c.strokeStyle = "rgba(254, 240, 138, 0.85)";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 0, ball.radius + 24, -p * 10, -p * 10 + Math.PI * 1.2);
      c.stroke();
      c.restore();

      c.save();
      c.translate(cx, cy);
      c.rotate(ang);
      const bowR = 28 + p * 10;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 8;
      c.beginPath();
      c.arc(-10, 0, bowR, -Math.PI * 0.46, Math.PI * 0.46);
      c.stroke();
      c.strokeStyle = "#fb923c";
      c.lineWidth = 4.5;
      c.beginPath();
      c.arc(-10, 0, bowR, -Math.PI * 0.46, Math.PI * 0.46);
      c.stroke();
      // Bowstring
      c.strokeStyle = "#fef08a";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-10 + Math.cos(-Math.PI * 0.46) * bowR, Math.sin(-Math.PI * 0.46) * bowR);
      c.lineTo(-10 - p * 10, 0);
      c.lineTo(-10 + Math.cos(Math.PI * 0.46) * bowR, Math.sin(Math.PI * 0.46) * bowR);
      c.stroke();

      c.fillStyle = "#fef08a";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      const len = 22 + p * 26;
      c.beginPath();
      c.moveTo(len, 0);
      c.lineTo(-12, -8);
      c.lineTo(-4, 0);
      c.lineTo(-12, 8);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    } else if (k.kind === "slash") {
      const e = easeOut(p);
      const R = k.maxR * (0.45 + 0.75 * e);
      // Targeting streak toward opponent
      if (tg && p > 0.25) {
        c.save();
        c.setLineDash([8, 7]);
        c.lineWidth = 3;
        c.strokeStyle = k.color;
        c.globalAlpha = 0.6;
        c.beginPath();
        c.moveTo(ball.x + ux * (ball.radius + 10), ball.y + uy * (ball.radius + 10));
        c.lineTo(tg.x, tg.y);
        c.stroke();
        c.restore();
      }
      // Sharp Cross-Blade Energy Charge & Reiatsu Sparks
      c.save();
      c.translate(ball.x + ux * (ball.radius + 16), ball.y + uy * (ball.radius + 16));
      c.rotate(ang);
      for (const sgn of [-1, 1]) {
        c.save();
        c.rotate(sgn * (0.72 - 0.3 * e));
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(-R * 1.15, 0);
        c.lineTo(R * 1.25, 0);
        c.stroke();

        c.strokeStyle = k.color;
        c.lineWidth = 3.6;
        c.beginPath();
        c.moveTo(-R * 1.1, 0);
        c.lineTo(R * 1.2, 0);
        c.stroke();

        c.strokeStyle = COLORS.white;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(-R * 0.75, 0);
        c.lineTo(R * 0.95, 0);
        c.stroke();
        c.restore();
      }
      // Core reiatsu spark diamond
      c.fillStyle = COLORS.white;
      c.strokeStyle = k.color;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(R * 0.55, 0);
      c.lineTo(0, R * 0.32);
      c.lineTo(-R * 0.4, 0);
      c.lineTo(0, -R * 0.32);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    } else if (k.kind === "gravity") {
      const e = easeOut(p);
      if (tg) {
        c.save();
        c.translate(tg.x, tg.y);
        const lockR = tg.radius + 26 * (1 - 0.55 * e);
        c.strokeStyle = k.color;
        c.lineWidth = 3;
        c.setLineDash([10, 6]);
        c.rotate(p * 3.5);
        c.beginPath();
        c.arc(0, 0, lockR, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      c.save();
      c.translate(ball.x + ux * (ball.radius + 14), ball.y + uy * (ball.radius + 14));
      c.rotate(ang);
      c.strokeStyle = k.color;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 12 + e * 12, -Math.PI * 0.42, Math.PI * 0.42);
      c.stroke();
      c.restore();
    } else if (k.kind === "inflate" || k.kind === "powerup") {
      for (let i = 0; i < 7; i++) {
        const a = (Math.PI * 2 * i) / 7 + p * 2;
        const f = (p * 2.2 + i / 7) % 1;
        const d = ball.radius * (0.85 + f * 1.1);
        c.globalAlpha = 1 - f;
        c.beginPath();
        c.arc(ball.x + Math.cos(a) * d, ball.y + Math.sin(a) * d - f * 12, 5 + f * 9, 0, Math.PI * 2);
        c.fillStyle = k.kind === "inflate" ? COLORS.white : k.color;
        c.fill();
        c.lineWidth = 3; c.strokeStyle = COLORS.ink; c.stroke();
      }
      c.globalAlpha = 1;
    } else if (k.kind === "dash" && tg) {
      const sx = ball.x + ux * (ball.radius + 10), sy = ball.y + uy * (ball.radius + 10);
      const len = 70 + 90 * p, ex = sx + ux * len, ey = sy + uy * len;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey);
      c.lineWidth = 10; c.strokeStyle = COLORS.ink; c.stroke();
      c.lineWidth = 4; c.strokeStyle = k.color; c.stroke();
      c.beginPath();
      c.moveTo(ex + ux * 14, ey + uy * 14);
      c.lineTo(ex - uy * 10, ey + ux * 10);
      c.lineTo(ex + uy * 10, ey - ux * 10);
      c.closePath();
      c.fillStyle = k.color; c.fill(); c.lineWidth = 3; c.strokeStyle = COLORS.ink; c.stroke();
    } else if (k.kind === "time_stop") {
      c.save();
      c.translate(ball.x, ball.y);
      c.fillStyle = `rgba(255, 215, 0, ${0.28 * (1 - p)})`;
      c.beginPath();
      c.arc(0, 0, ball.radius * (1.2 + 0.8 * p), 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = COLORS.gold;
      c.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + p * 0.6;
        const inner = ball.radius * (1.0 + p * 0.3);
        const outer = ball.radius * (1.5 + p * 0.9);
        c.beginPath();
        c.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        c.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        c.stroke();
      }
      c.restore();
    } else if (k.kind === "stand_rush") {
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 + p * 4;
        const d = ball.radius * (1.1 + 0.25 * Math.sin(p * 8 + i));
        c.fillStyle = COLORS.gold;
        c.beginPath();
        c.arc(ball.x + Math.cos(a) * d, ball.y + Math.sin(a) * d, 4 + p * 3, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }



  function castMuzzle(b, a, extra) {
    return { x: b.x + Math.cos(a) * (b.radius + extra), y: b.y + Math.sin(a) * (b.radius + extra) };
  }

  function spawnDelayedAction(delay, fn) {
    return {
      life: delay,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          fn(g);
        }
      },
      render() {},
    };
  }

  function triggerTimeResume() {
    timeStopTimer = 0;
    sound.playTimeResume();
    entities.push(spawnBanner("TIME RESUMES!", COLORS.gold));
    shakeTime = 0.22; shakeIntensity = 4.5;

    for (const ent of entities) {
      if (ent.isKnife && ent.state === "frozen") {
        ent.state = "unfrozen";
        if (ent.target) {
          ent.angle = Math.atan2(ent.target.y - ent.y, ent.target.x - ent.x);
        }
      }
    }
    // Detonate accumulated Jotaro Stopped-Time ORA impacts when time resumes!
    for (const b of balls) {
      if (b.alive && b.stoppedTimeHits > 0) {
        const hits = b.stoppedTimeHits;
        const burstAng = b.stoppedTimeAngle ?? 0;
        b.stoppedTimeHits = 0;
        const burstDmg = applyDamage(b, Math.min(12, hits * 2));
        b.flashTimer = 0.25;
        b.squash = 0.95;
        b.vx = Math.cos(burstAng) * 760;
        b.vy = Math.sin(burstAng) * 760;
        b.knockbackTimer = 0.36;
        entities.push(spawnShockRing(b.x, b.y, "#a855f7", 150, 0.42));
        spawnCritBurst(b.x, b.y);
        spawnDamageText(b.x, b.y - b.radius - 18, burstDmg, "#a855f7", true, `TOKI WA UGOKIDASU! (${hits}x ORA)`);
        sound.playCritHit();
        checkKO(b.x, b.y);
      }
    }
    if (timeStopOwner && timeStopOwner.alive) {
      timeStopOwner.ultTimer = 0;
    }
    timeStopOwner = null;
  }

  function spawnStandClashEffect(x, y, duration = 2.4, b1 = null, b2 = null, getMeter = null) {
    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      isTimeStopEntity: true,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const t = 1 - Math.max(0, this.life / this.maxLife);
        const pulse = 1 + Math.sin(t * 64) * 0.28;
        const meter = getMeter ? Math.max(0.1, Math.min(0.9, getMeter())) : 0.5;
        const p1Pct = Math.round(meter * 100);
        const p2Pct = 100 - p1Pct;
        const c1 = b1 ? (b1.costume === "dio" ? COLORS.gold : b1.color) : COLORS.gold;
        const c2 = b2 ? (b2.costume === "jotaro" ? "#a855f7" : b2.color) : "#a855f7";

        const s1 = b1 && b1.standState ? b1.standState : null;
        const clashAng = s1 ? s1.angle : 0;
        const dirX = Math.cos(clashAng);
        const dirY = Math.sin(clashAng);
        const perpX = -dirY;
        const perpY = dirX;
        // Shift clash front dynamically toward the losing side
        const pushOffset = (meter - 0.5) * 44;
        const frontX = this.x + dirX * pushOffset;
        const frontY = this.y + dirY * pushOffset;

        c.save();

        // 1. JoJo Theatrical Arena Dim + Split Stand Aura Field
        c.fillStyle = "rgba(12, 8, 24, 0.38)";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Radial speedlines from the clash front
        c.save();
        c.translate(frontX, frontY);
        for (let i = 0; i < 24; i++) {
          const a = (Math.PI * 2 * i) / 24 + (i % 2 ? t * 2.5 : -t * 2.5);
          const r0 = 56 + (i % 3) * 18;
          const r1 = 290;
          c.strokeStyle = i % 2 === 0 ? c1 : c2;
          c.globalAlpha = 0.22;
          c.lineWidth = i % 2 === 0 ? 3 : 1.8;
          c.beginPath();
          c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          c.stroke();
        }
        c.restore();

        // 2. Colliding Stand Fist Storm & Shockwave Core at (frontX, frontY)
        c.save();
        c.translate(frontX, frontY);

        const grad = c.createRadialGradient(0, 0, 4, 0, 0, 78 * pulse);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        grad.addColorStop(0.35, "rgba(250, 204, 21, 0.85)");
        grad.addColorStop(0.7, "rgba(168, 85, 247, 0.45)");
        grad.addColorStop(1, "rgba(250, 204, 21, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, 78 * pulse, 0, Math.PI * 2);
        c.fill();

        // Dual expanding shockwave rings
        for (let rIdx = 0; rIdx < 2; rIdx++) {
          const ringProg = (t * 6.5 + rIdx * 0.5) % 1;
          const ringR = 16 + ringProg * 72;
          c.strokeStyle = rIdx === 0 ? c1 : c2;
          c.globalAlpha = 0.9 * (1 - ringProg);
          c.lineWidth = 4 * (1 - ringProg) + 1.5;
          c.beginPath();
          c.arc(0, 0, ringR, 0, Math.PI * 2);
          c.stroke();
        }
        c.globalAlpha = 1;

        // 8 Colliding Fists from both sides slamming into the center line
        for (let i = 0; i < 4; i++) {
          const cyc = (t * 14 + i * 0.25) % 1;
          const dist = (1 - cyc) * 42 + 6;
          const spread = (i - 1.5) * 16 + Math.sin(t * 36 + i) * 5;

          // Left / Fighter 1 Fist
          const f1x = -dirX * dist + perpX * spread;
          const f1y = -dirY * dist + perpY * spread;
          drawStandFist(
            c,
            f1x,
            f1y,
            10.5,
            true,
            clashAng + Math.PI * 0.5,
            b1 && b1.costume === "jotaro" ? "#9b59b6" : COLORS.gold,
            b1 && b1.costume === "jotaro" ? COLORS.gold : "#2ecc71",
            COLORS.gold
          );

          // Right / Fighter 2 Fist
          const f2x = dirX * dist - perpX * spread;
          const f2y = dirY * dist - perpY * spread;
          drawStandFist(
            c,
            f2x,
            f2y,
            10.5,
            true,
            clashAng - Math.PI * 0.5,
            b2 && b2.costume === "jotaro" ? "#9b59b6" : COLORS.gold,
            b2 && b2.costume === "jotaro" ? COLORS.gold : "#2ecc71",
            COLORS.gold
          );
        }

        // Sharp comic impact star at exact collision point
        c.rotate(t * 22);
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          const rr = (i % 2 === 0 ? 28 : 11) * pulse;
          if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();

        // Floating Battle Cry Clash Text ("ORA ORA!!" vs "MUDA MUDA!!")
        c.save();
        const cry1 = b1 && b1.costume === "jotaro" ? "ORA ORA ORA!!" : "MUDA MUDA MUDA!!";
        const cry2 = b2 && b2.costume === "dio" ? "MUDA MUDA MUDA!!" : "ORA ORA ORA!!";
        const jitterX = Math.sin(t * 45) * 1;
        const jitterY = Math.cos(t * 42) * 1;
        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 4.5;
        c.strokeStyle = COLORS.ink;
        c.strokeText(cry1, frontX - dirX * 52 + jitterX, frontY - 52 + jitterY);
        c.fillStyle = c1;
        c.fillText(cry1, frontX - dirX * 52 + jitterX, frontY - 52 + jitterY);

        c.strokeText(cry2, frontX + dirX * 52 - jitterX, frontY + 52 - jitterY);
        c.fillStyle = c2;
        c.fillText(cry2, frontX + dirX * 52 - jitterX, frontY + 52 - jitterY);
        c.restore();

        // 3. Upgraded JoJo Tug-of-War Clash Meter at Top-Center
        const barW = 350;
        const barH = 30;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 72;
        const splitX = barX + barW * meter;

        // Header pill
        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 4.5;
        c.strokeStyle = COLORS.ink;
        c.strokeText("⚡ STAND BARRAGE CLASH! ⚡", WORLD_SIZE * 0.5, barY - 18);
        c.fillStyle = COLORS.gold;
        c.fillText("⚡ STAND BARRAGE CLASH! ⚡", WORLD_SIZE * 0.5, barY - 18);

        // Drop shadow
        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.roundRect(barX, barY + 4, barW, barH, 10);
        c.fill();

        // Clipped dual-color tug-of-war bar
        c.save();
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.clip();

        c.fillStyle = c1;
        c.fillRect(barX, barY, barW * meter, barH);
        c.fillStyle = c2;
        c.fillRect(splitX, barY, barW * (1 - meter), barH);

        // Gloss highlight
        c.fillStyle = "rgba(255, 255, 255, 0.25)";
        c.fillRect(barX, barY, barW, barH * 0.44);
        c.restore();

        // Thick ink border
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.stroke();

        // Glowing clash divider needle
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(splitX - 5, barY - 5, 10, barH + 10, 4);
        c.fill();
        c.stroke();

        // Percentage & fighter labels inside meter
        c.font = `bold 13px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        const n1 = b1 ? b1.name : "P1";
        const n2 = b2 ? b2.name : "P2";

        c.textAlign = "left";
        const leftText = `${n1} ${p1Pct}%`;
        c.strokeText(leftText, barX + 10, barY + barH * 0.5);
        c.fillStyle = p1Pct >= p2Pct ? COLORS.gold : COLORS.white;
        c.fillText(leftText, barX + 10, barY + barH * 0.5);

        c.textAlign = "right";
        const rightText = `${p2Pct}% ${n2}`;
        c.strokeText(rightText, barX + barW - 10, barY + barH * 0.5);
        c.fillStyle = p2Pct > p1Pct ? COLORS.gold : COLORS.white;
        c.fillText(rightText, barX + barW - 10, barY + barH * 0.5);

        c.restore();
      },
    };
  }

  function checkStandClash() {
    if (balls.length < 2) return;
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (!b1.alive || !b1.standState) continue;
      const s1 = b1.standState;
      if (s1.phase !== "dashing" && s1.phase !== "barraging") continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (!b2.alive || !b2.standState) continue;
        const s2 = b2.standState;
        if (s2.phase !== "dashing" && s2.phase !== "barraging") continue;

        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 64) {
          // Center the clash safely away from walls so both Stands and Users have room for the standoff & knockback
          const rawMidX = (s1.x + s2.x) * 0.5;
          const rawMidY = (s1.y + s2.y) * 0.5;
          const midX = Math.max(120, Math.min(WORLD_SIZE - 120, rawMidX));
          const midY = Math.max(130, Math.min(WORLD_SIZE - 110, rawMidY));
          const clashAng = Math.atan2(b2.y - b1.y, b2.x - b1.x) || 0;
          const sep = 34;
          const userDist = 80;
          const clashDuration = 2.4;
          const winnerIdx = rng() < 0.5 ? 0 : 1;

          // Position Users behind their Stands so User 1 -> Stand 1 ⚡ Stand 2 <- User 2 is clearly visible!
          b1.x = Math.max(b1.radius + 8, Math.min(WORLD_SIZE - b1.radius - 8, midX - Math.cos(clashAng) * userDist));
          b1.y = Math.max(b1.radius + 8, Math.min(WORLD_SIZE - b1.radius - 8, midY - Math.sin(clashAng) * userDist));
          b2.x = Math.max(b2.radius + 8, Math.min(WORLD_SIZE - b2.radius - 8, midX + Math.cos(clashAng) * userDist));
          b2.y = Math.max(b2.radius + 8, Math.min(WORLD_SIZE - b2.radius - 8, midY + Math.sin(clashAng) * userDist));

          s1.phase = "clashing";
          s1.x = midX - Math.cos(clashAng) * sep;
          s1.y = midY - Math.sin(clashAng) * sep;
          s1.angle = clashAng;
          s1.clashBaseX = s1.x;
          s1.clashBaseY = s1.y;
          s1.clashMidX = midX;
          s1.clashMidY = midY;
          s1.clashDuration = clashDuration;
          s1.clashTimer = clashDuration;
          s1.clashPulseTimer = 0;
          s1.clashMeter = 0.5;
          s1.clashWinnerIdx = winnerIdx;
          s1.clashPartner = b2;
          s1.clashPrimary = true;

          s2.phase = "clashing";
          s2.x = midX + Math.cos(clashAng) * sep;
          s2.y = midY + Math.sin(clashAng) * sep;
          s2.angle = clashAng + Math.PI;
          s2.clashBaseX = s2.x;
          s2.clashBaseY = s2.y;
          s2.clashMidX = midX;
          s2.clashMidY = midY;
          s2.clashDuration = clashDuration;
          s2.clashTimer = clashDuration;
          s2.clashPulseTimer = 0;
          s2.clashPartner = b1;
          s2.clashPrimary = false;

          b1.standAttackTimer = clashDuration + 0.5;
          b2.standAttackTimer = clashDuration + 0.5;

          entities.push(spawnStandClashEffect(midX, midY, clashDuration, b1, b2, () => s1.clashMeter));
          hitStop = 0.06;
          shakeTime = 0.14;
          shakeIntensity = 3;
          sound.playMudaRush();
          return;
        }
      }
    }
  }

  // Per-slot Evolution Override so P1 (slot 0) and P2 (slot 1) can independently pick Starter (Base) vs Evolved!
  const slotEvoOverrides = [{}, {}];

  function isSlotEvoEquipped(slotIdx, charId) {
    if (!isFighterEvolved || !isFighterEvolved(charId)) return false;
    const slotMap = slotEvoOverrides[slotIdx];
    if (slotMap && slotMap[charId] !== undefined) {
      return Boolean(slotMap[charId]);
    }
    return Boolean(isEvolutionEquipped && isEvolutionEquipped(charId));
  }

  function setSlotEvoEquipped(slotIdx, charId, enabled) {
    if (!isFighterEvolved || !isFighterEvolved(charId)) return false;
    // Lock in the other slot's current state before changing this slot so the other slot never flips!
    const otherSlot = slotIdx === 0 ? 1 : 0;
    if (slotEvoOverrides[otherSlot][charId] === undefined) {
      slotEvoOverrides[otherSlot][charId] = isSlotEvoEquipped(otherSlot, charId);
    }
    slotEvoOverrides[slotIdx][charId] = Boolean(enabled);
    if (setEvolutionEquipped) setEvolutionEquipped(charId, Boolean(enabled));
    return true;
  }

  function getEffectiveCharConfig(charId, slotIdx = null) {
    const base = CHARACTER_ROSTER[charId] || CHARACTER_ROSTER.goku;
    const spec = EVOLUTION_SPECS && EVOLUTION_SPECS[base.id];
    const useEvo = Boolean(
      spec && (slotIdx === 0 || slotIdx === 1
        ? isSlotEvoEquipped(slotIdx, base.id)
        : (isEvolutionEquipped && isEvolutionEquipped(base.id)))
    );
    const eqSkin = getEquippedSkin ? getEquippedSkin(base.id) : null;
    const eqSkins = getEquippedSkinsForChar ? getEquippedSkinsForChar(base.id) : (eqSkin ? [eqSkin] : []);
    if (!useEvo) return { ...base, evolved: false, skin: eqSkin, skins: eqSkins };
    return {
      ...base,
      evolved: true,
      skin: eqSkin,
      skins: eqSkins,
      name: spec.evolvedName || base.name,
      role: spec.evolvedRole || base.role,
      maxHp: base.maxHp + (spec.bonusHp || 0),
      speed: base.speed + (spec.bonusSpeed || 0),
    };
  }

  const selectedRosterIds = ["goku", "naruto"];
  const BALL_CONFIGS = [
    getEffectiveCharConfig(selectedRosterIds[0], 0),
    getEffectiveCharConfig(selectedRosterIds[1], 1),
  ];

  function refreshSlotConfigs() {
    BALL_CONFIGS[0] = getEffectiveCharConfig(selectedRosterIds[0], 0);
    BALL_CONFIGS[1] = getEffectiveCharConfig(selectedRosterIds[1], 1);
  }

  class Ball {
    constructor(config, { x, y, angle }) {
      this.name = config.name;
      this.evolved = Boolean(config.evolved);
      this.skin = config.skin || null;
      this.skins = Array.isArray(config.skins) ? [...config.skins] : (config.skin ? [config.skin] : []);
      this.color = config.color;
      this.radius = config.radius;
      this.baseRadius = config.radius;
      this.baseSpeed = config.speed;
      this.hp = config.maxHp;
      this.maxHp = config.maxHp;
      this.damageRange = config.damage;
      this.mass = config.mass;
      this.costume = config.costume || null;
      this.weapon = config.weapon || null;
      this.ult = config.ult || null;
      this.ultCharge = 0;
      this.ultTimer = 0;
      this.channelTimer = 0;
      this.cast = null;
      this.rocketTimer = 0;
      this.rocketHit = false;
      this.rasenganTimer = 0;
      this.rasenganHit = false;
      this.dragonRushTimer = 0;
      this.dragonRushHit = false;
      this.cleaveDashTimer = 0;
      this.cleaveDashHit = false;
      this.apeMode = false;
      this.apeErraticTimer = 0;
      this.kyuubiMode = false;
      this.kyuubiSlashTimer = 0;
      this.kyuubiSlashHit = false;
      this.vastoLordeMode = false;
      this.innerDemonMode = false;
      this.shunpoDashTimer = 0;
      this.shunpoDashHit = false;
      this.ichigoNextMove = "getsuga";
      this.standAttackTimer = 0;
      this.standState = null;
      this.knifeWaveTimer = 0;
      this.knifeWavesLeft = 0;
      this.weaponAngle = angle;
      // Start with partial cooldown so fighters clash first before casting skills
      this.skills = (config.skills || []).map((s) => ({
        ...s,
        _cd: s.initialCd !== undefined ? s.initialCd : (s.cooldown ? s.cooldown * (0.55 + rng() * 0.3) : 0),
      }));
      this.effects = [];

      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * this.baseSpeed;
      this.vy = Math.sin(angle) * this.baseSpeed;
      this.flashTimer = 0;
      this.squash = 0;
      this.alive = true;
    }

    normalizeSpeed() {
      const targetSpeed = this.baseSpeed;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed === 0) {
        const a = rng() * Math.PI * 2;
        this.vx = Math.cos(a) * targetSpeed;
        this.vy = Math.sin(a) * targetSpeed;
        return;
      }
      // Smoothly return toward targetSpeed while preserving direction
      const target = speed + (targetSpeed - speed) * 0.12;
      this.vx = (this.vx / speed) * target;
      this.vy = (this.vy / speed) * target;
    }

    preventAxisLock() {
      const targetSpeed = this.baseSpeed;
      const minComponent = targetSpeed * MIN_COMPONENT_RATIO;
      if (Math.abs(this.vx) < minComponent) {
        this.vx = (this.vx >= 0 ? 1 : -1) * minComponent;
      }
      if (Math.abs(this.vy) < minComponent) {
        this.vy = (this.vy >= 0 ? 1 : -1) * minComponent;
      }
      const speed = Math.hypot(this.vx, this.vy);
      this.vx = (this.vx / speed) * targetSpeed;
      this.vy = (this.vy / speed) * targetSpeed;
    }

    getEffect(type) {
      return this.effects.find((e) => e.type === type) || null;
    }

    getSpeedMultiplier() {
      if (this.getEffect("stun")) return 0;
      let mult = 1;
      for (const eff of this.effects) {
        if (eff.type === "slow") {
          mult *= eff.data?.factor ?? 0.5;
        } else if (eff.type === "haste") {
          mult *= eff.data?.factor ?? 1.35;
        }
      }
      return mult;
    }

    updateEffects(dt) {
      for (let i = this.effects.length - 1; i >= 0; i--) {
        this.effects[i].duration -= dt;
        if (this.effects[i].duration <= 0) {
          this.effects.splice(i, 1);
        }
      }
    }
  }

  // DOM elements
  const canvas = document.getElementById("arena");
  const ctx = canvas.getContext("2d");

  const btnPlay = document.getElementById("btn-play");
  const btnReset = document.getElementById("btn-reset");
  const btnSpeed = document.getElementById("btn-speed");
  const btnSound = document.getElementById("btn-sound");
  const btnRematch = document.getElementById("btn-rematch");
  const btnRec = document.getElementById("btn-rec");
  const btnRecExit = document.getElementById("btn-rec-exit");
  const btnRoster = document.getElementById("btn-roster");
  const btnChangeChar = document.getElementById("btn-change-char");
  const btnFight = document.getElementById("btn-fight");

  // Mobile Hub & Screens
  const screenPlay = document.getElementById("screen-play");
  const screenSetup = document.getElementById("screen-setup");
  const screenBattle = document.getElementById("screen-battle");
  const screenChars = document.getElementById("screen-chars");
  const screenProfile = document.getElementById("screen-profile");
  const screenShop = document.getElementById("screen-shop");

  const btnOpenSandbox = document.getElementById("btn-open-sandbox");
  const btnQuickFight = document.getElementById("btn-quick-fight");
  const btnSetupBack = document.getElementById("btn-setup-back");
  const btnStartBattle = document.getElementById("btn-start-battle");
  const btnBackToHub = document.getElementById("btn-back-to-hub");
  const btnBattleRec = document.getElementById("btn-battle-rec");

  const tabP1 = document.getElementById("tab-p1");
  const tabP2 = document.getElementById("tab-p2");
  const activeSlotBanner = document.getElementById("active-slot-banner");
  const previewActive = document.getElementById("preview-active");
  const previewActiveName = document.getElementById("preview-active-name");
  const previewActiveRole = document.getElementById("preview-active-role");
  const unifiedCharGrid = document.getElementById("unified-char-grid");

  const statValHp = document.getElementById("stat-val-hp");
  const statValSpd = document.getElementById("stat-val-spd");
  const statValMass = document.getElementById("stat-val-mass");
  const statValDmg = document.getElementById("stat-val-dmg");
  const matchupP1Tag = document.getElementById("matchup-p1-tag");
  const matchupP2Tag = document.getElementById("matchup-p2-tag");

  const homeP1Name = document.getElementById("home-p1-name");
  const homeP2Name = document.getElementById("home-p2-name");
  const homeP1Canvas = document.getElementById("home-p1-canvas");
  const homeP2Canvas = document.getElementById("home-p2-canvas");

  const rosterModal = document.getElementById("roster-modal");
  const btnModalClose = document.getElementById("btn-modal-close");
  const rosterAvatarGrid = document.getElementById("roster-avatar-grid");
  const rosterFilterChips = document.getElementById("roster-filter-chips");

  const detailHeroBox = document.getElementById("detail-hero-box");
  const detailCanvas = document.getElementById("detail-canvas");
  const detailName = document.getElementById("detail-name");
  const detailTitle = document.getElementById("detail-title");
  const detailFormToggle = document.getElementById("detail-form-toggle");
  const btnFormBase = document.getElementById("btn-form-base");
  const btnFormUlt = document.getElementById("btn-form-ult");
  const detailHpFill = document.getElementById("detail-hp-fill");
  const detailHpVal = document.getElementById("detail-hp-val");
  const detailSpdFill = document.getElementById("detail-spd-fill");
  const detailSpdVal = document.getElementById("detail-spd-val");
  const detailAtkFill = document.getElementById("detail-atk-fill");
  const detailAtkVal = document.getElementById("detail-atk-val");
  const detailMassFill = document.getElementById("detail-mass-fill");
  const detailMassVal = document.getElementById("detail-mass-val");
  const detailSkillName = document.getElementById("detail-skill-name");
  const detailSkillCd = document.getElementById("detail-skill-cd");
  const detailSkillDesc = document.getElementById("detail-skill-desc");
  const detailUltName = document.getElementById("detail-ult-name");
  const detailUltDesc = document.getElementById("detail-ult-desc");
  const detailEmpoweredBox = document.getElementById("detail-empowered-box");
  const detailEmpCd = document.getElementById("detail-emp-cd");
  const detailEmpName = document.getElementById("detail-emp-name");
  const detailEmpDesc = document.getElementById("detail-emp-desc");
  const detailAuraStatus = document.getElementById("detail-aura-status");
  const detailAuraRow = document.getElementById("detail-aura-row");

  let detailFormId = "base";
  const shopCoinsDisplay = document.getElementById("shop-coins-display");
  const shopGemsDisplay = document.getElementById("shop-gems-display");
  const merchantCanvas = document.getElementById("merchant-canvas");
  const merchantSpeechText = document.getElementById("merchant-speech-text");
  const shopFilterChips = document.getElementById("shop-filter-chips");
  const shopItemsGrid = document.getElementById("shop-items-grid");

  const shopModal = document.getElementById("shop-modal");
  const btnShopModalClose = document.getElementById("btn-shop-modal-close");
  const shopModalCanvas = document.getElementById("shop-modal-canvas");
  const shopModalType = document.getElementById("shop-modal-type");
  const shopModalPrice = document.getElementById("shop-modal-price");
  const shopModalTitle = document.getElementById("shop-modal-title");
  const shopModalDesc = document.getElementById("shop-modal-desc");
  const btnShopModalAction = document.getElementById("btn-shop-modal-action");

  let activeShopFilter = "all";
  let previewShopItemId = "fighter_dio";

  const profMatches = document.getElementById("prof-matches");
  const profWins = document.getElementById("prof-wins");
  const profWr = document.getElementById("prof-wr");
  const profFav = document.getElementById("prof-fav");

  const name1 = document.getElementById("name-1");
  const name2 = document.getElementById("name-2");
  const hpText1 = document.getElementById("hp-text-1");
  const hpText2 = document.getElementById("hp-text-2");
  const hpBar1 = document.getElementById("hp-bar-1");
  const hpBar2 = document.getElementById("hp-bar-2");
  const dots1 = document.getElementById("dots-1");
  const dots2 = document.getElementById("dots-2");
  const skillHud1 = document.getElementById("skill-hud-1");
  const skillHud2 = document.getElementById("skill-hud-2");
  const ultHud1 = document.getElementById("ult-hud-1");
  const ultHud2 = document.getElementById("ult-hud-2");

  const overlay = document.getElementById("overlay");
  const overlayStamp = document.getElementById("overlay-stamp");
  const winnerText = document.getElementById("winner-text");
  const statsText = document.getElementById("stats-text");
  const statusHits = document.getElementById("status-hits");
  const statusTime = document.getElementById("status-time");
  const seedDisplay = document.getElementById("seed-display");

  const sound = new SoundEngine();

  let matchSeed = resolveInitialSeed();
  let rng = mulberry32(matchSeed);

  let balls = [];
  let particles = [];
  let floatingTexts = [];
  let entities = [];
  let scores = [0, 0];
  let currentRound = 1;
  let selecting = true;
  let running = false;
  let roundOver = false;
  let matchOver = false;
  let recMode = false;
  let speedMultiplier = 1;
  let hitCooldown = 0;

  // Mobile Hub State
  let currentScreen = "screen-play"; // default is Play screen
  let activeSlot = 0; // 0 for P1, 1 for P2 in Sandbox Setup
  let detailCharId = "goku";
  const sessionStats = {
    matches: 0,
    wins: 0,
    charsUsed: {},
  };
  try { Object.assign(sessionStats, JSON.parse(localStorage.getItem("bf_profile_v1") || "{}")); } catch (_) {}

  let hitStop = 0;
  let shakeTime = 0;
  let shakeIntensity = 0;
  let totalHits = 0;
  let elapsed = 0;
  let timeStopTimer = 0;
  let timeStopOwner = null;
  let koSequence = null;
  let cameraZoom = 1;
  let cameraX = WORLD_SIZE * 0.5;
  let cameraY = WORLD_SIZE * 0.5;
  let lastTime = performance.now();

  function randomStartAngle() {
    // Full 360-degree random direction, avoiding near-horizontal/vertical axis lock
    const quadrant = Math.floor(rng() * 4);
    const offset = 0.28 + rng() * (Math.PI * 0.5 - 0.56);
    return quadrant * (Math.PI * 0.5) + offset;
  }

  const game = {
    get balls() { return balls; },
    get entities() { return entities; },
    rng: () => rng(),
    spawnSparks,
    spawnDamageText,
    applyDamage,
    addEffect,
    chargeUlt,
    sound,
  };

  Object.defineProperties(BF.rt, {
    balls: { get: () => balls, configurable: true },
    entities: { get: () => entities, configurable: true },
    particles: { get: () => particles, configurable: true },
    timeStopTimer: { get: () => timeStopTimer, configurable: true },
    elapsed: { get: () => elapsed, configurable: true },
    ctx: { get: () => ctx, configurable: true },
  });
  Object.assign(BF.rt, {
    rng: () => rng(),
    sound,
    beginCast,
    castMuzzle,
    spawnProjectile,
    spawnShockRing,
    spawnBanner,
    spawnDelayedAction,
    getInfinitySlowFactor,
    applyDamage,
    chargeUlt,
    spawnSparks,
    spawnDamageText,
    drawHeart,
    drawStandFist,
    drawSkinFace,
    setHitStop: (v) => { hitStop = Math.max(hitStop, v); },
    addShake: (t, i) => {
      shakeTime = Math.max(shakeTime, t);
      shakeIntensity = Math.max(shakeIntensity, i);
    },
    triggerDomainExpansion,
  });

  function spawnDomainClashEffect(x, y, duration, b1, b2, spec1, spec2, g) {
    const b1IsLeft = b1.x <= b2.x;
    const leftB = b1IsLeft ? b1 : b2;
    const rightB = b1IsLeft ? b2 : b1;
    const leftSpec = b1IsLeft ? spec1 : spec2;
    const rightSpec = b1IsLeft ? spec2 : spec1;

    let meter = 0.5;
    let meterVel = 0;
    let resolved = false;
    const shrineSlashes = [];
    const barrierShards = [];
    for (let i = 0; i < 14; i++) {
      barrierShards.push({
        yOff: (i / 14) * WORLD_SIZE + 15,
        xOff: (rng() - 0.5) * 44,
        size: 7 + rng() * 10,
        rot: rng() * Math.PI * 2,
        vRot: (rng() - 0.5) * 8,
        side: i % 2 === 0 ? -1 : 1,
      });
    }

    function renderSideDomain(c, spec, fighter, centerX, isLeft, t) {
      if (spec.type === "malevolent_shrine") {
        c.fillStyle = "#160205";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Radial manga speed-lines behind Shrine
        c.save();
        c.translate(centerX, WORLD_SIZE * 0.44);
        c.strokeStyle = "rgba(220, 38, 38, 0.22)";
        c.lineWidth = 2.5;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 + t * 0.6;
          c.beginPath();
          c.moveTo(Math.cos(a) * 45, Math.sin(a) * 45);
          c.lineTo(Math.cos(a) * 320, Math.sin(a) * 320);
          c.stroke();
        }
        c.restore();

        if (BF.drawMalevolentShrineBackdrop) {
          BF.drawMalevolentShrineBackdrop(c, centerX, WORLD_SIZE * 0.45, 0.92, t, 1);
        }

        // Cursed Shrine aura seal beneath Sukuna
        if (fighter && fighter.alive) {
          c.save();
          c.translate(fighter.x, fighter.y);
          c.strokeStyle = "#dc2626";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 16 + Math.sin(t * 28) * 3, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#fca5a5";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 9, t * 10, t * 10 + Math.PI * 1.3);
          c.stroke();
          c.restore();
        }

        // Relentless Shrine slashes tearing across Sukuna's domain side
        c.lineCap = "round";
        for (const s of shrineSlashes) {
          const sx = isLeft ? s.rx * centerX * 1.9 : centerX + (s.rx - 0.5) * (WORLD_SIZE - centerX) * 1.8;
          c.save();
          c.translate(sx, s.y);
          c.rotate(s.ang);
          c.globalAlpha = Math.max(0, s.life / 0.2);
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ef4444";
          c.lineWidth = 3.2;
          c.beginPath();
          c.moveTo(-s.len, 0);
          c.lineTo(s.len, 0);
          c.stroke();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(-s.len * 0.72, 0);
          c.lineTo(s.len * 0.72, 0);
          c.stroke();
          c.restore();
        }
      } else {
        c.fillStyle = "#020612";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Cosmic nebula streaks & infinity grid lines
        c.save();
        c.translate(centerX, WORLD_SIZE * 0.43);
        c.strokeStyle = "rgba(56, 189, 248, 0.2)";
        c.lineWidth = 2;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2 - t * 0.7;
          c.beginPath();
          c.moveTo(Math.cos(a) * 52, Math.sin(a) * 52);
          c.lineTo(Math.cos(a) * 320, Math.sin(a) * 320);
          c.stroke();
        }
        c.restore();

        if (BF.drawUnlimitedVoidBackdrop) {
          BF.drawUnlimitedVoidBackdrop(c, centerX, WORLD_SIZE * 0.43, 0.92, t, 1);
        }

        // Iconic white manga ink splatters & spatial streaks on Gojo's side
        const edgeX = isLeft ? 28 : WORLD_SIZE - 28;
        const dir = isLeft ? 1 : -1;
        c.fillStyle = "#ffffff";
        for (const [ox, oy, r] of [[0, 38, 16], [dir * 26, 24, 10], [dir * 8, 72, 12], [0, 420, 18], [dir * 28, 442, 13]]) {
          c.beginPath();
          c.arc(edgeX + ox, oy, r, 0, Math.PI * 2);
          c.fill();
        }
        c.strokeStyle = "#ffffff";
        c.lineWidth = 5;
        c.lineCap = "round";
        c.beginPath();
        c.moveTo(edgeX, 24);
        c.lineTo(edgeX + dir * 88, 96);
        c.moveTo(edgeX, 438);
        c.lineTo(edgeX + dir * 94, 388);
        c.stroke();

        // Six Eyes Infinity halo beneath Gojo
        if (fighter && fighter.alive) {
          c.save();
          c.translate(fighter.x, fighter.y);
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 16 + Math.sin(t * 28) * 3, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#e0f2fe";
          c.lineWidth = 2;
          c.beginPath();
          c.arc(0, 0, fighter.radius + 9, -t * 10, -t * 10 + Math.PI * 1.3);
          c.stroke();
          c.restore();
        }
      }
    }

    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      isDomainClash: true,
      dead: false,
      update(dt) {
        this.life -= dt;
        const t = 1 - Math.max(0, this.life / this.maxLife);

        // Dynamic tug-of-war oscillation with high-tension swings
        meterVel += (rng() - 0.5) * 2.4 * dt;
        meterVel += (0.5 - meter) * 1.8 * dt;
        meterVel *= 0.92;
        meter = Math.max(0.24, Math.min(0.76, meter + meterVel + (rng() - 0.5) * 0.035));

        const splitX = WORLD_SIZE * meter;
        // Stage left & right fighters in front of their towering Domains like the manga panel!
        if (leftB && leftB.alive) {
          const targetLX = Math.max(leftB.radius + 36, Math.min(splitX - leftB.radius - 32, splitX * 0.5));
          const targetLY = WORLD_SIZE * 0.66;
          leftB.x += (targetLX - leftB.x) * Math.min(1, dt * 10) + (rng() - 0.5) * 3.2;
          leftB.y += (targetLY - leftB.y) * Math.min(1, dt * 10) + (rng() - 0.5) * 3.2;
          leftB.vx = 0;
          leftB.vy = 0;
          leftB.domainClashTimer = Math.max(0.05, this.life);
        }
        if (rightB && rightB.alive) {
          const targetRX = Math.min(WORLD_SIZE - rightB.radius - 36, Math.max(splitX + rightB.radius + 32, splitX + (WORLD_SIZE - splitX) * 0.5));
          const targetRY = WORLD_SIZE * 0.66;
          rightB.x += (targetRX - rightB.x) * Math.min(1, dt * 10) + (rng() - 0.5) * 3.2;
          rightB.y += (targetRY - rightB.y) * Math.min(1, dt * 10) + (rng() - 0.5) * 3.2;
          rightB.vx = 0;
          rightB.vy = 0;
          rightB.domainClashTimer = Math.max(0.05, this.life);
        }

        if (rng() < 0.9) {
          shrineSlashes.push({
            rx: 0.12 + rng() * 0.76,
            y: 45 + rng() * (WORLD_SIZE - 90),
            ang: (rng() - 0.5) * Math.PI * 0.85,
            len: 26 + rng() * 44,
            life: 0.2,
          });
        }
        for (let i = shrineSlashes.length - 1; i >= 0; i--) {
          shrineSlashes[i].life -= dt;
          if (shrineSlashes[i].life <= 0) shrineSlashes.splice(i, 1);
        }
        for (const sh of barrierShards) {
          sh.rot += sh.vRot * dt;
        }

        // Periodic clash shockwaves & sparks along the boundary
        if (rng() < 0.35) {
          const sy = 80 + rng() * (WORLD_SIZE - 160);
          particles.push({
            x: splitX + (rng() - 0.5) * 18,
            y: sy,
            vx: (rng() - 0.5) * 220,
            vy: (rng() - 0.5) * 220,
            size: 4 + rng() * 4,
            life: 0.22,
            maxLife: 0.22,
            color: rng() < 0.5 ? leftSpec.color : rightSpec.color,
          });
        }
        shakeTime = Math.max(shakeTime, 0.06);
        shakeIntensity = Math.max(shakeIntensity, 1.5);

        if (this.life <= 0 && !resolved) {
          resolved = true;
          this.dead = true;
          b1.domainClashTimer = 0;
          b2.domainClashTimer = 0;
          const leftWins = rng() < 0.5;
          const winner = leftWins ? leftB : rightB;
          const loser = leftWins ? rightB : leftB;
          const winSpec = leftWins ? leftSpec : rightSpec;

          const dealt = g.applyDamage(loser, 18);
          const kAng = Math.atan2(loser.y - winner.y, loser.x - winner.x);
          loser.vx = Math.cos(kAng) * 650;
          loser.vy = Math.sin(kAng) * 650;
          loser.flashTimer = 0.22;
          loser.squash = 1.0;

          g.entities.push(spawnShockRing(splitX, WORLD_SIZE * 0.5, winSpec.color, 220, 0.55));
          g.entities.push(spawnShockRing(splitX, WORLD_SIZE * 0.5, COLORS.white, 150, 0.38));
          g.entities.push(spawnBanner(`DOMAIN OVERPOWER: ${winSpec.name}!`, winSpec.color));
          g.spawnDamageText(loser.x, loser.y - loser.radius - 16, dealt, winSpec.color, true, "DOMAIN SHATTERED!");
          g.sound.playCritHit();
          shakeTime = Math.max(shakeTime, 0.48);
          shakeIntensity = Math.max(shakeIntensity, 11);

          if (winSpec.createDomain) {
            g.entities.push(winSpec.createDomain());
          }
          if (winSpec.onStart) {
            winSpec.onStart(g);
          }
        }
      },
      render(c) {
        const t = 1 - Math.max(0, this.life / this.maxLife);
        const splitX = WORLD_SIZE * meter;
        const leftCenterX = splitX * 0.5;
        const rightCenterX = splitX + (WORLD_SIZE - splitX) * 0.5;

        // Build jagged spatial fault line from top to bottom
        const segs = 14;
        const faultPts = [];
        for (let i = 0; i <= segs; i++) {
          const py = (i / segs) * WORLD_SIZE;
          const edgeDamp = i === 0 || i === segs ? 0 : 1;
          const wave = Math.sin(t * 38 + i * 1.9) * 11 + Math.cos(t * 62 - i * 2.7) * 6;
          faultPts.push([splitX + wave * edgeDamp, py]);
        }

        c.save();

        // 1. LEFT SORCERER DOMAIN TERRITORY (Clipped to left of spatial fault line)
        c.save();
        c.beginPath();
        c.moveTo(0, 0);
        for (const [fx, fy] of faultPts) c.lineTo(fx, fy);
        c.lineTo(0, WORLD_SIZE);
        c.closePath();
        c.clip();
        renderSideDomain(c, leftSpec, leftB, leftCenterX, true, t);
        c.restore();

        // 2. RIGHT SORCERER DOMAIN TERRITORY (Clipped to right of spatial fault line)
        c.save();
        c.beginPath();
        c.moveTo(WORLD_SIZE, 0);
        for (const [fx, fy] of faultPts) c.lineTo(fx, fy);
        c.lineTo(WORLD_SIZE, WORLD_SIZE);
        c.closePath();
        c.clip();
        renderSideDomain(c, rightSpec, rightB, rightCenterX, false, t);
        c.restore();

        // 3. FLOATING SHATTERED BARRIER GLASS SHARDS ALONG THE RIFT
        for (const sh of barrierShards) {
          c.save();
          c.translate(splitX + sh.xOff, sh.yOff);
          c.rotate(sh.rot);
          c.fillStyle = sh.side < 0 ? leftSpec.color : rightSpec.color;
          c.strokeStyle = COLORS.white;
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(0, -sh.size);
          c.lineTo(sh.size * 0.75, sh.size * 0.2);
          c.lineTo(-sh.size * 0.6, sh.size * 0.8);
          c.closePath();
          c.fill();
          c.stroke();
          c.restore();
        }

        // 4. SPATIAL FAULT LINE & CURSED LIGHTNING CRACKS
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";

        // Outer cursed energy clash glow
        c.strokeStyle = "#a855f7";
        c.lineWidth = 16 + Math.sin(t * 50) * 4;
        c.globalAlpha = 0.55;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();
        c.globalAlpha = 1;

        // Thick black manga crack border
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 10;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();

        // Blinding white spatial fracture core
        c.strokeStyle = COLORS.white;
        c.lineWidth = 4.5;
        c.beginPath();
        for (let i = 0; i < faultPts.length; i++) {
          if (i === 0) c.moveTo(faultPts[i][0], faultPts[i][1]);
          else c.lineTo(faultPts[i][0], faultPts[i][1]);
        }
        c.stroke();

        // Branching lateral lightning arcs off the fault line
        for (let i = 2; i < faultPts.length - 2; i += 2) {
          const [bx, by] = faultPts[i];
          const dir = i % 4 === 0 ? -1 : 1;
          const col = dir < 0 ? leftSpec.color : rightSpec.color;
          const reach = 26 + Math.sin(t * 45 + i) * 14;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(bx, by);
          c.lineTo(bx + dir * reach * 0.55, by - 10);
          c.lineTo(bx + dir * reach, by + 8);
          c.stroke();
          c.strokeStyle = col;
          c.lineWidth = 2.5;
          c.stroke();
        }

        // Central Clash Singularity Core where both domains collide
        const coreY = WORLD_SIZE * 0.52;
        const coreX = faultPts[Math.floor(segs * 0.52)][0];
        const pulse = 1 + Math.sin(t * 55) * 0.22;
        c.save();
        c.translate(coreX, coreY);
        c.fillStyle = "rgba(168, 85, 247, 0.38)";
        c.beginPath();
        c.arc(0, 0, 46 * pulse, 0, Math.PI * 2);
        c.fill();

        // Sharp manga impact rays at collision point
        for (let i = 0; i < 12; i++) {
          const ang = (Math.PI * 2 * i) / 12 + t * 14;
          const len = (24 + (i % 2) * 20) * pulse;
          c.strokeStyle = i % 2 === 0 ? leftSpec.color : rightSpec.color;
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
          c.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
          c.stroke();
          c.strokeStyle = COLORS.white;
          c.lineWidth = 1.8;
          c.stroke();
        }
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3.5;
        c.beginPath();
        c.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
        c.restore();

        // 5. MANGA DOMAIN CALLOUT PLAQUES (Bottom Left & Bottom Right)
        c.save();
        c.font = `bold 12px ${FONT}`;
        c.textBaseline = "middle";
        const drawPlaque = (px, py, align, title, sub, col) => {
          c.save();
          c.translate(px, py);
          c.rotate(align === "left" ? -0.04 : 0.04);
          const pw = 168;
          const ph = 34;
          const rx = align === "left" ? 0 : -pw;
          c.fillStyle = COLORS.ink;
          c.beginPath();
          c.roundRect(rx, 3, pw, ph, 7);
          c.fill();
          c.fillStyle = "rgba(15, 10, 25, 0.92)";
          c.strokeStyle = col;
          c.lineWidth = 3;
          c.beginPath();
          c.roundRect(rx, 0, pw, ph, 7);
          c.fill();
          c.stroke();

          c.textAlign = align;
          const tx = align === "left" ? 10 : -10;
          c.font = `bold 11px ${FONT}`;
          c.fillStyle = col;
          c.fillText(sub, tx, 11);
          c.font = `bold 13px ${FONT}`;
          c.fillStyle = COLORS.white;
          c.fillText(title, tx, 24);
          c.restore();
        };
        const lTag = (leftB ? (leftB.shortName || leftB.costume || leftB.name) : "P1").toUpperCase();
        const rTag = (rightB ? (rightB.shortName || rightB.costume || rightB.name) : "P2").toUpperCase();
        drawPlaque(14, WORLD_SIZE - 52, "left", leftSpec.name, `${lTag} • DOMAIN`, leftSpec.color);
        drawPlaque(WORLD_SIZE - 14, WORLD_SIZE - 52, "right", rightSpec.name, `${rTag} • DOMAIN`, rightSpec.color);
        c.restore();

        // 6. CHUNKY ANIME TUG-OF-WAR DOMAIN CLASH METER (Top-Center)
        const barW = 336;
        const barH = 26;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 72;
        const barSplitX = barX + barW * meter;
        const p1Pct = Math.round(meter * 100);
        const p2Pct = 100 - p1Pct;

        c.font = `bold 15px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 5;
        c.strokeStyle = COLORS.ink;
        c.strokeText("⚡ DOMAIN EXPANSION CLASH! ⚡", WORLD_SIZE * 0.5, barY - 16);
        c.fillStyle = COLORS.gold;
        c.fillText("⚡ DOMAIN EXPANSION CLASH! ⚡", WORLD_SIZE * 0.5, barY - 16);

        c.fillStyle = COLORS.ink;
        c.beginPath();
        c.roundRect(barX, barY + 4, barW, barH, 10);
        c.fill();

        c.save();
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.clip();
        c.fillStyle = leftSpec.color;
        c.fillRect(barX, barY, barW * meter, barH);
        c.fillStyle = rightSpec.color;
        c.fillRect(barSplitX, barY, barW * (1 - meter), barH);
        c.fillStyle = "rgba(255, 255, 255, 0.24)";
        c.fillRect(barX, barY, barW, barH * 0.42);
        c.restore();

        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.roundRect(barX, barY, barW, barH, 10);
        c.stroke();

        // Glowing clash divider needle
        c.fillStyle = COLORS.white;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.roundRect(barSplitX - 4, barY - 5, 8, barH + 10, 3);
        c.fill();
        c.stroke();

        c.font = `bold 13px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;

        c.textAlign = "left";
        const leftText = `${lTag} ${p1Pct}%`;
        c.strokeText(leftText, barX + 10, barY + barH * 0.5);
        c.fillStyle = p1Pct >= p2Pct ? COLORS.gold : COLORS.white;
        c.fillText(leftText, barX + 10, barY + barH * 0.5);

        c.textAlign = "right";
        const rightText = `${p2Pct}% ${rTag}`;
        c.strokeText(rightText, barX + barW - 10, barY + barH * 0.5);
        c.fillStyle = p2Pct > p1Pct ? COLORS.gold : COLORS.white;
        c.fillText(rightText, barX + barW - 10, barY + barH * 0.5);

        c.restore();
      },
    };
  }

  function triggerDomainExpansion(owner, spec, g) {
    const enemyDomain = g.entities.find((ent) => ent.isDomain && !ent.dead && ent.domainOwner !== owner);
    const activeClash = g.entities.find((ent) => ent.isDomainClash && !ent.dead);
    if (activeClash) return;

    // Trigger Domain Clash whenever ANY Sorcerer with a Domain (Gojo / Sukuna) is the opponent — they immediately counter-activate their Domain!
    const domainSorcererEnemy = !enemyDomain
      ? g.balls.find((b) => b !== owner && b.alive && (b.costume === "gojo" || b.costume === "sukuna"))
      : null;

    if (enemyDomain || domainSorcererEnemy) {
      const enemy = enemyDomain ? enemyDomain.domainOwner : domainSorcererEnemy;
      if (enemyDomain) {
        enemyDomain.dead = true;
      } else if (enemy) {
        // Opponent Sorcerer immediately awakens and counter-expands their Domain!
        enemy.ultTimer = Math.max(enemy.ultTimer, 8.0);
        enemy.domainUsedInUlt = true;
        addEffect(enemy, "haste", 8.0, { factor: 1.15 });
      }
      // Clear stuns, active casts, & stray projectiles/vortexes so both sorcerers face off cleanly in the Domain Clash
      for (const ent of g.entities) {
        if (!ent.isDomain && !ent.isDomainClash) ent.dead = true;
      }
      floatingTexts.length = 0;
      owner.effects = owner.effects.filter((ef) => ef.type !== "stun");
      owner.cast = null;
      owner.channelTimer = 0;
      const clashDuration = 2.6;
      owner.domainClashTimer = clashDuration;
      if (enemy && enemy.alive) {
        enemy.effects = enemy.effects.filter((ef) => ef.type !== "stun");
        enemy.cast = null;
        enemy.channelTimer = 0;
        enemy.domainClashTimer = clashDuration;
      }
      const midX = enemy ? (owner.x + enemy.x) * 0.5 : WORLD_SIZE * 0.5;
      const midY = enemy ? (owner.y + enemy.y) * 0.5 : WORLD_SIZE * 0.5;

      const enemyDomainType = enemyDomain
        ? enemyDomain.domainType
        : (enemy && enemy.costume === "gojo" ? "unlimited_void" : "malevolent_shrine");

      const enemySpec = enemyDomainType === "unlimited_void"
        ? {
            type: "unlimited_void",
            name: "UNLIMITED VOID",
            color: "#38bdf8",
            createDomain: BF.spawnUnlimitedVoidDomain
              ? () => BF.spawnUnlimitedVoidDomain({ owner: enemy, duration: 6.0 })
              : null,
            onStart(gg) {
              gg.addEffect(owner, "stun", 6.0);
              owner.vx = 0;
              owner.vy = 0;
              gg.spawnDamageText(owner.x, owner.y - owner.radius - 18, 0, "#7dd3fc", true, "INFINITE VOID (6S)!");
            },
          }
        : {
            type: "malevolent_shrine",
            name: "MALEVOLENT SHRINE",
            color: "#dc2626",
            createDomain: BF.spawnMalevolentShrineDomain
              ? () => BF.spawnMalevolentShrineDomain({ owner: enemy, duration: 6.0 })
              : null,
            onStart(gg) {
              gg.spawnDamageText(enemy.x, enemy.y - enemy.radius - 18, 0, "#ef4444", true, "MALEVOLENT SHRINE!");
            },
          };

      if (enemy) {
        g.spawnDamageText(enemy.x, enemy.y - enemy.radius - 18, 0, enemySpec.color, true, `${enemySpec.name}!`);
      }
      g.spawnDamageText(owner.x, owner.y - owner.radius - 18, 0, spec.color, true, `${spec.name}!`);
      g.entities.push(spawnBanner("DOMAIN CLASH!", COLORS.gold));
      g.entities.push(spawnDomainClashEffect(midX, midY, clashDuration, owner, enemy || owner, spec, enemySpec, g));
      if (g.sound && g.sound.playTimeStop) g.sound.playTimeStop();
      g.sound.playCritHit();
      shakeTime = Math.max(shakeTime, 0.45);
      shakeIntensity = Math.max(shakeIntensity, 9);
      return;
    }

    if (spec.createDomain) {
      g.entities.push(spec.createDomain());
    }
    if (spec.onStart) {
      spec.onStart(g);
    }
  }

  function triggerGokuApeTransform(b) {
    if (!b || !b.alive || b.apeMode) return;
    b.apeMode = true;
    b.ultTimer = Math.max(b.ultTimer, 9.0);
    b.radius = Math.round(b.baseRadius * 1.48);
    b.apeErraticTimer = 0;
    b.apeRushTimer = 0;
    b.apeRushHitCooldown = 0;
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    addEffect(b, "shield", b.ultTimer, { reduction: 0.35 });
    entities.push(spawnBanner("GREAT APE: OOZARU!", "#b45309"));
    entities.push(spawnShockRing(b.x, b.y, "#f59e0b", 155, 0.52));
    spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "OOZARU RAMPAGE!");
    sound.playCritHit();
    shakeTime = Math.max(shakeTime, 0.4);
    shakeIntensity = Math.max(shakeIntensity, 9);
  }

  function triggerNarutoKyuubiTransform(b) {
    if (!b || !b.alive || b.kyuubiMode) return;
    b.kyuubiMode = true;
    b.radius = Math.round(b.baseRadius * 1.08);
    b.baseSpeed = Math.round(b.baseSpeed * 1.24);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    const isBoneSkin = b.skin === "naruto_six_tails_bone";
    entities.push(spawnBanner(isBoneSkin ? "SIX-TAILS SKELETAL KYUUBI!" : "FOUR-TAILS KYUUBI CLOAK!", "#dc2626"));
    entities.push(spawnShockRing(b.x, b.y, "#ef4444", 160, 0.52));
    entities.push(spawnShockRing(b.x, b.y, "#140407", 115, 0.38));
    spawnSparks(b.x, b.y, "#ef4444", "#140407");
    spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, isBoneSkin ? "SIX-TAILS BONE CLOAK!" : "NINE-TAILS AWAKENED!");
    sound.playCritHit();
    shakeTime = Math.max(shakeTime, 0.42);
    shakeIntensity = Math.max(shakeIntensity, 10);
  }

  function triggerIchigoInnerDemonTransform(b) {
    if (!b || !b.alive || b.innerDemonMode || b.vastoLordeMode) return;
    b.innerDemonMode = true;
    b.radius = Math.round(b.baseRadius * 1.05);
    b.baseSpeed = Math.round(b.baseSpeed * 1.22);
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    entities.push(spawnBanner("INNER HOLLOW TAKEOVER!", "#dc2626"));
    entities.push(spawnShockRing(b.x, b.y, "#ef4444", 150, 0.48));
    entities.push(spawnShockRing(b.x, b.y, "#f8fafc", 110, 0.35));
    spawnSparks(b.x, b.y, "#ef4444", "#f8fafc");
    spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "INNER DEMON AWAKENED!");
    sound.playCritHit();
    shakeTime = Math.max(shakeTime, 0.4);
    shakeIntensity = Math.max(shakeIntensity, 9);
  }

  function triggerIchigoVastoTransform(b) {
    if (!b || !b.alive || b.vastoLordeMode) return;
    b.vastoLordeMode = true;
    b.radius = Math.round(b.baseRadius * 1.08);
    b.baseSpeed = Math.round(b.baseSpeed * 1.26);
    addEffect(b, "shield", 99, { reduction: 0.25 });
    if (b.skills && b.skills[0]) {
      b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.15);
    }
    const isHalfVasto = b.skin === "ichigo_vasto_half_mask" || (Array.isArray(b.skins) && b.skins.includes("ichigo_vasto_half_mask"));
    entities.push(spawnBanner(isHalfVasto ? "AWAKENED VASTO LORDE!" : "FULL HOLLOW: VASTO LORDE!", "#dc2626"));
    entities.push(spawnShockRing(b.x, b.y, "#ef4444", 160, 0.52));
    entities.push(spawnShockRing(b.x, b.y, "#090205", 118, 0.38));
    spawnSparks(b.x, b.y, "#ef4444", "#090205");
    spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "VASTO LORDE AWAKENED!");
    sound.playCritHit();
    shakeTime = Math.max(shakeTime, 0.42);
    shakeIntensity = Math.max(shakeIntensity, 10);
  }

  function activateUltimate(ball) {
    if (!ball.alive) return;
    ball.ultCharge = 0;
    sound.playCritHit();
    sound.playUlt(ball.ult);
    spawnCritBurst(ball.x, ball.y);
    const fx = {
      gear_4: ["GEAR 4!", COLORS.red],
      kaioken: ["KAIOKEN!", COLORS.orange],
      rasenshuriken: ball.kyuubiMode ? ["BIJUUDAMA!", "#dc2626"] : ["RASENSHURIKEN!", COLORS.blue],
      hollow_mask: ball.vastoLordeMode
        ? ["GRAN REY CERO!", "#dc2626"]
        : (ball.evolved ? ["HOLLOW MASK!", COLORS.red] : ["BANKAI: TENSA ZANGETSU!", "#dc2626"]),
      time_stop: ["ZA WARUDO!", COLORS.gold],
      star_time_stop: ["STAR PLATINUM: THE WORLD!", "#9b59b6"],
      berserker_armor: ["BERSERKER ARMOR!", COLORS.red],
      hollow_purple: ["HOLLOW PURPLE!", "#b84dff"],
      fuga: ["OPEN: FUGA!", "#f97316"],
      godspeed: ["GODSPEED: KANMURU!", "#38bdf8"],
      arise: ["ARISE: SHADOW ARMY!", "#a855f7"],
      hero_of_hell: ["HERO OF HELL!", "#ea580c"],
      cosmic_fear: ["MONSTER CALAMITY!", "#ef4444"],
    }[ball.ult];
    if (fx) {
      if (ball.ult !== "time_stop" && ball.ult !== "star_time_stop") {
        entities.push(spawnShockRing(ball.x, ball.y, fx[1], 120, 0.55));
      }
      if (ball.ult !== "gear_4") {
        entities.push(spawnBanner(fx[0], fx[1]));
      }
      shakeTime = 0.3; shakeIntensity = 7; hitStop = 0.09;
    }

    if (ball.ult === "gear_4") {
      const isOddHp = Math.round(ball.hp) % 2 !== 0;
      ball.gear4Mode = isOddHp ? "bounceman" : "snakeman";
      entities.push(spawnBanner(isOddHp ? "GEAR 4: BOUNCEMAN!" : "GEAR 4: SNAKEMAN!", isOddHp ? COLORS.red : "#a855f7"));
      beginCast(ball, {
        kind: "inflate", duration: 0.65, color: isOddHp ? COLORS.red : "#a855f7",
        fire(b) {
          b.ultTimer = 8.0;
          if (b.gear4Mode === "bounceman") {
            b.radius = Math.round(b.baseRadius * 1.22);
            addEffect(b, "shield", 8.0, { reduction: 0.35 });
          } else {
            b.radius = Math.round(b.baseRadius * 1.06);
            addEffect(b, "haste", 8.0, { factor: 1.32 });
          }
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.35);
          entities.push(spawnShockRing(b.x, b.y, b.gear4Mode === "bounceman" ? COLORS.white : "#c084fc", 110, 0.42));
        },
      });
    } else if (ball.ult === "kaioken") {
      beginCast(ball, {
        kind: "powerup", duration: 0.45, color: COLORS.orange,
        fire(b) {
          b.ultTimer = 8.0;
          addEffect(b, "haste", 8.0, { factor: 1.25 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.3);
          entities.push(spawnShockRing(b.x, b.y, COLORS.red, 100, 0.4));
          if (b.hp <= 200 && !b.apeMode) {
            triggerGokuApeTransform(b);
          }
        },
      });
    } else if (ball.ult === "rasenshuriken") {
      if (!balls.find((x) => x !== ball && x.alive)) return;
      if (ball.kyuubiMode) {
        beginCast(ball, {
          kind: "bijuudama", duration: 1.05, color: "#dc2626", maxR: 34,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const m = castMuzzle(b, ang, 24);
            g.entities.push(spawnShockRing(m.x, m.y, "#ef4444", 130, 0.45));
            shakeTime = Math.max(shakeTime, 0.35);
            shakeIntensity = Math.max(shakeIntensity, 8);
            g.entities.push(spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 550,
              radius: 34,
              damage: 34,
              color: "#dc2626",
              label: "BIJUUDAMA!",
              shape: "bijuudama",
              onImpact(tt, gg, proj) {
                if (BF.triggerBijuudamaExplosion) {
                  BF.triggerBijuudamaExplosion(proj.x, proj.y, b, gg, tt);
                }
              },
              onOutOfBounds(gg, proj) {
                if (BF.triggerBijuudamaExplosion) {
                  BF.triggerBijuudamaExplosion(proj.x, proj.y, b, gg, null);
                }
              },
            }));
          },
        });
      } else {
        beginCast(ball, {
          kind: "orb", blades: true, duration: 1.15, color: COLORS.blue, maxR: 30,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const m = castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 20);
            g.entities.push(spawnShockRing(m.x, m.y, COLORS.blue, 90, 0.4));
            shakeTime = 0.2; shakeIntensity = 5;
            g.entities.push(spawnProjectile({
              owner: b, target: t, x: m.x, y: m.y, speed: 520, radius: 28, damage: 28,
              color: COLORS.blue, label: "RASENSHURIKEN!", shape: "rasenshuriken",
              onImpact(tt, gg, proj) {
                gg.addEffect(tt, "stun", 0.9);
                gg.entities.push(BF.spawnRasenganVisual(proj.x, proj.y, 82));
                if (BF.spawnRasenshurikenVortex) {
                  gg.entities.push(BF.spawnRasenshurikenVortex({ x: proj.x, y: proj.y, owner: b, duration: 2.2, radius: 155 }));
                }
                gg.entities.push(spawnShockRing(proj.x, proj.y, COLORS.white, 125, 0.5));
                gg.spawnSparks(proj.x, proj.y, COLORS.white, COLORS.blue);
                shakeTime = 0.35; shakeIntensity = 8;
              },
              onOutOfBounds(gg, proj) {
                if (BF.spawnRasenshurikenVortex) {
                  gg.entities.push(BF.spawnRasenshurikenVortex({ x: proj.x, y: proj.y, owner: b, duration: 2.0, radius: 145 }));
                }
              },
            }));
          },
        });
      }
    } else if (ball.ult === "hollow_mask") {
      if (ball.vastoLordeMode) {
        if (!balls.find((x) => x !== ball && x.alive)) return;
        beginCast(ball, {
          kind: "gran_rey_cero", duration: 0.98, color: "#dc2626", maxR: 35,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const m = castMuzzle(b, ang, 24);
            g.entities.push(spawnShockRing(m.x, m.y, "#ef4444", 130, 0.45));
            shakeTime = Math.max(shakeTime, 0.35);
            shakeIntensity = Math.max(shakeIntensity, 8);
            g.entities.push(spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 575,
              radius: 35,
              damage: 35,
              color: "#dc2626",
              label: "GRAN REY CERO!",
              shape: "gran_rey_cero",
              onImpact(tt, gg, proj) {
                if (BF.triggerGranReyCeroExplosion) {
                  BF.triggerGranReyCeroExplosion(proj.x, proj.y, b, gg, tt);
                }
              },
              onOutOfBounds(gg, proj) {
                if (BF.triggerGranReyCeroExplosion) {
                  BF.triggerGranReyCeroExplosion(proj.x, proj.y, b, gg, null);
                }
              },
            }));
          },
        });
      } else {
        beginCast(ball, {
          kind: "powerup", duration: 0.45, color: COLORS.red,
          fire(b) {
            b.ultTimer = 8.5;
            addEffect(b, "haste", 8.5, { factor: 1.28 });
            if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.25);
            entities.push(spawnShockRing(b.x, b.y, "#ef4444", 115, 0.42));
            entities.push(spawnShockRing(b.x, b.y, "#090205", 85, 0.32));
          },
        });
      }
    } else if (ball.ult === "time_stop") {
      beginCast(ball, {
        kind: "time_stop", duration: 0.45, color: COLORS.gold,
        fire(b, g) {
          b.ultTimer = 5.0;
          timeStopTimer = 5.0;
          timeStopOwner = b;
          b.knifeWavesLeft = 4;
          b.knifeWaveTimer = 0.35;
          sound.playTimeStop();
          shakeTime = 0.4; shakeIntensity = 8;
        },
      });
    } else if (ball.ult === "star_time_stop") {
      beginCast(ball, {
        kind: "time_stop", duration: 0.42, color: "#9b59b6",
        fire(b) {
          b.ultTimer = 4.0;
          timeStopTimer = 4.0;
          timeStopOwner = b;
          if (b.skills[0]) b.skills[0]._cd = 0;
          // Time-Step Blink onto the arena-interior side of the frozen enemy so Jotaro never wedges them against a wall!
          const enemy = balls.find((x) => x !== b && x.alive);
          if (enemy) {
            enemy.stoppedTimeHits = 0;
            const toCenterAng = Math.atan2(WORLD_SIZE * 0.5 - enemy.y, WORLD_SIZE * 0.5 - enemy.x);
            const standOff = enemy.radius + b.radius + 54;
            b.x = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, enemy.x + Math.cos(toCenterAng) * standOff));
            b.y = Math.max(b.radius + 14, Math.min(WORLD_SIZE - b.radius - 14, enemy.y + Math.sin(toCenterAng) * standOff));
            const moveAng = Math.atan2(enemy.y - b.y, enemy.x - b.x) + 0.38;
            b.vx = Math.cos(moveAng) * b.baseSpeed;
            b.vy = Math.sin(moveAng) * b.baseSpeed;
            entities.push(spawnShockRing(b.x, b.y, "#00f0ff", 110, 0.35));
            spawnDamageText(b.x, b.y - b.radius - 12, 0, "#00f0ff", false, "TIME-STEP BLINK!");
          }
          sound.playTimeStop();
          shakeTime = 0.25; shakeIntensity = 5;
        },
      });
    } else if (ball.ult === "berserker_armor") {
      beginCast(ball, {
        kind: "powerup", duration: 0.45, color: COLORS.red,
        fire(b) {
          b.ultTimer = 8.5;
          addEffect(b, "haste", 8.5, { factor: 1.32 });
          addEffect(b, "shield", 8.5, { reduction: 0.22 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          const enemy = balls.find((x) => x !== b && x.alive);
          if (enemy) {
            const ang = Math.atan2(enemy.y - b.y, enemy.x - b.x);
            b.vx = Math.cos(ang) * b.baseSpeed * 1.4;
            b.vy = Math.sin(ang) * b.baseSpeed * 1.4;
          }
          entities.push(spawnShockRing(b.x, b.y, COLORS.red, 135, 0.45));
        },
      });
    } else if (ball.ult === "hollow_purple") {
      if (!balls.find((x) => x !== ball && x.alive)) return;
      beginCast(ball, {
        kind: "hollow_purple",
        duration: 0.92,
        color: "#b84dff",
        fire(b, g) {
          b.ultTimer = 13.0;
          b.domainUsedInUlt = false;
          addEffect(b, "haste", 13.0, { factor: 1.15 });
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = castMuzzle(b, ang, 24);
          g.entities.push(spawnShockRing(m.x, m.y, "#e5b8ff", 135, 0.45));
          shakeTime = Math.max(shakeTime, 0.35);
          shakeIntensity = Math.max(shakeIntensity, 8);
          g.entities.push(spawnProjectile({
            owner: b,
            target: t,
            x: m.x,
            y: m.y,
            speed: 510,
            radius: 44,
            damage: Math.round(26 + rng() * 6),
            color: "#b84dff",
            label: "HOLLOW PURPLE!",
            shape: "hollow_purple",
            onImpact(tt, gg, proj) {
              BF.triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, tt);
            },
            onOutOfBounds(gg, proj) {
              BF.triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, null);
            },
          }));
        },
      });
    } else if (ball.ult === "fuga") {
      if (!balls.find((x) => x !== ball && x.alive)) return;
      beginCast(ball, {
        kind: "fuga_arrow",
        duration: 0.85,
        color: "#f97316",
        fire(b, g) {
          b.ultTimer = 13.0;
          b.domainUsedInUlt = false;
          addEffect(b, "haste", 13.0, { factor: 1.15 });
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = castMuzzle(b, ang, 24);
          g.entities.push(spawnShockRing(m.x, m.y, "#fb923c", 135, 0.45));
          shakeTime = Math.max(shakeTime, 0.35);
          shakeIntensity = Math.max(shakeIntensity, 8);
          g.entities.push(spawnProjectile({
            owner: b,
            target: t,
            x: m.x,
            y: m.y,
            speed: 560,
            radius: 36,
            damage: Math.round(26 + rng() * 6),
            color: "#f97316",
            label: "FUGA!",
            shape: "fuga_arrow",
            onImpact(tt, gg, proj) {
              BF.triggerFugaExplosion(proj.x, proj.y, b, gg, tt);
            },
            onOutOfBounds(gg, proj) {
              BF.triggerFugaExplosion(proj.x, proj.y, b, gg, null);
            },
          }));
        },
      });
    } else if (ball.ult === "godspeed") {
      beginCast(ball, {
        kind: "powerup",
        duration: 0.4,
        color: "#38bdf8",
        fire(b, g) {
          b.ultTimer = 7.5;
          b._whirlwindCd = 0;
          b._denkoTimer = 0.5;
          addEffect(b, "haste", 7.5, { factor: 1.35 });
          addEffect(b, "shield", 7.5, { reduction: 0.2 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.25);
          if (BF.triggerGodspeedOpener) BF.triggerGodspeedOpener(b, g);
          entities.push(spawnShockRing(b.x, b.y, "#38bdf8", 125, 0.42));
          entities.push(spawnShockRing(b.x, b.y, "#e0f2fe", 90, 0.3));
        },
      });
    } else if (ball.ult === "arise") {
      beginCast(ball, {
        kind: "powerup",
        duration: 0.45,
        color: "#a855f7",
        fire(b, g) {
          b.ultTimer = 7.5;
          addEffect(b, "haste", 7.5, { factor: 1.22 });
          addEffect(b, "shield", 7.5, { reduction: 0.18 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerAriseDomain) {
            BF.triggerAriseDomain(b, g);
          }
          entities.push(spawnShockRing(b.x, b.y, "#a855f7", 135, 0.48));
          entities.push(spawnShockRing(b.x, b.y, "#38bdf8", 96, 0.36));
        },
      });
    } else if (ball.ult === "hero_of_hell") {
      beginCast(ball, {
        kind: "powerup",
        duration: 0.42,
        color: "#ea580c",
        fire(b, g) {
          b.ultTimer = 8.0;
          addEffect(b, "haste", 8.0, { factor: 1.28 });
          addEffect(b, "shield", 8.0, { reduction: 0.22 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerHeroOfHellOpener) BF.triggerHeroOfHellOpener(b, g);
          entities.push(spawnShockRing(b.x, b.y, "#ef4444", 130, 0.44));
          entities.push(spawnShockRing(b.x, b.y, "#fbbf24", 94, 0.32));
        },
      });
    } else if (ball.ult === "cosmic_fear") {
      beginCast(ball, {
        kind: "powerup",
        duration: 0.48,
        color: "#ef4444",
        fire(b, g) {
          b.ultTimer = 8.0;
          addEffect(b, "haste", 8.0, { factor: 1.28 });
          addEffect(b, "shield", 8.0, { reduction: 0.22 });
          if (b.skills[0]) b.skills[0]._cd = 0;
          if (BF.triggerGarouMonsterOpener) BF.triggerGarouMonsterOpener(b, g);
          entities.push(spawnShockRing(b.x, b.y, "#ef4444", 135, 0.45));
          entities.push(spawnShockRing(b.x, b.y, "#fb923c", 96, 0.34));
        },
      });
    }
  }

  function chargeUlt(ball) {
    if (!ball.alive || ball.ultTimer > 0) return;
    ball.ultCharge = Math.min(ULT_CHARGES_REQUIRED, ball.ultCharge + 1);
    if (ball.ultCharge >= ULT_CHARGES_REQUIRED) {
      activateUltimate(ball);
    }
  }

  function addEffect(ball, type, duration, data = {}) {
    const existing = ball.getEffect(type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.data = { ...existing.data, ...data };
      return;
    }
    ball.effects.push({ type, duration, data });
  }

  function runSkillHook(ball, hookName, ...args) {
    for (const skill of ball.skills) {
      if (typeof skill[hookName] !== "function" || skill._cd > 0) continue;
      const result = skill[hookName](ball, ...args);
      if (skill.cooldown > 0 && result !== false) {
        skill._cd = skill.cooldown;
      }
    }
  }

  function isDashingAttack(ball) {
    return Boolean(
      ball && (
        ball.rocketTimer > 0 ||
        ball.rasenganTimer > 0 ||
        ball.kyuubiSlashTimer > 0 ||
        ball.shunpoDashTimer > 0 ||
        ball.dragonRushTimer > 0 ||
        ball.cleaveDashTimer > 0 ||
        ball.apeRushTimer > 0 ||
        ball.jinwooDashTimer > 0 ||
        ball.denjiDashTimer > 0
      )
    );
  }

  function computeCollisionDamage(attacker, impactSpeed, maxImpact, defender = null) {
    // Frozen (Time Stop) or stunned (e.g. Unlimited Void) fighters cannot deal collision damage
    if ((timeStopTimer > 0 && attacker !== timeStopOwner) || attacker.getEffect("stun")) {
      return { amount: 0, isCrit: false };
    }
    // Non-dashing defenders cannot counter-damage an opponent who is mid-dash skill
    if (defender && isDashingAttack(defender) && !isDashingAttack(attacker)) {
      return { amount: 0, isCrit: false };
    }
    const [minDmg, maxDmg] = attacker.damageRange;
    if (maxDmg <= 0) {
      return { amount: 0, isCrit: false };
    }
    if (rng() < CRIT_CHANCE) {
      return { amount: CRIT_DAMAGE, isCrit: true };
    }
    const ratio = maxImpact > 0 ? Math.min(1, Math.max(0, impactSpeed / maxImpact)) : 0.5;
    const base = minDmg + ratio * (maxDmg - minDmg);
    const variance = 1 + (rng() * 2 - 1) * DAMAGE_VARIATION;
    const ultBoost = attacker.ultTimer > 0 ? 1.35 : 1;
    return { amount: Math.max(1, Math.round(base * variance * ultBoost)), isCrit: false };
  }

  function applyDamage(ball, rawAmount) {
    let dmg = rawAmount;
    const shield = ball.getEffect("shield");
    if (shield && dmg > 0) {
      const reduction = shield.data?.reduction ?? 0.35;
      dmg = Math.max(1, dmg * (1 - reduction));
    }
    const amount = Math.max(0, Math.round(dmg));
    if (amount <= 0) return 0;
    ball.hp = Math.max(0, ball.hp - amount);
    if (ball.alive && ball.hp > 0 && ball.costume === "naruto" && ball.evolved && ball.hp <= 200 && !ball.kyuubiMode) {
      triggerNarutoKyuubiTransform(ball);
    }
    if (ball.alive && ball.hp > 0 && ball.costume === "ichigo") {
      if (ball.evolved && ball.hp <= 200 && !ball.vastoLordeMode) {
        triggerIchigoVastoTransform(ball);
      } else if (!ball.evolved && ball.hp <= 100 && !ball.innerDemonMode) {
        triggerIchigoInnerDemonTransform(ball);
      }
    }
    runSkillHook(ball, "onDamaged", amount, game);
    return amount;
  }

  function updateRoundDots() {
    const renderDots = (container, score, color) => {
      if (!container) return;
      const items = container.querySelectorAll(".round-dot");
      items.forEach((dot, i) => {
        dot.style.background = i < score ? color : COLORS.white;
      });
    };
    renderDots(dots1, scores[0], BALL_CONFIGS[0].color);
    renderDots(dots2, scores[1], BALL_CONFIGS[1].color);
  }

  function syncFighterUI() {
    if (name1) {
      name1.textContent = BALL_CONFIGS[0].name;
      name1.style.background = BALL_CONFIGS[0].color;
    }
    if (name2) {
      name2.textContent = BALL_CONFIGS[1].name;
      name2.style.background = BALL_CONFIGS[1].color;
    }
    hpBar1.style.background = BALL_CONFIGS[0].color;
    hpBar2.style.background = BALL_CONFIGS[1].color;
  }

  function initRound() {
    balls = BALL_CONFIGS.map((cfg, index) => {
      const xRatio = BALL_CONFIGS.length === 2
        ? (index === 0 ? 0.2 + rng() * 0.16 : 0.64 + rng() * 0.16)
        : (index + 1) / (BALL_CONFIGS.length + 1);
      return new Ball(cfg, {
        x: WORLD_SIZE * xRatio,
        y: WORLD_SIZE * (0.22 + rng() * 0.56),
        angle: randomStartAngle(),
      });
    });

    entities = [];
    particles = [];
    floatingTexts = [];
    hitCooldown = 0;
    hitStop = 0;
    shakeTime = 0;
    shakeIntensity = 0;
    totalHits = 0;
    elapsed = 0;
    timeStopTimer = 0;
    timeStopOwner = null;
    game._cosmicCutsceneTimer = 0;
    game._moonArenaTimer = 0;
    koSequence = null;
    cameraZoom = 1;
    cameraX = WORLD_SIZE * 0.5;
    cameraY = WORLD_SIZE * 0.5;
    roundOver = false;
    running = true;

    overlay.classList.add("hidden");
    btnPlay.textContent = "PAUSE";
    updateHUD();
  }

  function initMatch() {
    rng = mulberry32(matchSeed);
    if (seedDisplay) seedDisplay.textContent = String(matchSeed);
    scores = [0, 0];
    currentRound = 1;
    matchOver = false;
    syncFighterUI();
    updateRoundDots();
    initRound();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  // Comic-style star burst at the point of impact
  function spawnImpactBurst(x, y, color) {
    const life = 0.2;
    return {
      life, isTimeStopEntity: true, dead: false,
      update(dt) { this.life -= dt; if (this.life <= 0) this.dead = true; },
      render(c) {
        const p = 1 - Math.max(0, this.life) / life;
        const R = 14 + 26 * BF.easeOut(p);
        c.save();
        c.translate(x, y);
        c.rotate(p * 0.5);
        c.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16;
          const rr = i % 2 ? R * 0.45 : R;
          c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        c.closePath();
        c.globalAlpha = 1 - p * 0.8;
        c.fillStyle = color || COLORS.white;
        c.fill();
        c.lineWidth = 3; c.lineJoin = "round"; c.strokeStyle = COLORS.ink;
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnSparks(x, y, colorA, colorB) {
    entities.push(spawnImpactBurst(x, y, colorA));
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 110 + Math.random() * 190;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.floor(Math.random() * 4),
        life: 0.22 + Math.random() * 0.14,
        maxLife: 0.36,
        color: i % 2 === 0 ? colorA : colorB,
      });
    }
  }

  function spawnCritBurst(x, y) {
    const confettiColors = [COLORS.red, COLORS.blue, COLORS.gold, COLORS.green, COLORS.white];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.25;
      const speed = 150 + Math.random() * 260;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.floor(Math.random() * 5),
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        color: confettiColors[i % confettiColors.length],
        shape: i % 2 === 0 ? "square" : "circle",
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 14,
      });
    }

    // Expanding solid-outlined shockwave ring entity
    entities.push({
      x,
      y,
      radius: 12,
      maxRadius: 115,
      life: 0.34,
      maxLife: 0.34,
      isTimeStopEntity: true,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) {
          this.dead = true;
          return;
        }
        const progress = 1 - this.life / this.maxLife;
        this.radius = 12 + (this.maxRadius - 12) * (1 - Math.pow(1 - progress, 2));
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = k;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.lineWidth = 8 * k + 2;
        c.strokeStyle = COLORS.ink;
        c.stroke();
        c.lineWidth = 4 * k + 1;
        c.strokeStyle = COLORS.gold;
        c.stroke();
        c.restore();
      },
    });
  }

  function spawnDamageText(x, y, dmg, color, isCrit = false, customLabel = null) {
    if (customLabel) sound.playSkill(customLabel);
    let text = `-${dmg}`;
    if (isCrit) {
      text = `CRIT! -${dmg}`;
    } else if (customLabel) {
      text = dmg > 0 ? `${customLabel} -${dmg}` : customLabel;
    }
    floatingTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - (isCrit ? 26 : 16),
      vy: isCrit ? -70 : -55,
      text,
      color: isCrit ? COLORS.red : (customLabel ? color : COLORS.gold),
      isCrit,
      life: isCrit ? 0.95 : 0.65,
      maxLife: isCrit ? 0.95 : 0.65,
    });
  }

  function pulse(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function updateSkillPill(el, ball) {
    if (!el || !ball) return;
    const skill = ball.skills[0];
    const fill = el.querySelector(".skill-fill");
    const label = el.querySelector(".skill-label");
    if (!skill) {
      el.classList.remove("ready");
      if (fill) fill.style.width = "0%";
      if (label) label.textContent = "NO SKILL";
      return;
    }
    const maxCd = skill.cooldown || 1;
    const cd = Math.max(0, skill._cd || 0);
    const ready = cd <= 0.01;
    const pct = ready ? 100 : Math.max(0, Math.min(100, ((maxCd - cd) / maxCd) * 100));
    el.classList.toggle("ready", ready);
    if (fill) fill.style.width = `${pct}%`;
    if (label) {
      const shortName = (ball.apeMode ? "APE RUSH" : ball.kyuubiMode ? "KYUUBI SLASH" : ball.vastoLordeMode ? "SONÍDO SLASH" : skill.name).toUpperCase();
      label.textContent = ready ? `${shortName} • READY` : `${shortName} • ${cd.toFixed(1)}S`;
    }
  }

  function updateUltHUD(el, ball) {
    if (!el || !ball) return;
    const active = ball.ultTimer > 0;
    el.classList.toggle("active", active);
    const pips = el.querySelectorAll(".ult-pip");
    pips.forEach((pip, i) => {
      pip.classList.toggle("charged", active || i < ball.ultCharge);
    });
    const tag = el.querySelector(".ult-tag");
    if (tag) {
      tag.textContent = active ? `ULT ${ball.ultTimer.toFixed(1)}S` : `ULT ${ball.ultCharge}/${ULT_CHARGES_REQUIRED}`;
    }
  }

  function updateHUD() {
    const [b1, b2] = balls;
    if (!b1 || !b2) return;
    const hp1 = Math.max(0, Math.ceil(b1.hp));
    const hp2 = Math.max(0, Math.ceil(b2.hp));

    hpText1.textContent = `${hp1} / ${b1.maxHp}`;
    hpText2.textContent = `${hp2} / ${b2.maxHp}`;
    hpBar1.style.width = `${(hp1 / b1.maxHp) * 100}%`;
    hpBar2.style.width = `${(hp2 / b2.maxHp) * 100}%`;

    updateSkillPill(skillHud1, b1);
    updateSkillPill(skillHud2, b2);
    updateUltHUD(ultHud1, b1);
    updateUltHUD(ultHud2, b2);

    statusHits.textContent = `HITS: ${totalHits}`;
    statusTime.textContent = `TIME: ${elapsed.toFixed(1)}S`;
  }

  function startKOSequence(targetX, targetY, winnerIndex) {
    timeStopTimer = 0;
    timeStopOwner = null;
    sound.playKO();
    if (navigator.vibrate) navigator.vibrate([60, 40, 140]);
    koSequence = {
      timer: 0,
      duration: KO_SLOWMO_DURATION,
      targetX,
      targetY,
      winnerIndex,
    };
  }

  function finishRound(winnerIndex) {
    timeStopTimer = 0;
    timeStopOwner = null;
    roundOver = true;
    running = false;
    btnPlay.textContent = "START";

    if (winnerIndex >= 0 && winnerIndex < scores.length) {
      scores[winnerIndex] += 1;
      updateRoundDots();
    }

    const winner = winnerIndex >= 0 ? balls[winnerIndex] : null;
    const isMatchEnd = scores[0] >= ROUNDS_TO_WIN || scores[1] >= ROUNDS_TO_WIN;
    matchOver = isMatchEnd;

    // Every completed Sandbox round/game awards +100 Coins
    playerWallet.coins += 100;
    saveWallet();
    updateShopUI();

    if (isMatchEnd) {
      sessionStats.matches += 1;
      if (scores[0] > scores[1]) {
        sessionStats.wins += 1;
      }
      sessionStats.charsUsed[BALL_CONFIGS[0].id] = (sessionStats.charsUsed[BALL_CONFIGS[0].id] || 0) + 1;
      sessionStats.charsUsed[BALL_CONFIGS[1].id] = (sessionStats.charsUsed[BALL_CONFIGS[1].id] || 0) + 1;
      updateProfileUI();

      if (overlayStamp) overlayStamp.textContent = "MATCH WINNER";
      btnRematch.textContent = "REMATCH";
    } else {
      if (overlayStamp) overlayStamp.textContent = `ROUND ${currentRound}`;
      btnRematch.textContent = "NEXT ROUND";
    }

    if (winner) {
      winnerText.textContent = `${winner.name} WINS!`;
      winnerText.style.color = winner.color;
    } else {
      winnerText.textContent = "DOUBLE KO!";
      winnerText.style.color = COLORS.white;
    }

    statsText.textContent = `${totalHits} HITS • ${elapsed.toFixed(1)}S • +100 🪙`;
    overlay.classList.remove("hidden");
  }

  function handleWallCollisions(ball) {
    let bounced = false;

    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      bounced = true;
    } else if (ball.x + ball.radius > WORLD_SIZE) {
      ball.x = WORLD_SIZE - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      bounced = true;
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      bounced = true;
    } else if (ball.y + ball.radius > WORLD_SIZE) {
      ball.y = WORLD_SIZE - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      bounced = true;
    }

    if (bounced) {
      ball.squash = Math.max(ball.squash, 0.6);
      ball.preventAxisLock();
      sound.playWallBounce();
      if (ball.knockbackTimer > 0) {
        // Dramatic wall-crater slam when sent flying from a Stand Clash Finisher!
        entities.push(spawnShockRing(ball.x, ball.y, COLORS.red, 110, 0.38));
        spawnSparks(ball.x, ball.y, COLORS.red, COLORS.gold);
        spawnDamageText(ball.x, ball.y - ball.radius - 12, 0, COLORS.red, true, "WALL SLAM!");
        shakeTime = Math.max(shakeTime, 0.18);
        shakeIntensity = Math.max(shakeIntensity, 4.5);
        sound.playCritHit();
        ball.knockbackTimer = Math.min(ball.knockbackTimer, 0.15);
      }
      if (ball.apeMode && ball.apeRushTimer > 0 && BF.triggerApeWallSlam) {
        const sp = ball.baseSpeed * 2.45;
        const bAng = Math.atan2(ball.vy, ball.vx);
        ball.vx = Math.cos(bAng) * sp;
        ball.vy = Math.sin(bAng) * sp;
        BF.triggerApeWallSlam(ball.x, ball.y, ball, game);
      }
      runSkillHook(ball, "onWallBounce", game);
    }
  }

  function handleBallCollision(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = b1.radius + b2.radius;

    if (dist >= minDist || dist === 0) return;

    // Collision normal
    const nx = dx / dist;
    const ny = dy / dist;

    // Mass-weighted positional correction (prevent overlap)
    const invM1 = 1 / b1.mass;
    const invM2 = 1 / b2.mass;
    const invMassSum = invM1 + invM2;
    const corr = (minDist - dist) + 1;

    // Relative velocity along normal
    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    const impactSpeed = Math.max(0, -velAlongNormal);

    if (timeStopTimer > 0) {
      // In Time Stop, the frozen opponent stays pinned in place while the Time Stop user rebounds cleanly
      if (b1 === timeStopOwner) {
        b1.x -= nx * corr;
        b1.y -= ny * corr;
        if (velAlongNormal < 0) {
          b1.vx += 2 * velAlongNormal * nx;
          b1.vy += 2 * velAlongNormal * ny;
        }
      } else if (b2 === timeStopOwner) {
        b2.x += nx * corr;
        b2.y += ny * corr;
        if (velAlongNormal < 0) {
          b2.vx -= 2 * velAlongNormal * nx;
          b2.vy -= 2 * velAlongNormal * ny;
        }
      }
    } else {
      b1.x -= nx * corr * (invM1 / invMassSum);
      b1.y -= ny * corr * (invM1 / invMassSum);
      b2.x += nx * corr * (invM2 / invMassSum);
      b2.y += ny * corr * (invM2 / invMassSum);

      // Elastic impulse using per-ball mass (restitution = 1)
      if (velAlongNormal < 0) {
        const j = (-2 * velAlongNormal) / invMassSum;
        b1.vx -= j * invM1 * nx;
        b1.vy -= j * invM1 * ny;
        b2.vx += j * invM2 * nx;
        b2.vy += j * invM2 * ny;

        // Slight kick for snappy bounce
        b1.vx *= BOUNCE_KICK;
        b1.vy *= BOUNCE_KICK;
        b2.vx *= BOUNCE_KICK;
        b2.vy *= BOUNCE_KICK;
      }
    }

    if (hitCooldown <= 0) {
      hitCooldown = timeStopTimer > 0 ? 0.38 : HIT_COOLDOWN;
      totalHits += 1;

      const maxImpact = b1.baseSpeed + b2.baseSpeed;
      const hitB2 = computeCollisionDamage(b1, impactSpeed, maxImpact, b2);
      const hitB1 = computeCollisionDamage(b2, impactSpeed, maxImpact, b1);

      const dmgToB1 = applyDamage(b1, hitB1.amount);
      const dmgToB2 = applyDamage(b2, hitB2.amount);
      const anyCrit = hitB1.isCrit || hitB2.isCrit;

      if (dmgToB1 > 0) {
        b1.flashTimer = hitB1.isCrit ? 0.14 : 0.085;
        b1.squash = 1;
        pulse(hpBar1.closest(".hp"), "hit");
      }
      if (dmgToB2 > 0) {
        b2.flashTimer = hitB2.isCrit ? 0.14 : 0.085;
        b2.squash = 1;
        pulse(hpBar2.closest(".hp"), "hit");
      }
      pulse(statusHits, "bump");
      if (navigator.vibrate) navigator.vibrate(anyCrit ? [30, 20, 40] : 18);

      const midX = (b1.x + b2.x) * 0.5;
      const midY = (b1.y + b2.y) * 0.5;

      if (anyCrit) {
        spawnCritBurst(midX, midY);
        hitStop = 0.09;
        shakeTime = 0.22;
        shakeIntensity = 9;
        sound.playCritHit();
      } else {
        spawnSparks(midX, midY, b1.color, b2.color);
        hitStop = HIT_STOP_DURATION;
        shakeTime = 0.11;
        shakeIntensity = 4;
        sound.playBallHit();
      }

      if (dmgToB1 > 0) spawnDamageText(b1.x, b1.y - b1.radius * 0.5, dmgToB1, COLORS.white, hitB1.isCrit);
      if (dmgToB2 > 0) spawnDamageText(b2.x, b2.y - b2.radius * 0.5, dmgToB2, COLORS.white, hitB2.isCrit);

      // Gum-Gum Rocket & Rasengan dash impact bonuses
      const checkDashImpact = (attacker, defender) => {
        if (attacker.rocketTimer > 0 && !attacker.rocketHit) {
          attacker.rocketHit = true;
          const gear4 = attacker.ultTimer > 0;
          const rocketDmg = applyDamage(defender, gear4 ? 14 : 8);
          spawnSparks(midX, midY, COLORS.red, COLORS.white);
          spawnDamageText(defender.x, defender.y - defender.radius - 14, rocketDmg, COLORS.red, false, gear4 ? "G4 ROCKET!" : "ROCKET!");
          if (!gear4) chargeUlt(attacker);
        }
        if (attacker.rasenganTimer > 0 && !attacker.rasenganHit) {
          attacker.rasenganHit = true;
          const sage = Boolean(attacker.evolved);
          const rasDmg = applyDamage(defender, sage ? 17 : 14);
          addEffect(defender, "stun", 0.5);
          spawnDamageText(defender.x, defender.y - defender.radius - 14, rasDmg, COLORS.blue, sage, sage ? "SAGE RASENGAN!" : "RASENGAN!");
          entities.push(BF.spawnRasenganVisual(midX, midY, sage ? 58 : 48));
          entities.push(spawnShockRing(midX, midY, COLORS.blue, sage ? 90 : 75, 0.35));
          shakeTime = 0.2; shakeIntensity = 5;
          chargeUlt(attacker);
        }
        if (attacker.kyuubiSlashTimer > 0 && !attacker.kyuubiSlashHit) {
          attacker.kyuubiSlashHit = true;
          attacker.kyuubiSlashTimer = 0;
          const slashDmg = applyDamage(defender, 20);
          addEffect(defender, "stun", 0.45);
          defender.flashTimer = 0.16;
          defender.squash = 0.92;
          const sAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          defender.vx = Math.cos(sAng) * 490;
          defender.vy = Math.sin(sAng) * 490;
          if (BF.spawnKyuubiClawSlashEffect) {
            entities.push(BF.spawnKyuubiClawSlashEffect(defender.x, defender.y, sAng, 72));
          }
          entities.push(spawnShockRing(defender.x, defender.y, "#ef4444", 105, 0.36));
          spawnSparks(defender.x, defender.y, "#ef4444", "#140407");
          spawnDamageText(defender.x, defender.y - defender.radius - 14, slashDmg, "#ef4444", true, "KYUUBI SLASH!");
          sound.playCritHit();
          hitStop = Math.max(hitStop, 0.08);
          shakeTime = Math.max(shakeTime, 0.26);
          shakeIntensity = Math.max(shakeIntensity, 7);
          chargeUlt(attacker);
        }
        if (attacker.shunpoDashTimer > 0 && !attacker.shunpoDashHit) {
          attacker.shunpoDashHit = true;
          attacker.shunpoDashTimer = 0;
          const emp = Boolean(attacker.vastoLordeMode || attacker.ultTimer > 0);
          const slashDmg = applyDamage(defender, emp ? 22 : 16);
          addEffect(defender, "stun", emp ? 0.48 : 0.38);
          defender.flashTimer = 0.16;
          defender.squash = 0.92;
          const sAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          defender.vx = Math.cos(sAng) * 485;
          defender.vy = Math.sin(sAng) * 485;
          if (BF.spawnZangetsuSlashEffect) {
            entities.push(BF.spawnZangetsuSlashEffect(defender.x, defender.y, sAng, 74, emp));
          }
          entities.push(spawnShockRing(defender.x, defender.y, "#ef4444", 100, 0.34));
          spawnSparks(defender.x, defender.y, "#ef4444", "#090205");
          spawnDamageText(
            defender.x,
            defender.y - defender.radius - 14,
            slashDmg,
            "#ef4444",
            emp,
            attacker.vastoLordeMode ? "SONÍDO SLASH!" : attacker.ultTimer > 0 ? "HOLLOW SHUNPO!" : "SHUNPO SLASH!"
          );
          sound.playCritHit();
          hitStop = Math.max(hitStop, 0.08);
          shakeTime = Math.max(shakeTime, 0.24);
          shakeIntensity = Math.max(shakeIntensity, 6);
          if (!(attacker.ultTimer > 0 && !attacker.vastoLordeMode)) chargeUlt(attacker);
        }
        if (attacker.dragonRushTimer > 0 && !attacker.dragonRushHit) {
          attacker.dragonRushHit = true;
          attacker.dragonRushTimer = 0;
          const ult = attacker.ultTimer > 0;
          entities.push(BF.spawnDragonKickCombo(attacker, defender, ult));
          if (!ult) chargeUlt(attacker);
        }
        if (attacker.cleaveDashTimer > 0 && !attacker.cleaveDashHit) {
          attacker.cleaveDashHit = true;
          attacker.cleaveDashTimer = 0;
          const dealt = applyDamage(defender, 15);
          defender.flashTimer = 0.16;
          defender.squash = 0.9;
          const cAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          defender.vx = Math.cos(cAng) * 480;
          defender.vy = Math.sin(cAng) * 480;
          if (BF.spawnCleaveSlashEffect) {
            entities.push(BF.spawnCleaveSlashEffect(defender.x, defender.y, 56));
          }
          entities.push(spawnShockRing(defender.x, defender.y, "#dc2626", 95, 0.34));
          spawnSparks(defender.x, defender.y, "#dc2626", COLORS.white);
          spawnDamageText(defender.x, defender.y - defender.radius - 14, dealt, "#ef4444", true, "CLEAVE!");
          sound.playCritHit();
          hitStop = Math.max(hitStop, 0.08);
          shakeTime = Math.max(shakeTime, 0.25);
          shakeIntensity = Math.max(shakeIntensity, 7);
          if (!(attacker.ultTimer > 0)) chargeUlt(attacker);
        }
        if (attacker.apeMode) {
          if (attacker.apeRushTimer > 0) {
            if (!(attacker.apeRushHitCooldown > 0)) {
              attacker.apeRushHitCooldown = 0.25;
              const apeDmg = applyDamage(defender, 15);
              entities.push(spawnShockRing(midX, midY, "#ef4444", 105, 0.32));
              spawnSparks(midX, midY, "#f59e0b", "#ef4444");
              spawnDamageText(defender.x, defender.y - defender.radius - 14, apeDmg, "#ef4444", true, "APE RUSH!");
              const kAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
              defender.vx = Math.cos(kAng) * 480;
              defender.vy = Math.sin(kAng) * 480;
            }
            const rushSpd = attacker.baseSpeed * 2.45;
            const aAng = Math.atan2(attacker.vy, attacker.vx);
            attacker.vx = Math.cos(aAng) * rushSpd;
            attacker.vy = Math.sin(aAng) * rushSpd;
          } else {
            const apeDmg = applyDamage(defender, 5);
            spawnSparks(midX, midY, "#b45309", "#ef4444");
            spawnDamageText(defender.x, defender.y - defender.radius - 12, apeDmg, "#f59e0b", true, "APE SMASH!");
            const kAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
            defender.vx += Math.cos(kAng) * 260;
            defender.vy += Math.sin(kAng) * 260;
          }
        }
      };
      checkDashImpact(b1, b2);
      checkDashImpact(b2, b1);

      // Stand strike from behind on collision (Dio / Jotaro)
      const checkStandImpact = (attacker, defender) => {
        if (attacker.costume === "dio" || attacker.costume === "jotaro") {
          const isJotaro = attacker.costume === "jotaro";
          const standColor = isJotaro ? "#9b59b6" : COLORS.gold;
          const cry = isJotaro ? "ORA!" : "MUDA!";
          const heavyCry = isJotaro ? "HEAVY ORA!" : "HEAVY MUDA!";
          attacker.standAttackTimer = 0.3;
          if (timeStopTimer > 0 && attacker === timeStopOwner) {
            const heavyStandDmg = applyDamage(defender, Math.round(4 + rng() * 2));
            if (isJotaro) {
              defender.stoppedTimeHits = (defender.stoppedTimeHits || 0) + 1;
              defender.stoppedTimeAngle = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
            }
            spawnSparks(midX, midY, standColor, COLORS.white);
            spawnDamageText(defender.x, defender.y - defender.radius - 16, heavyStandDmg, standColor, true, heavyCry);
            shakeTime = 0.14;
            shakeIntensity = 3.5;
            sound.playCritHit();
          } else {
            spawnDamageText(defender.x, defender.y - defender.radius - 12, 0, standColor, false, cry);
          }
        }
      };
      checkStandImpact(b1, b2);
      checkStandImpact(b2, b1);

      runSkillHook(b1, "onHit", b2, game, { damageDealt: dmgToB2, isCrit: hitB2.isCrit, impactSpeed, nx, ny, midX, midY });
      runSkillHook(b2, "onHit", b1, game, { damageDealt: dmgToB1, isCrit: hitB1.isCrit, impactSpeed, nx: -nx, ny: -ny, midX, midY });

      checkKO(midX, midY);
    }
  }

  function checkKO(focusX, focusY) {
    if (koSequence || roundOver || matchOver) return;
    const [b1, b2] = balls;
    if (b1.hp <= 0 && b2.hp <= 0) {
      b1.alive = false;
      b2.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b1.x, focusY ?? b1.y, -1);
    } else if (b1.hp <= 0) {
      b1.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b1.x, focusY ?? b1.y, 1);
    } else if (b2.hp <= 0) {
      b2.alive = false;
      updateHUD();
      startKOSequence(focusX ?? b2.x, focusY ?? b2.y, 0);
    } else {
      updateHUD();
    }
  }

  function updateStandState(ball, dt) {
    const st = ball.standState;
    if (!st) return;

    if (st.phase === "dashing") {
      if (!st.target || !st.target.alive) {
        st.phase = "returning";
        return;
      }

      if (st.heavy || ball.ultTimer > 0) {
        // Auto-aim / homing during Time Stop Ult
        st.angle = Math.atan2(st.target.y - st.y, st.target.x - st.x);
      }

      // Straight-line dash (unless in Ult auto-aim)
      const dashSpeed = 920;
      const stepDist = dashSpeed * dt;
      st.x += Math.cos(st.angle) * stepDist;
      st.y += Math.sin(st.angle) * stepDist;
      st.dashDist += stepDist;

      if (Math.random() < 0.65) {
        particles.push({
          x: st.x,
          y: st.y,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40,
          size: 4,
          life: 0.16,
          maxLife: 0.16,
          color: st.standColor || COLORS.gold,
        });
      }

      const dist = Math.hypot(st.target.x - st.x, st.target.y - st.y);
      if (dist <= st.target.radius + 26) {
        st.phase = "barraging";
        st.barrageTimer = 0;
        ball.standAttackTimer = 0.6;
        sound.playMudaRush();
        const isOra = st.cry === "ORA";
        const startLabel = st.heavy ? (isOra ? "ORA ORA ORA!" : "MUDA MUDA MUDA!") : (isOra ? "ORA BARRAGE!" : "STAND BARRAGE!");
        spawnDamageText(st.target.x, st.target.y - st.target.radius - 14, 0, st.standColor || COLORS.gold, false, startLabel);
      } else if (st.dashDist >= st.maxDashDist) {
        st.phase = "returning";
      }
    } else if (st.phase === "barraging") {
      if (!st.target || !st.target.alive) {
        st.phase = "returning";
        return;
      }
      const dx = st.target.x - st.x;
      const dy = st.target.y - st.y;
      const dist = Math.hypot(dx, dy);
      if (st.heavy || ball.ultTimer > 0) {
        st.angle = Math.atan2(dy, dx);
        const standDist = st.target.radius + 22;
        st.x = st.target.x - Math.cos(st.angle) * standDist;
        st.y = st.target.y - Math.sin(st.angle) * standDist;
      } else if (dist > st.target.radius + 72) {
        st.phase = "returning";
        return;
      }
      st.angle = Math.atan2(dy, dx);
      ball.standAttackTimer = 0.25;

      st.barrageTimer -= dt;
      if (st.barrageTimer <= 0 && st.punchesLeft > 0) {
        st.barrageTimer = st.punchInterval;
        st.punchesLeft--;
        st.hitCount = (st.hitCount || 0) + 1;

        // Ramping DoT barrage: hit 1 barely scratches, hit 2+ ramps up moderately
        const baseFirst = 1;
        const rampStep = st.heavy ? 1.35 : 1;
        const dmgAmt = Math.round(baseFirst + (st.hitCount - 1) * rampStep);
        const isEscalated = st.hitCount >= 2;
        const dealt = applyDamage(st.target, dmgAmt);
        if (st.vampiric !== false && ball.costume === "dio") {
          BF.tryDioVampiricHeal(ball);
        }
        if (timeStopTimer > 0 && ball === timeStopOwner && ball.costume === "jotaro") {
          st.target.stoppedTimeHits = (st.target.stoppedTimeHits || 0) + 1;
          st.target.stoppedTimeAngle = st.angle;
        }
        addEffect(st.target, "slow", 0.35, { factor: 0.45 });
        st.target.flashTimer = 0.08;
        st.target.squash = 0.65;
        const sc = st.standColor || COLORS.gold;
        const isOra = st.cry === "ORA";
        spawnSparks(st.target.x, st.target.y, sc, st.heavy ? COLORS.red : COLORS.green);
        spawnDamageText(
          st.target.x + (rng() - 0.5) * 26,
          st.target.y - st.target.radius * 0.6 + (rng() - 0.5) * 16,
          dealt,
          isEscalated && st.heavy ? COLORS.red : sc,
          st.heavy && st.hitCount >= 4,
          st.hitCount === 1 ? (isOra ? "ORA" : "MUDA") : (st.heavy ? (isOra ? "HEAVY ORA!" : "HEAVY MUDA!") : (isOra ? "ORA!" : "MUDA!"))
        );
        sound.playBallHit();
        shakeTime = Math.max(shakeTime, 0.1);
        shakeIntensity = Math.max(shakeIntensity, st.heavy ? 3.5 : 2);

        if (st.hitCount >= 2 && !st.ultCharged && !st.heavy) {
          st.ultCharged = true;
          chargeUlt(ball);
        }

        if (st.punchesLeft <= 0) {
          if (ball.costume === "jotaro" && ball.yareYareMode && !(timeStopTimer > 0)) {
            st.target.vx = Math.cos(st.angle) * 480;
            st.target.vy = Math.sin(st.angle) * 480;
            spawnDamageText(st.target.x, st.target.y - st.target.radius - 14, 0, "#00f0ff", true, "SKULL CRUSHER ORA!!");
          }
          st.phase = "returning";
        }
      }
    } else if (st.phase === "clashing") {
      ball.standAttackTimer = 0.25;
      st.clashTimer -= dt;
      st.clashPulseTimer -= dt;

      // Dynamic push of the two Stands based on the tug-of-war meter (smooth, minimal vibration so it's easy to watch)
      const primarySt = st.clashPrimary ? st : (st.clashPartner && st.clashPartner.standState ? st.clashPartner.standState : st);
      const curMeter = primarySt.clashMeter ?? 0.5;
      const pushShift = (curMeter - 0.5) * 44;
      const mainAng = primarySt.angle || 0;
      const microVibe = Math.sin(st.clashTimer * 35) * 1.2;
      st.x = st.clashBaseX + Math.cos(mainAng) * pushShift + Math.cos(mainAng) * microVibe;
      st.y = st.clashBaseY + Math.sin(mainAng) * pushShift + Math.sin(mainAng) * microVibe;

      if (st.clashPulseTimer <= 0) {
        st.clashPulseTimer = 0.09;
        if (st.clashPrimary) {
          const prog = 1 - Math.max(0, st.clashTimer / (st.clashDuration || 2.4));
          if (prog < 0.62) {
            // Dramatic tug-of-war back-and-forth swings
            st.clashMeter = Math.max(0.24, Math.min(0.76, st.clashMeter + (rng() - 0.5) * 0.18));
          } else {
            // Final push toward the 50/50 clash winner
            const targetMeter = st.clashWinnerIdx === 0 ? 0.74 + rng() * 0.12 : 0.14 + rng() * 0.12;
            st.clashMeter += (targetMeter - st.clashMeter) * 0.44;
          }
          const fxX = st.clashMidX + Math.cos(mainAng) * pushShift;
          const fxY = st.clashMidY + Math.sin(mainAng) * pushShift;
          spawnSparks(fxX, fxY, COLORS.gold, "#a855f7");
          sound.playBallHit();
        }
      }

      if (st.clashTimer <= 0) {
        if (st.clashPrimary) {
          const fighters = [ball, st.clashPartner].filter((f) => f && f.alive);
          if (fighters.length === 2) {
            const winnerIdx = st.clashMeter >= 0.5 ? 0 : 1;
            const winner = fighters[winnerIdx];
            const loser = fighters[1 - winnerIdx];
            const winSt = winner.standState;
            const loseSt = loser.standState;

            if (winSt && loseSt) {
              // Transition into Finisher Animation: Winning Stand punches the Losing Stand into the Losing User!
              const finAng = Math.atan2(loser.y - winSt.y, loser.x - winSt.x);
              winSt.phase = "clash_finisher";
              winSt.angle = finAng;
              winSt.finisherTimer = 0.42;
              winSt.finisherMax = 0.42;
              winSt.finisherStartX = winSt.x;
              winSt.finisherStartY = winSt.y;
              winSt.finisherTargetStandX = loseSt.x;
              winSt.finisherTargetStandY = loseSt.y;
              winSt.finisherLoser = loser;
              winSt.finisherStage = 0;

              loseSt.phase = "clash_broken";
              loseSt.brokenStartX = loseSt.x;
              loseSt.brokenStartY = loseSt.y;
              loseSt.brokenTimer = 0.42;

              // Immediate first impact on the losing Stand!
              entities.push(spawnShockRing(loseSt.x, loseSt.y, winner.color, 135, 0.36));
              spawnCritBurst(loseSt.x, loseSt.y);
              const winCry = winner.costume === "jotaro" ? "STAR BREAKER: ORA!!" : "THE WORLD: MUDA!!";
              spawnDamageText(loseSt.x, loseSt.y - 26, 0, winner.color, true, winCry);
              sound.playCritHit();
              hitStop = 0.06;
              shakeTime = 0.16;
              shakeIntensity = 3.5;
              return;
            }
          }
          st.phase = "returning";
        }
      }
    } else if (st.phase === "clash_finisher") {
      ball.standAttackTimer = 0.3;
      st.finisherTimer -= dt;
      const p = 1 - Math.max(0, st.finisherTimer / (st.finisherMax || 0.42));
      const loser = st.finisherLoser;

      if (loser && loser.alive) {
        const loseSt = loser.standState;
        if (p < 0.48) {
          // Stage 1: Winning Stand lunges into Losing Stand & punches it backward toward the Losing User!
          const k = easeOut(p / 0.48);
          st.x = st.finisherStartX + (st.finisherTargetStandX - st.finisherStartX) * k;
          st.y = st.finisherStartY + (st.finisherTargetStandY - st.finisherStartY) * k;
          if (loseSt && loseSt.phase === "clash_broken") {
            loseSt.x = loseSt.brokenStartX + (loser.x - loseSt.brokenStartX) * k;
            loseSt.y = loseSt.brokenStartY + (loser.y - loseSt.brokenStartY) * k;
          }
        } else {
          // Stage 2: Losing Stand shatters into the Losing User & Winning Stand follows through, blasting the User across the arena!
          if (st.finisherStage === 0) {
            st.finisherStage = 1;
            if (loseSt) loser.standState = null;

            const loseAng = Math.atan2(loser.y - ball.y, loser.x - ball.x);
            st.x = loser.x - Math.cos(loseAng) * (loser.radius + 14);
            st.y = loser.y - Math.sin(loseAng) * (loser.radius + 14);
            st.angle = loseAng;

            // Recoil on winner + Ult charge
            winnerRecoil: {
              const winAng = loseAng + Math.PI;
              ball.vx = Math.cos(winAng) * 180;
              ball.vy = Math.sin(winAng) * 180;
              chargeUlt(ball);
              spawnDamageText(ball.x, ball.y - ball.radius - 14, 0, COLORS.gold, false, "CLASH WIN! +ULT");
            }

            // Massive knockback sends the losing user flying far across the arena!
            const launchSpeed = 1120;
            loser.vx = Math.cos(loseAng) * launchSpeed;
            loser.vy = Math.sin(loseAng) * launchSpeed;
            loser.knockbackTimer = 0.68;
            const clashDmg = applyDamage(loser, Math.round(16 + rng() * 5));
            loser.flashTimer = 0.28;
            loser.squash = 1.0;

            entities.push(spawnShockRing(loser.x, loser.y, COLORS.gold, 185, 0.5));
            entities.push(spawnShockRing(loser.x, loser.y, COLORS.red, 135, 0.38));
            spawnCritBurst(loser.x, loser.y);
            spawnSparks(loser.x, loser.y, COLORS.red, COLORS.gold);
            spawnDamageText(loser.x, loser.y - loser.radius - 18, clashDmg, COLORS.red, true, "STAND CRUSHED!!");
            hitStop = 0.08;
            shakeTime = 0.22;
            shakeIntensity = 5.5;
            sound.playCritHit();
            checkKO(loser.x, loser.y);
          }
        }
      }

      if (st.finisherTimer <= 0) {
        st.phase = "returning";
      }
    } else if (st.phase === "clash_broken") {
      ball.standAttackTimer = 0.25;
      st.brokenTimer -= dt;
      if (st.brokenTimer <= 0) {
        ball.standState = null;
      }
    } else if (st.phase === "returning") {
      let backAng = Math.atan2(ball.vy, ball.vx);
      if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) backAng = ball.weaponAngle || 0;
      const homeX = ball.x - Math.cos(backAng) * (ball.radius * 0.85);
      const homeY = ball.y - Math.sin(backAng) * (ball.radius * 0.85) - 8;
      const dx = homeX - st.x;
      const dy = homeY - st.y;
      const dist = Math.hypot(dx, dy);
      const retSpeed = 840 * dt;
      if (dist <= retSpeed + 8) {
        ball.standState = null;
      } else {
        st.x += (dx / dist) * retSpeed;
        st.y += (dy / dist) * retSpeed;
      }
    }
  }

  function step(dt) {
    if (!running || roundOver || matchOver) return;

    let timeScale = speedMultiplier;
    if (koSequence) {
      koSequence.timer += dt;
      const t = Math.min(1, koSequence.timer / koSequence.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      cameraZoom = 1 + (KO_ZOOM_SCALE - 1) * ease;
      cameraX = WORLD_SIZE * 0.5 + (koSequence.targetX - WORLD_SIZE * 0.5) * ease;
      cameraY = WORLD_SIZE * 0.5 + (koSequence.targetY - WORLD_SIZE * 0.5) * ease;
      timeScale = speedMultiplier * KO_SLOWMO_SCALE;

      if (koSequence.timer >= koSequence.duration) {
        const winnerIndex = koSequence.winnerIndex;
        koSequence = null;
        cameraZoom = 1;
        cameraX = WORLD_SIZE * 0.5;
        cameraY = WORLD_SIZE * 0.5;
        finishRound(winnerIndex);
        return;
      }
    }

    const scaledDt = dt * timeScale;

    if (shakeTime > 0) {
      shakeTime = Math.max(0, shakeTime - dt);
      if (shakeTime <= 0) {
        shakeIntensity = 0;
      }
    }

    if (hitStop > 0) {
      hitStop = Math.max(0, hitStop - dt);
      return;
    }

    elapsed += scaledDt;
    if (hitCooldown > 0) {
      hitCooldown = Math.max(0, hitCooldown - scaledDt);
    }

    if (timeStopTimer > 0) {
      timeStopTimer = Math.max(0, timeStopTimer - scaledDt);
      if (timeStopTimer <= 0) {
        triggerTimeResume();
      }
    }

    for (const ball of balls) {
      if (!ball.alive) continue;

      // When Time Stop is active, frozen opponent cannot move or act!
      if (timeStopTimer > 0 && ball !== timeStopOwner) {
        if (ball.flashTimer > 0) {
          ball.flashTimer = Math.max(0, ball.flashTimer - dt);
        }
        if (ball.squash > 0) {
          ball.squash = Math.max(0, ball.squash - dt * 5);
        }
        continue;
      }

      if (ball.flashTimer > 0) {
        ball.flashTimer = Math.max(0, ball.flashTimer - dt);
      }
      if (ball.squash > 0) {
        ball.squash = Math.max(0, ball.squash - dt * 5);
      }
      if (!ball.swingState) {
        if (ball.weapon === "dragonslayer") {
          // Guts keeps Dragonslayer slung steadily behind his back; only swings & hits during skill
          if (Math.hypot(ball.vx, ball.vy) > 1) {
            ball.weaponAngle = Math.atan2(-ball.vy, -ball.vx);
          }
        } else {
          ball.weaponAngle += dt * 4.2;
        }
      }
      if (ball.standAttackTimer > 0) {
        ball.standAttackTimer = Math.max(0, ball.standAttackTimer - dt);
      }
      if (ball.standState) {
        updateStandState(ball, scaledDt);
      }
      if (ball.costume === "naruto" && ball.evolved && ball.hp > 0 && ball.hp <= 200 && !ball.kyuubiMode) {
        triggerNarutoKyuubiTransform(ball);
      }
      if (ball.costume === "ichigo" && ball.hp > 0) {
        if (ball.evolved && ball.hp <= 200 && !ball.vastoLordeMode) {
          triggerIchigoVastoTransform(ball);
        } else if (!ball.evolved && ball.hp <= 100 && !ball.innerDemonMode) {
          triggerIchigoInnerDemonTransform(ball);
        }
      }
      if (ball.ultTimer > 0) {
        ball.ultTimer = Math.max(0, ball.ultTimer - scaledDt);
        if (ball.costume === "goku" && ball.hp <= 200 && !ball.apeMode) {
          triggerGokuApeTransform(ball);
        }
        if (ball.ultTimer <= 0) {
          ball.radius = (ball.kyuubiMode || ball.vastoLordeMode)
            ? Math.round(ball.baseRadius * 1.08)
            : (ball.innerDemonMode ? Math.round(ball.baseRadius * 1.05) : ball.baseRadius);
          ball.apeMode = false;
          ball.apeRushTimer = 0;
        }
      }

      // Dio throws knives periodically during stopped time!
      if (timeStopTimer > 0 && ball === timeStopOwner) {
        if (ball.knifeWavesLeft > 0) {
          ball.knifeWaveTimer -= scaledDt;
          if (ball.knifeWaveTimer <= 0) {
            ball.knifeWaveTimer = 0.85;
            ball.knifeWavesLeft--;
            const enemy = balls.find((x) => x !== ball && x.alive);
            if (enemy) {
              sound.playKnifeThrow();
              BF.spawnKnifeWave(ball, enemy, 3);
              spawnDamageText(ball.x, ball.y - ball.radius, 0, COLORS.silver, false, "CHECKMATE!");
            }
          }
        }
      }
      if (ball.rocketTimer > 0) {
        ball.rocketTimer = Math.max(0, ball.rocketTimer - scaledDt);
      }
      if (ball.rasenganTimer > 0) {
        ball.rasenganTimer = Math.max(0, ball.rasenganTimer - scaledDt);
      }
      if (ball.kyuubiSlashTimer > 0) {
        ball.kyuubiSlashTimer = Math.max(0, ball.kyuubiSlashTimer - scaledDt);
      }
      if (ball.shunpoDashTimer > 0) {
        ball.shunpoDashTimer = Math.max(0, ball.shunpoDashTimer - scaledDt);
      }
      if (ball.dragonRushTimer > 0) {
        ball.dragonRushTimer = Math.max(0, ball.dragonRushTimer - scaledDt);
      }
      if (ball.cleaveDashTimer > 0) {
        ball.cleaveDashTimer = Math.max(0, ball.cleaveDashTimer - scaledDt);
      }
      if (ball.jinwooDashTimer > 0) {
        ball.jinwooDashTimer = Math.max(0, ball.jinwooDashTimer - scaledDt);
      }
      if (ball.denjiDashTimer > 0) {
        ball.denjiDashTimer = Math.max(0, ball.denjiDashTimer - scaledDt);
      }
      if (ball.apeRushTimer > 0) {
        ball.apeRushTimer = Math.max(0, ball.apeRushTimer - scaledDt);
      }
      if (ball.apeRushHitCooldown > 0) {
        ball.apeRushHitCooldown = Math.max(0, ball.apeRushHitCooldown - scaledDt);
      }
      if (ball.knockbackTimer > 0) {
        ball.knockbackTimer = Math.max(0, ball.knockbackTimer - scaledDt);
      }
      ball.updateEffects(scaledDt);

      if (ball.channelTimer > 0) {
        ball.channelTimer = Math.max(0, ball.channelTimer - scaledDt);
        if (ball.cast) {
          ball.cast.t += scaledDt;
          if (ball.cast.kind === "inflate") {
            const q = Math.min(1, ball.cast.t / ball.cast.duration);
            ball.radius = Math.round(ball.baseRadius * (1 + 0.18 * q * (0.8 + 0.2 * Math.abs(Math.sin(q * Math.PI * 6)))));
          }
          if (ball.channelTimer <= 0) {
            const cst = ball.cast;
            ball.cast = null;
            cst.fire(ball, game);
            shakeTime = Math.max(shakeTime, 0.12);
            shakeIntensity = Math.max(shakeIntensity, 3);
          }
        }
        continue;
      }

      // Freeze both fighters in place while their Stands, Domains, or Cosmic Awakening are active
      if (
        game._cosmicCutsceneTimer > 0 ||
        (ball.standState && (ball.standState.phase === "clashing" || ball.standState.phase === "clash_finisher" || ball.standState.phase === "clash_broken")) ||
        ball.domainClashTimer > 0
      ) {
        if (ball.domainClashTimer > 0) ball.domainClashTimer = Math.max(0, ball.domainClashTimer - scaledDt);
        continue;
      }

      for (const skill of ball.skills) {
        if (skill._cd > 0) skill._cd = Math.max(0, skill._cd - scaledDt);
      }
      if (!ball.getEffect("stun")) {
        runSkillHook(ball, "onTick", game, scaledDt);
      }

      // Great Ape (Oozaru) erratic rampage when NOT in straight-line wall-bouncing Ape Rush
      if (ball.apeMode && !ball.getEffect("stun") && ball.dragonRushTimer <= 0 && !(ball.apeRushTimer > 0)) {
        ball.apeErraticTimer -= scaledDt;
        if (ball.apeErraticTimer <= 0) {
          ball.apeErraticTimer = 0.16 + rng() * 0.22;
          const enemy = balls.find((x) => x !== ball && x.alive);
          let nextAng;
          if (enemy && rng() < 0.55) {
            // Wild erratic lunge vaguely toward enemy with heavy random jitter
            nextAng = Math.atan2(enemy.y - ball.y, enemy.x - ball.x) + (rng() - 0.5) * 1.9;
          } else {
            // Completely unpredictable sudden direction snap
            nextAng = rng() * Math.PI * 2;
          }
          const burstSpeed = ball.baseSpeed * (1.2 + rng() * 0.65);
          ball.vx = Math.cos(nextAng) * burstSpeed;
          ball.vy = Math.sin(nextAng) * burstSpeed;
          if (rng() < 0.25) {
            entities.push(spawnShockRing(ball.x, ball.y, "#f59e0b", 65, 0.24));
          }
        }
      } else if (ball.apeMode && ball.apeRushTimer > 0 && !ball.getEffect("stun")) {
        // Keep Great Ape hurtling forward at full Ape Rush speed between wall bounces
        const rushSpd = ball.baseSpeed * 2.45;
        const curAng = Math.atan2(ball.vy, ball.vx);
        ball.vx = Math.cos(curAng) * rushSpd;
        ball.vy = Math.sin(curAng) * rushSpd;
      }

      const speedFactor = ball.getSpeedMultiplier();
      if (speedFactor > 0) {
        ball.x += ball.vx * speedFactor * scaledDt;
        ball.y += ball.vy * speedFactor * scaledDt;
        if (
          ball.rocketTimer <= 0 &&
          ball.rasenganTimer <= 0 &&
          ball.kyuubiSlashTimer <= 0 &&
          ball.shunpoDashTimer <= 0 &&
          ball.dragonRushTimer <= 0 &&
          ball.cleaveDashTimer <= 0 &&
          ball.knockbackTimer <= 0 &&
          !ball.apeMode
        ) {
          ball.normalizeSpeed();
        }
        handleWallCollisions(ball);
      }
    }

    checkStandClash();

    const anyClashing = balls.some(
      (b) => b.alive && b.standState && (b.standState.phase === "clashing" || b.standState.phase === "clash_finisher" || b.standState.phase === "clash_broken")
    );
    if (!anyClashing && balls[0].alive && balls[1].alive) {
      handleBallCollision(balls[0], balls[1]);
    }

    // Update extra entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
      if (timeStopTimer > 0 && !ent.isTimeStopEntity && !ent.isKnife && !ent.isDioEntity) {
        continue;
      }
      if (!ent.dead && typeof ent.update === "function") {
        ent.update(scaledDt, game);
      }
      if (ent.dead) {
        entities.splice(i, 1);
      }
    }

    checkKO();

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * scaledDt;
      p.y += p.vy * scaledDt;
      if (p.vRot) p.rot = (p.rot || 0) + p.vRot * scaledDt;
      p.life -= scaledDt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const t = floatingTexts[i];
      t.y += t.vy * scaledDt;
      t.life -= scaledDt;
      if (t.life <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    updateHUD();
  }

  function drawWeapon(ball, c = ctx) {
    if (!ball.weapon) return;
    const drawer = BF.WEAPON_DRAWERS[ball.weapon];
    if (!drawer) return;
    const r = ball.radius;
    const orbitR = r + 10;
    const ang = ball.weaponAngle;
    c.save();
    c.translate(ball.x, ball.y);
    c.rotate(ang);
    c.translate(orbitR, 0);
    c.rotate(Math.PI * 0.25);
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";
    drawer(ball, c);
    c.restore();
  }
  function drawHeart(c, hx, hy, size, color) {
    c.save();
    c.translate(hx, hy);
    c.fillStyle = color;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, size * 0.4);
    c.bezierCurveTo(-size * 0.8, -size * 0.2, -size * 0.8, -size * 0.8, 0, -size * 0.4);
    c.bezierCurveTo(size * 0.8, -size * 0.8, size * 0.8, -size * 0.2, 0, size * 0.4);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }



  function drawStandFist(c, x, y, size, punching, rot = 0, fistColor = COLORS.gold, crestColor = "#2ecc71", cuffColor = "#d4a017") {
    c.save();
    c.translate(x, y);
    c.rotate(rot);

    // Wrist cuff
    c.fillStyle = cuffColor;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(-size * 0.65, size * 0.25, size * 1.3, size * 0.55, 3);
    c.fill();
    c.stroke();

    // Armored gauntlet
    c.fillStyle = fistColor;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(-size * 0.85, -size * 0.8, size * 1.7, size * 1.25, size * 0.38);
    c.fill();
    c.stroke();

    // Knuckle ridge & fingers
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-size * 0.6, -size * 0.35);
    c.lineTo(size * 0.6, -size * 0.35);
    c.stroke();

    // Crest on gauntlet
    drawHeart(c, 0, -size * 0.02, size * 0.34, crestColor);

    if (punching) {
      c.strokeStyle = fistColor === COLORS.gold ? "rgba(255, 215, 0, 0.85)" : "rgba(155, 89, 182, 0.9)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(-size * 0.5, size * 0.9);
      c.lineTo(-size * 0.5, size * 1.6);
      c.moveTo(size * 0.5, size * 0.9);
      c.lineTo(size * 0.5, size * 1.6);
      c.stroke();
    }
    c.restore();
  }



  function drawSkinFace(ball, r, c = ctx) {
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = ball.flashTimer > 0 ? COLORS.white : COLORS.skin;
    c.beginPath();
    c.moveTo(-r, -r);
    c.lineTo(r, -r);
    c.lineTo(r, r * 0.5);
    c.quadraticCurveTo(0, r * 0.78, -r, r * 0.5);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawCostume(ball, r, c = ctx) {
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";

    const drawer = BF.COSTUME_DRAWERS[ball.costume];
    if (drawer) drawer(ball, r, c);

    const tilt = { luffy: -0.02, ichigo: 0.12, dio: -0.08, jotaro: -0.1 }[ball.costume];
    if (tilt !== undefined && !(ball.costume === "ichigo" && (ball.ultTimer > 0 || ball.vastoLordeMode))) {
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3.5;
      c.lineCap = "round";
      c.beginPath();
      for (const side of [-1, 1]) {
        c.moveTo(side * r * 0.6, -r * (0.5 + tilt));
        c.lineTo(side * r * 0.12, -r * (0.5 - tilt));
      }
      c.stroke();
    }
    if (ball.costume === "luffy") {
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(r * 0.32, r * 0.2); c.lineTo(r * 0.32, r * 0.42);
      c.moveTo(r * 0.24, r * 0.27); c.lineTo(r * 0.4, r * 0.27);
      c.stroke();
    }
  }
  function drawSkillCooldownRing(ball, c = ctx) {
    const skill = ball.skills && ball.skills[0];
    if (!skill) return;
    const maxCd = skill.cooldown || 1;
    const cd = Math.max(0, skill._cd || 0);
    const progress = cd <= 0.01 ? 1 : Math.max(0, Math.min(1, (maxCd - cd) / maxCd));
    const ringR = ball.radius + 5;

    c.save();
    c.beginPath();
    c.arc(ball.x, ball.y, ringR, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * progress);
    c.lineWidth = 3.5;
    c.lineCap = "round";
    c.strokeStyle = progress >= 1 ? COLORS.green : COLORS.gold;
    c.stroke();
    c.restore();
  }



  function drawKaiokenAura(ball, c) {
    const r = ball.radius;
    const spikes = 10;
    const pulse = Math.sin(elapsed * 22) * 3;
    c.save();
    c.translate(ball.x, ball.y);
    c.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * i) / spikes;
      const rad = i % 2 === 0 ? r + 15 + pulse : r + 4;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fillStyle = COLORS.red;
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = COLORS.ink;
    c.stroke();
    c.restore();
  }



  function drawBallAura(ball, c) {
    // Aura feature removed for now as requested
    return;
  }

  // Naruto holds a Rasengan that grows while the skill recharges (and surges ahead during dash)
  function drawHeldRasengan(ball, c) {
    if (ball.kyuubiMode) return;
    const sk = ball.skills && ball.skills.find((x) => x.name === "Rasengan");
    if (!sk) return;
    const dashing = ball.rasenganTimer > 0;
    const prog = dashing ? 1 : (sk._cd <= 0.01 ? 1 : Math.max(0, 1 - sk._cd / sk.cooldown));
    const a = dashing ? Math.atan2(ball.vy, ball.vx) : ball.weaponAngle + Math.PI;
    const R = dashing ? 18 : 5 + 11 * easeOut(prog);
    c.save();
    c.translate(ball.x + Math.cos(a) * (ball.radius + 14), ball.y + Math.sin(a) * (ball.radius + 14));
    c.rotate(elapsed * (8 + prog * 20));
    if (prog >= 1) {
      c.beginPath();
      c.arc(0, 0, R + 5 + Math.sin(elapsed * 14) * 2, 0, Math.PI * 2);
      c.lineWidth = 6; c.strokeStyle = COLORS.ink; c.stroke();
      c.lineWidth = 2; c.strokeStyle = COLORS.white; c.stroke();
    }
    c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2);
    c.fillStyle = COLORS.blue; c.fill();
    c.lineWidth = 3.5; c.strokeStyle = COLORS.ink; c.stroke();
    c.strokeStyle = COLORS.white; c.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const t = (Math.PI * 2 * i) / 3;
      c.beginPath(); c.arc(0, 0, R * 0.6, t, t + Math.PI * 0.5); c.stroke();
    }
    c.restore();
  }



  function drawBall(ball, c = ctx, showExtras = true) {
    const r = ball.radius;
    if (showExtras) {
      if (ball.apeMode) {
        // Full moon aura & curling ape tail behind Oozaru
        c.save();
        c.fillStyle = "rgba(226, 245, 232, 0.22)";
        c.beginPath();
        c.arc(ball.x, ball.y - r * 0.25, r * 1.85, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#3b2316";
        c.lineWidth = 8;
        c.lineCap = "round";
        const sway = Math.sin(performance.now() * 0.009) * 10;
        c.beginPath();
        c.moveTo(ball.x - r * 0.75, ball.y + r * 0.35);
        c.quadraticCurveTo(ball.x - r * 1.55, ball.y + sway, ball.x - r * 1.85, ball.y - r * 0.45 + sway);
        c.stroke();
        c.restore();
      }
      if (ball.ult === "kaioken" && ball.ultTimer > 0) {
        drawKaiokenAura(ball, c);
      } else {
        drawBallAura(ball, c);
      }
    }
    if (showExtras && ball.shunpoDashTimer > 0) {
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = "rgba(9, 2, 5, 0.65)";
      c.beginPath();
      c.moveTo(ball.radius * 0.9, 0);
      c.lineTo(-ball.radius * 2.7, -ball.radius * 0.9);
      c.lineTo(-ball.radius * 1.7, 0);
      c.lineTo(-ball.radius * 2.7, ball.radius * 0.9);
      c.closePath();
      c.fill();
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-ball.radius * 2.3, -ball.radius * 0.45);
      c.lineTo(ball.radius * 0.85, 0);
      c.lineTo(-ball.radius * 2.3, ball.radius * 0.45);
      c.stroke();
      c.restore();
    }
    if (showExtras && ball.kyuubiSlashTimer > 0) {
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = "rgba(185, 28, 28, 0.52)";
      c.beginPath();
      c.moveTo(ball.radius * 0.95, 0);
      c.lineTo(-ball.radius * 2.5, -ball.radius * 0.95);
      c.lineTo(-ball.radius * 1.55, 0);
      c.lineTo(-ball.radius * 2.5, ball.radius * 0.95);
      c.closePath();
      c.fill();
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.6;
      for (const cy of [-9, 0, 9]) {
        c.beginPath();
        c.moveTo(-ball.radius * 1.9, cy * 1.3);
        c.lineTo(ball.radius * 1.25, cy * 0.5);
        c.stroke();
      }
      c.restore();
    }
    if (showExtras && ball.cleaveDashTimer > 0) {
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = "rgba(220, 38, 38, 0.45)";
      c.beginPath();
      c.moveTo(ball.radius * 0.8, 0);
      c.lineTo(-ball.radius * 2.6, -ball.radius * 0.85);
      c.lineTo(-ball.radius * 1.7, 0);
      c.lineTo(-ball.radius * 2.6, ball.radius * 0.85);
      c.closePath();
      c.fill();
      c.strokeStyle = "#fecaca";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-ball.radius * 2.2, -ball.radius * 0.4);
      c.lineTo(ball.radius * 0.6, 0);
      c.lineTo(-ball.radius * 2.2, ball.radius * 0.4);
      c.stroke();
      c.restore();
    }
    if (showExtras && ball.apeMode && ball.apeRushTimer > 0) {
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = "rgba(220, 38, 38, 0.48)";
      c.beginPath();
      c.moveTo(ball.radius * 0.85, 0);
      c.lineTo(-ball.radius * 2.4, -ball.radius * 1.05);
      c.lineTo(-ball.radius * 1.5, 0);
      c.lineTo(-ball.radius * 2.4, ball.radius * 1.05);
      c.closePath();
      c.fill();
      c.strokeStyle = "#fef08a";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, ball.radius * 1.15, -Math.PI * 0.45, Math.PI * 0.45);
      c.stroke();
      c.restore();
    }
    if (showExtras && ball.dragonRushTimer > 0) {
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = ball.ultTimer > 0 ? "rgba(239, 68, 68, 0.45)" : "rgba(250, 204, 21, 0.45)";
      c.beginPath();
      c.moveTo(ball.radius * 0.6, 0);
      c.lineTo(-ball.radius * 2.5, -ball.radius * 0.9);
      c.lineTo(-ball.radius * 1.8, 0);
      c.lineTo(-ball.radius * 2.5, ball.radius * 0.9);
      c.closePath();
      c.fill();
      c.restore();
    }
    if (showExtras && ball.rocketTimer > 0) {
      // Stretched rubber rocket trail behind Luffy
      const ang = Math.atan2(ball.vy, ball.vx);
      c.save();
      c.translate(ball.x, ball.y);
      c.rotate(ang);
      c.fillStyle = COLORS.red;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.fillRect(-ball.radius * 2.1, -9, ball.radius * 1.5, 18);
      c.strokeRect(-ball.radius * 2.1, -9, ball.radius * 1.5, 18);
      c.restore();
    }
    if (showExtras) drawSkillCooldownRing(ball, c);
    if (ball.costume === "dio") {
      BF.drawTheWorldStand(ball, r, c, showExtras);
    } else if (ball.costume === "jotaro") {
      BF.drawStarPlatinumStand(ball, r, c, showExtras);
    }
    drawWeapon(ball, c);
    if (showExtras) drawHeldRasengan(ball, c);
    const hurt = ball.flashTimer > 0;
    const ang = Math.atan2(ball.vy, ball.vx);
    const sq = ball.squash * 0.22;

    c.fillStyle = "rgba(43, 27, 61, 0.2)";
    c.beginPath();
    c.ellipse(ball.x, ball.y + r * 0.95, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
    c.fill();

    c.save();
    c.translate(ball.x, ball.y);
    c.rotate(ang);
    c.scale(1 + sq, 1 - sq);
    c.rotate(-ang);

    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fillStyle = hurt ? COLORS.white : ball.color;
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = COLORS.ink;
    c.stroke();

    drawCostume(ball, r, c);

    const hasFullFaceMask =
      (ball.costume === "gojo" && !(ball.ultTimer > 0)) ||
      (ball.costume === "guts" && ball.ultTimer > 0) ||
      (ball.costume === "ichigo" && (ball.vastoLordeMode || ball.innerDemonMode || (ball.evolved && ball.ultTimer > 0))) ||
      (ball.costume === "goku" && ball.apeMode) ||
      ball.costume === "denji" ||
      (ball.costume === "garou" && ball.ultTimer > 0);
    if (!hasFullFaceMask) {
      c.fillStyle = "rgba(255, 255, 255, 0.55)";
      c.beginPath();
      c.ellipse(-r * 0.4, -r * 0.5, r * 0.26, r * 0.14, -0.6, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = COLORS.ink;
      c.fillStyle = COLORS.ink;
      c.lineCap = "round";
      c.lineJoin = "round";
      if (hurt) {
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-r * 0.5, -r * 0.3);
        c.lineTo(-r * 0.2, -r * 0.1);
        c.lineTo(-r * 0.5, r * 0.08);
        c.moveTo(r * 0.5, -r * 0.3);
        c.lineTo(r * 0.2, -r * 0.1);
        c.lineTo(r * 0.5, r * 0.08);
        c.stroke();
        c.beginPath();
        c.ellipse(0, r * 0.42, r * 0.14, r * 0.18, 0, 0, Math.PI * 2);
        c.fill();
      } else if (BF.FACE_DRAWERS && BF.FACE_DRAWERS[ball.costume]) {
        BF.FACE_DRAWERS[ball.costume](ball, r, c, {
          ex: Math.cos(ang) * r * 0.1,
          ey: Math.sin(ang) * r * 0.1,
          ult: ball.ultTimer > 0,
          cast: Boolean(ball.cast),
        });
      } else {
        const ex = Math.cos(ang) * r * 0.1;
        const ey = Math.sin(ang) * r * 0.1;
        for (const side of [-1, 1]) {
          c.fillStyle = COLORS.white;
          c.beginPath();
          c.arc(side * r * 0.32, -r * 0.08, r * 0.27, 0, Math.PI * 2);
          c.fill();
          c.lineWidth = 2.5;
          c.stroke();
          c.fillStyle = COLORS.ink;
          c.beginPath();
          c.arc(side * r * 0.32 + ex, -r * 0.08 + ey, r * 0.13, 0, Math.PI * 2);
          c.fill();
        }
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, r * 0.22, r * 0.22, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
      }
    }
    c.restore();

    if (showExtras && c === ctx && timeStopTimer > 0 && ball !== timeStopOwner) {
      c.save();
      c.fillStyle = "#e5e7eb";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.font = `bold 13px ${FONT}`;
      c.textAlign = "center";
      c.strokeText("TIME FROZEN", ball.x, ball.y - r - 12);
      c.fillText("TIME FROZEN", ball.x, ball.y - r - 12);
      c.restore();
    }

    if (showExtras) drawBallEffects(ball);
  }

  function drawBallEffects(ball) {
    if (!ball.effects.length) return;
    const spacing = 16;
    const startX = ball.x - ((ball.effects.length - 1) * spacing) * 0.5;
    const y = ball.y - ball.radius - 12;

    ball.effects.forEach((eff, idx) => {
      const x = startX + idx * spacing;
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";

      if (eff.type === "slow") {
        // Solid blue downward triangle
        ctx.fillStyle = COLORS.blue;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.lineTo(6, -4);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (eff.type === "shield") {
        // Solid green/gold shield pentagon
        ctx.fillStyle = COLORS.green;
        ctx.beginPath();
        ctx.moveTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.lineTo(5, 1);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (eff.type === "stun") {
        // Solid gold diamond/star
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 7);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function render() {
    const baseScale = Math.min(canvas.width / WORLD_SIZE, canvas.height / WORLD_SIZE);
    const offsetX = (canvas.width - WORLD_SIZE * baseScale) * 0.5;
    const offsetY = (canvas.height - WORLD_SIZE * baseScale) * 0.5;

    ctx.save();
    ctx.fillStyle = COLORS.ink;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(baseScale, baseScale);

    // Clip to the 500x500 physics arena so zoom/letterbox never bleeds
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.clip();

    // Camera zoom around target point
    ctx.translate(WORLD_SIZE * 0.5, WORLD_SIZE * 0.5);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-cameraX, -cameraY);

    // Hardware-accelerated Time Stop floor (avoid ctx.filter which causes severe CPU freeze on mobile!)
    const inTimeStop = timeStopTimer > 0;
    ctx.fillStyle = inTimeStop ? "#cfd6de" : COLORS.floorA;
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    if (shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * 2 * shakeIntensity,
        (Math.random() - 0.5) * 2 * shakeIntensity
      );
    }

    // Checkerboard floor
    const tile = 50;
    ctx.fillStyle = inTimeStop ? "#b8c2cc" : COLORS.floorB;
    for (let i = 0; i < WORLD_SIZE / tile; i++) {
      for (let j = 0; j < WORLD_SIZE / tile; j++) {
        if ((i + j) % 2 === 1) ctx.fillRect(i * tile, j * tile, tile, tile);
      }
    }

    if (inTimeStop) {
      const isJotaroTS = timeStopOwner && timeStopOwner.costume === "jotaro";
      ctx.fillStyle = isJotaroTS ? "rgba(30, 18, 56, 0.22)" : "rgba(40, 32, 12, 0.20)";
      ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    }

    if (game._moonArenaTimer > 0 && BF.drawMoonArenaOverlay) {
      BF.drawMoonArenaOverlay(ctx, game);
    }

    // Particles
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1.5;
    for (const p of particles) {
      const k = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.fillStyle = p.color;
      if (p.shape === "square") {
        const s = p.size * (0.7 + k * 0.6);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
        ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const ent of entities) {
      if (!ent.dead && typeof ent.render === "function") {
        ent.render(ctx);
      }
    }

    for (const ball of balls) {
      if (ball.alive) {
        // afterimages for fast / empowered balls
        const sp = Math.hypot(ball.vx, ball.vy);
        const nowMs = performance.now();
        const trail = ball._trail || (ball._trail = []);
        if ((sp > 430 || ball.ultTimer > 0 || ball.rocketTimer > 0) && (!trail.length || nowMs - trail[trail.length - 1].t > 38)) {
          trail.push({ x: ball.x, y: ball.y, t: nowMs });
          if (trail.length > 5) trail.shift();
        } else if (trail.length && nowMs - trail[0].t > 200) {
          trail.shift();
        }
        for (let i = 0; i < trail.length; i++) {
          const k = (i + 1) / (trail.length + 1);
          ctx.globalAlpha = 0.28 * k;
          ctx.fillStyle = ball.color;
          ctx.beginPath();
          ctx.arc(trail[i].x, trail[i].y, ball.radius * (0.7 + 0.3 * k), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        drawBall(ball);
      }
    }
    for (const ball of balls) {
      if (ball.alive) drawCast(ball, ctx);
    }

    // Damage numbers
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const t of floatingTexts) {
      const k = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = Math.min(1, k * 2.5);
      if (t.isCrit) {
        ctx.font = `${28 + k * 14}px ${FONT}`;
        ctx.lineWidth = 8;
        ctx.strokeStyle = COLORS.ink;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = COLORS.red;
        ctx.fillText(t.text, t.x, t.y);
      } else {
        ctx.font = `${20 + k * 10}px ${FONT}`;
        ctx.lineWidth = 6;
        ctx.strokeStyle = COLORS.ink;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color || COLORS.gold;
        ctx.fillText(t.text, t.x, t.y);
      }
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (currentScreen === "screen-battle") {
      step(dt);
      render();
    } else {
      renderIdlePreviews(now / 1000);
    }
    requestAnimationFrame(loop);
  }

  // Event listeners & Navigation
  function handleAdvanceRoundOrMatch() {
    sound.unlock();
    if (matchOver) {
      initMatch();
    } else if (roundOver) {
      currentRound += 1;
      initRound();
    }
  }

  function setRecMode(active) {
    recMode = active;
    document.body.classList.toggle("rec-mode", recMode);
    if (btnRecExit) btnRecExit.classList.toggle("hidden", !recMode);
    requestAnimationFrame(resizeCanvas);
  }

  function togglePlay() {
    sound.unlock();
    if (matchOver || roundOver) {
      handleAdvanceRoundOrMatch();
      return;
    }
    running = !running;
    btnPlay.textContent = running ? "PAUSE" : "START";
  }

  btnPlay.addEventListener("click", togglePlay);
  btnReset.addEventListener("click", () => {
    sound.unlock();
    initMatch();
  });
  btnRematch.addEventListener("click", handleAdvanceRoundOrMatch);

  btnSpeed.addEventListener("click", () => {
    sound.unlock();
    speedMultiplier = speedMultiplier === 1 ? 2 : 1;
    btnSpeed.textContent = `${speedMultiplier}X`;
  });

  btnSound.addEventListener("click", () => {
    sound.unlock();
    sound.enabled = !sound.enabled;
    btnSound.textContent = sound.enabled ? "SFX: ON" : "SFX: OFF";
  });

  if (btnRec) {
    btnRec.addEventListener("click", () => {
      sound.unlock();
      setRecMode(!recMode);
    });
  }

  if (btnBattleRec) {
    btnBattleRec.addEventListener("click", () => {
      sound.unlock();
      setRecMode(!recMode);
    });
  }

  if (btnRecExit) {
    btnRecExit.addEventListener("click", () => {
      setRecMode(false);
    });
  }

  // Screen Switcher
  function switchScreen(targetId) {
    sound.unlock();
    currentScreen = targetId;

    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.add("hidden");
    });
    const target = document.getElementById(targetId);
    if (target) target.classList.remove("hidden");

    const appHeader = document.querySelector(".app-header");
    if (appHeader) {
      appHeader.classList.toggle("hidden", targetId === "screen-battle");
    }

    const mainNav = document.getElementById("main-nav");
    if (mainNav) {
      mainNav.classList.toggle("hidden", targetId === "screen-battle");
      mainNav.querySelectorAll(".nav-btn").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-target") === targetId);
      });
    }

    if (targetId === "screen-battle") {
      selecting = false;
      running = true;
      btnPlay.textContent = "PAUSE";
      requestAnimationFrame(resizeCanvas);
    } else {
      selecting = true;
      running = false;
      btnPlay.textContent = "START";
    }

    if (targetId === "screen-play") {
      updateHomeMatchupUI();
    } else if (targetId === "screen-setup") {
      updateUnifiedSetupUI();
    } else if (targetId === "screen-chars") {
      if (rosterModal) rosterModal.classList.add("hidden");
      updateCharDetailUI();
    } else if (targetId === "screen-profile") {
      updateProfileUI();
    } else if (targetId === "screen-shop") {
      updateShopUI();
    }
  }

  // Navigation Event Handlers
  document.querySelectorAll(".cartoon-nav .nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (targetId) switchScreen(targetId);
    });
  });

  if (btnOpenSandbox) {
    btnOpenSandbox.addEventListener("click", () => {
      switchScreen("screen-setup");
    });
  }

  if (btnQuickFight) {
    btnQuickFight.addEventListener("click", () => {
      switchScreen("screen-battle");
      initMatch();
    });
  }

  if (btnSetupBack) {
    btnSetupBack.addEventListener("click", () => {
      switchScreen("screen-play");
    });
  }

  if (btnStartBattle) {
    btnStartBattle.addEventListener("click", () => {
      switchScreen("screen-battle");
      initMatch();
    });
  }

  if (btnBackToHub) {
    btnBackToHub.addEventListener("click", () => {
      switchScreen("screen-play");
    });
  }

  if (btnFight) {
    btnFight.addEventListener("click", () => {
      switchScreen("screen-battle");
      initMatch();
    });
  }

  if (btnChangeChar) {
    btnChangeChar.addEventListener("click", () => {
      switchScreen("screen-setup");
    });
  }

  if (btnRoster) {
    btnRoster.addEventListener("click", () => {
      switchScreen("screen-setup");
    });
  }

  const closeRosterModal = () => {
    if (rosterModal) rosterModal.classList.add("hidden");
    refreshSlotConfigs();
    setupUnifiedSelectors();
    updateUnifiedSetupUI();
    updateHomeMatchupUI();
    syncFighterUI();
  };

  if (btnModalClose) {
    btnModalClose.addEventListener("click", () => {
      sound.unlock();
      closeRosterModal();
    });
  }

  if (rosterModal) {
    rosterModal.addEventListener("click", (e) => {
      if (e.target === rosterModal) {
        sound.unlock();
        closeRosterModal();
      }
    });
  }

  if (btnShopModalClose) {
    btnShopModalClose.addEventListener("click", () => {
      sound.unlock();
      if (shopModal) shopModal.classList.add("hidden");
    });
  }

  if (shopModal) {
    shopModal.addEventListener("click", (e) => {
      if (e.target === shopModal) {
        sound.unlock();
        shopModal.classList.add("hidden");
      }
    });
  }

  if (btnShopModalAction) {
    btnShopModalAction.addEventListener("click", () => {
      sound.unlock();
      const item = SHOP_CATALOG.find((x) => x.id === previewShopItemId);
      if (!item) return;

      if (item.status === "AVAILABLE" && item.unlockCharId) {
        if (isFighterUnlocked(item.unlockCharId)) return;
        const curr = item.currency === "gems" ? "gems" : "coins";
        if (playerWallet[curr] < item.price) {
          sound.playBallHit();
          if (merchantSpeechText) {
            merchantSpeechText.textContent = `"Not enough ${curr}, brat! Fight in the arena to earn more ${curr}!"`;
          }
          return;
        }
        playerWallet[curr] -= item.price;
        playerWallet.unlockedFighters.add(item.unlockCharId);
        saveWallet();
        sound.playCritHit();
        if (merchantSpeechText) {
          merchantSpeechText.textContent = `"Hehe! ${item.name} is unlocked! Pick 'em in Battle Setup and crush the arena!"`;
        }
        updateShopUI();
        setupUnifiedSelectors();
        updateUnifiedSetupUI();
        openShopInspectModal(item.id);
        return;
      }

      sound.playBallHit();
      if (merchantSpeechText) {
        merchantSpeechText.textContent = `"Oi brat! I told you ${item.name} is WORK IN PROGRESS! Baa-san is still crafting it for future updates! Go fight in the arena!"`;
      }
    });
  }

  // Single Central Card Setup Tabs (P1 vs P2)
  if (tabP1) {
    tabP1.addEventListener("click", () => {
      sound.unlock();
      activeSlot = 0;
      updateUnifiedSetupUI();
    });
  }

  if (tabP2) {
    tabP2.addEventListener("click", () => {
      sound.unlock();
      activeSlot = 1;
      updateUnifiedSetupUI();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (currentScreen === "screen-setup") {
        if (btnStartBattle) btnStartBattle.click();
      } else if (currentScreen === "screen-battle") {
        togglePlay();
      }
    } else if ((e.key === "r" || e.key === "R") && currentScreen === "screen-battle") {
      sound.unlock();
      initMatch();
    } else if (e.key === "Escape") {
      if (shopModal && !shopModal.classList.contains("hidden")) {
        shopModal.classList.add("hidden");
        return;
      }
      if (rosterModal && !rosterModal.classList.contains("hidden")) {
        closeRosterModal();
        return;
      }
      if (recMode) {
        setRecMode(false);
      }
    }
  });

  window.addEventListener("pointerdown", () => sound.unlock(), { once: true });
  window.addEventListener("resize", resizeCanvas);

  // Turbo Granny Mascot Quotes (Dandadan personality: sassy, grumpy, hilarious)
  function renderShopModalPreview(canvasEl, t) {
    if (!canvasEl) return;
    const pCtx = canvasEl.getContext("2d");
    const w = canvasEl.width;
    const h = canvasEl.height;
    pCtx.clearRect(0, 0, w, h);

    const item = SHOP_CATALOG.find((x) => x.id === previewShopItemId);
    if (!item) return;

    // Dark sleek anime showcase background
    pCtx.fillStyle = "#201533";
    pCtx.fillRect(0, 0, w, h);

    // Subtle background grid
    pCtx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    pCtx.lineWidth = 2;
    for (let x = 20; x < w; x += 22) { pCtx.beginPath(); pCtx.moveTo(x, 0); pCtx.lineTo(x, h); pCtx.stroke(); }
    for (let y = 20; y < h; y += 22) { pCtx.beginPath(); pCtx.moveTo(0, y); pCtx.lineTo(w, y); pCtx.stroke(); }

    if (item.status === "AVAILABLE" && item.previewCharId && CHARACTER_ROSTER[item.previewCharId]) {
      const bob = Math.sin(t * 4) * 4;
      const baseChar = CHARACTER_ROSTER[item.previewCharId];
      const demoBall = {
        x: w * 0.5,
        y: h * 0.48 + bob,
        radius: 26,
        color: baseChar.color,
        costume: baseChar.costume,
        weapon: baseChar.weapon,
        weaponAngle: t * 2,
        vx: 1,
        vy: 0,
        flashTimer: 0,
        squash: Math.max(0, Math.sin(t * 8) * 0.12),
        skills: [],
        effects: [],
        equippedAura: "none",
      };
      drawBall(demoBall, pCtx, true);

      // Rotating sparkles around fighter
      for (let i = 0; i < 4; i++) {
        const ang = t * 3 + (i * Math.PI) / 2;
        const sx = demoBall.x + Math.cos(ang) * 36;
        const sy = demoBall.y + Math.sin(ang) * 36;
        pCtx.fillStyle = (i % 2 === 0) ? COLORS.gold : COLORS.white;
        pCtx.beginPath();
        pCtx.arc(sx, sy, 2.5 + Math.sin(t * 8 + i) * 1, 0, Math.PI * 2);
        pCtx.fill();
      }

      const isOwned = isFighterUnlocked(item.unlockCharId);
      // Status Ribbon on bottom
      pCtx.fillStyle = "rgba(43, 27, 61, 0.85)";
      pCtx.fillRect(0, h - 26, w, 26);
      pCtx.strokeStyle = isOwned ? COLORS.green : COLORS.gold;
      pCtx.lineWidth = 2;
      pCtx.strokeRect(4, h - 24, w - 8, 22);

      pCtx.fillStyle = isOwned ? COLORS.green : COLORS.gold;
      pCtx.font = "bold 11px 'Lilita One', sans-serif";
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";
      pCtx.fillText(isOwned ? "✅ UNLOCKED IN ROSTER" : "🥊 UNLOCKABLE FIGHTER", w * 0.5, h - 13);
    } else {
      // Secret Fighter silhouette preview
      const bob = Math.sin(t * 3.5) * 4;
      const bx = w * 0.5;
      const by = h * 0.46 + bob;
      const br = 26;

      // Dark mystery silhouette ball
      pCtx.beginPath();
      pCtx.arc(bx, by, br, 0, Math.PI * 2);
      pCtx.fillStyle = "#2d1b4e";
      pCtx.fill();
      pCtx.lineWidth = 3.5;
      pCtx.strokeStyle = COLORS.gold;
      pCtx.stroke();

      // Glowing question mark inside
      pCtx.fillStyle = COLORS.gold;
      pCtx.font = "bold 26px 'Lilita One', sans-serif";
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";
      pCtx.fillText("?", bx, by + 1);

      // Swirling mystery particles
      for (let i = 0; i < 5; i++) {
        const ang = -t * 2.5 + (i * Math.PI * 2) / 5;
        const px = bx + Math.cos(ang) * 38;
        const py = by + Math.sin(ang) * 38;
        pCtx.fillStyle = COLORS.gold;
        pCtx.beginPath();
        pCtx.arc(px, py, 2 + Math.sin(t * 6 + i), 0, Math.PI * 2);
        pCtx.fill();
      }

      // WIP Ribbon
      pCtx.fillStyle = "rgba(43, 27, 61, 0.85)";
      pCtx.fillRect(0, h - 26, w, 26);
      pCtx.strokeStyle = COLORS.red;
      pCtx.lineWidth = 2;
      pCtx.strokeRect(4, h - 24, w - 8, 22);

      pCtx.fillStyle = COLORS.red;
      pCtx.font = "bold 11px 'Lilita One', sans-serif";
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";
      pCtx.fillText("🔒 SECRET BRAWLER", w * 0.5, h - 13);
    }
  }

  // Character Previews (Unified Center Card & Character Detail Card)
  function renderIdlePreviews(t) {
    const drawFighter = (canvasEl, cfg, facingRight, phaseOffset, isUlt = false) => {
      if (!canvasEl || !cfg) return;
      const pCtx = canvasEl.getContext("2d");
      pCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const sc = canvasEl === detailCanvas ? canvasEl.width / 160 : 1;
      pCtx.save();
      pCtx.scale(sc, sc);
      const fl = isUlt && typeof isUlt === "object" ? isUlt : { ult: Boolean(isUlt) };
      const tr = fl.ult ? TRANSFORM_DETAILS[cfg.id] : null;
      const bob = Math.sin(t * 3.8 + phaseOffset) * 4;
      const baseScale = cfg.id === "guts" && fl.ult ? 0.96 : 1.15;
      const previewBall = {
        x: (canvasEl.width / sc) * 0.5,
        y: (canvasEl.height / sc) * 0.56 + bob,
        radius: cfg.radius * baseScale * (tr ? tr.radiusMult : 1),
        color: cfg.color,
        costume: cfg.costume,
        skin: fl.skin !== undefined ? fl.skin : (cfg.skin !== undefined ? cfg.skin : (getEquippedSkin ? getEquippedSkin(cfg.id) : null)),
        skins: fl.skins !== undefined ? fl.skins : (cfg.skins !== undefined ? cfg.skins : (getEquippedSkinsForChar ? getEquippedSkinsForChar(cfg.id) : [])),
        weapon: cfg.weapon,
        weaponAngle: cfg.weapon === "dragonslayer"
          ? (facingRight ? -Math.PI * 0.78 : -Math.PI * 0.22)
          : (t * 2.2 + phaseOffset),
        vx: facingRight ? 1 : -1,
        vy: 0,
        flashTimer: 0,
        ultTimer: fl.ult ? 5 : 0,
        evolved: fl.evolved !== undefined ? Boolean(fl.evolved) : (fl.starterOnly ? false : Boolean(cfg.evolved)),
        apeMode: Boolean(fl.apeMode),
        kyuubiMode: Boolean(fl.kyuubiMode),
        vastoLordeMode: Boolean(fl.vastoLordeMode),
        innerDemonMode: Boolean(fl.innerDemonMode),
        gear4Mode: fl.gear4Mode || null,
        cast: null,
        squash: Math.max(0, Math.sin(t * 7.6 + phaseOffset) * 0.14),
        skills: cfg.skills,
        effects: [],
        equippedAura: cfg.equippedAura || "none",
      };
      drawBall(previewBall, pCtx, true);
      pCtx.restore();
    };

    if (currentScreen === "screen-setup" && previewActive) {
      drawFighter(previewActive, BALL_CONFIGS[activeSlot], activeSlot === 0, 0, false);
    } else if (rosterModal && !rosterModal.classList.contains("hidden") && detailCanvas) {
      const f = activeForm();
      const baseCfg = CHARACTER_ROSTER[detailCharId];
      const previewCfg = baseCfg ? {
        ...baseCfg,
        evolved: f && f.starterOnly ? false : (f && f.evolved !== undefined ? Boolean(f.evolved) : Boolean(isEvolutionEquipped && isEvolutionEquipped(baseCfg.id))),
        skin: getEquippedSkin ? getEquippedSkin(baseCfg.id) : null,
        skins: getEquippedSkinsForChar ? getEquippedSkinsForChar(baseCfg.id) : [],
      } : null;
      drawFighter(detailCanvas, previewCfg, true, 0, f || false);
    }

    if (currentScreen === "screen-shop" && merchantCanvas) {
      drawTurboGranny(merchantCanvas, t);
      if (BF.Gacha && BF.Gacha.tick) BF.Gacha.tick(t);
    }
    if (currentScreen === "screen-shop") {
      document.querySelectorAll(".skin-shop-preview-canvas").forEach((cvs, idx) => {
        const skinId = cvs.dataset.skinId;
        const skinSpec = (SKIN_CATALOG || []).find((s) => s.id === skinId);
        if (skinSpec && CHARACTER_ROSTER[skinSpec.charId]) {
          const baseChar = CHARACTER_ROSTER[skinSpec.charId];
          const pCtx = cvs.getContext("2d");
          pCtx.clearRect(0, 0, cvs.width, cvs.height);
          const bob = Math.sin(t * 3.8 + idx) * 2.5;
          const pf = skinSpec.previewFlags || {};
          const demoBall = {
            x: cvs.width * 0.5,
            y: cvs.height * 0.57 + bob,
            radius: 21,
            color: baseChar.color,
            costume: baseChar.costume,
            skin: skinSpec.id,
            skins: [skinSpec.id],
            evolved: pf.evolved !== undefined ? Boolean(pf.evolved) : true,
            kyuubiMode: Boolean(pf.kyuubiMode),
            vastoLordeMode: Boolean(pf.vastoLordeMode),
            innerDemonMode: Boolean(pf.innerDemonMode),
            ultTimer: pf.ult ? 5 : 0,
            weapon: null,
            weaponAngle: 0,
            vx: 1,
            vy: 0,
            flashTimer: 0,
            squash: Math.max(0, Math.sin(t * 7.2 + idx) * 0.08),
            skills: [],
            effects: [],
          };
          drawBall(demoBall, pCtx, false);
        }
      });
    }

    if (shopModal && !shopModal.classList.contains("hidden") && shopModalCanvas) {
      renderShopModalPreview(shopModalCanvas, t);
    }
  }

  function updateHomeMatchupUI() {
    const hc = document.getElementById("home-coins-display");
    const hg = document.getElementById("home-gems-display");
    if (hc) hc.textContent = playerWallet.coins.toLocaleString();
    if (hg) hg.textContent = playerWallet.gems.toLocaleString();
    if (homeP1Name) homeP1Name.textContent = BALL_CONFIGS[0].name;
    if (homeP2Name) homeP2Name.textContent = BALL_CONFIGS[1].name;
    if (homeP1Canvas) drawMiniAvatar(homeP1Canvas, BALL_CONFIGS[0]);
    if (homeP2Canvas) drawMiniAvatar(homeP2Canvas, BALL_CONFIGS[1]);
  }

  function updateUnifiedSetupUI() {
    const activeCfg = BALL_CONFIGS[activeSlot];
    if (!activeCfg) return;

    if (tabP1 && tabP2) {
      tabP1.className = `slot-btn slot-btn-p1 ${activeSlot === 0 ? "active" : ""}`;
      tabP2.className = `slot-btn slot-btn-p2 ${activeSlot === 1 ? "active" : ""}`;
    }

    if (activeSlotBanner) {
      activeSlotBanner.className = `slot-banner banner-p${activeSlot + 1}`;
      activeSlotBanner.textContent = activeSlot === 0 
        ? "EDITING: PLAYER 1 (RED)" 
        : "EDITING: PLAYER 2 (BLUE)";
    }

    if (previewActiveName) previewActiveName.textContent = activeCfg.name;
    if (previewActiveRole) previewActiveRole.textContent = activeCfg.role || `${activeCfg.name} • FIGHTER`;

    const setupEvoBar = document.getElementById("setup-evo-bar");
    if (setupEvoBar) {
      const evoSpec = EVOLUTION_SPECS && EVOLUTION_SPECS[activeCfg.id];
      if (!evoSpec) {
        setupEvoBar.classList.add("hidden");
        setupEvoBar.innerHTML = "";
      } else {
        setupEvoBar.classList.remove("hidden");
        setupEvoBar.innerHTML = "";
        const evolved = isFighterEvolved(activeCfg.id);
        if (evolved) {
          const row = document.createElement("div");
          row.className = "evo-switch-row";
          const equipped = isSlotEvoEquipped(activeSlot, activeCfg.id);

          const btnStarter = document.createElement("button");
          btnStarter.type = "button";
          btnStarter.className = `evo-switch-btn${!equipped ? " active" : ""}`;
          btnStarter.textContent = `P${activeSlot + 1}: ${evoSpec.starterLabel || "STARTER"}`;
          btnStarter.addEventListener("click", () => {
            sound.unlock();
            sound.playBallHit();
            setSlotEvoEquipped(activeSlot, activeCfg.id, false);
            BALL_CONFIGS[activeSlot] = getEffectiveCharConfig(selectedRosterIds[activeSlot], activeSlot);
            setupUnifiedSelectors();
            updateUnifiedSetupUI();
            syncFighterUI();
          });

          const btnEvo = document.createElement("button");
          btnEvo.type = "button";
          btnEvo.className = `evo-switch-btn evo-mode${equipped ? " active" : ""}`;
          btnEvo.textContent = `✨ P${activeSlot + 1}: ${evoSpec.evolvedLabel || "EVOLVED"}`;
          btnEvo.addEventListener("click", () => {
            sound.unlock();
            sound.playCritHit();
            setSlotEvoEquipped(activeSlot, activeCfg.id, true);
            BALL_CONFIGS[activeSlot] = getEffectiveCharConfig(selectedRosterIds[activeSlot], activeSlot);
            setupUnifiedSelectors();
            updateUnifiedSetupUI();
            syncFighterUI();
          });

          row.appendChild(btnStarter);
          row.appendChild(btnEvo);
          setupEvoBar.appendChild(row);
        } else {
          const canAfford = playerWallet.coins >= evoSpec.cost;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn-evolve-gold";
          btn.textContent = canAfford
            ? `✨ EVOLVE: ${evoSpec.evolvedLabel} (🪙 ${evoSpec.cost.toLocaleString()} GOLD)`
            : `🔒 EVOLVE: ${evoSpec.evolvedLabel} (🪙 ${evoSpec.cost.toLocaleString()} GOLD • HAVE ${playerWallet.coins.toLocaleString()})`;
          btn.addEventListener("click", () => {
            sound.unlock();
            if (playerWallet.coins < evoSpec.cost) {
              sound.playWallBounce();
              return;
            }
            const res = evolveFighter(activeCfg.id);
            if (res.ok) {
              sound.playCritHit();
              setSlotEvoEquipped(activeSlot, activeCfg.id, true);
              BALL_CONFIGS[activeSlot] = getEffectiveCharConfig(selectedRosterIds[activeSlot], activeSlot);
              setupUnifiedSelectors();
              updateUnifiedSetupUI();
              updateShopUI();
              syncFighterUI();
            }
          });
          setupEvoBar.appendChild(btn);
        }
      }
    }

    if (statValHp) statValHp.textContent = activeCfg.maxHp;
    if (statValSpd) statValSpd.textContent = activeCfg.speed;
    if (statValMass) statValMass.textContent = activeCfg.mass;
    if (statValDmg) statValDmg.textContent = `${activeCfg.damage[0]}-${activeCfg.damage[1]}`;

    if (unifiedCharGrid) {
      unifiedCharGrid.querySelectorAll(".char-btn-tile").forEach((btn) => {
        btn.classList.toggle("selected", btn.dataset.id === activeCfg.id);
      });
    }

    if (matchupP1Tag) matchupP1Tag.textContent = `P1: ${BALL_CONFIGS[0].name}`;
    if (matchupP2Tag) matchupP2Tag.textContent = `P2: ${BALL_CONFIGS[1].name}`;

    updateHomeMatchupUI();
  }

  const RARITY_LABEL = { starter: "FIGHTER", common: "FIGHTER", rare: "FIGHTER", epic: "FIGHTER", legend: "FIGHTER", fighter: "FIGHTER" };

  function activeForm() {
    const list = BF.FORMS[detailCharId] || [];
    return list.find((f) => f.id === detailFormId) || list[0] || null;
  }

  function applyDetailEvoPreference(charId, useEvo) {
    if (!EVOLUTION_SPECS || !EVOLUTION_SPECS[charId]) return;
    if (useEvo && !(isFighterEvolved && isFighterEvolved(charId))) return;
    setEvolutionEquipped(charId, Boolean(useEvo));
    if (selectedRosterIds[0] === charId) setSlotEvoEquipped(0, charId, Boolean(useEvo));
    if (selectedRosterIds[1] === charId) setSlotEvoEquipped(1, charId, Boolean(useEvo));
    refreshSlotConfigs();
    setupUnifiedSelectors();
    updateUnifiedSetupUI();
    updateHomeMatchupUI();
    syncFighterUI();
  }

  function renderSheetMeta(cfg, form) {
    const stageBox = document.getElementById("detail-stage-list");
    const box = document.getElementById("detail-form-list");
    const evolved = Boolean(isFighterEvolved && isFighterEvolved(cfg.id));
    const eqSkins = getEquippedSkinsForChar ? getEquippedSkinsForChar(cfg.id) : [];
    const stages = (BF.EVO_STAGES && BF.EVO_STAGES[cfg.id]) || null;
    const allForms = BF.FORMS[cfg.id] || [];

    const activeStageId = stages
      ? (form && form.stage ? form.stage : (isEvolutionEquipped && isEvolutionEquipped(cfg.id) ? "evolved" : "starter"))
      : null;

    if (stageBox) {
      if (!stages) {
        stageBox.classList.add("hidden");
        stageBox.innerHTML = "";
      } else {
        stageBox.classList.remove("hidden");
        stageBox.innerHTML = "";
        for (const st of stages) {
          const lockedSt = Boolean(st.evolved && !evolved);
          const isStActive = st.id === activeStageId;
          const sb = document.createElement("button");
          sb.type = "button";
          sb.className = `stage-btn${st.evolved ? " stage-evo" : ""}${lockedSt ? " locked-evo" : ""}${isStActive ? " active" : ""}`;
          sb.textContent = lockedSt ? `🔒 ${st.label}` : (st.evolved ? `✨ ${st.label}` : st.label);
          sb.addEventListener("click", () => {
            sound.unlock();
            detailFormId = st.defaultForm;
            applyDetailEvoPreference(cfg.id, Boolean(st.evolved));
            updateCharDetailUI();
          });
          stageBox.appendChild(sb);
        }
      }
    }

    if (box) {
      box.innerHTML = "";
      const visibleForms = stages
        ? allForms.filter((f) => f.stage === activeStageId)
        : allForms;
      for (const f of visibleForms) {
        const lockedEvo = Boolean(f.evolved && !evolved);
        const b = document.createElement("button");
        b.type = "button";
        b.className = `form-chip${f.ult ? " ult" : ""}${lockedEvo ? " locked-evo" : ""}${form && f.id === form.id ? " active" : ""}`;
        let chipLabel = f.label;
        if (cfg.id === "naruto" && f.id === "kyuubi" && eqSkins.includes("naruto_six_tails_bone")) {
          chipLabel = "SIX-TAILS (SKIN)";
        } else if (cfg.id === "ichigo" && f.id === "hollow" && eqSkins.includes("ichigo_arrancar_arc")) {
          chipLabel = "ARRANCAR MASK (SKIN)";
        } else if (cfg.id === "ichigo" && f.id === "vasto" && eqSkins.includes("ichigo_vasto_half_mask")) {
          chipLabel = "HALF-VASTO (MYTHIC)";
        }
        b.textContent = lockedEvo ? `🔒 ${chipLabel}` : chipLabel;
        b.addEventListener("click", () => {
          sound.unlock();
          detailFormId = f.id;
          if (stages) {
            applyDetailEvoPreference(cfg.id, Boolean(f.evolved));
          }
          updateCharDetailUI();
        });
        box.appendChild(b);
      }
    }
    const detailEvoBox = document.getElementById("detail-evo-box");
    const evoSpec = EVOLUTION_SPECS && EVOLUTION_SPECS[cfg.id];
    if (detailEvoBox) {
      if (!evoSpec) {
        detailEvoBox.classList.add("hidden");
        detailEvoBox.innerHTML = "";
      } else {
        detailEvoBox.classList.remove("hidden");
        const equipped = isEvolutionEquipped(cfg.id);
        const canAfford = playerWallet.coins >= evoSpec.cost;
        detailEvoBox.innerHTML =
          `<div class="power-header">` +
            `<span class="power-badge badge-gold">✨ FIGHTER EVOLUTION</span>` +
            `<span class="power-cd">${evolved ? "UNLOCKED" : `🪙 ${evoSpec.cost.toLocaleString()} GOLD`}</span>` +
          `</div>` +
          `<h3 class="power-title">${evoSpec.evolvedName}</h3>` +
          `<p class="power-desc">${evoSpec.desc}</p>` +
          `<div id="detail-evo-actions" class="evo-bar"></div>`;
        const actBox = detailEvoBox.querySelector("#detail-evo-actions");
        if (actBox) {
          if (evolved) {
            const row = document.createElement("div");
            row.className = "evo-switch-row";
            const bStart = document.createElement("button");
            bStart.type = "button";
            bStart.className = `evo-switch-btn${!equipped ? " active" : ""}`;
            bStart.textContent = evoSpec.starterLabel;
            bStart.addEventListener("click", () => {
              sound.unlock();
              sound.playBallHit();
              detailFormId = cfg.id === "ichigo" ? "shikai" : "base";
              applyDetailEvoPreference(cfg.id, false);
              updateCharDetailUI();
            });
            const bEvo = document.createElement("button");
            bEvo.type = "button";
            bEvo.className = `evo-switch-btn evo-mode${equipped ? " active" : ""}`;
            bEvo.textContent = `✨ ${evoSpec.evolvedLabel}`;
            bEvo.addEventListener("click", () => {
              sound.unlock();
              sound.playCritHit();
              detailFormId = cfg.id === "naruto" ? "sage" : "base";
              applyDetailEvoPreference(cfg.id, true);
              updateCharDetailUI();
            });
            row.appendChild(bStart);
            row.appendChild(bEvo);
            actBox.appendChild(row);
          } else {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-evolve-gold";
            btn.textContent = canAfford
              ? `✨ EVOLVE NOW (🪙 ${evoSpec.cost.toLocaleString()} GOLD)`
              : `🔒 NEED ${evoSpec.cost.toLocaleString()} GOLD (YOU HAVE ${playerWallet.coins.toLocaleString()})`;
            btn.addEventListener("click", () => {
              sound.unlock();
              if (playerWallet.coins < evoSpec.cost) {
                sound.playWallBounce();
                return;
              }
              const res = evolveFighter(cfg.id);
              if (res.ok) {
                sound.playCritHit();
                detailFormId = cfg.id === "naruto" ? "sage" : "base";
                applyDetailEvoPreference(cfg.id, true);
                updateShopUI();
                updateCharDetailUI();
              }
            });
            actBox.appendChild(btn);
          }
        }
      }
    }

    // Diamond Skin Equip Box inside Fighter Detail Sheet (Supports 1 or multiple skins per character!)
    const detailSkinBox = document.getElementById("detail-skin-box");
    const charSkins = (SKIN_CATALOG || []).filter((s) => s.charId === cfg.id);
    if (detailSkinBox) {
      if (!charSkins.length) {
        detailSkinBox.classList.add("hidden");
        detailSkinBox.innerHTML = "";
      } else {
        detailSkinBox.classList.remove("hidden");
        detailSkinBox.innerHTML = "";
        for (const skinSpec of charSkins) {
          const unlockedSkin = Boolean(isSkinUnlocked && isSkinUnlocked(skinSpec.id));
          const isEquipped = Boolean(isSkinEquipped && isSkinEquipped(skinSpec.id));
          const canAffordGems = playerWallet.gems >= skinSpec.price;

          const itemWrap = document.createElement("div");
          itemWrap.style.marginBottom = charSkins.length > 1 ? "10px" : "0";
          itemWrap.innerHTML =
            `<div class="power-header">` +
              `<span class="power-badge badge-purple">💎 ${skinSpec.rarity === "legend" ? "MYTHIC SKIN" : "EVO SKIN"}</span>` +
              `<span class="power-cd">${unlockedSkin ? (isEquipped ? "EQUIPPED" : "OWNED") : `💎 ${skinSpec.price} GEMS`}</span>` +
            `</div>` +
            `<h3 class="power-title">${skinSpec.name}</h3>` +
            `<p class="power-desc">${skinSpec.desc}</p>` +
            `<div class="evo-bar"></div>`;

          const skinAct = itemWrap.querySelector(".evo-bar");
          if (skinAct) {
            const targetForm = skinSpec.previewFormId || (cfg.id === "naruto" ? "kyuubi" : "hollow");
            if (unlockedSkin) {
              const row = document.createElement("div");
              row.className = "evo-switch-row";

              const bDef = document.createElement("button");
              bDef.type = "button";
              bDef.className = `evo-switch-btn${!isEquipped ? " active" : ""}`;
              bDef.textContent = "DEFAULT";
              bDef.addEventListener("click", () => {
                sound.unlock();
                sound.playBallHit();
                setSkinEquipped(skinSpec.id, false);
                detailFormId = targetForm;
                refreshSlotConfigs();
                setupUnifiedSelectors();
                updateUnifiedSetupUI();
                updateShopUI();
                updateCharDetailUI();
                syncFighterUI();
              });

              const bSkin = document.createElement("button");
              bSkin.type = "button";
              bSkin.className = `evo-switch-btn skin-equip-btn${isEquipped ? " active" : ""}`;
              bSkin.textContent = `💀 ${skinSpec.shortLabel || "EQUIP SKIN"}`;
              bSkin.addEventListener("click", () => {
                sound.unlock();
                sound.playCritHit();
                setSkinEquipped(skinSpec.id, true);
                detailFormId = targetForm;
                refreshSlotConfigs();
                setupUnifiedSelectors();
                updateUnifiedSetupUI();
                updateShopUI();
                updateCharDetailUI();
                syncFighterUI();
              });

              row.appendChild(bDef);
              row.appendChild(bSkin);
              skinAct.appendChild(row);
            } else {
              const row = document.createElement("div");
              row.className = "evo-switch-row";

              const btnBuy = document.createElement("button");
              btnBuy.type = "button";
              btnBuy.className = "btn-buy-skin-gem";
              btnBuy.innerHTML = canAffordGems
                ? `<svg><use href="#i-gem"/></svg><span>BUY & EQUIP (${skinSpec.price} GEMS)</span>`
                : `<svg><use href="#i-gem"/></svg><span>NEED ${skinSpec.price} GEMS (HAVE ${playerWallet.gems})</span>`;
              btnBuy.addEventListener("click", () => {
                sound.unlock();
                if (playerWallet.gems < skinSpec.price) {
                  sound.playWallBounce();
                  return;
                }
                const res = buySkin(skinSpec.id);
                if (res.ok) {
                  sound.playCritHit();
                  detailFormId = targetForm;
                  refreshSlotConfigs();
                  setupUnifiedSelectors();
                  updateUnifiedSetupUI();
                  updateShopUI();
                  updateCharDetailUI();
                  syncFighterUI();
                }
              });
              row.appendChild(btnBuy);
              skinAct.appendChild(row);
            }
          }
          detailSkinBox.appendChild(itemWrap);
        }
      }
    }
    const setText = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setText("detail-form-desc", form ? form.desc : "");
    setText("detail-series", BF.SERIES[cfg.id] || "ANIME");
    const rc = document.getElementById("detail-rarity");
    if (rc) { rc.textContent = "FIGHTER"; rc.className = "rar-chip rarity-fighter"; }
    const lock = document.getElementById("detail-lock-note");
    if (lock) lock.classList.toggle("hidden", isFighterUnlocked(cfg.id));
  }

  function updateCharDetailUI() {
    const cfg = CHARACTER_ROSTER[detailCharId] || CHARACTER_ROSTER.goku;
    if (!cfg) return;

    const tr = TRANSFORM_DETAILS[cfg.id] || null;
    const form = activeForm();
    const showingUlt = Boolean(tr && form && form.ult);

    if (detailHeroBox) detailHeroBox.classList.toggle("is-ult-preview", showingUlt);
    renderSheetMeta(cfg, form);

    if (detailName) detailName.textContent = cfg.name;
    if (detailTitle) detailTitle.textContent = cfg.title || "Anime Brawler";

    const effSpeed = showingUlt ? Math.round(cfg.speed * tr.speedMult) : cfg.speed;
    if (detailHpFill) detailHpFill.style.width = `${Math.min(100, Math.round((cfg.maxHp / 650) * 100))}%`;
    if (detailHpVal) detailHpVal.textContent = showingUlt && tr.hpNote ? `${cfg.maxHp} + ${tr.hpNote}` : `${cfg.maxHp} HP`;

    if (detailSpdFill) detailSpdFill.style.width = `${Math.min(100, Math.round((effSpeed / 480) * 100))}%`;
    if (detailSpdVal) detailSpdVal.textContent = showingUlt && tr.speedMult > 1 ? `${effSpeed} (+${Math.round((tr.speedMult - 1) * 100)}%)` : `${effSpeed}`;

    if (detailAtkFill) detailAtkFill.style.width = showingUlt ? "100%" : `${Math.min(100, Math.round((cfg.damage[1] / 20) * 100))}%`;
    if (detailAtkVal) detailAtkVal.textContent = showingUlt && tr.powerText ? tr.powerText : `${cfg.damage[0]}-${cfg.damage[1]} DMG`;

    if (detailMassFill) detailMassFill.style.width = `${Math.min(100, Math.round((cfg.mass / 1.5) * 100))}%`;
    if (detailMassVal) detailMassVal.textContent = `${cfg.mass}`;

    const s1 = cfg.skills[0];
    if (detailSkillName) detailSkillName.textContent = cfg.skillName || (s1 ? s1.name.toUpperCase() : "SKILL");
    if (detailSkillCd) detailSkillCd.textContent = s1 ? `CD: ${s1.cooldown}S` : "PASSIVE";
    if (detailSkillDesc) detailSkillDesc.textContent = cfg.skillDesc || "Special character technique.";

    if (detailUltName) detailUltName.textContent = cfg.ultName || "ULTIMATE POWER";
    if (detailUltDesc) detailUltDesc.textContent = cfg.ultDesc || "5-Hit charged transformation with enhanced combat capabilities.";

    if (detailEmpoweredBox) {
      detailEmpoweredBox.classList.toggle("hidden", !tr);
      if (tr) {
        if (detailEmpName) detailEmpName.textContent = tr.ultSkillName;
        if (detailEmpCd) detailEmpCd.textContent = tr.ultSkillCd;
        if (detailEmpDesc) detailEmpDesc.textContent = tr.ultSkillDesc;
      }
    }
  }

  let activeSkinHeroFilter = "all";

  function updateShopUI() {
    if (shopCoinsDisplay) shopCoinsDisplay.textContent = playerWallet.coins.toLocaleString();
    if (shopGemsDisplay) shopGemsDisplay.textContent = playerWallet.gems.toLocaleString();
    const hc = document.getElementById("home-coins-display");
    const hg = document.getElementById("home-gems-display");
    if (hc) hc.textContent = playerWallet.coins.toLocaleString();
    if (hg) hg.textContent = playerWallet.gems.toLocaleString();
    if (BF.Gacha) BF.Gacha.refresh();

    // Render Diamond Skin Vault in Shop (with per-hero filter & horizontal carousel)
    const skinGrid = document.getElementById("skin-shop-grid");
    const skinCountEl = document.getElementById("skin-shop-count");
    const skinFilterBar = document.getElementById("skin-filter-chips");
    const skins = SKIN_CATALOG || [];

    if (skinFilterBar && !skinFilterBar.dataset.bound) {
      skinFilterBar.dataset.bound = "1";
      skinFilterBar.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          sound.unlock();
          skinFilterBar.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          activeSkinHeroFilter = (chip.dataset.skinChar || "all").toLowerCase();
          updateShopUI();
        });
      });
    }

    if (skinGrid && !skinGrid.dataset.dragBound) {
      skinGrid.dataset.dragBound = "1";
      let isDraggingSkins = false;
      let startX = 0;
      let startScroll = 0;
      skinGrid.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch" || e.target.closest("button")) return;
        isDraggingSkins = true;
        startX = e.clientX;
        startScroll = skinGrid.scrollLeft;
        skinGrid.classList.add("is-dragging");
      });
      window.addEventListener("pointermove", (e) => {
        if (!isDraggingSkins) return;
        const dx = e.clientX - startX;
        skinGrid.scrollLeft = startScroll - dx;
      });
      const stopSkinDrag = () => {
        if (!isDraggingSkins) return;
        isDraggingSkins = false;
        skinGrid.classList.remove("is-dragging");
      };
      window.addEventListener("pointerup", stopSkinDrag);
      window.addEventListener("pointercancel", stopSkinDrag);
      skinGrid.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          skinGrid.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }

    if (skinGrid) {
      skinGrid.innerHTML = "";
      let ownedSkins = 0;
      for (const sk of skins) {
        if (isSkinUnlocked && isSkinUnlocked(sk.id)) ownedSkins++;
      }
      const filteredSkins = skins.filter(
        (sk) => activeSkinHeroFilter === "all" || sk.charId.toLowerCase() === activeSkinHeroFilter
      );
      for (const sk of filteredSkins) {
        const unlocked = Boolean(isSkinUnlocked && isSkinUnlocked(sk.id));
        const equipped = Boolean(
          isSkinEquipped
            ? isSkinEquipped(sk.id)
            : (getEquippedSkin && getEquippedSkin(sk.charId)) === sk.id
        );
        const charCfg = CHARACTER_ROSTER[sk.charId];
        const tierLabel = sk.tier === "MYTHIC" ? "MYTHIC SKIN" : "EVO SKIN";

        const card = document.createElement("div");
        card.className = "skin-shop-card";
        card.innerHTML =
          `<div class="skin-shop-canvas-wrap">` +
            `<canvas class="skin-shop-preview-canvas" data-skin-id="${sk.id}" width="84" height="84"></canvas>` +
          `</div>` +
          `<div class="skin-shop-info">` +
            `<div class="skin-shop-badges">` +
              `<span class="rar-chip rarity-legend">${tierLabel}</span>` +
              `<span class="series-chip">${charCfg ? charCfg.name : sk.charId.toUpperCase()}</span>` +
            `</div>` +
            `<h4 class="skin-shop-name">${sk.name}</h4>` +
            `<p class="skin-shop-desc">${sk.desc}</p>` +
            `<div class="skin-shop-actions"></div>` +
          `</div>`;

        const actRow = card.querySelector(".skin-shop-actions");
        if (actRow) {
          if (!unlocked) {
            const btnBuy = document.createElement("button");
            btnBuy.type = "button";
            btnBuy.className = "btn-buy-skin-gem";
            btnBuy.innerHTML = `<svg><use href="#i-gem"/></svg><span>BUY • ${sk.price} GEMS</span>`;
            btnBuy.addEventListener("click", () => {
              sound.unlock();
              if (playerWallet.gems < sk.price) {
                sound.playWallBounce();
                if (merchantSpeechText) {
                  merchantSpeechText.textContent = `"Oi brat! You need ${sk.price} Gems for ${sk.name}! You only have ${playerWallet.gems}!"`;
                  BF.grannyTalkUntil = performance.now() + 2000;
                }
                return;
              }
              const res = buySkin(sk.id);
              if (res.ok) {
                sound.playCritHit();
                if (merchantSpeechText) {
                  merchantSpeechText.textContent = `"Heh heh! ${sk.name} is yours and equipped! Check it in Fighter Detail!"`;
                  BF.grannyTalkUntil = performance.now() + 2200;
                }
                refreshSlotConfigs();
                setupUnifiedSelectors();
                updateUnifiedSetupUI();
                updateShopUI();
                updateCharDetailUI();
                syncFighterUI();
              }
            });
            actRow.appendChild(btnBuy);
          } else {
            const btnEq = document.createElement("button");
            btnEq.type = "button";
            btnEq.className = `evo-switch-btn skin-equip-btn${equipped ? " active" : ""}`;
            btnEq.textContent = equipped ? "💀 EQUIPPED" : "💀 EQUIP SKIN";
            btnEq.addEventListener("click", () => {
              sound.unlock();
              sound.playCritHit();
              if (setSkinEquipped) {
                setSkinEquipped(sk.id, !equipped);
              } else if (setEquippedSkin) {
                setEquippedSkin(sk.charId, equipped ? null : sk.id);
              }
              refreshSlotConfigs();
              setupUnifiedSelectors();
              updateUnifiedSetupUI();
              updateShopUI();
              updateCharDetailUI();
              syncFighterUI();
            });
            actRow.appendChild(btnEq);
          }

          const btnInspect = document.createElement("button");
          btnInspect.type = "button";
          btnInspect.className = "evo-switch-btn";
          btnInspect.textContent = "🔍 DETAIL";
          btnInspect.addEventListener("click", () => {
            sound.unlock();
            detailCharId = sk.charId;
            detailFormId = sk.previewFormId || "kyuubi";
            updateCharDetailUI();
            if (rosterModal) rosterModal.classList.remove("hidden");
          });
          actRow.appendChild(btnInspect);
        }

        skinGrid.appendChild(card);
      }
      if (skinCountEl) skinCountEl.textContent = `${ownedSkins} / ${skins.length}`;
    }
  }

  function openShopInspectModal(itemId) {
    const item = SHOP_CATALOG.find((x) => x.id === itemId);
    if (!item) return;
    previewShopItemId = itemId;

    const isAvailable = item.status === "AVAILABLE" && item.unlockCharId;
    const isOwned = isAvailable && isFighterUnlocked(item.unlockCharId);
    const curr = item.currency === "gems" ? "gems" : "coins";
    const canAfford = playerWallet[curr] >= item.price;

    const shopModalStamp = document.getElementById("shop-modal-stamp");
    if (shopModalStamp) {
      shopModalStamp.textContent = isOwned ? "UNLOCKED" : isAvailable ? "BUY FIGHTER" : "WIP PREVIEW";
    }
    if (shopModalTitle) shopModalTitle.textContent = item.name;
    if (shopModalDesc) shopModalDesc.textContent = item.desc;
    if (shopModalType) {
      shopModalType.className = `power-badge ${item.badgeClass}`;
      shopModalType.textContent = isOwned ? "FIGHTER • OWNED" : item.badge;
    }
    if (shopModalPrice) {
      if (isOwned) {
        shopModalPrice.textContent = "✅ ALREADY IN YOUR ROSTER";
      } else if (isAvailable) {
        shopModalPrice.textContent = `${curr === "gems" ? "💎" : "🪙"} ${item.price.toLocaleString()} ${curr.toUpperCase()}`;
      } else {
        shopModalPrice.textContent = "🔒 UNDER DEVELOPMENT (WIP)";
      }
    }

    if (btnShopModalAction) {
      if (isOwned) {
        btnShopModalAction.className = "btn btn-wip btn-big";
        btnShopModalAction.textContent = "✅ OWNED IN ROSTER";
        btnShopModalAction.disabled = true;
      } else if (isAvailable) {
        btnShopModalAction.className = canAfford ? "btn btn-play btn-big" : "btn btn-wip btn-big";
        btnShopModalAction.textContent = canAfford
          ? `🛒 BUY (${item.price.toLocaleString()} ${curr.toUpperCase()})`
          : `🔒 NEED ${item.price.toLocaleString()} ${curr.toUpperCase()} (YOU HAVE ${playerWallet[curr]})`;
        btnShopModalAction.disabled = false;
      } else {
        btnShopModalAction.className = "btn btn-wip btn-big";
        btnShopModalAction.textContent = "🔒 UNDER CONSTRUCTION";
        btnShopModalAction.disabled = true;
      }
    }

    if (merchantSpeechText) {
      if (isOwned) {
        merchantSpeechText.textContent = `"You already own ${item.name}! Go wreck someone in the arena!"`;
      } else if (isAvailable) {
        merchantSpeechText.textContent = canAfford
          ? `"Ooh, ${item.name}! Got ${item.price.toLocaleString()} ${curr}? Hand it over and unlock 'em now!"`
          : `"${item.name} costs ${item.price.toLocaleString()} ${curr}, brat! Win matches to earn more!"`;
      } else {
        merchantSpeechText.textContent = `"Oi brat! That ${item.name} is WORK IN PROGRESS! Baa-san is still preparing it for future updates!"`;
      }
    }

    if (shopModal) shopModal.classList.remove("hidden");
  }

  const PROFILE_PREFS_KEY = "bf_profile_prefs_v1";
  let profilePrefs = {
    name: "EPITHAP",
    avatarMode: "auto",
    charId: "goku",
    photoDataUrl: null,
  };
  try {
    const rawPrefs = localStorage.getItem(PROFILE_PREFS_KEY);
    if (rawPrefs) {
      const parsedPrefs = JSON.parse(rawPrefs);
      if (parsedPrefs && typeof parsedPrefs === "object") {
        profilePrefs = { ...profilePrefs, ...parsedPrefs };
      }
    }
  } catch (_) {}

  function saveProfilePrefs() {
    try { localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(profilePrefs)); } catch (_) {}
  }

  function updateProfileUI() {
    try { localStorage.setItem("bf_profile_v1", JSON.stringify(sessionStats)); } catch (_) {}
    const $ = (id) => document.getElementById(id);
    const { matches, wins } = sessionStats;
    const all = Object.values(CHARACTER_ROSTER);
    const have = all.filter((c) => isFighterUnlocked(c.id)).length;

    if (profMatches) profMatches.textContent = matches;
    if (profWins) profWins.textContent = wins;
    if (profWr) profWr.textContent = `${Math.round((wins / Math.max(1, matches)) * 100)}%`;

    let best = null;
    let max = 0;
    for (const [id, n] of Object.entries(sessionStats.charsUsed)) {
      if (n > max && CHARACTER_ROSTER[id]) { max = n; best = id; }
    }
    if (profFav) profFav.textContent = best ? CHARACTER_ROSTER[best].name : "-";

    const nameDisplay = $("profile-name-display");
    if (nameDisplay) nameDisplay.textContent = (profilePrefs.name || "EPITHAP").toUpperCase();

    const avatarCanvas = $("profile-avatar");
    const photoImg = $("profile-photo-img");
    if (profilePrefs.avatarMode === "custom" && profilePrefs.photoDataUrl && photoImg && avatarCanvas) {
      photoImg.src = profilePrefs.photoDataUrl;
      photoImg.classList.remove("hidden");
      avatarCanvas.classList.add("hidden");
    } else {
      if (photoImg) photoImg.classList.add("hidden");
      if (avatarCanvas) avatarCanvas.classList.remove("hidden");
      const chosenId = (profilePrefs.avatarMode === "char" && CHARACTER_ROSTER[profilePrefs.charId])
        ? profilePrefs.charId
        : (best || "goku");
      drawMiniAvatar(avatarCanvas, CHARACTER_ROSTER[chosenId]);
    }

    const exp = wins * 120 + matches * 40;
    const lvl = Math.floor(exp / 500) + 1;
    const rank = lvl >= 12 ? "CHAMPION" : lvl >= 8 ? "ELITE" : lvl >= 5 ? "VETERAN" : lvl >= 3 ? "FIGHTER" : "ROOKIE";
    if ($("profile-lvl")) $("profile-lvl").textContent = `LV.${lvl}`;
    if ($("profile-rank")) $("profile-rank").textContent = rank;
    if ($("profile-exp-fill")) $("profile-exp-fill").style.width = `${(exp % 500) / 5}%`;
    if ($("profile-exp-text")) $("profile-exp-text").textContent = `EXP ${exp % 500} / 500`;

    const trophies = [
      ["i-medal", "First Brawl", matches >= 1],
      ["i-flame", "5 Wins", wins >= 5],
      ["i-crown", "20 Wins", wins >= 20],
      ["i-bolt", "Collector (6)", have >= 6],
      ["i-spark", "Full Roster", have >= all.length],
      ["i-gem", "Legend Pulled", isFighterUnlocked("gojo")],
    ];
    const row = $("trophy-row");
    if (row) {
      row.innerHTML = trophies.map(([ic, name, ok]) => `<div class="trophy${ok ? "" : " locked"}"><svg><use href="#${ic}"/></svg><span>${name}</span></div>`).join("");
    }
    if ($("trophy-count")) $("trophy-count").textContent = `${trophies.filter((t) => t[2]).length} / ${trophies.length}`;
  }

  function drawMiniAvatar(canvasEl, cfg) {
    if (!canvasEl || !cfg) return;
    const pCtx = canvasEl.getContext("2d");
    pCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const radius = Math.round(canvasEl.width * 0.38);
    const avatarBall = {
      x: canvasEl.width * 0.5,
      y: canvasEl.height * 0.54,
      radius: radius,
      color: cfg.color,
      costume: cfg.costume,
      evolved: Boolean(cfg.evolved !== undefined ? cfg.evolved : (isEvolutionEquipped && isEvolutionEquipped(cfg.id))),
      skin: cfg.skin !== undefined ? cfg.skin : (getEquippedSkin ? getEquippedSkin(cfg.id) : null),
      skins: Array.isArray(cfg.skins) ? cfg.skins : (getEquippedSkinsForChar ? getEquippedSkinsForChar(cfg.id) : []),
      weapon: null,
      weaponAngle: 0,
      vx: 1,
      vy: 0,
      flashTimer: 0,
      squash: 0,
      skills: [],
      effects: [],
    };
    drawBall(avatarBall, pCtx, false);
  }

  function setupUnifiedSelectors() {
    const entries = Object.values(CHARACTER_ROSTER);

    // 1. Unified Sandbox Character Selector Grid (Shows ONLY unlocked fighters + Shop shortcut!)
    if (unifiedCharGrid) {
      unifiedCharGrid.innerHTML = "";
      let hasLockedFighters = false;
      for (const char of entries) {
        if (!isFighterUnlocked(char.id)) {
          hasLockedFighters = true;
          continue;
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "char-btn-tile";
        btn.dataset.id = char.id;

        const cvs = document.createElement("canvas");
        cvs.className = "avatar-canvas";
        cvs.width = 44;
        cvs.height = 44;

        const nameSpan = document.createElement("span");
        nameSpan.textContent = char.name;

        btn.appendChild(cvs);
        btn.appendChild(nameSpan);

        btn.addEventListener("click", () => {
          sound.unlock();
          selectedRosterIds[activeSlot] = char.id;
          BALL_CONFIGS[activeSlot] = getEffectiveCharConfig(char.id, activeSlot);
          updateUnifiedSetupUI();
          syncFighterUI();
        });
        unifiedCharGrid.appendChild(btn);
        drawMiniAvatar(cvs, char);
      }

      if (hasLockedFighters) {
        const shopBtn = document.createElement("button");
        shopBtn.type = "button";
        shopBtn.className = "char-btn-tile char-shop-shortcut";
        shopBtn.innerHTML = `<span class="shop-shortcut-icon">🛒</span><span>UNLOCK IN SHOP</span>`;
        shopBtn.addEventListener("click", () => {
          sound.unlock();
          sound.playBallHit();
          switchScreen("screen-shop");
        });
        unifiedCharGrid.appendChild(shopBtn);
      }
    }

    // 2. Fighters Gallery Avatar Grid (Scalable to 50+ Fighters!)
    if (rosterAvatarGrid) {
      rosterAvatarGrid.innerHTML = "";
      let ownedCount = 0;
      for (const char of entries) {
        const unlocked = isFighterUnlocked(char.id);
        if (unlocked) ownedCount++;
        const card = document.createElement("div");
        card.className = `avatar-card roster-card rarity-fighter${unlocked ? "" : " avatar-locked"}`;
        card.dataset.id = char.id;
        card.dataset.series = (char.role || "").split("•")[0].trim().toLowerCase();
        card.innerHTML = `<span class="rc-rarity">FIGHTER</span>` +
          `<div class="rc-art"><canvas width="132" height="132"></canvas></div>` +
          `<span class="avatar-name">${char.name}</span>` +
          `<span class="avatar-tag">${BF.SERIES[char.id] || "ANIME"}</span>` +
          (unlocked ? "" : `<svg class="rc-lock"><use href="#i-lock"/></svg>`);
        card.addEventListener("click", () => {
          sound.unlock();
          detailCharId = char.id;
          const evoActive = Boolean(isEvolutionEquipped && isEvolutionEquipped(char.id));
          if (char.id === "ichigo") {
            detailFormId = evoActive ? "base" : "shikai";
          } else if (char.id === "naruto") {
            detailFormId = evoActive ? "sage" : "base";
          } else {
            detailFormId = "base";
          }
          updateCharDetailUI();
          if (rosterModal) rosterModal.classList.remove("hidden");
        });
        rosterAvatarGrid.appendChild(card);
        drawMiniAvatar(card.querySelector("canvas"), char);
      }
      const rc = document.getElementById("roster-count");
      if (rc) rc.textContent = `${ownedCount} / ${entries.length}`;
      if (rosterFilterChips) {
        const activeChip = rosterFilterChips.querySelector(".filter-chip.active");
        const filter = ((activeChip && activeChip.dataset.filter) || "all").toLowerCase();
        if (filter !== "all") {
          rosterAvatarGrid.querySelectorAll(".avatar-card").forEach((card) => {
            const series = (card.dataset.series || "").toLowerCase();
            const id = (card.dataset.id || "").toLowerCase();
            card.style.display = (series.includes(filter) || id.includes(filter)) ? "" : "none";
          });
        }
      }
    }

    if (setupUnifiedSelectors._bound) return;
    setupUnifiedSelectors._bound = true;

    // Category Filter Chips (Handles 50+ Fighters smoothly, drag & wheel scrollable)
    if (rosterFilterChips) {
      let isDraggingChips = false;
      let dragStartX = 0;
      let dragStartScroll = 0;
      let suppressChipClick = false;

      rosterFilterChips.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "touch") return;
        isDraggingChips = true;
        suppressChipClick = false;
        dragStartX = e.clientX;
        dragStartScroll = rosterFilterChips.scrollLeft;
        rosterFilterChips.classList.add("is-dragging");
      });
      window.addEventListener("pointermove", (e) => {
        if (!isDraggingChips) return;
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 5) suppressChipClick = true;
        rosterFilterChips.scrollLeft = dragStartScroll - dx;
      });
      const endChipDrag = () => {
        if (!isDraggingChips) return;
        isDraggingChips = false;
        rosterFilterChips.classList.remove("is-dragging");
        setTimeout(() => { suppressChipClick = false; }, 0);
      };
      window.addEventListener("pointerup", endChipDrag);
      window.addEventListener("pointercancel", endChipDrag);

      rosterFilterChips.addEventListener("wheel", (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          rosterFilterChips.scrollLeft += e.deltaY;
        }
      }, { passive: false });

      rosterFilterChips.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", (e) => {
          if (suppressChipClick) {
            e.preventDefault();
            return;
          }
          sound.unlock();
          rosterFilterChips.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          const filter = (chip.dataset.filter || "all").toLowerCase();
          if (rosterAvatarGrid) {
            rosterAvatarGrid.querySelectorAll(".avatar-card").forEach((card) => {
              const series = (card.dataset.series || "").toLowerCase();
              const id = (card.dataset.id || "").toLowerCase();
              if (filter === "all" || series.includes(filter) || id.includes(filter)) {
                card.style.display = "";
              } else {
                card.style.display = "none";
              }
            });
          }
        });
      });
    }

    // Interactive Turbo Granny Mascot Clicks (Triggers hilarious Dandadan voice lines!)
    const merchantBox = document.getElementById("merchant-box-interactive");
    const merchantWrap = document.getElementById("merchant-avatar-wrap");
    const triggerGrannyTalk = () => {
      sound.unlock();
      BF.grannyTalkUntil = performance.now() + 1800;
      sound.playBallHit();
      const quote = TURBO_GRANNY_QUOTES[Math.floor(Math.random() * TURBO_GRANNY_QUOTES.length)];
      if (merchantSpeechText) {
        merchantSpeechText.textContent = quote;
      }
    };
    if (merchantCanvas) merchantCanvas.addEventListener("click", triggerGrannyTalk);
    if (merchantWrap) merchantWrap.addEventListener("click", triggerGrannyTalk);
    if (merchantBox) merchantBox.addEventListener("click", triggerGrannyTalk);

    // Shop Category Filter Chips
    if (shopFilterChips) {
      shopFilterChips.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          sound.unlock();
          shopFilterChips.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          activeShopFilter = (chip.dataset.filter || "all").toLowerCase();
          updateShopUI();
        });
      });
    }

    updateUnifiedSetupUI();
    updateCharDetailUI();
    updateProfileUI();
    updateShopUI();

    document.addEventListener("click", (e) => {
      if (e.target.closest("button, .roster-card, .col-tile")) {
        sound.unlock();
        sound.playUi();
      }
    });

    BF.drawMiniAvatar = drawMiniAvatar;
    BF.drawBall = drawBall;
    BF.Gacha.init({
      sound,
      wallet: playerWallet,
      save: saveWallet,
      isUnlocked: isFighterUnlocked,
      drawAvatar: drawMiniAvatar,
      say: (text) => {
        if (merchantSpeechText) merchantSpeechText.textContent = text;
        BF.grannyTalkUntil = performance.now() + 1800;
      },
      onChange: () => {
        updateShopUI();
        setupUnifiedSelectors();
        updateUnifiedSetupUI();
        updateProfileUI();
        updateCharDetailUI();
        updateHomeMatchupUI();
      },
    });

    const btnWhatsNew = document.getElementById("btn-whats-new");
    const changelogModal = document.getElementById("changelog-modal");
    const btnChangelogClose = document.getElementById("btn-changelog-close");
    if (btnWhatsNew && changelogModal) {
      btnWhatsNew.addEventListener("click", () => {
        sound.unlock();
        changelogModal.classList.remove("hidden");
      });
    }
    if (btnChangelogClose && changelogModal) {
      btnChangelogClose.addEventListener("click", () => {
        changelogModal.classList.add("hidden");
      });
    }
    if (changelogModal) {
      changelogModal.addEventListener("click", (e) => {
        if (e.target === changelogModal) changelogModal.classList.add("hidden");
      });
    }

    // Edit Profile Modal (Name & Custom Photo / Fighter Avatar)
    const profileEditModal = document.getElementById("profile-edit-modal");
    const btnEditProfile = document.getElementById("btn-edit-profile");
    const btnProfileEditClose = document.getElementById("btn-profile-edit-close");
    const profileNameInput = document.getElementById("profile-name-input");
    const profilePhotoFile = document.getElementById("profile-photo-file");
    const btnUploadPhoto = document.getElementById("btn-upload-profile-photo");
    const btnResetPhoto = document.getElementById("btn-reset-profile-photo");
    const profileAvatarChoices = document.getElementById("profile-avatar-choices");
    const btnSaveProfile = document.getElementById("btn-save-profile");

    let draftPrefs = { ...profilePrefs };

    const renderProfileAvatarChoices = () => {
      if (!profileAvatarChoices) return;
      profileAvatarChoices.innerHTML = "";
      for (const char of Object.values(CHARACTER_ROSTER)) {
        const btn = document.createElement("button");
        btn.type = "button";
        const isSel = draftPrefs.avatarMode === "char" && draftPrefs.charId === char.id;
        btn.className = `profile-avatar-choice${isSel ? " active" : ""}`;
        btn.title = char.name;
        const cvs = document.createElement("canvas");
        cvs.width = 44;
        cvs.height = 44;
        btn.appendChild(cvs);
        btn.addEventListener("click", () => {
          sound.unlock();
          sound.playBallHit();
          draftPrefs.avatarMode = "char";
          draftPrefs.charId = char.id;
          renderProfileAvatarChoices();
        });
        profileAvatarChoices.appendChild(btn);
        drawMiniAvatar(cvs, char);
      }
    };

    if (btnEditProfile && profileEditModal) {
      btnEditProfile.addEventListener("click", () => {
        sound.unlock();
        draftPrefs = { ...profilePrefs };
        if (profileNameInput) profileNameInput.value = draftPrefs.name || "EPITHAP";
        renderProfileAvatarChoices();
        profileEditModal.classList.remove("hidden");
      });
    }
    if (btnProfileEditClose && profileEditModal) {
      btnProfileEditClose.addEventListener("click", () => profileEditModal.classList.add("hidden"));
    }
    if (profileEditModal) {
      profileEditModal.addEventListener("click", (e) => {
        if (e.target === profileEditModal) profileEditModal.classList.add("hidden");
      });
    }
    if (btnUploadPhoto && profilePhotoFile) {
      btnUploadPhoto.addEventListener("click", () => {
        sound.unlock();
        profilePhotoFile.click();
      });
      profilePhotoFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const size = 192;
            const off = document.createElement("canvas");
            off.width = size;
            off.height = size;
            const oCtx = off.getContext("2d");
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) * 0.5;
            const sy = (img.height - minSide) * 0.5;
            oCtx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            draftPrefs.avatarMode = "custom";
            draftPrefs.photoDataUrl = off.toDataURL("image/jpeg", 0.82);
            renderProfileAvatarChoices();
            sound.playCritHit();
          };
          img.src = String(reader.result || "");
        };
        reader.readAsDataURL(file);
        profilePhotoFile.value = "";
      });
    }
    if (btnResetPhoto) {
      btnResetPhoto.addEventListener("click", () => {
        sound.unlock();
        sound.playBallHit();
        draftPrefs.avatarMode = "auto";
        draftPrefs.photoDataUrl = null;
        renderProfileAvatarChoices();
      });
    }
    if (btnSaveProfile && profileEditModal) {
      btnSaveProfile.addEventListener("click", () => {
        sound.unlock();
        sound.playCritHit();
        const cleanName = (profileNameInput?.value || "").trim().slice(0, 16);
        draftPrefs.name = cleanName || "EPITHAP";
        profilePrefs = { ...draftPrefs };
        saveProfilePrefs();
        updateProfileUI();
        profileEditModal.classList.add("hidden");
      });
    }

    // Secret Admin Control Panel (click Profile 10x)
    const adminModal = document.getElementById("admin-modal");
    const btnAdminClose = document.getElementById("btn-admin-close");
    const adminCoinsDisplay = document.getElementById("admin-coins-display");
    const adminGemsDisplay = document.getElementById("admin-gems-display");
    const adminCoinsInput = document.getElementById("admin-coins-input");
    const adminGemsInput = document.getElementById("admin-gems-input");

    const syncAdminAndAllUI = () => {
      saveWallet();
      if (adminCoinsDisplay) adminCoinsDisplay.textContent = playerWallet.coins.toLocaleString();
      if (adminGemsDisplay) adminGemsDisplay.textContent = playerWallet.gems.toLocaleString();
      updateShopUI();
      updateHomeMatchupUI();
      updateUnifiedSetupUI();
      updateProfileUI();
      updateCharDetailUI();
    };

    const openAdminPanel = () => {
      if (!adminModal) return;
      sound.unlock();
      sound.playCritHit();
      syncAdminAndAllUI();
      adminModal.classList.remove("hidden");
    };

    let profileTapCount = 0;
    let profileTapResetTimer = null;
    const registerProfileTap = () => {
      profileTapCount += 1;
      clearTimeout(profileTapResetTimer);
      profileTapResetTimer = setTimeout(() => { profileTapCount = 0; }, 3500);
      if (profileTapCount >= 10) {
        profileTapCount = 0;
        openAdminPanel();
      }
    };

    const profileNavBtn = document.querySelector('.cartoon-nav .nav-btn[data-target="screen-profile"]');
    const profileLicenseEl = document.querySelector("#screen-profile .license");
    if (profileNavBtn) profileNavBtn.addEventListener("click", registerProfileTap);
    if (profileLicenseEl) profileLicenseEl.addEventListener("click", registerProfileTap);

    if (btnAdminClose && adminModal) {
      btnAdminClose.addEventListener("click", () => adminModal.classList.add("hidden"));
    }
    if (adminModal) {
      adminModal.addEventListener("click", (e) => {
        if (e.target === adminModal) adminModal.classList.add("hidden");
      });
      adminModal.querySelectorAll(".admin-add-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          sound.unlock();
          sound.playBallHit();
          const curr = btn.dataset.curr === "gems" ? "gems" : "coins";
          const amt = Number(btn.dataset.amt) || 0;
          playerWallet[curr] = Math.max(0, playerWallet[curr] + amt);
          syncAdminAndAllUI();
        });
      });
    }

    const applyCustomCurrency = (curr, inputEl, mode) => {
      const val = Math.max(0, Math.floor(Number(inputEl?.value) || 0));
      sound.unlock();
      sound.playBallHit();
      playerWallet[curr] = mode === "set" ? val : Math.max(0, playerWallet[curr] + val);
      if (inputEl) inputEl.value = "";
      syncAdminAndAllUI();
    };

    const btnAddCoins = document.getElementById("btn-admin-add-coins");
    const btnSetCoins = document.getElementById("btn-admin-set-coins");
    const btnAddGems = document.getElementById("btn-admin-add-gems");
    const btnSetGems = document.getElementById("btn-admin-set-gems");
    const btnUnlockAll = document.getElementById("btn-admin-unlock-all");
    const btnResetWallet = document.getElementById("btn-admin-reset-wallet");
    const btnResetAll = document.getElementById("btn-admin-reset-all");

    if (btnAddCoins) btnAddCoins.addEventListener("click", () => applyCustomCurrency("coins", adminCoinsInput, "add"));
    if (btnSetCoins) btnSetCoins.addEventListener("click", () => applyCustomCurrency("coins", adminCoinsInput, "set"));
    if (btnAddGems) btnAddGems.addEventListener("click", () => applyCustomCurrency("gems", adminGemsInput, "add"));
    if (btnSetGems) btnSetGems.addEventListener("click", () => applyCustomCurrency("gems", adminGemsInput, "set"));

    if (btnUnlockAll) {
      btnUnlockAll.addEventListener("click", () => {
        sound.unlock();
        sound.playCritHit();
        for (const id of Object.keys(CHARACTER_ROSTER)) {
          playerWallet.unlockedFighters.add(id);
        }
        for (const sk of SKIN_CATALOG || []) {
          playerWallet.unlockedSkins.add(sk.id);
        }
        setupUnifiedSelectors();
        syncAdminAndAllUI();
      });
    }
    if (btnResetWallet) {
      btnResetWallet.addEventListener("click", () => {
        sound.unlock();
        sound.playWallBounce();
        playerWallet.coins = 0;
        playerWallet.gems = 0;
        syncAdminAndAllUI();
      });
    }
    if (btnResetAll) {
      btnResetAll.addEventListener("click", () => {
        sound.unlock();
        sound.playWallBounce();
        // Reset wallet, unlocked fighters (back to 4 starters), evolutions & skins
        playerWallet.coins = 0;
        playerWallet.gems = 0;
        playerWallet.unlockedFighters = new Set(["goku", "naruto", "luffy", "ichigo"]);
        playerWallet.evolvedFighters = new Set();
        playerWallet.equippedEvolutions = {};
        playerWallet.unlockedSkins = new Set();
        playerWallet.equippedSkins = {};
        slotEvoOverrides[0] = {};
        slotEvoOverrides[1] = {};
        selectedRosterIds[0] = "goku";
        selectedRosterIds[1] = "naruto";

        // Reset profile stats & preferences
        sessionStats.matches = 0;
        sessionStats.wins = 0;
        sessionStats.charsUsed = {};
        profilePrefs = {
          name: "EPITHAP",
          avatarMode: "auto",
          charId: "goku",
          photoDataUrl: null,
        };

        try {
          localStorage.removeItem("anime_ball_wallet_v3");
          localStorage.removeItem("bf_profile_v1");
          localStorage.removeItem("bf_profile_prefs_v1");
          localStorage.removeItem("bf_gacha_v1");
          localStorage.removeItem("bf_gacha_v2");
        } catch (_) {}

        saveProfilePrefs();
        if (BF.Gacha && typeof BF.Gacha.reset === "function") {
          BF.Gacha.reset();
        }
        refreshSlotConfigs();
        setupUnifiedSelectors();
        syncAdminAndAllUI();
        syncFighterUI();
      });
    }
  }

  // Boot
  if (document.fonts && document.fonts.load) document.fonts.load(`24px ${FONT}`).catch(() => {});
  setupUnifiedSelectors();
  resizeCanvas();
  initMatch();
  switchScreen("screen-play");
  requestAnimationFrame(loop);
})();

