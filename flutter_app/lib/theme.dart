import 'package:flutter/material.dart';

/// Les couleurs de marque Chap.ci — reprises à l'identique de `tailwind.config.js`
/// du site, pour que l'application et le site se ressemblent trait pour trait.
///
/// Orange « chap-chap », vert « .ci », encre, et le fond crème chaud.
class ChapColors {
  static const orange = Color(0xFFF77F00); // primary-500, la couleur principale
  static const orangeLight = Color(0xFFFFA243); // primary-300
  static const orangeDark = Color(0xFFD95F00); // primary-700
  static const green = Color(0xFF009E60); // ivoire-green
  static const greenDark = Color(0xFF00784A);
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
      seedColor: ChapColors.orange,
      primary: ChapColors.orange,
      secondary: ChapColors.green,
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
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: ChapColors.orange,
        foregroundColor: Colors.white,
        // Cible tactile ≥ 48 px : un pouce ne doit jamais rater un bouton.
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
      ),
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
