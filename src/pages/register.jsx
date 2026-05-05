import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiZap,
} from 'react-icons/fi'
import './Auth.css'

function Register() {
  const navigate = useNavigate()

  const points = useMemo(
    () => [
      { title: 'Layanan Lengkap', desc: 'Berbagai jenis surat dan rekomendasi.', icon: FiZap },
      { title: 'Proses Mudah', desc: 'Ajukan online tanpa antri.', icon: FiCheckCircle },
      { title: 'Transparan', desc: 'Pantau status pengajuan secara real-time.', icon: FiArrowRight },
      { title: 'Aman', desc: 'Data Anda terlindungi dengan baik.', icon: FiShield },
    ],
    []
  )

  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
  })

  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    if (!formData.nama || !formData.username || !formData.email || !formData.password) {
      setMessage('Semua field wajib diisi.')
      return
    }

    if (formData.password.length < 6) {
      setMessage('Password minimal 6 karakter.')
      return
    }

    setMessage('Registrasi berhasil! Silakan login.')
    console.log('Data register:', formData)

    setTimeout(() => {
      navigate('/login')
    }, 800)
  }

  return (
    <div className="rk-authPage isRegister">
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

        <section className="rk-authRight" aria-label="Registrasi Akun Baru">
          <div className="rk-authCard">
            <div className="rk-authCardHead">
              <h2 className="rk-authCardTitle">Buat Akun Baru</h2>
            </div>

            <form className="rk-authForm" onSubmit={handleSubmit}>
              <div className="rk-authRow2">
                <div className="rk-authField">
                  <label className="rk-authLabel" htmlFor="rk-reg-nama">
                    Nama Lengkap
                  </label>
                  <div className="rk-authInputWrap">
                    <span className="rk-authInputIcon" aria-hidden="true">
                      <FiUser />
                    </span>
                    <input
                      id="rk-reg-nama"
                      className="rk-authInput"
                      type="text"
                      name="nama"
                      placeholder="Nama lengkap"
                      value={formData.nama}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="rk-authField">
                  <label className="rk-authLabel" htmlFor="rk-reg-username">
                    Username
                  </label>
                  <div className="rk-authInputWrap">
                    <span className="rk-authInputIcon" aria-hidden="true">
                      <FiUser />
                    </span>
                    <input
                      id="rk-reg-username"
                      className="rk-authInput"
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="rk-authField">
                <label className="rk-authLabel" htmlFor="rk-reg-email">
                  Email
                </label>
                <div className="rk-authInputWrap">
                  <span className="rk-authInputIcon" aria-hidden="true">
                    <FiMail />
                  </span>
                  <input
                    id="rk-reg-email"
                    className="rk-authInput"
                    type="email"
                    name="email"
                    placeholder="Masukkan email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="rk-authField">
                <label className="rk-authLabel" htmlFor="rk-reg-password">
                  Password
                </label>
                <div className="rk-authInputWrap">
                  <span className="rk-authInputIcon" aria-hidden="true">
                    <FiLock />
                  </span>
                  <input
                    id="rk-reg-password"
                    className="rk-authInput"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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
                Register
              </button>

              {message ? (
                <p className="rk-authNotice" role="status" aria-live="polite">
                  {message}
                </p>
              ) : null}

              <div className="rk-authFoot">
                Sudah punya akun?{' '}
                <strong>
                  <Link className="rk-authLink" to="/login">
                    Login di sini
                  </Link>
                </strong>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register