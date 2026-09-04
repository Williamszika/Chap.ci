// =============================================================================
//  « CHAP.CI ÉCRIT L'ANNONCE » — côté téléphone.
//
//  Nouveauté n° 1 du 03/09/2026, portée du site (`src/lib/deviner.ts`). Le
//  vendeur prend la photo ; le titre, la catégorie, la sous-catégorie, l'état
//  et les caractéristiques se remplissent. Ce fichier prépare ce qui part au
//  serveur (`POST /annonce/deviner`) :
//
//   · la photo, RÉDUITE à 768 px et recomprimée en JPEG : le moteur n'a pas
//     besoin de plus pour reconnaître un téléphone, et chaque pixel envoyé
//     coûte des jetons et du forfait — la photo pleine (1 600 px) reste pour
//     l'annonce. La réduction se fait dans un isolat (`compute`) : décoder et
//     réencoder une photo prend une demi-seconde, et l'écran ne doit pas
//     geler pendant ce temps ;
//   · le catalogue des catégories, tel que l'application le connaît. C'est
//     le client qui le tient (`data/categories.dart` + `registre.dart`), pas
//     le serveur : une seconde copie en PHP divergerait à la première
//     catégorie ajoutée.
//
//  Les sous-catégories n'ont pas d'identifiant à part : leur nom EST leur
//  identifiant dans les annonces (`listing.subcategory`). Le catalogue les
//  envoie donc telles quelles, et le serveur vérifie que la réponse du moteur
//  en fait partie — s'il invente, la case reste vide.
//
//  ⚠️ LA CLÉ DU MOTEUR N'EST PAS DANS L'APPLICATION. Elle est dans
//  `api/config.php`, sur le serveur, chez le Patron. L'application demande
//  d'abord si la fonction est allumée (`GET /annonce/deviner`) ; si non, rien
//  ne change à l'écran — le formulaire reste celui d'hier.
// =============================================================================
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show compute;
import 'package:image/image.dart' as img;

import '../data/categories.dart';
import '../data/formulaires/registre.dart';
import 'api_client.dart';

/// Ce que le moteur a lu sur la photo. Tout peut être vide : on ne remplit
/// que ce qu'il a su dire, et jamais par-dessus ce que la personne a tapé.
class Devine {
  final String titre;
  final String description;
  final String categoryId;
  final String subcategory;

  /// 'neuf', 'occasion' ou '' (indécis).
  final String etat;

  /// Clé de champ (en minuscules) → valeur : marque, modèle, couleur…
  final Map<String, String> caracteristiques;

  /// 0 à 100. Sous 30, on n'applique rien : mieux vaut un formulaire vide
  /// qu'un formulaire faux.
  final int confiance;

  const Devine({
    required this.titre,
    required this.description,
    required this.categoryId,
    required this.subcategory,
    required this.etat,
    required this.caracteristiques,
    required this.confiance,
  });

  factory Devine.fromJson(Map<String, dynamic> j) {
    final car = <String, String>{};
    if (j['caracteristiques'] is Map) {
      (j['caracteristiques'] as Map).forEach((k, v) {
        final cle = k.toString().trim().toLowerCase();
        final val = (v ?? '').toString().trim();
        if (cle.isNotEmpty && val.isNotEmpty) car[cle] = val;
      });
    }
    return Devine(
      titre: (j['titre'] ?? '').toString().trim(),
      description: (j['description'] ?? '').toString().trim(),
      categoryId: (j['categoryId'] ?? '').toString().trim(),
      subcategory: (j['subcategory'] ?? '').toString().trim(),
      etat: (j['etat'] ?? '').toString().trim(),
      caracteristiques: car,
      confiance: (j['confiance'] is num) ? (j['confiance'] as num).toInt() : 0,
    );
  }
}

/// La fonction est-elle allumée sur le serveur (clé en place) ? `false` au
/// moindre doute : un réseau coupé ne doit pas déclencher d'attente.
Future<bool> devinerDisponible() async {
  try {
    final d = await ApiClient.instance.get('/annonce/deviner');
    return d is Map && d['disponible'] == true;
  } catch (_) {
    return false;
  }
}

/// Le catalogue que le moteur lira — et contre lequel le serveur vérifiera sa
/// réponse. Même forme que sur le site : `{id, label, sous: [{id, label}]}`.
List<Map<String, dynamic>> catalogueDeviner() => [
      for (final c in categories)
        {
          'id': c.id,
          'label': c.nom,
          'sous': [
            for (final s in sousDe(c.id)) {'id': s, 'label': s},
          ],
        },
    ];

/// Côté le plus long de la photo envoyée au moteur.
const int _coteMax = 768;

/// Réduit et recomprime — dans un isolat, voir l'en-tête. `null` si la photo
/// n'est pas décodable (format exotique) : on n'envoie alors rien.
Future<Uint8List?> reduirePourVision(Uint8List octets) =>
    compute(_reduire, octets);

Uint8List? _reduire(Uint8List octets) {
  try {
    var image = img.decodeImage(octets);
    if (image == null) return null;
    // Les photos de téléphone portent leur rotation dans l'EXIF : sans ce
    // redressement, le moteur lirait un frigo couché.
    image = img.bakeOrientation(image);
    final plusGrand = image.width > image.height ? image.width : image.height;
    if (plusGrand > _coteMax) {
      final k = _coteMax / plusGrand;
      image = img.copyResize(
        image,
        width: (image.width * k).round().clamp(1, _coteMax),
        height: (image.height * k).round().clamp(1, _coteMax),
        interpolation: img.Interpolation.average,
      );
    }
    return Uint8List.fromList(img.encodeJpg(image, quality: 80));
  } catch (_) {
    return null;
  }
}

/// Demande au moteur de rédiger l'annonce à partir d'une photo. Lève une
/// [ApiException] si le serveur refuse (quota du jour, photo refusée, moteur
/// éteint) — l'écran décide alors de se taire.
Future<Devine?> deviner(Uint8List photo) async {
  final petite = await reduirePourVision(photo);
  if (petite == null) return null;
  final d = await ApiClient.instance.post(
    '/annonce/deviner',
    {
      'image': 'data:image/jpeg;base64,${base64Encode(petite)}',
      'catalogue': catalogueDeviner(),
    },
    // Le serveur attend le moteur jusqu'à 60 s ; trois à dix en pratique.
    timeout: const Duration(seconds: 70),
  );
  if (d is Map<String, dynamic>) return Devine.fromJson(d);
  return null;
}
