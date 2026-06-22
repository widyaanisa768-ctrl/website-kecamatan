import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiFilter,
  FiInfo,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { getAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import { getKepalaCamatLaporan, getKepalaCamatLaporanDetail } from '../services/kepalaCamatService'
import {
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanStatusKind,
} from '../services/pengajuanService'
import './DashboardKepalaCamat.css'

const EMPTY_TITLE = 'Data monitoring belum dapat dimuat.'
const EMPTY_DESC = 'Pastikan backend dan akses Kepala Camat sudah tersedia.'
const EMPTY_RINGKASAN = {
  total_pengajuan: 0,
  rekap_status: {
    menunggu_verifikasi: 0,
    verifikasi: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  },
  rekap_layanan: [],
  daftar_pengajuan: [],
}

const FIELD_LABELS = {
  nomor_pengajuan: 'Nomor Pengajuan',
  nama_pemohon: 'Nama Pemohon',
  nama_lengkap: 'Nama Pemohon',
  jenis_layanan: 'Jenis Layanan',
  tanggal_pengajuan: 'Tanggal Pengajuan',
  status: 'Status',
  catatan_petugas: 'Catatan Petugas',
  nik: 'NIK',
  no_hp: 'Nomor HP',
  nomor_hp: 'Nomor HP',
  email: 'Email',
  alamat: 'Alamat',
  alamat_asal: 'Alamat Asal',
  alamat_pindah: 'Alamat Pindah',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  jenis_kelamin: 'Jenis Kelamin',
  pekerjaan: 'Pekerjaan',
  agama: 'Agama',
  status_perkawinan: 'Status Perkawinan',
  kewarganegaraan: 'Kewarganegaraan',
  keterangan: 'Keterangan',
  keperluan: 'Keperluan',
  tujuan_pindah: 'Tujuan Pindah',
  alasan_pindah: 'Alasan Pindah',
  lama_tinggal: 'Lama Tinggal',
  nama_usaha: 'Nama Usaha',
  jabatan: 'Jabatan',
  instansi: 'Instansi',
  lokasi_penelitian: 'Lokasi Penelitian',
  topik_penelitian: 'Topik Penelitian',
  nama_file_surat_hasil: 'Nama File Surat Hasil',
}

const DETAIL_EXCLUDED_KEYS = new Set([
  'id',
  'id_pengajuan',
  'nomor_pengajuan',
  'nama_pemohon',
  'nama_lengkap',
  'jenis_layanan',
  'layanan',
  'tanggal_pengajuan',
  'status',
  'catatan_petugas',
  'file_surat_hasil',
  'nama_file_surat_hasil',
  'data_pemohon',
  'data_pengajuan',
  'daftar_dokumen',
  'detail_pengajuan',
])

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function hasValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function formatTanggalPendekID(date) {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValue(key, value) {
  if (!hasValue(value)) return ''
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (Array.isArray(value)) return value.filter(hasValue).join(', ')
  if (typeof value === 'number') return String(value)
  if (key.includes('tanggal')) return formatTanggalPendekID(value)
  return String(value).trim()
}

function findValue(source, keys) {
  if (!source || typeof source !== 'object') return undefined

  for (const key of keys) {
    const directValue = source[key]
    if (hasValue(directValue)) return directValue
  }

  for (const value of Object.values(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = findValue(value, keys)
      if (hasValue(nested)) return nested
    }
  }

  return undefined
}

function buildKeyedEntries(sources, fields) {
  return fields
    .map((field) => {
      const value = sources.reduce((found, source) => (hasValue(found) ? found : findValue(source, field.keys)), undefined)
      if (!hasValue(value)) return null
      return {
        key: field.keys[0],
        label: field.label || formatLabel(field.keys[0]),
        value: field.render ? field.render(value) : formatValue(field.keys[0], value),
      }
    })
    .filter(Boolean)
}

function collectRemainingEntries(source, excludeKeys = new Set()) {
  const entries = []
  const seen = new Set()

  const visit = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return

    for (const [key, nextValue] of Object.entries(value)) {
      if (excludeKeys.has(key) || seen.has(key) || !hasValue(nextValue)) continue

      if (Array.isArray(nextValue)) {
        if (nextValue.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
          entries.push({ key, label: formatLabel(key), value: formatValue(key, nextValue) })
          seen.add(key)
        }
        continue
      }

      if (typeof nextValue === 'object') {
        visit(nextValue)
        continue
      }

      entries.push({ key, label: formatLabel(key), value: formatValue(key, nextValue) })
      seen.add(key)
    }
  }

  visit(source)
  return entries
}

function renderEntryValue(entry) {
  if (typeof entry.value === 'string') return entry.value
  return entry.value
}

function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getProfile() {
  const auth = getAuth() || {}
  const user = readStoredUser() || {}
  return {
    ...user,
    ...auth,
    name: auth.name || auth.nama || user.name || user.nama || 'Kepala Camat',
    unit: auth.unit || user.unit || 'Kecamatan Rantau Kopar',
  }
}

function getInitials(name) {
  const parts = String(name || 'Kepala Camat').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function getDisplayStatusKind(itemOrStatus) {
  const kind = getPengajuanStatusKind(itemOrStatus)
  if (kind === 'selesai') return 'selesai'
  if (kind === 'ditolak') return 'ditolak'
  if (kind === 'diproses') return 'diproses'
  return 'menunggu'
}

function getDisplayStatus(itemOrStatus) {
  const kind = getDisplayStatusKind(itemOrStatus)
  if (kind === 'selesai') return 'Selesai'
  if (kind === 'ditolak') return 'Ditolak'
  if (kind === 'diproses') return 'Diproses'
  return 'Menunggu Verifikasi'
}

function getStatusClass(status) {
  const kind = getDisplayStatusKind(status)
  if (kind === 'menunggu') return 'kcm-status kcm-status--waiting'
  if (kind === 'diproses') return 'kcm-status kcm-status--process'
  if (kind === 'selesai') return 'kcm-status kcm-status--done'
  if (kind === 'ditolak') return 'kcm-status kcm-status--reject'
  return 'kcm-status'
}

function readSuratHasil(item) {
  const source =
    item?.file_surat_hasil ||
    item?.nama_file_surat_hasil ||
    item?.dokumen_hasil ||
    item?.surat_hasil ||
    item?.hasilSurat ||
    item?.file_hasil ||
    item?.hasil ||
    null

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return {
      nama: source.nama || source.name || source.filename || source.file_name || item?.nama_file_surat_hasil || '',
      url: source.url || source.href || source.path || item?.url_hasil || item?.hasil_url || item?.file_url || '',
    }
  }

  const stringSource = typeof source === 'string' ? source : ''
  return {
    nama: item?.nama_file_surat_hasil || item?.nama_file_hasil || item?.nama_surat_hasil || stringSource,
    url: item?.url_hasil || item?.hasil_url || item?.file_url || stringSource,
  }
}

function getDokumenInfo(item, index) {
  if (typeof item === 'string') {
    return { label: item, url: item, key: `${item}-${index}` }
  }

  const source = item && typeof item === 'object' ? item : {}
  const label =
    source.nama_dokumen ||
    source.jenis_dokumen ||
    source.nama_file ||
    source.file_name ||
    source.nama ||
    `Dokumen ${index + 1}`
  const url = source.url || source.href || source.path || source.file || source.file_url || ''
  return {
    label,
    url,
    key: `${source.id || source.uuid || label}-${index}`,
  }
}

function DetailSection({ title, entries, children }) {
  if ((!entries || entries.length === 0) && !children) return null

  return (
    <section className="kcm-detailSection">
      <div className="kcm-detailSectionHead">
        <h4>{title}</h4>
      </div>
      {entries && entries.length > 0 ? (
        <dl className="kcm-detailList">
          {entries.map((entry) => (
            <div className="kcm-detailItem" key={entry.key}>
              <dt>{entry.label}</dt>
              <dd>{renderEntryValue(entry)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  )
}

function SidebarKepalaCamat({ active }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await remoteLogout()
    clearAuthArtifacts()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="kcm-sidebar" aria-label="Sidebar kepala camat">
      <div className="kcm-brand">
        <div className="kcm-logo" aria-hidden="true">
          <img src="/images/logo-rohil.png" alt="" />
        </div>
        <div>
          <strong>PETA RANKO</strong>
          <span>Monitoring Pelayanan</span>
        </div>
      </div>

      <nav className="kcm-nav" aria-label="Menu kepala camat">
        <button
          type="button"
          className={`kcm-navBtn ${active === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => navigate('/dashboard-kepala-camat')}
        >
          <FiFileText aria-hidden="true" />
          Dashboard
        </button>
        <button
          type="button"
          className={`kcm-navBtn ${active === 'laporan' ? 'is-active' : ''}`}
          onClick={() => navigate('/kepala-camat/laporan')}
        >
          <FiBarChart2 aria-hidden="true" />
          Laporan & Rekapitulasi
        </button>
        <button
          type="button"
          className={`kcm-navBtn ${active === 'profil' ? 'is-active' : ''}`}
          onClick={() => navigate('/kepala-camat/profil')}
        >
          <FiUser aria-hidden="true" />
          Profil Kepala Camat
        </button>
      </nav>

      <div className="kcm-sidebarInfo">
        <FiInfo aria-hidden="true" />
        <p>Anda login sebagai Kepala Camat. Anda hanya dapat memantau rekapitulasi dan progres pelayanan.</p>
      </div>

      <button type="button" className="kcm-logoutBtn" onClick={handleLogout}>
        <FiLogOut aria-hidden="true" />
        Logout
      </button>
    </aside>
  )
}

function DetailModal({ row, onClose, loading = false, error = '' }) {
  if (!row) return null

  const status = getDisplayStatus(row)
  const surat = readSuratHasil(row)
  const dokumenList = Array.isArray(row?.daftar_dokumen) ? row.daftar_dokumen : []
  const infoPengajuan = buildKeyedEntries([row], [
    { keys: ['nomor_pengajuan'] },
    { keys: ['jenis_layanan'] },
    { keys: ['tanggal_pengajuan'] },
    { keys: ['status'], render: (value) => <span className={getStatusClass(value)}>{formatValue('status', value)}</span> },
    { keys: ['catatan_petugas'] },
  ])
  const infoPemohon = buildKeyedEntries([row?.data_pemohon, row], [
    { keys: ['nama_lengkap', 'nama_pemohon'] },
    { keys: ['nik'] },
    { keys: ['no_hp', 'nomor_hp'] },
    { keys: ['email'] },
    { keys: ['alamat'] },
    { keys: ['tempat_lahir'] },
    { keys: ['tanggal_lahir'] },
    { keys: ['jenis_kelamin'] },
    { keys: ['pekerjaan'] },
    { keys: ['agama'] },
    { keys: ['status_perkawinan'] },
    { keys: ['kewarganegaraan'] },
  ])
  const detailLayanan = collectRemainingEntries(
    { ...(row?.data_pengajuan || {}), ...(row?.detail_pengajuan || {}) },
    DETAIL_EXCLUDED_KEYS
  )

  return (
    <div className="ptg-modalOverlay" role="presentation" onMouseDown={onClose}>
      <section
        className="ptg-modal kcm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detail pengajuan"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ptg-modalHead">
          <h3>Detail Pengajuan</h3>
          <button type="button" className="ptg-modalClose" onClick={onClose}>
            Kembali
          </button>
        </div>

        <div className="ptg-modalBody">
          {loading ? <div className="kcm-empty">Memuat detail laporan...</div> : null}
          {error ? (
            <div className="kcm-emptyState is-compact">
              <div>
                <strong>Detail belum dapat dimuat.</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="kcm-detailLayout">
            <DetailSection title="Informasi Pengajuan" entries={infoPengajuan} />
            <DetailSection title="Informasi Pemohon" entries={infoPemohon} />
            <DetailSection title="Detail Layanan" entries={detailLayanan}>
              {detailLayanan.length === 0 ? (
                <p className="kcm-detailEmpty">Belum ada detail layanan tambahan.</p>
              ) : null}
            </DetailSection>

            <DetailSection title="Dokumen Pendukung" entries={null}>
              {dokumenList.length > 0 ? (
                <div className="kcm-docList">
                  {dokumenList.map((item, index) => {
                    const dokumen = getDokumenInfo(item, index)
                    return (
                      <div key={dokumen.key} className="kcm-docItem">
                        <div className="kcm-docMeta">
                          <strong>{dokumen.label}</strong>
                        </div>
                        {dokumen.url ? (
                          <a className="kcm-outlineBtn" href={dokumen.url} target="_blank" rel="noreferrer">
                            Buka Dokumen
                          </a>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="kcm-detailEmpty">Tidak ada dokumen pendukung.</p>
              )}
            </DetailSection>

            <DetailSection title="Surat Hasil" entries={null}>
              {surat.nama || surat.url ? (
                <div className="kcm-docItem">
                  <div className="kcm-docMeta">
                    <strong>{surat.nama || 'Surat hasil tersedia'}</strong>
                  </div>
                  {surat.url ? (
                    <a className="kcm-outlineBtn" href={surat.url} target="_blank" rel="noreferrer">
                      Buka Surat
                    </a>
                  ) : null}
                </div>
              ) : (
                <p className="kcm-detailEmpty">Belum ada surat hasil.</p>
              )}
            </DetailSection>
          </div>
        </div>

        <div className="ptg-modalFoot">
          <button type="button" className="kcm-outlineBtn" onClick={onClose}>
            Kembali
          </button>
        </div>
      </section>
    </div>
  )
}

function EmptyState({ loading, onRetry, error = '' }) {
  if (loading) {
    return <div className="kcm-empty">Memuat data rekapitulasi...</div>
  }

  const title = error ? EMPTY_TITLE : 'Belum ada data laporan.'
  const description = error || 'Data backend berhasil dimuat, tetapi belum ada pengajuan untuk ditampilkan.'

  return (
    <div className="kcm-emptyState">
      <div className="kcm-emptyIcon" aria-hidden="true">
        <FiFileText />
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {error ? (
          <button type="button" className="kcm-retryBtn" onClick={onRetry}>
            <FiRefreshCw aria-hidden="true" />
            Coba Muat Ulang
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function LaporanKepalaCamat() {
  const [auth, setAuthState] = useState(() => getProfile())
  const [reportData, setReportData] = useState(EMPTY_RINGKASAN)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [layananFilter, setLayananFilter] = useState('semua')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const submissions = reportData.daftar_pengajuan || []

  const refreshData = useCallback(async () => {
    setLoading(true)
    const res = await getKepalaCamatLaporan()
    if (res?.success) {
      setReportData(res.data || EMPTY_RINGKASAN)
      setError('')
    } else {
      setReportData(EMPTY_RINGKASAN)
      setError(res?.message || `${EMPTY_TITLE} ${EMPTY_DESC}`)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    const loadInitialData = async () => {
      const res = await getKepalaCamatLaporan()
      if (!active) return

      if (res?.success) {
        setReportData(res.data || EMPTY_RINGKASAN)
        setError('')
      } else {
        setReportData(EMPTY_RINGKASAN)
        setError(res?.message || `${EMPTY_TITLE} ${EMPTY_DESC}`)
      }
      setLoading(false)
    }

    loadInitialData()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const syncAuth = () => setAuthState(getProfile())
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

  const stats = useMemo(() => {
    const rekapStatus = reportData.rekap_status || EMPTY_RINGKASAN.rekap_status
    return {
      total: Number(reportData.total_pengajuan || 0),
      menunggu: Number(rekapStatus.menunggu_verifikasi || 0),
      diproses: Number(rekapStatus.diproses || 0),
      selesai: Number(rekapStatus.selesai || 0),
      ditolak: Number(rekapStatus.ditolak || 0),
    }
  }, [reportData])

  const layananOptions = useMemo(() => {
    const seen = new Set()
    return submissions
      .map((item) => item?.jenis_layanan || getPengajuanLayanan(item))
      .filter((value) => value && value !== '-')
      .filter((value) => {
        if (seen.has(value)) return false
        seen.add(value)
        return true
      })
      .sort((a, b) => a.localeCompare(b))
  }, [submissions])

  const rekapLayanan = useMemo(() => reportData.rekap_layanan || [], [reportData])

  const filteredSubmissions = useMemo(() => {
    const query = normalizeText(search)
    return [...submissions].filter((row) => {
      if (statusFilter !== 'semua' && getDisplayStatusKind(row) !== statusFilter) return false
      const layananLabel = row?.jenis_layanan || getPengajuanLayanan(row)
      if (layananFilter !== 'semua' && layananLabel !== layananFilter) return false
      if (!query) return true

      const haystack = normalizeText(
        [
          row?.nomor_pengajuan || getPengajuanId(row),
          row?.nama_pemohon || getPengajuanNamaPemohon(row),
          layananLabel,
          row?.layanan || '',
        ].join(' ')
      )
      return haystack.includes(query)
    })
  }, [layananFilter, search, statusFilter, submissions])

  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''
  const hasActiveFilter = Boolean(search || statusFilter !== 'semua' || layananFilter !== 'semua')

  function resetFilters() {
    setSearch('')
    setStatusFilter('semua')
    setLayananFilter('semua')
  }

  async function openDetail(row) {
    setSelectedSubmission(row)
    setDetailLoading(true)
    setDetailError('')

    const res = await getKepalaCamatLaporanDetail(row?.layanan, row?.id_pengajuan || row?.id)
    if (res?.success) {
      setSelectedSubmission(res.data || row)
      setDetailError('')
    } else {
      setSelectedSubmission(row)
      setDetailError(res?.message || 'Detail laporan belum dapat dimuat.')
    }

    setDetailLoading(false)
  }

  return (
    <div className="kcm-page">
      <SidebarKepalaCamat active="laporan" />

      <main className="kcm-main">
        <header className="kcm-header">
          <div>
            <h1>Laporan & Rekapitulasi</h1>
            <p>Rekapitulasi layanan administrasi Kecamatan Rantau Kopar</p>
          </div>

          <div className="kcm-profile" aria-label="Profil kepala camat">
            <div className="kcm-avatar" aria-hidden="true">
              {avatar ? <img src={avatar} alt="" /> : getInitials(auth?.name)}
            </div>
            <div>
              <strong>{auth?.name || 'Kepala Camat'}</strong>
              <span>{auth?.unit || 'Kecamatan Rantau Kopar'}</span>
            </div>
          </div>
        </header>

        <div className="kcm-content">
          <section className="kcm-alert" aria-label="Informasi laporan">
            <div className="kcm-alertIcon" aria-hidden="true">
              <FiInfo />
            </div>
            <div>
              <strong>Laporan ini bersifat read-only untuk kebutuhan monitoring pimpinan.</strong>
              <p>Data berikut diambil langsung dari backend/service dan dapat disaring tanpa mengubah isi pengajuan.</p>
            </div>
          </section>

          <section className="kcm-stats" aria-label="Ringkasan statistik pengajuan">
            {[
              { label: 'Total Pengajuan', value: stats.total, desc: 'Total seluruh pengajuan', icon: FiFileText, tone: 'blue' },
              { label: 'Menunggu Verifikasi', value: stats.menunggu, desc: 'Belum diverifikasi', icon: FiClock, tone: 'amber' },
              { label: 'Diproses', value: stats.diproses, desc: 'Sedang berjalan', icon: FiSettings, tone: 'sky' },
              { label: 'Selesai', value: stats.selesai, desc: 'Sudah selesai', icon: FiCheckCircle, tone: 'green' },
              { label: 'Ditolak', value: stats.ditolak, desc: 'Tidak disetujui', icon: FiXCircle, tone: 'red' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <article className="kcm-statCard" key={item.label}>
                  <div className={`kcm-statIcon is-${item.tone}`} aria-hidden="true">
                    <Icon />
                  </div>
                  <div>
                    <h2>{item.label}</h2>
                    <strong>{item.value}</strong>
                    <p>{item.desc}</p>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="kcm-panel">
            <div className="kcm-panelHeader">
              <h2>Rekap Jumlah Pengajuan Per Layanan</h2>
              <span className="kcm-panelCount">{rekapLayanan.length} layanan</span>
            </div>

            {rekapLayanan.length === 0 ? (
              <EmptyState loading={loading} onRetry={refreshData} error={error} />
            ) : (
              <div className="kcm-reportGrid">
                {rekapLayanan.map((item) => (
                  <article className="kcm-reportCard" key={item.layanan}>
                    <span>{item.jenis_layanan || item.layanan}</span>
                    <strong>{item.total_pengajuan || 0}</strong>
                    <p>Total pengajuan</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="kcm-panel">
            <div className="kcm-panelHeader">
              <h2>Tabel Rekapitulasi Layanan</h2>
              <span className="kcm-panelCount">{filteredSubmissions.length} data ditampilkan</span>
            </div>

            <div className="kcm-filterBar">
              <div className="kcm-filterGrid">
                <label className="kcm-filterField">
                  <span>Pencarian</span>
                  <div className="kcm-filterInputWrap">
                    <FiSearch aria-hidden="true" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Nama pemohon, nomor pengajuan, atau jenis layanan"
                    />
                  </div>
                </label>

                <label className="kcm-filterField">
                  <span>Status</span>
                  <div className="kcm-filterInputWrap">
                    <FiFilter aria-hidden="true" />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option value="semua">Semua Status</option>
                      <option value="menunggu">Menunggu Verifikasi</option>
                      <option value="diproses">Diproses</option>
                      <option value="selesai">Selesai</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>
                </label>

                <label className="kcm-filterField">
                  <span>Jenis Layanan</span>
                  <div className="kcm-filterInputWrap">
                    <FiBarChart2 aria-hidden="true" />
                    <select value={layananFilter} onChange={(event) => setLayananFilter(event.target.value)}>
                      <option value="semua">Semua Jenis Layanan</option>
                      {layananOptions.map((layanan) => (
                        <option key={layanan} value={layanan}>
                          {layanan}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <div className="kcm-filterActions">
                <button type="button" className="ptg-linkBtn" onClick={resetFilters} disabled={!hasActiveFilter}>
                  Reset Filter
                </button>
                <button type="button" className="kcm-retryBtn" onClick={refreshData} disabled={loading}>
                  <FiRefreshCw aria-hidden="true" />
                  {loading ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>
            </div>

            <div className="kcm-tableWrap" role="region" aria-label="Tabel rekapitulasi layanan">
              <table className="kcm-table kcm-reportTable">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nomor Pengajuan</th>
                    <th>Nama Pemohon</th>
                    <th>Jenis Layanan</th>
                    <th>Tanggal Pengajuan</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="ptg-empty">
                        Memuat data rekapitulasi...
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="ptg-empty">
                        {submissions.length === 0
                          ? error || 'Belum ada data pengajuan.'
                          : 'Tidak ada pengajuan yang sesuai dengan filter saat ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((row, idx) => {
                      const id = row?.nomor_pengajuan || getPengajuanId(row)
                      const status = getDisplayStatus(row)
                      return (
                        <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                          <td>{idx + 1}</td>
                          <td className="ptg-mono">{id || '-'}</td>
                          <td>{row?.nama_pemohon || getPengajuanNamaPemohon(row)}</td>
                          <td>{row?.jenis_layanan || getPengajuanLayanan(row)}</td>
                          <td>{formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row))}</td>
                          <td>
                            <div className="kcm-statusCell">
                              <span className={getStatusClass(status)}>{status}</span>
                            </div>
                          </td>
                          <td>
                            <div className="kcm-actionCell">
                              <button
                                type="button"
                                className="ptg-btn ptg-btnIcon kcm-eyeBtn"
                                aria-label="Lihat Detail"
                                title="Lihat Detail"
                                onClick={() => void openDetail(row)}
                              >
                                <FiEye aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <DetailModal
        row={selectedSubmission}
        loading={detailLoading}
        error={detailError}
        onClose={() => {
          setSelectedSubmission(null)
          setDetailError('')
          setDetailLoading(false)
        }}
      />
    </div>
  )
}
