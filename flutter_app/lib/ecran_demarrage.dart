// Écran de démarrage Chap.ci — la vue qui prend la suite du splash natif.
//
// Le signe est peint et non chargé : un CustomPainter suit n'importe quelle
// densité d'écran sans jeu d'assets, et le tracé reste celui de la
// construction — mêmes paramètres, mêmes proportions.
//
// L'animation est « LA CROISÉE », choisie par le Patron le 26/08 sur aperçu :
// les deux bords arrivent chacun du côté opposé et SE CROISENT au centre, une
// LUMIÈRE jaillit à la rencontre, une couleur COULE vers le bas et écrit le
// nom puis la devise, TOUT BAT UNE SEULE FOIS, et l'app s'ouvre.

import 'dart:math' show min;

import 'package:flutter/material.dart';

class CouleursChap {
  static const orange = Color(0xFFF77F00);
  static const encre = Color(0xFF1B1A17);
  static const papier = Color(0xFFFFFDF9);
  static const creme = Color(0xFFFFF3E4);
}

/// Paramètres de construction du signe, repris de `construire.mjs`.
/// Les changer ici sans les changer là-bas fait diverger les deux dessins.
class _Signe {
  static const grille = 96.0;
  static const rayon = 25.0;
  static const epaisseur = 11.0;
  static const fente = 14.0;
  static const decalage = 5.0;

  /// Rayon d'encombrement mesuré sur la construction : sert à caler l'échelle.
  static const rayonEncombrement = 32.39;

  /// Course de la croisée : de combien (en unités de la grille) chaque moitié
  /// part du côté opposé avant de traverser — 40 ≈ 92 px à la taille 148.
  static const course = 40.0;
}

class SigneChapci extends CustomPainter {
  /// 0 = les deux moitiés au repos, 1 = écartées au maximum.
  final double ecartement;

  /// La croisée : 0 = chaque moitié est DE L'AUTRE CÔTÉ (la gauche à droite,
  /// la droite à gauche), 1 = posées. Entre les deux, elles se traversent.
  final double croisee;

  /// Opacité du signe (les moitiés naissent en tout début de course).
  final double alpha;

  final Color couleur;

  SigneChapci({
    this.ecartement = 0,
    this.croisee = 1,
    this.alpha = 1,
    required this.couleur,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.shortestSide / 2 / _Signe.rayonEncombrement;
    canvas.translate(
      size.width / 2 - (_Signe.grille / 2) * k,
      size.height / 2 - (_Signe.grille / 2) * k,
    );
    canvas.scale(k);

    final peinture = Paint()
      ..color = couleur.withValues(alpha: alpha.clamp(0, 1).toDouble())
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    // L'écartement s'ajoute à la fente et au décalage : les deux moitiés
    // s'éloignent en diagonale, dans l'axe du glissement.
    //
    // Le facteur 0,5 est une borne, pas un goût : le point le plus à gauche
    // vaut 48 - (fente/2 + rayon + écart), et au-delà de 16 d'écart la moitié
    // gauche sort de la grille — donc du CustomPaint, qui la rogne.
    final ecart = ecartement * _Signe.rayon * 0.5;

    canvas.drawPath(_moitie(-1, ecart), peinture);
    canvas.drawPath(_moitie(1, ecart), peinture);
  }

  /// Une moitié. `sens` vaut 1 à droite, -1 à gauche.
  ///
  /// Les extrémités sont coupées d'équerre au flanc. Une coupe verticale
  /// souderait les deux dos en haut et en bas, la fente disparaîtrait et le
  /// signe se refermerait en losange ordinaire.
  Path _moitie(int sens, double ecart) {
    const c = _Signe.grille / 2;
    const r = _Signe.rayon;
    const e = _Signe.epaisseur;
    final r2 = 1.4142135623730951;

    final pointeX = c + sens * (_Signe.fente / 2 + r + ecart);
    final cy = c + sens * (_Signe.decalage + ecart * 0.55);
    final dos = pointeX - sens * r;

    final chemin = Path()
      ..moveTo(dos, cy - r)
      ..lineTo(pointeX, cy)
      ..lineTo(dos, cy + r)
      ..lineTo(dos - (sens * e) / r2, cy + r - e / r2)
      ..lineTo(pointeX - sens * e * r2, cy)
      ..lineTo(dos - (sens * e) / r2, cy - r + e / r2)
      ..close();

    // La croisée : chaque moitié part du CÔTÉ OPPOSÉ (d'où le -sens) et
    // traverse l'axe en revenant chez elle, le long de la même diagonale
    // que le glissement (0,55 de pente, comme le décalage).
    final dx = -sens * (1 - croisee) * _Signe.course;
    return chemin.shift(Offset(dx, dx * 0.55));
  }

  @override
  bool shouldRepaint(SigneChapci ancien) =>
      ancien.ecartement != ecartement ||
      ancien.croisee != croisee ||
      ancien.alpha != alpha ||
      ancien.couleur != couleur;
}

/// Le signe seul, à poser dans l'interface (en-tête de l'accueil…).
///
/// Peint par le même `SigneChapci` que l'écran de démarrage : net à toutes
/// les tailles, aucun asset à charger, et un seul tracé à maintenir.
class SigneChap extends StatelessWidget {
  final double taille;
  final Color couleur;
  const SigneChap(
      {super.key, this.taille = 26, this.couleur = CouleursChap.orange});

  @override
  Widget build(BuildContext context) => SizedBox(
        width: taille,
        height: taille,
        child: CustomPaint(painter: SigneChapci(couleur: couleur)),
      );
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
  // Partition de « la croisée », sur 1 800 ms (le fondu final vers l'accueil,
  // 240 ms, est assuré par `_Lancement` dans main.dart via `auTerme`) :
  //   90 → 520     les bords arrivent des côtés opposés et se croisent
  //   210 → 730    la lumière jaillit à la rencontre, puis s'éteint
  //   600 → 1160   la couleur coule : l'éclat descend le long du texte
  //   640 → 1120   … et ÉCRIT le nom puis la devise, de haut en bas
  //   1220 → 1560  tout bat UNE SEULE fois (signe + nom ensemble)
  //   1560 → 1800  tenue brève, puis l'app s'ouvre
  static const int _dureeMs = 1800;

  // Les courbes fortes du studio : une entrée démarre vite (sortie franche),
  // un aller-retour accélère puis freine (dedans).
  static const Cubic _sortie = Cubic(0.23, 1, 0.32, 1);
  static const Cubic _dedans = Cubic(0.77, 0, 0.175, 1);

  late final AnimationController _controleur;
  late final Animation<double> _croisee;
  late final Animation<double> _lumiereOpacite;
  late final Animation<double> _lumiereEchelle;
  late final Animation<double> _fluxY;
  late final Animation<double> _fluxOpacite;
  late final Animation<double> _ecrit;
  late final Animation<double> _battement;

  Animation<double> _entre(int debutMs, int finMs, [Curve courbe = Curves.linear]) =>
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

    // 1. La croisée — sortie franche : la traversée est vive, l'arrivée
    //    freinée. L'opacité naît sur les premiers 12 % de la course.
    _croisee = _entre(90, 520, _sortie);

    // 2. La lumière : monte vite (30 % du temps), s'éteint en grandissant.
    _lumiereOpacite = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: 0.95)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 30),
      TweenSequenceItem(
          tween: Tween(begin: 0.95, end: 0.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 70),
    ]).animate(_entre(210, 730));
    _lumiereEchelle = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.55, end: 1.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.28), weight: 70),
    ]).animate(_entre(210, 730));

    // 3. La coulée : l'éclat descend de -6 à 96 (repère : haut du texte) et
    //    s'évanouit en bas ; l'écriture suit le même mouvement « dedans ».
    _fluxY = Tween<double>(begin: -6, end: 96).animate(_entre(600, 1160, _dedans));
    _fluxOpacite = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.9), weight: 25),
      TweenSequenceItem(tween: ConstantTween(0.85), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 0.85, end: 0.0), weight: 25),
    ]).animate(_entre(600, 1160));
    _ecrit = _entre(640, 1120, _dedans);

    // 4. Tout bat une seule fois — signe et nom ensemble.
    _battement = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.05).chain(CurveTween(curve: _dedans)),
          weight: 42),
      TweenSequenceItem(
          tween: Tween(begin: 1.05, end: 1.0).chain(CurveTween(curve: _dedans)),
          weight: 58),
    ]).animate(_entre(1220, 1560));

    // 5. Et l'app s'ouvre : au terme, l'accueil prend la suite par un fondu
    //    court (une sortie doit être plus vive qu'une entrée).
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
    // le fond encre du splash natif sauter à l'orange au premier rendu.
    final sombre =
        MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final fond = sombre ? CouleursChap.encre : CouleursChap.orange;
    final signe = sombre ? CouleursChap.orange : CouleursChap.encre;
    final nom = sombre ? CouleursChap.papier : CouleursChap.encre;
    final extension = sombre ? CouleursChap.orange : CouleursChap.papier;
    const lumiere = CouleursChap.papier; // lumière chaude, sur les deux fonds

    return Scaffold(
      backgroundColor: fond,
      body: Center(
        child: AnimatedBuilder(
          animation: _controleur,
          builder: (context, _) => Transform.scale(
            scale: _battement.value,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Le signe et sa lumière, superposés sans borner l'éclat.
                SizedBox(
                  width: 148,
                  height: 148,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      Transform.scale(
                        scale: _lumiereEchelle.value,
                        child: Opacity(
                          opacity: _lumiereOpacite.value.clamp(0, 1).toDouble(),
                          child: Container(
                            width: 228,
                            height: 228,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  lumiere,
                                  Color(0x59FFFDF9), // papier à 35 %
                                  Color(0x00FFFDF9),
                                ],
                                stops: [0, 0.34, 0.62],
                              ),
                            ),
                          ),
                        ),
                      ),
                      CustomPaint(
                        size: const Size(148, 148),
                        painter: SigneChapci(
                          croisee: _croisee.value,
                          alpha: min(1, _croisee.value / 0.12),
                          couleur: signe,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                // Le texte, écrit de haut en bas par la coulée : une fenêtre
                // qui s'ouvre vers le bas, l'éclat voyageant sur son bord.
                //
                // L'app n'embarque pas Plus Jakarta Sans (elle vit en Roboto) :
                // on garde la graisse et le resserrement du dessin, sans
                // nommer une police absente — ce serait un repli silencieux.
                SizedBox(
                  width: 260,
                  height: 80,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.topCenter,
                    children: [
                      ClipRect(
                        clipper: _Revele(_ecrit.value),
                        child: Column(
                          children: [
                            Text.rich(
                              TextSpan(children: [
                                TextSpan(
                                    text: 'Chap',
                                    style: TextStyle(color: nom)),
                                TextSpan(
                                    text: '.ci',
                                    style: TextStyle(color: extension)),
                              ]),
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 44,
                                letterSpacing: -1.6,
                                height: 1,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'ACHETER · VENDRE · CHAP-CHAP',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                                letterSpacing: 2.4,
                                color: nom.withValues(alpha: 0.68),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // L'éclat qui coule et « écrit ».
                      Transform.translate(
                        offset: Offset(0, _fluxY.value),
                        child: Opacity(
                          opacity: _fluxOpacite.value.clamp(0, 1).toDouble(),
                          child: Container(
                            width: 190,
                            height: 30,
                            decoration: const BoxDecoration(
                              gradient: RadialGradient(
                                colors: [Color(0xD9FFFDF9), Color(0x00FFFDF9)],
                                stops: [0, 0.68],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// La fenêtre d'écriture : ne montre que la part haute du texte — `part` va
/// de 0 (rien) à 1 (tout), avec 6 px de marge pour ne pas raser les jambages.
class _Revele extends CustomClipper<Rect> {
  final double part;
  const _Revele(this.part);

  @override
  Rect getClip(Size size) => Rect.fromLTWH(
      -10, 0, size.width + 20, part <= 0 ? 0 : size.height * part + 6);

  @override
  bool shouldReclip(_Revele ancien) => ancien.part != part;
}
