import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// La boîte du formulaire de contact : ce que les visiteurs vous écrivent.
///
/// Les non-traités remontent en premier. On ouvre un message pour le lire, y
/// **répondre** (l'e-mail part de `contact@chap.ci`, la suite se passe par
/// e-mail), le marquer traité ou le supprimer.
class ContactScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : messages fournis, sans réseau.
  final List<MessageContact>? apercu;
  const ContactScreen({super.key, this.apercu});
  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  List<MessageContact>? _tous;
  String? _erreur;
  bool _seulementATraiter = true;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _tous = widget.apercu;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    try {
      final l = await AdminApi.messagesContact();
      if (mounted) {
        setState(() {
          _tous = l;
          _erreur = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  int get _nbATraiter =>
      (_tous ?? const <MessageContact>[]).where((m) => !m.traite).length;

  List<MessageContact> get _filtres {
    final tous = _tous ?? const <MessageContact>[];
    if (_seulementATraiter) return tous.where((m) => !m.traite).toList();
    return tous;
  }

  Future<void> _ouvrir(MessageContact m) async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => _DetailContact(message: m)));
    // Le détail a pu répondre, marquer ou supprimer : on relit l'état réel.
    if (widget.apercu == null) await _charger();
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Messages de contact')),
      body: tous == null
          ? _centre(_erreur)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
                  child: Row(
                    children: [
                      _filtre('À traiter ($_nbATraiter)', _seulementATraiter,
                          () => setState(() => _seulementATraiter = true)),
                      const SizedBox(width: 8),
                      _filtre('Tous (${tous.length})', !_seulementATraiter,
                          () => setState(() => _seulementATraiter = false)),
                    ],
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    color: ChapColors.orange,
                    onRefresh: _charger,
                    child: _liste(),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _filtre(String texte, bool actif, VoidCallback onTap) {
    return ChoiceChip(
      label: Text(texte),
      selected: actif,
      onSelected: (_) => onTap(),
      selectedColor: ChapColors.orange,
      backgroundColor: ChapColors.cream,
      labelStyle: TextStyle(
        fontWeight: FontWeight.w600,
        color: actif ? Colors.white : ChapColors.gray700,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: actif ? ChapColors.orange : ChapColors.line2),
      ),
    );
  }

  Widget _liste() {
    final list = _filtres;
    if (list.isEmpty) {
      return _centre(_seulementATraiter
          ? 'Aucun message en attente — vous êtes à jour.'
          : 'Aucun message de contact pour l’instant.');
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 24),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _carte(list[i]),
    );
  }

  Widget _carte(MessageContact m) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => _ouvrir(m),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: m.traite ? ChapColors.line2 : ChapColors.orangeLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(m.sujet,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, color: ChapColors.gray900)),
                ),
                const SizedBox(width: 8),
                if (m.aRepondu)
                  _badge('Répondu', ChapColors.greenDark, const Color(0xFFEAF7F0))
                else if (m.traite)
                  _badge('Traité', ChapColors.gray600, ChapColors.cream100)
                else
                  _badge('Nouveau', ChapColors.orangeDark, ChapColors.cream100),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              [if (m.nom != null && m.nom!.isNotEmpty) m.nom!, m.email ?? '']
                  .where((s) => s.isNotEmpty)
                  .join(' · '),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12.5, color: ChapColors.gray600),
            ),
            const SizedBox(height: 6),
            Text(m.message,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13, height: 1.3, color: ChapColors.gray700)),
            const SizedBox(height: 6),
            Text(tempsEcoule(m.cree),
                style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
          ],
        ),
      ),
    );
  }

  Widget _badge(String t, Color fg, Color bg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: fg.withValues(alpha: 0.35)),
        ),
        child: Text(t,
            style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
      );

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

/// Lire un message et y répondre.
class _DetailContact extends StatefulWidget {
  final MessageContact message;
  const _DetailContact({required this.message});
  @override
  State<_DetailContact> createState() => _DetailContactState();
}

class _DetailContactState extends State<_DetailContact> {
  final _reponse = TextEditingController();
  late MessageContact _m;
  bool _envoi = false;
  bool _brouillon = false;

  @override
  void initState() {
    super.initState();
    _m = widget.message;
  }

  @override
  void dispose() {
    _reponse.dispose();
    super.dispose();
  }

  void _dire(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _proposer() async {
    setState(() => _brouillon = true);
    try {
      final texte = await AdminApi.brouillonReponse(_m.id);
      if (!mounted) return;
      setState(() {
        _brouillon = false;
        if (texte.isNotEmpty) _reponse.text = texte;
      });
      if (texte.isEmpty) _dire('Aucun brouillon proposé.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _brouillon = false);
      _dire(e.message);
    }
  }

  Future<void> _repondre() async {
    final corps = _reponse.text.trim();
    if (corps.isEmpty) {
      _dire('Écrivez votre réponse avant d’envoyer.');
      return;
    }
    setState(() => _envoi = true);
    try {
      await AdminApi.repondreContact(_m.id, corps);
      if (!mounted) return;
      setState(() {
        _envoi = false;
        // Reflète tout de suite l'état renvoyé par le serveur (traité + archivé).
        _m = MessageContact(
          id: _m.id,
          sujet: _m.sujet,
          message: _m.message,
          nom: _m.nom,
          email: _m.email,
          reponse: corps,
          reponduPar: 'vous',
          traite: true,
          cree: _m.cree,
          reponduLe: _m.reponduLe,
        );
      });
      _dire('Réponse envoyée à ${_m.email}.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _envoi = false);
      _dire(e.message);
    }
  }

  Future<void> _marquer() async {
    try {
      await AdminApi.marquerContact(_m.id, !_m.traite);
      if (!mounted) return;
      final nouveau = !_m.traite;
      setState(() {
        _m = MessageContact(
          id: _m.id,
          sujet: _m.sujet,
          message: _m.message,
          nom: _m.nom,
          email: _m.email,
          reponse: _m.reponse,
          reponduPar: _m.reponduPar,
          traite: nouveau,
          cree: _m.cree,
          reponduLe: _m.reponduLe,
        );
      });
      _dire(nouveau ? 'Marqué traité.' : 'Rouvert.');
    } on ApiException catch (e) {
      _dire(e.message);
    }
  }

  Future<void> _supprimer() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Supprimer ce message ?'),
        content: const Text('Il sera retiré définitivement de la boîte.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await AdminApi.supprimerContact(_m.id);
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      _dire(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = _m;
    final de = [if (m.nom != null && m.nom!.isNotEmpty) m.nom!, m.email ?? '']
        .where((s) => s.isNotEmpty)
        .join(' · ');
    return Scaffold(
      appBar: AppBar(
        title: const Text('Message'),
        actions: [
          IconButton(
            tooltip: m.traite ? 'Rouvrir' : 'Marquer traité',
            icon: Icon(m.traite ? Icons.mark_email_unread_outlined : Icons.done),
            onPressed: _marquer,
          ),
          IconButton(
            tooltip: 'Supprimer',
            icon: const Icon(Icons.delete_outline),
            onPressed: _supprimer,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          Text(m.sujet,
              style: const TextStyle(
                  fontSize: 18, fontWeight: FontWeight.w800, color: ChapColors.gray900)),
          const SizedBox(height: 4),
          Text('$de · ${tempsEcoule(m.cree)}',
              style: const TextStyle(fontSize: 12.5, color: ChapColors.gray600)),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: ChapColors.cream,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ChapColors.line2),
            ),
            child: Text(m.message,
                style: const TextStyle(
                    fontSize: 14, height: 1.4, color: ChapColors.gray900)),
          ),
          const SizedBox(height: 18),
          if (m.aRepondu)
            _reponseEnvoyee(m)
          else if ((m.email ?? '').isEmpty)
            _sansAdresse()
          else
            _composer(m),
        ],
      ),
    );
  }

  Widget _reponseEnvoyee(MessageContact m) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7F0),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.green),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle, size: 18, color: ChapColors.greenDark),
              const SizedBox(width: 8),
              Text(
                m.reponduPar != null && m.reponduPar!.isNotEmpty
                    ? 'Réponse envoyée par ${m.reponduPar}'
                    : 'Réponse envoyée',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, color: ChapColors.greenDark),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(m.reponse ?? '',
              style: const TextStyle(
                  fontSize: 13.5, height: 1.4, color: ChapColors.gray900)),
        ],
      ),
    );
  }

  Widget _sansAdresse() => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ChapColors.cream100,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ChapColors.orangeLight),
        ),
        child: const Text(
          'Ce message n’a pas d’adresse e-mail : impossible d’y répondre depuis '
          'ici. Vous pouvez le marquer traité.',
          style: TextStyle(color: ChapColors.ocreDark, height: 1.3),
        ),
      );

  Widget _composer(MessageContact m) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text('Votre réponse',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: ChapColors.gray900)),
            ),
            TextButton.icon(
              onPressed: _brouillon ? null : _proposer,
              icon: _brouillon
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.auto_awesome, size: 16),
              label: const Text('Proposer'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        TextField(
          controller: _reponse,
          minLines: 5,
          maxLines: 12,
          textCapitalization: TextCapitalization.sentences,
          style: const TextStyle(color: ChapColors.gray900, height: 1.35),
          decoration: const InputDecoration(
            hintText: 'Bonjour, merci de votre message…',
            alignLabelWithHint: true,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'L’e-mail part de contact@chap.ci, avec votre signature et le message '
          'd’origine cité. ${m.email} pourra répondre directement.',
          style: const TextStyle(fontSize: 12, color: ChapColors.gray500, height: 1.3),
        ),
        const SizedBox(height: 14),
        ElevatedButton.icon(
          onPressed: _envoi ? null : _repondre,
          icon: _envoi
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.send_outlined, size: 20),
          label: Text(_envoi ? 'Envoi…' : 'Envoyer la réponse'),
        ),
      ],
    );
  }
}
