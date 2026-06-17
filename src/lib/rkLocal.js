const AUTH_KEY = 'rk_auth'
const SUBMISSIONS_KEY = 'rk_submissions_v1'
const NOTIF_PREFIX = 'rk_notif_v1:'

export const STATUS = {
  MENUNGGU: 'Menunggu Verifikasi',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getAuth() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(AUTH_KEY), null)
}

export function setAuth(nextAuth) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth))
  window.dispatchEvent(new Event('rk-auth-updated'))
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_KEY)
}

export function fileToMeta(file) {
  if (!file) return null
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  }
}

export function mergeDokumenMeta(existingDokumen = {}, nextDokumenFiles = {}) {
  const base = existingDokumen && typeof existingDokumen === 'object' ? existingDokumen : {}
  const next = { ...base }
  for (const [key, file] of Object.entries(nextDokumenFiles || {})) {
    if (file) next[key] = fileToMeta(file)
  }
  return next
}

function nowISO() {
  return new Date().toISOString()
}

function genId(prefix = 'KR') {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
  const time = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0')
  return `${prefix}-${y}${m}${day}-${time}-${rand}`
}

export function listSubmissions() {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(SUBMISSIONS_KEY), [])
}

export function getSubmissionById(id) {
  return listSubmissions().find((s) => s.id === id) || null
}

export function listSubmissionsByUsername(username) {
  if (typeof window === 'undefined') return []
  if (username) seedDummySubmissionsIfEmpty(username)
  return listSubmissions().filter((s) => s?.pemohon?.username === username)
}

export function createSubmission({ layanan, layananPath = '', data = null, keteranganPemohon = '', dokumen = {} }) {
  const auth = getAuth()
  if (!auth || auth.role !== 'masyarakat') {
    throw new Error('Unauthorized')
  }

  const submission = {
    id: genId('KR'),
    pemohon: {
      username: auth.username,
      nama: auth.name || auth.username,
      nik: auth.nik || '',
    },
    layanan,
    layananPath,
    keteranganPemohon,
    data,
    dokumen: Object.fromEntries(Object.entries(dokumen).map(([key, file]) => [key, fileToMeta(file)])),
    status: STATUS.MENUNGGU,
    catatanPetugas: '',
    hasilSurat: null, // { filename, content, createdAt }
    createdAt: nowISO(),
    updatedAt: nowISO(),
  }

  const all = listSubmissions()
  all.unshift(submission)
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all))

  return submission
}

const DEMO_FLAG = '__rk_demo_v1'

function seedDummySubmissionsIfEmpty(username) {
  if (!username) return

  const all = listSubmissions()
  const userSubs = all.filter((s) => s?.pemohon?.username === username)

  const basePemohon = {
    username,
    nama: username,
    nik: '0000000000000000',
  }

  const now = Date.now()
  const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString()

  const common = {
    [DEMO_FLAG]: true,
    pemohon: basePemohon,
    dokumen: {},
    keteranganPemohon: 'Pengajuan dummy untuk menampilkan seluruh status di UI.',
  }

  const templates = [
    {
      demoKey: 'STATUS:MENUNGGU',
      layanan: 'Surat Keterangan Ahli Waris',
      layananPath: '/layanan/ahli-waris',
      data: {
        nama_pewaris: 'Alm. Bapak Dummy',
        nik_pewaris: '1111222233334444',
        alamat_pewaris: 'Alamat pewaris dummy',
        nama_pemohon: 'Pemohon Dummy',
        nik_pemohon: '5555666677778888',
        alamat_pemohon: 'Alamat pemohon dummy',
        no_hp: '081234567890',
      },
      status: STATUS.MENUNGGU,
      catatanPetugas: '',
      hasilSurat: null,
      createdAt: days(1),
      updatedAt: days(1),
    },
    {
      demoKey: 'STATUS:DIPROSES',
      layanan: 'Rekomendasi Penelitian / Riset',
      layananPath: '/layanan/penelitian-riset',
      data: {
        nama_peneliti: 'Budi',
        instansi: 'Universitas Dummy',
        topik_penelitian: 'Penelitian Dummy',
        lokasi_penelitian: 'Lokasi Dummy',
        waktu_penelitian: days(12).slice(0, 10),
      },
      status: STATUS.DIPROSES,
      catatanPetugas: '',
      hasilSurat: null,
      createdAt: days(3),
      updatedAt: days(0),
    },
    {
      demoKey: 'STATUS:DITOLAK',
      layanan: 'Rekomendasi Kartu Keluarga',
      layananPath: '/layanan/kartu-keluarga',
      data: { nama_pemohon: 'Siti', alamat: 'Alamat dummy', nik: '1234567890123456', no_hp: '08123456789' },
      status: STATUS.DITOLAK,
      catatanPetugas: 'Dokumen kurang jelas. Mohon unggah ulang scan/foto yang lebih jelas.',
      hasilSurat: null,
      createdAt: days(5),
      updatedAt: days(2),
    },
    {
      demoKey: 'STATUS:SELESAI-SETUJU',
      layanan: 'Rekomendasi Kerja',
      layananPath: '/layanan/rekomendasi-kerja',
      data: { nama_pemohon: 'Andi', alamat: 'Alamat dummy', nik: '1111222233334444', no_hp: '08120000000', keterangan: 'Keterangan dummy' },
      status: STATUS.SELESAI,
      catatanPetugas: '',
      hasilSurat: null,
      createdAt: days(6),
      updatedAt: days(1),
    },
    {
      demoKey: 'STATUS:SELESAI',
      layanan: 'Penerbitan Surat Tanah SKT / SKGR',
      layananPath: '/layanan/surat-tanah',
      data: { nama_pemohon: 'Rahmat', alamat: 'Alamat dummy', nik: '9999888877776666', no_hp: '08121111111' },
      status: STATUS.SELESAI,
      catatanPetugas: '',
      hasilSurat: {
        filename: 'Surat-Dummy-Selesai.txt',
        content: 'SURAT DUMMY\n\nDokumen ini dummy untuk demo status SELESAI.\n',
        createdAt: days(0),
      },
      createdAt: days(10),
      updatedAt: days(0),
    },
  ]

  const missing = templates.filter(
    (t) => !userSubs.some((s) => s?.[DEMO_FLAG] === true && s?.demoKey === t.demoKey)
  )
  if (missing.length === 0) return

  const dummies = missing.map((t) => ({
    ...common,
    id: genId('DMO'),
    ...t,
  }))

  all.unshift(...dummies)
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all))
}

export function updateSubmission(id, patch) {
  if (typeof window === 'undefined') return null
  const all = listSubmissions()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return null

  const next = {
    ...all[idx],
    ...patch,
    pemohon: patch?.pemohon ? { ...all[idx].pemohon, ...patch.pemohon } : all[idx].pemohon,
    updatedAt: nowISO(),
  }
  all[idx] = next
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all))
  return next
}

export function deleteSubmission(id) {
  const auth = getAuth()
  if (!auth || auth.role !== 'masyarakat') {
    throw new Error('Unauthorized')
  }

  const all = listSubmissions()
  const idx = all.findIndex((s) => s.id === id)
  if (idx < 0) return false

  const target = all[idx]
  if (target?.pemohon?.username !== auth.username) {
    throw new Error('Forbidden')
  }

  all.splice(idx, 1)
  window.localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all))
  return true
}

export function pushNotif(username, notif) {
  if (typeof window === 'undefined') return
  const key = `${NOTIF_PREFIX}${username}`
  const list = safeParse(window.localStorage.getItem(key), [])
  list.unshift({
    id: genId('NTF'),
    createdAt: nowISO(),
    read: false,
    ...notif,
  })
  window.localStorage.setItem(key, JSON.stringify(list))
}

export function listNotif(username) {
  if (typeof window === 'undefined') return []
  const key = `${NOTIF_PREFIX}${username}`
  return safeParse(window.localStorage.getItem(key), [])
}

export function markNotifRead(username, notifId) {
  if (typeof window === 'undefined') return
  const key = `${NOTIF_PREFIX}${username}`
  const list = safeParse(window.localStorage.getItem(key), [])
  const idx = list.findIndex((n) => n.id === notifId)
  if (idx < 0) return
  list[idx] = { ...list[idx], read: true }
  window.localStorage.setItem(key, JSON.stringify(list))
}
