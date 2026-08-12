// L'écran de suppression de compte : le bouton rouge ne s'active qu'une fois
// la case « je comprends que c'est définitif » cochée.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/screens/supprimer_compte_screen.dart';

void main() {
  testWidgets('bouton verrouillé tant que la confirmation n’est pas cochée',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SupprimerCompteScreen()));

    final bouton = find.widgetWithText(
        ElevatedButton, 'Supprimer définitivement mon compte');
    expect(bouton, findsOneWidget);

    // Au départ : désactivé.
    expect(tester.widget<ElevatedButton>(bouton).onPressed, isNull);

    // On coche la confirmation.
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();

    // Désormais actif.
    expect(tester.widget<ElevatedButton>(bouton).onPressed, isNotNull);
  });
}
