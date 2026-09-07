// Banc du stock des comptes professionnels (07/09/2026).
//
// Le Patron : « pour les comptes Pro, il doit y avoir une gérance de stock et
// un signalement si les produits sont sous le minimum, 5 ». On vérifie ici ce
// que l'application lit et montre : les champs de l'annonce, l'ordre de la
// console (ce qui manque en premier), les compteurs, et le corps envoyé au
// serveur pour écrire une quantité ou cesser le suivi.
import 'package:flutter_test/flutter_test.dart';
import 'package:chapci/api/models.dart';
import 'package:chapci/api/stock.dart';

void main() {
  group('Listing : le stock lu du serveur', () {
    test('une annonce sans stock : null, état « aucun »', () {
      final l = Listing.fromJson(const {'id': 'a', 'title': 'Tissu', 'price': 1000});
      expect(l.stock, isNull);
      expect(l.stockMin, 5);
      expect(l.stockEtat, 'aucun');
      expect(l.enRupture, isFalse);
      expect(l.stockBas, isFalse);
    });

    test('sous le minimum et en rupture', () {
      final bas = Listing.fromJson(const {'id': 'a', 'title': 'x', 'price': 1, 'stock': 3, 'stockMin': 5, 'stockEtat': 'bas'});
      expect(bas.stock, 3);
      expect(bas.stockBas, isTrue);
      expect(bas.enRupture, isFalse);
      final rupture = Listing.fromJson(const {'id': 'b', 'title': 'y', 'price': 1, 'stock': 0, 'stockMin': 5, 'stockEtat': 'rupture'});
      expect(rupture.enRupture, isTrue);
      expect(rupture.stockBas, isFalse);
    });
  });

  group('StockPro : la console', () {
    final donnees = {
      'annonces': [
        {'id': 'ok', 'title': 'Casquette', 'price': 3000, 'stock': 40, 'stockMin': 5, 'stockEtat': 'ok'},
        {'id': 'aucun', 'title': 'Sac', 'price': 9000, 'stock': null, 'stockMin': 5, 'stockEtat': 'aucun'},
        {'id': 'rupture', 'title': 'Sandales', 'price': 7000, 'stock': 0, 'stockMin': 5, 'stockEtat': 'rupture'},
        {'id': 'bas', 'title': 'Baskets', 'price': 12000, 'stock': 2, 'stockMin': 5, 'stockEtat': 'bas'},
      ],
      'suivies': 3, 'bas': 2, 'rupture': 1, 'minDefaut': 5,
    };

    test('se lit avec ses compteurs', () {
      final s = StockPro.fromJson(donnees);
      expect(s.annonces.length, 4);
      expect(s.suivies, 3);
      expect(s.bas, 2);
      expect(s.rupture, 1);
      expect(s.minDefaut, 5);
      expect(s.annonces[1].suivie, isFalse);
    });

    test('trier : rupture, puis bas, puis ok, puis sans suivi', () {
      final s = StockPro.trier(StockPro.fromJson(donnees).annonces);
      expect(s.annonces.map((l) => l.id).toList(), ['rupture', 'bas', 'ok', 'aucun']);
      expect(s.bas, 2, reason: 'la rupture compte aussi comme « sous le minimum »');
      expect(s.rupture, 1);
      expect(s.suivies, 3);
    });

    test('remplacer une ligne recalcule ordre et compteurs', () {
      final s = StockPro.fromJson(donnees);
      final baskets = s.annonces.firstWhere((l) => l.id == 'bas');
      final apres = s.remplacer(baskets.avec(stock: 12, stockEtat: 'ok'));
      expect(apres.bas, 1);
      // Les baskets passent « ok » à 12 : elles restent devant la casquette
      // (40), par quantité croissante — ce qui manque le plus tôt en premier.
      expect(apres.annonces.map((l) => l.id).toList(), ['rupture', 'bas', 'ok', 'aucun']);
      expect(apres.annonces[1].stockEtat, 'ok');
      final sansSuivi = apres.remplacer(baskets.avec(stockNul: true, stockEtat: 'aucun'));
      expect(sansSuivi.suivies, 2);
      expect(sansSuivi.annonces.last.id, anyOf('bas', 'aucun'));
    });

    test('avec() : la copie garde le reste', () {
      final l = LigneStock.fromJson({'id': 'x', 'title': 'Robe', 'price': 15000, 'image': '/uploads/r.jpg', 'stock': 4, 'stockMin': 5, 'stockEtat': 'bas'});
      final v = l.avec(stockMin: 2, stockEtat: 'ok');
      expect(v.title, 'Robe');
      expect(v.image, '/uploads/r.jpg');
      expect(v.stock, 4);
      expect(v.stockMin, 2);
      expect(v.stockEtat, 'ok');
      expect(l.avec(stockNul: true).stock, isNull);
    });
  });
}
