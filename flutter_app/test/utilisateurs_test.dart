// Banc de la section « Utilisateurs » : la lecture d'un compte et l'écran.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/utilisateurs_screen.dart';

Utilisateur _u(Map m) => Utilisateur.depuis(m);

void main() {
  test('Utilisateur lit les clés du serveur', () {
    final u = _u({
      'id': 'u1', 'email': 'awa@chap.ci', 'fullName': 'Awa Koné',
      'status': 'active', 'phone': '0700000000', 'commune': 'Cocody',
      'listings': 4, 'createdAt': 1700000000000,
      'derniereActivite': 1700000000000, 'enLigne': true,
    });
    expect(u.nom, 'Awa Koné');
    expect(u.commune, 'Cocody');
    expect(u.annonces, 4);
    expect(u.enLigne, isTrue);
    expect(u.bloque, isFalse);
  });

  test('le statut se lit (bloqué / restreint)', () {
    expect(_u({'id': 'a', 'status': 'blocked'}).bloque, isTrue);
    expect(_u({'id': 'b', 'status': 'restricted'}).restreint, isTrue);
    expect(_u({'id': 'c', 'status': 'active'}).bloque, isFalse);
  });

  testWidgets('l’écran liste les comptes et leur statut', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: UtilisateursScreen(apercu: [
        _u({'id': 'u1', 'email': 'awa@chap.ci', 'fullName': 'Awa Koné',
            'status': 'active', 'commune': 'Cocody', 'listings': 4,
            'createdAt': 1700000000000, 'derniereActivite': 1700000000000,
            'enLigne': true}),
        _u({'id': 'u2', 'email': 'malin@chap.ci', 'fullName': 'Compte Malin',
            'status': 'blocked', 'listings': 0, 'createdAt': 1700000000000,
            'derniereActivite': 0, 'enLigne': false}),
      ]),
    ));
    await tester.pump();
    expect(find.text('Awa Koné'), findsOneWidget);
    expect(find.text('Actif'), findsOneWidget);
    expect(find.text('Bloqué'), findsOneWidget);
  });

  testWidgets('la recherche filtre la liste', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: UtilisateursScreen(apercu: [
        _u({'id': 'u1', 'email': 'awa@chap.ci', 'fullName': 'Awa Koné',
            'status': 'active', 'listings': 1, 'createdAt': 1, 'derniereActivite': 0,
            'enLigne': false}),
        _u({'id': 'u2', 'email': 'bakary@chap.ci', 'fullName': 'Bakary Traoré',
            'status': 'active', 'listings': 1, 'createdAt': 1, 'derniereActivite': 0,
            'enLigne': false}),
      ]),
    ));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'bakary');
    await tester.pump();
    expect(find.text('Bakary Traoré'), findsOneWidget);
    expect(find.text('Awa Koné'), findsNothing);
  });
}
