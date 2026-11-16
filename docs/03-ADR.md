# 03. Architecture Decision Records (ADR) - Alasan Memilih Teknologi

Dokumen ini mencatat **kenapa kita memilih teknologi tertentu dan menolak teknologi lainnya**. Kalau nanti dosen pembimbing atau penguji PKL bertanya *"Kenapa kalian pakai teknologi X, bukan Y?"*, semua jawabannya ada di dokumen ini!

---

## ADR-001: Menggabungkan Backend & Frontend di Next.js (Bukan Bikin 2 Proyek Terpisah)

* **Keputusan:** Kita memakai **Next.js App Router (mode `output: 'standalone'`)** yang menyatukan Backend (API) dan Frontend di dalam satu repositori yang sama.
* **Kenapa tidak bikin Backend Express/NestJS dan Frontend React terpisah?**
  - **Terlalu ribet untuk tim 2 orang:** Kalau dipisah, kita harus mengelola 2 proyek, 2 `package.json`, 2 container Docker, dan harus sering menyalin file tipe data bolak-balik.
  - **Satu Sumber Kebenaran:** Dengan Next.js, file tipe data bersama (`src/types/contracts.ts`) bisa langsung diimpor oleh Backend maupun Frontend tanpa takut beda versi.
  - **Docker Lebih Ringkas:** Mode `output: 'standalone'` membuat ukuran image Docker jadi sangat kecil (cuma sekitar 150 MB) karena hanya menyertakan file yang benar-benar dipakai di produksi.

---

## ADR-002: Memakai Server-Sent Events (SSE) + Heartbeat 30 Detik (Bukan WebSockets)

* **Keputusan:** Kita memakai **Server-Sent Events (SSE)** untuk mengirim perintah kilat dari Admin ke TV, ditambah laporan rutin (**Heartbeat via HTTP POST**) setiap 30 detik dari TV ke Server.
* **Kenapa tidak pakai WebSockets?**
  - **Kebutuhan kita cuma 1 arah:** Admin cuma butuh menembak sinyal ke TV ("Eh TV, jadwal baru sudah siap!"). TV tidak butuh sering-sering mengirim chat balik.
  - **SSE Lebih Tahan Banting:** Fitur SSE bawaan browser (`EventSource`) otomatis mencoba menyambung ulang (*auto-reconnect*) kalau sinyal Wi-Fi putus-nyambung.
  - **Jaring Pengaman Ganda:** Kalau koneksi SSE diblokir oleh Wi-Fi gedung, TV Kiosk tetap mengirim laporan *Heartbeat* setiap 30 detik lewat HTTP biasa. Dari balasan *Heartbeat* itu, TV tetap bisa tahu kalau ada jadwal baru.

---

## ADR-003: Memakai Cache Storage API + IndexedDB (Bukan localStorage)

* **Keputusan:** Di dalam browser TV, file video/gambar disimpan di **Cache Storage API**, sedangkan data jadwal disimpan di **IndexedDB**.
* **Kenapa tidak pakai `localStorage` saja?**
  - **Ukuran `localStorage` terlalu kecil:** Maksimal cuma muat sekitar 5 MB dan hanya bisa menyimpan teks biasa. Satu file video saja ukurannya bisa 50 MB sampai 100 MB, jadi jelas tidak muat.
  - **`Cache Storage` sanggup menampung bergiga-giga:** Standar web modern menyediakan `Cache Storage` khusus untuk menyimpan file biner besar (video/gambar) di harddisk komputer.
  - **`IndexedDB` tidak bikin lemot:** Membaca data dari `IndexedDB` berjalan di latar belakang (asinkron) tanpa membuat animasi pemutar video tersendat.

---

## ADR-004: Menyajikan File Video Langsung Lewat Caddy (Bukan Lewat Node.js)

* **Keputusan:** File video yang di-upload admin disimpan di folder Docker (`signaflow_media`). Saat TV ingin men-download video (`/media/*`), permintaan tersebut dilayani langsung oleh **Caddy Reverse Proxy**.
* **Kenapa tidak lewat Node.js/Next.js?**
  - **Node.js bisa kewalahan:** Kalau ada 10 sampai 20 layar TV yang mengunduh video promosi 150 MB secara bersamaan, RAM dan CPU Node.js bisa habis hanya untuk urusan transfer data.
  - **Caddy sangat kencang:** Caddy dibuat dengan bahasa Go dan sangat ahli menangani pengiriman file video besar dengan fitur *byte-range streaming* (membuat video bisa diputar tanpa harus menunggu download selesai 100%).

---

## ADR-005: Pengecekan Sidik Jari File (SHA-256) Sebelum Memutar Video Baru

* **Keputusan:** TV Kiosk tidak boleh memutar video baru sebelum mencocokkan kode sidik jari (`SHA-256`) file hasil download dengan catatan dari server.
* **Kenapa ini wajib?**
  - Di lapangan, sinyal Wi-Fi sering putus saat proses download baru berjalan 80%.
  - Kalau file yang baru ter-download 80% langsung diputar, pemutar video browser akan error dan layar TV jadi hitam.
  - Dengan mencocokkan kode `SHA-256`, kita menjamin 100% bahwa video yang diputar benar-benar utuh dan sempurna.

---

## ADR-006: Pemutar Video 2 Lapis (Slot A & Slot B) untuk Transisi Mulus

* **Keputusan:** Kita membuat pemutar dengan 2 slot video yang saling bertumpuk di layar.
* **Kenapa tidak pakai 1 tag video saja?**
  - Mengganti sumber video pada 1 tag `<video>` selalu menimbulkan jeda layar hitam sekitar 0,5 detik selagi browser memproses video baru.
  - Dengan 2 slot, video berikutnya sudah kita siapkan diam-diam di belakang layar 3 detik sebelum video pertama habis. Pas waktunya tiba, tinggal tukar posisi. Layar dijamin mulus tanpa kedip hitam sama sekali!

---

## ADR-007: Rumus Koreksi Jam Server untuk TV Kiosk

* **Keputusan:** TV Kiosk otomatis menghitung selisih jam lokalnya dengan jam server setiap kali menerima respons *Heartbeat*.
* **Kenapa ini penting?**
  - Jam komputer Kiosk sering ngaco (misalnya telat beberapa menit karena baterai CMOS habis).
  - Kalau jam Kiosk telat 10 menit, maka promo siang yang harusnya tayang jam 12:00 baru akan muncul jam 12:10.
  - Dengan menyimpan angka selisih jam (`clockOffsetMs`), Kiosk bisa tahu waktu server yang sebenarnya dan jadwal tayang selalu berganti tepat pada detiknya.
