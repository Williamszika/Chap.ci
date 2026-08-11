import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../notifications.dart';
import '../screens/notifications_screen.dart';
import '../theme.dart';

/// La cloche de l'en-tête : une icône avec la pastille du nombre de non-lues.
/// Elle n'apparaît que pour un compte connecté, et se met à jour toute seule.
class ClocheNotifs extends StatelessWidget {
  const ClocheNotifs({super.key});

  @override
  Widget build(BuildContext context) {
    // Pas de compte : pas de cloche (rien à notifier).
    if (!ApiClient.instance.connecte) return const SizedBox.shrink();
    return AnimatedBuilder(
      animation: Notifications.instance,
      builder: (context, _) {
        final n = Notifications.instance.nonLues;
        return Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none, color: ChapColors.gray700),
              tooltip: 'Notifications',
              onPressed: () async {
                await Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const NotificationsScreen()));
                // De retour de l'écran : le compteur peut avoir changé.
                await Notifications.instance.rafraichirCompte();
              },
            ),
            if (n > 0)
              Positioned(
                right: 4,
                top: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDC2626),
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: ChapColors.cream200, width: 1.5),
                  ),
                  child: Text(
                    n > 99 ? '99+' : '$n',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
