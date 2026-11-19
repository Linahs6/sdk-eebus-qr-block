import jsQR from 'jsqr'

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> }

let native: BarcodeDetectorLike | null | undefined

/** Nutzt den nativen BarcodeDetector (Chrome/Android), sonst jsQR (z. B. iOS Safari, Firefox). */
async function getNativeDetector(): Promise<BarcodeDetectorLike | null> {
  if (native !== undefined) return native
  native = null
  const BD = (globalThis as unknown as { BarcodeDetector?: any }).BarcodeDetector
  try {
    if (BD && (await BD.getSupportedFormats?.())?.includes('qr_code')) {
      native = new BD({ formats: ['qr_code'] })
    }
  } catch {
    native = null
  }
  return native ?? null
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d', { willReadFrequently: true })

/** Liest einen QR-Code aus einem Video-Frame oder Bild. Gibt null zurück, wenn keiner erkannt wurde. */
export async function decodeQr(
  source: HTMLVideoElement | HTMLImageElement | ImageBitmap,
  width: number,
  height: number,
): Promise<string | null> {
  if (!width || !height) return null

  const det = await getNativeDetector()
  if (det) {
    try {
      const codes = await det.detect(source)
      if (codes[0]?.rawValue) return codes[0].rawValue
    } catch {
      /* Fallback auf jsQR */
    }
  }

  if (!ctx) return null
  // Auf max. 1024 px verkleinern – schneller und für QR-Codes ausreichend.
  const scale = Math.min(1, 1024 / Math.max(width, height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
  return res?.data ?? null
}

export async function decodeQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file)
  try {
    return await decodeQr(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}
