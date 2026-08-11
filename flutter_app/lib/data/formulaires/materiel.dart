// =============================================================================
//  MATÉRIEL PRO — sept sous-catégories (port fidèle de src/data/sous/materiel.dart).
//
//  L'équipement qui fait tourner un commerce. Ce n'est pas de l'électroménager :
//  l'acheteur achète un OUTIL DE TRAVAIL, et ce qu'il veut savoir, c'est
//  « combien d'heures a-t-il tourné, qui répare, et où trouve-t-on les pièces ».
//
//  1. LES HEURES DE FONCTIONNEMENT sont le kilométrage d'une machine.
//  2. LES PIÈCES DÉTACHÉES décident de tout : une machine dont on ne trouve plus
//     les pièces à Abidjan vaut le prix de la ferraille.
//  3. LA FACTURE : un professionnel en a besoin pour amortir et déclarer.
//
//  Le matériel médical a son garde-fou : un dispositif de diagnostic ou de soin
//  réservé aux professionnels ne peut pas être revendu entre particuliers.
// =============================================================================
import 'schema.dart';

String _t(Vals s, String cle) => (s[cle] ?? '').toString();

String _milliers(int n) {
  final str = n.abs().toString();
  final buf = StringBuffer();
  for (int i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 == 0) buf.write(' ');
    buf.write(str[i]);
  }
  return buf.toString();
}

/// Le kilométrage d'une machine.
final _heures = Champ('heures', 'Heures de fonctionnement',
    type: TypeChamp.nombre, unite: 'h', ph: 'Ex : 4500',
    h: (s) {
      final n = int.tryParse(_t(s, 'heures')) ?? 0;
      if (n == 0) return 'L’heure de fonctionnement est le kilométrage d’une machine. Si le compteur existe, donnez-le ; sinon, dites-le franchement.';
      final f = _milliers(n);
      if (n < 2000) return '$f heures : très peu. C’est un vrai argument de vente — mettez-le dans le titre.';
      if (n < 10000) return '$f heures : usage normal pour une machine professionnelle.';
      if (n < 20000) return '$f heures : bien utilisée. Annoncez l’entretien fait, et le prix suivra.';
      return '!$f heures : c’est beaucoup. Précisez ce qui a été révisé ou remplacé, sinon l’acheteur suppose le pire.';
    });

/// Ce qui décide vraiment de la valeur d'une machine d'occasion.
final _pieces = Champ('pieces', 'Pièces détachées',
    req: true,
    options: const ['Disponibles à Abidjan', 'Disponibles sur commande', 'Difficiles à trouver', 'Introuvables — modèle abandonné'],
    alerte: const Alerte(
      bon: 'Disponibles à Abidjan',
      ok: ['Disponibles sur commande'],
      texteBon: 'Les pièces se trouvent sur place. C’est ce qui fait la différence entre une machine et un tas de ferraille au premier pépin.',
      texteMauvais: 'Les pièces sont difficiles ou impossibles à trouver. Cette machine s’arrête définitivement à la première panne : n’en payez pas le prix d’un matériel entretenable.',
      textes: {'Disponibles sur commande': 'Pièces disponibles sur commande : comptez un délai. Demandez le nom du fournisseur avant d’acheter.'},
    ),
    h: (s) => RegExp('Difficiles|Introuvables').hasMatch(_t(s, 'pieces'))
        ? '!Une machine dont on ne trouve plus les pièces vaut le prix de la ferraille. Dites-le, et vendez-la pour ce qu’elle est : une source de pièces ou un dépannage court.'
        : 'C’est la première question d’un acheteur professionnel, avant même le prix. Nommez le fournisseur si vous le connaissez.');

final List<Champ> _communsPro = [
  _heures,
  const Champ('etatMarche', 'Fonctionnement',
      req: true,
      options: ['Fonctionne, essai possible sur place', 'Fonctionne, petit défaut annoncé', 'En panne — à réparer ou pour pièces'],
      h: 'Un acheteur professionnel voudra faire tourner la machine devant vous. Proposez-le d’emblée : cela vaut toutes les descriptions.'),
  _pieces,
  const Champ('entretien', 'Entretien',
      req: true,
      options: ['Carnet d’entretien à jour', 'Entretenu régulièrement, sans carnet', 'Entretien irrégulier', 'Jamais entretenu']),
  Champ('voltagePro', 'Alimentation',
      req: true,
      options: const ['220 V monophasé', '380 V triphasé', 'Gaz', 'Diesel / essence', 'Manuel', 'Batterie'],
      h: (s) => RegExp('380 V').hasMatch(_t(s, 'voltagePro'))
          ? '!Le triphasé n’est pas disponible partout : l’acheteur doit vérifier son abonnement CIE avant de se déplacer. Le préciser évite le camion pour rien.'
          : ''),
  const Champ('facturePro', 'Facture',
      req: true,
      options: ['Facture d’origine fournie', 'Facture de revente possible', 'Aucune facture'],
      h: 'Un professionnel a besoin d’une facture pour amortir son matériel. Sans elle, une partie du marché vous est fermée.'),
  const Champ('garantiePro', 'Garantie',
      req: true,
      options: ['Aucune garantie', '15 jours', '1 mois', '3 mois', '6 mois', '1 an', 'Garantie constructeur en cours']),
  const Champ('livraisonPro', 'Transport et installation',
      req: true,
      options: ['À enlever sur place', 'Livraison possible', 'Livraison et installation comprises', 'Installation en supplément'],
      h: 'Une machine lourde ne se transporte pas dans un taxi. Dire qui s’en charge évite la vente annulée au dernier moment.'),
];

final Map<String, Schema> materiel = {
  'Restauration & Maquis': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la machine en marche, et la plaque signalétique. Un professionnel regarde d’abord ça.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeResto'), _t(s, 'marquePro'), _t(s, 'capaciteResto')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeResto', 'Type de matériel',
          req: true,
          options: ['Chambre froide', 'Congélateur coffre', 'Vitrine réfrigérée', 'Réfrigérateur professionnel', 'Four à pizza', 'Four professionnel', 'Fourneau / piano', 'Friteuse', 'Grill / braisier', 'Plancha', 'Machine à glaçons', 'Machine à café', 'Batteur / pétrin', 'Trancheuse', 'Hotte aspirante', 'Plonge inox', 'Table inox', 'Chariot', 'Chaises et tables de maquis', 'Bar / comptoir']),
      const Champ('marquePro', 'Marque', ph: 'Ex : Bosch, Nasco, fabrication locale'),
      Champ('capaciteResto', 'Capacité',
          when: (s) => RegExp('froide|Congélateur|Vitrine|Réfrigérateur|Four|Friteuse|glaçons|Pétrin').hasMatch(_t(s, 'typeResto')),
          options: const ['Petite (moins de 100 L)', 'Moyenne (100 à 400 L)', 'Grande (400 à 1000 L)', 'Très grande (plus de 1000 L)', 'Chambre complète']),
      const Champ('inox', 'Matériau',
          options: ['Inox alimentaire', 'Acier peint', 'Aluminium', 'Mixte'],
          h: 'L’inox alimentaire est exigé par les contrôles d’hygiène. C’est un vrai argument de revente.'),
      ..._communsPro,
    ],
  ),
  'Boutique & Commerce': Schema(
    couleurs: false,
    sansCouleur: 'Montrez le matériel installé si possible : un commerçant se projette mieux.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeBoutique'), _t(s, 'marquePro')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeBoutique', 'Type de matériel',
          req: true,
          options: ['Caisse enregistreuse', 'Terminal de paiement', 'Balance commerciale', 'Rayonnage / gondole', 'Présentoir', 'Vitrine', 'Portique antivol', 'Caméra de surveillance', 'Étiqueteuse', 'Lecteur code-barres', 'Imprimante à tickets', 'Coffre-fort', 'Comptoir', 'Mannequin', 'Chariot / panier', 'Enseigne lumineuse']),
      const Champ('marquePro', 'Marque', ph: 'Ex : Casio, Sam4s, fabrication locale'),
      Champ('homologBalance', 'Vérification métrologique',
          req: true,
          when: (s) => RegExp('Balance').hasMatch(_t(s, 'typeBoutique')),
          options: const ['Vérifiée et poinçonnée', 'Vérification à refaire', 'Jamais vérifiée'],
          h: 'Une balance commerciale doit être vérifiée par le service de métrologie. Sans poinçon à jour, le contrôle la met sous scellé.'),
      const Champ('dimsPro', 'Dimensions', ph: 'Ex : 200 × 90 × 45 cm'),
      ..._communsPro,
    ],
  ),
  'Agriculture & Élevage': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la machine en fonctionnement, et le moteur ouvert.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeAgri'), _t(s, 'marquePro'), _t(s, 'heures').isNotEmpty ? '${_t(s, 'heures')} h' : ''].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeAgri', 'Type de matériel',
          req: true,
          options: ['Motopompe', 'Pulvérisateur', 'Broyeur', 'Décortiqueuse', 'Moulin', 'Égreneuse', 'Presse à huile', 'Séchoir', 'Couveuse industrielle', 'Mangeoire automatique', 'Abreuvoir automatique', 'Système d’irrigation', 'Motoculteur', 'Débroussailleuse pro', 'Tronçonneuse pro', 'Charrue', 'Semoir', 'Matériel de traite', 'Ruche et matériel apicole'],
          h: 'Les tracteurs et pelleteuses ne sont pas ici : ils vivent dans Véhicules → Engins & Agricoles.'),
      const Champ('marquePro', 'Marque', ph: 'Ex : Honda, Kipor, sans marque'),
      const Champ('debit', 'Débit ou capacité', ph: 'Ex : 30 m³/h, 500 kg/h',
          h: 'Le débit est ce qui permet à un exploitant de calculer s’il rentre dans ses frais. Sans lui, il ne se déplace pas.'),
      const Champ('surface', 'Adapté à une surface de',
          options: ['Moins d’un hectare', '1 à 5 hectares', '5 à 20 hectares', 'Plus de 20 hectares', 'Sans objet']),
      ..._communsPro,
    ],
  ),
  'Industrie & Atelier': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la plaque signalétique et la machine sous tension.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeIndus'), _t(s, 'marquePro'), _t(s, 'heures').isNotEmpty ? '${_t(s, 'heures')} h' : ''].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeIndus', 'Type de matériel',
          req: true,
          options: ['Groupe électrogène', 'Compresseur', 'Poste à souder', 'Tour', 'Fraiseuse', 'Perceuse à colonne', 'Scie à ruban', 'Cintreuse', 'Presse', 'Cabine de peinture', 'Pont élévateur', 'Cric hydraulique', 'Machine à coudre industrielle', 'Machine à broder', 'Imprimerie / offset', 'Sérigraphie', 'Découpe laser', 'Groupe froid', 'Palan / treuil', 'Chariot élévateur']),
      const Champ('marquePro', 'Marque'),
      const Champ('puissancePro', 'Puissance', ph: 'Ex : 5,5 kW, 10 kVA, 3 CV'),
      const Champ('usagePro', 'Usage précédent',
          req: true,
          options: ['Atelier artisanal', 'Usine / production continue', 'Chantier', 'Peu utilisé', 'Neuf, jamais servi'],
          h: 'Une machine sortie d’une production continue n’a pas vécu la vie d’une machine d’atelier. Le dire protège le prix des deux côtés.'),
      ..._communsPro,
    ],
  ),
  'Bureau & Informatique': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le mobilier monté et les compteurs des copieurs.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeBureau'), _t(s, 'marquePro')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeBureau', 'Type de matériel',
          req: true,
          options: ['Photocopieur', 'Imprimante professionnelle', 'Scanner de production', 'Destructeur de documents', 'Relieuse', 'Plastifieuse', 'Vidéoprojecteur', 'Tableau blanc / paperboard', 'Bureau', 'Chaise de bureau', 'Armoire de classement', 'Cloison / open space', 'Fauteuil de direction', 'Table de réunion', 'Coffre de bureau', 'Standard téléphonique'],
          h: 'Les ordinateurs, écrans et petites imprimantes vivent dans Électronique. Ici, c’est le matériel de production et le mobilier professionnel.'),
      const Champ('marquePro', 'Marque', ph: 'Ex : Canon, Ricoh, Konica'),
      Champ('compteurCopies', 'Compteur de copies',
          type: TypeChamp.nombre, unite: 'copies', ph: 'Ex : 120000',
          when: (s) => RegExp('Photocopieur|Imprimante|Scanner').hasMatch(_t(s, 'typeBureau')),
          h: (s) {
            final n = int.tryParse(_t(s, 'compteurCopies')) ?? 0;
            if (n > 500000) return '!Au-delà de 500 000 copies, le tambour et le four arrivent en fin de vie. Précisez s’ils ont été remplacés.';
            return 'Le compteur est le kilométrage d’un copieur. Il s’affiche dans le menu de la machine — l’acheteur le vérifiera.';
          }),
      Champ('consommables', 'Consommables',
          req: true,
          when: (s) => RegExp('Photocopieur|Imprimante|Relieuse|Plastifieuse|Vidéoprojecteur').hasMatch(_t(s, 'typeBureau')),
          options: const ['Consommables neufs fournis', 'Consommables entamés', 'Sans consommable', 'Consommables encore trouvables', 'Consommables introuvables'],
          h: 'Un toner de copieur professionnel coûte parfois plus cher que la machine d’occasion. L’acheteur doit le savoir avant.'),
      const Champ('quantitePro', 'Quantité disponible',
          options: ['À l’unité', '2 à 5', '5 à 20', 'Plus de 20', 'Lot complet de bureau']),
      ..._communsPro,
    ],
  ),
  'Salon & Esthétique': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez le poste complet, installé : c’est ce qu’achète une gérante de salon.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeSalon'), _t(s, 'marquePro')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeSalon', 'Type de matériel',
          req: true,
          options: ['Fauteuil de coiffure', 'Bac à shampoing', 'Casque séchoir', 'Vapozone', 'Table de massage', 'Chariot de coiffure', 'Miroir professionnel', 'Stérilisateur', 'Lampe UV / LED ongles', 'Ponceuse à ongles', 'Appareil de soin visage', 'Table d’esthétique', 'Tondeuse professionnelle', 'Sèche-cheveux professionnel', 'Lisseur professionnel', 'Chaise d’attente', 'Comptoir d’accueil', 'Mannequin de coiffure']),
      const Champ('marquePro', 'Marque'),
      const Champ('hygienePro', 'Hygiène',
          req: true,
          options: ['Désinfecté et prêt à l’emploi', 'À nettoyer', 'Housse ou revêtement à changer'],
          h: 'Un fauteuil ou une table dont le revêtement est fendu ne se désinfecte plus correctement. Le dire, ou le changer.'),
      const Champ('quantiteSalon', 'Quantité', options: ['À l’unité', '2 à 3 postes', '4 à 6 postes', 'Salon complet']),
      ..._communsPro,
    ],
  ),
  'Médical & Paramédical': Schema(
    couleurs: false,
    sansCouleur: 'Photographiez la plaque, le numéro de série et les accessoires fournis.',
    etat: true,
    livraison: false,
    titre: (s) => [_t(s, 'typeMed'), _t(s, 'marquePro')].where((x) => x.isNotEmpty).join(' · '),
    champs: [
      const Champ('typeMed', 'Type de matériel',
          req: true,
          options: ['Fauteuil roulant', 'Béquilles / déambulateur', 'Lit médicalisé', 'Tensiomètre', 'Glucomètre', 'Oxymètre', 'Nébuliseur', 'Concentrateur d’oxygène', 'Table d’examen', 'Autoclave / stérilisateur', 'Négatoscope', 'Échographe', 'Appareil dentaire', 'Matériel de laboratoire', 'Balance médicale', 'Matelas anti-escarres', 'Attelle / orthèse']),
      Champ('cadreMed', 'Cadre de la vente',
          req: true,
          options: const ['Matériel de confort ou d’aide à la mobilité', 'Appareil de mesure grand public', 'Dispositif médical réservé aux professionnels de santé'],
          alerte: const Alerte(
            bon: 'Matériel de confort ou d’aide à la mobilité',
            ok: ['Appareil de mesure grand public'],
            texteBon: 'Fauteuil, béquilles, lit : ce matériel se revend librement. Vérifiez l’état des sangles, des freins et des roues.',
            texteMauvais: 'Un dispositif médical réservé aux professionnels ne peut pas être revendu entre particuliers sur Chap.ci.',
            textes: {'Appareil de mesure grand public': 'Tensiomètre, glucomètre, oxymètre : vente libre. Vérifiez que l’appareil a été étalonné et que les accessoires suivent.'},
          ),
          bloque: const ['Dispositif médical réservé aux professionnels de santé'],
          motifBloc: 'La revente d’un dispositif médical réservé aux professionnels de santé est encadrée : elle ne peut pas se faire entre particuliers sur Chap.ci.',
          h: (s) => RegExp('réservé aux professionnels').hasMatch(_t(s, 'cadreMed'))
              ? '!Échographe, autoclave, matériel dentaire ou de laboratoire : leur revente passe par un distributeur agréé, pas par une petite annonce. Cette annonce ne sera pas publiée.'
              : 'Le confort et l’aide à la mobilité se revendent librement. Les dispositifs de diagnostic ou de soin réservés aux soignants, non.'),
      const Champ('marquePro', 'Marque'),
      const Champ('hygieneMed', 'Hygiène',
          req: true,
          options: ['Désinfecté', 'À désinfecter avant usage', 'Housse à changer'],
          h: 'Un matériel médical d’occasion se désinfecte toujours avant réemploi, même s’il paraît propre.'),
      const Champ('accessoiresMed', 'Fourni avec',
          multi: true, options: ['Notice', 'Chargeur', 'Brassard', 'Sondes / accessoires', 'Housse', 'Facture', 'Certificat d’étalonnage']),
      ..._communsPro,
    ],
  ),
};
