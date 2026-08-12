import 'package:flutter/material.dart';
import '../api/models.dart';
import '../theme.dart';
import '../widgets/listing_card.dart';
import 'listing_detail_screen.dart';

/// La page publique d'un vendeur : son nom, son badge « vérifié » s'il l'a, et
/// TOUTES ses annonces en vente. On y arrive en touchant le bloc vendeur d'une
/// fiche d'annonce.
///
/// Il n'existe pas de route serveur dédiée « annonces d'un vendeur » : on
/// réutilise `GET /listings` (les annonces publiques, déjà sans les masquées ni
/// les vendues) et on garde celles de ce vendeur. Même backend que le site,
/// sans route nouvelle.
class VendeurScreen extends StatefulWidget {
  final String sellerId;
  final String sellerName;
  final bool sellerVerified;

  const VendeurScreen({
    super.key,
    required this.sellerId,
    required this.sellerName,
    this.sellerVerified = false,
  });

  @override
  State<VendeurScreen> createState() => _VendeurScreenState();
}

class _VendeurScreenState extends State<VendeurScreen> {
  List<Listing>? _annonces; // null tant que ça charge
  bool _erreur = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    try {
      final toutes = await Listing.toutes();
      final siennes =
          toutes.where((l) => l.sellerId == widget.sellerId).toList();
      if (!mounted) return;
      setState(() {
        _annonces = siennes;
        _erreur = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _annonces = const [];
        _erreur = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Vendeur')),
      body: RefreshIndicator(
        color: ChapColors.orange,
        onRefresh: _charger,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: _enTete()),
            if (_annonces == null)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                    child:
                        CircularProgressIndicator(color: ChapColors.orange)),
              )
            else if (_erreur)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _message(Icons.wifi_off_rounded, 'Connexion impossible',
                    'Tirez vers le bas pour réessayer.'),
              )
            else if (_annonces!.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: _message(
                    Icons.storefront_outlined,
                    'Aucune annonce en vente',
                    'Ce vendeur n’a pas d’autre annonce visible pour le moment.'),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 16),
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
                      annonce: _annonces![i],
                      onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => ListingDetailScreen(
                                  annonce: _annonces![i]))),
                    ),
                    childCount: _annonces!.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _enTete() {
    final n = _annonces?.length;
    final sousTitre = (n == null || n == 0)
        ? 'Vendeur sur Chap.ci'
        : '$n ${n == 1 ? 'annonce' : 'annonces'} en vente';
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 30,
            backgroundColor: ChapColors.cream100,
            child: Icon(Icons.storefront, color: ChapColors.orange, size: 30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(widget.sellerName,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: ChapColors.gray900)),
                    ),
                    if (widget.sellerVerified) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.verified,
                          size: 18, color: Color(0xFF2E7DB8)),
                    ],
                  ],
                ),
                const SizedBox(height: 3),
                Text(sousTitre,
                    style: const TextStyle(
                        fontSize: 13, color: ChapColors.gray600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _message(IconData icone, String titre, String detail) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icone, size: 48, color: ChapColors.line2),
          const SizedBox(height: 12),
          Text(titre,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: ChapColors.gray900)),
          const SizedBox(height: 6),
          Text(detail,
              textAlign: TextAlign.center,
              style:
                  const TextStyle(fontSize: 14, color: ChapColors.gray600)),
        ],
      ),
    );
  }
}
