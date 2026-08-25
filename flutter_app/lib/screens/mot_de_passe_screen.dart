import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Changer son mot de passe — `POST /auth/password`.
///
/// Le serveur exige le mot de passe actuel quand le compte en a un (les comptes
/// Google/téléphone n'en ont pas et peuvent en définir un sans). Il déconnecte
/// aussi les AUTRES appareils par sécurité — on le dit clairement.
class MotDePasseScreen extends StatefulWidget {
  const MotDePasseScreen({super.key});
  @override
  State<MotDePasseScreen> createState() => _MotDePasseScreenState();
}

class _MotDePasseScreenState extends State<MotDePasseScreen> {
  final _actuel = TextEditingController();
  final _nouveau = TextEditingController();
  final _confirme = TextEditingController();
  bool _voirActuel = false;
  bool _voirNouveau = false;
  bool _envoi = false;
  String? _erreur;

  @override
  void dispose() {
    _actuel.dispose();
    _nouveau.dispose();
    _confirme.dispose();
    super.dispose();
  }

  Future<void> _enregistrer() async {
    final nouveau = _nouveau.text;
    if (nouveau.length < 8) {
      setState(() => _erreur = tr(context, 'mdp.min8'));
      return;
    }
    if (nouveau != _confirme.text) {
      setState(() => _erreur = tr(context, 'mdp.differents'));
      return;
    }
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.changerMotDePasse(_actuel.text, nouveau);
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr(context, 'mdp.modifie')),
          backgroundColor: ChapColors.greenDark,
        ));
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'item.motDePasse'))),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
            children: [
              Text(
                tr(context, 'mdp.aide'),
                style: const TextStyle(color: ChapColors.gray600, height: 1.45),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _actuel,
                obscureText: !_voirActuel,
                autofillHints: const [AutofillHints.password],
                decoration: InputDecoration(
                  labelText: tr(context, 'mdp.actuel'),
                  helperText: tr(context, 'mdp.actuelAide'),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_voirActuel ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _voirActuel = !_voirActuel),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _nouveau,
                obscureText: !_voirNouveau,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(
                  labelText: tr(context, 'mdp.nouveau'),
                  prefixIcon: const Icon(Icons.lock_reset),
                  suffixIcon: IconButton(
                    icon: Icon(_voirNouveau ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _voirNouveau = !_voirNouveau),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _confirme,
                obscureText: !_voirNouveau,
                autofillHints: const [AutofillHints.newPassword],
                onSubmitted: (_) {
                  if (!_envoi) _enregistrer();
                },
                decoration: InputDecoration(
                  labelText: tr(context, 'mdp.confirmer'),
                  prefixIcon: const Icon(Icons.lock_reset),
                ),
              ),
              if (_erreur != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDECEC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF5C6C6)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: Color(0xFFB42318), size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(_erreur!,
                              style: const TextStyle(color: Color(0xFFB42318)))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 22),
              ElevatedButton(
                onPressed: _envoi ? null : _enregistrer,
                child: _envoi
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : Text(tr(context, 'action.enregistrer')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
