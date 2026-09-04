// =============================================================================
//  LA RECHERCHE QUI COMPREND — chantier 3 du 04/09/2026. Jumeau Dart de
//  src/lib/recherche.ts : mêmes règles, même dictionnaire (généré), mêmes
//  questions posées par les bancs. Une règle changée ici se change là-bas.
//
//  Une requête est découpée en mots, et chaque mot doit se retrouver dans
//  l'annonce : par son groupe de synonymes (« télé » ⇔ « tv »), par un début
//  de mot dès quatre lettres (« appart »), ou à une faute près dès cinq lettres
//  (« samsumg »). Un nombre ne se cherche qu'exactement : « iphone 14 » ne
//  trouve pas « iPhone 13 ».
// =============================================================================
import 'data/synonymes.dart';

const Map<String, String> _accents = {
  'à': 'a', 'â': 'a', 'ä': 'a', 'á': 'a', 'ã': 'a', 'å': 'a',
  'ç': 'c', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'î': 'i', 'ï': 'i', 'í': 'i', 'ì': 'i',
  'ô': 'o', 'ö': 'o', 'ó': 'o', 'ò': 'o', 'õ': 'o',
  'û': 'u', 'ü': 'u', 'ú': 'u', 'ù': 'u',
  'ÿ': 'y', 'ñ': 'n', 'œ': 'oe', 'æ': 'ae',
};

/// Minuscules, sans accents, lettres et chiffres seulement, un espace entre les mots.
String normaliserRecherche(String s) {
  final b = StringBuffer();
  for (final r in s.toLowerCase().runes) {
    final c = String.fromCharCode(r);
    b.write(_accents[c] ?? c);
  }
  return b.toString().replaceAll(RegExp(r'[^a-z0-9]+'), ' ').trim();
}

String _souderLocutions(String texte) {
  var t = ' $texte ';
  for (final paire in locutionsRecherche) {
    final loc = ' ${paire[0]} ';
    if (t.contains(loc)) t = t.replaceAll(loc, ' ${paire[1]} ');
  }
  return t.trim();
}

/// « chaussures » → « chaussure », « bijoux » → « bijou ». Trois lettres et moins : intouché.
String singulierRecherche(String mot) {
  if (mot.length > 3 && (mot.endsWith('s') || mot.endsWith('x'))) {
    return mot.substring(0, mot.length - 1);
  }
  return mot;
}

/// La clé du groupe de synonymes d'un mot, ou le mot lui-même au singulier.
String groupeRecherche(String mot) =>
    groupesRecherche[mot] ??
    groupesRecherche[singulierRecherche(mot)] ??
    singulierRecherche(mot);

/// Les mots d'un texte, locutions soudées.
List<String> motsRecherche(String texte) => _souderLocutions(normaliserRecherche(texte))
    .split(' ')
    .where((m) => m.isNotEmpty)
    .toList();

const Set<String> _liaison = {
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'en', 'au', 'aux', 'et',
  'ou', 'pour', 'avec', 'sur', 'dans', 'the', 'd', 'l',
};

final RegExp _nombre = RegExp(r'^[0-9]+$');

/// Distance de Damerau-Levenshtein (alignement optimal).
int distanceRecherche(String a, String b) {
  final la = a.length, lb = b.length;
  if (la == 0) return lb;
  if (lb == 0) return la;
  var avant2 = <int>[];
  var avant = List<int>.generate(lb + 1, (j) => j);
  for (var i = 1; i <= la; i++) {
    final ligne = <int>[i];
    for (var j = 1; j <= lb; j++) {
      final cout = a[i - 1] == b[j - 1] ? 0 : 1;
      var v = [avant[j] + 1, ligne[j - 1] + 1, avant[j - 1] + cout].reduce((x, y) => x < y ? x : y);
      if (i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]) {
        final t = avant2[j - 2] + 1;
        if (t < v) v = t;
      }
      ligne.add(v);
    }
    avant2 = avant;
    avant = ligne;
  }
  return avant[lb];
}

/// Une annonce, préparée une fois pour toutes les recherches.
class TextePrepare {
  final List<String> mots;
  final Set<String> groupes;
  TextePrepare(this.mots) : groupes = mots.map(groupeRecherche).toSet();
}

TextePrepare preparerRecherche(String texte) => TextePrepare(motsRecherche(texte));

/// Le mot est-il dans le dictionnaire des synonymes ?
bool connuRecherche(String mot) =>
    groupesRecherche.containsKey(mot) ||
    groupesRecherche.containsKey(singulierRecherche(mot));

/// Ce mot de la requête se retrouve-t-il dans l'annonce ?
/// Un mot du dictionnaire se cherche par son groupe, et par lui seul :
/// « clim » ne doit pas rattraper la « climatisation » d'une voiture.
bool correspondMotRecherche(TextePrepare annonce, String mot) {
  if (annonce.groupes.contains(groupeRecherche(mot))) return true;
  if (_nombre.hasMatch(mot) || connuRecherche(mot)) return false;
  if (mot.length >= 4) {
    for (final t in annonce.mots) {
      if (t.startsWith(mot)) return true;
    }
  }
  if (mot.length >= 5) {
    final tolerance = mot.length >= 9 ? 2 : 1;
    for (final t in annonce.mots) {
      if (_nombre.hasMatch(t) || (t.length - mot.length).abs() > tolerance) continue;
      if (distanceRecherche(t, mot) <= tolerance) return true;
    }
  }
  return false;
}

/// Les mots qu'on cherche vraiment dans une requête.
List<String> motsRequeteRecherche(String requete) => motsRecherche(requete)
    .where((m) => !_liaison.contains(m) && (m.length > 1 || _nombre.hasMatch(m)))
    .toList();

/// L'annonce répond-elle à la requête ? Chaque mot doit s'y retrouver.
/// Une requête vide répond oui.
bool correspondRecherche(TextePrepare annonce, String requete) {
  for (final m in motsRequeteRecherche(requete)) {
    if (!correspondMotRecherche(annonce, m)) return false;
  }
  return true;
}
