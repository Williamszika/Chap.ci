import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Deuxième étape de la connexion quand le compte a la double authentification.
///
/// On reçoit le **jeton de défi** (`mfaToken`) renvoyé par `/auth/login`, on
/// demande le code à 6 chiffres de l'application d'authentification (ou un code
/// de secours), et on l'échange contre une session via `/auth/2fa/verify`.
/// Retourne `true` une fois connecté.
class Verifier2faScreen extends StatefulWidget {
  final String mfaToken;
  const Verifier2faScreen({super.key, required this.mfaToken});
  @override
  State<Verifier2faScreen> createState() => _Verifier2faScreenState();
}

class _Verifier2faScreenState extends State<Verifier2faScreen> {
  final _code = TextEditingController();
  bool _enCours = false;
  bool _secours = false; // saisie d'un code de secours (alphanumérique)
  String? _erreur;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verifier() async {
    final code = _code.text.trim();
    final assezLong = _secours ? code.length >= 6 : code.replaceAll(RegExp(r'[^0-9]'), '').length == 6;
    if (!assezLong) {
      setState(() => _erreur = _secours
          ? tr(context, 'v2fa.entrezSecours')
          : tr(context, 'v2fa.entrez6'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.verifier2FA(widget.mfaToken, code);
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'v2fa.titre'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.shield_outlined, size: 52, color: ChapColors.orange),
            const SizedBox(height: 14),
            Text(tr(context, 'v2fa.dernierPas'),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              _secours
                  ? tr(context, 'v2fa.secoursAide')
                  : tr(context, 'v2fa.totpAide'),
              textAlign: TextAlign.center,
              style: const TextStyle(color: ChapColors.gray600, height: 1.4),
            ),
            const SizedBox(height: 22),
            TextField(
              controller: _code,
              keyboardType: _secours ? TextInputType.text : TextInputType.number,
              maxLength: _secours ? 24 : 6,
              textAlign: TextAlign.center,
              autofocus: true,
              style: TextStyle(
                  fontSize: _secours ? 18 : 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: _secours ? 2 : 10),
              inputFormatters:
                  _secours ? null : [FilteringTextInputFormatter.digitsOnly],
              decoration: InputDecoration(
                counterText: '',
                hintText: _secours ? 'code de secours' : '••••••',
              ),
              onChanged: (v) {
                if (!_secours && v.replaceAll(RegExp(r'[^0-9]'), '').length == 6) {
                  _verifier();
                }
              },
            ),
            if (_erreur != null) ...[
              const SizedBox(height: 10),
              Text(_erreur!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFFB42318))),
            ],
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: _enCours ? null : _verifier,
              child: _enCours
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(tr(context, 'vmail.verifier')),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: _enCours
                  ? null
                  : () => setState(() {
                        _secours = !_secours;
                        _code.clear();
                        _erreur = null;
                      }),
              child: Text(
                  _secours
                      ? 'J’ai mon téléphone : entrer le code à 6 chiffres'
                      : tr(context, 'v2fa.sansTel'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: ChapColors.gray700)),
            ),
          ],
        ),
      ),
    );
  }
}
