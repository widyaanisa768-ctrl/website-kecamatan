import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PengajuanSaya from '../components/PengajuanSaya'
import './Layanan.css'

export default function StatusPengajuan() {
  return (
    <div className="rk-portal rk-pageLayanan rk-statusPengajuanPage">
      <Navbar />

      <main>
        <style>{`
          .rk-statusPengajuanPage .rk-pageHeader {
            min-height: 220px;
            padding: 34px 0 22px;
          }
          .rk-statusPengajuanPage .rk-pageHeaderInner {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .rk-statusPengajuanPage .rk-pageKicker {
            margin-bottom: 12px;
          }
          .rk-statusPengajuanPage .rk-pageTitle {
            margin-bottom: 10px;
            white-space: normal;
            font-size: clamp(30px, 3.2vw, 40px);
          }
          .rk-statusPengajuanPage .rk-pageSubtitle {
            max-width: 720px;
            font-size: 14.5px;
            line-height: 1.7;
          }
        `}</style>

        <header className="rk-pageHeader" aria-label="Status Pengajuan">
          <div className="rk-container rk-pageHeaderInner">
            <p className="rk-pageKicker">Pengajuan</p>
            <h1 className="rk-pageTitle">Status Pengajuan</h1>
            <p className="rk-pageSubtitle">Pantau status pengajuan Anda dan unduh dokumen jika sudah selesai.</p>
          </div>
        </header>

        <PengajuanSaya variant="status" />
      </main>

      <Footer />
    </div>
  )
}
