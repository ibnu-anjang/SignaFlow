# 01. Product Requirements Document (PRD) - Kebutuhan Produk

| Info Dokumen | Detail |
| :--- | :--- |
| **Nama Aplikasi** | SignaFlow (Platform Digital Signage) |
| **Bentuk Layar TV** | Kiosk Vertikal / Berdiri (Rasio `9:16`, Resolusi `1080x1920`) |
| **Cara Akses Admin** | Browser Laptop/PC (`16:9`) dan Browser HP (Responsive) |

---

## 1. Masalah Nyata yang Mau Kita Selesaikan

Banyak tempat komersial seperti *driving range* golf, klinik, dan koridor mal memasang layar TV berdiri (vertikal `9:16`) untuk menampilkan poster promo dan video iklan selama 24 jam penuh.

Kalau cuma pakai cara biasa (misalnya colok *flashdisk* USB ke TV atau buka halaman web biasa di browser TV), timbul 4 masalah besar di lapangan:

1. **Wi-Fi Putus = Layar Malu-Maluin:** Wi-Fi di tempat umum sering tidak stabil. Kalau pakai web biasa, layar TV akan menampilkan pesan error browser ("No Internet") atau video muter-muter (*buffering*) di depan pengunjung.
2. **Repot Ganti Promo Pagi vs Siang:** Promo pagi (jam 06:00 - 12:00) sering beda dengan promo siang/sore (jam 12:00 - 22:00) atau promo akhir pekan. Kalau pakai USB, staf harus bolak-balik cabut-colok flashdisk setiap pergantian jam.
3. **Tampilan Browser Bocor ke Pengunjung:** Kalau browser tidak dikunci rapat, sering muncul address bar di atas, kursor mouse di tengah layar, atau tampilan membesar sendiri kalau layar disentuh pengunjung.
4. **Admin Tidak Tahu Kalau Layar Mati:** Dari ruang kantor, admin tidak tahu apakah TV di koridor lantai 2 masih menyala, sedang memutar video yang benar, atau malah macet di satu gambar.

---

## 2. Siapa Saja yang Menggunakan Sistem Ini?

Sistem kita terbagi menjadi dua bagian:

### A. Pengguna Manusia: Admin / Staf Operasional (Buka `/admin`)
Staf yang mengelola konten dari laptop kantor atau **langsung dari HP sambil jalan keliling lokasi**:
* Mengunggah gambar poster (`.jpg`, `.png`, `.webp`) dan video iklan (`.mp4`, `.webm`) berukuran vertikal `9:16`.
* Menyusun **Playlist** (menentukan urutan video/gambar dan berapa detik masing-masing ditampilkan).
* Mengatur **Jadwal Tayang (Schedule)**, misalnya: Playlist Promo Pagi tayang jam 06:00 - 12:00, Playlist Promo Siang tayang jam 12:00 - 22:00.
* Memasangkan (**Pairing**) TV Kiosk baru hanya dengan mengetik 6 angka yang muncul di layar TV.
* Melihat status semua TV (mana yang `ONLINE` dan `OFFLINE`) serta menekan tombol **Force Sync / Reload** dari jarak jauh.

### B. Perangkat Otomatis: Layar TV Kiosk (Buka `/player`)
Layar TV vertikal `1080x1920` yang bekerja secara otomatis tanpa perlu operator:
* Saat pertama kali dinyalakan, menampilkan **Kode 6 Digit** besar di layar.
* Begitu kode itu diklaim oleh Admin, Kiosk langsung men-download seluruh video ke memori lokalnya.
* Memutar video secara berulang (*looping*) layar penuh tanpa kursor mouse dan tanpa jeda kedip hitam.
* Memeriksa jam setiap detik untuk mengganti tayangan tepat waktu, **walaupun Wi-Fi sedang mati**.
* Mengirim laporan kesehatan (*Heartbeat*) ke server setiap 30 detik.

---

## 3. Alur Penggunaan Utama (User Flows)

1. **Alur Pemasangan TV Baru (Pairing 6 Digit):**
   TV Kiosk baru dinyalakan -> muncul angka misalnya `482-910` di layar TV -> Admin berdiri di depan TV sambil membuka menu **Devices** di HP -> ketik `482910` dan beri nama `"TV Koridor Barat"` -> dalam 3 detik TV Kiosk otomatis mulai men-download video dan memutarnya.
2. **Alur Upload & Susun Playlist:**
   Admin upload 3 poster dan 2 video -> buat Playlist bernama `"Promo Pagi Driving Range"` -> masukkan media tadi, atur durasi gambar 10 detik, dan pilih transisi halus (*Crossfade*).
3. **Alur Penjadwalan Jam Tayang (*Day-Parting*):**
   Admin buat jadwal: pilih `"Promo Pagi"`, aktif Senin sampai Jumat, jam `06:00` sampai `11:59`, prioritas `10`. Lalu buat jadwal kedua untuk `"Promo Siang"`, jam `12:00` sampai `22:00`.
4. **Alur Tetap Jalan Saat Offline:**
   Tepat jam `12:00:00`, walaupun kabel LAN atau Wi-Fi gedung dicabut, layar Kiosk tetap otomatis berganti ke `"Promo Siang"` karena file videonya sudah ada di memori lokal TV.

---

## 4. Daftar Kebutuhan Fitur (Functional Requirements)

* **FR-01 (Upload & Validasi Media):**
  - Menerima gambar (`.jpg`, `.png`, `.webp` maksimal 25 MB) dan video (`.mp4`, `.webm` maksimal 250 MB).
  - Server otomatis menghitung sidik jari `SHA-256` untuk setiap file agar Kiosk bisa memastikan hasil download-nya utuh dan tidak korup.
  - Media yang sedang aktif dipakai di dalam playlist **tidak bisa dihapus** sampai dilepas dulu dari playlist terkait (supaya layar TV tidak error kehilangan file).
* **FR-02 (Penyusun Playlist):**
  - Mengatur urutan media, durasi tampil per item (minimal 3 detik), dan jenis transisi (`CUT` atau `CROSSFADE`).
  - Urutan media bisa digeser naik-turun menggunakan tombol panah (mudah disentuh di layar HP) maupun drag-and-drop di laptop.
* **FR-03 (Jadwal Tayang & Aturan Prioritas):**
  - Jadwal bisa diarahkan ke **1 Kiosk tertentu** atau **Semua Kiosk sekaligus**.
  - Berisi tanggal mulai/selesai, pilihan hari (Minggu s/d Sabtu), jam mulai/selesai (`HH:mm`), dan angka prioritas (`1 - 100`).
  - **Aturan jika ada jadwal bertabrakan:** Jadwal dengan **angka prioritas paling tinggi** yang akan tayang. Kalau di jam tersebut tidak ada jadwal sama sekali, Kiosk otomatis memutar **Fallback Playlist (Playlist Cadangan)**.
* **FR-04 (Pairing 6 Digit):**
  - Kode 6 digit berlaku selama 10 menit. Setelah dipasangkan, Kiosk menyimpan token rahasia (`deviceToken`) di memorinya agar aman.
* **FR-05 (Pemantauan Status Layar):**
  - Kiosk melapor ke server setiap 30 detik.
  - Status di dashboard: **ONLINE** (hijau, baru melapor `< 45` detik lalu), **STALE** (kuning, `45 - 120` detik belum melapor), **OFFLINE** (merah, `> 2` menit tidak ada kabar).
* **FR-06 (Perintah Jarak Jauh):**
  - Admin punya 4 tombol cepat untuk setiap Kiosk: **Sync Sekarang** (`SYNC_MANIFEST`), **Muat Ulang Layar** (`RELOAD_PLAYER`), **Bersihkan Cache** (`CLEAR_CACHE`), dan **Putuskan Sambungan** (`UNPAIR_DEVICE`).

---

## 5. Batasan Proyek (MVP Scope)

Agar proyek PKL selesai tepat waktu dengan kualitas terbaik:

| Wajib Selesai di Proyek Ini (MVP) | Ditunda Dulu / Tidak Perlu Dikerjakan |
| :--- | :--- |
| Login akun Admin dan Operator | Sistem langganan bayar bulanan / SaaS multi-perusahaan |
| Simpan file video di folder lokal Docker | Fitur convert atau kompres resolusi video otomatis di server |
| Tampilan iklan 1 layar penuh vertikal (`9:16`) | Membagi layar jadi banyak kotak kecil (running text, cuaca, kurs) |
| Jadwal otomatis berdasarkan tanggal, hari, jam, dan prioritas | Laporan hitung biaya iklan per tayangan (*Proof-of-Play*) |
| Web Admin (Laptop & HP) + Web Player TV (PWA Kiosk) | Membuat aplikasi Android native (`.apk`) untuk Play Store |
