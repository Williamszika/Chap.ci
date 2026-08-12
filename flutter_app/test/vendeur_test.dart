// Le bloc vendeur d'une fiche d'annonce : cliquable (pour ouvrir la page du
// vendeur) quand l'annonce a un compte vendeur, simplement informatif sinon.
// On monte en mode aperçu pour rester hors réseau.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/models.dart';
import 'package:chapci/screens/listing_detail_screen.dart';

Listing _annonce({String? sellerId}) => Listing(
      id: 'a1',
      title: 'Vélo rouge',
      description: 'Bon état, peu servi.',
      price: 50000,
      negotiable: false,
      categoryId: 'sports',
      condition: 'occasion',
      images: const [],
      sellerName: 'Dayanne Zaha',
      createdAt: 1700000000000,
      sellerId: sellerId,
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
}
