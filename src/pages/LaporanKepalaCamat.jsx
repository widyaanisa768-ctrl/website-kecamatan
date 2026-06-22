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
import {
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanKeterangan,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanNikPemohon,
  getPengajuanStatusKind,
  getPengajuanUsernamePemohon,
  getSemuaPengajuanPetugas,
} from '../services/pengajuanService'
import './DashboardKepalaCamat.css'

const EMPTY_TITLE = 'Data monitoring belum dapat dimuat.'
const EMPTY_DESC = 'Pastikan backend dan akses Kepala Camat sudah tersedia.'

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
    item?.dokumen_hasil ||
    item?.surat_hasil ||
    item?.hasilSurat ||
    item?.file_hasil ||
    item?.hasil ||
    null

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return {
      nama: source.nama || source.name || source.filename || source.file_name || item?.nama_file_hasil || '',
      url: source.url || source.href || source.path || item?.url_hasil || item?.hasil_url || item?.file_url || '',
    }
  }

  const stringSource = typeof source === 'string' ? source : ''
  return {
    nama: item?.nama_file_hasil || item?.nama_surat_hasil || stringSource,
    url: item?.url_hasil || item?.hasil_url || item?.file_url || stringSource,
  }
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

function DetailModal({ row, onClose }) {
  if (!row) return null

  const status = getDisplayStatus(row)
  const surat = readSuratHasil(row)

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
          <dl className="kcm-detailGrid">
            <dt>No. Pengajuan</dt>
            <dd className="ptg-mono">{getPengajuanId(row) || '-'}</dd>

            <dt>Nama Pemohon</dt>
            <dd>{getPengajuanNamaPemohon(row)}</dd>

            <dt>NIK Pemohon</dt>
            <dd className="ptg-mono">{getPengajuanNikPemohon(row)}</dd>

            <dt>Akun Pemohon</dt>
            <dd>{getPengajuanUsernamePemohon(row)}</dd>

            <dt>Jenis Layanan</dt>
            <dd>{getPengajuanLayanan(row)}</dd>

            <dt>Tanggal Pengajuan</dt>
            <dd>{formatTanggalPendekID(getPengajuanCreatedAt(row))}</dd>

            <dt>Status</dt>
            <dd>
              <span className={getStatusClass(status)}>{status}</span>
            </dd>

            <dt>Keterangan</dt>
            <dd>{getPengajuanKeterangan(row)}</dd>

            <dt>Catatan Petugas</dt>
            <dd>{getPengajuanCatatanPetugas(row) || '-'}</dd>

            <dt>Surat Hasil</dt>
            <dd>
              {surat.nama || surat.url ? (
                <div className="kcm-fileLine">
                  <span>{surat.nama || 'Surat hasil tersedia'}</span>
                  {surat.url ? (
                    <a className="kcm-outlineBtn" href={surat.url} target="_blank" rel="noreferrer">
                      Buka Surat
                    </a>
                  ) : null}
                </div>
              ) : (
                '-'
              )}
            </dd>
          </dl>
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

function EmptyState({ loading, onRetry }) {
  if (loading) {
    return <div className="kcm-empty">Memuat data rekapitulasi...</div>
  }

  return (
    <div className="kcm-emptyState">
      <div className="kcm-emptyIcon" aria-hidden="true">
        <FiFileText />
      </div>
      <div>
        <strong>{EMPTY_TITLE}</strong>
        <p>{EMPTY_DESC}</p>
        <button type="button" className="kcm-retryBtn" onClick={onRetry}>
          <FiRefreshCw aria-hidden="true" />
          Coba Muat Ulang
        </button>
      </div>
    </div>
  )
}

export default function LaporanKepalaCamat() {
  const [auth, setAuthState] = useState(() => getProfile())
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [layananFilter, setLayananFilter] = useState('semua')
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  const refreshData = useCallback(async () => {
    setLoading(true)
    const res = await getSemuaPengajuanPetugas()
    if (res?.success) {
      setSubmissions(res.items || [])
      setError('')
    } else {
      setSubmissions([])
      setError(res?.message || `${EMPTY_TITLE} ${EMPTY_DESC}`)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let active = true

    const loadInitialData = async () => {
      const res = await getSemuaPengajuanPetugas()
      if (!active) return

      if (res?.success) {
        setSubmissions(res.items || [])
        setError('')
      } else {
        setSubmissions([])
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
    const total = submissions.length
    const menunggu = submissions.filter((s) => getDisplayStatusKind(s) === 'menunggu').length
    const diproses = submissions.filter((s) => getDisplayStatusKind(s) === 'diproses').length
    const selesai = submissions.filter((s) => getDisplayStatusKind(s) === 'selesai').length
    const ditolak = submissions.filter((s) => getDisplayStatusKind(s) === 'ditolak').length
    return { total, menunggu, diproses, selesai, ditolak }
  }, [submissions])

  const layananOptions = useMemo(() => {
    const seen = new Set()
    return submissions
      .map((item) => getPengajuanLayanan(item))
      .filter((value) => value && value !== '-')
      .filter((value) => {
        if (seen.has(value)) return false
        seen.add(value)
        return true
      })
      .sort((a, b) => a.localeCompare(b))
  }, [submissions])

  const rekapLayanan = useMemo(() => {
    const map = new Map()
    submissions.forEach((row) => {
      const layanan = getPengajuanLayanan(row)
      if (!layanan || layanan === '-') return
      const current = map.get(layanan) || { layanan, total: 0, menunggu: 0, diproses: 0, selesai: 0, ditolak: 0 }
      const kind = getDisplayStatusKind(row)
      current.total += 1
      current[kind] += 1
      map.set(layanan, current)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.layanan.localeCompare(b.layanan))
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    const query = normalizeText(search)
    return [...submissions].filter((row) => {
      if (statusFilter !== 'semua' && getDisplayStatusKind(row) !== statusFilter) return false
      if (layananFilter !== 'semua' && getPengajuanLayanan(row) !== layananFilter) return false
      if (!query) return true

      const haystack = normalizeText(
        [
          getPengajuanId(row),
          getPengajuanNamaPemohon(row),
          getPengajuanLayanan(row),
          getPengajuanUsernamePemohon(row),
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
              <EmptyState loading={loading} onRetry={refreshData} />
            ) : (
              <div className="kcm-reportGrid">
                {rekapLayanan.map((item) => (
                  <article className="kcm-reportCard" key={item.layanan}>
                    <span>{item.layanan}</span>
                    <strong>{item.total}</strong>
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
                          ? error || EMPTY_TITLE
                          : 'Tidak ada pengajuan yang sesuai dengan filter saat ini.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((row, idx) => {
                      const id = getPengajuanId(row)
                      const status = getDisplayStatus(row)
                      return (
                        <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                          <td>{idx + 1}</td>
                          <td className="ptg-mono">{id || '-'}</td>
                          <td>{getPengajuanNamaPemohon(row)}</td>
                          <td>{getPengajuanLayanan(row)}</td>
                          <td>{formatTanggalPendekID(getPengajuanCreatedAt(row))}</td>
                          <td>
                            <span className={getStatusClass(status)}>{status}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ptg-btn ptg-btnIcon kcm-eyeBtn"
                              aria-label="Lihat Detail"
                              title="Lihat Detail"
                              onClick={() => setSelectedSubmission(row)}
                            >
                              <FiEye aria-hidden="true" />
                            </button>
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

      <DetailModal row={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
    </div>
  )
}
