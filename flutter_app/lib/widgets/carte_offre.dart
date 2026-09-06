import 'package:flutter/material.dart';

import '../api/models.dart' show ImageSource;
import '../api/offres.dart';
import '../i18n/formats_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Une offre d'emploi dans une liste (06/09/2026) : le logo (ou la
/// mallette), le poste, l'enseigne, les puces contrat · lieu · salaire, la
/// date. `mienne` ajoute le nombre de candidatures ; `actions` pose une rangée
/// de boutons sous la carte.
class CarteOffre extends StatelessWidget {
  final OffreEmploi offre;
  final VoidCallback onTap;
  final bool mienne;
  final List<Widget> actions;

  const CarteOffre({
    super.key,
    required this.offre,
    required this.onTap,
    this.mienne = false,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    final o = offre;
    final fermee = !o.ouverte;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            key: ValueKey('offre-${o.id}'),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  LogoOffre(url: o.logo, taille: 44),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(o.titre,
                            style: const TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                height: 1.25,
                                color: ChapColors.gray900)),
                        const SizedBox(height: 2),
                        Text(o.entreprise,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: ChapColors.gray600)),
                        if (o.contrat != null || o.lieu != null || o.salaire != null) ...[
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              if (o.contrat != null) PuceOffre(o.contrat!),
                              if (o.lieu != null)
                                PuceOffre(o.lieu!, icone: Icons.place_outlined),
                              if (o.salaire != null)
                                PuceOffre(o.salaire!, icone: Icons.payments_outlined),
                            ],
                          ),
                        ],
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.schedule,
                                size: 11, color: ChapColors.gray500),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                [
                                  tempsEcouleTr(context, o.createdAt),
                                  if (mienne && o.candidatures != null)
                                    '${o.candidatures} ${tr(context, o.candidatures == 1 ? 'emploi.candidature1' : 'emploi.candidatureN')}',
                                ].join(' · '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 11, color: ChapColors.gray500),
                              ),
                            ),
                            if (fermee) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: ChapColors.cream100,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(tr(context, 'emploi.fermee'),
                                    style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: ChapColors.gray600)),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (actions.isNotEmpty) ...[
            const Divider(height: 1, thickness: 1, color: ChapColors.line),
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 6),
              child: Wrap(spacing: 4, runSpacing: 0, children: actions),
            ),
          ],
        ],
      ),
    );
  }
}

/// Le logo de la structure, ou une mallette sur fond crème.
class LogoOffre extends StatelessWidget {
  final String? url;
  final double taille;
  const LogoOffre({super.key, this.url, this.taille = 44});

  @override
  Widget build(BuildContext context) {
    final u = url;
    final image = (u != null && u.isNotEmpty) ? ImageSource.resoudre(u).url : null;
    return Container(
      width: taille,
      height: taille,
      decoration: BoxDecoration(
        color: ChapColors.cream100,
        borderRadius: BorderRadius.circular(12),
      ),
      clipBehavior: Clip.antiAlias,
      alignment: Alignment.center,
      child: image != null
          ? Image.network(image,
              width: taille,
              height: taille,
              fit: BoxFit.cover,
              errorBuilder: (c, e, s) => _mallette())
          : _mallette(),
    );
  }

  Widget _mallette() => Icon(Icons.work_outline,
      size: taille * 0.5, color: ChapColors.ocreDark);
}

/// « CDI », « 📍 Cocody », « 120 000 FCFA » — une puce d'emploi.
class PuceOffre extends StatelessWidget {
  final String texte;
  final IconData? icone;
  const PuceOffre(this.texte, {super.key, this.icone});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: ChapColors.cream100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icone != null) ...[
            Icon(icone, size: 11, color: ChapColors.gray700),
            const SizedBox(width: 3),
          ],
          Text(texte,
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: ChapColors.gray700)),
        ],
      ),
    );
  }
}
