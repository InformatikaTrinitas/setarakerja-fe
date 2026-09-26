import { useState, useEffect, useRef } from 'react';

export function useBlindMode() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('sk_blind_mode') === 'true'; } catch { return false; }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const lastSpokenRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const moveThrottleRef = useRef<number>(0);
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try { localStorage.setItem('sk_blind_mode', String(enabled)); } catch { /* noop */ }

    if (!enabled) {
      if (oscRef.current) {
        try { oscRef.current.stop(); } catch { /* noop */ }
        oscRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      gainRef.current = null;
      pannerRef.current = null;
      speechSynthesis.cancel();

      if (cursorRef.current) {
        cursorRef.current.remove();
        cursorRef.current = null;
      }
      document.documentElement.style.cursor = '';
      return;
    }

    // Create visual cursor indicator
    const cursor = document.createElement('div');
    cursor.id = 'sk-blind-cursor';
    cursor.style.cssText = `
      position: fixed; pointer-events: none; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      border: 3px solid #628ECB; background: rgba(98,142,203,0.12);
      transform: translate(-50%,-50%); transition: left 0.05s, top 0.05s;
      box-shadow: 0 0 0 4px rgba(57,88,134,0.15);
    `;
    document.body.appendChild(cursor);
    cursorRef.current = cursor;
    document.documentElement.style.cursor = 'none';

    // Create audio graph
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscRef.current = osc;
    gainRef.current = gain;
    pannerRef.current = panner;

    const speak = (text: string) => {
      const now = Date.now();
      if (lastSpokenRef.current.text === text && now - lastSpokenRef.current.time < 800) return;
      lastSpokenRef.current = { text, time: now };
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'id-ID';
      utt.rate = 1.1;
      utt.pitch = 1;
      speechSynthesis.speak(utt);
    };

    const pingAudio = (freq: number, durationMs: number) => {
      if (!audioCtxRef.current) return;
      const pingOsc = audioCtxRef.current.createOscillator();
      const pingGain = audioCtxRef.current.createGain();
      pingOsc.connect(pingGain);
      pingGain.connect(audioCtxRef.current.destination);
      pingOsc.frequency.value = freq;
      pingOsc.type = 'sine';
      pingGain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
      pingGain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + durationMs / 1000);
      pingOsc.start();
      pingOsc.stop(audioCtxRef.current.currentTime + durationMs / 1000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - moveThrottleRef.current < 30) return;
      moveThrottleRef.current = now;

      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }

      if (!oscRef.current || !gainRef.current || !pannerRef.current || !audioCtxRef.current) return;

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const freq = 800 - y * 580; // 220–800 Hz, higher = top
      const pan = x * 2 - 1;

      oscRef.current.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.08);
      pannerRef.current.pan.setTargetAtTime(pan, audioCtxRef.current.currentTime, 0.08);
      gainRef.current.gain.setTargetAtTime(0.07, audioCtxRef.current.currentTime, 0.03);
    };

    const handleMouseStop = () => {
      if (!gainRef.current || !audioCtxRef.current) return;
      gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.15);
    };

    let stopTimer: ReturnType<typeof setTimeout>;
    const handleMouseMoveWithStop = (e: MouseEvent) => {
      handleMouseMove(e);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(handleMouseStop, 150);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target) return;

      const btn = target.closest('button, a, [role="button"]');
      const input = target.closest('input, select, textarea');
      const heading = target.closest('h1, h2, h3, h4, h5, h6');

      if (btn) {
        const label =
          btn.getAttribute('aria-label') ||
          (btn as HTMLElement).innerText?.replace(/\s+/g, ' ').trim() ||
          'tombol';
        pingAudio(880, 80);
        speak(`tombol: ${label}`);
        if (cursorRef.current) {
          cursorRef.current.style.borderColor = '#395886';
          cursorRef.current.style.width = '64px';
          cursorRef.current.style.height = '64px';
        }
      } else if (input) {
        const lbl =
          (input as HTMLElement).getAttribute('aria-label') ||
          document.querySelector(`label[for="${(input as HTMLInputElement).id}"]`)?.textContent ||
          'kolom input';
        pingAudio(660, 100);
        speak(`input: ${lbl}`);
      } else if (heading) {
        const text = (heading as HTMLElement).innerText?.trim();
        if (text) {
          pingAudio(528, 60);
          speak(text);
        }
      }
    };

    const handleMouseLeaveEl = () => {
      if (cursorRef.current) {
        cursorRef.current.style.borderColor = '#628ECB';
        cursorRef.current.style.width = '56px';
        cursorRef.current.style.height = '56px';
      }
    };

    document.addEventListener('mousemove', handleMouseMoveWithStop);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeaveEl, true);

    // Announce mode is on
    setTimeout(() => speak('Mode Tunanetra aktif. Gerakkan tetikus untuk mendengar posisi.'), 300);

    return () => {
      clearTimeout(stopTimer);
      document.removeEventListener('mousemove', handleMouseMoveWithStop);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeaveEl, true);
      document.documentElement.style.cursor = '';
      if (cursorRef.current) {
        cursorRef.current.remove();
        cursorRef.current = null;
      }
      if (oscRef.current) { try { oscRef.current.stop(); } catch { /* noop */ } }
      if (audioCtxRef.current) { audioCtxRef.current.close(); }
      speechSynthesis.cancel();
    };
  }, [enabled]);

  const toggle = () => setEnabled(e => !e);

  return { enabled, toggle };
}
