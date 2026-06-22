import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const { loginMock, navigateMock } = vi.hoisted(() => ({
  loginMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../services/authService', () => ({
  login: loginMock,
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import LoginPage from './login'

describe('alur login dan role', () => {
  beforeEach(() => {
    loginMock.mockReset()
    navigateMock.mockReset()
  })

  it.each([
    ['masyarakat', '/layanan'],
    ['petugas', '/petugas/dashboard'],
    ['kepala camat', '/dashboard-kepala-camat'],
  ])('menyimpan auth dan mengarahkan role %s', async (backendRole, expectedPath) => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue({
      success: true,
      accessToken: 'access-token',
      token: 'token',
      user: { username: 'pengguna', nama_lengkap: 'Pengguna Uji', role: backendRole },
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Username'), 'pengguna')
    await user.type(screen.getByLabelText('Password'), 'rahasia')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expectedPath, { replace: true }))
    expect(window.localStorage.getItem('accessToken')).toBe('access-token')
    expect(window.localStorage.getItem('token')).toBe('token')
    expect(JSON.parse(window.localStorage.getItem('user'))).toMatchObject({
      username: 'pengguna',
      name: 'Pengguna Uji',
      role: backendRole.replace(' ', '_'),
    })
    expect(window.localStorage.getItem('role')).toBe(backendRole.replace(' ', '_'))
    expect(JSON.parse(window.localStorage.getItem('rk_auth'))).toMatchObject({
      username: 'pengguna',
      role: backendRole.replace(' ', '_'),
    })
  })

  it('menampilkan pesan login gagal tanpa menyimpan auth', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue({
      success: false,
      message: 'Username atau password salah.',
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Username'), 'pengguna')
    await user.type(screen.getByLabelText('Password'), 'salah')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Username atau password salah.')).toBeInTheDocument()
    expect(window.localStorage.getItem('token')).toBeNull()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
