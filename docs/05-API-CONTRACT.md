# 05. Kontrak API & Protokol Realtime

Dokumen ini adalah **surat perjanjian format data (kontrak API)** antara **Developer A (yang bikin Backend)** dan **Developer B (yang bikin Tampilan Web & Player)**.

Dengan adanya dokumen ini, kalian berdua bisa langsung ngoding secara bersamaan tanpa perlu saling tunggu! Dev B bisa bikin tampilan dengan data pura-pura (*mock data*), dan Dev A bisa langsung bikin API-nya di Next.js. Begitu keduanya selesai, sistem langsung nyambung tanpa revisi besar.

---

## 1. Aturan Format Data Response

Semua API di SignaFlow menggunakan format JSON yang konsisten:

* **Kalau Sukses (Status 200 / 201):**
  ```json
  {
    "ok": true,
    "data": { ... },
    "serverTimestampMs": 1794803500123
  }
  ```
* **Kalau Gagal / Error (Status 400 / 401 / 404 / 409):**
  ```json
  {
    "ok": false,
    "error": {
      "code": "MEDIA_SEDANG_DIPAKAI",
      "message": "File video ini tidak bisa dihapus karena masih dipakai di Playlist Promo Pagi."
    }
  }
  ```

---

## 2. Cara Login & Autentikasi

1. **Untuk Admin (Halaman `/admin`):**
   Login pakai email dan password di `/api/v1/auth/login`. Begitu sukses, browser otomatis menyimpan cookie sesi `signaflow_session`. Dev B tidak perlu repot mengurus simpan token di state React.
2. **Untuk TV Kiosk (Halaman `/player`):**
   Kiosk menggunakan token rahasia (`deviceToken`). Setiap kali Kiosk memanggil API, sertakan header:
   `Authorization: Bearer <deviceToken>`

---

## 3. Daftar Lengkap Alamat API (Endpoint)

### A. Autentikasi Admin
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login admin (kirim `email` & `password`). |
| `POST` | `/api/v1/auth/logout` | Logout (hapus cookie sesi). |
| `GET` | `/api/v1/auth/me` | Ambil data profil admin yang sedang login. |

### B. Pengelolaan Video & Gambar (Media)
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/media` | Ambil semua daftar file media yang sudah di-upload. |
| `POST` | `/api/v1/media` | Upload file baru via form-data (`file`, `title`, `durationSeconds`). |
| `DELETE` | `/api/v1/media/:id` | Hapus file media (akan ditolak jika file masih dipakai di playlist). |

### C. Pengelolaan Playlist
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/playlists` | Ambil semua daftar playlist beserta jumlah videonya. |
| `POST` | `/api/v1/playlists` | Buat playlist baru beserta urutan videonya. |
| `GET` | `/api/v1/playlists/:id` | Ambil detail satu playlist lengkap dengan daftar videonya. |
| `PUT` | `/api/v1/playlists/:id` | Perbarui urutan video di playlist (otomatis menaikkan versi). |
| `DELETE` | `/api/v1/playlists/:id` | Hapus playlist. |

### D. Pengelolaan Jadwal Tayang (Schedules)
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/schedules` | Ambil semua daftar jadwal jam tayang. |
| `POST` | `/api/v1/schedules` | Buat jadwal tayang baru (otomatis kirim sinyal ke Kiosk). |
| `PUT` | `/api/v1/schedules/:id` | Edit jadwal tayang (otomatis kirim sinyal ke Kiosk). |
| `DELETE` | `/api/v1/schedules/:id` | Hapus jadwal tayang. |

### E. Pengelolaan TV Kiosk (Sisi Admin)
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/devices` | Ambil daftar semua TV Kiosk beserta status ONLINE/OFFLINE. |
| `POST` | `/api/v1/devices/pair` | Klaim kode 6 digit dari TV Kiosk baru untuk dipasangkan. |
| `PATCH` | `/api/v1/devices/:id` | Ganti nama TV, lokasi, atau playlist cadangan. |
| `POST` | `/api/v1/devices/:id/command` | Kirim perintah: `SYNC_MANIFEST`, `RELOAD_PLAYER`, `CLEAR_CACHE`. |
| `GET` | `/api/v1/devices/:id/logs` | Lihat 100 riwayat log terakhir dari TV Kiosk tersebut. |

### F. API yang Dipanggil oleh TV Kiosk (`/player`)
| Method | Alamat URL | Fungsi |
| :--- | :--- | :--- |
| `POST` | `/api/v1/device/pair/request` | TV meminta kode 6 digit baru saat pertama kali dinyalakan. |
| `GET` | `/api/v1/device/pair/status` | TV mengecek apakah kode 6 digitnya sudah diketik oleh Admin di HP. |
| `GET` | `/api/v1/device/manifest` | TV mengambil daftar lengkap jadwal dan video yang harus di-download. |
| `POST` | `/api/v1/device/heartbeat` | TV melapor setiap 30 detik: sedang memutar apa, baterai/storage berapa, dll. |
| `POST` | `/api/v1/device/logs` | TV mengirim catatan kalau ada video yang macet atau error. |
| `GET` | `/api/v1/device/stream` | Jalur SSE (pipa sinyal) supaya TV menerima perintah instan dari Admin. |

---

## 4. Bentuk Data TypeScript Bersama (`src/types/contracts.ts`)

File TypeScript ini sudah ada di folder proyek [`src/types/contracts.ts`](file:///home/iben/Desktop/TUGAS/PKL-PROJECT/SignaFlow/src/types/contracts.ts). Baik Dev A maupun Dev B tinggal mengimpor tipe data dari file ini:

```typescript
import type { 
  PlaylistDTO, 
  ScheduleDTO, 
  DeviceSummaryDTO, 
  DeviceManifestDTO 
} from '@/types/contracts';
```
Semua tipe data sudah siap pakai dan tidak perlu dibuat ulang dari nol!
