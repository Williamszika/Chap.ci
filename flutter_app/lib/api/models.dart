import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

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
  final String sellerName;
  final bool sellerVerified;
  final int createdAt; // ms
  final bool delivery;
  final bool featured;
  final num? promoPrice;
  final int? promoUntil; // ms
  final bool sold;
  final int views;

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
    this.subcategory,
    this.commune,
    this.sellerVerified = false,
    this.delivery = false,
    this.featured = false,
    this.promoPrice,
    this.promoUntil,
    this.sold = false,
    this.views = 0,
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
      sellerName: (j['sellerName'] ?? 'Vendeur').toString(),
      sellerVerified: j['sellerVerified'] == true,
      createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
      delivery: j['delivery'] == true,
      featured: j['featured'] == true,
      promoPrice: (j['promoPrice'] is num) ? j['promoPrice'] as num : null,
      promoUntil: (j['promoUntil'] is num) ? (j['promoUntil'] as num).toInt() : null,
      sold: j['sold'] == true,
      views: (j['views'] is num) ? (j['views'] as num).toInt() : 0,
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
