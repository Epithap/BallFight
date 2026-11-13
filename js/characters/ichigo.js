(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const rt = BF.rt;

  const SKILL_GETSUGA = {
    name: "Getsuga Tensho",
    cooldown: 3.4,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      const hollow = ball.ultTimer > 0;
      rt.beginCast(ball, {
        kind: "slash", duration: hollow ? 0.3 : 0.42, color: COLORS.red, maxR: hollow ? 25 : 16,
        fire(b, g) {
          const t = g.balls.find((x) => x !== b && x.alive);
          if (!t) return;
          const m = rt.castMuzzle(b, Math.atan2(t.y - b.y, t.x - b.x), 14);
          g.entities.push(rt.spawnShockRing(m.x, m.y, COLORS.red, hollow ? 80 : 55, 0.3));
          g.entities.push(rt.spawnProjectile({
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

  BF.CHARACTER_ROSTER.ichigo = {
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
  };

  BF.TRANSFORM_DETAILS.ichigo = {
    label: "🔥 HOLLOW MASK",
    speedMult: 1.28,
    radiusMult: 1.0,
    powerText: "26-34 WAVE",
    ultSkillName: "BLACK GETSUGA TENSHO",
    ultSkillCd: "CD: 1.8S",
    ultSkillDesc: "Speed +28%! Slashes out a blazing black-crimson Bankai crescent wave with higher damage and knockback.",
  };

  BF.WEAPON_DRAWERS.tensa_zangetsu = (ball, c) => {
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
  };

  BF.COSTUME_DRAWERS.ichigo = (ball, r, c) => {
    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = COLORS.skin;
    c.fillRect(-r, -r, r * 2, r * 1.48);

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

    if (ball.ultTimer > 0) {
      c.save();
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

      c.save();
      c.clip();

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

      c.beginPath();
      c.moveTo(r * 0.06, r * 0.74);
      c.lineTo(r * 0.48, r * 0.6);
      c.lineTo(r * 0.32, r * 0.86);
      c.lineTo(r * 0.04, r * 0.94);
      c.closePath();
      c.fill();

      c.restore();

      c.strokeStyle = COLORS.ink;
      c.lineWidth = 2.6;
      c.stroke();

      c.strokeStyle = "rgba(25, 22, 30, 0.55)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, -r * 0.18);
      c.lineTo(0, r * 0.26);
      c.stroke();

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

        c.fillStyle = "#ffd426";
        c.beginPath();
        c.arc(side * r * 0.38, -r * 0.07, r * 0.065, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(side * r * 0.39, -r * 0.085, r * 0.022, 0, Math.PI * 2);
        c.fill();
      }

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
        c.beginPath();
        c.moveTo(t0, r * 0.3);
        c.lineTo(tm, r * 0.49);
        c.lineTo(t1, r * 0.3);
        c.closePath();
        c.fill();
        c.stroke();
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
  };
})();

