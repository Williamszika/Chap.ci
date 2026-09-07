// =============================================================================
//  Le stock des comptes professionnels (07/09/2026) — port de src/lib/php.ts
//  (`phpProStock`, `phpStockMaj`).
//
//  Le Patron : « pour les comptes Pro, il doit y avoir une gérance de stock et
//  un signalement si les produits sont sous le minimum, 5 ». Chaque annonce
//  d'un professionnel peut porter une quantité et un seuil ; une vente conclue
//  retire une unité ; passer sous le seuil, puis arriver à zéro, prévient.
// =============================================================================
import 'api_client.dart';

/// Une annonce, vue par la console de stock.
class LigneStock {
  final String id;
  final String title;
  final num price;
  final String? image;

  /// Null : l'annonce ne suit pas de stock.
  final int? stock;
  final int stockMin;

  /// 'aucun', 'ok', 'bas', 'rupture' — calculé par le serveur.
  final String stockEtat;
  final bool sold;
  final bool hidden;

  const LigneStock({
    required this.id,
    required this.title,
    required this.price,
    this.image,
    this.stock,
    this.stockMin = 5,
    this.stockEtat = 'aucun',
    this.sold = false,
    this.hidden = false,
  });

  bool get suivie => stock != null;

  factory LigneStock.fromJson(Map<String, dynamic> j) => LigneStock(
        id: (j['id'] ?? '').toString(),
        title: (j['title'] ?? '').toString(),
        price: (j['price'] is num) ? j['price'] as num : 0,
        image: (j['image'] is String && (j['image'] as String).isNotEmpty)
            ? j['image'] as String
            : null,
        stock: (j['stock'] is num) ? (j['stock'] as num).toInt() : null,
        stockMin: (j['stockMin'] is num) ? (j['stockMin'] as num).toInt() : 5,
        stockEtat: (j['stockEtat'] ?? 'aucun').toString(),
        sold: j['sold'] == true,
        hidden: j['hidden'] == true,
      );

  LigneStock avec({int? stock, bool stockNul = false, int? stockMin, String? stockEtat}) =>
      LigneStock(
        id: id,
        title: title,
        price: price,
        image: image,
        stock: stockNul ? null : (stock ?? this.stock),
        stockMin: stockMin ?? this.stockMin,
        stockEtat: stockEtat ?? this.stockEtat,
        sold: sold,
        hidden: hidden,
      );
}

/// Le stock entier : les annonces (ce qui manque en premier) et les compteurs.
class StockPro {
  final List<LigneStock> annonces;
  final int suivies;
  final int bas;
  final int rupture;
  final int minDefaut;

  const StockPro({
    required this.annonces,
    this.suivies = 0,
    this.bas = 0,
    this.rupture = 0,
    this.minDefaut = 5,
  });

  factory StockPro.fromJson(Map<String, dynamic> j) => StockPro(
        annonces: (j['annonces'] is List)
            ? (j['annonces'] as List)
                .whereType<Map>()
                .map((e) => LigneStock.fromJson(Map<String, dynamic>.from(e)))
                .toList()
            : const [],
        suivies: (j['suivies'] as num?)?.toInt() ?? 0,
        bas: (j['bas'] as num?)?.toInt() ?? 0,
        rupture: (j['rupture'] as num?)?.toInt() ?? 0,
        minDefaut: (j['minDefaut'] as num?)?.toInt() ?? 5,
      );

  /// Recalcule compteurs et ordre après un changement local — même règle que
  /// le serveur : rupture, puis bas, puis ok par quantité, puis sans suivi.
  StockPro remplacer(LigneStock l) {
    final liste = [for (final x in annonces) x.id == l.id ? l : x];
    return StockPro.trier(liste, minDefaut: minDefaut);
  }

  factory StockPro.trier(List<LigneStock> liste, {int minDefaut = 5}) {
    const rang = {'rupture': 0, 'bas': 1, 'ok': 2, 'aucun': 3};
    final l = [...liste]..sort((a, b) {
        final r = (rang[a.stockEtat] ?? 3).compareTo(rang[b.stockEtat] ?? 3);
        if (r != 0) return r;
        return (a.stock ?? 1 << 30).compareTo(b.stock ?? 1 << 30);
      });
    final suivies = l.where((x) => x.suivie).length;
    final rupture = l.where((x) => x.stockEtat == 'rupture').length;
    final bas = l.where((x) => x.stockEtat == 'bas').length + rupture;
    return StockPro(annonces: l, suivies: suivies, bas: bas, rupture: rupture, minDefaut: minDefaut);
  }
}

class StockApi {
  static Future<StockPro> lire() async {
    final d = await ApiClient.instance.get('/pro/stock');
    return StockPro.fromJson(d is Map ? Map<String, dynamic>.from(d) : {});
  }

  /// Écrit la quantité et/ou le seuil. `stockNul` cesse le suivi.
  static Future<LigneStock> ecrire(LigneStock l,
      {int? stock, bool stockNul = false, int? stockMin}) async {
    final corps = <String, dynamic>{
      if (stockNul) 'stock': null else if (stock != null) 'stock': stock,
      if (stockMin != null) 'stockMin': stockMin,
    };
    final d = await ApiClient.instance.put('/listings/${l.id}/stock', corps);
    final m = d is Map ? d : const {};
    return l.avec(
      stock: (m['stock'] is num) ? (m['stock'] as num).toInt() : null,
      stockNul: m['stock'] == null,
      stockMin: (m['stockMin'] is num) ? (m['stockMin'] as num).toInt() : null,
      stockEtat: m['stockEtat']?.toString(),
    );
  }
}
