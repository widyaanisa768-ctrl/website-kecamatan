import { FiClock, FiExternalLink, FiInfo, FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Kontak.css'

export default function Kontak() {
  return (
    <div className="rk-portal rk-pageKontak">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Kontak">
          <div className="rk-container rk-pageHeaderInner rk-contactHero">
            <div className="rk-contactHeroLeft">
              <p className="rk-pageKicker">Kontak</p>
              <h1 className="rk-pageTitle">Kontak Kami</h1>
              <p className="rk-pageSubtitle">
                Hubungi kami untuk informasi pelayanan administrasi, konsultasi persyaratan, maupun saran perbaikan
                layanan. Pesan Anda akan kami tindak lanjuti sesuai jam kerja.
              </p>

              <p className="rk-contactHeroNote">
                Silakan gunakan informasi kontak dan lokasi di bawah untuk menghubungi atau mengunjungi Kantor Camat
                Rantau Kopar sesuai kebutuhan pelayanan.
              </p>
            </div>

            <div className="rk-contactHeroRight">
              <div className="rk-contactHeroVisual">
                <img src="/images/kantor1.png" alt="Kantor Camat Rantau Kopar" loading="lazy" />
                <div className="rk-contactHeroBadge">Pelayanan Publik</div>
              </div>
            </div>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Informasi kontak dan lokasi kantor">
          <div className="rk-container">
            <div className="rk-contactGrid">
              <article className="rk-contactInfoPanel" aria-label="Informasi kontak kantor">
                <div className="rk-contactPanelHead">
                  <p className="rk-contactPanelKicker">Informasi Kontak Kantor</p>
                  <h2 className="rk-contactPanelTitle">Kantor Camat Rantau Kopar</h2>
                  <p className="rk-contactPanelDesc">
                    Informasi resmi kantor kecamatan untuk masyarakat yang membutuhkan layanan, konsultasi
                    persyaratan, dan koordinasi pelayanan publik.
                  </p>
                </div>

                <div className="rk-contactInfoCard">
                  <div className="rk-contactInfoList">
                    <article className="rk-contactInfoItem">
                      <div className="rk-contactIcon" aria-hidden="true">
                        <FiMapPin />
                      </div>
                      <div>
                        <div className="rk-contactTitle">Alamat</div>
                        <div className="rk-contactText">
                          Kantor Camat Rantau Kopar, Kecamatan Rantau Kopar, Kabupaten Rokan Hilir, Riau
                        </div>
                      </div>
                    </article>

                    <article className="rk-contactInfoItem">
                      <div className="rk-contactIcon" aria-hidden="true">
                        <FiMail />
                      </div>
                      <div>
                        <div className="rk-contactTitle">Email</div>
                        <div className="rk-contactText">rantaukopar.kecamatan@rohilkab.go.id</div>
                      </div>
                    </article>

                    <article className="rk-contactInfoItem">
                      <div className="rk-contactIcon" aria-hidden="true">
                        <FiPhone />
                      </div>
                      <div>
                        <div className="rk-contactTitle">Telepon</div>
                        <div className="rk-contactText">+2034 4040 3030</div>
                      </div>
                    </article>

                    <article className="rk-contactInfoItem">
                      <div className="rk-contactIcon" aria-hidden="true">
                        <FiClock />
                      </div>
                      <div>
                        <div className="rk-contactTitle">Jam Layanan</div>
                        <div className="rk-contactText">Senin-Jumat, 08.00-16.00 WIB</div>
                      </div>
                    </article>

                    <article className="rk-contactInfoItem">
                      <div className="rk-contactIcon" aria-hidden="true">
                        <FiInfo />
                      </div>
                      <div>
                        <div className="rk-contactTitle">Catatan</div>
                        <div className="rk-contactText">
                          Untuk informasi pelayanan dan persyaratan, masyarakat dapat menghubungi Kantor Camat Rantau
                          Kopar pada jam kerja.
                        </div>
                      </div>
                    </article>
                  </div>
                </div>
              </article>

              <aside className="rk-mapCard" aria-label="Lokasi kantor kecamatan">
                <div className="rk-mapTop">
                  <div className="rk-mapBadge">Lokasi pelayanan publik</div>
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
      </main>

      <Footer />
    </div>
  )
}
