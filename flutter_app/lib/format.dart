/// Formatage à la française — les mêmes règles que le site.
///
/// Prix en FCFA avec l'espace insécable pour séparer les milliers et avant
/// « FCFA » (1 500 FCFA, jamais 1500FCFA ni 1 500 FCFA cassé en fin de ligne).
library;

const String _nbsp = ' '; // espace insécable

/// 1500 -> « 1 500 FCFA ». Le séparateur de milliers est insécable.
String formatFCFA(num montant) {
  final entier = montant.round().abs().toString();
  final tampon = StringBuffer();
  for (int i = 0; i < entier.length; i++) {
    if (i > 0 && (entier.length - i) % 3 == 0) tampon.write(_nbsp);
    tampon.write(entier[i]);
  }
  final signe = montant < 0 ? '-' : '';
  return '$signe$tampon${_nbsp}FCFA';
}

/// Heure locale courte « 14:05 » à partir d'un timestamp en millisecondes.
String heureCourte(int ms) {
  final d = DateTime.fromMillisecondsSinceEpoch(ms).toLocal();
  final h = d.hour.toString().padLeft(2, '0');
  final m = d.minute.toString().padLeft(2, '0');
  return '$h:$m';
}

/// Temps écoulé depuis un timestamp en millisecondes -> « il y a 3 h », « hier »…
String tempsEcoule(int timestampMs) {
  final maintenant = DateTime.now().millisecondsSinceEpoch;
  final secondes = ((maintenant - timestampMs) / 1000).round();
  if (secondes < 60) return "à l'instant";
  final minutes = (secondes / 60).round();
  if (minutes < 60) return 'il y a $minutes${_nbsp}min';
  final heures = (minutes / 60).round();
  if (heures < 24) return 'il y a $heures${_nbsp}h';
  final jours = (heures / 24).round();
  if (jours == 1) return 'hier';
  if (jours < 7) return 'il y a $jours${_nbsp}jours';
  final semaines = (jours / 7).round();
  if (semaines < 5) return 'il y a $semaines${_nbsp}sem.';
  final mois = (jours / 30).round();
  if (mois < 12) return 'il y a $mois${_nbsp}mois';
  return 'il y a ${(jours / 365).round()}${_nbsp}an(s)';
}
