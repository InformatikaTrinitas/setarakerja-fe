import React, { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Contrast,
  Type,
  Volume2,
  VolumeX,
  Wind,
  ZoomIn,
  RotateCcw,
  X,
  Mic,
  MicOff,
} from 'lucide-react';
import { useA11y } from '../contexts/AccessibilityContext';

export default function AccessibilityToggle() {
  const { state, toggleHighContrast, toggleDyslexiaFont, toggleQuietMode, toggleVoiceNav, setFontSize } = useA11y();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus trap inside panel
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [open]);

  // Global keyboard shortcut: Alt+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setOpen(p => !p);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const activeCount = [
    state.highContrast,
    state.dyslexiaFont,
    state.quietMode,
    state.voiceNav,
    state.fontSize !== 100,
  ].filter(Boolean).length;

  const resetAll = () => {
    if (state.highContrast) toggleHighContrast();
    if (state.dyslexiaFont) toggleDyslexiaFont();
    if (state.quietMode) toggleQuietMode();
    if (state.voiceNav) toggleVoiceNav();
    setFontSize(100);
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          role="dialog"
          aria-label="Panel aksesibilitas"
          aria-modal="true"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-84 p-5 animate-fade-up"
          style={{ width: '22rem', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Accessibility size={18} className="text-blue-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-800" >
                Mode Aksesibilitas
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={resetAll}
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Reset semua mode aksesibilitas"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  Reset
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup panel aksesibilitas"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Toggle options */}
          <div className="space-y-2 mb-4" role="group" aria-label="Pilihan mode">
            {[
              {
                icon: Contrast,
                label: 'Kontras Tinggi',
                desc: 'Teks kuning pada latar gelap',
                active: state.highContrast,
                onToggle: toggleHighContrast,
                ref: firstFocusRef,
              },
              {
                icon: Type,
                label: 'Font Disleksia',
                desc: 'OpenDyslexic + spasi ekstra',
                active: state.dyslexiaFont,
                onToggle: toggleDyslexiaFont,
                ref: undefined,
              },
              {
                icon: Wind,
                label: 'Mode Tenang',
                desc: 'Kurangi animasi & notifikasi',
                active: state.quietMode,
                onToggle: toggleQuietMode,
                ref: undefined,
              },
              {
                icon: state.voiceNav ? Volume2 : VolumeX,
                label: 'Navigasi Suara',
                desc: state.voiceListening ? 'Mendengarkan...' : 'Kendali tanpa mouse/keyboard',
                active: state.voiceNav,
                onToggle: toggleVoiceNav,
                ref: undefined,
              },
            ].map(({ icon: Icon, label, desc, active, onToggle, ref: itemRef }) => (
              <button
                key={label}
                ref={itemRef}
                onClick={onToggle}
                aria-pressed={active}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  active
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-50 border border-transparent'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
              >
                <span
                  className={`min-w-[36px] min-h-[36px] w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
                    active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${active ? 'text-blue-700' : 'text-slate-700'}`}>{label}</div>
                  <div className={`text-xs truncate ${active ? 'text-blue-500' : 'text-slate-400'}`}>{desc}</div>
                </div>
                {/* Toggle pill */}
                <div
                  aria-hidden="true"
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${active ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* Font scale */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <ZoomIn size={14} aria-hidden="true" />
                Ukuran Teks
              </div>
              <span className="text-sm font-bold text-blue-600 tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                {state.fontSize}%
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={200}
              step={10}
              value={state.fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
              aria-label={`Ukuran teks ${state.fontSize}%`}
              aria-valuemin={100}
              aria-valuemax={200}
              aria-valuenow={state.fontSize}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>100%</span>
              <span>150%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Voice status */}
          {state.voiceNav && state.voiceListening && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl" aria-live="polite">
              <Mic size={16} className="text-red-600 flex-shrink-0 animate-pulse" aria-hidden="true" />
              <span className="text-xs text-red-700">
                {state.voiceTranscript ? `"${state.voiceTranscript}"` : 'Mendengarkan...'}
              </span>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400 text-center">
            <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">Alt</kbd>
            {' + '}
            <kbd className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">A</kbd>
            {' untuk buka/tutup panel ini'}
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        ref={fabRef}
        onClick={() => setOpen(p => !p)}
        aria-label={`Panel aksesibilitas${activeCount > 0 ? ` — ${activeCount} mode aktif` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative min-w-[56px] min-h-[56px] w-14 h-14 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${
          activeCount > 0
            ? 'bg-blue-600 text-white'
            : 'bg-white border-2 border-blue-600 text-blue-600'
        }`}
        style={{ boxShadow: '0 6px 28px rgba(37,99,235,0.35)' }}
      >
        {state.voiceNav ? (
          state.voiceListening
            ? <Mic size={24} className="animate-pulse" aria-hidden="true" />
            : <MicOff size={24} aria-hidden="true" />
        ) : (
          <Accessibility size={24} aria-hidden="true" />
        )}
        {activeCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
