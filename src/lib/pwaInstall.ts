// =============================================================================
//  Installation de la PWA (« Ajouter à l'écran d'accueil »).
//
//  Chrome/Android émet l'événement `beforeinstallprompt` — souvent AVANT que
//  React ne soit monté. On le capte donc au plus tôt (à l'import de ce module,
//  chargé depuis main.tsx) et on le mémorise, pour pouvoir déclencher
//  l'installation quand l'utilisateur clique notre bouton « Installer l'app ».
//
//  iOS/Safari n'émet pas cet événement : on détecte iOS et on affiche à la
//  place les instructions (Partager → Sur l'écran d'accueil).
// =============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Empêche la mini-infobar par défaut : on propose NOTRE bouton à la place.
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

/** Le navigateur propose-t-il l'installation (Android/Chrome) ? */
export function canInstall(): boolean {
  return deferred !== null
}

/** S'abonner aux changements d'état (apparition/disparition du prompt). */
export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Déclenche la vraie boîte d'installation du navigateur. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable'
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome
}

/** App déjà installée / lancée en mode « application » (plein écran). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/** Appareil iOS (iPhone/iPad) : pas de prompt auto → instructions manuelles. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS se présente parfois comme un Mac tactile
    (/Macintosh/.test(ua) && 'ontouchend' in document)
}
