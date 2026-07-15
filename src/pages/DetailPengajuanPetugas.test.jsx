import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getDetailPengajuanMock,
  getSemuaPengajuanPetugasMock,
  uploadSuratHasilPengajuanMock,
} = vi.hoisted(() => ({
  getDetailPengajuanMock: vi.fn(),
  getSemuaPengajuanPetugasMock: vi.fn(),
  uploadSuratHasilPengajuanMock: vi.fn(),
}))

vi.mock('../components/SidebarPetugas', () => ({ default: () => <aside>Sidebar Petugas</aside> }))
vi.mock('../components/PetugasAvatar', () => ({ default: () => <div>Avatar Petugas</div> }))
vi.mock('../lib/rkLocal', () => ({ getAuth: () => ({ role: 'petugas', name: 'Petugas' }) }))
vi.mock('../services/pengajuanService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getDetailPengajuan: getDetailPengajuanMock,
    getSemuaPengajuanPetugas: getSemuaPengajuanPetugasMock,
    uploadSuratHasilPengajuan: uploadSuratHasilPengajuanMock,
  }
})

import DetailPengajuanPetugas from './DetailPengajuanPetugas'

const submission = {
  id_pengajuan: 44,
  id_user: 17,
  nama_pemohon: 'Widyap',
  status: 'Selesai',
  jenis_layanan: 'Rekomendasi Kerja',
  __endpoint: '/api/rekomendasi_surat_kerja',
  created_at: '2026-07-13T07:55:35.000Z',
  updated_at: '2026-07-13T07:58:47.000Z',
  file_surat_hasil: 'https://backend.example.test/uploads/surat-hasil/surat-44.pdf',
  nama_file_surat_hasil: 'Surat Kerja 44.pdf',
}

function renderPage(pageSubmission = submission) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/petugas/pengajuan/44', state: { submission: pageSubmission, endpoint: pageSubmission.__endpoint } }]}>
      <Routes>
        <Route path="/petugas/pengajuan/:id" element={<DetailPengajuanPetugas />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('surat hasil petugas', () => {
  beforeEach(() => {
    getDetailPengajuanMock.mockReset()
    getSemuaPengajuanPetugasMock.mockReset()
    uploadSuratHasilPengajuanMock.mockReset()
    getDetailPengajuanMock.mockResolvedValue({ success: true, data: submission })
    uploadSuratHasilPengajuanMock.mockResolvedValue({
      success: true,
      message: 'Surat hasil berhasil diunggah',
      data: null,
    })
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  it('menampilkan Lihat, Ganti, dan Hapus ketika surat hasil tersedia', async () => {
    renderPage()

    expect(await screen.findByRole('button', { name: 'Lihat Surat' })).toHaveClass('btn-lihat-surat')
    expect(screen.getByText('Ganti Surat').closest('label')).toHaveClass('btn-ganti-surat')
    expect(screen.getByRole('button', { name: 'Hapus Surat' })).toHaveClass('btn-hapus-surat')
    expect(screen.getByText(/Format: PDF, JPG, JPEG, PNG/i)).toBeInTheDocument()
    expect(screen.getByText('Surat hasil sudah diunggah')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload Surat Hasil' })).not.toBeInTheDocument()
    expect(getSemuaPengajuanPetugasMock).not.toHaveBeenCalled()
  })

  it('menampilkan upload disabled ketika belum ada surat dan belum memilih file', async () => {
    const withoutSurat = {
      ...submission,
      file_surat_hasil: null,
      nama_file_surat_hasil: null,
    }
    getDetailPengajuanMock.mockResolvedValue({ success: true, data: withoutSurat })

    renderPage(withoutSurat)

    expect(await screen.findByText('Belum ada surat hasil')).toBeInTheDocument()
    expect(screen.getByText('Pilih Surat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload Surat Hasil' })).toBeDisabled()
  })

  it('menolak file lebih dari 5 MB', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Lihat Surat' })

    const fileInput = document.getElementById('ptg-upload-surat-hasil')
    const oversizedFile = new File([new Uint8Array((5 * 1024 * 1024) + 1)], 'terlalu-besar.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } })

    expect(await screen.findByText('Ukuran file terlalu besar. Maksimal ukuran file 5 MB.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload Surat Baru' })).not.toBeInTheDocument()
  })

  it('menolak format file selain PDF, JPG, JPEG, atau PNG', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Lihat Surat' })

    const fileInput = document.getElementById('ptg-upload-surat-hasil')
    const invalidFile = new File(['dokumen'], 'dokumen.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    expect(await screen.findByText('Format file tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upload Surat Baru' })).not.toBeInTheDocument()
  })

  it('memanggil ulang GET detail setelah upload berhasil', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Lihat Surat' })

    const fileInput = document.getElementById('ptg-upload-surat-hasil')
    const replacement = new File(['surat baru'], 'surat-baru.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [replacement] } })
    fireEvent.click(screen.getByRole('button', { name: 'Upload Surat Baru' }))

    await waitFor(() => expect(uploadSuratHasilPengajuanMock).toHaveBeenCalledWith(
      '/api/rekomendasi_surat_kerja',
      '44',
      replacement
    ))
    await waitFor(() => expect(getDetailPengajuanMock).toHaveBeenCalledTimes(2))
  })
})
