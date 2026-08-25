import type { LangueTraduite } from '../../lib/langue'
import type { TexteLegal } from '../legal'

// Traductions des CGU (src/pages/Terms.tsx) — un fichier par langue, chargé à
// la demande. Les 13 sections suivent EXACTEMENT l'ordre français (mêmes
// ancres sec-1 … sec-13).
//
// NOTE aux traducteurs de demain : la section 2 (mentions légales) reprend en
// dur le rendu actuel de la page française, où les constantes EDITOR_* sont
// vides (« Chap.ci, Côte d'Ivoire »). Si le Patron les renseigne un jour dans
// Terms.tsx (RCCM, siège…), il faudra reporter la précision ici aussi.

export function chargerConditions(l: LangueTraduite): Promise<TexteLegal | null> {
  switch (l) {
    case 'en':
      return import('./en').then((m) => m.cgu)
    case 'es':
      return import('./es').then((m) => m.cgu)
    case 'pt':
      return import('./pt').then((m) => m.cgu)
    case 'ar':
      return import('./ar').then((m) => m.cgu)
    case 'zh':
      return import('./zh').then((m) => m.cgu)
    default:
      return Promise.resolve(null)
  }
}
