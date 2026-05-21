import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATUS, getAuth } from '../lib/rkLocal'
import { getDetailPengajuan, getPengajuanSaya } from '../services/pengajuanService'

function safeParse(raw, fallback = null) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getStoredUser() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem('user'), null)
}

function getStoredRole() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('role') || ''
}

function getStoredToken() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('accessToken') || window.localStorage.getItem('token') || ''
}

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

export default function PengajuanSaya({ variant = 'default' } = {}) {
  const navigate = useNavigate()
  const auth = getAuth()
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getStoredToken()
    const user = getStoredUser()
    if (!token || !user) {
      navigate('/login', { replace: true })
      return undefined
    }

    const refresh = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getPengajuanSaya()
        if (!res?.success) {
          setItems([])
          setError(res?.message || 'Gagal memuat pengajuan.')
          return
        }
        setItems(res.items || [])
      } finally {
        setLoading(false)
      }
    }

    void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [navigate])

  function getId(item) {
    return item?.id || item?._id || item?.pengajuan_id || item?.uuid || ''
  }

  function getLayanan(item) {
    return item?.jenis_layanan || item?.layanan || item?.service || item?.title || '-'
  }

  function getNama(item) {
    const layanan = String(getLayanan(item) || '')
    const isPenelitian =
      item?.__endpoint === '/rekomendasi_penelitian' || layanan.toLowerCase().includes('penelitian') || layanan.toLowerCase().includes('riset')

    const data = item?.data_form && typeof item.data_form === 'object' ? item.data_form : item?.data && typeof item.data === 'object' ? item.data : {}

    const pick = (key) => item?.[key] || data?.[key] || ''

    if (isPenelitian) {
      const namaPeneliti = pick('nama_peneliti')
      if (String(namaPeneliti).trim()) return String(namaPeneliti)
    }

    const orderedKeys = ['nama_pemohon', 'nama_peneliti', 'nama_lengkap', 'nama', 'nama_pengaju', 'pemohon']
    for (const key of orderedKeys) {
      const v = pick(key)
      if (String(v).trim()) return String(v)
    }
    return '-'
  }

  function getCreatedAt(item) {
    return item?.createdAt || item?.created_at || item?.tanggal_pengajuan || item?.tanggalPengajuan || item?.created || null
  }

  function getUpdatedAt(item) {
    return item?.updatedAt || item?.updated_at || item?.tanggal_update || item?.tanggalUpdate || null
  }

  function getStatus(item) {
    return item?.status || item?.status_pengajuan || item?.statusPengajuan || STATUS.MENUNGGU
  }

  const visibleItems = useMemo(() => {
    const list = Array.isArray(items) ? items : []

    const storedUser = getStoredUser()
    const storedRole = storedUser?.role || getStoredRole() || ''
    const role = String(auth?.role || storedRole || '').toLowerCase()

    const privileged = role === 'petugas' || role === 'admin' || role === 'kepala_camat'
    if (privileged) return list

    if (role !== 'masyarakat') return list

    const userId = String(storedUser?.id || storedUser?.user_id || storedUser?.id_user || storedUser?._id || '').trim()

    const getOwnerId = (it) => {
      const direct =
        it?.user_id ||
        it?.id_user ||
        it?.pemohon_id ||
        it?.masyarakat_id ||
        it?.masyarakatId ||
        it?.userId ||
        it?.idUser ||
        it?.created_by ||
        it?.createdBy ||
        it?.pemohon?.pemohon_id ||
        it?.pemohon?.id ||
        it?.pemohon?.user_id ||
        it?.pemohon?.id_user ||
        it?.pemohon?._id ||
        it?.user?.id ||
        it?.user?.user_id ||
        it?.user?.id_user ||
        it?.user?._id ||
        it?.masyarakat?.id ||
        it?.masyarakat?._id ||
        it?.masyarakat?.user_id ||
        it?.masyarakat?.id_user ||
        ''
      return direct ? String(direct).trim() : ''
    }

    const hasOwnerField = list.some((it) => !!getOwnerId(it))
    if (!hasOwnerField) {
      // TODO: Backend belum mengirim field owner per item (user_id/id_user/pemohon_id/created_by/masyarakat_id).
      // Sesuai instruksi: jangan filter dulu, tampilkan data dan beri peringatan.
      if (import.meta.env.DEV) console.warn('[status-pengajuan] owner field tidak ditemukan pada item; skip filter untuk masyarakat.')
      return list
    }

    if (!userId) {
      if (import.meta.env.DEV) console.warn('[status-pengajuan] user id tidak ditemukan di localStorage.user; skip filter untuk masyarakat.')
      return list
    }

    const filtered = list.filter((it) => getOwnerId(it) === userId)

    if (import.meta.env.DEV) {
      const sample = list[0]
      console.log('[status-pengajuan] user login:', storedUser)
      console.log('[status-pengajuan] contoh item pertama:', sample)
      console.log('[status-pengajuan] jumlah sebelum filter:', list.length)
      console.log('[status-pengajuan] jumlah setelah filter:', filtered.length)
      if (filtered.length === 0 && list.length > 0) {
        const ownerSamples = list
          .map((it) => getOwnerId(it))
          .filter(Boolean)
          .slice(0, 8)
        console.warn('[status-pengajuan] hasil filter 0. userId=', userId, 'contoh ownerId item=', ownerSamples)
      }
    }

    return filtered
  }, [items, auth?.role])

  const counts = useMemo(() => {
    const list = Array.isArray(visibleItems) ? visibleItems : []
    const isWaiting = (s) => s === STATUS.MENUNGGU
    const isProcess = (s) => s === STATUS.DIPROSES
    const isDone = (s) => s === STATUS.SELESAI || s === STATUS.DISETUJUI
    return {
      total: list.length,
      menunggu: list.filter((it) => isWaiting(getStatus(it))).length,
      diproses: list.filter((it) => isProcess(getStatus(it))).length,
      selesai: list.filter((it) => isDone(getStatus(it))).length,
    }
  }, [visibleItems])

  const activeStatus = getStatus(active)
  const canEdit = isEditable(activeStatus)
  const canDownload = activeStatus === STATUS.SELESAI && !!active?.hasilSurat?.filename

  const dataEntries = useMemo(() => {
    if (!active || typeof active !== 'object') return []
    const data = active?.data_form || active?.data
    const source = data && typeof data === 'object' ? data : active
    return Object.entries(source).filter(([, v]) => v !== undefined && v !== null && String(v).trim?.() !== '')
  }, [active])

  function close() {
    setActive(null)
  }

  function onDetail(item) {
    const id = getId(item)
    if (!id) {
      setActive(item)
      return
    }

    void (async () => {
      const res = await getDetailPengajuan(id)
      if (res?.success) setActive(res.data || item)
      else setActive(item)
    })()
  }

  return (
    <section className="rk-pageSection" aria-label="Riwayat pengajuan saya">
      <style>{`
        .rk-mySubWrap { display: grid; gap: 14px; }
        .rk-mySubHead { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; }
        .rk-mySubHead h2 { margin: 0; }
        .rk-mySubCard { border: 1px solid rgba(0,0,0,.08); border-radius: 16px; padding: 14px; background: rgba(255,255,255,.7); box-shadow: 0 10px 24px rgba(0,0,0,.05); }
        .rk-mySubCard.isCompact { padding: 12px; border-radius: 14px; }
        .rk-mySubRow { display:flex; align-items:center; justify-content:space-between; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(0,0,0,.06); }
        .rk-mySubRow:first-child { border-top: none; padding-top: 0; }
        .rk-mySubMeta { min-width: 0; }
        .rk-mySubName { font-weight: 900; color: #111; }
        .rk-mySubNo { font-size: 12px; opacity: .78; margin-top: 2px; }
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

        .rk-summaryGrid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .rk-summaryCard { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(11,79,124,.12); background: rgba(255,255,255,.82); box-shadow: 0 10px 22px rgba(16,52,83,.06); }
        .rk-summaryLabel { font-size: 12px; font-weight: 900; opacity: .85; color: rgba(29,42,58,.92); }
        .rk-summaryValue { margin-top: 6px; font-size: 20px; font-weight: 950; color: #061c32; letter-spacing: -.2px; }
        .rk-summaryHint { margin-top: 4px; font-size: 12px; opacity: .72; }
        .rk-summaryCard.isWaiting { border-color: rgba(245,158,11,.26); }
        .rk-summaryCard.isProcess { border-color: rgba(59,130,246,.26); }
        .rk-summaryCard.isDone { border-color: rgba(16,185,129,.26); }

        @media (max-width: 900px) { .rk-summaryGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 520px) { .rk-summaryGrid { grid-template-columns: 1fr; } .rk-mySubRow { align-items:flex-start; } }
      `}</style>

      <div className="rk-container">
        <div className="rk-mySubWrap">
          {variant === 'default' ? (
            <div className="rk-mySubHead">
              <div>
                <p className="rk-pageKicker">Pengajuan</p>
                <h2>Riwayat Pengajuan Saya</h2>
                <p className="rk-pageSubtitle">Daftar pengajuan yang pernah Anda kirim (hanya milik akun Anda).</p>
              </div>
            </div>
          ) : (
            <div className="rk-summaryGrid" aria-label="Ringkasan status pengajuan">
              <div className="rk-summaryCard">
                <div className="rk-summaryLabel">Total Pengajuan</div>
                <div className="rk-summaryValue">{loading ? '—' : counts.total}</div>
                <div className="rk-summaryHint">Semua layanan</div>
              </div>
              <div className="rk-summaryCard isWaiting">
                <div className="rk-summaryLabel">Menunggu Verifikasi</div>
                <div className="rk-summaryValue">{loading ? '—' : counts.menunggu}</div>
                <div className="rk-summaryHint">Belum diproses</div>
              </div>
              <div className="rk-summaryCard isProcess">
                <div className="rk-summaryLabel">Diproses</div>
                <div className="rk-summaryValue">{loading ? '—' : counts.diproses}</div>
                <div className="rk-summaryHint">Sedang berjalan</div>
              </div>
              <div className="rk-summaryCard isDone">
                <div className="rk-summaryLabel">Selesai / Disetujui</div>
                <div className="rk-summaryValue">{loading ? '—' : counts.selesai}</div>
                <div className="rk-summaryHint">Sudah final</div>
              </div>
            </div>
          )}

          <div className={`rk-mySubCard ${variant !== 'default' ? 'isCompact' : ''}`} role="region" aria-label="Daftar pengajuan">
            {loading ? (
              <div style={{ opacity: 0.9 }}>Memuat data pengajuan...</div>
            ) : error ? (
              <div style={{ opacity: 0.95, color: 'rgba(122,18,18,.92)' }}>{error}</div>
            ) : visibleItems.length === 0 ? (
              <div style={{ opacity: 0.9, display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 950, color: '#111' }}>Belum ada pengajuan</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>Silakan ajukan layanan online terlebih dahulu, lalu status akan muncul di sini.</div>
              </div>
            ) : (
              visibleItems.map((item) => (
                <div key={getId(item) || JSON.stringify(item)} className="rk-mySubRow">
                  <div className="rk-mySubMeta">
                    <div className="rk-mySubName">{getNama(item)}</div>
                    {getId(item) ? <div className="rk-mySubNo">No: {getId(item)}</div> : null}
                    <div className="rk-mySubSub">
                      {getLayanan(item)} • {formatDateTime(getCreatedAt(item))}
                    </div>
                  </div>

                  <div className="rk-mySubActions">
                    <span className={`rk-mySubBadge ${badgeClass(getStatus(item))}`} title={getStatus(item)}>
                      {statusLabel(getStatus(item))}
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
                  {getId(active)} • {getLayanan(active)}
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
                  <dd>{formatDateTime(getCreatedAt(active))}</dd>
                  <dt>Terakhir Update</dt>
                  <dd>{formatDateTime(getUpdatedAt(active))}</dd>
                  <dt>Keterangan</dt>
                  <dd>{active?.keterangan || active?.keteranganPemohon || '-'}</dd>
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
              {canEdit ? (
                <button type="button" className="rk-miniBtn2" disabled>
                  Edit/Hapus belum tersedia
                </button>
              ) : (
                <button type="button" className="rk-miniBtn2" disabled>
                  Status terkunci setelah diproses
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
