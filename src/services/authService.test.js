import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}))

vi.mock('./api', () => ({
  apiRequest: apiRequestMock,
}))

import { clearAuthArtifacts, login, logout } from './authService'

describe('authService', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('menormalisasi login berhasil dengan access token dan user', async () => {
    apiRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        success: true,
        data: {
          accessToken: 'access-123',
          user: { username: 'warga', role: 'masyarakat' },
        },
      },
    })

    await expect(login('warga', 'rahasia')).resolves.toMatchObject({
      success: true,
      accessToken: 'access-123',
      token: 'access-123',
      user: { username: 'warga', role: 'masyarakat' },
    })
    expect(apiRequestMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { username: 'warga', password: 'rahasia' },
      withAuth: false,
    })
  })

  it('mengembalikan login gagal dan pesan backend', async () => {
    apiRequestMock.mockResolvedValue({
      ok: false,
      status: 401,
      data: { success: false, message: 'Username atau password salah.' },
    })

    await expect(login('warga', 'salah')).resolves.toMatchObject({
      success: false,
      status: 401,
      message: 'Username atau password salah.',
    })
  })

  it('mempertahankan daftar error dari backend', async () => {
    apiRequestMock.mockResolvedValue({
      ok: false,
      status: 400,
      data: { message: 'Validasi gagal', errors: ['Username wajib diisi'] },
    })

    await expect(login('', '')).resolves.toMatchObject({
      success: false,
      status: 400,
      errors: ['Username wajib diisi'],
    })
  })

  it('menganggap login berhasil saat history login gagal tetapi token tersedia', async () => {
    apiRequestMock.mockResolvedValue({
      ok: false,
      status: 500,
      data: {
        success: false,
        message: 'Gagal menyimpan history login',
        token: 'token-valid',
        user: { username: 'warga', role: 'masyarakat' },
      },
    })

    await expect(login('warga', 'rahasia')).resolves.toMatchObject({
      success: true,
      token: 'token-valid',
      message: '',
    })
  })

  it('mengubah exception menjadi response gagal yang aman', async () => {
    apiRequestMock.mockRejectedValue(new Error('Network mati'))
    await expect(login('warga', 'rahasia')).resolves.toEqual({
      success: false,
      message: 'Error: Network mati',
    })
  })

  it('menghapus seluruh artefak auth localStorage dan mengirim event', () => {
    const listener = vi.fn()
    window.addEventListener('rk-auth-updated', listener)
    for (const key of ['accessToken', 'token', 'user', 'role', 'rk_auth']) {
      window.localStorage.setItem(key, 'isi')
    }
    window.localStorage.setItem('data-lain', 'tetap')

    clearAuthArtifacts()

    for (const key of ['accessToken', 'token', 'user', 'role', 'rk_auth']) {
      expect(window.localStorage.getItem(key)).toBeNull()
    }
    expect(window.localStorage.getItem('data-lain')).toBe('tetap')
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('rk-auth-updated', listener)
  })

  it('logout memanggil endpoint backend tanpa menghapus storage secara implisit', async () => {
    window.localStorage.setItem('token', 'tetap-ada')
    apiRequestMock.mockResolvedValue({ ok: true, status: 200, data: { message: 'ok' } })

    await expect(logout()).resolves.toMatchObject({ success: true, status: 200 })
    expect(apiRequestMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      withAuth: true,
    })
    expect(window.localStorage.getItem('token')).toBe('tetap-ada')
  })
})
