import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/login'
import Register from './pages/register'
import HomeModern from './pages/HomeModern'
import Profil from './pages/Profil'
import Layanan from './pages/Layanan'
import Galeri from './pages/Galeri'
import Kontak from './pages/Kontak'
import StatusPengajuan from './pages/StatusPengajuan'
import DashboardPetugas from './pages/DashboardPetugas'
import DaftarPengajuanPetugas from './pages/DaftarPengajuanPetugas'
import DetailPengajuanPetugas from './pages/DetailPengajuanPetugas'
import KelolaDataMasyarakat from './pages/KelolaDataMasyarakat'
import AhliWarisForm from './pages/forms/AhliWarisForm'
import RekomendasiKerjaForm from './pages/forms/RekomendasiKerjaForm'
import PenelitianRisetForm from './pages/forms/PenelitianRisetForm'
import SuratPindahForm from './pages/forms/SuratPindahForm'
import AktaKelahiranForm from './pages/forms/AktaKelahiranForm'
import KartuKeluargaForm from './pages/forms/KartuKeluargaForm'
import SuratTanahForm from './pages/forms/SuratTanahForm'
import YayasanOrmasForm from './pages/forms/YayasanOrmasForm'
import { clearAuth, getAuth } from './lib/rkLocal'

function RequirePetugas({ children }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'petugas') return <Navigate to="/login-petugas" replace />
  return children
}

function RequireMasyarakat({ children }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'masyarakat') return <Navigate to="/login" replace />
  return children
}

function Logout() {
  clearAuth()
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Halaman publik */}
        <Route path="/home" element={<HomeModern />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/layanan" element={<Layanan />} />
        <Route path="/galeri" element={<Galeri />} />
        <Route path="/kontak" element={<Kontak />} />

        {/* Layanan (tetap seperti sebelumnya) */}
        <Route path="/layanan/ahli-waris" element={<AhliWarisForm />} />
        <Route path="/layanan/rekomendasi-kerja" element={<RekomendasiKerjaForm />} />
        <Route path="/layanan/penelitian" element={<PenelitianRisetForm />} />
        <Route path="/layanan/penelitian-riset" element={<PenelitianRisetForm />} />
        <Route path="/layanan/surat-pindah" element={<SuratPindahForm />} />
        <Route path="/layanan/akta-kelahiran" element={<AktaKelahiranForm />} />
        <Route path="/layanan/kartu-keluarga" element={<KartuKeluargaForm />} />
        <Route path="/layanan/surat-tanah" element={<SuratTanahForm />} />
        <Route path="/layanan/yayasan-ormas" element={<YayasanOrmasForm />} />

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
          element={
            <RequirePetugas>
              <KelolaDataMasyarakat />
            </RequirePetugas>
          }
        />
        <Route path="/kelola-data-masyarakat" element={<Navigate to="/petugas/data-masyarakat" replace />} />

        <Route path="/logout" element={<Logout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-petugas" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
