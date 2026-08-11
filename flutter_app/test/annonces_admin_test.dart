// Banc de la section « Annonces » de l'admin : lecture + écran.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/annonces_screen.dart';

AnnonceAdmin _a(Map<String, dynamic> m) => AnnonceAdmin.depuis(m);

void main() {
  test('AnnonceAdmin lit l’annonce et l’e-mail du vendeur', () {
    final a = _a({
      'id': 'l1', 'title': 'Table en teck', 'price': 150000,
      'sellerEmail': 'awa@chap.ci', 'hidden': false, 'sold': false,
      'commune': 'Cocody', 'images': const [],
    });
    expect(a.annonce.title, 'Table en teck');
    expect(a.annonce.price, 150000);
    expect(a.vendeurEmail, 'awa@chap.ci');
    expect(a.annonce.hidden, isFalse);
  });

  testWidgets('la liste montre les annonces et l’action selon l’état',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: AnnoncesAdminScreen(apercu: [
        _a({'id': 'l1', 'title': 'Table en teck', 'price': 150000,
            'sellerEmail': 'awa@chap.ci', 'commune': 'Cocody', 'images': const []}),
        _a({'id': 'l2', 'title': 'iPhone suspect', 'price': 90000, 'hidden': true,
            'sellerEmail': 'k@chap.ci', 'commune': 'Abobo', 'images': const []}),
      ]),
    ));
    await tester.pump();
    expect(find.text('Table en teck'), findsOneWidget);
    expect(find.text('En ligne'), findsOneWidget);
    expect(find.text('Masquée'), findsOneWidget);
    // L'annonce en ligne se masque ; l'annonce masquée se démasque.
    expect(find.text('Masquer'), findsOneWidget);
    expect(find.text('Démasquer'), findsOneWidget);
  });

  testWidgets('la recherche filtre les annonces', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: AnnoncesAdminScreen(apercu: [
        _a({'id': 'l1', 'title': 'Table en teck', 'price': 150000,
            'sellerEmail': 'awa@chap.ci', 'images': const []}),
        _a({'id': 'l2', 'title': 'iPhone 13', 'price': 90000,
            'sellerEmail': 'k@chap.ci', 'images': const []}),
      ]),
    ));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'iphone');
    await tester.pump();
    expect(find.text('iPhone 13'), findsOneWidget);
    expect(find.text('Table en teck'), findsNothing);
  });
}
