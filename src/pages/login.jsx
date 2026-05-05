import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield, FiUser, FiZap } from 'react-icons/fi'
import { setAuth } from '../lib/rkLocal'
import './Auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    username: '',
    password: '',
    remember: false,
  })
  const [showPassword, setShowPassword] = useState(false)

  const points = useMemo(
    () => [
      { title: 'Layanan Lengkap', desc: 'Berbagai jenis surat dan rekomendasi.', icon: FiZap },
      { title: 'Proses Mudah', desc: 'Ajukan online tanpa antri.', icon: FiCheckCircle },
      { title: 'Transparan', desc: 'Pantau status pengajuan secara real-time.', icon: FiArrowRight },
      { title: 'Aman', desc: 'Data Anda terlindungi dengan baik.', icon: FiShield },
    ],
    []
  )

  const isPetugasMode =
    location.pathname === '/login-petugas' || new URLSearchParams(location.search).get('role') === 'petugas'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!form.username || !form.password) {
      alert('Username dan password wajib diisi')
      return
    }

    if (isPetugasMode) {
      const ok = form.username === 'petugas' && form.password === 'petugas123'
      if (!ok) {
        alert('Username atau password petugas salah')
        return
      }

      setAuth({
        role: 'petugas',
        username: form.username,
        name: 'Widya Putri',
      })

      navigate('/dashboard-petugas')
      return
    }

    setAuth({
      role: 'masyarakat',
      username: form.username,
      name: form.username,
    })
    alert('Login berhasil')
    navigate('/')
  }

  return (
    <div className="rk-authPage isLogin">
      <div className="rk-authShell">
        <section className="rk-authLeft" style={{ '--rk-auth-bg': "url('/images/kantor1.png')" }}>
          <div className="rk-authLeftInner">
            <div className="rk-authBrand">
              <img className="rk-authBrandLogo" src="/images/logo-rohil.png" alt="Logo Rohil" />
              <div className="rk-authBrandText">
                <span className="rk-authBrandLine1">Kecamatan Rantau Kopar</span>
                <span className="rk-authBrandLine2">Kabupaten Rokan Hilir</span>
              </div>
            </div>

            <div className="rk-authHeadline">
              <h1 className="rk-authTitle">Sistem Pelayanan Terpadu</h1>
              <p className="rk-authSubtitle">
                Memudahkan masyarakat dalam mengakses layanan administrasi secara cepat, transparan dan efisien.
              </p>
            </div>

            <div className="rk-authPoints" aria-label="Keunggulan layanan">
              {points.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.title} className="rk-authPoint">
                    <div className="rk-authPointIcon" aria-hidden="true">
                      <Icon />
                    </div>
                    <div className="rk-authPointText">
                      <p className="rk-authPointTitle">{p.title}</p>
                      <p className="rk-authPointDesc">{p.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="rk-authRight" aria-label={isPetugasMode ? 'Login Petugas' : 'Login Masyarakat'}>
          <div className="rk-authCard">
            <div className="rk-authCardHead">
              <h2 className="rk-authCardTitle">Selamat datang</h2>
              <p className="rk-authCardSubtitle">
              {isPetugasMode ? ' sebagai petugas' : ''}
              </p>
            </div>

            <form className="rk-authForm" onSubmit={handleSubmit}>
              <div className="rk-authField">
                <label className="rk-authLabel" htmlFor="rk-login-username">
                  Username
                </label>
                <div className="rk-authInputWrap">
                  <span className="rk-authInputIcon" aria-hidden="true">
                    <FiUser />
                  </span>
                  <input
                    id="rk-login-username"
                    className="rk-authInput"
                    type="text"
                    name="username"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={handleChange}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="rk-authField">
                <label className="rk-authLabel" htmlFor="rk-login-password">
                  Password
                </label>
                <div className="rk-authInputWrap">
                  <span className="rk-authInputIcon" aria-hidden="true">
                    <FiLock />
                  </span>
                  <input
                    id="rk-login-password"
                    className="rk-authInput"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="rk-authToggle"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" className="rk-authSubmit">
                <FiArrowRight aria-hidden="true" />
                Login
              </button>
            </form>

            <div className="rk-authFoot">
              Belum punya akun?{' '}
              <strong>
                <Link className="rk-authLink" to="/register">
                  Daftar di sini
                </Link>
              </strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
