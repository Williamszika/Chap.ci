import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemUiOverlayStyle;

/// Les couleurs de marque Chap.ci — reprises à l'identique de `tailwind.config.js`
/// du site, pour que l'application et le site se ressemblent trait pour trait.
///
/// ⚠️ LE 30/08/2026, LA MARQUE EST PASSÉE AU VERT IVOIRIEN. Décision du Patron.
/// Les constantes GARDENT LEUR NOM et changent de VALEUR : `ChapColors.orange`
/// vaut désormais #009E60. C'est laid à lire, et c'est assumé — renommer aurait
/// voulu dire toucher 217 appels répartis dans 42 fichiers Dart, dans un
/// environnement qui n'a ni `dart` ni `flutter` pour vérifier quoi que ce soit.
/// Une valeur qu'on change se vérifie à l'œil au premier lancement ; 217
/// renommages à l'aveugle, non.
///
/// Pour le code NEUF, utilisez les noms de rôle en bas de classe : `marque`,
/// `marqueSombre`, `action`. Ce sont eux qui disent la vérité.
///
/// L'ORANGE N'EST PAS PARTI, et il ne doit surtout pas partir : le drapeau
/// ivoirien est ORANGE, blanc, vert. Un site — ou une application — qui n'en
/// montre que deux tiers ne dit plus d'où il vient. Le Patron l'a relevé le
/// 30/08 : « je vois que les couleurs sont Vert Blanc Vert ».
///
/// La règle, identique à celle du site : le VERT porte la marque et l'interface
/// (en-tête, navigation, liens, prix, le signe) ; l'ORANGE porte TOUTES les
/// actions (publier, contacter, valider) ; le crème reste le sol.
class ChapColors {
  static const orange = Color(0xFF009E60); // ⚠️ VERT — voir l'avertissement
  static const orangeLight = Color(0xFF55CB98); // primary-300 (vert clair)
  static const orangeDark = Color(0xFF00734A); // primary-700 (vert foncé)
  static const green = Color(0xFF009E60); // ivoire-green (identique désormais)
  static const greenDark = Color(0xFF00734A);

  // ── Les noms de RÔLE, pour le code neuf ────────────────────────────────
  /// Le vert du drapeau : le signe, les aplats, les bordures.
  static const marque = Color(0xFF009E60);
  /// Le vert foncé : le texte de marque et les fonds portant du texte blanc.
  /// (#009E60 sous du blanc ne donne que 3,5:1 — sous le seuil lisible au
  /// soleil d'Abidjan. #00734A monte à 5,9:1.)
  static const marqueSombre = Color(0xFF00734A);
  /// L'orange, réservé à l'action principale d'une fiche.
  static const action = Color(0xFFD95F00);
  static const actionVif = Color(0xFFF77F00);

  /// L'ATTENTION : « non configuré », « restreint », « 2FA non activée ».
  ///
  /// ⚠️ Cette couleur manquait, et son absence a failli coûter cher. L'app
  /// n'avait pas de couleur d'avertissement : elle opposait `orange` à `green`.
  /// Le jour où `orange` est devenu vert, ces oppositions se sont refermées —
  /// un compte RESTREINT s'affichait du même vert qu'un compte ACTIF, une
  /// double authentification NON ACTIVÉE du même vert qu'une activée. Un état
  /// qui alerte ne doit jamais emprunter la couleur de la marque : le jour où
  /// la marque change, l'alerte disparaît sans que rien ne casse.
  /// #96500E donne 6,1:1 sous du blanc — lisible au soleil. (C'est la même
  /// valeur que `ocreDark`, écrite en clair : un `= ocreDark` obligerait à
  /// parier sur l'ordre de résolution des constantes, et rien ici ne compile.)
  static const attention = Color(0xFF96500E);
  static const attentionClair = Color(0xFFE9A23B);
  static const ink = Color(0xFF1B1A17); // le texte
  static const line = Color(0xFFEFE6D7); // séparateurs clairs
  static const line2 = Color(0xFFE6DAC6); // contours appuyés
  static const cream = Color(0xFFFFFDF9); // blanc chaud (cartes)
  static const cream100 = Color(0xFFFFF3E4);
  static const cream200 = Color(0xFFFFF6EA); // fond de l'application
  static const ocreDark = Color(0xFF96500E); // ocre pour le texte (contraste AA)

  // Gris de texte alignés sur la norme d'accessibilité déjà validée sur le site.
  static const gray900 = Color(0xFF111827);
  static const gray700 = Color(0xFF374151);
  static const gray600 = Color(0xFF4B5563);
  static const gray500 = Color(0xFF6B7280);
}

/// Le thème global de l'application.
ThemeData chapTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: ChapColors.marque,
      primary: ChapColors.marque,
      // La secondaire est l'ORANGE. Elle valait `green` — donc, depuis le
      // 30/08, la même couleur que la primaire : Material tirait ses accents,
      // ses `secondaryContainer` et ses états sélectionnés d'un vert identique
      // au vert de marque, et tout se confondait.
      secondary: ChapColors.action,
      surface: ChapColors.cream,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: ChapColors.cream200,
    fontFamily: 'Roboto',
  );

  return base.copyWith(
    appBarTheme: const AppBarTheme(
      backgroundColor: ChapColors.cream200,
      foregroundColor: ChapColors.ink,
      elevation: 0,
      centerTitle: false,
      // Fond crème clair → icônes de la barre d'état SOMBRES, sur les écrans
      // qui ont une AppBar. Les écrans sans AppBar (l'accueil) sont couverts par
      // le réglage global posé au démarrage (main.dart).
      systemOverlayStyle: SystemUiOverlayStyle.dark,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        // L'ACTION est orange, pas verte. C'est ici que le drapeau se joue :
        // ce seul réglage peint tous les boutons pleins de l'application.
        backgroundColor: ChapColors.action,
        foregroundColor: Colors.white,
        // Cible tactile ≥ 48 px : un pouce ne doit jamais rater un bouton.
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
      ),
    ),
    // Les IconButton (retour, favori, options…) doivent eux aussi offrir une
    // cible d'au moins 48 px : Material 3 les réduit sinon sous le pouce.
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ChapColors.cream,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: ChapColors.line2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: ChapColors.line2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: ChapColors.orange, width: 2),
      ),
    ),
  );
}
