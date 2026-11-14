// ============================================================
//  KILLUA ZOLDYCK (LIGHTNING ASSASSIN)
//  Hunter x Hunter — Assassin / Alloy Yo-Yo, Narukami & Godspeed
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnLightningBoltVisual(x1, y1, x2, y2, color = "#38bdf8", life = 0.26) {
    const pts = [{ x: x1, y: y1 }];
    const steps = 7;
    for (let i = 1; i < steps; i++) {
      const f = i / steps;
      const jitter = (Math.random() - 0.5) * 32;
      pts.push({
        x: x1 + (x2 - x1) * f + jitter,
        y: y1 + (y2 - y1) * f + (Math.random() - 0.5) * 12,
      });
    }
    pts.push({ x: x2, y: y2 });

    return {
      life,
      maxLife: life,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
      },
      render(c) {
        const a = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = a;
        c.lineCap = "round";
        c.lineJoin = "round";

        c.strokeStyle = color;
        c.lineWidth = 9 * a;
        c.shadowColor = color;
        c.shadowBlur = 14;
        c.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
        c.stroke();

        c.strokeStyle = "#ffffff";
        c.lineWidth = 3.2 * a;
        c.beginPath();
        pts.forEach((p, idx) => (idx === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
        c.stroke();
        c.restore();
      },
    };
  }

  function spawnRhythmEchoClone(owner, offsetAngle) {
    const ang = Math.atan2(owner.vy, owner.vx) + offsetAngle;
    const spd = Math.max(owner.baseSpeed * 1.15, 390);
    return {
      owner,
      x: owner.x + Math.cos(ang) * 18,
      y: owner.y + Math.sin(ang) * 18,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      radius: owner.radius * 0.9,
      life: 2.0,
      maxLife: 2.0,
      dead: false,
      update(dt, g) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive) {
          this.dead = true;
          return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < this.radius) { this.x = this.radius; this.vx = Math.abs(this.vx); }
        if (this.x > WORLD_SIZE - this.radius) { this.x = WORLD_SIZE - this.radius; this.vx = -Math.abs(this.vx); }
        if (this.y < this.radius) { this.y = this.radius; this.vy = Math.abs(this.vy); }
        if (this.y > WORLD_SIZE - this.radius) { this.y = WORLD_SIZE - this.radius; this.vy = -Math.abs(this.vy); }

        const target = g.balls.find((b) => b !== this.owner && b.alive);
        if (!target) return;
        const dist = Math.hypot(target.x - this.x, target.y - this.y);
        if (dist <= target.radius + this.radius) {
          this.dead = true;
          const dmg = Math.round(9 + rt.rng() * 3);
          const dealt = g.applyDamage(target, dmg);
          target.flashTimer = 0.12;
          target.squash = 0.78;
          g.addEffect(target, "stun", 0.24);
          g.entities.push(rt.spawnShockRing(this.x, this.y, "#38bdf8", 68, 0.26));
          g.spawnSparks(this.x, this.y, "#38bdf8", "#ffffff");
          g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#38bdf8", false, "ECHO ZAP!");
          g.sound.playBallHit();
        }
      },
      render(c) {
        const a = Math.min(0.62, (this.life / this.maxLife) * 0.75);
        c.save();
        c.globalAlpha = a;
        c.translate(this.x, this.y);
        c.fillStyle = "#0ea5e9";
        c.strokeStyle = "#e0f2fe";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Spiky silver silhouette hair on afterimage
        c.fillStyle = "#e2e8f0";
        c.beginPath();
        c.moveTo(-this.radius * 0.85, -this.radius * 0.35);
        c.lineTo(-this.radius * 0.55, -this.radius * 1.15);
        c.lineTo(0, -this.radius * 1.25);
        c.lineTo(this.radius * 0.55, -this.radius * 1.15);
        c.lineTo(this.radius * 0.85, -this.radius * 0.35);
        c.closePath();
        c.fill();
        c.restore();
      },
    };
  }

  // ---- Skill 1: Narukami Thunderbolt (Primary +1 Ult Charge) ----
  const SKILL_THUNDERBOLT = {
    name: "Narukami Bolt",
    cooldown: 2.5,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 340) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "lightning",
        duration: 0.22,
        color: "#38bdf8",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const rawDmg = inUlt ? Math.round(16 + rt.rng() * 4) : Math.round(14 + rt.rng() * 4);
          const dealt = gg.applyDamage(t, rawDmg);
          t.flashTimer = 0.14;
          t.squash = 0.85;
          gg.addEffect(t, "stun", 0.32);

          if (!inUlt) {
            gg.chargeUlt(b);
          }

          gg.entities.push(spawnLightningBoltVisual(t.x + (rt.rng() - 0.5) * 28, Math.max(18, t.y - 230), t.x, t.y, "#38bdf8", 0.28));
          gg.entities.push(spawnLightningBoltVisual(b.x, b.y, t.x, t.y, "#bae6fd", 0.22));
          gg.entities.push(rt.spawnShockRing(t.x, t.y, "#38bdf8", 88, 0.32));
          gg.spawnSparks(t.x, t.y, "#38bdf8", "#ffffff");
          gg.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#38bdf8", inUlt, inUlt ? "GODSPEED NARUKAMI!" : "NARUKAMI!");
          gg.sound.playCritHit();
          rt.setHitStop(0.05);
          rt.addShake(0.16, 4.5);
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Rhythm Echo Clones + Whirlwind Reflex (No Ult Charge) ----
  const SKILL_RHYTHM_ECHO = {
    name: "Rhythm Echo",
    cooldown: 4.6,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      // Spawn 2 assassin afterimage clones that bounce and zap on contact
      g.entities.push(spawnRhythmEchoClone(ball, -0.42));
      g.entities.push(spawnRhythmEchoClone(ball, 0.42));
      g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#bae6fd", 72, 0.26));
      g.spawnDamageText(ball.x, ball.y - ball.radius - 12, 0, "#bae6fd", false, "RHYTHM ECHO!");
      return true;
    },
    onDamaged(ball, amount, g) {
      if (!ball.alive || !(ball.ultTimer > 0) || amount <= 0) return false;
      const now = rt.elapsed || 0;
      if (now - (ball._whirlwindLast || -99) < 1.45) return false;
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;

      ball._whirlwindLast = now;
      const dealt = g.applyDamage(target, 9);
      g.entities.push(spawnLightningBoltVisual(ball.x, ball.y, target.x, target.y, "#38bdf8", 0.22));
      g.spawnSparks(target.x, target.y, "#38bdf8", "#ffffff");
      g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#38bdf8", false, "WHIRLWIND REFLEX!");
      return false;
    },
  };

      // ---- Shared polygon helper (points in radius units) ----
  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: 50kg Alloy Yo-Yo (steel disc + taut wire + Star of David Zoldyck emblem) ----
  BF.WEAPON_DRAWERS.alloy_yoyo = (ball, c) => {
    const hot = ball.ultTimer > 0;
    c.save();
    // High-tension metallic wire back to Killua's hand
    c.strokeStyle = hot ? "#7dd3fc" : "#cbd5e1";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-4, 18);
    c.lineTo(0, -14);
    c.stroke();

    // Heavy 50kg Alloy Yo-Yo disc extended out past hair spikes
    c.fillStyle = "#475569";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.arc(0, -16, 13.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const g = c.createLinearGradient(-10, -26, 10, -6);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.5, "#94a3b8");
    g.addColorStop(1, "#e2e8f0");
    c.fillStyle = g;
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, -16, 9.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Iconic 6-pointed star emblem on Killua's Yo-Yo
    c.strokeStyle = hot ? "#0284c7" : "#334155";
    c.lineWidth = 1.5;
    for (let s = 0; s < 2; s++) {
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = s * Math.PI + (i * Math.PI * 2) / 3 - Math.PI * 0.5;
        const px = Math.cos(a) * 6.5;
        const py = -16 + Math.sin(a) * 6.5;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.stroke();
    }

    c.fillStyle = hot ? "#38bdf8" : "#1e293b";
    c.beginPath();
    c.arc(0, -16, 2.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };

  // ---- Costume Drawer: Killua Zoldyck (fluffy silver hair, navy-purple shirt, Godspeed lightning) ----
  BF.COSTUME_DRAWERS.killua = (ball, r, c) => {
    const isGodspeed = ball.ultTimer > 0;
    const t = performance.now() * 0.001;

    // Godspeed: crackling blue-white electric aura around the whole body
    if (isGodspeed) {
      c.save();
      c.fillStyle = "rgba(125, 211, 252, 0.22)";
      c.beginPath();
      c.arc(0, 0, r * 1.38, 0, Math.PI * 2);
      c.fill();
      c.lineCap = "round";
      c.lineJoin = "round";
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + Math.floor(t * 12) * 0.9;
        c.strokeStyle = i % 2 ? "#e0f2fe" : "#38bdf8";
        c.lineWidth = i % 2 ? 1.8 : 2.6;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02);
        c.lineTo(Math.cos(a + 0.12) * r * 1.2, Math.sin(a + 0.12) * r * 1.2);
        c.lineTo(Math.cos(a - 0.06) * r * 1.3, Math.sin(a - 0.06) * r * 1.3);
        c.lineTo(Math.cos(a + 0.1) * r * 1.46, Math.sin(a + 0.1) * r * 1.46);
        c.stroke();
      }
      c.restore();
    }

    rt.drawSkinFace(ball, r, c);

    // Outfit: navy-purple turtleneck under white V-trimmed short-sleeve top
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = "#312e81";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-r, r * 0.52);
    c.quadraticCurveTo(0, r * 0.4, r, r * 0.52);
    c.lineTo(r, r * 1.1);
    c.lineTo(-r, r * 1.1);
    c.closePath();
    c.fill();
    c.stroke();

    // White outer tunic shoulders
    c.fillStyle = "#f8fafc";
    c.beginPath();
    c.moveTo(-r, r * 0.52);
    c.lineTo(-r * 0.34, r * 0.48);
    c.lineTo(-r * 0.22, r * 1.08);
    c.lineTo(-r, r * 1.08);
    c.closePath();
    c.moveTo(r, r * 0.52);
    c.lineTo(r * 0.34, r * 0.48);
    c.lineTo(r * 0.22, r * 1.08);
    c.lineTo(r, r * 1.08);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();

    // Fluffy, untamed silver-white hair (wide volume + spiky bangs)
    const hair = [
      [-0.95, 0.06], [-1.2, -0.22], [-1.0, -0.36], [-1.3, -0.6], [-0.98, -0.7], [-1.14, -1.02],
      [-0.72, -0.94], [-0.68, -1.32], [-0.38, -1.04], [-0.12, -1.44], [0.1, -1.08], [0.4, -1.38],
      [0.52, -1.0], [0.88, -1.2], [0.82, -0.84], [1.24, -0.82], [0.98, -0.56], [1.28, -0.3],
      [0.98, -0.2], [1.0, 0.06],
      // inner side lock + bangs (right -> left)
      [0.8, -0.1], [0.7, -0.4], [0.56, -0.28], [0.44, -0.48], [0.22, -0.32], [0.1, -0.5],
      [-0.04, -0.18], [-0.14, -0.48], [-0.26, -0.32], [-0.42, -0.5], [-0.56, -0.3], [-0.68, -0.44],
      [-0.8, -0.1],
    ];
    c.save();
    c.lineJoin = "round";
    const hg = c.createLinearGradient(0, -r * 1.4, 0, -r * 0.1);
    hg.addColorStop(0, "#ffffff");
    hg.addColorStop(1, isGodspeed ? "#bae6fd" : "#d5dbe6");
    c.fillStyle = hg;
    c.strokeStyle = isGodspeed ? "#0284c7" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();
    // Soft grey strand shading
    c.strokeStyle = isGodspeed ? "rgba(14, 165, 233, 0.55)" : "rgba(100, 116, 139, 0.55)";
    c.lineWidth = 1.6;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.62, -1.0, -0.42, -0.6], [-0.12, -1.2, -0.06, -0.62], [0.38, -1.12, 0.26, -0.66],
      [0.76, -0.84, 0.58, -0.56], [-0.92, -0.6, -0.74, -0.38], [0.94, -0.4, 0.8, -0.24],
    ]) {
      c.moveTo(x0 * r, y0 * r);
      c.lineTo(x1 * r, y1 * r);
    }
    c.stroke();
    c.restore();
  };

BF.CHARACTER_ROSTER.killua = {
    id: "killua",
    name: "LIGHTNING ASSASSIN",
    shortName: "ASSASSIN",
    title: "Zoldyck Prodigy • Master of Godspeed",
    role: "ASSASSIN • GODSPEED LIGHTNING",
    color: "#38bdf8",
    radius: 28,
    speed: 382,
    maxHp: 545,
    damage: [5, 8],
    mass: 0.96,
    costume: "killua",
    weapon: "alloy_yoyo",
    ult: "godspeed",
    ultName: "GODSPEED (KANMURU)",
    ultDesc: "Surrounds himself in high-voltage aura for 8s! Grants +35% Speed, 20% Shield, empowers Narukami Bolt, and auto-counters attackers with Whirlwind Reflex.",
    skillName: "NARUKAMI & RHYTHM ECHO",
    skillDesc: "Drops an overhead Narukami thunderbolt that micro-stuns the enemy, while weaving Rhythm Echo afterimage clones across the arena!",
    skills: [SKILL_THUNDERBOLT, SKILL_RHYTHM_ECHO],
  };
})();
