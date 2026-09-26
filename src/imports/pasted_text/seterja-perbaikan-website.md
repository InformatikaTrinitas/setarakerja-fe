# TUGAS: PERBAIKI WEBSITE SETARAKERJA

Website ini untuk lomba Web Development SWITCHFEST 2026.
Tema: "NextGen Secure: Building the Future of Trusted Web Ecosystems"
Tim: 3 orang, waktu terbatas. FOKUS.

================================================================================
KONSEP
================================================================================

SetaraKerja = platform blind hiring untuk penyandang disabilitas Indonesia.
Fokus MVP: Tunarungu & Tunadaksa.
Tujuan: Kerja berdasarkan SKILL, bukan FISIK.

================================================================================
YANG HARUS DIPERBAIKI — PRIORITAS 1: FUNDAMENTAL
================================================================================

1. GANTI BAHASA HALAMAN
   - <html lang="en"> → <html lang="id">

2. GANTI JUDUL HALAMAN (per halaman, unik)
   - Landing: "SetaraKerja — Kerja Berdasarkan Skill, Bukan Fisik"
   - Login: "Masuk — SetaraKerja"
   - Dashboard Kandidat: "Dashboard Kandidat — SetaraKerja"
   - Dashboard HRD: "Dashboard HRD — SetaraKerja"
   - Sign Language: "Latihan BISINDO — SetaraKerja"

3. TAMBAHKAN META DESCRIPTION
   "Platform blind hiring untuk penyandang disabilitas Indonesia. 
   Kerja berdasarkan skill, bukan fisik. Aksesibel WCAG 2.2 AA."

4. SEMANTIC HTML + ARIA LANDMARKS
   <header role="banner">
   <nav role="navigation" aria-label="Menu utama">
   <main id="main" role="main">
   <footer role="contentinfo">

5. SKIP TO CONTENT LINK
   - Muncul saat di-focus pakai Tab.
   - Teks: "Lewati ke konten utama".

================================================================================
PRIORITAS 2: AKSESIBILITAS (BOBOT JURI 25%)
================================================================================

1. KONTRAS WARNA — WCAG 2.2 AA
   - Semua teks minimal 4.5:1
   - Tombol & form minimal 3:1
   - Jangan pakai warna sebagai satu-satunya indikator

2. KEYBOARD NAVIGATION
   - Semua elemen interactive bisa di-Tab
   - Focus state terlihat (outline 2px #2563EB, offset 2px)
   - Urutan Tab logis
   - Modal punya focus trap, Esc untuk close

3. FORM ACCESSIBILITY
   - Semua input punya <label> eksplisit
   - Error message via aria-describedby
   - Required field pakai aria-required="true"

4. IMAGE & ICON
   - Semua <img> punya alt text
   - Icon button punya aria-label
   - Decorative image: alt="" atau aria-hidden="true"

5. ARIA LIVE REGIONS
   - Notifikasi: role="status" atau aria-live="polite"
   - Error: role="alert" atau aria-live="assertive"

6. TOGGLE MODE AKSESIBILITAS (floating button kanan bawah)
   - Mode Suara (Web Speech API)
   - Mode High Contrast
   - Mode Keyboard-Only
   - Mode Sign Language (kamera)
   - Mode Tenang (animasi minimal)
   Tersimpan di localStorage, accessible via keyboard.

================================================================================
PRIORITAS 3: VISUAL & UI/UX
================================================================================

1. HERO LANDING PAGE
   - Headline: "Skill dulu. Baru fisik. Baru nama."
   - Sub: "Platform blind hiring untuk 22 juta difabel Indonesia."
   - CTA: "Mulai sebagai Kandidat" | "Mulai sebagai Perusahaan"

2. STATISTIK (3 angka besar, ada sumber)
   - 22,97 juta — Penyandang disabilitas Indonesia
   - 7,6% — Yang bekerja formal
   - 0,4% — Kuota UU 8/2016 terpenuhi
   Sumber: "BPS 2023, Cornell 2022"

3. SECTION 4 LAPIS EKOSISTEM
   4 card dengan icon + judul + deskripsi 1-2 baris:
   - Lapis 1: Sebelum Kerja
   - Lapis 2: Saat Melamar
   - Lapis 3: Setelah Kerja
   - Lapis 4: Wirausaha

4. SECTION TESTIMONI/PERSONA
   - 2-3 persona: Rina (tunanetra), Bagas (tunadaksa), Bu Sari (tunarungu)
   - Format: foto/illustration + quote + status

5. SECTION KEAMANAN (WAJIB — tema NextGen Secure)
   - Zero-Knowledge Vault: "Data medis Anda dienkripsi AES-256."
   - Identity Masking: "HRD hanya lihat skill. Identitas terlindungi."
   - Blockchain Verification: "Sertifikat & skill passport anti-palsu."
   - Verifikasi Berlapis: "Dokter + komunitas difabel + blockchain."

6. DESIGN SYSTEM
   - Primary: #2563EB
   - Font: Inter (default), OpenDyslexic (toggle)
   - Radius: 12px
   - Shadow: subtle
   - Spacing: 4/8/16/24/32/48px
   - Animasi: minimal, respect prefers-reduced-motion

7. RESPONSIVE
   - Mobile-first. Test 320px, 768px, 1024px, 1440px.
   - Navigation collapse jadi hamburger di mobile.
   - Font scaling 200% tanpa break layout.
   - Tidak ada horizontal scroll.

================================================================================
PRIORITAS 4: FITUR INTI (BUKTI BUKAN TEMPLATE)
================================================================================

1. HALAMAN SIGN LANGUAGE (/sign-language)
   - Kamera live (getUserMedia)
   - MediaPipe Holistic deteksi tangan
   - TensorFlow.js klasifikasi BISINDO → teks
   - Kamus 20 kata: halo, terima kasih, saya, mau, kerja, bisa, tidak, 
     ya, nama, siapa, tolong, bantu, apa, di mana, kapan, bagaimana, 
     maaf, permisi, selamat, pagi.
   - Fallback kalau kamera error.

2. DASHBOARD HRD
   - List kandidat MASKED: "#A7F3 | Python 87 | UI/UX 92 | Trust 98%"
   - TANPA nama, foto, jenis disabilitas.
   - Filter by skill.
   - Tombol "Request Interview" → modal konfirmasi.
   - Setelah approve: identitas dibuka + akomodasi ditampilkan.
   - Compliance dashboard UU 8/2016 (progress bar).

3. DASHBOARD KANDIDAT
   - Upload portofolio (drag & drop)
   - AI analyze → tampil skor
   - Skill Passport card (anonim)
   - Toggle "Mode Anonim"

4. HALAMAN INTERVIEW
   - 5 mode: voice-only, text-only, sign language, video+caption, async
   - Live caption mock (Web Speech API)
   - Panel akomodasi

================================================================================
PRIORITAS 5: KEAMANAN (TEMA NEXTGEN SECURE)
================================================================================

Tampilkan di UI:
1. Badge "Terenkripsi AES-256" di form upload
2. Icon gembok di samping data sensitif
3. Halaman "Keamanan" yang jelasin:
   - Zero-Knowledge Vault
   - Identity Masking
   - Blockchain Verification
   - Verifikasi Berlapis (3 lapis)
4. Tooltip: "Data ini dienkripsi di perangkat Anda sebelum dikirim."

================================================================================
ATURAN KODE
================================================================================

- TypeScript strict, no any
- Error handling lengkap
- Loading: skeleton
- Empty state: pesan membantu
- Comments Bahasa Indonesia untuk logic penting
- Test axe-core (target >90)
- Test keyboard-only (cabut mouse)
- Test screen reader (NVDA/VoiceOver)
- Test 200% zoom
- Test responsive 4 breakpoint

================================================================================
YANG DILARANG
================================================================================

- JANGAN ubah konsep inti (blind hiring untuk difabel)
- JANGAN hapus fitur inti
- JANGAN pakai foto muka untuk verifikasi
- JANGAN simpan data medis mentah
- JANGAN pakai template jadi / WordPress
- JANGAN lupa alt text & aria-label
- JANGAN pakai warna sebagai satu-satunya indikator
- JANGAN lupa lang="id"

================================================================================
OUTPUT
================================================================================

Perbaiki website sekarang. Urutan:
1. Fundamental (lang, title, meta, semantic HTML)
2. Aksesibilitas (kontras, keyboard, ARIA)
3. Visual (hero, statistik, 4 lapis, testimoni, keamanan)
4. Fitur inti (sign language, dashboard HRD, blind hiring)
5. Keamanan (NextGen Secure)

Setelah selesai, kasih checklist:
- [ ] lang="id"
- [ ] Title unik per halaman
- [ ] Meta description
- [ ] Semantic HTML + ARIA landmarks
- [ ] Skip to content
- [ ] Kontras WCAG 2.2 AA
- [ ] Keyboard navigable
- [ ] Form accessible
- [ ] Alt text semua image
- [ ] ARIA live regions
- [ ] Accessibility toggle (5 mode)
- [ ] Hero landing page
- [ ] Statistik dengan sumber
- [ ] 4 lapis ekosistem section
- [ ] Testimoni/persona
- [ ] Halaman keamanan
- [ ] Sign language demo
- [ ] Dashboard HRD masked
- [ ] Responsive 4 breakpoint
- [ ] axe-core >90

Gas. Eksekusi.