import { useCallback, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
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
import {
  buildPaginationItems,
  buildReportSummary,
  exportKepalaCamatReportExcel,
} from '../lib/kepalaCamatReportExport'
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

function handlePeriodeFilterChange(nextValue, setPeriode, setTanggal, setCurrentPage) {
  setPeriode(nextValue)
  if (nextValue !== 'tanggal') {
    setTanggal('')
  }
  setCurrentPage(1)
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

function renderEntryValue(entry) {
  return typeof entry.value === 'string' ? entry.value : entry.value
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
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const submissions = useMemo(() => reportData.daftar_pengajuan || [], [reportData])

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

  const reportSummary = useMemo(() => buildReportSummary(filteredSubmissions), [filteredSubmissions])
  const filteredSubmissionCount = reportSummary.total
  const totalPages = filteredSubmissionCount > 0 ? Math.ceil(filteredSubmissionCount / pageSize) : 0
  const safeCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const pageStart = filteredSubmissionCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const pageEnd = filteredSubmissionCount === 0 ? 0 : Math.min(safeCurrentPage * pageSize, filteredSubmissionCount)
  const paginatedSubmissions = useMemo(() => {
    if (filteredSubmissionCount === 0) return []
    const start = (safeCurrentPage - 1) * pageSize
    return filteredSubmissions.slice(start, start + pageSize)
  }, [filteredSubmissions, pageSize, safeCurrentPage, filteredSubmissionCount])
  const paginationItems = useMemo(() => buildPaginationItems(safeCurrentPage, totalPages), [safeCurrentPage, totalPages])

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
    setCurrentPage(1)
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
        head: [['No', 'Kode Pengajuan', 'Nama Pemohon', 'Jenis Layanan', 'Tanggal Pengajuan', 'Status']],
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

  async function handleDownloadExcel() {
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
      await exportKepalaCamatReportExcel({
        rows: filteredSubmissions,
        filtersText: filters.length > 0 ? filters.join(' | ') : 'Semua data',
        printedAtText: printedAt,
      })
    } catch (error) {
      console.error('[KepalaCamat] Gagal membuat file Excel rekap.', error)
      window.alert('Excel rekap gagal dibuat. Silakan coba lagi.')
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
              { label: 'Total Pengajuan', value: reportSummary.total, desc: 'Total seluruh pengajuan', icon: FiFileText, tone: 'blue' },
              { label: 'Menunggu Verifikasi', value: reportSummary.menunggu, desc: 'Belum diverifikasi', icon: FiClock, tone: 'amber' },
              { label: 'Diproses', value: reportSummary.diproses, desc: 'Sedang berjalan', icon: FiSettings, tone: 'sky' },
              { label: 'Selesai', value: reportSummary.selesai, desc: 'Sudah selesai', icon: FiCheckCircle, tone: 'green' },
              { label: 'Ditolak', value: reportSummary.ditolak, desc: 'Tidak disetujui', icon: FiXCircle, tone: 'red' },
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
              <span className="kcm-panelCount">{reportSummary.layanan.length} layanan</span>
            </div>

            {reportSummary.layanan.length === 0 ? (
              <EmptyState loading={loading} onRetry={refreshData} error={error} />
            ) : (
              <div className="kcm-reportGrid">
                {reportSummary.layanan.map((item) => (
                  <article className="kcm-reportCard" key={item.jenis_layanan}>
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
              <span className="kcm-panelCount">{filteredSubmissionCount} data ditampilkan</span>
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
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder="Nama pemohon, nomor pengajuan, atau jenis layanan"
                    />
                  </div>
                </label>

                <label className="kcm-filterField">
                  <span>Status</span>
                  <div className="kcm-filterInputWrap">
                    <FiFilter aria-hidden="true" />
                    <select
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value)
                        setCurrentPage(1)
                      }}
                    >
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
                    <select
                      value={layananFilter}
                      onChange={(event) => {
                        setLayananFilter(event.target.value)
                        setCurrentPage(1)
                      }}
                    >
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
                          handlePeriodeFilterChange(event.target.value, setPeriodeFilter, setTanggalFilter, setCurrentPage)
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
                        onChange={(event) => {
                          setTanggalFilter(event.target.value)
                          setCurrentPage(1)
                        }}
                      />
                    </div>
                  </label>
                ) : null}
              </div>

              <div className="kcm-filterActions">
                <button type="button" className="ptg-linkBtn" onClick={resetFilters} disabled={!hasActiveFilter}>
                  Reset Filter
                </button>
                <button type="button" className="kcm-outlineBtn isPdf" onClick={handleDownloadRekap} disabled={filteredSubmissionCount === 0}>
                  Unduh PDF
                </button>
                <button type="button" className="kcm-outlineBtn isExcel" onClick={() => void handleDownloadExcel()} disabled={filteredSubmissionCount === 0}>
                  <FiDownload aria-hidden="true" />
                  Unduh Excel
                </button>
                <button type="button" className="kcm-retryBtn" onClick={refreshData} disabled={loading}>
                  <FiRefreshCw aria-hidden="true" />
                  {loading ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>
            </div>

            {filteredSubmissionCount > 0 ? (
              <div className="kcm-tableMetaBar">
                <div className="kcm-tableMetaInfo">Menampilkan {pageStart}-{pageEnd} dari {filteredSubmissionCount} pengajuan</div>
                <label className="kcm-pageSizeField">
                  <span>Data per halaman</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value) || 10)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </label>
              </div>
            ) : null}

            <div className="kcm-tableWrap kcm-reportWrap" role="region" aria-label="Tabel rekapitulasi layanan">
              <table className="kcm-table kcm-reportTable">
                <thead>
                  <tr>
                    <th className="kcm-colIndex">No</th>
                    <th className="kcm-colNomor">Kode Pengajuan</th>
                    <th className="kcm-colPemohon">Nama Pemohon</th>
                    <th className="kcm-colLayanan">Jenis Layanan</th>
                    <th className="kcm-colTanggal">Tanggal Pengajuan</th>
                    <th className="kcm-colStatus">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="ptg-empty">
                        Memuat data rekapitulasi...
                      </td>
                    </tr>
                  ) : filteredSubmissionCount === 0 ? (
                    <tr>
                      <td colSpan={6} className="ptg-empty">
                        {submissions.length === 0
                          ? error || 'Belum ada data pengajuan.'
                          : 'Tidak ada pengajuan yang sesuai dengan filter saat ini.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedSubmissions.map((row, idx) => {
                      const id = row?.nomor_pengajuan || getPengajuanId(row)
                      const status = getDisplayStatus(row)
                      const rowNumber = pageStart + idx
                      return (
                        <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                          <td className="kcm-colIndex" data-label="No">{rowNumber}</td>
                          <td className="kcm-colNomor" data-label="Kode Pengajuan">
                            <div className="kcm-codeCell">
                              <span className="ptg-mono kcm-codeText">{id || '-'}</span>
                              <button
                                type="button"
                                className="kcm-eyeBtn kcm-eyeBtn--compact"
                                aria-label="Lihat Detail Pengajuan"
                                title="Lihat Detail Pengajuan"
                                onClick={() => void openDetail(row)}
                              >
                                <FiEye aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                          <td className="kcm-colPemohon" data-label="Nama Pemohon">
                            <span className="kcm-reportCellText">{row?.nama_pemohon || getPengajuanNamaPemohon(row) || '-'}</span>
                          </td>
                          <td className="kcm-colLayanan" data-label="Jenis Layanan">
                            <span className="kcm-reportCellText kcm-reportCellText--clamp2">{row?.jenis_layanan || getPengajuanLayanan(row) || '-'}</span>
                          </td>
                          <td className="kcm-colTanggal" data-label="Tanggal Pengajuan">
                            {formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row))}
                          </td>
                          <td className="kcm-colStatus" data-label="Status">
                            <div className="kcm-statusCell">
                              <span className={getStatusClass(status)}>{status}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredSubmissionCount > 0 ? (
              <div className="kcm-paginationBar" aria-label="Pagination laporan">
                <button
                  type="button"
                  className="kcm-paginationBtn"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage <= 1}
                >
                  Sebelumnya
                </button>

                <div className="kcm-paginationPages" role="list" aria-label="Nomor halaman">
                  {paginationItems.map((item, index) =>
                    typeof item === 'number' ? (
                      <button
                        key={`page-${item}`}
                        type="button"
                        className={`kcm-paginationPage ${item === safeCurrentPage ? 'is-active' : ''}`}
                        onClick={() => setCurrentPage(item)}
                        aria-current={item === safeCurrentPage ? 'page' : undefined}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={`ellipsis-${index}`} className="kcm-paginationEllipsis" aria-hidden="true">
                        ...
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="kcm-paginationBtn"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage >= totalPages}
                >
                  Berikutnya
                </button>
              </div>
            ) : null}
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

