import 'package:flutter/foundation.dart';

/// L'onglet de la barre du bas que quelqu'un demande depuis ailleurs — une
/// notification qui dit « ouvre mon compte », par exemple (07/09/2026).
///
/// La coquille (`AccueilShell`) écoute et saute à l'onglet ; la valeur est
/// remise à null aussitôt, pour qu'une même demande puisse revenir.
///
///   0 Accueil · 1 Explorer · 2 Messages · 3 Compte
final ValueNotifier<int?> ongletRacineDemande = ValueNotifier<int?>(null);

/// Demande l'onglet [i] : la coquille y va dès qu'elle est visible.
void demanderOngletRacine(int i) => ongletRacineDemande.value = i;
