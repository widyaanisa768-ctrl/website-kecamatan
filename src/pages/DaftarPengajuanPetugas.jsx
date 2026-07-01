import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PetugasAvatar from '../components/PetugasAvatar'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanNomor,
  getPengajuanStatusKind,
  getSemuaPengajuanPetugas,
  normalizePengajuanStatus,
  SERVICE_ROUTES,
} from '../services/pengajuanService'
import '../styles/petugas-ui.css'

const STATUS_OPTIONS = ['Semua', 'Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak']
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const PETUGAS_LIST_STATE_KEY = 'ptg_pengajuan_list_state'
const BACKEND_EMPTY_MESSAGE =
  'Data pengajuan belum dapat dimuat. Pastikan akun petugas sudah terhubung ke backend.'

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

function formatTanggalID(date) {
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

function toTime(value) {
  const t = new Date(value || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function readStoredListState() {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.sessionStorage.getItem(PETUGAS_LIST_STATE_KEY) || '{}')
  } catch {
    return {}
  }
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
  }

  const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
  return sortedPages.reduce((items, page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      items.push(`ellipsis-${page}`)
    }
    items.push(page)
    return items
  }, [])
}

export default function DaftarPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const today = useMemo(() => new Date(), [])
  const storedListState = useMemo(() => readStoredListState(), [])

  const initialStatusFilter =
    new URLSearchParams(location.search).get('filter') === 'menunggu' ? 'Menunggu Verifikasi' : 'Semua'

  const [searchName, setSearchName] = useState(storedListState.searchName || '')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter !== 'Semua' ? initialStatusFilter : storedListState.statusFilter || 'Semua')
  const [layananFilter, setLayananFilter] = useState(storedListState.layananFilter || 'Semua')
  const [pageSize, setPageSize] = useState(() => {
    const savedPageSize = Number(storedListState.pageSize || 10)
    return PAGE_SIZE_OPTIONS.includes(savedPageSize) ? savedPageSize : 10
  })
  const [currentPage, setCurrentPage] = useState(() => Math.max(Number(storedListState.currentPage || 1), 1))
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [auth, setAuthState] = useState(() => getAuth())

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      setLoading(true)
      const res = await getSemuaPengajuanPetugas()
      if (!alive) return
      if (res?.success) {
        setSubmissions(res.items || [])
        setError('')
      } else {
        setSubmissions([])
        setError(res?.message || 'Gagal memuat data pengajuan.')
      }
      setLoading(false)
    }

    refresh()
    window.addEventListener('focus', refresh)
    return () => {
      alive = false
      window.removeEventListener('focus', refresh)
    }
  }, [])

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

  const layananOptions = useMemo(() => {
    const set = new Set(SERVICE_ROUTES.map((svc) => svc.jenis_layanan))
    submissions.map((s) => getPengajuanLayanan(s)).filter((v) => v && v !== '-').forEach((v) => set.add(v))
    return ['Semua', ...Array.from(set)]
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    const term = searchName.trim().toLowerCase()
    const filtered = submissions.filter((row) => {
      const nama = getPengajuanNamaPemohon(row).toLowerCase()
      const layanan = getPengajuanLayanan(row)
      const nomorPengajuan = getPengajuanNomor(row).toLowerCase()
      const id = getPengajuanId(row).toLowerCase()
      const status = normalizePengajuanStatus(row)
      const matchSearch = term.length === 0 || nama.includes(term) || layanan.toLowerCase().includes(term) || nomorPengajuan.includes(term) || id.includes(term)
      const matchStatus = statusFilter === 'Semua' || status === statusFilter
      const matchLayanan = layananFilter === 'Semua' || layanan === layananFilter
      return matchSearch && matchStatus && matchLayanan
    })
    return filtered.sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))
  }, [layananFilter, searchName, statusFilter, submissions])

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = filteredSubmissions.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize
  const pageEndIndex = Math.min(pageStartIndex + pageSize, filteredSubmissions.length)
  const paginatedSubmissions = useMemo(
    () => filteredSubmissions.slice(pageStartIndex, pageEndIndex),
    [filteredSubmissions, pageEndIndex, pageStartIndex]
  )
  const paginationItems = useMemo(() => buildPaginationItems(safeCurrentPage, totalPages), [safeCurrentPage, totalPages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(
      PETUGAS_LIST_STATE_KEY,
      JSON.stringify({ searchName, statusFilter, layananFilter, pageSize, currentPage })
    )
  }, [currentPage, layananFilter, pageSize, searchName, statusFilter])

  function resetToFirstPage() {
    setCurrentPage(1)
  }

  function handleSearchChange(event) {
    setSearchName(event.target.value)
    resetToFirstPage()
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value)
    resetToFirstPage()
  }

  function handleLayananFilterChange(event) {
    setLayananFilter(event.target.value)
    resetToFirstPage()
  }

  function handlePageSizeChange(event) {
    const nextPageSize = Number(event.target.value)
    setPageSize(PAGE_SIZE_OPTIONS.includes(nextPageSize) ? nextPageSize : 10)
    resetToFirstPage()
  }

  function resetFilter() {
    setSearchName('')
    setStatusFilter('Semua')
    setLayananFilter('Semua')
    resetToFirstPage()
  }

  return (
    <div className="ptg-page">
      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Daftar Pengajuan" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Daftar Pengajuan</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarSearch" aria-label="Pencarian">
              <div className="ptg-search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M10.5 19a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M21 21l-4.4-4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  value={searchName}
                  onChange={handleSearchChange}
                  placeholder="Cari nama pemohon atau layanan..."
                  aria-label="Cari nama pemohon atau layanan"
                />
              </div>
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
              <section className="ptg-card ptg-section" aria-label="Filter pengajuan">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Filter Pengajuan</h2>
                  <div className="ptg-subtle">
                    Total: <strong>{filteredSubmissions.length}</strong> / {submissions.length}
                  </div>
                </div>
                <div className="ptg-divider" />

                <div className="ptg-filterGrid" style={{ marginTop: 12 }}>
                  <div className="ptg-field">
                    <div className="ptg-label">Status</div>
                    <select
                      className="ptg-select"
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      aria-label="Filter status"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ptg-field">
                    <div className="ptg-label">Jenis Layanan</div>
                    <select
                      className="ptg-select"
                      value={layananFilter}
                      onChange={handleLayananFilterChange}
                      aria-label="Filter jenis layanan"
                    >
                      {layananOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ptg-actionsRow">
                    <button type="button" className="ptg-btn" onClick={resetFilter}>
                      Reset Filter
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div className="ptg-subtle">
                    Status: <strong>{statusFilter}</strong> | Layanan: <strong>{layananFilter}</strong>
                  </div>
                  <div className="ptg-subtle">Urutan data mengikuti tanggal pengajuan terbaru.</div>
                </div>
              </section>

              <section className="ptg-card ptg-section" aria-label="Tabel daftar pengajuan">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Data Pengajuan</h2>
                  <div className="ptg-subtle">Urut terbaru ke terlama</div>
                </div>
                <div className="ptg-divider" />

                <div className="ptg-tableToolbar" aria-label="Pengaturan jumlah data">
                  <label className="ptg-pageSizeControl">
                    <span>Tampilkan</span>
                    <select className="ptg-select" value={pageSize} onChange={handlePageSizeChange}>
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span>data per halaman</span>
                  </label>
                </div>

                <div className="ptg-tableWrap" role="region" aria-label="Tabel data pengajuan" style={{ marginTop: 12 }}>
                  <table className="ptg-table">
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>No</th>
                        <th style={{ width: 160 }}>Nomor Pengajuan</th>
                        <th>Nama Pemohon</th>
                        <th>Jenis Layanan</th>
                        <th style={{ width: 170 }}>Tanggal Pengajuan</th>
                        <th style={{ width: 170 }}>Status</th>
                        <th style={{ width: 92, textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty">
                            {loading
                              ? 'Memuat data pengajuan...'
                              : error || (submissions.length > 0 ? 'Tidak ada pengajuan yang sesuai dengan pencarian atau filter.' : BACKEND_EMPTY_MESSAGE)}
                          </td>
                        </tr>
                      ) : (
                        paginatedSubmissions.map((row, idx) => {
                          const id = getPengajuanId(row)
                          const nomorPengajuan = getPengajuanNomor(row)
                          const status = normalizePengajuanStatus(row)
                          const rowNumber = pageStartIndex + idx + 1
                          return (
                            <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                              <td>{rowNumber}</td>
                              <td className="ptg-mono">{nomorPengajuan || '-'}</td>
                              <td style={{ fontWeight: 800 }}>{getPengajuanNamaPemohon(row)}</td>
                              <td>{getPengajuanLayanan(row)}</td>
                              <td>{formatTanggalPendekID(getPengajuanCreatedAt(row))}</td>
                              <td>
                                <span className={getStatusClass(status)}>{status}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="ptg-btn ptg-btnIcon"
                                  aria-label="Detail pengajuan"
                                  title="Detail"
                                  disabled={!id}
                                  onClick={() =>
                                    navigate(`/petugas/pengajuan/${encodeURIComponent(id)}`, {
                                      state: { submission: row, endpoint: row.__endpoint },
                                    })
                                  }
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinejoin="round"
                                    />
                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredSubmissions.length > 0 ? (
                  <div className="ptg-paginationBar" aria-label="Navigasi halaman daftar pengajuan">
                    <div className="ptg-paginationInfo">
                      Menampilkan {pageStartIndex + 1}–{pageEndIndex} dari {filteredSubmissions.length} pengajuan
                    </div>
                    <div className="ptg-paginationControls">
                      <button
                        type="button"
                        className="ptg-pageBtn"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                      >
                        Sebelumnya
                      </button>
                      {paginationItems.map((item) =>
                        typeof item === 'number' ? (
                          <button
                            type="button"
                            key={item}
                            className={`ptg-pageBtn ptg-pageNumber ${item === safeCurrentPage ? 'is-active' : ''}`}
                            onClick={() => setCurrentPage(item)}
                            aria-current={item === safeCurrentPage ? 'page' : undefined}
                          >
                            {item}
                          </button>
                        ) : (
                          <span key={item} className="ptg-pageEllipsis" aria-hidden="true">
                            …
                          </span>
                        )
                      )}
                      <button
                        type="button"
                        className="ptg-pageBtn"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
