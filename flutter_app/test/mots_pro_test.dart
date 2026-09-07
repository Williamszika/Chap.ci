// Les mots par type de structure (07/09/2026) : une association n'est pas
// « professionnelle depuis », elle « remet des dons » et fait vérifier un
// récépissé ; une boutique garde ses ventes et son registre ; une école a un
// agrément.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:chapci/api/profil.dart';
import 'package:chapci/data/mots_pro.dart';
import 'package:chapci/screens/vendeur_screen.dart';

Widget enFrancais(Widget home) => MaterialApp(
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: home,
    );

void grandEcran(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('les familles de types', () {
    expect(estAssociation('association'), isTrue);
    expect(estAssociation('boutique'), isFalse);
    expect(aAgrement('formation'), isTrue);
    expect(aAgrement('finance'), isTrue);
    expect(aAgrement('restauration'), isFalse);
    expect(estBoutique(null), isTrue, reason: 'sans type, les mots de la boutique');
    expect(estBoutique('commerce'), isTrue);
    expect(estBoutique('association'), isFalse);
  });

  testWidgets('une association : vérifiée, dons remis, récépissé', (tester) async {
    grandEcran(tester);
    await tester.pumpWidget(enFrancais(const VendeurScreen(
      sellerId: 'u1',
      sellerName: 'Awa',
      apercu: true,
      apercuProfil: ProfilPublic(
          id: 'u1', nom: 'Awa', proNom: 'Solidarité Cocody', proType: 'association',
          proSecteur: 'Aide sociale & dons', proRegistreVerifie: true,
          proDepuis: 1780000000000, proVentes: 3),
    )));
    await tester.pump();
    expect(find.text('✓ ASSOCIATION VÉRIFIÉE'), findsOneWidget);
    expect(find.text('dons remis'), findsOneWidget);
    expect(find.text('vérifiée'), findsOneWidget);
    expect(find.textContaining('Association depuis'), findsOneWidget);
    // « Aucune annonce en vente » reste : c'est la liste vide, pas le chiffre.
    expect(find.text('vente conclue'), findsNothing);
    expect(find.text('ventes conclues'), findsNothing);
    await tester.tap(find.widgetWithText(ChoiceChip, 'À propos'));
    await tester.pumpAndSettle();
    expect(find.text('✓ Récépissé vérifié par l’équipe Chap.ci'), findsOneWidget);
    expect(find.textContaining('récépissé de cette association'), findsOneWidget);
  });

  testWidgets('une boutique garde ses ventes et son registre', (tester) async {
    grandEcran(tester);
    await tester.pumpWidget(enFrancais(const VendeurScreen(
      sellerId: 'u1',
      sellerName: 'Awa',
      apercu: true,
      apercuProfil: ProfilPublic(
          id: 'u1', nom: 'Awa', proNom: 'Maison Koffi', proType: 'boutique',
          proRegistreVerifie: true, proDepuis: 1780000000000, proVentes: 1),
    )));
    await tester.pump();
    expect(find.text('✓ PROFESSIONNEL'), findsOneWidget);
    expect(find.text('vente conclue'), findsOneWidget);
    expect(find.textContaining('Professionnel depuis'), findsOneWidget);
    await tester.tap(find.widgetWithText(ChoiceChip, 'À propos'));
    await tester.pumpAndSettle();
    expect(find.text('✓ Registre vérifié par l’équipe Chap.ci'), findsOneWidget);
    expect(find.text('Cette boutique n’a pas encore écrit sa présentation.'), findsOneWidget);
  });

  testWidgets('une école : agrément vérifié, structure', (tester) async {
    grandEcran(tester);
    await tester.pumpWidget(enFrancais(const VendeurScreen(
      sellerId: 'u1',
      sellerName: 'Awa',
      apercu: true,
      apercuProfil: ProfilPublic(
          id: 'u1', nom: 'Awa', proNom: 'Institut Akwaba', proType: 'formation',
          proRegistreVerifie: true),
    )));
    await tester.pump();
    await tester.tap(find.widgetWithText(ChoiceChip, 'À propos'));
    await tester.pumpAndSettle();
    expect(find.text('✓ Agrément vérifié par l’équipe Chap.ci'), findsOneWidget);
    expect(find.textContaining('agrément de cette structure'), findsOneWidget);
    expect(find.text('Cette structure n’a pas encore écrit sa présentation.'), findsOneWidget);
  });
}
