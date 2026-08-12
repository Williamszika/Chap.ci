// La page vendeur enrichie : en-tête (nom, commune, « Nouveau vendeur »,
// compteurs annonces · note · avis) et les onglets Annonces / Avis / À propos.
// Monté en aperçu (données injectées, hors réseau).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/models.dart';
import 'package:chapci/api/profil.dart';
import 'package:chapci/screens/vendeur_screen.dart';

Listing _l(String id, {String? commune}) => Listing(
      id: id,
      title: 'Article $id',
      description: '',
      price: 1000,
      negotiable: false,
      categoryId: 'mode',
      condition: 'neuf',
      images: const [],
      sellerName: 'Flan sahi',
      createdAt: 1700000000000,
      sellerId: 'u1',
      commune: commune,
    );

Widget _ecran({List<Avis> avis = const []}) => MaterialApp(
      home: VendeurScreen(
        sellerId: 'u1',
        sellerName: 'Flan sahi',
        apercu: true,
        apercuProfil: const ProfilPublic(
            id: 'u1', nom: 'Flan sahi', bio: 'Chaussures de qualité'),
        apercuAvis: avis,
        apercuAnnonces: [
          _l('a1', commune: 'Cocody'),
          _l('a2', commune: 'Cocody'),
          _l('a3', commune: 'Cocody'),
        ],
      ),
    );

void main() {
  testWidgets('en-tête : nom, commune, « Nouveau vendeur », compteurs',
      (tester) async {
    await tester.pumpWidget(_ecran());
    await tester.pump();

    expect(find.text('Flan sahi'), findsWidgets);
    expect(find.text('Cocody'), findsOneWidget);
    expect(find.text('Nouveau vendeur'), findsOneWidget); // 0 avis
    expect(find.text('3'), findsOneWidget); // 3 annonces
    expect(find.text('—'), findsOneWidget); // pas de note
    expect(find.text('Annonces · 3'), findsOneWidget);
    expect(find.text('Avis · 0'), findsOneWidget);
  });

  testWidgets('onglet Avis montre les avis ; À propos montre la bio',
      (tester) async {
    await tester.pumpWidget(_ecran(avis: const [
      Avis(
          id: 'r1',
          note: 5,
          auteur: 'Awa',
          createdAt: 1700000000000,
          commentaire: 'Très bien'),
    ]));
    await tester.pump();

    // Avec un avis, plus de « Nouveau vendeur ».
    expect(find.text('Nouveau vendeur'), findsNothing);

    await tester.tap(find.text('Avis · 1'));
    await tester.pump();
    expect(find.text('Awa'), findsOneWidget);
    expect(find.text('Très bien'), findsOneWidget);

    await tester.tap(find.text('À propos'));
    await tester.pump();
    expect(find.text('Chaussures de qualité'), findsOneWidget);
  });
}
