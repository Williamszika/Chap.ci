import 'package:flutter/material.dart';
import '../favoris.dart';

/// Le cœur — présent sur la carte d'annonce et la fiche. Il se met à jour tout
/// seul (ListenableBuilder sur Favoris) et bascule le favori au toucher.
class BoutonFavori extends StatelessWidget {
  final String listingId;
  final double taille;

  /// `true` pour la version « pastille » posée sur une image (fond blanc semi-
  /// opaque) ; `false` pour un simple icône (barre d'app).
  final bool pastille;

  const BoutonFavori({
    super.key,
    required this.listingId,
    this.taille = 22,
    this.pastille = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Favoris.instance,
      builder: (context, _) {
        final fav = Favoris.instance.contient(listingId);
        final icone = Icon(
          fav ? Icons.favorite : Icons.favorite_border,
          size: taille,
          color: fav ? const Color(0xFFE23744) : (pastille ? Colors.black54 : Colors.black45),
        );
        final enfant = pastille
            ? Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.9),
                  shape: BoxShape.circle,
                ),
                child: icone,
              )
            : icone;
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => Favoris.instance.basculer(listingId),
          // Cible tactile de 48 dp (minimum Material) SANS changer la taille
          // visible du cœur : la SizedBox invisible entoure l'icône, centrée.
          // Le geste le plus répété de l'app (favori, au pouce) devient fiable.
          child: SizedBox(
            width: 48,
            height: 48,
            child: Center(child: enfant),
          ),
        );
      },
    );
  }
}
