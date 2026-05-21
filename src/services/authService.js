import { apiRequest } from './api'

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

export async function login(username, password) {
  try {
    if (import.meta.env.DEV) console.log('[authService] login payload:', { username, password })

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password },
      withAuth: false,
    })

    const payload = normalizeAuthResponse(res.data)
    if (import.meta.env.DEV) console.log('[authService] backend response:', payload)

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

    const res = await apiRequest('/auth/register', {
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
