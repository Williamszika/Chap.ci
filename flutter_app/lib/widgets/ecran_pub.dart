import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/models.dart';
import '../api/pub.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// L'écran publicitaire de l'accueil — la bannière noire du site, portée dans
/// l'app. Affiche les publicités actives en rotation (chacune 45 s), le texte
/// dans son style et **animé** ; compte une vue par pub ; ouvre le lien au clic.
/// Sans pub, l'écran fait sa propre réclame.
class EcranPub extends StatefulWidget {
  /// Aperçu (captures / tests) : pubs fournies, sans réseau ni rotation.
  final List<Pub>? apercu;

  /// Démo (vidéo) : force la rotation en mode aperçu, à ce rythme, pour montrer
  /// l'enchaînement des styles et des animations. Sans effet hors aperçu.
  final Duration? demoRotation;
  const EcranPub({super.key, this.apercu, this.demoRotation});
  @override
  State<EcranPub> createState() => _EcranPubState();
}

class _EcranPubState extends State<EcranPub> {
  List<Pub> _pubs = const [];
  int _idx = 0;
  final Set<String> _vues = {};
  Timer? _rotation;
  Timer? _rafraichi;
  bool _charge = false;

  bool get _apercu => widget.apercu != null;

  @override
  void initState() {
    super.initState();
    if (_apercu) {
      _pubs = widget.apercu!;
      _charge = true;
      _compterVue();
      if (widget.demoRotation != null && _pubs.length > 1) {
        _rotation = Timer.periodic(widget.demoRotation!, (_) {
          if (!mounted) return;
          setState(() => _idx = (_idx + 1) % _pubs.length);
        });
      }
    } else {
      _charger();
      _rafraichi = Timer.periodic(const Duration(seconds: 120), (_) => _charger());
    }
  }

  @override
  void didUpdateWidget(EcranPub old) {
    super.didUpdateWidget(old);
    // Aperçu (captures / tests) : une nouvelle liste remplace l'ancienne.
    if (_apercu && !identical(widget.apercu, old.apercu)) {
      setState(() {
        _pubs = widget.apercu!;
        _idx = 0;
      });
    }
  }

  @override
  void dispose() {
    _rotation?.cancel();
    _rafraichi?.cancel();
    super.dispose();
  }

  Future<void> _charger() async {
    try {
      final list = await PubApi.actives();
      if (!mounted) return;
      // On ne remélange que si l'ensemble a changé (une pub expire, une arrive).
      String sig(List<Pub> l) => (l.map((p) => p.id).toList()..sort()).join(',');
      if (sig(list) == sig(_pubs) && _charge) return;
      list.shuffle(math.Random());
      setState(() {
        _pubs = list;
        _idx = 0;
        _charge = true;
      });
      _armerRotation();
      _compterVue();
    } catch (_) {
      if (mounted) setState(() => _charge = true);
    }
  }

  void _armerRotation() {
    _rotation?.cancel();
    if (_pubs.length < 2) return;
    _rotation = Timer.periodic(const Duration(seconds: 45), (_) {
      if (!mounted) return;
      setState(() => _idx = (_idx + 1) % _pubs.length);
      _compterVue();
    });
  }

  void _compterVue() {
    if (_apercu || _pubs.isEmpty) return;
    final p = _pubs[_idx % _pubs.length];
    if (_vues.add(p.id)) PubApi.tracker(p.id, 'view');
  }

  Future<void> _ouvrir(Pub p) async {
    if (!_apercu) PubApi.tracker(p.id, 'click');
    final url = p.lien ?? 'https://chap.ci/#/pub/${p.id}';
    final uri = Uri.tryParse(url);
    if (uri == null || _apercu) return;
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {/* pas de navigateur disponible : on n'insiste pas */}
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          height: 200,
          width: double.infinity,
          color: Colors.black,
          child: !_charge
              ? const SizedBox()
              : (_pubs.isEmpty ? _autoPromo() : _pub(_pubs[_idx % _pubs.length])),
        ),
      ),
    );
  }

  Widget _pub(Pub p) {
    return GestureDetector(
      onTap: () => _ouvrir(p),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (p.image != null) _image(p.image!),
          // Voile pour la lisibilité du texte, sans noyer l'image.
          if (p.aTexte)
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Color(0x73000000), Color(0x0D000000), Color(0x33000000)],
                ),
              ),
            ),
          if (p.aTexte)
            _contenuTexte(p)
          else
            Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: _pastillePub(),
              ),
            ),
          if (_pubs.length > 1)
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _points(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _image(String source) {
    final src = ImageSource.resoudre(source);
    if (src.bytes != null) {
      return Image.memory(src.bytes!, fit: BoxFit.cover);
    }
    if (src.url != null) {
      return Image.network(src.url!,
          fit: BoxFit.cover, errorBuilder: (_, __, ___) => const SizedBox());
    }
    return const SizedBox();
  }

  Widget _contenuTexte(Pub p) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 34),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (p.titre.trim().isNotEmpty)
            _TexteAnimePub(
              // La clé force le remontage à chaque rotation : l'animation rejoue.
              key: ValueKey('titre-${p.id}'),
              texte: p.titre,
              style: p.style,
              couleur: p.couleurTexte,
              anims: p.anims,
              gapSecondes: p.animGap,
              loop: p.animLoop,
            ),
          if (p.description.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              p.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                height: 1.35,
                fontWeight: FontWeight.w600,
                color: _couleur(p.couleurTexte) ?? const Color(0xE6FFFFFF),
                shadows: const [Shadow(color: Color(0x8C000000), blurRadius: 10)],
              ),
            ),
          ],
          if (p.lien != null) ...[
            const SizedBox(height: 12),
            _boutonSavoirPlus(),
          ],
        ],
      ),
    );
  }

  Widget _boutonSavoirPlus() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(tr(context, 'ecpub.savoirPlus'),
                style: const TextStyle(
                    color: ChapColors.ink, fontWeight: FontWeight.bold, fontSize: 13.5)),
            const SizedBox(width: 6),
            const Icon(Icons.arrow_forward, size: 15, color: ChapColors.ink),
          ],
        ),
      );

  Widget _pastillePub() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0x73000000),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.campaign, size: 12, color: Color(0xD9FFFFFF)),
            SizedBox(width: 4),
            Text('PUBLICITÉ',
                style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 1,
                    fontWeight: FontWeight.bold,
                    color: Color(0xD9FFFFFF))),
          ],
        ),
      );

  Widget _points() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < _pubs.length; i++)
          GestureDetector(
            onTap: () => setState(() => _idx = i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 6,
              width: i == _idx % _pubs.length ? 20 : 6,
              decoration: BoxDecoration(
                color: i == _idx % _pubs.length ? Colors.white : const Color(0x66FFFFFF),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          ),
      ],
    );
  }

  Widget _autoPromo() {
    return Stack(
      fit: StackFit.expand,
      children: [
        Center(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _pastillePub(),
                const SizedBox(height: 10),
                Text(tr(context, 'ecpub.votrePub'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 6),
                Text(
                  tr(context, 'ecpub.detail'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 13, height: 1.3, color: Color(0xB3FFFFFF)),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final uri = Uri.tryParse('https://chap.ci/#/publicite');
                    if (uri != null && !_apercu) {
                      try {
                        await launchUrl(uri, mode: LaunchMode.externalApplication);
                      } catch (_) {}
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(tr(context, 'ecpub.faire'),
                        style: const TextStyle(
                            color: ChapColors.ink,
                            fontWeight: FontWeight.bold,
                            fontSize: 13.5)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  static Color? _couleur(String? hex) => _parseHex(hex);
}

/// Convertit « #RRGGBB » (ou « RRGGBB ») en [Color]. `null` si invalide.
Color? _parseHex(String? hex) {
  if (hex == null) return null;
  var h = hex.trim().replaceAll('#', '');
  if (h.length == 6) h = 'FF$h';
  if (h.length != 8) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(v);
}

/// Le titre d'une publicité, dans son **style** (classique, impact, néon,
/// élégant, ivoire) et **animé** : les animations choisies s'enchaînent, chacune
/// une fois, séparées par une pause, en boucle. En « mouvement réduit », le
/// texte reste simplement affiché.
class _TexteAnimePub extends StatefulWidget {
  final String texte;
  final String? style, couleur;
  final List<String> anims;
  final int gapSecondes;
  final bool loop;
  const _TexteAnimePub({
    super.key,
    required this.texte,
    required this.style,
    required this.couleur,
    required this.anims,
    required this.gapSecondes,
    required this.loop,
  });
  @override
  State<_TexteAnimePub> createState() => _TexteAnimePubState();
}

class _TexteAnimePubState extends State<_TexteAnimePub>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  int _step = 0;
  Timer? _pause;
  bool _demarre = false;

  List<String> get _anims => widget.anims.isNotEmpty ? widget.anims : const ['fondu'];

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _ctrl.addStatusListener((s) {
      if (s != AnimationStatus.completed || !widget.loop || !mounted) return;
      _pause?.cancel();
      _pause = Timer(Duration(seconds: widget.gapSecondes), () {
        if (!mounted) return;
        setState(() => _step++);
        _ctrl.forward(from: 0);
      });
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_demarre) return;
    _demarre = true;
    // Respecte « mouvement réduit » : texte fixe, sans animation ni minuterie.
    if (!MediaQuery.of(context).disableAnimations) {
      _ctrl.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _pause?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (MediaQuery.of(context).disableAnimations) {
      return _texte(widget.texte);
    }
    final anim = _anims[_step % _anims.length];
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => _appliquer(anim, _ctrl.value),
    );
  }

  // — Le texte, dans son style —
  Widget _texte(String contenu) {
    final couleur = _parseHex(widget.couleur);
    final style = widget.style ?? 'classique';
    var texte = contenu;
    var famille = 'Roboto';
    var italique = false;
    var espacement = 0.0;
    List<Shadow>? ombres;
    Color remplissage = couleur ?? Colors.white;

    switch (style) {
      case 'impact':
        texte = contenu.toUpperCase();
        espacement = -0.4;
        break;
      case 'script':
        italique = true;
        famille = 'serif';
        break;
      case 'neon':
        // Un néon est CHAUD, et il l'était déjà : les trois halos étaient
        // orange. Deux passaient par `ChapColors.orange` et sont devenus verts
        // le 30/08, le troisième était écrit en dur — le style rendait deux
        // auréoles vertes autour d'une orange. Les trois repassent à l'orange.
        ombres = const [
          Shadow(color: ChapColors.actionVif, blurRadius: 6),
          Shadow(color: ChapColors.actionVif, blurRadius: 18),
          Shadow(color: Color(0xA6F77F00), blurRadius: 34),
        ];
        break;
      case 'ivoire':
        // Dégradé drapeau (orange → blanc → vert), sauf couleur imposée.
        //
        // ⚠️ NE PAS repasser par `ChapColors.orange` : il vaut #009E60 depuis
        // le 30/08. Ce dégradé sortait « vert, blanc, vert » — exactement ce
        // que le Patron a reproché au site le même jour, reproduit ici dans le
        // composeur de publicité. Le drapeau se peint avec les rôles, pas avec
        // les anciens noms.
        if (couleur == null) {
          return ShaderMask(
            shaderCallback: (r) => const LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [ChapColors.actionVif, Colors.white, ChapColors.marque],
              stops: [0.15, 0.5, 0.85],
            ).createShader(r),
            child: _brut(texte, Colors.white, famille, italique, espacement, null),
          );
        }
        break;
    }
    return _brut(texte, remplissage, famille, italique, espacement, ombres);
  }

  Widget _brut(String texte, Color couleur, String famille, bool italique,
          double espacement, List<Shadow>? ombres) =>
      Text(
        texte,
        textAlign: TextAlign.center,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 24,
          height: 1.15,
          fontWeight: FontWeight.w800,
          fontFamily: famille,
          fontStyle: italique ? FontStyle.italic : FontStyle.normal,
          letterSpacing: espacement,
          color: couleur,
          shadows: ombres,
        ),
      );

  // — L'animation : (clé, t ∈ [0,1]) → widget transformé —
  Widget _appliquer(String cle, double t) {
    double c(Curve cu) => cu.transform(t.clamp(0.0, 1.0));
    double lerp(double a, double b, double x) => a + (b - a) * x;
    Widget fade(double o, Widget w) => Opacity(opacity: o.clamp(0.0, 1.0), child: w);
    Widget dep(double dx, double dy, Widget w) =>
        Transform.translate(offset: Offset(dx, dy), child: w);
    Widget ech(double s, Widget w) => Transform.scale(scale: s, child: w);
    Widget tourne(double r, Widget w) => Transform.rotate(angle: r, child: w);

    // La machine à écrire révèle le texte lettre par lettre.
    if (cle == 'machine') {
      final n = (t.clamp(0.0, 1.0) * widget.texte.length).ceil();
      return _texte(widget.texte.substring(0, n.clamp(0, widget.texte.length)));
    }

    final plein = _texte(widget.texte);

    switch (cle) {
      case 'fondu':
      case 'apparition':
      case 'balayage':
      case 'surligne':
        return fade(t, plein);
      case 'fondu-haut':
        return fade(c(Curves.easeOut), dep(0, -18 * (1 - c(Curves.easeOut)), plein));
      case 'fondu-bas':
        return fade(c(Curves.easeOut), dep(0, 18 * (1 - c(Curves.easeOut)), plein));
      case 'fondu-gauche':
        return fade(c(Curves.easeOut), dep(-24 * (1 - c(Curves.easeOut)), 0, plein));
      case 'fondu-droite':
        return fade(c(Curves.easeOut), dep(24 * (1 - c(Curves.easeOut)), 0, plein));
      case 'glissement':
      case 'leve':
        return fade(c(Curves.easeOutCubic), dep(0, 34 * (1 - c(Curves.easeOutCubic)), plein));
      case 'glissement-bas':
      case 'plonge':
        return fade(c(Curves.easeOutCubic), dep(0, -34 * (1 - c(Curves.easeOutCubic)), plein));
      case 'glissement-gauche':
        return fade(c(Curves.easeOutCubic), dep(-44 * (1 - c(Curves.easeOutCubic)), 0, plein));
      case 'glissement-droite':
      case 'defilement':
        return fade(c(Curves.easeOutCubic), dep(44 * (1 - c(Curves.easeOutCubic)), 0, plein));
      case 'zoom':
      case 'fonduechelle':
        return fade(c(Curves.easeOut), ech(lerp(0.6, 1, c(Curves.easeOut)), plein));
      case 'zoom-arriere':
        return fade(c(Curves.easeOut), ech(lerp(1.3, 1, c(Curves.easeOut)), plein));
      case 'zoom-haut':
        return fade(c(Curves.easeOut),
            dep(0, -16 * (1 - c(Curves.easeOut)), ech(lerp(0.7, 1, c(Curves.easeOut)), plein)));
      case 'zoom-bas':
        return fade(c(Curves.easeOut),
            dep(0, 16 * (1 - c(Curves.easeOut)), ech(lerp(0.7, 1, c(Curves.easeOut)), plein)));
      case 'pop':
      case 'estampe':
        return fade(t.clamp(0.0, 1.0), ech(lerp(0.5, 1, c(Curves.easeOutBack)), plein));
      case 'ressort':
      case 'rebond':
      case 'rebond-haut':
        return fade(t.clamp(0.0, 1.0), ech(lerp(0.4, 1, c(Curves.elasticOut)), plein));
      case 'tada':
        return ech(1 + 0.12 * math.sin(t * math.pi * 3) * (1 - t), plein);
      case 'pulse':
      case 'battement':
        return ech(1 + 0.09 * math.sin(t * math.pi * (cle == 'battement' ? 4 : 2)), plein);
      case 'clignote':
      case 'neon':
        return fade(0.35 + 0.65 * (0.5 + 0.5 * math.sin(t * math.pi * 6)), plein);
      case 'secousse':
      case 'tremble':
      case 'glitch':
        return dep(8 * math.sin(t * math.pi * 8) * (1 - t * 0.3), 0, plein);
      case 'oscille':
      case 'balance':
      case 'balancier':
      case 'vacille':
        return tourne(0.12 * math.sin(t * math.pi * 4) * (1 - t), plein);
      case 'rotation':
      case 'pivot':
      case 'roulement':
        return fade(t.clamp(0.0, 1.0), tourne((1 - c(Curves.easeOut)) * math.pi * 0.5, plein));
      case 'tournoie':
        return fade(t.clamp(0.0, 1.0),
            ech(c(Curves.easeOut), tourne((1 - c(Curves.easeOut)) * math.pi * 2, plein)));
      case 'flipx':
      case 'bascule':
        return fade(t.clamp(0.0, 1.0),
            Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateX((1 - c(Curves.easeOut)) * math.pi / 2),
              child: plein,
            ));
      case 'flipy':
        return fade(t.clamp(0.0, 1.0),
            Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001)
                ..rotateY((1 - c(Curves.easeOut)) * math.pi / 2),
              child: plein,
            ));
      case 'jello':
        final sx = 1 + 0.14 * math.sin(t * math.pi * 6) * (1 - t);
        return Transform(
            alignment: Alignment.center,
            transform: Matrix4.diagonal3Values(sx, 2 - sx, 1),
            child: plein);
      case 'etirement':
        return fade(t.clamp(0.0, 1.0),
            Transform(
                alignment: Alignment.center,
                transform: Matrix4.diagonal3Values(lerp(1.6, 1, c(Curves.easeOut)), 1, 1),
                child: plein));
      case 'compression':
        return fade(t.clamp(0.0, 1.0),
            Transform(
                alignment: Alignment.center,
                transform: Matrix4.diagonal3Values(lerp(0.5, 1, c(Curves.easeOut)), 1, 1),
                child: plein));
      case 'flou':
      case 'flouzoom':
        final b = 8 * (1 - c(Curves.easeOut));
        final w = cle == 'flouzoom' ? ech(lerp(1.15, 1, c(Curves.easeOut)), plein) : plein;
        return fade(t.clamp(0.0, 1.0),
            ImageFiltered(imageFilter: ui.ImageFilter.blur(sigmaX: b, sigmaY: b), child: w));
      default:
        return fade(t, plein);
    }
  }
}
