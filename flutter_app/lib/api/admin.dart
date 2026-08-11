import 'api_client.dart';

/// Le résultat du contrôle d'accès : est-on admin, propriétaire ?
class AccesAdmin {
  final bool admin;
  final bool proprietaire;
  const AccesAdmin(this.admin, this.proprietaire);
}

/// Une marche du parcours (arrivés → inscrits → ont publié → ont vendu).
class Marche {
  final int visiteurs, comptes, publie, vendu;
  const Marche(this.visiteurs, this.comptes, this.publie, this.vendu);
  factory Marche.depuis(Map m) => Marche(
        _i(m['visiteurs']), _i(m['comptes']), _i(m['publie']), _i(m['vendu']));
}

/// Un point de la série journalière (14 derniers jours).
class PointJour {
  final String date;
  final int comptes, annonces;
  const PointJour(this.date, this.comptes, this.annonces);
}

/// L'aperçu du tableau de bord (`GET /admin/stats`).
class StatsAdmin {
  final int users, listings, conversations, messages, orders, reviews, newsletter;
  final int reportsOpen, ordersValue;
  final int visJour, visSemaine, visParJour;
  final Marche j7, j30, tout;
  final List<PointJour> serie;

  const StatsAdmin({
    required this.users,
    required this.listings,
    required this.conversations,
    required this.messages,
    required this.orders,
    required this.reviews,
    required this.newsletter,
    required this.reportsOpen,
    required this.ordersValue,
    required this.visJour,
    required this.visSemaine,
    required this.visParJour,
    required this.j7,
    required this.j30,
    required this.tout,
    required this.serie,
  });

  factory StatsAdmin.depuis(Map d) {
    final vis = (d['visites'] is Map) ? d['visites'] as Map : const {};
    final parc = (d['parcours'] is Map) ? d['parcours'] as Map : const {};
    Marche marche(String k) =>
        Marche.depuis(parc[k] is Map ? parc[k] as Map : const {});
    final serie = <PointJour>[];
    if (d['series'] is List) {
      for (final e in d['series'] as List) {
        if (e is Map) {
          serie.add(PointJour(
              (e['date'] ?? '').toString(), _i(e['users']), _i(e['listings'])));
        }
      }
    }
    return StatsAdmin(
      users: _i(d['users']),
      listings: _i(d['listings']),
      conversations: _i(d['conversations']),
      messages: _i(d['messages']),
      orders: _i(d['orders']),
      reviews: _i(d['reviews']),
      newsletter: _i(d['newsletter']),
      reportsOpen: _i(d['reportsOpen']),
      ordersValue: _i(d['ordersValue']),
      visJour: _i(vis['jour']),
      visSemaine: _i(vis['semaine']),
      visParJour: _i(vis['parJour']),
      j7: marche('j7'),
      j30: marche('j30'),
      tout: marche('tout'),
      serie: serie,
    );
  }
}

int _i(dynamic v) => (v is num) ? v.toInt() : (int.tryParse('$v') ?? 0);

/// Le tableau de bord (réservé au Patron). Trois verrous côté serveur : être
/// admin, avoir déverrouillé avec le code d'accès, puis les permissions fines.
class AdminApi {
  /// L'utilisateur connecté est-il admin ? (léger, sans erreur 403).
  static Future<AccesAdmin> verifier() async {
    try {
      final d = await ApiClient.instance.get('/admin/check');
      if (d is Map) {
        return AccesAdmin(d['admin'] == true, d['owner'] == true);
      }
    } catch (_) {/* non connecté / réseau : pas admin */}
    return const AccesAdmin(false, false);
  }

  /// Le tableau de bord est-il déverrouillé (code d'accès valide) ?
  static Future<bool> estDeverrouille() async {
    try {
      final d = await ApiClient.instance.get('/admin/unlock/status');
      return d is Map && d['unlocked'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Déverrouille avec le code d'accès. Garde le jeton renvoyé pour les appels
  /// suivants (en-tête `X-Admin-Unlock`).
  static Future<void> deverrouiller(String code) async {
    final d = await ApiClient.instance.post('/admin/unlock', {'code': code.trim()});
    final token = (d is Map) ? d['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException('Déverrouillage refusé.');
    }
    await ApiClient.instance.definirDeverrouillageAdmin(token);
  }

  /// (Propriétaire) demande l'envoi du code d'accès à usage unique par e-mail.
  static Future<String> demanderCodeParEmail() async {
    try {
      final d = await ApiClient.instance.post('/admin/unlock/email', {});
      if (d is Map && d['ok'] == true) {
        return 'Un code à usage unique vous a été envoyé par e-mail (il expire vite).';
      }
      if (d is Map && d['message'] is String) return d['message'] as String;
    } on ApiException catch (e) {
      return e.message;
    }
    return 'Demande envoyée.';
  }

  /// Les statistiques d'ensemble. Lève [ApiException] (code 423) si verrouillé.
  static Future<StatsAdmin> stats() async {
    final d = await ApiClient.instance.get('/admin/stats');
    if (d is! Map) throw ApiException('Réponse inattendue du serveur.');
    return StatsAdmin.depuis(d);
  }

  /// Oublie le déverrouillage (revenir à l'écran verrouillé).
  static Future<void> reverrouiller() =>
      ApiClient.instance.definirDeverrouillageAdmin(null);
}
