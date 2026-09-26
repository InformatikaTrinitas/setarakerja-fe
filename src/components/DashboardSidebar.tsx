import React, { useState } from 'react';
import type { Page } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  FolderOpen,
  Award,
  Settings,
  LogOut,
  ShieldCheck,
  Users,
  MessageSquare,
  HelpCircle,
  Heart,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

/** Warna utama tema SetaraKerja (navy) untuk pill navigasi aktif. */
const NAVY = '#395886';
/** Hover netral yang tetap terbaca pada mode terang maupun gelap. */
const HOVER_BG = 'rgba(98,142,203,0.16)';

interface NavItem {
  label: string;
  page: Page;
  icon: React.FC<{ size: number; 'aria-hidden'?: boolean | 'true' }>;
}

const CANDIDATE_NAV: NavItem[] = [
  { label: 'Dashboard', page: 'kandidat', icon: LayoutDashboard },
  { label: 'Cari Kerja', page: 'job-matching', icon: Search },
  { label: 'Lamaran', page: 'kandidat-applications', icon: ClipboardList },
  { label: 'Portofolio', page: 'kandidat-portfolio', icon: FolderOpen },
  { label: 'Skill Passport', page: 'kandidat-passport', icon: Award },
  { label: 'Feedback', page: 'feedback', icon: MessageSquare },
  { label: 'Pengaturan', page: 'settings', icon: Settings },
  { label: 'Bantuan', page: 'help', icon: HelpCircle },
];
const HRD_NAV: NavItem[] = [
  { label: 'Dashboard', page: 'hrd', icon: LayoutDashboard },
  { label: 'Kandidat', page: 'hrd-candidates', icon: Users },
  { label: 'Pasang Lowongan', page: 'hrd-post-job', icon: PlusCircle },
  { label: 'Feedback', page: 'feedback', icon: MessageSquare },
  { label: 'Pengaturan', page: 'settings', icon: Settings },
  { label: 'Bantuan', page: 'help', icon: HelpCircle },
];

/** Halaman utilitas ditempatkan di bagian bawah sidebar (bukan di daftar menu). */
const UTILITY_PAGES: Page[] = ['settings', 'help'];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  userName: string;
  userAvatar?: string;
  role?: 'kandidat' | 'hrd';
  collapsed?: boolean;
  onToggle?: () => void;
}

/** Label bagian yang lenyap saat sidebar diciutkan. */
function Reveal({ show, children, className = '' }: { show: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className={`min-w-0 overflow-hidden whitespace-nowrap ${className}`}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function SectionLabel({ title, count, show }: { title: string; count: number; show: boolean }) {
  if (!show) return null;
  return (
    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
      {title} <span className="font-medium">{count}</span>
    </p>
  );
}

export default function DashboardSidebar({
  currentPage,
  onNavigate,
  onLogout,
  userName,
  userAvatar,
  role = 'kandidat',
  collapsed = false,
  onToggle,
}: Props) {
  const navItems = role === 'hrd' ? HRD_NAV : CANDIDATE_NAV;
  const expanded = !collapsed;
  const { isDark, toggleTheme } = useThemeContext();
  const isActive = (page: Page) =>
    page === 'kandidat' ? currentPage === 'kandidat' : currentPage === page;
  const [clickedPage, setClickedPage] = useState<Page | null>(null);

  const mainItems = navItems.filter(i => !UTILITY_PAGES.includes(i.page));
  const helpItem = navItems.find(i => i.page === 'help');

  const handleNavClick = (page: Page) => {
    setClickedPage(page);
    setTimeout(() => setClickedPage(null), 350);
    onNavigate(page);
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.page);
    const Icon = item.icon;
    return (
      <li key={item.page}>
        <button
          onClick={() => handleNavClick(item.page)}
          aria-current={active ? 'page' : undefined}
          aria-label={collapsed ? item.label : undefined}
          title={collapsed ? item.label : undefined}
          className={`relative flex items-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] ${
            collapsed
              ? 'mx-auto h-10 w-10 flex-shrink-0 justify-center rounded-full'
              : 'w-full gap-3 rounded-full px-3 py-2.5 text-[13px] font-semibold'
          } ${clickedPage === item.page ? 'nav-click-anim' : ''}`}
          style={
            active
              ? { background: NAVY, color: '#fff', boxShadow: '0 10px 20px -14px rgba(57,88,134,0.9)' }
              : { color: 'var(--color-text-1)' }
          }
          onMouseEnter={e => {
            if (!active) e.currentTarget.style.background = HOVER_BG;
          }}
          onMouseLeave={e => {
            if (!active) e.currentTarget.style.background = '';
          }}
        >
          <Icon size={18} aria-hidden="true" />
          <Reveal show={expanded} className="block flex-1 text-left">
            {item.label}
          </Reveal>
          {active && expanded && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/85" aria-hidden="true" />
          )}
        </button>
      </li>
    );
  };

  const settingsActive = isActive('settings');

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl"
      style={{
        background: 'var(--color-card-bg)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 24px 55px -28px rgba(15,23,42,0.42), 0 6px 18px -14px rgba(15,23,42,0.25)',
      }}
    >
      {/* ── Merek + tombol ciutkan ─────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 ${
          expanded ? 'px-4 pb-1 pt-4' : 'flex-col gap-1.5 px-2 pb-1 pt-3'
        }`}
      >
        <span
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full"
          style={{ background: `linear-gradient(135deg, ${NAVY}, #628ECB)` }}
          aria-hidden="true"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <Reveal show={expanded} className="block min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold leading-none" style={{ color: 'var(--color-text-1)' }}>
            SetaraKerja
          </span>
          <span className="mt-1 block text-[10px] font-semibold leading-none" style={{ color: 'var(--color-text-muted)' }}>
            Blind Hiring Protocol
          </span>
        </Reveal>

        {onToggle && (
          <button
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
            title={collapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = HOVER_BG)}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
          </button>
        )}
      </div>

      {/* ── Profil ringkas ─────────────────────────────────────────────── */}
      <div className={`flex items-center pb-3 pt-3 ${expanded ? 'gap-2.5 px-4' : 'justify-center'}`}>
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={`Foto profil ${userName}`}
            className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          />
        ) : (
          <div
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full text-[13px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${NAVY}, #4A6FA8)` }}
            aria-hidden="true"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        <Reveal show={expanded} className="block min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold leading-tight" style={{ color: 'var(--color-text-1)' }}>
            {userName}
          </span>
          <span
            className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: isDark ? '#4ADE80' : '#15803D' }}
          >
            <ShieldCheck size={10} aria-hidden="true" />
            Terverifikasi
          </span>
        </Reveal>
      </div>

      {/* ── Navigasi ───────────────────────────────────────────────────── */}
      <nav
        aria-label={`Menu ${role === 'hrd' ? 'HRD' : 'kandidat'}`}
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 ${collapsed ? 'no-scrollbar' : ''}`}
        style={
          collapsed
            ? undefined
            : { scrollbarWidth: 'thin', scrollbarColor: 'rgba(57,88,134,0.3) transparent' }
        }
      >
        <SectionLabel title="Menu Utama" count={mainItems.length} show={expanded} />
        <ul className="space-y-1" role="list">
          {mainItems.map(renderItem)}
        </ul>
      </nav>

      {/* ── Bagian bawah: bantuan, keluar, pengaturan, mode gelap ──────── */}
      <div className="shrink-0 px-3 pb-4 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <ul className="space-y-1" role="list">
          {helpItem && renderItem(helpItem)}
          <li>
            <button
              onClick={onLogout}
              aria-label={collapsed ? 'Keluar' : undefined}
              title={collapsed ? 'Keluar' : undefined}
              className={`relative flex items-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
                collapsed
                  ? 'mx-auto h-10 w-10 flex-shrink-0 justify-center rounded-full'
                  : 'w-full gap-3 rounded-full px-3 py-2.5 text-[13px] font-semibold'
              }`}
              style={{ color: isDark ? '#F87171' : '#B42318' }}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <LogOut size={18} aria-hidden="true" />
              <Reveal show={expanded} className="block flex-1 text-left">
                Keluar
              </Reveal>
            </button>
          </li>
        </ul>

        <div className={`mt-3 flex gap-2 ${expanded ? '' : 'flex-col items-center'}`}>
          <button
            onClick={() => handleNavClick('settings')}
            aria-label="Pengaturan"
            title="Pengaturan"
            aria-current={settingsActive ? 'page' : undefined}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB] hover:-translate-y-0.5"
            style={
              settingsActive
                ? { background: NAVY, color: '#fff', boxShadow: '0 10px 20px -14px rgba(57,88,134,0.9)' }
                : { background: NAVY, color: '#fff', boxShadow: '0 10px 20px -14px rgba(57,88,134,0.7)' }
            }
          >
            <Settings size={16} aria-hidden="true" />
          </button>

          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#628ECB]"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-1)',
            }}
          >
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}
