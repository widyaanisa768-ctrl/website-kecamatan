import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield, FiUser, FiZap } from 'react-icons/fi'
import { setAuth } from '../lib/rkLocal'
import { login } from '../services/authService'
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
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

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

    if (notice && (name === 'username' || name === 'password')) {
      setNotice('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    void (async () => {
      if (!form.username || !form.password) {
        setNotice('Username dan password wajib diisi.')
        return
      }

      setBusy(true)
      setNotice('')

      const usernameInput = form.username
      const passwordInput = form.password

      try {
        if (isPetugasMode) {
          const allowedUsername = 'petugas'
          const allowedPassword = 'petugas123'

          if (usernameInput !== allowedUsername || passwordInput !== allowedPassword) {
            setNotice('Username atau password salah.')
            return
          }

          const user = { role: 'petugas', username: allowedUsername, name: 'Petugas' }
          window.localStorage.setItem('user', JSON.stringify(user))
          setAuth({ role: 'petugas', username: user.username, name: user.name })
          navigate('/petugas/dashboard', { replace: true })
          return
        }

        const payload = await login(usernameInput, passwordInput)

        if (!payload?.success) {
          setNotice(payload?.message || 'Login gagal.')
          return
        }

        const accessToken = payload.accessToken || payload.token || ''
        const user = payload.user || null

        if (accessToken) window.localStorage.setItem('accessToken', accessToken)
        if (user) window.localStorage.setItem('user', JSON.stringify(user))

        const role = user?.role || (isPetugasMode ? 'petugas' : 'masyarakat')
        const resolvedUsername = user?.username || usernameInput
        const name = user?.name || user?.nama || resolvedUsername

        setAuth({ role, username: resolvedUsername, name })
        setNotice('')

        if (role === 'petugas') navigate('/petugas/dashboard', { replace: true })
        else if (role === 'kepala_camat') navigate('/dashboard-kepala-camat')
        else navigate('/layanan')
      } catch (err) {
        console.log('[login] error (raw):', err)
        setNotice(`${err?.name || 'Error'}: ${err?.message || String(err)}`)
      } finally {
        setBusy(false)
      }
    })()
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
                <label className="rk-authLabel" htmlFor="rk-login-email">
                  Username
                </label>
                <div className="rk-authInputWrap">
                  <span className="rk-authInputIcon" aria-hidden="true">
                    <FiUser />
                  </span>
                  <input
                    id="rk-login-email"
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

              {notice ? (
                <div className="rk-authNotice" role="status" aria-live="polite">
                  {notice}
                </div>
              ) : null}

              <button type="submit" className="rk-authSubmit" disabled={busy}>
                <FiArrowRight aria-hidden="true" />
                {busy ? 'Memproses...' : 'Login'}
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
