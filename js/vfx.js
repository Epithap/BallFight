(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { WORLD_SIZE, COLORS, FONT, easeOut } = BF;
  const rt = () => BF._rt;

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
          rt().particles.push({ x: this.x, y: this.y, vx: 0, vy: 0, size: this.radius * 0.55, life: 0.2, maxLife: 0.2, color });
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
    rt().sound.playCharge(duration);
  }

  function drawCast(ball, c) {
    const k = ball.cast;
    if (!k) return;
    const p = Math.min(1, k.t / k.duration);
    const tg = rt().balls.find((b) => b !== ball && b.alive);
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
    rt().timeStopTimer = 0;
    rt().sound.playTimeResume();
    rt().entities.push(spawnBanner("TIME RESUMES!", COLORS.gold));
    rt().shakeTime = 0.22; rt().shakeIntensity = 4.5;

    for (const ent of rt().entities) {
      if (ent.isKnife && ent.state === "frozen") {
        ent.state = "unfrozen";
        if (ent.target) {
          ent.angle = Math.atan2(ent.target.y - ent.y, ent.target.x - ent.x);
        }
      }
    }
    // Detonate accumulated Jotaro Stopped-Time ORA impacts when time resumes!
    for (const b of rt().balls) {
      if (b.alive && b.stoppedTimeHits > 0) {
        const hits = b.stoppedTimeHits;
        const burstAng = b.stoppedTimeAngle ?? 0;
        b.stoppedTimeHits = 0;
        const burstDmg = rt().applyDamage(b, Math.min(12, hits * 2));
        b.flashTimer = 0.25;
        b.squash = 0.95;
        b.vx = Math.cos(burstAng) * 760;
        b.vy = Math.sin(burstAng) * 760;
        b.knockbackTimer = 0.36;
        rt().entities.push(spawnShockRing(b.x, b.y, "#a855f7", 150, 0.42));
        rt().spawnCritBurst(b.x, b.y);
        rt().spawnDamageText(b.x, b.y - b.radius - 18, burstDmg, "#a855f7", true, `TOKI WA UGOKIDASU! (${hits}x ORA)`);
        rt().sound.playCritHit();
        rt().checkKO(b.x, b.y);
      }
    }
    if (rt().timeStopOwner && rt().timeStopOwner.alive) {
      rt().timeStopOwner.ultTimer = 0;
    }
    rt().timeStopOwner = null;
  }

  BF.drawClashCutin = function (c, leftBall, rightBall, leftCol, rightCol, progress, label) {
    if (!leftBall || !rightBall) return;
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const easeOut = (t) => 1 - Math.pow(1 - cl(t, 0, 1), 3);
    const p = cl(progress || 0, 0, 1);
    const enter = p < 0.14 ? easeOut(p / 0.14) : p > 0.88 ? cl((1 - p) / 0.12, 0, 1) : 1;
    if (enter <= 0.02) return;

    const slideOffset = (1 - enter) * 260;
    const jitter = Math.sin(p * 65) * 1.6;
    const panelW = 218;
    const panelH = 66;
    const slant = 28;

    const drawSide = (ball, isLeft, col, yTop) => {
      c.save();
      c.globalAlpha = cl(enter * 1.15, 0, 1);
      const x0 = isLeft ? -8 - slideOffset : WORLD_SIZE + 8 + slideOffset;
      const xInnerTop = isLeft ? x0 + panelW : x0 - panelW;
      const xInnerBot = isLeft ? x0 + panelW - slant : x0 - panelW + slant;
      const yBot = yTop + panelH;

      // Hard Persona-style black drop shadow
      c.fillStyle = COLORS.ink;
      c.beginPath();
      c.moveTo(x0, yTop + 6);
      c.lineTo(xInnerTop + (isLeft ? 6 : -6), yTop + 6);
      c.lineTo(xInnerBot + (isLeft ? 6 : -6), yBot + 6);
      c.lineTo(x0, yBot + 6);
      c.closePath();
      c.fill();

      // Clipped slanted trapezoid panel
      c.save();
      c.beginPath();
      c.moveTo(x0, yTop);
      c.lineTo(xInnerTop, yTop);
      c.lineTo(xInnerBot, yBot);
      c.lineTo(x0, yBot);
      c.closePath();
      c.clip();

      // Dark dramatic base + character accent stripe
      c.fillStyle = "#110f1a";
      c.fillRect(0, yTop - 4, WORLD_SIZE, panelH + 8);

      c.fillStyle = col || "#38bdf8";
      c.globalAlpha = 0.85 * cl(enter * 1.15, 0, 1);
      c.beginPath();
      if (isLeft) {
        c.moveTo(x0, yTop);
        c.lineTo(xInnerTop - 32, yTop);
        c.lineTo(xInnerBot - 54, yBot);
        c.lineTo(x0, yBot);
      } else {
        c.moveTo(x0, yTop);
        c.lineTo(xInnerTop + 32, yTop);
        c.lineTo(xInnerBot + 54, yBot);
        c.lineTo(x0, yBot);
      }
      c.closePath();
      c.fill();
      c.globalAlpha = cl(enter * 1.15, 0, 1);

      // Diagonal Persona/anime speedlines inside cut-in
      c.strokeStyle = "rgba(255, 255, 255, 0.28)";
      c.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        const sy = yTop + 8 + i * 11;
        const sx = isLeft ? x0 + ((p * 260 + i * 42) % 180) : x0 - ((p * 260 + i * 42) % 180);
        c.beginPath();
        c.moveTo(sx, sy);
        c.lineTo(sx + (isLeft ? 48 : -48), sy - 9);
        c.stroke();
      }

      // Render actual Chibi fighter portrait zoomed inside the cut-in frame
      const portraitX = isLeft ? x0 + 82 : x0 - 82;
      const portraitY = yTop + panelH * 0.56 + jitter * (isLeft ? 1 : -1);
      const mockBall = {
        x: portraitX,
        y: portraitY,
        radius: 27,
        color: ball.color || col || "#fff",
        costume: ball.costume,
        evolved: Boolean(ball.evolved),
        skin: ball.skin,
        skins: ball.skins,
        weapon: null,
        weaponAngle: 0,
        vx: isLeft ? 1 : -1,
        vy: 0,
        flashTimer: 0,
        ultTimer: ball.ultTimer || 0,
        apeMode: Boolean(ball.apeMode),
        kyuubiMode: Boolean(ball.kyuubiMode),
        curseMarkMode: Boolean(ball.curseMarkMode),
        susanooArmorMode: Boolean(ball.susanooArmorMode),
        vastoLordeMode: Boolean(ball.vastoLordeMode),
        innerDemonMode: Boolean(ball.innerDemonMode),
        _isCosmicGarou: Boolean(ball._isCosmicGarou),
        squash: 0,
        skills: [],
        effects: [],
      };
      BF.drawBall(mockBall, c, false);

      // Name tag inside inner edge of cut-in
      const tagName = (ball.shortName || ball.costume || ball.name || "P").toUpperCase();
      c.font = `bold 11px ${FONT}`;
      c.textAlign = isLeft ? "right" : "left";
      c.textBaseline = "bottom";
      c.lineWidth = 3.5;
      c.strokeStyle = COLORS.ink;
      const tagX = isLeft ? xInnerBot - 12 : xInnerBot + 12;
      c.strokeText(tagName, tagX, yBot - 6);
      c.fillStyle = COLORS.white;
      c.fillText(tagName, tagX, yBot - 6);

      c.restore(); // end clip

      // Crisp white inner rim + bold black manga outer border
      c.strokeStyle = COLORS.white;
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x0, yTop);
      c.lineTo(xInnerTop, yTop);
      c.lineTo(xInnerBot, yBot);
      c.lineTo(x0, yBot);
      c.closePath();
      c.stroke();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.stroke();
      c.restore();
    };

    drawSide(leftBall, true, leftCol, 112);
    drawSide(rightBall, false, rightCol, 122);

    if (label && enter > 0.4) {
      c.save();
      c.globalAlpha = cl((enter - 0.4) / 0.6, 0, 1);
      c.font = `bold 11px ${FONT}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineWidth = 4;
      c.strokeStyle = COLORS.ink;
      c.strokeText(label, WORLD_SIZE * 0.5, 118);
      c.fillStyle = COLORS.white;
      c.fillText(label, WORLD_SIZE * 0.5, 118);
      c.restore();
    }
  };


  BF.VFX = {
    getInfinitySlowFactor,
    spawnProjectile,
    spawnShockRing,
    spawnBanner,
    beginCast,
    drawCast,
    castMuzzle,
    spawnDelayedAction,
    triggerTimeResume,
  };
})();
