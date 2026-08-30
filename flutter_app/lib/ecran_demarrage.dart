// Écran de démarrage Chap.ci — la vue qui prend la suite du splash natif.
//
// L'ANIMATION, dictée par le Patron le 30/08/2026 :
//   « une fois le cercle est là, et puis chap.ci est déjà dedans. Tout autour
//     de ça, un peu un peu un peu… ils ont fait comme un téléchargement, et
//     puis l'application sort. »
//
// LA COURONNE EST DONC UNE JAUGE. Le cœur et le nom sont posés d'emblée, puis
// les soixante-huit pétales se posent UN PAR UN tout autour, du haut et dans
// le sens des aiguilles d'une montre. Quand le tour est bouclé, l'application
// s'ouvre. Le temps d'attente veut dire quelque chose : ce n'est plus une
// décoration qui tourne dans le vide, c'est le chargement qu'on regarde.
//
// ⚠️ LES PÉTALES SONT PEINTS, LE NOM EST CHARGÉ — et ce partage est le sujet.
// Les 68 pétales ont tous la même forme : quatre points, une rotation, un
// angle. Douze nombres chacun, dans `signe_feuilles.dart`, GÉNÉRÉ depuis
// `src/components/signeChapci.ts` — la même source que le logo du site. Il
// FAUT qu'ils soient peints : une image se fait grandir en bloc, elle ne se
// remplit pas pétale par pétale. Le nom et sa ligne, eux, pèsent vingt mille
// caractères de contours ; ils restent des PNG.
//
// Le jour où le prestataire livre son fichier vectoriel, on regénère les deux
// et l'application suit — le dessin ne vit qu'à un seul endroit.

import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'signe_feuilles.dart';

class CouleursChap {
  /// Le drapeau : l'orange à gauche de la couronne, le vert à droite.
  static const orangeDrapeau = Color(0xFFF77F00);
  static const vert = Color(0xFF009E60);
  static const vertSombre = Color(0xFF00734A);
  static const encre = Color(0xFF1B1A17);
  static const papier = Color(0xFFFFFDF9);
  static const creme = Color(0xFFFFF3E4);

  /// Gardé sous son ancien nom : `SigneChap` l'accepte encore en paramètre et
  /// il est plus sûr de laisser une constante juste que d'aller renommer des
  /// appels qu'aucun compilateur ne peut vérifier ici.
  static const orange = vert;
}

/// Les images du signe, dans le cadre commun de 200×200 — le même repère que
/// `feuillesChapci`, si bien que tout se superpose sans le moindre calage.
class _Couches {
  /// Le cœur blanc cerné de vert : la bande blanche du drapeau. Il porte le
  /// nom, et il est posé DÈS LE DÉBUT — c'est le « cercle déjà là ».
  static const coeur = 'assets/marque/demarrage_coeur.png';
  static const mot = 'assets/marque/demarrage_mot.png';
  static const ligne = 'assets/marque/demarrage_ligne.png';

  /// Où vivent les lettres dans ce cadre, en fraction de la hauteur :
  /// le nom court de 0,39 à 0,57 (tracés Kaushan, translate(56.6 103)), la
  /// ligne de 0,59 à 0,62 (translate(52.1 122)). La fenêtre d'écriture part
  /// donc juste au-dessus et finit juste en dessous.
  static const hautTexte = 0.36;
  static const basTexte = 0.66;
}

/// Peint la couronne, chaque pétale selon son avancement propre.
///
/// [jauge] va de 0 (aucun pétale) à 1 (le tour bouclé). Un pétale dont
/// l'angle vaut `a` (en tours, donc 0 à 1) commence à se poser quand la jauge
/// atteint `a` et met [_course] à finir : les pétales voisins se chevauchent
/// donc légèrement, et la couronne se remplit d'un trait continu au lieu de
/// clignoter pétale après pétale.
class CouronneChapci extends CustomPainter {
  final double jauge;

  /// Part de la jauge que met UN pétale à se poser. 0,085 ≈ 90 ms sur une
  /// jauge d'une seconde : assez pour qu'il s'ouvre, trop court pour qu'on
  /// l'attende.
  static const double _course = 0.085;

  const CouronneChapci({required this.jauge});

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.shortestSide / 200.0;
    canvas.save();
    canvas.scale(k);

    final peinture = Paint()
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    for (var i = 0; i < nombreFeuilles; i++) {
      final b = i * champsParFeuille;
      final horloge = feuillesChapci[b + 11] / 360.0;
      // `clamp` renvoie `num` : sans `toDouble()`, l'analyseur refuse.
      final p = ((jauge - horloge) / _course).clamp(0.0, 1.0).toDouble();
      if (p <= 0) continue;

      final cx = feuillesChapci[b + 9];
      final cy = feuillesChapci[b + 10];
      // Le pétale s'ouvre depuis son propre centre, avec un léger dépassement
      // en fin de course : il « claque » au lieu de gonfler mollement.
      final e = _ouvre(p);

      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(feuillesChapci[b + 8] * math.pi / 180.0);
      canvas.scale(e);
      canvas.translate(-cx, -cy);

      peinture.color = (cx < 100 ? CouleursChap.orangeDrapeau : CouleursChap.vert)
          .withValues(alpha: p);

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
    canvas.restore();
  }

  /// L'ouverture d'un pétale : de 0,34 à 1, en dépassant à 1,06 aux trois
  /// quarts. Écrit à la main plutôt qu'avec une `Curve` : un `CurvedAnimation`
  /// par pétale ferait soixante-huit objets reconstruits à chaque image.
  static double _ouvre(double p) {
    final t = p < 0.75 ? p / 0.75 : 1.0;
    final base = 0.34 + 0.72 * (1 - (1 - t) * (1 - t) * (1 - t));
    return p < 0.75 ? base : 1.06 - 0.06 * ((p - 0.75) / 0.25);
  }

  @override
  bool shouldRepaint(CouronneChapci ancien) => ancien.jauge != jauge;
}

/// Le signe seul, à poser dans l'interface (en-tête de l'accueil…).
///
/// Sert la version COMPACTE — sans la ligne « Achat, Vente, Emplois, Chap » :
/// sous 40 px ses vingt-sept caractères tiendraient dans huit pixels et ne
/// seraient plus qu'une salissure. Le site applique le même seuil.
class SigneChap extends StatelessWidget {
  final double taille;

  /// `null` (défaut) = le drapeau au complet, pour un fond clair.
  /// [CouleursChap.papier] sert la variante des fonds colorés (vert profond).
  final Color? couleur;

  const SigneChap({super.key, this.taille = 26, this.couleur});

  @override
  Widget build(BuildContext context) {
    final surFondColore = couleur == CouleursChap.papier;
    return Image.asset(
      surFondColore
          ? 'assets/marque/signe_blanc.png'
          : 'assets/marque/signe.png',
      width: taille,
      height: taille,
      // Le signe EST le nom de la marque : un lecteur d'écran doit l'entendre.
      semanticLabel: 'Chap.ci',
    );
  }
}

class EcranDemarrage extends StatefulWidget {
  /// Appelé quand l'animation est finie — pour enchaîner sur l'accueil.
  final VoidCallback? auTerme;

  const EcranDemarrage({super.key, this.auTerme});

  @override
  State<EcranDemarrage> createState() => _EcranDemarrageState();
}

class _EcranDemarrageState extends State<EcranDemarrage>
    with SingleTickerProviderStateMixin {
  // La partition, sur 2 000 ms (le fondu final vers l'accueil, 240 ms, est
  // assuré par `_Lancement` dans main.dart via `auTerme`) :
  //     0 →  320   LE CERCLE EST LÀ : le cœur blanc s'ouvre
  //   120 →  520   … et chap.ci est DÉJÀ DEDANS : le nom s'écrit
  //   560 → 1600   LE TÉLÉCHARGEMENT : les pétales se posent un par un,
  //                du haut, dans le sens des aiguilles d'une montre
  //  1620 → 1900   le tour est bouclé, tout bat une fois
  //  1900 → 2000   tenue brève, puis l'application sort
  static const int _dureeMs = 2000;

  // Les courbes fortes du studio : une entrée démarre vite (sortie franche),
  // un aller-retour accélère puis freine (dedans).
  static const Cubic _sortie = Cubic(0.23, 1, 0.32, 1);
  static const Cubic _dedans = Cubic(0.77, 0, 0.175, 1);

  late final AnimationController _controleur;
  late final Animation<double> _coeur;
  late final Animation<double> _ecrit;
  late final Animation<double> _jauge;
  late final Animation<double> _battement;

  Animation<double> _entre(int debutMs, int finMs,
          [Curve courbe = Curves.linear]) =>
      CurvedAnimation(
        parent: _controleur,
        curve: Interval(debutMs / _dureeMs, finMs / _dureeMs, curve: courbe),
      );

  @override
  void initState() {
    super.initState();

    _controleur = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: _dureeMs),
    );

    // 1. LE CERCLE EST LÀ. Il ne surgit pas à sa taille : il s'ouvre depuis un
    //    point en freinant à l'arrivée — le geste d'une chose qui pousse.
    _coeur = _entre(0, 320, _sortie);

    // 2. … ET CHAP.CI EST DÉJÀ DEDANS : une fenêtre s'ouvre vers le bas sur
    //    le nom puis sur la ligne. C'est leur place dans le dessin qui donne
    //    l'ordre, rien d'autre.
    _ecrit = _entre(120, 520, _dedans);

    // 3. LE TÉLÉCHARGEMENT. LINÉAIRE, et c'est le point : une jauge qui
    //    accélère ou qui freine ment sur ce qu'elle prétend mesurer. Celle-ci
    //    avance d'un pas régulier, comme le ferait une vraie.
    _jauge = _entre(560, 1600);

    // 4. Le tour est bouclé : tout bat une seule fois.
    _battement = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.05).chain(CurveTween(curve: _dedans)),
          weight: 42),
      TweenSequenceItem(
          tween: Tween(begin: 1.05, end: 1.0).chain(CurveTween(curve: _dedans)),
          weight: 58),
    ]).animate(_entre(1620, 1900));

    // 5. Et l'application sort : au terme, l'accueil prend la suite par un
    //    fondu court (une sortie doit être plus vive qu'une entrée).
    _controleur.forward().then((_) {
      if (mounted) widget.auTerme?.call();
    });
  }

  @override
  void dispose() {
    _controleur.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // On suit la luminosité du SYSTÈME, pas celle du thème : l'app n'a qu'un
    // thème clair, mais le splash natif (flutter_native_splash) suit le
    // réglage du téléphone — sans cela, un téléphone en mode sombre verrait
    // le fond du splash natif sauter au clair au premier rendu.
    final sombre = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final fond = sombre ? CouleursChap.encre : CouleursChap.papier;

    // Le signe occupe 62 % de la largeur, plafonné à 232 : sur un petit
    // téléphone il respire, sur une tablette il ne devient pas une affiche.
    final large = MediaQuery.sizeOf(context).width;
    // `.toDouble()` explicite : `num.clamp` a bien un type de retour spécialisé
    // en `double` quand tout est `double`, mais rien ici ne compile pour le
    // vérifier, et `Size(...)` refuse un `num`. On ne parie pas là-dessus.
    final double cote = (large * 0.62).clamp(160.0, 232.0).toDouble();

    return Scaffold(
      backgroundColor: fond,
      body: Center(
        child: AnimatedBuilder(
          animation: _controleur,
          builder: (context, _) => Transform.scale(
            scale: _battement.value,
            child: SizedBox(
              width: cote,
              height: cote,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // LA JAUGE — les pétales, derrière le cœur : ils poussent
                  // depuis l'arrière, comme un vrai feuillage.
                  CustomPaint(
                    size: Size(cote, cote),
                    painter: CouronneChapci(jauge: _jauge.value),
                  ),

                  // LE CŒUR, posé d'emblée.
                  Opacity(
                    opacity: _coeur.value.clamp(0, 1).toDouble(),
                    child: Transform.scale(
                      scale: 0.72 + 0.28 * _coeur.value,
                      child: Image.asset(_Couches.coeur,
                          width: cote, height: cote),
                    ),
                  ),

                  // LE NOM ET SA LIGNE, révélés de haut en bas. Mêmes cadres
                  // que le cœur : ils se posent à leur place sans calage.
                  ClipRect(
                    clipper: _Revele(_ecrit.value),
                    child: SizedBox(
                      width: cote,
                      height: cote,
                      child: Stack(children: [
                        Image.asset(_Couches.mot, width: cote, height: cote),
                        Image.asset(_Couches.ligne, width: cote, height: cote),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// La fenêtre d'écriture : ne montre que le haut du cadre, jusqu'à la ligne
/// que `part` fait descendre — de 0 (au-dessus du nom, donc rien) à 1 (sous
/// la ligne, donc tout). Elle ne part pas de zéro : les 36 premiers pour cent
/// du cadre sont vides de texte, et les balayer aurait mangé la moitié du
/// temps de l'écriture sans rien montrer.
class _Revele extends CustomClipper<Rect> {
  final double part;
  const _Revele(this.part);

  @override
  Rect getClip(Size size) {
    final bas = size.height *
        (_Couches.hautTexte +
            (_Couches.basTexte - _Couches.hautTexte) * part.clamp(0, 1));
    return Rect.fromLTWH(0, 0, size.width, bas);
  }

  @override
  bool shouldReclip(_Revele ancien) => ancien.part != part;
}
