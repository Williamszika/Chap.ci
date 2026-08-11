import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

/// Le push **natif** : réveiller le téléphone même quand l'application est
/// fermée — ce que la coque WebView ne pouvait pas faire. Il passe par
/// **Firebase Cloud Messaging (FCM)**.
///
/// Comme pour la connexion Google / Facebook, on câble ici la **moitié
/// serveur** — enregistrer le jeton FCM de l'appareil auprès de Chap.ci — sur
/// des routes dédiées :
///   · `POST /push/native`         { token, platform, label? }   → enregistre
///   · `POST /push/native/remove`  { token }                     → retire
///
/// L'autre moitié — **obtenir** le jeton depuis le téléphone et **écouter** les
/// messages — demande le paquet `firebase_messaging` ET une configuration
/// console (un projet Firebase + le `google-services.json`). Voir le README,
/// section « Notifications push natives (FCM) ».
///
/// Tant que ce n'est pas fait, [disponible] reste faux : [demarrer] ne fait
/// rien, et l'application se construit et tourne normalement, **sans aucune
/// dépendance Firebase** (le paquet n'est volontairement pas dans `pubspec`).
class PushNatif {
  PushNatif._();
  static final PushNatif instance = PushNatif._();

  /// Passe à `true` une fois `firebase_messaging` ajouté et la console
  /// configurée (voir README). Avant cela, tout est neutre.
  static const bool disponible = false;

  static const _cleJeton = 'chapci.push.jeton_fcm';

  /// À appeler au démarrage, puis après chaque connexion. Ne fait rien tant que
  /// le push natif n'est pas activé.
  ///
  /// Une fois `firebase_messaging` en place, c'est ici (ou dans un petit fichier
  /// `push_natif_firebase.dart` que le README fournit clé en main) qu'on :
  ///   1. initialise Firebase et demande l'autorisation ;
  ///   2. récupère le jeton et appelle [enregistrer] ;
  ///   3. réenregistre le jeton à chaque `onTokenRefresh` ;
  ///   4. rafraîchit la cloche à la réception d'un message (`onMessage`).
  Future<void> demarrer() async {
    if (!disponible) return;
    // (activé) — voir le README : le corps Firebase se colle ici.
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

  /// Retire le jeton du serveur (déconnexion, ou refus des notifications).
  Future<void> retirer([String? jeton]) async {
    final prefs = await SharedPreferences.getInstance();
    final j = jeton ?? prefs.getString(_cleJeton);
    if (j == null || j.isEmpty) return;
    try {
      await ApiClient.instance.post('/push/native/remove', {'token': j});
    } catch (_) {/* silencieux */}
    await prefs.remove(_cleJeton);
  }
}
