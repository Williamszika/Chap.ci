// Banc de test des quatre nouveautés du 03/09/2026 portées dans l'application :
// l'affiche pour le statut WhatsApp, « Ça vaut combien ? », « Faire une offre »
// et « Chap.ci écrit l'annonce ».
//
// ⚠️ UNE VÉRIFICATION DOIT POUVOIR ÉCHOUER. L'affiche n'est pas seulement
// « produite » : on relit le PNG pixel par pixel — le crème du fond, le vert de
// la pastille, l'orange de l'appel, la photo dans son cadre. Un canvas qui
// dessinerait tout au mauvais endroit rendrait un PNG valide et passerait un
// test qui ne regarde que la taille.
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;

import 'package:chapci/affiche.dart';
import 'package:chapci/api/deviner.dart';
import 'package:chapci/api/messaging.dart';
import 'package:chapci/api/prix_marche.dart';
import 'package:chapci/data/categories.dart';
import 'package:chapci/data/formulaires/electronique.dart';
import 'package:chapci/data/formulaires/registre.dart';
import 'package:chapci/screens/formulaire_dynamique.dart';
import 'package:chapci/widgets/offre.dart';

/// Une photo synthétique : un aplat d'une couleur, en JPEG.
Uint8List photoUnie(int largeur, int hauteur, int r, int g, int b) {
  final image = img.Image(width: largeur, height: hauteur);
  img.fill(image, color: img.ColorRgb8(r, g, b));
  return Uint8List.fromList(img.encodeJpg(image, quality: 90));
}

/// La couleur d'un pixel du PNG, en (r, g, b).
(int, int, int) pixel(img.Image image, int x, int y) {
  final p = image.getPixel(x, y);
  return (p.r.toInt(), p.g.toInt(), p.b.toInt());
}

/// Deux couleurs sont « proches » si aucune composante ne s'écarte de plus de
/// [tol] : l'anticrénelage et la compression bougent de quelques unités.
bool proche((int, int, int) a, (int, int, int) b, [int tol = 12]) =>
    (a.$1 - b.$1).abs() <= tol &&
    (a.$2 - b.$2).abs() <= tol &&
    (a.$3 - b.$3).abs() <= tol;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('L’affiche pour le statut WhatsApp', () {
    test('fait 1080 × 1920, et chaque zone porte sa couleur', () async {
      final png = await rendreAffiche(AfficheDonnees(
        id: 'abc123',
        titre: 'iPhone 13 128 Go, batterie impeccable, avec chargeur d’origine',
        prix: '245 000 FCFA',
        prixBarre: '290 000 FCFA',
        photoOctets: photoUnie(400, 300, 200, 30, 30),
        lieu: 'Cocody · Abidjan',
        etat: 'Occasion',
      ));
      final image = img.decodePng(png);
      expect(image, isNotNull, reason: 'le PNG doit se décoder');
      expect(image!.width, 1080);
      expect(image.height, 1920);

      // Le fond, dans le coin : crème.
      expect(proche(pixel(image, 10, 10), (255, 253, 249)), isTrue,
          reason: 'le coin haut-gauche doit être crème');
      // La photo, au centre de son cadre (250 → 1250) : le rouge de l'aplat.
      expect(proche(pixel(image, 540, 700), (200, 30, 30), 20), isTrue,
          reason: 'la photo doit remplir son cadre');
      // La pastille du prix, juste sous son bord haut (1186), hors du texte.
      expect(proche(pixel(image, 540, 1198), (0, 158, 96)), isTrue,
          reason: 'la pastille du prix doit être verte');
      // L'appel « Voir l'annonce » (1644 → 1774), au-dessus et en dessous du
      // texte — pas à côté : la police de test dessine chaque lettre comme un
      // carré d'un em, et la ligne déborde du bouton ; sur le téléphone, non.
      expect(proche(pixel(image, 540, 1660), (247, 127, 0)), isTrue,
          reason: 'l’appel doit être orange (haut)');
      expect(proche(pixel(image, 540, 1760), (247, 127, 0)), isTrue,
          reason: 'l’appel doit être orange (bas)');
      // Sous l'appel, le lien en gris sur crème : le bas de page est crème.
      expect(proche(pixel(image, 20, 1900), (255, 253, 249)), isTrue);

      // Pour regarder l'affiche : AFFICHE_SORTIE=/chemin/affiche.png flutter test …
      final sortie = Platform.environment['AFFICHE_SORTIE'];
      if (sortie != null && sortie.isNotEmpty) {
        File(sortie).writeAsBytesSync(png);
      }
    });

    test('sans photo, l’affiche existe quand même (filigrane sur fond pâle)',
        () async {
      final png = await rendreAffiche(const AfficheDonnees(
        id: 'x',
        titre: 'Chaise en rotin',
        prix: 'Gratuit',
        lieu: 'Bouaké',
        etat: 'Occasion',
      ));
      final image = img.decodePng(png)!;
      expect(image.width, 1080);
      // Le cadre sans photo est crème foncé, pas rouge, pas blanc.
      final coin = pixel(image, 100, 270);
      expect(proche(coin, (253, 239, 220), 10), isTrue,
          reason: 'le cadre vide doit être crème foncé, était $coin');
    });

    test('le titre se coupe sur un mot, jamais au milieu', () {
      const style = TextStyle(fontSize: 68, fontWeight: FontWeight.w800);
      final l = couperLignes(
          'iPhone 13 128 Go, batterie impeccable, avec chargeur d’origine et boîte',
          style,
          908,
          2);
      expect(l.length, 2);
      expect(l.last.endsWith('…'), isTrue);
      // Le dernier mot gardé est entier : ce qui précède les points est un mot
      // qui existe dans le titre.
      final garde = l.last.replaceAll(RegExp(r'\s*…$'), '').split(' ').last;
      expect('iPhone 13 128 Go, batterie impeccable, avec chargeur d’origine et boîte'
              .split(RegExp(r'[\s,]+'))
              .contains(garde),
          isTrue,
          reason: '« $garde » doit être un mot entier du titre');
      // Un titre court tient sur une ligne, sans points.
      expect(couperLignes('Chaise', style, 908, 2), ['Chaise']);
    });
  });

  group('« Ça vaut combien ? »', () {
    const f = PrixMarche(n: 12, jours: 180, base: 'sous-catégorie', p25: 40000, p75: 80000);
    test('les seuils sont ceux du site : 60 % du bas, 140 % du haut', () {
      expect(verdictPrix(23999, f), VerdictPrix.bas);
      expect(verdictPrix(24000, f), VerdictPrix.moyen);
      expect(verdictPrix(112000, f), VerdictPrix.moyen);
      expect(verdictPrix(112001, f), VerdictPrix.haut);
      expect(verdictPrix(0, f), isNull);
    });
    test('sous cinq annonces ou sans fourchette, pas de verdict', () {
      expect(verdictPrix(50000, const PrixMarche(n: 3, jours: 180, base: 'x', p25: 1, p75: 2)), isNull);
      expect(verdictPrix(50000, PrixMarche.fromJson({'n': 20, 'p25': null, 'p75': null})), isNull);
      expect(verdictPrix(50000, null), isNull);
    });
  });

  group('« Faire une offre »', () {
    test('le montant suggéré : −10 %, arrondi aux 500, jamais sous 500', () {
      expect(montantSuggere(45000), 40500);
      expect(montantSuggere(1000), 1000);
      expect(montantSuggere(300), 500);
      expect(montantSuggere(120000), 108000);
    });
    test('un message-offre et une conversation avec offre en attente se lisent', () {
      final m = Msg.fromJson({
        'id': 'm1',
        'conversationId': 'c1',
        'senderId': 'u2',
        'body': 'Offre : 40 500 FCFA',
        'createdAt': 1,
        'offre': {'montant': 40500, 'statut': 'proposee', 'par': 'u2'},
      });
      expect(m.offre, isNotNull);
      expect(m.offre!.montant, 40500);
      expect(m.offre!.ouverte, isTrue);
      expect(m.offre!.par, 'u2');
      final sans = Msg.fromJson({'id': 'm2', 'body': 'Bonjour'});
      expect(sans.offre, isNull);
      final c = Conversation.fromJson({'id': 'c1', 'offreEnAttente': 40500});
      expect(c.offreEnAttente, 40500);
      expect(Conversation.fromJson({'id': 'c2'}).offreEnAttente, isNull);
    });
  });

  group('« Chap.ci écrit l’annonce »', () {
    test('le catalogue envoyé au moteur est celui de l’application', () {
      final cat = catalogueDeviner();
      expect(cat.length, categories.length);
      final elec = cat.firstWhere((c) => c['id'] == 'electronique');
      expect(elec['label'], 'Électronique');
      final sous = (elec['sous'] as List).map((s) => s['id']).toList();
      expect(sous, sousDe('electronique'));
      expect(sous, contains('Smartphones'));
    });

    test('la réponse du moteur se lit, clés en minuscules', () {
      final d = Devine.fromJson({
        'titre': ' Samsung Galaxy A12 64 Go ',
        'description': 'Bon état.',
        'categoryId': 'electronique',
        'subcategory': 'Smartphones',
        'etat': 'occasion',
        'caracteristiques': {'Marque': 'Samsung', 'STOCKAGE': ' 64 Go ', 'vide': ''},
        'confiance': 82,
      });
      expect(d.titre, 'Samsung Galaxy A12 64 Go');
      expect(d.caracteristiques, {'marque': 'Samsung', 'stockage': '64 Go'});
      expect(d.confiance, 82);
    });

    test('la photo est réduite à 768 px et recomprimée en JPEG', () async {
      final grande = photoUnie(1600, 1200, 10, 120, 200);
      final petite = await reduirePourVision(grande);
      expect(petite, isNotNull);
      final image = img.decodeJpg(petite!);
      expect(image, isNotNull, reason: 'le résultat doit être un JPEG');
      expect(image!.width, 768);
      expect(image.height, 576);
      expect(petite.length, lessThan(grande.length));
      // Une photo déjà petite n'est pas agrandie.
      final deja = await reduirePourVision(photoUnie(300, 200, 0, 0, 0));
      expect(img.decodeJpg(deja!)!.width, 300);
      // Des octets qui ne sont pas une image : `null`, sans exception.
      expect(await reduirePourVision(Uint8List.fromList([1, 2, 3])), isNull);
    });

    testWidgets('les caractéristiques lues se posent dans les champs vides, vérifiées',
        (tester) async {
      EtatFormulaire? dernier;
      final cle = GlobalKey<FormulaireDynamiqueState>();
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: FormulaireDynamique(
              key: cle,
              schema: electronique['Smartphones']!,
              onChange: (e) => dernier = e,
            ),
          ),
        ),
      ));
      await tester.pump();
      cle.currentState!.appliquerSuggestions({
        'marque': 'samsung', // casse différente → « Samsung »
        'modele': 'Galaxy A15', // dans la table de la marque
        'stockage': '128 go', // → « 128 Go »
        'ram': 'énorme', // inconnue, pas de saisie libre → ignorée
        'batterie': 'Plus de 90 %',
        'inexistant': 'x', // pas de champ → ignorée
      });
      await tester.pump();
      final a = dernier!.attributs;
      expect(a['marque'], 'Samsung');
      expect(a['modele'], 'Galaxy A15');
      expect(a['stockage'], '128 Go');
      expect(a['batterie'], 'Plus de 90 %');
      expect(a.containsKey('ram'), isFalse);
      expect(a.containsKey('inexistant'), isFalse);

      // Un second passage ne touche pas ce qui est déjà rempli.
      cle.currentState!.appliquerSuggestions({'marque': 'Apple', 'ram': '4 Go'});
      await tester.pump();
      expect(dernier!.attributs['marque'], 'Samsung');
      expect(dernier!.attributs['ram'], '4 Go');
    });
  });
}
