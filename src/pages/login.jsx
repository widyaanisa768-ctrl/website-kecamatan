import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield, FiUser, FiZap } from 'react-icons/fi'
import { setAuth } from '../lib/rkLocal'
import { getBackendErrors, validateLoginForm } from '../lib/formValidation'
import { login } from '../services/authService'
import { normalizeProfileUser } from '../services/profileService'
import './Auth.css'

function normalizeRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'masyarakat') return 'masyarakat'
  if (normalized === 'petugas') return 'petugas'
  if (normalized === 'kepala_camat') return 'kepala_camat'
  return ''
}

function buildBackendAuthUser(user, usernameInput, role) {
  const source = user && typeof user === 'object' ? user : {}
  const username = source.username || source.user_name || usernameInput
  const name = source.name || source.nama || source.nama_lengkap || username
  return normalizeProfileUser({
    ...source,
    role,
    username,
    name,
    nama: source.nama || name,
  })
}

function saveBackendAuth(payload, authUser) {
  const accessToken = payload?.accessToken || payload?.token || ''
  const token = payload?.token || payload?.accessToken || ''

  if (accessToken) window.localStorage.setItem('accessToken', accessToken)
  if (token) window.localStorage.setItem('token', token)
  window.localStorage.setItem('user', JSON.stringify(authUser))
  window.localStorage.setItem('role', authUser.role)
  setAuth(authUser)
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    username: '',
    password: '',
    remember: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (location.pathname === '/login' && params.has('role')) {
      navigate('/login', { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  const points = useMemo(
    () => [
      { title: 'Layanan Lengkap', desc: 'Berbagai jenis surat dan rekomendasi.', icon: FiZap },
      { title: 'Proses Mudah', desc: 'Ajukan online tanpa antri.', icon: FiCheckCircle },
      { title: 'Transparan', desc: 'Pantau status pengajuan secara real-time.', icon: FiArrowRight },
      { title: 'Aman', desc: 'Data Anda terlindungi dengan baik.', icon: FiShield },
    ],
    []
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (validationErrors.length > 0 && (name === 'username' || name === 'password')) {
      setValidationErrors([])
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    void (async () => {
      const frontendErrors = validateLoginForm(form)
      if (frontendErrors.length > 0) {
        setValidationErrors(frontendErrors)
        return
      }

      setBusy(true)
      setValidationErrors([])

      const usernameInput = form.username.trim()
      const passwordInput = form.password

      try {
        const payload = await login(usernameInput, passwordInput)

        if (!payload?.success) {
          setValidationErrors(getBackendErrors(payload, 'Username atau password salah.'))
          return
        }

        const user = payload.user || null
        const role = normalizeRole(user?.role)

        if (!role) {
          setValidationErrors(['Role akun tidak dikenali.'])
          return
        }

        const authUser = buildBackendAuthUser(user, usernameInput, role)

        saveBackendAuth(payload, authUser)

        if (role === 'petugas') navigate('/petugas/dashboard', { replace: true })
        else if (role === 'kepala_camat') navigate('/dashboard-kepala-camat', { replace: true })
        else if (role === 'masyarakat') navigate('/layanan', { replace: true })
        else setValidationErrors(['Role akun tidak dikenali.'])
      } catch (err) {
        console.log('[login] error (raw):', err)
        setValidationErrors([`${err?.name || 'Error'}: ${err?.message || String(err)}`])
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

        <section className="rk-authRight" aria-label="Login">
          <div className="rk-authCard card bg-base-100 shadow-xl border border-base-200">
            <div className="rk-authCardHead">
              <h2 className="rk-authCardTitle">Selamat datang</h2>
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
                    className="rk-authInput input input-bordered w-full"
                    type="text"
                    name="username"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={handleChange}
                    autoComplete="username"
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
                    className="rk-authInput input input-bordered w-full"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
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

              {validationErrors.length > 0 ? (
                <div className="rk-authNotice alert alert-error" role="status" aria-live="polite">
                  <strong className="block">Validasi gagal</strong>
                  <div className="mt-2 grid gap-1">
                    {validationErrors.map((err, index) => (
                      <p key={index}>{err}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              <button type="submit" className="rk-authSubmit btn btn-primary" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />}
                {busy ? 'Memproses...' : 'Login'}
              </button>

            </form>

            <div className="rk-authFoot">
              Belum punya akun?{' '}
              <strong>
                <Link className="rk-authLink link link-primary" to="/register">
                  Daftar di sini
                </Link>
              </strong>
              <div style={{ marginTop: 6, fontSize: '0.84rem', opacity: 0.75 }}>
                Khusus masyarakat yang belum punya akun
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
