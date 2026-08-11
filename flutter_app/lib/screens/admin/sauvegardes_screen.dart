import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Les sauvegardes : la liste des exports automatiques présents sur le serveur,
/// et un bouton pour **créer et partager** un export complet à l'instant (vers
/// Google Drive, un e-mail…). L'export n'est jamais stocké sur le téléphone :
/// il part directement dans la feuille de partage du système.
class SauvegardesScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : liste fournie, sans réseau.
  final List<Sauvegarde>? apercu;
  const SauvegardesScreen({super.key, this.apercu});
  @override
  State<SauvegardesScreen> createState() => _SauvegardesScreenState();
}

class _SauvegardesScreenState extends State<SauvegardesScreen> {
  List<Sauvegarde>? _liste;
  String? _erreur;
  bool _export = false;

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
      final l = await AdminApi.sauvegardes();
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

  Future<void> _exporterEtPartager() async {
    setState(() => _export = true);
    try {
      final n = DateTime.now().toUtc();
      String d2(int v) => v.toString().padLeft(2, '0');
      final horo =
          '${n.year}-${d2(n.month)}-${d2(n.day)}-${d2(n.hour)}${d2(n.minute)}${d2(n.second)}';
      final exp = await AdminApi.exporter(horo);
      await SharePlus.instance.share(ShareParams(
        files: [
          XFile.fromData(Uint8List.fromList(exp.octets),
              mimeType: 'application/json', name: exp.nom),
        ],
        fileNameOverrides: [exp.nom],
        subject: 'Sauvegarde Chap.ci — ${exp.nom}',
      ));
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Le partage a été annulé ou a échoué.')));
      }
    } finally {
      if (mounted) setState(() => _export = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final liste = _liste;
    return Scaffold(
      appBar: AppBar(title: const Text('Sauvegardes')),
      body: RefreshIndicator(
        color: ChapColors.orange,
        onRefresh: _charger,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
          children: [
            _enTete(liste),
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: _export ? null : _exporterEtPartager,
              icon: _export
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.ios_share),
              label: Text(_export
                  ? 'Préparation de l’export…'
                  : 'Créer et partager une sauvegarde'),
              style: ElevatedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
            const SizedBox(height: 6),
            const Text(
              'L’export part directement vers Google Drive, un e-mail ou WhatsApp — '
              'il n’est pas conservé sur le téléphone.',
              style: TextStyle(fontSize: 12, color: ChapColors.gray600, height: 1.3),
            ),
            const SizedBox(height: 20),
            const Text('Sauvegardes automatiques du serveur',
                style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w800, color: ChapColors.gray900)),
            const SizedBox(height: 10),
            if (liste == null)
              Padding(
                padding: const EdgeInsets.only(top: 30),
                child: Center(
                  child: _erreur != null
                      ? Text(_erreur!, style: const TextStyle(color: ChapColors.gray600))
                      : const CircularProgressIndicator(color: ChapColors.orange),
                ),
              )
            else if (liste.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text(
                    'Aucune sauvegarde automatique pour l’instant. Elles apparaissent '
                    'ici dès que la tâche planifiée du serveur en produit.',
                    style: TextStyle(fontSize: 13, color: ChapColors.gray600, height: 1.4)),
              )
            else
              for (final s in liste) _ligne(s),
          ],
        ),
      ),
    );
  }

  Widget _enTete(List<Sauvegarde>? liste) {
    final n = liste?.length ?? 0;
    final total = liste?.fold<int>(0, (a, s) => a + s.octets) ?? 0;
    final derniere = (liste != null && liste.isNotEmpty)
        ? liste.map((s) => s.quand).reduce((a, b) => a > b ? a : b)
        : 0;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7EF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.greenDark.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, color: ChapColors.greenDark, size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  n == 0
                      ? 'Aucune sauvegarde automatique'
                      : '$n sauvegarde${n > 1 ? 's' : ''} · ${_taille(total)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.w800, color: ChapColors.greenDark),
                ),
                if (derniere > 0)
                  Text('Dernière ${tempsEcoule(derniere)}',
                      style: const TextStyle(fontSize: 12.5, color: ChapColors.greenDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ligne(Sauvegarde s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          const Icon(Icons.description_outlined, size: 20, color: ChapColors.gray600),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.fichier,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 13.5, fontWeight: FontWeight.w600, color: ChapColors.gray900)),
                const SizedBox(height: 2),
                Text(
                    '${s.quand > 0 ? tempsEcoule(s.quand) : 'date inconnue'} · ${_taille(s.octets)}',
                    style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _taille(int octets) {
    if (octets <= 0) return '—';
    if (octets < 1024) return '$octets o';
    if (octets < 1024 * 1024) {
      return '${(octets / 1024).toStringAsFixed(0)} Ko';
    }
    return '${(octets / (1024 * 1024)).toStringAsFixed(1).replaceAll('.', ',')} Mo';
  }
}
