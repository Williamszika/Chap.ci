import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Les abonnés à la newsletter : combien, qui, depuis quand — et un export
/// **CSV** partageable (vers un tableur ou un outil d'e-mailing). La liste ne
/// quitte le serveur que sur votre geste, et ne reste jamais sur le téléphone.
class NewsletterScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : liste fournie, sans réseau.
  final List<Abonne>? apercu;
  const NewsletterScreen({super.key, this.apercu});
  @override
  State<NewsletterScreen> createState() => _NewsletterScreenState();
}

class _NewsletterScreenState extends State<NewsletterScreen> {
  List<Abonne>? _tous;
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
      final l = await AdminApi.newsletter();
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

  List<Abonne> get _filtres {
    final tous = _tous ?? const <Abonne>[];
    final q = _recherche.trim().toLowerCase();
    if (q.isEmpty) return tous;
    return tous.where((a) => a.email.toLowerCase().contains(q)).toList();
  }

  String _csv() {
    final b = StringBuffer('email,inscrit_le\n');
    for (final a in (_tous ?? const <Abonne>[])) {
      final date = a.cree > 0
          ? DateTime.fromMillisecondsSinceEpoch(a.cree).toUtc().toIso8601String()
          : '';
      // On échappe les guillemets, au cas très improbable où un e-mail en aurait.
      final email = a.email.replaceAll('"', '""');
      b.writeln('"$email","$date"');
    }
    return b.toString();
  }

  Future<void> _exporter() async {
    final tous = _tous ?? const <Abonne>[];
    if (tous.isEmpty) return;
    try {
      final octets = Uint8List.fromList(utf8.encode(_csv()));
      final n = DateTime.now().toUtc();
      String d2(int v) => v.toString().padLeft(2, '0');
      final nom = 'newsletter-chapci-${n.year}-${d2(n.month)}-${d2(n.day)}.csv';
      await SharePlus.instance.share(ShareParams(
        files: [XFile.fromData(octets, mimeType: 'text/csv', name: nom)],
        fileNameOverrides: [nom],
        subject: 'Abonnés newsletter Chap.ci (${tous.length})',
      ));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Le partage a été annulé ou a échoué.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Newsletter'),
        actions: [
          if (tous != null && tous.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.ios_share),
              tooltip: 'Exporter en CSV',
              onPressed: _exporter,
            ),
        ],
      ),
      body: Column(
        children: [
          if (tous != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: Row(
                children: [
                  const Icon(Icons.mail_outline, size: 20, color: ChapColors.orangeDark),
                  const SizedBox(width: 8),
                  Text(
                    tous.isEmpty
                        ? 'Aucun abonné'
                        : '${tous.length} abonné${tous.length > 1 ? 's' : ''}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, color: ChapColors.gray900),
                  ),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 12, 6),
            child: TextField(
              onChanged: (v) => setState(() => _recherche = v),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search, size: 20),
                hintText: 'Chercher un e-mail…',
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: tous == null ? _centre(_erreur) : _liste(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _centre(String? m) => ListView(children: [
        const SizedBox(height: 120),
        Center(
          child: m == null
              ? const CircularProgressIndicator(color: ChapColors.orange)
              : Text(m, style: const TextStyle(color: ChapColors.gray600)),
        ),
      ]);

  Widget _liste() {
    final list = _filtres;
    if (list.isEmpty) {
      return _centre((_tous ?? const []).isEmpty
          ? 'Personne ne s’est encore abonné.'
          : 'Aucun e-mail ne correspond.');
    }
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 20),
      itemCount: list.length,
      separatorBuilder: (_, __) => const Divider(height: 1, color: ChapColors.line),
      itemBuilder: (context, i) => _ligne(list[i]),
    );
  }

  Widget _ligne(Abonne a) {
    return ListTile(
      leading: const Icon(Icons.alternate_email, color: ChapColors.gray500),
      title: Text(a.email,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14, color: ChapColors.gray900)),
      subtitle: Text(
          a.cree > 0 ? 'Abonné ${tempsEcoule(a.cree)}' : 'date inconnue',
          style: const TextStyle(fontSize: 12, color: ChapColors.gray500)),
      trailing: IconButton(
        icon: const Icon(Icons.copy, size: 18, color: ChapColors.gray500),
        tooltip: 'Copier l’e-mail',
        onPressed: () {
          Clipboard.setData(ClipboardData(text: a.email));
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('E-mail copié.')));
        },
      ),
      dense: true,
    );
  }
}
