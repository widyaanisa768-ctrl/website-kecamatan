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
  const inner = data.data ?? data.items ?? data.result ?? data.rows ?? data.pengajuan ?? data.submissions ?? null
  if (Array.isArray(inner)) return inner
  return []
}

const SERVICE_ROUTES = [
  { key: 'rekomendasi_penelitian', endpoint: '/rekomendasi_penelitian', jenis_layanan: 'Rekomendasi Penelitian / Riset' },
  { key: 'rekomendasi_surat_pindah', endpoint: '/rekomendasi_surat_pindah', jenis_layanan: 'Rekomendasi Surat Pindah' },
  { key: 'rekomendasi_akta_kelahiran', endpoint: '/rekomendasi_akta_kelahiran', jenis_layanan: 'Rekomendasi Akta Kelahiran' },
  { key: 'rekomendasi_kartu_keluarga', endpoint: '/rekomendasi_kartu_keluarga', jenis_layanan: 'Rekomendasi Kartu Keluarga' },
  { key: 'rekomendasi_surat_kerja', endpoint: '/rekomendasi_surat_kerja', jenis_layanan: 'Rekomendasi Kerja' },
  { key: 'rekomendasi_surat_tanah', endpoint: '/rekomendasi_surat_tanah', jenis_layanan: 'Rekomendasi Surat Tanah SKT/SKGR' },
  { key: 'rekomendasi_surat_ahli_waris', endpoint: '/rekomendasi_surat_ahli_waris', jenis_layanan: 'Surat Keterangan Ahli Waris' },
  { key: 'rekomendasi_surat_yayasan', endpoint: '/rekomendasi_surat_yayasan', jenis_layanan: 'Rekomendasi Yayasan/TPQ/Ormas' },
]

const ENDPOINT_BY_LAYANAN_PATH = {
  '/layanan/penelitian': '/rekomendasi_penelitian',
  '/layanan/penelitian-riset': '/rekomendasi_penelitian',
  '/layanan/surat-pindah': '/rekomendasi_surat_pindah',
  '/layanan/akta-kelahiran': '/rekomendasi_akta_kelahiran',
  '/layanan/kartu-keluarga': '/rekomendasi_kartu_keluarga',
  '/layanan/rekomendasi-kerja': '/rekomendasi_surat_kerja',
  '/layanan/surat-tanah': '/rekomendasi_surat_tanah',
  '/layanan/ahli-waris': '/rekomendasi_surat_ahli_waris',
  '/layanan/yayasan-ormas': '/rekomendasi_surat_yayasan',
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
  const id = item?.id || item?._id || item?.pengajuan_id || item?.uuid || ''
  return id ? String(id) : ''
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
      return { success: false, status: res.status, data: res.data, message: pickMessage(res) || 'Gagal memperbarui pengajuan.' }
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
      const items = unwrapItems(res.data).map((it) => ({
        ...it,
        jenis_layanan: it?.jenis_layanan || svc.jenis_layanan,
        __endpoint: svc.endpoint,
      }))
      return { ok: true, status: res.status, items, svc }
    })
  )

  const okOnes = results.filter((r) => r.ok)
  const merged = okOnes.flatMap((r) => r.items || [])

  if (okOnes.length === 0) {
    const firstErr = results.find((r) => !r.ok)
    return { success: false, status: firstErr?.status || 0, message: firstErr?.message || 'Gagal memuat pengajuan.' }
  }

  const toTime = (v) => {
    const t = new Date(v || 0).getTime()
    return Number.isFinite(t) ? t : 0
  }
  merged.sort((a, b) => toTime(b?.createdAt || b?.created_at || b?.tanggal_pengajuan) - toTime(a?.createdAt || a?.created_at || a?.tanggal_pengajuan))

  return { success: true, status: 200, items: merged }
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
