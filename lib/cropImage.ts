import sharp from 'sharp'

/**
 * Applies objectFit:'cover' + objectPosition crop to an image buffer.
 * Matches exactly what the client sees in the OrderModal preview.
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

  let extractW: number, extractH: number, coverLeft: number, coverTop: number

  if (imgRatio > targetRatio) {
    extractH = imgH
    extractW = Math.round(imgH * targetRatio)
    coverLeft = Math.round((imgW - extractW) * cropX / 100)
    coverTop = 0
  } else {
    extractW = imgW
    extractH = Math.round(imgW / targetRatio)
    coverLeft = 0
    coverTop = Math.round((imgH - extractH) * cropY / 100)
  }

  const visibleW = Math.round(extractW / zoom)
  const visibleH = Math.round(extractH / zoom)
  const cx = coverLeft + Math.round(extractW * cropX / 100)
  const cy = coverTop  + Math.round(extractH * cropY / 100)

  let left = Math.round(cx - visibleW / 2)
  let top  = Math.round(cy - visibleH / 2)
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
 */
export function parseFormatRatio(label: string): { w: number; h: number } | null {
  const m = label.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { w: parseFloat(m[1]), h: parseFloat(m[2]) }
}

// ── Instax card compositing ────────────────────────────────────────────────

/**
 * Converts a CSS color/gradient string to an SVG rect + optional gradient defs.
 * Returns the inner SVG content (defs + rect, no outer <svg> wrapper).
 */
function cssColorToSvgFill(w: number, h: number, frameColor: string): string {
  const c = (frameColor ?? '').trim()

  // Transparent / nessuna → white card
  if (!c || c === 'transparent' || c === 'none') {
    return `<rect width="${w}" height="${h}" fill="#f8f8f8"/>`
  }

  // Solid hex or rgb
  if (/^#[0-9a-fA-F]{3,8}$/.test(c) || c.startsWith('rgb')) {
    return `<rect width="${w}" height="${h}" fill="${c}"/>`
  }

  // linear-gradient or repeating-linear-gradient
  const lgMatch = c.match(/(?:repeating-)?linear-gradient\(\s*(\d+)deg\s*,([\s\S]+)\)$/)
  if (lgMatch) {
    const angle = parseInt(lgMatch[1])
    const stopsRaw = lgMatch[2]

    // Extract hex colors in order
    const hexes = stopsRaw.match(/#[0-9a-fA-F]{3,8}/g) ?? []
    if (hexes.length >= 2) {
      const rad = angle * Math.PI / 180
      const x1 = (50 - 50 * Math.sin(rad)).toFixed(2)
      const y1 = (50 + 50 * Math.cos(rad)).toFixed(2)
      const x2 = (50 + 50 * Math.sin(rad)).toFixed(2)
      const y2 = (50 - 50 * Math.cos(rad)).toFixed(2)

      // Try to pair each hex with a percentage stop
      const parts = stopsRaw.split(',').map(s => s.trim())
      const stops: string[] = []
      parts.forEach((part, i) => {
        const hx = part.match(/#[0-9a-fA-F]{3,8}/)
        const pct = part.match(/(\d+(?:\.\d+)?)%/)
        if (hx) {
          const offset = pct ? pct[1] : String(Math.round(i / (parts.length - 1) * 100))
          stops.push(`<stop offset="${offset}%" stop-color="${hx[0]}"/>`)
        }
      })

      const stopsSvg = stops.length >= 2
        ? stops.join('')
        : `<stop offset="0%" stop-color="${hexes[0]}"/><stop offset="100%" stop-color="${hexes[hexes.length - 1]}"/>`

      return `<defs><linearGradient id="bg" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stopsSvg}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`
    }
  }

  // Fallback: white
  return `<rect width="${w}" height="${h}" fill="#f8f8f8"/>`
}

/**
 * Builds the full Instax card image (card background + cropped photo + optional text label).
 * Output is a JPEG at 300 DPI with correct card dimensions.
 *
 * @param imageBuffer  - original photo buffer
 * @param outerW/H     - full card dimensions in cm (including border)
 * @param pad          - [top, right, bottom, left] in cm
 * @param widthCm/heightCm - photo area dimensions in cm
 * @param cropX/Y/zoom - framing from the client preview
 * @param frameColor   - CSS color/gradient for the card border
 * @param instaxText   - optional text for the bottom label strip
 */
export async function buildInstaxCard(
  imageBuffer: ArrayBuffer,
  outerW: number,
  outerH: number,
  pad: [number, number, number, number],
  widthCm: number,
  heightCm: number,
  cropX: number,
  cropY: number,
  zoom: number,
  frameColor: string,
  instaxText?: string | null
): Promise<Buffer> {
  const DPI = 300
  const cmToPx = (cm: number) => Math.round(cm * DPI / 2.54)

  const cardW  = cmToPx(outerW)
  const cardH  = cmToPx(outerH)
  const [padTop, , , padLeft] = pad
  const photoX = cmToPx(padLeft)
  const photoY = cmToPx(padTop)
  const photoW = cmToPx(widthCm)
  const photoH = cmToPx(heightCm)

  // 1. Crop photo to the exact print area
  const cropped = await cropImage(imageBuffer, widthCm, heightCm, cropX, cropY, zoom)
  const photoResized = await sharp(cropped)
    .resize(photoW, photoH, { fit: 'fill' })
    .jpeg({ quality: 95 })
    .toBuffer()

  // 2. Card background SVG
  const fillSvg = cssColorToSvgFill(cardW, cardH, frameColor)

  // 3. Optional text label in bottom strip
  let textSvg = ''
  if (instaxText?.trim()) {
    const textZoneTop = photoY + photoH
    const textZoneH   = cardH - textZoneTop
    const fontSize    = Math.max(12, Math.round(textZoneH * 0.32))
    const textX       = photoX + Math.round(photoW / 2)
    const textY       = textZoneTop + Math.round(textZoneH * 0.62)
    const safe        = instaxText.trim()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    textSvg = `<text x="${textX}" y="${textY}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" fill="#555555">${safe}</text>`
  }

  const svgBuf = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}">${fillSvg}${textSvg}</svg>`
  )

  // 4. Composite: SVG card + photo
  return sharp(svgBuf)
    .composite([{ input: photoResized, left: photoX, top: photoY }])
    .jpeg({ quality: 95 })
    .toBuffer()
}
