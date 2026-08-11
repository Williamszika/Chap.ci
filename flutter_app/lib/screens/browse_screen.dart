import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../theme.dart';
import '../widgets/listing_card.dart';

/// Explorer — la grille de toutes les annonces publiques.
///
/// Trois états explicites : chargement, erreur (avec « Réessayer »), et vide.
/// Un écran ne doit jamais laisser l'utilisateur devant du blanc sans un mot.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});
  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
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
      appBar: AppBar(title: const Text('Explorer')),
      body: RefreshIndicator(
        onRefresh: _recharger,
        color: ChapColors.orange,
        child: FutureBuilder<List<Listing>>(
          future: _futur,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(
                  child: CircularProgressIndicator(color: ChapColors.orange));
            }
            if (snap.hasError) {
              return _Message(
                icone: Icons.wifi_off_rounded,
                titre: 'Impossible de charger les annonces',
                detail: snap.error is ApiException
                    ? (snap.error as ApiException).message
                    : 'Vérifiez votre connexion.',
                action: _recharger,
              );
            }
            final annonces =
                (snap.data ?? const <Listing>[]).where((a) => !a.sold).toList();
            if (annonces.isEmpty) {
              return const _Message(
                icone: Icons.storefront_outlined,
                titre: 'Aucune annonce pour le moment',
                detail: 'Revenez bientôt — le catalogue grandit chaque semaine.',
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.all(12),
              physics: const AlwaysScrollableScrollPhysics(),
              gridDelegate:
                  const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 220,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.66,
              ),
              itemCount: annonces.length,
              itemBuilder: (context, i) => ListingCard(annonce: annonces[i]),
            );
          },
        ),
      ),
    );
  }
}

/// Bloc d'état plein écran (erreur / vide), avec bouton « Réessayer » facultatif.
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
    // ListView pour que le « pull-to-refresh » fonctionne même sur un écran vide.
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.18),
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
                  onPressed: () => action!(), child: const Text('Réessayer')),
            ),
          ),
        ],
      ],
    );
  }
}
