import 'package:flutter/material.dart';
import '../api/models.dart';
import '../api/pub.dart';
import '../theme.dart';
import '../widgets/cloche_notifs.dart';
import '../widgets/ecran_pub.dart';
import '../widgets/listing_card.dart';
import 'favoris_screen.dart';
import 'listing_detail_screen.dart';

/// Accueil — l'en-tête de marque, une barre de recherche (qui mène à Explorer),
/// **l'écran publicitaire** (bannière animée), et les dernières annonces. C'est
/// la première impression : elle doit charger vite et parler ivoirien.
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
  late Future<List<Listing>> _futur;

  @override
  void initState() {
    super.initState();
    _futur = widget.apercuAnnonces != null
        ? Future.value(widget.apercuAnnonces!)
        : Listing.toutes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: ChapColors.orange,
          onRefresh: () async {
            setState(() => _futur = Listing.toutes());
            await _futur;
          },
          child: CustomScrollView(
            slivers: [
              // En-tête : le nom de marque « Chap » orange + « .ci » vert.
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                  child: Row(
                    children: [
                      RichText(
                        text: const TextSpan(
                          style: TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w900),
                          children: [
                            TextSpan(
                                text: 'Chap',
                                style: TextStyle(color: ChapColors.orange)),
                            TextSpan(
                                text: '.ci',
                                style: TextStyle(color: ChapColors.green)),
                          ],
                        ),
                      ),
                      const Spacer(),
                      const ClocheNotifs(),
                      IconButton(
                        icon: const Icon(Icons.favorite_border,
                            color: ChapColors.gray700),
                        tooltip: 'Mes favoris',
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
                      child: const Row(
                        children: [
                          Icon(Icons.search, color: ChapColors.gray500, size: 20),
                          SizedBox(width: 8),
                          Text('Rechercher une annonce…',
                              style: TextStyle(color: ChapColors.gray500)),
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
                      const Text('Dernières annonces',
                          style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: ChapColors.gray900)),
                      TextButton(
                        onPressed: widget.onVoirTout,
                        child: const Text('Tout voir',
                            style: TextStyle(color: ChapColors.orangeDark)),
                      ),
                    ],
                  ),
                ),
              ),
              FutureBuilder<List<Listing>>(
                future: _futur,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 60),
                        child: Center(
                            child: CircularProgressIndicator(
                                color: ChapColors.orange)),
                      ),
                    );
                  }
                  final annonces = (snap.data ?? const <Listing>[])
                      .where((a) => !a.sold)
                      .take(8)
                      .toList();
                  if (annonces.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 50, horizontal: 24),
                        child: Text(
                          'Aucune annonce pour le moment. Revenez bientôt !',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: ChapColors.gray600),
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 220,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.66,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, i) => ListingCard(
                          annonce: annonces[i],
                          onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => ListingDetailScreen(
                                      annonce: annonces[i]))),
                        ),
                        childCount: annonces.length,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
