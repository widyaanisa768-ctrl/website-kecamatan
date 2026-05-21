import { useMemo, useState } from 'react'
import SidebarPetugas from '../components/SidebarPetugas'
import '../styles/petugas-ui.css'

function formatTanggalID(date) {
  try {
    return new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

function statusBadgeClass(status) {
  return status === 'Aktif' ? 'ptg-pill ptg-pill--active' : 'ptg-pill ptg-pill--inactive'
}

const EMPTY_FORM = {
  namaLengkap: '',
  nik: '',
  jenisKelamin: 'Laki-laki',
  alamat: '',
  nomorHp: '',
  pekerjaan: '',
  status: 'Aktif',
}

export default function KelolaDataMasyarakat() {
  const today = useMemo(() => new Date(), [])

  const [search, setSearch] = useState('')

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)

  const [selected, setSelected] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const [toast, setToast] = useState(null)

  const petugas = {
    nama: 'Widya Anisa',
    jabatan: 'Petugas Pelayanan Terpadu',
    unit: 'Kantor Camat Rantau Kopar',
  }

  const initialCitizens = useMemo(
    () => [
      {
        id: 'M-001',
        namaLengkap: 'Siti Aisyah',
        nik: '1409021203990001',
        jenisKelamin: 'Perempuan',
        alamat: 'Dusun Melati, Desa Rantau Kopar, Kec. Rantau Kopar',
        nomorHp: '0812-3456-7890',
        pekerjaan: 'Ibu Rumah Tangga',
        status: 'Aktif',
      },
      {
        id: 'M-002',
        namaLengkap: 'Andi Saputra',
        nik: '1409020201920002',
        jenisKelamin: 'Laki-laki',
        alamat: 'Jl. Lintas Rantau Kopar No. 12, Kec. Rantau Kopar',
        nomorHp: '0821-7788-9900',
        pekerjaan: 'Wiraswasta',
        status: 'Aktif',
      },
      {
        id: 'M-003',
        namaLengkap: 'Nurhaliza',
        nik: '1409024706970003',
        jenisKelamin: 'Perempuan',
        alamat: 'Dusun Kenanga, Desa Teluk Nilap, Kec. Rantau Kopar',
        nomorHp: '0852-1199-2233',
        pekerjaan: 'Guru',
        status: 'Aktif',
      },
      {
        id: 'M-004',
        namaLengkap: 'Budi Hartono',
        nik: '1409021208850004',
        jenisKelamin: 'Laki-laki',
        alamat: 'Desa Sekeladi, Kec. Rantau Kopar',
        nomorHp: '0813-9901-8822',
        pekerjaan: 'Petani',
        status: 'Tidak Aktif',
      },
      {
        id: 'M-005',
        namaLengkap: 'Dewi Lestari',
        nik: '1409025201900005',
        jenisKelamin: 'Perempuan',
        alamat: 'Jl. Pendidikan, Desa Rantau Kopar, Kec. Rantau Kopar',
        nomorHp: '0878-2200-3111',
        pekerjaan: 'Perawat',
        status: 'Aktif',
      },
      {
        id: 'M-006',
        namaLengkap: 'Rahmat Hidayat',
        nik: '1409020105890006',
        jenisKelamin: 'Laki-laki',
        alamat: 'Dusun Dahlia, Desa Teluk Nilap, Kec. Rantau Kopar',
        nomorHp: '0838-7001-9922',
        pekerjaan: 'Buruh',
        status: 'Aktif',
      },
      {
        id: 'M-007',
        namaLengkap: 'Maya Sari',
        nik: '1409026307940007',
        jenisKelamin: 'Perempuan',
        alamat: 'Desa Rantau Kopar, Kec. Rantau Kopar',
        nomorHp: '0819-5550-7007',
        pekerjaan: 'Karyawan Swasta',
        status: 'Tidak Aktif',
      },
      {
        id: 'M-008',
        namaLengkap: 'Fajar Pratama',
        nik: '1409021503960008',
        jenisKelamin: 'Laki-laki',
        alamat: 'Jl. Pasar Baru, Desa Sekeladi, Kec. Rantau Kopar',
        nomorHp: '0853-4411-2099',
        pekerjaan: 'Mahasiswa',
        status: 'Aktif',
      },
    ],
    []
  )

  const [citizens, setCitizens] = useState(initialCitizens)

  const filteredCitizens = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = term
      ? citizens.filter((c) => c.namaLengkap.toLowerCase().includes(term) || c.nik.toLowerCase().includes(term))
      : citizens

    return [...list].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap, 'id-ID'))
  }, [citizens, search])

  function showToast(message, type = 'success') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2500)
  }

  function resetAction() {
    setSearch('')
  }

  function openAddModal() {
    setFormData(EMPTY_FORM)
    setOpenAdd(true)
  }

  function openEditModal(row) {
    setSelected(row)
    setFormData({
      namaLengkap: row.namaLengkap,
      nik: row.nik,
      jenisKelamin: row.jenisKelamin,
      alamat: row.alamat,
      nomorHp: row.nomorHp,
      pekerjaan: row.pekerjaan,
      status: row.status,
    })
    setOpenEdit(true)
  }

  function openDetailModal(row) {
    setSelected(row)
    setOpenDetail(true)
  }

  function closeAllModals() {
    setOpenAdd(false)
    setOpenEdit(false)
    setOpenDetail(false)
    setSelected(null)
    setFormData(EMPTY_FORM)
  }

  function handleFormChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function validateForm() {
    if (!formData.namaLengkap.trim()) return 'Nama Lengkap wajib diisi'
    if (!formData.nik.trim()) return 'NIK wajib diisi'
    if (formData.nik.trim().length < 10) return 'NIK terlalu pendek'
    if (!formData.alamat.trim()) return 'Alamat wajib diisi'
    if (!formData.nomorHp.trim()) return 'Nomor HP wajib diisi'
    if (!formData.pekerjaan.trim()) return 'Pekerjaan wajib diisi'
    return null
  }

  function simpanTambah() {
    const err = validateForm()
    if (err) {
      window.alert(err)
      return
    }

    const nik = formData.nik.trim()
    if (citizens.some((c) => c.nik === nik)) {
      window.alert('NIK sudah terdaftar')
      return
    }

    const newItem = {
      id: `M-${String(Date.now()).slice(-6)}`,
      ...formData,
      namaLengkap: formData.namaLengkap.trim(),
      nik,
      alamat: formData.alamat.trim(),
      nomorHp: formData.nomorHp.trim(),
      pekerjaan: formData.pekerjaan.trim(),
    }

    setCitizens((prev) => [newItem, ...prev])
    setOpenAdd(false)
    setFormData(EMPTY_FORM)
    showToast('Data masyarakat berhasil ditambahkan', 'success')
  }

  function simpanEdit() {
    if (!selected) return

    const err = validateForm()
    if (err) {
      window.alert(err)
      return
    }

    const nik = formData.nik.trim()
    const duplicateNik = citizens.some((c) => c.nik === nik && c.id !== selected.id)
    if (duplicateNik) {
      window.alert('NIK sudah digunakan oleh data lain')
      return
    }

    setCitizens((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? {
              ...c,
              ...formData,
              namaLengkap: formData.namaLengkap.trim(),
              nik,
              alamat: formData.alamat.trim(),
              nomorHp: formData.nomorHp.trim(),
              pekerjaan: formData.pekerjaan.trim(),
            }
          : c
      )
    )
    setOpenEdit(false)
    setSelected(null)
    setFormData(EMPTY_FORM)
    showToast('Data masyarakat berhasil diperbarui', 'success')
  }

  function hapus(row) {
    const ok = window.confirm(`Hapus data masyarakat atas nama "${row.namaLengkap}"?`)
    if (!ok) return
    setCitizens((prev) => prev.filter((c) => c.id !== row.id))
    showToast('Data masyarakat berhasil dihapus', 'success')
  }

  return (
    <div className="ptg-page">
      {toast ? (
        <div className={`ptg-toast ptg-toast--${toast.type || 'success'}`} role="status" aria-live="polite">
          <div className="ptg-toastTop">
            <span className="ptg-toastDot" aria-hidden="true" />
            <div className="ptg-toastMsg">{toast.message}</div>
          </div>
        </div>
      ) : null}

      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Kelola Data Masyarakat" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Kelola Data Masyarakat</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarSearch" aria-label="Pencarian">
              <div className="ptg-search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M10.5 19a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M21 21l-4.4-4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau NIK..."
                  aria-label="Cari masyarakat"
                />
              </div>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
              <button type="button" className="ptg-iconBtn ptg-bell" aria-label="Notifikasi">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>

              <div className="ptg-profile" aria-label="Profil petugas">
                <div className="ptg-profileMeta">
                  <strong>{petugas.nama}</strong>
                  <span>{petugas.jabatan}</span>
                </div>
                <div className="ptg-avatar" title={petugas.unit} aria-hidden="true">
                  {petugas.nama
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              <section className="ptg-card ptg-section" aria-label="Header kelola data masyarakat">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Data Masyarakat</h2>
                  <div className="ptg-actionsRow">
                    <button type="button" className="ptg-btn" onClick={resetAction}>
                      Reset
                    </button>
                    <button type="button" className="ptg-btn ptg-btnPrimary" onClick={openAddModal}>
                      Tambah Data
                    </button>
                  </div>
                </div>
                <div className="ptg-divider" />
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div className="ptg-subtle">
                    Total: <strong>{filteredCitizens.length}</strong> / {citizens.length}
                  </div>
                  <div className="ptg-subtle">Data dummy lokal • Tanpa backend</div>
                </div>
              </section>

              <section className="ptg-card ptg-section" aria-label="Tabel data masyarakat">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Tabel Masyarakat</h2>
                  <div className="ptg-subtle">Urut A → Z</div>
                </div>
                <div className="ptg-divider" />

                <div className="ptg-tableWrap" role="region" aria-label="Tabel data masyarakat" style={{ marginTop: 12 }}>
                  <table className="ptg-table">
                    <thead>
                      <tr>
                        <th style={{ width: 64 }}>No</th>
                        <th>Nama Lengkap</th>
                        <th style={{ width: 180 }}>NIK</th>
                        <th style={{ width: 140 }}>Nomor HP</th>
                        <th>Pekerjaan</th>
                        <th style={{ width: 140 }}>Status</th>
                        <th style={{ width: 140, textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCitizens.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty">
                            Data tidak ditemukan. Coba ubah pencarian atau reset.
                          </td>
                        </tr>
                      ) : (
                        filteredCitizens.map((row, idx) => (
                          <tr key={row.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <div style={{ fontWeight: 800 }}>{row.namaLengkap}</div>
                              <div className="ptg-id">{row.id}</div>
                            </td>
                            <td className="ptg-mono">{row.nik}</td>
                            <td className="ptg-mono">{row.nomorHp}</td>
                            <td>{row.pekerjaan}</td>
                            <td>
                              <span className={statusBadgeClass(row.status)}>{row.status}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: 8 }}>
                                <button
                                  type="button"
                                  className="ptg-btn ptg-btnIcon"
                                  aria-label="Detail masyarakat"
                                  title="Detail"
                                  onClick={() => openDetailModal(row)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinejoin="round"
                                    />
                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="ptg-btn ptg-btnIcon"
                                  aria-label="Edit masyarakat"
                                  title="Edit"
                                  onClick={() => openEditModal(row)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                      d="M12 20h9"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="ptg-btn ptg-btnIcon ptg-btnDanger"
                                  aria-label="Hapus masyarakat"
                                  title="Hapus"
                                  onClick={() => hapus(row)}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path
                                      d="M3 6h18"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M8 6V4h8v2m-9 0 1 14h8l1-14"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Tambah */}
      {openAdd ? (
        <div
          className="ptg-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="ptg-modal">
            <div className="ptg-modalHead">
              <h3>Tambah Data Masyarakat</h3>
              <button type="button" className="ptg-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="ptg-modalBody">
              <div className="ptg-gridTwo" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="ptg-field">
                  <div className="ptg-label">Nama Lengkap</div>
                  <input className="ptg-input" name="namaLengkap" value={formData.namaLengkap} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">NIK</div>
                  <input className="ptg-input ptg-mono" name="nik" value={formData.nik} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Jenis Kelamin</div>
                  <select className="ptg-select" name="jenisKelamin" value={formData.jenisKelamin} onChange={handleFormChange}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Nomor HP</div>
                  <input className="ptg-input ptg-mono" name="nomorHp" value={formData.nomorHp} onChange={handleFormChange} />
                </div>
                <div className="ptg-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="ptg-label">Alamat</div>
                  <textarea className="ptg-textarea" name="alamat" value={formData.alamat} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Pekerjaan</div>
                  <input className="ptg-input" name="pekerjaan" value={formData.pekerjaan} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Status</div>
                  <select className="ptg-select" name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ptg-modalFoot">
              <button type="button" className="ptg-btn" onClick={closeAllModals}>
                Batal
              </button>
              <button type="button" className="ptg-btn ptg-btnPrimary" onClick={simpanTambah}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Edit */}
      {openEdit && selected ? (
        <div
          className="ptg-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="ptg-modal">
            <div className="ptg-modalHead">
              <h3>Edit Data Masyarakat</h3>
              <button type="button" className="ptg-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="ptg-modalBody">
              <div className="ptg-gridTwo" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="ptg-field">
                  <div className="ptg-label">Nama Lengkap</div>
                  <input className="ptg-input" name="namaLengkap" value={formData.namaLengkap} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">NIK</div>
                  <input className="ptg-input ptg-mono" name="nik" value={formData.nik} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Jenis Kelamin</div>
                  <select className="ptg-select" name="jenisKelamin" value={formData.jenisKelamin} onChange={handleFormChange}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Nomor HP</div>
                  <input className="ptg-input ptg-mono" name="nomorHp" value={formData.nomorHp} onChange={handleFormChange} />
                </div>
                <div className="ptg-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="ptg-label">Alamat</div>
                  <textarea className="ptg-textarea" name="alamat" value={formData.alamat} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Pekerjaan</div>
                  <input className="ptg-input" name="pekerjaan" value={formData.pekerjaan} onChange={handleFormChange} />
                </div>
                <div className="ptg-field">
                  <div className="ptg-label">Status</div>
                  <select className="ptg-select" name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="ptg-modalFoot">
              <button type="button" className="ptg-btn" onClick={closeAllModals}>
                Batal
              </button>
              <button type="button" className="ptg-btn ptg-btnPrimary" onClick={simpanEdit}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Detail */}
      {openDetail && selected ? (
        <div
          className="ptg-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Detail data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="ptg-modal">
            <div className="ptg-modalHead">
              <h3>Detail Data Masyarakat</h3>
              <button type="button" className="ptg-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="ptg-modalBody">
              <dl className="ptg-kv">
                <dt>Nama Lengkap</dt>
                <dd>{selected.namaLengkap}</dd>

                <dt>NIK</dt>
                <dd className="ptg-mono">{selected.nik}</dd>

                <dt>Jenis Kelamin</dt>
                <dd>{selected.jenisKelamin}</dd>

                <dt>Alamat</dt>
                <dd>{selected.alamat}</dd>

                <dt>Nomor HP</dt>
                <dd className="ptg-mono">{selected.nomorHp}</dd>

                <dt>Pekerjaan</dt>
                <dd>{selected.pekerjaan}</dd>

                <dt>Status</dt>
                <dd>
                  <span className={statusBadgeClass(selected.status)}>{selected.status}</span>
                </dd>
              </dl>
            </div>
            <div className="ptg-modalFoot">
              <button type="button" className="ptg-btn" onClick={closeAllModals}>
                Tutup
              </button>
              <button type="button" className="ptg-btn" onClick={() => openEditModal(selected)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
