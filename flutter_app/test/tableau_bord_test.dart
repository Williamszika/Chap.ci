// Banc du tableau de bord : la lecture des statistiques et leur affichage.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/tableau_bord_screen.dart';

const _stats = {
  'users': 1284, 'listings': 3691, 'conversations': 872, 'messages': 5140,
  'orders': 218, 'reviews': 143, 'newsletter': 402, 'reportsOpen': 3,
  'ordersValue': 4875000,
  'visites': {'jour': 148, 'semaine': 936, 'parJour': 134},
  'parcours': {
    'j7': {'visiteurs': 936, 'comptes': 61, 'publie': 24, 'vendu': 7},
    'j30': {'visiteurs': 3820, 'comptes': 240, 'publie': 96, 'vendu': 33},
    'tout': {'visiteurs': 41200, 'comptes': 1284, 'publie': 540, 'vendu': 190},
  },
  'series': [
    {'date': '2026-08-13', 'users': 12, 'listings': 31},
    {'date': '2026-08-14', 'users': 18, 'listings': 47},
  ],
};

void main() {
  test('StatsAdmin lit les chiffres et le parcours', () {
    final s = StatsAdmin.depuis(_stats);
    expect(s.users, 1284);
    expect(s.listings, 3691);
    expect(s.reportsOpen, 3);
    expect(s.visJour, 148);
    expect(s.j7.vendu, 7);
    expect(s.tout.visiteurs, 41200);
    expect(s.serie.length, 2);
    expect(s.serie.last.annonces, 47);
  });

  test('StatsAdmin tolère une réponse incomplète', () {
    final s = StatsAdmin.depuis(const {'users': 5});
    expect(s.users, 5);
    expect(s.listings, 0);
    expect(s.visJour, 0);
    expect(s.j7.vendu, 0);
    expect(s.serie, isEmpty);
  });

  testWidgets('le tableau affiche les grands compteurs', (tester) async {
    await tester.pumpWidget(MaterialApp(
        home: TableauBordScreen(apercu: StatsAdmin.depuis(_stats))));
    await tester.pump();
    // Le haut du tableau (le reste est plus bas dans la liste défilante).
    expect(find.text('Visiteurs uniques'), findsOneWidget);
    expect(find.text('148'), findsOneWidget); // visiteurs aujourd'hui
    expect(find.text('Comptes'), findsWidgets);
    expect(find.text('1284'), findsWidgets); // le nombre de comptes
    // On défile jusqu'au parcours pour vérifier qu'il est bien rendu.
    await tester.dragUntilVisible(
        find.text('Le parcours'), find.byType(ListView), const Offset(0, -300));
    expect(find.text('Le parcours'), findsOneWidget);
  });
}
