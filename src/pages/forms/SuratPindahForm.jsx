import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiInfo, FiUploadCloud } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import ValidationAlert from '../../components/ValidationAlert'
import './SuratPindahForm.css'
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
  nama_lengkap: '',
  alamat_asal: '',
  alamat_pindah: '',
  keterangan: '',
}

const FILE_FIELDS = [
  {
    key: 'suratPindah',
    backendKey: 'surat_keterangan_pindah_kelurahan',
    label: 'Surat Keterangan Pindah',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_IMAGE,
  },
  {
    key: 'pasFoto',
    backendKey: 'pas_foto_3x4',
    label: 'Pas Foto 3x4',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.IMAGE,
  },
  {
    key: 'kk',
    backendKey: 'kartu_keluarga',
    label: 'Fotocopy dan Asli KK',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_IMAGE,
  },
  {
    key: 'ktp',
    backendKey: 'ktp',
    label: 'Fotocopy KTP',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_IMAGE,
  },
  {
    key: 'aktaKelahiranTionghoa',
    backendKey: 'akta_kelahiran_wni_tionghoa',
    label: 'Fotocopy Akta Kelahiran',
    required: false,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_IMAGE,
  },
]

const FILE_FIELD_MAP = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, field]))

const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, null]))

function normalizeData(data) {
  const base = data && typeof data === 'object' ? data : {}
  return {
    nama_lengkap: base.nama_lengkap ?? base.nama ?? '',
    alamat_asal: base.alamat_asal ?? base.alamatAsal ?? '',
    alamat_pindah: base.alamat_pindah ?? base.alamatPindah ?? '',
    keterangan: base.keterangan ?? '',
  }
}

export default function SuratPindahForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [validationErrors, setValidationErrors] = useState([])
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const requiredFiles = useMemo(() => FILE_FIELDS.filter((field) => field.required).map((field) => field.key), [])

  useEffect(() => {
    setNotice('')
  }, [])

  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }, [form, files])

  const setField = (key) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = validateRequiredText(value, key === 'nama_lengkap' ? 'Nama lengkap' : key === 'alamat_asal' ? 'Alamat asal' : key === 'alamat_pindah' ? 'Alamat pindah' : 'Keterangan')
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
      const label =
        key === 'nama_lengkap'
          ? 'Nama lengkap'
          : key === 'alamat_asal'
            ? 'Alamat asal'
            : key === 'alamat_pindah'
              ? 'Alamat pindah'
              : 'Keterangan'
      const msg = validateRequiredText(form[key], label)
      if (msg) nextErrors[key] = msg
    }
    for (const key of requiredFiles) {
      const msg = validateFileField(files[key], FILE_FIELD_MAP[key])
      if (msg) nextErrors[key] = msg
    }
    setErrors(nextErrors)
    setValidationErrors(Object.values(nextErrors))
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setNotice('')
    if (!validate()) return

    const payload = {
      layanan: 'Rekomendasi Surat Pindah',
      layananPath: '/layanan/surat-pindah',
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
        const keteranganPemohon = `Nama: ${form.nama_lengkap} • Alamat Asal: ${form.alamat_asal} • Alamat Pindah: ${form.alamat_pindah}`
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuanWithDokumen({
          endpoint: '/api/rekomendasi_surat_pindah',
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_lengkap,
          nik: '',
          email: '',
          no_hp: '',
          alamat: form.alamat_pindah,
          keterangan: form.keterangan ? `${keteranganPemohon} • ${form.keterangan}` : keteranganPemohon,
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
    <div className="rk-portal rk-formPage rk-formPindah">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Surat Pindah">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Surat Pindah</h1>
            <p className="rk-formSubtitle">Lengkapi data dan unggah dokumen persyaratan.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form surat pindah">
          <div className="rk-container">
            <form className="rk-formCard" onSubmit={onSubmit}>
              <ValidationAlert errors={validationErrors} />

              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiFileText />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Pemohon</div>
                  <div className="rk-formCardDesc">Field data wajib diisi.</div>
                </div>
              </div>

              <div className="rk-grid">
                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="nama_lengkap">
                    Nama Lengkap <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nama_lengkap"
                    name="nama_lengkap"
                    className="rk-input"
                    value={form.nama_lengkap}
                    onChange={setField('nama_lengkap')}
                    placeholder="Nama lengkap"
                    required
                  />
                  {errors.nama_lengkap ? <div className="rk-error">{errors.nama_lengkap}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="alamat_asal">
                    Alamat Asal <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat_asal"
                    name="alamat_asal"
                    className="rk-textarea"
                    value={form.alamat_asal}
                    onChange={setField('alamat_asal')}
                    placeholder="Alamat asal"
                    rows={3}
                    required
                  />
                  {errors.alamat_asal ? <div className="rk-error">{errors.alamat_asal}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="alamat_pindah">
                    Alamat Pindah <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat_pindah"
                    name="alamat_pindah"
                    className="rk-textarea"
                    value={form.alamat_pindah}
                    onChange={setField('alamat_pindah')}
                    placeholder="Alamat pindah"
                    rows={3}
                    required
                  />
                  {errors.alamat_pindah ? <div className="rk-error">{errors.alamat_pindah}</div> : null}
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
                  <div className="rk-formCardDesc">Upload dokumen wajib, kecuali yang berlabel opsional.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="suratPindah">
                    Surat Keterangan Pindah (Kelurahan/Kepenghuluan) <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratPindah"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.suratPindah.accept}
                    onChange={pickFile('suratPindah')}
                  />
                  {files.suratPindah ? <div className="rk-picked">{files.suratPindah.name}</div> : null}
                  {errors.suratPindah ? <div className="rk-error">{errors.suratPindah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="pasFoto">
                    Pas Foto 3x4 (2 lembar) <span className="rk-required">*</span>
                  </label>
                  <input
                    id="pasFoto"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.pasFoto.accept}
                    onChange={pickFile('pasFoto')}
                  />
                  {files.pasFoto ? <div className="rk-picked">{files.pasFoto.name}</div> : null}
                  {errors.pasFoto ? <div className="rk-error">{errors.pasFoto}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="kk">
                    Fotocopy dan Asli KK <span className="rk-required">*</span>
                  </label>
                  <input id="kk" className="rk-file" type="file" accept={FILE_FIELD_MAP.kk.accept} onChange={pickFile('kk')} />
                  {files.kk ? <div className="rk-picked">{files.kk.name}</div> : null}
                  {errors.kk ? <div className="rk-error">{errors.kk}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktp">
                    Fotocopy KTP <span className="rk-required">*</span>
                  </label>
                  <input id="ktp" className="rk-file" type="file" accept={FILE_FIELD_MAP.ktp.accept} onChange={pickFile('ktp')} />
                  {files.ktp ? <div className="rk-picked">{files.ktp.name}</div> : null}
                  {errors.ktp ? <div className="rk-error">{errors.ktp}</div> : null}
                </div>

                <div className="rk-docField rk-span2">
                  <label className="rk-label" htmlFor="aktaKelahiranTionghoa">
                    Untuk WNI keturunan Tionghoa melampirkan fotocopy Akta Kelahiran <span className="rk-optional">Opsional</span>
                  </label>
                  <input
                    id="aktaKelahiranTionghoa"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.aktaKelahiranTionghoa.accept}
                    onChange={pickFile('aktaKelahiranTionghoa')}
                  />
                  {files.aktaKelahiranTionghoa ? <div className="rk-picked">{files.aktaKelahiranTionghoa.name}</div> : null}
                </div>
              </div>

              <div className="rk-help" aria-label="Bantuan">
                <div className="rk-helpIcon" aria-hidden="true">
                  <FiInfo />
                </div>
                <div className="rk-helpText">Pastikan dokumen terbaca jelas. Untuk lampiran opsional, unggah jika diperlukan.</div>
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
