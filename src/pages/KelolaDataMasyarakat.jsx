import { useMemo } from 'react'
import SidebarPetugas from '../components/SidebarPetugas'
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
                <input value="" readOnly disabled placeholder="Menunggu endpoint data masyarakat" aria-label="Cari masyarakat" />
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              <section className="ptg-card ptg-section" aria-label="Status data masyarakat">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Data Masyarakat</h2>
                  <div className="ptg-subtle">Menunggu integrasi backend</div>
                </div>
                <div className="ptg-divider" />

                <div style={{ marginTop: 8 }}>
                  <div className="ptg-empty" style={{ textAlign: 'center', padding: '28px 18px' }}>
                    <div style={{ fontWeight: 900, color: 'var(--ptg-navy)', marginBottom: 6 }}>
                      Data masyarakat belum terhubung ke backend.
                    </div>
                    <div>Halaman ini akan digunakan untuk melihat dan mengelola akun masyarakat setelah endpoint tersedia.</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
