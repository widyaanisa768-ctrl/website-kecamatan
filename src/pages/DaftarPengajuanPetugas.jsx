import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, listSubmissions } from '../lib/rkLocal'
import '../styles/petugas-ui.css'

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

export default function DaftarPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const today = useMemo(() => new Date(), [])

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
    () => [
      'Semua',
      STATUS.MENUNGGU,
      STATUS.PERLU_PERBAIKAN,
      STATUS.DIPROSES,
      STATUS.DISETUJUI,
      STATUS.SELESAI,
      STATUS.DITOLAK,
    ],
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
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Cari nama pemohon..."
                  aria-label="Cari nama pemohon"
                />
              </div>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
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

                  <div className="ptg-field">
                    <div className="ptg-label">Jenis Layanan</div>
                    <select
                      className="ptg-select"
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

                  <div className="ptg-actionsRow">
                    <button type="button" className="ptg-btn" onClick={resetFilter}>
                      Reset Filter
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div className="ptg-subtle">
                    Status: <strong>{statusFilter}</strong> • Layanan: <strong>{layananFilter}</strong>
                  </div>
                  <div className="ptg-subtle">Data dummy lokal • Tanpa backend</div>
                </div>
              </section>

              <section className="ptg-card ptg-section" aria-label="Tabel daftar pengajuan">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Data Pengajuan</h2>
                  <div className="ptg-subtle">Urut terbaru → terlama</div>
                </div>
                <div className="ptg-divider" />

                <div className="ptg-tableWrap" role="region" aria-label="Tabel data pengajuan" style={{ marginTop: 12 }}>
                  <table className="ptg-table">
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>No</th>
                        <th>Nama Pemohon</th>
                        <th style={{ width: 180 }}>NIK</th>
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
                            Data tidak ditemukan. Coba ubah kata kunci atau reset filter.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((row, idx) => (
                          <tr key={row.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 800 }}>{row?.pemohon?.nama || '-'}</div>
                              <div className="ptg-id">{row.id}</div>
                            </td>
                            <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                              {row?.pemohon?.nik || '-'}
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
                                aria-label="Detail pengajuan"
                                title="Detail"
                                onClick={() => navigate(`/petugas/pengajuan/${row.id}`, { state: { submission: row } })}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
