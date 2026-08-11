import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Les avis laissés sur les vendeurs : les lire, repérer les abusifs, en
/// **supprimer** un au besoin. Un filtre met en avant les notes basses (≤ 2 ★),
/// celles qu'on vérifie en premier.
class AvisScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : avis fournis, sans réseau.
  final List<Avis>? apercu;
  const AvisScreen({super.key, this.apercu});
  @override
  State<AvisScreen> createState() => _AvisScreenState();
}

class _AvisScreenState extends State<AvisScreen> {
  List<Avis>? _tous;
  String? _erreur;
  bool _seulementBas = false;

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
      final l = await AdminApi.avis();
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

  int get _nbBas =>
      (_tous ?? const <Avis>[]).where((a) => a.note > 0 && a.note <= 2).length;

  List<Avis> get _filtres {
    final tous = _tous ?? const <Avis>[];
    if (_seulementBas) {
      return tous.where((a) => a.note > 0 && a.note <= 2).toList();
    }
    return tous;
  }

  void _dire(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _supprimer(Avis a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Supprimer cet avis ?'),
        content: const Text(
            'Il disparaîtra de la fiche du vendeur, et sa note moyenne sera '
            'recalculée. Cette action est définitive.'),
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
    // Aperçu (captures / tests) : mode sans réseau, on retire localement.
    if (widget.apercu != null) {
      setState(() => _tous = [..._tous!]..removeWhere((x) => x.id == a.id));
      return;
    }
    try {
      await AdminApi.supprimerAvis(a.id);
      _dire('Avis supprimé.');
      await _charger();
    } on ApiException catch (e) {
      _dire(e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Avis')),
      body: tous == null
          ? _centre(_erreur)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
                  child: Row(
                    children: [
                      _filtre('Tous (${tous.length})', !_seulementBas,
                          () => setState(() => _seulementBas = false)),
                      const SizedBox(width: 8),
                      _filtre('Notes ≤ 2 ($_nbBas)', _seulementBas,
                          () => setState(() => _seulementBas = true)),
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
      return _centre(_seulementBas
          ? 'Aucun avis à surveiller — rien en dessous de 3 étoiles.'
          : 'Aucun avis pour l’instant.');
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 24),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _carte(list[i]),
    );
  }

  Widget _carte(Avis a) {
    final bas = a.note > 0 && a.note <= 2;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 6, 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: bas ? ChapColors.orangeLight : ChapColors.line2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _etoiles(a.note),
                if (a.commentaire != null && a.commentaire!.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(a.commentaire!,
                      style: const TextStyle(
                          fontSize: 14, height: 1.35, color: ChapColors.gray900)),
                ] else ...[
                  const SizedBox(height: 6),
                  const Text('(sans commentaire)',
                      style: TextStyle(
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                          color: ChapColors.gray500)),
                ],
                const SizedBox(height: 8),
                Text(
                  'Par ${a.auteurNom ?? a.auteurEmail ?? 'un membre'}'
                  '${a.vendeurEmail != null ? ' · sur ${a.vendeurEmail}' : ''}',
                  style: const TextStyle(fontSize: 12.5, color: ChapColors.gray600),
                ),
                if (a.annonceTitre != null && a.annonceTitre!.isNotEmpty)
                  Text('Annonce : ${a.annonceTitre}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: ChapColors.gray500)),
                const SizedBox(height: 4),
                Text(tempsEcoule(a.cree),
                    style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Supprimer',
            icon: const Icon(Icons.delete_outline, color: ChapColors.gray500),
            onPressed: () => _supprimer(a),
          ),
        ],
      ),
    );
  }

  Widget _etoiles(int note) {
    return Row(
      children: [
        for (var i = 1; i <= 5; i++)
          Icon(i <= note ? Icons.star : Icons.star_border,
              size: 18,
              color: i <= note ? ChapColors.orange : ChapColors.line2),
        const SizedBox(width: 6),
        Text('$note/5',
            style: const TextStyle(
                fontSize: 12.5, fontWeight: FontWeight.w700, color: ChapColors.gray600)),
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
