import { describe, expect, it } from 'vitest'
import { DOKUMEN_CONFIGS } from './pengajuanDokumenConfig'
import { normalizePengajuanDokumenPersyaratan } from './pengajuanDokumenView'

describe('normalizePengajuanDokumenPersyaratan', () => {
  it('menampilkan hanya dokumen resmi Rekomendasi Kerja dan mengabaikan metadata teknis', () => {
    const result = normalizePengajuanDokumenPersyaratan({
      jenis_layanan: 'Rekomendasi Kerja',
      dokumen: {
        ktp: {
          file_path: '/uploads/ktp-pemohon.pdf',
          original_name: 'ktp-pemohon.pdf',
          filename: 'ktp-pemohon.pdf',
        },
      },
      file_path: '/uploads/metadata-yang-tidak-boleh-jadi-dokumen.pdf',
      original_name: 'metadata-yang-tidak-boleh-jadi-dokumen.pdf',
      filename: 'metadata-yang-tidak-boleh-jadi-dokumen.pdf',
      path: '/uploads/path-teknis.pdf',
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      label: 'Fotokopi KTP',
      filename: 'ktp-pemohon.pdf',
      uploaded: true,
    })
    expect(result.map((entry) => entry.label)).not.toContain('File Path')
    expect(result.map((entry) => entry.label)).not.toContain('Original Name')
    expect(result.map((entry) => entry.label)).not.toContain('Filename')
    expect(result.map((entry) => entry.label)).not.toContain('Path')
  })

  it('tetap menampilkan dokumen wajib yang belum diunggah pada label resmi', () => {
    const result = normalizePengajuanDokumenPersyaratan({
      jenis_layanan: 'Rekomendasi Kerja',
      dokumen: {},
    })

    expect(result).toEqual([
      expect.objectContaining({
        label: 'Fotokopi KTP',
        uploaded: false,
        filename: 'Belum diunggah',
      }),
    ])
  })

  it.each(DOKUMEN_CONFIGS)('mengikuti konfigurasi resmi untuk %s', (config) => {
    const dokumen = Object.fromEntries(
      config.fields.map((field) => [
        field.backendKey || field.key,
        {
          file_path: `/uploads/${field.backendKey || field.key}.pdf`,
          original_name: `${field.backendKey || field.key}.pdf`,
        },
      ])
    )

    const result = normalizePengajuanDokumenPersyaratan({
      serviceKey: config.key,
      jenis_layanan: config.labels[0],
      dokumen,
      file_path: '/uploads/root-file-path.pdf',
      original_name: 'root-original-name.pdf',
      filename: 'root-filename.pdf',
      path: '/uploads/root-path.pdf',
    })

    expect(result.map((entry) => entry.label)).toEqual(config.fields.map((field) => field.label))
    expect(result).toHaveLength(config.fields.length)
    expect(result.every((entry) => entry.uploaded)).toBe(true)
    expect(result.map((entry) => entry.label)).not.toEqual(expect.arrayContaining(['File Path', 'Original Name', 'Filename', 'Path']))
  })
})
