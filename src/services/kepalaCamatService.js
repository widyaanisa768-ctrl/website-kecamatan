import { apiRequest } from './api'

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
  const daftarPengajuan = Array.isArray(source.daftar_pengajuan)
    ? source.daftar_pengajuan.map(normalizePengajuanItem)
    : []

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

  return {
    ...result,
    data: normalizeDetailData(result.data),
  }
}
