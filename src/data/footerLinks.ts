// =============================================================================
//  Liens du pied de page — SOURCE UNIQUE.
//
//  Utilisés à deux endroits : le pied de page lui-même (Footer.tsx) et la page
//  « Plan du site » (SiteMap.tsx), qui prend le relais sur téléphone et
//  tablette. Les dupliquer garantirait qu'un jour l'un des deux mente.
// =============================================================================

export type FooterLink = { to: string; label: string; state?: unknown }
export type FooterCol = { title: string; links: FooterLink[] }

export const FOOTER_COLS: FooterCol[] = [
  {
    title: 'Explorer',
    links: [
      { to: '/explorer', label: 'Toutes les annonces' },
      { to: '/?voir=categories', label: 'Catégories' },
      { to: '/explorer?tri=distance', label: 'Près de moi' },
      { to: '/explorer?promo=1', label: 'Bons plans' },
    ],
  },
  {
    title: 'Vendre',
    links: [
      // Libellés alignés sur le CONTENU réel des destinations.
      { to: '/publier', label: 'Publier une annonce' },
      { to: '/publicite', label: 'Faire de la publicité' },
      { to: '/aide?rubrique=vendre', label: 'Conseils vendeur' },
      { to: '/compte', label: 'Tableau de bord pro', state: { tab: 'ventes' } },
      { to: '/compte', label: 'Mes annonces', state: { tab: 'annonces' } },
    ],
  },
  {
    title: 'Aide',
    links: [
      { to: '/aide', label: 'Questions fréquentes' },
      { to: '/aide?rubrique=securite', label: 'Conseils de sécurité' },
      { to: '/contact?sujet=signaler', label: 'Signaler un problème' },
      { to: '/contact', label: 'Nous contacter' },
    ],
  },
  {
    title: 'Chap.ci',
    links: [
      { to: '/a-propos', label: 'À propos' },
      // « Confidentialité » et non « RGPD » : le RGPD est le règlement EUROPÉEN.
      // Nos utilisateurs sont ivoiriens, et le texte qui les protège est la loi
      // n° 2013-450. Afficher le sigle d'un droit qui ne s'applique pas à eux
      // n'informe personne.
      { to: '/confidentialite', label: 'Confidentialité' },
      { to: '/conditions', label: 'CGU' },
      // Google Play exige que ce chemin soit TROUVABLE depuis le web : le lien du
      // pied de page est ce qui le rend découvrable. Ne pas le retirer.
      { to: '/suppression-compte', label: 'Supprimer mon compte' },
      { to: '/contact?sujet=partenariat', label: 'Partenariat & presse' },
    ],
  },
]

/** Phrase de présentation, reprise à l'identique aux deux endroits. */
export const FOOTER_TAGLINE =
  'La marketplace 100 % ivoirienne. Achetez et vendez chap-chap, partout en Côte d’Ivoire — en toute sécurité.'

/**
 * Mention de paiement.
 *
 * Formulée pour lever une ambiguïté que le bureau Juridique signale depuis deux
 * rondes : Chap.ci N'ENCAISSE AUCUNE transaction. Écrire « Paiement : Orange
 * Money · Wave » laissait croire que le site prend l'argent — ce qui changerait
 * ses obligations légales du tout au tout.
 */
export const FOOTER_PAIEMENT =
  'Les acheteurs paient par Orange Money ou Wave, directement au vendeur.'
