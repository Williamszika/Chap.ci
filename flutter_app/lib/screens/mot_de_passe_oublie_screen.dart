import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// MOT DE PASSE OUBLIÉ — réinitialisation par e-mail.
///
/// ⚠️ POURQUOI CET ÉCRAN EXISTE. Le site a cette procédure depuis le 29/08/2026.
/// L'application, elle, ouvrait un panneau disant « la réinitialisation par
/// e-mail n'est pas encore disponible, écrivez-nous » — dans les six langues.
/// Quelqu'un qui oubliait son mot de passe devait donc écrire un courriel et
/// attendre. Sur une place de marché, il ne réécrit pas : il s'en va.
///
/// Deux étapes, celles du serveur :
///   1. `POST /auth/reset/send`    — un code à six chiffres part par e-mail ;
///   2. `POST /auth/reset/confirm` — le code, plus le nouveau mot de passe.
///
/// ⚠️ ON NE DIT JAMAIS SI L'ADRESSE EXISTE. Le serveur répond la même chose dans
/// tous les cas, exprès : sinon la procédure deviendrait un annuaire où l'on
/// teste mille adresses pour savoir lesquelles ont un compte. L'écran doit tenir
/// la même ligne — d'où « si un compte existe avec cette adresse… ».
class MotDePasseOublieScreen extends StatefulWidget {
  const MotDePasseOublieScreen({super.key, this.emailInitial});

  /// L'adresse déjà saisie sur l'écran de connexion, si elle y était.
  final String? emailInitial;

  @override
  State<MotDePasseOublieScreen> createState() => _MotDePasseOublieScreenState();
}

class _MotDePasseOublieScreenState extends State<MotDePasseOublieScreen> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _nouveau = TextEditingController();
  final _code2fa = TextEditingController();

  /// 0 = on demande l'adresse · 1 = code et nouveau mot de passe · 2 = c'est fait.
  int _etape = 0;
  bool _enCours = false;
  bool _voirMotDePasse = false;
  bool _demande2fa = false;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    _email.text = widget.emailInitial ?? '';
  }

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _nouveau.dispose();
    _code2fa.dispose();
    super.dispose();
  }

  Future<void> _envoyerCode() async {
    final email = _email.text.trim();
    if (!email.contains('@') || !email.contains('.')) {
      setState(() => _erreur = tr(context, 'oubli.emailInvalide'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.demanderCodeReinitialisation(email);
      if (mounted) setState(() => _etape = 1);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _confirmer() async {
    final code = _code.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (code.length < 6) {
      setState(() => _erreur = tr(context, 'oubli.entrez6'));
      return;
    }
    if (_nouveau.text.length < 8) {
      setState(() => _erreur = tr(context, 'oubli.tropCourt'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      final fait = await ApiClient.instance.reinitialiserMotDePasse(
        _email.text, code, _nouveau.text,
        code2fa: _demande2fa ? _code2fa.text.trim() : null,
      );
      if (!mounted) return;
      if (fait) {
        setState(() => _etape = 2);
      } else {
        // Le compte a la double authentification : le serveur réclame les six
        // chiffres de l'application. On les demande sans perdre ce qui est saisi.
        setState(() {
          _demande2fa = true;
          _erreur = tr(context, 'oubli.besoin2fa');
        });
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
      appBar: AppBar(title: Text(tr(context, 'oubli.titre'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: Center(
          child: ConstrainedBox(
            // 420 : la largeur de lecture des autres écrans de compte. Sans ce
            // plafond, les champs s'étirent sur toute une tablette.
            constraints: const BoxConstraints(maxWidth: 420),
            child: _etape == 2 ? _vueSucces() : _vueSaisie(),
          ),
        ),
      ),
    );
  }

  Widget _vueSaisie() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.lock_reset, size: 52, color: ChapColors.orange),
        const SizedBox(height: 14),
        Text(
          _etape == 0 ? tr(context, 'oubli.entete') : tr(context, 'oubli.enteteCode'),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          _etape == 0
              ? tr(context, 'oubli.explication')
              : '${tr(context, 'oubli.envoye')} ${_email.text.trim()}. ${tr(context, 'oubli.spams')}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: ChapColors.gray600, height: 1.4),
        ),
        const SizedBox(height: 22),
        if (_etape == 0) ...[
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _enCours ? null : _envoyerCode(),
            decoration: InputDecoration(
              labelText: tr(context, 'oubli.champEmail'),
              prefixIcon: const Icon(Icons.alternate_email),
            ),
          ),
        ] else ...[
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: InputDecoration(
              labelText: tr(context, 'oubli.champCode'),
              prefixIcon: const Icon(Icons.pin_outlined),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _nouveau,
            obscureText: !_voirMotDePasse,
            decoration: InputDecoration(
              labelText: tr(context, 'oubli.champNouveau'),
              helperText: tr(context, 'oubli.aideLongueur'),
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                // 48 dp : la taille par défaut d'un IconButton, celle qu'un
                // pouce attrape en marchant.
                icon: Icon(_voirMotDePasse
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined),
                tooltip: tr(context, 'oubli.voir'),
                onPressed: () =>
                    setState(() => _voirMotDePasse = !_voirMotDePasse),
              ),
            ),
          ),
          if (_demande2fa) ...[
            const SizedBox(height: 14),
            TextField(
              controller: _code2fa,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              decoration: InputDecoration(
                labelText: tr(context, 'oubli.champ2fa'),
                helperText: tr(context, 'oubli.aide2fa'),
                prefixIcon: const Icon(Icons.verified_user_outlined),
              ),
            ),
          ],
        ],
        if (_erreur != null) ...[
          const SizedBox(height: 12),
          Text(
            _erreur!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFFB42318)),
          ),
        ],
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _enCours ? null : (_etape == 0 ? _envoyerCode : _confirmer),
          child: _enCours
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : Text(_etape == 0
                  ? tr(context, 'oubli.envoyer')
                  : tr(context, 'oubli.changer')),
        ),
        if (_etape == 1) ...[
          const SizedBox(height: 6),
          TextButton(
            onPressed: _enCours
                ? null
                : () => setState(() {
                      _etape = 0;
                      _erreur = null;
                      _demande2fa = false;
                    }),
            child: Text(tr(context, 'oubli.autreAdresse')),
          ),
        ],
      ],
    );
  }

  Widget _vueSucces() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        const Icon(Icons.check_circle_outline,
            size: 64, color: ChapColors.green),
        const SizedBox(height: 16),
        Text(tr(context, 'oubli.succesTitre'),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        Text(tr(context, 'oubli.succesCorps'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: ChapColors.gray600, height: 1.5)),
        const SizedBox(height: 24),
        ElevatedButton(
          // On rend l'adresse à l'écran de connexion : la personne n'a plus
          // qu'à taper son nouveau mot de passe.
          onPressed: () => Navigator.of(context).pop(_email.text.trim()),
          child: Text(tr(context, 'oubli.seConnecter')),
        ),
      ],
    );
  }
}
