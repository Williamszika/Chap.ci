// Banc des sauvegardes : lecture d'une sauvegarde + l'écran.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/sauvegardes_screen.dart';

void main() {
  test('Sauvegarde lit le nom, la taille et la date', () {
    final s = Sauvegarde.depuis({
      'file': 'chapci-2026-08-14-030000.json',
      'bytes': 1258291,
      'at': 1700000000000,
    });
    expect(s.fichier, 'chapci-2026-08-14-030000.json');
    expect(s.octets, 1258291);
    expect(s.quand, 1700000000000);
  });

  testWidgets('l’écran liste les sauvegardes et propose l’export', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: SauvegardesScreen(apercu: [
        Sauvegarde.depuis({
          'file': 'chapci-2026-08-14-030000.json', 'bytes': 1258291,
          'at': DateTime.now().millisecondsSinceEpoch - 3600000,
        }),
        Sauvegarde.depuis({
          'file': 'chapci-2026-08-13-030000.json', 'bytes': 1240000,
          'at': DateTime.now().millisecondsSinceEpoch - 86400000,
        }),
      ]),
    ));
    await tester.pump();
    expect(find.text('chapci-2026-08-14-030000.json'), findsOneWidget);
    expect(find.textContaining('Créer et partager'), findsOneWidget);
    expect(find.textContaining('2 sauvegardes'), findsOneWidget);
  });

  testWidgets('sans sauvegarde automatique, l’écran l’explique', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: SauvegardesScreen(apercu: [])));
    await tester.pump();
    expect(find.textContaining('Aucune sauvegarde automatique'), findsWidgets);
  });
}
