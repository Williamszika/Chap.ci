import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart' as imgpick;
import '../api/api_client.dart';
import '../data/categories.dart';
import '../data/coords.dart';
import '../data/locations.dart';
import '../data/formulaires/registre.dart';
import '../data/formulaires/schema.dart';
import '../theme.dart';
import '../widgets/selecteur_lieu.dart';
import 'formulaire_dynamique.dart';
import 'verifier_email_screen.dart';

/// Une photo choisie (les octets + son type), en attente d'envoi.
class _Photo {
  final Uint8List bytes;
  final String mime;
  const _Photo(this.bytes, this.mime);
  String get dataUri => 'data:$mime;base64,${base64Encode(bytes)}';
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
  const PublierScreen({super.key, this.initialCategorie, this.initialSous});
  @override
  State<PublierScreen> createState() => _PublierScreenState();
}

class _PublierScreenState extends State<PublierScreen> {
  @override
  void initState() {
    super.initState();
    _categorie = widget.initialCategorie;
    _sousCategorie = widget.initialSous;
    if (_schema != null) _cleForm = GlobalKey<FormulaireDynamiqueState>();
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

  /// Le formulaire détaillé de la sous-catégorie choisie, ou `null` s'il n'est
  /// pas encore porté (le formulaire de base suffit alors).
  Schema? get _schema => schemaPour(_categorie, _sousCategorie);

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
              title: const Text('Choisir dans la galerie'),
              onTap: () =>
                  Navigator.pop(context, imgpick.ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined,
                  color: ChapColors.orange),
              title: const Text('Prendre une photo'),
              onTap: () => Navigator.pop(context, imgpick.ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final picker = imgpick.ImagePicker();
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
    } catch (_) {
      if (mounted) {
        _dialogue('Photo', 'Impossible d’accéder aux photos. '
            'Vérifiez l’autorisation dans les réglages du téléphone.');
      }
    }
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
      _dialogue('Catégorie', 'Choisissez une catégorie.');
      return;
    }
    if (sousDe(_categorie!).isNotEmpty && _sousCategorie == null) {
      _dialogue('Sous-catégorie', 'Choisissez une sous-catégorie : le formulaire s’y adapte.');
      return;
    }
    if (_lieu.regionId == null) {
      _dialogue('Localisation',
          'Indiquez où se trouve l’objet : activez le GPS ou choisissez la région à la main.');
      return;
    }
    if (_photos.length < 3) {
      _dialogue('Photos',
          'Ajoutez au moins 3 photos de l’objet. Une annonce sans photo ne se vend pas — montrez-le sous plusieurs angles.');
      return;
    }
    // Le formulaire détaillé : d'abord un éventuel refus (produit interdit,
    // périmé…), puis les champs requis manquants.
    final motif = _etatForm?.motifBloc;
    if (motif != null) {
      _dialogue('Publication impossible', motif);
      return;
    }
    final manquants = _etatForm?.manquants ?? const [];
    if (manquants.isNotEmpty) {
      _dialogue('À compléter',
          'Ces informations manquent :\n\n• ${manquants.join('\n• ')}');
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
      await ApiClient.instance.post('/listings', {
        'title': _titre.text.trim(),
        'description': _description.text.trim(),
        'price': int.tryParse(_prix.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        'negotiable': _negociable,
        'categoryId': _categorie,
        'subcategory': _sousCategorie,
        'condition': _condition,
        'images': _photos.map((p) => p.dataUri).toList(),
        'regionId': _lieu.regionId,
        'cityId': _lieu.cityId ?? '',
        if (_lieu.commune != null) 'commune': _lieu.commune,
        if (coords != null) 'lat': coords.lat,
        if (coords != null) 'lng': coords.lng,
        'sellerName': nom,
        'sellerPhone': _tel.text.trim(),
        'delivery': _livraison,
        if (attributs.isNotEmpty) 'attributes': attributs,
      });

      if (!mounted) return;
      Navigator.of(context).pop(true); // le shell affiche la confirmation
    } on ApiException catch (e) {
      // Couvre : e-mail non confirmé, modération, moins de 3 photos retenues…
      if (mounted) _dialogue('Publication', e.message);
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
              child: const Text('J’ai compris')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Publier une annonce')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          children: [
            _titreSection('Photos'),
            _photosSection(),
            const SizedBox(height: 18),
            _titreSection('Détails'),
            TextFormField(
              controller: _titre,
              textCapitalization: TextCapitalization.sentences,
              maxLength: 80,
              decoration: const InputDecoration(
                labelText: 'Titre de l’annonce',
                hintText: 'Ex : Robe wax taille 40, jamais portée',
              ),
              validator: (v) => (v == null || v.trim().length < 4)
                  ? 'Donnez un titre clair'
                  : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _categorie,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Catégorie'),
              items: [
                for (final c in categories)
                  DropdownMenuItem(
                      value: c.id, child: Text('${c.emoji}  ${c.nom}')),
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
                initialValue: _sousCategorie,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Sous-catégorie'),
                items: [
                  for (final s in sousDe(_categorie!))
                    DropdownMenuItem(value: s, child: Text(s)),
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
              _titreSection('Détails de la sous-catégorie'),
              FormulaireDynamique(
                key: _cleForm,
                schema: _schema!,
                images: _photos.map((p) => p.bytes).toList(),
                onChange: (e) => setState(() => _etatForm = e),
              ),
              const SizedBox(height: 6),
            ],
            const SizedBox(height: 14),
            // Un service (réparation, cours…) n'est ni « neuf » ni « d'occasion ».
            if (_schema?.etat != false) ...[
              const Text('État', style: _labelStyle),
              const SizedBox(height: 6),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'neuf', label: Text('Neuf')),
                  ButtonSegment(value: 'occasion', label: Text('Occasion')),
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
                labelText: _schema?.prixLabel ?? 'Prix',
                suffixText: 'FCFA',
              ),
              validator: (v) {
                final n = int.tryParse((v ?? '').replaceAll(RegExp(r'[^0-9]'), ''));
                return (n == null || n <= 0) ? 'Indiquez un prix' : null;
              },
            ),
            CheckboxListTile(
              value: _negociable,
              onChanged: (v) => setState(() => _negociable = v ?? false),
              activeColor: ChapColors.orange,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text('Prix négociable'),
            ),
            const SizedBox(height: 12),
            const Text('Localisation', style: _labelStyle),
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
              decoration: const InputDecoration(
                labelText: 'Description',
                hintText:
                    'État, marque, taille, raison de la vente… soyez précis et honnête.',
                alignLabelWithHint: true,
              ),
            ),
            TextFormField(
              controller: _tel,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Téléphone (facultatif)',
                hintText: '07 …',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
            ),
            CheckboxListTile(
              value: _livraison,
              onChanged: (v) => setState(() => _livraison = v ?? false),
              activeColor: ChapColors.orange,
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: const Text('Livraison possible'),
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
                  : const Text('Publier mon annonce'),
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
          '${_photos.length}/3 photos minimum'
          '${_photos.length >= 3 ? '  ✓' : ''}',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: _photos.length >= 3
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
            child: Image.memory(_photos[i].bytes,
                width: 92, height: 92, fit: BoxFit.cover),
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
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_a_photo_outlined, color: ChapColors.orange),
            SizedBox(height: 4),
            Text('Ajouter',
                style: TextStyle(fontSize: 11, color: ChapColors.gray600)),
          ],
        ),
      ),
    );
  }
}
