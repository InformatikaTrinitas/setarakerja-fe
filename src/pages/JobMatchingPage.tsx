import React, { useEffect, useId, useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Shield,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  X,
  Headphones,
  Eye,
  Accessibility,
  Wifi,
  Building2,
  Users,
  UserCheck,
  Star,
  Sparkles,
  ArrowRight,
  Filter,
  ListChecks,
  Bell,
  Info,
  Target,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import type { Page, DisabilityType } from '../types';
import { ApiError, applyToJob, fetchJobs, getSessionUser } from '../lib/api';

// Peta dimuat lazy agar bundle utama tidak membawa Leaflet.
const LocationPicker = React.lazy(() => import('../components/LocationPicker'));

interface Props {
  onNavigate: (page: Page) => void;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

type AccomTag =
  | 'screen_reader'
  | 'sign_language'
  | 'captioning'
  | 'remote'
  | 'wheelchair'
  | 'flexible'
  | 'assistive_tech';

interface JobListing {
  id: string;
  title: string;
  company: string;
  companySize: string;
  location: string;
  type: 'remote' | 'hybrid' | 'onsite';
  salary: string;
  skills: string[];
  postedDays: number;
  accessible: boolean;
  accommodations: AccomTag[];
  category: DisabilityType[];
  jobCoach: string | null;
  slots: number;
  verified: boolean;
  /** Titik lokasi kantor dari backend (nullable). */
  locationLat?: number | null;
  locationLng?: number | null;
}

const COACHES = [
  {
    id: 'c1',
    name: 'Yolanda Santoso',
    specialty: 'Tech & Digital',
    disabilities: ['tunanetra', 'tunadaksa'],
    sessions: 127,
    rating: 4.9,
    available: true,
    photo: 'YS',
  },
  {
    id: 'c2',
    name: 'Bimo Raharjo',
    specialty: 'Desain & Kreatif',
    disabilities: ['tunarungu', 'tunawicara'],
    sessions: 84,
    rating: 4.8,
    available: true,
    photo: 'BR',
  },
  {
    id: 'c3',
    name: 'Dewi Putri',
    specialty: 'Administrasi & Logistik',
    disabilities: ['tunadaksa', 'autisme'],
    sessions: 203,
    rating: 5.0,
    available: false,
    photo: 'DP',
  },
  {
    id: 'c4',
    name: 'Rian Firmansyah',
    specialty: 'Hospitality & F&B',
    disabilities: ['tunadaksa'],
    sessions: 61,
    rating: 4.7,
    available: true,
    photo: 'RF',
  },
  {
    id: 'c5',
    name: 'Siti Nurhaliza',
    specialty: 'Pendidikan & Pelatihan',
    disabilities: ['tunanetra', 'autisme', 'tunawicara'],
    sessions: 95,
    rating: 4.9,
    available: true,
    photo: 'SN',
  },
  {
    id: 'c6',
    name: 'Adi Pratama',
    specialty: 'Keuangan & Akuntansi',
    disabilities: ['tunarungu', 'tunadaksa'],
    sessions: 72,
    rating: 4.8,
    available: true,
    photo: 'AP',
  },
];

const ACCOM_META: Record<AccomTag, { label: string; icon: React.FC<{ size?: number }> }> = {
  screen_reader:  { label: 'Screen Reader', icon: Eye },
  sign_language:  { label: 'Juru Bahasa Isyarat', icon: Accessibility },
  captioning:     { label: 'Caption/Teks Real-time', icon: Headphones },
  remote:         { label: 'Remote/WFH', icon: Wifi },
  wheelchair:     { label: 'Ramah Kursi Roda', icon: Accessibility },
  flexible:       { label: 'Jam Fleksibel', icon: Clock },
  assistive_tech: { label: 'Alat Bantu Disediakan', icon: Shield },
};

const DISABILITY_LABELS: Record<string, string> = {
  tunarungu: 'Tunarungu',
  tunadaksa: 'Tunadaksa',
  tunanetra: 'Tunanetra',
  tunawicara: 'Tunawicara',
  autisme: 'Autisme',
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  remote:  { bg: '#DBEAFE', text: '#1D4ED8' },
  hybrid:  { bg: '#FEF3C7', text: '#B45309' },
  onsite:  { bg: '#E6EEF9', text: '#395886' },
};

const TYPE_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'Onsite',
};

const AccomChip = ({ tag }: { tag: AccomTag }) => {
  const meta = ACCOM_META[tag];
  if (!meta) return null;
  const { label, icon: Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
      style={{ background: 'var(--color-bg)', color: 'var(--color-heading)', border: '1px solid var(--color-surface)' }}
    >
      <Icon size={10} aria-hidden="true" />
      {label}
    </span>
  );
};

const CoachCard = ({
  coach,
  onRequest,
}: {
  coach: typeof COACHES[0];
  onRequest: () => void;
}) => {
  const disIcons = coach.disabilities.map(d => (
    <span key={d} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'var(--color-surface)', color: '#628ECB' }}>
      {DISABILITY_LABELS[d].slice(0, 3)}
    </span>
  ));

  return (
    <div className="p-3 rounded-xl border transition-all hover:shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: 'var(--color-surface)', color: '#395886', fontFamily: 'var(--font-mono)' }}
          aria-hidden="true"
        >
          {coach.photo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm truncate" style={{ color: '#1e293b' }}>{coach.name}</h3>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: coach.available ? '#DCFCE7' : '#FEF3C7', color: coach.available ? '#15803D' : '#B45309' }}>
              {coach.available ? 'Tersedia' : 'Penuh'}
            </span>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#628ECB' }}>{coach.specialty}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {disIcons}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: '#8AAEE0' }}>
            <span className="flex items-center gap-1">
              <Star size={10} className="text-amber-500" aria-hidden="true" />
              {coach.rating}
            </span>
            <span className="flex items-center gap-1">
              <Users size={10} aria-hidden="true" />
              {coach.sessions} sesi
            </span>
          </div>
        </div>
      </div>
      {coach.available && (
        <button
          onClick={onRequest}
          className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
        >
          Minta Pendampingan
        </button>
      )}
    </div>
  );
};

export default function JobMatchingPage({ onNavigate }: Props) {
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [disabilityFilter, setDisabilityFilter] = useState<string>('all');
  const [onlySaved, setOnlySaved] = useState(false);
  const [applyJob, setApplyJob] = useState<JobListing | null>(null);
  const [detailJob, setDetailJob] = useState<JobListing | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [coachRequested, setCoachRequested] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ambil lowongan terbaru dari backend Laravel.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchJobs()
      .then(serverJobs => {
        if (cancelled) return;
        setJobs(Array.isArray(serverJobs) ? (serverJobs as JobListing[]) : []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setJobs([]);
        const message = err instanceof ApiError ? err.message : 'Gagal memuat lowongan dari server.';
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const toggleSave = (id: string) => {
    const next = new Set(savedJobs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSavedJobs(next);
  };

  const base = jobs.filter(job => {
    const matchesQuery = !q || `${job.title} ${job.company} ${job.skills.join(' ')}`.toLowerCase().includes(q.toLowerCase());
    const matchesDisability = disabilityFilter === 'all' || job.category.includes(disabilityFilter as DisabilityType);
    return matchesQuery && matchesDisability;
  });

  const filtered = base.filter(job => {
    const matchesType = typeFilter === 'all' || job.type === typeFilter;
    const matchesSaved = !onlySaved || savedJobs.has(job.id);
    return matchesType && matchesSaved;
  });

  const countType = (t: string) => base.filter(job => job.type === t).length;

  const FILTER_PILLS = [
    { key: 'all', label: 'Semua Lowongan', icon: Briefcase, count: base.length },
    { key: 'remote', label: 'Remote', icon: Wifi, count: countType('remote') },
    { key: 'hybrid', label: 'Hybrid', icon: Building2, count: countType('hybrid') },
    { key: 'onsite', label: 'Onsite', icon: MapPin, count: countType('onsite') },
  ];

  return (
    <main className="min-h-full" style={{ background: '#EBF0F9' }}>
      <div className="mx-auto px-4 sm:px-5 lg:px-6 py-6 lg:py-8" style={{ maxWidth: 1280 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#395886' }}>
              SetaraKerja · Cari Kerja
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: '#1A2A3A' }}>
              Temukan Pekerjaan Inklusif
            </h1>
            <p className="text-sm mt-1" style={{ color: '#5B6B80' }}>
              Lowongan dari perusahaan yang peduli aksesibilitas & keberagaman
            </p>
          </div>
        </div>

        {/* Panel */}
        <div className="rounded-3xl border bg-white p-4 shadow-sm sm:p-5 lg:p-6" style={{ borderColor: 'var(--color-surface)' }}>
          {/* Panel header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
                aria-hidden="true"
              >
                <Briefcase size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold leading-tight" style={{ color: 'var(--color-heading)' }}>
                  Lowongan
                </h2>
                <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {loading ? 'Memuat lowongan…' : `${jobs.length} lowongan aktif · diperbarui hari ini`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative min-w-0 flex-1 sm:flex-none sm:w-64">
                <span className="sr-only">Cari lowongan</span>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8AAEE0' }} aria-hidden="true" />
                <input
                  type="search"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Cari posisi, perusahaan, skill..."
                  className="w-full rounded-full py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-400/25"
                  style={{ background: '#F0F3FA', color: '#1A2A3A' }}
                />
              </label>
              <button
                type="button"
                onClick={() => onNavigate('help')}
                aria-label="Bantuan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ background: '#F0F3FA', color: '#395886', border: '1px solid var(--color-surface)' }}
              >
                <Info size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOnlySaved(v => !v)}
                aria-pressed={onlySaved}
                aria-label="Tampilkan lowongan tersimpan"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{
                  background: onlySaved ? '#395886' : '#F0F3FA',
                  color: onlySaved ? '#fff' : '#395886',
                  border: '1px solid var(--color-surface)',
                }}
              >
                <Bell size={16} />
                {savedJobs.size > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold"
                    style={{ background: '#15803D', color: '#fff' }}
                  >
                    {savedJobs.size}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter cepat (pil) + kartu status */}
          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter cepat">
              {FILTER_PILLS.map(p => {
                const active = typeFilter === p.key;
                const Icon = p.icon;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setTypeFilter(p.key)}
                    aria-pressed={active}
                    className="inline-flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    style={{
                      background: active ? '#395886' : '#F0F3FA',
                      color: active ? '#fff' : '#395886',
                      border: `1px solid ${active ? '#395886' : 'var(--color-surface)'}`,
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: active ? 'rgba(255,255,255,0.18)' : '#E6EEF9' }}
                      aria-hidden="true"
                    >
                      <Icon size={12} />
                    </span>
                    {p.label}
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{ background: active ? 'rgba(255,255,255,0.18)' : '#E6EEF9' }}
                    >
                      {p.count}
                    </span>
                  </button>
                );
              })}

             

              <select
                value={disabilityFilter}
                onChange={e => setDisabilityFilter(e.target.value)}
                aria-label="Filter jenis disabilitas"
                className="cursor-pointer rounded-full px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  background: disabilityFilter === 'all' ? '#F0F3FA' : '#395886',
                  color: disabilityFilter === 'all' ? '#395886' : '#fff',
                  border: `1px solid ${disabilityFilter === 'all' ? 'var(--color-surface)' : '#395886'}`,
                }}
              >
                <option value="all">Semua Disabilitas</option>
                {Object.entries(DISABILITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k} style={{ color: '#1A2A3A' }}>{v}</option>
                ))}
              </select>
            </div>

            {/* Kartu status */}
            <div
              className="flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 shadow-sm"
              style={{ borderColor: 'var(--color-surface)', background: 'var(--color-card-bg)' }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: '#DCFCE7', color: '#15803D' }}
                aria-hidden="true"
              >
                <CheckCircle2 size={15} />
              </span>
              <div className="leading-tight">
                <div className="text-xs font-bold" style={{ color: 'var(--color-heading)' }}>Blind hiring aktif</div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Identitas disembunyikan dari HRD</div>
              </div>
            </div>
          </div>

          {/* Judul bagian */}
          <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold" style={{ color: 'var(--color-heading)' }}>
              Cocok dengan Profilmu
            </h3>
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Sparkles size={12} style={{ color: '#628ECB' }} aria-hidden="true" />
              {loading ? 'Memuat lowongan…' : `${filtered.length} hasil · diurutkan berdasarkan kecocokan AI`}
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: 'var(--color-surface)' }} role="status" aria-live="polite">
              <Loader2 size={30} className="mx-auto mb-3 text-[#395886] animate-spin" aria-hidden="true" />
              <p className="font-semibold text-slate-700">Memuat lowongan dari server…</p>
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: 'var(--color-surface)' }} role="alert">
              <AlertCircle size={30} className="mx-auto mb-3 text-red-500" aria-hidden="true" />
              <p className="font-semibold text-slate-700 mb-1">Gagal memuat lowongan</p>
              <p className="text-sm text-slate-400 mb-4">{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadKey(k => k + 1)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Coba lagi
              </button>
            </div>
          ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: 'var(--color-surface)' }}>
                <Search size={30} className="mx-auto mb-3 text-[#395886]" aria-hidden="true" />
                <p className="font-semibold text-slate-700 mb-1">Tidak ada hasil</p>
                <p className="text-sm text-slate-400">
                  {jobs.length === 0 ? 'Belum ada lowongan yang dipublikasikan.' : 'Coba ubah filter atau kata kunci pencarian.'}
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(job => {
                  const tc = TYPE_COLORS[job.type];
                  const isSaved = savedJobs.has(job.id);
                  return (
                    <li
                      key={job.id}
                      className="group flex flex-col rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                      style={{ borderColor: 'var(--color-surface)', background: 'var(--color-card-bg)' }}
                    >
                      {/* Perusahaan + badge kecocokan */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                            style={{ background: '#395886', color: '#fff', fontFamily: 'var(--font-mono)' }}
                            aria-hidden="true"
                          >
                            {job.company.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 truncate text-sm font-semibold" style={{ color: 'var(--color-heading)' }}>
                            {job.company}
                          </span>
                          {job.verified && (
                            <span className="shrink-0" style={{ color: '#15803D' }} title="Perusahaan terverifikasi">
                              <CheckCircle2 size={13} aria-label="Terverifikasi" />
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSave(job.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            style={{
                              background: isSaved ? '#E6EEF9' : 'transparent',
                              color: isSaved ? '#395886' : '#8AAEE0',
                              border: '1px solid var(--color-surface)',
                            }}
                            aria-pressed={isSaved}
                            aria-label={isSaved ? `Hapus ${job.title} dari simpanan` : `Simpan ${job.title}`}
                          >
                            <Star size={13} fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>

                      {/* Kotak meta */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-surface)' }}>
                          <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            <Briefcase size={10} aria-hidden="true" /> Tipe
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-bold" style={{ color: 'var(--color-heading)' }}>
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tc.text }} aria-hidden="true" />
                            {TYPE_LABELS[job.type]}
                          </div>
                        </div>
                        <div className="rounded-xl px-2.5 py-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-surface)' }}>
                          <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock size={10} aria-hidden="true" /> Dipublikasikan
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-bold" style={{ color: 'var(--color-heading)' }}>
                            {job.postedDays} hari lalu
                          </div>
                        </div>
                      </div>

                      {/* Judul + deskripsi */}
                      <h3 className="mt-3 text-[15px] font-bold leading-snug" style={{ color: 'var(--color-heading)' }}>
                        {job.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        {job.salary} · {job.location} · {job.slots} slot tersisa
                      </p>

                      {/* Skill */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {job.skills.map(s => (
                          <span
                            key={s}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{ background: 'var(--color-surface)', color: 'var(--color-heading)' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Akomodasi */}
                      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Akomodasi tersedia">
                        {job.accommodations.map(a => <AccomChip key={a} tag={a} />)}
                      </div>

                    

                      {/* Aksi */}
                      <div className="mt-auto flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setDetailJob(job)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          style={{ borderColor: 'var(--color-border)', color: '#395886', background: 'var(--color-card-bg)' }}
                        >
                          <Eye size={14} aria-hidden="true" />
                          Lihat Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => setApplyJob(job)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                          style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
                        >
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Lamar Blind
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          
          
      </div>

      {/* Detail lowongan */}
      {detailJob && (
        <DetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onApply={() => {
            setApplyJob(detailJob);
            setDetailJob(null);
          }}
        />
      )}

      {/* Blind apply modal */}
      {applyJob && (
        <ApplyModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
        />
      )}

      {/* Coach request confirmation */}
      {coachRequested && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(57,88,134,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setCoachRequested(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Permintaan sesi job coach"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-bold"
              style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff', fontFamily: 'var(--font-mono)' }}
              aria-hidden="true"
            >
              {COACHES.find(c => c.id === coachRequested)?.photo}
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#395886' }}>
              Permintaan Terkirim!
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              <strong>{COACHES.find(c => c.id === coachRequested)?.name}</strong> akan menghubungimu dalam 1×24 jam melalui platform ini.
            </p>
            <button
              onClick={() => setCoachRequested(null)}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Modal Blind Apply ────────────────────────────────────────────────────────

function DetailModal({ job, onClose, onApply }: { job: JobListing; onClose: () => void; onApply: () => void }) {
  // Titik lokasi kantor (dari backend) untuk ditampilkan di peta.
  const mapPoint =
    typeof job.locationLat === 'number' && typeof job.locationLng === 'number'
      ? { lat: job.locationLat, lng: job.locationLng }
      : null;
  const mapsHref = mapPoint
    ? `https://www.google.com/maps/search/?api=1&query=${mapPoint.lat},${mapPoint.lng}`
    : null;

  const facts = [
    { label: 'Tipe', value: TYPE_LABELS[job.type] },
    { label: 'Lokasi', value: job.location },
    { label: 'Gaji', value: job.salary },
    { label: 'Slot tersisa', value: `${job.slots} orang` },
    { label: 'Ukuran perusahaan', value: job.companySize },
    { label: 'Dipublikasikan', value: `${job.postedDays} hari lalu` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(57,88,134,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detail lowongan ${job.title}`}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Kepala */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: '#395886', color: '#fff', fontFamily: 'var(--font-mono)' }}
              aria-hidden="true"
            >
              {job.company.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold" style={{ color: 'var(--color-heading)' }}>{job.title}</h2>
              <p className="truncate text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {job.company}{job.verified ? ' · Terverifikasi' : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ background: 'var(--color-bg)', color: '#395886' }}
            aria-label="Tutup detail"
          >
            <X size={18} />
          </button>
        </div>

        {/* Fakta singkat */}
        <dl className="mt-4 grid grid-cols-2 gap-2">
          {facts.map(f => (
            <div key={f.label} className="rounded-xl px-3 py-2" style={{ border: '1px solid var(--color-surface)' }}>
              <dt className="text-[10px] font-semibold" style={{ color: 'var(--color-text-muted)' }}>{f.label}</dt>
              <dd className="truncate text-xs font-bold" style={{ color: 'var(--color-heading)' }}>{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* Lokasi kantor di peta */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-heading)' }}>
              <MapPin size={12} aria-hidden="true" /> Lokasi kantor
            </h3>
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                style={{ color: '#395886' }}
              >
                Buka di Google Maps <ExternalLink size={11} aria-hidden="true" />
              </a>
            )}
          </div>
          {mapPoint ? (
            <React.Suspense
              fallback={
                <div
                  className="flex h-[220px] items-center justify-center rounded-2xl text-xs"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                  role="status"
                >
                  Memuat peta…
                </div>
              }
            >
              <LocationPicker value={mapPoint} readOnly height={220} />
            </React.Suspense>
          ) : (
            <div
              className="flex flex-col gap-1 rounded-2xl px-3 py-4 text-xs"
              style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
            >
              <span className="font-semibold" style={{ color: 'var(--color-heading)' }}>{job.location}</span>
              <span>Titik peta belum tersedia untuk lowongan ini.</span>
            </div>
          )}
        </div>

        {/* Skill */}
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-heading)' }}>Skill</h3>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map(s => (
              <span
                key={s}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ background: 'var(--color-surface)', color: 'var(--color-heading)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Akomodasi */}
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-heading)' }}>Akomodasi tersedia</h3>
          <div className="flex flex-wrap gap-1.5">
            {job.accommodations.map(a => <AccomChip key={a} tag={a} />)}
          </div>
        </div>

        {/* Job coach */}
        {job.jobCoach && (
          <div className="mt-4 flex items-center gap-2 rounded-xl p-3 text-xs" style={{ background: '#E6EEF9', color: '#395886' }}>
            <UserCheck size={14} aria-hidden="true" />
            Job Coach <strong>{job.jobCoach}</strong> siap mendampingi selama orientasi
          </div>
        )}

        {/* Aksi */}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:w-auto sm:flex-1"
            style={{ borderColor: 'var(--color-border)', color: '#395886' }}
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onApply}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 sm:flex-1"
            style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
          >
            Lamar Blind
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyModal({ job, onClose }: { job: JobListing; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const session = getSessionUser();
  const [form, setForm] = useState({
    name: session?.name ?? '',
    email: session?.email ?? '',
    disability: session?.disabilityType ?? '',
    accommodation: '',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await applyToJob(job.id, {
        name: form.name,
        email: form.email,
        disability: form.disability,
        accommodation: form.accommodation || undefined,
      });
      alert(`Lamaran untuk ${job.title} dikirim!`);
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        setError('Silakan masuk terlebih dahulu untuk melamar.');
      } else {
        setError(apiError.message || 'Gagal mengirim lamaran.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(57,88,134,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Formulir blind apply"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: '#395886' }}>Blind Apply</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Tutup">
              <X size={20} style={{ color: '#628ECB' }} />
            </button>
          </div>
          <p className="text-sm mt-1 text-slate-500">{job.title} di {job.company}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#395886' }}>Nama Lengkap (Akan disembunyikan dari HRD)</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" style={{ borderColor: 'var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#395886' }}>Email Aktif</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" style={{ borderColor: 'var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#395886' }}>Jenis Disabilitas</label>
                <select value={form.disability} onChange={e => setForm({...form, disability: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" style={{ borderColor: 'var(--color-border)' }}>
                  <option value="">Pilih...</option>
                  {Object.entries(DISABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#395886' }}>Akomodasi yang Dibutuhkan</label>
                <select value={form.accommodation} onChange={e => setForm({...form, accommodation: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-blue-400" style={{ borderColor: 'var(--color-border)' }}>
                  <option value="">Pilih...</option>
                  {Object.entries(ACCOM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#395886' }}>Siap Dikirim</h3>
              <p className="text-sm text-slate-500 mb-6">Data identitas Anda akan dienkripsi & disembunyikan dari HRD. Hanya skill & kecocokan yang terlihat.</p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row">
            {step === 1 && (
              <button type="submit" className="w-full sm:flex-1 py-3 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}>Lanjutkan</button>
            )}
            {step === 2 && (
              <>
                <button type="button" onClick={() => setStep(1)} className="w-full sm:flex-1 py-3 rounded-xl font-semibold border" style={{ borderColor: 'var(--color-border)', color: '#628ECB' }}>Kembali</button>
                <button type="submit" disabled={sending} className="w-full sm:flex-1 py-3 rounded-xl font-semibold disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}>
                  {sending ? 'Mengirim...' : 'Kirim Lamaran'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}


