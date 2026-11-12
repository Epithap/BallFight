# Ball Fight — Anime Physics Auto-Battler

An expandable, MUGEN-style **2D Anime Ball Fighting Simulator** built with pure HTML5 Canvas and vanilla JavaScript. Pick your fighters, watch their idle stances, and let real-time physics, signature skills, and 5-hit Ultimates decide the winner.

> Zero dependencies. Zero build step. Built to be easily expanded with new anime fighters, weapons, skills, and transformations.

---

## Core Mechanics

- **Pre-Match Fighter Select**: Animated idle character previews with live skill & cooldown info before entering the arena.
- **Charge-Up Skill System**: Fighters telegraph attacks by freezing and building energy (aim lines, growing Rasengans, swinging crescent slashes, dash wind-ups) before unleashing them.
- **5-Hit Ultimate Gauge**: Landing skills charges the `ULT` meter (`0/5` -> `5/5`). At 5 charges, fighters trigger a comic-style screen banner, shockwave ring, and unleash their **Ultimate** transformation or finisher.
- **Physics & Impact**: Mass-weighted elastic collisions, velocity-scaled damage, hit-stop, screen shake, squash-and-stretch, and `0.1%` Critical Hits (`25` dmg + confetti burst).
- **Best of 3 & K.O. Slow-Mo**: Round score tracking with `0.25x` slow-motion and dynamic camera zoom on every K.O.
- **9:16 Recording Mode (`REC`)**: Instant vertical framing for TikTok, Reels, and YouTube Shorts without altering arena physics.
- **Deterministic Seeded RNG (`mulberry32`)**: Share or replay exact matches via `?seed=123`.
- **Procedural Web Audio SFX**: Synthesized sound effects for charges, bounces, hits, crits, and K.O.s.

---

## Current Roster (Starter Pack: Big Three + Father)

| Fighter | Series | Weapon | Signature Skill | Ultimate (5 Skill Hits) |
| :--- | :--- | :--- | :--- | :--- |
| **Goku** | *Dragon Ball* | Power Pole (*Nyoibo*) | **Kamehameha** (`3.6s` CD) — Charges & fires a blue energy blast (`14` dmg + `slow`) | **Kaioken** — Red spiky aura, `1.25x` speed, `1.35x` dmg; skill upgrades to a live-aimed **Kaioken Beam** |
| **Naruto** | *Naruto* | Kunai | **Rasengan** (`3.0s` CD) — Charges a spinning chakra sphere & dashes (`14` dmg + `stun`) | **Rasenshuriken** — Charges & hurls a 4-bladed wind shuriken (`30` dmg + `0.9s stun`) |
| **Luffy** | *One Piece* | Gomu-Gomu Fist | **Gum Rocket** (`2.8s` CD) — Wind-up dash toward target (`16` bonus dmg on impact) | **Gear 4** — Expands size (`1.18x`), Haki armor (`35%` dmg reduction), steam clouds, & `26` dmg Rocket |
| **Ichigo** | *Bleach* | *Tensa Zangetsu* | **Getsuga Tensho** (`3.4s` CD) — Crimson-black crescent slash (`14` dmg + `slow`) | **Hollow Mask** — Bone mask transformation, `1.28x` speed, `1.35x` dmg, & giant `24` dmg Getsuga |

---

## Expanding the Roster (MUGEN-Style Architecture)

`game.js` is structured so adding new anime fighters requires no changes to the main game loop:

1. **Add a Skill**: Define a skill object using hooks (`onTick`, `onHit`, `onWallBounce`, `onDamaged`) with `cooldown`, `beginCast()`, `spawnProjectile()`, and `game.chargeUlt(ball)`.
2. **Add a Character Config**: Register a new entry in `CHARACTER_ROSTER` with stats (`maxHp`, `speed`, `damage`, `mass`, `radius`), `costume`, `weapon`, `ult`, and `skills`.
3. **Add Visuals**: Add the character's costume case in `drawCostume()` and weapon case in `drawWeapon()`.

### Planned / Future Roster Ideas
- **Gojo / Sukuna** (*Jujutsu Kaisen*)
- **Tanjiro / Zenitsu** (*Demon Slayer*)
- **Saitama** (*One Punch Man*)
- **Levi / Eren** (*Attack on Titan*)

---

## Controls

| Input | Action |
| :--- | :--- |
| `Space` | Fight (on select screen) / Pause / Resume |
| `R` | Reset Match (Round 1) |
| `Esc` | Exit `REC` Mode |
| `1X / 2X` | Toggle Simulation Speed |
| `SFX` | Mute / Unmute Audio |
| `CHAR` | Open Fighter Select |

---

## Run Locally

Open `index.html` directly in any modern browser, or serve locally:

```bash
npx serve .
```

Replay a specific match seed:

```text
http://localhost:3000/?seed=123
```
