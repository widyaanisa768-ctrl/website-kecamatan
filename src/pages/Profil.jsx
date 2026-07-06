import { FiBarChart2, FiCheckCircle, FiCompass, FiExternalLink, FiInfo, FiMap, FiUsers } from 'react-icons/fi'
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
              <div className="rk-profilCollage" aria-label="Dokumentasi Kantor Camat Rantau Kopar">
                <figure className="rk-profilPhoto rk-profilPhotoMain">
                  <img
                    src="/images/kantor-rantau-kopar-1.jpeg"
                    alt="Dokumentasi Kecamatan Rantau Kopar di depan kantor camat"
                    loading="lazy"
                  />
                </figure>
                <figure className="rk-profilPhoto rk-profilPhotoSide">
                  <img
                    src="/images/kantor-rantau-kopar-2.jpeg"
                    alt="Aparatur Kecamatan Rantau Kopar pada kegiatan pelayanan"
                    loading="lazy"
                  />
                </figure>
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
                  <div className="rk-profilHighlight">
                    <FiInfo aria-hidden="true" />
                    Akses informasi mudah
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="rk-pageSection rk-pageAlt rk-wilayahSection" aria-label="Gambaran wilayah">
          <div className="rk-container">
            <div className="rk-sectionHeadCompact">
              <p className="rk-eyebrow">Wilayah</p>
              <h2 className="rk-sectionTitle">Gambaran Wilayah</h2>
            </div>

            <article className="rk-wilayahIntroCard">
              <p>
                Secara administratif, Kecamatan Rantau Kopar terdiri dari dua kelurahan dan dua kepenghuluan, dengan
                potensi wilayah pada sektor pertanian, perkebunan, dan perikanan.
              </p>
            </article>

            <div className="rk-wilayahLayout">
              <div className="rk-wilayahLeftColumn">
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

                <article className="rk-surfaceCard rk-characteristicsCard">
                  <h3 className="rk-h3">Karakteristik Wilayah</h3>

                  <div className="rk-characterSection">
                    <div className="rk-characterSubhead">
                      <span className="rk-characterIcon" aria-hidden="true">
                        <FiMap />
                      </span>
                      <h4 className="rk-characterTitle">Letak dan Potensi Wilayah</h4>
                    </div>
                    <p className="rk-characterText">
                      Kecamatan Rantau Kopar berada pada jalur perbatasan Kabupaten Bengkalis dan Kabupaten Rokan Hulu
                      serta berada di kawasan Daerah Aliran Sungai Rokan. Wilayah ini didominasi dataran rendah dengan
                      potensi pengembangan pertanian dan perkebunan.
                    </p>
                  </div>

                  <div className="rk-characterDivider" aria-hidden="true" />

                  <div className="rk-characterSection">
                    <div className="rk-characterSubhead">
                      <span className="rk-characterIcon" aria-hidden="true">
                        <FiCompass />
                      </span>
                      <h4 className="rk-characterTitle">Batas Wilayah</h4>
                    </div>
                    <ul className="rk-boundaryList">
                      <li>
                        <FiCompass aria-hidden="true" />
                        <span>
                          <strong>Utara:</strong> Kecamatan Tanah Putih dan Kabupaten Bengkalis
                        </span>
                      </li>
                      <li>
                        <FiCompass aria-hidden="true" />
                        <span>
                          <strong>Selatan:</strong> Kabupaten Bengkalis dan Kabupaten Rokan Hulu
                        </span>
                      </li>
                      <li>
                        <FiCompass aria-hidden="true" />
                        <span>
                          <strong>Barat:</strong> Kecamatan Tanah Putih
                        </span>
                      </li>
                      <li>
                        <FiCompass aria-hidden="true" />
                        <span>
                          <strong>Timur:</strong> Kabupaten Bengkalis
                        </span>
                      </li>
                    </ul>
                  </div>

                </article>
              </div>

              <aside className="rk-mapCard" aria-label="Lokasi kantor kecamatan">
                <div className="rk-mapHead">
                  <div className="rk-mapTitle">Lokasi Kantor Kecamatan</div>
                  <div className="rk-mapHint">
                    Kantor Camat Rantau Kopar, Kecamatan Rantau Kopar, Kabupaten Rokan Hilir, Riau.
                  </div>
                </div>

                <div className="rk-mapFrame">
                  <iframe
                    title="Lokasi Kantor Camat Rantau Kopar"
                    src="https://www.google.com/maps?q=Kantor+Camat+Rantau+Kopar,+Rokan+Hilir,+Riau&output=embed"
                    loading="lazy"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="rk-mapActions">
                  <a
                    className="rk-mapLink"
                    href="https://www.google.com/maps/search/?api=1&query=Kantor+Camat+Rantau+Kopar,+Rokan+Hilir,+Riau"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiExternalLink aria-hidden="true" />
                    <span>Buka di Google Maps</span>
                  </a>
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
