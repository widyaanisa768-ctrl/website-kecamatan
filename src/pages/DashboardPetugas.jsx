import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanStatusKind,
  getSemuaPengajuanPetugas,
  normalizePengajuanStatus,
} from '../services/pengajuanService'
import '../styles/petugas-ui.css'

const BACKEND_EMPTY_MESSAGE =
  'Data pengajuan belum dapat dimuat. Pastikan akun petugas sudah terhubung ke backend.'

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

function toTime(value) {
  const t = new Date(value || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function DashboardPetugas() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])

  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [auth, setAuthState] = useState(() => getAuth())
  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      setLoading(true)
      const res = await getSemuaPengajuanPetugas()
      console.log('[PETUGAS DATA]', res.items?.length, res.items)
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

  const stats = useMemo(() => {
    const total = submissions.length
    const menunggu = submissions.filter((s) => getPengajuanStatusKind(s) === 'menunggu').length
    const diproses = submissions.filter((s) => getPengajuanStatusKind(s) === 'diproses').length
    const selesai = submissions.filter((s) => getPengajuanStatusKind(s) === 'selesai').length
    const ditolak = submissions.filter((s) => getPengajuanStatusKind(s) === 'ditolak').length
    return { total, menunggu, diproses, selesai, ditolak }
  }, [submissions])

  const latestSubmissions = useMemo(() => {
    return [...submissions]
      .sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))
      .slice(0, 5)
  }, [submissions])

  const aktivitasHariIni = useMemo(
    () => [
      { id: 'A1', text: `${stats.menunggu} pengajuan menunggu verifikasi` },
      { id: 'A2', text: `${stats.diproses} pengajuan sedang diproses` },
      { id: 'A3', text: `${stats.selesai} pengajuan selesai` },
    ],
    [stats]
  )

  const tugasPetugas = [
    'Periksa pengajuan masuk',
    'Verifikasi kelengkapan data',
    'Ubah status pengajuan',
    'Unggah/catat surat hasil jika sudah tersedia',
  ]

  return (
    <div className="ptg-page">
      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Dashboard" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Dashboard Petugas</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
              <button type="button" className="ptg-iconBtn ptg-bellBtn" aria-label="Notifikasi">
                <FiBell aria-hidden="true" />
              </button>

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
              <div className="ptg-rowStats" aria-label="Statistik pengajuan">
                <div className="ptg-card ptg-statCard">
                  <div className="ptg-statIcon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="ptg-statMeta">
                    <span>Total Pengajuan</span>
                    <strong>{stats.total}</strong>
                  </div>
                </div>

                <div className="ptg-card ptg-statCard">
                  <div className="ptg-statIcon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="ptg-statMeta">
                    <span>Menunggu Verifikasi</span>
                    <strong>{stats.menunggu}</strong>
                  </div>
                </div>

                <div className="ptg-card ptg-statCard">
                  <div className="ptg-statIcon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".4" />
                    </svg>
                  </div>
                  <div className="ptg-statMeta">
                    <span>Diproses</span>
                    <strong>{stats.diproses}</strong>
                  </div>
                </div>

                <div className="ptg-card ptg-statCard">
                  <div className="ptg-statIcon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6 9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="ptg-statMeta">
                    <span>Selesai</span>
                    <strong>{stats.selesai}</strong>
                  </div>
                </div>

                <div className="ptg-card ptg-statCard">
                  <div className="ptg-statIcon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="ptg-statMeta">
                    <span>Ditolak</span>
                    <strong>{stats.ditolak}</strong>
                  </div>
                </div>
              </div>

              <div className="ptg-gridTwo">
                <section className="ptg-card ptg-section" aria-label="Pengajuan terbaru">
                  <div className="ptg-sectionHeader">
                    <h2>Pengajuan Terbaru</h2>
                    <button type="button" className="ptg-linkBtn" onClick={() => navigate('/petugas/pengajuan')}>
                      Lihat Semua
                    </button>
                  </div>

                  <div className="ptg-tableWrap isDashboardTable" role="region" aria-label="Tabel pengajuan terbaru">
                    <table className="ptg-table isDashboardTable">
                      <thead>
                        <tr>
                          <th style={{ width: 64 }}>No</th>
                          <th>Nama Pemohon</th>
                          <th>Jenis Layanan</th>
                          <th style={{ width: 128 }}>Tanggal</th>
                          <th style={{ width: 148 }}>Status</th>
                          <th style={{ width: 82, textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="ptg-empty">
                              {loading
                                ? 'Memuat data pengajuan...'
                                : error || BACKEND_EMPTY_MESSAGE}
                            </td>
                          </tr>
                        ) : (
                          latestSubmissions.map((row, idx) => {
                            const id = getPengajuanId(row)
                            const status = normalizePengajuanStatus(row)
                            return (
                              <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                                <td>{idx + 1}</td>
                                <td>
                                  <div style={{ fontWeight: 800 }}>{getPengajuanNamaPemohon(row)}</div>
                                  <div className="ptg-id">{id || '-'}</div>
                                </td>
                                <td>{getPengajuanLayanan(row)}</td>
                                <td>{formatTanggalPendekID(getPengajuanCreatedAt(row))}</td>
                                <td>
                                  <span className={getStatusClass(status)}>{status}</span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className="ptg-btn ptg-btnIcon"
                                    aria-label="Lihat Detail"
                                    title="Lihat Detail"
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
                </section>

                <aside className="ptg-stack" aria-label="Panel kanan dashboard">
                  <div className="ptg-card ptg-section" aria-label="Aktivitas hari ini">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Aktivitas Hari Ini</h2>
                      <div className="ptg-subtle">Ringkasan singkat</div>
                    </div>
                    <div className="ptg-divider" />
                    <ul className="ptg-activityList">
                      {aktivitasHariIni.map((item) => (
                        <li key={item.id} className="ptg-activityItem">
                          <span className="ptg-activityBullet" aria-hidden="true" />
                          <div className="ptg-activityText">{item.text}</div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ptg-card ptg-section" aria-label="Ringkasan tugas petugas">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Ringkasan Tugas Petugas</h2>
                      <div className="ptg-subtle">Alur verifikasi</div>
                    </div>
                    <div className="ptg-divider" />
                    <ul className="ptg-taskList">
                      {tugasPetugas.map((task, idx) => (
                        <li key={task} className="ptg-taskItem">
                          <span className="ptg-taskNumber" aria-hidden="true">{idx + 1}</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPetugas
