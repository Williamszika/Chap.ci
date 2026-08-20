import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';
import '../data/coords.dart';

/// Une annonce, telle que la renvoie `GET /api/listings`.
///
/// Les clés JSON sont EXACTEMENT celles du serveur (camelCase : `categoryId`,
/// `createdAt`, `sellerName`…), reprises du type `Listing` du site — on ne
/// renomme rien, sinon l'app et le site divergeraient.
@immutable
class Listing {
  final String id;
  final String title;
  final String description;
  final num price;
  final bool negotiable;
  final String categoryId;
  final String? subcategory;
  final String condition; // 'neuf' | 'occasion'
  final List<String> images;
  final String? commune;
  final String? regionId;
  final String? cityId;
  final double? lat;
  final double? lng;
  final String sellerName;
  final String? sellerId; // le compte vendeur (pour ouvrir une conversation)
  final bool sellerVerified;
  final int createdAt; // ms
  final bool delivery;
  final bool featured;
  final num? promoPrice;
  final int? promoUntil; // ms
  final bool hidden;
  final bool sold;
  final int views;

  /// Les réponses du formulaire de publication, clé de champ → valeur (texte,
  /// liste pour un choix multiple, booléen pour une bascule). Sert à afficher
  /// le détail « État · Taille · Marque… » comme sur le site. Vide si absent.
  final Map<String, dynamic> attributes;

  const Listing({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.negotiable,
    required this.categoryId,
    required this.condition,
    required this.images,
    required this.sellerName,
    required this.createdAt,
    this.sellerId,
    this.subcategory,
    this.commune,
    this.regionId,
    this.cityId,
    this.lat,
    this.lng,
    this.sellerVerified = false,
    this.delivery = false,
    this.featured = false,
    this.promoPrice,
    this.promoUntil,
    this.hidden = false,
    this.sold = false,
    this.views = 0,
    this.attributes = const {},
  });

  /// Le prix à afficher : le promo s'il est actif, sinon le prix normal.
  num get prixAffiche {
    if (promoPrice != null &&
        promoUntil != null &&
        promoUntil! > DateTime.now().millisecondsSinceEpoch) {
      return promoPrice!;
    }
    return price;
  }

  bool get enPromo => prixAffiche != price;

  /// La meilleure position connue pour situer l'annonce : ses coordonnées GPS
  /// si le vendeur les a fournies, sinon le centre de sa commune (ou de sa
  /// ville). `null` si on ne sait rien — l'annonce ne comptera pas dans un tri
  /// par distance plutôt que d'être placée n'importe où.
  Coords? get position {
    if (lat != null && lng != null) return Coords(lat!, lng!);
    return coordsFor(cityId, commune);
  }

  factory Listing.fromJson(Map<String, dynamic> j) {
    return Listing(
      id: (j['id'] ?? '').toString(),
      title: (j['title'] ?? '').toString(),
      description: (j['description'] ?? '').toString(),
      price: (j['price'] is num) ? j['price'] as num : 0,
      negotiable: j['negotiable'] == true,
      categoryId: (j['categoryId'] ?? '').toString(),
      subcategory: j['subcategory']?.toString(),
      condition: (j['condition'] ?? 'occasion').toString(),
      images: (j['images'] is List)
          ? (j['images'] as List).map((e) => e.toString()).toList()
          : const [],
      commune: j['commune']?.toString(),
      regionId: j['regionId']?.toString(),
      cityId: j['cityId']?.toString(),
      lat: (j['lat'] is num) ? (j['lat'] as num).toDouble() : null,
      lng: (j['lng'] is num) ? (j['lng'] as num).toDouble() : null,
      sellerName: (j['sellerName'] ?? 'Vendeur').toString(),
      sellerId: j['sellerId']?.toString(),
      sellerVerified: j['sellerVerified'] == true,
      createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      delivery: j['delivery'] == true,
      featured: j['featured'] == true,
      promoPrice: (j['promoPrice'] is num) ? j['promoPrice'] as num : null,
      promoUntil: (j['promoUntil'] is num) ? (j['promoUntil'] as num).toInt() : null,
      hidden: j['hidden'] == true,
      sold: j['sold'] == true,
      views: (j['views'] is num) ? (j['views'] as num).toInt() : 0,
      attributes: (j['attributes'] is Map)
          ? Map<String, dynamic>.from(j['attributes'] as Map)
          : const {},
    );
  }

  /// Récupère la liste des annonces publiques.
  static Future<List<Listing>> toutes() async {
    final data = await ApiClient.instance.get('/listings');
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(Listing.fromJson)
        .toList();
  }

  /// Mes annonces (`GET /listings/mine`) — réservé au compte connecté, toutes
  /// les siennes (y compris masquées et vendues).
  static Future<List<Listing>> miennes() async {
    final data = await ApiClient.instance.get('/listings/mine');
    if (data is! List) return const [];
    return data
        .whereType<Map<String, dynamic>>()
        .map(Listing.fromJson)
        .toList();
  }

  /// Une annonce précise, fraîche du serveur (`GET /listings/{id}`).
  static Future<Listing> parId(String id) async {
    final d = await ApiClient.instance.get('/listings/$id');
    if (d is Map<String, dynamic>) return Listing.fromJson(d);
    throw ApiException('Annonce introuvable.');
  }

  /// Enregistre une vue. Silencieux : c'est une statistique, pas un geste
  /// critique — un échec ne doit jamais gêner l'affichage de la fiche.
  static Future<void> marquerVue(String id) async {
    try {
      await ApiClient.instance.post('/listings/$id/view', const {});
    } catch (_) {/* ignoré volontairement */}
  }
}

/// Résout une source d'image d'annonce en quelque chose d'affichable.
///
/// Le serveur peut renvoyer une URL absolue, un chemin `/uploads/...` relatif,
/// ou (rarement) une image encodée en `data:`. On gère les trois.
class ImageSource {
  final String? url;
  final Uint8List? bytes;
  const ImageSource({this.url, this.bytes});

  static ImageSource resoudre(String source) {
    if (source.startsWith('data:')) {
      final virgule = source.indexOf(',');
      if (virgule != -1) {
        try {
          return ImageSource(bytes: base64Decode(source.substring(virgule + 1)));
        } catch (_) {/* ignore */}
      }
      return const ImageSource();
    }
    if (source.startsWith('http')) return ImageSource(url: source);
    if (source.startsWith('/')) {
      return ImageSource(url: 'https://chap.ci$source');
    }
    return ImageSource(url: 'https://chap.ci/$source');
  }
}
