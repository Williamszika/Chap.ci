import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../format.dart';
import '../../theme.dart';
import '../listing_detail_screen.dart';

/// Toutes les annonces, vues de l'admin — signalées ou non. On cherche, on
/// ouvre, on **masque** (avec un motif qui part au vendeur), on **démasque**
/// ou on **retire**. C'est la surveillance de fond, à côté de la file des
/// signalements qui, elle, ne montre que ce qu'on a déjà pointé du doigt.
class AnnoncesAdminScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : liste fournie, sans réseau.
  final List<AnnonceAdmin>? apercu;
  const AnnoncesAdminScreen({super.key, this.apercu});
  @override
  State<AnnoncesAdminScreen> createState() => _AnnoncesAdminScreenState();
}

class _AnnoncesAdminScreenState extends State<AnnoncesAdminScreen> {
  List<AnnonceAdmin>? _tous;
  String? _erreur;
  String _recherche = '';
  final _occupe = <String>{};

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
      final l = await AdminApi.annonces();
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

  List<AnnonceAdmin> get _filtres {
    final tous = _tous ?? const <AnnonceAdmin>[];
    final q = _recherche.trim().toLowerCase();
    if (q.isEmpty) return tous;
    return tous.where((a) {
      return a.annonce.title.toLowerCase().contains(q) ||
          (a.vendeurEmail ?? '').toLowerCase().contains(q) ||
          (a.annonce.commune ?? '').toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _voir(AnnonceAdmin a) async {
    Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => ListingDetailScreen(annonce: a.annonce)));
  }

  Future<String?> _demanderMotif() {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: const Text('Masquer l’annonce'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Le motif part au vendeur : il saura quoi corriger.',
                style: TextStyle(fontSize: 13, color: ChapColors.gray600)),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              autofocus: true,
              maxLength: 200,
              decoration: const InputDecoration(
                hintText: 'Ex : photos trompeuses, prix irréaliste…',
                counterText: '',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Annuler')),
          TextButton(
              onPressed: () => Navigator.pop(c, ctrl.text.trim()),
              child: const Text('Masquer')),
        ],
      ),
    );
  }

  Future<void> _masquer(AnnonceAdmin a) async {
    final motif = await _demanderMotif();
    if (motif == null || motif.isEmpty) return;
    await _agir(a, () => AdminApi.changerVisibilite(a.annonce.id, true, motif: motif),
        'Annonce masquée, le vendeur est prévenu.');
  }

  Future<void> _demasquer(AnnonceAdmin a) async {
    await _agir(a, () => AdminApi.changerVisibilite(a.annonce.id, false),
        'Annonce de nouveau en ligne.');
  }

  Future<void> _supprimer(AnnonceAdmin a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: const Text('Retirer l’annonce'),
        content: Text('Retirer définitivement « ${a.annonce.title} » ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Annuler')),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: const Text('Retirer', style: TextStyle(color: Color(0xFFB42318)))),
        ],
      ),
    );
    if (ok != true) return;
    await _agir(a, () => AdminApi.supprimerAnnonce(a.annonce.id),
        'Annonce retirée.');
  }

  Future<void> _agir(AnnonceAdmin a, Future<void> Function() action, String bravo) async {
    setState(() => _occupe.add(a.annonce.id));
    try {
      await action();
      await _charger();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(bravo)));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _occupe.remove(a.annonce.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Annonces')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: TextField(
              onChanged: (v) => setState(() => _recherche = v),
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search, size: 20),
                hintText: 'Chercher un titre, un vendeur, une commune…',
                isDense: true,
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: ChapColors.orange,
              onRefresh: _charger,
              child: tous == null
                  ? _centre(_erreur)
                  : _liste(),
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
    if (list.isEmpty) return _centre('Aucune annonce ne correspond.');
    return ListView.separated(
      padding: const EdgeInsets.only(bottom: 20),
      itemCount: list.length,
      separatorBuilder: (_, __) => const Divider(height: 1, color: ChapColors.line),
      itemBuilder: (context, i) => _ligne(list[i]),
    );
  }

  Widget _ligne(AnnonceAdmin a) {
    final l = a.annonce;
    final occupe = _occupe.contains(l.id);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _vignette(l),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(l.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: ChapColors.gray900)),
                    ),
                    const SizedBox(width: 8),
                    _chipStatut(l),
                  ],
                ),
                const SizedBox(height: 2),
                Text(formatFCFA(l.price),
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: ChapColors.orangeDark)),
                const SizedBox(height: 2),
                Text(
                    [
                      if (l.commune != null && l.commune!.isNotEmpty) l.commune!,
                      if (a.vendeurEmail != null) a.vendeurEmail!,
                    ].join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
                const SizedBox(height: 8),
                if (occupe)
                  const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: ChapColors.orange))
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _action('Voir', Icons.visibility_outlined,
                          ChapColors.gray700, () => _voir(a)),
                      if (l.hidden)
                        _action('Démasquer', Icons.visibility, ChapColors.greenDark,
                            () => _demasquer(a))
                      else
                        _action('Masquer', Icons.visibility_off_outlined,
                            ChapColors.orangeDark, () => _masquer(a)),
                      _action('Retirer', Icons.delete_outline,
                          const Color(0xFFB42318), () => _supprimer(a)),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _vignette(Listing l) {
    Widget contenu;
    if (l.images.isNotEmpty) {
      final src = ImageSource.resoudre(l.images.first);
      if (src.url != null) {
        contenu = Image.network(src.url!, width: 56, height: 56, fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _placeholder());
      } else if (src.bytes != null) {
        contenu = Image.memory(src.bytes!, width: 56, height: 56, fit: BoxFit.cover);
      } else {
        contenu = _placeholder();
      }
    } else {
      contenu = _placeholder();
    }
    return ClipRRect(borderRadius: BorderRadius.circular(10), child: contenu);
  }

  Widget _placeholder() => Container(
        width: 56,
        height: 56,
        color: ChapColors.cream100,
        child: const Icon(Icons.image_outlined, color: ChapColors.line2),
      );

  Widget _chipStatut(Listing l) {
    final (t, c) = l.sold
        ? ('Vendue', ChapColors.gray500)
        : l.hidden
            ? ('Masquée', const Color(0xFFB42318))
            : ('En ligne', ChapColors.greenDark);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(t,
          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: c)),
    );
  }

  Widget _action(String t, IconData ic, Color c, VoidCallback onTap) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(ic, size: 15),
      label: Text(t),
      style: OutlinedButton.styleFrom(
        foregroundColor: c,
        side: BorderSide(color: c.withValues(alpha: 0.5)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
      ),
    );
  }
}
