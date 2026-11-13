# Ball Fight - Changelog & Dev Notes

Dokumen ini ditulis supaya AI agent (Antigravity) dan developer langsung paham struktur proyek, aturan desain, dan cara menambah konten. Baca bagian **Konvensi** dan **Peta file** dulu sebelum mengubah kode.

---

## Version 1.2 — Evolution, Mythic Skins, Sukuna, Gacha & UI Revamp

### Highlights v1.2
- **Sistem Evolusi (`EVOLUTION_SPECS`, 10,000 Gold)**:
  - **Naruto (`naruto`)**: Starter (`BASE (GENIN)`) hanya memakai Rasengan Dash & Rasenshuriken (Wind Vortex pull). Setelah Evolve (**10,000 Gold**), berubah ke **Sage Mode** dengan Senpō Giant Rasengan dan membuka **Four-Tails** permanen saat `HP <= 200` (Kyuubi Claw Slash & ledakan **Bijuudama**).
  - **Ichigo (`ichigo`)**: Starter (`BASE (SHIKAI)`) bertarung dengan pedang raksasa **Shikai Zangetsu** (Blue Getsuga & Shunpo), Ulti **Bankai: Tensa Zangetsu**, dan diambil alih **Inner Demon** saat `HP <= 100`. Setelah Evolve (**10,000 Gold**), langsung memulai match dalam wujud **Bankai**, Ulti **Hollow Mask**, dan membuka **Vasto Lorde** permanen saat `HP <= 200` (Sonído Slash & Gran Rey Cero).
  - **Independent P1 vs P2 Form**: `slotEvoOverrides` memungkinkan Player 1 dan Player 2 memilih form **Starter** vs **Evolved** secara independen di Battle Setup maupun Fighter Detail.
  - **2-Tier Fighter Detail UI (`BF.EVO_STAGES`)**: Tab utama (`BASE` vs `EVO`) menyaring sub-form yang relevan agar tampilan tetap ringkas, dan perubahan form di Fighter Detail langsung menyinkronkan avatar kartu Fighter saat modal ditutup.
- **Diamond Skin Vault (`SKIN_CATALOG`, Gems)**:
  - Carousel horizontal (geser kanan) dengan filter per hero (`ALL HEROES`, `NARUTO`, `ICHIGO`) dan dukungan multi-skin per karakter:
    1. **Six-Tails Skeletal Kyuubi** (`naruto_six_tails_bone`, `150 Gems`) — wujud tulang-belulang Kyuubi ekor 6.
    2. **Arrancar Arc: Ulquiorra Duel** (`ichigo_arrancar_arc`, `120 Gems`) — skin 2-in-1 (jubah Bankai compang-camping + Half-Shattered Dark-Crimson Hollow Mask).
    3. **Awakened Vasto: Long-Hair Half-Mask** (`ichigo_vasto_half_mask`, `180 Gems`) — rambut panjang oranye, wajah pucat, tanduk Vasto tunggal & pecahan topeng melayang.
- **Balance & Visual Polish**:
  - **HP 500+ Rebalance**: Seluruh fighter diseimbangkan di atas 500 HP.
  - **Outline Nama & HP Bar**: Menambahkan outline gelap tebal agar nama dan bar HP tetap terbaca jelas di atas karakter berwarna gelap maupun terang.
  - **Secret Admin Panel**: Ketuk tab/kartu **Profile 10x** untuk membuka panel admin (atur Gold, Gems, dan Unlock All untuk testing).
- **Sukuna (`sukuna`) & Domain Clash**: seri JUJUTSU KAISEN, rarity legend, form `BASE` / `KING OF CURSES` (`js/forms.js`), wajah 4 mata (`BF.FACE_DRAWERS.sukuna`), Dismantle/Cleave/Fuga/Malevolent Shrine, dan **Domain Clash** otomatis saat Gojo & Sukuna sama-sama dalam mode Aura.
- **Variasi wajah (`js/faces.js`)**: mata punya kepribadian per karakter (cheerful, dark, cool, sly) dengan jeda kedip masing-masing.
- **Hourly Rate-Up Gacha &amp; Pity 100 (`js/gacha.js`)**: Semua fighter kini setara (tanpa rarity). Gacha berisi Coins (42%), Gems (38%), dan Fighter (20%) dengan **Banner Rate-Up berganti tiap 1 jam** (55% dari drop karakter) + preview animasi dan **Pity 100** dijamin mendapat karakter sesuai chance banner.
- **Guts Dragonslayer Fix**: Pedang *Dragonslayer* kini diam tersandang di belakang punggung saat bergerak dan hanya menebas/mengenai lawan saat mengaktifkan skill.
- **Turbo Granny Model v1.2 (`js/granny.js` & `assets/turbo-granny.svg`)**: Desain ulang maskot shop dengan mata almond pupil celah emas, alis tajam, pipi merona, bibir `ω`, syal hijau berlekuk 5, lonceng emas, dan koin Koban `千万` yang berayun.

### Ringkasan perubahan
- **UI**: semua layar memakai tema solid (kuning + ungu tua), outline tebal, bayangan keras. Emoji diganti ikon SVG (sprite `<symbol>` di atas `<body>` di `index.html`, dipanggil lewat `<svg><use href="#i-..."/></svg>`).
- **Navigasi**: tab bar fixed di bawah (`.cartoon-nav`, `.nav-btn`). Header berisi logo, chip saldo koin/gem (`#home-coins-display`, `#home-gems-display`), dan tombol What's New (`#btn-whats-new`).
- **Layar Play**: panggung lobby (`.lobby-stage`) dengan dua avatar, tombol `#btn-quick-fight` (utama) dan `#btn-open-sandbox`, serta kartu Story Saga (masih terkunci).
- **Fighters**: kartu roster (`.roster-card`) dengan seri anime dan rarity. Klik kartu membuka *fighter sheet* (`#roster-modal`) dengan pemilih form (`#detail-form-list`), stat, skill, ult. Fighter terkunci tetap bisa dilihat, ada catatan `#detail-lock-note`.
- **Profile**: statistik persisten di localStorage, level/EXP, rank, **fitur Edit Profile (ganti nama & upload foto profil / pilih avatar fighter)**, dan 6 trofi (`#trophy-row`).
- **Shop**: tidak ada lagi pembelian fighter. Fighter selain 4 starter dibuka lewat **Fighter Gacha** (lihat bagian Gacha). Turbo Granny digambar ulang.
- **Wajah karakter**: tiap karakter punya mata, alis, mulut sendiri (`js/faces.js`).
- **Battle FX**: comic impact burst, afterimage, charge-up cast untuk skill dan ult.
- **SFX**: suara sintetis berbeda untuk tiap skill dan ult, plus suara UI dan gacha (`js/sfx.js`). Tidak ada file audio.

### Peta file
```
index.html          semua layar + modal + sprite ikon + urutan <script>
style.css           semua gaya (blok "Home v2" dan "Screens v2" ada di bagian bawah)
game.js             engine battle, render, UI wiring, profile, shop wiring
js/constants.js     namespace window.BallFight (BF), COLORS, FONT, konstanta game
js/sound.js         class SoundEngine (sound dasar: hit, KO, time stop, dll)
js/sfx.js           [BARU] extend SoundEngine.prototype: playSkill, playUlt, playUi, gacha sounds
js/shop.js          wallet (playerWallet), saveWallet, isFighterUnlocked, SHOP_CATALOG lama
js/forms.js         [BARU] BF.SERIES, BF.RARITY, BF.FORMS (daftar form yang bisa dipreview)
js/faces.js         [BARU] BF.FACE_DRAWERS (wajah per costume)
js/granny.js        [BARU] override BF.drawTurboGranny (maskot shop)
js/gacha.js         [BARU] BF.Gacha (logika pull, pity, animasi, banner, collection)
js/characters/*.js  satu file per fighter: roster config, skill, costume, weapon
```

### Urutan load script (PENTING, jangan diubah sembarangan)
`constants` -> `sound` -> `sfx` -> `shop` -> `forms` -> `faces` -> `granny` -> `gacha` -> `characters/*` -> `game.js`

- `sfx.js` butuh `BF.SoundEngine` (dari `sound.js`).
- `granny.js` harus setelah `shop.js` karena menimpa `BF.drawTurboGranny`, dan `game.js` mengambilnya lewat destructuring saat load.
- `game.js` harus terakhir karena membaca `BF.*` yang sudah terisi.

### Konvensi desain (WAJIB diikuti)
- **Tanpa gradient**, tanpa glassmorphism, tanpa glow, tanpa emoji. Warna solid saja.
- Palet ada di `:root` di `style.css` dan `BF.COLORS`: `--ink #2b1b3d`, `--sun #ffc93c`, `--red #ff5a5f`, `--blue #3da5ff`, `--green #3ddc84`, putih.
- Semua elemen interaktif: border 3-5px ink, bayangan keras `0 Npx 0 ink` (bukan blur), saat ditekan `translateY` sebesar bayangan.
- Font: Lilita One. Teks judul memakai `-webkit-text-stroke` + `paint-order: stroke fill`.
- Latar kotak-kotak mint (`#a8e6cf` / `#97dcc2`) dipakai sebagai "lantai" di lobby, kartu roster, sheet, dan arena.
- Ikon baru ditambah sebagai `<symbol id="i-nama">` di sprite, jangan pakai emoji atau gambar eksternal.
- Hormati `prefers-reduced-motion` (sudah ada aturan global di akhir CSS).

### Cara menambah konten

**Fighter baru**
1. Buat `js/characters/nama.js` yang mengisi `BF.CHARACTER_ROSTER.nama`, `BF.COSTUME_DRAWERS.nama`, dst (ikuti file yang sudah ada), lalu tambah `<script>` sebelum `game.js`.
2. Isi `BF.SERIES.nama`, `BF.RARITY.nama` (`starter|rare|epic|legend`), dan `BF.FORMS.nama` di `js/forms.js`.
3. Tambah wajah di `BF.FACE_DRAWERS.nama` (`js/faces.js`). Kalau tidak ada, dipakai wajah smiley generik.
4. Kalau fighter ini dibuka lewat gacha, tambahkan ke array `FIGHTERS` di `js/gacha.js` (`{id, rarity, w}`) dan sesuaikan teks rate di `index.html` (`.rates`). Starter default ada di `DEFAULT_UNLOCKED_FIGHTERS` di `js/shop.js`.
5. Chip filter faksi di `#roster-filter-chips` memakai bagian pertama `role` (sebelum tanda bullet), huruf kecil.

**Form baru untuk preview**: tambah objek di `BF.FORMS[id]`: `{ id, label, desc, ult?, apeMode?, gear4Mode? }`. Flag disalin ke bola preview di `drawFighter` (`game.js`). Canvas detail memakai ruang logis 160px yang di-scale.

**Suara skill baru**: tambah resep di objek `R` (skill) atau `ULT` (ult) di `js/sfx.js`, lalu daftarkan regex label di array `MATCH`. `playSkill(label)` dipanggil otomatis dari `spawnDamageText` saat ada `customLabel`, dan `playUlt(ball.ult)` dari `activateUltimate`. Label berisi `WARUDO`, `TIME`, `KNIFE` sengaja dilewati karena sudah punya suara sendiri di `sound.js`. Ada throttle 0.35 detik per jenis suara.

### Gacha (`js/gacha.js`)
- Biaya: x1 = 160 koin, x10 = 1.500 koin, gem pull = 50 gem. Konstanta `COSTS`.
- Pity: setelah 10 pull tanpa fighter, pull berikutnya menjamin fighter yang masih terkunci (`PITY`).
- Duplikat fighter memberi 30 gem (`DUPE_GEMS`).
- Bobot (total 100): Gojo 4 + Sukuna 3 (legend), Guts 10 (epic), DIO 8 (epic), Jotaro 14 (rare), 400 koin 10 (rare), 150 koin 25, 25 gem 26 (common). Kalau bobot diubah, update teks `.rates` di HTML.
- Alur: `pull()` memotong saldo -> `rollOne()` per pull -> `sequence()` memutar animasi (kapsul -> buka -> kartu) -> ringkasan. Tombol SKIP melewati animasi tapi hasil tetap diterapkan.
- Hook dari `game.js` (`BF.Gacha.init({...})`): `sound`, `wallet`, `save`, `isUnlocked`, `drawAvatar`, `say` (kata-kata Turbo Granny), `onChange` (refresh semua UI setelah unlock).
- Elemen HTML yang dibutuhkan: `#btn-pull-1`, `#btn-pull-10`, `#btn-pull-gem`, `#banner-feat`, `#gacha-pity-fill`, `#gacha-pity-text`, `#shop-items-grid`, `#collection-count`, `#gacha-overlay`.

### Wajah karakter (`js/faces.js`)
- `BF.FACE_DRAWERS[costume](ball, r, c, state)` dipanggil dari `drawBall` hanya saat bola tidak sedang `hurt` dan bukan kondisi `hasFullFaceMask` (Gojo selalu pakai blindfold, Guts/Ichigo saat ult memakai topeng/armor, Goku saat `apeMode`).
- `state` = `{ ex, ey, ult, cast }`. `ex/ey` offset pupil mengikuti arah gerak, `cast` true saat `ball.cast` aktif (charge-up).
- Wajah hurt (mata `> <`) tetap generik untuk semua karakter.

### Penyimpanan (localStorage)
| Key | Isi |
|---|---|
| `anime_ball_wallet_v3` | koin, gem, daftar fighter terbuka |
| `bf_profile_v1` | statistik profile: `matches`, `wins`, `charsUsed` |
| `bf_gacha_v1` | `pity`, `total` pull |

Saldo awal pemain baru: 2000 koin, 100 gem. Tiap ronde selesai memberi +100 koin.

### Catatan teknis perubahan di `game.js`
- `drawBall`: percabangan wajah ke `BF.FACE_DRAWERS`.
- `spawnSparks` sekarang juga memunculkan `spawnImpactBurst` (bintang komik). `render` menggambar afterimage untuk bola dengan kecepatan > 430, `ultTimer > 0`, atau `rocketTimer > 0`.
- `drawFighter` (preview): parameter terakhir bisa boolean (lama) atau objek form (baru).
- `updateShopUI` kini hanya memperbarui saldo dan memanggil `BF.Gacha.refresh()`.
- `updateProfileUI` menyimpan dan membaca `sessionStats` dari localStorage. Tidak ada lagi angka dasar palsu.
- Klik tombol/kartu memicu `sound.playUi()` lewat satu listener dokumen.

### Status verifikasi dan hal yang belum dilakukan
- Sudah dites dengan DOM palsu (tanpa browser): inisialisasi, 1500 frame battle, 8 kartu roster, sheet detail, gacha x10, dan semua resep suara jalan tanpa error.
- **Belum dilihat di browser sungguhan**: tampilan visual, tata letak di HP, dan kualitas suara belum diperiksa mata/telinga. Cek layar 360px dan desktop.
- Kode lama yang sekarang tidak dipakai (boleh dibersihkan): `SHOP_CATALOG` di `shop.js`, `openShopInspectModal`, `renderShopModalPreview`, variabel `activeShopFilter` di `game.js`, label emoji di `BF.TRANSFORM_DETAILS.*.label`.
- Desain kostum (bukan wajah) tiap karakter belum dirombak total, baru wajahnya.
- Story Saga di layar Play masih placeholder terkunci.

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

