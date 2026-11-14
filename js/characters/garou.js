// ============================================================
//  GAROU (HERO HUNTER / COSMIC FEAR MONSTER)
//  One-Punch Man — Martial Artist / Twin-Stream Fist & Water Stream Counter
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS, WORLD_SIZE } = BF;
  const rt = BF.rt;

  function spawnTwinStreamProjectile({ owner, target, x, y, angle, speed, damage, isCosmic }) {
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
      radius: 17,
      damage,
      isCosmic,
      dead: false,
      update(dt, g) {
        const infFactor = rt.getInfinitySlowFactor ? rt.getInfinitySlowFactor(this.target, this.x, this.y) : 1;
        this.x += this.vx * infFactor * dt;
        this.y += this.vy * infFactor * dt;

        if (this.x < -30 || this.x > WORLD_SIZE + 30 || this.y < -30 || this.y > WORLD_SIZE + 30) {
          this.dead = true;
          return;
        }
        if (!this.target || !this.target.alive) return;

        const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        if (dist <= this.target.radius + this.radius) {
          this.dead = true;
          const dealt = g.applyDamage(this.target, this.damage);
          this.target.flashTimer = 0.14;
          this.target.squash = 0.86;
          this.target.vx += Math.cos(this.angle) * 210;
          this.target.vy += Math.sin(this.angle) * 210;
          if (!this.isCosmic) {
            g.chargeUlt(this.owner);
          }
          g.entities.push(rt.spawnShockRing(this.x, this.y, this.isCosmic ? "#c084fc" : "#38bdf8", 78, 0.26));
          g.spawnSparks(this.x, this.y, this.isCosmic ? "#c084fc" : "#38bdf8", "#f43f5e");
          g.spawnDamageText(
            this.target.x,
            this.target.y - this.target.radius - 14,
            dealt,
            this.isCosmic ? "#c084fc" : "#38bdf8",
            this.isCosmic,
            this.isCosmic ? "NUCLEAR FISSION FIST!" : "CROSS FANG FIST!"
          );
          g.sound.playCritHit();
          rt.setHitStop(0.05);
          rt.addShake(0.15, 4.2);
        }
      },
      render(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        // Outer Cyan Water Stream arc
        c.strokeStyle = this.isCosmic ? "#c084fc" : "#38bdf8";
        c.lineWidth = 4.5;
        c.shadowColor = this.isCosmic ? "#a855f7" : "#0284c7";
        c.shadowBlur = 12;
        c.beginPath();
        c.arc(0, 0, this.radius, -1.15, 1.15);
        c.stroke();

        // Inner Crimson Whirlwind Iron razor arc
        c.strokeStyle = this.isCosmic ? "#fde047" : "#f43f5e";
        c.lineWidth = 3.5;
        c.shadowColor = this.isCosmic ? "#facc15" : "#e11d48";
        c.shadowBlur = 10;
        c.beginPath();
        c.arc(-4, 0, this.radius * 0.76, -1.0, 1.0);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Skill 1: Cross Fang Dragon Slayer Fist (Primary +1 Ult Charge) ----
  const SKILL_WHIRLWIND_FIST = {
    name: "Cross Fang Fist",
    cooldown: 2.3,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 310) return false;

      const isCosmic = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: isCosmic ? "#c084fc" : "#38bdf8",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const mx = b.x + Math.cos(aim) * (b.radius + 14);
          const my = b.y + Math.sin(aim) * (b.radius + 14);

          b.vx += Math.cos(aim) * 165;
          b.vy += Math.sin(aim) * 165;

          const dmg = isCosmic ? Math.round(18 + rt.rng() * 4) : Math.round(15 + rt.rng() * 4);
          gg.entities.push(
            spawnTwinStreamProjectile({
              owner: b,
              target: t,
              x: mx,
              y: my,
              angle: aim,
              speed: 640,
              damage: dmg,
              isCosmic,
            })
          );
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Water Stream Rock Smashing Counter (Flowing Deflection — No Ult Charge) ----
  const SKILL_WATER_STREAM_COUNTER = {
    name: "Water Stream Counter",
    cooldown: 4.4,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 235) return false;

      // Flowing Water Stance: 30% damage reduction shield for 1.1s
      g.addEffect(ball, "shield", 1.1, { reduction: 0.3 });
      g.entities.push(rt.spawnShockRing(ball.x, ball.y, "#38bdf8", 74, 0.28));

      if (dist <= ball.radius + target.radius + 115) {
        const dx = target.x - ball.x;
        const dy = target.y - ball.y;
        const d = Math.hypot(dx, dy) || 1;
        const nx = dx / d;
        const ny = dy / d;

        const rawDmg = Math.round(10 + rt.rng() * 4);
        const dealt = g.applyDamage(target, rawDmg);
        target.flashTimer = 0.13;
        target.squash = 0.88;
        target.vx = nx * 320;
        target.vy = ny * 320;
        g.entities.push(rt.spawnShockRing((ball.x + target.x) * 0.5, (ball.y + target.y) * 0.5, "#38bdf8", 68, 0.25));
        g.spawnSparks(target.x, target.y, "#38bdf8", "#ffffff");
        g.spawnDamageText(target.x, target.y - target.radius - 14, dealt, "#38bdf8", false, "WATER STREAM COUNTER!");
        g.sound.playBallHit();
      } else {
        g.spawnDamageText(ball.x, ball.y - ball.radius - 12, 0, "#38bdf8", false, "WATER STREAM GUARD!");
      }
      return true;
    },
  };

  // ---- Weapon Drawer: Twin-Stream Martial Arts Aura ----
  BF.WEAPON_DRAWERS.martial_aura = (ball, c) => {
    const isCosmic = ball.ultTimer > 0;
    c.save();

    // Flowing Water Stream Cyan Ribbon
    c.strokeStyle = isCosmic ? "#c084fc" : "#38bdf8";
    c.lineWidth = 4;
    c.lineCap = "round";
    c.shadowColor = isCosmic ? "#a855f7" : "#0284c7";
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(-12, 10);
    c.quadraticCurveTo(-4, -14, 10, -24);
    c.stroke();

    // Whirlwind Iron Cutting Crimson Ribbon
    c.strokeStyle = isCosmic ? "#fde047" : "#f43f5e";
    c.lineWidth = 3.5;
    c.shadowColor = isCosmic ? "#facc15" : "#e11d48";
    c.beginPath();
    c.moveTo(10, 10);
    c.quadraticCurveTo(4, -12, -8, -22);
    c.stroke();

    // Martial arts glowing fist core
    c.fillStyle = isCosmic ? "#f3e8ff" : "#e0f2fe";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -6, 6.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Garou (Hero Hunter / Cosmic Fear Mode in Ult) ----
  BF.COSTUME_DRAWERS.garou = (ball, r, c) => {
    const isCosmic = ball.ultTimer > 0;
    const t = (rt.elapsed || 0) * 3;

    if (isCosmic) {
      // Cosmic Fear Mode: Full deep-space galaxy face & body shell with twinkling stars
      c.save();
      const spaceGrad = c.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
      spaceGrad.addColorStop(0, "#3b0764");
      spaceGrad.addColorStop(0.55, "#0f172a");
      spaceGrad.addColorStop(1, "#020617");
      c.fillStyle = spaceGrad;
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.fill();

      const stars = [
        [-0.45, -0.35, 1.8, "#f8fafc"],
        [0.38, -0.42, 1.5, "#38bdf8"],
        [-0.22, 0.28, 2.0, "#c084fc"],
        [0.48, 0.18, 1.6, "#fde047"],
        [0.12, -0.12, 2.2, "#f472b6"],
        [-0.52, 0.1, 1.4, "#ffffff"],
        [0.05, 0.48, 1.7, "#38bdf8"],
      ];
      for (let i = 0; i < stars.length; i++) {
        const [sx, sy, sr, col] = stars[i];
        c.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + i * 1.7);
        c.fillStyle = col;
        c.beginPath();
        c.arc(sx * r, sy * r, sr, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      // Swirling galaxy spiral on Cosmic Visor
      c.strokeStyle = "rgba(192,132,252,0.75)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(0, -r * 0.05, r * 0.34, t, t + Math.PI * 1.35);
      c.stroke();
      c.restore();
    } else {
      rt.drawSkinFace(ball, r, c);

      // Fitted black martial arts top & crimson sash
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      c.fillStyle = "#09090b";
      c.fillRect(-r, r * 0.36, r * 2, r * 0.68);

      c.strokeStyle = "#e11d48";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-r * 0.75, r * 0.48);
      c.quadraticCurveTo(0, r * 0.62, r * 0.75, r * 0.48);
      c.stroke();
      c.restore();
    }

    // Iconic Twin-Horn Swept V-Wing Hair (Silver-White with blood-crimson tips, or Cosmic Violet in Ult)
    c.save();
    const hairGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.38);
    if (isCosmic) {
      hairGrad.addColorStop(0, "#1e1b4b");
      hairGrad.addColorStop(0.6, "#7e22ce");
      hairGrad.addColorStop(1, "#38bdf8");
    } else {
      hairGrad.addColorStop(0, "#f1f5f9");
      hairGrad.addColorStop(0.65, "#cbd5e1");
      hairGrad.addColorStop(1, "#e11d48");
    }

    c.fillStyle = hairGrad;
    c.strokeStyle = isCosmic ? "#c084fc" : COLORS.ink;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(0, -r * 0.38);
    c.lineTo(-r * 0.32, -r * 0.82);
    c.lineTo(-r * 0.98, -r * 1.36);
    c.lineTo(-r * 0.78, -r * 0.74);
    c.lineTo(-r * 1.16, -r * 0.82);
    c.lineTo(-r * 0.84, -r * 0.3);
    c.lineTo(-r * 0.38, -r * 0.54);
    c.lineTo(0, -r * 0.34);
    c.lineTo(r * 0.38, -r * 0.54);
    c.lineTo(r * 0.84, -r * 0.3);
    c.lineTo(r * 1.16, -r * 0.82);
    c.lineTo(r * 0.78, -r * 0.74);
    c.lineTo(r * 0.98, -r * 1.36);
    c.lineTo(r * 0.32, -r * 0.82);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  };

  BF.CHARACTER_ROSTER.garou = {
    id: "garou",
    name: "HERO HUNTER",
    shortName: "HUNTER",
    title: "Fist of Flowing Water • Cosmic Fear Monster",
    role: "MARTIAL ARTIST • COSMIC COUNTER",
    color: "#e11d48",
    radius: 28,
    speed: 372,
    maxHp: 575,
    damage: [6, 9],
    mass: 1.02,
    costume: "garou",
    weapon: "martial_aura",
    ult: "cosmic_fear",
    ultName: "COSMIC FEAR: GAMMA RAY BURST",
    ultDesc: "Awakens Cosmic Fear Mode for 8s! Unleashes a high-velocity Gamma Ray Burst blast and grants +25% Speed, 20% Shield, and Nuclear Fission punches.",
    skillName: "CROSS FANG & WATER STREAM",
    skillDesc: "Fires a twin-stream martial arts shockwave (Water Stream + Whirlwind Iron) and deflects close-range attacks with Water Stream Counter!",
    skills: [SKILL_WHIRLWIND_FIST, SKILL_WATER_STREAM_COUNTER],
  };
})();
