// =============================================================================
//  Analyse locale des photos (NSFW.js + TensorFlow.js) — 100 % dans le
//  navigateur, modèle MobileNetV2 inclus (aucun CDN, aucune donnée envoyée).
//  Chargé à la demande. Bloque la pornographie / nudité ; laisse passer le
//  « Sexy » (maillot, lingerie = mode légitime).
// =============================================================================
import type { NSFWJS } from 'nsfwjs'

export interface NsfwVerdict {
  blocked: boolean
  label: string
}

let modelPromise: Promise<NSFWJS> | null = null

async function getModel(): Promise<NSFWJS> {
  if (!modelPromise) {
    modelPromise = (async () => {
      // On importe UNIQUEMENT MobileNetV2 (le plus léger, ~3,5 Mo) au lieu du
      // chargeur par défaut qui embarque les 3 modèles (dont InceptionV3, 29 Mo).
      const [{ load }, { MobileNetV2Model }, tf] = await Promise.all([
        import('nsfwjs/core'),
        import('nsfwjs/models/mobilenet_v2'),
        import('@tensorflow/tfjs'),
      ])
      await tf.ready()
      return load('MobileNetV2', { modelDefinitions: [MobileNetV2Model] } as never)
    })()
  }
  return modelPromise
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image illisible'))
    img.src = src
  })
}

/**
 * Analyse une image (data-URI). Renvoie `blocked: true` si elle est jugée
 * pornographique / nudité. En cas d'échec (modèle non chargé, réseau…), ne
 * bloque PAS (fail-open) : la modération du texte + admin reste le filet.
 */
export async function classifyImage(dataUri: string): Promise<NsfwVerdict> {
  try {
    const model = await getModel()
    const img = await loadImageEl(dataUri)
    const preds = await model.classify(img, 5)
    const s: Record<string, number> = {}
    for (const p of preds) s[p.className] = p.probability
    const porn = s.Porn ?? 0
    const hentai = s.Hentai ?? 0
    const blocked = porn > 0.6 || hentai > 0.6 || porn + hentai > 0.75
    return { blocked, label: blocked ? (porn >= hentai ? 'Porn' : 'Hentai') : 'ok' }
  } catch {
    return { blocked: false, label: 'error' }
  }
}
