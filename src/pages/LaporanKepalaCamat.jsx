import { useCallback, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiCalendar,
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
import DetailPengajuanKepalaCamatModal from '../components/DetailPengajuanKepalaCamatModal'
import { getAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import { getKepalaCamatLaporan, getKepalaCamatLaporanDetail } from '../services/kepalaCamatService'
import {
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

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
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

function formatDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getSubmissionDate(row) {
  const rawDate = row?.tanggal_pengajuan || getPengajuanCreatedAt(row)
  if (!rawDate) return null

  const parsedDate = new Date(rawDate)
  if (Number.isNaN(parsedDate.getTime())) return null

  parsedDate.setHours(0, 0, 0, 0)
  return parsedDate
}

function isCurrentWeek(date, now) {
  const current = new Date(now)
  current.setHours(0, 0, 0, 0)
  const dayIndex = (current.getDay() + 6) % 7
  const weekStart = new Date(current)
  weekStart.setDate(current.getDate() - dayIndex)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return date >= weekStart && date <= weekEnd
}

function isCurrentMonth(date, now) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function handlePeriodeFilterChange(nextValue, setPeriode, setTanggal) {
  setPeriode(nextValue)
  if (nextValue !== 'tanggal') {
    setTanggal('')
  }
}

function formatPeriodeLabel(value, tanggal) {
  if (value === 'hari_ini') return 'Hari Ini'
  if (value === 'minggu_ini') return 'Minggu Ini'
  if (value === 'bulan_ini') return 'Bulan Ini'
  if (value === 'tanggal' && tanggal) return `Tanggal ${formatTanggalPendekID(tanggal)}`
  return ''
}

function buildFilterSummary({ search, statusFilter, layananFilter, periodeFilter, tanggalFilter }) {
  const filters = []
  if (search) filters.push(`Pencarian: ${search}`)
  if (statusFilter !== 'semua') filters.push(`Status: ${getDisplayStatus(statusFilter)}`)
  if (layananFilter !== 'semua') filters.push(`Jenis Layanan: ${layananFilter}`)
  const periodeLabel = formatPeriodeLabel(periodeFilter, tanggalFilter)
  if (periodeLabel) filters.push(`Periode: ${periodeLabel}`)
  return filters
}

function buildPdfTableRows(rows) {
  return rows.map((row, index) => [
    index + 1,
    row?.nomor_pengajuan || getPengajuanId(row) || '-',
    row?.nama_pemohon || getPengajuanNamaPemohon(row) || '-',
    row?.jenis_layanan || getPengajuanLayanan(row) || '-',
    formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row)),
    getDisplayStatus(row),
  ])
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
  const [periodeFilter, setPeriodeFilter] = useState('semua')
  const [tanggalFilter, setTanggalFilter] = useState('')
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
  const hasDateData = useMemo(() => submissions.some((row) => getSubmissionDate(row)), [submissions])

  const filteredSubmissions = useMemo(() => {
    const query = normalizeText(search)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return [...submissions].filter((row) => {
      if (statusFilter !== 'semua' && getDisplayStatusKind(row) !== statusFilter) return false
      const layananLabel = row?.jenis_layanan || getPengajuanLayanan(row)
      if (layananFilter !== 'semua' && layananLabel !== layananFilter) return false

      if (periodeFilter !== 'semua') {
        const submissionDate = getSubmissionDate(row)
        if (!submissionDate) return false

        if (periodeFilter === 'hari_ini' && formatDateKey(submissionDate) !== formatDateKey(today)) return false
        if (periodeFilter === 'minggu_ini' && !isCurrentWeek(submissionDate, today)) return false
        if (periodeFilter === 'bulan_ini' && !isCurrentMonth(submissionDate, today)) return false
        if (periodeFilter === 'tanggal' && tanggalFilter && formatDateKey(submissionDate) !== tanggalFilter) return false
      }

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
  }, [layananFilter, periodeFilter, search, statusFilter, submissions, tanggalFilter])

  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''
  const hasActiveFilter = Boolean(
    search || statusFilter !== 'semua' || layananFilter !== 'semua' || periodeFilter !== 'semua' || tanggalFilter
  )

  function resetFilters() {
    setSearch('')
    setStatusFilter('semua')
    setLayananFilter('semua')
    setPeriodeFilter('semua')
    setTanggalFilter('')
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

  function handleDownloadRekap() {
    if (typeof window === 'undefined' || filteredSubmissions.length === 0) return
    const filters = buildFilterSummary({
      search,
      statusFilter,
      layananFilter,
      periodeFilter,
      tanggalFilter,
    })
    const printedAt = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      let currentY = 42

      doc.setProperties({
        title: 'laporan-rekapitulasi-kepala-camat.pdf',
        subject: 'Laporan Rekapitulasi Pengajuan Kepala Camat',
        author: 'Website Kecamatan Rantau Kopar',
        creator: 'Website Kecamatan Rantau Kopar',
      })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Laporan Rekapitulasi Pengajuan Kepala Camat', pageWidth / 2, currentY, { align: 'center' })

      currentY += 20
      doc.setFontSize(12)
      doc.setTextColor(70, 85, 105)
      doc.text('Kecamatan Rantau Kopar', pageWidth / 2, currentY, { align: 'center' })

      currentY += 18
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(51, 65, 85)
      doc.text(`Tanggal cetak: ${printedAt}`, 40, currentY)

      if (filters.length > 0) {
        currentY += 22
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(11, 42, 74)
        doc.text('Filter aktif:', 40, currentY)

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(51, 65, 85)
        filters.forEach((filter) => {
          currentY += 15
          const wrappedLines = doc.splitTextToSize(`- ${filter}`, pageWidth - 80)
          doc.text(wrappedLines, 48, currentY)
          currentY += Math.max((wrappedLines.length - 1) * 11, 0)
        })
      }

      autoTable(doc, {
        startY: currentY + 20,
        head: [['No', 'Nomor Pengajuan', 'Nama Pemohon', 'Jenis Layanan', 'Tanggal Pengajuan', 'Status']],
        body: buildPdfTableRows(filteredSubmissions),
        margin: { top: 32, right: 40, bottom: 32, left: 40 },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 6,
          lineColor: [203, 213, 225],
          lineWidth: 0.6,
          textColor: [15, 23, 42],
          valign: 'middle',
        },
        headStyles: {
          fillColor: [234, 241, 251],
          textColor: [8, 36, 90],
          fontStyle: 'bold',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 34, halign: 'center' },
          1: { cellWidth: 110 },
          2: { cellWidth: 140 },
          3: { cellWidth: 160 },
          4: { cellWidth: 92 },
          5: { cellWidth: 90 },
        },
        didDrawPage: () => {
          const pageHeight = doc.internal.pageSize.getHeight()
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(100, 116, 139)
          doc.text(`Dicetak pada ${printedAt}`, 40, pageHeight - 16)
        },
      })

      doc.save('laporan-rekapitulasi-kepala-camat.pdf')
    } catch (error) {
      console.error('[KepalaCamat] Gagal membuat file PDF rekap.', error)
      window.alert('PDF rekap gagal dibuat. Silakan coba lagi.')
    }
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

                {hasDateData ? (
                  <label className="kcm-filterField">
                    <span>Periode</span>
                    <div className="kcm-filterInputWrap">
                      <FiCalendar aria-hidden="true" />
                      <select
                        value={periodeFilter}
                        onChange={(event) =>
                          handlePeriodeFilterChange(event.target.value, setPeriodeFilter, setTanggalFilter)
                        }
                      >
                        <option value="semua">Semua Periode</option>
                        <option value="hari_ini">Hari Ini</option>
                        <option value="minggu_ini">Minggu Ini</option>
                        <option value="bulan_ini">Bulan Ini</option>
                        <option value="tanggal">Pilih Tanggal</option>
                      </select>
                    </div>
                  </label>
                ) : null}

                {hasDateData && periodeFilter === 'tanggal' ? (
                  <label className="kcm-filterField">
                    <span>Tanggal Pengajuan</span>
                    <div className="kcm-filterInputWrap">
                      <FiCalendar aria-hidden="true" />
                      <input
                        type="date"
                        value={tanggalFilter}
                        onChange={(event) => setTanggalFilter(event.target.value)}
                      />
                    </div>
                  </label>
                ) : null}
              </div>

              <div className="kcm-filterActions">
                <button type="button" className="ptg-linkBtn" onClick={resetFilters} disabled={!hasActiveFilter}>
                  Reset Filter
                </button>
                <button
                  type="button"
                  className="kcm-outlineBtn"
                  onClick={handleDownloadRekap}
                  disabled={filteredSubmissions.length === 0}
                >
                  Unduh Rekap
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
                    <th className="kcm-colIndex">No</th>
                    <th className="kcm-colNomor">Nomor Pengajuan</th>
                    <th className="kcm-colPemohon">Nama Pemohon</th>
                    <th className="kcm-colLayanan">Jenis Layanan</th>
                    <th className="kcm-colTanggal">Tanggal Pengajuan</th>
                    <th className="kcm-colStatus">Status</th>
                    <th className="kcm-colAction">Aksi</th>
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
                          <td className="kcm-colIndex">{idx + 1}</td>
                          <td className="ptg-mono kcm-colNomor">{id || '-'}</td>
                          <td className="kcm-colPemohon">{row?.nama_pemohon || getPengajuanNamaPemohon(row)}</td>
                          <td className="kcm-colLayanan">{row?.jenis_layanan || getPengajuanLayanan(row)}</td>
                          <td className="kcm-colTanggal">
                            {formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row))}
                          </td>
                          <td className="kcm-colStatus">
                            <div className="kcm-statusCell">
                              <span className={getStatusClass(status)}>{status}</span>
                            </div>
                          </td>
                          <td className="kcm-colAction">
                            <div className="kcm-actionCell">
                              <button
                                type="button"
                                className="ptg-btn ptg-btnIcon kcm-eyeBtn"
                                aria-label="Lihat Detail"
                                title="Lihat Detail"
                                onClick={() => void openDetail(row)}
                              >
                                <FiEye aria-hidden="true" />
                                <span className="kcm-eyeBtnLabel">Detail</span>
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

      <DetailPengajuanKepalaCamatModal
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
