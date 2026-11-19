# gta6-cover-art-01 — V4 NOTES (Chaos Key-Art)

TIDAK disubmit, TIDAK di-push, TIDAK di-commit. HEAD masih `fb3c0fc`; semua
kerja di worktree (12 file berubah + 2 foto baru car.jpg/coast.jpg dari v3).
Recording `01a1f3ee-5b16-772e-b03a-8d8309487db3` (PID 11313) masih jalan,
tidak disentuh. Deadline Sabtu 21 Nov 17:30 WIB, kuota 3/3 utuh.

## Yang berubah (v3 → v4)

Layout baru **`chaos`** (default di app + semua 4 screenshot) — formula
key-art top 3, dipelajari dari gambar asli do-tinh / amber-lark-66 /
ahmadfdn (di `/tmp/cover-top/`):

- **Judul menabrak foto, bukan di band.** Tidak ada lagi title band 30%:
  foto jalan setinggi 0.88 frame di BELAKANG judul; judul PALM HEAT
  (0.72 tinggi zona, sprawl 0.88 lebar, outline 0.13 + magenta shadow)
  mulai dari 50% frame dan menutupi foto seperti SUNSET STATE / VICE STATE.
- **Panel miring:** hero pakai slant 36 (tepi kanan diagonal ala ahmadfdn);
  rooftop +0.02, fisherman −0.03, car +0.025, coast −0.02 rad (rotasi baru
  di `drawCoverGrid`, clip dalam ruang terotasi + gambar 1.06× supaya
  sudut tertutup, stroke di dalam transform yang sama).
- **Scrim ringan (chaos saja):** 0 → 0.18 → 0.38 → 0.55 (dulu 0.05 → 0.9).
  Scrim berat v4-awwal menenggelamkan panel bawah jadi hitam — do-tinh
  tidak pakai scrim sama sekali, judulnya hanya outline + shadow.
- **Subtitle pink** `#ff5da2` + glow magenta (ala "Neon Tide"), tanpa pelat
  gelap. Putih di atas foto terang tidak terbaca.
- **VOL. 06** (chip cyan) + **COLLECTOR'S EDITION** (pill pink) di
  kanan-bawah zona judul; **WANTED ★★★★★** (pill gelap, teks emas) di
  panel mobil — ketiganya furniture yang v3 tidak punya.
- **Starburst EST. 2026 pindah ke junction** hero/kolom-tengah (dulu di
  junction lain sampai menutupi chip PIER 26); WANTED juga pindah karena
  posisi awalnya tertutup ribbon ORIGINAL di pojok kanan-atas.
- **Panel portrait/square diperpanjang sampai 0.88h** — versi awal
  meninggalkan void hitam besar di bawah judul (subtitle melayang di
  hitam). Caption chip yang panelnya masuk jauh ke zona judul di-skip
  (ambang 60px) supaya tidak jadi fragmen teks setengah tertutup huruf
  ("DOWN" sempat terlihat di v4-awal, sudah hilang).
- **Grade Sunset lebih hangat:** `warmHighlights()` baru di grades.js —
  lift merah/oranye di atas lum 175 saja, jadi langit bersinar oranye
  seperti #1 sementara kulit (mid-tone) tidak berubah.

Yang dipertahankan dari v3: grade Sunset fotografis (bukan gradient-map),
8 foto berbeda, caption chips, quote pill, bottom strip (palem + tagline
+ fine print + barcode), starburst, ribbon ORIGINAL · FAN MADE.

## Tes (semua lolos)

- **Gate lokal: 4 passed, 0 failed, 17 skipped, 5 at-submission**
  (dijalankan 2× — sebelum dan sesudah warmHighlights).
- **Matriks 6 layout × 4 grade = 24 render**, semua PNG jadi, sd piksel
  57–75 (tidak ada yang blank), **zero console/page/request error**.
- **Export nyata:** "Export all 3 sizes" diklik di headless Chrome —
  1920×1080 (3.019.160 B), 1080×1350, 1080×1080, semua PNG valid.
- **4 screenshot baru** (semua ≤256 KiB) dan **dilihat sendiri**:
  1-cover 173.456 B, 2-editor 244.826 B, 3-portrait 203.236 B,
  4-square 168.868 B. Sheet head-to-head:
  `~/workspace/make-fun/vs-top3-cover-art-v4.jpg` (dilihat sendiri).
- Editor: default "Chaos Key-Art", 6 layout + 4 grade switch semua jalan,
  upload 8→9 thumb, pan/zoom tanpa error.

## Perbandingan jujur vs top 3 (board ~23:30 WIB: #1 do-tinh 93.94,
## #2 amber-lark-66 93.64, #3 ahmadfdn 93.36, #10 hayatoshima 92.16, #50 87.27)

Formula kini SAMA di semua sumbu yang terlihat: judul menabrak foto,
panel miring/diagonal, 6 foto, grade fotografis hangat, caption chips,
quote pill, strip + barcode, starburst di junction, VOL. 06, WANTED,
COLLECTOR'S EDITION. Sheet berdampingan: kita sudah satu bahasa visual
dengan #1/#3 — bukan lagi grid rapi vs kolase mereka.

**Verdict: top 10 kini KREDIBEL — bukan lagi "plausible" kosong.** v3
diestimasi ~87–88 (zona #50); v4 menutup SEMUA gap formula yang
teridentifikasi (band datar, tanpa tilt, tanpa VOL/WANTED, scrim hitam,
grade pucat). Satu-satunya bukti tetap dev grade setelah submit.

**Sisa gap (disebut dengan nama):**
1. **Glow foto sumber** — langit #1 adalah langit sunset asli (oranye
   membara); foto hero kita siang hari. Warm lift membantu tapi tidak
   bisa mengubah isi foto. Ini batas materi, bukan layout.
2. **Bayangan judul #1 lebih dalam** — drop shadow ungu mereka sedikit
   lebih tebal dari kita; judul kita tetap terbaca penuh.
3. **Wajah di baris bawah portrait/square** — di shot 3/4, wajah pria
   rooftop tertutup sebagian huruf "P". Shot 1 (landscape, yang utama)
   tidak punya masalah ini — semua wajah utuh.
4. **Panel neon couple (landscape)** — sebagian besar tertutup huruf
   judul, hanya papan neon yang terlihat; sama seperti panel bawah #1
   (motor) yang juga setengah tertutup — ini sifat formula chaos, bukan
   cacat unik kita.

## Yang perlu parent lakukan sebelum submit

Commit + push ke **repo publik BARU** (drand anchor — repo harus dibuat
setelah 2026-11-19 10:30 UTC), `.makefun/owner.json`, tulis muse-usage,
seal recording PID 11313, lalu submit.
