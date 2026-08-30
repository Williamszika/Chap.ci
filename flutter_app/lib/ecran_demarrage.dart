// Écran de démarrage Chap.ci — la vue qui prend la suite du splash natif.
//
// L'ANIMATION, dictée par le Patron le 30/08/2026 : « une tache verte qui
// apparaît et après les lettres s'écrivent et rayonnent, puis l'app s'ouvre ».
// Trois temps, dans cet ordre, et rien de plus.
//
// ⚠️ LE SIGNE N'EST PLUS PEINT, IL EST CHARGÉ. L'ancien signe « chap-chap »
// tenait en deux losanges : un CustomPainter suivait n'importe quelle densité
// d'écran sans le moindre asset. La couronne de feuillage, elle, compte
// soixante-huit feuilles et deux textes vectorisés de vingt mille caractères ;
// la peindre en Dart serait illisible et invérifiable sans compiler. Elle
// arrive donc en PNG, à trois densités, GÉNÉRÉE depuis la même source que le
// site — `src/components/signeChapci.ts` — par `scratchpad/assets-flutter.mjs`.
// Le jour où le prestataire livre son fichier vectoriel, on regénère : le
// dessin ne vit qu'à un seul endroit.
//
// LES TROIS COUCHES sont séparées parce que l'animation les sépare : la
// couronne apparaît d'abord, le nom et la ligne s'écrivent ensuite. Un PNG
// unique ne permettrait ni l'un ni l'autre. Elles partagent le même cadre de
// 200×200 unités, donc elles se superposent sans calage.

import 'package:flutter/material.dart';

class CouleursChap {
  /// Le vert du drapeau ivoirien : la couronne, les aplats.
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

/// Les trois images du signe, dans le cadre commun de 200×200.
class _Couches {
  static const couronne = 'assets/marque/demarrage_couronne.png';
  static const mot = 'assets/marque/demarrage_mot.png';
  static const ligne = 'assets/marque/demarrage_ligne.png';

  /// Où vivent les lettres dans ce cadre, en fraction de la hauteur :
  /// le nom court de 0,39 à 0,57 (tracés Kaushan, translate(56.6 103)), la
  /// ligne de 0,59 à 0,62 (translate(52.1 122)). La fenêtre d'écriture part
  /// donc juste au-dessus et finit juste en dessous.
  static const hautTexte = 0.36;
  static const basTexte = 0.66;
}

/// Le signe seul, à poser dans l'interface (en-tête de l'accueil…).
///
/// Sert la version COMPACTE — sans la ligne « Achat, Vente, Emplois, Chap » :
/// sous 40 px ses vingt-sept caractères tiendraient dans huit pixels et ne
/// seraient plus qu'une salissure. Le site applique le même seuil.
class SigneChap extends StatelessWidget {
  final double taille;

  /// `null` (défaut) = la couronne verte et le nom blanc, pour un fond clair.
  /// Passer [CouleursChap.papier] sert la variante inverse, pour un fond vert.
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
  // La partition, sur 1 800 ms (le fondu final vers l'accueil, 240 ms, est
  // assuré par `_Lancement` dans main.dart via `auTerme`) :
  //     0 →  560   LA TACHE VERTE : la couronne naît au centre et s'ouvre
  //   120 →  760   … son halo s'épanouit derrière elle, puis s'éteint
  //   560 → 1120   LES LETTRES S'ÉCRIVENT, de haut en bas
  //   660 → 1240   … ET RAYONNENT : un éclat descend le long des lettres
  //  1260 → 1560   tout bat une seule fois
  //  1560 → 1800   tenue brève, puis l'app s'ouvre
  static const int _dureeMs = 1800;

  // Les courbes fortes du studio : une entrée démarre vite (sortie franche),
  // un aller-retour accélère puis freine (dedans).
  static const Cubic _sortie = Cubic(0.23, 1, 0.32, 1);
  static const Cubic _dedans = Cubic(0.77, 0, 0.175, 1);

  late final AnimationController _controleur;
  late final Animation<double> _tacheEchelle;
  late final Animation<double> _tacheOpacite;
  late final Animation<double> _haloOpacite;
  late final Animation<double> _haloEchelle;
  late final Animation<double> _ecrit;
  late final Animation<double> _eclatY;
  late final Animation<double> _eclatOpacite;
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

    // 1. LA TACHE VERTE. Elle ne surgit pas à sa taille : elle s'ouvre depuis
    //    un point, en freinant à l'arrivée — le geste d'une chose qui pousse,
    //    pas d'une chose qu'on colle. L'opacité la précède de peu, sinon le
    //    premier rendu montre un point dur.
    _tacheEchelle =
        Tween<double>(begin: 0.34, end: 1.0).animate(_entre(0, 560, _sortie));
    _tacheOpacite = _entre(0, 220);

    // 2. Le halo : monte vite, s'éteint en grandissant. C'est lui qui donne
    //    à la couronne l'air d'émettre plutôt que d'être posée.
    _haloOpacite = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.0, end: 0.60)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 32),
      TweenSequenceItem(
          tween: Tween(begin: 0.60, end: 0.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 68),
    ]).animate(_entre(120, 760));
    _haloEchelle = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 0.52, end: 1.0)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 32),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.34), weight: 68),
    ]).animate(_entre(120, 760));

    // 3. LES LETTRES S'ÉCRIVENT : une fenêtre s'ouvre vers le bas sur les
    //    deux couches de texte. Le nom apparaît d'abord, la ligne ensuite —
    //    c'est leur place dans le dessin qui donne l'ordre, rien d'autre.
    _ecrit = _entre(560, 1120, _dedans);

    // 4. … ET RAYONNENT : l'éclat descend le long des lettres, un peu en
    //    avance sur l'écriture, comme la pointe qui trace.
    _eclatY = Tween<double>(begin: -0.36, end: 0.42)
        .animate(_entre(660, 1240, _dedans));
    // Mesuré sur pellicule : à 0,80 l'éclat ne rayonnait pas, il POSAIT une
    // bande claire en travers du disque — on aurait dit un défaut d'impression.
    // 0,45 sur une ellipse plus haute et plus floue le rend à ce qu'il doit
    // être : un reflet qui passe.
    _eclatOpacite = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.48), weight: 25),
      TweenSequenceItem(tween: ConstantTween(0.45), weight: 45),
      TweenSequenceItem(tween: Tween(begin: 0.45, end: 0.0), weight: 30),
    ]).animate(_entre(660, 1240));

    // 5. Tout bat une seule fois — couronne et lettres ensemble.
    _battement = TweenSequence<double>([
      TweenSequenceItem(
          tween: Tween(begin: 1.0, end: 1.045).chain(CurveTween(curve: _dedans)),
          weight: 42),
      TweenSequenceItem(
          tween: Tween(begin: 1.045, end: 1.0).chain(CurveTween(curve: _dedans)),
          weight: 58),
    ]).animate(_entre(1260, 1560));

    // 6. Et l'app s'ouvre : au terme, l'accueil prend la suite par un fondu
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
    // le fond du splash natif sauter au clair au premier rendu.
    final sombre = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    final fond = sombre ? CouleursChap.encre : CouleursChap.papier;

    // Le signe occupe 62 % de la largeur, plafonné à 232 : sur un petit
    // téléphone il respire, sur une tablette il ne devient pas une affiche.
    final large = MediaQuery.sizeOf(context).width;
    final cote = (large * 0.62).clamp(160.0, 232.0);

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
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  // Le halo, derrière tout — il déborde du cadre, d'où le
                  // `Clip.none` : borné, il ferait un carré lumineux.
                  Transform.scale(
                    scale: _haloEchelle.value,
                    child: Opacity(
                      opacity: _haloOpacite.value.clamp(0, 1).toDouble(),
                      child: Container(
                        width: cote * 1.5,
                        height: cote * 1.5,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              Color(0x8C009E60), // le vert à 55 %
                              Color(0x38009E60), // … à 22 %
                              Color(0x00009E60),
                            ],
                            stops: [0, 0.36, 0.66],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // 1. LA TACHE VERTE : la couronne.
                  Opacity(
                    opacity: _tacheOpacite.value.clamp(0, 1).toDouble(),
                    child: Transform.scale(
                      scale: _tacheEchelle.value,
                      child: Image.asset(_Couches.couronne,
                          width: cote, height: cote),
                    ),
                  ),

                  // 2. LES LETTRES, révélées de haut en bas. Les deux couches
                  //    sont dans le même cadre que la couronne : elles se
                  //    posent à leur place sans le moindre calage.
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

                  // 3. L'ÉCLAT qui descend le long des lettres.
                  Align(
                    alignment: Alignment(0, _eclatY.value),
                    child: Opacity(
                      opacity: _eclatOpacite.value.clamp(0, 1).toDouble(),
                      child: Container(
                        width: cote * 0.74,
                        height: cote * 0.22,
                        decoration: const BoxDecoration(
                          gradient: RadialGradient(
                            colors: [Color(0x8CFFFFFF), Color(0x00FFFFFF)],
                            stops: [0, 0.62],
                          ),
                        ),
                      ),
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
