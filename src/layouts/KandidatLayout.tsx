import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Page } from '../types';
import DashboardSidebar from '../components/DashboardSidebar';
import { useUser } from '../contexts/UserContext';
import { storageUrl } from '../lib/api';
import { Bell, Search, Menu, X } from 'lucide-react';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
  role?: 'kandidat' | 'hrd';
}

export default function KandidatLayout({ currentPage, onNavigate, onLogout, children, role = 'kandidat' }: Props) {
  const { profile } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleNavigate = (page: Page) => {
    setSidebarOpen(false);
    onNavigate(page);
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#E6EEF9' }}>

      {/* ── Desktop sidebar (floating glass) ────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 264 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.7 } as const}
        className="hidden lg:flex flex-col fixed left-6 top-6 bottom-6 z-30"
        aria-label="Navigasi sidebar"
      >
        <DashboardSidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          userName={profile.name}
          userAvatar={profile.avatar}
          role={role}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
        />
      </motion.aside>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex overflow-y-auto p-3" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] z-10">
            <DashboardSidebar
              currentPage={currentPage}
              onNavigate={handleNavigate}
              onLogout={onLogout}
              userName={profile.name}
              userAvatar={profile.avatar}
              role={role}
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute -top-2 -right-2 p-2 rounded-full shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ background: '#fff', color: '#395886' }}
              aria-label="Tutup menu navigasi"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </aside>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className={`flex-1 ${collapsed ? 'lg:ml-[100px]' : 'lg:ml-[288px]'} lg:pl-4 min-w-0 flex flex-col transition-[margin] duration-300`}>

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 bg-white flex items-center gap-3 px-4 sm:px-6 h-16 flex-shrink-0 lg:rounded-tl-2xl"
          style={{ borderBottom: '1px solid #D5DEEF' }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Buka menu navigasi"
          >
            <Menu size={20} className="text-slate-600" aria-hidden="true" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#8AAEE0' }}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Cari lowongan, skill..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:border-transparent"
              style={{ background: '#F0F3FA', borderColor: '#D5DEEF', color: '#395886' }}
              onFocus={e => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(98,142,203,0.2)';
                e.currentTarget.style.borderColor = '#628ECB';
                e.currentTarget.style.background = '#fff';
              }}
              onBlur={e => {
                e.currentTarget.style.boxShadow = '';
                e.currentTarget.style.borderColor = '#D5DEEF';
                e.currentTarget.style.background = '#F0F3FA';
              }}
              aria-label="Cari lowongan, skill, atau perusahaan"
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" aria-hidden="true" />

          {/* Notification bell */}
          <button
            className="relative p-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ color: '#628ECB' }}
            aria-label="Notifikasi — 1 notifikasi baru"
            onMouseEnter={e => { e.currentTarget.style.background = '#F0F3FA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <Bell size={20} aria-hidden="true" />
            <span
              className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-white"
              style={{ background: '#628ECB' }}
              aria-hidden="true"
            />
          </button>

          {/* Avatar + name */}
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`Buka pengaturan profil: ${profile.name}`}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0F3FA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            {profile.avatar ? (
              <img
                src={storageUrl(profile.avatar)}
                alt={`Foto profil ${profile.name}`}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2"
                style={{ borderColor: '#8AAEE0' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: '#395886', color: '#fff' }}
                aria-hidden="true"
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className="hidden sm:block text-sm font-semibold max-w-[100px] truncate"
              style={{ color: '#395886' }}
            >
              {profile.name}
            </span>
          </button>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 page-transition lg:rounded-tl-2xl" key={currentPage}>
          {children}
        </main>
      </div>
    </div>
  );
}
