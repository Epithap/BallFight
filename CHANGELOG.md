# 📋 Update Notes / Changelog

Ringkasan lengkap seluruh pembaruan **Ball Fight** hingga **v1.1**.

---

## 🚀 Version 1.1 — Shop, New Fighters, Balance & Character Revamps

### 🐒 STRONGEST ALIEN (`goku`) — Revamp
- **Alternating 2-Mode Skill (`Kamehameha / Dragon Rush`)**:
  - **Cast 1 (`Kamehameha`)**: Menembakkan proyektil Ki (atau full Kaioken Beam saat Ulti).
  - **Cast 2 (`Dragon Rush`)**: Mengincar lurus ke arah musuh lalu melesat menabrak target; jika kena, melancarkan **3x Dragon Kick** beruntun lalu mementalkan musuh.
- **Kaioken Ultimate**: Memperkuat **Kamehameha** maupun **Dragon Rush** (lebih cepat, damage `9/9/12`, knockback lebih kuat).
- **Great Ape (`Oozaru`) Form**: Jika Goku berada dalam kondisi **Ult (`ultTimer > 0`)** dan **HP ≤ 100**, Goku bertransformasi menjadi **Great Ape** (`1.48x` radius, aura bulan purnama, ekor, moncong bertaring, mata merah menyala) dengan pola serangan **membabi buta tidak terduga** serta **35% Damage Reduction**.

### 👒 WARRIOR OF LIBERATION (`luffy`) — Revamp
- **Combo Skill (`2.5s` Init CD → `4.5s` Total CD)**: Mengeluarkan **Gomu Rocket** (`8` / `14` dmg), lalu jeda `0.2s` langsung **Gomu Pistol** (`7–10` dmg, damage di-nerf tapi dengan **knockback** kuat), lalu cooldown akhir `2.0s`.
- **Gear 4 Dual Mode**: Saat mengaktifkan Ulti, **HP Ganjil → Bounceman** (hantaman tangan raksasa AoE luas + 35% shield) dan **HP Genap → Snakeman** (pukulan memanjang yang dapat memantul dari tembok).

### 🤞 HONORED SORCERER (`gojo`)
- **Alternating Limitless (`2.5s` CD)**: Bergantian antara **Reversal Red** (knockback kuat, damage dikurangi 25% ke `13–16`) dan **Lapse Blue** (tarikan gravitasi ke tengah, `2` dmg).
- **Hollow Purple**: Jangkauan & area AoE lebih besar (`26–32` dmg, meledak `16–20` dmg di ujung lintasan jika meleset).
- **Six Eyes (`13s`) & Domain Expansion**: Memperoleh **Infinity** (aura transparan, proyektil melambat mendekati `0`), dan skill pertama dalam Six Eyes memicu **Unlimited Void** yang membekukan musuh selama **6 detik**.

### ⚔️ HUNDRED-MAN SLAYER (`guts`) & 🎭 SHINIGAMI (`ichigo`)
- **Guts**: Pedang **Dragonslayer** (`380` mass, `0` base collision damage, mengandalkan tebasan pedang & AoE **Savage Rampage** 2x ayunan saat **Berserker Armor**).
- **Ichigo**: Perbaikan tampilan **Hollow Mask** full-face saat Bankai/Ulti.
- **Jotaro**: Senjata rantai berputar disembunyikan (`weapon: null`) agar fokus pada Star Platinum.

### 🛒 Fighter Shop & Economy
- Memulai permainan dengan **2.000 Koin** dan hadiah **+100 Koin** setiap ronde Sandbox selesai untuk membuka karakter tambahan.

---

## ✨ v1.0 → v1.1 Base: New Fighters (Stand Users)

### 🟡 ARROGANT VAMPIRE (`dio`) — Stand: *The World*
- **Base Stats**: HP `330`, Speed `370`, Base Collision Damage `[3, 6]`, Mass `1.0`.
- **Visual & Audio**:
  - Bola berkostum kuning khas Part 3 dengan *headband* emas, permata hati hijau, taring vampir, serta senjata *Throwing Knife*.
  - Stand **The World** melayang di belakang bola dengan desain detail: mahkota datar bersirip samping, mata merah menyala, tabung oksigen kembar & selang hijau, torso V-shape berotot, emblem hati hijau di dada & dagu, serta aura radial emas halus.
  - Efek suara *synthesized* Web Audio khusus: `playTimeStop`, `playTimeResume`, `playKnifeThrow`, `playKnifeHit`, dan `playMudaRush`.
- **Skill — `STAND BARRAGE`** (`2.3s` CD):
  - The World meluncur lurus ke depan (`920` speed, jarak max `209`, tanpa *auto-aim* di luar ulti) dan melancarkan pukulan beruntun (`MUDA!`) saat mengenai target, lalu kembali ke belakang user.
  - **Ramping Damage (DoT)**: Hit pertama terasa ringan (`1` dmg), hit ke-2 dan seterusnya semakin sakit (`1 → 2 → 3 → 4 → 5`, total `15` dmg) + efek *mini-slow* (`0.35s`, `factor: 0.45`).
  - **Ult Charge**: Ulti terisi (`+1` stack) apabila barrage mengenai **minimal 2 hit**.
- **Pasif Vampir**:
  - **Vampiric Heal**: `2.5%` peluang memulihkan `2–4 HP` setiap kali mengenai serangan fisik (tabrakan bola maupun pukulan Stand).
  - **Time Skip Teleport (`onDamaged`)**: Saat terkena damage, ada `5%` peluang teleport ke belakang bola musuh (`BEHIND YOU!`) dan `12%` peluang teleport ke area acak di arena (`TELEPORT!`).
- **Ultimate — `ZA WARUDO!`** (`5.0s` Time Stop):
  - Menghentikan waktu seluruh arena dengan efek layar **grayscale** (tanpa lingkaran jam/ring yang mengganggu).
  - Melempar gelombang pisau yang membeku di udara hingga waktu kembali berjalan (`6` damage per pisau).
  - Selama ulti aktif, **Stand Barrage** menjadi **auto-aim** penuh (`380` range) dengan damage ramping `2 → 4 → 6 → 8 → 10 → 12`, dan tabrakan bola memicu bonus `HEAVY MUDA!` (`9–13` dmg).

---

### 🟣 STAR DELINQUENT (`jotaro`) — Stand: *Star Platinum*
- **Base Stats**: HP `350`, Speed `365`, Base Collision Damage `[6, 10]`, Mass `1.05`.
- **Visual**:
  - Bola berkostum jaket gakuran gelap berkerah tinggi, kemeja ungu, rantai emas di kerah, topi ikonik bergerigi dengan dua pin emas, serta **rambut runcing gelap + cambang** yang menyatu dengan topi.
  - Stand **Star Platinum** melayang di belakang dengan rambut ungu-indigo berduri, pelindung bahu emas berinti permata cyan, syal emas, rahang tegas, *headband* berlian cyan, dan sarung tangan lapis baja ungu-emas.
- **Skill — `ORA BARRAGE`** (`2.4s` CD):
  - Star Platinum meluncur lurus (`220` range di luar ulti) dan melancarkan rentetan pukulan **ORA!** dengan damage ramping + *mini-slow*, serta mengisi stack ulti setelah minimal 2 hit.
- **Ultimate — `STAR PLATINUM: THE WORLD!`** (`4.0s` Time Stop):
  - Menghentikan waktu dengan efek layar grayscale, mengaktifkan **auto-aim** pada `ORA BARRAGE`, dan memberi bonus `HEAVY ORA!` (`9–13` dmg) saat tabrakan.

---

## ⚡ Anime Stand Clash System
- **Trigger**: Aktif otomatis saat dua Stand bertemu di arena ketika sama-sama sedang `dashing` atau `barraging`.
- **Freeze & Tug-of-War Meter (`2.2s`)**:
  - Kedua petarung berhenti bergerak sementara di posisi masing-masing.
  - Muncul *vignette* dramatis, inti ledakan energi, *speed rays* berputar, serta **Stand Clash Meter** di bagian atas arena yang menampilkan persentase probabilitas menang secara *real-time* (tarik-ulur bolak-balik sebelum mengarah ke pemenang 50/50).
- **Resolution**:
  - **Pemenang (`CLASH WIN! +ULT`)**: Aman dari damage dan langsung mendapat `+1` stack ulti.
  - **Yang Kalah (`CLASH LOST!`)**: Terkena `14–19` damage dan **terpental keras** (`560` knockback speed) dengan *shock ring*, *crit burst*, `hitStop`, dan getaran layar.

---

## 🎨 UI, Layout & Docs
- **[index.html](index.html)**: Menambahkan filter chip `STAND` dan memperbarui jumlah total menjadi `ALL (6)`.
- **[style.css](style.css)**: Menyesuaikan `.char-grid-chunky` menjadi grid `3 × 2` yang rapi untuk 6 karakter.
- **[README.md](README.md)**: Menambahkan dokumentasi **ARROGANT VAMPIRE** & **STAR DELINQUENT** pada tabel Fighters Roster serta tautan ke changelog ini.

