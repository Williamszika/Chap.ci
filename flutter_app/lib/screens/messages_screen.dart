import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/messaging.dart';
import '../api/models.dart';
import '../format.dart';
import '../theme.dart';
import 'conversation_screen.dart';

/// Onglet Messages — la liste de mes conversations.
///
/// Non connecté : on l'explique et on renvoie vers l'onglet Compte. Connecté :
/// la liste, avec le dernier message et un repère « non lu ».
class MessagesScreen extends StatefulWidget {
  /// Pour envoyer l'utilisateur vers l'onglet Compte (se connecter).
  final VoidCallback? onVersCompte;
  const MessagesScreen({super.key, this.onVersCompte});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  Future<List<Conversation>>? _futur;
  String? _monId;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  void _charger() {
    if (ApiClient.instance.connecte) {
      _futur = Conversation.mes();
      ApiClient.instance.monId().then((id) {
        if (mounted) setState(() => _monId = id);
      });
    }
  }

  Future<void> _recharger() async {
    setState(() => _futur = Conversation.mes());
    await _futur;
  }

  @override
  Widget build(BuildContext context) {
    // Connexion faite après l'ouverture de l'onglet (IndexedStack garde l'écran
    // en vie) : on initialise la liste au premier build connecté.
    if (ApiClient.instance.connecte && _futur == null) _charger();
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: !ApiClient.instance.connecte
          ? _nonConnecte()
          : FutureBuilder<List<Conversation>>(
              future: _futur,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator(
                          color: ChapColors.orange));
                }
                final all = snap.data ?? const <Conversation>[];
                final active = all.where((c) => !c.archived).toList();
                final archivees = all.where((c) => c.archived).toList();
                final aArchives = archivees.isNotEmpty;
                return RefreshIndicator(
                  color: ChapColors.orange,
                  onRefresh: _recharger,
                  child: (active.isEmpty && !aArchives)
                      ? ListView(children: const [
                          SizedBox(height: 120),
                          Icon(Icons.forum_outlined,
                              size: 46, color: ChapColors.line2),
                          SizedBox(height: 12),
                          Text('Aucune conversation',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: ChapColors.gray900)),
                          SizedBox(height: 6),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 40),
                            child: Text(
                              'Contactez un vendeur depuis une annonce pour démarrer une discussion.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: ChapColors.gray600),
                            ),
                          ),
                        ])
                      : ListView.separated(
                          itemCount: active.length + (aArchives ? 1 : 0),
                          separatorBuilder: (_, __) => const Divider(
                              height: 1, color: ChapColors.line),
                          itemBuilder: (context, i) {
                            if (aArchives && i == 0) {
                              return _tuileArchives(archivees);
                            }
                            return _ligne(active[i - (aArchives ? 1 : 0)]);
                          },
                        ),
                );
              },
            ),
    );
  }

  Widget _ligne(Conversation c) {
    final titre = (c.otherName?.trim().isNotEmpty ?? false)
        ? c.otherName!
        : (c.listingTitle?.trim().isNotEmpty ?? false)
            ? c.listingTitle!
            : 'Conversation';
    final nonLu = c.lastSenderId != null &&
        _monId != null &&
        c.lastSenderId != _monId;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(width: 48, height: 48, child: _vignette(c)),
      ),
      title: Text(titre,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
              fontWeight: FontWeight.w700, color: ChapColors.gray900)),
      subtitle: Text(
        c.lastMessage?.trim().isNotEmpty == true
            ? c.lastMessage!
            : (c.listingTitle ?? 'Nouvelle conversation'),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 13,
          color: nonLu ? ChapColors.gray900 : ChapColors.gray600,
          fontWeight: nonLu ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (c.lastAt != null)
            Text(tempsEcoule(c.lastAt!),
                style:
                    const TextStyle(fontSize: 11, color: ChapColors.gray500)),
          if (nonLu) ...[
            const SizedBox(height: 5),
            Container(
                width: 9,
                height: 9,
                decoration: const BoxDecoration(
                    color: ChapColors.orange, shape: BoxShape.circle)),
          ],
        ],
      ),
      onTap: () async {
        await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => ConversationScreen(
            conversationId: c.id,
            titre: titre,
            bloqueInitial: c.blockedByMe,
            archiveInitial: c.archived,
            // L'autre personne = celui des deux participants qui n'est pas moi.
            autreId: c.buyerId == _monId ? c.sellerId : c.buyerId,
          ),
        ));
        _recharger(); // au retour, le dernier message / l'état a pu changer
      },
    );
  }

  /// Accès aux conversations archivées (masquées de la liste principale).
  Widget _tuileArchives(List<Conversation> archivees) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      leading: const SizedBox(
        width: 48,
        height: 48,
        child: Icon(Icons.archive_outlined, color: ChapColors.gray600),
      ),
      title: Text('Conversations archivées (${archivees.length})',
          style: const TextStyle(
              fontWeight: FontWeight.w700, color: ChapColors.gray900)),
      trailing: const Icon(Icons.chevron_right, color: ChapColors.gray500),
      onTap: () async {
        await Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Archivées')),
            body: ListView.separated(
              itemCount: archivees.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: ChapColors.line),
              itemBuilder: (context, i) => _ligne(archivees[i]),
            ),
          ),
        ));
        _recharger();
      },
    );
  }

  Widget _vignette(Conversation c) {
    final img = c.listingImage;
    if (img == null || img.isEmpty) {
      return Container(
        color: ChapColors.cream100,
        child: const Icon(Icons.chat_bubble_outline,
            color: ChapColors.line2, size: 20),
      );
    }
    final src = ImageSource.resoudre(img);
    if (src.bytes != null) return Image.memory(src.bytes!, fit: BoxFit.cover);
    if (src.url != null) {
      return Image.network(src.url!,
          fit: BoxFit.cover,
          errorBuilder: (c, e, s) => Container(color: ChapColors.cream100));
    }
    return Container(color: ChapColors.cream100);
  }

  Widget _nonConnecte() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 46, color: ChapColors.line2),
            const SizedBox(height: 12),
            const Text('Connectez-vous pour voir vos messages',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: ChapColors.gray900)),
            const SizedBox(height: 16),
            SizedBox(
              width: 200,
              child: ElevatedButton(
                onPressed: widget.onVersCompte,
                child: const Text('Aller à mon compte'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
