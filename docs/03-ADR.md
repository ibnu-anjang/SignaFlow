# 03. Architecture Decision Records (ADR)

Dokumen ini mencatat keputusan arsitektur utama pada proyek **SignaFlow** beserta konteks masalah, alternatif yang dipertimbangkan, dan alasan pemilihannya. Catatan ini membantu tim *engineering* dan penguji memahami rasionalitas di balik setiap desain teknis.

---

## ADR-001: Penggunaan Monolit Modular Next.js (`output: 'standalone'`) Dibandingkan Pemisahan Repo Frontend & Backend

* **Status:** Disetujui
* **Konteks:** Tim terdiri dari 2 *developer* PKL yang harus membangun *Admin CMS*, *Kiosk Player*, *REST API*, *SSE Broker*, dan *Database ORM* dalam waktu terbatas serta men-deploy keseluruhannya di dalam Docker.
* **Alternatif yang Dipertimbangkan:**
  1. Memisahkan repositori menjadi *Backend Express/NestJS* dan *Frontend React SPA* terpisah.
  2. Menggunakan satu repositori **Next.js App Router (`output: 'standalone'`)** yang menyatukan UI dan Route Handlers (`/api/v1/*`) dengan batas folder yang tegas.
* **Keputusan:** Memilih **Alternatif 2 (Next.js Modular Monolith dengan `output: 'standalone'`)**.
* **Alasan & Konsekuensi:**
  - Kontrak TypeScript (`src/types/contracts.ts`) dapat langsung dipakai bersama oleh *backend* maupun *frontend* tanpa risiko ketidakcocokan versi paket.
  - Mode `output: 'standalone'` memangkas ukuran *image* Docker produksi secara drastis (hanya menyertakan file `node_modules` yang benar-benar terpakai saat produksi).
  - Cukup mengelola 1 *container* aplikasi (`app`) di samping `db` dan `proxy`.

---

## ADR-002: Penggunaan Server-Sent Events (SSE) + Polling Heartbeat 30 Detik Dibandingkan WebSockets

* **Status:** Disetujui
* **Konteks:** Kiosk membutuhkan saluran komunikasi untuk menerima komando instan dari Admin (seperti `SYNC_MANIFEST` atau `RELOAD_PLAYER`) dan melaporkan status kesehatannya secara berkala.
* **Alternatif yang Dipertimbangkan:**
  1. Koneksi dua arah penuh menggunakan *WebSockets* (`Socket.io` atau `ws`).
  2. Kombinasi **Server-Sent Events (SSE)** satu arah (Server ke Kiosk) menggunakan Web API standar `EventSource` + **HTTP POST Heartbeat** setiap 30 detik (Kiosk ke Server).
* **Keputusan:** Memilih **Alternatif 2 (SSE + HTTP POST Heartbeat 30 detik)**.
* **Alasan & Konsekuensi:**
  - Komunikasi waktu nyata dari CMS ke Kiosk bersifat satu arah (server mendorong notifikasi ke kiosk), sedangkan kiosk hanya perlu melapor balik setiap 30 detik.
  - `EventSource` (SSE) berjalan di atas HTTP/HTTPS standar, mendukung *auto-reconnect* bawaan *browser* secara otomatis saat Wi-Fi putus-nyambung, dan tidak memerlukan *custom WebSocket server* terpisah di luar *Route Handler* Next.js.
  - Sebagai jaring pengaman ganda (*dual-safety net*), jika koneksi SSE terblokir oleh *firewall* lokal, respons dari `POST /api/v1/device/heartbeat` setiap 30 detik tetap membawa `latestManifestHash` dan `pendingCommand`.

---

## ADR-003: Penggunaan Cache Storage API + IndexedDB Dibandingkan localStorage untuk Penyimpanan Offline Kiosk

* **Status:** Disetujui
* **Konteks:** Kiosk harus menyimpan file video `.mp4` berukuran puluhan hingga ratusan megabyte serta jadwal tayang secara lokal di dalam *browser*.
* **Alternatif yang Dipertimbangkan:**
  1. Menyimpan data di `localStorage`.
  2. Menyimpan metadata JSON di **`IndexedDB`** dan menyimpan *file* biner media (video/gambar) di **`Cache Storage API`** (`window.caches`), dikombinasikan dengan **`Service Worker`**.
* **Keputusan:** Memilih **Alternatif 2 (`IndexedDB` + `Cache Storage API` + `Service Worker`)**.
* **Alasan & Konsekuensi:**
  - `localStorage` bersifat sinkron (memblokir *main thread*), hanya menerima string, dan dibatasi sekitar 5 MB.
  - `Cache Storage API` dirancang oleh standar web khusus untuk menyimpan objek `Response` biner berukuran besar (hingga puluhan Gigabyte sesuai kuota *disk* yang diizinkan *flag* `--disk-cache-size` Chromium).
  - `IndexedDB` memungkinkan penyimpanan struktur JSON *Device Manifest*, log *offline*, serta nilai koreksi jam (`clockOffsetMs`) secara asinkron dan aman lintas *reboot*.

---

## ADR-004: Penyajian File Media Langsung Melalui Caddy Reverse Proxy (`Accept-Ranges: bytes`)

* **Status:** Disetujui
* **Konteks:** File video yang diunggah admin disimpan di *persistent volume* lokal. Saat banyak kiosk mengunduh video secara bersamaan, server harus melayani transfer *file* berukuran besar.
* **Alternatif yang Dipertimbangkan:**
  1. Melayani file media melalui *Route Handler* Node.js/Next.js (`fs.createReadStream`).
  2. Memasang *volume* `signaflow_media` ke *container* Next.js sebagai *Read-Write* (`/data/uploads:rw`) untuk proses unggah, dan memasang *volume* yang sama ke *container* **Caddy Reverse Proxy** sebagai *Read-Only* (`/srv/media:ro`) untuk disajikan langsung pada path `/media/*`.
* **Keputusan:** Memilih **Alternatif 2 (Direct Media Serving via Caddy)**.
* **Alasan & Konsekuensi:**
  - Caddy (ditulis dalam bahasa Go) menangani *static file streaming*, kompresi, header `ETag`, dan `Accept-Ranges: bytes` (wajib untuk *video seeking/streaming* di Chromium) jauh lebih cepat dan hemat memori dibandingkan melewatkannya ke *event loop* Node.js.
  - *Container* Next.js tetap fokus melayani transaksi API, kompilasi *manifest*, dan koneksi SSE.
  - Abstraksi `StorageService` di sisi Next.js tetap memudahkan perpindahan ke *object storage* eksternal (AWS S3 / MinIO / Cloudflare R2) di masa depan hanya dengan mengubah variabel `publicUrl`.

---

## ADR-005: Hashing Manifest Deterministik (`SHA-256`) & Cutover Atomik

* **Status:** Disetujui
* **Konteks:** Kiosk perlu mengetahui secara pasti kapan jadwal, urutan *playlist*, atau aset media berubah di server tanpa harus mengunduh ulang seluruh data setiap 30 detik.
* **Keputusan:** Server mengompilasi struktur `DeviceManifestDTO` untuk setiap kiosk dan menghitung nilai `manifestHash` menggunakan algoritma `SHA-256` atas representasi kanonis dari jadwal, versi *playlist*, dan daftar aset.
* **Alasan & Konsekuensi:**
  - Pada setiap *heartbeat* 30 detik, kiosk cukup mengirimkan `currentManifestHash` (64 karakter). Server membandingkannya dengan `latestManifestHash` dan mengembalikan `syncRequired: true/false` dengan beban *bandwidth* kurang dari 200 *byte*.
  - Kiosk hanya melakukan perpindahan (*cutover*) ke *manifest* baru setelah seluruh aset di dalam `requiredAssets` terbukti ada di `Cache Storage` dan cocok nilai `checksumSha256`-nya.

---

## ADR-006: Arsitektur Render Dua Lapis (*Double-Buffered DOM*) untuk Transisi Media

* **Status:** Disetujui
* **Konteks:** Mengganti `src` pada elemen `<video>` tunggal di HTML5 selalu menimbulkan jeda dekode yang terlihat sebagai layar berkedip hitam.
* **Keputusan:** Membangun komponen pemutar dengan dua slot permanen (`Slot A` dan `Slot B`) yang bertumpuk secara absolut (`position: absolute; inset: 0`).
* **Alasan & Konsekuensi:**
  - Saat `Slot A` sedang memutar media ke-`N`, `Slot B` sudah memuat dan melakukan *pre-buffer* media ke-`N+1` pada waktu `3 detik` sebelum media ke-`N` selesai.
  - Tepat saat waktu tayang habis, transisi dilakukan murni menggunakan properti CSS `opacity` yang diakselerasi GPU, menghasilkan perpindahan mulus `60fps` tanpa kedipan hitam.

---

## ADR-007: Evaluasi Jadwal Lokal Menggunakan Koreksi Jam Server (*Rolling Median Clock Offset*)

* **Status:** Disetujui
* **Konteks:** Pergantian jadwal (misal pukul `12:00:00`) harus dieksekusi secara mandiri oleh kiosk meskipun sedang *offline*, namun jam internal OS kiosk bisa meleset beberapa menit dari waktu sebenarnya.
* **Keputusan:** Kiosk menghitung selisih jam lokal terhadap `serverTimestampMs` menggunakan kompensasi setengah *Round-Trip Time* ($\text{RTT}/2$), mengambil median dari 5 sampel terakhir, dan menyimpannya di `IndexedDB`.
* **Alasan & Konsekuensi:**
  - Menjamin seluruh layar kiosk di satu gedung berganti promosi pada detik yang serempak meskipun jam BIOS masing-masing mini-PC tidak sinkron.
