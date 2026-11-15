// Story Saga UI Controller: VN Dual-Portrait Dialogue (60FPS Live Moods) + Joystick + Screen Nav
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const DPR = 2;
  let currentNextHandler = null;
  let currentDialogueOpts = null;
  let portraitRaf = 0;
  let mascotRaf = 0;

  function drawPortrait(cv, speakerId, mood = "neutral", talking = true) {
    if (!cv || !S.BleachChars) return;
    const lw = 62;
    const lh = 62;
    if (cv.width !== lw * DPR || cv.height !== lh * DPR) {
      cv.width = lw * DPR;
      cv.height = lh * DPR;
      cv.style.width = lw + "px";
      cv.style.height = lh + "px";
    }
    const c = cv.getContext("2d");
    c.save();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, lw, lh);

    // Mint green Fighter Roster backdrop
    c.fillStyle = "#9ee8c5";
    c.fillRect(0, 0, lw, lh);
    c.fillStyle = "rgba(255,255,255,0.22)";
    c.fillRect(0, 0, lw / 2, lh / 2);
    c.fillRect(lw / 2, lh / 2, lw / 2, lh / 2);

    const nowSec = performance.now() * 0.001;
    const opts = { noShadow: true, mood, talking, facing: 1 };

    // Proportioned r=18 inside 62x62 portrait circle for any Bleach character
    if (S.BleachChars.drawById) {
      S.BleachChars.drawById(speakerId, c, lw * 0.5, lh * 0.57, 18, nowSec, opts);
    } else if (speakerId === "rukia") {
      S.BleachChars.drawRukia(c, lw * 0.5, lh * 0.56, 18, nowSec, opts);
    } else {
      S.BleachChars.drawHumanIchigo(c, lw * 0.5, lh * 0.58, 18, nowSec, 1, opts);
    }
    c.restore();
  }

  function startPortraitLoop() {
    cancelAnimationFrame(portraitRaf);
    function tick() {
      if (!currentDialogueOpts) return;
      const side = currentDialogueOpts.side || "left";
      const cvL = document.getElementById("story-vn-canvas-left");
      const cvR = document.getElementById("story-vn-canvas-right");
      const activeId = currentDialogueOpts.speakerId || "ichigo_human";
      const activeMood = currentDialogueOpts.mood || "neutral";
      const partner = currentDialogueOpts.partner || null;

      if (side === "left") {
        drawPortrait(cvL, activeId, activeMood, true);
        if (partner) drawPortrait(cvR, partner.speakerId, partner.mood || "neutral", false);
      } else {
        drawPortrait(cvR, activeId, activeMood, true);
        if (partner) drawPortrait(cvL, partner.speakerId, partner.mood || "neutral", false);
      }
      portraitRaf = requestAnimationFrame(tick);
    }
    portraitRaf = requestAnimationFrame(tick);
  }

  function showVNDialogue(opts) {
    currentDialogueOpts = opts;
    const wrap = document.getElementById("story-vn-wrap");
    const slotL = document.getElementById("story-vn-left");
    const slotR = document.getElementById("story-vn-right");
    const cvL = document.getElementById("story-vn-canvas-left");
    const cvR = document.getElementById("story-vn-canvas-right");
    const nameEl = document.getElementById("story-vn-name");
    const textEl = document.getElementById("story-vn-text");
    const nextBtn = document.getElementById("story-vn-next");

    if (!wrap) return;
    wrap.classList.remove("hidden");

    const side = opts.side || "left";
    const partner = opts.partner || null;

    if (side === "left") {
      slotL.classList.remove("hidden", "dim");
      drawPortrait(cvL, opts.speakerId, opts.mood || "neutral", true);
      if (partner) {
        slotR.classList.remove("hidden");
        slotR.classList.add("dim");
        drawPortrait(cvR, partner.speakerId, partner.mood || "neutral", false);
      } else {
        slotR.classList.add("hidden");
        slotR.classList.remove("dim");
      }
    } else {
      slotR.classList.remove("hidden", "dim");
      drawPortrait(cvR, opts.speakerId, opts.mood || "neutral", true);
      if (partner) {
        slotL.classList.remove("hidden");
        slotL.classList.add("dim");
        drawPortrait(cvL, partner.speakerId, partner.mood || "neutral", false);
      } else {
        slotL.classList.add("hidden");
        slotL.classList.remove("dim");
      }
    }

    if (nameEl) nameEl.textContent = opts.name || "???";
    if (textEl) textEl.textContent = opts.text || "";
    if (nextBtn) nextBtn.textContent = opts.nextLabel || "NEXT ▶";

    currentNextHandler = opts.onNext || null;
    startPortraitLoop();
  }

  function hideVNDialogue() {
    currentDialogueOpts = null;
    cancelAnimationFrame(portraitRaf);
    const wrap = document.getElementById("story-vn-wrap");
    if (wrap) wrap.classList.add("hidden");
    currentNextHandler = null;
  }

  function triggerNextVN() {
    if (typeof currentNextHandler === "function") {
      currentNextHandler();
    }
  }

  function showToast(msg) {
    const el = document.getElementById("story-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(el._tid);
    el._tid = setTimeout(() => el.classList.add("hidden"), 2500);
  }

  function syncHud() {
    const q = S.Quests.getActiveQuestSummary();
    const qTitle = document.getElementById("story-quest-title");
    const qDesc = document.getElementById("story-quest-desc");
    const zoneEl = document.getElementById("story-zone-name");
    const hpText = document.getElementById("story-hp-text");
    const atkBtn = document.getElementById("story-btn-atk");
    const st = S.Quests.getState();

    if (qTitle) qTitle.textContent = q.title;
    if (qDesc) qDesc.textContent = q.desc;
    if (zoneEl && S.Maps) {
      const map = S.Maps[st.zone];
      if (map) zoneEl.textContent = map.name;
    }

    const roleSpan = zoneEl && zoneEl.nextElementSibling;
    if (roleSpan) {
      roleSpan.textContent = st.hasPowers ? "SHINIGAMI" : "HUMAN";
      roleSpan.style.color = st.hasPowers ? "#0284c7" : "";
    }
    if (hpText) {
      hpText.textContent = st.hasPowers ? "HP 250/250" : "HP 100/100";
    }
    if (atkBtn) {
      if (st.hasPowers) {
        atkBtn.classList.remove("locked");
        atkBtn.innerHTML = `SLASH<span class="story-skill-key">ZANPAKUTO</span>`;
      } else {
        atkBtn.classList.add("locked");
        atkBtn.innerHTML = `NO SKILL<span class="story-skill-key">HUMAN</span>`;
      }
    }
  }

  function setBattleMode(on) {
    const bossHud = document.getElementById("story-boss-hud");
    const combatPad = document.getElementById("story-combat-pad");
    const legacyAtk = document.getElementById("story-btn-atk");
    const interactBtn = document.getElementById("story-interact-btn");
    const resEl = document.getElementById("story-battle-result");
    if (bossHud) bossHud.classList.toggle("hidden", !on);
    if (combatPad) combatPad.classList.toggle("hidden", !on);
    if (legacyAtk) legacyAtk.classList.toggle("hidden", on);
    if (interactBtn && on) interactBtn.classList.add("hidden");
    if (resEl && !on) resEl.classList.add("hidden");
    if (!on) {
      const hpFill = document.getElementById("story-hp-fill");
      if (hpFill) hpFill.style.width = "100%";
    }
  }

  function showBattleResult(victory, bossId = "fishbone") {
    const resEl = document.getElementById("story-battle-result");
    const badge = document.getElementById("story-result-badge");
    const title = document.getElementById("story-result-title");
    const desc = document.getElementById("story-result-desc");
    const retryBtn = document.getElementById("story-btn-retry");
    if (!resEl) return;
    resEl.classList.remove("hidden");
    if (victory) {
      if (bossId === "shrieker") {
        if (badge) badge.textContent = "QUEST 2 CLEAR!";
        if (title) title.textContent = "SHRIEKER PURIFIED!";
        if (desc) desc.textContent = "You freed the boy's soul and protected Chad & Orihime!";
      } else {
        if (badge) badge.textContent = "PROLOGUE CLEAR!";
        if (title) title.textContent = "HOLLOW PURIFIED!";
        if (desc) desc.textContent = "Fishbone D defeated! Karakura Town Open World (Arc 1) is now unlocked!";
      }
      if (retryBtn) retryBtn.classList.add("hidden");
    } else {
      if (badge) badge.textContent = "DEFEATED";
      if (title) title.textContent = "FALLEN IN BATTLE";
      if (desc) desc.textContent = "Use Dodge (L) or Block (Q) when the red danger indicator appears!";
      if (retryBtn) retryBtn.classList.remove("hidden");
    }
  }

  function setupJoystick() {
    const zone = document.getElementById("story-joystick");
    const knob = document.getElementById("story-joystick-knob");
    if (!zone || !knob) return;

    let dragging = false;
    const maxR = 34;

    function handleMove(clientX, clientY) {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      S.Engine.setJoystick(dx / maxR, dy / maxR, true);
    }

    function reset() {
      dragging = false;
      knob.style.transform = "translate(0px, 0px)";
      S.Engine.setJoystick(0, 0, false);
    }

    zone.addEventListener("pointerdown", (e) => {
      dragging = true;
      zone.setPointerCapture(e.pointerId);
      handleMove(e.clientX, e.clientY);
    });
    zone.addEventListener("pointermove", (e) => {
      if (dragging) handleMove(e.clientX, e.clientY);
    });
    zone.addEventListener("pointerup", reset);
    zone.addEventListener("pointercancel", reset);
  }

  function startSelectorMascotLoop() {
    cancelAnimationFrame(mascotRaf);
    const cv = document.getElementById("story-bleach-mascot");
    if (!cv || !S.BleachChars) return;
    const lw = 76;
    const lh = 76;
    if (cv.width !== lw * DPR || cv.height !== lh * DPR) {
      cv.width = lw * DPR;
      cv.height = lh * DPR;
      cv.style.width = lw + "px";
      cv.style.height = lh + "px";
    }
    const moods = ["smirk", "serious", "neutral", "suspicious", "happy"];
    function tick() {
      const sel = document.getElementById("screen-story-select");
      if (!sel || sel.classList.contains("hidden")) return;
      const nowSec = performance.now() * 0.001;
      const mood = moods[Math.floor(nowSec / 2.8) % moods.length];
      const c = cv.getContext("2d");
      c.save();
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.clearRect(0, 0, lw, lh);
      S.BleachChars.drawRukia(c, lw * 0.5, lh * 0.54, 20, nowSec, {
        noShadow: true,
        mood,
      });
      c.restore();
      mascotRaf = requestAnimationFrame(tick);
    }
    mascotRaf = requestAnimationFrame(tick);
  }

  function syncSelectorCards() {
    const st = S.Quests.getState();
    const unlocked = S.Quests.isOpenWorldUnlocked() || st.phase === "ep1_cleared";

    const btnPrologue = document.getElementById("btn-play-bleach-saga");
    if (btnPrologue) {
      btnPrologue.textContent = unlocked ? "REPLAY PROLOGUE" : "START PROLOGUE";
    }

    const btnOw = document.getElementById("btn-enter-open-world");
    if (btnOw) {
      btnOw.disabled = !unlocked;
      btnOw.style.opacity = unlocked ? "1" : "0.55";
      btnOw.textContent = unlocked ? "ENTER WORLD" : "🔒 ENTER WORLD (CLEAR PROLOGUE)";
    }
  }

  function openSelectorScreen() {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const sel = document.getElementById("screen-story-select");
    if (sel) sel.classList.remove("hidden");
    syncSelectorCards();
    startSelectorMascotLoop();
  }

  function launchOpenWorld() {
    const st = S.Quests.getState();
    if (!S.Quests.isOpenWorldUnlocked() && st.phase !== "ep1_cleared") return;
    cancelAnimationFrame(mascotRaf);
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const playScreen = document.getElementById("screen-story-play");
    if (playScreen) playScreen.classList.remove("hidden");
    const bnav = document.querySelector(".bnav");
    if (bnav) bnav.classList.add("hidden");

    if (st.phase === "ep1_cleared") {
      S.Quests.setPhase("arc1_start");
    }

    if (!S.Quests.getFlag("arc1_intro_seen")) {
      S.Quests.setHasPowers(false);
      S.Quests.setZone("ichigo_bedroom");
      syncHud();
      S.Engine.start({ resumeOpenWorld: true, x: 176, y: 184 });
      S.Engine.setDialogueOpen(true);

      S.BleachCutscenes.startArc1Intro(() => {
        S.Quests.setFlag("arc1_intro_seen", true);
        S.Engine.setDialogueOpen(true);
        const morningLines = [
          {
            mood: "shocked",
            text: "Sunlight... and I'm back in my human body. Wait—did last night's Hollow fight really happen, or was I dreaming?",
          },
          {
            mood: "serious",
            text: "No, the clinic downstairs got smashed! Better head through my bedroom door and check Karakura High School.",
          },
        ];
        let idx = 0;
        function stepMorning() {
          const item = morningLines[idx];
          showVNDialogue({
            side: "left",
            speakerId: "ichigo_human",
            mood: item.mood,
            name: "ICHIGO KUROSAKI",
            text: item.text,
            nextLabel: idx < morningLines.length - 1 ? "NEXT ▶" : "START ARC 1 ▶",
            onNext: () => {
              if (idx < morningLines.length - 1) {
                idx++;
                stepMorning();
              } else {
                hideVNDialogue();
                S.Engine.setDialogueOpen(false);
                showToast("THE NEXT MORNING • ICHIGO'S BEDROOM (HUMAN MODE)");
              }
            },
          });
        }
        stepMorning();
      });
      return;
    }

    const targetZone = st.zone || "karakura_street";
    S.Quests.setZone(targetZone);
    syncHud();
    S.Engine.start({ resumeOpenWorld: true, x: st.x || 220, y: st.y || 240 });
    showToast("WELCOME BACK TO KARAKURA TOWN OPEN WORLD!");
  }

  function launchBleachEpisode1() {
    cancelAnimationFrame(mascotRaf);
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const playScreen = document.getElementById("screen-story-play");
    if (playScreen) playScreen.classList.remove("hidden");
    const bnav = document.querySelector(".bnav");
    if (bnav) bnav.classList.add("hidden");

    S.Quests.reset();
    syncHud();
    S.Engine.start();
    S.Engine.setDialogueOpen(true);

    // Play Episode 1 Cutscene (Rukia on utility pole) -> then transition to Ichigo in his bedroom
    S.BleachCutscenes.start(() => {
      S.Engine.setDialogueOpen(true);
      const introLines = [
        {
          mood: "shocked",
          text: "What was that loud tremor outside just now?! Even the street ghosts went running...",
        },
        {
          mood: "suspicious",
          text: "The air feels unusually heavy tonight. Let's check around my room first.",
        },
      ];
      let idx = 0;
      function stepIntro() {
        const item = introLines[idx];
        showVNDialogue({
          side: "left",
          speakerId: "ichigo_human",
          mood: item.mood,
          name: "ICHIGO KUROSAKI",
          text: item.text,
          nextLabel: idx < introLines.length - 1 ? "NEXT ▶" : "START ▶",
          onNext: () => {
            if (idx < introLines.length - 1) {
              idx++;
              stepIntro();
            } else {
              hideVNDialogue();
              S.Engine.setDialogueOpen(false);
              showToast("ICHIGO'S BEDROOM • USE WASD / JOYSTICK");
            }
          },
        });
      }
      stepIntro();
    });
  }

  function exitToSelector() {
    S.BleachCutscenes.stop(false);
    if (S.Battle) S.Battle.stop();
    S.Engine.stop();
    hideVNDialogue();
    setBattleMode(false);
    const bnav = document.querySelector(".bnav");
    if (bnav) bnav.classList.remove("hidden");
    openSelectorScreen();
  }

  function init() {
    setupJoystick();

    const btnOpenSaga = document.getElementById("btn-open-story-saga");
    if (btnOpenSaga) btnOpenSaga.addEventListener("click", openSelectorScreen);

    const btnBackHome = document.getElementById("btn-story-back-home");
    if (btnBackHome) {
      btnBackHome.addEventListener("click", () => {
        cancelAnimationFrame(mascotRaf);
        document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
        const home = document.getElementById("screen-play");
        if (home) home.classList.remove("hidden");
      });
    }

    const btnPlayBleach = document.getElementById("btn-play-bleach-saga");
    if (btnPlayBleach) btnPlayBleach.addEventListener("click", launchBleachEpisode1);

    const btnOpenWorld = document.getElementById("btn-enter-open-world");
    if (btnOpenWorld) btnOpenWorld.addEventListener("click", launchOpenWorld);

    const btnSkip = document.getElementById("story-cutscene-skip");
    if (btnSkip) btnSkip.addEventListener("click", () => S.BleachCutscenes.stop(true));

    const btnExit = document.getElementById("story-btn-exit");
    if (btnExit) btnExit.addEventListener("click", exitToSelector);

    const btnNextVN = document.getElementById("story-vn-next");
    if (btnNextVN) btnNextVN.addEventListener("click", triggerNextVN);

    const btnInteract = document.getElementById("story-interact-btn");
    if (btnInteract) btnInteract.addEventListener("click", () => S.Engine.interact());

    // 5-Button Mobile Combat Pad
    const bindCbtn = (id, act) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (S.Engine && S.Engine.combatAction) S.Engine.combatAction(act);
        });
      }
    };
    bindCbtn("story-cbtn-atk", "atk");
    bindCbtn("story-cbtn-skill", "skill");
    bindCbtn("story-cbtn-dodge", "dodge");
    bindCbtn("story-cbtn-block", "block");
    bindCbtn("story-cbtn-ulti", "ulti");

    const btnRetry = document.getElementById("story-btn-retry");
    if (btnRetry) {
      btnRetry.addEventListener("click", () => {
        if (S.Engine && S.Engine.retryBattle) S.Engine.retryBattle();
      });
    }
    const btnResOk = document.getElementById("story-btn-result-ok");
    if (btnResOk) {
      btnResOk.addEventListener("click", () => {
        if (S.Engine && S.Engine.continueAfterBattle) {
          S.Engine.continueAfterBattle();
        } else {
          exitToSelector();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  S.UI = {
    showVNDialogue,
    hideVNDialogue,
    triggerNextVN,
    showToast,
    syncHud,
    setBattleMode,
    showBattleResult,
    getCurrentMood: () => (currentDialogueOpts ? currentDialogueOpts.mood : null),
  };
})();
