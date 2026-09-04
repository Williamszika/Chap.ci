// Banc de test des liens qui ouvrent l'application : la lecture d'une adresse
// chap.ci, avant toute navigation. Une adresse mal lue enverrait la personne
// sur une mauvaise fiche ou nulle part ; les deux formes qui circulent (avec
// et sans dièse) doivent donner la même chose, et tout le reste, rien.
import 'package:flutter_test/flutter_test.dart';

import 'package:chapci/liens_entrants.dart';

void main() {
  const id = 'c7e6d0f9-74dc-4798-84cf-d0c6f5185c27';

  test('une annonce, avec ou sans dièse, avec ou sans www', () {
    for (final u in [
      'https://chap.ci/annonce/$id',
      'https://chap.ci/annonce/$id/',
      'https://www.chap.ci/annonce/$id?utm_source=whatsapp',
      'https://chap.ci/#/annonce/$id',
    ]) {
      final c = lireLienChapci(Uri.parse(u));
      expect(c, isNotNull, reason: u);
      expect(c!.type, 'annonce', reason: u);
      expect(c.id, id, reason: u);
    }
  });

  test('un vendeur', () {
    final c = lireLienChapci(Uri.parse('https://chap.ci/vendeur/abc-123'));
    expect(c, (type: 'vendeur', id: 'abc-123'));
  });

  test('tout le reste ne mène à rien dans l’application', () {
    for (final u in [
      'https://chap.ci/',
      'https://chap.ci/explorer',
      'https://chap.ci/aide',
      'https://chap.ci/annonce/',
      'https://chap.ci/annonce/a', // trop court pour un identifiant
      'https://chap.ci/annonce/../api/health',
      'https://autre-site.ci/annonce/$id', // pas chez nous
      'https://chap.ci.evil.com/annonce/$id',
      'chapci://annonce/$id', // le schéma privé de la connexion Facebook
    ]) {
      expect(lireLienChapci(Uri.parse(u)), isNull, reason: u);
    }
  });
}
