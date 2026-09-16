/**
 * LES COULEURS D'UNE ANNONCE, SUR LA CARTE — 16/09/2026.
 *
 * Repris d'une planche envoyée par le Patron : dans une grille de chemises,
 * chaque carte porte sous son prix trois pastilles de couleur et un « +2 ».
 * C'est la seule idée vraiment neuve de cette série, et elle est bonne :
 * « est-ce que ça existe en noir ? » se répond alors SANS OUVRIR l'annonce.
 * Sur une grille à deux colonnes et un forfait qui se compte, c'est beaucoup.
 *
 * Rien à demander à personne : les couleurs sont déjà saisies au formulaire
 * (champ `couleurs`, type `colors`), déjà peintes sur la fiche, et le serveur
 * envoie déjà `attributes` avec chaque annonce de la liste. Il ne manquait que
 * de les montrer un cran plus tôt.
 *
 * ⚠️ TROIS CHOIX QUI MÉRITENT D'ÊTRE ÉCRITS.
 *
 * 1. QUATRE PASTILLES AU PLUS, puis « +n ». Une carte fait la moitié d'un écran
 *    de téléphone : au-delà, les pastilles rétrécissent ou la ligne passe à la
 *    suivante, et la grille perd son alignement.
 *
 * 2. LES TEINTES CLAIRES PORTENT UN LISERÉ. Sans lui, « Blanc » disparaît sur
 *    la carte blanche — on afficherait une couleur invisible, ce qui est pire
 *    que de ne rien afficher. Le drapeau `clair` existe pour ça dans
 *    `couleurs.ts` et il est respecté ici comme sur la fiche.
 *
 * 3. LES PASTILLES SONT DÉCORATIVES, LE TEXTE PORTE LE SENS. Un lecteur
 *    d'écran entend « Couleurs : Noir, Blanc, Bleu » — jamais une suite de
 *    ronds muets. La couleur ne doit JAMAIS être la seule porteuse d'une
 *    information : c'est vrai pour un daltonien comme pour quelqu'un dont
 *    l'écran est lavé par le soleil d'Abidjan.
 */
import { lireCouleurs } from '../data/couleurs'

const MAX = 4

export function PastillesCouleurs({ valeur }: { valeur?: string }) {
  const couleurs = lireCouleurs(valeur)
  // Une seule couleur ne dit rien qu'on ne voie déjà sur la photo : on la tait
  // plutôt que d'allonger la carte pour rien.
  if (couleurs.length < 2) return null

  const vues = couleurs.slice(0, MAX)
  const reste = couleurs.length - vues.length

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <span className="sr-only">Couleurs : {couleurs.map((c) => c.nom).join(', ')}</span>
      {vues.map((c) => (
        <span
          key={c.nom}
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 rounded-full ${c.clair ? 'ring-1 ring-inset ring-black/25' : ''}`}
          style={{ background: c.css }}
        />
      ))}
      {reste > 0 && (
        <span aria-hidden="true" className="tnum text-[10px] font-semibold text-gray-500">
          +{reste}
        </span>
      )}
    </div>
  )
}
