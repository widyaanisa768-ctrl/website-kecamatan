# Unit Testing PETA RANKO

## Environment

Unit testing menggunakan Vitest dengan environment `jsdom`. Semua request API pada test di-mock melalui module `src/services/api.js`; test tidak menghubungi backend atau hosting asli.

Dependency development yang dipasang:

- `vitest@4.1.9`
- `jsdom@29.1.1`
- `@testing-library/react@16.3.2`
- `@testing-library/jest-dom@6.9.1`
- `@testing-library/user-event@14.6.1`
- `@vitest/coverage-v8@4.1.9`

Konfigurasi terdapat di `vite.config.js`, sedangkan setup global terdapat di `src/test/setup.js`.

## Menjalankan Test

```bash
npm test
npm run test:run
npm run test:coverage
```

- `npm test`: mode watch/interaktif.
- `npm run test:run`: menjalankan seluruh test satu kali.
- `npm run test:coverage`: menjalankan test sekaligus membuat laporan terminal, HTML, dan JSON.
- Laporan HTML lokal dibuat di `coverage/index.html`; folder `coverage/` diabaikan Git.

## File Test

- `src/lib/formValidation.test.js`
- `src/services/authService.test.js`
- `src/services/pengajuanService.test.js`
- `src/lib/authRoles.test.js`
- `src/pages/login.test.jsx`

## Test Case

### Validasi Form

- Field teks dan file wajib.
- Format email.
- NIK wajib dan 16 digit angka.
- Nomor HP wajib dan 10–15 digit angka.
- File PDF dan PNG valid.
- Format file selain PDF/PNG ditolak.
- Batas ukuran file.
- Error backend berbentuk `errors`, `message`, dan fallback.
- Penyusunan payload dokumen hanya dari file valid.

### Auth

- Login berhasil dan normalisasi `accessToken`, `token`, serta `user`.
- Login gagal 401 dan pesan backend.
- Daftar error validasi backend.
- Exception/network error dinormalisasi menjadi response gagal.
- Warning kegagalan history login tetap dianggap berhasil jika token/identitas tersedia.
- Logout memanggil API mock.
- `clearAuthArtifacts()` menghapus hanya key auth yang benar.
- Alur halaman login menyimpan token, user, role, dan `rk_auth` ke `localStorage`.
- Login gagal tidak menyimpan auth.

### Pengajuan

- Normalisasi status Menunggu, Pending, Diproses, Dalam Proses, Selesai, Disetujui, Diterima, Ditolak, dan Rejected.
- Create pengajuan memakai endpoint layanan dan mock API.
- Endpoint create yang tidak dikenal.
- Upload dokumen memakai mock API dan `FormData`.
- Error create dan upload untuk HTTP 400, 401, 403, dan 500.
- Response create tanpa `id_pengajuan` menghentikan upload dan menghasilkan error yang sesuai.

### Role

- Role backend masyarakat, petugas, dan kepala camat diarahkan ke halaman yang benar.
- Akun lokal petugas dan kepala camat diuji memakai kredensial yang sudah ada tanpa perubahan.
- Password atau mode role lokal yang salah ditolak.
- Pencarian akun role lokal yang valid.

## Hasil Terakhir

Per 21 Juni 2026:

- `npm run test:run`: **5 file test berhasil, 48 test berhasil, 0 gagal**.
- `npm run test:coverage`: **5 file test berhasil, 48 test berhasil, 0 gagal**.

Coverage untuk scope file inti yang ditentukan di `vite.config.js`:

| Metric | Coverage |
|---|---:|
| Statements | 37.30% (269/721) |
| Branches | 26.11% (276/1057) |
| Functions | 37.69% (49/130) |
| Lines | 39.96% (237/593) |

Coverage per file:

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/lib/authRoles.js` | 93.75% | 78.57% | 100% | 93.33% |
| `src/lib/formValidation.js` | 89.85% | 81.63% | 100% | 91.66% |
| `src/pages/login.jsx` | 84.61% | 61.11% | 85.71% | 83.82% |
| `src/services/authService.js` | 70.49% | 50.46% | 83.33% | 74.07% |
| `src/services/pengajuanService.js` | 16.70% | 11.35% | 15.21% | 17.92% |

## Temuan dan Batasan

- `src/lib/authRoles.js` tidak ditemukan di-import oleh source aktif. Test tetap dibuat untuk mengunci kredensial dan perilaku file tersebut, tetapi file ini saat ini tampak sebagai logic lama/tidak terhubung.
- Penyimpanan token dan user tidak dilakukan oleh `authService.login()`, melainkan oleh `src/pages/login.jsx`. Karena itu penyimpanan auth diuji melalui test halaman login.
- `src/services/pengajuanService.js` berisi banyak fungsi list, detail, update, delete, fallback localStorage, dan variasi response dokumen. Tahap ini baru mencakup fungsi inti yang diminta; coverage file masih rendah karena fungsi lain belum diuji.
- Test belum mencakup `src/services/api.js` secara langsung (timeout, header Authorization, serialization JSON/FormData), tetapi seluruh pemanggilan API pada service sudah di-mock sehingga tidak ada request production.
- Belum ada coverage threshold yang menggagalkan pipeline; angka coverage saat ini bersifat laporan baseline.

## Risiko dan Error Existing

- Pemeriksaan awal `npm run build` berhasil dengan warning chunk JavaScript lebih dari 500 kB.
- Pemeriksaan awal `npm run lint` gagal dengan **24 error dan 10 warning** pada source yang sudah ada sebelum setup testing. Error berada antara lain di `PengajuanSaya.jsx`, `pengajuanDokumenView.js`, `DetailPengajuanPetugas.jsx`, `LaporanKepalaCamat.jsx`, dan beberapa file form. Error existing tersebut tidak diperbaiki karena berada di luar ruang lingkup unit testing.
- Instalasi dependency sempat gagal karena sertifikat registry npm (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) dan berhasil setelah Node memakai certificate authority sistem Windows. Konfigurasi SSL npm tidak dinonaktifkan.

## Rekomendasi Test Berikutnya

1. Test langsung `src/services/api.js`: token header, JSON, FormData, timeout, response non-JSON, dan AbortError.
2. Perluas test `pengajuanService.js`: list masyarakat/petugas, detail, update PUT→PATCH, delete, dokumen legacy, dan fallback localStorage.
3. Test register dan validasi role yang tidak dikenal pada halaman login.
4. Setelah error lint existing ditangani pada tahap terpisah, tambahkan test komponen form per layanan dan komponen status pengajuan.
5. Tambahkan coverage threshold secara bertahap setelah coverage service pengajuan meningkat.
