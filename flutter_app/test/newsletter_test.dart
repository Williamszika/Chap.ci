// Banc de la newsletter : lecture des abonnés + l'écran.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/newsletter_screen.dart';

void main() {
  testWidgets('l’écran liste les abonnés et leur nombre', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: NewsletterScreen(apercu: [
        Abonne('awa.kone@gmail.com', 1700000000000),
        Abonne('kader@yahoo.fr', 1699000000000),
      ]),
    ));
    await tester.pump();
    expect(find.text('2 abonnés'), findsOneWidget);
    expect(find.text('awa.kone@gmail.com'), findsOneWidget);
    expect(find.text('kader@yahoo.fr'), findsOneWidget);
  });

  testWidgets('la recherche filtre par e-mail', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: NewsletterScreen(apercu: [
        Abonne('awa.kone@gmail.com', 1700000000000),
        Abonne('kader@yahoo.fr', 1699000000000),
      ]),
    ));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'yahoo');
    await tester.pump();
    expect(find.text('kader@yahoo.fr'), findsOneWidget);
    expect(find.text('awa.kone@gmail.com'), findsNothing);
  });

  testWidgets('une liste vide le dit', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: NewsletterScreen(apercu: [])));
    await tester.pump();
    expect(find.text('Aucun abonné'), findsOneWidget);
    expect(find.textContaining('Personne ne s’est encore abonné'), findsOneWidget);
  });
}
