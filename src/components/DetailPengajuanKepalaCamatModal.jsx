import { useEffect, useMemo } from 'react'
import { normalizePengajuanDokumenPersyaratan } from '../lib/pengajuanDokumenView'
import { getPengajuanStatusKind } from '../services/pengajuanService'

const FIELD_LABELS = {
  nomor_pengajuan: 'Nomor Pengajuan',
  nama_pemohon: 'Nama Pemohon',
  nama_lengkap: 'Nama Pemohon',
  jenis_layanan: 'Jenis Layanan',
  tanggal_pengajuan: 'Tanggal Pengajuan',
  status: 'Status',
  catatan_petugas: 'Catatan Petugas',
  nik: 'NIK',
  no_hp: 'Nomor HP',
  nomor_hp: 'Nomor HP',
  email: 'Email',
  alamat: 'Alamat',
  alamat_asal: 'Alamat Asal',
  alamat_pindah: 'Alamat Pindah',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  jenis_kelamin: 'Jenis Kelamin',
  pekerjaan: 'Pekerjaan',
  agama: 'Agama',
  status_perkawinan: 'Status Perkawinan',
  kewarganegaraan: 'Kewarganegaraan',
  keterangan: 'Keterangan',
  keperluan: 'Keperluan',
  tujuan_pindah: 'Tujuan Pindah',
  alasan_pindah: 'Alasan Pindah',
  lama_tinggal: 'Lama Tinggal',
  nama_usaha: 'Nama Usaha',
  jabatan: 'Jabatan',
  instansi: 'Instansi',
  lokasi_penelitian: 'Lokasi Penelitian',
  topik_penelitian: 'Topik Penelitian',
}

const DETAIL_EXCLUDED_KEYS = new Set([
  'id',
  'id_pengajuan',
  'nomor_pengajuan',
  'nama_pemohon',
  'nama_lengkap',
  'jenis_layanan',
  'layanan',
  'tanggal_pengajuan',
  'status',
  'catatan_petugas',
  'file_surat_hasil',
  'nama_file_surat_hasil',
  'data_pemohon',
  'data_pengajuan',
  'daftar_dokumen',
  'detail_pengajuan',
  'dokumen',
  'dokumen_meta',
  'documents',
  'files',
  'lampiran',
  'berkas',
])

function hasValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function formatTanggalPendekID(date) {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function formatLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatValue(key, value) {
  if (!hasValue(value)) return ''
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (Array.isArray(value)) return value.filter(hasValue).join(', ')
  if (typeof value === 'number') return String(value)
  if (key.includes('tanggal')) return formatTanggalPendekID(value)
  return String(value).trim()
}

function findValue(source, keys) {
  if (!source || typeof source !== 'object') return undefined

  for (const key of keys) {
    const directValue = source[key]
    if (hasValue(directValue)) return directValue
  }

  for (const value of Object.values(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = findValue(value, keys)
      if (hasValue(nested)) return nested
    }
  }

  return undefined
}

function buildKeyedEntries(sources, fields) {
  return fields
    .map((field) => {
      const value = sources.reduce((found, source) => (hasValue(found) ? found : findValue(source, field.keys)), undefined)
      if (!hasValue(value)) return null
      return {
        key: field.keys[0],
        label: field.label || formatLabel(field.keys[0]),
        value: field.render ? field.render(value) : formatValue(field.keys[0], value),
      }
    })
    .filter(Boolean)
}

function collectRemainingEntries(source, excludeKeys = new Set()) {
  const entries = []
  const seen = new Set()

  const visit = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return

    for (const [key, nextValue] of Object.entries(value)) {
      if (excludeKeys.has(key) || seen.has(key) || !hasValue(nextValue)) continue

      if (Array.isArray(nextValue)) {
        if (nextValue.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
          entries.push({ key, label: formatLabel(key), value: formatValue(key, nextValue) })
          seen.add(key)
        }
        continue
      }

      if (typeof nextValue === 'object') {
        visit(nextValue)
        continue
      }

      entries.push({ key, label: formatLabel(key), value: formatValue(key, nextValue) })
      seen.add(key)
    }
  }

  visit(source)
  return entries
}

function renderEntryValue(entry) {
  return typeof entry.value === 'string' ? entry.value : entry.value
}

function getDisplayStatusKind(itemOrStatus) {
  const kind = getPengajuanStatusKind(itemOrStatus)
  if (kind === 'selesai') return 'selesai'
  if (kind === 'ditolak') return 'ditolak'
  if (kind === 'diproses') return 'diproses'
  return 'menunggu'
}

function getDisplayStatus(itemOrStatus) {
  const kind = getDisplayStatusKind(itemOrStatus)
  if (kind === 'selesai') return 'Selesai'
  if (kind === 'ditolak') return 'Ditolak'
  if (kind === 'diproses') return 'Diproses'
  return 'Menunggu Verifikasi'
}

function getStatusClass(status) {
  const kind = getDisplayStatusKind(status)
  if (kind === 'menunggu') return 'kcm-status kcm-status--waiting'
  if (kind === 'diproses') return 'kcm-status kcm-status--process'
  if (kind === 'selesai') return 'kcm-status kcm-status--done'
  if (kind === 'ditolak') return 'kcm-status kcm-status--reject'
  return 'kcm-status'
}

function DetailSection({ title, entries, children }) {
  if ((!entries || entries.length === 0) && !children) return null

  return (
    <section className="kcm-detailSection">
      <div className="kcm-detailSectionHead">
        <h4>{title}</h4>
      </div>
      {entries && entries.length > 0 ? (
        <dl className="kcm-detailList">
          {entries.map((entry) => (
            <div className="kcm-detailItem" key={entry.key}>
              <dt>{entry.label}</dt>
              <dd>{renderEntryValue(entry)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  )
}

export default function DetailPengajuanKepalaCamatModal({ row, onClose, loading = false, error = '' }) {
  const detailRow = row || null
  const dokumenItems = useMemo(() => normalizePengajuanDokumenPersyaratan(detailRow), [detailRow])
  const infoPengajuan = buildKeyedEntries([detailRow], [
    { keys: ['nomor_pengajuan'] },
    { keys: ['jenis_layanan'] },
    { keys: ['tanggal_pengajuan'] },
    { keys: ['status'], render: (value) => <span className={getStatusClass(value)}>{formatValue('status', value)}</span> },
    { keys: ['catatan_petugas'] },
  ])
  const infoPemohon = buildKeyedEntries([detailRow?.data_pemohon, detailRow], [
    { keys: ['nama_lengkap', 'nama_pemohon'] },
    { keys: ['nik'] },
    { keys: ['no_hp', 'nomor_hp'] },
    { keys: ['email'] },
    { keys: ['alamat'] },
    { keys: ['tempat_lahir'] },
    { keys: ['tanggal_lahir'] },
    { keys: ['jenis_kelamin'] },
    { keys: ['pekerjaan'] },
    { keys: ['agama'] },
    { keys: ['status_perkawinan'] },
    { keys: ['kewarganegaraan'] },
  ])
  const detailLayanan = collectRemainingEntries(
    { ...(detailRow?.data_pengajuan || {}), ...(detailRow?.detail_pengajuan || {}) },
    DETAIL_EXCLUDED_KEYS
  )

  useEffect(() => {
    if (!detailRow) return
    dokumenItems.forEach((dokumen) => {
      if (!dokumen.url && dokumen.uploaded) {
        console.info('[KepalaCamat] Dokumen terdeteksi tetapi link file belum ditemukan pada detail laporan.', {
          nomor_pengajuan: detailRow?.nomor_pengajuan || detailRow?.id_pengajuan || detailRow?.id || null,
          dokumen: dokumen.label,
        })
      }
    })
  }, [detailRow, dokumenItems])

  if (!detailRow) return null

  return (
    <div className="ptg-modalOverlay" role="presentation" onMouseDown={onClose}>
      <section
        className="ptg-modal kcm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Detail pengajuan"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ptg-modalHead">
          <h3>Detail Pengajuan</h3>
          <button type="button" className="ptg-modalClose" onClick={onClose}>
            Kembali
          </button>
        </div>

        <div className="ptg-modalBody">
          {loading ? <div className="kcm-empty">Memuat detail laporan...</div> : null}
          {error ? (
            <div className="kcm-emptyState is-compact">
              <div>
                <strong>Detail belum dapat dimuat.</strong>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="kcm-detailLayout">
            <DetailSection title="Informasi Pengajuan" entries={infoPengajuan} />
            <DetailSection title="Informasi Pemohon" entries={infoPemohon} />
            <DetailSection title="Detail Layanan" entries={detailLayanan}>
              {detailLayanan.length === 0 ? <p className="kcm-detailEmpty">Belum ada detail layanan tambahan.</p> : null}
            </DetailSection>

            <DetailSection title="Dokumen Pendukung" entries={null}>
              {dokumenItems.length > 0 ? (
                <div className="kcm-docList">
                  {dokumenItems.map((dokumen) => (
                    <div key={dokumen.id} className="kcm-docItem">
                      <div className="kcm-docMeta">
                        <strong>{dokumen.label}</strong>
                        <span>{dokumen.filename || 'Dokumen tersedia'}</span>
                        <span className={`kcm-docStatus ${dokumen.uploaded ? 'is-uploaded' : ''}`}>
                          {dokumen.uploaded ? 'Sudah diunggah' : 'Belum diunggah'}
                        </span>
                      </div>
                      {dokumen.url ? (
                        <a className="kcm-outlineBtn" href={dokumen.url} target="_blank" rel="noreferrer">
                          Lihat Dokumen
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="kcm-detailEmpty">Tidak ada dokumen pendukung.</p>
              )}
            </DetailSection>
          </div>
        </div>

      </section>
    </div>
  )
}
