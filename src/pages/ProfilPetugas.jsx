import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCamera, FiCheckCircle, FiMail, FiMapPin, FiPhone, FiSave, FiShield, FiUser } from 'react-icons/fi'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth, setAuth } from '../lib/rkLocal'
import '../styles/petugas-ui.css'
import './ProfilPetugas.css'

function getInitials(name, username) {
  const source = String(name || username || 'Petugas').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function buildProfile(auth) {
  const base = auth || {}
  return {
    name: base.name || base.nama || 'Petugas',
    nama: base.nama || base.name || 'Petugas',
    username: base.username || '',
    email: base.email || '',
    no_hp: base.no_hp || base.phone || base.nomor_hp || '',
    jabatan: base.jabatan || 'Petugas Pelayanan Terpadu',
    unit: base.unit || 'Kantor Camat Rantau Kopar',
    role: base.role || 'petugas',
    avatar: base.avatar || base.photo || base.foto || '',
  }
}

export default function ProfilPetugas() {
  const initialProfile = useMemo(() => buildProfile(getAuth()), [])
  const [profile, setProfile] = useState(initialProfile)
  const [notice, setNotice] = useState('')
  const avatarInputRef = useRef(null)

  const initials = getInitials(profile.name, profile.username)

  useEffect(() => {
    const syncProfile = () => setProfile(buildProfile(getAuth()))
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
    if (notice) setNotice('')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type || !file.type.startsWith('image/')) {
      setNotice('File avatar harus berupa gambar.')
      e.target.value = ''
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setNotice('Ukuran foto maksimal 2MB.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatar: String(reader.result || '') }))
      if (notice) setNotice('')
    }
    reader.onerror = () => {
      setNotice('Gagal membaca file avatar.')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const auth = getAuth() || {}
    const formName = profile.name || profile.nama || 'Petugas'
    const nextAuth = {
      ...auth,
      role: 'petugas',
      name: formName,
      nama: formName,
      username: profile.username,
      email: profile.email,
      no_hp: profile.no_hp,
      jabatan: profile.jabatan,
      unit: profile.unit,
      avatar: profile.avatar,
      foto: profile.avatar,
      photo: profile.avatar,
    }

    window.localStorage.setItem('user', JSON.stringify(nextAuth))
    window.localStorage.setItem('role', 'petugas')
    setAuth(nextAuth)
    setProfile(buildProfile(nextAuth))
    console.log('[ProfilPetugas] saved auth:', nextAuth)
    window.dispatchEvent(new Event('rk-auth-updated'))
    setNotice('Profil petugas berhasil diperbarui.')
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
                  <button
                    type="button"
                    className="ptg-profilePetugasAvatarBtn"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <FiCamera aria-hidden="true" />
                    <span>Ubah Avatar</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                  />
                </div>

                {notice ? (
                  <div className="ptg-profilePetugasNotice" role="status" aria-live="polite">
                    <FiCheckCircle aria-hidden="true" />
                    {notice}
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
                  <button type="submit" className="ptg-btn ptg-btnPrimary ptg-profilePetugasSave">
                    <FiSave aria-hidden="true" />
                    Simpan Profil
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
