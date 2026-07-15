function getExtensionFromUrl(fileUrl) {
  const cleanUrl = String(fileUrl || '').split('?')[0].split('#')[0]
  const match = cleanUrl.match(/\.([a-z0-9]{2,5})$/i)
  return match?.[1]?.toLowerCase() || ''
}

export function buildDownloadFilename(filename, idPengajuan, fileUrl) {
  const normalizedName = String(filename || '').trim()
  const extension = getExtensionFromUrl(fileUrl)
  if (normalizedName) {
    return extension && !/\.[a-z0-9]{2,5}$/i.test(normalizedName) ? `${normalizedName}.${extension}` : normalizedName
  }

  const baseName = `surat-hasil-pengajuan-${idPengajuan || 'pengajuan'}`
  return extension ? `${baseName}.${extension}` : baseName
}

export async function downloadFileFromUrl(fileUrl, filename) {
  if (!fileUrl) throw new Error('URL file tidak tersedia')

  const response = await fetch(fileUrl)
  if (!response.ok) throw new Error('Gagal mengunduh file')

  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = blobUrl
    link.download = filename || 'surat-hasil'
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  }
}
