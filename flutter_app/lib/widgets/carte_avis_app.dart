import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/avis_app.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// « VOTRE AVIS SUR CHAP.CI » — la carte de l'accueil, et la feuille d'étoiles
/// qu'elle ouvre. Demandée par le Patron le 13/09/2026.
///
/// La carte ne s'affiche QUE si [AvisApp.tourDeDemander] et [AvisApp.etat] sont
/// d'accord : le bon tour de lancement, et un compte qui n'a pas encore répondu.
/// Les deux conditions sont vérifiées par le parent (l'accueil) ; ce widget ne
/// fait que se montrer et se taire.
///
/// ⚠️ LA CROIX EST AUSSI IMPORTANTE QUE LE BOUTON. Une invitation dont on ne
/// peut pas se débarrasser devient une raison de désinstaller — et un testeur
/// qui désinstalle remet à zéro les quatorze jours de Google. La cible de la
/// croix fait 44 px, comme tout ce qui se touche ici.
class CarteAvisApp extends StatelessWidget {
  /// Appelé quand la personne a donné son avis, ou l'a repoussé : dans les deux
  /// cas l'accueil retire la carte.
  final VoidCallback onFini;

  const CarteAvisApp({super.key, required this.onFini});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: Material(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: ChapColors.line2),
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr(context, 'avis.carteTitre'),
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: ChapColors.ink),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      tr(context, 'avis.carteSous'),
                      style: const TextStyle(
                          fontSize: 12, color: ChapColors.gray600),
                    ),
                    const SizedBox(height: 10),
                    // Les cinq étoiles sont le bouton : on note en un geste, sans
                    // écran intermédiaire. La feuille s'ouvre ensuite, déjà
                    // remplie de l'étoile touchée, pour le commentaire.
                    Row(
                      children: List.generate(5, (i) {
                        return InkWell(
                          onTap: () => _ouvrir(context, note: i + 1),
                          borderRadius: BorderRadius.circular(24),
                          child: const SizedBox(
                            width: 44,
                            height: 44,
                            child: Icon(Icons.star_border,
                                size: 28, color: ChapColors.attentionClair),
                          ),
                        );
                      }),
                    ),
                  ],
                ),
              ),
              // « Plus tard », sans culpabiliser personne.
              IconButton(
                onPressed: () async {
                  await AvisApp.reporter();
                  onFini();
                },
                iconSize: 20,
                constraints:
                    const BoxConstraints(minWidth: 44, minHeight: 44),
                tooltip: tr(context, 'avis.plusTard'),
                icon: const Icon(Icons.close, color: ChapColors.gray500),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _ouvrir(BuildContext context, {required int note}) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _FeuilleAvis(noteInitiale: note, onFini: onFini),
    );
  }
}

class _FeuilleAvis extends StatefulWidget {
  final int noteInitiale;
  final VoidCallback onFini;

  const _FeuilleAvis({required this.noteInitiale, required this.onFini});

  @override
  State<_FeuilleAvis> createState() => _FeuilleAvisState();
}

class _FeuilleAvisState extends State<_FeuilleAvis> {
  late int _note = widget.noteInitiale;
  final _commentaire = TextEditingController();
  bool _envoi = false;
  String? _erreur;
  bool _merci = false;

  @override
  void dispose() {
    _commentaire.dispose();
    super.dispose();
  }

  Future<void> _envoyer() async {
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      await AvisApp.envoyer(
        note: _note,
        commentaire: _commentaire.text,
        plateforme: plateformeCourante(),
        version: versionApplication,
      );
      if (!mounted) return;
      setState(() {
        _envoi = false;
        _merci = true;
      });
      widget.onFini();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _envoi = false;
        _erreur = e.message;
      });
      // Un 409 veut dire « déjà donné » : la carte n'a plus lieu d'être, même si
      // l'envoi a échoué. On retire l'invitation plutôt que de la laisser
      // reproposer une chose impossible.
      if (e.message.contains('déjà')) widget.onFini();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _envoi = false;
        _erreur = tr(context, 'avis.erreurReseau');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final basClavier = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(18, 16, 18, 18 + basClavier),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: _merci ? _corpsMerci() : _corpsFormulaire(),
        ),
      ),
    );
  }

  List<Widget> _corpsFormulaire() => [
        Center(
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: ChapColors.line2,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          tr(context, 'avis.titre'),
          style: const TextStyle(
              fontSize: 18, fontWeight: FontWeight.w800, color: ChapColors.ink),
        ),
        const SizedBox(height: 4),
        Text(
          tr(context, 'avis.sousTitre'),
          style: const TextStyle(fontSize: 13, color: ChapColors.gray600),
        ),
        const SizedBox(height: 14),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(5, (i) {
              final pleine = i < _note;
              return InkWell(
                onTap: () => setState(() => _note = i + 1),
                borderRadius: BorderRadius.circular(28),
                child: SizedBox(
                  width: 52,
                  height: 52,
                  child: Icon(
                    pleine ? Icons.star : Icons.star_border,
                    size: 34,
                    color: pleine
                        ? ChapColors.attentionClair
                        : ChapColors.gray500,
                  ),
                ),
              );
            }),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _commentaire,
          maxLines: 4,
          maxLength: 2000,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            hintText: tr(context, 'avis.commentairePlaceholder'),
            helperText: tr(context, 'avis.commentaireFacultatif'),
            border: const OutlineInputBorder(),
          ),
        ),
        if (_erreur != null) ...[
          const SizedBox(height: 8),
          Text(_erreur!,
              style: const TextStyle(fontSize: 13, color: ChapColors.action)),
        ],
        const SizedBox(height: 6),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _envoi ? null : _envoyer,
            child: Text(_envoi
                ? tr(context, 'avis.envoiEnCours')
                : tr(context, 'avis.envoyer')),
          ),
        ),
        const SizedBox(height: 4),
        Center(
          child: TextButton(
            onPressed: _envoi
                ? null
                : () async {
                    await AvisApp.reporter();
                    widget.onFini();
                    if (context.mounted) Navigator.of(context).pop();
                  },
            child: Text(tr(context, 'avis.plusTard')),
          ),
        ),
      ];

  // L'écran de remerciement, et le SEUL endroit d'où part le magasin.
  //
  // ⚠️ AUCUNE CONDITION SUR LA NOTE. Les consignes de Google interdisent de
  // filtrer qui voit la fenêtre d'avis du magasin selon ce qu'il pense de
  // l'application. Quelqu'un qui vient de mettre une étoile voit donc le même
  // bouton que celui qui en a mis cinq — c'est la règle, et c'est aussi la seule
  // façon d'avoir des notes qui veulent dire quelque chose.
  List<Widget> _corpsMerci() => [
        const SizedBox(height: 8),
        Center(
          child: Icon(Icons.favorite,
              size: 40, color: ChapColors.marque.withValues(alpha: 0.9)),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            tr(context, 'avis.merciTitre'),
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: ChapColors.ink),
          ),
        ),
        const SizedBox(height: 6),
        Center(
          child: Text(
            tr(context, 'avis.merciSous'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: ChapColors.gray600),
          ),
        ),
        const SizedBox(height: 18),
        // Le bouton du magasin n'existe que là où il y a un magasin : Chap.ci
        // n'est pas sur l'App Store. Sur iPhone, on s'arrête au merci.
        if (magasinDisponible) ...[
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () async {
                await ouvrirNoteMagasin();
                if (context.mounted) Navigator.of(context).pop();
              },
              child: Text(tr(context, 'avis.noterMagasin')),
            ),
          ),
          const SizedBox(height: 4),
        ],
        Center(
          child: TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(tr(context, 'avis.fermer')),
          ),
        ),
      ];
}
