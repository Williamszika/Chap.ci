// Banc des avis : la liste, les étoiles, le filtre des notes basses.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/avis_screen.dart';

Avis _avis({
  String id = 'a',
  int note = 5,
  String? commentaire = 'Très bien',
}) =>
    Avis(
      id: id,
      note: note,
      commentaire: commentaire,
      auteurNom: 'Client',
      auteurEmail: 'client@example.com',
      vendeurEmail: 'vendeur@chap.ci',
      annonceTitre: 'Un article',
      cree: 1700000000000,
    );

Widget _app(List<Avis> l) => MaterialApp(home: AvisScreen(apercu: l));

void main() {
  testWidgets('la liste montre les avis et compte les notes basses',
      (tester) async {
    await tester.pumpWidget(_app([
      _avis(id: 'a', note: 5, commentaire: 'Parfait'),
      _avis(id: 'b', note: 1, commentaire: 'Arnaqueur'),
      _avis(id: 'c', note: 2, commentaire: 'Déçu'),
    ]));
    await tester.pump();
    expect(find.text('Tous (3)'), findsOneWidget);
    expect(find.text('Notes ≤ 2 (2)'), findsOneWidget);
    expect(find.text('Parfait'), findsOneWidget);
    expect(find.text('5/5'), findsOneWidget);
  });

  testWidgets('le filtre ne garde que les avis à 2 étoiles ou moins',
      (tester) async {
    await tester.pumpWidget(_app([
      _avis(id: 'a', note: 5, commentaire: 'Parfait'),
      _avis(id: 'b', note: 1, commentaire: 'Arnaqueur'),
    ]));
    await tester.pump();
    await tester.tap(find.textContaining('Notes ≤ 2'));
    await tester.pump();
    expect(find.text('Arnaqueur'), findsOneWidget);
    expect(find.text('Parfait'), findsNothing);
  });

  testWidgets('un avis sans commentaire le signale', (tester) async {
    await tester.pumpWidget(_app([_avis(note: 4, commentaire: null)]));
    await tester.pump();
    expect(find.text('(sans commentaire)'), findsOneWidget);
  });

  testWidgets('supprimer demande confirmation puis retire l’avis',
      (tester) async {
    await tester.pumpWidget(_app([
      _avis(id: 'a', note: 1, commentaire: 'À retirer'),
      _avis(id: 'b', note: 5, commentaire: 'À garder'),
    ]));
    await tester.pump();
    // Supprime le premier avis.
    await tester.tap(find.byIcon(Icons.delete_outline).first);
    await tester.pumpAndSettle();
    expect(find.text('Supprimer cet avis ?'), findsOneWidget);
    await tester.tap(find.widgetWithText(ElevatedButton, 'Supprimer'));
    await tester.pumpAndSettle();
    expect(find.text('À retirer'), findsNothing);
    expect(find.text('À garder'), findsOneWidget);
  });
}
