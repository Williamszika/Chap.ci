import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// La supervision des conversations : qui parle à qui, sur quelle annonce,
/// combien de messages, et le dernier message. Lecture seule — de quoi repérer
/// un échange à surveiller, sans lire par-dessus l'épaule des membres au
/// quotidien.
class ConversationsScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : conversations fournies, sans réseau.
  final List<ConversationAdmin>? apercu;
  const ConversationsScreen({super.key, this.apercu});
  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  List<ConversationAdmin>? _tous;
  String? _erreur;
  String _recherche = '';

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
      final l = await AdminApi.conversations();
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

  List<ConversationAdmin> get _filtres {
    final tous = _tous ?? const <ConversationAdmin>[];
    final q = _recherche.trim().toLowerCase();
    if (q.isEmpty) return tous;
    bool contient(String? s) => (s ?? '').toLowerCase().contains(q);
    return tous
        .where((c) =>
            contient(c.acheteurEmail) ||
            contient(c.vendeurEmail) ||
            contient(c.annonceTitre) ||
            contient(c.dernierMessage))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Conversations')),
      body: tous == null
          ? _centre(_erreur)
          : Column(
              children: [
                if (tous.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 2),
                    child: Text(
                      '${tous.length} conversation${tous.length > 1 ? 's' : ''}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, color: ChapColors.gray900),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
                  child: TextField(
                    onChanged: (v) => setState(() => _recherche = v),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search, size: 20),
                      hintText: 'Chercher un membre, une annonce…',
                      isDense: true,
                    ),
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

  Widget _liste() {
    final list = _filtres;
    if (list.isEmpty) {
      return _centre((_tous ?? const []).isEmpty
          ? 'Aucune conversation pour l’instant.'
          : 'Aucune conversation ne correspond.');
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _carte(list[i]),
    );
  }

  Widget _carte(ConversationAdmin c) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(c.annonceTitre ?? 'Annonce supprimée',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: c.annonceTitre != null
                          ? ChapColors.gray900
                          : ChapColors.gray500,
                      fontStyle:
                          c.annonceTitre != null ? FontStyle.normal : FontStyle.italic,
                    )),
              ),
              const SizedBox(width: 8),
              _compteur(c.messages),
            ],
          ),
          const SizedBox(height: 8),
          _partie(Icons.person_outline, 'Acheteur', c.acheteurEmail),
          _partie(Icons.storefront_outlined, 'Vendeur', c.vendeurEmail),
          if (c.dernierMessage != null && c.dernierMessage!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
              decoration: BoxDecoration(
                color: ChapColors.cream100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                c.dernierMessage!,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13, height: 1.3, color: ChapColors.gray700),
              ),
            ),
          ],
          const SizedBox(height: 6),
          Text(tempsEcoule(c.cree),
              style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
        ],
      ),
    );
  }

  Widget _compteur(int n) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: ChapColors.cream100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.chat_bubble_outline, size: 13, color: ChapColors.gray600),
            const SizedBox(width: 4),
            Text('$n',
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w700, color: ChapColors.gray700)),
          ],
        ),
      );

  Widget _partie(IconData icone, String role, String? email) => Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Row(
          children: [
            Icon(icone, size: 15, color: ChapColors.gray500),
            const SizedBox(width: 6),
            Text('$role : ',
                style: const TextStyle(fontSize: 12.5, color: ChapColors.gray500)),
            Expanded(
              child: Text(email ?? '—',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12.5, color: ChapColors.gray700)),
            ),
          ],
        ),
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
