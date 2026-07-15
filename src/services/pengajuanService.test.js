import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}))

vi.mock('./api', () => ({
  apiRequest: apiRequestMock,
}))

import {
  buildFileUrl,
  createPengajuan,
  createPengajuanWithDokumen,
  deleteSuratHasilPengajuan,
  getPengajuanStatusKind,
  normalizePengajuan,
  normalizePengajuanStatus,
  updateStatusPengajuanPetugas,
  uploadDokumenPengajuan,
  uploadSuratHasilPengajuan,
} from './pengajuanService'

describe('normalisasi detail pengajuan', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('membaca status dan metadata surat hasil dari field backend terbaru', () => {
    vi.stubEnv('VITE_API_URL', 'https://anisa-rahma-fitri.alwaysdata.net/api')

    expect(normalizePengajuan({
      id_pengajuan: 44,
      id_user: 17,
      status: 'Diproses',
      file_surat_hasil: '/uploads/surat-hasil/file.pdf',
      nama_file_surat_hasil: 'Surat Kerja.pdf',
    })).toMatchObject({
      id: 44,
      idUser: 17,
      status: 'Diproses',
      suratHasil: {
        path: '/uploads/surat-hasil/file.pdf',
        namaFile: 'Surat Kerja.pdf',
        url: 'https://anisa-rahma-fitri.alwaysdata.net/uploads/surat-hasil/file.pdf',
      },
    })
  })

  it('menggabungkan path relatif dengan origin backend tanpa /api', () => {
    vi.stubEnv('VITE_API_URL', 'https://anisa-rahma-fitri.alwaysdata.net/api')
    expect(buildFileUrl('/uploads/surat-hasil/file.pdf')).toBe(
      'https://anisa-rahma-fitri.alwaysdata.net/uploads/surat-hasil/file.pdf'
    )
  })

  it.each([
    'https://cdn.example.test/surat.pdf',
    'http://cdn.example.test/surat.pdf',
  ])('tidak mengubah URL absolut %s', (url) => {
    expect(buildFileUrl(url)).toBe(url)
  })
})

describe('status pengajuan', () => {
  it.each([
    ['Menunggu', 'Menunggu Verifikasi', 'menunggu'],
    ['pending', 'Menunggu Verifikasi', 'menunggu'],
    ['Diproses', 'Diproses', 'diproses'],
    ['dalam proses', 'Diproses', 'diproses'],
    ['Selesai', 'Selesai', 'selesai'],
    ['Disetujui', 'Selesai', 'selesai'],
    ['diterima', 'Selesai', 'selesai'],
    ['Ditolak', 'Ditolak', 'ditolak'],
    ['rejected', 'Ditolak', 'ditolak'],
  ])('menormalisasi "%s"', (input, normalized, kind) => {
    expect(normalizePengajuanStatus(input)).toBe(normalized)
    expect(getPengajuanStatusKind(input)).toBe(kind)
  })
})

describe('API pengajuan', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('membuat pengajuan melalui endpoint layanan yang benar', async () => {
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: { message: 'Dibuat', data: { id_pengajuan: 42 } },
    })

    const result = await createPengajuan({
      serviceKey: 'rekomendasi_penelitian',
      data: { nik: '1234567890123456' },
    })

    expect(result).toMatchObject({ success: true, status: 201, id: '42', message: 'Dibuat' })
    expect(apiRequestMock).toHaveBeenCalledWith('/api/rekomendasi_penelitian', {
      method: 'POST',
      body: expect.objectContaining({ serviceKey: 'rekomendasi_penelitian', nik: '1234567890123456' }),
      withAuth: true,
    })
  })

  it.each([400, 401, 403, 500])('meneruskan error HTTP %s saat create', async (status) => {
    apiRequestMock.mockResolvedValue({
      ok: false,
      status,
      data: { message: `Error ${status}`, errors: [`Detail ${status}`] },
    })

    await expect(createPengajuan({ serviceKey: 'rekomendasi_penelitian' })).resolves.toEqual({
      success: false,
      status,
      message: `Error ${status}`,
      errors: [`Detail ${status}`],
    })
  })

  it('menolak create jika endpoint tidak dikenali tanpa request API', async () => {
    await expect(createPengajuan({ jenis_layanan: 'Tidak dikenal' })).resolves.toMatchObject({
      success: false,
      status: 400,
    })
    expect(apiRequestMock).not.toHaveBeenCalled()
  })

  it('mengunggah dokumen dengan payload FormData mock', async () => {
    const formData = new FormData()
    formData.append('ktp', new File(['ktp'], 'ktp.pdf', { type: 'application/pdf' }))
    apiRequestMock.mockResolvedValue({ ok: true, status: 201, data: { message: 'Upload berhasil' } })

    await expect(uploadDokumenPengajuan('/api/rekomendasi_penelitian', 'ID 1', formData))
      .resolves.toMatchObject({ success: true, status: 201, message: 'Upload berhasil' })
    expect(apiRequestMock).toHaveBeenCalledWith('/api/rekomendasi_penelitian/ID%201/dokumen', {
      method: 'POST',
      body: formData,
      withAuth: true,
    })
  })

  it('mengunggah surat hasil dengan field surat_hasil', async () => {
    const file = new File(['surat'], 'surat.pdf', { type: 'application/pdf' })
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { success: true, message: 'Surat hasil berhasil diunggah', data: null },
    })

    await expect(uploadSuratHasilPengajuan('/api/rekomendasi_surat_kerja', '44', file))
      .resolves.toMatchObject({ success: true, message: 'Surat hasil berhasil diunggah' })

    const requestOptions = apiRequestMock.mock.calls[0][1]
    expect(apiRequestMock.mock.calls[0][0]).toBe('/api/rekomendasi_surat_kerja/44/surat-hasil')
    expect(requestOptions).toMatchObject({ method: 'POST', withAuth: true })
    expect(requestOptions.body).toBeInstanceOf(FormData)
    expect(requestOptions.body.get('surat_hasil')).toBe(file)
  })

  it('memperbarui status melalui endpoint status dan payload backend terbaru', async () => {
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { success: true, message: 'Status diperbarui', data: null },
    })

    await expect(updateStatusPengajuanPetugas(
      '/api/rekomendasi_surat_kerja',
      '44',
      'Selesai',
      'Sudah diverifikasi'
    )).resolves.toMatchObject({ success: true, message: 'Status diperbarui' })

    expect(apiRequestMock).toHaveBeenCalledWith('/api/rekomendasi_surat_kerja/44/status', {
      method: 'PATCH',
      body: {
        status: 'Selesai',
        status_pengajuan: 'Selesai',
        catatan_petugas: 'Sudah diverifikasi',
      },
      withAuth: true,
    })
  })

  it('menghapus surat hasil melalui endpoint yang sama', async () => {
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { success: true, message: 'Surat hasil berhasil dihapus', data: null },
    })

    await expect(deleteSuratHasilPengajuan('/api/rekomendasi_surat_kerja', '44'))
      .resolves.toMatchObject({ success: true, message: 'Surat hasil berhasil dihapus' })
    expect(apiRequestMock).toHaveBeenCalledWith('/api/rekomendasi_surat_kerja/44/surat-hasil', {
      method: 'DELETE',
      withAuth: true,
    })
  })

  it.each([400, 401, 403, 500])('meneruskan error HTTP %s saat upload', async (status) => {
    apiRequestMock.mockResolvedValue({
      ok: false,
      status,
      data: { message: `Upload ${status}`, errors: [`Dokumen ${status}`] },
    })

    await expect(uploadDokumenPengajuan('/api/rekomendasi_penelitian', '42', new FormData()))
      .resolves.toEqual({
        success: false,
        status,
        message: `Upload ${status}`,
        errors: [`Dokumen ${status}`],
      })
  })

  it('menghentikan alur create+upload jika response tidak memiliki id_pengajuan', async () => {
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 201,
      data: { message: 'Dibuat tanpa ID' },
    })

    await expect(createPengajuanWithDokumen({
      endpoint: '/api/rekomendasi_penelitian',
      serviceKey: 'rekomendasi_penelitian',
      dokumen: { ktp: new File(['ktp'], 'ktp.pdf', { type: 'application/pdf' }) },
    })).resolves.toMatchObject({
      success: false,
      status: 500,
      message: 'ID pengajuan tidak ditemukan dari response backend.',
    })
    expect(apiRequestMock).toHaveBeenCalledTimes(1)
  })
})
