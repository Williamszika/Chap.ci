import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/auth_social.dart';
import '../theme.dart';

/// Les boutons « Continuer avec Google / Facebook », partagés par la connexion
/// et l'inscription.
///
/// Google est actif : appui → sélecteur de compte Google → session ouverte via
/// la route serveur `/auth/google` (la même que le site). Facebook reste « à
/// venir » tant que l'app Facebook mobile et les réglages serveur ne sont pas
/// en place ; l'appui explique alors honnêtement, sans planter.
class SocialButtons extends StatefulWidget {
  /// Appelé après une connexion sociale réussie (pour rafraîchir l'écran).
  final VoidCallback? onConnecte;
  const SocialButtons({super.key, this.onConnecte});

  @override
  State<SocialButtons> createState() => _SocialButtonsState();
}

class _SocialButtonsState extends State<SocialButtons> {
  String? _enCours; // le fournisseur dont la connexion est en cours

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Row(
          children: [
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
          fournisseur: 'Google',
          fond: Colors.white,
          texteCol: ChapColors.gray900,
          bord: ChapColors.line2,
          logo: const _LogoG(),
        ),
        const SizedBox(height: 10),
        _bouton(
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
    required String fournisseur,
    required Color fond,
    required Color texteCol,
    required Color bord,
    required Widget logo,
  }) {
    final enCours = _enCours == fournisseur;
    final actif = _enCours == null;
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton(
        onPressed: actif ? () => _appui(fournisseur) : null,
        style: OutlinedButton.styleFrom(
          backgroundColor: fond,
          side: BorderSide(color: bord),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: enCours
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: texteCol),
              )
            : Row(
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

  void _appui(String fournisseur) {
    if (fournisseur == 'Google' && AuthSocial.googleDisponible) {
      _connecterGoogle();
      return;
    }
    if (fournisseur == 'Facebook' && AuthSocial.facebookDisponible) {
      // Câblé plus tard, comme Google.
      return;
    }
    _bientot(fournisseur);
  }

  Future<void> _connecterGoogle() async {
    setState(() => _enCours = 'Google');
    try {
      final ok = await AuthSocial.instance.connecterGoogle();
      if (!mounted) return;
      if (ok) widget.onConnecte?.call();
    } on ApiException catch (e) {
      if (mounted) _erreur(e.message);
    } catch (_) {
      if (mounted) {
        _erreur('La connexion Google n’a pas abouti. Réessayez, ou '
            'créez un compte avec votre e-mail.');
      }
    } finally {
      if (mounted) setState(() => _enCours = null);
    }
  }

  void _erreur(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _bientot(String fournisseur) {
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
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text(
              'Le serveur sait déjà gérer Facebook (comme sur le site). Dans '
              'l’application, ce bouton s’activera une fois la configuration '
              'terminée. En attendant, utilisez Google ou votre e-mail.',
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
