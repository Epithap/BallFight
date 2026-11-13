
## ⚡ Welcome to Ball Fight!

**Ball Fight** is a high-octane, MUGEN-inspired **2D Anime Ball Physics Auto-Battler** built entirely from scratch with **HTML5 Canvas** and **vanilla JavaScript**. 

No bloated frameworks, no game engines, zero external dependencies. Just pure math, elastic collision kinematics, telegraphed signature abilities, and explosive 5-hit anime Ultimates!

> 🎮 **Play Live in Your Browser**: **[ballfight-alpha.vercel.app](https://ballfight-alpha.vercel.app)**

---

## 🐱 Official Shop Mascot: Turbo Granny (*Dandadan*)

<table>
  <tr>
    <td width="260" align="center" valign="middle">
      <img src="assets/turbo-granny.svg" alt="Turbo Granny Mascot" width="220" />
    </td>
    <td valign="middle">
      <h3>🐱 TURBO GRANNY / ターボババア</h3>
      <p><em>Cursed Maneki-Neko Spirit • 100 km/h Sprint Demon • Bazaar Master</em></p>
      <blockquote>
        <strong>"Ahihi! Oi gaki! (Hey brat!) Don't rush me! This shop is WORK IN PROGRESS! Soon I'll be stocking exclusive cursed skins and secret brawlers! Go brawl in the arena while I finish setting up, or I'll steal your bananas!"</strong>
      </blockquote>
      <p>Featuring a 100% faithful recreation of her iconic <em>Dandadan</em> lucky cat doll form: white ball body, sharp pointed ears with vermilion lining, crimson forehead patch, furrowed brow glare, almond eyes with upper eyelashes, red collar with green scalloped bib, golden jingle bell, and a swinging golden Koban medallion inscribed with <strong>"千万" (10,000,000 Ryo)</strong>!</p>
    </td>
  </tr>
</table>

---

## 🥊 Current Fighters Roster

Fighters sport hype battleground epithets while unleashing their **authentic, beloved anime moves**:

| Fighter Title | Inspired Series | Weapon | Signature Skill | 5-Hit Ultimate Form |
| :--- | :--- | :--- | :--- | :--- |
| **STRONGEST ALIEN** | *Dragon Ball* | Power Pole (*Nyoibo*) | **Kamehameha / Dragon Rush** (`3.4s` CD)<br>Alternates Ki blast and straight-line **Dragon Rush** (chains **3x Dragon Kicks** + heavy knockback). | **KAIOKEN BURST / GREAT APE**<br>Empowers Kamehameha & Dragon Rush! At **HP ≤ 100** in Ult, transforms into berserk **Great Ape (Oozaru)** with erratic movement & **35% DMG reduction**! |
| **CHILD OF PROPHECY** | *Naruto* | Kunai | **Rasengan** (`3.0s` CD)<br>Charges a swirling chakra sphere & rockets forward in a high-speed dash (`14` dmg + `stun`). | **RASENSHURIKEN**<br>Throws an explosive 4-bladed vortex disc that violently shreds opponents (`30` dmg + `0.9s stun`)! |
| **WARRIOR OF LIBERATION** | *One Piece* | Gomu-Gomu Fist | **Gomu Rocket → Pistol** (`2.5s` init / `4.5s` total CD)<br>Launches **Gomu Rocket**, then after `0.2s` fires **Gomu Pistol** (`7–10` dmg + knockback). | **GEAR 4 (BOUNCEMAN / SNAKEMAN)**<br>**Odd HP**: Bounceman (wide AoE smash + 35% shield). **Even HP**: Snakeman (+32% speed + wall-bouncing punches)! |
| **SUBSTITUTE REAPER** | *Bleach* | *Tensa Zangetsu* | **Getsuga Tensho** (`3.4s` CD)<br>Swings the dark greatsword to release a razor-sharp red crescent wave across the arena (`14` dmg + `slow`). | **HOLLOW MASK BANKAI**<br>Dons the demonic bone mask, boosting agility and enlarging slashes into ominous black-red **Hollow Getsuga** arcs! |
| **ARROGANT VAMPIRE** | *JoJo's Bizarre Adventure* | Throwing Knives | **Stand Barrage** (`2.3s` CD)<br>The World dashes forward and unleashes a ramping Punch Barrage (`1→5` dmg per hit + mini-slow). | **ZA WARUDO (TIME STOP)**<br>Freezes time across the arena! Suspends a deadly ring of knives in mid-air and unleashes auto-aimed Stand attacks before time moves again! |
| **STAR DELINQUENT** | *JoJo's Bizarre Adventure* | *Star Platinum* | **Ora Barrage** (`2.4s` CD)<br>Star Platinum dashes forward and unleashes a ramping ORA Barrage (`1→5` dmg per hit + mini-slow). | **STAR PLATINUM: THE WORLD!**<br>Freezes time across the arena for 4s and locks onto the rival with auto-aimed heavy ORA barrages! |
| **HUNDRED-MAN SLAYER** | *Berserk* | *Dragonslayer* Greatsword | **Dragonslayer Cleave** (`2.1s` CD)<br>Zero collision dmg, but swings his colossal iron sword in a wide AoE arc (`22–28` dmg + knockback). | **BERSERKER ARMOR**<br>Dons the cursed black Berserker Armor! Surges with rage speed and replaces Cleave with 2x **Savage Rampage** (`28–35` dmg)! |
| **HONORED SORCERER** | *Jujutsu Kaisen* | Limitless | **Red / Blue** (`2.5s` CD)<br>Alternates **Reversal Red** (`13–16` dmg + knockback) and **Lapse Blue** (`2` dmg gravitational pull). | **HOLLOW PURPLE & SIX EYES**<br>Fires a huge **Hollow Purple** void (`26–32` dmg), grants **13s Six Eyes Infinity**, and triggers **Unlimited Void** (`6s` freeze)! |

---

## 🔥 Key Features

- 💥 **Tactile Physics & Hit-Stop**: Elastic ball kinematics with mass weighting, velocity-based collision damage, dynamic squash-and-stretch, screen shake, and visceral micro-freezes (*hit-stop*).
- ⚡ **Telegraphed Skill Casting**: Balls visually telegraph their moves—charging ki spheres, forming rotating Rasengans, aiming dashed angles, and swinging weapon arcs before firing.
- 👑 **5-Hit Ultimate Gauge**: Landing signature skills charges the `ULT` meter (`0/5` ➔ `5/5`). Filling it triggers an explosive comic banner, screen shockwaves, and instant anime transformation!
- 🎲 **7% Critical Hit System**: Balanced `7%` crit chance that prospers in intense clashes with oversized confetti bursts, comic text callouts, and heavy bonus damage.
- 📱 **9:16 Vertical Recording Mode (`REC`)**: One-click vertical framing mode optimized for TikTok, Instagram Reels, and YouTube Shorts without disturbing underlying physics.
- 🎲 **Deterministic RNG Seeds (`mulberry32`)**: Every match is perfectly reproducible. Share seeds via URL queries (e.g. `?seed=999`).
- 🔊 **Procedural Web Audio SFX**: 100% synthesized audio engine generates charges, clashes, wall bounces, crits, and K.O. sounds on the fly with zero external `.mp3` files!
- 🗂️ **Overlay Modal Roster**: Clean, scroll-free UI with overlay modal sheets (`✖`), engineered to comfortably scale up to 50+ fighters without cluttering the screen.
- 🛍️ **Anime Bazaar Shop (WIP)**: Managed by Turbo Granny! Future updates will feature **Exclusive Skins** (*Super Saiyan God*, *Sage Cloak*, *Sun God Nika*, *Final Getsuga*) and **Secret Brawlers** (*The Honored Sorcerer*, *Drill Piercer*, *Hundred-Man Slayer*).

---

## 🎮 Controls

| Key / Button | Action |
| :--- | :--- |
| `Space` | Quick Start Match / Pause / Resume battle |
| `R` | Quick Reset Match (Back to Round 1) |
| `Esc` | Close active modal / Exit 9:16 `REC` Mode |
| `1X / 2X` | Toggle simulation speed (Normal / Turbo) |
| `SFX: ON / OFF` | Toggle procedural sound effects |
| `REC` | Toggle 9:16 social-media recording viewport |
| `CHAR / MENU` | Return to character roster & match setup |

---

## 🚀 Run Locally

Clone the repository and run it with any lightweight local server (or open `index.html` directly in your browser):

```bash
# Clone the repository
git clone https://github.com/Epithap/BallFight.git
cd BallFight

# Serve locally with npx
npx serve .
```

Replay a specific seed:
```text
http://localhost:3000/?seed=777
```

---

## 📋 Update Notes

Lihat riwayat lengkap perubahan, karakter baru (*Stand Users*), mekanisme *Stand Clash*, dan penyesuaian *balance* sejak awal clone di **[CHANGELOG.md](CHANGELOG.md)**.

---

## 🛠️ Architecture

```
ball/
├── index.html        # Semantic HTML5 layout, cartoon cards, & overlay modals
├── style.css         # Comic-book styling, chunky borders, & responsive constraints
├── game.js           # 60 FPS physics loop, fighter state machine, & Web Audio SFX
└── assets/
    ├── hero-banner.svg   # Animated arena clash banner with Turbo Granny & anime balls
    └── turbo-granny.svg  # Animated standalone Dandadan mascot avatar
```

---

<p align="center">
  <sub>Built with ❤️ and pure anime hype. Powered by HTML5 Canvas. Ahihi!</sub>
</p>
