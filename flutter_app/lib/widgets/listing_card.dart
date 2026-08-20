import 'package:flutter/material.dart';
import '../api/geo.dart';
import '../api/models.dart';
import '../data/coords.dart';
import '../format.dart';
import '../theme.dart';
import 'bouton_favori.dart';

/// La carte d'annonce — le modèle propre, réutilisé partout (accueil, explorer).
///
/// Image en haut, puis titre, prix (FCFA), et la ligne commune · état. C'est la
/// même anatomie que `ListingCard.tsx` du site.
class ListingCard extends StatelessWidget {
  final Listing annonce;
  final VoidCallback? onTap;

  /// Position de l'utilisateur, si connue (tri « Près de moi »). Quand elle est
  /// fournie et que l'annonce a une position, la carte montre « · à 3 km ».
  final Coords? origine;

  const ListingCard(
      {super.key, required this.annonce, this.onTap, this.origine});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ChapColors.line),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: _Image(annonce: annonce),
                ),
                Positioned(
                  top: 6,
                  right: 6,
                  child: BoutonFavori(
                      listingId: annonce.id, pastille: true, taille: 18),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    annonce.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13.5,
                      height: 1.2,
                      fontWeight: FontWeight.w600,
                      color: ChapColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        formatFCFA(annonce.prixAffiche),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ChapColors.orangeDark,
                        ),
                      ),
                      if (annonce.negotiable) ...[
                        const SizedBox(width: 5),
                        const Text('négociable',
                            style: TextStyle(
                                fontSize: 10.5, color: ChapColors.gray500)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  _ligneLieu(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// La ligne « Commune · État », suivie de « · à 3 km » en orange quand la
  /// position de l'utilisateur est connue et l'annonce situable (< 500 km).
  Widget _ligneLieu() {
    final base = [
      if (annonce.commune != null && annonce.commune!.isNotEmpty)
        annonce.commune!,
      annonce.condition == 'neuf' ? 'Neuf' : 'Occasion',
    ].join(' · ');

    double? km;
    final pos = annonce.position;
    if (origine != null && pos != null) {
      final d = distanceKm(origine!, pos);
      if (d < 500) km = d;
    }

    const style = TextStyle(fontSize: 11.5, color: ChapColors.gray600);
    if (km == null) {
      return Text(base,
          maxLines: 1, overflow: TextOverflow.ellipsis, style: style);
    }
    return Row(
      children: [
        Flexible(
          child: Text(base,
              maxLines: 1, overflow: TextOverflow.ellipsis, style: style),
        ),
        const SizedBox(width: 4),
        Text('· ${formatDistance(km)}',
            style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: ChapColors.orange)),
      ],
    );
  }
}

class _Image extends StatelessWidget {
  final Listing annonce;
  const _Image({required this.annonce});

  @override
  Widget build(BuildContext context) {
    final vide = Container(
      color: ChapColors.cream100,
      child: const Icon(Icons.image_outlined, color: ChapColors.line2, size: 34),
    );
    if (annonce.images.isEmpty) return vide;

    final src = ImageSource.resoudre(annonce.images.first);
    final Widget img;
    if (src.bytes != null) {
      img = Image.memory(src.bytes!, fit: BoxFit.cover);
    } else if (src.url != null) {
      img = Image.network(
        src.url!,
        fit: BoxFit.cover,
        loadingBuilder: (c, child, progress) =>
            progress == null ? child : Container(color: ChapColors.cream100),
        errorBuilder: (c, e, s) => vide,
      );
    } else {
      return vide;
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        img,
        if (annonce.sold)
          Container(
            color: Colors.black54,
            alignment: Alignment.center,
            child: const Text('VENDU',
                style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2)),
          ),
      ],
    );
  }
}
