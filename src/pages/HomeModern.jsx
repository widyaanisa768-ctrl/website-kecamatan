import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiFileText,
  FiGrid,
  FiHome,
  FiMap,
  FiSearch,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAuth } from '../lib/rkLocal'
import './HomeModern.css'

export default function HomeModern() {
  const getMasyarakatPath = (path) => {
    const auth = getAuth()
    return auth?.role === 'masyarakat' ? path : '/login'
  }

  const services = useMemo(
    () => [
      {
        title: 'Surat Keterangan Ahli Waris',
        icon: FiFileText,
        desc: 'Pengajuan surat keterangan untuk kebutuhan administrasi warga.',
        to: '/layanan/ahli-waris',
      },
      {
        title: 'Surat Rekomendasi Kerja',
        icon: FiBriefcase,
        desc: 'Permohonan rekomendasi untuk kebutuhan kerja atau instansi.',
        to: '/layanan/rekomendasi-kerja',
      },
      {
        title: 'Surat Pindah',
        icon: FiHome,
        desc: 'Pengajuan pindah domisili dengan alur yang jelas dan cepat.',
        to: '/layanan/surat-pindah',
      },
      {
        title: 'Rekomendasi Penelitian / Riset',
        icon: FiSearch,
        desc: 'Rekomendasi untuk kegiatan penelitian di wilayah kecamatan.',
        to: '/layanan/penelitian',
      },
      {
        title: 'Rekomendasi Akta Kelahiran',
        icon: FiCheckCircle,
        desc: 'Dukungan rekomendasi untuk penerbitan akta kelahiran.',
        to: '/layanan/akta-kelahiran',
      },
      {
        title: 'Rekomendasi Kartu Keluarga',
        icon: FiUsers,
        desc: 'Rekomendasi perubahan atau penerbitan Kartu Keluarga.',
        to: '/layanan/kartu-keluarga',
      },
      {
        title: 'Penerbitan Surat Tanah SKT / SKGR',
        icon: FiMap,
        desc: 'Pengajuan penerbitan surat tanah sesuai ketentuan berlaku.',
        to: '/layanan/surat-tanah',
      },
      {
        title: 'Rekomendasi Yayasan / Sekolah / Ormas',
        icon: FiShield,
        desc: 'Rekomendasi kelembagaan untuk administrasi dan legalitas.',
        to: '/layanan/yayasan-ormas',
      },
    ],
    []
  )

  const steps = useMemo(
    () => [
      { title: 'Pilih layanan', desc: 'Tentukan layanan yang dibutuhkan.', icon: FiGrid },
      { title: 'Isi formulir', desc: 'Lengkapi data dan unggah berkas pendukung.', icon: FiFileText },
      { title: 'Verifikasi petugas', desc: 'Petugas memeriksa kelengkapan dan validasi.', icon: FiCheckCircle },
      { title: 'Selesai & dipantau', desc: 'Surat selesai dan status dapat dipantau.', icon: FiBarChart2 },
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
                Memudahkan masyarakat dalam mengakses layanan administrasi secara cepat, transparan, dan efisien.
              </p>

              <div className="rk-heroActions">
                <Link className="rk-btn rk-btnPrimary" to={getMasyarakatPath('/layanan')}>
                  Ajukan Layanan <FiArrowRight aria-hidden="true" />
                </Link>
                <Link className="rk-btn rk-btnGhost" to={getMasyarakatPath('/status-pengajuan')}>
                  Cek Status Pengajuan
                </Link>
              </div>

              <div className="rk-heroMeta" aria-label="Ringkasan manfaat layanan">
                <div className="rk-metaItem">
                  <FiCheckCircle aria-hidden="true" />
                  <span>Standar layanan jelas</span>
                </div>
                <div className="rk-metaItem">
                  <FiShield aria-hidden="true" />
                  <span>Data lebih aman</span>
                </div>
                <div className="rk-metaItem">
                  <FiClock aria-hidden="true" />
                  <span>Hemat waktu</span>
                </div>
              </div>
            </div>

            <aside className="rk-heroCard" aria-label="Informasi layanan">
              <div className="rk-heroCardHeader">
                <span className="rk-heroCardTitle">Layanan Tersedia</span>
                <span className="rk-heroCardPill">Online</span>
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
              </div>
            </aside>
          </div>

          <svg className="rk-heroWave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
              fill="var(--rk-bg)"
            />
          </svg>
        </header>

        <section className="rk-section" aria-label="Tentang singkat">
          <div className="rk-container">
            <div className="rk-aboutCard">
              <div className="rk-aboutIcon" aria-hidden="true">
                <FiInfo />
              </div>
              <div>
                <p className="rk-eyebrow">Tentang</p>
                <h2 className="rk-sectionTitle">Portal Pelayanan Publik Digital</h2>
                <p className="rk-sectionDesc">
                  Kecamatan Rantau Kopar menghadirkan layanan publik digital untuk mempermudah masyarakat memperoleh
                  informasi dan mengajukan layanan administrasi secara lebih cepat, tertib, dan transparan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rk-section rk-alt" aria-label="Layanan unggulan">
          <div className="rk-container">
            <div className="rk-sectionHead">
              <p className="rk-eyebrow">Layanan Online</p>
              <h2 className="rk-sectionTitle">Layanan Unggulan</h2>
              <p className="rk-sectionDesc">Pilih layanan sesuai kebutuhan. Tombol “Ajukan” sementara menuju Login.</p>
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
                    <div className="rk-cardActions">
                      <Link to={getMasyarakatPath(service.to)} className="rk-miniBtn">
                        Ajukan <FiArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rk-section" aria-label="Alur pelayanan">
          <div className="rk-container">
            <div className="rk-sectionHead">
              <p className="rk-eyebrow">Alur Pelayanan</p>
              <h2 className="rk-sectionTitle">Alur Pengajuan</h2>
              <p className="rk-sectionDesc">Empat langkah sederhana yang mudah dipahami.</p>
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

        <section className="rk-section rk-profileBrief" aria-label="Ringkasan profil">
          <div className="rk-container">
            <div className="rk-briefGrid">
              <div className="rk-briefMedia" aria-hidden="true">
                <img
                  src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80"
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="rk-briefContent">
                <p className="rk-eyebrow">Profil</p>
                <h2 className="rk-sectionTitle">Ringkasan Profil Kecamatan</h2>
                <p className="rk-sectionDesc">
                  Kecamatan Rantau Kopar merupakan salah satu wilayah administratif di Kabupaten Rokan Hilir yang
                  berkomitmen meningkatkan kualitas pelayanan publik melalui transformasi digital yang lebih tertib,
                  mudah diakses, dan responsif terhadap kebutuhan masyarakat.
                </p>
                <div className="rk-briefActions">
                  <Link className="rk-btn rk-btnOutline" to="/profil">
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
              <div>
                <h2 className="rk-ctaTitle">Butuh layanan administrasi?</h2>
                <p className="rk-ctaDesc">
                  Ajukan permohonan Anda secara online tanpa harus datang langsung ke kantor. Proses lebih rapi, mudah,
                  dan dapat dipantau.
                </p>
              </div>
              <div className="rk-ctaActions">
                <Link to={getMasyarakatPath('/layanan')} className="rk-btn rk-btnPrimary">
                  Mulai Pengajuan <FiArrowRight aria-hidden="true" />
                </Link>
                <Link to="/kontak" className="rk-btn rk-btnGhostAlt">
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
