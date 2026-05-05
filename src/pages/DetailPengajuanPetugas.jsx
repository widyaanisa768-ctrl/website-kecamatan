import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import SidebarPetugas from '../components/SidebarPetugas'
import { STATUS, getSubmissionById, pushNotif, updateSubmission } from '../lib/rkLocal'

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
      return 'dpt-badge dpt-badge--waiting'
    case STATUS.PERLU_PERBAIKAN:
      return 'dpt-badge dpt-badge--reject'
    case STATUS.DIPROSES:
      return 'dpt-badge dpt-badge--process'
    case STATUS.DISETUJUI:
    case STATUS.SELESAI:
      return 'dpt-badge dpt-badge--done'
    case STATUS.DITOLAK:
      return 'dpt-badge dpt-badge--reject'
    default:
      return 'dpt-badge'
  }
}

export default function DetailPengajuanPetugas() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()

  const today = useMemo(() => new Date(), [])
  const activeMenu = 'Daftar Pengajuan'
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
    <div className="dpt-page">
      <style>{`
        :root{
          --dpt-navy:#0B2A4A;
          --dpt-navy-2:#0E3A67;
          --dpt-white:#FFFFFF;
          --dpt-bg:#F4F7FB;
          --dpt-surface:#FFFFFF;
          --dpt-surface-2:#F9FBFF;
          --dpt-gold:#C9A227;
          --dpt-gold-soft:#E7D6A2;
          --dpt-text:#102033;
          --dpt-muted:#66768A;
          --dpt-border:rgba(11, 42, 74, .12);
          --dpt-shadow:0 12px 26px rgba(16, 32, 51, .08);
        }
        .dpt-page{min-height:100vh;background:var(--dpt-bg);color:var(--dpt-text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;}
        .dpt-shell{display:flex;min-height:100vh;}
        .dpt-sidebar{
          width:280px;flex:0 0 280px;background:linear-gradient(180deg,var(--dpt-navy),#081E34);
          color:var(--dpt-white);padding:18px 14px;border-right:1px solid rgba(255,255,255,.08);
          position:sticky;top:0;height:100vh;
        }
        .dpt-brand{display:flex;align-items:center;gap:12px;padding:8px 10px;margin-bottom:14px;}
        .dpt-logo{
          width:44px;height:44px;border-radius:12px;
          background:linear-gradient(135deg,var(--dpt-gold),var(--dpt-gold-soft));
          display:grid;place-items:center;color:var(--dpt-navy);font-weight:900;letter-spacing:.5px;
          box-shadow:0 10px 20px rgba(201,162,39,.22);
        }
        .dpt-brandTitle{display:flex;flex-direction:column;line-height:1.15;}
        .dpt-brandTitle strong{font-size:14px;letter-spacing:.2px;}
        .dpt-brandTitle span{font-size:12px;color:rgba(255,255,255,.72);}
        .dpt-nav{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
        .dpt-navBtn{
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:var(--dpt-white);
          padding:12px 12px;border-radius:14px;cursor:pointer;
          display:flex;align-items:center;gap:10px;
          transition:transform .12s ease, background .12s ease, border-color .12s ease;
          text-align:left;
        }
        .dpt-navBtn:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);}
        .dpt-navBtn.is-active{background:rgba(201,162,39,.16);border-color:rgba(201,162,39,.35);}
        .dpt-navDot{width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.45);box-shadow:0 0 0 6px rgba(255,255,255,.04) inset;}
        .dpt-navBtn.is-active .dpt-navDot{background:var(--dpt-gold);box-shadow:0 0 0 6px rgba(201,162,39,.18) inset;}
        .dpt-navText{font-size:13px;font-weight:700;letter-spacing:.2px;}
        .dpt-sidebarFoot{
          margin-top:auto;padding:12px 10px;border-top:1px solid rgba(255,255,255,.10);
          color:rgba(255,255,255,.72);font-size:12px;
        }
        .dpt-main{flex:1;display:flex;flex-direction:column;}
        .dpt-topbar{
          height:72px;display:flex;align-items:center;justify-content:space-between;
          padding:14px 22px;border-bottom:1px solid var(--dpt-border);
          background:rgba(255,255,255,.72);backdrop-filter:blur(8px);
          position:sticky;top:0;z-index:5;
        }
        .dpt-topbarTitle{display:flex;flex-direction:column;gap:2px;}
        .dpt-topbarTitle h1{margin:0;font-size:16px;letter-spacing:.2px;color:var(--dpt-navy);}
        .dpt-topbarTitle p{margin:0;font-size:12px;color:var(--dpt-muted);}
        .dpt-profile{display:flex;align-items:center;gap:12px;}
        .dpt-avatar{
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,var(--dpt-navy-2),var(--dpt-navy));
          box-shadow:0 10px 20px rgba(11,42,74,.18);
          display:grid;place-items:center;color:var(--dpt-white);font-weight:900;
        }
        .dpt-profileMeta{display:flex;flex-direction:column;line-height:1.15;}
        .dpt-profileMeta strong{font-size:13px;}
        .dpt-profileMeta span{font-size:12px;color:var(--dpt-muted);}

        .dpt-content{padding:18px 22px 28px;}
        .dpt-card{
          background:var(--dpt-surface);
          border:1px solid var(--dpt-border);
          border-radius:18px;
          box-shadow:0 12px 24px rgba(16,32,51,.06);
        }

        .dpt-header{padding:16px;}
        .dpt-headerTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .dpt-titleWrap{display:flex;flex-direction:column;gap:6px;}
        .dpt-kicker{
          display:inline-flex;align-items:center;gap:10px;
          font-size:12px;font-weight:900;letter-spacing:.22px;color:var(--dpt-navy);
        }
        .dpt-kickerLine{width:24px;height:2px;background:linear-gradient(90deg,var(--dpt-gold),transparent);}
        .dpt-title{margin:0;font-size:18px;color:var(--dpt-navy);letter-spacing:.2px;}
        .dpt-subtitle{margin:0;font-size:13px;color:var(--dpt-muted);max-width:78ch;}
        .dpt-headActions{display:flex;gap:10px;flex-wrap:wrap;}
        .dpt-btn{
          border:1px solid rgba(11,42,74,.18);
          background:linear-gradient(180deg,#FFFFFF,#F6FAFF);
          color:var(--dpt-navy);
          padding:10px 12px;border-radius:14px;font-weight:900;font-size:12px;cursor:pointer;
          transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          white-space:nowrap;
        }
        .dpt-btn:hover{transform:translateY(-1px);box-shadow:0 10px 18px rgba(11,42,74,.10);border-color:rgba(11,42,74,.26);}
        .dpt-btnPrimary{
          border:1px solid rgba(201,162,39,.40);
          background:linear-gradient(180deg, rgba(201,162,39,.95), rgba(231,214,162,.95));
          color:#1B2A3A;
        }
        .dpt-btnDanger{
          border:1px solid rgba(239,68,68,.30);
          background:linear-gradient(180deg, rgba(239,68,68,.12), rgba(255,255,255,.76));
          color:#7A1E1E;
        }
        .dpt-divider{height:1px;background:var(--dpt-border);margin-top:12px;}

        .dpt-grid{margin-top:14px;display:grid;grid-template-columns:1.5fr .9fr;gap:14px;align-items:start;}
        .dpt-stack{display:flex;flex-direction:column;gap:14px;}
        .dpt-cardHeader{
          padding:14px 16px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;
        }
        .dpt-cardHeader h2{margin:0;font-size:14px;color:var(--dpt-navy);letter-spacing:.2px;}
        .dpt-subtle{font-size:12px;color:var(--dpt-muted);}
        .dpt-cardBody{padding:0 16px 16px;}

        .dpt-kv{
          display:grid;
          grid-template-columns:180px 1fr;
          gap:10px 14px;
          border:1px solid var(--dpt-border);
          border-radius:16px;
          padding:14px;
          background:linear-gradient(180deg,#FFFFFF,#FBFDFF);
        }
        .dpt-kv dt{margin:0;color:var(--dpt-muted);font-size:12px;font-weight:900;}
        .dpt-kv dd{margin:0;color:var(--dpt-text);font-weight:800;font-size:13px;}
        .dpt-mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;letter-spacing:.2px;}

        .dpt-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 10px;border-radius:999px;border:1px solid var(--dpt-border);
          font-size:12px;font-weight:900;letter-spacing:.15px;
          background:#fff;
        }
        .dpt-badge::before{content:"";width:8px;height:8px;border-radius:999px;background:#94A3B8;}
        .dpt-badge--waiting{background:rgba(250, 204, 21, .16);border-color:rgba(250, 204, 21, .40);color:#7A5A00;}
        .dpt-badge--waiting::before{background:#FACC15;}
        .dpt-badge--process{background:rgba(59, 130, 246, .14);border-color:rgba(59, 130, 246, .35);color:#0B3A7A;}
        .dpt-badge--process::before{background:#3B82F6;}
        .dpt-badge--done{background:rgba(34, 197, 94, .14);border-color:rgba(34, 197, 94, .35);color:#155D2E;}
        .dpt-badge--done::before{background:#22C55E;}
        .dpt-badge--reject{background:rgba(239, 68, 68, .12);border-color:rgba(239, 68, 68, .35);color:#7A1E1E;}
        .dpt-badge--reject::before{background:#EF4444;}

        .dpt-attachments{display:grid;grid-template-columns:repeat(3, minmax(0, 1fr));gap:10px;}
        .dpt-file{
          border:1px solid rgba(11,42,74,.14);
          border-radius:16px;
          background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          padding:12px;
          display:flex;gap:10px;align-items:flex-start;
          min-height:74px;
        }
        .dpt-fileIcon{
          width:42px;height:42px;border-radius:14px;
          display:grid;place-items:center;
          background:linear-gradient(135deg, rgba(201,162,39,.18), rgba(11,42,74,.10));
          border:1px solid rgba(201,162,39,.26);
          color:var(--dpt-navy);
          font-weight:900;
          flex:0 0 auto;
        }
        .dpt-fileMeta{min-width:0;}
        .dpt-fileMeta strong{display:block;font-size:12px;color:var(--dpt-navy);letter-spacing:.2px;}
        .dpt-fileMeta span{display:block;margin-top:4px;font-size:12px;color:var(--dpt-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .dpt-fileMeta em{display:inline-block;margin-top:6px;font-style:normal;font-size:11px;font-weight:900;color:rgba(11,42,74,.74);}

        .dpt-form{display:flex;flex-direction:column;gap:10px;}
        .dpt-field{display:flex;flex-direction:column;gap:6px;}
        .dpt-label{font-size:12px;color:var(--dpt-muted);font-weight:900;}
        .dpt-select,.dpt-textarea{
          width:100%;
          border-radius:14px;
          border:1px solid rgba(11,42,74,.16);
          background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          color:var(--dpt-text);
          outline:none;
          font-size:13px;
          padding:10px 12px;
          transition:border-color .12s ease, box-shadow .12s ease;
        }
        .dpt-textarea{min-height:120px;resize:vertical;}
        .dpt-select:focus,.dpt-textarea:focus{border-color:rgba(11,42,74,.30);box-shadow:0 0 0 4px rgba(11,42,74,.08);}
        .dpt-actionRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;}
        .dpt-hint{margin:0;font-size:12px;color:var(--dpt-muted);line-height:1.4;}

        /* Toast */
        .dpt-toast{
          position:fixed;right:18px;top:88px;z-index:70;
          border-radius:16px;
          border:1px solid rgba(11,42,74,.14);
          background:rgba(255,255,255,.90);
          backdrop-filter:blur(10px);
          box-shadow:0 18px 34px rgba(16,32,51,.14);
          padding:12px 12px;
          min-width:260px;
        }
        .dpt-toastTop{display:flex;align-items:center;gap:10px;}
        .dpt-toastDot{width:10px;height:10px;border-radius:999px;background:#94A3B8;}
        .dpt-toastMsg{font-size:12px;color:var(--dpt-text);font-weight:800;}
        .dpt-toast--success .dpt-toastDot{background:#22C55E;}
        .dpt-toast--danger .dpt-toastDot{background:#EF4444;}
        .dpt-toast--info .dpt-toastDot{background:#3B82F6;}

        /* Responsive */
        @media (max-width: 1180px){
          .dpt-grid{grid-template-columns:1fr;}
        }
        @media (max-width: 980px){
          .dpt-sidebar{width:240px;flex-basis:240px;}
          .dpt-content{padding:16px;}
          .dpt-attachments{grid-template-columns:repeat(2, minmax(0, 1fr));}
        }
        @media (max-width: 860px){
          .dpt-profileMeta{display:none;}
        }
      `}</style>

      {toast ? (
        <div className={`dpt-toast dpt-toast--${toast.type || 'info'}`} role="status" aria-live="polite">
          <div className="dpt-toastTop">
            <span className="dpt-toastDot" aria-hidden="true" />
            <div className="dpt-toastMsg">{toast.message}</div>
          </div>
        </div>
      ) : null}

      <div className="dpt-shell">
        <SidebarPetugas prefix="dpt" activeLabel={activeMenu} />

        <main className="dpt-main">
          <header className="dpt-topbar">
            <div className="dpt-topbarTitle">
              <h1>Petugas • Detail Pengajuan</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="dpt-profile" aria-label="Profil petugas">
              <div className="dpt-profileMeta">
                <strong>{petugas.nama}</strong>
                <span>{petugas.jabatan}</span>
              </div>
              <div className="dpt-avatar" title={petugas.unit} aria-hidden="true">
                {petugas.nama
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="dpt-content">
            <section className="dpt-card" aria-label="Header detail pengajuan">
              <div className="dpt-header">
                <div className="dpt-headerTop">
                  <div className="dpt-titleWrap">
                    <div className="dpt-kicker">
                      <span className="dpt-kickerLine" aria-hidden="true" />
                      <span>DETAIL PENGAJUAN</span>
                    </div>
                    <h2 className="dpt-title">Detail Pengajuan</h2>
                    <p className="dpt-subtitle">
                      Tinjau informasi pemohon, kelengkapan lampiran, dan lakukan perubahan status sesuai proses
                      pelayanan.
                    </p>
                  </div>

                  <div className="dpt-headActions">
                    <button
                      type="button"
                      className="dpt-btn"
                      onClick={() => navigate('/petugas/pengajuan')}
                      title="Kembali ke daftar pengajuan"
                    >
                      Kembali ke Daftar
                    </button>
                    <button type="button" className="dpt-btn dpt-btnPrimary" onClick={cetak}>
                      Cetak
                    </button>
                  </div>
                </div>
                <div className="dpt-divider" />
              </div>
            </section>

            <div className="dpt-grid">
              <div className="dpt-stack">
                <section className="dpt-card" aria-label="Informasi pemohon">
                  <div className="dpt-cardHeader">
                    <h2>Informasi Pemohon</h2>
                    <div className="dpt-subtle">Data identitas</div>
                  </div>
                  <div className="dpt-cardBody">
                    <dl className="dpt-kv">
                      <dt>Nama Lengkap</dt>
                      <dd>{submission?.pemohon?.nama || '-'}</dd>

                      <dt>NIK</dt>
                      <dd className="dpt-mono">{submission?.pemohon?.nik || '-'}</dd>

                      <dt>Nomor HP</dt>
                      <dd className="dpt-mono">-</dd>

                      <dt>Alamat</dt>
                      <dd>-</dd>

                      <dt>Jenis Layanan</dt>
                      <dd>{submission?.layanan || '-'}</dd>

                      <dt>Tanggal Pengajuan</dt>
                      <dd>{submission?.createdAt ? formatTanggalID(submission.createdAt) : '-'}</dd>
                    </dl>
                  </div>
                </section>

                <section className="dpt-card" aria-label="Informasi pengajuan">
                  <div className="dpt-cardHeader">
                    <h2>Informasi Pengajuan</h2>
                    <div className="dpt-subtle">Nomor & status</div>
                  </div>
                  <div className="dpt-cardBody">
                    <dl className="dpt-kv">
                      <dt>Nomor Pengajuan</dt>
                      <dd className="dpt-mono">{submission?.id || '-'}</dd>

                      <dt>Status Saat Ini</dt>
                      <dd>
                        <span className={getStatusClass(statusBaru)}>{statusBaru}</span>
                      </dd>

                      <dt>Keterangan Pemohon</dt>
                      <dd style={{ fontWeight: 700, color: 'var(--dpt-muted)' }}>{submission?.keteranganPemohon || '-'}</dd>

                      <dt>Catatan Petugas</dt>
                      <dd style={{ fontWeight: 800 }}>{catatanPetugas || '-'}</dd>
                    </dl>
                  </div>
                </section>

                <section className="dpt-card" aria-label="Lampiran pengajuan">
                  <div className="dpt-cardHeader">
                    <h2>Lampiran</h2>
                    <div className="dpt-subtle">Nama file lampiran</div>
                  </div>
                  <div className="dpt-cardBody">
                    <div className="dpt-attachments">
                      {lampiran.length === 0 ? (
                        <div className="dpt-hint">Tidak ada lampiran.</div>
                      ) : (
                        lampiran.map((file) => (
                          <div key={file.id} className="dpt-file">
                            <div className="dpt-fileIcon" aria-hidden="true">
                              {file.ext}
                            </div>
                            <div className="dpt-fileMeta">
                              <strong>{file.label}</strong>
                              <span title={file.filename}>{file.filename}</span>
                              <em>Tersedia</em>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="dpt-hint" style={{ marginTop: 10 }}>
                      Catatan: Saat integrasi backend, lampiran dapat ditingkatkan menjadi preview gambar/PDF dan
                      validasi kelengkapan dokumen.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="dpt-card" aria-label="Aksi petugas">
                <div className="dpt-cardHeader">
                  <h2>Aksi Petugas</h2>
                  <div className="dpt-subtle">Ubah status & catatan</div>
                </div>
                <div className="dpt-cardBody">
                  <div className="dpt-form">
                    <div className="dpt-field">
                      <div className="dpt-label">Ubah Status</div>
                      <select
                        className="dpt-select"
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

                    <div className="dpt-field">
                      <div className="dpt-label">Catatan Petugas</div>
                      <textarea
                        className="dpt-textarea"
                        value={catatanPetugas}
                        onChange={(e) => setCatatanPetugas(e.target.value)}
                        placeholder="Tulis catatan verifikasi, kekurangan berkas, atau tindak lanjut..."
                        aria-label="Catatan petugas"
                      />
                    </div>

                    <div className="dpt-actionRow">
                      <button type="button" className="dpt-btn dpt-btnPrimary" onClick={simpanPerubahan}>
                        Simpan Perubahan
                      </button>
                      <button type="button" className="dpt-btn" onClick={verifikasi}>
                        Verifikasi
                      </button>
                      <button type="button" className="dpt-btn" onClick={setujui}>
                        Setujui
                      </button>
                      <button type="button" className="dpt-btn" onClick={buatSurat}>
                        Buat Surat
                      </button>
                      <button type="button" className="dpt-btn dpt-btnDanger" onClick={perluPerbaikan}>
                        Perlu Perbaikan
                      </button>
                    </div>

                    <p className="dpt-hint">
                      Tombol <strong>Verifikasi</strong>, <strong>Setujui</strong>, <strong>Perlu Perbaikan</strong>, dan{' '}
                      <strong>Buat Surat</strong> mengubah status pengajuan serta memicu notifikasi (mock).
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
