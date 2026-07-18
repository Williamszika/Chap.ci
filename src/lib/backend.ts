// Le site est 100 % auto-hébergé sur la base TPE Cloud (backend PHP `server/`).
// Il n'y a plus qu'un seul backend : `isPhp` est donc toujours vrai. La constante
// est conservée pour les nombreux appels `if (isPhp)` du code (fonctions serveur :
// notifications, alertes, deals, suivi…).
export const isPhp = true
