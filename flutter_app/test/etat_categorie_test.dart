// Quelles catégories proposent « neuf / occasion » ? L'état se règle par
// sous-catégorie (Schema.etat) ; l'explorateur, lui, ne filtre que par
// catégorie, d'où categorieAEtat() : vrai dès qu'une sous-catégorie a un état.
//
// On verrouille ici les cas qui comptent : les catégories SANS neuf/occasion
// (un lapin, de l'attiéké, un emploi, un billet d'avion, un don) ne doivent
// pas afficher le filtre.
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/data/formulaires/registre.dart';

void main() {
  group('categorieAEtat', () {
    test('les catégories sans neuf/occasion renvoient false', () {
      expect(categorieAEtat('alimentation'), isFalse); // attiéké, jus…
      expect(categorieAEtat('emploi'), isFalse);
      expect(categorieAEtat('services'), isFalse);
      expect(categorieAEtat('voyage'), isFalse); // un billet n'est pas « neuf »
      expect(categorieAEtat('a-donner'), isFalse); // barème d'état à part
    });

    test('les catégories de biens gardent le neuf/occasion', () {
      expect(categorieAEtat('electronique'), isTrue);
      expect(categorieAEtat('vehicules'), isTrue);
      expect(categorieAEtat('mode'), isTrue);
      expect(categorieAEtat('maison'), isTrue);
      expect(categorieAEtat('bebe'), isTrue);
      expect(categorieAEtat('scolaire'), isTrue);
      expect(categorieAEtat('materiel-pro'), isTrue);
    });

    test('Animaux garde l’état via le matériel d’élevage (une sous-cat. suffit)',
        () {
      expect(categorieAEtat('animaux'), isTrue);
    });

    test('une catégorie non portée (immobilier) garde l’état par défaut', () {
      // Pas de schéma détaillé → formulaire de base, qui propose l'état.
      expect(categorieAEtat('immobilier'), isTrue);
    });

    test('une catégorie inconnue garde le filtre (défaut sûr)', () {
      expect(categorieAEtat('categorie-qui-nexiste-pas'), isTrue);
    });
  });
}
