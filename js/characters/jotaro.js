(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const rt = BF.rt;

  const SKILL_ORA_BARRAGE = {
    name: "Ora Barrage",
    cooldown: 2.4,
    onTick(ball, game) {
      if (ball.standState) return false;
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const inUlt = ball.ultTimer > 0;
      rt.beginCast(ball, {
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

  function drawStarPlatinumStand(ball, r, c = rt.ctx, showExtras = true) {
    let ang = Math.atan2(ball.vy, ball.vx);
    if (Math.abs(ball.vx) < 0.01 && Math.abs(ball.vy) < 0.01) {
      ang = ball.weaponAngle || 0;
    }

    const st = showExtras ? ball.standState : null;
    const hoverBob = st ? 0 : Math.sin(rt.elapsed * 4.2 + (ball.x || 0) * 0.02) * 3.5;
    const behindDist = r * 0.9;
    const standX = st ? st.x : ball.x - Math.cos(ang) * behindDist;
    const standY = st ? st.y : ball.y - Math.sin(ang) * behindDist - 9 + hoverBob;
    const sr = r * 0.94;
    const faceAngle = st ? st.angle : ang;

    c.save();
    c.translate(standX, standY);
    c.lineJoin = "round";
    c.lineCap = "round";

    const auraPulse = Math.sin(rt.elapsed * 5.5) * 3;
    const auraRadius = sr + 16 + auraPulse;
    const auraGrad = c.createRadialGradient(0, 0, sr * 0.35, 0, 0, auraRadius);
    auraGrad.addColorStop(0, "rgba(155, 89, 182, 0.48)");
    auraGrad.addColorStop(0.65, "rgba(108, 92, 231, 0.18)");
    auraGrad.addColorStop(1, "rgba(108, 92, 231, 0)");
    c.fillStyle = auraGrad;
    c.beginPath();
    c.arc(0, 0, auraRadius, 0, Math.PI * 2);
    c.fill();

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

    if (st && (st.phase === "barraging" || st.phase === "clashing")) {
      const dirX = Math.cos(faceAngle);
      const dirY = Math.sin(faceAngle);
      const perpX = -dirY;
      const perpY = dirX;
      for (let i = 0; i < 6; i++) {
        const wave = ((rt.elapsed * 26 + i * 1.15) % 1);
        const reach = sr * (0.65 + wave * 1.55);
        const spread = Math.sin(i * 2.4 + rt.elapsed * 18) * sr * 0.58;
        const fx = dirX * reach + perpX * spread;
        const fy = dirY * reach + perpY * spread;
        c.save();
        c.globalAlpha = Math.max(0.35, 1 - wave * 0.45);
        rt.drawStandFist(c, fx, fy, sr * 0.31, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
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
      rt.drawStandFist(c, dirX * sr * 0.85 + perpX * sr * 0.45, dirY * sr * 0.85 + perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
      rt.drawStandFist(c, dirX * sr * 0.85 - perpX * sr * 0.45, dirY * sr * 0.85 - perpY * sr * 0.45, sr * 0.34, true, faceAngle + Math.PI * 0.5, "#9b59b6", COLORS.gold, COLORS.gold);
    } else {
      const isAttacking = (ball.standAttackTimer && ball.standAttackTimer > 0) || (ball.ultTimer > 0);
      const punchExt = isAttacking ? Math.sin(rt.elapsed * 32) * 16 : 0;
      rt.drawStandFist(c, -sr * 0.96 - punchExt * 0.35, sr * 0.42 + punchExt, sr * 0.32, isAttacking, 0, "#9b59b6", COLORS.gold, COLORS.gold);
      rt.drawStandFist(c, sr * 0.96 + punchExt * 0.35, sr * 0.42 - punchExt, sr * 0.32, isAttacking, 0, "#9b59b6", COLORS.gold, COLORS.gold);
    }

    c.restore();
  }

  BF.CHARACTER_ROSTER.jotaro = {
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
  };

  BF.WEAPON_DRAWERS.star_chain = (ball, c) => {
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 4;
    c.fillStyle = COLORS.gold;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.ellipse(0, i * 9, 4.5, 6.5, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
  };

  BF.COSTUME_DRAWERS.jotaro = (ball, r, c) => {
    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();

    c.fillStyle = "#191628";
    c.fillRect(-r, r * 0.38, r * 2, r * 0.68);

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

    c.fillStyle = "#8e44ad";
    c.beginPath();
    c.moveTo(-r * 0.24, r * 0.44);
    c.lineTo(r * 0.24, r * 0.44);
    c.lineTo(0, r * 0.92);
    c.closePath();
    c.fill();
    c.stroke();

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

    c.fillStyle = "#161424";
    c.strokeStyle = COLORS.ink;
    c.lineWidth = 2.6;
    c.beginPath();
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

    c.fillStyle = "#39315c";
    c.beginPath();
    c.moveTo(-r * 0.86, -r * 0.4);
    c.lineTo(r * 0.86, -r * 0.4);
    c.lineTo(r * 0.72, -r * 0.22);
    c.lineTo(-r * 0.72, -r * 0.22);
    c.closePath();
    c.fill();
    c.stroke();

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

    if (ball.flashTimer <= 0) {
      c.fillStyle = ball.ultTimer > 0 ? "#00f0ff" : "#3498db";
      c.beginPath();
      c.arc(-r * 0.3, -r * 0.06, r * 0.075, 0, Math.PI * 2);
      c.arc(r * 0.3, -r * 0.06, r * 0.075, 0, Math.PI * 2);
      c.fill();
    }
  };

  BF.drawStarPlatinumStand = drawStarPlatinumStand;
})();

