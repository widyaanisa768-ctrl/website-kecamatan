import { describe, expect, it } from 'vitest'
import { LOCAL_ROLE_ACCOUNTS, loginAnyLocalRole, loginLocalRole } from './authRoles'

describe('authRoles lokal', () => {
  it('mengautentikasi petugas dengan kredensial aktif tanpa mengubahnya', () => {
    const account = LOCAL_ROLE_ACCOUNTS.petugas
    expect(loginLocalRole(account.username, account.password, 'petugas')).toMatchObject({
      success: true,
      user: { role: 'petugas', username: account.username },
      redirect: '/petugas/dashboard',
    })
  })

  it('mengautentikasi kepala camat dengan kredensial aktif tanpa mengubahnya', () => {
    const account = LOCAL_ROLE_ACCOUNTS.kepala_camat
    expect(loginLocalRole(account.username, account.password, 'kepala_camat')).toMatchObject({
      success: true,
      user: { role: 'kepala_camat', username: account.username },
      redirect: '/dashboard-kepala-camat',
    })
  })

  it('menolak password atau mode role yang salah', () => {
    expect(loginLocalRole('Adara123', 'salah', 'petugas')).toEqual({
      success: false,
      message: 'Username atau password salah.',
    })
    expect(loginLocalRole('warga', 'rahasia', 'masyarakat')).toEqual({
      success: false,
      message: 'Username atau password salah.',
    })
  })

  it('mendeteksi akun role lokal yang valid', () => {
    const account = LOCAL_ROLE_ACCOUNTS.kepala_camat
    expect(loginAnyLocalRole(account.username, account.password)).toMatchObject({
      success: true,
      user: { role: 'kepala_camat' },
    })
  })
})
