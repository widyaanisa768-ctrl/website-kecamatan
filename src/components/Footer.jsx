import { NavLink } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiMail, FiMapPin, FiPhone, FiYoutube } from 'react-icons/fi'
import './Footer.css'

const FOOTER_LINKS = [
  { label: 'Beranda', to: '/home' },
  { label: 'Profil Kecamatan', to: '/profil' },
  { label: 'Layanan Online', to: '/layanan' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

export default function Footer() {
  return (
    <footer className="rk-footer" aria-label="Footer">
      <div className="rk-container rk-footerGrid">
        <div className="rk-footerCol">
          <div className="rk-footerBrand">
  <img
    src="/images/logo-rohil.png"
    alt="Logo Kabupaten Rokan Hilir"
    className="rk-footerLogo"
  />
  <div className="rk-footerBrandText">
    <strong>Kecamatan Rantau Kopar</strong>
    <span>Kabupaten Rokan Hilir</span>
  </div>
</div>
          <p className="rk-footerDesc">
            Portal pelayanan publik digital untuk mendukung layanan administratif yang cepat, transparan, dan mudah
            diakses masyarakat.
          </p>

          <div className="rk-footerMeta" aria-label="Alamat dan kontak singkat">
            <div className="rk-footerMetaRow">
              <FiMapPin aria-hidden="true" />
              <span>Rantau Kopar, Kabupaten Rokan Hilir, Riau</span>
            </div>
            <div className="rk-footerMetaRow">
              <FiPhone aria-hidden="true" />
              <span>(0000) 000-000</span>
            </div>
            <div className="rk-footerMetaRow">
              <FiMail aria-hidden="true" />
              <span>kecamatan.rantaukopar@rokanhilir.go.id</span>
            </div>
          </div>

          <div className="rk-footerSocial" aria-label="Sosial media">
            <a className="rk-socialBtn" href="#" aria-label="Instagram">
              <FiInstagram aria-hidden="true" />
            </a>
            <a className="rk-socialBtn" href="#" aria-label="Facebook">
              <FiFacebook aria-hidden="true" />
            </a>
            <a className="rk-socialBtn" href="#" aria-label="YouTube">
              <FiYoutube aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="rk-footerCol">
          <p className="rk-footerTitle">Navigasi Cepat</p>
          <div className="rk-footerLinks">
            {FOOTER_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className="rk-footerLink">
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/login" className="rk-footerLink">
              Login
            </NavLink>
          </div>
        </div>

        <div className="rk-footerCol">
          <p className="rk-footerTitle">Informasi</p>
          <div className="rk-footerInfo">
            <div className="rk-footerInfoCard">
              <div className="rk-footerInfoLabel">Jam Layanan</div>
              <div className="rk-footerInfoValue">Senin – Jumat (08.00 – 16.00)</div>
            </div>
            <div className="rk-footerInfoCard">
              <div className="rk-footerInfoLabel">Layanan Online</div>
              <div className="rk-footerInfoValue">Akses informasi 24 jam</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rk-container rk-footerBottom">
        <div className="rk-footerLine" />
        <p className="rk-footerCopy">© {new Date().getFullYear()} Kecamatan Rantau Kopar. Seluruh hak cipta.</p>
      </div>
    </footer>
  )
}

