import { apiRequest } from './api'

function pickMessage(res) {
  const data = res?.data
  if (!data) return res?.ok ? '' : `HTTP ${res?.status || ''}`.trim()
  if (typeof data === 'string') return data
  if (typeof data === 'object') return data.message || data.error || data.msg || ''
  return ''
}

function unwrapItems(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return []

  const directKeys = ['data', 'items', 'result', 'rows', 'pengajuan', 'submissions', 'records', 'list']
  const directItems = []
  for (const key of directKeys) {
    const value = data[key]
    if (Array.isArray(value)) directItems.push(...value)
  }
  if (directItems.length > 0) return directItems

  const nestedItems = []
  for (const key of directKeys) {
    const value = data[key]
    if (value && typeof value === 'object') {
      const nested = unwrapItems(value)
      if (nested.length > 0) nestedItems.push(...nested)
    }
  }
  if (nestedItems.length > 0) return nestedItems

  const objectValueItems = []
  Object.entries(data).forEach(([key, value]) => {
    if (directKeys.includes(key)) return
    if (Array.isArray(value)) {
      objectValueItems.push(...value)
      return
    }
    if (value && typeof value === 'object') {
      const nested = unwrapItems(value)
      if (nested.length > 0) objectValueItems.push(...nested)
    }
  })
  if (objectValueItems.length > 0) return objectValueItems

  return []
}

export const SERVICE_ROUTES = [
  { key: 'rekomendasi_penelitian', endpoint: '/api/rekomendasi_penelitian', jenis_layanan: 'Rekomendasi Penelitian / Riset' },
  { key: 'rekomendasi_surat_pindah', endpoint: '/api/rekomendasi_surat_pindah', jenis_layanan: 'Rekomendasi Surat Pindah' },
  { key: 'rekomendasi_akta_kelahiran', endpoint: '/api/rekomendasi_akta_kelahiran', jenis_layanan: 'Rekomendasi Akta Kelahiran' },
  { key: 'rekomendasi_kartu_keluarga', endpoint: '/api/rekomendasi_kartu_keluarga', jenis_layanan: 'Rekomendasi Kartu Keluarga' },
  { key: 'rekomendasi_surat_kerja', endpoint: '/api/rekomendasi_surat_kerja', jenis_layanan: 'Rekomendasi Kerja' },
  { key: 'rekomendasi_surat_tanah', endpoint: '/api/rekomendasi_surat_tanah', jenis_layanan: 'Rekomendasi Surat Tanah SKT/SKGR' },
  { key: 'rekomendasi_surat_ahli_waris', endpoint: '/api/rekomendasi_surat_ahli_waris', jenis_layanan: 'Surat Keterangan Ahli Waris' },
  { key: 'rekomendasi_surat_yayasan', endpoint: '/api/rekomendasi_surat_yayasan', jenis_layanan: 'Rekomendasi Yayasan/TPQ/Ormas' },
]

const PETUGAS_BACKEND_AUTH_MESSAGE =
  'Data pengajuan belum dapat dimuat. Pastikan akun petugas sudah terhubung ke backend.'
const LOCAL_SUBMISSIONS_KEY = 'rk_submissions_v1'
const LOCAL_ENDPOINT_PREFIX = 'local:'

const ENDPOINT_BY_LAYANAN_PATH = {
  '/layanan/penelitian': '/api/rekomendasi_penelitian',
  '/layanan/penelitian-riset': '/api/rekomendasi_penelitian',
  '/layanan/surat-pindah': '/api/rekomendasi_surat_pindah',
  '/layanan/akta-kelahiran': '/api/rekomendasi_akta_kelahiran',
  '/layanan/kartu-keluarga': '/api/rekomendasi_kartu_keluarga',
  '/layanan/rekomendasi-kerja': '/api/rekomendasi_surat_kerja',
  '/layanan/surat-tanah': '/api/rekomendasi_surat_tanah',
  '/layanan/ahli-waris': '/api/rekomendasi_surat_ahli_waris',
  '/layanan/yayasan-ormas': '/api/rekomendasi_surat_yayasan',
}

function resolveEndpoint(payload) {
  const layananPath = String(payload?.layanan_path || payload?.layananPath || '').trim()
  if (layananPath && ENDPOINT_BY_LAYANAN_PATH[layananPath]) return ENDPOINT_BY_LAYANAN_PATH[layananPath]

  const serviceKey = String(payload?.serviceKey || payload?.service_key || '').trim()
  if (serviceKey) {
    const found = SERVICE_ROUTES.find((s) => s.key === serviceKey)
    if (found) return found.endpoint
  }

  const jenisLayanan = String(payload?.jenis_layanan || '').trim()
  if (jenisLayanan) {
    const found = SERVICE_ROUTES.find((s) => s.jenis_layanan === jenisLayanan)
    if (found) return found.endpoint
  }

  return ''
}

function parseIdFromCreateResponse(data) {
  if (!data) return ''
  if (typeof data === 'string') return ''
  const base = typeof data === 'object' ? data : {}
  const inner = base.data && typeof base.data === 'object' ? base.data : base
  return getPengajuanId(inner)
}

export function getPengajuanId(item) {
  const id = item?.id || item?._id || item?.id_pengajuan || item?.pengajuan_id || item?.uuid || ''
  return id ? String(id) : ''
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function readFormData(item) {
  const form = item?.data_form || item?.dataForm || item?.form_data || item?.formData || item?.form || null
  return form && typeof form === 'object' && !Array.isArray(form) ? form : {}
}

function pickFromItem(item, keys) {
  const form = readFormData(item)
  const pemohon = item?.pemohon && typeof item.pemohon === 'object' ? item.pemohon : {}
  const masyarakat = item?.masyarakat && typeof item.masyarakat === 'object' ? item.masyarakat : {}
  const user = item?.user && typeof item.user === 'object' ? item.user : {}
  const sources = [item || {}, form, pemohon, masyarakat, user]

  for (const source of sources) {
    for (const key of keys) {
      const value = source?.[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') return value
    }
  }
  return ''
}

function toTime(value) {
  const t = new Date(value || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function readLocalSubmissionsRaw() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(LOCAL_SUBMISSIONS_KEY)
  return safeJsonParse(raw, [])
}

function writeLocalSubmissionsRaw(list) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(list))
}

function isLocalEndpoint(endpoint) {
  return String(endpoint || '').startsWith(LOCAL_ENDPOINT_PREFIX)
}

function normalizeLocalSubmission(item) {
  const id = getPengajuanId(item)
  if (!id) return null

  const hasil = item?.hasilSurat || item?.hasil_surat || item?.surat_hasil || item?.dokumen_hasil || null
  const hasilNama = hasil?.filename || hasil?.name || hasil?.nama || item?.nama_file_hasil || ''
  const hasilUrl = hasil?.url || hasil?.href || hasil?.path || item?.url_hasil || item?.hasil_url || item?.file_url || ''
  const dataForm = item?.data_form || item?.dataForm || item?.data || item?.form || {}
  const dokumen = item?.dokumen || item?.documents || item?.lampiran || item?.files || {}

  return {
    ...item,
    id,
    id_pengajuan: item?.id_pengajuan || id,
    pengajuan_id: item?.pengajuan_id || id,
    uuid: item?.uuid || id,
    jenis_layanan: item?.jenis_layanan || item?.layanan || '',
    layanan: item?.layanan || item?.jenis_layanan || '',
    data_form: dataForm && typeof dataForm === 'object' ? dataForm : {},
    dokumen: dokumen && typeof dokumen === 'object' ? dokumen : {},
    status: normalizePengajuanStatus(item?.status || item?.status_pengajuan || item),
    createdAt: getPengajuanCreatedAt(item),
    updatedAt: item?.updatedAt || item?.updated_at || item?.createdAt || '',
    __endpoint: item?.__endpoint || `${LOCAL_ENDPOINT_PREFIX}${LOCAL_SUBMISSIONS_KEY}`,
    __source: 'local',
    file_hasil: item?.file_hasil || hasilUrl || hasilNama || '',
    surat_hasil: item?.surat_hasil || hasil || (hasilUrl || hasilNama ? { filename: hasilNama, url: hasilUrl } : null),
    url_hasil: item?.url_hasil || hasilUrl || '',
    dokumen_hasil: item?.dokumen_hasil || hasil || (hasilUrl || hasilNama ? { filename: hasilNama, url: hasilUrl } : null),
    nama_file_hasil: item?.nama_file_hasil || hasilNama || '',
    hasilSurat: hasil || (hasilUrl || hasilNama ? { filename: hasilNama, url: hasilUrl } : null),
  }
}

function isBackendAuthError(res) {
  const message = normalizeText(pickMessage(res))
  return res?.status === 401 || res?.status === 403 || message.includes('token tidak ditemukan') || message.includes('unauthorized')
}

function pickSafePetugasMessage(res) {
  if (isBackendAuthError(res)) return PETUGAS_BACKEND_AUTH_MESSAGE
  return pickMessage(res)
}

function normalizePengajuanItem(item, svc) {
  const id = getPengajuanId(item)
  const status = normalizePengajuanStatus(item)
  const createdAt = getPengajuanCreatedAt(item)
  return {
    ...item,
    id: item?.id || id,
    id_pengajuan: item?.id_pengajuan || id,
    pengajuan_id: item?.pengajuan_id || id,
    jenis_layanan: item?.jenis_layanan || item?.jenisLayanan || item?.layanan || svc?.jenis_layanan || '',
    status,
    status_pengajuan: status,
    created_at: item?.created_at || createdAt,
    createdAt: item?.createdAt || createdAt,
    __endpoint: item?.__endpoint || svc?.endpoint || '',
  }
}

export function getPengajuanStatus(itemOrStatus) {
  if (typeof itemOrStatus === 'string') return itemOrStatus
  return pickFromItem(itemOrStatus, ['status', 'status_pengajuan', 'statusPengajuan']) || 'Menunggu Verifikasi'
}

export function normalizePengajuanStatus(itemOrStatus) {
  const raw = getPengajuanStatus(itemOrStatus)
  const key = normalizeText(raw)
  if (key.includes('setuju') || key.includes('diterima')) return 'Selesai'
  if (key.includes('revisi') || key.includes('perbaikan')) return 'Ditolak'
  const aliases = {
    menunggu: 'Menunggu Verifikasi',
    'menunggu verifikasi': 'Menunggu Verifikasi',
    pending: 'Menunggu Verifikasi',
    diproses: 'Diproses',
    proses: 'Diproses',
    'dalam proses': 'Diproses',
    selesai: 'Selesai',
    done: 'Selesai',
    ditolak: 'Ditolak',
    rejected: 'Ditolak',
  }

  return aliases[key] || String(raw || 'Menunggu Verifikasi').trim()
}

export function getPengajuanStatusKind(itemOrStatus) {
  const status = normalizePengajuanStatus(itemOrStatus)
  const key = normalizeText(status)
  if (key === 'menunggu verifikasi' || key === 'menunggu') return 'menunggu'
  if (key === 'diproses' || key === 'dalam proses') return 'diproses'
  if (key === 'selesai') return 'selesai'
  if (key === 'ditolak') return 'ditolak'
  return 'lainnya'
}

export function getPengajuanCreatedAt(item) {
  return (
    item?.createdAt ||
    item?.created_at ||
    item?.tanggal_pengajuan ||
    item?.tanggalPengajuan ||
    item?.tanggal ||
    item?.date ||
    ''
  )
}

export function getPengajuanLayanan(item) {
  return pickFromItem(item, ['jenis_layanan', 'jenisLayanan', 'layanan', 'nama_layanan', 'namaLayanan']) || '-'
}

export function getPengajuanNamaPemohon(item) {
  return (
    pickFromItem(item, [
      'nama_pemohon',
      'namaPemohon',
      'nama_peneliti',
      'namaPeneliti',
      'nama_lengkap',
      'namaLengkap',
      'nama',
      'name',
    ]) || '-'
  )
}

export function getPengajuanNikPemohon(item) {
  return pickFromItem(item, ['nik_pemohon', 'nikPemohon', 'nik', 'no_ktp', 'noKtp']) || '-'
}

export function getPengajuanUsernamePemohon(item) {
  return pickFromItem(item, ['username', 'user_name', 'email']) || '-'
}

export function getPengajuanKeterangan(item) {
  return pickFromItem(item, ['keterangan_pemohon', 'keteranganPemohon', 'keperluan', 'keterangan', 'catatan']) || '-'
}

export function getPengajuanCatatanPetugas(item) {
  return (
    pickFromItem(item, [
      'catatan_petugas',
      'catatanPetugas',
      'catatan_admin',
      'catatanAdmin',
      'alasan_penolakan',
      'alasanPenolakan',
    ]) || ''
  )
}

export function getPengajuanDokumen(item) {
  const docs =
    item?.dokumen_meta ||
    item?.dokumenMeta ||
    item?.dokumen ||
    item?.documents ||
    item?.lampiran ||
    item?.files ||
    {}
  if (Array.isArray(docs)) return docs
  return docs && typeof docs === 'object' ? docs : {}
}

export async function createPengajuan(payload) {
  const endpoint = resolveEndpoint(payload)
  if (!endpoint) return { success: false, status: 400, message: 'Endpoint pengajuan tidak dikenali.' }

  const res = await apiRequest(endpoint, {
    method: 'POST',
    body: payload,
    withAuth: true,
  })

  if (!res.ok) {
    return { success: false, status: res.status, message: pickMessage(res) || 'Gagal membuat pengajuan.' }
  }

  const id = parseIdFromCreateResponse(res.data)
  return { success: true, status: res.status, data: res.data, id, message: pickMessage(res) || 'Pengajuan berhasil dikirim.' }
}

export async function uploadDokumenPengajuan(endpoint, id, dokumenPayload) {
  if (!endpoint || !id) return { success: false, status: 400, message: 'Endpoint/ID tidak valid.' }
  const res = await apiRequest(`${endpoint}/${encodeURIComponent(id)}/dokumen`, {
    method: 'POST',
    body: dokumenPayload,
    withAuth: true,
  })
  if (!res.ok) return { success: false, status: res.status, message: pickMessage(res) || 'Gagal upload dokumen.' }
  return { success: true, status: res.status, data: res.data, message: pickMessage(res) || 'Dokumen berhasil diunggah.' }
}

export async function updatePengajuan(endpoint, id, payload) {
  if (!endpoint || !id) {
    return { success: false, status: 400, data: null, message: 'Endpoint/ID pengajuan tidak valid.' }
  }

  if (isLocalEndpoint(endpoint)) {
    const all = readLocalSubmissionsRaw()
    const idx = all.findIndex((s) => getPengajuanId(s) === String(id))
    if (idx < 0) {
      return { success: false, status: 404, data: null, message: 'Pengajuan lokal tidak ditemukan.' }
    }

    const current = normalizeLocalSubmission(all[idx]) || all[idx]
    const next = normalizeLocalSubmission({
      ...current,
      ...payload,
      data_form: payload?.data_form ? { ...(current?.data_form || {}), ...payload.data_form } : current?.data_form,
      dokumen: payload?.dokumen ? { ...(current?.dokumen || {}), ...payload.dokumen } : current?.dokumen,
      status: payload?.status || payload?.status_pengajuan || current?.status,
      catatanPetugas: (payload?.catatanPetugas ?? payload?.catatan_petugas ?? current?.catatanPetugas) || '',
      file_hasil: payload?.file_hasil ?? current?.file_hasil ?? '',
      surat_hasil: payload?.surat_hasil ?? current?.surat_hasil ?? null,
      url_hasil: payload?.url_hasil ?? current?.url_hasil ?? '',
      dokumen_hasil: payload?.dokumen_hasil ?? current?.dokumen_hasil ?? null,
      nama_file_hasil: payload?.nama_file_hasil ?? current?.nama_file_hasil ?? '',
      hasilSurat: payload?.surat_hasil || payload?.dokumen_hasil || current?.hasilSurat || null,
      updatedAt: new Date().toISOString(),
    })

    all[idx] = next
    writeLocalSubmissionsRaw(all)
    return { success: true, status: 200, data: next, message: 'Pengajuan berhasil diperbarui.' }
  }

  try {
    const path = `${endpoint}/${encodeURIComponent(id)}`
    let res = await apiRequest(path, {
      method: 'PUT',
      body: payload,
      withAuth: true,
    })

    if (!res.ok && [404, 405, 501].includes(res.status)) {
      res = await apiRequest(path, {
        method: 'PATCH',
        body: payload,
        withAuth: true,
      })
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        data: res.data,
        message: pickSafePetugasMessage(res) || 'Gagal memperbarui pengajuan.',
      }
    }

    return { success: true, status: res.status, data: res.data, message: pickMessage(res) || 'Pengajuan berhasil diperbarui.' }
  } catch (err) {
    return { success: false, status: 0, data: null, message: err?.message || 'Gagal memperbarui pengajuan.' }
  }
}

export async function deletePengajuan(endpoint, id) {
  if (!endpoint || !id) {
    return { success: false, status: 400, data: null, message: 'Endpoint/ID pengajuan tidak valid.' }
  }

  if (isLocalEndpoint(endpoint)) {
    const all = readLocalSubmissionsRaw()
    const next = all.filter((s) => getPengajuanId(s) !== String(id))
    if (next.length === all.length) {
      return { success: false, status: 404, data: null, message: 'Pengajuan lokal tidak ditemukan.' }
    }
    writeLocalSubmissionsRaw(next)
    return { success: true, status: 200, data: null, message: 'Pengajuan berhasil dihapus.' }
  }

  try {
    const res = await apiRequest(`${endpoint}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      withAuth: true,
    })

    if (!res.ok) {
      return { success: false, status: res.status, data: res.data, message: pickMessage(res) || 'Gagal menghapus pengajuan.' }
    }

    return { success: true, status: res.status, data: res.data, message: pickMessage(res) || 'Pengajuan berhasil dihapus.' }
  } catch (err) {
    return { success: false, status: 0, data: null, message: err?.message || 'Gagal menghapus pengajuan.' }
  }
}

export async function getPengajuanSaya() {
  const results = await Promise.all(
    SERVICE_ROUTES.map(async (svc) => {
      const res = await apiRequest(svc.endpoint, { method: 'GET', withAuth: true })
      if (!res.ok) {
        // Beberapa backend mengembalikan 404 jika data kosong; untuk UI status pengajuan, ini dianggap "kosong".
        if (res.status === 404) return { ok: true, status: res.status, items: [], svc }
        return { ok: false, status: res.status, message: pickMessage(res) || `Gagal memuat ${svc.key}.`, svc }
      }
      const items = unwrapItems(res.data).map((it) => normalizePengajuanItem(it, svc))
      return { ok: true, status: res.status, items, svc }
    })
  )

  const okOnes = results.filter((r) => r.ok)
  const merged = okOnes.flatMap((r) => r.items || [])

  if (okOnes.length === 0) {
    const firstErr = results.find((r) => !r.ok)
    return { success: false, status: firstErr?.status || 0, message: firstErr?.message || 'Gagal memuat pengajuan.' }
  }

  merged.sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))

  return { success: true, status: 200, items: merged }
}

export async function getSemuaPengajuanPetugas() {
  // Data petugas butuh token backend asli. Login petugas lokal saat ini hanya membuka akses UI sementara.
  const results = await Promise.all(
    SERVICE_ROUTES.map(async (svc) => {
      try {
        const res = await apiRequest(svc.endpoint, { method: 'GET', withAuth: true })
        if (!res.ok) {
          if (res.status === 404) return { ok: true, status: res.status, items: [], svc }
          return {
            ok: false,
            status: res.status,
            message: pickSafePetugasMessage(res) || `Gagal memuat ${svc.key}.`,
            authError: isBackendAuthError(res),
            svc,
          }
        }

        const items = unwrapItems(res.data).map((it) => normalizePengajuanItem(it, svc))
        return { ok: true, status: res.status, items, svc }
      } catch (err) {
        return {
          ok: false,
          status: 0,
          items: [],
          message: err?.message || `Gagal memuat ${svc.key}.`,
          authError: false,
          svc,
        }
      }
    })
  )

  const okOnes = results.filter((r) => r.ok)
  const seen = new Set()
  const merged = okOnes.flatMap((r) => r.items || []).filter((item) => {
    const id = getPengajuanId(item)
    const key = `${item?.__endpoint || ''}|${id || JSON.stringify(item)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const failed = results.filter((r) => !r.ok)
  const authErr = failed.find((r) => r.authError)

  if (merged.length > 0) {
    merged.sort((a, b) => toTime(getPengajuanCreatedAt(b)) - toTime(getPengajuanCreatedAt(a)))
    return { success: true, status: 200, items: merged, source: 'backend' }
  }

  if (authErr) {
    return { success: false, status: authErr.status || 0, items: [], message: PETUGAS_BACKEND_AUTH_MESSAGE }
  }

  const blockingError = failed.find((r) => r.status !== 404)
  if (blockingError && okOnes.length === 0) {
    return {
      success: false,
      status: blockingError.status || 0,
      items: [],
      message: blockingError.message || 'Sebagian data pengajuan belum dapat dimuat dari backend.',
    }
  }

  return { success: true, status: 200, items: [], source: 'backend' }
}

export async function getDetailPengajuan(id) {
  if (!id) return { success: false, status: 400, message: 'ID pengajuan tidak valid.' }
  // Detail per layanan belum disepakati di backend; fallback pakai list gabungan lalu cari id.
  const res = await getPengajuanSaya()
  if (!res?.success) return { success: false, status: res?.status || 0, message: res?.message || 'Gagal memuat pengajuan.' }
  const found = (res.items || []).find((it) => getPengajuanId(it) === String(id))
  if (!found) return { success: false, status: 404, message: 'Detail pengajuan tidak ditemukan.' }
  return { success: true, status: 200, data: found }
}
