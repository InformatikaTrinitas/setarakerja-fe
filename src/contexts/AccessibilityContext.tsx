import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Page } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface A11yState {
  highContrast: boolean;
  dyslexiaFont: boolean;
  quietMode: boolean;
  voiceNav: boolean;
  fontSize: number; // 100–200 (percent)
  voiceListening: boolean;
  voiceTranscript: string;
  lastVoiceCommand: string;
}

export interface A11yContextValue {
  state: A11yState;
  toggleHighContrast: () => void;
  toggleDyslexiaFont: () => void;
  toggleQuietMode: () => void;
  toggleVoiceNav: () => void;
  setFontSize: (size: number) => void;
  announce: (msg: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const A11yContext = createContext<A11yContextValue | null>(null);

export function useA11y(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error('useA11y must be used within AccessibilityProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sk_a11y_v2';

const DEFAULT_STATE: A11yState = {
  highContrast: false,
  dyslexiaFont: false,
  quietMode: false,
  voiceNav: false,
  fontSize: 100,
  voiceListening: false,
  voiceTranscript: '',
  lastVoiceCommand: '',
};

function loadState(): A11yState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<A11yState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      voiceListening: false,
      voiceTranscript: '',
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state: A11yState) {
  try {
    const { voiceListening, voiceTranscript, lastVoiceCommand: _, ...rest } = state;
    void voiceListening; void voiceTranscript;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // localStorage not available
  }
}

// Web Speech API types
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultEvent extends Event {
  results: { [i: number]: { isFinal: boolean; [j: number]: { transcript: string } }; length: number };
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

interface ProviderProps {
  children: React.ReactNode;
  onNavigate?: (page: Page) => void;
}

export function AccessibilityProvider({ children, onNavigate }: ProviderProps) {
  const [state, setState] = useState<A11yState>(loadState);
  const liveRef = useRef<HTMLDivElement>(null);
  const srRef = useRef<SpeechRecognitionInstance | null>(null);
  const activeRef = useRef(false);

  // Sync DOM classes whenever state changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-high-contrast', state.highContrast);
    root.classList.toggle('a11y-dyslexia', state.dyslexiaFont);
    root.classList.toggle('a11y-quiet', state.quietMode);
    root.style.setProperty('--a11y-font-scale', `${state.fontSize / 100}`);
    persist(state);
  }, [state]);

  // Detect system prefers-reduced-motion
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setState(s => ({ ...s, quietMode: true }));
    const h = (e: MediaQueryListEvent) => {
      if (e.matches) setState(s => ({ ...s, quietMode: true }));
    };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Screen-reader announce helper
  const announce = useCallback((msg: string) => {
    if (!liveRef.current) return;
    liveRef.current.textContent = '';
    requestAnimationFrame(() => {
      if (liveRef.current) liveRef.current.textContent = msg;
    });
  }, []);

  // Voice navigation
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      announce('Browser tidak mendukung navigasi suara.');
      return;
    }
    const sr = new SR();
    sr.lang = 'id-ID';
    sr.continuous = true;
    sr.interimResults = true;
    srRef.current = sr;

    sr.onstart = () => {
      setState(s => ({ ...s, voiceListening: true }));
      announce('Navigasi suara aktif. Ucapkan perintah.');
    };

    sr.onresult = (e) => {
      const results = e.results;
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        setState(s => ({ ...s, voiceTranscript: transcript }));

        if (result.isFinal) {
          processVoiceCommand(transcript);
        }
      }
    };

    sr.onerror = () => {
      setState(s => ({ ...s, voiceListening: false }));
      announce('Terjadi kesalahan pada pengenalan suara.');
    };

    sr.onend = () => {
      if (activeRef.current) {
        try { sr.start(); } catch { /* restart failed */ }
      } else {
        setState(s => ({ ...s, voiceListening: false }));
      }
    };

    activeRef.current = true;
    try { sr.start(); } catch { /* already started */ }
  }, [announce]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopVoice = useCallback(() => {
    activeRef.current = false;
    srRef.current?.stop();
    srRef.current = null;
    setState(s => ({ ...s, voiceListening: false, voiceTranscript: '' }));
    announce('Navigasi suara dimatikan.');
  }, [announce]);

  function processVoiceCommand(text: string) {
    const commands: [string[], string, () => void][] = [
      [['beranda', 'halaman utama', 'home'], 'Membuka beranda', () => onNavigate?.('landing')],
      [['masuk', 'login'], 'Membuka halaman masuk', () => onNavigate?.('login')],
      [['daftar', 'registrasi'], 'Membuka pendaftaran', () => onNavigate?.('register')],
      [['dashboard kandidat', 'kandidat'], 'Dashboard kandidat', () => onNavigate?.('kandidat')],
      [['dashboard hrd', 'hrd'], 'Dashboard HRD', () => onNavigate?.('hrd')],
      [['interview'], 'Halaman interview', () => onNavigate?.('interview')],
      [['matikan suara', 'berhenti'], 'Navigasi suara dimatikan', () => setState(s => ({ ...s, voiceNav: false }))],
      [['kontras tinggi'], 'Kontras tinggi diaktifkan', () => setState(s => ({ ...s, highContrast: !s.highContrast }))],
      [['mode tenang'], 'Mode tenang diaktifkan', () => setState(s => ({ ...s, quietMode: !s.quietMode }))],
      [['bantuan', 'help'], 'Perintah: beranda, masuk, daftar, kandidat, hrd, interview, matikan suara', () => {}],
    ];

    for (const [patterns, label, action] of commands) {
      if (patterns.some(p => text.includes(p))) {
        setState(s => ({ ...s, lastVoiceCommand: label }));
        announce(label);
        action();
        return;
      }
    }
    announce(`Perintah tidak dikenal: "${text}". Ucapkan "bantuan" untuk daftar perintah.`);
  }

  const toggleHighContrast = useCallback(() =>
    setState(s => ({ ...s, highContrast: !s.highContrast })), []);
  const toggleDyslexiaFont = useCallback(() =>
    setState(s => ({ ...s, dyslexiaFont: !s.dyslexiaFont })), []);
  const toggleQuietMode = useCallback(() =>
    setState(s => ({ ...s, quietMode: !s.quietMode })), []);
  const toggleVoiceNav = useCallback(() => {
    setState(s => {
      const next = !s.voiceNav;
      if (next) startVoice(); else stopVoice();
      return { ...s, voiceNav: next };
    });
  }, [startVoice, stopVoice]);
  const setFontSize = useCallback((size: number) =>
    setState(s => ({ ...s, fontSize: Math.min(200, Math.max(100, size)) })), []);

  return (
    <A11yContext.Provider value={{
      state,
      toggleHighContrast,
      toggleDyslexiaFont,
      toggleQuietMode,
      toggleVoiceNav,
      setFontSize,
      announce,
    }}>
      {/* ARIA live region — screen reader announcements */}
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {/* Voice indicator bar */}
      {state.voiceListening && (
        <div
          role="status"
          aria-label="Navigasi suara aktif"
          className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-xs font-semibold py-1 px-4 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" aria-hidden="true" />
            Navigasi Suara Aktif
            {state.voiceTranscript && (
              <span className="opacity-75 font-normal">— "{state.voiceTranscript}"</span>
            )}
          </span>
          {state.lastVoiceCommand && (
            <span className="text-blue-300">{state.lastVoiceCommand}</span>
          )}
        </div>
      )}
      {children}
    </A11yContext.Provider>
  );
}
