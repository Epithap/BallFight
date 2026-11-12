# Ball Fight

A fast-paced, 2D physics-based **auto-battler arena** built with vanilla JavaScript and HTML5 Canvas — inspired by viral *Weapon Ball Fight* simulations and featuring anime-themed fighters.

> Zero dependencies. Zero build step. Just open `index.html` and watch them clash.

---

## Fighters (Big Three + Father)

| Fighter | Weapon | Signature Skill | Cooldown | Effect |
| :--- | :--- | :--- | :--- | :--- |
| **Goku** | Power Pole (*Nyoibo*) | **Kamehameha** | `4.2s` | Fires a high-speed energy blast (`13` dmg + `slow`) |
| **Naruto** | Kunai | **Rasengan** | `3.4s` | Unleashes a chakra burst on hit (`+7` dmg + `stun`) |
| **Luffy** | Gomu-Gomu Fist | **Gear Second** | `3.0s` | Wall bounce grants `haste` (`1.38x` speed) + `shield` (`30%` dmg reduction) |
| **Ichigo** | Zangetsu | **Getsuga Tensho** | `3.8s` | Launches a crescent slash projectile (`12` dmg + `slow`) |

---

## Features

- **Pre-Match Character Select**: Animated idle character previews with live skill & cooldown info before starting a match.
- **Physics & Momentum Combat**: Mass-weighted elastic collisions, velocity-scaled damage, hit-stop, screen shake, and squash-and-stretch impact animation.
- **Critical Hits (`0.1%` Chance)**: Deals `25` damage with confetti burst, expanding shockwave ring, and custom Web Audio chime.
- **Skill Cooldown Indicators**: Live cooldown bar in the HUD and progress ring around each ball in the arena.
- **Best of 3 Format**: Round win badges in the HUD, `NEXT ROUND` flow, plus `0.25x` slow-mo & camera zoom on K.O.
- **9:16 Recording Mode (`REC`)**: Hides UI clutter and frames the `500×500` arena into a `9:16` vertical layout without distorting physics — press `Esc` or `REC ● ESC` to exit.
- **Deterministic Seeded RNG (`mulberry32`)**: Share or replay exact matches using `?seed=123` in the URL.
- **Synthesized Web Audio SFX**: Crisp procedural sound effects for wall bounces, hits, crits, and K.O.s with mute toggle.

---

## Controls

| Input | Action |
| :--- | :--- |
| `Space` | Start Fight / Pause / Resume |
| `R` | Reset Match (Round 1) |
| `Esc` | Exit `REC` Mode |
| `1X / 2X` | Toggle Simulation Speed |
| `SFX` | Mute / Unmute Audio |
| `CHAR` | Open Character Select |

---

## Project Structure

```text
ball/
├── index.html   # Layout, HUD, Pre-match Select & Arena Canvas
├── style.css    # Solid-color cartoon arcade styling (Lilita One)
├── game.js      # Physics, AI/skill hooks, status effects, renderer & audio
└── README.md
```

---

## Run Locally

Open `index.html` directly in any modern browser, or serve the folder locally:

```bash
npx serve .
```

Pass a custom seed via query string to replay a specific match:

```text
http://localhost:3000/?seed=123
```
