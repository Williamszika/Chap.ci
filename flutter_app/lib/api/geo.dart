// =============================================================================
//  Géolocalisation — port fidèle de src/lib/geo.ts (la partie utile à l'app).
//
//  Deux services :
//    • getBestPosition()  — la position GPS la plus précise possible (geolocator).
//    • reverseGeocode()   — coordonnées → adresse (BigDataCloud puis Nominatim),
//                           pour retomber sur une région / ville / commune connue.
//
//  Tout est « best-effort » : sur un réseau ivoirien instable ou hors-ligne, on
//  renvoie `null` plutôt que de bloquer la publication.
// =============================================================================
import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import '../data/coords.dart';

/// Une position GPS avec sa précision estimée (rayon, en mètres).
class Fix {
  final double lat;
  final double lng;
  final double? accuracy;
  const Fix(this.lat, this.lng, {this.accuracy});
  Coords get coords => Coords(lat, lng);
}

/// Distance en kilomètres entre deux points — même rôle que `haversineKm` du
/// site, mais on s'appuie sur geolocator (déjà présent) plutôt que de recopier
/// la formule.
double distanceKm(Coords a, Coords b) =>
    Geolocator.distanceBetween(a.lat, a.lng, b.lat, b.lng) / 1000;

/// Formate une distance pour l'affichage (m / km) — mêmes seuils que le site
/// (`formatDistance` de src/lib/geo.ts).
String formatDistance(double km) {
  if (km < 1) {
    final m = (km * 1000 / 50).round() * 50;
    return 'à ${m < 50 ? 50 : m} m';
  }
  if (km < 10) return 'à ${km.toStringAsFixed(1).replaceAll('.', ',')} km';
  if (km < 500) return 'à ${km.round()} km';
  return 'loin';
}

/// Une adresse déduite d'une position (les champs utiles au rapprochement).
class GeoAddress {
  final String? address;
  final String? city;
  final String? suburb;
  final String? region;
  const GeoAddress({this.address, this.city, this.suburb, this.region});
}

/// Levée quand la permission de localisation est refusée : le message est
/// déjà en français, prêt à montrer.
class GeoRefus implements Exception {
  final String message;
  const GeoRefus(this.message);
  @override
  String toString() => message;
}

/// Récupère la position GPS la plus précise possible.
///
/// Le GPS « chauffe » : les premières lectures sont grossières (réseau/cellule),
/// puis la précision s'affine. On demande donc la haute précision, avec une
/// limite de temps ; si la position fine n'arrive pas à temps, on retombe sur la
/// dernière position connue de l'appareil.
Future<Fix> getBestPosition({
  Duration maxWait = const Duration(seconds: 12),
}) async {
  // Le service de localisation est-il activé sur le téléphone ?
  final actif = await Geolocator.isLocationServiceEnabled();
  if (!actif) {
    throw const GeoRefus(
        'La localisation est désactivée sur votre téléphone. Activez-la, puis réessayez.');
  }

  // Permission : demandée si besoin ; refus (y compris définitif) explicité.
  var perm = await Geolocator.checkPermission();
  if (perm == LocationPermission.denied) {
    perm = await Geolocator.requestPermission();
  }
  if (perm == LocationPermission.denied) {
    throw const GeoRefus(
        'Autorisez la localisation pour placer votre annonce, puis réessayez.');
  }
  if (perm == LocationPermission.deniedForever) {
    throw const GeoRefus(
        'La localisation est bloquée pour l’application. Autorisez-la dans les réglages du téléphone.');
  }

  try {
    final pos = await Geolocator.getCurrentPosition(
      locationSettings: LocationSettings(
        accuracy: LocationAccuracy.best,
        timeLimit: maxWait,
      ),
    );
    return Fix(pos.latitude, pos.longitude, accuracy: pos.accuracy);
  } on TimeoutException {
    // La lecture fine n'est pas arrivée à temps : on se contente de la dernière
    // position connue si l'appareil en a une.
    final last = await Geolocator.getLastKnownPosition();
    if (last != null) {
      return Fix(last.latitude, last.longitude, accuracy: last.accuracy);
    }
    throw const GeoRefus(
        'Position introuvable pour l’instant. Réessayez à l’air libre, GPS activé.');
  }
}

/// Géocodage inversé (coordonnées → adresse).
///
/// Principal : BigDataCloud (frontières administratives nettes, idéal pour
/// Abidjan) ; repli : OpenStreetMap Nominatim. Renvoie `null` en cas d'échec.
Future<GeoAddress?> reverseGeocode(double lat, double lng) async {
  final bdc = await _reverseBigDataCloud(lat, lng);
  if (bdc != null) return bdc;
  return _reverseNominatim(lat, lng);
}

Future<Map<String, dynamic>?> _fetchJson(Uri url,
    {Duration timeout = const Duration(seconds: 7)}) async {
  try {
    final res = await http.get(url, headers: {
      'Accept': 'application/json',
      // Nominatim exige un User-Agent identifiant l'application.
      'User-Agent': 'ChapCI/1.0 (https://chap.ci)',
    }).timeout(timeout);
    if (res.statusCode != 200) return null;
    final data = jsonDecode(res.body);
    return data is Map<String, dynamic> ? data : null;
  } catch (_) {
    return null;
  }
}

Future<GeoAddress?> _reverseBigDataCloud(double lat, double lng) async {
  final url = Uri.parse(
      'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$lat&longitude=$lng&localityLanguage=fr');
  final data = await _fetchJson(url);
  if (data == null || data['city'] is! String) return null;

  // localityInfo.administrative est trié par niveau (le plus fin en dernier) :
  // on en tire le quartier.
  final info = data['localityInfo'];
  final admin = (info is Map ? info['administrative'] : null) as List? ?? const [];
  String? deepest;
  if (admin.isNotEmpty) {
    final last = admin.last;
    if (last is Map && last['name'] is String) deepest = last['name'] as String;
  }

  final city = (data['city'] as String?) ?? (data['locality'] as String?);
  final locality = data['locality'] as String?;
  String? suburb;
  if (locality != null && locality != city) {
    suburb = locality;
  } else if (deepest != null && deepest != city) {
    suburb = deepest;
  }

  final principal = data['principalSubdivision'] as String?;
  final parts = [suburb, city, principal].whereType<String>().toList();
  return GeoAddress(
    address: parts.isNotEmpty ? parts.join(', ') : null,
    city: city,
    suburb: suburb,
    region: principal,
  );
}

Future<GeoAddress?> _reverseNominatim(double lat, double lng) async {
  final url = Uri.parse(
      'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&accept-language=fr&zoom=16');
  final data = await _fetchJson(url);
  if (data == null) return null;
  final a = (data['address'] as Map?) ?? const {};
  String? first(List<String> keys) {
    for (final k in keys) {
      final v = a[k];
      if (v is String && v.isNotEmpty) return v;
    }
    return null;
  }

  return GeoAddress(
    address: data['display_name'] as String?,
    city: first(['city', 'town', 'village', 'municipality']),
    suburb: first(['suburb', 'neighbourhood', 'quarter', 'city_district']),
    region: first(['state', 'region']),
  );
}
