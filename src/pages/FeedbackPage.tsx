import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  UserRound,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  CalendarClock,
  Accessibility,
  ShieldCheck,
  Sparkles,
  Handshake,
} from 'lucide-react';
import { ApiError, fetchCandidates, fetchJobs, fetchMessages, fetchMyApplications, getSessionUser, sendMessage } from '../lib/api';

type Message = { id: number; author: 'Kandidat' | 'HRD'; text: string; time: string };

/** Tujuan feedback: HRD perusahaan (kandidat) / kandidat atau lowongan (HRD). */
type TargetOption = {
  key: string;
  label: string;
  group: string;
  applicationId?: string;
  jobId?: string;
  /** Nama perusahaan yang diajak ngobrol — dipakai kandidat. */
  company?: string;
};

/** Bentuk lamaran singkat untuk menyusun daftar HRD perusahaan. */
type MyApplication = { id: string | number; jobTitle: string; company: string };

/** Lowongan terakhir milik kandidat — dipakai untuk konteks percakapan. */
type LatestApplication = {
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  anonymousId?: string;
} | null;

const STATUS_STAGE: Record<string, number> = {
  applied: 0,
  screening: 1,
  interview_requested: 2,
  interview_scheduled: 2,
  hired: 3,
  rejected: 1,
};

/* Kebutuhan akomodasi — klik untuk menyisipkan ke kolom pesan */
const ACCOMMODATIONS = [
  'Live caption saat sesi video',
  'Juru bahasa isyarat saat interview',
  'Ramah kursi roda di lokasi kantor',
  'Pembaca layar (screen reader)',
  'Jadwal di luar jam kerja',
  'Ruang tenang saat istirahat',
];

const QUICK_REPLIES: Record<'kandidat' | 'hrd', string[]> = {
  kandidat: [
    'Baik, terima kasih atas informasinya.',
    'Mohon maaf, saya butuh waktu untuk menyiapkan jawaban terbaik.',
    'Apakah interview dapat dijadwalkan di luar jam kerja?',
    'Portofolio terbaru sudah saya kirimkan melalui platform.',
  ],
  hrd: [
    'Terima kasih, lamaran Anda sedang kami proses.',
    'Kami akan menyiapkan akomodasi sesuai kebutuhan Anda.',
    'Mohon konfirmasi ketersediaan jadwal interview Anda.',
    'Portofolio Anda sudah diterima tim rekrutmen.',
  ],
};

/* Panduan komunikasi — menjaga proses tetap blind & nyaman */
const GUIDELINES = [
  'Jangan menyebut nama, usia, atau penampilan — fokus ke skill & pengalaman.',
  'Gunakan kalimat singkat dan sederhana agar mudah dipahami semua pihak.',
  'Balas pesan idealnya dalam 1×24 jam kerja agar proses tidak tertunda.',
  'Semua kebutuhan akomodasi aman dibicarakan di sini, bukan di CV.',
];

export default function FeedbackPage({ role = 'kandidat' }: { role?: 'kandidat' | 'hrd' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestApplication>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<TargetOption | null>(null);
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const author = role === 'hrd' ? 'HRD' : 'Kandidat';
  const quickReplies = QUICK_REPLIES[role === 'hrd' ? 'hrd' : 'kandidat'];

  // Daftar tujuan feedback.
  // Kandidat: HANYA HRD dari perusahaan yang pernah ia lamar.
  // HRD: kandidat/lamaran perusahaannya atau lowongan yang ia pasang.
  useEffect(() => {
    let cancelled = false;
    if (role !== 'hrd') {
      fetchMyApplications()
        .then((apps) => {
          if (cancelled) return;
          const list = (Array.isArray(apps) ? apps : []) as MyApplication[];
          // Kelompokkan lamaran per perusahaan => satu thread HRD per perusahaan.
          const byCompany = new Map<string, number>();
          list.forEach((app) => {
            const company = (app.company || '').trim();
            if (!company) return;
            byCompany.set(company, (byCompany.get(company) ?? 0) + 1);
          });
          setTargetOptions(
            [...byCompany.keys()].map((company) => ({
              key: `company-${company}`,
              label: `HRD · ${company}`,
              group: 'HRD perusahaan yang saya lamar',
              company,
            }))
          );
          setOptionsError(list.length > 0 && byCompany.size === 0
            ? 'Lamaran Anda belum memiliki nama perusahaan.'
            : null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setTargetOptions([]);
          setOptionsError(err instanceof ApiError ? err.message : 'Gagal memuat daftar lamaran.');
        });
      return () => {
        cancelled = true;
      };
    }

    const company = getSessionUser()?.companyName || '';
    Promise.all([fetchCandidates(), fetchJobs()])
      .then(([candidates, jobs]) => {
        if (cancelled) return;
        const appOptions = (Array.isArray(candidates) ? candidates : []).map((c: any) => ({
          key: `cand-${c.id}`,
          label: `${c.code ?? c.id} · ${c.jobTitle ?? 'Lowongan'}`,
          group: 'Kandidat yang melamar',
          applicationId: String(c.id),
        }));
        const jobOptions = (Array.isArray(jobs) ? jobs : [])
          .filter((j: any) => !company || j.company === company)
          .map((j: any) => ({
            key: `job-${j.id}`,
            label: j.title,
            group: 'Lowongan yang dipasang',
            jobId: String(j.id),
          }));
        setTargetOptions([...appOptions, ...jobOptions]);
        setOptionsError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTargetOptions([]);
        setOptionsError(err instanceof ApiError ? err.message : 'Gagal memuat daftar tujuan feedback.');
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  // Muat percakapan sesuai tujuan yang dipilih.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchMessages(
      'feedback',
      target ? { applicationId: target.applicationId, jobId: target.jobId, company: target.company } : {}
    )
      .then(serverMessages => {
        if (cancelled) return;
        setMessages(Array.isArray(serverMessages) ? (serverMessages as Message[]) : []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMessages([]);
        setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat percakapan dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  // Konteks lamaran terakhir (hanya untuk kandidat).
  useEffect(() => {
    let cancelled = false;
    if (role === 'hrd') {
      setLatest(null);
      return;
    }
    fetchMyApplications()
      .then(apps => {
        if (cancelled) return;
        const first = (Array.isArray(apps) && apps.length > 0 ? apps[0] : null) as LatestApplication;
        setLatest(first);
      })
      .catch(() => {
        if (!cancelled) setLatest(null);
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const stageIndex = latest ? (STATUS_STAGE[latest.status] ?? 0) : -1;
  const appliedLabel = latest?.appliedAt
    ? new Date(latest.appliedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const timeline = [
    { label: 'Lamaran terkirim', note: latest ? appliedLabel : 'Belum ada lamaran', state: 'done' as const },
    {
      label: 'Seleksi administrasi',
      note: stageIndex >= 1 ? 'Selesai' : 'Menunggu review HRD',
      state: stageIndex >= 1 ? ('done' as const) : ('current' as const),
    },
    {
      label: 'Interview',
      note:
        stageIndex >= 2
          ? latest?.status === 'interview_scheduled' ? 'Sudah terjadwal' : 'Menunggu konfirmasi HRD'
          : 'Belum dijadwalkan',
      state: stageIndex > 2 ? ('done' as const) : stageIndex === 2 ? ('current' as const) : ('todo' as const),
    },
    {
      label: 'Penawaran kerja',
      note: stageIndex >= 3 ? 'Lamaran diterima' : 'Menunggu hasil interview',
      state: stageIndex >= 3 ? ('done' as const) : ('todo' as const),
    },
  ];
  const stageNumber = Math.min(4, Math.max(1, stageIndex + 1));

  const statusLabel: Record<string, string> = {
    applied: 'Terkirim',
    screening: 'Seleksi',
    interview_requested: 'Menunggu interview',
    interview_scheduled: 'Interview terjadwal',
    hired: 'Diterima',
    rejected: 'Tidak dilanjutkan',
  };
  const headerBadge = latest
    ? statusLabel[latest.status] ?? 'Proses'
    : 'Belum ada lamaran';

  const upcoming = (() => {
    if (!latest) return [] as { day: string; month: string; title: string; time: string }[];
    if (!['interview_requested', 'interview_scheduled'].includes(latest.status)) return [];
    const d = latest.appliedAt ? new Date(latest.appliedAt) : null;
    return [
      {
        day: d ? String(d.getDate()).padStart(2, '0') : '--',
        month: d ? d.toLocaleDateString('id-ID', { month: 'short' }) : '',
        title: `Interview · ${latest.jobTitle}`,
        time:
          latest.status === 'interview_scheduled'
            ? 'Terjadwal — konfirmasi lewat pesan ini'
            : 'Menunggu konfirmasi jadwal dari HRD',
      },
    ];
  })();

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    const optimistic: Message = {
      id: Date.now(),
      author,
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, optimistic]);
    setDraft('');
    setSending(true);
    sendMessage(
      text,
      'feedback',
      role === 'hrd' ? 'hrd' : 'kandidat',
      target ? { applicationId: target.applicationId, jobId: target.jobId, company: target.company } : {}
    )
      .then(saved => {
        setMessages(m => m.map(msg => (msg.id === optimistic.id ? { ...saved, id: saved.id ?? optimistic.id } as Message : msg)));
      })
      .catch(() => {
        setMessages(m => m.filter(msg => msg.id !== optimistic.id));
        setDraft(text);
      })
      .finally(() => setSending(false));
  };

  const insertAccommodation = (label: string) => {
    const line = `Saya membutuhkan ${label} saat interview.`;
    setDraft(d => (d.trim() ? `${d.trim()} ${line}` : line));
  };

  return (
    <section className="min-h-full bg-[#F0F3FA] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-[#628ECB]">
            <MessageSquare size={17} />
            <span className="text-xs font-bold uppercase tracking-[.16em]">Ruang komunikasi</span>
          </div>
          <h1 className="text-2xl font-bold text-[#395886]">Feedback & koordinasi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pesan singkat antara kandidat dan HRD untuk menyiapkan proses rekrutmen yang nyaman.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* ── Kolom kiri: percakapan ─────────────────────────────────── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D5DEEF] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5ECF7] px-5 py-4 sm:px-6">
                <div>
                  <div className="font-semibold text-[#395886]">Percakapan rekrutmen</div>
                  <div className="text-xs text-slate-500">
                    {target
                      ? `Tujuan: ${target.label}`
                      : latest
                        ? `${latest.jobTitle} · ${latest.company}`
                        : 'Umum — semua pihak di ruang ini'}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                  style={{ background: '#E6EEF9', color: '#395886' }}
                >
                  <Clock size={13} aria-hidden="true" />
                  {headerBadge}
                </span>
              </div>

              <div className="flex max-h-[540px] min-h-[320px] flex-col gap-5 overflow-y-auto p-5 sm:p-6">
                {loading && (
                  <p className="text-sm text-slate-500" role="status">Memuat percakapan…</p>
                )}
                {!loading && loadError && (
                  <p className="text-sm text-red-500" role="alert">{loadError}</p>
                )}
                {!loading && !loadError && messages.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Belum ada pesan. Sampaikan kebutuhan atau pertanyaan pertamamu lewat kolom di bawah.
                  </p>
                )}
                {messages.map(m => {
                  const mine = m.author === author;
                  const Icon = m.author === 'HRD' ? Building2 : UserRound;
                  return (
                    <div key={m.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D5DEEF] text-[#395886]">
                        <Icon size={15} aria-hidden="true" />
                      </div>
                      <div className={`max-w-[80%] ${mine ? 'text-right' : ''}`}>
                        <div className="mb-1 text-xs font-semibold text-[#628ECB]">{m.author}</div>
                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${mine ? 'rounded-tr-sm bg-[#395886] text-white' : 'rounded-tl-sm bg-[#F0F3FA] text-slate-700'}`}>
                          {m.text}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{m.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tujuan feedback (HRD: kandidat / lowongan miliknya, kandidat: lamarannya) */}
              {targetOptions.length > 0 && (
                <div className="border-t border-[#E5ECF7] px-5 pt-4 sm:px-6">
                  <label htmlFor="feedback-target" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#628ECB]">
                    <UserRound size={13} aria-hidden="true" />
                    Tujuan feedback
                  </label>
                  <select
                    id="feedback-target"
                    value={target?.key ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTarget(targetOptions.find(option => option.key === value) ?? null);
                    }}
                    className="w-full rounded-xl border border-[#D5DEEF] bg-[#F0F3FA] px-3.5 py-2.5 text-sm text-[#395886] outline-none transition focus:border-[#628ECB] focus:ring-4 focus:ring-[#D5DEEF]"
                  >
                    <option value="">Umum — semua pihak di ruang ini</option>
                    {Array.from(new Set(targetOptions.map(option => option.group))).map(group => (
                      <optgroup key={group} label={group}>
                        {targetOptions
                          .filter(option => option.group === group)
                          .map(option => (
                            <option key={option.key} value={option.key}>{option.label}</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  {optionsError && <p className="mt-1 text-xs text-red-500">{optionsError}</p>}
                </div>
              )}

              {/* Balasan cepat */}
              <div className="border-t border-[#E5ECF7] px-5 pt-4 sm:px-6">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#628ECB]">
                  <Sparkles size={13} aria-hidden="true" />
                  Balasan cepat
                </div>
                <div className="flex flex-wrap gap-2 pb-4">
                  {quickReplies.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDraft(q)}
                      className="rounded-full border border-[#D5DEEF] bg-[#F0F3FA] px-3 py-1.5 text-xs font-medium text-[#395886] transition hover:border-[#628ECB] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E5ECF7] p-4 sm:px-6 sm:pb-5">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Tulis pesan yang jelas dan sopan…"
                    aria-label="Tulis pesan"
                    className="min-w-0 flex-1 rounded-xl border border-[#D5DEEF] px-4 py-3 text-sm text-[#395886] outline-none transition focus:border-[#628ECB] focus:ring-4 focus:ring-[#D5DEEF]"
                  />
                  <button
                    onClick={send}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#395886] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#628ECB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                  >
                    <Send size={16} aria-hidden="true" />
                    Kirim
                  </button>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Identitas terenkripsi — HRD hanya melihat skill dan kecocokan, bukan data pribadi.
                </p>
              </div>
            </div>

            {/* Etika komunikasi */}
            <div className="rounded-2xl border border-[#D5DEEF] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-[#395886]">
                <Handshake size={16} aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Etika komunikasi</h2>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GUIDELINES.map(g => (
                  <li
                    key={g}
                    className="flex items-start gap-2 rounded-xl bg-[#F0F3FA] px-3 py-3 text-xs leading-relaxed text-slate-600"
                  >
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#628ECB]" aria-hidden="true" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Kolom kanan: konteks rekrutmen ─────────────────────────── */}
          <aside aria-label="Konteks percakapan" className="flex flex-col gap-6">
            {/* Status rekrutmen */}
            <div className="rounded-2xl border border-[#D5DEEF] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#395886]">Status rekrutmen</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#628ECB]">Tahap {stageNumber}/4</span>
              </div>
              <ol className="relative space-y-4 pl-6">
                <span className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D5DEEF]" aria-hidden="true" />
                {timeline.map(t => (
                  <li key={t.label} className="relative">
                    <span
                      className={`absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${
                        t.state === 'done'
                          ? 'bg-[#15803D] text-white'
                          : t.state === 'current'
                            ? 'bg-[#395886] text-white ring-4 ring-[#E6EEF9]'
                            : 'bg-[#E6EEF9] text-[#628ECB]'
                      }`}
                      aria-hidden="true"
                    >
                      {t.state === 'done' ? <CheckCircle2 size={11} /> : t.state === 'current' ? <Circle size={7} fill="currentColor" /> : <Circle size={7} />}
                    </span>
                    <div className={`text-sm font-semibold ${t.state === 'todo' ? 'text-slate-400' : 'text-[#1A2A3A]'}`}>{t.label}</div>
                    <div className="text-xs text-slate-500">{t.note}</div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Kebutuhan akomodasi */}
            <div className="rounded-2xl border border-[#D5DEEF] bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-[#395886]">
                <Accessibility size={16} aria-hidden="true" />
                <h2 className="text-sm font-bold">Kebutuhan akomodasi</h2>
              </div>
              <p className="mb-3 text-xs text-slate-500">Klik untuk menyisikannya ke kolom pesan.</p>
              <div className="flex flex-wrap gap-2">
                {ACCOMMODATIONS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => insertAccommodation(a)}
                    className="rounded-full border border-[#D5DEEF] bg-[#F0F3FA] px-3 py-1.5 text-xs font-medium text-[#395886] transition hover:border-[#628ECB] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    + {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Info pihak terkait */}
            <div className="rounded-2xl border border-[#D5DEEF] bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[#395886]">Pihak dalam percakapan</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-[#F0F3FA] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#395886] text-white" aria-hidden="true">
                    <Building2 size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#1A2A3A]">
                      {target?.company
                        ? `${target.company} · HRD`
                        : latest ? `${latest.company} · HRD` : 'HRD perusahaan'}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {target?.company
                        ? 'HRD perusahaan yang Anda lamar'
                        : latest?.jobTitle ?? 'Percakapan rekrutmen'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#F0F3FA] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#628ECB] text-white" aria-hidden="true">
                    <UserRound size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#1A2A3A]">
                      {role === 'hrd' ? `Kandidat ${latest?.anonymousId ?? ''}`.trim() : 'Anda'}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {latest ? `Lamaran ${appliedLabel}` : 'Blind profile'}
                    </div>
                  </div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-[#E6EEF9] p-3">
                  <dd className="text-lg font-extrabold text-[#395886]" style={{ fontFamily: 'var(--font-mono)' }}>{messages.length}</dd>
                  <dt className="text-[10px] text-slate-500">Total pesan</dt>
                </div>
                <div className="rounded-xl bg-[#E6EEF9] p-3">
                  <dd className="text-lg font-extrabold text-[#15803D]" style={{ fontFamily: 'var(--font-mono)' }}>
                    {messages.filter(m => m.author === 'HRD').length}
                  </dd>
                  <dt className="text-[10px] text-slate-500">Balasan HRD</dt>
                </div>
              </dl>
            </div>

            {/* Jadwal berikutnya */}
            <div className="rounded-2xl border border-[#D5DEEF] bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-[#395886]">
                <CalendarClock size={16} aria-hidden="true" />
                <h2 className="text-sm font-bold">Jadwal berikutnya</h2>
              </div>
              <p className="mb-3 text-xs text-slate-500">Konfirmasi lewat pesan ini agar semua pihak siap.</p>
              <ul className="space-y-2.5">
                {upcoming.length === 0 && (
                  <li className="rounded-xl bg-[#F0F3FA] p-3 text-xs text-slate-500">
                    Belum ada jadwal mendatang. Jadwal interview akan muncul setelah HRD menyetujui lamaranmu.
                  </li>
                )}
                {upcoming.map(u => (
                  <li key={u.title} className="flex items-start gap-3 rounded-xl bg-[#F0F3FA] p-3">
                    <span
                      className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl leading-none"
                      style={{ background: '#395886', color: '#fff' }}
                      aria-hidden="true"
                    >
                      <span className="text-[9px] font-bold uppercase">{u.month}</span>
                      <span className="text-sm font-extrabold">{u.day}</span>
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1A2A3A]">{u.title}</div>
                      <div className="text-xs text-slate-500">{u.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
