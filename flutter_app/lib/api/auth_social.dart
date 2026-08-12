import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'api_client.dart';

/// Connexion via un fournisseur externe (Google, Facebook).
///
/// Branchée sur les routes EXISTANTES du serveur — exactement celles du site :
///   · POST /auth/google    { credential: <ID token Google> }   → { token, user }
///   · POST /auth/facebook   { accessToken: <token Facebook> }   → { token, user }
///
/// Les identifiants ci-dessous sont des **identifiants publics** (client OAuth),
/// pas des secrets : ils sont, par nature, embarqués dans chaque application.
/// Ils correspondent aux clients créés dans la console Google Cloud du projet
/// 564942885290, enregistrés avec le package `ci.chap.app` et le SHA-1 de
/// l'application.
class AuthSocial {
  AuthSocial._();
  static final AuthSocial instance = AuthSocial._();

  /// Google et Facebook sont câblés. Pour Facebook, la config native (App ID +
  /// jeton client) est injectée par le script de préparation depuis `social.json`
  /// (hors dépôt) ; si elle manque, la connexion échoue proprement à l'usage.
  static const bool googleDisponible = true;
  static const bool facebookDisponible = true;

  /// Client OAuth « Web » du serveur : c'est SON audience que le jeton d'identité
  /// doit viser pour que `/auth/google` l'accepte (`serverClientId` sur Android).
  static const String _webClientId =
      '564942885290-f1v7caemq0838kp6qickrsirk46vk4dl.apps.googleusercontent.com';

  /// Client OAuth « iOS » (Bundle `ci.chap.app`), utilisé côté iPhone/iPad.
  static const String _iosClientId =
      '564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29.apps.googleusercontent.com';

  /// Ouvre le sélecteur de compte Google, récupère le jeton d'identité, puis
  /// ouvre la session côté serveur. Renvoie `false` si l'utilisateur annule.
  Future<bool> connecterGoogle() async {
    final google = GoogleSignIn(
      scopes: const ['email'],
      serverClientId: _webClientId,
      clientId: (!kIsWeb && Platform.isIOS) ? _iosClientId : null,
    );
    final compte = await google.signIn();
    if (compte == null) return false; // annulé par l'utilisateur
    final auth = await compte.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw ApiException('Google n’a pas renvoyé de jeton. Réessayez.');
    }
    await avecGoogle(idToken);
    return true;
  }

  /// Ouvre la connexion Facebook, récupère le jeton d'accès, puis ouvre la
  /// session côté serveur. Renvoie `false` si l'utilisateur annule.
  Future<bool> connecterFacebook() async {
    final res = await FacebookAuth.instance
        .login(permissions: const ['email', 'public_profile']);
    if (res.status == LoginStatus.cancelled) return false;
    final token = res.accessToken?.tokenString;
    if (res.status != LoginStatus.success || token == null || token.isEmpty) {
      final msg = res.message;
      throw ApiException((msg != null && msg.isNotEmpty)
          ? msg
          : 'Connexion Facebook impossible. Réessayez.');
    }
    await avecFacebook(token);
    return true;
  }

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
