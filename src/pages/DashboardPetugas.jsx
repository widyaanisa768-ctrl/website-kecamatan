import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, listSubmissions } from '../lib/rkLocal'

function formatTanggalID(date) {
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

function formatTanggalPendekID(date) {
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

function getStatusClass(status) {
  switch (status) {
    case STATUS.MENUNGGU:
      return "dp-badge dp-badge--waiting"
    case STATUS.PERLU_PERBAIKAN:
      return "dp-badge dp-badge--reject"
    case STATUS.DIPROSES:
      return "dp-badge dp-badge--process"
    case STATUS.DISETUJUI:
    case STATUS.SELESAI:
      return "dp-badge dp-badge--done"
    case STATUS.DITOLAK:
      return "dp-badge dp-badge--reject"
    default:
      return "dp-badge"
  }
}

function DashboardPetugas() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const activeMenu = 'Dashboard'

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
    const sorted = [...submissions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
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
    <div className="dp-page">
      <style>{`
        :root{
          --dp-navy:#0B2A4A;
          --dp-navy-2:#0E3A67;
          --dp-white:#FFFFFF;
          --dp-bg:#F4F7FB;
          --dp-gold:#C9A227;
          --dp-gold-soft:#E7D6A2;
          --dp-text:#102033;
          --dp-muted:#66768A;
          --dp-card:#FFFFFF;
          --dp-border:rgba(11, 42, 74, .12);
          --dp-shadow:0 10px 24px rgba(16, 32, 51, .10);
        }
        .dp-page{min-height:100vh;background:var(--dp-bg);color:var(--dp-text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;}
        .dp-shell{display:flex;min-height:100vh;}
        .dp-sidebar{
          width:280px;flex:0 0 280px;background:linear-gradient(180deg,var(--dp-navy),#081E34);
          color:var(--dp-white);padding:18px 14px;border-right:1px solid rgba(255,255,255,.08);
          position:sticky;top:0;height:100vh;
        }
        .dp-brand{display:flex;align-items:center;gap:12px;padding:8px 10px;margin-bottom:14px;}
        .dp-logo{
          width:44px;height:44px;border-radius:12px;
          background:linear-gradient(135deg,var(--dp-gold),var(--dp-gold-soft));
          display:grid;place-items:center;color:var(--dp-navy);font-weight:800;letter-spacing:.5px;
          box-shadow:0 10px 20px rgba(201,162,39,.22);
        }
        .dp-brandTitle{display:flex;flex-direction:column;line-height:1.15;}
        .dp-brandTitle strong{font-size:14px;letter-spacing:.2px;}
        .dp-brandTitle span{font-size:12px;color:rgba(255,255,255,.72);}
        .dp-nav{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
        .dp-navBtn{
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:var(--dp-white);
          padding:12px 12px;border-radius:14px;cursor:pointer;
          display:flex;align-items:center;gap:10px;
          transition:transform .12s ease, background .12s ease, border-color .12s ease;
          text-align:left;
        }
        .dp-navBtn:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);}
        .dp-navBtn.is-active{background:rgba(201,162,39,.16);border-color:rgba(201,162,39,.35);}
        .dp-navDot{width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.45);box-shadow:0 0 0 6px rgba(255,255,255,.04) inset;}
        .dp-navBtn.is-active .dp-navDot{background:var(--dp-gold);box-shadow:0 0 0 6px rgba(201,162,39,.18) inset;}
        .dp-navText{font-size:13px;font-weight:600;letter-spacing:.2px;}
        .dp-sidebarFoot{
          margin-top:auto;padding:12px 10px;border-top:1px solid rgba(255,255,255,.10);
          color:rgba(255,255,255,.72);font-size:12px;
        }
        .dp-main{flex:1;display:flex;flex-direction:column;}
        .dp-topbar{
          height:72px;display:flex;align-items:center;justify-content:space-between;
          padding:14px 22px;border-bottom:1px solid var(--dp-border);
          background:rgba(255,255,255,.72);backdrop-filter:blur(8px);
          position:sticky;top:0;z-index:5;
        }
        .dp-topbarTitle{display:flex;flex-direction:column;gap:2px;}
        .dp-topbarTitle h1{margin:0;font-size:18px;letter-spacing:.2px;color:var(--dp-navy);}
        .dp-topbarTitle p{margin:0;font-size:12px;color:var(--dp-muted);}
        .dp-profile{display:flex;align-items:center;gap:12px;}
        .dp-avatar{
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,var(--dp-navy-2),var(--dp-navy));
          box-shadow:0 10px 20px rgba(11,42,74,.18);
          display:grid;place-items:center;color:var(--dp-white);font-weight:800;
        }
        .dp-profileMeta{display:flex;flex-direction:column;line-height:1.15;}
        .dp-profileMeta strong{font-size:13px;}
        .dp-profileMeta span{font-size:12px;color:var(--dp-muted);}
        .dp-content{padding:18px 22px 28px;}
        .dp-grid{display:grid;grid-template-columns:1.6fr .9fr;gap:16px;align-items:start;}
        .dp-cards{display:grid;grid-template-columns:repeat(5, minmax(0, 1fr));gap:12px;}
        .dp-card{
          background:var(--dp-card);border:1px solid var(--dp-border);border-radius:18px;
          box-shadow:0 12px 24px rgba(16,32,51,.06);
        }
        .dp-stat{padding:14px 14px 12px;display:flex;gap:12px;align-items:flex-start;}
        .dp-statIcon{
          width:40px;height:40px;border-radius:14px;
          background:linear-gradient(135deg, rgba(201,162,39,.20), rgba(11,42,74,.08));
          border:1px solid rgba(201,162,39,.24);
          display:grid;place-items:center;color:var(--dp-navy);flex:0 0 auto;
        }
        .dp-statMeta{display:flex;flex-direction:column;gap:2px;min-width:0;}
        .dp-statMeta span{font-size:12px;color:var(--dp-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dp-statMeta strong{font-size:20px;letter-spacing:.2px;color:var(--dp-navy);line-height:1.1;}
        .dp-section{padding:14px;}
        .dp-sectionHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
        .dp-sectionHeader h2{margin:0;font-size:14px;color:var(--dp-navy);letter-spacing:.2px;}
        .dp-subtle{font-size:12px;color:var(--dp-muted);}
        .dp-tableWrap{overflow:auto;border-radius:14px;border:1px solid var(--dp-border);}
        .dp-table{width:100%;border-collapse:separate;border-spacing:0;background:var(--dp-white);min-width:720px;}
        .dp-table thead th{
          position:sticky;top:0;background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          text-align:left;font-size:12px;color:var(--dp-muted);
          padding:12px;border-bottom:1px solid var(--dp-border);
        }
        .dp-table tbody td{
          padding:12px;border-bottom:1px solid rgba(11,42,74,.08);
          font-size:13px;color:var(--dp-text);
          vertical-align:middle;
        }
        .dp-table tbody tr:hover{background:#FAFCFF;}
        .dp-id{font-size:12px;color:var(--dp-muted);}
        .dp-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 10px;border-radius:999px;border:1px solid var(--dp-border);
          font-size:12px;font-weight:700;letter-spacing:.15px;
          background:#fff;
        }
        .dp-badge::before{content:"";width:8px;height:8px;border-radius:999px;background:#94A3B8;}
        .dp-badge--waiting{background:rgba(250, 204, 21, .16);border-color:rgba(250, 204, 21, .40);color:#7A5A00;}
        .dp-badge--waiting::before{background:#FACC15;}
        .dp-badge--process{background:rgba(59, 130, 246, .14);border-color:rgba(59, 130, 246, .35);color:#0B3A7A;}
        .dp-badge--process::before{background:#3B82F6;}
        .dp-badge--done{background:rgba(34, 197, 94, .14);border-color:rgba(34, 197, 94, .35);color:#155D2E;}
        .dp-badge--done::before{background:#22C55E;}
        .dp-badge--reject{background:rgba(239, 68, 68, .12);border-color:rgba(239, 68, 68, .35);color:#7A1E1E;}
        .dp-badge--reject::before{background:#EF4444;}
        .dp-btn{
          border:1px solid rgba(11,42,74,.18);
          background:linear-gradient(180deg,#FFFFFF,#F6FAFF);
          color:var(--dp-navy);
          padding:8px 12px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;
          transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          white-space:nowrap;
        }
        .dp-btn:hover{transform:translateY(-1px);box-shadow:0 10px 18px rgba(11,42,74,.10);border-color:rgba(11,42,74,.26);}
        .dp-activity{padding:14px;}
        .dp-activityList{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;}
        .dp-activityItem{
          display:flex;gap:10px;align-items:flex-start;
          padding:10px 12px;border-radius:14px;border:1px solid var(--dp-border);
          background:linear-gradient(180deg,#FFFFFF,#FBFDFF);
        }
        .dp-activityBullet{
          width:10px;height:10px;border-radius:999px;margin-top:4px;
          background:var(--dp-gold);
          box-shadow:0 0 0 6px rgba(201,162,39,.14) inset;
          flex:0 0 auto;
        }
        .dp-activityText{font-size:13px;color:var(--dp-text);}
        .dp-empty{padding:18px;color:var(--dp-muted);font-size:13px;}
        .dp-divider{height:1px;background:var(--dp-border);margin:12px 0;}

        /* Modal detail */
        .dp-modalOverlay{
          position:fixed;inset:0;background:rgba(6, 16, 28, .52);
          display:flex;align-items:center;justify-content:center;
          padding:18px;z-index:50;
        }
        .dp-modal{
          width:min(760px, 100%);
          background:var(--dp-white);
          border-radius:22px;
          border:1px solid rgba(255,255,255,.14);
          box-shadow:0 24px 60px rgba(0,0,0,.28);
          overflow:hidden;
        }
        .dp-modalHead{
          padding:14px 16px;
          background:linear-gradient(180deg, rgba(11,42,74,.92), rgba(8,30,52,.92));
          color:var(--dp-white);
          display:flex;align-items:center;justify-content:space-between;gap:10px;
        }
        .dp-modalHead h3{margin:0;font-size:14px;letter-spacing:.2px;}
        .dp-modalClose{
          border:1px solid rgba(255,255,255,.22);
          background:rgba(255,255,255,.10);
          color:var(--dp-white);
          padding:8px 10px;border-radius:12px;cursor:pointer;font-weight:800;
        }
        .dp-modalBody{padding:16px;}
        .dp-kv{
          display:grid;
          grid-template-columns:180px 1fr;
          gap:10px 14px;
          border:1px solid var(--dp-border);
          border-radius:16px;
          padding:14px;
          background:linear-gradient(180deg,#FFFFFF,#FBFDFF);
        }
        .dp-kv dt{margin:0;color:var(--dp-muted);font-size:12px;}
        .dp-kv dd{margin:0;color:var(--dp-text);font-weight:700;font-size:13px;}
        .dp-modalFoot{
          padding:14px 16px;
          border-top:1px solid var(--dp-border);
          display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;
          background:linear-gradient(180deg,#FFFFFF,#F8FBFF);
        }
        .dp-btnPrimary{
          border:1px solid rgba(201,162,39,.40);
          background:linear-gradient(180deg, rgba(201,162,39,.95), rgba(231,214,162,.95));
          color:#1B2A3A;
        }

        /* Responsive (desktop/laptop) */
        @media (max-width: 1180px){
          .dp-cards{grid-template-columns:repeat(3, minmax(0, 1fr));}
          .dp-grid{grid-template-columns:1fr;}
        }
        @media (max-width: 980px){
          .dp-sidebar{width:240px;flex-basis:240px;}
          .dp-content{padding:16px;}
        }
        @media (max-width: 860px){
          .dp-cards{grid-template-columns:repeat(2, minmax(0, 1fr));}
          .dp-profileMeta{display:none;}
        }
      `}</style>

      <div className="dp-shell">
        <SidebarPetugas prefix="dp" activeLabel="Dashboard" />

        <main className="dp-main">
          <header className="dp-topbar">
            <div className="dp-topbarTitle">
              <h1>Dashboard Petugas</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="dp-profile" aria-label="Profil petugas">
              <div className="dp-profileMeta">
                <strong>{petugas.nama}</strong>
                <span>{petugas.jabatan}</span>
              </div>
              <div className="dp-avatar" title={petugas.unit} aria-hidden="true">
                {petugas.nama
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="dp-content">
            <div className="dp-cards" aria-label="Statistik pengajuan">
              <div className="dp-card dp-stat">
                <div className="dp-statIcon" aria-hidden="true">
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
                <div className="dp-statMeta">
                  <span>Total Pengajuan</span>
                  <strong>{stats.total}</strong>
                </div>
              </div>
              <div className="dp-card dp-stat">
                <div className="dp-statIcon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 6v6l4 2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="dp-statMeta">
                  <span>Menunggu Verifikasi</span>
                  <strong>{stats.menunggu}</strong>
                </div>
              </div>
              <div className="dp-card dp-stat">
                <div className="dp-statIcon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 12h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 4v16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity=".4"
                    />
                  </svg>
                </div>
                <div className="dp-statMeta">
                  <span>Diproses</span>
                  <strong>{stats.diproses}</strong>
                </div>
              </div>
              <div className="dp-card dp-stat">
                <div className="dp-statIcon" aria-hidden="true">
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
                <div className="dp-statMeta">
                  <span>Selesai</span>
                  <strong>{stats.selesai}</strong>
                </div>
              </div>
              <div className="dp-card dp-stat">
                <div className="dp-statIcon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6 6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="dp-statMeta">
                  <span>Ditolak</span>
                  <strong>{stats.ditolak}</strong>
                </div>
              </div>
            </div>

            <div className="dp-grid" style={{ marginTop: 16 }}>
              <section className="dp-card dp-section" aria-label="Pengajuan terbaru">
                <div className="dp-sectionHeader">
                  <h2>Pengajuan Terbaru</h2>
                  <div className="dp-subtle">
                    Menu aktif: <span style={{ fontWeight: 800, color: "var(--dp-navy)" }}>{activeMenu}</span>
                  </div>
                </div>

                <div className="dp-tableWrap" role="region" aria-label="Tabel pengajuan terbaru">
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>No</th>
                        <th>Nama Pemohon</th>
                        <th>Jenis Layanan</th>
                        <th style={{ width: 150 }}>Tanggal</th>
                        <th style={{ width: 170 }}>Status</th>
                        <th style={{ width: 140 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="dp-empty">
                            Belum ada data pengajuan.
                          </td>
                        </tr>
                      ) : (
                        latestSubmissions.map((row, idx) => (
                          <tr key={row.id}>
                            <td>{idx + 1}</td>
                            <td>
                <div style={{ fontWeight: 800 }}>{row?.pemohon?.nama || '-'}</div>
                <div className="dp-id">{row.id}</div>
              </td>
              <td>{row.layanan}</td>
              <td>{formatTanggalPendekID(row.createdAt)}</td>
              <td>
                <span className={getStatusClass(row.status)}>{row.status}</span>
              </td>
                            <td>
                              <button
                                type="button"
                                className="dp-btn"
                                onClick={() =>
                                  navigate(`/petugas/pengajuan/${row.id}`, {
                                    state: { submission: row },
                                  })
                                }
                              >
                                Lihat Detail
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="dp-card dp-activity" aria-label="Aktivitas hari ini">
                <div className="dp-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Aktivitas Hari Ini</h2>
                  <div className="dp-subtle">Ringkasan singkat</div>
                </div>
                <div className="dp-divider" />
                <ul className="dp-activityList">
                  {aktivitasHariIni.map((item) => (
                    <li key={item.id} className="dp-activityItem">
                      <span className="dp-activityBullet" aria-hidden="true" />
                      <div className="dp-activityText">{item.text}</div>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </main>
      </div>

    </div>
  )
}

export default DashboardPetugas
