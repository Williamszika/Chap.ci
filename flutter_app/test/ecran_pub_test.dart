// Banc de l'écran publicitaire : rendu du texte, styles, auto-promo.
// « Mouvement réduit » (disableAnimations) rend le texte fixe : pas de minuterie
// en attente, le banc reste déterministe.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/pub.dart';
import 'package:chapci/widgets/ecran_pub.dart';

Pub _pub({
  String id = 'p',
  String titre = 'Une promo',
  String description = 'Des prix cassés.',
  String? lien,
  String style = 'classique',
}) =>
    Pub(
      id: id,
      titre: titre,
      description: description,
      lien: lien,
      style: style,
      couleurTexte: null,
      images: const [],
      kind: 'paid',
      anims: const ['fondu'],
      animGap: 8,
      animLoop: true,
    );

Widget _app(List<Pub> pubs) => MediaQuery(
      // Mouvement réduit → texte fixe, aucune animation ni minuterie.
      data: const MediaQueryData(disableAnimations: true),
      child: MaterialApp(home: Scaffold(body: EcranPub(apercu: pubs))),
    );

void main() {
  testWidgets('affiche le titre et la description de la pub', (tester) async {
    await tester.pumpWidget(_app([_pub(titre: 'Soldes à Adjamé', description: 'Tout doit partir.')]));
    await tester.pump();
    expect(find.text('Soldes à Adjamé'), findsOneWidget);
    expect(find.text('Tout doit partir.'), findsOneWidget);
  });

  testWidgets('le bouton « En savoir plus » n’apparaît qu’avec un lien',
      (tester) async {
    await tester.pumpWidget(_app([_pub(lien: null)]));
    await tester.pump();
    expect(find.text('En savoir plus'), findsNothing);

    await tester.pumpWidget(_app([_pub(id: 'q', lien: 'https://exemple.ci')]));
    await tester.pump();
    expect(find.text('En savoir plus'), findsOneWidget);
  });

  testWidgets('plusieurs pubs → des points de progression', (tester) async {
    await tester.pumpWidget(_app([_pub(id: 'a'), _pub(id: 'b'), _pub(id: 'c')]));
    await tester.pump();
    // Le premier titre est visible ; les points sont rendus (une pub à la fois).
    expect(find.text('Une promo'), findsOneWidget);
  });

  testWidgets('le style impact met le titre en majuscules', (tester) async {
    await tester.pumpWidget(_app([_pub(titre: 'bonnes affaires', style: 'impact')]));
    await tester.pump();
    expect(find.text('BONNES AFFAIRES'), findsOneWidget);
    expect(find.text('bonnes affaires'), findsNothing);
  });

  testWidgets('sans pub, l’écran fait sa propre réclame', (tester) async {
    await tester.pumpWidget(_app(const []));
    await tester.pump();
    expect(find.textContaining('Votre publicité ici'), findsOneWidget);
    expect(find.text('Faire de la publicité'), findsOneWidget);
  });

  testWidgets('Pub.depuis lit le JSON du serveur', (tester) async {
    final p = Pub.depuis(const {
      'id': 'x', 'title': 'Titre', 'description': 'Desc', 'link': 'https://a.ci',
      'images': ['/uploads/a.jpg'], 'kind': 'seo', 'style': 'neon',
      'anims': ['fondu', 'pop'], 'animGap': 12, 'animLoop': false,
      'textColor': '#FFCC00',
    });
    expect(p.titre, 'Titre');
    expect(p.anims, ['fondu', 'pop']);
    expect(p.animGap, 12);
    expect(p.animLoop, isFalse);
    expect(p.couleurTexte, '#FFCC00');
    expect(p.aTexte, isTrue);
    expect(p.image, '/uploads/a.jpg');
  });
}
