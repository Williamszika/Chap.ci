// Banc du bloc couleurs / variantes : le port de src/data/couleurs.ts et le
// rendu du moteur. On y vérifie ce que le site garantit — cocher un coloris,
// lui donner ses tailles restantes, et le fait qu'un bijou n'a pas de pastille.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/formulaires/couleurs.dart';
import 'package:chapci/data/formulaires/mode.dart';
import 'package:chapci/data/formulaires/electronique.dart';
import 'package:chapci/data/formulaires/maison.dart';
import 'package:chapci/screens/formulaire_dynamique.dart';

void main() {
  group('couleurs.dart (helpers)', () {
    test('cleVariante compose var_<Couleur>_<champ>', () {
      expect(cleVariante('Noir', 'prix'), 'var_Noir_prix');
      expect(cleVariante('1B · Noir naturel', 'photo'), 'var_1B · Noir naturel_photo');
    });

    test('lireCouleurs garde l’ordre coché et filtre par palette', () {
      final choisis = lireCouleurs(['Rouge', 'Bleu', 'Inconnu'], couleursBase);
      expect(choisis.map((c) => c.nom), ['Rouge', 'Bleu']);
    });

    test('lireCouleurs ignore un nom absent de la palette du métier', () {
      // « Noir » n'est pas dans la palette des carnations.
      expect(lireCouleurs(['Noir', 'Miel'], paletteTeint).map((c) => c.nom), ['Miel']);
    });
  });

  // Monte un formulaire et renvoie l'accès au dernier état remonté.
  Future<EtatFormulaire? Function()> monter(WidgetTester tester, schema) async {
    EtatFormulaire? dernier;
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SingleChildScrollView(
          child: FormulaireDynamique(schema: schema, onChange: (e) => dernier = e),
        ),
      ),
    ));
    await tester.pump();
    return () => dernier;
  }

  Future<void> taper(WidgetTester tester, String texte) async {
    final f = find.text(texte);
    await tester.ensureVisible(f.first);
    await tester.tap(f.first);
    await tester.pumpAndSettle();
  }

  testWidgets('cocher un coloris le sérialise dans « couleurs »', (tester) async {
    final etat = await monter(tester, mode['Vêtements Femme']);
    // Les pastilles sont là dès le montage (couleurs: true).
    expect(find.text('Noir'), findsOneWidget);
    await taper(tester, 'Rouge');
    expect(etat()!.attributs['couleurs'], 'Rouge');
  });

  testWidgets('une taille restante se range sous sa couleur', (tester) async {
    final etat = await monter(tester, mode['Vêtements Femme']);
    await taper(tester, 'Rouge');
    // « 42 » existe deux fois : le champ principal, puis la carte du coloris.
    // La dernière occurrence est celle de la variante.
    final quarante2 = find.text('42');
    await tester.ensureVisible(quarante2.last);
    await tester.tap(quarante2.last);
    await tester.pumpAndSettle();
    expect(etat()!.attributs['var_Rouge_tailles'], '42');
  });

  testWidgets('décocher un coloris efface ses variantes', (tester) async {
    final etat = await monter(tester, mode['Vêtements Femme']);
    await taper(tester, 'Rouge');
    final q = find.text('42');
    await tester.ensureVisible(q.last);
    await tester.tap(q.last);
    await tester.pumpAndSettle();
    expect(etat()!.attributs['var_Rouge_tailles'], '42');
    // On décoche la couleur : sa taille restante ne doit plus partir.
    await taper(tester, 'Rouge');
    expect(etat()!.attributs.containsKey('couleurs'), isFalse);
    expect(etat()!.attributs.containsKey('var_Rouge_tailles'), isFalse);
  });

  testWidgets('un bijou n’a pas de pastille de couleur', (tester) async {
    final etat = await monter(tester, mode['Sacs & Bijoux']);
    // Rien de choisi : le bloc est masqué, un mot le remplace.
    expect(find.textContaining('première photo'), findsOneWidget);
    expect(find.text('Multicolore'), findsNothing);
    await taper(tester, 'Bijou');
    expect(find.textContaining('métal qui la donne'), findsOneWidget);
    expect(find.text('Multicolore'), findsNothing);
    expect(etat()!.attributs.containsKey('couleurs'), isFalse);
    // Un sac, lui, se décline en couleurs.
    await taper(tester, 'Sac / maroquinerie');
    expect(find.text('Multicolore'), findsOneWidget);
  });

  testWidgets('la beauté choisit la palette du produit', (tester) async {
    await monter(tester, mode['Beauté & Cosmétiques']);
    await taper(tester, 'Cheveux'); // familleB
    await taper(tester, 'Perruque'); // typeBeaute → palette « cheveux »
    // Un numéro de mèche apparaît ; la palette générale ne l'a pas.
    expect(find.textContaining('613 · Blond platine'), findsOneWidget);
    expect(find.text('Couleurs disponibles'), findsOneWidget);
  });

  testWidgets('un smartphone décline son stockage par couleur', (tester) async {
    final etat = await monter(tester, electronique['Smartphones']);
    await taper(tester, 'Bleu'); // coloris
    expect(etat()!.attributs['couleurs'], 'Bleu');
    // « 128 Go » : le champ principal, puis la carte du coloris.
    final go = find.text('128 Go');
    await tester.ensureVisible(go.last);
    await tester.tap(go.last);
    await tester.pumpAndSettle();
    expect(etat()!.attributs['var_Bleu_stockage'], '128 Go');
  });

  testWidgets('un téléviseur n’a pas de couleur', (tester) async {
    await monter(tester, electronique['TV & Écrans']);
    expect(find.textContaining('téléviseur est noir'), findsOneWidget);
    expect(find.text('Multicolore'), findsNothing);
  });

  testWidgets('l’audio n’ouvre les couleurs que pour ce qui en a', (tester) async {
    await monter(tester, electronique['Audio & Son']);
    expect(find.text('Multicolore'), findsNothing); // rien choisi
    await taper(tester, 'Casque'); // typeAudio → une enceinte/casque a des teintes
    expect(find.text('Multicolore'), findsOneWidget);
  });

  testWidgets('un smartphone propose le gris sidéral', (tester) async {
    await monter(tester, electronique['Smartphones']);
    // La palette de l'Électronique, pas les quinze générales.
    expect(find.text('Gris sidéral'), findsOneWidget);
  });

  testWidgets('un meuble se décline en essences de bois', (tester) async {
    final etat = await monter(tester, maison['Meubles']);
    expect(find.text('Teck'), findsOneWidget);
    expect(find.text('Iroko'), findsOneWidget);
    expect(find.text('Teintes disponibles'), findsOneWidget);
    await taper(tester, 'Teck');
    expect(etat()!.attributs['couleurs'], 'Teck');
  });

  testWidgets('un frigo n’a pas de couleur, une gazinière si', (tester) async {
    await monter(tester, maison['Électroménager']);
    expect(find.text('Multicolore'), findsNothing); // typeElec vide
    await taper(tester, 'Réfrigérateur');
    expect(find.text('Multicolore'), findsOneWidget);
  });
}
