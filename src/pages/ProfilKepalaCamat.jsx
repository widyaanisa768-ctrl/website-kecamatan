import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiBarChart2,
  FiCamera,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiShield,
  FiUser,
} from 'react-icons/fi'
import { getAuth, setAuth } from '../lib/rkLocal'
import { clearAuthArtifacts, logout as remoteLogout } from '../services/authService'
import './DashboardKepalaCamat.css'

function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

function getInitials(name, username) {
  const source = String(name || username || 'Kepala Camat').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
}

function buildProfile() {
  const auth = getAuth() || {}
  const user = readStoredUser() || {}
  const base = { ...user, ...auth }
  return {
    name: base.name || base.nama || 'Kepala Camat',
    nama: base.nama || base.name || 'Kepala Camat',
    username: base.username || 'kepala',
    nip: base.nip || '',
    email: base.email || '',
    no_hp: base.no_hp || base.phone || base.nomor_hp || '',
    alamat: base.alamat || base.address || '',
    jabatan: base.jabatan || 'Kepala Camat',
    roleLabel: base.roleLabel || 'Kepala Camat',
    unit: base.unit || 'Kecamatan Rantau Kopar',
    role: 'kepala_camat',
    avatar: base.avatar || base.photo || base.foto || '',
  }
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
  const [profile, setProfile] = useState(() => buildProfile())
  const [notice, setNotice] = useState('')
  const avatarInputRef = useRef(null)

  const initials = getInitials(profile.name, profile.username)
  const avatar = profile.avatar

  useEffect(() => {
    const syncProfile = () => setProfile(buildProfile())
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
    if (notice) setNotice('')
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type || !file.type.startsWith('image/')) {
      setNotice('File foto profil harus berupa gambar.')
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
    reader.onerror = () => setNotice('Gagal membaca file foto profil.')
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()

    const formName = profile.name || profile.nama || 'Kepala Camat'
    const nextAuth = {
      ...(getAuth() || {}),
      role: 'kepala_camat',
      name: formName,
      nama: formName,
      username: profile.username,
      nip: profile.nip,
      email: profile.email,
      no_hp: profile.no_hp,
      alamat: profile.alamat,
      jabatan: profile.jabatan,
      roleLabel: profile.roleLabel || 'Kepala Camat',
      unit: profile.unit,
      avatar: profile.avatar,
      foto: profile.avatar,
      photo: profile.avatar,
    }

    window.localStorage.setItem('user', JSON.stringify(nextAuth))
    window.localStorage.setItem('role', 'kepala_camat')
    setAuth(nextAuth)
    setProfile(buildProfile())
    window.dispatchEvent(new Event('rk-auth-updated'))
    setNotice('Profil Kepala Camat berhasil diperbarui.')
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
            <div className="kcm-avatar" aria-hidden="true">
              {avatar ? <img src={avatar} alt="" /> : initials}
            </div>
            <div>
              <strong>{profile.name || 'Kepala Camat'}</strong>
              <span>{profile.unit || 'Kecamatan Rantau Kopar'}</span>
            </div>
          </div>
        </header>

        <div className="kcm-content">
          {notice ? (
            <div className="kcm-profileNotice" role="status" aria-live="polite">
              <FiCheckCircle aria-hidden="true" />
              {notice}
            </div>
          ) : null}

          <section className="kcm-profileGrid" aria-label="Profil kepala camat">
            <aside className="kcm-profileSummary">
              <div className="kcm-profilePhotoWrap">
                {avatar ? (
                  <img className="kcm-profilePhoto" src={avatar} alt="Foto profil Kepala Camat" />
                ) : (
                  <div className="kcm-profilePhoto isFallback" aria-hidden="true">
                    {initials}
                  </div>
                )}
              </div>

              <h2>{profile.name || 'Kepala Camat'}</h2>
              <p>{profile.jabatan || 'Kepala Camat'}</p>

              <button type="button" className="kcm-outlineBtn" onClick={() => avatarInputRef.current?.click()}>
                <FiCamera aria-hidden="true" />
                Ubah Foto Profil
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />

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
                  <span>NIP</span>
                  <div className="kcm-inputWrap">
                    <FiShield aria-hidden="true" />
                    <input type="text" name="nip" value={profile.nip} onChange={handleChange} placeholder="NIP" />
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
                    <input type="text" name="jabatan" value={profile.jabatan} onChange={handleChange} readOnly />
                  </div>
                </label>
              </div>

              <div className="kcm-profileActions">
                <button type="submit" className="kcm-primaryBtn">
                  <FiSave aria-hidden="true" />
                  Simpan Profil
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}
