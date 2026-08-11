// Banc de test du moteur de formulaires détaillés : la sérialisation des
// attributs, la détection des champs requis, et — le plus important — le refus
// de publication d'un produit interdit (éclaircissant) ou périmé.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/formulaires/mode.dart';
import 'package:chapci/data/formulaires/electronique.dart';
import 'package:chapci/data/formulaires/vehicules.dart';
import 'package:chapci/data/formulaires/maison.dart';
import 'package:chapci/data/formulaires/alimentation.dart';
import 'package:chapci/data/formulaires/animaux.dart';
import 'package:chapci/data/formulaires/services.dart';
import 'package:chapci/data/formulaires/emploi.dart';
import 'package:chapci/data/formulaires/sante.dart';
import 'package:chapci/data/formulaires/bebe.dart';
import 'package:chapci/data/formulaires/voyage.dart';
import 'package:chapci/data/formulaires/loisirs.dart';
import 'package:chapci/data/formulaires/scolaire.dart';
import 'package:chapci/data/formulaires/materiel.dart';
import 'package:chapci/data/formulaires/donner.dart';
import 'package:chapci/screens/formulaire_dynamique.dart';

void main() {
  // Monte un formulaire et renvoie une fonction qui donne le dernier état remonté.
  Future<EtatFormulaire? Function()> monter(WidgetTester tester, schema) async {
    EtatFormulaire? dernier;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: FormulaireDynamique(
            schema: schema,
            onChange: (e) => dernier = e,
          ),
        ),
      ),
    ));
    await tester.pump(); // laisse partir le addPostFrameCallback initial
    return () => dernier;
  }

  Future<void> taper(WidgetTester tester, String texte) async {
    final f = find.text(texte);
    await tester.ensureVisible(f);
    await tester.tap(f);
    await tester.pumpAndSettle();
  }

  testWidgets('les champs requis vides sont signalés dès le montage', (tester) async {
    final etat = await monter(tester, mode['Vêtements Femme']);
    final m = etat()!.manquants;
    expect(m, contains('Type de vêtement'));
    expect(m, contains('Tailles disponibles'));
    expect(m, contains('Matière'));
    expect(m, contains('Authenticité'));
  });

  testWidgets('un choix multiple se sérialise « valeur, valeur »', (tester) async {
    final etat = await monter(tester, mode['Vêtements Femme']);
    await taper(tester, 'Robe'); // typeF (choix unique)
    await taper(tester, 'M'); // tailles (multi)
    await taper(tester, 'L');
    final a = etat()!.attributs;
    expect(a['typeF'], 'Robe');
    expect(a['tailles'], 'M, L');
    // Type et tailles désormais remplis : ils ne sont plus « manquants ».
    expect(etat()!.manquants, isNot(contains('Type de vêtement')));
    expect(etat()!.manquants, isNot(contains('Tailles disponibles')));
  });

  testWidgets('un produit éclaircissant bloque la publication', (tester) async {
    final etat = await monter(tester, mode['Beauté & Cosmétiques']);
    await taper(tester, 'Soin corps'); // familleB (≠ Accessoire → la question s'affiche)
    await taper(tester, 'Oui — il contient un agent éclaircissant');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('interdits'));
  });

  testWidgets('un cosmétique bien renseigné ne bloque pas', (tester) async {
    final etat = await monter(tester, mode['Beauté & Cosmétiques']);
    await taper(tester, 'Soin corps');
    await taper(tester, 'Non — aucun agent éclaircissant');
    expect(etat()!.motifBloc, isNull);
  });

  testWidgets('un ordinateur verrouillé par une entreprise (BIOS) bloque', (tester) async {
    final etat = await monter(tester, electronique['Ordinateurs']);
    await taper(tester, 'Verrouillage d’entreprise ou mot de passe BIOS');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.attributs['etatLogiciel'], 'Verrouillage d’entreprise ou mot de passe BIOS');
  });

  testWidgets('les modèles dépendent de la marque choisie (Tecno → Spark)', (tester) async {
    final etat = await monter(tester, electronique['Smartphones']);
    // Avant de choisir la marque, aucun modèle Tecno n'est affiché.
    expect(find.text('Spark 30'), findsNothing);
    await taper(tester, 'Tecno');
    await taper(tester, 'Spark 30');
    expect(etat()!.attributs['marque'], 'Tecno');
    expect(etat()!.attributs['modele'], 'Spark 30');
  });

  testWidgets('un iPhone encore lié au compte affiche l’alerte « pour pièces »', (tester) async {
    final etat = await monter(tester, electronique['Smartphones']);
    await taper(tester, 'Encore liés (vendu pour pièces)');
    expect(etat()!.attributs['comptes'], 'Encore liés (vendu pour pièces)');
    // Ce n'est pas un blocage (la vente pour pièces est permise), juste une alerte.
    expect(etat()!.motifBloc, isNull);
  });

  testWidgets('un kilométrage trop bas pour l’âge alerte sur le compteur trafiqué', (tester) async {
    final etat = await monter(tester, vehicules['Voitures']);
    await taper(tester, '2005'); // année : 21 ans
    await tester.enterText(find.byType(TextField).first, '5000'); // ~238 km/an
    await tester.pumpAndSettle();
    expect(find.textContaining('compteur trafiqué'), findsOneWidget);
    expect(etat()!.attributs['km'], '5000');
    expect(etat()!.attributs['annee'], '2005');
  });

  testWidgets('la carte grise pas au nom du vendeur est signalée, sans bloquer', (tester) async {
    final etat = await monter(tester, vehicules['Voitures']);
    await taper(tester, 'Au nom d’un tiers (avec procuration)');
    expect(etat()!.attributs['carteGrise'], 'Au nom d’un tiers (avec procuration)');
    expect(etat()!.motifBloc, isNull);
  });

  testWidgets('un objet en ivoire (CITES) bloque la publication', (tester) async {
    final etat = await monter(tester, maison['Décoration']);
    await taper(tester, 'Ivoire');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('CITES'));
  });

  testWidgets('une bouteille de gaz qui fuit bloque la publication', (tester) async {
    final etat = await monter(tester, maison['Cuisine']);
    await taper(tester, 'Bouteille de gaz'); // fait apparaître l'état de la bouteille
    await taper(tester, 'Fuite constatée');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('revendeur agréé'));
  });

  testWidgets('un matelas porteur de punaises bloque la publication', (tester) async {
    final etat = await monter(tester, maison['Literie']);
    await taper(tester, 'Punaises de lit constatées');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('punaises'));
  });

  testWidgets('un produit alimentaire périmé bloque la publication', (tester) async {
    final etat = await monter(tester, alimentation['Produits vivriers']);
    await taper(tester, 'Dépassée'); // date limite dépassée
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('date limite'));
  });

  testWidgets('du poisson frais jamais réfrigéré bloque la publication', (tester) async {
    final etat = await monter(tester, alimentation['Poisson & Produits de mer']);
    await taper(tester, 'Jamais réfrigéré');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('sanitaire'));
  });

  testWidgets('un pesticide non homologué bloque la publication', (tester) async {
    final etat = await monter(tester, alimentation['Semences & Intrants']);
    await taper(tester, 'Pesticide'); // fait apparaître la question d'homologation
    await taper(tester, 'Produit non homologué / importation parallèle');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('homologué'));
  });

  testWidgets('une espèce sauvage protégée (CITES) bloque la publication', (tester) async {
    final etat = await monter(tester, animaux['Oiseaux, Poissons & Reptiles']);
    await taper(tester, 'Espèce sauvage capturée (perroquet gris, tortue, pangolin, singe, python…)');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('CITES'));
  });

  testWidgets('un animal vendu pour le combat bloque la publication', (tester) async {
    final etat = await monter(tester, animaux['Chiens & Chats']);
    await taper(tester, 'Combat / bagarre');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('combats'));
  });

  testWidgets('un aliment pour animaux périmé bloque la publication', (tester) async {
    final etat = await monter(tester, animaux['Aliments pour animaux']);
    await taper(tester, 'Dépassée');
    expect(etat()!.motifBloc, isNotNull);
  });

  testWidgets('une formation « emploi garanti contre paiement » bloque la publication', (tester) async {
    final etat = await monter(tester, services['Cours & Formation']);
    await taper(tester, 'Emploi garanti contre paiement de la formation');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('arnaque'));
  });

  testWidgets('la licence n’est demandée qu’en cas de transport de personnes', (tester) async {
    final etat = await monter(tester, services['Transport & Déménagement']);
    // Avant de cocher « Transport de personnes », le champ licence est masqué.
    expect(find.textContaining('Autorisation de transport'), findsNothing);
    await taper(tester, 'Transport de personnes'); // choix multiple
    expect(find.textContaining('Autorisation de transport'), findsOneWidget);
    expect(etat()!.attributs['prestaT'], contains('Transport de personnes'));
  });

  testWidgets('une offre qui réclame des frais au candidat bloque la publication', (tester) async {
    final etat = await monter(tester, emploi['Offres d’emploi']);
    await taper(tester, 'Des frais de dossier sont demandés');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('jamais d’argent'));
  });

  testWidgets('le travail domestique d’un mineur bloque la publication', (tester) async {
    final etat = await monter(tester, emploi['Emploi maison']);
    await taper(tester, 'Moins de 18 ans');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('mineure'));
  });

  testWidgets('vendre un médicament hors pharmacie bloque la publication', (tester) async {
    final etat = await monter(tester, sante['Compléments & Tisanes']);
    await taper(tester, 'Médicament, avec ou sans ordonnance');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('pharmacies'));
  });

  testWidgets('promettre de guérir une maladie bloque la publication', (tester) async {
    final etat = await monter(tester, sante['Compléments & Tisanes']);
    await taper(tester, 'Guérit une maladie (diabète, hypertension, VIH, cancer…)');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('vrai traitement'));
  });

  testWidgets('un anabolisant en nutrition sportive bloque la publication', (tester) async {
    final etat = await monter(tester, sante['Nutrition sportive']);
    await taper(tester, 'Contient un anabolisant, une hormone ou un stéroïde');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('prescription'));
  });

  testWidgets('un siège auto accidenté bloque la publication', (tester) async {
    final etat = await monter(tester, bebe['Poussettes & Sièges auto']);
    await taper(tester, 'Siège auto'); // fait apparaître la question du choc
    await taper(tester, 'A subi un accident, même léger');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('ne protégera plus'));
  });

  testWidgets('un lit à barreaux non conforme bloque la publication', (tester) async {
    final etat = await monter(tester, bebe['Mobilier & Chambre']);
    await taper(tester, 'Lit à barreaux'); // fait apparaître l'écartement
    await taper(tester, 'Supérieur à 6,5 cm');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('nourrisson'));
  });

  testWidgets('« visa garanti » bloque la publication', (tester) async {
    final etat = await monter(tester, voyage['Visas & formalités']);
    await taper(tester, 'Visa garanti, remboursé en cas de refus');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('consulat'));
  });

  testWidgets('la confiscation du passeport (travail à l’étranger) bloque', (tester) async {
    final etat = await monter(tester, voyage['Travail à l’étranger']);
    await taper(tester, 'L’employeur le conserve');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('traite'));
  });

  testWidgets('un passage sans visa (traite) bloque la publication', (tester) async {
    final etat = await monter(tester, voyage['Études à l’étranger']);
    await taper(tester, 'Traversée en mer'); // champ « Comment se fait le voyage »
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('traite'));
  });

  testWidgets('une arme à feu (loisirs) bloque la publication', (tester) async {
    final etat = await monter(tester, loisirs['Sport & Fitness']);
    await taper(tester, 'Chasse'); // discipline → fait apparaître la question « arme »
    await taper(tester, 'Arme à feu, munitions ou arme blanche');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('armurier agréé'));
  });

  testWidgets('revendre un kit scolaire gratuit de l’État bloque la publication', (tester) async {
    final etat = await monter(tester, scolaire['Fournitures & papeterie']);
    await taper(tester, 'Kit gratuit distribué par l’État (primaire public)');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('donnés aux élèves'));
  });

  testWidgets('un manuel photocopié (contrefaçon) bloque la publication', (tester) async {
    final etat = await monter(tester, scolaire['Manuels & livres scolaires']);
    await taper(tester, 'Photocopie reliée');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('contrefaçon'));
  });

  testWidgets('un dispositif médical réservé aux pros bloque la publication', (tester) async {
    final etat = await monter(tester, materiel['Médical & Paramédical']);
    await taper(tester, 'Dispositif médical réservé aux professionnels de santé');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('professionnels de santé'));
  });

  testWidgets('un don « payez juste le transport » bloque la publication', (tester) async {
    final etat = await monter(tester, aDonner['Autres objets']);
    await taper(tester, 'Une participation aux frais de transport');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('ne se paie pas'));
  });

  testWidgets('un don d’argent (collecte) bloque la publication', (tester) async {
    final etat = await monter(tester, aDonner['Autres objets']);
    await taper(tester, 'De l’argent (espèces, Mobile Money)');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('collecte'));
  });

  testWidgets('donner un médicament reste interdit (comme à la vente)', (tester) async {
    final etat = await monter(tester, aDonner['Nourriture & hygiène']);
    await taper(tester, 'Médicaments');
    expect(etat()!.motifBloc, isNotNull);
    expect(etat()!.motifBloc, contains('hors pharmacie'));
  });
}
