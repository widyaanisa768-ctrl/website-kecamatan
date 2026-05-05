import { FiBarChart2, FiCheckCircle, FiMapPin, FiUsers } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Profil.css'

export default function Profil() {
  const administrativeAreas = [
    'Kelurahan Rantau Kopar',
    'Kelurahan Sungai Rangau',
    'Kepenghuluan Sekapas',
    'Kepenghuluan Bagan Cempedak',
  ]

  const quickData = [
    { label: 'Jumlah penduduk', value: '6.774', unit: 'jiwa' },
    { label: 'SD/sederajat', value: '6', unit: 'unit' },
    { label: 'SMP/sederajat', value: '2', unit: 'unit' },
    { label: 'SMA/sederajat', value: '1', unit: 'unit' },
    { label: 'Puskesmas', value: '1', unit: 'unit' },
    { label: 'Posyandu', value: '6', unit: 'unit' },
  ]

  return (
    <div className="rk-portal rk-pageProfil">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Profil Kecamatan">
          <div className="rk-container rk-pageHeaderInner">
            <h1 className="rk-pageTitle">Profil Kecamatan</h1>
            <p className="rk-pageSubtitle">Informasi ringkas Kecamatan Rantau Kopar</p>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Profil singkat">
          <div className="rk-container">
            <div className="rk-profilGrid">
              <div className="rk-profilMedia" aria-hidden="true">
                <img
                  src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80"
                  alt=""
                  loading="lazy"
                />
              </div>
              <article className="rk-profilCard">
                <p className="rk-eyebrow">Profil Singkat</p>
                <h2 className="rk-sectionTitle">Kecamatan Rantau Kopar</h2>
                <p className="rk-sectionDesc">
                  Kecamatan Rantau Kopar merupakan salah satu wilayah administratif di Kabupaten Rokan Hilir yang terus
                  berkomitmen meningkatkan kualitas pelayanan publik kepada masyarakat.
                </p>
                <div className="rk-profilHighlights" aria-label="Sorotan">
                  <div className="rk-profilHighlight">
                    <FiUsers aria-hidden="true" />
                    Pelayanan masyarakat
                  </div>
                  <div className="rk-profilHighlight">
                    <FiCheckCircle aria-hidden="true" />
                    Proses lebih tertib
                  </div>
                  <div className="rk-profilHighlight">
                    <FiBarChart2 aria-hidden="true" />
                    Transparan & terukur
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="rk-pageSection rk-pageAlt" aria-label="Gambaran wilayah">
          <div className="rk-container">
            <div className="rk-sectionHeadCompact">
              <p className="rk-eyebrow">Wilayah</p>
              <h2 className="rk-sectionTitle">Gambaran Wilayah</h2>
              <p className="rk-sectionDesc">
                Secara administratif, Kecamatan Rantau Kopar terdiri dari dua kelurahan dan dua kepenghuluan, dengan
                potensi wilayah pada sektor pertanian, perkebunan, dan perikanan.
              </p>
            </div>

            <div className="rk-grid2">
              <article className="rk-surfaceCard">
                <h3 className="rk-h3">Wilayah Administratif</h3>
                <ul className="rk-bulletList">
                  {administrativeAreas.map((area) => (
                    <li key={area}>
                      <FiCheckCircle aria-hidden="true" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <aside className="rk-mapCard" aria-label="Peta (placeholder)">
                <div className="rk-mapHead">
                  <div className="rk-mapTitle">Peta Wilayah</div>
                  <div className="rk-mapHint">Placeholder peta, dapat diganti embed peta resmi.</div>
                </div>
                <div className="rk-mapBox" role="img" aria-label="Placeholder peta wilayah">
                  <div className="rk-mapOverlay">
                    <FiMapPin aria-hidden="true" />
                    <span>Rantau Kopar</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="rk-pageSection" aria-label="Data singkat">
          <div className="rk-container">
            <div className="rk-sectionHeadCompact">
              <p className="rk-eyebrow">Data</p>
              <h2 className="rk-sectionTitle">Data Singkat</h2>
              <p className="rk-sectionDesc">Ringkasan data fasilitas dan demografi</p>
            </div>

            <div className="rk-dataGrid">
              {quickData.map((item) => (
                <div key={item.label} className="rk-dataCard">
                  <div className="rk-dataLabel">{item.label}</div>
                  <div className="rk-dataValue">
                    {item.value} <span className="rk-dataUnit">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rk-pageSection rk-pageAlt" aria-label="Komitmen pelayanan">
          <div className="rk-container">
            <div className="rk-commitCard">
              <div className="rk-commitIcon" aria-hidden="true">
                <FiCheckCircle />
              </div>
              <div>
                <p className="rk-eyebrow">Komitmen</p>
                <h2 className="rk-sectionTitle">Komitmen Pelayanan</h2>
                <p className="rk-sectionDesc">
                  Kami berkomitmen memberikan pelayanan publik yang profesional, transparan, dan mudah diakses untuk
                  mendukung kebutuhan masyarakat Kecamatan Rantau Kopar.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

