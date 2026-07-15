import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiLoader } from 'react-icons/fi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PetugasAvatar from '../components/PetugasAvatar'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  deleteSuratHasilPengajuan,
  getDetailPengajuan,
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanKeterangan,
  getPengajuanLayanan,
  getPengajuanStatusKind,
  getPengajuanUpdatedAt,
  getSemuaPengajuanPetugas,
  normalizePengajuan,
  normalizePengajuanStatus,
  updateStatusPengajuanPetugas,
  uploadSuratHasilPengajuan,
} from '../services/pengajuanService'
import { normalizePengajuanDokumenPersyaratan } from '../lib/pengajuanDokumenView'
import '../styles/petugas-ui.css'

const STATUS_OPTIONS = ['Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak']
const SURAT_HASIL_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]
const SURAT_HASIL_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png']
const SURAT_HASIL_MAX_SIZE = 5 * 1024 * 1024
const SURAT_HASIL_INPUT_ID = 'ptg-upload-surat-hasil'
const HIDDEN_DETAIL_DATA_KEYS = new Set([
  '__endpoint',
  'created_by',
  'created_at',
  'createdat',
  'updated_at',
  'updatedat',
  'created',
  'tanggal_pengajuan',
  'tanggalpengajuan',
  'tanggal_update',
  'tanggalupdate',
  'tanggal_verifikasi',
  'tanggalverifikasi',
  'verified_at',
  'verifiedat',
  'verification_date',
  'verificationdate',
  'id_pengajuan',
  'status',
  'status_pengajuan',
  'statuspengajuan',
  'id',
  '_id',
  'uuid',
  'pengajuan_id',
  'jenis_layanan',
  'layanan',
  'layanan_path',
  'layananpath',
  'service',
  'service_key',
  'servicekey',
  'title',
  'endpoint',
  'user_id',
  'userid',
  'id_user',
  'pemohon_id',
  'masyarakat_id',
  'dokumen',
  'dokumen_meta',
  'dokumenmeta',
  'data_form',
  'dataform',
  'data',
  'file_hasil',
  'file_surat_hasil',
  'filesurathasil',
  'nama_file_surat_hasil',
  'namafilesurathasil',
  'nama_surat_hasil',
  'dokumen_hasil',
  'surat_hasil',
  'url_hasil',
  'hasil_url',
  'file_url',
  'hasil_surat',
  'hasilsurat',
  'catatan_petugas',
  'catatanpetugas',
  'alasan_penolakan',
  'alasanpenolakan',
  'keterangan',
])
const DETAIL_LABEL_OVERRIDES = {
  no_hp: 'Nomor HP',
  nomor_hp: 'Nomor HP',
  nik: 'NIK',
  nik_pemohon: 'NIK Pemohon',
  nik_pewaris: 'NIK Pewaris',
  nama_pemohon: 'Nama Pemohon',
  nama_pewaris: 'Nama Pewaris',
  nama_peneliti: 'Nama Peneliti',
  alamat: 'Alamat',
  alamat_pemohon: 'Alamat Pemohon',
  alamat_pewaris: 'Alamat Pewaris',
  alamat_asal: 'Alamat Asal',
  alamat_pindah: 'Alamat Pindah',
  alamat_lembaga: 'Alamat Lembaga',
  jenis_layanan: 'Jenis Layanan',
}

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

function formatTanggalWaktuID(date) {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

function getLampiranExt(filename) {
  const clean = String(filename || '').split('?')[0]
  if (!clean.includes('.')) return '-'
  return clean.split('.').pop().slice(0, 5).toUpperCase()
}

function humanizeDetailKey(key) {
  const normalized = String(key || '').trim().toLowerCase()
  if (DETAIL_LABEL_OVERRIDES[normalized]) return DETAIL_LABEL_OVERRIDES[normalized]
  return normalized
    .replace(/^__/, '')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDetailValue(value) {
  if (Array.isArray(value)) return value.map(formatDetailValue).join(', ')
  if (value && typeof value === 'object') {
    if (value.name) return String(value.name)
    return Object.entries(value)
      .map(([key, nested]) => `${humanizeDetailKey(key)}: ${formatDetailValue(nested)}`)
      .join(', ')
  }
  return String(value)
}

function getDetailFormSource(item) {
  if (item?.data_form && typeof item.data_form === 'object' && !Array.isArray(item.data_form)) {
    return item.data_form
  }
  if (item?.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
    return item.data
  }
  return item && typeof item === 'object' ? item : {}
}

function readSuratHasil(item) {
  const suratHasil = normalizePengajuan(item).suratHasil
  return {
    nama: suratHasil.namaFile || '',
    url: suratHasil.url || '',
    file: null,
  }
}

function hasUploadedSuratHasil(item, suratForm) {
  const saved = readSuratHasil(item)
  const draft = suratForm || {}
  return Boolean(saved?.url || saved?.nama || (draft?.nama && !draft?.file) || (draft?.url && !draft?.file))
}

function isAllowedSuratFile(file) {
  if (!file) return false
  const ext = String(file.name || '').split('.').pop()?.toLowerCase()
  return SURAT_HASIL_TYPES.includes(file.type) || SURAT_HASIL_EXTENSIONS.includes(ext)
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
  const [deletingSurat, setDeletingSurat] = useState(false)
  const [suratForm, setSuratForm] = useState(() => readSuratHasil(initialSubmission))
  const [dokumenPersyaratan, setDokumenPersyaratan] = useState([])
  const [documentsReady, setDocumentsReady] = useState(false)
  const [toast, setToast] = useState(null)
  const detailRequestRef = useRef(0)
  const hasSubmission = Boolean(submission)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [submissionId])

  useEffect(() => {
    setDokumenPersyaratan([])
    setDocumentsReady(false)
  }, [submissionId, stateEndpoint])

  const hydrateDocuments = useCallback((item) => {
    const normalized = normalizePengajuanDokumenPersyaratan(item)
    setDokumenPersyaratan(normalized)
    setDocumentsReady(true)
    return normalized
  }, [])

  const refreshDetail = useCallback(async () => {
    const requestId = detailRequestRef.current + 1
    detailRequestRef.current = requestId
    let nextSubmission = null
    const isMatchingInitialSubmission =
      initialSubmission && getPengajuanId(initialSubmission) === String(submissionId) && (!stateEndpoint || initialSubmission?.__endpoint === stateEndpoint)
    const fallbackSubmission = isMatchingInitialSubmission ? initialSubmission : null

    setLoading(true)
    setError('')
    setSubmission((current) => current || fallbackSubmission)

    try {
      if (submissionId && stateEndpoint) {
        const directDetail = await getDetailPengajuan(submissionId, {
          ...(fallbackSubmission || {}),
          __endpoint: stateEndpoint,
        })
        if (detailRequestRef.current !== requestId) return null
        if (directDetail?.success && directDetail?.data) nextSubmission = directDetail.data
      }

      if (!nextSubmission) {
        const res = await getSemuaPengajuanPetugas()
        if (detailRequestRef.current !== requestId) return null

        if (!res?.success) {
          setError(res?.message || 'Gagal memuat detail pengajuan.')
          return null
        }

        const items = res.items || []
        const found =
          items.find((item) => getPengajuanId(item) === String(submissionId) && (!stateEndpoint || item.__endpoint === stateEndpoint)) ||
          items.find((item) => getPengajuanId(item) === String(submissionId)) ||
          fallbackSubmission

        if (!found) {
          setError('Detail pengajuan tidak ditemukan.')
          return null
        }

        const detailRes = submissionId ? await getDetailPengajuan(submissionId, found) : null
        if (detailRequestRef.current !== requestId) return null
        nextSubmission = detailRes?.success && detailRes?.data ? detailRes.data : found
      }

      hydrateDocuments(nextSubmission)
      setSubmission(nextSubmission)
      setStatusBaru(normalizePengajuanStatus(nextSubmission))
      setCatatanPetugas(getPengajuanCatatanPetugas(nextSubmission))
      setSuratForm(readSuratHasil(nextSubmission))
      setError('')
      return nextSubmission
    } catch (err) {
      if (detailRequestRef.current !== requestId) return null
      setError(err?.message || 'Gagal memuat detail pengajuan.')
      return null
    } finally {
      if (detailRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [hydrateDocuments, initialSubmission, stateEndpoint, submissionId])

  useEffect(() => {
    void refreshDetail()
    return () => {
      detailRequestRef.current += 1
    }
  }, [refreshDetail])

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
  const suratHasilTersedia = hasUploadedSuratHasil(submission, suratForm)
  const suratBaruDipilih = Boolean(suratForm.file)
  const tampilkanTombolUploadSurat = !suratHasilTersedia || suratBaruDipilih
  const backendStatus = normalizePengajuanStatus(submission)
  const layananPengajuan = getPengajuanLayanan(submission)
  const documentsLoading = !documentsReady && loading && !submission
  const dataFormEntries = useMemo(() => {
    if (!submission || typeof submission !== 'object') return []
    const source = getDetailFormSource(submission)
    return Object.entries(source).filter(([key, value]) => {
      const normalizedKey = String(key || '').trim().toLowerCase()
      if (!normalizedKey || normalizedKey.startsWith('__') || HIDDEN_DETAIL_DATA_KEYS.has(normalizedKey)) return false
      if (normalizedKey.includes('file') || normalizedKey.includes('dokumen') || normalizedKey.includes('hasil')) return false
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && !value.trim()) return false
      if (source === submission && typeof value === 'object') return false
      return true
    })
  }, [submission])

  async function simpanStatus(nextStatus = statusBaru) {
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

    if (normalized === 'Selesai' && !suratHasilTersedia) {
      showToast('Upload surat hasil terlebih dahulu sebelum menyelesaikan pengajuan.', 'danger')
      return
    }

    setSaving(true)
    const res = await updateStatusPengajuanPetugas(endpoint, pengajuanId, normalized, catatanPetugas)

    if (!res?.success) {
      setSaving(false)
      console.error('Gagal memperbarui status pengajuan petugas:', {
        endpoint,
        pengajuanId,
        status: normalized,
        catatan_petugas: catatanPetugas,
        response: res,
      })
      showToast(res?.message || 'Gagal menyimpan perubahan.', 'danger')
      return
    }

    const refreshedSubmission = await refreshDetail()
    setSaving(false)
    if (!refreshedSubmission) {
      console.error('Status berhasil diubah, tetapi detail terbaru gagal dimuat ulang.', { endpoint, pengajuanId })
    }
    showToast(res?.message || 'Perubahan berhasil disimpan.', 'success')
  }

  function simpanPerubahan() {
    simpanStatus(statusBaru)
  }

  function handleSuratFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAllowedSuratFile(file)) {
      setSuratForm(readSuratHasil(submission))
      showToast('Format file tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.', 'danger')
      e.target.value = ''
      return
    }

    if (file.size > SURAT_HASIL_MAX_SIZE) {
      setSuratForm(readSuratHasil(submission))
      showToast('Ukuran file terlalu besar. Maksimal ukuran file 5 MB.', 'danger')
      e.target.value = ''
      return
    }

    setSuratForm((prev) => ({
      ...prev,
      file,
      nama: file.name,
      url: prev?.url || '',
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
    const res = await uploadSuratHasilPengajuan(endpoint, pengajuanId, file)

    if (!res?.success) {
      setSavingSurat(false)
      const message = res?.errors?.length ? res.errors.join('\n') : res?.message || 'Gagal upload surat hasil'
      console.error('Gagal upload surat hasil:', {
        endpoint,
        pengajuanId,
        response: res,
      })
      showToast(message, 'danger')
      return
    }

    const refreshedSubmission = await refreshDetail()
    setSavingSurat(false)
    if (!refreshedSubmission) {
      console.error('Surat berhasil diunggah, tetapi detail terbaru gagal dimuat ulang.', { endpoint, pengajuanId })
    }
    showToast(res?.message || 'Surat hasil berhasil diunggah', 'success')
  }

  function lihatSuratHasil() {
    if (!suratForm.url) return
    window.open(suratForm.url, '_blank', 'noopener,noreferrer')
  }

  async function hapusSuratHasil() {
    if (!submission || !suratHasilTersedia || deletingSurat) return
    if (!window.confirm('Hapus surat hasil yang tersimpan?')) return

    setDeletingSurat(true)
    const res = await deleteSuratHasilPengajuan(endpoint, pengajuanId)
    if (!res?.success) {
      setDeletingSurat(false)
      console.error('Gagal menghapus surat hasil:', { endpoint, pengajuanId, response: res })
      showToast(res?.message || 'Gagal menghapus surat hasil.', 'danger')
      return
    }

    const refreshedSubmission = await refreshDetail()
    setDeletingSurat(false)
    if (!refreshedSubmission) {
      console.error('Surat berhasil dihapus, tetapi detail terbaru gagal dimuat ulang.', { endpoint, pengajuanId })
    }
    showToast(res?.message || 'Surat hasil berhasil dihapus.', 'success')
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

            <div className="ptg-detailHeaderMeta" aria-label="Ringkasan pengajuan">
              <div className="ptg-detailNumberPill">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Nomor: <strong className="ptg-mono">{pengajuanId || '-'}</strong></span>
              </div>
              <button type="button" className="ptg-btn ptg-backBtn" onClick={() => navigate('/petugas/pengajuan')}>
                <FiArrowLeft aria-hidden="true" />
                Kembali
              </button>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
              <div className="ptg-profile" aria-label="Profil petugas">
                <div className="ptg-profileMeta">
                  <strong>{auth?.name || auth?.nama || 'Petugas'}</strong>
                  <span>{auth?.jabatan || 'Petugas Pelayanan Terpadu'}</span>
                </div>
                <PetugasAvatar
                  key={auth?.avatar || auth?.foto || auth?.photo || auth?.avatar_url || auth?.foto_profil || auth?.profile_photo || auth?.username || auth?.name || 'fallback'}
                  user={auth}
                  title={auth?.unit || 'Kantor Camat Rantau Kopar'}
                />
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              {loading && !hasSubmission ? (
                <section className="ptg-card ptg-section" aria-label="Status detail pengajuan">
                  <div className="ptg-empty">Memuat detail pengajuan...</div>
                </section>
              ) : null}

              {!loading && error && !hasSubmission ? (
                <section className="ptg-card ptg-section" aria-label="Status detail pengajuan">
                  <div className="ptg-empty" style={{ display: 'grid', gap: 12 }}>
                    <div>{error}</div>
                    <div className="ptg-actionRow">
                      <button type="button" className="ptg-btn" onClick={() => navigate('/petugas/pengajuan')}>
                        Kembali
                      </button>
                      <button type="button" className="ptg-btn ptg-btnPrimary" onClick={() => void refreshDetail()}>
                        Muat Ulang
                      </button>
                    </div>
                  </div>
                </section>
              ) : null}

              {hasSubmission ? (
                <div className="ptg-gridTwo">
                <div className="ptg-stack">
                  <section className="ptg-card ptg-section" aria-label="Data formulir pemohon">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Data Formulir Pemohon</h2>
                      <div className="ptg-subtle">Field sesuai jenis layanan</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      {dataFormEntries.length === 0 ? (
                        <div className="ptg-hint">Data formulir pemohon belum tersedia untuk pengajuan ini.</div>
                      ) : (
                        <dl className="ptg-kv">
                          {dataFormEntries.map(([key, value]) => (
                            <div key={key} style={{ display: 'contents' }}>
                              <dt>{humanizeDetailKey(key)}</dt>
                              <dd>{formatDetailValue(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
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
                        <dd>{layananPengajuan}</dd>

                        <dt>Status Pengajuan</dt>
                        <dd>{backendStatus ? <span className={getStatusClass(backendStatus)}>{backendStatus}</span> : '-'}</dd>

                        <dt>Tanggal Pengajuan</dt>
                        <dd>{formatTanggalWaktuID(getPengajuanCreatedAt(submission))}</dd>

                        <dt>Terakhir Diperbarui</dt>
                        <dd>{formatTanggalWaktuID(getPengajuanUpdatedAt(submission))}</dd>

                        <dt>Keterangan Pemohon</dt>
                        <dd style={{ fontWeight: 750, color: 'var(--ptg-muted)' }}>{getPengajuanKeterangan(submission)}</dd>

                        <dt>Catatan Petugas</dt>
                        <dd style={{ fontWeight: 850 }}>{catatanPetugas || '-'}</dd>
                      </dl>
                    </div>
                  </section>

                  {documentsReady ? (
                    <section className="ptg-card ptg-section" aria-label="Dokumen persyaratan dari masyarakat">
                      <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                        <h2>Dokumen Persyaratan dari Masyarakat</h2>
                        <div className="ptg-subtle">Dokumen dari masyarakat sesuai jenis layanan</div>
                      </div>
                      <div className="ptg-divider" />
                      <div style={{ marginTop: 12 }}>
                        <div className="ptg-attachments">
                          {dokumenPersyaratan.length === 0 ? (
                            <div className="ptg-hint">Dokumen persyaratan belum tersedia untuk layanan ini.</div>
                          ) : (
                            dokumenPersyaratan.map((file) => (
                              <div key={file.id} className="ptg-file">
                                <div className="ptg-fileIcon" aria-hidden="true">
                                  {getLampiranExt(file.filename || file.url)}
                                </div>
                                <div className="ptg-fileMeta">
                                  <strong>{file.label}</strong>
                                  <span title={file.filename}>{file.filename}</span>
                                  <em className={file.uploaded ? 'isUploaded' : 'isPending'}>
                                    {file.uploaded ? 'Sudah diunggah' : 'Belum diunggah'}
                                  </em>
                                </div>
                                {file.uploaded && file.url ? (
                                  <a className="ptg-btn ptg-fileAction" href={file.url} target="_blank" rel="noreferrer">
                                    Lihat Dokumen
                                  </a>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </section>
                  ) : documentsLoading ? (
                    <section className="ptg-card ptg-section" aria-label="Dokumen persyaratan dari masyarakat">
                      <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                        <h2>Dokumen Persyaratan dari Masyarakat</h2>
                        <div className="ptg-subtle">Dokumen dari masyarakat sesuai jenis layanan</div>
                      </div>
                      <div className="ptg-divider" />
                      <div style={{ marginTop: 12 }}>
                        <div className="ptg-docLoadingPanel" role="status" aria-live="polite">
                          <FiLoader className="ptg-docLoadingSpinner ptg-spin" aria-hidden="true" />
                          <div>
                            <strong>Memuat dokumen persyaratan...</strong>
                            <p>Menyiapkan daftar dokumen dari backend.</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}
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
                        Gunakan status Menunggu Verifikasi, Diproses, Selesai, atau Ditolak sesuai hasil pemeriksaan petugas.
                      </p>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Surat hasil atau dokumen final">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Upload Surat Hasil</h2>
                      <div className="ptg-subtle">Dokumen final untuk masyarakat</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }} className="ptg-stack">
                      <p className="ptg-hint" style={{ margin: 0 }}>
                        Unggah surat hasil yang sudah diverifikasi agar dapat dilihat dan diunduh oleh masyarakat.
                      </p>

                      <div className="ptg-uploadInfo" role="note">
                        Format: PDF, JPG, JPEG, PNG <span aria-hidden="true">&bull;</span> Maksimal 5 MB
                      </div>

                      <div className="ptg-statusPanel">
                        <strong>{suratHasilTersedia ? 'Surat hasil sudah diunggah' : 'Belum ada surat hasil'}</strong>
                        {suratForm.nama ? (
                          <span>{suratBaruDipilih && suratHasilTersedia ? `File baru: ${suratForm.nama}` : suratForm.nama}</span>
                        ) : null}
                      </div>

                      {suratHasilTersedia && backendStatus !== 'Selesai' ? (
                        <div className="ptg-hint" role="status">
                          Surat hasil tersimpan, tetapi status belum Selesai. Silakan ubah status menjadi Selesai lalu simpan.
                        </div>
                      ) : null}

                      <div className="ptg-field">
                        <input
                          id={SURAT_HASIL_INPUT_ID}
                          className="ptg-hiddenInput"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={handleSuratFileChange}
                          disabled={!submission || savingSurat}
                        />
                        <div className="ptg-actionRow">
                          {suratForm.url ? (
                            <button type="button" className="ptg-btn ptg-fileAction btn-lihat-surat" onClick={lihatSuratHasil}>
                              Lihat Surat
                            </button>
                          ) : null}
                          <label htmlFor={SURAT_HASIL_INPUT_ID} className="ptg-btn ptg-btnLabel btn-ganti-surat">
                            {suratHasilTersedia ? 'Ganti Surat' : 'Pilih Surat'}
                          </label>
                          {suratHasilTersedia ? (
                            <button
                              type="button"
                              className="ptg-btn btn-hapus-surat"
                              onClick={() => void hapusSuratHasil()}
                              disabled={savingSurat || deletingSurat}
                            >
                              {deletingSurat ? 'Menghapus...' : 'Hapus Surat'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {tampilkanTombolUploadSurat ? (
                        <div className="ptg-actionRow">
                          <button
                            type="button"
                            className="ptg-btn ptg-btnPrimary"
                            onClick={simpanSuratHasil}
                            disabled={!submission || savingSurat || deletingSurat || !suratForm.file}
                          >
                            {savingSurat ? 'Mengunggah...' : suratHasilTersedia ? 'Upload Surat Baru' : 'Upload Surat Hasil'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </aside>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
