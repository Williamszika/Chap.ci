// Banc des conversations : la liste, la recherche, l'annonce supprimée.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/conversations_screen.dart';

ConversationAdmin _conv({
  String id = 'v',
  String? acheteur = 'acheteur@example.com',
  String? vendeur = 'vendeur@chap.ci',
  String? annonce = 'Un article',
  String? dernier = 'Bonjour',
  int messages = 3,
}) =>
    ConversationAdmin(
      id: id,
      acheteurEmail: acheteur,
      vendeurEmail: vendeur,
      annonceTitre: annonce,
      dernierMessage: dernier,
      messages: messages,
      cree: 1700000000000,
    );

Widget _app(List<ConversationAdmin> l) =>
    MaterialApp(home: ConversationsScreen(apercu: l));

void main() {
  testWidgets('la liste montre le nombre, l’annonce et le dernier message',
      (tester) async {
    await tester.pumpWidget(_app([
      _conv(annonce: 'Canapé', dernier: 'Je passe demain', messages: 12),
    ]));
    await tester.pump();
    expect(find.text('1 conversation'), findsOneWidget);
    expect(find.text('Canapé'), findsOneWidget);
    expect(find.text('Je passe demain'), findsOneWidget);
    expect(find.text('12'), findsOneWidget);
  });

  testWidgets('la recherche filtre par membre ou annonce', (tester) async {
    await tester.pumpWidget(_app([
      _conv(id: 'a', annonce: 'Canapé', vendeur: 'boutique@chap.ci'),
      _conv(id: 'b', annonce: 'Casque', vendeur: 'tech@chap.ci'),
    ]));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'casque');
    await tester.pump();
    expect(find.text('Casque'), findsOneWidget);
    expect(find.text('Canapé'), findsNothing);
  });

  testWidgets('une annonce supprimée est signalée', (tester) async {
    await tester.pumpWidget(_app([_conv(annonce: null)]));
    await tester.pump();
    expect(find.text('Annonce supprimée'), findsOneWidget);
  });

  testWidgets('liste vide : l’écran le dit', (tester) async {
    await tester.pumpWidget(_app(const []));
    await tester.pump();
    expect(find.textContaining('Aucune conversation'), findsOneWidget);
  });
}
