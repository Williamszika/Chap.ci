import 'package:flutter/material.dart';

import '../i18n/textes.dart';
import '../screens/don_screen.dart';
import '../theme.dart';

/// « SOUTENIR CHAP.CI » — la bannière verte de l'accueil (07/09/2026).
///
/// Le Patron : « Soutenir Chap.ci n'est pas dans l'app. À mettre entre la
/// première ligne d'annonce et la deuxième. » C'est le même bloc que sur le
/// site (`src/pages/Home.tsx`), au même endroit : après avoir vu que le site
/// a des annonces, avant de continuer à défiler.
class BanniereDon extends StatelessWidget {
  const BanniereDon({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: Material(
        color: ChapColors.marque,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const DonScreen())),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.20),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.card_giftcard,
                      size: 22, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr(context, 'don.banniere'),
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.white)),
                      const SizedBox(height: 2),
                      Text(tr(context, 'don.banniereSous'),
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.88))),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right,
                    size: 22, color: Colors.white.withValues(alpha: 0.85)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
