import { apiRequest } from './api'

const MASYARAKAT_ENDPOINTS = [
  '/api/users?role=masyarakat',
  '/users?role=masyarakat',
  '/api/masyarakat',
  '/masyarakat',
]

function pickMessage(res) {
  const data = res?.data
  if (!data) return res?.status ? `HTTP ${res.status}` : 'Gagal memuat data masyarakat.'
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return 'Gagal memuat data masyarakat.'
  return data.message || data.error || data.msg || `HTTP ${res?.status || ''}`.trim()
}

function unwrapUsers(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return []

  const keys = ['data', 'users', 'result', 'rows', 'items', 'masyarakat']
  for (const key of keys) {
    const value = data[key]
    if (Array.isArray(value)) return value
  }

  for (const key of keys) {
    const value = data[key]
    if (value && typeof value === 'object') {
      const nested = unwrapUsers(value)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

function normalizeUser(item) {
  const user = item && typeof item === 'object' ? item : {}
  return {
    ...user,
    id: user.id || user._id || user.user_id || user.uuid || '',
    nama_lengkap: user.nama_lengkap || user.namaLengkap || user.name || user.nama || '',
    username: user.username || user.user_name || '',
    email: user.email || '',
    no_hp: user.no_hp || user.noHp || user.phone || user.telepon || user.nomor_hp || '',
    alamat: user.alamat || user.address || '',
    role: user.role || '',
  }
}

export async function getMasyarakatUsers() {
  let lastError = ''

  for (const endpoint of MASYARAKAT_ENDPOINTS) {
    try {
      const res = await apiRequest(endpoint, { method: 'GET', withAuth: true })
      if (!res.ok) {
        lastError = pickMessage(res)
        continue
      }

      const users = unwrapUsers(res.data)
        .map(normalizeUser)
        .filter((user) => normalizeRole(user.role) === 'masyarakat')

      return { success: true, status: res.status, items: users, endpoint }
    } catch (err) {
      lastError = err?.message || String(err)
    }
  }

  return {
    success: false,
    status: 0,
    items: [],
    message: lastError || 'Endpoint data masyarakat belum dapat diakses.',
  }
}
