import 'package:flutter/material.dart';

import '../api/models.dart';
import '../api/profil.dart';
import '../i18n/textes.dart';
import '../theme.dart';

/// LA VITRINE DU PROFESSIONNEL, côté application.
///
/// Le portage de ce que le site a reçu le 28/08 : l'en-tête de boutique,
/// l'état d'ouverture, les quatre chiffres choisis pour l'ACHETEUR, et la
/// fiche « à propos » avec la description de l'entreprise et le registre.
///
/// Rien de tout cela n'a demandé une donnée nouvelle au serveur : la
/// description, les sept horaires et l'état du registre partaient déjà dans
/// `GET /profile/{id}`. L'application, comme le site avant elle, ne lisait que
/// le nom et le type.

/* ── Horaires ────────────────────────────────────────────────────────────── */

const _jours = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

/// « 08:00 » → 480. `null` si l'heure est illisible.
int? _enMinutes(String h) {
  final m = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(h.trim());
  if (m == null) return null;
  return int.parse(m.group(1)!) * 60 + int.parse(m.group(2)!);
}

class EtatOuverture {
  final bool ouvert;
  final String phrase;
  const EtatOuverture(this.ouvert, this.phrase);
}

/// L'état de la boutique à l'instant où l'acheteur regarde.
///
/// L'ORDRE DES JOURS, qui a coûté un bogue côté site : le tableau enregistré
/// commence au LUNDI. Ici c'est indolore — `DateTime.weekday` vaut 1 pour
/// lundi et 7 pour dimanche, donc `weekday - 1` tombe juste. En JavaScript,
/// `getDay()` commence au dimanche, et la première version de la vitrine
/// annonçait « Fermé » un vendredi à 17 h sur une boutique ouverte jusqu'à
/// 18 h. Le même code, deux langages, deux conventions.
EtatOuverture? etatOuverture(List<HoraireJour>? horaires, [DateTime? quand]) {
  if (horaires == null || horaires.length != 7) return null;
  final maintenant = quand ?? DateTime.now();
  final jour = maintenant.weekday - 1; // lundi = 0
  final minute = maintenant.hour * 60 + maintenant.minute;
  final auj = horaires[jour];

  if (auj.ouvert) {
    final de = _enMinutes(auj.de);
    final a = _enMinutes(auj.a);
    if (de != null && a != null) {
      if (minute >= de && minute < a) {
        return EtatOuverture(true, 'Ouvert — ferme à ${auj.a}');
      }
      if (minute < de) {
        return EtatOuverture(false, 'Fermé — ouvre à ${auj.de}');
      }
    }
  }

  for (var i = 1; i <= 7; i++) {
    final j = horaires[(jour + i) % 7];
    if (!j.ouvert || _enMinutes(j.de) == null) continue;
    final libelle =
        i == 1 ? 'demain' : _jours[(jour + i) % 7].toLowerCase();
    return EtatOuverture(false, 'Fermé — rouvre $libelle à ${j.de}');
  }
  // Sept jours fermés : la boutique n'a pas d'horaires utiles. On se tait
  // plutôt que d'écrire « fermé pour toujours ».
  return null;
}

/// La pastille verte ou grise.
class PastilleOuverture extends StatelessWidget {
  final EtatOuverture etat;
  const PastilleOuverture({super.key, required this.etat});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        decoration: BoxDecoration(
          color: etat.ouvert
              ? ChapColors.green.withValues(alpha: 0.12)
              : ChapColors.cream100,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          '${etat.ouvert ? '🟢' : '🕘'} ${etat.phrase}',
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: etat.ouvert ? ChapColors.greenDark : ChapColors.gray600),
        ),
      );
}

/// Le tableau des sept jours, avec aujourd'hui mis en avant.
class CarteHoraires extends StatelessWidget {
  final List<HoraireJour> horaires;
  const CarteHoraires({super.key, required this.horaires});

  @override
  Widget build(BuildContext context) {
    final jour = DateTime.now().weekday - 1;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [
            Icon(Icons.schedule_outlined, size: 15, color: ChapColors.orange),
            SizedBox(width: 6),
            Text('Horaires d’ouverture',
                style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: ChapColors.gray900)),
          ]),
          const SizedBox(height: 8),
          for (var i = 0; i < horaires.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(i == jour ? 'Aujourd’hui' : _jours[i],
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              i == jour ? FontWeight.w800 : FontWeight.w500,
                          color: i == jour
                              ? ChapColors.gray900
                              : ChapColors.gray600)),
                  Text(
                    horaires[i].ouvert &&
                            horaires[i].de.isNotEmpty &&
                            horaires[i].a.isNotEmpty
                        ? '${horaires[i].de} – ${horaires[i].a}'
                        : 'Fermé',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight:
                            i == jour ? FontWeight.w800 : FontWeight.w500,
                        color: !horaires[i].ouvert
                            ? ChapColors.gray500
                            : i == jour
                                ? ChapColors.greenDark
                                : ChapColors.gray700),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/* ── L'en-tête de boutique ───────────────────────────────────────────────── */

/// La bannière et le logo, le nom, le type et le secteur.
///
/// L'ancienne version centrait une photo ronde et un nom : la mise en page
/// d'un profil personnel. Une boutique ne se présente pas comme une personne.
class EnTeteVitrine extends StatelessWidget {
  final ProfilPublic profil;
  final String? commune;
  const EnTeteVitrine({super.key, required this.profil, this.commune});

  @override
  Widget build(BuildContext context) {
    final depuis = profil.proDepuis != null
        ? _moisAnnee(context, DateTime.fromMillisecondsSinceEpoch(profil.proDepuis!))
        : null;
    // Le logo DÉBORDE de la bannière : c'est un Stack qui laisse déborder
    // (`Clip.none`), pas un Transform. Un Transform déplace à l'écran mais pas
    // dans la mise en page — il aurait laissé un trou de la hauteur du
    // décalage sous l'en-tête, et un second décalage plus bas l'aurait
    // aggravé. Ici la place est réservée franchement, par un SizedBox.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            SizedBox(
              height: 118,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (profil.proBanniere != null)
                    _image(profil.proBanniere!)
                  else
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [ChapColors.orange, ChapColors.orangeDark],
                        ),
                      ),
                    ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.45),
                          Colors.black.withValues(alpha: 0.05),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    right: 12,
                    top: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text('✓ PROFESSIONNEL',
                          style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 16,
              bottom: -36,
              child: Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: ChapColors.cream100,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.18),
                        blurRadius: 10,
                        offset: const Offset(0, 3)),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: profil.proLogo != null
                    ? _image(profil.proLogo!)
                    : Container(
                        color: ChapColors.orangeDark,
                        alignment: Alignment.center,
                        child: Text(
                            _initiale(profil.proNom ?? profil.nom),
                            style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Colors.white)),
                      ),
              ),
            ),
          ],
        ),
        // La place que le logo occupe hors de la bannière (36), plus le
        // souffle habituel avant le nom.
        const SizedBox(height: 46),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(profil.proNom ?? profil.nom,
                  style: const TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                      color: ChapColors.gray900)),
              if (profil.proType != null || profil.proSecteur != null) ...[
                const SizedBox(height: 2),
                Text(
                  [
                    if (profil.proType != null)
                      tr(context, 'pro.type.${profil.proType}'),
                    if (profil.proSecteur != null) profil.proSecteur!,
                  ].join(' · '),
                  style: const TextStyle(
                      fontSize: 13, color: ChapColors.gray600),
                ),
              ],
              if (commune != null || depuis != null) ...[
                const SizedBox(height: 2),
                Text(
                  [
                    if (commune != null) '📍 $commune',
                    if (depuis != null) 'Professionnel depuis $depuis',
                  ].join(' · '),
                  style: const TextStyle(
                      fontSize: 12, color: ChapColors.gray500),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  /// La première lettre du nom, ou « P » si le nom est vide. `.characters.first`
  /// aurait levé une exception sur une chaîne vide — et un nom vide arrive.
  String _initiale(String nom) {
    final n = nom.trim();
    return n.isEmpty ? 'P' : n[0].toUpperCase();
  }

  /// « août 2026 » — dans la langue de l'utilisateur. On passe par
  /// `MaterialLocalizations`, déjà chargé par `flutter_localizations`, plutôt
  /// que de figer une liste de mois français dans une app à six langues.
  String _moisAnnee(BuildContext context, DateTime d) {
    final l = MaterialLocalizations.of(context);
    return l.formatMonthYear(d);
  }

  Widget _image(String chemin) {
    final src = ImageSource.resoudre(chemin);
    if (src.bytes != null) {
      return Image.memory(src.bytes!, fit: BoxFit.cover);
    }
    if (src.url != null) {
      return Image.network(src.url!,
          fit: BoxFit.cover,
          errorBuilder: (c, e, s) => Container(color: ChapColors.cream100));
    }
    return Container(color: ChapColors.cream100);
  }
}

/* ── Les quatre chiffres ─────────────────────────────────────────────────── */

/// « 2 h », « 25 min » — le délai de réponse dans une case, où la place manque.
String delaiCourt(int secondes) {
  if (secondes < 60) return '< 1 min';
  if (secondes < 3600) return '${(secondes / 60).round()} min';
  if (secondes < 86400) return '${(secondes / 3600).round()} h';
  return '${(secondes / 86400).round()} j';
}

/// « 6 mois », « 2 ans » — l'ancienneté du badge professionnel.
String anciennete(int depuisMs) {
  final mois = ((DateTime.now().millisecondsSinceEpoch - depuisMs) /
          (30.44 * 86400000))
      .round();
  if (mois < 1) return 'ce mois-ci';
  if (mois < 12) return '$mois mois';
  final ans = mois ~/ 12;
  return '$ans an${ans > 1 ? 's' : ''}';
}

class _Chiffre extends StatelessWidget {
  final String valeur;
  final String libelle;
  final bool fort;
  const _Chiffre(
      {required this.valeur, required this.libelle, this.fort = false});

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 9),
          decoration: BoxDecoration(
            color: fort
                ? ChapColors.green.withValues(alpha: 0.08)
                : ChapColors.cream,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: fort
                    ? ChapColors.green.withValues(alpha: 0.25)
                    : ChapColors.line),
          ),
          child: Column(
            children: [
              Text(valeur,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: fort
                          ? ChapColors.greenDark
                          : ChapColors.gray900)),
              const SizedBox(height: 3),
              Text(libelle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                      fontSize: 9.5, height: 1.2, color: ChapColors.gray600)),
            ],
          ),
        ),
      );
}

/// Les quatre chiffres, choisis pour l'ACHETEUR et pas pour le vendeur.
///
/// Le délai de réponse passe en premier et en vert : c'est lui qui déclenche
/// le message. Le nombre de vues, lui, n'a rien à faire ici — c'est un chiffre
/// de vendeur, et une boutique neuve qui affiche « 3 vues » se dessert.
class ChiffresVitrine extends StatelessWidget {
  final int? reponseSecondes;
  final double note;
  final int avis;
  final int ventes;
  final int? depuis;
  const ChiffresVitrine({
    super.key,
    required this.reponseSecondes,
    required this.note,
    required this.avis,
    required this.ventes,
    this.depuis,
  });

  @override
  Widget build(BuildContext context) => IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _Chiffre(
              fort: reponseSecondes != null,
              valeur: reponseSecondes != null
                  ? delaiCourt(reponseSecondes!)
                  : '—',
              libelle: reponseSecondes != null
                  ? 'répond en général'
                  : 'pas encore de contact'),
            const SizedBox(width: 7),
            _Chiffre(
                valeur: avis > 0 ? '★ ${note.toStringAsFixed(1)}' : '—',
                libelle: avis > 0 ? '$avis avis' : 'aucun avis'),
            const SizedBox(width: 7),
            _Chiffre(
                valeur: '$ventes',
                libelle: ventes > 1 ? 'ventes conclues' : 'vente conclue'),
            const SizedBox(width: 7),
            _Chiffre(
                valeur: depuis != null ? anciennete(depuis!) : '—',
                libelle: 'professionnel'),
          ],
        ),
      );
}

/* ── À propos ────────────────────────────────────────────────────────────── */

/// La description de l'ENTREPRISE — et non la biographie personnelle du
/// compte, que l'onglet affichait jusqu'ici. Un professionnel qui avait soigné
/// sa présentation voyait donc un « À propos » vide.
class AProposVitrine extends StatelessWidget {
  final ProfilPublic profil;
  final String? commune;
  const AProposVitrine({super.key, required this.profil, this.commune});

  @override
  Widget build(BuildContext context) {
    final texte = (profil.proDescription?.trim().isNotEmpty ?? false)
        ? profil.proDescription!.trim()
        : (profil.bio?.trim() ?? '');
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ChapColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(profil.proNom ?? profil.nom,
              style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  color: ChapColors.gray900)),
          const SizedBox(height: 6),
          Text(
            texte.isNotEmpty
                ? texte
                : 'Cette boutique n’a pas encore écrit sa présentation.',
            style: TextStyle(
                fontSize: 13.5,
                height: 1.45,
                color: texte.isNotEmpty
                    ? ChapColors.gray700
                    : ChapColors.gray500),
          ),
          if (profil.proRegistreVerifie) ...[
            const SizedBox(height: 12),
            const Divider(height: 1, color: ChapColors.line),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
              decoration: BoxDecoration(
                color: ChapColors.green.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text('✓ Registre vérifié par l’équipe Chap.ci',
                  style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: ChapColors.greenDark)),
            ),
            const SizedBox(height: 6),
            const Text(
              'Le numéro officiel de cette entreprise a été contrôlé au '
              'registre avant l’approbation du compte.',
              style: TextStyle(
                  fontSize: 11.5, height: 1.4, color: ChapColors.gray500),
            ),
          ],
          if (commune != null) ...[
            const SizedBox(height: 10),
            Text('📍 $commune',
                style: const TextStyle(
                    fontSize: 13, color: ChapColors.gray600)),
          ],
        ],
      ),
    );
  }
}
