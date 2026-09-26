import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, User, Users, LayoutDashboard,
  Settings, MessageSquare, HelpCircle,
  TrendingUp, CheckCircle2, ChevronDown, ShieldCheck, X, LogOut,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import type { Page } from '../types';
import { ApiError, fetchCandidates, revealCandidate, updateApplicationStatus, storageUrl } from '../lib/api';

interface Props { onNavigate: (page: Page) => void; onLogout?: () => void; }

// --- Types & Data ---
interface Candidate {
  id: string; code: string;
  skills: { name: string; score: number }[];
  radarData: { subject: string; score: number }[];
  appliedAt: string; status: 'applied' | 'screening' | 'interview_requested' | 'interview_scheduled' | 'hired' | 'rejected';
  isRevealed: boolean; revealedData?: { name: string; disability: string; accommodations: string[] };
  jobTitle?: string;
}

const COMPLIANCE = { employees: 250, quota: 2, required: 5 };

const PIE_COLORS = ['#395886', '#628ECB', '#8AAEE0', '#B1C9EF', '#D5DEEF'];

/** Menyesuaikan bentuk kandidat dari API Laravel dengan state komponen. */
function toCandidate(raw: any): Candidate {
  return {
    id: String(raw.id),
    code: raw.code,
    skills: (raw.skills ?? []).map((s: any) => ({ name: s.skill ?? s.name ?? '', score: s.score ?? 0 })),
    radarData: raw.radarData ?? [],
    appliedAt: raw.appliedAt ?? '',
    status: raw.status,
    isRevealed: !!raw.isRevealed,
    revealedData: raw.revealedData ?? undefined,
    jobTitle: raw.jobTitle ?? undefined,
  };
}

// --- Subcomponents ---

interface RevealModalProps {
  candidateCode: string;
  onClose: () => void;
  onConfirm: () => void;
}

function RevealModal({ candidateCode, onClose, onConfirm }: RevealModalProps) {
  const headingId = 'reveal-modal-heading';
  const descId = 'reveal-modal-desc';
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button on mount; trap focus inside the modal
  useEffect(() => {
    confirmRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 id={headingId} className="text-xl font-bold text-[#395886]">
            Ungkap Identitas Kandidat
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p id={descId} className="text-sm text-slate-500 mb-2">
          Kandidat <strong className="text-[#395886]">{candidateCode}</strong> — aksi ini tidak dapat dibatalkan
          dan dicatat secara permanen dalam Audit Log sesuai UU No. 8/2016.
        </p>
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
          Identitas akan terungkap hanya jika kandidat juga telah menyetujui pengungkapan dari sisi mereka.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Batal
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className="flex-1 bg-[#395886] text-white py-2.5 rounded-xl font-semibold hover:bg-[#628ECB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
          >
            Konfirmasi Ungkap
          </button>
        </div>
      </div>
    </div>
  );
}

/** Enam status rekrutmen yang bisa diatur HRD untuk tiap peserta. */
const STATUS_OPTIONS: { value: Candidate['status']; label: string }[] = [
  { value: 'applied', label: 'Terkirim' },
  { value: 'screening', label: 'Seleksi' },
  { value: 'interview_requested', label: 'Menunggu Interview' },
  { value: 'interview_scheduled', label: 'Interview Terjadwal' },
  { value: 'hired', label: 'Diterima' },
  { value: 'rejected', label: 'Tidak Dilanjutkan' },
];

export default function HRDDashboard({ onNavigate, onLogout }: Props) {
  const { profile: userProfile } = useUser();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Sinkronkan dengan backend Laravel (sumber data utama kandidat).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchCandidates()
      .then(serverCandidates => {
        if (cancelled) return;
        setCandidates(Array.isArray(serverCandidates) ? serverCandidates.map(toCandidate) : []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCandidates([]);
        setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat kandidat dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const [revealTarget, setRevealTarget] = useState<string | null>(null);

  const changeStatus = async (id: string, status: Candidate['status']) => {
    const previous = candidates;
    setSavingStatusId(id);
    setStatusError(null);
    setCandidates(p => p.map(cand => (cand.id === id ? { ...cand, status } : cand)));
    try {
      await updateApplicationStatus(id, status);
    } catch (err: unknown) {
      setCandidates(previous);
      setStatusError(err instanceof ApiError ? err.message : 'Gagal memperbarui status kandidat.');
    } finally {
      setSavingStatusId(null);
    }
  };

  const confirmReveal = () => {
    if (!revealTarget) return;
    const target = revealTarget;
    setRevealTarget(null);
    revealCandidate(target)
      .then(updated => {
        setCandidates(p => p.map(c => (c.id === target ? toCandidate(updated) : c)));
      })
      .catch(() => {
        /* gagal mengungkap — biarkan status tetap tertutup */
      });
  };

  // Statistik & grafik diturunkan dari data kandidat milik perusahaan.
  const countByStatus = (status: Candidate['status']) => candidates.filter(c => c.status === status).length;
  const hiredCount = countByStatus('hired');
  const inProcessCount = candidates.filter(c =>
    ['applied', 'screening', 'interview_requested', 'interview_scheduled'].includes(c.status)
  ).length;
  const quotaPct = COMPLIANCE.required > 0 ? Math.min(100, Math.round((hiredCount / COMPLIANCE.required) * 100)) : 0;

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const barData = MONTH_LABELS
    .map(name => ({ name, screening: 0, hired: 0 }))
    .reduce<Record<string, { name: string; screening: number; hired: number }>>((acc, row) => {
      acc[row.name] = row;
      return acc;
    }, {});
  candidates.forEach(c => {
    const d = c.appliedAt ? new Date(c.appliedAt) : null;
    if (!d || isNaN(d.getTime())) return;
    const row = barData[MONTH_LABELS[d.getMonth()]];
    if (!row) return;
    if (c.status === 'hired') row.hired += 1;
    else if (c.status !== 'rejected') row.screening += 1;
  });
  const recentMonths = Object.values(barData).slice(-6);

  const pieData = (() => {
    const counts = new Map<string, number>();
    candidates.forEach(c => {
      const key = c.jobTitle || 'Lainnya';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((sum, [, v]) => sum + v, 0);
    const rows = top.map(([name, value], i) => ({ name, value, color: PIE_COLORS[i % PIE_COLORS.length] }));
    if (rest > 0) rows.push({ name: 'Lainnya', value: rest, color: PIE_COLORS[4] });
    return rows;
  })();

  const STATUS_LABELS: Record<Candidate['status'], string> = {
    applied: 'Terkirim',
    screening: 'Seleksi',
    interview_requested: 'Menunggu Interview',
    interview_scheduled: 'Interview Terjadwal',
    hired: 'Diterima',
    rejected: 'Tidak Dilanjutkan',
  };
  const statusBreakdown = (Object.keys(STATUS_LABELS) as Candidate['status'][]).map(status => ({
    status,
    label: STATUS_LABELS[status],
    count: countByStatus(status),
  }));
  const statusMax = Math.max(1, ...statusBreakdown.map(s => s.count));

  const hasData = candidates.length > 0;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen flex p-4 font-sans gap-4" style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)' }}>
      
      {revealTarget && (
        <RevealModal
          candidateCode={candidates.find(c => c.id === revealTarget)?.code ?? ''}
          onClose={() => setRevealTarget(null)}
          onConfirm={confirmReveal}
        />
      )}

      {/* --- Sidebar --- */}
      <aside className="hidden">
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#395886] rounded-xl flex items-center justify-center text-white font-bold italic text-xl">S</div>
              <span className="font-bold text-lg">SetaraKerja</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-3 tracking-wider">MENU</div>
              <nav className="space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#395886] text-white rounded-2xl font-medium">
                  <LayoutDashboard size={18} /> Dashboard
                </button>
                <button onClick={() => onNavigate('hrd-candidates')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#395886] hover:bg-[var(--color-bg)] rounded-2xl font-medium transition-colors">
                  <Users size={18} /> Candidates
                </button>
                <button onClick={() => onNavigate('hrd-compliance')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#395886] hover:bg-[var(--color-bg)] rounded-2xl font-medium transition-colors">
                  <ShieldCheck size={18} /> Compliance
                </button>
              </nav>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 mb-3 tracking-wider">TOOLS</div>
              <nav className="space-y-1">
                <button onClick={() => onNavigate('settings')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#395886] hover:bg-[var(--color-bg)] rounded-2xl font-medium transition-colors">
                  <Settings size={18} /> Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#395886] hover:bg-[var(--color-bg)] rounded-2xl font-medium transition-colors">
                  <MessageSquare size={18} /> Feedback
                </button>
                <button onClick={() => onNavigate('help')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-[#395886] hover:bg-[var(--color-bg)] rounded-2xl font-medium transition-colors">
                  <HelpCircle size={18} /> Help
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="space-y-3"><div className="bg-[#395886] text-white rounded-2xl p-5 relative overflow-hidden">
          <div className="w-8 h-8 bg-[#628ECB] rounded-lg flex items-center justify-center mb-4 text-sm font-bold italic">S</div>
          <h3 className="font-bold mb-1">Inclusive Pro</h3>
          <p className="text-xs text-blue-200 mb-4 opacity-80">Discover the benefit of an upgraded account</p>
          <button className="w-full py-2 bg-[#628ECB] hover:bg-[#8AAEE0] rounded-xl text-sm font-medium transition-colors">Upgrade $580</button>
        </div><button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-[#F0F3FA] hover:text-[#395886] transition-colors"><LogOut size={18} /> Keluar</button></div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#395886] mb-1">Dashboard HRD</h1>
            <p className="text-sm text-slate-500">{today}</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-colors">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full shadow-sm cursor-pointer">
              {userProfile.avatar ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200"><img src={storageUrl(userProfile.avatar)} alt="Profile" className="w-full h-full object-cover" /></div>
              ) : (
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><User size={16} className="text-slate-500"/></div>
              )}
              <div className="text-sm">
                <div className="font-bold text-[#395886] leading-tight">{userProfile.name}</div>
                <div className="text-xs text-slate-400 leading-tight">{userProfile.title}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Column (8 cols) */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-4">
            
            {/* 4 Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#395886] text-white rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Users size={20} /></div>
                  <span className="bg-[#628ECB] text-xs font-bold px-2 py-1 rounded-lg">Total</span>
                </div>
                <div className="text-sm text-blue-100 mb-1">Total Kandidat</div>
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold">{candidates.length}</div>
                  <div className="text-xs text-blue-200 mb-1 leading-tight">Kandidat<br/>terdaftar</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><TrendingUp size={20} /></div>
                  <span className="bg-[#628ECB] text-white text-xs font-bold px-2 py-1 rounded-lg">Proses</span>
                </div>
                <div className="text-sm text-slate-500 mb-1">Menunggu Interview</div>
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold">{inProcessCount}</div>
                  <div className="text-xs text-slate-400 mb-1 leading-tight">Kandidat<br/>dalam proses</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><CheckCircle2 size={20} /></div>
                  <span className="bg-[#395886] text-white text-xs font-bold px-2 py-1 rounded-lg">Hired</span>
                </div>
                <div className="text-sm text-slate-500 mb-1">Diterima</div>
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold">{hiredCount}</div>
                  <div className="text-xs text-slate-400 mb-1 leading-tight">Kandidat<br/>diterima</div>
                </div>
              </div>

             
            </div>

            {/* Bar Chart Section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg">Tren Lamaran</h3>
                  <p className="text-sm text-slate-500">Jumlah kandidat per bulan</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-[#8AAEE0]"></div> Dalam Proses</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-[#395886]"></div> Diterima</div>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                  6 bulan terakhir <ChevronDown size={14} />
                </span>
              </div>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500" role="status">Memuat tren…</div>
                ) : !hasData ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    {loadError ?? 'Belum ada data lamaran.'}
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentMonths} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="screening" fill="#8AAEE0" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="hired" fill="#395886" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Candidates List */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-lg text-[#395886]">Daftar Kandidat</h3>
                  <p className="text-xs text-slate-500">Dari server SetaraKerja</p>
                </div>
                <button onClick={() => onNavigate('hrd-candidates')} className="text-sm font-medium text-[#395886] hover:underline">
                  Kelola Semua
                </button>
              </div>
              {statusError && (
                <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {statusError}
                </div>
              )}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                 {loading && <div className="p-3 text-sm text-slate-500">Memuat kandidat…</div>}
                 {!loading && hasData === false && (
                   <div className="p-3 text-sm text-slate-400">{loadError ?? 'Belum ada kandidat yang melamar.'}</div>
                 )}
                 {!loading && candidates.map(c => (
                   <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-[#395886] text-white rounded-xl flex items-center justify-center font-mono text-xs shrink-0">
                         {c.isRevealed ? c.revealedData?.name.split(' ').map(n=>n[0]).join('').slice(0,2) : '??'}
                       </div>
                        <div>
                          <div className="font-bold text-sm text-[#395886]">{c.isRevealed ? c.revealedData?.name : c.code}</div>
                          <div className="mt-1">
                            <label>
                              <span className="sr-only">Status kandidat {c.code}</span>
                              <select
                                value={c.status}
                                onChange={e => changeStatus(c.id, e.target.value as Candidate['status'])}
                                disabled={savingStatusId === c.id}
                                aria-label={`Ubah status ${c.code}`}
                                className="cursor-pointer rounded-lg border border-[#D5DEEF] bg-[#F0F3FA] px-2 py-1 text-xs font-semibold text-[#395886] outline-none transition disabled:cursor-wait disabled:opacity-60"
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                     </div>
                     <div className="text-right shrink-0 ml-4">
                        {(c.status === 'applied' || c.status === 'screening') && (
                          <button
                            onClick={() => changeStatus(c.id, 'interview_requested')}
                            className="bg-[#395886] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#628ECB] transition-colors"
                          >
                            Tindak Lanjut
                          </button>
                        )}
                        {c.status === 'interview_requested' && !c.isRevealed && (
                          <button
                            onClick={() => setRevealTarget(c.id)}
                            className="bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Ungkap Identitas
                          </button>
                        )}
                        {c.isRevealed && c.status !== 'hired' && (
                          <button
                            onClick={() => changeStatus(c.id, 'hired')}
                            className="border border-[#395886] text-[#395886] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
                          >
                            Terima
                          </button>
                        )}
                        {c.status === 'hired' && (
                           <span className="text-xs font-bold text-[#395886] flex items-center gap-1">
                             <CheckCircle2 size={14} /> Diterima
                           </span>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
            </div>

          </div>

          {/* Right Column (4 cols) */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
            
            {/* Pie Chart Card */}
            <div className="bg-gradient-to-br from-[#D5DEEF] to-[#B1C9EF] rounded-3xl p-6 shadow-sm flex flex-col h-auto">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-[#395886]">Lowongan Dilamar</h3>
                  <p className="text-sm text-slate-600">Sebaran kandidat per posisi</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-700 bg-white/50 px-2 py-1 rounded-lg">
                  {candidates.length} kandidat
                </span>
              </div>

              <div className="h-64 w-full flex items-center justify-center my-4 relative">
                {pieData.length === 0 ? (
                  <div className="text-sm text-slate-600">{loading ? 'Memuat…' : (loadError ?? 'Belum ada data kandidat.')}</div>
                ) : (
                <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={100} paddingAngle={0} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Decorative lines like in the pie chart */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[100px] h-[100px] border-r border-b border-white/30 translate-x-[50px] translate-y-[50px]"></div>
                </div>
                </>
                )}
              </div>

              <div className="space-y-2 mt-auto">
                {pieData.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-slate-700 font-medium min-w-0 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} aria-hidden="true" />
                      {item.name}
                    </span>
                    <span className="font-bold text-[#395886]">
                      {item.value} kandidat
                      {candidates.length > 0 ? ` · ${Math.round((item.value / candidates.length) * 100)}%` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Right Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-[#395886]">Status Kandidat</h3>
                  <p className="text-sm text-slate-500">Sebaran tahap proses rekrutmen</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                  Realtime
                </span>
              </div>

              <div className="space-y-3">
                {!hasData && (
                  <p className="text-sm text-slate-400">{loading ? 'Memuat…' : (loadError ?? 'Belum ada data kandidat.')}</p>
                )}
                {statusBreakdown.map(row => (
                  <div key={row.status} className="flex items-center gap-3 text-xs">
                    <span className="w-32 flex-shrink-0 text-slate-600 truncate">{row.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#395886] rounded-full transition-all"
                        style={{ width: `${(row.count / statusMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-bold text-[#395886]">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
