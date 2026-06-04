export const LOCAL_ROLE_ACCOUNTS = {
  petugas: {
    username: 'petugas',
    password: 'petugas123',
    role: 'petugas',
    name: 'Petugas',
    jabatan: 'Petugas Pelayanan Terpadu',
    unit: 'Kantor Camat Rantau Kopar',
    redirect: '/petugas/dashboard',
  },
  kepala_camat: {
    username: 'kepala',
    password: 'kepala123',
    role: 'kepala_camat',
    name: 'Kepala Camat',
    jabatan: 'Kepala Camat',
    unit: 'Kantor Camat Rantau Kopar',
    redirect: '/dashboard-kepala-camat',
  },
}

export function loginLocalRole(username, password, mode) {
  const key = String(mode || '').trim().toLowerCase()
  const account = LOCAL_ROLE_ACCOUNTS[key]

  if (!account) {
    return { success: false, message: 'Username atau password salah.' }
  }

  const inputUsername = String(username || '').trim().toLowerCase()
  const inputPassword = String(password || '')

  if (inputUsername !== account.username.toLowerCase() || inputPassword !== account.password) {
    return { success: false, message: 'Username atau password salah.' }
  }

  const user = {
    username: account.username,
    role: account.role,
    name: account.name,
    jabatan: account.jabatan,
    unit: account.unit,
  }

  return {
    success: true,
    user,
    redirect: account.redirect,
  }
}
