import { useMemo } from 'react'
import { FiLogOut } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import '../styles/petugas-ui.css'

export default function SidebarPetugas({ activeLabel = 'Dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = useMemo(
    () => [
      { label: 'Dashboard', to: '/petugas/dashboard', icon: 'dashboard' },
      { label: 'Daftar Pengajuan', to: '/petugas/pengajuan', icon: 'pengajuan' },
      { label: 'Kelola Galeri', to: '/petugas/galeri', icon: 'galeri' },
      { label: 'Profil Petugas', to: '/petugas/profil', icon: 'profil' },
      { label: 'Logout', action: 'logout', icon: 'logout' },
    ],
    []
  )

  const primaryItems = useMemo(() => menuItems.filter((item) => item.action !== 'logout'), [menuItems])
  const logoutItem = useMemo(() => menuItems.find((item) => item.action === 'logout') || null, [menuItems])

  function isActive(item) {
    if (item.action === 'logout') return false
    const path = location?.pathname || ''
    if (item.to === '/petugas/dashboard') return path === '/petugas/dashboard'
    if (item.to === '/petugas/pengajuan') return path.startsWith('/petugas/pengajuan')
    if (item.to === '/petugas/galeri') return path.startsWith('/petugas/galeri')
    if (item.to === '/petugas/profil') return path.startsWith('/petugas/profil')
    return activeLabel === item.label
  }

  async function onClick(item) {
    if (item.action === 'logout') {
      await remoteLogout()
      clearAuthArtifacts()
      navigate('/login', { replace: true })
      return
    }
    navigate(item.to)
  }

  return (
    <aside className="ptg-sidebar" aria-label="Sidebar petugas">
      <div className="ptg-brand">
        <div className="ptg-logoShell" aria-hidden="true">
          <div className="ptg-logo">
            <img src="/images/logo-rohil.png" alt="" className="ptg-logoImg" />
          </div>
        </div>
        <div className="ptg-brandTitle">
          <strong>Pelayanan Terpadu</strong>
          <span>Kec. Rantau Kopar</span>
        </div>
      </div>

      <nav className="ptg-nav" aria-label="Menu sidebar">
        {primaryItems.map((item) => (
          <button
            key={item.label}
            type="button"
            data-icon={item.icon}
            className={`ptg-navBtn ${isActive(item) ? 'is-active' : ''}`}
            onClick={() => onClick(item)}
          >
            <span className="ptg-navDot" aria-hidden="true" />
            <span className="ptg-navText">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="ptg-sidebarInfo" aria-label="Informasi peran petugas">
        <span className="ptg-sidebarInfoIcon" aria-hidden="true">
          i
        </span>
        <p>Petugas memverifikasi pengajuan, memperbarui status, dan mengunggah surat hasil untuk masyarakat.</p>
      </div>

      {logoutItem ? (
        <button
          type="button"
          className="ptg-navBtn ptg-sidebarLogout has-svg-icon"
          onClick={() => onClick(logoutItem)}
        >
          <FiLogOut className="ptg-navIcon" aria-hidden="true" />
          <span className="ptg-navText">{logoutItem.label}</span>
        </button>
      ) : null}
    </aside>
  )
}
