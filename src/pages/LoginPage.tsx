import React, { useState, useId } from 'react';
import { Building2, UserRound } from 'lucide-react';
import type { Page } from '../types';
import { ApiError, loginRequest } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
  onLogin: (role: 'kandidat' | 'hrd') => void;
}

const DEMO_ACCOUNTS: Record<'kandidat' | 'hrd', { email: string; password: string }> = {
  kandidat: { email: 'kandidat@setarakerja.test', password: 'password123' },
  hrd: { email: 'hrd@setarakerja.test', password: 'password123' },
};

export default function LoginPage({ onNavigate, onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'kandidat' | 'hrd'>('kandidat');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Format email tidak valid';
    if (!password) e.password = 'Kata sandi wajib diisi';
    else if (password.length < 8) e.password = 'Kata sandi minimal 8 karakter';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const authenticate = async (mail: string, pass: string) => {
    setLoading(true);
    setErrors({});
    try {
      const user = await loginRequest(mail, pass);
      onLogin(user.role === 'hrd' ? 'hrd' : 'kandidat');
    } catch (err) {
      const apiError = err as ApiError;
      setErrors({
        general: apiError.message || 'Gagal masuk. Periksa koneksi backend Anda.',
        email: apiError.fields?.email,
        password: apiError.fields?.password,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await authenticate(email, password);
  };

  const handleDemo = async (demoRole: 'kandidat' | 'hrd') => {
    const account = DEMO_ACCOUNTS[demoRole];
    setEmail(account.email);
    setPassword(account.password);
    await authenticate(account.email, account.password);
  };

  return (
    <main id="main-content" className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#F8FAFF]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#111827] mb-2"
            
          >
            Selamat datang
          </h1>
          <p className="text-[#6B7280]">Masuk ke akun SetaraKerja Anda</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8">
          {/* Role selector */}
          <div className="mb-6">
            <div
              className="grid grid-cols-2 gap-1 p-1 bg-[#F8FAFF] rounded-xl border border-[#E2E8F0]"
              role="group"
              aria-label="Pilih jenis akun"
            >
              {(['kandidat', 'hrd'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  aria-pressed={role === r}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    role === r
                      ? 'bg-white text-[#1E40AF] shadow-sm border border-[#E2E8F0]'
                      : 'text-[#6B7280] hover:text-[#374151]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">{r === 'kandidat' ? <UserRound size={16} /> : <Building2 size={16} />}{r === 'kandidat' ? 'Kandidat' : 'HRD / Perusahaan'}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Form masuk">
            {errors.general && (
              <div role="alert" className="mb-4 px-3 py-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
                {errors.general}
              </div>
            )}
            {/* Email */}
            <div className="mb-5">
              <label htmlFor={emailId} className="block text-sm font-medium text-[#374151] mb-1.5">
                Alamat Email
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                placeholder="nama@email.com"
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? emailErrorId : undefined}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all bg-white ${
                  errors.email
                    ? 'border-[#EF4444] focus:ring-[#EF4444]/20'
                    : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                } focus:outline-none focus:ring-4`}
              />
              {errors.email && (
                <p id={emailErrorId} role="alert" className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                  <span aria-hidden="true">⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor={passwordId} className="text-sm font-medium text-[#374151]">
                  Kata Sandi
                </label>
                <button type="button" className="text-xs text-[#2563EB] hover:text-[#1E40AF]">
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                  placeholder="Minimal 8 karakter"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? passwordErrorId : undefined}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-all bg-white ${
                    errors.password
                      ? 'border-[#EF4444] focus:ring-[#EF4444]/20'
                      : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                  } focus:outline-none focus:ring-4`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] p-1"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p id={passwordErrorId} role="alert" className="mt-1.5 text-xs text-[#EF4444] flex items-center gap-1">
                  <span aria-hidden="true">⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full bg-[#2563EB] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1E40AF] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
                  </svg>
                  Masuk...
                </>
              ) : (
                `Masuk sebagai ${role === 'kandidat' ? 'Kandidat' : 'HRD'}`
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              Belum punya akun?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-[#2563EB] font-semibold hover:text-[#1E40AF] transition-colors"
              >
                Daftar gratis
              </button>
            </p>
          </div>
        </div>

        {/* Demo shortcut */}
        <div className="mt-4 p-4 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl">
          <p className="text-xs text-[#92400E] font-medium mb-2">Demo cepat (untuk juri SWITCHFEST):</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDemo('kandidat')}
              disabled={loading}
              className="flex-1 text-xs bg-white border border-[#D1D5DB] text-[#374151] py-2 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors disabled:opacity-60"
            >
              Masuk sebagai Kandidat
            </button>
            <button
              onClick={() => handleDemo('hrd')}
              disabled={loading}
              className="flex-1 text-xs bg-white border border-[#D1D5DB] text-[#374151] py-2 px-3 rounded-lg hover:bg-[#F9FAFB] transition-colors disabled:opacity-60"
            >
              Masuk sebagai HRD
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
