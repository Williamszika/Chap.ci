import 'dart:async';
import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/messaging.dart';
import '../format.dart';
import '../theme.dart';

/// La conversation (le fil de discussion) acheteur ↔ vendeur.
///
/// Chargement des messages, envoi, et un rafraîchissement léger toutes les
/// 4 secondes — le « temps réel » du site se fait aussi par relève régulière.
class ConversationScreen extends StatefulWidget {
  final String conversationId;
  final String titre; // nom de l'autre, ou titre de l'annonce
  final bool bloqueInitial; // l'autre est-il déjà bloqué par moi ?
  final bool archiveInitial; // la conversation est-elle déjà archivée ?
  const ConversationScreen({
    super.key,
    required this.conversationId,
    required this.titre,
    this.bloqueInitial = false,
    this.archiveInitial = false,
  });

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  final _saisie = TextEditingController();
  List<Msg> _messages = [];
  String? _monId;
  bool _chargement = true;
  bool _envoi = false;
  String? _erreur;
  Timer? _minuteur;
  late bool _bloque;
  late bool _archive;

  @override
  void initState() {
    super.initState();
    _bloque = widget.bloqueInitial;
    _archive = widget.archiveInitial;
    _demarrer();
  }

  Future<void> _demarrer() async {
    _monId = await ApiClient.instance.monId();
    await _rafraichir();
    if (mounted) setState(() => _chargement = false);
    // Relève régulière tant que l'écran est ouvert.
    _minuteur = Timer.periodic(
        const Duration(seconds: 4), (_) => _rafraichir());
  }

  Future<void> _rafraichir() async {
    try {
      final m = await Msg.pour(widget.conversationId);
      if (mounted) setState(() => _messages = m);
    } catch (_) {/* silencieux : une relève ratée n'est pas grave */}
  }

  Future<void> _envoyer() async {
    final texte = _saisie.text.trim();
    if (texte.isEmpty || _envoi) return;
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      await Msg.envoyer(widget.conversationId, texte);
      _saisie.clear();
      await _rafraichir();
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  void dispose() {
    _minuteur?.cancel();
    _saisie.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.titre.isEmpty ? 'Discussion' : widget.titre,
            maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            tooltip: 'Options de la conversation',
            onPressed: _menuConversation,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _chargement
                ? const Center(
                    child:
                        CircularProgressIndicator(color: ChapColors.orange))
                : _messages.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(28),
                          child: Text(
                            'Écrivez le premier message.\nRestez sur Chap.ci et ne payez jamais d’avance.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: ChapColors.gray600),
                          ),
                        ),
                      )
                    : ListView.builder(
                        reverse: true,
                        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                        itemCount: _messages.length,
                        itemBuilder: (context, i) {
                          // reverse:true → l'index 0 est en bas : on prend la
                          // liste à l'envers pour avoir le plus récent en bas.
                          final m = _messages[_messages.length - 1 - i];
                          return _bulle(m, m.senderId == _monId);
                        },
                      ),
          ),
          _rappelSecurite(),
          if (_erreur != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Text(_erreur!,
                  style: const TextStyle(
                      color: Color(0xFFB42318), fontSize: 12.5)),
            ),
          _bloque ? _barreBloque() : _saisieBarre(),
        ],
      ),
    );
  }

  Widget _bulle(Msg m, bool mien) {
    return Align(
      alignment: mien ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        // Appui long : le menu d'actions (supprimer, archiver, bloquer, signaler).
        onLongPress: () => _menuMessage(m, mien),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 3),
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
          constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.76),
          decoration: BoxDecoration(
            color: mien ? ChapColors.orange : ChapColors.cream,
            border: mien ? null : Border.all(color: ChapColors.line),
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(14),
              topRight: const Radius.circular(14),
              bottomLeft: Radius.circular(mien ? 14 : 4),
              bottomRight: Radius.circular(mien ? 4 : 14),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              m.deleted
                  ? Text('Message supprimé',
                      style: TextStyle(
                          fontSize: 13.5,
                          fontStyle: FontStyle.italic,
                          color: mien ? Colors.white70 : ChapColors.gray500))
                  : Text(m.body,
                      style: TextStyle(
                          fontSize: 14.5,
                          height: 1.3,
                          color: mien ? Colors.white : ChapColors.gray900)),
              const SizedBox(height: 2),
              Text(heureCourte(m.createdAt),
                  style: TextStyle(
                      fontSize: 10,
                      color: mien ? Colors.white70 : ChapColors.gray500)),
            ],
          ),
        ),
      ),
    );
  }

  // ---- Feuille d'actions (bas d'écran) : socle partagé ---------------------
  void _feuille(List<Widget> Function(BuildContext) contenu) {
    showModalBottomSheet(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            ...contenu(ctx),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // Actions au niveau de la CONVERSATION (archiver, bloquer, signaler, supprimer).
  List<Widget> _optionsConversation(BuildContext ctx) => [
        _option(
            _archive ? Icons.unarchive_outlined : Icons.archive_outlined,
            _archive
                ? 'Désarchiver la conversation'
                : 'Archiver la conversation', () {
          Navigator.pop(ctx);
          _basculerArchive();
        }),
        _option(
            _bloque ? Icons.lock_open_outlined : Icons.block_outlined,
            _bloque ? 'Débloquer la personne' : 'Bloquer la personne', () {
          Navigator.pop(ctx);
          _basculerBlocage();
        }),
        _option(Icons.flag_outlined, 'Signaler la conversation', () {
          Navigator.pop(ctx);
          _signaler();
        }, danger: true),
        _option(Icons.delete_sweep_outlined, 'Supprimer la conversation', () {
          Navigator.pop(ctx);
          _supprimerConversation();
        }, danger: true),
      ];

  // Bouton « ⋮ » de l'en-tête : les actions de conversation, sans viser un message.
  void _menuConversation() => _feuille(_optionsConversation);

  // Appui long sur un message : « Supprimer le message » (le sien) + les actions
  // de conversation.
  void _menuMessage(Msg m, bool mien) => _feuille((ctx) => [
        if (mien && !m.deleted)
          _option(Icons.delete_outline, 'Supprimer le message', () {
            Navigator.pop(ctx);
            _supprimerMessage(m);
          }),
        ..._optionsConversation(ctx),
      ]);

  Widget _option(IconData icone, String texte, VoidCallback onTap,
      {bool danger = false}) {
    final couleur = danger ? const Color(0xFFB42318) : ChapColors.gray900;
    return ListTile(
      leading: Icon(icone, color: couleur),
      title: Text(texte, style: TextStyle(color: couleur)),
      onTap: onTap,
    );
  }

  Future<bool> _confirmer(String titre, String message, String bouton) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(titre),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Annuler')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(bouton,
                  style: const TextStyle(color: Color(0xFFB42318)))),
        ],
      ),
    );
    return ok ?? false;
  }

  void _toast(String texte) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(texte)));
  }

  Future<void> _supprimerMessage(Msg m) async {
    if (!await _confirmer('Supprimer le message',
        'Il disparaîtra pour vous et pour l’autre personne.', 'Supprimer')) {
      return;
    }
    try {
      await Msg.supprimer(widget.conversationId, m.id);
      await _rafraichir();
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> _supprimerConversation() async {
    if (!await _confirmer(
        'Supprimer la conversation',
        'Elle disparaîtra de VOTRE côté. L’autre personne garde la sienne.',
        'Supprimer')) {
      return;
    }
    try {
      await Conversation.supprimer(widget.conversationId);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> _basculerArchive() async {
    final nouvel = !_archive;
    try {
      await Conversation.archiver(widget.conversationId, nouvel);
      _toast(nouvel ? 'Conversation archivée.' : 'Conversation désarchivée.');
      // On revient à la liste, qui se retrie (archivées vs actives).
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  Future<void> _basculerBlocage() async {
    try {
      final etat = await Conversation.bloquer(widget.conversationId, !_bloque);
      if (mounted) setState(() => _bloque = etat);
      _toast(etat ? 'Personne bloquée.' : 'Personne débloquée.');
    } on ApiException catch (e) {
      _toast(e.message);
    }
  }

  // ---- Signalement : cases à cocher + détail libre → modération ------------
  void _signaler() {
    final motifs = <String, bool>{
      'Spam': false,
      'Harcèlement': false,
      'Arnaque / fraude': false,
      'Contenu choquant': false,
      'Autre': false,
    };
    final detail = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 18, 20, 20 + MediaQuery.of(ctx).viewInsets.bottom),
        child: StatefulBuilder(
          builder: (ctx, setSheet) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Signaler la conversation',
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              const Text('Choisissez un ou plusieurs motifs.',
                  style: TextStyle(color: ChapColors.gray600)),
              const SizedBox(height: 8),
              for (final k in motifs.keys)
                CheckboxListTile(
                  value: motifs[k],
                  onChanged: (v) => setSheet(() => motifs[k] = v ?? false),
                  title: Text(k),
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  dense: true,
                  activeColor: ChapColors.orange,
                ),
              const SizedBox(height: 8),
              TextField(
                controller: detail,
                minLines: 2,
                maxLines: 4,
                maxLength: 500,
                decoration: const InputDecoration(
                  hintText: 'Détails (facultatif)…',
                  isDense: true,
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final choisis = motifs.entries
                        .where((e) => e.value)
                        .map((e) => e.key)
                        .toList();
                    if (choisis.isEmpty) {
                      ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
                          content: Text('Choisissez au moins un motif.')));
                      return;
                    }
                    Navigator.pop(ctx);
                    try {
                      await Conversation.signaler(
                          widget.conversationId, choisis, detail.text.trim());
                      _toast('Signalement envoyé. Merci.');
                    } on ApiException catch (e) {
                      _toast(e.message);
                    }
                  },
                  child: const Text('Envoyer le signalement'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _barreBloque() {
    return SafeArea(
      top: false,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: const BoxDecoration(
          color: ChapColors.cream,
          border: Border(top: BorderSide(color: ChapColors.line)),
        ),
        child: Row(
          children: [
            const Expanded(
              child: Text(
                  'Vous avez bloqué cette personne. Débloquez-la pour lui écrire.',
                  style: TextStyle(fontSize: 12.5, color: ChapColors.gray600)),
            ),
            TextButton(
                onPressed: _basculerBlocage, child: const Text('Débloquer')),
          ],
        ),
      ),
    );
  }

  Widget _rappelSecurite() {
    return Container(
      width: double.infinity,
      color: const Color(0xFFFFF4E0),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      child: const Text(
        '🔒 Restez sur Chap.ci et vérifiez le produit avant de payer.',
        style: TextStyle(fontSize: 11.5, color: ChapColors.ocreDark),
      ),
    );
  }

  Widget _saisieBarre() {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
        decoration: const BoxDecoration(
          color: ChapColors.cream,
          border: Border(top: BorderSide(color: ChapColors.line)),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _saisie,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  hintText: 'Votre message…',
                  isDense: true,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Material(
              color: ChapColors.orange,
              shape: const CircleBorder(),
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: _envoi ? null : _envoyer,
                child: Padding(
                  padding: const EdgeInsets.all(11),
                  child: _envoi
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.send, color: Colors.white, size: 18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
