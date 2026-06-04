import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiEye,
  FiFileText,
  FiInfo,
  FiLoader,
  FiSave,
  FiShield,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { getAuth } from '../lib/rkLocal'
import {
  deletePengajuan,
  getDetailPengajuan,
  getPengajuanId,
  getPengajuanSaya,
  updatePengajuan,
} from '../services/pengajuanService'
import './PengajuanSaya.css'

function safeParse(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getStoredUser() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem('user'), null)
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('role') || ''
}

function getStoredToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('accessToken') || window.localStorage.getItem('token') || ''
}

function formatDateTime(date) {
  try {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function statusKind(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value.includes('tolak') || value.includes('perbaikan')) return 'reject'
  if (value.includes('selesai')) return 'done'
  if (value.includes('setuju') || value.includes('diterima')) return 'approve'
  if (value.includes('proses')) return 'process'
  if (value.includes('menunggu') || value.includes('verifikasi')) return 'waiting'
  return 'unknown'
}

function canManagePengajuan(status) {
  const value = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
  return value === 'menunggu' || value === 'menunggu verifikasi'
}

function statusLabel(status) {
  const kind = statusKind(status)
  if (kind === 'waiting') return 'Menunggu Verifikasi'
  if (kind === 'process') return 'Diproses'
  if (kind === 'approve') return 'Disetujui'
  if (kind === 'done') return 'Selesai'
  if (kind === 'reject') return 'Ditolak'
  return status || '-'
}

function badgeClass(status) {
  return `is-${statusKind(status)}`
}

function statusMessage(status) {
  const kind = statusKind(status)
  if (kind === 'waiting') return 'Pengajuan berhasil dikirim dan sedang menunggu verifikasi petugas.'
  if (kind === 'process') return 'Pengajuan sedang diproses oleh petugas.'
  if (kind === 'approve') return 'Pengajuan telah disetujui oleh petugas.'
  if (kind === 'done') return 'Dokumen sudah selesai dan dapat diunduh.'
  if (kind === 'reject') return 'Pengajuan ditolak atau perlu diperbaiki. Silakan periksa catatan petugas.'
  return ''
}

const HIDDEN_DATA_KEYS = new Set([
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
])

const LABEL_OVERRIDES = {
  no_hp: 'Nomor HP',
  nomor_hp: 'Nomor HP',
  nik: 'NIK',
  jenis_layanan: 'Jenis Layanan',
  nama_pemohon: 'Nama Pemohon',
  nama_peneliti: 'Nama Peneliti',
  lokasi_penelitian: 'Lokasi Penelitian',
  waktu_penelitian: 'Waktu Penelitian',
}

function humanizeLabel(key) {
  const normalized = String(key || '').trim().toLowerCase()
  if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized]
  return normalized
    .replace(/^__/, '')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatDataValue(value) {
  if (Array.isArray(value)) return value.map(formatDataValue).join(', ')
  if (value && typeof value === 'object') {
    if (value.name) return String(value.name)
    return Object.entries(value)
      .map(([key, nested]) => `${humanizeLabel(key)}: ${formatDataValue(nested)}`)
      .join(', ')
  }
  return String(value)
}

const RESULT_FILE_KEYS = [
  'file_hasil',
  'dokumen_hasil',
  'surat_hasil',
  'url_hasil',
  'hasil_url',
  'file_url',
  'hasilSurat',
  'hasil_surat',
]

function getResultFile(item) {
  if (!item || typeof item !== 'object') return null
  for (const key of RESULT_FILE_KEYS) {
    const value = item[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value && typeof value === 'object') {
      const url = value.url || value.href || value.path || value.download_url || value.file_url || ''
      if (String(url).trim() || value.content) return value
    }
  }
  return null
}

function triggerResultDownload(resultFile) {
  if (!resultFile) return
  let url = ''
  let revokeAfter = false
  let filename = ''

  if (typeof resultFile === 'string') {
    url = resultFile
  } else if (resultFile.content) {
    const blob = new Blob([resultFile.content], { type: resultFile.type || 'application/octet-stream' })
    url = URL.createObjectURL(blob)
    revokeAfter = true
    filename = resultFile.filename || resultFile.name || 'surat-hasil'
  } else {
    url = resultFile.url || resultFile.href || resultFile.path || resultFile.download_url || resultFile.file_url || ''
    filename = resultFile.filename || resultFile.name || ''
  }

  if (!url) return
  const a = document.createElement('a')
  a.href = url
  if (filename) a.download = filename
  if (/^https?:\/\//i.test(url)) {
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
  }
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (revokeAfter) URL.revokeObjectURL(url)
}

function getRejectReason(item) {
  return (
    item?.alasan_penolakan ||
    item?.alasanPenolakan ||
    item?.catatan_petugas ||
    item?.catatanPetugas ||
    item?.catatan ||
    item?.alasan ||
    ''
  )
}

function isSafeEditableEntry(key, value) {
  const normalizedKey = String(key || '').trim().toLowerCase()
  if (!normalizedKey || normalizedKey.startsWith('__') || HIDDEN_DATA_KEYS.has(normalizedKey)) return false
  if (/(^|_)(id|uuid)$/.test(normalizedKey)) return false
  if (normalizedKey.includes('file') || normalizedKey.includes('dokumen') || normalizedKey.includes('hasil')) return false
  return ['string', 'number', 'boolean'].includes(typeof value) || value === null
}

function getEditableSource(item) {
  if (item?.data_form && typeof item.data_form === 'object' && !Array.isArray(item.data_form)) {
    return { type: 'data_form', data: item.data_form }
  }
  if (item?.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
    return { type: 'data', data: item.data }
  }
  return { type: 'item', data: item || {} }
}

function inputTypeFor(key, value) {
  const normalizedKey = String(key || '').toLowerCase()
  if (typeof value === 'number') return 'number'
  if (normalizedKey.includes('email')) return 'email'
  if (normalizedKey === 'no_hp' || normalizedKey.includes('telepon')) return 'tel'
  if ((normalizedKey.includes('tanggal') || normalizedKey.includes('waktu')) && /^\d{4}-\d{2}-\d{2}/.test(String(value || ''))) {
    return 'date'
  }
  return 'text'
}

function isTextareaField(key) {
  const value = String(key || '').toLowerCase()
  return value.includes('alamat') || value.includes('keterangan') || value.includes('catatan') || value.includes('deskripsi')
}

export default function PengajuanSaya({ variant = 'default' } = {}) {
  const navigate = useNavigate()
  const auth = getAuth()
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editSourceType, setEditSourceType] = useState('item')
  const [loading, setLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const refreshItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPengajuanSaya()
      if (!res?.success) {
        setItems([])
        setError(res?.message || 'Gagal memuat pengajuan.')
        return false
      }
      setItems(res.items || [])
      return true
    } catch (err) {
      setItems([])
      setError(err?.message || 'Gagal memuat pengajuan.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = getStoredToken()
    const user = getStoredUser()
    if (!token || !user) {
      navigate('/login', { replace: true })
      return undefined
    }

    void refreshItems()
    window.addEventListener('focus', refreshItems)
    window.addEventListener('storage', refreshItems)
    return () => {
      window.removeEventListener('focus', refreshItems)
      window.removeEventListener('storage', refreshItems)
    }
  }, [navigate, refreshItems])

  useEffect(() => {
    if (!notice) return undefined
    const timeoutId = window.setTimeout(() => setNotice(null), 4500)
    return () => window.clearTimeout(timeoutId)
  }, [notice])

  function getLayanan(item) {
    return item?.jenis_layanan || item?.layanan || item?.service || item?.title || '-'
  }

  function getNama(item) {
    const layanan = String(getLayanan(item) || '')
    const isPenelitian =
      item?.__endpoint === '/rekomendasi_penelitian' || layanan.toLowerCase().includes('penelitian') || layanan.toLowerCase().includes('riset')

    const data = item?.data_form && typeof item.data_form === 'object' ? item.data_form : item?.data && typeof item.data === 'object' ? item.data : {}

    const pick = (key) => item?.[key] || data?.[key] || ''

    if (isPenelitian) {
      const namaPeneliti = pick('nama_peneliti')
      if (String(namaPeneliti).trim()) return String(namaPeneliti)
    }

    const orderedKeys = ['nama_pemohon', 'nama_peneliti', 'nama_lengkap', 'nama', 'nama_pengaju', 'pemohon']
    for (const key of orderedKeys) {
      const v = pick(key)
      if (String(v).trim()) return String(v)
    }
    return '-'
  }

  function getCreatedAt(item) {
    return item?.createdAt || item?.created_at || item?.tanggal_pengajuan || item?.tanggalPengajuan || item?.created || null
  }

  function getUpdatedAt(item) {
    return item?.updatedAt || item?.updated_at || item?.tanggal_update || item?.tanggalUpdate || null
  }

  function getStatus(item) {
    return item?.status || item?.status_pengajuan || item?.statusPengajuan || ''
  }

  const visibleItems = useMemo(() => {
    const list = Array.isArray(items) ? items : []

    const storedUser = getStoredUser()
    const storedRole = storedUser?.role || getStoredRole() || ''
    const role = String(auth?.role || storedRole || '').toLowerCase()

    const privileged = role === 'petugas' || role === 'admin' || role === 'kepala_camat'
    if (privileged) return list

    if (role !== 'masyarakat') return list

    const userId = String(storedUser?.id || storedUser?.user_id || storedUser?.id_user || storedUser?._id || '').trim()

    const getOwnerId = (it) => {
      const direct =
        it?.user_id ||
        it?.id_user ||
        it?.pemohon_id ||
        it?.masyarakat_id ||
        it?.masyarakatId ||
        it?.userId ||
        it?.idUser ||
        it?.created_by ||
        it?.createdBy ||
        it?.pemohon?.pemohon_id ||
        it?.pemohon?.id ||
        it?.pemohon?.user_id ||
        it?.pemohon?.id_user ||
        it?.pemohon?._id ||
        it?.user?.id ||
        it?.user?.user_id ||
        it?.user?.id_user ||
        it?.user?._id ||
        it?.masyarakat?.id ||
        it?.masyarakat?._id ||
        it?.masyarakat?.user_id ||
        it?.masyarakat?.id_user ||
        ''
      return direct ? String(direct).trim() : ''
    }

    const hasOwnerField = list.some((it) => !!getOwnerId(it))
    if (!hasOwnerField) {
      // TODO: Backend belum mengirim field owner per item (user_id/id_user/pemohon_id/created_by/masyarakat_id).
      // Sesuai instruksi: jangan filter dulu, tampilkan data dan beri peringatan.
      if (import.meta.env.DEV) console.warn('[status-pengajuan] owner field tidak ditemukan pada item; skip filter untuk masyarakat.')
      return list
    }

    if (!userId) {
      if (import.meta.env.DEV) console.warn('[status-pengajuan] user id tidak ditemukan di localStorage.user; skip filter untuk masyarakat.')
      return list
    }

    const filtered = list.filter((it) => getOwnerId(it) === userId)

    if (import.meta.env.DEV) {
      const sample = list[0]
      console.log('[status-pengajuan] user login:', storedUser)
      console.log('[status-pengajuan] contoh item pertama:', sample)
      console.log('[status-pengajuan] jumlah sebelum filter:', list.length)
      console.log('[status-pengajuan] jumlah setelah filter:', filtered.length)
      if (filtered.length === 0 && list.length > 0) {
        const ownerSamples = list
          .map((it) => getOwnerId(it))
          .filter(Boolean)
          .slice(0, 8)
        console.warn('[status-pengajuan] hasil filter 0. userId=', userId, 'contoh ownerId item=', ownerSamples)
      }
    }

    return filtered
  }, [items, auth?.role])

  const counts = useMemo(() => {
    const list = Array.isArray(visibleItems) ? visibleItems : []
    return {
      total: list.length,
      menunggu: list.filter((it) => statusKind(getStatus(it)) === 'waiting').length,
      diproses: list.filter((it) => statusKind(getStatus(it)) === 'process').length,
      selesai: list.filter((it) => ['done', 'approve'].includes(statusKind(getStatus(it)))).length,
    }
  }, [visibleItems])

  const activeStatus = getStatus(active)
  const activeKind = statusKind(activeStatus)
  const activeCanManage = canManagePengajuan(activeStatus)
  const activeResultFile = getResultFile(active)
  const activeCanDownload = ['done', 'approve'].includes(activeKind) && !!activeResultFile
  const activeRejectReason = getRejectReason(active)

  const dataEntries = useMemo(() => {
    if (!active || typeof active !== 'object') return []
    const data = active?.data_form || active?.data
    const source = data && typeof data === 'object' ? data : active
    return Object.entries(source).filter(([key, value]) => {
      const normalizedKey = String(key || '').toLowerCase()
      if (normalizedKey.startsWith('__') || HIDDEN_DATA_KEYS.has(normalizedKey)) return false
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && !value.trim()) return false
      if (source === active && typeof value === 'object') return false
      return true
    })
  }, [active])

  function close() {
    setActive(null)
  }

  function onDetail(item) {
    const id = getPengajuanId(item)
    if (!id) {
      setActive(item)
      return
    }

    void (async () => {
      try {
        const res = await getDetailPengajuan(id)
        if (res?.success) setActive(res.data || item)
        else setActive(item)
      } catch {
        setActive(item)
      }
    })()
  }

  function openEdit(item) {
    if (!canManagePengajuan(getStatus(item))) {
      setNotice({ type: 'error', message: 'Pengajuan hanya dapat diedit saat Menunggu Verifikasi.' })
      return
    }

    const source = getEditableSource(item)
    const entries = Object.entries(source.data).filter(([key, value]) => isSafeEditableEntry(key, value))
    if (entries.length === 0) {
      setNotice({ type: 'error', message: 'Tidak ada data pengajuan yang aman untuk diedit.' })
      return
    }

    setEditItem(item)
    setEditSourceType(source.type)
    setEditForm(Object.fromEntries(entries))
    setActive(null)
  }

  function closeEdit() {
    if (actionBusy) return
    setEditItem(null)
    setEditForm({})
    setEditSourceType('item')
  }

  function setEditValue(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }))
  }

  async function onEditSubmit(event) {
    event.preventDefault()
    if (!editItem || !canManagePengajuan(getStatus(editItem))) {
      setNotice({ type: 'error', message: 'Pengajuan hanya dapat diedit saat Menunggu Verifikasi.' })
      return
    }

    const id = getPengajuanId(editItem)
    const endpoint = editItem?.__endpoint || ''
    let payloadEdit = { ...editForm }
    if (editSourceType === 'data_form') {
      payloadEdit = { data_form: { ...editForm } }
      for (const [key, value] of Object.entries(editForm)) {
        if (Object.prototype.hasOwnProperty.call(editItem, key)) payloadEdit[key] = value
      }
    }

    setActionBusy(true)
    try {
      const res = await updatePengajuan(endpoint, id, payloadEdit)
      if (!res?.success) {
        setNotice({ type: 'error', message: res?.message || 'Gagal memperbarui pengajuan.' })
        return
      }
      setEditItem(null)
      setEditForm({})
      setNotice({ type: 'success', message: res?.message || 'Pengajuan berhasil diperbarui.' })
      await refreshItems()
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Gagal memperbarui pengajuan.' })
    } finally {
      setActionBusy(false)
    }
  }

  async function onDelete(item) {
    if (!canManagePengajuan(getStatus(item))) {
      setNotice({ type: 'error', message: 'Pengajuan hanya dapat dihapus saat Menunggu Verifikasi.' })
      return
    }
    if (!window.confirm('Yakin ingin menghapus pengajuan ini?')) return

    setActionBusy(true)
    try {
      const res = await deletePengajuan(item?.__endpoint || '', getPengajuanId(item))
      if (!res?.success) {
        setNotice({ type: 'error', message: res?.message || 'Gagal menghapus pengajuan.' })
        return
      }
      setActive(null)
      setEditItem(null)
      setNotice({ type: 'success', message: res?.message || 'Pengajuan berhasil dihapus.' })
      await refreshItems()
    } catch (err) {
      setNotice({ type: 'error', message: err?.message || 'Gagal menghapus pengajuan.' })
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <section className="rk-pageSection rk-pengajuanSaya" aria-label="Riwayat pengajuan saya">
      <style>{`
        .rk-mySubWrap { display: grid; gap: 14px; }
        .rk-mySubHead { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; }
        .rk-mySubHead h2 { margin: 0; }
        .rk-mySubCard { border: 1px solid rgba(0,0,0,.08); border-radius: 16px; padding: 14px; background: rgba(255,255,255,.7); box-shadow: 0 10px 24px rgba(0,0,0,.05); }
        .rk-mySubCard.isCompact { padding: 12px; border-radius: 14px; }
        .rk-mySubRow { display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(0,0,0,.06); }
        .rk-mySubRow:first-child { border-top: none; padding-top: 0; }
        .rk-mySubMeta { min-width: 0; }
        .rk-mySubName { font-weight: 900; color: #111; }
        .rk-mySubNo { font-size: 12px; opacity: .78; margin-top: 2px; }
        .rk-mySubSub { font-size: 13px; opacity: .9; margin-top: 2px; }
        .rk-mySubBadge { font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,.1); font-weight: 900; }
        .rk-mySubBadge.is-waiting { background: rgba(245, 158, 11, .12); border-color: rgba(245, 158, 11, .28); color: #7a4a00; }
        .rk-mySubBadge.is-process { background: rgba(59, 130, 246, .12); border-color: rgba(59, 130, 246, .28); color: #0b3a7a; }
        .rk-mySubBadge.is-reject { background: rgba(220, 38, 38, .12); border-color: rgba(220, 38, 38, .28); color: #7a0b0b; }
        .rk-mySubBadge.is-approve { background: rgba(16, 185, 129, .12); border-color: rgba(16, 185, 129, .28); color: #065f46; }
        .rk-mySubBadge.is-done { background: rgba(34, 197, 94, .12); border-color: rgba(34, 197, 94, .28); color: #14532d; }
        .rk-mySubActions { display:flex; align-items:center; gap: 8px; flex-shrink: 0; }
        .rk-miniBtn2 { display:inline-flex; align-items:center; justify-content:center; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,.14); background: #fff; cursor: pointer; font-weight: 800; font-size: 13px; line-height: 1.1; color: var(--rk-text, #1d2a3a) !important; -webkit-text-fill-color: var(--rk-text, #1d2a3a) !important; opacity: 1 !important; visibility: visible !important; }
        .rk-miniBtn2 > * { color: inherit !important; -webkit-text-fill-color: inherit !important; opacity: 1 !important; visibility: visible !important; }
        .rk-miniBtn2 svg { width: 16px; height: 16px; flex: 0 0 auto; color: inherit !important; }
        .rk-miniBtn2:disabled { opacity: .55; cursor: not-allowed; }
        .rk-modalOverlay { position:fixed; inset:0; background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding: 18px; z-index: 50; }
        .rk-modal { width: min(860px, 100%); background: #fff; border-radius: 18px; border: 1px solid rgba(0,0,0,.12); box-shadow: 0 22px 70px rgba(0,0,0,.22); overflow:hidden; }
        .rk-modalHead { padding: 14px 16px; display:flex; align-items:flex-start; justify-content:space-between; gap: 10px; border-bottom: 1px solid rgba(0,0,0,.08); }
        .rk-modalTitle { font-weight: 900; color: #111; }
        .rk-modalBody { padding: 14px 16px; display:grid; gap: 12px; }
        .rk-statusBox { border: 1px solid rgba(0,0,0,.12); border-radius: 14px; padding: 12px; background: rgba(64,107,34,.06); }
        .rk-statusBox.isReject { background: rgba(220,38,38,.06); border-color: rgba(220,38,38,.22); }
        .rk-statusTop { display:flex; align-items:center; justify-content:space-between; gap: 12px; }
        .rk-kv { display:grid; grid-template-columns: 170px 1fr; gap: 8px 12px; font-size: 14px; }
        .rk-kv dt { font-weight: 900; color: #111; }
        .rk-kv dd { margin: 0; opacity: .95; }
        .rk-modalFoot { padding: 14px 16px; display:flex; flex-wrap:wrap; gap: 10px; justify-content:flex-end; border-top: 1px solid rgba(0,0,0,.08); background: rgba(0,0,0,.02); }

        .rk-summaryGrid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .rk-summaryCard { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(11,79,124,.12); background: rgba(255,255,255,.82); box-shadow: 0 10px 22px rgba(16,52,83,.06); }
        .rk-summaryLabel { font-size: 12px; font-weight: 900; opacity: .85; color: rgba(29,42,58,.92); }
        .rk-summaryValue { margin-top: 6px; font-size: 20px; font-weight: 950; color: #061c32; letter-spacing: -.2px; }
        .rk-summaryHint { margin-top: 4px; font-size: 12px; opacity: .72; }
        .rk-summaryCard.isWaiting { border-color: rgba(245,158,11,.26); }
        .rk-summaryCard.isProcess { border-color: rgba(59,130,246,.26); }
        .rk-summaryCard.isDone { border-color: rgba(16,185,129,.26); }

        @media (max-width: 900px) { .rk-summaryGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 520px) { .rk-summaryGrid { grid-template-columns: 1fr; } .rk-mySubRow { align-items:flex-start; } }
      `}</style>

      {notice ? (
        <div className={`rk-pengajuanNotice is-${notice.type || 'info'}`} role="status" aria-live="polite">
          {notice.type === 'success' ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
          <span>{notice.message}</span>
          <button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice(null)}>
            <FiX aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="rk-container">
        <div className="rk-mySubWrap">
          {variant === 'default' ? (
            <div className="rk-mySubHead">
              <div>
                <p className="rk-pageKicker">Pengajuan</p>
                <h2>Riwayat Pengajuan Saya</h2>
                <p className="rk-pageSubtitle">Daftar pengajuan yang pernah Anda kirim (hanya milik akun Anda).</p>
              </div>
            </div>
          ) : (
            <div className="rk-summaryGrid" aria-label="Ringkasan status pengajuan">
              <div className="rk-summaryCard">
                <span className="rk-summaryIcon"><FiFileText aria-hidden="true" /></span>
                <div>
                  <div className="rk-summaryLabel">Total Pengajuan</div>
                  <div className="rk-summaryValue">{loading ? '—' : counts.total}</div>
                  <div className="rk-summaryHint">Semua layanan</div>
                </div>
              </div>
              <div className="rk-summaryCard isWaiting">
                <span className="rk-summaryIcon"><FiClock aria-hidden="true" /></span>
                <div>
                  <div className="rk-summaryLabel">Menunggu Verifikasi</div>
                  <div className="rk-summaryValue">{loading ? '—' : counts.menunggu}</div>
                  <div className="rk-summaryHint">Belum diproses</div>
                </div>
              </div>
              <div className="rk-summaryCard isProcess">
                <span className="rk-summaryIcon"><FiLoader aria-hidden="true" /></span>
                <div>
                  <div className="rk-summaryLabel">Diproses</div>
                  <div className="rk-summaryValue">{loading ? '—' : counts.diproses}</div>
                  <div className="rk-summaryHint">Sedang berjalan</div>
                </div>
              </div>
              <div className="rk-summaryCard isDone">
                <span className="rk-summaryIcon"><FiCheckCircle aria-hidden="true" /></span>
                <div>
                  <div className="rk-summaryLabel">Selesai / Disetujui</div>
                  <div className="rk-summaryValue">{loading ? '—' : counts.selesai}</div>
                  <div className="rk-summaryHint">Sudah final</div>
                </div>
              </div>
            </div>
          )}

          <div className={`rk-mySubCard ${variant !== 'default' ? 'isCompact' : ''}`} role="region" aria-label="Daftar pengajuan">
            {loading ? (
              <div style={{ opacity: 0.9 }}>Memuat data pengajuan...</div>
            ) : error ? (
              <div style={{ opacity: 0.95, color: 'rgba(122,18,18,.92)' }}>{error}</div>
            ) : visibleItems.length === 0 ? (
              <div style={{ opacity: 0.9, display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 950, color: '#111' }}>Belum ada pengajuan</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Silakan ajukan layanan online terlebih dahulu, lalu status akan muncul di sini.</div>
              </div>
            ) : (
              visibleItems.map((item) => {
                const itemStatus = getStatus(item)
                const itemKind = statusKind(itemStatus)
                const canManage = canManagePengajuan(itemStatus)
                const resultFile = getResultFile(item)
                const canDownloadResult = ['done', 'approve'].includes(itemKind) && !!resultFile
                const rejectReason = getRejectReason(item)

                return (
                  <div key={getPengajuanId(item) || JSON.stringify(item)} className="rk-mySubRow">
                    <span className="rk-mySubServiceIcon" aria-hidden="true"><FiFileText /></span>
                    <div className="rk-mySubMeta">
                      <div className="rk-mySubName">{getNama(item)}</div>
                      {getPengajuanId(item) ? <div className="rk-mySubNo">No: {getPengajuanId(item)}</div> : null}
                      <div className="rk-mySubSub">
                        {getLayanan(item)} • {formatDateTime(getCreatedAt(item))}
                      </div>
                      {itemKind === 'process' ? <div className="rk-rowStatusInfo">Pengajuan sedang diproses petugas.</div> : null}
                      {itemKind === 'reject' && rejectReason ? (
                        <div className="rk-rowStatusInfo isReject">Alasan penolakan: {rejectReason}</div>
                      ) : null}
                      {['done', 'approve'].includes(itemKind) && !resultFile ? (
                        <div className="rk-rowStatusInfo">Dokumen hasil belum tersedia.</div>
                      ) : null}
                    </div>

                    <div className="rk-mySubActions">
                      <span className={`rk-mySubBadge ${badgeClass(itemStatus)}`} title={itemStatus}>
                        {statusLabel(itemStatus)}
                      </span>
                      <button type="button" className="rk-miniBtn2 isDetail" onClick={() => onDetail(item)}>
                        <FiEye aria-hidden="true" />
                        Detail
                      </button>
                      {canManage ? (
                        <>
                          <button type="button" className="rk-miniBtn2 isEdit" onClick={() => openEdit(item)} disabled={actionBusy}>
                            <FiEdit2 aria-hidden="true" />
                            Edit
                          </button>
                          <button type="button" className="rk-miniBtn2 isDelete" onClick={() => void onDelete(item)} disabled={actionBusy}>
                            <FiTrash2 aria-hidden="true" />
                            Hapus
                          </button>
                        </>
                      ) : null}
                      {canDownloadResult ? (
                        <button type="button" className="rk-miniBtn2 isDownload" onClick={() => triggerResultDownload(resultFile)}>
                          <FiDownload aria-hidden="true" />
                          Unduh Surat
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {active ? (
        <div className="rk-modalOverlay" role="dialog" aria-modal="true" aria-label="Detail pengajuan">
          <div className="rk-modal">
            <div className="rk-modalHead">
              <div>
                <div className="rk-modalTitle">Detail Pengajuan</div>
                <div style={{ marginTop: 4, opacity: 0.9, fontSize: 13 }}>
                  {getPengajuanId(active)} • {getLayanan(active)}
                </div>
              </div>
              <button type="button" className="rk-miniBtn2" onClick={close}>
                <FiX aria-hidden="true" />
                Tutup
              </button>
            </div>

            <div className="rk-modalBody">
              <div className={`rk-statusBox is-${activeKind}`}>
                <div className="rk-statusTop">
                  <span className={`rk-mySubBadge ${badgeClass(activeStatus)}`}>{statusLabel(activeStatus)}</span>
                  {activeCanDownload ? (
                    <button type="button" className="rk-miniBtn2 isDownload" onClick={() => triggerResultDownload(activeResultFile)}>
                      <FiDownload aria-hidden="true" />
                      Unduh Surat
                    </button>
                  ) : null}
                </div>
                <div style={{ marginTop: 6, opacity: 0.95 }}>{statusMessage(activeStatus)}</div>
                {activeKind === 'reject' && activeRejectReason ? (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,.08)' }}>
                    <div style={{ fontWeight: 900, color: '#111' }}>Alasan Penolakan</div>
                    <div style={{ marginTop: 4, opacity: 0.95 }}>{activeRejectReason}</div>
                  </div>
                ) : null}
                {['done', 'approve'].includes(activeKind) && !activeResultFile ? (
                  <div className="rk-resultUnavailable">Dokumen hasil belum tersedia.</div>
                ) : null}
              </div>

              <div className="rk-mySubCard" aria-label="Ringkasan data pengajuan">
                <dl className="rk-kv">
                  <dt><FiCalendar aria-hidden="true" /> Tanggal</dt>
                  <dd>{formatDateTime(getCreatedAt(active))}</dd>
                  <dt><FiClock aria-hidden="true" /> Terakhir Update</dt>
                  <dd>{formatDateTime(getUpdatedAt(active))}</dd>
                  <dt><FiInfo aria-hidden="true" /> Keterangan</dt>
                  <dd>{active?.keterangan || active?.keteranganPemohon || '-'}</dd>
                </dl>
              </div>

              <div className="rk-mySubCard" aria-label="Data form">
                <div className="rk-dataFormTitle"><FiUser aria-hidden="true" /> Data Pemohon</div>
                {dataEntries.length === 0 ? (
                  <div style={{ opacity: 0.9 }}>Data form tersimpan belum tersedia (versi pengajuan lama).</div>
                ) : (
                  <dl className="rk-kv">
                    {dataEntries.map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}>
                        <dt>{humanizeLabel(k)}</dt>
                        <dd>{formatDataValue(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>

            <div className="rk-modalFoot">
              {activeCanManage ? (
                <>
                  <button type="button" className="rk-miniBtn2 isEdit" onClick={() => openEdit(active)} disabled={actionBusy}>
                    <FiEdit2 aria-hidden="true" />
                    Edit
                  </button>
                  <button type="button" className="rk-miniBtn2 isDelete" onClick={() => void onDelete(active)} disabled={actionBusy}>
                    <FiTrash2 aria-hidden="true" />
                    Hapus
                  </button>
                </>
              ) : null}
              {activeKind === 'process' ? (
                <div className="rk-lockedInfo"><FiShield aria-hidden="true" /> Pengajuan sedang diproses petugas.</div>
              ) : null}
              {['done', 'approve'].includes(activeKind) && activeCanDownload ? (
                <button type="button" className="rk-miniBtn2 isDownload" onClick={() => triggerResultDownload(activeResultFile)}>
                  <FiDownload aria-hidden="true" />
                  Unduh Surat
                </button>
              ) : null}
              {['done', 'approve'].includes(activeKind) && !activeResultFile ? (
                <div className="rk-lockedInfo"><FiInfo aria-hidden="true" /> Dokumen hasil belum tersedia.</div>
              ) : null}
              {activeKind === 'reject' ? (
                <div className="rk-lockedInfo"><FiAlertCircle aria-hidden="true" /> Pengajuan ditolak dan tidak dapat diubah.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editItem ? (
        <div className="rk-modalOverlay" role="dialog" aria-modal="true" aria-labelledby="rk-editPengajuanTitle">
          <form className="rk-modal rk-editModal" onSubmit={onEditSubmit}>
            <div className="rk-modalHead">
              <div>
                <div id="rk-editPengajuanTitle" className="rk-modalTitle">Edit Pengajuan</div>
                <div className="rk-modalSubtitle">
                  {getPengajuanId(editItem)} • {getLayanan(editItem)}
                </div>
              </div>
              <button type="button" className="rk-miniBtn2" onClick={closeEdit} disabled={actionBusy}>
                <FiX aria-hidden="true" />
                Tutup
              </button>
            </div>

            <div className="rk-modalBody">
              <div className="rk-editInfo">
                <FiInfo aria-hidden="true" />
                Data dapat diubah selama status masih Menunggu Verifikasi.
              </div>
              <div className="rk-editGrid">
                {Object.entries(editForm).map(([key, value]) => (
                  <div className={`rk-editField ${isTextareaField(key) ? 'isWide' : ''}`} key={key}>
                    <label htmlFor={`edit-${key}`}>{humanizeLabel(key)}</label>
                    {typeof value === 'boolean' ? (
                      <select
                        id={`edit-${key}`}
                        value={String(value)}
                        onChange={(event) => setEditValue(key, event.target.value === 'true')}
                        disabled={actionBusy}
                      >
                        <option value="true">Ya</option>
                        <option value="false">Tidak</option>
                      </select>
                    ) : isTextareaField(key) ? (
                      <textarea
                        id={`edit-${key}`}
                        value={value ?? ''}
                        onChange={(event) => setEditValue(key, event.target.value)}
                        rows={3}
                        disabled={actionBusy}
                      />
                    ) : (
                      <input
                        id={`edit-${key}`}
                        type={inputTypeFor(key, value)}
                        value={inputTypeFor(key, value) === 'date' ? String(value || '').slice(0, 10) : value ?? ''}
                        onChange={(event) => setEditValue(key, event.target.value)}
                        disabled={actionBusy}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rk-modalFoot">
              <button type="button" className="rk-miniBtn2" onClick={closeEdit} disabled={actionBusy}>
                Batal
              </button>
              <button type="submit" className="rk-miniBtn2 isSave" disabled={actionBusy}>
                {actionBusy ? <FiLoader aria-hidden="true" /> : <FiSave aria-hidden="true" />}
                {actionBusy ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}
