# 08. Rencana Pengujian Aplikasi (QA Test Plan)

Dokumen ini berisi **6 skenario uji coba** yang wajib kita praktikkan berdua sebelum mempresentasikan hasil karya kita di hadapan dosen pembimbing dan penguji PKL.

---

## 1. Daftar 6 Skenario Pengujian Wajib

### Skenario 1: Tes Pasangkan TV Baru Pakai HP (Pairing 6 Digit)
* **Apa yang Mau Dibuktikan?** Staf lapangan bisa mendaftarkan TV baru langsung di depan layar TV cukup menggunakan HP, tanpa perlu laptop.
* **Langkah Uji Coba:**
  1. Buka `https://localhost/player` di laptop atau TV (dalam kondisi belum terdaftar).
  2. Pastikan di layar muncul **Kode 6 Digit** yang besar (misalnya `482-910`) dan ada hitungan mundur 10 menit.
  3. Buka menu Admin di HP (`https://<IP-Laptop>/admin/devices`), login, lalu klik **Pasangkan Kiosk**.
  4. Ketik 6 angka tadi, beri nama `"TV Lobi Barat"`, lalu klik Simpan.
* **Hasil yang Diharapkan:**
  - Dalam waktu kurang dari 3 detik, layar TV otomatis berganti dari tampilan kode 6 digit ke tampilan download video dan langsung memutar iklan!

---

### Skenario 2: Tes Transisi Video Mulus Tanpa Kedip Hitam (*Zero-Flicker*)
* **Apa yang Mau Dibuktikan?** Pergantian antar video atau gambar berjalan mulus dan tidak membuat mata sakit karena layar hitam berkedip.
* **Langkah Uji Coba:**
  1. Buat playlist berisi 3 media: `Video A (10 detik)` -> `Poster B (5 detik)` -> `Video C (10 detik)`.
  2. Tonton layar Kiosk selama 2 sampai 3 putaran penuh.
* **Hasil yang Diharapkan:**
  - Saat Video A selesai dan berganti ke Poster B, tidak ada layar hitam yang berkedip sedetik pun. Gambar langsung muncul dengan halus.

---

### Skenario 3: Tes Cabut Wi-Fi & Ganti Jadwal Otomatis (*Offline Day-Parting*)
* **Apa yang Mau Dibuktikan?** Layar TV tetap memutar video dan tetap mengganti promo tepat jamnya walaupun internet mati total.
* **Langkah Uji Coba:**
  1. Buat Jadwal Pagi (misal jam `11:00` sampai `11:30` putar Playlist Pagi).
  2. Buat Jadwal Siang (misal jam `11:30` sampai `12:00` putar Playlist Siang).
  3. Tunggu sampai TV Kiosk selesai men-download semua video (persentase download 100%).
  4. **Matikan Wi-Fi laptop/HP** (atau aktifkan Mode Pesawat).
  5. Perhatikan apa yang terjadi saat jam di laptop menunjukkan tepat pukul `11:30:00`.
* **Hasil yang Diharapkan:**
  - Video tidak berhenti saat Wi-Fi dimatikan.
  - Tepat jam `11:30:00`, layar TV otomatis berganti memutar Playlist Siang meskipun dalam kondisi offline total!

---

### Skenario 4: Tes Refresh Layar Saat Kondisi Offline (Tahan Mati Lampu)
* **Apa yang Mau Dibuktikan?** Kalau lokasi mati lampu dan TV menyala kembali sebelum Wi-Fi sempat menyala, TV tetap bisa membuka web dan langsung memutar video.
* **Langkah Uji Coba:**
  1. Dalam kondisi Wi-Fi masih **mati** (lanjutan dari Skenario 3), tekan tombol `F5` atau `Ctrl + R` (Refresh browser).
* **Hasil yang Diharapkan:**
  - Browser **tidak** menampilkan gambar "Dino Chrome / No Internet".
  - Halaman `/player` tetap terbuka berkat *Service Worker*, membaca jadwal dari memori lokal, dan langsung memutar video normal.

---

### Skenario 5: Tes Download Terputus di Tengah Jalan
* **Apa yang Mau Dibuktikan?** Kalau Admin meng-upload video baru tapi koneksi Wi-Fi putus di tengah proses download, layar TV tidak akan rusak atau blank hitam.
* **Langkah Uji Coba:**
  1. Saat TV Kiosk sedang memutar Playlist A, tambahkan video baru yang cukup besar ke Playlist B.
  2. Saat TV Kiosk baru mulai men-download video baru tersebut (belum selesai 100%), cabut koneksi Wi-Fi.
* **Hasil yang Diharapkan:**
  - TV Kiosk tidak memaksakan diri memutar video yang belum selesai di-download. TV tetap memutar Playlist A dengan tenang.
  - Begitu Wi-Fi dinyalakan lagi, Kiosk melanjutkan sisa download-nya, dan baru beralih ke Playlist B setelah semua video utuh 100%.

---

### Skenario 6: Tes Satpam Otomatis Saat Video Macet (*Watchdog*)
* **Apa yang Mau Dibuktikan?** Kalau ada 1 file video yang rusak sehingga pemutar videonya macet, layar tidak akan membeku seharian.
* **Langkah Uji Coba:**
  1. Buat video yang sengaja di-pause atau rusak detiknya selama lebih dari 5 detik.
* **Hasil yang Diharapkan:**
  - Satpam otomatis (*Watchdog*) mendeteksi bahwa detik video tidak bergerak selama 5 detik, langsung melompati video tersebut ke video berikutnya, dan mencatat laporan error ke server.

---

## 2. Checklist Sebelum Sidang / Demo PKL

Pastikan semua centang di bawah ini sudah berstatus **LULUS**:

- [ ] Perintah `docker compose up -d --build` berhasil menyala tanpa error.
- [ ] Tampilan halaman `/admin` rapi dan mudah dipakai di layar laptop maupun layar HP.
- [ ] Halaman `/player` berbentuk vertikal 9:16, kursor mouse tersembunyi, dan klik kanan tidak berfungsi.
- [ ] Fitur hapus media tidak bisa menghapus file video yang masih dipakai di playlist.
- [ ] Uji coba putus Wi-Fi (Skenario 3 & 4) terbukti berhasil tanpa kendala.
