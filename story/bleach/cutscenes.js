// Bleach Episode 1 Animated Cutscene — Rukia on the Karakura Utility Pole (Hi-DPI 2x + Live Moods)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const INK = "#2b1b3d";
  const LOGICAL_W = 440;
  const LOGICAL_H = 680;
  const DPR = 2;

  const EP1_INTRO_LINES = [
    {
      side: "left",
      speakerId: "rukia",
      mood: "serious",
      name: "???",
      text: "The spiritual pressure in Karakura Town is unusually thick tonight...",
      scene: "pole",
    },
    {
      side: "left",
      speakerId: "rukia",
      mood: "shocked",
      name: "???",
      text: "A Hollow is hunting nearby. Wait—that massive Reiatsu signature... it's coming from that house over there?!",
      scene: "pole_zoom",
    },
    {
      side: "left",
      speakerId: "rukia",
      mood: "battle",
      name: "???",
      text: "Impossible. That's no ordinary human's spirit energy. I'd better check it out myself.",
      scene: "pole_leap",
    },
    {
      side: "right",
      speakerId: "ichigo_human",
      mood: "suspicious",
      name: "ICHIGO KUROSAKI",
      text: "Ugh... why does it feel like something weird is lurking outside my window tonight?",
      scene: "bedroom_fade",
    },
  ];

  const ARC1_INTRO_LINES = [
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "sleepy",
      name: "ICHIGO KUROSAKI",
      text: "Mmmh... Morning already? That sunlight is blinding...",
      scene: "morning_sky",
    },
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "shocked",
      name: "ICHIGO KUROSAKI",
      text: "Wait a second—last night! A girl in black robes, a giant Hollow, a massive sword... was all of that just a crazy dream?!",
      scene: "bedroom_wake",
    },
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "suspicious",
      name: "ICHIGO KUROSAKI",
      text: "I'm back in my normal human body... No black Shihakusho, no Zanpakuto. Still, I can feel faint spiritual pressure lingering in the air.",
      scene: "bedroom_wake",
    },
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "serious",
      name: "ICHIGO KUROSAKI",
      text: "No—the clinic downstairs really got smashed! I'd better check downstairs and head to Karakura High School.",
      scene: "school_bound",
    },
  ];

  const WINDOW_INTRUSION_LINES = [
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "shocked",
      name: "ICHIGO KUROSAKI",
      text: "Wait a second... why is there a shadow standing outside my second-floor window?!",
      scene: "window_shadow",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "battle",
      partner: { speakerId: "ichigo_human", mood: "shocked" },
      name: "???",
      text: "Found the source of the spiritual pressure—right inside this bedroom!",
      scene: "window_entry",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "shocked",
      partner: { speakerId: "ichigo_human", mood: "angry" },
      name: "???",
      text: "Hold on... Wait a minute! CAN YOU ACTUALLY SEE ME?!",
      scene: "window_landed",
    },
  ];

  const RUKIA_BATTLE_LINES = [
    {
      side: "right",
      speakerId: "rukia",
      mood: "battle",
      partner: { speakerId: "ichigo_human", mood: "shocked" },
      name: "RUKIA KUCHIKI",
      text: "Stay back, Ichigo! I'll cut this Hollow down right here—Shunpo!",
      scene: "clash_start",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "battle",
      partner: { speakerId: "hollow_fishbone", mood: "angry" },
      name: "RUKIA KUCHIKI",
      text: "Hadō #31: SHAKKAHŌ! Take this—!!",
      scene: "rukia_slash",
    },
    {
      side: "right",
      speakerId: "hollow_fishbone",
      mood: "angry",
      partner: { speakerId: "rukia", mood: "shocked" },
      name: "FISHBONE D",
      text: "*GRROOOAAARRR!!* Pathetic little Shinigami! Your blade can't even pierce my hide!",
      scene: "hollow_counter",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "sweat",
      partner: { speakerId: "ichigo_human", mood: "shocked" },
      name: "RUKIA KUCHIKI",
      text: "ICHIGO, DUCK!! *SLASH!* Gah—!! My shoulder... I misjudged its power protecting you...!",
      scene: "shield_ichigo",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "serious",
      partner: { speakerId: "ichigo_human", mood: "serious" },
      name: "RUKIA KUCHIKI",
      text: "Ngh... I can barely stand. Ichigo! If you want the power to save your family... pierce your heart with my Zanpakuto and become a Shinigami!",
      scene: "power_transfer",
    },
    {
      side: "left",
      speakerId: "ichigo_human",
      mood: "battle",
      partner: { speakerId: "rukia", mood: "shocked" },
      name: "ICHIGO KUROSAKI",
      text: "Give me that sword! If it'll save Karin and Yuzu... I'LL BECOME A SHINIGAMI!!",
      scene: "blade_pierce",
    },
    {
      side: "right",
      speakerId: "rukia",
      mood: "shocked",
      partner: { speakerId: "ichigo_shinigami", mood: "battle" },
      name: "RUKIA KUCHIKI",
      text: "W-WHAT IS THIS MASSIVE REIATSU?! All of my power... no—something even bigger just awakened inside him!!",
      scene: "reiatsu_pillar",
    },
    {
      side: "left",
      speakerId: "ichigo_shinigami",
      mood: "battle",
      partner: { speakerId: "hollow_fishbone", mood: "shocked" },
      name: "ICHIGO KUROSAKI",
      text: "Alright, Hollow... Now it's MY turn!",
      scene: "shinigami_rise",
    },
  ];

  let active = false;
  let rafId = 0;
  let stepIdx = 0;
  let stepTime = 0;
  let t = 0;
  let currentMode = "pole";
  let currentLines = EP1_INTRO_LINES;
  let onDoneCb = null;
  const stars = Array.from({ length: 34 }, (_, i) => ({
    x: ((i * 73) % 100) / 100,
    y: ((i * 41) % 62) / 100,
    r: 1 + (i % 3) * 0.7,
    phase: i * 0.9,
  }));

  function renderPoleScene(cv) {
    const c = cv.getContext("2d");
    const w = LOGICAL_W;
    const h = LOGICAL_H;
    const line = EP1_INTRO_LINES[stepIdx] || EP1_INTRO_LINES[0];

    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);

    // 1. Night Sky Gradient
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#090b1a");
    sky.addColorStop(0.55, "#151936");
    sky.addColorStop(1, "#231b3d");
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);

    // 2. Twinkling Stars
    for (const s of stars) {
      const a = 0.35 + 0.55 * Math.abs(Math.sin(t * 1.8 + s.phase));
      c.fillStyle = `rgba(255, 255, 240, ${a.toFixed(2)})`;
      c.beginPath(); c.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2); c.fill();
    }

    // 3. Giant Full Moon behind Rukia
    const moonX = w * 0.62;
    const moonY = h * 0.25;
    const moonGlow = c.createRadialGradient(moonX, moonY, 20, moonX, moonY, 120);
    moonGlow.addColorStop(0, "rgba(254, 249, 195, 0.42)");
    moonGlow.addColorStop(1, "rgba(254, 249, 195, 0)");
    c.fillStyle = moonGlow;
    c.beginPath(); c.arc(moonX, moonY, 120, 0, Math.PI * 2); c.fill();

    c.fillStyle = "#fef9c3";
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath(); c.arc(moonX, moonY, 50, 0, Math.PI * 2); c.fill(); c.stroke();

    // 4. Karakura City Rooftops Silhouette
    c.fillStyle = "#0e1022";
    const roofs = [
      [0, h * 0.72, 90, h * 0.3],
      [78, h * 0.67, 110, h * 0.35],
      [175, h * 0.74, 95, h * 0.28],
      [260, h * 0.64, 120, h * 0.38],
      [355, h * 0.70, 110, h * 0.32],
    ];
    for (const [rx, ry, rw, rh] of roofs) {
      c.fillRect(rx, ry, rw, rh);
    }
    c.fillStyle = "#fde047";
    c.fillRect(112, h * 0.73, 14, 16);
    c.fillRect(302, h * 0.70, 16, 18);

    // 5. Utility Pole & Swaying Power Lines
    const poleX = w * 0.50;
    const poleTopY = h * 0.35;

    c.strokeStyle = "#0b0c18";
    c.lineWidth = 2.2;
    const sway = Math.sin(t * 2.1) * 4;
    for (const dy of [16, 34]) {
      c.beginPath();
      c.moveTo(-10, poleTopY + dy - 16);
      c.quadraticCurveTo(poleX * 0.5, poleTopY + dy + 26 + sway, poleX - 36, poleTopY + dy);
      c.stroke();

      c.beginPath();
      c.moveTo(poleX + 36, poleTopY + dy);
      c.quadraticCurveTo(poleX + (w - poleX) * 0.5, poleTopY + dy + 24 - sway, w + 10, poleTopY + dy - 14);
      c.stroke();
    }

    c.fillStyle = "#1e293b";
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath(); c.roundRect(poleX - 9, poleTopY, 18, h - poleTopY, 4); c.fill(); c.stroke();
    c.fillStyle = "#334155";
    c.beginPath(); c.roundRect(poleX - 42, poleTopY + 12, 84, 8, 3); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(poleX - 32, poleTopY + 30, 64, 7, 3); c.fill(); c.stroke();

    // 6. Rukia Perched on Top of the Utility Pole (Proportioned r=20 + live mood!)
    const leapOffset = line.scene === "pole_leap" ? Math.sin(t * 3.5) * 5 - 8 : Math.sin(t * 2.4) * 1.5;
    if (S.BleachChars) {
      c.save();
      c.fillStyle = "#0f101d";
      c.strokeStyle = INK;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(poleX - 8, poleTopY - 4 + leapOffset);
      c.quadraticCurveTo(poleX - 42, poleTopY - 2 + Math.sin(t * 6) * 7, poleX - 62, poleTopY + 14 + Math.cos(t * 5) * 5);
      c.lineTo(poleX - 10, poleTopY + 12 + leapOffset);
      c.closePath();
      c.fill(); c.stroke();
      c.restore();

      S.BleachChars.drawRukia(c, poleX, poleTopY - 19 + leapOffset, 20, t, {
        noShadow: true,
        mood: line.speakerId === "rukia" ? line.mood : "serious",
        talking: line.speakerId === "rukia",
      });
    }

    // 7. Glowing Jigokucho (Hell Butterfly)
    const bx = w * 0.24 + Math.sin(t * 1.4) * 40;
    const by = h * 0.28 + Math.cos(t * 2.1) * 16;
    const wing = 4 + Math.abs(Math.sin(t * 14)) * 5;
    c.save();
    c.translate(bx, by);
    c.fillStyle = "#f97316";
    c.strokeStyle = "#fef08a";
    c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(-4, 0, wing, 3.2, -0.4, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(4, 0, wing, 3.2, 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();

    // 8. Crisp HD Scene Pill
    c.save();
    c.fillStyle = "rgba(43, 27, 61, 0.90)";
    c.strokeStyle = "#ffe047";
    c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(14, 14, 214, 28, 999); c.fill(); c.stroke();
    c.fillStyle = "#ffe047";
    c.font = "900 12px 'Lilita One', Impact, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("EP. 1 • KARAKURA TOWN (NIGHT)", 121, 28.5);
    c.restore();

    c.restore();
  }

  function renderWindowScene(cv) {
    const c = cv.getContext("2d");
    const w = LOGICAL_W;
    const h = LOGICAL_H;
    const line = currentLines[stepIdx] || currentLines[0];

    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);

    // 1. Dimmed Night Bedroom Wall & Hardwood Floor
    const wallGrad = c.createLinearGradient(0, 0, 0, h * 0.56);
    wallGrad.addColorStop(0, "#1c1830");
    wallGrad.addColorStop(1, "#2c2444");
    c.fillStyle = wallGrad;
    c.fillRect(0, 0, w, h * 0.56);

    // Baseboard trim
    c.fillStyle = "#78350f";
    c.fillRect(0, h * 0.53, w, 16);
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, h * 0.56); c.lineTo(w, h * 0.56); c.stroke();

    // Hardwood floor planks
    for (let row = 0, y = h * 0.56; y < h; row++, y += 30) {
      c.fillStyle = row % 2 === 0 ? "#85522d" : "#774725";
      c.fillRect(0, y, w, 30);
      c.strokeStyle = "rgba(25, 14, 38, 0.35)";
      c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }

    // Poster "15" on right wall
    c.fillStyle = "#b91c1c";
    c.strokeStyle = INK;
    c.lineWidth = 2.8;
    c.beginPath(); c.roundRect(w - 94, 96, 56, 68, 6); c.fill(); c.stroke();
    c.fillStyle = "#fef2f2";
    c.font = "900 24px 'Lilita One', Impact, sans-serif";
    c.textAlign = "center";
    c.fillText("15", w - 66, 138);

    // 2. Large Moonlit Bedroom Window
    const wx = w * 0.5 - 102;
    const wy = 92;
    const ww = 204;
    const wh = 196;

    // Night sky inside window
    c.fillStyle = "#090d24";
    c.strokeStyle = INK;
    c.lineWidth = 4;
    c.beginPath(); c.roundRect(wx, wy, ww, wh, 8); c.fill(); c.stroke();

    // Stars + Full Moon inside window
    c.save();
    c.beginPath(); c.roundRect(wx + 2, wy + 2, ww - 4, wh - 4, 6); c.clip();
    for (const s of stars) {
      const a = 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + s.phase));
      c.fillStyle = `rgba(255,255,240,${a.toFixed(2)})`;
      c.beginPath(); c.arc(wx + s.x * ww, wy + s.y * wh, s.r, 0, Math.PI * 2); c.fill();
    }
    const mx = wx + ww * 0.68;
    const my = wy + wh * 0.36;
    const mg = c.createRadialGradient(mx, my, 10, mx, my, 76);
    mg.addColorStop(0, "rgba(254, 249, 195, 0.5)");
    mg.addColorStop(1, "rgba(254, 249, 195, 0)");
    c.fillStyle = mg;
    c.beginPath(); c.arc(mx, my, 76, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fef9c3";
    c.beginPath(); c.arc(mx, my, 32, 0, Math.PI * 2); c.fill();

    // Silhouette in Step 1 outside the window!
    if (line.scene === "window_shadow") {
      const pulse = 0.65 + 0.35 * Math.sin(t * 6);
      c.fillStyle = `rgba(99, 102, 241, ${(0.28 * pulse).toFixed(2)})`;
      c.beginPath(); c.arc(wx + ww * 0.48, wy + wh * 0.56, 36, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#090a14";
      c.beginPath(); c.arc(wx + ww * 0.48, wy + wh * 0.56, 18, 0, Math.PI * 2); c.fill();
      // Glowing eyes in the shadow
      c.fillStyle = "#818cf8";
      c.beginPath(); c.arc(wx + ww * 0.44, wy + wh * 0.55, 2.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(wx + ww * 0.52, wy + wh * 0.55, 2.5, 0, Math.PI * 2); c.fill();
    }
    c.restore();

    // Window Mullion / Sliding Glass Frame
    const openFrac = line.scene === "window_shadow" ? 0 : line.scene === "window_entry" ? Math.min(1, stepTime * 2.2) : 1;
    c.strokeStyle = "#cbd5e1";
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(wx + ww * 0.5 + openFrac * 44, wy + 2); c.lineTo(wx + ww * 0.5 + openFrac * 44, wy + wh - 2); c.stroke();

    // Curtains on left & right of window
    c.fillStyle = "#334155";
    c.strokeStyle = INK;
    c.lineWidth = 3;
    c.beginPath(); c.roundRect(wx - 22, wy - 8, 28, wh + 16, 6); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(wx + ww - 6, wy - 8, 28, wh + 16, 6); c.fill(); c.stroke();

    // 3. Moonlight Beam Spilling Onto Bedroom Floor
    c.save();
    c.fillStyle = "rgba(254, 249, 195, 0.14)";
    c.beginPath();
    c.moveTo(wx + 10, wy + wh);
    c.lineTo(wx + ww - 10, wy + wh);
    c.lineTo(wx + ww + 64, h * 0.88);
    c.lineTo(wx - 64, h * 0.88);
    c.closePath();
    c.fill();
    c.restore();

    // 4. Rukia Leaping Through the Window (Anime Shunpo Entrance!)
    if (S.BleachChars && (line.scene === "window_entry" || line.scene === "window_landed")) {
      const startX = w * 0.5;
      const startY = wy + wh * 0.52;
      const endX = w * 0.60;
      const endY = h * 0.58;
      const prog = line.scene === "window_entry" ? Math.min(1, stepTime / 0.55) : 1;
      const ease = 1 - Math.pow(1 - prog, 3);
      const rx = startX + (endX - startX) * ease;
      const ry = startY + (endY - startY) * ease - Math.sin(prog * Math.PI) * 34;

      // Spiritual Shunpo wind streaks & burst ring
      if (line.scene === "window_entry") {
        c.save();
        for (let i = 0; i < 6; i++) {
          const sy = startY + i * 24;
          c.strokeStyle = `rgba(129, 140, 248, ${(0.55 * (1 - prog * 0.4)).toFixed(2)})`;
          c.lineWidth = 3;
          c.beginPath();
          c.moveTo(startX - 40 + i * 14, sy);
          c.lineTo(rx - 10 + i * 8, ry + 10);
          c.stroke();
        }
        if (prog > 0.75) {
          const ringP = (prog - 0.75) / 0.25;
          c.strokeStyle = `rgba(165, 180, 252, ${(1 - ringP).toFixed(2)})`;
          c.lineWidth = 4;
          c.beginPath();
          c.ellipse(endX, endY + 18, 22 + ringP * 48, 8 + ringP * 16, 0, 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      }

      S.BleachChars.drawRukia(c, rx, ry, 23, t, {
        mood: line.speakerId === "rukia" ? line.mood : "serious",
        talking: line.speakerId === "rukia",
      });
    }

    // 5. Ichigo Standing in Bedroom Looking Up in Shock
    if (S.BleachChars) {
      const ichigoMood =
        line.speakerId === "ichigo_human"
          ? line.mood
          : (line.partner && line.partner.mood) || "shocked";
      S.BleachChars.drawHumanIchigo(c, w * 0.34, h * 0.63, 22, t, 1, {
        mood: ichigoMood,
        talking: line.speakerId === "ichigo_human",
      });
    }

    // 6. Crisp Scene Pill
    c.save();
    c.fillStyle = "rgba(43, 27, 61, 0.90)";
    c.strokeStyle = "#818cf8";
    c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(14, 14, 240, 28, 999); c.fill(); c.stroke();
    c.fillStyle = "#e0e7ff";
    c.font = "900 12px 'Lilita One', Impact, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("EP. 1 • UNEXPECTED INTRUSION", 134, 28.5);
    c.restore();

    c.restore();
  }

  function renderRukiaBattleScene(cv) {
    const c = cv.getContext("2d");
    const w = LOGICAL_W;
    const h = LOGICAL_H;
    const line = currentLines[stepIdx] || currentLines[0];
    const scene = line.scene;

    // Dynamic Camera Shake on heavy impacts & Reiatsu Awakening
    let shakeX = 0, shakeY = 0;
    if ((scene === "rukia_slash" || scene === "hollow_counter" || scene === "shield_ichigo" || scene === "blade_pierce" || scene === "reiatsu_pillar") && stepTime < 0.50) {
      const mag = (1 - stepTime / 0.50) * (scene === "reiatsu_pillar" ? 11 : 9);
      shakeX = (Math.random() - 0.5) * mag * 2;
      shakeY = (Math.random() - 0.5) * mag * 2;
    }

    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);
    c.translate(shakeX, shakeY);

    // 1. Night Sky + Karakura Street Battleground
    const sky = c.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, "#090b1a");
    sky.addColorStop(1, "#1e1b38");
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h * 0.55);

    for (const s of stars) {
      const a = 0.35 + 0.55 * Math.abs(Math.sin(t * 2 + s.phase));
      c.fillStyle = `rgba(255,255,240,${a.toFixed(2)})`;
      c.beginPath(); c.arc(s.x * w, s.y * h * 0.7, s.r, 0, Math.PI * 2); c.fill();
    }

    // Giant Full Moon
    c.fillStyle = "#fef9c3";
    c.beginPath(); c.arc(w * 0.78, h * 0.16, 40, 0, Math.PI * 2); c.fill();

    // Streetlight & Utility Pole Silhouettes + Asphalt Ground
    c.fillStyle = "#111827";
    c.fillRect(0, h * 0.48, w, h * 0.52);
    c.fillStyle = "#334155";
    c.fillRect(0, h * 0.46, w, 10);
    // Road dashes
    c.fillStyle = "#64748b";
    for (let dx = 20; dx < w; dx += 64) c.fillRect(dx, h * 0.58, 36, 5);

    // Speed lines during clash/counter
    if (scene === "clash_start" || scene === "rukia_slash" || scene === "hollow_counter") {
      c.save();
      c.strokeStyle = scene === "hollow_counter" ? "rgba(239, 68, 68, 0.22)" : "rgba(129, 140, 248, 0.22)";
      c.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const sy = 60 + i * 32 + ((t * 180 + i * 23) % 24);
        c.beginPath(); c.moveTo(0, sy); c.lineTo(w, sy - 24); c.stroke();
      }
      c.restore();
    }

    // 2. Giant Towering Fishbone D Hollow on Right
    let hollowX = w * 0.72;
    let hollowY = h * 0.38;
    if (scene === "rukia_slash" && stepTime > 0.25) {
      hollowX += Math.sin(stepTime * 35) * 4; // Hit recoil
    } else if (scene === "hollow_counter") {
      const p = Math.min(1, stepTime / 0.35);
      hollowX = w * 0.72 - p * 48;
    } else if (scene === "shield_ichigo") {
      const p = Math.min(1, stepTime / 0.3);
      hollowX = w * 0.66 - p * 60;
    }
    if (S.BleachChars) {
      S.BleachChars.drawFishboneHollow(c, hollowX, hollowY, 50, t, {
        talking: scene === "hollow_counter",
      });
    }

    // 3. Ichigo (Human -> Piercing Blade -> Awakened Substitute Shinigami!)
    if (S.BleachChars) {
      if (scene === "reiatsu_pillar" || scene === "shinigami_rise") {
        // Towering Cyan-Blue Reiatsu Pillar Erupting into the Night Sky!
        if (scene === "reiatsu_pillar") {
          const pw = 56 + Math.sin(t * 24) * 10;
          const pillarGrad = c.createLinearGradient(w * 0.24 - pw, 0, w * 0.24 + pw, 0);
          pillarGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
          pillarGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.55)");
          pillarGrad.addColorStop(0.5, "rgba(224, 242, 254, 0.92)");
          pillarGrad.addColorStop(0.7, "rgba(56, 189, 248, 0.55)");
          pillarGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
          c.fillStyle = pillarGrad;
          c.fillRect(w * 0.24 - pw, 0, pw * 2, h * 0.52);
        }
        // Awakened Substitute Shinigami Ichigo (Black Shihakusho + Giant Ep. 1 Zanpakuto!)
        const riseX = scene === "shinigami_rise" ? w * 0.30 : w * 0.24;
        const riseY = scene === "shinigami_rise" ? h * 0.43 : h * 0.44;
        S.BleachChars.drawShinigamiIchigo(c, riseX, riseY, scene === "shinigami_rise" ? 24 : 22, t, 1, {
          mood: "battle",
          talking: line.speakerId === "ichigo_shinigami",
        });
      } else {
        const ichigoX = scene === "blade_pierce" ? w * 0.24 : w * 0.16;
        S.BleachChars.drawHumanIchigo(c, ichigoX, h * 0.45, 20, t, 1, {
          mood: scene === "power_transfer" ? "serious" : scene === "blade_pierce" ? "battle" : "shocked",
          talking: line.speakerId === "ichigo_human",
        });
      }
    }

    // 4. Rukia Animated Combat Choreography!
    let rukiaX = w * 0.34;
    let rukiaY = h * 0.42;
    let rukiaMood = "battle";
    let showKatana = true;

    if (scene === "clash_start") {
      const dash = Math.min(1, stepTime / 0.4);
      rukiaX = w * 0.24 + dash * (w * 0.18);
      rukiaY = h * 0.42 - Math.sin(dash * Math.PI) * 58;
    } else if (scene === "rukia_slash") {
      rukiaX = w * 0.44;
      rukiaY = h * 0.36 + Math.sin(t * 14) * 6;
    } else if (scene === "hollow_counter") {
      const kb = Math.min(1, stepTime / 0.4);
      rukiaX = w * 0.44 - kb * 64;
      rukiaY = h * 0.38 + kb * 24;
      rukiaMood = "shocked";
    } else if (scene === "shield_ichigo") {
      rukiaX = w * 0.28;
      rukiaY = h * 0.45 + Math.min(1, stepTime * 3) * 12;
      rukiaMood = "sweat";
    } else if (scene === "power_transfer") {
      rukiaX = w * 0.32;
      rukiaY = h * 0.47;
      rukiaMood = "serious";
    } else if (scene === "blade_pierce") {
      rukiaX = w * 0.35;
      rukiaY = h * 0.47;
      rukiaMood = "shocked";
      showKatana = false;
    } else if (scene === "reiatsu_pillar" || scene === "shinigami_rise") {
      rukiaX = w * 0.14;
      rukiaY = h * 0.48;
      rukiaMood = "shocked";
      showKatana = false;
    }

    // Shunpo afterimage trail in Step 1
    if (scene === "clash_start" && stepTime < 0.5) {
      c.save();
      c.globalAlpha = 0.28;
      S.BleachChars.drawRukia(c, w * 0.24, h * 0.42, 21, t, { noShadow: true, mood: "battle" });
      c.restore();
    }

    if (S.BleachChars) {
      S.BleachChars.drawRukia(c, rukiaX, rukiaY, 21, t, {
        mood: rukiaMood,
        talking: line.speakerId === "rukia",
      });
    }

    // Glowing Zanpakuto Blade in Rukia's hand (or pointed toward Ichigo in Step 5)
    if (showKatana) {
      c.save();
      c.translate(rukiaX, rukiaY);
      const bladeAng = scene === "power_transfer" ? Math.PI * 0.92 : -0.45 + Math.sin(t * 10) * 0.15;
      c.rotate(bladeAng);
      if (scene === "power_transfer") {
        c.shadowColor = "#38bdf8";
        c.shadowBlur = 14;
      }
      c.fillStyle = "#e2e8f0";
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.fillRect(14, -3, 36, 5);
      c.strokeRect(14, -3, 36, 5);
      c.restore();
    }

    // 5. Epic Attack VFX per Step!
    if (scene === "rukia_slash") {
      // Cyan Sword Slash Cross + Red Shakkaho Fireball!
      const p = Math.min(1, stepTime / 0.55);
      c.save();
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 5;
      c.lineCap = "round";
      c.beginPath();
      c.arc(hollowX - 10, hollowY - 8, 52, -0.8, 0.9);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(hollowX - 10, hollowY - 8, 52, -0.8, 0.9);
      c.stroke();

      // Shakkaho Crimson Blast
      const bx = rukiaX + (hollowX - rukiaX) * p;
      const by = rukiaY + (hollowY - rukiaY) * p;
      const fire = c.createRadialGradient(bx, by, 4, bx, by, 34);
      fire.addColorStop(0, "#fef08a");
      fire.addColorStop(0.45, "#ef4444");
      fire.addColorStop(1, "rgba(239, 68, 68, 0)");
      c.fillStyle = fire;
      c.beginPath(); c.arc(bx, by, 34, 0, Math.PI * 2); c.fill();
      c.restore();
    } else if (scene === "hollow_counter" || scene === "shield_ichigo") {
      // Massive Crimson Hollow Claw Slash Arcs + Impact Flash!
      const alpha = Math.max(0, 1 - stepTime * 1.4);
      if (alpha > 0) {
        c.save();
        c.strokeStyle = `rgba(220, 38, 38, ${alpha.toFixed(2)})`;
        c.lineWidth = 6;
        c.lineCap = "round";
        const tx = scene === "shield_ichigo" ? rukiaX : rukiaX + 20;
        const ty = scene === "shield_ichigo" ? rukiaY : rukiaY;
        for (let k = -1; k <= 1; k++) {
          c.beginPath();
          c.moveTo(tx + 34, ty - 34 + k * 14);
          c.lineTo(tx - 38, ty + 34 + k * 14);
          c.stroke();
        }
        if (stepTime < 0.16) {
          c.fillStyle = `rgba(239, 68, 68, ${(0.35 * (1 - stepTime / 0.16)).toFixed(2)})`;
          c.fillRect(0, 0, w, h);
        }
        c.restore();
      }
    } else if (scene === "blade_pierce") {
      // Glowing Blue Zanpakuto Piercing Ichigo + Blinding Spiritual Flash!
      c.save();
      c.translate(w * 0.24, h * 0.45);
      c.shadowColor = "#38bdf8";
      c.shadowBlur = 18;
      c.fillStyle = "#e0f2fe";
      c.strokeStyle = "#0284c7";
      c.lineWidth = 2.5;
      c.fillRect(0, -4, 48, 8);
      c.strokeRect(0, -4, 48, 8);
      const ringR = 16 + ((stepTime * 90) % 58);
      c.strokeStyle = "rgba(56, 189, 248, 0.78)";
      c.lineWidth = 4;
      c.beginPath(); c.arc(0, 0, ringR, 0, Math.PI * 2); c.stroke();
      c.restore();
      if (stepTime < 0.25) {
        c.fillStyle = `rgba(186, 230, 253, ${(0.65 * (1 - stepTime / 0.25)).toFixed(2)})`;
        c.fillRect(0, 0, w, h);
      }
    }

    // 6. Crisp Scene Pill
    c.save();
    const isAwaken = scene === "blade_pierce" || scene === "reiatsu_pillar" || scene === "shinigami_rise";
    c.fillStyle = "rgba(43, 27, 61, 0.92)";
    c.strokeStyle = isAwaken ? "#38bdf8" : "#ef4444";
    c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(14, 14, 246, 28, 999); c.fill(); c.stroke();
    c.fillStyle = isAwaken ? "#bae6fd" : "#fecaca";
    c.font = "900 12px 'Lilita One', Impact, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(isAwaken ? "EP. 1 • SHINIGAMI AWAKENING" : "EP. 1 • SHINIGAMI VS HOLLOW", 137, 28.5);
    c.restore();

    c.restore();
  }

  function renderArc1IntroScene(cv) {
    const c = cv.getContext("2d");
    const w = LOGICAL_W;
    const h = LOGICAL_H;
    const line = currentLines[stepIdx] || ARC1_INTRO_LINES[0];
    const scene = line.scene || "morning_sky";

    c.save();
    c.scale(DPR, DPR);

    if (scene === "morning_sky") {
      // 1. Bright Morning Sky Over Karakura Town
      const sky = c.createLinearGradient(0, 0, 0, h * 0.65);
      sky.addColorStop(0, "#0284c7");
      sky.addColorStop(0.55, "#38bdf8");
      sky.addColorStop(1, "#fef08a");
      c.fillStyle = sky;
      c.fillRect(0, 0, w, h);

      // Rising Morning Sun + Glow
      const sunPulse = 46 + Math.sin(t * 2.2) * 3;
      const sunGlow = c.createRadialGradient(w * 0.72, 128, 12, w * 0.72, 128, 130);
      sunGlow.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      sunGlow.addColorStop(0.45, "rgba(253, 224, 71, 0.38)");
      sunGlow.addColorStop(1, "rgba(253, 224, 71, 0)");
      c.fillStyle = sunGlow;
      c.beginPath(); c.arc(w * 0.72, 128, 130, 0, Math.PI * 2); c.fill();

      c.fillStyle = "#fef9c3";
      c.beginPath(); c.arc(w * 0.72, 128, sunPulse, 0, Math.PI * 2); c.fill();

      // Fluffy Morning Clouds
      c.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let i = 0; i < 3; i++) {
        const cx = ((70 + i * 145 + t * 8) % (w + 120)) - 60;
        const cy = 76 + (i % 2) * 42;
        c.beginPath();
        c.arc(cx, cy, 20, 0, Math.PI * 2);
        c.arc(cx + 22, cy - 6, 24, 0, Math.PI * 2);
        c.arc(cx + 46, cy + 2, 18, 0, Math.PI * 2);
        c.fill();
      }

      // Karakura Town Rooftops Silhouette
      c.fillStyle = "#334155";
      c.fillRect(0, h * 0.44, w, h * 0.56);
      c.fillStyle = "#1e293b";
      c.fillRect(16, h * 0.34, 88, h * 0.22);
      c.fillRect(118, h * 0.38, 108, h * 0.18);
      c.fillRect(242, h * 0.31, 96, h * 0.25);
      c.fillRect(350, h * 0.36, 90, h * 0.20);
    } else {
      // 2. Sunlit Ichigo's Bedroom (The Next Morning — Detailed Room)
      c.fillStyle = "#f5efe0";
      c.fillRect(0, 0, w, h);

      // Hardwood Floor + Plank Seams + Baseboard Trim
      c.fillStyle = "#d9a66f";
      c.fillRect(0, h * 0.44, w, h * 0.56);
      c.fillStyle = "#b45309";
      c.fillRect(0, h * 0.44 - 12, w, 12);
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, h * 0.44); c.lineTo(w, h * 0.44); c.stroke();
      c.strokeStyle = "rgba(120, 53, 15, 0.25)";
      c.lineWidth = 2;
      for (let row = 0, y = h * 0.44; y < h; row++, y += 26) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
        const off = (row % 2) * 44;
        for (let px = 50 + off; px < w; px += 88) {
          c.beginPath(); c.moveTo(px, y); c.lineTo(px, Math.min(h, y + 26)); c.stroke();
        }
      }

      // Cozy Woven Bedroom Rug
      c.fillStyle = "#fde68a";
      c.strokeStyle = "#d97706";
      c.lineWidth = 3;
      c.beginPath(); c.roundRect(w * 0.22, h * 0.52, w * 0.56, 98, 14); c.fill(); c.stroke();
      c.strokeStyle = "rgba(217, 119, 6, 0.35)";
      c.lineWidth = 2;
      c.beginPath(); c.roundRect(w * 0.24, h * 0.535, w * 0.52, 78, 10); c.stroke();

      // Wall Clock (Top-Left)
      c.fillStyle = "#ffffff";
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.beginPath(); c.arc(54, 86, 19, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = "#ef4444";
      c.beginPath(); c.arc(54, 86, 2.5, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(54, 86); c.lineTo(54, 72); c.stroke();
      c.beginPath(); c.moveTo(54, 86); c.lineTo(65, 89); c.stroke();

      // Framed "15" Poster + Wall Shelf (Top-Right)
      c.fillStyle = "#ef4444";
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.beginPath(); c.roundRect(w - 86, 56, 56, 68, 6); c.fill(); c.stroke();
      c.fillStyle = "#fef08a";
      c.font = "900 22px 'Lilita One', Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("15", w - 58, 90);

      // Morning Window with Blue Sky, Clouds & Curtains
      const wx = w * 0.26;
      const wy = 46;
      const ww = w * 0.48;
      const wh = 136;
      const winSky = c.createLinearGradient(wx, wy, wx, wy + wh);
      winSky.addColorStop(0, "#0ea5e9");
      winSky.addColorStop(1, "#bae6fd");
      c.fillStyle = winSky;
      c.strokeStyle = INK;
      c.lineWidth = 4;
      c.beginPath(); c.roundRect(wx, wy, ww, wh, 10); c.fill(); c.stroke();

      c.fillStyle = "#fde047";
      c.beginPath(); c.arc(wx + ww - 38, wy + 34, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255, 255, 255, 0.88)";
      c.beginPath();
      c.arc(wx + 42, wy + 46, 12, 0, Math.PI * 2);
      c.arc(wx + 58, wy + 42, 14, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(wx + ww * 0.5, wy); c.lineTo(wx + ww * 0.5, wy + wh); c.stroke();
      c.beginPath(); c.moveTo(wx, wy + wh * 0.52); c.lineTo(wx + ww, wy + wh * 0.52); c.stroke();

      // Side Curtains
      c.fillStyle = "#334155";
      c.strokeStyle = INK;
      c.lineWidth = 2.6;
      c.beginPath(); c.roundRect(wx - 14, wy - 4, 22, wh + 10, 6); c.fill(); c.stroke();
      c.beginPath(); c.roundRect(wx + ww - 8, wy - 4, 22, wh + 10, 6); c.fill(); c.stroke();

      // Warm Golden Morning Sunbeam Spill + Floating Dust Motes
      c.save();
      c.fillStyle = "rgba(254, 240, 138, 0.26)";
      c.beginPath();
      c.moveTo(wx + 8, wy + wh);
      c.lineTo(wx + ww - 8, wy + wh);
      c.lineTo(wx + ww + 74, h * 0.86);
      c.lineTo(wx - 74, h * 0.86);
      c.closePath();
      c.fill();
      c.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 6; i++) {
        const mx = wx + 22 + i * 32 + Math.sin(t * 1.5 + i) * 6;
        const my = wy + wh + 24 + ((i * 29 + t * 10) % 130);
        c.beginPath(); c.arc(mx, my, 2.2, 0, Math.PI * 2); c.fill();
      }
      c.restore();

      // Ichigo's Bed (Left Side — Rumpled Orange Blanket & Pillow)
      c.fillStyle = "#92400e";
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.beginPath(); c.roundRect(14, h * 0.40, 118, 126, 10); c.fill(); c.stroke();
      c.fillStyle = "#fefce8";
      c.beginPath(); c.roundRect(22, h * 0.415, 102, 104, 8); c.fill(); c.stroke();
      // Pillow
      c.fillStyle = "#ffffff";
      c.beginPath(); c.roundRect(30, h * 0.425, 58, 26, 8); c.fill(); c.stroke();
      // Orange Blanket
      c.fillStyle = "#f97316";
      c.beginPath(); c.roundRect(22, h * 0.48, 102, 62, 8); c.fill(); c.stroke();
      c.fillStyle = "#fb923c";
      c.fillRect(26, h * 0.485, 94, 12);

      // Nightstand + Alarm Clock beside Bed
      c.fillStyle = "#b45309";
      c.beginPath(); c.roundRect(140, h * 0.41, 44, 48, 7); c.fill(); c.stroke();
      c.fillStyle = "#ef4444";
      c.beginPath(); c.arc(162, h * 0.40, 10, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = "#ffffff";
      c.beginPath(); c.arc(162, h * 0.40, 6.5, 0, Math.PI * 2); c.fill();

      // Study Desk + Chair + Lamp + School Bag (Right Side)
      c.fillStyle = "#b45309";
      c.beginPath(); c.roundRect(w - 134, h * 0.40, 118, 66, 8); c.fill(); c.stroke();
      c.fillStyle = "#d97706";
      c.fillRect(w - 128, h * 0.41, 106, 16);
      // Desk Lamp
      c.fillStyle = "#334155";
      c.beginPath(); c.roundRect(w - 48, h * 0.37, 22, 14, 5); c.fill(); c.stroke();
      c.fillStyle = "#fde047";
      c.beginPath(); c.arc(w - 37, h * 0.36, 7, 0, Math.PI * 2); c.fill(); c.stroke();
      // Open Notebook & Manga Stack on Desk
      c.fillStyle = "#ffffff";
      c.beginPath(); c.roundRect(w - 118, h * 0.405, 38, 22, 3); c.fill(); c.stroke();
      c.fillStyle = "#38bdf8";
      c.beginPath(); c.roundRect(w - 72, h * 0.41, 24, 18, 3); c.fill(); c.stroke();
      // Desk Chair
      c.fillStyle = "#475569";
      c.beginPath(); c.roundRect(w - 92, h * 0.48, 38, 32, 8); c.fill(); c.stroke();
      // Karakura High School Bag on Floor
      c.fillStyle = "#1e293b";
      c.beginPath(); c.roundRect(w - 46, h * 0.51, 32, 26, 6); c.fill(); c.stroke();
      c.strokeStyle = "#f59e0b";
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(w - 40, h * 0.51); c.lineTo(w - 20, h * 0.51); c.stroke();

      // Human Ichigo in His Bedroom
      if (S.BleachChars) {
        S.BleachChars.drawHumanIchigo(c, w * 0.5, h * 0.54, 26, t, scene === "school_bound" ? 1 : -1, {
          mood: line.mood || "shocked",
          talking: true,
        });
      }
    }

    // Crisp Scene Pill
    c.save();
    c.fillStyle = "rgba(43, 27, 61, 0.90)";
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(14, 14, 244, 28, 999); c.fill(); c.stroke();
    c.fillStyle = "#fef3c7";
    c.font = "900 12px 'Lilita One', Impact, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("ARC 1 • THE NEXT MORNING", 136, 28.5);
    c.restore();

    c.restore();
  }

  function loop() {
    if (!active) return;
    t += 0.016;
    stepTime += 0.016;
    const cv = document.getElementById("story-cutscene-canvas");
    if (cv) {
      if (currentMode === "window") renderWindowScene(cv);
      else if (currentMode === "battle") renderRukiaBattleScene(cv);
      else if (currentMode === "arc1_intro") renderArc1IntroScene(cv);
      else renderPoleScene(cv);
    }
    rafId = requestAnimationFrame(loop);
  }

  function showCurrentLine() {
    const line = currentLines[stepIdx];
    if (!line) return;
    stepTime = 0;
    if (S.UI && S.UI.showVNDialogue) {
      S.UI.showVNDialogue({
        side: line.side,
        speakerId: line.speakerId,
        mood: line.mood,
        partner: line.partner || null,
        name: line.name,
        text: line.text,
        nextLabel:
          stepIdx < currentLines.length - 1
            ? "NEXT ▶"
            : currentMode === "window"
            ? "CONFRONT ▶"
            : currentMode === "battle"
            ? "AWAKEN ▶"
            : currentMode === "arc1_intro"
            ? "WAKE UP ▶"
            : "ENTER ROOM ▶",
        onNext: () => {
          if (stepIdx < currentLines.length - 1) {
            stepIdx++;
            showCurrentLine();
          } else {
            stop(true);
          }
        },
      });
    }
  }

  function startScene(mode, lines, onDone) {
    currentMode = mode;
    currentLines = lines;
    onDoneCb = onDone;
    stepIdx = 0;
    stepTime = 0;
    t = 0;
    active = true;
    const wrap = document.getElementById("story-cutscene");
    if (wrap) wrap.classList.remove("hidden");
    const cv = document.getElementById("story-cutscene-canvas");
    if (cv) {
      cv.width = LOGICAL_W * DPR;
      cv.height = LOGICAL_H * DPR;
    }
    showCurrentLine();
    rafId = requestAnimationFrame(loop);
  }

  function start(onDone) {
    startScene("pole", EP1_INTRO_LINES, onDone);
  }

  function startWindowIntrusion(onDone) {
    startScene("window", WINDOW_INTRUSION_LINES, onDone);
  }

  function startRukiaVsHollowBattle(onDone) {
    startScene("battle", RUKIA_BATTLE_LINES, onDone);
  }

  function startArc1Intro(onDone) {
    startScene("arc1_intro", ARC1_INTRO_LINES, onDone);
  }

  function stop(triggerCb = false) {
    active = false;
    cancelAnimationFrame(rafId);
    const wrap = document.getElementById("story-cutscene");
    if (wrap) wrap.classList.add("hidden");
    if (S.UI && S.UI.hideVNDialogue) S.UI.hideVNDialogue();
    if (triggerCb && onDoneCb) {
      const cb = onDoneCb;
      onDoneCb = null;
      cb();
    }
  }

  S.BleachCutscenes = {
    start,
    startWindowIntrusion,
    startRukiaVsHollowBattle,
    startArc1Intro,
    stop,
  };
})();
