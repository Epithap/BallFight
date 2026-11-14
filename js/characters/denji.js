// ============================================================
//  DENJI (CHAINSAW DEVIL)
//  Chainsaw Man — Berserker / Blood Lifesteal & Chain Grapple
// ============================================================

(() => {
  "use strict";

  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const rt = BF.rt;

  function spawnChainGrappleVisual(owner, target) {
    return {
      owner,
      target,
      life: 0.26,
      maxLife: 0.26,
      dead: false,
      update(dt) {
        this.life -= dt;
        if (this.life <= 0 || !this.owner.alive || !this.target.alive) {
          this.dead = true;
        }
      },
      render(c) {
        const a = Math.max(0, this.life / this.maxLife);
        c.save();
        c.globalAlpha = a;
        c.strokeStyle = "#cbd5e1";
        c.lineWidth = 5;
        c.setLineDash([8, 5]);
        c.shadowColor = "#f97316";
        c.shadowBlur = 10;
        c.beginPath();
        c.moveTo(this.owner.x, this.owner.y);
        c.lineTo(this.target.x, this.target.y);
        c.stroke();
        c.restore();
      },
    };
  }

  // ---- Skill 1: Rip & Tear Rev (Primary +1 Ult Charge + Blood Lifesteal) ----
  const SKILL_CHAINSAW_REV = {
    name: "Rip & Tear Rev",
    cooldown: 2.4,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 275) return false;

      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: inUlt ? "#ef4444" : "#f97316",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const aim = Math.atan2(t.y - b.y, t.x - b.x);
          const nx = Math.cos(aim);
          const ny = Math.sin(aim);

          b.denjiDashTimer = 0.26;
          b.vx = nx * Math.max(b.baseSpeed * 1.46, 505);
          b.vy = ny * Math.max(b.baseSpeed * 1.46, 505);
          gg.entities.push(rt.spawnShockRing(b.x, b.y, "#ea580c", 76, 0.25));

          const curDist = Math.hypot(t.x - b.x, t.y - b.y);
          if (curDist <= b.radius + t.radius + 115) {
            const rawDmg = inUlt ? Math.round(18 + rt.rng() * 4) : Math.round(15 + rt.rng() * 4);
            const dealt = gg.applyDamage(t, rawDmg);
            t.flashTimer = 0.15;
            t.squash = 0.9;
            t.vx += nx * 220;
            t.vy += ny * 220;

            if (!inUlt) {
              gg.chargeUlt(b);
            }

            // Balanced Blood Lifesteal (+6 HP in base, +9 HP in Hero of Hell)
            const healAmt = inUlt ? 9 : 6;
            if (b.hp < b.maxHp) {
              const actualHeal = Math.min(healAmt, b.maxHp - b.hp);
              b.hp += actualHeal;
              gg.spawnDamageText(b.x, b.y - b.radius - 12, 0, COLORS.green, false, `+${actualHeal} BLOOD`);
            }

            gg.spawnSparks(t.x, t.y, "#ef4444", "#fbbf24");
            gg.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#f97316", inUlt, inUlt ? "HERO OF HELL RIP!" : "RIP & TEAR!");
            gg.sound.playCritHit();
            rt.setHitStop(0.055);
            rt.addShake(0.16, 4.5);
          }
        },
      });
      return true;
    },
  };

  // ---- Skill 2: Devil Chain Grapple (Hook & Collision Pull — No Ult Charge) ----
  const SKILL_CHAIN_GRAPPLE = {
    name: "Chain Grapple",
    cooldown: 4.5,
    onTick(ball, g) {
      const target = g.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const dist = Math.hypot(target.x - ball.x, target.y - ball.y);
      if (dist > 325 || dist < 60) return false;

      rt.beginCast(ball, {
        kind: "slash",
        duration: 0.2,
        color: "#fbbf24",
        fire(b, gg) {
          const t = gg.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const dx = t.x - b.x;
          const dy = t.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          const nx = dx / d;
          const ny = dy / d;

          const rawDmg = Math.round(10 + rt.rng() * 3);
          const dealt = gg.applyDamage(t, rawDmg);
          t.flashTimer = 0.12;
          b.denjiDashTimer = 0.24;
          b.vx = nx * 360;
          b.vy = ny * 360;
          t.vx = -nx * 260;
          t.vy = -ny * 260;

          gg.entities.push(spawnChainGrappleVisual(b, t));
          gg.spawnSparks(t.x, t.y, "#f97316", "#cbd5e1");
          gg.spawnDamageText(t.x, t.y - t.radius - 14, dealt, "#fbbf24", false, "CHAIN HOOK!");
          gg.sound.playBallHit();
        },
      });
      return true;
    },
  };

  // ---- Weapon Drawer: Spinning Arm Chainsaw Blade ----
  BF.WEAPON_DRAWERS.chainsaw_blade = (ball, c) => {
    const isHeroOfHell = ball.ultTimer > 0;
    const sawTick = Math.floor(performance.now() * 0.045) % 2;

    c.save();
    // Engine housing guard at base
    c.fillStyle = isHeroOfHell ? "#1e293b" : "#c2410c";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.roundRect(-8, 2, 16, 12, 3);
    c.fill();
    c.stroke();

    // Main steel chainsaw bar pointing along -Y (like other melee weapons in drawWeapon)
    c.fillStyle = "#94a3b8";
    c.strokeStyle = isHeroOfHell ? "#ef4444" : COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.roundRect(-6, -34, 12, 38, 6);
    c.fill();
    c.stroke();

    // Crimson groove down the center of the bar
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -29);
    c.stroke();

    // Animated reciprocating saw teeth along both sides
    c.fillStyle = "#f8fafc";
    const shift = sawTick * 3;
    for (let y = -30 + shift; y < 0; y += 6.5) {
      c.beginPath();
      c.moveTo(-6, y); c.lineTo(-11, y + 2.5); c.lineTo(-6, y + 5);
      c.moveTo(6, y); c.lineTo(11, y + 2.5); c.lineTo(6, y + 5);
      c.fill();
    }
    c.restore();
  };

  // ---- Costume Drawer: Denji (Full Chainsaw Devil Hybrid Helmet + Hero of Hell Ult) ----
  BF.COSTUME_DRAWERS.denji = (ball, r, c) => {
    const isHeroOfHell = ball.ultTimer > 0;
    const sawTick = Math.floor(performance.now() * 0.04) % 2;

    c.save();
    // Hero of Hell floating dark-crimson scarf behind body
    if (isHeroOfHell) {
      const wave = Math.sin((rt.elapsed || 0) * 9) * 7;
      c.strokeStyle = "#991b1b";
      c.lineWidth = 6.5;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-r * 0.6, r * 0.2);
      c.quadraticCurveTo(-r * 1.35, -r * 0.2 + wave, -r * 1.15, -r * 0.95);
      c.moveTo(r * 0.6, r * 0.2);
      c.quadraticCurveTo(r * 1.35, -r * 0.2 - wave, r * 1.15, -r * 0.95);
      c.stroke();
    }

    // Full Devil Helmet Shell (Burnt Orange in Hybrid Form, Jet-Black Armor in Hero of Hell)
    const helmGrad = c.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    if (isHeroOfHell) {
      helmGrad.addColorStop(0, "#334155");
      helmGrad.addColorStop(0.55, "#0f172a");
      helmGrad.addColorStop(1, "#020617");
    } else {
      helmGrad.addColorStop(0, "#fb923c");
      helmGrad.addColorStop(0.6, "#ea580c");
      helmGrad.addColorStop(1, "#7c2d12");
    }
    c.fillStyle = helmGrad;
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.fill();

    // Glowing Devil Visor Slits
    c.fillStyle = isHeroOfHell ? "#ef4444" : "#fde047";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-r * 0.62, -r * 0.28);
    c.lineTo(-r * 0.18, -r * 0.14);
    c.lineTo(-r * 0.26, -r * 0.02);
    c.lineTo(-r * 0.66, -r * 0.14);
    c.closePath();
    c.moveTo(r * 0.62, -r * 0.28);
    c.lineTo(r * 0.18, -r * 0.14);
    c.lineTo(r * 0.26, -r * 0.02);
    c.lineTo(r * 0.66, -r * 0.14);
    c.closePath();
    c.fill();
    c.stroke();

    // Savage Devil Jaw & Interlocking White Fangs
    c.fillStyle = "#18181b";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-r * 0.68, r * 0.14);
    c.quadraticCurveTo(0, r * 0.04, r * 0.68, r * 0.14);
    c.quadraticCurveTo(r * 0.55, r * 0.68, 0, r * 0.72);
    c.quadraticCurveTo(-r * 0.55, r * 0.68, -r * 0.68, r * 0.14);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#f8fafc";
    const teethCount = 6;
    for (let i = 0; i < teethCount; i++) {
      const tx = -r * 0.5 + (i * (r * 1.0)) / teethCount;
      const tw = (r * 0.95) / teethCount;
      c.beginPath();
      c.moveTo(tx, r * 0.14);
      c.lineTo(tx + tw * 0.5, r * 0.42);
      c.lineTo(tx + tw, r * 0.14);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(tx + tw * 0.15, r * 0.58);
      c.lineTo(tx + tw * 0.5, r * 0.34);
      c.lineTo(tx + tw * 0.85, r * 0.58);
      c.closePath();
      c.fill();
    }

    // Forehead Chainsaw Horn jutting out from top-center of helmet
    c.fillStyle = "#94a3b8";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(-4.5, -r * 1.32, 9, r * 0.56, 4);
    c.fill();
    c.stroke();

    // Animated revving saw teeth on forehead blade
    c.fillStyle = "#f8fafc";
    const toothOffset = sawTick * 2.5;
    for (let y = -r * 1.26 + toothOffset; y < -r * 0.8; y += 5.5) {
      c.beginPath();
      c.moveTo(-4.5, y); c.lineTo(-9.5, y + 2.2); c.lineTo(-4.5, y + 4.4);
      c.moveTo(4.5, y); c.lineTo(9.5, y + 2.2); c.lineTo(4.5, y + 4.4);
      c.fill();
    }

    // Yellow Triangular Rip-Cord on Lower Chest
    c.fillStyle = "#facc15";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-6, r * 0.86);
    c.lineTo(6, r * 0.86);
    c.lineTo(0, r * 0.72);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  };

  BF.CHARACTER_ROSTER.denji = {
    id: "denji",
    name: "CHAINSAW DEVIL",
    shortName: "CHAINSAW",
    title: "Public Safety Devil Hunter • Hero of Hell",
    role: "BERSERKER • BLOOD LIFESTEAL",
    color: "#ea580c",
    radius: 28,
    speed: 362,
    maxHp: 590,
    damage: [6, 9],
    mass: 1.05,
    costume: "denji",
    weapon: "chainsaw_blade",
    ult: "hero_of_hell",
    ultName: "HERO OF HELL (BLACK CHAINSAW)",
    ultDesc: "Awakens the true Black Chainsaw Devil armor for 8s! Grants +28% Speed, 22% Shield, and boosts Rip & Tear damage and Blood Lifesteal.",
    skillName: "RIP & TEAR REV + CHAIN HOOK",
    skillDesc: "Pulls his chest cord to lunge and shred the enemy (healing HP from their blood), or fires a Chainsaw Chain Grapple to reel targets in!",
    skills: [SKILL_CHAINSAW_REV, SKILL_CHAIN_GRAPPLE],
  };
})();
