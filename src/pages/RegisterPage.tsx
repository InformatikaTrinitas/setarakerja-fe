import React, { useState, useId } from 'react';
import { Building2, Check, LockKeyhole, UserRound, AlertCircle } from 'lucide-react';
import type { Page, DisabilityType } from '../types';
import { ApiError, registerRequest } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
  onLogin: (role: 'kandidat' | 'hrd') => void;
}

const DISABILITY_TYPES: { value: DisabilityType; label: string }[] = [
  { value: 'tunarungu', label: 'Tunarungu / Tunarungu-wicara' },
  { value: 'tunadaksa', label: 'Tunadaksa (fisik)' },
  { value: 'tunanetra', label: 'Tunanetra / Low Vision' },
  { value: 'tunawicara', label: 'Tunawicara' },
  { value: 'autisme', label: 'Autisme' },
  { value: 'lainnya', label: 'Lainnya / Tidak ingin menyebutkan' },
];

const STEPS = ['Jenis Akun', 'Data Diri', 'Keamanan'];

export default function RegisterPage({ onNavigate, onLogin }: Props) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'kandidat' | 'hrd'>('kandidat');
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    disabilityType: '' as DisabilityType | '',
    hasDoc: false,
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    // HRD fields
    companyName: '',
    companySize: '',
    npwp: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const emailId = useId();
  const nameId = useId();

  const update = (k: string, v: string | boolean) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      // role selection — always valid
    }
    if (step === 1) {
      if (!form.email) e.email = 'Email wajib diisi';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Format email tidak valid';
      if (!form.fullName) e.fullName = 'Nama wajib diisi';
      if (role === 'hrd' && !form.companyName) e.companyName = 'Nama perusahaan wajib diisi';
    }
    if (step === 2) {
      if (!form.password) e.password = 'Kata sandi wajib diisi';
      else if (form.password.length < 8) e.password = 'Minimal 8 karakter';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Kata sandi tidak cocok';
      if (!form.agreeTerms) e.agreeTerms = 'Anda harus menyetujui syarat & ketentuan';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await registerRequest({
        role,
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        password_confirmation: form.confirmPassword,
        disabilityType: role === 'kandidat' && form.disabilityType ? form.disabilityType : undefined,
        companyName: role === 'hrd' ? form.companyName : undefined,
        agreeTerms: form.agreeTerms,
      });
      onLogin(user.role === 'hrd' ? 'hrd' : 'kandidat');
    } catch (err) {
      const apiError = err as ApiError;
      const nextErrors: Record<string, string> = {};
      Object.entries(apiError.fields ?? {}).forEach(([key, value]) => {
        const mapped =
          key === 'fullName' ? 'fullName'
          : key === 'password_confirmation' ? 'confirmPassword'
          : key === 'agreeTerms' ? 'agreeTerms'
          : key;
        nextErrors[mapped] = value;
      });
      if (Object.keys(nextErrors).length === 0) {
        nextErrors.general = apiError.message || 'Pendaftaran gagal. Coba lagi.';
      }
      setErrors(nextErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#F8FAFF]">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#111827] mb-2" >
            Buat Akun SetaraKerja
          </h1>
          <p className="text-[#6B7280]">Gratis selamanya untuk kandidat</p>
        </div>

        {/* Progress steps */}
        {step < 3 && (
          <div className="mb-8" aria-label="Langkah pendaftaran" role="list">
            <div className="flex items-center justify-between">
              {STEPS.slice(0, 3).map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center" role="listitem">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        i < step
                          ? 'bg-[#10B981] text-white'
                          : i === step
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#E2E8F0] text-[#9CA3AF]'
                      }`}
                      aria-current={i === step ? 'step' : undefined}
                      aria-label={`${s}${i < step ? ' (selesai)' : i === step ? ' (saat ini)' : ''}`}
                    >
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${i === step ? 'text-[#2563EB]' : 'text-[#9CA3AF]'}`}>
                      {s}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < step ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {/* Step 0: Role */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-5">Saya mendaftar sebagai...</h2>
              <div className="grid grid-cols-1 gap-4 mb-6" role="group" aria-label="Pilih jenis akun">
                {[
                  { value: 'kandidat', icon: UserRound, title: 'Kandidat', desc: 'Saya penyandang disabilitas yang mencari pekerjaan' },
                  { value: 'hrd', icon: Building2, title: 'HRD / Perusahaan', desc: 'Saya dari perusahaan yang ingin merekrut inklusif' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value as 'kandidat' | 'hrd')}
                    aria-pressed={role === opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      role === opt.value
                        ? 'border-[#2563EB] bg-[#EFF6FF]'
                        : 'border-[#E2E8F0] hover:border-[#9CA3AF]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === opt.value ? 'bg-[#DBEAFE]' : 'bg-[#F8FAFF]'
                    }`} aria-hidden="true">
                      <opt.icon size={22} className={role === opt.value ? 'text-[#395886]' : 'text-[#628ECB]'} />
                    </div>
                    <div>
                      <div className={`font-semibold ${role === opt.value ? 'text-[#1E40AF]' : 'text-[#111827]'}`}>
                        {opt.title}
                      </div>
                      <div className="text-sm text-[#6B7280]">{opt.desc}</div>
                    </div>
                    {role === opt.value && (
                      <Check className="ml-auto text-[#395886]" size={20} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
              <button onClick={next} className="w-full bg-[#2563EB] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1E40AF] transition-colors">
                Lanjut →
              </button>
            </div>
          )}

          {/* Step 1: Data */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-5">
                {role === 'kandidat' ? 'Data diri' : 'Data perusahaan'}
              </h2>

              <div className="space-y-5">
                <div>
                  <label htmlFor={emailId} className="block text-sm font-medium text-[#374151] mb-1.5">
                    Alamat Email <span aria-hidden="true" className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.email ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                  {errors.email && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.email}</p>}
                </div>

                <div>
                  <label htmlFor={nameId} className="block text-sm font-medium text-[#374151] mb-1.5">
                    {role === 'kandidat' ? 'Nama Lengkap' : 'Nama Anda'} <span aria-hidden="true" className="text-[#EF4444]">*</span>
                    <span className="ml-2 text-xs text-[#6B7280] font-normal">(dienkripsi, tidak terlihat HRD)</span>
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={form.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    placeholder={role === 'kandidat' ? 'Nama lengkap sesuai KTP' : 'Nama Anda'}
                    autoComplete="name"
                    aria-required="true"
                    aria-invalid={!!errors.fullName}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.fullName ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                  {errors.fullName && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.fullName}</p>}
                </div>

                {role === 'kandidat' && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Jenis Disabilitas
                      <span className="ml-2 text-xs text-[#6B7280] font-normal">(opsional, dienkripsi)</span>
                    </label>
                    <select
                      value={form.disabilityType}
                      onChange={e => update('disabilityType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-4 focus:border-[#2563EB] focus:ring-[#2563EB]/20 transition-all bg-white"
                    >
                      <option value="">Pilih jenis disabilitas (opsional)</option>
                      {DISABILITY_TYPES.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      Data ini dienkripsi AES-256 dan tidak pernah dibagikan ke HRD.
                    </p>
                  </div>
                )}

                {role === 'hrd' && (
                  <div>
                    <label className="block text-sm font-medium text-[#374151] mb-1.5">
                      Nama Perusahaan <span aria-hidden="true" className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={e => update('companyName', e.target.value)}
                      placeholder="PT Maju Bersama Indonesia"
                      aria-required="true"
                      aria-invalid={!!errors.companyName}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                        errors.companyName ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                      }`}
                    />
                    {errors.companyName && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.companyName}</p>}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="flex-1 border border-[#D1D5DB] text-[#374151] py-3 rounded-xl hover:bg-[#F8FAFF] transition-colors text-sm font-medium">
                  ← Kembali
                </button>
                <button onClick={next} className="flex-1 bg-[#2563EB] text-white font-semibold py-3 rounded-xl hover:bg-[#1E40AF] transition-colors">
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Security */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-[#111827] mb-5">Keamanan akun</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Kata Sandi <span aria-hidden="true" className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.password ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                  {errors.password && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.password}</p>}
                  {/* Strength indicator */}
                  {form.password && (
                    <div className="mt-2 flex gap-1" aria-label="Kekuatan kata sandi">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            form.password.length >= 8 + i * 4
                              ? i < 2 ? 'bg-[#10B981]' : 'bg-[#2563EB]'
                              : 'bg-[#E2E8F0]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">
                    Konfirmasi Kata Sandi <span aria-hidden="true" className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    placeholder="Ulangi kata sandi"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.confirmPassword}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                      errors.confirmPassword ? 'border-[#EF4444] focus:ring-[#EF4444]/20' : 'border-[#D1D5DB] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                    }`}
                  />
                  {errors.confirmPassword && <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.confirmPassword}</p>}
                </div>

                <div className="p-4 bg-[#D5DEEF] border border-[#10B981]/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <LockKeyhole size={17} className="text-[#395886] mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-xs text-[#065F46]">
                      Kata sandi digunakan untuk menghasilkan kunci enkripsi AES-256.
                      Data sensitif Anda dienkripsi di perangkat Anda sebelum dikirim ke server kami.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreeTerms}
                    onChange={e => update('agreeTerms', e.target.checked)}
                    aria-required="true"
                    className="mt-1 w-4 h-4 text-[#2563EB] border-[#D1D5DB] rounded"
                  />
                  <span className="text-sm text-[#374151]">
                    Saya menyetujui{' '}
                    <span className="text-[#2563EB] font-medium">Syarat & Ketentuan</span>{' '}
                    dan{' '}
                    <span className="text-[#2563EB] font-medium">Kebijakan Privasi</span>{' '}
                    SetaraKerja, termasuk pengolahan data sesuai UU PDP 2022.
                  </span>
                </label>
                {errors.agreeTerms && <p role="alert" className="flex items-center gap-1 text-xs text-[#EF4444]"><AlertCircle size={13} /> {errors.agreeTerms}</p>}
              </div>

              {errors.general && (
                <div role="alert" className="mt-4 px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
                  {errors.general}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-[#D1D5DB] text-[#374151] py-3 rounded-xl hover:bg-[#F8FAFF] transition-colors text-sm font-medium">
                  ← Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  aria-busy={loading}
                  className="flex-1 bg-[#2563EB] text-white font-semibold py-3 rounded-xl hover:bg-[#1E40AF] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
                      </svg>
                      Mendaftar...
                    </>
                  ) : 'Buat Akun'}
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-[#6B7280]">
            Sudah punya akun?{' '}
            <button onClick={() => onNavigate('login')} className="text-[#2563EB] font-semibold hover:text-[#1E40AF]">
              Masuk
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
