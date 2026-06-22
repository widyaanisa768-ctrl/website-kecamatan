import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiPhone, FiUploadCloud, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import BackToLayananLink from '../../components/BackToLayananLink'
import ValidationAlert from '../../components/ValidationAlert'
import './RekomendasiKerjaForm.css'
import { getAuth, mergeDokumenMeta } from '../../lib/rkLocal'
import {
  buildDokumenPayload,
  FILE_TYPE_PRESETS,
  handleBackendValidationError,
  validateNoHpField,
  validateNikField,
  validateFileField,
  validateRequiredText,
} from '../../lib/formValidation'
import { createPengajuanWithDokumen } from '../../services/pengajuanService'

const INITIAL = {
  nama_pemohon: '',
  alamat: '',
  nik: '',
  no_hp: '',
  keterangan: '',
}

const FILE_FIELDS = [
  {
    key: 'fotocopy_ktp',
    backendKey: 'ktp',
    label: 'Fotocopy KTP',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
]

const FILE_FIELD_MAP = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, field]))

const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, null]))

const STATUS_DEFAULT = 'Menunggu verifikasi'

export default function RekomendasiKerjaForm() {
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
      nama_pemohon: (v) => validateRequiredText(v, 'Nama'),
      alamat: (v) => validateRequiredText(v, 'Alamat'),
      nik: validateNikField,
      no_hp: validateNoHpField,
      keterangan: (v) => validateRequiredText(v, 'Keterangan'),
    }),
    []
  )

  const setField = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = validators[key]?.(value) || ''
      if (next) return { ...prev, [key]: next }
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
      layanan: 'Rekomendasi Kerja',
      layananPath: '/layanan/rekomendasi-kerja',
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
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuanWithDokumen({
          endpoint: '/api/rekomendasi_surat_kerja',
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_pemohon,
          nik: form.nik,
          email: '',
          no_hp: form.no_hp,
          alamat: form.alamat,
          keterangan: form.keterangan || `Nama: ${form.nama_pemohon} • NIK: ${form.nik} • HP: ${form.no_hp}`,
          tanggal_pengajuan: new Date().toISOString(),
          dokumen_meta,
          data: payload.data,
          data_form: payload.data,
          layanan_path: payload.layananPath,
          layananPath: payload.layananPath,
          dokumen: payload.dokumen,
        })

        if (!res?.success) {
          setValidationErrors(handleBackendValidationError(res, res?.message || 'Gagal mengirim pengajuan.'))
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
    <div className="rk-portal rk-formPage rk-formKerja">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Kerja">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Kerja</h1>
            <p className="rk-formSubtitle">Lengkapi data pemohon untuk pengajuan rekomendasi kerja.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form rekomendasi kerja">
          <div className="rk-container">
            <BackToLayananLink />
            <form className="rk-formCard" onSubmit={onSubmit}>
              <ValidationAlert errors={validationErrors} />

              <div className="rk-statusRow" aria-label="Status awal">
                <div className="rk-statusPill">
                  <FiCheckCircle aria-hidden="true" /> {STATUS_DEFAULT}
                </div>
              </div>

              <div className="rk-grid">
                <div className="rk-field">
                  <label className="rk-label" htmlFor="nama_pemohon">
                    Nama Pemohon <span className="rk-required">*</span>
                  </label>
                  <div className="rk-inputRow">
                    <span className="rk-inputIcon" aria-hidden="true">
                      <FiUser />
                    </span>
                    <input
                      id="nama_pemohon"
                      name="nama_pemohon"
                      className="rk-input"
                      value={form.nama_pemohon}
                      onChange={setField('nama_pemohon')}
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                  {errors.nama_pemohon ? <div className="rk-error">{errors.nama_pemohon}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="alamat">
                    Alamat <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat"
                    name="alamat"
                    className="rk-textarea"
                    value={form.alamat}
                    onChange={setField('alamat')}
                    placeholder="Alamat domisili"
                    rows={3}
                    required
                  />
                  {errors.alamat ? <div className="rk-error">{errors.alamat}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="nik">
                    NIK <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nik"
                    name="nik"
                    className="rk-input"
                    inputMode="numeric"
                    value={form.nik}
                    onChange={setField('nik')}
                    placeholder="Hanya angka"
                    required
                  />
                  {errors.nik ? <div className="rk-error">{errors.nik}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="no_hp">
                    No HP <span className="rk-required">*</span>
                  </label>
                  <div className="rk-inputRow">
                    <span className="rk-inputIcon" aria-hidden="true">
                      <FiPhone />
                    </span>
                    <input
                      id="no_hp"
                      name="no_hp"
                      className="rk-input"
                      inputMode="numeric"
                      value={form.no_hp}
                      onChange={setField('no_hp')}
                      placeholder="Hanya angka"
                      required
                    />
                  </div>
                  {errors.no_hp ? <div className="rk-error">{errors.no_hp}</div> : null}
                </div>

                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="keterangan">
                    Keterangan <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="keterangan"
                    name="keterangan"
                    className="rk-textarea"
                    value={form.keterangan}
                    onChange={setField('keterangan')}
                    placeholder="Keterangan singkat"
                    rows={3}
                    required
                  />
                  {errors.keterangan ? <div className="rk-error">{errors.keterangan}</div> : null}
                </div>
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead isDocs">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUploadCloud />
                </div>
                <div>
                  <div className="rk-formCardTitle">Upload Dokumen</div>
                  <div className="rk-formCardDesc">Upload dokumen wajib.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="fotocopy_ktp">
                    Fotocopy KTP <span className="rk-required">*</span>
                  </label>
                  <input
                    id="fotocopy_ktp"
                    name="fotocopy_ktp"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.fotocopy_ktp.accept}
                    onChange={pickFile('fotocopy_ktp')}
                  />
                  {files.fotocopy_ktp ? <div className="rk-picked">{files.fotocopy_ktp.name}</div> : null}
                  {errors.fotocopy_ktp ? <div className="rk-error">{errors.fotocopy_ktp}</div> : null}
                </div>
              </div>

              <div className="rk-formActions">
                <button type="submit" className="rk-submitBtn" disabled={busy}>
                  {busy ? 'Memproses...' : 'Kirim'} <FiArrowRight aria-hidden="true" />
                </button>
              </div>

              {notice ? (
                <div className="rk-help" role="status" aria-live="polite" style={{ marginTop: 14 }}>
                  <div className="rk-helpIcon" aria-hidden="true">
                    <FiCheckCircle />
                  </div>
                  <div className="rk-helpText">{notice}</div>
                </div>
              ) : null}

              <div className="rk-formFoot" aria-label="Catatan">
                Upload dokumen akan diproses setelah data pengajuan tersimpan.
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

