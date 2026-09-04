// Banc de test de LA VIDÉO DE QUINZE SECONDES dans l'application (chantier 6
// du 04/09/2026). Le lecteur lui-même (video_player) ne tourne pas dans un
// test — pas de plateforme — ; ce qu'on vérifie, c'est tout ce qui l'entoure :
// le modèle lit l'adresse et la rend absolue, la fiche ne montre la pastille
// QUE si l'annonce a une vidéo, et le formulaire dit l'état vrai (« Ajouter »
// en création, « déjà en ligne » en modification).
//
// ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER : la même fiche est montée deux
// fois, avec et sans vidéo — si la pastille s'affichait toujours (ou jamais),
// l'un des deux passages serait rouge.
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import 'package:chapci/api/models.dart';
import 'package:chapci/screens/listing_detail_screen.dart';
import 'package:chapci/screens/publier_screen.dart';

Widget enFrancais(Widget home) => MaterialApp(
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: home,
    );

String photoDataUri() {
  final image = img.Image(width: 8, height: 8);
  img.fill(image, color: img.ColorRgb8(200, 30, 30));
  return 'data:image/png;base64,${base64Encode(Uint8List.fromList(img.encodePng(image)))}';
}

Listing annonce({String? video}) => Listing(
      id: 'a1',
      title: 'Canapé trois places',
      description: 'Bon état.',
      price: 50000,
      negotiable: false,
      categoryId: 'maison',
      subcategory: 'Meubles',
      condition: 'occasion',
      images: [photoDataUri(), photoDataUri(), photoDataUri()],
      sellerName: 'Awa',
      createdAt: 1,
      regionId: 'abidjan',
      cityId: 'abidjan',
      commune: 'Cocody',
      video: video,
    );

void main() {
  group('Le modèle', () {
    test('lit l’adresse de la vidéo et la rend absolue', () {
      final a = Listing.fromJson({
        'id': 'a1', 'title': 'x', 'description': '', 'price': 1,
        'categoryId': 'maison', 'condition': 'occasion', 'images': [],
        'sellerName': 'Awa', 'createdAt': 1,
        'video': '/uploads/videos/202609-abc.mp4',
      });
      expect(a.video, '/uploads/videos/202609-abc.mp4');
      expect(a.videoUrl, 'https://chap.ci/uploads/videos/202609-abc.mp4');
    });

    test('sans vidéo (null, absent ou vide), videoUrl est null', () {
      for (final j in [
        {'video': null},
        <String, dynamic>{},
        {'video': ''},
      ]) {
        final a = Listing.fromJson({
          'id': 'a1', 'title': 'x', 'description': '', 'price': 1,
          'categoryId': 'maison', 'condition': 'occasion', 'images': [],
          'sellerName': 'Awa', 'createdAt': 1, ...j,
        });
        expect(a.video, isNull, reason: 'cas $j');
        expect(a.videoUrl, isNull, reason: 'cas $j');
      }
    });
  });

  group('La fiche', () {
    testWidgets('montre la pastille « Vidéo · 15 s » quand l’annonce en a une',
        (tester) async {
      await tester.pumpWidget(enFrancais(ListingDetailScreen(
          annonce: annonce(video: '/uploads/videos/v.mp4'), apercu: true)));
      await tester.pump();
      expect(find.byKey(const ValueKey('pastille-video')), findsOneWidget);
      expect(find.text('Vidéo · 15 s'), findsOneWidget);
    });

    testWidgets('ne montre rien sans vidéo', (tester) async {
      await tester.pumpWidget(
          enFrancais(ListingDetailScreen(annonce: annonce(), apercu: true)));
      await tester.pump();
      expect(find.byKey(const ValueKey('pastille-video')), findsNothing);
      expect(find.text('Vidéo · 15 s'), findsNothing);
    });
  });

  group('Le formulaire', () {
    testWidgets('en création, propose d’ajouter une vidéo, facultative',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(const PublierScreen()));
      await tester.pump();
      // Le titre porte « (facultatif) » dans le même texte riche.
      expect(find.textContaining('Une vidéo de quinze secondes  (facultatif)'), findsOneWidget);
      expect(find.byKey(const ValueKey('video-ajouter')), findsOneWidget);
      expect(find.text('Ajouter une vidéo'), findsOneWidget);
      expect(find.byKey(const ValueKey('video-etat')), findsNothing);
    });

    testWidgets('en modification, dit que la vidéo est déjà en ligne, et sait la retirer',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(
          PublierScreen(annonce: annonce(video: '/uploads/videos/v.mp4'))));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byKey(const ValueKey('video-etat')), findsOneWidget);
      expect(find.text('Votre vidéo, déjà en ligne.'), findsOneWidget);
      // « Retirer » : la tuile d'ajout revient, et dit que la vidéo en ligne
      // partira à l'enregistrement — pas avant.
      await tester.tap(find.text('Retirer'));
      await tester.pump();
      expect(find.byKey(const ValueKey('video-ajouter')), findsOneWidget);
      expect(find.text('La vidéo en ligne sera retirée à l’enregistrement.'),
          findsOneWidget);
    });

    testWidgets('en modification d’une annonce sans vidéo, propose d’en ajouter une',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 3000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(PublierScreen(annonce: annonce())));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byKey(const ValueKey('video-ajouter')), findsOneWidget);
      expect(find.byKey(const ValueKey('video-etat')), findsNothing);
    });
  });
}
