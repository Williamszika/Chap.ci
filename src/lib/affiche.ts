/**
 * L'AFFICHE POUR LE STATUT WHATSAPP — 1080 × 1920, fabriquée dans le navigateur.
 *
 * ⚠️ POURQUOI ELLE EXISTE. À Abidjan, une annonce se vend en statut WhatsApp
 * bien plus que sur une page. Jusqu'ici, un vendeur qui voulait y mettre son
 * annonce faisait une capture d'écran de la fiche — avec la barre du navigateur,
 * le prix à moitié coupé, et aucun moyen de retrouver l'annonce. Le bouton
 * « Affiche pour mon statut » fabrique une image propre : la photo, le prix en
 * éclat, la couronne, et le lien. Chaque statut ramène vers Chap.ci.
 *
 * Tout se passe DANS le téléphone : aucune requête au serveur, pas un octet de
 * plus pour le forfait que la photo déjà chargée. Un canvas de 1080 × 1920,
 * la police du site (déjà en cache), et le signe redessiné depuis les mêmes
 * chemins que l'en-tête (`signeChapci.ts`), pas une copie.
 *
 * ⚠️ LA PHOTO PEUT MANQUER, L'AFFICHE NE DOIT PAS. Dans l'application native,
 * la page vit sur https://localhost et les photos sur chap.ci : sans en-tête
 * CORS sur /uploads, le canvas est « souillé » et refuse d'exporter. Plutôt
 * qu'une erreur, on fabrique alors l'affiche SANS la photo — fond pâle, grande
 * couronne en filigrane. Le vendeur a quand même quelque chose à poster.
 *
 * Composition (skill `affiche-design`) : une seule idée, un seul point focal
 * (la photo), marges de sécurité de 8 % — un statut se recadre —, prix en
 * éclat vert cerclé de blanc, palette de la marque, rien de plus.
 */
import { FEUILLES, NOYAU } from '../components/signeChapci'

export interface AfficheDonnees {
  id: string
  titre: string
  /** Prix affiché en grand (le prix promo s'il y en a une). */
  prix: string
  /** Prix barré, quand il y a une promotion. */
  prixBarre?: string
  /** URL (ou data:) de la photo principale. Peut manquer. */
  photo?: string
  /** « Cocody · Abidjan » */
  lieu: string
  /** « Neuf » / « Occasion » */
  etat: string
}

const L = 1080
const H = 1920
/** Marge de sécurité : 8 % du petit côté. Un statut se recadre sur les bords. */
const MARGE = 86
const ORANGE = '#F77F00'
const VERT = '#009E60'
const VERT_F = '#00734A'
const CREME = '#FFFDF9'
const CREME_F = '#FDEFDC'
const ENCRE = '#1B1A17'
/** Gris chaud : 5,39:1 sur blanc, mesuré — lisible en plein soleil. */
const GRIS = '#6F6A5E'
const POLICE = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif'

/** Le signe en SVG, avec les deux moitiés du drapeau — même partage que Logo.tsx. */
function signeSvg(px: number): string {
  const gauche: string[] = []
  const droite: string[] = []
  for (const [d, rot] of FEUILLES) {
    const cx = Number(rot.split(' ')[1])
    ;(cx < 100 ? gauche : droite).push(`<path d="${d}" transform="rotate(${rot})"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${px}" height="${px}">` +
    `<g fill="${ORANGE}">${gauche.join('')}</g>` +
    `<g fill="${VERT}">${droite.join('')}</g>` +
    `<polygon points="${NOYAU}" fill="#FFFFFF"/>` +
    `<polygon points="${NOYAU}" fill="none" stroke="${VERT_F}" stroke-width="3"/>` +
    `</svg>`
}

function chargerImage(src: string, anonyme: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (anonyme) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image illisible : ' + src.slice(0, 60)))
    img.src = src
  })
}

function arrondi(ctx: CanvasRenderingContext2D, x: number, y: number, l: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + l, y, x + l, y + h, r)
  ctx.arcTo(x + l, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + l, y, r)
  ctx.closePath()
}

/** Coupe un texte en lignes qui tiennent dans `largeur`, au plus `max` lignes, « … » à la fin. */
function lignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number, max: number): string[] {
  const mots = texte.trim().split(/\s+/)
  const out: string[] = []
  let ligne = ''
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot
    if (ctx.measureText(essai).width <= largeur || !ligne) ligne = essai
    else { out.push(ligne); ligne = mot }
    if (out.length === max) break
  }
  if (out.length < max && ligne) out.push(ligne)
  const tronque = mots.join(' ').length > out.join(' ').length
  if (tronque) {
    // On coupe sur un MOT, jamais au milieu : « batteri… » (vu au premier
    // rendu) se lit comme une faute, « batterie… » comme une suite.
    let derniere = out[max - 1]
    while (derniere.includes(' ') && ctx.measureText(derniere + ' …').width > largeur) {
      derniere = derniere.slice(0, derniere.lastIndexOf(' '))
    }
    if (ctx.measureText(derniere + ' …').width > largeur) {
      // Un seul mot trop long pour la ligne : là seulement, on l'entame.
      while (derniere.length > 1 && ctx.measureText(derniere + '…').width > largeur) derniere = derniere.slice(0, -1)
      out[max - 1] = derniere + '…'
    } else {
      // « impeccable, … » : la virgule avant les points est un bégaiement.
      out[max - 1] = derniere.replace(/[,;:\-–—]+$/, '') + ' …'
    }
  }
  return out
}

/** Fabrique l'affiche. Ne rejette que si le navigateur ne sait pas exporter le canvas. */
export async function rendreAffiche(d: AfficheDonnees): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Ce navigateur ne sait pas dessiner l’affiche.')

  // La police du site, si elle est là. Sinon la pile de repli fait le travail.
  try { await document.fonts.load(`800 68px ${POLICE}`) } catch { /* police système */ }

  // ── Fond ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = CREME
  ctx.fillRect(0, 0, L, H)

  // ── En-tête : la couronne et le nom ──────────────────────────────────────
  const signe = await chargerImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(signeSvg(120)), false)
  ctx.drawImage(signe, MARGE, MARGE, 120, 120)
  ctx.fillStyle = ENCRE
  ctx.textBaseline = 'alphabetic'
  ctx.font = `800 72px ${POLICE}`
  ctx.fillText('Chap.ci', MARGE + 120 + 24, MARGE + 78)
  ctx.fillStyle = GRIS
  ctx.font = `600 30px ${POLICE}`
  ctx.fillText('Petites annonces · Côte d’Ivoire', MARGE + 120 + 26, MARGE + 118)

  // ── La photo : le point focal ────────────────────────────────────────────
  const px = MARGE, py = 250, pl = L - 2 * MARGE, ph = 1000, pr = 48
  let photo: HTMLImageElement | null = null
  if (d.photo) {
    try { photo = await chargerImage(d.photo, !/^data:/i.test(d.photo)) } catch { photo = null }
  }
  // Ombre chaude, comme les cartes du site.
  ctx.save()
  ctx.shadowColor = 'rgba(120,70,10,.28)'
  ctx.shadowBlur = 34
  ctx.shadowOffsetY = 12
  ctx.fillStyle = CREME_F
  arrondi(ctx, px, py, pl, ph, pr)
  ctx.fill()
  ctx.restore()
  ctx.save()
  arrondi(ctx, px, py, pl, ph, pr)
  ctx.clip()
  if (photo) {
    // « cover » : on remplit le cadre, on rogne le surplus au centre.
    const k = Math.max(pl / photo.naturalWidth, ph / photo.naturalHeight)
    const dl = photo.naturalWidth * k, dh = photo.naturalHeight * k
    ctx.drawImage(photo, px + (pl - dl) / 2, py + (ph - dh) / 2, dl, dh)
  } else {
    ctx.fillStyle = CREME_F
    ctx.fillRect(px, py, pl, ph)
    ctx.globalAlpha = 0.16
    const grand = await chargerImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(signeSvg(640)), false)
    ctx.drawImage(grand, px + (pl - 640) / 2, py + (ph - 640) / 2, 640, 640)
    ctx.globalAlpha = 1
  }
  ctx.restore()

  // ── Le prix, en éclat : pastille verte cerclée de blanc, à cheval sur la photo
  ctx.font = `800 76px ${POLICE}`
  const largPrix = ctx.measureText(d.prix).width
  const pastL = largPrix + 2 * 52, pastH = 128
  const pastX = (L - pastL) / 2, pastY = py + ph - pastH / 2
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.25)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8
  ctx.fillStyle = '#FFFFFF'
  arrondi(ctx, pastX - 8, pastY - 8, pastL + 16, pastH + 16, (pastH + 16) / 2)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = VERT
  arrondi(ctx, pastX, pastY, pastL, pastH, pastH / 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.fillText(d.prix, L / 2, pastY + 88)
  if (d.prixBarre) {
    // L'ancien prix, barré, juste au-dessus de la pastille — sur la photo, donc
    // sur un petit fond blanc pour rester lisible quelle que soit la photo.
    ctx.font = `700 36px ${POLICE}`
    const lb = ctx.measureText(d.prixBarre).width
    const bx = (L - lb) / 2 - 20, by = pastY - 74
    ctx.fillStyle = 'rgba(255,255,255,.92)'
    arrondi(ctx, bx, by, lb + 40, 56, 28)
    ctx.fill()
    ctx.fillStyle = GRIS
    ctx.fillText(d.prixBarre, L / 2, by + 40)
    ctx.strokeStyle = GRIS
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo((L - lb) / 2, by + 28)
    ctx.lineTo((L + lb) / 2, by + 28)
    ctx.stroke()
  }
  ctx.textAlign = 'left'

  // ── Le titre : deux lignes à 68 px ; s'il n'y tient pas, trois à 56 px ──
  // Le premier statut posté (04/09/2026) disait « Formation sur
  // l'installation … » : les deux lignes avaient mangé « Sage 100 SQL », le
  // seul mot que l'acheteur cherche. Trois lignes un peu plus petites gardent
  // le titre lisible de loin ET entier plus souvent.
  ctx.fillStyle = ENCRE
  ctx.font = `800 68px ${POLICE}`
  let titre = lignes(ctx, d.titre, L - 2 * MARGE, 2)
  let pas = 80
  if (titre.some((l) => l.endsWith('…'))) {
    ctx.font = `800 56px ${POLICE}`
    titre = lignes(ctx, d.titre, L - 2 * MARGE, 3)
    pas = 64
  }
  let y = py + ph + 64 + 90
  for (const l of titre) { ctx.fillText(l, MARGE, y); y += pas }

  // ── Lieu et état ──────────────────────────────────────────────────────────
  ctx.fillStyle = GRIS
  ctx.font = `600 40px ${POLICE}`
  ctx.fillText(`${d.lieu}  ·  ${d.etat}`, MARGE, y + 20)

  // ── L'appel : voir sur chap.ci ────────────────────────────────────────────
  const cy = H - MARGE - 60 - 130
  ctx.fillStyle = ORANGE
  arrondi(ctx, MARGE, cy, L - 2 * MARGE, 130, 65)
  ctx.fill()
  // Encre sur orange : 6,62:1, mesuré — le blanc n'y ferait que 2,63.
  ctx.fillStyle = ENCRE
  ctx.font = `800 54px ${POLICE}`
  ctx.textAlign = 'center'
  ctx.fillText('Voir l’annonce sur chap.ci', L / 2, cy + 84)
  ctx.fillStyle = GRIS
  ctx.font = `600 32px ${POLICE}`
  ctx.fillText(`chap.ci/annonce/${d.id}`, L / 2, H - MARGE + 4)
  ctx.textAlign = 'left'

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('export impossible'))), 'image/png')
    } catch (e) {
      // Canvas souillé (photo d'une autre origine sans CORS) : on refait SANS
      // la photo plutôt que d'échouer. Voir l'avertissement en tête de fichier.
      if (d.photo) rendreAffiche({ ...d, photo: undefined }).then(resolve, reject)
      else reject(e instanceof Error ? e : new Error(String(e)))
    }
  })
}

/**
 * Envoie l'affiche à WhatsApp (ou ailleurs) par le partage du système ; si le
 * navigateur ne sait pas partager un fichier, la télécharge. Renvoie ce qui a
 * été fait, pour que l'écran dise la bonne phrase.
 *
 * ⚠️ L'IMAGE PART SEULE, SANS TEXTE. Le 4 septembre 2026, deux essais du Patron
 * (iPhone, puis WhatsApp sur Mac) ont donné deux statuts SANS l'affiche : quand
 * WhatsApp reçoit une image ET un texte qui contient un lien, il garde le lien,
 * fabrique sa propre carte d'aperçu, et jette l'image. Le lien est déjà écrit
 * sur l'affiche ; le texte n'apportait rien qu'elle n'ait déjà.
 */
export async function partagerAffiche(blob: Blob, nom: string): Promise<'partage' | 'telecharge'> {
  const fichier = new File([blob], nom, { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier] })
      return 'partage'
    } catch (e) {
      // Annulé par la personne : rien à faire, et surtout pas un téléchargement
      // qu'elle n'a pas demandé.
      if ((e as { name?: string }).name === 'AbortError') return 'partage'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'telecharge'
}
