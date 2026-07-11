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

export const donationOperators: DonationOperator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    emoji: '🟠',
    color: '#FF7900',
    number: '+225 07 00 00 00 00', // 👉 À REMPLACER
    accountName: 'Chap.ci', // 👉 À REMPLACER
    ussd: '#144#',
    howTo:
      "Composez #144*1#, choisissez « Transfert d'argent », saisissez le numéro Chap.ci et le montant, puis validez avec votre code secret Orange Money.",
  },
  {
    id: 'mtn',
    name: 'MTN MoMo',
    emoji: '🟡',
    color: '#FFCC08',
    number: '+225 05 00 00 00 00', // 👉 À REMPLACER
    accountName: 'Chap.ci', // 👉 À REMPLACER
    ussd: '*133#',
    howTo:
      "Composez *133#, choisissez « Transfert d'argent », saisissez le numéro Chap.ci et le montant, puis validez avec votre code PIN MoMo.",
  },
  {
    id: 'moov',
    name: 'Moov Money',
    emoji: '🔵',
    color: '#004B9B',
    number: '+225 01 00 00 00 00', // 👉 À REMPLACER
    accountName: 'Chap.ci', // 👉 À REMPLACER
    ussd: '*155#',
    howTo:
      'Composez *155*1*1#, saisissez le numéro Chap.ci et le montant, puis validez avec votre code secret Moov Money.',
  },
  {
    id: 'wave',
    name: 'Wave',
    emoji: '🌊',
    color: '#1DC3EC',
    number: '+225 07 00 00 00 00', // 👉 À REMPLACER
    accountName: 'Chap.ci', // 👉 À REMPLACER
    // paymentLink: 'https://pay.wave.com/m/XXXXXXXX/c/ci/',  // 👉 (optionnel) Votre lien Wave
    howTo:
      "Ouvrez l'appli Wave (ou composez *555#), envoyez au numéro Chap.ci, saisissez le montant et confirmez avec votre code PIN.",
  },
]

/** Montants suggérés en FCFA */
export const suggestedAmounts = [500, 1000, 2000, 5000, 10000, 25000]

export const donationCopy = {
  title: 'Soutenir Chap.ci',
  subtitle: 'Chap.ci est gratuit. Votre don nous aide à faire vivre et grandir la plateforme 🇨🇮',
  why: [
    'Garder Chap.ci 100 % gratuit pour les Ivoiriens',
    'Payer les serveurs et améliorer l’application',
    'Ajouter de nouvelles fonctionnalités (messagerie, paiement…)',
  ],
  thankYou: 'Merci infiniment pour votre soutien ! 🙏',
  transparency:
    "Chap.ci ne vous demande jamais votre code secret / PIN : il ne se saisit que dans le menu de votre opérateur. La confirmation du don dépend du SMS de l'opérateur, pas d'une validation automatique du site.",
}
