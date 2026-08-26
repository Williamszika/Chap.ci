import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../i18n/categories_i18n.dart';
import '../i18n/formats_i18n.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import 'publier_screen.dart';

/// Devenir professionnel — le dossier « boutique ».
///
/// Une « boutique » n'est pas réservée aux commerces : une école vend ses
/// formations, un employeur publie ses offres, une association donne. Le
/// formulaire demande donc d'abord le TYPE d'organisation, et le justificatif
/// s'adapte (RCCM pour un commerce, récépissé pour une association, agrément
/// pour une école). La validation est humaine, sous 24-48 h.
///
/// États : jamais demandé → formulaire ; en attente → patience ; refusé →
/// motif + formulaire pour redéposer ; approuvé → félicitations.
class DevenirProScreen extends StatefulWidget {
  const DevenirProScreen({super.key});
  @override
  State<DevenirProScreen> createState() => _DevenirProScreenState();
}

class _DevenirProScreenState extends State<DevenirProScreen> {
  final _nom = TextEditingController();
  final _numero = TextEditingController();
  final _tel = TextEditingController();
  String _type = 'boutique';
  String? _secteur;
  String _statut = '';
  String? _motif;
  String? _proNom;
  bool _chargement = true;
  bool _envoi = false;
  String? _erreur;

  /// Les dix types d'organisation, calqués sur les 16 catégories du site.
  /// Chaque type porte ses catégories : elles font le sous-titre de la carte
  /// (traduites) et pré-remplissent le secteur principal.
  static const _types = [
    'boutique', 'vehicules', 'immobilier', 'services', 'formation',
    'emploi', 'voyage', 'agro', 'sante', 'association',
  ];
  static const _emojis = {
    'boutique': '🏪', 'vehicules': '🚗', 'immobilier': '🏠',
    'services': '🛠️', 'formation': '🎓', 'emploi': '🏢',
    'voyage': '✈️', 'agro': '🌾', 'sante': '💊', 'association': '❤️',
  };
  /// Les secteurs proposés PAR TYPE — chaque métier voit les siens, jamais la
  /// liste générique des 16 catégories. Les valeurs sont les noms français
  /// canoniques (sous-catégories réelles du site quand elles existent, secteurs
  /// métier sinon) : c'est ce qui s'enregistre avec le dossier, l'affichage se
  /// traduit via secteurProTr.
  static const Map<String, List<String>> _secteursDuType = {
    'boutique': [
      'Électronique', 'Mode & Beauté', 'Maison & Meubles',
      'École & Fournitures', 'Bébé & Enfant', 'Loisirs & Sport', 'Matériel Pro',
    ],
    'vehicules': [
      'Voitures', 'Motos & Scooters', 'Camions & Utilitaires',
      'Engins & Agricoles', 'Pièces & Accessoires', 'Bateaux', 'Location',
    ],
    'immobilier': [
      'Vente immobilière', 'Location & gestion', 'Terrains',
      'Résidences meublées', 'Promotion immobilière',
    ],
    'services': [
      'BTP & Rénovation', 'Événementiel', 'Transport & Déménagement',
      'Informatique & Digital', 'Couture & Artisanat', 'Réparation & Dépannage',
    ],
    'formation': [
      'École privée', 'Soutien scolaire', 'Formation professionnelle',
      'Langues', 'Cours & Formation', 'Informatique & Digital',
    ],
    'emploi': [
      'Entreprise qui recrute', 'Cabinet de recrutement', 'Intérim & placement',
      'Emploi maison', 'Freelance',
    ],
    'voyage': [
      'Billets d’avion', 'Visas & formalités', 'Études à l’étranger',
      'Travail à l’étranger', 'Séjours & circuits',
    ],
    'agro': [
      'Produits vivriers', 'Fruits & Légumes', 'Céréales & Tubercules',
      'Cacao & Café', 'Poisson & Produits de mer', 'Volaille',
      'Bétail & Élevage', 'Semences & Intrants',
    ],
    'sante': [
      'Compléments & Tisanes', 'Soins & Hygiène', 'Matériel médical de confort',
      'Optique & Audition', 'Bien-être & Massage', 'Nutrition sportive',
    ],
    'association': [
      'Aide sociale & dons', 'Éducation', 'Santé communautaire',
      'Environnement', 'Religieux & communautaire',
    ],
  };

  static const Map<String, List<String>> _categoriesDuType = {
    'boutique': ['electronique', 'mode', 'maison', 'scolaire', 'bebe', 'loisirs', 'materiel-pro'],
    'vehicules': ['vehicules'],
    'immobilier': ['immobilier'],
    'services': ['services'],
    'formation': ['services', 'scolaire'],
    'emploi': ['emploi'],
    'voyage': ['voyage'],
    'agro': ['alimentation', 'animaux'],
    'sante': ['sante'],
    'association': ['a-donner'],
  };

  @override
  void initState() {
    super.initState();
    _charger();
  }

  @override
  void dispose() {
    _nom.dispose();
    _numero.dispose();
    _tel.dispose();
    super.dispose();
  }

  /// Les chiffres de l'espace professionnel (`GET /pro/tableau`), chargés
  /// seulement quand le dossier est approuvé. Best-effort : sans eux,
  /// l'en-tête s'affiche quand même.
  Map<String, dynamic>? _tableau;

  Future<void> _charger() async {
    try {
      final d = await ApiClient.instance.get('/pro/statut');
      if (d is Map && mounted) {
        setState(() {
          _statut = (d['status'] as String?) ?? '';
          _motif = d['motif'] as String?;
          _proNom = d['nom'] as String?;
          // Pré-remplir le formulaire avec le dossier précédent (refus → correction).
          if ((d['nom'] as String?)?.isNotEmpty ?? false) _nom.text = d['nom'] as String;
          if ((d['numero'] as String?)?.isNotEmpty ?? false) _numero.text = d['numero'] as String;
          if (d['type'] == 'commerce') {
            _type = 'boutique'; // ancien nom du type, première version
          } else if (_types.contains(d['type'])) {
            _type = d['type'] as String;
          }
          // Ne garder le secteur du dossier que s'il existe dans la liste du
          // type (les tout premiers dossiers stockaient un id de catégorie).
          final sec = d['secteur'] as String?;
          _secteur = (sec != null &&
                  (_secteursDuType[_type]?.contains(sec) ?? false))
              ? sec
              : null;
        });
      }
    } catch (_) {/* hors ligne : le formulaire reste utilisable */}
    if (mounted) setState(() => _chargement = false);
    if (_statut == 'approuve') _chargerTableau();
  }

  /// Le libellé du champ « numéro officiel » suit le type d'organisation.
  String _labelNumero() {
    switch (_type) {
      case 'association':
        return tr(context, 'pro.numero.recepisse');
      // Métiers réglementés : l'agrément (tourisme, enseignement, santé)
      // vaut mieux qu'un simple RCCM — mais le RCCM reste accepté.
      case 'formation':
      case 'voyage':
      case 'sante':
        return tr(context, 'pro.numero.agrement');
      default:
        return tr(context, 'pro.numero.rccm');
    }
  }

  Future<void> _chargerTableau() async {
    try {
      final t = await ApiClient.instance.get('/pro/tableau');
      if (t is Map && mounted) {
        setState(() => _tableau = Map<String, dynamic>.from(t));
      }
    } catch (_) {/* les chiffres sont un plus, pas une condition */}
  }

  Future<void> _envoyer() async {
    if (_nom.text.trim().length < 2) {
      setState(() => _erreur = tr(context, 'insc.indiquezNom'));
      return;
    }
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      await ApiClient.instance.post('/pro/demande', {
        'type': _type,
        'nom': _nom.text.trim(),
        'numero': _numero.text.trim(),
        'secteur': _secteur ?? '',
        'tel': _tel.text.trim(),
      });
      if (mounted) setState(() => _statut = 'en_attente');
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr(context, 'pro.titre'))),
      body: _chargement
          ? const Center(
              child: CircularProgressIndicator(color: ChapColors.orange))
          : _statut == 'approuve'
              ? _vueApprouve()
              : _statut == 'en_attente'
                  ? _vueAttente()
                  : _vueFormulaire(),
    );
  }

  Widget _vueAttente() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.hourglass_top_rounded,
                size: 52, color: ChapColors.orange),
            const SizedBox(height: 16),
            Text(tr(context, 'pro.enAttente'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(tr(context, 'pro.envoyeeCorps'),
                textAlign: TextAlign.center,
                style:
                    const TextStyle(color: ChapColors.gray600, height: 1.45)),
          ],
        ),
      ),
    );
  }

  Widget _vueApprouve() {
    final pro = (_tableau?['pro'] as Map?) ?? const {};
    final stats = (_tableau?['stats'] as Map?) ?? const {};
    final depuis = pro['depuis'];
    final note = stats['note'];
    final avis = (stats['avis'] as int?) ?? 0;
    final secteur = (pro['secteur'] as String?) ?? '';
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        // L'en-tête de marque : le badge, le nom commercial, l'ancienneté.
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [ChapColors.orange, Color(0xFFD95F00)],
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('💼 ${tr(context, 'pro.badge')}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5)),
              ),
              const SizedBox(height: 12),
              Text(_proNom ?? tr(context, 'pro.approuve'),
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      height: 1.15)),
              const SizedBox(height: 4),
              Text(
                tr(context, 'pro.type.$_type') +
                    (secteur.isNotEmpty
                        ? ' · ${secteurProTr(context, secteur)}'
                        : ''),
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 13.5),
              ),
              if (depuis is int && depuis > 0) ...[
                const SizedBox(height: 3),
                Text(
                  '${tr(context, 'pro.tab.depuis')} ${tempsEcouleTr(context, depuis)}',
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 11.5),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        // Les chiffres du compte, d'un coup d'œil.
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
          children: [
            _chiffre(Icons.storefront_outlined,
                '${stats['annoncesActives'] ?? 0}', tr(context, 'pro.tab.enLigne')),
            _chiffre(Icons.visibility_outlined, '${stats['vues'] ?? 0}',
                tr(context, 'pro.tab.vues')),
            _chiffre(Icons.favorite_border, '${stats['favoris'] ?? 0}',
                tr(context, 'pro.tab.favoris')),
            _chiffre(Icons.chat_bubble_outline,
                '${stats['conversations'] ?? 0}',
                tr(context, 'pro.tab.conversations')),
            _chiffre(
                Icons.star_border,
                note != null ? '$note ★' : '—',
                avis > 0
                    ? '$avis ${tr(context, 'pro.tab.avis')}'
                    : tr(context, 'pro.tab.aucunAvis')),
            _chiffre(Icons.inventory_2_outlined,
                '${stats['annoncesTotal'] ?? 0}', tr(context, 'pro.tab.total')),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => const PublierScreen())),
            icon: const Icon(Icons.add),
            label: Text(tr(context, 'pro.tab.publier')),
            style: ElevatedButton.styleFrom(
                backgroundColor: ChapColors.orange,
                foregroundColor: Colors.white),
          ),
        ),
        const SizedBox(height: 10),
        Text(tr(context, 'pro.tab.note'),
            style: const TextStyle(
                fontSize: 12, color: ChapColors.gray600, height: 1.4)),
      ],
    );
  }

  Widget _chiffre(IconData icone, String valeur, String libelle) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icone, size: 18, color: ChapColors.orange),
          const SizedBox(height: 6),
          Text(valeur,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w800)),
          Text(libelle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 11, color: ChapColors.gray600)),
        ],
      ),
    );
  }

  Widget _vueFormulaire() {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: [
            Text(tr(context, 'pro.intro'),
                style:
                    const TextStyle(color: ChapColors.gray600, height: 1.5)),
            if (_statut == 'refuse' && (_motif?.isNotEmpty ?? false)) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF4E0),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF3D9A6)),
                ),
                child: Text(
                    '${tr(context, 'pro.motifRefus')} : $_motif',
                    style: const TextStyle(
                        color: ChapColors.ocreDark, height: 1.4)),
              ),
            ],
            const SizedBox(height: 18),
            Text(tr(context, 'pro.typeTitre'),
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 8),
            for (final t in _types)
              Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: InkWell(
                  onTap: () => setState(() {
                    _type = t;
                    // Chaque type a SES secteurs : on repart sur le premier
                    // de sa liste (modifiable dans le menu juste en dessous).
                    if (!(_secteursDuType[t]!.contains(_secteur))) {
                      _secteur = _secteursDuType[t]!.first;
                    }
                  }),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 11),
                    decoration: BoxDecoration(
                      color: _type == t
                          ? ChapColors.cream100
                          : ChapColors.cream,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _type == t
                            ? ChapColors.orange
                            : ChapColors.line2,
                        width: _type == t ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(_emojis[t]!,
                            style: const TextStyle(fontSize: 19)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tr(context, 'pro.type.$t'),
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: _type == t
                                          ? FontWeight.w700
                                          : FontWeight.w500)),
                              Text(
                                _categoriesDuType[t]!
                                    .map((c) => nomCategorieTr(context, c))
                                    .join(' · '),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 10.5,
                                    color: ChapColors.gray500),
                              ),
                            ],
                          ),
                        ),
                        if (_type == t)
                          const Icon(Icons.check_circle,
                              size: 19, color: ChapColors.orange),
                      ],
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            TextField(
              controller: _nom,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.nomOrg'),
                hintText: tr(context, 'pro.nomOrgHint'),
                prefixIcon: const Icon(Icons.storefront_outlined),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _numero,
              decoration: InputDecoration(
                labelText: _labelNumero(),
                helperText: tr(context, 'pro.numeroAide'),
                helperMaxLines: 2,
                prefixIcon: const Icon(Icons.badge_outlined),
              ),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              // Reconstruit quand le type change : le secteur pré-rempli
              // s'affiche aussitôt (un champ de formulaire ne relit pas son
              // initialValue tout seul).
              key: ValueKey('secteur-$_type-$_secteur'),
              initialValue: _secteur,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.secteur'),
                prefixIcon: const Icon(Icons.category_outlined),
              ),
              items: [
                for (final sec in _secteursDuType[_type]!)
                  DropdownMenuItem(
                      value: sec, child: Text(secteurProTr(context, sec))),
              ],
              onChanged: (v) => setState(() => _secteur = v),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _tel,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: tr(context, 'pro.telBusiness'),
                hintText: '07 …',
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
            ),
            if (_erreur != null) ...[
              const SizedBox(height: 12),
              Text(_erreur!,
                  style: const TextStyle(color: Color(0xFFB42318))),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _envoi ? null : _envoyer,
              child: _envoi
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(tr(context, 'pro.envoyer')),
            ),
          ],
        ),
      ),
    );
  }
}
