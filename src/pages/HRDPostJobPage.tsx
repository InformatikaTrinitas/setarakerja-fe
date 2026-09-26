import React from 'react';
import { CheckCircle2, MapPin, Plus } from 'lucide-react';
import type { Page } from '../types';
import { ApiError, createJob, fetchJobs, getSessionUser } from '../lib/api';

const LocationPicker = React.lazy(() => import('../components/LocationPicker'));

type LatLng = { lat: number; lng: number };

type JobRow = {
  id: string;
  title: string;
  location: string;
  company: string;
  type: string;
  slots?: number;
  jobCoach?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
};

const EMPTY_FORM = {
  title: '',
  location: '',
  type: 'onsite',
  salary: '',
  slots: '1',
  skills: '',
  jobCoach: '',
  description: '',
};

const TYPE_LABEL: Record<string, string> = {
  onsite: 'Onsite',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

export default function HRDPostJobPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const company = getSessionUser()?.companyName || 'Perusahaan Anda';

  const [form, setForm] = React.useState({ ...EMPTY_FORM });
  const [point, setPoint] = React.useState<LatLng | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const [jobs, setJobs] = React.useState<JobRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchJobs()
      .then((list: JobRow[]) => {
        if (cancelled) return;
        const mine = list.filter((job) => job.company === company);
        setJobs(mine);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setJobs([]);
        setLoadError(err instanceof ApiError ? err.message : 'Gagal memuat lowongan dari server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, company]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updatePoint = (next: LatLng | null) => {
    setPoint(next);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.locationLat;
      delete copy.locationLng;
      return copy;
    });
  };

  const onManualCoord = (key: 'lat' | 'lng', raw: string) => {
    const parsed = Number(raw);
    if (raw === '') {
      updatePoint(null);
      return;
    }
    if (!Number.isFinite(parsed)) return;
    updatePoint({ ...(point ?? { lat: -6.2088, lng: 106.8456 }), [key]: parsed });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Judul lowongan wajib diisi.';
    if (!form.location.trim()) errors.location = 'Lokasi wajib diisi.';
    if (!form.jobCoach.trim()) errors.jobCoach = 'Nama job coach wajib diisi.';
    if (point && (point.lat < -90 || point.lat > 90)) errors.locationLat = 'Lintang di antara -90 dan 90.';
    if (point && (point.lng < -180 || point.lng > 180)) errors.locationLng = 'Bujur di antara -180 dan 180.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Periksa kembali isian yang bertanda merah.');
      return;
    }

    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    setNotice(null);

    try {
      await createJob({
        title: form.title.trim(),
        company,
        location: form.location.trim(),
        type: form.type as 'remote' | 'hybrid' | 'onsite',
        salary: form.salary.trim() || undefined,
        slots: Number(form.slots) > 0 ? Number(form.slots) : 1,
        skills: form.skills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        description: form.description.trim() || undefined,
        jobCoach: form.jobCoach.trim() || undefined,
        locationLat: point?.lat ?? null,
        locationLng: point?.lng ?? null,
      });

      setNotice(`Lowongan "${form.title.trim()}" berhasil dipasang untuk ${company}.`);
      setForm({ ...EMPTY_FORM });
      setPoint(null);
      setReloadKey((key) => key + 1);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setFieldErrors(err.fields ?? {});
      } else {
        setFormError('Gagal memasang lowongan. Coba lagi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white outline-none transition-colors ${
      hasError ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20' : 'border-slate-200 focus:border-[#628ECB] focus:ring-2 focus:ring-[#628ECB]/20'
    }`;

  return (
    <main id="main-content" className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#395886] mb-2">Pasang Lowongan</h1>
        <p className="text-sm text-slate-500 mb-6">
          Lowongan dipasang atas nama <span className="font-semibold text-[#395886]">{company}</span>. Tandai titik lokasi
          kantor perusahaan langsung pada peta.
        </p>

        {notice && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Judul Lowongan <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Contoh: Operator Produksi"
                aria-invalid={!!fieldErrors.title}
                className={inputClass(!!fieldErrors.title)}
              />
              {fieldErrors.title && <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>}
            </label>

            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Lokasi <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Contoh: Tangerang (Onsite)"
                aria-invalid={!!fieldErrors.location}
                className={inputClass(!!fieldErrors.location)}
              />
              {fieldErrors.location && <p className="mt-1 text-xs text-red-500">{fieldErrors.location}</p>}
            </label>

            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipe Kerja</span>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className={inputClass(false)}
              >
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gaji</span>
              <input
                type="text"
                value={form.salary}
                onChange={(e) => update('salary', e.target.value)}
                placeholder="Contoh: Rp 4–6 jt/bln"
                className={inputClass(false)}
              />
            </label>

            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Slot</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.slots}
                onChange={(e) => update('slots', e.target.value)}
                className={inputClass(false)}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Job Coach <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={form.jobCoach}
                onChange={(e) => update('jobCoach', e.target.value)}
                placeholder="Tulis nama job coach, contoh: Dewi Putri"
                aria-invalid={!!fieldErrors.jobCoach}
                className={inputClass(!!fieldErrors.jobCoach)}
              />
              {fieldErrors.jobCoach && <p className="mt-1 text-xs text-red-500">{fieldErrors.jobCoach}</p>}
              <p className="mt-1 text-xs text-slate-400">
                Job coach mendampingi kandidat selama masa orientasi kerja.
              </p>
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Skill (pisahkan dengan koma)
              </span>
              <input
                type="text"
                value={form.skills}
                onChange={(e) => update('skills', e.target.value)}
                placeholder="Contoh: Disiplin, Ketelitian, Kerja Tim"
                className={inputClass(false)}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Deskripsi Pekerjaan
              </span>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                placeholder="Jelaskan tugas, kualifikasi, dan penyesuaian yang tersedia."
                className={inputClass(false)}
              />
            </label>
          </div>

          {/* Titik lokasi perusahaan */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" />
                Titik Lokasi Perusahaan
              </span>
              {point && (
                <button
                  type="button"
                  onClick={() => updatePoint(null)}
                  className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
                >
                  Hapus titik
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Klik pada peta untuk menandai titik lokasi kantor, atau isi koordinat secara manual.
            </p>

            <React.Suspense
              fallback={
                <div className="h-[280px] rounded-2xl border border-slate-200 bg-slate-100 grid place-items-center text-sm text-slate-400">
                  Memuat peta…
                </div>
              }
            >
              <LocationPicker value={point} onChange={(picked) => updatePoint(picked)} />
            </React.Suspense>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Latitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={point?.lat ?? ''}
                  onChange={(e) => onManualCoord('lat', e.target.value)}
                  placeholder="Contoh: -6.200000"
                  aria-invalid={!!fieldErrors.locationLat}
                  className={inputClass(!!fieldErrors.locationLat)}
                />
                {fieldErrors.locationLat && <p className="mt-1 text-xs text-red-500">{fieldErrors.locationLat}</p>}
              </label>
              <label className="block">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Longitude</span>
                <input
                  type="number"
                  step="0.000001"
                  value={point?.lng ?? ''}
                  onChange={(e) => onManualCoord('lng', e.target.value)}
                  placeholder="Contoh: 106.650000"
                  aria-invalid={!!fieldErrors.locationLng}
                  className={inputClass(!!fieldErrors.locationLng)}
                />
                {fieldErrors.locationLng && <p className="mt-1 text-xs text-red-500">{fieldErrors.locationLng}</p>}
              </label>
            </div>
          </div>

          {formError && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #395886, #628ECB)' }}
            >
              <Plus size={16} aria-hidden="true" />
              {saving ? 'Menyimpan…' : 'Pasang Lowongan'}
            </button>
          </div>
        </form>

        {/* Daftar lowongan perusahaan ini */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#395886]">Lowongan {company}</span>
            <span className="text-xs text-slate-400">{loading ? 'Memuat…' : `${jobs.length} lowongan`}</span>
          </div>

          {loading && (
            <div className="px-5 py-8 text-sm text-slate-500" role="status">
              Memuat lowongan…
            </div>
          )}

          {!loading && loadError && (
            <div className="px-5 py-8 text-center" role="alert">
              <p className="text-sm text-red-500 mb-3">{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !loadError && jobs.length === 0 && (
            <div className="px-5 py-8 text-sm text-slate-400">
              Belum ada lowongan untuk {company}. Isi formulir di atas untuk memasang lowongan pertama.
            </div>
          )}

          {!loading &&
            !loadError &&
            jobs.map((job) => (
              <div key={String(job.id)} className="px-5 py-4 border-b border-slate-100 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#395886] truncate">{job.title}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {job.location} · {TYPE_LABEL[job.type] ?? job.type}
                      {typeof job.slots === 'number' ? ` · ${job.slots} slot` : ''}
                    </div>
                    <div className="text-xs text-[#628ECB] font-semibold truncate">
                      {job.jobCoach ? `Job Coach: ${job.jobCoach}` : 'Belum ada job coach'}
                    </div>
                  </div>
                  {job.locationLat != null && job.locationLng != null ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#E6EEF9] text-[#395886]">
                      <MapPin size={12} aria-hidden="true" />
                      {job.locationLat}, {job.locationLng}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400">
                      Titik lokasi belum dipilih
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}
