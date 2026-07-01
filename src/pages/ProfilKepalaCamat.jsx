import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiBarChart2,
  FiCamera,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiLoader,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiTrash2,
  FiUser,
} from 'react-icons/fi'
import { getAuth, setAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import {
  deleteAvatar,
  extractProfileFromResponse,
  getAvatarUrl,
  normalizeProfileUser,
  updateProfile,
  updateProfileWithAvatar,
} from '../services/profileService'
import './DashboardKepalaCamat.css'

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getInitials(name, username, fallback = 'KC') {
  const source = String(name || username || '').trim()
  if (!source) return fallback

  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || fallback
}

function buildProfile(auth, storedUser) {
  const currentAuth = auth || {}
  const currentUser = storedUser || {}
  const base = normalizeProfileUser({ ...currentUser, ...currentAuth })
  const fullName = base.name || base.nama_lengkap || base.nama || 'Kepala Camat'

  return {
    name: fullName,
    nama: base.nama || base.nama_lengkap || fullName,
    username: base.username || 'kepala',
    email: base.email || '',
    no_hp: base.no_hp || base.phone || base.nomor_hp || '',
    alamat: base.alamat || base.address || '',
    jabatan: currentAuth.jabatan || currentUser.jabatan || base.jabatan || 'Kepala Camat',
    roleLabel: currentAuth.roleLabel || currentUser.roleLabel || base.roleLabel || 'Kepala Camat',
    unit: currentAuth.unit || currentUser.unit || base.unit || 'Kecamatan Rantau Kopar',
    role: 'kepala_camat',
    avatar: getAvatarUrl(base),
  }
}

function buildProfilePayload(profile) {
  const fullName = String(profile.name || profile.nama || '').trim()

  return {
    nama_lengkap: fullName,
    username: String(profile.username || '').trim(),
    email: String(profile.email || '').trim(),
    no_hp: String(profile.no_hp || '').replace(/\D/g, ''),
    alamat: String(profile.alamat || '').trim(),
    role: 'kepala_camat',
  }
}

function blankAvatarFields(value = '') {
  return {
    avatar: value,
    avatar_url: value,
    avatarUrl: value,
    foto_profil: value,
    fotoProfil: value,
    profile_photo: value,
    profilePhoto: value,
    photo: value,
    foto: value,
    image: value,
  }
}

function KepalaCamatAvatar({ user, className, alt = '', fallback = 'KC' }) {
  const avatarUrl = useMemo(() => getAvatarUrl(user), [user])
  const [loadedUrl, setLoadedUrl] = useState('')
  const [failedUrl, setFailedUrl] = useState('')
  const initials = getInitials(user?.name || user?.nama || user?.nama_lengkap, user?.username, fallback)
  const isLoaded = Boolean(avatarUrl && loadedUrl === avatarUrl)
  const isFailed = Boolean(avatarUrl && failedUrl === avatarUrl)
  const showFallback = !avatarUrl || !isLoaded || isFailed

  return (
    <div className={`${className} ${showFallback ? 'isFallback' : ''}`} aria-hidden={alt ? undefined : true}>
      {avatarUrl ? (
        <>
          <img
            src={avatarUrl}
            alt={alt}
            onLoad={() => setLoadedUrl(avatarUrl)}
            onError={() => setFailedUrl(avatarUrl)}
            style={isLoaded && !isFailed ? undefined : { display: 'none' }}
          />
          {showFallback ? <span>{initials}</span> : null}
        </>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

function SidebarKepalaCamat({ active }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await remoteLogout()
    clearAuthArtifacts()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="kcm-sidebar" aria-label="Sidebar kepala camat">
      <div className="kcm-brand">
        <div className="kcm-logo" aria-hidden="true">
          <img src="/images/logo-rohil.png" alt="" />
        </div>
        <div>
          <strong>PETA RANKO</strong>
          <span>Monitoring Pelayanan</span>
        </div>
      </div>

      <nav className="kcm-nav" aria-label="Menu kepala camat">
        <button
          type="button"
          className={`kcm-navBtn ${active === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => navigate('/dashboard-kepala-camat')}
        >
          <FiFileText aria-hidden="true" />
          Dashboard
        </button>
        <button
          type="button"
          className={`kcm-navBtn ${active === 'laporan' ? 'is-active' : ''}`}
          onClick={() => navigate('/kepala-camat/laporan')}
        >
          <FiBarChart2 aria-hidden="true" />
          Laporan & Rekapitulasi
        </button>
        <button
          type="button"
          className={`kcm-navBtn ${active === 'profil' ? 'is-active' : ''}`}
          onClick={() => navigate('/kepala-camat/profil')}
        >
          <FiUser aria-hidden="true" />
          Profil Kepala Camat
        </button>
      </nav>

      <div className="kcm-sidebarInfo">
        <FiInfo aria-hidden="true" />
        <p>Anda login sebagai Kepala Camat. Anda hanya dapat memantau rekapitulasi dan progres pelayanan.</p>
      </div>

      <button type="button" className="kcm-logoutBtn" onClick={handleLogout}>
        <FiLogOut aria-hidden="true" />
        Logout
      </button>
    </aside>
  )
}

export default function ProfilKepalaCamat() {
  const initialProfile = useMemo(() => buildProfile(getAuth(), readStoredUser()), [])
  const [profile, setProfile] = useState(initialProfile)
  const [notice, setNotice] = useState(null)
  const [avatarAlert, setAvatarAlert] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [hasPersistedAvatar, setHasPersistedAvatar] = useState(Boolean(initialProfile.avatar))
  const avatarInputRef = useRef(null)

  const hasAvatar = Boolean(profile.avatar)

  useEffect(() => {
    const syncProfile = () => {
      const nextProfile = buildProfile(getAuth(), readStoredUser())
      setProfile(nextProfile)
      setHasPersistedAvatar(Boolean(nextProfile.avatar))
    }
    syncProfile()
    window.addEventListener('focus', syncProfile)
    window.addEventListener('storage', syncProfile)
    window.addEventListener('rk-auth-updated', syncProfile)
    return () => {
      window.removeEventListener('focus', syncProfile)
      window.removeEventListener('storage', syncProfile)
      window.removeEventListener('rk-auth-updated', syncProfile)
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    if (notice) setNotice(null)
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarAlert(null)
    setNotice(null)

    if (!ALLOWED_AVATAR_TYPES.has(String(file.type || '').toLowerCase())) {
      setAvatarAlert({ type: 'danger', message: 'Format foto harus JPG, JPEG, PNG, atau WEBP.' })
      e.target.value = ''
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setAvatarAlert({ type: 'danger', message: 'Ukuran foto maksimal 2 MB.' })
      e.target.value = ''
      return
    }

    setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || '') }))
      setAvatarAlert(null)
    }
    reader.onerror = () => {
      setAvatarAlert({ type: 'danger', message: 'Gagal membaca file foto profil.' })
    }
    reader.readAsDataURL(file)
  }

  function commitProfileSession(nextUser, extraFields = {}) {
    const storedUser = readStoredUser() || {}
    const currentAuth = getAuth() || {}
    const normalized = normalizeProfileUser({ ...storedUser, ...currentAuth, ...(nextUser || {}) })
    const fullName = normalized.name || normalized.nama_lengkap || normalized.nama || profile.name || 'Kepala Camat'
    const avatar = normalized.avatar || ''
    const authUser = {
      ...currentAuth,
      ...normalized,
      role: 'kepala_camat',
      name: fullName,
      nama: normalized.nama || normalized.nama_lengkap || fullName,
      nama_lengkap: normalized.nama_lengkap || normalized.nama || fullName,
      username: normalized.username || profile.username,
      email: normalized.email || '',
      no_hp: normalized.no_hp || '',
      phone: normalized.phone || normalized.no_hp || '',
      alamat: normalized.alamat || '',
      address: normalized.address || normalized.alamat || '',
      jabatan: extraFields.jabatan || currentAuth.jabatan || profile.jabatan || 'Kepala Camat',
      roleLabel: extraFields.roleLabel || currentAuth.roleLabel || profile.roleLabel || 'Kepala Camat',
      unit: extraFields.unit || currentAuth.unit || profile.unit || 'Kecamatan Rantau Kopar',
      avatar,
      ...blankAvatarFields(avatar),
    }

    window.localStorage.setItem('user', JSON.stringify(authUser))
    window.localStorage.setItem('role', 'kepala_camat')
    setAuth(authUser)
    window.dispatchEvent(new Event('rk-auth-updated'))
    return authUser
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const payload = buildProfilePayload(profile)
    const currentAuth = getAuth() || {}
    const currentUser = readStoredUser() || {}

    setIsSaving(true)
    setNotice(null)
    setAvatarAlert(null)

    try {
      let result

      if (avatarFile) {
        const formData = new FormData()
        formData.append('nama_lengkap', payload.nama_lengkap)
        formData.append('username', payload.username)
        formData.append('email', payload.email)
        formData.append('no_hp', payload.no_hp)
        formData.append('alamat', payload.alamat)
        formData.append('role', payload.role)
        formData.append('avatar', avatarFile)
        result = await updateProfileWithAvatar(formData)
      } else {
        result = await updateProfile(payload)
      }

      if (!result?.success) {
        setNotice({ type: 'danger', message: result?.message || 'Gagal memperbarui profil Kepala Camat.' })
        return
      }

      const backendProfile = extractProfileFromResponse(result.data, {
        ...currentUser,
        ...currentAuth,
        ...payload,
        username: profile.username,
        role: 'kepala_camat',
        avatar: profile.avatar || '',
        foto_profil: profile.avatar || '',
        photo: profile.avatar || '',
        foto: profile.avatar || '',
      })
      const nextName = backendProfile.nama_lengkap || payload.nama_lengkap || backendProfile.name || profile.name

      const nextAuth = commitProfileSession(
        {
          ...currentUser,
          ...currentAuth,
          ...backendProfile,
          name: nextName,
          nama: nextName,
          nama_lengkap: nextName,
          username: backendProfile.username || profile.username,
          role: 'kepala_camat',
          ...blankAvatarFields(backendProfile.avatar || profile.avatar || ''),
        },
        {
          jabatan: profile.jabatan,
          roleLabel: profile.roleLabel,
          unit: profile.unit,
        }
      )

      const nextProfile = buildProfile(nextAuth, nextAuth)
      setProfile(nextProfile)
      setAvatarFile(null)
      setHasPersistedAvatar(Boolean(nextProfile.avatar))
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      setNotice({ type: 'success', message: result.message || 'Profil Kepala Camat berhasil diperbarui.' })
    } catch (err) {
      setNotice({ type: 'danger', message: err?.message || 'Gagal memperbarui profil Kepala Camat.' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAvatar() {
    if (!hasAvatar || isDeletingAvatar || isSaving) return

    const previousProfile = profile
    const previousAvatarFile = avatarFile
    const previousHasPersistedAvatar = hasPersistedAvatar
    const currentAuth = getAuth() || {}
    const currentUser = readStoredUser() || {}
    const payload = buildProfilePayload(profile)

    setProfile((prev) => ({ ...prev, avatar: '' }))
    setAvatarFile(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    setAvatarAlert(null)
    setNotice(null)

    if (!previousHasPersistedAvatar) {
      setNotice({ type: 'success', message: 'Preview foto profil berhasil dihapus.' })
      return
    }

    setIsDeletingAvatar(true)

    try {
      let result = await deleteAvatar()

      if (!result?.success && result?.notSupported) {
        result = await updateProfile({
          ...payload,
          avatar: null,
          foto_profil: null,
          photo: null,
          foto: null,
        })
      }

      if (!result?.success) {
        setProfile(previousProfile)
        setAvatarFile(previousAvatarFile)
        setHasPersistedAvatar(previousHasPersistedAvatar)
        setNotice({ type: 'danger', message: result?.message || 'Gagal menghapus foto profil.' })
        return
      }

      const backendProfile = extractProfileFromResponse(result.data, {
        ...currentUser,
        ...currentAuth,
        ...payload,
        username: profile.username,
        role: 'kepala_camat',
        avatar: '',
        foto_profil: '',
        photo: '',
        foto: '',
      })

      const nextAuth = commitProfileSession(
        {
          ...currentUser,
          ...currentAuth,
          ...backendProfile,
          username: backendProfile.username || profile.username,
          role: 'kepala_camat',
          ...blankAvatarFields(''),
        },
        {
          jabatan: profile.jabatan,
          roleLabel: profile.roleLabel,
          unit: profile.unit,
        }
      )

      const nextProfile = buildProfile(nextAuth, nextAuth)
      setProfile(nextProfile)
      setHasPersistedAvatar(false)
      setNotice({ type: 'success', message: result.message || 'Foto profil berhasil dihapus.' })
    } catch (err) {
      setProfile(previousProfile)
      setAvatarFile(previousAvatarFile)
      setHasPersistedAvatar(previousHasPersistedAvatar)
      setNotice({ type: 'danger', message: err?.message || 'Gagal menghapus foto profil.' })
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  return (
    <div className="kcm-page">
      <SidebarKepalaCamat active="profil" />

      <main className="kcm-main">
        <header className="kcm-header">
          <div>
            <h1>Profil Kepala Camat</h1>
            <p>Kelola identitas akun Kepala Camat untuk kebutuhan monitoring pelayanan.</p>
          </div>

          <div className="kcm-profile" aria-label="Profil kepala camat">
            <KepalaCamatAvatar user={profile} className="kcm-avatar" />
            <div>
              <strong>{profile.name || 'Kepala Camat'}</strong>
              <span>{profile.unit || 'Kecamatan Rantau Kopar'}</span>
            </div>
          </div>
        </header>

        <div className="kcm-content">
          {notice ? (
            <div
              className={`kcm-profileNotice ${notice.type === 'success' ? 'is-success' : 'is-danger'}`}
              role={notice.type === 'success' ? 'status' : 'alert'}
              aria-live={notice.type === 'success' ? 'polite' : 'assertive'}
            >
              {notice.type === 'success' ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
              {notice.message}
            </div>
          ) : null}

          <section className="kcm-profileGrid" aria-label="Profil kepala camat">
            <aside className="kcm-profileSummary">
              <div className="kcm-profilePhotoWrap">
                <KepalaCamatAvatar user={profile} className="kcm-profilePhoto" alt="Foto profil Kepala Camat" />
              </div>

              <h2>{profile.name || 'Kepala Camat'}</h2>
              <p>{profile.jabatan || 'Kepala Camat'}</p>

              <button
                type="button"
                className="kcm-outlineBtn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isSaving || isDeletingAvatar}
              >
                <FiCamera aria-hidden="true" />
                Ubah Foto Profil
              </button>
              {hasAvatar ? (
                <button
                  type="button"
                  className="kcm-outlineBtn kcm-outlineBtnDanger"
                  onClick={() => void handleDeleteAvatar()}
                  disabled={isSaving || isDeletingAvatar}
                >
                  {isDeletingAvatar ? <FiLoader className="kcm-spin" aria-hidden="true" /> : <FiTrash2 aria-hidden="true" />}
                  Hapus Foto
                </button>
              ) : null}
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                hidden
                onChange={handleAvatarChange}
              />

              {avatarAlert ? (
                <div className="kcm-profileNotice is-danger kcm-avatarAlert" role="alert" aria-live="assertive">
                  <FiAlertCircle aria-hidden="true" />
                  {avatarAlert.message}
                </div>
              ) : null}

              <div className="kcm-profileSummaryMeta">
                <div className="kcm-profileSummaryRow">
                  <FiShield aria-hidden="true" />
                  <span>Role: Kepala Camat</span>
                </div>
                <div className="kcm-profileSummaryRow">
                  <FiMapPin aria-hidden="true" />
                  <span>{profile.unit || '-'}</span>
                </div>
              </div>
            </aside>

            <form className="kcm-profileForm" onSubmit={handleSubmit}>
              <div className="kcm-panelHeader">
                <h2>Data Profil</h2>
                <span className="kcm-panelCount">Kepala Camat</span>
              </div>

              <div className="kcm-profileFields">
                <label>
                  <span>Nama</span>
                  <div className="kcm-inputWrap">
                    <FiUser aria-hidden="true" />
                    <input type="text" name="name" value={profile.name} onChange={handleChange} placeholder="Nama lengkap" />
                  </div>
                </label>

                <label>
                  <span>Username</span>
                  <div className="kcm-inputWrap">
                    <FiUser aria-hidden="true" />
                    <input type="text" name="username" value={profile.username} readOnly />
                  </div>
                </label>

                <label>
                  <span>Email</span>
                  <div className="kcm-inputWrap">
                    <FiMail aria-hidden="true" />
                    <input type="email" name="email" value={profile.email} onChange={handleChange} placeholder="nama@email.com" />
                  </div>
                </label>

                <label>
                  <span>Nomor HP</span>
                  <div className="kcm-inputWrap">
                    <FiPhone aria-hidden="true" />
                    <input type="tel" name="no_hp" value={profile.no_hp} onChange={handleChange} placeholder="08xxxxxxxxxx" />
                  </div>
                </label>

                <label>
                  <span>Alamat</span>
                  <div className="kcm-inputWrap">
                    <FiMapPin aria-hidden="true" />
                    <input type="text" name="alamat" value={profile.alamat} onChange={handleChange} placeholder="Alamat" />
                  </div>
                </label>

                <label>
                  <span>Jabatan / Role</span>
                  <div className="kcm-inputWrap">
                    <FiInfo aria-hidden="true" />
                    <input type="text" name="jabatan" value={profile.jabatan} readOnly />
                  </div>
                </label>

                <label>
                  <span>Unit Kerja</span>
                  <div className="kcm-inputWrap">
                    <FiMapPin aria-hidden="true" />
                    <input type="text" name="unit" value={profile.unit} readOnly />
                  </div>
                </label>
              </div>

              <div className="kcm-profileActions">
                <button type="submit" className="kcm-primaryBtn" disabled={isSaving || isDeletingAvatar}>
                  {isSaving ? <FiLoader className="kcm-spin" aria-hidden="true" /> : <FiSave aria-hidden="true" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
