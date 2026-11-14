// Per-character anime faces: eye shape, brows, mouth and personality. Called by drawBall instead of the generic smiley.
// Personalities: cheerful (goku, naruto, luffy), dark (ichigo, guts, sukuna), cool (jotaro, gojo), sly (dio).
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

  function brow(c, side, r, y, tilt, w = 4, len = 0.52, col = INK) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round";
    c.beginPath();
    c.moveTo(side * r * (0.1 + len), -r * (y + tilt));
    c.lineTo(side * r * 0.1, -r * (y - tilt));
    c.stroke();
  }

  // o: rx, ry, slant (angry tilt), iris, color, lid (0..1 top coverage), ex, ey (look offset),
  //    ring (dark eye-bag colour), kumadori (full kabuki eye ring), slit (vertical pupil),
  //    lash (eyeliner flick), lashColor, hl2 (extra highlight), blink, dx, dy
  function eye(c, r, side, o) {
    const rx = r * o.rx, ry = r * o.ry;
    const lid = Math.max(o.lid || 0, o.blink || 0);
    c.save();
    c.translate(side * r * (o.dx || 0.32), -r * 0.08 + (o.dy || 0) * r);
    c.rotate(-side * (o.slant || 0));
    if (o.kumadori) {
      c.fillStyle = o.kumadori;
      c.beginPath();
      c.ellipse(0, 0, rx * 1.38, ry * 1.42, 0, 0, TAU);
      c.fill();
    } else if (o.ring) {
      c.strokeStyle = o.ring; c.lineWidth = 3.2; c.lineCap = "round";
      c.beginPath(); c.ellipse(0, ry * 0.55, rx * 1.05, ry * 0.8, 0, Math.PI * 0.12, Math.PI * 0.88); c.stroke();
    }
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU);
    c.fillStyle = o.sclera || WHITE; c.fill();
    c.save(); c.clip();
    const ir = r * (o.iris || 0.14);
    const ox = Math.max(-rx * 0.4, Math.min(rx * 0.4, o.ex || 0));
    const oy = Math.max(-ry * 0.3, Math.min(ry * 0.3, o.ey || 0));
    c.fillStyle = o.color || INK;
    c.beginPath(); c.arc(ox, oy, ir, 0, TAU); c.fill();
    if (o.innerRing) {
      c.strokeStyle = o.innerRing; c.lineWidth = 1.6;
      c.beginPath(); c.arc(ox, oy, ir * 0.72, 0, TAU); c.stroke();
    }
    c.fillStyle = o.pupilColor || INK;
    if (o.slit) {
      c.beginPath(); c.ellipse(ox, oy, ir * 0.22, ir * 0.92, 0, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(ox, oy, ir * 0.48, 0, TAU); c.fill();
    }
    c.fillStyle = WHITE;
    c.beginPath(); c.arc(ox - ir * 0.35, oy - ir * 0.4, ir * 0.3, 0, TAU); c.fill();
    if (o.hl2) { c.beginPath(); c.arc(ox + ir * 0.4, oy + ir * 0.35, ir * 0.15, 0, TAU); c.fill(); }
    if (lid) { c.fillStyle = o.lidColor || COLORS.skin; c.fillRect(-rx - 2, -ry - 2, rx * 2 + 4, ry * 2 * lid + 2); }
    c.restore();
    c.lineWidth = 2.5; c.strokeStyle = INK;
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
    if (lid) {
      const ly = -ry + ry * 2 * lid;
      c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(-rx, ly); c.lineTo(rx, ly); c.stroke();
    }
    if (o.lash) {
      c.strokeStyle = o.lashColor || INK;
      c.lineWidth = 2.8; c.lineCap = "round";
      c.beginPath();
      c.moveTo(side * rx * 0.7, -ry * 0.6); c.lineTo(side * (rx + r * 0.1), -ry * 1.05);
      c.moveTo(side * rx * 0.85, -ry * 0.1); c.lineTo(side * (rx + r * 0.13), -ry * 0.3);
      c.stroke();
    }
    c.restore();
  }

  function mouth(c, r, kind) {
    c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 3; c.lineCap = c.lineJoin = "round";
    const grin = (half, depth, y0 = 0.2) => {
      c.beginPath();
      c.moveTo(-r * half, r * y0);
      c.quadraticCurveTo(0, r * depth, r * half, r * y0);
      c.closePath();
      c.save(); c.fillStyle = "#7a1f2b"; c.fill(); c.clip();
      c.fillStyle = WHITE; c.fillRect(-r, r * (y0 - 0.02), r * 2, r * 0.13);
      c.restore();
      c.stroke();
    };
    switch (kind) {
      case "smirk":
        c.beginPath(); c.moveTo(-r * 0.24, r * 0.3); c.quadraticCurveTo(r * 0.02, r * 0.46, r * 0.28, r * 0.2); c.stroke(); break;
      case "calm":
        c.beginPath(); c.moveTo(-r * 0.16, r * 0.3); c.quadraticCurveTo(0, r * 0.38, r * 0.16, r * 0.3); c.stroke(); break;
      case "smug":
        c.beginPath(); c.moveTo(-r * 0.2, r * 0.34); c.quadraticCurveTo(r * 0.06, r * 0.4, r * 0.3, r * 0.2); c.stroke();
        c.beginPath(); c.moveTo(r * 0.3, r * 0.2); c.lineTo(r * 0.36, r * 0.13); c.stroke(); break;
      case "grin": grin(0.34, 0.72); break;
      case "bigGrin": grin(0.46, 0.78); break;
      case "frown":
        c.beginPath(); c.arc(0, r * 0.56, r * 0.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); break;
      case "flat":
        c.beginPath(); c.moveTo(-r * 0.2, r * 0.34); c.lineTo(r * 0.2, r * 0.34); c.stroke(); break;
      case "fang":
        c.beginPath(); c.moveTo(-r * 0.26, r * 0.28); c.quadraticCurveTo(0, r * 0.44, r * 0.3, r * 0.18); c.stroke();
        c.fillStyle = WHITE; c.lineWidth = 2;
        c.beginPath(); c.moveTo(-r * 0.16, r * 0.31); c.lineTo(-r * 0.1, r * 0.46); c.lineTo(-r * 0.04, r * 0.34); c.closePath(); c.fill(); c.stroke();
        break;
      case "sukunaSmirk":
        c.beginPath(); c.moveTo(-r * 0.28, r * 0.31); c.quadraticCurveTo(r * 0.04, r * 0.44, r * 0.32, r * 0.22); c.stroke();
        c.fillStyle = WHITE; c.lineWidth = 2;
        c.beginPath(); c.moveTo(r * 0.15, r * 0.31); c.lineTo(r * 0.22, r * 0.44); c.lineTo(r * 0.27, r * 0.26); c.closePath(); c.fill(); c.stroke();
        break;
      case "demon":
        grin(0.4, 0.7, 0.28);
        c.fillStyle = WHITE; c.lineWidth = 2;
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(s * r * 0.26, r * 0.3); c.lineTo(s * r * 0.21, r * 0.45); c.lineTo(s * r * 0.15, r * 0.32); c.closePath(); c.fill(); c.stroke();
        }
        break;
      case "shout":
        c.beginPath(); c.ellipse(0, r * 0.38, r * 0.16, r * 0.2, 0, 0, TAU); c.fill();
        c.fillStyle = "#ff5a5f"; c.beginPath(); c.ellipse(0, r * 0.45, r * 0.09, r * 0.07, 0, 0, TAU); c.fill(); break;
      case "grit":
        c.fillStyle = WHITE; c.lineWidth = 2.5;
        c.beginPath(); c.rect(-r * 0.26, r * 0.26, r * 0.52, r * 0.16); c.fill(); c.stroke();
        c.beginPath(); for (const x of [-0.13, 0, 0.13]) { c.moveTo(r * x, r * 0.26); c.lineTo(r * x, r * 0.42); } c.stroke(); break;
      case "bouncemanGrit":
        // Wide Kabuki scowl-grin with clenched teeth
        c.fillStyle = WHITE; c.lineWidth = 2.8;
        c.beginPath();
        c.moveTo(-r * 0.38, r * 0.24);
        c.quadraticCurveTo(0, r * 0.18, r * 0.38, r * 0.24);
        c.lineTo(r * 0.34, r * 0.44);
        c.quadraticCurveTo(0, r * 0.38, -r * 0.34, r * 0.44);
        c.closePath();
        c.fill(); c.stroke();
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-r * 0.35, r * 0.32); c.lineTo(r * 0.35, r * 0.32);
        for (const x of [-0.2, -0.07, 0.07, 0.2]) { c.moveTo(r * x, r * 0.22); c.lineTo(r * x, r * 0.42); }
        c.stroke();
        break;
    }
  }

  // Cheerful hero in Base; intense crimson-eyed Saiyan battle grit in Kaioken!
  F.goku = (ball, r, c, s) => {
    const sl = s.ult ? 0.56 : s.cast ? 0.4 : 0.22;
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.19,
        ry: s.ult ? 0.21 : 0.23,
        slant: sl,
        iris: 0.16,
        color: s.ult ? "#e11d48" : INK,
        innerRing: s.ult ? "#fecdd3" : null,
        bag: s.ult ? "rgba(225, 29, 72, 0.28)" : null,
        hl2: true,
        blink: s.ult ? 0 : blinkAmt(ball),
        ex: s.ex,
        ey: s.ey,
      });
    }
    brow(c, -1, r, 0.48, s.ult ? 0.22 : 0.06, s.ult ? 4 : 3.5, 0.44);
    brow(c, 1, r, 0.48, s.ult ? 0.22 : 0.06, s.ult ? 4 : 3.5, 0.44);
    if (s.ult) {
      // Kaioken cheek battle lines & forehead vein mark
      c.strokeStyle = "#be123c";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.54, r * 0.12); c.lineTo(-r * 0.38, r * 0.16);
      c.moveTo(r * 0.54, r * 0.12); c.lineTo(r * 0.38, r * 0.16);
      c.stroke();
    }
    mouth(c, r, s.ult ? "bouncemanGrit" : s.cast ? "shout" : "grin");
  };

  // Sunny, wide open blue eyes (or glowing white Four-Tails / Six-Tails Kyuubi eyes & jagged teeth in kyuubiMode).
  F.naruto = (ball, r, c, s) => {
    if (ball.kyuubiMode) {
      const boneSkin = ball.skin === "naruto_six_tails_bone";
      c.save();
      // Glowing circular pure-white beast eyes (positioned inside bone eye sockets when Six-Tails Skeletal skin is active)
      for (const side of [-1, 1]) {
        const ex = side * r * (boneSkin ? 0.33 : 0.28) + s.ex * 0.35;
        const ey = -r * (boneSkin ? 0.14 : 0.08) + s.ey * 0.35;
        c.fillStyle = "rgba(254, 202, 202, 0.38)";
        c.beginPath();
        c.arc(ex, ey, r * (boneSkin ? 0.16 : 0.21), 0, TAU);
        c.fill();
        c.fillStyle = WHITE;
        c.strokeStyle = "#ef4444";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(ex, ey, r * (boneSkin ? 0.115 : 0.145), 0, TAU);
        c.fill();
        c.stroke();
      }
      // Glowing white sawtooth / zigzag monster mouth
      const mw = r * (boneSkin ? 0.34 : 0.48);
      const my = r * (boneSkin ? 0.35 : 0.26);
      const teeth = 5;
      c.fillStyle = WHITE;
      c.strokeStyle = boneSkin ? INK : "#ef4444";
      c.lineWidth = 2.2;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(-mw, my);
      for (let i = 1; i <= teeth * 2; i++) {
        const tx = -mw + (mw * 2 * i) / (teeth * 2);
        const ty = my + (i % 2 === 1 ? -r * 0.09 : r * 0.07);
        c.lineTo(tx, ty);
      }
      for (let i = teeth * 2 - 1; i >= 0; i--) {
        const tx = -mw + (mw * 2 * i) / (teeth * 2);
        const ty = my + (i % 2 === 1 ? r * 0.04 : r * 0.17);
        c.lineTo(tx, ty);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
      return;
    }
    if (ball.evolved) {
      // Toad Sage Mode: Red-orange Senjutsu eye-shadow pigmentation + Golden-yellow Toad eyes with horizontal bar pupils
      const bl = blinkAmt(ball);
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.21,
          ry: 0.25,
          slant: s.cast ? 0.32 : 0.14,
          iris: 0.18,
          color: "#facc15",
          kumadori: "#ea580c",
          pupil: "none",
          hl: false,
          blink: bl,
          ex: s.ex,
          ey: s.ey,
        });
        if (bl < 0.7) {
          // Horizontal Toad Sage bar pupil
          const px = side * r * 0.32 + s.ex * 0.55;
          const py = -r * 0.06 + s.ey * 0.55;
          c.fillStyle = INK;
          c.fillRect(px - r * 0.11, py - r * 0.032, r * 0.22, r * 0.064);
          c.fillStyle = WHITE;
          c.beginPath();
          c.arc(px - r * 0.05, py - r * 0.05, r * 0.032, 0, TAU);
          c.fill();
        }
      }
      brow(c, -1, r, 0.5, s.cast ? 0.2 : 0.08, 3.8, 0.44);
      brow(c, 1, r, 0.5, s.cast ? 0.2 : 0.08, 3.8, 0.44);
      mouth(c, r, s.cast ? "shout" : "grin");
      return;
    }
    for (const side of [-1, 1]) {
      eye(c, r, side, { rx: 0.21, ry: 0.27, slant: s.cast ? 0.3 : 0.05, iris: 0.18, color: "#2b8cff", hl2: true, blink: blinkAmt(ball), ex: s.ex, ey: s.ey });
    }
    brow(c, -1, r, 0.52, s.cast ? 0.16 : -0.02, 3.5, 0.42); brow(c, 1, r, 0.52, s.cast ? 0.16 : -0.02, 3.5, 0.42);
    mouth(c, r, s.cast ? "shout" : "bigGrin");
  };

  // Bone-simple dot eyes, X-shaped scar under the left eye. Gear 4 changes the whole expression.
  F.luffy = (ball, r, c, s) => {
    const g4 = ball.ultTimer > 0;
    const mode = ball.gear4Mode;
    const bl = blinkAmt(ball);
    // Cheek scar under left eye
    c.strokeStyle = INK; c.lineCap = "round"; c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(-r * 0.44, r * 0.1); c.lineTo(-r * 0.26, r * 0.15);
    c.moveTo(-r * 0.39, r * 0.07); c.lineTo(-r * 0.37, r * 0.17);
    c.moveTo(-r * 0.31, r * 0.08); c.lineTo(-r * 0.29, r * 0.18);
    c.stroke();

    if (g4 && mode === "snakeman") {
      // Snakeman: crimson-black Haki eye shadow, sharp fierce eyes with crimson-gold irises, sweeping flame brows
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.19, ry: 0.135, slant: 0.44, iris: 0.11, color: "#e11d48", innerRing: "#facc15",
          kumadori: "#881337", blink: bl * 0.8, ex: s.ex, ey: s.ey,
        });
        brow(c, side, r, 0.34, 0.2, 4.6, 0.52);
      }
      mouth(c, r, s.cast ? "shout" : "fang");
      return;
    }
    if (g4) {
      // Bounceman: thick black Kabuki kumadori eye-rings, intense pin-point pupils, heavy scowl & clenched teeth
      for (const side of [-1, 1]) {
        eye(c, r, side, {
          rx: 0.19, ry: 0.16, slant: 0.38, iris: 0.09, color: "#dc2626",
          kumadori: "#18181b", blink: bl * 0.8, ex: s.ex, ey: s.ey,
        });
        brow(c, side, r, 0.35, 0.22, 5.2, 0.5);
      }
      mouth(c, r, "bouncemanGrit");
      return;
    }
    c.fillStyle = INK;
    for (const side of [-1, 1]) {
      const h = r * 0.1 * (1 - bl * 0.85);
      c.beginPath(); c.ellipse(side * r * 0.32, -r * 0.06, r * 0.1, Math.max(1.2, h), 0, 0, TAU); c.fill();
      if (!bl) {
        c.fillStyle = WHITE; c.beginPath(); c.arc(side * r * 0.32 - r * 0.03, -r * 0.09, r * 0.035, 0, TAU); c.fill();
        c.fillStyle = INK;
      }
    }
    mouth(c, r, s.cast ? "shout" : "bigGrin");
  };

  // Dark, brooding scowl. Amber eyes under heavy brows with tired rings.
  F.ichigo = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, { rx: 0.17, ry: 0.2, slant: s.cast ? 0.55 : 0.4, iris: 0.14, color: "#8a5a2b", lid: 0.15, ring: "#6b4a73", blink: blinkAmt(ball), ex: s.ex, ey: s.ey });
    }
    brow(c, -1, r, 0.5, 0.18, 5); brow(c, 1, r, 0.5, 0.18, 5);
    mouth(c, r, s.cast ? "grit" : "frown");
  };

  F.guts = (ball, r, c, s) => {
    // viewer-left eye: narrow, cold, ringed. viewer-right eye: lost, scarred shut.
    eye(c, r, -1, { rx: 0.17, ry: 0.16, slant: 0.4, iris: 0.13, lid: 0.25, ring: "#4a3552", blink: blinkAmt(ball) * 0.6, ex: s.ex, ey: s.ey });
    c.strokeStyle = INK; c.lineCap = "round";
    c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(r * 0.16, -r * 0.1); c.lineTo(r * 0.5, -r * 0.03); c.stroke();
    c.lineWidth = 2.4;
    c.beginPath();
    for (let i = 0; i < 3; i++) { c.moveTo(r * (0.26 + i * 0.1), -r * 0.3); c.lineTo(r * (0.22 + i * 0.1), r * 0.14); }
    c.stroke();
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-r * 0.02, -r * 0.3); c.lineTo(r * 0.1, r * 0.08); c.stroke();
    brow(c, -1, r, 0.44, 0.22, 5); brow(c, 1, r, 0.44, 0.22, 5);
    c.fillStyle = INK;
    for (const [x, y] of [[-0.3, 0.46], [-0.1, 0.52], [0.1, 0.52], [0.3, 0.46], [-0.4, 0.34], [0.4, 0.34]]) {
      c.beginPath(); c.arc(r * x, r * y, 1.3, 0, TAU); c.fill();
    }
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Cool and unbothered. Half-lidded teal eyes, one flat line for a mouth. Chill until the time stop.
  F.jotaro = (ball, r, c, s) => {
    const col = s.ult || s.cast ? "#00f0ff" : "#1f9d8a";
    for (const side of [-1, 1]) {
      eye(c, r, side, { rx: 0.17, ry: 0.18, slant: 0.28, iris: 0.13, color: col, lid: s.cast ? 0.2 : 0.38, blink: blinkAmt(ball) * 0.5, ex: s.ex, ey: s.ey });
    }
    brow(c, -1, r, 0.5, 0.1, 4.5); brow(c, 1, r, 0.5, 0.1, 4.5);
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Sly aristocrat. Slit red pupils, eyeliner flicks and a single arched brow.
  F.dio = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, { rx: 0.18, ry: 0.2, slant: 0.22, iris: 0.16, color: s.ult ? "#e5252a" : "#c0392b", slit: true, lid: s.ult ? 0 : 0.22, lash: true, blink: blinkAmt(ball) * 0.7, ex: s.ex, ey: s.ey });
    }
    brow(c, -1, r, 0.5, 0.14, 4.2, 0.5);
    brow(c, 1, r, 0.58, -0.04, 4.2, 0.5);
    mouth(c, r, s.ult ? "fang" : "smug");
  };

  // Honored Sorcerer (Six Eyes). Cool crystalline sky-blue eyes, white lashes, confident smirk.
  F.gojo = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.19, ry: 0.15, slant: 0.16, iris: 0.135, color: "#38bdf8",
        innerRing: "#e0f2fe", pupilColor: "#0c4a6e", hl2: true, lid: 0.18,
        lash: true, lashColor: "#f8fafc", blink: blinkAmt(ball) * 0.5, ex: s.ex, ey: s.ey,
      });
      brow(c, side, r, 0.36, 0.06, 3.6, 0.44, "#e2e8f0");
    }
    mouth(c, r, s.cast ? "grin" : "smug");
  };

  // King of Curses. Four sharp crimson eyes (two upper + two cheekbone slits) and a sinister fanged smirk.
  F.sukuna = (ball, r, c, s) => {
    const hot = s.ult || s.cast;
    const bl = blinkAmt(ball);
    for (const side of [-1, 1]) {
      // Main upper crimson eyes
      eye(c, r, side, {
        rx: 0.175, ry: 0.11, slant: hot ? 0.38 : 0.28, iris: 0.105, color: hot ? "#ff2e44" : "#dc2626",
        sclera: "#fff5f5", slit: true, lash: true, blink: bl * 0.8, ex: s.ex, ey: s.ey,
        dx: 0.33, dy: -0.06,
      });
      // Secondary lower cursed eye slits (set cleanly on the outer cheekbone above the mouth)
      eye(c, r, side, {
        rx: 0.115, ry: 0.048, slant: 0.2, iris: 0.055, color: "#ef4444",
        sclera: "#fee2e2", slit: true, blink: bl * 0.6, ex: (s.ex || 0) * 0.5, ey: (s.ey || 0) * 0.3,
        dx: 0.42, dy: 0.09,
      });
      brow(c, side, r, 0.31, 0.14, 3.8, 0.44);
    }
    mouth(c, r, hot ? "demon" : "sukunaSmirk");
  };

  // Lightning Assassin (Killua). Big deep-sapphire cat eyes, playful ':3' cat smirk in Base, electric slit eyes in Godspeed.
  F.killua = (ball, r, c, s) => {
    const isGodspeed = s.ult || s.cast;
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.19, ry: 0.2, slant: isGodspeed ? 0.32 : 0.18,
        iris: 0.155, color: isGodspeed ? "#38bdf8" : "#1e40af",
        innerRing: isGodspeed ? "#e0f2fe" : "#60a5fa",
        hl2: true, slit: isGodspeed, lid: isGodspeed ? 0.1 : 0.14,
        blink: blinkAmt(ball) * 0.6, ex: s.ex, ey: s.ey,
      });
      brow(c, side, r, 0.29, isGodspeed ? 0.14 : 0.06, 3.2, 0.38, INK);
    }
    if (isGodspeed) {
      mouth(c, r, "fang");
    } else {
      // Killua's iconic ':3' mischievous cat mouth
      c.save();
      c.strokeStyle = INK;
      c.lineWidth = 2.8;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.beginPath();
      c.moveTo(-r * 0.24, r * 0.24);
      c.quadraticCurveTo(-r * 0.12, r * 0.36, 0, r * 0.25);
      c.quadraticCurveTo(r * 0.12, r * 0.36, r * 0.24, r * 0.22);
      c.stroke();
      c.restore();
    }
  };

  // Enhancer Prodigy (Gon Freecss). Big determined amber-hazel eyes and bright grin.
  F.gon = (ball, r, c, s) => {
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.2, ry: 0.22, slant: 0.12,
        iris: 0.16, color: "#b45309",
        innerRing: "#f59e0b",
        hl2: true, lid: s.cast ? 0.1 : 0.08,
        blink: blinkAmt(ball), ex: s.ex, ey: s.ey,
      });
      brow(c, side, r, 0.28, s.cast ? 0.14 : 0.04, 3.2, 0.38, INK);
    }
    mouth(c, r, s.cast ? "shout" : "grin");
  };

  // Shadow Monarch (Sung Jin-Woo). Narrow, razor-sharp glowing cyan/purple Monarch eyes with outward aura flare.
  F.jinwoo = (ball, r, c, s) => {
    const isArise = s.ult || s.cast;
    const eyeCol = isArise ? "#c084fc" : "#38bdf8";
    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.18, ry: 0.125, slant: 0.32, iris: 0.115,
        color: eyeCol, innerRing: "#ffffff", lid: 0.22,
        blink: blinkAmt(ball) * 0.5, ex: s.ex, ey: s.ey,
      });
      // Sleek lateral Monarch eye-glow wisp from outer corner of the eye
      c.save();
      c.fillStyle = isArise ? "#a855f7" : "#38bdf8";
      c.shadowColor = eyeCol;
      c.shadowBlur = 8;
      c.beginPath();
      c.moveTo(side * r * 0.46, -r * 0.11);
      c.quadraticCurveTo(side * r * 0.66, -r * 0.16, side * r * 0.76, -r * 0.28);
      c.quadraticCurveTo(side * r * 0.62, -r * 0.06, side * r * 0.45, -r * 0.06);
      c.closePath();
      c.fill();
      c.restore();
      brow(c, side, r, 0.26, 0.14, 3.8, 0.42);
    }
    mouth(c, r, s.cast ? "grit" : "flat");
  };

  // Hero Hunter (Garou). Intense golden-yellow wolf-predator eyes (bloodshot right eye), battle scar, and fanged grin.
  F.garou = (ball, r, c, s) => {
    // Vertical battle scar over viewer-right eye (drawn behind eye & brow)
    c.save();
    c.strokeStyle = "#991b1b";
    c.lineWidth = 2.4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(r * 0.3, -r * 0.26);
    c.lineTo(r * 0.35, r * 0.17);
    c.stroke();
    c.restore();

    for (const side of [-1, 1]) {
      eye(c, r, side, {
        rx: 0.18, ry: 0.14, slant: 0.36, iris: 0.12,
        color: "#f59e0b",
        innerRing: "#fef08a",
        sclera: side === 1 ? "#fecaca" : WHITE,
        slit: true, lid: 0.16,
        blink: blinkAmt(ball) * 0.6, ex: s.ex, ey: s.ey,
      });
      brow(c, side, r, 0.26, 0.16, 4.0, 0.42);
    }
    mouth(c, r, s.cast ? "demon" : "fang");
  };
})();
