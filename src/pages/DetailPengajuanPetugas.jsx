import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  getDetailPengajuan,
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanKeterangan,
  getPengajuanLayanan,
  getPengajuanStatusKind,
  getPengajuanUpdatedAt,
  getSemuaPengajuanPetugas,
  normalizePengajuanStatus,
  updatePengajuan,
  uploadSuratHasilPengajuan,
} from '../services/pengajuanService'
import { normalizePengajuanDokumenPersyaratan } from '../lib/pengajuanDokumenView'
import '../styles/petugas-ui.css'

const STATUS_OPTIONS = ['Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak']
const SURAT_HASIL_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const SURAT_HASIL_EXTENSIONS = ['pdf', 'doc', 'docx']
const SURAT_HASIL_INPUT_ID = 'ptg-upload-surat-hasil'
const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()
const HIDDEN_DOKUMEN_KEYS = new Set([
  'id',
  '_id',
  'id_pengajuan',
  'pengajuan_id',
  'id_user',
  'user_id',
  'created_at',
  'updated_at',
  'createdat',
  'updatedat',
  'created',
  'updated',
  'status',
  'status_pengajuan',
  'catatan_petugas',
  'catatanpetugas',
  'nama_pemohon',
  'nama_lengkap',
  'alamat',
  'no_hp',
  'nik',
  'email',
  'username',
  'layanan',
  'jenis_layanan',
  'keterangan',
])
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

function isFileLink(value) {
  const text = String(value || '').trim()
  return /^https?:\/\//i.test(text) || text.startsWith('/') || text.startsWith('uploads/')
}

function buildFileLink(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^https?:\/\//i.test(text)) return text
  if (!isFileLink(text) || !RAW_API_BASE_URL) return isFileLink(text) ? text : ''

  const base = RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
  const path = text.startsWith('/') ? text : `/${text}`
  return `${base}${path}`
}

function humanizeKey(key) {
  return String(key || 'Lampiran')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
    const rawUrl =
      meta.url ||
      meta.secure_url ||
      meta.href ||
      meta.path ||
      meta.file_url ||
      meta.dokumen_url ||
      meta.lampiran_url ||
      ''
    const url = buildFileLink(rawUrl)
    const filename =
      meta.name ||
      meta.nama ||
      meta.filename ||
      meta.file_name ||
      meta.originalname ||
      meta.public_id ||
      (rawUrl ? filenameFromUrl(rawUrl) : '')
    return { filename, url }
  }

  if (typeof meta === 'string') {
    return {
      filename: isFileLink(meta) ? filenameFromUrl(meta) : meta,
      url: buildFileLink(meta),
    }
  }

  return { filename: '', url: '' }
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
    Object.entries(docs || {}).forEach(([key, meta]) => {
      if (HIDDEN_DOKUMEN_KEYS.has(String(key || '').trim().toLowerCase())) return
      pushEntry(key, meta)
    })
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

function readMetaByKey(item, docs, key) {
  if (!key) return null
  if (docs && !Array.isArray(docs) && Object.prototype.hasOwnProperty.call(docs, key)) return docs[key]
  if (item && Object.prototype.hasOwnProperty.call(item, key)) return item[key]
  return null
}

function normalizeFallbackDokumenPersyaratan(item) {
  const docs = getPengajuanDokumen(item)
  const entries = []

  const pushEntry = (id, label, meta) => {
    const { filename, url } = readLampiranValue(meta, label)
    if (!filename && !url) return
    entries.push({
      id,
      label,
      filename: filename || filenameFromUrl(url) || 'Dokumen tersedia',
      url,
      uploaded: true,
      ext: getLampiranExt(filename || url),
    })
  }

  if (Array.isArray(docs)) {
    docs.forEach((meta, idx) => {
      const label = meta?.label || meta?.jenis || meta?.field || meta?.nama_dokumen || `Dokumen ${idx + 1}`
      pushEntry(`fallback-${idx}`, humanizeKey(label), meta)
    })
  } else if (docs && typeof docs === 'object') {
    Object.entries(docs).forEach(([key, meta]) => {
      const normalizedKey = String(key || '').trim().toLowerCase()
      if (HIDDEN_DOKUMEN_KEYS.has(normalizedKey)) return
      pushEntry(`fallback-${key}`, humanizeKey(key), meta)
    })
  }

  return entries
}

function normalizeDokumenPersyaratan(item, config) {
  if (!item) return []
  if (!config?.fields?.length) return normalizeFallbackDokumenPersyaratan(item)

  const docs = getPengajuanDokumen(item)
  const entries = []

  config.fields.forEach((field) => {
    const key = field.backendKey || field.key
    const meta = readMetaByKey(item, docs, key) ?? readMetaByKey(item, docs, field.key)

    const { filename, url } = readLampiranValue(meta, field.label)
    entries.push({
      id: key,
      label: field.label,
      filename: filename || filenameFromUrl(url) || 'Belum diunggah',
      url,
      uploaded: Boolean(filename || url),
      ext: getLampiranExt(filename || url),
    })
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
      nama: source.nama || source.name || source.filename || source.file_name || source.nama_file || item?.nama_file_hasil || '',
      url: buildFileLink(source.url || source.href || source.path || source.file_url || item?.url_hasil || item?.hasil_url || item?.file_url || ''),
      file: null,
    }
  }

  const url = item?.url_hasil || item?.hasil_url || item?.file_url || (typeof source === 'string' ? source : '')
  return {
    nama: item?.nama_file_hasil || item?.nama_surat_hasil || '',
    url: buildFileLink(url) || url || '',
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

function readUploadString(value) {
  const text = String(value || '').trim()
  if (!text) return { nama: '', url: '' }
  return {
    nama: isUrl(text) ? filenameFromUrl(text) : text,
    url: buildFileLink(text),
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
    url: buildFileLink(String(url || '').trim()) || String(url || '').trim(),
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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [submissionId])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      setLoading(true)
      try {
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
          items.find((item) => getPengajuanId(item) === String(submissionId)) ||
          initialSubmission

        if (!found) {
          setSubmission(null)
          setError('Detail pengajuan tidak ditemukan.')
          setLoading(false)
          return
        }

        const detailRes = submissionId ? await getDetailPengajuan(submissionId, found) : null
        if (!alive) return
        const finalSubmission = detailRes?.success ? detailRes.data || found : found

        setSubmission(finalSubmission)
        setStatusBaru(normalizePengajuanStatus(finalSubmission))
        setCatatanPetugas(getPengajuanCatatanPetugas(finalSubmission))
        setSuratForm(readSuratHasil(finalSubmission))
        setError('')
      } finally {
        if (alive) setLoading(false)
      }
    }

    refresh()
    return () => {
      alive = false
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
  const dokumenPersyaratan = useMemo(() => normalizePengajuanDokumenPersyaratan(submission), [submission])
  const suratHasilTersedia = hasUploadedSuratHasil(submission, suratForm)
  const layananPengajuan = getPengajuanLayanan(submission)
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

    if (normalized === 'Selesai' && !suratHasilTersedia) {
      showToast('Upload surat hasil terlebih dahulu sebelum menyelesaikan pengajuan.', 'danger')
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

    if (!res?.success) {
      setSaving(false)
      showToast(res?.message || 'Gagal menyimpan perubahan.', 'danger')
      return
    }

    const refreshedDetail = await getDetailPengajuan(pengajuanId, {
      ...(submission || {}),
      status: normalized,
      status_pengajuan: normalized,
      catatan_petugas: catatanPetugas,
      catatanPetugas,
    })

    const nextSubmission =
      refreshedDetail?.success && refreshedDetail?.data
        ? refreshedDetail.data
        : {
            ...(submission || {}),
            status: normalized,
            status_pengajuan: normalized,
            catatan_petugas: catatanPetugas,
            catatanPetugas,
          }

    setSaving(false)
    setStatusBaru(normalized)
    setSubmission(nextSubmission)
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
    let nextSubmission = null
    let backendErrorMessage = ''

    const refreshedAfterUpload = await getDetailPengajuan(pengajuanId, {
      ...(submission || {}),
      ...metadataPayload,
    })

    if (refreshedAfterUpload?.success && hasUploadedSuratHasil(refreshedAfterUpload.data, null)) {
      nextSubmission = refreshedAfterUpload.data
    } else {
      const metadataRes = await updatePengajuan(endpoint, pengajuanId, metadataPayload)
      if (!metadataRes?.success) {
        backendErrorMessage = metadataRes?.message || 'Surat terunggah, tetapi metadata surat hasil gagal disimpan.'
      } else {
        const refreshedAfterMetadata = await getDetailPengajuan(pengajuanId, {
          ...(submission || {}),
          ...metadataPayload,
        })
        if (refreshedAfterMetadata?.success) {
          nextSubmission = refreshedAfterMetadata.data
        }
      }
    }

    if (!nextSubmission && (uploaded.url || uploaded.nama)) {
      nextSubmission = {
        ...(submission || {}),
        ...metadataPayload,
      }
    }

    setSavingSurat(false)

    if (!nextSubmission || !hasUploadedSuratHasil(nextSubmission, null)) {
      showToast(
        backendErrorMessage || 'Upload surat hasil belum dapat diverifikasi dari response backend. Periksa contract endpoint upload surat hasil.',
        'danger'
      )
      return
    }

    setSubmission(nextSubmission)
    setSuratForm(readSuratHasil(nextSubmission))
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
              <section className="ptg-card ptg-section ptg-detailIntro" aria-label="Header detail pengajuan">
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
                        <dd>{statusBaru ? <span className={getStatusClass(statusBaru)}>{statusBaru}</span> : '-'}</dd>

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
                        Unggah surat rekomendasi yang sudah dibuat oleh petugas. File ini akan tampil di halaman status pengajuan masyarakat
                        dan dapat diunduh setelah pengajuan selesai.
                      </p>

                      <div className="ptg-statusPanel">
                        <strong>Status surat hasil</strong>
                        <span>{suratHasilTersedia ? 'Surat hasil sudah diunggah' : 'Belum ada surat hasil diunggah'}</span>
                      </div>

                      <div className="ptg-field">
                        <div className="ptg-label">File surat hasil</div>
                        <input
                          id={SURAT_HASIL_INPUT_ID}
                          className="ptg-hiddenInput"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleSuratFileChange}
                          disabled={!submission || savingSurat}
                        />
                        <div className="ptg-actionRow">
                          {suratForm.url ? (
                            <a className="ptg-btn ptg-fileAction" href={suratForm.url} target="_blank" rel="noreferrer">
                              Lihat Surat
                            </a>
                          ) : null}
                          <label htmlFor={SURAT_HASIL_INPUT_ID} className="ptg-btn ptg-btnLabel">
                            {suratHasilTersedia ? 'Ganti Surat' : 'Pilih Surat'}
                          </label>
                        </div>
                        <input
                          className="ptg-input"
                          type="text"
                          value={suratForm.nama || ''}
                          placeholder="Belum ada file surat hasil yang dipilih"
                          readOnly
                        />
                        <div className="ptg-hint">Format file yang diterima: PDF, DOC, atau DOCX.</div>
                      </div>
                      {suratForm.nama ? (
                        <div className="ptg-uploadSummary">
                          <div>
                            <strong>{suratForm.nama}</strong>
                            <span>{suratForm.file ? 'Siap diunggah sebagai surat hasil terbaru' : 'Tersimpan sebagai surat hasil'}</span>
                          </div>
                        </div>
                      ) : null}
                      <div className="ptg-actionRow">
                        <button
                          type="button"
                          className="ptg-btn ptg-btnPrimary"
                          onClick={simpanSuratHasil}
                          disabled={!submission || savingSurat || !suratForm.file}
                        >
                          {savingSurat ? 'Mengunggah...' : 'Upload Surat Hasil'}
                        </button>
                      </div>
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
