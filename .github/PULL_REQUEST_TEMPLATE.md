## Ringkasan Perubahan
<!-- Jelaskan secara singkat fitur atau perbaikan yang dikerjakan pada PR ini -->

## Peran & Fase
- [ ] Developer A (Backend / Database / SSE / Docker)
- [ ] Developer B (Admin CMS UI / Kiosk Player 9:16 / Offline Engine)
- **Fase Roadmap:** Fase [1 / 2 / 3 / 4]

## Checklist Kualitas Sebelum Merge
- [ ] Kode saya hanya menyentuh folder milik peran saya (atau perubahan pada `src/types/contracts.ts` sudah disepakati berdua).
- [ ] `npm run typecheck` berjalan tanpa error TypeScript.
- [ ] `npm run build` berhasil.
- [ ] Jika menyentuh UI Admin (`/admin`), sudah dicek tampilannya di ukuran layar Desktop maupun HP (Mobile Responsive).
- [ ] Jika menyentuh Kiosk (`/player`), rasio `9:16` (`1080x1920`) tetap terkunci dan bebas dari kebocoran UI browser.
