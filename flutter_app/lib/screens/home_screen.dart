import 'package:flutter/material.dart';
import '../api/models.dart';
import '../api/pub.dart';
import '../ecran_demarrage.dart' show SigneChap;
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/cloche_notifs.dart';
import '../widgets/ecran_pub.dart';
import '../widgets/listing_card.dart';
import 'favoris_screen.dart';
import 'listing_detail_screen.dart';

/// Accueil — l'en-tête de marque, une barre de recherche (qui mène à Explorer),
/// **l'écran publicitaire** (bannière animée), et **toutes les annonces** en
/// défilement infini. C'est la première impression : elle doit charger vite et
/// parler ivoirien.
class HomeScreen extends StatefulWidget {
  /// Pour envoyer l'utilisateur vers l'onglet Explorer quand il touche la barre.
  final VoidCallback? onVoirTout;

  /// Aperçu (captures / tests) : annonces et pubs fournies, sans réseau.
  final List<Listing>? apercuAnnonces;
  final List<Pub>? apercuPubs;
  const HomeScreen({super.key, this.onVoirTout, this.apercuAnnonces, this.apercuPubs});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  /// Combien d'annonces on demande à chaque « page ». Petit = accueil léger et
  /// bon marché en data, même quand le catalogue grossit.
  static const int _pas = 20;

  final List<Listing> _annonces = [];
  final ScrollController _scroll = ScrollController();
  int _offset = 0;
  bool _chargeEnCours = false;
  bool _finCatalogue = false; // plus rien à charger
  bool _erreur = false; // le dernier chargement a échoué
  bool _premierFait = false; // la première page est arrivée (ou a échoué)

  @override
  void initState() {
    super.initState();
    if (widget.apercuAnnonces != null) {
      // Mode aperçu (captures / tests) : liste fournie, pas de réseau.
      _annonces.addAll(widget.apercuAnnonces!);
      _finCatalogue = true;
      _premierFait = true;
    } else {
      _scroll.addListener(_surDefilement);
      _chargerPlus();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  /// Quand il reste moins de 600 px avant le bas, on précharge la page suivante
  /// — l'utilisateur ne voit jamais le fond de la liste.
  void _surDefilement() {
    if (!_scroll.hasClients) return;
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 600) {
      _chargerPlus();
    }
  }

  Future<void> _chargerPlus() async {
    if (_chargeEnCours || _finCatalogue) return;
    setState(() {
      _chargeEnCours = true;
      _erreur = false;
    });
    try {
      final page = await Listing.page(offset: _offset, limit: _pas);
      if (!mounted) return;
      setState(() {
        _annonces.addAll(page);
        _offset += page.length;
        if (page.length < _pas) _finCatalogue = true; // page courte = fin
        _premierFait = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _erreur = true;
        _premierFait = true;
      });
    } finally {
      if (mounted) setState(() => _chargeEnCours = false);
    }
  }

  /// Tirer pour rafraîchir : on repart de la première page.
  Future<void> _rafraichir() async {
    setState(() {
      _annonces.clear();
      _offset = 0;
      _finCatalogue = false;
      _erreur = false;
      _premierFait = false;
    });
    await _chargerPlus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: ChapColors.orange,
          onRefresh: _rafraichir,
          child: CustomScrollView(
            controller: _scroll,
            slivers: [
              // En-tête : le signe « chap-chap » + le nom de marque
              // (« Chap » orange, « .ci » vert) — comme l'en-tête du site.
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                  child: Row(
                    children: [
                      const SigneChap(taille: 27),
                      const SizedBox(width: 8),
                      RichText(
                        text: const TextSpan(
                          style: TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w900),
                          children: [
                            // « Chap » en encre, « .ci » en vert — le
                            // verrouillage du site. Les deux morceaux
                            // passaient par des constantes devenues
                            // identiques : le nom sortait tout vert, à côté
                            // d'une couronne verte.
                            TextSpan(
                                text: 'Chap',
                                style: TextStyle(color: ChapColors.ink)),
                            TextSpan(
                                text: '.ci',
                                style: TextStyle(color: ChapColors.marque)),
                          ],
                        ),
                      ),
                      const Spacer(),
                      const ClocheNotifs(),
                      IconButton(
                        icon: const Icon(Icons.favorite_border,
                            color: ChapColors.gray700),
                        tooltip: tr(context, 'item.mesFavoris'),
                        onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => const FavorisScreen())),
                      ),
                    ],
                  ),
                ),
              ),
              // Barre de recherche (mène à Explorer pour l'instant).
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 10),
                  child: GestureDetector(
                    onTap: widget.onVoirTout,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 13),
                      decoration: BoxDecoration(
                        color: ChapColors.cream,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: ChapColors.line2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.search,
                              color: ChapColors.gray500, size: 20),
                          const SizedBox(width: 8),
                          Text(tr(context, 'home.recherche'),
                              style: const TextStyle(color: ChapColors.gray500)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              // L'écran publicitaire : la bannière animée, comme sur le site.
              SliverToBoxAdapter(child: EcranPub(apercu: widget.apercuPubs)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(tr(context, 'home.toutes'),
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: ChapColors.gray900)),
                      TextButton(
                        onPressed: widget.onVoirTout,
                        child: Text(tr(context, 'home.filtrer'),
                            style: const TextStyle(color: ChapColors.orangeDark)),
                      ),
                    ],
                  ),
                ),
              ),
              ..._corps(),
            ],
          ),
        ),
      ),
    );
  }

  /// Le corps sous l'en-tête : première page en cours, liste vide, ou la grille
  /// + son pied (chargement de la suite / réessayer).
  List<Widget> _corps() {
    // Première page pas encore arrivée : un grand indicateur (ou une erreur).
    if (!_premierFait) {
      return [
        const SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 60),
            child: Center(
                child: CircularProgressIndicator(color: ChapColors.orange)),
          ),
        ),
      ];
    }
    // Première page arrivée mais rien à montrer.
    if (_annonces.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 24),
            child: _erreur
                ? _blocErreur()
                : Text(
                    tr(context, 'home.vide'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: ChapColors.gray600),
                  ),
          ),
        ),
      ];
    }
    // La grille + le pied de liste.
    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 220,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.66,
          ),
          delegate: SliverChildBuilderDelegate(
            (context, i) {
              // Précharge la page suivante dès qu'on CONSTRUIT une carte proche
              // de la fin de la liste. Plus fiable que le calcul de position sur
              // une grille paresseuse (dont l'étendue n'est qu'estimée) : ici le
              // déclenchement suit exactement ce que Flutter est en train de
              // bâtir. `_chargerPlus` se garde contre les appels en double.
              if (i >= _annonces.length - 8) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) _chargerPlus();
                });
              }
              return ListingCard(
                annonce: _annonces[i],
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) =>
                        ListingDetailScreen(annonce: _annonces[i]))),
              );
            },
            childCount: _annonces.length,
          ),
        ),
      ),
      SliverToBoxAdapter(child: _pied()),
    ];
  }

  /// Pied de la liste : indicateur pendant qu'on charge la suite, bouton
  /// « Réessayer » si le dernier chargement a échoué, sinon un simple espace.
  Widget _pied() {
    if (_erreur) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        child: _blocErreur(),
      );
    }
    if (_chargeEnCours) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(0, 16, 0, 28),
        child: Center(
          child: SizedBox(
            height: 26,
            width: 26,
            child: CircularProgressIndicator(
                strokeWidth: 2.4, color: ChapColors.orange),
          ),
        ),
      );
    }
    // Fin du catalogue atteinte, ou en attente du prochain défilement.
    return const SizedBox(height: 24);
  }

  Widget _blocErreur() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(tr(context, 'home.erreur'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: ChapColors.gray600)),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: _chargerPlus,
          icon: const Icon(Icons.refresh, size: 18),
          label: Text(tr(context, 'action.reessayer')),
        ),
      ],
    );
  }
}
