import { getDokumenConfigForPengajuan } from './pengajuanDokumenConfig'
import { getPengajuanDokumen } from '../services/pengajuanService'

const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

const HIDDEN_DATA_KEYS = new Set([
  '__endpoint',
  'created_by',
  'created_at',
  'createdat',
  'updated_at',
  'updatedat',
  'created',
  'tanggal_pengajuan',
  'tanggalpengajuan',
  'tanggal_update',
  'tanggalupdate',
  'tanggal_verifikasi',
  'tanggalverifikasi',
  'verified_at',
  'verifiedat',
  'verification_date',
  'verificationdate',
  'id_pengajuan',
  'status',
  'status_pengajuan',
  'statuspengajuan',
  'id',
  '_id',
  'uuid',
  'pengajuan_id',
  'jenis_layanan',
  'layanan',
  'layanan_path',
  'layananpath',
  'service',
  'service_key',
  'servicekey',
  'title',
  'endpoint',
  'user_id',
  'userid',
  'id_user',
  'pemohon_id',
  'masyarakat_id',
  'dokumen',
  'dokumen_meta',
  'dokumenmeta',
  'data_form',
  'dataform',
  'data',
  'file_hasil',
  'dokumen_hasil',
  'surat_hasil',
  'url_hasil',
  'hasil_url',
  'file_url',
  'hasil_surat',
  'hasilsurat',
  'catatan_petugas',
  'catatanpetugas',
  'alasan_penolakan',
  'alasanpenolakan',
  'nama_lengkap',
  'nama_pemohon',
  'nama',
  'alamat',
  'nik',
  'no_hp',
  'nomor_hp',
  'email',
  'username',
  'keterangan',
  'keperluan',
])
const DOCUMENT_FIELD_HINTS = [
  'dokumen',
  'document',
  'lampiran',
  'berkas',
  'file',
  'ktp',
  'kk',
  'kartu_keluarga',
  'surat_pindah',
  'pas_foto',
  'akta_kelahiran',
  'akta_lahir',
  'akta_notaris',
  'surat_keterangan',
  'surat_nikah',
  'foto_lokasi',
  'foto_dokumentasi',
  'pbb',
  'lurah',
  'penghulu',
  'pengantar',
  'ahli_waris',
  'kematian',
  'tanah',
  'ktm',
]

const LABEL_OVERRIDES = {
  no_hp: 'Nomor HP',
  nomor_hp: 'Nomor HP',
  nik: 'NIK',
  jenis_layanan: 'Jenis Layanan',
  nama_pemohon: 'Nama Pemohon',
  nama_peneliti: 'Nama Peneliti',
  lokasi_penelitian: 'Lokasi Penelitian',
  waktu_penelitian: 'Waktu Penelitian',
}

function humanizeLabel(key) {
  const normalized = String(key || '').trim().toLowerCase()
  if (LABEL_OVERRIDES[normalized]) return LABEL_OVERRIDES[normalized]
  return normalized
    .replace(/^__/, '')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function isFileLikePath(value) {
  const text = String(value || '').trim()
  return /^https?:\/\//i.test(text) || text.startsWith('/uploads') || text.startsWith('uploads/') || text.startsWith('/storage') || text.startsWith('storage/')
}

function hasFileLikeUrl(value) {
  if (!value) return false
  if (typeof value === 'string') return isFileLikePath(value)
  if (Array.isArray(value)) return value.some((entry) => hasFileLikeUrl(entry))
  if (typeof value !== 'object') return false

  return ['url_file', 'url', 'href', 'path', 'path_file', 'file_path', 'file_url', 'dokumen_url', 'lampiran_url', 'download_url', 'secure_url'].some(
    (key) => isFileLikePath(value[key])
  )
}

function isDocumentLikeKey(value) {
  const normalized = normalizeDokumenKey(value)
  if (!normalized || HIDDEN_DATA_KEYS.has(normalized)) return false
  return DOCUMENT_FIELD_HINTS.some((hint) => normalized === hint || normalized.includes(hint) || hint.includes(normalized))
}

export function buildPengajuanDokumenUrl(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^https?:\/\//i.test(text)) return text
  if (!isFileLikePath(text)) return ''
  if (!RAW_API_BASE_URL) return text

  const base = RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/i, '')
  const path = text.startsWith('/') ? text : `/${text}`
  return `${base}${path}`
}

export function filenameFromDokumenPath(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  try {
    const parsed = new URL(text)
    return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || text)
  } catch {
    return decodeURIComponent(text.split('?')[0].split('/').filter(Boolean).pop() || text)
  }
}

function readDokumenMeta(meta) {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const rawUrl =
      meta.url_file ||
      meta.url ||
      meta.href ||
      meta.path ||
      meta.path_file ||
      meta.file_path ||
      meta.file_url ||
      meta.dokumen_url ||
      meta.lampiran_url ||
      meta.download_url ||
      meta.secure_url ||
      ''
    const url = buildPengajuanDokumenUrl(rawUrl)
    const filename =
      meta.name ||
      meta.nama ||
      meta.filename ||
      meta.file_name ||
      meta.originalname ||
      meta.nama_file ||
      meta.fileName ||
      (rawUrl ? filenameFromDokumenPath(rawUrl) : '')
    return { filename, url }
  }

  if (typeof meta === 'string') {
    if (!isFileLikePath(meta)) {
      return { filename: '', url: '' }
    }
    return {
      filename: filenameFromDokumenPath(meta),
      url: buildPengajuanDokumenUrl(meta),
    }
  }

  return { filename: '', url: '' }
}

function normalizeDokumenKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getDokumenIdentityCandidates(entry) {
  return [
    entry?.field,
    entry?.key,
    entry?.jenis,
    entry?.jenis_dokumen,
    entry?.jenisDokumen,
    entry?.nama_dokumen,
    entry?.namaDokumen,
    entry?.tipe_dokumen,
    entry?.kategori,
    entry?.backendKey,
  ].filter(Boolean)
}

function readDokumenByField(item, docs, field) {
  const backendKey = field?.backendKey || field?.key
  const expectedKeys = [backendKey, field?.key, field?.label, ...(field?.aliases || [])].map(normalizeDokumenKey).filter(Boolean)
  if (!backendKey) return null
  if (docs && !Array.isArray(docs) && Object.prototype.hasOwnProperty.call(docs, backendKey)) return docs[backendKey]
  if (docs && !Array.isArray(docs) && Object.prototype.hasOwnProperty.call(docs, field.key)) return docs[field.key]

  if (Array.isArray(docs)) {
    const match = docs.find((entry) => {
      const actualKeys = getDokumenIdentityCandidates(entry).map(normalizeDokumenKey)
      return actualKeys.some((actual) =>
        expectedKeys.some(
          (expected) =>
            actual === expected ||
            actual.endsWith(`_${expected}`) ||
            expected.endsWith(`_${actual}`) ||
            actual.includes(expected) ||
            expected.includes(actual)
        )
      )
    })
    if (match) return match
  }

  if (item && Object.prototype.hasOwnProperty.call(item, backendKey)) return item[backendKey]
  if (item && Object.prototype.hasOwnProperty.call(item, field.key)) return item[field.key]

  const objectSources = [docs, item].filter((source) => source && typeof source === 'object' && !Array.isArray(source))
  for (const source of objectSources) {
    for (const [actualKey, value] of Object.entries(source)) {
      const normalizedActual = normalizeDokumenKey(actualKey)
      const isMatch = expectedKeys.some(
        (expected) =>
          normalizedActual === expected ||
          normalizedActual.endsWith(`_${expected}`) ||
          expected.endsWith(`_${normalizedActual}`) ||
          normalizedActual.includes(expected) ||
          expected.includes(normalizedActual)
      )
      if (isMatch && hasFileLikeUrl(value)) return value
    }
  }

  return null
}

function collectLegacyDokumenEntries(source, usedKeys) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []

  return Object.entries(source)
    .filter(([key, value]) => {
      const normalizedKey = normalizeDokumenKey(key)
      if (usedKeys.has(normalizedKey)) return false
      if (!isDocumentLikeKey(key)) return false
      return hasFileLikeUrl(value)
    })
    .map(([key, value]) => ({
      id: `legacy-${key}`,
      label: humanizeLabel(key),
      meta: value,
    }))
}

export function normalizePengajuanDokumenPersyaratan(item) {
  if (!item) return []
  const config = getDokumenConfigForPengajuan(item)
  const docs = getPengajuanDokumen(item)
  const entries = []
  const usedKeys = new Set()

  const pushEntry = (id, label, meta, extra = {}) => {
    const { filename, url } = readDokumenMeta(meta, label)
    const uploaded = Boolean(url)
    entries.push({
      id,
      label: label || humanizeLabel(extra?.key || extra?.backendKey || id),
      filename: uploaded ? filename || filenameFromDokumenPath(url) || 'Dokumen tersedia' : 'Belum diunggah',
      url: uploaded ? url : '',
      uploaded,
      ...extra,
    })
  }

  if (config?.fields?.length) {
    config.fields.forEach((field) => {
      const backendKey = field.backendKey || field.key
      const meta = readDokumenByField(item, docs, field)
      ;[backendKey, field.key, field.label, ...(field.aliases || [])].forEach((value) => usedKeys.add(normalizeDokumenKey(value)))
      pushEntry(backendKey, field.label, meta, {
        key: field.key,
        backendKey,
        required: field.required,
      })
    })
  }

  if (Array.isArray(docs)) {
    docs.forEach((meta, index) => {
      const label =
        meta?.label || meta?.jenis_dokumen || meta?.jenis || meta?.nama_dokumen || meta?.tipe_dokumen || meta?.kategori || `Dokumen ${index + 1}`
      const docKeyCandidates = [
        meta?.field,
        meta?.key,
        meta?.jenis_dokumen,
        meta?.nama_dokumen,
        meta?.tipe_dokumen,
        meta?.kategori,
        label,
      ]
      const isMapped = docKeyCandidates.some((candidate) => usedKeys.has(normalizeDokumenKey(candidate)))
      if (isMapped) return
      if (!hasFileLikeUrl(meta)) return
      pushEntry(`dokumen-${index}`, label, meta)
    })
  } else if (docs && typeof docs === 'object') {
    Object.entries(docs).forEach(([key, meta]) => {
      if (usedKeys.has(normalizeDokumenKey(key))) return
      if (HIDDEN_DATA_KEYS.has(String(key || '').trim().toLowerCase())) return
      if (!isDocumentLikeKey(key) || !hasFileLikeUrl(meta)) return
      pushEntry(`dokumen-${key}`, humanizeLabel(key), meta)
    })
  }

  const legacyEntries = [...collectLegacyDokumenEntries(item, usedKeys)]
  const dataForm = item?.data_form || item?.dataForm || item?.form_data || item?.formData || item?.form || null
  if (dataForm && typeof dataForm === 'object' && !Array.isArray(dataForm)) {
    legacyEntries.push(...collectLegacyDokumenEntries(dataForm, usedKeys))
  }
  legacyEntries.forEach((entry) => pushEntry(entry.id, entry.label, entry.meta))

  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${entry.label}|${entry.filename}|${entry.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
