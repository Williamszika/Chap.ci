// =============================================================================
//  LES DONS — Mobile Money Côte d'Ivoire (07/09/2026).
//
//  Port fidèle de `src/data/donation.ts`. Le Patron : « Soutenir Chap.ci n'est
//  pas dans l'app ».
//
//  ⚠️ CE FICHIER PORTE DES NUMÉROS QUI REÇOIVENT DE L'ARGENT. Un chiffre qui
//  diverge de celui du site, et un don part chez quelqu'un d'autre — sans que
//  personne ne s'en aperçoive, puisque Chap.ci n'est jamais dans le circuit et
//  ne sait pas qu'un don a eu lieu. `npm run banc:coherence` compare donc les
//  deux fichiers, opérateur par opérateur, chiffre par chiffre, et passe au
//  rouge à la moindre différence. Ne modifiez JAMAIS un numéro ici seul :
//  `src/data/donation.ts` est la source, celui-ci la suit.
// =============================================================================
library;

/// Un opérateur Mobile Money qui reçoit les dons.
class OperateurDon {
  final String id; // orange | wave (mêmes identifiants que le site)
  final String nom;
  final String emoji;

  /// La couleur de marque, telle que le site l'écrit (hexadécimal).
  final int couleur;

  /// Le numéro qui reçoit les dons, tel qu'il s'affiche.
  final String numero;
  final String nomCompte;

  /// Le code USSD qui ouvre le menu de l'opérateur, ou null.
  final String? ussd;

  /// Comment envoyer le don, en une phrase.
  final String commentFaire;

  const OperateurDon({
    required this.id,
    required this.nom,
    required this.emoji,
    required this.couleur,
    required this.numero,
    required this.nomCompte,
    required this.commentFaire,
    this.ussd,
  });

  /// Le numéro sans espaces — celui qu'on copie et qu'on compose.
  String get numeroBrut => numero.replaceAll(' ', '');
}

/// Deux moyens de paiement, même numéro — comme sur le site.
const List<OperateurDon> operateursDon = [
  OperateurDon(
    id: 'orange',
    nom: 'Orange Money',
    emoji: '🟠',
    couleur: 0xFFFF7900,
    numero: '+225 07 59 90 11 20',
    nomCompte: 'Chap.ci',
    ussd: '#144#',
    commentFaire:
        'Composez #144*1#, choisissez « Transfert d’argent », saisissez le numéro Chap.ci (07 59 90 11 20) et le montant, puis validez avec votre code secret Orange Money.',
  ),
  OperateurDon(
    id: 'wave',
    nom: 'Wave',
    emoji: '🌊',
    couleur: 0xFF1DC3EC,
    numero: '+225 07 59 90 11 20',
    nomCompte: 'Chap.ci',
    commentFaire:
        'Ouvrez l’appli Wave (ou composez #144#), envoyez au numéro Chap.ci (07 59 90 11 20), saisissez le montant et confirmez avec votre code PIN.',
  ),
];

/// Les montants proposés, en FCFA — mêmes valeurs que le site.
const List<int> montantsDon = [1000, 2500, 5000, 10000, 25000];

/// Le montant sélectionné à l'ouverture, comme sur le site.
const int montantDonDefaut = 2500;

/// Un code USSD prêt pour un lien `tel:` (# → %23, * → %2A).
String lienUssd(String code) =>
    'tel:${code.replaceAll('#', '%23').replaceAll('*', '%2A')}';
