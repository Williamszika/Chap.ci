import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../i18n/categories_i18n.dart';
import '../i18n/formats_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../screens/publier_screen.dart';

/// Le tableau de bord de l'ESPACE PROFESSIONNEL — le panneau de marque d'un
/// compte approuvé : badge 💼, nom commercial, type et secteur, ancienneté,
/// puis la grille des chiffres du compte (`GET /pro/tableau`).
///
/// Réutilisé à deux endroits : l'écran « Devenir professionnel » (état
/// approuvé) et l'onglet « Mon compte », où il PREND LA PLACE des trois
/// chiffres simples pour les comptes Pro (demande du Patron, 26/08).
/// `avecPublier` masque le bouton là où un bouton Publier existe déjà.
class EspaceProPanel extends StatefulWidget {
  final bool avecPublier;
  const EspaceProPanel({super.key, this.avecPublier = true});

  @override
  State<EspaceProPanel> createState() => _EspaceProPanelState();
}

class _EspaceProPanelState extends State<EspaceProPanel> {
  Map<String, dynamic>? _tableau;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    try {
      final t = await ApiClient.instance.get('/pro/tableau');
      if (t is Map && mounted) {
        setState(() => _tableau = Map<String, dynamic>.from(t));
      }
    } catch (_) {/* les chiffres sont un plus, pas une condition */}
  }

  @override
  Widget build(BuildContext context) {
    final pro = (_tableau?['pro'] as Map?) ?? const {};
    final stats = (_tableau?['stats'] as Map?) ?? const {};
    final depuis = pro['depuis'];
    final note = stats['note'];
    final avis = (stats['avis'] as int?) ?? 0;
    final secteur = (pro['secteur'] as String?) ?? '';
    final type = (pro['type'] as String?) ?? '';
    final nom = (pro['nom'] as String?) ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // L'en-tête de marque : le badge, le nom commercial, l'ancienneté.
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [ChapColors.orange, Color(0xFFD95F00)],
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('💼 ${tr(context, 'pro.badge')}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5)),
              ),
              const SizedBox(height: 12),
              Text(nom.isNotEmpty ? nom : tr(context, 'pro.approuve'),
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      height: 1.15)),
              if (type.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  tr(context, 'pro.type.$type') +
                      (secteur.isNotEmpty
                          ? ' · ${secteurProTr(context, secteur)}'
                          : ''),
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 13.5),
                ),
              ],
              if (depuis is int && depuis > 0) ...[
                const SizedBox(height: 3),
                Text(
                  '${tr(context, 'pro.tab.depuis')} ${tempsEcouleTr(context, depuis)}',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 11.5),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        // Les chiffres du compte, d'un coup d'œil.
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
          children: [
            _chiffre(Icons.storefront_outlined,
                '${stats['annoncesActives'] ?? 0}',
                tr(context, 'pro.tab.enLigne')),
            _chiffre(Icons.visibility_outlined, '${stats['vues'] ?? 0}',
                tr(context, 'pro.tab.vues')),
            _chiffre(Icons.favorite_border, '${stats['favoris'] ?? 0}',
                tr(context, 'pro.tab.favoris')),
            _chiffre(Icons.chat_bubble_outline,
                '${stats['conversations'] ?? 0}',
                tr(context, 'pro.tab.conversations')),
            _chiffre(
                Icons.star_border,
                note != null ? '$note ★' : '—',
                avis > 0
                    ? '$avis ${tr(context, 'pro.tab.avis')}'
                    : tr(context, 'pro.tab.aucunAvis')),
            _chiffre(Icons.inventory_2_outlined,
                '${stats['annoncesTotal'] ?? 0}',
                tr(context, 'pro.tab.total')),
          ],
        ),
        if (widget.avecPublier) ...[
          const SizedBox(height: 14),
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const PublierScreen())),
              icon: const Icon(Icons.add),
              label: Text(tr(context, 'pro.tab.publier')),
              style: ElevatedButton.styleFrom(
                  backgroundColor: ChapColors.orange,
                  foregroundColor: Colors.white),
            ),
          ),
        ],
        const SizedBox(height: 10),
        Text(tr(context, 'pro.tab.note'),
            style: const TextStyle(
                fontSize: 12, color: ChapColors.gray600, height: 1.4)),
      ],
    );
  }

  Widget _chiffre(IconData icone, String valeur, String libelle) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icone, size: 18, color: ChapColors.orange),
          const SizedBox(height: 6),
          Text(valeur,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w800)),
          Text(libelle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 11, color: ChapColors.gray600)),
        ],
      ),
    );
  }
}
