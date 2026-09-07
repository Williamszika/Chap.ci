import 'package:flutter/foundation.dart';
import 'api/api_client.dart';

/// Une notification, telle que le serveur la renvoie (mêmes clés que le site :
/// `PhpNotification`). `createdAt` est un temps epoch en millisecondes.
class NotifItem {
  final String id;
  final String type;
  final String titre;
  final String corps;
  final String lien;
  final bool lue;
  final int cree;

  const NotifItem({
    required this.id,
    required this.type,
    required this.titre,
    required this.corps,
    required this.lien,
    required this.lue,
    required this.cree,
  });

  factory NotifItem.depuisJson(Map<String, dynamic> j) => NotifItem(
        id: (j['id'] ?? '').toString(),
        type: (j['type'] ?? '').toString(),
        titre: (j['title'] ?? '').toString(),
        corps: (j['body'] ?? '').toString(),
        lien: (j['link'] ?? '').toString(),
        lue: j['read'] == true,
        cree: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      );

  /// L'identifiant d'annonce contenu dans le lien, s'il y en a un — pour ouvrir
  /// la fiche depuis la notification. Les liens du serveur sont des routes à
  /// dièse : « #/annonce/<id> », « #/modifier/<id> ». Les autres (« /#/publier »,
  /// « /#/compte », « /#/notifications ») ne mènent à aucune annonce.
  String? get annonceId {
    final m = RegExp(r'(?:annonce|modifier|listing|listings)[/=]([A-Za-z0-9_-]+)')
        .firstMatch(lien);
    return m?.group(1);
  }

  /// L'identifiant d'offre d'emploi (« #/emploi/<id> », 06/09/2026) — une
  /// structure que je suis a publié un poste, ou quelqu'un a répondu au mien.
  String? get offreId =>
      RegExp(r'emploi/([A-Za-z0-9_-]+)').firstMatch(lien)?.group(1);

  // CHAQUE NOTIFICATION MÈNE À CE DONT ELLE PARLE (07/09/2026, le Patron).
  // Le serveur écrit des liens du site ; l'application les lit pour ouvrir
  // l'écran natif correspondant. Un lien inconnu n'ouvre rien de faux.

  /// « #/messages/<id> » : un message, un acheteur qui attend une réponse.
  String? get conversationId =>
      RegExp(r'messages/([A-Za-z0-9_-]+)').firstMatch(lien)?.group(1);

  /// « #/modifier/<id> » : l'annonce est à corriger (retirée, qui s'essouffle).
  bool get versModification => lien.contains('/modifier/');

  /// « #/vendeur/<id> » : un avis reçu — la page publique du compte.
  String? get vendeurId =>
      RegExp(r'vendeur/([A-Za-z0-9_-]+)').firstMatch(lien)?.group(1);

  /// « #/compte?onglet=x » : l'écran du compte dont on parle — stock, achats,
  /// ventes, annonces, stats, fiche… Null si le lien ne le dit pas.
  String? get ongletCompte =>
      RegExp(r'compte\?onglet=([a-z]+)').firstMatch(lien)?.group(1);

  /// « #/assistance… » : le fil avec l'équipe Chap.ci.
  bool get versAssistance => lien.contains('/assistance');
}

/// La cloche de notifications — l'équivalent mobile de celle du site.
///
/// Un ChangeNotifier : le badge du compteur se met à jour partout dès qu'on
/// charge, marque lu, ou efface. Tout est best-effort : jamais d'écran bloqué
/// sur un réseau instable, et rien du tout quand on n'est pas connecté.
class Notifications extends ChangeNotifier {
  Notifications._();
  static final Notifications instance = Notifications._();

  int _nonLues = 0;
  List<NotifItem> _liste = const [];
  bool _chargement = false;

  int get nonLues => _nonLues;
  List<NotifItem> get liste => _liste;
  bool get enChargement => _chargement;

  /// Le compteur seul (léger) — pour le badge, sans tirer toute la liste.
  Future<void> rafraichirCompte() async {
    if (!ApiClient.instance.connecte) {
      _majCompte(0);
      return;
    }
    try {
      final d = await ApiClient.instance.get('/notifications/count');
      final n = (d is Map && d['count'] is num) ? (d['count'] as num).toInt() : 0;
      _majCompte(n);
    } catch (_) {/* silencieux : on garde l'ancien compteur */}
  }

  /// La liste complète (pour l'écran de la cloche).
  Future<void> charger() async {
    if (!ApiClient.instance.connecte) {
      _liste = const [];
      _majCompte(0);
      return;
    }
    _chargement = true;
    notifyListeners();
    try {
      final d = await ApiClient.instance.get('/notifications');
      if (d is List) {
        _liste = d
            .whereType<Map>()
            .map((e) => NotifItem.depuisJson(e.cast<String, dynamic>()))
            .toList();
        _nonLues = _liste.where((n) => !n.lue).length;
      }
    } catch (_) {/* silencieux : la liste précédente reste affichée */}
    _chargement = false;
    notifyListeners();
  }

  /// Marque tout (ou une seule) notification comme lue. Optimiste : on met à
  /// jour l'affichage tout de suite, puis on prévient le serveur.
  Future<void> marquerLu([String? id]) async {
    _liste = _liste
        .map((n) => (id == null || n.id == id) ? n._copieLue() : n)
        .toList();
    _nonLues = _liste.where((n) => !n.lue).length;
    notifyListeners();
    try {
      await ApiClient.instance.post('/notifications/read', id == null ? {} : {'id': id});
    } catch (_) {/* silencieux */}
  }

  /// Efface une sélection (ou tout si `ids` est vide/nul).
  Future<void> effacer([List<String>? ids]) async {
    if (ids == null || ids.isEmpty) {
      _liste = const [];
    } else {
      final aEffacer = ids.toSet();
      _liste = _liste.where((n) => !aEffacer.contains(n.id)).toList();
    }
    _nonLues = _liste.where((n) => !n.lue).length;
    notifyListeners();
    try {
      await ApiClient.instance
          .delete('/notifications', (ids == null || ids.isEmpty) ? null : {'ids': ids});
    } catch (_) {/* silencieux */}
  }

  /// À la déconnexion : on vide tout (le prochain compte repart de zéro).
  void vider() {
    _liste = const [];
    _majCompte(0);
  }

  /// Amorce la liste en mémoire (sans réseau) — pour les tests et l'outil de
  /// captures. En production, c'est `charger()` qui remplit depuis le serveur.
  void amorcer(List<NotifItem> items) {
    _liste = List.of(items);
    _nonLues = _liste.where((n) => !n.lue).length;
    notifyListeners();
  }

  void _majCompte(int n) {
    if (_nonLues != n) {
      _nonLues = n;
      notifyListeners();
    }
  }
}

extension _CopieLue on NotifItem {
  NotifItem _copieLue() => NotifItem(
        id: id,
        type: type,
        titre: titre,
        corps: corps,
        lien: lien,
        lue: true,
        cree: cree,
      );
}
