import { getAuth } from './rkLocal'

function safeParse(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function normalizeRole(role) {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'masyarakat') return 'masyarakat'
  if (normalized === 'petugas') return 'petugas'
  if (normalized === 'kepala_camat') return 'kepala_camat'
  return ''
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem('user'), null)
}

export function getCurrentRole() {
  if (typeof window === 'undefined') return ''

  const storedUser = getStoredUser()
  const storedRole = window.localStorage.getItem('role') || ''
  const auth = getAuth()

  return normalizeRole(storedUser?.role || storedRole || auth?.role || '')
}

export function getDashboardPath(role, options = {}) {
  const normalizedRole = normalizeRole(role)
  const masyarakatPath = options.masyarakatPath || '/home'

  if (normalizedRole === 'petugas') return '/petugas/dashboard'
  if (normalizedRole === 'kepala_camat') return '/dashboard-kepala-camat'
  return masyarakatPath
}

export function getDashboardLabel(role) {
  const normalizedRole = normalizeRole(role)
  return normalizedRole && normalizedRole !== 'masyarakat' ? 'Dashboard' : 'Beranda'
}
