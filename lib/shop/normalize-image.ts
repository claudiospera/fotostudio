// lib/shop/normalize-image.ts
// Il browser applica la rotazione EXIF solo quando disegna l'immagine (img/canvas),
// non nei byte del file. Se carichiamo il file originale così com'è, altri programmi
// che aprono il file possono interpretare l'EXIF diversamente e mostrarlo ruotato.
// Ridisegnando su canvas "cuociamo" l'orientamento corretto nei pixel una volta per tutte.

// Oltre questa dimensione il ricodifica non aggiunge qualità utile in stampa
// (>300 DPI anche sul formato più grande a catalogo, 70×100cm) ma rallenta
// parecchio la codifica JPEG sui telefoni con foto da 12-48 MP.
const MAX_DIMENSION = 4000

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
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.9))
    return blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
