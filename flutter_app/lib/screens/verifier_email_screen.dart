import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// Confirmer son adresse e-mail — le mur avant de publier.
///
/// À l'ouverture, on demande au serveur d'envoyer un code à 6 chiffres
/// (`POST /verify/email/send`), puis on le vérifie (`POST /verify/email/confirm`).
/// Retourne `true` si l'adresse est confirmée.
///
/// L'écran soigne trois choses qui manquaient : six cases qui s'enchaînent (et
/// acceptent le collage du code d'un coup), un compte à rebours avant de pouvoir
/// renvoyer, et un vrai message de succès à la fin.
class VerifierEmailScreen extends StatefulWidget {
  const VerifierEmailScreen({super.key});
  @override
  State<VerifierEmailScreen> createState() => _VerifierEmailScreenState();
}

class _VerifierEmailScreenState extends State<VerifierEmailScreen> {
  final _code = TextEditingController();
  final _focus = FocusNode();
  String? _email;
  bool _envoiEnCours = true;
  bool _verifEnCours = false;
  bool _reussi = false;
  String? _erreur;
  String? _info;

  // Compte à rebours avant de pouvoir renvoyer (le serveur limite déjà à 5/h ;
  // ceci évite les envois inutiles et rassure sur « c'est bien parti »).
  static const int _delaiRenvoi = 45;
  int _secondes = 0;
  Timer? _minuteur;

  @override
  void initState() {
    super.initState();
    // Rafraîchit le contour de la case active quand le champ gagne/perd le focus.
    _focus.addListener(() {
      if (mounted) setState(() {});
    });
    _demarrer();
  }

  @override
  void dispose() {
    _minuteur?.cancel();
    _code.dispose();
    _focus.dispose();
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
    if (mounted) _focus.requestFocus();
  }

  void _lancerCompteARebours() {
    _minuteur?.cancel();
    setState(() => _secondes = _delaiRenvoi);
    _minuteur = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() => _secondes--);
      if (_secondes <= 0) t.cancel();
    });
  }

  Future<void> _envoyerCode({bool silencieux = false}) async {
    if (_secondes > 0) return;
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
            "${tr(context, 'vmail.envoye')} ${_email ?? tr(context, 'vmail.votreAdresse')}. ${tr(context, 'vmail.spams')}");
        _lancerCompteARebours();
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
      setState(() => _erreur = tr(context, 'vmail.entrez6'));
      return;
    }
    setState(() {
      _verifEnCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.post('/verify/email/confirm', {'code': code});
      _minuteur?.cancel();
      if (mounted) setState(() => _reussi = true);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _erreur = e.message;
          _code.clear();
        });
        _focus.requestFocus();
      }
    } finally {
      if (mounted) setState(() => _verifEnCours = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'vmail.titre'))),
      body: _reussi ? _vueSucces() : _vueSaisie(),
    );
  }

  Widget _vueSaisie() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.mark_email_read_outlined,
                  size: 52, color: ChapColors.orange),
              const SizedBox(height: 14),
              Text(tr(context, 'vmail.confirmez'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 19, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(
                _info ??
                    "${tr(context, 'vmail.explication')} ${_email ?? tr(context, 'vmail.votreAdresse')}. ${tr(context, 'vmail.uneFois')}",
                textAlign: TextAlign.center,
                style: const TextStyle(color: ChapColors.gray600, height: 1.4),
              ),
              const SizedBox(height: 22),
              _cases(),
              const SizedBox(height: 10),
              Text(tr(context, 'vmail.valable'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 12, color: ChapColors.gray500)),
              if (_erreur != null) ...[
                const SizedBox(height: 10),
                Text(_erreur!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFFB42318))),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _verifEnCours ? null : _verifier,
                child: _verifEnCours
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : Text(tr(context, 'vmail.verifier')),
              ),
              const SizedBox(height: 6),
              TextButton(
                onPressed: (_envoiEnCours || _secondes > 0)
                    ? null
                    : () => _envoyerCode(),
                child: Text(
                  _envoiEnCours
                      ? tr(context, 'vmail.envoi')
                      : _secondes > 0
                          ? "${tr(context, 'vmail.renvoyerDans')} 0:${_secondes.toString().padLeft(2, '0')}"
                          : tr(context, 'vmail.renvoyer'),
                  style: const TextStyle(color: ChapColors.gray700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Les six cases. Une seule zone de saisie (invisible) posée par-dessus capte
  /// la frappe ET le collage ; les cases ne font que dessiner le contenu.
  Widget _cases() {
    final texte = _code.text;
    return GestureDetector(
      onTap: () => _focus.requestFocus(),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(6, (i) {
              final rempli = i < texte.length;
              final actif = i == texte.length && _focus.hasFocus;
              return Container(
                width: 42,
                height: 54,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: ChapColors.cream,
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: (rempli || actif)
                        ? ChapColors.orange
                        : ChapColors.line2,
                    width: (rempli || actif) ? 2 : 1.5,
                  ),
                ),
                child: Text(rempli ? texte[i] : '',
                    style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: ChapColors.gray900)),
              );
            }),
          ),
          // Zone de saisie réelle, invisible, qui couvre les cases.
          Positioned.fill(
            child: Opacity(
              opacity: 0,
              child: TextField(
                controller: _code,
                focusNode: _focus,
                keyboardType: TextInputType.number,
                maxLength: 6,
                showCursor: false,
                enableSuggestions: false,
                autocorrect: false,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                decoration: const InputDecoration(
                    counterText: '', border: InputBorder.none),
                onChanged: (v) {
                  setState(() => _erreur = null);
                  if (v.replaceAll(RegExp(r'[^0-9]'), '').length == 6) {
                    _verifier();
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _vueSucces() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(
                color: const Color(0xFFE6F6EE),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFBEE6D1), width: 2),
              ),
              child: const Icon(Icons.check_rounded,
                  size: 46, color: ChapColors.greenDark),
            ),
            const SizedBox(height: 18),
            Text(tr(context, 'vmail.succesTitre'),
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(
              tr(context, 'vmail.succesCorps'),
              textAlign: TextAlign.center,
              style: const TextStyle(color: ChapColors.gray600, height: 1.45),
            ),
            const SizedBox(height: 26),
            SizedBox(
              width: 220,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                child: Text(tr(context, 'vmail.continuer')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
