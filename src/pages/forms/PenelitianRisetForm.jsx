import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiClipboard, FiFileText, FiUploadCloud } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import BackToLayananLink from '../../components/BackToLayananLink'
import ValidationAlert from '../../components/ValidationAlert'
import './PenelitianRisetForm.css'
import { getAuth, mergeDokumenMeta } from '../../lib/rkLocal'
import {
  buildDokumenPayload,
  FILE_TYPE_PRESETS,
  handleBackendValidationError,
  validateFileField,
  validateRequiredText,
} from '../../lib/formValidation'
import { createPengajuanWithDokumen } from '../../services/pengajuanService'

const INITIAL = {
  nama_peneliti: '',
  instansi: '',
  topik_penelitian: '',
  lokasi_penelitian: '',
  waktu_penelitian: '',
}

const FILE_FIELDS = [
  {
    key: 'ktp',
    backendKey: 'ktp_mahasiswa',
    label: 'Fotocopy KTP Mahasiswa 1 lembar',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'ktm',
    backendKey: 'ktm_mahasiswa',
    label: 'Fotocopy Kartu Tanda Mahasiswa (KTM) 1 lembar',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'suratRekomendasi',
    backendKey: 'surat_rekomendasi_riset_univ_kesbangpol',
    label: 'Surat rekomendasi riset',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
]

const FILE_FIELD_MAP = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, field]))

const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, null]))

export default function PenelitianRisetForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setNotice('')
  }, [])

  useEffect(() => {
    setValidationErrors((current) => (current.length > 0 ? [] : current))
  }, [form, files])

  const validators = useMemo(
    () => ({
      nama_peneliti: (v) => validateRequiredText(v, 'Nama peneliti'),
      instansi: (v) => validateRequiredText(v, 'Instansi'),
      topik_penelitian: (v) => validateRequiredText(v, 'Topik penelitian'),
      lokasi_penelitian: (v) => validateRequiredText(v, 'Lokasi penelitian'),
      waktu_penelitian: (v) => validateRequiredText(v, 'Waktu penelitian'),
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
    const field = FILE_FIELD_MAP[key]
    setFiles((prev) => ({ ...prev, [key]: picked }))
    setErrors((prev) => {
      const msg = validateFileField(picked, field)
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
    FILE_FIELDS.forEach((field) => {
      const msg = validateFileField(files[field.key], field)
      if (msg) nextErrors[field.key] = msg
    })
    setErrors(nextErrors)
    setValidationErrors(Object.values(nextErrors))
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
      dokumen: buildDokumenPayload(files, FILE_FIELDS),
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
        if (import.meta.env.DEV) {
          console.log('files state', files)
        }

        const res = await createPengajuanWithDokumen({
          endpoint: '/api/rekomendasi_penelitian',
          jenis_layanan: payload.layanan,
          nama_peneliti: form.nama_peneliti,
          instansi: form.instansi,
          topik_penelitian: form.topik_penelitian,
          lokasi_penelitian: form.lokasi_penelitian,
          waktu_penelitian: form.waktu_penelitian,
          tanggal_pengajuan: new Date().toISOString(),
          dokumen_meta: mergeDokumenMeta({}, payload.dokumen),
          data: payload.data,
          data_form: { ...form },
          layanan_path: payload.layananPath,
          layananPath: payload.layananPath,
          dokumen: payload.dokumen,
        })

        if (!res?.success) {
          setValidationErrors(handleBackendValidationError(res, 'Gagal mengirim pengajuan.'))
          return
        }

        setValidationErrors([])
        setNotice(res?.message || 'Pengajuan berhasil dikirim.')
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
            <BackToLayananLink />
            <form className="rk-formCard" onSubmit={onSubmit}>
              <ValidationAlert errors={validationErrors} />

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
                  <div className="rk-formCardDesc">Unggah dokumen dalam format PDF atau PNG.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktp">
                    Fotocopy KTP Mahasiswa 1 lembar <span className="rk-required">*</span>
                  </label>
                  <input id="ktp" className="rk-file" type="file" accept={FILE_FIELD_MAP.ktp.accept} onChange={pickFile('ktp')} />
                  {files.ktp ? <div className="rk-picked">{files.ktp.name}</div> : null}
                  {errors.ktp ? <div className="rk-error">{errors.ktp}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktm">
                    Fotocopy Kartu Tanda Mahasiswa (KTM) 1 lembar <span className="rk-required">*</span>
                  </label>
                  <input id="ktm" className="rk-file" type="file" accept={FILE_FIELD_MAP.ktm.accept} onChange={pickFile('ktm')} />
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
                    accept={FILE_FIELD_MAP.suratRekomendasi.accept}
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

