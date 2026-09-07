// Chaque notification mène à ce dont elle parle (07/09/2026, le Patron).
//
// Le serveur écrit des liens du site (« #/messages/<id> », « #/compte?onglet=
// stock »…) ; l'application les lit pour ouvrir l'écran natif correspondant.
// On vérifie ici la lecture de chaque forme de lien que le serveur émet
// (inventaire du 07/09 : annonce, modifier, messages, assistance, vendeur,
// emploi, compte?onglet=, pro).
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/notifications.dart';

NotifItem _n(String lien, [String type = 'x']) => NotifItem(
    id: '1', type: type, titre: 't', corps: 'c', lien: lien, lue: false, cree: 0);

void main() {
  test('une annonce et sa modification', () {
    expect(_n('#/annonce/abc-123').annonceId, 'abc-123');
    expect(_n('#/annonce/abc-123').versModification, isFalse);
    final m = _n('#/modifier/abc-123');
    expect(m.annonceId, 'abc-123');
    expect(m.versModification, isTrue);
  });

  test('une conversation, l’assistance', () {
    expect(_n('#/messages/conv-9').conversationId, 'conv-9');
    expect(_n('#/messages/conv-9').versAssistance, isFalse);
    expect(_n('#/assistance/fil-2').versAssistance, isTrue);
    expect(_n('#/assistance').versAssistance, isTrue);
    expect(_n('#/assistance').conversationId, isNull);
  });

  test('la page d’un vendeur (un avis reçu)', () {
    expect(_n('#/vendeur/u-42').vendeurId, 'u-42');
    expect(_n('#/annonce/u-42').vendeurId, isNull);
  });

  test('l’écran du compte dont on parle', () {
    expect(_n('#/compte?onglet=stock').ongletCompte, 'stock');
    expect(_n('#/compte?onglet=achats').ongletCompte, 'achats');
    expect(_n('#/compte?onglet=stats').ongletCompte, 'stats');
    expect(_n('#/compte').ongletCompte, isNull);
    expect(_n('#/compte').lien.contains('/compte'), isTrue);
    expect(_n('#/pro').ongletCompte, isNull);
  });

  test('une offre d’emploi', () {
    expect(_n('#/emploi/o-7').offreId, 'o-7');
    expect(_n('#/emploi/o-7').annonceId, isNull);
  });

  test('un lien vide n’ouvre rien', () {
    final v = _n('');
    expect(v.annonceId, isNull);
    expect(v.conversationId, isNull);
    expect(v.vendeurId, isNull);
    expect(v.offreId, isNull);
    expect(v.ongletCompte, isNull);
    expect(v.versAssistance, isFalse);
    expect(v.versModification, isFalse);
  });
}
