import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  BookOpen,
  ShieldCheck,
  UserRound,
  ArrowRight,
  Shield,
  Heart,
  Mic,
  BarChart3,
  Lock,
  CheckCircle2,
  Briefcase,
  Users,
  TrendingUp,
  AlertCircle,
  Layers,
  Cpu,
  Globe,
  Star,
  ChevronRight,
} from 'lucide-react';
import type { Page } from '../types';
import workspaceIllustration from '../assets/update-reference-1.png';

interface Props { onNavigate: (page: Page) => void; }

const STATS = [
  { display: '22,97 Jt', label: 'penyandang disabilitas di Indonesia', sub: 'BPS 2023', icon: Users, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { display: '7,6%', label: 'yang bekerja di sektor formal', sub: 'BPS 2023', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  { display: '0,4%', label: 'kuota UU 8/2016 yang terpenuhi', sub: 'Kemnaker 2024', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { display: '26%', label: 'lebih rendah peluang dipanggil jika ada status disabilitas di CV', sub: 'Cornell University Study', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

const FEATURES = [
  { icon: Lock, title: 'Blind Hiring Protocol', tag: 'NextGen Secure', tagBg: 'bg-blue-100 text-blue-800', desc: 'AES-256-GCM client-side encryption menyembunyikan identitas kandidat. HRD hanya melihat Skill Passport anonim sampai kandidat menyetujui reveal.', iconBg: 'bg-blue-50', iconColor: 'text-blue-700', border: 'border-blue-200 hover:border-blue-400' },
  { icon: Heart, title: 'Kebutuhan Akomodasi', tag: 'Karier', tagBg: 'bg-violet-100 text-violet-700', desc: 'Ajukan kebutuhan pribadi seperti screen reader, kursi roda, atau jam kerja fleksibel. Rekruter memprosesnya langsung dari dashboard.', iconBg: 'bg-violet-50', iconColor: 'text-violet-700', border: 'border-violet-200 hover:border-violet-400' },
  { icon: Mic, title: 'Voice Navigation', tag: 'Aksesibilitas', tagBg: 'bg-blue-100 text-blue-800', desc: 'Navigasi 100% tanpa mouse via Web Speech API Bahasa Indonesia. Perintah: "buka kandidat", "dashboard hrd", "bantuan".', iconBg: 'bg-blue-50', iconColor: 'text-blue-700', border: 'border-blue-200 hover:border-blue-400' },
  { icon: BarChart3, title: 'Compliance Dashboard', tag: 'UU 8/2016', tagBg: 'bg-blue-100 text-blue-700', desc: 'Pantau kepatuhan kuota 2% BUMN / 1% swasta secara real-time. Export laporan audit untuk Kemnaker.', iconBg: 'bg-blue-50', iconColor: 'text-blue-700', border: 'border-blue-200 hover:border-blue-400' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Upload Portofolio Anonim', desc: 'Tidak perlu nama, foto, atau status disabilitas. Upload karya nyata — desain, kode, video skill.' },
  { step: '02', title: 'Skill Passport', desc: 'Pengguna Memasukan Skill Mereka' },
  { step: '03', title: 'HRD Review Skill Anonim', desc: 'Perusahaan melihat kode anonim seperti "K-7437" dengan skor kompetensi, bukan nama atau foto. Keputusan murni berbasis kemampuan.' },
  { step: '04', title: 'Reveal Setelah Commit', desc: 'Identitas baru dibuka setelah HRD commit interview DAN kandidat approve. Lalu akomodasi yang dibutuhkan tersedia.' },
];

const SECURITY_PILLARS = [
  { icon: Shield, label: 'AES-256-GCM', desc: 'Client-side encryption' },
  { icon: Layers, label: 'Zero-Knowledge', desc: 'Hash saja, bukan data mentah' },
  { icon: Globe, label: 'TLS 1.3 + RLS', desc: 'Supabase Row Level Security' },
];

export default function LandingPage({ onNavigate }: Props) {
  const [heroMounted, setHeroMounted] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTimeout(() => setHeroMounted(true), 50); }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <main id="main-content" className="bg-white overflow-x-hidden">

      {/* ── HERO — split layout ────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center px-4 sm:px-6"
        aria-labelledby="hero-heading"
      >
        {/* right-side tinted panel */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-blue-50 rounded-bl-[96px] pointer-events-none" aria-hidden="true" />
        {/* faint grid on right panel */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-40"
          aria-hidden="true"
          style={{
            backgroundImage: `linear-gradient(to right,#8AAEE0 1px,transparent 1px),linear-gradient(to bottom,#8AAEE0 1px,transparent 1px)`,
            backgroundSize: '40px 40px',
            borderBottomLeftRadius: '96px',
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-24">

          {/* Left: text */}
          <div
            className={`transition-all duration-700 ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
              SWITCHFEST 2026 — NextGen Secure Web Ecosystems
            </div>

            <h1
              id="hero-heading"
              className="text-2xl sm:text-3xl font-bold leading-[1.3] leading-[1.2] mb-6 text-[#395886]"
            >
              Skill dulu.{' '}
              <span>Baru fisik.</span>
              <br />
              <span className="italic text-slate-400 text-2xl sm:text-3xl">Baru nama.</span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => onNavigate('register')}
                className="group inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 min-h-[52px] shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ background: 'linear-gradient(135deg,#395886,#628ECB)', boxShadow: '0 8px 32px rgba(22,101,52,0.35)' }}
              >
                Cari Kerja Anonim
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center justify-center gap-2 border-2 font-semibold px-8 py-4 rounded-xl transition-all min-h-[52px] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ borderColor: '#395886', color: '#395886' }}
              >
                Dashboard HRD
                <BarChart3 size={18} aria-hidden="true" />
              </button>
            </div>


          </div>

          {/* Right: visual */}
          <div
            className={`relative flex items-center justify-center transition-all duration-700 delay-200 ${heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="relative w-full max-w-[31rem] overflow-hidden rounded-[2rem] border border-[#D5DEEF] bg-white p-3 shadow-[0_28px_70px_-32px_rgba(57,88,134,.45)]">
              <img src={workspaceIllustration} alt="Ilustrasi profesional mengelola karya digital" className="aspect-square w-full rounded-[1.4rem] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────── */}
      <section
        id="impact"
        ref={statsRef}
        className="border-y py-16 px-4 sm:px-6"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        aria-labelledby="impact-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#628ECB' }}>Mengapa Platform Ini Lahir</span>
            <h2 id="impact-heading" className="text-2xl sm:text-3xl font-bold leading-[1.3] mt-2" style={{ color: '#395886' }}>
              Angka yang mendorong perubahan
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.display}
                  className={`p-6 rounded-2xl border bg-white shadow-sm transition-all duration-500 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 80}ms`, borderColor: 'var(--color-border)' }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                    <Icon size={20} className={stat.color} aria-hidden="true" />
                  </div>
                  <div className={`text-4xl font-bold mb-1 ${stat.color} tabular-nums`} >
                    {stat.display}
                  </div>
                  <p className="text-sm text-slate-600 leading-snug mb-2">{stat.label}</p>
                  <span className="text-xs text-slate-400 font-medium">{stat.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#628ECB' }}>Fitur Inti</span>
            <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold leading-[1.3] mt-2" style={{ color: '#395886' }}>
              Ekosistem yang benar-benar inklusif
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">
              Bukan sekadar form yang bisa diisi keyboard. Dirancang ulang dari nol untuk berbagai kebutuhan disabilitas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`group p-7 rounded-2xl border bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${f.border}`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${f.iconBg} group-hover:scale-110 transition-transform`}>
                      <Icon size={26} className={f.iconColor} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-[#395886] leading-[1.3]">{f.title}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${f.tagBg}`}>{f.tag}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4 LAPIS EKOSISTEM ──────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 border-y" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} aria-labelledby="ekosistem-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#628ECB' }}>Ekosistem Inklusif</span>
            <h2 id="ekosistem-heading" className="text-2xl sm:text-3xl font-bold leading-[1.3] mt-2" style={{ color: '#395886' }}>
              4 Lapis Dukungan Karier
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">Dari persiapan hingga kemandirian — SetaraKerja hadir di setiap tahap.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', label: 'Sebelum Kerja', icon: <BookOpen size={32} className="text-blue-500" />, style: { background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }, numStyle: { color: '#628ECB' }, desc: 'Latihan navigasi suara dan persiapan interview berbasis aksesibilitas penuh.' },
              { num: '02', label: 'Saat Melamar', icon: <ShieldCheck size={32} className="text-blue-600" />, style: { background: '#EAF0FA', borderColor: '#B1C9EF' }, numStyle: { color: '#395886' }, desc: 'Perusahaan melihat kemampuan dan portofolio terlebih dahulu, tanpa identitas pribadi.' },
              { num: '03', label: 'Setelah Diterima', icon: <Users size={32} className="text-blue-500" />, style: { background: 'var(--color-card-bg)', borderColor: 'var(--color-border)' }, numStyle: { color: '#628ECB' }, desc: 'Susun kebutuhan akomodasi dan komunikasi yang nyaman bersama perusahaan.' },
              { num: '04', label: 'Wirausaha', icon: <TrendingUp size={32} className="text-blue-200" />, style: { background: '#395886', borderColor: '#395886' }, numStyle: { color: '#B1C9EF' }, desc: 'Bangun karya, perluas koneksi, dan temukan peluang pertumbuhan yang relevan.', dark: true },
            ].map(layer => (
              <div
                key={layer.num}
                className="rounded-2xl border p-7 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={layer.style}
              >
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="text-4xl font-bold opacity-25 select-none"
                    style={{ ...layer.numStyle }}
                    aria-hidden="true"
                  >
                    {layer.num}
                  </span>
                  <div aria-label={layer.label}>{layer.icon}</div>
                </div>
                <h3 className={`font-bold text-lg mb-2 ${layer.dark ? 'text-white' : 'text-[#395886]'}`}>{layer.label}</h3>
                <p className={`text-sm leading-relaxed ${layer.dark ? 'text-blue-200' : 'text-slate-600'}`}>{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — dark green section ─────────────────────────── */}
      
      {/* ── HOW IT WORKS — Modern Card UI ─────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ background: 'var(--color-bg)' }} aria-labelledby="how-heading">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#628ECB] mb-2 block">Cara Kerja</span>
            <h2 id="how-heading" className="text-3xl sm:text-4xl font-bold text-[#395886] mt-2 leading-[1.3]">
              Dari apply sampai hired — identitas selalu aman
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 relative">
            {/* Desktop Connector Line */}
            <div 
              className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 z-0" 
              style={{ background: 'linear-gradient(to right, transparent, #B1C9EF 15%, #B1C9EF 85%, transparent)' }}
              aria-hidden="true" 
            />

            {HOW_IT_WORKS.map((step, i) => (
              <div 
                key={step.step} 
                className="relative z-10 bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-slate-100 flex flex-col items-center text-center group"
                style={{ boxShadow: '0 10px 40px -10px rgba(57, 88, 134, 0.08)' }}
              >
                <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: 'var(--color-bg)' }}>
                  {i === 0 && <Upload size={24} className="text-[#628ECB]" />}
                  {i === 1 && <Cpu size={24} className="text-[#628ECB]" />}
                  {i === 2 && <ShieldCheck size={24} className="text-[#628ECB]" />}
                  {i === 3 && <Lock size={24} className="text-[#628ECB]" />}
                </div>
                
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: 'var(--color-surface)', color: '#395886' }}>
                  Langkah {step.step}
                </span>
                
                <h3 className="text-[18px] font-bold text-[#395886] mb-3 leading-[1.3]">{step.title}</h3>
                <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Security Pillars - Pill Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {SECURITY_PILLARS.map(p => {
              const Icon = p.icon;
              return (
                <div
                  key={p.label}
                  className="flex items-center gap-2.5 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
                    <Icon size={14} className="text-[#395886]" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ───────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white" aria-labelledby="cta-heading">
        <div
          className="max-w-5xl mx-auto rounded-3xl p-14 relative overflow-hidden text-center"
          style={{ background: 'linear-gradient(135deg,#395886 0%,#628ECB 60%,#8AAEE0 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" aria-hidden="true" />

          <div className="relative z-10">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider uppercase">Daftar Gratis</span>
            <h2 id="cta-heading" className="text-2xl sm:text-3xl font-bold leading-[1.3] leading-[1.2] text-white mb-5" >
              Siap membuktikan skill Anda?
            </h2>
            <p className="text-blue-100 mb-10 text-lg max-w-xl mx-auto leading-relaxed">
              Tidak perlu lampirkan kondisi fisik. Biarkan karya yang berbicara.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center justify-center gap-2 bg-white font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 min-h-[52px] shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                style={{ color: '#395886' }}
              >
                Daftar Sebagai Kandidat
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold px-8 py-4 rounded-xl hover:border-white hover:bg-white/10 transition-all min-h-[52px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              >
                Daftarkan Perusahaan
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
