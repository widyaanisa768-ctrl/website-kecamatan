import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'
import './Navbar.css'

const NAV_ITEMS = [
  { label: 'Beranda', to: '/home', end: true },
  { label: 'Profil Kecamatan', to: '/profil' },
  { label: 'Layanan Online', to: '/layanan' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

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

          <NavLink to="/login" className="rk-loginBtn">
            Login
          </NavLink>

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
            <NavLink to="/login" className="rk-mobileLink isLogin" onClick={() => setMenuOpen(false)}>
              Login
            </NavLink>
          </div>
        </div>

        <button type="button" className="rk-mobileBackdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />
      </div>
    </header>
  )
}
