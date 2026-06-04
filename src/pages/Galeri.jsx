import { useEffect, useMemo, useState } from 'react'
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Galeri.css'

const GALLERY_ITEMS = [
  {
    title: 'Penyerahan Bantuan Sembako',
    desc: 'Kegiatan penyaluran bantuan kepada warga yang membutuhkan.',
    detail:
      'Dokumentasi penyerahan bantuan sembako kepada warga. Kegiatan ini bertujuan memastikan bantuan tepat sasaran serta mendorong koordinasi yang rapi antara perangkat kecamatan dan unsur masyarakat.',
    date: '18 April 2026',
    location: 'Kantor Camat Rantau Kopar',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Musyawarah Warga',
    desc: 'Dialog dan penyampaian aspirasi untuk solusi bersama.',
    detail:
      'Dokumentasi musyawarah bersama warga dalam rangka menyerap aspirasi dan memperkuat kolaborasi. Hasil musyawarah menjadi bahan koordinasi tindak lanjut di tingkat kecamatan.',
    date: '09 April 2026',
    location: 'Aula Kecamatan Rantau Kopar',
    img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Pelayanan Administrasi',
    desc: 'Pendampingan pengurusan dokumen di loket pelayanan.',
    detail:
      'Dokumentasi pelayanan administrasi di loket. Petugas membantu proses pengajuan, pemeriksaan berkas, serta memberikan informasi persyaratan agar warga mendapatkan layanan yang jelas dan tertib.',
    date: '27 Maret 2026',
    location: 'Loket Pelayanan Kecamatan',
    img: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Rapat Koordinasi',
    desc: 'Koordinasi internal untuk peningkatan mutu pelayanan.',
    detail:
      'Dokumentasi rapat koordinasi internal untuk memastikan standar pelayanan berjalan konsisten. Agenda meliputi evaluasi, pembagian tugas, dan peningkatan kualitas layanan terpadu.',
    date: '20 Maret 2026',
    location: 'Ruang Rapat Kecamatan',
    img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kunjungan Lapangan',
    desc: 'Monitoring kegiatan dan kondisi wilayah secara berkala.',
    detail:
      'Dokumentasi kunjungan lapangan untuk monitoring kegiatan dan kondisi wilayah. Kegiatan ini dilakukan secara berkala sebagai bagian dari pelayanan dan koordinasi lintas sektor.',
    date: '12 Maret 2026',
    location: 'Wilayah Kecamatan Rantau Kopar',
    img: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Sosial Kecamatan',
    desc: 'Kolaborasi kecamatan dan masyarakat dalam kegiatan sosial.',
    detail:
      'Dokumentasi kegiatan sosial bersama masyarakat. Program sosial ini menjadi salah satu wujud kepedulian serta penguatan sinergi antara pemerintah kecamatan dan warga.',
    date: '05 Maret 2026',
    location: 'Lingkungan Masyarakat',
    img: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Dokumentasi Kantor',
    desc: 'Lingkungan kantor dan sarana pendukung pelayanan publik.',
    detail:
      'Dokumentasi lingkungan kantor, sarana, dan prasarana pendukung pelayanan publik. Informasi ini ditampilkan untuk memberikan gambaran fasilitas dan kesiapan layanan di kantor kecamatan.',
    date: '25 Februari 2026',
    location: 'Kantor Camat Rantau Kopar',
    img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Pelayanan Masyarakat',
    desc: 'Pendampingan dan informasi layanan untuk warga.',
    detail:
      'Dokumentasi pendampingan dan penyampaian informasi layanan kepada warga. Petugas memberikan arahan terkait alur pengajuan, kelengkapan berkas, serta estimasi waktu layanan.',
    date: '19 Februari 2026',
    location: 'Ruang Pelayanan',
    img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Kegiatan Resmi Lainnya',
    desc: 'Agenda resmi dan kegiatan lintas sektor di wilayah kecamatan.',
    detail:
      'Dokumentasi agenda resmi dan kegiatan lintas sektor. Kegiatan dilakukan untuk memperkuat koordinasi, pelaksanaan program pemerintah, serta sinergi dengan pihak terkait.',
    date: '11 Februari 2026',
    location: 'Kecamatan Rantau Kopar',
    img: 'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?auto=format&fit=crop&w=1200&q=80',
  },
]

const ID_MONTHS = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
}

function getGalleryTime(item) {
  const rawDate = item?.date || item?.tanggal || item?.created_at || item?.createdAt || ''
  if (!rawDate) return 0

  const parsed = new Date(rawDate).getTime()
  if (Number.isFinite(parsed)) return parsed

  const match = String(rawDate)
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/)
  if (!match) return 0

  const [, day, monthName, year] = match
  const month = ID_MONTHS[monthName]
  if (month === undefined) return 0
  return new Date(Number(year), month, Number(day)).getTime()
}

export default function Galeri() {
  const [selected, setSelected] = useState(null)

  const heroThumbs = useMemo(() => GALLERY_ITEMS.slice(0, 4), [])
  const limitedGalleryItems = useMemo(
    () => [...GALLERY_ITEMS].sort((a, b) => getGalleryTime(b) - getGalleryTime(a)).slice(0, 6),
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
                      <img src={item.img} alt="" loading="lazy" />
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
              {limitedGalleryItems.map((item) => (
                <article key={item.title} className="rk-galleryCard">
                  <div className="rk-galleryMedia" aria-hidden="true">
                    <img src={item.img} alt="" loading="lazy" />
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
