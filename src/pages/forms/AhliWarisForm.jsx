import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiInfo, FiUploadCloud } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import './AhliWarisForm.css'
import { getAuth, mergeDokumenMeta } from '../../lib/rkLocal'
import { createPengajuan } from '../../services/pengajuanService'

const INITIAL = {
  nama_pewaris: '',
  nik_pewaris: '',
  alamat_pewaris: '',
  nama_pemohon: '',
  nik_pemohon: '',
  alamat_pemohon: '',
  no_hp: '',
}

const INITIAL_FILES = {
  ktp: null,
  kk: null,
  kematian: null,
  suratTanah: null,
}

function normalizeData(data) {
  const base = data && typeof data === 'object' ? data : {}
  return {
    nama_pewaris: base.nama_pewaris ?? '',
    nik_pewaris: base.nik_pewaris ?? '',
    alamat_pewaris: base.alamat_pewaris ?? '',
    nama_pemohon: base.nama_pemohon ?? base.nama ?? '',
    nik_pemohon: base.nik_pemohon ?? base.nik ?? '',
    alamat_pemohon: base.alamat_pemohon ?? base.alamat ?? '',
    no_hp: base.no_hp ?? base.noHp ?? '',
  }
}

export default function AhliWarisForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const validators = useMemo(
    () => ({
      nama_pewaris: (v) => (v.trim() ? '' : 'Nama pewaris wajib diisi.'),
      nik_pewaris: (v) => {
        if (!v.trim()) return 'NIK pewaris wajib diisi.'
        if (!/^\d+$/.test(v)) return 'NIK pewaris hanya boleh angka.'
        return ''
      },
      alamat_pewaris: (v) => (v.trim() ? '' : 'Alamat pewaris wajib diisi.'),
      nama_pemohon: (v) => (v.trim() ? '' : 'Nama pemohon wajib diisi.'),
      nik_pemohon: (v) => {
        if (!v.trim()) return 'NIK pemohon wajib diisi.'
        if (!/^\d+$/.test(v)) return 'NIK pemohon hanya boleh angka.'
        return ''
      },
      alamat_pemohon: (v) => (v.trim() ? '' : 'Alamat pemohon wajib diisi.'),
      no_hp: (v) => {
        if (!v.trim()) return 'No HP wajib diisi.'
        if (!/^\d+$/.test(v)) return 'No HP hanya boleh angka.'
        return ''
      },
    }),
    []
  )

  const requiredKeys = useMemo(() => ['ktp', 'kk', 'kematian'], [])

  useEffect(() => {
    setNotice('')
  }, [])

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

  const onPick = (key) => (e) => {
    const picked = e.target.files?.[0] ?? null
    setFiles((prev) => ({ ...prev, [key]: picked }))
    setErrors((prev) => {
      if (!prev[key]) return prev
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
    for (const key of requiredKeys) {
      const hasNew = !!files[key]
      if (!hasNew) nextErrors[key] = 'Wajib diunggah.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setNotice('')
    if (!validate()) return

    const payload = {
      layanan: 'Surat Keterangan Ahli Waris',
      layananPath: '/layanan/ahli-waris',
      data: { ...form },
      dokumen: {
        fotocopyKtp: files.ktp,
        fotocopyKkAhliWaris: files.kk,
        suratKeteranganKematian: files.kematian,
        fotocopySuratTanah: files.suratTanah,
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
        const keteranganPemohon = `Pewaris: ${form.nama_pewaris} • Pemohon: ${form.nama_pemohon} • NIK: ${form.nik_pemohon} • HP: ${form.no_hp}`
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuan({
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_pemohon,
          nik: form.nik_pemohon,
          email: '',
          no_hp: form.no_hp,
          alamat: form.alamat_pemohon,
          keterangan: keteranganPemohon,
          tanggal_pengajuan: new Date().toISOString(),
          dokumen_meta,
          data_form: payload.data,
          layanan_path: payload.layananPath,
        })

        if (!res?.success) {
          setNotice(res?.message || 'Gagal mengirim pengajuan.')
          return
        }

        setNotice(res?.message || 'Pengajuan berhasil dikirim.')
        window.setTimeout(() => navigate('/status-pengajuan', { replace: true }), 600)
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <div className="rk-portal rk-formPage">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Surat Keterangan Ahli Waris">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Surat Keterangan Ahli Waris</h1>
            <p className="rk-formSubtitle">Unggah dokumen persyaratan untuk pengajuan surat.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form upload dokumen">
          <div className="rk-container">
            <form className="rk-formCard" onSubmit={onSubmit}>
              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiFileText />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Pewaris</div>
                  <div className="rk-formCardDesc">Semua field wajib diisi.</div>
                </div>
              </div>

              <div className="rk-grid">
                <div className="rk-field">
                  <label className="rk-label" htmlFor="nama_pewaris">
                    Nama Pewaris <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nama_pewaris"
                    name="nama_pewaris"
                    className="rk-input"
                    value={form.nama_pewaris}
                    onChange={setField('nama_pewaris')}
                    placeholder="Nama pewaris"
                    required
                  />
                  {errors.nama_pewaris ? <div className="rk-error">{errors.nama_pewaris}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="nik_pewaris">
                    NIK Pewaris <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nik_pewaris"
                    name="nik_pewaris"
                    className="rk-input"
                    inputMode="numeric"
                    value={form.nik_pewaris}
                    onChange={setField('nik_pewaris')}
                    placeholder="Hanya angka"
                    required
                  />
                  {errors.nik_pewaris ? <div className="rk-error">{errors.nik_pewaris}</div> : null}
                </div>

                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="alamat_pewaris">
                    Alamat Pewaris <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat_pewaris"
                    name="alamat_pewaris"
                    className="rk-textarea"
                    value={form.alamat_pewaris}
                    onChange={setField('alamat_pewaris')}
                    placeholder="Alamat pewaris"
                    rows={3}
                    required
                  />
                  {errors.alamat_pewaris ? <div className="rk-error">{errors.alamat_pewaris}</div> : null}
                </div>
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiFileText />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Pemohon</div>
                  <div className="rk-formCardDesc">Semua field wajib diisi.</div>
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
                    placeholder="Nama pemohon"
                    required
                  />
                  {errors.nama_pemohon ? <div className="rk-error">{errors.nama_pemohon}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="nik_pemohon">
                    NIK Pemohon <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nik_pemohon"
                    name="nik_pemohon"
                    className="rk-input"
                    inputMode="numeric"
                    value={form.nik_pemohon}
                    onChange={setField('nik_pemohon')}
                    placeholder="Hanya angka"
                    required
                  />
                  {errors.nik_pemohon ? <div className="rk-error">{errors.nik_pemohon}</div> : null}
                </div>

                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="alamat_pemohon">
                    Alamat Pemohon <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat_pemohon"
                    name="alamat_pemohon"
                    className="rk-textarea"
                    value={form.alamat_pemohon}
                    onChange={setField('alamat_pemohon')}
                    placeholder="Alamat pemohon"
                    rows={3}
                    required
                  />
                  {errors.alamat_pemohon ? <div className="rk-error">{errors.alamat_pemohon}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="no_hp">
                    No HP <span className="rk-required">*</span>
                  </label>
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
                  {errors.no_hp ? <div className="rk-error">{errors.no_hp}</div> : null}
                </div>
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUploadCloud />
                </div>
                <div>
                  <div className="rk-formCardTitle">Upload Dokumen</div>
                  <div className="rk-formCardDesc">Pastikan dokumen terbaca jelas (scan/foto).</div>
                </div>
              </div>

              <div className="rk-fields">
                <div className="rk-field">
                  <label className="rk-label" htmlFor="ktp">
                    Fotocopy KTP <span className="rk-required">*</span>
                  </label>
                  <input id="ktp" className="rk-file" type="file" accept="image/*,.pdf" onChange={onPick('ktp')} />
                  {files.ktp ? <div className="rk-picked">{files.ktp.name}</div> : null}
                  {errors.ktp ? <div className="rk-error">{errors.ktp}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="kk">
                    Fotocopy KK Ahli Waris <span className="rk-required">*</span>
                  </label>
                  <input id="kk" className="rk-file" type="file" accept="image/*,.pdf" onChange={onPick('kk')} />
                  {files.kk ? <div className="rk-picked">{files.kk.name}</div> : null}
                  {errors.kk ? <div className="rk-error">{errors.kk}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="kematian">
                    Surat Keterangan Kematian (Kelurahan/Kepenghuluan) <span className="rk-required">*</span>
                  </label>
                  <input
                    id="kematian"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onPick('kematian')}
                  />
                  {files.kematian ? <div className="rk-picked">{files.kematian.name}</div> : null}
                  {errors.kematian ? <div className="rk-error">{errors.kematian}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="suratTanah">
                    Fotocopy Surat Tanah (SKGR/SKT/Sertifikat) <span className="rk-optional">Opsional</span>
                  </label>
                  <input
                    id="suratTanah"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onPick('suratTanah')}
                  />
                  {files.suratTanah ? <div className="rk-picked">{files.suratTanah.name}</div> : null}
                </div>
              </div>

              <div className="rk-help" aria-label="Bantuan">
                <div className="rk-helpIcon" aria-hidden="true">
                  <FiInfo />
                </div>
                <div className="rk-helpText">
                  Bagi pengurusan surat ahli waris yang berkaitan dengan tanah, harus melampirkan fotocopy surat tanah
                  (SKGR, SKT, dan sertifikat).
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

