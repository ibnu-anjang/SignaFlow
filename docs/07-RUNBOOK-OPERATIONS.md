# 07. Panduan Menjalankan & Operasional (Runbook)

Dokumen ini adalah **buku panduan praktis** cara menyalakan aplikasi, membuka dari HP, mengatur TV Kiosk, dan mengatasi masalah kalau ada yang error saat dicoba.

---

## 1. Menyiapkan File Konfigurasi (`.env`)

Sebelum menyalakan sistem, buat file `.env` dengan menyalin file contoh:
```bash
cp .env.example .env
```

Isi default di dalam `.env` sudah aman untuk dicoba di laptop. Kamu tidak perlu mengubah apa-apa kecuali ingin mengganti password database.

---

## 2. Cara Menyalakan Sistem Menggunakan Docker

Pastikan aplikasi Docker Desktop (atau Docker Engine di Linux) sudah menyala di laptopmu, lalu buka terminal dan jalankan:

```bash
# Nyalakan semua container (Database, Next.js, dan Caddy HTTPS)
docker compose up -d --build
```

Tunggu beberapa menit saat Docker pertama kali men-download dan merakit aplikasi. Setelah selesai, cek statusnya:
```bash
docker compose ps
```
Kalau ketiga container (`signaflow-db`, `signaflow-app`, `signaflow-proxy`) berstatus **Up / Healthy**, berarti sistem sudah berjalan normal!

### Cara Membuka di Browser Laptop:
* **Halaman Admin CMS:** Buka `https://localhost/admin`
* **Halaman Layar Kiosk:** Buka `https://localhost/player`

### Akun Admin Default:
* **Email:** `admin@signaflow.local`
* **Password:** `AdminSignaFlow2026!`

---

## 3. Cara Membuka dari HP (Untuk Admin Keliling atau Demo Kiosk)

Kamu bisa membuka dashboard Admin atau menjadikan layar HP-mu sebagai layar simulasi TV Kiosk:

1. **Pastikan Laptop dan HP Terhubung ke Wi-Fi yang Sama** (atau Hotspot HP yang sama).
2. **Cari Tahu Alamat IP Laptopmu:**
   - Di Linux: buka terminal, ketik `hostname -I` (contoh: `192.168.1.50`).
   - Di Windows: buka CMD, ketik `ipconfig`.
3. **Buka Browser di HP:**
   - Buka alamat: `https://192.168.1.50/admin` (ganti dengan IP laptopmu).
   - Kalau muncul peringatan keamanan browser ("Your connection is not private"), klik **Advanced / Lanjutan** lalu pilih **Proceed / Tetap Lanjutkan**.
4. **Trik Menjadikan HP Sebagai Layar TV Kiosk:**
   - Buka `https://192.168.1.50/player` di browser Chrome/Safari HP.
   - Klik menu titik tiga -> pilih **"Add to Home Screen" (Tambahkan ke Layar Utama)**.
   - Buka ikon SignaFlow dari layar utama HP. Layar HP akan langsung berubah jadi Kiosk vertikal layar penuh tanpa address bar browser!

---

## 4. Cara Melihat Catatan Log Kalau Terjadi Error

Kalau ada fitur yang tidak berjalan semestinya, kamu bisa melihat catatan log langsung dari Docker:

```bash
# Melihat log aplikasi Next.js (apakah ada error database atau API)
docker compose logs -f app

# Melihat log Caddy (apakah ada masalah koneksi HTTPS atau streaming video)
docker compose logs -f proxy
```
Tekan `Ctrl + C` di terminal untuk berhenti melihat log.

---

## 5. Pertolongan Pertama Saat Terjadi Masalah (Troubleshooting)

| Masalah yang Sering Muncul | Penyebab | Cara Memperbaiki |
| :--- | :--- | :--- |
| **TV Kiosk tidak langsung berubah pas jadwal diubah di Admin** | Koneksi sinyal SSE sedang tersendat. | Tunggu maksimal 30 detik. TV Kiosk otomatis mengecek jadwal baru lewat laporan rutin (*Heartbeat*). Atau klik tombol **Reload Layar** di menu Admin. |
| **Gagal menghapus video di Media Library (Muncul Pesan Conflict)** | Video tersebut masih dipakai di salah satu playlist aktif. | Buka menu **Playlists**, keluarkan dulu video itu dari playlist yang memakainya, baru hapus kembali di Media Library. |
| **Layar Kiosk di HP atau TV tidak mau simpan video offline** | Halaman dibuka lewat `http://` biasa (bukan `https://`). | Fitur *Service Worker* di browser mewajibkan koneksi aman HTTPS. Pastikan alamatnya diawali dengan `https://`. |
| **Penyimpanan harddisk Kiosk penuh** | Terlalu banyak video lama yang masih tersimpan di memori browser. | Buka menu **Devices** di Admin -> pilih Kiosk terkait -> klik tombol **Bersihkan Cache** (`CLEAR_CACHE`). TV Kiosk akan otomatis menghapus video lama. |
