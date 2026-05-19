import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { clearAuth } from '../lib/rkLocal'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Beranda', to: '/home', end: true },
  { label: 'Profil Kecamatan', to: '/profil' },
  { label: 'Layanan Online', to: '/layanan' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const userLabel = (user?.nama_lengkap || user?.username || '').trim()
  const isLoggedIn = !!userLabel

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('rk-noScroll')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('rk-noScroll')
    }
  }, [menuOpen])

  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = window.localStorage.getItem('user')
        setUser(raw ? JSON.parse(raw) : null)
      } catch {
        setUser(null)
      }
    }

    syncUser()
    window.addEventListener('focus', syncUser)
    window.addEventListener('storage', syncUser)
    return () => {
      window.removeEventListener('focus', syncUser)
      window.removeEventListener('storage', syncUser)
    }
  }, [])

  const handleLogout = () => {
    try {
      window.localStorage.removeItem('accessToken')
      window.localStorage.removeItem('user')
      window.localStorage.removeItem('token')
      clearAuth()
    } finally {
      setUser(null)
      setMenuOpen(false)
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="rk-nav bg-white shadow-sm border-b" role="banner">
      <div className="rk-container rk-navInner">
        <Link to="/home" className="rk-brand" aria-label="Kecamatan Rantau Kopar">
          <img 
            src="/images/logo-rohil.png" 
    alt="Logo Rohil" 
    className="rk-logo"
  />

  <span className="rk-brandText">
    <span className="rk-brandLine1">Kecamatan Rantau Kopar</span>
    <span className="rk-brandLine2">Kabupaten Rokan Hilir</span>
  </span>
</Link>

        <div className="rk-navRight">
          <nav className="rk-links" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `rk-link ${isActive ? 'isActive' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {isLoggedIn ? (
            <div className="rk-userNav" aria-label="Akun">
              <span className="rk-userName" title={userLabel}>
                {userLabel}
              </span>
              <button type="button" className="rk-loginBtn rk-logoutBtn" onClick={handleLogout}>
                Keluar
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="rk-loginBtn">
              Login
            </NavLink>
          )}

          <button
            type="button"
            className="rk-burger"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className={`rk-mobile ${menuOpen ? 'isOpen' : ''}`} role="dialog" aria-modal="true">
        <div className="rk-mobilePanel">
          <div className="rk-mobileHeader">
            <span className="rk-mobileTitle">Menu</span>
            <button type="button" className="rk-mobileClose" onClick={() => setMenuOpen(false)} aria-label="Tutup menu">
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="rk-mobileLinks" aria-label="Navigasi mobile">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `rk-mobileLink ${isActive ? 'isActive' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <>
                <div className="rk-mobileUser" aria-label="Akun">
                  {userLabel}
                </div>
                <button type="button" className="rk-mobileLink isLogout" onClick={handleLogout}>
                  Keluar
                </button>
              </>
            ) : (
              <NavLink to="/login" className="rk-mobileLink isLogin" onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
            )}
          </div>
        </div>

        <button type="button" className="rk-mobileBackdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />
      </div>
    </header>
  )
}
