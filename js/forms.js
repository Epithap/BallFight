// Static metadata: previewable forms per fighter, series and rarity labels
(() => {
  const BF = (window.BallFight = window.BallFight || {});

  BF.SERIES = {
    goku: "DRAGON BALL", naruto: "NARUTO", luffy: "ONE PIECE", ichigo: "BLEACH",
    dio: "JOJO", jotaro: "JOJO", guts: "BERSERK", gojo: "JUJUTSU KAISEN", sukuna: "JUJUTSU KAISEN",
    killua: "HUNTER X HUNTER", jinwoo: "SOLO LEVELING", denji: "CHAINSAW MAN", garou: "ONE-PUNCH MAN",
  };
  BF.RARITY = {
    goku: "fighter", naruto: "fighter", luffy: "fighter", ichigo: "fighter",
    jotaro: "fighter", guts: "fighter", dio: "fighter", gojo: "fighter", sukuna: "fighter",
    killua: "fighter", jinwoo: "fighter", denji: "fighter", garou: "fighter",
  };

  // Evolution stage tabs shown on the top row of Fighter Detail when a character has evolution branches
  BF.EVO_STAGES = {
    naruto: [
      { id: "starter", label: "BASE (GENIN)", evolved: false, defaultForm: "base" },
      { id: "evolved", label: "SAGE MODE (EVO)", evolved: true, defaultForm: "sage" },
    ],
    ichigo: [
      { id: "starter", label: "BASE (SHIKAI)", evolved: false, defaultForm: "shikai" },
      { id: "evolved", label: "BANKAI (EVO)", evolved: true, defaultForm: "base" },
    ],
  };

  // flags are copied onto the preview ball (ult => ultTimer, others as-is)
  BF.FORMS = {
    goku: [
      { id: "base", label: "BASE", desc: "Orange gi, blue sash and a confident smirk." },
      { id: "kaioken", label: "KAIOKEN", ult: true, desc: "Blazing crimson ki flame aura, scarlet eyes, Speed +25% and empowered Kamehameha & Dragon Rush." },
      { id: "ape", label: "GREAT APE", ult: true, apeMode: true, desc: "Triggers at HP <= 200 during Ult. 35% shield & transforms skill into 4s Ape Rush (15 DMG/hit + 30 DMG AoE wall slams)!" },
    ],
    naruto: [
      { id: "base", stage: "starter", label: "BASE", starterOnly: true, desc: "Starter Base: Classic orange jumpsuit, Rasengan dash & Shadow Clone (Nine-Tails locked)." },
      { id: "rasenshuriken", stage: "starter", label: "RASENSHURIKEN (ULT)", ult: true, starterOnly: true, desc: "Starter Ult: Throws Wind Style: Rasenshuriken that leaves a pulling Wind Vortex on impact!" },
      { id: "sage", stage: "evolved", label: "SAGE MODE", evolved: true, desc: "Evolved Base (10k Gold): Red Sage Cloak, Giant Scroll, Toad Sage eyes, Senpō Giant Rasengan & unlocks Four-Tails!" },
      { id: "kyuubi", stage: "evolved", label: "FOUR-TAILS (HP≤200)", ult: true, evolved: true, kyuubiMode: true, desc: "Sage Mode Passive (HP <= 200): Permanent Four-Tails mode with Kyuubi Claw Slash & Bijuudama Ult!" },
    ],
    luffy: [
      { id: "base", label: "BASE", desc: "Straw hat, red vest and a huge grin." },
      { id: "bounceman", label: "BOUNCEMAN", ult: true, gear4Mode: "bounceman", desc: "Odd HP at Ult start. Swollen Haki-black arms, big area smash, steam and 35% shield." },
      { id: "snakeman", label: "SNAKEMAN", ult: true, gear4Mode: "snakeman", desc: "Even HP at Ult start. Slim and fast, Haki-banded python arm that bounces off walls." },
    ],
    ichigo: [
      { id: "shikai", stage: "starter", label: "SHIKAI", starterOnly: true, desc: "Starter Base: Giant Shikai Zangetsu cleaver, Blue Getsuga Tensho & Shunpo." },
      { id: "bankai_ult", stage: "starter", label: "BANKAI (ULT)", ult: true, starterOnly: true, desc: "Starter Ult: Unleashes Bankai Tensa Zangetsu with crimson Reiatsu & faster slashes!" },
      { id: "inner_demon", stage: "starter", label: "INNER DEMON (HP≤100)", starterOnly: true, innerDemonMode: true, desc: "Starter HP <= 100: Taken over by Inner Hollow with creeping half-mask, black-gold eyes & maniacal grin!" },
      { id: "base", stage: "evolved", label: "BANKAI", evolved: true, desc: "Evolved Base (10k Gold): Starts directly in Bankai with Tensa Zangetsu (or Arrancar tattered outfit)!" },
      { id: "hollow", stage: "evolved", label: "HOLLOW MASK (ULT)", ult: true, evolved: true, desc: "Evolved Ult: Dons Hollow Mask (or Arrancar Arc Half-Mask skin) with Black Getsuga Tensho!" },
      { id: "vasto", stage: "evolved", label: "VASTO LORDE (HP≤200)", ult: true, evolved: true, vastoLordeMode: true, desc: "Evolved HP <= 200: Permanent Vasto Lorde (or Long-Hair Half-Vasto Mythic skin) with Sonído & Gran Rey Cero!" },
    ],
    dio: [
      { id: "base", label: "BASE", desc: "Golden headband, green heart and a sly smirk." },
      { id: "ult", label: "ZA WARUDO", ult: true, desc: "Time stop with grayscale screen and frozen knives." },
    ],
    jotaro: [
      { id: "base", label: "BASE", desc: "Black cap and chain, deadpan glare." },
      { id: "ult", label: "STAR PLATINUM", ult: true, desc: "Time stop and heavy ORA barrage." },
    ],
    guts: [
      { id: "base", label: "BASE", desc: "Black Swordsman with a scarred, missing left eye." },
      { id: "ult", label: "BERSERKER ARMOR", ult: true, desc: "Blood-red armor. Savage Rampage twice." },
    ],
    gojo: [
      { id: "base", label: "BLINDFOLD", desc: "White hair and a black blindfold." },
      { id: "ult", label: "SIX EYES", ult: true, desc: "Blindfold off, Infinity up, Hollow Purple unlocked." },
    ],
    sukuna: [
      { id: "base", label: "BASE", desc: "Four eyes, cursed markings and a fanged grin." },
      { id: "ult", label: "KING OF CURSES", ult: true, desc: "Fuga aura. First skill opens Malevolent Shrine and can start a Domain Clash." },
    ],
    killua: [
      { id: "base", label: "ASSASSIN", desc: "50kg Alloy Yo-Yo, Narukami Thunderbolt and Rhythm Echo afterimage clones." },
      { id: "ult", label: "GODSPEED (KANMURU)", ult: true, desc: "Electric aura, +38% Speed, 20% Shield and Whirlwind Reflex auto-counter lightning." },
    ],
    jinwoo: [
      { id: "base", label: "HUNTER", desc: "Kamish's Wrath twin daggers, Mutilate cross-slash dash and Ruler's Authority gravity pull." },
      { id: "ult", label: "ARISE (SHADOW MONARCH)", ult: true, desc: "Summons autonomous Shadow Soldiers (Igris & Beru) to hunt the enemy and empowers Mutilate." },
    ],
    denji: [
      { id: "base", label: "CHAINSAW HYBRID", desc: "Spinning arm chainsaws, Rip & Tear blood lifesteal and Devil Chain Grapple." },
      { id: "ult", label: "HERO OF HELL", ult: true, desc: "Black Chainsaw Devil armor, +28% Speed, 22% Shield and boosted Blood Lifesteal." },
    ],
    garou: [
      { id: "base", label: "HERO HUNTER", desc: "Whirlwind Iron Cutting Fist spiral waves and Water Stream Rock Smashing Counter." },
      { id: "monster", label: "MONSTER FORM", ult: true, desc: "Awakened Monster carapace! God Slayer Dash + 4-hit Barrage and Extreme Fa Jin strikes." },
      { id: "cosmic", label: "COSMIC FEAR", ult: true, cosmicMode: true, desc: "Triggers below 100 HP! God's Moon Awakening (+50 HP), Black Hole Moon Arena Rampage, and Gamma Ray Burst!" },
    ],
  };
})();
