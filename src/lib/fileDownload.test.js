import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildDownloadFilename, downloadFileFromUrl } from './fileDownload'

describe('downloadFileFromUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('mengambil file sebagai blob dan memicu anchor download', async () => {
    const blob = new Blob(['surat'], { type: 'application/pdf' })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(blob) })
    let clickedFilename = ''
    const clickMock = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function handleClick() {
      clickedFilename = this.download
    })
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:surat-hasil')
    const revokeObjectUrlMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: createObjectUrlMock })
    Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrlMock })

    await downloadFileFromUrl('https://backend.test/uploads/surat.pdf', 'Surat Hasil.pdf')

    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/uploads/surat.pdf')
    expect(createObjectUrlMock).toHaveBeenCalledWith(blob)
    expect(clickMock).toHaveBeenCalledTimes(1)
    expect(clickedFilename).toBe('Surat Hasil.pdf')
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:surat-hasil')
    expect(document.querySelector('a[download="Surat Hasil.pdf"]')).not.toBeInTheDocument()
  })

  it('membuat nama fallback dengan ekstensi URL', () => {
    expect(buildDownloadFilename('', 44, 'https://backend.test/uploads/surat-44.png')).toBe(
      'surat-hasil-pengajuan-44.png'
    )
  })

  it('menambahkan ekstensi URL jika nama backend belum memiliki ekstensi', () => {
    expect(buildDownloadFilename('Surat Hasil', 44, 'https://backend.test/uploads/surat-44.pdf')).toBe('Surat Hasil.pdf')
  })
})
