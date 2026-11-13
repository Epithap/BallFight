(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const rt = BF.rt;

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

  const SKILL_RASENGAN = {
    name: "Rasengan",
    cooldown: 3.0,
    onTick(ball, game) {
      const target = game.balls.find((b) => b !== ball && b.alive);
      if (!target) return false;
      rt.beginCast(ball, {
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

  BF.CHARACTER_ROSTER.naruto = {
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
  };

  BF.WEAPON_DRAWERS.kunai = (ball, c) => {
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
  };

  BF.COSTUME_DRAWERS.naruto = (ball, r, c) => {
    rt.drawSkinFace(ball, r, c);

    c.save();
    c.beginPath();
    c.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = COLORS.ichigoDark;
    c.fillRect(-r, r * 0.54, r * 2, r * 0.52);
    c.strokeRect(-r, r * 0.54, r * 2, r * 0.52);
    c.fillStyle = COLORS.narutoOrange;
    c.fillRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
    c.strokeRect(-r * 0.45, r * 0.58, r * 0.9, r * 0.48);
    c.strokeStyle = COLORS.white;
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(0, r * 0.6);
    c.lineTo(0, r);
    c.stroke();
    c.restore();

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

    c.fillStyle = COLORS.ichigoDark;
    c.fillRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);
    c.strokeRect(-r * 0.94, -r * 0.64, r * 1.88, r * 0.25);

    c.fillStyle = COLORS.silver;
    c.fillRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);
    c.strokeRect(-r * 0.46, -r * 0.66, r * 0.92, r * 0.29);

    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -r * 0.51, r * 0.08, 0, Math.PI * 1.7);
    c.stroke();

    for (const side of [-1, 1]) {
      for (const dy of [0.14, 0.24, 0.34]) {
        c.beginPath();
        c.moveTo(side * r * 0.58, r * dy);
        c.lineTo(side * r * 0.84, r * (dy + 0.03));
        c.stroke();
      }
    }
  };

  BF.spawnRasenganVisual = spawnRasenganVisual;
})();

