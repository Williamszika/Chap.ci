// =============================================================================
//  Le contrat des formulaires par sous-catégorie — version Dart.
//
//  C'est la traduction fidèle du contrat du site (`src/data/sous/contrat.ts`).
//  Chap.ci ne pose pas les mêmes questions à qui vend un terrain et à qui vend
//  un poulet : chaque sous-catégorie a son propre formulaire. Ce fichier décrit
//  la FORME d'un champ et d'un schéma ; les schémas eux-mêmes vivent dans
//  `mode.dart`, `electronique.dart`… et se déclarent dans `registre.dart`.
//
//  On garde ici les noms longs (`cle`, `libelle`, `options`) : Dart n'a pas la
//  contrainte de poids du paquet web, et un champ nommé se relit mieux qu'un
//  `k`/`l`/`o`. Le moteur d'affichage est `screens/formulaire_dynamique.dart`.
// =============================================================================
import 'couleurs.dart';

/// Les réponses déjà saisies. Une valeur est tantôt un texte (« Toyota »),
/// tantôt une liste (les tailles cochées) — d'où le `dynamic`, comme sur le site.
typedef Vals = Map<String, dynamic>;

/// Une valeur qui peut se calculer à partir de ce qui est déjà rempli.
/// On la stocke en `Object?` (une valeur brute OU une fonction) et on la résout
/// avec [resoudreBool] / [resoudreTexte].
typedef CondFn = bool Function(Vals);
typedef TexteFn = String Function(Vals);
typedef PaletteFn = List<Couleur> Function(Vals);

/// Résout un `Selon<bool>` : soit un booléen direct, soit une fonction de l'état.
bool resoudreBool(Object? v, Vals s, {bool defaut = false}) {
  if (v is bool) return v;
  if (v is CondFn) return v(s);
  return defaut;
}

/// Résout un `Selon<String>` : texte direct, fonction, ou `null`.
String? resoudreTexte(Object? v, Vals s) {
  if (v is String) return v;
  if (v is TexteFn) return v(s);
  return null;
}

/// Résout un `Selon<List<Couleur>>` : liste directe, fonction, ou `null`.
List<Couleur>? resoudrePalette(Object? v, Vals s) {
  if (v is List<Couleur>) return v;
  if (v is PaletteFn) return v(s);
  return null;
}

/// Le bandeau de la fiche : UNE question par sous-catégorie, celle dont la
/// réponse change la décision de l'acheteur (la carte grise d'une voiture,
/// l'IMEI d'un téléphone, les frais demandés pour un emploi). Elle ne juge pas
/// le vendeur : ce qui est refusé, c'est le silence, jamais le défaut.
class Alerte {
  /// La réponse qui fait passer le bandeau au vert.
  final String? bon;

  /// Les autres réponses acceptables (vert également).
  final List<String> ok;

  /// Le texte affiché quand la réponse est bonne.
  final String? texteBon;

  /// Le texte affiché sinon — sauf si [textes] en prévoit un plus précis.
  final String? texteMauvais;

  /// Un texte par réponse, quand la nuance mérite mieux qu'un message unique.
  final Map<String, String> textes;

  const Alerte({
    this.bon,
    this.ok = const [],
    this.texteBon,
    this.texteMauvais,
    this.textes = const {},
  });

  /// Pour la réponse choisie : `(vert, texte)`. Vert = la réponse rassure
  /// l'acheteur ; le texte explique quoi vérifier.
  (bool, String) evaluer(String? valeur) {
    if (valeur == null || valeur.isEmpty) {
      return (false, texteMauvais ?? '');
    }
    final estBon = valeur == bon || ok.contains(valeur);
    final texte = textes[valeur] ?? (estBon ? texteBon : texteMauvais) ?? '';
    return (estBon, texte);
  }
}

/// Le type de saisie d'un champ sans liste d'options.
enum TypeChamp { texte, nombre, bascule }

/// Un champ du formulaire.
class Champ {
  /// Clé de stockage dans les attributs de l'annonce.
  final String cle;

  /// Libellé affiché.
  final String libelle;

  /// Les choix proposés (puces). `null` = champ de saisie libre.
  final List<String>? options;

  /// `texte` par défaut ; `nombre` pour un chiffre ; `bascule` pour un oui/non.
  final TypeChamp type;

  /// Plusieurs réponses possibles (cases à cocher au lieu de puces exclusives).
  final bool multi;

  /// Exigé pour publier.
  final bool req;

  /// Les options dépendent d'un autre champ (marque → modèles).
  final String? dependDe;

  /// La table de correspondance de [dependDe].
  final Map<String, List<String>>? table;

  /// Autorise une réponse libre en plus des puces. Une chaîne donne son libellé
  /// au choix qui l'ouvre (« Autre », « Autre marque »…) — aucune liste ne
  /// couvre tout un marché, et un vendeur bloqué s'en va. `true` ou `String`.
  final Object? libre;

  /// Le champ ne s'affiche que si…
  final CondFn? when;

  /// Aide sous le champ. Un `!` en tête la passe en rouge. `String` ou fonction.
  final Object? h;

  /// Unité affichée dans le champ (km, m², W…).
  final String? unite;

  /// Exemple en filigrane.
  final String? ph;

  /// Fait de ce champ le bandeau de la fiche. Un seul par sous-catégorie.
  final Alerte? alerte;

  /// Les réponses qui interdisent la publication.
  final List<String> bloque;

  /// Pourquoi la publication est refusée, et quoi faire à la place.
  final String? motifBloc;

  /// Ce champ peut être précisé couleur par couleur (les tailles restantes dans
  /// tel coloris). Il s'affiche normalement, ET dans chaque carte de couleur.
  final bool varOK;

  /// Le libellé abrégé du champ dans le bloc « variantes » (« Tailles
  /// restantes dans cette couleur »). À défaut, on reprend [libelle].
  final String? lVar;

  const Champ(
    this.cle,
    this.libelle, {
    this.options,
    this.type = TypeChamp.texte,
    this.multi = false,
    this.req = false,
    this.dependDe,
    this.table,
    this.libre,
    this.when,
    this.h,
    this.unite,
    this.ph,
    this.alerte,
    this.bloque = const [],
    this.motifBloc,
    this.varOK = false,
    this.lVar,
  });

  /// Le libellé du choix « libre », s'il est ouvert : la chaîne fournie, ou
  /// « Autre » par défaut.
  String get libelleLibre => libre is String ? libre as String : 'Autre';

  /// Les options réellement proposées, en tenant compte de [dependDe].
  List<String> optionsPour(Vals s) {
    if (dependDe != null && table != null) {
      final parent = s[dependDe!];
      if (parent is String) return table![parent] ?? const [];
      return const [];
    }
    return options ?? const [];
  }
}

/// Le formulaire d'une sous-catégorie.
class Schema {
  /// Proposer « occasion / neuf ». Un emploi, non. `bool` ou fonction.
  final Object? etat;

  /// Proposer « livraison possible ».
  final bool livraison;

  /// On vend un savoir-faire, pas un objet (réparation, cours, chantier) : la
  /// galerie se fait discrète.
  final bool service;

  /// Le libellé du prix : « Salaire mensuel », « Tarif à partir de »…
  final String? prixLabel;

  /// Un exemple de titre composé à partir de ce qui est rempli.
  final TexteFn? titre;

  final List<Champ> champs;

  /// Proposer le bloc couleurs — souvent conditionnel (un bijou, non).
  /// `bool` ou fonction `Selon<bool>`.
  final Object? couleurs;

  /// La palette du métier : teintes de bois, carnations, numéros de mèches…
  /// `List<Couleur>` ou fonction `Selon<List<Couleur>>`. À défaut, les quinze
  /// teintes générales.
  final Object? palette;

  /// Ce qu'on dit à la place du bloc couleurs quand il n'y en a pas.
  final Object? sansCouleur;

  /// L'aide au-dessus des pastilles.
  final Object? aideCouleurs;

  /// Le mot juste : « Couleurs », « Coloris », « Teintes », « Essences ».
  final Object? labCouleurs;

  /// L'aide du champ déclinable par couleur.
  final Object? aideCoulChamp;

  const Schema({
    this.etat = true,
    this.livraison = false,
    this.service = false,
    this.prixLabel,
    this.titre,
    required this.champs,
    this.couleurs,
    this.palette,
    this.sansCouleur,
    this.aideCouleurs,
    this.labCouleurs,
    this.aideCoulChamp,
  });
}
