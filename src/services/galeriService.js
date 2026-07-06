import { apiRequest } from './api'

const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()
const FILE_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
const GALERI_ENDPOINT = '/api/galeri'
const GALERI_ADMIN_ENDPOINT = '/api/galeri/admin/all'

function pickMessage(res, fallback = 'Gagal memuat data galeri.') {
  const data = res?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return fallback

  const nested = data.data && typeof data.data === 'object' ? data.data : null
  return data.message || data.error || data.msg || nested?.message || nested?.error || fallback
}

function pickErrors(res) {
  const data = res?.data
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data.errors)) return data.errors
  if (data.data && typeof data.data === 'object' && Array.isArray(data.data.errors)) return data.data.errors
  return []
}

function isSuccessfulMutationResponse(res) {
  const body = res?.data
  if (!res?.ok) return false
  if (!body || typeof body !== 'object' || Array.isArray(body)) return true
  if (Object.prototype.hasOwnProperty.call(body, 'success')) return body.success === true
  return true
}

function buildMutationError(res, fallback) {
  const errors = pickErrors(res)
  return {
    success: false,
    status: res.status,
    data: res.data,
    message: errors.length > 0 ? errors.join('\n') : pickMessage(res, fallback),
    errors,
  }
}

function buildMutationSuccess(res, fallback) {
  return {
    success: true,
    status: res.status,
    data: res.data,
    message: pickMessage(res, fallback),
    errors: [],
  }
}

function unwrapGaleriItems(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return []

  const directKeys = ['data', 'items', 'result', 'rows', 'galeri', 'records', 'list']
  for (const key of directKeys) {
    const value = data[key]
    if (Array.isArray(value)) return value
  }

  for (const key of directKeys) {
    const value = data[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = unwrapGaleriItems(value)
      if (nested.length > 0) return nested
    }
  }

  return []
}

export function resolveGalleryImageUrl(fotoUrl) {
  const text = String(fotoUrl || '').trim()
  if (!text) return ''
  if (/^https?:\/\//i.test(text)) return text
  if (!FILE_BASE_URL) return text

  const path = text.startsWith('/') ? text : `/${text}`
  return `${FILE_BASE_URL}${path}`
}

export async function getGaleriPublic() {
  try {
    const res = await apiRequest(GALERI_ENDPOINT, {
      method: 'GET',
      withAuth: false,
    })

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        data: [],
        items: [],
        message: pickMessage(res, 'Galeri belum dapat dimuat.'),
      }
    }

    const items = unwrapGaleriItems(res.data)
    return {
      success: true,
      status: res.status,
      data: res.data,
      items,
      message: pickMessage(res, items.length > 0 ? 'Data galeri berhasil dimuat.' : ''),
    }
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: [],
      items: [],
      message: err?.message || 'Galeri belum dapat dimuat.',
    }
  }
}

export async function getGaleriAdmin() {
  try {
    const res = await apiRequest(GALERI_ADMIN_ENDPOINT, {
      method: 'GET',
      withAuth: true,
    })

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        data: [],
        items: [],
        message: pickMessage(res, 'Data galeri belum dapat dimuat.'),
      }
    }

    const items = unwrapGaleriItems(res.data)
    return {
      success: true,
      status: res.status,
      data: res.data,
      items,
      message: pickMessage(res, items.length > 0 ? 'Data galeri berhasil dimuat.' : ''),
    }
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: [],
      items: [],
      message: err?.message || 'Data galeri belum dapat dimuat.',
    }
  }
}

export async function createGaleri(formData) {
  try {
    const res = await apiRequest(GALERI_ENDPOINT, {
      method: 'POST',
      body: formData,
      withAuth: true,
    })

    if (!isSuccessfulMutationResponse(res)) return buildMutationError(res, 'Gagal menambahkan galeri.')
    return buildMutationSuccess(res, 'Galeri berhasil ditambahkan.')
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: null,
      message: err?.message || 'Gagal menambahkan galeri.',
      errors: [],
    }
  }
}

export async function updateGaleri(id, formData) {
  try {
    const res = await apiRequest(`${GALERI_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: formData,
      withAuth: true,
    })

    if (!isSuccessfulMutationResponse(res)) return buildMutationError(res, 'Gagal memperbarui galeri.')
    return buildMutationSuccess(res, 'Galeri berhasil diperbarui.')
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: null,
      message: err?.message || 'Gagal memperbarui galeri.',
      errors: [],
    }
  }
}

export async function updateStatusGaleri(id, statusAktif) {
  try {
    const res = await apiRequest(`${GALERI_ENDPOINT}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status_aktif: Number(statusAktif) },
      withAuth: true,
    })

    if (!isSuccessfulMutationResponse(res)) return buildMutationError(res, 'Gagal memperbarui status galeri.')
    return buildMutationSuccess(res, 'Status galeri berhasil diperbarui.')
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: null,
      message: err?.message || 'Gagal memperbarui status galeri.',
      errors: [],
    }
  }
}

export async function deleteGaleri(id) {
  try {
    const res = await apiRequest(`${GALERI_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true,
    })

    if (!isSuccessfulMutationResponse(res)) return buildMutationError(res, 'Gagal menghapus galeri.')
    return buildMutationSuccess(res, 'Galeri berhasil dihapus.')
  } catch (err) {
    return {
      success: false,
      status: 0,
      data: null,
      message: err?.message || 'Gagal menghapus galeri.',
      errors: [],
    }
  }
}
