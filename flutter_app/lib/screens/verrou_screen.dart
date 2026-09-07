import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/biometrie.dart';
import '../ecran_demarrage.dart' show SigneChap;
import '../i18n/textes.dart';
import '../theme.dart';

/// L'ÉCRAN DE VERROUILLAGE — empreinte digitale ou Face ID (07/09/2026).
///
/// Il s'affiche à l'ouverture quand le déverrouillage biométrique est allumé.
/// Rien du compte n'est visible derrière : ni les messages, ni les annonces.
///
/// Deux sorties, et deux seulement :
///   · le doigt ou le visage reconnu → [onOuvert] ;
///   · « Utiliser mon mot de passe » → on se déconnecte, et l'écran de
///     connexion habituel reprend la main. C'est la porte de secours : sans
///     elle, une empreinte qui cesse de fonctionner (doigt blessé, capteur
///     cassé) enfermerait quelqu'un hors de son propre compte.
class VerrouScreen extends StatefulWidget {
  final VoidCallback onOuvert;
  const VerrouScreen({super.key, required this.onOuvert});

  @override
  State<VerrouScreen> createState() => _VerrouScreenState();
}

class _VerrouScreenState extends State<VerrouScreen> {
  bool _enCours = false;
  bool _refuse = false;

  @override
  void initState() {
    super.initState();
    // On demande tout de suite : la personne a ouvert l'application pour
    // entrer, pas pour appuyer sur un bouton de plus.
    WidgetsBinding.instance.addPostFrameCallback((_) => _demander());
  }

  Future<void> _demander() async {
    if (_enCours) return;
    setState(() {
      _enCours = true;
      _refuse = false;
    });
    final ok = await Biometrie.instance.demander(tr(context, 'verrou.motif'));
    if (!mounted) return;
    setState(() => _enCours = false);
    if (ok) {
      widget.onOuvert();
    } else {
      setState(() => _refuse = true);
    }
  }

  /// La porte de secours : on efface la session et on repasse par le mot de
  /// passe. Le réglage biométrique reste allumé pour la prochaine fois.
  Future<void> _motDePasse() async {
    await ApiClient.instance.seDeconnecter();
    if (mounted) widget.onOuvert();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ChapColors.cream,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SigneChap(taille: 84),
                const SizedBox(height: 28),
                Icon(
                  Icons.fingerprint,
                  size: 56,
                  color: _refuse ? const Color(0xFFB42318) : ChapColors.marque,
                ),
                const SizedBox(height: 16),
                Text(
                  tr(context, _refuse ? 'verrou.refuse' : 'verrou.titre'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: ChapColors.gray900),
                ),
                const SizedBox(height: 6),
                Text(
                  tr(context, 'verrou.sousTitre'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: ChapColors.gray600),
                ),
                const SizedBox(height: 26),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _enCours ? null : _demander,
                    icon: _enCours
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.lock_open_outlined, size: 18),
                    label: Text(tr(context, 'verrou.deverrouiller')),
                    style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(52)),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _enCours ? null : _motDePasse,
                  style: TextButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      foregroundColor: ChapColors.gray600),
                  child: Text(tr(context, 'verrou.motDePasse')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
