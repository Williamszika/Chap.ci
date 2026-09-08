import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../liens_entrants.dart';
import '../navigation.dart';
import '../notifications.dart';
import 'api_client.dart';

/// Le push **natif** : réveiller le téléphone même quand l'application est
/// fermée — ce que la coque WebView ne pouvait pas faire. Il passe par
/// **Firebase Cloud Messaging (FCM)**.
///
/// ─────────────────────────────────────────────────────────────────────────
/// POURQUOI CE CHANTIER A COMPTÉ PLUS QUE LES AUTRES
///
/// Sans lui, un acheteur écrivait à un vendeur et le téléphone du vendeur
/// restait muet. Le vendeur ne l'apprenait qu'en ouvrant l'application de
/// lui-même ; l'acheteur, lui, attendait, ne recevait rien, et allait voir
/// ailleurs. C'était la première fuite de la place de marché, et elle
/// n'apparaissait dans aucune mesure de vitesse.
///
/// ─────────────────────────────────────────────────────────────────────────
/// CE QUI S'EST PASSÉ AVANT, ET QU'IL FAUT SAVOIR
///
/// Du 04/09 au 08/09/2026, [enregistrer] appelait `/push/native` — une route
/// qui N'EXISTAIT PAS côté serveur. Le `catch` silencieux ci-dessous (voulu :
/// une notification ratée ne doit jamais gêner l'application) avalait le 404,
/// et rien nulle part ne pouvait le dire. Quatre jours d'appels dans le vide.
///
/// La leçon tient en une ligne : **un silence commode se paie**. Le banc
/// `npm run banc:push-natif` frappe désormais aux mêmes adresses, avec les
/// mêmes noms de champs, pour que la route et le client ne puissent plus
/// diverger sans que quelque chose devienne rouge.
///
/// ─────────────────────────────────────────────────────────────────────────
/// CE QU'IL FAUT POUR QUE ÇA MARCHE — les trois pièces
///
///   1. `api/data/fcm.json` sur le serveur (la clé du compte de service).
///      Vérifiable d'un coup d'œil : `https://chap.ci/api/health` → `fcm`.
///   2. `flutter_app/tool/secrets/google-services.json` sur le Mac du Patron,
///      que `preparer_plateformes.dart` recopie à chaque build.
///   3. Une application RECONSTRUITE après les deux premières.
///
/// S'il en manque une, rien ne casse : Firebase refuse de s'initialiser, on
/// l'écrit dans la console de débogage, et l'application tourne comme avant.
class PushNatif {
  PushNatif._();
  static final PushNatif instance = PushNatif._();

  static const _cleJeton = 'chapci.push.jeton_fcm';

  /// Firebase a-t-il démarré ? Sert au journal et aux tests ; l'application ne
  /// s'en sert pas pour décider quoi afficher.
  bool get pret => _pret;
  bool _pret = false;

  FirebaseMessaging? _messagerie;

  /// À appeler au démarrage, puis après chaque connexion.
  ///
  /// Ne lève JAMAIS : un téléphone sans Google Play, une configuration
  /// absente, un refus d'autorisation — tout cela laisse l'application
  /// exactement dans l'état où elle était.
  Future<void> demarrer() async {
    try {
      // `Firebase.initializeApp()` lit google-services.json (Android) ou
      // GoogleService-Info.plist (iOS). Sans eux, il lève : c'est le cas
      // « l'application a été construite sans Firebase », et il est normal.
      if (Firebase.apps.isEmpty) await Firebase.initializeApp();
      final m = FirebaseMessaging.instance;
      _messagerie = m;

      // L'autorisation. Android 13+ et iOS la demandent explicitement ; en
      // dessous, elle est acquise. Un refus n'est pas une erreur — c'est un
      // choix, et on s'arrête là sans rien dire de plus.
      final perm = await m.requestPermission(alert: true, badge: true, sound: true);
      if (perm.authorizationStatus == AuthorizationStatus.denied) return;

      _pret = true;

      // Le jeton identifie l'INSTALLATION. Il change (réinstallation,
      // restauration de sauvegarde, effacement des données) : on écoute donc
      // aussi son renouvellement, sinon les notifications s'arrêteraient un
      // jour sans que personne comprenne pourquoi.
      final jeton = await m.getToken();
      if (jeton != null) await enregistrer(jeton, plateforme: _plateforme());
      m.onTokenRefresh.listen((j) => enregistrer(j, plateforme: _plateforme()));

      // Application au premier plan : le système n'affiche rien de lui-même.
      // On rafraîchit la cloche — c'est ce que la personne regarde quand elle
      // est déjà dans l'application.
      FirebaseMessaging.onMessage.listen((_) {
        try { Notifications.instance.rafraichirCompte(); } catch (_) {/* pas connecté */}
      });

      // Application en arrière-plan, puis on touche la notification.
      FirebaseMessaging.onMessageOpenedApp.listen(_ouvrir);

      // Application FERMÉE, et c'est la notification qui l'a lancée.
      final lancement = await m.getInitialMessage();
      if (lancement != null) _ouvrir(lancement);
    } catch (e) {
      // Le cas de loin le plus fréquent : l'application a été construite sans
      // google-services.json. On l'écrit — en débogage seulement — parce que
      // c'est exactement le genre de panne qu'on met trois jours à trouver
      // quand rien ne parle.
      if (kDebugMode) {
        debugPrint('[chapci] push natif inactif : $e');
      }
    }
  }

  String _plateforme() => defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';

  /// Ouvre l'écran dont la notification parle.
  ///
  /// Le serveur met l'adresse dans `data.url` — la MÊME que celle du Web Push,
  /// exprès : une notification doit ouvrir le même endroit qu'on la reçoive
  /// dans le navigateur ou dans l'application (chantier du 07/09/2026).
  ///
  /// Une annonce ou une page vendeur passent par le routeur des liens
  /// entrants, qui sait déjà les ouvrir. Tout le reste — un message, un avis,
  /// un bilan, une alerte de stock — mène à la liste des notifications :
  /// c'est de là qu'on atteint n'importe quel écran, et c'est infiniment mieux
  /// que de rester sur l'accueil sans savoir pourquoi le téléphone a sonné.
  void _ouvrir(RemoteMessage m) {
    final url = (m.data['url'] ?? '').toString();
    if (url.isEmpty) { demanderOngletRacine(3); return; }
    final u = Uri.tryParse(url.startsWith('http') ? url : 'https://chap.ci$url');
    if (u == null) { demanderOngletRacine(3); return; }
    if (u.path.contains('/annonce/') || u.path.contains('/vendeur/')) {
      LiensEntrants.instance.ouvrir(u);
      return;
    }
    demanderOngletRacine(3); // l'onglet Compte, d'où partent les notifications
  }

  /// Enregistre le jeton FCM de cet appareil auprès du serveur, et le garde en
  /// local pour pouvoir le retirer à la déconnexion.
  Future<void> enregistrer(String jeton,
      {String plateforme = 'android', String? repere}) async {
    if (jeton.isEmpty || !ApiClient.instance.connecte) return;
    try {
      await ApiClient.instance.post('/push/native', {
        'token': jeton,
        'platform': plateforme,
        if (repere != null && repere.isNotEmpty) 'label': repere,
      });
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cleJeton, jeton);
    } catch (_) {
      // Silencieux : la cloche in-app et le Web Push (navigateur) restent.
    }
  }

  /// Retire le jeton du serveur (déconnexion, ou notifications refusées).
  Future<void> retirer([String? jeton]) async {
    final prefs = await SharedPreferences.getInstance();
    final j = jeton ?? prefs.getString(_cleJeton);
    if (j == null || j.isEmpty) return;
    try {
      await ApiClient.instance.post('/push/native/remove', {'token': j});
    } catch (_) {/* silencieux */}
    await prefs.remove(_cleJeton);
    try { await _messagerie?.deleteToken(); } catch (_) {/* déjà parti */}
  }
}
