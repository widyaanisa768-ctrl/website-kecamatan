import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiPhone, FiUploadCloud, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import './AktaKelahiranForm.css'
import { getAuth, mergeDokumenMeta } from '../../lib/rkLocal'
import { createPengajuan } from '../../services/pengajuanService'

const INITIAL = {
  nama_pemohon: '',
  alamat: '',
  nik: '',
  no_hp: '',
}

const INITIAL_FILES = {
  suratLahir: null,
  ktpOrtu: null,
  kk: null,
  suratNikah: null,
  surat_rekomendasi_lurah: null,
  aktaOrtuTionghoa: null,
}

function normalizeData(data) {
  const base = data && typeof data === 'object' ? data : {}
  return {
    nama_pemohon: base.nama_pemohon ?? base.nama ?? '',
    alamat: base.alamat ?? '',
    nik: base.nik ?? '',
    no_hp: base.no_hp ?? base.noHp ?? '',
  }
}

export default function AktaKelahiranForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const requiredFiles = useMemo(() => ['suratLahir', 'ktpOrtu', 'kk', 'suratNikah', 'surat_rekomendasi_lurah'], [])

  useEffect(() => {
    setNotice('')
  }, [])

  const validators = useMemo(
    () => ({
      nama_pemohon: (v) => (v.trim() ? '' : 'Nama pemohon wajib diisi.'),
      alamat: (v) => (v.trim() ? '' : 'Alamat wajib diisi.'),
      nik: (v) => {
        if (!v.trim()) return 'NIK wajib diisi.'
        if (!/^\d+$/.test(v)) return 'NIK hanya boleh angka.'
        return ''
      },
      no_hp: (v) => {
        if (!v.trim()) return 'No HP wajib diisi.'
        if (!/^\d+$/.test(v)) return 'No HP hanya boleh angka.'
        return ''
      },
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
      if (picked) {
        const { [key]: _removed, ...rest } = prev
        return rest
      }
      return prev
    })
  }

  const validate = () => {
    const nextErrors = {}
    for (const key of Object.keys(INITIAL)) {
      const msg = validators[key]?.(form[key]) || ''
      if (msg) nextErrors[key] = msg
    }
    for (const key of requiredFiles) {
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
      layanan: 'Rekomendasi Akta Kelahiran',
      layananPath: '/layanan/akta-kelahiran',
      data: { ...form },
      dokumen: {
        suratKeteranganLahir: files.suratLahir,
        ktpKeduaOrangTua: files.ktpOrtu,
        kk: files.kk,
        suratNikah: files.suratNikah,
        surat_rekomendasi_lurah: files.surat_rekomendasi_lurah,
        aktaKelahiranOrangTuaWniTionghoa: files.aktaOrtuTionghoa,
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
        const keteranganPemohon = `Nama: ${form.nama_pemohon} • NIK: ${form.nik} • HP: ${form.no_hp}`
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuan({
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_pemohon,
          nik: form.nik,
          email: '',
          no_hp: form.no_hp,
          alamat: form.alamat,
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
    <div className="rk-portal rk-formPage rk-formAkta">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Akta Kelahiran">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Akta Kelahiran</h1>
            <p className="rk-formSubtitle">Lengkapi data pemohon dan unggah dokumen persyaratan.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form akta kelahiran">
          <div className="rk-container">
            <form className="rk-formCard" onSubmit={onSubmit}>
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
                  <div className="rk-formCardDesc">Upload dokumen wajib, kecuali yang berlabel opsional.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="suratLahir">
                    Fotocopy Surat Keterangan Lahir (Bidan/Dokter) <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratLahir"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('suratLahir')}
                  />
                  {files.suratLahir ? <div className="rk-picked">{files.suratLahir.name}</div> : null}
                  {errors.suratLahir ? <div className="rk-error">{errors.suratLahir}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktpOrtu">
                    Fotocopy KTP Kedua Orang Tua <span className="rk-required">*</span>
                  </label>
                  <input
                    id="ktpOrtu"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('ktpOrtu')}
                  />
                  {files.ktpOrtu ? <div className="rk-picked">{files.ktpOrtu.name}</div> : null}
                  {errors.ktpOrtu ? <div className="rk-error">{errors.ktpOrtu}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="kk">
                    Fotocopy KK <span className="rk-required">*</span>
                  </label>
                  <input id="kk" className="rk-file" type="file" accept="image/*,.pdf" onChange={pickFile('kk')} />
                  {files.kk ? <div className="rk-picked">{files.kk.name}</div> : null}
                  {errors.kk ? <div className="rk-error">{errors.kk}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="suratNikah">
                    Fotocopy Surat Nikah <span className="rk-required">*</span>
                  </label>
                  <input
                    id="suratNikah"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('suratNikah')}
                  />
                  {files.suratNikah ? <div className="rk-picked">{files.suratNikah.name}</div> : null}
                  {errors.suratNikah ? <div className="rk-error">{errors.suratNikah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="surat_rekomendasi_lurah">
                    Surat Rekomendasi Lurah / Penghulu <span className="rk-required">*</span>
                  </label>
                  <input
                    id="surat_rekomendasi_lurah"
                    name="surat_rekomendasi_lurah"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('surat_rekomendasi_lurah')}
                  />
                  {files.surat_rekomendasi_lurah ? <div className="rk-picked">{files.surat_rekomendasi_lurah.name}</div> : null}
                  {errors.surat_rekomendasi_lurah ? <div className="rk-error">{errors.surat_rekomendasi_lurah}</div> : null}
                </div>

                <div className="rk-docField rk-span2">
                  <label className="rk-label" htmlFor="aktaOrtuTionghoa">
                    Untuk WNI keturunan Tionghoa melampirkan fotocopy Akta Kelahiran Orang Tua{' '}
                    <span className="rk-optional">Opsional</span>
                  </label>
                  <input
                    id="aktaOrtuTionghoa"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('aktaOrtuTionghoa')}
                  />
                  {files.aktaOrtuTionghoa ? <div className="rk-picked">{files.aktaOrtuTionghoa.name}</div> : null}
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

