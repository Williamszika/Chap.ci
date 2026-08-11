// =============================================================================
//  Les couleurs des formulaires — port fidèle de src/data/couleurs.ts + les
//  palettes de métier de src/data/sous/mode.ts.
//
//  Une couleur cochée peut porter SA photo, SON prix, SES détails et SES tailles
//  restantes : le vendeur qui a le même article en noir et en bleu ne publie
//  qu'une annonce, mais l'acheteur voit chaque version. Le stockage réutilise
//  les attributs texte, sur le modèle des numéros de documents fonciers :
//      var_Noir_photo = "2"      → index dans les photos de l'annonce
//      var_Noir_prix  = "85000"  → prix propre à cette couleur
//      var_Noir_note  = "128 Go" → détails propres à cette couleur
//      var_Noir_tailles = "40, 42" → un champ déclinable (les tailles) par coloris
//  Rien à changer côté serveur : ce sont des paires clé/valeur comme les autres.
// =============================================================================
import 'package:flutter/material.dart';

/// Une teinte proposée dans le formulaire. La pastille se peint (`couleur` unie
/// ou `degrade`) ; `clair` reçoit un liseré pour rester visible sur fond clair.
class Couleur {
  final String nom;
  final Color? couleur;
  final Gradient? degrade;
  final bool clair;
  const Couleur(this.nom, {this.couleur, this.degrade, this.clair = false});
}

// Les dégradés récurrents, définis une fois.
const _argente = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF3F4F6), Color(0xFF9CA3AF)]);
const _dore = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF5D882), Color(0xFFD4AF37)]);
const _multicolore = SweepGradient(colors: [
  Color(0xFFF77F00),
  Color(0xFFFACC15),
  Color(0xFF16A34A),
  Color(0xFF2563EB),
  Color(0xFF8B5CF6),
  Color(0xFFEC4899),
  Color(0xFFF77F00),
]);

/// Les quinze teintes générales — la palette par défaut.
const List<Couleur> couleursBase = [
  Couleur('Noir', couleur: Color(0xFF1B1A17)),
  Couleur('Blanc', couleur: Color(0xFFFFFFFF), clair: true),
  Couleur('Gris', couleur: Color(0xFF9CA3AF)),
  Couleur('Argenté', degrade: _argente, clair: true),
  Couleur('Doré', degrade: _dore, clair: true),
  Couleur('Bleu', couleur: Color(0xFF2563EB)),
  Couleur('Vert', couleur: Color(0xFF16A34A)),
  Couleur('Rouge', couleur: Color(0xFFDC2626)),
  Couleur('Orange', couleur: Color(0xFFF97316)),
  Couleur('Jaune', couleur: Color(0xFFFACC15), clair: true),
  Couleur('Rose', couleur: Color(0xFFEC4899)),
  Couleur('Violet', couleur: Color(0xFF8B5CF6)),
  Couleur('Marron', couleur: Color(0xFF92400E)),
  Couleur('Beige', couleur: Color(0xFFE8D8C3), clair: true),
  Couleur('Multicolore', degrade: _multicolore),
];

/// Les numéros de mèches qu'on emploie à Adjamé et à Cocody.
const List<Couleur> paletteCheveux = [
  Couleur('1 · Noir de jais', couleur: Color(0xFF0A0A0A)),
  Couleur('1B · Noir naturel', couleur: Color(0xFF14100E)),
  Couleur('2 · Brun très foncé', couleur: Color(0xFF2A1A12)),
  Couleur('4 · Châtain', couleur: Color(0xFF5A3722)),
  Couleur('6 · Châtain clair', couleur: Color(0xFF7B4E2E)),
  Couleur('27 · Miel', couleur: Color(0xFFB87A3D)),
  Couleur('30 · Cuivré', couleur: Color(0xFFA85520)),
  Couleur('33 · Acajou', couleur: Color(0xFF6E2B22)),
  Couleur('99J · Bordeaux', couleur: Color(0xFF5A1224)),
  Couleur('613 · Blond platine', couleur: Color(0xFFE4CFA1), clair: true),
  Couleur('Gris / argent', couleur: Color(0xFFA8A29E)),
  Couleur('Ombré / mèches',
      degrade: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF14100E), Color(0xFFB87A3D)],
          stops: [0.45, 1.0])),
  Couleur('Coloré (fantaisie)',
      degrade: SweepGradient(colors: [
        Color(0xFFEC4899),
        Color(0xFF8B5CF6),
        Color(0xFF2563EB),
        Color(0xFF16A34A),
        Color(0xFFFACC15),
        Color(0xFFEC4899),
      ])),
];

/// Les carnations, du plus clair au plus profond (fonds de teint, poudres).
const List<Couleur> paletteTeint = [
  Couleur('Très clair', couleur: Color(0xFFF0D5BE), clair: true),
  Couleur('Clair', couleur: Color(0xFFE8C39E), clair: true),
  Couleur('Beige doré', couleur: Color(0xFFD9A97A), clair: true),
  Couleur('Miel', couleur: Color(0xFFC68A4E)),
  Couleur('Caramel', couleur: Color(0xFFB2703A)),
  Couleur('Noisette', couleur: Color(0xFF96562C)),
  Couleur('Cacao', couleur: Color(0xFF7A4423)),
  Couleur('Chocolat', couleur: Color(0xFF5E3319)),
  Couleur('Ébène', couleur: Color(0xFF452412)),
  Couleur('Ébène profond', couleur: Color(0xFF2E1709)),
];

/// Lèvres, ongles, yeux : les noms des nuanciers (rouge à lèvres, vernis…).
const List<Couleur> paletteMaquillage = [
  Couleur('Nude', couleur: Color(0xFFD6A48C), clair: true),
  Couleur('Rose', couleur: Color(0xFFEC4899)),
  Couleur('Fuchsia', couleur: Color(0xFFC2185B)),
  Couleur('Corail', couleur: Color(0xFFFF6F52)),
  Couleur('Rouge', couleur: Color(0xFFDC2626)),
  Couleur('Bordeaux', couleur: Color(0xFF7A1F2B)),
  Couleur('Prune', couleur: Color(0xFF6B2D5B)),
  Couleur('Marron', couleur: Color(0xFF92400E)),
  Couleur('Orange', couleur: Color(0xFFF97316)),
  Couleur('Doré', degrade: _dore, clair: true),
  Couleur('Argenté', degrade: _argente, clair: true),
  Couleur('Noir', couleur: Color(0xFF1B1A17)),
  Couleur('Bleu', couleur: Color(0xFF2563EB)),
  Couleur('Vert', couleur: Color(0xFF16A34A)),
  Couleur('Violet', couleur: Color(0xFF8B5CF6)),
  Couleur('Transparent',
      degrade: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFFFF), Color(0xFFE5E7EB)]),
      clair: true),
  Couleur('Pailleté',
      degrade: SweepGradient(colors: [
        Color(0xFFFFF3C4),
        Color(0xFFD4AF37),
        Color(0xFFFFFFFF),
        Color(0xFFD4AF37),
        Color(0xFFFFF3C4),
      ]),
      clair: true),
];

/// La palette de base de l'Électronique — les quinze teintes, plus le « gris
/// sidéral » (space grey) et le « transparent » qu'on voit sur les coques et
/// certains téléphones.
const List<Couleur> paletteElectronique = [
  Couleur('Noir', couleur: Color(0xFF1B1A17)),
  Couleur('Blanc', couleur: Color(0xFFFFFFFF), clair: true),
  Couleur('Gris', couleur: Color(0xFF9CA3AF)),
  Couleur('Gris sidéral', couleur: Color(0xFF4B5057)),
  Couleur('Argenté', degrade: _argente, clair: true),
  Couleur('Doré', degrade: _dore, clair: true),
  Couleur('Bleu', couleur: Color(0xFF2563EB)),
  Couleur('Vert', couleur: Color(0xFF16A34A)),
  Couleur('Rouge', couleur: Color(0xFFDC2626)),
  Couleur('Orange', couleur: Color(0xFFF97316)),
  Couleur('Jaune', couleur: Color(0xFFFACC15), clair: true),
  Couleur('Rose', couleur: Color(0xFFEC4899)),
  Couleur('Violet', couleur: Color(0xFF8B5CF6)),
  Couleur('Marron', couleur: Color(0xFF92400E)),
  Couleur('Beige', couleur: Color(0xFFE8D8C3), clair: true),
  Couleur('Transparent',
      degrade: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFFFF), Color(0xFFD9E2EC)]),
      clair: true),
  Couleur('Multicolore', degrade: _multicolore),
];

// Le wax / imprimé et le multicolore de la Maison — des dégradés à part.
const _waxImprime = SweepGradient(colors: [
  Color(0xFFF77F00),
  Color(0xFFFACC15),
  Color(0xFF16A34A),
  Color(0xFF2563EB),
  Color(0xFFDC2626),
  Color(0xFFF77F00),
]);
const _multiMaison = SweepGradient(colors: [
  Color(0xFFEC4899),
  Color(0xFF8B5CF6),
  Color(0xFF2563EB),
  Color(0xFF16A34A),
  Color(0xFFFACC15),
  Color(0xFFEC4899),
]);

/// La palette de base de la Maison — plus riche (crème, taupe, bleu nuit,
/// bordeaux, inox, wax) que les quinze générales.
const List<Couleur> paletteMaison = [
  Couleur('Blanc', couleur: Color(0xFFFFFFFF), clair: true),
  Couleur('Noir', couleur: Color(0xFF1B1A17)),
  Couleur('Gris', couleur: Color(0xFF9CA3AF)),
  Couleur('Beige', couleur: Color(0xFFE8D8C3), clair: true),
  Couleur('Crème', couleur: Color(0xFFF5EEE0), clair: true),
  Couleur('Marron', couleur: Color(0xFF7A4423)),
  Couleur('Taupe', couleur: Color(0xFF8B7D6B)),
  Couleur('Bleu', couleur: Color(0xFF2563EB)),
  Couleur('Bleu nuit', couleur: Color(0xFF1E3A5F)),
  Couleur('Vert', couleur: Color(0xFF16A34A)),
  Couleur('Rouge', couleur: Color(0xFFDC2626)),
  Couleur('Bordeaux', couleur: Color(0xFF7A1F2B)),
  Couleur('Orange', couleur: Color(0xFFF97316)),
  Couleur('Jaune', couleur: Color(0xFFFACC15), clair: true),
  Couleur('Rose', couleur: Color(0xFFEC4899)),
  Couleur('Violet', couleur: Color(0xFF8B5CF6)),
  Couleur('Doré', degrade: _dore, clair: true),
  Couleur('Argenté / inox', degrade: _argente, clair: true),
  Couleur('Wax / imprimé', degrade: _waxImprime),
  Couleur('Multicolore', degrade: _multiMaison),
];

/// Les teintes de bois — pour ce qui se vend AU BOIS et non à la couleur
/// (meubles, essences : teck, iroko, wengé…).
const List<Couleur> paletteBois = [
  Couleur('Bois naturel clair', couleur: Color(0xFFD6B98C), clair: true),
  Couleur('Bois miel', couleur: Color(0xFFB8823C)),
  Couleur('Teck', couleur: Color(0xFF9C6B32)),
  Couleur('Iroko', couleur: Color(0xFF8A5A2B)),
  Couleur('Acajou', couleur: Color(0xFF6B3A26)),
  Couleur('Wengé / brun foncé', couleur: Color(0xFF3E2A20)),
  Couleur('Ébène / noir', couleur: Color(0xFF1B1A17)),
  Couleur('Blanc laqué', couleur: Color(0xFFFFFFFF), clair: true),
  Couleur('Gris', couleur: Color(0xFF9CA3AF)),
  Couleur('Bicolore bois et blanc',
      degrade: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFB8823C), Color(0xFFFFFFFF)],
          stops: [0.5, 0.5]),
      clair: true),
];

// L'imprimé enfant — un dégradé pastel propre au rayon Bébé.
const _imprimeEnfant = SweepGradient(colors: [
  Color(0xFFF9A8D4),
  Color(0xFF93C5FD),
  Color(0xFFFACC15),
  Color(0xFFA7F3D0),
  Color(0xFFF9A8D4),
]);

/// La palette du rayon Bébé & Enfant — des pastels (rose layette, bleu ciel,
/// vert d'eau) et les imprimés enfant, que les teintes générales n'ont pas.
const List<Couleur> paletteBebe = [
  Couleur('Blanc', couleur: Color(0xFFFFFFFF), clair: true),
  Couleur('Écru / crème', couleur: Color(0xFFF5EEE0), clair: true),
  Couleur('Beige', couleur: Color(0xFFE8D8C3), clair: true),
  Couleur('Gris', couleur: Color(0xFF9CA3AF)),
  Couleur('Noir', couleur: Color(0xFF1B1A17)),
  Couleur('Rose', couleur: Color(0xFFF9A8D4), clair: true),
  Couleur('Rose vif', couleur: Color(0xFFEC4899)),
  Couleur('Bleu ciel', couleur: Color(0xFF93C5FD), clair: true),
  Couleur('Bleu', couleur: Color(0xFF2563EB)),
  Couleur('Bleu marine', couleur: Color(0xFF1E3A5F)),
  Couleur('Vert', couleur: Color(0xFF16A34A)),
  Couleur('Vert d’eau', couleur: Color(0xFFA7F3D0), clair: true),
  Couleur('Jaune', couleur: Color(0xFFFACC15), clair: true),
  Couleur('Orange', couleur: Color(0xFFF97316)),
  Couleur('Rouge', couleur: Color(0xFFDC2626)),
  Couleur('Violet', couleur: Color(0xFF8B5CF6)),
  Couleur('Marron', couleur: Color(0xFF7A4423)),
  Couleur('Wax / pagne', degrade: _waxImprime),
  Couleur('Imprimé enfant', degrade: _imprimeEnfant),
  Couleur('Multicolore', degrade: _multiMaison),
];

/// La clé d'attribut d'une variante : `var_<Couleur>_<champ>`.
String cleVariante(String nom, String champ) => 'var_${nom}_$champ';

/// « Noir, Bleu » → [Couleur, Couleur], dans l'ordre coché, en ne gardant que
/// les teintes présentes dans la palette active (les noms inconnus sont ignorés).
List<Couleur> lireCouleurs(dynamic v, List<Couleur> palette) {
  final noms = <String>[];
  if (v is List) {
    noms.addAll(v.map((e) => e.toString()));
  } else if (v is String) {
    noms.addAll(v.split(',').map((s) => s.trim()));
  }
  final out = <Couleur>[];
  for (final nom in noms) {
    if (nom.isEmpty) continue;
    for (final c in palette) {
      if (c.nom == nom) {
        out.add(c);
        break;
      }
    }
  }
  return out;
}
