import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart' as imgpick;
import '../api/api_client.dart';
import '../api/deviner.dart';
import '../api/models.dart';
import '../data/categories.dart';
import '../i18n/categories_i18n.dart';
import '../i18n/textes.dart';
import '../data/coords.dart';
import '../data/locations.dart';
import '../data/formulaires/registre.dart';
import '../data/formulaires/schema.dart';
import '../theme.dart';
import '../widgets/prix_marche.dart';
import '../widgets/selecteur_lieu.dart';
import 'formulaire_dynamique.dart';
import 'verifier_email_screen.dart';

/// Une photo de l'annonce : NOUVELLE (les octets + son type, en attente
/// d'envoi) ou EXISTANTE (déjà sur le serveur : on renvoie son adresse telle
/// quelle, le serveur la garde sans la retéléverser).
class _Photo {
  final Uint8List? bytes;
  final String mime;

  /// L'adresse telle que le serveur l'a donnée (`/uploads/…` ou absolue) :
  /// c'est elle qu'on lui rend, pas la version résolue pour l'affichage.
  final String? existante;

  /// L'adresse affichable de la photo existante.
  final String? affichage;

  const _Photo(this.bytes, this.mime, {this.existante, this.affichage});

  /// Ce qui part au serveur : l'adresse d'origine, ou la photo en data-URI.
  String get envoi =>
      existante ?? 'data:$mime;base64,${base64Encode(bytes!)}';

  ImageProvider get image => bytes != null
      ? MemoryImage(bytes!) as ImageProvider
      : NetworkImage(affichage ?? existante ?? '');
}

/// Publier une annonce — version 1 : le formulaire de base + les photos.
///
/// Le serveur EXIGE : compte connecté, e-mail confirmé, au moins 3 photos, un
/// titre, et le texte passe la modération. Les formulaires détaillés par
/// sous-catégorie (marque, taille, année…) viendront dans une version suivante.
class PublierScreen extends StatefulWidget {
  /// Pré-sélection facultative (utilisée par l'outil de captures pour ouvrir
  /// directement un formulaire détaillé). L'app réelle n'en passe pas.
  final String? initialCategorie;
  final String? initialSous;

  /// MODIFIER une annonce existante (chantier 2 du 04/09/2026 : jusqu'ici, un
  /// vendeur devait retourner sur le site pour corriger un prix — il gardait
  /// le site et oubliait l'application). Le formulaire se préremplit, les
  /// photos déjà en ligne restent, et l'enregistrement passe par
  /// `PUT /listings/{id}` au lieu de `POST /listings`.
  final Listing? annonce;

  const PublierScreen(
      {super.key, this.initialCategorie, this.initialSous, this.annonce});
  @override
  State<PublierScreen> createState() => _PublierScreenState();
}

class _PublierScreenState extends State<PublierScreen> {
  @override
  void initState() {
    super.initState();
    _categorie = widget.initialCategorie;
    _sousCategorie = widget.initialSous;
    final a = widget.annonce;
    if (a != null) {
      _titre.text = a.title;
      _prix.text = a.price.round().toString();
      _description.text = a.description;
      _tel.text = a.sellerPhone ?? '';
      _categorie = a.categoryId;
      _sousCategorie = a.subcategory;
      _condition = a.condition == 'neuf' ? 'neuf' : 'occasion';
      _negociable = a.negotiable;
      _livraison = a.delivery;
      _lieu = Lieu(regionId: a.regionId, cityId: a.cityId, commune: a.commune);
      if (a.lat != null && a.lng != null) _gpsCoords = Coords(a.lat!, a.lng!);
      for (final src in a.images) {
        final r = ImageSource.resoudre(src);
        if (r.bytes != null) {
          _photos.add(_Photo(r.bytes, 'image/jpeg'));
        } else if (r.url != null) {
          _photos.add(_Photo(null, 'image/jpeg', existante: src, affichage: r.url));
        }
      }
      // Jamais de remplissage automatique par-dessus une annonce existante.
      _devineFait = true;
    }
    if (_schema != null) _cleForm = GlobalKey<FormulaireDynamiqueState>();
  }

  bool get _modification => widget.annonce != null;

  /// Le nombre de photos exigé : trois pour une nouvelle annonce ; en
  /// modification, la même règle que le serveur — on peut en ajouter, pas
  /// retirer toutes celles qui étaient là (au moins une, au plus trois).
  int get _photosMinimum {
    final a = widget.annonce;
    if (a == null) return 3;
    final avant = a.images.length;
    return avant < 1 ? 1 : (avant > 3 ? 3 : avant);
  }

  final _formKey = GlobalKey<FormState>();
  final _titre = TextEditingController();
  final _prix = TextEditingController();
  final _description = TextEditingController();
  final _tel = TextEditingController();

  final _photos = <_Photo>[];
  String? _categorie;
  String? _sousCategorie;
  EtatFormulaire? _etatForm; // le dernier état du formulaire détaillé
  // Une clé par sous-catégorie : elle réinitialise le formulaire au changement
  // ET donne prise dessus pour renuméroter les photos liées à une couleur.
  GlobalKey<FormulaireDynamiqueState>? _cleForm;
  String _condition = 'occasion';
  Lieu _lieu = const Lieu(); // région / ville / commune choisies
  Coords? _gpsCoords; // position précise si le GPS a été activé
  bool _negociable = false;
  bool _livraison = false;
  bool _envoi = false;

  // « CHAP.CI ÉCRIT L'ANNONCE » — une seule fois par annonce, sur la première
  // photo, jamais par-dessus ce que la personne a déjà tapé. `_devineFait`
  // verrouille : même si la personne retire la photo et en remet une, le
  // moteur n'est pas rappelé (chaque lecture coûte).
  bool _devineFait = false;
  bool _devineEnCours = false;
  bool _devineNote = false;

  /// Le formulaire détaillé de la sous-catégorie choisie, ou `null` s'il n'est
  /// pas encore porté (le formulaire de base suffit alors).
  Schema? get _schema => schemaPour(_categorie, _sousCategorie);

  /// Le prix tel qu'il est tapé, pour « Ça vaut combien ? ».
  int get _prixSaisi =>
      int.tryParse(_prix.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

  @override
  void dispose() {
    _titre.dispose();
    _prix.dispose();
    _description.dispose();
    _tel.dispose();
    super.dispose();
  }

  Future<void> _choisirPhotos() async {
    final source = await showModalBottomSheet<imgpick.ImageSource>(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined,
                  color: ChapColors.orange),
              title: Text(tr(context, 'pub.galerie')),
              onTap: () =>
                  Navigator.pop(context, imgpick.ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined,
                  color: ChapColors.orange),
              title: Text(tr(context, 'pub.prendrePhoto')),
              onTap: () => Navigator.pop(context, imgpick.ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final picker = imgpick.ImagePicker();
    final avant = _photos.length;
    try {
      if (source == imgpick.ImageSource.gallery) {
        final xs = await picker.pickMultiImage(
            maxWidth: 1600, imageQuality: 82);
        for (final x in xs) {
          await _ajouter(x);
        }
      } else {
        final x = await picker.pickImage(
            source: imgpick.ImageSource.camera,
            maxWidth: 1600,
            imageQuality: 82);
        if (x != null) await _ajouter(x);
      }
      if (mounted) setState(() {});
      // La PREMIÈRE photo de l'annonce : le moteur la lit et remplit ce qui
      // est encore vide. Les suivantes ne déclenchent rien.
      if (avant == 0 && _photos.isNotEmpty) _lancerDevine(_photos.first);
    } catch (_) {
      if (mounted) {
        _dialogue(tr(context, 'pub.photo'), tr(context, 'pub.photoErreur'));
      }
    }
  }

  /// Demande au serveur de lire la photo, et applique ce qu'il en dit dans
  /// les champs ENCORE VIDES. Silencieux à chaque refus (moteur éteint, quota
  /// du jour, réseau) : le formulaire reste celui d'hier, personne n'a à
  /// savoir qu'une aide a été tentée.
  Future<void> _lancerDevine(_Photo p) async {
    if (_devineFait || _titre.text.trim().isNotEmpty || _categorie != null) {
      return;
    }
    _devineFait = true;
    final octets = p.bytes;
    if (octets == null) return;
    if (!await devinerDisponible()) return;
    if (!mounted) return;
    setState(() => _devineEnCours = true);
    try {
      final r = await deviner(octets);
      if (!mounted || r == null) return;
      // Sous 30 de confiance, le moteur hésite : mieux vaut un formulaire vide
      // qu'un formulaire faux à corriger champ par champ.
      if (r.confiance < 30) return;
      _appliquerDevine(r);
    } on ApiException {
      // 503 (pas de clé), 429 (quota), 422 (photo refusée), 502 (moteur) :
      // on se tait, comme le site.
    } catch (_) {
      // Photo indécodable, isolat interrompu : idem.
    } finally {
      if (mounted) setState(() => _devineEnCours = false);
    }
  }

  void _appliquerDevine(Devine r) {
    setState(() {
      if (_titre.text.trim().isEmpty && r.titre.isNotEmpty) {
        _titre.text = r.titre.length > 80 ? r.titre.substring(0, 80) : r.titre;
      }
      if (_description.text.trim().isEmpty && r.description.isNotEmpty) {
        _description.text = r.description.length > 1500
            ? r.description.substring(0, 1500)
            : r.description;
      }
      // La catégorie proposée a déjà été vérifiée par le serveur contre le
      // catalogue envoyé ; on revérifie ici, parce que c'est gratuit et que
      // le sélecteur n'accepterait pas une valeur hors liste.
      if (_categorie == null &&
          r.categoryId.isNotEmpty &&
          categories.any((c) => c.id == r.categoryId)) {
        _categorie = r.categoryId;
        _sousCategorie = null;
        _etatForm = null;
        _cleForm = null;
        if (sousDe(r.categoryId).contains(r.subcategory)) {
          _sousCategorie = r.subcategory;
          _cleForm = schemaPour(_categorie, _sousCategorie) != null
              ? GlobalKey<FormulaireDynamiqueState>()
              : null;
        }
      }
      if (r.etat == 'neuf' || r.etat == 'occasion') _condition = r.etat;
      _devineNote = true;
    });
    // Les caractéristiques (marque, modèle…) vont dans le formulaire détaillé,
    // qui n'existe qu'après ce rebuild : on attend l'image suivante.
    if (r.caracteristiques.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _cleForm?.currentState?.appliquerSuggestions(r.caracteristiques);
      });
    }
  }

  /// La bannière du moteur : la roue pendant la lecture, puis la note
  /// « Chap.ci a rempli l'annonce… » que la personne peut refermer.
  Widget _bandeauDevine() {
    if (_devineEnCours) {
      return Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: ChapColors.cream100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: ChapColors.marque)),
            const SizedBox(width: 10),
            Expanded(
              child: Text(tr(context, 'deviner.enCours'),
                  style: const TextStyle(
                      fontSize: 13, color: ChapColors.gray700)),
            ),
          ],
        ),
      );
    }
    if (!_devineNote) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.fromLTRB(12, 8, 4, 8),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF7EF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ChapColors.marque.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(Icons.auto_awesome, size: 18, color: ChapColors.marqueSombre),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text(tr(context, 'deviner.note'),
                  style: const TextStyle(
                      fontSize: 13, height: 1.35, color: ChapColors.greenDark)),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18, color: ChapColors.gray600),
            tooltip: tr(context, 'action.annuler'),
            onPressed: () => setState(() => _devineNote = false),
          ),
        ],
      ),
    );
  }

  Future<void> _ajouter(imgpick.XFile x) async {
    if (_photos.length >= 8) return; // garde-fou
    final bytes = await x.readAsBytes();
    final mime = x.mimeType ??
        (x.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
    _photos.add(_Photo(bytes, mime));
  }

  Future<void> _publier() async {
    if (!_formKey.currentState!.validate()) return;
    if (_categorie == null) {
      _dialogue(tr(context, 'pub.categorie'), tr(context, 'pub.choisirCategorie'));
      return;
    }
    if (sousDe(_categorie!).isNotEmpty && _sousCategorie == null) {
      _dialogue(tr(context, 'pub.sousCategorie'), tr(context, 'pub.choisirSous'));
      return;
    }
    if (_lieu.regionId == null) {
      _dialogue(tr(context, 'pub.localisation'),
          tr(context, 'pub.localisationAide'));
      return;
    }
    if (_photos.length < _photosMinimum) {
      _dialogue(tr(context, 'pub.photos'), tr(context, 'pub.photosAide'));
      return;
    }
    // Le formulaire détaillé : d'abord un éventuel refus (produit interdit,
    // périmé…), puis les champs requis manquants.
    final motif = _etatForm?.motifBloc;
    if (motif != null) {
      _dialogue(tr(context, 'pub.impossible'), motif);
      return;
    }
    final manquants = _etatForm?.manquants ?? const [];
    if (manquants.isNotEmpty) {
      _dialogue('À compléter',
          '${tr(context, 'pub.infosManquent')}\n\n• ${manquants.join('\n• ')}');
      return;
    }

    setState(() => _envoi = true);
    try {
      // Le nom du vendeur = le nom du compte (récupéré côté serveur).
      final moi = await ApiClient.instance.moi();

      // Mur du serveur : e-mail confirmé obligatoire pour publier. On y envoie
      // l'utilisateur, puis on relance la publication une fois confirmé.
      if (moi != null && moi['emailVerified'] != true) {
        if (!mounted) return;
        setState(() => _envoi = false);
        final verifie = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const VerifierEmailScreen()));
        if (verifie == true && mounted) _publier();
        return;
      }

      final nom = (moi?['user_metadata']?['full_name'] as String?)?.trim() ?? '';

      final attributs = _etatForm?.attributs ?? const {};
      // Position précise (GPS) sinon coordonnées approximatives de la
      // commune / ville — comme le site : toute annonce porte un point, pour
      // que la distance s'affiche même sans GPS.
      final coords = _gpsCoords ?? coordsFor(_lieu.cityId, _lieu.commune);
      final corps = <String, dynamic>{
        'title': _titre.text.trim(),
        'description': _description.text.trim(),
        'price': int.tryParse(_prix.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        'negotiable': _negociable,
        'categoryId': _categorie,
        'subcategory': _sousCategorie,
        'condition': _condition,
        // Les photos existantes repartent par leur adresse, les nouvelles en
        // data-URI : le serveur garde les unes et téléverse les autres.
        'images': _photos.map((p) => p.envoi).toList(),
        'regionId': _lieu.regionId,
        'cityId': _lieu.cityId ?? '',
        if (_lieu.commune != null) 'commune': _lieu.commune,
        if (coords != null) 'lat': coords.lat,
        if (coords != null) 'lng': coords.lng,
        'sellerName': nom,
        'sellerPhone': _tel.text.trim(),
        'delivery': _livraison,
        if (attributs.isNotEmpty) 'attributes': attributs,
      };
      final a = widget.annonce;
      if (a != null) {
        // La promotion en cours n'est pas éditable ici : on la renvoie telle
        // quelle, sinon le serveur l'effacerait avec la mise à jour.
        if (a.promoPrice != null) corps['promoPrice'] = a.promoPrice;
        if (a.promoUntil != null) corps['promoUntil'] = a.promoUntil;
        await ApiClient.instance.put('/listings/${a.id}', corps);
      } else {
        await ApiClient.instance.post('/listings', corps);
      }

      if (!mounted) return;
      Navigator.of(context).pop(true); // le shell affiche la confirmation
    } on ApiException catch (e) {
      // Couvre : e-mail non confirmé, modération, moins de 3 photos retenues…
      if (mounted) _dialogue(tr(context, 'pub.publication'), e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  void _dialogue(String titre, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: Text(titre),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(tr(context, 'action.compris'))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: Text(tr(
              context, _modification ? 'pub.modifierTitre' : 'pub.titre'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          children: [
            _titreSection(tr(context, 'pub.photos')),
            _photosSection(),
            const SizedBox(height: 18),
            _bandeauDevine(),
            _titreSection(tr(context, 'pub.details')),
            TextFormField(
              controller: _titre,
              textCapitalization: TextCapitalization.sentences,
              maxLength: 80,
              decoration: InputDecoration(
                labelText: tr(context, 'pub.titreAnnonce'),
                hintText: tr(context, 'pub.titreExemple'),
              ),
              validator: (v) => (v == null || v.trim().length < 4)
                  ? tr(context, 'pub.titreClair')
                  : null,
            ),
            const SizedBox(height: 12),
            // La clé change avec la valeur : un `DropdownButtonFormField` ne
            // relit son `initialValue` qu'à sa création, et le moteur de
            // vision pose la catégorie SANS passer par le sélecteur. Sans
            // cette clé, la case resterait vide alors que l'état est rempli.
            DropdownButtonFormField<String>(
              key: ValueKey('categorie:${_categorie ?? ''}'),
              initialValue: _categorie,
              isExpanded: true,
              decoration:
                  InputDecoration(labelText: tr(context, 'pub.categorie')),
              items: [
                for (final c in categories)
                  DropdownMenuItem(
                      value: c.id,
                      child: Text(
                          '${c.emoji}  ${nomCategorieTr(context, c.id)}')),
              ],
              onChanged: (v) => setState(() {
                _categorie = v;
                _sousCategorie = null; // la sous-catégorie dépend de la catégorie
                _etatForm = null;
                _cleForm = null;
              }),
            ),
            if (_categorie != null && sousDe(_categorie!).isNotEmpty) ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                key: ValueKey('sous:${_categorie ?? ''}:${_sousCategorie ?? ''}'),
                initialValue: _sousCategorie,
                isExpanded: true,
                decoration: InputDecoration(
                    labelText: tr(context, 'pub.sousCategorie')),
                items: [
                  for (final s in sousDe(_categorie!))
                    DropdownMenuItem(
                        value: s, child: Text(nomSousTr(context, s))),
                ],
                onChanged: (v) => setState(() {
                  _sousCategorie = v;
                  _etatForm = null;
                  _cleForm = schemaPour(_categorie, v) != null
                      ? GlobalKey<FormulaireDynamiqueState>()
                      : null;
                }),
              ),
            ],
            // Le formulaire détaillé de la sous-catégorie (marque, taille,
            // année…), quand il est porté. Sinon, le formulaire de base suffit.
            if (_schema != null) ...[
              const SizedBox(height: 16),
              _titreSection(tr(context, 'pub.sousDetails')),
              FormulaireDynamique(
                key: _cleForm,
                schema: _schema!,
                images: _photos.map((p) => p.image).toList(),
                // En modification, les réponses déjà données — tant que la
                // sous-catégorie est celle de l'annonce : un autre formulaire
                // n'a pas les mêmes questions.
                initiales: (widget.annonce != null &&
                        _sousCategorie == widget.annonce!.subcategory)
                    ? widget.annonce!.attributes
                    : null,
                onChange: (e) => setState(() => _etatForm = e),
              ),
              const SizedBox(height: 6),
            ],
            const SizedBox(height: 14),
            // Un service (réparation, cours…) n'est ni « neuf » ni « d'occasion ».
            if (_schema?.etat != false) ...[
              Text(tr(context, 'annonce.etat'), style: _labelStyle),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                segments: [
                  ButtonSegment(
                      value: 'neuf', label: Text(tr(context, 'cond.neuf'))),
                  ButtonSegment(
                      value: 'occasion',
                      label: Text(tr(context, 'cond.occasion'))),
                ],
                selected: {_condition},
                onSelectionChanged: (s) => setState(() => _condition = s.first),
                showSelectedIcon: false,
              ),
              const SizedBox(height: 14),
            ],
            TextFormField(
              controller: _prix,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: InputDecoration(
                labelText: _schema?.prixLabel ?? tr(context, 'pub.prix'),
                suffixText: 'FCFA',
              ),
              // « Ça vaut combien ? » relit le prix à chaque frappe.
              onChanged: (_) => setState(() {}),
              validator: (v) {
                final n = int.tryParse((v ?? '').replaceAll(RegExp(r'[^0-9]'), ''));
                return (n == null || n <= 0)
                    ? tr(context, 'pub.indiquezPrix')
                    : null;
              },
            ),
            // La fourchette de la sous-catégorie sur Chap.ci, et où se situe
            // le prix tapé. Une aide, jamais un blocage.
            if (_categorie != null && _sousCategorie != null)
              PrixMarcheVendeur(
                categoryId: _categorie!,
                subcategory: _sousCategorie,
                condition: _schema?.etat != false ? _condition : null,
                marque: _etatForm?.attributs['marque'],
                prix: _prixSaisi,
              ),
            CheckboxListTile(
              value: _negociable,
              onChanged: (v) => setState(() => _negociable = v ?? false),
              activeColor: ChapColors.orange,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(tr(context, 'pub.prixNegociable')),
            ),
            const SizedBox(height: 12),
            Text(tr(context, 'pub.localisation'), style: _labelStyle),
            const SizedBox(height: 6),
            SelecteurLieu(
              valeur: _lieu,
              onChange: (choix) => setState(() {
                _lieu = choix.lieu;
                _gpsCoords = choix.gps;
              }),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _description,
              maxLines: 5,
              maxLength: 1500,
              textCapitalization: TextCapitalization.sentences,
              decoration: InputDecoration(
                labelText: tr(context, 'pub.description'),
                hintText: tr(context, 'pub.descriptionAide'),
                alignLabelWithHint: true,
              ),
            ),
            TextFormField(
              controller: _tel,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: tr(context, 'pub.telephone'),
                hintText: '07 …',
                prefixIcon: const Icon(Icons.phone_outlined),
              ),
            ),
            CheckboxListTile(
              value: _livraison,
              onChanged: (v) => setState(() => _livraison = v ?? false),
              activeColor: ChapColors.orange,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(tr(context, 'pub.livraisonPossible')),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _envoi ? null : _publier,
              child: _envoi
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(tr(context,
                      _modification ? 'pub.enregistrerModifs' : 'pub.publierMonAnnonce')),
            ),
          ],
        ),
      ),
    );
  }

  static const _labelStyle = TextStyle(
      fontSize: 13, fontWeight: FontWeight.w600, color: ChapColors.gray700);

  Widget _titreSection(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(t,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: ChapColors.gray900)),
      );

  Widget _photosSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 92,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (int i = 0; i < _photos.length; i++) _vignette(i),
              if (_photos.length < 8) _ajoutTuile(),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          tr(context, 'pub.photosMinimum')
                  .replaceFirst('{n}', '${_photos.length}')
                  .replaceFirst('{min}', '$_photosMinimum') +
              (_photos.length >= _photosMinimum ? '  ✓' : ''),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: _photos.length >= _photosMinimum
                ? ChapColors.greenDark
                : ChapColors.gray600,
          ),
        ),
      ],
    );
  }

  Widget _vignette(int i) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image(
                image: _photos[i].image,
                width: 92,
                height: 92,
                fit: BoxFit.cover,
                errorBuilder: (c, e, s) => Container(
                    width: 92,
                    height: 92,
                    color: ChapColors.cream100,
                    child: const Icon(Icons.broken_image_outlined,
                        color: ChapColors.line2))),
          ),
          Positioned(
            top: 2,
            right: 2,
            child: GestureDetector(
              onTap: () {
                setState(() => _photos.removeAt(i));
                // Une couleur pouvait pointer vers cette photo : on renumérote.
                _cleForm?.currentState?.photoRetiree(i);
              },
              child: Container(
                decoration: const BoxDecoration(
                    color: Colors.black54, shape: BoxShape.circle),
                padding: const EdgeInsets.all(3),
                child: const Icon(Icons.close, size: 15, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _ajoutTuile() {
    return GestureDetector(
      onTap: _choisirPhotos,
      child: Container(
        width: 92,
        height: 92,
        decoration: BoxDecoration(
          color: ChapColors.cream,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.add_a_photo_outlined, color: ChapColors.orange),
            const SizedBox(height: 4),
            Text(tr(context, 'pub.ajouter'),
                style:
                    const TextStyle(fontSize: 11, color: ChapColors.gray600)),
          ],
        ),
      ),
    );
  }
}
