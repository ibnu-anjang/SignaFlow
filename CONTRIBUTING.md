# Panduan Ngoding Bareng (Dev A & Dev B)

Halo! Dokumen ini dibuat agar kalian berdua bisa ngoding bareng dengan santai, percaya diri, dan bebas dari drama kode tabrakan (*Git merge conflict*).

---

## 1. Langkah Pertama Buat Teman Tim Baru

Buka terminal di laptopmu, lalu ketik perintah berikut satu per satu:

```bash
# 1. Download (clone) project dari GitHub
git clone git@github.com:ibnu-anjang/SignaFlow.git
cd SignaFlow

# 2. Pindah ke branch develop (ini branch tempat kita kumpulin kerjaan harian)
git checkout develop

# 3. Salin file contoh konfigurasi
cp .env.example .env
```

> **Aman untuk Pengguna Windows & Linux:** Proyek ini sudah dilengkapi file [`.gitattributes`](./.gitattributes). Jadi walaupun yang satu pakai Windows dan yang satu pakai Linux, Git tidak akan rewel soal perbedaan format baris teks.

---

## 2. Wilayah Folder Kita (Anti-Tabrakan)

Prinsip nomor satu dalam kerja tim: **Jangan mengedit file yang sama di saat yang sama.** Kita sudah bagi tugas dan folder dengan rapi:

| Pengembang | Fokus Pekerjaan | Folder Milikmu (Bebas Edit) |
| :--- | :--- | :--- |
| **Developer A**<br>*(Backend & Database)* | Menyiapkan tabel database Prisma, bikin API, simpan file video, kirim sinyal SSE, dan mengatur Docker. | `prisma/*`<br>`docker/*`<br>`Dockerfile`<br>`docker-compose.yml`<br>`src/server/*`<br>`src/app/api/v1/*`<br>`src/middleware.ts` |
| **Developer B**<br>*(Frontend CMS & Kiosk)* | Bikin tampilan web Admin (ramah Desktop & HP), layar pemutar TV 9:16, dan fitur simpan offline di browser Kiosk. | `src/app/(auth)/*`<br>`src/app/(admin)/*`<br>`src/app/(kiosk)/*`<br>`src/components/*`<br>`src/lib/kiosk/*`<br>`public/sw.js`<br>`public/manifest.json` |
| **File Bersama** | Kamus data janjian antara Backend dan Frontend. | `src/types/contracts.ts`<br>*(Kalau butuh ubah tipe data di file ini, diskusikan dulu berdua)* |

---

## 3. Alur Kerja Git Harian (5 Langkah Simpel)

Setiap mau mulai ngoding fitur baru, biasakan ikuti 5 langkah ini:

### Langkah 1: Ambil update terbaru dari `develop`
```bash
git checkout develop
git pull origin develop
```

### Langkah 2: Buat branch baru untuk fitur yang mau dikerjakan
* Kalau kamu **Dev A**:
  ```bash
  git checkout -b feat/dev-a-setup-database
  ```
* Kalau kamu **Dev B**:
  ```bash
  git checkout -b feat/dev-b-halaman-login
  ```

### Langkah 3: Ngoding dan Simpan Perubahan (Commit)
Setelah fitur selesai dan kamu tes jalan di laptopmu:
```bash
git add .
git commit -m "feat: tambah halaman login admin"
```

### Langkah 4: Upload (Push) ke GitHub
```bash
git push -u origin nama-branch-kamu
```

### Langkah 5: Gabungkan (Merge) lewat Pull Request
Buka halaman GitHub repositori, klik tombol **Compare & pull request**, pilih target ke branch **`develop`**, lalu minta temanmu untuk klik tombol **Merge**. Beres!

---

## 4. Tips Kalau Lagi Bingung

* Baca [**README.md**](./README.md) untuk memahami istilah-istilah dasarnya.
* Buka [**docs/06-TEAM-WORKFLOW-ROADMAP.md**](./docs/06-TEAM-WORKFLOW-ROADMAP.md) untuk melihat daftar checklist tugas kita dari Fase 1 sampai Fase 4.
* **Untuk Dev A:** Buka [**docs/04-DATABASE-ERD.md**](./docs/04-DATABASE-ERD.md) dan [**docs/05-API-CONTRACT.md**](./docs/05-API-CONTRACT.md) untuk melihat bentuk database dan daftar URL API yang harus kamu buat.
* **Untuk Dev B:** Buka [**docs/01-PRD.md**](./docs/01-PRD.md) dan [**docs/02-TRD-ARCHITECTURE.md**](./docs/02-TRD-ARCHITECTURE.md) untuk melihat fitur tampilan dan cara kerja pemutar video offline.
