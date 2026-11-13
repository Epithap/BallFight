(() => {
  const WORLD_SIZE = 500;
  const HIT_COOLDOWN = 0.08; // seconds
  const HIT_STOP_DURATION = 0.035; // seconds
  const DAMAGE_VARIATION = 0.15; // +/- 15% random variance
  const MIN_COMPONENT_RATIO = 0.22;
  const BOUNCE_KICK = 1.08;
  const ROUNDS_TO_WIN = 2;
  const KO_SLOWMO_DURATION = 0.8; // real seconds
  const KO_SLOWMO_SCALE = 0.25;
  const KO_ZOOM_SCALE = 1.38;
  const CRIT_CHANCE = 0.07; // 7% crit chance
  const CRIT_DAMAGE = 25;
  const ULT_CHARGES_REQUIRED = 5;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resolveInitialSeed() {
    const raw = new URLSearchParams(window.location.search).get("seed");
    if (raw !== null && raw.trim() !== "") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return Math.floor(Math.abs(parsed)) >>> 0;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
      }
      return hash >>> 0;
    }
    return Math.floor(Math.random() * 1000000);
  }

  const COLORS = {
    ink: "#2b1b3d",
    floorA: "#a8e6cf",
    floorB: "#97dcc2",
    red: "#ff5a5f",
    blue: "#3da5ff",
    white: "#ffffff",
    gold: "#ffc93c",
    green: "#3ddc84",
    orange: "#ff7b29",
    narutoOrange: "#ff9f1c",
    ichigoDark: "#363b47",
    silver: "#d8dee9",
    skin: "#ffd1a9",
    dioYellow: "#fbc531",
    dioGreen: "#2ecc71",
  };
  const FONT = '"Lilita One", "Baloo 2", "Trebuchet MS", system-ui, sans-serif';

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
  function spawnProjectile({ owner, target, x, y, speed, radius, damage, color, label, shape, onImpact, onOutOfBounds }) {
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
        if (this.trail <= 0) {
          this.trail = 0.035;
          particles.push({ x: this.x, y: this.y, vx: 0, vy: 0, size: this.radius * 0.55, life: 0.2, maxLife: 0.2, color });
        }
        if (shape === "rasenshuriken" || shape === "limitless_red" || shape === "hollow_purple") {
          this.spin += dt * 18 * Math.max(0.2, infFactor);
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
          // 4 spinning shuriken blades around Rasengan core
          c.fillStyle = COLORS.white;
          for (let i = 0; i < 4; i++) {
            c.save();
            c.rotate((Math.PI * 0.5) * i);
            c.beginPath();
            c.moveTo(0, -4);
            c.lineTo(this.radius * 1.35, -this.radius * 0.38);
            c.lineTo(this.radius * 0.95, 4);
            c.closePath();
            c.fill();
            c.stroke();
            c.restore();
          }
          c.fillStyle = COLORS.blue;
          c.beginPath();
          c.arc(0, 0, this.radius * 0.55, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = COLORS.white;
          c.beginPath();
          c.arc(0, 0, this.radius * 0.24, 0, Math.PI * 2);
          c.fill();
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


  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }

  function spawnShockRing(x, y, color, maxR = 90, life = 0.45) {
    return {
      x, y, life, maxLife: life, dead: false,
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
      life: dur, dead: false,
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
  function beginCast(ball, { kind, duration, color, maxR = 22, blades = false, fire }) {
    ball.cast = { kind, duration, color, maxR, blades, fire, t: 0 };
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

    if (k.kind === "orb") {
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
      c.rotate(p * p * 36);
      if (k.blades) {
        const bp = Math.max(0, Math.min(1, (p - 0.4) / 0.6));
        c.fillStyle = COLORS.white; c.strokeStyle = COLORS.ink; c.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          c.save(); c.rotate((Math.PI / 2) * i);
          c.beginPath();
          c.moveTo(0, -4); c.lineTo(R * 1.35 * bp, -R * 0.38 * bp); c.lineTo(R * 0.95 * bp, 4);
          c.closePath(); c.fill(); c.stroke(); c.restore();
        }
      }
      const cr = R * (k.blades ? 0.55 : 1);
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
      c.restore();
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
    } else if (k.kind === "slash") {
      const e = easeOut(p), R = k.maxR * (0.3 + 0.7 * e);
      c.save();
      c.translate(ball.x + ux * (ball.radius + 8 + R * 0.6), ball.y + uy * (ball.radius + 8 + R * 0.6));
      c.rotate(ang - (1 - e) * 0.9);   // blade swings into place
      c.beginPath();
      c.arc(0, 0, R * 1.45, -Math.PI * 0.48, Math.PI * 0.48);
      c.quadraticCurveTo(R * 0.3, 0, Math.cos(-Math.PI * 0.48) * R * 1.45, Math.sin(-Math.PI * 0.48) * R * 1.45);
      c.closePath();
      c.fillStyle = k.color; c.fill();
      c.lineWidth = 4; c.strokeStyle = COLORS.ink; c.stroke();
      c.strokeStyle = COLORS.white; c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, R * 1.18, -Math.PI * 0.35, Math.PI * 0.35); c.stroke();
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

  function spawnKamehamehaBeam(owner, target, chargeDuration = 0) {
    const dx = target.x - owner.x;
    const dy = target.y - owner.y;
    const angle = Math.atan2(dy, dx);
    const length = WORLD_SIZE * 1.6;
    const beamDuration = 0.82;

    return {
      x: owner.x,
      y: owner.y,
      angle,
      timer: 0,
      tickTimer: 0,
      dead: false,
      update(dt, game) {
        if (!owner.alive) {
          this.dead = true;
          return;
        }
        this.timer += dt;
        if (this.timer >= chargeDuration + beamDuration) {
          this.dead = true;
          return;
        }
        if (this.timer >= chargeDuration && !this.fired) {
          this.fired = true;
          game.entities.push(spawnShockRing(owner.x + Math.cos(this.angle) * 40, owner.y + Math.sin(this.angle) * 40, COLORS.blue, 100, 0.4));
          shakeTime = 0.3; shakeIntensity = 6;
        }
        if (this.timer < chargeDuration || !target.alive) return;

        this.tickTimer -= dt;
        if (this.tickTimer <= 0) {
          // Distance from target to beam ray
          const ux = Math.cos(this.angle);
          const uy = Math.sin(this.angle);
          const relX = target.x - this.x;
          const relY = target.y - this.y;
          const proj = relX * ux + relY * uy;
          if (proj > 0) {
            const perp = Math.abs(relX * -uy + relY * ux);
            if (perp <= target.radius + 20) {
              this.tickTimer = 0.2;
              const dealt = game.applyDamage(target, 9);
              target.flashTimer = 0.08;
              game.spawnSparks(target.x, target.y, COLORS.blue, COLORS.white);
              game.spawnDamageText(target.x, target.y - target.radius, dealt, COLORS.blue, false, "KAMEHAMEHA!");
              game.sound.playBallHit();
            }
          }
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        if (this.timer < chargeDuration) {
          // Aiming telegraph line
          c.strokeStyle = COLORS.blue;
          c.lineWidth = 4;
          c.setLineDash([10, 8]);
          c.beginPath();
          c.moveTo(owner.radius, 0);
          c.lineTo(length, 0);
          c.stroke();
          // Charging orb
          c.setLineDash([]);
          c.fillStyle = COLORS.blue;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 3;
          c.beginPath();
          c.arc(owner.radius + 10, 0, 8 + (this.timer / chargeDuration) * 24, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        } else {
          // Full solid Kamehameha beam
          const fade = Math.min(1, (chargeDuration + beamDuration - this.timer) * 5);
          const halfW = 20 * fade;
          c.fillStyle = COLORS.blue;
          c.strokeStyle = COLORS.ink;
          c.lineWidth = 4;
          c.beginPath();
          c.rect(owner.radius, -halfW, length, halfW * 2);
          c.fill();
          c.stroke();
          // White inner core
          c.fillStyle = COLORS.white;
          c.fillRect(owner.radius, -halfW * 0.45, length, halfW * 0.9);
        }
        c.restore();
      },
    };
  }

  function spawnRasenganVisual(x, y, maxR = 46) {
    return {
      x,
      y,
      r: 12,
      spin: 0,
      life: 0.34,
      maxLife: 0.34,
      dead: false,
      update(dt) {
        this.life -= dt;
        this.spin += dt * 22;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        this.r = 14 + (maxR - 14) * (1 - Math.pow(1 - p, 2));
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const k = Math.max(0, this.life / this.maxLife);
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.spin);
        c.globalAlpha = k;
        c.beginPath();
        c.arc(0, 0, this.r, 0, Math.PI * 2);
        c.fillStyle = COLORS.blue;
        c.fill();
        c.lineWidth = 4;
        c.strokeStyle = COLORS.ink;
        c.stroke();
        // Spinning chakra spiral arcs
        c.strokeStyle = COLORS.white;
        c.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 * i) / 3;
          c.beginPath();
          c.arc(0, 0, this.r * 0.65, a, a + Math.PI * 0.48);
          c.stroke();
        }
        c.fillStyle = COLORS.white;
        c.beginPath();
        c.arc(0, 0, this.r * 0.25, 0, Math.PI * 2);
        c.fill();
        c.restore();
      },
    };
  }

  function spawnDragonKickCombo(attacker, defender, ult = false) {
    let stepIdx = 0;
    let timer = 0;
    const damages = ult ? [9, 9, 12] : [6, 6, 8];
    const interval = ult ? 0.09 : 0.11;
    let finished = false;
    return {
      update(dt, g) {
        if (finished) return false;
        if (!defender.alive || !attacker.alive) {
          finished = true;
          return false;
        }
        timer -= dt;
        if (timer <= 0 && stepIdx < 3) {
          timer = interval;
          const hitNum = stepIdx + 1;
          const dmg = g.applyDamage(defender, damages[stepIdx]);
          const ang = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          const hitX = (attacker.x + defender.x) * 0.5;
          const hitY = (attacker.y + defender.y) * 0.5;
          const color = ult ? COLORS.red : COLORS.gold;
          g.spawnSparks(hitX, hitY, color, COLORS.white);
          g.entities.push(spawnShockRing(defender.x, defender.y, color, hitNum === 3 ? 115 : 68, hitNum === 3 ? 0.36 : 0.22));
          sound.playBallHit();
          shakeTime = Math.max(shakeTime, hitNum === 3 ? 0.28 : 0.12);
          shakeIntensity = Math.max(shakeIntensity, hitNum === 3 ? 7 : 3);
          if (hitNum < 3) {
            g.addEffect(defender, "stun", 0.22);
            defender.vx *= 0.2;
            defender.vy *= 0.2;
            g.spawnDamageText(defender.x, defender.y - defender.radius - 12, dmg, color, false, `DRAGON KICK ${hitNum}/3!`);
          } else {
            const kb = ult ? 820 : 660;
            defender.vx = Math.cos(ang) * kb;
            defender.vy = Math.sin(ang) * kb;
            defender.squash = 0.95;
            g.spawnDamageText(defender.x, defender.y - defender.radius - 16, dmg, color, true, ult ? "KAIOKEN DRAGON LAUNCH!" : "DRAGON KICK 3/3!");
            finished = true;
            return false;
          }
          stepIdx++;
        }
        return !finished;
      },
      draw() {},
    };
  }

  const SKILL_KAMEHAMEHA = {
    name: "Kamehameha / Dragon Rush",
    cooldown: 3.4,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const mode = ball.gokuNext === "dragon_rush" ? "dragon_rush" : "kamehameha";
      ball.gokuNext = mode === "kamehameha" ? "dragon_rush" : "kamehameha";
      const ult = ball.ultTimer > 0;

      if (mode === "dragon_rush") {
        beginCast(ball, {
          kind: "orb",
          duration: ult ? 0.42 : 0.5,
          color: ult ? COLORS.red : COLORS.gold,
          maxR: ult ? 24 : 18,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            const dashSpeed = b.baseSpeed * (ult ? 3.1 : 2.55);
            b.vx = Math.cos(ang) * dashSpeed;
            b.vy = Math.sin(ang) * dashSpeed;
            b.dragonRushTimer = ult ? 0.44 : 0.4;
            b.dragonRushHit = false;
            g.entities.push(spawnShockRing(b.x, b.y, ult ? COLORS.red : COLORS.gold, 80, 0.28));
            g.spawnDamageText(b.x, b.y - b.radius, 0, ult ? COLORS.red : COLORS.gold, false, ult ? "KAIOKEN DRAGON RUSH!" : "DRAGON RUSH!");
          },
        });
        return true;
      }

      if (ult) {
        // Kaioken: charge & aim live like normal Kamehameha, then fire full beam immediately
        beginCast(ball, {
          kind: "orb", duration: 0.65, color: COLORS.red, maxR: 26,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            b.channelTimer = 0.82;
            g.entities.push(spawnKamehamehaBeam(b, t, 0));
            g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "KAIOKEN BEAM!");
          },
        });
        return true;
      }
      beginCast(ball, {
        kind: "orb", duration: 0.5, color: COLORS.blue, maxR: 20,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 16);
          g.entities.push(spawnShockRing(m.x, m.y, COLORS.blue, 55, 0.3));
          g.entities.push(spawnProjectile({
            owner: b, target: t, x: m.x, y: m.y, speed: 520, radius: 13, damage: 14,
            color: COLORS.blue, label: "KAMEHAMEHA!", shape: "blast",
            onImpact(tt, gg) {
              gg.addEffect(tt, "slow", 0.7, { factor: 0.65 });
              gg.chargeUlt(b);
            },
          }));
        },
      });
      return true;
    },
  };

  const SKILL_RASENGAN = {
    name: "Rasengan",
    cooldown: 3.0,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      beginCast(ball, {
        kind: "orb", duration: 0.45, color: COLORS.blue, maxR: 17,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          const dashSpeed = b.baseSpeed * 1.95;
          b.vx = ((t.x - b.x) / len) * dashSpeed;
          b.vy = ((t.y - b.y) / len) * dashSpeed;
          b.rasenganTimer = 0.5;
          b.rasenganHit = false;
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.blue, false, "RASENGAN!");
          g.spawnSparks(b.x, b.y, COLORS.white, COLORS.blue);
        },
      });
      return true;
    },
  };

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

  function spawnGomuPistol({ owner, angle, maxLen = 215, damage = 15, knockback = 360 }) {
    const duration = 0.26;
    let hitDone = false;
    return {
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const ext = p < 0.5 ? (p / 0.5) : (1 - (p - 0.5) / 0.5);
        const curLen = owner.radius + ext * maxLen;
        const fx = owner.x + Math.cos(angle) * curLen;
        const fy = owner.y + Math.sin(angle) * curLen;
        if (!hitDone) {
          for (const target of g.balls) {
            if (target === owner || !target.alive) continue;
            if (Math.hypot(target.x - fx, target.y - fy) <= target.radius + 16) {
              hitDone = true;
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.14;
              target.squash = 0.9;
              target.vx = Math.cos(angle) * knockback;
              target.vy = Math.sin(angle) * knockback;
              g.spawnSparks(fx, fy, COLORS.white, COLORS.red);
              g.spawnDamageText(target.x, target.y - target.radius - 10, dealt, COLORS.red, true, "GOMU PISTOL!");
              g.chargeUlt(owner);
              sound.playCritHit();
              shakeTime = Math.max(shakeTime, 0.18);
              shakeIntensity = Math.max(shakeIntensity, 5);
              break;
            }
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const ext = p < 0.5 ? (p / 0.5) : (1 - (p - 0.5) / 0.5);
        const curLen = owner.radius + ext * maxLen;
        const fx = owner.x + Math.cos(angle) * curLen;
        const fy = owner.y + Math.sin(angle) * curLen;
        c.save();
        c.lineCap = "round";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 14;
        c.beginPath(); c.moveTo(owner.x, owner.y); c.lineTo(fx, fy); c.stroke();
        c.strokeStyle = COLORS.skin;
        c.lineWidth = 8;
        c.stroke();
        c.fillStyle = COLORS.skin;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(fx, fy, 13, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnKongSmash({ owner, x, y, reach = 155, damage = 30, knockback = 500 }) {
    const duration = 0.42;
    let impacted = false;
    return {
      x,
      y,
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const p = 1 - Math.max(0, this.life / this.maxLife);
        if (!impacted && p >= 0.25) {
          impacted = true;
          g.entities.push(spawnShockRing(this.x, this.y, COLORS.red, reach, 0.42));
          g.entities.push(spawnShockRing(this.x, this.y, COLORS.white, reach * 0.72, 0.34));
          shakeTime = Math.max(shakeTime, 0.35);
          shakeIntensity = Math.max(shakeIntensity, 10);
          sound.playCritHit();
          for (const target of g.balls) {
            if (target === owner || !target.alive) continue;
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            if (Math.hypot(dx, dy) <= reach + target.radius) {
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.16;
              target.squash = 1.0;
              const kAng = Math.atan2(dy, dx);
              target.vx = Math.cos(kAng) * knockback;
              target.vy = Math.sin(kAng) * knockback;
              g.spawnSparks(target.x, target.y, COLORS.red, COLORS.ink);
              g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, COLORS.red, true, "KING KONG GUN!");
            }
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const p = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = p < 0.7 ? 1 : Math.max(0, (1 - p) / 0.3);
        const fistR = 26 + Math.sin(Math.min(1, p * 2) * Math.PI * 0.5) * 14;
        c.save();
        c.globalAlpha = alpha;
        // Giant Haki-coated fist slamming onto target area
        c.fillStyle = "rgba(235, 35, 50, 0.24)";
        c.beginPath();
        c.arc(this.x, this.y, reach * Math.min(1, p * 2.2), 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#1c1824";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 4;
        c.beginPath();
        c.arc(this.x, this.y - (1 - Math.min(1, p * 3)) * 28, fistR, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.strokeStyle = "#ff2e44";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(this.x, this.y - (1 - Math.min(1, p * 3)) * 28, fistR * 0.7, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnSnakemanPython({ owner, angle, speed = 780, bouncesLeft = 3, damage = 23, knockback = 420 }) {
    const startX = owner.x + Math.cos(angle) * (owner.radius + 10);
    const startY = owner.y + Math.sin(angle) * (owner.radius + 10);
    const points = [{ x: startX, y: startY }];
    return {
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      bouncesLeft,
      life: 1.05,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        const enemyTarget = g.balls.find((b) => b !== owner && b.alive);
        const infFactor = getInfinitySlowFactor(enemyTarget, this.x, this.y);
        if (infFactor <= 0) {
          this.infinityHold = (this.infinityHold || 0) + dt;
          if (this.infinityHold >= 0.9) this.dead = true;
          return;
        }
        this.x += this.vx * infFactor * dt;
        this.y += this.vy * infFactor * dt;

        // Wall-bounce mechanic for Snakeman Culverin!
        let bounced = false;
        const pad = 14;
        if (this.x < pad) {
          this.x = pad;
          this.vx = Math.abs(this.vx);
          bounced = true;
        } else if (this.x > WORLD_SIZE - pad) {
          this.x = WORLD_SIZE - pad;
          this.vx = -Math.abs(this.vx);
          bounced = true;
        }
        if (this.y < pad) {
          this.y = pad;
          this.vy = Math.abs(this.vy);
          bounced = true;
        } else if (this.y > WORLD_SIZE - pad) {
          this.y = WORLD_SIZE - pad;
          this.vy = -Math.abs(this.vy);
          bounced = true;
        }
        if (bounced) {
          points.push({ x: this.x, y: this.y });
          this.bouncesLeft -= 1;
          g.spawnSparks(this.x, this.y, "#c026d3", COLORS.red);
          sound.playWallBounce();
          if (this.bouncesLeft < 0) {
            this.dead = true;
            return;
          }
        }

        for (const target of g.balls) {
          if (target === owner || !target.alive) continue;
          if (Math.hypot(target.x - this.x, target.y - this.y) <= target.radius + 16) {
            this.dead = true;
            const dealt = g.applyDamage(target, damage);
            target.flashTimer = 0.14;
            target.squash = 0.95;
            const kAng = Math.atan2(this.vy, this.vx);
            target.vx = Math.cos(kAng) * knockback;
            target.vy = Math.sin(kAng) * knockback;
            g.spawnSparks(this.x, this.y, "#c026d3", COLORS.white);
            g.spawnDamageText(target.x, target.y - target.radius - 12, dealt, "#e879f9", true, "JET CULVERIN!");
            g.entities.push(spawnShockRing(this.x, this.y, "#c026d3", 90, 0.32));
            sound.playCritHit();
            shakeTime = Math.max(shakeTime, 0.22);
            shakeIntensity = Math.max(shakeIntensity, 6);
            return;
          }
        }
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        c.save();
        c.lineCap = "round";
        c.lineJoin = "round";
        // Stretched Haki rubber arm path from Luffy through every wall bounce
        c.beginPath();
        c.moveTo(owner.x, owner.y);
        for (const pt of points) c.lineTo(pt.x, pt.y);
        c.lineTo(this.x, this.y);
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 14;
        c.stroke();
        c.strokeStyle = "#22172b";
        c.lineWidth = 8;
        c.stroke();
        c.strokeStyle = "#e11d48";
        c.lineWidth = 2.5;
        c.stroke();

        // Haki-coated fist head
        c.fillStyle = "#1c1526";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.x, this.y, 14, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.restore();
      },
    };
  }

  const SKILL_GUM_ROCKET = {
    name: "Gomu Rocket -> Pistol",
    initialCd: 2.5,
    cooldown: 4.5,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      if (ball.ultTimer > 0) {
        const isSnake = ball.gear4Mode === "snakeman";
        beginCast(ball, {
          kind: "dash",
          duration: isSnake ? 0.16 : 0.24,
          color: isSnake ? "#c026d3" : COLORS.red,
          fire(b, g) {
            const t = g.balls.find((x) => x !== b && x.alive);
            if (!t) return;
            const ang = Math.atan2(t.y - b.y, t.x - b.x);
            if (isSnake) {
              if (b.skills[0]) b.skills[0]._cd = 2.1;
              g.entities.push(spawnSnakemanPython({
                owner: b,
                angle: ang,
                speed: 780,
                bouncesLeft: 3,
                damage: Math.round(20 + rng() * 6),
                knockback: 420,
              }));
              g.spawnDamageText(b.x, b.y - b.radius, 0, "#e879f9", false, "BLACK MAMBA!");
            } else {
              if (b.skills[0]) b.skills[0]._cd = 2.4;
              const dist = Math.hypot(t.x - b.x, t.y - b.y) || 1;
              const smashDist = Math.min(dist, 95);
              const sx = b.x + Math.cos(ang) * smashDist;
              const sy = b.y + Math.sin(ang) * smashDist;
              b.vx = Math.cos(ang) * b.baseSpeed * 1.35;
              b.vy = Math.sin(ang) * b.baseSpeed * 1.35;
              g.entities.push(spawnKongSmash({
                owner: b,
                x: sx,
                y: sy,
                reach: 155,
                damage: Math.round(26 + rng() * 8),
                knockback: 500,
              }));
              g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "KONG SMASH!");
            }
            sound.playBallHit();
          },
        });
        return true;
      }

      beginCast(ball, {
        kind: "dash", duration: 0.25, color: COLORS.red,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          const dashSpeed = b.baseSpeed * 2.1;
          b.vx = ((t.x - b.x) / len) * dashSpeed;
          b.vy = ((t.y - b.y) / len) * dashSpeed;
          b.rocketTimer = 0.24;
          b.rocketHit = false;
          if (b.skills[0]) b.skills[0]._cd = 4.5;
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "GOMU ROCKET!");
          g.spawnSparks(b.x, b.y, COLORS.white, COLORS.red);
          g.entities.push(spawnDelayedAction(0.2, (gg) => {
            if (!b.alive) return;
            const t2 = gg.balls.find((x) => x !== b && x.alive);
            if (!t2) return;
            const ang2 = Math.atan2(t2.y - b.y, t2.x - b.x);
            gg.entities.push(spawnGomuPistol({
              owner: b,
              angle: ang2,
              maxLen: 215,
              damage: Math.round(7 + rng() * 3),
              knockback: 560,
            }));
            sound.playBallHit();
          }));
        },
      });
      return true;
    },
  };

  const SKILL_GETSUGA = {
    name: "Getsuga Tensho",
    cooldown: 3.4,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const hollow = ball.ultTimer > 0;
      beginCast(ball, {
        kind: "slash", duration: hollow ? 0.3 : 0.42, color: COLORS.red, maxR: hollow ? 25 : 16,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 14);
          g.entities.push(spawnShockRing(m.x, m.y, COLORS.red, hollow ? 80 : 55, 0.3));
          g.entities.push(spawnProjectile({
            owner: b, target: t, x: m.x, y: m.y,
            speed: hollow ? 580 : 510, radius: hollow ? 25 : 16, damage: hollow ? 24 : 14,
            color: COLORS.red, label: hollow ? "HOLLOW GETSUGA!" : "GETSUGA!", shape: "crescent",
            onImpact(tt, gg) {
              gg.addEffect(tt, "slow", hollow ? 1.0 : 0.75, { factor: 0.65 });
              if (!hollow) gg.chargeUlt(b);
            },
          }));
        },
      });
      return true;
    },
  };

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
          particles.push({
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
            shakeTime = Math.max(shakeTime, 0.2);
            shakeIntensity = Math.max(shakeIntensity, 6);
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

        drawHeart(c, 0, -this.radius * 0.1, this.radius * 0.4, "#2ecc71");

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
      state: "throwing", // "throwing" -> "frozen" -> "unfrozen"
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
          if (timeStopTimer <= 0) {
            this.state = "unfrozen";
            if (this.target.alive) {
              this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            }
          }
        } else if (this.state === "unfrozen") {
          const infFactor = getInfinitySlowFactor(this.target, this.x, this.y);
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
            shakeTime = Math.max(shakeTime, 0.12);
            shakeIntensity = Math.max(shakeIntensity, 3.5);
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

      entities.push(spawnTimeStopKnife({
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

  function triggerTimeResume() {
    timeStopTimer = 0;
    sound.playTimeResume();
    entities.push(spawnBanner("TIME RESUMES!", COLORS.gold));
    shakeTime = 0.35; shakeIntensity = 7;

    for (const ent of entities) {
      if (ent.isKnife && ent.state === "frozen") {
        ent.state = "unfrozen";
        if (ent.target) {
          ent.angle = Math.atan2(ent.target.y - ent.y, ent.target.x - ent.x);
        }
      }
    }
    if (timeStopOwner && timeStopOwner.alive) {
      timeStopOwner.ultTimer = 0;
    }
    timeStopOwner = null;
  }

  function spawnStandClashEffect(x, y, duration = 2.2, b1 = null, b2 = null, getMeter = null) {
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
        const pulse = 1 + Math.sin(t * 58) * 0.28;
        const meter = getMeter ? Math.max(0.1, Math.min(0.9, getMeter())) : 0.5;
        const p1Pct = Math.round(meter * 100);
        const p2Pct = 100 - p1Pct;
        const c1 = b1 ? b1.color : COLORS.gold;
        const c2 = b2 ? b2.color : "#9b59b6";

        c.save();

        // Subtle dramatic arena dim during Stand Clash
        c.fillStyle = "rgba(18, 12, 32, 0.26)";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // Anime clash core at collision midpoint
        c.save();
        c.translate(this.x, this.y);

        const grad = c.createRadialGradient(0, 0, 2, 0, 0, 62 * pulse);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
        grad.addColorStop(0.32, "rgba(255, 215, 0, 0.8)");
        grad.addColorStop(0.7, "rgba(155, 89, 182, 0.35)");
        grad.addColorStop(1, "rgba(255, 215, 0, 0)");
        c.fillStyle = grad;
        c.beginPath();
        c.arc(0, 0, 62 * pulse, 0, Math.PI * 2);
        c.fill();

        // Sharp rotating anime speed rays
        c.strokeStyle = COLORS.white;
        c.lineWidth = 2.6;
        for (let i = 0; i < 12; i++) {
          const ang = (Math.PI * 2 * i) / 12 + t * 18;
          const len = (28 + ((i % 2) * 22)) * pulse;
          c.beginPath();
          c.moveTo(Math.cos(ang) * 9, Math.sin(ang) * 9);
          c.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
          c.stroke();
        }

        // Expanding clash shockwave ring
        const ringProg = (t * 5.2) % 1;
        const ringR = 18 + ringProg * 54;
        c.strokeStyle = `rgba(255, 215, 0, ${0.9 * (1 - ringProg)})`;
        c.lineWidth = 3.2;
        c.beginPath();
        c.arc(0, 0, ringR, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // Chunky Anime Tug-of-War Clash Meter at top-center
        const barW = 320;
        const barH = 26;
        const barX = (WORLD_SIZE - barW) * 0.5;
        const barY = 74;
        const splitX = barX + barW * meter;

        // Header pill
        c.font = `bold 14px ${FONT}`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 4;
        c.strokeStyle = COLORS.ink;
        c.strokeText("STAND CLASH!", WORLD_SIZE * 0.5, barY - 17);
        c.fillStyle = COLORS.gold;
        c.fillText("STAND CLASH!", WORLD_SIZE * 0.5, barY - 17);

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
        c.fillStyle = "rgba(255, 255, 255, 0.22)";
        c.fillRect(barX, barY, barW, barH * 0.42);
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
        c.roundRect(splitX - 4, barY - 4, 8, barH + 8, 3);
        c.fill();
        c.stroke();

        // Percentage & fighter labels inside/beside meter
        c.font = `bold 13px ${FONT}`;
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        const n1 = b1 ? (b1.shortName || b1.name) : "P1";
        const n2 = b2 ? (b2.shortName || b2.name) : "P2";

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
        if (dist <= 58) {
          const midX = (s1.x + s2.x) * 0.5;
          const midY = (s1.y + s2.y) * 0.5;
          const clashAng = Math.atan2(dy, dx);
          const sep = 20;
          const clashDuration = 2.2;
          const winnerIdx = rng() < 0.5 ? 0 : 1;

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

          b1.standAttackTimer = clashDuration;
          b2.standAttackTimer = clashDuration;

          entities.push(spawnStandClashEffect(midX, midY, clashDuration, b1, b2, () => s1.clashMeter));
          hitStop = 0.08;
          shakeTime = 0.35;
          shakeIntensity = 9;
          sound.playMudaRush();
          return;
        }
      }
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
      beginCast(ball, {
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
    if (rng() < 0.025) {
      const healAmt = Math.round(2 + rng() * 2); // 2-4 HP
      const actualHeal = Math.min(healAmt, ball.maxHp - ball.hp);
      if (actualHeal > 0) {
        ball.hp += actualHeal;
        spawnSparks(ball.x, ball.y, COLORS.green, COLORS.dioYellow);
        spawnDamageText(ball.x, ball.y - ball.radius - 10, 0, COLORS.green, false, `+${actualHeal} HP`);
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
      const roll = rng();
      const enemyList = (g && g.balls) ? g.balls : balls;
      const enemy = enemyList.find((b) => b !== ball && b.alive);

      if (roll < 0.05 && enemy) {
        // 5% chance: teleport behind the enemy ball
        let eAng = Math.atan2(enemy.vy, enemy.vx);
        if (Math.abs(enemy.vx) < 0.01 && Math.abs(enemy.vy) < 0.01) {
          eAng = enemy.weaponAngle || 0;
        }
        const behindDist = enemy.radius + ball.radius + 14;
        const pad = ball.radius + 8;
        const tx = Math.max(pad, Math.min(WORLD_SIZE - pad, enemy.x - Math.cos(eAng) * behindDist));
        const ty = Math.max(pad, Math.min(WORLD_SIZE - pad, enemy.y - Math.sin(eAng) * behindDist));

        spawnSparks(ball.x, ball.y, COLORS.gold, COLORS.dioGreen);
        ball.x = tx;
        ball.y = ty;
        const spd = Math.hypot(ball.vx, ball.vy) || ball.baseSpeed;
        const toEnemy = Math.atan2(enemy.y - ty, enemy.x - tx);
        ball.vx = Math.cos(toEnemy) * spd;
        ball.vy = Math.sin(toEnemy) * spd;
        spawnSparks(tx, ty, COLORS.gold, COLORS.dioGreen);
        spawnDamageText(tx, ty - ball.radius - 12, 0, COLORS.gold, false, "BEHIND YOU!");
        return true;
      }

      if (roll < 0.17) {
        // 12% chance (0.05..0.17): teleport to a random area in the arena
        const pad = ball.radius + 20;
        const tx = pad + rng() * (WORLD_SIZE - pad * 2);
        const ty = pad + rng() * (WORLD_SIZE - pad * 2);
        spawnSparks(ball.x, ball.y, COLORS.gold, COLORS.dioGreen);
        ball.x = tx;
        ball.y = ty;
        spawnSparks(tx, ty, COLORS.gold, COLORS.dioGreen);
        spawnDamageText(tx, ty - ball.radius - 12, 0, COLORS.dioGreen, false, "TELEPORT!");
        return true;
      }

      return false;
    },
  };

  const SKILL_ORA_BARRAGE = {
    name: "Ora Barrage",
    cooldown: 2.4,
    onTick(ball, game) {
      if (ball.standState) return false;
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      beginCast(ball, {
        kind: "stand_rush", duration: inUlt ? 0.16 : 0.25, color: "#9b59b6",
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
            maxDashDist: inUlt ? 380 : 220,
            barrageTimer: 0,
            punchInterval: 0.075,
            punchesLeft: inUlt ? 6 : 5,
            hitCount: 0,
            heavy: inUlt,
            cry: "ORA",
            standColor: "#9b59b6",
            vampiric: false,
          };
          g.spawnDamageText(b.x, b.y - b.radius, 0, "#9b59b6", false, "STAR PLATINUM!");
        },
      });
      return true;
    },
  };

  function spawnGreatswordSwing({ owner, angle, arcSpan = Math.PI * 0.9, reach = 128, duration = 0.24, damage = 24, knockback = 360, berserk = false, direction = 1, onComplete = null }) {
    const hitSet = new Set();
    const startAng = angle - direction * arcSpan * 0.5;
    owner.swingState = true;
    owner.weaponAngle = startAng;
    return {
      x: owner.x,
      y: owner.y,
      life: duration,
      maxLife: duration,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        this.x = owner.x;
        this.y = owner.y;
        const progress = 1 - Math.max(0, this.life / this.maxLife);
        const curAng = startAng + direction * arcSpan * progress;
        owner.weaponAngle = curAng;

        // Emit heavy air-tearing sparks along the sweeping blade tip
        if (Math.random() < 0.85) {
          const tipR = reach * (0.65 + Math.random() * 0.35);
          const perp = curAng - direction * Math.PI * 0.5;
          particles.push({
            x: owner.x + Math.cos(curAng) * tipR,
            y: owner.y + Math.sin(curAng) * tipR,
            vx: Math.cos(perp) * (70 + Math.random() * 90),
            vy: Math.sin(perp) * (70 + Math.random() * 90),
            size: berserk ? 5 : 4,
            life: 0.18,
            maxLife: 0.18,
            color: berserk ? "#ff2a2a" : COLORS.silver,
            shape: "square",
            rot: curAng,
          });
        }

        for (const target of g.balls) {
          if (target === owner || !target.alive || hitSet.has(target)) continue;
          const dx = target.x - owner.x;
          const dy = target.y - owner.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= reach + target.radius) {
            let inArc = berserk;
            if (!inArc) {
              let diff = Math.atan2(dy, dx) - angle;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              inArc = Math.abs(diff) <= arcSpan * 0.55;
            }
            if (inArc) {
              hitSet.add(target);
              const dealt = g.applyDamage(target, damage);
              target.flashTimer = 0.14;
              target.squash = 0.95;
              const kAng = Math.atan2(dy, dx);
              target.vx = Math.cos(kAng) * knockback;
              target.vy = Math.sin(kAng) * knockback;
              g.spawnSparks(target.x, target.y, berserk ? COLORS.red : COLORS.silver, COLORS.ink);
              g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, berserk ? COLORS.red : COLORS.silver, true, berserk ? "BERSERK CLEAVE!" : "CLEAVE!");
              if (!berserk) g.chargeUlt(owner);
              hitStop = Math.max(hitStop, berserk ? 0.08 : 0.05);
              shakeTime = Math.max(shakeTime, berserk ? 0.3 : 0.22);
              shakeIntensity = Math.max(shakeIntensity, berserk ? 10 : 7);
              sound.playCritHit();
            }
          }
        }
        if (this.life <= 0) {
          owner.swingState = false;
          this.dead = true;
          if (onComplete) onComplete(g);
        }
      },
      render(c) {
        const progress = 1 - Math.max(0, this.life / this.maxLife);
        const alpha = Math.max(0, 1 - progress * 0.65);
        const curAng = startAng + direction * arcSpan * progress;
        const trailSpan = Math.min(arcSpan * progress, arcSpan * 0.65);
        const trailStart = curAng - direction * trailSpan;

        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = alpha;

        // 1. Tapered Crescent Slash Body (wide at blade tip, sharp at tail)
        const steps = 14;
        const outerR = reach * 1.02;
        c.beginPath();
        for (let i = 0; i <= steps; i++) {
          const f = i / steps;
          const a = trailStart + (curAng - trailStart) * f;
          const rOut = outerR * (0.86 + 0.14 * f);
          const px = Math.cos(a) * rOut;
          const py = Math.sin(a) * rOut;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        for (let i = steps; i >= 0; i--) {
          const f = i / steps;
          const a = trailStart + (curAng - trailStart) * f;
          const thickness = Math.sin(f * Math.PI * 0.85) * (berserk ? 48 : 38) + f * 12;
          const rIn = Math.max(owner.radius * 0.7, outerR * (0.86 + 0.14 * f) - thickness);
          c.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        }
        c.closePath();
        c.fillStyle = berserk ? "rgba(215, 20, 35, 0.82)" : "rgba(203, 213, 225, 0.82)";
        c.fill();
        c.lineWidth = 3.5;
        c.strokeStyle = COLORS.ink;
        c.stroke();

        // 2. Inner blazing core streak & dark outer shock lines
        c.strokeStyle = berserk ? "#ff6b6b" : COLORS.white;
        c.lineWidth = berserk ? 5 : 4;
        c.lineCap = "round";
        c.beginPath();
        c.arc(0, 0, outerR * 0.9, trailStart + (curAng - trailStart) * 0.25, curAng, direction < 0);
        c.stroke();

        c.strokeStyle = berserk ? "#14090c" : "rgba(25, 28, 36, 0.65)";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, outerR * 1.08, trailStart + (curAng - trailStart) * 0.15, curAng, direction < 0);
        c.stroke();

        c.restore();
      },
    };
  }

  const SKILL_DRAGONSLAYER_CLEAVE = {
    name: "Dragonslayer Cleave",
    cooldown: 2.1,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      beginCast(ball, {
        kind: "swing", duration: inUlt ? 0.14 : 0.3, color: inUlt ? COLORS.red : COLORS.silver,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const berserk = b.ultTimer > 0;
          if (berserk) {
            const spd = Math.hypot(b.vx, b.vy) || b.baseSpeed;
            b.vx = Math.cos(ang) * spd * 1.18;
            b.vy = Math.sin(ang) * spd * 1.18;
            if (b.skills[0]) b.skills[0]._cd = 1.25;
            gg.entities.push(spawnGreatswordSwing({
              owner: b,
              angle: ang,
              arcSpan: Math.PI * 2,
              reach: 152,
              duration: 0.2,
              damage: Math.round(24 + rng() * 6),
              knockback: 260,
              berserk: true,
              direction: 1,
              onComplete(gg2) {
                if (!b.alive) return;
                const t2 = gg2.balls.find((x) => x !== b && x.alive);
                const ang2 = t2 ? Math.atan2(t2.y - b.y, t2.x - b.x) : ang;
                const spd2 = Math.hypot(b.vx, b.vy) || b.baseSpeed;
                b.vx = Math.cos(ang2) * Math.max(spd2, b.baseSpeed * 1.25);
                b.vy = Math.sin(ang2) * Math.max(spd2, b.baseSpeed * 1.25);
                gg2.entities.push(spawnGreatswordSwing({
                  owner: b,
                  angle: ang2,
                  arcSpan: Math.PI * 2,
                  reach: 158,
                  duration: 0.22,
                  damage: Math.round(28 + rng() * 8),
                  knockback: 490,
                  berserk: true,
                  direction: -1,
                }));
                sound.playBallHit();
              },
            }));
          } else {
            gg.entities.push(spawnGreatswordSwing({
              owner: b,
              angle: ang,
              arcSpan: Math.PI * 0.92,
              reach: 128,
              duration: 0.24,
              damage: Math.round(25 + rng() * 6),
              knockback: 360,
              berserk: false,
            }));
          }
          sound.playBallHit();
          gg.spawnDamageText(b.x, b.y - b.radius, 0, berserk ? COLORS.red : COLORS.silver, false, berserk ? "SAVAGE RAMPAGE x2!" : "DRAGONSLAYER!");
        },
      });
      return true;
    },
  };

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
            sound.playCritHit();
            g.entities.push(spawnShockRing(this.x, this.y, "#00b4ff", 95, 0.36));
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
            // Pull enemy strongly toward the center of Lapse Blue
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
          particles.push({
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
          g.entities.push(spawnShockRing(this.x, this.y, "#8be9ff", 105, 0.35));
          sound.playBallHit();
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
    g.entities.push(spawnShockRing(cx, cy, "#e5b8ff", aoeR * 0.9, 0.45));
    g.spawnSparks(cx, cy, "#b84dff", COLORS.white);
    for (const tt of g.balls) {
      if (tt === owner || !tt.alive) continue;
      const dist = Math.hypot(tt.x - cx, tt.y - cy);
      if (dist <= aoeR + tt.radius) {
        if (tt !== directHitTarget) {
          const splashDmg = g.applyDamage(tt, Math.round(16 + rng() * 4));
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
    hitStop = Math.max(hitStop, 0.11);
    shakeTime = Math.max(shakeTime, 0.48);
    shakeIntensity = Math.max(shakeIntensity, 12);
    sound.playCritHit();
  }

  function spawnUnlimitedVoidDomain({ owner, duration = 6.0 }) {
    return {
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

        // 1. Deep cosmic ink-black void backdrop
        c.globalAlpha = 0.72 * fade;
        c.fillStyle = "#02060f";
        c.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        // 2. Swirling pale ice-blue/white vortex rings around central singularity
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

        // 3. Soft glowing ice-blue corona + pitch-black central singularity sphere
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

        // 4. Pitch-black ink splatter blobs on left/right edges of the singularity
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

        // 5. Bright white glowing paint splatters & streaks at corners/edges
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
        // White diagonal splash streaks
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

      // First skill cast in Six Eyes triggers Domain Expansion: Unlimited Void (6s enemy freeze!)
      if (ball.ultTimer > 0 && !ball.domainUsedInUlt) {
        ball.domainUsedInUlt = true;
        g.addEffect(target, "stun", 6.0);
        target.vx = 0;
        target.vy = 0;
        g.entities.push(spawnUnlimitedVoidDomain({ owner: ball, duration: 6.0 }));
        g.entities.push(spawnBanner("DOMAIN: UNLIMITED VOID!", "#38bdf8"));
        g.spawnDamageText(target.x, target.y - target.radius - 18, 0, "#7dd3fc", true, "INFINITE VOID (6S)!");
        sound.playTimeStop();
        shakeTime = Math.max(shakeTime, 0.35);
        shakeIntensity = Math.max(shakeIntensity, 8);
      }

      const mode = ball.limitlessNext === "blue" ? "blue" : "red";
      ball.limitlessNext = mode === "red" ? "blue" : "red";
      beginCast(ball, {
        kind: "orb",
        duration: 0.42,
        color: mode === "red" ? "#ff1e42" : "#00b4ff",
        maxR: mode === "red" ? 21 : 23,
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const ang = Math.atan2(t.y - b.y, t.x - b.x);
          const m = castMuzzle(b, ang, 16);
          if (mode === "red") {
            gg.entities.push(spawnProjectile({
              owner: b,
              target: t,
              x: m.x,
              y: m.y,
              speed: 570,
              radius: 17,
              damage: Math.round(13 + rng() * 3),
              color: "#ff1e42",
              label: "REVERSAL RED!",
              shape: "limitless_red",
              onImpact(tt, gg2, proj) {
                const kAng = Math.atan2(tt.y - b.y, tt.x - b.x);
                tt.vx = Math.cos(kAng) * 640;
                tt.vy = Math.sin(kAng) * 640;
                tt.squash = 0.95;
                gg2.entities.push(spawnShockRing(proj.x, proj.y, "#ff1e42", 125, 0.4));
                gg2.spawnSparks(proj.x, proj.y, "#ff1e42", COLORS.white);
                gg2.chargeUlt(b);
                shakeTime = Math.max(shakeTime, 0.25);
                shakeIntensity = Math.max(shakeIntensity, 7);
                sound.playCritHit();
              },
            }));
          } else {
            gg.entities.push(spawnLimitlessBlueVortex({ owner: b, target: t, x: m.x, y: m.y }));
          }
          sound.playBallHit();
        },
      });
      return true;
    },
  };

  const CHARACTER_ROSTER = {
    goku: {
      id: "goku",
      name: "STRONGEST ALIEN",
      shortName: "ALIEN",
      title: "Earth's Protector • Legendary Ki Master",
      role: "ALIEN • KAMEHAMEHA & DRAGON RUSH",
      color: COLORS.orange,
      radius: 28,
      speed: 365,
      maxHp: 340,
      damage: [9, 15],
      mass: 1.05,
      costume: "goku",
      weapon: "nyoibo",
      ult: "kaioken",
      ultName: "KAIOKEN BURST / GREAT APE",
      ultDesc: "Enters Kaioken boosting Kamehameha & Dragon Rush! If HP <= 100 while in Ult, transforms into berserk Great Ape (Oozaru)!",
      skillName: "KAMEHAMEHA / DRAGON RUSH",
      skillDesc: "Alternates Kamehameha blast and straight-line Dragon Rush (chains 3x Dragon Kicks + heavy knockback on hit).",
      skills: [SKILL_KAMEHAMEHA],
    },
    naruto: {
      id: "naruto",
      name: "CHILD OF PROPHECY",
      shortName: "PROPHECY",
      title: "Hero of the Leaf • Nine-Tails Vessel",
      role: "SHINOBI • CHAKRA DASH",
      color: COLORS.narutoOrange,
      radius: 27,
      speed: 380,
      maxHp: 320,
      damage: [8, 14],
      mass: 0.95,
      costume: "naruto",
      weapon: "kunai",
      ult: "rasenshuriken",
      ultName: "RASENSHURIKEN",
      ultDesc: "Forms a spinning wind-chakra disc with 4 blades, thrown towards rival with explosive vortex rings!",
      skillName: "RASENGAN",
      skillDesc: "Charges swirling chakra orb and dashes with explosive acceleration into the enemy.",
      skills: [SKILL_RASENGAN],
    },
    luffy: {
      id: "luffy",
      name: "WARRIOR OF LIBERATION",
      shortName: "LIBERATION",
      title: "Rubber Emperor • Drums of Joy",
      role: "PIRATE • GUM-GUM ROCKET",
      color: COLORS.red,
      radius: 28,
      speed: 355,
      maxHp: 370,
      damage: [9, 16],
      mass: 1.1,
      costume: "luffy",
      weapon: "gomu_fist",
      ult: "gear_4",
      ultName: "GEAR 4: BOUNCEMAN / SNAKEMAN",
      ultDesc: "Odd HP activates BOUNCEMAN (giant AoE King Kong smash + 35% shield). Even HP activates SNAKEMAN (+32% speed + wall-bouncing Jet Culverin arm)!",
      skillName: "GOMU ROCKET → PISTOL",
      skillDesc: "2.5s start CD! Launches Gomu Rocket, then 0.2s later fires Gomu Pistol (4.5s total CD). Replaced by Giant AoE Smash or Wall-Bouncing Arm in Gear 4!",
      skills: [SKILL_GUM_ROCKET],
    },
    ichigo: {
      id: "ichigo",
      name: "SUBSTITUTE REAPER",
      shortName: "REAPER",
      title: "Moon Blade Master • Hollow Hybrid",
      role: "REAPER • GETSUGA TENSHO",
      color: COLORS.ichigoDark,
      radius: 28,
      speed: 370,
      maxHp: 320,
      damage: [10, 16],
      mass: 1.0,
      costume: "ichigo",
      weapon: "tensa_zangetsu",
      ult: "hollow_mask",
      ultName: "HOLLOW MASK BANKAI",
      ultDesc: "Dons the iconic Hollow mask! Speeds up attacks and enlarges Getsuga Tensho into an ominous black-red crescent.",
      skillName: "GETSUGA TENSHO",
      skillDesc: "Swings Tensa Zangetsu to release a razor-sharp red crescent wave cutting across the arena.",
      skills: [SKILL_GETSUGA],
    },
    dio: {
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
    },
    jotaro: {
      id: "jotaro",
      name: "STAR DELINQUENT",
      shortName: "DELINQUENT",
      title: "Stoic Brawler • Bearer of Star Platinum",
      role: "STAND USER • STAR PLATINUM",
      color: "#6c5ce7",
      radius: 28,
      speed: 365,
      maxHp: 350,
      damage: [6, 10],
      mass: 1.05,
      costume: "jotaro",
      weapon: null,
      ult: "star_time_stop",
      ultName: "STAR PLATINUM: THE WORLD!",
      ultDesc: "Stops time across the arena for 4 seconds! Star Platinum locks onto the rival with auto-aimed heavy ORA barrages.",
      skillName: "ORA BARRAGE",
      skillDesc: "Star Platinum dashes forward from behind and unleashes a furious ORA ORA punch barrage!",
      skills: [SKILL_ORA_BARRAGE],
    },
    guts: {
      id: "guts",
      name: "HUNDRED-MAN SLAYER",
      shortName: "SLAYER",
      title: "Black Swordsman • Wielder of the Dragonslayer",
      role: "BERSERKER • DRAGONSLAYER",
      color: "#1c1d24",
      radius: 29,
      speed: 355,
      maxHp: 375,
      damage: [0, 0],
      mass: 1.15,
      costume: "guts",
      weapon: "dragonslayer",
      ult: "berserker_armor",
      ultName: "BERSERKER ARMOR",
      ultDesc: "Dons the cursed black full-face Berserker Armor! Surges with rage speed and replaces Cleave with a 2x 360° Savage Rampage.",
      skillName: "DRAGONSLAYER CLEAVE",
      skillDesc: "Deals 0 collision damage, but swings his colossal iron greatsword in a wide, devastating AoE arc!",
      skills: [SKILL_DRAGONSLAYER_CLEAVE],
    },
    gojo: {
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
    },
  };

  const selectedRosterIds = ["goku", "naruto"];
  const BALL_CONFIGS = [
    CHARACTER_ROSTER[selectedRosterIds[0]],
    CHARACTER_ROSTER[selectedRosterIds[1]],
  ];

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    playCharge(duration = 0.5) {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + duration * 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }

    playWallBounce() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.045);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    }

    playBallHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
    }

    playCritHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const notes = [330, 523.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + i * 0.035;
        osc.type = i === 0 ? "square" : "triangle";
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, start + 0.14);

        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.17);
      });
    }

    playKO() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.28);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }

    playTimeStop() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;

      // 1. Resonant Za Warudo frequency dive & deep bass warp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.36);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);

      // 2. High resonant ringing sweep
      const sweep = this.ctx.createOscillator();
      const sweepGain = this.ctx.createGain();
      sweep.type = "sine";
      sweep.frequency.setValueAtTime(800, now + 0.05);
      sweep.frequency.exponentialRampToValueAtTime(1400, now + 0.26);
      sweep.frequency.exponentialRampToValueAtTime(280, now + 0.52);

      sweepGain.gain.setValueAtTime(0.001, now + 0.05);
      sweepGain.gain.exponentialRampToValueAtTime(0.12, now + 0.25);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      sweep.connect(sweepGain);
      sweepGain.connect(this.ctx.destination);
      sweep.start(now + 0.05);
      sweep.stop(now + 0.6);

      // 3. Ticking clock clicks that decelerate and freeze
      for (let i = 0; i < 4; i++) {
        const tickTime = now + 0.12 + i * (0.07 + i * 0.035);
        const tickOsc = this.ctx.createOscillator();
        const tickGain = this.ctx.createGain();
        tickOsc.type = "triangle";
        tickOsc.frequency.setValueAtTime(900 - i * 85, tickTime);
        tickGain.gain.setValueAtTime(0.08, tickTime);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.035);
        tickOsc.connect(tickGain);
        tickGain.connect(this.ctx.destination);
        tickOsc.start(tickTime);
        tickOsc.stop(tickTime + 0.04);
      }
    }

    playTimeResume() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      // High glass snap & unfreeze harmonic chord
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + idx * 0.02 + 0.18);
        gain.gain.setValueAtTime(0.11, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.23);
      });
    }

    playKnifeThrow() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(860, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.075);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    }

    playKnifeHit() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }

    playMudaRush() {
      if (!this.enabled || !this.ctx || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(340, t);
        osc.frequency.exponentialRampToValueAtTime(95, t + 0.04);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.045);
      }
    }
  }

  class Ball {
    constructor(config, { x, y, angle }) {
      this.name = config.name;
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
      this.apeMode = false;
      this.apeErraticTimer = 0;
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

  let detailFormPreview = false;
  const TRANSFORM_DETAILS = {
    goku: {
      label: "🔥 KAIOKEN / OOZARU",
      speedMult: 1.25,
      radiusMult: 1.0,
      powerText: "32-42 BEAM / 30 KICK",
      hpNote: "HP <= 100 = GREAT APE",
      ultSkillName: "SUPER KAMEHAMEHA / DRAGON RUSH",
      ultSkillCd: "CD: 3.4S",
      ultSkillDesc: "Speed +25%! Empowers Kamehameha beam & Dragon Rush (3x Dragon Kick + launch). Dropping to <=100 HP in Ult triggers berserk Great Ape (35% DMG reduction)!",
    },
    luffy: {
      label: "🔥 GEAR 4",
      speedMult: 1.32,
      radiusMult: 1.22,
      powerText: "26-34 AOE",
      hpNote: "ODD=BOUNCE / EVEN=SNAKE",
      ultSkillName: "KING KONG / BLACK MAMBA",
      ultSkillCd: "CD: 2.1-2.4S",
      ultSkillDesc: "Odd HP = BOUNCEMAN (Giant Fist wide AoE smash + 35% Shield). Even HP = SNAKEMAN (+32% Speed + stretching arm that bounces off walls!).",
    },
    ichigo: {
      label: "🔥 HOLLOW MASK",
      speedMult: 1.28,
      radiusMult: 1.0,
      powerText: "26-34 WAVE",
      ultSkillName: "BLACK GETSUGA TENSHO",
      ultSkillCd: "CD: 1.8S",
      ultSkillDesc: "Speed +28%! Slashes out a blazing black-crimson Bankai crescent wave with higher damage and knockback.",
    },
    guts: {
      label: "🔥 BERSERKER",
      speedMult: 1.32,
      radiusMult: 1.0,
      powerText: "52-66 x2",
      ultSkillName: "SAVAGE RAMPAGE x2",
      ultSkillCd: "CD: 1.25S",
      ultSkillDesc: "Speed +32%! Unleashes 2x consecutive 360° Dragonslayer swings (24-30 + 28-36 DMG) and boosts passive sword hits to 10-14 DMG.",
    },
    gojo: {
      label: "🔥 SIX EYES",
      speedMult: 1.15,
      radiusMult: 1.0,
      powerText: "40+ VOID",
      ultSkillName: "HOLLOW PURPLE",
      ultSkillCd: "5-HIT ULT",
      ultSkillDesc: "Removes blindfold to unleash Six Eyes (+15% Speed) and fuses Red + Blue into a massive Imaginary Mass void singularity (40+ DMG)!",
    },
  };

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
  let previewShopItemId = "skin_ssj_god";

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
    charsUsed: { goku: 1, naruto: 1 },
  };

  const DEFAULT_UNLOCKED_FIGHTERS = new Set(["goku", "naruto", "luffy", "ichigo"]);
  const WALLET_STORAGE_KEY = "anime_ball_wallet_v3";

  const playerWallet = {
    coins: 2000,
    gems: 0,
    unlockedItems: new Set(["aura_none"]),
    unlockedFighters: new Set(DEFAULT_UNLOCKED_FIGHTERS),
  };

  function loadWallet() {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.coins === "number" && parsed.coins >= 0) playerWallet.coins = parsed.coins;
      if (typeof parsed.gems === "number" && parsed.gems >= 0) playerWallet.gems = parsed.gems;
      if (Array.isArray(parsed.unlockedFighters)) {
        playerWallet.unlockedFighters = new Set([...DEFAULT_UNLOCKED_FIGHTERS, ...parsed.unlockedFighters]);
      }
    } catch (_) {}
  }

  function saveWallet() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({
        coins: playerWallet.coins,
        gems: playerWallet.gems,
        unlockedFighters: Array.from(playerWallet.unlockedFighters),
      }));
    } catch (_) {}
  }

  function isFighterUnlocked(charId) {
    return DEFAULT_UNLOCKED_FIGHTERS.has(charId) || playerWallet.unlockedFighters.has(charId);
  }

  loadWallet();

  const SHOP_CATALOG = [
    // --- UNLOCKABLE FIGHTERS (4 NEW BRAWLERS) ---
    {
      id: "fighter_dio",
      name: "ARROGANT VAMPIRE",
      category: "fighter",
      targetChar: "STAND USER • DIO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🧛",
      desc: "Wields The World! Rapid Stand Barrage, Time Stop (ZA WARUDO), and frozen throwing knives.",
      price: 100,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "dio",
      previewCharId: "dio",
    },
    {
      id: "fighter_jotaro",
      name: "STAR DELINQUENT",
      category: "fighter",
      targetChar: "STAND USER • JOTARO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "⭐",
      desc: "Commands Star Platinum! Heavy ORA Barrage dashes, Stand Clash duels, and Star Platinum: The World!",
      price: 200,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "jotaro",
      previewCharId: "jotaro",
    },
    {
      id: "fighter_black_swordsman",
      name: "HUNDRED-MAN SLAYER",
      category: "fighter",
      targetChar: "BERSERKER • GUTS",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🗡️",
      desc: "Wields the colossal Dragonslayer with real blade collision, AoE cleaves, and 2x Savage Rampage Berserker Armor!",
      price: 300,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "guts",
      previewCharId: "guts",
    },
    {
      id: "fighter_honored",
      name: "HONORED SORCERER",
      category: "fighter",
      targetChar: "SORCERER • GOJO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🤞",
      desc: "Six-Eyes prodigy alternating Reversal RED & Lapse BLUE, plus Hollow Purple Imaginary Mass ultimate!",
      price: 400,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "gojo",
      previewCharId: "gojo",
    },

    // --- EXCLUSIVE SKINS (WIP) ---
    {
      id: "skin_ssj_god",
      name: "SUPER SAIYAN GOD",
      category: "skin",
      targetChar: "STRONGEST ALIEN",
      badge: "SKIN • WIP",
      badgeClass: "badge-skin",
      icon: "🔥",
      desc: "Legendary crimson aura and radiant divine red hair. Grants a blazing mythic battle appearance. (Under development)",
      price: 8000,
      currency: "coins",
      status: "WIP",
      previewCharId: "goku",
    },
    {
      id: "skin_sage_cloak",
      name: "SAGE MODE CLOAK",
      category: "skin",
      targetChar: "CHILD OF PROPHECY",
      badge: "SKIN • WIP",
      badgeClass: "badge-skin",
      icon: "🐸",
      desc: "Toad mountain hermit cloak with iconic orange eye pigments and senjutsu chakra scroll. (Under development)",
      price: 7500,
      currency: "coins",
      status: "WIP",
      previewCharId: "naruto",
    },
    {
      id: "skin_sun_god",
      name: "SUN GOD NIKA",
      category: "skin",
      targetChar: "WARRIOR OF LIBERATION",
      badge: "SKIN • WIP",
      badgeClass: "badge-skin",
      icon: "⚡",
      desc: "Pure cloud-white hair and floating Hagoromo steam ribbon radiating absolute freedom. (Under development)",
      price: 9000,
      currency: "coins",
      status: "WIP",
      previewCharId: "luffy",
    },
    {
      id: "skin_mugetsu",
      name: "FINAL GETSUGA",
      category: "skin",
      targetChar: "SUBSTITUTE REAPER",
      badge: "SKIN • WIP",
      badgeClass: "badge-skin",
      icon: "🌑",
      desc: "Long pitch-black hair and dark reiatsu wraps across the face ready for Mugetsu. (Under development)",
      price: 8500,
      currency: "coins",
      status: "WIP",
      previewCharId: "ichigo",
    },

    // --- SECRET FIGHTERS (WIP) ---
    {
      id: "fighter_drill",
      name: "DRILL PIERCER",
      category: "fighter",
      targetChar: "NEW BRAWLER",
      badge: "FIGHTER • WIP",
      badgeClass: "badge-fighter",
      icon: "🌀",
      desc: "Hot-blooded brawler with an expanding spiral core drill piercing through space and time. (Under development)",
      price: 120,
      currency: "gems",
      status: "WIP",
      previewCharId: "naruto",
    },
  ];
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

  function triggerGokuApeTransform(b) {
    if (!b || !b.alive || b.apeMode) return;
    b.apeMode = true;
    b.ultTimer = Math.max(b.ultTimer, 7.5);
    b.radius = Math.round(b.baseRadius * 1.48);
    b.apeErraticTimer = 0;
    addEffect(b, "shield", b.ultTimer, { reduction: 0.35 });
    entities.push(spawnBanner("GREAT APE: OOZARU!", "#b45309"));
    entities.push(spawnShockRing(b.x, b.y, "#f59e0b", 155, 0.52));
    spawnDamageText(b.x, b.y - b.radius - 16, 0, "#ef4444", true, "OOZARU RAMPAGE!");
    sound.playCritHit();
    shakeTime = Math.max(shakeTime, 0.4);
    shakeIntensity = Math.max(shakeIntensity, 9);
  }

  function activateUltimate(ball) {
    if (!ball.alive) return;
    ball.ultCharge = 0;
    sound.playCritHit();
    spawnCritBurst(ball.x, ball.y);
    const fx = {
      gear_4: ["GEAR 4!", COLORS.red],
      kaioken: ["KAIOKEN!", COLORS.orange],
      rasenshuriken: ["RASENSHURIKEN!", COLORS.blue],
      hollow_mask: ["HOLLOW MASK!", COLORS.red],
      time_stop: ["ZA WARUDO!", COLORS.gold],
      star_time_stop: ["STAR PLATINUM: THE WORLD!", "#9b59b6"],
      berserker_armor: ["BERSERKER ARMOR!", COLORS.red],
      hollow_purple: ["HOLLOW PURPLE!", "#b84dff"],
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
          if (b.hp <= 100 && !b.apeMode) {
            triggerGokuApeTransform(b);
          }
        },
      });
    } else if (ball.ult === "rasenshuriken") {
      if (!balls.find((x) => x !== ball && x.alive)) return;
      beginCast(ball, {
        kind: "orb", blades: true, duration: 1.15, color: COLORS.blue, maxR: 30,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 20);
          g.entities.push(spawnShockRing(m.x, m.y, COLORS.blue, 90, 0.4));
          shakeTime = 0.2; shakeIntensity = 5;
          g.entities.push(spawnProjectile({
            owner: b, target: t, x: m.x, y: m.y, speed: 520, radius: 26, damage: 30,
            color: COLORS.blue, label: "RASENSHURIKEN!", shape: "rasenshuriken",
            onImpact(tt, gg, proj) {
              gg.addEffect(tt, "stun", 0.9);
              gg.entities.push(spawnRasenganVisual(proj.x, proj.y, 78));
              gg.entities.push(spawnShockRing(proj.x, proj.y, COLORS.white, 120, 0.5));
              gg.spawnSparks(proj.x, proj.y, COLORS.white, COLORS.blue);
              shakeTime = 0.35; shakeIntensity = 8;
            },
          }));
        },
      });
    } else if (ball.ult === "hollow_mask") {
      beginCast(ball, {
        kind: "powerup", duration: 0.45, color: COLORS.red,
        fire(b) {
          b.ultTimer = 8.0;
          addEffect(b, "haste", 8.0, { factor: 1.28 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.4);
          entities.push(spawnShockRing(b.x, b.y, COLORS.white, 100, 0.4));
        },
      });
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
        kind: "time_stop", duration: 0.45, color: "#9b59b6",
        fire(b) {
          b.ultTimer = 4.0;
          timeStopTimer = 4.0;
          timeStopOwner = b;
          sound.playTimeStop();
          shakeTime = 0.4; shakeIntensity = 8;
        },
      });
    } else if (ball.ult === "berserker_armor") {
      beginCast(ball, {
        kind: "powerup", duration: 0.5, color: COLORS.red,
        fire(b) {
          b.ultTimer = 8.5;
          addEffect(b, "haste", 8.5, { factor: 1.32 });
          if (b.skills[0]) b.skills[0]._cd = Math.min(b.skills[0]._cd, 0.2);
          entities.push(spawnShockRing(b.x, b.y, COLORS.red, 125, 0.45));
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
              triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, tt);
            },
            onOutOfBounds(gg, proj) {
              triggerHollowPurpleExplosion(proj.x, proj.y, b, gg, null);
            },
          }));
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

  function computeCollisionDamage(attacker, impactSpeed, maxImpact) {
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
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }

  function spawnSparks(x, y, colorA, colorB) {
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
      const shortName = skill.name.toUpperCase();
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
      // In Time Stop, the frozen opponent stays pinned in place while Dio rebounds
      if (b1 === timeStopOwner) {
        b1.x -= nx * corr;
        b1.y -= ny * corr;
        if (velAlongNormal < 0) {
          b1.vx -= 2 * velAlongNormal * nx;
          b1.vy -= 2 * velAlongNormal * ny;
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
      hitCooldown = HIT_COOLDOWN;
      totalHits += 1;

      const maxImpact = b1.baseSpeed + b2.baseSpeed;
      const hitB2 = computeCollisionDamage(b1, impactSpeed, maxImpact);
      const hitB1 = computeCollisionDamage(b2, impactSpeed, maxImpact);

      const dmgToB1 = applyDamage(b1, hitB1.amount);
      const dmgToB2 = applyDamage(b2, hitB2.amount);
      const anyCrit = hitB1.isCrit || hitB2.isCrit;

      b1.flashTimer = anyCrit ? 0.14 : 0.085;
      b2.flashTimer = anyCrit ? 0.14 : 0.085;
      b1.squash = 1;
      b2.squash = 1;
      pulse(hpBar1.closest(".hp"), "hit");
      pulse(hpBar2.closest(".hp"), "hit");
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
          const rasDmg = applyDamage(defender, 14);
          addEffect(defender, "stun", 0.5);
          spawnDamageText(defender.x, defender.y - defender.radius - 14, rasDmg, COLORS.blue, false, "RASENGAN!");
          entities.push(spawnRasenganVisual(midX, midY, 48));
          entities.push(spawnShockRing(midX, midY, COLORS.blue, 75, 0.35));
          shakeTime = 0.2; shakeIntensity = 5;
          chargeUlt(attacker);
        }
        if (attacker.dragonRushTimer > 0 && !attacker.dragonRushHit) {
          attacker.dragonRushHit = true;
          attacker.dragonRushTimer = 0;
          const ult = attacker.ultTimer > 0;
          entities.push(spawnDragonKickCombo(attacker, defender, ult));
          if (!ult) chargeUlt(attacker);
        }
        if (attacker.apeMode) {
          const apeDmg = applyDamage(defender, 5);
          spawnSparks(midX, midY, "#b45309", "#ef4444");
          spawnDamageText(defender.x, defender.y - defender.radius - 12, apeDmg, "#f59e0b", true, "APE SMASH!");
          const kAng = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
          defender.vx += Math.cos(kAng) * 260;
          defender.vy += Math.sin(kAng) * 260;
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
            const heavyStandDmg = applyDamage(defender, Math.round(9 + rng() * 4));
            spawnSparks(midX, midY, standColor, COLORS.white);
            spawnDamageText(defender.x, defender.y - defender.radius - 16, heavyStandDmg, standColor, true, heavyCry);
            shakeTime = 0.2;
            shakeIntensity = 6;
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

        // Ramping DoT barrage: hit 1 barely scratches, hit 2+ ramps up harder
        const baseFirst = st.heavy ? 2 : 1;
        const rampStep = st.heavy ? 2 : 1;
        const dmgAmt = baseFirst + (st.hitCount - 1) * rampStep;
        const isEscalated = st.hitCount >= 2;
        const dealt = applyDamage(st.target, dmgAmt);
        if (st.vampiric !== false && ball.costume === "dio") {
          tryDioVampiricHeal(ball);
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
        shakeTime = Math.max(shakeTime, 0.12);
        shakeIntensity = Math.max(shakeIntensity, st.heavy ? 6 : 2.5);

        if (st.hitCount >= 2 && !st.ultCharged && !st.heavy) {
          st.ultCharged = true;
          chargeUlt(ball);
        }

        if (st.punchesLeft <= 0) {
          st.phase = "returning";
        }
      }
    } else if (st.phase === "clashing") {
      ball.standAttackTimer = 0.25;
      st.clashTimer -= dt;
      st.clashPulseTimer -= dt;

      // Intense anime vibration during Stand Clash
      st.x = st.clashBaseX + (rng() - 0.5) * 6;
      st.y = st.clashBaseY + (rng() - 0.5) * 6;

      if (st.clashPulseTimer <= 0) {
        st.clashPulseTimer = 0.09;
        if (st.clashPrimary) {
          const prog = 1 - Math.max(0, st.clashTimer / (st.clashDuration || 2.2));
          if (prog < 0.62) {
            // Dramatic tug-of-war back-and-forth swings
            st.clashMeter = Math.max(0.24, Math.min(0.76, st.clashMeter + (rng() - 0.5) * 0.22));
          } else {
            // Final push toward the 50/50 clash winner
            const targetMeter = st.clashWinnerIdx === 0 ? 0.68 + rng() * 0.12 : 0.20 + rng() * 0.12;
            st.clashMeter += (targetMeter - st.clashMeter) * 0.42;
          }
          spawnSparks(st.clashMidX, st.clashMidY, COLORS.gold, COLORS.white);
          shakeTime = Math.max(shakeTime, 0.1);
          shakeIntensity = Math.max(shakeIntensity, 6);
          sound.playBallHit();
        }
      }

      if (st.clashTimer <= 0) {
        if (st.clashPrimary) {
          const midX = st.clashMidX;
          const midY = st.clashMidY;
          entities.push(spawnShockRing(midX, midY, COLORS.gold, 175, 0.5));
          entities.push(spawnShockRing(midX, midY, COLORS.white, 125, 0.38));
          spawnCritBurst(midX, midY);
          spawnDamageText(midX, midY - 26, 0, COLORS.gold, true, "CLASH IMPACT!");
          hitStop = 0.12;
          shakeTime = 0.45;
          shakeIntensity = 13;
          sound.playCritHit();

          // Winner = higher meter percentage; loser takes heavy damage and is sent flying
          const fighters = [ball, st.clashPartner].filter((f) => f && f.alive);
          if (fighters.length === 2) {
            const winnerIdx = st.clashMeter >= 0.5 ? 0 : 1;
            const winner = fighters[winnerIdx];
            const loser = fighters[1 - winnerIdx];

            const winAng = Math.atan2(winner.y - midY, winner.x - midX);
            winner.vx = Math.cos(winAng) * 160;
            winner.vy = Math.sin(winAng) * 160;
            chargeUlt(winner);
            spawnDamageText(winner.x, winner.y - winner.radius - 14, 0, COLORS.gold, false, "CLASH WIN! +ULT");

            const loseAng = Math.atan2(loser.y - midY, loser.x - midX);
            loser.vx = Math.cos(loseAng) * 560;
            loser.vy = Math.sin(loseAng) * 560;
            const clashDmg = applyDamage(loser, Math.round(14 + rng() * 5));
            loser.flashTimer = 0.22;
            loser.squash = 1.0;
            spawnSparks(loser.x, loser.y, COLORS.red, COLORS.gold);
            spawnDamageText(loser.x, loser.y - loser.radius - 14, clashDmg, COLORS.red, true, "CLASH LOST!");
          }
        }
        st.phase = "returning";
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
        ball.weaponAngle += dt * 4.2;
      }
      if (ball.weapon === "dragonslayer") {
        if (ball.swordHitCd > 0) ball.swordHitCd = Math.max(0, ball.swordHitCd - scaledDt);
        if (!ball.swingState && ball.swordHitCd <= 0) {
          const ang = ball.weaponAngle;
          const bx = ball.x + Math.cos(ang) * (ball.radius + 8);
          const by = ball.y + Math.sin(ang) * (ball.radius + 8);
          const tx = ball.x + Math.cos(ang) * (ball.radius + 98);
          const ty = ball.y + Math.sin(ang) * (ball.radius + 98);
          const segDx = tx - bx;
          const segDy = ty - by;
          const segLenSq = segDx * segDx + segDy * segDy || 1;
          for (const enemy of balls) {
            if (enemy === ball || !enemy.alive) continue;
            const t = Math.max(0, Math.min(1, ((enemy.x - bx) * segDx + (enemy.y - by) * segDy) / segLenSq));
            const cx = bx + t * segDx;
            const cy = by + t * segDy;
            const dist = Math.hypot(enemy.x - cx, enemy.y - cy);
            if (dist <= enemy.radius + 12) {
              ball.swordHitCd = 0.32;
              const berserk = ball.ultTimer > 0;
              const swordDmg = applyDamage(enemy, berserk ? Math.round(10 + rng() * 4) : Math.round(6 + rng() * 3));
              enemy.flashTimer = 0.1;
              enemy.squash = 0.75;
              const kAng = Math.atan2(enemy.y - cy, enemy.x - cx);
              enemy.vx = Math.cos(kAng) * 280;
              enemy.vy = Math.sin(kAng) * 280;
              spawnSparks(cx, cy, berserk ? COLORS.red : COLORS.silver, COLORS.ink);
              spawnDamageText(enemy.x, enemy.y - enemy.radius - 10, swordDmg, berserk ? COLORS.red : COLORS.silver, false, "IRON HIT!");
              sound.playBallHit();
              shakeTime = Math.max(shakeTime, 0.12);
              shakeIntensity = Math.max(shakeIntensity, 4.5);
              break;
            }
          }
        }
      }
      if (ball.standAttackTimer > 0) {
        ball.standAttackTimer = Math.max(0, ball.standAttackTimer - dt);
      }
      if (ball.standState) {
        updateStandState(ball, scaledDt);
      }
      if (ball.ultTimer > 0) {
        ball.ultTimer = Math.max(0, ball.ultTimer - scaledDt);
        if (ball.costume === "goku" && ball.hp <= 100 && !ball.apeMode) {
          triggerGokuApeTransform(ball);
        }
        if (ball.ultTimer <= 0) {
          ball.radius = ball.baseRadius;
          ball.apeMode = false;
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
              spawnKnifeWave(ball, enemy, 3);
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
      if (ball.dragonRushTimer > 0) {
        ball.dragonRushTimer = Math.max(0, ball.dragonRushTimer - scaledDt);
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

      // Freeze both fighters in place while their Stands are clashing
      if (ball.standState && ball.standState.phase === "clashing") {
        continue;
      }

      for (const skill of ball.skills) {
        if (skill._cd > 0) skill._cd = Math.max(0, skill._cd - scaledDt);
      }
      if (!ball.getEffect("stun")) {
        runSkillHook(ball, "onTick", game, scaledDt);
      }

      // Great Ape (Oozaru) erratic & unpredictable berserk rampage
      if (ball.apeMode && !ball.getEffect("stun") && ball.dragonRushTimer <= 0) {
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
      }

      const speedFactor = ball.getSpeedMultiplier();
      if (speedFactor > 0) {
        ball.x += ball.vx * speedFactor * scaledDt;
        ball.y += ball.vy * speedFactor * scaledDt;
        if (ball.rocketTimer <= 0 && ball.rasenganTimer <= 0 && ball.dragonRushTimer <= 0 && !ball.apeMode) {
          ball.normalizeSpeed();
        }
        handleWallCollisions(ball);
      }
    }

    checkStandClash();

    const anyClashing = balls.some((b) => b.alive && b.standState && b.standState.phase === "clashing");
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

    if (ball.weapon === "nyoibo") {
      // Goku's Power Pole
      c.fillStyle = COLORS.red;
      c.fillRect(-4, -22, 8, 44);
      c.strokeRect(-4, -22, 8, 44);
      c.fillStyle = COLORS.gold;
      c.fillRect(-5, -22, 10, 6);
      c.strokeRect(-5, -22, 10, 6);
      c.fillRect(-5, 16, 10, 6);
      c.strokeRect(-5, 16, 10, 6);
    } else if (ball.weapon === "kunai") {
      // Naruto's Kunai
      c.fillStyle = COLORS.silver;
      c.beginPath();
      c.moveTo(0, -20);
      c.lineTo(7, -4);
      c.lineTo(0, 2);
      c.lineTo(-7, -4);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.red;
      c.fillRect(-2.5, 2, 5, 10);
      c.strokeRect(-2.5, 2, 5, 10);
      c.beginPath();
      c.arc(0, 15, 4, 0, Math.PI * 2);
      c.stroke();
    } else if (ball.weapon === "gomu_fist") {
      // Luffy's Gomu-Gomu Fist (larger & Haki-darkened in Gear 4)
      const g4 = ball.ultTimer > 0;
      c.fillStyle = g4 ? COLORS.ichigoDark : COLORS.skin;
      c.beginPath();
      c.arc(0, 0, g4 ? 14 : 11, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.red;
      c.fillRect(-6, 7, 12, 7);
      c.strokeRect(-6, 7, 12, 7);
    } else if (ball.weapon === "tensa_zangetsu") {
      // Ichigo's Bankai katana (Tensa Zangetsu): sleek black blade, cross guard, chain
      c.fillStyle = COLORS.ichigoDark;
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
    } else if (ball.weapon === "throwing_knife") {
      // Dio's sleek throwing knife
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
    } else if (ball.weapon === "star_chain") {
      // Jotaro's heavy gold collar chain & star emblem
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 4;
      c.fillStyle = COLORS.gold;
      for (let i = -1; i <= 1; i++) {
        c.beginPath();
        c.ellipse(0, i * 9, 4.5, 6.5, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    } else if (ball.weapon === "dragonslayer") {
      // Guts' colossal Dragonslayer raw-iron slab greatsword (points radially along weaponAngle)
      const berserk = ball.ultTimer > 0;
      c.save();
      c.rotate(Math.PI * 0.25); // align blade outward along weaponAngle
      c.translate(0, -14);

      // Colossal raw-iron slab blade (~88px tall, 24px wide)
      c.fillStyle = "#1b1d24";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(0, -64);
      c.lineTo(12, -42);
      c.lineTo(12, 24);
      c.lineTo(-12, 24);
      c.lineTo(-12, -42);
      c.closePath();
      c.fill();
      c.stroke();

      // Dark center fuller groove
      c.fillStyle = "#101116";
      c.fillRect(-3, -38, 6, 58);

      // Beveled battle-worn steel / crimson rage cutting edges
      c.strokeStyle = berserk ? "#ff2a2a" : "#8e96a8";
      c.lineWidth = berserk ? 2.8 : 2.2;
      c.beginPath();
      c.moveTo(-9.5, 22);
      c.lineTo(-9.5, -40);
      c.lineTo(0, -59);
      c.lineTo(9.5, -40);
      c.lineTo(9.5, 22);
      c.stroke();

      // Heavy iron crossguard
      c.fillStyle = "#111218";
      c.fillRect(-15, 24, 30, 7);
      c.strokeRect(-15, 24, 30, 7);

      // Leather-wrapped long grip & spiked pommel
      c.fillStyle = "#3a2620";
      c.fillRect(-4, 31, 8, 16);
      c.strokeRect(-4, 31, 8, 16);
      c.fillStyle = "#2b2f3a";
      c.beginPath();
      c.arc(0, 50, 5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.restore();
    }
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



  function drawTheWorldStand(ball, r, c = ctx, showExtras = true) {
    let ang = Math.atan2(ball.vy, ball.vx);
    if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
      ang = ball.weaponAngle || 0;
    }

    const st = showExtras ? ball.standState : null;
    const hoverBob = st ? 0 : Math.sin(elapsed * 4 + (ball.x || 0) * 0.02) * 3.5;
    const behindDist = r * 0.9;
    const standX = st ? st.x : ball.x - Math.cos(ang) * behindDist;
    const standY = st ? st.y : ball.y - Math.sin(ang) * behindDist - 9 + hoverBob;
    const sr = r * 0.94;
    const faceAngle = st ? st.angle : ang;

    c.save();
    c.translate(standX, standY);
    c.lineJoin = "round";
    c.lineCap = "round";

    // 1. Smooth Golden Aura Glow (no dashed circles)
    const auraPulse = Math.sin(elapsed * 5.5) * 3;
    const auraRadius = sr + 16 + auraPulse;
    const auraGrad = c.createRadialGradient(0, 0, sr * 0.35, 0, 0, auraRadius);
    auraGrad.addColorStop(0, "rgba(255, 215, 0, 0.42)");
    auraGrad.addColorStop(0.65, "rgba(255, 215, 0, 0.16)");
    auraGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(0, 0, auraRadius, 0, Math.PI * 2);
    c.fill();

    // 2. Twin Oxygen Cylinders on The World's back
    c.fillStyle = "#d5dbdb";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.roundRect(-sr * 0.78, -sr * 1.15, sr * 0.28, sr * 0.82, 4);
    c.roundRect(sr * 0.5, -sr * 1.15, sr * 0.28, sr * 0.82, 4);
    c.fill();
    c.stroke();

    // Cylinder caps
    c.fillStyle = "#7f8c8d";
    c.fillRect(-sr * 0.74, -sr * 1.22, sr * 0.2, sr * 0.1);
    c.fillRect(sr * 0.54, -sr * 1.22, sr * 0.2, sr * 0.1);

    // Green breathing tubes curving to collar
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

    // 3. Muscular V-Shaped Golden Torso & Broad Pauldrons
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

    // Shoulder armor pads
    c.fillStyle = "#f1c40f";
    c.beginPath();
    c.ellipse(-sr * 0.88, -sr * 0.12, sr * 0.34, sr * 0.24, -0.35, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.ellipse(sr * 0.88, -sr * 0.12, sr * 0.34, sr * 0.24, 0.35, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Chest harness & abdominal plating
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

    // Emerald Heart emblem on chest
    drawHeart(c, 0, sr * 0.38, sr * 0.18, "#2ecc71");

    // 4. The World's Iconic Flat-Topped Crown Helmet & Side Fins
    c.fillStyle = COLORS.gold;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-sr * 0.56, -sr * 0.25);
    c.lineTo(-sr * 0.72, -sr * 0.55); // left side fin
    c.lineTo(-sr * 0.5, -sr * 0.62);
    c.lineTo(-sr * 0.44, -sr * 1.02); // tall flat-top crown
    c.lineTo(sr * 0.44, -sr * 1.02);
    c.lineTo(sr * 0.5, -sr * 0.62);
    c.lineTo(sr * 0.72, -sr * 0.55);  // right side fin
    c.lineTo(sr * 0.56, -sr * 0.25);
    c.lineTo(0, sr * 0.08);
    c.closePath();
    c.fill();
    c.stroke();

    // Helmet V-brow crest
    c.fillStyle = "#f39c12";
    c.beginPath();
    c.moveTo(-sr * 0.42, -sr * 0.68);
    c.lineTo(0, -sr * 0.44);
    c.lineTo(sr * 0.42, -sr * 0.68);
    c.lineTo(0, -sr * 0.58);
    c.closePath();
    c.fill();
    c.stroke();

    // Inverted triangular chin guard
    c.fillStyle = "#e67e22";
    c.beginPath();
    c.moveTo(-sr * 0.34, -sr * 0.22);
    c.lineTo(0, sr * 0.14);
    c.lineTo(sr * 0.34, -sr * 0.22);
    c.closePath();
    c.fill();
    c.stroke();

    // Emerald heart on chin guard
    drawHeart(c, 0, -sr * 0.06, sr * 0.11, "#2ecc71");

    // Dark eye visor slit & glowing crimson eyes
    c.fillStyle = COLORS.ink;
    c.fillRect(-sr * 0.36, -sr * 0.48, sr * 0.72, sr * 0.17);
    c.fillStyle = "#ff2a2a";
    c.fillRect(-sr * 0.26, -sr * 0.44, sr * 0.15, sr * 0.09);
    c.fillRect(sr * 0.11, -sr * 0.44, sr * 0.15, sr * 0.09);

    // 5. Stand Fists / Barrage Flurry
    if (st && (st.phase === "barraging" || st.phase === "clashing")) {
      // Rapid MUDA punch barrage flurry aimed toward enemy
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      for (let i = 0; i < 6; i++) {
        const wave = ((elapsed * 26 + i * 1.15) % 1);
        const reach = sr * (0.65 + wave * 1.55);
        const spread = Math.sin(i * 2.4 + elapsed * 18) * sr * 0.58;
        const fx = dirX * reach + perpX * spread;
        const fy = dirY * reach + perpY * spread;
        c.save();
        c.globalAlpha = Math.max(0.35, 1 - wave * 0.45);
        drawStandFist(c, fx, fy, sr * 0.31, true, faceAngle + Math.PI * 0.5);
        c.restore();
      }
    } else if (st && st.phase === "dashing") {
      // Dashing forward pose with speed streaks
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
      drawStandFist(c, dirX * sr * 0.85 + perpX * sr * 0.45, dirY * sr * 0.85 + perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5);
      drawStandFist(c, dirX * sr * 0.85 - perpX * sr * 0.45, dirY * sr * 0.85 - perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5);
    } else {
      const isAttacking = (ball.standAttackTimer && ball.standAttackTimer > 0) || (ball.ultTimer > 0);
      const punchExt = isAttacking ? Math.sin(elapsed * 32) * 16 : 0;
      drawStandFist(c, -sr * 0.96 - punchExt * 0.35, sr * 0.42 + punchExt, sr * 0.32, isAttacking, 0);
      drawStandFist(c, sr * 0.96 + punchExt * 0.35, sr * 0.42 - punchExt, sr * 0.32, isAttacking, 0);
    }

    c.restore();
  }

  function drawStarPlatinumStand(ball, r, c = ctx, showExtras = true) {
    let ang = Math.atan2(ball.vy, ball.vx);
    if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
      ang = ball.weaponAngle || 0;
    }

    const st = showExtras ? ball.standState : null;
    const hoverBob = st ? 0 : Math.sin(elapsed * 4.2 + (ball.x || 0) * 0.02) * 3.5;
    const behindDist = r * 0.9;
    const standX = st ? st.x : ball.x - Math.cos(ang) * behindDist;
    const standY = st ? st.y : ball.y - Math.sin(ang) * behindDist - 9 + hoverBob;
    const sr = r * 0.94;
    const faceAngle = st ? st.angle : ang;

    c.save();
    c.translate(standX, standY);
    c.lineJoin = "round";
    c.lineCap = "round";

    // 1. Smooth Violet/Gold Aura Glow
    const auraPulse = Math.sin(elapsed * 5.5) * 3;
    const auraRadius = sr + 16 + auraPulse;
    const auraGrad = c.createRadialGradient(0, 0, sr * 0.35, 0, 0, auraRadius);
    auraGrad.addColorStop(0, "rgba(155, 89, 182, 0.48)");
    auraGrad.addColorStop(0.65, "rgba(108, 92, 231, 0.18)");
    auraGrad.addColorStop(1, "rgba(108, 92, 231, 0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(0, 0, auraRadius, 0, Math.PI * 2);
    c.fill();

    // 2. Wild Flowing Indigo-Violet Hair Behind Head
    c.fillStyle = "#2b1644";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-sr * 0.62, -sr * 0.55);
    c.lineTo(-sr * 1.05, -sr * 0.98);
    c.lineTo(-sr * 0.68, -sr * 0.95);
    c.lineTo(-sr * 0.88, -sr * 1.32);
    c.lineTo(-sr * 0.36, -sr * 1.12);
    c.lineTo(0, -sr * 1.42);
    c.lineTo(sr * 0.36, -sr * 1.12);
    c.lineTo(sr * 0.88, -sr * 1.32);
    c.lineTo(sr * 0.68, -sr * 0.95);
    c.lineTo(sr * 1.05, -sr * 0.98);
    c.lineTo(sr * 0.62, -sr * 0.55);
    c.closePath();
    c.fill();
    c.stroke();

    // 3. Muscular Violet V-Torso & Studded Gold Pauldrons
    c.fillStyle = "#8e44ad";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-sr * 1.04, -sr * 0.22);
    c.lineTo(sr * 1.04, -sr * 0.22);
    c.lineTo(sr * 0.72, sr * 0.54);
    c.lineTo(0, sr * 0.94);
    c.lineTo(-sr * 0.72, sr * 0.54);
    c.closePath();
    c.fill();
    c.stroke();

    // Pectoral & abdominal muscle plating
    c.fillStyle = "#6c3483";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-sr * 0.62, -sr * 0.08);
    c.lineTo(-sr * 0.08, sr * 0.14);
    c.lineTo(sr * 0.08, sr * 0.14);
    c.lineTo(sr * 0.62, -sr * 0.08);
    c.lineTo(sr * 0.42, sr * 0.52);
    c.lineTo(0, sr * 0.8);
    c.lineTo(-sr * 0.42, sr * 0.52);
    c.closePath();
    c.fill();
    c.stroke();

    // Gold shoulder armor pads with cyan core
    for (const side of [-1, 1]) {
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.ellipse(side * sr * 0.9, -sr * 0.14, sr * 0.36, sr * 0.25, side * 0.35, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#00e5ff";
      c.beginPath();
      c.arc(side * sr * 0.9, -sr * 0.14, sr * 0.1, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    // Flowing gold neck scarf draping down chest
    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.roundRect(-sr * 0.48, -sr * 0.26, sr * 0.96, sr * 0.22, 4);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-sr * 0.18, -sr * 0.06);
    c.lineTo(sr * 0.18, -sr * 0.06);
    c.lineTo(sr * 0.24, sr * 0.58);
    c.lineTo(0, sr * 0.76);
    c.lineTo(-sr * 0.24, sr * 0.58);
    c.closePath();
    c.fill();
    c.stroke();

    // 4. Chiseled Star Platinum Head, Gold Headband & Glowing Cyan Eyes
    c.fillStyle = "#a569bd";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-sr * 0.46, -sr * 0.66);
    c.lineTo(-sr * 0.48, -sr * 0.34);
    c.lineTo(-sr * 0.28, -sr * 0.14);
    c.lineTo(0, -sr * 0.06);
    c.lineTo(sr * 0.28, -sr * 0.14);
    c.lineTo(sr * 0.48, -sr * 0.34);
    c.lineTo(sr * 0.46, -sr * 0.66);
    c.lineTo(0, -sr * 0.88);
    c.closePath();
    c.fill();
    c.stroke();

    // Gold headband with center diamond star crest
    c.fillStyle = COLORS.gold;
    c.beginPath();
    c.roundRect(-sr * 0.47, -sr * 0.78, sr * 0.94, sr * 0.17, 3);
    c.fill();
    c.stroke();
    c.fillStyle = "#00f0ff";
    c.beginPath();
    c.moveTo(0, -sr * 0.84);
    c.lineTo(sr * 0.1, -sr * 0.69);
    c.lineTo(0, -sr * 0.54);
    c.lineTo(-sr * 0.1, -sr * 0.69);
    c.closePath();
    c.fill();
    c.stroke();

    // Menacing brow shadow & fierce glowing cyan eyes
    c.fillStyle = COLORS.ink;
    c.beginPath();
    c.moveTo(-sr * 0.36, -sr * 0.58);
    c.lineTo(sr * 0.36, -sr * 0.58);
    c.lineTo(sr * 0.3, -sr * 0.4);
    c.lineTo(-sr * 0.3, -sr * 0.4);
    c.closePath();
    c.fill();
    c.fillStyle = "#00f0ff";
    c.fillRect(-sr * 0.26, -sr * 0.52, sr * 0.16, sr * 0.09);
    c.fillRect(sr * 0.1, -sr * 0.52, sr * 0.16, sr * 0.09);

    // 5. Stand Fists / ORA Barrage Flurry
    if (st && (st.phase === "barraging" || st.phase === "clashing")) {
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      for (let i = 0; i < 6; i++) {
        const wave = ((elapsed * 26 + i * 1.15) % 1);
        const reach = sr * (0.65 + wave * 1.55);
        const spread = Math.sin(i * 2.4 + elapsed * 18) * sr * 0.58;
        const fx = dirX * reach + perpX * spread;
        const fy = dirY * reach + perpY * spread;
        c.save();
        c.globalAlpha = Math.max(0.35, 1 - wave * 0.45);
        drawStandFist(c, fx, fy, sr * 0.31, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
        c.restore();
      }
    } else if (st && st.phase === "dashing") {
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      c.strokeStyle = "rgba(155, 89, 182, 0.85)";
      c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        c.beginPath();
        c.moveTo(perpX * sr * 0.45 * i - dirX * sr * 0.6, perpY * sr * 0.45 * i - dirY * sr * 0.6);
        c.lineTo(perpX * sr * 0.45 * i - dirX * sr * 1.8, perpY * sr * 0.45 * i - dirY * sr * 1.8);
        c.stroke();
      }
      drawStandFist(c, dirX * sr * 0.85 + perpX * sr * 0.45, dirY * sr * 0.85 + perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
      drawStandFist(c, dirX * sr * 0.85 - perpX * sr * 0.45, dirY * sr * 0.85 - perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
    } else {
      const isAttacking = (ball.standAttackTimer && ball.standAttackTimer > 0) || (ball.ultTimer > 0);
      const punchExt = isAttacking ? Math.sin(elapsed * 32) * 16 : 0;
      drawStandFist(c, -sr * 0.96 - punchExt * 0.35, sr * 0.42 + punchExt, sr * 0.32, isAttacking, 0, "#9b59b6", COLORS.gold, COLORS.gold);
      drawStandFist(c, sr * 0.96 + punchExt * 0.35, sr * 0.42 - punchExt, sr * 0.32, isAttacking, 0, "#9b59b6", COLORS.gold, COLORS.gold);
    }

    c.restore();
  }

  function drawCostume(ball, r, c = ctx) {
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";

    // Skin-toned face above the clothing line (Goku normal, Naruto, Luffy, Dio, Jotaro, Guts normal)
    if ((ball.costume === "goku" && !ball.apeMode) || ball.costume === "naruto" || ball.costume === "luffy" || ball.costume === "dio" || ball.costume === "jotaro" || (ball.costume === "guts" && !(ball.ultTimer > 0))) {
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

    if (ball.costume === "goku" && ball.apeMode) {
      // Great Ape (Oozaru) form: dark brown fur, pointed ears, tan snarling snout with fangs, glowing red eyes
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = ball.flashTimer > 0 ? COLORS.white : "#3b2316";
      c.fillRect(-r, -r, r * 2, r * 2);
      // Shaggy fur chest highlight
      c.fillStyle = "#513222";
      c.beginPath();
      c.arc(0, r * 0.62, r * 0.72, Math.PI, 0);
      c.fill();
      c.restore();

      // Shaggy fur tufts around head/shoulders
      c.fillStyle = "#3b2316";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI * 0.5;
        const tx = Math.cos(a) * r * 1.06;
        const ty = Math.sin(a) * r * 1.06;
        c.beginPath();
        c.arc(tx, ty, r * 0.22, 0, Math.PI * 2);
        c.fill();
      }

      // Pointed Oozaru ears
      for (const side of [-1, 1]) {
        c.fillStyle = "#3b2316";
        c.beginPath();
        c.moveTo(side * r * 0.85, -r * 0.15);
        c.lineTo(side * r * 1.32, -r * 0.45);
        c.lineTo(side * r * 0.92, r * 0.2);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#c8a27a";
        c.beginPath();
        c.moveTo(side * r * 0.92, -r * 0.1);
        c.lineTo(side * r * 1.18, -r * 0.34);
        c.lineTo(side * r * 0.95, r * 0.08);
        c.closePath();
        c.fill();
      }

      // Tan snout / muzzle
      c.fillStyle = "#c8a27a";
      c.beginPath();
      c.ellipse(0, r * 0.18, r * 0.54, r * 0.44, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Snarling open mouth with sharp white fangs
      c.fillStyle = "#7f1d1d";
      c.beginPath();
      c.ellipse(0, r * 0.32, r * 0.34, r * 0.2, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = COLORS.white;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r * 0.24, r * 0.16);
        c.lineTo(side * r * 0.15, r * 0.34);
        c.lineTo(side * r * 0.07, r * 0.16);
        c.closePath();
        c.fill();
      }

      // Glowing red Oozaru eyes & furrowed brow
      c.fillStyle = "#ef4444";
      c.shadowColor = "#ef4444";
      c.shadowBlur = 10;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.ellipse(side * r * 0.32, -r * 0.18, r * 0.16, r * 0.1, side * -0.25, 0, Math.PI * 2);
        c.fill();
      }
      c.shadowBlur = 0;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.52, -r * 0.34); c.lineTo(-r * 0.14, -r * 0.22);
      c.moveTo(r * 0.52, -r * 0.34); c.lineTo(r * 0.14, -r * 0.22);
      c.stroke();
    } else if (ball.costume === "goku") {
      // Orange Gi with blue undershirt V-neck & white kanji chest badge
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      // Blue undershirt V-collar
      c.fillStyle = COLORS.blue;
      c.beginPath();
      c.moveTo(-r * 0.48, r * 0.52);
      c.lineTo(0, r * 0.84);
      c.lineTo(r * 0.48, r * 0.52);
      c.lineTo(r * 0.95, r * 0.56);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();
      // Orange Gi lapels
      c.fillStyle = COLORS.orange;
      c.beginPath();
      c.moveTo(-r, r * 0.54);
      c.lineTo(-r * 0.38, r * 0.56);
      c.lineTo(-r * 0.05, r * 1.05);
      c.lineTo(-r, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(r, r * 0.54);
      c.lineTo(r * 0.38, r * 0.56);
      c.lineTo(r * 0.05, r * 1.05);
      c.lineTo(r, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();
      // White Turtle/Go chest emblem
      c.fillStyle = COLORS.white;
      c.beginPath();
      c.arc(-r * 0.44, r * 0.78, r * 0.14, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = 2;
      c.stroke();
      c.restore();

      // Iconic asymmetric spiky Saiyan hair silhouette
      c.fillStyle = COLORS.ink;
      c.beginPath();
      c.moveTo(-r * 0.92, -r * 0.18);
      c.lineTo(-r * 1.38, -r * 0.42);
      c.lineTo(-r * 0.98, -r * 0.58);
      c.lineTo(-r * 1.32, -r * 0.96);
      c.lineTo(-r * 0.7, -r * 0.86);
      c.lineTo(-r * 0.48, -r * 1.36);
      c.lineTo(-r * 0.05, -r * 0.96);
      c.lineTo(r * 0.32, -r * 1.44);
      c.lineTo(r * 0.55, -r * 0.92);
      c.lineTo(r * 1.18, -r * 1.18);
      c.lineTo(r * 0.92, -r * 0.68);
      c.lineTo(r * 1.4, -r * 0.58);
      c.lineTo(r * 0.95, -r * 0.28);
      c.lineTo(r * 0.62, -r * 0.44);
      // Forehead bangs
      c.lineTo(r * 0.25, -r * 0.34);
      c.lineTo(r * 0.08, -r * 0.54);
      c.lineTo(-r * 0.15, -r * 0.32);
      c.lineTo(-r * 0.55, -r * 0.48);
      c.closePath();
      c.fill();
      c.strokeStyle = COLORS.ichigoDark;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-r * 0.5, -r * 1.1); c.lineTo(-r * 0.38, -r * 0.82);
      c.moveTo(r * 0.3, -r * 1.2); c.lineTo(r * 0.4, -r * 0.88);
      c.moveTo(r * 0.98, -r * 0.98); c.lineTo(r * 0.82, -r * 0.7);
      c.stroke();
      c.strokeStyle = COLORS.ink;
    } else if (ball.costume === "naruto") {
      // Shippuden orange-and-navy jacket with white zipper
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = COLORS.ichigoDark;
      c.fillRect(-r, r * 0.54, r * 2, r * 0.52);
      c.strokeRect(-r, r * 0.54, r * 2, r * 0.52);
      // Orange jacket center
      c.fillStyle = COLORS.narutoOrange;
      c.fillRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
      c.strokeRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
      // White zipper line
      c.strokeStyle = COLORS.white;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, r * 0.6);
      c.lineTo(0, r);
      c.stroke();
      c.restore();

      // Spiky blonde hair bursting above & around headband
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.moveTo(-r * 0.96, -r * 0.28);
      c.lineTo(-r * 1.24, -r * 0.65);
      c.lineTo(-r * 0.85, -r * 0.72);
      c.lineTo(-r * 0.98, -r * 1.14);
      c.lineTo(-r * 0.48, -r * 0.92);
      c.lineTo(-r * 0.22, -r * 1.32);
      c.lineTo(r * 0.06, -r * 0.96);
      c.lineTo(r * 0.38, -r * 1.3);
      c.lineTo(r * 0.56, -r * 0.9);
      c.lineTo(r * 1.04, -r * 1.08);
      c.lineTo(r * 0.88, -r * 0.68);
      c.lineTo(r * 1.24, -r * 0.62);
      c.lineTo(r * 0.95, -r * 0.28);
      c.closePath();
      c.fill();
      c.stroke();

      // Navy Konoha headband cloth + silver plate
      c.fillStyle = COLORS.ichigoDark;
      c.fillRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);
      c.strokeRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);

      c.fillStyle = COLORS.silver;
      c.fillRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);
      c.strokeRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);

      // Konoha swirl mark on plate
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -r * 0.51, r * 0.08, 0, Math.PI * 1.7);
      c.stroke();

      // 3 crisp cheek whiskers on outer cheeks
      for (const side of [-1, 1]) {
        for (const dy of [0.14, 0.24, 0.34]) {
          c.beginPath();
          c.moveTo(side * r * 0.58, r * dy);
          c.lineTo(side * r * 0.84, r * (dy + 0.03));
          c.stroke();
        }
      }
    } else if (ball.costume === "luffy") {
      // Open red pirate vest with gold buttons (and Gear 4 Haki rim when Ult active)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = ball.ultTimer > 0 ? COLORS.ichigoDark : COLORS.red;
      c.fillRect(-r, r * 0.54, r * 2, r * 0.52);
      c.strokeRect(-r, r * 0.54, r * 2, r * 0.52);
      // Open chest V showing skin
      c.fillStyle = ball.flashTimer > 0 ? COLORS.white : COLORS.skin;
      c.beginPath();
      c.moveTo(-r * 0.34, r * 0.52);
      c.lineTo(0, r * 0.98);
      c.lineTo(r * 0.34, r * 0.52);
      c.closePath();
      c.fill();
      c.stroke();
      // Gold vest buttons
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.arc(-r * 0.42, r * 0.74, 3, 0, Math.PI * 2);
      c.arc(r * 0.42, r * 0.74, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Luffy's stitched scar under left eye
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.44, r * 0.18);
      c.lineTo(-r * 0.22, r * 0.22);
      c.moveTo(-r * 0.37, r * 0.14);
      c.lineTo(-r * 0.37, r * 0.25);
      c.moveTo(-r * 0.29, r * 0.15);
      c.lineTo(-r * 0.29, r * 0.26);
      c.stroke();
      c.lineWidth = 3;

      if (ball.ultTimer > 0) {
        if (ball.gear4Mode === "snakeman") {
          // Snakeman Haki flame wisps (sleek purple-crimson aura)
          c.strokeStyle = "#c026d3";
          c.lineWidth = 2.5;
          c.beginPath();
          c.arc(0, 0, r * 1.12, -Math.PI * 0.85, -Math.PI * 0.15);
          c.stroke();
        } else {
          // Bounceman steam clouds
          c.fillStyle = COLORS.white;
          for (const side of [-1, 1]) {
            c.beginPath();
            c.arc(side * r * 1.02, -r * 0.1, 7, 0, Math.PI * 2);
            c.fill();
            c.stroke();
          }
        }
      }
      // Messy black hair peeking out under the hat
      c.fillStyle = COLORS.ink;
      for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(side * r * 0.62, -r * 0.7);
        c.lineTo(side * r * 1.02, -r * 0.42);
        c.lineTo(side * r * 0.84, -r * 0.3);
        c.lineTo(side * r * 0.96, -r * 0.08);
        c.lineTo(side * r * 0.7, -r * 0.2);
        c.closePath();
        c.fill();
      }
      // Straw Hat on top
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.ellipse(0, -r * 0.78, r * 1.22, r * 0.26, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(0, -r * 0.82, r * 0.62, Math.PI, 0);
      c.closePath();
      c.fill();
      c.stroke();
      // Red ribbon
      c.fillStyle = COLORS.red;
      c.fillRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
      c.strokeRect(-r * 0.6, -r * 0.94, r * 1.2, r * 0.14);
    } else if (ball.costume === "ichigo") {
      // Bankai robe (black coat + red inner lining + peach face)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = COLORS.skin;
      c.fillRect(-r, -r, r * 2, r * 1.48);

      // Red inner Bankai collar lining
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
      c.restore();

      // Wild spiky bright orange Ichigo hair
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 3;
      c.fillStyle = COLORS.orange;
      c.beginPath();
      c.moveTo(-r * 0.95, -r * 0.32);
      c.lineTo(-r * 1.25, -r * 0.72);
      c.lineTo(-r * 0.8, -r * 0.76);
      c.lineTo(-r * 0.82, -r * 1.22);
      c.lineTo(-r * 0.35, -r * 0.88);
      c.lineTo(-r * 0.04, -r * 1.32);
      c.lineTo(r * 0.28, -r * 0.88);
      c.lineTo(r * 0.78, -r * 1.24);
      c.lineTo(r * 0.76, -r * 0.76);
      c.lineTo(r * 1.22, -r * 0.68);
      c.lineTo(r * 0.92, -r * 0.32);
      c.lineTo(r * 0.48, -r * 0.5);
      c.lineTo(r * 0.14, -r * 0.36);
      c.lineTo(-r * 0.08, -r * 0.52);
      c.lineTo(-r * 0.45, -r * 0.38);
      c.closePath();
      c.fill();
      c.stroke();

      // Full-Face Hollow Mask (Bone-white skull dome + right-side crimson stripes + jagged teeth + black/gold eyes)
      if (ball.ultTimer > 0) {
        c.save();
        // Mask outer silhouette
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

        // Clip crimson markings inside the bone mask
        c.save();
        c.clip();

        // Iconic dark crimson-maroon fanning forehead stripes (viewer's right half only)
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

        // Jagged right-cheek stripes below right eye
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

        // Lower-right chin crimson accent
        c.beginPath();
        c.moveTo(r * 0.06, r * 0.74);
        c.lineTo(r * 0.48, r * 0.6);
        c.lineTo(r * 0.32, r * 0.86);
        c.lineTo(r * 0.04, r * 0.94);
        c.closePath();
        c.fill();

        c.restore(); // end mask clip

        // Mask outline + central nose-bridge ridge
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.6;
        c.stroke();

        c.strokeStyle = "rgba(25, 22, 30, 0.55)";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(0, -r * 0.18);
        c.lineTo(0, r * 0.26);
        c.stroke();

        // Sharp angular Hollow eye sockets with black sclera & glowing golden pupils
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

          // Glowing golden Hollow iris
          c.fillStyle = "#ffd426";
          c.beginPath();
          c.arc(side * r * 0.38, -r * 0.07, r * 0.065, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = "#ffffff";
          c.beginPath();
          c.arc(side * r * 0.39, -r * 0.085, r * 0.022, 0, Math.PI * 2);
          c.fill();
        }

        // Interlocking jagged skull teeth across the jaw
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
          // Upper tooth
          c.beginPath();
          c.moveTo(t0, r * 0.3);
          c.lineTo(tm, r * 0.49);
          c.lineTo(t1, r * 0.3);
          c.closePath();
          c.fill();
          c.stroke();
          // Lower tooth
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
    } else if (ball.costume === "dio") {
      // Dio Brando costume (Part 3 DIO)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Black tight undershirt
      c.fillStyle = COLORS.ink;
      c.fillRect(-r * 0.65, r * 0.44, r * 1.3, r * 0.58);

      // Golden-yellow jacket lapels
      c.fillStyle = COLORS.gold;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;

      // Left lapel
      c.beginPath();
      c.moveTo(-r, r * 0.42);
      c.lineTo(-r * 0.35, r * 0.44);
      c.lineTo(-r * 0.08, r * 1.05);
      c.lineTo(-r, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();

      // Right lapel
      c.beginPath();
      c.moveTo(r, r * 0.42);
      c.lineTo(r * 0.35, r * 0.44);
      c.lineTo(r * 0.08, r * 1.05);
      c.lineTo(r, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();

      // Green heart choker at the neck
      drawHeart(c, 0, r * 0.48, r * 0.16, "#2ecc71");

      // Green heart belt buckle at bottom
      drawHeart(c, 0, r * 0.88, r * 0.18, "#2ecc71");

      c.restore();

      // Wild spiky golden-blonde vampire hair
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
      // Bangs
      c.lineTo(r * 0.55, -r * 0.45);
      c.lineTo(r * 0.18, -r * 0.38);
      c.lineTo(0, -r * 0.52);
      c.lineTo(-r * 0.22, -r * 0.38);
      c.lineTo(-r * 0.58, -r * 0.45);
      c.closePath();
      c.fill();
      c.stroke();

      // Golden headband strap across forehead
      c.fillStyle = COLORS.gold;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.rect(-r * 0.88, -r * 0.66, r * 1.76, r * 0.22);
      c.fill();
      c.stroke();

      // Emerald green heart jewel on forehead
      drawHeart(c, 0, -r * 0.55, r * 0.2, "#2ecc71");

      // Vampire eyes & fangs
      if (ball.flashTimer <= 0) {
        const eyeColor = ball.ultTimer > 0 ? COLORS.red : "#d35400";
        c.fillStyle = eyeColor;
        c.beginPath();
        c.arc(-r * 0.3, -r * 0.08, r * 0.08, 0, Math.PI * 2);
        c.arc(r * 0.3, -r * 0.08, r * 0.08, 0, Math.PI * 2);
        c.fill();

        // Tiny vampire fangs
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
    } else if (ball.costume === "jotaro") {
      // Jotaro high-collar gakuran coat & heavy gold chain
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Dark indigo-black coat
      c.fillStyle = "#191628";
      c.fillRect(-r, r * 0.38, r * 2, r * 0.68);

      // High standing coat collar flaps
      c.fillStyle = "#26213d";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(-r * 0.7, r * 0.36);
      c.lineTo(-r * 0.25, r * 0.46);
      c.lineTo(-r * 0.14, r * 1.02);
      c.lineTo(-r * 0.85, r * 1.02);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(r * 0.7, r * 0.36);
      c.lineTo(r * 0.25, r * 0.46);
      c.lineTo(r * 0.14, r * 1.02);
      c.lineTo(r * 0.85, r * 1.02);
      c.closePath();
      c.fill();
      c.stroke();

      // Purple/magenta inner shirt V
      c.fillStyle = "#8e44ad";
      c.beginPath();
      c.moveTo(-r * 0.24, r * 0.44);
      c.lineTo(r * 0.24, r * 0.44);
      c.lineTo(0, r * 0.92);
      c.closePath();
      c.fill();
      c.stroke();

      // Heavy gold collar chain links draping across the left
      c.fillStyle = COLORS.gold;
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.ellipse(-r * 0.32 + i * 7, r * 0.56 + i * 3.5, 4.8, 3.2, 0.4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.restore();

      // Prominent spiky dark hair & sideburns framing the face + sticking out from cap
      c.fillStyle = "#161424";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.beginPath();
      // Left sideburn & spiky side/back tufts
      c.moveTo(-r * 0.72, r * 0.32);
      c.lineTo(-r * 0.94, r * 0.14);
      c.lineTo(-r * 1.18, -r * 0.04);
      c.lineTo(-r * 1.0, -r * 0.24);
      c.lineTo(-r * 1.28, -r * 0.54);
      c.lineTo(-r * 0.94, -r * 0.68);
      c.lineTo(-r * 1.06, -r * 1.04);
      c.lineTo(-r * 0.62, -r * 0.96);
      c.lineTo(-r * 0.42, -r * 1.24);
      c.lineTo(0, -r * 1.08);
      c.lineTo(r * 0.42, -r * 1.24);
      c.lineTo(r * 0.62, -r * 0.96);
      c.lineTo(r * 1.06, -r * 1.04);
      c.lineTo(r * 0.94, -r * 0.68);
      c.lineTo(r * 1.28, -r * 0.54);
      c.lineTo(r * 1.0, -r * 0.24);
      c.lineTo(r * 1.18, -r * 0.04);
      c.lineTo(r * 0.94, r * 0.14);
      c.lineTo(r * 0.72, r * 0.32);
      c.lineTo(r * 0.72, -r * 0.24);
      c.lineTo(-r * 0.72, -r * 0.24);
      c.closePath();
      c.fill();
      c.stroke();

      // Iconic dark-indigo delinquent cap crown (contrasting tone + jagged torn edge)
      c.fillStyle = "#2b2548";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.8;
      c.beginPath();
      c.arc(0, -r * 0.16, r * 0.95, Math.PI * 1.06, Math.PI * 1.94);
      c.lineTo(r * 0.92, -r * 0.36);
      c.lineTo(r * 0.56, -r * 0.44);
      c.lineTo(r * 0.24, -r * 0.35);
      c.lineTo(0, -r * 0.44);
      c.lineTo(-r * 0.24, -r * 0.35);
      c.lineTo(-r * 0.56, -r * 0.44);
      c.lineTo(-r * 0.92, -r * 0.36);
      c.closePath();
      c.fill();
      c.stroke();

      // Angled cap visor brim casting shadow over eyes
      c.fillStyle = "#39315c";
      c.beginPath();
      c.moveTo(-r * 0.86, -r * 0.4);
      c.lineTo(r * 0.86, -r * 0.4);
      c.lineTo(r * 0.72, -r * 0.22);
      c.lineTo(-r * 0.72, -r * 0.22);
      c.closePath();
      c.fill();
      c.stroke();

      // Two iconic gold cap badges (hand/circle pin + rectangular plate)
      c.fillStyle = COLORS.gold;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(-r * 0.2, -r * 0.62, r * 0.13, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.roundRect(r * 0.04, -r * 0.71, r * 0.24, r * 0.18, 2);
      c.fill();
      c.stroke();

      // Sharp stoic eyes peeking under visor
      if (ball.flashTimer <= 0) {
        c.fillStyle = ball.ultTimer > 0 ? "#00f0ff" : "#3498db";
        c.beginPath();
        c.arc(-r * 0.3, -r * 0.06, r * 0.075, 0, Math.PI * 2);
        c.arc(r * 0.3, -r * 0.06, r * 0.075, 0, Math.PI * 2);
        c.fill();
      }
    } else if (ball.costume === "guts") {
      if (ball.ultTimer > 0) {
        // CURSED BERSERKER ARMOR (Eclipse Halo, Tattered Cloak, Beast of Darkness Wolf-Skull Helmet)
        const pulse = 0.85 + 0.15 * Math.sin(performance.now() * 0.012);

        // 1. The Eclipse Halo & Crimson Lightning Rays behind Guts
        c.save();
        c.translate(0, -r * 0.22);
        c.strokeStyle = `rgba(255, 28, 38, ${0.75 * pulse})`;
        c.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const rayA = (i / 12) * Math.PI * 2 + 0.15;
          const rStart = r * 1.05;
          const rMid = r * (1.28 + (i % 2) * 0.12);
          const rEnd = r * (1.52 + (i % 3) * 0.12);
          c.beginPath();
          c.moveTo(Math.cos(rayA) * rStart, Math.sin(rayA) * rStart);
          c.lineTo(Math.cos(rayA + 0.08) * rMid, Math.sin(rayA + 0.08) * rMid);
          c.lineTo(Math.cos(rayA - 0.04) * rEnd, Math.sin(rayA - 0.04) * rEnd);
          c.stroke();
        }
        // Black Eclipse core + blazing crimson corona ring
        c.fillStyle = "#050507";
        c.beginPath();
        c.arc(0, 0, r * 1.08, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#ff1e27";
        c.lineWidth = 3.2;
        c.beginPath();
        c.arc(0, 0, r * 1.08, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = "rgba(255, 110, 110, 0.8)";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, r * 1.04, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // 2. Billowing Tattered Dark Cloak with Crimson Rim-Light
        c.fillStyle = "#08090d";
        c.strokeStyle = "#ff1e27";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-r * 0.72, -r * 0.2);
        c.lineTo(-r * 1.32, r * 0.18);
        c.lineTo(-r * 1.08, r * 0.48);
        c.lineTo(-r * 1.26, r * 0.92);
        c.lineTo(-r * 0.64, r * 0.86);
        c.lineTo(-r * 0.25, r * 1.06);
        c.lineTo(0, r * 0.92);
        c.lineTo(r * 0.25, r * 1.06);
        c.lineTo(r * 0.64, r * 0.86);
        c.lineTo(r * 1.26, r * 0.92);
        c.lineTo(r * 1.08, r * 0.48);
        c.lineTo(r * 1.32, r * 0.18);
        c.lineTo(r * 0.72, -r * 0.2);
        c.closePath();
        c.fill();
        c.stroke();

        // 3. Segmented Ribbed Berserker Armor Body (clipped to ball)
        c.save();
        c.beginPath();
        c.arc(0, 0, r - 0.5, 0, Math.PI * 2);
        c.clip();
        c.fillStyle = "#090a0e";
        c.fillRect(-r, -r, r * 2, r * 2);

        for (let row = 0; row < 4; row++) {
          const py = r * (0.22 + row * 0.2);
          c.fillStyle = row % 2 === 0 ? "#181b25" : "#11131b";
          c.strokeStyle = "#3f465c";
          c.lineWidth = 1.8;
          c.beginPath();
          c.moveTo(-r, py + r * 0.18);
          c.lineTo(-r * 0.35, py + r * 0.04);
          c.lineTo(0, py - r * 0.04);
          c.lineTo(r * 0.35, py + r * 0.04);
          c.lineTo(r, py + r * 0.18);
          c.lineTo(r, py + r * 0.34);
          c.lineTo(0, py + r * 0.14);
          c.lineTo(-r, py + r * 0.34);
          c.closePath();
          c.fill();
          c.stroke();
        }
        c.restore();

        // 4. Swept-Back Beast of Darkness Wolf-Skull Helmet (Full Face)
        c.fillStyle = "#11131c";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.6;
        c.beginPath();
        c.moveTo(-r * 0.82, -r * 0.04);
        c.lineTo(-r * 1.18, -r * 0.24); // swept cheek spike
        c.lineTo(-r * 0.9, -r * 0.44);
        c.lineTo(-r * 1.16, -r * 0.66); // secondary ear ridge
        c.lineTo(-r * 0.84, -r * 0.66);
        c.lineTo(-r * 1.06, -r * 1.32); // tall swept-back left wolf ear
        c.lineTo(-r * 0.44, -r * 0.84);
        c.lineTo(0, -r * 1.12);         // central brow horn
        c.lineTo(r * 0.44, -r * 0.84);
        c.lineTo(r * 1.06, -r * 1.32);  // tall swept-back right wolf ear
        c.lineTo(r * 0.84, -r * 0.66);
        c.lineTo(r * 1.16, -r * 0.66);
        c.lineTo(r * 0.9, -r * 0.44);
        c.lineTo(r * 1.18, -r * 0.24);
        c.lineTo(r * 0.82, -r * 0.04);
        c.lineTo(r * 0.56, r * 0.32);
        c.lineTo(0, r * 0.46);           // sharp armored snout chin
        c.lineTo(-r * 0.56, r * 0.32);
        c.closePath();
        c.fill();
        c.stroke();

        // Steel armor plating ridges & edge highlights
        c.strokeStyle = "#41485e";
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-r * 0.72, -r * 0.62);
        c.lineTo(-r * 0.24, -r * 0.44);
        c.lineTo(0, -r * 0.24);
        c.lineTo(r * 0.24, -r * 0.44);
        c.lineTo(r * 0.72, -r * 0.62);
        c.moveTo(0, -r * 1.04);
        c.lineTo(0, r * 0.02);
        c.moveTo(-r * 0.88, -r * 0.22);
        c.lineTo(-r * 0.52, -r * 0.06);
        c.moveTo(r * 0.88, -r * 0.22);
        c.lineTo(r * 0.52, -r * 0.06);
        c.stroke();

        // 5. Snarling Beast Jaw with Interlocking Upper & Lower Metallic Fangs
        c.fillStyle = "#040507";
        c.beginPath();
        c.moveTo(-r * 0.56, r * 0.04);
        c.lineTo(0, r * 0.09);
        c.lineTo(r * 0.56, r * 0.04);
        c.lineTo(r * 0.42, r * 0.34);
        c.lineTo(0, r * 0.4);
        c.lineTo(-r * 0.42, r * 0.34);
        c.closePath();
        c.fill();

        // Upper fangs
        c.fillStyle = "#2b303f";
        c.strokeStyle = "#525b75";
        c.lineWidth = 1.1;
        for (let t = -2; t <= 2; t++) {
          const tx = t * r * 0.19;
          c.beginPath();
          c.moveTo(tx - r * 0.08, r * 0.05);
          c.lineTo(tx, r * 0.23);
          c.lineTo(tx + r * 0.08, r * 0.05);
          c.closePath();
          c.fill();
          c.stroke();
        }
        // Lower interlocking fangs
        for (let t = -1.5; t <= 1.5; t += 1) {
          const tx = t * r * 0.2;
          c.beginPath();
          c.moveTo(tx - r * 0.07, r * 0.34);
          c.lineTo(tx, r * 0.17);
          c.lineTo(tx + r * 0.07, r * 0.34);
          c.closePath();
          c.fill();
          c.stroke();
        }

        // 6. Jagged Z-Shaped Blazing Crimson Beast Eye-Slits (No Cartoon Eyes)
        c.fillStyle = "#040507";
        for (const side of [-1, 1]) {
          c.beginPath();
          c.moveTo(side * r * 0.68, -r * 0.42);
          c.lineTo(side * r * 0.12, -r * 0.2);
          c.lineTo(side * r * 0.58, -r * 0.09);
          c.closePath();
          c.fill();

          // Crimson Z-streak eye
          c.strokeStyle = "#ff1822";
          c.lineWidth = 3.2;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.beginPath();
          c.moveTo(side * r * 0.62, -r * 0.37);
          c.lineTo(side * r * 0.22, -r * 0.27);
          c.lineTo(side * r * 0.46, -r * 0.21);
          c.lineTo(side * r * 0.16, -r * 0.16);
          c.stroke();

          // Bright hot-red inner core
          c.strokeStyle = "#ff8585";
          c.lineWidth = 1.2;
          c.stroke();
        }
      } else {
        // BLACK SWORDSMAN NORMAL FORM (Dark, grim, battle-worn)
        c.save();
        c.beginPath();
        c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
        c.clip();

        // Dark grim brow shadow over upper face
        c.fillStyle = "rgba(14, 13, 20, 0.34)";
        c.fillRect(-r, -r * 0.55, r * 2, r * 0.45);

        // Obsidian chest armor & dark blood-crimson tattered cloak
        c.fillStyle = "#14161d";
        c.fillRect(-r, r * 0.36, r * 2, r * 0.7);
        c.fillStyle = "#361115";
        c.beginPath();
        c.moveTo(-r, r * 0.34);
        c.lineTo(-r * 0.25, r * 0.54);
        c.lineTo(-r * 0.52, r * 1.04);
        c.lineTo(-r, r * 1.04);
        c.closePath();
        c.fill();

        // Heavy dark-iron armor plate highlights & rivets
        c.strokeStyle = "#2d313d";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.65, r * 0.56);
        c.lineTo(r * 0.65, r * 0.56);
        c.stroke();

        // Diagonal leather greatsword strap + iron buckle
        c.strokeStyle = "#2b1c17";
        c.lineWidth = 5.5;
        c.beginPath();
        c.moveTo(-r * 0.72, r * 0.38);
        c.lineTo(r * 0.48, r * 1.04);
        c.stroke();
        c.fillStyle = "#6c7382";
        c.fillRect(-r * 0.22, r * 0.62, r * 0.18, r * 0.14);

        // Faint crimson Brand of Sacrifice on neck
        c.strokeStyle = "#a91d22";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(r * 0.44, r * 0.34);
        c.lineTo(r * 0.5, r * 0.46);
        c.lineTo(r * 0.38, r * 0.46);
        c.closePath();
        c.stroke();
        c.restore();

        // Spiky pitch-black hair + iconic white stress-streak tuft
        c.fillStyle = "#0e0f14";
        c.strokeStyle = COLORS.ink;
        c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(-r * 0.94, -r * 0.26);
        c.lineTo(-r * 1.05, -r * 0.74);
        c.lineTo(-r * 0.6, -r * 0.9);
        c.lineTo(-r * 0.36, -r * 1.18);
        c.lineTo(0, -r * 1.0);
        c.lineTo(r * 0.36, -r * 1.18);
        c.lineTo(r * 0.6, -r * 0.9);
        c.lineTo(r * 1.05, -r * 0.74);
        c.lineTo(r * 0.94, -r * 0.26);
        c.lineTo(r * 0.46, -r * 0.48);
        c.lineTo(0, -r * 0.34);
        c.lineTo(-r * 0.46, -r * 0.48);
        c.closePath();
        c.fill();
        c.stroke();

        // Iconic white hair streak on forehead
        c.fillStyle = "#e6e8ef";
        c.beginPath();
        c.moveTo(-r * 0.14, -r * 0.48);
        c.lineTo(-r * 0.02, -r * 0.76);
        c.lineTo(r * 0.08, -r * 0.44);
        c.closePath();
        c.fill();
        c.stroke();

        // Diagonal nose scar, closed scarred right eye & fierce left eye
        if (ball.flashTimer <= 0) {
          c.strokeStyle = "#8a3338";
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-r * 0.16, -r * 0.04);
          c.lineTo(r * 0.14, r * 0.14);
          c.stroke();

          c.strokeStyle = COLORS.ink;
          c.lineWidth = 2.6;
          c.beginPath();
          c.moveTo(-r * 0.46, -r * 0.14);
          c.lineTo(-r * 0.18, -r * 0.04);
          c.stroke();

          c.fillStyle = COLORS.ink;
          c.beginPath();
          c.arc(r * 0.3, -r * 0.08, r * 0.085, 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (ball.costume === "gojo") {
      // Satoru Gojo: Dark Jujutsu High-Collar Uniform + Blindfold / Awakened Six Eyes + Snow-White Hair
      const awakened = ball.ultTimer > 0;
      if (awakened) {
        // Slightly transparent Infinity barrier aura + rotating Limitless rings
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

      // Pale skin upper face + dark navy-black Jujutsu uniform collar
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

      // Signature gold uniform button
      c.fillStyle = COLORS.gold;
      c.beginPath();
      c.arc(r * 0.2, r * 0.58, r * 0.09, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = 1.6;
      c.stroke();

      if (!awakened) {
        // Signature sleek black blindfold
        c.fillStyle = "#0e0f17";
        c.fillRect(-r, -r * 0.34, r * 2, r * 0.42);
        c.strokeStyle = "#2b2f45";
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(-r * 0.8, -r * 0.24);
        c.lineTo(r * 0.8, -r * 0.16);
        c.stroke();
      } else {
        // Awakened Six Eyes: crystalline sky-blue eyes with white starlight pupils
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

      // Confident Jujutsu smirk
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.16, r * 0.22);
      c.quadraticCurveTo(r * 0.06, r * 0.3, r * 0.26, r * 0.16);
      c.stroke();
      c.restore();

      // Fluffy spiky snow-white Gojo hair
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
    }

    // Expressive brows and Luffy's scar under the left eye
    const tilt = { luffy: -0.02, ichigo: 0.12, dio: -0.08, jotaro: -0.1 }[ball.costume];
    if (tilt !== undefined && !(ball.costume === "ichigo" && ball.ultTimer > 0)) {
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
      drawTheWorldStand(ball, r, c, showExtras);
    } else if (ball.costume === "jotaro") {
      drawStarPlatinumStand(ball, r, c, showExtras);
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

    const hasFullFaceMask = ball.costume === "gojo" || ((ball.costume === "guts" || ball.costume === "ichigo") && ball.ultTimer > 0) || (ball.costume === "goku" && ball.apeMode);
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

    if (showExtras && timeStopTimer > 0 && ball !== timeStopOwner) {
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

    // Grayscale filter during Time Stop
    if (timeStopTimer > 0) {
      ctx.filter = "grayscale(100%) contrast(1.06)";
    }

    ctx.fillStyle = COLORS.floorA;
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    if (shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * 2 * shakeIntensity,
        (Math.random() - 0.5) * 2 * shakeIntensity
      );
    }

    // Checkerboard floor
    const tile = 50;
    ctx.fillStyle = COLORS.floorB;
    for (let i = 0; i < WORLD_SIZE / tile; i++) {
      for (let j = 0; j < WORLD_SIZE / tile; j++) {
        if ((i + j) % 2 === 1) ctx.fillRect(i * tile, j * tile, tile, tile);
      }
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
      if (ball.alive) drawBall(ball);
    }
    for (const ball of balls) {
      if (ball.alive) drawCast(ball, ctx);
    }

    ctx.filter = "none";

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

  if (btnModalClose) {
    btnModalClose.addEventListener("click", () => {
      sound.unlock();
      if (rosterModal) rosterModal.classList.add("hidden");
    });
  }

  if (rosterModal) {
    rosterModal.addEventListener("click", (e) => {
      if (e.target === rosterModal) {
        sound.unlock();
        rosterModal.classList.add("hidden");
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
        rosterModal.classList.add("hidden");
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
  const TURBO_GRANNY_QUOTES = [
    `"Oi gaki! (Hey brat!) Don't rush me! This shop is WORK IN PROGRESS! Soon I'll stock exclusive cursed skins and secret brawlers!"`,
    `"Hmph! Looking for skins? Baa-san is still sewing them with cursed spirit thread! Come back in the next update, brat!"`,
    `"千万両 (10 Million Ryo)! You better save up your coins and gems! Top-tier brawlers aren't gonna be cheap!"`,
    `"Don't poke me, you insolent runt! Even with my 100 km/h sprint speed, good features take time to develop!"`,
    `"WIP means Work In Progress, dimwit! Go practice your combos in Sandbox arena while I set up shop!"`,
    `"What are you staring at?! You want me to steal your bananas? Go win some matches and earn your keep!"`,
  ];

  // Ball-Styled Turbo Granny Mascot from Dandadan (Maneki-Neko Cursed Doll form - 100% faithful to reference)
  function drawTurboGranny(canvasEl, t) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    // Sassy rhythmic bobbing
    const cy = h * 0.43 + Math.sin(t * 3.8) * 2.2;
    const r = 24.5;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Pointed Cat Ears (White with Large Vermilion Red Inner Triangle)
    const earTwitch = (Math.sin(t * 6.5) > 0.88) ? Math.sin(t * 28) * 0.12 : 0;

    // Left Ear
    ctx.save();
    ctx.translate(-r * 0.62, -r * 0.65);
    ctx.rotate(-0.28 + earTwitch);
    // Outer white ear
    ctx.beginPath();
    ctx.moveTo(3, 4);
    ctx.lineTo(-13, -22);
    ctx.lineTo(13, -8);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    // Inner bold red ear patch (matches Dandadan reference)
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-9, -17);
    ctx.lineTo(8, -7);
    ctx.closePath();
    ctx.fillStyle = "#c91d24";
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(r * 0.62, -r * 0.65);
    ctx.rotate(0.28 - earTwitch);
    // Outer white ear
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(13, -22);
    ctx.lineTo(-13, -8);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    // Inner bold red ear patch
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(9, -17);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.fillStyle = "#c91d24";
    ctx.fill();
    ctx.restore();

    // 2. White Ball Head / Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    // 3. Iconic Red Forehead Spot / Patch (Dandadan signature)
    ctx.beginPath();
    ctx.ellipse(0, -r + 2.5, 6.8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#99181e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    // 4. Forehead Wrinkle Lines (Grumpy old lady furrow / frown)
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = COLORS.ink;
    // Left eyebrow furrow
    ctx.beginPath();
    ctx.moveTo(-3.5, -9);
    ctx.lineTo(-6, -13);
    ctx.stroke();
    // Right eyebrow furrow
    ctx.beginPath();
    ctx.moveTo(3.5, -9);
    ctx.lineTo(6, -13);
    ctx.stroke();

    // 5. Turbo Granny Eyes (Almond shape with upper eyelashes & big dark unhinged stare)
    const isBlinking = (Math.floor(t * 1.3) % 5 === 0) && (t * 1.3 % 1 < 0.18);
    const eyeY = 0.5;
    const eyeSpacing = 8.5;

    if (isBlinking) {
      // Snarky closed eye slit
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = COLORS.ink;
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, 5, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, 5, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      // Draw left & right eyes
      [-1, 1].forEach((dir) => {
        const ex = dir * eyeSpacing;

        ctx.save();
        ctx.translate(ex, eyeY);
        // Slight outward tilt
        ctx.rotate(dir * 0.12);

        // White eye shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.8, 5.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = COLORS.ink;
        ctx.stroke();

        // Large dark charcoal pupil (signature vacant Turbo Granny gaze)
        ctx.beginPath();
        ctx.ellipse(dir * 0.6, 0.2, 4.4, 4.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#202028";
        ctx.fill();

        // Tiny white light reflection dot
        ctx.beginPath();
        ctx.arc(dir * 0.2 - 1.2, -1.2, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // Thick upper eyeliner line
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = COLORS.ink;
        ctx.beginPath();
        ctx.arc(0, -0.6, 6.4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();

        // Distinct upper eyelashes (4 fine curved lashes on upper lid from reference!)
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = COLORS.ink;
        const lashAngles = [-2.4, -2.0, -1.6, -1.2];
        lashAngles.forEach((ang) => {
          const lx = Math.cos(ang) * 6.5;
          const ly = Math.sin(ang) * 5.2;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + Math.cos(ang) * 3.8, ly + Math.sin(ang) * 3.8);
          ctx.stroke();
        });

        ctx.restore();
      });
    }

    // 6. Whiskers (3 sharp black lines on each cheek)
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    // Left cheek whiskers
    ctx.beginPath(); ctx.moveTo(-12, 4); ctx.lineTo(-24, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 7.5); ctx.lineTo(-25, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 11); ctx.lineTo(-23, 14); ctx.stroke();
    // Right cheek whiskers
    ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(24, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 7.5); ctx.lineTo(25, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 11); ctx.lineTo(23, 14); ctx.stroke();

    // 7. Small Black Nose & Vertical Philtrum
    ctx.fillStyle = "#1b1b1f";
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-2.6, 4.2);
    ctx.lineTo(2.6, 4.2);
    ctx.closePath();
    ctx.fill();

    // Philtrum vertical line
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // 8. Cheek Dimples / Creases (near mouth corners)
    ctx.beginPath();
    ctx.arc(-8, 10.5, 2.2, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 10.5, 2.2, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    // 9. Mouth (Talking Rhythm vs Iconic Wavy 'ω' Cat Smirk)
    const talkCycle = Math.abs(Math.sin(t * 6));
    const mouthOpen = talkCycle > 0.4 ? talkCycle * 3.8 : 0;

    if (mouthOpen > 1.2) {
      // Talking / yelling snarl
      ctx.beginPath();
      ctx.ellipse(0, 12, 3.8, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#7a1a2b";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();

      // Pink tongue
      ctx.beginPath();
      ctx.arc(0, 12 + mouthOpen * 0.35, 2.2, 0, Math.PI);
      ctx.fillStyle = "#ff6b8b";
      ctx.fill();
    } else {
      // Classic Dandadan Maneki-Neko wavy cat mouth
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = COLORS.ink;
      ctx.beginPath();
      ctx.arc(-3, 10.2, 3.2, 0.15, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, 10.2, 3.2, 0.1, Math.PI * 0.85);
      ctx.stroke();

      // Small chin line underneath
      ctx.beginPath();
      ctx.arc(0, 15, 3.2, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // 10. Red Collar with Green Scalloped Bib Underneath
    // Green bib under collar
    ctx.beginPath();
    ctx.arc(0, r - 3, 13, 0.25, Math.PI - 0.25);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1b8a4f"; // vivid Dandadan green bib
    ctx.stroke();

    // Red Collar strip
    ctx.beginPath();
    ctx.arc(0, r - 4, 10, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#c0292b"; // red collar
    ctx.stroke();

    // 11. Golden Bell
    const bellY = r + 1;
    ctx.beginPath();
    ctx.arc(0, bellY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = "#f5b041";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    // Bell slit & hole
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3, bellY + 0.5);
    ctx.lineTo(3, bellY + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, bellY + 2, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();

    // 12. Golden Koban Medallion with "千万" (Senman / 10 Million) Kanji!
    const coinY = bellY + 11;
    ctx.save();
    ctx.beginPath();
    // Oval Koban coin shape
    ctx.ellipse(0, coinY, 8.5, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f39c12";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    // Kanji "千万" (Senman) written in bold black calligraphy
    ctx.fillStyle = "#1b1b1f";
    ctx.font = "900 7.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("千", 0, coinY - 4.5);
    ctx.fillText("万", 0, coinY + 4.5);
    ctx.restore();

    ctx.restore();
  }

  // Shop Inspect Modal Live Preview Renderer (WIP Preview Stage)
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

    if (item.category === "skin") {
      const bob = Math.sin(t * 4) * 4;
      const baseChar = CHARACTER_ROSTER[item.previewCharId] || CHARACTER_ROSTER.goku;
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

      // Rotating sparkles around skin
      for (let i = 0; i < 4; i++) {
        const ang = t * 3 + (i * Math.PI) / 2;
        const sx = demoBall.x + Math.cos(ang) * 36;
        const sy = demoBall.y + Math.sin(ang) * 36;
        pCtx.fillStyle = (i % 2 === 0) ? COLORS.gold : COLORS.white;
        pCtx.beginPath();
        pCtx.arc(sx, sy, 2.5 + Math.sin(t * 8 + i) * 1, 0, Math.PI * 2);
        pCtx.fill();
      }

      // WIP Stamp Ribbon on bottom
      pCtx.fillStyle = "rgba(43, 27, 61, 0.85)";
      pCtx.fillRect(0, h - 26, w, 26);
      pCtx.strokeStyle = COLORS.gold;
      pCtx.lineWidth = 2;
      pCtx.strokeRect(4, h - 24, w - 8, 22);

      pCtx.fillStyle = COLORS.gold;
      pCtx.font = "bold 11px 'Lilita One', sans-serif";
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";
      pCtx.fillText("🔒 COMING SOON", w * 0.5, h - 13);
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

      const tr = isUlt ? TRANSFORM_DETAILS[cfg.id] : null;
      const bob = Math.sin(t * 3.8 + phaseOffset) * 4;
      const baseScale = cfg.id === "guts" && isUlt ? 0.96 : 1.15;
      const previewBall = {
        x: canvasEl.width * 0.5,
        y: canvasEl.height * 0.56 + bob,
        radius: cfg.radius * baseScale * (tr ? tr.radiusMult : 1),
        color: cfg.color,
        costume: cfg.costume,
        weapon: cfg.weapon,
        weaponAngle: t * 2.2 + phaseOffset,
        vx: facingRight ? 1 : -1,
        vy: 0,
        flashTimer: 0,
        ultTimer: isUlt ? 5 : 0,
        squash: Math.max(0, Math.sin(t * 7.6 + phaseOffset) * 0.14),
        skills: cfg.skills,
        effects: [],
        equippedAura: cfg.equippedAura || "none",
      };
      drawBall(previewBall, pCtx, true);
    };

    if (currentScreen === "screen-setup" && previewActive) {
      drawFighter(previewActive, BALL_CONFIGS[activeSlot], activeSlot === 0, 0, false);
    } else if (rosterModal && !rosterModal.classList.contains("hidden") && detailCanvas) {
      drawFighter(detailCanvas, CHARACTER_ROSTER[detailCharId], true, 0, detailFormPreview && Boolean(TRANSFORM_DETAILS[detailCharId]));
    }

    if (currentScreen === "screen-shop" && merchantCanvas) {
      drawTurboGranny(merchantCanvas, t);
    }

    if (shopModal && !shopModal.classList.contains("hidden") && shopModalCanvas) {
      renderShopModalPreview(shopModalCanvas, t);
    }
  }

  function updateHomeMatchupUI() {
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

  function updateCharDetailUI() {
    const cfg = CHARACTER_ROSTER[detailCharId] || CHARACTER_ROSTER.goku;
    if (!cfg) return;

    const tr = TRANSFORM_DETAILS[cfg.id] || null;
    const showingUlt = Boolean(tr && detailFormPreview);

    if (detailHeroBox) detailHeroBox.classList.toggle("is-ult-preview", showingUlt);
    if (detailFormToggle) {
      detailFormToggle.classList.toggle("hidden", !tr);
      if (tr && btnFormUlt) btnFormUlt.textContent = tr.label;
      if (btnFormBase) btnFormBase.classList.toggle("active", !showingUlt);
      if (btnFormUlt) btnFormUlt.classList.toggle("active", showingUlt);
    }

    if (detailName) detailName.textContent = cfg.name;
    if (detailTitle) detailTitle.textContent = cfg.title || "Anime Brawler";

    const effSpeed = showingUlt ? Math.round(cfg.speed * tr.speedMult) : cfg.speed;
    if (detailHpFill) detailHpFill.style.width = `${Math.min(100, Math.round((cfg.maxHp / 400) * 100))}%`;
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

  function updateShopUI() {
    if (shopCoinsDisplay) shopCoinsDisplay.textContent = playerWallet.coins.toLocaleString();
    if (shopGemsDisplay) shopGemsDisplay.textContent = playerWallet.gems.toLocaleString();

    if (!shopItemsGrid) return;
    shopItemsGrid.innerHTML = "";

    const filtered = SHOP_CATALOG.filter((item) => {
      if (activeShopFilter === "all") return true;
      return item.category === activeShopFilter;
    });

    for (const item of filtered) {
      const isAvailable = item.status === "AVAILABLE" && item.unlockCharId;
      const isOwned = isAvailable && isFighterUnlocked(item.unlockCharId);

      const card = document.createElement("div");
      card.className = `shop-card-tile ${isOwned ? "tile-owned" : isAvailable ? "tile-available" : "tile-wip"}`;

      const badge = document.createElement("span");
      badge.className = `shop-card-badge ${item.badgeClass}`;
      badge.textContent = isOwned ? "UNLOCKED" : item.badge;

      const icon = document.createElement("div");
      icon.className = "shop-card-icon";
      icon.textContent = item.icon;

      const name = document.createElement("h3");
      name.className = "shop-card-name";
      name.textContent = item.name;

      const snippet = document.createElement("p");
      snippet.className = "shop-card-desc-snippet";
      snippet.textContent = item.targetChar || "UPCOMING";

      const pill = document.createElement("span");
      pill.className = "shop-card-wip-pill";
      if (isOwned) {
        pill.textContent = "✅ OWNED";
      } else if (isAvailable) {
        pill.textContent = `${item.currency === "gems" ? "💎" : "🪙"} ${item.price.toLocaleString()}`;
      } else {
        pill.textContent = "🔒 WIP";
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `btn btn-sm ${isOwned ? "btn-wip" : isAvailable ? "btn-play" : "btn-wip"} shop-card-btn`;
      btn.textContent = isOwned ? "OWNED" : isAvailable ? "BUY" : "PREVIEW";

      card.appendChild(badge);
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(snippet);
      card.appendChild(pill);
      card.appendChild(btn);

      card.addEventListener("click", () => {
        sound.unlock();
        sound.playBallHit();
        openShopInspectModal(item.id);
      });

      shopItemsGrid.appendChild(card);
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

  function updateProfileUI() {
    const baseMatches = 24;
    const baseWins = 18;
    const totalMatches = sessionStats.matches + baseMatches;
    const totalWins = sessionStats.wins + baseWins;

    if (profMatches) profMatches.textContent = totalMatches;
    if (profWins) profWins.textContent = totalWins;
    const wr = Math.round((totalWins / Math.max(1, totalMatches)) * 100);
    if (profWr) profWr.textContent = `${wr}%`;

    let bestChar = "goku";
    let maxUsage = -1;
    for (const [id, count] of Object.entries(sessionStats.charsUsed)) {
      if (count > maxUsage) {
        maxUsage = count;
        bestChar = id;
      }
    }
    if (profFav && CHARACTER_ROSTER[bestChar]) {
      profFav.textContent = CHARACTER_ROSTER[bestChar].name;
    }
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
        nameSpan.textContent = char.shortName || char.name;

        btn.appendChild(cvs);
        btn.appendChild(nameSpan);

        btn.addEventListener("click", () => {
          sound.unlock();
          selectedRosterIds[activeSlot] = char.id;
          BALL_CONFIGS[activeSlot] = CHARACTER_ROSTER[char.id];
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
      for (const char of entries) {
        const unlocked = isFighterUnlocked(char.id);
        const card = document.createElement("div");
        card.className = `avatar-card${unlocked ? "" : " avatar-locked"}`;
        card.dataset.id = char.id;
        card.dataset.series = (char.role || "").split("•")[0].trim().toLowerCase();

        const cvs = document.createElement("canvas");
        cvs.className = "avatar-canvas";
        cvs.width = 54;
        cvs.height = 54;

        const nameSpan = document.createElement("span");
        nameSpan.className = "avatar-name";
        nameSpan.textContent = char.name;

        const tagSpan = document.createElement("span");
        tagSpan.className = "avatar-tag";
        const baseTag = (char.role ? char.role.split("•")[0].trim() : "FIGHTER");
        tagSpan.textContent = unlocked ? baseTag : `🔒 ${baseTag}`;

        card.appendChild(cvs);
        card.appendChild(nameSpan);
        card.appendChild(tagSpan);

        card.addEventListener("click", () => {
          sound.unlock();
          detailCharId = char.id;
          detailFormPreview = false;
          updateCharDetailUI();
          if (rosterModal) rosterModal.classList.remove("hidden");
        });

        rosterAvatarGrid.appendChild(card);
        drawMiniAvatar(cvs, char);
      }
    }

    if (btnFormBase && btnFormUlt) {
      btnFormBase.addEventListener("click", () => {
        sound.unlock();
        detailFormPreview = false;
        updateCharDetailUI();
      });
      btnFormUlt.addEventListener("click", () => {
        sound.unlock();
        detailFormPreview = true;
        updateCharDetailUI();
      });
    }

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
  }

  // Boot
  if (document.fonts && document.fonts.load) document.fonts.load(`24px ${FONT}`).catch(() => {});
  setupUnifiedSelectors();
  resizeCanvas();
  initMatch();
  switchScreen("screen-play");
  requestAnimationFrame(loop);
})();

