# 06. Pembagian Tugas & Rencana Eksekusi (Roadmap)

Dokumen ini adalah **peta jalan kerja kita berdua** dari awal sampai siap dinilai oleh dosen/pembimbing PKL.

---

## 1. Pembagian Tugas Bersih (Biar Gak Bingung Siapa Ngerjain Apa)

### Developer A (Spesialis Backend, Database & Docker)
* **Tanggung Jawab:**
  - Membuat dan menjalankan database PostgreSQL lewat Prisma ORM.
  - Membuat logika simpan file video ke folder server dan menghitung hash SHA-256.
  - Menyiapkan semua endpoint API (`/api/v1/...`).
  - Menyiapkan jalur komunikasi kilat Server-Sent Events (SSE) dan penerima Heartbeat.
  - Membungkus seluruh aplikasi ke dalam Docker Compose dan Caddy HTTPS.

### Developer B (Spesialis Frontend Admin & Pemutar Kiosk 9:16)
* **Tanggung Jawab:**
  - Membuat halaman web Admin (Dashboard, Upload Media, Playlist Builder, Schedule Picker, dan Device Manager) yang nyaman dibuka di laptop maupun **layar HP**.
  - Membuat halaman pemutar TV vertikal `/player` (posisi 9:16, kursor disembunyikan, transisi tanpa kedip hitam).
  - Mengatur Service Worker, IndexedDB, dan Cache Storage di browser Kiosk agar video tetap berputar saat internet mati.
  - Membuat Satpam Otomatis (*Watchdog*) agar video macet bisa otomatis dilewati.

---

## 2. Rencana Kerja Bertahap (Fase 1 s/d Fase 4)

### Fase 1: Fondasi Proyek, Database, Auth & Docker
* **Target:** Aplikasi Next.js bisa jalan di Docker dengan HTTPS, database PostgreSQL terhubung, Admin bisa login, dan layar Kiosk 9:16 sudah terkunci rapi.
* **Tugas Dev A:**
  - [ ] Setup Next.js, pasang Prisma ORM, dan jalankan migrasi tabel database.
  - [ ] Buat file `prisma/seed.ts` (otomatis membuat akun admin pertama: `admin@signaflow.local`).
  - [ ] Siapkan `Dockerfile`, `docker-compose.yml`, dan `docker/Caddyfile` (HTTPS otomatis).
  - [ ] Buat API Login & Logout Admin (`/api/v1/auth/login`, `/logout`, `/me`).
* **Tugas Dev B:**
  - [ ] Buat helper pemanggil API (`src/lib/api-client.ts`).
  - [ ] Buat halaman Login Admin (`/login`) dan kerangka dashboard `/admin` (ramah HP & Laptop).
  - [ ] Buat panggung pemutar `/player` dengan bentuk vertikal 9:16 (`1080x1920`) dan kursor disembunyikan.
* **Tanda Fase 1 Selesai:** Saat kita ketik `docker compose up --build`, web bisa dibuka lewat HTTPS di browser laptop maupun HP, admin bisa login, dan halaman `/player` muncul rapi.

---

### Fase 2: Upload Video, Susun Playlist & Pairing 6 Digit
* **Target:** Admin bisa upload video poster, menyusun urutan playlist, dan memasangkan TV Kiosk baru pakai kode 6 digit.
* **Tugas Dev A:**
  - [ ] Buat fungsi simpan file video, cek tipe file, dan hitung hash SHA-256.
  - [ ] Buat API CRUD Media (`/api/v1/media`) dan Playlist (`/api/v1/playlists`).
  - [ ] Buat API Pairing 6 digit (`/api/v1/device/pair/request`, `/status`, `/pair`).
* **Tugas Dev B:**
  - [ ] Buat halaman **Media Library** (bisa drag-and-drop upload, ada preview video).
  - [ ] Buat halaman **Playlist Builder** (bisa geser urutan video pakai tombol naik/turun yang mudah ditekan di HP).
  - [ ] Buat tampilan layar Kiosk yang memunculkan **Kode 6 Digit** besar, dan modal input kode di dashboard Admin.
* **Tanda Fase 2 Selesai:** TV Kiosk memunculkan kode 6 digit -> kita ketik kodenya lewat HP di menu Admin -> TV Kiosk langsung terdaftar dan siap memutar video.

---

### Fase 3: Fitur Offline, Jadwal Jam Tayang & Transisi Mulus
* **Target:** TV Kiosk bisa memutar video tanpa jeda kedip hitam dan tetap mengganti jadwal tepat waktu walau Wi-Fi dicabut.
* **Tugas Dev A:**
  - [ ] Buat penyusun data Manifest (`GET /api/v1/device/manifest`).
  - [ ] Buat API Pengatur Jadwal (`/api/v1/schedules`).
  - [ ] Buat jalur SSE (`/api/v1/device/stream`) dan pencatat Heartbeat (`/api/v1/device/heartbeat`).
* **Tugas Dev B:**
  - [ ] Buat Service Worker (`public/sw.js`) dan fungsi simpan video di Cache Storage + IndexedDB.
  - [ ] Buat Pemutar 2 Lapis (Slot A & Slot B) agar ganti video mulus tanpa kedip hitam.
  - [ ] Buat pengecek jam otomatis di Kiosk (dengan koreksi selisih jam server).
  - [ ] Buat halaman **Atur Jadwal** di Admin (pilih jam tayang pagi, siang, dan hari).
* **Tanda Fase 3 Selesai:** Saat kabel Wi-Fi dicabut atau HP dimasukkan ke Mode Pesawat, video tetap berputar mulus dan jadwal promo tetap berganti tepat jamnya!

---

### Fase 4: Satpam Anti-Macet (Watchdog), Monitoring & Persiapan Demo
* **Target:** Sistem siap diuji coba 24 jam nonstop dan siap didemokan di depan dosen/penguji.
* **Tugas Dev A:**
  - [ ] Buat API penyimpan log aktivitas Kiosk (`/api/v1/device/logs`).
  - [ ] Buat penghitung status TV (kapan TV hijau/ONLINE, kuning/STALE, merah/OFFLINE).
  - [ ] Siapkan skrip otomatis untuk menyalakan Kiosk di komputer Linux (`scripts/launch-kiosk.sh`).
* **Tugas Dev B:**
  - [ ] Buat Satpam Otomatis (*Watchdog*): kalau ada video macet 5 detik, otomatis lompat ke video berikutnya.
  - [ ] Buat menu rahasia di Kiosk (ketuk pojok kiri atas 5x untuk melihat info jaringan).
  - [ ] Buat Dashboard Monitoring di Admin (lihat kartu TV yang sedang aktif, tombol **Force Sync**, dan tombol **Reload Layar**).
* **Tanda Fase 4 Selesai:** Semua skenario pengujian di dokumen [`08-QA-TEST-PLAN.md`](./08-QA-TEST-PLAN.md) berhasil lulus 100%!
