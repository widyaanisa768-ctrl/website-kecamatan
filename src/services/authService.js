import { apiRequest } from './api'
import { clearAuth } from '../lib/rkLocal'

function normalizeAuthResponse(payload) {
  if (typeof payload === 'string') {
    return { success: false, message: payload, token: '', accessToken: '', user: null }
  }

  const base = payload && typeof payload === 'object' ? payload : {}
  const data = base.data && typeof base.data === 'object' ? base.data : base

  const accessToken = data.accessToken || base.accessToken || ''
  const tokenRaw = data.token || base.token || ''
  const token = accessToken || tokenRaw || ''
  const user = data.user || base.user || null
  const success = typeof base.success === 'boolean' ? base.success : typeof data.success === 'boolean' ? data.success : !!token
  const message = base.message || data.message || ''

  return { ...base, accessToken, token, user, success, message }
}

function isHistoryLoginFailureMessage(message) {
  const text = String(message || '').toLowerCase()
  return text.includes('gagal menyimpan history login') || text.includes('history login')
}

export function clearAuthArtifacts() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem('accessToken')
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  window.localStorage.removeItem('role')
  clearAuth()
  window.dispatchEvent(new Event('rk-auth-updated'))
}

export async function login(username, password) {
  try {
    if (import.meta.env.DEV) console.log('[authService] login payload:', { username, password })

    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username, password },
      withAuth: false,
    })

    const payload = normalizeAuthResponse(res.data)
    if (import.meta.env.DEV) console.log('[authService] backend response:', payload)

    const hasLoginIdentity = Boolean(payload.accessToken || payload.token || payload.user)
    if (isHistoryLoginFailureMessage(payload.message) && hasLoginIdentity) {
      console.warn('[authService] History login gagal disimpan, login tetap dilanjutkan:', payload.message)
      return { ...payload, success: true, message: '' }
    }

    if (!res.ok && payload && typeof payload === 'object') {
      const fallbackMessage =
        payload.message ||
        (typeof res.data === 'string'
          ? res.data
          : res.data
            ? `HTTP ${res.status}: ${JSON.stringify(res.data)}`
            : `HTTP ${res.status}`)

      return { ...payload, success: false, status: res.status, message: fallbackMessage }
    }

    return payload
  } catch (err) {
    const isAbort = err?.name === 'AbortError'
    if (import.meta.env.DEV) console.log('[authService] login error (raw):', err)
    return {
      success: false,
      message: isAbort
        ? `AbortError: permintaan melebihi batas waktu (${(err && err.message) || 'timeout'}).`
        : `${err?.name || 'Error'}: ${err?.message || String(err)}`,
    }
  }
}

export async function register({ nama_lengkap, username, email, password }) {
  try {
    if (import.meta.env.DEV) console.log('[authService] register payload:', { nama_lengkap, username, email, password })

    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { nama_lengkap, username, email, password },
      withAuth: false,
    })

    const base = res.data && typeof res.data === 'object' ? res.data : {}
    const message =
      base.message ||
      (typeof res.data === 'string'
        ? res.data
        : res.data
          ? `HTTP ${res.status}: ${JSON.stringify(res.data)}`
          : `HTTP ${res.status}`)

    if (!res.ok) return { success: false, status: res.status, message }

    return { success: true, status: res.status, message: base.message || 'Registrasi berhasil! Silakan login.' }
  } catch (err) {
    const isAbort = err?.name === 'AbortError'
    if (import.meta.env.DEV) console.log('[authService] register error (raw):', err)
    return {
      success: false,
      message: isAbort
        ? `AbortError: permintaan melebihi batas waktu (${(err && err.message) || 'timeout'}).`
        : `${err?.name || 'Error'}: ${err?.message || String(err)}`,
    }
  }
}

export async function logout() {
  try {
    const res = await apiRequest('/api/auth/logout', {
      method: 'POST',
      withAuth: true,
    })

    if (!res.ok) {
      console.warn('[authService] Logout backend gagal:', res?.data || `HTTP ${res?.status || ''}`.trim())
    }

    return { success: !!res.ok, status: res.status, data: res.data }
  } catch (err) {
    console.warn('[authService] Logout backend gagal, logout frontend tetap dilanjutkan:', err)
    return { success: false, status: 0, message: err?.message || 'Logout backend gagal.' }
  }
}
