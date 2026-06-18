import { FILE_TYPE_PRESETS, validateFileField } from './formValidation'

const TWO_MB = 2

const PDF_IMAGE = {
  ...FILE_TYPE_PRESETS.PDF_IMAGE,
  maxSizeMB: TWO_MB,
}

const PDF_PNG = {
  ...FILE_TYPE_PRESETS.PDF_PNG,
  maxSizeMB: TWO_MB,
}

const IMAGE = {
  ...FILE_TYPE_PRESETS.IMAGE,
  maxSizeMB: TWO_MB,
}

export const DOKUMEN_CONFIGS = [
  {
    key: 'rekomendasi_penelitian',
    endpoint: '/api/rekomendasi_penelitian',
    labels: ['rekomendasi penelitian', 'penelitian riset', 'riset'],
    fields: [
      { key: 'ktpMahasiswa', backendKey: 'ktp_mahasiswa', label: 'Fotocopy KTP Mahasiswa', required: true, ...PDF_IMAGE },
      { key: 'ktmMahasiswa', backendKey: 'ktm_mahasiswa', label: 'Fotocopy KTM', required: true, ...PDF_IMAGE },
      {
        key: 'suratRekomendasiRiset',
        backendKey: 'surat_rekomendasi_riset_univ_kesbangpol',
        label: 'Surat Rekomendasi Riset dari Universitas/KESBANGPOL',
        required: true,
        ...PDF_IMAGE,
      },
    ],
  },
  {
    key: 'rekomendasi_surat_pindah',
    endpoint: '/api/rekomendasi_surat_pindah',
    labels: ['surat pindah', 'rekomendasi surat pindah'],
    fields: [
      {
        key: 'suratPindah',
        backendKey: 'surat_keterangan_pindah_kelurahan',
        label: 'Surat Keterangan Pindah',
        required: true,
        ...PDF_IMAGE,
      },
      { key: 'pasFoto', backendKey: 'pas_foto_3x4', label: 'Pas Foto 3x4', required: true, ...IMAGE },
      { key: 'kartuKeluarga', backendKey: 'kartu_keluarga', label: 'Fotocopy dan Asli KK', required: true, ...PDF_IMAGE },
      { key: 'ktp', backendKey: 'ktp', label: 'Fotocopy KTP', required: true, ...PDF_IMAGE },
      {
        key: 'aktaKelahiranWniTionghoa',
        backendKey: 'akta_kelahiran_wni_tionghoa',
        label: 'Fotocopy Akta Kelahiran',
        required: false,
        ...PDF_IMAGE,
      },
    ],
  },
  {
    key: 'rekomendasi_akta_kelahiran',
    endpoint: '/api/rekomendasi_akta_kelahiran',
    labels: ['akta kelahiran', 'rekomendasi akta kelahiran'],
    fields: [
      {
        key: 'suratRekomendasiLurah',
        backendKey: 'surat_rekomendasi_lurah',
        label: 'Surat Rekomendasi Lurah/Penghulu',
        required: true,
        ...PDF_PNG,
      },
      { key: 'suratLahir', backendKey: 'sk_lahir_bidan_dokter', label: 'Surat Keterangan Lahir', required: true, ...PDF_PNG },
      { key: 'ktpOrtu', backendKey: 'ktp_ortu', label: 'KTP Kedua Orang Tua', required: true, ...PDF_PNG },
      { key: 'kk', backendKey: 'kk', label: 'Kartu Keluarga', required: true, ...PDF_PNG },
      { key: 'suratNikah', backendKey: 'surat_nikah', label: 'Surat Nikah', required: true, ...PDF_PNG },
      {
        key: 'aktaLahirOrtuTionghoa',
        backendKey: 'akta_lahir_ortu_tionghoa',
        label: 'Akta Kelahiran Orang Tua',
        required: false,
        ...PDF_PNG,
      },
    ],
  },
  {
    key: 'rekomendasi_kartu_keluarga',
    endpoint: '/api/rekomendasi_kartu_keluarga',
    labels: ['kartu keluarga', 'rekomendasi kartu keluarga'],
    fields: [
      { key: 'suratKeteranganRt', backendKey: 'surat_keterangan_rt', label: 'Surat Keterangan RT', required: true, ...PDF_PNG },
      {
        key: 'pengantarLurah',
        backendKey: 'pengantar_lurah_penghulu',
        label: 'Pengantar Lurah/Penghulu',
        required: true,
        ...PDF_PNG,
      },
      { key: 'suratNikah', backendKey: 'surat_nikah', label: 'Surat Nikah', required: true, ...PDF_PNG },
      { key: 'kartuKeluarga', backendKey: 'kartu_keluarga', label: 'Kartu Keluarga', required: true, ...PDF_PNG },
      {
        key: 'aktaKelahiranWniTionghoa',
        backendKey: 'akta_kelahiran_dan_suket_wni_tionghoa',
        label: 'Akta Kelahiran dan Surat WNI',
        required: false,
        ...PDF_PNG,
      },
    ],
  },
  {
    key: 'rekomendasi_surat_kerja',
    endpoint: '/api/rekomendasi_surat_kerja',
    labels: ['rekomendasi kerja', 'surat kerja'],
    fields: [{ key: 'ktp', backendKey: 'ktp', label: 'Fotocopy KTP', required: true, ...PDF_PNG }],
  },
  {
    key: 'rekomendasi_surat_tanah',
    endpoint: '/api/rekomendasi_surat_tanah',
    labels: ['surat tanah', 'skt', 'skgr', 'rekomendasi surat tanah'],
    fields: [
      {
        key: 'alasHak',
        backendKey: 'surat_dasar_hak_kepemilikan_tanah',
        label: 'Surat Dasar/Alas Hak Kepemilikan Tanah',
        required: true,
        ...PDF_PNG,
      },
      {
        key: 'suratAhliWaris',
        backendKey: 'surat_keterangan_ahli_waris',
        label: 'Surat Keterangan Ahli Waris',
        required: true,
        ...PDF_PNG,
      },
      { key: 'ktp', backendKey: 'ktp', label: 'Fotocopy KTP', required: true, ...PDF_PNG },
      {
        key: 'blankoSktSkgr',
        backendKey: 'blanko_skt_skgr_bermaterai',
        label: 'Blangko SKT/SKGR bermaterai',
        required: true,
        ...PDF_PNG,
      },
      { key: 'fotoLokasiTanah', backendKey: 'foto_lokasi_tanah', label: 'Foto Lokasi Tanah', required: true, ...PDF_PNG },
      { key: 'buktiPbb', backendKey: 'bukti_pbb', label: 'Bukti/Fotocopy PBB', required: true, ...PDF_PNG },
    ],
  },
  {
    key: 'rekomendasi_surat_ahli_waris',
    endpoint: '/api/rekomendasi_surat_ahli_waris',
    labels: ['ahli waris', 'surat keterangan ahli waris', 'surat ahli waris'],
    fields: [
      { key: 'ktp', backendKey: 'ktp', label: 'Fotocopy KTP', required: true, ...PDF_PNG },
      { key: 'kkAhliWaris', backendKey: 'kk_ahli_waris', label: 'Fotocopy KK Ahli Waris', required: true, ...PDF_PNG },
      {
        key: 'suratKematian',
        backendKey: 'surat_keterangan_kematian_kelurahan',
        label: 'Surat Keterangan Kematian',
        required: true,
        ...PDF_PNG,
      },
      {
        key: 'suratTanahPendukung',
        backendKey: 'surat_tanah_pendukung',
        label: 'Fotocopy Surat Tanah',
        required: false,
        ...PDF_PNG,
      },
    ],
  },
  {
    key: 'rekomendasi_surat_yayasan',
    endpoint: '/api/rekomendasi_surat_yayasan',
    labels: ['yayasan', 'sekolah', 'tpq', 'ormas', 'yayasan tpq ormas'],
    fields: [
      {
        key: 'rekomendasiLurah',
        backendKey: 'rekomendasi_lurah_penghulu_asli',
        label: 'Rekomendasi Lurah/Penghulu',
        required: true,
        ...PDF_PNG,
      },
      { key: 'daftarGuruPengurus', backendKey: 'daftar_nama_guru_pengurus', label: 'Daftar Nama Guru/Pengurus', required: true, ...PDF_PNG },
      { key: 'daftarAnakDidik', backendKey: 'daftar_nama_anak_didik', label: 'Daftar Nama Anak Didik', required: true, ...PDF_PNG },
      {
        key: 'fotoDokumentasi',
        backendKey: 'foto_dokumentasi_gedung_dan_musyawarah',
        label: 'Foto Dokumentasi Gedung/Hasil Musyawarah',
        required: true,
        ...PDF_PNG,
      },
      { key: 'ktpPengurus', backendKey: 'ktp_pengurus', label: 'Fotocopy KTP Pengurus', required: true, ...PDF_PNG },
      { key: 'aktaNotaris', backendKey: 'akta_notaris_pendirian', label: 'Akta Notaris Pendirian', required: true, ...PDF_PNG },
    ],
  },
]

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function getDokumenConfigForPengajuan(item) {
  const endpoint = String(item?.__endpoint || item?.endpoint || '').trim()
  if (endpoint) {
    const byEndpoint = DOKUMEN_CONFIGS.find((config) => endpoint.includes(config.endpoint))
    if (byEndpoint) return byEndpoint
  }

  const serviceKey = String(item?.serviceKey || item?.service_key || item?.key || '').trim()
  if (serviceKey) {
    const byKey = DOKUMEN_CONFIGS.find((config) => config.key === serviceKey)
    if (byKey) return byKey
  }

  const layanan = normalizeText(item?.jenis_layanan || item?.jenisLayanan || item?.layanan || item?.nama_layanan)
  return DOKUMEN_CONFIGS.find((config) => config.labels.some((label) => layanan.includes(normalizeText(label)))) || null
}

export function buildDokumenFormDataFromFiles(files = {}, fields = []) {
  const formData = new FormData()
  fields.forEach((field) => {
    const file = files[field.key]
    if (file && typeof file === 'object' && typeof file.name === 'string') {
      formData.append(field.backendKey || field.key, file)
    }
  })
  return formData
}

export function validateSelectedDokumenFiles(files = {}, fields = []) {
  return fields
    .map((field) => {
      const file = files[field.key]
      if (!file) return ''
      return validateFileField(file, { ...field, required: false })
    })
    .filter(Boolean)
}

export function hasSelectedDokumenFiles(files = {}) {
  return Object.values(files || {}).some((file) => file && typeof file === 'object' && typeof file.name === 'string')
}
