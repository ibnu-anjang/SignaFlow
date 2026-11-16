# SignaFlow: Platform Digital Signage 9:16 Offline-First

SignaFlow adalah platform manajemen *Digital Signage* kelas produksi yang dirancang khusus untuk layar kiosk berdiri vertikal (**rasio 9:16, resolusi 1080x1920**) yang beroperasi **24/7** di area komersial publik seperti *driving range* golf, klinik kesehatan, lobi gedung, dan koridor pusat perbelanjaan.

Sistem ini dibangun dengan prinsip **Offline-First Resilience**: layar kiosk tetap memutar konten video/gambar tanpa jeda dan tetap mengeksekusi pergantian jadwal berbasis waktu (*day-parting*) secara akurat meskipun jaringan Wi-Fi lokasi terputus total atau perangkat mengalami *cold reboot* saat *offline*.

---

## Daftar Dokumen Engineering (Standar Senior Fullstack & Systems Architect)

Seluruh dokumentasi arsitektur, produk, dan operasional disimpan di dalam direktori [`docs/`](./docs/) dan disusun mengikuti standar *software engineering* industri:

| No | Dokumen | Deskripsi |
| :- | :--- | :--- |
| **01** | [**PRD (Product Requirements Document)**](./docs/01-PRD.md) | Pernyataan masalah, profil aktor (Admin Desktop/Mobile vs. Perangkat Kiosk), alur pengguna, kebutuhan fungsional/non-fungsional, dan batasan MVP. |
| **02** | [**TRD & Arsitektur Sistem**](./docs/02-TRD-ARCHITECTURE.md) | Diagram arsitektur tingkat tinggi, *state machine* sinkronisasi *offline*, algoritma koreksi *clock drift*, *double-buffered player*, dan penguncian OS Kiosk. |
| **03** | [**ADR (Architecture Decision Records)**](./docs/03-ADR.md) | Catatan keputusan arsitektur (ADR-001 s/d ADR-007) beserta alasan teknis, alternatif yang dipertimbangkan, dan konsekuensi (*trade-offs*). |
| **04** | [**ERD & Spesifikasi Database**](./docs/04-DATABASE-ERD.md) | Diagram relasi entitas (ERD), skema DDL PostgreSQL lengkap, strategi *indexing*, aturan *foreign key*, dan kebijakan retensi log. |
| **05** | [**Kontrak API & Protokol Realtime**](./docs/05-API-CONTRACT.md) | Daftar endpoint REST API, standar kode *error*, skema *event* SSE (*Server-Sent Events*), dan kontrak TypeScript (`contracts.ts`). |
| **06** | [**Pembagian Tugas Tim & Peta Jalan**](./docs/06-TEAM-WORKFLOW-ROADMAP.md) | Pembagian kerja tim 2 *developer* bebas konflik Git, standar *branching* & *commit*, serta rencana eksekusi Fase 1 sampai Fase 4. |
| **07** | [**Runbook Operasional & Deployment**](./docs/07-RUNBOOK-OPERATIONS.md) | Panduan *deployment* Docker, konfigurasi HTTPS Caddy untuk jaringan lokal & HP, instalasi Linux Kiosk fisik, *backup* database, dan *troubleshooting*. |
| **08** | [**Rencana Pengujian (QA & UAT Plan)**](./docs/08-QA-TEST-PLAN.md) | Skenario uji ketahanan *offline*, uji pergantian jam tayang, uji *watchdog* file rusak, uji akses via HP, dan daftar cek kelayakan rilis. |

---

## Tumpukan Teknologi (*Tech Stack*)

* **Framework Aplikasi:** Next.js (App Router, TypeScript, mode `output: 'standalone'`) di atas Node.js 20 LTS.
* **Database & ORM:** PostgreSQL 16 Alpine + Prisma ORM (dengan migrasi skema ketat).
* **Penyimpanan Media:** *Persistent Docker Volume* lokal dengan lapisan abstraksi siap S3 (`StorageService`) + *Direct Byte-Range Streaming* melalui Caddy.
* **Sinkronisasi Realtime:** *Server-Sent Events* (SSE) untuk komando instan (`< 200ms`) + *fallback polling heartbeat* pintar setiap 30 detik.
* **Mesin Pemutar Kiosk (Offline-First):** *Service Worker* (App Shell Cache) + `IndexedDB` (Penyimpanan Manifest & Jadwal) + `Cache Storage API` (Penyimpanan Blob Video/Gambar terverifikasi `SHA-256`).
* **Infrastruktur & Reverse Proxy:** Docker & Docker Compose (`linux/amd64`) + Caddy 2 untuk terminasi HTTPS otomatis (wajib agar *Service Worker* aktif di produksi dan perangkat HP).

---

## Fitur Utama

1. **Penjadwalan *Day-Parting* Berprioritas:** Pergantian promosi otomatis berdasarkan rentang tanggal, hari dalam seminggu (misal Senin-Jumat vs. Sabtu-Minggu), dan jam tayang (`HH:mm`), lengkap dengan sistem prioritas (`1-100`) dan *fallback playlist*.
2. **Ketahanan *Offline* 100%:** Pemutaran berlanjut tanpa kedip dan pergantian jadwal tetap terjadi tepat waktu meskipun Wi-Fi mati berhari-hari.
3. **Pemutar *Double-Buffered Zero-Flicker*:** Aset berikutnya (`N+1`) di-*decode* di lapisan DOM tersembunyi 3 detik sebelum aset saat ini (`N`) berakhir, menghasilkan transisi instan tanpa layar hitam atau *spinner loading*.
4. **Pemasangan (*Pairing*) 6 Digit Cepat:** Pasangkan kiosk baru cukup dengan memasukkan 6 digit kode yang tampil di layar melalui laptop atau **langsung dari HP** di depan layar kiosk.
5. **Pemantauan Armada & *Self-Healing Watchdog*:** *Dashboard* pemantauan status `ONLINE`/`STALE`/`OFFLINE`, progres sinkronisasi *cache*, serta pemulihan mandiri otomatis jika video macet.
