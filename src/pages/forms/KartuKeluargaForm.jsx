import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiPhone, FiUploadCloud, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import BackToLayananLink from '../../components/BackToLayananLink'
import ValidationAlert from '../../components/ValidationAlert'
import './KartuKeluargaForm.css'
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
}

const FILE_FIELDS = [
  {
    key: 'suratKeteranganRt',
    backendKey: 'surat_keterangan_rt',
    label: 'Surat Keterangan RT',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'pengantarLurah',
    backendKey: 'pengantar_lurah_penghulu',
    label: 'Pengantar Lurah / Penghulu',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'suratNikah',
    backendKey: 'surat_nikah',
    label: 'Fotocopy Surat Nikah',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'kk',
    backendKey: 'kartu_keluarga',
    label: 'Fotocopy dan Asli Kartu Keluarga',
    required: true,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
  {
    key: 'lampiranWniTambahan',
    backendKey: 'akta_kelahiran_dan_suket_wni_tionghoa',
    label: 'Lampiran tambahan WNI keturunan Tionghoa',
    required: false,
    maxSizeMB: 2,
    ...FILE_TYPE_PRESETS.PDF_PNG,
  },
]

const FILE_FIELD_MAP = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, field]))

const INITIAL_FILES = Object.fromEntries(FILE_FIELDS.map((field) => [field.key, null]))

export default function KartuKeluargaForm() {
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
      nama_pemohon: (v) => validateRequiredText(v, 'Nama pemohon'),
      alamat: (v) => validateRequiredText(v, 'Alamat'),
      nik: validateNikField,
      no_hp: validateNoHpField,
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
      layanan: 'Rekomendasi Kartu Keluarga',
      layananPath: '/layanan/kartu-keluarga',
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
        const keteranganPemohon = `Nama: ${form.nama_pemohon} • NIK: ${form.nik} • HP: ${form.no_hp}`
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuanWithDokumen({
          endpoint: '/api/rekomendasi_kartu_keluarga',
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_pemohon,
          nik: form.nik,
          email: '',
          no_hp: form.no_hp,
          alamat: form.alamat,
          keterangan: keteranganPemohon,
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
    <div className="rk-portal rk-formPage rk-formKk">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Kartu Keluarga">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Kartu Keluarga</h1>
            <p className="rk-formSubtitle">Lengkapi data pemohon dan unggah dokumen persyaratan.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form rekomendasi kartu keluarga">
          <div className="rk-container">
            <BackToLayananLink />
            <form className="rk-formCard" onSubmit={onSubmit} noValidate>
              <ValidationAlert errors={validationErrors} />

              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUser />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Pemohon</div>
                  <div className="rk-formCardDesc">Semua field data wajib diisi.</div>
                </div>
              </div>

              <div className="rk-grid">
                <div className="rk-field">
                  <label className="rk-label" htmlFor="nama_pemohon">
                    Nama Pemohon <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nama_pemohon"
                    name="nama_pemohon"
                    className="rk-input"
                    value={form.nama_pemohon}
                    onChange={setField('nama_pemohon')}
                    placeholder="Nama lengkap"
                    required
                  />
                  {errors.nama_pemohon ? <div className="rk-error">{errors.nama_pemohon}</div> : null}
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

                <div className="rk-field rk-span2">
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
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead isDocs">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUploadCloud />
                </div>
                <div>
                  <div className="rk-formCardTitle">Upload Dokumen</div>
                  <div className="rk-formCardDesc">Semua dokumen wajib diunggah, kecuali yang bertanda opsional.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="suratRt">
                    Surat Keterangan RT <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratRt"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.suratKeteranganRt.accept}
                    onChange={pickFile('suratKeteranganRt')}
                  />
                  {files.suratKeteranganRt ? <div className="rk-picked">{files.suratKeteranganRt.name}</div> : null}
                  {errors.suratKeteranganRt ? <div className="rk-error">{errors.suratKeteranganRt}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="pengantarLurah">
                    Pengantar Lurah / Penghulu <span className="rk-required">*</span>
                  </label>
                  <input
                    id="pengantarLurah"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.pengantarLurah.accept}
                    onChange={pickFile('pengantarLurah')}
                  />
                  {files.pengantarLurah ? <div className="rk-picked">{files.pengantarLurah.name}</div> : null}
                  {errors.pengantarLurah ? <div className="rk-error">{errors.pengantarLurah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="suratNikah">
                    Fotocopy Surat Nikah <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratNikah"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.suratNikah.accept}
                    onChange={pickFile('suratNikah')}
                  />
                  {files.suratNikah ? <div className="rk-picked">{files.suratNikah.name}</div> : null}
                  {errors.suratNikah ? <div className="rk-error">{errors.suratNikah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="kk">
                    Fotocopy dan Asli Kartu Keluarga <span className="rk-required">*</span>
                  </label>
                  <input id="kk" className="rk-file" type="file" accept={FILE_FIELD_MAP.kk.accept} onChange={pickFile('kk')} />
                  {files.kk ? <div className="rk-picked">{files.kk.name}</div> : null}
                  {errors.kk ? <div className="rk-error">{errors.kk}</div> : null}
                </div>

                <div className="rk-docField rk-span2">
                  <label className="rk-label" htmlFor="lampiranWni">
                    Lampiran tambahan WNI keturunan Tionghoa <span className="rk-optional">(Opsional)</span>
                  </label>
                  <input
                    id="lampiranWni"
                    className="rk-file"
                    type="file"
                    accept={FILE_FIELD_MAP.lampiranWniTambahan.accept}
                    onChange={pickFile('lampiranWniTambahan')}
                  />
                  {files.lampiranWniTambahan ? <div className="rk-picked">{files.lampiranWniTambahan.name}</div> : null}
                  <div className="rk-note">
                    Untuk WNI keturunan Tionghoa agar melampirkan fotocopy Akta Kelahiran dan fotocopy Surat Keterangan
                    Warga Negara Indonesia (WNI).
                  </div>
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

