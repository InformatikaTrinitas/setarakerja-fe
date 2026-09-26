import { useState, useEffect, useCallback } from 'react';

export type AccessibilityMode = {
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  quietMode: boolean;
  voiceNav: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
};

const DEFAULT_MODE: AccessibilityMode = {
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  quietMode: false,
  voiceNav: false,
  fontSize: 'normal',
};

const STORAGE_KEY = 'setarakerja_a11y';

export function useAccessibilityMode() {
  const [mode, setMode] = useState<AccessibilityMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_MODE, ...JSON.parse(stored) } : DEFAULT_MODE;
    } catch {
      return DEFAULT_MODE;
    }
  });

  // Sinkronkan class HTML dengan mode
  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle('high-contrast', mode.highContrast);
    root.classList.toggle('dyslexia-mode', mode.dyslexiaFont);
    root.classList.toggle('quiet-mode', mode.quietMode);

    // Font size scaling
    if (mode.fontSize === 'large') root.style.fontSize = '18px';
    else if (mode.fontSize === 'xlarge') root.style.fontSize = '20px';
    else root.style.fontSize = '16px';

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
    } catch {
      // localStorage tidak tersedia
    }
  }, [mode]);

  // Deteksi prefers-reduced-motion dari sistem
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setMode(prev => ({ ...prev, reducedMotion: true }));
    }
    const handler = (e: MediaQueryListEvent) => {
      setMode(prev => ({ ...prev, reducedMotion: e.matches }));
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(<K extends keyof AccessibilityMode>(key: K) => {
    setMode(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setFontSize = useCallback((size: AccessibilityMode['fontSize']) => {
    setMode(prev => ({ ...prev, fontSize: size }));
  }, []);

  const reset = useCallback(() => {
    setMode(DEFAULT_MODE);
  }, []);

  return { mode, toggle, setFontSize, reset };
}
