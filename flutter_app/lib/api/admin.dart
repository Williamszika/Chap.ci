import 'dart:convert';
import 'api_client.dart';
import 'models.dart';

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

/// La carte « Sécurité » de l'aperçu — réservée au propriétaire (`null` sinon).
class SecuriteApercu {
  /// Connexions échouées sur 7 jours (login_fail + admin_unlock_fail + mfa_fail).
  final int connexionsEchouees;

  /// La table des administrateurs est-elle intacte ? `null` = référence absente.
  final bool? adminsIntacts;

  /// Le compte propriétaire a-t-il la double authentification ?
  final bool proprietaire2fa;

  /// Alertes sur 7 jours (admins_tampered + cron_fail).
  final int alertes;

  const SecuriteApercu(
      this.connexionsEchouees, this.adminsIntacts, this.proprietaire2fa, this.alertes);

  factory SecuriteApercu.depuis(Map m) => SecuriteApercu(
        _i(m['failedLogins']),
        m['adminsIntegrity'] is bool ? m['adminsIntegrity'] as bool : null,
        m['owner2fa'] == true,
        _i(m['alerts']),
      );
}

/// L'aperçu du tableau de bord (`GET /admin/stats`).
class StatsAdmin {
  final int users, listings, conversations, messages, orders, reviews, newsletter;
  final int reportsOpen, ordersValue;
  final int visJour, visSemaine, visParJour;
  final Marche j7, j30, tout;
  final List<PointJour> serie;

  /// La carte sécurité (propriétaire seulement), sinon `null`.
  final SecuriteApercu? securite;

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
    this.securite,
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
      securite: d['security'] is Map
          ? SecuriteApercu.depuis(d['security'] as Map)
          : null,
    );
  }
}

int _i(dynamic v) => (v is num) ? v.toInt() : (int.tryParse('$v') ?? 0);

/// Un signalement d'annonce (`GET /admin/reports`).
class Signalement {
  final String id, listingId, listingTitle, reason, status;
  final String? details, reporterEmail;
  final bool listingHidden;
  final int cree;

  const Signalement({
    required this.id,
    required this.listingId,
    required this.listingTitle,
    required this.reason,
    required this.status,
    required this.details,
    required this.reporterEmail,
    required this.listingHidden,
    required this.cree,
  });

  bool get ouvert => status == 'open';

  factory Signalement.depuis(Map r) => Signalement(
        id: (r['id'] ?? '').toString(),
        listingId: (r['listingId'] ?? '').toString(),
        listingTitle: (r['listingTitle'] ?? '').toString(),
        reason: (r['reason'] ?? '').toString(),
        status: (r['status'] ?? 'open').toString(),
        details: r['details'] as String?,
        reporterEmail: r['reporterEmail'] as String?,
        listingHidden: r['listingHidden'] == true,
        cree: _i(r['createdAt']),
      );
}

/// Un compte, vu du tableau de bord (`GET /admin/users`).
class Utilisateur {
  final String id, email, nom, statut;
  final String? telephone, commune;
  final int annonces, cree, derniereActivite;
  final bool enLigne;

  const Utilisateur({
    required this.id,
    required this.email,
    required this.nom,
    required this.statut,
    required this.telephone,
    required this.commune,
    required this.annonces,
    required this.cree,
    required this.derniereActivite,
    required this.enLigne,
  });

  bool get bloque => statut == 'blocked';
  bool get restreint => statut == 'restricted';

  factory Utilisateur.depuis(Map r) => Utilisateur(
        id: (r['id'] ?? '').toString(),
        email: (r['email'] ?? '').toString(),
        nom: (r['fullName'] ?? '—').toString(),
        statut: (r['status'] ?? 'active').toString(),
        telephone: r['phone'] as String?,
        commune: r['commune'] as String?,
        annonces: _i(r['listings']),
        cree: _i(r['createdAt']),
        derniereActivite: _i(r['derniereActivite']),
        enLigne: r['enLigne'] == true,
      );
}

/// Une annonce vue de l'admin : l'annonce complète + l'e-mail du vendeur
/// (`GET /admin/listings`).
class AnnonceAdmin {
  final Listing annonce;
  final String? vendeurEmail;
  const AnnonceAdmin(this.annonce, this.vendeurEmail);

  factory AnnonceAdmin.depuis(Map<String, dynamic> j) =>
      AnnonceAdmin(Listing.fromJson(j), j['sellerEmail'] as String?);
}

/// Une sauvegarde automatique présente sur le serveur (`GET /admin/backups`).
class Sauvegarde {
  final String fichier;
  final int octets;
  final int quand; // epoch ms
  const Sauvegarde(this.fichier, this.octets, this.quand);

  factory Sauvegarde.depuis(Map m) => Sauvegarde(
        (m['file'] ?? '').toString(),
        _i(m['bytes']),
        _i(m['at']),
      );
}

/// Le résultat d'un export : le nom de fichier proposé et son contenu (octets).
class Export {
  final String nom;
  final List<int> octets;
  const Export(this.nom, this.octets);
}

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

  /// La file des signalements (ouverts d'abord).
  static Future<List<Signalement>> signalements() async {
    final d = await ApiClient.instance.get('/admin/reports');
    if (d is List) {
      return d.whereType<Map>().map(Signalement.depuis).toList();
    }
    return const [];
  }

  /// Traite un signalement ET agit sur l'annonce dans le même geste :
  /// `classer` (rien à reprocher), `masquer` (le vendeur peut corriger),
  /// `supprimer` (définitif). Le motif par défaut reprend la raison.
  static Future<void> traiterSignalement(String id, String action,
      {String? motif}) async {
    await ApiClient.instance.post('/admin/reports/$id', {
      'action': action,
      if (motif != null && motif.trim().isNotEmpty) 'motif': motif.trim(),
    });
  }

  /// La liste des comptes (les plus récents d'abord).
  static Future<List<Utilisateur>> utilisateurs() async {
    final d = await ApiClient.instance.get('/admin/users');
    if (d is List) {
      return d.whereType<Map>().map(Utilisateur.depuis).toList();
    }
    return const [];
  }

  /// Change le statut d'un compte : `active`, `restricted` ou `blocked`.
  static Future<void> changerStatut(String id, String statut) async {
    await ApiClient.instance.post('/admin/users/$id/status', {'status': statut});
  }

  /// Toutes les annonces (les plus récentes d'abord), signalées ou non.
  static Future<List<AnnonceAdmin>> annonces() async {
    final d = await ApiClient.instance.get('/admin/listings');
    if (d is List) {
      return d
          .whereType<Map>()
          .map((m) => AnnonceAdmin.depuis(m.cast<String, dynamic>()))
          .toList();
    }
    return const [];
  }

  /// Masque (motif obligatoire, il part au vendeur) ou démasque une annonce.
  static Future<void> changerVisibilite(String id, bool masquer,
      {String? motif}) async {
    await ApiClient.instance.post('/admin/listings/$id/visibility', {
      'hidden': masquer,
      if (motif != null && motif.trim().isNotEmpty) 'motif': motif.trim(),
    });
  }

  /// Retire définitivement une annonce (le motif, s'il est donné, part au vendeur).
  static Future<void> supprimerAnnonce(String id, {String? motif}) async {
    await ApiClient.instance.delete(
        '/admin/listings/$id',
        (motif != null && motif.trim().isNotEmpty) ? {'motif': motif.trim()} : null);
  }

  /// La liste des sauvegardes automatiques présentes sur le serveur.
  static Future<List<Sauvegarde>> sauvegardes() async {
    final d = await ApiClient.instance.get('/admin/backups');
    final liste = (d is Map && d['backups'] is List) ? d['backups'] as List : const [];
    return liste.whereType<Map>().map(Sauvegarde.depuis).toList();
  }

  /// Génère un export complet de la base, prêt à partager / enregistrer.
  ///
  /// Le serveur renvoie tout le contenu ; on le ré-encode en JSON (l'ordre et
  /// les données sont préservés). L'horodatage du nom est passé en argument
  /// (`Date.now()` n'existe pas dans les scripts déterministes ; ici on est
  /// dans l'app, donc on peut horodater à l'appel).
  static Future<Export> exporter(String horodatage) async {
    final d = await ApiClient.instance.get('/admin/backup');
    final octets = utf8.encode(const JsonEncoder.withIndent('  ').convert(d));
    return Export('chapci-$horodatage.json', octets);
  }
}
