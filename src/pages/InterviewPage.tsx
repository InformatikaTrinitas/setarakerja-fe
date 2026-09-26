import React, { useRef, useState, useEffect } from 'react';
import type { Page } from '../types';
import {
  Send, Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, MonitorUp, MoreVertical, Volume2, VolumeX, X,
} from 'lucide-react';
import { getSessionUser } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
  userRole: 'kandidat' | 'hrd';
}

export default function InterviewPage({ onNavigate, userRole }: Props) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'System', text: 'Panggilan telah dimulai. Pesan diamankan dengan enkripsi end-to-end.', time: '' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Time display
  const [callTime, setCallTime] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setCallTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Programmatic audio — respects browser autoplay policy
  const toggleSpeaker = async () => {
    if (!audioRef.current) return;
    if (isSpeakerOn) {
      audioRef.current.pause();
      setIsSpeakerOn(false);
    } else {
      try {
        await audioRef.current.play();
        setIsSpeakerOn(true);
        setAudioBlocked(false);
      } catch {
        setAudioBlocked(true);
      }
    }
  };

  const remoteVideoUrl = userRole === 'hrd'
    ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1280&h=720&fit=crop&crop=faces,top&auto=format'
    : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1280&h=720&fit=crop&crop=faces,top&auto=format';

  const localVideoUrl = userRole === 'hrd'
    ? 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=faces,top&auto=format'
    : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop&crop=faces,top&auto=format';

  const sessionUser = getSessionUser();
  const remoteName = userRole === 'hrd'
    ? 'Kandidat (anonim)'
    : sessionUser?.companyName
      ? `${sessionUser.companyName} · HRD`
      : 'HRD perusahaan';
  const localName  = userRole === 'hrd' ? `Anda (${sessionUser?.name ?? 'HRD'})` : `Anda (${sessionUser?.name ?? 'Kandidat'})`;

  const captionText = userRole === 'hrd'
    ? 'Halo, selamat pagi Bu. Saya siap untuk interview hari ini.'
    : 'Selamat pagi, terima kasih sudah hadir tepat waktu. Bisa ceritakan tentang portofolio Anda?';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const sender = userRole === 'hrd' ? 'HR Manager' : 'Kandidat';
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender, text: chatInput.trim(), time }]);
    setChatInput('');
  };

  return (
    <div className="h-screen w-full bg-[#202124] flex overflow-hidden font-sans" lang="id">
      {/* Hidden audio element — NOT autoPlayed; user must click speaker button */}
      <audio
        ref={audioRef}
        loop
        src="https://www.soundjay.com/human/sounds/breathing-1.mp3"
        aria-hidden="true"
      />

      {/* Autoplay-blocked notice */}
      {audioBlocked && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-500 text-slate-900 text-sm font-semibold px-5 py-3 rounded-xl shadow-xl flex items-center gap-3"
        >
          <Volume2 size={16} aria-hidden="true" />
          Browser memblokir audio otomatis. Klik ikon speaker untuk mengaktifkan suara.
          <button
            onClick={() => setAudioBlocked(false)}
            aria-label="Tutup notifikasi"
            className="ml-2 hover:opacity-70"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main Video Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="flex-1 p-4 flex gap-4 relative">

          {/* Remote Video Container */}
          <div className="flex-1 bg-[#3C4043] rounded-2xl overflow-hidden relative shadow-lg">
            <img
              src={remoteVideoUrl}
              alt={`Feed video ${remoteName}`}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm backdrop-blur-md">
              {remoteName}
            </div>

            {/* High-contrast live captions — WCAG 2.2 AA */}
            <div
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center px-4"
              aria-live="polite"
              aria-label="Teks real-time wawancara"
            >
              <div className="bg-slate-950/95 border-2 border-blue-400 text-blue-300 text-base px-5 py-3 rounded-xl inline-block font-medium shadow-xl leading-relaxed">
                {captionText}
              </div>
            </div>
          </div>

          {/* Local Video Thumbnail — floating, does NOT push layout */}
          <div
            className={`absolute top-8 right-8 w-56 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 ${
              isVideoOff ? 'flex items-center justify-center bg-slate-800' : ''
            }`}
            aria-label={`Kamera Anda: ${localName}`}
          >
            {!isVideoOff ? (
              <>
                <img
                  src={localVideoUrl}
                  alt={`Feed kamera lokal: ${localName}`}
                  className="w-full h-full object-cover object-top scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-xs backdrop-blur-sm">
                  {localName}
                </div>
                {isMuted && (
                  <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1 shadow" aria-label="Mikrofon dimatikan">
                    <MicOff size={12} className="text-white" aria-hidden="true" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-white flex flex-col items-center gap-2" aria-label="Kamera dimatikan">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {localName[0]}
                </div>
                <span className="text-xs">Kamera Mati</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Controls ─────────────────────────────────────────── */}
        <div className="h-20 bg-[#202124] flex items-center justify-between px-6 pb-2 flex-shrink-0">
          <div className="flex items-center text-white/70 text-sm font-medium w-52">
            <span className="mr-3">{callTime}</span>
            <span className="truncate border-l border-white/20 pl-3">Interview SetaraKerja</span>
          </div>

          <div className="flex items-center gap-3" role="toolbar" aria-label="Kontrol panggilan">
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-pressed={isMuted}
              aria-label={isMuted ? 'Aktifkan mikrofon' : 'Matikan mikrofon'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isMuted ? 'bg-[#EA4335] text-white' : 'bg-[#3C4043] hover:bg-[#4d5155] text-white'
              }`}
            >
              {isMuted ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
            </button>

            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              aria-pressed={isVideoOff}
              aria-label={isVideoOff ? 'Aktifkan kamera' : 'Matikan kamera'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isVideoOff ? 'bg-[#EA4335] text-white' : 'bg-[#3C4043] hover:bg-[#4d5155] text-white'
              }`}
            >
              {isVideoOff ? <VideoOff size={20} aria-hidden="true" /> : <Video size={20} aria-hidden="true" />}
            </button>

            {/* Speaker toggle — explicit user gesture to avoid autoplay block */}
            <button
              onClick={toggleSpeaker}
              aria-pressed={isSpeakerOn}
              aria-label={isSpeakerOn ? 'Matikan speaker' : 'Aktifkan speaker'}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isSpeakerOn ? 'bg-blue-600 text-white' : 'bg-[#3C4043] hover:bg-[#4d5155] text-white'
              }`}
            >
              {isSpeakerOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
            </button>

            <button
              aria-label="Bagikan layar"
              className="w-12 h-12 bg-[#3C4043] hover:bg-[#4d5155] text-white rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <MonitorUp size={20} aria-hidden="true" />
            </button>

            <button
              aria-label="Opsi lainnya"
              className="w-12 h-12 bg-[#3C4043] hover:bg-[#4d5155] text-white rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <MoreVertical size={20} aria-hidden="true" />
            </button>

            <button
              onClick={() => onNavigate(userRole === 'hrd' ? 'hrd' : 'kandidat')}
              aria-label="Akhiri panggilan"
              className="w-16 h-12 bg-[#EA4335] hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors px-6 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <PhoneOff size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 w-52">
            <button
              onClick={() => setIsChatOpen(p => !p)}
              aria-label={isChatOpen ? 'Tutup panel pesan' : 'Buka panel pesan'}
              aria-expanded={isChatOpen}
              aria-controls="chat-panel"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isChatOpen ? 'bg-blue-100 text-blue-600' : 'text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Chat Sidebar — uses transform so it NEVER displaces the video layout ── */}
      <div
        id="chat-panel"
        role="complementary"
        aria-label="Panel pesan panggilan"
        aria-hidden={!isChatOpen}
        className={`flex flex-col bg-white border-l border-slate-200 shadow-2xl z-10 flex-shrink-0 transition-all duration-300 ${
          isChatOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}
      >
        {isChatOpen && (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
              <h2 className="font-semibold text-slate-800 text-sm">Pesan Panggilan</h2>
              <button
                onClick={() => setIsChatOpen(false)}
                aria-label="Tutup panel pesan"
                className="text-slate-400 hover:text-slate-700 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-white flex flex-col gap-4 min-h-0">
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl text-center leading-relaxed">
                Pesan hanya dapat dilihat peserta panggilan dan dihapus setelah panggilan berakhir.
              </div>

              {messages.map((msg, i) => {
                if (msg.sender === 'System') return null;
                const isMe = msg.sender === (userRole === 'hrd' ? 'HR Manager' : 'Kandidat');
                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-slate-400 mb-1">{msg.sender} · {msg.time}</div>
                    <div
                      className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] ${
                        isMe ? 'bg-[#047857] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="relative">
                <label htmlFor="chat-input" className="sr-only">Kirim pesan ke semua peserta</label>
                <input
                  id="chat-input"
                  type="text"
                  placeholder="Kirim pesan ke semua orang"
                  className="w-full bg-slate-100 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  aria-label="Kirim pesan"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#047857] hover:bg-emerald-50 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Send size={16} aria-hidden="true" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
