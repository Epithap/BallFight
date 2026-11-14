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

      // ---- Weapon Drawer: Forearm Chainsaw (orange engine housing + steel bar + running chain) ----
  BF.WEAPON_DRAWERS.chainsaw_blade = (ball, c) => {
    const isHeroOfHell = ball.ultTimer > 0;
    const tick = Math.floor(performance.now() * 0.05) % 2;
    c.save();
    c.lineJoin = "round";
    // Engine housing fused to the forearm
    c.fillStyle = isHeroOfHell ? "#18181b" : "#c2410c";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.roundRect(-8, 1, 16, 15, 4);
    c.fill();
    c.stroke();
    c.fillStyle = isHeroOfHell ? "#ef4444" : "#7c2d12";
    c.fillRect(-5, 5, 10, 2.5);
    c.fillRect(-5, 10, 10, 2.5);
    // Steel guide bar
    c.fillStyle = "#cbd5e1";
    c.beginPath();
    c.moveTo(-5.8, 2);
    c.lineTo(-5.8, -32);
    c.arc(0, -32, 5.8, Math.PI, 0);
    c.lineTo(5.8, 2);
    c.closePath();
    c.fill();
    c.stroke();
    // Blood groove down center of chainsaw bar
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -30);
    c.stroke();
    // Running chain teeth
    c.fillStyle = "#f8fafc";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.2;
    for (let y = -33 + tick * 3; y < 0; y += 6) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 5.8, y);
        c.lineTo(s * 10.5, y + 1.5);
        c.lineTo(s * 5.8, y + 4.2);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
    c.restore();
  };

  // ---- Costume Drawer: Denji / Chainsaw Man ----
  // Authentic Chainsaw Devil Hybrid helmet: angular burnt-orange/crimson mechanical cowling, black top handlebar,
  // side exhaust vents, glowing yellow/crimson mechanical slit visors, interlock shark fangs, and Public Safety tie.
  BF.COSTUME_DRAWERS.denji = (ball, r, c) => {
    const hell = ball.ultTimer > 0;
    const tick = Math.floor(performance.now() * 0.05) % 2;
    const t = performance.now() * 0.001;

    // Hero of Hell: flowing dark-crimson intestinal scarf behind body + 4-arm black devil armor spikes
    if (hell) {
      c.save();
      c.lineCap = "round";
      for (const s of [-1, 1]) {
        const w = Math.sin(t * 6 + s) * r * 0.12;
        c.strokeStyle = COLORS.ink;
        c.lineWidth = r * 0.24;
        c.beginPath();
        c.moveTo(s * r * 0.5, r * 0.58);
        c.quadraticCurveTo(s * r * 1.28, r * 0.45 + w, s * r * 1.44, -r * 0.05 - w);
        c.stroke();
        c.strokeStyle = "#be123c";
        c.lineWidth = r * 0.16;
        c.stroke();
      }
      c.restore();
    }

    // Iconic Black Chainsaw Handlebar arching over top of helmet (behind center blade)
    c.save();
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 6.5;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-r * 0.44, -r * 0.78);
    c.lineTo(-r * 0.36, -r * 1.08);
    c.lineTo(r * 0.36, -r * 1.08);
    c.lineTo(r * 0.44, -r * 0.78);
    c.stroke();
    c.strokeStyle = "#27272a";
    c.lineWidth = 3.2;
    c.stroke();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    // 1. Lower Body: Public Safety White Shirt & Black Tie (Base) or Jet-Black Armored Torso (Hero of Hell)
    c.fillStyle = hell ? "#09090b" : "#f8fafc";
    c.fillRect(-r, r * 0.54, r * 2, r * 0.56);

    if (!hell) {
      // White shirt collar & black tie
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.fillStyle = "#e2e8f0";
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * r * 0.05, r * 0.62);
        c.lineTo(s * r * 0.38, r * 0.58);
        c.lineTo(s * r * 0.22, r * 0.82);
        c.closePath();
        c.fill();
        c.stroke();
      }
      c.fillStyle = "#0f172a";
      c.beginPath();
      c.moveTo(-r * 0.08, r * 0.62);
      c.lineTo(r * 0.08, r * 0.62);
      c.lineTo(r * 0.12, r * 1.05);
      c.lineTo(-r * 0.12, r * 1.05);
      c.closePath();
      c.fill();
      c.stroke();
    } else {
      // Hero of Hell intestinal scarf wrapped across chest
      c.strokeStyle = COLORS.ink;
      c.lineWidth = r * 0.22;
      c.beginPath();
      c.moveTo(-r * 0.85, r * 0.68);
      c.quadraticCurveTo(0, r * 0.84, r * 0.85, r * 0.68);
      c.stroke();
      c.strokeStyle = "#be123c";
      c.lineWidth = r * 0.14;
      c.stroke();
    }

    // Yellow triangular rip-cord pull tab on chest
    c.fillStyle = "#facc15";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-r * 0.11, r * 0.92);
    c.lineTo(r * 0.11, r * 0.92);
    c.lineTo(0, r * 0.74);
    c.closePath();
    c.fill();
    c.stroke();

    // 2. Angular Mechanical Devil Helmet Cowling (Covers upper & middle head down to the jaw)
    const hg = c.createLinearGradient(0, -r, 0, r * 0.6);
    if (hell) {
      hg.addColorStop(0, "#3f3f46");
      hg.addColorStop(0.5, "#18181b");
      hg.addColorStop(1, "#09090b");
    } else {
      hg.addColorStop(0, "#f97316");
      hg.addColorStop(0.55, "#c2410c");
      hg.addColorStop(1, "#7c2d12");
    }
    c.fillStyle = hg;
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r, -r);
    c.lineTo(r, -r);
    c.lineTo(r, r * 0.28);
    c.lineTo(r * 0.58, r * 0.62);
    c.lineTo(-r * 0.58, r * 0.62);
    c.lineTo(-r, r * 0.28);
    c.closePath();
    c.fill();
    c.stroke();

    // Side mechanical air-intake vents & rivets on helmet cheeks
    c.strokeStyle = hell ? "#52525b" : "#431407";
    c.lineWidth = 2.2;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const vy = -r * 0.36 + k * r * 0.11;
        c.beginPath();
        c.moveTo(s * r * 0.72, vy);
        c.lineTo(s * r * 0.92, vy + r * 0.05);
        c.stroke();
      }
    }

    // 3. Recessed Black Visor Channels + Sharp Glowing Mechanical Slit Eyes (NO round eyeballs!)
    for (const s of [-1, 1]) {
      // Dark armored eye socket recess
      c.fillStyle = "#09090b";
      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(s * r * 0.14, -r * 0.18);
      c.lineTo(s * r * 0.66, -r * 0.36);
      c.lineTo(s * r * 0.6, -r * 0.12);
      c.lineTo(s * r * 0.18, -r * 0.04);
      c.closePath();
      c.fill();
      c.stroke();

      // Glowing narrow mechanical visor slit inside socket
      c.fillStyle = hell ? "#ef4444" : "#fef08a";
      c.shadowColor = hell ? "#dc2626" : "#facc15";
      c.shadowBlur = 8;
      c.beginPath();
      c.moveTo(s * r * 0.18, -r * 0.15);
      c.lineTo(s * r * 0.58, -r * 0.29);
      c.lineTo(s * r * 0.54, -r * 0.16);
      c.lineTo(s * r * 0.2, -r * 0.08);
      c.closePath();
      c.fill();
      c.shadowBlur = 0;
    }

    // 4. Savage Metallic Maw with Long Interlocking Razor Fangs
    c.fillStyle = "#18181b";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.68, r * 0.04);
    c.quadraticCurveTo(0, r * 0.14, r * 0.68, r * 0.04);
    c.lineTo(r * 0.52, r * 0.54);
    c.quadraticCurveTo(0, r * 0.62, -r * 0.52, r * 0.54);
    c.closePath();
    c.fill();
    c.stroke();

    c.save();
    c.clip();
    c.fillStyle = "#f8fafc";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.5;
    const nTeeth = 8;
    for (let i = 0; i < nTeeth; i++) {
      const x0 = -0.64 + (i * 1.28) / nTeeth;
      const x1 = x0 + 1.28 / nTeeth;
      const xm = (x0 + x1) * 0.5;
      // Upper long fang
      c.beginPath();
      c.moveTo(x0 * r, r * 0.02);
      c.lineTo(xm * r, r * 0.36);
      c.lineTo(x1 * r, r * 0.02);
      c.closePath();
      c.fill();
      c.stroke();
      // Lower interlocking fang
      c.beginPath();
      c.moveTo(x0 * r + r * 0.03, r * 0.6);
      c.lineTo(xm * r + r * 0.03, r * 0.28);
      c.lineTo(x1 * r + r * 0.03, r * 0.6);
      c.closePath();
      c.fill();
      c.stroke();
    }
    c.restore();

    // Re-stroke mouth rim cleanly
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.68, r * 0.04);
    c.quadraticCurveTo(0, r * 0.14, r * 0.68, r * 0.04);
    c.lineTo(r * 0.52, r * 0.54);
    c.quadraticCurveTo(0, r * 0.62, -r * 0.52, r * 0.54);
    c.closePath();
    c.stroke();
    c.restore();

    // 5. Center Forehead Chainsaw Blade & Engine Cowling
    c.save();
    c.lineJoin = "round";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.5;
    const bw = r * 0.135;
    c.fillStyle = "#cbd5e1";
    c.beginPath();
    c.moveTo(-bw, -r * 0.68);
    c.lineTo(-bw, -r * 1.56);
    c.arc(0, -r * 1.56, bw, Math.PI, 0);
    c.lineTo(bw, -r * 0.68);
    c.closePath();
    c.fill();
    c.stroke();

    // Crimson blood groove on forehead blade
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, -r * 0.78);
    c.lineTo(0, -r * 1.52);
    c.stroke();

    // Reciprocating saw teeth
    c.fillStyle = "#ffffff";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 1.2;
    const step = r * 0.12;
    for (let y = -r * 1.58 + tick * step * 0.5; y < -r * 0.82; y += step) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * bw, y);
        c.lineTo(s * (bw + r * 0.095), y + step * 0.26);
        c.lineTo(s * bw, y + step * 0.66);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }

    // Forehead housing ridge where blade erupts from the skull
    c.fillStyle = hell ? "#27272a" : "#9a3412";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-r * 0.24, -r * 0.52);
    c.lineTo(-r * 0.2, -r * 0.88);
    c.lineTo(r * 0.2, -r * 0.88);
    c.lineTo(r * 0.24, -r * 0.52);
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
