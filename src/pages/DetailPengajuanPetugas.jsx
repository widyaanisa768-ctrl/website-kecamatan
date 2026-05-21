import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, getSubmissionById, pushNotif, updateSubmission } from '../lib/rkLocal'
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

function getStatusClass(status) {
  switch (status) {
    case STATUS.MENUNGGU:
      return 'ptg-badge ptg-badge--waiting'
    case STATUS.PERLU_PERBAIKAN:
      return 'ptg-badge ptg-badge--reject'
    case STATUS.DIPROSES:
      return 'ptg-badge ptg-badge--process'
    case STATUS.DISETUJUI:
    case STATUS.SELESAI:
      return 'ptg-badge ptg-badge--done'
    case STATUS.DITOLAK:
      return 'ptg-badge ptg-badge--reject'
    default:
      return 'ptg-badge'
  }
}

export default function DetailPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  const today = useMemo(() => new Date(), [])
  const submissionId = params?.id || location.state?.submission?.id || ''

  const petugas = {
    nama: 'Widya Anisa',
    jabatan: 'Petugas Pelayanan Terpadu',
    unit: 'Kantor Camat Rantau Kopar',
  }

  const statusOptions = useMemo(
    () => [STATUS.MENUNGGU, STATUS.PERLU_PERBAIKAN, STATUS.DIPROSES, STATUS.DISETUJUI, STATUS.SELESAI, STATUS.DITOLAK],
    []
  )

  const [submission, setSubmission] = useState(() => (submissionId ? getSubmissionById(submissionId) : null))
  const [statusBaru, setStatusBaru] = useState(STATUS.MENUNGGU)
  const [catatanPetugas, setCatatanPetugas] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const refresh = () => {
      const s = submissionId ? getSubmissionById(submissionId) : null
      setSubmission(s)
      setStatusBaru(s?.status || STATUS.MENUNGGU)
      setCatatanPetugas(s?.catatanPetugas || '')
    }
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [submissionId])

  function showToast(message, type = 'info') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  const lampiran = useMemo(() => {
    const docs = submission?.dokumen || {}
    return Object.entries(docs).map(([key, meta], idx) => {
      const filename = meta?.name || '-'
      const ext = filename.includes('.') ? filename.split('.').pop().toUpperCase() : '-'
      return { id: `F${idx + 1}`, label: key, filename, ext }
    })
  }, [submission])

  function notifByStatus(nextStatus, nextCatatan) {
    const to = submission?.pemohon?.username
    if (!to) return

    if (nextStatus === STATUS.PERLU_PERBAIKAN) {
      pushNotif(to, {
        title: 'Pengajuan perlu perbaikan',
        message: `Pengajuan ${submission.id} perlu perbaikan. ${nextCatatan ? `Catatan: ${nextCatatan}` : ''}`.trim(),
        submissionId: submission.id,
      })
      return
    }
    if (nextStatus === STATUS.DIPROSES) {
      pushNotif(to, {
        title: 'Pengajuan diverifikasi',
        message: `Pengajuan ${submission.id} diverifikasi dan sedang diproses.`,
        submissionId: submission.id,
      })
      return
    }
    if (nextStatus === STATUS.DISETUJUI) {
      pushNotif(to, {
        title: 'Pengajuan disetujui',
        message: `Pengajuan ${submission.id} sudah disetujui. Menunggu pembuatan surat.`,
        submissionId: submission.id,
      })
      return
    }
    if (nextStatus === STATUS.SELESAI) {
      pushNotif(to, {
        title: 'Surat selesai',
        message: `Pengajuan ${submission.id} sudah selesai. Silakan unduh hasil surat di dashboard.`,
        submissionId: submission.id,
      })
      return
    }
    if (nextStatus === STATUS.DITOLAK) {
      pushNotif(to, {
        title: 'Pengajuan ditolak',
        message: `Pengajuan ${submission.id} ditolak. ${nextCatatan ? `Catatan: ${nextCatatan}` : ''}`.trim(),
        submissionId: submission.id,
      })
    }
  }

  function simpanPerubahan() {
    if (!submission) return
    const prevStatus = submission.status
    const next = updateSubmission(submission.id, { status: statusBaru, catatanPetugas })
    if (!next) {
      showToast('Gagal menyimpan perubahan.', 'danger')
      return
    }
    setSubmission(next)
    if (prevStatus !== next.status) {
      notifByStatus(next.status, next.catatanPetugas)
    }
    showToast('Perubahan berhasil disimpan.', 'success')
  }

  function verifikasi() {
    if (!submission) return
    setStatusBaru(STATUS.DIPROSES)
    const next = updateSubmission(submission.id, { status: STATUS.DIPROSES, catatanPetugas })
    if (next) {
      setSubmission(next)
      notifByStatus(next.status, next.catatanPetugas)
      showToast('Pengajuan diverifikasi dan diproses.', 'success')
    }
  }

  function perluPerbaikan() {
    if (!submission) return
    if (!catatanPetugas.trim()) {
      showToast('Isi catatan perbaikan terlebih dahulu.', 'danger')
      return
    }
    setStatusBaru(STATUS.PERLU_PERBAIKAN)
    const next = updateSubmission(submission.id, { status: STATUS.PERLU_PERBAIKAN, catatanPetugas })
    if (next) {
      setSubmission(next)
      notifByStatus(next.status, next.catatanPetugas)
      showToast('Status diubah: Perlu Perbaikan.', 'danger')
    }
  }

  function setujui() {
    if (!submission) return
    setStatusBaru(STATUS.DISETUJUI)
    const next = updateSubmission(submission.id, { status: STATUS.DISETUJUI, catatanPetugas })
    if (next) {
      setSubmission(next)
      notifByStatus(next.status, next.catatanPetugas)
      showToast('Pengajuan disetujui.', 'success')
    }
  }

  function buatSurat() {
    if (!submission) return
    const content = [
      'SURAT KETERANGAN',
      `Nomor: ${submission.id}`,
      '',
      `Nama Pemohon: ${submission?.pemohon?.nama || '-'}`,
      `NIK: ${submission?.pemohon?.nik || '-'}`,
      `Jenis Layanan: ${submission.layanan}`,
      `Tanggal Pengajuan: ${formatTanggalID(submission.createdAt)}`,
      '',
      'Keterangan:',
      submission.keteranganPemohon || '-',
      '',
      'Ditetapkan oleh Petugas Pelayanan Terpadu (dummy).',
    ].join('\n')

    const hasilSurat = {
      filename: `Surat-${submission.id}.txt`,
      content,
      createdAt: new Date().toISOString(),
    }
    setStatusBaru(STATUS.SELESAI)
    const next = updateSubmission(submission.id, { status: STATUS.SELESAI, catatanPetugas, hasilSurat })
    if (next) {
      setSubmission(next)
      notifByStatus(next.status, next.catatanPetugas)
      showToast('Surat berhasil dibuat dan status diselesaikan.', 'success')
    }
  }

  function cetak() {
    showToast('Membuka dialog cetak...', 'info')
    window.setTimeout(() => window.print(), 250)
  }

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
        <SidebarPetugas activeLabel="Daftar Pengajuan" />

        <main className="ptg-main">
          <header className="ptg-topbar">
            <div className="ptg-topbarTitle">
              <h1>Detail Pengajuan</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="ptg-topbarSearch" aria-label="Ringkasan pengajuan">
              <div className="ptg-search" style={{ background: 'rgba(255,255,255,.88)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path d="M8 8h8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  value={submission?.id ? `Nomor: ${submission.id}` : 'Nomor: -'}
                  readOnly
                  aria-label="Nomor pengajuan"
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
              <section className="ptg-card ptg-section" aria-label="Header detail pengajuan">
                <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                  <h2>Ringkasan</h2>
                  <div className="ptg-actionsRow">
                    <button type="button" className="ptg-btn" onClick={() => navigate('/petugas/pengajuan')}>
                      Kembali
                    </button>
                    <button type="button" className="ptg-btn" onClick={cetak}>
                      Cetak
                    </button>
                  </div>
                </div>
                <div className="ptg-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <div className="ptg-subtle">
                    Nomor: <strong className="ptg-mono">{submission?.id || '-'}</strong>
                  </div>
                  <div>{statusBaru ? <span className={getStatusClass(statusBaru)}>{statusBaru}</span> : null}</div>
                </div>
              </section>

              <div className="ptg-gridTwo">
                <div className="ptg-stack">
                  <section className="ptg-card ptg-section" aria-label="Informasi pemohon">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Informasi Pemohon</h2>
                      <div className="ptg-subtle">Data identitas</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <dl className="ptg-kv">
                        <dt>Nama</dt>
                        <dd>{submission?.pemohon?.nama || '-'}</dd>

                        <dt>NIK</dt>
                        <dd className="ptg-mono">{submission?.pemohon?.nik || '-'}</dd>

                        <dt>Username</dt>
                        <dd className="ptg-mono">{submission?.pemohon?.username || '-'}</dd>
                      </dl>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Informasi pengajuan">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Informasi Pengajuan</h2>
                      <div className="ptg-subtle">Nomor & layanan</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <dl className="ptg-kv">
                        <dt>Nomor Pengajuan</dt>
                        <dd className="ptg-mono">{submission?.id || '-'}</dd>

                        <dt>Jenis Layanan</dt>
                        <dd>{submission?.layanan || '-'}</dd>

                        <dt>Tanggal Pengajuan</dt>
                        <dd>{submission?.createdAt ? formatTanggalID(submission.createdAt) : '-'}</dd>

                        <dt>Keterangan Pemohon</dt>
                        <dd style={{ fontWeight: 750, color: 'var(--ptg-muted)' }}>{submission?.keteranganPemohon || '-'}</dd>

                        <dt>Catatan Petugas</dt>
                        <dd style={{ fontWeight: 850 }}>{catatanPetugas || '-'}</dd>
                      </dl>
                    </div>
                  </section>

                  <section className="ptg-card ptg-section" aria-label="Lampiran pengajuan">
                    <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                      <h2>Lampiran</h2>
                      <div className="ptg-subtle">Nama file lampiran</div>
                    </div>
                    <div className="ptg-divider" />
                    <div style={{ marginTop: 12 }}>
                      <div className="ptg-attachments">
                        {lampiran.length === 0 ? (
                          <div className="ptg-hint">Tidak ada lampiran.</div>
                        ) : (
                          lampiran.map((file) => (
                            <div key={file.id} className="ptg-file">
                              <div className="ptg-fileIcon" aria-hidden="true">
                                {file.ext}
                              </div>
                              <div className="ptg-fileMeta">
                                <strong>{file.label}</strong>
                                <span title={file.filename}>{file.filename}</span>
                                <em>Tersedia</em>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="ptg-hint" style={{ marginTop: 10 }}>
                        Catatan: Saat integrasi backend, lampiran dapat ditingkatkan menjadi preview gambar/PDF dan validasi
                        kelengkapan dokumen.
                      </p>
                    </div>
                  </section>
                </div>

                <aside className="ptg-card ptg-section" aria-label="Aksi petugas">
                  <div className="ptg-sectionHeader" style={{ marginBottom: 0 }}>
                    <h2>Aksi Petugas</h2>
                    <div className="ptg-subtle">Ubah status & catatan</div>
                  </div>
                  <div className="ptg-divider" />

                  <div style={{ marginTop: 12 }} className="ptg-stack">
                    <div className="ptg-field">
                      <div className="ptg-label">Ubah Status</div>
                      <select
                        className="ptg-select"
                        value={statusBaru}
                        onChange={(e) => setStatusBaru(e.target.value)}
                        aria-label="Ubah status pengajuan"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ptg-field">
                      <div className="ptg-label">Catatan Petugas</div>
                      <textarea
                        className="ptg-textarea"
                        value={catatanPetugas}
                        onChange={(e) => setCatatanPetugas(e.target.value)}
                        placeholder="Tulis catatan verifikasi, kekurangan berkas, atau tindak lanjut..."
                        aria-label="Catatan petugas"
                      />
                    </div>

                    <div className="ptg-actionRow">
                      <button type="button" className="ptg-btn ptg-btnPrimary" onClick={simpanPerubahan}>
                        Simpan Perubahan
                      </button>
                      <button type="button" className="ptg-btn" onClick={verifikasi}>
                        Verifikasi
                      </button>
                      <button type="button" className="ptg-btn" onClick={setujui}>
                        Setujui
                      </button>
                      <button type="button" className="ptg-btn" onClick={buatSurat}>
                        Buat Surat
                      </button>
                      <button type="button" className="ptg-btn ptg-btnDanger" onClick={perluPerbaikan}>
                        Perlu Perbaikan
                      </button>
                    </div>

                    <p className="ptg-hint" style={{ margin: 0 }}>
                      Tombol <strong>Verifikasi</strong>, <strong>Setujui</strong>, <strong>Perlu Perbaikan</strong>, dan{' '}
                      <strong>Buat Surat</strong> mengubah status pengajuan serta memicu notifikasi (mock).
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
