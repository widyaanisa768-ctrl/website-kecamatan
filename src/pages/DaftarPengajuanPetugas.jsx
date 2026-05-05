import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, listSubmissions } from '../lib/rkLocal'

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
  switch (status) {
    case STATUS.MENUNGGU:
      return 'dpp-badge dpp-badge--waiting'
    case STATUS.PERLU_PERBAIKAN:
      return 'dpp-badge dpp-badge--reject'
    case STATUS.DIPROSES:
      return 'dpp-badge dpp-badge--process'
    case STATUS.DISETUJUI:
      return 'dpp-badge dpp-badge--done'
    case STATUS.SELESAI:
      return 'dpp-badge dpp-badge--done'
    case STATUS.DITOLAK:
      return 'dpp-badge dpp-badge--reject'
    default:
      return 'dpp-badge'
  }
}

export default function DaftarPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const today = useMemo(() => new Date(), [])
  const activeMenu = 'Daftar Pengajuan'

  const [searchName, setSearchName] = useState('')
  const initialStatusFilter =
    new URLSearchParams(location.search).get('filter') === 'menunggu' ? STATUS.MENUNGGU : 'Semua'
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [layananFilter, setLayananFilter] = useState('Semua')

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

  const layananOptions = useMemo(() => {
    const set = new Set(submissions.map((s) => s?.layanan).filter(Boolean))
    return ['Semua', ...Array.from(set)]
  }, [submissions])
  const statusOptions = useMemo(
    () => ['Semua', STATUS.MENUNGGU, STATUS.PERLU_PERBAIKAN, STATUS.DIPROSES, STATUS.DISETUJUI, STATUS.SELESAI, STATUS.DITOLAK],
    []
  )

  const filteredSubmissions = (() => {
    const term = searchName.trim().toLowerCase()
    const filtered = submissions.filter((row) => {
      const matchNama = term.length === 0 || (row?.pemohon?.nama || '').toLowerCase().includes(term)
      const matchStatus = statusFilter === 'Semua' || row.status === statusFilter
      const matchLayanan = layananFilter === 'Semua' || row.layanan === layananFilter
      return matchNama && matchStatus && matchLayanan
    })
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })()

  function resetFilter() {
    setSearchName('')
    setStatusFilter('Semua')
    setLayananFilter('Semua')
  }

  return (
    <div className="dpp-page">
      <style>{`
        :root{
          --dpp-navy:#0B2A4A;
          --dpp-navy-2:#0E3A67;
          --dpp-white:#FFFFFF;
          --dpp-bg:#F4F7FB;
          --dpp-surface:#FFFFFF;
          --dpp-surface-2:#F9FBFF;
          --dpp-gold:#C9A227;
          --dpp-gold-soft:#E7D6A2;
          --dpp-text:#102033;
          --dpp-muted:#66768A;
          --dpp-border:rgba(11, 42, 74, .12);
          --dpp-shadow:0 12px 26px rgba(16, 32, 51, .08);
        }
        .dpp-page{min-height:100vh;background:var(--dpp-bg);color:var(--dpp-text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;}
        .dpp-shell{display:flex;min-height:100vh;}
        .dpp-sidebar{
          width:280px;flex:0 0 280px;background:linear-gradient(180deg,var(--dpp-navy),#081E34);
          color:var(--dpp-white);padding:18px 14px;border-right:1px solid rgba(255,255,255,.08);
          position:sticky;top:0;height:100vh;
        }
        .dpp-brand{display:flex;align-items:center;gap:12px;padding:8px 10px;margin-bottom:14px;}
        .dpp-logo{
          width:44px;height:44px;border-radius:12px;
          background:linear-gradient(135deg,var(--dpp-gold),var(--dpp-gold-soft));
          display:grid;place-items:center;color:var(--dpp-navy);font-weight:800;letter-spacing:.5px;
          box-shadow:0 10px 20px rgba(201,162,39,.22);
        }
        .dpp-brandTitle{display:flex;flex-direction:column;line-height:1.15;}
        .dpp-brandTitle strong{font-size:14px;letter-spacing:.2px;}
        .dpp-brandTitle span{font-size:12px;color:rgba(255,255,255,.72);}
        .dpp-nav{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
        .dpp-navBtn{
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:var(--dpp-white);
          padding:12px 12px;border-radius:14px;cursor:pointer;
          display:flex;align-items:center;gap:10px;
          transition:transform .12s ease, background .12s ease, border-color .12s ease;
          text-align:left;
        }
        .dpp-navBtn:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);}
        .dpp-navBtn.is-active{background:rgba(201,162,39,.16);border-color:rgba(201,162,39,.35);}
        .dpp-navDot{width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.45);box-shadow:0 0 0 6px rgba(255,255,255,.04) inset;}
        .dpp-navBtn.is-active .dpp-navDot{background:var(--dpp-gold);box-shadow:0 0 0 6px rgba(201,162,39,.18) inset;}
        .dpp-navText{font-size:13px;font-weight:600;letter-spacing:.2px;}
        .dpp-sidebarFoot{
          margin-top:auto;padding:12px 10px;border-top:1px solid rgba(255,255,255,.10);
          color:rgba(255,255,255,.72);font-size:12px;
        }
        .dpp-main{flex:1;display:flex;flex-direction:column;}
        .dpp-topbar{
          height:72px;display:flex;align-items:center;justify-content:space-between;
          padding:14px 22px;border-bottom:1px solid var(--dpp-border);
          background:rgba(255,255,255,.72);backdrop-filter:blur(8px);
          position:sticky;top:0;z-index:5;
        }
        .dpp-topbarTitle{display:flex;flex-direction:column;gap:2px;}
        .dpp-topbarTitle h1{margin:0;font-size:16px;letter-spacing:.2px;color:var(--dpp-navy);}
        .dpp-topbarTitle p{margin:0;font-size:12px;color:var(--dpp-muted);}
        .dpp-profile{display:flex;align-items:center;gap:12px;}
        .dpp-avatar{
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,var(--dpp-navy-2),var(--dpp-navy));
          box-shadow:0 10px 20px rgba(11,42,74,.18);
          display:grid;place-items:center;color:var(--dpp-white);font-weight:800;
        }
        .dpp-profileMeta{display:flex;flex-direction:column;line-height:1.15;}
        .dpp-profileMeta strong{font-size:13px;}
        .dpp-profileMeta span{font-size:12px;color:var(--dpp-muted);}

        .dpp-content{padding:18px 22px 28px;}
        .dpp-card{
          background:var(--dpp-surface);
          border:1px solid var(--dpp-border);
          border-radius:18px;
          box-shadow:0 12px 24px rgba(16,32,51,.06);
        }
        .dpp-pageHeader{padding:16px 16px 12px;}
        .dpp-pageHeaderTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .dpp-titleWrap{display:flex;flex-direction:column;gap:6px;}
        .dpp-kicker{
          display:inline-flex;align-items:center;gap:10px;
          font-size:12px;font-weight:800;letter-spacing:.22px;color:var(--dpp-navy);
        }
        .dpp-kickerLine{width:24px;height:2px;background:linear-gradient(90deg,var(--dpp-gold),transparent);}
        .dpp-title{margin:0;font-size:18px;color:var(--dpp-navy);letter-spacing:.2px;}
        .dpp-subtitle{margin:0;font-size:13px;color:var(--dpp-muted);max-width:72ch;}
        .dpp-pill{
          display:inline-flex;align-items:center;gap:8px;
          padding:8px 10px;border-radius:999px;
          border:1px solid rgba(201,162,39,.28);
          background:linear-gradient(180deg, rgba(201,162,39,.10), rgba(255,255,255,.72));
          color:var(--dpp-navy);font-size:12px;font-weight:800;
          white-space:nowrap;
        }
        .dpp-divider{height:1px;background:var(--dpp-border);margin:12px 0 0;}

        .dpp-filters{padding:14px 16px 16px;}
        .dpp-filterGrid{
          display:grid;
          grid-template-columns:1.3fr .9fr .9fr auto;
          gap:10px;
          align-items:end;
        }
        .dpp-field{display:flex;flex-direction:column;gap:6px;min-width:0;}
        .dpp-label{font-size:12px;color:var(--dpp-muted);font-weight:700;}
        .dpp-inputWrap{position:relative;}
        .dpp-inputIcon{
          position:absolute;left:12px;top:50%;transform:translateY(-50%);
          color:rgba(11,42,74,.55);
        }
        .dpp-input,.dpp-select{
          width:100%;
          padding:10px 12px;
          border-radius:14px;
          border:1px solid rgba(11,42,74,.16);
          background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          color:var(--dpp-text);
          outline:none;
          font-size:13px;
          transition:border-color .12s ease, box-shadow .12s ease;
        }
        .dpp-input{padding-left:38px;}
        .dpp-input:focus,.dpp-select:focus{border-color:rgba(11,42,74,.30);box-shadow:0 0 0 4px rgba(11,42,74,.08);}
        .dpp-actions{display:flex;gap:10px;justify-content:flex-end;}
        .dpp-btn{
          border:1px solid rgba(11,42,74,.18);
          background:linear-gradient(180deg,#FFFFFF,#F6FAFF);
          color:var(--dpp-navy);
          padding:10px 12px;border-radius:14px;font-weight:800;font-size:12px;cursor:pointer;
          transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          white-space:nowrap;
        }
        .dpp-btn:hover{transform:translateY(-1px);box-shadow:0 10px 18px rgba(11,42,74,.10);border-color:rgba(11,42,74,.26);}
        .dpp-btnPrimary{
          border:1px solid rgba(201,162,39,.40);
          background:linear-gradient(180deg, rgba(201,162,39,.95), rgba(231,214,162,.95));
          color:#1B2A3A;
        }
        .dpp-metaRow{
          margin-top:10px;
          display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
          color:var(--dpp-muted);font-size:12px;
        }
        .dpp-metaRow strong{color:var(--dpp-navy);}

        .dpp-tableCard{margin-top:14px;}
        .dpp-tableHeader{padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .dpp-tableHeader h2{margin:0;font-size:14px;color:var(--dpp-navy);letter-spacing:.2px;}
        .dpp-subtle{font-size:12px;color:var(--dpp-muted);}

        .dpp-tableWrap{overflow:auto;border-top:1px solid var(--dpp-border);border-bottom-left-radius:18px;border-bottom-right-radius:18px;}
        .dpp-table{width:100%;border-collapse:separate;border-spacing:0;background:var(--dpp-white);min-width:880px;}
        .dpp-table thead th{
          position:sticky;top:0;background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          text-align:left;font-size:12px;color:var(--dpp-muted);
          padding:12px 12px;border-bottom:1px solid var(--dpp-border);
        }
        .dpp-table tbody td{
          padding:12px 12px;border-bottom:1px solid rgba(11,42,74,.08);
          font-size:13px;color:var(--dpp-text);
          vertical-align:middle;
        }
        .dpp-table tbody tr:hover{background:#FAFCFF;}
        .dpp-id{font-size:12px;color:var(--dpp-muted);}
        .dpp-empty{padding:18px;color:var(--dpp-muted);font-size:13px;}

        .dpp-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 10px;border-radius:999px;border:1px solid var(--dpp-border);
          font-size:12px;font-weight:800;letter-spacing:.15px;
          background:#fff;
        }
        .dpp-badge::before{content:"";width:8px;height:8px;border-radius:999px;background:#94A3B8;}
        .dpp-badge--waiting{background:rgba(250, 204, 21, .16);border-color:rgba(250, 204, 21, .40);color:#7A5A00;}
        .dpp-badge--waiting::before{background:#FACC15;}
        .dpp-badge--process{background:rgba(59, 130, 246, .14);border-color:rgba(59, 130, 246, .35);color:#0B3A7A;}
        .dpp-badge--process::before{background:#3B82F6;}
        .dpp-badge--done{background:rgba(34, 197, 94, .14);border-color:rgba(34, 197, 94, .35);color:#155D2E;}
        .dpp-badge--done::before{background:#22C55E;}
        .dpp-badge--reject{background:rgba(239, 68, 68, .12);border-color:rgba(239, 68, 68, .35);color:#7A1E1E;}
        .dpp-badge--reject::before{background:#EF4444;}

        /* Modal */
        .dpp-modalOverlay{
          position:fixed;inset:0;background:rgba(6, 16, 28, .52);
          display:flex;align-items:center;justify-content:center;
          padding:18px;z-index:50;
        }
        .dpp-modal{
          width:min(760px, 100%);
          background:var(--dpp-white);
          border-radius:22px;
          border:1px solid rgba(255,255,255,.14);
          box-shadow:0 24px 60px rgba(0,0,0,.28);
          overflow:hidden;
        }
        .dpp-modalHead{
          padding:14px 16px;
          background:linear-gradient(180deg, rgba(11,42,74,.92), rgba(8,30,52,.92));
          color:var(--dpp-white);
          display:flex;align-items:center;justify-content:space-between;gap:10px;
        }
        .dpp-modalHead h3{margin:0;font-size:14px;letter-spacing:.2px;}
        .dpp-modalClose{
          border:1px solid rgba(255,255,255,.22);
          background:rgba(255,255,255,.10);
          color:var(--dpp-white);
          padding:8px 10px;border-radius:12px;cursor:pointer;font-weight:900;
        }
        .dpp-modalBody{padding:16px;}
        .dpp-kv{
          display:grid;
          grid-template-columns:180px 1fr;
          gap:10px 14px;
          border:1px solid var(--dpp-border);
          border-radius:16px;
          padding:14px;
          background:linear-gradient(180deg,#FFFFFF,#FBFDFF);
        }
        .dpp-kv dt{margin:0;color:var(--dpp-muted);font-size:12px;font-weight:800;}
        .dpp-kv dd{margin:0;color:var(--dpp-text);font-weight:800;font-size:13px;}
        .dpp-modalFoot{
          padding:14px 16px;
          border-top:1px solid var(--dpp-border);
          display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;
          background:linear-gradient(180deg,#FFFFFF,#F8FBFF);
        }

        /* Responsive (desktop/laptop) */
        @media (max-width: 1180px){
          .dpp-filterGrid{grid-template-columns:1fr 1fr;gap:10px;}
          .dpp-actions{grid-column:1 / -1;justify-content:flex-start;}
        }
        @media (max-width: 980px){
          .dpp-sidebar{width:240px;flex-basis:240px;}
          .dpp-content{padding:16px;}
        }
        @media (max-width: 860px){
          .dpp-profileMeta{display:none;}
        }
      `}</style>

      <div className="dpp-shell">
        <SidebarPetugas prefix="dpp" activeLabel={activeMenu} />

        <main className="dpp-main">
          <header className="dpp-topbar">
            <div className="dpp-topbarTitle">
              <h1>Petugas • Daftar Pengajuan</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="dpp-profile" aria-label="Profil petugas">
              <div className="dpp-profileMeta">
                <strong>{petugas.nama}</strong>
                <span>{petugas.jabatan}</span>
              </div>
              <div className="dpp-avatar" title={petugas.unit} aria-hidden="true">
                {petugas.nama
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="dpp-content">
            <section className="dpp-card" aria-label="Header halaman daftar pengajuan">
              <div className="dpp-pageHeader">
                <div className="dpp-pageHeaderTop">
                  <div className="dpp-titleWrap">
                    <div className="dpp-kicker">
                      <span className="dpp-kickerLine" aria-hidden="true" />
                      <span>DAFTAR PENGAJUAN</span>
                    </div>
                    <h2 className="dpp-title">Daftar Pengajuan</h2>
                    <p className="dpp-subtitle">
                      Pantau seluruh pengajuan masyarakat secara terpusat. Gunakan pencarian dan filter untuk
                      mempercepat proses verifikasi dan tindak lanjut.
                    </p>
                  </div>

                  <div className="dpp-pill" title="Total data setelah filter">
                    Total: {filteredSubmissions.length} / {submissions.length}
                  </div>
                </div>
                <div className="dpp-divider" />
              </div>

              <div className="dpp-filters" aria-label="Filter bar">
                <div className="dpp-filterGrid">
                  <div className="dpp-field">
                    <div className="dpp-label">Cari Nama Pemohon</div>
                    <div className="dpp-inputWrap">
                      <span className="dpp-inputIcon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M21 21l-4.3-4.3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <input
                        className="dpp-input"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        placeholder="Contoh: Siti Aisyah"
                        aria-label="Cari nama pemohon"
                      />
                    </div>
                  </div>

                  <div className="dpp-field">
                    <div className="dpp-label">Filter Status</div>
                    <select
                      className="dpp-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter status"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dpp-field">
                    <div className="dpp-label">Filter Jenis Layanan</div>
                    <select
                      className="dpp-select"
                      value={layananFilter}
                      onChange={(e) => setLayananFilter(e.target.value)}
                      aria-label="Filter jenis layanan"
                    >
                      {layananOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dpp-actions">
                    <button type="button" className="dpp-btn" onClick={resetFilter}>
                      Reset Filter
                    </button>
                    <button
                      type="button"
                      className="dpp-btn dpp-btnPrimary"
                      onClick={() => {
                        if (filteredSubmissions.length > 0) {
                          const row = filteredSubmissions[0]
                          navigate(`/petugas/pengajuan/${row.id}`, { state: { submission: row } })
                        }
                      }}
                      title="Demo: buka detail data teratas"
                    >
                      Quick Detail
                    </button>
                  </div>
                </div>

                <div className="dpp-metaRow" aria-label="Ringkasan filter">
                  <div>
                    Status: <strong>{statusFilter}</strong> • Layanan: <strong>{layananFilter}</strong>
                  </div>
                  <div className="dpp-subtle">Data dummy lokal • Tanpa backend</div>
                </div>
              </div>
            </section>

            <section className="dpp-card dpp-tableCard" aria-label="Tabel daftar pengajuan">
              <div className="dpp-tableHeader">
                <h2>Data Pengajuan</h2>
                <div className="dpp-subtle">Urut terbaru → terlama</div>
              </div>

              <div className="dpp-tableWrap" role="region" aria-label="Tabel data pengajuan">
                <table className="dpp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>No</th>
                      <th>Nama Pemohon</th>
                      <th style={{ width: 180 }}>NIK</th>
                      <th>Jenis Layanan</th>
                      <th style={{ width: 150 }}>Tanggal Pengajuan</th>
                      <th style={{ width: 170 }}>Status</th>
                      <th style={{ width: 120 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="dpp-empty">
                          Data tidak ditemukan. Coba ubah kata kunci atau reset filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((row, idx) => (
                        <tr key={row.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 900 }}>{row?.pemohon?.nama || '-'}</div>
                            <div className="dpp-id">{row.id}</div>
                          </td>
                          <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                            {row?.pemohon?.nik || '-'}
                          </td>
                          <td>{row.layanan}</td>
                          <td>{formatTanggalPendekID(row.createdAt)}</td>
                          <td>
                            <span className={getStatusClass(row.status)}>{row.status}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="dpp-btn"
                              onClick={() => navigate(`/petugas/pengajuan/${row.id}`, { state: { submission: row } })}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
