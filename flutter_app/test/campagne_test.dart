// Banc des campagnes : le nombre de destinataires, les gardes, la confirmation.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/screens/admin/campagne_screen.dart';

Widget _app(int destinataires) =>
    MaterialApp(home: CampagneScreen(apercu: destinataires));

void main() {
  testWidgets('l’écran annonce le nombre de destinataires', (tester) async {
    await tester.pumpWidget(_app(128));
    await tester.pump();
    expect(find.textContaining('128 abonnés recevront'), findsOneWidget);
    expect(find.text('Envoyer à 128 abonnés'), findsOneWidget);
  });

  testWidgets('objet ou message vide : refus, aucune confirmation',
      (tester) async {
    await tester.pumpWidget(_app(128));
    await tester.pump();
    await tester.tap(find.widgetWithText(ElevatedButton, 'Envoyer à 128 abonnés'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Objet et message obligatoires.'), findsOneWidget);
    // La boîte de confirmation ne doit pas s'être ouverte.
    expect(find.text('Envoyer la campagne ?'), findsNothing);
  });

  testWidgets('objet + message : la confirmation résume l’envoi',
      (tester) async {
    await tester.pumpWidget(_app(128));
    await tester.pump();
    await tester.enterText(
        find.widgetWithText(TextField, 'Objet'), 'Bonnes affaires');
    await tester.enterText(
        find.widgetWithText(TextField, 'Message'), 'Bonjour à tous !');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Envoyer à 128 abonnés'));
    await tester.pumpAndSettle();
    expect(find.text('Envoyer la campagne ?'), findsOneWidget);
    expect(find.textContaining('« Bonnes affaires » partira à 128'),
        findsOneWidget);
    // On annule : rien n'est envoyé (aucun réseau touché dans ce banc).
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expect(find.text('Envoyer la campagne ?'), findsNothing);
  });

  testWidgets('sans abonné : le bouton d’envoi est désactivé', (tester) async {
    await tester.pumpWidget(_app(0));
    await tester.pump();
    expect(find.textContaining('Aucun abonné'), findsWidgets);
    final bouton = tester.widget<ElevatedButton>(
        find.widgetWithText(ElevatedButton, 'Aucun destinataire'));
    expect(bouton.onPressed, isNull);
  });
}
