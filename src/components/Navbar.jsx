import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { clearAuth, getAuth } from '../lib/rkLocal'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Beranda', to: '/home', end: true },
  { label: 'Profil Kecamatan', to: '/profil' },
  { label: 'Layanan Online', to: '/layanan' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

function readToken() {
  if (typeof window === 'undefined') return ''
  const raw = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token') || ''
  const trimmed = String(raw || '').trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return ''
  return trimmed
}

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const [user, setUser] = useState(() => {
    try {
      const raw = window.localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => readToken())

  const userLabel = (user?.name || user?.nama_lengkap || user?.username || '').trim()

  const role = useMemo(() => {
    try {
      const auth = getAuth()
      return (
        window.localStorage.getItem('role') ||
        user?.role ||
        auth?.role ||
        ''
      )
    } catch {
      return user?.role || ''
    }
  }, [user])

  const isLoggedIn = !!token && !!user && !!userLabel

  const dashboardPath = role === 'petugas' ? '/petugas/dashboard' : '/status-pengajuan'

  useEffect(() => {
    if (!userMenuOpen) return

    const onPointerDown = (e) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

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
    const syncAuth = () => {
      try {
        const raw = window.localStorage.getItem('user')
        setUser(raw ? JSON.parse(raw) : null)
      } catch {
        setUser(null)
      }

      setToken(readToken())
    }

    syncAuth()
    window.addEventListener('focus', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [])

  const handleLogout = () => {
    try {
      window.localStorage.removeItem('accessToken')
      window.localStorage.removeItem('user')
      window.localStorage.removeItem('token')
      window.localStorage.removeItem('rk_auth')
      window.localStorage.removeItem('role')
      clearAuth()
    } finally {
      setUser(null)
      setToken('')
      setMenuOpen(false)
      setUserMenuOpen(false)
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
            <div className="rk-userNav" aria-label="Akun" ref={userMenuRef}>
              <button
                type="button"
                className="rk-userName rk-userPillTrigger"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="rk-userPillText" title={userLabel}>
                  {userLabel}
                </span>
                <span className={`rk-userCaret ${userMenuOpen ? 'isOpen' : ''}`} aria-hidden="true" />
              </button>

              <div className={`rk-userDropdown ${userMenuOpen ? 'isOpen' : ''}`} role="menu" aria-label="Menu akun">
                <button
                  type="button"
                  className="rk-userDropdownItem isDanger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
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
            onClick={() => {
              setUserMenuOpen(false)
              setMenuOpen((v) => !v)
            }}
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
                  Logout
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
