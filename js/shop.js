(() => {
  const BF = (window.BallFight = window.BallFight || {});
  const { COLORS } = BF;

  const DEFAULT_UNLOCKED_FIGHTERS = new Set(["goku", "naruto", "luffy", "ichigo"]);
  const WALLET_STORAGE_KEY = "anime_ball_wallet_v3";

  const playerWallet = {
    coins: 2000,
    gems: 100,
    unlockedItems: new Set(["aura_none"]),
    unlockedFighters: new Set(DEFAULT_UNLOCKED_FIGHTERS),
    evolvedFighters: new Set(),
    equippedEvolutions: {},
    unlockedSkins: new Set(),
    equippedSkins: {},
  };

  const SKIN_CATALOG = [
    {
      id: "naruto_six_tails_bone",
      charId: "naruto",
      name: "SIX-TAILS SKELETAL KYUUBI",
      shortLabel: "SKELETAL 6-TAILS",
      rarity: "legend",
      price: 150,
      currency: "gems",
      desc: "Transforms Naruto's Nine-Tails mode into the Six-Tails Skeletal Kyuubi (Bone Fox Skull, Vertebrae Spine, Bone Pauldrons & 6 Crimson Chakra Tails)!",
      previewFormId: "kyuubi",
      previewFlags: { ult: true, evolved: true, kyuubiMode: true, skin: "naruto_six_tails_bone" },
    },
    {
      id: "ichigo_arrancar_arc",
      charId: "ichigo",
      name: "ARRANCAR ARC: ULQUIORRA DUEL",
      shortLabel: "ARRANCAR ARC",
      rarity: "epic",
      price: 120,
      currency: "gems",
      desc: "2-in-1 Evolve Skin: Battle-tattered Las Noches Bankai outfit + Half-Shattered Dark-Crimson Hollow Mask from the Ulquiorra fight!",
      previewFormId: "hollow",
      previewFlags: { ult: true, evolved: true, vastoLordeMode: false, skin: "ichigo_arrancar_arc" },
    },
    {
      id: "ichigo_vasto_half_mask",
      charId: "ichigo",
      name: "AWAKENED VASTO: LONG-HAIR HALF-MASK",
      shortLabel: "HALF-VASTO MYTHIC",
      rarity: "legend",
      price: 180,
      currency: "gems",
      desc: "Mythic Vasto Lorde Skin: Long flowing orange mane, pale awakened face, single broken Vasto horn & floating skull shards!",
      previewFormId: "vasto",
      previewFlags: { ult: true, evolved: true, vastoLordeMode: true, skin: "ichigo_vasto_half_mask" },
    },
  ];

  const EVOLUTION_SPECS = {
    naruto: {
      charId: "naruto",
      evolvedName: "CHILD OF PROPHECY (SAGE)",
      evolvedRole: "TOAD SAGE • SENJUTSU & NINE-TAILS",
      starterLabel: "STARTER (BASE)",
      evolvedLabel: "EVOLVED (SAGE MODE)",
      cost: 10000,
      currency: "coins",
      requirementText: "10,000 GOLD",
      desc: "Transforms Naruto into Toad Sage Mode (Red Sage Cloak, Giant Summoning Scroll & Senjutsu Eyes) and UNLOCKS the permanent Four-Tails Nine-Tails form (at HP <= 200) with Kyuubi Claw Slash & Bijuudama!",
      bonusHp: 25,
      bonusSpeed: 10,
    },
    ichigo: {
      charId: "ichigo",
      evolvedName: "SUBSTITUTE REAPER (BANKAI)",
      evolvedRole: "BANKAI REAPER • HOLLOW MASK & VASTO LORDE",
      starterLabel: "STARTER (SHIKAI)",
      evolvedLabel: "EVOLVED (BANKAI)",
      cost: 10000,
      currency: "coins",
      requirementText: "10,000 GOLD",
      desc: "Before Evolve: Shikai Base, Bankai Ult & Inner Demon takeover at HP <= 100. After Evolve (10k Gold): Starts in Bankai, Hollow Mask Ult & UNLOCKS permanent Vasto Lorde at HP <= 200!",
      bonusHp: 25,
      bonusSpeed: 10,
    },
    sasuke: {
      charId: "sasuke",
      evolvedName: "UCHIHA AVENGER (RINNEGAN)",
      evolvedRole: "RINNEGAN • SUSANOO & INDRA'S ARROW",
      starterLabel: "STARTER (SHARINGAN)",
      evolvedLabel: "EVOLVED (RINNEGAN)",
      cost: 10000,
      currency: "coins",
      requirementText: "10,000 GOLD",
      desc: "Awakens Sasuke's Rinnegan + EMS (Amaterasu flames), UNLOCKS permanent Susanoo Armor form at HP <= 150 (Amenotejikara + Bansho Ten'in), and upgrades Ult to Giant Susanoo INDRA'S ARROW!",
      bonusHp: 25,
      bonusSpeed: 10,
    },
  };

  function loadWallet() {
    try {
      if (typeof localStorage === "undefined") return;
      const raw = localStorage.getItem(WALLET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.coins === "number" && parsed.coins >= 0) playerWallet.coins = parsed.coins;
      if (typeof parsed.gems === "number" && parsed.gems >= 0) playerWallet.gems = parsed.gems;
      if (Array.isArray(parsed.unlockedFighters)) {
        playerWallet.unlockedFighters = new Set([...DEFAULT_UNLOCKED_FIGHTERS, ...parsed.unlockedFighters]);
      }
      if (Array.isArray(parsed.evolvedFighters)) {
        playerWallet.evolvedFighters = new Set(parsed.evolvedFighters);
      }
      if (parsed.equippedEvolutions && typeof parsed.equippedEvolutions === "object") {
        playerWallet.equippedEvolutions = { ...parsed.equippedEvolutions };
      }
      if (Array.isArray(parsed.unlockedSkins)) {
        playerWallet.unlockedSkins = new Set(parsed.unlockedSkins);
      }
      if (parsed.equippedSkins && typeof parsed.equippedSkins === "object") {
        playerWallet.equippedSkins = { ...parsed.equippedSkins };
      }
    } catch (_) {}
  }

  function saveWallet() {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify({
        coins: playerWallet.coins,
        gems: playerWallet.gems,
        unlockedFighters: Array.from(playerWallet.unlockedFighters),
        evolvedFighters: Array.from(playerWallet.evolvedFighters),
        equippedEvolutions: playerWallet.equippedEvolutions,
        unlockedSkins: Array.from(playerWallet.unlockedSkins),
        equippedSkins: playerWallet.equippedSkins,
      }));
    } catch (_) {}
  }

  function isFighterUnlocked(charId) {
    return DEFAULT_UNLOCKED_FIGHTERS.has(charId) || playerWallet.unlockedFighters.has(charId);
  }

  function isFighterEvolved(charId) {
    return playerWallet.evolvedFighters.has(charId);
  }

  function isEvolutionEquipped(charId) {
    return Boolean(isFighterEvolved(charId) && playerWallet.equippedEvolutions[charId] !== false);
  }

  function setEvolutionEquipped(charId, enabled) {
    if (!isFighterEvolved(charId)) return false;
    playerWallet.equippedEvolutions[charId] = Boolean(enabled);
    saveWallet();
    return true;
  }

  function evolveFighter(charId) {
    const spec = EVOLUTION_SPECS[charId];
    if (!spec) return { ok: false, reason: "NO_EVO" };
    if (isFighterEvolved(charId)) return { ok: true, already: true };
    if (playerWallet.coins < spec.cost) return { ok: false, reason: "INSUFFICIENT_COINS", needed: spec.cost };
    playerWallet.coins -= spec.cost;
    playerWallet.evolvedFighters.add(charId);
    playerWallet.equippedEvolutions[charId] = true;
    saveWallet();
    return { ok: true };
  }

  function isSkinUnlocked(skinId) {
    return playerWallet.unlockedSkins.has(skinId);
  }

  function getEquippedSkinsForChar(charId) {
    const val = playerWallet.equippedSkins[charId];
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr.filter((id) => id && isSkinUnlocked(id));
  }

  function isSkinEquipped(skinId) {
    const skin = SKIN_CATALOG.find((s) => s.id === skinId);
    if (!skin || !isSkinUnlocked(skinId)) return false;
    return getEquippedSkinsForChar(skin.charId).includes(skinId);
  }

  function setSkinEquipped(skinId, enabled) {
    const skin = SKIN_CATALOG.find((s) => s.id === skinId);
    if (!skin || !isSkinUnlocked(skinId)) return false;
    const cur = new Set(getEquippedSkinsForChar(skin.charId));
    if (enabled) cur.add(skinId);
    else cur.delete(skinId);
    playerWallet.equippedSkins[skin.charId] = Array.from(cur);
    saveWallet();
    return true;
  }

  function getEquippedSkin(charId) {
    const list = getEquippedSkinsForChar(charId);
    return list.length ? list[list.length - 1] : null;
  }

  function setEquippedSkin(charId, skinId) {
    if (!skinId) {
      playerWallet.equippedSkins[charId] = [];
      saveWallet();
      return true;
    }
    if (!isSkinUnlocked(skinId)) return false;
    const cur = new Set(getEquippedSkinsForChar(charId));
    cur.add(skinId);
    playerWallet.equippedSkins[charId] = Array.from(cur);
    saveWallet();
    return true;
  }

  function buySkin(skinId) {
    const skin = SKIN_CATALOG.find((s) => s.id === skinId);
    if (!skin) return { ok: false, reason: "NO_SKIN" };
    if (isSkinUnlocked(skinId)) return { ok: true, already: true, skin };
    if (playerWallet.gems < skin.price) return { ok: false, reason: "INSUFFICIENT_GEMS", needed: skin.price };
    playerWallet.gems -= skin.price;
    playerWallet.unlockedSkins.add(skinId);
    const cur = new Set(getEquippedSkinsForChar(skin.charId));
    cur.add(skinId);
    playerWallet.equippedSkins[skin.charId] = Array.from(cur);
    saveWallet();
    return { ok: true, skin };
  }

  loadWallet();

  const SHOP_CATALOG = [
    // --- UNLOCKABLE FIGHTERS (4 NEW BRAWLERS) ---
    {
      id: "fighter_dio",
      name: "ARROGANT VAMPIRE",
      category: "fighter",
      targetChar: "STAND USER • DIO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🧛",
      desc: "Wields The World! Rapid Stand Barrage, Time Stop (ZA WARUDO), and frozen throwing knives.",
      price: 100,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "dio",
      previewCharId: "dio",
    },
    {
      id: "fighter_jotaro",
      name: "STAR DELINQUENT",
      category: "fighter",
      targetChar: "STAND USER • JOTARO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "⭐",
      desc: "Commands Star Platinum! Heavy ORA Barrage dashes, Stand Clash duels, and Star Platinum: The World!",
      price: 200,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "jotaro",
      previewCharId: "jotaro",
    },
    {
      id: "fighter_black_swordsman",
      name: "HUNDRED-MAN SLAYER",
      category: "fighter",
      targetChar: "BERSERKER • GUTS",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🗡️",
      desc: "Wields the colossal Dragonslayer with real blade collision, AoE cleaves, and 2x Savage Rampage Berserker Armor!",
      price: 300,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "guts",
      previewCharId: "guts",
    },
    {
      id: "fighter_honored",
      name: "HONORED SORCERER",
      category: "fighter",
      targetChar: "SORCERER • GOJO",
      badge: "FIGHTER",
      badgeClass: "badge-fighter",
      icon: "🤞",
      desc: "Six-Eyes prodigy alternating Reversal RED & Lapse BLUE, plus Hollow Purple Imaginary Mass ultimate!",
      price: 400,
      currency: "coins",
      status: "AVAILABLE",
      unlockCharId: "gojo",
      previewCharId: "gojo",
    },

    // --- SECRET FIGHTERS (WIP) ---
    {
      id: "fighter_drill",
      name: "DRILL PIERCER",
      category: "fighter",
      targetChar: "NEW BRAWLER",
      badge: "FIGHTER • WIP",
      badgeClass: "badge-fighter",
      icon: "🌀",
      desc: "Hot-blooded brawler with an expanding spiral core drill piercing through space and time. (Under development)",
      price: 120,
      currency: "gems",
      status: "WIP",
      previewCharId: "naruto",
    },
  ];

  // Turbo Granny Mascot Quotes (Dandadan personality: sassy, grumpy, hilarious)
  const TURBO_GRANNY_QUOTES = [
    `"Oi gaki! (Hey brat!) Don't rush me! Check out the roster of brawlers in stock!"`,
    `"Hmph! Looking for secret fighters? Baa-san only trades with winners! Win matches and earn coins, brat!"`,
    `"千万両 (10 Million Ryo)! You better save up your coins and gems! Top-tier brawlers aren't gonna be cheap!"`,
    `"Don't poke me, you insolent runt! Even with my 100 km/h sprint speed, good features take time to develop!"`,
    `"Go practice your combos in Sandbox arena while I count my coins!"`,
    `"New fighters come out of my machine now, brat. Ten pulls and a fighter is guaranteed!"`,
    `"Duplicates? Hmph! Baa-san pays you 30 gems for the trouble. Don't say I'm not generous!"`,
    `"What are you staring at?! You want me to steal your bananas? Go win some matches and earn your keep!"`,
  ];

  // Ball-Styled Turbo Granny Mascot from Dandadan (Maneki-Neko Cursed Doll form)
  function drawTurboGranny(canvasEl, t) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    const w = canvasEl.width;
    const h = canvasEl.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.43 + Math.sin(t * 3.8) * 2.2;
    const r = 24.5;

    ctx.save();
    ctx.translate(cx, cy);

    const earTwitch = (Math.sin(t * 6.5) > 0.88) ? Math.sin(t * 28) * 0.12 : 0;

    // Left Ear
    ctx.save();
    ctx.translate(-r * 0.62, -r * 0.65);
    ctx.rotate(-0.28 + earTwitch);
    ctx.beginPath();
    ctx.moveTo(3, 4);
    ctx.lineTo(-13, -22);
    ctx.lineTo(13, -8);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(-9, -17);
    ctx.lineTo(8, -7);
    ctx.closePath();
    ctx.fillStyle = "#c91d24";
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(r * 0.62, -r * 0.65);
    ctx.rotate(0.28 - earTwitch);
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(13, -22);
    ctx.lineTo(-13, -8);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(9, -17);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.fillStyle = "#c91d24";
    ctx.fill();
    ctx.restore();

    // White Ball Head / Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    // Red Forehead Spot
    ctx.beginPath();
    ctx.ellipse(0, -r + 2.5, 6.8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#99181e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    // Forehead Wrinkle Lines
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(-3.5, -9);
    ctx.lineTo(-6, -13);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3.5, -9);
    ctx.lineTo(6, -13);
    ctx.stroke();

    // Turbo Granny Eyes
    const isBlinking = (Math.floor(t * 1.3) % 5 === 0) && (t * 1.3 % 1 < 0.18);
    const eyeY = 0.5;
    const eyeSpacing = 8.5;

    if (isBlinking) {
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = COLORS.ink;
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, 5, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, 5, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      [-1, 1].forEach((dir) => {
        const ex = dir * eyeSpacing;
        ctx.save();
        ctx.translate(ex, eyeY);
        ctx.rotate(dir * 0.12);

        ctx.beginPath();
        ctx.ellipse(0, 0, 6.8, 5.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = COLORS.ink;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(dir * 0.6, 0.2, 4.4, 4.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#202028";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(dir * 0.2 - 1.2, -1.2, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.lineWidth = 2.8;
        ctx.strokeStyle = COLORS.ink;
        ctx.beginPath();
        ctx.arc(0, -0.6, 6.4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();

        ctx.lineWidth = 1.4;
        ctx.strokeStyle = COLORS.ink;
        const lashAngles = [-2.4, -2.0, -1.6, -1.2];
        lashAngles.forEach((ang) => {
          const lx = Math.cos(ang) * 6.5;
          const ly = Math.sin(ang) * 5.2;
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + Math.cos(ang) * 3.8, ly + Math.sin(ang) * 3.8);
          ctx.stroke();
        });

        ctx.restore();
      });
    }

    // Whiskers
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.beginPath(); ctx.moveTo(-12, 4); ctx.lineTo(-24, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 7.5); ctx.lineTo(-25, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, 11); ctx.lineTo(-23, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(24, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 7.5); ctx.lineTo(25, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 11); ctx.lineTo(23, 14); ctx.stroke();

    // Nose & Philtrum
    ctx.fillStyle = "#1b1b1f";
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-2.6, 4.2);
    ctx.lineTo(2.6, 4.2);
    ctx.closePath();
    ctx.fill();

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = COLORS.ink;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Cheek Dimples
    ctx.beginPath();
    ctx.arc(-8, 10.5, 2.2, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 10.5, 2.2, -Math.PI * 0.3, Math.PI * 0.3);
    ctx.stroke();

    // Mouth
    const talkCycle = Math.abs(Math.sin(t * 6));
    const mouthOpen = talkCycle > 0.4 ? talkCycle * 3.8 : 0;

    if (mouthOpen > 1.2) {
      ctx.beginPath();
      ctx.ellipse(0, 12, 3.8, mouthOpen, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#7a1a2b";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 12 + mouthOpen * 0.35, 2.2, 0, Math.PI);
      ctx.fillStyle = "#ff6b8b";
      ctx.fill();
    } else {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = COLORS.ink;
      ctx.beginPath();
      ctx.arc(-3, 10.2, 3.2, 0.15, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, 10.2, 3.2, 0.1, Math.PI * 0.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 15, 3.2, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // Collar & Bib
    ctx.beginPath();
    ctx.arc(0, r - 3, 13, 0.25, Math.PI - 0.25);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1b8a4f";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, r - 4, 10, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#c0292b";
    ctx.stroke();

    // Golden Bell
    const bellY = r + 1;
    ctx.beginPath();
    ctx.arc(0, bellY, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = "#f5b041";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3, bellY + 0.5);
    ctx.lineTo(3, bellY + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, bellY + 2, 0.9, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();

    // Golden Koban Medallion
    const coinY = bellY + 11;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, coinY, 8.5, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f39c12";
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = COLORS.ink;
    ctx.stroke();

    ctx.fillStyle = "#1b1b1f";
    ctx.font = "900 7.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("千", 0, coinY - 4.5);
    ctx.fillText("万", 0, coinY + 4.5);
    ctx.restore();

    ctx.restore();
  }

  BF.DEFAULT_UNLOCKED_FIGHTERS = DEFAULT_UNLOCKED_FIGHTERS;
  BF.WALLET_STORAGE_KEY = WALLET_STORAGE_KEY;
  BF.playerWallet = playerWallet;
  BF.loadWallet = loadWallet;
  BF.saveWallet = saveWallet;
  BF.isFighterUnlocked = isFighterUnlocked;
  BF.EVOLUTION_SPECS = EVOLUTION_SPECS;
  BF.isFighterEvolved = isFighterEvolved;
  BF.isEvolutionEquipped = isEvolutionEquipped;
  BF.setEvolutionEquipped = setEvolutionEquipped;
  BF.evolveFighter = evolveFighter;
  BF.SKIN_CATALOG = SKIN_CATALOG;
  BF.isSkinUnlocked = isSkinUnlocked;
  BF.isSkinEquipped = isSkinEquipped;
  BF.setSkinEquipped = setSkinEquipped;
  BF.getEquippedSkinsForChar = getEquippedSkinsForChar;
  BF.getEquippedSkin = getEquippedSkin;
  BF.setEquippedSkin = setEquippedSkin;
  BF.buySkin = buySkin;
  BF.SHOP_CATALOG = SHOP_CATALOG;
  BF.TURBO_GRANNY_QUOTES = TURBO_GRANNY_QUOTES;
  BF.drawTurboGranny = drawTurboGranny;
})();

