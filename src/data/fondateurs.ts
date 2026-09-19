/**
 * LES FONDATEURS DE CHAP.CI — la moitié « site » de la source unique.
 *
 * L'autre moitié est `chapci_fondateurs()` dans `web/seo.php`. Les deux
 * doivent dire exactement la même chose, et `npm run banc:fondateurs` refuse
 * qu'elles divergent : la page servie à Google et la page vue dans
 * l'application portent les mêmes noms, ou aucune des deux ne vaut rien.
 *
 * Pourquoi deux fichiers plutôt qu'un : le site est une application d'une
 * seule page, derrière un `#`, que Google ne peut pas lire (voir le long
 * commentaire de `/a-propos` dans seo.php). La version PHP existe pour les
 * robots, celle-ci pour les visiteurs. Un seul fichier servirait mal l'un des
 * deux — un banc qui compare les deux coûte moins cher qu'une page fausse.
 *
 * ⚠️ UN NOM DE PERSONNE NE S'APPROXIME PAS. L'orthographe vient du pacte de
 * fondateurs (journal du 21/08/2026). Si une ligne est fausse, elle se corrige
 * ICI et dans seo.php, jamais dans un composant.
 *
 * `photo` : vide tant que les portraits ne sont pas livrés. La carte affiche
 * alors les initiales dans un rond — jamais une image cassée.
 */
export type Fondateur = {
  nom: string
  role: string
  /** Chemin absolu depuis la racine du site, ex. `/equipe/abraham.jpg`. */
  photo: string
}

export const FONDATEURS: Fondateur[] = [
  { nom: 'Zika Bi Abraham', role: 'Cofondateur', photo: '' },
  { nom: 'Guibe Goze Ange Venceslas', role: 'Cofondateur', photo: '' },
]

/** Initiales pour la pastille : première lettre des deux premiers mots. */
export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/)
  return (mots[0]?.[0] ?? '') + (mots[1]?.[0] ?? '')
}
