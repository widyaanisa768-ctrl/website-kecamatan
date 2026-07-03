import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Galeri.css'

const GALLERY_ITEMS = [
  {
    title: 'Rapat Koordinasi Kecamatan',
    desc: 'Kegiatan koordinasi bersama perangkat dan unsur terkait di lingkungan Kecamatan Rantau Kopar.',
    detail: 'Dokumentasi kegiatan rapat koordinasi sebagai bagian dari komunikasi dan sinergi pelayanan di Kecamatan Rantau Kopar.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kantor Camat Rantau Kopar',
    img: '/images/galeri/01-Rapat-Koordinasi.jpg',
  },
  {
    title: 'Foto Bersama Aparatur Kecamatan',
    desc: 'Dokumentasi kebersamaan aparatur dan masyarakat di lingkungan Kantor Camat Rantau Kopar.',
    detail: 'Dokumentasi foto bersama dalam kegiatan resmi yang melibatkan aparatur dan unsur masyarakat Kecamatan Rantau Kopar.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kantor Camat Rantau Kopar',
    img: '/images/galeri/02-Foto-Bersama-Kantor.jpg',
  },
  {
    title: 'Kunjungan dan Silaturahmi',
    desc: 'Kegiatan silaturahmi bersama unsur masyarakat dan perangkat wilayah.',
    detail: 'Dokumentasi kunjungan dan silaturahmi sebagai upaya memperkuat hubungan antara pemerintah kecamatan dan masyarakat.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Wilayah Kecamatan Rantau Kopar',
    img: '/images/galeri/03-Kunjungan-Silaturahmi.jpg',
  },
  {
    title: 'Pelayanan Administrasi Digital',
    desc: 'Pendampingan penggunaan layanan administrasi berbasis digital.',
    detail: 'Dokumentasi aktivitas pelayanan dan pendampingan masyarakat dalam penggunaan sistem administrasi digital.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kantor Camat Rantau Kopar',
    img: '/images/galeri/04-Pelayanan-Digital.jpg',
  },
  {
    title: 'Pelantikan Pengurus BKMT',
    desc: 'Kegiatan pelantikan pengurus organisasi masyarakat di Kecamatan Rantau Kopar.',
    detail: 'Dokumentasi kegiatan pelantikan dan pengukuhan pengurus organisasi kemasyarakatan di wilayah Kecamatan Rantau Kopar.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Aula Kecamatan Rantau Kopar',
    img: '/images/galeri/05-Pelantikan-BKMT.jpg',
  },
  {
    title: 'Rapat Bersama Masyarakat',
    desc: 'Kegiatan rapat dan penyampaian informasi kepada masyarakat.',
    detail: 'Dokumentasi rapat bersama masyarakat sebagai ruang komunikasi, penyampaian informasi, dan koordinasi program.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Aula Kecamatan Rantau Kopar',
    img: '/images/galeri/06-Rapat-Masyarakat.jpg',
  },
  {
    title: 'Penyerahan Bantuan Sosial',
    desc: 'Kegiatan penyaluran bantuan kepada masyarakat di wilayah Kecamatan Rantau Kopar.',
    detail: 'Dokumentasi kegiatan sosial dan penyerahan bantuan sebagai bentuk kepedulian kepada masyarakat.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kecamatan Rantau Kopar',
    img: '/images/galeri/07-Penyerahan-Bantuan.jpg',
  },
  {
    title: 'Apel Kesiapsiagaan Anti Narkoba',
    desc: 'Kegiatan bersama dalam mendukung pencegahan penyalahgunaan narkoba.',
    detail: 'Dokumentasi kegiatan apel dan koordinasi lintas unsur dalam mendukung program pencegahan penyalahgunaan narkoba.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kabupaten Rokan Hilir',
    img: '/images/galeri/08-Apel-Anti-Narkoba.jpg',
  },
  {
    title: 'Bakti Sosial IBI',
    desc: 'Kegiatan bakti sosial dan pelayanan kesehatan masyarakat.',
    detail: 'Dokumentasi kegiatan bakti sosial bersama tenaga kesehatan dan unsur masyarakat di wilayah Rantau Kopar.',
    date: 'Tanggal kegiatan dapat diperbarui',
    location: 'Kecamatan Rantau Kopar',
    img: '/images/galeri/09-Baksos-IBI.jpg',
  },
  {
    title: 'Panen Raya Jagung Serentak',
    desc: 'Kegiatan panen raya jagung dalam mendukung program ketahanan pangan.',
    detail: 'Dokumentasi Panen Raya Jagung Serentak Ketahanan Pangan di Kepenghuluan Bagan Cempedak, Kecamatan Rantau Kopar.',
    date: '07 Maret 2026',
    location: 'Kepenghuluan Bagan Cempedak',
    img: '/images/galeri/10-Panen-Raya-Jagung.jpg',
  },
]

export default function Galeri() {
  const [selected, setSelected] = useState(null)

  const heroThumbs = useMemo(
    () => [
      GALLERY_ITEMS[0],
      GALLERY_ITEMS[1],
      GALLERY_ITEMS[3],
      GALLERY_ITEMS[4],
    ],
    []
  )
  const galleryItems = useMemo(
    () => [
      GALLERY_ITEMS[2],
      GALLERY_ITEMS[5],
      GALLERY_ITEMS[6],
      GALLERY_ITEMS[7],
      GALLERY_ITEMS[8],
      GALLERY_ITEMS[9],
    ],
    []
  )

  useEffect(() => {
    if (!selected) return undefined

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.classList.add('rk-noScroll')

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('rk-noScroll')
    }
  }, [selected])

  return (
    <div className="rk-portal rk-pageGaleri">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Galeri Kegiatan">
          <div className="rk-container rk-pageHeaderInner rk-galeriHero">
            <div className="rk-galeriHeroLeft">
              <p className="rk-pageKicker">Galeri</p>
              <h1 className="rk-pageTitle">Galeri Kegiatan</h1>
              <p className="rk-pageSubtitle">
                Dokumentasi kegiatan pelayanan, koordinasi, dan aktivitas masyarakat di lingkungan Kecamatan Rantau
                Kopar.
              </p>
            </div>

            <div className="rk-galeriHeroRight" aria-hidden="true">
              <div className="rk-galeriCollage">
                <div className="rk-galeriCollageGrid">
                  {heroThumbs.map((item) => (
                    <div key={item.title} className="rk-galeriCollageItem">
                      <img src={item.img} alt={item.title} loading="lazy" />
                    </div>
                  ))}
                </div>
                <div className="rk-galeriCollageBadge">Dokumentasi Resmi</div>
              </div>
            </div>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Grid galeri">
          <div className="rk-container">
            <div className="rk-galleryGridFull">
              {galleryItems.map((item) => (
                <article key={item.title} className="rk-galleryCard">
                  <div className="rk-galleryMedia" aria-hidden="true">
                    <img src={item.img} alt={item.title} loading="lazy" />
                  </div>
                  <div className="rk-galleryCaption">
                    <div className="rk-galleryTitle">{item.title}</div>
                    <div className="rk-galleryMeta">{item.desc}</div>
                    <button type="button" className="rk-galleryLink" onClick={() => setSelected(item)}>
                      Lihat Detail
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {selected ? (
          <div className="rk-galleryModal" role="dialog" aria-modal="true" aria-label={`Detail ${selected.title}`}>
            <button
              type="button"
              className="rk-galleryModalBackdrop"
              onClick={() => setSelected(null)}
              aria-label="Tutup modal"
            />
            <div className="rk-galleryModalPanel" role="document">
              <div className="rk-galleryModalMedia" aria-hidden="true">
                <img src={selected.img} alt={selected.title} />
              </div>
              <div className="rk-galleryModalBody">
                <div className="rk-galleryModalHead">
                  <div>
                    <div className="rk-galleryModalKicker">Detail Kegiatan</div>
                    <h2 className="rk-galleryModalTitle">{selected.title}</h2>
                  </div>
                  <button
                    type="button"
                    className="rk-galleryModalClose"
                    onClick={() => setSelected(null)}
                    aria-label="Tutup"
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </div>

                <div className="rk-galleryModalMeta" aria-label="Informasi kegiatan">
                  <div className="rk-galleryModalMetaItem">
                    <FiCalendar aria-hidden="true" />
                    <span>{selected.date}</span>
                  </div>
                  <div className="rk-galleryModalMetaItem">
                    <FiMapPin aria-hidden="true" />
                    <span>{selected.location}</span>
                  </div>
                </div>

                <p className="rk-galleryModalDesc">{selected.detail}</p>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  )
}
