// Banc de test de la recherche qui comprend (chantier 3 du 04/09/2026) — le
// jumeau Dart de scripts/banc-comprendre.mjs : les MÊMES annonces, les MÊMES
// questions, les mêmes refus attendus. Si l'application répondait autrement
// que le site, un acheteur trouverait sur l'un ce qu'il ne trouve pas sur
// l'autre.
import 'package:flutter_test/flutter_test.dart';

import 'package:chapci/recherche.dart';

class _Annonce {
  final String id, title, description, categorie, sous;
  final Map<String, String> attributs;
  const _Annonce(this.id, this.title, this.description, this.categorie, this.sous, this.attributs);
  String get texte => '$title $description $sous $categorie ${attributs.values.join(' ')}';
}

const annonces = [
  _Annonce('tv', 'Télévision Samsung 43 pouces', 'Écran plat, très bon état.', 'Électronique', 'TV & Écrans', {'marque': 'Samsung'}),
  _Annonce('frigo', 'Réfrigérateur Hisense 2 portes', 'Froid ventilé.', 'Maison & Meubles', 'Électroménager', {}),
  _Annonce('iphone', 'iPhone 13 – 128 Go', 'Batterie 91 %, avec chargeur.', 'Électronique', 'Smartphones', {'marque': 'Apple', 'stockage': '128 Go'}),
  _Annonce('galaxy', 'Galaxy A15 comme neuf', 'Jamais tombé.', 'Électronique', 'Smartphones', {'marque': 'Samsung', 'stockage': '128 Go'}),
  _Annonce('nike', 'Basket Nike Air taille 42', 'Portées deux fois.', 'Mode & Beauté', 'Chaussures', {}),
  _Annonce('appart', 'Appartement 3 pièces à Cocody', 'Riviera 2, calme.', 'Immobilier', 'Appartements', {}),
  _Annonce('hiace', 'Minibus Toyota Hiace 18 places', 'Ligne Yopougon.', 'Véhicules', 'Camions & Utilitaires', {}),
  _Annonce('corolla', 'Toyota Corolla 2012', 'Climatisation OK.', 'Véhicules', 'Voitures', {}),
  _Annonce('jakarta', 'Moto Haojue 125', 'Papiers à jour.', 'Véhicules', 'Motos & Scooters', {}),
  _Annonce('nounou', 'Cherche nourrice à Marcory', 'Deux enfants, temps plein.', 'Emploi', 'Emploi maison', {}),
  _Annonce('clim', 'Split 1,5 CV Midea', 'Avec installation.', 'Maison & Meubles', 'Électroménager', {}),
  _Annonce('gaz', 'Bouteille de gaz 12 kg pleine', 'Livraison possible.', 'Maison & Meubles', 'Cuisine', {}),
];

const questions = <String, List<String>>{
  'télé': ['tv'],
  'tv': ['tv'],
  'television': ['tv'],
  'telvision': ['tv'],
  'televison samsung': ['tv'],
  'frigo': ['frigo'],
  'refrigirateur': ['frigo'],
  'portable': ['iphone', 'galaxy'],
  'smartphone 128': ['iphone', 'galaxy'],
  'iphone 13': ['iphone'],
  'iphone 14': [],
  'samsung': ['tv', 'galaxy'],
  'samsumg': ['tv', 'galaxy'],
  'chaussures nike': ['nike'],
  'basket': ['nike'],
  'appart cocody': ['appart'],
  'appartement 3 pièces': ['appart'],
  'gbaka': ['hiace'],
  'voiture': ['corolla'],
  'moto': ['jakarta'],
  'jakarta': ['jakarta'],
  'nounou': ['nounou'],
  'clim': ['clim'],
  'climatiseur midea': ['clim'],
  'gaz': ['gaz'],
  'bouteille de gaz': ['gaz'],
  'tv d’occasion': [],
};

void main() {
  final prepares = {for (final a in annonces) a.id: preparerRecherche(a.texte)};

  for (final e in questions.entries) {
    test('« ${e.key} » → ${e.value.isEmpty ? 'rien' : e.value.join(', ')}', () {
      final trouve = prepares.entries
          .where((p) => correspondRecherche(p.value, e.key))
          .map((p) => p.key)
          .toList()
        ..sort();
      expect(trouve, [...e.value]..sort());
    });
  }

  test('une requête vide trouve tout', () {
    expect(prepares.values.every((p) => correspondRecherche(p, '')), isTrue);
  });

  test('la distance compte une lettre changée, manquante ou deux voisines inversées', () {
    expect(distanceRecherche('samsumg', 'samsung'), 1);
    expect(distanceRecherche('telvision', 'television'), 1);
    expect(distanceRecherche('abc', 'acb'), 1);
    expect(distanceRecherche('abc', 'abc'), 0);
  });

  test('la normalisation enlève accents et ponctuation, soude les locutions', () {
    expect(normaliserRecherche('Télévision – 43 pouces !'), 'television 43 pouces');
    expect(motsRecherche('bouteille de gaz 12 kg'), ['bouteilledegaz', '12', 'kg']);
    expect(groupeRecherche('chaussures'), groupeRecherche('basket'));
  });
}
