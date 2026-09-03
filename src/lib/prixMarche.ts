/**
 * « ÇA VAUT COMBIEN ? » — lire une fourchette de marché et en tirer un mot.
 *
 * Nouveauté n° 3 du 03/09/2026. Le serveur (`/listings/prix-marche`) mesure la
 * fourchette des annonces récentes de la même sous-catégorie ; ce fichier dit
 * ce qu'on en fait, au même endroit pour le vendeur qui tape son prix et pour
 * l'acheteur qui lit la fiche — sinon les deux écrans finiraient par se
 * contredire.
 *
 * ⚠️ CE N'EST PAS UNE COTE. C'est ce que les gens DEMANDENT sur Chap.ci, pas
 * ce qu'ils obtiennent. Le mot reste donc prudent : « dans la moyenne », pas
 * « juste prix ». Et sous cinq annonces, pas de fourchette du tout — trois
 * prix ne font pas un marché.
 *
 * Le seul verdict qui pèse est « bien en dessous » : à moins de 60 % du bas de
 * la fourchette, on est dans la zone du « prix trop beau », premier signal de
 * l'arnaque (skill moderation-ci). On le dit à l'acheteur sans accuser le
 * vendeur : « méfiance », pas « arnaque ».
 */
import type { PrixMarche } from './api'

export type Verdict = 'bas' | 'moyen' | 'haut' | null

/** Le mot pour un prix, ou `null` si la fourchette n'existe pas encore. */
export function verdictPrix(prix: number, f: PrixMarche | null): Verdict {
  if (!f || f.p25 == null || f.p75 == null || prix <= 0) return null
  if (prix < f.p25 * 0.6) return 'bas'
  if (prix > f.p75 * 1.4) return 'haut'
  return 'moyen'
}

/** « entre 45 000 et 80 000 FCFA » — la phrase de la fourchette. */
export function fourchetteTexte(f: PrixMarche, format: (v: number) => string): string {
  return `entre ${format(f.p25 as number)} et ${format(f.p75 as number)}`
}
