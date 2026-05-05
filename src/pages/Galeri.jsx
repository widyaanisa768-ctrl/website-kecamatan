import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Galeri.css'

const GALLERY_ITEMS = [
  {
    title: 'Penyerahan Bantuan Sembako',
    desc: 'Kegiatan penyaluran bantuan kepada warga yang membutuhkan.',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Musyawarah Warga',
    desc: 'Dialog dan penyampaian aspirasi untuk solusi bersama.',
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Pelayanan Administrasi',
    desc: 'Pendampingan pengurusan dokumen di loket pelayanan.',
    img: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Rapat Koordinasi',
    desc: 'Koordinasi internal untuk peningkatan mutu pelayanan.',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kunjungan Lapangan',
    desc: 'Monitoring kegiatan dan kondisi wilayah secara berkala.',
    img: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Sosial Kecamatan',
    desc: 'Kolaborasi kecamatan dan masyarakat dalam kegiatan sosial.',
    img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Dokumentasi Kantor',
    desc: 'Lingkungan kantor dan sarana pendukung pelayanan publik.',
    img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Pelayanan Masyarakat',
    desc: 'Pendampingan dan informasi layanan untuk warga.',
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Resmi Lainnya',
    desc: 'Agenda resmi dan kegiatan lintas sektor di wilayah kecamatan.',
    img: 'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?auto=format&fit=crop&w=1200&q=80',
  },
]

export default function Galeri() {
  return (
    <div className="rk-portal rk-pageGaleri">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Galeri Kegiatan">
          <div className="rk-container rk-pageHeaderInner">
            <p className="rk-pageKicker">Galeri</p>
            <h1 className="rk-pageTitle">Galeri Kegiatan</h1>
            <p className="rk-pageSubtitle">Dokumentasi kegiatan pelayanan dan aktivitas kecamatan</p>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Grid galeri">
          <div className="rk-container">
            <div className="rk-galleryGridFull">
              {GALLERY_ITEMS.map((item) => (
                <article key={item.title} className="rk-galleryCard">
                  <div className="rk-galleryMedia" aria-hidden="true">
                    <img src={item.img} alt="" loading="lazy" />
                  </div>
                  <div className="rk-galleryCaption">
                    <div className="rk-galleryTitle">{item.title}</div>
                    <div className="rk-galleryMeta">{item.desc}</div>
                    <a className="rk-galleryLink" href="#">
                      Lihat Detail
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
