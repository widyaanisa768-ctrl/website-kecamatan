import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiInfo,
  FiLogOut,
  FiRefreshCw,
  FiSettings,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { getAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import { getKepalaCamatDashboard, getKepalaCamatLaporanDetail } from '../services/kepalaCamatService'
import {
  getPengajuanCatatanPetugas,
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanStatusKind,
} from '../services/pengajuanService'
import '../styles/petugas-ui.css'
import './DashboardKepalaCamat.css'

const MONITORING_EMPTY_TITLE = 'Data monitoring belum dapat dimuat.'
const MONITORING_EMPTY_DESC = 'Pastikan backend dan akses Kepala Camat sudah tersedia.'
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

function getInitials(name) {
  const parts = String(name || 'Kepala Camat').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function getStatusClass(status) {
  const kind = getDisplayStatusKind(status)
  if (kind === 'menunggu') return 'kcm-status kcm-status--waiting'
  if (kind === 'diproses') return 'kcm-status kcm-status--process'
  if (kind === 'selesai') return 'kcm-status kcm-status--done'
  if (kind === 'ditolak') return 'kcm-status kcm-status--reject'
  return 'kcm-status'
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

function toTime(value) {
  const t = new Date(value || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getKepalaCamatProfile() {
  const auth = getAuth() || {}
  const user = readStoredUser() || {}
  return {
    ...user,
    ...auth,
    name: auth.name || auth.nama || user.name || user.nama || 'Kepala Camat',
    jabatan: auth.jabatan || user.jabatan || 'Kepala Camat',
    unit: auth.unit || user.unit || 'Kecamatan Rantau Kopar',
  }
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

function hasObjectValues(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

function renderJsonBlock(value) {
  if (!hasObjectValues(value)) return '-'
  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  )
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

function EmptyState({ loading, onRetry, compact = false, showRetry = false, error = '' }) {
  if (loading) {
    return <div className="kcm-empty">Memuat data monitoring...</div>
  }

  const title = error ? MONITORING_EMPTY_TITLE : 'Belum ada data monitoring.'
  const description = error || 'Data backend berhasil dimuat, tetapi belum ada pengajuan untuk ditampilkan.'

  return (
    <div className={`kcm-emptyState ${compact ? 'is-compact' : ''}`}>
      <div className="kcm-emptyIcon" aria-hidden="true">
        <FiFileText />
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
        {showRetry && error ? (
          <button type="button" className="kcm-retryBtn" onClick={onRetry}>
            <FiRefreshCw aria-hidden="true" />
            Coba Muat Ulang
          </button>
        ) : null}
      </div>
    </div>
  )
}

function DetailModal({ row, onClose, loading = false, error = '' }) {
  if (!row) return null

  const status = getDisplayStatus(row)
  const surat = readSuratHasil(row)
  const dokumenList = Array.isArray(row?.daftar_dokumen) ? row.daftar_dokumen : []

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

          <dl className="kcm-detailGrid">
            <dt>No. Pengajuan</dt>
            <dd className="ptg-mono">{row?.nomor_pengajuan || getPengajuanId(row) || '-'}</dd>

            <dt>Nama Pemohon</dt>
            <dd>{row?.nama_pemohon || getPengajuanNamaPemohon(row)}</dd>

            <dt>Layanan</dt>
            <dd>{row?.jenis_layanan || getPengajuanLayanan(row)}</dd>

            <dt>Tanggal</dt>
            <dd>{formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row))}</dd>

            <dt>Status</dt>
            <dd>
              <span className={getStatusClass(status)}>{status}</span>
            </dd>

            <dt>Keterangan</dt>
            <dd>{renderJsonBlock(row?.detail_pengajuan || row?.data_pengajuan)}</dd>

            <dt>Catatan Petugas</dt>
            <dd>{row?.catatan_petugas || getPengajuanCatatanPetugas(row) || '-'}</dd>

            <dt>Data Pemohon</dt>
            <dd>{renderJsonBlock(row?.data_pemohon)}</dd>

            <dt>Data Pengajuan</dt>
            <dd>{renderJsonBlock(row?.data_pengajuan)}</dd>

            <dt>Daftar Dokumen</dt>
            <dd>
              {dokumenList.length > 0 ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {dokumenList.map((item, index) => {
                    const dokumen = getDokumenInfo(item, index)
                    return (
                      <div key={dokumen.key} className="kcm-fileLine">
                        <span>{dokumen.label}</span>
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
                '-'
              )}
            </dd>

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

export default function DashboardKepalaCamat() {
  const navigate = useNavigate()

  const [auth, setAuthState] = useState(() => getKepalaCamatProfile())
  const [dashboardData, setDashboardData] = useState(EMPTY_RINGKASAN)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const refreshData = useCallback(async () => {
    setLoading(true)
    const res = await getKepalaCamatDashboard()
    if (res?.success) {
      setDashboardData(res.data || EMPTY_RINGKASAN)
      setError('')
    } else {
      setDashboardData(EMPTY_RINGKASAN)
      setError(res?.message || `${MONITORING_EMPTY_TITLE} ${MONITORING_EMPTY_DESC}`)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      const res = await getKepalaCamatDashboard()
      if (!alive) return
      if (res?.success) {
        setDashboardData(res.data || EMPTY_RINGKASAN)
        setError('')
      } else {
        setDashboardData(EMPTY_RINGKASAN)
        setError(res?.message || `${MONITORING_EMPTY_TITLE} ${MONITORING_EMPTY_DESC}`)
      }
      setLoading(false)
    }

    run()
    window.addEventListener('focus', run)
    return () => {
      alive = false
      window.removeEventListener('focus', run)
    }
  }, [])

  useEffect(() => {
    const syncAuth = () => setAuthState(getKepalaCamatProfile())
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
    const rekapStatus = dashboardData.rekap_status || EMPTY_RINGKASAN.rekap_status
    const total = Number(dashboardData.total_pengajuan || 0)
    const menunggu = Number(rekapStatus.menunggu_verifikasi || 0)
    const diproses = Number(rekapStatus.diproses || 0)
    const selesai = Number(rekapStatus.selesai || 0)
    const ditolak = Number(rekapStatus.ditolak || 0)
    return { total, menunggu, diproses, selesai, ditolak }
  }, [dashboardData])

  const statCards = useMemo(
    () => [
      { label: 'Total Pengajuan', value: stats.total, desc: 'Total seluruh pengajuan', icon: FiFileText, tone: 'blue' },
      { label: 'Menunggu Verifikasi', value: stats.menunggu, desc: 'Belum diverifikasi petugas', icon: FiClock, tone: 'amber' },
      { label: 'Diproses', value: stats.diproses, desc: 'Sedang dalam proses', icon: FiSettings, tone: 'sky' },
      { label: 'Selesai', value: stats.selesai, desc: 'Pengajuan selesai', icon: FiCheckCircle, tone: 'green' },
      { label: 'Ditolak', value: stats.ditolak, desc: 'Pengajuan ditolak', icon: FiXCircle, tone: 'red' },
    ],
    [stats]
  )

  const layananTerbanyak = useMemo(() => {
    return (dashboardData.rekap_layanan || []).slice(0, 6)
  }, [dashboardData])

  const latestSubmissions = useMemo(() => {
    return [...(dashboardData.daftar_pengajuan || [])]
      .sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))
      .slice(0, 5)
  }, [dashboardData])

  const openDetail = useCallback(async (row) => {
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
  }, [])

  async function handleLogout() {
    await remoteLogout()
    clearAuthArtifacts()
    navigate('/login', { replace: true })
  }

  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''
  const hasMonitoringIssue = !loading && Boolean(error)

  return (
    <div className="kcm-page">
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
          <button type="button" className="kcm-navBtn is-active" onClick={() => navigate('/dashboard-kepala-camat')}>
            <FiFileText aria-hidden="true" />
            Dashboard
          </button>
          <button type="button" className="kcm-navBtn" onClick={() => navigate('/kepala-camat/laporan')}>
            <FiBarChart2 aria-hidden="true" />
            Laporan & Rekapitulasi
          </button>
          <button type="button" className="kcm-navBtn" onClick={() => navigate('/kepala-camat/profil')}>
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

      <main className="kcm-main">
        <header className="kcm-header">
          <div>
            <h1>Dashboard Kepala Camat</h1>
            <p>Monitoring layanan administrasi Kecamatan Rantau Kopar</p>
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
          <section className="kcm-alert" aria-label="Informasi hak akses">
            <div className="kcm-alertIcon" aria-hidden="true">
              <FiInfo />
            </div>
            <div>
              <strong>Kepala Camat hanya memantau rekapitulasi dan progres pelayanan.</strong>
              <p>Perubahan status dilakukan oleh petugas.</p>
            </div>
          </section>

          <section className="kcm-stats" aria-label="Statistik pengajuan">
            {statCards.map((item) => {
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

          <section className="kcm-panels" aria-label="Ringkasan monitoring">
            <article className="kcm-panel kcm-servicePanel">
              <div className="kcm-panelHeader">
                <h2>Ringkasan Layanan Paling Banyak Diajukan</h2>
                <FiInfo aria-hidden="true" />
              </div>

              {layananTerbanyak.length === 0 ? (
                <EmptyState loading={loading} onRetry={refreshData} compact error={error} />
              ) : (
                <div className="kcm-serviceTable" role="table" aria-label="Ringkasan layanan">
                  <div className="kcm-serviceHead" role="row">
                    <span role="columnheader">Layanan</span>
                    <span role="columnheader">Jumlah Pengajuan</span>
                  </div>
                  {layananTerbanyak.map((item) => {
                    const totalPengajuan = Number(item.total_pengajuan || 0)
                    const width = stats.total > 0 ? Math.max(8, Math.round((totalPengajuan / stats.total) * 100)) : 0
                    return (
                      <div className="kcm-serviceRow" role="row" key={item.layanan}>
                        <span role="cell">{item.jenis_layanan || item.layanan}</span>
                        <span className="kcm-serviceCount" role="cell">
                          <i style={{ width: `${width}%` }} aria-hidden="true" />
                          <strong>{totalPengajuan}</strong>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </article>

            <article className="kcm-panel kcm-latestPanel">
              <div className="kcm-panelHeader">
                <h2>Pengajuan Terbaru</h2>
                <button type="button" className="ptg-linkBtn kcm-seeAllBtn" onClick={() => navigate('/kepala-camat/laporan')}>
                  Lihat Semua
                </button>
              </div>

              <div className="kcm-tableWrap" role="region" aria-label="Tabel pengajuan terbaru">
                <table className="kcm-table">
                  <thead>
                    <tr>
                      <th>No. Pengajuan</th>
                      <th>Layanan</th>
                      <th>Pemohon</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState loading={loading} onRetry={refreshData} compact error={error} />
                        </td>
                      </tr>
                    ) : (
                      latestSubmissions.map((row, idx) => {
                        const id = row?.nomor_pengajuan || getPengajuanId(row)
                        const status = getDisplayStatus(row)
                        return (
                          <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                            <td className="ptg-mono">{id || '-'}</td>
                            <td>{row?.jenis_layanan || getPengajuanLayanan(row)}</td>
                            <td>{row?.nama_pemohon || getPengajuanNamaPemohon(row)}</td>
                            <td>{formatTanggalPendekID(row?.tanggal_pengajuan || getPengajuanCreatedAt(row))}</td>
                            <td>
                              <span className={getStatusClass(status)}>{status}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="ptg-btn ptg-btnIcon kcm-eyeBtn"
                                aria-label="Lihat Detail"
                                title="Lihat Detail"
                                onClick={() => void openDetail(row)}
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
            </article>
          </section>

          {hasMonitoringIssue ? (
            <section className="kcm-wideEmpty" aria-label="Status data monitoring">
              <EmptyState loading={false} onRetry={refreshData} showRetry error={error} />
            </section>
          ) : null}
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
