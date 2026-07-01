import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DetailPengajuanKepalaCamatModal from '../components/DetailPengajuanKepalaCamatModal'
import DashboardKepalaCamat from './DashboardKepalaCamat'
import LaporanKepalaCamat from './LaporanKepalaCamat'
import { getKepalaCamatDashboard, getKepalaCamatLaporan, getKepalaCamatLaporanDetail } from '../services/kepalaCamatService'

vi.mock('../services/authService', () => ({
  clearAuthArtifacts: vi.fn(),
  logout: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('../services/kepalaCamatService', () => ({
  getKepalaCamatDashboard: vi.fn(),
  getKepalaCamatLaporan: vi.fn(),
  getKepalaCamatLaporanDetail: vi.fn(),
}))

const dashboardData = {
  total_pengajuan: 2,
  rekap_status: {
    menunggu_verifikasi: 1,
    verifikasi: 0,
    diproses: 1,
    selesai: 0,
    ditolak: 0,
  },
  rekap_layanan: [{ layanan: 'rekomendasi_surat_kerja', jenis_layanan: 'Rekomendasi Kerja', total_pengajuan: 2 }],
  daftar_pengajuan: [
    {
      id: 'KR-002',
      id_pengajuan: 'KR-002',
      nomor_pengajuan: 'KR-002',
      layanan: 'rekomendasi_surat_pindah',
      jenis_layanan: 'Rekomendasi Surat Pindah yang Memiliki Nama Cukup Panjang',
      nama_pemohon: 'Siti Aminah',
      tanggal_pengajuan: '2026-06-24T03:00:00.000Z',
      status: 'Diproses',
    },
    {
      id: 'KR-001',
      id_pengajuan: 'KR-001',
      nomor_pengajuan: 'KR-001',
      layanan: 'rekomendasi_surat_kerja',
      jenis_layanan: 'Rekomendasi Kerja',
      nama_pemohon: 'Budi Santoso',
      tanggal_pengajuan: '2026-06-23T03:00:00.000Z',
      status: 'Menunggu Verifikasi',
    },
  ],
}

function seedKepalaCamat() {
  const auth = {
    role: 'kepala_camat',
    name: 'Kepala Camat',
    unit: 'Kecamatan Rantau Kopar',
  }
  window.localStorage.setItem('rk_auth', JSON.stringify(auth))
  window.localStorage.setItem('user', JSON.stringify(auth))
  window.localStorage.setItem('role', 'kepala_camat')
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardKepalaCamat />
    </MemoryRouter>
  )
}

function renderLaporan() {
  return render(
    <MemoryRouter>
      <LaporanKepalaCamat />
    </MemoryRouter>
  )
}

describe('DashboardKepalaCamat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seedKepalaCamat()
    getKepalaCamatDashboard.mockResolvedValue({ success: true, data: dashboardData })
    getKepalaCamatLaporan.mockResolvedValue({ success: true, data: dashboardData })
    getKepalaCamatLaporanDetail.mockResolvedValue({
      success: true,
      data: {
        ...dashboardData.daftar_pengajuan[1],
        data_pemohon: {
          nama_lengkap: 'Budi Santoso',
          nik: '1400000000000001',
          no_hp: '081234567890',
          alamat: 'Rantau Kopar',
        },
        data_pengajuan: {
          keperluan: 'Melamar pekerjaan',
          file_path: '/uploads/internal-path.pdf',
          original_name: 'internal-path.pdf',
        },
        dokumen: {
          ktp: {
            file_path: '/uploads/ktp-budi.pdf',
            original_name: 'ktp-budi.pdf',
          },
        },
      },
    })
  })

  it('menampilkan tabel terbaru tanpa kolom aksi dan statistik sesuai data', async () => {
    renderDashboard()

    expect(await screen.findByText('KR-002')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /aksi/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /kr-002/i })).not.toBeInTheDocument()
    expect(screen.getByText('KR-002')).toBeInTheDocument()
    expect(screen.getAllByText('Menunggu Verifikasi').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(
      expect.arrayContaining(['Kode Pengajuan', 'Layanan', 'Pemohon', 'Tanggal', 'Status'])
    )

    const stats = screen.getByLabelText('Statistik pengajuan')
    expect(within(stats).getByText('Total Pengajuan').closest('article')).toHaveTextContent('2')
    expect(within(stats).getByText('Menunggu Verifikasi').closest('article')).toHaveTextContent('1')
    expect(within(stats).getByText('Diproses').closest('article')).toHaveTextContent('1')
    expect(within(stats).getByText('Selesai').closest('article')).toHaveTextContent('0')
    expect(within(stats).getByText('Ditolak').closest('article')).toHaveTextContent('0')
  })

  it('membuka detail read-only dari kode pengajuan', async () => {
    const user = userEvent.setup()
    renderDashboard()

    const detailButtons = await screen.findAllByRole('button', { name: /lihat detail pengajuan/i })
    await user.click(detailButtons[1])

    await waitFor(() => expect(getKepalaCamatLaporanDetail).toHaveBeenCalledWith('rekomendasi_surat_kerja', 'KR-001'))
    expect(await screen.findByRole('dialog', { name: /detail pengajuan/i })).toBeInTheDocument()
    expect(screen.queryByText(/ubah status/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/simpan perubahan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/upload surat hasil/i)).not.toBeInTheDocument()
  })
})

describe('LaporanKepalaCamat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    seedKepalaCamat()
    getKepalaCamatDashboard.mockResolvedValue({ success: true, data: dashboardData })
    getKepalaCamatLaporan.mockResolvedValue({ success: true, data: dashboardData })
    getKepalaCamatLaporanDetail.mockResolvedValue({
      success: true,
      data: dashboardData.daftar_pengajuan[0],
    })
  })

  it('menampilkan kode pengajuan sebagai teks dengan tombol detail tanpa kolom aksi', async () => {
    const user = userEvent.setup()
    renderLaporan()

    expect(await screen.findByText('KR-002')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /aksi/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /kr-002/i })).not.toBeInTheDocument()
    expect(screen.getAllByText('Menunggu Verifikasi').length).toBeGreaterThan(0)

    const detailButtons = screen.getAllByRole('button', { name: /lihat detail pengajuan/i })
    await user.click(detailButtons[0])

    await waitFor(() => expect(getKepalaCamatLaporanDetail).toHaveBeenCalled())
  })
})

describe('DetailPengajuanKepalaCamatModal', () => {
  it('tidak menampilkan dokumen belum diunggah saat detail masih loading', () => {
    render(
      <DetailPengajuanKepalaCamatModal
        loading
        row={{
          nomor_pengajuan: 'KR-003',
          jenis_layanan: 'Rekomendasi Kerja',
          status: 'Menunggu Verifikasi',
          dokumen: {},
        }}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Memuat detail laporan...')).toBeInTheDocument()
    expect(screen.queryByText('Belum diunggah')).not.toBeInTheDocument()
  })

  it('menampilkan detail dan dokumen secara read-only tanpa metadata teknis', () => {
    render(
      <DetailPengajuanKepalaCamatModal
        row={{
          nomor_pengajuan: 'KR-004',
          jenis_layanan: 'Rekomendasi Kerja',
          tanggal_pengajuan: '2026-06-24T03:00:00.000Z',
          status: 'Selesai',
          data_pemohon: {
            nama_lengkap: 'Budi Santoso',
            nik: '1400000000000001',
          },
          data_pengajuan: {
            keperluan: 'Melamar pekerjaan',
            file_path: '/uploads/internal-path.pdf',
            original_name: 'internal-path.pdf',
            filename: 'internal-path.pdf',
          },
          dokumen: {
            ktp: {
              file_path: '/uploads/ktp-budi.pdf',
              original_name: 'ktp-budi.pdf',
            },
          },
        }}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Fotokopi KTP')).toBeInTheDocument()
    expect(screen.getByText('ktp-budi.pdf')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /lihat dokumen/i })).toBeInTheDocument()
    expect(screen.queryByText('File Path')).not.toBeInTheDocument()
    expect(screen.queryByText('Original Name')).not.toBeInTheDocument()
    expect(screen.queryByText('Filename')).not.toBeInTheDocument()
    expect(screen.queryByText('/uploads/internal-path.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/hapus/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/upload surat hasil/i)).not.toBeInTheDocument()
  })

  it('menampilkan empty state dokumen dan surat hasil tanpa nilai null', () => {
    render(
      <DetailPengajuanKepalaCamatModal
        row={{
          nomor_pengajuan: 'KR-005',
          nama_pemohon: 'Siti Aminah',
          jenis_layanan: 'Rekomendasi Kerja',
          tanggal_pengajuan: '2026-06-24T03:00:00.000Z',
          status: 'Menunggu Verifikasi',
          catatan_petugas: null,
          daftar_dokumen: [],
          dokumen: {},
          file_surat_hasil: null,
        }}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Dokumen belum tersedia')).toBeInTheDocument()
    expect(screen.getByText('Surat hasil belum tersedia')).toBeInTheDocument()
    expect(screen.queryByText('null')).not.toBeInTheDocument()
    expect(screen.queryByText('undefined')).not.toBeInTheDocument()
  })
})
