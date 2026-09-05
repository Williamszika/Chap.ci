// Banc de test des RÉSEAUX SOCIAUX DU PROFESSIONNEL dans l'application
// (05/09/2026) : le modèle lit ce que le serveur rend, la page vendeur montre
// les pastilles seulement quand il y en a, l'écran d'édition part de ce qui
// est enregistré, et les neuf icônes se dessinent réellement.
//
// ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER. Les icônes sont des tracés SVG
// interprétés par notre propre lecteur (`cheminSvg`) : un tracé mal lu donne
// une pastille vide, pas une erreur. On peint donc les neuf icônes dans un
// PNG et on compte, cellule par cellule, les pixels d'encre — une icône
// absente fait zéro. Le PNG est aussi écrit sur le disque pour l'œil.
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import 'package:chapci/api/profil.dart';
import 'package:chapci/data/reseaux.dart';
import 'package:chapci/screens/reseaux_screen.dart';
import 'package:chapci/screens/vendeur_screen.dart';

Widget enFrancais(Widget home) => MaterialApp(
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: home,
    );

ProfilPublic profilPro({Map<String, String> reseaux = const {}}) => ProfilPublic(
      id: 'u1',
      nom: 'Awa Koffi',
      proNom: 'Maison Koffi',
      proType: 'commerce',
      proSecteur: 'Mode',
      proReseaux: reseaux,
    );

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Le modèle', () {
    test('lit {facebook: url, …} et ignore ce qui n’est pas une adresse https', () {
      final p = ProfilPublic.fromJson({
        'id': 'u1', 'fullName': 'Awa',
        'pro': {'nom': 'Maison Koffi', 'reseaux': {
          'facebook': 'https://www.facebook.com/maisonkoffi',
          'tiktok': 'https://www.tiktok.com/@maisonkoffi',
          'site': 'http://pas-https.ci',
          'x': '',
          'inconnu': 12,
        }},
      });
      expect(p.proReseaux, {
        'facebook': 'https://www.facebook.com/maisonkoffi',
        'tiktok': 'https://www.tiktok.com/@maisonkoffi',
      });
      expect(reseauxPresents(p.proReseaux).map((e) => e.$1.nom).toList(),
          ['Facebook', 'TikTok']);
    });

    test('sans réseaux (absent, liste, objet vide), la carte est vide', () {
      for (final pro in [
        {'nom': 'X'},
        {'nom': 'X', 'reseaux': []},
        {'nom': 'X', 'reseaux': {}},
      ]) {
        final p = ProfilPublic.fromJson({'id': 'u1', 'fullName': 'Awa', 'pro': pro});
        expect(p.proReseaux, isEmpty, reason: 'cas $pro');
      }
    });

    test('l’adresse se lit sans son habillage', () {
      expect(lisibleReseau('https://www.facebook.com/maisonkoffi/'), 'facebook.com/maisonkoffi');
      expect(lisibleReseau('https://t.me/maisonkoffi'), 't.me/maisonkoffi');
    });
  });

  group('La page vendeur', () {
    testWidgets('montre les pastilles quand l’enseigne a des réseaux', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(VendeurScreen(
        sellerId: 'u1',
        sellerName: 'Awa',
        apercu: true,
        apercuProfil: profilPro(reseaux: const {
          'facebook': 'https://www.facebook.com/maisonkoffi',
          'snapchat': 'https://www.snapchat.com/add/maisonkoffi',
          'site': 'https://maisonkoffi.ci',
        }),
      )));
      await tester.pump();
      expect(find.byKey(const ValueKey('pilles-reseaux')), findsOneWidget);
      expect(find.text('RETROUVEZ MAISON KOFFI SUR'), findsOneWidget);
      expect(find.text('Facebook'), findsOneWidget);
      expect(find.text('Snapchat'), findsOneWidget);
      expect(find.text('Site web'), findsOneWidget);
      expect(find.text('TikTok'), findsNothing);
    });

    testWidgets('ne montre rien sans réseaux', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(VendeurScreen(
          sellerId: 'u1', sellerName: 'Awa', apercu: true, apercuProfil: profilPro())));
      await tester.pump();
      expect(find.byKey(const ValueKey('pilles-reseaux')), findsNothing);
      expect(find.text('Facebook'), findsNothing);
    });
  });

  group('L’écran d’édition', () {
    testWidgets('part de ce qui est enregistré, un champ par réseau', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      await tester.pumpWidget(enFrancais(const ReseauxScreen(
          initiaux: {'instagram': 'https://www.instagram.com/maison.koffi'})));
      await tester.pump();
      for (final r in reseaux) {
        expect(find.byKey(ValueKey('reseau-${r.id}')), findsOneWidget, reason: r.id);
      }
      final champ = tester.widget<TextField>(find.byKey(const ValueKey('reseau-instagram')));
      expect(champ.controller?.text, 'https://www.instagram.com/maison.koffi');
      expect(tester.widget<TextField>(find.byKey(const ValueKey('reseau-facebook'))).controller?.text, '');
      expect(find.byKey(const ValueKey('reseaux-enregistrer')), findsOneWidget);
    });
  });

  group('Les icônes', () {
    test('les neuf se dessinent — chaque cellule du PNG porte de l’encre', () async {
      const cellule = 96.0;
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      canvas.drawRect(Rect.fromLTWH(0, 0, cellule * reseaux.length, cellule),
          Paint()..color = const Color(0xFFF6EFE3));
      for (var i = 0; i < reseaux.length; i++) {
        final r = reseaux[i];
        final centre = Offset(cellule * i + cellule / 2, cellule / 2);
        final fond = Paint();
        if (r.degrade != null) {
          fond.shader = r.degrade!.createShader(Rect.fromCircle(center: centre, radius: 36));
        } else {
          fond.color = r.couleur;
        }
        canvas.drawCircle(centre, 36, fond);
        canvas.save();
        canvas.translate(centre.dx - 20, centre.dy - 20);
        // Le même dessin que le widget, à 40 px.
        const k = 40 / 24;
        canvas.scale(k, k);
        final peinture = Paint()
          ..color = r.encre
          ..style = r.id == 'snapchat' ? PaintingStyle.fill : PaintingStyle.stroke
          ..strokeWidth = r.id == 'x' ? 2.4 : 2
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round;
        for (final d in tracesDe(r.id)) {
          canvas.drawPath(cheminSvg(d), peinture);
        }
        canvas.restore();
      }
      final image = await recorder.endRecording().toImage((cellule * reseaux.length).toInt(), cellule.toInt());
      final png = (await image.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List();
      final sortie = Platform.environment['RESEAUX_PNG'];
      if (sortie != null && sortie.isNotEmpty) File(sortie).writeAsBytesSync(png);

      final decode = img.decodePng(Uint8List.fromList(png))!;
      for (var i = 0; i < reseaux.length; i++) {
        final r = reseaux[i];
        var encre = 0;
        for (var y = 0; y < cellule; y++) {
          for (var x = 0; x < cellule; x++) {
            final p = decode.getPixel((cellule * i + x).toInt(), y);
            final proche = (p.r - (r.encre.r * 255)).abs() < 40 &&
                (p.g - (r.encre.g * 255)).abs() < 40 &&
                (p.b - (r.encre.b * 255)).abs() < 40;
            if (proche) encre++;
          }
        }
        // Un trait de 2 unités sur 24, à 40 px : plusieurs centaines de pixels.
        expect(encre, greaterThan(150), reason: '${r.id} : $encre pixels d’encre');
      }
    });

    test('le lecteur de tracés comprend les arcs, les relatifs et les fermetures', () {
      // Un cercle par deux arcs : la boîte englobante fait 20 × 20.
      final cercle = cheminSvg('M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0z');
      final b = cercle.getBounds();
      expect(b.width, closeTo(20, 0.5));
      expect(b.height, closeTo(20, 0.5));
      // Le « f » de Facebook tient dans la boîte 24 × 24.
      final f = cheminSvg(tracesDe('facebook').first).getBounds();
      expect(f.left, greaterThanOrEqualTo(6));
      expect(f.right, lessThanOrEqualTo(19));
    });
  });
}
