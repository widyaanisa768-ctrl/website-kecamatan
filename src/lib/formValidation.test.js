import { describe, expect, it } from 'vitest'
import {
  FILE_TYPE_PRESETS,
  buildDokumenPayload,
  getBackendErrors,
  handleBackendValidationError,
  validateFileField,
  validateNikField,
  validateNoHpField,
  validateRegisterForm,
  validateRequiredFile,
  validateRequiredText,
} from './formValidation'

describe('formValidation', () => {
  it('memvalidasi field teks wajib', () => {
    expect(validateRequiredText('   ', 'Nama')).toBe('Nama wajib diisi.')
    expect(validateRequiredText(' Adara ', 'Nama')).toBe('')
  })

  it('memvalidasi email pada form registrasi', () => {
    expect(validateRegisterForm({ nama: 'Adara', username: 'adara', email: 'salah', password: '1234' }))
      .toContain('Email tidak valid')
    expect(validateRegisterForm({ nama: 'Adara', username: 'adara', email: 'adara@example.com', password: '1234' }))
      .not.toContain('Email tidak valid')
  })

  it('memvalidasi NIK wajib dan harus 16 digit angka', () => {
    expect(validateNikField('')).toBe('NIK wajib diisi.')
    expect(validateNikField('123')).toBe('NIK harus valid (16 digit angka)')
    expect(validateNikField('1234567890123456')).toBe('')
  })

  it('memvalidasi nomor HP 10 sampai 15 digit', () => {
    expect(validateNoHpField('')).toBe('No HP wajib diisi.')
    expect(validateNoHpField('0812abc')).toBe('no_hp harus valid')
    expect(validateNoHpField('081234567890')).toBe('')
  })

  it('memvalidasi file wajib', () => {
    expect(validateRequiredFile(null, 'KTP')).toBe('KTP wajib diunggah.')
    expect(validateRequiredFile({ name: 'ktp.pdf' }, 'KTP')).toBe('')
  })

  it.each([
    ['dokumen.pdf', 'application/pdf'],
    ['dokumen.png', 'image/png'],
  ])('menerima file PDF/PNG: %s', (name, type) => {
    const file = new File(['isi'], name, { type })
    expect(validateFileField(file, { ...FILE_TYPE_PRESETS.PDF_PNG, label: 'Dokumen' })).toBe('')
  })

  it('menolak format file di luar PDF/PNG', () => {
    const file = new File(['isi'], 'dokumen.jpg', { type: 'image/jpeg' })
    expect(validateFileField(file, { ...FILE_TYPE_PRESETS.PDF_PNG, label: 'Dokumen' }))
      .toBe('Format file harus PDF atau PNG.')
  })

  it('menolak file yang melebihi ukuran maksimum', () => {
    const file = new File(['isi'], 'dokumen.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 + 1 })

    expect(validateFileField(file, { ...FILE_TYPE_PRESETS.PDF, label: 'Dokumen', maxSizeMB: 2 }))
      .toBe('Dokumen maksimal 2MB')
  })

  it('mengambil daftar pesan error dari response backend bertingkat', () => {
    expect(getBackendErrors({ data: { errors: ['NIK sudah terdaftar', 'Email tidak valid'] } }))
      .toEqual(['NIK sudah terdaftar', 'Email tidak valid'])
  })

  it('menggunakan message atau fallback untuk error backend', () => {
    expect(handleBackendValidationError({ message: 'Akses ditolak' })).toEqual(['Akses ditolak'])
    expect(getBackendErrors(null, 'Server tidak tersedia')).toEqual(['Server tidak tersedia'])
  })

  it('hanya membangun payload dari file yang valid', () => {
    const ktp = new File(['ktp'], 'ktp.pdf', { type: 'application/pdf' })
    expect(buildDokumenPayload(
      { ktp, kk: null },
      [
        { key: 'ktp', backendKey: 'file_ktp' },
        { key: 'kk', backendKey: 'file_kk' },
      ],
    )).toEqual({ file_ktp: ktp })
  })
})
