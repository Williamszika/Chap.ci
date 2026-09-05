import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../data/reseaux.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// « Réseaux sociaux » — les neuf champs de la fiche professionnelle
/// (05/09/2026). Un nom d'utilisateur (« @maboutique ») ou l'adresse de la
/// page ; le serveur vérifie que chaque adresse est bien sur le domaine du
/// réseau, complète le nom en adresse, et renvoie ce qu'il a gardé — les
/// champs se remplissent alors avec l'adresse propre. Une adresse refusée
/// bloque tout et dit laquelle.
class ReseauxScreen extends StatefulWidget {
  /// Ce que le tableau de bord pro rend déjà (`pro.reseaux`).
  final Map<String, String> initiaux;
  const ReseauxScreen({super.key, this.initiaux = const {}});

  @override
  State<ReseauxScreen> createState() => _ReseauxScreenState();
}

class _ReseauxScreenState extends State<ReseauxScreen> {
  late final Map<String, TextEditingController> _champs = {
    for (final r in reseaux)
      r.id: TextEditingController(text: widget.initiaux[r.id] ?? ''),
  };
  bool _envoi = false;

  @override
  void dispose() {
    for (final c in _champs.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _enregistrer() async {
    setState(() => _envoi = true);
    try {
      final d = await ApiClient.instance.post('/pro/fiche', {
        'reseaux': {for (final e in _champs.entries) e.key: e.value.text.trim()},
      });
      if (!mounted) return;
      // Les adresses propres reviennent : on les repose dans les champs.
      if (d is Map && d['reseaux'] is Map) {
        final propres = Map<String, dynamic>.from(d['reseaux'] as Map);
        for (final e in _champs.entries) {
          e.value.text = (propres[e.key] ?? '').toString();
        }
      }
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(tr(context, 'pro.reseaux.enregistre'))));
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: ChapColors.cream,
          title: Text(tr(context, 'pro.reseaux.titre')),
          content: Text(e.message),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(tr(context, 'action.compris'))),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'pro.reseaux.titre'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: ChapColors.cream100,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF3D9B8)),
            ),
            child: Text(tr(context, 'pro.reseaux.aide'),
                style: const TextStyle(
                    fontSize: 12.5, height: 1.4, color: ChapColors.gray700)),
          ),
          const SizedBox(height: 12),
          for (final r in reseaux) ...[
            _champ(r),
            const SizedBox(height: 8),
          ],
          const SizedBox(height: 8),
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              key: const ValueKey('reseaux-enregistrer'),
              onPressed: _envoi ? null : _enregistrer,
              icon: _envoi
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check),
              label: Text(tr(context, 'action.enregistrer')),
              style: ElevatedButton.styleFrom(
                  backgroundColor: ChapColors.orange,
                  foregroundColor: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _champ(DefReseau r) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 4, 6, 4),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: r.degrade == null ? r.couleur : null,
              gradient: r.degrade,
              shape: BoxShape.circle,
            ),
            child: IconeReseau(r.id, taille: 16, couleur: r.encre),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 68,
            child: Text(r.nom,
                style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: ChapColors.gray900)),
          ),
          Expanded(
            child: TextField(
              key: ValueKey('reseau-${r.id}'),
              controller: _champs[r.id],
              keyboardType: TextInputType.url,
              autocorrect: false,
              enableSuggestions: false,
              textCapitalization: TextCapitalization.none,
              maxLength: 200,
              style: const TextStyle(fontSize: 13.5),
              decoration: InputDecoration(
                counterText: '',
                isDense: true,
                border: InputBorder.none,
                hintText: tr(context, r.placeholderCle),
                hintStyle:
                    const TextStyle(fontSize: 12.5, color: ChapColors.gray500),
              ),
            ),
          ),
          if (_champs[r.id]!.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.close, size: 16, color: ChapColors.gray500),
              tooltip: tr(context, 'pub.videoRetirer'),
              onPressed: () => setState(() => _champs[r.id]!.clear()),
            ),
        ],
      ),
    );
  }
}
