import { useMemo, useState } from 'react'
import SidebarPetugas from '../components/SidebarPetugas'

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
  return status === 'Aktif' ? 'kdm-badge kdm-badge--active' : 'kdm-badge kdm-badge--inactive'
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

  const activeMenu = 'Kelola Data Masyarakat'
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
      ? citizens.filter(
          (c) =>
            c.namaLengkap.toLowerCase().includes(term) ||
            c.nik.toLowerCase().includes(term)
        )
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
    <div className="kdm-page">
      <style>{`
        :root{
          --kdm-navy:#0B2A4A;
          --kdm-navy-2:#0E3A67;
          --kdm-white:#FFFFFF;
          --kdm-bg:#F4F7FB;
          --kdm-surface:#FFFFFF;
          --kdm-gold:#C9A227;
          --kdm-gold-soft:#E7D6A2;
          --kdm-text:#102033;
          --kdm-muted:#66768A;
          --kdm-border:rgba(11, 42, 74, .12);
        }
        .kdm-page{min-height:100vh;background:var(--kdm-bg);color:var(--kdm-text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;}
        .kdm-shell{display:flex;min-height:100vh;}
        .kdm-sidebar{
          width:280px;flex:0 0 280px;background:linear-gradient(180deg,var(--kdm-navy),#081E34);
          color:var(--kdm-white);padding:18px 14px;border-right:1px solid rgba(255,255,255,.08);
          position:sticky;top:0;height:100vh;
        }
        .kdm-brand{display:flex;align-items:center;gap:12px;padding:8px 10px;margin-bottom:14px;}
        .kdm-logo{
          width:44px;height:44px;border-radius:12px;
          background:linear-gradient(135deg,var(--kdm-gold),var(--kdm-gold-soft));
          display:grid;place-items:center;color:var(--kdm-navy);font-weight:900;letter-spacing:.5px;
          box-shadow:0 10px 20px rgba(201,162,39,.22);
        }
        .kdm-brandTitle{display:flex;flex-direction:column;line-height:1.15;}
        .kdm-brandTitle strong{font-size:14px;letter-spacing:.2px;}
        .kdm-brandTitle span{font-size:12px;color:rgba(255,255,255,.72);}
        .kdm-nav{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
        .kdm-navBtn{
          border:1px solid rgba(255,255,255,.10);
          background:rgba(255,255,255,.06);
          color:var(--kdm-white);
          padding:12px 12px;border-radius:14px;cursor:pointer;
          display:flex;align-items:center;gap:10px;
          transition:transform .12s ease, background .12s ease, border-color .12s ease;
          text-align:left;
        }
        .kdm-navBtn:hover{transform:translateY(-1px);background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.18);}
        .kdm-navBtn.is-active{background:rgba(201,162,39,.16);border-color:rgba(201,162,39,.35);}
        .kdm-navDot{width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.45);box-shadow:0 0 0 6px rgba(255,255,255,.04) inset;}
        .kdm-navBtn.is-active .kdm-navDot{background:var(--kdm-gold);box-shadow:0 0 0 6px rgba(201,162,39,.18) inset;}
        .kdm-navText{font-size:13px;font-weight:700;letter-spacing:.2px;}
        .kdm-sidebarFoot{
          margin-top:auto;padding:12px 10px;border-top:1px solid rgba(255,255,255,.10);
          color:rgba(255,255,255,.72);font-size:12px;
        }
        .kdm-main{flex:1;display:flex;flex-direction:column;}
        .kdm-topbar{
          height:72px;display:flex;align-items:center;justify-content:space-between;
          padding:14px 22px;border-bottom:1px solid var(--kdm-border);
          background:rgba(255,255,255,.72);backdrop-filter:blur(8px);
          position:sticky;top:0;z-index:5;
        }
        .kdm-topbarTitle{display:flex;flex-direction:column;gap:2px;}
        .kdm-topbarTitle h1{margin:0;font-size:16px;letter-spacing:.2px;color:var(--kdm-navy);}
        .kdm-topbarTitle p{margin:0;font-size:12px;color:var(--kdm-muted);}
        .kdm-profile{display:flex;align-items:center;gap:12px;}
        .kdm-avatar{
          width:38px;height:38px;border-radius:12px;
          background:linear-gradient(135deg,var(--kdm-navy-2),var(--kdm-navy));
          box-shadow:0 10px 20px rgba(11,42,74,.18);
          display:grid;place-items:center;color:var(--kdm-white);font-weight:900;
        }
        .kdm-profileMeta{display:flex;flex-direction:column;line-height:1.15;}
        .kdm-profileMeta strong{font-size:13px;}
        .kdm-profileMeta span{font-size:12px;color:var(--kdm-muted);}

        .kdm-content{padding:18px 22px 28px;}
        .kdm-card{
          background:var(--kdm-surface);
          border:1px solid var(--kdm-border);
          border-radius:18px;
          box-shadow:0 12px 24px rgba(16,32,51,.06);
        }
        .kdm-header{padding:16px;}
        .kdm-kicker{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:900;letter-spacing:.22px;color:var(--kdm-navy);}
        .kdm-kickerLine{width:24px;height:2px;background:linear-gradient(90deg,var(--kdm-gold),transparent);}
        .kdm-title{margin:6px 0 6px;font-size:18px;color:var(--kdm-navy);letter-spacing:.2px;}
        .kdm-subtitle{margin:0;font-size:13px;color:var(--kdm-muted);max-width:78ch;}
        .kdm-divider{height:1px;background:var(--kdm-border);margin-top:12px;}

        .kdm-actions{padding:14px 16px 16px;}
        .kdm-actionRow{display:flex;gap:10px;align-items:end;flex-wrap:wrap;}
        .kdm-field{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1;}
        .kdm-label{font-size:12px;color:var(--kdm-muted);font-weight:900;}
        .kdm-inputWrap{position:relative;}
        .kdm-inputIcon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(11,42,74,.55);}
        .kdm-input{
          width:100%;
          padding:10px 12px 10px 38px;
          border-radius:14px;
          border:1px solid rgba(11,42,74,.16);
          background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          color:var(--kdm-text);
          outline:none;
          font-size:13px;
          transition:border-color .12s ease, box-shadow .12s ease;
        }
        .kdm-input:focus{border-color:rgba(11,42,74,.30);box-shadow:0 0 0 4px rgba(11,42,74,.08);}
        .kdm-btn{
          border:1px solid rgba(11,42,74,.18);
          background:linear-gradient(180deg,#FFFFFF,#F6FAFF);
          color:var(--kdm-navy);
          padding:10px 12px;border-radius:14px;font-weight:900;font-size:12px;cursor:pointer;
          transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
          white-space:nowrap;
        }
        .kdm-btn:hover{transform:translateY(-1px);box-shadow:0 10px 18px rgba(11,42,74,.10);border-color:rgba(11,42,74,.26);}
        .kdm-btnPrimary{
          border:1px solid rgba(201,162,39,.40);
          background:linear-gradient(180deg, rgba(201,162,39,.95), rgba(231,214,162,.95));
          color:#1B2A3A;
        }

        .kdm-tableCard{margin-top:14px;}
        .kdm-tableHeader{padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        .kdm-tableHeader h2{margin:0;font-size:14px;color:var(--kdm-navy);letter-spacing:.2px;}
        .kdm-subtle{font-size:12px;color:var(--kdm-muted);}
        .kdm-tableWrap{overflow:auto;border-top:1px solid var(--kdm-border);border-bottom-left-radius:18px;border-bottom-right-radius:18px;}
        .kdm-table{width:100%;border-collapse:separate;border-spacing:0;background:var(--kdm-white);min-width:1040px;}
        .kdm-table thead th{
          position:sticky;top:0;background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          text-align:left;font-size:12px;color:var(--kdm-muted);
          padding:12px 12px;border-bottom:1px solid var(--kdm-border);
        }
        .kdm-table tbody td{
          padding:12px 12px;border-bottom:1px solid rgba(11,42,74,.08);
          font-size:13px;color:var(--kdm-text);
          vertical-align:top;
        }
        .kdm-table tbody tr:hover{background:#FAFCFF;}
        .kdm-empty{padding:18px;color:var(--kdm-muted);font-size:13px;}
        .kdm-mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;letter-spacing:.2px;}

        .kdm-badge{
          display:inline-flex;align-items:center;gap:8px;
          padding:6px 10px;border-radius:999px;border:1px solid var(--kdm-border);
          font-size:12px;font-weight:900;letter-spacing:.15px;background:#fff;
        }
        .kdm-badge::before{content:"";width:8px;height:8px;border-radius:999px;background:#94A3B8;}
        .kdm-badge--active{background:rgba(34, 197, 94, .14);border-color:rgba(34, 197, 94, .35);color:#155D2E;}
        .kdm-badge--active::before{background:#22C55E;}
        .kdm-badge--inactive{background:rgba(148, 163, 184, .14);border-color:rgba(148, 163, 184, .38);color:#475569;}
        .kdm-badge--inactive::before{background:#94A3B8;}

        .kdm-rowActions{display:flex;gap:8px;flex-wrap:wrap;}
        .kdm-btnSm{padding:8px 10px;border-radius:12px;font-size:12px;font-weight:900;}
        .kdm-btnDetail{border-color:rgba(59,130,246,.35);background:linear-gradient(180deg, rgba(59,130,246,.12), rgba(255,255,255,.86));color:#0B3A7A;}
        .kdm-btnEdit{border-color:rgba(201,162,39,.38);background:linear-gradient(180deg, rgba(201,162,39,.14), rgba(255,255,255,.86));color:#6A4E00;}
        .kdm-btnDelete{border-color:rgba(239,68,68,.32);background:linear-gradient(180deg, rgba(239,68,68,.12), rgba(255,255,255,.86));color:#7A1E1E;}

        /* Modal */
        .kdm-modalOverlay{
          position:fixed;inset:0;background:rgba(6, 16, 28, .52);
          display:flex;align-items:center;justify-content:center;
          padding:18px;z-index:50;
        }
        .kdm-modal{
          width:min(860px, 100%);
          background:var(--kdm-white);
          border-radius:22px;
          border:1px solid rgba(255,255,255,.14);
          box-shadow:0 24px 60px rgba(0,0,0,.28);
          overflow:hidden;
        }
        .kdm-modalHead{
          padding:14px 16px;
          background:linear-gradient(180deg, rgba(11,42,74,.92), rgba(8,30,52,.92));
          color:var(--kdm-white);
          display:flex;align-items:center;justify-content:space-between;gap:10px;
        }
        .kdm-modalHead h3{margin:0;font-size:14px;letter-spacing:.2px;}
        .kdm-modalClose{
          border:1px solid rgba(255,255,255,.22);
          background:rgba(255,255,255,.10);
          color:var(--kdm-white);
          padding:8px 10px;border-radius:12px;cursor:pointer;font-weight:900;
        }
        .kdm-modalBody{padding:16px;}
        .kdm-gridForm{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .kdm-inputPlain,.kdm-select,.kdm-textarea{
          width:100%;
          border-radius:14px;
          border:1px solid rgba(11,42,74,.16);
          background:linear-gradient(180deg,#FFFFFF,#F7FAFF);
          color:var(--kdm-text);
          outline:none;
          font-size:13px;
          padding:10px 12px;
          transition:border-color .12s ease, box-shadow .12s ease;
        }
        .kdm-textarea{min-height:92px;resize:vertical;}
        .kdm-inputPlain:focus,.kdm-select:focus,.kdm-textarea:focus{border-color:rgba(11,42,74,.30);box-shadow:0 0 0 4px rgba(11,42,74,.08);}
        .kdm-span2{grid-column:1 / -1;}
        .kdm-modalFoot{
          padding:14px 16px;
          border-top:1px solid var(--kdm-border);
          display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;
          background:linear-gradient(180deg,#FFFFFF,#F8FBFF);
        }

        /* Detail kv */
        .kdm-kv{
          display:grid;
          grid-template-columns:180px 1fr;
          gap:10px 14px;
          border:1px solid var(--kdm-border);
          border-radius:16px;
          padding:14px;
          background:linear-gradient(180deg,#FFFFFF,#FBFDFF);
        }
        .kdm-kv dt{margin:0;color:var(--kdm-muted);font-size:12px;font-weight:900;}
        .kdm-kv dd{margin:0;color:var(--kdm-text);font-weight:800;font-size:13px;}

        /* Toast */
        .kdm-toast{
          position:fixed;right:18px;top:88px;z-index:70;
          border-radius:16px;
          border:1px solid rgba(11,42,74,.14);
          background:rgba(255,255,255,.90);
          backdrop-filter:blur(10px);
          box-shadow:0 18px 34px rgba(16,32,51,.14);
          padding:12px 12px;
          min-width:260px;
        }
        .kdm-toastTop{display:flex;align-items:center;gap:10px;}
        .kdm-toastDot{width:10px;height:10px;border-radius:999px;background:#94A3B8;}
        .kdm-toastMsg{font-size:12px;color:var(--kdm-text);font-weight:900;}
        .kdm-toast--success .kdm-toastDot{background:#22C55E;}
        .kdm-toast--danger .kdm-toastDot{background:#EF4444;}
        .kdm-toast--info .kdm-toastDot{background:#3B82F6;}

        @media (max-width: 1180px){
          .kdm-gridForm{grid-template-columns:1fr;}
          .kdm-table{min-width:960px;}
        }
        @media (max-width: 980px){
          .kdm-sidebar{width:240px;flex-basis:240px;}
          .kdm-content{padding:16px;}
        }
        @media (max-width: 860px){
          .kdm-profileMeta{display:none;}
        }
      `}</style>

      {toast ? (
        <div className={`kdm-toast kdm-toast--${toast.type || 'success'}`} role="status" aria-live="polite">
          <div className="kdm-toastTop">
            <span className="kdm-toastDot" aria-hidden="true" />
            <div className="kdm-toastMsg">{toast.message}</div>
          </div>
        </div>
      ) : null}

      <div className="kdm-shell">
        <SidebarPetugas prefix="kdm" activeLabel={activeMenu} />

        <main className="kdm-main">
          <header className="kdm-topbar">
            <div className="kdm-topbarTitle">
              <h1>Petugas • Kelola Data Masyarakat</h1>
              <p>{formatTanggalID(today)}</p>
            </div>

            <div className="kdm-profile" aria-label="Profil petugas">
              <div className="kdm-profileMeta">
                <strong>{petugas.nama}</strong>
                <span>{petugas.jabatan}</span>
              </div>
              <div className="kdm-avatar" title={petugas.unit} aria-hidden="true">
                {petugas.nama
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="kdm-content">
            <section className="kdm-card" aria-label="Header kelola data masyarakat">
              <div className="kdm-header">
                <div className="kdm-kicker">
                  <span className="kdm-kickerLine" aria-hidden="true" />
                  <span>KELOLA DATA</span>
                </div>
                <h2 className="kdm-title">Kelola Data Masyarakat</h2>
                <p className="kdm-subtitle">
                  Petugas dapat melihat, menambah, mengubah, dan menghapus data masyarakat.
                </p>
                <div className="kdm-divider" />
              </div>

              <div className="kdm-actions" aria-label="Action bar">
                <div className="kdm-actionRow">
                  <div className="kdm-field" style={{ flex: 1.4 }}>
                    <div className="kdm-label">Cari (Nama atau NIK)</div>
                    <div className="kdm-inputWrap">
                      <span className="kdm-inputIcon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M21 21l-4.3-4.3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <input
                        className="kdm-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Contoh: Siti / 1409..."
                        aria-label="Cari data masyarakat"
                      />
                    </div>
                  </div>

                  <button type="button" className="kdm-btn kdm-btnPrimary" onClick={openAddModal}>
                    Tambah Data
                  </button>
                  <button type="button" className="kdm-btn" onClick={resetAction}>
                    Reset
                  </button>
                </div>

                <div style={{ marginTop: 10 }} className="kdm-subtle">
                  Menampilkan <strong style={{ color: 'var(--kdm-navy)' }}>{filteredCitizens.length}</strong> dari{' '}
                  <strong style={{ color: 'var(--kdm-navy)' }}>{citizens.length}</strong> data.
                </div>
              </div>
            </section>

            <section className="kdm-card kdm-tableCard" aria-label="Tabel data masyarakat">
              <div className="kdm-tableHeader">
                <h2>Data Masyarakat</h2>
                <div className="kdm-subtle">Data dummy lokal • Real-time search</div>
              </div>

              <div className="kdm-tableWrap" role="region" aria-label="Tabel data masyarakat">
                <table className="kdm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 64 }}>No</th>
                      <th>Nama Lengkap</th>
                      <th style={{ width: 190 }}>NIK</th>
                      <th style={{ width: 140 }}>Jenis Kelamin</th>
                      <th>Alamat</th>
                      <th style={{ width: 150 }}>Nomor HP</th>
                      <th style={{ width: 160 }}>Pekerjaan</th>
                      <th style={{ width: 140 }}>Status</th>
                      <th style={{ width: 190 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCitizens.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="kdm-empty">
                          Data tidak ditemukan. Coba ubah kata kunci pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredCitizens.map((row, idx) => (
                        <tr key={row.id}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 900 }}>{row.namaLengkap}</td>
                          <td className="kdm-mono">{row.nik}</td>
                          <td>{row.jenisKelamin}</td>
                          <td>{row.alamat}</td>
                          <td className="kdm-mono">{row.nomorHp}</td>
                          <td>{row.pekerjaan}</td>
                          <td>
                            <span className={statusBadgeClass(row.status)}>{row.status}</span>
                          </td>
                          <td>
                            <div className="kdm-rowActions">
                              <button
                                type="button"
                                className="kdm-btn kdm-btnSm kdm-btnDetail"
                                onClick={() => openDetailModal(row)}
                              >
                                Detail
                              </button>
                              <button
                                type="button"
                                className="kdm-btn kdm-btnSm kdm-btnEdit"
                                onClick={() => openEditModal(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="kdm-btn kdm-btnSm kdm-btnDelete"
                                onClick={() => hapus(row)}
                              >
                                Hapus
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
        </main>
      </div>

      {/* Modal Tambah */}
      {openAdd ? (
        <div
          className="kdm-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="kdm-modal">
            <div className="kdm-modalHead">
              <h3>Tambah Data Masyarakat</h3>
              <button type="button" className="kdm-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="kdm-modalBody">
              <div className="kdm-gridForm">
                <div className="kdm-field">
                  <div className="kdm-label">Nama Lengkap</div>
                  <input
                    className="kdm-inputPlain"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleFormChange}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">NIK</div>
                  <input
                    className="kdm-inputPlain kdm-mono"
                    name="nik"
                    value={formData.nik}
                    onChange={handleFormChange}
                    placeholder="1409xxxxxxxxxxxx"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Jenis Kelamin</div>
                  <select className="kdm-select" name="jenisKelamin" value={formData.jenisKelamin} onChange={handleFormChange}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Nomor HP</div>
                  <input
                    className="kdm-inputPlain kdm-mono"
                    name="nomorHp"
                    value={formData.nomorHp}
                    onChange={handleFormChange}
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>
                <div className="kdm-field kdm-span2">
                  <div className="kdm-label">Alamat</div>
                  <textarea
                    className="kdm-textarea"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleFormChange}
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Pekerjaan</div>
                  <input
                    className="kdm-inputPlain"
                    name="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={handleFormChange}
                    placeholder="Pekerjaan"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Status</div>
                  <select className="kdm-select" name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="kdm-modalFoot">
              <button type="button" className="kdm-btn" onClick={closeAllModals}>
                Batal
              </button>
              <button type="button" className="kdm-btn kdm-btnPrimary" onClick={simpanTambah}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Edit */}
      {openEdit && selected ? (
        <div
          className="kdm-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="kdm-modal">
            <div className="kdm-modalHead">
              <h3>Edit Data Masyarakat</h3>
              <button type="button" className="kdm-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="kdm-modalBody">
              <div className="kdm-subtle" style={{ marginBottom: 10 }}>
                ID: <span className="kdm-mono">{selected.id}</span>
              </div>
              <div className="kdm-gridForm">
                <div className="kdm-field">
                  <div className="kdm-label">Nama Lengkap</div>
                  <input
                    className="kdm-inputPlain"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleFormChange}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">NIK</div>
                  <input
                    className="kdm-inputPlain kdm-mono"
                    name="nik"
                    value={formData.nik}
                    onChange={handleFormChange}
                    placeholder="1409xxxxxxxxxxxx"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Jenis Kelamin</div>
                  <select className="kdm-select" name="jenisKelamin" value={formData.jenisKelamin} onChange={handleFormChange}>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Nomor HP</div>
                  <input
                    className="kdm-inputPlain kdm-mono"
                    name="nomorHp"
                    value={formData.nomorHp}
                    onChange={handleFormChange}
                    placeholder="08xx-xxxx-xxxx"
                  />
                </div>
                <div className="kdm-field kdm-span2">
                  <div className="kdm-label">Alamat</div>
                  <textarea
                    className="kdm-textarea"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleFormChange}
                    placeholder="Alamat lengkap"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Pekerjaan</div>
                  <input
                    className="kdm-inputPlain"
                    name="pekerjaan"
                    value={formData.pekerjaan}
                    onChange={handleFormChange}
                    placeholder="Pekerjaan"
                  />
                </div>
                <div className="kdm-field">
                  <div className="kdm-label">Status</div>
                  <select className="kdm-select" name="status" value={formData.status} onChange={handleFormChange}>
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="kdm-modalFoot">
              <button type="button" className="kdm-btn" onClick={closeAllModals}>
                Batal
              </button>
              <button type="button" className="kdm-btn kdm-btnPrimary" onClick={simpanEdit}>
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Detail */}
      {openDetail && selected ? (
        <div
          className="kdm-modalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Detail data masyarakat"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAllModals()
          }}
        >
          <div className="kdm-modal">
            <div className="kdm-modalHead">
              <h3>Detail Data Masyarakat</h3>
              <button type="button" className="kdm-modalClose" onClick={closeAllModals} aria-label="Tutup">
                Tutup
              </button>
            </div>
            <div className="kdm-modalBody">
              <dl className="kdm-kv">
                <dt>Nama Lengkap</dt>
                <dd>{selected.namaLengkap}</dd>

                <dt>NIK</dt>
                <dd className="kdm-mono">{selected.nik}</dd>

                <dt>Jenis Kelamin</dt>
                <dd>{selected.jenisKelamin}</dd>

                <dt>Alamat</dt>
                <dd>{selected.alamat}</dd>

                <dt>Nomor HP</dt>
                <dd className="kdm-mono">{selected.nomorHp}</dd>

                <dt>Pekerjaan</dt>
                <dd>{selected.pekerjaan}</dd>

                <dt>Status</dt>
                <dd>
                  <span className={statusBadgeClass(selected.status)}>{selected.status}</span>
                </dd>
              </dl>
            </div>
            <div className="kdm-modalFoot">
              <button type="button" className="kdm-btn" onClick={closeAllModals}>
                Tutup
              </button>
              <button type="button" className="kdm-btn kdm-btnEdit" onClick={() => openEditModal(selected)}>
                Edit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
