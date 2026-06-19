import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/register'
import HomeModern from './pages/HomeModern'
import Profil from './pages/Profil'
import ProfilUser from './pages/ProfilUser'
import Layanan from './pages/Layanan'
import Galeri from './pages/Galeri'
import Kontak from './pages/Kontak'
import StatusPengajuan from './pages/StatusPengajuan'
import ScrollToTop from './components/ScrollToTop'
import DashboardPetugas from './pages/DashboardPetugas'
import DashboardKepalaCamat from './pages/DashboardKepalaCamat'
import LaporanKepalaCamat from './pages/LaporanKepalaCamat'
import ProfilKepalaCamat from './pages/ProfilKepalaCamat'
import DaftarPengajuanPetugas from './pages/DaftarPengajuanPetugas'
import DetailPengajuanPetugas from './pages/DetailPengajuanPetugas'
import ProfilPetugas from './pages/ProfilPetugas'
import KelolaDataMasyarakat from './pages/KelolaDataMasyarakat'
import AhliWarisForm from './pages/forms/AhliWarisForm'
import RekomendasiKerjaForm from './pages/forms/RekomendasiKerjaForm'
import PenelitianRisetForm from './pages/forms/PenelitianRisetForm'
import SuratPindahForm from './pages/forms/SuratPindahForm'
import AktaKelahiranForm from './pages/forms/AktaKelahiranForm'
import KartuKeluargaForm from './pages/forms/KartuKeluargaForm'
import SuratTanahForm from './pages/forms/SuratTanahForm'
import YayasanOrmasForm from './pages/forms/YayasanOrmasForm'
import { getAuth } from './lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from './services/authService'

function RequirePetugas({ children }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'petugas') return <Navigate to="/login-petugas" replace />
  return children
}

function RequireKepalaCamat({ children }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'kepala_camat') return <Navigate to="/login?role=kepala_camat" replace />
  return children
}

function RequireMasyarakat({ children }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'masyarakat') return <Navigate to="/login" replace />
  return children
}

function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    void (async () => {
      await remoteLogout()
      clearAuthArtifacts()
      if (alive) navigate('/login', { replace: true })
    })()

    return () => {
      alive = false
    }
  }, [navigate])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Halaman publik */}
        <Route path="/home" element={<HomeModern />} />
        <Route path="/profil" element={<Profil />} />
        <Route
          path="/profil-saya"
          element={
            <RequireMasyarakat>
              <ProfilUser />
            </RequireMasyarakat>
          }

        />
        <Route
          path="/layanan"
          element={
            <RequireMasyarakat>
              <Layanan />
            </RequireMasyarakat>
          }
        />
        <Route path="/galeri" element={<Galeri />} />
        <Route path="/kontak" element={<Kontak />} />

        {/* Layanan masyarakat */}
        <Route
          path="/layanan/ahli-waris"
          element={
            <RequireMasyarakat>
              <AhliWarisForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/rekomendasi-kerja"
          element={
            <RequireMasyarakat>
              <RekomendasiKerjaForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/penelitian"
          element={
            <RequireMasyarakat>
              <PenelitianRisetForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/penelitian-riset"
          element={
            <RequireMasyarakat>
              <PenelitianRisetForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/surat-pindah"
          element={
            <RequireMasyarakat>
              <SuratPindahForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/akta-kelahiran"
          element={
            <RequireMasyarakat>
              <AktaKelahiranForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/kartu-keluarga"
          element={
            <RequireMasyarakat>
              <KartuKeluargaForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/surat-tanah"
          element={
            <RequireMasyarakat>
              <SuratTanahForm />
            </RequireMasyarakat>
          }
        />
        <Route
          path="/layanan/yayasan-ormas"
          element={
            <RequireMasyarakat>
              <YayasanOrmasForm />
            </RequireMasyarakat>
          }
        />

        {/* Legacy dashboard masyarakat -> Beranda */}
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />
        <Route path="/dashboard-masyarakat" element={<Navigate to="/home" replace />} />
        <Route
          path="/status-pengajuan"
          element={
            <RequireMasyarakat>
              <StatusPengajuan />
            </RequireMasyarakat>
          }
        />

        {/* Petugas */}
        <Route path="/dashboard-petugas" element={<Navigate to="/petugas/dashboard" replace />} />
        <Route path="/petugas" element={<Navigate to="/petugas/dashboard" replace />} />
        <Route
          path="/petugas/dashboard"
          element={
            <RequirePetugas>
              <DashboardPetugas />
            </RequirePetugas>
          }
        />
        <Route
          path="/petugas/pengajuan"
          element={
            <RequirePetugas>
              <DaftarPengajuanPetugas />
            </RequirePetugas>
          }
        />
        <Route
          path="/petugas/pengajuan/:id"
          element={
            <RequirePetugas>
              <DetailPengajuanPetugas />
            </RequirePetugas>
          }
        />
        <Route
          path="/petugas/data-masyarakat"
          element={<Navigate to="/petugas/masyarakat" replace />}
        />
        <Route
          path="/petugas/masyarakat"
          element={
            <RequirePetugas>
              <KelolaDataMasyarakat />
            </RequirePetugas>
          }
        />
        <Route
          path="/petugas/profil"
          element={
            <RequirePetugas>
              <ProfilPetugas />
            </RequirePetugas>
          }
        />
        <Route path="/kelola-data-masyarakat" element={<Navigate to="/petugas/masyarakat" replace />} />

        {/* Kepala Camat */}
        <Route path="/kepala-camat" element={<Navigate to="/dashboard-kepala-camat" replace />} />
        <Route path="/kepala-camat/dashboard" element={<Navigate to="/dashboard-kepala-camat" replace />} />
        <Route
          path="/kepala-camat/laporan"
          element={
            <RequireKepalaCamat>
              <LaporanKepalaCamat />
            </RequireKepalaCamat>
          }
        />
        <Route
          path="/kepala-camat/profil"
          element={
            <RequireKepalaCamat>
              <ProfilKepalaCamat />
            </RequireKepalaCamat>
          }
        />
        <Route
          path="/dashboard-kepala-camat"
          element={
            <RequireKepalaCamat>
              <DashboardKepalaCamat />
            </RequireKepalaCamat>
          }
        />

        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-petugas" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
          </BrowserRouter>
  )
}

export default App

