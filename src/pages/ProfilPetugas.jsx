import { useEffect, useMemo, useRef, useState } from 'react'
import { FiAlertCircle, FiCamera, FiCheckCircle, FiLoader, FiMail, FiMapPin, FiPhone, FiSave, FiShield, FiTrash2, FiUser } from 'react-icons/fi'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth, setAuth } from '../lib/rkLocal'
import {
  deleteAvatar,
  extractProfileFromResponse,
  normalizeProfileUser,
  updateProfile,
  updateProfileWithAvatar,
} from '../services/profileService'
import '../styles/petugas-ui.css'
import './ProfilPetugas.css'

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
  const source = String(name || username || 'Petugas').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function buildProfile(auth, storedUser) {
  const currentAuth = auth || {}
  const base = normalizeProfileUser({ ...(storedUser || {}), ...currentAuth })
  const fullName = base.name || base.nama_lengkap || base.nama || 'Petugas'

  return {
    name: fullName,
    nama: base.nama || base.nama_lengkap || fullName,
    username: base.username || '',
    email: base.email || '',
    no_hp: base.no_hp || base.phone || base.nomor_hp || '',
    jabatan: currentAuth.jabatan || storedUser?.jabatan || base.jabatan || 'Petugas Pelayanan Terpadu',
    unit: currentAuth.unit || storedUser?.unit || base.unit || 'Kantor Camat Rantau Kopar',
    role: base.role || 'petugas',
    avatar: base.avatar || base.photo || base.foto || '',
  }
}

function buildProfilePayload(profile) {
  const fullName = String(profile.name || profile.nama || '').trim()
  return {
    nama_lengkap: fullName,
    username: String(profile.username || '').trim(),
    email: String(profile.email || '').trim(),
    no_hp: String(profile.no_hp || '').replace(/\D/g, ''),
    alamat: '',
    role: 'petugas',
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

export default function ProfilPetugas() {
  const initialProfile = useMemo(() => buildProfile(getAuth(), readStoredUser()), [])
  const [profile, setProfile] = useState(initialProfile)
  const [notice, setNotice] = useState(null)
  const [avatarAlert, setAvatarAlert] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false)
  const [hasPersistedAvatar, setHasPersistedAvatar] = useState(Boolean(initialProfile.avatar))
  const avatarInputRef = useRef(null)

  const initials = getInitials(profile.name, profile.username)
  const hasAvatar = Boolean(profile.avatar)
  const allowedAvatarTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarAlert(null)

    if (!allowedAvatarTypes.has(String(file.type || '').toLowerCase())) {
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

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || '') }))
      setAvatarFile(file)
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
    const fullName = normalized.name || normalized.nama_lengkap || normalized.nama || profile.name || 'Petugas'
    const avatar = normalized.avatar || ''
    const authUser = {
      ...currentAuth,
      ...normalized,
      role: 'petugas',
      name: fullName,
      nama: normalized.nama || normalized.nama_lengkap || fullName,
      nama_lengkap: normalized.nama_lengkap || normalized.nama || fullName,
      email: normalized.email || '',
      no_hp: normalized.no_hp || '',
      phone: normalized.phone || normalized.no_hp || '',
      jabatan: extraFields.jabatan || currentAuth.jabatan || profile.jabatan || 'Petugas Pelayanan Terpadu',
      unit: extraFields.unit || currentAuth.unit || profile.unit || 'Kantor Camat Rantau Kopar',
      avatar,
      ...blankAvatarFields(avatar),
    }

    window.localStorage.setItem('user', JSON.stringify(authUser))
    window.localStorage.setItem('role', 'petugas')
    setAuth(authUser)
    window.dispatchEvent(new Event('rk-auth-updated'))
    return authUser
  }

  const handleSubmit = async (e) => {
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
        setNotice({ type: 'danger', message: result?.message || 'Gagal memperbarui profil petugas.' })
        return
      }

      const backendProfile = extractProfileFromResponse(result.data, {
        ...currentUser,
        ...currentAuth,
        ...payload,
        username: profile.username,
        role: 'petugas',
        avatar: profile.avatar || '',
        foto_profil: profile.avatar || '',
        photo: profile.avatar || '',
        foto: profile.avatar || '',
      })

      const nextAuth = commitProfileSession(
        {
          ...currentUser,
          ...currentAuth,
          ...backendProfile,
          username: backendProfile.username || profile.username,
          role: 'petugas',
          ...blankAvatarFields(backendProfile.avatar || profile.avatar || ''),
        },
        {
          jabatan: profile.jabatan,
          unit: profile.unit,
        }
      )

      const nextProfile = buildProfile(nextAuth, nextAuth)
      setProfile(nextProfile)
      setAvatarFile(null)
      setHasPersistedAvatar(Boolean(nextProfile.avatar))
      if (avatarInputRef.current) avatarInputRef.current.value = ''
      setNotice({ type: 'success', message: result.message || 'Profil petugas berhasil diperbarui.' })
    } catch (err) {
      setNotice({ type: 'danger', message: err?.message || 'Gagal memperbarui profil petugas.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!hasAvatar || isDeletingAvatar || isSaving) return
    if (!window.confirm('Hapus foto profil petugas ini?')) return

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
        role: 'petugas',
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
          role: 'petugas',
          ...blankAvatarFields(''),
        },
        {
          jabatan: profile.jabatan,
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
    <div className="ptg-page ptg-profilePetugasPage">
      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Profil Petugas" />

        <main className="ptg-main">
          <header className="ptg-topbar ptg-profilePetugasTopbar">
            <div className="ptg-topbarTitle">
              <h1>Profil Petugas</h1>
              <p>Kelola identitas akun petugas yang tampil di dashboard.</p>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-profilePetugasGrid">
              <aside className="ptg-card ptg-profilePetugasSummary" aria-label="Ringkasan profil petugas">
                <div className="ptg-profilePetugasAvatarWrap">
                  {profile.avatar ? (
                    <img className="ptg-profilePetugasAvatar" src={profile.avatar} alt="Avatar petugas" />
                  ) : (
                    <div className="ptg-profilePetugasAvatar isFallback" aria-hidden="true">
                      {initials}
                    </div>
                  )}
                </div>

                <h2 className="ptg-profilePetugasName">{profile.name || profile.username || 'Petugas'}</h2>
                <p className="ptg-profilePetugasUsername">@{profile.username || 'petugas'}</p>

                <div className="ptg-profilePetugasInfoList">
                  <div className="ptg-profilePetugasInfo">
                    <FiShield aria-hidden="true" />
                    <span>{profile.role}</span>
                  </div>
                  <div className="ptg-profilePetugasInfo">
                    <FiMapPin aria-hidden="true" />
                    <span>{profile.unit || '-'}</span>
                  </div>
                </div>
              </aside>

              <form className="ptg-card ptg-profilePetugasFormCard" onSubmit={handleSubmit}>
                <div className="ptg-profilePetugasFormHead">
                  <div>
                    <p className="ptg-profilePetugasEyebrow">Edit Profil</p>
                    <h2 className="ptg-profilePetugasFormTitle">Data Akun Petugas</h2>
                  </div>
                  <div className="ptg-profilePetugasAvatarActions">
                    <button
                      type="button"
                      className="ptg-profilePetugasAvatarBtn"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isSaving || isDeletingAvatar}
                    >
                      <FiCamera aria-hidden="true" />
                      <span>Ubah Avatar</span>
                    </button>
                    {hasAvatar ? (
                      <button
                        type="button"
                        className="ptg-profilePetugasAvatarBtn isDanger"
                        onClick={() => void handleDeleteAvatar()}
                        disabled={isSaving || isDeletingAvatar}
                      >
                        {isDeletingAvatar ? <FiLoader className="ptg-spin" aria-hidden="true" /> : <FiTrash2 aria-hidden="true" />}
                        <span>Hapus Foto</span>
                      </button>
                    ) : null}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      hidden
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                {avatarAlert ? (
                  <div
                    className={`ptg-profilePetugasNotice ${avatarAlert.type === 'success' ? 'isSuccess' : 'isDanger'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {avatarAlert.type === 'success' ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
                    {avatarAlert.message}
                  </div>
                ) : null}

                {notice ? (
                  <div
                    className={`ptg-profilePetugasNotice ${notice.type === 'success' ? 'isSuccess' : 'isDanger'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {notice.type === 'success' ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
                    {notice.message}
                  </div>
                ) : null}

                <div className="ptg-profilePetugasFields">
                  <label className="ptg-profilePetugasField">
                    <span>Nama</span>
                    <div className="ptg-profilePetugasInputWrap">
                      <FiUser aria-hidden="true" />
                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        placeholder="Masukkan nama"
                      />
                    </div>
                  </label>

                  <label className="ptg-profilePetugasField">
                    <span>Username</span>
                    <div className="ptg-profilePetugasInputWrap">
                      <FiUser aria-hidden="true" />
                      <input type="text" value={profile.username} readOnly />
                    </div>
                  </label>

                  <label className="ptg-profilePetugasField">
                    <span>Email</span>
                    <div className="ptg-profilePetugasInputWrap">
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

                  <label className="ptg-profilePetugasField">
                    <span>Nomor HP</span>
                    <div className="ptg-profilePetugasInputWrap">
                      <FiPhone aria-hidden="true" />
                      <input
                        type="tel"
                        name="no_hp"
                        value={profile.no_hp}
                        onChange={handleChange}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </label>

                  <label className="ptg-profilePetugasField">
                    <span>Jabatan</span>
                    <div className="ptg-profilePetugasInputWrap">
                      <FiShield aria-hidden="true" />
                      <input
                        type="text"
                        name="jabatan"
                        value={profile.jabatan}
                        onChange={handleChange}
                        placeholder="Jabatan"
                      />
                    </div>
                  </label>

                  <label className="ptg-profilePetugasField">
                    <span>Unit Kerja</span>
                    <div className="ptg-profilePetugasInputWrap">
                      <FiMapPin aria-hidden="true" />
                      <input
                        type="text"
                        name="unit"
                        value={profile.unit}
                        onChange={handleChange}
                        placeholder="Unit kerja"
                      />
                    </div>
                  </label>
                </div>

                <div className="ptg-profilePetugasActions">
                  <button type="submit" className="ptg-btn ptg-btnPrimary ptg-profilePetugasSave" disabled={isSaving || isDeletingAvatar}>
                    {isSaving ? <FiLoader className="ptg-spin" aria-hidden="true" /> : <FiSave aria-hidden="true" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
