# Panduan Kolaborasi Tim (Developer A & Developer B)

Selamat datang di repositori **SignaFlow**! Dokumen ini dibuat agar kita berdua bisa ngoding bareng secara paralel tanpa saling menimpa file (*merge conflict*).

---

## 1. Setup Awal untuk Rekan Tim Baru

Jalankan perintah berikut di terminal:

```bash
# 1. Clone repositori via SSH
git clone git@github.com:ibnu-anjang/SignaFlow.git
cd SignaFlow

# 2. Pindah ke branch integrasi utama (develop)
git checkout develop

# 3. Salin konfigurasi environment lokal
cp .env.example .env
```

> **Catatan Penting Pengguna Windows / WSL:** File [`.gitattributes`](./.gitattributes) sudah dikonfigurasi untuk memaksa akhir baris menggunakan `LF` agar tidak muncul konflik `CRLF` vs `LF` saat kolaborasi antara Windows dan Linux.

---

## 2. Pembagian Wilayah Kerja (Anti-Conflict Boundary)

Agar kita tidak pernah mengedit file yang sama secara bersamaan, ikuti pembagian folder berikut:

| Peran | Wilayah Folder (Bebas Edit) |
| :--- | :--- |
| **Developer A (Backend, DB, SSE & Docker)** | `prisma/*`, `docker/*`, `Dockerfile`, `docker-compose.yml`, `src/server/*`, `src/app/api/v1/*`, `src/middleware.ts` |
| **Developer B (UI Admin CMS & Kiosk Player 9:16)** | `src/app/(auth)/*`, `src/app/(admin)/*`, `src/app/(kiosk)/*`, `src/components/*`, `src/lib/kiosk/*`, `public/sw.js`, `public/manifest.json` |
| **File Konstitusi Bersama** | `src/types/contracts.ts` (Jangan diubah sepihak tanpa diskusi berdua!) |

---

## 3. Alur Kerja Git Harian

1. **Jangan pernah push langsung ke `main` atau `develop` tanpa cek build.**
2. Sebelum mulai mengerjakan fitur baru, selalu ambil perubahan terbaru dari `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
3. Buat branch fitur sesuai peranmu:
   - Untuk Dev A: `git checkout -b feat/dev-a-<nama-fitur>` (misal: `feat/dev-a-prisma-schema`)
   - Untuk Dev B: `git checkout -b feat/dev-b-<nama-fitur>` (misal: `feat/dev-b-kiosk-viewport`)
4. Commit menggunakan format *Conventional Commits*:
   ```bash
   git add .
   git commit -m "feat(kiosk): implement 9:16 locked viewport shell"
   git push -u origin feat/dev-b-kiosk-viewport
   ```
5. Buat **Pull Request (PR)** di GitHub menuju branch `develop`, lalu beritahu rekan tim untuk me-review dan *merge*.

---

## 4. Bacaan Wajib Sebelum Ngoding
* [**01-PRD.md**](./docs/01-PRD.md): Kebutuhan fitur produk & dukungan akses HP.
* [**02-TRD-ARCHITECTURE.md**](./docs/02-TRD-ARCHITECTURE.md): Cara kerja *Offline-First*, *Double-Buffered Player*, dan *Watchdog*.
* [**04-DATABASE-ERD.md**](./docs/04-DATABASE-ERD.md): Skema tabel PostgreSQL & Prisma.
* [**05-API-CONTRACT.md**](./docs/05-API-CONTRACT.md): Daftar endpoint REST API & SSE.
* [**06-TEAM-WORKFLOW-ROADMAP.md**](./docs/06-TEAM-WORKFLOW-ROADMAP.md): *Checklist* tugas per Fase (Fase 1 s/d Fase 4).
