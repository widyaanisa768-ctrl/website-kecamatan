import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiHome,
  FiMap,
  FiSearch,
  FiShield,
  FiUsers,
} from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './Layanan.css'

export default function Layanan() {
  const services = useMemo(
    () => [
      {
        title: 'Surat Keterangan Ahli Waris',
        desc: 'Pengajuan surat keterangan untuk kebutuhan administrasi warga.',
        icon: FiFileText,
        to: '/layanan/ahli-waris',
      },
      {
        title: 'Surat Rekomendasi Kerja',
        desc: 'Rekomendasi untuk kebutuhan melamar kerja atau instansi.',
        icon: FiBriefcase,
        to: '/layanan/rekomendasi-kerja',
      },
      {
        title: 'Surat Pindah',
        desc: 'Pengajuan pindah domisili dengan alur yang jelas dan cepat.',
        icon: FiHome,
        to: '/layanan/surat-pindah',
      },
      {
        title: 'Rekomendasi Penelitian / Riset',
        desc: 'Rekomendasi untuk kegiatan penelitian di wilayah kecamatan.',
        icon: FiSearch,
        to: '/layanan/penelitian',
      },
      {
        title: 'Rekomendasi Akta Kelahiran',
        desc: 'Dukungan rekomendasi untuk penerbitan akta kelahiran.',
        icon: FiCheckCircle,
        to: '/layanan/akta-kelahiran',
      },
      {
        title: 'Rekomendasi Kartu Keluarga',
        desc: 'Rekomendasi perubahan atau penerbitan Kartu Keluarga.',
        icon: FiUsers,
        to: '/layanan/kartu-keluarga',
      },
      {
        title: 'Penerbitan Surat Tanah SKT / SKGR',
        desc: 'Pengajuan penerbitan surat tanah sesuai ketentuan berlaku.',
        icon: FiMap,
        to: '/layanan/surat-tanah',
      },
      {
        title: 'Rekomendasi Yayasan / Sekolah / TPQ / Ormas',
        desc: 'Rekomendasi kelembagaan untuk administrasi dan legalitas.',
        icon: FiShield,
        to: '/layanan/yayasan-ormas',
      },
    ],
    []
  )

  const scrollToDaftarLayanan = (e) => {
    e.preventDefault()
    const targetId = 'daftar-layanan'
    const target = document.getElementById(targetId)
    if (!target) return

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    window.history?.replaceState?.(null, '', `#${targetId}`)
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="rk-portal rk-pageLayanan">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Layanan Online">
          <div className="rk-container rk-pageHeaderInner rk-layananHero">
            <div className="rk-layananHeroLeft">
              <p className="rk-pageKicker">Layanan</p>
              <h1 className="rk-pageTitle">Layanan Online</h1>
              <p className="rk-pageSubtitle">
                Pilih layanan administrasi yang tersedia, ajukan secara online, dan pantau statusnya melalui akun Anda.
              </p>

              <div className="rk-heroActions" aria-label="Aksi cepat layanan">
                <a
                  className="rk-heroBtn rk-heroBtnPrimary"
                  href="#daftar-layanan"
                  onClick={scrollToDaftarLayanan}
                >
                  Ajukan Layanan <FiArrowRight aria-hidden="true" />
                </a>
                <a
                  className="rk-heroBtn rk-heroBtnSecondary"
                  href="#daftar-layanan"
                  onClick={scrollToDaftarLayanan}
                >
                  Lihat Persyaratan
                </a>
              </div>
            </div>

            <div className="rk-layananHeroRight" aria-hidden="true">
              <div className="rk-heroVisual">
                <div className="rk-heroVisualFrame">
                  <img src="/images/kantor1.png" alt="" loading="lazy" />
                </div>
                <div className="rk-heroVisualCard">
                  <div className="rk-heroVisualLabel">Pelayanan Terpadu</div>
                  <div className="rk-heroVisualTitle">Tertib, aman, dan terverifikasi.</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="rk-layananQuickInfo" aria-label="Ringkasan layanan">
          <div className="rk-container">
            <div className="rk-layananInfoGrid">
              <div className="rk-layananInfoCard">
                <div className="rk-layananInfoIcon" aria-hidden="true">
                  <FiFileText />
                </div>
                <div>
                  <div className="rk-layananInfoTitle">8 Jenis Layanan</div>
                  <div className="rk-layananInfoDesc">Administrasi utama kecamatan.</div>
                </div>
              </div>
              <div className="rk-layananInfoCard">
                <div className="rk-layananInfoIcon" aria-hidden="true">
                  <FiArrowRight />
                </div>
                <div>
                  <div className="rk-layananInfoTitle">Pengajuan Online</div>
                  <div className="rk-layananInfoDesc">Isi formulir &amp; unggah dokumen.</div>
                </div>
              </div>
              <div className="rk-layananInfoCard">
                <div className="rk-layananInfoIcon" aria-hidden="true">
                  <FiSearch />
                </div>
                <div>
                  <div className="rk-layananInfoTitle">Pantau Status</div>
                  <div className="rk-layananInfoDesc">Lihat progres verifikasi petugas.</div>
                </div>
              </div>
              <div className="rk-layananInfoCard">
                <div className="rk-layananInfoIcon" aria-hidden="true">
                  <FiCheckCircle />
                </div>
                <div>
                  <div className="rk-layananInfoTitle">Dokumen Terverifikasi</div>
                  <div className="rk-layananInfoDesc">Lebih rapi dan mudah ditelusuri.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="daftar-layanan" className="rk-pageSection" aria-label="Daftar layanan">
          <div className="rk-container">
            <div className="rk-layananGrid">
              {services.map((service) => {
                const Icon = service.icon
                return (
                  <article key={service.title} className="rk-layananCard">
                    <div className="rk-layananTop">
                      <div className="rk-layananIcon" aria-hidden="true">
                        <Icon />
                      </div>
                      <h2 className="rk-layananTitle">{service.title}</h2>
                    </div>
                    <p className="rk-layananDesc">{service.desc}</p>
                    <div className="rk-layananActions">
                      <Link to={service.to} className="rk-miniBtn">
                        Lihat Detail <FiArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
