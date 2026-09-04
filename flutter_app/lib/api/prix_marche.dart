// =============================================================================
//  « ÇA VAUT COMBIEN ? » — lire une fourchette de marché et en tirer un mot.
//
//  Nouveauté n° 3 du 03/09/2026, portée du site (`src/lib/prixMarche.ts`). Le
//  serveur (`GET /listings/prix-marche`) mesure la fourchette des annonces
//  récentes de la même sous-catégorie — de la même marque quand il y en a
//  assez — et ce fichier dit ce qu'on en fait, au même endroit pour le vendeur
//  qui tape son prix et pour l'acheteur qui lit la fiche.
//
//  ⚠️ CE N'EST PAS UNE COTE. C'est ce que les gens DEMANDENT sur Chap.ci, pas
//  ce qu'ils obtiennent. Le mot reste donc prudent : « dans la moyenne », pas
//  « juste prix ». Et sous cinq annonces, pas de fourchette du tout — trois
//  prix ne font pas un marché (le serveur renvoie alors des valeurs nulles).
//
//  Le seul verdict qui pèse est « bien en dessous » : à moins de 60 % du bas de
//  la fourchette, on est dans la zone du « prix trop beau », premier signal de
//  l'arnaque. On le dit à l'acheteur sans accuser le vendeur.
//
//  ⚠️ LES SEUILS (0,6 et 1,4) SONT CEUX DU SITE, À L'IDENTIQUE. Une annonce
//  jugée « dans la moyenne » sur le site et « au-dessus » dans l'application
//  ferait passer Chap.ci pour un site qui ne sait pas ce qu'il dit.
// =============================================================================
import 'api_client.dart';

/// La fourchette d'une sous-catégorie, telle que le serveur la renvoie.
/// [p25] et [p75] sont nuls sous cinq annonces : pas de fourchette.
class PrixMarche {
  final int n;
  final int jours;

  /// 'sous-catégorie' ou 'marque' — sur quoi la fourchette a été mesurée.
  final String base;
  final num? minimum;
  final num? mediane;
  final num? p25;
  final num? p75;

  const PrixMarche({
    required this.n,
    required this.jours,
    required this.base,
    this.minimum,
    this.mediane,
    this.p25,
    this.p75,
  });

  /// A-t-on de quoi dire quelque chose ?
  bool get utile => p25 != null && p75 != null && n >= 5;

  factory PrixMarche.fromJson(Map<String, dynamic> j) => PrixMarche(
        n: (j['n'] is num) ? (j['n'] as num).toInt() : 0,
        jours: (j['jours'] is num) ? (j['jours'] as num).toInt() : 180,
        base: (j['base'] ?? 'sous-catégorie').toString(),
        minimum: j['minimum'] is num ? j['minimum'] as num : null,
        mediane: j['mediane'] is num ? j['mediane'] as num : null,
        p25: j['p25'] is num ? j['p25'] as num : null,
        p75: j['p75'] is num ? j['p75'] as num : null,
      );

  /// Interroge le serveur. `null` en cas d'échec — la fourchette est une aide,
  /// jamais un blocage : sans elle, l'écran reste celui d'avant.
  static Future<PrixMarche?> charger({
    required String categoryId,
    required String subcategory,
    String? condition,
    String? marque,
    String? sauf,
  }) async {
    if (categoryId.isEmpty || subcategory.isEmpty) return null;
    final q = <String, String>{
      'categoryId': categoryId,
      'subcategory': subcategory,
      if (condition != null && condition.isNotEmpty) 'condition': condition,
      if (marque != null && marque.trim().isNotEmpty) 'marque': marque.trim(),
      if (sauf != null && sauf.isNotEmpty) 'sauf': sauf,
    };
    final chemin = Uri(path: '/listings/prix-marche', queryParameters: q)
        .toString();
    try {
      final d = await ApiClient.instance.get(chemin);
      if (d is Map<String, dynamic>) return PrixMarche.fromJson(d);
      return null;
    } catch (_) {
      return null;
    }
  }
}

/// Le mot pour un prix : bien en dessous, dans la moyenne, au-dessus.
enum VerdictPrix { bas, moyen, haut }

/// `null` si la fourchette n'existe pas (encore) ou si le prix est vide.
VerdictPrix? verdictPrix(num prix, PrixMarche? f) {
  if (f == null || !f.utile || prix <= 0) return null;
  if (prix < f.p25! * 0.6) return VerdictPrix.bas;
  if (prix > f.p75! * 1.4) return VerdictPrix.haut;
  return VerdictPrix.moyen;
}
