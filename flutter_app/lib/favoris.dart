import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api/api_client.dart';

/// Les favoris — la liste des annonces qu'on a mises en cœur.
///
/// Comme le site : gardés EN LOCAL (ils marchent hors connexion et sans compte),
/// et synchronisés au serveur quand on est connecté (best-effort, sans jamais
/// bloquer l'écran). C'est un ChangeNotifier : le cœur se met à jour partout dès
/// qu'on bascule un favori.
class Favoris extends ChangeNotifier {
  Favoris._();
  static final Favoris instance = Favoris._();

  static const _cle = 'chapci.favoris.v1';
  final Set<String> _ids = {};

  /// À appeler au démarrage : recharge les favoris locaux, puis fusionne ceux
  /// du compte si on est connecté.
  Future<void> charger() async {
    final prefs = await SharedPreferences.getInstance();
    _ids
      ..clear()
      ..addAll(prefs.getStringList(_cle) ?? const []);
    notifyListeners();
    if (ApiClient.instance.connecte) {
      try {
        final d = await ApiClient.instance.get('/favorites');
        if (d is List) {
          _ids.addAll(d.map((e) => e.toString()));
          await _sauver();
          notifyListeners();
        }
      } catch (_) {/* silencieux : le local suffit */}
    }
  }

  bool contient(String id) => _ids.contains(id);
  List<String> get ids => _ids.toList();
  int get nombre => _ids.length;

  Future<void> basculer(String id) async {
    final ajout = !_ids.contains(id);
    if (ajout) {
      _ids.add(id);
    } else {
      _ids.remove(id);
    }
    notifyListeners();
    await _sauver();
    // Synchronisation compte, sans bloquer ni faire échouer le geste.
    if (ApiClient.instance.connecte) {
      try {
        if (ajout) {
          await ApiClient.instance.post('/favorites/$id', const {});
        } else {
          await ApiClient.instance.delete('/favorites/$id');
        }
      } catch (_) {/* silencieux */}
    }
  }

  Future<void> _sauver() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_cle, _ids.toList());
  }
}
