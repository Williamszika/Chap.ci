// =============================================================================
//  Formats localisés : temps relatif (« il y a 3 h ») et distance (« à 3 km »).
//
//  `format.dart` garde ses fonctions françaises pures — les écrans
//  d'administration (réservés au Patron) s'en servent toujours. Ici, les
//  versions par langue pour les écrans grand public : elles lisent la locale
//  via le context, donc se redessinent au changement de langue comme tr().
// =============================================================================
import 'package:flutter/widgets.dart';

const String _nbsp = ' '; // espace insécable (identique à format.dart)

/// Temps écoulé depuis [timestampMs], dans la langue de l'application.
String tempsEcouleTr(BuildContext context, int timestampMs) {
  final code = Localizations.localeOf(context).languageCode;
  final maintenant = DateTime.now().millisecondsSinceEpoch;
  final secondes = ((maintenant - timestampMs) / 1000).round();
  final minutes = (secondes / 60).round();
  final heures = (minutes / 60).round();
  final jours = (heures / 24).round();
  final semaines = (jours / 7).round();
  final mois = (jours / 30).round();
  final ans = (jours / 365).round();

  switch (code) {
    case 'en':
      if (secondes < 60) return 'just now';
      if (minutes < 60) return '$minutes${_nbsp}min ago';
      if (heures < 24) return '$heures${_nbsp}h ago';
      if (jours == 1) return 'yesterday';
      if (jours < 7) return '$jours days ago';
      if (semaines < 5) return '$semaines wk ago';
      if (mois < 12) return '$mois mo ago';
      return '$ans yr ago';
    case 'es':
      if (secondes < 60) return 'ahora mismo';
      if (minutes < 60) return 'hace $minutes${_nbsp}min';
      if (heures < 24) return 'hace $heures${_nbsp}h';
      if (jours == 1) return 'ayer';
      if (jours < 7) return 'hace $jours días';
      if (semaines < 5) return 'hace $semaines sem.';
      if (mois < 12) return 'hace $mois meses';
      return 'hace $ans años';
    case 'pt':
      if (secondes < 60) return 'agora mesmo';
      if (minutes < 60) return 'há $minutes${_nbsp}min';
      if (heures < 24) return 'há $heures${_nbsp}h';
      if (jours == 1) return 'ontem';
      if (jours < 7) return 'há $jours dias';
      if (semaines < 5) return 'há $semaines sem.';
      if (mois < 12) return 'há $mois meses';
      return 'há $ans anos';
    case 'ar':
      if (secondes < 60) return 'الآن';
      if (minutes < 60) return 'قبل $minutes${_nbsp}د';
      if (heures < 24) return 'قبل $heures${_nbsp}س';
      if (jours == 1) return 'أمس';
      if (jours < 7) return 'قبل $jours أيام';
      if (semaines < 5) return 'قبل $semaines أسابيع';
      if (mois < 12) return 'قبل $mois أشهر';
      return 'قبل $ans سنوات';
    case 'zh':
      if (secondes < 60) return '刚刚';
      if (minutes < 60) return '$minutes 分钟前';
      if (heures < 24) return '$heures 小时前';
      if (jours == 1) return '昨天';
      if (jours < 7) return '$jours 天前';
      if (semaines < 5) return '$semaines 周前';
      if (mois < 12) return '$mois 个月前';
      return '$ans 年前';
    default: // fr — mêmes règles que format.dart
      if (secondes < 60) return "à l'instant";
      if (minutes < 60) return 'il y a $minutes${_nbsp}min';
      if (heures < 24) return 'il y a $heures${_nbsp}h';
      if (jours == 1) return 'hier';
      if (jours < 7) return 'il y a $jours${_nbsp}jours';
      if (semaines < 5) return 'il y a $semaines${_nbsp}sem.';
      if (mois < 12) return 'il y a $mois${_nbsp}mois';
      return 'il y a $ans${_nbsp}an(s)';
  }
}

/// Distance lisible (« à 3 km »), dans la langue de l'application.
/// Mêmes paliers que `formatDistance` (api/geo.dart).
String formatDistanceTr(BuildContext context, double km) {
  final code = Localizations.localeOf(context).languageCode;
  String brut;
  bool loin = false;
  if (km < 1) {
    final m = (km * 1000 / 50).round() * 50;
    brut = '${m < 50 ? 50 : m} m';
  } else if (km < 10) {
    final v = km.toStringAsFixed(1);
    brut = '${code == 'en' || code == 'zh' ? v : v.replaceAll('.', ',')} km';
  } else if (km < 500) {
    brut = '${km.round()} km';
  } else {
    loin = true;
    brut = '';
  }
  switch (code) {
    case 'en':
      return loin ? 'far away' : '$brut away';
    case 'es':
      return loin ? 'lejos' : 'a $brut';
    case 'pt':
      return loin ? 'longe' : 'a $brut';
    case 'ar':
      return loin ? 'بعيد' : 'على بعد $brut';
    case 'zh':
      return loin ? '较远' : '$brut';
    default:
      return loin ? 'loin' : 'à $brut';
  }
}
