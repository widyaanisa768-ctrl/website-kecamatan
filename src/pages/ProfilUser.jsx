import { useMemo, useRef, useState } from 'react'
import { FiAlertCircle, FiCamera, FiCheckCircle, FiLoader, FiMail, FiMapPin, FiPhone, FiSave, FiShield, FiTrash2, FiUser } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAuth, setAuth } from '../lib/rkLocal'
import {
  deleteAvatar,
  extractProfileFromResponse,
  normalizeProfileUser,
  updateProfile,
  updateProfileWithAvatar,
} from '../services/profileService'
import './ProfilUser.css'

function readStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function getInitials(name, username) {
  const source = (name || username || 'User').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function buildProfile(auth, storedUser) {
  const base = normalizeProfileUser({ ...(storedUser || {}), ...(auth || {}) })
  const fullName = base.nama_lengkap || base.name || base.nama || ''

  return {
    fullName,
    username: base.username || '',
    email: base.email || '',
    phone: base.no_hp || base.phone || base.nomor_hp || '',
    address: base.alamat || base.address || '',
    role: base.role || 'masyarakat',
    avatar: base.avatar || base.photo || base.foto || '',
  }
}

function validateProfileInput(profile) {
  const errors = []
  const fullName = String(profile.fullName || '').trim()
  const username = String(profile.username || '').trim()
  const email = String(profile.email || '').trim()
  const phone = String(profile.phone || '').replace(/\D/g, '')

  if (!fullName) errors.push('Nama lengkap wajib diisi.')
  if (!username) errors.push('Username wajib tersedia.')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email harus valid.')
  if (!phone) errors.push('Nomor HP wajib diisi.')
  else if (!/^\d{10,15}$/.test(phone)) errors.push('Nomor HP harus berisi 10-15 digit angka.')

  return errors
}

function buildProfilePayload(profile) {
  return {
    nama_lengkap: String(profile.fullName || '').trim(),
    username: String(profile.username || '').trim(),
    email: String(profile.email || '').trim(),
    no_hp: String(profile.phone || '').replace(/\D/g, ''),
    alamat: String(profile.address || '').trim(),
    role: String(profile.role || '').trim() || 'masyarakat',
  }
}

function buildAuthUser(nextUser, currentAuth) {
  const normalized = normalizeProfileUser(nextUser)
  const baseAuth = currentAuth && typeof currentAuth === 'object' ? currentAuth : {}
  const role = normalized.role || baseAuth.role || 'masyarakat'
  const username = normalized.username || baseAuth.username || ''
  const name = normalized.name || normalized.nama_lengkap || normalized.nama || username

  return {
    ...baseAuth,
    ...normalized,
    role,
    username,
    name,
    nama: normalized.nama || normalized.nama_lengkap || name,
    nama_lengkap: normalized.nama_lengkap || normalized.nama || name,
    email: normalized.email || '',
    no_hp: normalized.no_hp || '',
    phone: normalized.phone || normalized.no_hp || '',
    alamat: normalized.alamat || '',
    address: normalized.address || normalized.alamat || '',
    avatar: normalized.avatar || '',
    foto_profil: normalized.avatar || '',
    photo: normalized.avatar || '',
    foto: normalized.avatar || '',
  }
}

export default function ProfilUser() {
  const initialProfile = useMemo(() => buildProfile(getAuth(), readStoredUser()), [])
  const [profile, setProfile] = useState(initialProfile)
  const [errorMessages, setErrorMessages] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [hasPersistedAvatar, setHasPersistedAvatar] = useState(Boolean(initialProfile.avatar))
  const avatarInputRef = useRef(null)

  const initials = getInitials(profile.fullName, profile.username)

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    if (errorMessages.length > 0) setErrorMessages([])
    if (successMessage) setSuccessMessage('')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!String(file.type || '').startsWith('image/')) {
      setErrorMessages(['File foto profil harus berupa gambar.'])
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || '') }))
      setAvatarFile(file)
      if (errorMessages.length > 0) setErrorMessages([])
      if (successMessage) setSuccessMessage('')
    }
    reader.onerror = () => setErrorMessages(['Gagal membaca file foto profil.'])
    reader.readAsDataURL(file)
  }

  const commitProfileSession = (nextUser) => {
    const storedUser = readStoredUser() || {}
    const currentAuth = getAuth() || {}
    const normalizedUser = normalizeProfileUser({ ...storedUser, ...currentAuth, ...(nextUser || {}) })
    const authUser = buildAuthUser(normalizedUser, currentAuth)

    window.localStorage.setItem('user', JSON.stringify(normalizedUser))
    if (authUser.role) window.localStorage.setItem('role', authUser.role)
    setAuth(authUser)
    window.dispatchEvent(new Event('rk-auth-updated'))
    return normalizedUser
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const frontendErrors = validateProfileInput(profile)
    if (frontendErrors.length > 0) {
      setErrorMessages(frontendErrors)
      setSuccessMessage('')
      return
    }

    const payload = buildProfilePayload(profile)
    const currentAuth = getAuth() || {}
    const currentUser = readStoredUser() || {}

    console.log('payload profil:', payload)

    setIsSaving(true)
    setErrorMessages([])
    setSuccessMessage('')

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
        for (const pair of formData.entries()) {
          console.log(pair[0], pair[1])
        }
        result = await updateProfileWithAvatar(formData)
      } else {
        result = await updateProfile(payload)
      }

      if (!result?.success) {
        setErrorMessages(result?.errors?.length ? result.errors : [result?.message || 'Gagal menyimpan profil.'])
        return
      }

      const backendProfile = extractProfileFromResponse(result.data, {
        ...currentUser,
        ...currentAuth,
        ...payload,
        username: profile.username,
        role: profile.role,
      })

      const nextUser = commitProfileSession({
        ...currentUser,
        ...currentAuth,
        ...backendProfile,
        username: backendProfile.username || profile.username,
        role: backendProfile.role || profile.role,
      })

      const nextForm = buildProfile(nextUser, nextUser)
      setProfile(nextForm)
      setAvatarFile(null)
      setHasPersistedAvatar(Boolean(nextUser.avatar))
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      setSuccessMessage(result.message || 'Profil berhasil diperbarui.')
    } catch (err) {
      setErrorMessages([err?.message || 'Gagal menyimpan profil.'])
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (isDeletingAvatar || isSaving) return

    const previousProfile = profile
    const previousAvatarFile = avatarFile
    const previousHasPersistedAvatar = hasPersistedAvatar
    const currentAuth = getAuth() || {}
    const currentUser = readStoredUser() || {}
    const payload = buildProfilePayload(profile)

    setProfile((prev) => ({ ...prev, avatar: '' }))
    setAvatarFile(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    setErrorMessages([])
    setSuccessMessage('')

    if (!previousHasPersistedAvatar) {
      setSuccessMessage('Preview foto profil berhasil dihapus.')
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
        setErrorMessages(result?.errors?.length ? result.errors : [result?.message || 'Gagal menghapus foto profil.'])
        return
      }

      const backendProfile = extractProfileFromResponse(result.data, {
        ...currentUser,
        ...currentAuth,
        ...payload,
        username: profile.username,
        role: profile.role,
        avatar: '',
        foto_profil: '',
        photo: '',
        foto: '',
      })

      const nextUser = commitProfileSession({
        ...currentUser,
        ...currentAuth,
        ...backendProfile,
        username: backendProfile.username || profile.username,
        role: backendProfile.role || profile.role,
        avatar: '',
        foto_profil: '',
        photo: '',
        foto: '',
      })

      setProfile(buildProfile(nextUser, nextUser))
      setHasPersistedAvatar(false)
      setSuccessMessage(result.message || 'Foto profil berhasil dihapus.')
    } catch (err) {
      setProfile(previousProfile)
      setAvatarFile(previousAvatarFile)
      setHasPersistedAvatar(previousHasPersistedAvatar)
      setErrorMessages([err?.message || 'Gagal menghapus foto profil.'])
    } finally {
      setIsDeletingAvatar(false)
    }
  }

  return (
    <div className="rk-portal rk-profileUserPage">
      <Navbar />

      <main>
        <header className="rk-profileUserHero" aria-label="Profil Saya">
          <div className="rk-container rk-profileUserHeroInner">
            <p className="rk-eyebrow">Akun Masyarakat</p>
            <h1 className="rk-profileUserTitle">Profil Saya</h1>
            <p className="rk-profileUserSubtitle">
              Kelola data akun untuk memudahkan pengajuan layanan dan pemantauan status administrasi.
            </p>
          </div>
        </header>

        <section className="rk-profileUserSection" aria-label="Data profil pengguna">
          <div className="rk-container rk-profileUserGrid">
            <aside className="rk-profileUserSummary">
              <div className="rk-profileUserAvatarWrap">
                {profile.avatar ? (
                  <img className="rk-profileUserAvatar" src={profile.avatar} alt="Avatar profil" />
                ) : (
                  <div className="rk-profileUserAvatar isFallback" aria-hidden="true">
                    {initials}
                  </div>
                )}
              </div>

              <h2 className="rk-profileUserName">{profile.fullName || profile.username || 'Pengguna'}</h2>
              <p className="rk-profileUserUsername">@{profile.username || 'username'}</p>

              <div className="rk-profileUserInfoList">
                <div className="rk-profileUserInfo">
                  <FiMail aria-hidden="true" />
                  <span>{profile.email || '-'}</span>
                </div>
                <div className="rk-profileUserInfo">
                  <FiPhone aria-hidden="true" />
                  <span>{profile.phone || '-'}</span>
                </div>
                <div className="rk-profileUserInfo">
                  <FiMapPin aria-hidden="true" />
                  <span>{profile.address || '-'}</span>
                </div>
                <div className="rk-profileUserInfo">
                  <FiShield aria-hidden="true" />
                  <span>{profile.role}</span>
                </div>
              </div>
            </aside>

            <form className="rk-profileUserFormCard" onSubmit={handleSubmit}>
              <div className="rk-profileUserFormHead">
                <div>
                  <p className="rk-eyebrow">Edit Profil</p>
                  <h2 className="rk-profileUserFormTitle">Data Pribadi</h2>
                </div>
                <div className="rk-profileUserFormHeadActions">
                  <label className="rk-profileUserAvatarBtn">
                    <FiCamera aria-hidden="true" />
                    <span>Ubah Avatar</span>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                  {profile.avatar ? (
                    <button
                      type="button"
                      className="rk-profileUserDeleteAvatar"
                      onClick={handleDeleteAvatar}
                      disabled={isDeletingAvatar || isSaving}
                    >
                      {isDeletingAvatar ? <FiLoader className="rk-spin" aria-hidden="true" /> : <FiTrash2 aria-hidden="true" />}
                      {isDeletingAvatar ? 'Menghapus...' : 'Hapus Foto Profil'}
                    </button>
                  ) : null}
                </div>
              </div>

              {errorMessages.length > 0 ? (
                <div className="rk-profileUserNotice isError" role="alert" aria-live="assertive">
                  <FiAlertCircle aria-hidden="true" />
                  <div>
                    {errorMessages.map((message, index) => (
                      <p key={`${message}-${index}`}>{message}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {successMessage ? (
                <div className="rk-profileUserNotice" role="status" aria-live="polite">
                  <FiCheckCircle aria-hidden="true" />
                  <span>{successMessage}</span>
                </div>
              ) : null}

              <div className="rk-profileUserFields">
                <label className="rk-profileUserField">
                  <span>Nama Lengkap</span>
                  <div className="rk-profileUserInputWrap">
                    <FiUser aria-hidden="true" />
                    <input
                      type="text"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </label>

                <label className="rk-profileUserField">
                  <span>Username</span>
                  <div className="rk-profileUserInputWrap">
                    <FiUser aria-hidden="true" />
                    <input type="text" value={profile.username} readOnly />
                  </div>
                </label>

                <label className="rk-profileUserField">
                  <span>Email</span>
                  <div className="rk-profileUserInputWrap">
                    <FiMail aria-hidden="true" />
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                    />
                  </div>
                </label>

                <label className="rk-profileUserField">
                  <span>Nomor HP</span>
                  <div className="rk-profileUserInputWrap">
                    <FiPhone aria-hidden="true" />
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </label>

                <label className="rk-profileUserField isWide">
                  <span>Alamat</span>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap"
                    rows="4"
                  />
                </label>

                <label className="rk-profileUserField">
                  <span>Role</span>
                  <div className="rk-profileUserInputWrap">
                    <FiShield aria-hidden="true" />
                    <input type="text" value={profile.role} readOnly />
                  </div>
                </label>
              </div>

              <div className="rk-profileUserActions">
                <button type="submit" className="rk-profileUserSave" disabled={isSaving}>
                  {isSaving ? <FiLoader className="rk-spin" aria-hidden="true" /> : <FiSave aria-hidden="true" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
