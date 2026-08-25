import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../liens_site.dart';
import '../theme.dart';
import '../widgets/social_buttons.dart';
import 'mon_compte.dart';
import 'parametres_screen.dart';
import 'register_screen.dart';
import 'verifier_2fa_screen.dart';

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
      final mfaToken =
          await ApiClient.instance.seConnecter(_email.text, _motDePasse.text);
      if (mfaToken != null) {
        // Le compte a la double authentification : on demande le code à 6
        // chiffres sur l'écran suivant.
        if (!mounted) return;
        setState(() => _enCours = false);
        final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(
            builder: (_) => Verifier2faScreen(mfaToken: mfaToken)));
        if (ok == true && mounted) setState(() {});
        return;
      }
      if (mounted) setState(() {});
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _ouvrirParametres() async {
    await Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const ParametresScreen()));
    // Au retour, l'état a pu changer (déconnexion, suppression, e-mail
    // confirmé…) : on redessine l'écran Compte.
    if (mounted) setState(() {});
  }

  Future<void> _ouvrirInscription() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const RegisterScreen()));
    // Au retour, l'utilisateur est peut-être connecté : on rafraîchit l'écran.
    if (mounted) setState(() {});
  }

  /// La réinitialisation par e-mail n'existe pas encore côté serveur (le site
  /// non plus) : on l'explique honnêtement plutôt que d'afficher un bouton qui
  /// ne mène à rien.
  void _motDePasseOublie() {
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
            const Icon(Icons.lock_reset, color: ChapColors.orange),
            const SizedBox(height: 10),
            Text(tr(context, 'login.oublieTitre'),
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              tr(context, 'login.oublieCorps'),
              style: const TextStyle(
                  fontSize: 14, height: 1.5, color: ChapColors.gray700),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(tr(context, 'action.compris'))),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final connecte = ApiClient.instance.connecte;
    return Scaffold(
      appBar: AppBar(
        title: Text(connecte ? tr(context, 'compte.titre') : tr(context, 'compte.connexion')),
        actions: connecte
            ? [
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  tooltip: tr(context, 'param.titre'),
                  onPressed: _ouvrirParametres,
                ),
              ]
            : null,
      ),
      body: connecte ? const MonCompteView() : _vueConnexion(),
    );
  }

  Widget _vueConnexion() {
    // Plafond de largeur : sur tablette, le formulaire ne s'étire pas sur toute
    // la largeur (cohérent avec l'écran « modifier le profil »).
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 8),
            Text(tr(context, 'login.bonRetour'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(tr(context, 'login.sousTitre'),
                style: const TextStyle(color: ChapColors.gray600)),
            const SizedBox(height: 22),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: InputDecoration(
                labelText: tr(context, 'item.email'),
                prefixIcon: const Icon(Icons.mail_outline),
              ),
              validator: (v) => (v == null || !v.contains('@'))
                  ? tr(context, 'form.emailInvalide')
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _motDePasse,
              obscureText: !_voirMdp,
              autofillHints: const [AutofillHints.password],
              decoration: InputDecoration(
                labelText: tr(context, 'item.motDePasse'),
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                      _voirMdp ? Icons.visibility_off : Icons.visibility),
                  onPressed: () => setState(() => _voirMdp = !_voirMdp),
                ),
              ),
              validator: (v) => (v == null || v.length < 6)
                  ? tr(context, 'form.min6')
                  : null,
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _enCours ? null : _motDePasseOublie,
                style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                child: Text(tr(context, 'login.oublie'),
                    style: const TextStyle(
                        color: ChapColors.gray600, fontSize: 13)),
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
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _enCours ? null : _seConnecter,
              child: _enCours
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(tr(context, 'login.seConnecter')),
            ),
            const SizedBox(height: 18),
            SocialButtons(onConnecte: () {
              if (mounted) setState(() {});
            }),
            const SizedBox(height: 6),
            Center(
              child: TextButton(
                onPressed: _enCours ? null : _ouvrirInscription,
                child: Text.rich(
                  TextSpan(
                    text: tr(context, 'login.pasDeCompte'),
                    style: const TextStyle(color: ChapColors.gray600),
                    children: [
                      TextSpan(
                        text: tr(context, 'login.creerCompte'),
                        style: const TextStyle(
                            color: ChapColors.orangeDark,
                            fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                TextButton(
                  onPressed: () =>
                      ouvrirPageSite(context, PagesSite.conditions),
                  style: _lienLegalStyle,
                  child: Text(tr(context, 'item.conditions')),
                ),
                const Text('·', style: TextStyle(color: ChapColors.gray500)),
                TextButton(
                  onPressed: () =>
                      ouvrirPageSite(context, PagesSite.confidentialite),
                  style: _lienLegalStyle,
                  child: Text(tr(context, 'item.confidentialite')),
                ),
              ],
            ),
          ],
        ),
      ),
    )));
  }

  static final ButtonStyle _lienLegalStyle = TextButton.styleFrom(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    minimumSize: Size.zero,
    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    foregroundColor: ChapColors.gray600,
    textStyle: const TextStyle(fontSize: 12.5),
  );
}
