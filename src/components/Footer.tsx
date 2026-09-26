import React from 'react';
import type { Page } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
}

export default function Footer({ onNavigate }: Props) {
  return (
    <footer className="bg-[#111827] text-white mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold" >SetaraKerja</span>
            </div>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4 max-w-xs">
              Platform blind hiring pertama di Indonesia yang dibangun khusus untuk penyandang disabilitas.
              Skill dulu. Baru fisik. Baru nama.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#10B981] rounded-full" aria-hidden="true" />
              <span className="text-xs text-[#6B7280]">WCAG 2.2 AA Compliant</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Platform</h3>
            <ul className="space-y-2" role="list">
              {[
                { label: 'Untuk Kandidat', page: 'register' as Page },
                { label: 'Untuk Perusahaan', page: 'register' as Page },
                { label: 'Skill Passport', page: 'kandidat-passport' as Page },
              ].map(item => (
                <li key={item.label}>
                  <button
                    onClick={() => onNavigate(item.page)}
                    className="text-sm text-[#6B7280] hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Aksesibilitas */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Aksesibilitas</h3>
            <ul className="space-y-2 text-sm text-[#6B7280]" role="list">
              <li>Navigasi Keyboard Penuh</li>
              <li>Screen Reader Friendly</li>
              <li>Mode Kontras Tinggi</li>
              <li>Font Disleksia (OpenDyslexic)</li>
              <li>Navigasi Suara</li>
            </ul>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="border-t border-[#374151] pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'UU No. 8/2016', color: '#2563EB' },
              { label: 'WCAG 2.2 AA', color: '#10B981' },
              { label: 'UU PDP 2022', color: '#8B5CF6' },
              { label: 'ISO 27001', color: '#F59E0B' },
            ].map(badge => (
              <span
                key={badge.label}
                className="text-xs font-medium px-3 py-1 rounded-full border"
                style={{ borderColor: badge.color, color: badge.color }}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#6B7280]">
            © 2026 SetaraKerja · Semarang, Indonesia · Made with <span aria-label="cinta">♥</span> untuk inklusivitas
          </p>
        </div>

        {/* Accessibility statement */}
        <div className="mt-6 p-4 rounded-xl border border-[#374151] bg-[#1F2937]">
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            <strong className="text-white">Pernyataan Aksesibilitas:</strong> SetaraKerja berkomitmen memenuhi
            WCAG 2.2 Level AA. Platform ini mendukung screen reader (NVDA, VoiceOver, JAWS), navigasi keyboard
            penuh, 5 mode aksesibilitas, dan UI multibahasa. Jika Anda menemukan hambatan aksesibilitas,
            hubungi kami: <span className="text-[#2563EB]">aksesibilitas@setarakerja.id</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
