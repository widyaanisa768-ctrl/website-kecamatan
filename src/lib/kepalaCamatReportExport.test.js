import * as XLSX from 'xlsx-js-style'
import { describe, expect, it } from 'vitest'
import {
  REPORT_TITLE,
  createKepalaCamatReportWorkbook,
  exportKepalaCamatReportExcel,
} from './kepalaCamatReportExport'

const rows = [
  {
    nomor_pengajuan: 'KR-001',
    nama_pemohon: 'Budi Santoso',
    jenis_layanan: 'Rekomendasi Kerja',
    tanggal_pengajuan: '2026-07-01T03:00:00.000Z',
    status: 'Menunggu Verifikasi',
    catatan_petugas: 'Perlu pemeriksaan berkas',
  },
]

describe('kepalaCamatReportExport', () => {
  it('membuat workbook Rekapitulasi yang dapat diparse kembali', () => {
    const workbook = createKepalaCamatReportWorkbook({
      rows,
      filtersText: 'Status: Menunggu Verifikasi',
      printedAtText: '01 Juli 2026 15.00',
    })
    expect(workbook.Sheets.Rekapitulasi.A1.s.font.bold).toBe(true)
    expect(workbook.Sheets.Rekapitulasi.A1.s.alignment.horizontal).toBe('center')
    expect(workbook.Sheets.Rekapitulasi.A12.s.font.bold).toBe(true)
    expect(workbook.Sheets.Rekapitulasi.A12.s.alignment.wrapText).toBe(true)
    expect(workbook.Sheets.Rekapitulasi.B6.s.fill.fgColor.rgb).toBe('DCEBFF')
    expect(workbook.Sheets.Rekapitulasi.B10.s.fill.fgColor.rgb).toBe('FCE2E2')
    const arrayBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true,
      cellStyles: true,
    })
    const parsed = XLSX.read(arrayBuffer, { type: 'array' })
    const sheet = parsed.Sheets.Rekapitulasi
    const values = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    expect(parsed.SheetNames).toContain('Rekapitulasi')
    expect(values[0][0]).toBe(REPORT_TITLE)
    expect(values[6][0]).toBe('Menunggu Verifikasi')
    expect(values[11]).toEqual([
      'No',
      'Kode Pengajuan',
      'Nama Pemohon',
      'Jenis Layanan',
      'Tanggal Pengajuan',
      'Status',
      'Catatan Petugas',
    ])
    expect(values[12]).toEqual([
      1,
      'KR-001',
      'Budi Santoso',
      'Rekomendasi Kerja',
      '01 Jul 2026',
      'Menunggu Verifikasi',
      'Perlu pemeriksaan berkas',
    ])
  })

  it('export mengembalikan blob xlsx berisi data laporan', async () => {
    const result = await exportKepalaCamatReportExcel({
      rows,
      filtersText: 'Semua data',
      printedAtText: '01 Juli 2026 15.00',
    })
    const parsed = XLSX.read(result.arrayBuffer, { type: 'array' })
    const values = XLSX.utils.sheet_to_json(parsed.Sheets.Rekapitulasi, { header: 1 })

    expect(result.filename).toMatch(/^Laporan-Rekapitulasi-Kecamatan-Rantau-Kopar-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(result.blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(values[0][0]).toBe(REPORT_TITLE)
    expect(values[12][1]).toBe('KR-001')
  })
})
