// =============================================================================
//  « ÇA VAUT COMBIEN ? » — les deux écrans de la nouveauté n° 3.
//
//   · [PrixMarcheVendeur] : sous le champ prix, pendant la saisie. Il dit la
//     fourchette de la sous-catégorie sur Chap.ci et situe le prix tapé. Il
//     n'empêche rien : un vendeur a le droit d'être cher, ou de brader.
//   · [PrixMarcheAcheteur] : sur la fiche, sous le prix. Un mot, pas un
//     tableau. « Bien en dessous — méfiance » est le seul qui compte vraiment.
//
//  La lecture vient de `api/prix_marche.dart`, la même pour les deux, exprès.
//  Une demi-seconde de calme avant d'interroger le serveur : la sous-catégorie
//  et la marque changent par à-coups pendant la saisie.
// =============================================================================
import 'dart:async';

import 'package:flutter/material.dart';

import '../api/prix_marche.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Ce qui identifie une fourchette. Quand la clé change, on recharge.
class _Cle {
  final String categoryId;
  final String? subcategory;
  final String? condition;
  final String? marque;
  final String? sauf;
  const _Cle(this.categoryId, this.subcategory, this.condition, this.marque,
      this.sauf);

  @override
  bool operator ==(Object o) =>
      o is _Cle &&
      o.categoryId == categoryId &&
      o.subcategory == subcategory &&
      o.condition == condition &&
      o.marque == marque &&
      o.sauf == sauf;

  @override
  int get hashCode => Object.hash(categoryId, subcategory, condition, marque, sauf);

  bool get complete =>
      categoryId.isNotEmpty && (subcategory?.isNotEmpty ?? false);
}

/// Le socle commun : charge la fourchette (avec le délai de calme) et laisse
/// la sous-classe dessiner. `null` tant qu'on ne sait pas, ou si le serveur
/// n'a rien à dire.
abstract class _Fourchette extends StatefulWidget {
  final String categoryId;
  final String? subcategory;
  final String? condition;
  final String? marque;
  final String? sauf;
  final num prix;

  const _Fourchette({
    super.key,
    required this.categoryId,
    required this.subcategory,
    required this.prix,
    this.condition,
    this.marque,
    this.sauf,
  });

  _Cle get cle => _Cle(categoryId, subcategory, condition, marque, sauf);

  Widget dessiner(BuildContext context, PrixMarche f, VerdictPrix? v);

  @override
  State<_Fourchette> createState() => _FourchetteState();
}

class _FourchetteState extends State<_Fourchette> {
  PrixMarche? _f;
  Timer? _calme;
  _Cle? _chargee;

  @override
  void initState() {
    super.initState();
    _planifier();
  }

  @override
  void didUpdateWidget(covariant _Fourchette ancien) {
    super.didUpdateWidget(ancien);
    if (ancien.cle != widget.cle) _planifier();
  }

  @override
  void dispose() {
    _calme?.cancel();
    super.dispose();
  }

  void _planifier() {
    _calme?.cancel();
    final cle = widget.cle;
    if (!cle.complete) {
      if (_f != null) setState(() => _f = null);
      return;
    }
    _calme = Timer(const Duration(milliseconds: 500), () async {
      final f = await PrixMarche.charger(
        categoryId: cle.categoryId,
        subcategory: cle.subcategory!,
        condition: cle.condition,
        marque: cle.marque,
        sauf: cle.sauf,
      );
      // La clé a pu changer pendant l'appel : on ne garde que la réponse de
      // la clé courante, sinon une réponse lente écraserait une réponse juste.
      if (mounted && widget.cle == cle) {
        setState(() {
          _f = f;
          _chargee = cle;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final f = _f;
    if (f == null || !f.utile || _chargee != widget.cle) {
      return const SizedBox.shrink();
    }
    return widget.dessiner(context, f, verdictPrix(widget.prix, f));
  }
}

/// « entre 45 000 et 80 000 FCFA » — la phrase de la fourchette.
String fourchetteTexte(BuildContext context, PrixMarche f) => tr(context, 'prix.entre')
    .replaceFirst('{a}', formatFCFA(f.p25!))
    .replaceFirst('{b}', formatFCFA(f.p75!));

/// Sous le champ prix du formulaire de publication.
class PrixMarcheVendeur extends _Fourchette {
  const PrixMarcheVendeur({
    super.key,
    required super.categoryId,
    required super.subcategory,
    required super.prix,
    super.condition,
    super.marque,
    super.sauf,
  });

  @override
  Widget dessiner(BuildContext context, PrixMarche f, VerdictPrix? v) {
    final base = tr(context, f.base == 'marque' ? 'prix.baseMarque' : 'prix.baseObjet');
    final phrase = tr(context, 'prix.vendeur')
        .replaceFirst('{base}', base)
        .replaceFirst('{fourchette}', fourchetteTexte(context, f))
        .replaceFirst('{n}', f.n.toString());
    final String? mot = switch (v) {
      VerdictPrix.moyen => tr(context, 'prix.moyen'),
      VerdictPrix.haut => tr(context, 'prix.haut'),
      VerdictPrix.bas => tr(context, 'prix.bas'),
      null => null,
    };
    final couleurMot =
        v == VerdictPrix.moyen ? ChapColors.greenDark : ChapColors.ocreDark;
    return Padding(
      padding: const EdgeInsets.only(top: 8, left: 2, right: 2),
      child: Text.rich(
        TextSpan(
          style: const TextStyle(
              fontSize: 13, height: 1.35, color: ChapColors.gray700),
          children: [
            TextSpan(text: phrase),
            if (mot != null)
              TextSpan(
                text: ' $mot',
                style: TextStyle(fontWeight: FontWeight.w700, color: couleurMot),
              ),
          ],
        ),
      ),
    );
  }
}

/// Sur la fiche, sous le prix : un mot pour l'acheteur.
class PrixMarcheAcheteur extends _Fourchette {
  const PrixMarcheAcheteur({
    super.key,
    required super.categoryId,
    required super.subcategory,
    required super.prix,
    super.condition,
    super.marque,
    super.sauf,
  });

  @override
  Widget dessiner(BuildContext context, PrixMarche f, VerdictPrix? v) {
    if (v == null) return const SizedBox.shrink();
    final fourchette = fourchetteTexte(context, f);
    if (v == VerdictPrix.bas) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7E6),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          '⚠️ ${tr(context, 'prix.acheteurBas').replaceFirst('{fourchette}', fourchette)}',
          style: const TextStyle(
              fontSize: 13,
              height: 1.35,
              fontWeight: FontWeight.w600,
              color: ChapColors.ocreDark),
        ),
      );
    }
    final mot = tr(context,
        v == VerdictPrix.moyen ? 'prix.acheteurMoyen' : 'prix.acheteurHaut');
    final detail = tr(context, 'prix.acheteurDetail')
        .replaceFirst('{fourchette}', fourchette)
        .replaceFirst('{n}', f.n.toString());
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Text.rich(
        TextSpan(
          style: const TextStyle(
              fontSize: 13, height: 1.35, color: ChapColors.gray600),
          children: [
            TextSpan(text: mot),
            TextSpan(
                text: ' $detail',
                style: const TextStyle(color: ChapColors.gray500)),
          ],
        ),
      ),
    );
  }
}
