import { Link } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiSearch } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PengajuanSaya from '../components/PengajuanSaya'
import './Layanan.css'
import './StatusPengajuan.css'

export default function StatusPengajuan() {
  return (
    <div className="rk-portal rk-pageLayanan rk-statusPengajuanPage">
      <Navbar />

      <main>
        <header className="rk-pageHeader rk-statusHero" aria-label="Status Pengajuan">
          <div className="rk-container rk-pageHeaderInner">
            <div className="rk-statusHeroIcon" aria-hidden="true">
              <FiSearch />
            </div>
            <div>
              <p className="rk-pageKicker">Pengajuan Saya</p>
              <h1 className="rk-pageTitle">Status Pengajuan</h1>
              <p className="rk-pageSubtitle">
                Pantau proses layanan administrasi, lihat pembaruan petugas, dan unduh dokumen yang telah selesai.
              </p>
            </div>
            <div className="rk-statusHeroActions" aria-label="Navigasi cepat">
              <Link to="/layanan" className="rk-statusHeroBtn isPrimary">
                <FiArrowLeft aria-hidden="true" />
                Kembali ke Layanan
              </Link>
              <Link to="/layanan" className="rk-statusHeroBtn isNew">
                <FiPlus aria-hidden="true" />
                Pengajuan Baru
              </Link>
            </div>
          </div>
        </header>

        <PengajuanSaya variant="status" />
      </main>

      <Footer />
    </div>
  )
}
