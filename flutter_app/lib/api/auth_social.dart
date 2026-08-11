import 'api_client.dart';

/// Connexion via un fournisseur externe (Google, Facebook).
///
/// Branchée sur les routes EXISTANTES du serveur — exactement celles du site :
///   · POST /auth/google    { credential: <ID token Google> }   → { token, user }
///   · POST /auth/facebook   { accessToken: <token Facebook> }   → { token, user }
///
/// Ici on ne fait QUE la moitié serveur (envoyer le jeton et ouvrir la session).
/// L'autre moitié — obtenir le jeton depuis le téléphone — demande les paquets
/// natifs (`google_sign_in`, `flutter_facebook_auth`) ET une configuration
/// console (voir README : client OAuth Google + app Facebook, enregistrés avec
/// le SHA-1 de l'application lu dans la Play Console — jamais dans le keystore).
///
/// Tant que cette configuration n'est pas faite, `disponible` reste faux et les
/// boutons expliquent honnêtement qu'ils sont à activer, au lieu de planter.
class AuthSocial {
  AuthSocial._();
  static final AuthSocial instance = AuthSocial._();

  /// Passe à `true` une fois les paquets natifs ajoutés et la console
  /// configurée (voir README, section « Connexion Google & Facebook »).
  static const bool disponible = false;

  /// Envoie au serveur un ID token Google déjà obtenu côté téléphone.
  Future<void> avecGoogle(String idToken) async {
    final d = await ApiClient.instance
        .post('/auth/google', {'credential': idToken});
    await ApiClient.instance.appliquerReponseJeton(d);
  }

  /// Envoie au serveur un jeton d'accès Facebook déjà obtenu côté téléphone.
  Future<void> avecFacebook(String accessToken) async {
    final d = await ApiClient.instance
        .post('/auth/facebook', {'accessToken': accessToken});
    await ApiClient.instance.appliquerReponseJeton(d);
  }
}
