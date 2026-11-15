// Story Saga 2D Top-Down Overworld Engine (Hi-DPI 2x Canvas + 12 Live Moods)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const LOGICAL_W = 440;
  const LOGICAL_H = 680;
  const DPR = 2;

  let running = false;
  let rafId = 0;
  let lastTs = 0;
  let t = 0;

  const keys = {};
  const joy = { active: false, dx: 0, dy: 0 };

  const player = {
    x: 215,
    y: 285,
    r: 18,
    speed: 150,
    facing: 1,
    mood: "neutral",
    moodTimer: 2.0,
  };

  const IDLE_MOODS = [
    "neutral",
    "suspicious",
    "smirk",
    "sleepy",
    "serious",
    "deadpan",
    "happy",
  ];

  let activeInspectable = null;
  let dialogueOpen = false;
  let shunpoFlash = 0;
  let zoneFade = 0;

  function switchZone(targetZone, spawnX, spawnY, onEnter) {
    const st = S.Quests.getState();
    if (onEnter) onEnter(st);
    S.Quests.setZone(targetZone);
    player.x = spawnX;
    player.y = spawnY;
    zoneFade = 1.0;
    activeInspectable = null;
    S.UI.syncHud();
    const map = currentMap();
    if (map && map.name) S.UI.showToast(map.name);
  }

  function currentMap() {
    const st = S.Quests.getState();
    return (S.Maps && S.Maps[st.zone]) || S.Maps.ichigo_bedroom;
  }

  function getVisibleNpcs(map) {
    const st = S.Quests.getState();
    return (map.npcs || []).filter((n) => !n.visibleWhen || n.visibleWhen(st));
  }

  function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < cr * cr;
  }

  function canStandAt(nx, ny, map) {
    const pad = player.r + 2;
    if (nx < pad || ny < pad || nx > map.w - pad || ny > map.h - pad) return false;
    for (const w of map.walls || []) {
      if (circleRectCollide(nx, ny, player.r - 2, w.x, w.y, w.w, w.h)) return false;
    }
    for (const npc of getVisibleNpcs(map)) {
      if (Math.hypot(nx - npc.x, ny - npc.y) < player.r + npc.r - 2) return false;
    }
    return true;
  }

  function getMoveVec() {
    let vx = joy.dx;
    let vy = joy.dy;
    if (keys["KeyW"] || keys["ArrowUp"]) vy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) vy += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) vx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) vx += 1;
    return { vx, vy };
  }

  function update(dt) {
    t += dt;
    if (shunpoFlash > 0) shunpoFlash = Math.max(0, shunpoFlash - dt);
    if (zoneFade > 0) zoneFade = Math.max(0, zoneFade - dt * 2.6);
    if (dialogueOpen) return;

    if (S.Battle && S.Battle.isActive()) {
      const mv = getMoveVec();
      S.Battle.update(dt, player, mv.vx, mv.vy);
      return;
    }

    const map = currentMap();
    let { vx, vy } = getMoveVec();

    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }

    if (Math.abs(vx) > 0.08) {
      player.facing = vx >= 0 ? 1 : -1;
    }

    const stepX = vx * player.speed * dt;
    const stepY = vy * player.speed * dt;

    if (canStandAt(player.x + stepX, player.y, map)) player.x += stepX;
    if (canStandAt(player.x, player.y + stepY, map)) player.y += stepY;

    // Cycle live expressions naturally on Ichigo in the room
    player.moodTimer -= dt;
    if (player.moodTimer <= 0) {
      if (len > 0.15) {
        player.mood = "serious";
        player.moodTimer = 1.2;
      } else {
        player.mood = IDLE_MOODS[Math.floor(Math.random() * IDLE_MOODS.length)];
        player.moodTimer = 2.4 + Math.random() * 2.0;
      }
    }

    // Check nearby NPCs first, then inspectable furniture
    activeInspectable = null;
    let bestDist = Infinity;
    for (const npc of getVisibleNpcs(map)) {
      const d = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (d <= npc.r + player.r + 22 && d < bestDist) {
        bestDist = d;
        activeInspectable = npc;
      }
    }
    if (!activeInspectable) {
      for (const item of map.inspectables || []) {
        const d = Math.hypot(player.x - item.x, player.y - item.y);
        if (d <= item.r + player.r + 12 && d < bestDist) {
          bestDist = d;
          activeInspectable = item;
        }
      }
    }

    const btnInteract = document.getElementById("story-interact-btn");
    if (btnInteract) {
      if (activeInspectable) {
        const st = S.Quests.getState();
        btnInteract.textContent =
          (activeInspectable.getLabel && activeInspectable.getLabel(st)) ||
          activeInspectable.label ||
          "INSPECT (F)";
        btnInteract.classList.remove("hidden");
      } else {
        btnInteract.classList.add("hidden");
      }
    }
  }

  function render() {
    const cv = document.getElementById("story-canvas");
    if (!cv) return;
    if (cv.width !== LOGICAL_W * DPR || cv.height !== LOGICAL_H * DPR) {
      cv.width = LOGICAL_W * DPR;
      cv.height = LOGICAL_H * DPR;
    }
    const c = cv.getContext("2d");
    const map = currentMap();

    const w = LOGICAL_W;
    const h = LOGICAL_H;

    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = "#161124";
    c.fillRect(0, 0, w, h);

    // Center camera on active map (+ Battle Camera Shake)
    const shakeOff = S.Battle && S.Battle.isActive() ? S.Battle.getShakeOffset() : { x: 0, y: 0 };
    const camX = Math.round((w - map.w) * 0.5 + shakeOff.x);
    const camY = Math.round((h - map.h) * 0.5 + 14 + shakeOff.y);

    c.save();
    c.translate(camX, camY);

    c.fillStyle = "rgba(0,0,0,0.42)";
    c.beginPath(); c.roundRect(-6, -4, map.w + 12, map.h + 14, 14); c.fill();

    map.drawGround(c, t);

    if (S.Battle && S.Battle.isActive()) {
      S.Battle.renderEntitiesAndVfx(c, player);
      c.restore();
      const uFlash = S.Battle.getUltFlash();
      if (uFlash > 0) {
        c.fillStyle = `rgba(56, 189, 248, ${(uFlash * 0.55).toFixed(2)})`;
        c.fillRect(0, 0, w, h);
      }
      if (S.Battle.renderScreenOverlay) S.Battle.renderScreenOverlay(c, w, h);
      c.restore();
      renderMinimap(map);
      return;
    }

    // 1. Subtle 4-point anime sparkle glints on non-active inspectable furniture (skip portals so door text stays clean)
    if (!dialogueOpen && map.inspectables) {
      for (let i = 0; i < map.inspectables.length; i++) {
        const it = map.inspectables[i];
        if (it === activeInspectable || !it.box || it.portal) continue;
        const sx = it.box.x + it.box.w * 0.5;
        const sy = it.box.y + it.box.h * 0.45;
        const sScale = 0.55 + 0.45 * Math.sin(t * 3.8 + i * 1.4);
        const rOut = 5.5 * sScale;
        const rIn = 1.6 * sScale;
        c.save();
        c.translate(sx, sy);
        c.fillStyle = "#fffbeb";
        c.strokeStyle = "#2b1b3d";
        c.lineWidth = 1.4;
        c.beginPath();
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4;
          const rad = k % 2 === 0 ? rOut : rIn;
          const px = Math.cos(ang) * rad;
          const py = Math.sin(ang) * rad;
          if (k === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    }

    // 2. Animated Golden Corner Brackets around active furniture box
    if (activeInspectable && !dialogueOpen && activeInspectable.box) {
      const b = activeInspectable.box;
      const pad = 4 + Math.sin(t * 7) * 2.2;
      const bx = b.x - pad;
      const by = b.y - pad;
      const bw = b.w + pad * 2;
      const bh = b.h + pad * 2;
      const arm = Math.min(11, bw * 0.26, bh * 0.26);

      c.save();
      // Soft warm highlight glow over the furniture
      c.fillStyle = `rgba(255, 224, 71, ${(0.11 + 0.05 * Math.sin(t * 7)).toFixed(3)})`;
      c.beginPath();
      c.roundRect(bx + 2, by + 2, bw - 4, bh - 4, 8);
      c.fill();

      function traceCorners() {
        c.beginPath();
        // Top-Left
        c.moveTo(bx, by + arm); c.lineTo(bx, by); c.lineTo(bx + arm, by);
        // Top-Right
        c.moveTo(bx + bw - arm, by); c.lineTo(bx + bw, by); c.lineTo(bx + bw, by + arm);
        // Bottom-Right
        c.moveTo(bx + bw, by + bh - arm); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw - arm, by + bh);
        // Bottom-Left
        c.moveTo(bx + arm, by + bh); c.lineTo(bx, by + bh); c.lineTo(bx, by + bh - arm);
      }

      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = "#2b1b3d";
      c.lineWidth = 5.4;
      traceCorners();
      c.stroke();

      c.strokeStyle = "#ffe047";
      c.lineWidth = 2.6;
      traceCorners();
      c.stroke();
      c.restore();
    }

    // 2.5 Draw Visible NPCs (Rukia, Karin, Yuzu, Isshin, Fishbone D + Shunpo Arrival Burst)
    if (S.BleachChars) {
      for (const npc of getVisibleNpcs(map)) {
        if (shunpoFlash > 0 && npc.speakerId === "rukia") {
          c.save();
          const prog = 1 - shunpoFlash / 1.1;
          c.strokeStyle = `rgba(99, 102, 241, ${(1 - prog).toFixed(2)})`;
          c.lineWidth = 4;
          c.beginPath();
          c.arc(npc.x, npc.y, 18 + prog * 42, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
        const npcSpeaking = dialogueOpen && activeInspectable && activeInspectable.id === npc.id;
        const defaultMood = npc.speakerId === "yuzu" ? "sweat" : npc.speakerId === "karin" ? "angry" : npc.speakerId === "isshin" ? "sweat" : "serious";
        const drawFn = S.BleachChars.drawById || S.BleachChars.drawRukia;
        if (S.BleachChars.drawById) {
          drawFn(npc.speakerId, c, npc.x, npc.y, npc.r, t, {
            mood: npcSpeaking ? (S.UI.getCurrentMood() || defaultMood) : defaultMood,
            talking: npcSpeaking,
            facing: player.x < npc.x ? -1 : 1,
          });
        } else {
          S.BleachChars.drawRukia(c, npc.x, npc.y, npc.r, t, {
            mood: npcSpeaking ? (S.UI.getCurrentMood() || "serious") : "serious",
            talking: npcSpeaking,
          });
        }
      }
    }

    // 3. Draw Ichigo (Human -> Substitute Shinigami once awakened!) with live 12-mood expression
    if (S.BleachChars) {
      const st = S.Quests.getState();
      const activeMood =
        (dialogueOpen && S.UI && S.UI.getCurrentMood && S.UI.getCurrentMood()) ||
        (st.hasPowers && player.mood === "neutral" ? "battle" : player.mood);
      const drawIchigo =
        st.hasPowers && S.BleachChars.drawShinigamiIchigo
          ? S.BleachChars.drawShinigamiIchigo
          : S.BleachChars.drawHumanIchigo;
      drawIchigo(c, player.x, player.y, player.r, t, player.facing, {
        mood: activeMood,
        talking: dialogueOpen,
      });
    }

    // 4. Floating Cartoon Action Badge + Bouncing Pointer Arrow (drawn on top so never occluded)
    if (activeInspectable && !dialogueOpen) {
      const b = activeInspectable.box || {
        x: activeInspectable.x - 20,
        y: activeInspectable.y - 20,
        w: 40,
        h: 40,
      };
      const bob = Math.sin(t * 7.5) * 2.8;
      const st = S.Quests.getState();
      const tagText =
        (activeInspectable.getShortLabel && activeInspectable.getShortLabel(st)) ||
        activeInspectable.shortLabel ||
        "INSPECT";
      c.save();
      c.font = "900 10px 'Nunito', sans-serif";
      const textW = c.measureText(tagText).width;
      const pillW = Math.round(textW + 34);
      const pillH = 22;

      const anchorX = Math.max(
        pillW * 0.5 + 10,
        Math.min(map.w - pillW * 0.5 - 10, b.x + b.w * 0.5)
      );
      // Place badge above the furniture (or below if near the very top wall like the window)
      const placeBelow = b.y < 36;
      const arrowTipY = placeBelow ? b.y + b.h + 4 - bob : b.y - 4 + bob;
      const pillY = placeBelow ? arrowTipY + 6 : arrowTipY - 6 - pillH;
      const pillX = Math.round(anchorX - pillW * 0.5);

      // Drop shadow
      c.fillStyle = "#2b1b3d";
      c.beginPath();
      c.roundRect(pillX, pillY + 2.5, pillW, pillH, 11);
      c.fill();

      // Main cream/dark badge body
      c.fillStyle = "#fffdf4";
      c.strokeStyle = "#2b1b3d";
      c.lineWidth = 2.4;
      c.beginPath();
      c.roundRect(pillX, pillY, pillW, pillH, 11);
      c.fill();
      c.stroke();

      // Green [F] keycap circle on left
      const keyCx = pillX + 12;
      const keyCy = pillY + pillH * 0.5;
      c.fillStyle = "#22c55e";
      c.beginPath();
      c.arc(keyCx, keyCy, 7.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.fillStyle = "#ffffff";
      c.font = "900 9.5px 'Lilita One', Impact, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("F", keyCx, keyCy + 0.5);

      // Crisp dark label text
      c.fillStyle = "#2b1b3d";
      c.font = "900 10px 'Nunito', sans-serif";
      c.textAlign = "left";
      c.fillText(tagText, pillX + 24, keyCy + 0.5);

      // Bouncing golden pointer triangle (▼ or ▲)
      const triX = Math.max(pillX + 12, Math.min(pillX + pillW - 12, b.x + b.w * 0.5));
      c.fillStyle = "#ffe047";
      c.strokeStyle = "#2b1b3d";
      c.lineWidth = 2.2;
      c.beginPath();
      if (placeBelow) {
        c.moveTo(triX, arrowTipY);
        c.lineTo(triX - 5, arrowTipY + 6);
        c.lineTo(triX + 5, arrowTipY + 6);
      } else {
        c.moveTo(triX, arrowTipY);
        c.lineTo(triX - 5, arrowTipY - 6);
        c.lineTo(triX + 5, arrowTipY - 6);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    c.restore();

    if (zoneFade > 0) {
      c.fillStyle = `rgba(9, 11, 26, ${zoneFade.toFixed(2)})`;
      c.fillRect(0, 0, w, h);
    }

    c.restore();

    renderMinimap(map);
  }

  function renderMinimap(map) {
    const mcv = document.getElementById("story-minimap");
    if (!mcv) return;
    if (mcv.width !== 104 * DPR) {
      mcv.width = 104 * DPR;
      mcv.height = 78 * DPR;
      mcv.style.width = "104px";
      mcv.style.height = "78px";
    }
    const mc = mcv.getContext("2d");
    const mw = 104;
    const mh = 78;
    mc.save();
    mc.setTransform(DPR, 0, 0, DPR, 0, 0);
    mc.fillStyle = "#1e1b2e";
    mc.fillRect(0, 0, mw, mh);

    const sx = (mw - 12) / map.w;
    const sy = (mh - 12) / map.h;
    mc.save();
    mc.translate(6, 6);
    mc.fillStyle = "#d8a46c";
    mc.fillRect(0, 0, map.w * sx, map.h * sy);

    mc.fillStyle = "#78350f";
    for (const w of map.walls || []) {
      mc.fillRect(w.x * sx, w.y * sy, w.w * sx, w.h * sy);
    }

    for (const npc of getVisibleNpcs(map)) {
      mc.fillStyle = npc.speakerId === "hollow_fishbone" ? "#ef4444" : "#6366f1";
      mc.strokeStyle = "#ffffff";
      mc.lineWidth = 1.4;
      mc.beginPath();
      mc.arc(npc.x * sx, npc.y * sy, npc.speakerId === "hollow_fishbone" ? 4.2 : 3.5, 0, Math.PI * 2);
      mc.fill();
      mc.stroke();
    }

    mc.fillStyle = "#f97316";
    mc.strokeStyle = "#ffffff";
    mc.lineWidth = 1.5;
    mc.beginPath();
    mc.arc(player.x * sx, player.y * sy, 3.5, 0, Math.PI * 2);
    mc.fill();
    mc.stroke();
    mc.restore();
    mc.restore();
  }

  function triggerInteract() {
    if (dialogueOpen || !activeInspectable) return;
    const item = activeInspectable;
    const st = S.Quests.getState();

    // Portal transition if unlocked
    if (item.portal && (!item.portalWhen || item.portalWhen(st))) {
      switchZone(
        item.portal.targetZone,
        item.portal.spawnX,
        item.portal.spawnY,
        item.portal.onEnter
      );
      return;
    }

    // Epic Animated Battle Cutscene (e.g. Rukia vs Fishbone D Hollow -> Awakening -> 1v1 Boss Battle!)
    if (item.cutscene === "rukia_vs_hollow" && S.BleachCutscenes && S.BleachCutscenes.startRukiaVsHollowBattle) {
      dialogueOpen = true;
      S.BleachCutscenes.startRukiaVsHollowBattle(() => {
        dialogueOpen = false;
        if (item.onFinish) item.onFinish();
        if (S.Battle) S.Battle.start(player);
      });
      return;
    }

    // NPC Dual-Portrait Conversation (e.g. Rukia, Karin, Yuzu, Isshin, Fishbone D)
    if (item.getDialogue) {
      const lines = item.getDialogue(st);
      if (!lines || !lines.length) return;
      let idx = 0;
      dialogueOpen = true;

      function showNpcStep() {
        const entry = lines[idx];
        if (entry.side === "left") {
          player.mood = entry.mood || "neutral";
          player.moodTimer = 3.5;
        }
        S.UI.showVNDialogue({
          side: entry.side || "right",
          speakerId: entry.speakerId || item.speakerId,
          mood: entry.mood || "neutral",
          partner: entry.partner || null,
          name: entry.name || item.name,
          text: entry.text,
          nextLabel: idx < lines.length - 1 ? "NEXT ▶" : "CLOSE",
          onNext: () => {
            if (idx < lines.length - 1) {
              idx++;
              showNpcStep();
            } else {
              dialogueOpen = false;
              S.UI.hideVNDialogue();
              if (item.id === "rukia_bedroom" && S.Quests.getState().phase === "talk_rukia") {
                S.Quests.setPhase("door_unlocked");
                S.UI.syncHud();
                S.UI.showToast("CRASH! BEDROOM DOOR UNLOCKED — HEAD DOWNSTAIRS!");
              }
              if (item.onFinish) item.onFinish();
            }
          },
        });
      }
      showNpcStep();
      return;
    }

    const lines = item.getLines ? item.getLines(st) : item.lines;
    if (!lines || !lines.length) return;
    let idx = 0;
    dialogueOpen = true;

    function showStep() {
      const rawLine = lines[idx];
      const text = typeof rawLine === "string" ? rawLine : rawLine.text;
      const mood = (typeof rawLine === "object" && rawLine.mood) || "neutral";
      player.mood = mood;
      player.moodTimer = 3.5;

      S.UI.showVNDialogue({
        side: "left",
        speakerId: item.speakerId || "ichigo_human",
        mood,
        name: item.name || "ICHIGO KUROSAKI",
        text,
        nextLabel: idx < lines.length - 1 ? "NEXT ▶" : "CLOSE",
        onNext: () => {
          if (idx < lines.length - 1) {
            idx++;
            showStep();
          } else {
            dialogueOpen = false;
            S.UI.hideVNDialogue();
            if (S.Quests.getState().phase === "investigate_room") {
              S.Quests.markInspected(item.id);
              S.UI.syncHud();
              if (S.Quests.getInspectedCount() >= 2) {
                S.Quests.setPhase("talk_rukia");
                // Ensure Ichigo doesn't overlap Rukia's landing spot under the window
                if (Math.hypot(player.x - 226, player.y - 122) < 44) {
                  player.x = 226;
                  player.y = 172;
                }
                if (S.BleachCutscenes && S.BleachCutscenes.startWindowIntrusion) {
                  dialogueOpen = true;
                  S.BleachCutscenes.startWindowIntrusion(() => {
                    dialogueOpen = false;
                    shunpoFlash = 1.1;
                    player.mood = "shocked";
                    player.moodTimer = 3.5;
                    S.UI.syncHud();
                    S.UI.showToast("CONFRONT THE STRANGER BY THE WINDOW!");
                  });
                } else {
                  shunpoFlash = 1.1;
                  player.mood = "shocked";
                  player.moodTimer = 3.5;
                  S.UI.syncHud();
                  S.UI.showToast("WHOOSH! A SHINIGAMI APPEARED BY THE WINDOW!");
                }
              }
            }
          }
        },
      });
    }
    showStep();
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    dialogueOpen = false;
    player.x = 215;
    player.y = 285;
    player.r = 18;
    player.mood = "shocked";
    player.moodTimer = 3.0;
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function combatAction(act) {
    if (!running || !S.Battle || !S.Battle.isActive()) return;
    const mv = getMoveVec();
    if (act === "atk") S.Battle.basicAttack(player);
    else if (act === "skill") S.Battle.useSkill(player);
    else if (act === "dodge") S.Battle.useDodge(player, mv.vx, mv.vy);
    else if (act === "block") S.Battle.useBlock();
    else if (act === "ulti") S.Battle.useUlti(player);
  }

  function retryBattle() {
    if (!S.Battle) return;
    S.Battle.reset(player);
  }

  function continueAfterBattle() {
    const resEl = document.getElementById("story-battle-result");
    if (resEl) resEl.classList.add("hidden");
    if (S.Battle) S.Battle.stop();
    const st = S.Quests.getState();
    if (st.phase === "ep1_cleared") {
      S.Quests.setPhase("arc1_start");
      S.Quests.setZone("karakura_street");
      player.x = 220;
      player.y = 240;
      S.UI.syncHud();
      S.UI.showToast("ARC 1: KARAKURA TOWN OPEN WORLD UNLOCKED!");
    } else {
      S.UI.syncHud();
      S.UI.showToast("EXPLORE KARAKURA TOWN OPEN WORLD!");
    }
  }

  window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (!running) return;
    if (S.Battle && S.Battle.isActive()) {
      if (e.code === "KeyJ" || e.code === "Space") combatAction("atk");
      else if (e.code === "KeyK") combatAction("skill");
      else if (e.code === "KeyL" || e.code === "ShiftLeft") combatAction("dodge");
      else if (e.code === "KeyQ") combatAction("block");
      else if (e.code === "KeyU") combatAction("ulti");
      return;
    }
    if (e.code === "KeyF" || e.code === "KeyE" || e.code === "Space") {
      if (dialogueOpen && S.UI && S.UI.triggerNextVN) {
        S.UI.triggerNextVN();
      } else {
        triggerInteract();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  S.Engine = {
    start,
    stop,
    setJoystick(dx, dy, active) {
      joy.dx = dx;
      joy.dy = dy;
      joy.active = active;
    },
    interact: triggerInteract,
    combatAction,
    retryBattle,
    continueAfterBattle,
    getPlayer: () => player,
    setDialogueOpen(v) {
      dialogueOpen = Boolean(v);
    },
  };
})();
