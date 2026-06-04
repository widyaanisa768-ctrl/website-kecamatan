import { useMemo, useState } from 'react'
import { FiCamera, FiCheckCircle, FiMail, FiMapPin, FiPhone, FiSave, FiShield, FiUser } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAuth, setAuth } from '../lib/rkLocal'
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
  const base = { ...(storedUser || {}), ...(auth || {}) }
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

export default function ProfilUser() {
  const initialProfile = useMemo(() => buildProfile(getAuth(), readStoredUser()), [])
  const [profile, setProfile] = useState(initialProfile)
  const [notice, setNotice] = useState('')

  const initials = getInitials(profile.fullName, profile.username)

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    if (notice) setNotice('')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || '') }))
      if (notice) setNotice('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const auth = getAuth() || {}
    const storedUser = readStoredUser() || {}
    const nextUser = {
      ...storedUser,
      ...auth,
      name: profile.fullName,
      nama: profile.fullName,
      nama_lengkap: profile.fullName,
      username: profile.username,
      email: profile.email,
      no_hp: profile.phone,
      phone: profile.phone,
      alamat: profile.address,
      address: profile.address,
      role: profile.role,
      avatar: profile.avatar,
    }

    const nextAuth = {
      ...auth,
      role: profile.role,
      username: profile.username,
      name: profile.fullName || profile.username,
      email: profile.email,
      no_hp: profile.phone,
      alamat: profile.address,
      avatar: profile.avatar,
    }

    window.localStorage.setItem('user', JSON.stringify(nextUser))
    setAuth(nextAuth)
    window.dispatchEvent(new Event('rk-auth-updated'))
    setNotice('Profil berhasil diperbarui.')
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
                <label className="rk-profileUserAvatarBtn">
                  <FiCamera aria-hidden="true" />
                  <span>Ubah Avatar</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>

              {notice ? (
                <div className="rk-profileUserNotice" role="status" aria-live="polite">
                  <FiCheckCircle aria-hidden="true" />
                  {notice}
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
                <button type="submit" className="rk-profileUserSave">
                  <FiSave aria-hidden="true" />
                  Simpan Profil
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
