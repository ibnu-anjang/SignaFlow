# 07. Runbook Operasional, Deployment & Pemeliharaan

Dokumen ini adalah panduan operasional standar (SOP) untuk menjalankan, mengelola, mem-backup, dan menangani insiden pada platform **SignaFlow** di lingkungan produksi maupun saat demonstrasi lapangan.

---

## 1. Konfigurasi Variabel Lingkungan (`.env`)

Sebelum menjalankan *stack* Docker, salin `.env.example` menjadi `.env` dan sesuaikan nilainya:

```ini
# Database PostgreSQL
POSTGRES_USER=signaflow
POSTGRES_PASSWORD=ubah_password_produksi_kuat_123
POSTGRES_DB=signaflow_db
DATABASE_URL="postgresql://signaflow:ubah_password_produksi_kuat_123@db:5432/signaflow_db?schema=public"

# Keamanan & Autentikasi
JWT_SECRET="gunakan_string_acak_minimal_64_karakter_heksadesimal"
ADMIN_SEED_EMAIL="admin@signaflow.local"
ADMIN_SEED_PASSWORD="AdminSignaFlow2026!"

# Penyimpanan Media & Zona Waktu Lokasi
STORAGE_DRIVER="local"
MEDIA_UPLOAD_DIR="/data/uploads"
PUBLIC_MEDIA_BASE_URL="/media"
VENUE_TIMEZONE="Asia/Jakarta"

# Domain / Hostname untuk Caddy Reverse Proxy
# Gunakan "localhost" atau IP LAN server (contoh: "192.168.1.100")
CADDY_DOMAIN="localhost"
```

---

## 2. SOP Deployment Produksi dengan Docker Compose

### 2.1 Menyalakan Seluruh Layanan
```bash
# Build image untuk arsitektur linux/amd64 dan jalankan di latar belakang
docker compose up -d --build

# Periksa status kesehatan ketiga container (db, app, proxy)
docker compose ps
```

### 2.2 Memeriksa Log Layanan Secara Langsung
```bash
# Melihat log aplikasi Next.js dan migrasi Prisma
docker compose logs -f app

# Melihat log akses HTTPS dan streaming media pada Caddy
docker compose logs -f proxy
```

---

## 3. Pengaturan Sertifikat HTTPS Lokal untuk Kiosk & HP di Jaringan LAN

Karena fitur **Service Worker** dan **Cache Storage API** mewajibkan koneksi **HTTPS (`Secure Context`)**, Caddy secara otomatis membuat sertifikat TLS lokal ketika dijalankan di jaringan LAN (`tls internal`).

Agar *browser* pada perangkat Kiosk atau HP di jaringan Wi-Fi yang sama mempercayai sertifikat HTTPS lokal tanpa peringatan keamanan:

1. **Ambil Sertifikat Root CA dari Container Caddy:**
   ```bash
   docker cp signaflow-proxy:/data/caddy/pki/authorities/local/root.crt ./signaflow-root-ca.crt
   ```
2. **Pada Mini-PC Linux Kiosk (Ubuntu/Debian):**
   ```bash
   sudo cp ./signaflow-root-ca.crt /usr/local/share/ca-certificates/signaflow-root-ca.crt
   sudo update-ca-certificates
   ```
3. **Pada HP Android (untuk Admin Mobile / Simulasi Kiosk):**
   - Kirim file `signaflow-root-ca.crt` ke HP.
   - Buka **Pengaturan (Settings)** -> **Keamanan & Privasi** -> **Enkripsi & Kredensial** -> **Instal Sertifikat** -> **Sertifikat CA**, lalu pilih file tersebut.

---

## 4. Konfigurasi Auto-Boot pada Perangkat Fisik Linux Kiosk

Untuk memastikan Mini-PC langsung membuka layar penuh `9:16` saat listrik menyala:

1. **Atur Rotasi Layar ke Portrait (`9:16`) pada X11:**
   Tambahkan perintah berikut pada `~/.xprofile`:
   ```bash
   xrandr --output HDMI-1 --mode 1920x1080 --rotate right
   ```
2. **Pasang Paket Pendukung Kiosk:**
   ```bash
   sudo apt-get update && sudo apt-get install -y chromium-browser unclutter x11-xserver-utils
   ```
3. **Jalankan Skrip `scripts/launch-kiosk.sh` via Autostart Desktop:**
   Buat file `~/.config/autostart/signaflow-kiosk.desktop`:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=SignaFlow Kiosk Player
   Exec=/home/kiosk/launch-kiosk.sh
   X-GNOME-Autostart-enabled=true
   ```

---

## 5. SOP Backup & Restore Data

Seluruh data persisten berada di dalam dua *Docker Volume*: `signaflow_pgdata` (Database) dan `signaflow_media` (File Video/Gambar).

### 5.1 Backup Database PostgreSQL
```bash
docker compose exec -T db pg_dump -U signaflow -d signaflow_db --clean --if-exists > backup_db_$(date +%Y%m%d_%H%M%S).sql
```

### 5.2 Restore Database PostgreSQL
```bash
cat backup_db_20261116.sql | docker compose exec -T db psql -U signaflow -d signaflow_db
```

### 5.3 Backup Volume File Media
```bash
docker run --rm \
  -v signaflow_media:/data/uploads:ro \
  -v $(pwd):/backup \
  alpine tar -czf /backup/backup_media_$(date +%Y%m%d).tar.gz -C /data/uploads .
```

---

## 6. Playbook Penanganan Insiden (*Troubleshooting*)

| Gejala Masalah | Penyebab Umum | Langkah Penyelesaian |
| :--- | :--- | :--- |
| **Layar Kiosk tidak langsung berubah saat jadwal di CMS disimpan** | Koneksi SSE sedang terputus karena gangguan Wi-Fi lokal. | 1. Tunggu maksimal 30 detik (kiosk akan mengambil pembaruan lewat *polling heartbeat*).<br>2. Jika masih belum berubah, ketuk pojok kiri atas layar kiosk 5x untuk membuka *Overlay Diagnostik* dan cek status jaringan. |
| **Muncul peringatan gagal menyimpan cache offline di Kiosk/HP** | Halaman `/player` dibuka melalui `http://` biasa (bukan `https://` atau `localhost`). | Pastikan mengakses melalui port HTTPS Caddy (`https://<ip-server>/player`) dan sertifikat Root CA sudah terpasang. |
| **Gagal menghapus video di Media Library (`409 Conflict`)** | Video tersebut masih terdaftar di dalam salah satu *playlist*. | Buka menu **Playlists**, lepaskan video tersebut dari *playlist* yang menggunakannya, lalu hapus kembali di **Media Library**. |
| **Penyimpanan disk Kiosk penuh** | Kuota cache browser terlampaui oleh file lama. | Buka **Admin CMS** -> **Devices** -> pilih perangkat -> tekan tombol **Clear Cache** (kiosk akan menghapus seluruh *cache* dan mengunduh ulang hanya aset yang aktif). |
