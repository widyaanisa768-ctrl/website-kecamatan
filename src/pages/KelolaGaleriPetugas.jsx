import { useEffect, useMemo, useState } from 'react'
import { FiBell, FiEdit2, FiImage, FiPlus, FiPower, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import PetugasAvatar from '../components/PetugasAvatar'
import SidebarPetugas from '../components/SidebarPetugas'
import { getAuth } from '../lib/rkLocal'
import {
  createGaleri,
  deleteGaleri,
  getGaleriAdmin,
  resolveGalleryImageUrl,
  updateGaleri,
  updateStatusGaleri,
} from '../services/galeriService'
import '../styles/petugas-ui.css'
import './KelolaGaleriPetugas.css'

const EMPTY_FORM = {
  judul: '',
  deskripsi_singkat: '',
  deskripsi_detail: '',
  tanggal_kegiatan: '',
  lokasi: '',
  tipe_tampilan: 'card',
  urutan_tampil: '1',
  status_aktif: '1',
  foto: null,
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

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

function normalizeDisplayType(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()

  if (normalized === 'hero') return 'Hero'
  if (normalized === 'card') return 'Card'
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '-'
}

function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const left = Number(a?.urutan_tampil)
    const right = Number(b?.urutan_tampil)
    return (Number.isFinite(left) ? left : 0) - (Number.isFinite(right) ? right : 0)
  })
}

function getGaleriItemId(item, fallback = '') {
  return String(item?.id_galeri || item?.id || item?._id || fallback || '')
}

function revokePreviewUrl(url) {
  if (String(url || '').startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function normalizeDateForInput(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)

  try {
    const date = new Date(text)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

function filenameFromUrl(url) {
  try {
    const parsed = new URL(url)
    return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || '')
  } catch {
    return decodeURIComponent(String(url || '').split('?')[0].split('/').filter(Boolean).pop() || '')
  }
}

export default function KelolaGaleriPetugas() {
  const today = useMemo(() => new Date(), [])
  const [auth, setAuthState] = useState(() => getAuth())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [galeriItems, setGaleriItems] = useState([])
  const [brokenImages, setBrokenImages] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingItem, setEditingItem] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [previewUrl, setPreviewUrl] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [confirmState, setConfirmState] = useState(null)
  const [rowBusy, setRowBusy] = useState({})
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timeoutId = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    return () => revokePreviewUrl(previewUrl)
  }, [previewUrl])

  async function loadGaleri(options = {}) {
    if (!options.silent) setLoading(true)
    const res = await getGaleriAdmin()

    if (res?.success) {
      setGaleriItems(sortByOrder(res.items || []))
      setError('')
    } else {
      setGaleriItems([])
      setError(res?.message || 'Data galeri belum dapat dimuat.')
    }

    if (!options.silent) setLoading(false)
    return res
  }

  useEffect(() => {
    let alive = true

    void loadGaleri()
    const onFocus = async () => {
      if (!alive) return
      await loadGaleri({ silent: true })
    }
    window.addEventListener('focus', onFocus)

    return () => {
      alive = false
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  useEffect(() => {
    const syncAuth = () => setAuthState(getAuth())
    syncAuth()
    window.addEventListener('focus', syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('rk-auth-updated', syncAuth)
    return () => {
      window.removeEventListener('focus', syncAuth)
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('rk-auth-updated', syncAuth)
    }
  }, [])

  function markImageBroken(id) {
    setBrokenImages((prev) => ({
      ...prev,
      [id]: true,
    }))
  }

  function showToast(message, type = 'info') {
    setToast({ message, type })
  }

  function setNextPreviewUrl(nextUrl) {
    setPreviewUrl((prev) => {
      if (prev && prev !== nextUrl) revokePreviewUrl(prev)
      return nextUrl
    })
  }

  function resetFormState() {
    setNextPreviewUrl('')
    setForm(EMPTY_FORM)
    setFormErrors({})
    setEditingItem(null)
    setFileInputKey((prev) => prev + 1)
  }

  function closeModal() {
    setIsModalOpen(false)
    setIsSubmitting(false)
    setModalMode('create')
    resetFormState()
  }

  function openCreateModal() {
    setModalMode('create')
    setFormErrors({})
    resetFormState()
    setIsModalOpen(true)
  }

  function openEditModal(item) {
    const itemId = getGaleriItemId(item)
    const imageUrl = resolveGalleryImageUrl(item?.foto_url)

    setModalMode('edit')
    setEditingItem(item)
    setForm({
      judul: String(item?.judul || '').trim(),
      deskripsi_singkat: String(item?.deskripsi_singkat || '').trim(),
      deskripsi_detail: String(item?.deskripsi_detail || '').trim(),
      tanggal_kegiatan: normalizeDateForInput(item?.tanggal_kegiatan),
      lokasi: String(item?.lokasi || '').trim(),
      tipe_tampilan: String(item?.tipe_tampilan || 'card').trim().toLowerCase() === 'hero' ? 'hero' : 'card',
      urutan_tampil: String(item?.urutan_tampil ?? '1'),
      status_aktif: Number(item?.status_aktif) === 1 ? '1' : '0',
      foto: null,
    })
    setFormErrors({})
    setNextPreviewUrl(imageUrl)
    setFileInputKey((prev) => prev + 1)
    setBrokenImages((prev) => {
      if (!itemId || !prev[itemId]) return prev
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setIsModalOpen(true)
  }

  function closeConfirmModal() {
    setConfirmState(null)
  }

  function validateForm(values, mode) {
    const nextErrors = {}
    const judul = String(values?.judul || '').trim()
    const singkat = String(values?.deskripsi_singkat || '').trim()
    const detail = String(values?.deskripsi_detail || '').trim()
    const urutanRaw = String(values?.urutan_tampil || '').trim()
    const urutan = Number(urutanRaw)
    const foto = values?.foto || null
    const fileExt = String(foto?.name || '')
      .split('.')
      .pop()
      ?.toLowerCase()

    if (judul.length < 3) nextErrors.judul = 'Judul kegiatan minimal 3 karakter.'
    if (singkat.length < 10) nextErrors.deskripsi_singkat = 'Deskripsi singkat minimal 10 karakter.'
    if (detail.length < 10) nextErrors.deskripsi_detail = 'Deskripsi detail minimal 10 karakter.'
    if (!urutanRaw || Number.isNaN(urutan) || urutan < 0) nextErrors.urutan_tampil = 'Urutan tampil harus berupa angka minimal 0.'

    if (mode === 'create' && !foto) {
      nextErrors.foto = 'Foto wajib dipilih.'
    }

    if (foto && !ALLOWED_IMAGE_TYPES.includes(foto.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      nextErrors.foto = 'Foto harus berformat JPG, PNG, atau WEBP.'
    }

    return nextErrors
  }

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  function handleFotoChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setForm((prev) => ({
        ...prev,
        foto: null,
      }))
      setFormErrors((prev) => ({
        ...prev,
        foto: modalMode === 'create' ? 'Foto wajib dipilih.' : '',
      }))
      return
    }

    const fileExt = String(file.name || '')
      .split('.')
      .pop()
      ?.toLowerCase()
    if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      setForm((prev) => ({
        ...prev,
        foto: null,
      }))
      setFormErrors((prev) => ({
        ...prev,
        foto: 'Foto harus berformat JPG, PNG, atau WEBP.',
      }))
      showToast('Format foto harus JPG, PNG, atau WEBP.', 'danger')
      event.target.value = ''
      return
    }

    const nextPreview = URL.createObjectURL(file)
    setNextPreviewUrl(nextPreview)
    setForm((prev) => ({
      ...prev,
      foto: file,
    }))
    setFormErrors((prev) => ({
      ...prev,
      foto: '',
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm(form, modalMode)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali data galeri yang belum lengkap.', 'danger')
      return
    }

    const formData = new FormData()
    formData.append('judul', String(form.judul || '').trim())
    formData.append('deskripsi_singkat', String(form.deskripsi_singkat || '').trim())
    formData.append('deskripsi_detail', String(form.deskripsi_detail || '').trim())
    formData.append('tanggal_kegiatan', String(form.tanggal_kegiatan || '').trim())
    formData.append('lokasi', String(form.lokasi || '').trim())
    formData.append('tipe_tampilan', String(form.tipe_tampilan || 'card').trim())
    formData.append('urutan_tampil', String(form.urutan_tampil || '0').trim())
    formData.append('status_aktif', String(form.status_aktif || '1').trim())
    if (form.foto) formData.append('foto', form.foto)

    setIsSubmitting(true)
    const itemId = getGaleriItemId(editingItem)
    const res =
      modalMode === 'edit' && itemId
        ? await updateGaleri(itemId, formData)
        : await createGaleri(formData)

    if (!res?.success) {
      setIsSubmitting(false)
      const message = res?.errors?.length ? res.errors.join('\n') : res?.message || 'Gagal menyimpan galeri.'
      showToast(message, 'danger')
      return
    }

    await loadGaleri({ silent: true })
    setIsSubmitting(false)
    closeModal()
    showToast(modalMode === 'edit' ? 'Galeri berhasil diperbarui.' : 'Galeri berhasil ditambahkan.', 'success')
  }

  function setBusyRow(itemId, action) {
    setRowBusy((prev) => ({
      ...prev,
      [itemId]: action,
    }))
  }

  function clearBusyRow(itemId) {
    setRowBusy((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  function openStatusConfirm(item) {
    const nextStatus = Number(item?.status_aktif) === 1 ? 0 : 1
    setConfirmState({
      type: 'status',
      item,
      nextStatus,
      title: nextStatus === 1 ? 'Aktifkan Galeri' : 'Nonaktifkan Galeri',
      message:
        nextStatus === 1
          ? 'Aktifkan galeri ini di halaman publik?'
          : 'Nonaktifkan galeri ini dari halaman publik?',
      confirmLabel: nextStatus === 1 ? 'Aktifkan' : 'Nonaktifkan',
      confirmTone: 'primary',
    })
  }

  function openDeleteConfirm(item) {
    setConfirmState({
      type: 'delete',
      item,
      title: 'Hapus Galeri',
      message: 'Data galeri dan foto yang tersimpan akan dihapus permanen.',
      confirmLabel: 'Hapus Galeri',
      confirmTone: 'danger',
    })
  }

  async function handleConfirmSubmit() {
    if (!confirmState?.item) return

    const itemId = getGaleriItemId(confirmState.item)
    if (!itemId) return

    setBusyRow(itemId, confirmState.type)

    if (confirmState.type === 'status') {
      const res = await updateStatusGaleri(itemId, confirmState.nextStatus)
      if (!res?.success) {
        clearBusyRow(itemId)
        showToast(res?.errors?.length ? res.errors.join('\n') : res?.message || 'Gagal memperbarui status galeri.', 'danger')
        return
      }

      await loadGaleri({ silent: true })
      clearBusyRow(itemId)
      closeConfirmModal()
      showToast(confirmState.nextStatus === 1 ? 'Galeri berhasil diaktifkan.' : 'Galeri berhasil dinonaktifkan.', 'success')
      return
    }

    const res = await deleteGaleri(itemId)
    if (!res?.success) {
      clearBusyRow(itemId)
      showToast(res?.errors?.length ? res.errors.join('\n') : res?.message || 'Gagal menghapus galeri.', 'danger')
      return
    }

    await loadGaleri({ silent: true })
    clearBusyRow(itemId)
    closeConfirmModal()
    showToast('Galeri berhasil dihapus.', 'success')
  }

  const modalTitle = modalMode === 'edit' ? 'Edit Galeri' : 'Tambah Galeri'
  const previewLabel =
    form.foto?.name ||
    (modalMode === 'edit' && editingItem?.foto_url
      ? filenameFromUrl(resolveGalleryImageUrl(editingItem.foto_url)) || 'Foto saat ini'
      : '')
  const confirmItemId = getGaleriItemId(confirmState?.item)
  const confirmBusy = Boolean(confirmItemId && rowBusy[confirmItemId])

  return (
    <div className="ptg-page">
      {toast ? (
        <div className={`ptg-toast ptg-toast--${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="ptg-toastTop">
            <span className="ptg-toastDot" aria-hidden="true" />
            <div className="ptg-toastMsg">{toast.message}</div>
          </div>
        </div>
      ) : null}

      <div className="ptg-shell">
        <SidebarPetugas activeLabel="Kelola Galeri" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Kelola Galeri</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarRight" aria-label="Profil petugas">
              <button type="button" className="ptg-iconBtn ptg-bellBtn" aria-label="Notifikasi">
                <FiBell aria-hidden="true" />
              </button>

              <div className="ptg-profile" aria-label="Profil petugas">
                <div className="ptg-profileMeta">
                  <strong>{auth?.name || auth?.nama || 'Petugas'}</strong>
                  <span>{auth?.jabatan || 'Petugas Pelayanan Terpadu'}</span>
                </div>
                <PetugasAvatar
                  key={auth?.avatar || auth?.foto || auth?.photo || auth?.avatar_url || auth?.foto_profil || auth?.profile_photo || auth?.username || auth?.name || 'fallback'}
                  user={auth}
                  title={auth?.unit || 'Kantor Camat Rantau Kopar'}
                />
              </div>
            </div>
          </header>

          <div className="ptg-content">
            <div className="ptg-body">
              <section className="ptg-card ptg-section" aria-label="Daftar galeri petugas">
                <div className="ptg-sectionHeader">
                  <div className="ptg-galleryAdminHead">
                    <h2>Kelola Galeri</h2>
                    <p className="ptg-galleryAdminDesc">Kelola dokumentasi kegiatan yang tampil pada halaman galeri publik.</p>
                  </div>
                  <button type="button" className="ptg-btn ptg-btnPrimary ptg-galleryAdminAdd" aria-label="Tambah Galeri" onClick={openCreateModal}>
                    <FiPlus aria-hidden="true" />
                    <span>Tambah Galeri</span>
                  </button>
                </div>

                <div className="ptg-tableWrap" role="region" aria-label="Tabel kelola galeri">
                  <table className="ptg-table ptg-galleryAdminTable">
                    <thead>
                      <tr>
                        <th style={{ width: 72 }}>No</th>
                        <th style={{ width: 104 }}>Foto</th>
                        <th>Judul Kegiatan</th>
                        <th style={{ width: 140 }}>Tipe Tampilan</th>
                        <th style={{ width: 96 }}>Urutan</th>
                        <th style={{ width: 128 }}>Status</th>
                        <th style={{ width: 186 }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty">Memuat data galeri...</td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty">Data galeri belum dapat dimuat.</td>
                        </tr>
                      ) : galeriItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="ptg-empty">Belum ada data galeri.</td>
                        </tr>
                      ) : (
                        galeriItems.map((item, index) => {
                          const itemId = getGaleriItemId(item, index)
                          const imageUrl = resolveGalleryImageUrl(item?.foto_url)
                          const showImage = Boolean(imageUrl) && !brokenImages[itemId]
                          const isActive = Number(item?.status_aktif) === 1
                          const displayType = normalizeDisplayType(item?.tipe_tampilan)
                          const isBusy = Boolean(rowBusy[itemId])

                          return (
                            <tr key={itemId}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="ptg-galleryThumb">
                                  {showImage ? (
                                    <img
                                      src={imageUrl}
                                      alt={item?.judul || 'Foto galeri'}
                                      onError={() => markImageBroken(itemId)}
                                    />
                                  ) : (
                                    <div className="ptg-galleryThumbFallback" aria-label="Placeholder foto galeri">
                                      <FiImage aria-hidden="true" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="ptg-galleryTitleCell">
                                  <strong>{item?.judul || '-'}</strong>
                                  <span>{item?.lokasi || 'Kecamatan Rantau Kopar'}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`ptg-galleryTypeBadge ${displayType === 'Hero' ? 'is-hero' : 'is-card'}`}>
                                  {displayType}
                                </span>
                              </td>
                              <td>{item?.urutan_tampil ?? '-'}</td>
                              <td>
                                <span className={`ptg-pill ${isActive ? 'ptg-pill--active' : 'ptg-pill--inactive'}`}>
                                  {isActive ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td>
                                <div className="ptg-galleryActionGroup">
                                  <button
                                    type="button"
                                    className="ptg-btn ptg-btnIcon"
                                    aria-label={`Edit galeri ${item?.judul || index + 1}`}
                                    title="Edit"
                                    disabled={isBusy}
                                    onClick={() => openEditModal(item)}
                                  >
                                    <FiEdit2 aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="ptg-btn ptg-btnIcon ptg-btnDanger"
                                    aria-label={`Hapus galeri ${item?.judul || index + 1}`}
                                    title="Hapus"
                                    disabled={isBusy}
                                    onClick={() => openDeleteConfirm(item)}
                                  >
                                    <FiTrash2 aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="ptg-btn ptg-btnIcon ptg-btnPrimary"
                                    aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} galeri ${item?.judul || index + 1}`}
                                    title={isActive ? 'Nonaktifkan galeri' : 'Aktifkan galeri'}
                                    disabled={isBusy}
                                    onClick={() => openStatusConfirm(item)}
                                  >
                                    <FiPower aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen ? (
        <div className="ptg-modalOverlay" role="dialog" aria-modal="true" aria-label={modalTitle}>
          <div className="ptg-modal ptg-galleryModal">
            <div className="ptg-modalHead ptg-galleryModalHead">
              <h3>{modalTitle}</h3>
              <button type="button" className="ptg-galleryModalClose" onClick={closeModal} aria-label={`Tutup modal ${modalTitle}`}>
                <FiX aria-hidden="true" />
              </button>
            </div>

            <form id="ptg-galeri-form" className="ptg-modalBody ptg-galleryForm" onSubmit={handleSubmit} noValidate>
              <div className="ptg-galleryFormGrid">
                <div className="ptg-galleryFormMain">
                  <div className="ptg-field">
                    <div className="ptg-label">Upload Foto</div>
                    <label className={`ptg-galleryUpload ${formErrors.foto ? 'is-error' : ''}`} htmlFor="ptg-galeri-foto">
                      <input
                        key={fileInputKey}
                        id="ptg-galeri-foto"
                        className="ptg-hiddenInput"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleFotoChange}
                      />
                      <span className="ptg-btn ptg-galleryUploadBtn">
                        <FiUpload aria-hidden="true" />
                        <span>{form.foto ? 'Ganti Foto' : modalMode === 'edit' ? 'Pilih Foto Baru' : 'Pilih Foto'}</span>
                      </span>
                      <span className="ptg-galleryUploadHint">Format: JPG, PNG, WEBP</span>
                    </label>
                    {formErrors.foto ? <div className="ptg-galleryFieldError">{formErrors.foto}</div> : null}
                    {previewLabel ? <div className="ptg-galleryFileName">{previewLabel}</div> : null}
                  </div>

                  <div className="ptg-field">
                    <div className="ptg-label">Judul Kegiatan</div>
                    <input className="ptg-input" type="text" name="judul" value={form.judul} onChange={handleFieldChange} />
                    {formErrors.judul ? <div className="ptg-galleryFieldError">{formErrors.judul}</div> : null}
                  </div>

                  <div className="ptg-field">
                    <div className="ptg-label">Deskripsi Singkat</div>
                    <textarea className="ptg-textarea ptg-galleryTextareaSm" name="deskripsi_singkat" value={form.deskripsi_singkat} onChange={handleFieldChange} />
                    {formErrors.deskripsi_singkat ? <div className="ptg-galleryFieldError">{formErrors.deskripsi_singkat}</div> : null}
                  </div>

                  <div className="ptg-field">
                    <div className="ptg-label">Deskripsi Detail</div>
                    <textarea className="ptg-textarea ptg-galleryTextareaLg" name="deskripsi_detail" value={form.deskripsi_detail} onChange={handleFieldChange} />
                    {formErrors.deskripsi_detail ? <div className="ptg-galleryFieldError">{formErrors.deskripsi_detail}</div> : null}
                  </div>
                </div>

                <aside className="ptg-galleryFormSide">
                  <div className="ptg-galleryPreviewCard">
                    <strong>Preview Foto</strong>
                    <div className="ptg-galleryPreviewFrame">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview galeri" className="ptg-galleryPreviewImage" />
                      ) : (
                        <div className="ptg-galleryPreviewEmpty">
                          <FiImage aria-hidden="true" />
                          <span>Belum ada foto dipilih</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ptg-galleryMetaGrid">
                    <div className="ptg-field">
                      <div className="ptg-label">Tanggal Kegiatan</div>
                      <input className="ptg-input" type="date" name="tanggal_kegiatan" value={form.tanggal_kegiatan} onChange={handleFieldChange} />
                    </div>

                    <div className="ptg-field">
                      <div className="ptg-label">Lokasi</div>
                      <input className="ptg-input" type="text" name="lokasi" value={form.lokasi} onChange={handleFieldChange} />
                    </div>

                    <div className="ptg-field">
                      <div className="ptg-label">Tipe Tampilan</div>
                      <select className="ptg-select" name="tipe_tampilan" value={form.tipe_tampilan} onChange={handleFieldChange}>
                        <option value="hero">Hero</option>
                        <option value="card">Card</option>
                      </select>
                    </div>

                    <div className="ptg-field">
                      <div className="ptg-label">Urutan Tampil</div>
                      <input className="ptg-input" type="number" min="0" name="urutan_tampil" value={form.urutan_tampil} onChange={handleFieldChange} />
                      {formErrors.urutan_tampil ? <div className="ptg-galleryFieldError">{formErrors.urutan_tampil}</div> : null}
                    </div>

                    <div className="ptg-field">
                      <div className="ptg-label">Status Aktif</div>
                      <select className="ptg-select" name="status_aktif" value={form.status_aktif} onChange={handleFieldChange}>
                        <option value="1">Aktif</option>
                        <option value="0">Nonaktif</option>
                      </select>
                    </div>
                  </div>

                  <div className="ptg-galleryNote">
                    Galeri publik menampilkan maksimal 4 foto Hero dan 6 foto Card berdasarkan urutan tampil.
                  </div>
                </aside>
              </div>
            </form>

            <div className="ptg-modalFoot ptg-galleryModalFoot">
              <button type="button" className="ptg-btn" onClick={closeModal} disabled={isSubmitting}>
                Batal
              </button>
              <button type="submit" form="ptg-galeri-form" className="ptg-btn ptg-btnPrimary" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmState ? (
        <div className="ptg-modalOverlay" role="dialog" aria-modal="true" aria-label={confirmState.title}>
          <div className="ptg-modal ptg-galleryConfirmModal">
            <div className="ptg-modalHead">
              <h3>{confirmState.title}</h3>
              <button type="button" className="ptg-galleryModalClose" onClick={closeConfirmModal} aria-label={`Tutup modal ${confirmState.title}`}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <div className="ptg-modalBody ptg-galleryConfirmBody">
              <strong>{confirmState.item?.judul || 'Galeri'}</strong>
              <p>{confirmState.message}</p>
            </div>
            <div className="ptg-modalFoot">
              <button type="button" className="ptg-btn" onClick={closeConfirmModal} disabled={confirmBusy}>
                Batal
              </button>
              <button
                type="button"
                className={`ptg-btn ${confirmState.confirmTone === 'danger' ? 'ptg-btnDanger' : 'ptg-btnPrimary'}`}
                onClick={handleConfirmSubmit}
                disabled={confirmBusy}
              >
                {confirmBusy ? 'Memproses...' : confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
