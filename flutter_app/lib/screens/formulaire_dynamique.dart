import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/formulaires/couleurs.dart';
import '../data/formulaires/schema.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// L'état courant d'un formulaire détaillé, remonté au parent à chaque
/// changement : ce qu'on enverra au serveur, ce qui manque encore, et — le cas
/// échéant — pourquoi la publication est interdite.
class EtatFormulaire {
  /// Les attributs prêts à partir (`{ marque: 'Nike', tailles: '40, 42' }`).
  final Map<String, String> attributs;

  /// Les libellés des champs requis encore vides.
  final List<String> manquants;

  /// Non-null = la publication est refusée (produit interdit, périmé…).
  final String? motifBloc;

  const EtatFormulaire(this.attributs, this.manquants, this.motifBloc);
}

/// Le moteur qui affiche le formulaire d'une sous-catégorie à partir de son
/// [Schema]. Il gère les puces (choix unique / multiple), les bascules, la
/// saisie libre, les champs conditionnels (`when`), les options dépendantes
/// (marque → modèles), le bandeau d'alerte et le blocage de publication.
///
/// Il ne connaît PAS le réseau : il remonte tout au parent (l'écran Publier)
/// par [onChange], qui décide quoi envoyer et quand.
class FormulaireDynamique extends StatefulWidget {
  final Schema schema;
  final ValueChanged<EtatFormulaire> onChange;

  /// Les photos déjà choisies (leurs octets), pour lier une couleur à l'une
  /// d'elles. Le moteur ne les modifie pas ; il pointe juste dessus.
  final List<Uint8List> images;

  /// Valeurs de départ, pour rouvrir un formulaire déjà rempli (édition d'une
  /// annonce) ou présenter un exemple. Les clés sont celles des attributs.
  final Vals? initiales;

  const FormulaireDynamique({
    super.key,
    required this.schema,
    required this.onChange,
    this.images = const [],
    this.initiales,
  });

  @override
  State<FormulaireDynamique> createState() => FormulaireDynamiqueState();
}

class FormulaireDynamiqueState extends State<FormulaireDynamique> {
  // Représentation interne : choix unique/texte = String, multi = List<String>,
  // bascule = bool. La sérialisation vers le serveur se fait dans _etat().
  final Vals _vals = {};
  // Les champs dont la saisie libre (« Autre ») est ouverte.
  final Set<String> _libre = {};
  final Map<String, TextEditingController> _ctrl = {};

  @override
  void initState() {
    super.initState();
    if (widget.initiales != null) {
      widget.initiales!.forEach((k, v) {
        _vals[k] = v is List ? List<String>.from(v.map((e) => e.toString())) : v;
      });
    }
    // On remonte l'état initial (les champs requis encore vides) dès le montage,
    // pour que le parent sache quoi exiger même si le vendeur ne touche à rien.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _notifier();
    });
  }

  @override
  void dispose() {
    for (final c in _ctrl.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant FormulaireDynamique oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Changement de sous-catégorie : on repart d'un formulaire vierge.
    if (oldWidget.schema != widget.schema) {
      _vals.clear();
      _libre.clear();
      WidgetsBinding.instance.addPostFrameCallback((_) => _notifier());
    }
  }

  TextEditingController _controleur(String cle) =>
      _ctrl.putIfAbsent(cle, () => TextEditingController(text: (_vals[cle] ?? '').toString()));

  bool _visible(Champ c) => c.when == null || c.when!(_vals);

  String _serialiser(Champ c) {
    final v = _vals[c.cle];
    if (c.type == TypeChamp.bascule) return v == true ? 'Oui' : '';
    if (c.multi) return (v is List) ? v.map((e) => e.toString()).join(', ') : '';
    return (v ?? '').toString().trim();
  }

  // --- Le bloc couleurs -------------------------------------------------------

  /// Le bloc couleurs est-il proposé pour l'état courant ?
  bool get _blocCouleurs => resoudreBool(widget.schema.couleurs, _vals);

  /// La palette active (celle du métier, sinon les quinze teintes générales).
  List<Couleur> get _palette =>
      resoudrePalette(widget.schema.palette, _vals) ?? couleursBase;

  /// Les couleurs cochées, dans l'ordre, limitées à la palette active.
  List<Couleur> get _couleursChoisies =>
      lireCouleurs(_vals['couleurs'], _palette);

  /// Les champs déclinables couleur par couleur, actuellement visibles. On ne
  /// garde que ceux qui ont des puces à cocher (les tailles, la RAM…) : un
  /// oui/non n'a rien à décliner par couleur.
  List<Champ> get _champsVariante => widget.schema.champs
      .where((c) =>
          c.varOK &&
          _visible(c) &&
          (c.options != null || (c.dependDe != null && c.table != null)))
      .toList();

  String _digits(dynamic v) => (v ?? '').toString().replaceAll(RegExp(r'[^0-9]'), '');

  EtatFormulaire _construireEtat() {
    final attributs = <String, String>{};
    final manquants = <String>[];
    String? motifBloc;
    for (final c in widget.schema.champs) {
      if (!_visible(c)) continue;
      final s = _serialiser(c);
      if (s.isNotEmpty) attributs[c.cle] = s;
      if (c.req && s.isEmpty) manquants.add(c.libelle);
      if (c.bloque.contains(s)) motifBloc = c.motifBloc;
    }

    // Les couleurs et leurs variantes — seulement si le bloc est proposé, et
    // seulement pour les couleurs cochées (comme le filtre du site).
    if (_blocCouleurs) {
      final choisis = _couleursChoisies;
      if (choisis.isNotEmpty) {
        attributs['couleurs'] = choisis.map((c) => c.nom).join(', ');
      }
      final champsVar = _champsVariante;
      for (final coul in choisis) {
        final nom = coul.nom;
        // La photo liée : un index valide dans la galerie de l'annonce.
        final photo = (_vals[cleVariante(nom, 'photo')] ?? '').toString();
        if (RegExp(r'^\d+$').hasMatch(photo) &&
            int.parse(photo) < widget.images.length) {
          attributs[cleVariante(nom, 'photo')] = photo;
        }
        final prix = _digits(_vals[cleVariante(nom, 'prix')]);
        if (prix.isNotEmpty) attributs[cleVariante(nom, 'prix')] = prix;
        final note = (_vals[cleVariante(nom, 'note')] ?? '').toString().trim();
        if (note.isNotEmpty) attributs[cleVariante(nom, 'note')] = note;
        for (final cv in champsVar) {
          final cle = cleVariante(nom, cv.cle);
          final v = _vals[cle];
          final joint = (v is List) ? v.map((e) => e.toString()).join(', ') : '';
          if (joint.isNotEmpty) attributs[cle] = joint;
        }
      }
    }

    return EtatFormulaire(attributs, manquants, motifBloc);
  }

  /// Appelé par l'écran Publier quand une photo est retirée : on renumérote les
  /// couleurs qui pointaient dessus (celle-là perd sa photo, les suivantes
  /// glissent d'un cran), exactement comme le site.
  void photoRetiree(int index) {
    final cles = _vals.keys
        .where((k) => k.startsWith('var_') && k.endsWith('_photo'))
        .toList();
    for (final k in cles) {
      final v = _vals[k];
      if (v is! String || !RegExp(r'^\d+$').hasMatch(v)) continue;
      final n = int.parse(v);
      if (n == index) {
        _vals.remove(k);
      } else if (n > index) {
        _vals[k] = (n - 1).toString();
      }
    }
    if (mounted) setState(() {});
    _notifier();
  }

  void _notifier() => widget.onChange(_construireEtat());

  void _maj(VoidCallback f) {
    setState(f);
    _notifier();
  }

  @override
  Widget build(BuildContext context) {
    final visibles = widget.schema.champs.where(_visible).toList();
    final sansCouleur =
        !_blocCouleurs ? resoudreTexte(widget.schema.sansCouleur, _vals) : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final c in visibles) ...[
          _champ(c),
          const SizedBox(height: 14),
        ],
        if (_blocCouleurs) ...[
          _blocCouleursWidget(),
          const SizedBox(height: 14),
        ] else if (sansCouleur != null && sansCouleur.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(sansCouleur,
                style: const TextStyle(fontSize: 12, color: ChapColors.gray600)),
          ),
        ],
      ],
    );
  }

  Widget _champ(Champ c) {
    if (c.type == TypeChamp.bascule) return _bascule(c);
    final aOptions = c.options != null || (c.dependDe != null && c.table != null);
    if (aOptions) return _puces(c);
    return _saisie(c);
  }

  // --- Bascule (oui / non) ---------------------------------------------------
  Widget _bascule(Champ c) {
    final actif = _vals[c.cle] == true;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: ChapColors.line2),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.fromLTRB(14, 4, 8, 4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(c.libelle, style: _labelStyle),
                _aide(c),
              ],
            ),
          ),
          Switch(
            value: actif,
            activeThumbColor: ChapColors.orange,
            onChanged: (v) => _maj(() => _vals[c.cle] = v),
          ),
        ],
      ),
    );
  }

  // --- Puces (choix unique ou multiple) --------------------------------------
  Widget _puces(Champ c) {
    final base = c.optionsPour(_vals);
    final libreOuvert = _libre.contains(c.cle);
    final choisisMulti = (_vals[c.cle] is List)
        ? List<String>.from(_vals[c.cle] as List)
        : <String>[];
    final valUnique = (_vals[c.cle] ?? '').toString();

    final options = [...base, if (c.libre != null) c.libelleLibre];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          c.multi ? '${c.libelle} · plusieurs choix possibles' : c.libelle + (c.req ? ' *' : ''),
          style: _labelStyle,
        ),
        _aide(c),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            for (final o in options)
              ChoiceChip(
                label: Text(o),
                selected: o == c.libelleLibre
                    ? libreOuvert
                    : (c.multi ? choisisMulti.contains(o) : valUnique == o),
                onSelected: (_) => _basculerPuce(c, o),
                selectedColor: ChapColors.orange,
                labelStyle: TextStyle(
                  color: (o == c.libelleLibre ? libreOuvert : (c.multi ? choisisMulti.contains(o) : valUnique == o))
                      ? Colors.white
                      : ChapColors.gray900,
                  fontSize: 13,
                ),
                backgroundColor: ChapColors.cream,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: ChapColors.line2),
                ),
              ),
          ],
        ),
        if (!c.multi && libreOuvert) ...[
          const SizedBox(height: 8),
          TextField(
            controller: _controleur(c.cle),
            decoration:
                InputDecoration(hintText: c.ph ?? tr(context, 'form.precisez')),
            onChanged: (v) => _maj(() => _vals[c.cle] = v),
          ),
        ],
        if (c.alerte != null) _bandeauAlerte(c),
      ],
    );
  }

  void _basculerPuce(Champ c, String o) {
    if (o == c.libelleLibre) {
      _maj(() {
        if (_libre.contains(c.cle)) {
          _libre.remove(c.cle);
          _vals.remove(c.cle);
        } else {
          _libre.add(c.cle);
          _vals[c.cle] = _controleur(c.cle).text;
        }
      });
      return;
    }
    if (c.multi) {
      final l = (_vals[c.cle] is List) ? List<String>.from(_vals[c.cle] as List) : <String>[];
      _maj(() {
        l.contains(o) ? l.remove(o) : l.add(o);
        _vals[c.cle] = l;
      });
    } else {
      _maj(() {
        _libre.remove(c.cle);
        _vals[c.cle] = (_vals[c.cle] == o) ? '' : o;
      });
    }
  }

  // --- Saisie libre (texte / nombre) -----------------------------------------
  Widget _saisie(Champ c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _controleur(c.cle),
          keyboardType: c.type == TypeChamp.nombre ? TextInputType.number : TextInputType.text,
          inputFormatters:
              c.type == TypeChamp.nombre ? [FilteringTextInputFormatter.digitsOnly] : null,
          maxLength: 80,
          decoration: InputDecoration(
            labelText: c.libelle + (c.req ? ' *' : ''),
            hintText: c.ph,
            suffixText: c.unite,
            counterText: '',
          ),
          onChanged: (v) => _maj(() => _vals[c.cle] = v),
        ),
        _aide(c),
      ],
    );
  }

  // --- Aide sous le champ (rouge si elle commence par « ! ») ------------------
  Widget _aide(Champ c) {
    final brut = resoudreTexte(c.h, _vals);
    if (brut == null || brut.isEmpty) return const SizedBox.shrink();
    final rouge = brut.startsWith('!');
    final texte = rouge ? brut.substring(1) : brut;
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        texte,
        style: TextStyle(
          fontSize: 12,
          height: 1.3,
          color: rouge ? const Color(0xFFB91C1C) : ChapColors.gray600,
          fontWeight: rouge ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
    );
  }

  // --- Le bandeau de la fiche : la question qui rassure (ou non) l'acheteur ---
  Widget _bandeauAlerte(Champ c) {
    final valeur = (_vals[c.cle] ?? '').toString();
    if (valeur.isEmpty) return const SizedBox.shrink();
    final (vert, texte) = c.alerte!.evaluer(valeur);
    if (texte.isEmpty) return const SizedBox.shrink();
    final couleur = vert ? ChapColors.greenDark : const Color(0xFFB45309);
    final fond = vert ? const Color(0xFFEAF7EF) : const Color(0xFFFDF3E3);
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: fond,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: couleur.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(vert ? Icons.verified_outlined : Icons.info_outline, size: 18, color: couleur),
          const SizedBox(width: 8),
          Expanded(
            child: Text(texte, style: TextStyle(fontSize: 12.5, height: 1.35, color: couleur)),
          ),
        ],
      ),
    );
  }

  // --- Le bloc couleurs / variantes ------------------------------------------

  Widget _blocCouleursWidget() {
    final s = widget.schema;
    final lab =
        resoudreTexte(s.labCouleurs, _vals) ?? tr(context, 'form.couleursDispo');
    final aide = resoudreTexte(s.aideCouleurs, _vals);
    final aideChamp = resoudreTexte(s.aideCoulChamp, _vals);
    final choisis = _couleursChoisies;
    final nomsChoisis = choisis.map((c) => c.nom).toSet();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(lab, style: _labelStyle),
        if (aide != null && aide.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(aide,
                style: const TextStyle(
                    fontSize: 12, height: 1.3, color: ChapColors.gray600)),
          ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            for (final c in _palette)
              _chipCouleur(c, nomsChoisis.contains(c.nom)),
          ],
        ),
        if (choisis.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            tr(context, 'form.variantesAide'),
            style: const TextStyle(
                fontSize: 12, height: 1.35, color: ChapColors.gray600),
          ),
          const SizedBox(height: 8),
          for (final c in choisis) ...[
            _carteVariante(c),
            const SizedBox(height: 10),
          ],
          if (_champsVariante.isNotEmpty && aideChamp != null && aideChamp.isNotEmpty)
            Text(aideChamp,
                style: const TextStyle(
                    fontSize: 12, height: 1.35, color: ChapColors.gray600)),
        ],
      ],
    );
  }

  Widget _pastille(Couleur c, double taille) => Container(
        width: taille,
        height: taille,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: c.couleur,
          gradient: c.degrade,
          border: c.clair
              ? Border.all(color: Colors.black.withValues(alpha: 0.2))
              : null,
        ),
      );

  Widget _chipCouleur(Couleur c, bool actif) {
    return FilterChip(
      avatar: _pastille(c, 14),
      label: Text(c.nom),
      selected: actif,
      showCheckmark: false,
      onSelected: (_) => _basculerCouleur(c.nom),
      selectedColor: ChapColors.orange,
      labelStyle: TextStyle(
          color: actif ? Colors.white : ChapColors.gray900, fontSize: 13),
      backgroundColor: ChapColors.cream,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: ChapColors.line2),
      ),
    );
  }

  void _basculerCouleur(String nom) {
    final noms = _couleursChoisies.map((c) => c.nom).toList();
    _maj(() {
      if (noms.contains(nom)) {
        noms.remove(nom);
        // Décochée : ses détails n'ont plus de raison d'être (sinon un vieux
        // prix réapparaîtrait si on la recoche plus tard).
        _vals.remove(cleVariante(nom, 'photo'));
        _vals.remove(cleVariante(nom, 'prix'));
        _vals.remove(cleVariante(nom, 'note'));
        _ctrl[cleVariante(nom, 'prix')]?.clear();
        _ctrl[cleVariante(nom, 'note')]?.clear();
        for (final cv in _champsVariante) {
          _vals.remove(cleVariante(nom, cv.cle));
        }
      } else {
        noms.add(nom);
      }
      _vals['couleurs'] = noms;
    });
  }

  Widget _carteVariante(Couleur c) {
    final nom = c.nom;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ChapColors.cream100.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _pastille(c, 16),
              const SizedBox(width: 8),
              Text(nom,
                  style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold,
                      color: ChapColors.gray900)),
            ],
          ),
          const SizedBox(height: 10),
          _photosVariante(nom),
          const SizedBox(height: 10),
          TextField(
            controller: _controleur(cleVariante(nom, 'prix')),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            maxLength: 12,
            decoration: InputDecoration(
              hintText: tr(context, 'form.prixCouleur'),
              suffixText: 'FCFA',
              counterText: '',
              isDense: true,
            ),
            onChanged: (v) => _maj(() => _vals[cleVariante(nom, 'prix')] = v),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _controleur(cleVariante(nom, 'note')),
            maxLength: 100,
            decoration: InputDecoration(
              hintText: tr(context, 'form.detailsEx'),
              counterText: '',
              isDense: true,
            ),
            onChanged: (v) => _maj(() => _vals[cleVariante(nom, 'note')] = v),
          ),
          for (final cv in _champsVariante) _optionsVariante(nom, cv),
        ],
      ),
    );
  }

  /// Lier une des photos de l'annonce à cette couleur.
  Widget _photosVariante(String nom) {
    final cle = cleVariante(nom, 'photo');
    final brut = (_vals[cle] ?? '').toString();
    final choisi = RegExp(r'^\d+$').hasMatch(brut) ? int.parse(brut) : null;
    if (widget.images.isEmpty) {
      return Row(
        children: [
          const Icon(Icons.image_not_supported_outlined,
              size: 15, color: ChapColors.gray600),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              tr(context, 'form.ajoutezPhotos'),
              style: const TextStyle(
                  fontSize: 11.5, color: ChapColors.gray600),
            ),
          ),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (int i = 0; i < widget.images.length; i++)
              GestureDetector(
                onTap: () => _maj(() =>
                    _vals[cle] = (choisi == i) ? '' : i.toString()),
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(widget.images[i],
                          width: 48, height: 48, fit: BoxFit.cover),
                    ),
                    if (choisi == i)
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            color: ChapColors.orange.withValues(alpha: 0.35),
                            border: Border.all(color: ChapColors.orange, width: 2),
                          ),
                          child: const Icon(Icons.check,
                              size: 18, color: Colors.white),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          choisi != null
              ? tr(context, 'form.photoLiee')
                  .replaceFirst('{n}', '${choisi + 1}')
              : tr(context, 'form.touchezPhoto'),
          style: const TextStyle(fontSize: 11.5, color: ChapColors.gray600),
        ),
      ],
    );
  }

  /// Un champ déclinable (les tailles restantes) pour CETTE couleur.
  Widget _optionsVariante(String nom, Champ cv) {
    final cle = cleVariante(nom, cv.cle);
    final choisis = (_vals[cle] is List)
        ? List<String>.from(_vals[cle] as List)
        : <String>[];
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${cv.lVar ?? cv.libelle} · $nom',
              style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                  color: ChapColors.gray600)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final o in cv.optionsPour(_vals))
                _puceVariante(o, choisis.contains(o), () {
                  _maj(() {
                    choisis.contains(o) ? choisis.remove(o) : choisis.add(o);
                    _vals[cle] = choisis;
                  });
                }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _puceVariante(String texte, bool actif, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: actif ? ChapColors.orange : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
              color: actif ? ChapColors.orange : ChapColors.line2),
        ),
        child: Text(texte,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: actif ? Colors.white : ChapColors.gray700)),
      ),
    );
  }

  static const _labelStyle =
      TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: ChapColors.gray700);
}
