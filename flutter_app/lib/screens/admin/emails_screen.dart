import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../theme.dart';

/// Les réglages d'envoi d'e-mails (SMTP) — réservés au propriétaire.
///
/// C'est ce qui décide comment partent les e-mails du site (bienvenue,
/// notifications, code de connexion…). Sans SMTP, le serveur retombe sur son
/// `mail()`, souvent bloqué ou classé en spam en hébergement mutualisé.
///
/// Le mot de passe de la boîte est un **secret** : le serveur ne le renvoie
/// jamais, l'app ne l'affiche jamais et ne le garde pas — il ne vit que le
/// temps d'être tapé, puis part (en HTTPS) à l'enregistrement.
class EmailsScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : réglages fournis, sans réseau.
  final ReglagesSmtp? apercu;
  const EmailsScreen({super.key, this.apercu});
  @override
  State<EmailsScreen> createState() => _EmailsScreenState();
}

class _EmailsScreenState extends State<EmailsScreen> {
  final _hote = TextEditingController();
  final _port = TextEditingController();
  final _user = TextEditingController();
  final _pass = TextEditingController();
  String _securite = 'ssl';
  bool _voirPass = false;

  ReglagesSmtp? _reglages;
  String? _erreur;
  bool _enregistre = false;
  bool _teste = false;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _appliquer(widget.apercu!);
    } else {
      _charger();
    }
  }

  @override
  void dispose() {
    _hote.dispose();
    _port.dispose();
    _user.dispose();
    _pass.dispose();
    super.dispose();
  }

  void _appliquer(ReglagesSmtp r) {
    _reglages = r;
    _hote.text = r.hote;
    _port.text = r.port;
    _user.text = r.utilisateur;
    _securite = (r.securite == 'tls') ? 'tls' : 'ssl';
    // Le mot de passe n'est jamais renvoyé : on ne le pré-remplit pas.
  }

  Future<void> _charger() async {
    try {
      final r = await AdminApi.smtp();
      if (mounted) {
        setState(() {
          _appliquer(r);
          _erreur = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  bool _emailValide(String v) =>
      RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);

  void _dire(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _enregistrer() async {
    final user = _user.text.trim();
    final pass = _pass.text;
    // Les mêmes gardes que le serveur, dites tout de suite et en clair.
    if (!_emailValide(user)) {
      _dire('Utilisateur SMTP (e-mail) invalide.');
      return;
    }
    if (pass.isEmpty) {
      _dire('Renseignez le mot de passe de la boîte e-mail.');
      return;
    }
    setState(() => _enregistre = true);
    try {
      await AdminApi.enregistrerSmtp(
        hote: _hote.text,
        port: _port.text,
        securite: _securite,
        utilisateur: user,
        motDePasse: pass,
      );
      _pass.clear();
      if (mounted) setState(() => _enregistre = false);
      _dire('Réglages enregistrés. Envoyez un e-mail de test pour vérifier.');
      await _charger();
    } on ApiException catch (e) {
      if (mounted) setState(() => _enregistre = false);
      _dire(e.message);
    }
  }

  Future<void> _tester() async {
    setState(() => _teste = true);
    try {
      final r = await AdminApi.testerEmail();
      if (!mounted) return;
      setState(() => _teste = false);
      final voie = r.voie == 'smtp' ? 'SMTP' : 'le mail() du serveur';
      _dire(r.envoye
          ? 'E-mail de test envoyé à ${r.destinataire} (via $voie). Regardez votre boîte.'
          : 'L’envoi a échoué (via $voie). Vérifiez les réglages ci-dessus.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _teste = false);
      _dire(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = _reglages;
    return Scaffold(
      appBar: AppBar(title: const Text('E-mails')),
      body: r == null
          ? _centre(_erreur)
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                const Text(
                  'Comment partent les e-mails du site (bienvenue, notifications, '
                  'code de connexion). Réservé à vous, le propriétaire.',
                  style: TextStyle(color: ChapColors.gray600, height: 1.35),
                ),
                const SizedBox(height: 14),
                _etat(r.configure),
                const SizedBox(height: 18),
                _champ(_hote, 'Hôte', 'mail.chap.ci',
                    clavier: TextInputType.url),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 120,
                      child: _champ(_port, 'Port', '465',
                          clavier: TextInputType.number),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: _securiteSelecteur()),
                  ],
                ),
                const SizedBox(height: 12),
                _champ(_user, 'Utilisateur (e-mail)', 'no-reply@chap.ci',
                    clavier: TextInputType.emailAddress),
                const SizedBox(height: 12),
                _champMotDePasse(),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: _enregistre ? null : _enregistrer,
                  icon: _enregistre
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.save_outlined, size: 20),
                  label: Text(_enregistre ? 'Enregistrement…' : 'Enregistrer'),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _teste ? null : _tester,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ChapColors.orangeDark,
                    side: const BorderSide(color: ChapColors.line2),
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: _teste
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: ChapColors.orangeDark))
                      : const Icon(Icons.send_outlined, size: 20),
                  label: Text(_teste
                      ? 'Envoi en cours…'
                      : 'Envoyer un e-mail de test'),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Le test part à votre propre adresse, avec les réglages '
                  'enregistrés. Enregistrez d’abord, puis testez.',
                  style: TextStyle(fontSize: 12.5, color: ChapColors.gray500),
                ),
              ],
            ),
    );
  }

  Widget _etat(bool configure) {
    final vert = configure;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: vert ? const Color(0xFFEAF7F0) : ChapColors.cream100,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: vert ? ChapColors.green : ChapColors.orangeLight),
      ),
      child: Row(
        children: [
          Icon(vert ? Icons.check_circle : Icons.info_outline,
              size: 22,
              color: vert ? ChapColors.greenDark : ChapColors.orangeDark),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              vert
                  ? 'Envoi par SMTP configuré. Vos e-mails partent par la boîte ci-dessous.'
                  : 'Aucun SMTP : le site utilise le mail() du serveur, souvent bloqué ou classé en spam.',
              style: TextStyle(
                fontSize: 13,
                height: 1.3,
                fontWeight: FontWeight.w600,
                color: vert ? ChapColors.greenDark : ChapColors.ocreDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _champ(TextEditingController c, String label, String indice,
      {TextInputType? clavier}) {
    return TextField(
      controller: c,
      keyboardType: clavier,
      style: const TextStyle(color: ChapColors.gray900),
      decoration: InputDecoration(
        labelText: label,
        hintText: indice,
        isDense: true,
      ),
    );
  }

  Widget _champMotDePasse() {
    return TextField(
      controller: _pass,
      obscureText: !_voirPass,
      style: const TextStyle(color: ChapColors.gray900),
      decoration: InputDecoration(
        labelText: 'Mot de passe',
        hintText: _reglages?.configure == true
            ? 'Jamais affiché — retapez-le pour enregistrer'
            : 'Mot de passe de la boîte',
        helperText:
            'Jamais affiché ni gardé sur le téléphone, pour votre sécurité.',
        helperMaxLines: 2,
        isDense: true,
        suffixIcon: IconButton(
          icon: Icon(_voirPass ? Icons.visibility_off : Icons.visibility,
              size: 20, color: ChapColors.gray500),
          tooltip: _voirPass ? 'Masquer' : 'Afficher',
          onPressed: () => setState(() => _voirPass = !_voirPass),
        ),
      ),
    );
  }

  Widget _securiteSelecteur() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 6),
          child: Text('Sécurité',
              style: TextStyle(fontSize: 13, color: ChapColors.gray600)),
        ),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'ssl', label: Text('SSL')),
            ButtonSegment(value: 'tls', label: Text('TLS')),
          ],
          selected: {_securite},
          onSelectionChanged: (s) => setState(() => _securite = s.first),
          showSelectedIcon: false,
          style: ButtonStyle(
            visualDensity: VisualDensity.compact,
            backgroundColor: WidgetStateProperty.resolveWith((st) =>
                st.contains(WidgetState.selected)
                    ? ChapColors.orange
                    : ChapColors.cream),
            foregroundColor: WidgetStateProperty.resolveWith((st) =>
                st.contains(WidgetState.selected)
                    ? Colors.white
                    : ChapColors.gray700),
          ),
        ),
      ],
    );
  }

  Widget _centre(String? m) => ListView(children: [
        const SizedBox(height: 120),
        Center(
          child: m == null
              ? const CircularProgressIndicator(color: ChapColors.orange)
              : Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(m,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: ChapColors.gray600)),
                ),
        ),
      ]);
}
