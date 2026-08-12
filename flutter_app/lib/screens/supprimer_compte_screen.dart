import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../theme.dart';

/// Suppression définitive du compte — exigée par l'App Store et le Play Store
/// pour toute app permettant de créer un compte.
///
/// On explique ce qui disparaît, on redemande le mot de passe (le serveur ne
/// l'exige que si le compte en a un ; un compte Google/téléphone n'en a pas),
/// on fait cocher une confirmation, puis on appelle `POST /auth/delete` qui
/// efface toutes les données liées (droit à l'effacement, loi 2013-450).
class SupprimerCompteScreen extends StatefulWidget {
  const SupprimerCompteScreen({super.key});

  @override
  State<SupprimerCompteScreen> createState() => _SupprimerCompteScreenState();
}

class _SupprimerCompteScreenState extends State<SupprimerCompteScreen> {
  final _mdp = TextEditingController();
  bool _enCours = false;
  bool _confirme = false;
  bool _voirMdp = false;
  String? _erreur;

  @override
  void dispose() {
    _mdp.dispose();
    super.dispose();
  }

  Future<void> _demanderPuisSupprimer() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer définitivement ?'),
        content: const Text(
            'Cette action est irréversible. Toutes vos annonces, messages, '
            'favoris et avis seront effacés.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Supprimer',
                style: TextStyle(color: Color(0xFFB42318))),
          ),
        ],
      ),
    );
    if (ok == true) _supprimer();
  }

  Future<void> _supprimer() async {
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance
          .supprimerCompte(_mdp.text.isEmpty ? null : _mdp.text);
      if (!mounted) return;
      Navigator.of(context).popUntil((r) => r.isFirst); // session fermée
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Votre compte a été supprimé.')));
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _erreur = 'La suppression n’a pas abouti. Réessayez.');
      }
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Supprimer mon compte')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFDECEC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFF5C6C6)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.warning_amber_rounded,
                      color: Color(0xFFB42318)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'La suppression est définitive. Il n’est pas possible de '
                      'récupérer le compte ensuite.',
                      style: TextStyle(color: Color(0xFF8A2A21), height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            const Text('Ce qui sera effacé',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            ..._puce('Toutes vos annonces (en ligne et masquées)'),
            ..._puce('Vos conversations et messages'),
            ..._puce('Vos favoris et vos avis'),
            ..._puce('Votre profil et vos informations personnelles'),
            const SizedBox(height: 20),
            TextField(
              controller: _mdp,
              obscureText: !_voirMdp,
              decoration: InputDecoration(
                labelText: 'Mot de passe',
                helperText: 'Laissez vide si vous vous êtes inscrit avec '
                    'Google ou par téléphone.',
                helperMaxLines: 2,
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                      _voirMdp ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _voirMdp = !_voirMdp),
                ),
              ),
            ),
            const SizedBox(height: 12),
            CheckboxListTile(
              value: _confirme,
              onChanged: (v) => setState(() => _confirme = v ?? false),
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              activeColor: const Color(0xFFB42318),
              title: const Text(
                  'Je comprends que la suppression est définitive.'),
            ),
            if (_erreur != null) ...[
              const SizedBox(height: 6),
              Text(_erreur!, style: const TextStyle(color: Color(0xFFB42318))),
            ],
            const SizedBox(height: 18),
            ElevatedButton.icon(
              onPressed: (!_confirme || _enCours) ? null : _demanderPuisSupprimer,
              icon: _enCours
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.delete_forever),
              label: const Text('Supprimer définitivement mon compte'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB42318),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _puce(String texte) => [
        Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 6, right: 8),
                child: Icon(Icons.remove, size: 14, color: ChapColors.gray500),
              ),
              Expanded(
                  child: Text(texte,
                      style: const TextStyle(
                          fontSize: 14, height: 1.4, color: ChapColors.gray700))),
            ],
          ),
        ),
      ];
}
