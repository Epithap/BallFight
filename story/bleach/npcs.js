// Bleach Story Saga: Chibi Ball Art + 12 Live Animated Expressions / Moods
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const INK = "#2b1b3d";
  const TAU = Math.PI * 2;

  // 12 Supported Moods:
  // "neutral", "talking", "serious", "shocked", "angry", "smirk",
  // "sweat", "happy", "suspicious", "sleepy", "battle", "deadpan"
  const MOOD_LIST = [
    "neutral", "talking", "serious", "shocked", "angry", "smirk",
    "sweat", "happy", "suspicious", "sleepy", "battle", "deadpan",
  ];

  // Natural periodic blink (0 = open, 1 = closed)
  function getBlink(t, seed = 0) {
    const cycle = (t + seed * 1.37) % 3.4;
    if (cycle > 0.13) return 0;
    return Math.sin((cycle / 0.13) * Math.PI);
  }

  function drawChibiEye(c, r, side, opts) {
    const mood = opts.mood || "neutral";
    const rx = r * (opts.rx ?? 0.22);
    const ry = r * (opts.ry ?? 0.235);
    const dx = side * r * (opts.dx ?? 0.29);
    const dy = -r * (opts.dy ?? 0.04);
    const blink = opts.blink || 0;

    c.save();
    c.translate(dx, dy);

    // Comedic deadpan white/dot eyes
    if (mood === "deadpan") {
      c.fillStyle = "#ffffff";
      c.strokeStyle = INK;
      c.lineWidth = 2.2;
      c.beginPath(); c.ellipse(0, 0, rx * 0.9, ry * 0.72, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = INK;
      c.beginPath(); c.arc(0, 0, rx * 0.18, 0, TAU); c.fill();
      c.restore();
      return;
    }

    // Happy curved arc eyes (^ ^)
    if (mood === "happy") {
      c.strokeStyle = INK;
      c.lineWidth = Math.max(2.4, r * 0.10);
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, ry * 0.2, rx * 0.82, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
      c.restore();
      return;
    }

    // Blink closed line
    if (blink > 0.65) {
      c.strokeStyle = INK;
      c.lineWidth = Math.max(2.4, r * 0.095);
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, rx * 0.82, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
      c.restore();
      return;
    }

    let openScale = 1 - blink * 0.7;
    if (mood === "shocked") openScale *= 1.16;
    if (mood === "suspicious" || mood === "sweat") openScale *= 0.68;
    if (mood === "sleepy") openScale *= 0.58;

    const curRy = ry * openScale;
    if (opts.slant) c.rotate(-side * opts.slant * 0.28);

    // White sclera
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.ellipse(0, 0, rx, curRy, 0, 0, TAU);
    c.fill();

    // Clipped iris + pupil
    c.save();
    c.beginPath();
    c.ellipse(0, 0, rx, curRy, 0, 0, TAU);
    c.clip();

    const lookX = ((opts.lookX || 0) + (mood === "suspicious" ? 0.8 : 0)) * r * 0.05;
    const irisScale = mood === "shocked" ? 0.44 : 0.64;

    c.fillStyle = opts.irisColor;
    c.beginPath();
    c.arc(lookX, r * 0.01, rx * irisScale, 0, TAU);
    c.fill();

    if (opts.irisHighlight && mood !== "shocked") {
      c.fillStyle = opts.irisHighlight;
      c.beginPath();
      c.arc(lookX, r * 0.03, rx * (irisScale * 0.68), 0, TAU);
      c.fill();
    }

    c.fillStyle = INK;
    c.beginPath();
    c.arc(lookX, r * 0.01, rx * (mood === "shocked" ? 0.18 : 0.30), 0, TAU);
    c.fill();

    // Catchlights
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.arc(lookX - rx * 0.22, -curRy * 0.25, rx * 0.20, 0, TAU);
    c.fill();
    c.beginPath();
    c.arc(lookX + rx * 0.18, curRy * 0.22, rx * 0.09, 0, TAU);
    c.fill();

    // Half-lidded top eyelid for sleepy / sweat / suspicious
    if (mood === "sleepy" || mood === "sweat" || mood === "suspicious") {
      c.fillStyle = opts.skinColor || "#fbd3b0";
      c.fillRect(-rx * 1.2, -curRy * 1.1, rx * 2.4, curRy * 0.72);
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(-rx, -curRy * 0.38); c.lineTo(rx, -curRy * 0.38); c.stroke();
    }
    c.restore();

    // Eye outline
    c.strokeStyle = INK;
    c.lineWidth = Math.max(2, r * 0.085);
    c.beginPath();
    c.ellipse(0, 0, rx, curRy, 0, 0, TAU);
    c.stroke();

    if (opts.lash) {
      c.strokeStyle = INK;
      c.lineWidth = Math.max(2.2, r * 0.095);
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 0, rx * 1.03, Math.PI * 1.12, Math.PI * 1.88);
      c.stroke();
    }
    c.restore();
  }

  function drawBrowsAndMouth(c, r, mood, t, isTalking) {
    c.save();
    c.strokeStyle = INK;
    c.lineWidth = Math.max(2.3, r * 0.095);
    c.lineCap = "round";

    // Eyebrows per mood
    if (mood === "angry" || mood === "battle") {
      c.beginPath(); c.moveTo(-r * 0.50, -r * 0.38); c.lineTo(-r * 0.12, -r * 0.22); c.stroke();
      c.beginPath(); c.moveTo(r * 0.50, -r * 0.38); c.lineTo(r * 0.12, -r * 0.22); c.stroke();
    } else if (mood === "shocked" || mood === "happy") {
      c.beginPath(); c.moveTo(-r * 0.48, -r * 0.34); c.quadraticCurveTo(-r * 0.30, -r * 0.44, -r * 0.14, -r * 0.34); c.stroke();
      c.beginPath(); c.moveTo(r * 0.14, -r * 0.34); c.quadraticCurveTo(r * 0.30, -r * 0.44, r * 0.48, -r * 0.34); c.stroke();
    } else if (mood === "sweat" || mood === "sleepy") {
      c.beginPath(); c.moveTo(-r * 0.48, -r * 0.28); c.lineTo(-r * 0.15, -r * 0.34); c.stroke();
      c.beginPath(); c.moveTo(r * 0.48, -r * 0.28); c.lineTo(r * 0.15, -r * 0.34); c.stroke();
    } else if (mood === "smirk") {
      c.beginPath(); c.moveTo(-r * 0.48, -r * 0.34); c.lineTo(-r * 0.14, -r * 0.25); c.stroke();
      c.beginPath(); c.moveTo(r * 0.14, -r * 0.32); c.lineTo(r * 0.48, -r * 0.36); c.stroke();
    } else {
      c.beginPath(); c.moveTo(-r * 0.48, -r * 0.33); c.lineTo(-r * 0.14, -r * 0.25); c.stroke();
      c.beginPath(); c.moveTo(r * 0.48, -r * 0.33); c.lineTo(r * 0.14, -r * 0.25); c.stroke();
    }

    // Mouth per mood / talking state
    const talkOpen = isTalking || mood === "talking" ? Math.abs(Math.sin(t * 11)) : 0;
    const my = r * 0.27;

    if (talkOpen > 0.25) {
      c.fillStyle = "#be123c";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, my, r * 0.13, r * (0.06 + talkOpen * 0.09), 0, 0, TAU);
      c.fill();
      c.stroke();
    } else if (mood === "shocked") {
      c.fillStyle = "#be123c";
      c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, my, r * 0.12, r * 0.14, 0, 0, TAU); c.fill(); c.stroke();
    } else if (mood === "angry" || mood === "battle") {
      // Grit teeth / fierce mouth
      c.fillStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath(); c.roundRect(-r * 0.18, my - r * 0.06, r * 0.36, r * 0.13, 3); c.fill(); c.stroke();
    } else if (mood === "happy") {
      c.fillStyle = "#fb7185";
      c.lineWidth = 2;
      c.beginPath(); c.arc(0, my - r * 0.03, r * 0.15, 0, Math.PI); c.fill(); c.stroke();
    } else if (mood === "smirk") {
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-r * 0.12, my + r * 0.02); c.quadraticCurveTo(r * 0.04, my + r * 0.04, r * 0.18, my - r * 0.05); c.stroke();
    } else if (mood === "sweat") {
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 0.15, my);
      c.quadraticCurveTo(-r * 0.05, my - r * 0.05, 0, my);
      c.quadraticCurveTo(r * 0.05, my + r * 0.05, r * 0.15, my);
      c.stroke();
    } else if (mood === "sleepy") {
      c.fillStyle = "#be123c";
      c.lineWidth = 2;
      c.beginPath(); c.arc(0, my, r * 0.09, 0, TAU); c.fill(); c.stroke();
    } else {
      c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(-r * 0.11, my); c.lineTo(r * 0.11, my); c.stroke();
    }

    // Extra anime mood Emote Icons (Sweat Drop / Anger Vein / Sleepy Bubble)
    if (mood === "sweat" || mood === "shocked") {
      c.fillStyle = "#38bdf8";
      c.strokeStyle = INK;
      c.lineWidth = 1.8;
      const sy = -r * 0.22 + Math.sin(t * 5) * 2;
      c.beginPath();
      c.moveTo(r * 0.62, sy - r * 0.16);
      c.quadraticCurveTo(r * 0.74, sy + r * 0.06, r * 0.62, sy + r * 0.14);
      c.quadraticCurveTo(r * 0.50, sy + r * 0.06, r * 0.62, sy - r * 0.16);
      c.closePath();
      c.fill(); c.stroke();
    } else if (mood === "angry") {
      // Red anime vein cross
      c.strokeStyle = "#ef4444";
      c.lineWidth = 2.2;
      const vx = r * 0.56, vy = -r * 0.52;
      c.beginPath();
      c.moveTo(vx - 5, vy - 2); c.lineTo(vx - 1, vy - 2); c.lineTo(vx - 1, vy - 6);
      c.moveTo(vx + 5, vy - 2); c.lineTo(vx + 1, vy - 2); c.lineTo(vx + 1, vy - 6);
      c.moveTo(vx - 5, vy + 2); c.lineTo(vx - 1, vy + 2); c.lineTo(vx - 1, vy + 6);
      c.moveTo(vx + 5, vy + 2); c.lineTo(vx + 1, vy + 2); c.lineTo(vx + 1, vy + 6);
      c.stroke();
    }
    c.restore();
  }

  function drawHumanIchigo(c, x, y, r, t = 0, facing = 1, opts = {}) {
    const mood = opts.mood || "neutral";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 1);

    c.save();
    c.translate(x, y);

    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.30)";
      c.beginPath(); c.ellipse(0, r * 0.94, r * 0.82, r * 0.24, 0, 0, TAU); c.fill();
    }

    const bob = Math.sin(t * 4) * 1.0;
    c.translate(0, bob);

    // 1. Base warm skin ball
    c.fillStyle = "#fbd3b0";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // 2. Casual Hoodie / Tee Collar cleanly at bottom (0.60r..r)
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#1e293b";
    c.fillRect(-r, r * 0.60, r * 2, r * 0.48);
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(-r * 0.24, r * 0.60);
    c.lineTo(0, r * 0.88);
    c.lineTo(r * 0.24, r * 0.60);
    c.closePath();
    c.fill();
    c.fillStyle = "#ef4444";
    c.fillRect(-r * 0.40, r * 0.60, r * 0.80, r * 0.08);
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.60); c.lineTo(r, r * 0.60); c.stroke();
    c.restore();

    // Ball outline
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    // 3. Chibi Eyes + Mood Brows/Mouth
    drawChibiEye(c, r, -1, { irisColor: "#92400e", irisHighlight: "#d97706", slant: 0.14, lookX: facing, mood, blink, skinColor: "#fbd3b0" });
    drawChibiEye(c, r, 1, { irisColor: "#92400e", irisHighlight: "#d97706", slant: 0.14, lookX: facing, mood, blink, skinColor: "#fbd3b0" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // 4. Layered Spiky Bright-Orange Hair
    c.fillStyle = "#f97316";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-r * 0.92, -r * 0.24);
    c.lineTo(-r * 1.16, -r * 0.56);
    c.lineTo(-r * 0.76, -r * 0.74);
    c.lineTo(-r * 0.82, -r * 1.15);
    c.lineTo(-r * 0.34, -r * 0.98);
    c.lineTo(-r * 0.02, -r * 1.24);
    c.lineTo(r * 0.28, -r * 0.98);
    c.lineTo(r * 0.76, -r * 1.15);
    c.lineTo(r * 0.70, -r * 0.76);
    c.lineTo(r * 1.14, -r * 0.54);
    c.lineTo(r * 0.88, -r * 0.24);
    c.lineTo(r * 0.46, -r * 0.45);
    c.lineTo(r * 0.14, -r * 0.28);
    c.lineTo(-r * 0.10, -r * 0.46);
    c.lineTo(-r * 0.44, -r * 0.32);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = "#fdba74";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-r * 0.54, -r * 0.86); c.lineTo(-r * 0.34, -r * 0.62); c.stroke();
    c.beginPath(); c.moveTo(r * 0.04, -r * 1.02); c.lineTo(r * 0.10, -r * 0.66); c.stroke();

    if (opts.guardPose || opts.swordAngle !== undefined) {
      drawZanpakuto();
    }

    c.restore();
  }

  function drawShinigamiIchigo(c, x, y, r, t = 0, facing = 1, opts = {}) {
    const mood = opts.mood || "battle";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 1);
    const dir = facing >= 0 ? 1 : -1;

    c.save();
    c.translate(x, y);

    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.34)";
      c.beginPath(); c.ellipse(0, r * 0.96, r * 0.88, r * 0.25, 0, 0, TAU); c.fill();
    }

    const bob = opts.guardPose ? 0.5 : Math.sin(t * 4.4) * 1.1;
    const sx = opts.scaleX ?? 1;
    const sy = opts.scaleY ?? 1;
    const lean = opts.lean ?? 0;
    c.translate(0, bob);
    if (lean !== 0) c.rotate(lean);
    if (sx !== 1 || sy !== 1) c.scale(sx, sy);

    // 0. Electric Sky-Blue Shinigami Reiatsu Aura (subtle in portrait, vivid in overworld)
    if (!opts.noShadow) {
      const auraR = opts.chargeGlow ? r * (1.85 + opts.chargeGlow * 0.65) : r * 1.65;
      const aura = c.createRadialGradient(0, 0, r * 0.45, 0, 0, auraR);
      aura.addColorStop(0, opts.chargeGlow ? "rgba(56, 189, 248, 0.65)" : "rgba(56, 189, 248, 0.30)");
      aura.addColorStop(0.6, "rgba(37, 99, 235, 0.16)");
      aura.addColorStop(1, "rgba(56, 189, 248, 0)");
      c.fillStyle = aura;
      c.beginPath(); c.arc(0, 0, auraR, 0, TAU); c.fill();
    }

    // 1. Massive Episode 1 Sealed Zanpakuto (Dynamic Swing / Guard / Shoulder Idle)
    const drawZanpakuto = () => {
      c.save();
      if (opts.guardPose) {
        // Vertical Guard Stance in front of Ichigo
        c.translate(dir * r * 0.62, r * 0.15);
        c.rotate(dir * -0.18);
        c.scale(dir, 1);
        c.rotate(-Math.PI * 0.46);
      } else if (opts.swordAngle !== undefined) {
        // Active Slash / Skill / Ulti Swing Pivot
        c.rotate(opts.swordAngle);
        c.translate(r * 0.35, 0);
      } else {
        // Classic resting over shoulder
        c.scale(dir, 1);
        c.translate(-r * 0.10, -r * 0.05);
        c.rotate(-0.22);
      }

      if (opts.chargeGlow) {
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 14 * opts.chargeGlow;
      }

      // Long broad silver blade
      c.fillStyle = opts.chargeGlow ? "#e0f2fe" : "#f1f5f9";
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.95, -r * 0.42);
      c.lineTo(r * 1.95, -r * 0.62);
      c.quadraticCurveTo(r * 2.28, -r * 0.54, r * 2.02, -r * 0.30);
      c.lineTo(-r * 0.95, -r * 0.16);
      c.closePath();
      c.fill(); c.stroke();

      // Gleaming blade edge highlight
      c.strokeStyle = opts.chargeGlow ? "#38bdf8" : "#bae6fd";
      c.lineWidth = opts.chargeGlow ? 2.4 : 1.6;
      c.beginPath();
      c.moveTo(-r * 0.82, -r * 0.36);
      c.lineTo(r * 1.92, -r * 0.54);
      c.stroke();

      // Rectangular Bronze/Gold Tsuba Guard
      c.fillStyle = "#d97706";
      c.strokeStyle = INK;
      c.lineWidth = 2.2;
      c.fillRect(-r * 1.06, -r * 0.52, r * 0.18, r * 0.46);
      c.strokeRect(-r * 1.06, -r * 0.52, r * 0.18, r * 0.46);

      // Red/Dark Wrapped Hilt + Pommel Tassel
      c.fillStyle = "#7f1d1d";
      c.fillRect(-r * 1.62, -r * 0.37, r * 0.56, r * 0.16);
      c.strokeRect(-r * 1.62, -r * 0.37, r * 0.56, r * 0.16);
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-r * 1.62, -r * 0.29);
      c.quadraticCurveTo(-r * 1.78, -r * 0.10, -r * 1.68, r * 0.06);
      c.stroke();
      c.restore();
    };

    if (!opts.guardPose && opts.swordAngle === undefined) {
      drawZanpakuto();
    }

    // 2. Base warm skin ball
    c.fillStyle = "#fbd3b0";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // 3. Black Shihakusho + White Inner Collar + Red/Brown Chest Strap (0.58r..r)
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#0f172a";
    c.fillRect(-r, r * 0.58, r * 2, r * 0.50);
    // White inner V-collar
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(-r * 0.32, r * 0.58);
    c.lineTo(0, r * 0.92);
    c.lineTo(r * 0.32, r * 0.58);
    c.closePath();
    c.fill();
    // Inner black kimono lapel
    c.fillStyle = "#1e293b";
    c.beginPath();
    c.moveTo(-r * 0.20, r * 0.58);
    c.lineTo(0, r * 0.84);
    c.lineTo(r * 0.20, r * 0.58);
    c.closePath();
    c.fill();
    // Diagonal brown/crimson sword-sheath strap
    c.strokeStyle = "#9a3412";
    c.lineWidth = r * 0.16;
    c.beginPath();
    c.moveTo(-r * 0.58, r * 0.55);
    c.lineTo(r * 0.36, r * 1.02);
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.58); c.lineTo(r, r * 0.58); c.stroke();
    c.restore();

    // Ball outline
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    // 4. Chibi Eyes + Mood Brows/Mouth
    drawChibiEye(c, r, -1, { irisColor: "#92400e", irisHighlight: "#d97706", slant: 0.16, lookX: facing, mood, blink, skinColor: "#fbd3b0" });
    drawChibiEye(c, r, 1, { irisColor: "#92400e", irisHighlight: "#d97706", slant: 0.16, lookX: facing, mood, blink, skinColor: "#fbd3b0" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // 5. Layered Spiky Bright-Orange Hair
    c.fillStyle = "#f97316";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(-r * 0.92, -r * 0.24);
    c.lineTo(-r * 1.16, -r * 0.56);
    c.lineTo(-r * 0.76, -r * 0.74);
    c.lineTo(-r * 0.82, -r * 1.15);
    c.lineTo(-r * 0.34, -r * 0.98);
    c.lineTo(-r * 0.02, -r * 1.24);
    c.lineTo(r * 0.28, -r * 0.98);
    c.lineTo(r * 0.76, -r * 1.15);
    c.lineTo(r * 0.70, -r * 0.76);
    c.lineTo(r * 1.14, -r * 0.54);
    c.lineTo(r * 0.88, -r * 0.24);
    c.lineTo(r * 0.46, -r * 0.45);
    c.lineTo(r * 0.14, -r * 0.28);
    c.lineTo(-r * 0.10, -r * 0.46);
    c.lineTo(-r * 0.44, -r * 0.32);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = "#fdba74";
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(-r * 0.54, -r * 0.86); c.lineTo(-r * 0.34, -r * 0.62); c.stroke();
    c.beginPath(); c.moveTo(r * 0.04, -r * 1.02); c.lineTo(r * 0.10, -r * 0.66); c.stroke();

    if (opts.guardPose || opts.swordAngle !== undefined) {
      drawZanpakuto();
    }

    c.restore();
  }

  function drawRukia(c, x, y, r, t = 0, opts = {}) {
    const showSword = opts.showSword !== false;
    const mood = opts.mood || "neutral";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 2);
    const flutter = Math.sin(t * 5.2) * 0.07;

    c.save();
    c.translate(x, y);

    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.32)";
      c.beginPath(); c.ellipse(0, r * 0.94, r * 0.82, r * 0.24, 0, 0, TAU); c.fill();
    }

    // 1. Sode no Shirayuki katana hilt behind shoulder
    if (showSword) {
      c.save();
      c.rotate(-0.46 + flutter * 0.35);
      c.fillStyle = "#f8fafc";
      c.strokeStyle = INK;
      c.lineWidth = 2.2;
      c.beginPath(); c.roundRect(-r * 0.08, -r * 1.40, r * 0.16, r * 0.66, 3); c.fill(); c.stroke();
      c.fillStyle = "#cbd5e1";
      c.beginPath(); c.roundRect(-r * 0.22, -r * 0.94, r * 0.44, r * 0.10, 3); c.fill(); c.stroke();
      c.restore();
    }

    // 2. Iconic Flipped-Out Black Bob Hair Wings (behind head)
    c.fillStyle = "#1a1933";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.lineJoin = "round";
    c.beginPath();
    c.arc(0, -r * 0.06, r * 1.05, Math.PI * 0.86, Math.PI * 2.14);
    c.quadraticCurveTo(r * 1.25, r * 0.42, r * 1.18, r * 0.58);
    c.quadraticCurveTo(r * 0.86, r * 0.58, r * 0.65, r * 0.40);
    c.lineTo(-r * 0.65, r * 0.40);
    c.quadraticCurveTo(-r * 0.86, r * 0.58, -r * 1.18, r * 0.58);
    c.quadraticCurveTo(-r * 1.25, r * 0.42, -r * 1.04, r * 0.06);
    c.closePath();
    c.fill();
    c.stroke();

    // 3. Porcelain Skin Ball
    c.fillStyle = "#fde6d8";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // 4. Black Shihakusho & White V-Collar cleanly at bottom (0.60r..r)
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#0f101d";
    c.fillRect(-r, r * 0.60, r * 2, r * 0.48);
    c.fillStyle = "#ffffff";
    c.beginPath();
    c.moveTo(-r * 0.34, r * 0.60);
    c.lineTo(0, r * 0.90);
    c.lineTo(r * 0.34, r * 0.60);
    c.lineTo(r * 0.18, r * 0.60);
    c.lineTo(0, r * 0.78);
    c.lineTo(-r * 0.18, r * 0.60);
    c.closePath();
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.60); c.lineTo(r, r * 0.60); c.stroke();
    c.restore();

    // Ball outline
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    // 5. Big Chibi Eyes + Mood Brows/Mouth
    drawChibiEye(c, r, -1, { irisColor: "#4f46e5", irisHighlight: "#818cf8", slant: 0.10, lash: true, mood, blink, skinColor: "#fde6d8" });
    drawChibiEye(c, r, 1, { irisColor: "#4f46e5", irisHighlight: "#818cf8", slant: 0.10, lash: true, mood, blink, skinColor: "#fde6d8" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // 6. Crown Hair + Rukia's Signature Center Forehead Strand
    c.fillStyle = "#1a1933";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.lineJoin = "round";
    c.beginPath();
    c.arc(0, -r * 0.10, r * 1.03, Math.PI * 1.04, Math.PI * 1.96);
    c.lineTo(r * 0.78, -r * 0.32);
    c.lineTo(r * 0.46, -r * 0.52);
    c.lineTo(r * 0.14, -r * 0.46);
    c.quadraticCurveTo(r * 0.09, -r * 0.05 + flutter * r * 0.25, 0, r * 0.07);
    c.quadraticCurveTo(-r * 0.05, -r * 0.16, -r * 0.12, -r * 0.46);
    c.lineTo(-r * 0.46, -r * 0.52);
    c.lineTo(-r * 0.78, -r * 0.32);
    c.closePath();
    c.fill();
    c.stroke();

    c.strokeStyle = "#6366f1";
    c.lineWidth = 2;
    c.beginPath(); c.arc(0, -r * 0.15, r * 0.70, Math.PI * 1.25, Math.PI * 1.62); c.stroke();

    c.restore();
  }

  function drawYuzu(c, x, y, r, t = 0, opts = {}) {
    const mood = opts.mood || "sweat";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 2);

    c.save();
    c.translate(x, y);
    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.28)";
      c.beginPath(); c.ellipse(0, r * 0.94, r * 0.80, r * 0.23, 0, 0, TAU); c.fill();
    }
    c.translate(0, Math.sin(t * 4.2 + 1) * 0.9);

    // Side bob hair behind head
    c.fillStyle = "#b4693e";
    c.strokeStyle = INK;
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(-r * 0.74, r * 0.20, r * 0.34, 0, TAU);
    c.arc(r * 0.74, r * 0.20, r * 0.34, 0, TAU);
    c.fill(); c.stroke();

    // Base skin
    c.fillStyle = "#fde6d8";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // Pink apron / sweater collar
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#f472b6";
    c.fillRect(-r, r * 0.60, r * 2, r * 0.48);
    c.fillStyle = "#ffffff";
    c.fillRect(-r * 0.28, r * 0.60, r * 0.56, r * 0.42);
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.60); c.lineTo(r, r * 0.60); c.stroke();
    c.restore();

    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    drawChibiEye(c, r, -1, { irisColor: "#92400e", irisHighlight: "#f59e0b", lash: true, mood, blink, skinColor: "#fde6d8" });
    drawChibiEye(c, r, 1, { irisColor: "#92400e", irisHighlight: "#f59e0b", lash: true, mood, blink, skinColor: "#fde6d8" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // Warm light-brown bangs
    c.fillStyle = "#c27849";
    c.strokeStyle = INK;
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(0, -r * 0.12, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    c.lineTo(r * 0.70, -r * 0.32);
    c.lineTo(r * 0.26, -r * 0.48);
    c.lineTo(0, -r * 0.26);
    c.lineTo(-r * 0.26, -r * 0.48);
    c.lineTo(-r * 0.70, -r * 0.32);
    c.closePath();
    c.fill(); c.stroke();

    // Cute hairclip
    c.fillStyle = "#ffe047";
    c.fillRect(r * 0.38, -r * 0.54, r * 0.24, r * 0.10);

    c.restore();
  }

  function drawKarin(c, x, y, r, t = 0, opts = {}) {
    const mood = opts.mood || "angry";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 3);

    c.save();
    c.translate(x, y);
    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.28)";
      c.beginPath(); c.ellipse(0, r * 0.94, r * 0.80, r * 0.23, 0, 0, TAU); c.fill();
    }
    c.translate(0, Math.sin(t * 4.1 + 2) * 0.9);

    c.fillStyle = "#fbd3b0";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // Red/dark sporty hoodie collar
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#dc2626";
    c.fillRect(-r, r * 0.60, r * 2, r * 0.48);
    c.fillStyle = "#1e293b";
    c.fillRect(-r * 0.24, r * 0.60, r * 0.48, r * 0.42);
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.60); c.lineTo(r, r * 0.60); c.stroke();
    c.restore();

    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    drawChibiEye(c, r, -1, { irisColor: "#334155", irisHighlight: "#64748b", slant: 0.14, mood, blink, skinColor: "#fbd3b0" });
    drawChibiEye(c, r, 1, { irisColor: "#334155", irisHighlight: "#64748b", slant: 0.14, mood, blink, skinColor: "#fbd3b0" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // Short dark spiky tomboy hair
    c.fillStyle = "#1e1b2e";
    c.strokeStyle = INK;
    c.lineWidth = 2.6;
    c.beginPath();
    c.arc(0, -r * 0.10, r * 1.03, Math.PI * 1.02, Math.PI * 1.98);
    c.lineTo(r * 0.84, -r * 0.26);
    c.lineTo(r * 0.42, -r * 0.48);
    c.lineTo(r * 0.14, -r * 0.22);
    c.lineTo(-r * 0.10, -r * 0.46);
    c.lineTo(-r * 0.44, -r * 0.26);
    c.lineTo(-r * 0.84, -r * 0.30);
    c.closePath();
    c.fill(); c.stroke();

    c.restore();
  }

  function drawIsshin(c, x, y, r, t = 0, opts = {}) {
    const mood = opts.mood || "sweat";
    const isTalking = Boolean(opts.talking);
    const blink = getBlink(t, 4);

    c.save();
    c.translate(x, y);
    if (!opts.noShadow) {
      c.fillStyle = "rgba(18, 11, 28, 0.28)";
      c.beginPath(); c.ellipse(0, r * 0.94, r * 0.84, r * 0.24, 0, 0, TAU); c.fill();
    }
    c.translate(0, Math.sin(t * 3.2) * 0.8);

    c.fillStyle = "#f4c29f";
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();

    // Doctor white lab coat + green tie
    c.save();
    c.beginPath(); c.arc(0, 0, r - 1.5, 0, TAU); c.clip();
    c.fillStyle = "#f8fafc";
    c.fillRect(-r, r * 0.58, r * 2, r * 0.48);
    c.fillStyle = "#0ea5e9";
    c.fillRect(-r * 0.20, r * 0.58, r * 0.40, r * 0.42);
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-r, r * 0.58); c.lineTo(r, r * 0.58); c.stroke();
    c.restore();

    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();

    // Goatee stubble
    c.fillStyle = "#1e293b";
    c.beginPath();
    c.arc(0, r * 0.48, r * 0.16, 0, Math.PI);
    c.fill();

    drawChibiEye(c, r, -1, { irisColor: "#475569", irisHighlight: "#94a3b8", slant: 0.08, mood, blink, skinColor: "#f4c29f" });
    drawChibiEye(c, r, 1, { irisColor: "#475569", irisHighlight: "#94a3b8", slant: 0.08, mood, blink, skinColor: "#f4c29f" });
    drawBrowsAndMouth(c, r, mood, t, isTalking);

    // Messy dark doctor hair
    c.fillStyle = "#1e293b";
    c.strokeStyle = INK;
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(-r * 0.94, -r * 0.22);
    c.lineTo(-r * 1.08, -r * 0.56);
    c.lineTo(-r * 0.56, -r * 0.92);
    c.lineTo(0, -r * 1.12);
    c.lineTo(r * 0.56, -r * 0.92);
    c.lineTo(r * 1.08, -r * 0.56);
    c.lineTo(r * 0.94, -r * 0.22);
    c.lineTo(r * 0.42, -r * 0.44);
    c.lineTo(0, -r * 0.30);
    c.lineTo(-r * 0.42, -r * 0.44);
    c.closePath();
    c.fill(); c.stroke();

    // Band-aid on cheek (injured from Hollow)
    c.fillStyle = "#fef3c7";
    c.strokeStyle = INK;
    c.lineWidth = 1.5;
    c.save();
    c.translate(-r * 0.48, r * 0.22);
    c.rotate(-0.3);
    c.fillRect(-r * 0.18, -r * 0.08, r * 0.36, r * 0.16);
    c.strokeRect(-r * 0.18, -r * 0.08, r * 0.36, r * 0.16);
    c.restore();

    c.restore();
  }

  function drawFishboneHollow(c, x, y, r, t = 0, opts = {}) {
    const isPortrait = Boolean(opts.noShadow);
    const isTalking = Boolean(opts.talking);
    const roar = isTalking ? Math.abs(Math.sin(t * 14)) * 0.14 : 0;

    c.save();
    c.translate(x, y);

    if (isPortrait) {
      // Close-up menacing skull-face for 62x62 VN portrait circle
      const aura = c.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.4);
      aura.addColorStop(0, "rgba(220, 38, 38, 0.35)");
      aura.addColorStop(1, "rgba(24, 24, 27, 0)");
      c.fillStyle = aura;
      c.beginPath(); c.arc(0, 0, r * 1.4, 0, TAU); c.fill();

      c.fillStyle = "#18181b";
      c.beginPath(); c.arc(0, r * 0.1, r * 1.1, 0, TAU); c.fill();

      // Skull Mask
      c.fillStyle = "#f8fafc";
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-r * 0.82, -r * 0.48);
      c.quadraticCurveTo(0, -r * 1.05, r * 0.82, -r * 0.48);
      c.lineTo(r * 0.68, r * 0.56);
      c.lineTo(0, r * 0.88 + roar * r);
      c.lineTo(-r * 0.68, r * 0.56);
      c.closePath();
      c.fill(); c.stroke();

      c.fillStyle = "#dc2626";
      c.beginPath();
      c.moveTo(-r * 0.14, -r * 0.78);
      c.lineTo(r * 0.14, -r * 0.78);
      c.lineTo(0, -r * 0.24);
      c.closePath();
      c.fill();

      for (const s of [-1, 1]) {
        c.fillStyle = "#09090b";
        c.beginPath();
        c.ellipse(s * r * 0.34, -r * 0.08, r * 0.24, r * 0.18, s * -0.28, 0, TAU);
        c.fill();
        c.fillStyle = "#facc15";
        c.beginPath();
        c.arc(s * r * 0.34, -r * 0.08, r * 0.10, 0, TAU);
        c.fill();
      }

      c.fillStyle = "#09090b";
      c.beginPath();
      c.moveTo(-r * 0.45, r * 0.32);
      c.lineTo(r * 0.45, r * 0.32);
      c.lineTo(r * 0.32, r * 0.54 + roar * r);
      c.lineTo(-r * 0.32, r * 0.54 + roar * r);
      c.closePath();
      c.fill();
      c.restore();
      return;
    }

    // FULL-BODY GIANT LORE-ACCURATE FISHBONE D HOLLOW (NOT A BALL!)
    const bossState = opts.bossState || "chase";
    const animProg = opts.animProg ?? 0;
    const pattern = opts.pattern || "cone";
    const enraged = Boolean(opts.enraged);
    const breath = bossState === "stagger" ? 0 : Math.sin(t * (enraged ? 5.6 : 3.4)) * 2.2;
    const s = r / 26; // Scale factor (default r=26 on street, bigger in cutscene)

    // Dynamic body squash/stretch, tremble & tilt based on Boss State
    let bodyOffX = 0;
    let bodyOffY = breath;
    let bodyTilt = 0;
    let bodyScaleX = 1;
    let bodyScaleY = 1;
    if (bossState === "telegraph") {
      const vib = Math.sin(t * 55) * (1.2 + animProg * 2.4);
      bodyOffX += vib;
      bodyScaleX = 1 + animProg * 0.12;
      bodyScaleY = 1 - animProg * 0.08;
      if (pattern === "circle" || pattern === "cross") {
        bodyOffY -= animProg * 8 * s;
      }
    } else if (bossState === "attack") {
      bodyScaleX = 1.14;
      bodyScaleY = 0.88;
      bodyOffY += 4 * s;
    } else if (bossState === "stagger") {
      bodyTilt = -0.18 + Math.sin(t * 24) * 0.06;
      bodyOffY += 4 * s;
    }

    // 1. Massive Ground Shadow + Crimson Reiatsu Miasma
    c.fillStyle = "rgba(18, 11, 28, 0.52)";
    c.beginPath(); c.ellipse(0, 28 * s, 38 * s, 12 * s, 0, 0, TAU); c.fill();

    const auraR = (enraged ? 64 : 54) * s;
    const aura = c.createRadialGradient(0, -4 * s, 10 * s, 0, -4 * s, auraR);
    aura.addColorStop(0, enraged || bossState === "telegraph" ? "rgba(239, 68, 68, 0.52)" : "rgba(220, 38, 38, 0.34)");
    aura.addColorStop(0.6, enraged ? "rgba(147, 51, 234, 0.28)" : "rgba(88, 28, 135, 0.16)");
    aura.addColorStop(1, "rgba(24, 24, 27, 0)");
    c.fillStyle = aura;
    c.beginPath(); c.arc(0, -4 * s, auraR, 0, TAU); c.fill();

    c.translate(bodyOffX, bodyOffY);
    if (bodyTilt !== 0) c.rotate(bodyTilt);
    if (bodyScaleX !== 1 || bodyScaleY !== 1) c.scale(bodyScaleX, bodyScaleY);

    // 2. Dorsal Fishbone Spines protruding behind shoulders
    c.fillStyle = "#e2e8f0";
    c.strokeStyle = INK;
    c.lineWidth = 2.4 * Math.min(1.4, s);
    for (const [sx, sy, ang] of [[-18, -32, -0.4], [0, -38, 0], [18, -32, 0.4]]) {
      c.save();
      c.translate(sx * s, sy * s);
      c.rotate(ang);
      c.beginPath();
      c.moveTo(-5 * s, 8 * s);
      c.lineTo(0, -14 * s);
      c.lineTo(5 * s, 8 * s);
      c.closePath();
      c.fill(); c.stroke();
      c.restore();
    }

    // 3. Hulking Muscular Arms & Razor Claws (animated per bossState)
    for (const side of [-1, 1]) {
      let armSwing = Math.sin(t * 3.4 + side) * 2.5;
      let armRot = 0;
      let armRaiseY = 0;
      if (bossState === "telegraph") {
        if (pattern === "circle" || pattern === "cross") {
          armRaiseY = -18 * s * animProg;
          armRot = side * -0.85 * animProg;
        } else {
          armRot = side * 0.55 * animProg;
          armRaiseY = -6 * s * animProg;
        }
      } else if (bossState === "attack") {
        if (pattern === "circle" || pattern === "cross") {
          armRaiseY = 12 * s;
          armRot = side * 0.35;
        } else {
          armRot = side * -0.95;
          armSwing = 8 * s;
        }
      } else if (bossState === "stagger") {
        armRaiseY = 8 * s;
        armRot = side * 0.25;
      }

      c.save();
      c.translate(side * 26 * s, -6 * s + armSwing + armRaiseY);
      if (armRot !== 0) c.rotate(armRot);
      // Upper arm
      c.fillStyle = "#18181b";
      c.strokeStyle = INK;
      c.lineWidth = 2.8;
      c.beginPath();
      c.ellipse(side * 6 * s, 6 * s, 11 * s, 18 * s, side * -0.25, 0, TAU);
      c.fill(); c.stroke();
      // White bone forearm guard
      c.fillStyle = "#f1f5f9";
      c.beginPath();
      c.roundRect(-6 * s + side * 4 * s, 12 * s, 12 * s, 14 * s, 4 * s);
      c.fill(); c.stroke();
      // 3 Sharp Claws
      c.fillStyle = "#fef2f2";
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.moveTo((side * 4 + k * 4) * s, 25 * s);
        c.lineTo((side * 5 + k * 5) * s, 35 * s);
        c.lineTo((side * 7 + k * 4) * s, 25 * s);
        c.closePath();
        c.fill(); c.stroke();
      }
      c.restore();
    }

    // 4. Broad Hunched Monstrous Torso + Legs
    c.fillStyle = "#18181b";
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-24 * s, -22 * s);
    c.quadraticCurveTo(0, -34 * s, 24 * s, -22 * s);
    c.lineTo(28 * s, 4 * s);
    c.lineTo(18 * s, 26 * s);
    c.lineTo(6 * s, 26 * s);
    c.lineTo(4 * s, 14 * s);
    c.lineTo(-4 * s, 14 * s);
    c.lineTo(-6 * s, 26 * s);
    c.lineTo(-18 * s, 26 * s);
    c.lineTo(-28 * s, 4 * s);
    c.closePath();
    c.fill(); c.stroke();

    // Ribcage Bone Ridges on Torso
    c.strokeStyle = "#cbd5e1";
    c.lineWidth = 2.2 * Math.min(1.4, s);
    for (const ry of [-4, 3, 10]) {
      c.beginPath();
      c.moveTo(-16 * s, ry * s);
      c.quadraticCurveTo(-8 * s, (ry + 3) * s, -4 * s, ry * s);
      c.moveTo(16 * s, ry * s);
      c.quadraticCurveTo(8 * s, (ry + 3) * s, 4 * s, ry * s);
      c.stroke();
    }

    // Hollow Chest Hole (Gaping Void in Sternum!)
    c.fillStyle = "#050507";
    c.strokeStyle = "#dc2626";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 4 * s, 6.5 * s, 0, TAU);
    c.fill(); c.stroke();

    // 5. Towering White Fishbone-D Skull Mask
    c.save();
    c.translate(0, -18 * s);
    c.fillStyle = "#f8fafc";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-18 * s, -12 * s);
    c.quadraticCurveTo(0, -28 * s, 18 * s, -12 * s);
    c.lineTo(15 * s, 10 * s);
    c.lineTo(0, 18 * s + roar * 10 * s);
    c.lineTo(-15 * s, 10 * s);
    c.closePath();
    c.fill(); c.stroke();

    // Red Jagged Mask Markings (Forehead + Cheeks)
    c.fillStyle = "#dc2626";
    c.beginPath();
    c.moveTo(-3.5 * s, -19 * s);
    c.lineTo(3.5 * s, -19 * s);
    c.lineTo(0, -6 * s);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-14 * s, 0);
    c.lineTo(-9 * s, 3 * s);
    c.lineTo(-13 * s, 8 * s);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(14 * s, 0);
    c.lineTo(9 * s, 3 * s);
    c.lineTo(13 * s, 8 * s);
    c.closePath();
    c.fill();

    // Glowing Yellow Eyes inside Deep Black Sockets
    for (const side of [-1, 1]) {
      c.fillStyle = "#09090b";
      c.beginPath();
      c.ellipse(side * 7.5 * s, -3 * s, 5.5 * s, 4 * s, side * -0.28, 0, TAU);
      c.fill();
      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(side * 7.5 * s, -3 * s, 2.3 * s, 0, TAU);
      c.fill();
    }

    // Jagged Fangs / Roaring Jaw
    c.fillStyle = "#09090b";
    c.beginPath();
    c.moveTo(-10 * s, 7 * s);
    c.lineTo(10 * s, 7 * s);
    c.lineTo(7 * s, 12 * s + roar * 8 * s);
    c.lineTo(-7 * s, 12 * s + roar * 8 * s);
    c.closePath();
    c.fill();

    c.fillStyle = "#ffffff";
    for (let tx = -7; tx <= 7; tx += 4.6) {
      c.beginPath();
      c.moveTo((tx - 1.5) * s, 7 * s);
      c.lineTo(tx * s, 10.5 * s);
      c.lineTo((tx + 1.5) * s, 7 * s);
      c.closePath();
      c.fill();
    }

    // Glowing Cero Energy Orb charging in jaw during barrage telegraph
    if (bossState === "telegraph" && pattern === "barrage") {
      const orbR = (4 + animProg * 9) * s;
      c.save();
      c.shadowColor = "#c026d3";
      c.shadowBlur = 14;
      c.fillStyle = "#fae8ff";
      c.strokeStyle = "#db2777";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(0, 11 * s, orbR, 0, TAU);
      c.fill();
      c.stroke();
      c.restore();
    }

    // Stagger Dizzy Stars above skull
    if (bossState === "stagger") {
      for (let i = 0; i < 3; i++) {
        const a = t * 6 + (i * TAU) / 3;
        const sx = Math.cos(a) * 18 * s;
        const sy = -28 * s + Math.sin(a) * 5 * s;
        c.fillStyle = "#ffe047";
        c.strokeStyle = INK;
        c.lineWidth = 1.6;
        c.beginPath();
        c.arc(sx, sy, 3.6 * s, 0, TAU);
        c.fill();
        c.stroke();
      }
    }
    c.restore();

    c.restore();
  }

  function drawById(id, c, x, y, r, t = 0, opts = {}) {
    if (id === "rukia" || id === "rukia_bedroom" || id === "rukia_street") {
      return drawRukia(c, x, y, r, t, opts);
    }
    if (id === "ichigo_shinigami") return drawShinigamiIchigo(c, x, y, r, t, opts.facing ?? 1, opts);
    if (id === "yuzu") return drawYuzu(c, x, y, r, t, opts);
    if (id === "karin") return drawKarin(c, x, y, r, t, opts);
    if (id === "isshin") return drawIsshin(c, x, y, r, t, opts);
    if (id === "hollow_fishbone") return drawFishboneHollow(c, x, y, r, t, opts);
    return drawHumanIchigo(c, x, y, r, t, opts.facing ?? 1, opts);
  }

  S.BleachChars = {
    MOOD_LIST,
    drawHumanIchigo,
    drawShinigamiIchigo,
    drawRukia,
    drawYuzu,
    drawKarin,
    drawIsshin,
    drawFishboneHollow,
    drawById,
  };
})();
