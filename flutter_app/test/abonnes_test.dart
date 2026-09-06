// Banc de test des ABONNÉS ET DES OFFRES D'EMPLOI dans l'application
// (06/09/2026) : le modèle lit ce que le serveur rend, la page vendeur montre
// « Suivre · 12 » et l'onglet « Emplois · 2 » pour une structure (et rien de
// tout cela pour un particulier), l'écran d'une offre pose les questions du
// formulaire, l'auteur voit ses candidatures, et le constructeur part des
// trois questions de base.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:chapci/api/offres.dart';
import 'package:chapci/api/profil.dart';
import 'package:chapci/notifications.dart';
import 'package:chapci/screens/offre_screen.dart';
import 'package:chapci/screens/offres_pro_screen.dart';
import 'package:chapci/screens/vendeur_screen.dart';

Widget enFrancais(Widget home) => MaterialApp(
      locale: const Locale('fr'),
      supportedLocales: const [Locale('fr')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      home: home,
    );

const offreVendeuse = OffreEmploi(
  id: 'o1',
  userId: 'u1',
  entreprise: 'Maison Koffi',
  typeStructure: 'commerce',
  titre: 'Vendeuse en boutique',
  description: 'Accueil, encaissement, rangement. Six jours sur sept.',
  contrat: 'CDI',
  lieu: 'Cocody',
  salaire: '120 000 FCFA',
  formulaire: [
    ChampFormulaire(id: 'nom', label: 'Votre nom complet', type: 'texte', requis: true),
    ChampFormulaire(id: 'tel', label: 'Votre numéro de téléphone', type: 'tel', requis: true),
    ChampFormulaire(id: 'exp', label: 'Années d’expérience', type: 'choix', requis: true,
        options: ['Moins de 2 ans', '2 à 5 ans', 'Plus de 5 ans']),
    ChampFormulaire(id: 'permis', label: 'Avez-vous un permis ?', type: 'ouinon'),
  ],
  createdAt: 1788700000000,
  expiresAt: 4102444800000,
);

const offreStagiaire = OffreEmploi(
  id: 'o2',
  userId: 'u1',
  entreprise: 'Maison Koffi',
  titre: 'Stagiaire communication',
  description: 'Réseaux sociaux, photos, montage.',
  lien: 'https://forms.gle/abc123',
  createdAt: 1788700000000,
);

void grandEcran(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.resetPhysicalSize);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Le modèle', () {
    test('le profil lit les abonnés, les offres ouvertes, et si je suis', () {
      final p = ProfilPublic.fromJson({
        'id': 'u1', 'fullName': 'Awa', 'abonne': true,
        'pro': {'nom': 'Maison Koffi', 'abonnes': 12, 'offres': 2},
      });
      expect(p.abonne, isTrue);
      expect(p.proAbonnes, 12);
      expect(p.proOffres, 2);
      final q = ProfilPublic.fromJson({'id': 'u2', 'fullName': 'Koffi'});
      expect(q.abonne, isFalse);
      expect(q.proAbonnes, 0);
      expect(q.proOffres, 0);
    });

    test('une offre lit son formulaire, et « candidatures » n’est là que pour l’auteur', () {
      final o = OffreEmploi.fromJson({
        'id': 'o1', 'userId': 'u1', 'entreprise': 'Maison Koffi', 'titre': 'Vendeuse',
        'description': 'd', 'contrat': null, 'lieu': '', 'lien': null,
        'formulaire': [
          {'id': 'nom', 'label': 'Nom', 'type': 'texte', 'requis': true},
          {'id': 'q2', 'label': 'Exp', 'type': 'choix', 'options': ['a', 'b']},
        ],
        'statut': 'ouverte', 'candidatures': null, 'createdAt': 1, 'expiresAt': null,
      });
      expect(o.formulaire.length, 2);
      expect(o.formulaire[1].options, ['a', 'b']);
      expect(o.formulaire[0].requis, isTrue);
      expect(o.formulaire[1].requis, isFalse);
      expect(o.candidatures, isNull);
      expect(o.lieu, isNull, reason: 'une chaîne vide vaut absent');
      expect(o.ouverte, isTrue);
      final fermee = OffreEmploi.fromJson({
        'id': 'o2', 'userId': 'u1', 'entreprise': 'X', 'titre': 't', 'description': 'd',
        'statut': 'fermee', 'candidatures': 3,
      });
      expect(fermee.ouverte, isFalse);
      expect(fermee.candidatures, 3);
      final expiree = OffreEmploi.fromJson({
        'id': 'o3', 'userId': 'u1', 'entreprise': 'X', 'titre': 't', 'description': 'd',
        'statut': 'ouverte', 'expiresAt': 1000,
      });
      expect(expiree.ouverte, isFalse);
    });

    test('un champ « choix » emporte ses options dans le JSON, un texte non', () {
      expect(
          const ChampFormulaire(id: 'a', label: 'A', type: 'choix', options: ['x', 'y']).toJson(),
          {'id': 'a', 'label': 'A', 'type': 'choix', 'requis': false, 'options': ['x', 'y']});
      expect(const ChampFormulaire(id: 'b', label: 'B', requis: true).toJson().containsKey('options'),
          isFalse);
    });

    test('une notification « #/emploi/{id} » porte l’identifiant de l’offre', () {
      const n = NotifItem(id: 'n1', type: 'abonnement', titre: 't', corps: 'c',
          lien: '#/emploi/fe72e4ef-fffc-4fbf-8fce-8996c3d1948c', lue: false, cree: 0);
      expect(n.offreId, 'fe72e4ef-fffc-4fbf-8fce-8996c3d1948c');
      expect(n.annonceId, isNull);
      const a = NotifItem(id: 'n2', type: 'abonnement', titre: 't', corps: 'c',
          lien: '#/annonce/abc', lue: false, cree: 0);
      expect(a.offreId, isNull);
      expect(a.annonceId, 'abc');
    });
  });

  group('La page vendeur', () {
    testWidgets('une structure : « Suivre · 12 » et l’onglet « Emplois · 2 » qui liste ses offres',
        (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const VendeurScreen(
        sellerId: 'u1',
        sellerName: 'Awa',
        apercu: true,
        apercuProfil: ProfilPublic(
            id: 'u1', nom: 'Awa Koffi', proNom: 'Maison Koffi', proType: 'commerce',
            proAbonnes: 12, proOffres: 2),
        apercuOffres: [offreVendeuse, offreStagiaire],
      )));
      await tester.pump();
      expect(find.byKey(const ValueKey('vend-suivre')), findsOneWidget);
      expect(find.text('Suivre · 12'), findsOneWidget);
      expect(find.text('Emplois · 2'), findsOneWidget);
      await tester.tap(find.text('Emplois · 2'));
      await tester.pumpAndSettle();
      expect(find.text('Vendeuse en boutique'), findsOneWidget);
      expect(find.text('Stagiaire communication'), findsOneWidget);
      expect(find.text('CDI'), findsOneWidget);
      expect(find.text('Cocody'), findsOneWidget);
    });

    testWidgets('déjà abonné : le bouton dit « Suivi · 12 »', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const VendeurScreen(
        sellerId: 'u1',
        sellerName: 'Awa',
        apercu: true,
        apercuProfil: ProfilPublic(
            id: 'u1', nom: 'Awa Koffi', proNom: 'Maison Koffi', proType: 'commerce',
            proAbonnes: 12, abonne: true),
      )));
      await tester.pump();
      expect(find.text('Suivi · 12'), findsOneWidget);
      expect(find.textContaining('Emplois'), findsNothing,
          reason: 'sans poste ouvert, pas d’onglet Emplois');
    });

    testWidgets('un particulier ne se suit pas : ni bouton Suivre, ni onglet Emplois',
        (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const VendeurScreen(
        sellerId: 'u2',
        sellerName: 'Koffi',
        apercu: true,
        apercuProfil: ProfilPublic(id: 'u2', nom: 'Koffi'),
      )));
      await tester.pump();
      expect(find.byKey(const ValueKey('vend-suivre')), findsNothing);
      expect(find.text('Suivre'), findsNothing);
      expect(find.text('Contacter'), findsOneWidget);
      expect(find.textContaining('Emplois'), findsNothing);
    });
  });

  group('L’écran d’une offre', () {
    testWidgets('pose les questions du formulaire à un candidat connecté', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreScreen(
          offreId: 'o1', apercu: true, apercuOffre: offreVendeuse, apercuConnecte: true)));
      await tester.pump();
      expect(find.text('Vendeuse en boutique'), findsOneWidget);
      expect(find.text('Maison Koffi'), findsOneWidget);
      expect(find.text('Postuler'), findsOneWidget);
      expect(find.byKey(const ValueKey('reponse-nom')), findsOneWidget);
      expect(find.byKey(const ValueKey('reponse-tel')), findsOneWidget);
      expect(find.text('Choisir…'), findsOneWidget);
      expect(find.text('Oui'), findsOneWidget);
      expect(find.text('Non'), findsOneWidget);
      expect(find.byKey(const ValueKey('offre-envoyer')), findsOneWidget);
      expect(find.byKey(const ValueKey('offre-lien')), findsNothing);
    });

    testWidgets('sans compte : pas de formulaire, une invitation à se connecter', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreScreen(
          offreId: 'o1', apercu: true, apercuOffre: offreVendeuse)));
      await tester.pump();
      expect(find.text('Connectez-vous pour postuler.'), findsOneWidget);
      expect(find.byKey(const ValueKey('offre-envoyer')), findsNothing);
    });

    testWidgets('une offre à lien externe : le bouton vers leur formulaire, pas de questions',
        (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreScreen(
          offreId: 'o2', apercu: true, apercuOffre: offreStagiaire, apercuConnecte: true)));
      await tester.pump();
      expect(find.byKey(const ValueKey('offre-lien')), findsOneWidget);
      expect(find.textContaining('Postuler sur le formulaire de Maison Koffi'), findsOneWidget);
      expect(find.byKey(const ValueKey('offre-envoyer')), findsNothing);
    });

    testWidgets('l’auteur voit « Candidatures reçues », pas le formulaire', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreScreen(
          offreId: 'o1', apercu: true, apercuOffre: offreVendeuse, apercuProprietaire: true)));
      await tester.pump();
      expect(find.text('Candidatures reçues'), findsOneWidget);
      expect(find.text('Gérer'), findsOneWidget);
      expect(find.byKey(const ValueKey('offre-envoyer')), findsNothing);
    });
  });

  group('Le constructeur d’offre', () {
    testWidgets('part des trois questions de base, et en ajoute une', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreFormScreen()));
      await tester.pump();
      expect(find.text('3/12'), findsOneWidget);
      expect(find.byKey(const ValueKey('question-0')), findsOneWidget);
      expect(find.byKey(const ValueKey('question-2')), findsOneWidget);
      expect(find.byKey(const ValueKey('question-3')), findsNothing);
      await tester.ensureVisible(find.byKey(const ValueKey('question-ajouter')));
      await tester.tap(find.byKey(const ValueKey('question-ajouter')));
      await tester.pump();
      expect(find.text('4/12'), findsOneWidget);
      expect(find.byKey(const ValueKey('question-3')), findsOneWidget);
    });

    testWidgets('« un lien » cache les questions et montre l’adresse', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreFormScreen()));
      await tester.pump();
      await tester.ensureVisible(find.byKey(const ValueKey('voie-lien')));
      await tester.tap(find.byKey(const ValueKey('voie-lien')));
      await tester.pump();
      expect(find.byKey(const ValueKey('offre-lien')), findsOneWidget);
      expect(find.byKey(const ValueKey('question-0')), findsNothing);
    });

    testWidgets('modifier une offre reprend ses questions', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffreFormScreen(offre: offreVendeuse)));
      await tester.pump();
      expect(find.text('4/12'), findsOneWidget);
      expect(find.text('Vendeuse en boutique'), findsOneWidget);
    });
  });

  group('Mes offres', () {
    testWidgets('liste les miennes avec leurs actions', (tester) async {
      grandEcran(tester);
      await tester.pumpWidget(enFrancais(const OffresProScreen(apercu: [offreVendeuse])));
      await tester.pump();
      expect(find.byKey(const ValueKey('offres-publier')), findsOneWidget);
      expect(find.text('Vendeuse en boutique'), findsOneWidget);
      expect(find.text('Modifier'), findsOneWidget);
      expect(find.text('Fermer'), findsOneWidget);
      expect(find.text('Supprimer'), findsOneWidget);
    });
  });
}
