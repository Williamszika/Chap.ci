import 'package:flutter/material.dart';

/// LES RÉSEAUX SOCIAUX DU PROFESSIONNEL (05/09/2026) — le jumeau de
/// `src/data/reseaux.ts` : les neuf réseaux que le serveur accepte, dans le
/// même ordre, avec la couleur de la marque, l'encre qui se lit dessus, et
/// l'icône dessinée au trait (les mêmes tracés que le site, en coordonnées
/// 24 × 24 — l'application n'embarque aucune police d'icônes de marques).
///
/// WhatsApp en premier, décision du Patron du 05/09/2026 : c'est le canal par
/// lequel on vend à Abidjan, et c'est le professionnel qui choisit de publier
/// son WhatsApp Business (le numéro personnel d'un vendeur ordinaire, lui, ne
/// sort toujours pas du serveur).
class DefReseau {
  final String id;
  final String nom;

  /// Une couleur : fond uni ; trois : dégradé (Instagram).
  final List<Color> fond;
  final Color encre;

  /// La clé du texte d'exemple du champ de saisie.
  final String placeholderCle;
  const DefReseau(this.id, this.nom, this.fond, this.encre, this.placeholderCle);

  Color get couleur => fond.first;
  Gradient? get degrade => fond.length > 1
      ? LinearGradient(
          begin: Alignment.bottomLeft, end: Alignment.topRight, colors: fond)
      : null;
}

const reseaux = <DefReseau>[
  DefReseau('whatsapp', 'WhatsApp', [Color(0xFF25D366)], Colors.white, 'reseaux.ph.whatsapp'),
  DefReseau('facebook', 'Facebook', [Color(0xFF1877F2)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('instagram', 'Instagram',
      [Color(0xFFF58529), Color(0xFFDD2A7B), Color(0xFF8134AF)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('tiktok', 'TikTok', [Color(0xFF111111)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('youtube', 'YouTube', [Color(0xFFFF0000)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('snapchat', 'Snapchat', [Color(0xFFFFFC00)], Color(0xFF111111), 'reseaux.ph.nom'),
  DefReseau('linkedin', 'LinkedIn', [Color(0xFF0A66C2)], Colors.white, 'reseaux.ph.lien'),
  DefReseau('x', 'X', [Color(0xFF000000)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('telegram', 'Telegram', [Color(0xFF26A5E4)], Colors.white, 'reseaux.ph.nom'),
  DefReseau('site', 'Site web', [Color(0xFF1B1A17)], Colors.white, 'reseaux.ph.site'),
];

DefReseau? reseauParId(String id) {
  for (final r in reseaux) {
    if (r.id == id) return r;
  }
  return null;
}

/// « https://www.facebook.com/maisonkoffi/ » → « facebook.com/maisonkoffi ».
String lisibleReseau(String url) => url
    .replaceFirst(RegExp(r'^https?://', caseSensitive: false), '')
    .replaceFirst(RegExp(r'^www\.', caseSensitive: false), '')
    .replaceFirst(RegExp(r'/$'), '');

/// Les réseaux renseignés, dans l'ordre de la liste : (définition, adresse).
List<(DefReseau, String)> reseauxPresents(Map<String, String>? r) {
  if (r == null) return const [];
  return [
    for (final d in reseaux)
      if (r[d.id] != null && r[d.id]!.startsWith('https://')) (d, r[d.id]!),
  ];
}

/* ── Les icônes, au trait ─────────────────────────────────────────────────── */

/// Les tracés SVG (24 × 24). Trait de 2 pour tous, sauf ce que `_pleins`
/// désigne : le fantôme Snapchat (sur le jaune, un trait fin disparaît) et
/// le combiné de WhatsApp.
const _traces = <String, List<String>>{
  'whatsapp': [
    'M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z',
    'M9.2 7.6c.2-.3.6-.3.9-.1l1.1 1.6c.2.3.1.6-.1.8l-.7.7c.6 1.2 1.6 2.2 2.8 2.8l.7-.7c.2-.2.5-.3.8-.1l1.6 1.1c.3.2.3.6.1.9l-.6.9c-.3.4-.8.6-1.3.5-3-.6-5.6-3.2-6.2-6.2-.1-.5.1-1 .5-1.3z',
  ],
  'facebook': ['M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'],
  'instagram': [
    'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z',
    'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z',
    'M17.5 6.5h.01',
  ],
  'tiktok': ['M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5'],
  'youtube': [
    'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17',
    'M10 15l5-3-5-3z',
  ],
  'snapchat': [
    'M12 2c-4.2 0-6.4 3-6.4 6.5v2.6c-.8.3-1.7.2-2.4-.2-.4-.2-.9.2-.7.6.5 1 1.6 1.6 2.6 1.9-.3 1.3-1.5 2.6-3.2 3.1-.4.1-.5.6-.1.8.9.5 2 .6 2.6.8.2.5.2 1.2.6 1.4.6.2 1.5-.3 2.6-.1 1.4.3 2.3 1.8 4.4 1.8s3-1.5 4.4-1.8c1.1-.2 2 .3 2.6.1.4-.2.4-.9.6-1.4.6-.2 1.7-.3 2.6-.8.4-.2.3-.7-.1-.8-1.7-.5-2.9-1.8-3.2-3.1 1-.3 2.1-.9 2.6-1.9.2-.4-.3-.8-.7-.6-.7.4-1.6.5-2.4.2V8.5C18.4 5 16.2 2 12 2z',
  ],
  'linkedin': [
    'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z',
    'M2 9h4v12H2z',
    'M6 4a2 2 0 1 1-4 0a2 2 0 1 1 4 0z',
  ],
  'x': ['M4 4l16 16M20 4L4 20'],
  'telegram': ['M22 2l-7 20-4-9-9-4z', 'M22 2L11 13'],
  'site': [
    'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0z',
    'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20',
    'M2 12h20',
  ],
};

/// Les tracés qui se REMPLISSENT au lieu de se tracer : id → indices.
const _pleins = <String, Set<int>>{'snapchat': {0}, 'whatsapp': {1}};

/// Les tracés d'un réseau (pour les tests, qui les peignent eux-mêmes).
List<String> tracesDe(String id) => _traces[id] ?? const [];

/// Peint l'icône d'un réseau dans le repère 24 × 24 du canvas — le widget et
/// le test passent par ici, pour dessiner exactement la même chose.
void peindreIcone(Canvas canvas, String id, Color encre) {
  final traces = _traces[id];
  if (traces == null) return;
  final trait = Paint()
    ..color = encre
    ..style = PaintingStyle.stroke
    ..strokeWidth = id == 'x' ? 2.4 : 2
    ..strokeCap = StrokeCap.round
    ..strokeJoin = StrokeJoin.round;
  final plein = Paint()
    ..color = encre
    ..style = PaintingStyle.fill;
  for (var i = 0; i < traces.length; i++) {
    final rempli = _pleins[id]?.contains(i) ?? false;
    canvas.drawPath(cheminSvg(traces[i]), rempli ? plein : trait);
  }
}

/// Un tracé SVG (M, L, H, V, C, S, Q, A, Z et leurs minuscules) → un Path.
/// Juste ce qu'il faut pour les neuf icônes ci-dessus — rien de plus.
Path cheminSvg(String d) {
  final path = Path();
  final tokens = RegExp(r'[MmLlHhVvCcSsQqAaZz]|-?\d*\.?\d+(?:e-?\d+)?')
      .allMatches(d)
      .map((m) => m.group(0)!)
      .toList();
  var i = 0;
  var cmd = '';
  double x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0;
  double lire() => double.parse(tokens[i++]);
  while (i < tokens.length) {
    final t = tokens[i];
    if (RegExp(r'^[A-Za-z]$').hasMatch(t)) {
      cmd = t;
      i++;
      if (cmd == 'Z' || cmd == 'z') {
        path.close();
        x = sx;
        y = sy;
        continue;
      }
    }
    final rel = cmd == cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M':
        final nx = lire(), ny = lire();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.moveTo(x, y);
        sx = x;
        sy = y;
        cmd = rel ? 'l' : 'L'; // les couples suivants sont des lignes
        cx = x;
        cy = y;
      case 'L':
        final nx = lire(), ny = lire();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.lineTo(x, y);
        cx = x;
        cy = y;
      case 'H':
        final nx = lire();
        x = rel ? x + nx : nx;
        path.lineTo(x, y);
        cx = x;
        cy = y;
      case 'V':
        final ny = lire();
        y = rel ? y + ny : ny;
        path.lineTo(x, y);
        cx = x;
        cy = y;
      case 'C':
        final x1 = lire(), y1 = lire(), x2 = lire(), y2 = lire();
        final nx = lire(), ny = lire();
        final ax1 = rel ? x + x1 : x1, ay1 = rel ? y + y1 : y1;
        final ax2 = rel ? x + x2 : x2, ay2 = rel ? y + y2 : y2;
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.cubicTo(ax1, ay1, ax2, ay2, x, y);
        cx = ax2;
        cy = ay2;
      case 'S':
        final x2 = lire(), y2 = lire(), nx = lire(), ny = lire();
        final ax1 = 2 * x - cx, ay1 = 2 * y - cy;
        final ax2 = rel ? x + x2 : x2, ay2 = rel ? y + y2 : y2;
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.cubicTo(ax1, ay1, ax2, ay2, x, y);
        cx = ax2;
        cy = ay2;
      case 'Q':
        final x1 = lire(), y1 = lire(), nx = lire(), ny = lire();
        final ax1 = rel ? x + x1 : x1, ay1 = rel ? y + y1 : y1;
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.quadraticBezierTo(ax1, ay1, x, y);
        cx = ax1;
        cy = ay1;
      case 'A':
        final rx = lire(), ry = lire(), rot = lire();
        final grand = lire() != 0, sens = lire() != 0;
        final nx = lire(), ny = lire();
        x = rel ? x + nx : nx;
        y = rel ? y + ny : ny;
        path.arcToPoint(Offset(x, y),
            radius: Radius.elliptical(rx, ry),
            rotation: rot,
            largeArc: grand,
            clockwise: sens);
        cx = x;
        cy = y;
      default:
        i++; // jeton inattendu : on l'ignore plutôt que de planter le dessin
    }
  }
  return path;
}

/// L'icône d'un réseau, dessinée au trait dans [taille] × [taille].
class IconeReseau extends StatelessWidget {
  final String id;
  final double taille;
  final Color couleur;
  const IconeReseau(this.id,
      {super.key, this.taille = 16, this.couleur = Colors.white});

  @override
  Widget build(BuildContext context) => CustomPaint(
        size: Size.square(taille),
        painter: _PeintreReseau(id, couleur),
      );
}

class _PeintreReseau extends CustomPainter {
  final String id;
  final Color couleur;
  const _PeintreReseau(this.id, this.couleur);

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.width / 24;
    canvas.scale(k, k);
    peindreIcone(canvas, id, couleur);
  }

  @override
  bool shouldRepaint(_PeintreReseau ancien) =>
      ancien.id != id || ancien.couleur != couleur;
}
