import React, { useState } from 'react';
import {
  ArrowLeft, Search, ChevronDown, ChevronUp,
  BookOpen, Shield, Users, Keyboard, MessageCircle,
  Zap, Eye, Volume2, Accessibility, HelpCircle,
  FileText, Lock, Globe, Phone, Mail, ExternalLink,
} from 'lucide-react';
import type { Page } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
  userRole: 'kandidat' | 'hrd' | null;
  isDark: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

interface FaqItem { q: string; a: string }
interface FaqSection { id: string; icon: React.ReactNode; title: string; items: FaqItem[] }

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'akun',
    icon: <Users size={20} />,
    title: 'Akun & Profil',
    items: [
      {
        q: 'Bagaimana cara mendaftar di SetaraKerja?',
        a: 'Klik tombol "Daftar" di halaman utama, pilih peran Anda (Kandidat atau HRD/Perusahaan), isi formulir pendaftaran, lalu verifikasi email Anda. Seluruh proses gratis dan hanya membutuhkan waktu kurang dari 5 menit.',
      },
      {
        q: 'Apa itu Mode Anonim dan mengapa penting?',
        a: 'Mode Anonim menyembunyikan identitas Anda (nama, foto, informasi pribadi) dari rekruter selama proses awal seleksi. Rekruter hanya melihat Kode Kandidat acak dan skor keahlian Anda. Ini memastikan Anda dinilai berdasarkan kemampuan, bukan disabilitas atau latar belakang Anda.',
      },
      {
        q: 'Bagaimana cara mengubah foto profil atau nama saya?',
        a: 'Buka menu Pengaturan (ikon roda gigi di sidebar), lalu klik bagian "Profil". Anda dapat mengunggah foto baru (JPG/PNG/WEBP, maks 2 MB) dan mengubah nama atau jabatan Anda. Klik "Simpan Perubahan" untuk memperbarui.',
      },
      {
        q: 'Apakah akun saya bisa dihapus?',
        a: 'Ya. Buka Pengaturan → Privasi, lalu klik "Hapus Akun". Seluruh data Anda termasuk Skill Passport dan riwayat lamaran akan dihapus secara permanen sesuai kebijakan privasi kami dan UU Perlindungan Data Pribadi.',
      },
    ],
  },
  {
    id: 'lamaran',
    icon: <FileText size={20} />,
    title: 'Lamaran & Pekerjaan',
    items: [
      {
        q: 'Apa itu Skill Passport?',
        a: 'Skill Passport adalah portofolio keahlian digital Anda yang dianalisis oleh AI dan disimpan di blockchain Polygon. Setiap keahlian diberi skor 0–100 berdasarkan portofolio yang Anda unggah. Rekruter melihat Skill Passport Anda tanpa mengetahui identitas Anda.',
      },
      {
        q: 'Bagaimana cara melamar pekerjaan?',
        a: 'Di halaman Cari Kerja, temukan lowongan yang sesuai. Klik "Ajukan Lamaran" — sistem akan otomatis mengirimkan Skill Passport anonim Anda kepada rekruter. Anda bisa memantau status lamaran di halaman "Status Lamaran".',
      },
      {
        q: 'Apa yang terjadi setelah rekruter meminta interview?',
        a: 'Anda akan menerima notifikasi di dashboard. Rekruter baru bisa melihat identitas Anda setelah Anda juga menyetujui pengungkapan dari sisi Anda. Sistem mencatat semua persetujuan ini dalam Audit Log yang tidak dapat dimanipulasi.',
      },
      {
        q: 'Bagaimana jika saya membutuhkan akomodasi khusus untuk interview?',
        a: 'Di halaman Interview, pilih mode yang sesuai: teks saja, suara saja, video dengan teks, atau video asinkronus. Anda juga dapat meminta akomodasi tambahan melalui fitur chat dengan rekruter.',
      },
    ],
  },
  {
    id: 'a11y',
    icon: <Accessibility size={20} />,
    title: 'Aksesibilitas',
    items: [
      {
        q: 'Mode aksesibilitas apa saja yang tersedia?',
        a: 'SetaraKerja menyediakan: (1) Kontras Tinggi untuk pengguna low vision, (2) Font Disleksia (OpenDyslexic), (3) Mode Tenang untuk mengurangi animasi, (4) Navigasi Suara dengan perintah bahasa Indonesia, dan (5) Mode Tunanetra dengan panduan audio berbasis posisi kursor.',
      },
      {
        q: 'Bagaimana cara mengaktifkan Mode Tunanetra?',
        a: 'Buka Pengaturan → Aksesibilitas → aktifkan "Mode Tunanetra". Setelah aktif, gerakkan kursor Anda untuk mendengar nada panduan — nada lebih tinggi berarti posisi lebih atas di layar, suara dari kiri/kanan menunjukkan posisi horizontal. Tombol dan tautan akan diucapkan secara otomatis.',
      },
      {
        q: 'Apakah SetaraKerja kompatibel dengan screen reader?',
        a: 'Ya. Platform ini dirancang memenuhi standar WCAG 2.2 AA dengan ARIA labels, live regions, dan urutan fokus keyboard yang benar. Kompatibel dengan NVDA, JAWS, VoiceOver (macOS/iOS), dan TalkBack (Android).',
      },
      {
        q: 'Bagaimana cara menggunakan navigasi keyboard?',
        a: 'Gunakan Tab untuk berpindah antar elemen interaktif, Enter/Spasi untuk mengaktifkan tombol, Escape untuk menutup dialog. Shortcut angka (1–4) tersedia untuk navigasi cepat antar halaman. Tekan "?" untuk melihat semua shortcut.',
      },
    ],
  },
  {
    id: 'privasi',
    icon: <Shield size={20} />,
    title: 'Privasi & Keamanan',
    items: [
      {
        q: 'Bagaimana data saya dienkripsi?',
        a: 'Identitas dan data pribadi Anda dienkripsi menggunakan AES-256 sebelum disimpan. Skill Passport disimpan di blockchain Polygon yang tidak dapat diubah atau dihapus tanpa sepengetahuan Anda. Semua transmisi data menggunakan TLS 1.3.',
      },
      {
        q: 'Apakah rekruter bisa melihat disabilitas saya dari awal?',
        a: 'Tidak. Dalam proses blind hiring, rekruter tidak melihat nama, foto, atau informasi disabilitas Anda. Informasi ini hanya terungkap jika KEDUA belah pihak (Anda dan rekruter) menyetujui pengungkapan setelah tahap interview.',
      },
      {
        q: 'Apa itu Audit Log?',
        a: 'Audit Log adalah catatan permanen yang merekam setiap aksi terkait data Anda — kapan rekruter melihat profil, kapan identitas terungkap, dan siapa yang terlibat. Log ini tidak bisa dihapus dan tersedia untuk Anda unduh kapan saja.',
      },
    ],
  },
];

const KEYBOARD_SHORTCUTS = [
  { key: '1', action: 'Buka Beranda' },
  { key: '2', action: 'Buka Halaman Masuk' },
  { key: '3', action: 'Buka Pendaftaran' },
  { key: '4', action: 'Buka Dashboard' },
  { key: 'Tab', action: 'Pindah ke elemen berikutnya' },
  { key: 'Shift+Tab', action: 'Pindah ke elemen sebelumnya' },
  { key: 'Enter / Spasi', action: 'Aktifkan tombol / tautan' },
  { key: 'Escape', action: 'Tutup dialog / modal' },
  { key: '?', action: 'Tampilkan panduan shortcut' },
  { key: 'Alt+A', action: 'Buka panel aksesibilitas' },
];

const QUICK_TOPICS = [
  { icon: <BookOpen size={22} />, label: 'Panduan Mulai', sub: 'Baru di SetaraKerja?', color: '#628ECB', bg: '#D5DEEF' },
  { icon: <Shield size={22} />, label: 'Keamanan & Privasi', sub: 'Enkripsi & blind hiring', color: '#395886', bg: '#B1C9EF' },
  { icon: <Accessibility size={22} />, label: 'Aksesibilitas', sub: '5 mode tersedia', color: '#8AAEE0', bg: '#D5DEEF' },
  { icon: <Volume2 size={22} />, label: 'Navigasi Suara', sub: 'Panduan suara', color: '#395886', bg: '#B1C9EF' },
];

// ─── Accordion Item ────────────────────────────────────────────────────────────

function AccordionItem({ q, a, isDark }: FaqItem & { isDark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b last:border-b-0 transition-colors"
      style={{ borderColor: isDark ? '#334155' : '#E8EFF9' }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] rounded-lg px-1"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold" style={{ color: isDark ? '#D5DEEF' : '#395886' }}>{q}</span>
        <span className="flex-shrink-0" style={{ color: '#8AAEE0' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div
          className="pb-4 px-1 text-sm leading-relaxed animate-fade-in"
          style={{ color: isDark ? '#94a3b8' : '#4b5563' }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function HelpPage({ onNavigate, userRole, isDark }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const backPage: Page = userRole === 'hrd' ? 'hrd' : userRole === 'kandidat' ? 'kandidat' : 'landing';

  const filteredSections = FAQ_SECTIONS.map(section => ({
    ...section,
    items: searchQuery.trim()
      ? section.items.filter(
          item =>
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : section.items,
  })).filter(s => s.items.length > 0);

  const bg = isDark ? '#0f172a' : '#F0F3FA';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#E8EFF9';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="min-h-screen" style={{ background: bg, color: textPrimary }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #395886 0%, #628ECB 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <button
            onClick={() => onNavigate(backPage)}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg"
            aria-label="Kembali ke dashboard"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Kembali
          </button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <HelpCircle size={13} aria-hidden="true" />
                Pusat Bantuan
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">
                Bagaimana kami bisa<br />membantu Anda?
              </h1>
              <p className="text-blue-200 text-sm">
                Temukan jawaban, panduan, dan dokumentasi lengkap SetaraKerja.
              </p>
            </div>

            {/* Search */}
            <div className="relative sm:w-72 flex-shrink-0">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Cari pertanyaan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Cari pertanyaan di pusat bantuan"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              />
            </div>
          </div>

          {/* Quick topic pills */}
          <div className="flex flex-wrap gap-3 mt-8">
            {QUICK_TOPICS.map(t => (
              <button
                key={t.label}
                onClick={() => {
                  const el = document.getElementById('faq-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span aria-hidden="true">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Quick cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {QUICK_TOPICS.map(t => (
            <div
              key={t.label}
              className="rounded-2xl border p-5 cursor-default hover:shadow-md transition-all"
              style={{ background: cardBg, borderColor }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: t.bg, color: t.color }}
                aria-hidden="true"
              >
                {t.icon}
              </div>
              <div className="text-sm font-semibold" style={{ color: textPrimary }}>{t.label}</div>
              <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{t.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left: FAQ ─────────────────────────────────────────────────── */}
          <div id="faq-section" className="lg:col-span-2 space-y-5">
            <h2 className="text-2xl font-bold" style={{ color: textPrimary }}>
              {searchQuery ? `Hasil untuk "${searchQuery}"` : 'Pertanyaan yang Sering Diajukan'}
            </h2>

            {filteredSections.length === 0 && (
              <div
                className="rounded-2xl border p-8 text-center"
                style={{ background: cardBg, borderColor }}
              >
                <Search size={32} className="mx-auto mb-3" style={{ color: '#8AAEE0' }} aria-hidden="true" />
                <p className="font-semibold" style={{ color: textPrimary }}>Tidak ada hasil ditemukan</p>
                <p className="text-sm mt-1" style={{ color: textSecondary }}>
                  Coba kata kunci lain atau hubungi tim kami di bawah.
                </p>
              </div>
            )}

            {filteredSections.map(section => (
              <section
                key={section.id}
                aria-labelledby={`section-${section.id}`}
                className="rounded-2xl border overflow-hidden"
                style={{ background: cardBg, borderColor }}
              >
                <button
                  id={`section-${section.id}`}
                  className="w-full flex items-center justify-between gap-3 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
                  onClick={() => setActiveSection(a => a === section.id ? null : section.id)}
                  aria-expanded={activeSection === section.id || !!searchQuery}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#D5DEEF', color: '#395886' }}
                      aria-hidden="true"
                    >
                      {section.icon}
                    </div>
                    <span className="font-bold text-base" style={{ color: isDark ? '#D5DEEF' : '#395886' }}>
                      {section.title}
                    </span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#D5DEEF', color: '#628ECB' }}
                    >
                      {section.items.length}
                    </span>
                  </div>
                  <span style={{ color: '#8AAEE0' }} aria-hidden="true">
                    {(activeSection === section.id || !!searchQuery) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {(activeSection === section.id || !!searchQuery) && (
                  <div className="px-5 pb-2 border-t" style={{ borderColor }}>
                    {section.items.map((item, i) => (
                      <AccordionItem key={i} {...item} isDark={isDark} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* ── Right: shortcuts + contact ─────────────────────────────── */}
          <div className="space-y-5">

            {/* Keyboard shortcuts */}
            <section
              aria-labelledby="shortcuts-heading"
              className="rounded-2xl border overflow-hidden"
              style={{ background: cardBg, borderColor }}
            >
              <div className="p-5 border-b" style={{ borderColor }}>
                <h3
                  id="shortcuts-heading"
                  className="font-bold flex items-center gap-2"
                  style={{ color: isDark ? '#D5DEEF' : '#395886' }}
                >
                  <Keyboard size={17} aria-hidden="true" />
                  Shortcut Keyboard
                </h3>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>
                  Navigasi cepat tanpa mouse
                </p>
              </div>
              <div className="p-4">
                <table className="w-full text-xs" aria-label="Daftar shortcut keyboard">
                  <tbody className="divide-y" style={{ borderColor }}>
                    {KEYBOARD_SHORTCUTS.map(s => (
                      <tr key={s.key}>
                        <td className="py-2.5 pr-3 font-mono font-bold w-1/3" style={{ color: '#628ECB' }}>
                          {s.key}
                        </td>
                        <td className="py-2.5" style={{ color: textSecondary }}>
                          {s.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Contact support */}
            <section
              aria-labelledby="contact-heading"
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #395886 0%, #628ECB 100%)', borderColor: 'transparent' }}
            >
              <div className="p-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                  aria-hidden="true"
                >
                  <MessageCircle size={20} className="text-white" />
                </div>
                <h3 id="contact-heading" className="font-bold text-white mb-1">
                  Butuh Bantuan Lebih?
                </h3>
                <p className="text-blue-200 text-xs mb-5">
                  Tim kami siap membantu dalam bahasa Indonesia maupun bahasa isyarat.
                </p>

                <div className="space-y-3">
                  <a
                    href="mailto:bantuan@setarakerja.id"
                    className="flex items-center gap-3 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-3 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Kirim email ke bantuan@setarakerja.id"
                  >
                    <Mail size={15} aria-hidden="true" />
                    bantuan@setarakerja.id
                  </a>
                  <a
                    href="tel:+62800-SETARA"
                    className="flex items-center gap-3 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-3 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Hubungi hotline 0800-SETARA"
                  >
                    <Phone size={15} aria-hidden="true" />
                    0800-SETARA (gratis)
                  </a>
                  <button
                    className="w-full flex items-center gap-3 bg-white/15 hover:bg-white/25 rounded-xl px-4 py-3 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Buka live chat"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    Live Chat (Sen–Jum, 08–17)
                  </button>
                </div>

                <div className="mt-5 pt-5 border-t border-white/20">
                  <p className="text-blue-200 text-xs mb-2">Sumber lainnya</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Kebijakan Privasi', icon: <Lock size={13} /> },
                      { label: 'Laporan Aksesibilitas WCAG', icon: <ExternalLink size={13} /> },
                    ].map(l => (
                      <button
                        key={l.label}
                        className="w-full flex items-center gap-2 text-xs text-blue-200 hover:text-white py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
                        aria-label={l.label}
                      >
                        <span aria-hidden="true">{l.icon}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Shortcut to settings */}
            <button
              onClick={() => onNavigate('settings')}
              className="w-full flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
              style={{ background: cardBg, borderColor, color: isDark ? '#D5DEEF' : '#395886' }}
            >
              <Zap size={16} style={{ color: '#628ECB' }} aria-hidden="true" />
              Buka Pengaturan Aksesibilitas
              <ExternalLink size={13} className="ml-auto" style={{ color: '#8AAEE0' }} aria-hidden="true" />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
