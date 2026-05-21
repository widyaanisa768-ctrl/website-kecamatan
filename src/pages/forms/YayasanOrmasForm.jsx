import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiUploadCloud, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import './YayasanOrmasForm.css'
import { getAuth, mergeDokumenMeta } from '../../lib/rkLocal'
import { createPengajuan } from '../../services/pengajuanService'

const INITIAL = {
  nama_pemohon: '',
  nik: '',
  jabatan: '',
  nama_lembaga: '',
  alamat_lembaga: '',
}

const INITIAL_FILES = {
  rekomLurah: null,
  daftarGuruPengurus: null,
  daftarAnakDidik: null,
  fotoDokumentasi: null,
  ktpPengurus: null,
  aktaNotaris: null,
}

function normalizeData(data) {
  const base = data && typeof data === 'object' ? data : {}
  return {
    nama_pemohon: base.nama_pemohon ?? base.nama ?? '',
    nik: base.nik ?? '',
    jabatan: base.jabatan ?? '',
    nama_lembaga: base.nama_lembaga ?? base.namaLembaga ?? '',
    alamat_lembaga: base.alamat_lembaga ?? base.alamatLembaga ?? '',
  }
}

export default function YayasanOrmasForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const requiredFiles = useMemo(() => Object.keys(INITIAL_FILES), [])

  useEffect(() => {
    setNotice('')
  }, [])

  const validators = useMemo(
    () => ({
      nama_pemohon: (v) => (v.trim() ? '' : 'Nama pemohon wajib diisi.'),
      nik: (v) => {
        if (!v.trim()) return 'NIK wajib diisi.'
        if (!/^\d+$/.test(v)) return 'NIK hanya boleh angka.'
        return ''
      },
      jabatan: (v) => (v.trim() ? '' : 'Jabatan wajib diisi.'),
      nama_lembaga: (v) => (v.trim() ? '' : 'Nama lembaga wajib diisi.'),
      alamat_lembaga: (v) => (v.trim() ? '' : 'Alamat lembaga wajib diisi.'),
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
      layanan: 'Rekomendasi Yayasan, Sekolah, TPQ dan Ormas',
      layananPath: '/layanan/yayasan-ormas',
      data: { ...form },
      dokumen: {
        rekomendasiLurahPenghuluAsli: files.rekomLurah,
        daftarNamaGuruPengurus: files.daftarGuruPengurus,
        daftarNamaAnakDidik: files.daftarAnakDidik,
        fotoDokumentasiGedungAtauMusyawarah: files.fotoDokumentasi,
        fotocopyKtpPengurus: files.ktpPengurus,
        aktaNotarisPendirian: files.aktaNotaris,
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
        const keteranganPemohon = `Lembaga: ${form.nama_lembaga} • Pemohon: ${form.nama_pemohon} • Jabatan: ${form.jabatan}`
        const dokumen_meta = mergeDokumenMeta({}, payload.dokumen)

        const res = await createPengajuan({
          jenis_layanan: payload.layanan,
          nama_pemohon: form.nama_pemohon,
          nik: form.nik,
          email: '',
          no_hp: '',
          alamat: form.alamat_lembaga,
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
    <div className="rk-portal rk-formPage rk-formYayasan">
      <Navbar />

      <main>
        <header className="rk-formHeader" aria-label="Rekomendasi Yayasan, Sekolah, TPQ dan Ormas">
          <div className="rk-container rk-formHeaderInner">
            <p className="rk-formKicker">Form Layanan</p>
            <h1 className="rk-formTitle">Rekomendasi Yayasan, Sekolah, TPQ dan Ormas</h1>
            <p className="rk-formSubtitle">Lengkapi data pemohon dan unggah dokumen persyaratan.</p>
          </div>
        </header>

        <section className="rk-formSection" aria-label="Form yayasan atau ormas">
          <div className="rk-container">
            <form className="rk-formCard" onSubmit={onSubmit}>
              <div className="rk-formCardHead">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUser />
                </div>
                <div>
                  <div className="rk-formCardTitle">Data Pemohon & Lembaga</div>
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

                <div className="rk-field">
                  <label className="rk-label" htmlFor="jabatan">
                    Jabatan <span className="rk-required">*</span>
                  </label>
                  <input
                    id="jabatan"
                    name="jabatan"
                    className="rk-input"
                    value={form.jabatan}
                    onChange={setField('jabatan')}
                    placeholder="Contoh: Ketua / Sekretaris"
                    required
                  />
                  {errors.jabatan ? <div className="rk-error">{errors.jabatan}</div> : null}
                </div>

                <div className="rk-field">
                  <label className="rk-label" htmlFor="nama_lembaga">
                    Nama Lembaga <span className="rk-required">*</span>
                  </label>
                  <input
                    id="nama_lembaga"
                    name="nama_lembaga"
                    className="rk-input"
                    value={form.nama_lembaga}
                    onChange={setField('nama_lembaga')}
                    placeholder="Nama yayasan / sekolah / TPQ / ormas"
                    required
                  />
                  {errors.nama_lembaga ? <div className="rk-error">{errors.nama_lembaga}</div> : null}
                </div>

                <div className="rk-field rk-span2">
                  <label className="rk-label" htmlFor="alamat_lembaga">
                    Alamat Lembaga <span className="rk-required">*</span>
                  </label>
                  <textarea
                    id="alamat_lembaga"
                    name="alamat_lembaga"
                    className="rk-textarea"
                    value={form.alamat_lembaga}
                    onChange={setField('alamat_lembaga')}
                    placeholder="Alamat lengkap lembaga"
                    rows={3}
                    required
                  />
                  {errors.alamat_lembaga ? <div className="rk-error">{errors.alamat_lembaga}</div> : null}
                </div>
              </div>

              <div className="rk-divider" />

              <div className="rk-formCardHead isDocs">
                <div className="rk-formCardIcon" aria-hidden="true">
                  <FiUploadCloud />
                </div>
                <div>
                  <div className="rk-formCardTitle">Upload Dokumen</div>
                  <div className="rk-formCardDesc">Semua dokumen wajib diunggah.</div>
                </div>
              </div>

              <div className="rk-docGrid">
                <div className="rk-docField">
                  <label className="rk-label" htmlFor="rekomLurah">
                    Rekomendasi dari Lurah / Penghulu (asli) <span className="rk-required">*</span>
                  </label>
                  <input
                    id="rekomLurah"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('rekomLurah')}
                  />
                  {files.rekomLurah ? <div className="rk-picked">{files.rekomLurah.name}</div> : null}
                  {errors.rekomLurah ? <div className="rk-error">{errors.rekomLurah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="daftarGuruPengurus">
                    Daftar Nama Guru / Pengurus <span className="rk-required">*</span>
                  </label>
                  <input
                    id="daftarGuruPengurus"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('daftarGuruPengurus')}
                  />
                  {files.daftarGuruPengurus ? <div className="rk-picked">{files.daftarGuruPengurus.name}</div> : null}
                  {errors.daftarGuruPengurus ? <div className="rk-error">{errors.daftarGuruPengurus}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="daftarAnakDidik">
                    Daftar Nama Anak Didik <span className="rk-required">*</span>
                  </label>
                  <input
                    id="daftarAnakDidik"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('daftarAnakDidik')}
                  />
                  {files.daftarAnakDidik ? <div className="rk-picked">{files.daftarAnakDidik.name}</div> : null}
                  {errors.daftarAnakDidik ? <div className="rk-error">{errors.daftarAnakDidik}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="fotoDok">
                    Foto dokumentasi gedung / hasil musyawarah <span className="rk-required">*</span>
                  </label>
                  <input
                    id="fotoDok"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('fotoDokumentasi')}
                  />
                  {files.fotoDokumentasi ? <div className="rk-picked">{files.fotoDokumentasi.name}</div> : null}
                  {errors.fotoDokumentasi ? <div className="rk-error">{errors.fotoDokumentasi}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="ktpPengurus">
                    Fotocopy KTP Pengurus <span className="rk-required">*</span>
                  </label>
                  <input
                    id="ktpPengurus"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('ktpPengurus')}
                  />
                  {files.ktpPengurus ? <div className="rk-picked">{files.ktpPengurus.name}</div> : null}
                  {errors.ktpPengurus ? <div className="rk-error">{errors.ktpPengurus}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="aktaNotaris">
                    Akta Notaris Pendirian <span className="rk-required">*</span>
                  </label>
                  <input
                    id="aktaNotaris"
                    className="rk-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pickFile('aktaNotaris')}
                  />
                  {files.aktaNotaris ? <div className="rk-picked">{files.aktaNotaris.name}</div> : null}
                  {errors.aktaNotaris ? <div className="rk-error">{errors.aktaNotaris}</div> : null}
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

