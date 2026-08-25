// Forme commune des pages légales traduites (CGU et Confidentialité).
//
// Les traductions légales sont fournies À TITRE D'INFORMATION : chaque page
// traduite s'ouvre sur `avis`, qui dit dans la langue du lecteur que seule la
// version française fait foi. Les textes sont des chaînes simples : les
// paragraphes se séparent par une ligne vide, les listes par des lignes
// « • … » — la page les affiche en `whitespace-pre-line`, ce qui garde cette
// structure sans avoir à traduire du JSX.

export type TexteLegal = {
  titre: string
  sousTitre: string
  /** Bannière « seule la version française fait foi », dans la langue. */
  avis: string
  /** Titre de la carte sommaire. */
  sommaire: string
  /** Paragraphe d'introduction, avant la première section. */
  intro: string
  /** Sections numérotées — mêmes ancres `sec-N` que la page française. */
  sections: { titre: string; texte: string }[]
}
