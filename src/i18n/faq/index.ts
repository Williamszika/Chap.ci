import type { LangueTraduite } from '../../lib/langue'

// Traductions de la page « Questions fréquentes » (src/pages/Faq.tsx).
//
// Un fichier par langue, chargé à la demande : un visiteur anglophone ne
// télécharge que l'anglais, et le visiteur français (l'immense majorité) ne
// télécharge rien du tout. Les rubriques et questions suivent EXACTEMENT
// l'ordre de la page française — les icônes et les ancres `?rubrique=` restent
// celles du français, seuls les textes changent.

export type TexteFaq = {
  titre: string
  sous: string
  recherche: string
  aucunTitre: string
  aucunTexte: string
  contactTitre: string
  contactTexte: string
  contactBouton: string
  /** 6 rubriques, mêmes questions et même ordre que la page française. */
  sections: { titre: string; items: { q: string; r: string }[] }[]
}

export function chargerFaq(l: LangueTraduite): Promise<TexteFaq | null> {
  switch (l) {
    case 'en':
      return import('./en').then((m) => m.faq)
    case 'es':
      return import('./es').then((m) => m.faq)
    case 'pt':
      return import('./pt').then((m) => m.faq)
    case 'ar':
      return import('./ar').then((m) => m.faq)
    case 'zh':
      return import('./zh').then((m) => m.faq)
    default:
      return Promise.resolve(null)
  }
}
