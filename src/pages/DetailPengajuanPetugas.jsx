import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanDokumen,
  getPengajuanId,
  getPengajuanKeterangan,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanNikPemohon,
  getPengajuanStatusKind,
  getPengajuanUsernamePemohon,
  getSemuaPengajuanPetugas,
  normalizePengajuanStatus,
  updatePengajuan,
} from '../services/pengajuanService'
import '../styles/petugas-ui.css'

const STATUS_OPTIONS = ['Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak']
const SURAT_HASIL_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const SURAT_HASIL_EXTENSIONS = ['pdf', 'doc', 'docx']

function formatTanggalID(date) {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function getStatusClass(status) {
  const kind = getPengajuanStatusKind(status)
  if (kind === 'menunggu') return 'ptg-badge ptg-badge--waiting'
  if (kind === 'diproses') return 'ptg-badge ptg-badge--process'
  if (kind === 'selesai') return 'ptg-badge ptg-badge--done'
  if (kind === 'ditolak') return 'ptg-badge ptg-badge--reject'
  return 'ptg-badge'
}

function getInitials(name) {
  const parts = String(name || 'Petugas').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function getLampiranExt(filename) {
  const clean = String(filename || '').split('?')[0]
  if (!clean.includes('.')) return '-'
  return clean.split('.').pop().slice(0, 5).toUpperCase()
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim())
}

function humanizeKey(key) {
  return String(key || 'Lampiran')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function filenameFromUrl(url) {
  try {
    const parsed = new URL(url)
    const name = parsed.pathname.split('/').filter(Boolean).pop()
    return name ? decodeURIComponent(name) : url
  } catch {
    return String(url || '')
  }
}

function readLampiranValue(meta, fallbackLabel) {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const url =
      meta.url ||
      meta.secure_url ||
      meta.href ||
      meta.path ||
      meta.file_url ||
      meta.dokumen_url ||
      meta.lampiran_url ||
      ''
    const filename =
      meta.name ||
      meta.nama ||
      meta.filename ||
      meta.file_name ||
      meta.originalname ||
      meta.public_id ||
      (url ? filenameFromUrl(url) : fallbackLabel)
    return { filename, url: isUrl(url) ? url : '' }
  }

  if (typeof meta === 'string') {
    return {
      filename: isUrl(meta) ? filenameFromUrl(meta) : meta,
      url: isUrl(meta) ? meta : '',
    }
  }

  return { filename: fallbackLabel, url: '' }
}

function normalizeLampiran(item) {
  const docs = getPengajuanDokumen(item)
  const entries = []

  const pushEntry = (label, meta) => {
    if (!meta) return
    const { filename, url } = readLampiranValue(meta, label)
    if (!filename && !url) return
    entries.push({
      id: `F${entries.length + 1}`,
      label: humanizeKey(label),
      filename: filename || filenameFromUrl(url),
      url,
      ext: getLampiranExt(filename || url),
    })
  }

  if (Array.isArray(docs)) {
    docs.forEach((meta, idx) => pushEntry(meta?.label || meta?.jenis || meta?.field || `Lampiran ${idx + 1}`, meta))
  } else {
    Object.entries(docs || {}).forEach(([key, meta]) => pushEntry(key, meta))
  }

  const knownFields = [
    'dokumen',
    'dokumen_url',
    'file_url',
    'ktp_mahasiswa',
    'ktm_mahasiswa',
    'surat_rekomendasi_riset_univ_kesbangpol',
    'fotocopy_ktp',
    'file',
    'lampiran',
  ]

  knownFields.forEach((key) => {
    const value = item?.[key]
    if (Array.isArray(value)) {
      value.forEach((meta, idx) => pushEntry(`${key} ${idx + 1}`, meta))
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([childKey, meta]) => pushEntry(childKey, meta))
    } else {
      pushEntry(key, value)
    }
  })

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${entry.label}|${entry.filename}|${entry.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function readSuratHasil(item) {
  const source =
    item?.dokumen_hasil ||
    item?.surat_hasil ||
    item?.file_hasil ||
    item?.hasil ||
    null

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return {
      nama: source.nama || source.name || source.filename || source.file_name || item?.nama_file_hasil || '',
      url: source.url || source.href || source.path || item?.url_hasil || item?.hasil_url || item?.file_url || '',
      file: null,
    }
  }

  const url = item?.url_hasil || item?.hasil_url || item?.file_url || (typeof source === 'string' ? source : '')
  return {
    nama: item?.nama_file_hasil || item?.nama_surat_hasil || '',
    url: url || '',
    file: null,
  }
}

function isAllowedSuratFile(file) {
  if (!file) return false
  const ext = String(file.name || '').split('.').pop()?.toLowerCase()
  return SURAT_HASIL_TYPES.includes(file.type) || SURAT_HASIL_EXTENSIONS.includes(ext)
}

function readUploadString(value) {
  const text = String(value || '').trim()
  if (!text) return { nama: '', url: '' }
  return {
    nama: isUrl(text) ? filenameFromUrl(text) : text,
    url: isUrl(text) ? text : '',
  }
}

function readSuratUploadResult(data, fallbackName) {
  if (typeof data === 'string') return { ...readUploadString(data), nama: readUploadString(data).nama || fallbackName }

  const base = data && typeof data === 'object' ? data : {}
  const inner = base.data && typeof base.data === 'object' ? base.data : base
  const sources = [
    inner,
    inner?.file_hasil,
    inner?.surat_hasil,
    inner?.dokumen_hasil,
    inner?.upload,
    inner?.file,
    inner?.result,
  ].filter(Boolean)

  let nama = ''
  let url = ''

  sources.some((source) => {
    if (typeof source === 'string') {
      const parsed = readUploadString(source)
      nama = nama || parsed.nama
      url = url || parsed.url
      return Boolean(nama || url)
    }

    if (source && typeof source === 'object' && !Array.isArray(source)) {
      url =
        source.url ||
        source.href ||
        source.path ||
        source.secure_url ||
        source.location ||
        source.file_url ||
        source.url_hasil ||
        source.hasil_url ||
        ''
      nama =
        source.nama_file_hasil ||
        source.nama_file ||
        source.nama ||
        source.name ||
        source.filename ||
        source.file_name ||
        source.originalname ||
        (url ? filenameFromUrl(url) : '')
      return Boolean(nama || url)
    }

    return false
  })

  return {
    nama: String(nama || fallbackName || '').trim(),
    url: String(url || '').trim(),
  }
}

export default function DetailPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  const today = useMemo(() => new Date(), [])
  const initialSubmission = location.state?.submission || null
  const submissionId = params?.id || getPengajuanId(initialSubmission)
  const stateEndpoint = location.state?.endpoint || initialSubmission?.__endpoint || ''

  const [auth, setAuthState] = useState(() => getAuth())
  const [submission, setSubmission] = useState(initialSubmission)
  const [statusBaru, setStatusBaru] = useState(() => normalizePengajuanStatus(initialSubmission || 'Menunggu Verifikasi'))
  const [catatanPetugas, setCatatanPetugas] = useState(() => getPengajuanCatatanPetugas(initialSubmission))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingSurat, setSavingSurat] = useState(false)
  const [suratForm, setSuratForm] = useState(() => readSuratHasil(initialSubmission))
  const [toast, setToast] = useState(null)
  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      setLoading(true)
      const res = await getSemuaPengajuanPetugas()
      if (!alive) return
      if (!res?.success) {
        setError(res?.message || 'Gagal memuat detail pengajuan.')
        setLoading(false)
        return
      }

      const items = res.items || []
      const found =
        items.find((item) => getPengajuanId(item) === String(submissionId) && (!stateEndpoint || item.__endpoint === stateEndpoint)) ||
        items.find((item) => getPengajuanId(item) === String(submissionId))

      if (!found) {
        setSubmission(null)
        setError('Detail pengajuan tidak ditemukan.')
      } else {
        setSubmission(found)
        setStatusBaru(normalizePengajuanStatus(found))
        setCatatanPetugas(getPengajuanCatatanPetugas(found))
        setSuratForm(readSuratHasil(found))
        setError('')
      }
      setLoading(false)
    }

    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      alive = false
      window.removeEventListener('focus', refresh)
    }
  }, [stateEndpoint, submissionId])

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuth())
    syncAuth()
    window.addEventListener('focus', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('rk-auth-updated', syncAuth)
    return () => {
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('rk-auth-updated', syncAuth)
    }
  }, [])

  function showToast(message, type = 'info') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  const pengajuanId = getPengajuanId(submission) || submissionId || ''
  const endpoint = submission?.__endpoint || stateEndpoint || ''
  const lampiran = useMemo(() => normalizeLampiran(submission), [submission])

  async function simpanStatus(nextStatus = statusBaru, successMessage = 'Perubahan berhasil disimpan.') {
    if (!submission) return
    if (!endpoint || !pengajuanId) {
      showToast('Endpoint atau ID pengajuan tidak valid.', 'danger')
      return
    }

    const normalized = normalizePengajuanStatus(nextStatus)
    if (normalized === 'Ditolak' && !String(catatanPetugas || '').trim()) {
      showToast('Catatan Petugas wajib diisi saat status Ditolak.', 'danger')
      return
    }

    setSaving(true)
    const payload = {
      status: normalized,
      status_pengajuan: normalized,
      catatan_petugas: catatanPetugas,
      catatanPetugas,
    }
    const res = await updatePengajuan(endpoint, pengajuanId, payload)
    setSaving(false)

    if (!res?.success) {
      showToast(res?.message || 'Gagal menyimpan perubahan.', 'danger')
      return
    }

    setStatusBaru(normalized)
    setSubmission((prev) => ({
      ...(prev || {}),
      status: normalized,
      status_pengajuan: normalized,
      catatan_petugas: catatanPetugas,
      catatanPetugas,
    }))
    showToast(successMessage, 'success')
  }

  function simpanPerubahan() {
    simpanStatus(statusBaru)
  }

  function handleSuratFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAllowedSuratFile(file)) {
      showToast('Format surat hasil harus PDF, DOC, atau DOCX.', 'danger')
      e.target.value = ''
      return
    }

    setSuratForm((prev) => ({
      ...prev,
      file,
      nama: file.name,
      url: '',
    }))
  }

  async function simpanSuratHasil() {
    if (!submission) return
    if (!endpoint || !pengajuanId) {
      showToast('Endpoint atau ID pengajuan tidak valid.', 'danger')
      return
    }

    const file = suratForm.file
    if (!file) {
      showToast('Pilih file surat hasil terlebih dahulu.', 'danger')
      return
    }

    setSavingSurat(true)
    const formData = new FormData()
    formData.append('file_hasil', file)
    formData.append('nama_file_hasil', file.name)

    const res = await updatePengajuan(endpoint, pengajuanId, formData)

    if (!res?.success) {
      setSavingSurat(false)
      showToast(res?.message || 'Gagal menyimpan surat hasil.', 'danger')
      return
    }

    const uploaded = readSuratUploadResult(res.data, file.name)
    const dokumenHasil = { nama_file: uploaded.nama, url: uploaded.url }
    const metadataPayload = {
      file_hasil: uploaded.url || uploaded.nama,
      surat_hasil: dokumenHasil,
      url_hasil: uploaded.url,
      dokumen_hasil: dokumenHasil,
      nama_file_hasil: uploaded.nama,
    }
    const metadataRes = await updatePengajuan(endpoint, pengajuanId, metadataPayload)
    setSavingSurat(false)

    if (!metadataRes?.success) {
      showToast(metadataRes?.message || 'Surat terunggah, tetapi metadata surat hasil gagal disimpan.', 'danger')
      return
    }

    setSubmission((prev) => ({
      ...(prev || {}),
      ...metadataPayload,
    }))
    setSuratForm({ nama: uploaded.nama, url: uploaded.url, file: null })
    showToast('Surat hasil berhasil disimpan.', 'success')
  }

  return (
    <div className="ptg-page">
      {toast ? (
        <div className={`ptg-toast ptg-toast--${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="ptg-toastTop">
            <span className="ptg-toastDot" aria-hidden="true" />
            <div className="ptg-toastMsg">{toast.message}</div>
          </div>
        </div>
      ) : null}

      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Daftar Pengajuan" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Detail Pengajuan</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarSearch" aria-label="Ringkasan pengajuan">
              <div className="ptg-search" style={{ background: 'rgba(255,255,255,.88)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input value={pengajuanId ? `Nomor: ${pengajuanId}` : 'Nomor: -'} readOnly aria-label="Nomor pengajuan" />
              </div>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
              <div className="ptg-profile" aria-label="Profil petugas">
                <div className="ptg-profileMeta">
                  <strong>{auth?.name || auth?.nama || 'Petugas'}</strong>
                  <span>{auth?.jabatan || 'Petugas Pelayanan Terpadu'}</span>
                </div>
                <div className="ptg-avatar" title={auth?.unit || 'Kantor Camat Rantau Kopar'} aria-hidden="true">
                  {avatar ? <img src={avatar} alt="" /> : getInitials(auth?.name || auth?.nama)}
                </div>
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              <section className="ptg-card ptg-section" aria-label="Header detail pengajuan">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Ringkasan</h2>
                  <div className="ptg-actionsRow">
                    <button type="button" className="ptg-btn" onClick={() => navigate('/petugas/pengajuan')}>
                      Kembali
                    </button>
                  </div>
                </div>
                <div className="ptg-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <div className="ptg-subtle">
                    Nomor: <strong className="ptg-mono">{pengajuanId || '-'}</strong>
                  </div>
                  <div>{statusBaru ? <span className={getStatusClass(statusBaru)}>{statusBaru}</span> : null}</div>
                </div>
              </section>

              {loading || error ? (
                <section className="ptg-card ptg-section" aria-label="Status detail pengajuan">
                  <div className="ptg-empty">{loading ? 'Memuat detail pengajuan...' : error}</div>
                </section>
              ) : null}

              <div className="ptg-gridTwo">
                <div className="ptg-stack">
                  <section className="ptg-card ptg-section" aria-label="Informasi pemohon">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Informasi Pemohon</h2>
                      <div className="ptg-subtle">Data identitas</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <dl className="ptg-kv">
                        <dt>Nama</dt>
                        <dd>{getPengajuanNamaPemohon(submission)}</dd>

                        <dt>NIK</dt>
                        <dd className="ptg-mono">{getPengajuanNikPemohon(submission)}</dd>

                        <dt>Username</dt>
                        <dd className="ptg-mono">{getPengajuanUsernamePemohon(submission)}</dd>
                      </dl>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Informasi pengajuan">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Informasi Pengajuan</h2>
                      <div className="ptg-subtle">Nomor & layanan</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <dl className="ptg-kv">
                        <dt>Nomor Pengajuan</dt>
                        <dd className="ptg-mono">{pengajuanId || '-'}</dd>

                        <dt>Jenis Layanan</dt>
                        <dd>{getPengajuanLayanan(submission)}</dd>

                        <dt>Tanggal Pengajuan</dt>
                        <dd>{formatTanggalID(getPengajuanCreatedAt(submission))}</dd>

                        <dt>Keterangan Pemohon</dt>
                        <dd style={{ fontWeight: 750, color: 'var(--ptg-muted)' }}>{getPengajuanKeterangan(submission)}</dd>

                        <dt>Catatan Petugas</dt>
                        <dd style={{ fontWeight: 850 }}>{catatanPetugas || '-'}</dd>
                      </dl>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Lampiran pengajuan">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Lampiran</h2>
                      <div className="ptg-subtle">Nama file lampiran</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <div className="ptg-attachments">
                        {lampiran.length === 0 ? (
                          <div className="ptg-hint">Tidak ada lampiran.</div>
                        ) : (
                          lampiran.map((file) => (
                            <div key={file.id} className="ptg-file">
                              <div className="ptg-fileIcon" aria-hidden="true">
                                {file.ext}
                              </div>
                              <div className="ptg-fileMeta">
                                <strong>{file.label}</strong>
                                <span title={file.filename}>{file.filename}</span>
                                {!file.url ? <em>Tersedia</em> : null}
                              </div>
                              {file.url ? (
                                <a className="ptg-btn ptg-fileAction" href={file.url} target="_blank" rel="noreferrer">
                                  Buka Lampiran
                                </a>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                      <p className="ptg-hint" style={{ marginTop: 10 }}>
                        Lampiran ditampilkan sesuai data yang dikirim backend.
                      </p>
                    </div>
                  </section>
                </div>

                <aside className="ptg-stack" aria-label="Panel aksi petugas">
                  <section className="ptg-card ptg-section" aria-label="Aksi petugas">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Aksi Petugas</h2>
                      <div className="ptg-subtle">Ubah status & catatan</div>
                    </div>
                    <div className="ptg-divider" />

                    <div style={{ marginTop: 12 }} className="ptg-stack">
                      <div className="ptg-field">
                        <div className="ptg-label">Ubah Status</div>
                        <select
                          className="ptg-select"
                          value={statusBaru}
                          onChange={(e) => setStatusBaru(e.target.value)}
                          aria-label="Ubah status pengajuan"
                          disabled={!submission || saving}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="ptg-field">
                        <div className="ptg-label">Catatan Petugas</div>
                        <textarea
                          className="ptg-textarea"
                          value={catatanPetugas}
                          onChange={(e) => setCatatanPetugas(e.target.value)}
                          placeholder={
                            statusBaru === 'Ditolak'
                              ? 'Wajib diisi untuk menjelaskan alasan penolakan atau kekurangan berkas.'
                              : 'Tulis catatan verifikasi, tindak lanjut, atau kekurangan berkas...'
                          }
                          aria-label="Catatan petugas"
                          disabled={!submission || saving}
                        />
                        {statusBaru === 'Ditolak' ? (
                          <div className="ptg-hint" style={{ marginTop: 8 }}>
                            Catatan wajib diisi saat status pengajuan Ditolak.
                          </div>
                        ) : null}
                      </div>

                      <div className="ptg-actionRow">
                        <button type="button" className="ptg-btn ptg-btnPrimary" onClick={simpanPerubahan} disabled={!submission || saving}>
                          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                      </div>

                      <p className="ptg-hint" style={{ margin: 0 }}>
                        Perubahan status dikirim ke endpoint layanan pengajuan.
                      </p>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Surat hasil atau dokumen final">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Surat Hasil / Dokumen Final</h2>
                      <div className="ptg-subtle">Field sementara backend</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }} className="ptg-stack">
                      <div className="ptg-field">
                        <div className="ptg-label">Upload Surat Hasil</div>
                        <input
                          className="ptg-input ptg-fileInput"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleSuratFileChange}
                          disabled={!submission || savingSurat}
                        />
                      </div>
                      {suratForm.nama ? (
                        <div className="ptg-uploadSummary">
                          <div>
                            <strong>{suratForm.nama}</strong>
                            <span>{suratForm.file ? 'Siap diunggah' : 'Tersimpan sebagai surat hasil'}</span>
                          </div>
                          {suratForm.url ? (
                            <a className="ptg-btn ptg-fileAction" href={suratForm.url} target="_blank" rel="noreferrer">
                              Buka Surat
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="ptg-actionRow">
                        <button
                          type="button"
                          className="ptg-btn ptg-btnPrimary"
                          onClick={simpanSuratHasil}
                          disabled={!submission || savingSurat}
                        >
                          {savingSurat ? 'Menyimpan...' : 'Simpan Surat Hasil'}
                        </button>
                      </div>
                      <p className="ptg-hint" style={{ margin: 0 }}>
                        Unggah file PDF, DOC, atau DOCX. Hasil upload disimpan sebagai file_hasil, surat_hasil, url_hasil, dokumen_hasil,
                        dan nama_file_hasil agar bisa dibaca di Status Pengajuan masyarakat.
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
