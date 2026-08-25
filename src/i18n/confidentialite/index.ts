import type { LangueTraduite } from '../../lib/langue'
import type { TexteLegal } from '../legal'

// Traductions de la Politique de confidentialité (src/pages/Privacy.tsx) — un
// fichier par langue, chargé à la demande. Les 12 sections suivent EXACTEMENT
// l'ordre français (mêmes ancres sec-1 … sec-12). L'encadré « analyse des
// photos sur l'appareil » (exigence Google Play) est le dernier paragraphe de
// la section 3 dans chaque langue.

export function chargerConfidentialite(l: LangueTraduite): Promise<TexteLegal | null> {
  switch (l) {
    case 'en':
      return import('./en').then((m) => m.politique)
    case 'es':
      return import('./es').then((m) => m.politique)
    case 'pt':
      return import('./pt').then((m) => m.politique)
    case 'ar':
      return import('./ar').then((m) => m.politique)
    case 'zh':
      return import('./zh').then((m) => m.politique)
    default:
      return Promise.resolve(null)
  }
}
