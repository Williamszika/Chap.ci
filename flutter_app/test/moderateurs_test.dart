// Banc des modérateurs : la liste, l'éditeur, les gardes.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/moderateurs_screen.dart';

const _fonctions = [
  FonctionMod('listings', 'Annonces'),
  FonctionMod('users', 'Utilisateurs'),
  FonctionMod('reports', 'Signalements'),
  FonctionMod('campaigns', 'Campagnes'),
];

EquipeAdmin _equipe({List<Moderateur> mods = const []}) =>
    EquipeAdmin(const ['patron@chap.ci'], mods, _fonctions);

Widget _app(EquipeAdmin e) => MaterialApp(home: ModerateursScreen(apercu: e));

void main() {
  testWidgets('la liste montre le propriétaire et ses modérateurs',
      (tester) async {
    await tester.pumpWidget(_app(_equipe(mods: [
      const Moderateur(
        email: 'awa.kone@chap.ci',
        cree: 1700000000000,
        permissions: ['listings', 'reports'],
        aCode: true,
        bloque: false,
      ),
    ])));
    await tester.pump();
    expect(find.text('patron@chap.ci'), findsOneWidget);
    expect(find.text('awa.kone@chap.ci'), findsOneWidget);
    expect(find.text('Modérateurs (1)'), findsOneWidget);
    // Les permissions sont rendues en libellés lisibles.
    expect(find.text('Annonces'), findsOneWidget);
    expect(find.text('Signalements'), findsOneWidget);
  });

  testWidgets('un modérateur bloqué porte son badge', (tester) async {
    await tester.pumpWidget(_app(_equipe(mods: [
      const Moderateur(
        email: 'kader@gmail.com',
        cree: 1700000000000,
        permissions: ['campaigns'],
        aCode: true,
        bloque: true,
      ),
    ])));
    await tester.pump();
    expect(find.text('Bloqué'), findsOneWidget);
  });

  testWidgets('liste vide : l’écran invite à ajouter quelqu’un',
      (tester) async {
    await tester.pumpWidget(_app(_equipe()));
    await tester.pump();
    expect(find.text('Modérateurs (0)'), findsOneWidget);
    expect(find.textContaining('Aucun modérateur'), findsOneWidget);
  });

  testWidgets('l’éditeur s’ouvre et un e-mail invalide est refusé',
      (tester) async {
    await tester.pumpWidget(_app(_equipe()));
    await tester.pump();
    await tester.tap(find.text('Ajouter'));
    await tester.pumpAndSettle();
    // On est dans l'éditeur : les cases de permissions sont là.
    expect(find.text('Nouveau modérateur'), findsOneWidget);
    expect(find.text('Annonces'), findsOneWidget);
    expect(find.text('Campagnes'), findsOneWidget);
    // « Créer » sans e-mail valide → refus, on reste dans l'éditeur.
    await tester.enterText(
        find.widgetWithText(TextField, 'E-mail du modérateur'), 'pas-un-email');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Créer le modérateur'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Adresse e-mail invalide.'), findsOneWidget);
  });

  testWidgets('l’éditeur pré-coche les permissions d’un modérateur existant',
      (tester) async {
    await tester.pumpWidget(_app(_equipe(mods: [
      const Moderateur(
        email: 'awa.kone@chap.ci',
        cree: 1700000000000,
        permissions: ['listings', 'reports'],
        aCode: true,
        bloque: false,
      ),
    ])));
    await tester.pump();
    await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Modifier les permissions'));
    await tester.pumpAndSettle();
    expect(find.text('Modifier le modérateur'), findsOneWidget);
    // 'listings' et 'reports' cochés ; 'users' et 'campaigns' non.
    final coches = tester
        .widgetList<CheckboxListTile>(find.byType(CheckboxListTile))
        .toList();
    final parLibelle = {for (final c in coches) (c.title as Text).data: c.value};
    expect(parLibelle['Annonces'], isTrue);
    expect(parLibelle['Signalements'], isTrue);
    expect(parLibelle['Utilisateurs'], isFalse);
    expect(parLibelle['Campagnes'], isFalse);
  });
}
