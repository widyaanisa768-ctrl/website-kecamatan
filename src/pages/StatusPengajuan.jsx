import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PengajuanSaya from '../components/PengajuanSaya'
import './Layanan.css'

export default function StatusPengajuan() {
  return (
    <div className="rk-portal rk-pageLayanan">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Status Pengajuan">
          <div className="rk-container rk-pageHeaderInner">
            <p className="rk-pageKicker">Pengajuan</p>
            <h1 className="rk-pageTitle">Status Pengajuan</h1>
            <p className="rk-pageSubtitle">Pantau status pengajuan Anda dan unduh dokumen jika sudah selesai.</p>
          </div>
        </header>

        <PengajuanSaya />
      </main>

      <Footer />
    </div>
  )
}

