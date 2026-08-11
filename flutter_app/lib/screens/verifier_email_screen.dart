import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/api_client.dart';
import '../theme.dart';

/// Confirmer son adresse e-mail — le mur avant de publier.
///
/// À l'ouverture, on demande au serveur d'envoyer un code à 6 chiffres
/// (`POST /verify/email/send`), puis on le vérifie (`POST /verify/email/confirm`).
/// Retourne `true` si l'adresse est confirmée.
class VerifierEmailScreen extends StatefulWidget {
  const VerifierEmailScreen({super.key});
  @override
  State<VerifierEmailScreen> createState() => _VerifierEmailScreenState();
}

class _VerifierEmailScreenState extends State<VerifierEmailScreen> {
  final _code = TextEditingController();
  String? _email;
  bool _envoiEnCours = true;
  bool _verifEnCours = false;
  String? _erreur;
  String? _info;

  @override
  void initState() {
    super.initState();
    _demarrer();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _demarrer() async {
    final moi = await ApiClient.instance.moi();
    _email = moi?['email'] as String?;
    if (moi?['emailVerified'] == true) {
      if (mounted) Navigator.of(context).pop(true);
      return;
    }
    await _envoyerCode(silencieux: true);
  }

  Future<void> _envoyerCode({bool silencieux = false}) async {
    setState(() {
      _envoiEnCours = true;
      _erreur = null;
    });
    try {
      final d = await ApiClient.instance.post('/verify/email/send', const {});
      if (d is Map && d['already'] == true) {
        if (mounted) Navigator.of(context).pop(true);
        return;
      }
      if (mounted) {
        setState(() => _info =
            'Un code à 6 chiffres a été envoyé à ${_email ?? 'votre adresse'}. Regardez aussi vos spams.');
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoiEnCours = false);
    }
  }

  Future<void> _verifier() async {
    final code = _code.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (code.length < 6) {
      setState(() => _erreur = 'Entrez les 6 chiffres du code.');
      return;
    }
    setState(() {
      _verifEnCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance
          .post('/verify/email/confirm', {'code': code});
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _verifEnCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirmer l’e-mail')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.mark_email_read_outlined,
                size: 52, color: ChapColors.orange),
            const SizedBox(height: 14),
            const Text('Confirmez votre adresse e-mail',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              _info ??
                  'Nous envoyons un code à 6 chiffres à ${_email ?? 'votre adresse'}. C’est nécessaire une seule fois, pour pouvoir publier.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: ChapColors.gray600, height: 1.4),
            ),
            const SizedBox(height: 22),
            TextField(
              controller: _code,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 10),
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                counterText: '',
                hintText: '••••••',
              ),
              onChanged: (v) {
                if (v.replaceAll(RegExp(r'[^0-9]'), '').length == 6) {
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
              onPressed: _verifEnCours ? null : _verifier,
              child: _verifEnCours
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('Vérifier'),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: _envoiEnCours ? null : () => _envoyerCode(),
              child: Text(_envoiEnCours ? 'Envoi…' : 'Renvoyer le code',
                  style: const TextStyle(color: ChapColors.gray700)),
            ),
          ],
        ),
      ),
    );
  }
}
