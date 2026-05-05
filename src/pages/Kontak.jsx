import { useState } from 'react'
import { FiClock, FiGlobe, FiInfo, FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Kontak.css'

export default function Kontak() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    window.setTimeout(() => setSent(false), 3500)
  }

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

              <div className="rk-contactHeroInfo" aria-label="Informasi layanan">
                <div className="rk-heroChip">
                  <FiClock aria-hidden="true" /> Jam layanan: Senin–Jumat 08.00–16.00
                </div>
                <div className="rk-heroChip">
                  <FiGlobe aria-hidden="true" /> Layanan online: akses informasi 24 jam
                </div>
                <div className="rk-heroChip">
                  <FiInfo aria-hidden="true" /> Catatan: Pesan akan ditindaklanjuti oleh petugas kecamatan.
                </div>
              </div>
            </div>

            <div className="rk-contactHeroRight">
              <div className="rk-contactHeroVisual">
                <img src="/images/kantor1.png" alt="Kantor Camat Rantau Kopar" loading="lazy" />
                <div className="rk-contactHeroBadge">Pelayanan Publik</div>
              </div>
            </div>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Informasi kontak dan formulir">
          <div className="rk-container">
            <div className="rk-contactCardsGrid" aria-label="Informasi kontak">
              <article className="rk-contactCard">
                <div className="rk-contactIcon" aria-hidden="true">
                  <FiMapPin />
                </div>
                <div>
                  <div className="rk-contactTitle">Alamat</div>
                  <div className="rk-contactText">Jalan Lintas Rantau Kopar</div>
                </div>
              </article>
              <article className="rk-contactCard">
                <div className="rk-contactIcon" aria-hidden="true">
                  <FiMail />
                </div>
                <div>
                  <div className="rk-contactTitle">Email</div>
                  <div className="rk-contactText">rantaukopar.kecamatan@rohilkab.go.id</div>
                </div>
              </article>
              <article className="rk-contactCard">
                <div className="rk-contactIcon" aria-hidden="true">
                  <FiPhone />
                </div>
                <div>
                  <div className="rk-contactTitle">Telepon</div>
                  <div className="rk-contactText">+2034 4040 3030</div>
                </div>
              </article>
            </div>

            <div className="rk-contactGrid">
              <article className="rk-formCard" aria-label="Form kontak">
                <div className="rk-formHead">
                  <h2 className="rk-formTitle">Form Kontak</h2>
                  <p className="rk-formDesc">
                    Form ini bersifat dummy (belum terhubung backend). Pesan akan ditindaklanjuti oleh petugas
                    kecamatan.
                  </p>
                </div>

                <form className="rk-form" onSubmit={onSubmit}>
                  <label className="rk-field">
                    <span className="rk-label">Nama</span>
                    <input className="rk-input" name="nama" placeholder="Nama lengkap" required />
                  </label>

                  <label className="rk-field">
                    <span className="rk-label">Email</span>
                    <input className="rk-input" type="email" name="email" placeholder="nama@email.com" required />
                  </label>

                  <label className="rk-field">
                    <span className="rk-label">Pesan</span>
                    <textarea className="rk-textarea" name="pesan" placeholder="Tulis pesan Anda..." rows={5} required />
                  </label>

                  <div className="rk-formActions">
                    <button type="submit" className="rk-submitBtn">
                      Kirim Pesan <FiSend aria-hidden="true" />
                    </button>
                    {sent ? <span className="rk-sentHint">Pesan terkirim (dummy).</span> : null}
                  </div>
                </form>
              </article>

              <aside className="rk-mapCard" aria-label="Lokasi">
                <div className="rk-mapTop">
                  <div className="rk-mapTitle">Lokasi Kantor (Placeholder)</div>
                  <div className="rk-mapHint">Area ini dapat diganti dengan embed Google Maps.</div>
                </div>
                <div className="rk-mapBox" role="img" aria-label="Placeholder peta">
                  <div className="rk-mapOverlay">
                    <FiMapPin aria-hidden="true" />
                    <span>Kecamatan Rantau Kopar</span>
                  </div>
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
