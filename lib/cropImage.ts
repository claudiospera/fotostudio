import sharp from 'sharp'

/**
 * Applies objectFit:'cover' + objectPosition crop to an image buffer.
 * Matches exactly what the client sees in the OrderModal preview.
 *
 * @param imageBuffer - original image ArrayBuffer
 * @param ratioW - target width (cm or any unit) — defines aspect ratio
 * @param ratioH - target height
 * @param cropX - horizontal position 0–100 (default 50 = center)
 * @param cropY - vertical position 0–100 (default 50 = center)
 * @param zoom  - zoom multiplier (default 1.0 = no zoom)
 */
export async function cropImage(
  imageBuffer: ArrayBuffer,
  ratioW: number,
  ratioH: number,
  cropX = 50,
  cropY = 50,
  zoom = 1.0
): Promise<Buffer> {
  const buf = Buffer.from(imageBuffer)
  const { width: imgW, height: imgH } = await sharp(buf).metadata()

  if (!imgW || !imgH) throw new Error('Cannot read image dimensions')

  const imgRatio = imgW / imgH
  const targetRatio = ratioW / ratioH

  // Step 1: objectFit:cover — calculate extract region
  let extractW: number, extractH: number, coverLeft: number, coverTop: number

  if (imgRatio > targetRatio) {
    // Image wider than target: height fills, crop sides
    extractH = imgH
    extractW = Math.round(imgH * targetRatio)
    coverLeft = Math.round((imgW - extractW) * cropX / 100)
    coverTop = 0
  } else {
    // Image taller than target: width fills, crop top/bottom
    extractW = imgW
    extractH = Math.round(imgW / targetRatio)
    coverLeft = 0
    coverTop = Math.round((imgH - extractH) * cropY / 100)
  }

  // Step 2: zoom — shrink visible area around the crop center
  const visibleW = Math.round(extractW / zoom)
  const visibleH = Math.round(extractH / zoom)

  // Center of visible area in original image coordinates
  const cx = coverLeft + Math.round(extractW * cropX / 100)
  const cy = coverTop + Math.round(extractH * cropY / 100)

  let left = Math.round(cx - visibleW / 2)
  let top  = Math.round(cy - visibleH / 2)

  // Clamp to image bounds
  left = Math.max(0, Math.min(left, imgW - visibleW))
  top  = Math.max(0, Math.min(top,  imgH - visibleH))
  const width  = Math.min(visibleW, imgW - left)
  const height = Math.min(visibleH, imgH - top)

  return sharp(buf)
    .extract({ left, top, width, height })
    .jpeg({ quality: 95 })
    .toBuffer()
}

/**
 * Parse "10×15 cm" or "9x9 cm" → { w: 10, h: 15 }
 * Returns null for non-parseable labels (A4, Digitale, etc.)
 */
export function parseFormatRatio(label: string): { w: number; h: number } | null {
  const m = label.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { w: parseFloat(m[1]), h: parseFloat(m[2]) }
}
