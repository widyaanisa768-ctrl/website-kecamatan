import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getDetailPengajuanMock, getPengajuanSayaMock } = vi.hoisted(() => ({
  getDetailPengajuanMock: vi.fn(),
  getPengajuanSayaMock: vi.fn(),
}))

vi.mock('../lib/rkLocal', () => ({
  getAuth: () => ({ role: 'masyarakat' }),
}))

vi.mock('../services/pengajuanService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getDetailPengajuan: getDetailPengajuanMock,
    getPengajuanSaya: getPengajuanSayaMock,
  }
})

import PengajuanSaya from './PengajuanSaya'

function renderStatus(item) {
  getPengajuanSayaMock.mockResolvedValue({ success: true, items: [item] })
  window.localStorage.setItem('accessToken', 'token-masyarakat')
  window.localStorage.setItem('role', 'masyarakat')
  window.localStorage.setItem('user', JSON.stringify({ id: 17, role: 'masyarakat' }))

  return render(
    <MemoryRouter>
      <PengajuanSaya variant="status" />
    </MemoryRouter>
  )
}

const baseItem = {
  id_pengajuan: 44,
  id_user: 17,
  nama_pemohon: 'Widyap',
  jenis_layanan: 'Rekomendasi Kerja',
  __endpoint: '/api/rekomendasi_surat_kerja',
  created_at: '2026-07-13T07:55:35.000Z',
  file_surat_hasil: '/uploads/surat-hasil/surat-44.pdf',
  nama_file_surat_hasil: 'Surat Kerja 44.pdf',
  suratHasil: {
    path: '/uploads/surat-hasil/surat-44.pdf',
    namaFile: 'Surat Kerja 44.pdf',
    url: 'https://backend.example.test/uploads/surat-hasil/surat-44.pdf',
  },
}

describe('surat hasil masyarakat', () => {
  beforeEach(() => {
    getPengajuanSayaMock.mockReset()
    getDetailPengajuanMock.mockReset()
    getDetailPengajuanMock.mockImplementation(async (_id, item) => ({ success: true, data: item }))
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.stubEnv('VITE_API_URL', 'https://backend.example.test/api')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('menampilkan surat hanya di modal detail saat status Selesai', async () => {
    renderStatus({ ...baseItem, status: 'Selesai' })

    expect(await screen.findByText('Surat hasil tersedia di detail pengajuan.')).toBeInTheDocument()
    expect(screen.queryByText('Surat hasil sudah tersedia')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Lihat Surat/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Unduh Surat/i })).not.toBeInTheDocument()
    expect(screen.queryByText('/uploads/surat-hasil/surat-44.pdf')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Detail' }))

    expect(await screen.findByText('Surat hasil sudah tersedia')).toBeInTheDocument()
    expect(screen.getByText('Surat Kerja 44.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lihat Surat/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unduh Surat/i })).toBeInTheDocument()
  })

  it('menyembunyikan tombol surat sebelum status Selesai', async () => {
    renderStatus({ ...baseItem, status: 'Diproses' })

    await screen.findByRole('button', { name: 'Detail' })
    expect(screen.queryByText(/surat hasil sudah tersimpan, tetapi pengajuan belum selesai diverifikasi/i))
      .not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Detail' }))
    expect(await screen.findByText(/surat hasil sudah tersimpan, tetapi pengajuan belum selesai diverifikasi/i))
      .toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Lihat Surat/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Unduh Surat/i })).not.toBeInTheDocument()
    })
  })
})
