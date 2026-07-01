import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilKepalaCamat from './ProfilKepalaCamat'
import { deleteAvatar, updateProfile, updateProfileWithAvatar } from '../services/profileService'

vi.mock('../services/authService', () => ({
  clearAuthArtifacts: vi.fn(),
  logout: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('../services/profileService', async () => {
  const actual = await vi.importActual('../services/profileService')
  return {
    ...actual,
    deleteAvatar: vi.fn(),
    updateProfile: vi.fn(),
    updateProfileWithAvatar: vi.fn(),
  }
})

function seedKepalaCamat(overrides = {}) {
  const user = {
    role: 'kepala_camat',
    name: 'Kepala Camat',
    nama: 'Kepala Camat',
    nama_lengkap: 'Kepala Camat',
    username: 'kepala',
    email: 'kepala@example.test',
    no_hp: '081234567890',
    alamat: 'Kantor Camat',
    jabatan: 'Kepala Camat',
    roleLabel: 'Kepala Camat',
    unit: 'Kecamatan Rantau Kopar',
    avatar: '',
    foto: '',
    photo: '',
    foto_profil: '',
    ...overrides,
  }

  window.localStorage.setItem('user', JSON.stringify(user))
  window.localStorage.setItem('rk_auth', JSON.stringify(user))
  window.localStorage.setItem('role', 'kepala_camat')
  return user
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilKepalaCamat />
    </MemoryRouter>
  )
}

describe('ProfilKepalaCamat', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it('saves profile changes through profile service and persists them after remount', async () => {
    seedKepalaCamat()
    updateProfile.mockResolvedValue({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        user: {
          nama_lengkap: 'Camat Baru',
          username: 'kepala',
          email: 'camat.baru@example.test',
          no_hp: '081200000000',
          alamat: 'Alamat Baru',
          role: 'kepala_camat',
        },
      },
    })

    const view = renderPage()

    await userEvent.clear(screen.getByPlaceholderText('Nama lengkap'))
    await userEvent.type(screen.getByPlaceholderText('Nama lengkap'), 'Camat Baru')
    await userEvent.clear(screen.getByPlaceholderText('nama@email.com'))
    await userEvent.type(screen.getByPlaceholderText('nama@email.com'), 'camat.baru@example.test')
    await userEvent.clear(screen.getByPlaceholderText('08xxxxxxxxxx'))
    await userEvent.type(screen.getByPlaceholderText('08xxxxxxxxxx'), '0812-0000-0000')
    await userEvent.clear(screen.getByPlaceholderText('Alamat'))
    await userEvent.type(screen.getByPlaceholderText('Alamat'), 'Alamat Baru')
    await userEvent.click(screen.getByRole('button', { name: /simpan profil/i }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1))
    expect(updateProfile).toHaveBeenCalledWith({
      nama_lengkap: 'Camat Baru',
      username: 'kepala',
      email: 'camat.baru@example.test',
      no_hp: '081200000000',
      alamat: 'Alamat Baru',
      role: 'kepala_camat',
    })
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('nip')
    expect(await screen.findByText('Profil berhasil diperbarui.')).toBeInTheDocument()

    view.unmount()
    renderPage()

    expect(screen.getByPlaceholderText('Nama lengkap')).toHaveValue('Camat Baru')
    expect(screen.getByPlaceholderText('nama@email.com')).toHaveValue('camat.baru@example.test')
    expect(screen.getByPlaceholderText('Alamat')).toHaveValue('Alamat Baru')
  })

  it('uploads a valid avatar with the profile payload and keeps it after remount', async () => {
    seedKepalaCamat()
    updateProfileWithAvatar.mockResolvedValue({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        user: {
          nama_lengkap: 'Kepala Camat',
          username: 'kepala',
          email: 'kepala@example.test',
          no_hp: '081234567890',
          alamat: 'Kantor Camat',
          role: 'kepala_camat',
          avatar: '/uploads/avatar-kc.png',
        },
      },
    })

    const view = renderPage()
    const fileInput = view.container.querySelector('input[type="file"]')
    const file = new File(['avatar'], 'avatar-kc.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [file] } })
    await waitFor(() => expect(screen.queryByText(/format foto/i)).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /simpan profil/i }))

    await waitFor(() => expect(updateProfileWithAvatar).toHaveBeenCalledTimes(1))
    const formData = updateProfileWithAvatar.mock.calls[0][0]
    expect(formData.get('avatar')).toBe(file)
    expect(formData.get('role')).toBe('kepala_camat')
    expect(await screen.findByText('Profil berhasil diperbarui.')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem('rk_auth')).avatar).toContain('/uploads/avatar-kc.png')

    view.unmount()
    const remounted = renderPage()
    expect(remounted.container.querySelectorAll('.kcm-avatar img, .kcm-profilePhoto img').length).toBeGreaterThan(0)
  })

  it('shows one red warning for invalid avatar files and clears it after choosing a valid file', async () => {
    seedKepalaCamat()
    const view = renderPage()
    const fileInput = view.container.querySelector('input[type="file"]')
    const tooLargeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'besar.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [tooLargeFile] } })

    expect(await screen.findByText('Ukuran foto maksimal 2 MB.')).toBeInTheDocument()
    expect(screen.getAllByText('Ukuran foto maksimal 2 MB.')).toHaveLength(1)
    expect(updateProfileWithAvatar).not.toHaveBeenCalled()

    const validFile = new File(['avatar'], 'avatar-kc.webp', { type: 'image/webp' })
    fireEvent.change(fileInput, { target: { files: [validFile] } })

    await waitFor(() => expect(screen.queryByText('Ukuran foto maksimal 2 MB.')).not.toBeInTheDocument())
  })

  it('deletes a persisted avatar and returns profile plus header to KC fallback after remount', async () => {
    seedKepalaCamat({
      avatar: '/uploads/avatar-kc.png',
      foto: '/uploads/avatar-kc.png',
      photo: '/uploads/avatar-kc.png',
      foto_profil: '/uploads/avatar-kc.png',
    })
    deleteAvatar.mockResolvedValue({
      success: true,
      message: 'Foto profil berhasil dihapus.',
      data: { user: { username: 'kepala', role: 'kepala_camat', avatar: '' } },
    })

    const view = renderPage()
    await userEvent.click(screen.getByRole('button', { name: /hapus foto/i }))

    expect(await screen.findByText('Foto profil berhasil dihapus.')).toBeInTheDocument()
    await waitFor(() => expect(deleteAvatar).toHaveBeenCalledTimes(1))
    expect(JSON.parse(window.localStorage.getItem('rk_auth')).avatar).toBe('')

    view.unmount()
    renderPage()

    expect(screen.getAllByText('KC').length).toBeGreaterThanOrEqual(2)
  })
})
