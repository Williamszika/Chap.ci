// Écran de démarrage Chap.ci — la vue qui prend la suite du splash natif.
//
// Le signe est peint et non chargé : un CustomPainter suit n'importe quelle
// densité d'écran sans jeu d'assets, et le tracé reste celui de la
// construction — mêmes paramètres, mêmes proportions.
//
// Le glissement des deux moitiés est animé : elles arrivent écartées et se
// rejoignent. C'est le nom qui joue, « chap-chap », vite vite.

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
}

class SigneChapci extends CustomPainter {
  /// 0 = les deux moitiés au repos, 1 = écartées au maximum.
  final double ecartement;
  final Color couleur;

  SigneChapci({this.ecartement = 0, required this.couleur});

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.shortestSide / 2 / _Signe.rayonEncombrement;
    canvas.translate(
      size.width / 2 - (_Signe.grille / 2) * k,
      size.height / 2 - (_Signe.grille / 2) * k,
    );
    canvas.scale(k);

    final peinture = Paint()
      ..color = couleur
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

    return Path()
      ..moveTo(dos, cy - r)
      ..lineTo(pointeX, cy)
      ..lineTo(dos, cy + r)
      ..lineTo(dos - (sens * e) / r2, cy + r - e / r2)
      ..lineTo(pointeX - sens * e * r2, cy)
      ..lineTo(dos - (sens * e) / r2, cy - r + e / r2)
      ..close();
  }

  @override
  bool shouldRepaint(SigneChapci ancien) =>
      ancien.ecartement != ecartement || ancien.couleur != couleur;
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
  // « L'entrée chap-chap » (validée par le Patron le 26/08, aperçu à l'appui).
  //
  // Le mot est doublé, l'animation aussi : le signe est déjà là, ENTIER —
  // continuité parfaite avec le splash natif, fini le saut où il apparaissait
  // coupé en deux — puis il BAT deux fois (écart bref, retour ferme), et le
  // nom se pose en deux temps : « Chap », puis « .ci » qui répond.
  //
  // Partition sur 1 800 ms (le fondu vers l'accueil, 240 ms, est assuré par
  // `_Lancement` dans main.dart une fois `auTerme` appelé) :
  //   0 → 150     repos — le signe entier, immobile
  //   150 → 400   battement 1 (écart 110 ms, retour 140 ms)
  //   400 → 490   silence entre les deux temps
  //   490 → 740   battement 2
  //   620 → 880   « Chap » se pose (sortie rapide, freinée à l'arrivée)
  //   730 → 990   « .ci » répond
  //   880 → 1180  la devise s'éclaire
  //   1180 → 1800 tenue — on regarde
  static const int _dureeMs = 1800;

  // Les courbes fortes du studio : une entrée démarre vite (sortie franche),
  // un aller-retour accélère puis freine (dedans).
  static const Cubic _sortie = Cubic(0.23, 1, 0.32, 1);
  static const Cubic _dedans = Cubic(0.77, 0, 0.175, 1);

  // Amplitude du battement : 4,6 unités de la grille 96, soit `0.37` sur
  // l'échelle d'écartement du peintre (dont le 1 vaut rayon/2 = 12,5 unités).
  static const double _amplitude = 0.37;

  late final AnimationController _controleur;
  late final Animation<double> _battement;
  late final Animation<double> _poseChap;
  late final Animation<double> _poseCi;
  late final Animation<double> _deviseVisible;

  @override
  void initState() {
    super.initState();

    _controleur = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: _dureeMs),
    );

    // Un battement = écart (courbe dedans) puis retour (sortie franche).
    TweenSequenceItem<double> ecart() => TweenSequenceItem(
          tween: Tween(begin: 0.0, end: _amplitude)
              .chain(CurveTween(curve: _dedans)),
          weight: 110,
        );
    TweenSequenceItem<double> retour() => TweenSequenceItem(
          tween: Tween(begin: _amplitude, end: 0.0)
              .chain(CurveTween(curve: _sortie)),
          weight: 140,
        );
    TweenSequenceItem<double> repos(double ms) =>
        TweenSequenceItem(tween: ConstantTween(0.0), weight: ms);

    _battement = TweenSequence<double>([
      repos(150), // continuité avec le splash natif
      ecart(), retour(), // chap…
      repos(90),
      ecart(), retour(), // …chap
      repos(1060), // le signe tient, on regarde
    ]).animate(_controleur);

    Animation<double> pose(int debutMs, int finMs) => CurvedAnimation(
          parent: _controleur,
          curve: Interval(debutMs / _dureeMs, finMs / _dureeMs, curve: _sortie),
        );
    _poseChap = pose(620, 880);
    _poseCi = pose(730, 990);
    _deviseVisible = CurvedAnimation(
      parent: _controleur,
      curve: const Interval(880 / _dureeMs, 1180 / _dureeMs,
          curve: Curves.easeOut),
    );

    // La tenue fait partie de la partition : au terme, l'accueil prend la
    // suite par un fondu court (une sortie doit être plus vive qu'une entrée).
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

    return Scaffold(
      backgroundColor: fond,
      body: Center(
        child: AnimatedBuilder(
          animation: _controleur,
          builder: (context, _) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 148,
                height: 148,
                child: CustomPaint(
                  painter: SigneChapci(
                    ecartement: _battement.value,
                    couleur: signe,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              // Le nom en deux temps : « Chap » se pose, « .ci » répond —
              // chaque moitié monte de 14 px en s'éclairant.
              //
              // L'app n'embarque pas Plus Jakarta Sans (elle vit en Roboto) :
              // on garde la graisse et le resserrement du dessin, sans nommer
              // une police absente — la nommer ferait un repli silencieux.
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  _mot('Chap', nom, _poseChap.value),
                  _mot('.ci', extension, _poseCi.value),
                ],
              ),
              const SizedBox(height: 10),
              Opacity(
                opacity: _deviseVisible.value,
                child: Text(
                  'ACHETER · VENDRE · CHAP-CHAP',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                    letterSpacing: 2.4,
                    color: nom.withValues(alpha: 0.68),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Une moitié du nom : opacité et montée de 14 px pilotées par `avancee`
  /// (0 = invisible en bas, 1 = posée).
  Widget _mot(String texte, Color couleur, double avancee) {
    return Opacity(
      opacity: avancee,
      child: Transform.translate(
        offset: Offset(0, 14 * (1 - avancee)),
        child: Text(
          texte,
          style: TextStyle(
            color: couleur,
            fontWeight: FontWeight.w800,
            fontSize: 44,
            letterSpacing: -1.6,
            height: 1,
          ),
        ),
      ),
    );
  }
}
