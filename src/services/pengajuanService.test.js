import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}))

vi.mock('./api', () => ({
  apiRequest: apiRequestMock,
}))

import {
  createPengajuan,
  createPengajuanWithDokumen,
  getPengajuanStatusKind,
  normalizePengajuanStatus,
  uploadDokumenPengajuan,
} from './pengajuanService'

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
