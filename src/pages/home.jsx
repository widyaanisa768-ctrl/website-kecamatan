export { default } from './HomeModern'

/*
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiFacebook,
  FiFileText,
  FiGrid,
  FiHome,
  FiInstagram,
  FiMap,
  FiMenu,
  FiPhoneCall,
  FiSearch,
  FiShield,
  FiUsers,
  FiX,
  FiYoutube,
} from 'react-icons/fi'
import './home.css'

const NAV_ITEMS = [
  { label: 'Beranda', href: '#top' },
  { label: 'Profil Kecamatan', href: '#profil' },
  { label: 'Layanan Online', href: '#layanan' },
  { label: 'Galeri', href: '#galeri' },
  { label: 'Kontak', href: '#kontak' },
]

const SCROLL_THRESHOLD = 10

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const services = useMemo(
    () => [
      {
        title: 'Surat Keterangan Ahli Waris',
        desc: 'Pengajuan surat keterangan untuk keperluan administrasi secara tertib.',
        icon: FiFileText,
      },
      {
        title: 'Surat Rekomendasi Kerja',
        desc: 'Permohonan rekomendasi untuk kebutuhan melamar kerja atau instansi.',
        icon: FiBriefcase,
      },
      {
        title: 'Surat Pindah',
        desc: 'Proses pengajuan pindah domisili dengan alur yang jelas dan cepat.',
        icon: FiHome,
      },
      {
        title: 'Rekomendasi Penelitian / Riset',
        desc: 'Pengajuan rekomendasi untuk kegiatan penelitian di wilayah kecamatan.',
        icon: FiSearch,
      },
      {
        title: 'Rekomendasi Akta Kelahiran',
        desc: 'Pengurusan rekomendasi untuk mendukung penerbitan akta kelahiran.',
        icon: FiCheckCircle,
      },
      {
        title: 'Rekomendasi Kartu Keluarga',
        desc: 'Permohonan rekomendasi untuk perubahan maupun penerbitan KK.',
        icon: FiUsers,
      },
      {
        title: 'Penerbitan Surat Tanah SKT / SKGR',
        desc: 'Pengajuan penerbitan surat keterangan tanah sesuai ketentuan berlaku.',
        icon: FiMap,
      },
      {
        title: 'Rekomendasi Yayasan / Sekolah / Ormas',
        desc: 'Rekomendasi kelembagaan untuk mendukung administrasi dan legalitas.',
        icon: FiShield,
      },
    ],
    []
  )

  const steps = useMemo(
    () => [
      { title: 'Pilih layanan', desc: 'Tentukan jenis layanan yang dibutuhkan.', icon: FiGrid },
      { title: 'Isi formulir', desc: 'Lengkapi data dan unggah berkas pendukung.', icon: FiFileText },
      { title: 'Verifikasi petugas', desc: 'Petugas memeriksa kelengkapan dan validasi.', icon: FiCheckCircle },
      { title: 'Selesai & dipantau', desc: 'Surat selesai, status dapat dipantau kapan saja.', icon: FiBarChart2 },
    ],
    []
  )

  const stats = useMemo(
    () => [
      { value: '24', unit: 'Jam', label: 'Akses informasi', icon: FiClock },
      { value: '8+', unit: 'Layanan', label: 'Tersedia online', icon: FiCheckCircle },
      { value: '100%', unit: 'Lebih', label: 'Transparan', icon: FiShield },
      { value: 'Mudah', unit: '', label: 'Diakses masyarakat', icon: FiPhoneCall },
    ],
    []
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('sptr-noScroll')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('sptr-noScroll')
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="sptr-home" id="top">
      <header
        className="sptr-hero"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2200&q=80')",
        }}
        aria-label="Beranda Sistem Pelayanan Terpadu Kecamatan Rantau Kopar"
      >
        <nav className={`sptr-nav ${scrolled ? 'isScrolled' : ''}`}>
          <div className="sptr-container sptr-navInner">
            <a href="#top" className="sptr-brand" onClick={closeMenu}>
              <span className="sptr-brandMark" aria-hidden="true">
                <span className="sptr-brandMarkInner" />
              </span>
              <span className="sptr-brandText">
                <span className="sptr-brandLine1">Kecamatan Rantau Kopar</span>
                <span className="sptr-brandLine2">Kabupaten Rokan Hilir</span>
              </span>
            </a>

            <div className="sptr-navRight">
              <div className="sptr-links">
                {NAV_ITEMS.map((item) => (
                  <a key={item.label} className="sptr-link" href={item.href}>
                    {item.label}
                  </a>
                ))}
              </div>

              <Link to="/login" className="sptr-loginBtn" aria-label="Login">
                Login
              </Link>

              <button
                type="button"
                className="sptr-burger"
                aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className={`sptr-mobile ${menuOpen ? 'isOpen' : ''}`} role="dialog" aria-modal="true">
            <div className="sptr-mobilePanel">
              <div className="sptr-mobileHeader">
                <span className="sptr-mobileTitle">Menu</span>
                <button type="button" className="sptr-mobileClose" onClick={closeMenu} aria-label="Tutup menu">
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <div className="sptr-mobileLinks">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    className="sptr-mobileLink"
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link to="/login" className="sptr-mobileLink isLogin" onClick={closeMenu}>
                  Login
                </Link>
              </div>
            </div>

            <button type="button" className="sptr-mobileBackdrop" aria-label="Tutup menu" onClick={closeMenu} />
          </div>
        </nav>

        <div className="sptr-container sptr-heroGrid">
          <div className="sptr-heroLeft">
            <div className="sptr-badge">
              <span className="sptr-badgeDot" aria-hidden="true" />
              Pelayanan Publik Digital
            </div>
            <h1 className="sptr-heroTitle">Sistem Pelayanan Terpadu Kecamatan Rantau Kopar</h1>
            <p className="sptr-heroSubtitle">
              Memudahkan masyarakat dalam mengakses layanan administrasi secara cepat, transparan, dan efisien.
            </p>

            <div className="sptr-heroActions">
              <a className="sptr-btn isPrimary" href="#layanan">
                Ajukan Layanan <FiArrowRight aria-hidden="true" />
              </a>
              <Link className="sptr-btn isGhost" to="/login">
                Cek Status Pengajuan
              </Link>
            </div>

            <div className="sptr-heroMeta" aria-label="Ringkasan manfaat layanan">
              <div className="sptr-metaItem">
                <FiCheckCircle aria-hidden="true" />
                <span>Standar layanan jelas</span>
              </div>
              <div className="sptr-metaItem">
                <FiShield aria-hidden="true" />
                <span>Data lebih aman</span>
              </div>
              <div className="sptr-metaItem">
                <FiClock aria-hidden="true" />
                <span>Hemat waktu</span>
              </div>
            </div>
          </div>

          <aside className="sptr-heroCard" aria-label="Informasi layanan">
            <div className="sptr-heroCardHeader">
              <span className="sptr-heroCardTitle">Layanan Tersedia</span>
              <span className="sptr-heroCardPill">Online</span>
            </div>
            <div className="sptr-heroCardGrid">
              <div className="sptr-heroCardStat">
                <div className="sptr-heroCardValue">8+</div>
                <div className="sptr-heroCardLabel">Jenis Surat</div>
              </div>
              <div className="sptr-heroCardStat">
                <div className="sptr-heroCardValue">Mudah</div>
                <div className="sptr-heroCardLabel">Akses</div>
              </div>
              <div className="sptr-heroCardStat">
                <div className="sptr-heroCardValue">Cepat</div>
                <div className="sptr-heroCardLabel">Proses</div>
              </div>
              <div className="sptr-heroCardStat">
                <div className="sptr-heroCardValue">Aktif</div>
                <div className="sptr-heroCardLabel">Pelacakan</div>
              </div>
            </div>
            <div className="sptr-heroCardList" aria-label="Fitur utama">
              <div className="sptr-heroCardRow">
                <FiCheckCircle aria-hidden="true" />
                Formulir online terstruktur
              </div>
              <div className="sptr-heroCardRow">
                <FiBarChart2 aria-hidden="true" />
                Pelacakan status pengajuan
              </div>
              <div className="sptr-heroCardRow">
                <FiShield aria-hidden="true" />
                Notifikasi dan transparansi
              </div>
            </div>
          </aside>
        </div>

        <svg className="sptr-heroWave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            fill="var(--sptr-bg)"
          />
        </svg>
      </header>

      <main>
        <section className="sptr-section" id="layanan" aria-label="Layanan Online">
          <div className="sptr-container">
            <div className="sptr-sectionHead">
              <p className="sptr-sectionEyebrow">Layanan Online</p>
              <h2 className="sptr-sectionTitle">Layanan Unggulan untuk Masyarakat</h2>
              <p className="sptr-sectionDesc">
                Akses layanan administrasi kecamatan dari mana saja dengan tampilan yang jelas dan alur pengajuan yang
                terarah.
              </p>
            </div>

            <div className="sptr-gridServices">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <article key={service.title} className="sptr-card sptr-serviceCard">
                    <div className="sptr-serviceTop">
                      <span className="sptr-serviceIconWrap" aria-hidden="true">
                        <Icon className="sptr-serviceIcon" />
                      </span>
                      <h3 className="sptr-serviceTitle">{service.title}</h3>
                    </div>
                    <p className="sptr-serviceDesc">{service.desc}</p>
                    <div className="sptr-serviceActions">
                      <Link to="/login" className="sptr-miniBtn">
                        Ajukan <FiArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="sptr-section isAlt" id="alur" aria-label="Alur Pelayanan">
          <div className="sptr-container">
            <div className="sptr-sectionHead">
              <p className="sptr-sectionEyebrow">Alur Pelayanan</p>
              <h2 className="sptr-sectionTitle">Proses Pengajuan yang Ringkas</h2>
              <p className="sptr-sectionDesc">Empat langkah sederhana untuk memastikan layanan lebih cepat dan rapi.</p>
            </div>

            <div className="sptr-steps">
              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="sptr-stepCard">
                    <div className="sptr-stepIconRow">
                      <span className="sptr-stepNo" aria-hidden="true">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="sptr-stepIconWrap" aria-hidden="true">
                        <Icon />
                      </span>
                    </div>
                    <h3 className="sptr-stepTitle">{step.title}</h3>
                    <p className="sptr-stepDesc">{step.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="sptr-section" id="profil" aria-label="Profil Singkat Kecamatan">
          <div className="sptr-container">
            <div className="sptr-profile">
              <div className="sptr-profileMedia" aria-hidden="true">
                <img
                  className="sptr-profileImg"
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80"
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="sptr-profileContent">
                <p className="sptr-sectionEyebrow">Informasi Kecamatan</p>
                <h2 className="sptr-sectionTitle">Profil Singkat Kecamatan</h2>
                <p className="sptr-sectionDesc">
                  Kecamatan Rantau Kopar berkomitmen menghadirkan pelayanan administratif yang profesional, terukur,
                  serta mudah diakses melalui transformasi digital pelayanan publik.
                </p>
                <ul className="sptr-bullets">
                  <li>Pelayanan administratif yang tertib dan terstandar</li>
                  <li>Akses informasi publik yang lebih jelas</li>
                  <li>Dukungan layanan masyarakat yang responsif</li>
                  <li>Transformasi digital untuk efisiensi proses</li>
                </ul>
                <a className="sptr-btn isOutline" href="#kontak">
                  Lihat Profil Kecamatan <FiArrowRight aria-hidden="true" />
                </a>
              </div>
            </div>

            <div id="galeri" className="sptr-galleryAnchor" aria-hidden="true" />
            <div className="sptr-gallery" aria-label="Galeri Kegiatan">
              <div className="sptr-galleryHead">
                <h3 className="sptr-galleryTitle">Galeri Kegiatan</h3>
                <p className="sptr-galleryDesc">Dokumentasi singkat kegiatan pelayanan dan aktivitas kecamatan.</p>
              </div>
              <div className="sptr-galleryGrid">
                {[
                  'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
                  'https://images.unsplash.com/photo-1562577309-2592ab84b1bc?auto=format&fit=crop&w=900&q=80',
                ].map((src) => (
                  <div key={src} className="sptr-galleryItem">
                    <img src={src} alt="" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="sptr-section isStats" id="statistik" aria-label="Statistik Layanan">
          <div className="sptr-container">
            <div className="sptr-statsHead">
              <div>
                <p className="sptr-sectionEyebrow">Keunggulan Layanan</p>
                <h2 className="sptr-sectionTitle">Lebih Transparan, Lebih Mudah</h2>
                <p className="sptr-sectionDesc">
                  Portal pelayanan publik yang mendukung keterbukaan informasi dan pengalaman masyarakat yang lebih
                  baik.
                </p>
              </div>
            </div>

            <div className="sptr-statsGrid">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="sptr-statCard">
                    <div className="sptr-statIcon" aria-hidden="true">
                      <Icon />
                    </div>
                    <div className="sptr-statValue">
                      {item.value}
                      {item.unit ? <span className="sptr-statUnit">{item.unit}</span> : null}
                    </div>
                    <div className="sptr-statLabel">{item.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="sptr-section" id="cta" aria-label="Ajukan Layanan Sekarang">
          <div className="sptr-container">
            <div className="sptr-cta">
              <div className="sptr-ctaText">
                <h2 className="sptr-ctaTitle">Butuh layanan administrasi?</h2>
                <p className="sptr-ctaDesc">
                  Ajukan permohonan Anda secara online tanpa harus datang langsung ke kantor. Proses lebih rapi, mudah,
                  dan dapat dipantau.
                </p>
              </div>
              <div className="sptr-ctaActions">
                <Link to="/login" className="sptr-btn isPrimary">
                  Mulai Pengajuan <FiArrowRight aria-hidden="true" />
                </Link>
                <a href="#kontak" className="sptr-btn isGhost">
                  Hubungi Kami
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="sptr-footer" id="kontak" aria-label="Footer">
        <div className="sptr-container sptr-footerGrid">
          <div className="sptr-footerCol">
            <div className="sptr-footerBrand">
              <span className="sptr-brandMark isFooter" aria-hidden="true">
                <span className="sptr-brandMarkInner" />
              </span>
              <div className="sptr-footerBrandText">
                <div className="sptr-footerBrandLine1">Kecamatan Rantau Kopar</div>
                <div className="sptr-footerBrandLine2">Kabupaten Rokan Hilir</div>
              </div>
            </div>
            <p className="sptr-footerDesc">
              Jl. Raya Kecamatan Rantau Kopar, Kabupaten Rokan Hilir, Riau (data alamat dummy).
            </p>
            <div className="sptr-socialRow" aria-label="Sosial Media">
              <a className="sptr-socialBtn" href="#" aria-label="Instagram">
                <FiInstagram aria-hidden="true" />
              </a>
              <a className="sptr-socialBtn" href="#" aria-label="Facebook">
                <FiFacebook aria-hidden="true" />
              </a>
              <a className="sptr-socialBtn" href="#" aria-label="YouTube">
                <FiYoutube aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="sptr-footerCol">
            <p className="sptr-footerTitle">Navigasi</p>
            <div className="sptr-footerLinks">
              {NAV_ITEMS.map((item) => (
                <a key={item.label} className="sptr-footerLink" href={item.href}>
                  {item.label}
                </a>
              ))}
              <a className="sptr-footerLink" href="#alur">
                Alur Pelayanan
              </a>
            </div>
          </div>

          <div className="sptr-footerCol">
            <p className="sptr-footerTitle">Kontak</p>
            <div className="sptr-footerContact">
              <div className="sptr-contactRow">
                <FiPhoneCall aria-hidden="true" />
                <span>(0000) 000-000</span>
              </div>
              <div className="sptr-contactRow">
                <FiArrowRight aria-hidden="true" />
                <span>kecamatan.rantaukopar@rokanhilir.go.id</span>
              </div>
            </div>
            <Link to="/login" className="sptr-footerLogin">
              Login Admin <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="sptr-container sptr-footerBottom">
          <div className="sptr-footerLine" />
          <p className="sptr-footerCopy">© {new Date().getFullYear()} Kecamatan Rantau Kopar. Seluruh hak cipta.</p>
        </div>
      </footer>
    </div>
  )
}
*/
