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

  static const String baseUrl = 'https://chap.ci/api';
  static const String _tokenKey = 'chapci.php.token';

  // Même garde que le site : au-delà de 15 s on abandonne, pour ne jamais
  // laisser un écran tourner indéfiniment sur un réseau ivoirien instable.
  static const Duration _timeout = Duration(seconds: 15);

  String? _token;

  /// À appeler une fois au démarrage : recharge le jeton stocké.
  Future<void> chargerSession() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  bool get connecte => _token != null && _token!.isNotEmpty;

  Future<void> _enregistrerJeton(String? token) async {
    _token = token;
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

  // --- Authentification -------------------------------------------------------

  /// Connexion. Renvoie true si connecté ; lève ApiException si refusé.
  /// Le cas 2FA (mfa_required) n'est pas encore géré par cet écran de départ.
  Future<void> seConnecter(String email, String motDePasse) async {
    final d = await post('/auth/login', {
      'email': email.trim().toLowerCase(),
      'password': motDePasse,
    });
    if (d is Map && d['mfa_required'] == true) {
      throw ApiException(
          'Ce compte a la double authentification. Sa gestion arrive bientôt dans l’app.');
    }
    final token = (d is Map) ? d['token'] as String? : null;
    if (token == null || token.isEmpty) {
      throw ApiException('Connexion refusée.');
    }
    await _enregistrerJeton(token);
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
