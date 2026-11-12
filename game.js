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
  const CRIT_CHANCE = 0.001; // 0.1%
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
  };
  const FONT = '"Lilita One", "Baloo 2", "Trebuchet MS", system-ui, sans-serif';

  // Helper to spawn a solid-outlined projectile entity aimed at the opponent
  function spawnProjectile({ owner, target, x, y, speed, radius, damage, color, label, shape, onImpact }) {
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
      dead: false,
      update(dt, game) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.trail = (this.trail || 0) - dt;
        if (this.trail <= 0) {
          this.trail = 0.035;
          particles.push({ x: this.x, y: this.y, vx: 0, vy: 0, size: this.radius * 0.55, life: 0.2, maxLife: 0.2, color });
        }
        if (shape === "rasenshuriken") {
          this.spin += dt * 18;
        }

        // Out of arena bounds
        if (
          this.x < -this.radius ||
          this.x > WORLD_SIZE + this.radius ||
          this.y < -this.radius ||
          this.y > WORLD_SIZE + this.radius
        ) {
          this.dead = true;
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

  const SKILL_KAMEHAMEHA = {
    name: "Kamehameha",
    cooldown: 3.6,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      if (ball.ultTimer > 0) {
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

  const SKILL_GUM_ROCKET = {
    name: "Gum Rocket",
    cooldown: 2.8,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      beginCast(ball, {
        kind: "dash", duration: 0.4, color: COLORS.red,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const len = Math.hypot(t.x - b.x, t.y - b.y) || 1;
          const dashSpeed = b.baseSpeed * 2.05;
          b.vx = ((t.x - b.x) / len) * dashSpeed;
          b.vy = ((t.y - b.y) / len) * dashSpeed;
          b.rocketTimer = 0.45;
          b.rocketHit = false;
          g.spawnDamageText(b.x, b.y - b.radius, 0, COLORS.red, false, "GUM ROCKET!");
          g.spawnSparks(b.x, b.y, COLORS.white, COLORS.red);
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

  const CHARACTER_ROSTER = {
    goku: {
      id: "goku",
      name: "GOKU",
      title: "Saiyan of Earth • Ki Blaster",
      role: "SAIYAN • KAMEHAMEHA BEAM",
      color: COLORS.orange,
      radius: 28,
      speed: 365,
      maxHp: 340,
      damage: [9, 15],
      mass: 1.05,
      costume: "goku",
      weapon: "nyoibo",
      ult: "kaioken",
      ultName: "KAIOKEN BURST",
      ultDesc: "Enters crimson Kaioken state with glowing red aura! Speeds up and charges massive Kamehameha beams.",
      skillName: "KAMEHAMEHA",
      skillDesc: "Locks aim onto the rival ball, charging ki before unleashing a continuous energy beam.",
      skills: [SKILL_KAMEHAMEHA],
    },
    naruto: {
      id: "naruto",
      name: "NARUTO",
      title: "Hero of Konoha • Wind Striker",
      role: "NINJA • CHAKRA DASH",
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
      name: "LUFFY",
      title: "Straw Hat Captain • Rubber Brawler",
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
      ultName: "GEAR 4 BOUNCE-MAN",
      ultDesc: "Inflates muscles into gigantic Gear 4 form with Busoshoku Haki! Heavy knockback, massive shockwaves, and boosted HP.",
      skillName: "GUM-GUM ROCKET",
      skillDesc: "Stretches arms backward and slingshots himself at bullet speed with double impact damage.",
      skills: [SKILL_GUM_ROCKET],
    },
    ichigo: {
      id: "ichigo",
      name: "ICHIGO",
      title: "Substitute Shinigami • Bankai Master",
      role: "SHINIGAMI • GETSUGA TENSHO",
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
      this.weaponAngle = angle;
      // Start with partial cooldown so fighters clash first before casting skills
      this.skills = (config.skills || []).map((s) => ({
        ...s,
        _cd: s.cooldown ? s.cooldown * (0.55 + rng() * 0.3) : 0,
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

  const rosterGalleryView = document.getElementById("roster-gallery-view");
  const rosterDetailView = document.getElementById("roster-detail-view");
  const rosterAvatarGrid = document.getElementById("roster-avatar-grid");
  const btnRosterBack = document.getElementById("btn-roster-back");

  const detailCanvas = document.getElementById("detail-canvas");
  const detailName = document.getElementById("detail-name");
  const detailTitle = document.getElementById("detail-title");
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
  let hitStop = 0;
  let shakeTime = 0;
  let shakeIntensity = 0;
  let totalHits = 0;
  let elapsed = 0;
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
    }[ball.ult];
    if (fx) {
      entities.push(spawnShockRing(ball.x, ball.y, fx[1], 120, 0.55));
      entities.push(spawnBanner(fx[0], fx[1]));
      shakeTime = 0.3; shakeIntensity = 7; hitStop = 0.09;
    }

    if (ball.ult === "gear_4") {
      beginCast(ball, {
        kind: "inflate", duration: 0.75, color: COLORS.red,
        fire(b) {
          b.ultTimer = 7.5;
          b.radius = Math.round(b.baseRadius * 1.18);
          addEffect(b, "shield", 7.5, { reduction: 0.35 });
          entities.push(spawnShockRing(b.x, b.y, COLORS.white, 100, 0.4));
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
    if (rng() < CRIT_CHANCE) {
      return { amount: CRIT_DAMAGE, isCrit: true };
    }
    const [minDmg, maxDmg] = attacker.damageRange;
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

    if (isMatchEnd) {
      sessionStats.matches += 1;
      if (scores[0] > scores[1]) sessionStats.wins += 1;
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

    statsText.textContent = `${totalHits} HITS • ${elapsed.toFixed(1)}S`;
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
    b1.x -= nx * corr * (invM1 / invMassSum);
    b1.y -= ny * corr * (invM1 / invMassSum);
    b2.x += nx * corr * (invM2 / invMassSum);
    b2.y += ny * corr * (invM2 / invMassSum);

    // Relative velocity along normal
    const rvx = b2.vx - b1.vx;
    const rvy = b2.vy - b1.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    const impactSpeed = Math.max(0, -velAlongNormal);

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

      spawnDamageText(b1.x, b1.y - b1.radius * 0.5, dmgToB1, COLORS.white, hitB1.isCrit);
      spawnDamageText(b2.x, b2.y - b2.radius * 0.5, dmgToB2, COLORS.white, hitB2.isCrit);

      // Gum-Gum Rocket & Rasengan dash impact bonuses
      const checkDashImpact = (attacker, defender) => {
        if (attacker.rocketTimer > 0 && !attacker.rocketHit) {
          attacker.rocketHit = true;
          const gear4 = attacker.ultTimer > 0;
          const rocketDmg = applyDamage(defender, gear4 ? 26 : 16);
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
      };
      checkDashImpact(b1, b2);
      checkDashImpact(b2, b1);

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

    for (const ball of balls) {
      if (!ball.alive) continue;
      if (ball.flashTimer > 0) {
        ball.flashTimer = Math.max(0, ball.flashTimer - dt);
      }
      if (ball.squash > 0) {
        ball.squash = Math.max(0, ball.squash - dt * 5);
      }
      ball.weaponAngle += dt * 4.2;
      if (ball.ultTimer > 0) {
        ball.ultTimer = Math.max(0, ball.ultTimer - scaledDt);
        if (ball.ultTimer <= 0) {
          ball.radius = ball.baseRadius;
        }
      }
      if (ball.rocketTimer > 0) {
        ball.rocketTimer = Math.max(0, ball.rocketTimer - scaledDt);
      }
      if (ball.rasenganTimer > 0) {
        ball.rasenganTimer = Math.max(0, ball.rasenganTimer - scaledDt);
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

      for (const skill of ball.skills) {
        if (skill._cd > 0) skill._cd = Math.max(0, skill._cd - scaledDt);
      }
      runSkillHook(ball, "onTick", game, scaledDt);

      const speedFactor = ball.getSpeedMultiplier();
      if (speedFactor > 0) {
        ball.x += ball.vx * speedFactor * scaledDt;
        ball.y += ball.vy * speedFactor * scaledDt;
        if (ball.rocketTimer <= 0 && ball.rasenganTimer <= 0) {
          ball.normalizeSpeed();
        }
        handleWallCollisions(ball);
      }
    }

    if (balls[0].alive && balls[1].alive) {
      handleBallCollision(balls[0], balls[1]);
    }

    // Update extra entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const ent = entities[i];
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
    }
    c.restore();
  }

  function drawCostume(ball, r, c = ctx) {
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 3;
    c.lineJoin = "round";

    // Skin-toned face above the clothing line (Goku, Naruto, Luffy)
    if (ball.costume === "goku" || ball.costume === "naruto" || ball.costume === "luffy") {
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

    if (ball.costume === "goku") {
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
        // Steam clouds
        c.fillStyle = COLORS.white;
        for (const side of [-1, 1]) {
          c.beginPath();
          c.arc(side * r * 1.02, -r * 0.1, 7, 0, Math.PI * 2);
          c.fill();
          c.stroke();
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

      // Early Hollow Mask (covers left/upper face with red stripes when Ult active)
      if (ball.ultTimer > 0) {
        c.fillStyle = COLORS.white;
        c.beginPath();
        c.moveTo(-r * 1.05, -r * 0.65);
        c.lineTo(-r * 0.05, -r * 0.48);
        c.lineTo(-r * 0.2, r * 0.05);
        c.lineTo(-r * 0.08, r * 0.48);
        c.lineTo(-r * 1.05, r * 0.55);
        c.closePath();
        c.fill();
        c.stroke();

        c.strokeStyle = COLORS.red;
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(-r * 0.9, -r * 0.36);
        c.lineTo(-r * 0.3, -r * 0.22);
        c.moveTo(-r * 0.9, r * 0.14);
        c.lineTo(-r * 0.34, r * 0.24);
        c.stroke();
      }
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
    }

    // Expressive brows and Luffy's scar under the left eye
    const tilt = { luffy: -0.02, ichigo: 0.12 }[ball.costume];
    if (tilt !== undefined) {
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
    if (showExtras && ball.ult === "kaioken" && ball.ultTimer > 0) {
      drawKaiokenAura(ball, c);
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
    drawWeapon(ball, c);
    if (showExtras) drawHeldRasengan(ball, c);
    const r = ball.radius;
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
    c.restore();
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
      if (rosterGalleryView) rosterGalleryView.classList.remove("hidden");
      if (rosterDetailView) rosterDetailView.classList.add("hidden");
      updateCharDetailUI();
    } else if (targetId === "screen-profile") {
      updateProfileUI();
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

  if (btnRosterBack) {
    btnRosterBack.addEventListener("click", () => {
      sound.unlock();
      if (rosterGalleryView) rosterGalleryView.classList.remove("hidden");
      if (rosterDetailView) rosterDetailView.classList.add("hidden");
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
    } else if (e.key === "Escape" && recMode) {
      setRecMode(false);
    }
  });

  window.addEventListener("pointerdown", () => sound.unlock(), { once: true });
  window.addEventListener("resize", resizeCanvas);

  // Character Previews (Unified Center Card & Character Detail Card)
  function renderIdlePreviews(t) {
    const drawFighter = (canvasEl, cfg, facingRight, phaseOffset) => {
      if (!canvasEl || !cfg) return;
      const pCtx = canvasEl.getContext("2d");
      pCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const bob = Math.sin(t * 3.8 + phaseOffset) * 4;
      const previewBall = {
        x: canvasEl.width * 0.5,
        y: canvasEl.height * 0.54 + bob,
        radius: cfg.radius * 1.15,
        color: cfg.color,
        costume: cfg.costume,
        weapon: cfg.weapon,
        weaponAngle: t * 2.2 + phaseOffset,
        vx: facingRight ? 1 : -1,
        vy: 0,
        flashTimer: 0,
        squash: Math.max(0, Math.sin(t * 7.6 + phaseOffset) * 0.14),
        skills: cfg.skills,
        effects: [],
      };
      drawBall(previewBall, pCtx, false);
    };

    if (currentScreen === "screen-setup" && previewActive) {
      drawFighter(previewActive, BALL_CONFIGS[activeSlot], activeSlot === 0, 0);
    } else if (currentScreen === "screen-chars" && detailCanvas) {
      drawFighter(detailCanvas, CHARACTER_ROSTER[detailCharId], true, 0);
    }
  }

  function updateHomeMatchupUI() {
    if (homeP1Name) homeP1Name.textContent = BALL_CONFIGS[0].name;
    if (homeP2Name) homeP2Name.textContent = BALL_CONFIGS[1].name;
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

    if (detailName) detailName.textContent = cfg.name;
    if (detailTitle) detailTitle.textContent = cfg.title || "Anime Brawler";

    if (detailHpFill) detailHpFill.style.width = `${Math.min(100, Math.round((cfg.maxHp / 400) * 100))}%`;
    if (detailHpVal) detailHpVal.textContent = `${cfg.maxHp} HP`;

    if (detailSpdFill) detailSpdFill.style.width = `${Math.min(100, Math.round((cfg.speed / 420) * 100))}%`;
    if (detailSpdVal) detailSpdVal.textContent = `${cfg.speed}`;

    if (detailAtkFill) detailAtkFill.style.width = `${Math.min(100, Math.round((cfg.damage[1] / 20) * 100))}%`;
    if (detailAtkVal) detailAtkVal.textContent = `${cfg.damage[0]}-${cfg.damage[1]} DMG`;

    if (detailMassFill) detailMassFill.style.width = `${Math.min(100, Math.round((cfg.mass / 1.5) * 100))}%`;
    if (detailMassVal) detailMassVal.textContent = `${cfg.mass}`;

    const s1 = cfg.skills[0];
    if (detailSkillName) detailSkillName.textContent = cfg.skillName || (s1 ? s1.name.toUpperCase() : "SKILL");
    if (detailSkillCd) detailSkillCd.textContent = s1 ? `CD: ${s1.cooldown}S` : "PASSIVE";
    if (detailSkillDesc) detailSkillDesc.textContent = cfg.skillDesc || "Special character technique.";

    if (detailUltName) detailUltName.textContent = cfg.ultName || "ULTIMATE POWER";
    if (detailUltDesc) detailUltDesc.textContent = cfg.ultDesc || "5-Hit charged transformation with enhanced combat capabilities.";
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

    // 1. Unified Sandbox Character Selector Grid (with Mini Avatars!)
    if (unifiedCharGrid) {
      unifiedCharGrid.innerHTML = "";
      for (const char of entries) {
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
          BALL_CONFIGS[activeSlot] = CHARACTER_ROSTER[char.id];
          updateUnifiedSetupUI();
          syncFighterUI();
        });
        unifiedCharGrid.appendChild(btn);
        drawMiniAvatar(cvs, char);
      }
    }

    // 2. Fighters Gallery Avatar Grid (Scalable to 50+ Fighters!)
    if (rosterAvatarGrid) {
      rosterAvatarGrid.innerHTML = "";
      for (const char of entries) {
        const card = document.createElement("div");
        card.className = "avatar-card";
        card.dataset.id = char.id;

        const cvs = document.createElement("canvas");
        cvs.className = "avatar-canvas";
        cvs.width = 54;
        cvs.height = 54;

        const nameSpan = document.createElement("span");
        nameSpan.className = "avatar-name";
        nameSpan.textContent = char.name;

        const tagSpan = document.createElement("span");
        tagSpan.className = "avatar-tag";
        tagSpan.textContent = (char.role ? char.role.split("•")[0].trim() : "FIGHTER");

        card.appendChild(cvs);
        card.appendChild(nameSpan);
        card.appendChild(tagSpan);

        card.addEventListener("click", () => {
          sound.unlock();
          detailCharId = char.id;
          updateCharDetailUI();
          if (rosterGalleryView) rosterGalleryView.classList.add("hidden");
          if (rosterDetailView) rosterDetailView.classList.remove("hidden");
        });

        rosterAvatarGrid.appendChild(card);
        drawMiniAvatar(cvs, char);
      }
    }

    updateUnifiedSetupUI();
    updateCharDetailUI();
    updateProfileUI();
  }

  // Boot
  if (document.fonts && document.fonts.load) document.fonts.load(`24px ${FONT}`).catch(() => {});
  setupUnifiedSelectors();
  resizeCanvas();
  initMatch();
  switchScreen("screen-play");
  requestAnimationFrame(loop);
})();

