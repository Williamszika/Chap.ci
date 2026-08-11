// Banc de la double authentification — l'écran de défi à la connexion.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/screens/verifier_2fa_screen.dart';

void main() {
  testWidgets('l’écran de défi demande le code à 6 chiffres', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: Verifier2faScreen(mfaToken: 'jeton-defi')));
    await tester.pump();
    expect(find.text('Un dernier pas'), findsOneWidget);
    expect(find.textContaining('application d’authentification'), findsOneWidget);
    // Le champ est là ; sans 6 chiffres, on refuse de vérifier.
    expect(find.byType(TextField), findsOneWidget);
  });

  testWidgets('on peut basculer vers un code de secours', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: Verifier2faScreen(mfaToken: 'jeton-defi')));
    await tester.pump();
    await tester.tap(find.textContaining('utiliser un code de secours'));
    await tester.pump();
    expect(find.textContaining('codes de secours que vous avez conservés'),
        findsOneWidget);
    // Et on peut revenir aux 6 chiffres.
    await tester.tap(find.textContaining('entrer le code à 6 chiffres'));
    await tester.pump();
    expect(find.textContaining('application d’authentification'), findsOneWidget);
  });

  testWidgets('un code trop court affiche une erreur claire', (tester) async {
    await tester.pumpWidget(
        const MaterialApp(home: Verifier2faScreen(mfaToken: 'jeton-defi')));
    await tester.pump();
    await tester.enterText(find.byType(TextField), '123');
    await tester.tap(find.text('Vérifier'));
    await tester.pump();
    expect(find.textContaining('6 chiffres'), findsWidgets);
  });
}
