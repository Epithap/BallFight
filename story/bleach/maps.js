// Bleach Episode 1: High-Detail HD Ichigo's Bedroom (Proportioned 430x480 Portrait Room)
(() => {
  const S = (window.BallFightStory = window.BallFightStory || {});
  const INK = "#2b1b3d";

  const MAPS = {
    ichigo_bedroom: {
      id: "ichigo_bedroom",
      name: "ICHIGO'S BEDROOM",
      w: 430,
      h: 480,
      bg: "#d8a46c",
      walls: [
        { x: 0, y: 0, w: 430, h: 72 },
        { x: 0, y: 448, w: 430, h: 32 },
        { x: 0, y: 0, w: 28, h: 480 },
        { x: 402, y: 0, w: 28, h: 480 },
        // Bed (Top-Left)
        { x: 34, y: 80, w: 108, h: 146 },
        // Nightstand
        { x: 148, y: 80, w: 42, h: 42 },
        // Study Desk (Top-Right)
        { x: 274, y: 80, w: 120, h: 58 },
        // Bookshelf (Right wall)
        { x: 356, y: 204, w: 42, h: 118 },
        // Closet / Wardrobe (Bottom-Left)
        { x: 34, y: 332, w: 78, h: 104 },
      ],
      portals: [],
      npcs: [
        {
          id: "rukia_bedroom",
          speakerId: "rukia",
          name: "RUKIA KUCHIKI",
          x: 226,
          y: 122,
          r: 18,
          box: { x: 204, y: 100, w: 44, h: 44 },
          shortLabel: "TALK TO ???",
          label: "TALK TO ??? (F)",
          getShortLabel: (st) => (st.phase === "door_unlocked" ? "TALK TO RUKIA" : "TALK TO ???"),
          getLabel: (st) => (st.phase === "door_unlocked" ? "TALK TO RUKIA (F)" : "TALK TO ??? (F)"),
          visibleWhen: (st) => st.phase === "talk_rukia" || st.phase === "door_unlocked",
          getDialogue: (st) => {
            if (st.phase === "door_unlocked") {
              return [
                {
                  side: "right",
                  speakerId: "rukia",
                  name: "RUKIA KUCHIKI",
                  mood: "battle",
                  partner: { speakerId: "ichigo_human", mood: "shocked" },
                  text: "No time to argue! That roar came from downstairs—a Hollow is already inside your house!",
                },
                {
                  side: "left",
                  speakerId: "ichigo_human",
                  name: "ICHIGO KUROSAKI",
                  mood: "serious",
                  partner: { speakerId: "rukia", mood: "serious" },
                  text: "Karin and Yuzu are down there! Move—I'm heading through that door right now!",
                },
              ];
            }
            return [
              {
                side: "right",
                speakerId: "rukia",
                name: "???",
                mood: "shocked",
                partner: { speakerId: "ichigo_human", mood: "shocked" },
                text: "Wha—?! You can actually see me?! Wait... you're the source of that massive spiritual pressure?!",
              },
              {
                side: "left",
                speakerId: "ichigo_human",
                name: "ICHIGO KUROSAKI",
                mood: "angry",
                partner: { speakerId: "rukia", mood: "sweat" },
                text: "WHO THE HECK ARE YOU?! How did you just pop into my room in the middle of the night?!",
              },
              {
                side: "right",
                speakerId: "rukia",
                name: "RUKIA KUCHIKI",
                mood: "smirk",
                partner: { speakerId: "ichigo_human", mood: "deadpan" },
                text: "Calm down, human. My name is Rukia Kuchiki, and I am a Shinigami—a Soul Reaper from Soul Society.",
              },
              {
                side: "left",
                speakerId: "ichigo_human",
                name: "ICHIGO KUROSAKI",
                mood: "deadpan",
                partner: { speakerId: "rukia", mood: "angry" },
                text: "A 'Shinigami'? Yeah, right. I can see regular ghosts, not weirdos in samurai pajamas trespassing in my bedroom.",
              },
              {
                side: "right",
                speakerId: "rukia",
                name: "RUKIA KUCHIKI",
                mood: "angry",
                partner: { speakerId: "ichigo_human", mood: "suspicious" },
                text: "Quiet, you insolent—! Wait... *sniff* Do you hear that? That monstrous Reiatsu... it's right below us!",
              },
              {
                side: "left",
                speakerId: "ichigo_human",
                name: "ICHIGO KUROSAKI",
                mood: "shocked",
                partner: { speakerId: "rukia", mood: "battle" },
                text: "A huge crash downstairs?! Karin! Yuzu! Old man! That's coming from the clinic!",
              },
            ];
          },
        },
      ],
      inspectables: [
        {
          id: "window",
          x: 226,
          y: 90,
          r: 36,
          box: { x: 170, y: 8, w: 112, h: 56 },
          shortLabel: "NIGHT WINDOW",
          label: "LOOK OUT WINDOW (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "The moon is super bright tonight... Wait, did I just see someone standing on that utility pole?!", mood: "shocked" },
            { text: "Ugh, probably just my imagination. Better stay inside for now.", mood: "sweat" },
          ],
        },
        {
          id: "desk",
          x: 330,
          y: 154,
          r: 38,
          box: { x: 274, y: 80, w: 120, h: 58 },
          shortLabel: "STUDY DESK",
          label: "CHECK DESK (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "High school textbooks, headphones, and a stack of borrowed manga...", mood: "smirk" },
            { text: "People always pick fights over my natural orange hair—and on top of that, I've been seeing ghosts everywhere since I was a little kid. Give me a break.", mood: "deadpan" },
          ],
        },
        {
          id: "bed",
          x: 152,
          y: 168,
          r: 38,
          box: { x: 34, y: 80, w: 108, h: 146 },
          shortLabel: "ICHIGO'S BED",
          label: "CHECK BED (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "*Yawn*... Man, kicking those street punks earlier wore me out.", mood: "sleepy" },
            { text: "Wait—why is the air in my room suddenly getting so cold?!", mood: "shocked" },
          ],
        },
        {
          id: "bookshelf",
          x: 348,
          y: 262,
          r: 36,
          box: { x: 356, y: 204, w: 42, h: 118 },
          shortLabel: "BOOKSHELF",
          label: "CHECK SHELF (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "Literature assignments, old magazines, and CD cases. At least Karin and Yuzu didn't mess up my shelf today.", mood: "happy" },
          ],
        },
        {
          id: "closet",
          x: 122,
          y: 382,
          r: 38,
          box: { x: 34, y: 332, w: 78, h: 104 },
          shortLabel: "WARDROBE",
          label: "CHECK CLOSET (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "My Karakura High uniform and skateboard. Just a totally normal 15-year-old's closet... nothing supernatural hiding in here.", mood: "suspicious" },
          ],
        },
        {
          id: "door",
          x: 215,
          y: 416,
          r: 38,
          box: { x: 182, y: 422, w: 66, h: 24 },
          shortLabel: "HALLWAY DOOR",
          label: "BEDROOM DOOR (F)",
          getShortLabel: (st) =>
            st.phase === "investigate_room" || st.phase === "talk_rukia"
              ? "HALLWAY DOOR"
              : "GO DOWNSTAIRS",
          getLabel: (st) =>
            st.phase === "investigate_room" || st.phase === "talk_rukia"
              ? "BEDROOM DOOR (F)"
              : "GO DOWNSTAIRS (F)",
          portalWhen: (st) => st.phase !== "investigate_room" && st.phase !== "talk_rukia",
          portal: {
            targetZone: "kurosaki_clinic",
            spawnX: 90,
            spawnY: 142,
            onEnter: (st) => {
              if (st.phase === "door_unlocked") {
                S.Quests.setPhase("clinic_check");
              }
            },
          },
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          getLines: (st) => {
            if (st.phase === "talk_rukia") {
              return [
                { text: "Wait—there's literally a stranger in black robes standing in my room! I need to confront her first!", mood: "shocked" },
              ];
            }
            return [
              { text: "My old man Isshin and my sisters are downstairs in the clinic. Better check around my room first!", mood: "angry" },
            ];
          },
        },
      ],
      drawGround(c, t = 0) {
        // 1. Alternating Hardwood Planks + Seams
        for (let row = 0, y = 72; y < 448; row++, y += 22) {
          c.fillStyle = row % 2 === 0 ? "#d9a66f" : "#cfa068";
          c.fillRect(28, y, 374, 22);
          c.strokeStyle = "rgba(120, 53, 15, 0.25)";
          c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(28, y); c.lineTo(402, y); c.stroke();
          const offset = (row % 2) * 44;
          for (let x = 70 + offset; x < 395; x += 88) {
            c.beginPath(); c.moveTo(x, y); c.lineTo(x, Math.min(448, y + 22)); c.stroke();
          }
        }

        // 2. Walls & Wood Baseboard Trim
        c.fillStyle = "#f5efe0";
        c.fillRect(0, 0, 430, 72);
        c.fillStyle = "#b45309";
        c.fillRect(0, 60, 430, 12);
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, 72); c.lineTo(430, 72); c.stroke();

        c.fillStyle = "#78350f";
        c.fillRect(0, 0, 28, 480);
        c.fillRect(402, 0, 28, 480);
        c.fillRect(0, 448, 430, 32);
        c.strokeRect(28, 72, 374, 376);

        // 3. Wall Decor: Clock, Night Window, Framed Poster "15"
        c.fillStyle = "#ffffff";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.arc(88, 34, 15, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = "#ef4444";
        c.beginPath(); c.arc(88, 34, 2.2, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(88, 34); c.lineTo(88, 23); c.stroke();
        c.beginPath(); c.moveTo(88, 34); c.lineTo(96, 34); c.stroke();

        // Window (Night in Prologue -> Morning in Arc 1 Open World)
        const isMorning = S.Quests && S.Quests.isOpenWorldUnlocked();
        c.fillStyle = isMorning ? "#38bdf8" : "#151936";
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(178, 10, 96, 52, 6); c.fill(); c.stroke();
        if (isMorning) {
          c.fillStyle = "#fde047";
          c.beginPath(); c.arc(248, 24, 9, 0, Math.PI * 2); c.fill();
          c.fillStyle = "rgba(255, 255, 255, 0.85)";
          c.beginPath(); c.arc(198, 28, 7, 0, Math.PI * 2); c.arc(208, 26, 8, 0, Math.PI * 2); c.fill();
        } else {
          c.fillStyle = "#fef9c3";
          c.beginPath(); c.arc(248, 25, 9, 0, Math.PI * 2); c.fill();
          c.fillStyle = "#ffffff";
          c.beginPath(); c.arc(198, 22, 1.5, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(218, 38, 1.5, 0, Math.PI * 2); c.fill();
        }
        c.strokeStyle = "#e2e8f0";
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(226, 10); c.lineTo(226, 62); c.stroke();
        // Curtains
        c.fillStyle = "#334155";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(170, 8, 14, 56, 4); c.fill(); c.stroke();
        c.beginPath(); c.roundRect(268, 8, 14, 56, 4); c.fill(); c.stroke();

        // Moonlight / Morning Sunlight Spill + Dust Motes
        c.save();
        c.fillStyle = isMorning ? "rgba(254, 240, 138, 0.24)" : "rgba(254, 249, 195, 0.16)";
        c.beginPath();
        c.moveTo(184, 72);
        c.lineTo(268, 72);
        c.lineTo(294, 212);
        c.lineTo(158, 212);
        c.closePath();
        c.fill();
        c.fillStyle = "rgba(255, 255, 255, 0.45)";
        for (let i = 0; i < 4; i++) {
          const mx = 190 + i * 20 + Math.sin(t * 1.4 + i) * 5;
          const my = 104 + ((i * 25 + t * 8) % 86);
          c.beginPath(); c.arc(mx, my, 2, 0, Math.PI * 2); c.fill();
        }
        c.restore();

        // Poster "15"
        c.fillStyle = "#ef4444";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(326, 12, 42, 38, 4); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 16px 'Lilita One', Impact, sans-serif";
        c.textAlign = "center";
        c.fillText("15", 347, 37);

        // 4. Detailed Geometric Woven Rug with Fringes
        c.fillStyle = "rgba(18, 11, 28, 0.16)";
        c.beginPath(); c.roundRect(148, 232, 152, 118, 12); c.fill();
        c.fillStyle = "#334155";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(144, 228, 152, 118, 12); c.fill(); c.stroke();
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 2;
        c.strokeRect(156, 240, 128, 94);
        c.fillStyle = "#475569";
        c.fillRect(164, 250, 112, 14);
        c.fillRect(164, 278, 112, 14);
        c.fillRect(164, 306, 112, 14);
        c.strokeStyle = "#f8fafc";
        c.lineWidth = 2;
        for (let fy = 238; fy <= 336; fy += 14) {
          c.beginPath(); c.moveTo(137, fy); c.lineTo(144, fy); c.stroke();
          c.beginPath(); c.moveTo(296, fy); c.lineTo(303, fy); c.stroke();
        }

        // 5. Detailed Bed (Headboard, Quilt Fold, Orange Pillow, Slippers)
        c.fillStyle = "rgba(18, 11, 28, 0.24)";
        c.beginPath(); c.roundRect(39, 86, 108, 146, 10); c.fill();
        c.fillStyle = "#78350f";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(34, 80, 108, 146, 9); c.fill(); c.stroke();
        c.fillStyle = "#92400e";
        c.fillRect(38, 82, 100, 14);
        c.fillStyle = "#f8fafc";
        c.beginPath(); c.roundRect(41, 94, 94, 46, 5); c.fill(); c.stroke();
        c.fillStyle = "#1e293b";
        c.beginPath(); c.roundRect(41, 126, 94, 92, 7); c.fill(); c.stroke();
        c.fillStyle = "#334155";
        c.fillRect(44, 128, 88, 12);
        c.fillStyle = "#f97316";
        c.beginPath(); c.roundRect(54, 96, 68, 26, 7); c.fill(); c.stroke();
        c.strokeStyle = "#c2410c";
        c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(66, 109); c.lineTo(110, 109); c.stroke();
        // Slippers
        c.fillStyle = "#3da5ff";
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.beginPath(); c.roundRect(148, 192, 12, 20, 5); c.fill(); c.stroke();
        c.beginPath(); c.roundRect(163, 192, 12, 20, 5); c.fill(); c.stroke();

        // 6. Detailed Nightstand
        c.fillStyle = "#92400e";
        c.strokeStyle = INK;
        c.lineWidth = 2.8;
        c.beginPath(); c.roundRect(148, 80, 42, 42, 6); c.fill(); c.stroke();
        c.fillStyle = "#0f172a";
        c.beginPath(); c.roundRect(154, 87, 30, 16, 3); c.fill(); c.stroke();
        c.fillStyle = "#22c55e";
        c.font = "900 8px monospace";
        c.textAlign = "center";
        c.fillText("23:42", 169, 98);

        // 7. Detailed Study Desk (Book + Headphones + Lamp + Chair)
        c.fillStyle = "rgba(18, 11, 28, 0.22)";
        c.beginPath(); c.roundRect(279, 86, 120, 58, 9); c.fill();
        c.fillStyle = "#b45309";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(274, 80, 120, 58, 9); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.beginPath(); c.roundRect(312, 92, 40, 28, 3); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(332, 92); c.lineTo(332, 120); c.stroke();
        c.strokeStyle = "#3da5ff";
        c.lineWidth = 2.6;
        c.beginPath(); c.arc(294, 108, 9, Math.PI, 0); c.stroke();
        // Desk Lamp + Glow
        c.fillStyle = "#ffe047";
        c.strokeStyle = INK;
        c.lineWidth = 2.2;
        c.beginPath(); c.arc(374, 102, 10, 0, Math.PI * 2); c.fill(); c.stroke();
        const lampGlow = c.createRadialGradient(374, 102, 5, 374, 102, 46 + Math.sin(t * 3) * 3);
        lampGlow.addColorStop(0, "rgba(255, 224, 71, 0.36)");
        lampGlow.addColorStop(1, "rgba(255, 224, 71, 0)");
        c.fillStyle = lampGlow;
        c.beginPath(); c.arc(374, 102, 46, 0, Math.PI * 2); c.fill();
        // Swivel Chair
        c.fillStyle = "#ef4444";
        c.strokeStyle = INK;
        c.lineWidth = 2.8;
        c.beginPath(); c.arc(334, 152, 14, 0, Math.PI * 2); c.fill(); c.stroke();

        // 8. Detailed Bookshelf with Colored Manga Spines
        c.fillStyle = "#78350f";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(356, 204, 42, 118, 7); c.fill(); c.stroke();
        const bookCols = ["#ef4444", "#3da5ff", "#ffe047", "#22c55e", "#f97316", "#a855f7"];
        for (let i = 0; i < 6; i++) {
          const sy = 214 + i * 17;
          c.fillStyle = bookCols[i];
          c.fillRect(363, sy, 28, 11);
          c.strokeStyle = INK;
          c.lineWidth = 1.4;
          c.strokeRect(363, sy, 28, 11);
        }

        // 9. Closet + Skateboard
        c.fillStyle = "#92400e";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(34, 332, 78, 104, 7); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(73, 336); c.lineTo(73, 432); c.stroke();
        c.fillStyle = "#ffe047";
        c.beginPath(); c.arc(67, 384, 2.5, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(79, 384, 2.5, 0, Math.PI * 2); c.fill();

        c.fillStyle = "#3da5ff";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(120, 380, 18, 44, 8); c.fill(); c.stroke();

        // 10. Bedroom Door & Welcome Mat
        c.fillStyle = "#22c55e";
        c.strokeStyle = INK;
        c.lineWidth = 2.8;
        c.beginPath(); c.roundRect(182, 422, 66, 22, 5); c.fill(); c.stroke();
        c.fillStyle = "#451a03";
        c.fillRect(186, 446, 58, 10);
        c.fillStyle = "#ffe047";
        c.beginPath(); c.arc(234, 451, 2.8, 0, Math.PI * 2); c.fill();
      },
    },

    kurosaki_clinic: {
      id: "kurosaki_clinic",
      name: "KUROSAKI CLINIC",
      w: 440,
      h: 500,
      bg: "#e2e8f0",
      walls: [
        { x: 0, y: 0, w: 440, h: 70 },
        { x: 0, y: 468, w: 440, h: 32 },
        { x: 0, y: 0, w: 26, h: 500 },
        { x: 414, y: 0, w: 26, h: 500 },
        // Reception Desk (Top-Right)
        { x: 248, y: 86, w: 146, h: 56 },
        // Medical Supply Cabinet (Right wall)
        { x: 358, y: 210, w: 44, h: 118 },
        // Overturned Couch / Wrecked Table (Left-Center)
        { x: 46, y: 240, w: 112, h: 68 },
      ],
      npcs: [
        {
          id: "karin_clinic",
          speakerId: "karin",
          name: "KARIN KUROSAKI",
          x: 194,
          y: 268,
          r: 17,
          box: { x: 173, y: 247, w: 42, h: 42 },
          shortLabel: "TALK TO KARIN",
          label: "TALK TO KARIN (F)",
          getDialogue: (st) => {
            if (S.Quests && S.Quests.isOpenWorldUnlocked()) {
              return [
                {
                  side: "right",
                  speakerId: "karin",
                  name: "KARIN KUROSAKI",
                  mood: "neutral",
                  partner: { speakerId: st.hasPowers ? "ichigo_shinigami" : "ichigo_human", mood: "neutral" },
                  text: "Morning, Ichi-nii. Somehow the clinic walls are already patched up... You're going to be late for Karakura High!",
                },
              ];
            }
            return [
              {
                side: "right",
                speakerId: "karin",
                name: "KARIN KUROSAKI",
                mood: "angry",
                partner: { speakerId: "ichigo_human", mood: "shocked" },
                text: "Ichi-nii!! A huge monster with a creepy white skull mask just smashed right through the front door!",
              },
              {
                side: "left",
                speakerId: "ichigo_human",
                name: "ICHIGO KUROSAKI",
                mood: "shocked",
                partner: { speakerId: "karin", mood: "serious" },
                text: "Are you and Yuzu hurt?! Wait—where did that monster go?!",
              },
              {
                side: "right",
                speakerId: "karin",
                name: "KARIN KUROSAKI",
                mood: "serious",
                partner: { speakerId: "ichigo_human", mood: "battle" },
                text: "It went back outside onto the street after Dad tried to tackle it! Don't go out there alone, Ichi-nii!",
              },
            ];
          },
          onFinish: () => {
            S.Quests.markClinicTalked();
            S.UI.syncHud();
            S.UI.showToast("SOUTH CLINIC DOOR UNLOCKED — HEAD OUTSIDE!");
          },
        },
        {
          id: "yuzu_clinic",
          speakerId: "yuzu",
          name: "YUZU KUROSAKI",
          x: 130,
          y: 342,
          r: 17,
          box: { x: 109, y: 321, w: 42, h: 42 },
          shortLabel: "TALK TO YUZU",
          label: "TALK TO YUZU (F)",
          getDialogue: () => [
            {
              side: "right",
              speakerId: "yuzu",
              name: "YUZU KUROSAKI",
              mood: "sweat",
              partner: { speakerId: "ichigo_human", mood: "serious" },
              text: "*Sniff* Ichi-nii... I was so scared! Everything in the waiting room got smashed in one swipe!",
            },
            {
              side: "left",
              speakerId: "ichigo_human",
              name: "ICHIGO KUROSAKI",
              mood: "smirk",
              partner: { speakerId: "yuzu", mood: "happy" },
              text: "Stay inside with Karin and Dad, okay? I'll make sure that thing doesn't come back in here.",
            },
          ],
          onFinish: () => {
            S.Quests.markClinicTalked();
            S.UI.syncHud();
          },
        },
        {
          id: "isshin_clinic",
          speakerId: "isshin",
          name: "ISSHIN KUROSAKI",
          x: 306,
          y: 174,
          r: 19,
          box: { x: 283, y: 151, w: 46, h: 46 },
          shortLabel: "CHECK ON ISSHIN",
          label: "CHECK ON ISSHIN (F)",
          getDialogue: () => [
            {
              side: "right",
              speakerId: "isshin",
              name: "ISSHIN KUROSAKI",
              mood: "sweat",
              partner: { speakerId: "ichigo_human", mood: "deadpan" },
              text: "Ugh... That stray bear—I mean monster—packed a serious punch! Protect your sisters, Ichigo...!",
            },
            {
              side: "left",
              speakerId: "ichigo_human",
              name: "ICHIGO KUROSAKI",
              mood: "angry",
              partner: { speakerId: "isshin", mood: "sleepy" },
              text: "How are you even joking right now, old man?! Just stay down and rest!",
            },
          ],
        },
      ],
      inspectables: [
        {
          id: "stairs_up",
          x: 78,
          y: 102,
          r: 36,
          box: { x: 42, y: 74, w: 72, h: 42 },
          shortLabel: "TO BEDROOM",
          label: "GO UPSTAIRS (F)",
          portal: { targetZone: "ichigo_bedroom", spawnX: 215, spawnY: 382 },
        },
        {
          id: "clinic_front_door",
          x: 220,
          y: 444,
          r: 40,
          box: { x: 176, y: 448, w: 88, h: 24 },
          shortLabel: "KARAKURA STREET",
          label: "STEP OUTSIDE (F)",
          portalWhen: (st) =>
            st.clinicTalked ||
            st.phase === "street_hollow" ||
            st.phase === "phase3_complete" ||
            (S.Quests && S.Quests.isOpenWorldUnlocked()),
          portal: { targetZone: "karakura_street", spawnX: 220, spawnY: 162 },
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "Hold on—I should check on Karin or Yuzu first before rushing outside!", mood: "serious" },
          ],
        },
        {
          id: "claw_marks",
          x: 220,
          y: 318,
          r: 34,
          box: { x: 196, y: 298, w: 48, h: 36 },
          shortLabel: "CLAW MARKS",
          label: "INSPECT DAMAGE (F)",
          speakerId: "ichigo_human",
          name: "ICHIGO KUROSAKI",
          lines: [
            { text: "Deep gouges carved straight into the clinic floor... No normal animal or human could do this.", mood: "shocked" },
          ],
        },
      ],
      drawGround(c, t = 0) {
        // 1. Checkered Clinic Tiles + Subtle Grout & Ambient Floor Shadow
        const tile = 28;
        for (let y = 70; y < 468; y += tile) {
          for (let x = 26; x < 414; x += tile) {
            const odd = ((Math.floor(x / tile) + Math.floor(y / tile)) & 1) === 1;
            c.fillStyle = odd ? "#dbeafe" : "#f8fafc";
            c.fillRect(x, y, Math.min(tile, 414 - x), Math.min(tile, 468 - y));
          }
        }
        // Soft top wall ambient shadow
        const wallShadow = c.createLinearGradient(0, 70, 0, 94);
        wallShadow.addColorStop(0, "rgba(18, 11, 28, 0.16)");
        wallShadow.addColorStop(1, "rgba(18, 11, 28, 0)");
        c.fillStyle = wallShadow;
        c.fillRect(26, 70, 388, 24);

        // Waiting-Area Runner Rug
        c.fillStyle = "rgba(15, 118, 110, 0.14)";
        c.beginPath(); c.roundRect(164, 174, 112, 236, 12); c.fill();
        c.strokeStyle = "rgba(15, 118, 110, 0.35)";
        c.lineWidth = 2;
        c.strokeRect(172, 182, 96, 220);

        // 2. Walls, Wainscoting & Clinic Trim
        c.fillStyle = "#e2e8f0";
        c.fillRect(0, 0, 440, 70);
        c.fillStyle = "#cbd5e1";
        c.fillRect(0, 46, 440, 14);
        c.fillStyle = "#475569";
        c.fillRect(0, 58, 440, 12);
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, 70); c.lineTo(440, 70); c.stroke();

        c.fillStyle = "#334155";
        c.fillRect(0, 0, 26, 500);
        c.fillRect(414, 0, 26, 500);
        c.fillRect(0, 468, 440, 32);
        c.strokeRect(26, 70, 388, 398);

        // Wall Decor: Medical Poster (Left) + Wall Clock (Right)
        c.fillStyle = "#ffffff";
        c.strokeStyle = INK;
        c.lineWidth = 2.2;
        c.beginPath(); c.roundRect(54, 14, 48, 38, 4); c.fill(); c.stroke();
        c.fillStyle = "#38bdf8";
        c.fillRect(62, 22, 32, 6);
        c.fillStyle = "#94a3b8";
        c.fillRect(62, 32, 22, 4);
        c.fillRect(62, 40, 28, 4);

        c.fillStyle = "#ffffff";
        c.beginPath(); c.arc(364, 33, 15, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = "#ef4444";
        c.beginPath(); c.arc(364, 33, 2.2, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(364, 33); c.lineTo(364, 22); c.stroke();
        c.beginPath(); c.moveTo(364, 33); c.lineTo(372, 35); c.stroke();

        // 3. Detailed Wooden Staircase Back Up (Top-Left)
        c.fillStyle = "rgba(18, 11, 28, 0.22)";
        c.beginPath(); c.roundRect(45, 78, 72, 42, 6); c.fill();
        c.fillStyle = "#92400e";
        c.strokeStyle = INK;
        c.lineWidth = 2.8;
        c.beginPath(); c.roundRect(42, 74, 72, 42, 6); c.fill(); c.stroke();
        for (let i = 0; i < 4; i++) {
          const sy = 77 + i * 9;
          c.fillStyle = i % 2 === 0 ? "#b45309" : "#9a3412";
          c.fillRect(48, sy, 60, 8);
          c.strokeStyle = "#451a03";
          c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(48, sy + 8); c.lineTo(108, sy + 8); c.stroke();
        }
        // Wooden Side Handrails
        c.fillStyle = "#d97706";
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.fillRect(42, 74, 7, 42); c.strokeRect(42, 74, 7, 42);
        c.fillRect(107, 74, 7, 42); c.strokeRect(107, 74, 7, 42);
        c.fillStyle = "#fef08a";
        c.font = "900 9px 'Lilita One', Impact, sans-serif";
        c.textAlign = "center";
        c.fillText("▲ UP", 78, 111);

        // 4. Clinic Sign & Red Cross on Wall
        c.fillStyle = "#ffffff";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.beginPath(); c.roundRect(148, 14, 144, 34, 7); c.fill(); c.stroke();
        c.fillStyle = "#ef4444";
        c.fillRect(160, 27, 14, 6);
        c.fillRect(164, 23, 6, 14);
        c.fillStyle = INK;
        c.font = "900 11px 'Lilita One', Impact, sans-serif";
        c.textAlign = "left";
        c.fillText("KUROSAKI CLINIC", 182, 35);

        // 5. Detailed Reception Desk (Top-Right: Monitor, Keyboard, Clipboard, Lamp, Plant)
        c.fillStyle = "rgba(18, 11, 28, 0.22)";
        c.beginPath(); c.roundRect(252, 92, 146, 56, 8); c.fill();
        c.fillStyle = "#b45309";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(248, 86, 146, 56, 8); c.fill(); c.stroke();
        c.fillStyle = "#d97706";
        c.fillRect(252, 88, 138, 12);
        // Patient Clipboard + Pen
        c.fillStyle = "#fef3c7";
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.beginPath(); c.roundRect(262, 96, 36, 26, 3); c.fill(); c.stroke();
        c.fillStyle = "#64748b";
        c.fillRect(272, 93, 16, 5);
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(268, 105); c.lineTo(292, 105); c.moveTo(268, 112); c.lineTo(288, 112); c.stroke();
        // Clinic PC Monitor + Keyboard
        c.fillStyle = "#1e293b";
        c.strokeStyle = INK;
        c.lineWidth = 2.2;
        c.beginPath(); c.roundRect(318, 92, 50, 28, 4); c.fill(); c.stroke();
        c.fillStyle = "#38bdf8";
        c.fillRect(322, 96, 42, 20);
        c.fillStyle = "#e2e8f0";
        c.fillRect(324, 124, 38, 10);
        c.strokeRect(324, 124, 38, 10);
        // Potted Desk Plant
        c.fillStyle = "#f97316";
        c.beginPath(); c.arc(382, 128, 7, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = "#22c55e";
        c.beginPath(); c.arc(382, 122, 6, 0, Math.PI * 2); c.fill(); c.stroke();

        // 6. Detailed Glass Medical Supply Cabinet (Right Wall)
        c.fillStyle = "rgba(18, 11, 28, 0.22)";
        c.beginPath(); c.roundRect(362, 214, 44, 118, 7); c.fill();
        c.fillStyle = "#e2e8f0";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(358, 210, 44, 118, 7); c.fill(); c.stroke();
        // Glass interior shelves
        c.fillStyle = "#bae6fd";
        c.fillRect(364, 218, 32, 102);
        c.strokeStyle = "#64748b";
        c.lineWidth = 1.8;
        for (const sy of [244, 272, 300]) {
          c.beginPath(); c.moveTo(364, sy); c.lineTo(396, sy); c.stroke();
        }
        // Medicine bottles & First-aid box
        c.fillStyle = "#ef4444";
        c.fillRect(368, 228, 10, 14);
        c.fillStyle = "#22c55e";
        c.fillRect(382, 230, 9, 12);
        c.fillStyle = "#ffffff";
        c.strokeStyle = INK;
        c.lineWidth = 1.6;
        c.fillRect(369, 254, 22, 15);
        c.strokeRect(369, 254, 22, 15);
        c.fillStyle = "#ef4444";
        c.fillRect(376, 260, 8, 3);
        c.fillRect(378.5, 257.5, 3, 8);
        c.fillStyle = "#3b82f6";
        c.fillRect(368, 284, 8, 14);
        c.fillStyle = "#f59e0b";
        c.fillRect(380, 286, 10, 12);

        // 7. Waiting Room Couch (Overturned in Prologue -> Neat & Upright in Arc 1)
        const isRepaired = S.Quests && S.Quests.isOpenWorldUnlocked();
        c.save();
        c.translate(102, 274);
        if (!isRepaired) c.rotate(-0.14);
        c.fillStyle = "rgba(18, 11, 28, 0.24)";
        c.beginPath(); c.roundRect(-52, -26, 108, 60, 9); c.fill();
        c.fillStyle = "#0f766e";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(-54, -30, 108, 60, 9); c.fill(); c.stroke();
        // Backrest + Armrests + Cushion seams
        c.fillStyle = "#115e59";
        c.fillRect(-50, -26, 100, 14);
        c.fillStyle = "#14b8a6";
        c.beginPath(); c.roundRect(-42, -10, 40, 34, 5); c.fill(); c.stroke();
        c.beginPath(); c.roundRect(2, -10, 40, 34, 5); c.fill(); c.stroke();
        c.restore();

        if (!isRepaired) {
          // Scattered Clinic Magazine & Cushion on floor
          c.save();
          c.translate(72, 336);
          c.rotate(0.28);
          c.fillStyle = "#f97316";
          c.strokeStyle = INK;
          c.lineWidth = 2;
          c.beginPath(); c.roundRect(-12, -9, 24, 18, 4); c.fill(); c.stroke();
          c.restore();

          // 8. Hollow Claw Gouges + Dark Scorch + Shattered Glass Shards
          c.save();
          c.fillStyle = "rgba(15, 23, 42, 0.16)";
          c.beginPath(); c.ellipse(216, 318, 26, 14, -0.2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = "#7f1d1d";
          c.lineWidth = 4.2;
          c.lineCap = "round";
          for (let k = -1; k <= 1; k++) {
            c.beginPath();
            c.moveTo(204 + k * 10, 303);
            c.lineTo(215 + k * 10, 331);
            c.stroke();
          }
          c.strokeStyle = "#ef4444";
          c.lineWidth = 2;
          for (let k = -1; k <= 1; k++) {
            c.beginPath();
            c.moveTo(204 + k * 10, 303);
            c.lineTo(215 + k * 10, 331);
            c.stroke();
          }
          c.restore();

          c.fillStyle = "rgba(186, 230, 253, 0.90)";
          c.strokeStyle = INK;
          c.lineWidth = 1.6;
          for (const [gx, gy] of [[182, 418], [208, 402], [246, 410], [234, 430], [196, 432]]) {
            c.beginPath();
            c.moveTo(gx, gy - 5);
            c.lineTo(gx + 6, gy + 3);
            c.lineTo(gx - 4, gy + 5);
            c.closePath();
            c.fill(); c.stroke();
          }
        }

        // 9. Front Sliding Exit Door (Bottom)
        const pulse = 0.5 + 0.5 * Math.sin(t * 5);
        c.fillStyle = `rgba(34, 197, 94, ${(0.25 + pulse * 0.25).toFixed(2)})`;
        c.beginPath(); c.roundRect(172, 444, 96, 30, 8); c.fill();
        c.fillStyle = "#22c55e";
        c.strokeStyle = INK;
        c.lineWidth = 2.8;
        c.beginPath(); c.roundRect(176, 448, 88, 22, 6); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 10px 'Lilita One', Impact, sans-serif";
        c.textAlign = "center";
        c.fillText("EXIT TO STREET ▼", 220, 463);
      },
    },

    karakura_street: {
      id: "karakura_street",
      name: "KARAKURA STREET (NIGHT)",
      getName: () =>
        S.Quests && S.Quests.isOpenWorldUnlocked() ? "KARAKURA STREET (DAY)" : "KARAKURA STREET (NIGHT)",
      w: 440,
      h: 520,
      bg: "#1e293b",
      walls: [
        { x: 0, y: 0, w: 440, h: 120 },
        { x: 0, y: 492, w: 440, h: 28 },
        { x: 0, y: 0, w: 22, h: 520 },
        { x: 418, y: 0, w: 22, h: 520 },
      ],
      npcs: [
        {
          id: "rukia_street",
          speakerId: "rukia",
          name: "RUKIA KUCHIKI",
          x: 146,
          y: 230,
          r: 18,
          box: { x: 124, y: 208, w: 44, h: 44 },
          shortLabel: "TALK TO RUKIA",
          label: "TALK TO RUKIA (F)",
          visibleWhen: () => !S.Quests.isOpenWorldUnlocked(),
          getDialogue: () => [
            {
              side: "right",
              speakerId: "rukia",
              name: "RUKIA KUCHIKI",
              mood: "battle",
              partner: { speakerId: "ichigo_human", mood: "serious" },
              text: "Stay back, Ichigo! That's a Hollow—an evil spirit that devours human souls! It's drawn straight to your massive spirit energy!",
            },
            {
              side: "left",
              speakerId: "ichigo_human",
              name: "ICHIGO KUROSAKI",
              mood: "angry",
              partner: { speakerId: "rukia", mood: "serious" },
              text: "Like I'm gonna stand around watching after it hurt my family! Hey, mask-face—over here!",
            },
          ],
        },
        {
          id: "hollow_fishbone",
          speakerId: "hollow_fishbone",
          name: "FISHBONE D (HOLLOW)",
          x: 244,
          y: 368,
          r: 30,
          box: { x: 204, y: 326, w: 80, h: 78 },
          shortLabel: "CONFRONT HOLLOW",
          label: "CONFRONT HOLLOW (F)",
          visibleWhen: () => !S.Quests.isOpenWorldUnlocked(),
          cutscene: "rukia_vs_hollow",
          onFinish: () => {
            S.Quests.setHasPowers(true);
            S.Quests.setPhase("ready_for_battle");
            S.UI.syncHud();
            S.UI.showToast("SHINIGAMI POWERS AWAKENED! (BOSS FIGHT NEXT)");
          },
        },
      ],
      inspectables: [
        {
          id: "clinic_back_door",
          x: 220,
          y: 128,
          r: 36,
          box: { x: 182, y: 102, w: 76, h: 24 },
          shortLabel: "BACK TO CLINIC",
          label: "ENTER CLINIC (F)",
          portal: { targetZone: "kurosaki_clinic", spawnX: 220, spawnY: 410 },
        },
        {
          id: "portal_karakura_high",
          x: 34,
          y: 310,
          r: 34,
          box: { x: 16, y: 276, w: 32, h: 68 },
          shortLabel: "◀ KARAKURA HIGH",
          label: "GO TO KARAKURA HIGH (F)",
          visibleWhen: () => S.Quests.isOpenWorldUnlocked(),
          portal: { targetZone: "karakura_high", spawnX: 368, spawnY: 300 },
        },
        {
          id: "portal_urahara_shop",
          x: 406,
          y: 310,
          r: 34,
          box: { x: 392, y: 276, w: 32, h: 68 },
          shortLabel: "URAHARA SHOP ▶",
          label: "GO TO URAHARA SHOP (F)",
          visibleWhen: () => S.Quests.isOpenWorldUnlocked(),
          portal: { targetZone: "urahara_shop", spawnX: 64, spawnY: 300 },
        },
        {
          id: "portal_riverbank_park",
          x: 220,
          y: 478,
          r: 36,
          box: { x: 174, y: 468, w: 92, h: 26 },
          shortLabel: "▼ RIVERBANK PARK",
          label: "GO TO RIVERBANK PARK (F)",
          visibleWhen: () => S.Quests.isOpenWorldUnlocked(),
          portal: { targetZone: "riverbank_park", spawnX: 220, spawnY: 146 },
        },
      ],
      drawGround(c, t = 0) {
        const isDay = S.Quests && S.Quests.isOpenWorldUnlocked();

        // 1. Stone-Tiled Sidewalk & Asphalt Road (Night in Prologue -> Bright Day in Arc 1)
        c.fillStyle = isDay ? "#cbd5e1" : "#475569";
        c.fillRect(0, 120, 440, 82);
        // Sidewalk stone tile grid
        c.strokeStyle = isDay ? "rgba(71, 85, 105, 0.22)" : "rgba(15, 23, 42, 0.28)";
        c.lineWidth = 1.4;
        for (let sx = 0; sx < 440; sx += 28) {
          c.beginPath(); c.moveTo(sx, 120); c.lineTo(sx, 194); c.stroke();
        }
        for (let sy = 144; sy < 194; sy += 24) {
          c.beginPath(); c.moveTo(0, sy); c.lineTo(440, sy); c.stroke();
        }

        // Asphalt road
        c.fillStyle = isDay ? "#475569" : "#171d2e";
        c.fillRect(0, 202, 440, 318);
        // Curb + gutter shadow
        c.fillStyle = isDay ? "#94a3b8" : "#64748b";
        c.fillRect(0, 192, 440, 10);
        c.fillStyle = isDay ? "rgba(15, 23, 42, 0.14)" : "rgba(0,0,0,0.28)";
        c.fillRect(0, 202, 440, 12);
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.beginPath(); c.moveTo(0, 202); c.lineTo(440, 202); c.stroke();

        // Zebra Crosswalk on Right + Dashed Center Line
        c.fillStyle = isDay ? "rgba(255, 255, 255, 0.9)" : "rgba(226, 232, 240, 0.72)";
        for (let cy = 222; cy <= 462; cy += 48) {
          c.fillRect(360, cy, 48, 22);
        }
        c.fillStyle = isDay ? "#ffffff" : "#e2e8f0";
        for (let lx = 24; lx < 340; lx += 54) {
          c.fillRect(lx, 344, 30, 6);
        }

        // Manhole cover on road
        c.fillStyle = isDay ? "#64748b" : "#334155";
        c.strokeStyle = INK;
        c.lineWidth = 2;
        c.beginPath(); c.arc(106, 286, 16, 0, Math.PI * 2); c.fill(); c.stroke();
        c.strokeStyle = isDay ? "#94a3b8" : "#475569";
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(106, 286, 10, 0, Math.PI * 2); c.stroke();

        // Cracked Asphalt Impact Crater under Fishbone D (Prologue night only)
        if (!isDay) {
          c.save();
          c.fillStyle = "rgba(9, 9, 15, 0.55)";
          c.beginPath(); c.ellipse(244, 384, 52, 20, 0, 0, Math.PI * 2); c.fill();
          c.strokeStyle = "#09090b";
          c.lineWidth = 2.2;
          for (let a = 0; a < 6; a++) {
            const ang = a * (Math.PI / 3) + 0.3;
            c.beginPath();
            c.moveTo(244 + Math.cos(ang) * 16, 384 + Math.sin(ang) * 6);
            c.lineTo(244 + Math.cos(ang) * 48, 384 + Math.sin(ang) * 18);
            c.stroke();
          }
          c.restore();
        }

        // 2. Detailed Kurosaki Clinic Exterior Facade (Top)
        c.fillStyle = isDay ? "#f1f5f9" : "#262d42";
        c.fillRect(0, 0, 440, 120);
        // Roof eaves / awning
        c.fillStyle = isDay ? "#0284c7" : "#1e293b";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.fillRect(92, 0, 256, 22);
        c.strokeRect(92, 0, 256, 22);

        // Clinic windows left & right (Warm night glow vs bright daytime glass)
        for (const wx of [108, 296]) {
          c.fillStyle = isDay ? "#bae6fd" : "#fde68a";
          c.strokeStyle = INK;
          c.lineWidth = 2.4;
          c.beginPath(); c.roundRect(wx, 72, 36, 30, 4); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(wx + 18, 72); c.lineTo(wx + 18, 102); c.stroke();
        }

        // Clinic Signboard
        c.fillStyle = "#fef3c7";
        c.strokeStyle = INK;
        c.lineWidth = 3;
        c.beginPath(); c.roundRect(126, 26, 188, 34, 8); c.fill(); c.stroke();
        c.fillStyle = "#ef4444";
        c.fillRect(140, 40, 14, 6);
        c.fillRect(144, 36, 6, 14);
        c.fillStyle = INK;
        c.font = "900 13px 'Lilita One', Impact, sans-serif";
        c.textAlign = "center";
        c.fillText("KUROSAKI CLINIC", 232, 48);

        // Clinic Sliding Glass Doors (Repaired intact glass in Day vs Broken in Prologue Night)
        c.fillStyle = isDay ? "#7dd3fc" : "#38bdf8";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.beginPath(); c.roundRect(182, 74, 76, 46, 5); c.fill(); c.stroke();
        if (!isDay) {
          c.fillStyle = "#0f172a";
          c.beginPath();
          c.moveTo(222, 76); c.lineTo(256, 76); c.lineTo(256, 118); c.lineTo(228, 118);
          c.lineTo(234, 98); c.lineTo(222, 88);
          c.closePath();
          c.fill();
        }
        c.beginPath(); c.moveTo(220, 74); c.lineTo(220, 120); c.stroke();

        // Potted Bushes flanking entrance
        for (const px of [162, 278]) {
          c.fillStyle = "#78350f";
          c.strokeStyle = INK;
          c.lineWidth = 2;
          c.fillRect(px - 8, 112, 16, 10); c.strokeRect(px - 8, 112, 16, 10);
          c.fillStyle = "#15803d";
          c.beginPath(); c.arc(px, 108, 11, 0, Math.PI * 2); c.fill(); c.stroke();
        }

        // 3. Glowing Vending Machine on Sidewalk (Right)
        c.fillStyle = "#0284c7";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.beginPath(); c.roundRect(392, 106, 36, 56, 5); c.fill(); c.stroke();
        c.fillStyle = "#e0f2fe";
        c.fillRect(397, 112, 26, 24);
        c.fillStyle = "#ef4444";
        c.fillRect(400, 116, 5, 7);
        c.fillStyle = "#22c55e";
        c.fillRect(408, 116, 5, 7);
        c.fillStyle = "#facc15";
        c.fillRect(416, 116, 5, 7);
        c.fillStyle = "#0f172a";
        c.fillRect(399, 146, 22, 8);

        // 4. Streetlamp on Left (Lit cone at night, off in daytime)
        c.fillStyle = "#0f172a";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.fillRect(44, 44, 10, 138);
        c.strokeRect(44, 44, 10, 138);
        c.fillRect(44, 44, 30, 8);
        c.strokeRect(44, 44, 30, 8);
        c.fillStyle = isDay ? "#cbd5e1" : "#fef08a";
        c.beginPath(); c.arc(68, 54, 10, 0, Math.PI * 2); c.fill(); c.stroke();
        if (!isDay) {
          const sg = c.createRadialGradient(68, 54, 8, 68, 140, 135 + Math.sin(t * 2.5) * 6);
          sg.addColorStop(0, "rgba(254, 240, 138, 0.36)");
          sg.addColorStop(1, "rgba(254, 240, 138, 0)");
          c.fillStyle = sg;
          c.beginPath(); c.arc(68, 120, 135, 0, Math.PI * 2); c.fill();
        }

        // 5. Utility Pole + Transformer + Overhead Wires
        c.fillStyle = "#1e293b";
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.fillRect(356, 16, 14, 168);
        c.strokeRect(356, 16, 14, 168);
        c.fillStyle = "#475569";
        c.fillRect(348, 42, 30, 22);
        c.strokeRect(348, 42, 30, 22);
        c.strokeStyle = "rgba(15, 23, 42, 0.7)";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, 14);
        c.quadraticCurveTo(180, 38, 356, 20);
        c.moveTo(370, 20);
        c.quadraticCurveTo(405, 32, 440, 18);
        c.stroke();

        // 6. Open World Directional Portal Badges
        if (S.Quests.isOpenWorldUnlocked()) {
          const drawPortalTag = (px, py, txt) => {
            c.save();
            c.fillStyle = "#16a34a";
            c.strokeStyle = INK;
            c.lineWidth = 2.4;
            c.beginPath(); c.roundRect(px - 44, py - 12, 88, 24, 8); c.fill(); c.stroke();
            c.fillStyle = "#ffffff";
            c.font = "900 10px 'Lilita One', sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText(txt, px, py + 1);
            c.restore();
          };
          drawPortalTag(66, 310, "◀ HIGH SCHOOL");
          drawPortalTag(374, 310, "URAHARA ▶");
          drawPortalTag(220, 474, "▼ RIVERBANK");
        }
      },
    },

    karakura_high: {
      id: "karakura_high",
      name: "KARAKURA HIGH SCHOOL",
      w: 440,
      h: 480,
      bg: "#cbd5e1",
      walls: [
        { x: 0, y: 0, w: 440, h: 112 },
        { x: 0, y: 454, w: 440, h: 26 },
        { x: 0, y: 0, w: 22, h: 480 },
        { x: 418, y: 0, w: 22, h: 480 },
      ],
      npcs: [
        {
          id: "rukia_school",
          speakerId: "rukia_gigai",
          name: "RUKIA KUCHIKI (GIGAI)",
          x: 196,
          y: 168,
          r: 18,
          box: { x: 174, y: 146, w: 44, h: 44 },
          shortLabel: "TALK TO RUKIA",
          label: "TALK TO RUKIA (F)",
          getDialogue: (st) => {
            if (st.phase === "arc1_start" || st.phase === "arc1_q1_school") {
              return [
                {
                  side: "right",
                  speakerId: "rukia_gigai",
                  name: "RUKIA KUCHIKI",
                  mood: "serious",
                  partner: { speakerId: st.hasPowers ? "ichigo_shinigami" : "ichigo_human", mood: "shocked" },
                  text: "You actually transferred me into your class?! Never mind—my Gigai can't restore my powers yet, so YOU are the Substitute Shinigami!",
                },
                {
                  side: "right",
                  speakerId: "rukia_gigai",
                  name: "RUKIA KUCHIKI",
                  mood: "battle",
                  partner: { speakerId: "ichigo_shinigami", mood: "serious" },
                  text: "Take this Substitute Badge and transform! A rogue Mod-Soul pill escaped into that lion plushie over there—catch him!",
                },
              ];
            }
            return [
              {
                side: "right",
                speakerId: "rukia_gigai",
                name: "RUKIA KUCHIKI",
                mood: "neutral",
                partner: { speakerId: "ichigo_shinigami", mood: "neutral" },
                text: "Keep your Substitute Badge ready. Hollows are starting to gather near Riverbank Park!",
              },
            ];
          },
          onFinish: () => {
            const st = S.Quests.getState();
            if (st.phase === "arc1_start" || st.phase === "arc1_q1_school") {
              S.Quests.setHasPowers(true);
              S.Quests.setPhase("arc1_q1_kon");
              S.UI.syncHud();
              S.UI.showToast("SHINIGAMI MODE! CATCH KON IN THE COURTYARD!");
            }
          },
        },
        {
          id: "kon",
          speakerId: "kon",
          name: "KON (MOD-SOUL)",
          x: 110,
          y: 344,
          r: 17,
          box: { x: 88, y: 322, w: 44, h: 44 },
          shortLabel: "CATCH KON",
          label: "CATCH KON (F)",
          visibleWhen: (st) => st.phase === "arc1_q1_kon" || S.Quests.getFlag("konRecruited"),
          getDialogue: (st) => {
            if (st.phase === "arc1_q1_kon") {
              return [
                {
                  side: "right",
                  speakerId: "kon",
                  name: "KON",
                  mood: "shocked",
                  partner: { speakerId: "ichigo_shinigami", mood: "angry" },
                  text: "GYAAAH! Let go of me, spiky-head! I'm a noble Mod-Soul—I don't belong in a stuffed lion!",
                },
                {
                  side: "left",
                  speakerId: "ichigo_shinigami",
                  name: "ICHIGO KUROSAKI",
                  mood: "serious",
                  partner: { speakerId: "kon", mood: "sad" },
                  text: "Shut up, stuffed toy! From today on your name is Kon—and you're guarding my body when I go Shinigami!",
                },
              ];
            }
            return [
              {
                side: "right",
                speakerId: "kon",
                name: "KON",
                mood: "happy",
                partner: { speakerId: "ichigo_shinigami", mood: "neutral" },
                text: "Hmph! Check on Chad and Orihime over by the lockers—they've been acting weird about some parakeet!",
              },
            ];
          },
          onFinish: () => {
            const st = S.Quests.getState();
            if (st.phase === "arc1_q1_kon") {
              S.Quests.setFlag("konRecruited", true);
              S.Quests.setPhase("arc1_q2_chad");
              S.UI.syncHud();
              S.UI.showToast("KON RECRUITED! TALK TO CHAD & ORIHIME!");
            }
          },
        },
        {
          id: "chad",
          speakerId: "chad",
          name: "YASUTORA SADO (CHAD)",
          x: 298,
          y: 238,
          r: 19,
          box: { x: 274, y: 214, w: 48, h: 48 },
          shortLabel: "TALK TO CHAD",
          label: "TALK TO CHAD (F)",
          getDialogue: (st) => {
            if (st.phase === "arc1_q2_chad") {
              return [
                {
                  side: "right",
                  speakerId: "chad",
                  name: "CHAD",
                  mood: "serious",
                  partner: { speakerId: "ichigo_shinigami", mood: "serious" },
                  text: "Ichigo... a cursed parakeet just attacked me, and I can hear a child's voice crying inside it. It flew toward Riverbank Park!",
                },
                {
                  side: "left",
                  speakerId: "ichigo_shinigami",
                  name: "ICHIGO KUROSAKI",
                  mood: "angry",
                  partner: { speakerId: "chad", mood: "serious" },
                  text: "Stay safe, Chad. That's definitely a Hollow's doing—I'm heading to Riverbank Park right now!",
                },
              ];
            }
            return [
              {
                side: "right",
                speakerId: "chad",
                name: "CHAD",
                mood: "neutral",
                partner: { speakerId: "ichigo_shinigami", mood: "neutral" },
                text: "Be careful out there, Ichigo.",
              },
            ];
          },
          onFinish: () => {
            if (S.Quests.getState().phase === "arc1_q2_chad") {
              S.Quests.setPhase("arc1_q2_shrieker");
              S.UI.syncHud();
              S.UI.showToast("QUEST 2B: HEAD TO RIVERBANK PARK!");
            }
          },
        },
        {
          id: "orihime",
          speakerId: "orihime",
          name: "ORIHIME INOUE",
          x: 344,
          y: 266,
          r: 17,
          box: { x: 322, y: 244, w: 44, h: 44 },
          shortLabel: "TALK TO ORIHIME",
          label: "TALK TO ORIHIME (F)",
          getDialogue: () => [
            {
              side: "right",
              speakerId: "orihime",
              name: "ORIHIME INOUE",
              mood: "happy",
              partner: { speakerId: "ichigo_shinigami", mood: "neutral" },
              text: "Kurosaki-kun! Good luck with whatever you're investigating! Don't forget to eat if you get hurt!",
            },
          ],
        },
      ],
      inspectables: [
        {
          id: "school_to_street",
          x: 396,
          y: 300,
          r: 34,
          box: { x: 386, y: 266, w: 32, h: 68 },
          shortLabel: "KARAKURA STREET ▶",
          label: "EXIT TO KARAKURA STREET (F)",
          portal: { targetZone: "karakura_street", spawnX: 74, spawnY: 310 },
        },
      ],
      drawGround(c) {
        // School Brick Building Top + Courtyard Paving
        c.fillStyle = "#b45309";
        c.fillRect(0, 0, 440, 112);
        c.fillStyle = "#e2e8f0";
        c.fillRect(0, 112, 440, 368);
        c.strokeStyle = "rgba(15, 23, 42, 0.14)";
        c.lineWidth = 1.5;
        for (let x = 0; x < 440; x += 36) {
          c.beginPath(); c.moveTo(x, 112); c.lineTo(x, 480); c.stroke();
        }
        for (let y = 112; y < 480; y += 36) {
          c.beginPath(); c.moveTo(0, y); c.lineTo(440, y); c.stroke();
        }
        // School Windows & Clock
        for (let wx = 44; wx <= 360; wx += 78) {
          c.fillStyle = "#bae6fd";
          c.strokeStyle = INK;
          c.lineWidth = 2.4;
          c.fillRect(wx, 28, 48, 52);
          c.strokeRect(wx, 28, 48, 52);
        }
        // Sakura Trees in Courtyard Corners
        for (const [tx, ty] of [[56, 152], [380, 152]]) {
          c.fillStyle = "#78350f";
          c.fillRect(tx - 6, ty + 10, 12, 24);
          c.fillStyle = "#fbcfe8";
          c.strokeStyle = INK;
          c.lineWidth = 2.4;
          c.beginPath(); c.arc(tx, ty, 24, 0, Math.PI * 2); c.fill(); c.stroke();
        }
        // Exit Tag
        c.fillStyle = "#16a34a";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(334, 288, 86, 24, 8); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 10px 'Lilita One', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("STREET ▶", 377, 301);
      },
    },

    urahara_shop: {
      id: "urahara_shop",
      name: "URAHARA SHOP",
      w: 440,
      h: 480,
      bg: "#d6b88c",
      walls: [
        { x: 0, y: 0, w: 440, h: 108 },
        { x: 0, y: 454, w: 440, h: 26 },
        { x: 0, y: 0, w: 22, h: 480 },
        { x: 418, y: 0, w: 22, h: 480 },
      ],
      npcs: [
        {
          id: "urahara",
          speakerId: "urahara",
          name: "KISUKE URAHARA",
          x: 220,
          y: 178,
          r: 19,
          box: { x: 194, y: 152, w: 52, h: 52 },
          shortLabel: "TALK TO URAHARA",
          label: "TALK TO URAHARA (F)",
          getDialogue: () => [
            {
              side: "right",
              speakerId: "urahara",
              name: "KISUKE URAHARA",
              mood: "happy",
              partner: { speakerId: "ichigo_shinigami", mood: "neutral" },
              text: "Welcome, Kurosaki-san! Need supplies or Soul Candy? You're doing great as a Substitute Shinigami—keep sharpening your Shunpo and Parry!",
            },
            {
              side: "right",
              speakerId: "urahara",
              name: "KISUKE URAHARA",
              mood: "serious",
              partner: { speakerId: "ichigo_shinigami", mood: "serious" },
              text: "Still, be careful. A powerful Hollow's reiatsu has been lingering around Karakura Town lately... we'll talk again soon.",
            },
          ],
        },
      ],
      inspectables: [
        {
          id: "urahara_to_street",
          x: 44,
          y: 300,
          r: 34,
          box: { x: 22, y: 266, w: 32, h: 68 },
          shortLabel: "◀ KARAKURA STREET",
          label: "EXIT TO KARAKURA STREET (F)",
          portal: { targetZone: "karakura_street", spawnX: 368, spawnY: 310 },
        },
      ],
      drawGround(c) {
        // Traditional Wooden Shop + Tatami Floor
        c.fillStyle = "#78350f";
        c.fillRect(0, 0, 440, 108);
        c.fillStyle = "#e7d3a8";
        c.fillRect(0, 108, 440, 372);
        // Tatami Mat Grid
        c.strokeStyle = "#57534e";
        c.lineWidth = 2;
        for (let y = 136; y < 440; y += 72) {
          c.strokeRect(42, y, 170, 68);
          c.strokeRect(228, y, 170, 68);
        }
        // Shoji Sliding Panels on Top Wall
        for (let sx = 46; sx <= 320; sx += 94) {
          c.fillStyle = "#fefce8";
          c.strokeStyle = INK;
          c.lineWidth = 2.4;
          c.fillRect(sx, 24, 78, 74);
          c.strokeRect(sx, 24, 78, 74);
        }
        // Exit Tag
        c.fillStyle = "#16a34a";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(22, 288, 86, 24, 8); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 10px 'Lilita One', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("◀ STREET", 65, 301);
      },
    },

    riverbank_park: {
      id: "riverbank_park",
      name: "KARAKURA RIVERBANK",
      w: 440,
      h: 500,
      bg: "#4ade80",
      walls: [
        { x: 0, y: 0, w: 440, h: 108 },
        { x: 0, y: 472, w: 440, h: 28 },
        { x: 0, y: 0, w: 22, h: 500 },
        { x: 418, y: 0, w: 22, h: 500 },
      ],
      npcs: [
        {
          id: "hollow_shrieker",
          speakerId: "hollow_shrieker",
          name: "SHRIEKER (HOLLOW)",
          x: 220,
          y: 344,
          r: 27,
          box: { x: 184, y: 308, w: 72, h: 72 },
          shortLabel: "FIGHT SHRIEKER",
          label: "FIGHT SHRIEKER (F)",
          visibleWhen: (st) => st.phase === "arc1_q2_shrieker" && !S.Quests.getFlag("shriekerDefeated"),
          getDialogue: () => [
            {
              side: "right",
              speakerId: "hollow_shrieker",
              name: "SHRIEKER",
              mood: "angry",
              partner: { speakerId: "ichigo_shinigami", mood: "battle" },
              text: "Kekehe! You fell right into my trap, Shinigami brat! Let's see how you dance around my bombs!",
            },
          ],
          onFinish: () => {
            if (S.Battle) S.Battle.start(S.Engine.getPlayer(), { bossId: "shrieker" });
          },
        },
      ],
      inspectables: [
        {
          id: "river_to_street",
          x: 220,
          y: 124,
          r: 36,
          box: { x: 176, y: 102, w: 88, h: 26 },
          shortLabel: "▲ KARAKURA STREET",
          label: "BACK TO KARAKURA STREET (F)",
          portal: { targetZone: "karakura_street", spawnX: 220, spawnY: 438 },
        },
      ],
      drawGround(c, t = 0) {
        // Karakura River on Top + Grassy Bank + Paved Path
        c.fillStyle = "#0284c7";
        c.fillRect(0, 0, 440, 108);
        c.strokeStyle = "rgba(224, 242, 254, 0.55)";
        c.lineWidth = 2;
        for (let ry = 28; ry <= 84; ry += 26) {
          const off = (t * 28 + ry) % 60;
          for (let rx = -40 + off; rx < 440; rx += 80) {
            c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 28, ry); c.stroke();
          }
        }
        // Grassy Slope
        c.fillStyle = "#22c55e";
        c.fillRect(0, 108, 440, 392);
        // Paved Stone Riverside Path
        c.fillStyle = "#cbd5e1";
        c.fillRect(36, 152, 368, 300);
        c.strokeStyle = INK;
        c.lineWidth = 2.6;
        c.strokeRect(36, 152, 368, 300);

        // Exit Tag
        c.fillStyle = "#16a34a";
        c.strokeStyle = INK;
        c.lineWidth = 2.4;
        c.beginPath(); c.roundRect(166, 114, 108, 24, 8); c.fill(); c.stroke();
        c.fillStyle = "#ffffff";
        c.font = "900 10px 'Lilita One', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("▲ KARAKURA ST.", 220, 127);
      },
    },
  };

  S.Maps = MAPS;
})();
