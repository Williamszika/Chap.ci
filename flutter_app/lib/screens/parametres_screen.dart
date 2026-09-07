import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api/admin.dart';
import '../api/api_client.dart';
import '../api/biometrie.dart';
import '../i18n/langues.dart';
import '../i18n/textes.dart';
import '../liens_site.dart';
import '../theme.dart';
import 'admin/tableau_bord_screen.dart';
import 'devenir_pro_screen.dart';
import 'favoris_screen.dart';
import 'modifier_profil_screen.dart';
import 'mot_de_passe_screen.dart';
import 'securite_2fa_screen.dart';
import 'supprimer_compte_screen.dart';
import 'verifier_email_screen.dart';

/// Paramètres — le point d'entrée unique de tous les réglages du compte.
///
/// Il rassemble ce qui était éparpillé (profil, 2FA, aide, suppression) et
/// branche ce qui existait déjà côté serveur sans écran : les préférences de
/// notifications (`/notifications/prefs`) et le changement de mot de passe
/// (`/auth/password`). Tout revient au même endroit, groupé et lisible.
///
/// Renvoie `true` en se fermant si l'état a changé (déconnexion, suppression)
/// pour que l'écran Compte se redessine.
class ParametresScreen extends StatefulWidget {
  const ParametresScreen({super.key});
  @override
  State<ParametresScreen> createState() => _ParametresScreenState();
}

class _ParametresScreenState extends State<ParametresScreen> {
  String _email = '';
  bool _emailVerifie = false;
  String _proStatut = ''; // '', en_attente, approuve, refuse
  bool _2faActive = false;
  // Le déverrouillage par empreinte / Face ID (07/09/2026).
  bool _bioDispo = false;
  bool _bioActive = false;
  bool _estAdmin = false;
  bool _chargement = true;

  // Préférences de notifications (défauts serveur : tout à vrai).
  bool _notifMessage = true;
  bool _notifFavori = true;
  bool _notifFavoriSuivi = true; // mes favoris : baisse de prix, fin d'annonce
  bool _notifAbonnement = true; // les structures que je suis publient
  // Les mêmes interrupteurs que le site (banc de cohérence du 07/09/2026) :
  // ce que le site laissait couper, l'app le laisse couper aussi.
  bool _notifVente = true;
  bool _notifAvis = true;
  bool _notifNouveaute = true;
  bool _notifSansReponse = true; // rappels du professionnel
  bool _notifEssouffle = true;
  bool _notifBilan = true;
  bool _notifCandidature = true;
  bool _notifStock = true; // stock bas, rupture (07/09/2026)
  bool _notifEmail = true;
  bool _notifPretes = false;
  bool _notifEnvoi = false;
  /// Les réglages n'ont pas pu être lus : ceux affichés sont les valeurs par
  /// défaut, pas forcément les vôtres. On l'écrit sous les interrupteurs.
  bool _notifHorsLigne = false;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  Future<void> _charger() async {
    // Identité + état e-mail.
    try {
      final moi = await ApiClient.instance.moi();
      _email = (moi?['email'] as String?) ?? '';
      _emailVerifie = moi?['emailVerified'] == true;
      _proStatut = (moi?['pro'] is Map)
          ? ((moi!['pro']['status'] as String?) ?? '')
          : '';
    } catch (_) {/* on affiche quand même le reste */}
    // 2FA.
    _2faActive = await ApiClient.instance.statut2FA();
    _bioDispo = await Biometrie.instance.disponible();
    _bioActive = await Biometrie.instance.active();
    // Admin (l'entrée « Tableau de bord » n'apparaît que pour eux).
    try {
      final acces = await AdminApi.verifier();
      _estAdmin = acces.admin;
    } catch (_) {/* pas admin, pas grave */}
    if (mounted) setState(() => _chargement = false);
    _chargerNotifs();
  }

  Future<void> _chargerNotifs() async {
    try {
      final d = await ApiClient.instance.get('/notifications/prefs');
      if (d is Map && mounted) {
        setState(() {
          _notifMessage = d['message'] != false;
          _notifFavori = d['favorite'] != false;
          _notifFavoriSuivi = d['favori_suivi'] != false;
          _notifAbonnement = d['abonnement'] != false;
          _notifVente = d['vente'] != false;
          _notifAvis = d['avis'] != false;
          _notifNouveaute = d['nouveaute'] != false;
          _notifSansReponse = d['sans_reponse'] != false;
          _notifEssouffle = d['essouffle'] != false;
          _notifBilan = d['bilan'] != false;
          _notifCandidature = d['candidature'] != false;
          _notifStock = d['stock'] != false;
          _notifEmail = d['email'] != false;
          _notifPretes = true;
          _notifHorsLigne = false; // lus pour de bon : la mention disparaît
        });
      }
    } catch (_) {
      // Hors ligne : on montre les interrupteurs avec les valeurs par défaut —
      // et ON LE DIT. Sans cette mention, la personne lisait des réglages qui
      // n'étaient pas les siens sans que rien ne le signale (relevé par
      // 🤝 Le Concierge le 07/09/2026).
      if (mounted) {
        setState(() {
          _notifPretes = true;
          _notifHorsLigne = true;
        });
      }
    }
  }

  /// Enregistre les trois préférences d'un coup. En cas d'échec, on revient à
  /// l'état précédent et on prévient — un interrupteur qui ment est pire que pas
  /// d'interrupteur.
  Future<void> _majNotifs(void Function() applique, void Function() annule) async {
    if (_notifEnvoi) return;
    setState(() {
      applique();
      _notifEnvoi = true;
    });
    try {
      await ApiClient.instance.put('/notifications/prefs', {
        'message': _notifMessage,
        'favorite': _notifFavori,
        'favori_suivi': _notifFavoriSuivi,
        'abonnement': _notifAbonnement,
        'vente': _notifVente,
        'avis': _notifAvis,
        'nouveaute': _notifNouveaute,
        'sans_reponse': _notifSansReponse,
        'essouffle': _notifEssouffle,
        'bilan': _notifBilan,
        'candidature': _notifCandidature,
        'stock': _notifStock,
        'email': _notifEmail,
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(annule);
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _notifEnvoi = false);
    }
  }

  Future<void> _ouvrir(Widget ecran) async {
    final r = await Navigator.of(context)
        .push<Object?>(MaterialPageRoute(builder: (_) => ecran));
    if (r == true && mounted) _charger();
  }

  Future<void> _mesFavoris() async {
    await Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const FavorisScreen()));
  }

  /// Partager l'application via la feuille de partage du téléphone.
  /// `sharePositionOrigin` est requis sur iPad, sinon la feuille ne sait pas
  /// d'où s'ancrer (même précaution que le partage d'une annonce).
  Future<void> _partager() async {
    final box = context.findRenderObject() as RenderBox?;
    try {
      await SharePlus.instance.share(ShareParams(
        text: 'Découvrez Chap.ci, le marché en ligne ivoirien — '
            'achetez et vendez près de chez vous : https://chap.ci',
        subject: 'Chap.ci',
        sharePositionOrigin:
            box != null ? box.localToGlobal(Offset.zero) & box.size : null,
      ));
    } catch (_) {/* l'utilisateur a annulé, ou pas d'appli de partage */}
  }

  /// Ouvrir la fiche Play Store pour noter l'application. On tente d'abord
  /// l'appli Play Store (`market://`), puis on se rabat sur le lien web.
  Future<void> _noter() async {
    final market = Uri.parse('market://details?id=ci.chap.app');
    final web =
        Uri.parse('https://play.google.com/store/apps/details?id=ci.chap.app');
    try {
      if (await canLaunchUrl(market)) {
        await launchUrl(market, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (_) {/* on tente le lien web ci-dessous */}
    try {
      await launchUrl(web, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(tr(context, 'param.playErreur'))));
      }
    }
  }

  Future<void> _seDeconnecter() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ChapColors.cream,
        title: Text(tr(context, 'dialog.deconnexion.titre')),
        content: Text(tr(context, 'dialog.deconnexion.corps')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(tr(context, 'action.annuler'))),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(tr(context, 'item.deconnexion'),
                  style: const TextStyle(color: Color(0xFFB42318)))),
        ],
      ),
    );
    if (ok != true) return;
    await ApiClient.instance.seDeconnecter();
    if (mounted) Navigator.of(context).pop(true);
  }

  Future<void> _supprimer() async {
    await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const SupprimerCompteScreen()));
    // Le compte a peut-être été supprimé : on remonte l'info et on ferme.
    if (mounted && !ApiClient.instance.connecte) {
      Navigator.of(context).pop(true);
    }
  }

  /// Choisir la langue de l'application. Le choix bascule toute l'app en direct
  /// (voir `LangueController`) et est mémorisé.
  Future<void> _choisirLangue() async {
    final actuel = LangueController.instance.code;
    final choix = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: ChapColors.cream,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (c) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
              child: Row(
                children: [
                  const Icon(Icons.language, color: ChapColors.orange),
                  const SizedBox(width: 10),
                  Text(tr(context, 'langue.choisir'),
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            for (final l in languesDisponibles)
              ListTile(
                leading: Text(l.drapeau, style: const TextStyle(fontSize: 22)),
                title: Text(l.nom,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                trailing: l.code == actuel
                    ? const Icon(Icons.check, color: ChapColors.orange)
                    : null,
                onTap: () => Navigator.pop(c, l.code),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (choix != null) {
      await LangueController.instance.definir(choix);
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(title: Text(tr(context, 'param.titre'))),
        body: _chargement
            ? const Center(
                child: CircularProgressIndicator(color: ChapColors.orange))
            : ListView(
                  padding: const EdgeInsets.only(bottom: 28),
                  children: [
                    if (_estAdmin) ...[
                      _label(tr(context, 'section.administration')),
                      _groupe([
                        _ligne(
                          icone: Icons.dashboard_outlined,
                          fond: ChapColors.cream100,
                          teinte: ChapColors.orangeDark,
                          titre: tr(context, 'item.tableauBord'),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => const TableauBordScreen())),
                        ),
                      ]),
                    ],

                    _label(tr(context, 'section.monActivite')),
                    _groupe([
                      _ligne(
                        icone: Icons.favorite_border,
                        fond: const Color(0xFFFBE5E1),
                        teinte: const Color(0xFFB42318),
                        titre: tr(context, 'item.mesFavoris'),
                        sous: tr(context, 'item.mesFavoris.sous'),
                        onTap: _mesFavoris,
                      ),
                    ]),

                    _label(tr(context, 'pro.section')),
                    _groupe([
                      _ligne(
                        icone: Icons.workspace_premium_outlined,
                        fond: const Color(0xFFE7F0F8),
                        teinte: const Color(0xFF2E7DB8),
                        titre: _proStatut == 'approuve'
                            ? tr(context, 'pro.approuve')
                            : _proStatut == 'en_attente'
                                ? tr(context, 'pro.enAttente')
                                : _proStatut == 'refuse'
                                    ? tr(context, 'pro.refuse')
                                    : tr(context, 'pro.devenir'),
                        sous: _proStatut == 'en_attente'
                            ? tr(context, 'pro.enAttente.sous')
                            : _proStatut == ''
                                ? tr(context, 'pro.devenir.sous')
                                : null,
                        sousCouleur: _proStatut == 'approuve'
                            ? ChapColors.greenDark
                            : null,
                        onTap: () async {
                          await Navigator.of(context).push(MaterialPageRoute(
                              builder: (_) => const DevenirProScreen()));
                          // Le dossier a pu être déposé : on relit l'état.
                          if (mounted) _charger();
                        },
                      ),
                    ]),

                    _label(tr(context, 'section.compte')),
                    _groupe([
                      _ligne(
                        icone: Icons.person_outline,
                        fond: const Color(0xFFFFEAD1),
                        teinte: const Color(0xFFB4600C),
                        titre: tr(context, 'item.profil'),
                        sous: tr(context, 'item.profil.sous'),
                        onTap: () => _ouvrir(const ModifierProfilScreen()),
                      ),
                      _ligne(
                        icone: Icons.alternate_email,
                        fond: const Color(0xFFE6EEF8),
                        teinte: const Color(0xFF3B5A80),
                        titre: tr(context, 'item.email'),
                        sous: _email.isEmpty
                            ? (_emailVerifie
                                ? tr(context, 'email.confirmee')
                                : tr(context, 'email.aConfirmer'))
                            : '$_email · ${_emailVerifie ? tr(context, 'email.confirmee') : tr(context, 'email.aConfirmer')}',
                        sousCouleur:
                            _emailVerifie ? ChapColors.greenDark : ChapColors.ocreDark,
                        fin: _emailVerifie
                            ? const Icon(Icons.check_circle,
                                size: 20, color: ChapColors.greenDark)
                            : null,
                        onTap: _emailVerifie
                            ? null
                            : () => _ouvrir(const VerifierEmailScreen()),
                      ),
                      _ligne(
                        icone: Icons.lock_outline,
                        fond: const Color(0xFFECE7DE),
                        teinte: const Color(0xFF5B5344),
                        titre: tr(context, 'item.motDePasse'),
                        sous: tr(context, 'action.modifier'),
                        onTap: () => _ouvrir(const MotDePasseScreen()),
                      ),
                      _ligne(
                        icone: Icons.shield_outlined,
                        fond: const Color(0xFFDFF2E8),
                        teinte: ChapColors.greenDark,
                        titre: tr(context, 'item.doubleAuth'),
                        sous: _2faActive ? tr(context, 'etat.activee') : tr(context, 'etat.desactivee'),
                        sousCouleur: _2faActive ? ChapColors.greenDark : null,
                        onTap: () => _ouvrir(const Securite2faScreen()),
                      ),
                      // Empreinte digitale / Face ID (07/09/2026). La ligne
                      // n'apparaît que si le téléphone sait le faire ET qu'une
                      // empreinte y est enregistrée : proposer un réglage qui
                      // ne peut pas marcher est pire que ne rien proposer.
                      if (_bioDispo)
                        _interrupteur(
                          icone: Icons.fingerprint,
                          fond: const Color(0xFFDFF2E8),
                          teinte: ChapColors.greenDark,
                          titre: tr(context, 'bio.titre'),
                          sous: tr(context, 'bio.sous'),
                          valeur: _bioActive,
                          onChange: _basculerBio,
                        ),
                    ]),

                    _label(tr(context, 'section.notifications')),
                    _groupeNotifs(),
                    if (_notifHorsLigne)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(22, 6, 22, 0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.cloud_off_outlined,
                                size: 14, color: ChapColors.gray500),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(tr(context, 'notif.horsLigne'),
                                  style: const TextStyle(
                                      fontSize: 12, color: ChapColors.gray600)),
                            ),
                          ],
                        ),
                      ),
                    // Les rappels du professionnel : seulement pour un compte
                    // Pro approuvé — un particulier n'a ni bilan ni candidatures.
                    if (_notifPretes && _proStatut == 'approuve') ...[
                      _label(tr(context, 'notif.pro')),
                      _groupeNotifsPro(),
                    ],

                    _label(tr(context, 'section.preferences')),
                    _groupe([
                      _ligne(
                        icone: Icons.language,
                        fond: const Color(0xFFECE7DE),
                        teinte: const Color(0xFF5B5344),
                        titre: tr(context, 'item.langue'),
                        sous: LangueController.instance.nomCourant,
                        onTap: _choisirLangue,
                      ),
                    ]),

                    _label(tr(context, 'section.partager')),
                    _groupe([
                      _ligne(
                        icone: Icons.ios_share,
                        fond: const Color(0xFFDFF2E8),
                        teinte: ChapColors.greenDark,
                        titre: tr(context, 'item.partager'),
                        sous: tr(context, 'item.partager.sous'),
                        onTap: _partager,
                      ),
                      _ligne(
                        icone: Icons.star_border,
                        fond: const Color(0xFFFFEAD1),
                        teinte: const Color(0xFFB4600C),
                        titre: tr(context, 'item.noter'),
                        sous: tr(context, 'item.noter.sous'),
                        onTap: _noter,
                      ),
                    ]),

                    _label(tr(context, 'section.aide')),
                    _groupe([
                      _lienSite(Icons.help_outline, tr(context, 'item.aide'), PagesSite.aide),
                      _lienSite(Icons.quiz_outlined, tr(context, 'item.faq'), PagesSite.faq),
                      _lienSite(
                          Icons.mail_outline, tr(context, 'item.contact'), PagesSite.contact),
                      _lienSite(
                          Icons.info_outline, tr(context, 'item.apropos'), PagesSite.aPropos),
                      _lienSite(Icons.description_outlined, tr(context, 'item.conditions'),
                          PagesSite.conditions),
                      _lienSite(Icons.privacy_tip_outlined,
                          tr(context, 'item.confidentialite'), PagesSite.confidentialite),
                    ]),

                    _label(tr(context, 'section.zoneSensible')),
                    _groupe(
                      [
                        _ligne(
                          icone: Icons.logout,
                          fond: const Color(0xFFFBE5E1),
                          teinte: const Color(0xFFB42318),
                          titre: tr(context, 'item.deconnexion'),
                          titreCouleur: const Color(0xFFB42318),
                          fin: const SizedBox.shrink(),
                          onTap: _seDeconnecter,
                        ),
                        _ligne(
                          icone: Icons.delete_outline,
                          fond: const Color(0xFFFBE5E1),
                          teinte: const Color(0xFFB42318),
                          titre: tr(context, 'item.supprimer'),
                          titreCouleur: const Color(0xFFB42318),
                          chevronCouleur: const Color(0xFFB42318),
                          onTap: _supprimer,
                        ),
                      ],
                      bordure: const Color(0xFFF1C9C4),
                    ),
                  ],
                ),
    );
  }

  // --- Notifications : trois interrupteurs branchés sur /notifications/prefs --

  Widget _groupeNotifs() {
    if (!_notifPretes) {
      return _groupe([
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 22),
          child: Center(
              child: SizedBox(
                  height: 22,
                  width: 22,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: ChapColors.orange))),
        ),
      ]);
    }
    return _groupe([
      _interrupteur(
        icone: Icons.chat_bubble_outline,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: tr(context, 'notif.messages'),
        valeur: _notifMessage,
        onChange: (v) => _majNotifs(
            () => _notifMessage = v, () => _notifMessage = !v),
      ),
      _interrupteur(
        icone: Icons.star_border,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: tr(context, 'notif.favoris'),
        valeur: _notifFavori,
        onChange: (v) =>
            _majNotifs(() => _notifFavori = v, () => _notifFavori = !v),
      ),
      // Mes favoris : le prix d'un favori baisse, ou il se termine dans une
      // semaine (chantier 4 du 04/09/2026).
      _interrupteur(
        icone: Icons.favorite_border,
        fond: const Color(0xFFFBEAE7),
        teinte: const Color(0xFFB42318),
        titre: tr(context, 'notif.favorisSuivi'),
        valeur: _notifFavoriSuivi,
        onChange: (v) => _majNotifs(
            () => _notifFavoriSuivi = v, () => _notifFavoriSuivi = !v),
      ),
      // Les structures que je suis (06/09/2026) : une annonce, une offre
      // d'emploi — c'est pour ça qu'on les suit.
      _interrupteur(
        icone: Icons.storefront_outlined,
        fond: const Color(0xFFE4F5EC),
        teinte: const Color(0xFF1E7A4A),
        titre: tr(context, 'notif.abonnement'),
        valeur: _notifAbonnement,
        onChange: (v) => _majNotifs(
            () => _notifAbonnement = v, () => _notifAbonnement = !v),
      ),
      _interrupteur(
        icone: Icons.handshake_outlined,
        fond: const Color(0xFFE4F5EC),
        teinte: const Color(0xFF1E7A4A),
        titre: tr(context, 'notif.vente'),
        sous: tr(context, 'notif.vente.sous'),
        valeur: _notifVente,
        onChange: (v) =>
            _majNotifs(() => _notifVente = v, () => _notifVente = !v),
      ),
      _interrupteur(
        icone: Icons.reviews_outlined,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: tr(context, 'notif.avis'),
        sous: tr(context, 'notif.avis.sous'),
        valeur: _notifAvis,
        onChange: (v) =>
            _majNotifs(() => _notifAvis = v, () => _notifAvis = !v),
      ),
      // Coupable comme les autres, et volontairement : une annonce de
      // nouveauté qu'on ne peut pas éteindre finit par faire éteindre TOUTES
      // les notifications — on perdrait les messages d'acheteurs avec.
      _interrupteur(
        icone: Icons.auto_awesome_outlined,
        fond: const Color(0xFFE6EEF8),
        teinte: const Color(0xFF3B5A80),
        titre: tr(context, 'notif.nouveaute'),
        sous: tr(context, 'notif.nouveaute.sous'),
        valeur: _notifNouveaute,
        onChange: (v) => _majNotifs(
            () => _notifNouveaute = v, () => _notifNouveaute = !v),
      ),
      _interrupteur(
        icone: Icons.mark_email_read_outlined,
        fond: const Color(0xFFE6EEF8),
        teinte: const Color(0xFF3B5A80),
        titre: tr(context, 'notif.email'),
        sous: tr(context, 'notif.email.sous'),
        valeur: _notifEmail,
        onChange: (v) =>
            _majNotifs(() => _notifEmail = v, () => _notifEmail = !v),
      ),
    ]);
  }

  /// Allumer ou éteindre le déverrouillage par empreinte / Face ID.
  ///
  /// Pour ALLUMER, on demande le doigt tout de suite : c'est la seule preuve
  /// que ça marchera à la prochaine ouverture. Un réglage qu'on allume sans
  /// l'essayer, et l'on se retrouve enfermé dehors le lendemain.
  Future<void> _basculerBio(bool v) async {
    if (v) {
      final ok = await Biometrie.instance.demander(tr(context, 'bio.motifActiver'));
      if (!ok) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(tr(context, 'bio.echec'))));
        }
        return;
      }
    }
    await Biometrie.instance.definirActive(v);
    if (mounted) setState(() => _bioActive = v);
  }

  /// Les rappels du professionnel — la moitié utile : « message sans réponse
  /// depuis 24 h » sauve une vente, « bilan du lundi » fait revenir. Mêmes
  /// clés que CASES_PRO sur le site.
  Widget _groupeNotifsPro() {
    return _groupe([
      _interrupteur(
        icone: Icons.timer_outlined,
        fond: const Color(0xFFFBEAE7),
        teinte: const Color(0xFFB42318),
        titre: tr(context, 'notif.sansReponse'),
        sous: tr(context, 'notif.sansReponse.sous'),
        valeur: _notifSansReponse,
        onChange: (v) => _majNotifs(
            () => _notifSansReponse = v, () => _notifSansReponse = !v),
      ),
      _interrupteur(
        icone: Icons.trending_down,
        fond: const Color(0xFFFFEAD1),
        teinte: const Color(0xFFB4600C),
        titre: tr(context, 'notif.essouffle'),
        sous: tr(context, 'notif.essouffle.sous'),
        valeur: _notifEssouffle,
        onChange: (v) => _majNotifs(
            () => _notifEssouffle = v, () => _notifEssouffle = !v),
      ),
      _interrupteur(
        icone: Icons.insights_outlined,
        fond: const Color(0xFFE6EEF8),
        teinte: const Color(0xFF3B5A80),
        titre: tr(context, 'notif.bilan'),
        sous: tr(context, 'notif.bilan.sous'),
        valeur: _notifBilan,
        onChange: (v) =>
            _majNotifs(() => _notifBilan = v, () => _notifBilan = !v),
      ),
      _interrupteur(
        icone: Icons.work_outline,
        fond: const Color(0xFFE4F5EC),
        teinte: const Color(0xFF1E7A4A),
        titre: tr(context, 'notif.candidature'),
        sous: tr(context, 'notif.candidature.sous'),
        valeur: _notifCandidature,
        onChange: (v) => _majNotifs(
            () => _notifCandidature = v, () => _notifCandidature = !v),
      ),
      _interrupteur(
        icone: Icons.inventory_2_outlined,
        fond: const Color(0xFFFBEAE7),
        teinte: const Color(0xFFB42318),
        titre: tr(context, 'notif.stock'),
        sous: tr(context, 'notif.stock.sous'),
        valeur: _notifStock,
        onChange: (v) =>
            _majNotifs(() => _notifStock = v, () => _notifStock = !v),
      ),
    ]);
  }

  // --- Briques d'interface ---------------------------------------------------

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 7),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: ChapColors.gray500)),
      );

  Widget _groupe(List<Widget> enfants, {Color? bordure}) {
    final lignes = <Widget>[];
    for (var i = 0; i < enfants.length; i++) {
      if (i > 0) {
        lignes.add(Divider(
            height: 1,
            thickness: 1,
            color: bordure == null ? ChapColors.line : const Color(0xFFF3D6D1)));
      }
      lignes.add(enfants[i]);
    }
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: ChapColors.cream,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: bordure ?? ChapColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(children: lignes),
    );
  }

  Widget _tuile(IconData icone, Color fond, Color teinte) => Container(
        width: 32,
        height: 32,
        decoration:
            BoxDecoration(color: fond, borderRadius: BorderRadius.circular(9)),
        child: Icon(icone, size: 17, color: teinte),
      );

  Widget _ligne({
    required IconData icone,
    required Color fond,
    required Color teinte,
    required String titre,
    String? sous,
    Color? sousCouleur,
    Color? titreCouleur,
    Color? chevronCouleur,
    Widget? fin,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
        child: Row(
          children: [
            _tuile(icone, fond, teinte),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(titre,
                      style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: titreCouleur ?? ChapColors.gray900)),
                  if (sous != null) ...[
                    const SizedBox(height: 1),
                    Text(sous,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: sousCouleur != null
                                ? FontWeight.w600
                                : FontWeight.w400,
                            color: sousCouleur ?? ChapColors.gray600)),
                  ],
                ],
              ),
            ),
            fin ??
                (onTap != null
                    ? Icon(Icons.chevron_right,
                        size: 20,
                        color: chevronCouleur ?? ChapColors.gray500)
                    : const SizedBox.shrink()),
          ],
        ),
      ),
    );
  }

  Widget _interrupteur({
    required IconData icone,
    required Color fond,
    required Color teinte,
    required String titre,
    String? sous,
    required bool valeur,
    required ValueChanged<bool> onChange,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 5),
      child: Row(
        children: [
          _tuile(icone, fond, teinte),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(titre,
                    style: const TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: ChapColors.gray900)),
                if (sous != null) ...[
                  const SizedBox(height: 1),
                  Text(sous,
                      style: const TextStyle(
                          fontSize: 11.5, color: ChapColors.gray600)),
                ],
              ],
            ),
          ),
          Switch(
            value: valeur,
            activeColor: Colors.white,
            activeTrackColor: ChapColors.orange,
            onChanged: _notifEnvoi ? null : onChange,
          ),
        ],
      ),
    );
  }

  Widget _lienSite(IconData icone, String titre, String route) => _ligne(
        icone: icone,
        fond: const Color(0xFFECE7DE),
        teinte: const Color(0xFF5B5344),
        titre: titre,
        onTap: () => ouvrirPageSite(context, route),
      );
}
