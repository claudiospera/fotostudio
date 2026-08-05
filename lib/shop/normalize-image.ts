// lib/shop/normalize-image.ts
// Il browser applica la rotazione EXIF solo quando disegna l'immagine (img/canvas),
// non nei byte del file. Se carichiamo il file originale così com'è, altri programmi
// che aprono il file possono interpretare l'EXIF diversamente e mostrarlo ruotato.
// Ridisegnando su canvas "cuociamo" l'orientamento corretto nei pixel una volta per tutte.

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function normalizeImageOrientation(file: File): Promise<File> {
  try {
    const img = await loadImageFromFile(file)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.95))
    return blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
