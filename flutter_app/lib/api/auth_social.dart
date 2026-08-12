import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart' show PlatformException;
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'api_client.dart';

/// Connexion via un fournisseur externe (Google, Facebook).
///
/// Branchée sur les routes EXISTANTES du serveur — les mêmes que le site :
///   · Google  : sélecteur natif → ID token → POST /auth/google.
///   · Facebook : flux WEB (sans SDK lourd, pour un réseau instable). Le
///     téléphone ouvre la page Facebook dans le navigateur du système ; après
///     accord, Facebook renvoie un `code` à la route serveur
///     `GET /auth/facebook/mobile`, qui l'échange (le SECRET reste au serveur)
///     et renvoie l'app par le schéma privé `chapci://facebook-auth?token=…`.
///
/// Les identifiants ci-dessous sont PUBLICS (client OAuth, App ID) : ils sont,
/// par nature, embarqués dans chaque application. Aucun secret ici.
class AuthSocial {
  AuthSocial._();
  static final AuthSocial instance = AuthSocial._();

  static const bool googleDisponible = true;
  static const bool facebookDisponible = true;

  // ----- Google -----
  static const String _webClientId =
      '564942885290-f1v7caemq0838kp6qickrsirk46vk4dl.apps.googleusercontent.com';
  static const String _iosClientId =
      '564942885290-l33tp6lok4ge79lmdjh6mu9a1q5aeu29.apps.googleusercontent.com';

  // ----- Facebook (flux web) -----
  static const String _fbAppId = '1617587653705134';
  static const String _fbRedirect = 'https://chap.ci/api/auth/facebook/mobile';
  static const String _schemeApp = 'chapci';

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
    final d =
        await ApiClient.instance.post('/auth/google', {'credential': idToken});
    await ApiClient.instance.appliquerReponseJeton(d);
    return true;
  }

  /// Connexion Facebook par le navigateur système : on ouvre la boîte de
  /// dialogue OAuth, le serveur fait l'échange et nous renvoie un jeton Chap.ci
  /// prêt à l'emploi via `chapci://…`. Renvoie `false` si l'utilisateur annule.
  Future<bool> connecterFacebook() async {
    final url = 'https://www.facebook.com/v18.0/dialog/oauth'
        '?client_id=$_fbAppId'
        '&redirect_uri=${Uri.encodeQueryComponent(_fbRedirect)}'
        '&response_type=code'
        '&scope=${Uri.encodeQueryComponent('email,public_profile')}';
    String resultat;
    try {
      resultat = await FlutterWebAuth2.authenticate(
        url: url,
        callbackUrlScheme: _schemeApp,
      );
    } on PlatformException catch (e) {
      // L'utilisateur a fermé la fenêtre : ce n'est pas une erreur.
      if (e.code.toUpperCase().contains('CANCEL')) return false;
      rethrow;
    }
    final params = Uri.parse(resultat).queryParameters;
    final token = params['token'];
    if (token != null && token.isNotEmpty) {
      await ApiClient.instance.definirJeton(token);
      return true;
    }
    final erreur = params['error'];
    if (erreur != null && erreur.isNotEmpty) throw ApiException(erreur);
    return false;
  }
}
