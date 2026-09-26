import React, { useEffect, useState } from 'react';
import { Award, Bot, BriefcaseBusiness, Eye, FileText, FolderOpen, Palette, Pencil, Trash2, Trophy } from 'lucide-react';
import type { Page } from './types';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { useBlindMode } from './hooks/useBlindMode';

import Header from './components/Header';
import Footer from './components/Footer';
import AccessibilityToggle from './components/AccessibilityToggle';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KandidatDashboard from './pages/KandidatDashboard';
import HRDDashboard from './pages/HRDDashboard';
import HRDPostJobPage from './pages/HRDPostJobPage';
import InterviewPage from './pages/InterviewPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import JobMatchingPage from './pages/JobMatchingPage';
import FeedbackPage from './pages/FeedbackPage';
import KandidatLayout from './layouts/KandidatLayout';
import KandidatApplicationsPage from './pages/KandidatApplicationsPage';
import {
  getSessionUser,
  getToken,
  logoutRequest,
  createNeed,
  deleteNeed,
  fetchNeeds,
  updateNeed,
  fetchPortfolios,
  fetchMyApplications,
  fetchCandidates,
  fetchApplicationDetail,
  FILES_ORIGIN,
  updateApplicationStatus,
  fetchSkills,
  createSkill,
  updateSkill,
  verifySkill,
  deleteSkill,
  ApiError,
  type PassportSkill,
  type CandidateSkill,
  type CandidatePortfolio,
} from './lib/api';

// ─── Placeholder pages ────────────────────────────────────────────────────────

type PortfolioFile = { id: string; name: string; size: number; mimeType: string; url?: string; uploadedAt?: string };

const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function KandidatPortfolio({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  const [files, setFiles] = useState<PortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchPortfolios()
      .then(list => {
        if (cancelled) return;
        setFiles(Array.isArray(list) ? (list as PortfolioFile[]) : []);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFiles([]);
        setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat portofolio dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const extOf = (name: string) => ((name.split('.').pop() || '').split('?')[0] || 'file').toUpperCase();
  const extCounts = files.reduce<Record<string, number>>((acc, f) => {
    const ext = extOf(f.name);
    acc[ext] = (acc[ext] ?? 0) + 1;
    return acc;
  }, {});
  const topExt = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const lastUpload = files.length > 0 && files[0].uploadedAt
    ? new Date(files[0].uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const statsRow = [
    { icon: Palette, label: 'Total Karya', value: String(files.length) },
    { icon: Eye, label: 'Total Ukuran', value: fmtSize(totalSize) },
    { icon: Award, label: 'Format Terbanyak', value: topExt },
    { icon: Trophy, label: 'Terakhir Upload', value: lastUpload },
  ];

  const projects = files.map(f => ({
    title: f.name,
    type: extOf(f.name),
    date: f.uploadedAt
      ? new Date(f.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—',
    size: fmtSize(f.size || 0),
    icon: FileText,
  }));

  const activity = files.slice(0, 3).map(f => ({
    time: f.uploadedAt
      ? new Date(f.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : '—',
    text: `${f.name} diunggah`,
    icon: FileText,
  }));

  const total = files.length || 1;
  const statusBars = Object.entries(extCounts).map(([ext, count], i) => ({
    label: `File .${ext.toLowerCase()}`,
    pct: Math.round((count / total) * 100),
    color: ['#395886', '#628ECB', '#8AAEE0'][i % 3],
  }));

  return (
    <div className="min-h-full" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">

        {/* ── Greeting banner ── */}
        <div
          className="rounded-2xl px-7 py-6 mb-6 flex items-center justify-between portfolio-header"
          style={{ background: 'linear-gradient(135deg, #395886 0%, #628ECB 100%)' }}
        >
          <div>
            <div className="text-blue-200 text-sm font-medium mb-1">Selamat datang kembali</div>
            <h1 className="text-2xl font-bold text-white">Portofolio Saya</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ color: '#D5DEEF', border: '1px solid rgba(255,255,255,0.3)' }}>
              Export PDF
            </button>
            <button
              onClick={() => onNavigate('kandidat')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)' }}
            >
              + Upload Karya
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsRow.map((s, i) => (
            <div
              key={i}
              className={`rounded-2xl p-5 border transition-all hover:shadow-md hover:-translate-y-0.5 portfolio-card-${i + 1} ${mounted ? 'card-visible' : 'card-hidden'}`}
              style={{
                background: 'var(--color-card-bg)',
                borderColor: 'var(--color-border-subtle)',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
                  <s.icon size={19} style={{ color: '#395886' }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-0.5 tabular-nums" style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: project list */}
          <div
            className={`lg:col-span-2 rounded-2xl border overflow-hidden ${mounted ? 'card-visible' : 'card-hidden'}`}
            style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)', animationDelay: '0.15s' }}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--color-heading)' }}>Karya Aktif</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-4)' }}>{projects.length} karya · Semua terenkripsi &amp; anonim</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{ borderColor: 'var(--color-border)', color: '#628ECB', background: 'var(--color-surface)' }}>←</button>
                <button className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{ borderColor: 'var(--color-border)', color: '#628ECB', background: 'var(--color-surface)' }}>→</button>
              </div>
            </div>

            <div className="divide-y" style={{ '--tw-divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}>
              {loading && (
                <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-text-4)' }} role="status">
                  Memuat portofolio…
                </div>
              )}
              {!loading && loadError && (
                <div className="px-6 py-8 text-center" role="alert">
                  <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{loadError}</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey(k => k + 1)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
              {!loading && !loadError && projects.length === 0 && (
                <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-text-4)' }}>
                  Belum ada karya. Upload portofolio pertamamu di bawah ini.
                </div>
              )}
              {projects.map((proj, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-center gap-4 transition-colors hover:bg-blue-50/30 group"
                  style={{ animationDelay: `${0.2 + i * 0.07}s` }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface)' }}>
                    <proj.icon size={20} style={{ color: '#395886' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-heading)' }}>{proj.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#628ECB' }}>{proj.date}</div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0" style={{ background: 'var(--color-surface)', color: '#628ECB' }}>
                    {proj.type}
                  </span>
                  <div className="text-right flex-shrink-0 w-20">
                    <div className="text-sm font-bold tabular-nums" style={{ color: '#395886', fontFamily: 'var(--font-mono)' }}>{proj.size}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-4)' }}>Ukuran</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div
                className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ borderColor: 'var(--color-border)' }}
                onClick={() => onNavigate('kandidat')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onNavigate('kandidat')}
              >
                <FolderOpen size={25} className="mx-auto mb-1.5" style={{ color: '#395886' }} />
                <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-1)' }}>Tambah Karya Baru</div>
                <p className="text-xs" style={{ color: 'var(--color-text-4)' }}>Drag &amp; drop atau klik · PDF, ZIP, PNG, JPG · Maks 50 MB</p>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Status bars */}
            <div
              className={`rounded-2xl border p-6 ${mounted ? 'card-visible' : 'card-hidden'}`}
              style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)', animationDelay: '0.25s' }}
            >
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-heading)' }}>Status Karya</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-4)' }}>Ringkasan per kategori</p>
              <div className="space-y-4">
                {statusBars.map((b, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-heading)' }}>{b.label}</span>
                      <span className="text-xs font-bold" style={{ color: b.color }}>{b.pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}
                      role="progressbar" aria-valuenow={b.pct} aria-valuemin={0} aria-valuemax={100} aria-label={b.label}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: mounted ? `${b.pct}%` : '0%', background: b.color, transitionDelay: `${0.3 + i * 0.1}s` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div
              className={`rounded-2xl border flex-1 p-6 ${mounted ? 'card-visible' : 'card-hidden'}`}
              style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)', animationDelay: '0.33s' }}
            >
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-heading)' }}>Aktivitas Terkini</h3>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-4)' }}>Update portofoliomu</p>
              <div className="space-y-4">
                {activity.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-text-4)' }}>Belum ada aktivitas terbaru.</p>
                )}
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface)' }}><a.icon size={15} style={{ color: '#395886' }} /></div>
                    <div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-1)' }}>{a.text}</p>
                      <span className="text-xs" style={{ color: 'var(--color-text-4)' }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Baris skill di Skill Passport: dari skill manual (tabel `skills`) atau skor lamaran. */
type PassportRow = {
  key: string;
  id?: string;
  skill: string;
  score: number;
  verifiedAt: string | null;
  createdAt?: string | null;
  source: 'manual' | 'lamaran';
  jobTitle?: string;
};

function KandidatPassport({ onNavigate: _nav }: { onNavigate: (p: Page) => void }) {
  const [activeTab, setActiveTab] = React.useState<'skills' | 'activity'>('skills');
  const [rows, setRows] = React.useState<PassportRow[]>([]);
  const [appCount, setAppCount] = React.useState(0);
  const [anonymousId, setAnonymousId] = React.useState<string | null>(null);
  const [passportLoading, setPassportLoading] = React.useState(true);
  const [passportError, setPassportError] = React.useState<string | null>(null);
  const [passportReload, setPassportReload] = React.useState(0);
  const [openHistory, setOpenHistory] = React.useState<string | null>(null);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [modal, setModal] = React.useState<{ mode: 'create' } | { mode: 'edit'; row: PassportRow } | null>(null);
  const [formName, setFormName] = React.useState('');
  const [formScore, setFormScore] = React.useState(70);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  // Skill Passport = skill manual pengguna + skor skill dari lamaran milik pengguna.
  React.useEffect(() => {
    let cancelled = false;
    setPassportLoading(true);
    setPassportError(null);
    Promise.all([fetchSkills(), fetchMyApplications()])
      .then(([manual, apps]) => {
        if (cancelled) return;
        const list = Array.isArray(apps) ? apps : [];
        setAppCount(list.length);
        setAnonymousId(list[0]?.anonymousId ?? getSessionUser()?.id ?? null);

        const manualRows: PassportRow[] = (manual ?? []).map((m: PassportSkill) => ({
          key: `m-${m.id}`,
          id: String(m.id),
          skill: m.skill,
          score: m.score,
          verifiedAt: m.verifiedAt || null,
          createdAt: m.createdAt ?? null,
          source: 'manual',
        }));

        const appRows: PassportRow[] = [];
        const seen = new Set<string>();
        list.forEach((app: any) => {
          (app.skillScores ?? []).forEach((s: any) => {
            if (!s.skill) return;
            const name = String(s.skill);
            const k = name.toLowerCase();
            if (seen.has(k)) return;
            seen.add(k);
            appRows.push({
              key: `app-${k}`,
              skill: name,
              score: s.score ?? 0,
              verifiedAt: s.verifiedAt || null,
              source: 'lamaran',
              jobTitle: app.jobTitle,
            });
          });
        });

        const manualNames = new Set(manualRows.map(r => r.skill.toLowerCase()));
        const merged = [...manualRows, ...appRows.filter(r => !manualNames.has(r.skill.toLowerCase()))];
        merged.sort((a, b) => b.score - a.score);
        setRows(merged);
        setPassportError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows([]);
        setAppCount(0);
        setPassportError(err instanceof ApiError ? err.message : 'Gagal memuat Skill Passport dari server.');
      })
      .finally(() => {
        if (!cancelled) setPassportLoading(false);
      });
    return () => { cancelled = true; };
  }, [passportReload]);

  const reload = () => setPassportReload(k => k + 1);

  const skills = rows.map(r => ({
    ...r,
    level: r.score >= 90 ? 'Expert' : r.score >= 75 ? 'Advanced' : r.score >= 60 ? 'Intermediate' : 'Beginner',
    verifiedLabel: r.verifiedAt
      ? new Date(r.verifiedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Belum diverifikasi',
    icon: r.skill.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'SK',
  }));

  const verifiedCount = rows.filter(r => r.verifiedAt).length;
  const lastVerifiedRaw = rows
    .map(r => r.verifiedAt)
    .filter(Boolean)
    .sort()
    .slice(-1)[0];
  const lastVerified = lastVerifiedRaw
    ? new Date(lastVerifiedRaw).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const activity = rows
    .flatMap(r => {
      const items: { date: string; text: string }[] = [];
      if (r.verifiedAt) {
        items.push({
          date: r.verifiedAt,
          text: r.source === 'manual'
            ? `${r.skill} diverifikasi (${r.score}/100)`
            : `${r.skill} diverifikasi lewat lamaran${r.jobTitle ? ` ${r.jobTitle}` : ''} (${r.score}/100)`,
        });
      }
      if (r.source === 'manual' && r.createdAt) {
        items.push({ date: r.createdAt, text: `${r.skill} ditambahkan ke passport (${r.score}/100)` });
      }
      return items;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 8)
    .map(a => ({
      ...a,
      time: new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    }));

  const levelStyle = (l: string) =>
    l === 'Expert'       ? { bg: '#D5DEEF', color: '#395886' } :
    l === 'Advanced'     ? { bg: '#e0f2fe', color: '#0369a1' } :
    l === 'Intermediate' ? { bg: '#fef9c3', color: '#854d0e' } :
                           { bg: '#f1f5f9', color: '#475569' };
  const barColor = (s: number) => s >= 90 ? '#628ECB' : s >= 75 ? '#395886' : '#8AAEE0';
  const avgScore = rows.length > 0 ? Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length) : 0;
  const topSkill = skills[0];

  const statCards = [
    { label: 'Total Skill',   value: rows.length.toString(), sub: 'Terdaftar',    accent: '#395886' },
    { label: 'Terverifikasi', value: `${verifiedCount}/${rows.length}`, sub: 'Skill aktif', accent: '#628ECB' },
    { label: 'Lamaran',       value: appCount.toString(),    sub: 'Terkirim',     accent: '#22c55e' },
    { label: 'Top Skill',     value: topSkill ? topSkill.skill : '—', sub: topSkill ? `${topSkill.score} / 100` : 'Belum ada data', accent: '#8AAEE0' },
  ];

  // ── Aksi skill ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setFormName('');
    setFormScore(70);
    setFormError(null);
    setModal({ mode: 'create' });
  };

  const openEdit = (row: PassportRow) => {
    setFormName(row.skill);
    setFormScore(row.score);
    setFormError(null);
    setModal({ mode: 'edit', row });
  };

  const saveSkill = async () => {
    const name = formName.trim();
    if (name.length < 2) {
      setFormError('Nama skill minimal 2 karakter.');
      return;
    }
    const score = Number(formScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setFormError('Skor harus antara 0 dan 100.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (modal && modal.mode === 'edit') {
        await updateSkill(modal.row.id!, { name, score });
        setNotice(`Skill "${name}" diperbarui.`);
      } else {
        await createSkill(name, score);
        setNotice(`Skill "${name}" ditambahkan. Selesaikan verifikasi supaya terhitung aktif.`);
      }
      setModal(null);
      reload();
    } catch (err: unknown) {
      setFormError(err instanceof ApiError ? err.message : 'Gagal menyimpan skill.');
    } finally {
      setSaving(false);
    }
  };

  const verifyRow = async (row: PassportRow) => {
    if (!row.id) return;
    setBusyKey(row.key);
    setNotice(null);
    try {
      await verifySkill(row.id);
      setNotice(`Skill "${row.skill}" terverifikasi.`);
      reload();
    } catch (err: unknown) {
      setNotice(err instanceof ApiError ? err.message : 'Gagal memverifikasi skill.');
    } finally {
      setBusyKey(null);
    }
  };

  const removeRow = async (row: PassportRow) => {
    if (!row.id) return;
    if (!window.confirm(`Hapus skill "${row.skill}" dari passport?`)) return;
    setBusyKey(row.key);
    setNotice(null);
    try {
      await deleteSkill(row.id);
      setNotice(`Skill "${row.skill}" dihapus.`);
      reload();
    } catch (err: unknown) {
      setNotice(err instanceof ApiError ? err.message : 'Gagal menghapus skill.');
    } finally {
      setBusyKey(null);
    }
  };

  // ── Download PDF ────────────────────────────────────────────────────────
  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError(null);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const M = 48;
      const clean = (t: unknown) => String(t ?? '').replace(/[^\x20-\x7E]/g, '');
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      // Kepala
      doc.setFillColor(57, 88, 134);
      doc.rect(0, 0, W, 96, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SetaraKerja', M, 44);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('Skill Passport', M, 66);
      doc.setFontSize(10);
      doc.text(`Kandidat ${anonymousId ? '#' + clean(anonymousId) : ''}`, W - M, 44, { align: 'right' });
      doc.text(`Dicetak: ${today}`, W - M, 62, { align: 'right' });

      // Ringkasan
      let y = 132;
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Ringkasan', M, y);
      y += 18;

      const stats: [string, string][] = [
        ['Total skill', String(rows.length)],
        ['Terverifikasi', `${verifiedCount}/${rows.length}`],
        ['Rata-rata skor', rows.length ? `${avgScore}/100` : '-'],
        ['Lamaran terkirim', String(appCount)],
      ];
      const boxW = (W - M * 2 - 12 * 3) / 4;
      stats.forEach(([label, value], i) => {
        const x = M + i * (boxW + 12);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(x, y, boxW, 54, 6, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(57, 88, 134);
        doc.text(clean(value), x + 10, y + 26);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(clean(label), x + 10, y + 42);
      });
      y += 80;

      // Tabel skill
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Daftar Skill', M, y);
      y += 16;

      const cols = [
        { label: 'SKILL', x: M, w: 190 },
        { label: 'LEVEL', x: M + 190, w: 80 },
        { label: 'SKOR', x: M + 270, w: 55 },
        { label: 'VERIFIKASI', x: M + 325, w: 110 },
        { label: 'SUMBER', x: M + 435, w: 70 },
      ];
      const drawHeader = () => {
        doc.setFillColor(57, 88, 134);
        doc.rect(M, y, W - M * 2, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        cols.forEach(c => doc.text(c.label, c.x + 6, y + 13));
        y += 20;
      };
      drawHeader();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      skills.forEach(s => {
        if (y > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          y = 48;
          drawHeader();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        }
        doc.setTextColor(30, 41, 59);
        doc.text(clean(s.skill).slice(0, 40), cols[0].x + 6, y + 13);
        doc.text(clean(s.level), cols[1].x + 6, y + 13);
        doc.text(`${s.score}/100`, cols[2].x + 6, y + 13);
        doc.text(clean(s.verifiedLabel), cols[3].x + 6, y + 13);
        doc.text(s.source === 'manual' ? 'Manual' : 'Lamaran', cols[4].x + 6, y + 13);
        y += 18;
        doc.setDrawColor(226, 232, 240);
        doc.line(M, y, W - M, y);
      });

      if (skills.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.text('Belum ada skill terdaftar.', M + 6, y + 13);
        y += 20;
      }

      // Catatan kaki
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Dokumen ini dibuat otomatis dari Skill Passport SetaraKerja. Halaman ${p}/${pages}`,
          M,
          doc.internal.pageSize.getHeight() - 28
        );
      }

      doc.save(`skill-passport-${anonymousId ? clean(anonymousId) : 'kandidat'}.pdf`);
    } catch (err: unknown) {
      setPdfError(err instanceof ApiError ? err.message : 'Gagal membuat PDF. Coba lagi.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="min-h-full" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ── */}
      <div className="px-6 sm:px-8 py-6 border-b flex items-center justify-between" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#628ECB' }}>SetaraKerja · Skill Passport</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-heading)' }}>Skill Passport</h1>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-text-4)' }}>
            {anonymousId ? `Kandidat #${anonymousId}` : 'Kandidat'} · Terakhir diperbarui: {lastVerified}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={downloadPdf}
            disabled={pdfBusy || passportLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
            style={{ background: 'linear-gradient(135deg, #395886, #628ECB)' }}
          >
            {pdfBusy ? 'Menyiapkan PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {pdfError && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm border flex items-center justify-between gap-3" role="alert" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
            <span>{pdfError}</span>
            <button type="button" onClick={downloadPdf} className="text-xs font-bold underline">Coba lagi</button>
          </div>
        )}
        {notice && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm border flex items-center justify-between gap-3" role="status" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}>
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs font-bold underline">Tutup</button>
          </div>
        )}
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((c, i) => (
            <div key={i} className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-4)' }}>{c.label}</div>
              <div className="text-2xl font-bold leading-none mb-1" style={{ color: c.accent, fontFamily: 'var(--font-mono)' }}>{c.value}</div>
              <div className="text-xs font-bold" style={{ color: 'var(--color-text-4)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left: skill list ── */}
          <div className="flex-1 min-w-0 rounded-2xl border overflow-hidden" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
            {/* Tabs */}
            <div className="px-6 pt-5 pb-0 flex items-center gap-1 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              {(['skills', 'activity'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="pb-3 px-3 text-sm font-bold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{
                    borderBottomColor: activeTab === tab ? '#395886' : 'transparent',
                    color: activeTab === tab ? '#395886' : 'var(--color-text-4)',
                  }}
                >
                  {tab === 'skills' ? 'Skill Saya' : 'Aktivitas'}
                </button>
              ))}
              <div className="ml-auto pb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--color-surface)', color: '#395886' }}>
                  {skills.length} skill
                </span>
              </div>
            </div>

            {/* Tab: Skills */}
            {activeTab === 'skills' && (
              <div>
                <div className="px-6 py-3 grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 text-xs font-bold uppercase tracking-widest border-b" style={{ color: 'var(--color-text-4)', borderColor: 'var(--color-border-subtle)' }}>
                  <span>Skill</span><span>Progress</span><span className="text-right">Level</span><span className="text-right">Score</span><span></span>
                </div>
                {passportLoading && (
                  <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-text-4)' }} role="status">Memuat Skill Passport…</div>
                )}
                {!passportLoading && passportError && (
                  <div className="px-6 py-8 text-center" role="alert">
                    <p className="text-sm mb-3" style={{ color: '#ef4444' }}>{passportError}</p>
                    <button
                      type="button"
                      onClick={() => setPassportReload(k => k + 1)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}
                {!passportLoading && !passportError && skills.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-text-4)' }}>
                    Belum ada skill di passport. Tambahkan skill pertamamu di bawah, atau lamar lowongan supaya skor skill terisi otomatis.
                  </div>
                )}
                {skills.map(s => {
                  const lc = levelStyle(s.level);
                  const bc = barColor(s.score);
                  const isOpen = openHistory === s.key;
                  return (
                    <React.Fragment key={s.key}>
                    <div
                      className="px-6 py-4 grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 items-center border-b transition-colors hover:bg-blue-50/20"
                      style={{ borderColor: 'var(--color-border-subtle)' }}
                    >
                      {/* Icon + name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--color-surface)', color: '#395886' }}>
                          {s.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-heading)' }}>
                            {s.skill}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface)', color: '#628ECB' }}>
                              {s.source === 'manual' ? 'Manual' : 'Lamaran'}
                            </span>
                          </div>
                          <div className="text-xs font-bold" style={{ color: 'var(--color-text-4)' }}>{s.verifiedLabel}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div
                        className="h-2.5 rounded-full overflow-hidden"
                        style={{ background: 'var(--color-surface)' }}
                        role="progressbar"
                        aria-valuenow={s.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${s.skill}: ${s.score}/100`}
                      >
                        <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: `linear-gradient(90deg, #395886, ${bc})` }} />
                      </div>

                      {/* Level badge */}
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: lc.bg, color: lc.color }}>
                        {s.level}
                      </span>

                      {/* Score */}
                      <span className="text-sm font-bold tabular-nums text-right" style={{ color: bc, fontFamily: 'var(--font-mono)' }}>
                        {s.score}/100
                      </span>

                      {/* Actions */}
                      <div className="flex gap-2 justify-end">
                        {s.id && !s.verifiedAt && (
                          <button
                            type="button"
                            onClick={() => verifyRow(s)}
                            disabled={busyKey === s.key}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            style={{ background: '#395886' }}
                          >
                            {busyKey === s.key ? '…' : 'Verifikasi'}
                          </button>
                        )}
                        {s.verifiedAt && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: '#DCFCE7', color: '#15803d' }} title="Sudah terverifikasi">
                            ✓ Terverifikasi
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenHistory(isOpen ? null : s.key)}
                          aria-expanded={isOpen}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          style={{ borderColor: 'var(--color-border-subtle)', color: '#628ECB', background: 'var(--color-surface)' }}
                        >
                          Riwayat
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-6 py-4 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-4)' }}>Riwayat skill</div>
                        <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-heading)' }}>
                          {s.source === 'manual' && s.createdAt && (
                            <li>
                              {new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · Ditambahkan manual (skor {s.score}/100)
                            </li>
                          )}
                          {s.source === 'lamaran' && (
                            <li>Diperoleh dari lamaran{s.jobTitle ? ` ${s.jobTitle}` : ''} (skor {s.score}/100)</li>
                          )}
                          {s.verifiedAt ? (
                            <li>{s.verifiedLabel} · Terverifikasi ({s.score}/100)</li>
                          ) : (
                            <li style={{ color: '#b45309' }}>Belum diverifikasi — klik Verifikasi untuk menandai skill ini sah.</li>
                          )}
                        </ul>
                        {s.id && (
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                              style={{ borderColor: 'var(--color-border-subtle)', color: '#395886', background: 'var(--color-card-bg)' }}
                            >
                              Ubah skor &amp; nama
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRow(s)}
                              disabled={busyKey === s.key}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              style={{ borderColor: '#fecaca', color: '#b91c1c', background: '#fef2f2' }}
                            >
                              {busyKey === s.key ? '…' : 'Hapus'}
                            </button>
                          </div>
                        )}
                        {s.source === 'lamaran' && (
                          <p className="text-xs mt-3" style={{ color: 'var(--color-text-4)' }}>
                            Skill dari lamaran dikelola otomatis oleh SetaraKerja dan tidak bisa dihapus manual.
                          </p>
                        )}
                      </div>
                    )}
                    </React.Fragment>
                  );
                })}

                {/* Add skill row */}
                <div className="px-6 py-5">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="w-full py-3.5 rounded-xl border-2 border-dashed text-sm font-bold transition-all hover:border-blue-400 hover:bg-blue-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    style={{ borderColor: 'var(--color-border)', color: '#628ECB' }}
                  >
                    + Tambah Skill Baru
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
              <div className="divide-y" style={{ '--tw-divide-color': 'var(--color-border-subtle)' } as React.CSSProperties}>
                {activity.length === 0 && (
                  <div className="px-6 py-8 text-center text-sm" style={{ color: 'var(--color-text-4)' }}>
                    Belum ada aktivitas verifikasi.
                  </div>
                )}
                {activity.map((a, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-surface)' }}>
                      <Award size={16} style={{ color: '#395886' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: 'var(--color-heading)' }}>{a.text}</div>
                      <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--color-text-4)' }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right panel: diagnostics ── */}
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Rangkuman passport */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm" style={{ color: 'var(--color-heading)' }}>Rangkuman Passport</h3>
              </div>
              <dl className="space-y-2.5">
                {[
                  { dt: 'Skill terdaftar', dd: `${skills.length}` },
                  { dt: 'Lamaran terkirim', dd: `${appCount}` },
                  { dt: 'Rata-rata skor', dd: skills.length > 0 ? `${avgScore}/100` : '—' },
                  { dt: 'Diperbarui', dd: lastVerified },
                ].map(row => (
                  <div key={row.dt} className="flex items-center justify-between gap-3">
                    <dt className="text-xs" style={{ color: 'var(--color-text-4)' }}>{row.dt}</dt>
                    <dd className="text-xs font-bold tabular-nums" style={{ color: '#395886', fontFamily: 'var(--font-mono)' }}>{row.dd}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Verifikasi status */}
            <div className="rounded-2xl border p-5" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-heading)' }}>Status Verifikasi</h3>
              {[
                { label: 'Skill terverifikasi', status: `${verifiedCount}/${rows.length} skill`, ok: rows.length > 0 && verifiedCount === rows.length },
                { label: 'Skor rata-rata', status: rows.length > 0 && avgScore >= 75 ? 'Baik' : 'Perlu data', ok: rows.length > 0 && avgScore >= 75 },
                { label: 'Lamaran aktif', status: appCount > 0 ? `${appCount} lamaran` : 'Belum ada', ok: appCount > 0 },
              ].map((v, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--color-heading)' }}>{v.label}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: v.ok ? '#22c55e' : '#f59e0b' }}>
                    {v.ok ? '✓ ' : '◌ '}{v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal tambah / ubah skill ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => { if (!saving) setModal(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={modal.mode === 'create' ? 'Tambah skill baru' : 'Ubah skill'}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'var(--color-card-bg)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--color-heading)' }}>
              {modal.mode === 'create' ? 'Tambah Skill Baru' : 'Ubah Skill'}
            </h2>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-4)' }}>
              Skill manual perlu diverifikasi supaya dihitung aktif di Skill Passport.
            </p>

            <label htmlFor="skill-name" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-heading)' }}>
              Nama skill
            </label>
            <input
              id="skill-name"
              type="text"
              value={formName}
              maxLength={60}
              onChange={e => setFormName(e.target.value)}
              placeholder="Contoh: Public Speaking"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
            />

            <label htmlFor="skill-score" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-heading)' }}>
              Skor (0–100)
            </label>
            <div className="flex items-center gap-3 mb-1">
              <input
                id="skill-score"
                type="range"
                min={0}
                max={100}
                value={formScore}
                onChange={e => setFormScore(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={formScore}
                onChange={e => setFormScore(Number(e.target.value))}
                aria-label="Skor skill"
                className="w-20 px-2.5 py-2 rounded-xl border text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-heading)', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {formError && (
              <p className="text-xs font-bold mt-3" role="alert" style={{ color: '#ef4444' }}>{formError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-heading)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveSkill}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ background: 'linear-gradient(135deg, #395886, #628ECB)' }}
              >
                {saving ? 'Menyimpan…' : modal.mode === 'create' ? 'Simpan Skill' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KandidatKebutuhanPribadi({ onNavigate: _nav }: { onNavigate: (p: Page) => void }) {
  type NeedStatus = 'dibutuhkan' | 'diproses' | 'terpenuhi';
  interface Need {
    id: number; title: string; desc: string; category: string; priority: 'Tinggi' | 'Sedang' | 'Rendah'; status: NeedStatus;
  }
  const [needs, setNeeds] = React.useState<Need[]>([]);
  const [needsLoading, setNeedsLoading] = React.useState(true);
  const [needsError, setNeedsError] = React.useState<string | null>(null);
  const [needsReload, setNeedsReload] = React.useState(0);

  /* ── Tambah / Edit kebutuhan ─────────────────────────────────────────── */
  const CATEGORIES = ['Teknologi', 'Fisik', 'Jadwal', 'Komunikasi', 'Lingkungan', 'Lainnya'];
  const PRIORITIES: Need['priority'][] = ['Tinggi', 'Sedang', 'Rendah'];

  const [modal, setModal] = React.useState<{ mode: 'add' } | { mode: 'edit'; id: number } | null>(null);
  const [form, setForm] = React.useState<{
    title: string; desc: string; category: string; priority: Need['priority'];
  }>({ title: '', desc: '', category: 'Teknologi', priority: 'Sedang' });

  const openAdd = () => {
    setForm({ title: '', desc: '', category: CATEGORIES[0], priority: 'Sedang' });
    setModal({ mode: 'add' });
  };
  const openEdit = (n: Need) => {
    setForm({ title: n.title, desc: n.desc, category: n.category, priority: n.priority });
    setModal({ mode: 'edit', id: n.id });
  };
  const saveNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    try {
      if (modal && modal.mode === 'edit') {
        const updated = await updateNeed(modal.id, { ...form, title });
        setNeeds(prev => prev.map(n => (n.id === modal.id ? { ...n, ...updated } : n)));
      } else {
        const created = await createNeed({ ...form, title });
        setNeeds(prev => [{ ...created }, ...prev]);
      }
      setModal(null);
    } catch (err) {
      alert((err as Error).message || 'Gagal menyimpan kebutuhan.');
    }
  };
  const removeNeed = (id: number) => {
    setNeeds(prev => prev.filter(n => n.id !== id));
    deleteNeed(id).catch(() => undefined);
  };

  React.useEffect(() => {
    let cancelled = false;
    setNeedsLoading(true);
    setNeedsError(null);
    fetchNeeds()
      .then(serverNeeds => {
        if (cancelled) return;
        setNeeds(Array.isArray(serverNeeds) ? (serverNeeds as Need[]) : []);
        setNeedsError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNeeds([]);
        setNeedsError((err as Error)?.message || 'Gagal memuat kebutuhan dari server.');
      })
      .finally(() => {
        if (!cancelled) setNeedsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needsReload]);

  React.useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const columns: { key: NeedStatus; label: string; color: string; bg: string }[] = [
    { key: 'dibutuhkan', label: 'Dibutuhkan',  color: '#ef4444', bg: '#fee2e2' },
    { key: 'diproses',   label: 'Diproses',    color: '#f59e0b', bg: '#fef9c3' },
    { key: 'terpenuhi',  label: 'Terpenuhi',   color: '#22c55e', bg: '#dcfce7' },
  ];
  const priorityStyle = (p: string) =>
    p === 'Tinggi' ? { bg: '#fee2e2', color: '#ef4444' } :
    p === 'Sedang' ? { bg: '#fef9c3', color: '#b45309' } :
                     { bg: '#f0fdf4', color: '#15803d' };

  const moveNext = (id: number) => {
    const current = needs.find(n => n.id === id);
    if (!current) return;
    const next: NeedStatus = current.status === 'dibutuhkan' ? 'diproses' : current.status === 'diproses' ? 'terpenuhi' : 'terpenuhi';
    setNeeds(prev => prev.map(n => (n.id === id ? { ...n, status: next } : n)));
    updateNeed(id, { status: next }).catch(() => undefined);
  };

  const statCards = [
    { label: 'Total Kebutuhan', value: needs.length.toString(),                                      accent: '#395886' },
    { label: 'Dibutuhkan',      value: needs.filter(n => n.status === 'dibutuhkan').length.toString(), accent: '#ef4444' },
    { label: 'Diproses',        value: needs.filter(n => n.status === 'diproses').length.toString(),   accent: '#f59e0b' },
    { label: 'Terpenuhi',       value: needs.filter(n => n.status === 'terpenuhi').length.toString(),  accent: '#22c55e' },
  ];

  return (
    <div className="min-h-full" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ── */}
      <div
        className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 border-b flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#628ECB' }}>SetaraKerja · Aksesibilitas</p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-heading)' }}>Kebutuhan Pribadi</h1>
          <p className="text-xs sm:text-sm font-bold mt-0.5" style={{ color: 'var(--color-text-4)' }}>Kelola kebutuhan aksesibilitas & akomodasi Anda</p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          style={{ background: 'linear-gradient(135deg, #395886, #628ECB)' }}
        >
          + Tambah Kebutuhan
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7">
        {/* ── Stat tiles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map((c, i) => (
            <div key={i} className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-4)' }}>{c.label}</div>
              <div className="text-3xl font-bold leading-none mb-1" style={{ color: c.accent, fontFamily: 'var(--font-mono)' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── Kanban board ── */}
        {needsError && (
          <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b91c1c' }}>
            <span>{needsError}</span>
            <button
              type="button"
              onClick={() => setNeedsReload(k => k + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Coba lagi
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map(col => {
            const colNeeds = needs.filter(n => n.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} aria-hidden="true" />
                    <span className="text-sm font-bold" style={{ color: 'var(--color-heading)' }}>{col.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: col.bg, color: col.color }}>
                    {colNeeds.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-3">
                  {colNeeds.length === 0 && (
                    <p className="rounded-2xl border border-dashed p-4 text-xs text-center" style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-4)' }}>
                      {needsLoading ? 'Memuat kebutuhan…' : 'Belum ada kebutuhan.'}
                    </p>
                  )}
                  {colNeeds.map(need => {
                    const ps = priorityStyle(need.priority);
                    return (
                      <div
                        key={need.id}
                        className="rounded-2xl border p-4 transition-all hover:shadow-md"
                        style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--color-surface)', color: '#628ECB' }}>
                            {need.category}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: ps.bg, color: ps.color }}>
                              {need.priority}
                            </span>
                            <button
                              onClick={() => openEdit(need)}
                              aria-label={`Ubah kebutuhan: ${need.title}`}
                              title="Ubah kebutuhan"
                              className="p-1.5 rounded-md transition-colors hover:bg-[#E6EEF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                              style={{ color: '#395886' }}
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => removeNeed(need.id)}
                              aria-label={`Hapus kebutuhan: ${need.title}`}
                              title="Hapus kebutuhan"
                              className="p-1.5 rounded-md transition-colors hover:bg-[#FEE2E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                              style={{ color: '#64748B' }}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold mb-1.5" style={{ color: 'var(--color-heading)' }}>{need.title}</h4>
                        <p className="text-xs font-bold leading-relaxed mb-3" style={{ color: 'var(--color-text-4)' }}>{need.desc}</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => openEdit(need)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            style={{ background: 'var(--color-surface)', color: '#395886' }}
                          >
                            Ubah
                          </button>
                          {need.status !== 'terpenuhi' && (
                            <button
                              onClick={() => moveNext(need.id)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                              style={{ background: need.status === 'dibutuhkan' ? '#f59e0b' : '#22c55e' }}
                            >
                              {need.status === 'dibutuhkan' ? 'Ajukan →' : 'Terpenuhi →'}
                            </button>
                          )}
                        </div>
                        {need.status === 'terpenuhi' && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-green-500 text-sm" aria-hidden="true">✓</span>
                            <span className="text-xs font-bold" style={{ color: '#22c55e' }}>Kebutuhan telah terpenuhi</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal Tambah / Edit Kebutuhan ── */}
      {modal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="need-modal-title">
          <button
            type="button"
            aria-label="Tutup dialog"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setModal(null)}
          />
          <form
            onSubmit={saveNeed}
            className="relative w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--color-card-bg)', borderColor: 'var(--color-border-subtle)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#628ECB' }}>
                  {modal.mode === 'add' ? 'Baru' : 'Ubah data'}
                </p>
                <h2 id="need-modal-title" className="text-lg font-bold" style={{ color: 'var(--color-heading)' }}>
                  {modal.mode === 'add' ? 'Tambah Kebutuhan' : 'Edit Kebutuhan'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                aria-label="Tutup"
                className="p-2 rounded-lg transition-colors hover:bg-[#FEE2E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                style={{ color: 'var(--color-text-4)' }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-4)' }}>
                  Nama kebutuhan <span style={{ color: '#ef4444' }}>*</span>
                </span>
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Contoh: Jeda istirahat tambahan"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-blue-400/30"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-heading)' }}
                />
              </label>

              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-4)' }}>
                  Deskripsi
                </span>
                <textarea
                  rows={3}
                  value={form.desc}
                  onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  placeholder="Jelaskan kebutuhan Anda dan dampaknya saat bekerja…"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold outline-none transition-all resize-y focus:ring-4 focus:ring-blue-400/30"
                  style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-heading)' }}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-4)' }}>Kategori</span>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-blue-400/30"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-heading)' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-4)' }}>Prioritas</span>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Need['priority'] }))}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-blue-400/30"
                    style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-heading)' }}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-4)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ background: 'linear-gradient(135deg, #395886, #628ECB)' }}
              >
                {modal.mode === 'add' ? 'Simpan Kebutuhan' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function KandidatApplications(props: { onNavigate: (p: Page) => void }) {
  return <KandidatApplicationsPage {...props} />;
}
/** Enam status rekrutmen yang bisa diatur HRD untuk tiap peserta. */
const HRD_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'applied', label: 'Terkirim' },
  { value: 'screening', label: 'Seleksi' },
  { value: 'interview_requested', label: 'Menunggu Interview' },
  { value: 'interview_scheduled', label: 'Interview Terjadwal' },
  { value: 'hired', label: 'Diterima' },
  { value: 'rejected', label: 'Tidak Dilanjutkan' },
];

function HRDCandidates({ onNavigate: _nav }: { onNavigate: (p: Page) => void }) {
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<{
    skills: CandidateSkill[];
    skillScores: CandidateSkill[];
    portfolios: CandidatePortfolio[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const detailReqId = React.useRef<string | null>(null);

  const loadDetail = (id: string) => {
    detailReqId.current = id;
    setOpenId(id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    fetchApplicationDetail(id)
      .then(res => {
        if (detailReqId.current !== id) return;
        setDetail(res);
      })
      .catch((err: unknown) => {
        if (detailReqId.current !== id) return;
        setDetailError(err instanceof ApiError ? err.message : 'Gagal memuat skill & portofolio pelamar.');
      })
      .finally(() => {
        if (detailReqId.current === id) setDetailLoading(false);
      });
  };

  const toggleDetail = (id: string) => {
    if (openId === id) {
      detailReqId.current = null;
      setOpenId(null);
      setDetail(null);
      setDetailError(null);
      return;
    }
    loadDetail(id);
  };

  const changeStatus = async (id: string, status: string) => {
    const previous = candidates;
    setSavingKey(id);
    setActionError(null);
    setCandidates(list => list.map(c => (String(c.id) === id ? { ...c, status } : c)));
    try {
      const updated = await updateApplicationStatus(id, status);
      setCandidates(list =>
        list.map(c => (String(c.id) === id ? { ...c, status: updated?.status ?? status } : c))
      );
    } catch (err: unknown) {
      setCandidates(previous);
      setActionError(err instanceof ApiError ? err.message : 'Gagal memperbarui status kandidat.');
    } finally {
      setSavingKey(null);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCandidates()
      .then(list => {
        if (cancelled) return;
        setCandidates(Array.isArray(list) ? list : []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCandidates([]);
        setError(err instanceof ApiError ? err.message : 'Gagal memuat kandidat dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    applied: { label: 'Terkirim', bg: '#DBEAFE', color: '#1D4ED8' },
    screening: { label: 'Seleksi', bg: '#FEF3C7', color: '#B45309' },
    interview_requested: { label: 'Menunggu Interview', bg: '#E6EEF9', color: '#395886' },
    interview_scheduled: { label: 'Interview Terjadwal', bg: '#E6EEF9', color: '#395886' },
    hired: { label: 'Diterima', bg: '#DCFCE7', color: '#15803D' },
    rejected: { label: 'Tidak Dilanjutkan', bg: '#FEE2E2', color: '#B91C1C' },
  };

  return (
    <main id="main-content" className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#395886] mb-2" >Kelola Kandidat</h1>
        <p className="text-sm text-slate-500 mb-6">Semua kandidat ditampilkan secara anonim. Identitas hanya tersedia setelah Anda commit interview.</p>

        {actionError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {actionError}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#395886]">{candidates.length} kandidat</span>
            <span className="text-xs text-slate-400">Dari server SetaraKerja</span>
          </div>

          {loading && <div className="px-5 py-8 text-sm text-slate-500" role="status">Memuat kandidat…</div>}
          {!loading && error && (
            <div className="px-5 py-8 text-center" role="alert">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey(k => k + 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Coba lagi
              </button>
            </div>
          )}
          {!loading && !error && candidates.length === 0 && (
            <div className="px-5 py-8 text-sm text-slate-400">Belum ada kandidat yang melamar.</div>
          )}
          {!loading && !error && candidates.map((c: any) => {
            const badge = STATUS_BADGE[c.status] ?? { label: c.status, bg: '#F1F5F9', color: '#475569' };
            const mergedSkills: CandidateSkill[] = detail
              ? [
                  ...detail.skills,
                  ...detail.skillScores
                    .filter(
                      score =>
                        !detail.skills.some(
                          skill => skill.skill.toLowerCase() === String(score.skill).toLowerCase()
                        )
                    )
                    .map((score, index) => ({ ...score, id: `lamaran-${index}` })),
                ]
              : [];
            return (
              <div key={String(c.id)} className="border-b border-slate-100 last:border-0">
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#395886] truncate">
                    {c.isRevealed ? (c.revealedData?.name ?? c.code) : c.code}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {c.jobTitle ?? 'Lowongan'} · {c.company ?? '-'}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleDetail(String(c.id))}
                  aria-expanded={openId === String(c.id)}
                  className="cursor-pointer rounded-lg border border-[#D5DEEF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#395886] hover:bg-[#EEF3FC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  {openId === String(c.id) ? 'Tutup' : 'Skill & Portofolio'}
                </button>
                <label className="flex-shrink-0">
                  <span className="sr-only">Status kandidat</span>
                  <select
                    value={c.status}
                    onChange={(event) => changeStatus(String(c.id), event.target.value)}
                    disabled={savingKey === String(c.id)}
                    aria-label={`Ubah status ${c.code}`}
                    className="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none transition-opacity disabled:cursor-wait disabled:opacity-60"
                    style={{ background: badge.bg, color: badge.color, borderColor: badge.bg }}
                  >
                    {HRD_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                </div>
                </div>
                {openId === String(c.id) && (
                  <div className="px-5 pb-4 -mt-1">
                    {detailLoading && (
                      <p className="text-xs text-slate-500" role="status">Memuat skill & portofolio pelamar…</p>
                    )}
                    {!detailLoading && detailError && (
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-red-500">{detailError}</p>
                        <button
                          type="button"
                          onClick={() => loadDetail(String(c.id))}
                          className="text-xs font-bold text-[#2563EB] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                        >
                          Coba lagi
                        </button>
                      </div>
                    )}
                    {!detailLoading && !detailError && detail && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Skill Passport</h3>
                          {mergedSkills.length === 0 ? (
                            <p className="text-xs text-slate-400">Pelamar belum menambahkan skill.</p>
                          ) : (
                            <ul className="flex flex-wrap gap-2">
                              {mergedSkills.map(skill => (
                                <li
                                  key={skill.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#395886]"
                                >
                                  {skill.skill}
                                  <span className="text-slate-400 font-normal">{skill.score}</span>
                                  {skill.verifiedAt && (
                                    <span className="text-[#15803D] font-normal">terverifikasi</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Portofolio</h3>
                          {detail.portfolios.length === 0 ? (
                            <p className="text-xs text-slate-400">Pelamar belum mengunggah berkas portofolio.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {detail.portfolios.map(file => {
                                const href = file.url
                                  ? (file.url.startsWith('http') ? file.url : FILES_ORIGIN + file.url)
                                  : undefined;
                                return (
                                  <li
                                    key={file.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="text-xs font-semibold text-slate-700 truncate">{file.name}</div>
                                      <div className="text-[11px] text-slate-400">{fmtSize(file.size)}</div>
                                    </div>
                                    {href && (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-[#2563EB] hover:underline flex-shrink-0"
                                      >
                                        Buka
                                      </a>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function HRDCompliance({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCandidates()
      .then(list => {
        if (cancelled) return;
        setCandidates(Array.isArray(list) ? list : []);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCandidates([]);
        setError(err instanceof ApiError ? err.message : 'Gagal memuat data kandidat dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const COMPANY = getSessionUser()?.companyName || 'Perusahaan Anda';
  const employees = 250;
  const required = 5;
  const hired = candidates.filter((c: any) => c.status === 'hired').length;
  const pct = Math.min(100, Math.round((hired / required) * 100));
  const remaining = Math.max(0, required - hired);

  if (loading) {
    return (
      <main id="main-content" className="bg-slate-50 min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto text-sm text-slate-500" role="status">Memuat laporan kepatuhan…</div>
      </main>
    );
  }

  return (
    <main id="main-content" className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#395886] mb-2" >Laporan Kepatuhan UU 8/2016</h1>
        <p className="text-sm text-slate-500 mb-6">
          {COMPANY} · Periode: {new Date().getFullYear()}
          {error ? ` · ${error}` : ''}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Karyawan', val: String(employees), color: 'text-blue-600' },
            { label: 'Kuota Wajib (2%)', val: `${required} orang`, color: 'text-blue-600' },
            { label: 'Terpenuhi', val: `${hired} (${pct}%)`, color: hired >= required ? 'text-green-600' : 'text-red-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
              <div className={`text-2xl font-bold mb-1 ${item.color}`} style={{ fontFamily: 'var(--font-mono)' }}>{item.val}</div>
              <div className="text-xs text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-[#395886] mb-4">Progress Menuju Kepatuhan</h2>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% kuota tercapai`}>
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-slate-500 mb-5">
            {error
              ? error
              : remaining > 0
                ? `${pct}% tercapai — perlu ${remaining} kandidat difabel lagi untuk memenuhi kuota`
                : `Kuota ${required} posisi sudah terpenuhi.`}
          </p>
          {error && (
            <button
              type="button"
              onClick={() => setReloadKey(k => k + 1)}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Coba lagi
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

/** Halaman yang boleh diakses tanpa login. */
const PUBLIC_PAGES: Page[] = ['landing', 'login', 'register'];

function AppInner() {
  const [page, setPage] = useState<Page>('landing');
  const [userRole, setUserRole] = useState<'kandidat' | 'hrd' | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const { theme, isDark, toggleTheme } = useThemeContext();
  const { enabled: blindMode, toggle: toggleBlindMode } = useBlindMode();

  // Atur lang dan title per halaman
  useEffect(() => {
    document.documentElement.setAttribute('lang', 'id');
    const titles: Record<Page, string> = {
      landing: 'SetaraKerja — Kerja Berdasarkan Skill, Bukan Fisik',
      login: 'Masuk — SetaraKerja',
      register: 'Daftar — SetaraKerja',
      kandidat: 'Dashboard Kandidat — SetaraKerja',
      'kandidat-portfolio': 'Portofolio — SetaraKerja',
      'kandidat-passport': 'Skill Passport — SetaraKerja',
      'kandidat-applications': 'Semua Lamaran — SetaraKerja',
      hrd: 'Dashboard HRD — SetaraKerja',
      'hrd-candidates': 'Kelola Kandidat — SetaraKerja',
      'hrd-compliance': 'Laporan Kepatuhan — SetaraKerja',
      'hrd-post-job': 'Pasang Lowongan — SetaraKerja',
      'kebutuhan-pribadi': 'Kebutuhan Pribadi — SetaraKerja',
      interview: 'Sesi Interview — SetaraKerja',
      settings: 'Pengaturan — SetaraKerja',
      'job-matching': 'Cari Kerja — SetaraKerja',
      help: 'Pusat Bantuan — SetaraKerja',
      feedback: 'Masukan — SetaraKerja',
    };
    document.title = titles[page] ?? 'SetaraKerja';

    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      'Platform blind hiring untuk penyandang disabilitas Indonesia. Kerja berdasarkan skill, bukan fisik. Aksesibel WCAG 2.2 AA.';
  }, [page]);

  const navigate = (target: Page) => {
    setPage(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pulihkan sesi login dari backend (token disimpan di localStorage).
  useEffect(() => {
    const token = getToken();
    const user = getSessionUser();
    if (token && user) {
      const role = user.role === 'hrd' ? 'hrd' : 'kandidat';
      setUserRole(role);
      setPage(role === 'hrd' ? 'hrd' : 'kandidat');
    }
    setSessionReady(true);
  }, []);

  // Penjaga rute: halaman terproteksi wajib login, halaman auth hanya untuk tamu.
  useEffect(() => {
    if (!sessionReady) return;
    if (!userRole && !PUBLIC_PAGES.includes(page)) {
      setPage('login');
      window.scrollTo({ top: 0 });
    } else if (userRole && (page === 'login' || page === 'register')) {
      setPage(userRole === 'hrd' ? 'hrd' : 'kandidat');
    }
  }, [sessionReady, userRole, page]);

  const handleLogin = (role: 'kandidat' | 'hrd') => {
    setUserRole(role);
    navigate(role === 'kandidat' ? 'kandidat' : 'hrd');
  };

  const handleLogout = () => {
    void logoutRequest();
    setUserRole(null);
    navigate('landing');
  };

  // Number-key navigation shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === '1') navigate('landing');
      if (e.key === '2') navigate('login');
      if (e.key === '3') navigate('register');
      if (e.key === '4' && userRole) navigate(userRole === 'hrd' ? 'hrd' : 'kandidat');
      if (e.key === '?') {
        alert(
          'Shortcut Keyboard:\n1 → Beranda\n2 → Masuk\n3 → Daftar\n4 → Dashboard (perlu login)\nAlt+A → Panel Aksesibilitas\n? → Bantuan ini'
        );
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const dashboardPage = page.startsWith('kandidat') || page.startsWith('hrd') || page === 'job-matching' || page === 'settings' || page === 'help' || page === 'feedback' || page === 'kebutuhan-pribadi';
  const showHeader = !dashboardPage && page !== 'interview';
  const showFooter = ['landing', 'login', 'register'].includes(page);

  if (!sessionReady) {
    return (
      <div className="min-h-screen grid place-items-center" style={{ background: 'var(--color-bg)', color: 'var(--color-text-1)' }} role="status" aria-live="polite">
        <p className="text-sm font-semibold">Memuat sesi SetaraKerja…</p>
      </div>
    );
  }

  return (
    <UserProvider initialRole={userRole}>
    <AccessibilityProvider onNavigate={navigate}>
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="skip-link"
        tabIndex={0}
      >
        Langsung ke konten utama
      </a>

      <div className="min-h-screen flex flex-col page-transition" key={page}>

        {/* Blind mode status bar */}
        {blindMode && (
          <div
            role="status"
            aria-label="Mode Tunanetra aktif"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2.5 px-5 py-2.5 rounded-full text-white text-xs font-semibold shadow-xl"
            style={{ background: 'linear-gradient(90deg,#395886,#628ECB)' }}
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
            Mode Tunanetra Aktif — Audio panduan kursor menyala
          </div>
        )}

        {showHeader && (
          <Header
            currentPage={page}
            onNavigate={navigate}
            userRole={userRole}
            onLogout={handleLogout}
          />
        )}

        {/* Route map */}
        {page === 'landing'               && <LandingPage onNavigate={navigate} />}
        {page === 'login'                 && <LoginPage onNavigate={navigate} onLogin={handleLogin} />}
        {page === 'register'              && <RegisterPage onNavigate={navigate} onLogin={handleLogin} />}
        {dashboardPage && (
          <KandidatLayout currentPage={page} onNavigate={navigate} onLogout={handleLogout} role={userRole === 'hrd' ? 'hrd' : 'kandidat'}>
            {page === 'kandidat'              && <KandidatDashboard onNavigate={navigate} />}
            {page === 'kandidat-portfolio'    && <KandidatPortfolio onNavigate={navigate} />}
            {page === 'kandidat-passport'     && <KandidatPassport onNavigate={navigate} />}
            {page === 'kandidat-applications' && <KandidatApplications onNavigate={navigate} />}
            {page === 'kebutuhan-pribadi'      && <KandidatKebutuhanPribadi onNavigate={navigate} />}
            {page === 'job-matching'          && <JobMatchingPage onNavigate={navigate} />}
            {page === 'hrd'                    && <HRDDashboard onNavigate={navigate} onLogout={handleLogout} />}
            {page === 'hrd-candidates'         && <HRDCandidates onNavigate={navigate} />}
            {page === 'hrd-compliance'         && <HRDCompliance onNavigate={navigate} />}
            {page === 'hrd-post-job'           && <HRDPostJobPage onNavigate={navigate} />}
            {page === 'settings'               && <SettingsPage onNavigate={navigate} userRole={userRole} theme={theme} onToggleTheme={toggleTheme} blindMode={blindMode} onToggleBlindMode={toggleBlindMode} isDark={isDark} />}
            {page === 'help'                   && <HelpPage onNavigate={navigate} userRole={userRole} isDark={isDark} />}
            {page === 'feedback'               && <FeedbackPage role={userRole ?? 'kandidat'} />}
          </KandidatLayout>
        )}
        {page === 'interview'             && <InterviewPage onNavigate={navigate} userRole={userRole ?? 'kandidat'} />}

        {showFooter && <Footer onNavigate={navigate} />}
      </div>

      {/* Accessibility FAB — always visible */}
      <AccessibilityToggle />
    </AccessibilityProvider>
    </UserProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
