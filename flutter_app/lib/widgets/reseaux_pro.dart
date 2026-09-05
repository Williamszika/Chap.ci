import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/reseaux.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// LES RÉSEAUX SOCIAUX SUR LA PAGE VENDEUR (05/09/2026) — le jumeau de
/// `src/components/Reseaux.tsx` : la rangée de pastilles aux couleurs des
/// marques sous « Contacter », et la liste de l'onglet « À propos » qui
/// écrit l'adresse en clair. Un appui ouvre l'application du réseau si elle
/// est installée, le navigateur sinon (`LaunchMode.externalApplication`).

Future<void> ouvrirReseau(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) return;
  try {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(tr(context, 'vend.lienImpossible'))));
    }
  }
}

/// Une pastille : le fond de la marque, l'icône, le nom.
class PastilleReseau extends StatelessWidget {
  final DefReseau def;
  final String url;
  const PastilleReseau({super.key, required this.def, required this.url});

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: '${def.nom} · ${lisibleReseau(url)}',
        child: Material(
          color: Colors.transparent,
          child: Ink(
            decoration: BoxDecoration(
              color: def.degrade == null ? def.couleur : null,
              gradient: def.degrade,
              borderRadius: BorderRadius.circular(999),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.22),
                    blurRadius: 10,
                    offset: const Offset(0, 4)),
              ],
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(999),
              onTap: () => ouvrirReseau(context, url),
              child: Container(
                height: 40,
                padding: const EdgeInsets.fromLTRB(12, 0, 16, 0),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconeReseau(def.id, taille: 16, couleur: def.encre),
                    const SizedBox(width: 8),
                    Text(def.nom,
                        style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: def.encre)),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
}

/// La rangée sous « Contacter » — défilante si elle ne tient pas.
class PillesReseaux extends StatelessWidget {
  final Map<String, String> reseaux;
  final String nom;
  const PillesReseaux({super.key, required this.reseaux, required this.nom});

  @override
  Widget build(BuildContext context) {
    final presents = reseauxPresents(reseaux);
    if (presents.isEmpty) return const SizedBox.shrink();
    return Column(
      key: const ValueKey('pilles-reseaux'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr(context, 'vend.retrouvez').replaceFirst('{nom}', nom).toUpperCase(),
          style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              color: ChapColors.gray500),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children: [
              for (var i = 0; i < presents.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                PastilleReseau(def: presents[i].$1, url: presents[i].$2),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// La liste de l'onglet « À propos » : le réseau, et l'adresse écrite en clair.
class ListeReseaux extends StatelessWidget {
  final Map<String, String> reseaux;
  const ListeReseaux({super.key, required this.reseaux});

  @override
  Widget build(BuildContext context) {
    final presents = reseauxPresents(reseaux);
    if (presents.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr(context, 'vend.reseaux'),
              style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: ChapColors.gray900)),
          const SizedBox(height: 4),
          for (var i = 0; i < presents.length; i++)
            InkWell(
              onTap: () => ouvrirReseau(context, presents[i].$2),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: i == 0
                    ? null
                    : const BoxDecoration(
                        border: Border(top: BorderSide(color: ChapColors.line))),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: presents[i].$1.degrade == null
                            ? presents[i].$1.couleur
                            : null,
                        gradient: presents[i].$1.degrade,
                        shape: BoxShape.circle,
                      ),
                      child: IconeReseau(presents[i].$1.id,
                          taille: 16, couleur: presents[i].$1.encre),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(presents[i].$1.nom,
                              style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: ChapColors.gray900)),
                          Text(lisibleReseau(presents[i].$2),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 11.5, color: ChapColors.gray500)),
                        ],
                      ),
                    ),
                    const Icon(Icons.open_in_new,
                        size: 15, color: ChapColors.line2),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
