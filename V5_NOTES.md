# gta6-cover-art-01 — V5 NOTES (ronde terakhir sebelum submit)

TIDAK disubmit, TIDAK di-push, TIDAK di-commit. HEAD masih `fb3c0fc`;
semua kerja di worktree. Recording `01a1f3ee-5b16-772e-b03a-8d8309487db3`
(PID 11313) masih jalan, tidak disentuh. Deadline Sabtu 21 Nov 17:30 WIB,
kuota 3/3 utuh. Bos menegaskan: SUBMIT TERAKHIR = FINAL — tidak ada
submit untuk mengukur; kerja harus benar dulu.

## Yang berubah (v4 → v5)

### 1. Foto hero sunset BARU — gap #1 v4 ditutup
`app/samples/sunset.jpg` (1920×1280, 538 KB), digenerate dari `woman.jpg`
sebagai referensi identitas: wanita yang SAMA (rambut keriting gelap,
kacamata hitam besar, anting hoop emas, kemeja putih) bersandar di
convertible pink, langit sunset oranye-magenta membara, matahari rendah
di horizon atas laut, palem siluet, boulevard pantai Miami. Dilihat
sendiri: fotografis, sinematik, subjek konsisten dengan v4.
- `SAMPLE_PHOTOS` +1 (index 8), caption baru `CORAL DRIVE · 7:42 PM ·
  GOLDEN HOUR`, hero layout chaos kini photo 8 (dulu photo 0 siang hari).
  Layout lain tidak disentuh (hero-vice tetap photo 0).

### 2. Bayangan judul diperdalam — gap #2 v4 ditutup
`cover.js` drawTitleBlock, mode hero/chaos: shadow alpha 0.55 → **0.8**,
blur size×0.10 → **×0.14**, offsetY size×0.06 → **×0.08**. Judul tetap
terbaca penuh. Di sheet berdampingan, kedalaman bayangan kita kini
satu kelas dengan #1 (bayangan #1 masih sedikit lebih ungu, tapi
beda ini di bawah ambang yang bisa dibedakan juri dari foto lain).

### 3. Wajah pria rooftop di portrait/square — gap #3 v4 ditutup
Analisis dulu (bukan tebak-tebakan): baris 3 panel di portrait/square
adalah P1 P2 P3; judul menabrak SELURUH baris, jadi wajah di kolom KIRI
selalu di belakang huruf "P" dan tidak bisa lolos lewat crop apa pun.
- **Reorder baris** (chaos assignments): P1 = mobil oranye (tanpa wajah),
  P2 = neon, P3 = rooftop. Landscape tidak berubah: P1 mid-top dan P3
  right-top keduanya di atas judul, jadi mobil/rooftop/fisherman tetap
  utuh di sana. Fisherman pindah ke P4 (right-mid); WANTED tetap di
  pojok kanan-atas P4 — tidak menutupi wajah (wajah di tengah-kiri panel).
- **Portrait: WAJAH TERLIHAT.** Crop per panel dicek lewat zoom 2×:
  mata/hidung/jenggot jelas, hanya mulut sedikit tersentuh huruf "A".
  Dulu seluruh wajah di belakang "P".
- **Square: crop TIDAK BISA membebaskan wajah** — dibuktikan, bukan
  diduga: wajah ada di atas foto, huruf menutupi atas panel, dan crop
  tidak bisa mendorong wajah ke bawah huruf pada zoom berapa pun
  (zoom 1.35 dicoba: hanya jenggot yang muncul di bawah huruf, mata
  tetap tersembunyi). Solusi: override per-rasio baru `sq` di
  `drawCoverGrid` (w === h) — P3 di square memakai foto coast road
  (tanpa wajah). Square kini bersih: hero sunset + mobil + neon +
  coast; tidak ada wajah tersembunyi. Portrait + landscape tidak
  tersentuh override ini.

Dipertahankan dari v4: layout chaos, panel miring, VOL.06, WANTED,
COLLECTOR'S EDITION, grade fotografis, 8 foto (+1 sunset = 9 sample),
quote pill, strip + barcode, starburst, ribbon.

## Tes (semua lolos, saya verifikasi sendiri)

- **Gate lokal: 4 passed, 0 failed**, 17 skipped, 5 at-submission
  (langkah submit, expected).
- **Matriks 6 layout × 4 grade = 24 render**, semua PNG jadi,
  sd piksel 43,8–64,4 (tidak ada yang blank), **zero console/page/
  request error**.
- **Export nyata:** tombol "Export all 3 sizes" diklik di headless
  Chrome via CDP — 3 blob PNG + 3 file terunduh, dimensi terverifikasi:
  1920×1080 (3.201.788 B), 1080×1350 (2.364.875 B), 1080×1080
  (1.884.023 B). Nol page error.
- **4 screenshot baru** (semua ≤256 KiB: 214.540 / 239.889 / 258.527 /
  213.430 B) dan **dilihat sendiri** semuanya. Sheet head-to-head:
  `~/workspace/make-fun/vs-top3-cover-art-v5.jpg` (dilihat sendiri).
- Editor: default "Chaos Key-Art", 9 thumb foto di strip, semua
  switch layout/grade jalan, tanpa error.
- Board dicek ulang: #1 do-tinh 93.9361, #2 amber-lark-66 93.6356,
  #3 ahmadfdn 93.362, #10 hayatoshima8810-sketch 92.1573, ranked 3.063
  — top 3 dan bar #10 tidak bergerak sejak 23:23 WIB.

## Perbandingan jujur vs top 3

Sheet berdampingan: kita kini satu bahasa visual penuh dengan #1/#3 —
hero sunset membara, judul menabrak foto, panel miring, 6 foto, grade
hangat, semua furniture (VOL.06, WANTED, COLLECTOR'S, quote pill,
strip, starburst di junction). Ketiga gap v4 yang bernama sudah
ditutup semua.

**Sisa gap — disebut dengan nama:**
1. **Pasangan neon di panel tengah (portrait/square)** — wajah mereka
   setengah tertutup huruf judul. Sama seperti panel motor #1 yang
   juga setengah tertutup — ini sifat formula chaos, bukan cacat
   unik kita.
2. **Bayangan judul #1 masih sedikit lebih ungu/dalam** — beda kini
   kecil; memperdalam lagi berisiko mengotori huruf.
3. **Subjek hero berbeda** — #1 wanita tank-top di pantai, kita wanita
   convertible; energi setara, bukan gap.

## Verdict jujur

**Top 10 kini KREDIBEL — semua gap yang bisa dinamai dan diperbaiki
sudah ditutup.** Paid place (top 50) sangat mungkin. Tapi top 10
tetap BELUM terbukti — satu-satunya bukti adalah dev grade setelah
submit, dan Bos sudah menegaskan submit terakhir = final (tidak ada
submit untuk mengukur). Rank 1 tidak bisa diklaim.

## Yang perlu parent lakukan sebelum submit

Commit + push ke **repo publik BARU** (drand anchor — repo harus dibuat
setelah 2026-11-19 10:30 UTC), `.makefun/owner.json`, tulis muse-usage,
seal recording PID 11313, lalu submit. Kuota bounty ini masih 3/3.
Deadline Sabtu 21 Nov 17:30 WIB.
