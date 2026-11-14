// Per-character Chibi anime faces: big round expressive chibi eyes, compact high-set mouths, and distinct personalities.
// Preserves each fighter's eye colors, markings, scars, and Ultimate/Awakened transformations in a classic Chibi ball style.
(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;
  const INK = COLORS.ink, WHITE = COLORS.white, TAU = Math.PI * 2;
  const F = (BF.FACE_DRAWERS = {});

  // 0..1 eyelid closure. Short blink every few seconds in live battles (never during static UI previews).
  function blinkAmt(ball) {
    if (!ball || !ball.maxHp) return 0;
    const id = String(ball.costume || "x");
    let seed = 0;
    for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i) * (i + 3);
    const period = 3.2 + (seed % 17) * 0.1;
    const t = (performance.now() / 1000 + seed * 0.37) % period;
    if (t > 0.14) return 0;
    return Math.sin((t / 0.14) * Math.PI);
  }

  function brow(c, side, r, y, tilt, w = 3.6, len = 0.38, col = INK) {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(side * r * (0.12 + len), -r * (y + tilt));
    c.lineTo(side * r * 0.12, -r * (y - tilt));
    c.stroke();
  }

  // Big round Chibi eye with subtle expression tilt, colored iris + large pupil, crisp shine, and blink arc.
  // o: rx (0.255), ry (0.255), dx (0.30), dy (0), slant, iris (0.145), color, innerRing, pupilColor,
  //    pupil ("none"), slit, hl (false disables), hl2, kumadori, ring, sclera, lash, lashColor, lidArc, blink, ex, ey
  function eye(c, r, side, o) {
    const rx = r * (o.rx ?? 0.255);
    const ry = r * (o.ry ?? 0.255);
    const bl = o.blink || 0;
    c.save();
    c.translate(side * r * (o.dx ?? 0.30), -r * 0.08 + (o.dy || 0) * r);
    // Keep chibi eye mostly round, using subtle rotation only for attitude
    if (o.slant) c.rotate(-side * o.slant * 0.35);

    if (o.kumadori) {
      c.fillStyle = o.kumadori;
      c.beginPath();
      c.ellipse(0, 0, rx * 1.24, ry * 1.24, 0, 0, TAU);
      c.fill();
    } else if (o.ring) {
      c.strokeStyle = o.ring;
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.beginPath();
      c.ellipse(0, ry * 0.22, rx * 1.05, ry * 0.92, 0, Math.PI * 0.14, Math.PI * 0.86);
      c.stroke();
    }

    // Smooth chibi blink closes eye into a crisp curved line
    if (bl > 0.65) {
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, rx * 0.85, Math.PI * 0.12, Math.PI * 0.88);
      c.stroke();
      c.restore();
      return;
    }

    const openRy = ry * (1 - bl * 0.7);
    c.beginPath();
    c.ellipse(0, 0, rx, openRy, 0, 0, TAU);
    c.fillStyle = o.sclera || WHITE;
    c.fill();

    c.save();
    c.clip();
    const ir = r * (o.iris ?? 0.145);
    const ox = Math.max(-rx * 0.32, Math.min(rx * 0.32, o.ex || 0));
    const oy = Math.max(-openRy * 0.25, Math.min(openRy * 0.25, o.ey || 0));
    const hasDistinctColor = Boolean(o.color && o.color !== INK);

    if (hasDistinctColor) {
      // Colored anime iris outer circle
      c.fillStyle = o.color;
      c.beginPath();
      c.arc(ox, oy, ir, 0, TAU);
      c.fill();
      if (o.innerRing) {
        c.strokeStyle = o.innerRing;
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(ox, oy, ir * 0.72, 0, TAU);
        c.stroke();
      }
      if (o.pupil !== "none") {
        c.fillStyle = o.pupilColor || INK;
        if (o.slit) {
          c.beginPath();
          c.ellipse(ox, oy, ir * 0.25, ir * 0.88, 0, 0, TAU);
          c.fill();
        } else {
          c.beginPath();
          c.arc(ox, oy, ir * 0.60, 0, TAU);
          c.fill();
        }
      }
    } else if (o.pupil !== "none") {
      // Classic bold dark Chibi pupil
      c.fillStyle = o.pupilColor || INK;
      if (o.slit) {
        c.beginPath();
        c.ellipse(ox, oy, ir * 0.28, ir * 0.9, 0, 0, TAU);
        c.fill();
      } else {
        c.beginPath();
        c.arc(ox, oy, ir, 0, TAU);
        c.fill();
      }
    }

    // Crisp cute Chibi highlights
    if (o.hl !== false) {
      c.fillStyle = WHITE;
      c.beginPath();
      c.arc(ox - ir * 0.34, oy - ir * 0.36, ir * 0.33, 0, TAU);
      c.fill();
      if (o.hl2) {
        c.beginPath();
        c.arc(ox + ir * 0.36, oy + ir * 0.34, ir * 0.16, 0, TAU);
        c.fill();
      }
    }
    c.restore();

    // Bold chunky Chibi eye outline
    c.lineWidth = o.outlineW ?? 2.8;
    c.strokeStyle = INK;
    c.beginPath();
    c.ellipse(0, 0, rx, openRy, 0, 0, TAU);
    c.stroke();

    // Optional subtle upper-lid accent curve (for cool/calm fighters like Jotaro/Gojo/Jin-Woo) without flattening the circle
    if (o.lidArc) {
      c.lineWidth = 3.2;
      c.lineCap = "round";
      c.strokeStyle = INK;
      c.beginPath();
      c.ellipse(0, 0, rx * 1.02, openRy * 1.02, 0, Math.PI * 1.14, Math.PI * 1.86);
      c.stroke();
    }

    if (o.lash) {
      c.strokeStyle = o.lashColor || INK;
      c.lineWidth = 2.4;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(side * rx * 0.72, -openRy * 0.58);
      c.lineTo(side * (rx + r * 0.08), -openRy * 0.95);
      c.restore();
    } else {
      c.restore();
    }
  }

  // Compact, high-set Chibi mouths nestled cleanly right below the round eyes
  function mouth(c, r, kind) {
    c.strokeStyle = INK;
    c.fillStyle = INK;
    c.lineWidth = 2.8;
    c.lineCap = c.lineJoin = "round";

    const dGrin = (half, depth, y0 = 0.21) => {
      c.beginPath();
      c.moveTo(-r * half, r * y0);
      c.quadraticCurveTo(0, r * depth, r * half, r * y0);
      c.closePath();
      c.save();
      c.fillStyle = "#881d2c";
      c.fill();
      c.clip();
      c.fillStyle = WHITE;
      c.fillRect(-r * half, r * (y0 - 0.02), r * half * 2, r * 0.09);
      c.fillStyle = "#fb7185";
      c.beginPath();
      c.arc(0, r * (depth - 0.06), r * 0.11, 0, TAU);
      c.fill();
      c.restore();
      c.stroke();
    };

    switch (kind) {
      case "smile":
        c.beginPath();
        c.arc(0, r * 0.19, r * 0.2, Math.PI * 0.15, Math.PI * 0.85);
        c.stroke();
        break;
      case "grin":
        dGrin(0.22, 0.44, 0.21);
        break;
      case "bigGrin":
        dGrin(0.26, 0.48, 0.20);
        break;
      case "smirk":
        c.beginPath();
        c.moveTo(-r * 0.16, r * 0.26);
        c.quadraticCurveTo(r * 0.02, r * 0.35, r * 0.2, r * 0.19);
        c.stroke();
        break;
      case "smug":
        c.beginPath();
        c.moveTo(-r * 0.15, r * 0.27);
        c.quadraticCurveTo(r * 0.04, r * 0.32, r * 0.21, r * 0.19);
        c.stroke();
        c.beginPath();
        c.moveTo(r * 0.21, r * 0.19);
        c.lineTo(r * 0.25, r * 0.14);
        c.stroke();
        break;
      case "calm":
        c.beginPath();
        c.moveTo(-r * 0.13, r * 0.26);
        c.quadraticCurveTo(0, r * 0.31, r * 0.13, r * 0.26);
        c.stroke();
        break;
      case "flat":
        c.beginPath();
        c.moveTo(-r * 0.15, r * 0.27);
        c.lineTo(r * 0.15, r * 0.27);
        c.stroke();
        break;
      case "frown":
        c.beginPath();
        c.arc(0, r * 0.38, r * 0.14, Math.PI * 1.18, Math.PI * 1.82);
        c.stroke();
        break;
      case "fang":
        c.beginPath();
        c.moveTo(-r * 0.18, r * 0.25);
        c.quadraticCurveTo(0, r * 0.34, r * 0.21, r * 0.19);
        c.stroke();
        c.fillStyle = WHITE;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-r * 0.11, r * 0.27);
        c.lineTo(-r * 0.07, r * 0.37);
        c.lineTo(-r * 0.02, r * 0.28);
        c.closePath();
        c.fill();
        c.stroke();
        break;
      case "sukunaSmirk":
        c.beginPath();
        c.moveTo(-r * 0.19, r * 0.26);
        c.quadraticCurveTo(r * 0.03, r * 0.34, r * 0.22, r * 0.2);
        c.stroke();
        c.fillStyle = WHITE;
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(r * 0.1, r * 0.26);
        c.lineTo(r * 0.15, r * 0.35);
        c.lineTo(r * 0.18, r * 0.22);
        c.closePath();
        c.fill();
        c.stroke();
        break;
      case "demon":
        dGrin(0.24, 0.44, 0.22);
        c.fillStyle = WHITE;
        c.lineWidth = 1.8;
        for (const s of [-1, 1]) {
          c.beginPath();
          c.moveTo(s * r * 0.17, r * 0.23);
          c.lineTo(s * r * 0.14, r * 0.34);
          c.lineTo(s * r * 0.1, r * 0.24);
          c.closePath();
          c.fill();
          c.stroke();
        }
        break;
      case "shout":
        c.beginPath();
        c.ellipse(0, r * 0.28, r * 0.11, r * 0.13, 0, 0, TAU);
        c.fill();
        c.fillStyle = "#ff5a5f";
        c.beginPath();
        c.ellipse(0, r * 0.33, r * 0.06, r * 0.05, 0, 0, TAU);
        c.fill();
        break;
      case "grit":
        c.fillStyle = WHITE;
        c.lineWidth = 2.4;
        c.beginPath();
        c.roundRect(-r * 0.19, r * 0.21, r * 0.38, r * 0.12, 3);
        c.fill();
        c.stroke();
        c.beginPath();
        for (const x of [-0.08, 0, 0.08]) {
          c.moveTo(r * x, r * 0.21);
          c.lineTo(r * x, r * 0.33);
        }
        c.stroke();
        break;
      case "bouncemanGrit":
        c.fillStyle = WHITE;
        c.lineWidth = 2.4;
        c.beginPath();
        c.roundRect(-r * 0.22, r * 0.20, r * 0.44, r * 0.14, 4);
        c.fill();
        c.stroke();
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(-r * 0.2, r * 0.27);
        c.lineTo(r * 0.2, r * 0.27);
        for (const x of [-0.11, 0, 0.11]) {
          c.moveTo(r * x, r * 0.2);
          c.lineTo(r * x, r * 0.34);
        }
        c.stroke();
        break;
    }
  }

  // Cheerful chibi hero in Base; intense crimson-eyed Saiyan battle grit in Kaioken!
  F.goku = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.25,
        ry: 0.25,
        slant: s.ult ? 0.35 : s.cast ? 0.2 : 0,
        iris: 0.145,
        color: s.ult ? "#e11d48" : INK,
        innerRing: s.ult ? "#fecdd3" : null,
        hl2: false,
        blink: s.ult ? 0 : blinkAmt(ball),
        ex: s.ex,
        ey: s.ey,
      });
    }
    brow(c, -1, r, 0.41, s.ult ? 0.16 : s.cast ? 0.08 : -0.02, 3.6, 0.36);
    brow(c, 1, r, 0.41, s.ult ? 0.16 : s.cast ? 0.08 : -0.02, 3.6, 0.36);
    if (s.ult) {
      c.strokeStyle = "#be123c";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.56, r * 0.12);
      c.lineTo(-r * 0.42, r * 0.15);
      c.moveTo(r * 0.56, r * 0.12);
      c.lineTo(r * 0.42, r * 0.15);
      c.stroke();
    }
    mouth(c, r, s.ult ? "grit" : s.cast ? "shout" : "smile");
  };

  // Bright big round blue chibi eyes (or Toad Sage / Kyuubi modes).
  F.naruto = (ball, r, c, s) => {
    if (ball.kyuubiMode) {
      const boneSkin = ball.skin === "naruto_six_tails_bone";
      c.save();
      for (const side of [-1, 1]) {
        const ex = side * r * (boneSkin ? 0.32 : 0.29) + s.ex * 0.35;
        const ey = -r * (boneSkin ? 0.12 : 0.08) + s.ey * 0.35;
        c.fillStyle = "rgba(254, 202, 202, 0.38)";
        c.beginPath();
        c.arc(ex, ey, r * (boneSkin ? 0.18 : 0.23), 0, TAU);
        c.fill();
        c.fillStyle = WHITE;
        c.strokeStyle = "#ef4444";
        c.lineWidth = 2.2;
        c.beginPath();
        c.arc(ex, ey, r * (boneSkin ? 0.13 : 0.165), 0, TAU);
        c.fill();
        c.stroke();
      }
      const mw = r * (boneSkin ? 0.28 : 0.36);
      const my = r * (boneSkin ? 0.29 : 0.24);
      const teeth = 4;
      c.fillStyle = WHITE;
      c.strokeStyle = boneSkin ? INK : "#ef4444";
      c.lineWidth = 2;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-mw, my);
      for (let i = 1; i <= teeth * 2; i++) {
        const tx = -mw + (mw * 2 * i) / (teeth * 2);
        const ty = my + (i % 2 === 1 ? -r * 0.07 : r * 0.05);
        c.lineTo(tx, ty);
      }
      for (let i = teeth * 2 - 1; i >= 0; i--) {
        const tx = -mw + (mw * 2 * i) / (teeth * 2);
        const ty = my + (i % 2 === 1 ? r * 0.03 : r * 0.12);
        c.lineTo(tx, ty);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
      return;
    }

    if (ball.evolved) {
      const bl = blinkAmt(ball);
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.24,
          ry: 0.24,
          slant: s.cast ? 0.18 : 0.05,
          iris: 0.15,
          color: "#facc15",
          kumadori: "#ea580c",
          pupil: "none",
          hl: false,
          blink: bl,
          ex: s.ex,
          ey: s.ey,
        });
        if (bl <= 0.65) {
          const px = side * r * 0.30 + s.ex * 0.45;
          const py = -r * 0.08 + s.ey * 0.45;
          c.fillStyle = INK;
          c.fillRect(px - r * 0.10, py - r * 0.032, r * 0.20, r * 0.064);
          c.fillStyle = WHITE;
          c.beginPath();
          c.arc(px - r * 0.05, py - r * 0.05, r * 0.035, 0, TAU);
          c.fill();
        }
      }
      brow(c, -1, r, 0.41, s.cast ? 0.14 : 0.04, 3.6, 0.36);
      brow(c, 1, r, 0.41, s.cast ? 0.14 : 0.04, 3.6, 0.36);
      mouth(c, r, s.cast ? "shout" : "smile");
      return;
    }

    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.255,
        ry: 0.255,
        slant: s.cast ? 0.15 : 0,
        iris: 0.15,
        color: "#2b8cff",
        hl2: false,
        blink: blinkAmt(ball),
        ex: s.ex,
        ey: s.ey,
      });
    }
    brow(c, -1, r, 0.41, s.cast ? 0.1 : -0.02, 3.4, 0.36);
    brow(c, 1, r, 0.41, s.cast ? 0.1 : -0.02, 3.4, 0.36);
    mouth(c, r, s.cast ? "shout" : "smile");
  };

  // Classic carefree big round chibi eyes + left cheek scar (or Gear 4 Kabuki/Haki chibi eyes).
  F.luffy = (ball, r, c, s) => {
    const g4 = ball.ultTimer > 0;
    const mode = ball.gear4Mode;
    const bl = blinkAmt(ball);

    // Cheek scar under left eye
    c.strokeStyle = INK;
    c.lineCap = "round";
    c.lineWidth = 2.0;
    c.beginPath();
    c.moveTo(-r * 0.48, r * 0.16);
    c.lineTo(-r * 0.30, r * 0.20);
    c.moveTo(-r * 0.43, r * 0.13);
    c.lineTo(-r * 0.41, r * 0.22);
    c.moveTo(-r * 0.35, r * 0.14);
    c.lineTo(-r * 0.33, r * 0.23);
    c.stroke();

    if (g4 && mode === "snakeman") {
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.235,
          ry: 0.22,
          slant: 0.35,
          iris: 0.135,
          color: "#e11d48",
          innerRing: "#facc15",
          kumadori: "#881337",
          blink: bl * 0.8,
          ex: s.ex,
          ey: s.ey,
        });
        brow(c, side, r, 0.40, 0.15, 4.0, 0.38);
      }
      mouth(c, r, s.cast ? "shout" : "fang");
      return;
    }

    if (g4) {
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.235,
          ry: 0.23,
          slant: 0.30,
          iris: 0.13,
          color: "#dc2626",
          kumadori: "#18181b",
          blink: bl * 0.8,
          ex: s.ex,
          ey: s.ey,
        });
        brow(c, side, r, 0.40, 0.16, 4.4, 0.4);
      }
      mouth(c, r, "bouncemanGrit");
      return;
    }

    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.255,
        ry: 0.255,
        iris: 0.14,
        color: INK,
        hl2: false,
        blink: bl,
        ex: s.ex,
        ey: s.ey,
      });
    }
    mouth(c, r, s.cast ? "shout" : "smile");
  };

  // Moody chibi brawler: big round amber eyes, heavy angled brows, compact frown/grit.
  F.ichigo = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.24,
        ry: 0.24,
        slant: s.cast ? 0.38 : 0.26,
        iris: 0.14,
        color: "#8a5a2b",
        ring: "#6b4a73",
        lidArc: true,
        blink: blinkAmt(ball),
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.40, 0.14, 4.4, 0.4);
    }
    mouth(c, r, s.cast ? "grit" : "frown");
  };

  // Scarred chibi berserker: big cold round left eye, scarred-shut right eye, flat mouth.
  F.guts = (ball, r, c, s) => {
    eye(c, r, -1, {
      rx: 0.24,
      ry: 0.23,
      slant: 0.28,
      iris: 0.135,
      ring: "#4a3552",
      lidArc: true,
      blink: blinkAmt(ball) * 0.6,
      ex: s.ex,
      ey: s.ey,
    });
    // Scarred shut viewer-right eye
    c.strokeStyle = INK;
    c.lineCap = "round";
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(r * 0.15, -r * 0.09);
    c.lineTo(r * 0.48, -r * 0.04);
    c.stroke();
    c.lineWidth = 2.2;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      c.moveTo(r * (0.24 + i * 0.09), -r * 0.26);
      c.lineTo(r * (0.21 + i * 0.09), r * 0.10);
    }
    c.stroke();
    brow(c, -1, r, 0.40, 0.16, 4.4, 0.38);
    brow(c, 1, r, 0.40, 0.16, 4.4, 0.38);
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Cool unbothered chibi delinquent: big round teal eyes with top lid arc, flat line mouth.
  F.jotaro = (ball, r, c, s) => {
    const col = s.ult || s.cast ? "#00f0ff" : "#1f9d8a";
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.24,
        ry: 0.23,
        slant: 0.22,
        iris: 0.135,
        color: col,
        lidArc: true,
        blink: blinkAmt(ball) * 0.5,
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.40, 0.08, 4.0, 0.38);
    }
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Sly chibi vampire: big round crimson slit-pupil eyes, asymmetric brows, cheeky smug/fang smirk.
  F.dio = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.245,
        ry: 0.24,
        slant: 0.18,
        iris: 0.15,
        color: s.ult ? "#e5252a" : "#c0392b",
        slit: true,
        lash: true,
        blink: blinkAmt(ball) * 0.7,
        ex: s.ex,
        ey: s.ey,
      });
    }
    brow(c, -1, r, 0.40, 0.11, 3.8, 0.38);
    brow(c, 1, r, 0.45, -0.04, 3.8, 0.38);
    mouth(c, r, s.ult ? "fang" : "smug");
  };

  // Honored Chibi Sorcerer (Six Eyes): big crystalline sky-blue chibi eyes, white lashes & brows, smug smirk.
  F.gojo = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.25,
        ry: 0.24,
        slant: 0.1,
        iris: 0.15,
        color: "#38bdf8",
        innerRing: "#e0f2fe",
        pupilColor: "#0c4a6e",
        hl2: true,
        lash: true,
        lashColor: "#f8fafc",
        blink: blinkAmt(ball) * 0.5,
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.40, 0.05, 3.4, 0.36, "#e2e8f0");
    }
    mouth(c, r, s.cast ? "grin" : "smug");
  };

  // Chibi King of Curses: big crimson slit eyes + compact cheekbone eye slits + fanged smirk.
  F.sukuna = (ball, r, c, s) => {
    const hot = s.ult || s.cast;
    const bl = blinkAmt(ball);
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.23,
        ry: 0.22,
        slant: hot ? 0.3 : 0.2,
        iris: 0.135,
        color: hot ? "#ff2e44" : "#dc2626",
        sclera: "#fff5f5",
        slit: true,
        lash: true,
        blink: bl * 0.8,
        ex: s.ex,
        ey: s.ey,
        dx: 0.30,
        dy: -0.01,
      });
      // Compact lower cheekbone eye slits placed cleanly below the big chibi eye
      eye(c, r, side, {
        rx: 0.095,
        ry: 0.042,
        slant: 0.2,
        iris: 0.048,
        color: "#ef4444",
        sclera: "#fee2e2",
        slit: true,
        hl: false,
        outlineW: 2,
        blink: bl * 0.6,
        ex: (s.ex || 0) * 0.4,
        ey: (s.ey || 0) * 0.2,
        dx: 0.48,
        dy: 0.24,
      });
      brow(c, side, r, 0.39, 0.12, 3.6, 0.38);
    }
    mouth(c, r, hot ? "demon" : "sukunaSmirk");
  };

  // Chibi Lightning Assassin (Killua): big round sapphire chibi eyes + compact ':3' cat smirk (slit & fang in Godspeed).
  F.killua = (ball, r, c, s) => {
    const isGodspeed = s.ult || s.cast;
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.25,
        ry: 0.25,
        slant: isGodspeed ? 0.26 : 0.1,
        iris: 0.15,
        color: isGodspeed ? "#38bdf8" : "#1e40af",
        innerRing: isGodspeed ? "#e0f2fe" : "#60a5fa",
        hl2: true,
        slit: isGodspeed,
        blink: blinkAmt(ball) * 0.6,
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.41, isGodspeed ? 0.12 : 0.04, 3.2, 0.34, INK);
    }
    if (isGodspeed) {
      mouth(c, r, "fang");
    } else {
      c.save();
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(-r * 0.19, r * 0.23);
      c.quadraticCurveTo(-r * 0.095, r * 0.32, 0, r * 0.24);
      c.quadraticCurveTo(r * 0.095, r * 0.32, r * 0.19, r * 0.22);
      c.stroke();
      c.restore();
    }
  };

  // Chibi Enhancer Prodigy (Gon): big earnest amber-hazel round chibi eyes and bright classic smile.
  F.gon = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.255,
        ry: 0.255,
        slant: s.cast ? 0.18 : 0.06,
        iris: 0.155,
        color: "#b45309",
        innerRing: "#f59e0b",
        hl2: true,
        blink: blinkAmt(ball),
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.41, s.cast ? 0.12 : 0.02, 3.4, 0.36, INK);
    }
    mouth(c, r, s.cast ? "shout" : "smile");
  };

  // Chibi Shadow Monarch (Jin-Woo): big sharp cyan/purple glowing Monarch chibi eyes + subtle outer wisp + cool flat mouth.
  F.jinwoo = (ball, r, c, s) => {
    const isArise = s.ult || s.cast;
    const eyeCol = isArise ? "#c084fc" : "#38bdf8";
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.24,
        ry: 0.23,
        slant: 0.24,
        iris: 0.14,
        color: eyeCol,
        innerRing: "#ffffff",
        lidArc: true,
        blink: blinkAmt(ball) * 0.5,
        ex: s.ex,
        ey: s.ey,
      });
      c.save();
      c.fillStyle = isArise ? "#a855f7" : "#38bdf8";
      c.shadowColor = eyeCol;
      c.shadowBlur = 7;
      c.beginPath();
      c.moveTo(side * r * 0.52, -r * 0.12);
      c.quadraticCurveTo(side * r * 0.68, -r * 0.17, side * r * 0.76, -r * 0.28);
      c.quadraticCurveTo(side * r * 0.64, -r * 0.07, side * r * 0.52, -r * 0.07);
      c.closePath();
      c.fill();
      c.restore();
      brow(c, side, r, 0.40, 0.11, 3.6, 0.36);
    }
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Chibi Hero Hunter (Garou): big golden wolf-slit chibi eyes (pinkish-red right eye), scar, angled brows, fang smirk.
  F.garou = (ball, r, c, s) => {
    c.save();
    c.strokeStyle = "#991b1b";
    c.lineWidth = 2.4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(r * 0.28, -r * 0.32);
    c.lineTo(r * 0.34, r * 0.18);
    c.stroke();
    c.restore();

    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.24,
        ry: 0.235,
        slant: 0.28,
        iris: 0.145,
        color: "#f59e0b",
        innerRing: "#fef08a",
        sclera: side === 1 ? "#fecaca" : WHITE,
        slit: true,
        lidArc: true,
        blink: blinkAmt(ball) * 0.6,
        ex: s.ex,
        ey: s.ey,
      });
      brow(c, side, r, 0.40, 0.14, 3.8, 0.38);
    }
    mouth(c, r, s.cast ? "demon" : "fang");
  };

  // Chibi Uchiha Prodigy (Sasuke): big round crimson Sharingan eyes (3 tomoe in Base, Mangekyou in Ult/Cast), cool smirk.
  F.sasuke = (ball, r, c, s) => {
    const ms = s.ult || s.cast;
    const cm = Boolean(ball.curseMarkMode);
    const bl = blinkAmt(ball) * 0.5;

    if (cm) {
      // Curse Mark Stage 2 grayish-brown skin tint + dark cross/star mark across nose bridge
      c.save();
      c.beginPath();
      c.arc(0, 0, r - 1.5, 0, TAU);
      c.clip();
      c.fillStyle = "rgba(120, 113, 108, 0.56)";
      c.fillRect(-r, -r, r * 2, r * 2);

      // Iconic dark CM2 cross/star marking over the nose bridge
      c.fillStyle = "#1c1917";
      c.beginPath();
      c.moveTo(0, -r * 0.24);
      c.lineTo(r * 0.14, -r * 0.04);
      c.lineTo(0, r * 0.12);
      c.lineTo(-r * 0.14, -r * 0.04);
      c.closePath();
      c.fill();
      c.restore();
    }

    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.245,
        ry: 0.24,
        slant: 0.2,
        iris: 0.15,
        sclera: cm ? "#1c1917" : "#ffffff",
        color: cm ? "#f59e0b" : "#dc2626",
        innerRing: cm ? "#b91c1c" : "#7f1d1d",
        lidArc: true,
        blink: bl,
        ex: s.ex,
        ey: s.ey,
      });
      if (bl <= 0.65) {
        const px = side * r * 0.30 + (s.ex || 0) * 0.45;
        const py = -r * 0.08 + (s.ey || 0) * 0.45;
        c.save();
        c.translate(px, py);
        if (ms) {
          // Mangekyou Sharingan star spokes
          c.strokeStyle = INK;
          c.lineWidth = 1.6;
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            c.beginPath();
            c.moveTo(0, 0);
            c.lineTo(Math.cos(a) * r * 0.11, Math.sin(a) * r * 0.11);
            c.stroke();
          }
        } else {
          // 3 Sharingan Tomoe dots
          c.fillStyle = INK;
          for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3 - Math.PI * 0.5;
            c.beginPath();
            c.arc(Math.cos(a) * r * 0.09, Math.sin(a) * r * 0.09, r * 0.024, 0, TAU);
            c.fill();
          }
        }
        c.restore();
      }
      brow(c, side, r, 0.40, 0.12, 3.6, 0.36);
    }
    mouth(c, r, s.cast ? "grit" : "smirk");
  };
})();
