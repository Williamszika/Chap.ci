// =============================================================================
//  « FAIRE UNE OFFRE » — les écrans de la nouveauté n° 4 (03/09/2026).
//
//   · [montrerFeuilleOffre] : la feuille où l'on tape un montant. Ouverte
//     depuis la fiche (« Faire une offre ») ou depuis la conversation
//     (« Proposer un prix », qui sert aussi de contre-proposition). Elle rend
//     le montant choisi, ou `null` si la personne referme ; c'est l'appelant
//     qui envoie, parce que lui seul sait dans quelle conversation.
//   · [OffreCarte] : ce qu'un message-offre montre dans le fil — le montant,
//     l'état, et pour le destinataire d'une offre encore ouverte : Accepter,
//     Refuser, Contre-proposer.
//
//  Accepter n'est pas payer, et ne change pas le prix affiché de l'annonce :
//  c'est une parole donnée dans la conversation. C'est écrit sous le bouton.
// =============================================================================
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/messaging.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// −10 % arrondi aux 500 FCFA : le point de départ habituel d'une négociation.
int montantSuggere(num prix) {
  final n = ((prix * 0.9) / 500).round() * 500;
  return n < 500 ? 500 : n;
}

/// Ouvre la feuille du montant. [prix] est le prix de référence (celui de
/// l'annonce, ou la dernière offre du fil) ; 0 si on ne sait pas.
Future<int?> montrerFeuilleOffre(BuildContext context,
    {required num prix, required String titre}) {
  return showModalBottomSheet<int>(
    context: context,
    isScrollControlled: true,
    backgroundColor: ChapColors.cream,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _FeuilleOffre(prix: prix, titre: titre),
  );
}

class _FeuilleOffre extends StatefulWidget {
  final num prix;
  final String titre;
  const _FeuilleOffre({required this.prix, required this.titre});

  @override
  State<_FeuilleOffre> createState() => _FeuilleOffreState();
}

class _FeuilleOffreState extends State<_FeuilleOffre> {
  late final TextEditingController _montant;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    _montant = TextEditingController(
        text: widget.prix > 0 ? montantSuggere(widget.prix).toString() : '');
  }

  @override
  void dispose() {
    _montant.dispose();
    super.dispose();
  }

  int get _n => int.tryParse(_montant.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

  void _envoyer() {
    if (_n <= 0) {
      setState(() => _erreur = tr(context, 'offre.montantRequis'));
      return;
    }
    Navigator.pop(context, _n);
  }

  @override
  Widget build(BuildContext context) {
    final n = _n;
    final prix = widget.prix;
    String? ecart;
    if (prix > 0 && n > 0) {
      if (n < prix) {
        ecart = tr(context, 'offre.moins')
            .replaceFirst('{p}', ((1 - n / prix) * 100).round().toString());
      } else if (n == prix) {
        ecart = tr(context, 'offre.auPrix');
      } else {
        ecart = tr(context, 'offre.auDessus');
      }
    }
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 18, 20, 24 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.titre,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: ChapColors.gray900)),
          if (prix > 0) ...[
            const SizedBox(height: 4),
            Text(
              tr(context, 'offre.prixAffiche')
                  .replaceFirst('{prix}', formatFCFA(prix)),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: ChapColors.gray600),
            ),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: _montant,
            autofocus: true,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _envoyer(),
            onChanged: (_) => setState(() => _erreur = null),
            style: const TextStyle(
                fontSize: 24, fontWeight: FontWeight.w800, color: ChapColors.gray900),
            decoration: InputDecoration(
              labelText: tr(context, 'offre.votre'),
              suffixText: 'FCFA',
              errorText: _erreur,
            ),
          ),
          if (ecart != null) ...[
            const SizedBox(height: 6),
            Text(ecart,
                style: const TextStyle(fontSize: 12, color: ChapColors.gray500)),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: n > 0 ? _envoyer : null,
            child: Text(tr(context, 'offre.envoyer')),
          ),
          const SizedBox(height: 10),
          Text(
            tr(context, 'offre.parole'),
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 11.5, height: 1.35, color: ChapColors.gray500),
          ),
        ],
      ),
    );
  }
}

/// Le contenu d'une bulle qui porte une offre.
class OffreCarte extends StatelessWidget {
  final Offre offre;

  /// L'id du compte courant : « Votre offre » ou « Offre reçue ».
  final String? monId;

  /// La bulle est de MON côté (fond vert, texte blanc) : couleurs inversées.
  final bool mien;

  /// Une réponse est déjà en route : les boutons se désactivent.
  final bool enCours;

  final void Function(String action) onRepondre;
  final VoidCallback onContre;

  const OffreCarte({
    super.key,
    required this.offre,
    required this.monId,
    required this.mien,
    required this.enCours,
    required this.onRepondre,
    required this.onContre,
  });

  @override
  Widget build(BuildContext context) {
    final deMoi = offre.par == monId;
    final jeReponds = offre.ouverte && !deMoi;
    final (etat, fondEtat, texteEtat) = switch (offre.statut) {
      'acceptee' => (
          tr(context, 'offre.acceptee'),
          const Color(0xFFDCFCE7),
          const Color(0xFF166534)
        ),
      'refusee' => (
          tr(context, 'offre.refusee'),
          const Color(0xFFE5E7EB),
          ChapColors.gray700
        ),
      'remplacee' => (
          tr(context, 'offre.remplacee'),
          const Color(0xFFE5E7EB),
          ChapColors.gray600
        ),
      _ => (
          tr(context, 'offre.enAttente'),
          const Color(0xFFFEF3C7),
          const Color(0xFF92400E)
        ),
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          tr(context, deMoi ? 'offre.votre' : 'offre.recue'),
          style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: mien ? Colors.white70 : ChapColors.gray500),
        ),
        Text(
          formatFCFA(offre.montant),
          style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: mien ? Colors.white : ChapColors.gray900),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
              color: fondEtat, borderRadius: BorderRadius.circular(6)),
          child: Text(etat,
              style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w700, color: texteEtat)),
        ),
        if (jeReponds) ...[
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              ElevatedButton(
                onPressed: enCours ? null : () => onRepondre('accepter'),
                style: ElevatedButton.styleFrom(
                    minimumSize: const Size(0, 38),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    textStyle: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.bold)),
                child: Text(tr(context, 'offre.accepter')),
              ),
              OutlinedButton(
                onPressed: enCours ? null : () => onRepondre('refuser'),
                style: _contour,
                child: Text(tr(context, 'offre.refuser')),
              ),
              OutlinedButton(
                onPressed: enCours ? null : onContre,
                style: _contour,
                child: Text(tr(context, 'offre.contre')),
              ),
            ],
          ),
        ],
      ],
    );
  }

  static final ButtonStyle _contour = OutlinedButton.styleFrom(
    minimumSize: const Size(0, 38),
    padding: const EdgeInsets.symmetric(horizontal: 14),
    foregroundColor: ChapColors.gray900,
    side: const BorderSide(color: ChapColors.line2),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
  );
}
