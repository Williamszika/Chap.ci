// L'écran d'annonce : le bloc vendeur (cliquable ou informatif), le bouton
// Partager, et la section « Détails » (attributs étiquetés comme sur le site).
// On monte en mode aperçu pour rester hors réseau.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/models.dart';
import 'package:chapci/screens/listing_detail_screen.dart';

Listing _annonce({
  String? sellerId,
  String categoryId = 'sports',
  String? subcategory,
  String condition = 'occasion',
  bool delivery = false,
  Map<String, dynamic> attributes = const {},
}) =>
    Listing(
      id: 'a1',
      title: 'Vélo rouge',
      description: 'Bon état, peu servi.',
      price: 50000,
      negotiable: false,
      categoryId: categoryId,
      subcategory: subcategory,
      condition: condition,
      images: const [],
      sellerName: 'Dayanne Zaha',
      createdAt: 1700000000000,
      sellerId: sellerId,
      delivery: delivery,
      attributes: attributes,
    );

void main() {
  testWidgets('avec un compte vendeur, le bloc invite au clic (chevron + libellé)',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: ListingDetailScreen(
            annonce: _annonce(sellerId: 'u1'), apercu: true)));
    await tester.pump();

    expect(find.text('Voir ses annonces et ses infos'), findsOneWidget);
    expect(find.text('Vendeur sur Chap.ci'), findsNothing);
    expect(find.byIcon(Icons.chevron_right), findsOneWidget);
  });

  testWidgets('sans compte vendeur, le bloc reste informatif et non cliquable',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home:
            ListingDetailScreen(annonce: _annonce(sellerId: null), apercu: true)));
    await tester.pump();

    expect(find.text('Vendeur sur Chap.ci'), findsOneWidget);
    expect(find.text('Voir ses annonces et ses infos'), findsNothing);
    expect(find.byIcon(Icons.chevron_right), findsNothing);
  });

  testWidgets('le bouton Partager est présent dans la barre du haut',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: ListingDetailScreen(
            annonce: _annonce(sellerId: 'u1'), apercu: true)));
    await tester.pump();

    expect(find.byIcon(Icons.share_outlined), findsOneWidget);
  });

  testWidgets('la section Détails étiquette les attributs via le schéma',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: ListingDetailScreen(
      annonce: _annonce(
        sellerId: 'u1',
        categoryId: 'mode',
        subcategory: 'Chaussures',
        condition: 'neuf',
        attributes: const {'pour': 'Mixte', 'marqueCh': 'Vans'},
      ),
      apercu: true,
    )));
    await tester.pump();

    expect(find.text('Détails'), findsOneWidget);
    expect(find.text('État'), findsOneWidget);
    expect(find.text('Pour'), findsOneWidget);
    expect(find.text('Mixte'), findsOneWidget);
    expect(find.text('Marque'), findsOneWidget); // libellé du champ marqueCh
    expect(find.text('Vans'), findsOneWidget);
  });

  testWidgets('un attribut hors schéma est montré avec sa clé (repli sûr)',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: ListingDetailScreen(
      annonce: _annonce(
        sellerId: 'u1',
        categoryId: 'immobilier', // pas de schéma détaillé porté
        subcategory: 'Terrains',
        attributes: const {'surface': '120 m²'},
      ),
      apercu: true,
    )));
    await tester.pump();

    expect(find.text('Surface'), findsOneWidget);
    expect(find.text('120 m²'), findsOneWidget);
  });
}
