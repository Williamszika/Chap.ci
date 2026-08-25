import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../api/api_client.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// La double authentification (2FA), depuis « Mon compte ».
///
/// Trois moments :
///   · si elle est désactivée : on génère un secret (`/auth/2fa/setup`), on le
///     montre en QR + en clé à recopier, puis on vérifie un premier code
///     (`/auth/2fa/activate`) qui l'active et rend les codes de secours ;
///   · une fois activée : on l'affiche comme telle et on peut la désactiver
///     (`/auth/2fa/disable`) après un code valide.
class Securite2faScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : quand il est fourni, l'écran s'ouvre
  /// directement sur l'étape de configuration avec ce secret, sans réseau.
  final ({String secret, String uri})? apercu;
  const Securite2faScreen({super.key, this.apercu});
  @override
  State<Securite2faScreen> createState() => _Securite2faScreenState();
}

enum _Etape { chargement, desactivee, configuration, codesSecours, activee }

class _Securite2faScreenState extends State<Securite2faScreen> {
  _Etape _etape = _Etape.chargement;
  final _code = TextEditingController();
  String _secret = '';
  String _uri = '';
  List<String> _codesSecours = const [];
  bool _enCours = false;
  String? _erreur;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _secret = widget.apercu!.secret;
      _uri = widget.apercu!.uri;
      _etape = _Etape.configuration;
    } else {
      _charger();
    }
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _charger() async {
    final actif = await ApiClient.instance.statut2FA();
    if (mounted) setState(() => _etape = actif ? _Etape.activee : _Etape.desactivee);
  }

  Future<void> _preparer() async {
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      final r = await ApiClient.instance.preparer2FA();
      if (mounted) {
        setState(() {
          _secret = r.secret;
          _uri = r.uri;
          _etape = _Etape.configuration;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _activer() async {
    final code = _code.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (code.length < 6) {
      setState(() => _erreur = tr(context, 'g2fa.entrezApp'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      final codes = await ApiClient.instance.activer2FA(code);
      if (mounted) {
        setState(() {
          _codesSecours = codes;
          _code.clear();
          _etape = _Etape.codesSecours;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _enCours = false);
    }
  }

  Future<void> _desactiver() async {
    final code = _code.text.trim();
    if (code.length < 6) {
      setState(() => _erreur = tr(context, 'g2fa.entrezOuSecours'));
      return;
    }
    setState(() {
      _enCours = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.desactiver2FA(code);
      if (mounted) {
        setState(() {
          _code.clear();
          _etape = _Etape.desactivee;
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
      appBar: AppBar(title: Text(tr(context, 'item.doubleAuth'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
        child: switch (_etape) {
          _Etape.chargement => const Padding(
              padding: EdgeInsets.only(top: 80),
              child: Center(child: CircularProgressIndicator(color: ChapColors.orange)),
            ),
          _Etape.desactivee => _vueDesactivee(),
          _Etape.configuration => _vueConfiguration(),
          _Etape.codesSecours => _vueCodesSecours(),
          _Etape.activee => _vueActivee(),
        },
      ),
    );
  }

  // — Désactivée : proposer d'activer —
  Widget _vueDesactivee() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.lock_outline, size: 52, color: ChapColors.orange),
        const SizedBox(height: 14),
        Text(tr(context, 'g2fa.protegez'),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text(
          tr(context, 'g2fa.explication'),
          textAlign: TextAlign.center,
          style: TextStyle(color: ChapColors.gray600, height: 1.4),
        ),
        const SizedBox(height: 22),
        if (_erreur != null) ...[
          _bandeauErreur(_erreur!),
          const SizedBox(height: 12),
        ],
        ElevatedButton(
          onPressed: _enCours ? null : _preparer,
          child: _enCours ? _spinner() : Text(tr(context, 'g2fa.activer')),
        ),
      ],
    );
  }

  // — Configuration : QR + clé + saisie du premier code —
  Widget _vueConfiguration() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('1. Ajoutez Chap.ci à votre application',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          tr(context, 'g2fa.scannez'),
          style: const TextStyle(color: ChapColors.gray600, height: 1.4),
        ),
        const SizedBox(height: 16),
        if (_uri.isNotEmpty)
          Center(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: ChapColors.line2),
              ),
              child: QrImageView(
                data: _uri,
                version: QrVersions.auto,
                size: 200,
                backgroundColor: Colors.white,
              ),
            ),
          ),
        const SizedBox(height: 14),
        _cleARecopier(_secret),
        const SizedBox(height: 22),
        const Text('2. Entrez le code affiché',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        TextField(
          controller: _code,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: 8),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: const InputDecoration(counterText: '', hintText: '••••••'),
          onChanged: (v) {
            if (v.replaceAll(RegExp(r'[^0-9]'), '').length == 6) _activer();
          },
        ),
        if (_erreur != null) ...[
          const SizedBox(height: 10),
          Text(_erreur!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFFB42318))),
        ],
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _enCours ? null : _activer,
          child: _enCours ? _spinner() : Text(tr(context, 'g2fa.verifierActiver')),
        ),
      ],
    );
  }

  // — Codes de secours : à conserver —
  Widget _vueCodesSecours() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Icon(Icons.verified_outlined, size: 52, color: ChapColors.greenDark),
        const SizedBox(height: 14),
        Text(tr(context, 'g2fa.activeeTitre'),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text(
          tr(context, 'g2fa.conservez'),
          textAlign: TextAlign.center,
          style: TextStyle(color: ChapColors.gray600, height: 1.4),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: ChapColors.cream100.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ChapColors.line2),
          ),
          child: Column(
            children: [
              for (final c in _codesSecours)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(c,
                      style: const TextStyle(
                          fontSize: 16,
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                          color: ChapColors.gray900)),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: _codesSecours.join('\n')));
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(tr(context, 'g2fa.codesCopies'))));
          },
          icon: const Icon(Icons.copy, size: 18),
          label: Text(tr(context, 'g2fa.copierCodes')),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: () => setState(() => _etape = _Etape.activee),
          child: const Text('J’ai conservé mes codes'),
        ),
      ],
    );
  }

  // — Activée : possibilité de désactiver —
  Widget _vueActivee() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF7EF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ChapColors.greenDark.withValues(alpha: 0.4)),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified_user_outlined,
                  color: ChapColors.greenDark),
              const SizedBox(width: 10),
              Expanded(
                child: Text(tr(context, 'g2fa.estActivee'),
                    style: const TextStyle(
                        color: ChapColors.greenDark, height: 1.3)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text(tr(context, 'g2fa.desactiver'),
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          tr(context, 'g2fa.desactiverAide'),
          style: const TextStyle(color: ChapColors.gray600, height: 1.4),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _code,
          keyboardType: TextInputType.text,
          maxLength: 24,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 3),
          decoration: const InputDecoration(counterText: '', hintText: 'code'),
        ),
        if (_erreur != null) ...[
          const SizedBox(height: 10),
          Text(_erreur!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFFB42318))),
        ],
        const SizedBox(height: 14),
        OutlinedButton(
          onPressed: _enCours ? null : _desactiver,
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFB42318),
            side: const BorderSide(color: Color(0xFFB42318)),
            minimumSize: const Size.fromHeight(48),
          ),
          child: _enCours
              ? _spinner(couleur: const Color(0xFFB42318))
              : Text(tr(context, 'g2fa.desactiverBtn')),
        ),
      ],
    );
  }

  Widget _cleARecopier(String secret) {
    // La clé, groupée par 4 pour la lecture, avec un bouton « copier ».
    final groupe = <String>[];
    for (var i = 0; i < secret.length; i += 4) {
      groupe.add(secret.substring(i, i + 4 > secret.length ? secret.length : i + 4));
    }
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 6, 10),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(groupe.join(' '),
                style: const TextStyle(
                    fontSize: 15,
                    fontFamily: 'monospace',
                    letterSpacing: 1.5,
                    color: ChapColors.gray900)),
          ),
          IconButton(
            icon: const Icon(Icons.copy, size: 18, color: ChapColors.gray700),
            tooltip: tr(context, 'g2fa.copierCle'),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: secret));
              ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(tr(context, 'g2fa.cleCopiee'))));
            },
          ),
        ],
      ),
    );
  }

  Widget _bandeauErreur(String m) => Text(m,
      textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFB42318)));

  Widget _spinner({Color couleur = Colors.white}) => SizedBox(
      height: 20,
      width: 20,
      child: CircularProgressIndicator(strokeWidth: 2, color: couleur));
}
