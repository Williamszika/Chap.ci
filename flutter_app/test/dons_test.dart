// Les dons par Mobile Money (07/09/2026) — « Soutenir Chap.ci » dans l'app.
//
// ⚠️ CE FICHIER GARDE DES NUMÉROS QUI REÇOIVENT DE L'ARGENT. Un chiffre qui
// change sans qu'on le veuille, et un don part chez quelqu'un d'autre — sans
// que personne ne s'en aperçoive, Chap.ci n'étant jamais dans le circuit et ne
// sachant même pas qu'un don a eu lieu. `npm run banc:coherence` compare déjà
// ce fichier à `src/data/donation.ts` ; ici on verrouille ce qui ne dépend que
// de l'application : la forme des données et le code composé.
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/dons.dart';

void main() {
  group('les opérateurs', () {
    test('deux moyens de paiement, identifiants connus', () {
      expect(operateursDon.length, 2);
      expect(operateursDon.map((o) => o.id).toList(), ['orange', 'wave']);
    });

    test('chacun porte un numéro non vide et un nom de compte', () {
      for (final o in operateursDon) {
        expect(o.numero.trim(), isNotEmpty, reason: o.id);
        expect(o.nomCompte.trim(), isNotEmpty, reason: o.id);
        expect(o.commentFaire.trim(), isNotEmpty, reason: o.id);
      }
    });

    test('le numéro brut n’a plus d’espaces — c’est lui qu’on copie', () {
      for (final o in operateursDon) {
        expect(o.numeroBrut.contains(' '), isFalse, reason: o.id);
        expect(o.numeroBrut.startsWith('+225'), isTrue, reason: o.id);
      }
    });

    test('Orange a un code USSD, Wave n’en a pas', () {
      expect(operateursDon.firstWhere((o) => o.id == 'orange').ussd, '#144#');
      expect(operateursDon.firstWhere((o) => o.id == 'wave').ussd, isNull);
    });
  });

  group('les montants', () {
    test('cinq montants, croissants, tous positifs', () {
      expect(montantsDon.length, 5);
      for (var i = 1; i < montantsDon.length; i++) {
        expect(montantsDon[i] > montantsDon[i - 1], isTrue);
      }
      expect(montantsDon.every((m) => m > 0), isTrue);
    });

    test('celui d’ouverture fait partie de la liste', () {
      expect(montantsDon.contains(montantDonDefaut), isTrue);
      expect(montantDonDefaut, 2500);
    });
  });

  group('lienUssd', () {
    test('# et * sont encodés, sinon le composeur s’arrête au dièse', () {
      expect(lienUssd('#144#'), 'tel:%23144%23');
      expect(lienUssd('#144*1#'), 'tel:%23144%2A1%23');
    });

    test('un code sans caractère spécial passe tel quel', () {
      expect(lienUssd('144'), 'tel:144');
    });
  });
}
