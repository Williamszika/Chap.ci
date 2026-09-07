// Banc des comptes hors Côte d'Ivoire (07/09/2026) — port de src/data/pays.ts.
//
// Le Patron : « permettre aux gens d'autres pays de créer leur compte, tu mets
// leur ville et leur pays, dans la catégorie Autres pays ». On vérifie ici ce
// dont dépendent l'inscription, « Publier » et les libellés : les identifiants
// sous lesquels un pays s'enregistre, le libellé « Dakar, Sénégal », le
// drapeau, et la décision « hors CI » prise sur le code du pays, jamais sur un
// nom de ville.
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/locations.dart';
import 'package:chapci/data/pays.dart';

void main() {
  group('les pays comme villes de la région « Autres pays »', () {
    test('la région existe, sous son propre district', () {
      final r = regionById(regionAutresPays);
      expect(r, isNotNull);
      expect(r!.name, 'Autres pays');
      expect(r.district, 'Hors Côte d’Ivoire');
      expect(districts.last, 'Hors Côte d’Ivoire');
    });

    test('chaque pays est une ville « pays-xx » de cette région', () {
      final villes = citiesByRegion(regionAutresPays);
      expect(villes.length, pays.length);
      expect(cityById('pays-sn')?.name, 'Sénégal');
      expect(cityById('pays-sn')?.regionId, regionAutresPays);
      expect(cityById('pays-sn')?.communes, isNull);
    });

    test('les villes de Côte d’Ivoire ne contiennent aucun pays', () {
      expect(villesCi.any((c) => c.regionId == regionAutresPays), isFalse);
      expect(cities.length, villesCi.length + pays.length);
    });

    test('les codes sont uniques, en majuscules, et « ZZ » ferme la liste', () {
      final codes = pays.map((p) => p.code).toList();
      expect(codes.toSet().length, codes.length);
      for (final c in codes) {
        expect(RegExp(r'^[A-Z]{2}$').hasMatch(c), isTrue, reason: c);
      }
      expect(codes.last, 'ZZ');
      expect(pays.every((p) => zones.contains(p.zone)), isTrue);
    });

    test('idPays / codePays se répondent', () {
      expect(idPays('SN'), 'pays-sn');
      expect(codePays('pays-sn'), 'SN');
      expect(codePays('abidjan-ville'), isNull);
      expect(codePays(null), isNull);
      expect(paysParId('pays-fr')?.nom, 'France');
      expect(paysParCode('xx'), isNull);
    });
  });

  group('locationLabel hors Côte d’Ivoire', () {
    test('ville en clair, puis pays', () {
      expect(locationLabel(regionAutresPays, 'pays-sn', 'Dakar'),
          'Dakar, Sénégal');
    });

    test('sans ville : le pays seul', () {
      expect(locationLabel(regionAutresPays, 'pays-fr'), 'France');
    });

    test('la région seule : « Autres pays »', () {
      expect(locationLabel(regionAutresPays, null), 'Autres pays');
    });

    test('un pays inconnu du fichier ne casse rien', () {
      expect(locationLabel(regionAutresPays, 'pays-xq', 'Quelque part'),
          'Quelque part');
    });
  });

  group('drapeau', () {
    test('un code connu donne son drapeau', () {
      expect(drapeau('SN'), '🇸🇳');
      expect(drapeau('fr'), '🇫🇷');
    });

    test('« Autre pays » et l’inconnu donnent un globe', () {
      expect(drapeau('ZZ'), '🌍');
      expect(drapeau(null), '🌍');
      expect(drapeau('pays-sn'), '🌍');
    });
  });

  group('lieuHorsCi (ce que dit le GPS)', () {
    test('en Côte d’Ivoire : rien — la cascade ivoirienne décide', () {
      expect(lieuHorsCi('CI', 'Abidjan'), isNull);
      expect(lieuHorsCi(null, 'Dakar'), isNull);
      expect(lieuHorsCi('', 'Dakar'), isNull);
    });

    test('un pays connu : sa ville en clair', () {
      final l = lieuHorsCi('sn', ' Dakar ');
      expect(l?.regionId, regionAutresPays);
      expect(l?.cityId, 'pays-sn');
      expect(l?.commune, 'Dakar');
    });

    test('un pays absent du fichier tombe dans « Autre pays »', () {
      final l = lieuHorsCi('FJ', 'Suva');
      expect(l?.cityId, 'pays-zz');
      expect(l?.commune, 'Suva');
    });

    test('un nom de pays dans une adresse ne place pas hors CI', () {
      // « Mali » ou « Niger » comme quartier ou rue : la ville reste à
      // chercher parmi les villes ivoiriennes, et n'y est pas.
      expect(resolveLocationByName(['Mali']), isNull);
      expect(resolveLocationByName(['Niger', 'Congo']), isNull);
    });
  });
}
