import { apiRequest } from './api'
import { getDetailPengajuanByContext, SERVICE_ROUTES } from './pengajuanService'

const IS_DEV = !!import.meta.env.DEV
const DASHBOARD_ENDPOINT = '/api/kepala-camat/dashboard'
const LAPORAN_ENDPOINT = '/api/kepala-camat/laporan'

function pickMessage(res, fallback = 'Permintaan Kepala Camat gagal.') {
  const data = res?.data
  if (!data) return res?.status ? `HTTP ${res.status}` : fallback
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return fallback
  return data.message || data.error || data.msg || fallback
}

function unwrapData(payload) {
  if (!payload || typeof payload !== 'object') return {}
  return payload.data && typeof payload.data === 'object' ? payload.data : payload
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function unwrapArray(payload, preferredKeys = []) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []

  for (const key of preferredKeys) {
    if (Array.isArray(payload[key])) return payload[key]
  }

  for (const key of preferredKeys) {
    const nested = unwrapArray(payload[key], preferredKeys)
    if (nested.length > 0) return nested
  }

  for (const value of Object.values(payload)) {
    if (
      Array.isArray(value) &&
      value.some(
        (item) =>
          item &&
          typeof item === 'object' &&
          (item.nomor_pengajuan || item.id_pengajuan || item.pengajuan_id || item.nama_pemohon || item.status)
      )
    ) {
      return value
    }
  }

  for (const value of Object.values(payload)) {
    if (value && typeof value === 'object') {
      const nested = unwrapArray(value, preferredKeys)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function resolveEndpointFromSubmission(itemOrLayanan, jenisLayanan = '') {
  const rawValue = typeof itemOrLayanan === 'object' ? itemOrLayanan?.layanan || itemOrLayanan?.jenis_layanan || '' : itemOrLayanan
  const layananKey = normalizeText(rawValue)
  const jenisKey = normalizeText(jenisLayanan || (typeof itemOrLayanan === 'object' ? itemOrLayanan?.jenis_layanan || '' : ''))

  const matchedRoute = SERVICE_ROUTES.find((route) => {
    const routeKey = normalizeText(route.key)
    const routeJenis = normalizeText(route.jenis_layanan)
    const routeEndpoint = normalizeText(route.endpoint)
    return (
      routeKey === layananKey ||
      routeKey.replace(/\s+/g, '_') === String(rawValue || '').trim().toLowerCase() ||
      routeJenis === layananKey ||
      routeJenis === jenisKey ||
      routeEndpoint === layananKey
    )
  })

  return matchedRoute?.endpoint || ''
}

function normalizeStatus(status) {
  const text = String(status || '').trim().toLowerCase()
  if (text === 'menunggu verifikasi' || text === 'menunggu') return 'Menunggu Verifikasi'
  if (text === 'verifikasi') return 'Verifikasi'
  if (text === 'diproses' || text === 'dalam proses') return 'Diproses'
  if (text === 'selesai') return 'Selesai'
  if (text === 'ditolak') return 'Ditolak'
  return String(status || 'Menunggu Verifikasi').trim() || 'Menunggu Verifikasi'
}

function normalizePengajuanItem(item) {
  const source = item && typeof item === 'object' ? item : {}
  const idPengajuan = source.id_pengajuan || source.pengajuan_id || source.id || ''
  const tanggalPengajuan = source.tanggal_pengajuan || source.created_at || source.createdAt || ''
  const fileSuratHasil = source.file_surat_hasil ?? null
  const namaFileSuratHasil =
    source.nama_file_surat_hasil ||
    (typeof fileSuratHasil === 'string' ? fileSuratHasil : '') ||
    null

  return {
    ...source,
    __endpoint: source.__endpoint || resolveEndpointFromSubmission(source, source.jenis_layanan),
    id: String(idPengajuan || ''),
    id_pengajuan: idPengajuan,
    pengajuan_id: idPengajuan,
    nomor_pengajuan: source.nomor_pengajuan || '',
    nama_pemohon: source.nama_pemohon || source.nama || '-',
    jenis_layanan: source.jenis_layanan || source.layanan || '-',
    layanan: source.layanan || '',
    tanggal_pengajuan: tanggalPengajuan,
    created_at: tanggalPengajuan,
    createdAt: tanggalPengajuan,
    status: normalizeStatus(source.status),
    catatan_petugas: source.catatan_petugas || '',
    file_surat_hasil: fileSuratHasil,
    nama_file_surat_hasil: namaFileSuratHasil,
  }
}

function normalizeRekapStatus(value) {
  const source = value && typeof value === 'object' ? value : {}
  return {
    menunggu_verifikasi: Number(source.menunggu_verifikasi || 0),
    verifikasi: Number(source.verifikasi || 0),
    diproses: Number(source.diproses || 0),
    selesai: Number(source.selesai || 0),
    ditolak: Number(source.ditolak || 0),
  }
}

function normalizeRekapLayanan(items) {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    const source = item && typeof item === 'object' ? item : {}
    return {
      ...source,
      layanan: source.layanan || '',
      jenis_layanan: source.jenis_layanan || source.layanan || '-',
      total_pengajuan: Number(source.total_pengajuan || 0),
    }
  })
}

function normalizeRingkasanData(value) {
  const source = value && typeof value === 'object' ? value : {}
  const daftarPengajuan = unwrapArray(source, [
    'daftar_pengajuan',
    'pengajuan_terbaru',
    'pengajuanTerbaru',
    'recent',
    'laporan',
    'items',
    'data',
  ]).map(normalizePengajuanItem)

  return {
    total_pengajuan: Number(source.total_pengajuan ?? daftarPengajuan.length ?? 0),
    rekap_status: normalizeRekapStatus(source.rekap_status),
    rekap_layanan: normalizeRekapLayanan(source.rekap_layanan),
    daftar_pengajuan: daftarPengajuan,
  }
}

function normalizeDetailData(value) {
  const source = value && typeof value === 'object' ? value : {}
  const normalized = normalizePengajuanItem(source)

  return {
    ...source,
    ...normalized,
    data_pemohon: source.data_pemohon && typeof source.data_pemohon === 'object' ? source.data_pemohon : {},
    data_pengajuan: source.data_pengajuan && typeof source.data_pengajuan === 'object' ? source.data_pengajuan : {},
    daftar_dokumen: Array.isArray(source.daftar_dokumen) ? source.daftar_dokumen : [],
    dokumen: source.dokumen ?? normalized.dokumen ?? source.daftar_dokumen ?? [],
    dokumen_meta: source.dokumen_meta ?? source.dokumenMeta ?? null,
    documents: source.documents ?? null,
    files: source.files ?? null,
    lampiran: source.lampiran ?? null,
    berkas: source.berkas ?? null,
    file_surat_hasil: source.file_surat_hasil ?? null,
    nama_file_surat_hasil: source.nama_file_surat_hasil ?? normalized.nama_file_surat_hasil ?? null,
    detail_pengajuan: source.detail_pengajuan && typeof source.detail_pengajuan === 'object' ? source.detail_pengajuan : {},
  }
}

async function requestKepalaCamat(path, fallbackMessage) {
  try {
    const response = await apiRequest(path, { method: 'GET', withAuth: true })
    if (IS_DEV) console.log('[kepala-camat] response.data:', response.data)

    if (!response.ok || response?.data?.success === false) {
      console.error('[kepala-camat] backend error:', response.data)
      return {
        success: false,
        status: response.status,
        data: null,
        message: pickMessage(response, fallbackMessage),
      }
    }

    return {
      success: true,
      status: response.status,
      data: unwrapData(response.data),
      message: pickMessage(response, ''),
    }
  } catch (err) {
    console.error('[kepala-camat] request error:', err)
    return {
      success: false,
      status: 0,
      data: null,
      message: err?.message || fallbackMessage,
    }
  }
}

export async function getKepalaCamatDashboard() {
  const result = await requestKepalaCamat(DASHBOARD_ENDPOINT, 'Data dashboard Kepala Camat belum dapat dimuat.')
  if (!result.success) return result

  return {
    ...result,
    data: normalizeRingkasanData(result.data),
  }
}

export async function getKepalaCamatLaporan() {
  const result = await requestKepalaCamat(LAPORAN_ENDPOINT, 'Data laporan Kepala Camat belum dapat dimuat.')
  if (!result.success) return result

  return {
    ...result,
    data: normalizeRingkasanData(result.data),
  }
}

export async function getKepalaCamatLaporanDetail(layanan, id) {
  const encodedLayanan = encodeURIComponent(String(layanan || '').trim())
  const encodedId = encodeURIComponent(String(id || '').trim())
  const path = `${LAPORAN_ENDPOINT}/${encodedLayanan}/${encodedId}`
  const result = await requestKepalaCamat(path, 'Detail laporan Kepala Camat belum dapat dimuat.')
  if (!result.success) return result

  const normalizedDetail = normalizeDetailData({
    ...result.data,
    __endpoint: resolveEndpointFromSubmission(layanan, result.data?.jenis_layanan),
  })

  const fallbackDetail = await getDetailPengajuanByContext(id, normalizedDetail)
  const mergedDetail = fallbackDetail?.success
    ? normalizeDetailData({
        ...normalizedDetail,
        ...(fallbackDetail.data || {}),
        __endpoint: fallbackDetail.data?.__endpoint || normalizedDetail.__endpoint,
      })
    : normalizedDetail

  return {
    ...result,
    data: mergedDetail,
  }
}
