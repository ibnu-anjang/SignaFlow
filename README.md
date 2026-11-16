# SignaFlow: Platform Digital Signage untuk Layar Kiosk Vertikal (9:16)

Selamat datang di proyek **SignaFlow**! 

Aplikasi ini dibuat khusus untuk memutar video promosi dan poster di layar TV vertikal / *portrait* (**rasio 9:16, resolusi 1080x1920**) yang menyala **24 jam nonstop** di tempat umum, seperti *driving range* golf, klinik dokter, lobi hotel, dan koridor mal.

Fitur paling spesial dari SignaFlow adalah **Tetap Nyala Walau Wi-Fi Mati (Offline-First)**:
Kalau koneksi internet di lokasi tiba-tiba putus atau mati lampu, layar TV tidak akan menampilkan pesan error browser ("No Internet") atau muter-muter (*buffering*). Semua video dan jadwal jam tayang sudah otomatis disimpan di dalam memori TV, jadi iklan tetap jalan mulus dan tetap berganti tepat waktu (contoh: promo pagi otomatis ganti ke promo siang tepat jam 12:00).

---

## Kamus Istilah Gaul (Glosarium untuk Junior)

Sebelum membaca dokumen lainnya, yuk pahami dulu istilah-istilah yang sering dipakai di proyek ini:

* **Kiosk / Player (`/player`):** Halaman web layar penuh yang dibuka di TV untuk memutar video iklan tanpa henti. Tidak ada kursor mouse, tidak ada tombol browser, dan tidak bisa di-scroll.
* **Admin CMS (`/admin`):** Halaman dashboard tempat kita mengunggah video, menyusun urutan video (*playlist*), dan mengatur jadwal tayang. Halaman ini bisa dibuka dari laptop kantor maupun **langsung dari HP sambil jalan**.
* **Day-Parting (Bagi-Bagi Jam Tayang):** Mengatur tayangan berdasarkan jam atau hari. Misalnya: Jam 06:00 - 12:00 putar Promo Pagi, jam 12:00 - 22:00 putar Harga Normal, khusus Sabtu dan Minggu putar Promo Akhir Pekan.
* **Manifest:** Paket data kecil berformat JSON dari server yang berisi "daftar belanjaan" untuk TV: jadwal apa saja yang sedang aktif dan daftar file video apa saja yang harus di-download oleh TV.
* **Checksum SHA-256:** "Sidik jari unik" dari sebuah file video. Dipakai untuk memastikan video yang di-download TV benar-benar utuh 100% dan tidak rusak karena koneksi Wi-Fi yang jelek.
* **Double-Buffering (Dua Lapis Pemutar):** Trik memutar video menggunakan 2 slot bertumpuk (Slot A dan Slot B). Pas Slot A sedang memutar Video 1, Slot B diam-diam menyiapkan Video 2 di belakang layar. Pas Video 1 selesai, Slot B langsung muncul seketika tanpa ada kedipan layar hitam.
* **SSE (Server-Sent Events):** Jalur komunikasi kilat dari Server ke TV Kiosk. Begitu Admin klik tombol "Refresh Layar" di HP, TV Kiosk langsung merespons dalam hitungan detik.
* **Watchdog (Penjaga Otomatis):** Satpam otomatis di dalam aplikasi Kiosk. Kalau ada video yang macet lebih dari 5 detik, Watchdog akan otomatis melompati video itu ke video berikutnya supaya TV tidak bengong seharian.

---

## Daftar Dokumen Lengkap (`docs/`)

Seluruh dokumen teknis sudah dirapikan dengan bahasa yang santai, jelas, dan tetap berbobot profesional untuk bahan laporan PKL:

| No | Dokumen | Penjelasan Singkat |
| :- | :--- | :--- |
| **01** | [**PRD (Kebutuhan Produk)**](./docs/01-PRD.md) | Masalah apa yang mau diselesaikan, siapa saja penggunanya, dan daftar fitur yang wajib kita buat sampai selesai. |
| **02** | [**TRD & Arsitektur Sistem**](./docs/02-TRD-ARCHITECTURE.md) | Cara kerja sistem di balik layar: cara simpan video offline di browser, cara transisi tanpa kedip, dan cara menyamakan jam TV. |
| **03** | [**ADR (Alasan Memilih Teknologi)**](./docs/03-ADR.md) | Jawaban kalau ditanya dosen/penguji: *"Kenapa pakai Next.js? Kenapa pakai SSE? Kenapa pakai Caddy?"* Lengkap dengan alasannya. |
| **04** | [**ERD & Skema Database**](./docs/04-DATABASE-ERD.md) | Gambar susunan tabel database PostgreSQL dan skema Prisma yang sudah siap pakai. |
| **05** | [**Kontrak API & Realtime**](./docs/05-API-CONTRACT.md) | Janjian bentuk data kirim dan terima antara Backend (Dev A) dan Frontend (Dev B) supaya langsung klop. |
| **06** | [**Pembagian Tugas & Roadmap**](./docs/06-TEAM-WORKFLOW-ROADMAP.md) | Pembagian tugas antara **Dev A** dan **Dev B** supaya tidak bentrok di Git, lengkap dengan urutan pengerjaan Fase 1 sampai Fase 4. |
| **07** | [**Panduan Menjalankan & Operasional**](./docs/07-RUNBOOK-OPERATIONS.md) | Cara menyalakan Docker, cara buka dari HP, cara setting PC Linux Kiosk, dan cara backup data. |
| **08** | [**Skenario Pengujian (QA Plan)**](./docs/08-QA-TEST-PLAN.md) | Daftar skenario uji coba sebelum demo PKL (tes cabut Wi-Fi, tes pairing lewat HP, tes video macet). |

---

## Teknologi yang Kita Gunakan

* **Aplikasi Utama:** Next.js (App Router, TypeScript) + Node.js 20.
* **Database:** PostgreSQL 16 + Prisma ORM.
* **Penyimpanan Video & Gambar:** Folder lokal di Docker yang langsung disajikan oleh Caddy (biar streaming video enteng dan cepat).
* **Komunikasi Cepat:** Server-Sent Events (SSE) + laporan rutin (*Heartbeat*) setiap 30 detik.
* **Penyimpanan Offline di TV:** Service Worker + IndexedDB (simpan jadwal) + Cache Storage API (simpan file video besar).
* **Deploy & Server:** Docker Compose + Caddy Reverse Proxy (otomatis mengaktifkan HTTPS agar fitur offline browser diizinkan berjalan).
