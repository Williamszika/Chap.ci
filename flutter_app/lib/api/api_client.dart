import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Erreur d'API portant un message DÉJÀ EN FRANÇAIS, prêt à montrer à l'écran.
///
/// [donnees] porte le corps JSON de la réponse quand il y en a un. Sans lui,
/// tout ce que le serveur dit EN PLUS du message se perdait : la
/// réinitialisation de mot de passe répond `{mfa_required: true}` en 401 pour
/// réclamer le code à six chiffres, et l'écran n'avait aucun moyen de le voir —
/// il affichait « une erreur est survenue » et la personne restait bloquée.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? donnees;
  ApiException(this.message, [this.statusCode, this.donnees]);
  @override
  String toString() => message;
}

/// Client du backend PHP existant — le MÊME serveur que le site
/// (https://chap.ci/api). L'application native s'authentifie par un jeton
/// « Bearer » (l'équivalent du cookie de session du site, que l'app ne peut pas
/// porter puisqu'elle vient d'une autre origine).
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  // Surchargeable au build (`--dart-define=API_BASE=…`) pour pointer vers un
  // serveur local en développement ; en production, le vrai back de Chap.ci.
  static const String baseUrl =
      String.fromEnvironment('API_BASE', defaultValue: 'https://chap.ci/api');
  static const String _tokenKey = 'chapci.php.token';
  static const String _adminKey = 'chapci.php.admin_unlock';

  // Même garde que le site : au-delà de 15 s on abandonne, pour ne jamais
  // laisser un écran tourner indéfiniment sur un réseau ivoirien instable.
  static const Duration _timeout = Duration(seconds: 15);

  String? _token;
  String? _monId; // l'id du compte courant, mis en cache (voir monId())
  String? _adminUnlock; // jeton de déverrouillage du tableau de bord (X-Admin-Unlock)

  /// À appeler une fois au démarrage : recharge le jeton stocké.
  Future<void> chargerSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    _adminUnlock = prefs.getString(_adminKey);
  }

  /// Enregistre (ou efface) le jeton de déverrouillage du tableau de bord. Il
  /// voyage ensuite dans l'en-tête `X-Admin-Unlock` de chaque appel.
  Future<void> definirDeverrouillageAdmin(String? token) async {
    _adminUnlock = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null || token.isEmpty) {
      await prefs.remove(_adminKey);
    } else {
      await prefs.setString(_adminKey, token);
    }
  }

  bool get connecte => _token != null && _token!.isNotEmpty;

  /// Fixe le jeton directement (utilisé par l'outil de captures pour ouvrir une
  /// session sans passer par l'écran de connexion).
  Future<void> definirJeton(String token) => _enregistrerJeton(token);

  Future<void> _enregistrerJeton(String? token) async {
    _token = token;
    _monId = null; // le cache d'identité ne vaut que pour la session courante
    final prefs = await SharedPreferences.getInstance();
    if (token == null || token.isEmpty) {
      await prefs.remove(_tokenKey);
      // Déconnexion : le déverrouillage admin ne vaut plus rien.
      _adminUnlock = null;
      await prefs.remove(_adminKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }

  Map<String, String> _entetes({bool avecCorps = false}) {
    final h = <String, String>{};
    if (avecCorps) h['Content-Type'] = 'application/json';
    if (_token != null && _token!.isNotEmpty) {
      h['Authorization'] = 'Bearer $_token';
    }
    if (_adminUnlock != null && _adminUnlock!.isNotEmpty) {
      h['X-Admin-Unlock'] = _adminUnlock!;
    }
    return h;
  }

  Uri _uri(String chemin) => Uri.parse('$baseUrl$chemin');

  /// Transforme une réponse HTTP en données, ou lève une ApiException lisible.
  dynamic _traiter(http.Response r) {
    dynamic corps;
    try {
      corps = r.body.isNotEmpty ? jsonDecode(r.body) : null;
    } catch (_) {
      corps = null;
    }
    if (r.statusCode >= 200 && r.statusCode < 300) return corps;
    // Le serveur renvoie souvent { error: "message en français" } — mais pas
    // toujours : certaines réponses portent la phrase dans `message` (la
    // demande du code de double authentification, par exemple). On lit les deux
    // avant de se rabattre sur un texte générique, et on garde le corps entier
    // pour que l'écran puisse réagir aux drapeaux qu'il contient.
    final msg = (corps is Map && corps['error'] is String)
        ? corps['error'] as String
        : (corps is Map && corps['message'] is String)
            ? corps['message'] as String
            : 'Une erreur est survenue (code ${r.statusCode}).';
    throw ApiException(msg, r.statusCode,
        corps is Map<String, dynamic> ? corps : null);
  }

  Future<dynamic> get(String chemin) async {
    try {
      final r = await http
          .get(_uri(chemin), headers: _entetes())
          .timeout(_timeout);
      return _traiter(r);
    } on TimeoutException {
      throw ApiException('Connexion trop lente. Réessayez.');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Pas de connexion. Vérifiez votre réseau.');
    }
  }

  Future<dynamic> delete(String chemin, [Map<String, dynamic>? corps]) async {
    try {
      final r = await http
          .delete(_uri(chemin),
              headers: _entetes(avecCorps: corps != null),
              body: corps == null ? null : jsonEncode(corps))
          .timeout(_timeout);
      return _traiter(r);
    } on TimeoutException {
      throw ApiException('Connexion trop lente. Réessayez.');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Pas de connexion. Vérifiez votre réseau.');
    }
  }

  /// [timeout] ne se donne que pour les routes qui attendent un tiers — le
  /// moteur de vision met trois à dix secondes, parfois plus. Partout
  /// ailleurs, les 15 s de [_timeout] restent la règle.
  Future<dynamic> post(String chemin, Map<String, dynamic> corps,
      {Duration? timeout}) async {
    try {
      final r = await http
          .post(_uri(chemin),
              headers: _entetes(avecCorps: true), body: jsonEncode(corps))
          .timeout(timeout ?? _timeout);
      return _traiter(r);
    } on TimeoutException {
      throw ApiException('Connexion trop lente. Réessayez.');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Pas de connexion. Vérifiez votre réseau.');
    }
  }

  Future<dynamic> put(String chemin, Map<String, dynamic> corps) async {
    try {
      final r = await http
          .put(_uri(chemin),
              headers: _entetes(avecCorps: true), body: jsonEncode(corps))
          .timeout(_timeout);
      return _traiter(r);
    } on TimeoutException {
      throw ApiException('Connexion trop lente. Réessayez.');
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException('Pas de connexion. Vérifiez votre réseau.');
    }
  }

  // --- Authentification -------------------------------------------------------

  /// Connexion. Renvoie `null` quand la session est ouverte tout de suite ; ou
  /// un **jeton de défi 2FA** (`mfaToken`) quand le compte a la double
  /// authentification — l'appelant demande alors le code à 6 chiffres et appelle
  /// [verifier2FA]. Lève [ApiException] si refusé.
  Future<String?> seConnecter(String email, String motDePasse) async {
    final d = await post('/auth/login', {
      'email': email.trim().toLowerCase(),
      'password': motDePasse,
    });
    if (d is Map && d['mfa_required'] == true) {
      final mfa = d['mfa_token'] as String?;
      if (mfa == null || mfa.isEmpty) {
        throw ApiException('Session expirée. Reconnectez-vous.');
      }
      return mfa; // le code sera demandé à l'écran suivant
    }
    final token = (d is Map) ? d['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException('Connexion refusée.');
    }
    await _enregistrerJeton(token);
    return null;
  }

  /// Deuxième étape de la connexion 2FA : échange le jeton de défi + un code
  /// (TOTP ou code de secours) contre une session.
  Future<void> verifier2FA(String mfaToken, String code) async {
    final d = await post('/auth/2fa/verify', {
      'mfaToken': mfaToken,
      'code': code.trim(),
    });
    await appliquerReponseJeton(d);
  }

  /// La 2FA est-elle activée sur ce compte ?
  Future<bool> statut2FA() async {
    try {
      final d = await get('/auth/2fa/status');
      return d is Map && d['enabled'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Étape 1 de l'activation : génère un secret (encore inactif) et l'URI
  /// `otpauth://` à ajouter dans une application d'authentification.
  Future<({String secret, String uri})> preparer2FA() async {
    final d = await post('/auth/2fa/setup', {});
    final secret = (d is Map) ? (d['secret'] as String? ?? '') : '';
    final uri = (d is Map) ? (d['uri'] as String? ?? '') : '';
    if (secret.isEmpty) throw ApiException('Impossible de préparer la double authentification.');
    return (secret: secret, uri: uri);
  }

  /// Étape 2 : vérifie un premier code → active la 2FA et renvoie (une seule
  /// fois) les codes de secours à conserver.
  Future<List<String>> activer2FA(String code) async {
    final d = await post('/auth/2fa/activate', {'code': code.trim()});
    final codes = (d is Map && d['recoveryCodes'] is List)
        ? (d['recoveryCodes'] as List).map((e) => e.toString()).toList()
        : <String>[];
    return codes;
  }

  /// Désactive la 2FA — exige un code valide (TOTP ou code de secours).
  Future<void> desactiver2FA(String code) async {
    await post('/auth/2fa/disable', {'code': code.trim()});
  }

  /// Création de compte. Renvoie le jeton et connecte dans la foulée.
  ///
  /// Le serveur EXIGE le consentement (loi ivoirienne 2013-450 / 2013-546) et un
  /// mot de passe d'au moins 8 caractères — l'écran d'inscription le fait
  /// respecter avant d'appeler cette méthode.
  Future<void> sInscrire(String email, String motDePasse, String nom) async {
    final d = await post('/auth/signup', {
      'email': email.trim().toLowerCase(),
      'password': motDePasse,
      'full_name': nom.trim(),
      'consent': true,
    });
    final token = (d is Map) ? d['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException('Inscription refusée.');
    }
    await _enregistrerJeton(token);
  }

  Future<void> seDeconnecter() async {
    await _enregistrerJeton(null);
  }

  /// Change le mot de passe (`POST /auth/password`).
  ///
  /// Le serveur invalide les anciens jetons — ce qui déconnecte les AUTRES
  /// appareils — et en renvoie un neuf pour la session courante : on le stocke
  /// aussitôt, sinon l'application se déconnecterait elle-même au prochain appel.
  /// [actuel] n'est envoyé que s'il est fourni : un compte créé par Google ou par
  /// téléphone n'a pas de mot de passe et le serveur l'accepte sans.
  Future<void> changerMotDePasse(String? actuel, String nouveau) async {
    final d = await post('/auth/password', {
      'password': nouveau,
      if (actuel != null && actuel.isNotEmpty) 'currentPassword': actuel,
    });
    final token = (d is Map) ? d['token'] as String? : null;
    if (token != null && token.isNotEmpty) {
      await _enregistrerJeton(token);
    }
  }

  /// MOT DE PASSE OUBLIÉ, ÉTAPE 1 — demander le code (`POST /auth/reset/send`).
  ///
  /// ⚠️ Le serveur répond TOUJOURS la même chose, que l'adresse existe ou non.
  /// C'est voulu : sinon cette route deviendrait un annuaire où l'on teste mille
  /// adresses pour savoir lesquelles ont un compte. L'écran ne doit donc jamais
  /// dire « cette adresse est inconnue » — il n'en sait rien.
  Future<void> demanderCodeReinitialisation(String email) async {
    await post('/auth/reset/send', {'email': email.trim()});
  }

  /// MOT DE PASSE OUBLIÉ, ÉTAPE 2 — le code et le nouveau mot de passe
  /// (`POST /auth/reset/confirm`).
  ///
  /// Renvoie `true` si le mot de passe est changé, et `false` si le compte a la
  /// double authentification : il faut alors rappeler avec [code2fa]. Le serveur
  /// l'exige, et il a raison — sans cela, prendre la boîte mail suffirait à
  /// prendre le compte, et les six chiffres n'auraient plus servi à rien.
  ///
  /// Après un succès, toutes les sessions ouvertes du compte sont fermées : la
  /// personne se reconnecte avec son nouveau mot de passe.
  Future<bool> reinitialiserMotDePasse(
      String email, String code, String nouveau,
      {String? code2fa}) async {
    try {
      await post('/auth/reset/confirm', {
        'email': email.trim(),
        'code': code,
        'password': nouveau,
        if (code2fa != null && code2fa.isNotEmpty) 'code2fa': code2fa,
      });
      return true;
    } on ApiException catch (e) {
      if (e.donnees?['mfa_required'] == true) return false;
      rethrow;
    }
  }

  /// Supprime définitivement le compte courant (`POST /auth/delete`) puis ferme
  /// la session localement. Le serveur redemande le mot de passe si le compte
  /// en a un ; pour un compte Google/téléphone, le jeton suffit (mot de passe
  /// vide accepté).
  Future<void> supprimerCompte(String? motDePasse) async {
    await post('/auth/delete', {'password': motDePasse ?? ''});
    await _enregistrerJeton(null);
  }

  /// L'utilisateur courant (`GET /auth/me`) : `{id, email, emailVerified,
  /// badge, user_metadata:{full_name}, …}`, ou null si la session a expiré.
  Future<Map<String, dynamic>?> moi() async {
    final d = await get('/auth/me');
    if (d is Map && d['user'] is Map) {
      final u = Map<String, dynamic>.from(d['user'] as Map);
      _monId = u['id'] as String?;
      return u;
    }
    return null;
  }

  /// L'id du compte courant, mis en cache (utile pour aligner mes messages à
  /// droite). Le récupère via `moi()` au besoin.
  Future<String?> monId() async {
    if (_monId != null) return _monId;
    await moi();
    return _monId;
  }

  /// Ouvre la session à partir d'une réponse `{ token, user }` (utilisé par la
  /// connexion sociale). Lève si le jeton manque.
  Future<void> appliquerReponseJeton(dynamic reponse) async {
    final token = (reponse is Map) ? reponse['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException('Connexion refusée par le serveur.');
    }
    await _enregistrerJeton(token);
  }
}
