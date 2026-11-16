# 08. Rencana Pengujian Kualitas (QA & UAT Test Plan)

Dokumen ini berisi daftar skenario pengujian wajib (*Quality Assurance* & *User Acceptance Testing*) yang harus dijalankan oleh tim sebelum menyatakan proyek siap didemonstrasikan.

---

## 1. Matriks Skenario Pengujian Fungsional & Ketahanan

### Skenario 1: Uji Pairing 6 Digit Menggunakan HP di Lapangan
* **Tujuan:** Memastikan proses pendaftaran layar kiosk baru berjalan cepat melalui ponsel operator.
* **Langkah Uji:**
  1. Buka `https://<server>/player` pada layar target (dalam kondisi belum ter-*pair* / `localStorage` bersih).
  2. Pastikan layar menampilkan kode 6 digit berukuran besar beserta hitung mundur 10 menit.
  3. Buka `https://<server>/admin/devices` melalui *browser* HP, login sebagai Admin, lalu tekan **Pair Kiosk**.
  4. Masukkan 6 digit kode, beri nama `"Kiosk Uji Koridor 1"`, pilih *Fallback Playlist*, dan simpan.
* **Hasil yang Diharapkan:**
  - Dalam waktu `< 3` detik, layar `/player` otomatis keluar dari tampilan kode 6 digit, mulai mengunduh media *playlist*, dan langsung memutar konten tanpa perlu menekan tombol *refresh* di layar kiosk.

---

### Skenario 2: Uji Transisi *Double-Buffered Zero-Flicker*
* **Tujuan:** Memastikan perpindahan antar video dan gambar tidak menimbulkan kedipan layar hitam atau *spinner loading*.
* **Langkah Uji:**
  1. Buat sebuah *playlist* berisi 3 item: `Video A (10 detik)` -> `Gambar B (5 detik)` -> `Video C (10 detik)` dengan transisi `CROSSFADE`.
  2. Amati layar `/player` selama 3 putaran penuh (*loop*).
  3. Buka *Chrome DevTools Performance/Network tab*: pastikan saat putaran ke-2 dan ke-3 berjalan, **tidak ada** permintaan jaringan baru untuk mengambil file video/gambar (100% dibaca dari `Cache Storage` / Blob memori).
* **Hasil yang Diharapkan:**
  - Perpindahan dari Video A ke Gambar B dan ke Video C berjalan mulus tanpa layar hitam sedetik pun.

---

### Skenario 3: Uji Putus Wi-Fi Total (*Offline Resilience*) & Pergantian Jam Tayang (*Day-Parting*)
* **Tujuan:** Membuktikan layar tetap memutar media dan tetap mengganti jadwal tepat waktu walaupun internet/Wi-Fi mati.
* **Langkah Uji:**
  1. Buat **Jadwal Pagi** (misal jam `11:00` - `11:30`, memutar *Playlist A*) dan **Jadwal Siang** (jam `11:30` - `12:00`, memutar *Playlist B*).
  2. Pada pukul `11:25`, pastikan `syncProgress` perangkat di CMS sudah mencapai `100%`.
  3. **Matikan Wi-Fi pada perangkat Kiosk** (atau aktifkan *Airplane Mode* jika diuji di HP, atau matikan *container* `app` dengan `docker compose stop app`).
  4. Tunggu hingga jam menunjukkan tepat pukul `11:30:00`.
* **Hasil yang Diharapkan:**
  - Pemutaran tidak berhenti saat Wi-Fi dimatikan.
  - Tepat pukul `11:30:00`, layar kiosk otomatis beralih dari *Playlist A* ke *Playlist B* meskipun tidak ada koneksi jaringan sama sekali.

---

### Skenario 4: Uji *Cold Reboot* / *Hard Refresh* dalam Kondisi Offline
* **Tujuan:** Membuktikan *Service Worker* mampu menghidupkan kembali aplikasi pemutar saat perangkat mati lampu dan menyala kembali sebelum router Wi-Fi pulih.
* **Langkah Uji:**
  1. Dalam kondisi Wi-Fi perangkat Kiosk masih **mati** (kelanjutan dari Skenario 3), tekan `Ctrl + R` (*Refresh*) atau tutup dan buka kembali *browser* ke alamat `https://<server>/player`.
* **Hasil yang Diharapkan:**
  - *Browser* **tidak** menampilkan layar "No Internet / Dino Chrome".
  - *Service Worker* menyajikan *App Shell* `/player` dari *cache* lokal, memuat *manifest* terakhir dari `IndexedDB`, mengambil video dari `Cache Storage`, dan melanjutkan pemutaran jadwal aktif secara normal.

---

### Skenario 5: Uji *Atomic Cutover* pada Unduhan yang Terputus di Tengah Jalan
* **Tujuan:** Memastikan pembaruan jadwal yang gagal diunduh sebagian tidak merusak tayangan yang sedang berjalan.
* **Langkah Uji:**
  1. Saat kiosk sedang memutar *Playlist A*, unggah video baru berukuran besar (misal 100 MB) ke *Playlist C* dan tugaskan ke kiosk.
  2. Saat indikator unduhan di kiosk baru berjalan setengah (belum 100%), cabut koneksi jaringan.
* **Hasil yang Diharapkan:**
  - Kiosk tetap memutar *Playlist A* tanpa gangguan.
  - Saat koneksi jaringan disambungkan kembali, kiosk melanjutkan pengunduhan file yang kurang dan baru beralih ke *Playlist C* setelah verifikasi `SHA-256` mencapai 100%.

---

### Skenario 6: Uji *Watchdog* Pemulihan Mandiri Saat Media Rusak/Macet
* **Tujuan:** Memastikan satu file video yang korup pada *decoder* tidak membuat layar kiosk membeku selamanya.
* **Langkah Uji:**
  1. Simulasikan kegagalan dekode video atau jeda paksa pada elemen `<video>` aktif di dalam pemutar.
  2. Tunggu selama 5 detik.
* **Hasil yang Diharapkan:**
  - *Tier-1 Watchdog* mendeteksi bahwa `currentTime` video tidak bergerak selama 5 detik, otomatis melompat ke item *playlist* berikutnya, dan mengirimkan log bertipe `PLAYBACK_ERROR` ke CMS.

---

## 2. Daftar Cek Kelayakan Rilis (*Release Gate Checklist*)

Sebelum melakukan *merge* akhir ke branch `main` untuk penilaian PKL, pastikan seluruh poin berikut bernilai **LULUS**:

- [ ] `docker compose up -d --build` berjalan dari kondisi kosong tanpa *error*.
- [ ] Seluruh halaman Admin CMS (`/admin/*`) bebas dari *horizontal overflow* saat dibuka di layar HP (`375x812`).
- [ ] Kanvas `/player` terkunci rapat pada proporsi `9:16` (`1080x1920`), kursor *mouse* tersembunyi, dan klik kanan tidak berfungsi.
- [ ] Proteksi penghapusan media aktif: mencoba menghapus media yang ada di *playlist* mengembalikan pesan peringatan yang jelas.
- [ ] Penggunaan memori (RAM) tab `/player` diuji selama minimal 1 jam pemutaran berulang dan terbukti tidak mengalami kenaikan terus-menerus (*zero memory leak*).
