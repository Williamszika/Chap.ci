import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/social_buttons.dart';

/// Inscription — créer un compte Chap.ci.
///
/// Le serveur exige : e-mail valide, mot de passe ≥ 8 caractères, et le
/// CONSENTEMENT explicite (loi ivoirienne). La case n'est jamais pré-cochée :
/// un consentement doit être un vrai geste.
///
/// À la réussite, on est connecté et on revient en arrière (l'écran Compte
/// affiche alors l'état connecté).
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nom = TextEditingController();
  final _email = TextEditingController();
  final _motDePasse = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _enCours = false;
  bool _voirMdp = false;
  bool _consent = false;
  String? _erreur;

  @override
  void dispose() {
    _nom.dispose();
    _email.dispose();
    _motDePasse.dispose();
    super.dispose();
  }

  Future<void> _sInscrire() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_consent) {
      setState(() => _erreur =
          tr(context, 'insc.accepter'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance
          .sInscrire(_email.text, _motDePasse.text, _nom.text);
      if (mounted) {
        // Compte créé + connecté : on revient, l'écran Compte se met à jour.
        Navigator.of(context).pop(true);
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'insc.titre'))),
      // Plafond de largeur : sur tablette, le formulaire ne s'étire pas sur
      // toute la largeur (cohérent avec l'écran « modifier le profil »).
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(tr(context, 'insc.bienvenue'),
                  style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
              const SizedBox(height: 5),
              Text(tr(context, 'insc.sousTitre'),
                  style: TextStyle(color: ChapColors.gray600)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _nom,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: tr(context, 'insc.nomComplet'),
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                validator: (v) => (v == null || v.trim().length < 2)
                    ? tr(context, 'insc.indiquezNom')
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
                decoration: InputDecoration(
                  labelText: tr(context, 'item.email'),
                  prefixIcon: const Icon(Icons.mail_outline),
                ),
                validator: (v) =>
                    (v == null || !v.contains('@')) ? 'E-mail invalide' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _motDePasse,
                obscureText: !_voirMdp,
                autofillHints: const [AutofillHints.newPassword],
                decoration: InputDecoration(
                  labelText: tr(context, 'item.motDePasse'),
                  helperText: tr(context, 'insc.min8'),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                        _voirMdp ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _voirMdp = !_voirMdp),
                  ),
                ),
                validator: (v) => (v == null || v.length < 8)
                    ? tr(context, 'insc.min8')
                    : null,
              ),
              const SizedBox(height: 8),
              // Consentement — jamais pré-coché.
              InkWell(
                onTap: () => setState(() => _consent = !_consent),
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _consent,
                        activeColor: ChapColors.orange,
                        onChanged: (v) => setState(() => _consent = v ?? false),
                      ),
                      const Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(top: 12),
                          child: Text(
                            'J’accepte les conditions d’utilisation et la politique de confidentialité de Chap.ci.',
                            style: TextStyle(
                                fontSize: 13, color: ChapColors.gray700),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (_erreur != null) ...[
                const SizedBox(height: 10),
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
                              style:
                                  const TextStyle(color: Color(0xFFB42318)))),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: _enCours ? null : _sInscrire,
                child: _enCours
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : Text(tr(context, 'insc.creerMonCompte')),
              ),
              const SizedBox(height: 18),
              SocialButtons(onConnecte: () {
                if (mounted) Navigator.of(context).pop(true);
              }),
              const SizedBox(height: 4),
              Center(
                child: TextButton(
                  onPressed:
                      _enCours ? null : () => Navigator.of(context).pop(false),
                  child: const Text('J’ai déjà un compte — me connecter',
                      style: TextStyle(color: ChapColors.gray700)),
                ),
              ),
            ],
          ),
        ),
      ),
        ),
      ),
    );
  }
}
