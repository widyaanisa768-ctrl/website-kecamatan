import { useEffect, useState } from 'react'
import { FiCalendar, FiMapPin, FiX } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getGaleriPublic, resolveGalleryImageUrl } from '../services/galeriService'
import './Galeri.css'

function normalizeTipeTampilan(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function toDisplayItem(item) {
  return {
    id: String(item?.id_galeri || item?.id || item?._id || item?.judul || ''),
    title: String(item?.judul || '').trim(),
    desc: String(item?.deskripsi_singkat || '').trim(),
    detail: String(item?.deskripsi_detail || item?.deskripsi_singkat || '').trim(),
    date: String(item?.tanggal_kegiatan || '').trim() || 'Tanggal kegiatan dapat diperbarui',
    location: String(item?.lokasi || '').trim() || 'Kecamatan Rantau Kopar',
    img: resolveGalleryImageUrl(item?.foto_url),
    order: Number(item?.urutan_tampil) || 0,
    displayType: normalizeTipeTampilan(item?.tipe_tampilan),
  }
}

function sortByOrderAsc(items) {
  return [...items].sort((a, b) => a.order - b.order)
}

export default function Galeri() {
  const [heroItems, setHeroItems] = useState([])
  const [galleryItems, setGalleryItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

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

  useEffect(() => {
    let active = true

    async function loadGaleri() {
      setLoading(true)
      setError('')

      const res = await getGaleriPublic()
      if (!active) return

      if (!res?.success) {
        setHeroItems([])
        setGalleryItems([])
        setSelected(null)
        setError(res?.message || 'Galeri belum dapat dimuat. Silakan coba lagi.')
        setLoading(false)
        return
      }

      const items = Array.isArray(res?.items) ? res.items.map(toDisplayItem) : []
      const orderedItems = sortByOrderAsc(items)
      const nextHeroItems = orderedItems.filter((item) => item.displayType === 'hero' && item.img).slice(0, 4)
      const nextGalleryItems = orderedItems.filter((item) => item.displayType === 'card').slice(0, 6)

      setHeroItems(nextHeroItems)
      setGalleryItems(nextGalleryItems)
      setError('')
      setLoading(false)
    }

    void loadGaleri()

    return () => {
      active = false
    }
  }, [])

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

            {heroItems.length > 0 ? (
              <div className="rk-galeriHeroRight" aria-hidden="true">
                <div className="rk-galeriCollage">
                  <div className="rk-galeriCollageGrid">
                    {heroItems.map((item) => (
                      <div key={item.id || item.title} className="rk-galeriCollageItem">
                        {item.img ? <img src={item.img} alt={item.title} loading="lazy" /> : null}
                      </div>
                    ))}
                  </div>
                  <div className="rk-galeriCollageBadge">Dokumentasi Resmi</div>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Grid galeri">
          <div className="rk-container">
            {loading ? (
              <p>Memuat dokumentasi kegiatan...</p>
            ) : error ? (
              <p>Galeri belum dapat dimuat. Silakan coba lagi.</p>
            ) : galleryItems.length === 0 ? (
              <p>Belum ada dokumentasi kegiatan yang tersedia.</p>
            ) : (
              <div className="rk-galleryGridFull">
                {galleryItems.map((item) => (
                  <article key={item.id || item.title} className="rk-galleryCard">
                    <div className="rk-galleryMedia" aria-hidden="true">
                      {item.img ? <img src={item.img} alt={item.title} loading="lazy" /> : null}
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
            )}
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
                {selected.img ? <img src={selected.img} alt={selected.title} /> : null}
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
