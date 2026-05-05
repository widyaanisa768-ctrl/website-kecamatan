import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATUS, deleteSubmission, getAuth, listSubmissionsByUsername } from '../lib/rkLocal'

function formatDateTime(date) {
  try {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function isEditable(status) {
  return status === STATUS.MENUNGGU || status === STATUS.PERLU_PERBAIKAN || status === STATUS.DITOLAK
}

function statusLabel(status) {
  if (status === STATUS.MENUNGGU) return 'Menunggu verifikasi'
  if (status === STATUS.DIPROSES) return 'Sedang diproses'
  if (status === STATUS.DISETUJUI) return 'Diterima'
  if (status === STATUS.SELESAI) return 'Selesai'
  if (status === STATUS.PERLU_PERBAIKAN) return 'Ditolak'
  if (status === STATUS.DITOLAK) return 'Ditolak'
  return status || '-'
}

function badgeClass(status) {
  if (status === STATUS.MENUNGGU) return 'is-waiting'
  if (status === STATUS.DIPROSES) return 'is-process'
  if (status === STATUS.DISETUJUI) return 'is-approve'
  if (status === STATUS.SELESAI) return 'is-done'
  if (status === STATUS.PERLU_PERBAIKAN || status === STATUS.DITOLAK) return 'is-reject'
  return ''
}

function statusMessage(status) {
  if (status === STATUS.MENUNGGU) return 'Pengajuan Anda sudah berhasil dikirim dan sedang menunggu verifikasi petugas.'
  if (status === STATUS.DIPROSES) return 'Pengajuan Anda sedang diproses oleh petugas.'
  if (status === STATUS.DISETUJUI) return 'Pengajuan Anda telah diterima.'
  if (status === STATUS.SELESAI) return 'Dokumen Anda sudah selesai dan dapat diunduh.'
  if (status === STATUS.PERLU_PERBAIKAN) return 'Pengajuan Anda ditolak. Silakan cek catatan petugas.'
  if (status === STATUS.DITOLAK) return 'Pengajuan Anda ditolak. Silakan cek catatan petugas.'
  return ''
}

function downloadHasilSurat(hasilSurat) {
  if (!hasilSurat?.content || !hasilSurat?.filename) return
  const blob = new Blob([hasilSurat.content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = hasilSurat.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function PengajuanSaya() {
  const navigate = useNavigate()
  const auth = getAuth()

  const username = auth?.role === 'masyarakat' ? auth.username : ''

  const [items, setItems] = useState(() => (username ? listSubmissionsByUsername(username) : []))
  const [active, setActive] = useState(null)

  useEffect(() => {
    const refresh = () => setItems(username ? listSubmissionsByUsername(username) : [])
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [username])

  const activeStatus = active?.status
  const canEdit = isEditable(activeStatus)
  const canDownload = activeStatus === STATUS.SELESAI && !!active?.hasilSurat?.filename

  const dataEntries = useMemo(() => {
    const data = active?.data && typeof active.data === 'object' ? active.data : null
    if (!data) return []
    return Object.entries(data).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
  }, [active])

  function close() {
    setActive(null)
  }

  function onDetail(item) {
    setActive(item)
  }

  function goEdit(item) {
    const to = item?.layananPath
    if (!to) {
      alert('Form layanan untuk pengajuan ini tidak ditemukan.')
      return
    }
    navigate(`${to}?edit=${encodeURIComponent(item.id)}`)
  }

  function onDelete(item) {
    const ok = window.confirm(`Hapus pengajuan "${item.id}"?`)
    if (!ok) return
    try {
      deleteSubmission(item.id)
      close()
      setItems(username ? listSubmissionsByUsername(username) : [])
      alert('Pengajuan berhasil dihapus.')
    } catch {
      alert('Gagal menghapus pengajuan.')
    }
  }

  function onResubmit(item) {
    if (!item) return
    if (!isEditable(item.status)) return
    if (item.status !== STATUS.DITOLAK && item.status !== STATUS.PERLU_PERBAIKAN) {
      goEdit(item)
      return
    }
    // Arahkan ke form edit; saat submit form akan mengubah status kembali ke MENUNGGU.
    goEdit(item)
  }

  return (
    <section className="rk-pageSection" aria-label="Riwayat pengajuan saya">
      <style>{`
        .rk-mySubWrap { display: grid; gap: 14px; }
        .rk-mySubHead { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; }
        .rk-mySubHead h2 { margin: 0; }
        .rk-mySubCard { border: 1px solid rgba(0,0,0,.08); border-radius: 16px; padding: 14px; background: rgba(255,255,255,.7); box-shadow: 0 10px 24px rgba(0,0,0,.05); }
        .rk-mySubRow { display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(0,0,0,.06); }
        .rk-mySubRow:first-child { border-top: none; padding-top: 0; }
        .rk-mySubMeta { min-width: 0; }
        .rk-mySubId { font-weight: 800; color: #111; }
        .rk-mySubSub { font-size: 13px; opacity: .9; margin-top: 2px; }
        .rk-mySubBadge { font-size: 12px; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,.1); font-weight: 900; }
        .rk-mySubBadge.is-waiting { background: rgba(245, 158, 11, .12); border-color: rgba(245, 158, 11, .28); color: #7a4a00; }
        .rk-mySubBadge.is-process { background: rgba(59, 130, 246, .12); border-color: rgba(59, 130, 246, .28); color: #0b3a7a; }
        .rk-mySubBadge.is-reject { background: rgba(220, 38, 38, .12); border-color: rgba(220, 38, 38, .28); color: #7a0b0b; }
        .rk-mySubBadge.is-approve { background: rgba(16, 185, 129, .12); border-color: rgba(16, 185, 129, .28); color: #065f46; }
        .rk-mySubBadge.is-done { background: rgba(34, 197, 94, .12); border-color: rgba(34, 197, 94, .28); color: #14532d; }
        .rk-mySubActions { display:flex; align-items:center; gap: 8px; flex-shrink: 0; }
        .rk-miniBtn2 { display:inline-flex; align-items:center; justify-content:center; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(0,0,0,.14); background: #fff; cursor: pointer; font-weight: 800; font-size: 13px; line-height: 1.1; color: var(--rk-text, #1d2a3a) !important; -webkit-text-fill-color: var(--rk-text, #1d2a3a) !important; opacity: 1 !important; visibility: visible !important; }
        .rk-miniBtn2 > * { color: inherit !important; -webkit-text-fill-color: inherit !important; opacity: 1 !important; visibility: visible !important; }
        .rk-miniBtn2 svg { width: 16px; height: 16px; flex: 0 0 auto; color: inherit !important; }
        .rk-miniBtn2:disabled { opacity: .55; cursor: not-allowed; }
        .rk-modalOverlay { position:fixed; inset:0; background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding: 18px; z-index: 50; }
        .rk-modal { width: min(860px, 100%); background: #fff; border-radius: 18px; border: 1px solid rgba(0,0,0,.12); box-shadow: 0 22px 70px rgba(0,0,0,.22); overflow:hidden; }
        .rk-modalHead { padding: 14px 16px; display:flex; align-items:flex-start; justify-content:space-between; gap: 10px; border-bottom: 1px solid rgba(0,0,0,.08); }
        .rk-modalTitle { font-weight: 900; color: #111; }
        .rk-modalBody { padding: 14px 16px; display:grid; gap: 12px; }
        .rk-statusBox { border: 1px solid rgba(0,0,0,.12); border-radius: 14px; padding: 12px; background: rgba(64,107,34,.06); }
        .rk-statusBox.isReject { background: rgba(220,38,38,.06); border-color: rgba(220,38,38,.22); }
        .rk-statusTop { display:flex; align-items:center; justify-content:space-between; gap: 12px; }
        .rk-kv { display:grid; grid-template-columns: 170px 1fr; gap: 8px 12px; font-size: 14px; }
        .rk-kv dt { font-weight: 900; color: #111; }
        .rk-kv dd { margin: 0; opacity: .95; }
        .rk-modalFoot { padding: 14px 16px; display:flex; flex-wrap:wrap; gap: 10px; justify-content:flex-end; border-top: 1px solid rgba(0,0,0,.08); background: rgba(0,0,0,.02); }
      `}</style>

      <div className="rk-container">
        <div className="rk-mySubWrap">
          <div className="rk-mySubHead">
            <div>
              <p className="rk-pageKicker">Pengajuan</p>
              <h2>Riwayat Pengajuan Saya</h2>
              <p className="rk-pageSubtitle">Daftar pengajuan yang pernah Anda kirim (hanya milik akun Anda).</p>
            </div>
          </div>

          <div className="rk-mySubCard" role="region" aria-label="Daftar pengajuan">
            {!username ? (
              <div style={{ opacity: 0.9 }}>Silakan login untuk melihat pengajuan Anda.</div>
            ) : items.length === 0 ? (
              <div style={{ opacity: 0.9 }}>Belum ada pengajuan. Silakan ajukan layanan melalui daftar layanan di atas.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rk-mySubRow">
                  <div className="rk-mySubMeta">
                    <div className="rk-mySubId">{item.id}</div>
                    <div className="rk-mySubSub">
                      {item.layanan} • {formatDateTime(item.createdAt)}
                    </div>
                  </div>

                  <div className="rk-mySubActions">
                    <span className={`rk-mySubBadge ${badgeClass(item.status)}`} title={item.status}>
                      {statusLabel(item.status)}
                    </span>
                    <button type="button" className="rk-miniBtn2" onClick={() => onDetail(item)}>
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {active ? (
        <div className="rk-modalOverlay" role="dialog" aria-modal="true" aria-label="Detail pengajuan">
          <div className="rk-modal">
            <div className="rk-modalHead">
              <div>
                <div className="rk-modalTitle">Detail Pengajuan</div>
                <div style={{ marginTop: 4, opacity: 0.9, fontSize: 13 }}>
                  {active.id} • {active.layanan}
                </div>
              </div>
              <button type="button" className="rk-miniBtn2" onClick={close}>
                Tutup
              </button>
            </div>

            <div className="rk-modalBody">
              <div className={`rk-statusBox ${activeStatus === STATUS.DITOLAK || activeStatus === STATUS.PERLU_PERBAIKAN ? 'isReject' : ''}`}>
                <div className="rk-statusTop">
                  <div style={{ fontWeight: 900, color: '#111' }}>Status: {statusLabel(activeStatus)}</div>
                  {canDownload ? (
                    <button type="button" className="rk-miniBtn2" onClick={() => downloadHasilSurat(active.hasilSurat)}>
                      Unduh Dokumen
                    </button>
                  ) : null}
                </div>
                <div style={{ marginTop: 6, opacity: 0.95 }}>{statusMessage(activeStatus)}</div>
                {(activeStatus === STATUS.DITOLAK || activeStatus === STATUS.PERLU_PERBAIKAN) && active?.catatanPetugas ? (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,.08)' }}>
                    <div style={{ fontWeight: 900, color: '#111' }}>Catatan Petugas</div>
                    <div style={{ marginTop: 4, opacity: 0.95 }}>{active.catatanPetugas}</div>
                  </div>
                ) : null}
              </div>

              <div className="rk-mySubCard" aria-label="Ringkasan data pengajuan">
                <dl className="rk-kv">
                  <dt>Tanggal</dt>
                  <dd>{formatDateTime(active.createdAt)}</dd>
                  <dt>Terakhir Update</dt>
                  <dd>{formatDateTime(active.updatedAt)}</dd>
                  <dt>Keterangan</dt>
                  <dd>{active.keteranganPemohon || '-'}</dd>
                </dl>
              </div>

              <div className="rk-mySubCard" aria-label="Data form">
                <div style={{ fontWeight: 900, color: '#111', marginBottom: 8 }}>Data Form</div>
                {dataEntries.length === 0 ? (
                  <div style={{ opacity: 0.9 }}>Data form tersimpan belum tersedia (versi pengajuan lama).</div>
                ) : (
                  <dl className="rk-kv">
                    {dataEntries.map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}>
                        <dt>{k}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>

            <div className="rk-modalFoot">
              {activeStatus === STATUS.DITOLAK || activeStatus === STATUS.PERLU_PERBAIKAN ? (
                <button type="button" className="rk-miniBtn2" onClick={() => onResubmit(active)}>
                  Kirim Ulang
                </button>
              ) : null}

              {canEdit ? (
                <>
                  <button type="button" className="rk-miniBtn2" onClick={() => goEdit(active)}>
                    Edit
                  </button>
                  <button type="button" className="rk-miniBtn2" onClick={() => goEdit(active)}>
                    Tambah
                  </button>
                  <button type="button" className="rk-miniBtn2" onClick={() => onDelete(active)}>
                    Hapus
                  </button>
                </>
              ) : null}

              {!canEdit ? (
                <button type="button" className="rk-miniBtn2" disabled>
                  Edit/Hapus/Tambah dinonaktifkan setelah diverifikasi
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
