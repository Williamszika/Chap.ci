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
  late final AnimationController _controleur;
  late final Animation<double> _rapprochement;
  late final Animation<double> _apparitionTexte;

  @override
  void initState() {
    super.initState();

    // 620 ms : assez pour se voir, assez court pour ne pas se faire attendre.
    // Un écran de démarrage qui dure est un écran de démarrage de trop.
    _controleur = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 620),
    );

    // Les moitiés se rejoignent avec une courbe de sortie : rapide au début,
    // freinée à l'arrivée. C'est la règle du studio pour une apparition.
    _rapprochement = Tween<double>(begin: 1, end: 0).animate(
      CurvedAnimation(parent: _controleur, curve: Curves.easeOutCubic),
    );

    // Le texte suit de 80 ms — le décalage entre éléments d'une même liste.
    _apparitionTexte = CurvedAnimation(
      parent: _controleur,
      curve: const Interval(0.42, 1, curve: Curves.easeOut),
    );

    // Une fois les moitiés rejointes, le signe TIENT un instant avant de
    // laisser place à l'accueil — demande du Patron (26/08) : « que cela dure
    // un peu, juste un peu ». 750 ms : le temps de le voir, pas d'attendre.
    _controleur.forward().then((_) async {
      await Future<void>.delayed(const Duration(milliseconds: 750));
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
                    ecartement: _rapprochement.value,
                    couleur: signe,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Opacity(
                opacity: _apparitionTexte.value,
                child: Column(
                  children: [
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(text: 'Chap', style: TextStyle(color: nom)),
                          TextSpan(text: '.ci', style: TextStyle(color: extension)),
                        ],
                      ),
                      // L'app n'embarque pas Plus Jakarta Sans (elle vit en
                      // Roboto) : on garde la graisse et le resserrement du
                      // dessin, sans nommer une police absente — la nommer
                      // ferait un repli silencieux, pas un choix.
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
            ],
          ),
        ),
      ),
    );
  }
}
