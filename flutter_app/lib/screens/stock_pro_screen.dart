import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/models.dart';
import '../api/stock.dart';
import '../format.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// LE STOCK DU PROFESSIONNEL (07/09/2026) — l'écran natif de « Stock » de la
/// console du site.
///
/// Le Patron : « pour les comptes Pro, il doit y avoir une gérance de stock et
/// un signalement si les produits sont sous le minimum, 5 ». Chaque produit
/// porte sa quantité et son seuil ; « + » et « − » écrivent tout de suite ;
/// une vente conclue retire une unité toute seule. Ce qui manque est en tête,
/// en rouge — on ouvre l'écran pour savoir quoi commander.
class StockProScreen extends StatefulWidget {
  const StockProScreen({super.key});

  @override
  State<StockProScreen> createState() => _StockProScreenState();
}

class _StockProScreenState extends State<StockProScreen> {
  StockPro? _stock;
  String? _erreur;
  String? _occupe; // l'annonce en cours d'écriture

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    setState(() => _erreur = null);
    try {
      final s = await StockApi.lire();
      if (mounted) setState(() => _stock = s);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } catch (_) {
      if (mounted) setState(() => _erreur = tr(context, 'stock.erreur'));
    }
  }

  Future<void> _ecrire(LigneStock l,
      {int? stock, bool stockNul = false, int? stockMin}) async {
    if (_occupe != null) return;
    setState(() => _occupe = l.id);
    try {
      final r = await StockApi.ecrire(l, stock: stock, stockNul: stockNul, stockMin: stockMin);
      if (mounted) setState(() => _stock = _stock?.remplacer(r));
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _occupe = null);
    }
  }

  String _n(String cle, int n) =>
      tr(context, cle).replaceAll('{n}', '$n');

  @override
  Widget build(BuildContext context) {
    final s = _stock;
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'stock.titre'))),
      body: _erreur != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_erreur!, textAlign: TextAlign.center,
                        style: const TextStyle(color: Color(0xFFB42318))),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                        onPressed: _charger,
                        icon: const Icon(Icons.refresh, size: 18),
                        label: Text(tr(context, 'action.reessayer'))),
                  ],
                ),
              ),
            )
          : s == null
              ? const Center(
                  child: CircularProgressIndicator(color: ChapColors.orange))
              : RefreshIndicator(
                  onRefresh: _charger,
                  color: ChapColors.orange,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
                    children: [
                      _bandeau(s),
                      if (s.annonces.any((l) => l.suivie)) ...[
                        _section(tr(context, 'stock.suivis')),
                        for (final l in s.annonces.where((l) => l.suivie)) _ligne(l),
                      ],
                      if (s.annonces.any((l) => !l.suivie && !l.sold)) ...[
                        _section(tr(context, 'stock.sansSuivi')),
                        for (final l in s.annonces.where((l) => !l.suivie && !l.sold))
                          _ligneSansSuivi(l, s.minDefaut),
                      ],
                      if (s.annonces.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 32),
                          child: Text(tr(context, 'stock.aucune'),
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: ChapColors.gray600)),
                        ),
                    ],
                  ),
                ),
    );
  }

  /// Le bandeau : ce qui manque, avant tout.
  Widget _bandeau(StockPro s) {
    if (s.bas > 0) {
      return _carte(
        fond: const Color(0xFFFDECEC),
        bordure: const Color(0xFFF5C6C6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFB42318)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                      _n('stock.bandeauBas', s.bas) +
                          (s.rupture > 0 ? _n('stock.bandeauRupture', s.rupture) : ''),
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, color: Color(0xFF7A1C13))),
                  const SizedBox(height: 4),
                  Text(tr(context, 'stock.bandeauAide'),
                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF9B2C20))),
                ],
              ),
            ),
          ],
        ),
      );
    }
    if (s.suivies > 0) {
      return _carte(
        fond: const Color(0xFFE4F5EC),
        bordure: const Color(0xFFBFE3CE),
        child: Text(_n('stock.rienNeManque', s.suivies),
            style: const TextStyle(color: ChapColors.greenDark)),
      );
    }
    return _carte(
      fond: Colors.white,
      bordure: ChapColors.line2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr(context, 'stock.introTitre'),
              style: const TextStyle(
                  fontWeight: FontWeight.w800, fontSize: 15, color: ChapColors.gray900)),
          const SizedBox(height: 4),
          Text(_n('stock.intro', s.minDefaut),
              style: const TextStyle(color: ChapColors.gray700, height: 1.35)),
        ],
      ),
    );
  }

  Widget _carte({required Color fond, required Color bordure, required Widget child}) =>
      Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: fond,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: bordure),
        ),
        child: child,
      );

  Widget _section(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(2, 12, 2, 6),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: ChapColors.gray500)),
      );

  Widget _vignette(LigneStock l) {
    final src = l.image != null ? ImageSource.resoudre(l.image!) : null;
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 48,
        height: 48,
        child: src?.url != null
            ? Image.network(src!.url!, fit: BoxFit.cover,
                errorBuilder: (c, e, s) => _vignetteVide())
            : src?.bytes != null
                ? Image.memory(src!.bytes!, fit: BoxFit.cover)
                : _vignetteVide(),
      ),
    );
  }

  Widget _vignetteVide() => Container(
        color: ChapColors.cream100,
        child: const Center(child: Text('📦', style: TextStyle(fontSize: 20))),
      );

  Widget _ligne(LigneStock l) {
    final occupe = _occupe == l.id;
    final stock = l.stock ?? 0;
    final rupture = l.stockEtat == 'rupture';
    final bas = l.stockEtat == 'bas';
    final teinte = rupture
        ? const Color(0xFFB42318)
        : bas
            ? ChapColors.orangeDark
            : ChapColors.gray900;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 8),
      decoration: BoxDecoration(
        color: rupture ? const Color(0xFFFFF5F4) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: rupture ? const Color(0xFFF5C6C6) : ChapColors.line2),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _vignette(l),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, color: ChapColors.gray900)),
                    const SizedBox(height: 2),
                    Text(
                      rupture
                          ? tr(context, 'stock.rupture')
                          : bas
                              ? tr(context, 'stock.bas')
                              : formatFCFA(l.price),
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: rupture || bas ? FontWeight.w700 : FontWeight.w400,
                          color: rupture || bas ? teinte : ChapColors.gray600),
                    ),
                  ],
                ),
              ),
              // − quantité + : le geste du comptoir.
              _rond(Icons.remove, occupe || stock <= 0,
                  () => _ecrire(l, stock: stock - 1 < 0 ? 0 : stock - 1)),
              SizedBox(
                width: 44,
                child: occupe
                    ? const Center(
                        child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: ChapColors.orange)))
                    : Text('$stock',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w900, color: teinte)),
              ),
              _rond(Icons.add, occupe, () => _ecrire(l, stock: stock + 1)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const SizedBox(width: 58),
              Text(tr(context, 'stock.minimum'),
                  style: const TextStyle(fontSize: 12, color: ChapColors.gray600)),
              const SizedBox(width: 8),
              SizedBox(
                width: 64,
                child: _ChampMinimum(
                  key: ValueKey('${l.id}-${l.stockMin}'),
                  valeur: l.stockMin,
                  onValide: (v) {
                    if (v != l.stockMin) _ecrire(l, stockMin: v);
                  },
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: occupe ? null : () => _ecrire(l, stockNul: true),
                style: TextButton.styleFrom(
                    foregroundColor: ChapColors.gray500,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: const Size(0, 32)),
                child: Text(tr(context, 'stock.nePlusSuivre'),
                    style: const TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rond(IconData icone, bool inactif, VoidCallback onTap) => InkWell(
        onTap: inactif ? null : onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            border: Border.all(color: ChapColors.line2),
          ),
          child: Icon(icone,
              size: 18, color: inactif ? ChapColors.line2 : ChapColors.gray700),
        ),
      );

  Widget _ligneSansSuivi(LigneStock l, int minDefaut) {
    final occupe = _occupe == l.id;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          _vignette(l),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, color: ChapColors.gray900)),
                Text(formatFCFA(l.price),
                    style: const TextStyle(fontSize: 12, color: ChapColors.gray600)),
              ],
            ),
          ),
          OutlinedButton.icon(
            onPressed: occupe ? null : () => _ecrire(l, stock: 10, stockMin: minDefaut),
            icon: occupe
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: ChapColors.orange))
                : const Icon(Icons.inventory_2_outlined, size: 16),
            label: Text(tr(context, 'stock.suivre')),
            style: OutlinedButton.styleFrom(
                foregroundColor: ChapColors.orangeDark,
                side: const BorderSide(color: ChapColors.orange),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                minimumSize: const Size(0, 36)),
          ),
        ],
      ),
    );
  }
}

/// Le seuil, écrit quand on quitte le champ ou qu'on valide.
class _ChampMinimum extends StatefulWidget {
  final int valeur;
  final ValueChanged<int> onValide;
  const _ChampMinimum({super.key, required this.valeur, required this.onValide});

  @override
  State<_ChampMinimum> createState() => _ChampMinimumState();
}

class _ChampMinimumState extends State<_ChampMinimum> {
  late final _c = TextEditingController(text: '${widget.valeur}');
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      if (!_focus.hasFocus) _valider();
    });
  }

  void _valider() {
    final v = int.tryParse(_c.text.trim()) ?? widget.valeur;
    widget.onValide(v < 0 ? 0 : (v > 100000 ? 100000 : v));
  }

  @override
  void dispose() {
    _c.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _c,
      focusNode: _focus,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      onSubmitted: (_) => _valider(),
      decoration: const InputDecoration(
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      ),
    );
  }
}
