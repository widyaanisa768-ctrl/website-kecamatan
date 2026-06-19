import { apiRequest } from './api'

const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '')
const FILE_BASE_URL = API_BASE_URL.replace(/\/api$/i, '')
const PROFILE_ENDPOINT = '/api/profile'
const DELETE_AVATAR_ENDPOINT = '/api/profile/avatar'
const PROFILE_METHODS = ['PUT', 'PATCH']

function buildUrl(path) {
  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path

  if (!API_BASE_URL) return path.startsWith('/') ? path : `/${path}`
  let normalized = path.startsWith('/') ? path : `/${path}`
  if (API_BASE_URL.endsWith('/api') && normalized.startsWith('/api/')) {
    normalized = normalized.slice('/api'.length)
  }
  return `${API_BASE_URL}${normalized}`
}

function getStoredToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('accessToken') || window.localStorage.getItem('token') || ''
}

async function readJsonSafe(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function pickMessage(res, fallback = 'Permintaan profil gagal.') {
  const data = res?.data
  if (!data) return res?.status ? `HTTP ${res.status}` : fallback
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return fallback
  const nested = data.data && typeof data.data === 'object' ? data.data : null
  return data.message || data.error || data.msg || nested?.message || nested?.error || fallback
}

function pickErrors(res, fallback = 'Terjadi kesalahan saat memperbarui profil.') {
  const data = res?.data
  if (!data || typeof data !== 'object') return [fallback]

  const direct = Array.isArray(data.errors) ? data.errors : []
  const nested = data.data && typeof data.data === 'object' && Array.isArray(data.data.errors) ? data.data.errors : []
  const merged = [...direct, ...nested].map((item) => String(item || '').trim()).filter(Boolean)
  if (merged.length > 0) return merged

  const message = pickMessage(res, fallback)
  return message ? [message] : [fallback]
}

function looksLikeProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = [
    'nama_lengkap',
    'namaLengkap',
    'name',
    'nama',
    'username',
    'email',
    'role',
    'no_hp',
    'noHp',
    'phone',
    'nomor_hp',
    'alamat',
    'address',
    'avatar',
    'foto_profil',
    'photo',
    'foto',
  ]
  return keys.some((key) => value[key] !== undefined && value[key] !== null && String(value[key]).trim() !== '')
}

function unwrapProfile(data) {
  if (!data) return {}
  if (Array.isArray(data)) return unwrapProfile(data[0])
  if (typeof data !== 'object') return {}
  if (looksLikeProfile(data)) return data

  const wrapperKeys = ['user', 'profile', 'data', 'result', 'item', 'record', 'masyarakat']
  for (const key of wrapperKeys) {
    const value = data[key]
    if (looksLikeProfile(value)) return value
  }

  for (const key of wrapperKeys) {
    const value = data[key]
    const nested = unwrapProfile(value)
    if (looksLikeProfile(nested)) return nested
  }

  for (const value of Object.values(data)) {
    const nested = unwrapProfile(value)
    if (looksLikeProfile(nested)) return nested
  }

  return {}
}

function isRelativeFilePath(text) {
  return text.startsWith('/') || text.startsWith('uploads/') || text.startsWith('storage/') || text.startsWith('public/')
}

export function normalizeProfileAvatar(value) {
  if (!value) return ''

  if (typeof value === 'object' && !Array.isArray(value)) {
    const nested =
      value.url ||
      value.href ||
      value.path ||
      value.path_file ||
      value.file_path ||
      value.file_url ||
      value.secure_url ||
      value.avatar ||
      value.foto_profil ||
      value.photo ||
      value.foto ||
      ''
    return normalizeProfileAvatar(nested)
  }

  const text = String(value || '').trim()
  if (!text) return ''
  if (/^(data:image|blob:)/i.test(text)) return text
  if (/^https?:\/\//i.test(text)) return text
  if (!isRelativeFilePath(text)) return text
  if (!FILE_BASE_URL) return text

  const path = text.startsWith('/') ? text : `/${text}`
  return `${FILE_BASE_URL}${path}`
}

export function normalizeProfileUser(value) {
  const profile = value && typeof value === 'object' ? value : {}
  const avatar = normalizeProfileAvatar(
    profile.avatar ||
      profile.foto_profil ||
      profile.photo ||
      profile.foto ||
      profile.avatar_url ||
      profile.avatarUrl ||
      profile.profile_photo ||
      profile.profilePhoto ||
      profile.image
  )
  const namaLengkap = profile.nama_lengkap || profile.namaLengkap || profile.name || profile.nama || ''
  const phone = profile.no_hp || profile.noHp || profile.phone || profile.nomor_hp || profile.telepon || ''
  const address = profile.alamat || profile.address || ''
  const username = profile.username || profile.user_name || ''
  const role = profile.role || ''

  return {
    ...profile,
    id: profile.id || profile._id || profile.user_id || profile.uuid || '',
    username,
    nama_lengkap: namaLengkap,
    name: profile.name || namaLengkap || profile.nama || username,
    nama: profile.nama || namaLengkap || profile.name || username,
    email: profile.email || '',
    no_hp: phone,
    phone,
    alamat: address,
    address,
    role,
    avatar,
    foto_profil: avatar,
    photo: avatar,
    foto: avatar,
  }
}

export function extractProfileFromResponse(payload, fallback = {}) {
  const raw = unwrapProfile(payload)
  return normalizeProfileUser({ ...(fallback || {}), ...(raw || {}) })
}

export async function updateProfile(data) {
  const body = {
    nama_lengkap: data?.nama_lengkap ?? '',
    username: data?.username ?? '',
    email: data?.email ?? '',
    no_hp: data?.no_hp ?? '',
    alamat: data?.alamat ?? '',
    role: data?.role ?? '',
  }

  let lastResult = null

  for (const method of PROFILE_METHODS) {
    const res = await apiRequest(PROFILE_ENDPOINT, {
      method,
      body,
      withAuth: true,
    })

    lastResult = {
      success: res.ok,
      status: res.status,
      data: res.data,
      message: pickMessage(res, res.ok ? 'Profil berhasil diperbarui.' : 'Gagal memperbarui profil.'),
      errors: res.ok ? [] : pickErrors(res),
      endpoint: PROFILE_ENDPOINT,
      method,
      notSupported: res.status === 404 || res.status === 405,
    }

    if (res.ok || (res.status !== 404 && res.status !== 405)) return lastResult
  }

  return (
    lastResult || {
      success: false,
      status: 0,
      data: null,
      message: 'Gagal memperbarui profil.',
      errors: ['Gagal memperbarui profil.'],
      endpoint: PROFILE_ENDPOINT,
      method: '',
      notSupported: false,
    }
  )
}

export async function updateProfileWithAvatar(formData) {
  const token = getStoredToken()
  let lastResult = null

  for (const method of PROFILE_METHODS) {
    try {
      const response = await fetch(buildUrl(PROFILE_ENDPOINT), {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await readJsonSafe(response)
      const res = { ok: response.ok, status: response.status, data }

      lastResult = {
        success: response.ok,
        status: response.status,
        data,
        message: pickMessage(res, response.ok ? 'Profil berhasil diperbarui.' : 'Gagal memperbarui profil.'),
        errors: response.ok ? [] : pickErrors(res),
        endpoint: PROFILE_ENDPOINT,
        method,
        notSupported: response.status === 404 || response.status === 405,
      }

      if (response.ok || (response.status !== 404 && response.status !== 405)) return lastResult
    } catch (err) {
      return {
        success: false,
        status: 0,
        data: null,
        message: err?.message || 'Gagal upload avatar profil.',
        errors: [err?.message || 'Gagal upload avatar profil.'],
        endpoint: PROFILE_ENDPOINT,
        method,
        notSupported: false,
      }
    }
  }

  return (
    lastResult || {
      success: false,
      status: 0,
      data: null,
      message: 'Gagal upload avatar profil.',
      errors: ['Gagal upload avatar profil.'],
      endpoint: PROFILE_ENDPOINT,
      method: '',
      notSupported: false,
    }
  )
}

export async function deleteAvatar() {
  const res = await apiRequest(DELETE_AVATAR_ENDPOINT, {
    method: 'DELETE',
    withAuth: true,
  })

  return {
    success: res.ok,
    status: res.status,
    data: res.data,
    message: pickMessage(res, res.ok ? 'Foto profil berhasil dihapus.' : 'Gagal menghapus foto profil.'),
    errors: res.ok ? [] : pickErrors(res, 'Gagal menghapus foto profil.'),
    endpoint: DELETE_AVATAR_ENDPOINT,
    method: 'DELETE',
    notSupported: res.status === 404 || res.status === 405,
  }
}
