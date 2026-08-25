import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/geo.dart';
import '../api/models.dart';
import '../data/categories.dart';
import '../data/coords.dart';
import '../data/formulaires/registre.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/listing_card.dart';
import 'listing_detail_screen.dart';

/// Explorer — recherche et filtres sur les annonces.
///
/// On charge toutes les annonces une fois, puis on filtre CÔTÉ APP (mot-clé,
/// catégorie, état, commune, tri). À la taille actuelle du catalogue c'est
/// instantané ; quand il grandira, on passera la recherche côté serveur.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});
  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  late Future<List<Listing>> _futur;
  final _rechCtrl = TextEditingController();

  String _recherche = '';
  String? _categorie; // null = toutes
  String _condition = 'tous'; // tous | neuf | occasion
  String? _commune; // null = toutes
  String _tri = 'recent'; // recent | prixAsc | prixDesc | proche
  Coords? _position; // position de l'utilisateur (tri « Près de moi »)
  bool _localisation = false; // lecture GPS en cours

  @override
  void initState() {
    super.initState();
    _futur = Listing.toutes();
  }

  @override
  void dispose() {
    _rechCtrl.dispose();
    super.dispose();
  }

  Future<void> _recharger() async {
    setState(() => _futur = Listing.toutes());
    await _futur;
  }

  /// Active le tri « Près de moi » : lit la position GPS (à la demande, jamais
  /// au démarrage — l'autorisation n'est demandée que si l'utilisateur choisit
  /// ce tri), puis retrie par distance. Un refus revient au tri récent avec un
  /// message clair.
  Future<void> _activerProximite() async {
    if (_localisation) return;
    setState(() => _localisation = true);
    try {
      final fix = await getBestPosition();
      if (!mounted) return;
      setState(() {
        _position = fix.coords;
        _tri = 'proche';
        _localisation = false;
      });
    } on GeoRefus catch (e) {
      if (!mounted) return;
      setState(() {
        _localisation = false;
        if (_position == null) _tri = 'recent';
      });
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _localisation = false;
        if (_position == null) _tri = 'recent';
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr(context, 'expl.posIntrouvable'))));
    }
  }

  // Minuscule + sans accents, pour une recherche indulgente.
  String _plat(String s) {
    s = s.toLowerCase();
    const acc = {
      'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a',
      'ç': 'c', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'î': 'i', 'ï': 'i', 'í': 'i', 'ì': 'i',
      'ô': 'o', 'ö': 'o', 'ó': 'o', 'ò': 'o', 'õ': 'o',
      'û': 'u', 'ü': 'u', 'ú': 'u', 'ù': 'u',
    };
    acc.forEach((a, b) => s = s.replaceAll(a, b));
    return s;
  }

  List<String> _communes(List<Listing> toutes) {
    final set = <String>{};
    for (final a in toutes) {
      if (a.commune != null && a.commune!.trim().isNotEmpty) set.add(a.commune!);
    }
    final list = set.toList()..sort();
    return list;
  }

  /// Le filtre Neuf/Occasion n'a de sens que pour une catégorie qui propose un
  /// état. On le cache sur « Toutes » (mélange de catégories) et sur celles
  /// sans neuf/occasion (Alimentation, Emploi, Voyage…), comme sur le site où
  /// l'état se règle par catégorie.
  bool get _montrerEtat => _categorie != null && categorieAEtat(_categorie!);

  List<Listing> _filtrer(List<Listing> toutes) {
    final q = _plat(_recherche.trim());
    var r = toutes.where((a) {
      if (a.sold) return false;
      if (_categorie != null && a.categoryId != _categorie) return false;
      if (_montrerEtat && _condition != 'tous' && a.condition != _condition) {
        return false;
      }
      if (_commune != null && a.commune != _commune) return false;
      if (q.isNotEmpty) {
        final texte = _plat('${a.title} ${a.description}');
        if (!texte.contains(q)) return false;
      }
      return true;
    }).toList();

    switch (_tri) {
      case 'proche':
        if (_position != null) {
          final o = _position!;
          double d(Listing l) {
            final p = l.position;
            // Une annonce sans position connue part à la fin, pas au hasard.
            return p == null ? double.infinity : distanceKm(o, p);
          }

          r.sort((a, b) => d(a).compareTo(d(b)));
        } else {
          r.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        }
        break;
      case 'prixAsc':
        r.sort((a, b) => a.prixAffiche.compareTo(b.prixAffiche));
        break;
      case 'prixDesc':
        r.sort((a, b) => b.prixAffiche.compareTo(a.prixAffiche));
        break;
      default:
        r.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    }
    return r;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'nav.explorer'))),
      body: FutureBuilder<List<Listing>>(
        future: _futur,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(
                child: CircularProgressIndicator(color: ChapColors.orange));
          }
          if (snap.hasError) {
            return _Message(
              icone: Icons.wifi_off_rounded,
              titre: tr(context, 'expl.chargeErreur'),
              detail: snap.error is ApiException
                  ? (snap.error as ApiException).message
                  : tr(context, 'expl.verifConnexion'),
              action: _recharger,
            );
          }
          final toutes = snap.data ?? const <Listing>[];
          final communes = _communes(toutes);
          final resultats = _filtrer(toutes);

          return Column(
            children: [
              _barreRecherche(),
              _chipsCategories(),
              _ligneFiltres(communes),
              _compteur(resultats.length),
              Expanded(
                child: RefreshIndicator(
                  color: ChapColors.orange,
                  onRefresh: _recharger,
                  child: resultats.isEmpty
                      ? _Message(
                          icone: Icons.search_off_rounded,
                          titre: tr(context, 'expl.aucuneCorrespond'),
                          detail: tr(context, 'expl.elargir'),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
                          physics: const AlwaysScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 220,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.66,
                          ),
                          itemCount: resultats.length,
                          itemBuilder: (context, i) => ListingCard(
                            annonce: resultats[i],
                            origine: _position,
                            onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(
                                    builder: (_) => ListingDetailScreen(
                                        annonce: resultats[i]))),
                          ),
                        ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _barreRecherche() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
      child: TextField(
        controller: _rechCtrl,
        onChanged: (v) => setState(() => _recherche = v),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: tr(context, 'home.recherche'),
          prefixIcon: const Icon(Icons.search),
          isDense: true,
          suffixIcon: _recherche.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    _rechCtrl.clear();
                    setState(() => _recherche = '');
                  },
                ),
        ),
      ),
    );
  }

  Widget _chipsCategories() {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          // Changer de catégorie remet l'état à « Tous » : la sélection
          // neuf/occasion est propre à chaque catégorie, elle ne se traîne pas.
          _chip(tr(context, 'expl.toutes'), _categorie == null,
              () => setState(() {
                    _categorie = null;
                    _condition = 'tous';
                  })),
          for (final c in categories)
            _chip('${c.emoji} ${c.nom}', _categorie == c.id,
                () => setState(() {
                      _categorie = c.id;
                      _condition = 'tous';
                    })),
        ],
      ),
    );
  }

  Widget _chip(String texte, bool actif, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(texte),
        selected: actif,
        onSelected: (_) => onTap(),
        showCheckmark: false,
        labelStyle: TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.w600,
          color: actif ? Colors.white : ChapColors.gray700,
        ),
        selectedColor: ChapColors.orange,
        backgroundColor: ChapColors.cream,
        side: const BorderSide(color: ChapColors.line2),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  Widget _ligneFiltres(List<String> communes) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 2, 12, 4),
      child: Row(
        children: [
          // État : Tous / Neuf / Occasion — seulement pour les catégories qui
          // ont un neuf/occasion (voir _montrerEtat).
          if (_montrerEtat) ...[
            Expanded(
              child: SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                      value: 'tous', label: Text(tr(context, 'expl.tous'))),
                  ButtonSegment(
                      value: 'neuf', label: Text(tr(context, 'cond.neuf'))),
                  ButtonSegment(
                      value: 'occasion',
                      label: Text(tr(context, 'cond.occasion'))),
                ],
                selected: {_condition},
                onSelectionChanged: (s) =>
                    setState(() => _condition = s.first),
                style: const ButtonStyle(visualDensity: VisualDensity.compact),
                showSelectedIcon: false,
              ),
            ),
            const SizedBox(width: 8),
          ] else
            const Spacer(),
          _menuFiltres(communes),
        ],
      ),
    );
  }

  Widget _menuFiltres(List<String> communes) {
    return IconButton(
      tooltip: tr(context, 'expl.communeTri'),
      icon: Badge(
        isLabelVisible: _commune != null || _tri != 'recent',
        smallSize: 8,
        backgroundColor: ChapColors.orange,
        child: const Icon(Icons.tune, color: ChapColors.gray700),
      ),
      onPressed: () => _ouvrirFiltres(communes),
    );
  }

  void _ouvrirFiltres(List<String> communes) {
    showModalBottomSheet(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheet) {
            void maj(VoidCallback f) {
              setSheet(f);
              setState(f);
            }

            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr(context, 'expl.filtres'),
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Text(tr(context, 'expl.commune'),
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: ChapColors.gray700)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String?>(
                    initialValue: _commune,
                    isExpanded: true,
                    decoration: const InputDecoration(isDense: true),
                    items: [
                      DropdownMenuItem(
                          value: null,
                          child: Text(tr(context, 'expl.toutesCommunes'))),
                      for (final c in communes)
                        DropdownMenuItem(value: c, child: Text(c)),
                    ],
                    onChanged: (v) => maj(() => _commune = v),
                  ),
                  const SizedBox(height: 16),
                  Text(tr(context, 'expl.trierPar'),
                      style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: ChapColors.gray700)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _tri,
                    isExpanded: true,
                    decoration: const InputDecoration(isDense: true),
                    items: [
                      DropdownMenuItem(
                          value: 'recent',
                          child: Text(tr(context, 'expl.plusRecentes'))),
                      DropdownMenuItem(
                          value: 'proche',
                          child: Text(tr(context, 'expl.presDeMoi'))),
                      DropdownMenuItem(
                          value: 'prixAsc',
                          child: Text(tr(context, 'expl.prixCroissant'))),
                      DropdownMenuItem(
                          value: 'prixDesc',
                          child: Text(tr(context, 'expl.prixDecroissant'))),
                    ],
                    onChanged: (v) {
                      final val = v ?? 'recent';
                      // « Près de moi » sans position encore lue : on ferme la
                      // feuille et on demande le GPS (le tri s'applique ensuite).
                      if (val == 'proche' && _position == null) {
                        Navigator.pop(context);
                        _activerProximite();
                        return;
                      }
                      maj(() => _tri = val);
                    },
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text(tr(context, 'expl.voirResultats')),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _compteur(int n) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 2, 16, 4),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          _localisation
              ? tr(context, 'expl.localisation')
              : (n == 0
                  ? tr(context, 'expl.aucunResultat')
                  : '$n ${tr(context, n > 1 ? 'expl.annonceN' : 'expl.annonce1')}'),
          style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: ChapColors.gray600),
        ),
      ),
    );
  }
}

/// Bloc d'état plein écran (erreur / vide), avec « Réessayer » facultatif.
class _Message extends StatelessWidget {
  final IconData icone;
  final String titre;
  final String detail;
  final Future<void> Function()? action;
  const _Message({
    required this.icone,
    required this.titre,
    required this.detail,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.12),
        Icon(icone, size: 48, color: ChapColors.line2),
        const SizedBox(height: 12),
        Text(titre,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: ChapColors.gray900)),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: Text(detail,
              textAlign: TextAlign.center,
              style: const TextStyle(color: ChapColors.gray600)),
        ),
        if (action != null) ...[
          const SizedBox(height: 18),
          Center(
            child: SizedBox(
              width: 180,
              child: ElevatedButton(
                  onPressed: () => action!(),
                  child: Text(tr(context, 'action.reessayer'))),
            ),
          ),
        ],
      ],
    );
  }
}
