import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Erreur d'API portant un message DÉJÀ EN FRANÇAIS, prêt à montrer à l'écran.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);
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

  // Même garde que le site : au-delà de 15 s on abandonne, pour ne jamais
  // laisser un écran tourner indéfiniment sur un réseau ivoirien instable.
  static const Duration _timeout = Duration(seconds: 15);

  String? _token;
  String? _monId; // l'id du compte courant, mis en cache (voir monId())

  /// À appeler une fois au démarrage : recharge le jeton stocké.
  Future<void> chargerSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
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
    // Le serveur renvoie souvent { error: "message en français" }.
    final msg = (corps is Map && corps['error'] is String)
        ? corps['error'] as String
        : 'Une erreur est survenue (code ${r.statusCode}).';
    throw ApiException(msg, r.statusCode);
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

  Future<dynamic> post(String chemin, Map<String, dynamic> corps) async {
    try {
      final r = await http
          .post(_uri(chemin),
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
