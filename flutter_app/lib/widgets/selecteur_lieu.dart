import 'package:flutter/material.dart';

import '../api/geo.dart';
import '../data/coords.dart';
import '../data/locations.dart';
import '../theme.dart';

/// Le résultat courant du sélecteur : le lieu choisi + d'éventuelles
/// coordonnées GPS précises (quand le vendeur a activé sa position).
class ChoixLieu {
  final Lieu lieu;
  final Coords? gps;
  const ChoixLieu(this.lieu, this.gps);
}

/// Sélecteur de localisation pour « Publier » — l'équivalent mobile du
/// `LocationSheet` du site.
///
/// Deux chemins, comme sur le site :
///   • un bouton **GPS** qui détecte la position, la géocode en sens inverse et
///     retombe sur une région / ville / commune connue (position précise gardée) ;
///   • un choix **manuel** en cascade Région → Ville → Commune (feuille du bas),
///     pour quand la détection échoue ou que le vendeur préfère choisir.
class SelecteurLieu extends StatefulWidget {
  final Lieu valeur;
  final ValueChanged<ChoixLieu> onChange;
  const SelecteurLieu({super.key, required this.valeur, required this.onChange});

  @override
  State<SelecteurLieu> createState() => _SelecteurLieuState();
}

class _SelecteurLieuState extends State<SelecteurLieu> {
  late Lieu _lieu = widget.valeur;
  Coords? _gps; // position précise si le GPS a été activé
  bool _localisation = false; // détection en cours

  void _appliquer(Lieu l, {Coords? gps}) {
    setState(() {
      _lieu = l;
      if (gps != null) _gps = gps;
    });
    widget.onChange(ChoixLieu(_lieu, _gps));
  }

  Future<void> _detecter() async {
    setState(() => _localisation = true);
    try {
      final fix = await getBestPosition();
      final gps = fix.coords;
      final geo = await reverseGeocode(fix.lat, fix.lng);
      final resolu =
          resolveLocationByName([geo?.suburb, geo?.city, geo?.region]);
      if (resolu != null && resolu.regionId != null) {
        _appliquer(resolu, gps: gps);
      } else {
        // Position captée mais lieu non reconnu : on garde les coordonnées et on
        // invite à préciser à la main.
        setState(() => _gps = gps);
        widget.onChange(ChoixLieu(_lieu, _gps));
        if (mounted) {
          _toast(
              'Position captée. Précisez la région à la main pour finir.');
        }
      }
    } on GeoRefus catch (e) {
      if (mounted) _toast(e.message);
    } catch (_) {
      if (mounted) {
        _toast(
            'Impossible d’obtenir votre position. Autorisez la localisation, puis réessayez.');
      }
    } finally {
      if (mounted) setState(() => _localisation = false);
    }
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: ChapColors.gray900,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final a = _lieu.regionId != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Le lieu choisi — tapoter ouvre le choix manuel.
        InkWell(
          onTap: _ouvrirManuel,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: ChapColors.cream,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ChapColors.line2),
            ),
            child: Row(
              children: [
                const Icon(Icons.place_outlined,
                    size: 19, color: ChapColors.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    a
                        ? locationLabel(
                            _lieu.regionId, _lieu.cityId, _lieu.commune)
                        : _localisation
                            ? 'Détection de votre position…'
                            : 'Choisir la localisation',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: a ? FontWeight.w600 : FontWeight.w400,
                      color: a ? ChapColors.gray900 : ChapColors.gray600,
                    ),
                  ),
                ),
                const Icon(Icons.expand_more, size: 20, color: ChapColors.gray600),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        // Le bouton GPS.
        OutlinedButton.icon(
          onPressed: _localisation ? null : _detecter,
          icon: _localisation
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.orange))
              : const Icon(Icons.my_location, size: 18),
          label: Text(_localisation
              ? 'Localisation…'
              : a
                  ? 'Actualiser ma position (GPS)'
                  : 'Activer ma position (GPS)'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(44),
            foregroundColor: ChapColors.orange,
            side: const BorderSide(color: ChapColors.orange),
          ),
        ),
        if (a && _gps != null)
          const Padding(
            padding: EdgeInsets.only(top: 6, left: 2),
            child: Text('Position précise enregistrée ✓',
                style: TextStyle(fontSize: 12, color: ChapColors.greenDark)),
          ),
      ],
    );
  }

  // — Le choix manuel, en cascade, dans une feuille du bas —

  Future<void> _ouvrirManuel() async {
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: ChapColors.cream,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _FeuilleLieu(
        depart: _lieu,
        onApply: (l) {
          Navigator.pop(ctx);
          _appliquer(l);
        },
      ),
    );
  }
}

/// La feuille de choix Région → Ville → Commune.
class _FeuilleLieu extends StatefulWidget {
  final Lieu depart;
  final ValueChanged<Lieu> onApply;
  const _FeuilleLieu({required this.depart, required this.onApply});

  @override
  State<_FeuilleLieu> createState() => _FeuilleLieuState();
}

enum _Etape { region, ville, commune }

class _FeuilleLieuState extends State<_FeuilleLieu> {
  _Etape _etape = _Etape.region;
  String? _regionId;
  String? _cityId;

  @override
  void initState() {
    super.initState();
    _regionId = widget.depart.regionId;
    _cityId = widget.depart.cityId;
  }

  @override
  Widget build(BuildContext context) {
    final region = regionById(_regionId);
    final city = cityById(_cityId);
    final titre = _etape == _Etape.region
        ? 'Choisir une région'
        : _etape == _Etape.ville
            ? (region?.name ?? 'Ville')
            : (city?.name ?? 'Commune');

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: ChapColors.line2,
                      borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
                child: Row(
                  children: [
                    if (_etape != _Etape.region)
                      IconButton(
                        onPressed: () => setState(() => _etape =
                            _etape == _Etape.commune
                                ? _Etape.ville
                                : _Etape.region),
                        icon: const Icon(Icons.arrow_back),
                        color: ChapColors.orange,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    if (_etape != _Etape.region) const SizedBox(width: 10),
                    Expanded(
                      child: Text('📍  $titre',
                          style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: ChapColors.gray900)),
                    ),
                  ],
                ),
              ),
              Flexible(child: _corps(region, city)),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _corps(Region? region, City? city) {
    switch (_etape) {
      case _Etape.region:
        return _etapeRegion();
      case _Etape.ville:
        return _etapeVille(region);
      case _Etape.commune:
        return _etapeCommune(city);
    }
  }

  Widget _etapeRegion() {
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      children: [
        for (final d in districts) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(2, 12, 2, 6),
            child: Text(d.toUpperCase(),
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: ChapColors.gray600)),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ChapColors.line2),
            ),
            child: Column(
              children: [
                for (final r in regions.where((r) => r.district == d))
                  _ligne(r.name, onTap: () {
                    setState(() {
                      _regionId = r.id;
                      _cityId = null;
                      _etape = _Etape.ville;
                    });
                  }),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _etapeVille(Region? region) {
    final villes = citiesByRegion(_regionId);
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      children: [
        _lignePleine('Toute la région ${region?.name ?? ''}'.trim(),
            onTap: () => widget.onApply(Lieu(regionId: _regionId))),
        const SizedBox(height: 8),
        if (villes.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text('Aucune ville référencée pour cette région.',
                  style: TextStyle(color: ChapColors.gray600)),
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: ChapColors.line2),
            ),
            child: Column(
              children: [
                for (final v in villes)
                  _ligne(v.name,
                      chevron: v.communes != null && v.communes!.isNotEmpty,
                      onTap: () {
                    if (v.communes != null && v.communes!.isNotEmpty) {
                      setState(() {
                        _cityId = v.id;
                        _etape = _Etape.commune;
                      });
                    } else {
                      widget.onApply(Lieu(regionId: _regionId, cityId: v.id));
                    }
                  }),
              ],
            ),
          ),
      ],
    );
  }

  Widget _etapeCommune(City? city) {
    final communes = city?.communes ?? const <String>[];
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      children: [
        _lignePleine('Toute la ville de ${city?.name ?? ''}'.trim(),
            onTap: () =>
                widget.onApply(Lieu(regionId: _regionId, cityId: _cityId))),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ChapColors.line2),
          ),
          child: Column(
            children: [
              for (final com in communes)
                _ligne(com,
                    onTap: () => widget.onApply(Lieu(
                        regionId: _regionId, cityId: _cityId, commune: com))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _ligne(String texte, {bool chevron = true, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        child: Row(
          children: [
            Expanded(
                child: Text(texte,
                    style: const TextStyle(
                        fontSize: 15, color: ChapColors.gray900))),
            if (chevron)
              const Icon(Icons.chevron_right, size: 20, color: ChapColors.gray600),
          ],
        ),
      ),
    );
  }

  Widget _lignePleine(String texte, {required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: ChapColors.orange.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(texte,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: ChapColors.orangeDark)),
      ),
    );
  }
}
