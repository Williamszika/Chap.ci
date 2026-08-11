import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/formulaires/schema.dart';
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
  const FormulaireDynamique({super.key, required this.schema, required this.onChange});

  @override
  State<FormulaireDynamique> createState() => _FormulaireDynamiqueState();
}

class _FormulaireDynamiqueState extends State<FormulaireDynamique> {
  // Représentation interne : choix unique/texte = String, multi = List<String>,
  // bascule = bool. La sérialisation vers le serveur se fait dans _etat().
  final Vals _vals = {};
  // Les champs dont la saisie libre (« Autre ») est ouverte.
  final Set<String> _libre = {};
  final Map<String, TextEditingController> _ctrl = {};

  @override
  void initState() {
    super.initState();
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
  void didUpdateWidget(covariant FormulaireDynamique old) {
    super.didUpdateWidget(old);
    // Changement de sous-catégorie : on repart d'un formulaire vierge.
    if (old.schema != widget.schema) {
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
    return EtatFormulaire(attributs, manquants, motifBloc);
  }

  void _notifier() => widget.onChange(_construireEtat());

  void _maj(VoidCallback f) {
    setState(f);
    _notifier();
  }

  @override
  Widget build(BuildContext context) {
    final visibles = widget.schema.champs.where(_visible).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final c in visibles) ...[
          _champ(c),
          const SizedBox(height: 14),
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
            decoration: InputDecoration(hintText: c.ph ?? 'Précisez'),
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

  static const _labelStyle =
      TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: ChapColors.gray700);
}
