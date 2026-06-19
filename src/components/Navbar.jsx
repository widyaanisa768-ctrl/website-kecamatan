import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import { getAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import { normalizeProfileAvatar, normalizeProfileUser } from '../services/profileService'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Beranda', to: '/home', end: true },
  { label: 'Profil Kecamatan', to: '/profil' },
  { label: 'Layanan Online', to: '/layanan', authOnly: true, roles: ['masyarakat'] },
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

function getInitials(label) {
  const parts = String(label || 'User').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readCurrentUser() {
  const auth = getAuth()
  const storedUser = readStoredUser()
  if (!auth && !storedUser) return null
  return normalizeProfileUser({ ...(storedUser || {}), ...(auth || {}) })
}

function scrollPageToTop() {
  if (typeof window === 'undefined') return
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export default function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const [user, setUser] = useState(() => readCurrentUser())
  const [token, setToken] = useState(() => readToken())

  const userLabel = (user?.name || user?.nama_lengkap || user?.nama || user?.username || '').trim()
  const userAvatar = normalizeProfileAvatar(user?.avatar || user?.photo || user?.foto || '')
  const userInitials = getInitials(userLabel || user?.username)

  const auth = useMemo(() => {
    try {
      return getAuth()
    } catch {
      return null
    }
  }, [user, token])

  const role = useMemo(() => {
    try {
      return (
        window.localStorage.getItem('role') ||
        user?.role ||
        auth?.role ||
        ''
      )
    } catch {
      return user?.role || ''
    }
  }, [user, auth])

  const isLoggedIn = !!auth || (!!token && !!user && !!userLabel)
  const normalizedRole = String(role || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const visibleNavItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) =>
          !item.authOnly ||
          (isLoggedIn && (!item.roles || item.roles.includes(normalizedRole)))
      ),
    [isLoggedIn, normalizedRole]
  )

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
        setUser(readCurrentUser())
      } catch {
        setUser(null)
      }

      setToken(readToken())
    }

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

  const handleLogout = async () => {
    try {
      await remoteLogout()
    } finally {
      clearAuthArtifacts()
      setUser(null)
      setToken('')
      setMenuOpen(false)
      setUserMenuOpen(false)
      navigate('/login', { replace: true })
    }
  }

  const handleNavLinkClick = () => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    scrollPageToTop()
  }

  return (
    <header className="rk-nav bg-white shadow-sm border-b" role="banner">
      <div className="rk-container rk-navInner">
        <Link to="/home" className="rk-brand" aria-label="Kecamatan Rantau Kopar" onClick={handleNavLinkClick}>
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
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `rk-link ${isActive ? 'isActive' : ''}`}
                onClick={handleNavLinkClick}
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
                <span className="rk-userAvatar" aria-hidden="true">
                  {userAvatar ? <img src={userAvatar} alt="" /> : userInitials}
                </span>
                <span className="rk-userPillText" title={userLabel}>
                  {userLabel}
                </span>
                <span className={`rk-userCaret ${userMenuOpen ? 'isOpen' : ''}`} aria-hidden="true" />
              </button>

              <div className={`rk-userDropdown ${userMenuOpen ? 'isOpen' : ''}`} role="menu" aria-label="Menu akun">
                {role === 'masyarakat' ? (
                  <>
                    <Link
                      to="/profil-saya"
                      className="rk-userDropdownItem"
                      role="menuitem"
                      onClick={handleNavLinkClick}
                    >
                      Profil Saya
                    </Link>
                    <Link
                      to="/status-pengajuan"
                      className="rk-userDropdownItem"
                      role="menuitem"
                      onClick={handleNavLinkClick}
                    >
                      Status Pengajuan
                    </Link>
                  </>
                ) : null}
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
            <NavLink to="/login" className="rk-loginBtn" onClick={handleNavLinkClick}>
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
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `rk-mobileLink ${isActive ? 'isActive' : ''}`}
                onClick={handleNavLinkClick}
              >
                {item.label}
              </NavLink>
            ))}
            {isLoggedIn ? (
              <>
                <div className="rk-mobileUser" aria-label="Akun">
                  <span className="rk-mobileUserAvatar" aria-hidden="true">
                    {userAvatar ? <img src={userAvatar} alt="" /> : userInitials}
                  </span>
                  <span>{userLabel}</span>
                </div>
                {role === 'masyarakat' ? (
                  <>
                    <NavLink to="/profil-saya" className="rk-mobileLink" onClick={handleNavLinkClick}>
                      Profil Saya
                    </NavLink>
                    <NavLink to="/status-pengajuan" className="rk-mobileLink" onClick={handleNavLinkClick}>
                      Status Pengajuan
                    </NavLink>
                  </>
                ) : null}
                <button type="button" className="rk-mobileLink isLogout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/login" className="rk-mobileLink isLogin" onClick={handleNavLinkClick}>
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
