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
  const ConversationScreen({
    super.key,
    required this.conversationId,
    required this.titre,
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

  @override
  void initState() {
    super.initState();
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
          _saisieBarre(),
        ],
      ),
    );
  }

  Widget _bulle(Msg m, bool mien) {
    return Align(
      alignment: mien ? Alignment.centerRight : Alignment.centerLeft,
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
            Text(m.body,
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
