// =============================================================================
//  Reconnaissance d'objet sur l'appareil (MobileNet v2 · TensorFlow.js).
//  À l'ajout d'une photo, on devine l'OBJET → propose une catégorie et un
//  début de description en français. 100 % local (l'inférence tourne sur le
//  téléphone) ; le modèle se télécharge une fois puis est mis en cache.
//
//  Fail-open STRICT : si le modèle ne charge pas (réseau, CDN), on renvoie {}
//  et le formulaire fonctionne normalement (l'utilisateur écrit lui-même).
//  Chargé UNIQUEMENT à la demande (1ʳᵉ photo) pour ne rien peser au démarrage.
// =============================================================================
import type { MobileNet } from '@tensorflow-models/mobilenet'

let modelPromise: Promise<MobileNet> | null = null

async function getModel(): Promise<MobileNet> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [mobilenet, tf] = await Promise.all([
        import('@tensorflow-models/mobilenet'),
        import('@tensorflow/tfjs'),
      ])
      await tf.ready()
      // v2, alpha 0.5 : le plus léger (~2,6 Mo) — assez pour un objet courant.
      return mobilenet.load({ version: 2, alpha: 0.5 })
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

// Étiquette ImageNet (anglais) → { objet en français, catégorie Chap.ci }.
// On teste par inclusion de mots-clés dans le libellé renvoyé par le modèle.
interface Obj { fr: string; cat: string }
const LABELS: [string[], Obj][] = [
  [['cellular', 'cellphone', 'mobile phone', 'smartphone'], { fr: 'Un téléphone', cat: 'telephones' }],
  [['hand-held computer', 'ipod'], { fr: 'Une tablette', cat: 'telephones' }],
  [['laptop', 'notebook'], { fr: 'Un ordinateur portable', cat: 'electronique' }],
  [['desktop computer', 'computer keyboard', 'monitor'], { fr: 'Un ordinateur', cat: 'electronique' }],
  [['television', 'screen', 'monitor'], { fr: 'Un téléviseur', cat: 'electronique' }],
  [['loudspeaker', 'speaker'], { fr: 'Une enceinte', cat: 'electronique' }],
  [['printer'], { fr: 'Une imprimante', cat: 'electronique' }],
  [['joystick', 'remote control'], { fr: 'Une manette / accessoire', cat: 'electronique' }],
  [['reflex camera', 'polaroid', 'lens cap'], { fr: 'Un appareil photo', cat: 'electronique' }],
  [['sports car', 'convertible', 'minivan', 'cab', 'jeep', 'limousine', 'pickup', 'car wheel', 'racer', 'station wagon'], { fr: 'Une voiture', cat: 'vehicules' }],
  [['motor scooter', 'moped', 'motorcycle'], { fr: 'Une moto', cat: 'vehicules' }],
  [['mountain bike', 'bicycle', 'tricycle'], { fr: 'Un vélo', cat: 'loisirs' }],
  [['studio couch', 'sofa'], { fr: 'Un canapé', cat: 'maison' }],
  [['rocking chair', 'folding chair', 'barber chair', 'throne'], { fr: 'Une chaise / un fauteuil', cat: 'maison' }],
  [['dining table', 'desk'], { fr: 'Une table', cat: 'maison' }],
  [['wardrobe', 'chiffonier', 'file cabinet'], { fr: 'Une armoire', cat: 'maison' }],
  [['refrigerator'], { fr: 'Un réfrigérateur', cat: 'maison' }],
  [['washer', 'washing machine'], { fr: 'Une machine à laver', cat: 'maison' }],
  [['microwave'], { fr: 'Un micro-ondes', cat: 'maison' }],
  [['space heater', 'electric fan'], { fr: 'Un appareil électroménager', cat: 'maison' }],
  [['table lamp', 'lampshade'], { fr: 'Une lampe', cat: 'maison' }],
  [['vase', 'quilt', 'window shade'], { fr: 'Un article de décoration', cat: 'maison' }],
  [['sandal', 'running shoe', 'loafer', 'clog', 'cowboy boot', 'sneaker'], { fr: 'Une paire de chaussures', cat: 'mode' }],
  [['jersey', 'sweatshirt', 'cardigan', 'suit', 'gown', 'miniskirt', 'jean', 'kimono', 'poncho', 'abaya'], { fr: 'Un vêtement', cat: 'mode' }],
  [['handbag', 'purse', 'backpack', 'wallet'], { fr: 'Un sac', cat: 'mode' }],
  [['wristwatch', 'digital watch'], { fr: 'Une montre', cat: 'mode' }],
  [['sunglass', 'sunglasses'], { fr: 'Une paire de lunettes', cat: 'mode' }],
  [['necklace'], { fr: 'Un bijou', cat: 'mode' }],
  [['perfume', 'lotion', 'lipstick', 'hair spray'], { fr: 'Un produit de beauté', cat: 'mode' }],
  [['guitar', 'banjo', 'violin'], { fr: 'Une guitare', cat: 'loisirs' }],
  [['grand piano', 'upright piano'], { fr: 'Un piano / clavier', cat: 'loisirs' }],
  [['soccer ball', 'basketball', 'volleyball', 'rugby ball', 'tennis ball'], { fr: 'Un ballon', cat: 'loisirs' }],
  [['book jacket', 'comic book'], { fr: 'Un livre', cat: 'loisirs' }],
  [['dumbbell', 'barbell'], { fr: 'Du matériel de sport', cat: 'loisirs' }],
  [['stroller', 'baby carriage', 'bassinet', 'cradle', 'crib'], { fr: 'Un article pour bébé', cat: 'bebe' }],
]

export interface VisionResult {
  categoryId?: string
  /** Début de description prêt à l'emploi (français), ou undefined. */
  description?: string
}

/**
 * Analyse une photo (data-URI) et propose { catégorie, début de description }.
 * Renvoie {} si rien de sûr ou si le modèle ne charge pas (fail-open).
 */
export async function analyzePhoto(dataUri: string): Promise<VisionResult> {
  try {
    const model = await getModel()
    const img = await loadImageEl(dataUri)
    const preds = await model.classify(img, 5)
    if (!preds.length) return {}
    const joined = preds.map((p) => p.className.toLowerCase()).join(' | ')
    for (const [keys, obj] of LABELS) {
      if (keys.some((k) => joined.includes(k))) {
        return {
          categoryId: obj.cat,
          description: `${obj.fr} en bon état, à vendre. Contactez-moi pour plus d'infos.`,
        }
      }
    }
    return {}
  } catch {
    return {} // fail-open : aucun impact sur le formulaire
  }
}
