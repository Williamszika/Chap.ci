// Banc des commandes : la liste, le résumé, les filtres par statut.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/format.dart';
import 'package:chapci/screens/admin/commandes_screen.dart';

Commande _cmd({
  String id = 'o',
  String statut = 'finalise',
  int total = 50000,
  List<ArticleCommande> articles = const [ArticleCommande('Un article', 50000, null)],
}) =>
    Commande(
      id: id,
      statut: statut,
      acheteurEmail: 'acheteur@example.com',
      vendeurEmail: 'vendeur@chap.ci',
      cree: 1700000000000,
      total: total,
      articles: articles,
    );

Widget _app(List<Commande> l) => MaterialApp(home: CommandesScreen(apercu: l));

void main() {
  testWidgets('le résumé ne compte que les commandes finalisées',
      (tester) async {
    await tester.pumpWidget(_app([
      _cmd(id: 'a', statut: 'finalise', total: 100000),
      _cmd(id: 'b', statut: 'en_cours', total: 40000),
      _cmd(id: 'c', statut: 'annule', total: 20000),
    ]));
    await tester.pump();
    // 3 commandes, mais seul le finalisé compte dans l'encaissé.
    expect(find.text('3'), findsOneWidget);
    expect(find.textContaining(formatFCFA(100000)), findsWidgets);
    expect(find.textContaining('encaissé'), findsOneWidget);
    // L'encaissé n'additionne PAS l'en-cours ni l'annulé (100 000 ≠ 160 000).
    expect(find.textContaining(formatFCFA(160000)), findsNothing);
  });

  testWidgets('le filtre « Finalisées » ne garde que celles-là',
      (tester) async {
    await tester.pumpWidget(_app([
      _cmd(id: 'a', statut: 'finalise', articles: const [ArticleCommande('Canapé', 100000, null)]),
      _cmd(id: 'b', statut: 'annule', articles: const [ArticleCommande('Robe', 20000, null)]),
    ]));
    await tester.pump();
    expect(find.text('Canapé'), findsOneWidget);
    expect(find.text('Robe'), findsOneWidget);
    await tester.tap(find.text('Finalisées (1)'));
    await tester.pump();
    expect(find.text('Canapé'), findsOneWidget);
    expect(find.text('Robe'), findsNothing);
  });

  testWidgets('chaque commande montre son statut, ses parties et son total',
      (tester) async {
    await tester.pumpWidget(_app([_cmd(statut: 'en_cours', total: 90000)]));
    await tester.pump();
    expect(find.text('En cours'), findsWidgets);
    expect(find.textContaining('acheteur@example.com'), findsOneWidget);
    expect(find.textContaining('vendeur@chap.ci'), findsOneWidget);
    expect(find.text('Total'), findsOneWidget);
  });

  testWidgets('un filtre vide le dit', (tester) async {
    await tester.pumpWidget(_app([_cmd(statut: 'finalise')]));
    await tester.pump();
    await tester.tap(find.text('Annulées (0)'));
    await tester.pump();
    expect(find.textContaining('Aucune commande dans ce filtre'), findsOneWidget);
  });
}
