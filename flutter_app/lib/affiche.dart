// =============================================================================
//  L'AFFICHE POUR LE STATUT WHATSAPP — 1080 × 1920, fabriquée dans le téléphone.
//
//  ⚠️ POURQUOI ELLE EXISTE. À Abidjan, une annonce se vend en statut WhatsApp
//  bien plus que sur une page. Jusqu'ici, un vendeur qui voulait y mettre son
//  annonce faisait une capture d'écran de la fiche — avec la barre du haut, le
//  prix à moitié coupé, et aucun moyen de retrouver l'annonce. Le bouton
//  « Affiche pour mon statut » fabrique une image propre : la photo, le prix en
//  éclat, la couronne, et le lien. Chaque statut ramène vers Chap.ci.
//
//  C'est le portage FIDÈLE de `src/lib/affiche.ts` (le site) : même cadre,
//  mêmes marges, mêmes couleurs, même ordre. Une affiche faite depuis
//  l'application doit être indiscernable d'une affiche faite depuis le site —
//  c'est UNE marque, pas deux.
//
//  Tout se passe DANS le téléphone : la photo déjà affichée sur la fiche est
//  la seule chose qui voyage, et elle vient du même serveur. Le signe est
//  REDESSINÉ depuis `signe_feuilles.dart` — les mêmes 68 pétales que l'écran
//  de démarrage — plus le cœur, dont le contour est copié ici depuis
//  `signeChapci.ts`. Pas une image : un dessin, net à toute taille.
//
//  ⚠️ LA PHOTO PEUT MANQUER, L'AFFICHE NE DOIT PAS. Réseau coupé, photo
//  illisible : on fabrique alors l'affiche SANS la photo — fond pâle, grande
//  couronne en filigrane. Le vendeur a quand même quelque chose à poster.
//
//  L'affiche est en FRANÇAIS quelle que soit la langue de l'application : elle
//  s'adresse aux contacts du vendeur, en Côte d'Ivoire, pas au vendeur.
// =============================================================================
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';

import 'signe_feuilles.dart';

/// Ce qu'il faut pour composer l'affiche. Les textes arrivent déjà formatés
/// (« 45 000 FCFA ») : ce fichier dessine, il ne décide pas.
class AfficheDonnees {
  final String id;
  final String titre;

  /// Prix affiché en grand (le prix promo s'il y en a une).
  final String prix;

  /// Prix barré, quand il y a une promotion.
  final String? prixBarre;

  /// La photo principale : ses octets si on les a déjà, sinon son URL. Les
  /// deux peuvent manquer.
  final Uint8List? photoOctets;
  final String? photoUrl;

  /// « Cocody · Abidjan »
  final String lieu;

  /// « Neuf » / « Occasion »
  final String etat;

  const AfficheDonnees({
    required this.id,
    required this.titre,
    required this.prix,
    this.prixBarre,
    this.photoOctets,
    this.photoUrl,
    required this.lieu,
    required this.etat,
  });
}

const double _l = 1080;
const double _h = 1920;

/// Marge de sécurité : 8 % du petit côté. Un statut se recadre sur les bords.
const double _marge = 86;

const _orange = Color(0xFFF77F00);
const _vert = Color(0xFF009E60);
const _vertF = Color(0xFF00734A);
const _creme = Color(0xFFFFFDF9);
const _cremeF = Color(0xFFFDEFDC);
const _encre = Color(0xFF1B1A17);

/// Gris chaud : 5,39:1 sur blanc, mesuré — lisible en plein soleil.
const _gris = Color(0xFF6F6A5E);

/// Le cœur du signe — le polygone `NOYAU` de `src/components/signeChapci.ts`,
/// dans le même cadre de 200 × 200 que les pétales. Vingt-quatre sommets, à la
/// file : x0 y0 x1 y1 …
const List<double> _noyau = [
  156.0, 100.0, 155.7, 112.6, 152.1, 125.2, 140.8, 133.2, 131.2, 141.6, 120.6, 149.9, //
  107.1, 153.7, 93.2, 151.5, 79.1, 150.7, 67.0, 144.0, 59.0, 133.4, 48.9, 124.7, //
  45.3, 112.4, 43.4, 100.0, 48.8, 88.4, 50.4, 76.1, 58.1, 65.8, 67.9, 57.2, //
  80.8, 53.3, 93.6, 51.2, 106.6, 50.2, 118.9, 54.2, 132.1, 57.3, 142.3, 65.5, //
  149.3, 76.2, 153.1, 88.0,
];

/// Peint le signe complet (pétales + cœur) dans un carré de [px] pixels dont
/// le coin haut-gauche est ([x], [y]). Même partage du drapeau que le site :
/// orange à gauche du centre, vert à droite.
void _peindreSigne(Canvas canvas, double x, double y, double px) {
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(px / 200.0);

  final peinture = Paint()
    ..style = PaintingStyle.fill
    ..isAntiAlias = true;

  for (var i = 0; i < nombreFeuilles; i++) {
    final b = i * champsParFeuille;
    final cx = feuillesChapci[b + 9];
    final cy = feuillesChapci[b + 10];
    canvas.save();
    canvas.translate(cx, cy);
    canvas.rotate(feuillesChapci[b + 8] * math.pi / 180.0);
    canvas.translate(-cx, -cy);
    peinture.color = cx < 100 ? _orange : _vert;
    canvas.drawPath(
      Path()
        ..moveTo(feuillesChapci[b], feuillesChapci[b + 1])
        ..quadraticBezierTo(feuillesChapci[b + 2], feuillesChapci[b + 3],
            feuillesChapci[b + 4], feuillesChapci[b + 5])
        ..quadraticBezierTo(feuillesChapci[b + 6], feuillesChapci[b + 7],
            feuillesChapci[b], feuillesChapci[b + 1])
        ..close(),
      peinture,
    );
    canvas.restore();
  }

  final coeur = Path()..moveTo(_noyau[0], _noyau[1]);
  for (var i = 2; i < _noyau.length; i += 2) {
    coeur.lineTo(_noyau[i], _noyau[i + 1]);
  }
  coeur.close();
  canvas.drawPath(coeur, Paint()..color = Colors.white);
  canvas.drawPath(
    coeur,
    Paint()
      ..color = _vertF
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..isAntiAlias = true,
  );
  canvas.restore();
}

TextStyle _style(double taille, FontWeight graisse, Color couleur) => TextStyle(
      fontSize: taille,
      fontWeight: graisse,
      color: couleur,
      height: 1.0,
      decoration: TextDecoration.none,
    );

TextPainter _mesurer(String texte, TextStyle style) => TextPainter(
      text: TextSpan(text: texte, style: style),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();

/// Écrit [texte] avec sa ligne de base à [ligneBase] — comme `fillText` du
/// canvas web, pour reprendre les cotes du site telles quelles.
/// [alignement] : -1 = à gauche de [x], 0 = centré sur [x], 1 = à droite.
void _ecrire(Canvas canvas, String texte, double x, double ligneBase,
    TextStyle style, {int alignement = -1}) {
  final tp = _mesurer(texte, style);
  final base = tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
  final dx = alignement == 0
      ? x - tp.width / 2
      : alignement > 0
          ? x - tp.width
          : x;
  tp.paint(canvas, Offset(dx, ligneBase - base));
}

/// Coupe un texte en lignes qui tiennent dans [largeur], au plus [max] lignes,
/// « … » à la fin. Même règle que le site : on coupe sur un MOT, jamais au
/// milieu — « batteri… » se lit comme une faute, « batterie… » comme une suite.
List<String> couperLignes(String texte, TextStyle style, double largeur, int max) {
  double mesure(String t) => _mesurer(t, style).width;
  final mots = texte.trim().split(RegExp(r'\s+'));
  final out = <String>[];
  var ligne = '';
  for (final mot in mots) {
    final essai = ligne.isEmpty ? mot : '$ligne $mot';
    if (mesure(essai) <= largeur || ligne.isEmpty) {
      ligne = essai;
    } else {
      out.add(ligne);
      ligne = mot;
    }
    if (out.length == max) break;
  }
  if (out.length < max && ligne.isNotEmpty) out.add(ligne);
  if (out.isEmpty) return out;
  final tronque = mots.join(' ').length > out.join(' ').length;
  if (tronque) {
    var derniere = out[max - 1];
    while (derniere.contains(' ') && mesure('$derniere …') > largeur) {
      derniere = derniere.substring(0, derniere.lastIndexOf(' '));
    }
    if (mesure('$derniere …') > largeur) {
      // Un seul mot trop long pour la ligne : là seulement, on l'entame.
      while (derniere.length > 1 && mesure('$derniere…') > largeur) {
        derniere = derniere.substring(0, derniere.length - 1);
      }
      out[max - 1] = '$derniere…';
    } else {
      // « impeccable, … » : la virgule avant les points est un bégaiement.
      out[max - 1] = '${derniere.replaceAll(RegExp(r'[,;:\-–—]+$'), '')} …';
    }
  }
  return out;
}

RRect _arrondi(double x, double y, double l, double h, double r) =>
    RRect.fromRectAndRadius(Rect.fromLTWH(x, y, l, h), Radius.circular(r));

/// Charge la photo : les octets fournis, sinon l'URL (15 s au plus). `null`
/// si rien n'est lisible — l'affiche se fait alors sans elle.
Future<ui.Image?> _chargerPhoto(AfficheDonnees d) async {
  Uint8List? octets = d.photoOctets;
  if (octets == null && d.photoUrl != null && d.photoUrl!.isNotEmpty) {
    try {
      final r = await http
          .get(Uri.parse(d.photoUrl!))
          .timeout(const Duration(seconds: 15));
      if (r.statusCode == 200 && r.bodyBytes.isNotEmpty) octets = r.bodyBytes;
    } catch (_) {
      octets = null;
    }
  }
  if (octets == null) return null;
  try {
    final codec = await ui.instantiateImageCodec(octets);
    final image = (await codec.getNextFrame()).image;
    codec.dispose();
    return image;
  } catch (_) {
    return null;
  }
}

/// Fabrique l'affiche et renvoie le PNG. Ne lève que si le téléphone ne sait
/// pas exporter l'image — ce qui n'arrive pas sur un appareil sain.
Future<Uint8List> rendreAffiche(AfficheDonnees d) async {
  final photo = await _chargerPhoto(d);

  final enregistreur = ui.PictureRecorder();
  final canvas = Canvas(enregistreur, const Rect.fromLTWH(0, 0, _l, _h));

  // ── Fond ─────────────────────────────────────────────────────────────────
  canvas.drawRect(const Rect.fromLTWH(0, 0, _l, _h), Paint()..color = _creme);

  // ── En-tête : la couronne et le nom ──────────────────────────────────────
  _peindreSigne(canvas, _marge, _marge, 120);
  _ecrire(canvas, 'Chap.ci', _marge + 120 + 24, _marge + 78,
      _style(72, FontWeight.w800, _encre));
  _ecrire(canvas, 'Petites annonces · Côte d’Ivoire', _marge + 120 + 26,
      _marge + 118, _style(30, FontWeight.w600, _gris));

  // ── La photo : le point focal ────────────────────────────────────────────
  const px = _marge, py = 250.0, pl = _l - 2 * _marge, ph = 1000.0, pr = 48.0;
  final cadre = _arrondi(px, py, pl, ph, pr);
  // Ombre chaude, comme les cartes du site.
  canvas.drawRRect(
    _arrondi(px, py + 12, pl, ph, pr),
    Paint()
      ..color = const Color(0x47784600)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 17),
  );
  canvas.drawRRect(cadre, Paint()..color = _cremeF);
  canvas.save();
  canvas.clipRRect(cadre);
  if (photo != null) {
    // « cover » : on remplit le cadre, on rogne le surplus au centre.
    final k = math.max(pl / photo.width, ph / photo.height);
    final dl = photo.width * k, dh = photo.height * k;
    canvas.drawImageRect(
      photo,
      Rect.fromLTWH(0, 0, photo.width.toDouble(), photo.height.toDouble()),
      Rect.fromLTWH(px + (pl - dl) / 2, py + (ph - dh) / 2, dl, dh),
      Paint()..filterQuality = FilterQuality.medium,
    );
  } else {
    canvas.saveLayer(
        cadre.outerRect, Paint()..color = const Color.fromRGBO(0, 0, 0, 0.16));
    _peindreSigne(canvas, px + (pl - 640) / 2, py + (ph - 640) / 2, 640);
    canvas.restore();
  }
  canvas.restore();

  // ── Le prix, en éclat : pastille verte cerclée de blanc, à cheval sur la photo
  final stylePrix = _style(76, FontWeight.w800, Colors.white);
  final largPrix = _mesurer(d.prix, stylePrix).width;
  final pastL = largPrix + 2 * 52, pastH = 128.0;
  final pastX = (_l - pastL) / 2, pastY = py + ph - pastH / 2;
  canvas.drawRRect(
    _arrondi(pastX - 8, pastY - 8 + 8, pastL + 16, pastH + 16, (pastH + 16) / 2),
    Paint()
      ..color = const Color(0x40000000)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12),
  );
  canvas.drawRRect(
      _arrondi(pastX - 8, pastY - 8, pastL + 16, pastH + 16, (pastH + 16) / 2),
      Paint()..color = Colors.white);
  canvas.drawRRect(
      _arrondi(pastX, pastY, pastL, pastH, pastH / 2), Paint()..color = _vert);
  _ecrire(canvas, d.prix, _l / 2, pastY + 88, stylePrix, alignement: 0);
  final barre = d.prixBarre;
  if (barre != null && barre.isNotEmpty) {
    // L'ancien prix, barré, juste au-dessus de la pastille — sur la photo, donc
    // sur un petit fond blanc pour rester lisible quelle que soit la photo.
    final styleBarre = _style(36, FontWeight.w700, _gris);
    final lb = _mesurer(barre, styleBarre).width;
    final bx = (_l - lb) / 2 - 20, by = pastY - 74;
    canvas.drawRRect(_arrondi(bx, by, lb + 40, 56, 28),
        Paint()..color = const Color(0xEBFFFFFF));
    _ecrire(canvas, barre, _l / 2, by + 40, styleBarre, alignement: 0);
    canvas.drawLine(
      Offset((_l - lb) / 2, by + 28),
      Offset((_l + lb) / 2, by + 28),
      Paint()
        ..color = _gris
        ..strokeWidth = 3,
    );
  }

  // ── Le titre, deux lignes au plus ─────────────────────────────────────────
  final styleTitre = _style(68, FontWeight.w800, _encre);
  var y = py + ph + 64 + 90;
  for (final l in couperLignes(d.titre, styleTitre, _l - 2 * _marge, 2)) {
    _ecrire(canvas, l, _marge, y, styleTitre);
    y += 80;
  }

  // ── Lieu et état ──────────────────────────────────────────────────────────
  final sousTitre = [d.lieu, d.etat].where((s) => s.trim().isNotEmpty).join('  ·  ');
  _ecrire(canvas, sousTitre, _marge, y + 20, _style(40, FontWeight.w600, _gris));

  // ── L'appel : voir sur chap.ci ────────────────────────────────────────────
  const cy = _h - _marge - 60 - 130;
  canvas.drawRRect(
      _arrondi(_marge, cy, _l - 2 * _marge, 130, 65), Paint()..color = _orange);
  // Encre sur orange : 6,62:1, mesuré — le blanc n'y ferait que 2,63.
  _ecrire(canvas, 'Voir l’annonce sur chap.ci', _l / 2, cy + 84,
      _style(54, FontWeight.w800, _encre), alignement: 0);
  _ecrire(canvas, 'chap.ci/annonce/${d.id}', _l / 2, _h - _marge + 4,
      _style(32, FontWeight.w600, _gris), alignement: 0);

  final image = await enregistreur.endRecording().toImage(_l.toInt(), _h.toInt());
  photo?.dispose();
  final octets = await image.toByteData(format: ui.ImageByteFormat.png);
  image.dispose();
  if (octets == null) throw StateError('export impossible');
  return octets.buffer.asUint8List();
}

/// Envoie l'affiche à WhatsApp (ou ailleurs) par la feuille de partage du
/// système. [origine] est requis sur iPad, sinon la feuille ne sait pas d'où
/// s'ancrer. Le fichier part de la mémoire : share_plus l'écrit lui-même dans
/// le dossier temporaire, rien ne reste dans la galerie sans que la personne
/// l'y mette.
///
/// ⚠️ L'IMAGE PART SEULE, SANS TEXTE. Le 4 septembre 2026, deux essais du
/// Patron depuis le site (iPhone, puis WhatsApp sur Mac) ont donné deux statuts
/// SANS l'affiche : quand WhatsApp reçoit une image ET un texte qui contient un
/// lien, il garde le lien, fabrique sa propre carte d'aperçu, et jette l'image.
/// Le lien est déjà écrit sur l'affiche ; le texte n'apportait rien de plus.
Future<void> partagerAffiche(Uint8List png, String nom, {Rect? origine}) async {
  await SharePlus.instance.share(ShareParams(
    files: [XFile.fromData(png, mimeType: 'image/png', name: nom)],
    fileNameOverrides: [nom],
    sharePositionOrigin: origine,
  ));
}
