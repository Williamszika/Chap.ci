// Banc du découpage administratif porté de src/data/locations.ts + coords.ts.
// On y vérifie ce dont dépend « Publier » : le libellé du lieu, la cascade
// région → ville → commune, le rapprochement d'un nom capté par le GPS, et la
// position approximative de repli quand le GPS n'est pas activé.
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/locations.dart';
import 'package:chapci/data/coords.dart';

void main() {
  group('locationLabel', () {
    test('commune + ville + région pour Abidjan', () {
      expect(locationLabel('abidjan', 'abidjan-ville', 'Cocody'),
          'Cocody, Abidjan');
    });

    test('ville hors Abidjan → ville + région', () {
      // Bouaké est dans la région Gbêkê : les deux noms diffèrent.
      expect(locationLabel('gbeke', 'bouake'), 'Bouaké, Gbêkê');
    });

    test('région seule → nom de la région', () {
      expect(locationLabel('poro', null), 'Poro');
    });

    test('rien de choisi → toute la Côte d’Ivoire', () {
      expect(locationLabel(null, null), 'Toute la Côte d’Ivoire');
    });
  });

  group('cascade région → ville', () {
    test('seule Abidjan porte des communes', () {
      final abidjan = cityById('abidjan-ville');
      expect(abidjan?.communes, isNotNull);
      expect(abidjan!.communes!.length, 13);
      // Une ville de l'intérieur n'a pas de communes.
      expect(cityById('bouake')?.communes, isNull);
    });

    test('les villes d’une région se retrouvent par leur regionId', () {
      final villes = citiesByRegion('san-pedro').map((c) => c.name).toList();
      expect(villes, containsAll(['San-Pédro', 'Tabou']));
    });

    test('chaque ville pointe vers une région existante', () {
      for (final c in cities) {
        expect(regionById(c.regionId), isNotNull,
            reason: 'ville ${c.name} → région ${c.regionId} inconnue');
      }
    });
  });

  group('resolveLocationByName (GPS → lieu connu)', () {
    test('un quartier d’Abidjan retombe sur la commune', () {
      final l = resolveLocationByName(['Yopougon', 'Abidjan', 'Lagunes']);
      expect(l?.regionId, 'abidjan');
      expect(l?.cityId, 'abidjan-ville');
      expect(l?.commune, 'Yopougon');
    });

    test('une ville de l’intérieur retombe sur sa région', () {
      final l = resolveLocationByName([null, 'Korhogo', null]);
      expect(l?.regionId, 'poro');
      expect(l?.cityId, 'korhogo');
      expect(l?.commune, isNull);
    });

    test('un nom inconnu ne résout rien', () {
      expect(resolveLocationByName(['Tombouctou']), isNull);
    });
  });

  group('coordsFor (position de repli)', () {
    test('une commune d’Abidjan a ses coordonnées', () {
      final c = coordsFor('abidjan-ville', 'Cocody');
      expect(c, isNotNull);
      expect(c!.lat, closeTo(5.36, 0.05));
    });

    test('sans commune, on retombe sur la ville', () {
      expect(coordsFor('bouake'), isNotNull);
    });

    test('lieu inconnu → pas de coordonnées', () {
      expect(coordsFor('nulle-part'), isNull);
    });
  });
}
