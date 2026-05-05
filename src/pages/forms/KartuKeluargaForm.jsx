import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiFileText, FiPhone, FiUploadCloud, FiUser } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import './KartuKeluargaForm.css'
import { STATUS, createSubmission, getAuth, getSubmissionById, mergeDokumenMeta, updateSubmission } from '../../lib/rkLocal'

const INITIAL = {
  nama_pemohon: '',
  alamat: '',
  nik: '',
  no_hp: '',
}

const INITIAL_FILES = {
  suratKeteranganRt: null,
  pengantarLurah: null,
  suratNikah: null,
  kk: null,
  lampiranWniTambahan: null,
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

export default function KartuKeluargaForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit') || ''

  const [form, setForm] = useState(INITIAL)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [editing, setEditing] = useState(null)

  const requiredFiles = useMemo(() => ['suratKeteranganRt', 'pengantarLurah', 'suratNikah', 'kk'], [])

  useEffect(() => {
    if (!editId) return
    const auth = getAuth()
    const sub = getSubmissionById(editId)
    if (!auth || auth.role !== 'masyarakat' || !sub || sub?.pemohon?.username !== auth.username) {
      alert('Pengajuan tidak ditemukan.')
      navigate('/dashboard', { replace: true })
      return
    }
    if (sub.status !== STATUS.MENUNGGU && sub.status !== STATUS.DITOLAK && sub.status !== STATUS.PERLU_PERBAIKAN) {
      alert('Pengajuan tidak dapat diedit karena sudah diverifikasi petugas.')
      navigate('/dashboard', { replace: true })
      return
    }
    setEditing(sub)
    const data = sub.data && typeof sub.data === 'object' ? sub.data : null
    if (data) setForm((prev) => ({ ...prev, ...normalizeData(data) }))
  }, [editId, navigate])

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
      const hasOld =
        (key === 'suratKeteranganRt' && !!editing?.dokumen?.suratKeteranganRt?.name) ||
        (key === 'pengantarLurah' && !!editing?.dokumen?.pengantarLurahPenghulu?.name) ||
        (key === 'suratNikah' && !!editing?.dokumen?.fotocopySuratNikah?.name) ||
        (key === 'kk' && !!editing?.dokumen?.fotocopyDanAsliKk?.name)
      if (!hasNew && !hasOld) nextErrors[key] = 'Wajib diunggah.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      layanan: 'Rekomendasi Kartu Keluarga',
      layananPath: '/layanan/kartu-keluarga',
      data: { ...form },
      dokumen: {
        suratKeteranganRt: files.suratKeteranganRt,
        pengantarLurahPenghulu: files.pengantarLurah,
        fotocopySuratNikah: files.suratNikah,
        fotocopyDanAsliKk: files.kk,
        lampiranTambahanWniKeturunanTionghoa: files.lampiranWniTambahan,
      },
    }

    try {
      const keteranganPemohon = `Nama: ${form.nama_pemohon} • NIK: ${form.nik} • HP: ${form.no_hp}`
      if (editing) {
        const nextStatus =
          editing.status === STATUS.DITOLAK || editing.status === STATUS.PERLU_PERBAIKAN ? STATUS.MENUNGGU : editing.status
        const next = updateSubmission(editing.id, {
          layanan: payload.layanan,
          layananPath: payload.layananPath,
          data: payload.data,
          keteranganPemohon,
          dokumen: mergeDokumenMeta(editing.dokumen, payload.dokumen),
          status: nextStatus,
          catatanPetugas: nextStatus === STATUS.MENUNGGU ? '' : editing.catatanPetugas,
        })
        if (!next) throw new Error('update_failed')
      } else {
        createSubmission({
          layanan: payload.layanan,
          layananPath: payload.layananPath,
          data: payload.data,
          keteranganPemohon,
          dokumen: payload.dokumen,
        })
      }

      alert('Pengajuan berhasil dikirim.')
      setForm(INITIAL)
      setFiles(INITIAL_FILES)
      setErrors({})
      navigate('/dashboard')
    } catch {
      alert('Silakan login sebagai masyarakat terlebih dahulu.')
      navigate('/login', { replace: true })
    }
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
                    accept="image/*,.pdf"
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
                    accept="image/*,.pdf"
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
                    accept="image/*,.pdf"
                    onChange={pickFile('suratNikah')}
                  />
                  {files.suratNikah ? <div className="rk-picked">{files.suratNikah.name}</div> : null}
                  {errors.suratNikah ? <div className="rk-error">{errors.suratNikah}</div> : null}
                </div>

                <div className="rk-docField">
                  <label className="rk-label" htmlFor="kk">
                    Fotocopy dan Asli Kartu Keluarga <span className="rk-required">*</span>
                  </label>
                  <input id="kk" className="rk-file" type="file" accept="image/*,.pdf" onChange={pickFile('kk')} />
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
                    accept="image/*,.pdf"
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
                <button type="submit" className="rk-submitBtn">
                  Kirim <FiArrowRight aria-hidden="true" />
                </button>
                <div className="rk-formHint" aria-label="Keterangan">
                  <FiCheckCircle aria-hidden="true" /> Bertanda <span className="rk-required">*</span> wajib diisi.
                </div>
              </div>

              <div className="rk-formFoot" aria-label="Catatan">
                <FiFileText aria-hidden="true" /> Pengajuan ini bersifat dummy (belum terhubung backend).
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
