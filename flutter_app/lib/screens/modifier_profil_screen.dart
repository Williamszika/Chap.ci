import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart' as imgpick;
import '../api/api_client.dart';
import '../api/models.dart';
import '../theme.dart';

/// Modifier son profil — nom, bio et photo.
///
/// Pré-rempli depuis `GET /profile/{id}` ; enregistré via `PUT /profile`. La
/// photo n'est envoyée (en data-URI, comme les annonces) que si on en choisit
/// une nouvelle — sinon on ne touche pas à l'existante.
class ModifierProfilScreen extends StatefulWidget {
  const ModifierProfilScreen({super.key});
  @override
  State<ModifierProfilScreen> createState() => _ModifierProfilScreenState();
}

class _ModifierProfilScreenState extends State<ModifierProfilScreen> {
  final _nom = TextEditingController();
  final _bio = TextEditingController();

  bool _chargement = true;
  bool _envoi = false;
  String? _avatarUrl; // photo actuelle (URL serveur)
  ({List<int> bytes, String mime})? _nouvellePhoto; // photo choisie, non encore envoyée
  String? _erreur;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  @override
  void dispose() {
    _nom.dispose();
    _bio.dispose();
    super.dispose();
  }

  Future<void> _charger() async {
    try {
      final moi = await ApiClient.instance.moi();
      final id = moi?['id'] as String?;
      _nom.text =
          (moi?['user_metadata']?['full_name'] as String?)?.trim() ?? '';
      if (id != null) {
        final p = await ApiClient.instance.get('/profile/$id');
        if (p is Map) {
          _bio.text = (p['bio'] as String?) ?? '';
          _avatarUrl = p['avatarUrl'] as String?;
          final n = (p['fullName'] as String?)?.trim();
          if (_nom.text.isEmpty && n != null && n != 'Vendeur') _nom.text = n;
        }
      }
    } catch (_) {/* on édite quand même */}
    if (mounted) setState(() => _chargement = false);
  }

  Future<void> _choisirPhoto() async {
    try {
      final x = await imgpick.ImagePicker().pickImage(
          source: imgpick.ImageSource.gallery,
          maxWidth: 800,
          imageQuality: 85);
      if (x == null) return;
      final bytes = await x.readAsBytes();
      final mime = x.mimeType ??
          (x.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
      if (mounted) {
        setState(() => _nouvellePhoto = (bytes: bytes, mime: mime));
      }
    } catch (_) {
      if (mounted) {
        setState(() => _erreur =
            'Impossible d’accéder aux photos. Vérifiez l’autorisation.');
      }
    }
  }

  Future<void> _enregistrer() async {
    if (_nom.text.trim().length < 2) {
      setState(() => _erreur = 'Indiquez votre nom.');
      return;
    }
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      final corps = <String, dynamic>{
        'full_name': _nom.text.trim(),
        'bio': _bio.text.trim(),
      };
      final ph = _nouvellePhoto;
      if (ph != null) {
        corps['avatar_url'] =
            'data:${ph.mime};base64,${base64Encode(ph.bytes)}';
      }
      await ApiClient.instance.put('/profile', corps);
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _erreur = e.message);
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Modifier le profil')),
      body: _chargement
          ? const Center(
              child: CircularProgressIndicator(color: ChapColors.orange))
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
              children: [
                Center(
                  child: GestureDetector(
                    onTap: _choisirPhoto,
                    child: Stack(
                      children: [
                        _avatar(),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                                color: ChapColors.orange,
                                shape: BoxShape.circle),
                            child: const Icon(Icons.photo_camera,
                                size: 16, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: TextButton(
                    onPressed: _choisirPhoto,
                    child: const Text('Changer la photo',
                        style: TextStyle(color: ChapColors.orangeDark)),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _nom,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Nom complet',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _bio,
                  maxLines: 4,
                  maxLength: 300,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    labelText: 'Bio (facultatif)',
                    hintText: 'Quelques mots sur vous ou votre commerce…',
                    alignLabelWithHint: true,
                  ),
                ),
                if (_erreur != null) ...[
                  const SizedBox(height: 6),
                  Text(_erreur!,
                      style: const TextStyle(color: Color(0xFFB42318))),
                ],
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: _envoi ? null : _enregistrer,
                  child: _envoi
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Enregistrer'),
                ),
              ],
            ),
    );
  }

  Widget _avatar() {
    const double r = 46;
    final ph = _nouvellePhoto;
    if (ph != null) {
      return CircleAvatar(
          radius: r,
          backgroundImage: MemoryImage(
              Uint8List.fromList(ph.bytes))); // aperçu de la nouvelle photo
    }
    if (_avatarUrl != null && _avatarUrl!.isNotEmpty) {
      final src = ImageSource.resoudre(_avatarUrl!);
      if (src.url != null) {
        return CircleAvatar(radius: r, backgroundImage: NetworkImage(src.url!));
      }
      if (src.bytes != null) {
        return CircleAvatar(radius: r, backgroundImage: MemoryImage(src.bytes!));
      }
    }
    return const CircleAvatar(
      radius: r,
      backgroundColor: ChapColors.cream100,
      child: Icon(Icons.person, size: 46, color: ChapColors.orange),
    );
  }
}
