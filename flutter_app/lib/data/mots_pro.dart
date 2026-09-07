import 'package:flutter/widgets.dart';

import '../i18n/textes.dart';

/// Les mots de la vitrine et de la console selon le type de structure
/// (07/09/2026, le Patron : « adapte les mots par type pour les
/// associations »). Une association ne conclut pas des ventes, elle remet des
/// dons ; son numéro n'est pas un RCCM mais un récépissé ; sa page n'est pas
/// une boutique. Les métiers à agrément (école, agence de voyage, santé,
/// hôtel, banque) ont fait vérifier un agrément, pas un registre.
///
/// Mêmes règles que `src/data/secteursPro.ts` — `motsPro()` — sur le site.
/// Chaque phrase passe par `tr()` avec sa clé écrite en clair, pour que le
/// contrôle statique des clés continue de les voir.

bool estAssociation(String? type) => type == 'association';

bool aAgrement(String? type) => const {
      'formation', 'voyage', 'sante', 'hebergement', 'finance',
    }.contains(type);

bool estBoutique(String? type) =>
    type == null ||
    type.isEmpty ||
    const {'boutique', 'commerce', 'restauration', 'vehicules'}.contains(type);

/// La pastille sur la bannière : « Professionnel », « Association vérifiée ».
String motsBadge(BuildContext context, String? type) => estAssociation(type)
    ? tr(context, 'vitrine.badgeAsso')
    : tr(context, 'vitrine.badge');

/// « Professionnel depuis juin 2026 » / « Association depuis juin 2026 ».
String motsDepuis(BuildContext context, String? type, String date) =>
    (estAssociation(type)
            ? tr(context, 'vitrine.depuisAsso')
            : tr(context, 'vitrine.depuis'))
        .replaceAll('{d}', date);

/// Le libellé du quatrième chiffre, l'ancienneté.
String motsAnciennete(BuildContext context, String? type) => estAssociation(type)
    ? tr(context, 'vitrine.ancienneteAsso')
    : tr(context, 'vitrine.anciennete');

/// Le troisième chiffre : « vente(s) conclue(s) » / « don(s) remis ».
String motsCompte(BuildContext context, String? type, int n) {
  if (estAssociation(type)) {
    return n > 1 ? tr(context, 'vitrine.donN') : tr(context, 'vitrine.don1');
  }
  return n > 1 ? tr(context, 'vitrine.venteN') : tr(context, 'vitrine.vente1');
}

/// La pastille du registre.
String motsRegistre(BuildContext context, String? type) {
  if (estAssociation(type)) return tr(context, 'vitrine.recepisse');
  if (aAgrement(type)) return tr(context, 'vitrine.agrement');
  return tr(context, 'vitrine.registre');
}

/// La phrase sous la pastille du registre.
String motsRegistreNote(BuildContext context, String? type) {
  if (estAssociation(type)) return tr(context, 'vitrine.recepisseNote');
  if (aAgrement(type)) return tr(context, 'vitrine.agrementNote');
  return tr(context, 'vitrine.registreNote');
}

/// Quand la structure n'a pas écrit sa présentation.
String motsPresentationVide(BuildContext context, String? type) {
  if (estAssociation(type)) return tr(context, 'vitrine.presentationVideAsso');
  if (estBoutique(type)) return tr(context, 'vitrine.presentationVide');
  return tr(context, 'vitrine.presentationVideStructure');
}

/// Le titre de la section des tuiles de la console.
String motsSection(BuildContext context, String? type) {
  if (estAssociation(type)) return tr(context, 'pro.sec.association');
  if (estBoutique(type)) return tr(context, 'pro.sec.boutique');
  return tr(context, 'pro.sec.activite');
}

/// La fiche d'entreprise de la console : titre et légende.
String motsFicheTitre(BuildContext context, String? type) => estAssociation(type)
    ? tr(context, 'pro.fiche.titreAsso')
    : tr(context, 'pro.fiche.titre');

String motsFicheSous(BuildContext context, String? type) => estAssociation(type)
    ? tr(context, 'pro.fiche.sousAsso')
    : tr(context, 'pro.fiche.sous');

/// Sous la tuile Mes annonces : « 3 en ligne · 0 vendues » / « … 0 données ».
String motsAnnoncesSous(BuildContext context, String? type, int a, int v) =>
    (estAssociation(type)
            ? tr(context, 'pro.tuile.annoncesSousAsso')
            : tr(context, 'pro.tuile.annoncesSous'))
        .replaceAll('{a}', '$a')
        .replaceAll('{v}', '$v');
