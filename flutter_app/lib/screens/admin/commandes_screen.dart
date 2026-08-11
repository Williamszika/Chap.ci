import 'package:flutter/material.dart';
import '../../api/admin.dart';
import '../../api/api_client.dart';
import '../../format.dart';
import '../../theme.dart';

/// Le suivi des commandes : qui a acheté à qui, quoi, pour combien, et où en
/// est chaque commande. Lecture seule — comme sur le site, le statut se change
/// côté vendeur, pas ici.
class CommandesScreen extends StatefulWidget {
  /// Aperçu (captures / tests) : commandes fournies, sans réseau.
  final List<Commande>? apercu;
  const CommandesScreen({super.key, this.apercu});
  @override
  State<CommandesScreen> createState() => _CommandesScreenState();
}

class _CommandesScreenState extends State<CommandesScreen> {
  List<Commande>? _tous;
  String? _erreur;
  String _filtre = 'toutes';

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
      final l = await AdminApi.commandes();
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

  bool _correspond(Commande c) {
    switch (_filtre) {
      case 'encours':
        return c.statut == 'pending' || c.statut == 'en_cours';
      case 'finalise':
        return c.statut == 'finalise';
      case 'annule':
        return c.statut == 'annule';
      default:
        return true;
    }
  }

  List<Commande> get _filtres =>
      (_tous ?? const <Commande>[]).where(_correspond).toList();

  @override
  Widget build(BuildContext context) {
    final tous = _tous;
    return Scaffold(
      appBar: AppBar(title: const Text('Commandes')),
      body: tous == null
          ? _centre(_erreur)
          : Column(
              children: [
                _resume(_filtres),
                SizedBox(
                  height: 46,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      _chip('Toutes', 'toutes', tous.length),
                      _chip('En cours', 'encours',
                          tous.where((c) => c.statut == 'pending' || c.statut == 'en_cours').length),
                      _chip('Finalisées', 'finalise',
                          tous.where((c) => c.statut == 'finalise').length),
                      _chip('Annulées', 'annule',
                          tous.where((c) => c.statut == 'annule').length),
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

  Widget _resume(List<Commande> list) {
    // Le chiffre d'affaires ne compte que les commandes finalisées : une
    // commande annulée ou en attente n'est pas de l'argent encaissé.
    final finalisees = list.where((c) => c.statut == 'finalise');
    final ca = finalisees.fold<int>(0, (s, c) => s + c.total);
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Row(
        children: [
          _stat('${list.length}', 'commande${list.length > 1 ? 's' : ''}'),
          Container(width: 1, height: 34, color: ChapColors.line),
          Expanded(child: _stat(formatFCFA(ca), 'encaissé (finalisées)')),
        ],
      ),
    );
  }

  Widget _stat(String valeur, String libelle) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(valeur,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800, color: ChapColors.gray900)),
            Text(libelle,
                style: const TextStyle(fontSize: 12, color: ChapColors.gray600)),
          ],
        ),
      );

  Widget _chip(String texte, String cle, int n) {
    final actif = _filtre == cle;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text('$texte ($n)'),
        selected: actif,
        onSelected: (_) => setState(() => _filtre = cle),
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
      ),
    );
  }

  Widget _liste() {
    final list = _filtres;
    if (list.isEmpty) {
      return _centre(_filtre == 'toutes'
          ? 'Aucune commande pour l’instant.'
          : 'Aucune commande dans ce filtre.');
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 24),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) => _carte(list[i]),
    );
  }

  Widget _carte(Commande c) {
    final (libelle, fg, bg) = _statut(c.statut);
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: fg.withValues(alpha: 0.35)),
                ),
                child: Text(libelle,
                    style: TextStyle(
                        fontSize: 11.5, fontWeight: FontWeight.w700, color: fg)),
              ),
              const Spacer(),
              Text(tempsEcoule(c.cree),
                  style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
            ],
          ),
          const SizedBox(height: 10),
          for (final a in c.articles) _ligneArticle(a),
          const Divider(height: 18, color: ChapColors.line),
          Row(
            children: [
              const Text('Total',
                  style: TextStyle(fontWeight: FontWeight.w700, color: ChapColors.gray700)),
              const Spacer(),
              Text(formatFCFA(c.total),
                  style: const TextStyle(
                      fontWeight: FontWeight.w800, color: ChapColors.orangeDark)),
            ],
          ),
          const SizedBox(height: 8),
          _partie(Icons.person_outline, 'Acheteur', c.acheteurEmail),
          _partie(Icons.storefront_outlined, 'Vendeur', c.vendeurEmail),
        ],
      ),
    );
  }

  Widget _ligneArticle(ArticleCommande a) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.only(top: 2, right: 8),
              child: Icon(Icons.chevron_right, size: 16, color: ChapColors.gray500),
            ),
            Expanded(
              child: Text(a.titre,
                  style: const TextStyle(fontSize: 13.5, color: ChapColors.gray900)),
            ),
            const SizedBox(width: 8),
            Text(formatFCFA(a.prix),
                style: const TextStyle(fontSize: 13, color: ChapColors.gray700)),
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

  /// (libellé, couleur du texte, couleur de fond) pour un statut.
  (String, Color, Color) _statut(String s) {
    switch (s) {
      case 'finalise':
        return ('Finalisée', ChapColors.greenDark, const Color(0xFFEAF7F0));
      case 'annule':
        return ('Annulée', ChapColors.gray600, ChapColors.cream100);
      case 'en_cours':
        return ('En cours', ChapColors.orangeDark, ChapColors.cream100);
      default:
        return ('En attente', ChapColors.orangeDark, ChapColors.cream100);
    }
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
