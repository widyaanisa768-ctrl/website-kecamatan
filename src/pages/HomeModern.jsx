import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiGrid,
  FiHome,
  FiInfo,
  FiMap,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAuth } from '../lib/rkLocal'
import './HomeModern.css'

function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getDisplayName(auth, storedUser) {
  const base = { ...(storedUser || {}), ...(auth || {}) }
  return base.nama || base.name || base.nama_lengkap || base.username || 'Pengguna'
}

function readHomeAuth() {
  const auth = getAuth()
  const storedUser = readStoredUser()
  const storedRole = typeof window !== 'undefined' ? window.localStorage.getItem('role') : ''
  const role = String(auth?.role || storedUser?.role || storedRole || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  return { auth, storedUser, role }
}

function scrollPageToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export default function HomeModern() {
  const [homeAuth, setHomeAuth] = useState(() => readHomeAuth())
  const { auth, storedUser, role } = homeAuth
  const isLoggedIn = Boolean((auth || storedUser) && role === 'masyarakat')
  const displayName = getDisplayName(auth, storedUser)

  useEffect(() => {
    const syncAuth = () => setHomeAuth(readHomeAuth())

    window.addEventListener('focus', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('rk-auth-updated', syncAuth)
    return () => {
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('rk-auth-updated', syncAuth)
    }
  }, [])

  const getMasyarakatPath = (path) => {
    return role === 'masyarakat' ? path : '/login'
  }

  const services = useMemo(
    () => [
      {
        title: 'Surat Keterangan Ahli Waris',
        icon: FiFileText,
        desc: 'Pengajuan surat keterangan untuk kebutuhan administrasi warga.',
      },
      {
        title: 'Surat Rekomendasi Kerja',
        icon: FiBriefcase,
        desc: 'Permohonan rekomendasi untuk kebutuhan kerja atau instansi.',
      },
      {
        title: 'Surat Pindah',
        icon: FiHome,
        desc: 'Pengajuan pindah domisili dengan alur yang jelas dan cepat.',
      },
      {
        title: 'Rekomendasi Penelitian / Riset',
        icon: FiSearch,
        desc: 'Rekomendasi untuk kegiatan penelitian di wilayah kecamatan.',
      },
      {
        title: 'Rekomendasi Akta Kelahiran',
        icon: FiCheckCircle,
        desc: 'Dukungan rekomendasi untuk penerbitan akta kelahiran.',
      },
      {
        title: 'Rekomendasi Kartu Keluarga',
        icon: FiUsers,
        desc: 'Rekomendasi perubahan atau penerbitan Kartu Keluarga.',
      },
      {
        title: 'Penerbitan Surat Tanah SKT/SKGR',
        icon: FiMap,
        desc: 'Pengajuan penerbitan surat tanah sesuai ketentuan berlaku.',
      },
      {
        title: 'Rekomendasi Yayasan/Sekolah/Ormas',
        icon: FiShield,
        desc: 'Rekomendasi kelembagaan untuk administrasi dan legalitas.',
      },
    ],
    []
  )

  const steps = useMemo(
    () => [
      { title: 'Pilih Layanan', desc: 'Pilih layanan administrasi yang sesuai kebutuhan.', icon: FiGrid },
      { title: 'Isi Formulir', desc: 'Lengkapi data dan unggah berkas pendukung.', icon: FiFileText },
      { title: 'Verifikasi Petugas', desc: 'Petugas memeriksa kelengkapan dan memverifikasi data.', icon: FiCheckCircle },
      { title: 'Selesai & Dipantau', desc: 'Status pengajuan dapat dipantau secara online.', icon: FiBarChart2 },
    ],
    []
  )

  return (
    <div className="rk-portal rk-homeModern">
      <Navbar />

      <main>
        <header
          className="rk-hero"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&w=2200&q=80')",
          }}
          aria-label="Beranda Sistem Pelayanan Terpadu"
        >
          <div className="rk-container rk-heroGrid">
            <div className="rk-heroLeft">
              <div className="rk-badge">
                <span className="rk-badgeDot" aria-hidden="true" />
                Pelayanan Publik Digital
              </div>
              <h1 className="rk-heroTitle">Sistem Pelayanan Terpadu Kecamatan Rantau Kopar</h1>
              <p className="rk-heroSubtitle">
                Memudahkan masyarakat dalam mengakses layanan administrasi secara cepat, transparan, dan efisien
                melalui sistem digital.
              </p>

              <div className="rk-heroActions">
                <Link className="rk-btn rk-btnPrimary" to={getMasyarakatPath('/layanan')} onClick={scrollPageToTop}>
                  Ajukan Layanan <FiArrowRight aria-hidden="true" />
                </Link>
                <Link className="rk-btn rk-btnGhost" to={getMasyarakatPath('/status-pengajuan')} onClick={scrollPageToTop}>
                  Cek Status Pengajuan
                </Link>
              </div>
            </div>

            {isLoggedIn ? (
              <aside className="rk-heroCard rk-heroAccountCard" aria-label="Sambutan pengguna">
                <p className="rk-heroAccountLabel">Akun Anda</p>
                <h2 className="rk-heroAccountTitle">Selamat Datang, {displayName}</h2>
                <p className="rk-heroAccountDesc">
                  Silakan ajukan layanan administrasi atau pantau status pengajuan Anda secara online.
                </p>

                <div className="rk-heroAccountList" aria-label="Aktivitas akun">
                  <div className="rk-heroAccountItem">
                    <span className="rk-heroAccountIcon" aria-hidden="true">
                      <FiFileText />
                    </span>
                    <div className="rk-heroAccountBody">
                      <strong>Ajukan layanan administrasi</strong>
                      <span>Ajukan berbagai jenis layanan dengan mudah.</span>
                    </div>
                    <span className="rk-heroAccountState" aria-hidden="true">
                      <FiCheck />
                    </span>
                  </div>

                  <div className="rk-heroAccountItem">
                    <span className="rk-heroAccountIcon" aria-hidden="true">
                      <FiSearch />
                    </span>
                    <div className="rk-heroAccountBody">
                      <strong>Pantau status pengajuan</strong>
                      <span>Cek perkembangan pengajuan secara real-time.</span>
                    </div>
                    <span className="rk-heroAccountState" aria-hidden="true">
                      <FiCheck />
                    </span>
                  </div>

                  <div className="rk-heroAccountItem">
                    <span className="rk-heroAccountIcon" aria-hidden="true">
                      <FiUser />
                    </span>
                    <div className="rk-heroAccountBody">
                      <strong>Lengkapi profil Anda</strong>
                      <span>Pastikan data Anda akurat dan terbaru.</span>
                    </div>
                    <span className="rk-heroAccountState" aria-hidden="true">
                      <FiCheck />
                    </span>
                  </div>
                </div>
              </aside>
            ) : (
              <aside className="rk-heroCard" aria-label="Informasi layanan">
                <div className="rk-heroCardHeader">
                  <span className="rk-heroCardTitle">Layanan Tersedia</span>
                </div>

                <div className="rk-heroCardGrid">
                  <div className="rk-heroCardStat">
                    <div className="rk-heroCardValue">8+</div>
                    <div className="rk-heroCardLabel">Jenis Surat</div>
                  </div>
                  <div className="rk-heroCardStat">
                    <div className="rk-heroCardValue">Mudah</div>
                    <div className="rk-heroCardLabel">Akses</div>
                  </div>
                  <div className="rk-heroCardStat">
                    <div className="rk-heroCardValue">Cepat</div>
                    <div className="rk-heroCardLabel">Proses</div>
                  </div>
                  <div className="rk-heroCardStat">
                    <div className="rk-heroCardValue">Aktif</div>
                    <div className="rk-heroCardLabel">Pelacakan</div>
                  </div>
                </div>

                <div className="rk-heroCardList" aria-label="Fitur utama">
                  <div className="rk-heroCardRow">
                    <FiCheckCircle aria-hidden="true" />
                    Formulir online terstruktur
                  </div>
                  <div className="rk-heroCardRow">
                    <FiBarChart2 aria-hidden="true" />
                    Status pengajuan terpantau
                  </div>
                  <div className="rk-heroCardRow">
                    <FiShield aria-hidden="true" />
                    Transparansi dan notifikasi
                  </div>
                  <div className="rk-heroCardRow">
                    <FiCheckCircle aria-hidden="true" />
                    Standar layanan jelas
                  </div>
                  <div className="rk-heroCardRow">
                    <FiShield aria-hidden="true" />
                    Data lebih aman
                  </div>
                  <div className="rk-heroCardRow">
                    <FiClock aria-hidden="true" />
                    Hemat waktu
                  </div>
                </div>
              </aside>
            )}
          </div>

          <svg className="rk-heroWave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
              fill="var(--rk-bg)"
            />
          </svg>
        </header>

        <section className="rk-section rk-sectionCompact" aria-label="Tentang singkat">
          <div className="rk-container">
            <div className="rk-aboutCard">
              <div className="rk-aboutIcon" aria-hidden="true">
                <FiInfo />
              </div>
              <div>
                <p className="rk-eyebrow">Tentang</p>
                <h2 className="rk-sectionTitle">Portal Pelayanan Publik Digital</h2>
                <p className="rk-sectionDesc">
                  Kecamatan Rantau Kopar menghadirkan Portal Pelayanan Publik Digital sebagai sarana pelayanan
                  administrasi yang modern, transparan, dan mudah diakses oleh masyarakat. Melalui sistem ini,
                  masyarakat dapat memperoleh informasi layanan, mengajukan permohonan administrasi secara online,
                  memantau status pengajuan secara real-time, serta mendapatkan informasi persyaratan dan prosedur
                  layanan tanpa harus datang langsung ke kantor kecamatan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rk-section rk-stepsSection" aria-label="Alur pengajuan layanan">
          <div className="rk-container">
            <div className="rk-sectionHead">
              <p className="rk-eyebrow">Alur Pelayanan</p>
              <h2 className="rk-sectionTitle">Alur Pengajuan Layanan</h2>
              <p className="rk-sectionDesc">Empat langkah sederhana untuk mengajukan layanan administrasi online.</p>
            </div>

            <div className="rk-stepGrid">
              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rk-stepCard">
                    <div className="rk-stepTop">
                      <span className="rk-stepNo" aria-hidden="true">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="rk-stepIcon" aria-hidden="true">
                        <Icon />
                      </span>
                    </div>
                    <h3 className="rk-cardTitle">{step.title}</h3>
                    <p className="rk-cardDesc">{step.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rk-section rk-alt" aria-label="Layanan unggulan">
          <div className="rk-container">
            <div className="rk-sectionHead">
              <p className="rk-eyebrow">Layanan Online</p>
              <h2 className="rk-sectionTitle">Layanan Unggulan</h2>
              <p className="rk-sectionDesc">Informasi layanan administrasi yang tersedia untuk masyarakat.</p>
            </div>

            <div className="rk-serviceGrid">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <article key={service.title} className="rk-card rk-serviceCard">
                    <div className="rk-serviceTop">
                      <span className="rk-iconWrap" aria-hidden="true">
                        <Icon />
                      </span>
                      <h3 className="rk-cardTitle">{service.title}</h3>
                    </div>
                    <p className="rk-cardDesc">{service.desc}</p>
                  </article>
                )
              })}
            </div>

            <div className="rk-sectionFooter">
              <Link to={getMasyarakatPath('/layanan')} className="rk-miniBtn rk-sectionCta" onClick={scrollPageToTop}>
                Ajukan Layanan <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rk-section rk-profileBrief" aria-label="Ringkasan profil">
          <div className="rk-container">
            <div className="rk-briefGrid">
              <div className="rk-briefMedia" aria-hidden="true">
                <img src="/images/kantor1.png" alt="" loading="lazy" />
              </div>
              <div className="rk-briefContent">
                <p className="rk-eyebrow">Profil</p>
                <h2 className="rk-sectionTitle">Kecamatan Rantau Kopar</h2>
                <p className="rk-sectionDesc">
                  Kecamatan Rantau Kopar berkomitmen meningkatkan kualitas pelayanan publik melalui transformasi digital
                  yang berorientasi pada kebutuhan masyarakat. Dengan dukungan teknologi informasi, proses pelayanan
                  menjadi lebih tertib, cepat, transparan, dan mudah dipantau oleh masyarakat kapan saja dan di mana saja.
                </p>
                <div className="rk-briefActions">
                  <Link className="rk-btn rk-btnOutline" to="/profil" onClick={scrollPageToTop}>
                    Lihat Profil Kecamatan <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rk-section" aria-label="Call to action">
          <div className="rk-container">
            <div className="rk-cta">
              <div className="rk-ctaIcon" aria-hidden="true">
                <FiFileText />
              </div>
              <div className="rk-ctaContent">
                <h2 className="rk-ctaTitle">Butuh layanan administrasi?</h2>
                <p className="rk-ctaDesc">
                  Ajukan permohonan administrasi secara online tanpa harus datang langsung ke kantor. Sistem pelayanan
                  terpadu Kecamatan Rantau Kopar membantu masyarakat memperoleh layanan yang lebih cepat, mudah,
                  transparan, dan dapat dipantau secara real-time.
                </p>
              </div>
              <div className="rk-ctaActions">
                <Link to={getMasyarakatPath('/layanan')} className="rk-btn rk-btnPrimary" onClick={scrollPageToTop}>
                  Mulai Pengajuan <FiArrowRight aria-hidden="true" />
                </Link>
                <Link to="/kontak" className="rk-btn rk-btnGhostAlt" onClick={scrollPageToTop}>
                  Hubungi Kami
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
