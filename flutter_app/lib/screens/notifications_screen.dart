import 'package:flutter/material.dart';
import '../api/models.dart';
import '../i18n/formats_i18n.dart';
import '../notifications.dart';
import '../i18n/textes.dart';
import '../theme.dart';
import 'admin/demandes_pro_screen.dart';
import 'devenir_pro_screen.dart';
import 'listing_detail_screen.dart';

/// La cloche — la liste des notifications du compte (nouveau message, annonce
/// mise en favori par quelqu'un, rappel…). Ouvrir l'écran les marque comme
/// lues, comme sur le site.
class NotificationsScreen extends StatefulWidget {
  /// Liste d'aperçu (tests / captures) : quand elle est fournie, on l'affiche
  /// telle quelle sans appeler le serveur. En vrai, `null`.
  final List<NotifItem>? apercu;
  const NotificationsScreen({super.key, this.apercu});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _notifs = Notifications.instance;
  // Les non-lues au moment d'ouvrir : on garde leur surbrillance le temps de la
  // visite, même après les avoir marquées lues côté serveur.
  Set<String> _nonLuesOuverture = {};
  bool _ouverture = true;

  @override
  void initState() {
    super.initState();
    if (widget.apercu != null) {
      _notifs.amorcer(widget.apercu!);
      _nonLuesOuverture = widget.apercu!.where((n) => !n.lue).map((n) => n.id).toSet();
      _ouverture = false;
    } else {
      _init();
    }
  }

  Future<void> _init() async {
    await _notifs.charger();
    if (!mounted) return;
    setState(() {
      _nonLuesOuverture = _notifs.liste.where((n) => !n.lue).map((n) => n.id).toSet();
      _ouverture = false;
    });
    // Un court instant pour voir les points, puis on efface le compteur.
    if (_nonLuesOuverture.isNotEmpty) {
      await Future.delayed(const Duration(milliseconds: 400));
      await _notifs.marquerLu();
    }
  }

  Future<void> _ouvrir(NotifItem n) async {
    // Les notifications « Pro » mènent DIRECTEMENT au bon endroit : la
    // demande vers l'écran de décision (l'équipe), le verdict vers l'espace
    // professionnel (le demandeur).
    if (n.type == 'pro_demande') {
      Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => const DemandesProScreen()));
      return;
    }
    if (n.type == 'pro_decision') {
      Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => const DevenirProScreen()));
      return;
    }
    // NOUVEAUTÉ DU SITE. Sans ce cas, la notification s'affichait bien — icône
    // par défaut, titre et explication — mais l'appui ne faisait RIEN : plus
    // bas, `_ouvrir` ne sait traiter qu'un identifiant d'annonce, et une
    // nouveauté n'en porte pas.
    //
    // On lit le `lien` porté par la notification plutôt que le titre : le texte
    // est écrit à la main dans le tableau de bord et changera, le lien non.
    //
    // ⚠️ ON OUVRE L'ÉCRAN NATIF, PAS LE GUIDE — et c'est un choix, pas un
    // raccourci. Sur le site, la notification ouvre `/guide/pro` dont le bouton
    // mène au formulaire ; dans l'app, ce guide s'afficherait en vue web SANS
    // session, et ce bouton tomberait sur un mur de connexion. Pire fin
    // possible pour une invitation.
    // Intercepter ce bouton n'est pas fiable non plus : le site est en
    // HashRouter, passer de `#/guide/pro` à `#/pro` est un changement d'ancre
    // que `onNavigationRequest` ne voit pas.
    // On atterrit donc sur le formulaire — authentifié, natif — où le guide est
    // proposé en tête, à un appui. L'explication reste offerte, la fin est une
    // action au lieu d'une impasse.
    if (n.type == 'nouveaute') {
      if (n.lien.contains('/guide/pro') || n.lien.contains('/pro')) {
        Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => const DevenirProScreen()));
      }
      // Un lien que l'application ne sait pas encore ouvrir ne fait rien de
      // faux : le titre et le corps ont déjà tout dit, et le site reste là.
      return;
    }
    final id = n.annonceId;
    if (id == null) return;
    try {
      final annonce = await Listing.parId(id);
      if (!mounted) return;
      Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ListingDetailScreen(annonce: annonce)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(tr(context, 'notif.plusDispo'))));
      }
    }
  }

  Future<void> _toutEffacer() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: Text(tr(context, 'notif.toutEffacer')),
        content: Text(tr(context, 'notif.toutEffacerCorps')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: Text(tr(context, 'action.annuler'))),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: Text(tr(context, 'notif.effacer'),
                  style: const TextStyle(color: Color(0xFFB91C1C)))),
        ],
      ),
    );
    if (ok == true) await _notifs.effacer();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr(context, 'section.notifications')),
        actions: [
          AnimatedBuilder(
            animation: _notifs,
            builder: (context, _) => _notifs.liste.isEmpty
                ? const SizedBox.shrink()
                : IconButton(
                    icon: const Icon(Icons.delete_sweep_outlined),
                    tooltip: tr(context, 'notif.toutEffacer'),
                    onPressed: _toutEffacer,
                  ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: ChapColors.orange,
        onRefresh: _notifs.charger,
        child: AnimatedBuilder(
          animation: _notifs,
          builder: (context, _) {
            final liste = _notifs.liste;
            if (_ouverture && liste.isEmpty) {
              return const Center(
                  child: CircularProgressIndicator(color: ChapColors.orange));
            }
            if (liste.isEmpty) return _vide();
            return ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 6),
              itemCount: liste.length,
              itemBuilder: (context, i) => _tuile(liste[i]),
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: ChapColors.line),
            );
          },
        ),
      ),
    );
  }

  Widget _vide() {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
        const Icon(Icons.notifications_none, size: 56, color: ChapColors.gray500),
        const SizedBox(height: 12),
        Center(
          child: Text(tr(context, 'notif.aucune'),
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: ChapColors.gray700)),
        ),
        const SizedBox(height: 6),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              tr(context, 'notif.aucuneDetail'),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: ChapColors.gray600),
            ),
          ),
        ),
      ],
    );
  }

  Widget _tuile(NotifItem n) {
    final neuf = _nonLuesOuverture.contains(n.id);
    return Dismissible(
      key: ValueKey(n.id),
      direction: DismissDirection.endToStart,
      background: Container(
        color: const Color(0xFFB91C1C),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete_outline, color: Colors.white),
      ),
      onDismissed: (_) => _notifs.effacer([n.id]),
      child: InkWell(
        onTap: () => _ouvrir(n),
        child: Container(
          color: neuf ? ChapColors.cream100.withValues(alpha: 0.6) : null,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _icone(n.type, neuf),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.titre,
                        style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: neuf ? FontWeight.w700 : FontWeight.w600,
                            color: ChapColors.gray900)),
                    if (n.corps.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(n.corps,
                          style: const TextStyle(
                              fontSize: 13, height: 1.3, color: ChapColors.gray700)),
                    ],
                    const SizedBox(height: 4),
                    Text(tempsEcouleTr(context, n.cree),
                        style: const TextStyle(fontSize: 11.5, color: ChapColors.gray500)),
                  ],
                ),
              ),
              if (neuf)
                Container(
                  margin: const EdgeInsets.only(top: 4, left: 6),
                  width: 9,
                  height: 9,
                  decoration: const BoxDecoration(
                      color: ChapColors.orange, shape: BoxShape.circle),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _icone(String type, bool neuf) {
    IconData ic;
    Color c;
    switch (type) {
      case 'message':
        ic = Icons.chat_bubble_outline;
        c = ChapColors.orange;
        break;
      case 'favorite':
        ic = Icons.favorite_border;
        c = const Color(0xFFDC2626);
        break;
      case 'listing':
      case 'annonce':
        ic = Icons.sell_outlined;
        c = ChapColors.greenDark;
        break;
      // Une nouveauté du site : ni une vente, ni un acheteur. Le glyphe par
      // défaut la noyait dans le reste.
      case 'nouveaute':
        ic = Icons.auto_awesome_outlined;
        c = ChapColors.orange;
        break;
      default:
        ic = Icons.notifications_none;
        c = ChapColors.gray600;
    }
    return Container(
      width: 38,
      height: 38,
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(ic, size: 20, color: c),
    );
  }
}
