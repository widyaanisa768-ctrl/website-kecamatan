import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, listSubmissions } from '../lib/rkLocal'
import '../styles/petugas-ui.css'

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
  switch (status) {
    case STATUS.MENUNGGU:
      return 'ptg-badge ptg-badge--waiting'
    case STATUS.PERLU_PERBAIKAN:
      return 'ptg-badge ptg-badge--reject'
    case STATUS.DIPROSES:
      return 'ptg-badge ptg-badge--process'
    case STATUS.DISETUJUI:
    case STATUS.SELESAI:
      return 'ptg-badge ptg-badge--done'
    case STATUS.DITOLAK:
      return 'ptg-badge ptg-badge--reject'
    default:
      return 'ptg-badge'
  }
}

function DashboardPetugas() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])

  const [submissions, setSubmissions] = useState(() => listSubmissions())

  useEffect(() => {
    const refresh = () => setSubmissions(listSubmissions())
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const petugas = {
    nama: 'Widya Anisa',
    jabatan: 'Petugas Pelayanan Terpadu',
    unit: 'Kantor Camat Rantau Kopar',
  }

  const stats = useMemo(() => {
    const total = submissions.length
    const menunggu = submissions.filter((s) => s.status === STATUS.MENUNGGU).length
    const diproses = submissions.filter((s) => s.status === STATUS.DIPROSES).length
    const selesai = submissions.filter((s) => s.status === STATUS.SELESAI).length
    const ditolak = submissions.filter((s) => s.status === STATUS.DITOLAK).length
    return { total, menunggu, diproses, selesai, ditolak }
  }, [submissions])

  const latestSubmissions = (() => {
    const sorted = [...submissions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return sorted.slice(0, 6)
  })()

  const aktivitasHariIni = useMemo(
    () => [
      { id: 'A1', text: '5 pengajuan baru masuk' },
      { id: 'A2', text: '2 pengajuan selesai diverifikasi' },
      { id: 'A3', text: '1 pengajuan ditolak' },
    ],
    []
  )

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
                <input placeholder="Cari pengajuan, pemohon, atau layanan..." aria-label="Cari pengajuan" />
              </div>
            </div>

            <div className="ptg-topbarRight" aria-label="Aksi topbar">
              <button type="button" className="ptg-iconBtn ptg-bell" aria-label="Notifikasi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              <div className="ptg-profile" aria-label="Profil petugas">
                <div className="ptg-profileMeta">
                  <strong>{petugas.nama}</strong>
                  <span>{petugas.jabatan}</span>
                </div>
                <div className="ptg-avatar" title={petugas.unit} aria-hidden="true">
                  {petugas.nama
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
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
                      <path
                        d="M8 8h8M8 12h8M8 16h5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
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
                      <path
                        d="M12 4v16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity=".4"
                      />
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

                  <div className="ptg-tableWrap" role="region" aria-label="Tabel pengajuan terbaru">
                    <table className="ptg-table">
                      <thead>
                        <tr>
                          <th style={{ width: 64 }}>No</th>
                          <th>Nama Pemohon</th>
                          <th>Jenis Layanan</th>
                          <th style={{ width: 150 }}>Tanggal</th>
                          <th style={{ width: 170 }}>Status</th>
                          <th style={{ width: 92, textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="ptg-empty">
                              Belum ada data pengajuan.
                            </td>
                          </tr>
                        ) : (
                          latestSubmissions.map((row, idx) => (
                            <tr key={row.id}>
                              <td>{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 800 }}>{row?.pemohon?.nama || '-'}</div>
                                <div className="ptg-id">{row.id}</div>
                              </td>
                              <td>{row.layanan}</td>
                              <td>{formatTanggalPendekID(row.createdAt)}</td>
                              <td>
                                <span className={getStatusClass(row.status)}>{row.status}</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="ptg-btn ptg-btnIcon"
                                  aria-label="Lihat Detail"
                                  title="Lihat Detail"
                                  onClick={() =>
                                    navigate(`/petugas/pengajuan/${row.id}`, {
                                      state: { submission: row },
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
                          ))
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

                  <div className="ptg-card ptg-section" aria-label="Quick actions">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Quick Actions</h2>
                      <div className="ptg-subtle">Akses cepat</div>
                    </div>
                    <div className="ptg-divider" />
                    <ul className="ptg-quickList">
                      <li className="ptg-quickItem">
                        <div className="ptg-quickLeft">
                          <div className="ptg-quickIcon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="ptg-quickText">Buat Pengajuan Baru</div>
                        </div>
                        <svg className="ptg-quickArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </li>
                      <li className="ptg-quickItem">
                        <div className="ptg-quickLeft">
                          <div className="ptg-quickIcon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M20 6L9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="ptg-quickText">Verifikasi Cepat</div>
                        </div>
                        <svg className="ptg-quickArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </li>
                      <li className="ptg-quickItem">
                        <div className="ptg-quickLeft">
                          <div className="ptg-quickIcon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M4 19h16M4 5h16M6 9h12M6 13h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="ptg-quickText">Laporan Harian</div>
                        </div>
                        <svg className="ptg-quickArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </li>
                      <li className="ptg-quickItem">
                        <div className="ptg-quickLeft">
                          <div className="ptg-quickIcon" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="ptg-quickText">Export Data</div>
                        </div>
                        <svg className="ptg-quickArrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </li>
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
