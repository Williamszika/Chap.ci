import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Une langue proposée dans l'application.
///
/// [code] est le code ISO (`fr`, `en`, …) utilisé par Flutter pour la locale ;
/// [nom] est le nom de la langue DANS cette langue (un hispanophone cherche
/// « Español », pas « Espagnol ») ; [drapeau] est un emoji, purement décoratif.
class Langue {
  final String code;
  final String nom;
  final String drapeau;
  const Langue(this.code, this.nom, this.drapeau);
}

/// Les langues disponibles. Le français reste la référence et le repli : toute
/// traduction manquante y retombe (voir `tr`).
const List<Langue> languesDisponibles = [
  Langue('fr', 'Français', '🇫🇷'),
  Langue('en', 'English', '🇬🇧'),
  Langue('es', 'Español', '🇪🇸'),
  Langue('pt', 'Português', '🇵🇹'),
  Langue('ar', 'العربية', '🇸🇦'),
  Langue('zh', '中文', '🇨🇳'),
];

/// Contrôleur global de la langue de l'application.
///
/// Il retient le choix (mémorisé sur l'appareil) et prévient l'app quand il
/// change : `main` reconstruit alors `MaterialApp` avec la nouvelle locale, ce
/// qui redessine tout l'arbre — chaque `tr(...)` relit la langue courante, et
/// l'arabe bascule automatiquement en mise en page droite-à-gauche.
class LangueController extends ChangeNotifier {
  LangueController._();
  static final LangueController instance = LangueController._();
  static const _cle = 'chapci.langue';

  Locale _locale = const Locale('fr');
  Locale get locale => _locale;
  String get code => _locale.languageCode;

  /// À appeler une fois au démarrage, avant d'afficher l'app.
  Future<void> charger() async {
    try {
      final p = await SharedPreferences.getInstance();
      final code = p.getString(_cle);
      if (code != null && languesDisponibles.any((l) => l.code == code)) {
        _locale = Locale(code);
      }
    } catch (_) {/* pas de préférence lisible : on garde le français */}
  }

  /// Change la langue (et la mémorise). Ne fait rien si c'est déjà la langue
  /// courante.
  Future<void> definir(String code) async {
    if (_locale.languageCode == code) return;
    if (!languesDisponibles.any((l) => l.code == code)) return;
    _locale = Locale(code);
    notifyListeners();
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_cle, code);
    } catch (_) {/* on garde au moins le choix en mémoire pour cette session */}
  }

  /// Le nom natif de la langue courante (« Français », « English »…).
  String get nomCourant =>
      languesDisponibles.firstWhere((l) => l.code == code,
              orElse: () => languesDisponibles.first)
          .nom;
}
