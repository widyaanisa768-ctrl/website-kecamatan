import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  getPengajuanCreatedAt,
  getPengajuanId,
  getPengajuanLayanan,
  getPengajuanNamaPemohon,
  getPengajuanNikPemohon,
  getPengajuanStatusKind,
  getSemuaPengajuanPetugas,
  normalizePengajuanStatus,
  SERVICE_ROUTES,
} from '../services/pengajuanService'
import '../styles/petugas-ui.css'

const STATUS_OPTIONS = ['Semua', 'Menunggu Verifikasi', 'Diproses', 'Selesai', 'Ditolak']
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

function getInitials(name) {
  const parts = String(name || 'Petugas').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function toTime(value) {
  const t = new Date(value || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

export default function DaftarPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const today = useMemo(() => new Date(), [])

  const initialStatusFilter =
    new URLSearchParams(location.search).get('filter') === 'menunggu' ? 'Menunggu Verifikasi' : 'Semua'

  const [searchName, setSearchName] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [layananFilter, setLayananFilter] = useState('Semua')
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
      const id = getPengajuanId(row).toLowerCase()
      const status = normalizePengajuanStatus(row)
      const matchSearch = term.length === 0 || nama.includes(term) || layanan.toLowerCase().includes(term) || id.includes(term)
      const matchStatus = statusFilter === 'Semua' || status === statusFilter
      const matchLayanan = layananFilter === 'Semua' || layanan === layananFilter
      return matchSearch && matchStatus && matchLayanan
    })
    return filtered.sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))
  }, [layananFilter, searchName, statusFilter, submissions])

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
                <div className="ptg-avatar" title={auth?.unit || 'Kantor Camat Rantau Kopar'} aria-hidden="true">
                  {avatar ? <img src={avatar} alt="" /> : getInitials(auth?.name || auth?.nama)}
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
                            {loading
                              ? 'Memuat data pengajuan...'
                              : error || BACKEND_EMPTY_MESSAGE}
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((row, idx) => {
                          const id = getPengajuanId(row)
                          const status = normalizePengajuanStatus(row)
                          return (
                            <tr key={`${row.__endpoint || 'pengajuan'}-${id || idx}`}>
                              <td>{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 800 }}>{getPengajuanNamaPemohon(row)}</div>
                                <div className="ptg-id">{id || '-'}</div>
                              </td>
                              <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                                {getPengajuanNikPemohon(row)}
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
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
