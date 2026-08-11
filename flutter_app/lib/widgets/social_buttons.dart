import 'package:flutter/material.dart';
import '../api/auth_social.dart';
import '../theme.dart';

/// Les boutons « Continuer avec Google / Facebook », partagés par la connexion
/// et l'inscription.
///
/// Le serveur sait déjà les traiter (mêmes routes que le site). L'obtention du
/// jeton côté téléphone demande une configuration console (voir README) ; tant
/// qu'elle n'est pas faite (`AuthSocial.disponible == false`), un appui explique
/// honnêtement que le bouton est à activer — jamais un plantage.
class SocialButtons extends StatelessWidget {
  /// Appelé après une connexion sociale réussie (pour rafraîchir l'écran).
  final VoidCallback? onConnecte;
  const SocialButtons({super.key, this.onConnecte});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: const [
            Expanded(child: Divider(color: ChapColors.line2)),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Text('ou', style: TextStyle(color: ChapColors.gray500)),
            ),
            Expanded(child: Divider(color: ChapColors.line2)),
          ],
        ),
        const SizedBox(height: 12),
        _bouton(
          context: context,
          fournisseur: 'Google',
          fond: Colors.white,
          texteCol: ChapColors.gray900,
          bord: ChapColors.line2,
          logo: const _LogoG(),
        ),
        const SizedBox(height: 10),
        _bouton(
          context: context,
          fournisseur: 'Facebook',
          fond: const Color(0xFF1877F2),
          texteCol: Colors.white,
          bord: const Color(0xFF1877F2),
          logo: const Text('f',
              style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 20)),
        ),
      ],
    );
  }

  Widget _bouton({
    required BuildContext context,
    required String fournisseur,
    required Color fond,
    required Color texteCol,
    required Color bord,
    required Widget logo,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: () => _appui(context, fournisseur),
        style: OutlinedButton.styleFrom(
          backgroundColor: fond,
          side: BorderSide(color: bord),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(width: 22, height: 22, child: Center(child: logo)),
            const SizedBox(width: 10),
            Text('Continuer avec $fournisseur',
                style: TextStyle(
                    color: texteCol,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  void _appui(BuildContext context, String fournisseur) {
    if (AuthSocial.disponible) {
      // Activé plus tard : ici on lancera la connexion native puis onConnecte().
      return;
    }
    showModalBottomSheet(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, color: ChapColors.orange),
            const SizedBox(height: 10),
            Text('Connexion $fournisseur — bientôt',
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Le serveur sait déjà gérer Google et Facebook (comme sur le site). '
              'Dans l’application, ce bouton s’activera une fois la configuration '
              'terminée. En attendant, créez votre compte avec votre e-mail.',
              style: TextStyle(
                  fontSize: 14, height: 1.5, color: ChapColors.gray700),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('J’ai compris')),
            ),
          ],
        ),
      ),
    );
  }
}

/// Un « G » multicolore approximatif, sans image externe.
class _LogoG extends StatelessWidget {
  const _LogoG();
  @override
  Widget build(BuildContext context) {
    return const Text('G',
        style: TextStyle(
            fontSize: 19,
            fontWeight: FontWeight.w800,
            color: Color(0xFF4285F4)));
  }
}
