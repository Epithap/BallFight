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

      // ---- Shared polygon helper (points in radius units) ----
  function hairPoly(c, r, pts) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * r, y * r) : c.lineTo(x * r, y * r)));
    c.closePath();
  }

  // ---- Weapon Drawer: Twin-Stream Martial Arts Aura (Water Stream + Whirlwind Iron) ----
  BF.WEAPON_DRAWERS.martial_aura = (ball, c) => {
    const isCosmic = ball.ultTimer > 0;
    c.save();
    c.lineCap = "round";

    // Flowing Water Stream Rock Smashing Fist (Cyan Dragon Ribbon)
    c.strokeStyle = isCosmic ? "#c084fc" : "#38bdf8";
    c.lineWidth = 4.2;
    c.shadowColor = isCosmic ? "#a855f7" : "#0284c7";
    c.shadowBlur = 12;
    c.beginPath();
    c.moveTo(-11, 12);
    c.bezierCurveTo(-16, -2, 6, -12, -3, -28);
    c.stroke();

    // Whirlwind Iron Cutting Fist (Crimson Razor Ribbon)
    c.strokeStyle = isCosmic ? "#fde047" : "#f43f5e";
    c.lineWidth = 3.6;
    c.shadowColor = isCosmic ? "#facc15" : "#e11d48";
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(11, 12);
    c.bezierCurveTo(16, -2, -6, -12, 3, -28);
    c.stroke();
    c.shadowBlur = 0;

    // Bandaged Martial Artist Fist at core
    c.fillStyle = isCosmic ? "#1e1b4b" : "#fde68a";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.2;
    c.beginPath();
    c.roundRect(-6.5, -11, 13, 11, 3.5);
    c.fill();
    c.stroke();

    // White wrist wraps / cosmic veins
    c.strokeStyle = isCosmic ? "#38bdf8" : "#f8fafc";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-6, -6); c.lineTo(6, -4);
    c.moveTo(-6, -2); c.lineTo(6, -8);
    c.stroke();
    c.restore();
  };

  // ---- Costume Drawer: Garou (Hero Hunter Base & Cosmic Fear Monster Ult) ----
  BF.COSTUME_DRAWERS.garou = (ball, r, c) => {
    const isCosmic = ball.ultTimer > 0;
    const t = performance.now() * 0.003;

    if (isCosmic) {
      // Cosmic Fear Mode: Swirling cosmic orbital rings outside body
      c.save();
      c.strokeStyle = "rgba(192, 132, 252, 0.5)";
      c.lineWidth = 2.2;
      c.beginPath();
      c.ellipse(0, 0, r * 1.38, r * 0.52, t * 0.8, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = "rgba(56, 189, 248, 0.45)";
      c.beginPath();
      c.ellipse(0, 0, r * 1.38, r * 0.52, -t * 0.8, 0, Math.PI * 2);
      c.stroke();
      c.restore();

      // Full Cosmic Fear Monster Shell (Pitch-black void skin + nebula + starfield + galaxy spiral face)
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      const spaceGrad = c.createRadialGradient(-r * 0.2, -r * 0.15, r * 0.08, 0, 0, r);
      spaceGrad.addColorStop(0, "#2e1065");
      spaceGrad.addColorStop(0.5, "#090514");
      spaceGrad.addColorStop(1, "#020617");
      c.fillStyle = spaceGrad;
      c.fillRect(-r, -r, r * 2, r * 2);

      // Nebula clouds inside Cosmic Garou's visor & chest
      const neb = c.createRadialGradient(r * 0.18, -r * 0.08, 2, r * 0.18, -r * 0.08, r * 0.62);
      neb.addColorStop(0, "rgba(217, 70, 239, 0.55)");
      neb.addColorStop(0.5, "rgba(56, 189, 248, 0.28)");
      neb.addColorStop(1, "rgba(15, 23, 42, 0)");
      c.fillStyle = neb;
      c.beginPath();
      c.arc(r * 0.18, -r * 0.08, r * 0.62, 0, Math.PI * 2);
      c.fill();

      // Iconic Spiral Galaxy on Cosmic Fear Garou's face
      c.save();
      c.translate(r * 0.12, -r * 0.06);
      c.rotate(t * 1.2);
      c.strokeStyle = "#f0abfc";
      c.lineWidth = 2.2;
      for (let arm = 0; arm < 2; arm++) {
        c.beginPath();
        for (let k = 0; k < 22; k++) {
          const ang = arm * Math.PI + k * 0.22;
          const rad = k * r * 0.016;
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad * 0.72;
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.stroke();
      }
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(0, 0, r * 0.06, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // Glowing Cosmic Constellation lines & stars across face and torso
      c.strokeStyle = "rgba(125, 211, 252, 0.45)";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-r * 0.52, -r * 0.18);
      c.lineTo(-r * 0.24, -r * 0.28);
      c.lineTo(-r * 0.08, -r * 0.08);
      c.lineTo(-r * 0.38, r * 0.18);
      c.stroke();

      const stars = [
        [-0.52, -0.18, 2.2, "#ffffff"],
        [-0.24, -0.28, 1.8, "#38bdf8"],
        [-0.08, -0.08, 1.6, "#f0abfc"],
        [-0.38, 0.18, 2.1, "#fde047"],
        [0.46, 0.22, 1.9, "#38bdf8"],
        [-0.12, 0.48, 2.0, "#ffffff"],
        [0.24, 0.52, 1.5, "#c084fc"],
        [-0.58, 0.42, 1.5, "#38bdf8"],
        [0.52, -0.22, 1.8, "#ffffff"],
      ];
      for (let i = 0; i < stars.length; i++) {
        const [sx, sy, sr, col] = stars[i];
        c.fillStyle = col;
        c.beginPath();
        c.arc(sx * r, sy * r, sr, 0, Math.PI * 2);
        c.fill();
      }

      // Cosmic Monsterized Armor Collar & Chest V-Seams
      c.strokeStyle = "#a855f7";
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-r * 0.78, r * 0.42);
      c.lineTo(0, r * 0.72);
      c.lineTo(r * 0.78, r * 0.42);
      c.stroke();
      c.restore();
    } else {
      rt.drawSkinFace(ball, r, c);

      // Base Hero Hunter Outfit: Tight black martial-arts shirt + white bandages + flowing red monster sash
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
      c.clip();

      // Tight black V-neck top
      c.fillStyle = "#111318";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-r, r * 0.44);
      c.lineTo(-r * 0.24, r * 0.42);
      c.lineTo(0, r * 0.58);
      c.lineTo(r * 0.24, r * 0.42);
      c.lineTo(r, r * 0.44);
      c.lineTo(r, r * 1.1);
      c.lineTo(-r, r * 1.1);
      c.closePath();
      c.fill();
      c.stroke();

      // Muscular chest seam lines on tight black top
      c.strokeStyle = "#27272a";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(0, r * 0.58); c.lineTo(0, r * 0.96);
      c.moveTo(-r * 0.48, r * 0.56); c.quadraticCurveTo(-r * 0.22, r * 0.7, -r * 0.04, r * 0.66);
      c.moveTo(r * 0.48, r * 0.56); c.quadraticCurveTo(r * 0.22, r * 0.7, r * 0.04, r * 0.66);
      c.stroke();

      // White battle bandages wrapped across neck/collarbone
      c.fillStyle = "#f1f5f9";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-r * 0.44, r * 0.45);
      c.lineTo(r * 0.44, r * 0.45);
      c.lineTo(r * 0.34, r * 0.56);
      c.lineTo(-r * 0.34, r * 0.56);
      c.closePath();
      c.fill();
      c.stroke();

      // Martial belt & crimson sash
      c.fillStyle = "#be123c";
      c.beginPath();
      c.moveTo(-r * 0.85, r * 0.82);
      c.quadraticCurveTo(0, r * 0.94, r * 0.85, r * 0.82);
      c.lineTo(r * 0.85, r * 1.02);
      c.quadraticCurveTo(0, r * 1.08, -r * 0.85, r * 1.02);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    // Garou's Iconic Twin Horned V-Spikes Hair (Center V-cleft sits at y = -1.01 so NO bald scalp ever shows above it!)
    const hair = [
      [-0.95, -0.06], [-1.2, -0.34], [-0.95, -0.48], [-1.36, -0.82], [-0.98, -0.88],
      [-1.24, -1.52], [-0.6, -1.16], [-0.42, -1.28],
      // Deep V-cleft right at the crown of the skull (-1.01)
      [-0.18, -1.08], [0, -1.01], [0.18, -1.08],
      [0.42, -1.28], [0.6, -1.16], [1.24, -1.52], [0.98, -0.88], [1.36, -0.82],
      [0.95, -0.48], [1.2, -0.34], [0.95, -0.06],
      // Sharp widow's peak hairline along forehead
      [0.74, -0.26], [0.46, -0.46], [0.18, -0.38], [0, -0.22],
      [-0.18, -0.38], [-0.46, -0.46], [-0.74, -0.26],
    ];

    c.save();
    c.lineJoin = "round";
    const hGrad = c.createLinearGradient(0, -r * 0.2, 0, -r * 1.52);
    if (isCosmic) {
      hGrad.addColorStop(0, "#090514");
      hGrad.addColorStop(0.55, "#3b0764");
      hGrad.addColorStop(1, "#a855f7");
    } else {
      hGrad.addColorStop(0, "#f8fafc");
      hGrad.addColorStop(0.62, "#cbd5e1");
      hGrad.addColorStop(1, "#be123c");
    }
    c.fillStyle = hGrad;
    c.strokeStyle = isCosmic ? "#c084fc" : COLORS.ink;
    c.lineWidth = 2.8;
    hairPoly(c, r, hair);
    c.fill();
    c.stroke();

    // Sharp anime hair ridge lines sweeping up into both wolf horns
    c.strokeStyle = isCosmic ? "rgba(56, 189, 248, 0.65)" : "rgba(100, 116, 139, 0.65)";
    c.lineWidth = 1.7;
    c.lineCap = "round";
    c.beginPath();
    for (const [x0, y0, x1, y1] of [
      [-0.12, -0.42, -0.68, -1.04], [-0.38, -0.56, -1.04, -1.28], [-0.62, -0.44, -1.1, -0.74],
      [0.12, -0.42, 0.68, -1.04], [0.38, -0.56, 1.04, -1.28], [0.62, -0.44, 1.1, -0.74],
    ]) {
      c.moveTo(x0 * r, y0 * r);
      c.lineTo(x1 * r, y1 * r);
    }
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
