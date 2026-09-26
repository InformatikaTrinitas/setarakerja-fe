import React, { useEffect, useId, useRef, useState } from 'react';

import {
  Upload,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Briefcase,
  Hash,
  Cpu,
  AlertTriangle,
  FileText,
  Star,
  MapPin,
  TrendingUp,
  Zap,
  Accessibility,
  RefreshCw,
} from 'lucide-react';
import type { Application, Page, SkillScore } from '../types';
import { generateAnonymousId } from '../lib/encryption';
import {
  ApiError,
  fetchJobs,
  fetchMyApplications,
  fetchPortfolios,
  fetchSkills,
  getSessionUser,
  uploadPortfolio,
  type PassportSkill,
} from '../lib/api';
import { useUser } from '../contexts/UserContext';

interface Props { onNavigate: (page: Page) => void; }

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<Application['status'], { label: string; icon: React.FC<{ size: number }>; color: string; bg: string }> = {
  applied:             { label: 'Terkirim',         icon: Clock,         color: '#64748b', bg: '#f1f5f9' },
  screening:           { label: 'Diseleksi',        icon: Eye,           color: '#628ECB', bg: 'var(--color-surface)' },
  interview_requested: { label: 'Interview Diminta',icon: Bell,          color: '#395886', bg: 'var(--color-surface-2)' },
  interview_scheduled: { label: 'Terjadwal',        icon: CheckCircle2,  color: '#395886', bg: 'var(--color-surface)' },
  hired:               { label: 'Diterima',      icon: Star,          color: '#fff',    bg: '#395886' },
  rejected:            { label: 'Tidak Dilanjutkan',icon: XCircle,       color: '#ef4444', bg: '#fee2e2' },
};

function SkillBar({ skill, score }: SkillScore) {
  const color = score >= 90 ? '#628ECB' : score >= 75 ? '#395886' : '#8AAEE0';
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 flex-shrink-0 text-xs font-medium text-right truncate" style={{ color: '#628ECB' }}>{skill}</span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--color-surface)' }}
        role="progressbar"
        aria-label={`${skill}: ${score} dari 100`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, #395886, ${color})` }}
        />
      </div>
      <span
        className="w-9 flex-shrink-0 text-xs font-bold tabular-nums text-right"
        style={{ color, fontFamily: 'var(--font-mono)' }}
      >
        {score}
      </span>
    </div>
  );
}

function ApplicationRow({ app, onNavigate }: { app: Application; onNavigate: (page: Page) => void }) {
  const { label, icon: Icon, color, bg } = STATUS_MAP[app.status];
  const isActionable = app.status === 'interview_requested';

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm"
      style={{
        borderColor: isActionable ? 'var(--color-border)' : 'var(--color-surface-alt)',
        background: isActionable ? 'var(--color-bg)' : 'var(--color-card-bg)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-surface)' }}
        aria-hidden="true"
      >
        <Briefcase size={16} style={{ color: '#628ECB' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{app.jobTitle}</div>
        <div className="text-xs mt-0.5" style={{ color: '#8AAEE0' }}>
          {app.company} · {new Date(app.appliedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: bg, color }}
        >
          <Icon size={11} aria-hidden="true" />
          {label}
        </span>
        {isActionable && (
          <button
            onClick={() => onNavigate('interview')}
            className="text-xs text-white px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ background: '#395886' }}
          >Lihat Detail</button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/** Bentuk lamaran dari API: Application + nilai match & skor skill. */
type ApiApplication = Application & { skillScores?: SkillScore[] };
type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  accessible: boolean;
  postedDays?: number;
};

/** Berkas portofolio dari backend (GET /api/portfolios). */
type PortfolioFile = { id: string; name: string; size: number; url?: string; uploadedAt?: string | null };

const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function KandidatDashboard({ onNavigate }: Props) {
  const { profile } = useUser();
  const [anonymousId] = useState(() => generateAnonymousId());
  const [isMasked, setIsMasked] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<{ id: string; name: string; progress: number; done: boolean }[]>([]);
  const [notification, setNotification] = useState('');
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apps, setApps] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [recommended, setRecommended] = useState<RecommendedJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [passportSkills, setPassportSkills] = useState<PassportSkill[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);

  /** Muat daftar portofolio milik kandidat dari backend. */
  const refreshPortfolios = () => {
    fetchPortfolios()
      .then(files => setPortfolios(Array.isArray(files) ? (files as PortfolioFile[]) : []))
      .catch(() => undefined);
  };

  // Ambil semua data dashboard dari backend Laravel.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.allSettled([fetchMyApplications(), fetchJobs(), fetchSkills()])
      .then(([appsRes, jobsRes, skillsRes]) => {
        if (cancelled) return;

        if (appsRes.status === 'fulfilled') {
          const list = (Array.isArray(appsRes.value) ? appsRes.value : []) as ApiApplication[];
          setApps(list);
          const waiting = list.find(a => a.status === 'interview_requested');
          if (waiting) setNotification(`${waiting.company} meminta interview. Identitas Anda diminta untuk dibuka.`);
        } else {
          setApps([]);
          const err: unknown = appsRes.reason;
          setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat lamaran dari server.');
        }

        if (jobsRes.status === 'fulfilled') {
          const allJobs = (Array.isArray(jobsRes.value) ? jobsRes.value : []) as RecommendedJob[];
          setTotalJobs(allJobs.length);
          setRecommended(allJobs.slice(0, 3));
        } else {
          setTotalJobs(0);
          setRecommended([]);
        }

        setPassportSkills(
          skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value) ? skillsRes.value : []
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    refreshPortfolios();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Skill Passport: sumber utama tabel skills; fallback skor skill di lamaran.
  const skills = React.useMemo(() => {
    if (passportSkills.length > 0) {
      return passportSkills
        .filter(s => s.skill)
        .map(s => ({ skill: s.skill, score: s.score, verifiedAt: s.verifiedAt ?? '' }))
        .sort((a, b) => b.score - a.score);
    }
    const map = new Map<string, SkillScore>();
    apps.forEach(a =>
      (a.skillScores ?? []).forEach(s => {
        if (!s.skill) return;
        const prev = map.get(s.skill);
        if (!prev || s.score > prev.score) map.set(s.skill, s);
      })
    );
    return [...map.values()].sort((a, b) => b.score - a.score);
  }, [passportSkills, apps]);

  const interviewCount = apps.filter(a => a.status === 'interview_requested').length;

  /** Unggah portofolio ke backend, tampilkan progres, lalu muat ulang daftar. */
  const uploadFile = async (file: File) => {
    const id = `${Date.now()}-${file.name}`;
    setUploadError(null);
    setUploadDone(false);
    setUploads(prev => [...prev, { id, name: file.name, progress: 0, done: false }]);

    const advance = setInterval(() => {
      setUploads(prev =>
        prev.map(u => (u.id === id && !u.done ? { ...u, progress: Math.min(u.progress + 15, 95) } : u))
      );
    }, 150);

    try {
      await uploadPortfolio(file);
      clearInterval(advance);
      setUploads(prev => prev.map(u => (u.id === id ? { ...u, progress: 100, done: true } : u)));
      setUploadDone(true);
      refreshPortfolios();
    } catch (err: unknown) {
      clearInterval(advance);
      setUploads(prev => prev.filter(u => u.id !== id));
      setUploadError(err instanceof ApiError ? err.message : 'Gagal mengunggah portofolio. Coba lagi.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(uploadFile);
    e.target.value = '';
  };

  const session = getSessionUser();
  const displayName = isMasked ? `Kandidat ${anonymousId}` : (profile.name || 'Kandidat');
  const identityDetail = isMasked
    ? 'Identitas disembunyikan selama proses blind hiring'
    : [session?.title || profile.title, session?.disabilityType].filter(Boolean).join(' · ');

  return (
    <div className="min-h-full pb-10" style={{ background: 'var(--color-bg)' }}>

      {/* ── Notification banner ──────────────────────────────────────────── */}
      {notification && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-4 px-5 sm:px-8 py-3"
          style={{ background: 'linear-gradient(90deg, #395886 0%, #628ECB 100%)' }}
        >
          <p className="text-sm font-medium text-white flex items-center gap-2 min-w-0 truncate">
            <Bell size={15} aria-hidden="true" className="flex-shrink-0" />
            {notification}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('interview')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[30px]"
              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >Lihat Detail</button>
            <button
              onClick={() => setNotification('')}
              aria-label="Tutup notifikasi"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XCircle size={16} className="text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">

        {/* ── Welcome hero ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-7 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #395886 0%, #628ECB 100%)' }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: '#fff' }}
            aria-hidden="true"
          />
          <div
            className="absolute right-24 -bottom-16 w-32 h-32 rounded-full opacity-10"
            style={{ background: '#fff' }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-[1.2] text-white mb-2" >
                Selamat datang kembali
              </h1>
              <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Identitas aktif:{' '}
                <strong className="text-white font-mono">{displayName}</strong>
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {apps.filter(a => a.status === 'interview_requested').length} interview menunggu respons Anda hari ini.
              </p>
            </div>
            <button
              onClick={() => setIsMasked(m => !m)}
              aria-pressed={isMasked}
              aria-label={isMasked ? 'Nonaktifkan mode anonim' : 'Aktifkan mode anonim'}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all min-h-[48px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 flex-shrink-0 self-start sm:self-auto"
              style={{
                background: isMasked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)',
                color: isMasked ? '#fff' : '#395886',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              {isMasked ? <Lock size={16} aria-hidden="true" /> : <Unlock size={16} aria-hidden="true" />}
              {isMasked ? 'Mode Anonim Aktif' : 'Identitas Terbuka'}
            </button>
          </div>
        </div>

        {/* ── Quick stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
                {[
                  { label: 'Total Lamaran', value: apps.length.toString(), icon: Briefcase, accent: '#395886' },
                  { label: 'Interview Aktif', value: interviewCount.toString(), icon: Bell, accent: '#628ECB' },
                  { label: 'Skill Passport', value: skills.length > 0 ? `${skills.length} skill` : '—', icon: Zap, accent: '#8AAEE0' },
                ].map(({ label, value, icon: Icon, accent }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border transition-all hover:shadow-md"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--color-bg)' }}
                  aria-hidden="true"
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums leading-none mb-1" style={{ color: accent, fontFamily: 'var(--font-mono)' }}>
                {value}
              </div>
              <div className="text-xs font-medium" style={{ color: '#8AAEE0' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Skill Passport card */}
            <section
              aria-labelledby="passport-heading"
              className="bg-white rounded-2xl border p-6 flex-shrink-0"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="passport-heading"
                  className="text-lg md:text-xl font-semibold flex items-center gap-2"
                  style={{ color: '#8AAEE0' }}
                >
                  <Hash size={13} aria-hidden="true" />
                  Skill Passport
                </h2>
                <button
                  onClick={() => onNavigate('kandidat-passport')}
                  className="text-xs font-semibold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                  style={{ color: '#628ECB' }}
                >
                  Lihat semua <ChevronRight size={13} aria-hidden="true" />
                </button>
              </div>

              {/* Skill summary */}
              <div
                className="mb-5 p-4 rounded-2xl text-xs flex items-center justify-between gap-3"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-surface)', color: '#8AAEE0' }}
              >
                {skills.length > 0 ? (
                  <span>
                    <span className="font-bold" style={{ color: '#395886' }}>{skills.length} skill</span> terdaftar di Skill Passport kamu.
                  </span>
                ) : (
                  <span>Belum ada skill. Lamar lowongan untuk mengisi Skill Passport.</span>
                )}
                <CheckCircle2 size={14} style={{ color: '#628ECB' }} aria-hidden="true" />
              </div>

              <div className="space-y-3.5">
                {skills.length > 0
                  ? skills.map(s => <SkillBar key={s.skill} {...s} />)
                  : <p className="text-xs" style={{ color: '#8AAEE0' }}>Belum ada skill terverifikasi.</p>}
              </div>
            </section>

            {/* Profile card */}
            <section
              aria-labelledby="profile-heading"
              className="bg-white rounded-2xl border p-6 flex-shrink-0"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <h2 id="profile-heading" className="sr-only">Profil kandidat</h2>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isMasked ? '#395886' : '#628ECB' }}
                  aria-hidden="true"
                >
                  {isMasked ? (
                    <span className="text-white font-mono font-bold text-sm">{anonymousId.slice(1)}</span>
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {profile.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'K'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold" style={{ color: '#395886' }}>{displayName}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: '#8AAEE0' }}>
                    {isMasked ? (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck size={11} aria-hidden="true" />
                        Identitas terenkripsi AES-256
                      </span>
                    ) : (
                      identityDetail
                    )}
                  </div>
                </div>
              </div>

              <dl
                className="grid grid-cols-3 gap-3 text-center pt-4"
                style={{ borderTop: '1px solid var(--color-bg)' }}
              >
                {[
                  { dt: 'Lamaran', dd: String(apps.length) },
                  { dt: 'Interview', dd: String(apps.filter(a => a.status === 'interview_requested' || a.status === 'interview_scheduled').length) },
                  { dt: 'Skill', dd: String(skills.length) },
                ].map(({ dt, dd }) => (
                  <div key={dt} className="py-2 rounded-xl" style={{ background: 'var(--color-bg)' }}>
                    <dd
                      className="text-xl font-bold tabular-nums"
                      style={{ color: '#395886', fontFamily: 'var(--font-mono)' }}
                    >{dd}</dd>
                    <dt className="text-xs mt-0.5" style={{ color: '#8AAEE0' }}>{dt}</dt>
                  </div>
                ))}
              </dl>
            </section>

          
          </div>

          {/* ── Right column ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Upload Portfolio */}
            <section
              aria-labelledby="upload-heading"
              className="bg-white rounded-2xl border p-6"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <h2
                id="upload-heading"
                className="text-lg md:text-xl font-semibold mb-5 flex items-center gap-2"
                style={{ color: '#8AAEE0' }}
              >
                <Upload size={13} aria-hidden="true" />
                Upload Portofolio
              </h2>

              <div
                role="button"
                tabIndex={0}
                aria-label="Area upload portofolio — drag & drop atau tekan Enter untuk memilih file"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all min-h-[140px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{
                  borderColor: dragOver ? '#628ECB' : 'var(--color-surface-2)',
                  background: dragOver ? 'var(--color-surface)' : 'var(--color-bg)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-surface)' }}
                  aria-hidden="true"
                >
                  <Upload size={22} style={{ color: '#395886' }} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold" style={{ color: '#395886' }}>
                    {dragOver ? 'Lepaskan untuk upload' : 'Drag & drop atau klik untuk upload'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#8AAEE0' }}>
                    PDF, ZIP, PNG, JPG · Maks 50 MB · Tanpa nama/foto
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                multiple
                accept=".pdf,.zip,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Pilih file portofolio"
              />

              {uploads.length > 0 && (
                <ul className="mt-4 space-y-3" aria-label="Daftar file yang diupload">
                  {uploads.map(u => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: 'var(--color-bg)', borderColor: 'var(--color-surface)' }}
                    >
                      <FileText size={16} style={{ color: '#8AAEE0' }} className="flex-shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: '#395886' }}>{u.name}</div>
                        <div
                          className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'var(--color-surface)' }}
                          role="progressbar"
                          aria-valuenow={u.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={u.done ? 'Upload selesai' : `Mengupload: ${u.progress}%`}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${u.progress}%`, background: u.done ? '#628ECB' : '#395886' }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums flex-shrink-0"
                        style={{ color: u.done ? '#628ECB' : '#395886', fontFamily: 'var(--font-mono)' }}
                      >
                        {u.done ? '✓' : `${u.progress}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {uploadDone && (
                <div
                  className="mt-3 flex items-center gap-2 p-3 rounded-xl border"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  role="status"
                >
                  <CheckCircle2 size={15} style={{ color: '#395886' }} aria-hidden="true" />
                  <p className="text-xs font-medium" style={{ color: '#395886' }}>
                    Portofolio berhasil diunggah dan tersimpan di akun Anda.
                  </p>
                </div>
              )}

              {uploadError && (
                <div
                  className="mt-3 flex items-center gap-2 p-3 rounded-xl border"
                  style={{ background: '#fef2f2', borderColor: '#fecaca' }}
                  role="alert"
                >
                  <AlertTriangle size={13} style={{ color: '#b91c1c' }} className="flex-shrink-0" aria-hidden="true" />
                  <p className="text-xs font-medium" style={{ color: '#b91c1c' }}>{uploadError}</p>
                </div>
              )}

              {/* Berkas portofolio yang tersimpan di backend */}
              <div className="mt-4">
                <h3 className="mb-2 text-xs font-semibold" style={{ color: '#8AAEE0' }}>
                  Portofolio tersimpan
                </h3>
                {portfolios.length === 0 ? (
                  <p className="text-xs p-3 rounded-xl" style={{ background: 'var(--color-bg)', color: '#8AAEE0' }}>
                    Belum ada berkas. File yang kamu unggah akan tersimpan di sini.
                  </p>
                ) : (
                  <ul className="space-y-2" aria-label="Daftar portofolio tersimpan">
                    {portfolios.map(file => (
                      <li
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-surface)' }}
                      >
                        <FileText size={16} style={{ color: '#8AAEE0' }} className="flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: '#395886' }}>{file.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: '#8AAEE0' }}>
                            {formatSize(file.size)}
                            {file.uploadedAt
                              ? ` · ${new Date(file.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                              : ''}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className="mt-3 flex items-start gap-2 p-3 rounded-xl border"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-surface-2)' }}
              >
                <AlertTriangle size={13} style={{ color: '#628ECB' }} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs" style={{ color: '#628ECB' }}>
                  <strong>Penting:</strong> Hapus nama, foto, dan informasi identitas dari file sebelum upload
                  agar sistem blind hiring tetap terjaga.
                </p>
              </div>
            </section>

            {/* Rekomendasi lowongan (dari backend) */}
            <section
              aria-labelledby="jobs-heading"
              className="bg-white rounded-2xl border p-6"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="jobs-heading"
                  className="text-lg md:text-xl font-semibold flex items-center gap-2"
                  style={{ color: '#8AAEE0' }}
                >
                  <TrendingUp size={13} aria-hidden="true" />
                  Rekomendasi Lowongan
                </h2>
                <span className="text-xs" style={{ color: '#B1C9EF' }}>Berdasarkan lowongan aktif</span>
              </div>

              {recommended.length === 0 ? (
                <p className="text-sm p-4 rounded-2xl" style={{ background: 'var(--color-bg)', color: '#8AAEE0' }}>
                  Belum ada rekomendasi. Lowongan baru akan muncul di sini.
                </p>
              ) : (
                <ul className="space-y-3" aria-label="Daftar lowongan yang direkomendasikan">
                  {recommended.map(job => (
                    <li key={job.id}>
                      <div
                        className="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm"
                        style={{ borderColor: 'var(--color-surface-alt)' }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--color-bg)' }}
                          aria-hidden="true"
                        >
                          <Briefcase size={16} style={{ color: '#628ECB' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: '#1e293b' }}>{job.title}</div>
                              <div className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: '#8AAEE0' }}>
                                <MapPin size={11} aria-hidden="true" />
                                {job.company} · {job.location}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div
                                className="text-xs font-bold px-2 py-1 rounded-full"
                                style={{ background: 'var(--color-surface)', color: '#395886' }}
                              >
                                {job.type === 'remote' ? 'Remote' : job.type === 'hybrid' ? 'Hybrid' : 'Onsite'}
                              </div>
                              <div className="text-xs mt-1" style={{ color: '#B1C9EF' }}>
                                {job.postedDays ?? 0} hari lalu
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2.5 gap-2">
                            <span className="text-xs font-medium truncate" style={{ color: '#628ECB' }}>{job.salary}</span>
                            <button
                              onClick={() => onNavigate('job-matching')}
                              className="text-xs text-white px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 min-h-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex-shrink-0"
                              style={{ background: '#395886' }}
                            >
                              Lihat Detail
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => onNavigate('job-matching')}
                className="w-full mt-4 py-3 rounded-2xl text-sm font-semibold border transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--color-surface-2)', color: '#628ECB', background: 'var(--color-bg)' }}
              >
                Lihat Semua Lowongan
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </section>

            {/* Application tracker */}
            <section
              aria-labelledby="tracker-heading"
              className="bg-white rounded-2xl border p-6"
              style={{ borderColor: 'var(--color-surface-alt)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="tracker-heading"
                  className="text-lg md:text-xl font-semibold flex items-center gap-2"
                  style={{ color: '#8AAEE0' }}
                >
                  <Clock size={13} aria-hidden="true" />
                  Status Lamaran
                </h2>
                <button
                  onClick={() => onNavigate('kandidat-applications')}
                  className="text-xs font-semibold flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                  style={{ color: '#628ECB' }}
                >
                  Semua <ChevronRight size={13} aria-hidden="true" />
                </button>
              </div>
              <ul className="space-y-3" aria-label="Status lamaran pekerjaan">
                {loading && (
                  <li className="space-y-3" role="status">
                    <span className="sr-only">Memuat lamaran…</span>
                    {[0, 1].map(i => (
                      <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--color-bg)' }} />
                    ))}
                  </li>
                )}
                {loadError && (
                  <li className="text-sm p-4 rounded-2xl" style={{ background: 'var(--color-bg)', color: '#b91c1c' }}>
                    <p>{loadError}</p>
                    <button
                      type="button"
                      onClick={() => setReloadKey(k => k + 1)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: '#395886' }}
                    >
                      <RefreshCw size={13} aria-hidden="true" /> Coba lagi
                    </button>
                  </li>
                )}
                {!loading && !loadError && apps.length === 0 && (
                  <li className="text-sm p-4 rounded-2xl" style={{ background: 'var(--color-bg)', color: '#8AAEE0' }}>
                    Belum ada lamaran. Cari lowongan dan ajukan lamaran pertamamu.
                  </li>
                )}
                {!loading && apps.map(app => (
                  <li key={app.id}>
                    <ApplicationRow app={app} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
