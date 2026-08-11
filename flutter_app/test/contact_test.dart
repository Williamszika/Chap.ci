// Banc des messages de contact : la liste, les filtres, le détail.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/contact_screen.dart';

MessageContact _msg({
  String id = 'c1',
  String sujet = 'Sujet',
  String message = 'Un message.',
  String? email = 'client@example.com',
  String? reponse,
  bool traite = false,
}) =>
    MessageContact(
      id: id,
      sujet: sujet,
      message: message,
      nom: 'Client',
      email: email,
      reponse: reponse,
      reponduPar: reponse != null ? 'patron@chap.ci' : null,
      traite: traite,
      cree: 1700000000000,
      reponduLe: reponse != null ? 1700000100000 : 0,
    );

Widget _app(List<MessageContact> l) => MaterialApp(home: ContactScreen(apercu: l));

void main() {
  testWidgets('le filtre « À traiter » cache les messages déjà traités',
      (tester) async {
    await tester.pumpWidget(_app([
      _msg(id: 'a', sujet: 'À traiter celui-ci'),
      _msg(id: 'b', sujet: 'Déjà répondu', reponse: 'Bonjour', traite: true),
    ]));
    await tester.pump();
    // Par défaut : seulement à traiter.
    expect(find.text('À traiter (1)'), findsOneWidget);
    expect(find.text('À traiter celui-ci'), findsOneWidget);
    expect(find.text('Déjà répondu'), findsNothing);
    // On bascule sur « Tous » : le message traité réapparaît.
    await tester.tap(find.text('Tous (2)'));
    await tester.pump();
    expect(find.text('Déjà répondu'), findsOneWidget);
  });

  testWidgets('à jour : l’écran le dit quand rien n’est en attente',
      (tester) async {
    await tester.pumpWidget(_app([
      _msg(id: 'b', sujet: 'Déjà répondu', reponse: 'Bonjour', traite: true),
    ]));
    await tester.pump();
    expect(find.textContaining('vous êtes à jour'), findsOneWidget);
  });

  testWidgets('ouvrir un message montre son texte et le composer',
      (tester) async {
    await tester.pumpWidget(_app([
      _msg(sujet: 'Problème de photo', message: 'La 3e photo échoue.'),
    ]));
    await tester.pump();
    await tester.tap(find.text('Problème de photo'));
    await tester.pumpAndSettle();
    expect(find.text('La 3e photo échoue.'), findsOneWidget);
    expect(find.text('Votre réponse'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Envoyer la réponse'),
        findsOneWidget);
  });

  testWidgets('un message sans adresse n’offre pas de réponse',
      (tester) async {
    await tester.pumpWidget(_app([
      _msg(sujet: 'Sans e-mail', email: null),
    ]));
    await tester.pump();
    await tester.tap(find.text('Sans e-mail'));
    await tester.pumpAndSettle();
    expect(find.textContaining('n’a pas d’adresse e-mail'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Envoyer la réponse'),
        findsNothing);
  });

  testWidgets('un message déjà répondu montre la réponse envoyée',
      (tester) async {
    await tester.pumpWidget(_app([
      _msg(
          sujet: 'Merci',
          reponse: 'Bonjour, merci à vous !',
          traite: true),
    ]));
    await tester.pump();
    await tester.tap(find.text('Tous (1)'));
    await tester.pump();
    await tester.tap(find.text('Merci'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Réponse envoyée'), findsOneWidget);
    expect(find.text('Bonjour, merci à vous !'), findsOneWidget);
  });
}
