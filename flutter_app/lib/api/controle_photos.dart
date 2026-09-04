// =============================================================================
//  LE CONTRÔLE DES PHOTOS PAR LE SERVEUR — chantier 5 du 04/09/2026.
//
//  L'application n'avait aucun contrôle anti-nudité : le site en avait un dans
//  le navigateur (un modèle de 5,4 Mo). Quand la clé du moteur de vision est
//  en place, le serveur contrôle les photos d'une annonce — les mêmes photos
//  réduites à 768 px que « Chap.ci écrit l'annonce », en un appel pour le lot.
//  Sans clé, rien ne change : l'application ne contrôlait pas avant, et le
//  filet reste la modération et le signalement.
// =============================================================================
import 'dart:convert';
import 'dart:typed_data';

import 'api_client.dart';
import 'deviner.dart';

/// Le verdict d'une photo : refusée ou non, et pourquoi (« ok », « nudite »,
/// « sexuel », « mineur »).
class VerdictPhoto {
  final bool refusee;
  final String motif;
  const VerdictPhoto({required this.refusee, required this.motif});
}

/// Contrôle des photos (octets pleine taille). Rend un verdict par photo, dans
/// l'ordre, ou `null` si le serveur ne peut pas contrôler (pas de clé, réseau,
/// quota du jour) : l'écran laisse alors passer, comme avant.
///
/// Un 422 — le moteur a refusé de regarder le lot — est un verdict : tout le
/// lot est refusé.
Future<List<VerdictPhoto>?> controlerPhotos(List<Uint8List> photos) async {
  if (photos.isEmpty) return const [];
  if (!await devinerDisponible()) return null;
  try {
    final petites = <String>[];
    for (final p in photos) {
      final r = await reduirePourVision(p);
      if (r == null) return null; // une photo indécodable : pas de verdict fiable
      petites.add('data:image/jpeg;base64,${base64Encode(r)}');
    }
    final d = await ApiClient.instance.post(
      '/photos/controle',
      {'images': petites},
      timeout: const Duration(seconds: 70),
    );
    if (d is! Map || d['verdicts'] is! List) return null;
    final liste = (d['verdicts'] as List)
        .map((v) => VerdictPhoto(
              refusee: v is Map && v['refusee'] == true,
              motif: (v is Map ? v['motif'] : null)?.toString() ?? 'ok',
            ))
        .toList();
    return liste.length == photos.length ? liste : null;
  } on ApiException catch (e) {
    if (e.statusCode == 422) {
      return [for (final _ in photos) const VerdictPhoto(refusee: true, motif: 'refus')];
    }
    return null;
  } catch (_) {
    return null;
  }
}
