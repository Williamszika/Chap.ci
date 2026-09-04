// Banc de test de la MODIFICATION d'une annonce depuis l'application
// (chantier 2 du 04/09/2026). Un vendeur ouvre son annonce dans le formulaire :
// chaque champ doit porter ce qui est en ligne — titre, prix, description,
// téléphone, catégorie, sous-catégorie, état, options, photos — sans quoi il
// « corrigerait » un formulaire vide et effacerait son annonce en croyant la
// retoucher.
//
// ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : la sous-catégorie choisie est
// « Smartphones », dont le formulaire détaillé existe — les puces « Samsung »
// et « 128 Go » doivent être cochées à partir des attributs enregistrés, y
// compris le choix multiple « Chargeur, Boîte » sérialisé en texte.
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import 'package:chapci/api/models.dart';
import 'package:chapci/screens/publier_screen.dart';

/// L'application en FRANÇAIS : sans locale, MaterialApp part en anglais et
/// `tr()` rend les textes anglais — le test chercherait « Modifier l'annonce »
/// dans un écran qui dit « Edit listing ».
Widget enFrancais(Widget home) => MaterialApp(
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: home,
    );

/// Une photo en data-URI : pas de réseau dans un test.
String photoDataUri() {
  final image = img.Image(width: 8, height: 8);
  img.fill(image, color: img.ColorRgb8(200, 30, 30));
  return 'data:image/png;base64,${base64Encode(Uint8List.fromList(img.encodePng(image)))}';
}

void main() {
  testWidgets('le formulaire se préremplit avec l’annonce à modifier', (tester) async {
    final a = Listing(
      id: 'a1',
      title: 'Samsung Galaxy A15, 128 Go',
      description: 'Très bon état, avec chargeur.',
      price: 85000,
      negotiable: true,
      categoryId: 'electronique',
      subcategory: 'Smartphones',
      condition: 'occasion',
      images: [photoDataUri(), photoDataUri()],
      sellerName: 'Awa',
      sellerPhone: '0700000001',
      createdAt: 1,
      delivery: true,
      regionId: 'abidjan',
      cityId: 'abidjan',
      commune: 'Cocody',
      attributes: const {
        'marque': 'Samsung',
        'modele': 'Galaxy A15',
        'stockage': '128 Go',
        'fournis': 'Chargeur, Boîte d’origine',
      },
    );
    tester.view.physicalSize = const Size(1080, 3000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    await tester.pumpWidget(enFrancais(PublierScreen(annonce: a)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    // Le titre de l'écran et le bouton disent « modifier », pas « publier ».
    expect(find.text('Modifier l’annonce'), findsOneWidget);
    expect(find.text('Enregistrer les modifications'), findsOneWidget);
    expect(find.text('Publier mon annonce'), findsNothing);

    // Les champs de base.
    expect(find.widgetWithText(TextFormField, 'Samsung Galaxy A15, 128 Go'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, '85000'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Très bon état, avec chargeur.'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, '0700000001'), findsOneWidget);

    // Deux photos existantes : le compteur le dit, avec le plancher de DEUX
    // (la règle du serveur : on ne retire pas toutes les photos qui étaient là).
    expect(find.textContaining('2/2 photos minimum'), findsOneWidget);

    // Le formulaire détaillé « Smartphones » est monté, et ses puces cochées.
    final chipSamsung = tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'Samsung'));
    expect(chipSamsung.selected, isTrue, reason: 'la marque enregistrée doit être cochée');
    final chip128 = tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, '128 Go'));
    expect(chip128.selected, isTrue, reason: 'le stockage enregistré doit être coché');
    // Le choix multiple, sérialisé « Chargeur, Boîte » : les deux puces cochées.
    await tester.scrollUntilVisible(find.widgetWithText(ChoiceChip, 'Chargeur'), 300,
        scrollable: find.byType(Scrollable).first);
    final chipChargeur = tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'Chargeur'));
    expect(chipChargeur.selected, isTrue, reason: 'un choix multiple enregistré doit être coché');
  });

  testWidgets('sans annonce, le formulaire reste celui de la publication', (tester) async {
    await tester.pumpWidget(enFrancais(const PublierScreen()));
    await tester.pump();
    expect(find.text('Publier une annonce'), findsOneWidget);
    expect(find.textContaining('0/3 photos minimum'), findsOneWidget);
  });
}
