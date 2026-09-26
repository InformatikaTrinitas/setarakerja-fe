import React, { useRef, useState } from 'react';
import type { Page } from '../types';
import {
  Camera, Save, ArrowLeft, AlertCircle, CheckCircle2,
  Sun, Moon, Monitor, Eye, EyeOff, Volume2, VolumeX,
  HelpCircle, Shield, User, Palette, Accessibility,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { updateProfile as updateProfileApi, uploadAvatar, updateSessionUser, ApiError } from '../lib/api';
import type { Theme } from '../hooks/useTheme';

interface Props {
  onNavigate: (page: Page) => void;
  userRole: 'kandidat' | 'hrd' | null;
  theme: Theme;
  onToggleTheme: () => void;
  blindMode: boolean;
  onToggleBlindMode: () => void;
  isDark: boolean;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, icon, children, cardBg, borderColor, textPrimary }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
}) {
  return (
    <section
      aria-labelledby={`section-${title}`}
      className="rounded-2xl border overflow-hidden"
      style={{ background: cardBg, borderColor }}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor }}>
        <span style={{ color: '#628ECB' }} aria-hidden="true">{icon}</span>
        <h2 id={`section-${title}`} className="font-bold" style={{ color: textPrimary }}>{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ─── Theme option button ─────────────────────────────────────────────────────

function ThemeOption({ value, current, icon, label, desc, onClick, cardBg, borderColor, textPrimary, textSecondary }: {
  value: Theme | 'auto';
  current: Theme | 'auto';
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  cardBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
}) {
  const active = value === current;
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
      style={{
        borderColor: active ? '#395886' : borderColor,
        background: active ? (cardBg === '#1e293b' ? '#1e3a5f' : '#D5DEEF') : cardBg,
      }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: active ? '#395886' : (cardBg === '#1e293b' ? '#334155' : '#F0F3FA'), color: active ? '#fff' : '#628ECB' }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-sm font-bold" style={{ color: active ? '#395886' : textPrimary }}>{label}</span>
      <span className="text-xs text-center" style={{ color: textSecondary }}>{desc}</span>
    </button>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────────────

function ToggleRow({ label, desc, enabled, onToggle, icon, accentColor = '#395886', textPrimary, textSecondary, borderColor }: {
  label: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  accentColor?: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
      style={{ borderColor }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex-shrink-0" style={{ color: enabled ? accentColor : '#8AAEE0' }} aria-hidden="true">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: textPrimary }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{desc}</div>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        className="relative flex-shrink-0 w-12 h-6 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
        style={{ background: enabled ? accentColor : '#D5DEEF' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
          style={{ left: enabled ? 'calc(100% - 1.375rem)' : '0.125rem' }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SettingsPage({
  onNavigate, userRole, theme, onToggleTheme, blindMode, onToggleBlindMode, isDark,
}: Props) {
  const { profile, updateProfile } = useUser();
  const [draft, setDraft] = useState({ ...profile });
  const [validationError, setValidationError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backPage: Page = userRole === 'hrd' ? 'hrd' : userRole === 'kandidat' ? 'kandidat' : 'landing';

  const bg = isDark ? '#0f172a' : '#F0F3FA';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const borderColor = isDark ? '#334155' : '#E8EFF9';
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValidationError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('Ukuran file melebihi 2 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // Pratinjau lokal dulu; file dikirim ke backend saat profil disimpan.
    setPendingFile(file);
    const preview = URL.createObjectURL(file);
    setDraft(prev => ({ ...prev, avatar: preview }));
  };

  const handleSave = async () => {
    setValidationError('');
    try {
      if (pendingFile) {
        setSavedMsg('Mengunggah foto profil ke server…');
        const profile = await uploadAvatar(pendingFile);
        setPendingFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setDraft(prev => ({ ...prev, avatar: profile.avatar }));
        updateProfile({ name: draft.name, title: draft.title, avatar: profile.avatar });
        updateSessionUser({ name: draft.name, title: draft.title, avatar: profile.avatar });
        updateProfileApi({ name: draft.name, title: draft.title }).catch(() => undefined);
        setSavedMsg('Foto profil berhasil diunggah & disimpan!');
      } else {
        updateProfile(draft);
        setSavedMsg('Profil berhasil disimpan!');
        // Sinkronkan ke backend Laravel (gagal tetap dianggap tersimpan lokal).
        updateProfileApi({ name: draft.name, title: draft.title, avatar: draft.avatar || null }).catch(
          () => setValidationError('Tersimpan lokal, tetapi gagal tersinkron ke server.')
        );
      }
    } catch (err: unknown) {
      setSavedMsg('');
      setValidationError(
        err instanceof ApiError ? err.message : 'Foto gagal diunggah ke server. Coba lagi.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPendingFile(null);
      return;
    }
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: bg }}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back */}
        <button
          onClick={() => onNavigate(backPage)}
          className="inline-flex items-center gap-2 text-sm mb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] rounded-lg"
          style={{ color: textSecondary }}
          aria-label="Kembali ke dashboard"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Dashboard
        </button>

        <h1 className="text-3xl font-bold" style={{ color: textPrimary }}>Pengaturan</h1>

        {/* ── Profil ─────────────────────────────────────────────────────── */}
        <Section title="Profil" icon={<User size={18} />} cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary}>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div
                className="w-24 h-24 aspect-square rounded-full overflow-hidden border-4 shadow-md"
                style={{ borderColor: '#D5DEEF', background: '#D5DEEF' }}
                aria-label={draft.avatar ? 'Foto profil Anda' : 'Placeholder foto profil'}
              >
                {draft.avatar ? (
                  <img src={draft.avatar} alt="Foto profil" className="w-full h-full object-cover object-center" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" aria-hidden="true">
                    {draft.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#395886] rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-[#628ECB] transition-colors shadow-sm focus-within:ring-2 focus-within:ring-[#628ECB]"
                aria-label="Unggah foto profil baru"
              >
                <Camera size={14} aria-hidden="true" />
                <input
                  id="avatar-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <p className="text-xs mt-3" style={{ color: textSecondary }}>JPG, PNG, atau WEBP · Maks 2 MB · Foto diunggah ke server saat Anda menekan Simpan</p>
            {validationError && (
              <div role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-xs text-center">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                {validationError}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-semibold mb-1.5" style={{ color: textPrimary }}>
                Nama Lengkap
              </label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={draft.name}
                onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                aria-required="true"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] transition"
                style={{ background: isDark ? '#0f172a' : '#F8FAFF', borderColor, color: textPrimary }}
              />
            </div>
            <div>
              <label htmlFor="profile-title" className="block text-sm font-semibold mb-1.5" style={{ color: textPrimary }}>
                Pekerjaan / Jabatan
              </label>
              <input
                id="profile-title"
                type="text"
                autoComplete="organization-title"
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] transition"
                style={{ background: isDark ? '#0f172a' : '#F8FAFF', borderColor, color: textPrimary }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            {savedMsg ? (
              <span role="status" aria-live="polite" className="flex items-center gap-2 text-sm font-medium" style={{ color: '#628ECB' }}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {savedMsg}
              </span>
            ) : (
              <span className="text-xs" style={{ color: textSecondary }}>
                Perubahan langsung berlaku di semua halaman.
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={!draft.name.trim()}
              className="flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
              style={{ background: '#395886' }}
            >
              <Save size={16} aria-hidden="true" />
              Simpan Perubahan
            </button>
          </div>
        </Section>

        {/* ── Tampilan / Tema ───────────────────────────────────────────── */}
        <Section title="Tampilan" icon={<Palette size={18} />} cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary}>

          <p className="text-sm mb-5" style={{ color: textSecondary }}>
            Pilih tema tampilan. Mode Gelap mengurangi kelelahan mata di lingkungan redup.
          </p>

          <div className="flex gap-3" role="radiogroup" aria-label="Pilih tema tampilan">
            <ThemeOption
              value="light" current={theme}
              icon={<Sun size={20} />}
              label="Terang" desc="Tampilan siang hari"
              onClick={() => theme !== 'light' && onToggleTheme()}
              cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary} textSecondary={textSecondary}
            />
            <ThemeOption
              value="dark" current={theme}
              icon={<Moon size={20} />}
              label="Gelap" desc="Nyaman di malam hari"
              onClick={() => theme !== 'dark' && onToggleTheme()}
              cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary} textSecondary={textSecondary}
            />
            <ThemeOption
              value="auto" current={theme}
              icon={<Monitor size={20} />}
              label="Otomatis" desc="Ikuti sistem"
              onClick={() => { /* auto: use system preference */ }}
              cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary} textSecondary={textSecondary}
            />
          </div>

          {/* Live preview */}
          <div
            className="mt-5 rounded-2xl p-4 border flex items-center gap-4"
            style={{
              background: isDark ? '#0f172a' : '#F0F3FA',
              borderColor,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: isDark ? '#334155' : '#D5DEEF' }}
              aria-hidden="true"
            >
              {isDark ? <Moon size={18} style={{ color: '#8AAEE0' }} /> : <Sun size={18} style={{ color: '#628ECB' }} />}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: isDark ? '#D5DEEF' : '#395886' }}>
                Pratinjau tema: {isDark ? 'Mode Gelap aktif' : 'Mode Terang aktif'}
              </div>
              <div className="text-xs mt-0.5" style={{ color: textSecondary }}>
                Tema berlaku di seluruh halaman SetaraKerja
              </div>
            </div>
          </div>
        </Section>

        {/* ── Aksesibilitas ─────────────────────────────────────────────── */}
        <Section title="Aksesibilitas" icon={<Accessibility size={18} />} cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary}>

          <p className="text-sm mb-4" style={{ color: textSecondary }}>
            Mode aksesibilitas tambahan. Panel aksesibilitas lengkap tersedia melalui tombol di pojok kanan bawah layar.
          </p>

          <ToggleRow
            label="Mode Tunanetra"
            desc="Nada audio memandu posisi kursor. Tombol & tautan diucapkan otomatis saat kursor mendekat."
            enabled={blindMode}
            onToggle={onToggleBlindMode}
            icon={blindMode ? <Eye size={18} /> : <EyeOff size={18} />}
            accentColor="#395886"
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            borderColor={borderColor}
          />

          {blindMode && (
            <div
              className="mt-3 rounded-xl border p-4 text-sm animate-fade-in"
              style={{ background: isDark ? '#0f172a' : '#F0F3FA', borderColor: '#8AAEE0' }}
            >
              <div className="flex items-start gap-2.5">
                <Volume2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#628ECB' }} aria-hidden="true" />
                <div style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>
                  <strong style={{ color: isDark ? '#D5DEEF' : '#395886' }}>Mode Tunanetra Aktif</strong>
                  <ul className="mt-1.5 space-y-1 text-xs list-disc list-inside">
                    <li>Gerakkan kursor — nada berganti mengikuti posisi vertikal (atas = tinggi, bawah = rendah)</li>
                    <li>Kiri/kanan pantulan suara ke speaker yang sesuai</li>
                    <li>Tombol & tautan diucapkan otomatis saat kursor mendekatinya</li>
                    <li>Kursor besar biru muncul sebagai penanda visual</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <ToggleRow
            label="Suara Navigasi"
            desc="Kontrol halaman dengan perintah suara bahasa Indonesia"
            enabled={false}
            onToggle={() => {}}
            icon={<Volume2 size={18} />}
            accentColor="#628ECB"
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            borderColor={borderColor}
          />

          <div className="mt-2 pt-2">
            <button
              onClick={() => onNavigate('help')}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] rounded"
              style={{ color: '#628ECB' }}
            >
              <HelpCircle size={15} aria-hidden="true" />
              Pelajari semua mode aksesibilitas →
            </button>
          </div>
        </Section>

        {/* ── Keamanan ─────────────────────────────────────────────────── */}
        <Section title="Keamanan & Privasi" icon={<Shield size={18} />} cardBg={cardBg} borderColor={borderColor} textPrimary={textPrimary}>
          <div className="space-y-0">
            {[
              {
                label: 'Enkripsi Data',
                desc: 'Identitas Anda dienkripsi AES-256. Tidak ada rekruter yang bisa mengaksesnya tanpa persetujuan Anda.',
                icon: <Shield size={18} />,
                badge: 'Aktif',
                badgeColor: '#395886',
                badgeBg: '#D5DEEF',
              },
              {
                label: 'Audit Log',
                desc: 'Setiap akses ke data Anda dicatat secara permanen dan dapat Anda unduh kapan saja.',
                icon: <VolumeX size={18} />,
                badge: 'Dicatat',
                badgeColor: '#628ECB',
                badgeBg: '#D5DEEF',
              },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 py-4 border-b last:border-b-0"
                style={{ borderColor }}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: '#628ECB' }} aria-hidden="true">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: textPrimary }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{item.desc}</div>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: item.badgeBg, color: item.badgeColor }}
                >
                  {item.badge}
                </span>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
