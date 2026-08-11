import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../theme.dart';
import '../widgets/social_buttons.dart';
import 'mon_compte.dart';
import 'register_screen.dart';

/// Compte — connexion, ou état « connecté » si un jeton est déjà présent.
///
/// Pour l'instant : se connecter et se déconnecter. L'inscription, le profil
/// complet, la 2FA et la publication viendront dans les prochains écrans.
class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _email = TextEditingController();
  final _motDePasse = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _enCours = false;
  bool _voirMdp = false;
  String? _erreur;

  @override
  void dispose() {
    _email.dispose();
    _motDePasse.dispose();
    super.dispose();
  }

  Future<void> _seConnecter() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.seConnecter(_email.text, _motDePasse.text);
      if (mounted) setState(() {});
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _seDeconnecter() async {
    await ApiClient.instance.seDeconnecter();
    if (mounted) setState(() {});
  }

  Future<void> _ouvrirInscription() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const RegisterScreen()));
    // Au retour, l'utilisateur est peut-être connecté : on rafraîchit l'écran.
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final connecte = ApiClient.instance.connecte;
    return Scaffold(
      appBar: AppBar(
        title: Text(connecte ? 'Mon compte' : 'Connexion'),
        actions: connecte
            ? [
                IconButton(
                  icon: const Icon(Icons.logout),
                  tooltip: 'Se déconnecter',
                  onPressed: _seDeconnecter,
                ),
              ]
            : null,
      ),
      body: connecte ? const MonCompteView() : _vueConnexion(),
    );
  }

  Widget _vueConnexion() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            const Text('Bon retour 👋',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('Connectez-vous pour publier et suivre vos annonces.',
                style: TextStyle(color: ChapColors.gray600)),
            const SizedBox(height: 22),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(
                labelText: 'Adresse e-mail',
                prefixIcon: Icon(Icons.mail_outline),
              ),
              validator: (v) =>
                  (v == null || !v.contains('@')) ? 'E-mail invalide' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _motDePasse,
              obscureText: !_voirMdp,
              autofillHints: const [AutofillHints.password],
              decoration: InputDecoration(
                labelText: 'Mot de passe',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                      _voirMdp ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _voirMdp = !_voirMdp),
                ),
              ),
              validator: (v) => (v == null || v.length < 6)
                  ? 'Au moins 6 caractères'
                  : null,
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
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _enCours ? null : _seConnecter,
              child: _enCours
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Se connecter'),
            ),
            const SizedBox(height: 18),
            SocialButtons(onConnecte: () {
              if (mounted) setState(() {});
            }),
            const SizedBox(height: 6),
            Center(
              child: TextButton(
                onPressed: _enCours ? null : _ouvrirInscription,
                child: const Text.rich(
                  TextSpan(
                    text: 'Pas encore de compte ? ',
                    style: TextStyle(color: ChapColors.gray600),
                    children: [
                      TextSpan(
                        text: 'Créer un compte',
                        style: TextStyle(
                            color: ChapColors.orangeDark,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
