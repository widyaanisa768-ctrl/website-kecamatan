import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff, FiLock, FiShield, FiUser, FiZap } from 'react-icons/fi'
import { setAuth } from '../lib/rkLocal'
import { getBackendErrors, validateLoginForm } from '../lib/formValidation'
import { loginAnyLocalRole, loginLocalRole } from '../lib/authRoles'
import { login } from '../services/authService'
import './Auth.css'

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

function buildBackendAuthUser(user, usernameInput, role) {
  const source = user && typeof user === 'object' ? user : {}
  const username = source.username || source.user_name || usernameInput
  const name = source.name || source.nama || source.nama_lengkap || username

  return {
    ...source,
    role,
    username,
    name,
    nama: source.nama || name,
  }
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
  const isKepalaCamatMode = new URLSearchParams(location.search).get('role') === 'kepala_camat'
  // Akun kepala camat masih memakai login lokal.
  const localRoleMode = isKepalaCamatMode ? 'kepala_camat' : ''
  const authPanelLabel =
    isPetugasMode
      ? 'Login Petugas'
      : localRoleMode === 'kepala_camat'
        ? 'Login Kepala Camat'
        : 'Login Masyarakat'

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

      const finishLocalLogin = (result) => {
        const user = result.user
        window.localStorage.setItem('user', JSON.stringify(user))
        window.localStorage.setItem('role', user.role)
        setAuth(user)
        navigate(result.redirect, { replace: true })
      }

      try {
        if (isPetugasMode) {
          const payload = await login(usernameInput, passwordInput)

          if (!payload?.success) {
            setValidationErrors(getBackendErrors(payload, 'Username atau password salah.'))
            return
          }

          const user = payload.user || null
          const role = normalizeRole(user?.role)

          if (role !== 'petugas') {
            setValidationErrors(['Akun ini bukan akun petugas.'])
            return
          }

          const authUser = buildBackendAuthUser(user, usernameInput, role)
          saveBackendAuth(payload, authUser)
          navigate('/dashboard-petugas', { replace: true })
          return
        }

        if (localRoleMode) {
          const result = loginLocalRole(usernameInput, passwordInput, localRoleMode)
          if (!result?.success) {
            setValidationErrors([result?.message || 'Username atau password salah.'])
            return
          }

          finishLocalLogin(result)
          return
        }

        const localResult = loginAnyLocalRole(usernameInput, passwordInput)
        if (localResult?.success) {
          finishLocalLogin(localResult)
          return
        }

        // Login masyarakat dari backend.
        const payload = await login(usernameInput, passwordInput)

        if (!payload?.success) {
          setValidationErrors(getBackendErrors(payload, 'Login gagal.'))
          return
        }

        const accessToken = payload.accessToken || payload.token || ''
        const user = payload.user || null

        if (accessToken) window.localStorage.setItem('accessToken', accessToken)
        if (user) window.localStorage.setItem('user', JSON.stringify(user))
        if (user?.role) window.localStorage.setItem('role', user.role)

        const role = user?.role || (isPetugasMode ? 'petugas' : 'masyarakat')
        const resolvedUsername = user?.username || usernameInput
        const name = user?.name || user?.nama || resolvedUsername

        setAuth({ role, username: resolvedUsername, name })

        if (role === 'petugas') navigate('/petugas/dashboard', { replace: true })
        else if (role === 'kepala_camat') navigate('/dashboard-kepala-camat')
        else navigate('/layanan')
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

        <section className="rk-authRight" aria-label={authPanelLabel}>
          <div className="rk-authCard card bg-base-100 shadow-xl border border-base-200">
            <div className="rk-authCardHead">
              <h2 className="rk-authCardTitle">Selamat datang</h2>
              <p className="rk-authCardSubtitle">
                {isPetugasMode
                  ? ' sebagai petugas'
                  : localRoleMode === 'kepala_camat'
                    ? ' sebagai kepala camat'
                    : ''}
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
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
