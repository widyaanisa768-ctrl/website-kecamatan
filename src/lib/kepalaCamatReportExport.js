import * as XLSX from 'xlsx-js-style'
import { getPengajuanCreatedAt, getPengajuanId, getPengajuanLayanan, getPengajuanNamaPemohon, getPengajuanStatusKind } from '../services/pengajuanService'

const REPORT_TITLE = 'Laporan Rekapitulasi Pelayanan Kecamatan Rantau Kopar'
const REPORT_FILE_PREFIX = 'Laporan-Rekapitulasi-Kecamatan-Rantau-Kopar'

function getReportRowData(row) {
  const code = row?.nomor_pengajuan || getPengajuanId(row) || '-'
  const name = row?.nama_pemohon || getPengajuanNamaPemohon(row) || '-'
  const layanan = row?.jenis_layanan || getPengajuanLayanan(row) || '-'
  const tanggal = row?.tanggal_pengajuan || getPengajuanCreatedAt(row) || ''
  const statusKind = getPengajuanStatusKind(row)
  const status =
    statusKind === 'selesai'
      ? 'Selesai'
      : statusKind === 'ditolak'
        ? 'Ditolak'
        : statusKind === 'diproses'
          ? 'Diproses'
          : 'Menunggu Verifikasi'
  const catatan = String(row?.catatan_petugas || row?.catatanPetugas || row?.catatan || '').trim() || '-'

  return { code, name, layanan, tanggal, status, catatan }
}

export function buildReportSummary(rows = []) {
  const summary = {
    total: rows.length,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
    layanan: [],
  }

  const layananCount = new Map()

  rows.forEach((row) => {
    const kind = getPengajuanStatusKind(row)
    if (kind === 'diproses') summary.diproses += 1
    else if (kind === 'selesai') summary.selesai += 1
    else if (kind === 'ditolak') summary.ditolak += 1
    else summary.menunggu += 1

    const layanan = row?.jenis_layanan || getPengajuanLayanan(row) || '-'
    layananCount.set(layanan, (layananCount.get(layanan) || 0) + 1)
  })

  summary.layanan = [...layananCount.entries()]
    .map(([jenis_layanan, total_pengajuan]) => ({ jenis_layanan, total_pengajuan }))
    .sort((a, b) => b.total_pengajuan - a.total_pengajuan || a.jenis_layanan.localeCompare(b.jenis_layanan))

  return summary
}

export function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 0) return []
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}

export function buildReportFilterText({ search = '', statusFilter = 'semua', layananFilter = 'semua', periodeFilter = 'semua', tanggalFilter = '' } = {}) {
  const filters = []
  if (search) filters.push(`Pencarian: ${search}`)
  if (statusFilter !== 'semua') filters.push(`Status: ${statusFilter}`)
  if (layananFilter !== 'semua') filters.push(`Jenis Layanan: ${layananFilter}`)
  if (periodeFilter !== 'semua') {
    if (periodeFilter === 'tanggal' && tanggalFilter) filters.push(`Periode: Tanggal ${tanggalFilter}`)
    else filters.push(`Periode: ${periodeFilter}`)
  }
  return filters.length > 0 ? filters.join(' | ') : 'Semua data'
}

export function buildReportFileName(date = new Date(), ext = 'xlsx') {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${REPORT_FILE_PREFIX}-${year}-${month}-${day}.${ext}`
}

export function getReportExportRows(rows = []) {
  return rows.map((row, index) => {
    const data = getReportRowData(row)
    return {
      no: index + 1,
      ...data,
    }
  })
}

function formatTanggalExcel(date) {
  if (!date) return '-'
  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return '-'
  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function borderStyle(color = 'D9E2F1') {
  return {
    top: { style: 'thin', color: { rgb: color } },
    bottom: { style: 'thin', color: { rgb: color } },
    left: { style: 'thin', color: { rgb: color } },
    right: { style: 'thin', color: { rgb: color } },
  }
}

function buildCellStyle({ bold = false, size = 11, color = '102033', fill = null, horizontal = 'left', vertical = 'center', wrapText = false, border = true } = {}) {
  return {
    font: {
      name: 'Calibri',
      sz: size,
      bold,
      color: { rgb: color },
    },
    alignment: {
      horizontal,
      vertical,
      wrapText,
    },
    border: border ? borderStyle() : undefined,
    fill: fill
      ? {
          patternType: 'solid',
          fgColor: { rgb: fill },
        }
      : undefined,
  }
}

function applyCellStyle(ws, ref, style) {
  if (!ws[ref]) return
  ws[ref].s = style
}

function applyRangeStyle(ws, refs, style) {
  refs.forEach((ref) => applyCellStyle(ws, ref, style))
}

function autoRowHeight(text, base = 22, lineWidth = 28) {
  const lines = Math.max(1, Math.ceil(String(text || '').length / lineWidth))
  return Math.max(base, 18 * lines)
}

export function createKepalaCamatReportWorkbook({
  rows = [],
  filtersText = 'Semua data',
  printedAtText = '',
} = {}) {
  const summary = buildReportSummary(rows)
  const exportRows = getReportExportRows(rows)
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet([
    [REPORT_TITLE, '', '', '', '', '', ''],
    [],
    ['Tanggal cetak', printedAtText, '', '', '', '', ''],
    ['Filter aktif', filtersText, '', '', '', '', ''],
    [],
    ['Total Pengajuan', summary.total, '', '', '', '', ''],
    ['Menunggu Verifikasi', summary.menunggu, '', '', '', '', ''],
    ['Diproses', summary.diproses, '', '', '', '', ''],
    ['Selesai', summary.selesai, '', '', '', '', ''],
    ['Ditolak', summary.ditolak, '', '', '', '', ''],
    [],
    ['No', 'Kode Pengajuan', 'Nama Pemohon', 'Jenis Layanan', 'Tanggal Pengajuan', 'Status', 'Catatan Petugas'],
    ...exportRows.map((row) => [
      row.no,
      row.code,
      row.name,
      row.layanan,
      formatTanggalExcel(row.tanggal),
      row.status,
      row.catatan,
    ]),
  ])

  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 22 },
    { wch: 34 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
  ]
  worksheet['!rows'] = [
    { hpt: 28 },
    { hpt: 8 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 8 },
    { hpt: 26 },
    ...exportRows.map((row) => ({
      hpt: autoRowHeight(`${row.layanan || ''} ${row.catatan || ''}`, 24, 26),
    })),
  ]

  const titleStyle = buildCellStyle({
    bold: true,
    size: 15,
    color: '0B1F44',
    fill: 'EEF4FF',
    horizontal: 'center',
    vertical: 'center',
    wrapText: true,
  })
  const infoLabelStyle = buildCellStyle({ bold: true, color: '102033', fill: 'F7FAFF', horizontal: 'left' })
  const infoValueStyle = buildCellStyle({ color: '102033', fill: 'FFFFFF', horizontal: 'left', wrapText: true })
  const summaryLabelStyle = buildCellStyle({ bold: true, color: '102033', horizontal: 'left' })
  const summaryValueStyle = (fill) =>
    buildCellStyle({
      bold: true,
      color: '0B1F44',
      fill,
      horizontal: 'center',
    })
  const headerStyle = buildCellStyle({
    bold: true,
    color: '0B1F44',
    fill: 'DCE9F9',
    horizontal: 'center',
    wrapText: true,
  })
  const centerDataStyle = buildCellStyle({ color: '102033', horizontal: 'center', vertical: 'center', border: true, wrapText: true })
  const leftDataStyle = buildCellStyle({ color: '102033', horizontal: 'left', vertical: 'center', wrapText: true })

  applyRangeStyle(worksheet, ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'], titleStyle)
  applyCellStyle(worksheet, 'A3', infoLabelStyle)
  applyCellStyle(worksheet, 'B3', infoValueStyle)
  applyCellStyle(worksheet, 'A4', infoLabelStyle)
  applyCellStyle(worksheet, 'B4', infoValueStyle)

  applyCellStyle(worksheet, 'A6', summaryLabelStyle)
  applyCellStyle(worksheet, 'B6', summaryValueStyle('DCEBFF'))
  applyCellStyle(worksheet, 'A7', summaryLabelStyle)
  applyCellStyle(worksheet, 'B7', summaryValueStyle('FFF6CC'))
  applyCellStyle(worksheet, 'A8', summaryLabelStyle)
  applyCellStyle(worksheet, 'B8', summaryValueStyle('DDF7FF'))
  applyCellStyle(worksheet, 'A9', summaryLabelStyle)
  applyCellStyle(worksheet, 'B9', summaryValueStyle('E1F5E8'))
  applyCellStyle(worksheet, 'A10', summaryLabelStyle)
  applyCellStyle(worksheet, 'B10', summaryValueStyle('FCE2E2'))

  applyRangeStyle(worksheet, ['A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12'], headerStyle)

  exportRows.forEach((row, index) => {
    const rowNumber = 13 + index
    applyCellStyle(worksheet, `A${rowNumber}`, centerDataStyle)
    applyCellStyle(worksheet, `B${rowNumber}`, centerDataStyle)
    applyCellStyle(worksheet, `C${rowNumber}`, leftDataStyle)
    applyCellStyle(worksheet, `D${rowNumber}`, leftDataStyle)
    applyCellStyle(worksheet, `E${rowNumber}`, centerDataStyle)
    applyCellStyle(worksheet, `F${rowNumber}`, centerDataStyle)
    applyCellStyle(worksheet, `G${rowNumber}`, leftDataStyle)
  })

  worksheet['!freeze'] = { xSplit: 0, ySplit: 12 }
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi')
  return workbook
}

export async function exportKepalaCamatReportExcel({
  rows = [],
  filtersText = 'Semua data',
  printedAtText = '',
} = {}) {
  const workbook = createKepalaCamatReportWorkbook({ rows, filtersText, printedAtText })
  const arrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
    cellStyles: true,
  })
  const blob = new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const filename = buildReportFileName(new Date(), 'xlsx')

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return { blob, filename, workbook, arrayBuffer }
}

export function downloadBlob(blob, filename) {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export { REPORT_TITLE, REPORT_FILE_PREFIX }
