import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../api/offres.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import '../widgets/carte_offre.dart';
import 'offre_screen.dart';

/// « Mes offres d'emploi » — la console de la structure (06/09/2026).
///
/// Elle publie un poste, dit comment on y postule (son lien, ou un formulaire
/// qu'elle dessine question par question), ferme, rouvre, supprime, et ouvre
/// les candidatures reçues. Les abonnés sont prévenus à chaque publication :
/// c'est le serveur qui le dit, en retour.
class OffresProScreen extends StatefulWidget {
  /// Aperçu (tests) : la liste injectée, aucun appel réseau.
  final List<OffreEmploi>? apercu;
  const OffresProScreen({super.key, this.apercu});

  @override
  State<OffresProScreen> createState() => _OffresProScreenState();
}

class _OffresProScreenState extends State<OffresProScreen> {
  List<OffreEmploi>? _offres;
  String? _occupe;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _offres = widget.apercu;
    } else {
      _charger();
    }
  }

  Future<void> _charger() async {
    try {
      final o = await OffresApi.miennes();
      if (mounted) setState(() => _offres = o);
    } catch (_) {
      if (mounted) setState(() => _offres = const []);
    }
  }

  String _p(String cle, Map<String, String> params) {
    var s = tr(context, cle);
    params.forEach((k, v) => s = s.replaceAll('{$k}', v));
    return s;
  }

  void _info(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _editer(OffreEmploi? o) async {
    final ok = await Navigator.of(context).push<bool>(
        MaterialPageRoute(builder: (_) => OffreFormScreen(offre: o)));
    if (ok == true) _charger();
  }

  Future<void> _basculer(OffreEmploi o) async {
    setState(() => _occupe = o.id);
    try {
      await OffresApi.modifier(
          o.id, {'statut': o.statut == 'ouverte' ? 'fermee' : 'ouverte'});
      if (!mounted) return;
      _info(tr(context, o.statut == 'ouverte' ? 'offres.fermeeSnack' : 'offres.rouverte'));
      await _charger();
    } on ApiException catch (e) {
      if (mounted) _info(e.message);
    } finally {
      if (mounted) setState(() => _occupe = null);
    }
  }

  Future<void> _supprimer(OffreEmploi o) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: Text(tr(context, 'action.supprimer')),
        content: Text(_p('offres.supprimerCorps', {'t': o.titre})),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(tr(context, 'action.annuler'))),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(tr(context, 'action.supprimer'),
                  style: const TextStyle(color: Color(0xFFC43025)))),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _occupe = o.id);
    try {
      await OffresApi.supprimer(o.id);
      if (!mounted) return;
      _info(tr(context, 'offres.supprimee'));
      await _charger();
    } on ApiException catch (e) {
      if (mounted) _info(e.message);
    } finally {
      if (mounted) setState(() => _occupe = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final offres = _offres;
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'offres.titre'))),
      body: RefreshIndicator(
        color: ChapColors.orange,
        onRefresh: _charger,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: ChapColors.cream100,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFF3D9B8)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('💼 ${tr(context, 'pro.tuile.emplois')}',
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: ChapColors.gray900)),
                  const SizedBox(height: 4),
                  Text(tr(context, 'offres.intro'),
                      style: const TextStyle(
                          fontSize: 12.5, height: 1.45, color: ChapColors.gray700)),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 46,
                    child: ElevatedButton.icon(
                      key: const ValueKey('offres-publier'),
                      onPressed: () => _editer(null),
                      icon: const Icon(Icons.add, size: 18),
                      label: Text(tr(context, 'offres.publier')),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (offres == null)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 30),
                child: Center(
                    child: CircularProgressIndicator(color: ChapColors.orange)),
              )
            else if (offres.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 30),
                child: Text(tr(context, 'offres.aucune'),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13.5, color: ChapColors.gray600)),
              )
            else
              for (final o in offres)
                CarteOffre(
                  offre: o,
                  mienne: true,
                  onTap: () => _ouvrir(o),
                  actions: [
                    TextButton.icon(
                      onPressed: () => _ouvrir(o),
                      icon: const Icon(Icons.people_outline, size: 16),
                      label: Text(_p('offres.candidaturesN',
                          {'n': '${o.candidatures ?? 0}'})),
                    ),
                    TextButton.icon(
                      onPressed: () => _editer(o),
                      icon: const Icon(Icons.edit_outlined, size: 16),
                      label: Text(tr(context, 'action.modifier')),
                    ),
                    TextButton.icon(
                      onPressed: _occupe == o.id ? null : () => _basculer(o),
                      icon: Icon(
                          o.statut == 'ouverte' ? Icons.lock_outline : Icons.lock_open,
                          size: 16),
                      label: Text(tr(
                          context, o.statut == 'ouverte' ? 'offres.fermer' : 'offres.rouvrir')),
                    ),
                    TextButton.icon(
                      onPressed: _occupe == o.id ? null : () => _supprimer(o),
                      icon: const Icon(Icons.delete_outline, size: 16),
                      label: Text(tr(context, 'action.supprimer')),
                      style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFFC43025)),
                    ),
                  ],
                ),
          ],
        ),
      ),
    );
  }

  Future<void> _ouvrir(OffreEmploi o) async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => OffreScreen(offreId: o.id)));
    if (mounted) _charger();
  }
}

/// Une question en cours d'écriture dans le constructeur.
class _Question {
  String? id;
  final TextEditingController label;
  String type;
  bool requis;
  final TextEditingController options;

  _Question({this.id, String label = '', this.type = 'texte', this.requis = false, String options = ''})
      : label = TextEditingController(text: label),
        options = TextEditingController(text: options);

  void dispose() {
    label.dispose();
    options.dispose();
  }
}

/// Les contrats proposés d'un geste ; le texte reste libre (40 caractères).
const contratsProposes = [
  'CDI', 'CDD', 'Stage', 'Alternance', 'Temps partiel', 'Journalier', 'Freelance', 'Bénévolat',
];

/// Les six types de question, dans l'ordre du menu.
const typesDeChamp = ['texte', 'long', 'email', 'tel', 'choix', 'ouinon'];

/// Le poste, la voie de candidature, et le constructeur de questions.
class OffreFormScreen extends StatefulWidget {
  /// L'offre à modifier — null pour en publier une nouvelle.
  final OffreEmploi? offre;
  const OffreFormScreen({super.key, this.offre});

  @override
  State<OffreFormScreen> createState() => _OffreFormScreenState();
}

class _OffreFormScreenState extends State<OffreFormScreen> {
  late final TextEditingController _titre =
      TextEditingController(text: widget.offre?.titre ?? '');
  late final TextEditingController _lieu =
      TextEditingController(text: widget.offre?.lieu ?? '');
  late final TextEditingController _salaire =
      TextEditingController(text: widget.offre?.salaire ?? '');
  late final TextEditingController _description =
      TextEditingController(text: widget.offre?.description ?? '');
  late final TextEditingController _lien =
      TextEditingController(text: widget.offre?.lien ?? '');
  late String _contrat = widget.offre?.contrat ?? '';

  /// formulaire | lien | les-deux
  late String _voie = () {
    final o = widget.offre;
    if (o == null) return 'formulaire';
    if (o.lien != null && o.formulaire.isNotEmpty) return 'les-deux';
    return o.lien != null ? 'lien' : 'formulaire';
  }();
  late final List<_Question> _questions = () {
    final o = widget.offre;
    final source = (o != null && o.formulaire.isNotEmpty)
        ? o.formulaire
        : const [
            ChampFormulaire(id: 'nom', label: 'Votre nom complet', type: 'texte', requis: true),
            ChampFormulaire(id: 'tel', label: 'Votre numéro de téléphone', type: 'tel', requis: true),
            ChampFormulaire(id: 'message', label: 'Présentez-vous en quelques lignes', type: 'long', requis: true),
          ];
    return [
      for (final c in source)
        _Question(id: c.id, label: c.label, type: c.type, requis: c.requis, options: c.options.join('\n')),
    ];
  }();
  bool _envoi = false;

  bool get _avecFormulaire => _voie != 'lien';
  bool get _avecLien => _voie != 'formulaire';

  @override
  void dispose() {
    _titre.dispose();
    _lieu.dispose();
    _salaire.dispose();
    _description.dispose();
    _lien.dispose();
    for (final q in _questions) {
      q.dispose();
    }
    super.dispose();
  }

  String _p(String cle, Map<String, String> params) {
    var s = tr(context, cle);
    params.forEach((k, v) => s = s.replaceAll('{$k}', v));
    return s;
  }

  void _info(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _enregistrer() async {
    if (_titre.text.trim().length < 4) {
      _info(tr(context, 'offres.e.titre'));
      return;
    }
    if (_description.text.trim().length < 20) {
      _info(tr(context, 'offres.e.description'));
      return;
    }
    final lien = _lien.text.trim();
    if (_avecLien &&
        !RegExp(r'^https://[a-z0-9.-]+\.[a-z]{2,}(/|$)', caseSensitive: false).hasMatch(lien)) {
      _info(tr(context, 'offres.e.lien'));
      return;
    }
    // Chaque question garde son identifiant (c'est lui qui relie une réponse
    // à sa question) ; une question nouvelle en reçoit un qui n'existe pas.
    final pris = {for (final q in _questions) if (q.id != null) q.id!};
    var n = 0;
    final formulaire = <Map<String, dynamic>>[];
    if (_avecFormulaire) {
      for (final q in _questions) {
        var id = q.id;
        if (id == null) {
          do {
            n++;
            id = 'q$n';
          } while (pris.contains(id));
          pris.add(id);
        }
        final label = q.label.text.trim();
        if (label.isEmpty) {
          _info(tr(context, 'offres.e.question'));
          return;
        }
        final options = q.options.text
            .split('\n')
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty)
            .toList();
        if (q.type == 'choix' && options.length < 2) {
          _info(_p('offres.e.options', {'q': label}));
          return;
        }
        formulaire.add(ChampFormulaire(
                id: id, label: label, type: q.type, requis: q.requis, options: options)
            .toJson());
      }
      if (formulaire.isEmpty) {
        _info(tr(context, 'offres.e.aucune'));
        return;
      }
    }
    setState(() => _envoi = true);
    try {
      final corps = <String, dynamic>{
        'titre': _titre.text.trim(),
        'description': _description.text.trim(),
        'contrat': _contrat,
        'lieu': _lieu.text.trim(),
        'salaire': _salaire.text.trim(),
        'lien': _avecLien ? lien : '',
        'formulaire': formulaire,
      };
      final o = widget.offre;
      if (o != null) {
        await OffresApi.modifier(o.id, corps);
        if (!mounted) return;
        _info(tr(context, 'offres.majee'));
      } else {
        final r = await OffresApi.creer(corps);
        if (!mounted) return;
        _info(r.abonnesPrevenus > 0
            ? _p('offres.publieeN', {'n': '${r.abonnesPrevenus}'})
            : tr(context, 'offres.publiee'));
      }
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: ChapColors.cream,
          title: Text(tr(context, 'pro.tuile.emplois')),
          content: Text(e.message),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(tr(context, 'action.compris'))),
          ],
        ),
      );
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final modification = widget.offre != null;
    return Scaffold(
      appBar: AppBar(
          title: Text(tr(context,
              modification ? 'offres.f.modifierTitre' : 'offres.publier'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          _carte([
            _titreCarte(tr(context, 'emploi.poste')),
            const SizedBox(height: 10),
            _etiquette('${tr(context, 'offres.f.titre')} *'),
            TextField(
              key: const ValueKey('offre-titre'),
              controller: _titre,
              maxLength: 120,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                  counterText: '',
                  isDense: true,
                  hintText: tr(context, 'offres.f.titrePh')),
            ),
            const SizedBox(height: 12),
            _etiquette(tr(context, 'offres.f.contrat')),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                for (final c in contratsProposes)
                  ChoiceChip(
                    label: Text(c),
                    selected: _contrat == c,
                    showCheckmark: false,
                    selectedColor: ChapColors.orange,
                    backgroundColor: ChapColors.cream,
                    labelStyle: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: _contrat == c ? Colors.white : ChapColors.gray700),
                    onSelected: (_) => setState(() => _contrat = _contrat == c ? '' : c),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _etiquette(tr(context, 'offres.f.lieu')),
                      TextField(
                        controller: _lieu,
                        maxLength: 80,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(
                            counterText: '', isDense: true, hintText: 'Cocody, Abidjan'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _etiquette(tr(context, 'offres.f.salaire')),
                      TextField(
                        controller: _salaire,
                        maxLength: 80,
                        decoration: const InputDecoration(
                            counterText: '', isDense: true, hintText: '120 000 FCFA / mois'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _etiquette('${tr(context, 'offres.f.description')} *'),
            TextField(
              key: const ValueKey('offre-description'),
              controller: _description,
              maxLength: 4000,
              minLines: 5,
              maxLines: 12,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                  counterText: '',
                  isDense: true,
                  hintText: tr(context, 'offres.f.descriptionPh')),
            ),
          ]),
          const SizedBox(height: 12),
          _carte([
            _titreCarte(tr(context, 'offres.f.voie')),
            const SizedBox(height: 8),
            _voieChoix('formulaire', 'offres.f.voieFormulaire', 'offres.f.voieFormulaireSous'),
            _voieChoix('lien', 'offres.f.voieLien', 'offres.f.voieLienSous'),
            _voieChoix('les-deux', 'offres.f.voieDeux', 'offres.f.voieDeuxSous'),
            if (_avecLien) ...[
              const SizedBox(height: 8),
              _etiquette(tr(context, 'offres.f.lien')),
              TextField(
                key: const ValueKey('offre-lien'),
                controller: _lien,
                maxLength: 300,
                keyboardType: TextInputType.url,
                autocorrect: false,
                decoration: const InputDecoration(
                    counterText: '', isDense: true, hintText: 'https://forms.gle/…'),
              ),
            ],
          ]),
          if (_avecFormulaire) ...[
            const SizedBox(height: 12),
            _carte([
              Row(
                children: [
                  Expanded(child: _titreCarte(tr(context, 'offres.f.questions'))),
                  Text('${_questions.length}/12',
                      style: const TextStyle(fontSize: 12, color: ChapColors.gray500)),
                ],
              ),
              const SizedBox(height: 4),
              Text(tr(context, 'offres.f.questionsAide'),
                  style: const TextStyle(
                      fontSize: 12, height: 1.4, color: ChapColors.gray600)),
              const SizedBox(height: 10),
              for (var i = 0; i < _questions.length; i++) _question(i),
              SizedBox(
                height: 46,
                child: OutlinedButton.icon(
                  key: const ValueKey('question-ajouter'),
                  onPressed: _questions.length >= 12
                      ? null
                      : () => setState(() => _questions.add(_Question())),
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(tr(context, 'offres.f.ajouter')),
                ),
              ),
            ]),
          ],
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              key: const ValueKey('offre-publier'),
              onPressed: _envoi ? null : _enregistrer,
              icon: _envoi
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Icon(modification ? Icons.check : Icons.send, size: 18),
              label: Text(tr(context,
                  modification ? 'action.enregistrer' : 'offres.f.publier')),
            ),
          ),
          if (!modification) ...[
            const SizedBox(height: 8),
            Text(tr(context, 'offres.f.note'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 11, height: 1.4, color: ChapColors.gray500)),
          ],
        ],
      ),
    );
  }

  Widget _voieChoix(String v, String cleTitre, String cleSous) {
    final actif = _voie == v;
    return InkWell(
      key: ValueKey('voie-$v'),
      onTap: () => setState(() => _voie = v),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: actif ? const Color(0xFFFFEAD1) : ChapColors.cream,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: actif ? ChapColors.orange : ChapColors.line2),
        ),
        child: Row(
          children: [
            Icon(actif ? Icons.radio_button_checked : Icons.radio_button_off,
                size: 20, color: actif ? ChapColors.orange : ChapColors.gray500),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(tr(context, cleTitre),
                      style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: ChapColors.gray900)),
                  Text(tr(context, cleSous),
                      style: const TextStyle(fontSize: 11.5, color: ChapColors.gray600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _question(int i) {
    final q = _questions[i];
    return Container(
      key: ValueKey('question-$i'),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: ChapColors.cream100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.line),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text('${i + 1}.',
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: ChapColors.gray500)),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: q.label,
                  maxLength: 80,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                      counterText: '',
                      isDense: true,
                      hintText: tr(context, 'offres.f.questionPh')),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButton<String>(
                        value: q.type,
                        isExpanded: true,
                        isDense: true,
                        style: const TextStyle(fontSize: 12.5, color: ChapColors.gray900),
                        items: [
                          for (final t in typesDeChamp)
                            DropdownMenuItem(value: t, child: Text(tr(context, 'offres.t.$t'))),
                        ],
                        onChanged: (v) => setState(() => q.type = v ?? 'texte'),
                      ),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: () => setState(() => q.requis = !q.requis),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Checkbox(
                            value: q.requis,
                            activeColor: ChapColors.orange,
                            visualDensity: VisualDensity.compact,
                            onChanged: (v) => setState(() => q.requis = v ?? false),
                          ),
                          Text(tr(context, 'offres.f.obligatoire'),
                              style: const TextStyle(fontSize: 12, color: ChapColors.gray700)),
                        ],
                      ),
                    ),
                  ],
                ),
                if (q.type == 'choix')
                  TextField(
                    controller: q.options,
                    minLines: 2,
                    maxLines: 6,
                    keyboardType: TextInputType.multiline,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                        isDense: true,
                        hintText:
                            '${tr(context, 'offres.f.optionsPh')} :\nMoins de 2 ans\n2 à 5 ans\nPlus de 5 ans'),
                  ),
              ],
            ),
          ),
          Column(
            children: [
              IconButton(
                onPressed: i == 0 ? null : () => _deplacer(i, -1),
                icon: const Icon(Icons.arrow_upward, size: 16),
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                onPressed: i == _questions.length - 1 ? null : () => _deplacer(i, 1),
                icon: const Icon(Icons.arrow_downward, size: 16),
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                onPressed: () => setState(() => _questions.removeAt(i).dispose()),
                icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFC43025)),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _deplacer(int i, int d) {
    final j = i + d;
    if (j < 0 || j >= _questions.length) return;
    setState(() {
      final q = _questions.removeAt(i);
      _questions.insert(j, q);
    });
  }

  Widget _etiquette(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: ChapColors.gray500)),
      );

  Widget _titreCarte(String t) => Text(t,
      style: const TextStyle(
          fontSize: 15, fontWeight: FontWeight.w800, color: ChapColors.gray900));

  Widget _carte(List<Widget> enfants) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: ChapColors.line),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: enfants),
      );
}
