// Banc des réglages e-mails (SMTP) : l'écran, l'état, le formulaire.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/admin.dart';
import 'package:chapci/screens/admin/emails_screen.dart';

Widget _app(ReglagesSmtp r) => MaterialApp(home: EmailsScreen(apercu: r));

void main() {
  testWidgets('SMTP configuré : l’écran le dit et pré-remplit la boîte',
      (tester) async {
    await tester.pumpWidget(_app(const ReglagesSmtp(
      hote: 'mail.chap.ci',
      port: '465',
      securite: 'ssl',
      utilisateur: 'no-reply@chap.ci',
      configure: true,
    )));
    await tester.pump();
    expect(find.textContaining('Envoi par SMTP configuré'), findsOneWidget);
    // Les réglages non secrets sont repris dans le formulaire (on lit la valeur
    // du champ par son libellé : l'indice porte la même chaîne d'exemple).
    final hote = tester.widget<TextField>(find.widgetWithText(TextField, 'Hôte'));
    expect(hote.controller?.text, 'mail.chap.ci');
    final user = tester
        .widget<TextField>(find.widgetWithText(TextField, 'Utilisateur (e-mail)'));
    expect(user.controller?.text, 'no-reply@chap.ci');
  });

  testWidgets('sans SMTP : l’écran prévient du repli sur mail()',
      (tester) async {
    await tester.pumpWidget(_app(const ReglagesSmtp(
      hote: 'localhost',
      port: '465',
      securite: 'ssl',
      utilisateur: 'no-reply@chap.ci',
      configure: false,
    )));
    await tester.pump();
    expect(find.textContaining('mail() du serveur'), findsOneWidget);
  });

  testWidgets('le mot de passe n’est jamais pré-rempli', (tester) async {
    await tester.pumpWidget(_app(const ReglagesSmtp(
      hote: 'mail.chap.ci',
      port: '465',
      securite: 'ssl',
      utilisateur: 'no-reply@chap.ci',
      configure: true,
    )));
    await tester.pump();
    // Le champ mot de passe se repère à son libellé ; il est vide (aucun secret
    // ne descend du serveur, l'app ne peut donc rien y mettre).
    final champ = find.widgetWithText(TextField, 'Mot de passe');
    expect(champ, findsOneWidget);
    final tf = tester.widget<TextField>(champ);
    expect(tf.controller?.text ?? '', '');
    expect(tf.obscureText, isTrue);
  });

  testWidgets('un e-mail invalide est refusé avant tout envoi',
      (tester) async {
    await tester.pumpWidget(_app(const ReglagesSmtp(
      hote: 'mail.chap.ci',
      port: '465',
      securite: 'ssl',
      utilisateur: 'pas-un-email',
      configure: false,
    )));
    await tester.pump();
    await tester.tap(find.widgetWithText(ElevatedButton, 'Enregistrer'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.textContaining('e-mail) invalide'), findsOneWidget);
  });
}
