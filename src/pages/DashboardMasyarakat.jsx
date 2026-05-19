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
import PengajuanSaya from '../components/PengajuanSaya'
import './Layanan.css'

export default function DashboardMasyarakat() {
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
        to: '/layanan/penelitian-riset',
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

  return (
    <div className="rk-portal rk-pageLayanan">
      <Navbar />

      <main>
        <header className="rk-pageHeader" aria-label="Dashboard Masyarakat">
          <div className="rk-container rk-pageHeaderInner">
            <p className="rk-pageKicker">Dashboard</p>
            <h1 className="rk-pageTitle">Dashboard Masyarakat</h1>
            <p className="rk-pageSubtitle">
              Ajukan layanan administrasi secara online dan pantau status pengajuan Anda melalui akun ini.
            </p>
          </div>
        </header>

        <section className="rk-pageSection" aria-label="Daftar layanan">
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
                        Ajukan <FiArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <PengajuanSaya />
      </main>

      <Footer />
    </div>
  )
}
