// =============================================================================
//  CONFIGURATION DES DONS — Mobile Money Côte d'Ivoire
// =============================================================================
//  👉 REMPLACEZ les numéros et noms de compte ci-dessous par VOS informations
//     réelles. C'est le SEUL endroit à modifier pour recevoir les dons.
//
//  Les codes USSD et couleurs proviennent d'une recherche (juillet 2026) et
//  peuvent évoluer ; vérifiez-les auprès de chaque opérateur.
// =============================================================================

export interface DonationOperator {
  id: 'orange' | 'mtn' | 'moov' | 'wave'
  name: string
  emoji: string
  color: string // couleur de marque (hex)
  /** 👉 Numéro qui reçoit les dons (À REMPLIR) */
  number: string
  /** 👉 Nom du compte affiché au donateur (À REMPLIR) */
  accountName: string
  /** Code USSD pour ouvrir le menu de l'opérateur */
  ussd?: string
  /** Explication courte pour envoyer un don */
  howTo: string
  /** Lien de paiement Wave (optionnel, ex : https://pay.wave.com/m/...) */
  paymentLink?: string
}

// Deux moyens de paiement : Orange Money et Wave, même numéro : 07 59 90 11 20.
export const donationOperators: DonationOperator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    emoji: '🟠',
    color: '#FF7900',
    number: '+225 07 59 90 11 20',
    accountName: 'Chap.ci',
    ussd: '#144#',
    howTo:
      "Composez #144*1#, choisissez « Transfert d'argent », saisissez le numéro Chap.ci (07 59 90 11 20) et le montant, puis validez avec votre code secret Orange Money.",
  },
  {
    id: 'wave',
    name: 'Wave',
    emoji: '🌊',
    color: '#1DC3EC',
    number: '+225 07 59 90 11 20',
    accountName: 'Chap.ci',
    howTo:
      "Ouvrez l'appli Wave (ou composez #144#), envoyez au numéro Chap.ci (07 59 90 11 20), saisissez le montant et confirmez avec votre code PIN.",
  },
]

/** Montants suggérés en FCFA (grille de l'artifact : 5 montants + « Autre ») */
export const suggestedAmounts = [1000, 2500, 5000, 10000, 25000]

export const donationCopy = {
  title: 'Soutiens Chap.ci',
  subtitle: 'Aidez-nous à garder la plateforme gratuite pour tous.',
  why: [
    'Garder Chap.ci 100 % gratuit pour les Ivoiriens',
    'Payer les serveurs et améliorer l’application',
    'Ajouter de nouvelles fonctionnalités (messagerie, paiement…)',
  ],
  thankYou: 'Merci infiniment pour votre soutien ! 🙏',
  transparency:
    "Chap.ci ne vous demande jamais votre code secret / PIN : il ne se saisit que dans le menu de votre opérateur. La confirmation du don dépend du SMS de l'opérateur, pas d'une validation automatique du site.",
}
