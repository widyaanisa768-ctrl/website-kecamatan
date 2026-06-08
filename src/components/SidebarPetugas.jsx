import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import '../styles/petugas-ui.css'

export default function SidebarPetugas({ activeLabel = 'Dashboard' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [auth, setAuthState] = useState(() => getAuth())

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuth())
    syncAuth()
    window.addEventListener('focus', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('rk-auth-updated', syncAuth)
    return () => {
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('rk-auth-updated', syncAuth)
    }
  }, [])

  const menuItems = useMemo(() => {
    return [
      { label: 'Dashboard', to: '/petugas/dashboard', icon: 'dashboard' },
      { label: 'Daftar Pengajuan', to: '/petugas/pengajuan', icon: 'pengajuan' },
      { label: 'Kelola Data Masyarakat', to: '/petugas/masyarakat', icon: 'masyarakat' },
      { label: 'Profil Petugas', to: '/petugas/profil', icon: 'profil' },
      { label: 'Logout', action: 'logout', icon: 'logout' },
    ]
  }, [])

  function isActive(item) {
    if (item.action === 'logout') return false
    const path = location?.pathname || ''
    if (item.to === '/petugas/dashboard') return path === '/petugas/dashboard'
    if (item.to === '/petugas/pengajuan') return path.startsWith('/petugas/pengajuan')
    if (item.to === '/petugas/masyarakat') return path.startsWith('/petugas/masyarakat')
    if (item.to === '/petugas/profil') return path.startsWith('/petugas/profil')
    return activeLabel === item.label
  }

  async function onClick(item) {
    if (item.action === 'logout') {
      await remoteLogout()
      clearAuthArtifacts()
      navigate('/login-petugas', { replace: true })
      return
    }
    navigate(item.to)
  }

  const initials = (auth?.name || 'Petugas')
    .split(' ')
    .slice(0, 2)
    .map((w) => w?.[0] || '')
    .join('')
    .toUpperCase()
  const avatar = auth?.avatar || auth?.foto || auth?.photo || ''

  return (
    <aside className="ptg-sidebar" aria-label="Sidebar petugas" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="ptg-brand">
        <div className="ptg-logo" aria-hidden="true">
          <img src="/images/logo-rohil.png" alt="" className="ptg-logoImg" />
        </div>
        <div className="ptg-brandTitle">
          <strong>Pelayanan Terpadu</strong>
          <span>Kec. Rantau Kopar</span>
        </div>
      </div>

      <nav className="ptg-nav" aria-label="Menu sidebar" style={{ flex: 1, overflow: 'auto', paddingBottom: 10 }}>
        {menuItems.map((item) => (
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

      <div className="ptg-sidebarFoot">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ptg-avatar" aria-hidden="true">
            {avatar ? <img src={avatar} alt="" /> : initials || 'PT'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: 'rgba(255,255,255,.92)', lineHeight: 1.2 }}>
              {auth?.name || auth?.nama || 'Petugas'}
            </div>
            <div style={{ marginTop: 2, opacity: 0.9 }}>{auth?.jabatan || 'Akun petugas'}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
