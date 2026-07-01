import { useMemo, useState } from 'react'
import { getAvatarUrl } from '../services/profileService'

function getInitials(label, fallback = 'PS') {
  const source = String(label || '').trim()
  if (!source) return fallback

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    const text = parts[0].slice(0, 2).toUpperCase()
    return text || fallback
  }

  const text = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  return text || fallback
}

export default function PetugasAvatar({ user, title = '', className = 'ptg-avatar' }) {
  const avatarUrl = useMemo(() => getAvatarUrl(user), [user])
  const [status, setStatus] = useState(() => (avatarUrl ? 'loading' : 'fallback'))

  const displayName = String(user?.name || user?.nama || user?.nama_lengkap || user?.username || '').trim()
  const initials = getInitials(displayName)

  return (
    <div className={className} title={title} aria-hidden="true">
      {avatarUrl ? (
        <>
          <img
            src={avatarUrl}
            alt=""
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('fallback')}
            style={status === 'loaded' ? undefined : { display: 'none' }}
          />
          {status !== 'loaded' ? <span>{initials}</span> : null}
        </>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
