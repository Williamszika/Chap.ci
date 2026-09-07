import 'package:flutter/material.dart';

import '../api/geo.dart';
import '../data/coords.dart';
import '../data/locations.dart';
import '../data/pays.dart';
import '../i18n/textes.dart';
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
///     retombe sur une région / ville / commune connue (position précise gardée) —
///     ou, hors Côte d'Ivoire, sur le pays et la ville dits par le géocodage ;
///   • un choix **manuel** en cascade Région → Ville → Commune (feuille du bas),
///     avec, depuis le 07/09/2026, la porte « Autres pays » : Pays → votre
///     ville écrite en clair.
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
      // Hors Côte d'Ivoire, c'est le code du pays qui décide ; en Côte
      // d'Ivoire, on retombe sur une région / ville / commune connue.
      final resolu = lieuHorsCi(geo?.countryCode, geo?.city) ??
          resolveLocationByName([geo?.suburb, geo?.city, geo?.region]);
      if (resolu != null && resolu.regionId != null) {
        _appliquer(resolu, gps: gps);
      } else {
        // Position captée mais lieu non reconnu : on garde les coordonnées et on
        // invite à préciser à la main.
        setState(() => _gps = gps);
        widget.onChange(ChoixLieu(_lieu, _gps));
        if (mounted) {
          _toast(tr(context, 'lieu.captee'));
        }
      }
    } on GeoRefus catch (e) {
      if (mounted) _toast(e.message);
    } catch (_) {
      if (mounted) {
        _toast(tr(context, 'lieu.gpsErreur'));
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
                            ? tr(context, 'lieu.detection')
                            : tr(context, 'lieu.choisir'),
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
              ? tr(context, 'expl.localisation')
              : a
                  ? tr(context, 'lieu.actualiser')
                  : tr(context, 'lieu.activer')),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(44),
            foregroundColor: ChapColors.orange,
            side: const BorderSide(color: ChapColors.orange),
          ),
        ),
        if (a && _gps != null)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 2),
            child: Text(tr(context, 'lieu.precise'),
                style: const TextStyle(
                    fontSize: 12, color: ChapColors.greenDark)),
          ),
      ],
    );
  }

  Future<void> _ouvrirManuel() async {
    final l = await choisirLieu(context, depart: _lieu);
    if (l != null) _appliquer(l);
  }
}

/// La ligne « Où êtes-vous ? » des écrans d'inscription et de profil : le lieu
/// choisi (ou l'aide « Votre ville, en Côte d'Ivoire ou ailleurs »), et un mot
/// à droite — Choisir / Modifier. Tapoter ouvre la feuille de choix.
class LigneLieu extends StatelessWidget {
  final Lieu lieu;
  final ValueChanged<Lieu> onChange;
  const LigneLieu({super.key, required this.lieu, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final a = lieu.regionId != null;
    return InkWell(
      onTap: () async {
        final l = await choisirLieu(context, depart: lieu);
        if (l != null) onChange(l);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ChapColors.line2),
        ),
        child: Row(
          children: [
            Icon(a && estAutresPays(lieu.regionId)
                    ? Icons.public
                    : Icons.place_outlined,
                size: 19, color: ChapColors.orange),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                a
                    ? locationLabel(lieu.regionId, lieu.cityId, lieu.commune)
                    : tr(context, 'insc.ouAide'),
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: a ? FontWeight.w600 : FontWeight.w400,
                  color: a ? ChapColors.gray900 : ChapColors.gray600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(tr(context, a ? 'insc.ouModifier' : 'insc.ouChoisir'),
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: ChapColors.orangeDark)),
          ],
        ),
      ),
    );
  }
}

/// Ouvre la feuille Région → Ville → Commune (ou Pays → ville) et rend le
/// lieu choisi — null si la personne referme sans choisir. Sert à « Publier »,
/// à l'inscription et à « Modifier mon profil ».
Future<Lieu?> choisirLieu(BuildContext context,
    {Lieu depart = const Lieu()}) async {
  Lieu? choisi;
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: ChapColors.cream,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (ctx) => _FeuilleLieu(
      depart: depart,
      onApply: (l) {
        choisi = l;
        Navigator.pop(ctx);
      },
    ),
  );
  return choisi;
}

/// La feuille de choix Région → Ville → Commune, et Pays → ville en clair.
class _FeuilleLieu extends StatefulWidget {
  final Lieu depart;
  final ValueChanged<Lieu> onApply;
  const _FeuilleLieu({required this.depart, required this.onApply});

  @override
  State<_FeuilleLieu> createState() => _FeuilleLieuState();
}

enum _Etape { region, ville, commune, pays, villeLibre }

class _FeuilleLieuState extends State<_FeuilleLieu> {
  _Etape _etape = _Etape.region;
  String? _regionId;
  String? _cityId;
  final _recherche = TextEditingController();
  final _villeLibre = TextEditingController();

  @override
  void initState() {
    super.initState();
    _regionId = widget.depart.regionId;
    _cityId = widget.depart.cityId;
    if (estAutresPays(widget.depart.regionId)) {
      _villeLibre.text = widget.depart.commune ?? '';
    }
  }

  @override
  void dispose() {
    _recherche.dispose();
    _villeLibre.dispose();
    super.dispose();
  }

  void _retour() {
    setState(() {
      switch (_etape) {
        case _Etape.villeLibre:
          _etape = _Etape.pays;
        case _Etape.commune:
          _etape = _Etape.ville;
        case _Etape.pays:
        case _Etape.ville:
        case _Etape.region:
          _etape = _Etape.region;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final region = regionById(_regionId);
    final city = cityById(_cityId);
    final paysChoisi = paysParId(_cityId);
    final horsCi = _etape == _Etape.pays || _etape == _Etape.villeLibre;
    final titre = switch (_etape) {
      _Etape.region => tr(context, 'lieu.choisirRegion'),
      _Etape.ville => region?.name ?? tr(context, 'lieu.ville'),
      _Etape.commune => city?.name ?? tr(context, 'lieu.commune'),
      _Etape.pays => tr(context, 'lieu.choisirPays'),
      _Etape.villeLibre => paysChoisi?.nom ?? tr(context, 'lieu.ville'),
    };

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
                        onPressed: _retour,
                        icon: const Icon(Icons.arrow_back),
                        color: ChapColors.orange,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    if (_etape != _Etape.region) const SizedBox(width: 10),
                    Expanded(
                      child: Text('${horsCi ? '🌍' : '📍'}  $titre',
                          style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: ChapColors.gray900)),
                    ),
                  ],
                ),
              ),
              Flexible(child: _corps(region, city, paysChoisi)),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _corps(Region? region, City? city, Pays? paysChoisi) {
    switch (_etape) {
      case _Etape.region:
        return _etapeRegion();
      case _Etape.ville:
        return _etapeVille(region);
      case _Etape.commune:
        return _etapeCommune(city);
      case _Etape.pays:
        return _etapePays();
      case _Etape.villeLibre:
        return _etapeVilleLibre(paysChoisi);
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
                  _ligne(
                      estAutresPays(r.id) ? '🌍  ${r.name}' : r.name,
                      onTap: () {
                    setState(() {
                      _regionId = r.id;
                      _cityId = null;
                      _recherche.clear();
                      _etape =
                          estAutresPays(r.id) ? _Etape.pays : _Etape.ville;
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
        _lignePleine('${tr(context, 'lieu.touteRegion')} ${region?.name ?? ''}'.trim(),
            onTap: () => widget.onApply(Lieu(regionId: _regionId))),
        const SizedBox(height: 8),
        if (villes.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(tr(context, 'lieu.aucuneVille'),
                  style: const TextStyle(color: ChapColors.gray600)),
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
        _lignePleine('${tr(context, 'lieu.touteVille')} ${city?.name ?? ''}'.trim(),
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

  /// Le pays : une recherche, puis les pays par zone — les voisins d'abord.
  Widget _etapePays() {
    final q = _normaliser(_recherche.text.trim());
    final filtres = q.isEmpty
        ? pays
        : pays
            .where((p) =>
                _normaliser(p.nom).contains(q) || p.code.toLowerCase() == q)
            .toList();
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      children: [
        _lignePleine(tr(context, 'lieu.tousPaysHorsCi'),
            onTap: () =>
                widget.onApply(const Lieu(regionId: regionAutresPays))),
        const SizedBox(height: 8),
        TextField(
          controller: _recherche,
          autofocus: true,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: tr(context, 'lieu.chercherPays'),
            prefixIcon: const Icon(Icons.search, size: 20),
            isDense: true,
          ),
        ),
        if (filtres.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Center(
              child: Text(tr(context, 'lieu.aucunPays'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: ChapColors.gray600)),
            ),
          ),
        for (final z in zones)
          if (filtres.any((p) => p.zone == z)) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(2, 12, 2, 6),
              child: Text(z.toUpperCase(),
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
                  for (final p in filtres.where((p) => p.zone == z))
                    _ligne('${drapeau(p.code)}  ${p.nom}', onTap: () {
                      setState(() {
                        _regionId = regionAutresPays;
                        _cityId = idPays(p.code);
                        _etape = _Etape.villeLibre;
                      });
                    }),
                ],
              ),
            ),
          ],
      ],
    );
  }

  /// La ville, en clair : il n'y a pas de liste de villes pour le monde entier.
  Widget _etapeVilleLibre(Pays? p) {
    final ville = _villeLibre.text.trim();
    void valider() => widget.onApply(Lieu(
        regionId: regionAutresPays,
        cityId: _cityId,
        commune: ville.isEmpty ? null : ville));
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      children: [
        Text(
            '${tr(context, 'lieu.votreVille')} ${drapeau(p?.code)} ${p?.nom ?? ''}'
                .trim(),
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: ChapColors.gray700)),
        const SizedBox(height: 8),
        TextField(
          controller: _villeLibre,
          autofocus: true,
          maxLength: 60,
          textCapitalization: TextCapitalization.words,
          autofillHints: const [AutofillHints.addressCity],
          onChanged: (_) => setState(() {}),
          onSubmitted: (_) => valider(),
          decoration: InputDecoration(
            hintText: tr(context, 'lieu.exVille'),
            counterText: '',
          ),
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: valider,
          icon: const Icon(Icons.check, size: 18),
          label: Text(ville.isNotEmpty
              ? '${tr(context, 'lieu.valider')} $ville'
              : '${tr(context, 'lieu.toutLePays')} ${p?.nom ?? ''}'.trim()),
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

String _normaliser(String s) {
  const avec = 'àáâãäçèéêëìíîïñòóôõöùúûüýÿ';
  const sans = 'aaaaacaaaaiiiinoooooquuuuyy';
  final b = StringBuffer();
  for (final ch in s.toLowerCase().split('')) {
    final i = avec.indexOf(ch);
    b.write(i >= 0 ? sans[i] : ch);
  }
  return b.toString();
}
