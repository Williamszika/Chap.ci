// Banc des notifications : la lecture d'une notification du serveur et le lien
// qui mène (ou non) à une annonce.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/notifications.dart';
import 'package:chapci/screens/notifications_screen.dart';

void main() {
  group('NotifItem.depuisJson', () {
    test('lit les mêmes clés que le site', () {
      final n = NotifItem.depuisJson(const {
        'id': 'n1',
        'type': 'message',
        'title': 'Nouveau message',
        'body': 'Bonjour, l’article est-il disponible ?',
        'link': '#/messages/c42',
        'read': false,
        'createdAt': 1700000000000,
      });
      expect(n.id, 'n1');
      expect(n.type, 'message');
      expect(n.titre, 'Nouveau message');
      expect(n.corps, contains('disponible'));
      expect(n.lue, isFalse);
      expect(n.cree, 1700000000000);
    });

    test('tolère les champs manquants', () {
      final n = NotifItem.depuisJson(const {'id': 'x'});
      expect(n.titre, '');
      expect(n.lue, isFalse);
      expect(n.cree, 0);
    });

    test('read == true est bien lu', () {
      expect(NotifItem.depuisJson(const {'id': 'a', 'read': true}).lue, isTrue);
    });
  });

  group('annonceId (le lien mène-t-il à une fiche ?)', () {
    NotifItem avecLien(String lien) => NotifItem.depuisJson({'id': 'x', 'link': lien});

    test('une annonce publiée mène à sa fiche', () {
      expect(avecLien('#/annonce/aZ9_last-1').annonceId, 'aZ9_last-1');
    });

    test('un rappel « à modifier » mène aussi à la fiche', () {
      expect(avecLien('#/modifier/abc123').annonceId, 'abc123');
    });

    test('les routes sans annonce ne mènent nulle part', () {
      expect(avecLien('/#/publier').annonceId, isNull);
      expect(avecLien('/#/compte').annonceId, isNull);
      expect(avecLien('/#/notifications').annonceId, isNull);
      expect(avecLien('').annonceId, isNull);
    });
  });

  testWidgets('l’écran affiche les notifications d’aperçu', (tester) async {
    final t = DateTime.now().millisecondsSinceEpoch - 120000;
    await tester.pumpWidget(MaterialApp(
      home: NotificationsScreen(apercu: [
        NotifItem(
            id: '1', type: 'message', titre: 'Nouveau message',
            corps: 'Bonjour, toujours dispo ?', lien: '#/messages/c1',
            lue: false, cree: t),
        NotifItem(
            id: '2', type: 'listing', titre: 'Annonce publiée ✅',
            corps: 'Votre annonce est en ligne.', lien: '#/annonce/abc123',
            lue: true, cree: t),
      ]),
    ));
    await tester.pump();
    expect(find.text('Nouveau message'), findsOneWidget);
    expect(find.text('Annonce publiée ✅'), findsOneWidget);
  });

  testWidgets('l’écran vide invite gentiment', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: NotificationsScreen(apercu: [])));
    await tester.pump();
    expect(find.text('Aucune notification'), findsOneWidget);
  });
}
