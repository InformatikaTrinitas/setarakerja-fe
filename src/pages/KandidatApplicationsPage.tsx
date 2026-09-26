import { useEffect, useState } from 'react';
import { ArrowUpRight, Eye, FileText, FolderOpen, Lightbulb, Search, Target, Trophy, TrendingUp, UserRound } from 'lucide-react';
import type { Page } from '../types';
import { ApiError, fetchMyApplications } from '../lib/api';

type Status = 'Terkirim' | 'Diseleksi' | 'Interview' | 'Diterima' | 'Ditolak';

interface AppItem {
  day: string;
  date: string;
  job: string;
  company: string;
  field: string;
  status: Status;
  tone: string;
  action: Page | null;
}

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  Terkirim:  { bg: '#DBEAFE', color: '#1D4ED8' },
  Diseleksi: { bg: '#FEF3C7', color: '#B45309' },
  Interview: { bg: '#E6EEF9', color: '#395886' },
  Diterima:  { bg: '#DCFCE7', color: '#15803D' },
  Ditolak:   { bg: '#FEE2E2', color: '#B91C1C' },
};

const STATUS_FROM_API: Record<string, Status> = {
  applied: 'Terkirim',
  screening: 'Diseleksi',
  interview_requested: 'Interview',
  interview_scheduled: 'Interview',
  hired: 'Diterima',
  rejected: 'Ditolak',
};

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Menyesuaikan lamaran dari API Laravel dengan bentuk tabel UI. */
function toAppItem(api: any): AppItem {
  const appliedAt = api.appliedAt ? new Date(api.appliedAt) : new Date();
  const status: Status = STATUS_FROM_API[api.status] ?? 'Terkirim';
  return {
    day: DAY_LABELS[appliedAt.getDay()] ?? '',
    date: String(appliedAt.getDate()).padStart(2, '0'),
    job: api.jobTitle ?? 'Lowongan',
    company: api.company ?? '-',
    field: Array.isArray(api.skills) && api.skills.length > 0 ? api.skills[0] : 'Umum',
    status,
    tone: '#395886',
    action: status === 'Interview' ? 'interview' : null,
  };
}

/* Statistik & grafik semuanya diturunkan dari lamaran milik pengguna. */
const TONE_POOL = ['#395886', '#628ECB', '#8AAEE0', '#2563EB', '#15803D', '#7C3AED'];

const STATUS_ORDER: Status[] = ['Terkirim', 'Diseleksi', 'Interview', 'Diterima'];

const STATUS_ICON: Record<Status, typeof FileText> = {
  Terkirim: FileText,
  Diseleksi: Eye,
  Interview: Target,
  Diterima: Trophy,
  Ditolak: Target,
};

const niceMax = (v: number) => Math.max(4, Math.ceil(v / 4) * 4);

const CARD_GRADIENT = 'linear-gradient(155deg, #1B3A5C 0%, #395886 100%)';

const CH = { w: 560, h: 210, l: 40, r: 16, t: 18, b: 34 };

const smoothPath = (p: { x: number; y: number }[]) => {
  if (p.length < 2) return '';
  const n = (v: number) => v.toFixed(1);
  let d = `M ${n(p[0].x)} ${n(p[0].y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${n(c1x)} ${n(c1y)}, ${n(c2x)} ${n(c2y)}, ${n(p2.x)} ${n(p2.y)}`;
  }
  return d;
};

const initials = (s: string) =>
  s.split(' ').filter(w => w && w !== 'PT').slice(0, 2).map(w => w[0]).join('').toUpperCase();

export default function KandidatApplicationsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [q, setQ] = useState('');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ambil lamaran milik kandidat dari backend.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchMyApplications()
      .then(serverApps => {
        if (cancelled) return;
        setApps(Array.isArray(serverApps) ? serverApps.map(toAppItem) : []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setApps([]);
        setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat lamaran dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const stats = [
    { label: 'Lamaran', value: String(apps.length), note: 'total terkirim', tone: '#628ECB' },
    { label: 'Interview', value: String(apps.filter(a => a.status === 'Interview').length), note: 'sesi interview', tone: '#395886' },
    { label: 'Diterima', value: String(apps.filter(a => a.status === 'Diterima').length), note: 'offer diterima', tone: '#15803D' },
  ];

  const topCompanies = Object.values(
    apps.reduce<Record<string, { name: string; handle: string; count: number; tone: string }>>((acc, a) => {
      const cur = acc[a.company] ?? { name: a.company, handle: a.field, count: 0, tone: TONE_POOL[Object.keys(acc).length % TONE_POOL.length] };
      cur.count += 1;
      acc[a.company] = cur;
      return acc;
    }, {})
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(c => ({ ...c, pct: apps.length > 0 ? Math.round((c.count / apps.length) * 100) : 0 }));

  const statusCards = STATUS_ORDER.map(label => {
    const count = apps.filter(a => a.status === label).length;
    return {
      label,
      sub: `${count} lamaran ${label.toLowerCase()}`,
      value: String(count),
      icon: STATUS_ICON[label],
      tone: STATUS_STYLE[label].color,
    };
  });

  // Grafik: jumlah lamaran per tanggal dari data asli.
  const dayCounts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.date] = (acc[a.date] ?? 0) + 1;
    return acc;
  }, {});
  const dayKeys = Object.keys(dayCounts).sort((a, b) => Number(a) - Number(b)).slice(-8);
  const values = dayKeys.map(k => dayCounts[k]);
  const DAYS = dayKeys;
  const chartMax = niceMax(Math.max(1, ...values));
  const innerW = CH.w - CH.l - CH.r;
  const innerH = CH.h - CH.t - CH.b;
  const xAt = (i: number) => CH.l + (values.length > 1 ? (i * innerW) / (values.length - 1) : innerW / 2);
  const yAt = (v: number) => CH.t + (1 - v / chartMax) * innerH;
  const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const linePath = smoothPath(pts);
  const areaPath = pts.length > 1
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${yAt(0).toFixed(1)} L ${pts[0].x.toFixed(1)} ${yAt(0).toFixed(1)} Z`
    : '';
  const peak = values.length > 0 ? values.indexOf(Math.max(...values)) : 0;
  const Y_TICKS = [0, Math.round(chartMax / 2), chartMax];

  const keyword = q.trim().toLowerCase();
  const filtered = keyword
    ? apps.filter(a => `${a.job} ${a.company} ${a.field}`.toLowerCase().includes(keyword))
    : apps;

  return (
    <div className="min-h-full" style={{ background: '#EBF0F9' }}>
      <div className="mx-auto px-4 sm:px-5 lg:px-6 py-6 lg:py-8" style={{ maxWidth: 1160 }}>
        {/* ── Kartu utama ── */}
        <div className="rounded-3xl shadow-sm overflow-hidden" style={{ background: '#FFFFFF' }}>
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

              {/* ── Kolom kiri: judul + statistik + grafik + daftar lamaran ── */}
              <div className="lg:col-span-2 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#395886' }}>
                      SetaraKerja · Lamaran
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: '#1A2A3A' }}>
                      Semua Lamaran
                    </h1>
                    <p className="text-sm mt-1" style={{ color: '#5B6B80' }}>
                      Pantau perkembangan lamaranmu di semua bidang pekerjaan
                    </p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5B6B80' }} aria-hidden="true" />
                    <input
                      type="search"
                      value={q}
                      onChange={e => setQ(e.target.value)}
                      placeholder="Cari lamaran…"
                      aria-label="Cari lamaran"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-blue-400/25"
                      style={{ background: '#F0F3FA', color: '#1A2A3A' }}
                    />
                  </div>
                </div>

                {/* Statistik */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-7">
                  {stats.map(s => (
                    <div key={s.label} className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: s.tone }}
                        aria-hidden="true"
                      >
                        <ArrowUpRight size={16} className="text-white" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate" style={{ color: '#5B6B80' }}>
                          {s.label}
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: '#1A2A3A' }}>
                          {s.value}
                        </div>
                        <div className="text-[10px] font-semibold truncate" style={{ color: '#15803D' }}>
                          {s.note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grafik aktivitas */}
                <div className="mb-7">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: '#1A2A3A' }}>Aktivitas Lamaran</h2>
                      <p className="text-xs" style={{ color: '#5B6B80' }}>Jumlah lamaran yang kamu kirim tiap hari</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('interview')}
                        className="text-xs font-bold px-3 py-2 rounded-lg transition-colors hover:bg-[#E6EEF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        style={{ color: '#395886', background: '#F0F3FA' }}
                      >
                        Jadwal Interview
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="rounded-2xl border p-8 text-center text-sm font-semibold" style={{ background: '#F7FAFE', borderColor: '#E6EEF9', color: '#5B6B80' }} role="status" aria-live="polite">
                      Memuat grafik aktivitas…
                    </div>
                  ) : loadError ? (
                    <div className="rounded-2xl border p-8 text-center" style={{ background: '#F7FAFE', borderColor: '#E6EEF9' }} role="alert">
                      <p className="text-sm font-semibold" style={{ color: '#B91C1C' }}>{loadError}</p>
                      <button
                        type="button"
                        onClick={() => setReloadKey(k => k + 1)}
                        className="mt-3 px-5 py-2 rounded-lg text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Coba lagi
                      </button>
                    </div>
                  ) : values.length < 2 ? (
                    <div className="rounded-2xl border p-8 text-center text-sm font-semibold" style={{ background: '#F7FAFE', borderColor: '#E6EEF9', color: '#5B6B80' }}>
                      {apps.length === 0 ? 'Belum ada aktivitas lamaran.' : 'Belum cukup data untuk menampilkan grafik.'}
                    </div>
                  ) : (
                  <div className="relative">
                    <svg
                      viewBox={`0 0 ${CH.w} ${CH.h}`}
                      className="w-full h-auto block"
                      role="img"
                      aria-label={`Grafik aktivitas lamaran, puncak ${values[peak]} lamaran pada tanggal ${DAYS[peak]}`}
                    >
                      <defs>
                        <linearGradient id="actArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#628ECB" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#628ECB" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {Y_TICKS.map(t => (
                        <g key={t}>
                          <line x1={CH.l} x2={CH.w - CH.r} y1={yAt(t)} y2={yAt(t)} stroke="#E6EEF9" strokeWidth="1" />
                          <text x={CH.l - 10} y={yAt(t)} dy="0.32em" textAnchor="end" fontSize="10" fill="#5B6B80" fontWeight="600">
                            {t}
                          </text>
                        </g>
                      ))}

                      <path d={areaPath} fill="url(#actArea)" />
                      <path d={linePath} fill="none" stroke="#395886" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#FFFFFF" stroke="#395886" strokeWidth="2" />
                      ))}
                      <circle cx={pts[peak].x} cy={pts[peak].y} r="7" fill="#395886" stroke="#FFFFFF" strokeWidth="3" />

                      {DAYS.map((d, i) => (
                        <text key={d} x={xAt(i)} y={CH.h - 14} textAnchor="middle" fontSize="10" fill="#5B6B80" fontWeight="600">
                          {d}
                        </text>
                      ))}
                    </svg>

                    {/* Tooltip */}
                    <div
                      className="absolute -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl shadow-lg pointer-events-none whitespace-nowrap"
                      style={{
                        left: `${(pts[peak].x / CH.w) * 100}%`,
                        top: `${(pts[peak].y / CH.h) * 100}%`,
                        marginTop: -14,
                        background: '#395886',
                      }}
                    >
                      <div className="text-sm font-extrabold leading-none text-white">{values[peak]}</div>
                      <div className="text-[10px] leading-tight" style={{ color: '#D5DEEF' }}>
                        Tanggal {DAYS[peak]}
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                {/* Daftar lamaran */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold" style={{ color: '#1A2A3A' }}>Daftar Lamaran</h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#E6EEF9', color: '#395886' }}>
                      {filtered.length} dari {apps.length}
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden" style={{ background: '#F7FAFE', border: '1px solid #E6EEF9' }}>
                    {filtered.map((app, i) => {
                      const st = STATUS_STYLE[app.status];
                      const row = (
                        <>
                          <div className="rounded-xl px-2.5 py-1.5 text-center flex-shrink-0" style={{ background: '#E6EEF9', minWidth: 50 }}>
                            <div className="text-[10px] font-bold leading-none mb-1" style={{ color: '#5B6B80' }}>{app.day}</div>
                            <div className="text-xl font-extrabold leading-none" style={{ color: '#395886' }}>{app.date}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate" style={{ color: '#1A2A3A' }}>{app.job}</div>
                            <div className="text-xs truncate" style={{ color: '#5B6B80' }}>{app.company} · {app.field}</div>
                          </div>
                          <span
                            className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                            style={{ background: st.bg, color: st.color }}
                          >
                            {app.status}
                          </span>
                          <div className="text-right flex-shrink-0" style={{ minWidth: 46 }}>
                            <div className="text-sm font-extrabold leading-none" style={{ color: '#395886' }}></div>
                          </div>
                        </>
                      );

                      return app.action ? (
                        <button
                          key={i}
                          onClick={() => onNavigate(app.action as Page)}
                          className={`w-full text-left flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${i > 0 ? 'border-t' : ''}`}
                          style={{ borderColor: '#E6EEF9' }}
                        >
                          {row}
                          <ArrowUpRight size={16} className="flex-shrink-0" style={{ color: '#628ECB' }} aria-hidden="true" />
                        </button>
                      ) : (
                        <div
                          key={i}
                          className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 ${i > 0 ? 'border-t' : ''}`}
                          style={{ borderColor: '#E6EEF9' }}
                        >
                          {row}
                          <span className="flex-shrink-0" style={{ width: 16 }} aria-hidden="true" />
                        </div>
                      );
                    })}

                    {filtered.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm font-semibold" style={{ color: '#5B6B80' }}>
                        {apps.length === 0
                          ? 'Belum ada lamaran.'
                          : `Tidak ada lamaran yang cocok dengan “${q}”.`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Kolom kanan: promo + perusahaan responsif ── */}
              <div className="flex flex-col gap-5 min-w-0 h-full">
                {/* Promo Skill Passport */}
                <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 flex-shrink-0" style={{ background: CARD_GRADIENT }}>
                  <svg className="absolute -right-8 -top-8 opacity-40" width="150" height="150" viewBox="0 0 150 150" aria-hidden="true">
                    <circle cx="75" cy="75" r="42" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="16" />
                    <circle cx="75" cy="75" r="70" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="16" />
                  </svg>
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }} aria-hidden="true">
                        <UserRound size={18} className="text-white" />
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#D5DEEF' }}>
                        Skill Passport
                      </span>
                    </div>
                    <p className="text-xl font-extrabold leading-snug text-white">Lengkapi Skill Passport-mu</p>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#D5DEEF' }}>
                      Verifikasi keterampilan yang bisa langsung dibuka HRD — khusus pencari kerja berkebutuhan khusus.
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: '#D5DEEF' }}>
                        Gratis · 3 menit
                      </span>
                      <button
                        onClick={() => onNavigate('kandidat-passport')}
                        className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
                      >
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-white">Sekarang</span>
                        <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center transition-transform group-hover:translate-x-0.5" style={{ color: '#395886' }}>
                          <ArrowUpRight size={18} aria-hidden="true" />
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Perusahaan responsif */}
                <div className="rounded-3xl p-5 sm:p-6 flex-1 flex flex-col" style={{ background: '#F7FAFE', border: '1px solid #E6EEF9' }}>
                  <div className="flex items-center justify-between flex-shrink-0 mb-4">
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: '#1A2A3A' }}>Perusahaan Responsif</h2>
                      <p className="text-xs mt-0.5" style={{ color: '#5B6B80' }}>Paling sering merespons lamaranmu</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: '#E6EEF9', color: '#395886' }}>
                      {topCompanies.length} Perusahaan
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3.5">
                        {topCompanies.length === 0 && (
                          <p className="text-sm" style={{ color: '#5B6B80' }}>Belum ada lamaran.</p>
                        )}
                        {topCompanies.map(c => (
                          <div key={c.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors">
                            <span
                              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold text-white"
                              style={{ background: c.tone }}
                              aria-hidden="true"
                            >
                              {initials(c.name)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold truncate" style={{ color: '#1A2A3A' }}>{c.name}</div>
                              <div className="text-xs truncate" style={{ color: '#5B6B80' }}>{c.handle}</div>
                            </div>
                            <span className="text-xs font-extrabold px-2 py-1 rounded-lg flex-shrink-0" style={{ background: '#E6EEF9', color: '#395886' }}>
                              {c.pct}%
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Tips */}
                      <div className="flex-shrink-0 bg-white/50 rounded-xl p-3" style={{ border: '1px solid #E6EEF9' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FEF3C7', color: '#B45309' }} aria-hidden="true">
                            <Lightbulb size={14} />
                          </span>
                          <span className="text-sm font-bold" style={{ color: '#1A2A3A' }}>Tips Meningkatkan Respons</span>
                        </div>
                        <ul className="space-y-1.5 text-xs" style={{ color: '#5B6B80' }}>
                          <li className="flex items-start gap-1.5">✦ Lengkapi <strong>Skill Passport</strong> — HRD 3× lebih cepat merespons</li>
                          <li className="flex items-start gap-1.5">✦ Tambah <strong>portofolio relevan</strong> per bidang lamaran</li>
                          <li className="flex items-start gap-1.5">✦ Aktifkan <strong>notifikasi</strong> untuk balas cepat</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex-shrink-0 pt-4 border-t" style={{ borderColor: '#E6EEF9' }}>
                      <button
                        onClick={() => onNavigate('kandidat')}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', color: '#fff' }}
                      >
                        Lihat Statistik Lengkap
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Panel status (bawah) ── */}
            <div className="mt-6 lg:mt-8 rounded-3xl p-5 sm:p-6" style={{ background: '#E6EEF9' }}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="lg:w-52 flex-shrink-0">
                  <h2 className="text-lg font-bold" style={{ color: '#395886' }}>Status Lamaran</h2>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5B6B80' }}>
                    Rincian konversi tiap tahap bulan ini, lintas semua bidang.
                  </p>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {statusCards.map(c => (
                    <div key={c.label} className="rounded-2xl p-4 flex flex-col gap-1" style={{ background: '#FFFFFF' }}>
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                        style={{ background: '#F0F3FA', color: c.tone }}
                        aria-hidden="true"
                      >
                        <c.icon size={15} />
                      </span>
                      <div className="text-sm font-bold" style={{ color: '#1A2A3A' }}>{c.label}</div>
                      <div className="text-[11px]" style={{ color: '#5B6B80' }}>{c.sub}</div>
                      <div className="text-xl font-extrabold mt-1" style={{ color: c.tone }}>{c.value}</div>
                    </div>
                  ))}

                  <button
                    onClick={() => onNavigate('kandidat')}
                    className="rounded-2xl p-4 flex flex-col justify-between items-start text-left transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[132px]"
                    style={{ background: CARD_GRADIENT }}
                  >
                    <span className="w-8 h-8 rounded-full flex items-center justify-center mb-1" style={{ background: 'rgba(255,255,255,0.2)' }} aria-hidden="true">
                      <FolderOpen size={15} className="text-white" />
                    </span>
                    <span className="block">
                      <span className="block text-sm font-bold text-white">Statistik Lengkap</span>
                      <span className="block text-[11px]" style={{ color: '#D5DEEF' }}>Lihat ringkasan bulanan</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
