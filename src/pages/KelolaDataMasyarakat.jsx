import { useEffect, useMemo, useState } from 'react'
import SidebarPetugas from '../components/SidebarPetugas'
import { getMasyarakatUsers } from '../services/userService'
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

export default function KelolaDataMasyarakat() {
  const today = useMemo(() => new Date(), [])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    const loadUsers = async () => {
      setLoading(true)
      const res = await getMasyarakatUsers() 
      if (!alive) return

      if (res?.success) {
        setUsers(res.items || [])
        setError('')
      } else {
        setUsers([])
        setError(res?.message || 'Gagal memuat data masyarakat.')
      }
      setLoading(false)
    }

    loadUsers()
    window.addEventListener('focus', loadUsers)
    return () => {
      alive = false
      window.removeEventListener('focus', loadUsers)
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) => {
      const haystack = [
        user.nama_lengkap,
        user.username,
        user.email,
        user.no_hp,
        user.alamat,
        user.role,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [search, users])

  return (
    <div className="ptg-page">
      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Kelola Data Masyarakat" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Kelola Data Masyarakat</h1>
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
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, username, email, atau alamat..."
                  aria-label="Cari masyarakat"
                />
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              <section className="ptg-card ptg-section" aria-label="Data masyarakat">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Data Masyarakat</h2>
                  <div className="ptg-subtle">
                    Total: <strong>{filteredUsers.length}</strong> / {users.length}
                  </div>
                </div>
                <div className="ptg-divider" />

                <div className="ptg-tableWrap" role="region" aria-label="Tabel data masyarakat" style={{ marginTop: 12 }}>
                  <table className="ptg-table">
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>No</th>
                        <th>Nama Lengkap</th>
                        <th style={{ width: 160 }}>Username</th>
                        <th>Email</th>
                        <th style={{ width: 150 }}>Nomor HP</th>
                        <th>Alamat</th>
                        <th style={{ width: 130 }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading || error || filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty" style={{ textAlign: 'center', padding: '28px 18px' }}>
                            {loading ? (
                              'Memuat data masyarakat...'
                            ) : error ? (
                              <span>{error}</span>
                            ) : (
                              'Belum ada data masyarakat'
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, idx) => (
                          <tr key={user.id || user.username || user.email || idx}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 800 }}>{user.nama_lengkap || '-'}</div>
                            </td>
                            <td className="ptg-mono">{user.username || '-'}</td>
                            <td>{user.email || '-'}</td>
                            <td>{user.no_hp || '-'}</td>
                            <td>{user.alamat || '-'}</td>
                            <td>
                              <span className="ptg-pill">{user.role || 'masyarakat'}</span>
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
