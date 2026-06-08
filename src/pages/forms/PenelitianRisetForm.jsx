import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiClipboard, FiFileText, FiUploadCloud } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import './PenelitianRisetForm.css'
import { getAuth } from '../../lib/rkLocal'
import { apiRequest } from '../../services/api'

const INITIAL = {
  nama_peneliti: '',
  instansi: '',
  topik_penelitian: '',
  lokasi_penelitian: '',
  waktu_penelitian: '',
}

const INITIAL_FILES = {
  ktp: null,
  ktm: null,
  suratRekomendasi: null,
}

function normalizeData(data) {
  const base = data && typeof data === 'object' ? data : {}
  return {
    nama_peneliti: base.nama_peneliti ?? base.namaPeneliti ?? '',
    instansi: base.instansi ?? '',
    topik_penelitian: base.topik_penelitian ?? base.topik ?? '',
    lokasi_penelitian: base.lokasi_penelitian ?? base.lokasi ?? '',
    waktu_penelitian: base.waktu_penelitian ?? base.waktu ?? '',
  }
}

function pickBackendMessage(res) {
  const data = res?.data
  if (!data) return res?.status ? `HTTP ${res.status}` : 'Terjadi kesalahan.'
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return 'Terjadi kesalahan.'

  const baseMsg = data.message || data.error || data.msg || ''
  const details = Array.isArray(data.errors)
    ? data.errors
        .map((e) => (typeof e === 'string' ? e : e?.message || e?.msg || e?.error || ''))
        .filter(Boolean)
        .slice(0, 6)
    : []

  if (baseMsg && details.length) return `${baseMsg}: ${details.join(', ')}`
  return baseMsg || `HTTP ${res?.status || ''}`.trim()
}

export default function PenelitianRisetForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setNotice('')
  }, [])

  const validators = useMemo(
    () => ({
      nama_peneliti: (v) => (v.trim() ? '' : 'Nama peneliti wajib diisi.'),
      instansi: (v) => (v.trim() ? '' : 'Instansi wajib diisi.'),
      topik_penelitian: (v) => (v.trim() ? '' : 'Topik penelitian wajib diisi.'),
      lokasi_penelitian: (v) => (v.trim() ? '' : 'Lokasi penelitian wajib diisi.'),
      waktu_penelitian: (v) => (v ? '' : 'Waktu penelitian wajib diisi.'),
      ktp: (f) => (f ? '' : 'Fotocopy KTP wajib diunggah.'),
      ktm: (f) => (f ? '' : 'Fotocopy KTM wajib diunggah.'),
      suratRekomendasi: (f) => (f ? '' : 'Surat rekomendasi riset wajib diunggah.'),
    }),
    []
  )

  const setField = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const msg = validators[key]?.(value) || ''
      if (msg) return { ...prev, [key]: msg }
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }

  const pickFile = (key) => (e) => {
    const picked = e.target.files?.[0] ?? null
    setFiles((prev) => ({ ...prev, [key]: picked }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const msg = validators[key]?.(picked) || ''
      if (msg) return { ...prev, [key]: msg }
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }

  const validate = () => {
    const nextErrors = {}
    for (const key of Object.keys(INITIAL)) {
      const msg = validators[key]?.(form[key]) || ''
      if (msg) nextErrors[key] = msg
    }
    for (const key of Object.keys(INITIAL_FILES)) {
      const hasNew = !!files[key]
      if (!hasNew) {
        const msg = validators[key]?.(null) || 'Wajib diunggah.'
        nextErrors[key] = msg
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setNotice('')
    if (!validate()) return

    const payload = {
      layanan: 'Rekomendasi Penelitian / Riset',
      layananPath: '/layanan/penelitian-riset',
      data: { ...form },
      dokumen: {
        fotocopyKtpMahasiswa: files.ktp,
        fotocopyKtm: files.ktm,
        suratRekomendasi: files.suratRekomendasi,
      },
    }

    void (async () => {
      const auth = getAuth()
      if (!auth) {
        setNotice('Silakan login terlebih dahulu.')
        navigate('/login', { replace: true })
        return
      }

      setBusy(true)
      try {
        // Backend endpoint ini hanya menerima field spesifik penelitian (tanpa payload umum).
        const res = await apiRequest('/api/rekomendasi_penelitian', {
          method: 'POST',
          withAuth: true,
          body: {
            nama_peneliti: form.nama_peneliti,
            instansi: form.instansi,
            topik_penelitian: form.topik_penelitian,
            lokasi_penelitian: form.lokasi_penelitian,
            waktu_penelitian: form.waktu_penelitian,
          },
        })

        if (!res?.ok) {
          setNotice(pickBackendMessage(res) || 'Gagal mengirim pengajuan.')
          return
        }

        const successMsg =
          (res?.data && typeof res.data === 'object' && (res.data.message || res.data.msg)) || 'Pengajuan berhasil dikirim.'
        setNotice(successMsg)
        window.setTimeout(() => navigate('/status-pengajuan', { replace: true }), 600)
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div className="rk-portal rk-formPage rk-formRiset">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Penelitian atau Riset">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Penelitian / Riset</h1>
            <p className="rk-formSubtitle">Lengkapi data dan unggah dokumen persyaratan.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form penelitian atau riset">
          <div className="rk-container">
            <form className="rk-formCard" onSubmit={onSubmit}>
              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiClipboard />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Peneliti</div>
                  <div className="rk-formCardDesc">Semua field wajib diisi.</div>
                </div>
              </div>

              <div className="rk-grid">
                <div className="rk-field">
                  <label className="rk-label" htmlFor="nama_peneliti">
                    Nama Peneliti <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nama_peneliti"
                    name="nama_peneliti"
                    className="rk-input"
                    value={form.nama_peneliti}
                    onChange={setField('nama_peneliti')}
                    placeholder="Nama lengkap"
                    required
                  />
                  {errors.nama_peneliti ? <div className="rk-error">{errors.nama_peneliti}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="instansi">
                    Instansi <span className="rk-required">*</span>
                  </label>
                  <input
                    id="instansi"
                    name="instansi"
                    className="rk-input"
                    value={form.instansi}
                    onChange={setField('instansi')}
                    placeholder="Universitas/Instansi"
                    required
                  />
                  {errors.instansi ? <div className="rk-error">{errors.instansi}</div> : null}
                </div>

                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="topik_penelitian">
                    Topik Penelitian <span className="rk-required">*</span>
                  </label>
                  <input
                    id="topik_penelitian"
                    name="topik_penelitian"
                    className="rk-input"
                    value={form.topik_penelitian}
                    onChange={setField('topik_penelitian')}
                    placeholder="Topik penelitian"
                    required
                  />
                  {errors.topik_penelitian ? <div className="rk-error">{errors.topik_penelitian}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="lokasi_penelitian">
                    Lokasi Penelitian <span className="rk-required">*</span>
                  </label>
                  <input
                    id="lokasi_penelitian"
                    name="lokasi_penelitian"
                    className="rk-input"
                    value={form.lokasi_penelitian}
                    onChange={setField('lokasi_penelitian')}
                    placeholder="Lokasi penelitian"
                    required
                  />
                  {errors.lokasi_penelitian ? <div className="rk-error">{errors.lokasi_penelitian}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="waktu_penelitian">
                    Waktu Penelitian <span className="rk-required">*</span>
                  </label>
                  <input
                    id="waktu_penelitian"
                    name="waktu_penelitian"
                    className="rk-input"
                    type="date"
                    value={form.waktu_penelitian}
                    onChange={setField('waktu_penelitian')}
                    required
                  />
                  {errors.waktu_penelitian ? <div className="rk-error">{errors.waktu_penelitian}</div> : null}
                </div>
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead isDocs">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUploadCloud />
                </div>
                <div>
                  <div className="rk-formCardTitle">Upload Dokumen</div>
                  <div className="rk-formCardDesc">Unggah dokumen dalam format PDF atau gambar.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktp">
                    Fotocopy KTP Mahasiswa 1 lembar <span className="rk-required">*</span>
                  </label>
                  <input id="ktp" className="rk-file" type="file" accept="image/*,.pdf" onChange={pickFile('ktp')} />
                  {files.ktp ? <div className="rk-picked">{files.ktp.name}</div> : null}
                  {errors.ktp ? <div className="rk-error">{errors.ktp}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktm">
                    Fotocopy Kartu Tanda Mahasiswa (KTM) 1 lembar <span className="rk-required">*</span>
                  </label>
                  <input id="ktm" className="rk-file" type="file" accept="image/*,.pdf" onChange={pickFile('ktm')} />
                  {files.ktm ? <div className="rk-picked">{files.ktm.name}</div> : null}
                  {errors.ktm ? <div className="rk-error">{errors.ktm}</div> : null}
                </div>

                <div className="rk-docField rk-span2">
                  <label className="rk-label" htmlFor="suratRekomendasi">
                    Surat Rekomendasi Riset dari Universitas / KESBANGPOL Kabupaten Rokan Hilir{' '}
                    <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratRekomendasi"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('suratRekomendasi')}
                  />
                  {files.suratRekomendasi ? <div className="rk-picked">{files.suratRekomendasi.name}</div> : null}
                  {errors.suratRekomendasi ? <div className="rk-error">{errors.suratRekomendasi}</div> : null}
                </div>
              </div>

              <div className="rk-formActions">
                <button type="submit" className="rk-submitBtn" disabled={busy}>
                  {busy ? 'Memproses...' : 'Kirim'} <FiArrowRight aria-hidden="true" />
                </button>
                <div className="rk-formHint" aria-label="Keterangan">
                  <FiCheckCircle aria-hidden="true" /> Bertanda <span className="rk-required">*</span> wajib diisi.
                </div>
              </div>

              {notice ? (
                <div className="rk-help" role="status" aria-live="polite" style={{ marginTop: 14 }}>
                  <div className="rk-helpIcon" aria-hidden="true">
                    <FiFileText />
                  </div>
                  <div className="rk-helpText">{notice}</div>
                </div>
              ) : null}

              <div className="rk-formFoot" aria-label="Catatan">
                <FiFileText aria-hidden="true" /> Upload dokumen akan diproses setelah data pengajuan tersimpan.
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

