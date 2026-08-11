// Banc de test du moteur de formulaires détaillés : la sérialisation des
// attributs, la détection des champs requis, et — le plus important — le refus
// de publication d'un produit interdit (éclaircissant) ou périmé.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/formulaires/mode.dart';
import 'package:chapci/data/formulaires/electronique.dart';
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
}
