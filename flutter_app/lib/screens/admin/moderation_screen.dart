import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../api/models.dart';
import '../../format.dart';
import '../../theme.dart';
import '../listing_detail_screen.dart';

/// La modération : la file des signalements, et — dans le même geste — l'action
/// sur l'annonce. « Classer » range la ligne ; « Masquer » la sort de la vue et
/// prévient le vendeur (qui peut corriger) ; « Supprimer » l'efface.
///
/// C'est le sens même d'un signalement : décider ET agir. Sur le site, séparer
/// les deux laissait la moitié des annonces fautives en ligne.
class ModerationScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : liste fournie, sans réseau.
  final List<Signalement>? apercu;
  const ModerationScreen({super.key, this.apercu});
  @override
  State<ModerationScreen> createState() => _ModerationScreenState();
}

class _ModerationScreenState extends State<ModerationScreen> {
  List<Signalement>? _liste;
  String? _erreur;
  final _occupe = <String>{}; // ids en cours de traitement

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _liste = widget.apercu;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    try {
      final l = await AdminApi.signalements();
      if (mounted) {
        setState(() {
          _liste = l;
          _erreur = null;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    }
  }

  Future<void> _voirAnnonce(Signalement s) async {
    if (s.listingId.isEmpty) return;
    try {
      final a = await Listing.parId(s.listingId);
      if (!mounted) return;
      Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ListingDetailScreen(annonce: a)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Cette annonce n’est plus disponible.')));
      }
    }
  }

  Future<void> _traiter(Signalement s, String action) async {
    if (action == 'supprimer') {
      final ok = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          backgroundColor: ChapColors.cream,
          title: const Text('Supprimer l’annonce'),
          content: Text('Supprimer définitivement « ${s.listingTitle} » ? '
              'Le vendeur en sera informé.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Annuler')),
            TextButton(
                onPressed: () => Navigator.pop(c, true),
                child: const Text('Supprimer',
                    style: TextStyle(color: Color(0xFFB42318)))),
          ],
        ),
      );
      if (ok != true) return;
    }
    setState(() => _occupe.add(s.id));
    try {
      await AdminApi.traiterSignalement(s.id, action);
      await _charger();
      if (mounted) {
        const mots = {
          'classer': 'Signalement classé.',
          'masquer': 'Annonce masquée, le vendeur est prévenu.',
          'supprimer': 'Annonce supprimée.',
        };
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(mots[action] ?? 'Fait.')));
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _occupe.remove(s.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final liste = _liste;
    return Scaffold(
      appBar: AppBar(title: const Text('Modération')),
      body: RefreshIndicator(
        color: ChapColors.orange,
        onRefresh: _charger,
        child: liste == null
            ? (_erreur != null ? _messageCentre(_erreur!) : _chargement())
            : liste.isEmpty
                ? _vide()
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: liste.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: 2),
                    itemBuilder: (context, i) => _carte(liste[i]),
                  ),
      ),
    );
  }

  Widget _chargement() => ListView(children: const [
        SizedBox(height: 120),
        Center(child: CircularProgressIndicator(color: ChapColors.orange)),
      ]);

  Widget _messageCentre(String m) => ListView(children: [
        const SizedBox(height: 120),
        Center(child: Text(m, style: const TextStyle(color: ChapColors.gray600))),
      ]);

  Widget _vide() => ListView(children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        const Icon(Icons.verified_outlined, size: 56, color: ChapColors.greenDark),
        const SizedBox(height: 12),
        const Center(
          child: Text('Aucun signalement',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w600, color: ChapColors.gray700)),
        ),
        const SizedBox(height: 6),
        const Center(
          child: Text('Rien à modérer pour l’instant.',
              style: TextStyle(fontSize: 13, color: ChapColors.gray600)),
        ),
      ]);

  Widget _carte(Signalement s) {
    final occupe = _occupe.contains(s.id);
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: s.ouvert
                ? const Color(0xFFB42318).withValues(alpha: 0.35)
                : ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _etiquette(s),
              const Spacer(),
              Text(tempsEcoule(s.cree),
                  style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
            ],
          ),
          const SizedBox(height: 8),
          Text(s.listingTitle,
              style: const TextStyle(
                  fontSize: 15, fontWeight: FontWeight.w700, color: ChapColors.gray900)),
          const SizedBox(height: 4),
          Text('Motif : ${s.reason}',
              style: const TextStyle(fontSize: 13, color: ChapColors.gray700)),
          if (s.details != null && s.details!.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(s.details!,
                style: const TextStyle(
                    fontSize: 12.5, height: 1.3, color: ChapColors.gray600)),
          ],
          if (s.reporterEmail != null) ...[
            const SizedBox(height: 4),
            Text('Signalé par ${s.reporterEmail}',
                style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
          ],
          const SizedBox(height: 10),
          if (occupe)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 6),
              child: SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.orange)),
            )
          else if (s.ouvert)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (s.listingId.isNotEmpty)
                  _action('Voir', Icons.visibility_outlined, ChapColors.gray700,
                      () => _voirAnnonce(s)),
                _action('Classer', Icons.check, ChapColors.greenDark,
                    () => _traiter(s, 'classer')),
                if (!s.listingHidden)
                  _action('Masquer', Icons.visibility_off_outlined,
                      ChapColors.orangeDark, () => _traiter(s, 'masquer')),
                _action('Supprimer', Icons.delete_outline, const Color(0xFFB42318),
                    () => _traiter(s, 'supprimer')),
              ],
            )
          else
            Row(
              children: [
                const Icon(Icons.check_circle_outline,
                    size: 16, color: ChapColors.greenDark),
                const SizedBox(width: 6),
                const Text('Traité',
                    style: TextStyle(fontSize: 12.5, color: ChapColors.greenDark)),
                if (s.listingId.isNotEmpty) ...[
                  const Spacer(),
                  TextButton(
                      onPressed: () => _voirAnnonce(s),
                      child: const Text('Voir l’annonce',
                          style: TextStyle(color: ChapColors.gray700))),
                ],
              ],
            ),
        ],
      ),
    );
  }

  Widget _etiquette(Signalement s) {
    final ouvert = s.ouvert;
    final c = ouvert ? const Color(0xFFB42318) : ChapColors.gray500;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(ouvert ? 'À traiter' : 'Traité',
          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: c)),
    );
  }

  Widget _action(String t, IconData ic, Color c, VoidCallback onTap) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(ic, size: 16),
      label: Text(t),
      style: OutlinedButton.styleFrom(
        foregroundColor: c,
        side: BorderSide(color: c.withValues(alpha: 0.5)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
