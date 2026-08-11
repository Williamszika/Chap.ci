// Banc de la modération : la lecture d'un signalement et l'écran de la file.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/moderation_screen.dart';

Signalement _sig(Map m) => Signalement.depuis(m);

void main() {
  test('Signalement lit les clés du serveur', () {
    final s = _sig({
      'id': 'r1', 'listingId': 'l9', 'listingTitle': 'Faux iPhone',
      'listingHidden': false, 'reason': 'Contrefaçon', 'details': 'Logo faux',
      'reporterEmail': 'temoin@chap.ci', 'status': 'open',
      'createdAt': 1700000000000,
    });
    expect(s.listingTitle, 'Faux iPhone');
    expect(s.reason, 'Contrefaçon');
    expect(s.ouvert, isTrue);
    expect(s.reporterEmail, 'temoin@chap.ci');
  });

  test('un signalement traité n’est plus ouvert', () {
    expect(_sig({'id': 'x', 'status': 'closed'}).ouvert, isFalse);
  });

  testWidgets('la file montre les signalements et les actions', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: ModerationScreen(apercu: [
        _sig({
          'id': 'r1', 'listingId': 'l1', 'listingTitle': 'Faux parfum',
          'reason': 'Contrefaçon', 'status': 'open', 'createdAt': 1700000000000,
        }),
        _sig({
          'id': 'r2', 'listingId': 'l2', 'listingTitle': 'Annonce ok',
          'reason': 'Doublon', 'status': 'closed', 'createdAt': 1700000000000,
        }),
      ]),
    ));
    await tester.pump();
    expect(find.text('Faux parfum'), findsOneWidget);
    expect(find.text('À traiter'), findsOneWidget); // le signalement ouvert
    expect(find.text('Traité'), findsWidgets); // l'étiquette + le libellé
    // Les actions du signalement ouvert.
    expect(find.text('Masquer'), findsOneWidget);
    expect(find.text('Supprimer'), findsOneWidget);
  });

  testWidgets('une file vide se félicite', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: ModerationScreen(apercu: [])));
    await tester.pump();
    expect(find.text('Aucun signalement'), findsOneWidget);
  });
}
