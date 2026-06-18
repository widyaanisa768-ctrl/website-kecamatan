function asTrimmedString(value) {
  return String(value || '').trim()
}

const BYTES_PER_MB = 1024 * 1024

export const FILE_TYPE_PRESETS = {
  PDF: {
    accept: '.pdf,application/pdf',
    allowedExtensions: ['pdf'],
    allowedMimeTypes: ['application/pdf'],
    allowedTypeLabel: 'PDF',
  },
  PDF_IMAGE: {
    accept: '.pdf,.png,application/pdf,image/png',
    allowedExtensions: ['pdf', 'png'],
    allowedMimeTypes: ['application/pdf', 'image/png'],
    allowedTypeLabel: 'PDF atau PNG',
  },
  PDF_PNG: {
    accept: '.pdf,.png,application/pdf,image/png',
    allowedExtensions: ['pdf', 'png'],
    allowedMimeTypes: ['application/pdf', 'image/png'],
    allowedTypeLabel: 'PDF atau PNG',
  },
  IMAGE: {
    accept: '.pdf,.png,application/pdf,image/png',
    allowedExtensions: ['pdf', 'png'],
    allowedMimeTypes: ['application/pdf', 'image/png'],
    allowedTypeLabel: 'PDF atau PNG',
  },
}

function isFileLikeObject(file) {
  return !!file && typeof file === 'object' && typeof file.name === 'string' && typeof file.size === 'number'
}

function getFileExtension(file) {
  const filename = typeof file?.name === 'string' ? file.name : ''
  const parts = filename.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function normalizeErrorList(errors, fallbackMessage) {
  if (Array.isArray(errors)) {
    const list = errors.map((err) => asTrimmedString(err)).filter(Boolean)
    if (list.length > 0) return list
  }

  const fallback = asTrimmedString(fallbackMessage) || 'Terjadi kesalahan'
  return [fallback]
}

export function getBackendErrors(payload, fallbackMessage = 'Terjadi kesalahan') {
  const base = payload && typeof payload === 'object' ? payload : {}
  const data = base.data && typeof base.data === 'object' ? base.data : base

  return normalizeErrorList(base.errors || data.errors, base.message || data.message || fallbackMessage)
}

export function handleBackendValidationError(payload, fallbackMessage = 'Terjadi kesalahan') {
  return getBackendErrors(payload, fallbackMessage)
}

export function validateLoginForm({ username, password }) {
  const errors = []

  if (asTrimmedString(username).length < 4) {
    errors.push('Username minimal 4 karakter')
  }

  if (String(password || '').length < 4) {
    errors.push('Password minimal 4 karakter')
  }

  return errors
}

export function validateRegisterForm({ nama, username, email, password }) {
  const errors = []

  if (!asTrimmedString(nama)) {
    errors.push('Nama lengkap tidak boleh kosong')
  }

  if (asTrimmedString(username).length < 4) {
    errors.push('Username minimal 4 karakter')
  }

  if (String(password || '').length < 4) {
    errors.push('Password minimal 4 karakter')
  }

  const emailValue = asTrimmedString(email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailValue || !emailRegex.test(emailValue)) {
    errors.push('Email tidak valid')
  }

  return errors
}

export function validateRequiredText(value, label) {
  return asTrimmedString(value) ? '' : `${label} wajib diisi.`
}

export function validateNikField(value) {
  const trimmed = asTrimmedString(value)
  if (!trimmed) return 'NIK wajib diisi.'
  if (!/^\d{16}$/.test(trimmed)) return 'NIK harus valid (16 digit angka)'
  return ''
}

export function validateNoHpField(value) {
  const trimmed = asTrimmedString(value)
  if (!trimmed) return 'No HP wajib diisi.'
  if (!/^\d{10,15}$/.test(trimmed)) return 'no_hp harus valid'
  return ''
}

export function validateRequiredFile(file, label = 'Dokumen') {
  return file ? '' : `${label} wajib diunggah.`
}

export function validateFileField(file, options = {}) {
  const {
    label = 'Dokumen',
    required = true,
    allowedExtensions = [],
    allowedMimeTypes = [],
    allowedTypeLabel = 'PDF',
    maxSizeMB = 2,
  } = options

  if (!file) return required ? `${label} wajib diunggah` : ''
  if (!isFileLikeObject(file)) return `${label} tidak valid`

  const extension = getFileExtension(file)
  const mimeType = String(file.type || '').toLowerCase()
  const extensionAllowed = allowedExtensions.length === 0 || allowedExtensions.includes(extension)
  const mimeAllowed = allowedMimeTypes.length === 0 || allowedMimeTypes.includes(mimeType)

  if (!extensionAllowed && !mimeAllowed) {
    return `Format file harus ${allowedTypeLabel}.`
  }

  if (maxSizeMB > 0 && file.size > maxSizeMB * BYTES_PER_MB) {
    return `${label} maksimal ${maxSizeMB}MB`
  }

  return ''
}

export function buildDokumenPayload(files, fieldConfigs = []) {
  return fieldConfigs.reduce((acc, field) => {
    const file = files?.[field.key] ?? null
    if (isFileLikeObject(file)) acc[field.backendKey || field.key] = file
    return acc
  }, {})
}
