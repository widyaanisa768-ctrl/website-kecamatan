import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../lib/rkLocal'

export default function SidebarPetugas({ prefix = 'dp', activeLabel = 'Dashboard' }) {
  const navigate = useNavigate()
  const auth = getAuth()

  const menuItems = useMemo(
    () => [
      { label: 'Dashboard', to: '/petugas/dashboard' },
      { label: 'Daftar Pengajuan', to: '/petugas/pengajuan' },
      { label: 'Verifikasi', to: '/petugas/pengajuan?filter=menunggu' },
      { label: 'Kelola Data Masyarakat', to: '/petugas/data-masyarakat' },
      { label: 'Logout', action: 'logout' },
    ],
    []
  )

  const cls = (suffix) => `${prefix}-${suffix}`

  function onClick(item) {
    if (item.action === 'logout') {
      clearAuth()
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

  return (
    <aside className={cls('sidebar')} aria-label="Sidebar petugas">
      <div className={cls('brand')}>
        <div className={cls('logo')} aria-hidden="true">
          KR
        </div>
        <div className={cls('brandTitle')}>
          <strong>Pelayanan Terpadu</strong>
          <span>Kec. Rantau Kopar</span>
        </div>
      </div>

      <nav className={cls('nav')} aria-label="Menu sidebar">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`${cls('navBtn')} ${activeLabel === item.label ? 'is-active' : ''}`}
            onClick={() => onClick(item)}
          >
            <span className={cls('navDot')} aria-hidden="true" />
            <span className={cls('navText')}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={cls('sidebarFoot')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={cls('avatar')} aria-hidden="true">
            {initials || 'PT'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: 'rgba(255,255,255,.92)', lineHeight: 1.2 }}>
              {auth?.name || 'Petugas'}
            </div>
            <div style={{ marginTop: 2, opacity: 0.9 }}>Akun petugas</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

