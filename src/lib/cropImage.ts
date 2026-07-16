// =============================================================================
//  Génère l'image finale éditée (recadrage + rotation + retournement + filtres)
//  à partir des données de react-easy-crop, puis la réduit (max 1280 px) en JPEG.
// =============================================================================
export interface Area {
  x: number
  y: number
  width: number
  height: number
}
export interface FlipState {
  horizontal: boolean
  vertical: boolean
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (e) => reject(e))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}
const rad = (deg: number) => (deg * Math.PI) / 180

function rotateSize(width: number, height: number, rotation: number) {
  const r = rad(rotation)
  return {
    width: Math.abs(Math.cos(r) * width) + Math.abs(Math.sin(r) * height),
    height: Math.abs(Math.sin(r) * width) + Math.abs(Math.cos(r) * height),
  }
}

/**
 * @param src        image source (data-URI ou URL)
 * @param cropPixels zone de recadrage (coord. de la « boîte » pivotée, cf. react-easy-crop)
 * @param rotation   rotation en degrés
 * @param flip       retournement horizontal / vertical
 * @param filter     chaîne de filtres CSS (ex. "brightness(1.1) contrast(1.1)")
 * @param maxDim     côté maximal de sortie (réduction pour l'upload)
 */
export async function getEditedImage(
  src: string,
  cropPixels: Area,
  rotation = 0,
  flip: FlipState = { horizontal: false, vertical: false },
  filter = '',
  maxDim = 1280,
  quality = 0.85,
  bg: string | null = null,
): Promise<string> {
  const image = await createImage(src)
  const { width: bW, height: bH } = rotateSize(image.width, image.height, rotation)

  // 1) Dessine l'image pivotée/retournée + filtres sur une toile « boîte ».
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bW)
  canvas.height = Math.round(bH)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')
  if (filter) ctx.filter = filter
  ctx.translate(bW / 2, bH / 2)
  ctx.rotate(rad(rotation))
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  // 2) Découpe la zone choisie + réduit à maxDim en une seule opération.
  const scale = Math.min(1, maxDim / Math.max(cropPixels.width, cropPixels.height))
  const outW = Math.max(1, Math.round(cropPixels.width * scale))
  const outH = Math.max(1, Math.round(cropPixels.height * scale))
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const octx = out.getContext('2d')
  if (!octx) throw new Error('Canvas indisponible')
  // Fond studio : on remplit d'abord la couleur ; les zones hors-photo (quand la
  // photo est réduite pour laisser une marge) laissent apparaître ce fond.
  if (bg) {
    octx.fillStyle = bg
    octx.fillRect(0, 0, outW, outH)
  }
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(
    canvas,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, outW, outH,
  )
  return out.toDataURL('image/jpeg', quality)
}
