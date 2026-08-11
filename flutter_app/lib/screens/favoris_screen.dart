import 'package:flutter/material.dart';
import '../api/models.dart';
import '../favoris.dart';
import '../theme.dart';
import '../widgets/listing_card.dart';
import 'listing_detail_screen.dart';

/// « Mes favoris » — les annonces mises en cœur. On charge le catalogue public
/// et on garde celles dont l'id est en favori. Retirer un cœur met la liste à
/// jour tout de suite (ListenableBuilder sur Favoris).
class FavorisScreen extends StatefulWidget {
  const FavorisScreen({super.key});
  @override
  State<FavorisScreen> createState() => _FavorisScreenState();
}

class _FavorisScreenState extends State<FavorisScreen> {
  late Future<List<Listing>> _futur;

  @override
  void initState() {
    super.initState();
    _futur = Listing.toutes();
  }

  Future<void> _recharger() async {
    setState(() => _futur = Listing.toutes());
    await _futur;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes favoris')),
      body: FutureBuilder<List<Listing>>(
        future: _futur,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(
                child: CircularProgressIndicator(color: ChapColors.orange));
          }
          final toutes = snap.data ?? const <Listing>[];
          return ListenableBuilder(
            listenable: Favoris.instance,
            builder: (context, _) {
              final favs = toutes
                  .where((a) => Favoris.instance.contient(a.id))
                  .toList();
              return RefreshIndicator(
                color: ChapColors.orange,
                onRefresh: _recharger,
                child: favs.isEmpty ? _vide() : _grille(favs),
              );
            },
          );
        },
      ),
    );
  }

  Widget _grille(List<Listing> favs) {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      physics: const AlwaysScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 220,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.66,
      ),
      itemCount: favs.length,
      itemBuilder: (context, i) => ListingCard(
        annonce: favs[i],
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => ListingDetailScreen(annonce: favs[i]))),
      ),
    );
  }

  Widget _vide() {
    return ListView(
      children: const [
        SizedBox(height: 120),
        Icon(Icons.favorite_border, size: 48, color: ChapColors.line2),
        SizedBox(height: 12),
        Text('Aucun favori pour l’instant',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: ChapColors.gray900)),
        SizedBox(height: 6),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Touchez le ♡ sur une annonce pour la retrouver ici.',
            textAlign: TextAlign.center,
            style: TextStyle(color: ChapColors.gray600),
          ),
        ),
      ],
    );
  }
}
